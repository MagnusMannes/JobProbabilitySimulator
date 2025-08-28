(function(){
 const configKey='jobSimConfig';
let config={
 employees:10,
 rotation:'2/4',
  crewSize:1,
 jobs:[],
 jobsites:[]
};
function loadConfig(){
 const saved=localStorage.getItem(configKey);
 if(saved){
  try{
   const parsed=JSON.parse(saved);
   if(validateConfig(parsed)){
    parsed.jobs.forEach(j=>{if(typeof j.target!=='number') j.target=0;});
    config=parsed;
   }
  }catch(e){}
 }
}
 function getCleanConfig(){
  return{
   employees:config.employees,
   rotation:config.rotation,
   crewSize:config.crewSize,
   jobs:config.jobs.map(j=>({name:j.name,frequency:j.frequency,maxDuration:j.maxDuration,target:j.target||0})),
   jobsites:config.jobsites.map(s=>({name:s.name}))
  };
 }
 function saveConfig(){localStorage.setItem(configKey,JSON.stringify(getCleanConfig()));}
 function validateConfig(obj){
  if(typeof obj!=='object'||obj===null) return false;
 if(!Number.isInteger(obj.employees)||obj.employees<1) return false;
 if(typeof obj.crewSize!=='number'||obj.crewSize<=0) return false;
  if(!Array.isArray(obj.jobs)||!Array.isArray(obj.jobsites)) return false;
  const jobNames=new Set();
  for(const j of obj.jobs){
   if(!j||typeof j.name!=='string'||j.name.trim()==='') return false;
   if(jobNames.has(j.name)) return false;
   jobNames.add(j.name);
   if(!Number.isInteger(j.frequency)||j.frequency<0) return false;
   if(!Number.isInteger(j.maxDuration)||j.maxDuration<1) return false;
   if(j.target!==undefined && (!Number.isInteger(j.target)||j.target<0)) return false;
  }
  const siteNames=new Set();
  for(const s of obj.jobsites){
   if(!s||typeof s.name!=='string'||s.name.trim()==='') return false;
   if(siteNames.has(s.name)) return false;
   siteNames.add(s.name);
  }
  return true;
 }
function render(){
 document.getElementById('employee-count').value=config.employees;
 document.getElementById('crew-size').value=config.crewSize;
 renderJobs();
 renderJobsites();
}
 function renderJobs(){
  const list=document.getElementById('jobs-list');
  list.innerHTML='';
  config.jobs.forEach(job=>{
   if(typeof job.target!=='number') job.target=0;
   const row=document.createElement('div');row.className='job-row';
   const del=document.createElement('span');del.className='delete';del.textContent='×';
   del.addEventListener('click',()=>{config.jobs=config.jobs.filter(j=>j!==job);saveConfig();renderJobs();});
   const name=document.createElement('span');name.textContent=job.name;
   const freqLabel=document.createElement('label');freqLabel.textContent=' Frequency/yr ';
   const freqInput=document.createElement('input');freqInput.type='number';freqInput.min='0';freqInput.value=job.frequency;
   freqInput.addEventListener('change',()=>{job.frequency=parseInt(freqInput.value,10)||0;saveConfig();});
   freqLabel.appendChild(freqInput);
   const durLabel=document.createElement('label');durLabel.textContent=' Max days ';
   const durInput=document.createElement('input');durInput.type='number';durInput.min='1';durInput.value=job.maxDuration;
   durInput.addEventListener('change',()=>{job.maxDuration=parseInt(durInput.value,10)||1;saveConfig();});
   durLabel.appendChild(durInput);
   const targetLabel=document.createElement('label');targetLabel.textContent=' Proficiency Target ';
   const targetInput=document.createElement('input');targetInput.type='number';targetInput.min='0';targetInput.value=job.target;
   targetInput.addEventListener('change',()=>{job.target=parseInt(targetInput.value,10)||0;saveConfig();});
   targetLabel.appendChild(targetInput);
   row.appendChild(del);row.appendChild(name);row.appendChild(freqLabel);row.appendChild(durLabel);row.appendChild(targetLabel);
   list.appendChild(row);
  });
 }
 function renderJobsites(){
  const list=document.getElementById('jobsites-list');
  list.innerHTML='';
 config.jobsites.forEach(site=>{
 const container=document.createElement('div');container.className='jobsite';
 const header=document.createElement('div');header.className='jobsite-header';
 const del=document.createElement('span');del.className='delete';del.textContent='×';
  del.addEventListener('click',()=>{config.jobsites=config.jobsites.filter(s=>s!==site);saveConfig();renderJobsites();});
  const name=document.createElement('span');name.textContent=site.name;site.nameEl=name;
  header.appendChild(del);header.appendChild(name);
  container.appendChild(header);
  const wrapper=document.createElement('div');wrapper.className='jobsite-grid-wrapper';
  const labels=document.createElement('div');labels.className='shift-labels';labels.innerHTML='<div>Day</div><div>Night</div>';
 const gridContainer=document.createElement('div');gridContainer.className='grid-container';
 const grid=document.createElement('div');grid.className='jobsite-grid';grid.dataset.site=site.name;
 site.dayCells=[];site.nightCells=[];
 for(let d=0;d<365;d++){const cell=document.createElement('div');cell.className='jobsite-cell day';site.dayCells.push(cell);grid.appendChild(cell);}
 for(let d=0;d<365;d++){const cell=document.createElement('div');cell.className='jobsite-cell night';site.nightCells.push(cell);grid.appendChild(cell);}
 gridContainer.appendChild(grid);
 const weekLabels=document.createElement('div');weekLabels.className='week-labels';
 for(let w=0,pos=0;pos<365;w++,pos+=7){const cell=document.createElement('div');cell.textContent=`Week ${w+1}`;const span=Math.min(7,365-pos);cell.style.gridColumn=`span ${span}`;weekLabels.appendChild(cell);}
 gridContainer.appendChild(weekLabels);
 wrapper.appendChild(labels);wrapper.appendChild(gridContainer);
 container.appendChild(wrapper);list.appendChild(container);
 });
}
 function addJob(){
  const name=prompt('Job name?');if(!name) return;
  if(config.jobs.some(j=>j.name===name)){alert('Job name must be unique');return;}
  config.jobs.push({name,frequency:0,maxDuration:1,target:0});saveConfig();renderJobs();
  }
 function addJobsite(){
  const name=prompt('Jobsite name?');if(!name) return;
  if(config.jobsites.some(s=>s.name===name)){alert('Jobsite name must be unique');return;}
  config.jobsites.push({name});saveConfig();renderJobsites();
 }
 function exportConfig(){
  const blob=new Blob([JSON.stringify(getCleanConfig(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='config.json';a.click();
  URL.revokeObjectURL(url);
 }
 function importConfig(file){
  const reader=new FileReader();
  reader.onload=e=>{
   try{const obj=JSON.parse(e.target.result);if(!validateConfig(obj)) throw new Error('Invalid configuration');config=obj;saveConfig();render();}
   catch(err){alert('Import failed: '+err.message);}
  };
  reader.readAsText(file);
 }
function runSimulation(){
 const totalDays=365;
 const shiftLength=7;
 const vacationLength=28;
const cycleLength=shiftLength*2+vacationLength; // 7 day + 7 night + 28 off
const maxPerSite=6; // maximum employees fixed to any jobsite

 // assign employees evenly across jobsites up to six per site
 config.jobsites.forEach(site=>{site.roster=[];});
 let empId=0;
 while(empId<config.employees){
  let assigned=false;
  for(const site of config.jobsites){
   if(site.roster.length<maxPerSite){site.roster.push(empId++);assigned=true;}
   if(empId>=config.employees) break;
  }
  if(!assigned) break;
 }
 config.jobsites.forEach(site=>{
  const empty=maxPerSite-site.roster.length;
  const names=site.roster.map(id=>`Employee ${id+1}`).join(', ');
  site.nameEl.textContent=`${site.name} (${names}${empty>0?`, ${empty} empty spots`:''})`;
  site.schedule={day:Array.from({length:totalDays},()=>({job:null,role:'',employees:[]})),
                 night:Array.from({length:totalDays},()=>({job:null,role:'',employees:[]}))};
 });

 // build rotation schedule and collect vacation pools
 const vacations=Array.from({length:totalDays},()=>[]);
 config.jobsites.forEach(site=>{
  site.roster.forEach((emp,idx)=>{
   const offset=idx*shiftLength;
   for(let day=0;day<totalDays;day++){
    const phase=(day-offset+cycleLength)%cycleLength;
    if(phase<shiftLength){
     site.schedule.night[day].employees.push(emp);
    }else if(phase<shiftLength*2){
     site.schedule.day[day].employees.push(emp);
    }else{
     vacations[day].push(emp);
    }
   }
  });
 });

 // borrow employees from vacation to fill empty slots
 for(let day=0;day<totalDays;day++){
  const pool=vacations[day];
  config.jobsites.forEach(site=>{
   const dayArr=site.schedule.day[day].employees;
   while(dayArr.length<config.crewSize&&pool.length>0){dayArr.push(pool.pop());}
   while(dayArr.length<config.crewSize){dayArr.push(null);}
   const nightArr=site.schedule.night[day].employees;
   while(nightArr.length<config.crewSize&&pool.length>0){nightArr.push(pool.pop());}
   while(nightArr.length<config.crewSize){nightArr.push(null);}
  });
 }

 // if no jobs or jobsites, render schedule now
 if(config.jobsites.length===0||config.jobs.length===0){
  renderSchedules();
  const emptyStats=Array.from({length:config.employees},()=>({}));
  renderEmployeeSummary(emptyStats);
  return;
 }

 // place jobs with distinct start/stop shifts and minimum one-day length
 config.jobs.forEach(job=>{
  for(let i=0;i<job.frequency;i++){
   let attempts=0,placed=false;
   while(attempts<1000&&!placed){
    attempts++;
    const site=randItem(config.jobsites);
    const duration=randInt(1,Math.min(job.maxDuration,totalDays-1)); // duration in days
    const startDay=randInt(0,totalDays-duration-1);
    const endDay=startDay+duration;
    const startShift=randItem(['day','night']);
    const endShift=randItem(['day','night']);
    const startIndex=startDay*2+(startShift==='day'?0:1);
    const endIndex=endDay*2+(endShift==='day'?0:1);
    let conflict=false;
    for(let s=startIndex;s<=endIndex;s++){
     const d=Math.floor(s/2);
     const sh=s%2===0?'day':'night';
     if(site.schedule[sh][d].job){conflict=true;break;}
    }
    if(conflict) continue;
    for(let s=startIndex;s<=endIndex;s++){
     const d=Math.floor(s/2);
     const sh=s%2===0?'day':'night';
     const data=site.schedule[sh][d];
     data.job=job.name;
     data.role=s===startIndex?'start':s===endIndex?'end':'';
    }
    placed=true;
   }
 }
 });
 // gather job stats per employee
 const stats=Array.from({length:config.employees},()=>({}));
 config.jobsites.forEach(site=>{
 ['day','night'].forEach(shift=>{
  for(let d=0;d<totalDays;d++){
   const entry=site.schedule[shift][d];
   if(!entry.job || !(entry.role==='start'||entry.role==='end')) continue;
   entry.employees.forEach(emp=>{
    if(emp===null) return;
    const s=stats[emp];
    if(!s[entry.job]) s[entry.job]={count:0,details:[]};
    s[entry.job].count++;
    s[entry.job].details.push(`${site.name} on ${formatDate(d)} ${shift} (${entry.role})`);
   });
  }
 });
});
renderSchedules();
renderEmployeeSummary(stats);
}
function renderSchedules(){
 config.jobsites.forEach(site=>{
  if(!site.schedule){
   if(site.dayCells){site.dayCells.forEach((cell,idx)=>{cell.className='jobsite-cell day';cell.textContent='';cell.title=formatDate(idx)+' Day: No jobs';});site.nightCells.forEach((cell,idx)=>{cell.className='jobsite-cell night';cell.textContent='';cell.title=formatDate(idx)+' Night: No jobs';});}
   return;
  }
  for(let d=0;d<365;d++){
   const dayData=site.schedule.day[d];const dayCell=site.dayCells[d];updateCell(dayCell,dayData,d,'Day');
   const nightData=site.schedule.night[d];const nightCell=site.nightCells[d];updateCell(nightCell,nightData,d,'Night');
  }
 });
}
function renderEmployeeSummary(stats){
 const table=document.getElementById('employee-job-table');
 table.innerHTML='';
 const jobNames=config.jobs.map(j=>j.name);
 const thead=document.createElement('thead');
 const headRow=document.createElement('tr');
 const empTh=document.createElement('th');empTh.textContent='Employee';
 empTh.addEventListener('click',()=>sortTable(table,0));
 headRow.appendChild(empTh);
 jobNames.forEach((name,idx)=>{const th=document.createElement('th');th.textContent=name;th.addEventListener('click',()=>sortTable(table,idx+1));headRow.appendChild(th);});
 const profTh=document.createElement('th');profTh.textContent='Proficiency';profTh.addEventListener('click',()=>sortTable(table,jobNames.length+1));headRow.appendChild(profTh);
 thead.appendChild(headRow);table.appendChild(thead);
 const tbody=document.createElement('tbody');
 stats.forEach((stat,idx)=>{
  const tr=document.createElement('tr');
  const nameTd=document.createElement('td');nameTd.textContent=`Employee ${idx+1}`;tr.appendChild(nameTd);
  jobNames.forEach(job=>{
   const td=document.createElement('td');
   const data=stat[job];
   td.textContent=data?data.count:0;
   if(data) td.title=data.details.join('\n');
   tr.appendChild(td);
  });
  let minDiff=Infinity;
  config.jobs.forEach(job=>{
   const count=stat[job.name]?stat[job.name].count:0;
   const diff=count-(job.target||0);
   if(diff<minDiff) minDiff=diff;
  });
  const profTd=document.createElement('td');
  if(minDiff>=0){
   profTd.textContent='✔';
   profTd.className='proficiency-met';
   profTd.dataset.value=0;
  }else{
   profTd.textContent=minDiff;
   profTd.className='proficiency-miss';
   profTd.dataset.value=minDiff;
  }
  tr.appendChild(profTd);
  tbody.appendChild(tr);
 });
 table.appendChild(tbody);
}

function sortTable(table,columnIndex){
 const tbody=table.querySelector('tbody');
 const rows=Array.from(tbody.querySelectorAll('tr'));
 const asc=!(table.dataset.sortColumn==columnIndex && table.dataset.sortOrder==='asc');
 rows.sort((a,b)=>{
  const aCell=a.children[columnIndex];
  const bCell=b.children[columnIndex];
  const aText=aCell.dataset.value!==undefined?aCell.dataset.value:aCell.textContent;
  const bText=bCell.dataset.value!==undefined?bCell.dataset.value:bCell.textContent;
  const aVal=columnIndex===0?parseInt(aText.replace(/\D/g,''),10):parseInt(aText,10);
  const bVal=columnIndex===0?parseInt(bText.replace(/\D/g,''),10):parseInt(bText,10);
  if(aVal===bVal) return 0;
  return asc?(aVal>bVal?1:-1):(aVal<bVal?1:-1);
 });
 rows.forEach(r=>tbody.appendChild(r));
 table.dataset.sortColumn=columnIndex;
 table.dataset.sortOrder=asc?'asc':'desc';
 table.querySelectorAll('th').forEach((th,i)=>{
  th.classList.remove('sorted-asc','sorted-desc');
  if(i===columnIndex) th.classList.add(asc?'sorted-asc':'sorted-desc');
 });
}
function updateCell(el,data,dayIndex,label){
 el.className='jobsite-cell '+label.toLowerCase();
 const employeeText=data.employees.map(e=>e!==null?`E${e+1}`:'-').join(', ');
 el.textContent=employeeText;
 if(!data.job){
  el.title=`${formatDate(dayIndex)} ${label}: No jobs | Employees: ${data.employees.map(e=>e!==null?`Employee ${e+1}`:'Empty').join(', ')}`;
  return;
 }
 if(data.role) data.role.split(' ').forEach(r=>el.classList.add(r));
 const roleText=data.role?` (${data.role})`:'';
 el.title=`${formatDate(dayIndex)} ${label}: ${data.job}${roleText} | Employees: ${data.employees.map(e=>e!==null?`Employee ${e+1}`:'Empty').join(', ')}`;
}
 function formatDate(dayIndex){const date=new Date(new Date().getFullYear(),0,dayIndex+1);return date.toLocaleDateString();}
 function randItem(arr){return arr[Math.floor(Math.random()*arr.length)];}
 function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
document.getElementById('employee-count').addEventListener('change',e=>{config.employees=parseInt(e.target.value,10)||1;saveConfig();});
document.getElementById('crew-size').addEventListener('change',e=>{config.crewSize=parseFloat(e.target.value)||1;saveConfig();});
document.getElementById('add-job').addEventListener('click',addJob);
 document.getElementById('add-jobsite').addEventListener('click',addJobsite);
 document.getElementById('export-config').addEventListener('click',exportConfig);
 document.getElementById('import-config').addEventListener('click',()=>document.getElementById('import-file').click());
 document.getElementById('import-file').addEventListener('change',e=>{if(e.target.files[0]) importConfig(e.target.files[0]);e.target.value='';});
 document.getElementById('run-simulation').addEventListener('click',runSimulation);
 loadConfig();
 render();
})();
