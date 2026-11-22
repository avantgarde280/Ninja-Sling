import {Eye, FastForward, Pause, RotateCcw, Volume2, VolumeX, Zap} from 'lucide-react';
import {NINJA_CLASSES} from '../data/skins';
import type {HudSnapshot, LevelDef} from '../types/game';

interface GameHudProps {
  level: LevelDef;
  bestScore: number;
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
  onToggleOverview: () => void;
  onSkipTurn: () => void;
  onTriggerAbility: () => void;
}

export function GameHud({
  level,
  bestScore,
  hud,
  muted,
  onToggleMute,
  onRestart,
  onPause,
  onToggleOverview,
  onSkipTurn,
  onTriggerAbility,
}: GameHudProps) {
  const activeSpec = hud.activeNinja ? NINJA_CLASSES[hud.activeNinja] : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Perimeter Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Stage & Score */}
        <div className="bg-[#0e1324]/88 border border-slate-700/70 rounded-xl px-4 py-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <span className="text-rose-400 font-semibold">Stage {level.id}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="truncate max-w-[160px] sm:max-w-none">{level.name}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="font-mono-num text-emerald-300">
              {hud.enemiesRemaining}/{hud.enemiesTotal} Targets
            </span>
          </div>
          <div className="flex items-baseline gap-4 mt-0.5">
            <span className="font-mono-num text-xl sm:text-2xl font-bold text-white tracking-tight">
              {hud.score.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono-num">
              Best {Math.max(bestScore, hud.score).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: Touch-sized Action Controls (>= 44px) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleOverview}
            aria-label="Toggle fortress overview"
            title="Toggle Camera Overview"
            className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              hud.cameraMode === 'overview'
                ? 'bg-amber-500/90 border-amber-400 text-slate-950'
                : 'bg-[#0e1324]/88 border-slate-700/70 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Scout</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0e1324]/88 border border-slate-700/70 text-slate-200 hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onRestart}
            aria-label="Restart stage"
            title="Restart Stage (R)"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0e1324]/88 border border-slate-700/70 text-slate-200 hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            title="Pause (Esc)"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0e1324]/88 border border-slate-700/70 text-slate-200 hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Perimeter Strip: Active Ninja Skill & Flight Controls */}
      <div className="flex items-end justify-between gap-3">
        {activeSpec ? (
          <div className="bg-[#0e1324]/88 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-slate-200 max-w-md">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span>{activeSpec.name}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-amber-300">{activeSpec.abilityName}</span>
            </div>
            <p className="text-slate-400 mt-0.5">{activeSpec.abilityHint}</p>
          </div>
        ) : (
          <div />
        )}

        <div className="pointer-events-auto flex items-center gap-2">
          {hud.inFlight && hud.abilityAvailable && activeSpec && (
            <button
              type="button"
              onClick={onTriggerAbility}
              className="min-h-[46px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap className="w-4 h-4" />
              {activeSpec.abilityName}
            </button>
          )}
          {hud.canSkipTurn && (
            <button
              type="button"
              onClick={onSkipTurn}
              className="min-h-[46px] px-4 py-2 rounded-xl bg-[#0e1324]/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <FastForward className="w-4 h-4" />
              Next Ninja
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
