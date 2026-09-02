import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const $=id=>document.getElementById(id);
const viewportEl=$('viewport'), loading=$('loading'), walkBtn=$('walkBtn'), mapBtn=$('mapBtn'), shotBtn=$('shotBtn'), fullBtn=$('fullBtn');
const living=$('living'),industry=$('industry'),talent=$('talent'),transit=$('transit'),research=$('research');
const vLiving=$('vLiving'),vIndustry=$('vIndustry'),vTalent=$('vTalent'),vTransit=$('vTransit'),vResearch=$('vResearch');
const applyBtn=$('applyBtn'),year=$('year'),timeline=$('timeline'),backBtn=$('backBtn'),nextBtn=$('nextBtn'),fiveBtn=$('fiveBtn'),simBtn=$('simBtn'),resetBtn=$('resetBtn');
const mPop=$('mPop'),mFirms=$('mFirms'),mJobs=$('mJobs'),mCommerce=$('mCommerce'),mVacancy=$('mVacancy'),mLink=$('mLink');
const selection=$('selection'),selTitle=$('selTitle'),selText=$('selText'),walkHUD=$('walkHUD'),exitWalk=$('exitWalk'),posText=$('posText'),toastEl=$('toast'),joystick=$('joystick'),stick=$('stick');
const viewport=viewportEl;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xdceaf2); scene.fog=new THREE.Fog(0xdceaf2,180,560);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,1000); camera.position.set(55,48,65); camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; viewport.appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xdff5ff,0x8b9b91,2.0); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1cf,3.0); sun.position.set(-90,140,70); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-180; sun.shadow.camera.right=180; sun.shadow.camera.top=180; sun.shadow.camera.bottom=-180; scene.add(sun);
const ambient=new THREE.AmbientLight(0xffffff,.45);scene.add(ambient);
const city=new THREE.Group();scene.add(city); const roadGroup=new THREE.Group();const buildingGroup=new THREE.Group();const detailGroup=new THREE.Group();const peopleGroup=new THREE.Group();const carGroup=new THREE.Group();city.add(roadGroup,buildingGroup,detailGroup,peopleGroup,carGroup);
const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2(); let selected=null, walkMode=false, simTimer=null;
const params={living:82,industry:84,talent:78,transit:86,research:88,layout:'mixed',year:2026,scenario:'optimal'};
const colors={institution:0x315f8c,company:0x3d79a3,university:0x8a5aa8,research:0x477f72,housing:0xb97856,commercial:0xd0a33e,station:0x3e596e};
const mats={}; for(const k in colors)mats[k]=new THREE.MeshStandardMaterial({color:colors[k],roughness:.55,metalness:.12});
const roadMat=new THREE.MeshStandardMaterial({color:0x59666e,roughness:.92}); const sidewalkMat=new THREE.MeshStandardMaterial({color:0xb9c1c4,roughness:.95}); const glassMat=new THREE.MeshStandardMaterial({color:0x9ed8e8,roughness:.18,metalness:.2,transparent:true,opacity:.72});
function box(w,h,d,mat,x,y,z,parent=detailGroup){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function clear(g){while(g.children.length){const o=g.children.pop();o.traverse(x=>{if(x.geometry)x.geometry.dispose()})}}
function road(x,z,w,d){box(w,.28,d,roadMat,x,.08,z,roadGroup);if(w>d){for(let p=-w/2+5;p<w/2;p+=10)box(3,.015,.16,new THREE.MeshBasicMaterial({color:0xf5f1cf}),x+p,.23,z,roadGroup)}else{for(let p=-d/2+5;p<d/2;p+=10)box(.16,.015,3,new THREE.MeshBasicMaterial({color:0xf5f1cf}),x,.23,z+p,roadGroup)} }
function sidewalk(x,z,w,d){box(w,.22,d,sidewalkMat,x,.27,z,roadGroup)}
function windowGrid(x,z,w,d,h,kind){const mat=kind==='housing'?glassMat:new THREE.MeshStandardMaterial({color:0xbde8f1,roughness:.15,metalness:.05});const cols=Math.max(2,Math.floor(w/3));const rows=Math.max(2,Math.floor(h/3));for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){if((i+j)%5===0&&kind!=='institution')continue;const px=x-w/2+1.3+i*(w-2.6)/(cols-1);const py=1.5+j*(h-3)/(rows-1);box(.8,.85,.06,mat,px,py,z-d/2-.04,detailGroup);box(.8,.85,.06,mat,px,py,z+d/2+.04,detailGroup)}}
function building(x,z,w,d,h,type,name){const m=mats[type]||mats.company;const b=box(w,h,d,m,x,h/2,z,buildingGroup);b.userData={type,name,w,d,h};
  const roof=box(w*.78,.22,d*.78,m,x,h+.15,z,detailGroup); roof.userData={decor:true};
  if(h>8){windowGrid(x,z,w,d,h,type)}
  if(type==='housing'){for(let y=4;y<h;y+=4)for(let s=-1;s<=1;s+=2)box(w*.68,.16,.35,new THREE.MeshStandardMaterial({color:0xede6d9}),x,y,z+s*d*.5,detailGroup)}
  if(type==='institution'){const sign=box(Math.min(w*.65,10),1,.18,new THREE.MeshStandardMaterial({color:0xeaf3f7}),x,h*.42,z-d/2-.12,detailGroup);sign.userData={decor:true};}
  if(type==='commercial'){for(let s=-1;s<=1;s+=2)box(w*.65,.12,.5,new THREE.MeshStandardMaterial({color:0x4d5c67}),x,h*.18,z+s*d*.5,detailGroup)}
  if(type==='research'||type==='university'){for(let y=2;y<h;y+=3.2)box(w*.62,.08,d*.9,new THREE.MeshStandardMaterial({color:0xd9edf0}),x,y,z,detailGroup)}
  return b;
}
function tree(x,z,scale=1){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16*scale,.22*scale,1.4*scale,8),new THREE.MeshStandardMaterial({color:0x765c42}));trunk.position.set(x,.9*scale,z);trunk.castShadow=true;detailGroup.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3*scale,1),new THREE.MeshStandardMaterial({color:0x3d8c62,roughness:.9}));crown.position.set(x,2.4*scale,z);crown.castShadow=true;detailGroup.add(crown)}
function car(x,z,rot=0){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(2.4,.55,1.2),new THREE.MeshStandardMaterial({color:[0x2d6fa8,0xe7a83b,0xd85d55,0x4b5661][Math.floor(Math.random()*4)],roughness:.35,metalness:.25}));body.position.y=.65;body.castShadow=true;g.add(body);const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.35,.5,1.02),new THREE.MeshStandardMaterial({color:0x9fc4d1,roughness:.1,metalness:.2,transparent:true,opacity:.8}));cabin.position.set(-.1,1.05,0);g.add(cabin);for(const xw of [-.78,.78])for(const zw of [-.5,.5]){const wh=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.16,12),new THREE.MeshStandardMaterial({color:0x20262a,roughness:.8}));wh.rotation.z=Math.PI/2;wh.position.set(xw,.42,zw);g.add(wh)}g.position.set(x,.1,z);g.rotation.y=rot;g.userData={speed:.25+Math.random()*.25,axis:Math.abs(Math.sin(rot))>.5?'x':'z'};carGroup.add(g)}
function person(x,z,scale=1){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.22*scale,.65*scale,4,8),new THREE.MeshStandardMaterial({color:0x466d8a}));body.position.y=.72*scale;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.18*scale,12,8),new THREE.MeshStandardMaterial({color:0xe6bd91}));head.position.y=1.25*scale;g.add(head);g.position.set(x,0,z);peopleGroup.add(g)}
function buildCity(){clear(roadGroup);clear(buildingGroup);clear(detailGroup);clear(peopleGroup);clear(carGroup);
  const L=190; const roadGap=params.layout==='linear'?52:42;
  // land and water/green belt
  box(440,.4,440,new THREE.MeshStandardMaterial({color:0xcfe2cf,roughness:1}),0,-.25,0,roadGroup);
  road(0,-95,400,7);road(0,95,400,7);road(-95,0,7,400);road(95,0,7,400);road(0,0,400,8);road(-55,0,7,400);road(55,0,7,400);road(0,-55,400,7);road(0,55,400,7);
  sidewalk(0,-101,400,4);sidewalk(0,101,400,4);sidewalk(-101,0,4,400);sidewalk(101,0,4,400);
  // central plaza / station
  const station=building(0,-8,22,16,10,'station','광역교통 환승센터'); station.userData.landmark=true;
  box(25,.25,18,new THREE.MeshStandardMaterial({color:0xa7c9d8}),0,.42,-8,detailGroup);
  // park
  const park=box(62,.18,42,new THREE.MeshStandardMaterial({color:0x8fc48f}),-75,.05,58,detailGroup); park.userData={type:'park',name:'중앙 녹지축'};
  for(let i=0;i<22;i++)tree(-103+Math.random()*56,38+Math.random()*40,.65+Math.random()*.35);
  const count=Math.floor(18+params.industry*.24); const hBoost=0.55+params.industry/100*.8; const livingBoost=.6+params.living/100*.7;
  const types=['institution','company','research','university','housing','commercial'];
  let idx=0;
  for(let gx=-3;gx<=3;gx++)for(let gz=-3;gz<=3;gz++){if(gx===0&&gz===0)continue;const px=gx*30+(Math.random()*8-4),pz=gz*30+(Math.random()*8-4);let type;
    if(params.layout==='linear')type=(Math.abs(gz)%3===0)?'company':'housing';
    else if(params.layout==='compact')type=idx%4===0?'institution':(idx%3===0?'company':'housing');
    else if(params.layout==='poly')type=(Math.abs(gx)===2||Math.abs(gz)===2)?'company':(idx%3===0?'research':'housing');
    else type=types[idx%types.length];
    if(params.industry>80&&idx<Math.floor(count*.45))type='company';
    if(params.research>82&&idx%7===0)type='research';
    if(params.living>85&&idx%4===0)type='housing';
    const w=type==='housing'?12+Math.random()*7:10+Math.random()*8; const d=type==='housing'?10+Math.random()*7:10+Math.random()*8; let h=(type==='housing'?9+Math.random()*13:10+Math.random()*24)*hBoost;
    if(type==='institution')h=20+params.industry*.16; if(type==='university')h=8+Math.random()*8; if(type==='research')h=12+Math.random()*16;
    building(px,pz,w,d,h,type,({institution:'공공기관',company:'연관기업',research:'연구기관',university:'대학·인재양성센터',housing:'주거단지',commercial:'상업시설'})[type]);
    idx++; if(idx>=count)break;
  }
  // commercial street and public realm
  for(let x=-84;x<=84;x+=12){tree(x,12,.55);tree(x,-12,.55)}
  for(let i=0;i<18;i++){person(-70+Math.random()*140,-65+Math.random()*130,.7+Math.random()*.35)}
  for(let i=0;i<18;i++){const x=(Math.random()>.5?Math.floor(Math.random()*7-3)*30:0),z=x?Math.random()*180-90:Math.floor(Math.random()*7-3)*30;car(x,z,x?0:Math.PI/2)}
  // high-speed rail/expressway visual corridor
  if(params.transit>60){road(0,-135,420,5);road(0,135,420,5);for(let x=-190;x<=190;x+=20){box(1,.35,4,new THREE.MeshStandardMaterial({color:0x4b5357}),x,.55,-135,detailGroup);box(1,.35,4,new THREE.MeshStandardMaterial({color:0x4b5357}),x,.55,135,detailGroup)}}
}
function metrics(){const avg=(params.living+params.industry+params.talent+params.transit+params.research)/5;const y=params.year-2026;const growth=1+y*(.022+avg/10000);const pop=Math.round(42000*growth);const firms=Math.round(310*(1+y*(params.industry*.0008+params.research*.00045)));const jobs=Math.round(18500*(1+y*(params.industry*.0007+params.transit*.00025)));const commerce=Math.min(99,Math.round(55+params.living*.22+params.industry*.16+y*1.2));const vacancy=Math.max(4,Math.round(30-params.living*.16-params.industry*.08+y*(-.25)));const link=Math.min(99,Math.round((params.research*.42+params.talent*.25+params.industry*.18+params.transit*.15)));
  mPop.textContent=pop.toLocaleString();mFirms.textContent=firms.toLocaleString();mJobs.textContent=jobs.toLocaleString();mCommerce.textContent=commerce;mVacancy.textContent=vacancy;mLink.textContent=link;
  const vals=[params.living,params.industry,params.talent,params.transit,params.research];['Living','Industry','Talent','Transit','Research'].forEach((k,i)=>{$('b'+k).textContent=vals[i];$('bar'+k).style.width=vals[i]+'%'});drawChart();
}
function drawChart(){const c=$('chart'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#d8e4eb';ctx.lineWidth=1;for(let y=20;y<h;y+=26){ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(w-8,y);ctx.stroke()}ctx.strokeStyle='#199bd2';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=20;i++){const yy=h-15-(h-30)*(Math.min(1,(i*(.025+(params.industry+params.living)/40000))));const xx=10+(w-20)*i/20;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.stroke()}
function apply(){params.living=+living.value;params.industry=+industry.value;params.talent=+talent.value;params.transit=+transit.value;params.research=+research.value;params.layout=document.querySelector('.seg .active')?.dataset.layout||'mixed';buildCity();metrics();toast('정책 변수를 3D 공간에 적용했습니다.');}
function setScenario(s){params.scenario=s;const presets={optimal:[82,84,78,86,88],industry:[68,96,72,82,92],living:[96,70,75,80,72],talent:[78,78,98,82,96],first:[55,55,45,62,35]};const v=presets[s];[living,industry,talent,transit,research].forEach((el,i)=>el.value=v[i]);updateLabels();apply()}
function updateLabels(){[['living','vLiving'],['industry','vIndustry'],['talent','vTalent'],['transit','vTransit'],['research','vResearch']].forEach(([a,b])=>document.getElementById(b).textContent=document.getElementById(a).value)}
function toast(t){const e=toastEl;e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,1800)}
[living,industry,talent,transit,research].forEach(e=>e.addEventListener('input',updateLabels));document.getElementById('applyBtn').onclick=apply;document.querySelectorAll('.scenario').forEach(b=>b.onclick=()=>{document.querySelectorAll('.scenario').forEach(x=>x.classList.remove('active'));b.classList.add('active');setScenario(b.dataset.scenario)});document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.seg button').forEach(x=>x.classList.remove('active'));b.classList.add('active');params.layout=b.dataset.layout;apply()});
function setYear(y){params.year=Math.max(2026,Math.min(2046,y));year.textContent=params.year;timeline.value=params.year;metrics();buildCity()}
nextBtn.onclick=()=>setYear(params.year+1);backBtn.onclick=()=>setYear(params.year-1);fiveBtn.onclick=()=>setYear(params.year+5);timeline.oninput=()=>setYear(+timeline.value);resetBtn.onclick=()=>{params.year=2026;params.layout='mixed';params.living=82;params.industry=84;params.talent=78;params.transit=86;params.research=88;[living,industry,talent,transit,research].forEach((e,i)=>e.value=[82,84,78,86,88][i]);document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('active',x.dataset.layout==='mixed'));updateLabels();buildCity();metrics()};simBtn.onclick=()=>{clearInterval(simTimer);simTimer=setInterval(()=>{if(params.year>=2046){clearInterval(simTimer);return}setYear(params.year+1)},180)};
viewport.addEventListener('pointerdown',e=>{if(walkMode)return;drag=true;lastX=e.clientX;lastY=e.clientY});let drag=false,lastX=0,lastY=0;viewport.addEventListener('pointermove',e=>{if(!drag||walkMode)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;camera.position.x-=dx*.16;camera.position.z-=dy*.16;camera.lookAt(0,0,0)});addEventListener('pointerup',()=>drag=false);viewport.addEventListener('wheel',e=>{if(walkMode)return;camera.position.multiplyScalar(e.deltaY>0?1.06:.94);camera.position.y=Math.max(20,camera.position.y)});
viewport.addEventListener('pointerup',e=>{if(walkMode)return;mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(buildingGroup.children);if(hits.length){const o=hits[0].object;selected=o;selection.classList.remove('hidden');selTitle.textContent=o.userData.name||'도시 시설';selText.textContent=`유형: ${o.userData.type} · 높이 ${Math.round(o.userData.h)}m · 규모 ${Math.round(o.userData.w)}×${Math.round(o.userData.d)}m`;}}
function enterWalk(){walkMode=true;document.querySelectorAll('.panel,.topbar,.bottom').forEach(e=>e.classList.add('hidden'));walkHUD.classList.remove('hidden');camera.position.set(12,1.8,45);yaw=0;pitch=0;toast('탐방 모드 시작 · 화면 오른쪽을 드래그하세요');}
function exitWalkMode(){walkMode=false;walkHUD.classList.add('hidden');document.querySelectorAll('.panel,.topbar,.bottom').forEach(e=>e.classList.remove('hidden'));camera.position.set(55,48,65);camera.lookAt(0,0,0)}
walkBtn.onclick=enterWalk;mapBtn.onclick=exitWalkMode;exitWalk.onclick=exitWalkMode;shotBtn.onclick=()=>{const a=document.createElement('a');a.download=`UrbanTwin_${params.year}.png`;a.href=renderer.domElement.toDataURL('image/png');a.click()};fullBtn.onclick=()=>document.documentElement.requestFullscreen?.();
let yaw=0,pitch=0,lookStart=null,move={x:0,y:0};const look=document.querySelector('.look-zone');look.addEventListener('pointerdown',e=>{if(!walkMode)return;lookStart={x:e.clientX,y:e.clientY}});look.addEventListener('pointermove',e=>{if(!walkMode||!lookStart)return;const dx=e.clientX-lookStart.x,dy=e.clientY-lookStart.y;lookStart={x:e.clientX,y:e.clientY};yaw-=dx*.004;pitch=Math.max(-1.2,Math.min(1.2,pitch-dy*.003))});look.addEventListener('pointerup',()=>lookStart=null);
const joy=joystick;let joyId=null;joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);moveJoy(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)moveJoy(e)});joy.addEventListener('pointerup',()=>{joyId=null;move.x=move.y=0;stick.style.transform='translate(0,0)'});function moveJoy(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=38,len=Math.hypot(dx,dy);if(len>max){dx*=max/len;dy*=max/len}move.x=dx/max;move.y=-dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`}
const keys={};addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function walkUpdate(dt){let fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);let mx=move.x+(keys.d?1:0)-(keys.a?1:0),my=move.y+(keys.w?1:0)-(keys.s?1:0);const speed=13*dt;camera.position.x+=(fx*my+rx*mx)*speed;camera.position.z+=(fz*my+rz*mx)*speed;camera.position.x=Math.max(-185,Math.min(185,camera.position.x));camera.position.z=Math.max(-185,Math.min(185,camera.position.z));camera.position.y=1.8;const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));camera.lookAt(camera.position.clone().add(dir));posText.textContent=`${camera.position.x.toFixed(0)}, ${camera.position.z.toFixed(0)}`}
function animate(t){requestAnimationFrame(animate);const dt=Math.min(.04,(t-(animate.last||t))/1000);animate.last=t;if(walkMode)walkUpdate(dt);for(const c of carGroup.children){if(c.userData.axis==='x'){c.position.x+=c.userData.speed;if(c.position.x>205)c.position.x=-205}else{c.position.z+=c.userData.speed;if(c.position.z>205)c.position.z=-205}}renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>{loading.remove();buildCity();metrics();animate(0)},400);
