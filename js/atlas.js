
const STORAGE_KEY='remnant-atlas-state-v1';
const PIN='0420';
let state=null, selectedId='', placingWorld=false, placingSub=false;
let labelsVisible=localStorage.getItem('remnant-atlas-labels-visible')!=='false';
let worldZoom=Number(localStorage.getItem('remnant-atlas-world-zoom'))||1;
const MIN_ZOOM=.35, MAX_ZOOM=4, ZOOM_STEP=.15;
let workRaw=null,workCurrent=null,workShowingBefore=false;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selected=()=>state?.zones?.find(z=>z.id===selectedId);

async function init(){
  let seed = window.REMNANT_ATLAS_SEED ? structuredClone(window.REMNANT_ATLAS_SEED) : null;
  if(location.protocol !== 'file:'){
    try{
      const response = await fetch('data/atlas.json', {cache:'no-store'});
      if(response.ok) seed = await response.json();
    }catch(err){ console.warn('Could not fetch data/atlas.json; using embedded fallback.', err); }
  }
  if(!seed) throw new Error('No atlas seed data could be loaded.');
  const local=localStorage.getItem(STORAGE_KEY);
  state=window.RemnantMigrations.migrate(local?JSON.parse(local):seed);
  selectedId=state.zones?.[0]?.id||'';
  $('worldImg').src=state.world?.image||'assets/world/world-surface.webp';
  bindStatic(); applyLabelMode(); render();
  requestAnimationFrame(()=>setWorldZoom(worldZoom));
}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render()}
function render(){
  $('zoneList').innerHTML=state.zones.map(z=>`<div class="zone-row ${z.id===selectedId?'active':''}" data-id="${z.id}"><span class="swatch" style="background:${z.color}"></span><div><strong>${esc(z.name)}</strong><small>${esc(z.region||'Uncategorized')}</small></div></div>`).join('');
  $('worldDots').innerHTML=state.zones.map(z=>`<div class="world-dot" data-id="${z.id}" style="left:${z.x}%;top:${z.y}%;--dot:${z.color}"><button aria-label="${esc(z.name)}"></button><div class="label">${esc(z.name)}</div></div>`).join('');
  bindRows();bindDots();renderDetail();
}
function bindRows(){document.querySelectorAll('.zone-row').forEach(el=>el.onclick=()=>openZone(el.dataset.id))}
function bindDots(){document.querySelectorAll('.world-dot').forEach(dot=>{const btn=dot.querySelector('button');let pid=null,sx=0,sy=0,startX=0,startY=0,moved=false;btn.onpointerdown=e=>{if(!document.body.classList.contains('admin'))return;const z=state.zones.find(x=>x.id===dot.dataset.id);e.preventDefault();pid=e.pointerId;btn.setPointerCapture(pid);sx=e.clientX;sy=e.clientY;startX=z.x;startY=z.y;moved=false};btn.onpointermove=e=>{if(pid===null||!btn.hasPointerCapture(pid))return;const r=$('worldCanvas').getBoundingClientRect(),z=state.zones.find(x=>x.id===dot.dataset.id);if(Math.abs(e.clientX-sx)>3||Math.abs(e.clientY-sy)>3)moved=true;z.x=Math.max(1,Math.min(99,startX+(e.clientX-sx)/r.width*100));z.y=Math.max(1,Math.min(99,startY+(e.clientY-sy)/r.height*100));dot.style.left=z.x+'%';dot.style.top=z.y+'%'};btn.onpointerup=e=>{if(pid!==null){try{btn.releasePointerCapture(pid)}catch{}pid=null}if(moved){selectedId=dot.dataset.id;persist()}else openZone(dot.dataset.id)};btn.onclick=()=>{if(!document.body.classList.contains('admin'))openZone(dot.dataset.id)}})}
function showView(v){$('worldView').classList.toggle('active',v==='world');$('detailView').classList.toggle('active',v==='detail')}
function openZone(id){selectedId=id;render();showView('detail')}
function renderDetail(){const z=selected();if(!z)return;$('miniTitle').textContent=z.name;$('zoneTitle').textContent=z.name;$('zoneMeta').textContent=z.region||'Uncategorized';$('zoneDesc').textContent=z.description||'No description yet.';$('miniImg').src=z.minimap||'';$('subDots').innerHTML=(z.submarkers||[]).map(m=>`<button class="subdot" title="${esc(m.label)}" style="left:${m.x}%;top:${m.y}%;--dot:${m.color}"></button>`).join('');$('subList').innerHTML=(z.submarkers||[]).length?(z.submarkers||[]).map(m=>`<div class="marker-item"><strong>${esc(m.label)}</strong><small>${esc(m.type)} · ${esc(m.notes||'No notes')}</small></div>`).join(''):'<div class="note">No minimap markers yet.</div>'}
function setWorldZoom(value, clientX=null, clientY=null){
  const wrap=$('worldWrap'),canvas=$('worldCanvas');
  const old=worldZoom;
  worldZoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Number(value.toFixed(3))));
  document.body.dataset.fitMode='false';
  if(clientX===null||clientY===null){const wr=wrap.getBoundingClientRect();clientX=wr.left+wr.width/2;clientY=wr.top+wr.height/2;}
  const r=canvas.getBoundingClientRect();
  const beforeX=(clientX-r.left)/old;
  const beforeY=(clientY-r.top)/old;
  canvas.style.transform=`scale(${worldZoom})`;
  $('worldViewport').style.width=`${Math.max(100,worldZoom*100)}%`;
  $('worldViewport').style.height=`${Math.max(100,worldZoom*100)}%`;
  $('zoom100Btn').textContent=Math.round(worldZoom*100)+'%';
  localStorage.setItem('remnant-atlas-world-zoom',String(worldZoom));
  requestAnimationFrame(()=>{const wr=wrap.getBoundingClientRect();wrap.scrollLeft=Math.max(0,beforeX*worldZoom-(clientX-wr.left));wrap.scrollTop=Math.max(0,beforeY*worldZoom-(clientY-wr.top));});
}
function fitWorldToScreen(){const wrap=$('worldWrap'),canvas=$('worldCanvas');if(!wrap||!canvas)return;const baseW=1000,baseH=1000*(1056/1076),availableW=Math.max(200,wrap.clientWidth-36),availableH=Math.max(200,window.innerHeight-wrap.getBoundingClientRect().top-24),fit=Math.min(availableW/baseW,availableH/baseH);worldZoom=Math.max(MIN_ZOOM,Math.min(1,fit));canvas.style.transform=`scale(${worldZoom})`;$('worldViewport').style.width='100%';$('worldViewport').style.height='100%';$('zoom100Btn').textContent=Math.round(worldZoom*100)+'%';wrap.scrollLeft=0;wrap.scrollTop=0;document.body.dataset.fitMode='true';localStorage.setItem('remnant-atlas-world-zoom',String(worldZoom))}
function bindWorldPan(){const wrap=$('worldWrap');let pointerId=null,startX=0,startY=0,startLeft=0,startTop=0;wrap.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(e.target.closest('.world-map-controls,.world-dot,button,input,select,textarea,dialog'))return;if(placingWorld)return;pointerId=e.pointerId;startX=e.clientX;startY=e.clientY;startLeft=wrap.scrollLeft;startTop=wrap.scrollTop;wrap.setPointerCapture(pointerId);wrap.classList.add('panning')});wrap.addEventListener('pointermove',e=>{if(pointerId===null||!wrap.hasPointerCapture(pointerId))return;wrap.scrollLeft=startLeft-(e.clientX-startX);wrap.scrollTop=startTop-(e.clientY-startY)});const stopPan=()=>{if(pointerId===null)return;try{wrap.releasePointerCapture(pointerId)}catch{}pointerId=null;wrap.classList.remove('panning')};wrap.addEventListener('pointerup',stopPan);wrap.addEventListener('pointercancel',stopPan)}
function applyLabelMode(){document.body.classList.toggle('labels-hidden',!labelsVisible);$('labelToggleBtn').textContent=labelsVisible?'Hide Names':'Show Names';localStorage.setItem('remnant-atlas-labels-visible',String(labelsVisible))}
function editSelected(){const z=selected();if(!z)return;$('zoneDialogTitle').textContent='Edit Location';$('zoneId').value=z.id;$('zoneX').value=z.x;$('zoneY').value=z.y;$('zoneName').value=z.name;$('zoneRegion').value=z.region||'';$('zoneDescription').value=z.description||'';const r=document.querySelector(`input[name=zoneColor][value="${z.color}"]`);if(r)r.checked=true;$('zoneDialog').showModal()}
function bindStatic(){
 $('backBtn').onclick=()=>showView('world');
 $('labelToggleBtn').onclick=()=>{labelsVisible=!labelsVisible;applyLabelMode()};
 $('zoomInBtn').onclick=()=>setWorldZoom(worldZoom+ZOOM_STEP);
 $('zoomOutBtn').onclick=()=>setWorldZoom(worldZoom-ZOOM_STEP);
 $('zoom100Btn').onclick=()=>setWorldZoom(1);
 $('fitBtn').onclick=fitWorldToScreen;
 $('worldWrap').addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();setWorldZoom(worldZoom+(e.deltaY<0?ZOOM_STEP:-ZOOM_STEP),e.clientX,e.clientY)},{passive:false});
 bindWorldPan();
 window.addEventListener('resize',()=>{if(document.body.dataset.fitMode==='true')fitWorldToScreen()});
 $('adminBtn').onclick=()=>document.body.classList.contains('admin')?lockAdmin():$('adminDialog').showModal();
 $('unlockBtn').onclick=()=>{if($('pinInput').value===PIN){document.body.classList.add('admin');$('adminBtn').textContent='Exit Admin';$('pinInput').value='';$('adminDialog').close()}else{$('pinInput').value='';$('pinInput').placeholder='Incorrect PIN'}};
 document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 $('placeWorldBtn').onclick=()=>{placingWorld=!placingWorld;document.body.classList.toggle('placing-world',placingWorld);$('placeWorldBtn').textContent=placingWorld?'Cancel Placement':'+ Place Location Dot'};
 $('worldCanvas').onclick=e=>{if(!placingWorld||!document.body.classList.contains('admin')||e.target.closest('.world-dot'))return;const r=$('worldCanvas').getBoundingClientRect();$('zoneDialogTitle').textContent='Add Location';$('zoneId').value='';$('zoneX').value=((e.clientX-r.left)/r.width*100).toFixed(2);$('zoneY').value=((e.clientY-r.top)/r.height*100).toFixed(2);$('zoneName').value='';$('zoneRegion').value='';$('zoneDescription').value='';$('zoneDialog').showModal();placingWorld=false;document.body.classList.remove('placing-world');$('placeWorldBtn').textContent='+ Place Location Dot'};
 $('editZoneBtn').onclick=editSelected;$('editZoneBtn2').onclick=editSelected;
 $('saveZoneBtn').onclick=()=>{const name=$('zoneName').value.trim();if(!name)return alert('Give the location a name.');const id=$('zoneId').value||('zone-'+Date.now()),old=state.zones.find(z=>z.id===id),color=document.querySelector('input[name=zoneColor]:checked').value;const z={id,name,region:$('zoneRegion').value.trim(),description:$('zoneDescription').value.trim(),x:+$('zoneX').value,y:+$('zoneY').value,color,minimap:old?.minimap||'',submarkers:old?.submarkers||[]};const i=state.zones.findIndex(q=>q.id===id);if(i>=0)state.zones[i]=z;else state.zones.push(z);selectedId=id;$('zoneDialog').close();persist()};
 $('deleteZoneBtn').onclick=()=>{const z=selected();if(z&&confirm(`Delete ${z.name}?`)){state.zones=state.zones.filter(x=>x.id!==z.id);selectedId=state.zones[0]?.id||'';persist();showView('world')}};
 $('placeSubBtn').onclick=()=>{placingSub=!placingSub;$('placeSubBtn').textContent=placingSub?'Click Minimap…':'+ Add Minimap Dot'};
 $('miniFrame').onclick=e=>{if(!placingSub||!document.body.classList.contains('admin')||e.target.closest('.subdot'))return;const r=$('miniFrame').getBoundingClientRect();$('subX').value=((e.clientX-r.left)/r.width*100).toFixed(2);$('subY').value=((e.clientY-r.top)/r.height*100).toFixed(2);$('subLabel').value='';$('subNotes').value='';$('subDialog').showModal();placingSub=false;$('placeSubBtn').textContent='+ Add Minimap Dot'};
 $('saveSubBtn').onclick=()=>{if(!$('subLabel').value.trim())return alert('Give the marker a label.');const z=selected();z.submarkers=z.submarkers||[];z.submarkers.push({x:+$('subX').value,y:+$('subY').value,label:$('subLabel').value.trim(),type:$('subType').value,notes:$('subNotes').value.trim(),color:$('subColor').value});$('subDialog').close();persist()};
 $('workshopBtn').onclick=()=>{$('workshopDialog').showModal();loadWorkshop(selected()?.minimap||'')};
 $('workUploadBtn').onclick=()=>$('workFile').click();$('workFile').onchange=()=>{const f=$('workFile').files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>loadWorkshop(rd.result);rd.readAsDataURL(f);$('workFile').value=''};
 $('workExtractBtn').onclick=extractWorkshop;$('workResetBtn').onclick=()=>{if(!workRaw)return;workCurrent=new ImageData(new Uint8ClampedArray(workRaw.data),workRaw.width,workRaw.height);drawWork(workCurrent);$('workStatus').textContent='Reset to uploaded original.'};
 $('showBeforeBtn').onclick=()=>{if(workRaw)drawWork(workRaw)};$('showAfterBtn').onclick=()=>{if(workCurrent)drawWork(workCurrent)};
 $('workSaveBtn').onclick=()=>{if(!workCurrent)return;drawWork(workCurrent);selected().minimap=$('workCanvas').toDataURL('image/png');persist();$('workStatus').textContent='Saved cleaned minimap locally. Export data to preserve/share it.'};
 $('exportBtn').onclick=exportData;$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=importData;
}
function lockAdmin(){document.body.classList.remove('admin','placing-world');$('adminBtn').textContent='Admin Mode';placingWorld=false;placingSub=false}
function loadWorkshop(src){if(!src){$('workStatus').textContent='Upload a screenshot to begin.';return}const img=new Image();img.onload=()=>{const c=$('workCanvas'),ctx=c.getContext('2d',{willReadFrequently:true});c.width=img.naturalWidth;c.height=img.naturalHeight;ctx.drawImage(img,0,0);workRaw=ctx.getImageData(0,0,c.width,c.height);workCurrent=new ImageData(new Uint8ClampedArray(workRaw.data),workRaw.width,workRaw.height);$('workStatus').textContent=`Loaded ${c.width} × ${c.height} minimap.`};img.src=src}
function drawWork(data){const c=$('workCanvas');c.width=data.width;c.height=data.height;c.getContext('2d').putImageData(data,0,0)}
function extractWorkshop(){if(!workCurrent)return;const result=window.RemnantMinimapExtractor.extract(workCurrent);workCurrent=result.imageData;drawWork(workCurrent);$('workStatus').textContent=`Extracted ${workCurrent.width} × ${workCurrent.height}; ${result.mapCount} map pixels, ${result.greenCount} green exit pixels.`}
function exportData(){const payload=structuredClone(state);payload.schemaVersion=window.RemnantMigrations.currentSchema;payload.exportedAt=new Date().toISOString();const a=document.createElement('a'),blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=`remnant-atlas-data-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
async function importData(){try{const f=$('importFile').files[0];if(!f)return;const incoming=window.RemnantMigrations.migrate(JSON.parse(await f.text()));if(confirm(`Import ${incoming.zones?.length||0} locations and replace current local data?`)){state=incoming;selectedId=state.zones?.[0]?.id||'';persist();showView('world')}}catch(e){alert(e.message||'Invalid atlas JSON.')}finally{$('importFile').value=''}}
init();
