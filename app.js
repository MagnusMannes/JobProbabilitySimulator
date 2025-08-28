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
   const name=document.createElement('span');name.textContent=site.name;
   header.appendChild(del);header.appendChild(name);
   container.appendChild(header);
   const grid=document.createElement('div');grid.className='jobsite-grid';grid.dataset.site=site.name;
   site.dayCells=[];site.nightCells=[];
   for(let d=0;d<365;d++){const cell=document.createElement('div');cell.className='jobsite-cell day';site.dayCells.push(cell);grid.appendChild(cell);} 
   for(let d=0;d<365;d++){const cell=document.createElement('div');cell.className='jobsite-cell night';site.nightCells.push(cell);grid.appendChild(cell);} 
   container.appendChild(grid);list.appendChild(container);
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
  config.jobsites.forEach(site=>{site.schedule={day:Array.from({length:365},()=>({jobs:[],filled:0,required:0})),night:Array.from({length:365},()=>({jobs:[],filled:0,required:0}))};});
  if(config.jobsites.length===0||config.jobs.length===0){renderSchedules();return;}
  const crewSize=config.crewSize;
  config.jobs.forEach(job=>{
   for(let i=0;i<job.frequency;i++){
    const site=randItem(config.jobsites);
    const shift=Math.random()<0.5?'day':'night';
    const duration=randInt(1,job.maxDuration);
    const start=randInt(0,364);
    for(let d=start;d<Math.min(start+duration,365);d++){
     const cell=site.schedule[shift][d];
     cell.jobs.push(job.name);cell.required+=crewSize;
    }
   }
  });
  const employees=[];
  for(let i=0;i<config.employees;i++){const offset=Math.floor(Math.random()*42);employees.push({id:i,offset});}
  function shiftFor(emp,day){const pos=(day+emp.offset)%42;if(pos<7) return 'day';if(pos<14) return 'night';return 'off';}
  for(let day=0;day<365;day++){
   for(const site of config.jobsites){
    for(const shift of ['day','night']){
     const cell=site.schedule[shift][day];
     if(cell.required>0){
      let pool=employees.filter(e=>shiftFor(e,day)===shift);
      if(pool.length<cell.required){const others=employees.filter(e=>shiftFor(e,day)!==shift);pool=pool.concat(others);} 
      for(let c=0;c<cell.required;c++){const emp=pool[Math.floor(Math.random()*pool.length)];cell.filled++;}
     }
    }
   }
  }
  renderSchedules();
 }
 function renderSchedules(){
  config.jobsites.forEach(site=>{
   if(!site.schedule){
    if(site.dayCells){site.dayCells.forEach((cell,idx)=>{cell.removeAttribute('style');cell.title=formatDate(idx)+' Day: No jobs';});site.nightCells.forEach((cell,idx)=>{cell.removeAttribute('style');cell.title=formatDate(idx)+' Night: No jobs';});}
    return;
   }
   for(let d=0;d<365;d++){
    const dayData=site.schedule.day[d];const dayCell=site.dayCells[d];updateCell(dayCell,dayData,d,'Day');
    const nightData=site.schedule.night[d];const nightCell=site.nightCells[d];updateCell(nightCell,nightData,d,'Night');
   }
  });
 }
 function updateCell(el,data,dayIndex,label){
  if(data.required===0){el.style.background='';el.title=`${formatDate(dayIndex)} ${label}: No jobs`;return;}
  const coverage=data.filled/data.required;const hue=coverage*120;el.style.background=`hsl(${hue},70%,60%)`;
  el.title=`${formatDate(dayIndex)} ${label}: ${data.jobs.join(', ')} | ${data.filled}/${data.required} filled`;
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
