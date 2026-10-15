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
// m = model key, e = index into efforts, c = usd per task, s = index score
const data = [
  { m: "a", e: 0, c: 1.1, s: 39 }, { m: "a", e: 1, c: 2.19, s: 45 }, { m: "a", e: 2, c: 3.61, s: 48 }, { m: "a", e: 3, c: 4.88, s: 50 }, { m: "a", e: 4, c: 5.86, s: 51 },
  { m: "o", e: 0, c: 0.55, s: 42 }, { m: "o", e: 1, c: 1.34, s: 51 }, { m: "o", e: 2, c: 1.82, s: 54 }, { m: "o", e: 3, c: 3.46, s: 56 }, { m: "o", e: 4, c: 5.98, s: 58 },
  { m: "s", e: 0, c: 0.35, s: 36 }, { m: "s", e: 1, c: 0.48, s: 41 }, { m: "s", e: 2, c: 0.88, s: 47 }, { m: "s", e: 3, c: 2.01, s: 52 }, { m: "s", e: 4, c: 5.46, s: 56 },
  { m: "h", e: 0, c: 0.02, s: 29 }, { m: "h", e: 1, c: 0.05, s: 34 }, { m: "h", e: 2, c: 0.08, s: 38 }, { m: "h", e: 3, c: 0.12, s: 41 }, { m: "h", e: 4, c: 0.21, s: 43 },
  { m: "p", e: 4, c: 4.08, s: 42 }, { m: "t", e: 4, c: 1.99, s: 47 }, { m: "f", e: 3, c: 2.63, s: 38 }, { m: "g", e: 5, c: 1.3, s: 30 },
  { m: "x", e: 3, c: 1.75, s: 44 }, { m: "d", e: 4, c: 0.22, s: 34 }, { m: "i", e: 5, c: 0.13, s: 46 }, { m: "u", e: 4, c: 1.6, s: 48 },
];

const cost_min = 0.02;
const cost_max = 6;
const score_min = 25;
const score_max = 60;
const margin = { l: 56, r: 16, t: 16, b: 48 };
const svg_ns = "http://www.w3.org/2000/svg";
const cols = [
  { label: "series", sort: (p) => series[p.m].name, text: (p) => series[p.m].name },
  { label: "effort", sort: (p) => p.e, text: (p) => efforts[p.e] },
  { label: "index", sort: (p) => p.s, text: (p) => String(p.s) },
  { label: "usd per task", sort: (p) => p.c, text: (p) => usd_fmt(p.c) },
  { label: "status", sort: (p) => status_text(p), text: (p) => status_text(p) },
];
const sig_fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumSignificantDigits: 2 });

const state = {
  vis: new Set(order),
  axis: "log",
  budget: 1,
  pin: null,
  hover: null,
  sort: { i: 3, dir: 1 },
  pos: new Map(),
  anim: false,
  fade: false,
  last_w: 0,
};
let view = { list: [], front: [], pick: null };

const $ = (id) => document.getElementById(id);
const usd_fmt = (x) => "$" + x.toFixed(2);
const per_fmt = (x) => (x >= 0.1 ? usd_fmt(x) : sig_fmt.format(x));
const name_of = (p) => series[p.m].name + (p.e === 5 ? "" : " " + efforts[p.e]);
const visible = () => data.filter((p) => state.vis.has(p.m));
const motion_ok = () => window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

