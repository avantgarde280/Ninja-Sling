import {useEffect, useState} from 'react';
import {Award, Cloud, CloudDownload, RefreshCw, Smartphone, Trophy, X} from 'lucide-react';
import {ACHIEVEMENTS, LEVELS} from '../data/levels';
import {
  fetchLeaderboard,
  isNativePlayGamesAvailable,
  restoreCloudSaveDown,
  syncCloudSaveUp,
} from '../services/playGamesService';
import type {CloudSnapshot, LeaderboardEntry, QualityTier} from '../types/game';

interface LeaderboardModalProps {
  snapshot: CloudSnapshot;
  onUpdateSnapshot: (next: CloudSnapshot) => void;
  onClose: () => void;
}

export function LeaderboardModal({
  snapshot,
  onUpdateSnapshot,
  onClose,
}: LeaderboardModalProps) {
  const [tab, setTab] = useState<'scores' | 'achievements' | 'sync'>('scores');
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [playerNameInput, setPlayerNameInput] = useState(snapshot.playerName);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  const nativePlayGames = isNativePlayGamesAvailable();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard(selectedLevel).then((list) => {
      if (!cancelled) {
        setEntries(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedLevel]);

  const handleSaveNameAndSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    const cleanName = playerNameInput.trim().slice(0, 24) || 'RoninPlayer';
    const next = await syncCloudSaveUp({
      ...snapshot,
      playerName: cleanName,
    });
    onUpdateSnapshot(next);
    setSyncing(false);
    setSyncMessage('Cloud snapshot synced.');
  };

  const handleRestoreCloud = async () => {
    setSyncing(true);
    setSyncMessage('');
    const restored = await restoreCloudSaveDown(snapshot.playerId);
    setSyncing(false);
    if (restored) {
      onUpdateSnapshot(restored);
      setPlayerNameInput(restored.playerName);
      setSyncMessage('Restored latest cloud save.');
    } else {
      setSyncMessage('No remote snapshot found for this player ID yet.');
    }
  };

  const handleQualityChange = async (tier: QualityTier) => {
    const updated = await syncCloudSaveUp({
      ...snapshot,
      qualityTier: tier,
    });
    onUpdateSnapshot(updated);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90dvh] bg-[#12172a] border border-slate-700/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Scoreboard & Play Games Sync
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {nativePlayGames
                ? 'Connected to Google Play Games Services'
                : 'Cloud Leaderboard · Play Games Bridge Ready'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scoreboard"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white inline-flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('scores')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              tab === 'scores'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            High Scores
          </button>

          <button
            type="button"
            onClick={() => setTab('achievements')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              tab === 'achievements'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            Achievements ({snapshot.achievements.length}/{ACHIEVEMENTS.length})
          </button>

          <button
            type="button"
            onClick={() => setTab('sync')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              tab === 'sync'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Cloud Save & Android Perf
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {tab === 'scores' && (
            <div>
              {/* Stage Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLevel(0)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedLevel === 0
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  Campaign Total
                </button>
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedLevel === lvl.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    Stage {lvl.id}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Loading scoreboard...
                </div>
              ) : entries.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No scores recorded for this stage yet. Complete a run to claim first place.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th className="py-2.5 px-3 font-medium">Rank</th>
                        <th className="py-2.5 px-3 font-medium">Shinobi</th>
                        <th className="py-2.5 px-3 font-medium">Service</th>
                        <th className="py-2.5 px-3 font-medium text-right">Stars</th>
                        <th className="py-2.5 px-3 font-medium text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {entries.map((entry, idx) => {
                        const isSelf = entry.playerId === snapshot.playerId;
                        return (
                          <tr
                            key={entry.id}
                            className={isSelf ? 'bg-rose-950/35 text-white' : 'text-slate-200'}
                          >
                            <td className="py-3 px-3 font-mono-num font-bold text-slate-300">
                              #{idx + 1}
                            </td>
                            <td className="py-3 px-3 font-semibold">
                              {entry.playerName}
                              {isSelf && (
                                <span className="ml-2 text-xs text-rose-400 font-normal">(You)</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-400">
                              {entry.provider === 'google_play_games'
                                ? 'Play Games'
                                : 'Web Cloud'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono-num text-amber-300">
                              {entry.stars}★
                            </td>
                            <td className="py-3 px-3 text-right font-mono-num font-bold">
                              {entry.score.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'achievements' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = snapshot.achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`rounded-xl border p-4 flex items-start justify-between gap-3 ${
                      unlocked
                        ? 'bg-[#1a223d] border-emerald-600/60'
                        : 'bg-[#101424] border-slate-800 opacity-75'
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-sm text-white">{ach.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono-num font-semibold block ${
                          unlocked ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {unlocked ? 'Unlocked' : `+${ach.rewardCoins} Koban`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'sync' && (
            <div className="space-y-6">
              {/* Profile & Cloud Save Section */}
              <div className="bg-[#0e1323] border border-slate-800 rounded-xl p-5">
                <h3 className="font-display text-lg font-bold text-white mb-1">
                  Player Profile & Cloud Save
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Synced automatically after each stage. Last sync:{' '}
                  <span className="font-mono-num text-slate-300">
                    {new Date(snapshot.lastSyncedAt).toLocaleString()}
                  </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <input
                    type="text"
                    value={playerNameInput}
                    maxLength={24}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="Enter shinobi handle"
                    className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#161c33] border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSaveNameAndSync}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    Sync Cloud Save
                  </button>
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleRestoreCloud}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <CloudDownload className="w-4 h-4" />
                    Restore
                  </button>
                </div>

                {syncMessage && (
                  <p className="text-xs text-emerald-400 font-medium">{syncMessage}</p>
                )}
              </div>

              {/* Android Performance & Touch Optimization */}
              <div className="bg-[#0e1323] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-display text-lg font-bold text-white">
                    Android & Low-End Hardware Performance
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Controls canvas resolution scaling (DPR cap) and pooled particle density for steady
                  60fps on budget Android devices.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        id: 'auto',
                        title: 'Auto Adaptive',
                        desc: 'Caps DPR at 1.35x on touch screens',
                      },
                      {
                        id: 'performance',
                        title: '60fps Battery Saver',
                        desc: '1.0x DPR & lighter particle bursts',
                      },
                      {
                        id: 'high',
                        title: 'High Visuals',
                        desc: 'Up to 2.0x Retina DPR & full bursts',
                      },
                    ] as const
                  ).map((opt) => {
                    const active = snapshot.qualityTier === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleQualityChange(opt.id)}
                        className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1a223d] border-emerald-500 text-white'
                            : 'bg-[#141a30] border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-sm font-semibold">{opt.title}</div>
                        <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
