"use strict";

// model keys: a = opus 5 (aa model pages), o = opus 5.5, s = sonnet 5.5, h = haiku 5.5, p = opus 4.8,
// t = gpt 5.6 sol, f = gpt 5.5, g = gemini 3.1 pro, x = grok 4.6, d = deepseek v4 flash, i = mimo v2.6 pro, u = muse spark 1.3
const series = {
  a: { name: "opus 5", shape: "diamond", cls: "s-a" },
  o: { name: "opus 5.5", shape: "circle", cls: "s-o" },
  s: { name: "sonnet 5.5", shape: "square", cls: "s-s" },
  h: { name: "haiku 5.5", shape: "triangle", cls: "s-h" },
  p: { name: "opus 4.8", shape: "inv", cls: "s-p" },
  t: { name: "gpt 5.6 sol", shape: "circle", cls: "s-r" },
  f: { name: "gpt 5.5", shape: "square", cls: "s-r" },
  g: { name: "gemini 3.1 pro", shape: "triangle", cls: "s-r" },
  x: { name: "grok 4.6", shape: "diamond", cls: "s-r" },
  d: { name: "deepseek v4 flash", shape: "inv", cls: "s-r" },
  i: { name: "mimo v2.6 pro", shape: "pent", cls: "s-r" },
  u: { name: "muse spark 1.3", shape: "plus", cls: "s-r" },
};
const order = ["a", "o", "s", "h", "p", "t", "f", "g", "x", "d", "i", "u"];
const orgs = {
  anthropic: ["a", "o", "s", "h", "p"],
  openai: ["t", "f"],
  google: ["g"],
  xai: ["x"],
  deepseek: ["d"],
  xiaomi: ["i"],
  meta: ["u"],
};
const efforts = ["low", "medium", "high", "xhigh", "max", "default"];
// m = model key, e = index into efforts, c = usd per task, t = seconds per task, s = index score
const data = [
  { m: "a", e: 0, c: 1.1, t: 150.7, s: 39 }, { m: "a", e: 1, c: 2.19, t: 304.3, s: 45 }, { m: "a", e: 2, c: 3.61, t: 480.9, s: 48 }, { m: "a", e: 3, c: 4.88, t: 640.2, s: 50 }, { m: "a", e: 4, c: 5.86, t: 756.8, s: 51 },
  { m: "o", e: 0, c: 0.55, t: 76.7, s: 42 }, { m: "o", e: 1, c: 1.34, t: 198.4, s: 51 }, { m: "o", e: 2, c: 1.82, t: 265.6, s: 54 }, { m: "o", e: 3, c: 3.46, t: 506, s: 56 }, { m: "o", e: 4, c: 5.98, t: 800.1, s: 58 },
  { m: "s", e: 0, c: 0.35, t: 85.3, s: 36 }, { m: "s", e: 1, c: 0.48, t: 124, s: 41 }, { m: "s", e: 2, c: 0.88, t: 226.6, s: 47 }, { m: "s", e: 3, c: 2.01, t: 444.6, s: 52 }, { m: "s", e: 4, c: 5.46, t: 943.3, s: 56 },
  { m: "h", e: 0, c: 0.02, t: 63.8, s: 29 }, { m: "h", e: 1, c: 0.05, t: 119.1, s: 34 }, { m: "h", e: 2, c: 0.08, t: 191.3, s: 38 }, { m: "h", e: 3, c: 0.12, t: 294.1, s: 41 }, { m: "h", e: 4, c: 0.21, t: 425.9, s: 43 },
  { m: "p", e: 4, c: 4.08, t: 709.4, s: 42 }, { m: "t", e: 4, c: 1.99, t: 314, s: 47 }, { m: "f", e: 3, c: 2.63, t: 241.1, s: 38 }, { m: "g", e: 5, c: 1.3, t: 123.5, s: 30 },
  { m: "x", e: 3, c: 1.75, t: 667.1, s: 44 }, { m: "d", e: 4, c: 0.22, t: 244.2, s: 34 }, { m: "i", e: 5, c: 0.13, t: 1229.8, s: 46 }, { m: "u", e: 4, c: 1.6, t: 464.4, s: 48 },
];

const score_min = 25;
const score_max = 60;
const margin = { l: 56, r: 28, t: 16, b: 48 };
const svg_ns = "http://www.w3.org/2000/svg";
const sig_fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumSignificantDigits: 2 });
const usd_fmt = (x) => "$" + x.toFixed(2);
const sec_fmt = (x) => Math.round(x) + "s";

