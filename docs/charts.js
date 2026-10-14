import {COLORS,OH_COLORS,STATUS_COLORS,dateLabel,monthLabel,sum,ratio} from './engine.js';
export const esc = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num = (v,d=0)=>v===null||v===undefined||!Number.isFinite(Number(v))?'s/d':new Intl.NumberFormat('es-CO',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
export const pct=(v,d=1)=>v===null||v===undefined?'s/d':num(v*100,d)+'%';
export const hrs=(v,d=1)=>num(v,d)+' h';
export const short=v=>Math.abs(v)>=1000000?num(v/1000000,1)+'M':Math.abs(v)>=1000?num(v/1000,1)+'k':num(v,0);
export function icon(name,size=16){
  const paths={
    overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    capacity:'<path d="M4 19V9m5 10V5m6 14v-7m5 7V3"/>',
    projects:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/>',
    oh:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 6"/>',
    team:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/>',
    work:'<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="19" r="2" fill="currentColor"/>',
    quality:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    data:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 4 16 4 16 0V5M4 12v7c0 4 16 4 16 0v-7"/>',
    settings:'<path d="m9 3-.5 3-2 1-2.8-1-2 4 2.3 2v2l-2 2 2 4 3-1 2 1 .5 3h5l.5-3 2-1 3 1 2-4-2-2v-2l2-2-2-4-3 1-2-1-.5-3Z"/><circle cx="12" cy="13" r="3"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 1-2 1-2 3M12 17h.01"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    chevron:'<path d="m8 10 4 4 4-4"/>',
    right:'<path d="m9 5 7 7-7 7"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
    filter:'<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    reset:'<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    warning:'<path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3h.01"/>',
    check:'<path d="m5 12 4 4L20 5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    users:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m3-7a5 5 0 0 1 5 5v2"/>',
    spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
    trend:'<path d="m3 17 6-6 4 3 8-10M15 4h6v6"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    file:'<path d="M14 2H5v20h14V7Z"/><path d="M14 2v5h5M8 12h8m-8 4h8"/>',
    print:'<path d="M6 8V3h12v5M6 18H3v-8h18v8h-3M6 14h12v8H6Z"/>',
    eye:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    sort:'<path d="M8 4v16m-3-3 3 3 3-3m5-13v16m-3-13 3-3 3 3"/>',
    grid:'<path d="M3 3h18v18H3Zm0 6h18M3 15h18M9 3v18m6-18v18"/>',
    external:'<path d="M14 3h7v7m0-7-11 11m0-11H3v18h18v-7"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.overview}</svg>`;
}
export const filterAttrs=(key,value)=>`data-action="chart-filter" data-key="${esc(key)}" data-value="${esc(value)}"`;
export function emptyChart(message='No hay horas en este contexto. Prueba otros filtros.'){return `<div class="empty-state compact">${icon('capacity',27)}<h3>Sin registros para mostrar</h3><p>${esc(message)}</p></div>`;}
export function hbars(items,{key='',color=COLORS.project,max=null,valueFormat=hrs,limit=8}={}){
  if(!items.length)return emptyChart();const shown=items.slice(0,limit),top=max||Math.max(...shown.map(i=>Math.abs(i.value)),1);
  return `<div class="hbars">${shown.map((r,i)=>`<button class="hbar" ${key?filterAttrs(key,r.key):r.action||''} title="${esc(r.label)}: ${esc(valueFormat(r.value))}${r.detail?' · '+esc(r.detail):''}"><div class="hbar-top"><span class="hbar-label">${esc(r.label)}</span><span class="hbar-value">${esc(valueFormat(r.value))}</span></div><div class="hbar-track"><span class="hbar-fill" style="width:${Math.min(100,Math.max(0,Math.abs(r.value)/top*100))}%;background:${esc(r.color||color)}"></span></div>${r.secondary!==undefined?`<div class="hbar-secondary" style="width:${Math.min(100,Math.max(0,r.secondary/top*100))}%"></div>`:''}</button>`).join('')}</div>`;
}
export function donut(items,{center=null,label='horas registradas',key='type'}={}){
  const positive=items.filter(i=>i.value>0),total=sum(positive,i=>i.value);if(!positive.length)return emptyChart();
  const r=68,c=2*Math.PI*r;let offset=0;
  const rings=positive.map(i=>{const length=i.value/total*c;const ring=`<circle class="chart-point" cx="100" cy="100" r="${r}" fill="none" stroke="${i.color}" stroke-width="24" stroke-dasharray="${Math.max(0,length-1.5)} ${c-length+1.5}" stroke-dashoffset="${-offset}" transform="rotate(-90 100 100)" tabindex="0" role="button" aria-label="Filtrar ${esc(i.label)}: ${hrs(i.value)}, ${pct(i.value/total)}" ${filterAttrs(key,i.key||i.label)}><title>${esc(i.label)}: ${hrs(i.value)} (${pct(i.value/total)})</title></circle>`;offset+=length;return ring;});
  return `<div class="donut-layout"><div class="donut-visual"><svg class="chart" viewBox="0 0 200 200" role="img" aria-label="Distribución de horas"><circle cx="100" cy="100" r="68" fill="none" stroke="#f0f5f5" stroke-width="24"/>${rings.join('')}<text x="100" y="99" text-anchor="middle" fill="#24414a" font-size="23" font-weight="650" letter-spacing="-.7">${esc(num(center??total,0))}</text><text x="100" y="116" text-anchor="middle" fill="#91a1a7" font-size="8">${esc(label)}</text></svg></div><div class="donut-legend">${items.map(i=>`<button class="donut-item" ${filterAttrs(key,i.key||i.label)} title="Filtrar ${esc(i.label)}"><i style="background:${i.color}"></i><span class="donut-item-name">${esc(i.label)}</span><b>${num(i.value,0)}</b><small>${pct(ratio(i.value,total),0)}</small></button>`).join('')}</div></div>`;
}
export function trendChart(data,{grain='week',series=['project','oh']}={}){
  if(!data.length)return emptyChart();const W=680,H=230,L=48,R=12,T=16,B=35,plotW=W-L-R,plotH=H-T-B;
  const cap=series.includes('capacity'),proj=series.includes('project'),oh=series.includes('oh');
  const max=Math.max(...data.map(d=>Math.max((proj?d.project:0)+(oh?d.oh:0),cap?d.net:0)),1)*1.16;
  const x=i=>L+(i+.5)*plotW/data.length,y=v=>T+plotH*(1-v/max),barW=Math.min(32,plotW/data.length*.5);
  const grid=Array.from({length:5},(_,i)=>{const v=max*i/4,yy=y(v);return `<line class="chart-grid" x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}"/><text class="chart-axis" x="${L-9}" y="${yy+3}" text-anchor="end">${short(v)}</text>`;}).join('');
  const labels=data.map((d,i)=>{
    if(data.length>12&&i%Math.ceil(data.length/10)!==0)return '';
    const label=grain==='month'?dateLabel(d.key+'-01',{month:'short'}):dateLabel(d.key);
    return `<text class="chart-axis" x="${x(i)}" y="${H-13}" text-anchor="middle">${esc(label)}</text>`;
  }).join('');
  const bars=data.map((d,i)=>{const xx=x(i),pv=Math.max(0,proj?d.project:0),ov=Math.max(0,oh?d.oh:0);return `<g class="chart-point" tabindex="0" role="button" aria-label="Filtrar ${grain==='month'?monthLabel(d.key):dateLabel(d.key)}" ${filterAttrs(grain==='month'?'months':grain==='day'?'date':'weeks',d.key)}><title>${grain==='month'?monthLabel(d.key):'Desde '+dateLabel(d.key)}\nProyecto: ${hrs(d.project)}\nOH: ${hrs(d.oh)}</title><rect x="${xx-barW/2}" y="${T}" width="${barW+10}" height="${plotH}" fill="transparent"/>${pv?`<rect x="${xx-barW/2}" y="${y(pv)}" width="${barW}" height="${plotH*pv/max}" fill="${COLORS.project}" rx="2"/>`:''}${ov?`<rect x="${xx-barW/2}" y="${y(pv+ov)}" width="${barW}" height="${plotH*ov/max}" fill="${COLORS.oh}" rx="2"/>`:''}</g>`;}).join('');
  const capPath=cap?`<path d="${data.map((d,i)=>`${i?'L':'M'}${x(i)},${y(d.net)}`).join(' ')}" fill="none" stroke="${COLORS.capacity}" stroke-width="1.8" stroke-dasharray="5 4" pointer-events="none"/>${data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.net)}" r="2.6" fill="#fff" stroke="${COLORS.capacity}" stroke-width="1.5" pointer-events="none"/>`).join('')}`:'';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución temporal de horas registradas"><text x="5" y="14" fill="#91a0a5" font-size="9">horas</text>${grid}${bars}${capPath}${labels}</svg><div class="legend">${[['project','Proyecto',COLORS.project],['oh','Overhead',COLORS.oh]].map(([k,l,c])=>`<button data-action="series" data-value="${k}" class="${series.includes(k)?'':'off'}" aria-pressed="${series.includes(k)}"><i ${k==='capacity'?'class="legend-line"':`style="background:${c}"`}></i>${l}</button>`).join('')}</div>`;
}
export function disciplineChart(model){
  const names=[...new Set(model.people.map(p=>p.discipline))].sort();
  const groups=names.map(name=>{const people=model.people.filter(p=>p.discipline===name),net=sum(people,p=>p.net),project=sum(people,p=>p.project),oh=sum(people,p=>p.oh);return {name,net,project,oh,occupancy:ratio(project+oh,net),utilization:ratio(project,net),people:people.length};}).sort((a,b)=>(b.occupancy||0)-(a.occupancy||0));
  if(!groups.length)return emptyChart();const max=Math.max(...groups.map(g=>g.occupancy||0),1);
  return `<div class="hbars">${groups.map(g=>`<button class="hbar discipline-row" ${filterAttrs('discipline',g.name)} title="${esc(g.name)} · ${g.people} personas\nProyecto: ${hrs(g.project)} · OH: ${hrs(g.oh)}\nCapacidad: ${hrs(g.net)} · Utilización de proyecto: ${pct(g.utilization)}"><div class="hbar-top"><span class="hbar-label">${esc(g.name)} <span style="color:#9badb3;font-size:9px;margin-left:5px">${g.people} personas</span></span><span class="hbar-value" style="color:${g.occupancy>1?COLORS.lost:'#37515a'}">${pct(g.occupancy)}</span></div><div class="hbar-track"><span class="hbar-fill" style="width:${Math.max(0,(g.utilization||0)/max*100)}%;background:${COLORS.project};border-radius:3px 0 0 3px"></span><span class="hbar-fill" style="width:${Math.max(0,(g.occupancy-g.utilization||0)/max*100)}%;background:${COLORS.oh};border-radius:0 3px 3px 0"></span></div></button>`).join('')}</div><div class="legend"><span><i style="background:${COLORS.project}"></i>Proyecto / capacidad</span><span><i style="background:${COLORS.oh}"></i>OH / capacidad</span></div>`;
}
export function stackedBars(groups,series,{filterKey='',valueFormat=hrs,normalize=false}={}){
  if(!groups.length)return emptyChart();const max=Math.max(...groups.map(g=>sum(series,s=>g[s.key]||0)),1);
  return groups.map(g=>{const total=sum(series,s=>g[s.key]||0);return `<div class="stack-row"><div class="stack-row-label"><button ${filterKey?filterAttrs(filterKey,g.key):''} title="${esc(g.label)}">${esc(g.label)}</button><span>${esc(valueFormat(total))}</span></div><div class="horizontal-bar" style="width:${normalize?100:Math.max(1,total/max*100)}%">${series.map(s=>{const v=g[s.key]||0;if(v<=0)return '';return `<button style="width:${v/total*100}%;background:${s.color}" ${s.filterKey?filterAttrs(s.filterKey,s.key):filterKey?filterAttrs(filterKey,g.key):''} title="${esc(g.label+' · '+s.label)}: ${hrs(v)} (${pct(v/total)})" aria-label="${esc(g.label+' · '+s.label)} ${hrs(v)}"></button>`;}).join('')}</div></div>`;}).join('')+`<div class="legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>`;
}
export function statusBadge(o){const status=o===null?'Sin capacidad':o>1?'Sobreasignado':o>=.9?'Alta ocupación':o>=.7?'Equilibrado':'Disponible',cls=o===null?'none':o>1?'over':o>=.9?'high':o>=.7?'healthy':'available';return `<span class="status-pill ${cls}"><span class="status-dot"></span>${status}</span>`;}
export function occupancyHeatmap(model,{maxPeople=45}={}){
  const weeks=[...new Set(model.capacity.map(r=>r.week))].sort();if(!weeks.length)return emptyChart();
  const capMap=new Map(),factMap=new Map();model.capacity.forEach(c=>{const key=c.person+'|'+c.week;capMap.set(key,(capMap.get(key)||0)+c.net);});model.facts.filter(f=>['Proyecto','Overhead'].includes(f.type)).forEach(r=>{const key=r.person+'|'+r.week;factMap.set(key,(factMap.get(key)||0)+r.hours);});
  const people=[...model.people].sort((a,b)=>(b.occupancy||0)-(a.occupancy||0)).slice(0,maxPeople);
  return `<div class="heatmap-wrap"><table class="heatmap"><thead><tr><th>Colaborador</th>${weeks.map(w=>`<th><button ${filterAttrs('weeks',w)} style="font-size:9px;color:#8299a1;padding:0">${dateLabel(w)}</button></th>`).join('')}</tr></thead><tbody>${people.map(p=>`<tr><td><button data-action="person" data-value="${esc(p.person)}" style="font-size:9px;padding:0;text-align:left" title="${esc(p.name)}">${esc(p.name)}</button></td>${weeks.map(w=>{const cap=capMap.get(p.person+'|'+w)||0,fact=factMap.get(p.person+'|'+w)||0,o=ratio(fact,cap),color=o===null?'#f1f4f5':o>1?'#ffe1dc':o>=.9?'#fff1b0':o>=.7?'#bce9d5':'#d7eeed',text=o===null?'#b3c0c5':o>1?'#c74b3b':o>=.9?'#9e7d1c':o>=.7?'#247c5b':'#348888';return `<td><button data-action="person-week" data-person="${esc(p.person)}" data-value="${w}" style="background:${color};color:${text}" title="${esc(p.name)} · Semana del ${dateLabel(w)}\nCarga: ${hrs(fact)} · Capacidad neta estimada: ${hrs(cap)}">${pct(o,0)}</button></td>`;}).join('')}</tr>`).join('')}</tbody></table></div><div class="heatmap-legend"><span><i style="background:#d7eeed"></i>&lt;70%</span><span><i style="background:#bce9d5"></i>70–&lt;90%</span><span><i style="background:#fff1b0"></i>90–100%</span><span><i style="background:#ffe1dc"></i>&gt;100%</span><span>Ocupación estimada · ${people.length} de ${model.people.length} personas</span></div>`;
}
export function matrix(rows,columns,valueFn,{rowAction=null,colAction=null,valueFormat=v=>num(v,0)}={}){
  if(!rows.length||!columns.length)return emptyChart();const vals=rows.flatMap(r=>columns.map(c=>valueFn(r,c))),max=Math.max(...vals,1);
  return `<div class="heatmap-wrap"><table class="heatmap"><thead><tr><th>Actividad</th>${columns.map(c=>`<th>${esc(c.label||c.key)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td title="${esc(r.label)}"><button ${rowAction?filterAttrs(rowAction,r.key):''} style="font-size:9px;padding:0">${esc(r.label)}</button></td>${columns.map(c=>{const v=valueFn(r,c),alpha=.04+.76*Math.max(0,v)/max;return `<td><button ${rowAction?filterAttrs(rowAction,r.key):''} style="background:rgba(0,173,129,${v?alpha:0.04});color:${v/max>.65?'#fff':'#3c8170'}" title="${esc(r.label)} · ${esc(c.label||c.key)}: ${hrs(v)}">${v?valueFormat(v):'–'}</button></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
