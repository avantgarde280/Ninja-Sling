import {useCallback, useEffect, useRef, useState} from 'react';
import {GameCanvas} from './components/GameCanvas';
import {GameHud} from './components/GameHud';
import {LeaderboardModal} from './components/LeaderboardModal';
import {RoundModal} from './components/RoundModal';
import {SkinArmoryModal} from './components/SkinArmoryModal';
import {StageSelectModal} from './components/StageSelectModal';
import {TitleScreen} from './components/TitleScreen';
import {LEVELS} from './data/levels';
import type {PhysicsWorld} from './engine/physicsWorld';
import {soundEngine} from './engine/soundEngine';
import {
  evaluateAchievements,
  getTotalStars,
  loadLocalSnapshot,
  saveLocalSnapshot,
  submitLeaderboardScore,
  syncCloudSaveUp,
} from './services/playGamesService';
import type {
  CloudSnapshot,
  GameState,
  HudSnapshot,
  NinjaSkinDef,
  NinjaType,
  RoundResult,
} from './types/game';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  enemiesRemaining: 0,
  enemiesTotal: 0,
  activeNinja: null,
  activeSkinId: null,
  queue: [],
  inFlight: false,
  abilityAvailable: false,
  canSkipTurn: false,
  cameraMode: 'auto',
  fps: 60,
};