// the two horizontal metrics: c = cost (front face of the cube), t = time (side face)
const dims = {
  c: {
    lo: 0.02, hi: 6, title: "cost per task, usd", budget: "budget", fmt: usd_fmt,
    per: (x) => (x >= 0.1 ? usd_fmt(x) : sig_fmt.format(x)),
    round: (x) => Math.round(x * 100) / 100,
    log: [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5], log_n: [0.02, 0.1, 1, 5], lin: [0, 1, 2, 3, 4, 5, 6], lin_n: [0, 2, 4, 6],
  },
  t: {
    lo: 50, hi: 1500, title: "time per task, seconds", budget: "time limit", fmt: sec_fmt,
    per: (x) => (x >= 10 ? sec_fmt(x) : x.toFixed(1) + "s"),
    round: Math.round,
    log: [50, 100, 200, 500, 1000], log_n: [50, 200, 1000], lin: [0, 300, 600, 900, 1200, 1500], lin_n: [0, 500, 1000, 1500],
  },
};
// camera presets as [yaw, pitch] in radians
const views = { c: [0, 0], t: [Math.PI / 2, 0], "3d": [0.62, 0.38] };
const cols = [
  { label: () => "series", sort: (p) => series[p.m].name, text: (p) => series[p.m].name },
  { label: () => "effort", sort: (p) => p.e, text: (p) => efforts[p.e] },
  { label: () => "index", sort: (p) => p.s, text: (p) => String(p.s) },
  { label: () => "usd per task", sort: (p) => p.c, text: (p) => usd_fmt(p.c) },
  { label: () => "seconds per task", sort: (p) => p.t, text: (p) => sec_fmt(p.t) },
  { label: () => (state.face === "c" ? "cost status" : "time status"), sort: (p) => status_text(p), text: (p) => status_text(p) },
];

const state = {
  vis: new Set(order),
  axis: "log",
  budget: { c: 1, t: 300 },
  view: "c",
  face: "c",
  pin: null,
  hover: null,
  sort: { i: 3, dir: 1 },
  last_w: 0,
};
let view = { list: [], front: { c: [], t: [] }, pick: null };
// yaw/pitch: current angle, vy/vp: angular velocity, ty/tp: spring target
const cam = { yaw: 0, pitch: 0, vy: 0, vp: 0, ty: 0, tp: 0 };
const scene = { W: 0, nodes: new Map(), pos: new Map(), sig: "" };
let drag = null;
let raf = 0;
let last = 0;

const $ = (id) => document.getElementById(id);
const name_of = (p) => series[p.m].name + (p.e === 5 ? "" : " " + efforts[p.e]);
const visible = () => data.filter((p) => state.vis.has(p.m));
const motion_ok = () => window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
const key_of = (p) => p.m + p.e;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

function norm(k, x) {
  const d = dims[k];
  const f = state.axis === "log" ? (Math.log10(Math.max(x, d.lo)) - Math.log10(d.lo)) / (Math.log10(d.hi) - Math.log10(d.lo)) : x / d.hi;
  return f * 2 - 1;
}
const norm_s = (s) => ((s - score_min) / (score_max - score_min)) * 2 - 1;

function frontier_of(list, k) {
  const sorted = [...list].sort((x, y) => x[k] - y[k] || y.s - x.s);
  const kept = [];
  let best = -Infinity;
  for (const p of sorted) {
    if (p.s > best) {
      kept.push(p);
      best = p.s;
    }
  }
  return kept;
}

function beater_of(p, list, k) {
  let win = null;
  for (const q of list) {
    if (q === p || q.s < p.s || q[k] > p[k]) continue;
    if (!win || q[k] < win[k] || (q[k] === win[k] && q.s > win.s)) win = q;
  }
  return win;
}

function pick_of(list, k) {
  let win = null;
  for (const q of list) {
    if (q[k] > state.budget[k] + 1e-9) continue;
    if (!win || q.s > win.s || (q.s === win.s && q[k] < win[k])) win = q;
  }
  return win;
}

function status_text(p) {
  if (!state.vis.has(p.m)) return "hidden";
  if (view.front[state.face].includes(p)) return "frontier";
  const by = beater_of(p, view.list, state.face);
  return by ? "beaten by " + name_of(by) : "frontier";
}

function readout_lines(p) {
  const k = state.face;
  const d = dims[k];
  const head = `${name_of(p)} · ${p.s} · ${usd_fmt(p.c)} · ${sec_fmt(p.t)}`;
  const front = view.front[k];
  const i = front.indexOf(p);
  if (i >= 0) {
    if (i === 0) return [head, ""];
    const prev = front[i - 1];
    const dp = p.s - prev.s;
    const dx = p[k] - prev[k];
    return [head, `+${dp} ${dp === 1 ? "point" : "points"} for +${d.fmt(dx)} · ${d.per(dx / dp)} per point`];
  }
  const by = beater_of(p, view.list, k);
  return [head, by ? `beaten by ${name_of(by)} · ${by.s} for ${d.fmt(by[k])}` : ""];
}

