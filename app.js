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
   try{const parsed=JSON.parse(saved);if(validateConfig(parsed))config=parsed;}catch(e){}
  }
 }
 function getCleanConfig(){
  return{
   employees:config.employees,
   rotation:config.rotation,
   crewSize:config.crewSize,
   jobs:config.jobs.map(j=>({name:j.name,frequency:j.frequency,maxDuration:j.maxDuration})),
   jobsites:config.jobsites.map(s=>({name:s.name}))
  };
 }
 function saveConfig(){localStorage.setItem(configKey,JSON.stringify(getCleanConfig()));}
 function validateConfig(obj){
  if(typeof obj!=='object'||obj===null) return false;
  if(!Number.isInteger(obj.employees)||obj.employees<1) return false;
  if(!Array.isArray(obj.jobs)||!Array.isArray(obj.jobsites)) return false;
  const jobNames=new Set();
  for(const j of obj.jobs){
   if(!j||typeof j.name!=='string'||j.name.trim()==='') return false;
   if(jobNames.has(j.name)) return false;
   jobNames.add(j.name);
   if(!Number.isInteger(j.frequency)||j.frequency<0) return false;
   if(!Number.isInteger(j.maxDuration)||j.maxDuration<1) return false;
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
   row.appendChild(del);row.appendChild(name);row.appendChild(freqLabel);row.appendChild(durLabel);
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
  const grid=document.createElement('div');grid.className='jobsite-grid';grid.dataset.site=site.name;
  site.dayCells=[];site.nightCells=[];
  for(let d=0;d<365;d++){const cell=document.createElement('div');cell.className='jobsite-cell day';site.dayCells.push(cell);grid.appendChild(cell);}
  for(let d=0;d<365;d++){const cell=document.createElement('div');cell.className='jobsite-cell night';site.nightCells.push(cell);grid.appendChild(cell);}
  wrapper.appendChild(labels);wrapper.appendChild(grid);
  container.appendChild(wrapper);list.appendChild(container);
 });
}
 function addJob(){
  const name=prompt('Job name?');if(!name) return;
  if(config.jobs.some(j=>j.name===name)){alert('Job name must be unique');return;}
  config.jobs.push({name,frequency:0,maxDuration:1});saveConfig();renderJobs();
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
 const cycleLength=shiftLength*2+vacationLength; // 7 day + 28 off + 7 night
 const requiredPerSite=config.crewSize*6; // six crews needed for 2/4 rotation

 // assign employees evenly across jobsites
 const allEmpIds=Array.from({length:config.employees},(_,i)=>i);
 let index=0;
 config.jobsites.forEach((site,siteIdx)=>{
  const base=Math.floor(config.employees/config.jobsites.length);
  const extra=siteIdx<config.employees%config.jobsites.length?1:0;
  const count=Math.min(base+extra,allEmpIds.length-index);
  site.roster=allEmpIds.slice(index,index+count);
  index+=count;
  const empty=requiredPerSite-site.roster.length;
  const names=site.roster.map(id=>`Employee ${id+1}`).join(', ');
  site.nameEl.textContent=`${site.name} (${names}${empty>0?`, ${empty} empty spots`:''})`;
  site.schedule={day:Array.from({length:totalDays},()=>({job:null,role:'',employees:[]})),
                 night:Array.from({length:totalDays},()=>({job:null,role:'',employees:[]}))};
 });

 // build rotation schedule and collect vacation pools
 const vacations=Array.from({length:totalDays},()=>[]);
 config.jobsites.forEach(site=>{
  site.roster.forEach((emp,idx)=>{
   const group=Math.floor(idx/config.crewSize); // determines offset block
   const offset=group*shiftLength;
   for(let day=0;day<totalDays;day++){
    const phase=(day-offset+cycleLength)%cycleLength;
    if(phase<shiftLength){
     site.schedule.day[day].employees.push(emp);
    }else if(phase<shiftLength+vacationLength){
     vacations[day].push(emp);
    }else{
     site.schedule.night[day].employees.push(emp);
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
 if(config.jobsites.length===0||config.jobs.length===0){renderSchedules();return;}

 // place jobs without altering employee assignments
 config.jobs.forEach(job=>{
  for(let i=0;i<job.frequency;i++){
   let attempts=0,placed=false;
   while(attempts<1000&&!placed){
    attempts++;
    const site=randItem(config.jobsites);
    const startDay=randInt(0,totalDays-1);
    let duration=randInt(1,job.maxDuration);
    let endDay=startDay+duration-1;
    if(endDay>=totalDays) endDay=totalDays-1;
    let conflict=false;
    for(let day=startDay;day<=endDay;day++){
     if(site.schedule.day[day].job||site.schedule.night[day].job){conflict=true;break;}
    }
    if(conflict) continue;
    for(let day=startDay;day<=endDay;day++){
     let dayRole='',nightRole='';
     if(startDay===endDay){
      dayRole='start';nightRole='end';
     }else if(day===startDay){
      dayRole='start';nightRole='start';
     }else if(day===endDay){
      dayRole='end';nightRole='end';
     }
     const dayData=site.schedule.day[day];
     const nightData=site.schedule.night[day];
     dayData.job=job.name;dayData.role=dayRole;
     nightData.job=job.name;nightData.role=nightRole;
    }
    placed=true;
   }
  }
 });
 renderSchedules();
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
document.getElementById('crew-size').addEventListener('change',e=>{config.crewSize=parseInt(e.target.value,10)||1;saveConfig();});
document.getElementById('add-job').addEventListener('click',addJob);
 document.getElementById('add-jobsite').addEventListener('click',addJobsite);
 document.getElementById('export-config').addEventListener('click',exportConfig);
 document.getElementById('import-config').addEventListener('click',()=>document.getElementById('import-file').click());
 document.getElementById('import-file').addEventListener('change',e=>{if(e.target.files[0]) importConfig(e.target.files[0]);e.target.value='';});
 document.getElementById('run-simulation').addEventListener('click',runSimulation);
 loadConfig();
 render();
})();
