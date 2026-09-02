import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const fmt=n=>Math.round(n).toLocaleString('ko-KR');
const rand=(a,b)=>a+Math.random()*(b-a);

const state={year:2026,layout:'poly',preset:'optimal',tool:null,simulating:false,
 settlement:82,industry:84,talent:78,transport:86,research:88,
 population:42000,firms:310,jobs:18500,vacancy:12,commerce:68,network:81,development:78,
 history:[],selected:null};
const presets={
 optimal:{settlement:82,industry:84,talent:78,transport:86,research:88,layout:'poly'},
 industry:{settlement:68,industry:97,talent:78,transport:88,research:94,layout:'compact'},
 living:{settlement:98,industry:65,talent:68,transport:82,research:70,layout:'poly'},
 talent:{settlement:78,industry:76,talent:98,transport:84,research:96,layout:'linear'},
 first:{settlement:46,industry:42,talent:45,transport:52,research:39,layout:'linear'}
};
const sliderDefs=[['settlement','정주환경','주거·의료·교육·문화'],['industry','산업 클러스터','연관기업·창업·일자리'],['talent','지역인재 공급','대학·교육·채용'],['transport','광역교통','역·도로·환승'],['research','산학연 연계','대학·연구소·공공기관']];

// ---------- Renderer ----------
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x07111f); scene.fog=new THREE.FogExp2(0x07111f,.012);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,1600); camera.position.set(125,120,150);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;$('#app').appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=45;controls.maxDistance=330;controls.maxPolarAngle=Math.PI/2.12;controls.target.set(0,0,0);controls.screenSpacePanning=true;
scene.add(new THREE.HemisphereLight(0x9bc8ff,0x172331,1.8));
const sun=new THREE.DirectionalLight(0xfff2d5,3.0);sun.position.set(-90,180,70);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-220;sun.shadow.camera.right=220;sun.shadow.camera.top=220;sun.shadow.camera.bottom=-220;scene.add(sun);
const fill=new THREE.DirectionalLight(0x6da9ff,1.1);fill.position.set(100,80,-120);scene.add(fill);

const city=new THREE.Group();scene.add(city);const roads=new THREE.Group(),blocks=new THREE.Group(),buildings=new THREE.Group(),green=new THREE.Group(),props=new THREE.Group(),labels=new THREE.Group();city.add(roads,blocks,buildings,green,props,labels);
const buildingData=[];const roadData=[];
const mats={
 ground:new THREE.MeshStandardMaterial({color:0x0b1824,roughness:.95}), asphalt:new THREE.MeshStandardMaterial({color:0x172331,roughness:.82}), line:new THREE.MeshBasicMaterial({color:0x93b6c9}),
 institution:new THREE.MeshStandardMaterial({color:0x2f8bc5,roughness:.5,metalness:.12}), company:new THREE.MeshStandardMaterial({color:0x3eaa8d,roughness:.55}), university:new THREE.MeshStandardMaterial({color:0x8d74d8,roughness:.52}), research:new THREE.MeshStandardMaterial({color:0xd29a43,roughness:.48}), housing:new THREE.MeshStandardMaterial({color:0x6c8ca9,roughness:.65}), commerce:new THREE.MeshStandardMaterial({color:0xc96c73,roughness:.58}), station:new THREE.MeshStandardMaterial({color:0xe8d17b,roughness:.35,metalness:.2}), park:new THREE.MeshStandardMaterial({color:0x2d765c,roughness:1})};
