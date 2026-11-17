import { useMemo } from 'react';

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

interface Firefly {
  top: number;
  left: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  size: number;
}

function seeded(n: number) {
  let s = n;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function NightBackground() {
  const stars = useMemo<Star[]>(() => {
    const rng = seeded(42);
    return Array.from({ length: 70 }, () => ({
      top: rng() * 100,
      left: rng() * 100,
      size: 1 + rng() * 2.5,
      delay: rng() * 6,
      duration: 3 + rng() * 4,
    }));
  }, []);

  const fireflies = useMemo<Firefly[]>(() => {
    const rng = seeded(137);
    return Array.from({ length: 18 }, () => ({
      top: 20 + rng() * 70,
      left: rng() * 100,
      delay: rng() * 8,
      duration: 8 + rng() * 8,
      driftX: (rng() - 0.5) * 120,
      driftY: (rng() - 0.5) * 80,
      size: 2 + rng() * 3,
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#05060f] via-[#0a0e1f] to-[#0d1226]">
      {/* subtle nebula tints */}
      <div className="absolute inset-0 opacity-60">
        <div
          className="absolute -top-1/4 -left-1/4 h-[60vh] w-[60vh] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(40,70,120,0.35), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-1/4 h-[55vh] w-[55vh] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(80,50,110,0.25), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-1/4 left-1/4 h-[50vh] w-[50vh] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(30,90,100,0.22), transparent 70%)' }}
        />
      </div>

      {/* Moon */}
      <div className="absolute right-[8%] top-[10%] h-24 w-24 sm:h-28 sm:w-28">
        <div className="relative h-full w-full">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #f4f1e0, #d8d0b0 60%, #b0a888 100%)',
              boxShadow: '0 0 60px 18px rgba(220,210,180,0.25), 0 0 120px 40px rgba(180,190,220,0.12)',
            }}
          />
          {/* craters */}
          <div className="absolute left-[22%] top-[30%] h-4 w-4 rounded-full bg-black/10" />
          <div className="absolute left-[55%] top-[25%] h-3 w-3 rounded-full bg-black/10" />
          <div className="absolute left-[45%] top-[60%] h-5 w-5 rounded-full bg-black/8" />
        </div>
      </div>

      {/* Stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 0.5,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Fireflies */}
      {fireflies.map((f, i) => (
        <span
          key={`f${i}`}
          className="absolute rounded-full"
          style={
            {
              top: `${f.top}%`,
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              background: '#cde87a',
              boxShadow: '0 0 8px 2px rgba(180,240,120,0.7)',
              '--driftX': `${f.driftX}px`,
              '--driftY': `${f.driftY}px`,
              animation: `firefly ${f.duration}s ease-in-out ${f.delay}s infinite`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Distant tree silhouette / ground */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        style={{ height: '22vh' }}
        aria-hidden
      >
        <defs>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0f22" stopOpacity="0" />
            <stop offset="60%" stopColor="#070a18" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#04060f" />
          </linearGradient>
        </defs>
        <path
          d="M0,120 C120,90 220,110 340,95 C460,80 520,105 640,100 C760,95 840,70 960,85 C1080,100 1160,80 1280,90 C1360,97 1400,85 1440,92 L1440,220 L0,220 Z"
          fill="url(#ground)"
        />
        {/* a few bare trees */}
        <g fill="#05060f" opacity="0.92">
          <path d="M180,120 L182,70 M175,85 L188,80 M172,95 L190,92 M178,72 L178,120 L182,120 L182,72 Z" stroke="#05060f" strokeWidth="2" />
          <path d="M920,110 L922,60 M915,75 L928,70 M912,85 L930,82 M918,62 L918,110 L922,110 L922,62 Z" stroke="#05060f" strokeWidth="2" />
        </g>
      </svg>

      {/* soft drifting fog */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] pointer-events-none">
        <div
          className="absolute bottom-0 left-0 h-full w-[140%]"
          style={{
            background:
              'linear-gradient(to top, rgba(120,140,180,0.07), transparent)',
            animation: 'drift 40s linear infinite',
          }}
        />
      </div>
    </div>
  );
}
