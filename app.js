(function(){
 const configKey='jobSimConfig';
 let config={
  employees:10,
  rotation:'2/4',
  crewSize:2,
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
  const labels=document.createElement('div');labels.className='shift-labels';labels.innerHTML='<div>Day Shift</div><div>Night Shift</div>';
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
  const rosterSize=6;
  const allEmpIds=Array.from({length:config.employees},(_,i)=>i);
  config.jobsites.forEach(site=>{
   site.roster=[];
   const shuffled=allEmpIds.slice().sort(()=>Math.random()-0.5);
   for(let i=0;i<Math.min(config.crewSize,shuffled.length);i++) site.roster.push(shuffled[i]);
   const empty=rosterSize-site.roster.length;
   const names=site.roster.map(id=>`Employee ${id+1}`).join(', ');
   site.nameEl.textContent=`${site.name} (${names}${empty>0?`, ${empty} empty spots`:''})`;
   site.schedule={day:Array.from({length:365},()=>({job:null,role:null,employees:[]})),night:Array.from({length:365},()=>({job:null,role:null,employees:[]}))};
  });
  if(config.jobsites.length===0||config.jobs.length===0){renderSchedules();return;}
  config.jobs.forEach(job=>{
   for(let i=0;i<job.frequency;i++){
    let attempts=0,placed=false;
    while(attempts<1000&&!placed){
     attempts++;
     const site=randItem(config.jobsites);
     const startIndex=randInt(0,365*2-1);
     const maxShiftLen=job.maxDuration*2;
     let shiftLen=randInt(1,maxShiftLen);
     let endIndex=startIndex+shiftLen-1;
     if(endIndex>=365*2) endIndex=365*2-1;
     const startDay=Math.floor(startIndex/2);const endDay=Math.floor(endIndex/2);
     let conflict=false;
     for(let day=startDay;day<=endDay;day++){
      if(site.schedule.day[day].job||site.schedule.night[day].job){conflict=true;break;}
     }
     if(conflict) continue;
     for(let day=startDay;day<=endDay;day++){
      for(const shift of ['day','night']){
       const idx=day*2+(shift==='night'?1:0);
       const cell=site.schedule[shift][day];
       let role;
       if(startDay===endDay){
        if(startIndex===endIndex){
         role=idx===startIndex?'start end':'start-span';
        }else{
         role=idx===startIndex?'start':'end';
        }
       }else if(day===startDay){
        role=idx===startIndex?'start':'start-span';
       }else if(day===endDay){
        role=idx===endIndex?'end':'end-span';
       }else{
        role='middle';
       }
       cell.job=job.name;
       cell.role=role;
       const crew=[];
       for(let c=0;c<config.crewSize;c++) crew.push(site.roster[c]!==undefined?site.roster[c]:null);
       cell.employees=crew;
      }
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
 if(!data.job){
  el.textContent='';
  el.title=`${formatDate(dayIndex)} ${label}: No jobs`;
  return;
 }
 data.role.split(' ').forEach(r=>el.classList.add(r));
 el.textContent=data.employees.map(e=>e!==null?`E${e+1}`:'-').join(',');
 el.title=`${formatDate(dayIndex)} ${label}: ${data.job} (${data.role}) | Employees: ${data.employees.map(e=>e!==null?`Employee ${e+1}`:'Empty').join(', ')}`;
}
 function formatDate(dayIndex){const date=new Date(new Date().getFullYear(),0,dayIndex+1);return date.toLocaleDateString();}
 function randItem(arr){return arr[Math.floor(Math.random()*arr.length)];}
 function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
 document.getElementById('employee-count').addEventListener('change',e=>{config.employees=parseInt(e.target.value,10)||1;saveConfig();});
 document.getElementById('add-job').addEventListener('click',addJob);
 document.getElementById('add-jobsite').addEventListener('click',addJobsite);
 document.getElementById('export-config').addEventListener('click',exportConfig);
 document.getElementById('import-config').addEventListener('click',()=>document.getElementById('import-file').click());
 document.getElementById('import-file').addEventListener('change',e=>{if(e.target.files[0]) importConfig(e.target.files[0]);e.target.value='';});
 document.getElementById('run-simulation').addEventListener('click',runSimulation);
 loadConfig();
 render();
})();
