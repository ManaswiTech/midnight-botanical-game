import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_TIER } from './tiers';
import { ambientAudio } from './audio';

export type Cell = { id: number; tier: number } | null;
export type Grid = Cell[];

export const GRID_ROWS = 5;
export const GRID_COLS = 6;
export const CELL_COUNT = GRID_ROWS * GRID_COLS;
export const INITIAL_TIER_CAP = 2; // start with sprouts/mushrooms/glowing

let _uid = 1;
type Piece = { id: number; tier: number };
const newCell = (tier: number): Piece => ({ id: _uid++, tier });
const randomTier = (cap: number) => Math.floor(Math.random() * (cap + 1));

function makeInitialGrid(): Grid {
  const g: Grid = new Array(CELL_COUNT).fill(null);
  for (let i = 0; i < CELL_COUNT; i++) {
    g[i] = newCell(randomTier(INITIAL_TIER_CAP));
  }
  return g;
}

export interface MergePath {
  cells: number[]; // indexes along the path
  tier: number; // tier being collected
  target: number; // where merge lands
  resultTier: number;
}

export interface GameState {
  grid: Grid;
  score: number;
  best: number;
  merges: number;
  path: number[];
  pathTier: number | null;
  merging: boolean;
  lastMergeTarget: number | null;
  lastMergeTier: number | null;
  ripples: { id: number; cell: number; tier: number }[];
  spawnedIds: number[];
}

const BEST_KEY = 'midnight-botanical-best';

function loadBest(): number {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function useGame() {
  const [grid, setGrid] = useState<Grid>(() => makeInitialGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => loadBest());
  const [merges, setMerges] = useState(0);
  const [path, setPath] = useState<number[]>([]);
  const [pathTier, setPathTier] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);
  const [lastMergeTarget, setLastMergeTarget] = useState<number | null>(null);
  const [lastMergeTier, setLastMergeTier] = useState<number | null>(null);

  // ripples for merge animation feedback
  const [ripples, setRipples] = useState<
    { id: number; cell: number; tier: number }[]
  >([]);
  const rippleId = useRef(1);

  // spawn counters
  const [spawnedIds, setSpawnedIds] = useState<number[]>([]);
  const spawnTimer = useRef<number[]>([]);

  const pathRef = useRef<number[]>([]);
  pathRef.current = path;

  const tierAt = useCallback((g: Grid, idx: number) => g[idx]?.tier ?? null, []);

  const startPath = useCallback(
    (idx: number) => {
      if (merging) return;
      const t = grid[idx]?.tier;
      if (t == null) return;
      setPath([idx]);
      setPathTier(t);
      ambientAudio.playSelect();
    },
    [grid, merging]
  );

  const addToPath = useCallback(
    (idx: number) => {
      if (merging) return;
      const p = pathRef.current;
      if (p.includes(idx)) {
        // allow backtracking: truncate to the point before this idx
        const pos = p.indexOf(idx);
        if (pos < p.length - 1) {
          const next = p.slice(0, pos + 1);
          setPath(next);
          pathRef.current = next;
        }
        return;
      }
      const last = p[p.length - 1];
      if (last == null) return;
      const lastRow = Math.floor(last / GRID_COLS);
      const lastCol = last % GRID_COLS;
      const row = Math.floor(idx / GRID_COLS);
      const col = idx % GRID_COLS;
      const adjacent =
        Math.abs(lastRow - row) <= 1 && Math.abs(lastCol - col) <= 1;
      if (!adjacent) return;
      const t = grid[idx]?.tier;
      if (t == null || t !== pathTier) return;
      const next = [...p, idx];
      setPath(next);
      pathRef.current = next;
      ambientAudio.playSelect();
    },
    [grid, merging, pathTier]
  );

  const endPath = useCallback(() => {
    const p = pathRef.current;
    pathRef.current = [];
    setPath([]);
    setPathTier(null);
    if (p.length < 3) return;

    const target = p[p.length - 1];
    const collected = p.slice(0, p.length - 1);
    const resultTier = Math.min((pathTier ?? 0) + 1, MAX_TIER);

    setMerging(true);

    setGrid((prev) => {
      const next = [...prev];
      // clear collected cells
      for (const idx of collected) next[idx] = null;
      // set target to result tier (new id so it re-mounts with animation)
      next[target] = { id: _uid++, tier: resultTier };
      return next;
    });

    // ripple feedback
    const rid = rippleId.current++;
    setRipples((r) => [...r, { id: rid, cell: target, tier: resultTier }]);
    spawnTimer.current.push(rid);
    setTimeout(() => {
      setRipples((r) => r.filter((x) => x.id !== rid));
    }, 900);

    setLastMergeTarget(target);
    setLastMergeTier(resultTier);
    ambientAudio.playMerge(resultTier);
    if (resultTier >= MAX_TIER) ambientAudio.playWin();

    // scoring
    const gained =
      (resultTier + 1) * 10 * collected.length + (p.length - 2) * 5;
    setScore((s) => {
      const ns = s + gained;
      setBest((b) => {
        if (ns > b) {
          try {
            localStorage.setItem(BEST_KEY, String(ns));
          } catch {
            /* ignore */
          }
          return ns;
        }
        return b;
      });
      return ns;
    });
    setMerges((m) => m + 1);

    // schedule spawn-back after a short beat
    const count = collected.length;
    setTimeout(() => {
      setGrid((prev) => {
        const next = [...prev];
        const empty: number[] = [];
        for (let i = 0; i < CELL_COUNT; i++) {
          if (next[i] == null) empty.push(i);
        }
        // shuffle empties and fill a few
        for (let i = empty.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [empty[i], empty[j]] = [empty[j], empty[i]];
        }
        const toFill = empty.slice(0, count);
        const newIds: number[] = [];
        for (const idx of toFill) {
          const cell = newCell(randomTier(INITIAL_TIER_CAP));
          next[idx] = cell;
          newIds.push(cell.id);
        }
        setSpawnedIds(newIds);
        // clear spawned highlight after animation
        setTimeout(() => setSpawnedIds([]), 600);
        return next;
      });
      setMerging(false);
      setLastMergeTarget(null);
      setLastMergeTier(null);
    }, 380);

    return { target, resultTier, collected };
  }, [pathTier]);

  const reset = useCallback(() => {
    setGrid(makeInitialGrid());
    setScore(0);
    setMerges(0);
    setPath([]);
    setPathTier(null);
    setMerging(false);
    setLastMergeTarget(null);
    setLastMergeTier(null);
    setRipples([]);
    setSpawnedIds([]);
  }, []);

  // clean up timers on unmount
  useEffect(() => {
    return () => {
      spawnTimer.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return {
    grid,
    score,
    best,
    merges,
    path,
    pathTier,
    merging,
    lastMergeTarget,
    lastMergeTier,
    ripples,
    spawnedIds,
    startPath,
    addToPath,
    endPath,
    reset,
  };
}
