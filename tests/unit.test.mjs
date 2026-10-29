import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const get = path => readFileSync(new URL(path, root), 'utf8');
const index = JSON.parse(get('data/index.json'));
const workout = JSON.parse(get('data/2026-10-29.json'));
const html = get('index.html');
const js = get('app.js');

test('entradas do calendário têm dados completos por modalidade', () => {
  for (const [day, types] of Object.entries(index.days)) {
    assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Array.isArray(types) && types.length > 0);
    const data = JSON.parse(get(`data/${day}.json`));
    for (const type of types) {
      assert.ok(['crossfit', 'hybrid'].includes(type));
      assert.ok(data.programs[type]);
      assert.ok(data.programs[type].wod);
    }
  }
});
test('dia 29 mantém os dois treinos', () => {
  assert.deepEqual(index.days['2026-10-29'], ['crossfit', 'hybrid']);
  assert.match(workout.programs.crossfit.warmup, /Samson/);
  assert.match(workout.programs.crossfit.wod, /ZUKO/);
  assert.match(workout.programs.crossfit.adaptations, /RX\+/);
  assert.match(workout.programs.hybrid.wod, /2\.000 m Row/);
  assert.match(workout.programs.hybrid.adaptations, /SC/);
});
test('boot previsível: script externo, sem script inline e sem SW antigo', () => {
  assert.match(html, /<script src="\.\/app\.js\?v=/);
  assert.doesNotMatch(html, /<script>\s*\(\(\)/);
  assert.match(js, /app\.addEventListener\('click'/);
  assert.doesNotMatch(js, /serviceWorker\.register\(/);
});
test('navegação possui teclado e relógio resiliente', () => {
  assert.match(js, /function openDay\(date\)/);
  assert.match(js, /function openProgram\(program\)/);
  assert.match(js, /function keyboard\(event\)/);
  assert.match(js, /America\/Sao_Paulo/);
  assert.match(js, /setInterval\(tickClock/);
});

test('uma página por seção e ícone do gorila enviado', () => {
  assert.ok(js.includes("---PAGE---"));
  assert.match(js, /result.push\(\{ label, kind: field, text \}\)/);
  assert.match(js, /gorilla-icon\.jpg/);
  assert.ok(readFileSync(new URL('assets/gorilla-icon.jpg',root)).length > 1000);
});
