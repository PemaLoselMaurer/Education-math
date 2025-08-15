  // Restore handleClearClick for the clear button
"use client";
import React, { useRef, useEffect, useState } from "react";
import * as Phaser from "phaser";

// Phaser Scene for the bubble/dot game
class BubbleGame extends Phaser.Scene {
  width: number;
  height: number;
  dots!: Phaser.GameObjects.Group;
  dotMode: boolean = false;
  dotCount: number = 0;
  maxShots: number = 20;
  playLaserSound: (() => void) | null = null;
  mode: 'add' | 'remove' | 'addGroup' = 'add';
  groupSize: number = 1;
  dotColor: number = 0x60a5fa;
  // Keep references to window event handlers so we can remove them on shutdown
  _onGunToggle?: (e: Event) => void;
  _onClearDots?: () => void;
  _onSetMode?: (e: Event) => void;
  _onSeedDots?: (e: Event) => void;
  _onSetMaxShots?: (e: Event) => void;
  _onSetDotColor?: (e: Event) => void;

  constructor(width: number, height: number, playLaserSound: (() => void) | null) {
    super({ key: "BubbleGame" });
    this.width = width;
    this.height = height;
    this.playLaserSound = playLaserSound;
  }

  preload() {
    this.load.image('gun', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect x="10" y="18" width="40" height="10" rx="4" fill="%231976d2"/><rect x="40" y="14" width="10" height="18" rx="3" fill="%233b82f6"/><rect x="5" y="22" width="10" height="6" rx="2" fill="%234ade80"/></svg>');
    this.load.image('gamebg', '/game.png');
  }

  create() {
  const bg = this.add.image(this.width / 2, this.height / 2, 'gamebg');
  bg.setName('bg');
    bg.setDisplaySize(this.width, this.height);
    bg.setDepth(-10);
    this.dots = this.add.group();
    this.dotMode = false;

    this._onGunToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ selected: boolean }>;
      this.dotMode = !!(customEvent.detail && customEvent.detail.selected);
      if (this.input) this.input.enabled = this.dotMode;
    };
    window.addEventListener('phaser-gun-toggle', this._onGunToggle);

  this._onClearDots = () => {
      const group = this.dots as Phaser.GameObjects.Group | undefined;
      try {
        if (
          group &&
          typeof group.clear === 'function' &&
          typeof group.getLength === 'function' &&
          group.getLength() > 0
        ) {
          group.clear(true, true);
        }
    // Always reset internal count on clear so new rounds can add dots
    this.dotCount = 0;
    // Notify parent to refresh displayed dot count
    window.dispatchEvent(new CustomEvent('phaser-dot-created'));
      } catch {
        // ignore
      }
    };
    window.addEventListener('phaser-clear-dots', this._onClearDots);

