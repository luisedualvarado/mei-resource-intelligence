import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {buildDataset,analyze,defaultFilters,emptyFilters,DEFAULT_SETTINGS,classify,taskKey,trend,groupFacts,sum,statusFor,csvText,parseWorkbook} from '../docs/engine.js';
import {trendChart,donut,hbars,matrix,occupancyHeatmap,esc} from '../docs/charts.js';

const raw=JSON.parse(fs.readFileSync(new URL('../docs/source.json',import.meta.url)));
const ds=buildDataset(raw),f=defaultFilters(ds),m=analyze(ds,f);
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('September reconciles with an independent sum of daily source cells',()=>{
  // Independent Excel read: September 1–30, excluding Total rows and Tot. columns.
  near(m.total,15152.35);near(m.project,11589.9);near(m.oh,3016.45);near(m.absence,174.5);near(m.unknown,371.5);
  near(m.total,m.project+m.oh+m.absence+m.unknown);assert.equal(m.headcount,89);
});
test('hidden August is included; subtotals are not ingested',()=>{
  assert.ok(ds.records.some(r=>r.source==='Agosto FY26'));assert.equal(ds.sourceSheets.find(s=>s.name==='Agosto FY26').state,'hidden');
  assert.ok(ds.records.every(r=>!r.name.startsWith('Total')));assert.equal(ds.people.length,91);assert.equal(ds.recordCount,7970);
});
test('overlapping August 31 is counted once and alternate evidence remains accessible',()=>{
  const day=ds.records.filter(r=>r.date==='2026-08-31');near(sum(day,r=>r.hours),714.45);
  assert.ok(day.every(r=>r.source==='Septiembre FY26'));near(ds.discardedHours,39.25);assert.equal(ds.excludedRecords.length,15);
  near(sum(ds.allRecords,r=>r.hours)-sum(ds.records,r=>r.hours),39.25);
  assert.ok(ds.excludedRecords.every(r=>ds.recordLookup.get(r.id)===r));
});
test('October 1 and 2 remain attached to October, even in the September worksheet',()=>{
  near(sum(ds.records.filter(r=>r.date==='2026-10-01'),r=>r.hours),684.5);
  near(sum(ds.records.filter(r=>r.date==='2026-10-02'),r=>r.hours),506);
  assert.equal(ds.issues.filter(i=>i.kind==='date').length,4);assert.equal(ds.issues.filter(i=>i.kind==='title').length,1);
});
test('non-numeric cells remain diagnostics, not fabricated zeros',()=>{
  assert.equal(ds.invalid.length,3);assert.deepEqual(ds.invalid.map(i=>i.value),['l','mol','l']);
  assert.ok(ds.records.every(r=>Number.isFinite(r.hours)));
});
test('classification separates absences, OH, commercial support, unknown work and projects',()=>{
  const classifyProject=(project,code='',task='')=>classify({project,code,task});
  assert.equal(classifyProject('VACACIONES','01511001').type,'Ausencia');
  assert.equal(classifyProject('FESTIVOS (9 HORAS)').type,'Ausencia');
  assert.equal(classifyProject('GENERAL OH','01532030','0001.01').ohGroup,'General Expenses');
  assert.equal(classifyProject('OH-DISPONIBLE','01532030','0005.01').ohGroup,'Non-productive');
  assert.equal(classifyProject('OH training','01532030','0003.05').ohGroup,'Training');
  assert.equal(classifyProject('BD_T+D','','BID-0799535').ohGroup,'Sin clasificar');
  assert.equal(classifyProject('Sin proyecto').type,'Sin clasificar');
  assert.equal(classifyProject('NLA TERMINAL','60751587','4.2.02').type,'Proyecto');
  assert.equal(taskKey('0003.01'),'3.1');
});
test('person-day capacity is counted once and preserves absences under activity filters',()=>{
  near(m.net,16389.5);near(m.booked,14606.35);near(m.available,1783.15);near(m.occupancy,m.booked/m.net);
  const pf={...f,project:[m.projects[0].key]};const project=analyze(ds,pf);near(project.net,m.net);assert.equal(project.headcount,m.headcount);near(project.project,m.projects[0].hours);
  const oh=analyze(ds,{...f,type:['Overhead']});near(oh.net,m.net);near(oh.project,0);near(oh.oh,m.oh);assert.equal(oh.absence,0);
  near(sum(m.people,p=>p.net),m.net);near(sum(m.people,p=>p.project),m.project);
  const unique=new Set(m.capacity.map(c=>c.person+'|'+c.date));assert.equal(unique.size,m.capacity.length);
});
test('discipline, person, role, week and dates constrain both population and facts',()=>{
  const ele=analyze(ds,{...f,discipline:['ELE']});assert.ok(ele.people.length>0);assert.ok(ele.people.every(p=>p.discipline==='ELE'));assert.ok(ele.facts.every(r=>r.discipline==='ELE'));
  const person=ele.people[0].person;const one=analyze(ds,{...f,person:[person],weeks:['2026-09-07'],role:['Engineer']});assert.equal(one.headcount,1);assert.ok(one.facts.every(r=>r.person===person&&r.week==='2026-09-07'&&r.role==='Engineer'));
  const single=analyze(ds,{...emptyFilters(),from:'2026-10-01',to:'2026-10-01'});near(single.total,684.5);
});
test('capacity settings recalculate ratios while recorded hours stay stable',()=>{
  const changed=analyze(ds,f,{...DEFAULT_SETTINGS,schedule:[0,8,8,8,8,8,0]});near(changed.total,m.total);assert.notEqual(changed.net,m.net);assert.notEqual(changed.occupancy,m.occupancy);
  const zero=analyze(ds,f,{...DEFAULT_SETTINGS,schedule:Array(7).fill(0)});assert.equal(zero.net,0);assert.equal(zero.occupancy,null);assert.equal(zero.utilization,null);assert.equal(zero.fte,null);
});
test('OH catalogue assignments resist overrides while preserving totals',()=>{
  const updated=buildDataset(raw,{...DEFAULT_SETTINGS,overrides:{'4.2':'Training','3.1':'General Expenses','BID-0799535':'Bidding'}});const changed=analyze(updated,f);
  near(changed.oh,m.oh);near(changed.total,m.total);assert.ok(updated.records.filter(r=>r.type==='Overhead'&&r.ohKey==='3.1').every(r=>r.ohGroup==='Training'));
});
test('weekly and monthly rollups reconcile without averaging ratios',()=>{
  for(const grain of ['day','week','month']){const groups=trend(m,grain);near(sum(groups,g=>g.project),m.project);near(sum(groups,g=>g.oh),m.oh);near(sum(groups,g=>g.net),m.net);}
  near(sum(m.projects,p=>p.hours),m.project);near(sum(groupFacts(m.facts,'category'),g=>g.hours),m.total);
});
test('cutoff excludes future dates until explicitly included',()=>{
  const until=analyze(ds,{...emptyFilters(),to:DEFAULT_SETTINGS.cutoff});assert.ok(until.facts.every(r=>r.date<='2026-10-14'));
  const all=analyze(ds,emptyFilters());near(all.future,218);assert.ok(all.facts.some(r=>r.date>'2026-10-14'));
});
test('status boundaries, empty contexts and chart output are well-defined',()=>{
  assert.equal(statusFor(.6999),'Disponible');assert.equal(statusFor(.7),'Equilibrado');assert.equal(statusFor(.9),'Alta ocupación');assert.equal(statusFor(1),'Alta ocupación');assert.equal(statusFor(1.0001),'Sobreasignado');
  const empty=analyze(ds,{...emptyFilters(),from:'2030-01-01'});assert.equal(empty.facts.length,0);assert.equal(empty.occupancy,null);
  for(const html of [trendChart(trend(empty)),trendChart(trend(m)),trendChart(trend(m).slice(0,1)),donut([]),hbars([]),matrix([],[],()=>0),occupancyHeatmap(empty)])assert.ok(!/NaN|Infinity|undefined/.test(html));
  assert.ok(donut([{key:'Proyecto',label:'Proyecto',value:9,color:'#00ad81'}]).includes('aria-label'));
});
test('escaping prevents source text from becoming markup or spreadsheet commands',()=>{
  assert.equal(esc('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
  const csv=csvText([['=CMD()','<test>','quote"text','normal']]);assert.ok(csv.includes("'="));assert.ok(csv.includes('quote""text'));
  assert.ok(csvText([['-4,50',-9]]).includes('"-4,50";"-9"'));
});

test('browser import algorithm roundtrips the actual XLSX attachment',{skip:!process.env.MEI_SOURCE_WORKBOOK},async()=>{
  const require=createRequire(import.meta.url),root=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
  const JSZip=require(root+'/jszip'),{xml2js}=require(root+'/xml-js');
  class Node {
    constructor(node){this.node=node;}
    getAttribute(key){return this.node.attributes?.[key]??null;}
    getElementsByTagName(name){const result=[];function visit(n){for(const child of n.elements||[]){if(child.type==='element'&&child.name===name)result.push(new Node(child));visit(child);}}visit(this.node);return result;}
    get textContent(){function text(n){return (n.text||n.cdata||'')+(n.elements||[]).map(text).join('');}return text(this.node);}
  }
  globalThis.DOMParser=class{parseFromString(xml){return new Node(xml2js(xml,{compact:false,ignoreDeclaration:true}));}};
  const buffer=fs.readFileSync(process.env.MEI_SOURCE_WORKBOOK);
  const imported=await parseWorkbook({name:raw.filename,size:buffer.length,arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)},JSZip);
  const parsed=buildDataset(imported),metric=analyze(parsed,defaultFilters(parsed));
  assert.equal(parsed.recordCount,ds.recordCount);near(parsed.hours,ds.hours);near(metric.total,m.total);near(metric.project,m.project);near(metric.oh,m.oh);assert.equal(parsed.invalid.length,ds.invalid.length);assert.equal(parsed.issues.length,ds.issues.length);
});

test('supplied catalogue maps all 13 Tasks exactly and leaves unknown codes unclassified',()=>{
 const classifyProject=(project,code,task)=>classify({project,code,task});
 const expected={'1.01':'General Expenses','2.01':'Bidding','3.01':'Training','3.02':'Training','3.03':'Training','3.04':'Training','3.05':'Training','3.06':'Training','4.01':'Other OH','4.02':'Other OH','4.03':'Other OH','5.01':'Non-productive','5.02':'Non-productive'};
 for(const [task,group] of Object.entries(expected)){assert.equal(classifyProject('GENERAL OH','01532030',task).ohGroup,group);assert.equal(classifyProject('GENERAL OH','01532030','000'+task).ohGroup,group);}
 assert.equal(classifyProject('GENERAL OH','01532030','2.02').ohGroup,'Sin clasificar');
});
