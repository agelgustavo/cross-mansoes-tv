import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newDraft,
  validDate,
  keyOf,
  validateDraft,
  approve,
  mergeDays,
  catalogWorkout,
  validateFile,
  escapeHTML,
} from "../homolog/model.js";
import { readFileSync } from "node:fs";
const page = {
  id: "one",
  title: "WOD",
  path: "media/" + "a".repeat(64) + ".png",
  status: "ready",
};
const draft = () => ({ ...newDraft("2026-11-02", "crossfit"), pages: [page] });
test("datas reais e modalidades fixas", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2026-11-01"), true);
  assert.throws(() => keyOf("2026-11-01", "other"));
});
test("rascunho não altera catálogo; aprovação preserva outra modalidade e a ordem", () => {
  const catalog = {
    version: 1,
    workouts: { "2026-11-02/hybrid": { date: "2026-11-02", mode: "hybrid" } },
  };
  const d = draft();
  d.pages.push({ ...page, id: "two", title: "Pós-treino" });
  const next = approve(catalog, d, "rev1", "coach");
  assert.equal(Object.keys(catalog.workouts).length, 1);
  assert.equal(Object.keys(next.workouts).length, 2);
  assert.deepEqual(
    next.workouts["2026-11-02/crossfit"].pages.map((p) => p.title),
    ["WOD", "Pós-treino"],
  );
  assert.ok(!("status" in next.workouts["2026-11-02/crossfit"].pages[0]));
});
test("aprovação bloqueia vazio, arquivo pendente, título vazio, caminhos externos e IDs repetidos", () => {
  for (const override of [
    { pages: [] },
    { pages: [{ ...page, status: "processing" }] },
    { pages: [{ ...page, title: " " }] },
    { pages: [{ ...page, path: "https://bad.test/a.png" }] },
    { pages: [page, page] },
  ])
    assert.throws(() => validateDraft({ ...draft(), ...override }));
});
test("edição concorrente não sobrescreve publicação de outra pessoa", () => {
  assert.throws(
    () =>
      approve(
        { workouts: { "2026-11-02/crossfit": { revision: "new" } } },
        draft(),
        "next",
        "coach",
      ),
    /outra pessoa/,
  );
});
test("catálogo une treinos e preserva dados estáticos", () => {
  const base = { days: { "2026-11-02": ["crossfit"] } };
  const catalog = { workouts: { x: { date: "2026-11-02", mode: "hybrid" } } };
  assert.deepEqual(mergeDays(base, catalog).days["2026-11-02"], [
    "crossfit",
    "hybrid",
  ]);
  assert.deepEqual(base.days["2026-11-02"], ["crossfit"]);
});
test("viewer só recebe páginas aprovadas de biblioteca", () => {
  const c = approve({ workouts: {} }, draft(), "r", "coach");
  assert.equal(
    catalogWorkout(c, "2026-11-02", "crossfit", (p) => "https://test/" + p)
      .posters[0].label,
    "WOD",
  );
});
test("formatos e limites de upload explícitos", () => {
  for (const name of [
    "a.png",
    "a.HTML",
    "a.pdf",
    "a.docx",
    "a.doc",
    "a.odt",
    "a.rtf",
    "a.pptx",
    "a.xlsx",
  ])
    assert.doesNotThrow(() => validateFile({ name, size: 100 }));
  assert.throws(() => validateFile({ name: "a.exe", size: 100 }));
  assert.throws(() => validateFile({ name: "a.pdf", size: 30e6 }));
});
test("HTML de títulos sempre escapado", () =>
  assert.equal(
    escapeHTML('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  ));
test("homologação tem branch, cache e rotas próprios; nenhuma chave persistida", () => {
  const config = readFileSync("homolog/config.js", "utf8"),
    app = readFileSync("homolog/app.js", "utf8"),
    editor = readFileSync("homolog/editor.js", "utf8");
  assert.match(config, /workout-content-homolog/);
  assert.match(app, /mansoes-tv-homolog-v1/);
  assert.doesNotMatch(editor, /localStorage\.setItem.*token/);
  assert.doesNotMatch(editor, /sessionStorage/);
});
