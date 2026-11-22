export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  life: number;
  maxLife: number;
  color: string;
  shape: 'rect' | 'shard' | 'circle' | 'ring';
  gravityScale: number;
}

export interface FloatText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  scale: number;
}

const MAX_PARTICLES = 260;
const MAX_FLOATS = 32;

export class ParticlePool {
  readonly particles: Particle[];
  readonly floats: FloatText[];
  private cursor = 0;
  private floatCursor = 0;

  constructor() {
    this.particles = Array.from({length: MAX_PARTICLES}, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      rot: 0,
      vRot: 0,
      life: 0,
      maxLife: 0.5,
      color: '#ffffff',
      shape: 'rect',
      gravityScale: 1,
    }));

    this.floats = Array.from({length: MAX_FLOATS}, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: -40,
      life: 0,
      maxLife: 0.9,
      text: '',
      color: '#fde047',
      scale: 1,
    }));
  }

  clear(): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles[i].active = false;
    }
    for (let i = 0; i < MAX_FLOATS; i++) {
      this.floats[i].active = false;
    }
  }

  spawnBurst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    shape: Particle['shape'],
    speed = 240,
    sizeBase = 6,
    gravityScale = 0.85,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.cursor];
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;

      const angle = Math.random() * Math.PI * 2;
      const mag = (0.3 + Math.random() * 0.85) * speed;

      p.active = true;
      p.x = x + (Math.random() - 0.5) * 10;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * mag;
      p.vy = Math.sin(angle) * mag - 45;
      p.size = sizeBase * (0.65 + Math.random() * 0.8);
      p.rot = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 12;
      p.maxLife = 0.35 + Math.random() * 0.45;
      p.life = p.maxLife;
      p.color = colors[i % colors.length];
      p.shape = shape;
      p.gravityScale = gravityScale;
    }
  }

  spawnRing(x: number, y: number, color: string, size = 24, maxLife = 0.36): void {
    const p = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.size = size;
    p.rot = 0;
    p.vRot = 0;
    p.maxLife = maxLife;
    p.life = maxLife;
    p.color = color;
    p.shape = 'ring';
    p.gravityScale = 0;
  }

  spawnFloatText(x: number, y: number, text: string, color = '#fde047', scale = 1): void {
    const f = this.floats[this.floatCursor];
    this.floatCursor = (this.floatCursor + 1) % MAX_FLOATS;
    f.active = true;
    f.x = x;
    f.y = y;
    f.vy = -52;
    f.maxLife = 0.9;
    f.life = 0.9;
    f.text = text;
    f.color = color;
    f.scale = scale;
  }

  update(dt: number): void {
    const g = 740 * dt;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      if (p.shape === 'ring') {
        p.size += 360 * dt;
        continue;
      }
      p.vy += g * p.gravityScale;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vRot * dt;
    }

    for (let i = 0; i < MAX_FLOATS; i++) {
      const f = this.floats[i];
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.y += f.vy * dt;
      f.vy *= 0.96;
    }
  }
}
