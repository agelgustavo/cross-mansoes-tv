import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path,root),'utf8');
const workouts=JSON.parse(read('data/2026-10-29.json')).programs;
const index=JSON.parse(read('data/index.json'));
const context={window:{}};
vm.runInNewContext(read('layout.js'),context);
const layout=context.window.MansoesLayout;

test('dados do dia 29 mantidos integralmente em JSON, incluindo cargas e categorias',()=>{
  assert.deepEqual(index.days['2026-10-29'],['crossfit','hybrid']);
  assert.match(workouts.crossfit.warmup,/Alternating Samson Lunges/);
  assert.match(workouts.crossfit.wod,/Score: tempo do pior round/);
  assert.match(workouts.crossfit.adaptations,/42,5\/30 kg/);
  assert.match(workouts.crossfit.adaptations,/10\/7,5 kg/);
  assert.match(workouts.hybrid.wod,/200 m Burpee Broad Jumps/);
  assert.match(workouts.hybrid.adaptations,/RX \/ INT \/ SC: 200 m/);
});
test('componentes geram 5 páginas CrossFit com acessório separado e 2 Hybrid',()=>{
  assert.equal(layout.makeSlides(workouts.crossfit).map(p=>p.kind).join(','),'warmup,skill,wod,adaptations,accessory');
  assert.equal(layout.makeSlides(workouts.hybrid).map(p=>p.kind).join(','),'wod,adaptations');
});
test('WOD distingue formato, movimentos, duração e score sem alterar informações',()=>{
  const wod=layout.makeSlides(workouts.crossfit).find(p=>p.kind==='wod');
  assert.equal(wod.formats[0],'EVERY 3:00 | 6 SETS');
  assert.equal(wod.items.length,2);
  assert.equal(wod.kpis[0].title,'Duração total');
  assert.equal(wod.kpis[0].value,"18'");
  assert.equal(wod.kpis[1].value,'tempo do pior round');
});
test('Hybrid preserva time cap, score e lista de seis movimentos',()=>{
  const wod=layout.makeSlides(workouts.hybrid).find(p=>p.kind==='wod');
  assert.equal(wod.items.length,6);
  assert.equal(wod.kpis.length,2);
  assert.equal(wod.kpis[0].value,"60'");
  assert.equal(wod.items[0].name,'Row');
  assert.equal(wod.items[0].value,'2.000 m');
});
test('Adaptações mantêm movimento e categorias, sem inventar RX+ no Hybrid',()=>{
  const cross=layout.makeSlides(workouts.crossfit).find(p=>p.kind==='adaptations');
  const hybrid=layout.makeSlides(workouts.hybrid).find(p=>p.kind==='adaptations');
  assert.equal(cross.items.length,2);
  assert.equal(hybrid.items.length,4);
  assert.equal(layout.makeSlides(workouts.hybrid).filter(p=>p.kind==='adaptations').length,2);
  const crossHtml=layout.section(cross),hybridHtml=layout.section(hybrid);
  for(const label of ['RX+','RX','INT','SC','INI'])assert.ok(crossHtml.includes(label));
  assert.ok(hybridHtml.includes('RX / INT / SC: 200 m'));
  assert.ok(!hybridHtml.includes('RX+'));
});
test('Aplicação inicia com scripts separados, navegação acessível e identidade do mascote',()=>{
  const html=read('index.html'),app=read('app.js'),css=read('styles.css');
  assert.ok(html.indexOf('layout.js') < html.indexOf('app.js'));
  assert.match(app,/const VERSION = '4\.1\.0'/);
  assert.match(app,/app\.addEventListener\('click'/);
  assert.match(app,/function enforceFit/);
  assert.match(app,/gorilla-icon\.jpg/);
  assert.match(css,/\.kpi-card/);
  assert.ok(readFileSync(new URL('assets/gorilla-icon.jpg',root)).length>1000);
});

test('WOD contínuo é exatamente um bloco; parágrafos de Score/Formato não quebram',()=>{
 const w={title:'TESTE',wod:"FOR TIME\n12 Burpees\n12 Thrusters\n\nScore: Tempo total\nTime Cap: 20'"};
 const page=layout.makeSlides(w).find(p=>p.kind==='wod');
 assert.equal(page.items.length,2);
 assert.equal(page.blocks.length,1);
 assert.equal(page.kpis.length,2);
 assert.match(layout.section(page),/wod-single/);
 assert.match(layout.section(page),/tempo total/i);
});
test('WOD com dois parágrafos de movimentos cria dois painéis',()=>{
 const w={title:'BLOCOS',wod:"FOR TIME\n\n12 Burpees\n10 Thrusters\n\n400 m Run\n10 Wall Balls\n\nScore: Tempo total"};
 const page=layout.makeSlides(w).find(p=>p.kind==='wod');
 assert.equal(page.blocks.length,2);
 assert.equal(page.items.length,4);
 assert.match(layout.section(page),/wod-multi/);
 assert.equal((layout.section(page).match(/class="wod-block"/g)||[]).length,2);
});
test('BLOCO 1 e BLOCO 2 criam divisão mesmo sem parágrafo',()=>{
 const w={title:'BLOCOS',wod:'BLOCO 1\n12 Burpees\nBLOCO 2\n10 Thrusters\nScore: Total'};
 const page=layout.makeSlides(w).find(p=>p.kind==='wod');
 assert.equal(page.blocks.length,2);
 assert.equal(page.blocks[0].label,'BLOCO 1');
 assert.equal(page.blocks[1].label,'BLOCO 2');
});
test('adaptações paginam no máximo 4 movimentos por tela',()=>{
 const pages=layout.makeSlides(workouts.hybrid).filter(p=>p.kind==='adaptations');
 assert.equal(pages.length,2);
 assert.equal(pages.map(p=>p.items.length).join(','),'4,2');
 const css=read('styles.css');
 assert.match(css,/font-size:clamp\(28px,1\.65vw,34px\)/);
});
