import {ACHIEVEMENTS, LEVELS} from '../data/levels';
import {DEFAULT_EQUIPPED_SKINS, DEFAULT_UNLOCKED_SKINS} from '../data/skins';
import type {
  AchievementDef,
  CloudSnapshot,
  LeaderboardEntry,
  NinjaType,
  QualityTier,
} from '../types/game';

/**
 * Native Android Google Play Games Services (GPGS v2) JavaScript Interface contract.
 * When packaged inside an Android WebView / Capacitor / TWA shell, attach
 * `window.AndroidPlayGames` to forward calls directly to Play Games SDK clients:
 * - GamesSignInClient
 * - LeaderboardsClient
 * - SnapshotsClient
 * - AchievementsClient
 */
export interface AndroidPlayGamesBridge {
  isSignedIn(): boolean;
  getPlayerName(): string;
  getPlayerId(): string;
  submitScore(leaderboardId: string, score: number): void;
  unlockAchievement(achievementId: string): void;
  saveSnapshot(jsonPayload: string): void;
  loadSnapshot(): string | null;
}

declare global {
  interface Window {
    AndroidPlayGames?: AndroidPlayGamesBridge;
  }
}

const LOCAL_STORAGE_KEY = 'kage_sling_cloud_snapshot_v1';

const GPGS_LEADERBOARD_IDS: Record<number, string> = {
  0: 'CgkI_kage_sling_campaign_total',
  1: 'CgkI_kage_sling_stage_1',
  2: 'CgkI_kage_sling_stage_2',
  3: 'CgkI_kage_sling_stage_3',
  4: 'CgkI_kage_sling_stage_4',
  5: 'CgkI_kage_sling_stage_5',
  6: 'CgkI_kage_sling_stage_6',
};

function generatePlayerId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `shinobi_${random}`;
}

export function createInitialSnapshot(): CloudSnapshot {
  const native = typeof window !== 'undefined' ? window.AndroidPlayGames : undefined;
  return {
    playerId: native?.isSignedIn() ? native.getPlayerId() : generatePlayerId(),
    playerName: native?.isSignedIn() ? native.getPlayerName() : 'RoninPlayer',
    coins: 250,
    unlockedSkins: [...DEFAULT_UNLOCKED_SKINS],
    equippedSkins: {...DEFAULT_EQUIPPED_SKINS},
    levelProgress: {},
    achievements: [],
    qualityTier: 'auto',
    muted: false,
    lastSyncedAt: new Date().toISOString(),
  };
}

export function isNativePlayGamesAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.AndroidPlayGames?.isSignedIn());
}

export function loadLocalSnapshot(): CloudSnapshot {
  try {
    const native = typeof window !== 'undefined' ? window.AndroidPlayGames : undefined;
    if (native?.isSignedIn()) {
      const nativeJson = native.loadSnapshot();
      if (nativeJson) {
        return normalizeSnapshot(JSON.parse(nativeJson));
      }
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return normalizeSnapshot(JSON.parse(raw));
    }
  } catch {
    // Ignore corrupt local storage
  }
  const fresh = createInitialSnapshot();
  saveLocalSnapshot(fresh);
  return fresh;
}

