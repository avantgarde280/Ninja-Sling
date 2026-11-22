import Matter from 'matter-js';
import {GROUND_Y, SLING_X, SLING_Y, WORLD_HEIGHT, WORLD_WIDTH} from '../data/levels';
import {NINJA_CLASSES, getSkinById} from '../data/skins';
import type {
  EnemyType,
  HudSnapshot,
  LevelDef,
  MaterialType,
  NinjaType,
  QualityTier,
} from '../types/game';
import {ParticlePool} from './particlePool';
import {soundEngine} from './soundEngine';

export interface BlockEntity {
  id: number;
  kind: 'block';
  material: MaterialType;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  body: Matter.Body;
  hitFlash: number;
}

export interface EnemyEntity {
  id: number;
  kind: 'enemy';
  enemyType: EnemyType;
  radius: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  body: Matter.Body;
  hitFlash: number;
  blinkTimer: number;
}

export interface NinjaEntity {
  id: number;
  kind: 'ninja';
  ninjaType: NinjaType;
  skinId: string;
  radius: number;
  body: Matter.Body;
  isClone: boolean;
  abilityUsed: boolean;
  trail: Array<{x: number; y: number}>;
  squash: number;
}

type EntityMeta = BlockEntity | EnemyEntity | NinjaEntity;

interface MaterialConfig {
  density: number;
  friction: number;
  restitution: number;
  hp: number;
  score: number;
  threshold: number;
  colors: string[];
  particleShape: 'rect' | 'shard' | 'circle';
}

const MATERIAL_SPECS: Record<MaterialType, MaterialConfig> = {
  bamboo: {
    density: 0.0014,
    friction: 0.62,
    restitution: 0.16,
    hp: 38,
    score: 250,
    threshold: 2.2,
    colors: ['#84cc16', '#65a30d', '#bef264'],
    particleShape: 'rect',
  },
  wood: {
    density: 0.0022,
    friction: 0.68,
    restitution: 0.14,
    hp: 68,
    score: 400,
    threshold: 2.8,
    colors: ['#b45309', '#92400e', '#d97706'],
    particleShape: 'rect',
  },
  ice: {
    density: 0.0016,
    friction: 0.18,
    restitution: 0.25,
    hp: 34,
    score: 350,
    threshold: 1.8,
    colors: ['#bae6fd', '#7dd3fc', '#e0f2fe'],
    particleShape: 'shard',
  },
  stone: {
    density: 0.0048,
    friction: 0.8,
    restitution: 0.08,
    hp: 155,
    score: 750,
    threshold: 4.5,
    colors: ['#64748b', '#475569', '#94a3b8'],
    particleShape: 'rect',
  },
  tnt: {
    density: 0.0024,
    friction: 0.72,
    restitution: 0.12,
    hp: 26,
    score: 900,
    threshold: 2.4,
    colors: ['#ef4444', '#f97316', '#fde047'],
    particleShape: 'circle',
  },
};

const ENEMY_SPECS: Record<EnemyType, {radius: number; hp: number; score: number}> = {
  grunt: {radius: 21, hp: 32, score: 2500},
  guard: {radius: 24, hp: 62, score: 4000},
  shogun: {radius: 29, hp: 115, score: 8500},
};

export const SLING_MAX_PULL = 115;
export const MAX_LAUNCH_SPEED = 19.4;
const FIXED_DT_MS = 1000 / 60;
const FIXED_DT_SEC = 1 / 60;

export interface WorldCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onRoundEnd: (result: {
    won: boolean;
    destructionScore: number;
    unusedNinjas: number;
    tntTriggered: boolean;
  }) => void;
}

export class PhysicsWorld {
  readonly engine: Matter.Engine;
  readonly particles: ParticlePool;
  readonly blocks = new Map<number, BlockEntity>();
  readonly enemies = new Map<number, EnemyEntity>();
  readonly ninjas = new Map<number, NinjaEntity>();
  private readonly bodyToEntity = new Map<number, EntityMeta>();