    this._onSetMode = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: 'add' | 'remove' | 'addGroup'; groupSize?: number }>;
      const m = customEvent.detail?.mode;
      if (m === 'add' || m === 'remove' || m === 'addGroup') {
        this.mode = m;
        if (m === 'addGroup') {
          const gs = customEvent.detail?.groupSize;
          this.groupSize = typeof gs === 'number' && gs > 0 ? Math.min(10, Math.floor(gs)) : 2;
        }
      }
    };
    window.addEventListener('phaser-set-mode', this._onSetMode);

    this._onSeedDots = (e: Event) => {
      // If scene is no longer active, ignore
      if (!this.sys || !this.add || !this.dots) return;
      const customEvent = e as CustomEvent<{ count: number }>;
      const count = Math.max(0, Math.min(12, customEvent.detail?.count ?? 0));
      try {
        if (this.dots && typeof this.dots.clear === 'function') this.dots.clear(true, true);
      } catch {}
      const cols = Math.ceil(Math.sqrt(Math.max(1, count)));
      const padding = 56;
      const startX = Math.max(40, this.width / 2 - ((cols - 1) * padding) / 2);
      const startY = Math.max(80, this.height / 2 - ((cols - 1) * padding) / 2);
      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const dot = this.add.circle(startX + c * padding, startY + r * padding, 18, this.dotColor, 0.95);
        dot.setStrokeStyle(3, 0xffffff, 0.95);
        dot.setDepth(10);
        this.dots.add(dot);
      }
      this.dotCount = count;
      window.dispatchEvent(new CustomEvent('phaser-dot-created'));
      window.dispatchEvent(new Event('phaser-seeded'));
    };
    window.addEventListener('phaser-seed-dots', this._onSeedDots);

    // Handle dot color changes from UI
    this._onSetDotColor = (e: Event) => {
      const ce = e as CustomEvent<{ color: number }>;
      const col = ce.detail?.color;
      if (typeof col === 'number') {
  // Update default color for future dots only; existing dots keep their color
  this.dotColor = col;
      }
    };
    window.addEventListener('phaser-set-dot-color', this._onSetDotColor);

    this._onSetMaxShots = (e: Event) => {
      const customEvent = e as CustomEvent<{ max: number }>;
      const m = Math.max(0, Math.floor(customEvent.detail?.max ?? 0));
      if (m > 0) {
        this.maxShots = m;
        // If dotMode is on, ensure input is enabled for immediate effect
        if (this.input) this.input.enabled = this.dotMode;
      }
    };
    window.addEventListener('phaser-set-max-shots', this._onSetMaxShots);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.dotMode) return;
      if (this.mode === 'add') {
        if (this.dotCount >= (this.maxShots || 3)) return;
        this.dotCount++;
  if (!this.add) return;
  const dot = this.add.circle(pointer.x, pointer.y, 18, this.dotColor, 0.95);
        dot.setStrokeStyle(3, 0xffffff, 0.95);
        dot.setDepth(10);
        this.dots.add(dot);
        if (this.playLaserSound) this.playLaserSound();
        window.dispatchEvent(new CustomEvent('phaser-dot-created'));
  window.dispatchEvent(new Event('phaser-user-dot'));
        if (this.dotCount === (this.maxShots || 3)) {
          window.dispatchEvent(new CustomEvent('phaser-max-dots', { detail: { answer: 4 } }));
        }
      } else if (this.mode === 'addGroup') {
        // Add a small cluster of dots near the pointer
        const gs = Math.max(1, this.groupSize || 2);
        const radius = 18;
        for (let i = 0; i < gs; i++) {
          const angle = (i / gs) * Math.PI * 2;
          const r = 20 + (i % 2) * 6;
          const dx = Math.cos(angle) * r;
          const dy = Math.sin(angle) * r;
          if (!this.add) return;
          const dot = this.add.circle(pointer.x + dx, pointer.y + dy, radius, this.dotColor, 0.95);
          dot.setStrokeStyle(3, 0xffffff, 0.95);
          dot.setDepth(10);
          this.dots.add(dot);
        }
        this.dotCount = (this.dots.getLength?.() as number) || (this.dotCount + gs);
        if (this.playLaserSound) this.playLaserSound();
        window.dispatchEvent(new CustomEvent('phaser-dot-created'));
  window.dispatchEvent(new Event('phaser-user-dot'));
      } else {
        const children = (this.dots.getChildren?.() ?? []) as Phaser.GameObjects.GameObject[];
        if (!children.length) return;
        let nearest: Phaser.GameObjects.GameObject | null = null;
        let minD = Infinity;
        for (const obj of children) {
          const arc = obj as Phaser.GameObjects.Arc;
          const x = arc.x ?? 0;
          const y = arc.y ?? 0;
          const d = (x - pointer.x) * (x - pointer.x) + (y - pointer.y) * (y - pointer.y);
          if (d < minD) { minD = d; nearest = obj; }
        }
        if (nearest) {
          (nearest as Phaser.GameObjects.Arc).destroy?.();
          this.dotCount = Math.max(0, this.dotCount - 1);
          if (this.playLaserSound) this.playLaserSound();
          window.dispatchEvent(new CustomEvent('phaser-dot-created'));
          window.dispatchEvent(new Event('phaser-user-dot'));
        }
      }
    });

// (No React hooks in Phaser class)
    // Notify React that Phaser scene is ready to accept commands
    try {
      window.dispatchEvent(new Event('phaser-ready'));
    } catch {}
    // Cleanup window listeners when the scene shuts down or is destroyed
    const removeAll = () => {
      if (this._onGunToggle) window.removeEventListener('phaser-gun-toggle', this._onGunToggle);
      if (this._onClearDots) window.removeEventListener('phaser-clear-dots', this._onClearDots);
      if (this._onSetMode) window.removeEventListener('phaser-set-mode', this._onSetMode);
      if (this._onSeedDots) window.removeEventListener('phaser-seed-dots', this._onSeedDots);
      if (this._onSetMaxShots) window.removeEventListener('phaser-set-max-shots', this._onSetMaxShots);
  if (this._onSetDotColor) window.removeEventListener('phaser-set-dot-color', this._onSetDotColor);
    };
    this.events.once('shutdown', removeAll);
    this.events.once('destroy', removeAll);
  }
}

