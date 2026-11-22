import {useEffect, useRef, useState} from 'react';
import {Check, Coins, Lock, ShieldCheck, X} from 'lucide-react';
import {NINJA_CLASSES, NINJA_SKINS, getSkinsForNinja} from '../data/skins';
import {drawNinjaCharacter} from '../engine/renderer';
import {getTotalStars} from '../services/playGamesService';
import type {CloudSnapshot, NinjaSkinDef, NinjaType} from '../types/game';

interface SkinArmoryModalProps {
  snapshot: CloudSnapshot;
  onUnlockSkin: (skin: NinjaSkinDef) => void;
  onEquipSkin: (ninjaType: NinjaType, skinId: string) => void;
  onClose: () => void;
}

const NINJA_ORDER: NinjaType[] = ['shinobi', 'kunoichi', 'oni_buster', 'tengu'];

function SkinPreviewCanvas({
  ninjaType,
  skin,
}: {
  ninjaType: NinjaType;
  skin: NinjaSkinDef;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 160 * dpr;
    canvas.height = 120 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 160, 120);

    // Subtle dojo circle backdrop
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.arc(84, 60, 44, 0, Math.PI * 2);
    ctx.fill();

    drawNinjaCharacter(ctx, ninjaType, skin, 84, 60, 28, -0.08, 0);
  }, [ninjaType, skin]);

  return (
    <canvas
      ref={canvasRef}
      style={{width: 160, height: 120}}
      className="mx-auto block"
    />
  );
}

export function SkinArmoryModal({
  snapshot,
  onUnlockSkin,
  onEquipSkin,
  onClose,
}: SkinArmoryModalProps) {
  const [selectedNinja, setSelectedNinja] = useState<NinjaType>('shinobi');
  const skins = getSkinsForNinja(selectedNinja);
  const spec = NINJA_CLASSES[selectedNinja];
  const equippedId = snapshot.equippedSkins[selectedNinja] ?? spec.defaultSkinId;
  const totalStars = getTotalStars(snapshot);

  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90dvh] bg-[#12172a] border border-slate-700/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Shinobi Armory
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Purely cosmetic visual wraps · Identical launch physics and abilities
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-mono-num font-semibold text-amber-300">
              <Coins className="w-4 h-4" />
              <span>{snapshot.coins.toLocaleString()} Koban</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close armory"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ninja Class Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {NINJA_ORDER.map((type) => {
            const cls = NINJA_CLASSES[type];
            const active = selectedNinja === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedNinja(type)}
                className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cls.name}
              </button>
            );
          })}
        </div>

        {/* Class Mechanics Reference Note */}
        <div className="px-6 py-2.5 bg-[#0e1323] border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div>
            <span className="text-slate-400">Class Technique: </span>
            <span className="font-semibold text-amber-300">{spec.abilityName}</span>
            <span className="text-slate-500 mx-2">·</span>
            <span className="text-slate-400">{spec.abilityHint}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Cosmetic Only · 0% Stat Change</span>
          </div>
        </div>

        {/* Skin Cards */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {skins.map((skin) => {
            const unlocked = snapshot.unlockedSkins.includes(skin.id);
            const equipped = equippedId === skin.id;
            const starEligible = skin.unlockStars ? totalStars >= skin.unlockStars : false;
            const canAfford = snapshot.coins >= skin.cost;

            return (
              <div
                key={skin.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                  equipped
                    ? 'bg-[#1a223d] border-emerald-500/80'
                    : 'bg-[#171d33] border-slate-700/70'
                }`}
              >
                <div>
                  <SkinPreviewCanvas ninjaType={selectedNinja} skin={skin} />
                  <h3 className="font-display text-base font-bold text-white mt-2">
                    {skin.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{skin.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {unlocked ? (
                    equipped ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <Check className="w-4 h-4" />
                        Equipped
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEquipSkin(selectedNinja, skin.id)}
                        className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Equip Appearance
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford && !starEligible}
                      onClick={() => onUnlockSkin(skin)}
                      className={`w-full min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                        canAfford || starEligible
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {starEligible ? (
                        <>
                          <Check className="w-4 h-4" />
                          Claim Free ({skin.unlockStars}★)
                        </>
                      ) : (
                        <>
                          {canAfford ? <Coins className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          Unlock · {skin.cost} Koban
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="px-6 py-3 bg-[#0e1323] border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Unlocked Appearances: {snapshot.unlockedSkins.length} / {NINJA_SKINS.length}
          </span>
          <span>Earn Koban by clearing stages and unlocking dojo achievements</span>
        </div>
      </div>
    </div>
  );
}