function el(tag, attrs, parent) {
  const n = document.createElementNS(svg_ns, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function shape_of(kind, g, cls) {
  if (kind === "circle") return el("circle", { class: cls, r: 6 }, g);
  if (kind === "square") return el("rect", { class: cls, x: -5.5, y: -5.5, width: 11, height: 11 }, g);
  if (kind === "inv") return el("polygon", { class: cls, points: "0,7 6.5,-4.5 -6.5,-4.5" }, g);
  if (kind === "pent") return el("polygon", { class: cls, points: "0,-7 6.7,-2.2 4.1,5.7 -4.1,5.7 -6.7,-2.2" }, g);
  if (kind === "plus") return el("polygon", { class: cls, points: "-2.5,-7 2.5,-7 2.5,-2.5 7,-2.5 7,2.5 2.5,2.5 2.5,7 -2.5,7 -2.5,2.5 -7,2.5 -7,-2.5 -2.5,-2.5" }, g);
  if (kind === "triangle") return el("polygon", { class: cls, points: "0,-7 6.5,4.5 -6.5,4.5" }, g);
  return el("polygon", { class: cls, points: "0,-7.5 7.5,0 0,7.5 -7.5,0" }, g);
}

// the cube spans -1..1 on every axis: u = cost, v = intelligence, w = time.
// build makes every svg node once per size or scale change; frame only moves them.
function build() {
  const svg = $("chart");
  const W = Math.floor($("chart_wrap").clientWidth);
  if (!W) return false;
  const H = Math.min(480, Math.max(280, Math.round(W * 0.64)));
  const narrow = W < 480;
  const ticks = (k) => dims[k][state.axis === "log" ? (narrow ? "log_n" : "log") : narrow ? "lin_n" : "lin"];
  const scores = [];
  for (let s = score_min; s <= score_max; s += 5) scores.push(s);

  svg.replaceChildren();
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  Object.assign(scene, { W, H, pw: W - margin.l - margin.r, ph: H - margin.t - margin.b, sig: "" });

  // wall lines: b = back wall (cost x intelligence), s = side wall (time x intelligence), f = floor
  const walls = el("g", {}, svg);
  scene.lines = [];
  const line = (wall, a, b) => scene.lines.push({ wall, a, b, n: el("line", { class: "grid" }, walls) });
  for (const s of scores) {
    const v = norm_s(s);
    line("b", [-1, v, 0], [1, v, 0]);
    line("s", [0, v, -1], [0, v, 1]);
  }
  for (const x of ticks("c")) {
    const u = norm("c", x);
    line("b", [u, -1, 0], [u, 1, 0]);
    line("f", [u, -1, -1], [u, -1, 1]);
  }
  for (const x of ticks("t")) {
    const w = norm("t", x);
    line("s", [0, -1, w], [0, 1, w]);
    line("f", [-1, -1, w], [1, -1, w]);
  }

  scene.edges = [];
  const corners = [];
  for (const u of [-1, 1]) for (const v of [-1, 1]) for (const w of [-1, 1]) corners.push([u, v, w]);
  scene.corners = corners;
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const diff = corners[i].reduce((n, x, a) => n + (x !== corners[j][a]), 0);
      if (diff === 1) scene.edges.push({ a: corners[i], b: corners[j], n: el("line", { class: "edge" }, svg) });
    }
  }

  scene.tint = { c: el("polygon", { class: "tint" }, svg), t: el("polygon", { class: "tint" }, svg) };
  const drops = el("g", {}, svg);
  scene.front = { c: el("polyline", { class: "front-line" }, svg), t: el("polyline", { class: "front-line" }, svg) };
  scene.halo = el("circle", { class: "halo", r: 15 }, svg);
  scene.pts = el("g", {}, svg);

  const intro = !scene.nodes.size && motion_ok();
  const sorted = data.slice().sort((x, y) => x.c - y.c);
  for (const p of data) {
    const g = el("g", { class: `pt ${series[p.m].cls}` }, scene.pts);
    shape_of(series[p.m].shape, g, "shape");
    const core = shape_of(series[p.m].shape, g, "core");
    const drop = el("line", { class: "drop" }, drops);
    const was = scene.nodes.get(key_of(p));
    const n = was ? Object.assign(was, { g, core, drop }) : { p, g, core, drop, u: norm("c", p.c), v: norm_s(p.s), w: norm("t", p.t), a: 1, wait: 0 };
    if (intro) Object.assign(n, { v: -1, a: 0, wait: 0.25 + sorted.indexOf(p) * 0.022 });
    scene.nodes.set(key_of(p), n);
  }

  scene.ring = el("circle", { class: "ring", r: 11 }, svg);
  scene.lbls = [el("text", { class: "lbl" }, svg), el("text", { class: "lbl" }, svg)];
  const tick_g = el("g", {}, svg);
  scene.ticks = {
    c: ticks("c").map((x) => ({ x: norm("c", x), n: el("text", {}, tick_g) })),
    t: ticks("t").map((x) => ({ x: norm("t", x), n: el("text", {}, tick_g) })),
    s: scores.map((s) => ({ x: norm_s(s), n: el("text", {}, tick_g) })),
  };
  for (const k of ["c", "t"]) scene.ticks[k].forEach((tk, i) => (tk.n.textContent = dims[k].fmt(ticks(k)[i])));
  scene.ticks.s.forEach((tk, i) => (tk.n.textContent = scores[i]));
  const scale = state.axis === "log" ? ", log scale" : "";
  scene.titles = {
    c: el("text", { "text-anchor": "middle" }, svg),
    t: el("text", { "text-anchor": "middle" }, svg),
    s: el("text", { "text-anchor": "middle" }, svg),
  };
  scene.titles.c.textContent = dims.c.title + scale;
  scene.titles.t.textContent = dims.t.title + scale;
  scene.titles.s.textContent = "intelligence index";
  return true;
}

