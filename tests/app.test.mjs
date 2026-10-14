import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

class Element{constructor(){this.innerHTML='';this.style={};this.dataset={};this.isConnected=true;this.classList={add(){},remove(){}};}focus(){}querySelector(){return null;}querySelectorAll(){return [];}append(){}remove(){}click(){} }
const elements=new Map();
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},body:new Element(),activeElement:new Element(),createElement(){return new Element();}};
globalThis.window={addEventListener(){},scrollTo(){},print(){}};
globalThis.location={hash:'',reload(){}};
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const raw=JSON.parse(fs.readFileSync(new URL('../docs/source.json',import.meta.url)));globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(raw)});
const runtime=await import('../docs/app.js');await runtime.ready;
const {state,render,performAction,openMethod,openSettings,openProject,openRecord,closeModal}=runtime;
const dir=process.env.MEI_RENDER_OUTPUT||'/tmp/mei-render-check';fs.mkdirSync(dir,{recursive:true});
for(const view of ['overview','capacity','projects','oh','team','work','quality','data']){
  state.view=view;render();const html=elements.get('app').innerHTML;assert.ok(html.includes('<main'));assert.ok(html.includes('<h1'));assert.ok(!/\bNaN\b|\bInfinity\b|\bundefined\b/.test(html),view);assert.ok(!/Ocupación estimada|Margen estimado|Sobreasignado|Capacidad neta estimada|FTE equivalentes/.test(html),view);fs.writeFileSync(path.join(dir,view+'.html'),html);
}
state.view='overview';render();const initial=state.model.project;
await performAction('chart-filter',{dataset:{key:'discipline',value:'ELE'}});assert.deepEqual(state.filters.discipline,['ELE']);assert.ok(state.model.project<initial);
await performAction('chart-filter',{dataset:{key:'discipline',value:'ELE'}});assert.deepEqual(state.filters.discipline,[]);
await performAction('open-filter',{dataset:{key:'project'}});assert.ok(elements.get('app').innerHTML.includes('filter-popover'));
await performAction('close-filter',{dataset:{}});
await performAction('more-filters',{dataset:{}});assert.ok(elements.get('app').innerHTML.includes('global-search'));
await performAction('person',{dataset:{value:state.model.people.find(p=>p.project>0).person}});assert.equal(state.view,'team');assert.ok(elements.get('app').innerHTML.includes('person-profile'));fs.writeFileSync(path.join(dir,'person-detail.html'),elements.get('app').innerHTML);
await performAction('clear-person',{dataset:{}});state.view='projects';render();const project=state.model.projects[0];
openProject(project.key);assert.ok(elements.get('overlay-root').innerHTML.includes('project-facts'));closeModal();
openRecord(state.dataset.records[0].id);assert.ok(elements.get('overlay-root').innerHTML.includes('Trazabilidad'));closeModal();
openRecord(state.dataset.excludedRecords[0].id);assert.ok(elements.get('overlay-root').innerHTML.includes('Agosto FY26'));closeModal();
openMethod();assert.ok(elements.get('overlay-root').innerHTML.includes('Análisis histórico de horas'));fs.writeFileSync(path.join(dir,'method.html'),elements.get('overlay-root').innerHTML);closeModal();
openSettings('oh');assert.ok(elements.get('overlay-root').innerHTML.includes('taxonomy-select'));fs.writeFileSync(path.join(dir,'settings.html'),elements.get('overlay-root').innerHTML);closeModal();
openSettings();assert.ok(!elements.get('overlay-root').innerHTML.includes('data-schedule'));state.settingsDraft.cutoff='2026-10-14';await performAction('save-settings',{dataset:{}});
await performAction('period',{dataset:{value:'all'}});assert.ok(state.model.future>0);await performAction('apply-cutoff',{dataset:{}});assert.equal(state.model.future,0);
state.filters.discipline=['NO EXISTE'];for(const view of ['overview','capacity','projects','oh','team','work','quality']){state.view=view;render();assert.ok(!/\bNaN\b|\bInfinity\b|\bundefined\b/.test(elements.get('app').innerHTML),'empty '+view);}
const {defaultFilters}=await import('../docs/engine.js');state.filters=defaultFilters(state.dataset);state.view='overview';render();
const blobs=[];URL.createObjectURL=b=>{blobs.push(b);return 'blob:test';};URL.revokeObjectURL=()=>{};
runtime.exportSummary();runtime.exportDetail();
const summary=await blobs[0].text(),detail=await blobs[1].text();assert.ok(summary.includes('Semanas del lunes'));assert.ok(!summary.includes('Estado de ocupación'));assert.ok(!summary.includes('Capacidad neta estimada'));assert.ok(summary.includes('Horas de proyecto'));assert.ok(detail.includes('Celda'));assert.ok(detail.includes('Septiembre FY26'));assert.equal(detail.split('\r\n').length,state.model.facts.length+1);
console.log('App checks passed: eight views, person/project/source details, chart filters, empty states, settings and cutoff.');

