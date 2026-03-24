"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowRight, Waves, Activity, Mic } from "lucide-react";

/* ── Emotion metadata ────────────────────────────────────────────────── */
const EMOTION_META: Record<string, { image: string; color: string }> = {
  anger: { image: "/anger.png", color: "text-red-400" },
  disgust: { image: "/disgust.png", color: "text-emerald-400" },
  fear: { image: "/fear.png", color: "text-purple-400" },
  joy: { image: "/joy.png", color: "text-amber-400" },
  neutral: { image: "/neutral.png", color: "text-slate-400" },
  sadness: { image: "/sadness.png", color: "text-blue-400" },
  surprise: { image: "/surprise.png", color: "text-orange-400" },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Types ──────────────────────────────────────────────────────────── */
interface SynthResult {
  emotion: string;
  intensity: number;
  audio_url: string;
}

/* ═════════════════════════════════════════════════════════════════════
   Main Page
   ═════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SynthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [tiltStyle, setTiltStyle] = useState({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
  });

  /* ── 3D Tilt Logic ────────────────────────────────────────────────── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dashboardRef.current) return;
    const rect = dashboardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 8;
    const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * 6;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
    });
  }, []);

  /* ── Submit Handler ───────────────────────────────────────────────── */
  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Server error (${res.status})`);
      }

      const data: SynthResult = await res.json();
      setResult(data);

      setTimeout(() => audioRef.current?.play().catch(() => { }), 200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? EMOTION_META[result.emotion] ?? EMOTION_META.neutral : null;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <section className="relative min-h-screen overflow-hidden bg-black font-sans">
      {/* ── Animated mesh gradient background ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950/80 to-black" />
        <div className="mesh-container">
          <div className="mesh-blob mesh-1" />
          <div className="mesh-blob mesh-2" />
          <div className="mesh-blob mesh-3" />
          <div className="mesh-blob mesh-4" />
          <div className="mesh-blob mesh-5" />
        </div>
        <div className="absolute inset-0 opacity-20 mix-blend-overlay noise-bg" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: Text content & Input ── */}
            <div className="space-y-8">

              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-full">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-purple-300 text-sm font-medium tracking-wide pb-[1px]">
                  The Empathy Engine: Giving AI a human voice                 </span>
              </div>

              {/* Main heading with wavy SVG underline */}
              <h1 className="hero-heading text-4xl sm:text-5xl lg:text-7xl font-semibold leading-[1.1] tracking-tight">
                <span className="block text-white">Transform text into</span>
                <span className="block text-white relative uppercase">
                  emotive audio
                  <svg
                    className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3 sm:h-4"
                    viewBox="0 0 300 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,8 Q75,0 150,8 T300,8"
                      stroke="url(#underline-gradient)"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#c026d3" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              {/* Description & Input */}
              <div className="space-y-5 pt-4">
                <p className="text-lg lg:text-xl text-white/70 leading-relaxed max-w-xl">
                  Analyze the emotional resonance of any sentence and generate life-like speech matched exactly to its tone.
                </p>

                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type an emotional sentence here…"
                  className="w-full max-w-xl resize-none rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition backdrop-blur-sm"
                />

                {error && (
                  <div className="text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg max-w-xl text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handleSynthesize}
                  disabled={loading || !text.trim()}
                  className="mesh-button flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white tracking-wide"
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Synthesizing...
                    </>
                  ) : (
                    <>
                      Generate Voice
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              </div>

              {/* Stats / Features */}
              <div className="flex items-center gap-8 pt-8 border-t border-white/[0.08] max-w-xl">
                <div>
                  <div className="text-2xl lg:text-3xl font-semibold text-white">7</div>
                  <div className="text-sm text-white/50">Emotion Vocals</div>
                </div>
                <div className="w-px h-10 bg-white/[0.12]" />
                <div>
                  <div className="text-2xl lg:text-3xl font-semibold text-white">&lt;200ms</div>
                  <div className="text-sm text-white/50">TTFB Latency</div>
                </div>
                <div className="w-px h-10 bg-white/[0.12]" />
                <div>
                  <div className="text-2xl lg:text-3xl font-semibold text-white">Edge-tts</div>
                  <div className="text-sm text-white/50">TTS Engine</div>
                </div>
              </div>

            </div>

            {/* ── Right: 3D interactive Dashboard Output ── */}
            <div
              ref={dashboardRef}
              className="relative lg:pl-8 tilt-container"
              style={tiltStyle}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Ambient glow behind dashboard */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-indigo-500/10 rounded-3xl blur-2xl opacity-60" />

              <div className="relative">
                <div className="dashboard-frame rounded-2xl overflow-hidden border border-white/[0.15] shadow-2xl relative min-h-[400px] flex flex-col">

                  {/* Browser chrome */}
                  <div className="bg-slate-900/90 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-white/[0.08]">
                    <div className="flex gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-slate-800/80 rounded-lg px-4 py-1.5 text-xs text-white/40 tracking-wider font-mono">
                        app.empathy-engine.io/synthesis
                      </div>
                    </div>
                    <div className="w-12" /> {/* Spacer for balance */}
                  </div>

                  {/* Dashboard Content area */}
                  <div className="bg-slate-950/60 p-8 flex-1 flex flex-col justify-center items-center relative gap-8">

                    {!result && !loading && (
                      <div className="text-center space-y-3 opacity-40">
                        <Waves className="w-16 h-16 mx-auto stroke-1" />
                        <p className="font-mono text-sm tracking-widest text-white/60">AWAITING INPUT</p>
                      </div>
                    )}

                    {loading && (
                      <div className="text-center space-y-4">
                        <span className="spinner w-8 h-8 border-[4px]" />
                        <p className="text-purple-300 tracking-wider text-sm font-semibold uppercase animate-pulse">Running NLP...</p>
                      </div>
                    )}

                    {result && meta && (
                      <>
                        {/* Audio Player */}
                        <div className="w-full max-w-sm fade-in">
                          <audio
                            key={result.audio_url} // forces re-render/remount on new url
                            ref={audioRef}
                            controls
                            src={`${API_BASE}${result.audio_url}`}
                            className="w-full shadow-lg"
                          />
                        </div>

                        {/* Center Emotion Display */}
                        <div className="text-center space-y-2 fade-in">
                          <img
                            src={meta.image}
                            alt={result.emotion}
                            className="w-24 h-24 object-contain mx-auto drop-shadow-2xl mb-4"
                          />
                          <h2 className={`text-4xl font-black uppercase tracking-widest ${meta.color} drop-shadow-md`}>
                            {result.emotion}
                          </h2>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Floating Cards (Pop-in conditionally on result) */}
                {result && (
                  <>
                    <div className="absolute -left-6 bottom-16 card-pop-in bg-zinc-950/90 backdrop-blur-xl border border-white/[0.05] rounded-xl p-4 shadow-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-inner">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white/50 uppercase tracking-wide">NLP Confidence</div>
                        <div className="text-purple-400 text-xl font-bold">
                          {(result.intensity * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>


                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
