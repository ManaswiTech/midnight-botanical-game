import { Sparkles, Trophy, Volume2, VolumeX, RotateCcw, Music4 } from 'lucide-react';
import { TIERS } from '@/game/tiers';

interface HudProps {
  score: number;
  best: number;
  merges: number;
  muted: boolean;
  musicOn: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onRestart: () => void;
}

export function Hud({
  score,
  best,
  merges,
  muted,
  musicOn,
  onToggleMute,
  onToggleMusic,
  onRestart,
}: HudProps) {
  return (
    <div className="w-full max-w-[560px] flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(120,180,220,0.2), rgba(160,120,200,0.15))',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Sparkles className="h-5 w-5" style={{ color: '#b8d4f0' }} />
          </div>
          <div className="leading-tight">
            <h1
              className="text-lg font-semibold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #e8eef8, #b8c8e8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The Midnight Botanical
            </h1>
            <p className="text-[11px] text-slate-400">
              Merge three of a kind under the moonlight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton active={musicOn} onClick={onToggleMusic} title="Music">
            <Music4 className="h-4 w-4" />
          </IconButton>
          <IconButton active={!muted} onClick={onToggleMute} title="Sound">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </IconButton>
          <IconButton onClick={onRestart} title="Restart">
            <RotateCcw className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Score" value={score.toLocaleString()} accent="#a8d8ff" />
        <StatCard
          label="Best"
          value={best.toLocaleString()}
          accent="#e8c87a"
          icon={<Trophy className="h-3 w-3" />}
        />
        <StatCard label="Merges" value={merges.toLocaleString()} accent="#c8a8e8" />
      </div>

      {/* Tier legend */}
      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
        {TIERS.map((t, i) => (
          <span key={t.id} className="flex items-center gap-1">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full text-center leading-[14px]"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${t.glow}, ${t.color})`,
                boxShadow: `0 0 6px ${t.glow}55`,
                fontSize: 8,
              }}
            />
            <span style={{ color: t.glow }}>{t.name}</span>
            {i < TIERS.length - 1 && (
              <span className="text-slate-600 mx-0.5">→</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-all active:scale-95"
      style={{
        background: active ? 'rgba(120,180,220,0.12)' : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: active ? '#a8d8ff' : '#8893b0',
      }}
    >
      {children}
    </button>
  );
}
