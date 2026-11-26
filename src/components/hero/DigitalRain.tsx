"use client";

import { useEffect, useRef } from "react";

/**
 * Faint binary rain behind the hero gearbox: columns of 0s and 1s falling
 * at different speeds, so the hero reads as data and AI as well as
 * engineering. Background texture only: low opacity, masked to the
 * gearbox side (see .digital-rain in globals.css), about 20fps, paused
 * when off-screen or in a hidden tab. It opens on a still field of digits;
 * under reduced motion that still frame is all it draws.
 */

const FPS = 20;
const GLYPHS = ["0", "1"] as const;

type Column = { y: number; speed: number; trail: number };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function DigitalRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fontFamily = getComputedStyle(canvas).fontFamily || "monospace";
    let cell = 16;
    let width = 0;
    let height = 0;
    let rows = 0;
    let columns: Column[] = [];
    let frame = 0;
    let last = 0;
    let visible = true;

    const glyph = (): string => GLYPHS[Math.random() < 0.5 ? 0 : 1];

    const newColumn = (scatter: boolean): Column => ({
      y: scatter ? rand(-rows, rows) : rand(-rows * 0.6, 0),
      speed: rand(0.25, 0.85),
      trail: 0,
    });

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      cell = width < 768 ? 13 : 16;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 ${cell - 3}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      rows = Math.ceil(height / cell);
      columns = Array.from({ length: Math.ceil(width / cell) }, () => newColumn(true));
      // Open on a full field rather than an empty canvas; motion then takes over.
      drawStill();
    }

    // Reduced motion: one quiet field of digits, brighter near each column's "head".
    function drawStill() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < columns.length; i++) {
        const head = Math.floor(rand(0, rows * 1.3));
        const length = Math.floor(rand(6, 22));
        for (let r = Math.max(0, head - length); r <= Math.min(rows, head); r++) {
          const t = 1 - (head - r) / length;
          ctx.fillStyle = `rgb(0 200 80 / ${(0.15 + t * 0.7).toFixed(2)})`;
          ctx.fillText(glyph(), i * cell + cell / 2, r * cell);
        }
      }
    }

    function step() {
      if (!ctx) return;
      // Fade what's already drawn (keeps the canvas transparent over the grid).
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgb(0 0 0 / 0.05)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      columns.forEach((col, i) => {
        const before = Math.floor(col.y);
        col.y += col.speed;
        const row = Math.floor(col.y);
        if (row === before) return;
        const x = i * cell + cell / 2;
        // The old head settles into the trail colour; the new head is brighter.
        if (before >= 0) {
          ctx.clearRect(i * cell, before * cell, cell, cell);
          ctx.fillStyle = "rgb(0 200 80 / 0.85)";
          ctx.fillText(glyph(), x, before * cell);
        }
        if (row >= 0) {
          ctx.fillStyle = "rgb(180 255 200)";
          ctx.fillText(glyph(), x, row * cell);
        }
        // Now and then a digit in the trail flips, as if the data changed.
        if (Math.random() < 0.04 && row > 4) {
          const flip = row - Math.floor(rand(2, 10));
          ctx.clearRect(i * cell, flip * cell, cell, cell);
          ctx.fillStyle = "rgb(0 200 80 / 0.5)";
          ctx.fillText(glyph(), x, flip * cell);
        }
        if (row * cell > height && Math.random() < 0.04) columns[i] = newColumn(false);
      });
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      step();
    }

    function start() {
      if (reduced || frame || !visible || document.hidden) return;
      frame = requestAnimationFrame(loop);
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    const resizeObserver = new ResizeObserver(() => resize());
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) start();
      else stop();
    });
    const onVisibility = () => (document.hidden ? stop() : start());

    // Start after the page has settled so it never competes with the LCP image.
    const idle = window.setTimeout(() => {
      resize();
      resizeObserver.observe(canvas);
      io.observe(canvas);
      document.addEventListener("visibilitychange", onVisibility);
      canvas.dataset.ready = "true";
      start();
    }, 600);

    return () => {
      window.clearTimeout(idle);
      stop();
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="digital-rain pointer-events-none absolute inset-0 size-full font-mono" />;
}