function frontier_of(list) {
  const sorted = [...list].sort((x, y) => x.c - y.c || y.s - x.s);
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

function beater_of(p, list) {
  let win = null;
  for (const q of list) {
    if (q === p || q.s < p.s || q.c > p.c) continue;
    if (!win || q.c < win.c || (q.c === win.c && q.s > win.s)) win = q;
  }
  return win;
}

function pick_of(list) {
  let win = null;
  for (const q of list) {
    if (q.c > state.budget + 1e-9) continue;
    if (!win || q.s > win.s || (q.s === win.s && q.c < win.c)) win = q;
  }
  return win;
}

function status_text(p) {
  if (!state.vis.has(p.m)) return "hidden";
  if (view.front.includes(p)) return "frontier";
  const by = beater_of(p, view.list);
  return by ? "beaten by " + name_of(by) : "frontier";
}

function readout_lines(p) {
  const head = `${name_of(p)} · ${p.s} · ${usd_fmt(p.c)}`;
  const i = view.front.indexOf(p);
  if (i >= 0) {
    if (i === 0) return [head, ""];
    const prev = view.front[i - 1];
    const dp = p.s - prev.s;
    const dc = p.c - prev.c;
    return [head, `+${dp} ${dp === 1 ? "point" : "points"} for +${usd_fmt(dc)} · ${per_fmt(dc / dp)} per point`];
  }
  const by = beater_of(p, view.list);
  return [head, by ? `beaten by ${name_of(by)} · ${by.s} for ${usd_fmt(by.c)}` : ""];
}

function el(tag, attrs, parent) {
  const n = document.createElementNS(svg_ns, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function shape_of(kind, g) {
  if (kind === "circle") return el("circle", { class: "shape", r: 6 }, g);
  if (kind === "square") return el("rect", { class: "shape", x: -5.5, y: -5.5, width: 11, height: 11 }, g);
  if (kind === "inv") return el("polygon", { class: "shape", points: "0,7 6.5,-4.5 -6.5,-4.5" }, g);
  if (kind === "pent") return el("polygon", { class: "shape", points: "0,-7 6.7,-2.2 4.1,5.7 -4.1,5.7 -6.7,-2.2" }, g);
  if (kind === "plus") return el("polygon", { class: "shape", points: "-2.5,-7 2.5,-7 2.5,-2.5 7,-2.5 7,2.5 2.5,2.5 2.5,7 -2.5,7 -2.5,2.5 -7,2.5 -7,-2.5 -2.5,-2.5" }, g);
  if (kind === "triangle") return el("polygon", { class: "shape", points: "0,-7 6.5,4.5 -6.5,4.5" }, g);
  return el("polygon", { class: "shape", points: "0,-7.5 7.5,0 0,7.5 -7.5,0" }, g);
}

function draw() {
  const svg = $("chart");
  const W = Math.floor($("chart_wrap").clientWidth);
  if (!W) return;
  const H = Math.min(460, Math.max(260, Math.round(W * 0.62)));
  const pw = W - margin.l - margin.r;
  const ph = H - margin.t - margin.b;
  const base = margin.t + ph;
  const lo = Math.log10(cost_min);
  const hi = Math.log10(cost_max);
  const xs = (c) => margin.l + (state.axis === "log" ? (Math.log10(c) - lo) / (hi - lo) : c / cost_max) * pw;
  const ys = (s) => margin.t + ((score_max - s) / (score_max - score_min)) * ph;
  const prev = state.pos;
  const motion = motion_ok();

  svg.replaceChildren();
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  state.pos = new Map();

  const grid = el("g", {}, svg);
  for (let v = score_min; v <= score_max; v += 5) {
    el("line", { class: "grid", x1: margin.l, x2: margin.l + pw, y1: ys(v), y2: ys(v) }, grid);
    el("text", { x: margin.l - 8, y: ys(v) + 4, "text-anchor": "end" }, grid).textContent = v;
  }
  const narrow = W < 480;
  const xticks = state.axis === "log"
    ? (narrow ? [0.02, 0.1, 1, 5] : [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5])
    : (narrow ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6]);
  for (const v of xticks) {
    el("line", { class: "grid", x1: xs(v), x2: xs(v), y1: margin.t, y2: base }, grid);
    el("text", { x: xs(v), y: base + 18, "text-anchor": xs(v) > margin.l + pw - 6 ? "end" : "middle" }, grid).textContent = usd_fmt(v);
  }
  el("text", { x: margin.l + pw / 2, y: H - 6, "text-anchor": "middle" }, svg).textContent =
    "cost per task, usd" + (state.axis === "log" ? ", log scale" : "");
  el("text", { transform: `translate(14 ${margin.t + ph / 2}) rotate(-90)`, "text-anchor": "middle" }, svg).textContent =
    "intelligence index";

  const { list, front, pick } = view;
  const front_set = new Set(front);
  if (front.length) {
    const pts = front.map((p) => `${xs(p.c)},${ys(p.s)}`);
    const area = [`${xs(front[0].c)},${base}`, ...pts, `${xs(front[front.length - 1].c)},${base}`].join(" ");
    el("polygon", { class: "tint", points: area }, svg);
    const fg = el("g", {}, svg);
    el("polyline", { class: "front-line", points: pts.join(" ") }, fg);
    if (state.fade && motion) fg.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 250, easing: "ease-out" });
  }

  for (const p of list) {
    const x = xs(p.c);
    const y = ys(p.s);
    const key = p.m + p.e;
    const was = prev.get(key);
    const cls = `pt ${series[p.m].cls}${front_set.has(p) ? " front" : ""}${p.c > state.budget + 1e-9 ? " faded" : ""}`;
    const g = el("g", { class: cls, transform: `translate(${x} ${y})` }, svg);
    shape_of(series[p.m].shape, g);
    state.pos.set(key, { x, y, p });
    if (state.anim && motion && was && (was.x !== x || was.y !== y)) {
      g.animate([{ transform: `translate(${was.x}px, ${was.y}px)` }, { transform: `translate(${x}px, ${y}px)` }], { duration: 250, easing: "ease-out" });
    }
  }

  const act = state.pin || state.hover;
  const act_pos = act && state.pos.get(act.m + act.e);
  if (act_pos) el("circle", { class: "ring", cx: act_pos.x, cy: act_pos.y, r: 11 }, svg);
  const labels = [];
  if (act_pos) labels.push([act_pos, name_of(act)]);
  if (pick && pick !== act && state.pos.get(pick.m + pick.e)) labels.push([state.pos.get(pick.m + pick.e), name_of(pick)]);
  for (const [pp, text] of labels) {
    const right = pp.x > margin.l + pw - 120;
    const up = pp.y > margin.t + 28;
    el("text", { class: "lbl", x: pp.x + (right ? -12 : 12), y: pp.y + (up ? -12 : 22), "text-anchor": right ? "end" : "start" }, svg).textContent = text;
  }
  state.anim = false;
  state.fade = false;
}