function frame() {
  if (!scene.W) return;
  const { pw, ph } = scene;
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const ac = Math.abs(cy) * cp;
  const at = Math.abs(sy) * cp;
  const k3 = smooth(0, 0.25, 1 - Math.max(ac, at, Math.abs(sp)));
  const persp = 0.14 * k3;
  const raw = (q) => {
    const z1 = -q[0] * sy + q[2] * cy;
    const z2 = q[1] * sp + z1 * cp;
    const f = 1 / (1 - persp * z2);
    return [(q[0] * cy + q[2] * sy) * f, (q[1] * cp - z1 * sp) * f, z2, f];
  };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const q of scene.corners) {
    const r = raw(q);
    x0 = Math.min(x0, r[0]);
    x1 = Math.max(x1, r[0]);
    y0 = Math.min(y0, r[1]);
    y1 = Math.max(y1, r[1]);
  }
  const inset = 1 - 0.12 * k3;
  const fx = (pw * inset) / Math.max(x1 - x0, 1e-6);
  const fy = (ph * inset) / Math.max(y1 - y0, 1e-6);
  const ox = margin.l + pw / 2;
  const oy = margin.t + ph / 2;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const S = (q) => {
    const r = raw(q);
    return [ox + (r[0] - mx) * fx, oy - (r[1] - my) * fy, r[2], r[3]];
  };
  const set = (n, attrs) => {
    for (const k in attrs) n.setAttribute(k, attrs[k]);
  };
  const seg = (n, a, b, op) => {
    const pa = S(a);
    const pb = S(b);
    set(n, { x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1] });
    n.style.opacity = op;
  };

  const face = ac >= at ? "c" : "t";
  if (face !== state.face) {
    state.face = face;
    refresh();
  }

  // near sides face the camera; walls sit on the far sides, ticks on the near bottom edges
  const wn = cy >= 0 ? 1 : -1;
  const un = sy >= 0 ? -1 : 1;
  const wall_op = { b: ac, s: at, f: Math.abs(sp) };
  for (const l of scene.lines) {
    const a = l.a.slice();
    const b = l.b.slice();
    if (l.wall === "b") a[2] = b[2] = -wn;
    if (l.wall === "s") a[0] = b[0] = -un;
    seg(l.n, a, b, wall_op[l.wall]);
  }
  for (const e of scene.edges) seg(e.n, e.a, e.b, k3);

  const share_c = (ac * ac) / (ac * ac + at * at + 1e-9);
  const share = { c: share_c, t: 1 - share_c };
  const front_sets = { c: new Set(view.front.c), t: new Set(view.front.t) };
  const at_of = (p) => scene.nodes.get(key_of(p));
  for (const k of ["c", "t"]) {
    const front = view.front[k];
    const pts = front.map((p) => {
      const n = at_of(p);
      return S([n.u, n.v, n.w]);
    });
    const op = share[k] ** 0.8;
    scene.front[k].setAttribute("points", pts.map((q) => q[0] + "," + q[1]).join(" "));
    scene.front[k].style.opacity = op;
    if (front.length) {
      const f0 = at_of(front[0]);
      const f1 = at_of(front[front.length - 1]);
      const ends = [S([f1.u, -1, f1.w]), S([f0.u, -1, f0.w])];
      scene.tint[k].setAttribute("points", pts.concat(ends).map((q) => q[0] + "," + q[1]).join(" "));
    } else scene.tint[k].setAttribute("points", "");
    scene.tint[k].style.opacity = op;
  }

  scene.pos = new Map();
  const live = [];
  for (const n of scene.nodes.values()) {
    if (n.a < 0.01) {
      n.g.setAttribute("display", "none");
      n.drop.setAttribute("display", "none");
      continue;
    }
    const q = S([n.u, n.v, n.w]);
    const fog = 1 - 0.4 * k3 * (1 - (q[2] + 1.75) / 3.5);
    n.g.removeAttribute("display");
    n.g.setAttribute("transform", `translate(${q[0]} ${q[1]}) scale(${q[3]})`);
    n.g.style.opacity = n.a * fog;
    n.core.style.fillOpacity = Math.max(front_sets.c.has(n.p) ? share.c : 0, front_sets.t.has(n.p) ? share.t : 0);
    n.drop.removeAttribute("display");
    seg(n.drop, [n.u, n.v, n.w], [n.u, -1, n.w], n.a * k3 * 0.5);
    if (state.vis.has(n.p.m)) scene.pos.set(key_of(n.p), { x: q[0], y: q[1], p: n.p });
    live.push([q[2], n]);
  }
  live.sort((x, y) => x[0] - y[0]);
  const sig = live.map((x) => key_of(x[1].p)).join();
  if (sig !== scene.sig) {
    scene.sig = sig;
    for (const [, n] of live) scene.pts.appendChild(n.g);
  }

  const act = state.pin || state.hover;
  const act_pos = act && scene.pos.get(key_of(act));
  const pick_pos = view.pick && scene.pos.get(key_of(view.pick));
  scene.ring.setAttribute("display", act_pos ? "inline" : "none");
  if (act_pos) set(scene.ring, { cx: act_pos.x, cy: act_pos.y });
  scene.halo.setAttribute("display", pick_pos ? "inline" : "none");
  if (pick_pos) set(scene.halo, { cx: pick_pos.x, cy: pick_pos.y });
  const labels = [];
  if (act_pos) labels.push([act_pos, name_of(act)]);
  if (pick_pos && view.pick !== act) labels.push([pick_pos, name_of(view.pick)]);
  scene.lbls.forEach((n, i) => {
    if (!labels[i]) return n.setAttribute("display", "none");
    const [pp, text] = labels[i];
    const right = pp.x > margin.l + pw - 120;
    const up = pp.y > margin.t + 28;
    set(n, { display: "inline", x: pp.x + (right ? -12 : 12), y: pp.y + (up ? -12 : 22), "text-anchor": right ? "end" : "start" });
    n.textContent = text;
  });

  // tick labels sit just outside their edge, pushed along the edge's screen normal, away from the cube center
  const mid = S([0, 0, 0]);
  const normal = (a, b) => {
    const pa = S(a);
    const pb = S(b);
    const dx = pb[0] - pa[0];
    const dy = pb[1] - pa[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) return [0, 1];
    let n = [-dy / len, dx / len];
    if (n[0] * ((pa[0] + pb[0]) / 2 - mid[0]) + n[1] * ((pa[1] + pb[1]) / 2 - mid[1]) < 0) n = [-n[0], -n[1]];
    return n;
  };
  const place = (node, q, n, d, op, anchor) => {
    set(node, {
      x: q[0] + n[0] * d,
      y: q[1] + n[1] * d + (n[1] > 0.5 ? 9 : 4),
      "text-anchor": anchor || (n[0] < -0.4 ? "end" : n[0] > 0.4 ? "start" : "middle"),
    });
    node.style.opacity = op;
  };
  let edge = null;
  for (const u of [-1, 1]) {
    for (const w of [-1, 1]) {
      const q = S([u, 0, w]);
      if (!edge || q[0] < edge.x - 0.5 || (Math.abs(q[0] - edge.x) <= 0.5 && q[2] > edge.z)) edge = { u, w, x: q[0], z: q[2] };
    }
  }
  const n_s = normal([edge.u, -1, edge.w], [edge.u, 1, edge.w]);
  // the lowest score tick shares its corner with the floor ticks, so it bows out as the cube turns
  for (const tk of scene.ticks.s) place(tk.n, S([edge.u, tk.x, edge.w]), n_s, 9, tk.x === -1 ? 1 - k3 : 1);
  const op_c = smooth(0.15, 0.6, Math.abs(cy));
  const op_t = smooth(0.15, 0.6, Math.abs(sy));
  const n_c = normal([-1, -1, wn], [1, -1, wn]);
  const n_t = normal([un, -1, -1], [un, -1, 1]);
  for (const tk of scene.ticks.c) place(tk.n, S([tk.x, -1, wn]), n_c, 9, op_c);
  for (const tk of scene.ticks.t) place(tk.n, S([un, -1, tk.x]), n_t, 9, op_t);
  const title = (node, q, n, op) => {
    const d = 33 + 22 * k3;
    place(node, q, n, d, op, "middle");
    node.setAttribute("x", clamp(q[0] + n[0] * d, 100, scene.W - 100));
  };
  // phones have no room beside tilted edges; the tick units ($ and s) still name the axes
  const room = scene.W < 480 ? 1 - k3 : 1;
  title(scene.titles.c, S([0, -1, wn]), n_c, op_c * room);
  title(scene.titles.t, S([un, -1, 0]), n_t, op_t * room);
  scene.titles.s.setAttribute("transform", `translate(14 ${S([edge.u, 0, edge.w])[1]}) rotate(-90)`);
}