const ground=new THREE.Mesh(new THREE.PlaneGeometry(520,520),mats.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;city.add(ground);
function box(w,h,d,mat,x,y,z,group=buildings,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y+h/2,z);m.castShadow=cast;m.receiveShadow=true;group.add(m);return m}
function cylinder(r,h,mat,x,y,z,group=props){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.86,h,12),mat);m.position.set(x,y+h/2,z);m.castShadow=true;group.add(m);return m}
function road(x,z,w,d){const r=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),mats.asphalt);r.position.set(x,.05,z);r.receiveShadow=true;roads.add(r);roadData.push(r);for(let p=-w/2+5;p<w/2-2;p+=12){const l=new THREE.Mesh(new THREE.BoxGeometry(5,.012,.08),mats.line);l.position.set(x+p,.12,z);roads.add(l)} }
function tree(x,z,s=1){const trunk=cylinder(.35*s,2*s,new THREE.MeshStandardMaterial({color:0x5b4638}),x,0,z,green);const crown=new THREE.Mesh(new THREE.SphereGeometry(1.8*s,9,7),new THREE.MeshStandardMaterial({color:0x34775a,roughness:1}));crown.position.set(x,3*s,z);crown.castShadow=true;green.add(crown)}
function park(x,z,w=16,d=16){const p=new THREE.Mesh(new THREE.BoxGeometry(w,.08,d),mats.park);p.position.set(x,.05,z);p.receiveShadow=true;green.add(p);for(let i=0;i<8;i++)tree(x+rand(-w/2+2,w/2-2),z+rand(-d/2+2,d/2-2),rand(.7,1.1));}
function addRoadNetwork(){while(roads.children.length)roads.remove(roads.children[0]);roadData.length=0;const t=state.transport/100;const spacing=lerp(42,25,t);for(let x=-120;x<=120;x+=spacing)road(x,0,4,250);for(let z=-120;z<=120;z+=spacing)road(0,z,250,4);road(0,0,250,7);}
function clearGroup(g){while(g.children.length)g.remove(g.children[0]);}
function layoutPoint(type,i,total){const angle=i*.618*2*Math.PI;const r=Math.sqrt(i/Math.max(total,1))*115; if(state.layout==='compact')return [Math.cos(angle)*r*.65,Math.sin(angle)*r*.65];if(state.layout==='linear')return [lerp(-120,120,i/(Math.max(total-1,1))),Math.sin(i*.9)*22];if(state.layout==='poly'){const centers=[[ -72,-58],[70,-55],[-60,62],[72,60]];const c=centers[i%4];const j=Math.floor(i/4);const a=j*.9;return [c[0]+Math.cos(a)*Math.min(28,7+j*3),c[1]+Math.sin(a)*Math.min(28,7+j*3)];}const centers=[[0,0],[-92,55],[92,55],[-90,-65],[90,-65]];const c=centers[i%5];return [c[0]+Math.cos(angle)*Math.min(22,5+Math.floor(i/5)*4),c[1]+Math.sin(angle)*Math.min(22,5+Math.floor(i/5)*4)];}
function building(type,i,total,manual=false){const [x,z]=layoutPoint(type,i,total);let h=8,w=8,d=8;const cfg={institution:[14,20,13],company:[9,14,9],university:[17,11,14],research:[12,17,12],housing:[10,11,10],commerce:[8,8,8],station:[23,7,15]}[type]||[8,8,8];[w,h,d]=cfg;const density=1+(state.development/100)*.65;h*=density;const m=box(w,h,d,mats[type],x,0,z);m.userData={type,index:i,manual,name:{institution:'공공기관 본원',company:'연관 기업',university:'지역대학 캠퍼스',research:'산학연 연구소',housing:'정주 주거단지',commerce:'생활·상업시설',station:'광역교통 환승센터'}[type]};
// rooftop
if(type==='housing'||type==='company'||type==='institution'){const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.72,.45,d*.72),new THREE.MeshStandardMaterial({color:0x182d42,roughness:.45}));roof.position.set(x,h+.22,z);roof.castShadow=true;buildings.add(roof)}
if(type==='station'){for(let q=-6;q<=6;q+=4)box(2,1,18,new THREE.MeshStandardMaterial({color:0x9aa8b6,transparent:true,opacity:.5}),x+q,h*.45,z,buildings,false)}
buildingData.push(m);return m;}
function rebuildCity(){clearGroup(buildings);clearGroup(green);clearGroup(props);buildingData.length=0;addRoadNetwork();const counts={institution:Math.round(8+state.industry/18),company:Math.round(30+state.industry*.7),university:Math.round(2+state.talent/28),research:Math.round(4+state.research/18),housing:Math.round(34+state.settlement*.45),commerce:Math.round(12+state.settlement*.22),station:Math.round(1+state.transport/45)};let idx=0;for(const [type,n] of Object.entries(counts)){for(let i=0;i<n;i++)building(type,idx++,n);}
park(-35,-35,27,25);park(45,-35,25,23);park(-42,42,25,22);if(state.settlement>75)park(55,43,28,24);
// street trees
const treeN=Math.round(35+state.settlement*.5);for(let i=0;i<treeN;i++){const a=Math.floor(rand(-5,6))*25+rand(-7,7),b=Math.floor(rand(-5,6))*25+rand(-7,7);tree(a,b,rand(.55,.9));}
// transport hub visual ring
const hub=new THREE.Mesh(new THREE.CylinderGeometry(17,17,.35,48),new THREE.MeshBasicMaterial({color:0x2f9ad0,transparent:true,opacity:.13}));hub.position.y=.2;props.add(hub);for(let a=0;a<8;a++){const ang=a*Math.PI/4;box(1.2,.35,9,new THREE.MeshStandardMaterial({color:0x2b6e93}),Math.cos(ang)*11,.25,Math.sin(ang)*11,props,false)}
}
rebuildCity();

