import { useCallback, useRef } from 'react';
import { GRID_ROWS, GRID_COLS, type GameState } from '@/game/useGame';
import { TIERS } from '@/game/tiers';
import { Piece } from './Piece';

interface BoardProps {
  game: GameState & {
    startPath: (idx: number) => void;
    addToPath: (idx: number) => void;
    endPath: () => void;
  };
}

export function GameBoard({ game }: BoardProps) {
  const dragging = useRef(false);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const indexFromPoint = useCallback((x: number, y: number): number | null => {
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
      const el = cellRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return i;
      }
    }
    return null;
  }, []);

  const handlePointerDown = useCallback(
    (idx: number) => {
      if (game.merging) return;
      dragging.current = true;
      game.startPath(idx);
    },
    [game]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || game.merging) return;
      const idx = indexFromPoint(e.clientX, e.clientY);
      if (idx == null) return;
      game.addToPath(idx);
    },
    [game, indexFromPoint]
  );

  const stop = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    game.endPath();
  }, [game]);

  const cols = GRID_COLS;
  const pathColor = game.pathTier != null ? TIERS[game.pathTier]?.glow : '#fff';

  return (
    <div
      className="relative w-full max-w-[560px] select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      <div
        className="relative rounded-3xl p-3 sm:p-4"
        style={{
          background:
            'linear-gradient(160deg, rgba(18,24,46,0.85), rgba(10,14,30,0.92))',
          border: '1px solid rgba(120,140,200,0.15)',
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ boxShadow: 'inset 0 0 50px rgba(60,80,140,0.12)' }}
        />

        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {game.grid.map((cell, idx) => {
            const inPath = game.path.includes(idx);
            const isPathHead = game.path[game.path.length - 1] === idx;
            const isMergeTarget = game.lastMergeTarget === idx;
            const spawned = cell ? game.spawnedIds.includes(cell.id) : false;
            const ripple = game.ripples.find((r) => r.cell === idx);
            const tier = cell?.tier ?? 0;
            const t = TIERS[tier];
            const posInPath = game.path.indexOf(idx);

            return (
              <div
                key={idx}
                ref={(el) => {
                  cellRefs.current[idx] = el;
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(idx);
                }}
                className="relative aspect-square rounded-xl flex items-center justify-center cursor-pointer"
                style={{
                  background: inPath
                    ? `linear-gradient(135deg, ${t?.glow}33, ${t?.color}22)`
                    : 'rgba(255,255,255,0.025)',
                  border: inPath
                    ? `1px solid ${t?.glow}66`
                    : '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 160ms ease, border-color 160ms ease',
                  boxShadow: inPath ? `0 0 14px ${t?.glow}33` : 'none',
                }}
              >
                {inPath && posInPath > 0 && (
                  <PathLine
                    path={game.path}
                    idx={idx}
                    cols={cols}
                    color={pathColor}
                  />
                )}

                {cell && (
                  <Piece
                    tier={cell.tier}
                    size={56}
                    selected={inPath}
                    merging={false}
                    spawned={spawned}
                    mergingInto={
                      isMergeTarget && game.merging && !isPathHead
                    }
                  />
                )}

                {ripple && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                      border: `2px solid ${TIERS[ripple.tier]?.glow}`,
                      animation: 'ripple 0.8s ease-out forwards',
                    }}
                  />
                )}

                {isPathHead && game.path.length >= 3 && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                      border: `2px solid ${t?.glow}`,
                      animation: 'ready-pulse 0.8s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {game.path.length > 0 && (
        <div
          className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
          style={{
            background: 'rgba(10,14,30,0.9)',
            border: '1px solid rgba(255,255,255,0.12)',
            color:
              game.path.length >= 3
                ? TIERS[game.pathTier ?? 0]?.glow
                : '#9aa3c0',
          }}
        >
          {game.path.length} / 3
          {game.path.length >= 3 ? ' — release to merge!' : ''}
        </div>
      )}
    </div>
  );
}

function PathLine({
  path,
  idx,
  cols,
  color,
}: {
  path: number[];
  idx: number;
  cols: number;
  color: string;
}) {
  const pos = path.indexOf(idx);
  if (pos <= 0) return null;
  const prev = path[pos - 1];
  const dr = Math.floor(idx / cols) - Math.floor(prev / cols);
  const dc = (idx % cols) - (prev % cols);
  const angle = (Math.atan2(dr, dc) * 180) / Math.PI;
  const len = Math.sqrt(dr * dr + dc * dc) * 100;
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        width: `${len}%`,
        height: 3,
        background: `${color}aa`,
        transform: `translate(-50%,-50%) rotate(${angle}deg)`,
        transformOrigin: 'center',
        opacity: 0.5,
        borderRadius: 2,
      }}
    />
  );
}