// springs for the camera, eased lerps for the points; returns true while anything still moves
function step(dt) {
  const motion = motion_ok();
  let moving = false;
  if (!motion) {
    if (!drag) Object.assign(cam, { yaw: cam.ty, pitch: cam.tp, vy: 0, vp: 0 });
  } else if (!drag) {
    const w = 6.5;
    const h = dt / 4;
    for (let i = 0; i < 4; i++) {
      cam.vy += (-w * w * (cam.yaw - cam.ty) - 2 * w * cam.vy) * h;
      cam.vp += (-w * w * (cam.pitch - cam.tp) - 2 * w * cam.vp) * h;
      cam.yaw += cam.vy * h;
      cam.pitch += cam.vp * h;
    }
    if (Math.abs(cam.yaw - cam.ty) + Math.abs(cam.pitch - cam.tp) < 1e-4 && Math.abs(cam.vy) + Math.abs(cam.vp) < 1e-3) {
      Object.assign(cam, { yaw: cam.ty, pitch: cam.tp, vy: 0, vp: 0 });
    } else moving = true;
  }
  const ease = motion ? 1 - Math.exp(-dt * 7) : 1;
  for (const n of scene.nodes.values()) {
    if (n.wait > 0) {
      n.wait -= dt;
      moving = true;
      continue;
    }
    for (const [x, t] of [["u", n.tu], ["v", n.tv], ["w", n.tw], ["a", n.ta]]) {
      const d = t - n[x];
      if (Math.abs(d) < 1e-3) n[x] = t;
      else {
        n[x] += d * ease;
        moving = true;
      }
    }
  }
  return moving;
}

