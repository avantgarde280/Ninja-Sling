import type {NinjaClassSpec, NinjaSkinDef, NinjaType} from '../types/game';

export const NINJA_CLASSES: Record<NinjaType, NinjaClassSpec> = {
  shinobi: {
    type: 'shinobi',
    name: 'Shadow Shinobi',
    abilityName: 'Shadow Dash',
    abilityHint: 'Tap / Space mid-air to surge forward at high speed',
    radius: 20,
    density: 0.0046,
    restitution: 0.42,
    friction: 0.55,
    launchPowerScale: 1.0,
    defaultSkinId: 'shinobi_crimson',
  },
  kunoichi: {
    type: 'kunoichi',
    name: 'Twin Kunoichi',
    abilityName: 'Shuriken Split',
    abilityHint: 'Tap / Space mid-air to split into 3 agile clones',
    radius: 17,
    density: 0.0038,
    restitution: 0.48,
    friction: 0.45,
    launchPowerScale: 1.06,
    defaultSkinId: 'kunoichi_jade',
  },
  oni_buster: {
    type: 'oni_buster',
    name: 'Thunder Oni-Buster',
    abilityName: 'Smoke Blast',
    abilityHint: 'Tap / Space mid-air to detonate a shockwave blast',
    radius: 25,
    density: 0.0066,
    restitution: 0.3,
    friction: 0.7,
    launchPowerScale: 0.94,
    defaultSkinId: 'oni_amber',
  },
  tengu: {
    type: 'tengu',
    name: 'Cyclone Tengu',
    abilityName: 'Meteor Dive',
    abilityHint: 'Tap / Space mid-air to dive straight down with crushing force',
    radius: 20,
    density: 0.0052,
    restitution: 0.36,
    friction: 0.5,
    launchPowerScale: 1.02,
    defaultSkinId: 'tengu_cobalt',
  },
};

/**
 * Purely cosmetic visual skins for each ninja projectile class.
 * Zero gameplay, physics, mass, radius, or ability modifiers.
 */
