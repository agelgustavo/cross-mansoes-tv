import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const index = JSON.parse(read('data/index.json'));
const workout = JSON.parse(read('data/2026-10-29.json'));
const html = read('index.html');
const js = read('app.js');
const css = read('styles.css');

test('índice possui datas válidas e treino por modalidade', () => {
  for (const [day, programs] of Object.entries(index.days)) {
    assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Array.isArray(programs) && programs.length > 0);
    const payload = JSON.parse(read(`data/${day}.json`));
    for (const program of programs) {
      assert.ok(['crossfit', 'hybrid'].includes(program));
      assert.ok(payload.programs[program]);
    }
  }
});

test('dia 29 mantém CrossFit e Hybrid', () => {
  assert.deepEqual(index.days['2026-10-29'], ['crossfit', 'hybrid']);
  assert.match(workout.programs.crossfit.warmup, /Samson/);
  assert.match(workout.programs.crossfit.wod, /ZUKO/);
  assert.match(workout.programs.hybrid.wod, /2\.000 m Row/);
});

test('boot usa app.js externo e versão 3.0.0', () => {
  assert.match(html, /<script src="\.\/app\.js\?v=/);
  assert.match(js, /const VERSION = '3\.0\.0'/);
  assert.match(js, /app\.addEventListener\('click'/);
  assert.match(js, /document\.addEventListener\('keydown', keyboard\)/);
});

test('paginação é automática por grupo e não depende de ---PAGE---', () => {
  assert.match(js, /function paginateGroups/);
  assert.match(js, /replace\(/);
  assert.match(js, /pageTotal/);
});

test('calendário mostra labels de programas e layout em colunas', () => {
  assert.match(js, /CrossFit/);
  assert.match(js, /Hybrid Run/);
  assert.match(css, /\.day-programs/);
  assert.match(css, /\.text-columns\{height:100%;column-count:2/);
  assert.match(css, /\.adapt-grid\{height:100%;display:grid/);
});