export default function App() {
  const [snapshot, setSnapshot] = useState<CloudSnapshot>(() => loadLocalSnapshot());
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [runKey, setRunKey] = useState<number>(1);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  const [showStages, setShowStages] = useState(false);
  const [showArmory, setShowArmory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const worldRef = useRef<PhysicsWorld | null>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  // Keep sound engine mute synced with profile
  useEffect(() => {
    soundEngine.setMuted(snapshot.muted);
  }, [snapshot.muted]);

  const currentLevel = LEVELS.find((l) => l.id === currentLevelId) ?? LEVELS[0];
  const bestStageScore = snapshot.levelProgress[String(currentLevel.id)]?.bestScore ?? 0;

  const updateAndSyncSnapshot = useCallback((next: CloudSnapshot) => {
    setSnapshot(next);
    saveLocalSnapshot(next);
    syncCloudSaveUp(next).then((synced) => {
      setSnapshot(synced);
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    soundEngine.unlock();
    const nextMuted = !snapshotRef.current.muted;
    soundEngine.setMuted(nextMuted);
    if (!nextMuted) soundEngine.playUiClick();
    const next = {...snapshotRef.current, muted: nextMuted};
    setSnapshot(next);
    saveLocalSnapshot(next);
  }, []);

  const handleStartCampaign = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playUiClick();
    // Jump into highest unlocked stage
    const prog = snapshotRef.current.levelProgress;
    let targetId = 1;
    for (const lvl of LEVELS) {
      if (prog[String(lvl.id)]?.cleared) {
        targetId = Math.min(LEVELS.length, lvl.id + 1);
      }
    }
    setCurrentLevelId(targetId);
    setRoundResult(null);
    setRunKey((k) => k + 1);
    setGameState('PLAYING');
  }, []);

  const handleSelectStage = useCallback((levelId: number) => {
    soundEngine.unlock();
    soundEngine.playUiClick();
    setShowStages(false);
    setCurrentLevelId(levelId);
    setRoundResult(null);
    setRunKey((k) => k + 1);
    setGameState('PLAYING');
  }, []);

  const handleRestartStage = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playUiClick();
    setRoundResult(null);
    setRunKey((k) => k + 1);
    setGameState('PLAYING');
  }, []);

  const handleNextStage = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playUiClick();
    const nextId = Math.min(LEVELS.length, currentLevelId + 1);
    setCurrentLevelId(nextId);
    setRoundResult(null);
    setRunKey((k) => k + 1);
    setGameState('PLAYING');
  }, [currentLevelId]);

  const handleRoundEnd = useCallback(
    (raw: {
      won: boolean;
      destructionScore: number;
      unusedNinjas: number;
      tntTriggered: boolean;
    }) => {
      const level = LEVELS.find((l) => l.id === currentLevelId) ?? LEVELS[0];
      const unusedNinjaBonus = raw.won ? raw.unusedNinjas * 10000 : 0;
      const totalScore = raw.destructionScore + unusedNinjaBonus;

      let stars = 0;
      if (raw.won) {
        stars = 1;
        if (totalScore >= level.starThresholds[1]) stars = 2;
        if (totalScore >= level.starThresholds[2]) stars = 3;
        soundEngine.playVictory();
      } else {
        soundEngine.playDefeat();
      }

      const prevSnap = snapshotRef.current;
      const prevProg = prevSnap.levelProgress[String(level.id)] ?? {
        bestScore: 0,
        stars: 0,
        cleared: false,
      };
      const newBest = raw.won && totalScore > prevProg.bestScore;
      const coinsEarned = raw.won ? 45 + stars * 25 + (newBest ? 20 : 0) : 10;

      const updatedProgress = {
        ...prevSnap.levelProgress,
        [String(level.id)]: {
          bestScore: raw.won ? Math.max(prevProg.bestScore, totalScore) : prevProg.bestScore,
          stars: raw.won ? Math.max(prevProg.stars, stars) : prevProg.stars,
          cleared: prevProg.cleared || raw.won,
        },
      };

      const draftSnap: CloudSnapshot = {
        ...prevSnap,
        coins: prevSnap.coins + coinsEarned,
        levelProgress: updatedProgress,
      };

      const {nextSnapshot, unlockedNow} = evaluateAchievements(draftSnap, {
        won: raw.won,
        levelId: level.id,
        stars,
        unusedNinjas: raw.unusedNinjas,
        tntTriggered: raw.tntTriggered,
      });

      setRoundResult({
        levelId: level.id,
        won: raw.won,
        destructionScore: raw.destructionScore,
        unusedNinjaBonus,
        totalScore,
        stars,
        newBest,
        coinsEarned: coinsEarned + unlockedNow.reduce((s, a) => s + a.rewardCoins, 0),
        newlyUnlockedAchievements: unlockedNow,
      });

      updateAndSyncSnapshot(nextSnapshot);
      if (raw.won) {
        submitLeaderboardScore(nextSnapshot, level.id, totalScore, stars);
      }

      setGameState(raw.won ? 'ROUND_SUMMARY' : 'GAME_OVER');
    },
    [currentLevelId, updateAndSyncSnapshot],
  );

  const handleUnlockSkin = useCallback(
    (skin: NinjaSkinDef) => {
      soundEngine.unlock();
      const prev = snapshotRef.current;
      if (prev.unlockedSkins.includes(skin.id)) return;
      const totalStars = getTotalStars(prev);
      const starFree = Boolean(skin.unlockStars && totalStars >= skin.unlockStars);
      if (!starFree && prev.coins < skin.cost) return;

      soundEngine.playUiClick();
      const next: CloudSnapshot = {
        ...prev,
        coins: starFree ? prev.coins : prev.coins - skin.cost,
        unlockedSkins: [...prev.unlockedSkins, skin.id],
        equippedSkins: {
          ...prev.equippedSkins,
          [skin.ninjaType]: skin.id,
        },
      };
      updateAndSyncSnapshot(next);
    },
    [updateAndSyncSnapshot],
  );

  const handleEquipSkin = useCallback(
    (ninjaType: NinjaType, skinId: string) => {
      soundEngine.unlock();
      soundEngine.playUiClick();
      const prev = snapshotRef.current;
      if (!prev.unlockedSkins.includes(skinId)) return;
      const next: CloudSnapshot = {
        ...prev,
        equippedSkins: {
          ...prev.equippedSkins,
          [ninjaType]: skinId,
        },
      };
      updateAndSyncSnapshot(next);
    },
    [updateAndSyncSnapshot],
  );

  const isPlayingView = gameState !== 'TITLE_MENU';

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0e111d] select-none">
      {!isPlayingView ? (
        <TitleScreen
          snapshot={snapshot}
          muted={snapshot.muted}
          onStartPlay={handleStartCampaign}
          onOpenStages={() => {
            soundEngine.unlock();
            soundEngine.playUiClick();
            setShowStages(true);
          }}
          onOpenArmory={() => {
            soundEngine.unlock();
            soundEngine.playUiClick();
            setShowArmory(true);
          }}
          onOpenLeaderboard={() => {
            soundEngine.unlock();
            soundEngine.playUiClick();
            setShowLeaderboard(true);
          }}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <div className="relative w-full h-full">
          <GameCanvas
            level={currentLevel}
            runKey={runKey}
            paused={gameState !== 'PLAYING' || showStages || showArmory || showLeaderboard}
            equippedSkins={snapshot.equippedSkins}
            qualityTier={snapshot.qualityTier}
            onHudUpdate={setHud}
            onRoundEnd={handleRoundEnd}
            onRequestPause={() =>
              setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev))
            }
            onRequestRestart={handleRestartStage}
            onToggleMute={handleToggleMute}
            worldRef={worldRef}
          />

          <GameHud
            level={currentLevel}
            bestScore={bestStageScore}
            hud={hud}
            muted={snapshot.muted}
            onToggleMute={handleToggleMute}
            onRestart={handleRestartStage}
            onPause={() => setGameState('PAUSED')}
            onToggleOverview={() => worldRef.current?.toggleCameraOverview()}
            onSkipTurn={() => worldRef.current?.skipSettlingTurn()}
            onTriggerAbility={() => worldRef.current?.activateMidAirAbility()}
          />

          <RoundModal
            gameState={gameState}
            level={currentLevel}
            result={roundResult}
            onResume={() => setGameState('PLAYING')}
            onRestart={handleRestartStage}
            onNextLevel={handleNextStage}
            onOpenStages={() => setShowStages(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onExitTitle={() => {
              setRoundResult(null);
              setGameState('TITLE_MENU');
            }}
          />
        </div>
      )}

      {showStages && (
        <StageSelectModal
          snapshot={snapshot}
          currentLevelId={currentLevelId}
          onSelectLevel={handleSelectStage}
          onClose={() => setShowStages(false)}
        />
      )}

      {showArmory && (
        <SkinArmoryModal
          snapshot={snapshot}
          onUnlockSkin={handleUnlockSkin}
          onEquipSkin={handleEquipSkin}
          onClose={() => setShowArmory(false)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          snapshot={snapshot}
          onUpdateSnapshot={updateAndSyncSnapshot}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
