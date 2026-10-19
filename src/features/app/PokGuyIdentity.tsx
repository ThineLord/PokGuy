"use client";

import { useEffect, useRef } from "react";

export function PokGuyMark() {
  return (
    <span className="pokguy-mark" aria-hidden="true">
      <span className="logo-card logo-card-back">♦</span>
      <span className="logo-card logo-card-front">
        <small>A</small>♠
      </span>
    </span>
  );
}

type Point = [number, number, number];
type Edge = [Point, Point, number];
type Scene = "table" | "scenario" | "history" | "stats" | "settings";

// A small architectural model, projected from world space without a WebGL runtime.
function makePavilion(): Edge[] {
  const edges: Edge[] = [];
  const line = (a: Point, b: Point, weight = 1) => edges.push([a, b, weight]);
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    weight = 1,
  ) => {
    const p: Point[] = [
      [x, y, z],
      [x + w, y, z],
      [x + w, y, z + d],
      [x, y, z + d],
      [x, y + h, z],
      [x + w, y + h, z],
      [x + w, y + h, z + d],
      [x, y + h, z + d],
    ];
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ])
      line(p[a], p[b], weight);
  };
  // Terraced plinth, glass pavilion, cantilevered upper gallery and folded roof.
  for (let i = 0; i < 4; i++)
    box(
      -150 + i * 7,
      -12 + i * 4,
      -88 + i * 5,
      300 - i * 14,
      4,
      176 - i * 10,
      0.7,
    );
  box(-115, 4, -58, 230, 70, 116);
  box(-127, 74, -70, 254, 7, 140, 1.5);
  box(-86, 81, -45, 172, 51, 90);
  box(-100, 132, -58, 200, 5, 116, 1.4);
  for (let x = -105; x <= 105; x += 21) {
    line([x, 4, 58], [x, 74, 58], 0.65);
    line([x, 4, -58], [x, 74, -58], 0.5);
  }
  for (let z = -45; z <= 45; z += 18) {
    line([-115, 4, z], [-115, 74, z], 0.65);
    line([115, 4, z], [115, 74, z], 0.65);
  }
  for (let x = -75; x <= 75; x += 15) line([x, 81, -45], [x, 132, -45], 0.55);
  for (const x of [-106, 106])
    for (const z of [-49, 49]) box(x, 4, z, 4, 70, 4, 1.2);
  for (let i = 0; i < 9; i++)
    box(-35, -9 + i * 2.5, 110 - i * 5, 70, 2.5, 5, 0.6);
  // Two offset architectural fins echo the overlapping cards in the brand mark.
  for (const dx of [-28, 28]) {
    const a: Point = [dx - 32, 137, -38],
      b: Point = [dx + 25, 167, -38];
    const c: Point = [dx + 25, 167, 38],
      d: Point = [dx - 32, 137, 38];
    line(a, b, 1.4);
    line(b, c, 1.4);
    line(c, d, 1.4);
    line(d, a, 1.4);
    for (let z = -28; z < 38; z += 11)
      line([dx - 32, 137, z], [dx + 25, 167, z], 0.45);
  }
  // PokGuy lettering is part of the model, with extruded strokes on the facade.
  const letters: number[][][] = [
    [
      [0, 0],
      [0, 24],
      [12, 24],
      [16, 20],
      [16, 14],
      [12, 11],
      [0, 11],
    ],
    [
      [0, 0],
      [0, 15],
      [13, 15],
      [13, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 24],
    ],
    [
      [13, 17],
      [0, 8],
      [14, 0],
    ],
    [
      [17, 20],
      [13, 24],
      [3, 24],
      [0, 20],
      [0, 4],
      [4, 0],
      [17, 0],
      [17, 11],
      [9, 11],
    ],
    [
      [0, 16],
      [0, 3],
      [3, 0],
      [13, 0],
      [13, 16],
    ],
    [
      [0, 16],
      [6, 0],
      [12, 16],
    ],
    [
      [6, 0],
      [2, -8],
    ],
  ];
  const offsets = [0, 23, 44, 44, 66, 92, 113, 113];
  letters.forEach((stroke, index) => {
    const points = stroke.map(
      ([x, y]) => [x + offsets[index] - 65, y + 94, 46] as Point,
    );
    for (let i = 1; i < points.length; i++) {
      line(points[i - 1], points[i], 1.8);
      line(
        [points[i - 1][0], points[i - 1][1], 49],
        [points[i][0], points[i][1], 49],
        0.8,
      );
    }
    for (const p of points) line(p, [p[0], p[1], 49], 0.6);
  });
  // Survey lines and landscape frames ground the building in a larger site.
  for (let i = -240; i <= 240; i += 40) {
    line([i, -13, -180], [i, -13, 180], 0.15);
    line([-240, -13, i * 0.75], [240, -13, i * 0.75], 0.15);
  }
  for (const x of [-174, 165]) {
    box(x, 0, -42, 18, 36, 18, 0.5);
    box(x - 7, 36, -49, 32, 28, 32, 0.65);
  }
  return edges;
}

