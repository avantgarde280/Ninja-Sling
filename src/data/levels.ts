import type {AchievementDef, LevelDef} from '../types/game';

/**
 * World coordinate system:
 * Width: 1800, Ground surface Y: 620
 * Slingshot anchor: (240, 500)
 * Block `y` is height of block CENTER above ground (so y=50 with h=100 sits flush on ground).
 */
export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 760;
export const GROUND_Y = 620;
export const SLING_X = 240;
export const SLING_Y = 500;

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_strike',
    name: 'First Strike',
    description: 'Clear your first fortified dojo stage.',
    rewardCoins: 40,
  },
  {
    id: 'powder_chain',
    name: 'Powder Keg Chain',
    description: 'Detonate an explosive powder keg to shatter enemy defenses.',
    rewardCoins: 50,
  },
  {
    id: 'untouchable_reserve',
    name: 'Economy of Motion',
    description: 'Win a stage with at least 2 ninjas still in reserve.',
    rewardCoins: 75,
  },
  {
    id: 'three_star_sensei',
    name: 'Three-Star Sensei',
    description: 'Earn a 3-star rating on any fortress stage.',
    rewardCoins: 60,
  },
  {
    id: 'demolition_master',
    name: 'Grand Demolition',
    description: 'Reach 150,000 cumulative campaign score.',
    rewardCoins: 100,
  },
  {
    id: 'shogun_vanquished',
    name: 'Shogun Vanquished',
    description: 'Defeat the Grand Shogun inside the Golden Citadel.',
    rewardCoins: 150,
  },
];

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Bamboo Gatehouse',
    region: 'Outer Valley Dojo',
    theme: 'bamboo_mist',
    description: 'Light bamboo scaffolding guards three clan sentries. Aim for the base pillars.',
    ninjas: ['shinobi', 'shinobi', 'kunoichi', 'shinobi'],
    starThresholds: [18000, 28000, 36000],
    fortressOriginX: 1120,
    blocks: [
      // Left bay
      {x: -100, y: 50, w: 22, h: 100, material: 'bamboo'},
      {x: 0, y: 50, w: 22, h: 100, material: 'bamboo'},
      {x: -50, y: 110, w: 136, h: 20, material: 'wood'},
      // Right bay
      {x: 110, y: 50, w: 22, h: 100, material: 'bamboo'},
      {x: 210, y: 50, w: 22, h: 100, material: 'bamboo'},
      {x: 160, y: 110, w: 136, h: 20, material: 'wood'},
      // Upper bridge & lantern roof
      {x: 55, y: 130, w: 150, h: 20, material: 'bamboo'},
      {x: 10, y: 185, w: 20, h: 90, material: 'wood'},
      {x: 100, y: 185, w: 20, h: 90, material: 'wood'},
      {x: 55, y: 240, w: 130, h: 20, material: 'wood'},
    ],
    enemies: [
      {x: -50, y: 22, type: 'grunt'},
      {x: 160, y: 22, type: 'grunt'},
      {x: 55, y: 162, type: 'grunt'},
    ],
  },
  {
    id: 2,
    name: 'Shoji Lantern Shrine',
    region: 'Maple Courtyard',
    theme: 'twilight',
    description: 'Brittle shoji glass screens surround a volatile powder keg in the shrine core.',
    ninjas: ['kunoichi', 'shinobi', 'tengu', 'kunoichi'],
    starThresholds: [22000, 32000, 40000],
    fortressOriginX: 1150,
    blocks: [
      // Base stone plinths
      {x: -140, y: 25, w: 70, h: 50, material: 'stone'},
      {x: 140, y: 25, w: 70, h: 50, material: 'stone'},
      // Center powder keg
      {x: 0, y: 24, w: 46, h: 48, material: 'tnt'},
      // Glass walls
      {x: -140, y: 100, w: 20, h: 100, material: 'ice'},
      {x: -55, y: 50, w: 20, h: 100, material: 'ice'},
      {x: 55, y: 50, w: 20, h: 100, material: 'ice'},
      {x: 140, y: 100, w: 20, h: 100, material: 'ice'},
      // Center crossbeam & side eaves (non-overlapping)
      {x: 0, y: 110, w: 142, h: 20, material: 'wood'},
      {x: -120, y: 160, w: 76, h: 20, material: 'bamboo'},
      {x: 120, y: 160, w: 76, h: 20, material: 'bamboo'},
      // Upper pagoda tier
      {x: -45, y: 170, w: 20, h: 100, material: 'wood'},
      {x: 45, y: 170, w: 20, h: 100, material: 'wood'},
      {x: 0, y: 230, w: 130, h: 20, material: 'wood'},
    ],
    enemies: [
      {x: -96, y: 22, type: 'grunt'},
      {x: 96, y: 22, type: 'grunt'},
      {x: 0, y: 144, type: 'guard'},
    ],
  },
  {
    id: 3,
    name: 'Frozen Torii Bridge',
    region: 'North Ridge',
    theme: 'moonlit_snow',
    description: 'Glacial pillars support a two-tier winter outpost. Split your Kunoichi or dive from above.',
    ninjas: ['kunoichi', 'tengu', 'shinobi', 'oni_buster'],
    starThresholds: [24000, 35000, 44000],
    fortressOriginX: 1140,
    blocks: [
      // Left ice tower
      {x: -160, y: 55, w: 24, h: 110, material: 'ice'},
      {x: -70, y: 55, w: 24, h: 110, material: 'ice'},
      {x: -115, y: 120, w: 126, h: 20, material: 'stone'},
      // Center bridge span
      {x: 10, y: 55, w: 24, h: 110, material: 'wood'},
      {x: 120, y: 55, w: 24, h: 110, material: 'wood'},
      {x: 65, y: 120, w: 146, h: 20, material: 'wood'},
      // Right snow bunker
      {x: 175, y: 55, w: 24, h: 110, material: 'ice'},
      {x: 255, y: 55, w: 24, h: 110, material: 'ice'},
      {x: 215, y: 120, w: 116, h: 20, material: 'ice'},
      // Second floor structures
      {x: -145, y: 180, w: 20, h: 100, material: 'bamboo'},
      {x: -85, y: 180, w: 20, h: 100, material: 'bamboo'},
      {x: -115, y: 240, w: 100, h: 20, material: 'wood'},
      {x: 22, y: 180, w: 20, h: 100, material: 'ice'},
      {x: 108, y: 180, w: 20, h: 100, material: 'ice'},
      {x: 65, y: 240, w: 118, h: 20, material: 'ice'},
      {x: 65, y: 154, w: 46, h: 48, material: 'tnt'},
    ],
    enemies: [
      {x: -115, y: 22, type: 'grunt'},
      {x: 65, y: 24, type: 'guard'},
      {x: -115, y: 152, type: 'grunt'},
      {x: 215, y: 22, type: 'grunt'},
    ],
  },
  {
    id: 4,
    name: 'Twin Watchtowers',
    region: 'Crimson Gorge',
    theme: 'crimson_dusk',
    description: 'Two towering timber keeps connected by a powder-keg catwalk.',
    ninjas: ['shinobi', 'oni_buster', 'tengu', 'kunoichi'],
    starThresholds: [26000, 37000, 46000],
    fortressOriginX: 1130,
    blocks: [
      // West Tower
      {x: -165, y: 55, w: 24, h: 110, material: 'stone'},
      {x: -75, y: 55, w: 24, h: 110, material: 'stone'},
      {x: -120, y: 120, w: 126, h: 20, material: 'wood'},
      {x: -155, y: 180, w: 20, h: 100, material: 'wood'},
      {x: -85, y: 180, w: 20, h: 100, material: 'wood'},
      {x: -120, y: 240, w: 110, h: 20, material: 'bamboo'},
      // Center keg platform
      {x: 0, y: 30, w: 80, h: 60, material: 'wood'},
      {x: 0, y: 84, w: 46, h: 48, material: 'tnt'},
      // East Tower
      {x: 75, y: 55, w: 24, h: 110, material: 'stone'},
      {x: 165, y: 55, w: 24, h: 110, material: 'stone'},
      {x: 120, y: 120, w: 126, h: 20, material: 'wood'},
      {x: 85, y: 180, w: 20, h: 100, material: 'wood'},
      {x: 155, y: 180, w: 20, h: 100, material: 'wood'},
      {x: 120, y: 240, w: 110, h: 20, material: 'bamboo'},
      {x: 120, y: 295, w: 20, h: 90, material: 'ice'},
    ],
    enemies: [
      {x: -120, y: 24, type: 'guard'},
      {x: -120, y: 152, type: 'grunt'},
      {x: 120, y: 24, type: 'guard'},
      {x: 120, y: 152, type: 'grunt'},
    ],
  },
  {
    id: 5,
    name: 'Granite Fortress Keep',
    region: 'Thunder Peaks',
    theme: 'storm_keep',
    description: 'Thick granite walls shield armored guards. Use the Thunder Oni-Buster blast to breach the stone.',
    ninjas: ['oni_buster', 'tengu', 'oni_buster', 'shinobi'],
    starThresholds: [28000, 40000, 50000],
    fortressOriginX: 1160,
    blocks: [
      // Front Shield Wall
      {x: -195, y: 60, w: 32, h: 120, material: 'stone'},
      {x: -195, y: 170, w: 30, h: 100, material: 'stone'},
      // Inner Vault
      {x: -115, y: 55, w: 24, h: 110, material: 'stone'},
      {x: 0, y: 55, w: 24, h: 110, material: 'wood'},
      {x: 115, y: 55, w: 24, h: 110, material: 'stone'},
      {x: -60, y: 120, w: 116, h: 20, material: 'stone'},
      {x: 60, y: 120, w: 116, h: 20, material: 'stone'},
      // Explosive cache inside right vault
      {x: 58, y: 24, w: 46, h: 48, material: 'tnt'},
      // Upper Citadel Tier
      {x: -88, y: 180, w: 22, h: 100, material: 'wood'},
      {x: 0, y: 180, w: 22, h: 100, material: 'ice'},
      {x: 88, y: 180, w: 22, h: 100, material: 'wood'},
      {x: 0, y: 240, w: 210, h: 20, material: 'wood'},
      // Roof spire
      {x: 0, y: 295, w: 24, h: 90, material: 'bamboo'},
    ],
    enemies: [
      {x: -58, y: 24, type: 'guard'},
      {x: -44, y: 152, type: 'guard'},
      {x: 44, y: 152, type: 'grunt'},
      {x: 175, y: 22, type: 'grunt'},
    ],
  },
  {
    id: 6,
    name: 'Grand Shogun Citadel',
    region: 'Imperial Summit',
    theme: 'golden_citadel',
    description: 'The Shogun awaits atop a three-tier fortress. Combine every ninja technique to topple his throne.',
    ninjas: ['shinobi', 'kunoichi', 'oni_buster', 'tengu', 'oni_buster'],
    starThresholds: [34000, 48000, 60000],
    fortressOriginX: 1180,
    blocks: [
      // Outer Gate Pillar
      {x: -225, y: 55, w: 30, h: 110, material: 'stone'},
      {x: -225, y: 150, w: 26, h: 80, material: 'ice'},
      // Tier 1 Left, Center, Right Bays
      {x: -145, y: 55, w: 24, h: 110, material: 'stone'},
      {x: -45, y: 55, w: 24, h: 110, material: 'wood'},
      {x: 45, y: 55, w: 24, h: 110, material: 'wood'},
      {x: 145, y: 55, w: 24, h: 110, material: 'stone'},
      {x: -95, y: 120, w: 112, h: 20, material: 'stone'},
      {x: 0, y: 120, w: 74, h: 20, material: 'wood'},
      {x: 95, y: 120, w: 112, h: 20, material: 'stone'},
      // Powder Kegs flanking throne foundation
      {x: -95, y: 24, w: 46, h: 48, material: 'tnt'},
      {x: 95, y: 24, w: 46, h: 48, material: 'tnt'},
      // Tier 2 Throne Hall
      {x: -115, y: 180, w: 22, h: 100, material: 'wood'},
      {x: -35, y: 180, w: 22, h: 100, material: 'ice'},
      {x: 35, y: 180, w: 22, h: 100, material: 'ice'},
      {x: 115, y: 180, w: 22, h: 100, material: 'wood'},
      {x: 0, y: 240, w: 260, h: 20, material: 'wood'},
      // Tier 3 Shogun Canopy
      {x: -52, y: 295, w: 20, h: 90, material: 'bamboo'},
      {x: 52, y: 295, w: 20, h: 90, material: 'bamboo'},
      {x: 0, y: 351, w: 140, h: 22, material: 'wood'},
    ],
    enemies: [
      {x: 0, y: 24, type: 'guard'},
      {x: -75, y: 152, type: 'grunt'},
      {x: 75, y: 152, type: 'grunt'},
      {x: 0, y: 280, type: 'shogun'},
      {x: 205, y: 24, type: 'guard'},
    ],
  },
];
