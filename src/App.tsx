import { useEffect, useRef, useState } from 'react';
import { NightBackground } from '@/components/NightBackground';
import { GameBoard } from '@/components/GameBoard';
import { Hud } from '@/components/Hud';
import { useGame } from '@/game/useGame';
import { ambientAudio } from '@/game/audio';

export default function App() {
  const game = useGame();
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [started, setStarted] = useState(false);
  const interacted = useRef(false);

  // Start music after first user interaction (browser autoplay policy)
  useEffect(() => {
    if (!started || !musicOn) return;
    ambientAudio.resume().then(() => ambientAudio.startMusic());
  }, [started, musicOn]);

  const startGame = () => {
    if (interacted.current) return;
    interacted.current = true;
    setStarted(true);
    void ambientAudio.resume();
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    if (next) {
      void ambientAudio.resume().then(() => ambientAudio.startMusic());
    } else {
      ambientAudio.stopMusic();
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    ambientAudio.setMuted(next);
  };

  return (
    <div className="min-h-screen w-full text-slate-100 flex flex-col items-center justify-center px-4 py-6">
      <NightBackground />

      {!started ? (
        <StartScreen onStart={startGame} />
      ) : (
        <div className="flex flex-col items-center gap-5">
          <Hud
            score={game.score}
            best={game.best}
            merges={game.merges}
            muted={muted}
            musicOn={musicOn}
            onToggleMute={toggleMute}
            onToggleMusic={toggleMusic}
            onRestart={game.reset}
          />
          <GameBoard game={game} />
          <Footer />
        </div>
      )}
    </div>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-md">
      <div
        className="text-5xl"
        style={{ filter: 'drop-shadow(0 0 20px rgba(180,200,255,0.5))' }}
      >
        🌙
      </div>
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(90deg, #e8eef8, #b8c8e8, #d8c8f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          The Midnight Botanical
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          In a quiet night garden, life glows and grows. Drag across three
          identical sprouts, mushrooms, crystals, or fairies to merge them into
          something brighter. How high can your moonlit garden grow?
        </p>
      </div>
      <button
        onClick={onStart}
        className="rounded-xl px-6 py-3 font-medium text-slate-900 transition-all hover:scale-[1.03] active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #b8d4f0, #d8c8f0)',
          boxShadow: '0 8px 30px rgba(120,160,220,0.3)',
        }}
      >
        Enter the Garden
      </button>
      <p className="text-[11px] text-slate-600">
        Headphones recommended for the ambient soundscape.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-[11px] text-slate-600 text-center max-w-md">
      Drag across 3+ matching items to merge. Reach the Moonbloom to bloom the
      garden anew.
    </p>
  );
}
