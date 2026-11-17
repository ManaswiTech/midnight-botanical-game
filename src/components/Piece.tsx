import { memo } from 'react';
import { TIERS, MAX_TIER } from '@/game/tiers';

interface PieceProps {
  tier: number;
  size: number;
  selected: boolean;
  merging: boolean;
  spawned: boolean;
  mergingInto: boolean;
}

export const Piece = memo(function Piece({
  tier,
  size,
  selected,
  merging,
  spawned,
  mergingInto,
}: PieceProps) {
  const t = TIERS[tier];
  if (!t) return null;
  const isMax = tier >= MAX_TIER;

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        transition: 'transform 180ms ease, box-shadow 220ms ease',
        transform: selected
          ? 'scale(1.08)'
          : mergingInto
            ? 'scale(0)'
            : merging
              ? 'scale(0.5) translateY(10px)'
              : spawned
                ? 'scale(1)'
                : 'scale(1)',
        animation: spawned ? 'pop-in 420ms cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
        opacity: mergingInto ? 0 : 1,
      }}
    >
      {/* glow base */}
      <div
        className="absolute inset-0 rounded-full blur-md transition-opacity"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${t.glow}cc, transparent 70%)`,
          opacity: selected ? 0.95 : isMax ? 0.85 : 0.55,
          animation: isMax ? 'pulse-glow 2.4s ease-in-out infinite' : undefined,
        }}
      />
      <div
        className="absolute inset-[18%] rounded-full blur-[2px]"
        style={{
          background: `radial-gradient(circle at 40% 35%, ${t.glow}, ${t.color} 75%)`,
          opacity: 0.3,
        }}
      />
      {/* emoji */}
      <span
        className="relative select-none"
        style={{
          fontSize: size * 0.5,
          lineHeight: 1,
          filter: selected
            ? `drop-shadow(0 0 6px ${t.glow})`
            : isMax
              ? `drop-shadow(0 0 4px ${t.glow})`
              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
        }}
      >
        {t.emoji}
      </span>
      {/* selection ring */}
      {selected && (
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: `${t.glow}`, boxShadow: `0 0 12px ${t.glow}88` }}
        />
      )}
    </div>
  );
});