// Historical comparison is independent of date selections but respects dimensions.
state.filters=defaultFilters(state.dataset);state.filters.status=['Sobreasignado'];state.view='overview';render();assert.deepEqual(state.filters.status,[]);
let monthly=runtime.monthlyComparison();const sept=monthly.find(r=>r.month==='2026-09');assert.ok(Math.abs(sept.total-15152.35)<1e-7);assert.equal(monthly[0].change,null);
state.filters.months=['2026-10'];state.filters.to='2026-10-01';assert.deepEqual(runtime.monthlyComparison(),monthly);
state.filters.discipline=['ELE'];assert.ok(runtime.monthlyComparison().find(r=>r.month==='2026-09').total<sept.total);
state.view='capacity';render();runtime.exportSummary();const comparisonCSV=await blobs.at(-1).text();assert.ok(comparisonCSV.includes('Variación %'));assert.ok(comparisonCSV.includes('2026-09'));
await performAction('chart-filter',{dataset:{key:'months',value:'2026-09'}});assert.equal(state.view,'overview');assert.equal(state.filters.to,'');
// OH redesign: period controls, matrix drill-through and modal table persistence.
state.filters=defaultFilters(state.dataset);state.view='oh';render();
for(const grain of ['day','week','month']){await performAction('grain',{dataset:{value:grain}});assert.ok(elements.get('app').innerHTML.includes('oh-period-chart'));assert.ok(!/NaN|Infinity|undefined/.test(elements.get('app').innerHTML));}
const ohRecord=state.model.facts.find(r=>r.type==='Overhead');
await performAction('oh-detail',{dataset:{value:ohRecord.task,discipline:ohRecord.discipline}});
assert.equal(state.modal,'oh-detail');assert.ok(elements.get('overlay-root').innerHTML.includes('oh-detail-facts'));assert.equal(state.ohDetail.discipline,ohRecord.discipline);
await performAction('table-sort',{dataset:{table:'oh-detail-facts',key:'hours'}});assert.equal(state.modal,'oh-detail');closeModal();
await performAction('chart-filter',{dataset:{key:'ohGroup',value:ohRecord.ohGroup}});assert.ok(state.model.facts.every(r=>r.ohGroup===ohRecord.ohGroup));
state.filters=defaultFilters(state.dataset);state.view='oh';state.grain='week';render();
console.log('OH checks passed: period grains, taxonomy filter, matrix detail, modal sorting.');
// Independent OH workbench and its two analysis modes.
state.filters=defaultFilters(state.dataset);state.view='oh';render();
assert.ok(elements.get('app').innerHTML.includes('oh-workbench'));
assert.ok(!elements.get('app').innerHTML.includes('class="oh-hero"'));
assert.ok(!elements.get('app').innerHTML.includes('class="ov-editorial'));
await performAction('oh-panel',{dataset:{value:'matrix'}});assert.ok(elements.get('app').innerHTML.includes('oh-studio-matrix'));assert.ok(!elements.get('app').innerHTML.includes('oh-period-chart'));
fs.writeFileSync(path.join(dir,'oh-matrix.html'),elements.get('app').innerHTML);
await performAction('oh-panel',{dataset:{value:'timeline'}});assert.ok(elements.get('app').innerHTML.includes('oh-chart-scroll'));
await performAction('chart-filter',{dataset:{key:'ohGroup',value:'Training'}});assert.ok(state.model.facts.every(r=>r.ohGroup==='Training'));
await performAction('clear-filter',{dataset:{key:'ohGroup'}});assert.deepEqual(state.filters.ohGroup,[]);
console.log('OH workbench modes and category navigation passed.');
// Projects and team: selection, search-empty case, scoped handoff and directory sorting.
state.filters=defaultFilters(state.dataset);state.projectQuery='';state.view='projects';render();
assert.ok(elements.get('app').innerHTML.includes('pr-project-sheet'));
const chosen=state.model.projects[1];await performAction('project-select',{dataset:{value:chosen.key}});assert.equal(state.projectFocus,chosen.key);assert.ok(elements.get('app').innerHTML.includes('project-team'));
const participant=chosen.records[0].person;
await performAction('project-person',{dataset:{value:participant,project:chosen.key}});
assert.equal(state.view,'team');assert.deepEqual(state.filters.project,[chosen.key]);assert.ok(state.model.facts.every(r=>r.projectKey===chosen.key&&r.person===participant));assert.ok(elements.get('app').innerHTML.includes('tm-profile-identity'));
fs.writeFileSync(path.join(dir,'team-scoped-profile.html'),elements.get('app').innerHTML);
await performAction('clear-person',{dataset:{}});assert.ok(elements.get('app').innerHTML.includes('team-directory'));
await performAction('table-sort',{dataset:{table:'team-directory',key:'total'}});assert.equal(state.tables['team-directory'].sort,'total');
state.filters=defaultFilters(state.dataset);state.view='projects';state.projectQuery='zz-no-project-matches';render();assert.ok(elements.get('app').innerHTML.includes('No hay proyectos que coincidan'));assert.ok(!/NaN|Infinity|undefined/.test(elements.get('app').innerHTML));
state.projectQuery='';render();
console.log('Project explorer and scoped team profiles passed.');
