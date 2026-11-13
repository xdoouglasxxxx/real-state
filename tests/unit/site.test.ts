import { test } from "node:test";
import assert from "node:assert/strict";
import { roundCoord, publicLatLng, safeLogoUrl, publicPins, whatsappHref, plural, safeJsonLd, PUBLIC_COORD_DECIMALS } from "../../src/lib/site";

test("roundCoord: 3 casas (célula de ~110 m)", () => {
  assert.equal(PUBLIC_COORD_DECIMALS, 3);
  assert.equal(roundCoord(-23.4995123), -23.5);
  assert.equal(roundCoord(-23.54987), -23.55); assert.equal(roundCoord(-46.84971), -46.85); assert.equal(roundCoord(1.23456, 2), 1.23);
});

test("publicLatLng: devolve SEMPRE a coordenada arredondada, nunca a exata", () => {
  let seed = 99; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 500; i++) {
    const lat = -35 + rnd() * 40, lng = -75 + rnd() * 40;
    const pt = publicLatLng(lat, lng)!;
    assert.ok(Math.abs(pt.lat - lat) <= 0.0005 + 1e-9 && Math.abs(pt.lng - lng) <= 0.0005 + 1e-9, "no máximo ~55 m de deslocamento");
    assert.notEqual(pt.lat, lat, "a coordenada exata não pode passar");
    assert.ok((String(pt.lat).split(".")[1]?.length ?? 0) <= 3 && (String(pt.lng).split(".")[1]?.length ?? 0) <= 3, "no máximo 3 casas decimais");
  }
  assert.deepEqual(publicLatLng(-23.4995, -46.8497), { lat: -23.499, lng: -46.85 }); // -23,4995 é um empate: o JS arredonda para cima
  assert.deepEqual(publicLatLng("-23.5063", "-46.8508"), { lat: -23.506, lng: -46.851 });
});

test("publicLatLng: entradas inválidas viram null", () => {
  for (const [a, b] of [[null, null], [undefined, 1], ["", ""], ["abc", "1"], [NaN, 1], [Infinity, 1], [91, 0], [0, 181], [-91, 10], [0, 0], [{}, []], [true, false]])
    assert.equal(publicLatLng(a, b), null, JSON.stringify([a, b]));
});

test("safeLogoUrl: só https, sem credenciais, com tamanho razoável", () => {
  assert.equal(safeLogoUrl("https://cdn.exemplo.com/logo.png"), "https://cdn.exemplo.com/logo.png");
  assert.equal(safeLogoUrl("  https://cdn.exemplo.com/a b.png  "), "https://cdn.exemplo.com/a%20b.png");
  for (const bad of ["http://x.com/a.png", "javascript:alert(1)", "data:image/png;base64,AAAA", "//x.com/a.png", "/logo.png", "logo.png", "https://", "https://user:pw@x.com/a.png", "https://x.com/" + "a".repeat(600), "", "   ", null, undefined, "ftp://x.com/a.png"])
    assert.equal(safeLogoUrl(bad as any), null, String(bad).slice(0, 40));
});

test("publicPins: lista branca — só 6 campos, nada interno", () => {
  const row = { id: "i1", slug: "casa-do-vale", title: "Casa do Vale", status: "FOR_SALE", price: "4850000", latitude: -23.4995123, longitude: -46.8497456,
    agentId: "ag1", ownerId: "c9", commissionPct: 6, address: "Rua Secreta 123", zipcode: "06454-000", description: "interno", features: ["x"], organizationId: "o1" };
  const [pin] = publicPins([row]);
  assert.deepEqual(Object.keys(pin).sort(), ["exclusive", "lat", "lng", "price", "slug", "title"]);
  assert.deepEqual(pin, { slug: "casa-do-vale", title: "Casa do Vale", price: 4850000, lat: -23.5, lng: -46.85, exclusive: false });
  const json = JSON.stringify(pin);
  for (const secret of ["ag1", "c9", "Secreta", "06454", "interno", "-23.4995123", "-46.8497456", "commission"]) assert.ok(!json.includes(secret), `vazou: ${secret}`);
});

test("publicPins: ignora sem coordenada, sem slug e fora de venda; exclusivo marcado; respeita o limite", () => {
  const base = { slug: "s", title: "T", price: 1, latitude: -23.5, longitude: -46.6 };
  const rows = [
    { ...base, status: "FOR_SALE", slug: "a" }, { ...base, status: "EXCLUSIVE", slug: "b" },
    { ...base, status: "SOLD", slug: "c" }, { ...base, status: "RESERVED", slug: "d" }, { ...base, status: "DRAFT", slug: "e" },
    { ...base, status: "FOR_SALE", slug: "f", latitude: null }, { ...base, status: "FOR_SALE", slug: "" }, null, undefined,
  ];
  const pins = publicPins(rows as any);
  assert.deepEqual(pins.map((p) => p.slug), ["a", "b"]); assert.equal(pins[1].exclusive, true);
  const many = Array.from({ length: 500 }, (_, i) => ({ ...base, status: "FOR_SALE", slug: "s" + i }));
  assert.equal(publicPins(many, 50).length, 50);
  assert.deepEqual(publicPins(undefined as any), []);
});

test("whatsappHref: só com telefone válido; o texto vai codificado", () => {
  const l = whatsappHref("(11) 98765-4321", "Olá! Café & pão")!;
  assert.ok(l.startsWith("https://wa.me/5511987654321?text=")); assert.equal(decodeURIComponent(l.split("text=")[1]), "Olá! Café & pão");
  for (const bad of ["", null, undefined, "abc", "123"]) assert.equal(whatsappHref(bad as any, "x"), null);
  assert.equal(plural(1, "imóvel", "imóveis"), "imóvel"); assert.equal(plural(0, "imóvel", "imóveis"), "imóveis"); assert.equal(plural(5, "imóvel", "imóveis"), "imóveis");
});

test("safeJsonLd: um valor com </script> não consegue fechar a tag nem injetar HTML", () => {
  const hostile = { name: "</script><script>alert(1)</script>", t: "<img src=x onerror=alert(2)> & mais", sep: "a\u2028b\u2029c", ok: "Ação — çãõ" };
  const out = safeJsonLd(hostile);
  assert.ok(!/[<>&]/.test(out), "nenhum <, > ou & cru no texto");
  assert.ok(!out.includes("\u2028") && !out.includes("\u2029"), "separadores de linha Unicode escapados");
  assert.deepEqual(JSON.parse(out), hostile, "continua sendo o mesmo JSON para quem lê");
  assert.ok(!/<\/script/i.test(out));
  assert.equal(safeJsonLd({ a: 1 }), '{"a":1}', "JSON comum não muda");
});
