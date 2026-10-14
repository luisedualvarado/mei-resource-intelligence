export const APP_DATE = '2026-10-14';
export const COLORS = {project:'#00AD81',oh:'#CB1A78',absence:'#aab5b8',unknown:'#FFCE00',capacity:'#344c56',available:'#008A8B',lost:'#E52713'};
export const TYPES = ['Proyecto','Overhead','Ausencia','Sin clasificar'];
export const OH_GROUPS = ['General Expenses','Bidding','Training','Other OH','Non-productive','Sin clasificar'];
export const OH_TASK_CATALOG = {
 '1.1':{code:'1.01',group:'General Expenses',name:'General Expenses OH'},
 '2.1':{code:'2.01',group:'Bidding',name:'Bidding'},
 '3.1':{code:'3.01',group:'Training',name:'Training - Technical'},
 '3.2':{code:'3.02',group:'Training',name:'Training - Project'},
 '3.3':{code:'3.03',group:'Training',name:'Training - Digital'},
 '3.4':{code:'3.04',group:'Training',name:'Training - Non Tech'},
 '3.5':{code:'3.05',group:'Training',name:'Training - Quality'},
 '3.6':{code:'3.06',group:'Training',name:'Training - AI4E'},
 '4.1':{code:'4.01',group:'Other OH',name:'Graduates'},
 '4.2':{code:'4.02',group:'Other OH',name:'Colombia Hypercare'},
 '4.3':{code:'4.03',group:'Other OH',name:'SH&E'},
 '5.1':{code:'5.01',group:'Non-productive',name:'Non-productive'},
 '5.2':{code:'5.02',group:'Non-productive',name:'IT'}
};
export const OH_COLORS = ['#00AD81','#008A8B','#5b71b1','#a783bd','#E52713','#b2b1a7'];
export const DEFAULT_SETTINGS = {schedule:[0,9,9,9,9,6,0],cutoff:APP_DATE,projectTarget:80,ohTarget:20,overrides:{}};
export const FLAG_NAMES = {1:'Sin ID de empleado',2:'Sin código de proyecto',4:'Sin Task',8:'Sin categoría',16:'Sin nombre de proyecto',32:'Sin rol',64:'Sin disciplina',128:'OH sin clasificación',256:'Ajuste negativo',512:'Más de 24 h en una celda',1024:'Posible registro repetido'};
export const norm = v => String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
export const txt = v => String(v??'').trim().replace(/\s+/g,' ');
export const missing = v => !txt(v)||['-','N/A','NA','NULL','NONE'].includes(norm(v));
export const iso = d => d.toISOString().slice(0,10);
export const utc = s => new Date(s+'T12:00:00Z');
export function addDays(s,n){const d=utc(s);d.setUTCDate(d.getUTCDate()+n);return iso(d);}
export function weekKey(s){const d=utc(s);return addDays(s,-((d.getUTCDay()+6)%7));}
export function dateLabel(s,opts={day:'numeric',month:'short'}){return new Intl.DateTimeFormat('es-CO',{...opts,timeZone:'UTC'}).format(utc(s));}
export function monthLabel(s){return new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric',timeZone:'UTC'}).format(utc(s.length===7?s+'-01':s));}
export const sum = (arr,fn=v=>v) => arr.reduce((a,r)=>a+(Number(fn(r))||0),0);
export const ratio = (a,b) => b>0?a/b:null;
export function taskKey(v){const m=txt(v).match(/^0*(\d+)\.0*(\d+)$/);return m?`${+m[1]}.${+m[2]}`:norm(v);}

export function classify(row,settings=DEFAULT_SETTINGS){
  const p=norm(row.project), c=norm(row.code), t=norm(row.task), all=p+' '+t;
  if(c==='01511001'||/FESTIV|VACAC|INCAPAC|LICENCIA|MEDIO DIA CUMPLE|EXAMEN MEDICO|\bHOLIDAY\b|\bPTO\b|\bSICK\b/.test(all))return {type:'Ausencia',ohGroup:'',ohKey:''};
  const oh = /\bOH\b|^OH-|^GENERAL OH|^AI4E$|^BD[_ -]|-BD$|COPASS/.test(p)||c==='01532030'||/^000[1-5]\.\d+/.test(t)||/BID-/.test(t);
  if(!oh)return {type:missing(row.project)||p==='SIN PROYECTO'?'Sin clasificar':'Proyecto',ohGroup:'',ohKey:''};
  const key=taskKey(row.task),catalog=OH_TASK_CATALOG[key];
  let group=catalog?.group||'Sin clasificar';
  // Supplied Task catalogue is authoritative; manual assignments only cover unknown codes.
  if(!catalog&&settings.overrides?.[key]&&OH_GROUPS.includes(settings.overrides[key]))group=settings.overrides[key];
  return {type:'Overhead',ohGroup:group,ohKey:key};
}

function sheetPeriod(s){
  const months={ENERO:1,JANUARY:1,FEBRERO:2,FEBRUARY:2,MARZO:3,MARCH:3,ABRIL:4,APRIL:4,MAYO:5,MAY:5,JUNIO:6,JUNE:6,JULIO:7,JULY:7,AGOSTO:8,AUGUST:8,SEPTIEMBRE:9,SEPTEMBER:9,OCTUBRE:10,OCTOBER:10,NOVIEMBRE:11,NOVEMBER:11,DICIEMBRE:12,DECEMBER:12};
  const name=norm(s.name);let month=Object.entries(months).find(([k])=>name.includes(k))?.[1];
  const year=+(name.match(/20\d{2}/)?.[0]||('20'+(name.match(/FY\s*(\d{2})/)?.[1]||txt(s.title).match(/20(\d{2})/)?.[1]||'26')));
  if(!month)throw new Error(`No se reconoce el mes de la hoja ${s.name}. Usa un nombre como «Octubre FY26».`);
  return {month,year,fy:name.match(/FY\s*\d{2}/)?.[0]||'FY'+String(year).slice(2)};
}

function mapDates(s,issues){
  const {month,year,fy}=sheetPeriod(s), h=s.headers;
  if(!h.length)throw new Error(`La hoja ${s.name} no contiene columnas diarias reconocibles.`);
  const val=h[0].value;
  let first;
  if(/^\d{4}-\d{2}-\d{2}/.test(String(val)))first=String(val).slice(0,10);
  else if(Number(val)>366)first=iso(new Date(Date.UTC(1899,11,30)+Number(val)*86400000));
  else {
    const day=Number(val),base=new Date(Date.UTC(year,month-1,1,12));
    if(day>15)base.setUTCMonth(base.getUTCMonth()-1);
    base.setUTCDate(day);first=iso(base);
  }
  const dates=h.map((header,i)=>{
    const date=addDays(first,i),expected=utc(date).getUTCDate(),v=header.value;
    const explicit=/^\d{4}-\d{2}-\d{2}/.test(String(v))?String(v).slice(0,10):Number(v)>366?iso(new Date(Date.UTC(1899,11,30)+Number(v)*86400000)):null;
    const day=explicit?utc(explicit).getUTCDate():Number(v);
    if((explicit && explicit!==date)||day!==expected)issues.push({kind:'date',sheet:s.name,cell:header.col+'3',original:String(v),resolved:date,message:'Fecha reconstruida por la secuencia diaria y el día de semana.'});
    const weekday=norm(header.weekday).slice(0,3), expectedWeekday=['DOM','LUN','MAR','MIE','JUE','VIE','SAB'][utc(date).getUTCDay()];
    if(weekday!==expectedWeekday)issues.push({kind:'weekday',sheet:s.name,cell:header.col+'4',original:String(header.weekday),resolved:date,message:'El día de semana no coincide. Revisar calendario de origen.'});
    return {...header,date,week:weekKey(date),month:date.slice(0,7),fy};
  });
  const monthNames=['','ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  if(txt(s.title)&&!norm(s.title).includes(monthNames[month]))issues.push({kind:'title',sheet:s.name,cell:'A1',original:txt(s.title),resolved:`${monthNames[month]} ${year}`,message:'Se usa el mes del nombre de la hoja; el título conserva el mes anterior.'});
  return {dates,month,year,fy};
}

export function buildDataset(raw,settings=DEFAULT_SETTINGS){
  const issues=[],invalid=[],allRecords=[],sourceSheets=[],rosters=new Map();
  const nameVersions=new Map();
  for(const sheet of raw.sheets){
    const info=mapDates(sheet,issues),personVotes=new Map(),records=[];
    const headerMap=Object.fromEntries(info.dates.map(h=>[h.col,h]));
    for(const arr of sheet.rows){
      const [rowNum,discipline,name,employeeId,role,project,code,task,category,subcategory,comment,hours]=arr;
      if(missing(name)||norm(name).startsWith('TOTAL'))continue;
      const person=norm(name);
      if(!personVotes.has(person))personVotes.set(person,[]);
      personVotes.get(person).push({name:txt(name),employeeId:missing(employeeId)?'':txt(employeeId),discipline:missing(discipline)?'Sin disciplina':txt(discipline),role:missing(role)?'Sin rol':txt(role)});
      if(!nameVersions.has(person))nameVersions.set(person,new Set());nameVersions.get(person).add(txt(name));
      const row={person,name:txt(name),employeeId:missing(employeeId)?'':txt(employeeId),discipline:missing(discipline)?'Sin disciplina':txt(discipline),role:missing(role)?'Sin rol':txt(role),project:missing(project)?'Sin proyecto':txt(project),code:missing(code)?'':txt(code),task:missing(task)?'':txt(task),category:missing(category)?'Sin categoría':txt(category),subcategory:missing(subcategory)?'':txt(subcategory),comment:txt(comment),source:sheet.name,row:Number(rowNum)};
      row.projectKey=(row.code||'SIN-CODIGO')+'|'+norm(row.project);
      Object.assign(row,classify(row,settings));
      let flags=0;
      if(missing(employeeId))flags|=1;
      if(row.type==='Proyecto'&&missing(code))flags|=2;
      if(missing(task))flags|=4;
      if(missing(category))flags|=8;
      if(missing(project))flags|=16;
      if(missing(role))flags|=32;
      if(missing(discipline))flags|=64;
      if(row.type==='Overhead'&&row.ohGroup==='Sin clasificar')flags|=128;
      for(const [col,value] of Object.entries(hours||{})){
        const header=headerMap[col];if(!header)continue;
        const valueText=String(value).trim();
        const number=typeof value==='number'?value:/^-?\d+(?:[.,]\d+)?$/.test(valueText)?Number(valueText.replace(',','.')):NaN;
        if(!Number.isFinite(number)){invalid.push({source:sheet.name,row:Number(rowNum),cell:col+rowNum,value:valueText,name:row.name});continue;}
        if(number===0)continue;
        records.push({...row,date:header.date,month:header.month,week:header.week,fy:header.fy,hours:number,cell:col+rowNum,flags:flags|(number<0?256:0)|(number>24?512:0)});
      }
    }
    function mode(arr,key,fallback){const counts=new Map();arr.forEach(r=>{if(r[key]&&r[key]!==fallback)counts.set(r[key],(counts.get(r[key])||0)+1)});return [...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||fallback;}
    const roster=[...personVotes].map(([person,v])=>({person,name:mode(v,'name',''),employeeId:mode(v,'employeeId',''),discipline:mode(v,'discipline','Sin disciplina'),role:mode(v,'role','Sin rol')}));
    rosters.set(sheet.name,roster);
    sourceSheets.push({name:sheet.name,state:sheet.state,title:sheet.title,fy:info.fy,calendarMonth:`${info.year}-${String(info.month).padStart(2,'0')}`,dates:info.dates.map(d=>d.date),people:roster.length,rows:sheet.rows.length,cells:records.length,hours:sum(records,r=>r.hours),first:records.map(r=>r.date).sort()[0],last:records.map(r=>r.date).sort().at(-1)});
    allRecords.push(...records);
  }
  const dates=[...new Set(sourceSheets.flatMap(s=>s.dates))].sort();
  const dayStats=new Map();
  allRecords.forEach(r=>{const key=r.date+'|'+r.source;if(!dayStats.has(key))dayStats.set(key,{people:new Set(),cells:0,hours:0});const s=dayStats.get(key);s.people.add(r.person);s.cells++;s.hours+=r.hours;});
  const sourceForDate=new Map(),overlaps=[];
  for(const date of dates){
    const sources=sourceSheets.filter(s=>s.dates.includes(date));
    sources.sort((a,b)=>{
      const as=dayStats.get(date+'|'+a.name),bs=dayStats.get(date+'|'+b.name);
      return (bs?.people.size||0)-(as?.people.size||0)||(Number(b.calendarMonth===date.slice(0,7))-Number(a.calendarMonth===date.slice(0,7)))||(bs?.cells||0)-(as?.cells||0);
    });
    sourceForDate.set(date,sources[0].name);
    if(sources.length>1&&sources.filter(s=>(dayStats.get(date+'|'+s.name)?.cells||0)>0).length>1){
      overlaps.push({date,selected:sources[0].name,candidates:sources.map(s=>({source:s.name,people:dayStats.get(date+'|'+s.name)?.people.size||0,hours:dayStats.get(date+'|'+s.name)?.hours||0,cells:dayStats.get(date+'|'+s.name)?.cells||0})),excludedHours:sum(sources.slice(1),s=>dayStats.get(date+'|'+s.name)?.hours||0)});
    }
  }
  const records=allRecords.filter(r=>sourceForDate.get(r.date)===r.source);
  const repeated=new Map();
  for(const r of records){const k=[r.person,r.date,r.projectKey,r.task,r.category,r.subcategory,r.comment,r.hours].join('\u001f');if(!repeated.has(k))repeated.set(k,[]);repeated.get(k).push(r);}
  for(const list of repeated.values())if(list.length>1)list.forEach(r=>r.flags|=1024);
  const personDays=[];
  for(const date of dates){const source=sourceForDate.get(date);for(const p of rosters.get(source)||[])personDays.push({...p,date,month:date.slice(0,7),week:weekKey(date),fy:sourceSheets.find(s=>s.name===source).fy,source});}
  const peopleMap=new Map();personDays.forEach(p=>peopleMap.set(p.person,{...p}));
  const people=[...peopleMap.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
  records.forEach((r,i)=>r.id=i);
  const excludedRecords=allRecords.filter(r=>sourceForDate.get(r.date)!==r.source);
  excludedRecords.forEach((r,i)=>r.id=records.length+i);
  const recordLookup=new Map([...records,...excludedRecords].map(r=>[r.id,r]));
  return {raw,records,allRecords,excludedRecords,recordLookup,personDays,people,dates,sourceSheets,issues,invalid,overlaps,discardedRecords:allRecords.length-records.length,discardedHours:sum(allRecords,r=>r.hours)-sum(records,r=>r.hours),sourceForDate,recordCount:records.length,hours:sum(records,r=>r.hours)};
}

export function emptyFilters(){return {fy:[],months:[],weeks:[],discipline:[],role:[],person:[],project:[],type:[],category:[],ohGroup:[],task:[],from:'',to:'',search:'',flag:0,status:[]};}
const inList=(arr,value)=>!arr?.length||arr.includes(value);
export function matchesDate(r,f){return inList(f.fy,r.fy)&&inList(f.months,r.month)&&inList(f.weeks,r.week)&&(!f.from||r.date>=f.from)&&(!f.to||r.date<=f.to);}
function matchesPerson(r,f){return inList(f.discipline,r.discipline)&&inList(f.role,r.role)&&inList(f.person,r.person);}
export function matchesFact(r,f){return inList(f.project,r.projectKey)&&inList(f.type,r.type)&&inList(f.category,r.category)&&inList(f.ohGroup,r.ohGroup)&&inList(f.task,r.task)&&(!f.flag||(r.flags&f.flag))&&(!f.search||norm([r.name,r.project,r.code,r.task,r.category,r.subcategory,r.comment,r.source].join(' ')).includes(norm(f.search)));}
export function statusFor(o){return o===null?'Sin capacidad':o>1?'Sobreasignado':o>=.9?'Alta ocupación':o>=.7?'Equilibrado':'Disponible';}
export const STATUS_COLORS = {'Sin capacidad':'#aab5b8','Sobreasignado':'#E52713','Alta ocupación':'#bf9000','Equilibrado':'#00AD81','Disponible':'#008A8B'};

export function analyze(dataset,filters,settings=DEFAULT_SETTINGS){
  const pd=dataset.personDays.filter(p=>matchesDate(p,filters)&&matchesPerson(p,filters));
  const base=dataset.records.filter(r=>matchesDate(r,filters)&&matchesPerson(r,filters));
  let facts=base.filter(r=>matchesFact(r,filters));
  const absent=new Map();base.filter(r=>r.type==='Ausencia').forEach(r=>{const k=r.person+'|'+r.date;absent.set(k,(absent.get(k)||0)+r.hours);});
  const capacity=pd.map(p=>{const gross=Number(settings.schedule[utc(p.date).getUTCDay()])||0;return {...p,gross,absence:absent.get(p.person+'|'+p.date)||0,net:Math.max(0,gross-(absent.get(p.person+'|'+p.date)||0))};});
  const resources=new Map();
  function resource(p){if(!resources.has(p.person))resources.set(p.person,{person:p.person,name:p.name,employeeId:p.employeeId,discipline:p.discipline,role:p.role,gross:0,net:0,absence:0,project:0,oh:0,unknown:0,total:0,projects:new Set(),recordedDays:new Set(),rosterDays:new Set()});return resources.get(p.person);}
  capacity.forEach(p=>{const r=resource(p);r.gross+=p.gross;r.net+=p.net;r.absence+=p.absence;if(p.gross>0)r.rosterDays.add(p.date)});
  facts.forEach(f=>{const r=resource(f);r.total+=f.hours;r.recordedDays.add(f.date);if(f.type==='Proyecto'){r.project+=f.hours;r.projects.add(f.projectKey);}else if(f.type==='Overhead')r.oh+=f.hours;else if(f.type==='Sin clasificar')r.unknown+=f.hours;});
  let people=[...resources.values()].map(r=>({...r,booked:r.project+r.oh,available:r.net-r.project-r.oh,occupancy:ratio(r.project+r.oh,r.net),utilization:ratio(r.project,r.net),ohLoad:ratio(r.oh,r.net),ohMix:ratio(r.oh,r.project+r.oh),status:statusFor(ratio(r.project+r.oh,r.net))}));
  if(filters.status?.length){people=people.filter(p=>filters.status.includes(p.status));const selected=new Set(people.map(p=>p.person));facts=facts.filter(f=>selected.has(f.person));}
  const selectedPersons=new Set(people.map(p=>p.person)),selectedCapacity=capacity.filter(p=>selectedPersons.has(p.person));
  const project=sum(facts.filter(r=>r.type==='Proyecto'),r=>r.hours),oh=sum(facts.filter(r=>r.type==='Overhead'),r=>r.hours),absence=sum(facts.filter(r=>r.type==='Ausencia'),r=>r.hours),unknown=sum(facts.filter(r=>r.type==='Sin clasificar'),r=>r.hours),net=sum(selectedCapacity,r=>r.net),gross=sum(selectedCapacity,r=>r.gross);
  const dates=[...new Set(selectedCapacity.map(c=>c.date))].sort();
  const fteHours=sum(dates,d=>Number(settings.schedule[utc(d).getUTCDay()])||0);
  const projects=groupFacts(facts.filter(r=>r.type==='Proyecto'),'projectKey').map(g=>({...g,name:g.records[0].project,code:g.records[0].code,tasks:new Set(g.records.map(r=>r.task)).size,people:new Set(g.records.map(r=>r.person)).size,share:ratio(g.hours,project)}));
  const complete=facts.filter(r=>(r.flags&(1|2|4|8|16|32|64))===0).length;
  return {facts,base,capacity:selectedCapacity,people,dates,project,oh,absence,unknown,net,gross,booked:project+oh,total:project+oh+absence+unknown,available:net-project-oh,occupancy:ratio(project+oh,net),utilization:ratio(project,net),ohLoad:ratio(oh,net),ohMix:ratio(oh,project+oh),fte:ratio(oh,fteHours),fteHours,lost:sum(facts.filter(r=>r.ohGroup==='Non-productive'),r=>r.hours),unclassifiedOH:sum(facts.filter(r=>r.type==='Overhead'&&r.ohGroup==='Sin clasificar'),r=>r.hours),headcount:people.length,activePeople:new Set(facts.map(r=>r.person)).size,projects:projects.sort((a,b)=>b.hours-a.hours),over:people.filter(p=>p.occupancy>1).length,completeness:ratio(complete,facts.length),future:sum(facts.filter(r=>r.date>settings.cutoff),r=>r.hours),futureCells:facts.filter(r=>r.date>settings.cutoff).length};
}

export function groupFacts(facts,key){
  const groups=new Map();for(const r of facts){const k=typeof key==='function'?key(r):r[key];if(!groups.has(k))groups.set(k,{key:k,hours:0,records:[]});const g=groups.get(k);g.hours+=r.hours;g.records.push(r);}
  return [...groups.values()].sort((a,b)=>b.hours-a.hours);
}
export function trend(model,grain='week'){
  const groups=new Map(),keyFn=r=>grain==='month'?r.date.slice(0,7):grain==='day'?r.date:r.week;
  const ensure=k=>{if(!groups.has(k))groups.set(k,{key:k,project:0,oh:0,absence:0,unknown:0,net:0,people:new Set()});return groups.get(k);};
  model.capacity.forEach(c=>{const g=ensure(keyFn(c));g.net+=c.net;g.people.add(c.person);});
  model.facts.forEach(r=>{const g=ensure(keyFn(r));g[r.type==='Proyecto'?'project':r.type==='Overhead'?'oh':r.type==='Ausencia'?'absence':'unknown']+=r.hours;});
  return [...groups.values()].sort((a,b)=>a.key.localeCompare(b.key)).map(g=>({...g,occupancy:ratio(g.project+g.oh,g.net)}));
}
export function defaultFilters(dataset){
  const f=emptyFilters();
  const completeMonths=[...new Set(dataset.records.filter(r=>r.date<=APP_DATE).map(r=>r.month))].filter(m=>m<APP_DATE.slice(0,7)).sort();
  const current=completeMonths.at(-1)||dataset.records.map(r=>r.month).sort().at(-1);
  if(current)f.months=[current];f.to=APP_DATE;return f;
}
export function csvText(rows){const safe=v=>{let t=String(v??'');if(/^[=+@-]/.test(t)&&!/^[-+]?\d+(?:[.,]\d+)*$/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};return '\uFEFF'+rows.map(r=>r.map(safe).join(';')).join('\r\n');}

export async function parseWorkbook(file,Zip=globalThis.JSZip){
  if(!Zip)throw new Error('No se pudo cargar el lector de Excel. Recarga la página.');
  if(file.size>30*1024*1024)throw new Error('El archivo supera 30 MB. Usa una copia del seguimiento sin imágenes ni hojas ajenas.');
  const zip=await Zip.loadAsync(await file.arrayBuffer());
  const xml=async p=>{const f=zip.file(p);if(!f)return null;return new DOMParser().parseFromString(await f.async('string'),'application/xml');};
  const wb=await xml('xl/workbook.xml'),rels=await xml('xl/_rels/workbook.xml.rels');
  if(!wb||!rels)throw new Error('El archivo debe ser un libro .xlsx válido.');
  const shared=await xml('xl/sharedStrings.xml');
  const strings=shared?[...shared.getElementsByTagName('si')].map(s=>[...s.getElementsByTagName('t')].map(t=>t.textContent).join('')):[];
  const relMap=Object.fromEntries([...rels.getElementsByTagName('Relationship')].map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));
  const raw={schemaVersion:1,filename:file.name,importedAt:new Date().toISOString().slice(0,10),sheets:[],ohCatalog:[]};
  const letters=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};
  for(const sh of wb.getElementsByTagName('sheet')){
    const name=sh.getAttribute('name');if(!/FY\s*\d{2}/i.test(name))continue;
    const target=relMap[sh.getAttribute('r:id')];if(!target)continue;
    const path=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');
    const doc=await xml(path);if(!doc)continue;
    const rows=new Map();let uncached=0;
    for(const r of doc.getElementsByTagName('row')){
      const ri=Number(r.getAttribute('r')),cells={};
      for(const c of r.getElementsByTagName('c')){
        const ref=c.getAttribute('r'),col=ref.replace(/\d/g,'');if(col.length>2)continue;
        const t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0]?.textContent;
        if(c.getElementsByTagName('f').length && v===undefined)uncached++;
        if(t==='s')cells[col]=strings[Number(v)]??'';
        else if(t==='inlineStr')cells[col]=[...c.getElementsByTagName('t')].map(e=>e.textContent).join('');
        else if(v!==undefined)cells[col]=t==='str'||t==='e'?v:Number(v);
      }
      rows.set(ri,cells);
    }
    const headers=Object.entries(rows.get(3)||{}).filter(([c,v])=>c.length<3&&((c.length===1&&c>='K')||c.length===2)&&v!==''&&!/tot/i.test(String((rows.get(4)||{})[c]||''))&&(rows.get(4)||{})[c]).map(([col,value])=>({col,value,weekday:rows.get(4)[col]}));
    const sheet={name,state:sh.getAttribute('state')||'visible',title:rows.get(1)?.A||'',headers,rows:[]};
    for(const [row,cells] of rows){if(row<5||missing(cells.B)||norm(cells.B).startsWith('TOTAL'))continue;const hours={};headers.forEach(h=>{if(cells[h.col]!==undefined&&cells[h.col]!==0)hours[h.col]=cells[h.col];});sheet.rows.push([row,...Array.from({length:10},(_,i)=>cells[letters(i)]??null),hours]);}
    if(uncached>0)raw.uncachedFormulas=(raw.uncachedFormulas||0)+uncached;
    raw.sheets.push(sheet);
  }
  if(!raw.sheets.length)throw new Error('No se encontraron hojas mensuales con nombre como «Septiembre FY26». Conserva las primeras 10 columnas y las fechas en las filas 3 y 4.');
  return raw;
}
