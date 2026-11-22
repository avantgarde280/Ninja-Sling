import {ArrowRight, Coins, Home, Play, RotateCcw, Star, Trophy} from 'lucide-react';
import {LEVELS} from '../data/levels';
import type {GameState, LevelDef, RoundResult} from '../types/game';

interface RoundModalProps {
  gameState: GameState;
  level: LevelDef;
  result: RoundResult | null;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onOpenStages: () => void;
  onOpenLeaderboard: () => void;
  onExitTitle: () => void;
}

export function RoundModal({
  gameState,
  level,
  result,
  onResume,
  onRestart,
  onNextLevel,
  onOpenStages,
  onOpenLeaderboard,
  onExitTitle,
}: RoundModalProps) {
  if (gameState !== 'PAUSED' && gameState !== 'ROUND_SUMMARY' && gameState !== 'GAME_OVER') {
    return null;
  }

  const hasNextLevel = LEVELS.some((l) => l.id === level.id + 1);

  if (gameState === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#12172a] border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
          <p className="text-xs text-slate-400 mb-1">
            Stage {level.id} · {level.region}
          </p>
          <h2 className="font-display text-2xl font-bold text-white mb-5">Game Paused</h2>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Stage
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Stage
            </button>

            <button
              type="button"
              onClick={onOpenStages}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              Select Stage
            </button>

            <button
              type="button"
              onClick={onExitTitle}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const won = Boolean(result?.won);

  return (
    <div className="fixed inset-0 z-30 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12172a] border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
        <p className="text-xs text-slate-400">
          Stage {level.id} · {level.name}
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-0.5">
          {won ? 'Fortress Shattered' : 'Target Remains Standing'}
        </h2>

        {won && result && (
          <>
            {/* Star Reveal */}
            <div className="flex items-center justify-center gap-3 my-5">
              {[1, 2, 3].map((idx) => {
                const earned = idx <= result.stars;
                return (
                  <Star
                    key={idx}
                    className={`w-10 h-10 transition-transform ${
                      earned ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Score Breakdown */}
            <div className="bg-[#0e1323] border border-slate-800 rounded-xl p-4 space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between text-slate-300">
                <span>Destruction Score</span>
                <span className="font-mono-num font-semibold">
                  {result.destructionScore.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Reserve Ninja Bonus</span>
                <span className="font-mono-num font-semibold text-emerald-400">
                  +{result.unusedNinjaBonus.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-white font-bold text-base">
                <span>
                  Final Score {result.newBest ? '· New Best' : ''}
                </span>
                <span className="font-mono-num text-amber-300">
                  {result.totalScore.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-300 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  Koban Earned
                </span>
                <span className="font-mono-num font-semibold">+{result.coinsEarned}</span>
              </div>
            </div>

            {result.newlyUnlockedAchievements.length > 0 && (
              <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-xl px-4 py-2.5 mb-4 text-xs text-emerald-200">
                <span className="font-semibold block">
                  Achievement Unlocked: {result.newlyUnlockedAchievements.map((a) => a.name).join(', ')}
                </span>
              </div>
            )}
          </>
        )}

        {!won && (
          <p className="text-sm text-slate-300 my-4 leading-relaxed">
            Your ninja squad ran out of throws before clearing all targets. Scout the weakest pillars
            or trigger powder kegs for chain collapses.
          </p>
        )}

        <div className="flex flex-col gap-2.5 mt-4">
          {won && hasNextLevel && (
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              Next Stage
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className={`min-h-[46px] px-5 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${
              won && hasNextLevel
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              Scoreboard
            </button>

            <button
              type="button"
              onClick={onExitTitle}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Title Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