// ---------- UI ----------
function buildSliders(){const wrap=$('#sliders');wrap.innerHTML='';for(const [id,label,desc] of sliderDefs){const d=document.createElement('div');d.className='slider';d.innerHTML=`<div class="slider-head"><span>${label}</span><b id="${id}V">${state[id]}</b></div><input class="range" id="${id}" type="range" min="0" max="100" value="${state[id]}" title="${desc}">`;wrap.appendChild(d);d.querySelector('input').addEventListener('input',e=>{state[id]=+e.target.value;$('#'+id+'V').textContent=state[id];recalculate(false);rebuildCity();updateUI();});}}
buildSliders();
function recalculate(push=true){const s=state.settlement/100,i=state.industry/100,t=state.talent/100,tr=state.transport/100,r=state.research/100;const years=state.year-2026;const synergy=(s*i+t*r+tr*r)/3;state.development=clamp(42+34*s+32*i+27*t+24*tr+29*r+28*synergy+years*.55-80,20,100);state.population=42000+years*(850*s+920*i+430*t+500*tr)+years*years*(8*s*i+5*s*tr);state.firms=310+Math.round(years*(12*i+6*r+3*tr))+Math.round(years*years*.025*i*r);state.jobs=18500+Math.round(years*(720*i+360*r+220*t));state.vacancy=clamp(12+years*(.5*(1-s)+.35*(1-i)-.3*tr)-state.commerce*.03,3,48);state.commerce=clamp(30+35*s+24*i+15*tr+years*(.55*s+.25*i),20,100);state.network=clamp(35+28*tr+27*r+18*i+years*.3,20,100);if(push)state.history.push({year:state.year,pop:state.population,firms:state.firms,jobs:state.jobs});}
function updateUI(){const vals=[['인구',fmt(state.population),'명'],['연관기업',fmt(state.firms),'개'],['일자리',fmt(state.jobs),'개'],['상업 활성도',Math.round(state.commerce),'%'],['공실 위험',Math.round(state.vacancy),'%'],['연계 밀도',Math.round(state.network),'%']];$('#metrics').innerHTML=vals.map(v=>`<div class="metric"><span>${v[0]}</span><strong>${v[1]}</strong><em>${v[2]}</em></div>`).join('');$('#year').textContent=state.year;$('#progress').style.width=((state.year-2026)/20*100)+'%';
const health=[['정주 안정성',state.settlement],['산업 집적',state.industry],['인재 파이프라인',state.talent],['교통 접근성',state.transport],['산학연 연계',state.research],['종합 발전도',state.development]];$('#health').innerHTML=health.map(([n,v])=>`<div class="health-row"><div class="health-head"><span>${n}</span><b>${Math.round(v)}</b></div><div class="bar"><i style="width:${clamp(v)}%"></i></div></div>`).join('');drawChart();}
function drawChart(){const c=$('#chart'),ctx=c.getContext('2d'),r=c.getBoundingClientRect(),d=devicePixelRatio||1;c.width=r.width*d;c.height=r.height*d;ctx.scale(d,d);const w=r.width,h=r.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(150,190,220,.1)';for(let y=15;y<h;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}const hist=state.history.length?state.history:[{year:2026,pop:42000,firms:310}];const max=Math.max(...hist.map(x=>x.pop));ctx.strokeStyle='#6fc8ff';ctx.lineWidth=2;ctx.beginPath();hist.forEach((p,j)=>{const x=8+j/(Math.max(hist.length-1,1))*(w-16),y=h-10-(p.pop/max)*(h-24);j?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();}
function setPreset(name){const p=presets[name];state.preset=name;for(const k of ['settlement','industry','talent','transport','research'])state[k]=p[k];state.layout=p.layout;state.year=2026;state.history=[];$$('.scenario').forEach(x=>x.classList.toggle('active',x.dataset.preset===name));$('#layout').value=state.layout;for(const [id] of sliderDefs){$('#'+id).value=state[id];$('#'+id+'V').textContent=state[id]}recalculate();rebuildCity();updateUI();toast(`${name==='optimal'?'통합 최적형':name==='industry'?'산업 클러스터':name==='living'?'정주환경 중심':name==='talent'?'지역인재 중심':'1차 이전 방식'} 시나리오 적용`)}
$$('.scenario').forEach(b=>b.addEventListener('click',()=>setPreset(b.dataset.preset)));
$$('[data-layout]').forEach(b=>b.addEventListener('click',()=>{state.layout=b.dataset.layout;$$('[data-layout]').forEach(x=>x.classList.toggle('active',x===b));rebuildCity();toast('도시 공간 구조가 변경되었습니다')}));
$$('[data-tool]').forEach(b=>b.addEventListener('click',()=>{state.tool=state.tool===b.dataset.tool?null:b.dataset.tool;$$('[data-tool]').forEach(x=>x.classList.toggle('active',x.dataset.tool===state.tool));renderer.domElement.style.cursor=state.tool?'crosshair':'grab';}));
$('#eraseTool').addEventListener('click',()=>{state.tool=state.tool==='erase'?null:'erase';$$('[data-tool]').forEach(x=>x.classList.remove('active'));renderer.domElement.style.cursor=state.tool?'crosshair':'grab';toast(state.tool?'삭제할 건물을 탭하세요':'지우기 모드 종료')});
function advance(n){if(state.year>=2046)return;state.year=Math.min(2046,state.year+n);recalculate();rebuildCity();updateUI();toast(`${state.year}년으로 이동`)}
$('#plusYear').onclick=()=>advance(1);$('#plus5').onclick=()=>advance(5);$('#minusYear').onclick=()=>{state.year=Math.max(2026,state.year-1);recalculate();rebuildCity();updateUI()};$('#reset').onclick=()=>setPreset('optimal');
$('#run20').onclick=async()=>{if(state.simulating)return;state.simulating=true;for(let y=state.year+1;y<=2046;y++){state.year=y;recalculate();rebuildCity();updateUI();await new Promise(r=>setTimeout(r,90));}state.simulating=false;toast('2046년 장기 시뮬레이션 완료');};
$('#helpBtn').onclick=()=>$('#helpModal').classList.add('show');$('#closeHelp').onclick=()=>$('#helpModal').classList.remove('show');
$('#fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.();
$('#snapshotBtn').onclick=()=>{const a=document.createElement('a');a.download=`UrbanTwin_${state.year}.png`;a.href=renderer.domElement.toDataURL('image/png');a.click();toast('도시 화면을 저장했습니다')};
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove('show'),1800)}

