import {useEffect, useRef} from 'react';
import {PhysicsWorld} from '../engine/physicsWorld';
import {WorldRenderer} from '../engine/renderer';
import {soundEngine} from '../engine/soundEngine';
import {resolveEffectiveDpr} from '../services/playGamesService';
import type {HudSnapshot, LevelDef, NinjaType, QualityTier} from '../types/game';

interface GameCanvasProps {
  level: LevelDef;
  runKey: number;
  paused: boolean;
  equippedSkins: Record<NinjaType, string>;
  qualityTier: QualityTier;
  onHudUpdate: (hud: HudSnapshot) => void;
  onRoundEnd: (result: {
    won: boolean;
    destructionScore: number;
    unusedNinjas: number;
    tntTriggered: boolean;
  }) => void;
  onRequestPause: () => void;
  onRequestRestart: () => void;
  onToggleMute: () => void;
  worldRef: React.MutableRefObject<PhysicsWorld | null>;
}

export function GameCanvas({
  level,
  runKey,
  paused,
  equippedSkins,
  qualityTier,
  onHudUpdate,
  onRoundEnd,
  onRequestPause,
  onRequestRestart,
  onToggleMute,
  worldRef,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const dragStateRef = useRef<{
    pointerId: number | null;
    mode: 'aim' | 'pan' | null;
    lastClientX: number;
  }>({pointerId: null, mode: null, lastClientX: 0});

  // Update skins/quality live without resetting level if changed in settings
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.equippedSkins = equippedSkins;
      worldRef.current.qualityTier = qualityTier;
    }
  }, [equippedSkins, qualityTier, worldRef]);

  // Initialize PhysicsWorld per level + runKey
  useEffect(() => {
    const world = new PhysicsWorld(level, equippedSkins, qualityTier, {
      onHudUpdate,
      onRoundEnd,
    });
    worldRef.current = world;
    if (!rendererRef.current) {
      rendererRef.current = new WorldRenderer();
    }

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const rawDt = Math.max(0, (now - lastTime) / 1000);
      lastTime = now;

      if (!pausedRef.current) {
        world.step(rawDt);
      }

      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (canvas && renderer) {
        const rect = canvas.getBoundingClientRect();
        const dpr = resolveEffectiveDpr(world.qualityTier);
        const targetW = Math.max(1, Math.floor(rect.width * dpr));
        const targetH = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d', {alpha: false});
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderer.render(ctx, world, rect.width, rect.height);
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      world.destroy();
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, runKey]);

  // Keyboard shortcuts + window blur safety
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onRequestPause();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRequestRestart();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleMute();
        return;
      }
      if (e.key === ' ' && !pausedRef.current) {
        e.preventDefault();
        soundEngine.unlock();
        const world = worldRef.current;
        if (!world) return;
        if (!world.activateMidAirAbility()) {
          world.skipSettlingTurn();
        }
      }
    };

    const onBlur = () => {
      if (worldRef.current?.isAiming) {
        worldRef.current.releaseAim();
      }
      dragStateRef.current = {pointerId: null, mode: null, lastClientX: 0};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onBlur);
    };
  }, [onRequestPause, onRequestRestart, onToggleMute, worldRef]);

  const clientToWorld = (clientX: number, clientY: number): {x: number; y: number} | null => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    const world = worldRef.current;
    if (!canvas || !renderer || !world) return null;
    const rect = canvas.getBoundingClientRect();
    const {scale, offsetX, offsetY} = renderer.getCameraTransform(world, rect.width, rect.height);
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pausedRef.current) return;
    soundEngine.unlock();
    const world = worldRef.current;
    if (!world || world.roundEnded) return;

    // If a ninja is currently flying, tapping triggers its ability!
    if (world.activeFlightNinjas.length > 0) {
      world.activateMidAirAbility();
      return;
    }

    const pt = clientToWorld(e.clientX, e.clientY);
    if (!pt) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    if (world.startAim(pt.x, pt.y)) {
      dragStateRef.current = {pointerId: e.pointerId, mode: 'aim', lastClientX: e.clientX};
    } else {
      dragStateRef.current = {pointerId: e.pointerId, mode: 'pan', lastClientX: e.clientX};
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== e.pointerId || !drag.mode) return;
    const world = worldRef.current;
    if (!world) return;

    if (drag.mode === 'aim') {
      const pt = clientToWorld(e.clientX, e.clientY);
      if (pt) world.updateAim(pt.x, pt.y);
    } else if (drag.mode === 'pan') {
      const dx = drag.lastClientX - e.clientX;
      drag.lastClientX = e.clientX;
      world.panCamera(dx * 1.15);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (drag.pointerId !== e.pointerId) return;
    if (drag.mode === 'aim') {
      worldRef.current?.releaseAim();
    }
    dragStateRef.current = {pointerId: null, mode: null, lastClientX: 0};
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="block w-full h-full touch-none select-none cursor-crosshair"
    />
  );
}
