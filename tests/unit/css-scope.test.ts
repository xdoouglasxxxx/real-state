import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Lista os seletores de regras "de verdade" (entra em @media/@supports; ignora @keyframes e @font-face). */
export function selectorsOf(css: string): string[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  const walk = (s: string) => {
    let i = 0;
    while (i < s.length) {
      const open = s.indexOf("{", i);
      if (open < 0) break;
      const head = s.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < s.length && depth) { if (s[j] === "{") depth++; else if (s[j] === "}") depth--; j++; }
      const body = s.slice(open + 1, j - 1);
      if (head.startsWith("@")) { if (/^@(media|supports|layer)/.test(head)) walk(body); }
      else out.push(...head.split(",").map((x) => x.trim()).filter(Boolean));
      i = j;
    }
  };
  walk(src);
  return out;
}

const scoped = (scope: string) => new RegExp(`^\\.${scope}(?=$|[\\s.:\\[>+~#])`);
const FILES: [string, string][] = [
  ["src/app/(site)/site-theme.css", "site"],
  ["src/app/painel/painel-theme.css", "panel"],
];

for (const [file, scope] of FILES) {
  test(`${file}: toda regra começa com .${scope} (nada vaza para outras áreas)`, () => {
    const sels = selectorsOf(readFileSync(file, "utf8"));
    assert.ok(sels.length > 30, "o arquivo deveria ter dezenas de regras");
    const bad = sels.filter((s) => !scoped(scope).test(s));
    assert.deepEqual(bad, [], `seletores fora do escopo: ${bad.slice(0, 8).join(" | ")}`);
    assert.ok(!sels.some((s) => /(^|\s)(html|body|:root|\*)(\s|$|[.:#\[])/.test(s.replace(new RegExp(`^\\.${scope}\\s*`), "")) && !s.startsWith(`.${scope} *`)), "sem regras em html/body/:root");
  });
}

test("o parser de seletores entende @media aninhado e ignora @keyframes", () => {
  const css = `/* c */ .a, .b > i { x:1 } @media (max-width:1px){ .c{y:2} .d , .e{z:3} } @keyframes k { from{a:1} to{a:2} } @font-face{font-family:x}`;
  assert.deepEqual(selectorsOf(css), [".a", ".b > i", ".c", ".d", ".e"]);
});
