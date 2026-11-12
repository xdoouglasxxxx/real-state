import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHex, relLuminance, contrastRatio, readableAccent, DEFAULT_ACCENT } from "../../src/lib/contrast";

const SURFACES = ["#0d0f12", "#11141a", "#161a21", "#1d222b"]; // fundo, menu, cartão, hover do painel
const DARK_TEXT = "#0d0f12";
const BRANDS = ["#c6a15b", "#1d4ed8", "#1e3a8a", "#166534", "#7f1d1d", "#6d28d9", "#ea580c", "#374151", "#111111", "#000000", "#0a0a0a", "#ffffff", "#ff00ff", "#00ffff", "#800000", "#003366"];

test("parseHex aceita #rgb, #rrggbb e sem #; rejeita lixo", () => {
  assert.deepEqual(parseHex("#c6a15b"), [198, 161, 91]);
  assert.deepEqual(parseHex("fff"), [255, 255, 255]);
  assert.deepEqual(parseHex("#ABC"), [170, 187, 204]);
  for (const bad of ["", "#12", "#12345", "azul", "#gggggg", "rgb(1,2,3)", "#1234567"]) assert.equal(parseHex(bad), null, bad);
});

test("contraste: valores de referência", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  assert.equal(contrastRatio("#777777", "#777777"), 1);
  assert.ok(Math.abs(relLuminance("#ffffff") - 1) < 1e-9);
  assert.ok(relLuminance("#000000") < 1e-9);
});

test("o dourado padrão passa intacto", () => {
  assert.equal(readableAccent("#c6a15b"), "#c6a15b");
});

test("QUALQUER cor de marca vira acento com ≥ 4,5:1 em todas as superfícies do painel", () => {
  for (const b of BRANDS) {
    const a = readableAccent(b);
    for (const s of SURFACES) assert.ok(contrastRatio(a, s) >= 4.5, `${b} → ${a} sobre ${s}: ${contrastRatio(a, s).toFixed(2)}`);
  }
});

test("e texto escuro sobre o acento (botão sólido) passa de 4,5:1", () => {
  for (const b of BRANDS) {
    const a = readableAccent(b);
    assert.ok(contrastRatio(DARK_TEXT, a) >= 4.5, `${b} → ${a}: ${contrastRatio(DARK_TEXT, a).toFixed(2)}`);
  }
});

test("não clareia mais que o necessário (marca já legível não muda)", () => {
  for (const b of ["#ea580c", "#ffffff", "#00ffff", "#ff00ff"]) {
    const rgb = parseHex(b)!;
    if (relLuminance(b) >= 0.25) assert.equal(readableAccent(b), "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join(""));
  }
  // marca escura: o resultado fica perto do limite, não vira branco
  const navy = readableAccent("#1e3a8a");
  assert.ok(relLuminance(navy) < 0.4, `azul-marinho clareou demais: ${navy}`);
});

test("preserva o matiz: azul continua azul, vinho continua avermelhado", () => {
  const [r, g, b] = parseHex(readableAccent("#1e3a8a"))!;
  assert.ok(b > r && b > g, "azul perdeu o matiz");
  const [r2, g2, b2] = parseHex(readableAccent("#7f1d1d"))!;
  assert.ok(r2 > g2 && r2 > b2, "vinho perdeu o matiz");
});

test("entrada inválida cai no dourado padrão", () => {
  for (const bad of ["", "azul", "#12", "undefined"]) assert.equal(readableAccent(bad), DEFAULT_ACCENT);
});