  level: LevelDef;
  equippedSkins: Record<NinjaType, string>;
  qualityTier: QualityTier;
  callbacks: WorldCallbacks;

  score = 0;
  enemiesTotal = 0;
  tntTriggered = false;

  // Turn / Sling state
  queue: NinjaType[] = [];
  loadedNinjaType: NinjaType | null = null;
  isAiming = false;
  aimX = SLING_X;
  aimY = SLING_Y;

  activeFlightNinjas: NinjaEntity[] = [];
  flightElapsed = 0;
  settleTimer = 0;
  levelElapsed = 0;
  roundEnded = false;
  hitstopTimer = 0;

  // Camera state (world coords at viewport center)
  camX = 620;
  camY = 395;
  camZoom = 1;
  camTargetX = 620;
  camTargetY = 395;
  camMode: 'auto' | 'overview' = 'auto';
  manualPanOffset = 0;
  shakeMagnitude = 0;

  private accumulatorMs = 0;
  private fpsSamples = 60;
  private hudEmitTimer = 0;

  constructor(
    level: LevelDef,
    equippedSkins: Record<NinjaType, string>,
    qualityTier: QualityTier,
    callbacks: WorldCallbacks,
  ) {
    this.level = level;
    this.equippedSkins = equippedSkins;
    this.qualityTier = qualityTier;
    this.callbacks = callbacks;
    this.particles = new ParticlePool();

    this.engine = Matter.Engine.create({
      enableSleeping: true,
      positionIterations: 8,
      velocityIterations: 6,
    });
    this.engine.gravity.y = 1.0;
    this.engine.gravity.scale = 0.001;

    this.buildLevel();
    this.bindCollisions();
    this.emitHud();
  }

  destroy(): void {
    Matter.Events.off(this.engine, 'collisionStart');
    Matter.World.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
    this.blocks.clear();
    this.enemies.clear();
    this.ninjas.clear();
    this.bodyToEntity.clear();
  }

  private buildLevel(): void {
    const world = this.engine.world;

    // Static ground slab & invisible left stopper
    const ground = Matter.Bodies.rectangle(WORLD_WIDTH / 2, GROUND_Y + 80, WORLD_WIDTH + 600, 160, {
      isStatic: true,
      friction: 0.9,
      restitution: 0.1,
      label: 'ground',
    });
    const leftWall = Matter.Bodies.rectangle(-80, WORLD_HEIGHT / 2, 160, WORLD_HEIGHT * 2, {
      isStatic: true,
      label: 'wall',
    });
    Matter.World.add(world, [ground, leftWall]);

    // Build fortress blocks
    for (const def of this.level.blocks) {
      const spec = MATERIAL_SPECS[def.material];
      const wx = this.level.fortressOriginX + def.x;
      const wy = GROUND_Y - def.y;

      const body = Matter.Bodies.rectangle(wx, wy, def.w, def.h, {
        density: spec.density,
        friction: spec.friction,
        frictionStatic: 0.85,
        restitution: spec.restitution,
        frictionAir: 0.008,
        slop: 0.01,
        angle: def.angle ?? 0,
        label: `block:${def.material}`,
      });

      const entity: BlockEntity = {
        id: body.id,
        kind: 'block',
        material: def.material,
        w: def.w,
        h: def.h,
        hp: spec.hp,
        maxHp: spec.hp,
        scoreValue: spec.score,
        body,
        hitFlash: 0,
      };
      this.blocks.set(body.id, entity);
      this.bodyToEntity.set(body.id, entity);
      Matter.World.add(world, body);
    }

    // Build enemies
    this.enemiesTotal = this.level.enemies.length;
    for (const def of this.level.enemies) {
      const spec = ENEMY_SPECS[def.type];
      const wx = this.level.fortressOriginX + def.x;
      const wy = GROUND_Y - def.y;

      const body = Matter.Bodies.circle(wx, wy, spec.radius, {
        density: 0.0024,
        friction: 0.65,
        restitution: 0.2,
        frictionAir: 0.01,
        slop: 0.01,
        label: `enemy:${def.type}`,
      });

      const entity: EnemyEntity = {
        id: body.id,
        kind: 'enemy',
        enemyType: def.type,
        radius: spec.radius,
        hp: spec.hp,
        maxHp: spec.hp,
        scoreValue: spec.score,
        body,
        hitFlash: 0,
        blinkTimer: Math.random() * 3.2,
      };
      this.enemies.set(body.id, entity);
      this.bodyToEntity.set(body.id, entity);
      Matter.World.add(world, body);
    }

    // Queue ninjas
    this.queue = [...this.level.ninjas];
    this.loadNextNinja();
  }

