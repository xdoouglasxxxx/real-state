/*
 * Cliente de dados — MODO LOCAL (mock)
 * ------------------------------------
 * Este cliente imita a interface do SDK do Base44:
 *   base44.entities.<Entidade>.list(sort?, limit?)
 *   base44.entities.<Entidade>.filter(query, sort?, limit?)
 *   base44.entities.<Entidade>.get(id)
 *   base44.entities.<Entidade>.create(data)
 *
 * Para reconectar ao Base44 REAL, substitua este arquivo por:
 *
 *   import { createClient } from '@base44/sdk';
 *   import { appParams } from '@/lib/app-params';
 *   const { appId, token, functionsVersion, appBaseUrl } = appParams;
 *   export const base44 = createClient({
 *     appId, token, functionsVersion,
 *     serverUrl: '', requiresAuth: false, appBaseUrl,
 *   });
 *
 * (e instale a dependência: npm i @base44/sdk)
 */

import { PROPERTIES, AGENTS, TESTIMONIALS, BLOG_POSTS } from "./mockData";

const sortRows = (rows, sort) => {
  if (!sort) return [...rows];
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const x = a[key] ?? "";
    const y = b[key] ?? "";
    return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
  });
};

const makeEntity = (rows) => ({
  async list(sort, limit) {
    const out = sortRows(rows, sort);
    return limit ? out.slice(0, limit) : out;
  },
  async filter(query = {}, sort, limit) {
    const out = sortRows(
      rows.filter((r) => Object.entries(query).every(([k, v]) => r[k] === v)),
      sort
    );
    return limit ? out.slice(0, limit) : out;
  },
  async get(id) {
    return rows.find((r) => r.id === id) ?? null;
  },
  async create(data) {
    const record = {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      created_date: new Date().toISOString(),
      ...data,
    };
    rows.push(record);
    return record;
  },
});

export const base44 = {
  entities: {
    Property: makeEntity(PROPERTIES),
    Agent: makeEntity(AGENTS),
    Testimonial: makeEntity(TESTIMONIALS),
    BlogPost: makeEntity(BLOG_POSTS),
    Inquiry: makeEntity([]),
    User: makeEntity([]),
  },
};