export function saveLocalSnapshot(snapshot: CloudSnapshot): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    const native = typeof window !== 'undefined' ? window.AndroidPlayGames : undefined;
    if (native?.isSignedIn()) {
      native.saveSnapshot(JSON.stringify(snapshot));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function normalizeSnapshot(raw: unknown): CloudSnapshot {
  const base = createInitialSnapshot();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<CloudSnapshot>;
  return {
    playerId: typeof obj.playerId === 'string' && obj.playerId ? obj.playerId : base.playerId,
    playerName:
      typeof obj.playerName === 'string' && obj.playerName.trim()
        ? obj.playerName.trim().slice(0, 24)
        : base.playerName,
    coins: typeof obj.coins === 'number' && Number.isFinite(obj.coins) ? Math.max(0, Math.floor(obj.coins)) : base.coins,
    unlockedSkins: Array.isArray(obj.unlockedSkins)
      ? Array.from(new Set([...DEFAULT_UNLOCKED_SKINS, ...obj.unlockedSkins]))
      : [...DEFAULT_UNLOCKED_SKINS],
    equippedSkins: {
      ...DEFAULT_EQUIPPED_SKINS,
      ...(obj.equippedSkins ?? {}),
    } as Record<NinjaType, string>,
    levelProgress: obj.levelProgress && typeof obj.levelProgress === 'object' ? obj.levelProgress : {},
    achievements: Array.isArray(obj.achievements) ? obj.achievements : [],
    qualityTier:
      obj.qualityTier === 'performance' || obj.qualityTier === 'high' ? obj.qualityTier : 'auto',
    muted: Boolean(obj.muted),
    lastSyncedAt: typeof obj.lastSyncedAt === 'string' ? obj.lastSyncedAt : new Date().toISOString(),
  };
}

export function getTotalCampaignScore(snapshot: CloudSnapshot): number {
  return Object.values(snapshot.levelProgress).reduce((sum, item) => sum + (item.bestScore || 0), 0);
}

export function getTotalStars(snapshot: CloudSnapshot): number {
  return Object.values(snapshot.levelProgress).reduce((sum, item) => sum + (item.stars || 0), 0);
}

export function isStageUnlocked(snapshot: CloudSnapshot, levelId: number): boolean {
  if (levelId <= 1) return true;
  return Boolean(snapshot.levelProgress[String(levelId - 1)]?.cleared);
}

export async function syncCloudSaveUp(snapshot: CloudSnapshot): Promise<CloudSnapshot> {
  const updated: CloudSnapshot = {
    ...snapshot,
    lastSyncedAt: new Date().toISOString(),
  };
  saveLocalSnapshot(updated);
  try {
    const res = await fetch('/api/cloud-save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = (await res.json()) as {snapshot?: CloudSnapshot};
      if (data.snapshot) {
        const normalized = normalizeSnapshot(data.snapshot);
        saveLocalSnapshot(normalized);
        return normalized;
      }
    }
  } catch {
    // Offline-safe: local snapshot remains valid
  }
  return updated;
}

export async function restoreCloudSaveDown(playerId: string): Promise<CloudSnapshot | null> {
  try {
    const res = await fetch(`/api/cloud-save?playerId=${encodeURIComponent(playerId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {snapshot?: CloudSnapshot | null};
    if (!data.snapshot) return null;
    const normalized = normalizeSnapshot(data.snapshot);
    saveLocalSnapshot(normalized);
    return normalized;
  } catch {
    return null;
  }
}

export async function submitLeaderboardScore(
  snapshot: CloudSnapshot,
  levelId: number,
  score: number,
  stars: number,
): Promise<void> {
  const native = typeof window !== 'undefined' ? window.AndroidPlayGames : undefined;
  const provider: 'web' | 'google_play_games' = native?.isSignedIn() ? 'google_play_games' : 'web';

  if (native?.isSignedIn()) {
    const boardId = GPGS_LEADERBOARD_IDS[levelId] ?? GPGS_LEADERBOARD_IDS[0];
    native.submitScore(boardId, score);
    const totalScore = getTotalCampaignScore(snapshot);
    native.submitScore(GPGS_LEADERBOARD_IDS[0], totalScore);
  }

  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        playerId: snapshot.playerId,
        playerName: snapshot.playerName,
        levelId,
        score,
        stars,
        provider,
      }),
    });

    // Also update total campaign leaderboard (levelId = 0)
    if (levelId > 0) {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          playerId: snapshot.playerId,
          playerName: snapshot.playerName,
          levelId: 0,
          score: getTotalCampaignScore(snapshot),
          stars: getTotalStars(snapshot),
          provider,
        }),
      });
    }
  } catch {
    // Offline tolerant
  }
}

export async function fetchLeaderboard(levelId: number): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard?levelId=${levelId}`);
    if (!res.ok) return [];
    const data = (await res.json()) as {entries?: LeaderboardEntry[]};
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

export function evaluateAchievements(
  snapshot: CloudSnapshot,
  context: {
    won: boolean;
    levelId: number;
    stars: number;
    unusedNinjas: number;
    tntTriggered: boolean;
  },
): {nextSnapshot: CloudSnapshot; unlockedNow: AchievementDef[]} {
  const unlockedSet = new Set(snapshot.achievements);
  const unlockedNow: AchievementDef[] = [];

  const tryUnlock = (id: string) => {
    if (unlockedSet.has(id)) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    unlockedSet.add(id);
    unlockedNow.push(def);
    if (typeof window !== 'undefined' && window.AndroidPlayGames?.isSignedIn()) {
      window.AndroidPlayGames.unlockAchievement(id);
    }
  };

  if (context.tntTriggered) {
    tryUnlock('powder_chain');
  }
  if (context.won) {
    tryUnlock('first_strike');
    if (context.stars >= 3) {
      tryUnlock('three_star_sensei');
    }
    if (context.unusedNinjas >= 2) {
      tryUnlock('untouchable_reserve');
    }
    if (context.levelId === LEVELS[LEVELS.length - 1].id) {
      tryUnlock('shogun_vanquished');
    }
  }

  const totalScore = getTotalCampaignScore(snapshot);
  if (totalScore >= 150000) {
    tryUnlock('demolition_master');
  }

  const bonusCoins = unlockedNow.reduce((sum, a) => sum + a.rewardCoins, 0);
  const nextSnapshot: CloudSnapshot = {
    ...snapshot,
    coins: snapshot.coins + bonusCoins,
    achievements: Array.from(unlockedSet),
  };

  return {nextSnapshot, unlockedNow};
}

export function resolveEffectiveDpr(tier: QualityTier): number {
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  if (tier === 'performance') return 1;
  if (tier === 'high') return Math.min(deviceDpr, 2);
  // Auto: cap DPR on mobile touch screens / lower-end viewports for crisp 60fps
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  return isTouchDevice ? Math.min(deviceDpr, 1.35) : Math.min(deviceDpr, 1.75);
}