function tick(now) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
  raf = 0;
  const moving = step(dt);
  frame();
  last = moving ? now : 0;
  if (moving) raf = requestAnimationFrame(tick);
}

function kick() {
  if (!raf) raf = requestAnimationFrame(tick);
}

function set_view(v) {
  const [yaw, pitch] = views[v];
  state.view = v;
  cam.ty = yaw + Math.round((cam.yaw - yaw) / (2 * Math.PI)) * 2 * Math.PI;
  cam.tp = pitch;
  sync_controls();
  write_hash();
  kick();
}

function render_readout() {
  const { pick } = view;
  const k = state.face;
  const act = state.pin || state.hover;
  let num = act;
  let lines;
  if (act) lines = readout_lines(act);
  else if (pick) {
    num = pick;
    lines = [`best within ${dims[k].fmt(state.budget[k])}`, `${name_of(pick)} · ${pick.s} · ${usd_fmt(pick.c)} · ${sec_fmt(pick.t)}`];
  } else lines = [`nothing visible within ${dims[k].fmt(state.budget[k])}`, ""];
  $("r_num").textContent = num ? num.s : "–";
  $("r_l1").textContent = lines[0];
  $("r_l2").textContent = lines[1];
}

function render_table() {
  const sort = cols[state.sort.i];
  const rows = data.slice().sort((x, y) => {
    const a = sort.sort(x);
    const b = sort.sort(y);
    return (a < b ? -1 : a > b ? 1 : 0) * state.sort.dir;
  });
  $("rows").replaceChildren(
    ...rows.map((p) => {
      const tr = document.createElement("tr");
      if (!state.vis.has(p.m)) tr.className = "off";
      for (const c of cols) {
        const td = document.createElement("td");
        td.textContent = c.text(p);
        tr.appendChild(td);
      }
      return tr;
    })
  );
}

function refresh() {
  const list = visible();
  const k = state.face;
  view = { list, front: { c: frontier_of(list, "c"), t: frontier_of(list, "t") }, pick: pick_of(list, k) };
  for (const n of scene.nodes.values()) {
    const p = n.p;
    n.tu = norm("c", p.c);
    n.tv = norm_s(p.s);
    n.tw = norm("t", p.t);
    n.ta = !state.vis.has(p.m) ? 0 : p[k] > state.budget[k] + 1e-9 ? 0.28 : 1;
  }
  render_readout();
  render_table();
  sync_controls();
  kick();
}

