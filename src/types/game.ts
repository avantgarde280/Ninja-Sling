export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER';

export type NinjaType = 'shinobi' | 'kunoichi' | 'oni_buster' | 'tengu';

export type MaterialType = 'bamboo' | 'wood' | 'ice' | 'stone' | 'tnt';

export type EnemyType = 'grunt' | 'guard' | 'shogun';

export type QualityTier = 'auto' | 'performance' | 'high';

export type StageTheme =
  | 'twilight'
  | 'bamboo_mist'
  | 'moonlit_snow'
  | 'crimson_dusk'
  | 'storm_keep'
  | 'golden_citadel';

export interface NinjaSkinDef {
  id: string;
  ninjaType: NinjaType;
  name: string;
  subtitle: string;
  cost: number; // 0 = unlocked by default
  unlockStars?: number; // optional milestone unlock OR purchase with coins
  palette: {
    cowl: string;
    cowlShadow: string;
    mask: string;
    accent: string;
    ribbon: string;
    eyeGlow: string;
    trail: string;
    crest: string;
  };
}

export interface NinjaClassSpec {
  type: NinjaType;
  name: string;
  abilityName: string;
  abilityHint: string;
  radius: number;
  density: number;
  restitution: number;
  friction: number;
  launchPowerScale: number;
  defaultSkinId: string;
}

export interface BlockDef {
  x: number; // relative to fortress origin X
  y: number; // height above ground surface (positive up, center of block)
  w: number;
  h: number;
  material: MaterialType;
  angle?: number;
}

export interface EnemyDef {
  x: number; // relative to fortress origin X
  y: number; // height above ground surface (center)
  type: EnemyType;
}

export interface LevelDef {
  id: number;
  name: string;
  region: string;
  theme: StageTheme;
  description: string;
  ninjas: NinjaType[];
  starThresholds: [number, number, number];
  fortressOriginX: number;
  blocks: BlockDef[];
  enemies: EnemyDef[];
}

export interface LevelProgress {
  bestScore: number;
  stars: number;
  cleared: boolean;
}

export interface CloudSnapshot {
  playerId: string;
  playerName: string;
  coins: number;
  unlockedSkins: string[];
  equippedSkins: Record<NinjaType, string>;
  levelProgress: Record<string, LevelProgress>;
  achievements: string[];
  qualityTier: QualityTier;
  muted: boolean;
  lastSyncedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  playerId: string;
  playerName: string;
  levelId: number;
  score: number;
  stars: number;
  provider: 'web' | 'google_play_games';
  updatedAt: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  rewardCoins: number;
}

export interface HudSnapshot {
  score: number;
  enemiesRemaining: number;
  enemiesTotal: number;
  activeNinja: NinjaType | null;
  activeSkinId: string | null;
  queue: NinjaType[];
  inFlight: boolean;
  abilityAvailable: boolean;
  canSkipTurn: boolean;
  cameraMode: 'auto' | 'overview';
  fps: number;
}

export interface RoundResult {
  levelId: number;
  won: boolean;
  destructionScore: number;
  unusedNinjaBonus: number;
  totalScore: number;
  stars: number;
  newBest: boolean;
  coinsEarned: number;
  newlyUnlockedAchievements: AchievementDef[];
}