export const NINJA_SKINS: NinjaSkinDef[] = [
  // Shadow Shinobi Skins
  {
    id: 'shinobi_crimson',
    ninjaType: 'shinobi',
    name: 'Crimson Shadow',
    subtitle: 'Classic midnight shinobi wrap with scarlet sash',
    cost: 0,
    palette: {
      cowl: '#1e2438',
      cowlShadow: '#111524',
      mask: '#f5d0a9',
      accent: '#e11d48',
      ribbon: '#fb7185',
      eyeGlow: '#fef08a',
      trail: 'rgba(225, 29, 72, 0.55)',
      crest: '#f8fafc',
    },
  },
  {
    id: 'shinobi_ivory',
    ninjaType: 'shinobi',
    name: 'White Fang',
    subtitle: 'Snow-cloaked frost assassin with silver steel trim',
    cost: 120,
    palette: {
      cowl: '#e2e8f0',
      cowlShadow: '#94a3b8',
      mask: '#f1c6a0',
      accent: '#0284c7',
      ribbon: '#38bdf8',
      eyeGlow: '#38bdf8',
      trail: 'rgba(56, 189, 248, 0.55)',
      crest: '#0f172a',
    },
  },
  {
    id: 'shinobi_gold',
    ninjaType: 'shinobi',
    name: 'Gilded Anbu',
    subtitle: 'Ceremonial obsidian silk with hammered gold plate',
    cost: 240,
    unlockStars: 10,
    palette: {
      cowl: '#18181b',
      cowlShadow: '#09090b',
      mask: '#fde68a',
      accent: '#d97706',
      ribbon: '#fbbf24',
      eyeGlow: '#fef08a',
      trail: 'rgba(251, 191, 36, 0.6)',
      crest: '#fef3c7',
    },
  },

  // Twin Kunoichi Skins
  {
    id: 'kunoichi_jade',
    ninjaType: 'kunoichi',
    name: 'Jade Lotus',
    subtitle: 'Emerald bamboo weave with twin forest ribbons',
    cost: 0,
    palette: {
      cowl: '#134e4a',
      cowlShadow: '#0a2e2c',
      mask: '#f5d0a9',
      accent: '#10b981',
      ribbon: '#34d399',
      eyeGlow: '#a7f3d0',
      trail: 'rgba(16, 185, 129, 0.55)',
      crest: '#ecfdf5',
    },
  },
  {
    id: 'kunoichi_sakura',
    ninjaType: 'kunoichi',
    name: 'Sakura Veil',
    subtitle: 'Twilight plum hood with drifting blossom silk',
    cost: 140,
    palette: {
      cowl: '#4c1d4b',
      cowlShadow: '#2e102e',
      mask: '#f7d5b6',
      accent: '#ec4899',
      ribbon: '#f9a8d4',
      eyeGlow: '#fbcfe8',
      trail: 'rgba(244, 114, 182, 0.55)',
      crest: '#fdf2f8',
    },
  },
  {
    id: 'kunoichi_moonlight',
    ninjaType: 'kunoichi',
    name: 'Moonlight Mist',
    subtitle: 'Celestial slate wrap with luminous pearl ribbons',
    cost: 260,
    unlockStars: 12,
    palette: {
      cowl: '#312e81',
      cowlShadow: '#1e1b4b',
      mask: '#f5d0a9',
      accent: '#06b6d4',
      ribbon: '#67e8f9',
      eyeGlow: '#cffafe',
      trail: 'rgba(103, 232, 249, 0.6)',
      crest: '#ecfeff',
    },
  },

  // Thunder Oni-Buster Skins
  {
    id: 'oni_amber',
    ninjaType: 'oni_buster',
    name: 'Amber Kabuto',
    subtitle: 'Forged bronze armor plates and blazing amber sash',
    cost: 0,
    palette: {
      cowl: '#451a03',
      cowlShadow: '#290f02',
      mask: '#f59e0b',
      accent: '#f97316',
      ribbon: '#fbbf24',
      eyeGlow: '#fef08a',
      trail: 'rgba(249, 115, 22, 0.6)',
      crest: '#fde68a',
    },
  },
  {
    id: 'oni_obsidian',
    ninjaType: 'oni_buster',
    name: 'Obsidian Iron',
    subtitle: 'Charcoal samurai steel with crimson horn crest',
    cost: 160,
    palette: {
      cowl: '#27272a',
      cowlShadow: '#18181b',
      mask: '#ef4444',
      accent: '#dc2626',
      ribbon: '#f87171',
      eyeGlow: '#fecaca',
      trail: 'rgba(239, 68, 68, 0.6)',
      crest: '#fca5a5',
    },
  },
  {
    id: 'oni_azure',
    ninjaType: 'oni_buster',
    name: 'Azure Raijin',
    subtitle: 'Storm-blue lacquer armor with lightning gold trim',
    cost: 300,
    unlockStars: 15,
    palette: {
      cowl: '#1e3a8a',
      cowlShadow: '#172554',
      mask: '#eab308',
      accent: '#3b82f6',
      ribbon: '#93c5fd',
      eyeGlow: '#fef08a',
      trail: 'rgba(59, 130, 246, 0.6)',
      crest: '#fef08a',
    },
  },

  // Cyclone Tengu Skins
  {
    id: 'tengu_cobalt',
    ninjaType: 'tengu',
    name: 'Cobalt Gale',
    subtitle: 'Deep indigo wind cloak with silver tengu visor',
    cost: 0,
    palette: {
      cowl: '#1e293b',
      cowlShadow: '#0f172a',
      mask: '#cbd5e1',
      accent: '#3b82f6',
      ribbon: '#60a5fa',
      eyeGlow: '#bae6fd',
      trail: 'rgba(96, 165, 250, 0.55)',
      crest: '#f8fafc',
    },
  },
  {
    id: 'tengu_crimson',
    ninjaType: 'tengu',
    name: 'Scarlet Crow',
    subtitle: 'Feathered obsidian hood with lacquered red visor',
    cost: 180,
    palette: {
      cowl: '#1c1917',
      cowlShadow: '#0c0a09',
      mask: '#dc2626',
      accent: '#b91c1c',
      ribbon: '#fb7185',
      eyeGlow: '#fde047',
      trail: 'rgba(220, 38, 38, 0.58)',
      crest: '#fca5a5',
    },
  },
  {
    id: 'tengu_emerald',
    ninjaType: 'tengu',
    name: 'Jade Falcon',
    subtitle: 'High-altitude moss cloak with burnished brass beak',
    cost: 320,
    unlockStars: 18,
    palette: {
      cowl: '#064e3b',
      cowlShadow: '#022c22',
      mask: '#f59e0b',
      accent: '#10b981',
      ribbon: '#6ee7b7',
      eyeGlow: '#fef08a',
      trail: 'rgba(52, 211, 153, 0.58)',
      crest: '#fde68a',
    },
  },
];

export const DEFAULT_EQUIPPED_SKINS: Record<NinjaType, string> = {
  shinobi: 'shinobi_crimson',
  kunoichi: 'kunoichi_jade',
  oni_buster: 'oni_amber',
  tengu: 'tengu_cobalt',
};

export const DEFAULT_UNLOCKED_SKINS: string[] = [
  'shinobi_crimson',
  'kunoichi_jade',
  'oni_amber',
  'tengu_cobalt',
];

export function getSkinById(skinId: string | null | undefined): NinjaSkinDef {
  return NINJA_SKINS.find((s) => s.id === skinId) ?? NINJA_SKINS[0];
}

export function getSkinsForNinja(ninjaType: NinjaType): NinjaSkinDef[] {
  return NINJA_SKINS.filter((s) => s.ninjaType === ninjaType);
}
