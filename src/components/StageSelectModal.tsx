import {Lock, Play, Star, X} from 'lucide-react';
import {LEVELS} from '../data/levels';
import {isStageUnlocked} from '../services/playGamesService';
import type {CloudSnapshot} from '../types/game';

interface StageSelectModalProps {
  snapshot: CloudSnapshot;
  currentLevelId: number;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export function StageSelectModal({
  snapshot,
  currentLevelId,
  onSelectLevel,
  onClose,
}: StageSelectModalProps) {
  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90dvh] bg-[#12172a] border border-slate-700/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Select Fortress Stage
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear stages in sequence to unlock deeper clan strongholds
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close stage select"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white inline-flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((lvl) => {
            const unlocked = isStageUnlocked(snapshot, lvl.id);
            const prog = snapshot.levelProgress[String(lvl.id)];
            const stars = prog?.stars ?? 0;
            const bestScore = prog?.bestScore ?? 0;
            const isCurrent = lvl.id === currentLevelId;

            return (
              <div
                key={lvl.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                  unlocked
                    ? isCurrent
                      ? 'bg-[#1a223d] border-rose-500/70'
                      : 'bg-[#171d33] border-slate-700/70 hover:border-slate-500'
                    : 'bg-[#101424] border-slate-800/80 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>
                      Stage {lvl.id} · {lvl.region}
                    </span>
                    <div className="flex items-center gap-0.5" aria-label={`${stars} of 3 stars`}>
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white mb-1">{lvl.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{lvl.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/90">
                  <div className="text-xs">
                    <span className="text-slate-400 block">Personal Best</span>
                    <span className="font-mono-num font-semibold text-slate-100">
                      {bestScore > 0 ? bestScore.toLocaleString() : '—'}
                    </span>
                  </div>

                  {unlocked ? (
                    <button
                      type="button"
                      onClick={() => onSelectLevel(lvl.id)}
                      className="min-h-[40px] px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Deploy
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
