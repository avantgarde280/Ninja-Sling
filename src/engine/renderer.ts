import {GROUND_Y, SLING_X, SLING_Y, WORLD_WIDTH} from '../data/levels';
import {NINJA_CLASSES, getSkinById} from '../data/skins';
import type {NinjaSkinDef, NinjaType, StageTheme} from '../types/game';
import type {BlockEntity, EnemyEntity, NinjaEntity, PhysicsWorld} from './physicsWorld';

interface ThemeColors {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sunColor: string;
  mountainFar: string;
  mountainNear: string;
  groundTop: string;
  groundBody: string;
}

const THEME_PALETTES: Record<StageTheme, ThemeColors> = {
  bamboo_mist: {
    skyTop: '#162436',
    skyMid: '#264653',
    skyBottom: '#e9c46a',
    sunColor: 'rgba(254, 240, 138, 0.85)',
    mountainFar: '#1e3547',
    mountainNear: '#152736',
    groundTop: '#4d7c0f',
    groundBody: '#292524',
  },
  twilight: {
    skyTop: '#13162b',
    skyMid: '#3b2447',
    skyBottom: '#c2410c',
    sunColor: 'rgba(253, 186, 116, 0.8)',
    mountainFar: '#261e3d',
    mountainNear: '#1a162b',
    groundTop: '#365314',
    groundBody: '#1c1917',
  },
  moonlit_snow: {
    skyTop: '#0f172a',
    skyMid: '#1e3a5f',
    skyBottom: '#64748b',
    sunColor: 'rgba(226, 232, 240, 0.9)',
    mountainFar: '#1e293b',
    mountainNear: '#0f172a',
    groundTop: '#e2e8f0',
    groundBody: '#334155',
  },
  crimson_dusk: {
    skyTop: '#1f1024',
    skyMid: '#581c38',
    skyBottom: '#ea580c',
    sunColor: 'rgba(254, 215, 170, 0.85)',
    mountainFar: '#32142c',
    mountainNear: '#210e1e',
    groundTop: '#65a30d',
    groundBody: '#27272a',
  },
  storm_keep: {
    skyTop: '#0b101b',
    skyMid: '#1f2937',
    skyBottom: '#475569',
    sunColor: 'rgba(148, 163, 184, 0.6)',
    mountainFar: '#1e293b',
    mountainNear: '#111827',
    groundTop: '#3f6212',
    groundBody: '#1e293b',
  },
  golden_citadel: {
    skyTop: '#1e1b2e',
    skyMid: '#4c1d4b',
    skyBottom: '#f59e0b',
    sunColor: 'rgba(253, 224, 71, 0.9)',
    mountainFar: '#2d1c3d',
    mountainNear: '#1c1329',
    groundTop: '#84cc16',
    groundBody: '#27272a',
  },
};

export class WorldRenderer {
  private bgCache: HTMLCanvasElement | null = null;
  private cachedTheme: StageTheme | null = null;

  private ensureBackgroundCache(theme: StageTheme): HTMLCanvasElement {
    if (this.bgCache && this.cachedTheme === theme) {
      return this.bgCache;
    }

    const canvas = document.createElement('canvas');
    canvas.width = WORLD_WIDTH + 400;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const pal = THEME_PALETTES[theme];

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, pal.skyTop);
    skyGrad.addColorStop(0.58, pal.skyMid);
    skyGrad.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun / Moon disc
    ctx.fillStyle = pal.sunColor;
    ctx.beginPath();
    ctx.arc(1460, 195, 64, 0, Math.PI * 2);
    ctx.fill();

    // Far Mountain Ridge
    ctx.fillStyle = pal.mountainFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    const farPts = [
      [0, 390],
      [210, 290],
      [430, 360],
      [680, 230],
      [920, 340],
      [1180, 210],
      [1480, 330],
      [1760, 240],
      [2100, 360],
      [2200, GROUND_Y],
    ];
    for (const [px, py] of farPts) ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();

    // Distant Pagoda Silhouette on ridge
    ctx.fillStyle = pal.mountainNear;
    this.drawPagodaSilhouette(ctx, 680, 232, 0.72);
    this.drawPagodaSilhouette(ctx, 1620, 275, 0.9);