const overlayBarHeight = 56;
type GameEvent = string | { type: string; [key: string]: unknown };
interface PhaserBubbleGameProps {
  onGameEvent?: (event: GameEvent) => void;
  lessonStep?: number;
  showAnswerBox?: boolean;
  onAnswer?: (answer: number) => void;
  extraDotMode?: boolean;
  maxExtraDots?: number;
  shootMode?: 'add' | 'remove' | 'addGroup';
}

const PhaserBubbleGame: React.FC<PhaserBubbleGameProps> = ({ onGameEvent, lessonStep, showAnswerBox, onAnswer, extraDotMode, maxExtraDots, shootMode = 'add' }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const laserAudioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Function to play the laser sound
  const playLaserSound = () => {
    const audio = laserAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  };
  const [gunSelected, setGunSelected] = useState(false);
  const [subGunSelected, setSubGunSelected] = useState(false);
  // Removed unused lasersFired and puzzleAnswered state
  const [clearDown, setClearDown] = useState(false);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  // Dot color state (UI) and palette
  // Allowed colors: blue, green, red
  const dotColors = useRef<number[]>([0x60a5fa, 0x34d399, 0xef4444]);
  const [dotColorIdx, setDotColorIdx] = useState(0);
  // Center menu state for the middle navbar button
  const [showCenterMenu, setShowCenterMenu] = useState(false);
  const centerMenuRef = useRef<HTMLDivElement | null>(null);
  // Track current dot count locally for display
  const [dotCount, setDotCount] = useState<number>(0);

  // Restore handleClearClick for the clear button (now inside component, after state/refs)
  const handleClearClick = () => {
    if (clearDown) return;
    setClearDown(true);
    window.dispatchEvent(new Event('phaser-clear-dots'));
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    clearTimeoutRef.current = setTimeout(() => {
      setClearDown(false);
    }, 1500);
    if (lessonStep === 2 && onGameEvent) {
      onGameEvent('correct');
    }
  };

  // Always enable gun and dotMode in shooting steps, and sync Phaser scene state
  useEffect(() => {
    const game = gameInstanceRef.current;
    if (!game) return;
    const scene = game.scene.keys['BubbleGame'] as BubbleGame | undefined;
    if (!scene) return;

    if (extraDotMode) {
      setGunSelected(true);
      // Always sync dotCount to the number of dots in the group
      let actualCount = 0;
      if (scene.dots && typeof scene.dots.getLength === 'function') {
        actualCount = scene.dots.getLength();
        scene.dotCount = actualCount;
      }
      scene.maxShots = (actualCount) + 1;
      scene.dotMode = true;
      // Force Phaser to update input state
      if (scene.input) scene.input.enabled = true;
      // Force gun visually enabled
      window.dispatchEvent(new CustomEvent('phaser-gun-toggle', { detail: { selected: true } }));
    }
  }, [lessonStep, extraDotMode, maxExtraDots]);

  // Sync shoot mode from prop
  useEffect(() => {
    if (shootMode === 'add' || shootMode === 'remove' || shootMode === 'addGroup') {
      window.dispatchEvent(new CustomEvent('phaser-set-mode', { detail: { mode: shootMode } }));
    }
  }, [shootMode]);

  useEffect(() => {
  if (!gameRef.current) return;
    if (gameInstanceRef.current) return;
  // Use container width as a safer initial size; fall back to sane defaults
  const initialContainer = containerRef.current;
  const width = Math.max(2, Math.floor((initialContainer?.clientWidth ?? gameRef.current.offsetWidth) || 800));
  const height = Math.max(2, Math.floor((initialContainer?.clientHeight ?? gameRef.current.offsetHeight) || 450));
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: gameRef.current,
      backgroundColor: '#0a2233',
      scene: [new BubbleGame(width, height, playLaserSound)],
      physics: { default: 'arcade' },
      audio: { noAudio: true },
    };
    gameInstanceRef.current = new Phaser.Game(config);
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  // Resize observer to make the game responsive to container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      // Compute width with fallbacks; if width is 0, bail until layout stabilizes
      const contW = Math.floor(cr.width || el.clientWidth || el.offsetWidth || 0);
      if (!contW || contW < 2) {
        return; // avoid resizing Phaser to 0 which breaks WebGL FBO
      }
      // Keep a ~16:9 playable area and cap height; enforce a sensible minimum
      const desired = Math.min((contW * 9) / 16, 480);
      const nextH = Math.floor(Math.max(320, desired));
      setContainerHeight(nextH);
      // Resize Phaser instance
      const game = gameInstanceRef.current;
      if (game) {
        const newW = contW;
        const newH = nextH;
        if (newW >= 2 && newH >= 2) {
          // Only resize if dimensions actually changed to reduce churn
          if (game.scale.width !== newW || game.scale.height !== newH) {
            game.scale.resize(newW, newH);
          }
          // Update scene background to fill
          const scene = game.scene.keys['BubbleGame'] as BubbleGame | undefined;
          if (scene) {
            scene.width = newW;
            scene.height = newH;
            const bg = scene.children.getByName?.('bg') as Phaser.GameObjects.Image | undefined;
            if (bg) {
              bg.setDisplaySize(newW, newH);
              bg.setPosition(newW / 2, newH / 2);
            }
          }
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track dot count and notify parent on each dot created
  useEffect(() => {
    if (!gameRef.current) return;
    const recomputeCount = () => {
      // Count the number of dots currently in the Phaser scene
      const game = gameInstanceRef.current;
      let count = 0;
      if (game) {
        const scene = game.scene.keys['BubbleGame'] as BubbleGame | undefined;
        if (scene && scene.dots && typeof scene.dots.getLength === 'function') {
          count = scene.dots.getLength();
        }
      }
      setDotCount(count);
      if (onGameEvent) {
        // Defer to next microtask to avoid parent setState during child render
        Promise.resolve().then(() => onGameEvent({ type: 'dot-count', count }));
      }
    };
    const dotCreatedHandler = () => recomputeCount();
    const clearHandler = () => recomputeCount();
    window.addEventListener('phaser-dot-created', dotCreatedHandler);
    window.addEventListener('phaser-clear-dots', clearHandler);
    // Initial compute once mounted
    recomputeCount();
    return () => {
      window.removeEventListener('phaser-dot-created', dotCreatedHandler);
      window.removeEventListener('phaser-clear-dots', clearHandler);
    };
  }, [onGameEvent]);

  // Only auto-deselect gun if leaving a shooting context
  useEffect(() => {
    if (![1, 6].includes(lessonStep ?? -1)) {
      setGunSelected(false);
    }
  }, [lessonStep]);

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, []);

  // Close the center popover on outside click or Escape
  useEffect(() => {
    if (!showCenterMenu) return;
    const onDocDown = (e: MouseEvent) => {
      if (centerMenuRef.current && !centerMenuRef.current.contains(e.target as Node)) {
        setShowCenterMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCenterMenu(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showCenterMenu]);

  // Track if the user just selected the gun
  const [justSelectedGun, setJustSelectedGun] = useState(false);
  const [doubleShot, setDoubleShot] = useState(false);
  const lastGunTapRef = useRef(0);
  const singleGunTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleGunClick = () => {
    const now = Date.now();
    // Double-tap detected within 320ms
    if (now - lastGunTapRef.current < 320) {
      lastGunTapRef.current = 0;
      if (singleGunTapTimerRef.current) {
        clearTimeout(singleGunTapTimerRef.current);
        singleGunTapTimerRef.current = null;
      }
      setGunSelected(true);
      setSubGunSelected(false);
      setDoubleShot(true);
      window.dispatchEvent(new CustomEvent('phaser-gun-toggle', { detail: { selected: true } }));
      window.dispatchEvent(new CustomEvent('phaser-set-mode', { detail: { mode: 'addGroup', groupSize: 2 } }));
      setJustSelectedGun(true);
      return;
    }
    lastGunTapRef.current = now;
    if (singleGunTapTimerRef.current) clearTimeout(singleGunTapTimerRef.current);
    // Single tap fallback after waiting window (prevents immediate toggle when double-tapping)
    singleGunTapTimerRef.current = setTimeout(() => {
      setGunSelected(sel => {
        const next = !sel;
        window.dispatchEvent(new CustomEvent('phaser-gun-toggle', { detail: { selected: next } }));
        if (next) {
          const modeToSet = (doubleShot || shootMode === 'addGroup') ? 'addGroup' : 'add';
          window.dispatchEvent(new CustomEvent('phaser-set-mode', { detail: { mode: modeToSet, groupSize: modeToSet === 'addGroup' ? 2 : undefined } }));
          setSubGunSelected(false);
          setJustSelectedGun(true);
        }
        return next;
      });
    }, 300);
  };

  const handleSubGunClick = () => {
    setSubGunSelected((sel) => {
      const next = !sel;
      window.dispatchEvent(new CustomEvent('phaser-gun-toggle', { detail: { selected: next } }));
      if (next) {
        window.dispatchEvent(new CustomEvent('phaser-set-mode', { detail: { mode: 'remove' } }));
  // Do not seed here; seeding is controlled by the subtraction lesson step in the page
        setGunSelected(false);
      }
      return next;
    });
  };

  // Effect to safely notify parent after user selects gun
  useEffect(() => {
    if (justSelectedGun && gunSelected && onGameEvent) {
      onGameEvent('gun-selected');
      setJustSelectedGun(false);
    }
  }, [justSelectedGun, gunSelected, onGameEvent]);

  // Reflect external shootMode into UI selection highlights
  useEffect(() => {
    if (shootMode === 'add' || shootMode === 'addGroup') {
      setGunSelected(true);
      setSubGunSelected(false);
      setDoubleShot(shootMode === 'addGroup');
    } else if (shootMode === 'remove') {
      setGunSelected(false);
      setSubGunSelected(true);
      setDoubleShot(false);
    }
  }, [shootMode]);

  // Keep UI highlight in sync with global gun toggle events (e.g., when page enables gun on step entry)
  useEffect(() => {
    const onToggle = (e: Event) => {
      const ce = e as CustomEvent<{ selected: boolean }>;
      const selected = !!ce.detail?.selected;
      if (selected) {
        // When toggling ON, don't override current UI selection.
        // Manual clicks and shootMode prop changes control which gun is highlighted.
        return;
      } else {
        setGunSelected(false);
        setSubGunSelected(false);
        setDoubleShot(false);
      }
    };
    window.addEventListener('phaser-gun-toggle', onToggle);
    return () => window.removeEventListener('phaser-gun-toggle', onToggle);
  }, [shootMode]);

  // React to mode changes to keep the double-shot indicator in sync with actual firing mode
  useEffect(() => {
    const onMode = (e: Event) => {
      const ce = e as CustomEvent<{ mode: 'add' | 'remove' | 'addGroup'; groupSize?: number }>;
      const mode = ce.detail?.mode;
      if (mode === 'addGroup') {
        setDoubleShot(true);
      } else if (mode === 'add' || mode === 'remove') {
        setDoubleShot(false);
      }
      // Do not force selection changes here; selection is controlled by phaser-gun-toggle
    };
    window.addEventListener('phaser-set-mode', onMode);
    return () => window.removeEventListener('phaser-set-mode', onMode);
  }, []);

  const handlePrev = () => {
    // Toggle to previous/other lesson
    if (onGameEvent) onGameEvent('lesson-prev');
  };
  const handleNext = () => {
    // Toggle to next/other lesson
    if (onGameEvent) onGameEvent('lesson-next');
  };

  // Disabled states for nav arrows
  // Always allow lesson toggling
  const isPrevDisabled = false;
  const isNextDisabled = false;

  return (
    <>
      <audio ref={laserAudioRef} src="/laser.mp3" preload="auto" />
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          margin: '0 auto',
          borderRadius: 20,
          border: '3.5px solid #7dd3fc',
          boxShadow: '0 0 36px 10px #7dd3fcaa, 0 6px 24px 0 #0b1220',
          overflow: 'hidden',
          background: 'linear-gradient(140deg, rgba(13,34,60,0.22) 0%, rgba(20,46,80,0.22) 100%)',
        }}
      >
      {/* Overlay Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: overlayBarHeight,
          background: 'rgba(18, 24, 38, 0.92)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.18)',
          padding: '0 12px',
        }}
      >
        {/* Left: Addition and Subtraction gun buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            role="button"
            title="Addition gun"
            aria-label="Addition gun"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: gunSelected
                ? 'radial-gradient(circle at 70% 30%, #60a5fa 60%, #232946 100%)'
                : 'linear-gradient(120deg, #181a2a 60%, #232946 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: gunSelected
                ? '0 0 16px 4px #60a5fa, 0 0 0 3px #fff'
                : '0 1px 4px 0 #232946',
              cursor: 'pointer',
              border: gunSelected ? '2.5px solid #fff' : '2.5px solid #60a5fa',
              position: 'relative',
              transition: 'all 0.18s',
              userSelect: 'none',
            }}
            onClick={handleGunClick}
          >
            {/* Sci-fi raygun SVG (addition) */}
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <ellipse cx="10" cy="20" rx="3" ry="1.2" fill="#fff" opacity="0.18" />
              <rect x="6" y="10" width="13" height="7" rx="3.5" fill="#60a5fa" stroke="#fff" strokeWidth="1.2" />
              <rect x="17" y="12" width="6" height="3" rx="1.2" fill="#818cf8" stroke="#fff" strokeWidth="1" />
              <rect x="3" y="13" width="5" height="3" rx="1.2" fill="#818cf8" stroke="#fff" strokeWidth="1" />
              <rect x="8" y="17" width="4" height="5" rx="1.5" fill="#232946" stroke="#fff" strokeWidth="1" />
              <circle cx="23.5" cy="13.5" r="1.2" fill="#f472b6" stroke="#fff" strokeWidth="0.8" />
              <rect x="20.5" y="11.5" width="2.5" height="1.2" rx="0.5" fill="#fff" opacity="0.7" />
            </svg>
            {gunSelected && !doubleShot && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid #fff',
                  boxShadow: '0 0 6px #ffffff88',
                }}
                aria-label="Single shot indicator"
              />
            )}
            {gunSelected && doubleShot && (
              <>
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#fff',
                    border: '2px solid #fff',
                    boxShadow: '0 0 6px #ffffff88',
                  }}
                  aria-label="Double shot indicator dot 1"
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 16,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#fff',
                    border: '2px solid #fff',
                    boxShadow: '0 0 6px #ffffff88',
                  }}
                  aria-label="Double shot indicator dot 2"
                />
              </>
            )}
          </div>
          <div
            role="button"
            title="Subtraction gun"
            aria-label="Subtraction gun"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: subGunSelected
                ? 'radial-gradient(circle at 70% 30%, #f472b6 60%, #232946 100%)'
                : 'linear-gradient(120deg, #181a2a 60%, #232946 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: subGunSelected
                ? '0 0 16px 4px #f472b6, 0 0 0 3px #fff'
                : '0 1px 4px 0 #232946',
              cursor: 'pointer',
              border: subGunSelected ? '2.5px solid #fff' : '2.5px solid #f472b6',
              position: 'relative',
              transition: 'all 0.18s',
              userSelect: 'none',
            }}
            onClick={handleSubGunClick}
          >
            {/* Subtraction sci-fi raygun SVG (pink theme) */}
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <ellipse cx="10" cy="20" rx="3" ry="1.2" fill="#fff" opacity="0.18" />
              {/* gun body */}
              <rect x="6" y="10" width="13" height="7" rx="3.5" fill="#f472b6" stroke="#fff" strokeWidth="1.2" />
              {/* barrel */}
              <rect x="17" y="12" width="6" height="3" rx="1.2" fill="#fb7185" stroke="#fff" strokeWidth="1" />
              {/* stock */}
              <rect x="3" y="13" width="5" height="3" rx="1.2" fill="#fb7185" stroke="#fff" strokeWidth="1" />
              {/* handle */}
              <rect x="8" y="17" width="4" height="5" rx="1.5" fill="#232946" stroke="#fff" strokeWidth="1" />
              {/* indicator with minus sign */}
              <g>
                <circle cx="23.5" cy="13.5" r="1.6" fill="#fda4af" stroke="#fff" strokeWidth="0.8" />
                <rect x="22.2" y="13.2" width="2.6" height="0.7" rx="0.35" fill="#232946" />
              </g>
              {/* shine */}
              <rect x="20.5" y="11.5" width="2.5" height="1.2" rx="0.5" fill="#fff" opacity="0.7" />
            </svg>
            {subGunSelected && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #fff 60%, #f472b6 100%)',
                  border: '2px solid #f472b6',
                  boxShadow: '0 0 6px #f472b6',
                }}
              />
            )}
          </div>
        </div>
        {/* Center: Left arrow, yellow dot, right arrow */}
        {/* Middle controls: pill group with three buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              borderRadius: 9999,
              background: 'linear-gradient(120deg, rgba(33,56,96,0.88) 40%, rgba(46,76,128,0.92) 100%)',
              border: '2.5px solid #93c5fd',
              boxShadow: '0 6px 18px rgba(0,0,0,0.28), 0 0 22px #93c5fd66',
            }}
          >
          {/* Left arrow - bright chevron */}
      <button
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isPrevDisabled
                ? 'linear-gradient(140deg, #101525 60%, #0b0f1a 100%)'
                : 'radial-gradient(circle at 60% 40%, #1a2641 55%, #10192f 100%)',
              border: isPrevDisabled ? '2px solid #334155' : '2px solid #60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
              cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isPrevDisabled ? 'none' : '0 0 8px #60a5fa',
              marginRight: 4,
              transition: 'all 0.18s',
              opacity: isPrevDisabled ? 0.5 : 1,
            }}
            aria-label="Previous"
            onClick={handlePrev}
            disabled={isPrevDisabled}
            title="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 15l-5-5 5-5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowL)" />
              <defs>
                <filter id="glowL" x="0" y="0" width="20" height="20">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#60a5fa" />
                </filter>
              </defs>
            </svg>
          </button>
          {/* Center button: Space-themed rocket icon */}
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 60% 35%, rgba(59,130,246,0.35) 0%, rgba(24,26,42,0.85) 70%)',
              border: '2.5px solid #93c5fd',
              boxShadow: '0 0 14px #60a5fa88, 0 2px 8px #0007, inset 0 0 10px #60a5fa44',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
            aria-haspopup="menu"
            aria-expanded={showCenterMenu}
            aria-label="Game menu"
            title="Game menu"
            onClick={() => setShowCenterMenu(v => !v)}
          >
            {/* Rocket icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <filter id="rocketGlow">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#93c5fd" floodOpacity="0.9" />
                </filter>
              </defs>
              {/* flame */}
              <path d="M8 17c2 0 3 2 3 4 0-2 1-4 3-4-2 0-3-1-3-3 0 2-1 3-3 3z" fill="#fca5a5" filter="url(#rocketGlow)" />
              {/* rocket body */}
              <path d="M12 3c2.5 1.5 5 5.5 5 9 0 3.5-2.5 5-5 5s-5-1.5-5-5c0-3.5 2.5-7.5 5-9z" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" filter="url(#rocketGlow)" />
              {/* window */}
              <circle cx="12" cy="10" r="1.8" fill="#fff" />
              {/* fins */}
              <path d="M9 14l-2 2c.2-1.2.8-2.4 2-2zM15 14l2 2c-.2-1.2-.8-2.4-2-2z" fill="#93c5fd" />
            </svg>
          </button>
          {/* Right arrow - bright chevron */}
      <button
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isNextDisabled
                ? 'linear-gradient(140deg, #101525 60%, #0b0f1a 100%)'
                : 'radial-gradient(circle at 60% 40%, #1a2641 55%, #10192f 100%)',
              border: isNextDisabled ? '2px solid #334155' : '2px solid #60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
              cursor: isNextDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isNextDisabled ? 'none' : '0 0 8px #60a5fa',
              marginLeft: 4,
              transition: 'all 0.18s',
              opacity: isNextDisabled ? 0.5 : 1,
            }}
            aria-label="Next"
            onClick={handleNext}
            disabled={isNextDisabled}
            title="Next"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 5l5 5-5 5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowR)" />
              <defs>
                <filter id="glowR" x="0" y="0" width="20" height="20">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#60a5fa" />
                </filter>
              </defs>
            </svg>
          </button>
          </div>
        </div>
        {/* Right: Clear button (circular, green/red) */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Color toggle button */}
      <button
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#111827',
          border: '3px solid #60a5fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px 2px #60a5fa66',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => {
          const next = (dotColorIdx + 1) % dotColors.current.length;
          setDotColorIdx(next);
          window.dispatchEvent(new CustomEvent('phaser-set-dot-color', { detail: { color: dotColors.current[next] } }));
        }}
        title="Change dot color"
        aria-label="Change dot color"
      >
        {/* color swatch */}
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: `#${dotColors.current[dotColorIdx].toString(16).padStart(6, '0')}`,
            border: '2px solid #fff',
            boxShadow: '0 0 10px #ffffff66',
          }}
        />
      </button>
      <button
          style={{
      width: 40,
      height: 40,
            borderRadius: '50%',
            background: clearDown
              ? 'radial-gradient(circle at 60% 40%, #f43f5e 70%, #232946 100%)'
              : 'radial-gradient(circle at 60% 40%, #fde68a 70%, #60a5fa 100%)',
            border: clearDown ? '3px solid #fff' : '3px solid #60a5fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: clearDown
              ? '0 0 16px 4px #f43f5e, 0 1px 4px 0 #0004'
              : '0 0 16px 2px #60a5fa, 0 1px 4px 0 #60a5fa',
            cursor: clearDown ? 'not-allowed' : 'pointer',
            position: 'relative',
            transition: 'background 0.18s, box-shadow 0.18s',
            opacity: clearDown ? 0.92 : 1,
          }}
          onClick={handleClearClick}
          aria-label="Nuclear clear all dots"
          disabled={clearDown}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" fill={clearDown ? '#f43f5e' : '#fde68a'} stroke="#fff" strokeWidth="2.2" />
            <circle cx="15" cy="15" r="3.2" fill={clearDown ? '#fff' : '#232946'} stroke="#fff" strokeWidth="1.2" />
            <g stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
              <path d="M15 5.5v5.5" />
              <path d="M24 22l-4.5-2.6" />
              <path d="M6 22l4.5-2.6" />
            </g>
            <g fill="#fff">
              <path d="M15 15.5v6a7 7 0 0 0 5-3.2z" fillOpacity=".18" />
              <path d="M15 15.5v6a7 7 0 0 1-5-3.2z" fillOpacity=".18" />
              <path d="M15 15.5l5-2.6a7 7 0 0 1 0-5z" fillOpacity=".18" />
              <path d="M15 15.5l-5-2.6a7 7 0 0 0 0-5z" fillOpacity=".18" />
            </g>
          </svg>
        </button>
    </div>
      </div>
      {/* Center popover menu */}
      {showCenterMenu && (
        <div
          ref={centerMenuRef}
          role="menu"
          aria-label="Game menu"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: overlayBarHeight + 8,
            background: 'rgba(18, 24, 38, 0.96)',
            border: '2px solid #60a5fa',
            borderRadius: 12,
            boxShadow: '0 6px 24px rgba(0,0,0,0.35), 0 0 16px #60a5fa88',
            padding: 10,
            zIndex: 20,
            minWidth: 200,
          }}
        >
          <div style={{ color: '#e5e7eb', fontWeight: 700, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Step {typeof lessonStep === 'number' ? lessonStep + 1 : '-'}</span>
            <span style={{ color: '#93c5fd', fontWeight: 800 }}>Dots: {dotCount}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              role="menuitem"
              onClick={() => {
                setShowCenterMenu(false);
                if (onGameEvent && typeof lessonStep === 'number') onGameEvent(`step-${lessonStep}`);
              }}
              style={{
                background: 'linear-gradient(90deg, #60a5fa 60%, #38bdf8 100%)',
                color: '#fff',
                border: '2px solid #93c5fd',
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 10px #60a5fa88',
              }}
            >
              Restart this step
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setShowCenterMenu(false);
                if (onGameEvent) onGameEvent('step-0');
              }}
              style={{
                background: 'linear-gradient(90deg, #f472b6 60%, #fb7185 100%)',
                color: '#fff',
                border: '2px solid #fecdd3',
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 10px #f472b688',
              }}
            >
              Go to start
            </button>
          </div>
        </div>
      )}
      {/* Phaser game area below overlay */}
      <div
        ref={gameRef}
        style={{
          width: '100%',
          height: containerHeight || 450,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          overflow: 'hidden',
          marginTop: overlayBarHeight - 8,
          background: 'linear-gradient(135deg, #0c2e4a 0%, #0a2233 100%)',
        }}
      />
          {/* Answer input box inside the game area, bottom center */}
          {showAnswerBox && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (onAnswer && answerInput.trim() !== "") {
                  onAnswer(Number(answerInput));
                  setAnswerInput("");
                }
              }}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 24,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                background: 'linear-gradient(120deg, #1f3b70 40%, #60a5fa 100%)',
                borderRadius: 16,
                padding: '10px 16px',
                boxShadow: '0 6px 26px #7dd3fcaa, 0 0 14px #93c5fd66 inset',
                zIndex: 20,
                border: '2.5px solid #93c5fd',
                gap: 12,
              }}
            >
              <input
                type="number"
                min="0"
                max="99"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                style={{
                  width: 56,
                  height: 38,
                  fontSize: 20,
                  borderRadius: 8,
                  border: '2.5px solid #e2f2ff',
                  background: 'linear-gradient(180deg, #0e1b33 0%, #0f2142 100%)',
                  color: '#eaf2ff',
                  textAlign: 'center',
                  marginRight: 12,
                  boxShadow: '0 0 10px #93c5fd88',
                  outline: 'none',
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
                placeholder="?"
                autoFocus
              />
              <button
                type="submit"
                style={{
                  height: 38,
                  fontSize: 16,
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #7dd3fc 60%, #38bdf8 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 0 10px #93c5fd',
                  transition: 'background 0.18s',
                }}
              >
                Submit
              </button>
            </form>
          )}
      </div>
    </>
  );
};

export default PhaserBubbleGame;
