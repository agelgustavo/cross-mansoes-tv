/* Mansões TV visual components. All training text is provided by JSON, never generated. */
(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sections = [['warmup','AQUECIMENTO'],['skill','SKILL / STRENGTH'],['wod','WOD'],['adaptations','ADAPTAÇÕES'],['rules','REGRAS'],['accessory','OPTIONAL ACCESSORY']];
  const text = value => Array.isArray(value) ? value.join('\n') : typeof value === 'string' ? value : value?.text || '';
  const lines = value => text(value).replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(s=>s && s !== '---PAGE---');
  const groups = value => text(value).replace(/\r/g,'').replace(/\n\s*---PAGE---\s*\n/g,'\n\n').split(/\n\s*\n/).map(x=>x.split('\n').map(s=>s.trim()).filter(Boolean)).filter(x=>x.length);
  const amount = line => line.match(/^[-•]?\s*(\d+(?:\.\d{3})*(?:,\d+)?(?:\s*m|["'])?)\s+(.+)$/i);
  const isFormat = line => /^(?:EVERY\b|AMRAP\b|EMOM\b|FOR TIME\b|TEAMS OF\b|PARTNER\b|TABATA\b|\d+\s*(?:ROUNDS|SETS)\b|\d+\s*[–-]\s*\d+\s*SETS\b|BODY BUILDER\b)/i.test(line);
  const metric = line => line.match(/^(Score|Time Cap|Duração total|Rest|Descanso)\s*:\s*(.*)$/i);
  const normalized = str => String(str).toLowerCase().replace(/[^a-z0-9áàâãéêíóôõúç]+/g,' ').trim();
  function icon(name) {
    const paths = {
      run:'<circle cx="16" cy="4" r="2"/><path d="m7 21 5-6 2-5 5 3 3 7M12 15l-6 3M14 10l-4-3-5 2"/>',
      row:'<path d="M3 20h24M6 17l4-3 4 3m-4-3 8-7M3 6h18M8 22l2-5m13 5-2-5"/><circle cx="20" cy="6" r="2"/>',
      bike:'<circle cx="7" cy="20" r="5"/><circle cx="25" cy="20" r="5"/><path d="m7 20 6-12 6 12h6l-7-10H8M13 8h4M19 20l-4-12"/>',
      weight:'<path d="M4 9v14m3-11v8m3-9v10m12-10v10m3-9v8m3-11v14M10 16h12"/>',
      person:'<circle cx="16" cy="5" r="3"/><path d="m16 9-5 9m5-9 5 9m-5-4-8 9m8-9 8 9M10 12h12"/>',
      ball:'<circle cx="16" cy="16" r="11"/><path d="m7 8 7 7 7-3M14 15l-2 10m2-10 10 5"/>',
      box:'<path d="M4 12 16 5l12 7v14l-12 6-12-6V12Zm0 0 12 7 12-7m-12 7v13"/>',
      timer:'<circle cx="16" cy="18" r="11"/><path d="M16 18V10m0 8 6 4M12 3h8M22 5l3 3"/>',
      trophy:'<path d="M10 3h12v10a6 6 0 0 1-12 0V3ZM10 6H5v4a5 5 0 0 0 5 5m12-9h5v4a5 5 0 0 1-5 5M16 19v6m-6 4h12m-14 0h16"/>',
      team:'<circle cx="10" cy="8" r="4"/><circle cx="22" cy="8" r="4"/><path d="M2 24v-3a8 8 0 0 1 16 0v3M14 24v-3a8 8 0 0 1 16 0v3"/>',
      warning:'<path d="M16 3 30 28H2L16 3Zm0 9v8m0 4v1"/>',
      rope:'<path d="M10 2v28m12-28v28M6 12h20M6 22h20"/>',
      jump:'<path d="M7 4h18v24H7zM7 12h18M7 20h18"/>',
      default:'<path d="m4 16 8-8 8 16 8-8"/>'
    };
    return `<svg class="movement-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.default}</svg>`;
  }
  function movementType(name) {
    const s=name.toLowerCase();
    if (/run|shuttle/.test(s)) return 'run';
    if (/row/.test(s)) return 'row';
    if (/bike|ski/.test(s)) return 'bike';
    if (/barbell|thruster|squat|clean|snatch|press|jerk|deadlift/.test(s)) return 'weight';
    if (/wall ball/.test(s)) return 'ball';
    if (/box|step.over/.test(s)) return 'box';
    if (/rope|double under/.test(s)) return 'rope';
    if (/burpee|lunge|pull|handstand|toes.to.bar|carry/.test(s)) return 'person';
    return 'default';
  }
  function extractProgram(raw, title) {
    const result={formats:[],movements:[],notes:[],kpis:[]};
    for (const line of lines(raw)) {
      if (normalized(line)===normalized(title) || (normalized(title).startsWith(normalized(line)) && line.length>2 && !isFormat(line))) continue;
      const kpi=metric(line);
      if (kpi) {result.kpis.push({title:kpi[1],value:kpi[2]});continue;}
      if (isFormat(line)) {result.formats.push(line);continue;}
      const m=amount(line);
      if (m) {result.movements.push({value:m[1],name:m[2]});continue;}
      result.notes.push(line);
    }
    return result;
  }

  // WOD: blocos só existem quando um parágrafo contém outro grupo de movimentos
  // ou há um marcador explícito (BLOCO 1 / BLOCO A / ROUND 2).
  // Parágrafos de formato, score, time cap e notas NÃO criam blocos.
  function extractWodProgram(raw, title) {
    const result={formats:[],movements:[],notes:[],kpis:[],blocks:[]};
    const source=text(raw).replace(/\r/g,'').replace(/\n\s*---PAGE---\s*\n/g,'\n\n')
      .replace(/\n(?=(?:BLOCO|BLOCK|PARTE|PART|ROUND)\s+(?:\d+|[A-Z])\b)/gi,'\n\n');
    const paragraphs=source.split(/\n\s*\n+/).map(part=>part.split('\n').map(x=>x.trim()).filter(Boolean)).filter(part=>part.length);
    for (const paragraph of paragraphs) {
      const block={label:'',movements:[]};
      for (const line of paragraph) {
        if (normalized(line)===normalized(title) ||
          (normalized(title).startsWith(normalized(line)) && line.length>2 && !isFormat(line))) continue;
        if (/^(?:BLOCO|BLOCK|PARTE|PART|ROUND)\s+(?:\d+|[A-Z])\b/i.test(line)) {
          block.label=line;
          continue;
        }
        const kpi=metric(line);
        if(kpi){result.kpis.push({title:kpi[1],value:kpi[2]});continue;}
        if(isFormat(line)){result.formats.push(line);continue;}
        const m=amount(line);
        if(m){const movement={value:m[1],name:m[2]};block.movements.push(movement);result.movements.push(movement);continue;}
        result.notes.push(line);
      }
      if(block.movements.length)result.blocks.push(block);
      else if(block.label)result.notes.push(block.label);
    }
    if(!result.blocks.length && result.movements.length)result.blocks=[{label:'',movements:result.movements}];
    return result;
  }
  function splitAccessory(wod) {
    const raw=text(wod).replace(/\r/g,'');
    const marker=/(?:^|\n)OPTIONAL ACCESSORY\s*\n/i;
    const match=marker.exec(raw);
    if (!match) return {wod:raw,accessory:''};
    return {wod:raw.slice(0,match.index).trim(),accessory:raw.slice(match.index+match[0].length).trim()};
  }
  function makeSlides(workout) {
    if (!workout) return [];
    const content=splitAccessory(workout.wod);
    const extra=text(workout.accessory).trim();
    const slides=[];
    for (const [kind,label] of sections) {
      const raw=kind==='wod'?content.wod:kind==='accessory'?extra||content.accessory:text(workout[kind]);
      if (!raw.trim()) continue;
      if (kind==='warmup'){
        const cards=groups(raw);
        for(let i=0;i<cards.length;i+=4)slides.push({kind,label,items:cards.slice(i,i+4)});
      }else if(kind==='adaptations'){
        const cards=groups(raw);
        for(let i=0;i<cards.length;i+=4)slides.push({kind,label,items:cards.slice(i,i+4)});
      }else if(kind==='rules'){
        const cards=groups(raw);
        for(let i=0;i<cards.length;i+=4)slides.push({kind,label,items:cards.slice(i,i+4)});
      }else {
        const program=extractWodProgram(raw,workout.title||'');
        // Very long workouts are divided at movement boundaries, not by arbitrary characters.
        if(program.movements.length>10){
          const batches=[];
          for(let i=0;i<program.movements.length;i+=10)batches.push(program.movements.slice(i,i+10));
          batches.forEach((batch,i)=>slides.push({kind,label,items:batch,blocks:kind==='wod'?[{label:'',movements:batch}]:[],formats:program.formats,notes:i===batches.length-1?program.notes:[],kpis:i===batches.length-1?program.kpis:[]}));
        }else slides.push({kind,label,items:program.movements,blocks:program.blocks||[],formats:program.formats,notes:program.notes,kpis:program.kpis});
      }
    }
    return slides;
  }
  function displayLines(items,limit=0){return items.map((line,i)=>{const q=amount(line);if(q)return `<div class="exercise"><span class="exercise-count">${esc(q[1])}</span><span class="exercise-label">${esc(q[2])}</span></div>`;return `<div class="detail-text ${i===0?'detail-first':''}">${esc(line)}</div>`}).join('');}
  function warmupCard(lines,index,total){
    const [heading,...body]=lines;
    return `<section class="training-card warmup-card warmup-card-${index} ${total===3?'warmup-three':''}"><div class="card-heading"><span class="card-numeral">0${index+1}</span><h3>${esc(heading)}</h3></div><div class="card-body">${displayLines(body)}</div></section>`;
  }
  function adaptationCard(lines,index){
    const [heading,...body]=lines;
    const rows=[];
    for(const line of body){
      const pieces=line.split(/\s*\|\s*(?=(?:RX\+?|INT|SC|INI)\s*:)/).filter(Boolean);
      for(const part of pieces){
        const m=part.match(/^(RX\+|RX|INT|SC|INI)\s*:\s*(.+)$/i);
        if(m)rows.push(`<div class="adapt-row"><span class="adapt-category">${esc(m[1])}</span><span>${esc(m[2])}</span></div>`);
        else rows.push(`<div class="adapt-note">${esc(part)}</div>`);
      }
    }
    return `<section class="training-card adapt-card"><div class="card-heading"><span class="card-numeral">0${index+1}</span><h3>${esc(heading)}</h3></div><div class="adapt-body">${rows.join('')}</div></section>`;
  }
  function kpiCard(kpi){
    const isTime=/cap|duração|rest|descanso/i.test(kpi.title);
    return `<div class="kpi-card"><div class="kpi-heading">${icon(isTime?'timer':'trophy')}<span>${esc(kpi.title)}</span></div><div class="kpi-value">${esc(kpi.value)}</div></div>`;
  }
  function movementTile(movement,index){
    return `<div class="movement-tile">${icon(movementType(movement.name))}<span class="movement-count">${esc(movement.value)}</span><span class="movement-label">${esc(movement.name)}</span></div>`;
  }
  function programView(page){
    const formats=page.formats||[];
    const kpis=page.kpis||[];
    const movements=page.items||[];
    const notes=page.notes||[];
    const isWod=['wod','skill','accessory'].includes(page.kind);
    const blocks=isWod && page.blocks?.length?page.blocks:[{label:'',movements}];
    const multiple=isWod && blocks.length>1;
    const tileGrid=items=>'<div class="movement-grid">'+items.map(movementTile).join('')+'</div>';
    const movementContent=multiple
      ?'<div class="wod-blocks">'+blocks.map(block=>'<section class="wod-block">'+
         (block.label?'<div class="wod-block-title">'+esc(block.label)+'</div>':'')+
         tileGrid(block.movements)+'</section>').join('')+'</div>'
      :tileGrid(blocks[0].movements||movements);
    return '<div class="program-layout program-count-'+movements.length+
      (movements.length<=3?' program-few':'')+
      (isWod?(multiple?' wod-multi':' wod-single'):'')+'">'+
      (formats.length?'<div class="format-strip"><span class="format-symbol">'+icon('timer')+'</span>'+
        formats.map(x=>'<span class="format-item">'+esc(x)+'</span>').join('')+'</div>':'')+
      movementContent+
      (notes.length?'<div class="program-notes">'+notes.map(n=>'<span>'+esc(n)+'</span>').join('')+'</div>':'')+
      (kpis.length?'<div class="kpi-grid '+(kpis.length===1?'kpi-single':'')+'">'+kpis.map(kpiCard).join('')+'</div>':'')+
      '</div>';
  }
  function section(page){
    if(page.kind==='warmup')return `<div class="warmup-layout items-${page.items.length}">${page.items.map((item,i)=>warmupCard(item,i,page.items.length)).join('')}</div>`;
    if(page.kind==='adaptations')return `<div class="adaptation-layout items-${page.items.length}">${page.items.map(adaptationCard).join('')}</div>`;
    if(page.kind==='rules')return `<div class="rules-layout">${page.items.map((item,i)=>`<section class="rules-card">${icon('warning')}<div>${item.map(x=>`<p>${esc(x)}</p>`).join('')}</div></section>`).join('')}</div>`;
    return programView(page);
  }
  root.MansoesLayout={makeSlides,section,icon};
})(window);
