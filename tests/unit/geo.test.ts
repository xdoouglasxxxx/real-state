import { test } from "node:test";
import assert from "node:assert/strict";
import {
  project, unproject, fitView, visibleTiles, toScreen, tileUrl, clusterPoints,
  DEFAULT_VIEW, MAX_ZOOM, MIN_ZOOM, TILE_SIZE,
} from "../../src/lib/geo";

const SP = { lat: -23.5505, lng: -46.6333 };
const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("project/unproject: ida e volta devolve o mesmo ponto", () => {
  for (const z of [3, 10, 16]) {
    const p = project(SP.lat, SP.lng, z);
    const q = unproject(p.x, p.y, z);
    near(q.lat, SP.lat); near(q.lng, SP.lng);
  }
});

test("project: valores de referência do Web Mercator", () => {
  const o = project(0, 0, 0); // centro do mundo no zoom 0
  near(o.x, 128, 1e-9); near(o.y, 128, 1e-9);
  const west = project(0, -180, 0); near(west.x, 0, 1e-9);
  const east = project(0, 180, 0); near(east.x, 256, 1e-9);
  assert.ok(project(60, 0, 5).y < project(-60, 0, 5).y, "norte tem y menor");
});

test("fitView: sem pontos usa a vista padrão; um ponto, zoom 15", () => {
  assert.deepEqual(fitView([], 800, 400), DEFAULT_VIEW);
  const v = fitView([SP], 800, 400);
  assert.equal(v.zoom, 15); near(v.lat, SP.lat); near(v.lng, SP.lng);
});

test("fitView: todos os pontos cabem na área, com a margem, no zoom escolhido", () => {
  const pts = [
    { lat: -23.5063, lng: -46.8508 }, { lat: -23.7947, lng: -46.2258 },
    { lat: -23.3745, lng: -46.5871 }, { lat: -23.5843, lng: -46.6766 },
  ];
  const W = 800, H = 440, pad = 56;
  const v = fitView(pts, W, H, pad);
  for (const p of pts) {
    const s = toScreen(p.lat, p.lng, v, W, H);
    assert.ok(s.x >= pad - 1 && s.x <= W - pad + 1, `x fora: ${s.x}`);
    assert.ok(s.y >= pad - 1 && s.y <= H - pad + 1, `y fora: ${s.y}`);
  }
  // e o zoom é o MAIOR possível: um nível acima já não caberia
  const z2 = v.zoom + 1;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) { const q = project(p.lat, p.lng, z2); minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y); }
  assert.ok(maxX - minX > W - 2 * pad || maxY - minY > H - 2 * pad, "um zoom a mais ainda caberia");
});

test("fitView: pontos idênticos não quebram (zoom máximo permitido)", () => {
  const v = fitView([SP, SP, SP], 800, 400);
  assert.equal(v.zoom, 16);
});

test("fitView: limites de zoom respeitados", () => {
  const v = fitView([{ lat: -80, lng: -170 }, { lat: 80, lng: 170 }], 300, 200);
  assert.ok(v.zoom >= MIN_ZOOM && v.zoom <= MAX_ZOOM);
});

test("visibleTiles: cobre a área toda, sem buracos e sem sobreposição", () => {
  const W = 800, H = 440;
  const view = { ...SP, zoom: 12 };
  const tiles = visibleTiles(view, W, H);
  assert.ok(tiles.length > 0);
  const lefts = [...new Set(tiles.map((t) => t.left))].sort((a, b) => a - b);
  const tops = [...new Set(tiles.map((t) => t.top))].sort((a, b) => a - b);
  assert.ok(lefts[0] <= 0 && lefts[lefts.length - 1] + TILE_SIZE >= W, "cobre a largura");
  assert.ok(tops[0] <= 0 && tops[tops.length - 1] + TILE_SIZE >= H, "cobre a altura");
  for (let i = 1; i < lefts.length; i++) assert.equal(lefts[i] - lefts[i - 1], TILE_SIZE, "sem emenda no X");
  for (let i = 1; i < tops.length; i++) assert.equal(tops[i] - tops[i - 1], TILE_SIZE, "sem emenda no Y");
  assert.equal(new Set(tiles.map((t) => t.key)).size, tiles.length, "sem tiles duplicados");
});

test("visibleTiles: o centro da vista cai no centro da área", () => {
  const W = 800, H = 440;
  const view = { ...SP, zoom: 13 };
  const s = toScreen(view.lat, view.lng, view, W, H);
  near(s.x, W / 2, 1e-6); near(s.y, H / 2, 1e-6);
});

test("visibleTiles: dá a volta no X e ignora Y fora do mundo", () => {
  const tiles = visibleTiles({ lat: 0, lng: -179.9, zoom: 3 }, 1200, 400);
  const n = 2 ** 3;
  for (const t of tiles) { assert.ok(t.x >= 0 && t.x < n, `x ${t.x}`); assert.ok(t.y >= 0 && t.y < n, `y ${t.y}`); }
  const polar = visibleTiles({ lat: 85, lng: 0, zoom: 3 }, 800, 800);
  for (const t of polar) assert.ok(t.y >= 0);
});

test("tileUrl: preenche z/x/y", () => {
  assert.equal(tileUrl("https://t.exemplo/{z}/{x}/{y}.png", { z: 12, x: 1517, y: 2306 }), "https://t.exemplo/12/1517/2306.png");
});

test("clusterPoints: agrupa pontos próximos e separa os distantes", () => {
  const a = { id: "a", lat: -23.5843, lng: -46.6766 };
  const b = { id: "b", lat: -23.5629, lng: -46.6698 };
  const c = { id: "c", lat: -23.7947, lng: -46.2258 };
  const wide = clusterPoints([a, b, c], { lat: -23.6, lng: -46.5, zoom: 9 }, 800, 440);
  assert.equal(wide.length, 2); // a+b juntos, c sozinho
  assert.equal(wide.find((x) => x.items.length === 2)!.items.map((i) => i.id).sort().join(), "a,b");
  const close = clusterPoints([a, b, c], { lat: -23.57, lng: -46.673, zoom: 15 }, 800, 440);
  assert.ok(close.filter((x) => x.items.length === 1).length >= 2, "de perto, a e b se separam");
});
