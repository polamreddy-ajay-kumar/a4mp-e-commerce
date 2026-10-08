import { useEffect, useRef, useState } from "react";
import { Rotate3d, Pause, Play, RotateCcw } from "lucide-react";

export function Viewer3D({ src, alt, filter }: { src: string; alt: string; filter?: string }) {
  const [rot, setRot] = useState({ x: -8, y: 0 });
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setRot((r) => ({ ...r, y: r.y + dt * 30 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  const onDown = (e: React.PointerEvent) => {
    setAuto(false);
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setRot((r) => ({ x: Math.max(-35, Math.min(35, r.x - dy * 0.4)), y: r.y + dx * 0.6 }));
  };

  return (
    <div className="stage relative overflow-hidden rounded-2xl">
      <div className="stage-glow pointer-events-none absolute inset-0" />
      <div
        className="relative flex aspect-square touch-none cursor-grab items-center justify-center active:cursor-grabbing"
        style={{ perspective: 1100 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
      >
        <div
          className="relative h-[72%] w-[72%]"
          style={{ transformStyle: "preserve-3d", transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        >
          {[0, 180].map((deg) => (
            <img
              key={deg}
              src={src}
              alt={alt}
              draggable={false}
              className="absolute inset-0 h-full w-full rounded-xl object-cover shadow-lift"
              style={{ transform: `rotateY(${deg}deg) translateZ(1px)`, backfaceVisibility: "hidden", filter }}
            />
          ))}
        </div>
        <div className="stage-floor pointer-events-none absolute bottom-[8%] h-6 w-1/2 rounded-full" />
      </div>
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/15 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
        <Rotate3d className="h-3.5 w-3.5" /> 360° view · drag to rotate
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button aria-label="Reset" onClick={() => setRot({ x: -8, y: 0 })} className="grid h-9 w-9 place-items-center rounded-full bg-card/15 text-primary-foreground backdrop-blur hover:bg-card/25"><RotateCcw className="h-4 w-4" /></button>
        <button aria-label={auto ? "Pause" : "Play"} onClick={() => setAuto((a) => !a)} className="grid h-9 w-9 place-items-center rounded-full bg-card/15 text-primary-foreground backdrop-blur hover:bg-card/25">
          {auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
