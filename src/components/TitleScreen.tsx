import {useEffect} from 'react';
import {Award, Map, Play, Shield, Trophy, Volume2, VolumeX} from 'lucide-react';
import type {CloudSnapshot} from '../types/game';
import {getTotalCampaignScore, getTotalStars} from '../services/playGamesService';
import {LEVELS} from '../data/levels';

const TITLE_BACKDROP = '/src/assets/images/ninja_dojo_title_backdrop_1795310074795.jpg';

const MAPLE_LEAVES = [
  {left: '8%', delay: '0s', duration: '11s', size: 14},
  {left: '22%', delay: '-3.5s', duration: '13s', size: 12},
  {left: '37%', delay: '-7s', duration: '10.5s', size: 15},
  {left: '58%', delay: '-2s', duration: '12.5s', size: 11},
  {left: '74%', delay: '-5.2s', duration: '11.5s', size: 13},
  {left: '88%', delay: '-8.4s', duration: '14s', size: 12},
];

interface TitleScreenProps {
  snapshot: CloudSnapshot;
  muted: boolean;
  onStartPlay: () => void;
  onOpenStages: () => void;
  onOpenArmory: () => void;
  onOpenLeaderboard: () => void;
  onToggleMute: () => void;
}

export function TitleScreen({
  snapshot,
  muted,
  onStartPlay,
  onOpenStages,
  onOpenArmory,
  onOpenLeaderboard,
  onToggleMute,
}: TitleScreenProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartPlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStartPlay]);

  const totalScore = getTotalCampaignScore(snapshot);
  const totalStars = getTotalStars(snapshot);
  const maxStars = LEVELS.length * 3;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#121629] text-slate-100 flex flex-col justify-between">
      {/* Illustrated Key-Art Backdrop */}
      <img
        src={TITLE_BACKDROP}
        alt="Twilight Japanese mountain fortress and pagoda"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-right select-none pointer-events-none"
      />

      {/* Measured contrast scrim on the left negative space */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#0c1020]/95 via-[#0c1020]/70 to-[#0c1020]/20 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#0c1020]/85 via-transparent to-[#0c1020]/45 pointer-events-none"
      />

      {/* Ambient drifting maple leaves */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {MAPLE_LEAVES.map((leaf, idx) => (
          <svg
            key={idx}
            viewBox="0 0 24 24"
            style={{
              left: leaf.left,
              width: leaf.size,
              height: leaf.size,
              ['--leaf-delay' as string]: leaf.delay,
              ['--leaf-duration' as string]: leaf.duration,
            }}
            className="absolute -top-6 text-rose-500/80 leaf-drift"
            fill="currentColor"
          >
            <path d="M12 2L14.2 7.5L19.5 6.2L16.2 10.8L21 13.5L15.4 14.8L16.5 20L12.6 16.5L12 22L11.4 16.5L7.5 20L8.6 14.8L3 13.5L7.8 10.8L4.5 6.2L9.8 7.5L12 2Z" />
          </svg>
        ))}
      </div>

      {/* Top utility row */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-10 pt-5">
        <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
          <span className="text-slate-100 font-semibold">{snapshot.playerName}</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="font-mono-num text-amber-300">{snapshot.coins.toLocaleString()} Koban</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="font-mono-num text-slate-300">
            {totalStars}/{maxStars} Stars
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-slate-900/80 border border-slate-700/70 text-slate-200 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Focal Lockup over calm left sky */}
      <main className="relative z-10 px-6 sm:px-12 lg:px-16 max-w-2xl my-auto">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-4">
          <svg
            viewBox="0 0 460 118"
            className="w-full max-w-[420px] h-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.65)]"
            role="img"
            aria-label="Kage Sling"
          >
            {/* Shuriken Emblem */}
            <g transform="translate(46, 58)">
              <circle cx="0" cy="0" r="36" fill="#181d33" stroke="#e11d48" strokeWidth="3.5" />
              <path
                d="M0 -28 L8 -8 L28 0 L8 8 L0 28 L-8 8 L-28 0 L-8 -8 Z"
                fill="#f8fafc"
              />
              <circle cx="0" cy="0" r="7" fill="#e11d48" />
            </g>
            {/* Wordmark */}
            <text
              x="102"
              y="62"
              fill="#f8fafc"
              fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
              fontWeight="800"
              fontSize="54"
              letterSpacing="-1.5"
            >
              KAGE SLING
            </text>
            <text
              x="104"
              y="92"
              fill="#fda4af"
              fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
              fontWeight="600"
              fontSize="16"
              letterSpacing="3.5"
            >
              SHADOW FORTRESS DEMOLITION
            </text>
          </svg>
        </div>

        <p className="text-slate-200/90 text-sm sm:text-base max-w-lg leading-relaxed mb-7">
          Launch four distinct ninja specialists from your yumi slingshot, trigger mid-air shinobi
          techniques, and shatter fortified clan strongholds with realistic rigid-body physics.
        </p>

        {/* Primary CTA + Secondary Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            type="button"
            onClick={onStartPlay}
            className="min-h-[48px] px-7 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-semibold text-base inline-flex items-center gap-2.5 shadow-lg shadow-rose-950/50 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-5 h-5 fill-current" />
            Play Campaign
          </button>

          <button
            type="button"
            onClick={onOpenStages}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-medium text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Map className="w-4 h-4 text-amber-400" />
            Stages
          </button>

          <button
            type="button"
            onClick={onOpenArmory}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-medium text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            Skins Armory
          </button>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-medium text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            Leaderboard & Sync
          </button>
        </div>

        {/* Campaign Best Summary */}
        {totalScore > 0 && (
          <div className="inline-flex items-center gap-3 text-xs sm:text-sm text-slate-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Campaign High Score</span>
            <span className="font-mono-num font-bold text-white">{totalScore.toLocaleString()}</span>
          </div>
        )}
      </main>

      {/* Single flat control-hint line */}
      <footer className="relative z-10 px-6 sm:px-12 pb-5 pt-2">
        <p className="text-xs sm:text-sm text-slate-300/85 tracking-wide">
          Drag Slingshot to Aim · Release to Launch · Tap or Space for Ninja Skill · Esc Pause
        </p>
      </footer>
    </div>
  );
}