// ---------- Picking / editing ----------
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(buildings.children,true);if(!hits.length)return;let obj=hits[0].object;while(obj.parent&&obj.parent!==buildings)obj=obj.parent;const data=obj.userData;if(state.tool){if(state.tool==='erase'){obj.parent?.remove(obj);const i=buildingData.indexOf(obj);if(i>=0)buildingData.splice(i,1);toast('건물을 제거했습니다');return;}addManual(state.tool,obj.position.x,obj.position.z);return;}selectBuilding(obj,data);});
function addManual(type,x,z){const cfg={institution:[14,20,13],company:[9,14,9],university:[17,11,14],research:[12,17,12],housing:[10,11,10],commerce:[8,8,8],station:[23,7,15]}[type]||[8,8,8];const m=box(cfg[0],cfg[1]*(1+state.development/160),cfg[2],mats[type],x,0,z);m.userData={type,manual:true,name:{institution:'공공기관',company:'연관기업',university:'대학',research:'연구소',housing:'주거',commerce:'상업시설',station:'교통거점'}[type]};buildingData.push(m);state.tool=null;$$('[data-tool]').forEach(x=>x.classList.remove('active'));renderer.domElement.style.cursor='grab';toast('시설을 추가했습니다');}
function selectBuilding(obj,data){const names={institution:'공공기관 본원',company:'연관 기업',university:'지역대학 캠퍼스',research:'산학연 연구소',housing:'정주 주거단지',commerce:'생활·상업시설',station:'광역교통 환승센터'};const effects={institution:'기업 유치의 기준점 · 공공서비스 공급',company:'일자리 증가 · 산업 집적 · 소비 수요',university:'지역인재 공급 · 산학협력 기반',research:'기술사업화 · 공공기관 공동연구',housing:'가족 정착 · 생활권 형성',commerce:'지역 소비 · 공실률 완화',station:'광역 접근성 · 통근/기업 교류 비용 절감'};$('#selection').classList.remove('empty');$('#selection').innerHTML=`<h3>${names[data.type]||data.name||'시설'}</h3><span class="pill">${data.type}</span><p>${effects[data.type]||'도시 공간 내 주요 시설'}</p><p>현재 시나리오에서 연계 가능성 <b>${Math.round(clamp((state.industry+state.transport+state.research)/3))}%</b></p>`;state.selected=obj;}

// ---------- Atmosphere / animation ----------
const stars=new THREE.Group();scene.add(stars);for(let i=0;i<500;i++){const g=new THREE.Mesh(new THREE.SphereGeometry(.12,4,4),new THREE.MeshBasicMaterial({color:0x6f8da8}));g.position.set(rand(-400,400),rand(70,220),rand(-400,400));stars.add(g)}
const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();controls.update();props.children.forEach((o,i)=>{if(i===0)o.rotation.y=t*.08});if(state.selected){state.selected.scale.y=1+Math.sin(t*4)*.04;state.selected.scale.x=1+Math.sin(t*4)*.02;state.selected.scale.z=1+Math.sin(t*4)*.02}renderer.render(scene,camera)}animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);updateUI()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
recalculate();updateUI();setTimeout(()=>{$('#loading').style.opacity=0;setTimeout(()=>$('#loading').remove(),500)},500);
