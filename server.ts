import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join('/tmp', 'kage-sling-data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface LeaderboardRecord {
  id: string;
  playerId: string;
  playerName: string;
  levelId: number; // 0 = total campaign score, 1..6 = stage score
  score: number;
  stars: number;
  provider: 'web' | 'google_play_games';
  updatedAt: string;
}

interface CloudSaveRecord {
  playerId: string;
  playerName: string;
  coins: number;
  unlockedSkins: string[];
  equippedSkins: Record<string, string>;
  levelProgress: Record<string, {bestScore: number; stars: number; cleared: boolean}>;
  achievements: string[];
  qualityTier: 'auto' | 'performance' | 'high';
  muted: boolean;
  lastSyncedAt: string;
}

interface StoreData {
  leaderboard: LeaderboardRecord[];
  cloudSaves: Record<string, CloudSaveRecord>;
}

const DEFAULT_LEADERBOARD: LeaderboardRecord[] = [
  {
    id: 'seed-0-1',
    playerId: 'rival-hanzo',
    playerName: 'Hanzo_Kage',
    levelId: 0,
    score: 248500,
    stars: 17,
    provider: 'google_play_games',
    updatedAt: '2026-11-20T10:15:00.000Z',
  },
  {
    id: 'seed-0-2',
    playerId: 'rival-akane',
    playerName: 'AkaneBlade',
    levelId: 0,
    score: 214200,
    stars: 15,
    provider: 'google_play_games',
    updatedAt: '2026-11-20T14:22:00.000Z',
  },
  {
    id: 'seed-0-3',
    playerId: 'rival-raiden',
    playerName: 'RaidenOni',
    levelId: 0,
    score: 186900,
    stars: 13,
    provider: 'web',
    updatedAt: '2026-11-21T08:40:00.000Z',
  },
  {
    id: 'seed-1-1',
    playerId: 'rival-hanzo',
    playerName: 'Hanzo_Kage',
    levelId: 1,
    score: 38400,
    stars: 3,
    provider: 'google_play_games',
    updatedAt: '2026-11-20T10:15:00.000Z',
  },
  {
    id: 'seed-2-1',
    playerId: 'rival-akane',
    playerName: 'AkaneBlade',
    levelId: 2,
    score: 41200,
    stars: 3,
    provider: 'google_play_games',
    updatedAt: '2026-11-20T14:22:00.000Z',
  },
  {
    id: 'seed-3-1',
    playerId: 'rival-hanzo',
    playerName: 'Hanzo_Kage',
    levelId: 3,
    score: 43800,
    stars: 3,
    provider: 'google_play_games',
    updatedAt: '2026-11-20T10:15:00.000Z',
  },
  {
    id: 'seed-4-1',
    playerId: 'rival-raiden',
    playerName: 'RaidenOni',
    levelId: 4,
    score: 44600,
    stars: 3,
    provider: 'web',
    updatedAt: '2026-11-21T08:40:00.000Z',
  },
  {
    id: 'seed-5-1',
    playerId: 'rival-akane',
    playerName: 'AkaneBlade',
    levelId: 5,
    score: 46500,
    stars: 3,
    provider: 'google_play_games',
    updatedAt: '2026-11-20T14:22:00.000Z',
  },
  {
    id: 'seed-6-1',
    playerId: 'rival-hanzo',
    playerName: 'Hanzo_Kage',
    levelId: 6,
    score: 52400,
    stars: 3,
    provider: 'google_play_games',
    updatedAt: '2026-11-20T10:15:00.000Z',
  },
];

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, {recursive: true});
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as StoreData;
      return {
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [...DEFAULT_LEADERBOARD],
        cloudSaves: parsed.cloudSaves && typeof parsed.cloudSaves === 'object' ? parsed.cloudSaves : {},
      };
    }
  } catch {
    // Fallback to clean seed store
  }
  return {
    leaderboard: [...DEFAULT_LEADERBOARD],
    cloudSaves: {},
  };
}

function persistStore(store: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, {recursive: true});
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store), 'utf8');
  } catch {
    // Ignore disk write issues in read-only sandboxes; memory store still serves requests
  }
}

const store = loadStore();