function sync_controls() {
  document.querySelectorAll("#legend button").forEach((b) => {
    const on = state.vis.has(b.dataset.key);
    b.setAttribute("aria-pressed", on);
    b.disabled = on && state.vis.size === 1;
  });
  document.querySelectorAll("#orgs button").forEach((b) => {
    const keys = b.dataset.org === "all" ? order : orgs[b.dataset.org];
    b.setAttribute("aria-pressed", keys.every((k) => state.vis.has(k)));
  });
  document.querySelectorAll("#axis button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.axis === state.axis));
  document.querySelectorAll("#views button").forEach((b) => {
    const on = b.dataset.view === state.view;
    b.setAttribute("aria-pressed", on);
    if (on) $("views").style.setProperty("--pill", `translateX(${b.offsetLeft}px)`);
    if (on) $("views").style.setProperty("--pill_w", b.offsetWidth + "px");
  });
  $("chart_wrap").classList.toggle("free", state.view === "3d");
  document.querySelectorAll("#head_row th").forEach((th, i) => {
    const dir = state.sort.dir > 0 ? "ascending" : "descending";
    th.setAttribute("aria-sort", i === state.sort.i ? dir : "none");
    th.firstChild.textContent = cols[i].label();
  });
  const k = state.face;
  const d = dims[k];
  const r = $("budget");
  r.min = Math.log10(d.lo);
  r.max = Math.log10(d.hi);
  r.value = Math.log10(state.budget[k]);
  $("budget_lbl").textContent = d.budget;
  $("budget_out").textContent = d.fmt(state.budget[k]);
}

function read_hash() {
  const q = new URLSearchParams(location.hash.slice(1));
  const v = q.get("vis");
  if (v) {
    const keys = order.filter((k) => v.includes(k));
    if (keys.length) state.vis = new Set(keys);
  }
  if (q.get("axis") === "linear") state.axis = "linear";
  for (const [k, name] of [["c", "budget"], ["t", "limit"]]) {
    const b = parseFloat(q.get(name));
    if (isFinite(b)) state.budget[k] = clamp(dims[k].round(b), dims[k].lo, dims[k].hi);
  }
  if (views[q.get("view")]) state.view = q.get("view");
  [cam.yaw, cam.pitch] = [cam.ty, cam.tp] = views[state.view];
  state.face = Math.abs(Math.cos(cam.yaw)) >= Math.abs(Math.sin(cam.yaw)) ? "c" : "t";
  if (motion_ok()) {
    cam.yaw -= 0.55;
    cam.pitch += 0.42;
  }
}

function write_hash() {
  const q = [];
  if (state.vis.size < order.length) q.push("vis=" + order.filter((k) => state.vis.has(k)).join(""));
  if (state.axis !== "log") q.push("axis=" + state.axis);
  if (state.budget.c !== 1) q.push("budget=" + state.budget.c.toFixed(2));
  if (state.budget.t !== 300) q.push("limit=" + state.budget.t);
  if (state.view !== "c") q.push("view=" + state.view);
  const base = location.href.split("#")[0];
  try {
    history.replaceState(null, "", q.length ? base + "#" + q.join("&") : base);
  } catch (e) {}
}

function build_head() {
  cols.forEach((c, i) => {
    const th = document.createElement("th");
    const b = document.createElement("button");
    b.type = "button";
    b.addEventListener("click", () => {
      state.sort = state.sort.i === i ? { i, dir: -state.sort.dir } : { i, dir: 1 };
      sync_controls();
      render_table();
    });
    th.appendChild(b);
    $("head_row").appendChild(th);
  });
}

function nearest(e) {
  const rect = $("chart").getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  let best = null;
  let bd = 24;
  for (const v of scene.pos.values()) {
    const d = Math.hypot(v.x - px, v.y - py);
    if (d <= bd) {
      best = v.p;
      bd = d;
    }
  }
  return best;
}

function wire() {
  const svg = $("chart");
  const turn = 0.009;

  // a press that travels past 5px rotates the cube; a press that stays put pins the nearest point
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: false, t: e.timeStamp, vy: 0, vp: 0 };
  });
  svg.addEventListener("pointermove", (e) => {
    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        svg.setPointerCapture(e.pointerId);
        $("chart_wrap").classList.add("dragging");
        state.hover = null;
        state.view = "3d";
        sync_controls();
      }
      if (!drag.moved) return;
      const yaw = drag.yaw + dx * turn;
      const pitch = clamp(drag.pitch + dy * turn, -0.35, 1.15);
      const dt = Math.max(1, e.timeStamp - drag.t) / 1000;
      drag.vy = drag.vy * 0.5 + ((yaw - cam.yaw) / dt) * 0.5;
      drag.vp = drag.vp * 0.5 + ((pitch - cam.pitch) / dt) * 0.5;
      drag.t = e.timeStamp;
      Object.assign(cam, { yaw, pitch, ty: yaw, tp: pitch, vy: 0, vp: 0 });
      kick();
      return;
    }
    if (e.pointerType !== "mouse" || state.pin) return;
    const h = nearest(e);
    if (h !== state.hover) {
      state.hover = h;
      refresh();
    }
  });
  const release = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const was = drag;
    drag = null;
    $("chart_wrap").classList.remove("dragging");
    if (was.moved) {
      // coast: aim the spring where the throw would have carried the cube, so release keeps its momentum
      if (motion_ok() && e.timeStamp - was.t < 80) {
        cam.ty = cam.yaw + was.vy * 0.16;
        cam.tp = clamp(cam.pitch + was.vp * 0.16, -0.35, 1.15);
        cam.vy = was.vy;
        cam.vp = was.vp;
      }
      write_hash();
      kick();
      return;
    }
    if (e.type !== "pointerup") return;
    const hit = nearest(e);
    if (!hit) return;
    state.pin = state.pin === hit ? null : hit;
    refresh();
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  svg.addEventListener("pointerleave", () => {
    if (state.hover && !drag) {
      state.hover = null;
      refresh();
    }
  });
  svg.addEventListener("keydown", (e) => {
    const k = state.face;
    const list = view.list.slice().sort((x, y) => x[k] - y[k] || y.s - x.s);
    if (!list.length) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      state.pin = null;
      refresh();
      return;
    }
    const cur = state.pin ? list.indexOf(state.pin) : list.indexOf(view.pick);
    let nxt;
    if (e.key === "ArrowRight") nxt = cur < 0 ? 0 : Math.min(list.length - 1, cur + 1);
    else if (e.key === "ArrowLeft") nxt = cur < 0 ? list.length - 1 : Math.max(0, cur - 1);
    else if (e.key === "Home") nxt = 0;
    else if (e.key === "End") nxt = list.length - 1;
    else return;
    e.preventDefault();
    state.pin = list[nxt];
    refresh();
  });

  document.querySelectorAll("#views button").forEach((b) => b.addEventListener("click", () => set_view(b.dataset.view)));

  const set_vis = () => {
    if (state.pin && !state.vis.has(state.pin.m)) state.pin = null;
    if (state.hover && !state.vis.has(state.hover.m)) state.hover = null;
    refresh();
    write_hash();
  };

  document.querySelectorAll("#legend button").forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.key;
      if (state.vis.has(k)) {
        if (state.vis.size === 1) return;
        state.vis.delete(k);
      } else state.vis.add(k);
      set_vis();
    })
  );

  // with everything shown, an org click solos that org; otherwise it toggles
  document.querySelectorAll("#orgs button").forEach((b) =>
    b.addEventListener("click", () => {
      const org = b.dataset.org;
      if (org === "all") state.vis = new Set(order);
      else {
        const keys = orgs[org];
        const on = keys.every((k) => state.vis.has(k));
        if (state.vis.size === order.length) state.vis = new Set(keys);
        else if (on && state.vis.size > keys.length) keys.forEach((k) => state.vis.delete(k));
        else keys.forEach((k) => state.vis.add(k));
      }
      set_vis();
    })
  );

  document.querySelectorAll("#axis button").forEach((b) =>
    b.addEventListener("click", () => {
      state.axis = b.dataset.axis;
      build();
      refresh();
      write_hash();
    })
  );

  $("budget").addEventListener("input", (e) => {
    const k = state.face;
    state.budget[k] = clamp(dims[k].round(10 ** parseFloat(e.target.value)), dims[k].lo, dims[k].hi);
    refresh();
    write_hash();
  });

  const apply_theme = (t) => {
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  };
  try {
    const t = localStorage.getItem("pareto_theme");
    if (t) {
      $("theme").value = t;
      apply_theme(t);
    }
  } catch (e) {}
  $("theme").addEventListener("change", (e) => {
    apply_theme(e.target.value);
    try {
      localStorage.setItem("pareto_theme", e.target.value);
    } catch (err) {}
  });

  $("csv").addEventListener("click", () => {
    const rows = [["series", "effort", "index", "usd_per_task", "seconds_per_task", "status"]].concat(
      data.map((p) => [series[p.m].name, efforts[p.e], p.s, p.c, p.t, status_text(p)])
    );
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "claude-pareto-v4.3.2.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $("copy").addEventListener("click", () => {
    const msg = $("copy_msg");
    const fail = () => {
      msg.textContent = "copy failed";
    };
    if (!navigator.clipboard || !navigator.clipboard.writeText) return fail();
    navigator.clipboard.writeText(location.href).then(() => {
      msg.textContent = "link copied";
    }, fail);
  });

  new ResizeObserver(() => {
    const w = $("chart_wrap").clientWidth;
    if (w !== state.last_w) {
      state.last_w = w;
      build();
      refresh();
    }
  }).observe($("chart_wrap"));
}

read_hash();
build_head();
wire();
build();
refresh();
