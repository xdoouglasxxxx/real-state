/**
 * Geometria do mapa dos imóveis — sem biblioteca de mapas.
 * Projeção Web Mercator (EPSG:3857), a mesma dos tiles do OpenStreetMap,
 * Google, MapTiler etc. Funções puras (testadas em tests/unit/geo.test.ts).
 */
export const TILE_SIZE = 256;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 18;

export type LatLng = { lat: number; lng: number };
export type View = LatLng & { zoom: number };

/** Vista padrão quando não há imóvel com coordenadas (grande São Paulo). */
export const DEFAULT_VIEW: View = { lat: -23.55, lng: -46.63, zoom: 10 };

const clampLat = (lat: number) => Math.max(-85.0511, Math.min(85.0511, lat));

/** lat/lng → pixel "do mundo" no zoom dado. */
export function project(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const sin = Math.sin((clampLat(lat) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/** pixel "do mundo" → lat/lng (inversa de project). */
export function unproject(x: number, y: number, zoom: number): LatLng {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const n = Math.PI - (2 * Math.PI * y) / scale;
  return {
    lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
    lng: (x / scale) * 360 - 180,
  };
}

/**
 * Maior zoom (inteiro) em que todos os pontos cabem na área width×height,
 * com margem `padding`. Um ponto só: zoom 15. Nenhum: vista padrão.
 */
export function fitView(points: LatLng[], width: number, height: number, padding = 56, maxZoom = 16): View {
  if (points.length === 0) return DEFAULT_VIEW;
  if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng, zoom: Math.min(15, maxZoom) };
  const w = Math.max(80, width - padding * 2);
  const h = Math.max(80, height - padding * 2);
  let last: View = DEFAULT_VIEW;
  for (let z = maxZoom; z >= MIN_ZOOM; z--) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      const q = project(p.lat, p.lng, z);
      if (q.x < minX) minX = q.x;
      if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y;
      if (q.y > maxY) maxY = q.y;
    }
    const c = unproject((minX + maxX) / 2, (minY + maxY) / 2, z);
    last = { lat: c.lat, lng: c.lng, zoom: z };
    if (maxX - minX <= w && maxY - minY <= h) return last;
  }
  return last; // não coube nem no zoom mínimo: centraliza e segue
}

export type Tile = { key: string; z: number; x: number; y: number; left: number; top: number };

/** Tiles que cobrem a área visível, com a posição (px) de cada um dentro dela. */
export function visibleTiles(view: View, width: number, height: number): Tile[] {
  const z = Math.round(view.zoom);
  const c = project(view.lat, view.lng, z);
  const tlx = c.x - width / 2;
  const tly = c.y - height / 2;
  const n = Math.pow(2, z);
  const x0 = Math.floor(tlx / TILE_SIZE);
  const x1 = Math.floor((tlx + width) / TILE_SIZE);
  const y0 = Math.floor(tly / TILE_SIZE);
  const y1 = Math.floor((tly + height) / TILE_SIZE);
  const out: Tile[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = x0; tx <= x1; tx++) {
      const wx = ((tx % n) + n) % n; // dá a volta no mundo no eixo X
      out.push({
        key: `${z}/${tx}/${ty}`, z, x: wx, y: ty,
        left: Math.round(tx * TILE_SIZE - tlx), top: Math.round(ty * TILE_SIZE - tly),
      });
    }
  }
  return out;
}

/** lat/lng → posição (px) dentro da área visível. */
export function toScreen(lat: number, lng: number, view: View, width: number, height: number) {
  const z = Math.round(view.zoom);
  const c = project(view.lat, view.lng, z);
  const p = project(lat, lng, z);
  return { x: p.x - c.x + width / 2, y: p.y - c.y + height / 2 };
}

/** Preenche {z}/{x}/{y} do modelo de URL de tiles. */
export function tileUrl(template: string, t: { z: number; x: number; y: number }) {
  return template.replace("{z}", String(t.z)).replace("{x}", String(t.x)).replace("{y}", String(t.y));
}

export type Cluster<T> = { x: number; y: number; items: T[] };

/** Agrupa pontos que ficariam a menos de `radius` px um do outro na tela. */
export function clusterPoints<T extends LatLng>(items: T[], view: View, width: number, height: number, radius = 30): Cluster<T>[] {
  const clusters: Cluster<T>[] = [];
  for (const it of items) {
    const p = toScreen(it.lat, it.lng, view, width, height);
    const hit = clusters.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < radius);
    if (hit) hit.items.push(it);
    else clusters.push({ x: p.x, y: p.y, items: [it] });
  }
  return clusters;
}