async function createApp() {
  const app = express();
  app.use(express.json({limit: '256kb'}));

  app.get('/api/health', (_req, res) => {
    res.json({ok: true});
  });

  app.get('/api/leaderboard', (req, res) => {
    const levelParam = req.query.levelId;
    const parsedLevel = typeof levelParam === 'string' ? Number.parseInt(levelParam, 10) : 0;
    const levelId = Number.isFinite(parsedLevel) && parsedLevel >= 0 ? parsedLevel : 0;

    const entries = store.leaderboard
      .filter((entry) => entry.levelId === levelId)
      .sort((a, b) => b.score - a.score || b.stars - a.stars)
      .slice(0, 25);

    res.json({levelId, entries});
  });

  app.post('/api/leaderboard', (req, res) => {
    const body = req.body as Partial<LeaderboardRecord> | undefined;
    if (!body || typeof body.playerId !== 'string' || typeof body.score !== 'number') {
      res.status(400).json({error: 'Invalid leaderboard payload'});
      return;
    }

    const playerId = body.playerId.trim().slice(0, 48);
    const playerName =
      typeof body.playerName === 'string' && body.playerName.trim().length > 0
        ? body.playerName.trim().slice(0, 24)
        : 'ShadowPlayer';
    const levelId = typeof body.levelId === 'number' && body.levelId >= 0 && body.levelId <= 20 ? Math.floor(body.levelId) : 0;
    const score = Math.max(0, Math.min(9999999, Math.floor(body.score)));
    const stars = typeof body.stars === 'number' ? Math.max(0, Math.min(60, Math.floor(body.stars))) : 0;
    const provider = body.provider === 'google_play_games' ? 'google_play_games' : 'web';

    if (!playerId) {
      res.status(400).json({error: 'Missing playerId'});
      return;
    }

    const existingIndex = store.leaderboard.findIndex(
      (item) => item.playerId === playerId && item.levelId === levelId,
    );

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const existing = store.leaderboard[existingIndex];
      store.leaderboard[existingIndex] = {
        ...existing,
        playerName,
        score: Math.max(existing.score, score),
        stars: Math.max(existing.stars, stars),
        provider,
        updatedAt: now,
      };
    } else {
      store.leaderboard.push({
        id: `${playerId}-${levelId}`,
        playerId,
        playerName,
        levelId,
        score,
        stars,
        provider,
        updatedAt: now,
      });
    }

    persistStore(store);

    const entries = store.leaderboard
      .filter((entry) => entry.levelId === levelId)
      .sort((a, b) => b.score - a.score || b.stars - a.stars)
      .slice(0, 25);

    res.json({ok: true, entries});
  });

  app.get('/api/cloud-save', (req, res) => {
    const playerId = typeof req.query.playerId === 'string' ? req.query.playerId.trim().slice(0, 48) : '';
    if (!playerId) {
      res.status(400).json({error: 'Missing playerId'});
      return;
    }
    const snapshot = store.cloudSaves[playerId] ?? null;
    res.json({snapshot});
  });

  app.post('/api/cloud-save', (req, res) => {
    const body = req.body as Partial<CloudSaveRecord> | undefined;
    if (!body || typeof body.playerId !== 'string' || !body.playerId.trim()) {
      res.status(400).json({error: 'Invalid cloud save payload'});
      return;
    }

    const playerId = body.playerId.trim().slice(0, 48);
    const snapshot: CloudSaveRecord = {
      playerId,
      playerName:
        typeof body.playerName === 'string' && body.playerName.trim().length > 0
          ? body.playerName.trim().slice(0, 24)
          : 'ShadowPlayer',
      coins: typeof body.coins === 'number' && Number.isFinite(body.coins) ? Math.max(0, Math.floor(body.coins)) : 250,
      unlockedSkins: Array.isArray(body.unlockedSkins)
        ? body.unlockedSkins.filter((s): s is string => typeof s === 'string').slice(0, 64)
        : [],
      equippedSkins:
        body.equippedSkins && typeof body.equippedSkins === 'object' ? body.equippedSkins : {},
      levelProgress:
        body.levelProgress && typeof body.levelProgress === 'object' ? body.levelProgress : {},
      achievements: Array.isArray(body.achievements)
        ? body.achievements.filter((a): a is string => typeof a === 'string').slice(0, 32)
        : [],
      qualityTier:
        body.qualityTier === 'performance' || body.qualityTier === 'high' ? body.qualityTier : 'auto',
      muted: Boolean(body.muted),
      lastSyncedAt: new Date().toISOString(),
    };

    store.cloudSaves[playerId] = snapshot;
    persistStore(store);

    res.json({ok: true, snapshot});
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number.parseInt(process.env.PORT ?? '3000', 10) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Kage Sling server listening on http://0.0.0.0:${port}`);
  });
}

createApp();