  private loadNextNinja(): void {
    if (this.queue.length === 0) {
      this.loadedNinjaType = null;
    } else {
      this.loadedNinjaType = this.queue.shift() ?? null;
    }
    this.aimX = SLING_X;
    this.aimY = SLING_Y;
    this.isAiming = false;
    this.emitHud();
  }

  private bindCollisions(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      // Allow initial 0.45s settling without false structural damage
      if (this.levelElapsed < 0.45) return;

      for (const pair of event.pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        const relVx = bodyA.velocity.x - bodyB.velocity.x;
        const relVy = bodyA.velocity.y - bodyB.velocity.y;
        const relSpeed = Math.hypot(relVx, relVy);

        if (relSpeed < 1.2) continue;

        // Wake nearby sleeping bodies on real impact
        Matter.Sleeping.set(bodyA, false);
        Matter.Sleeping.set(bodyB, false);

        const metaA = this.bodyToEntity.get(bodyA.id);
        const metaB = this.bodyToEntity.get(bodyB.id);

        this.applyCollisionDamage(metaA, bodyB, relSpeed);
        this.applyCollisionDamage(metaB, bodyA, relSpeed);
      }
    });
  }

  private applyCollisionDamage(
    target: EntityMeta | undefined,
    otherBody: Matter.Body,
    relSpeed: number,
  ): void {
    if (!target || target.kind === 'ninja') return;

    const otherMeta = this.bodyToEntity.get(otherBody.id);
    const otherMass = otherBody.isStatic ? 6 : Math.min(8, otherBody.mass);
    const ninjaBonus = otherMeta?.kind === 'ninja' ? 1.45 : 1.0;

    if (target.kind === 'block') {
      const spec = MATERIAL_SPECS[target.material];
      if (relSpeed < spec.threshold) return;

      const damage = (relSpeed - spec.threshold * 0.6) * (3.6 + otherMass * 0.85) * ninjaBonus;
      if (damage <= 1.5) return;

      target.hp -= damage;
      target.hitFlash = 0.14;
      soundEngine.playImpact(target.material, Math.min(1, relSpeed / 14));

      if (target.hp <= 0) {
        this.destroyBlock(target);
      }
      return;
    }

    if (target.kind === 'enemy') {
      if (relSpeed < 1.7) return;
      const damage = (relSpeed - 1.1) * (4.1 + otherMass * 0.8) * ninjaBonus;
      if (damage <= 1.2) return;

      target.hp -= damage;
      target.hitFlash = 0.16;
      if (target.hp <= 0) {
        this.defeatEnemy(target);
      }
    }
  }

  private destroyBlock(block: BlockEntity): void {
    if (!this.blocks.has(block.id)) return;
    this.blocks.delete(block.id);
    this.bodyToEntity.delete(block.id);
    Matter.World.remove(this.engine.world, block.body);

    const {x, y} = block.body.position;
    this.addScore(block.scoreValue, x, y - 10, '#f8fafc');

    if (block.material === 'tnt') {
      this.detonateAt(x, y, 185, 0.24, 150);
      this.tntTriggered = true;
      return;
    }

    const spec = MATERIAL_SPECS[block.material];
    const count = this.qualityTier === 'performance' ? 6 : 13;
    this.particles.spawnBurst(x, y, count, spec.colors, spec.particleShape, 230, 6);
    soundEngine.playBreak(block.material);
    this.shakeMagnitude = Math.max(this.shakeMagnitude, 3.5);
  }

  private defeatEnemy(enemy: EnemyEntity): void {
    if (!this.enemies.has(enemy.id)) return;
    this.enemies.delete(enemy.id);
    this.bodyToEntity.delete(enemy.id);
    Matter.World.remove(this.engine.world, enemy.body);

    const {x, y} = enemy.body.position;
    const isBoss = enemy.enemyType === 'shogun';
    this.addScore(enemy.scoreValue, x, y - 16, '#fde047', isBoss ? 1.35 : 1.1);
    const count = this.qualityTier === 'performance' ? 8 : 18;
    this.particles.spawnBurst(
      x,
      y,
      count,
      isBoss ? ['#fde047', '#ef4444', '#f8fafc'] : ['#a7f3d0', '#f8fafc', '#34d399'],
      'circle',
      240,
      7,
      0.2,
    );
    this.particles.spawnRing(x, y, isBoss ? '#fde047' : '#34d399', enemy.radius, 0.34);
    soundEngine.playEnemyDefeat(isBoss);
    this.shakeMagnitude = Math.max(this.shakeMagnitude, isBoss ? 11 : 6);
    if (isBoss) {
      this.hitstopTimer = 0.055;
    }
    this.emitHud();
  }

  detonateAt(cx: number, cy: number, radius: number, forceMag: number, maxDamage: number): void {
    soundEngine.playExplosion();
    this.shakeMagnitude = Math.max(this.shakeMagnitude, 14);
    this.hitstopTimer = Math.max(this.hitstopTimer, 0.045);

    const burstCount = this.qualityTier === 'performance' ? 14 : 30;
    this.particles.spawnBurst(
      cx,
      cy,
      burstCount,
      ['#fde047', '#f97316', '#ef4444', '#475569'],
      'circle',
      380,
      9,
      0.3,
    );
    this.particles.spawnRing(cx, cy, '#fb923c', 28, 0.42);

    // Collect candidates first because nested TNT chains mutate maps
    const blockList = Array.from(this.blocks.values());
    for (const block of blockList) {
      const dx = block.body.position.x - cx;
      const dy = block.body.position.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;

      const falloff = 1 - dist / radius;
      Matter.Sleeping.set(block.body, false);
      const nx = dist > 0.001 ? dx / dist : 0;
      const ny = dist > 0.001 ? dy / dist : -1;
      Matter.Body.applyForce(block.body, block.body.position, {
        x: nx * forceMag * falloff * block.body.mass * 0.35,
        y: (ny - 0.35) * forceMag * falloff * block.body.mass * 0.35,
      });
      block.hp -= maxDamage * falloff;
      block.hitFlash = 0.16;
      if (block.hp <= 0) {
        this.destroyBlock(block);
      }
    }

    const enemyList = Array.from(this.enemies.values());
    for (const enemy of enemyList) {
      const dx = enemy.body.position.x - cx;
      const dy = enemy.body.position.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;

      const falloff = 1 - dist / radius;
      Matter.Sleeping.set(enemy.body, false);
      const nx = dist > 0.001 ? dx / dist : 0;
      const ny = dist > 0.001 ? dy / dist : -1;
      Matter.Body.applyForce(enemy.body, enemy.body.position, {
        x: nx * forceMag * falloff * enemy.body.mass * 0.4,
        y: (ny - 0.3) * forceMag * falloff * enemy.body.mass * 0.4,
      });
      enemy.hp -= maxDamage * falloff;
      enemy.hitFlash = 0.16;
      if (enemy.hp <= 0) {
        this.defeatEnemy(enemy);
      }
    }
  }

  private addScore(points: number, x: number, y: number, color: string, scale = 1): void {
    this.score += points;
    this.particles.spawnFloatText(x, y, `+${points}`, color, scale);
  }

  startAim(worldX: number, worldY: number): boolean {
    if (this.roundEnded || !this.loadedNinjaType || this.activeFlightNinjas.length > 0) {
      return false;
    }
    const dist = Math.hypot(worldX - SLING_X, worldY - SLING_Y);
    if (dist <= 78) {
      this.isAiming = true;
      this.updateAim(worldX, worldY);
      return true;
    }
    return false;
  }

  updateAim(worldX: number, worldY: number): void {
    if (!this.isAiming) return;
    let dx = worldX - SLING_X;
    let dy = worldY - SLING_Y;
    const dist = Math.hypot(dx, dy);
    if (dist > SLING_MAX_PULL) {
      const scale = SLING_MAX_PULL / dist;
      dx *= scale;
      dy *= scale;
    }
    // Keep pouch above ground
    this.aimX = SLING_X + dx;
    this.aimY = Math.min(GROUND_Y - 26, SLING_Y + dy);
    soundEngine.playStretch(Math.min(1, dist / SLING_MAX_PULL));
  }

  releaseAim(): boolean {
    if (!this.isAiming || !this.loadedNinjaType) {
      this.isAiming = false;
      return false;
    }
    this.isAiming = false;
    const pullX = SLING_X - this.aimX;
    const pullY = SLING_Y - this.aimY;
    const pullDist = Math.hypot(pullX, pullY);

    if (pullDist < 18) {
      this.aimX = SLING_X;
      this.aimY = SLING_Y;
      return false;
    }

    const spec = NINJA_CLASSES[this.loadedNinjaType];
    const speed = (pullDist / SLING_MAX_PULL) * MAX_LAUNCH_SPEED * spec.launchPowerScale;
    const vx = (pullX / pullDist) * speed;
    const vy = (pullY / pullDist) * speed;

    const skinId = this.equippedSkins[this.loadedNinjaType] ?? spec.defaultSkinId;
    const ninja = this.spawnNinjaBody(this.loadedNinjaType, skinId, this.aimX, this.aimY, vx, vy, false);

    this.activeFlightNinjas = [ninja];
    this.flightElapsed = 0;
    this.settleTimer = 0;
    this.camMode = 'auto';
    this.manualPanOffset = 0;

    soundEngine.playLaunch(this.loadedNinjaType);
    this.loadedNinjaType = null;
    this.aimX = SLING_X;
    this.aimY = SLING_Y;
    this.emitHud();
    return true;
  }

  private spawnNinjaBody(
    ninjaType: NinjaType,
    skinId: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    isClone: boolean,
  ): NinjaEntity {
    const spec = NINJA_CLASSES[ninjaType];
    const radius = isClone ? spec.radius * 0.82 : spec.radius;
    const body = Matter.Bodies.circle(x, y, radius, {
      density: spec.density,
      restitution: spec.restitution,
      friction: spec.friction,
      frictionAir: 0.005,
      slop: 0.01,
      label: `ninja:${ninjaType}`,
    });
    Matter.Body.setVelocity(body, {x: vx, y: vy});
    Matter.Body.setAngularVelocity(body, vx * 0.015);

    const entity: NinjaEntity = {
      id: body.id,
      kind: 'ninja',
      ninjaType,
      skinId,
      radius,
      body,
      isClone,
      abilityUsed: isClone,
      trail: [],
      squash: 0,
    };

    this.ninjas.set(body.id, entity);
    this.bodyToEntity.set(body.id, entity);
    Matter.World.add(this.engine.world, body);
    return entity;
  }

  activateMidAirAbility(): boolean {
    if (this.roundEnded || this.activeFlightNinjas.length === 0) return false;
    const primary = this.activeFlightNinjas[0];
    if (!primary || primary.abilityUsed) return false;

    primary.abilityUsed = true;
    const {x, y} = primary.body.position;
    const {x: vx, y: vy} = primary.body.velocity;
    const skin = getSkinById(primary.skinId);

    soundEngine.playAbility(primary.ninjaType);
    this.particles.spawnRing(x, y, skin.palette.ribbon, primary.radius, 0.32);

    if (primary.ninjaType === 'shinobi') {
      // Shadow Dash: high-speed forward burst
      const speed = Math.max(8, Math.hypot(vx, vy));
      const nx = vx >= 0 ? Math.max(0.82, vx / speed) : vx / speed;
      const ny = (vy / speed) * 0.35;
      Matter.Body.setVelocity(primary.body, {x: nx * 26, y: ny * 16});
      this.particles.spawnBurst(x, y, 12, [skin.palette.accent, skin.palette.ribbon, '#f8fafc'], 'rect', 180, 5, 0.1);
      primary.squash = 0.35;
    } else if (primary.ninjaType === 'kunoichi') {
      // Shuriken Split: spawn 2 clones fanning above & below
      const baseAngle = Math.atan2(vy, vx);
      const speed = Math.max(12, Math.hypot(vx, vy) * 1.12);
      const angles = [baseAngle - 0.28, baseAngle + 0.28];
      for (const ang of angles) {
        const clone = this.spawnNinjaBody(
          'kunoichi',
          primary.skinId,
          x,
          y,
          Math.cos(ang) * speed,
          Math.sin(ang) * speed,
          true,
        );
        this.activeFlightNinjas.push(clone);
      }
      this.particles.spawnBurst(x, y, 14, [skin.palette.ribbon, '#f8fafc'], 'shard', 210, 5, 0.15);
    } else if (primary.ninjaType === 'oni_buster') {
      // Thunder Smoke Blast: radial explosion + upward recoil
      this.detonateAt(x, y, 175, 0.28, 135);
      Matter.Body.setVelocity(primary.body, {x: vx * 0.45, y: -6.5});
    } else if (primary.ninjaType === 'tengu') {
      // Meteor Dive: supersonic straight downward slam
      Matter.Body.setVelocity(primary.body, {x: vx * 0.25, y: 27});
      this.particles.spawnBurst(x, y, 12, [skin.palette.accent, '#f8fafc'], 'shard', 200, 5, 0.1);
      primary.squash = 0.4;
    }

    this.emitHud();
    return true;
  }

  skipSettlingTurn(): void {
    if (this.activeFlightNinjas.length === 0 || this.roundEnded) return;
    if (this.flightElapsed < 0.7) return;
    this.finishFlightTurn();
  }

  toggleCameraOverview(): void {
    this.camMode = this.camMode === 'auto' ? 'overview' : 'auto';
    this.manualPanOffset = 0;
    this.emitHud();
  }

  panCamera(deltaX: number): void {
    this.manualPanOffset = Math.max(-280, Math.min(480, this.manualPanOffset + deltaX));
  }

  step(rawDtSeconds: number): void {
    if (this.roundEnded) {
      this.particles.update(Math.min(rawDtSeconds, 0.05));
      this.shakeMagnitude *= Math.pow(0.05, Math.min(rawDtSeconds, 0.05));
      return;
    }

    const clampedDt = Math.min(rawDtSeconds, 0.05);
    if (clampedDt > 0.0001) {
      const instFps = 1 / clampedDt;
      this.fpsSamples = this.fpsSamples * 0.9 + instFps * 0.1;
    }

    // Hitstop freeze for heavy impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= clampedDt;
      this.particles.update(clampedDt * 0.25);
      this.shakeMagnitude *= Math.pow(0.08, clampedDt);
      return;
    }

    this.levelElapsed += clampedDt;
    this.accumulatorMs += clampedDt * 1000;

    let substeps = 0;
    while (this.accumulatorMs >= FIXED_DT_MS && substeps < 4) {
      Matter.Engine.update(this.engine, FIXED_DT_MS);
      this.accumulatorMs -= FIXED_DT_MS;
      substeps++;
    }

    this.particles.update(clampedDt);
    this.shakeMagnitude *= Math.pow(0.02, clampedDt);
    if (this.shakeMagnitude < 0.15) this.shakeMagnitude = 0;

    // Update entity timers & bounds cleanup
    for (const block of this.blocks.values()) {
      if (block.hitFlash > 0) block.hitFlash = Math.max(0, block.hitFlash - clampedDt);
      if (block.body.position.x > WORLD_WIDTH + 180 || block.body.position.y > GROUND_Y + 200) {
        this.destroyBlock(block);
      }
    }

    for (const enemy of this.enemies.values()) {
      if (enemy.hitFlash > 0) enemy.hitFlash = Math.max(0, enemy.hitFlash - clampedDt);
      enemy.blinkTimer -= clampedDt;
      if (enemy.blinkTimer <= -0.14) {
        enemy.blinkTimer = 2.4 + Math.random() * 2.5;
      }
      if (
        enemy.body.position.x > WORLD_WIDTH + 120 ||
        enemy.body.position.x < -120 ||
        enemy.body.position.y > GROUND_Y + 120
      ) {
        this.defeatEnemy(enemy);
      }
    }

    // Track active flying ninjas
    if (this.activeFlightNinjas.length > 0) {
      this.flightElapsed += clampedDt;
      let anyMoving = false;
      for (const ninja of this.activeFlightNinjas) {
        if (ninja.squash > 0) ninja.squash = Math.max(0, ninja.squash - clampedDt * 2.2);
        const speed = Math.hypot(ninja.body.velocity.x, ninja.body.velocity.y);
        if (speed > 0.45 && ninja.body.position.x < WORLD_WIDTH + 140) {
          anyMoving = true;
        }
        // Record trail every frame while fast
        if (speed > 2.2 && (ninja.trail.length === 0 || Math.hypot(
          ninja.body.position.x - ninja.trail[ninja.trail.length - 1].x,
          ninja.body.position.y - ninja.trail[ninja.trail.length - 1].y,
        ) > 10)) {
          ninja.trail.push({x: ninja.body.position.x, y: ninja.body.position.y});
          if (ninja.trail.length > 24) ninja.trail.shift();
        }
      }

      // Check if any blocks/enemies are still moving significantly
      let worldActive = anyMoving;
      if (!worldActive) {
        for (const block of this.blocks.values()) {
          if (!block.body.isSleeping && Math.hypot(block.body.velocity.x, block.body.velocity.y) > 0.35) {
            worldActive = true;
            break;
          }
        }
      }

      if (!worldActive || this.flightElapsed > 6.5) {
        this.settleTimer += clampedDt;
      } else {
        this.settleTimer = 0;
      }

      if (this.settleTimer >= 0.85 || this.flightElapsed > 9.0) {
        this.finishFlightTurn();
      }
    }

    // Immediate victory check if all enemies defeated & world mostly settled
    if (this.enemies.size === 0 && !this.roundEnded) {
      if (this.activeFlightNinjas.length === 0 || this.settleTimer >= 0.5 || this.flightElapsed > 2.6) {
        this.completeRound(true);
      }
    }

    // Update smooth camera
    this.updateCamera(clampedDt);

    this.hudEmitTimer += clampedDt;
    if (this.hudEmitTimer >= 0.1) {
      this.hudEmitTimer = 0;
      this.emitHud();
    }
  }

  private finishFlightTurn(): void {
    // Keep old ninja bodies in world? Clean up offscreen/spent active list, fade old ninjas gently
    for (const ninja of this.activeFlightNinjas) {
      if (this.ninjas.has(ninja.id)) {
        this.particles.spawnBurst(ninja.body.position.x, ninja.body.position.y, 7, ['#cbd5e1', '#64748b'], 'circle', 100, 4, 0.1);
        this.ninjas.delete(ninja.id);
        this.bodyToEntity.delete(ninja.id);
        Matter.World.remove(this.engine.world, ninja.body);
      }
    }
    this.activeFlightNinjas = [];
    this.flightElapsed = 0;
    this.settleTimer = 0;

    if (this.enemies.size === 0) {
      this.completeRound(true);
      return;
    }

    if (this.queue.length > 0) {
      this.loadNextNinja();
    } else {
      this.loadedNinjaType = null;
      this.completeRound(false);
    }
  }

  private completeRound(won: boolean): void {
    if (this.roundEnded) return;
    this.roundEnded = true;
    const unusedNinjas = this.queue.length + (this.loadedNinjaType ? 1 : 0);
    this.emitHud();
    this.callbacks.onRoundEnd({
      won,
      destructionScore: this.score,
      unusedNinjas: won ? unusedNinjas : 0,
      tntTriggered: this.tntTriggered,
    });
  }

  private updateCamera(dt: number): void {
    if (this.camMode === 'overview') {
      this.camTargetX = 760 + this.manualPanOffset * 0.4;
      this.camTargetY = 400;
      this.camZoom += (0.86 - this.camZoom) * Math.min(1, dt * 5);
    } else if (this.activeFlightNinjas.length > 0) {
      const lead = this.activeFlightNinjas[0].body.position;
      this.camTargetX = Math.max(460, Math.min(1220, lead.x + 120));
      this.camTargetY = Math.max(290, Math.min(420, lead.y * 0.35 + 250));
      this.camZoom += (0.96 - this.camZoom) * Math.min(1, dt * 4);
    } else if (this.isAiming) {
      this.camTargetX = 560;
      this.camTargetY = 415;
      this.camZoom += (1.0 - this.camZoom) * Math.min(1, dt * 5);
    } else {
      this.camTargetX = 680 + this.manualPanOffset;
      this.camTargetY = 405;
      this.camZoom += (0.95 - this.camZoom) * Math.min(1, dt * 4);
    }

    this.camX += (this.camTargetX - this.camX) * Math.min(1, dt * 6);
    this.camY += (this.camTargetY - this.camY) * Math.min(1, dt * 6);
  }

  getPredictedTrajectory(steps = 22): Array<{x: number; y: number}> {
    if (!this.isAiming || !this.loadedNinjaType) return [];
    const pullX = SLING_X - this.aimX;
    const pullY = SLING_Y - this.aimY;
    const pullDist = Math.hypot(pullX, pullY);
    if (pullDist < 18) return [];

    const spec = NINJA_CLASSES[this.loadedNinjaType];
    const speed = (pullDist / SLING_MAX_PULL) * MAX_LAUNCH_SPEED * spec.launchPowerScale;
    let vx = (pullX / pullDist) * speed;
    let vy = (pullY / pullDist) * speed;
    let x = this.aimX;
    let y = this.aimY;

    const airFriction = 0.005;
    const gStep = this.engine.gravity.y * this.engine.gravity.scale * FIXED_DT_MS * FIXED_DT_MS;
    const points: Array<{x: number; y: number}> = [];

    for (let i = 1; i <= steps * 2; i++) {
      vx *= 1 - airFriction;
      vy = vy * (1 - airFriction) + gStep;
      x += vx;
      y += vy;
      if (y > GROUND_Y) break;
      if (i % 2 === 0) {
        points.push({x, y});
      }
    }
    return points;
  }

  private emitHud(): void {
    const primary = this.activeFlightNinjas[0];
    const activeType = primary ? primary.ninjaType : this.loadedNinjaType;
    const activeSkin = activeType ? (this.equippedSkins[activeType] ?? NINJA_CLASSES[activeType].defaultSkinId) : null;

    this.callbacks.onHudUpdate({
      score: this.score,
      enemiesRemaining: this.enemies.size,
      enemiesTotal: this.enemiesTotal,
      activeNinja: activeType,
      activeSkinId: activeSkin,
      queue: [...this.queue],
      inFlight: this.activeFlightNinjas.length > 0,
      abilityAvailable: Boolean(primary && !primary.abilityUsed),
      canSkipTurn: this.activeFlightNinjas.length > 0 && this.flightElapsed >= 0.7,
      cameraMode: this.camMode,
      fps: Math.round(this.fpsSamples),
    });
  }

  getFixedStepSeconds(): number {
    return FIXED_DT_SEC;
  }
}