function render_readout() {
  const { list, front, pick } = view;
  const act = state.pin || state.hover;
  let num = act;
  let lines;
  if (act) lines = readout_lines(act);
  else if (pick) {
    num = pick;
    lines = [`best within ${usd_fmt(state.budget)}`, `${name_of(pick)} · ${pick.s} · ${usd_fmt(pick.c)}`];
  } else lines = [`nothing visible within ${usd_fmt(state.budget)}`, ""];
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
  const front = frontier_of(list);
  const pick = pick_of(list);
  view = { list, front, pick };
  draw();
  render_readout();
  render_table();
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
  document.querySelectorAll("#head_row th").forEach((th, i) => {
    const dir = state.sort.dir > 0 ? "ascending" : "descending";
    th.setAttribute("aria-sort", i === state.sort.i ? dir : "none");
  });
  $("budget").value = Math.log10(state.budget);
  $("budget_out").textContent = usd_fmt(state.budget);
}

function read_hash() {
  const q = new URLSearchParams(location.hash.slice(1));
  const v = q.get("vis");
  if (v) {
    const keys = order.filter((k) => v.includes(k));
    if (keys.length) state.vis = new Set(keys);
  }
  if (q.get("axis") === "linear") state.axis = "linear";
  const b = parseFloat(q.get("budget"));
  if (isFinite(b)) state.budget = Math.min(cost_max, Math.max(cost_min, Math.round(b * 100) / 100));
}

function write_hash() {
  const q = [];
  if (state.vis.size < order.length) q.push("vis=" + order.filter((k) => state.vis.has(k)).join(""));
  if (state.axis !== "log") q.push("axis=" + state.axis);
  if (state.budget !== 1) q.push("budget=" + state.budget.toFixed(2));
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
    b.textContent = c.label;
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
  for (const v of state.pos.values()) {
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
  svg.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || state.pin) return;
    const h = nearest(e);
    if (h !== state.hover) {
      state.hover = h;
      refresh();
    }
  });
  svg.addEventListener("pointerleave", () => {
    if (state.hover) {
      state.hover = null;
      refresh();
    }
  });
  svg.addEventListener("pointerdown", (e) => {
    const hit = nearest(e);
    if (!hit) return;
    state.pin = state.pin === hit ? null : hit;
    refresh();
  });
  svg.addEventListener("keydown", (e) => {
    const list = view.list.slice().sort((x, y) => x.c - y.c || y.s - x.s);
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

  const set_vis = () => {
    if (state.pin && !state.vis.has(state.pin.m)) state.pin = null;
    if (state.hover && !state.vis.has(state.hover.m)) state.hover = null;
    state.fade = true;
    refresh();
    sync_controls();
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
      state.anim = true;
      state.fade = true;
      refresh();
      sync_controls();
      write_hash();
    })
  );

  $("budget").addEventListener("input", (e) => {
    state.budget = Math.round(10 ** parseFloat(e.target.value) * 100) / 100;
    sync_controls();
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
    const rows = [["series", "effort", "index", "usd_per_task", "status"]].concat(
      data.map((p) => [series[p.m].name, efforts[p.e], p.s, p.c, status_text(p)])
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
      refresh();
    }
  }).observe($("chart_wrap"));
}

read_hash();
build_head();
sync_controls();
wire();
refresh();