const model = makePavilion();
const cameraAngles: Record<Scene, number> = {
  table: -0.5,
  scenario: -0.48,
  history: 0.55,
  stats: -0.95,
  settings: 0.18,
};

export function ArchitecturalBackdrop({
  view,
  motion,
}: {
  view: Scene;
  motion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef(cameraAngles[view]);
  useEffect(() => {
    target.current = cameraAngles[view];
  }, [view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      angle = target.current,
      lift = 0,
      focus = 0,
      focusTarget = 0;
    let width = 0,
      height = 0,
      lastTime = 0;
    let visible = !document.hidden;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const onFocus = (event: FocusEvent) => {
      const el = event.target as HTMLElement;
      const section = el.closest(".panel, .note-field");
      focusTarget = section
        ? (section.getBoundingClientRect().top / window.innerHeight - 0.4) *
          0.15
        : 0;
    };
    const draw = (time: number) => {
      if (!visible) return;
      const reduced = !motion || media.matches;
      const blend = reduced
        ? 1
        : 1 - Math.exp(-Math.min(time - lastTime, 64) / 180);
      lastTime = time;
      angle += (target.current - angle) * blend;
      lift += (Math.min(window.scrollY / 1800, 0.3) - lift) * blend;
      focus += (focusTarget - focus) * blend;
      ctx.clearRect(0, 0, width, height);
      const yaw = angle,
        pitch = 0.38 + lift + focus;
      const scale = Math.min(width / 530, height / 360);
      const stroke = getComputedStyle(canvas).color;
      const project = ([x, y, z]: Point) => {
        const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
        const rz = -x * Math.sin(yaw) + z * Math.cos(yaw);
        const ry = (y - 60) * Math.cos(pitch) - rz * Math.sin(pitch);
        const depth = (y - 60) * Math.sin(pitch) + rz * Math.cos(pitch);
        const perspective = 900 / (900 - depth);
        return [
          width * 0.5 + rx * scale * perspective,
          height * 0.53 - ry * scale * perspective,
          depth,
        ];
      };
      for (const [a, b, weight] of model) {
        const p = project(a),
          q = project(b);
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
        ctx.strokeStyle = stroke;
        ctx.globalAlpha = Math.min(
          0.56,
          0.17 + weight * 0.17 + (p[2] + 150) / 2400,
        );
        ctx.lineWidth = weight > 1 ? 1.05 : 0.7;
        ctx.stroke();
      }
      // Only animate during movement; the settled model uses no animation loop.
      if (
        Math.abs(target.current - angle) > 0.0005 ||
        Math.abs(Math.min(window.scrollY / 1800, 0.3) - lift) > 0.0005 ||
        Math.abs(focusTarget - focus) > 0.0005
      )
        frame = requestAnimationFrame(draw);
      else frame = 0;
    };
    const wake = () => {
      if (!frame && visible) {
        lastTime = performance.now() - 16;
        frame = requestAnimationFrame(draw);
      }
    };
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) wake();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const observer = new ResizeObserver(() => {
      resize();
      wake();
    });
    observer.observe(canvas);
    // A mutation of the scene attribute starts the interpolation without rebuilding the canvas.
    const sceneObserver = new MutationObserver(wake);
    sceneObserver.observe(canvas, {
      attributes: true,
      attributeFilter: ["data-scene"],
    });
    sceneObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const focusListener = (e: FocusEvent) => {
      onFocus(e);
      wake();
    };
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("focusin", focusListener);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", wake);
    resize();
    wake();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sceneObserver.disconnect();
      window.removeEventListener("scroll", wake);
      document.removeEventListener("focusin", focusListener);
      document.removeEventListener("visibilitychange", onVisibility);
      media.removeEventListener("change", wake);
    };
  }, [motion]);

  return (
    <div
      className={`architecture-backdrop ${view === "table" ? "is-hidden" : ""}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} data-scene={view} />
      <div className="architecture-caption">
        <span>POKGUY PAVILION</span>
        <span>STUDY IN PLAY · 01—04</span>
      </div>
    </div>
  );
}