    // Near Mountain Ridge
    ctx.fillStyle = pal.mountainNear;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    const nearPts = [
      [0, 480],
      [190, 410],
      [480, 470],
      [780, 385],
      [1050, 465],
      [1360, 375],
      [1680, 455],
      [2200, 430],
      [2200, GROUND_Y],
    ];
    for (const [px, py] of nearPts) ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();

    // Ground & grass surface
    ctx.fillStyle = pal.groundBody;
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.fillStyle = pal.groundTop;
    ctx.fillRect(0, GROUND_Y, canvas.width, 16);

    // Subtle stone platform under slingshot
    ctx.fillStyle = '#475569';
    ctx.fillRect(185, GROUND_Y - 8, 110, 12);
    ctx.fillStyle = '#334155';
    ctx.fillRect(195, GROUND_Y - 12, 90, 6);

    this.bgCache = canvas;
    this.cachedTheme = theme;
    return canvas;
  }

  private drawPagodaSilhouette(ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number): void {
    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(s, s);
    for (let tier = 0; tier < 3; tier++) {
      const y = -tier * 28;
      const w = 54 - tier * 10;
      ctx.fillRect(-w * 0.35, y - 20, w * 0.7, 20);
      ctx.beginPath();
      ctx.moveTo(-w * 0.7, y - 16);
      ctx.lineTo(0, y - 32);
      ctx.lineTo(w * 0.7, y - 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(-3, -104, 6, 20);
    ctx.restore();
  }

  getCameraTransform(
    world: PhysicsWorld,
    viewW: number,
    viewH: number,
  ): {scale: number; offsetX: number; offsetY: number} {
    const baseFitScale = Math.min(viewW / 1280, viewH / 640);
    const scale = baseFitScale * world.camZoom;

    const shakeX = world.shakeMagnitude > 0 ? (Math.random() - 0.5) * world.shakeMagnitude * 2 : 0;
    const shakeY = world.shakeMagnitude > 0 ? (Math.random() - 0.5) * world.shakeMagnitude * 2 : 0;

    const offsetX = viewW * 0.5 - world.camX * scale + shakeX;
    const offsetY = viewH * 0.58 - world.camY * scale + shakeY;

    return {scale, offsetX, offsetY};
  }

  render(ctx: CanvasRenderingContext2D, world: PhysicsWorld, viewW: number, viewH: number): void {
    ctx.clearRect(0, 0, viewW, viewH);

    // Fill backdrop edge color
    const pal = THEME_PALETTES[world.level.theme];
    ctx.fillStyle = pal.skyTop;
    ctx.fillRect(0, 0, viewW, viewH);

    const {scale, offsetX, offsetY} = this.getCameraTransform(world, viewW, viewH);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw cached background
    const bg = this.ensureBackgroundCache(world.level.theme);
    ctx.drawImage(bg, -200, -100);

    // Draw waiting ninja queue near slingshot
    this.drawWaitingQueue(ctx, world);

    // Draw slingshot back fork & back band
    this.drawSlingshotBack(ctx, world);

    // Draw trajectory preview if aiming
    if (world.isAiming) {
      this.drawTrajectory(ctx, world);
    }

    // Draw blocks
    for (const block of world.blocks.values()) {
      this.drawBlock(ctx, block);
    }

    // Draw enemies
    for (const enemy of world.enemies.values()) {
      this.drawEnemy(ctx, enemy);
    }

    // Draw loaded ninja in slingshot pouch OR active ninjas in flight
    if (world.loadedNinjaType && !world.roundEnded) {
      const nx = world.isAiming ? world.aimX : SLING_X;
      const ny = world.isAiming ? world.aimY : SLING_Y;
      const spec = NINJA_CLASSES[world.loadedNinjaType];
      const skin = getSkinById(world.equippedSkins[world.loadedNinjaType]);
      const angle = world.isAiming ? Math.atan2(SLING_Y - ny, SLING_X - nx) * 0.35 : 0;
      drawNinjaCharacter(ctx, world.loadedNinjaType, skin, nx, ny, spec.radius, angle, 0);
    }

    for (const ninja of world.ninjas.values()) {
      this.drawNinjaInFlight(ctx, ninja);
    }

    // Draw slingshot front fork & front band
    this.drawSlingshotFront(ctx, world);

    // Draw pooled particles & floating texts
    this.drawParticles(ctx, world);

    ctx.restore();
  }

  private drawWaitingQueue(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
    const startX = SLING_X - 74;
    world.queue.forEach((ninjaType, idx) => {
      const spec = NINJA_CLASSES[ninjaType];
      const skin = getSkinById(world.equippedSkins[ninjaType]);
      const qx = startX - idx * 46;
      const qy = GROUND_Y - spec.radius * 0.85;
      drawNinjaCharacter(ctx, ninjaType, skin, qx, qy, spec.radius * 0.85, 0, 0);
    });
  }

  private drawSlingshotBack(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
    const pouchX = world.isAiming ? world.aimX : SLING_X;
    const pouchY = world.isAiming ? world.aimY : SLING_Y;

    // Back wooden Yumi fork arm
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(SLING_X, GROUND_Y - 10);
    ctx.lineTo(SLING_X, SLING_Y + 34);
    ctx.lineTo(SLING_X + 16, SLING_Y - 6);
    ctx.stroke();

    if (world.loadedNinjaType) {
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(SLING_X + 16, SLING_Y - 4);
      ctx.lineTo(pouchX, pouchY);
      ctx.stroke();
    }
  }

  private drawSlingshotFront(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
    const pouchX = world.isAiming ? world.aimX : SLING_X;
    const pouchY = world.isAiming ? world.aimY : SLING_Y;

    if (world.loadedNinjaType) {
      // Leather pouch
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.arc(pouchX, pouchY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Front band
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(SLING_X - 16, SLING_Y - 2);
      ctx.lineTo(pouchX, pouchY);
      ctx.stroke();
    }

    // Front wooden fork arm
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(SLING_X, GROUND_Y - 10);
    ctx.lineTo(SLING_X, SLING_Y + 34);
    ctx.lineTo(SLING_X - 16, SLING_Y - 4);
    ctx.stroke();
  }

  private drawTrajectory(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
    const pts = world.getPredictedTrajectory(20);
    for (let i = 0; i < pts.length; i++) {
      const alpha = Math.max(0.15, 0.9 - i * 0.04);
      const r = Math.max(2.5, 5.5 - i * 0.16);
      ctx.fillStyle = `rgba(248, 250, 252, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBlock(ctx: CanvasRenderingContext2D, block: BlockEntity): void {
    const {x, y} = block.body.position;
    const angle = block.body.angle;
    const hw = block.w * 0.5;
    const hh = block.h * 0.5;
    const dmgRatio = 1 - Math.max(0, block.hp) / block.maxHp;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (block.material === 'bamboo') {
      ctx.fillStyle = block.hitFlash > 0 ? '#ecfccb' : '#65a30d';
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 2;
      ctx.fillRect(-hw, -hh, block.w, block.h);
      ctx.strokeRect(-hw, -hh, block.w, block.h);

      // Bamboo joint rings
      ctx.strokeStyle = '#bef264';
      ctx.lineWidth = 2;
      if (block.h > block.w) {
        ctx.beginPath();
        ctx.moveTo(-hw + 2, 0);
        ctx.lineTo(hw - 2, 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -hh + 2);
        ctx.lineTo(0, hh - 2);
        ctx.stroke();
      }
    } else if (block.material === 'wood') {
      ctx.fillStyle = block.hitFlash > 0 ? '#fef3c7' : '#b45309';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.fillRect(-hw, -hh, block.w, block.h);
      ctx.strokeRect(-hw, -hh, block.w, block.h);

      // Inner wood grain highlight
      ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
      ctx.fillRect(-hw + 3, -hh + 3, block.w - 6, Math.max(3, block.h * 0.28));
    } else if (block.material === 'ice') {
      ctx.fillStyle = block.hitFlash > 0 ? '#ffffff' : 'rgba(125, 211, 252, 0.72)';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.fillRect(-hw, -hh, block.w, block.h);
      ctx.strokeRect(-hw, -hh, block.w, block.h);

      // Diagonal glass highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hw + 4, -hh + 6);
      ctx.lineTo(hw - 4, hh - 6);
      ctx.stroke();
    } else if (block.material === 'stone') {
      ctx.fillStyle = block.hitFlash > 0 ? '#e2e8f0' : '#64748b';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-hw, -hh, block.w, block.h);
      ctx.strokeRect(-hw, -hh, block.w, block.h);

      // Stone bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(-hw + 2, -hh + 2, block.w - 4, 5);
    } else if (block.material === 'tnt') {
      ctx.fillStyle = block.hitFlash > 0 ? '#fef08a' : '#b91c1c';
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-hw, -hh, block.w, block.h);
      ctx.strokeRect(-hw, -hh, block.w, block.h);

      // Warning band
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-hw + 2, -9, block.w - 4, 18);
      ctx.fillStyle = '#450a0a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 0, 1);
    }

    // Damage cracks
    if (dmgRatio > 0.35 && block.material !== 'tnt') {
      ctx.strokeStyle = block.material === 'ice' ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.75)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.45, -hh * 0.3);
      ctx.lineTo(0, 0);
      ctx.lineTo(hw * 0.4, -hh * 0.2);
      if (dmgRatio > 0.65) {
        ctx.moveTo(0, 0);
        ctx.lineTo(-hw * 0.2, hh * 0.5);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity): void {
    const {x, y} = enemy.body.position;
    const r = enemy.radius;
    const dmgRatio = 1 - Math.max(0, enemy.hp) / enemy.maxHp;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(enemy.body.angle);

    // Body circle (Oni / Clan Dummy)
    const bodyColor =
      enemy.hitFlash > 0
        ? '#fef08a'
        : enemy.enemyType === 'shogun'
          ? '#991b1b'
          : enemy.enemyType === 'guard'
            ? '#334155'
            : '#4d7c0f';

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Helmet / Horns for Guard & Shogun
    if (enemy.enemyType === 'guard' || enemy.enemyType === 'shogun') {
      ctx.fillStyle = enemy.enemyType === 'shogun' ? '#fbbf24' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 0.96, Math.PI * 1.08, Math.PI * 1.92);
      ctx.fill();

      if (enemy.enemyType === 'shogun') {
        // Golden Samurai Crescent Horns
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(-r * 0.35, -r * 0.78);
        ctx.lineTo(-r * 0.8, -r * 1.38);
        ctx.lineTo(-r * 0.08, -r * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r * 0.35, -r * 0.78);
        ctx.lineTo(r * 0.8, -r * 1.38);
        ctx.lineTo(r * 0.08, -r * 0.85);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Face / Eyes
    const blinking = enemy.blinkTimer < 0;
    ctx.fillStyle = '#f8fafc';
    if (blinking) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.48, -r * 0.05);
      ctx.lineTo(-r * 0.16, -r * 0.05);
      ctx.moveTo(r * 0.16, -r * 0.05);
      ctx.lineTo(r * 0.48, -r * 0.05);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.05, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.32, -r * 0.05, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.05, r * 0.07, 0, Math.PI * 2);
      ctx.arc(r * 0.34, -r * 0.05, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }

    // Angry brows / bruised frown
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.28);
    ctx.lineTo(-r * 0.14, -r * 0.18);
    ctx.moveTo(r * 0.5, -r * 0.28);
    ctx.lineTo(r * 0.14, -r * 0.18);
    ctx.stroke();

    // Mouth
    ctx.beginPath();
    if (dmgRatio > 0.4) {
      ctx.arc(0, r * 0.45, r * 0.24, Math.PI * 1.15, Math.PI * 1.85);
    } else {
      ctx.moveTo(-r * 0.25, r * 0.36);
      ctx.lineTo(r * 0.25, r * 0.36);
    }
    ctx.stroke();

    ctx.restore();

    // Compact health bar above damaged enemies
    if (dmgRatio > 0.05) {
      const bw = r * 1.8;
      const bx = x - bw * 0.5;
      const by = y - r - 14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = dmgRatio > 0.6 ? '#ef4444' : '#f59e0b';
      ctx.fillRect(bx + 1, by + 1, (bw - 2) * (1 - dmgRatio), 3);
    }
  }

  private drawNinjaInFlight(ctx: CanvasRenderingContext2D, ninja: NinjaEntity): void {
    const skin = getSkinById(ninja.skinId);

    // Motion trail
    if (ninja.trail.length > 1) {
      for (let i = 0; i < ninja.trail.length; i++) {
        const pt = ninja.trail[i];
        const ratio = (i + 1) / ninja.trail.length;
        ctx.fillStyle = skin.palette.trail;
        ctx.globalAlpha = ratio * 0.45;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, ninja.radius * 0.36 * ratio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    drawNinjaCharacter(
      ctx,
      ninja.ninjaType,
      skin,
      ninja.body.position.x,
      ninja.body.position.y,
      ninja.radius,
      ninja.body.angle,
      ninja.squash,
    );
  }

  private drawParticles(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
    const parts = world.particles.particles;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'shard') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.6, p.size * 0.6);
          ctx.lineTo(-p.size * 0.6, p.size * 0.4);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size * 0.7, -p.size * 0.35, p.size * 1.4, p.size * 0.7);
        }
      }
      ctx.restore();
    }

    const floats = world.particles.floats;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      if (!f.active) continue;
      const alpha = Math.min(1, (f.life / f.maxLife) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${Math.round(17 * f.scale)}px "JetBrains Mono", monospace`;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }
}

/**
 * Shared procedural ninja character renderer used both in the live game canvas
 * and inside the Skin Armory preview canvas so cosmetic appearances match 1:1.
 */
export function drawNinjaCharacter(
  ctx: CanvasRenderingContext2D,
  ninjaType: NinjaType,
  skin: NinjaSkinDef,
  x: number,
  y: number,
  r: number,
  angle: number,
  squash = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (squash > 0) {
    ctx.scale(1 + squash * 0.4, 1 - squash * 0.25);
  }

  // Trailing headband ribbon
  ctx.fillStyle = skin.palette.ribbon;
  ctx.beginPath();
  ctx.moveTo(-r * 0.65, -r * 0.28);
  ctx.quadraticCurveTo(-r * 1.45, -r * 0.55, -r * 1.72, -r * 0.12);
  ctx.quadraticCurveTo(-r * 1.25, -r * 0.1, -r * 0.68, -r * 0.04);
  ctx.closePath();
  ctx.fill();

  if (ninjaType === 'kunoichi') {
    // Second flowing ribbon for Twin Kunoichi
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.05);
    ctx.quadraticCurveTo(-r * 1.38, r * 0.25, -r * 1.62, r * 0.48);
    ctx.quadraticCurveTo(-r * 1.12, r * 0.22, -r * 0.62, r * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  // Tengu winged cloak silhouette
  if (ninjaType === 'tengu') {
    ctx.fillStyle = skin.palette.cowlShadow;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.85);
    ctx.lineTo(-r * 1.32, -r * 0.15);
    ctx.lineTo(-r * 0.85, r * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  // Main Ninja Cowl / Head sphere
  ctx.fillStyle = skin.palette.cowl;
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lower cowl shadow crescent
  ctx.fillStyle = skin.palette.cowlShadow;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1.5, 0.25, Math.PI - 0.15);
  ctx.fill();

  // Oni-Buster armor forehead plate & crest horns
  if (ninjaType === 'oni_buster') {
    ctx.fillStyle = skin.palette.crest;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.72);
    ctx.lineTo(-r * 0.75, -r * 1.25);
    ctx.lineTo(-r * 0.14, -r * 0.86);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r * 0.42, -r * 0.72);
    ctx.lineTo(r * 0.75, -r * 1.25);
    ctx.lineTo(r * 0.14, -r * 0.86);
    ctx.closePath();
    ctx.fill();
  }

  // Headband strap
  ctx.fillStyle = skin.palette.accent;
  ctx.fillRect(-r * 0.92, -r * 0.44, r * 1.84, r * 0.24);

  // Metal forehead crest plate
  ctx.fillStyle = skin.palette.crest;
  ctx.fillRect(-r * 0.26, -r * 0.46, r * 0.52, r * 0.26);

  // Face slit opening
  ctx.fillStyle = skin.palette.mask;
  ctx.beginPath();
  ctx.roundRect(-r * 0.48, -r * 0.18, r * 1.06, r * 0.38, 6);
  ctx.fill();

  // Fierce Ninja Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-r * 0.08, 0, r * 0.13, 0, Math.PI * 2);
  ctx.arc(r * 0.36, 0, r * 0.13, 0, Math.PI * 2);
  ctx.fill();

  // Eye glint
  ctx.fillStyle = skin.palette.eyeGlow;
  ctx.beginPath();
  ctx.arc(-r * 0.04, -r * 0.03, r * 0.055, 0, Math.PI * 2);
  ctx.arc(r * 0.4, -r * 0.03, r * 0.055, 0, Math.PI * 2);
  ctx.fill();

  // Tengu pointed visor beak
  if (ninjaType === 'tengu') {
    ctx.fillStyle = skin.palette.accent;
    ctx.beginPath();
    ctx.moveTo(r * 0.52, -r * 0.12);
    ctx.lineTo(r * 1.24, r * 0.04);
    ctx.lineTo(r * 0.52, r * 0.22);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
