import { test } from "node:test";
import assert from "node:assert/strict";
import { firstName, normalizeBrPhone, waLink, fmtHour, fmtDayLong, draftColdLead, draftContract, draftVisit } from "../../src/lib/agent-drafts";

test("firstName: só o primeiro nome, com a inicial maiúscula", () => {
  assert.equal(firstName("Mariana Costa"), "Mariana");
  assert.equal(firstName("MARIANA COSTA"), "Mariana");
  assert.equal(firstName("joão da silva"), "João");
  assert.equal(firstName("  Ana  "), "Ana");
  assert.equal(firstName("McDonald Silva"), "McDonald");   // nome com maiúsculas internas não é "consertado"
  for (const v of ["", "   ", null, undefined]) assert.equal(firstName(v as any), "");
});

test("normalizeBrPhone: formatos comuns e inválidos", () => {
  assert.equal(normalizeBrPhone("(11) 98765-4321"), "5511987654321");
  assert.equal(normalizeBrPhone("11987654321"), "5511987654321");
  assert.equal(normalizeBrPhone("(11) 3456-7890"), "551134567890");        // fixo
  assert.equal(normalizeBrPhone("+55 11 98765-4321"), "5511987654321");
  assert.equal(normalizeBrPhone("5511987654321"), "5511987654321");
  assert.equal(normalizeBrPhone("011 98765-4321"), "5511987654321");       // zero do operador
  assert.equal(normalizeBrPhone("55 98765-4321"), "5555987654321");        // DDD 55 (RS): 11 dígitos = nacional, não "já tem 55"
  for (const bad of ["", "abc", "12345", "123456789", "1234567890123456", null, undefined]) assert.equal(normalizeBrPhone(bad as any), null, String(bad));
});

test("waLink: codifica acentos e quebras de linha; sem telefone válido não gera link", () => {
  const l = waLink("(11) 98765-4321", "Olá, João!\nTudo bem? Café & pão")!;
  assert.ok(l.startsWith("https://wa.me/5511987654321?text="));
  assert.equal(decodeURIComponent(l.split("text=")[1]), "Olá, João!\nTudo bem? Café & pão");
  assert.ok(!l.includes(" ") && !l.includes("\n"));
  assert.equal(waLink("sem telefone", "x"), null);
  assert.equal(waLink(null, "x"), null);
});

test("fmtHour e fmtDayLong: horário de Brasília, igual em qualquer fuso da máquina", () => {
  assert.equal(fmtHour(new Date("2026-11-13T13:00:00Z")), "10h");
  assert.equal(fmtHour(new Date("2026-11-13T13:30:00Z")), "10h30");
  assert.equal(fmtHour(new Date("2026-11-13T03:00:00Z")), "0h");           // meia-noite em Brasília
  assert.equal(fmtDayLong(new Date("2026-11-13T13:00:00Z")), "sexta-feira, 13/11");
  // 02:30 UTC de 13/11 ainda é 23:30 de 12/11 em Brasília
  assert.equal(fmtDayLong(new Date("2026-11-13T02:30:00Z")), "quinta-feira, 12/11");
  assert.equal(fmtHour(new Date("2026-11-13T02:30:00Z")), "23h30");
});

test("rascunhos: usam só o primeiro nome e o imóvel; nunca sobrenome, telefone ou e-mail", () => {
  const org = "Maison Estate";
  const all = [
    draftColdLead({ name: "Mariana Souza Costa", property: "Loft Jardins", org }),
    draftContract({ name: "Fernanda Ryu", property: "Garden Moema", org }),
    draftVisit({ name: "Carla Mendes", property: "Penthouse Horizonte", when: new Date("2026-11-13T13:00:00Z"), org }),
  ];
  assert.ok(all[0].includes("Mariana") && !all[0].includes("Souza") && !all[0].includes("Costa"));
  assert.ok(all[1].includes("Fernanda") && !all[1].includes("Ryu"));
  assert.ok(all[2].includes("Carla") && !all[2].includes("Mendes"));
  for (const t of all) { assert.ok(!/\d{4}[-\s]?\d{4}/.test(t), "sem telefone"); assert.ok(!t.includes("@"), "sem e-mail"); assert.ok(t.includes(org)); }
});

test("rascunhos: texto do lembrete de visita e variações sem nome/imóvel", () => {
  const v = draftVisit({ name: "Carla Mendes", property: "Penthouse Horizonte", when: new Date("2026-11-13T13:00:00Z"), org: "Maison Estate" });
  assert.equal(v, "Olá, Carla! Lembrando da nossa visita ao Penthouse Horizonte amanhã (sexta-feira, 13/11), às 10h. Qualquer imprevisto é só me avisar. — Maison Estate");
  assert.ok(draftColdLead({ name: "", property: null, org: "X" }).startsWith("Olá! Aqui é da X."));
  assert.ok(!draftColdLead({ name: "Ana", property: null, org: "X" }).includes("null"));
  assert.ok(!draftContract({ name: null, property: null, org: "X" }).includes("undefined"));
});
