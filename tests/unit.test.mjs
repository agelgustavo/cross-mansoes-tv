import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const data=JSON.parse(readFileSync(new URL('../data/index.json',import.meta.url),'utf8'));
const w=JSON.parse(readFileSync(new URL('../data/2026-10-29.json',import.meta.url),'utf8'));
test('título, estrutura HTML e calendário',()=>{assert.match(html,/id="app"/);assert.match(html,/function calendar\(\)/);assert.match(html,/function slides\(\)/);});
test('relógio fixo no cabeçalho e atualização',()=>{assert.match(html,/id="tv-clock"/);assert.match(html,/function tickClock/);assert.match(html,/America\/Sao_Paulo/);assert.match(html,/setInterval\(/);});
test('controle remoto possui navegação e Enter',()=>{for(const k of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Enter','Backspace'])assert.ok(html.includes(k));assert.match(html,/data-act="next"/);assert.match(html,/data-act="previous"/);});
test('calendário contém treino em 29 de outubro',()=>{assert.deepEqual(data.days['2026-10-29'],['crossfit','hybrid']);});
test('ambos os treinos possuem conteúdo correto',()=>{assert.match(w.programs.crossfit.wod,/ZUKO/);assert.match(w.programs.crossfit.warmup,/Samson/);assert.match(w.programs.crossfit.adaptations,/RX\+/);assert.match(w.programs.hybrid.wod,/APPA|200 m Sled Push/);assert.match(w.programs.hybrid.adaptations,/RX:/);});
test('todos os dias do índice têm arquivo de conteúdo',()=>{for(const day of Object.keys(data.days)){const obj=JSON.parse(readFileSync(new URL('../data/'+day+'.json',import.meta.url),'utf8'));for(const p of data.days[day])assert.ok(obj.programs[p],day+' '+p);}});

test('regressão: função do relógio existe antes de renderizar calendário',()=>{
 assert.match(html,/function tickClock\(\)/);
 assert.match(html,/function render\(\)/);
 assert.ok(html.indexOf('function tickClock(){') < html.indexOf('function render(){'));
 assert.match(html,/controls\.forEach\(\(el,i\)=>\{/);
});
