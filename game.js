/* INTERVENTION — Valsane Studio. Prototype tactique de libération d'otages. */
import * as T from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
const $=id=>document.getElementById(id);
const scene=new T.Scene();scene.background=new T.Color('#344548');scene.fog=new T.FogExp2('#344548',.009);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
$('scene').appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xd1e1db,0x2e4140,2.35));
const sunlight=new T.DirectionalLight(0xffdfbe,2.75);sunlight.position.set(-15,32,25);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);
sunlight.shadow.camera.left=-65;sunlight.shadow.camera.right=65;sunlight.shadow.camera.top=58;sunlight.shadow.camera.bottom=-58;sunlight.shadow.normalBias=.045;scene.add(sunlight);
const camera=new T.OrthographicCamera(-25,25,19,-19,.1,190);
let zoom=1,camCenter=new T.Vector3(-13,0,0);const camYaw=-.43;
function cameraUpdate(){
  camera.position.set(camCenter.x+30*Math.sin(camYaw),54,camCenter.z+30*Math.cos(camYaw));
  camera.lookAt(camCenter);camera.updateMatrixWorld();
}
function resize(){
 const s=22*zoom,a=innerWidth/innerHeight;
 camera.left=-s*a;camera.right=s*a;camera.top=s;camera.bottom=-s;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);cameraUpdate();
}
window.addEventListener('resize',resize);resize();
const mat=(color,roughness=.85,metalness=.05)=>new T.MeshStandardMaterial({color,roughness,metalness});
const floorMat=mat('#53615c'),corridorMat=mat('#525d58'),woodMat=mat('#646a5c'),concrete=mat('#9a9a8a'),concreteTop=mat('#b6b7a5'),
 doorMat=mat('#99764f',.6,.26),doorEdge=mat('#5f5648'),metal=mat('#485753',.52,.38),glass=mat('#334647',.4,.3),
 deskMat=mat('#746b5b'),cabinet=mat('#606e67'),shadowMat=mat('#384340'),black=mat('#293333');
const doorRaycast=[],groundTargets=[],unitHit=[],units=[],threats=[],hostages=[],effects=[];
const rooms=[];const sides=[-1,1],centers=[-25.5,-8.5,8.5,25.5];
function mesh(g,m,x=0,y=0,z=0,cast=false,parent=scene){
 const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=cast;a.receiveShadow=true;parent.add(a);return a;
}
function cube(x,y,z,w,h,d,m=concrete,cast=true,parent=scene){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,cast,parent)}
function floor(x,z,w,d,m){const o=mesh(new T.PlaneGeometry(w,d),m,x,.05,z);o.rotation.x=-Math.PI/2;o.receiveShadow=true;groundTargets.push(o);return o}
function line(x,z,w,d,color){const o=mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({color,side:T.DoubleSide}),x,.068,z);o.rotation.x=-Math.PI/2;return o}
// Sol et décor du complexe
cube(0,-.28,0,76,.55,51,concrete,false);
floor(0,0,72,8.6,corridorMat);
for(let x=-34;x<36;x+=4.1)cube(x,.075,0,2,.009,.07,mat('#9d9a82'),false);
for(let x of [-35.2,35.2])cube(x,1.55,0,.31,3.1,9.2,concrete);
for(let z of [-4.6,4.6])for(let i=0;i<4;i++){
 const rX=centers[i];
 // Murs des chambres avec section centrale de porte.
 const wallW=15.55,gap=2.35;
 cube(rX-(wallW+gap)/4,1.55,z,(wallW-gap)/2,3.1,.32,concrete);
 cube(rX+(wallW+gap)/4,1.55,z,(wallW-gap)/2,3.1,.32,concrete);
}
for(let side of sides)for(let i=0;i<4;i++){
 const x=centers[i],z=side*14;
 const room={id:(side<0?'N':'S')+(i+1),x,z,side,i,open:false,revealed:false,hostages:0,door:null,doorMesh:null};
 rooms.push(room);
 floor(x,z,15.35,17.55,(i+side+3)%2?woodMat:floorMat);
 cube(x,1.55,side*23.0,15.75,3.1,.38,concrete);
 cube(x-7.9,1.55,z,.33,3.1,18.4,concrete);
 cube(x+7.9,1.55,z,.33,3.1,18.4,concrete);
 // Intérieurs de bureaux : meubles aux bords, circulation centrale.
 cube(x-4.9,.65,z+side*2.6,3.0,1.15,1.9,deskMat);
 cube(x-4.9,1.26,z+side*2.6,2.8,.10,1.9,concreteTop);
 cube(x+4.9,.93,z-side*4.1,1.25,1.78,3.1,cabinet);
 cube(x+4.9,1.9,z-side*4.1,1.30,.06,3.3,metal);
 cube(x+1,.56,z+side*4.8,2.3,1.1,1.1,deskMat);
 for(let k=-1;k<=1;k++)cube(x+5,1.4,z+side*(k*2.9),.12,1.35,.12,black,false);
 const door=cube(x,1.28,side*4.65,2.25,2.56,.22,doorMat);
 door.userData.room=room;doorRaycast.push(door);
 const frame=cube(x,2.67,side*4.65,2.52,.12,.3,doorEdge);
 cube(x-1.22,1.36,side*4.65,.1,2.62,.32,metal);
 cube(x+1.22,1.36,side*4.65,.1,2.62,.32,metal);
 const handle=cube(x+.85,1.29,side*4.45,.12,.12,.13,concreteTop,false);
 // Identification au sol du bloc et porte orange.
 const stripe=line(x,side*3.25,3,.17,0xb4955b);
 const labelCanvas=document.createElement('canvas');labelCanvas.width=144;labelCanvas.height=56;
 const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#1b2b29dd';ctx.fillRect(0,0,144,56);
 ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e9c58e';ctx.fillText(room.id,72,38);
 const badge=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(labelCanvas),transparent:true,depthWrite:false}));
 badge.position.set(x,3.7,side*4.7);badge.scale.set(2.65,1.04,1);scene.add(badge);
 room.doorMesh=door;room.badge=badge;
}
cube(0,.16,0,76,.20,.21,metal,false);
for(let i=-5;i<=5;i++){const light=mesh(new T.BoxGeometry(2.3,.08,.25),new T.MeshBasicMaterial({color:0xf6e1b2}),i*6.3,3.12,0);const glow=new T.PointLight(0xf0ca9c,1.1,10);glow.position.set(i*6.3,2.85,0);scene.add(glow);}
const unitColors=['#8cb7a4','#8eabbd','#c1ac80','#b2a0c3'].map(c=>mat(c));
const hostileColor=mat('#8f5650'),hostageColor=mat('#d0baa3'),skin=mat('#bea291');
function actor(x,z,color,isEnemy=false,isCivilian=false){
 const group=new T.Group();scene.add(group);group.position.set(x,.07,z);
 const torso=mesh(new T.CylinderGeometry(.31,.36,.86,10),color,0,1.13,0,true,group);
 mesh(new T.SphereGeometry(.23,9,7),skin,0,1.9,0,true,group);
 mesh(new T.BoxGeometry(.58,.33,.4),color,0,.73,0,true,group);
 for(const sign of [-1,1]){
   mesh(new T.BoxGeometry(.24,.62,.28),black,sign*.2,.34,0,true,group);
   const arm=mesh(new T.CylinderGeometry(.12,.11,.58,8),color,sign*.42,1.32,-.13,true,group);
   arm.rotation.x=-.45;
 }
 if(!isCivilian){
   const gun=mesh(new T.BoxGeometry(.12,.13,.54),black,.13,1.23,-.55,true,group);
 }
 const ring=mesh(new T.RingGeometry(.49,.59,28),new T.MeshBasicMaterial({color:isEnemy?0xb95555:0xa5dec3,transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}),0,.07,0,false,group);
 ring.rotation.x=-Math.PI/2;
 return {group,ring,torso};
}
const names=['ALPHA','BRAVO','CHARLIE','DELTA'];
const initial=[[-32,-2],[-30,-1],[-32,1],[-30,2]];
initial.forEach(([x,z],i)=>units.push({id:i,x,z,actor:actor(x,z,unitColors[i]),hp:100,alive:true,selected:i===0,path:[],orders:[],orderIndex:0,active:null,delayLeft:null,reload:0,shots:12,wait:0,following:null,aiming:false}));
const occupants=[
 {room:'N1',enemy:1,hostage:0},{room:'S1',enemy:0,hostage:0},
 {room:'N2',enemy:2,hostage:1},{room:'S2',enemy:1,hostage:0},
 {room:'N3',enemy:1,hostage:0},{room:'S3',enemy:2,hostage:1},
 {room:'N4',enemy:1,hostage:1},{room:'S4',enemy:1,hostage:0}
];
for(const o of occupants){
 const room=rooms.find(r=>r.id===o.room);
 for(let i=0;i<o.enemy;i++){
   const x=room.x+(i===0?-2.2:2.3),z=room.z+room.side*(i===0?2.8:-1.8);
   const a=actor(x,z,hostileColor,true);a.group.visible=false;
   threats.push({x,z,room,actor:a,hp:76,alive:true,cooldown:1+i*.9});
 }
 for(let i=0;i<o.hostage;i++){
   const x=room.x+2,z=room.z-room.side*1.8,a=actor(x,z,hostageColor,false,true);a.group.visible=false;
   hostages.push({x,z,room,actor:a,saved:false,alive:true});
 }
}
let selected=new Set([0]),executing=false,paused=false,ended=false,clock=0,notificationUntil=0;
let cameraDown=null;
function notice(message){$('notification').textContent=message;notificationUntil=clock+5}
function roomOf(x,z){return rooms.find(r=>Math.abs(x-r.x)<7.25&&Math.abs(z-r.z)<8.5)||null}
function doorById(id){return rooms.find(r=>r.id===id)}
function passable(x,z){
 if(Math.abs(x)>35||Math.abs(z)>23)return false;
 if(Math.abs(z)<=4.0)return true;
 const side=Math.sign(z),az=Math.abs(z);
 if(az<6.1){return rooms.some(r=>r.side===side&&r.open&&Math.abs(x-r.x)<1.14)}
 if(az<=22.45)return rooms.some(r=>r.side===side&&Math.abs(x-r.x)<7.15);
 return false;
}
function route(from,to){
 const sx=Math.round(from.x),sz=Math.round(from.z),tx=Math.round(to.x),tz=Math.round(to.z);
 const key=(x,z)=>(z+24)*73+(x+36),size=73*49;
 const q=[{x:sx,z:sz}],prev=new Int32Array(size);prev.fill(-1);
 const seen=new Uint8Array(size);seen[key(sx,sz)]=1;
 let head=0,final=-1;
 while(head<q.length&&head<3200){
  const v=q[head++],id=key(v.x,v.z);
  if(Math.abs(v.x-tx)+Math.abs(v.z-tz)<1.2){final=id;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=v.x+dx,zz=v.z+dz;if(!passable(xx,zz))continue;
   const n=key(xx,zz);if(seen[n])continue;seen[n]=1;prev[n]=id;q.push({x:xx,z:zz});
  }
 }
 if(final<0)return[];
 const nodes=[];let cur=final;
 while(cur!==key(sx,sz)&&cur>=0&&nodes.length<300){
  nodes.push({x:cur%73-36,z:Math.floor(cur/73)-24});cur=prev[cur];
 }
 nodes.reverse();
 // Conserver les courbes simples : limiter aux points décisifs.
 const smoothed=[];
 for(let i=0;i<nodes.length;i++){
  if(!i||i===nodes.length-1){smoothed.push(nodes[i]);continue;}
  const a=nodes[i-1],b=nodes[i],c=nodes[i+1];
  if(b.x-a.x!==c.x-b.x||b.z-a.z!==c.z-b.z)smoothed.push(b);
 }
 if(passable(to.x,to.z))smoothed.push({x:to.x,z:to.z});
 return smoothed;
}
function orderMove(p,point){
 const path=route(p,point);
 if(!path.length){notice('Destination inaccessible : vérifiez les portes fermées');return false}
 p.path=path;p.following=null;return true;
}
function moveTick(p,dt){
 if(!p.path.length)return;
 const next=p.path[0],dx=next.x-p.x,dz=next.z-p.z,len=Math.hypot(dx,dz);
 if(len<.18){p.path.shift();return}
 const step=Math.min(len,3.8*dt);
 p.x+=dx/len*step;p.z+=dz/len*step;
 p.actor.group.rotation.y=Math.atan2(-dx,-dz);
}
function reveal(room){
 room.open=true;room.revealed=true;
 room.doorMesh.rotation.y=room.side*.95;
 room.doorMesh.position.x=room.x+1.1;
 room.doorMesh.material=mat('#52675a',.67,.2);
 for(const t of threats)if(t.room===room&&t.alive)t.actor.group.visible=true;
 for(const h of hostages)if(h.room===room&&h.alive&&!h.saved)h.actor.group.visible=true;
 $('enemies').textContent=threats.filter(t=>t.alive&&t.room.revealed).length+' VISIBLES';
 notice('PORTE '+room.id+' OUVERTE · NOUVELLE PIÈCE DÉCOUVERTE');
}
function canSee(a,b){
 const ar=roomOf(a.x,a.z),br=roomOf(b.x,b.z);
 if(ar&&br&&ar===br)return true;
 if(!ar&&!br)return true;
 const r=ar||br;if(!r||!r.open)return false;
 const t=(r.side*5-a.z)/(b.z-a.z||.0001);
 if(t<=0||t>=1)return false;
 const ix=a.x+(b.x-a.x)*t;
 return Math.abs(ix-r.x)<1.09;
}
function spawnFlash(a,b,enemyHit){
 const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(a.x,1.35,a.z),new T.Vector3(b.x,1.25,b.z)]),
 new T.LineBasicMaterial({color:enemyHit?0xffcb87:0xeb9f78,transparent:true,opacity:.92,depthWrite:false}));
 scene.add(line);effects.push({line,t:.13});
}
function combat(dt){
 for(const u of units)if(u.alive){
  if(u.reload>0){u.reload-=dt;if(u.reload<=0)u.shots=12}
  if(u.shots<=0&&u.reload<=0)u.reload=1.6;
  u.wait-=dt;
  if(u.wait>0||u.reload>0||u.shots<=0)continue;
  let target=null,closest=12.5;
  for(const e of threats)if(e.alive&&e.room.revealed){
   const d=Math.hypot(u.x-e.x,u.z-e.z);
   if(d<closest&&canSee(u,e)){closest=d;target=e}
  }
  if(target){
   u.wait=u.aiming?.44:.56;u.shots--;
   u.actor.group.rotation.y=Math.atan2(-(target.x-u.x),-(target.z-u.z));
   spawnFlash(u,target,true);
   if(Math.random()<.74){
    target.hp-=38;
    if(target.hp<=0){
     target.alive=false;target.actor.group.rotation.x=-Math.PI/2;target.actor.group.position.y=.2;
     target.actor.ring.visible=false;
     notice('MENACE NEUTRALISÉE · '+target.room.id);
    }
   }
  }
 }
 for(const e of threats)if(e.alive&&e.room.revealed){
  e.cooldown-=dt;
  if(e.cooldown>0)continue;
  let target=null,closest=10;
  for(const u of units)if(u.alive){
   const d=Math.hypot(e.x-u.x,e.z-u.z);
   if(d<closest&&canSee(e,u)){closest=d;target=u}
  }
  if(!target)continue;
  e.cooldown=1.4+Math.random()*.65;
  spawnFlash(e,target,false);
  if(Math.random()<.52){
   target.hp=Math.max(0,target.hp-18);
   if(!target.hp){
    target.alive=false;target.actor.group.rotation.z=-.88;
    target.actor.ring.visible=false;selected.delete(target.id);
    notice(names[target.id]+' EST HORS COMBAT');
   }
  }
 }
 for(const h of hostages)if(h.alive&&!h.saved&&h.room.revealed){
  const unsafe=threats.some(e=>e.alive&&e.room===h.room);
  const agent=units.find(u=>u.alive&&roomOf(u.x,u.z)===h.room&&Math.hypot(u.x-h.x,u.z-h.z)<5);
  if(agent&&!unsafe){h.saved=true;h.actor.group.visible=false;notice('OTAGE EXTRAIT DE LA PIÈCE '+h.room.id);}
 }
}
function advanceOrders(dt){
 for(const u of units)if(u.alive){
  if(u.following!==null){
   const lead=units[u.following];
   if(lead?.alive&&Math.hypot(u.x-lead.x,u.z-lead.z)>2.8&&!u.path.length){
    orderMove(u,{x:lead.x+(u.id-lead.id)*.35,z:lead.z+.8});
    u.following=lead.id;
   }
  }
  if(u.active){
   const a=u.active,r=doorById(a.door);
   if(a.phase==='approach'){
    if(u.path.length===0){
     if(Math.hypot(u.x-r.x,u.z-r.side*3.1)>2){
      if(!orderMove(u,{x:r.x+(u.id-1.5)*.28,z:r.side*3.2})){u.active=null;continue}
     }else{reveal(r);a.phase='opened';a.timer=.55;u.aiming=a.type==='aim'}
    }
   }else if(a.phase==='opened'){
    a.timer-=dt;
    if(a.timer<=0){
     if(a.type==='enter'){
      if(orderMove(u,{x:r.x+(u.id-1.5)*.65,z:r.side*10})){a.phase='entering'}
      else{a.phase='done'}
     }else a.phase='done';
    }
   }else if(a.phase==='entering'){if(!u.path.length)a.phase='done'}
   if(a.phase==='done'){
    u.active=null;u.orderIndex++;u.delayLeft=null;
   }
   continue;
  }
  if(!executing)continue;
  const ord=u.orders[u.orderIndex];if(!ord)continue;
  if(u.delayLeft===null)u.delayLeft=ord.delay;
  u.delayLeft-=dt;if(u.delayLeft>0)continue;
  if(ord.type==='follow'){
   if(ord.follow===u.id){u.orderIndex++;u.delayLeft=null;continue}
   u.following=ord.follow;u.orderIndex++;u.delayLeft=null;continue;
  }
  u.following=null;u.active={type:ord.type,door:ord.door,phase:'approach'};
 }
}
function doMove(dt){
 for(const u of units)if(u.alive){moveTick(u,dt);u.actor.group.position.set(u.x,.07,u.z)}
}
function endGame(success){
 if(ended)return;ended=true;executing=false;
 $('endTitle').textContent=success?'OTAGES LIBÉRÉS':'MISSION ÉCHOUÉE';
 $('endBody').textContent=success?'Les trois otages ont été sécurisés. Votre groupe peut procéder à l’extraction.':'L’équipe est hors combat. Il faut revoir l’ordre d’entrée et la répartition des agents.';
 $('endOverlay').hidden=false;
}
function gameTick(dt){
 clock+=dt;doMove(dt);advanceOrders(dt);combat(dt);
 $('saved').textContent=hostages.filter(h=>h.saved).length+' / '+hostages.length;
 $('enemies').textContent=threats.filter(t=>t.alive&&t.room.revealed).length+' VISIBLES';
 $('phase').textContent=executing?'EXÉCUTION':'PRÉPARATION';
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.t-=dt;e.line.material.opacity=Math.max(0,e.t/.13);if(e.t<=0){scene.remove(e.line);e.line.geometry.dispose();e.line.material.dispose();effects.splice(i,1)}}
 if(!ended){
  if(units.every(u=>!u.alive))endGame(false);
  else if(hostages.length&&hostages.every(h=>h.saved))endGame(true);
 }
}
function renderUI(){
 $('agentCards').innerHTML=units.map(u=>{
  const orders=u.orders.slice(u.orderIndex).map(o=>o.type==='follow'?'SUIVRE '+names[o.follow]:(o.type==='aim'?'OUVRIR + VISER ':'OUVRIR + ENTRER ')+o.door+' ('+o.delay+'s)').join(' → ');
  return '<div data-id="'+u.id+'" class="agent-card '+(selected.has(u.id)?'selected ':'')+(!u.alive?'dead':'')+'"><header><strong>'+(u.id+1)+' · '+names[u.id]+'</strong><button class="plus" data-plus="'+u.id+'">+</button></header><div class="sub">PISTOLET · '+u.shots+'/12 · '+Math.round(u.hp)+' PV</div><div class="hp"><i style="width:'+u.hp+'%"></i></div><div class="order">'+(orders||'AUCUN ORDRE')+'</div></div>';
 }).join('');
 $('agentCards').querySelectorAll('[data-id]').forEach(el=>el.onclick=e=>{if(e.target.closest('[data-plus]'))return;selectUnit(Number(el.dataset.id),e.shiftKey)});
 $('agentCards').querySelectorAll('[data-plus]').forEach(el=>el.onclick=e=>{e.stopPropagation();openModal(Number(el.dataset.plus))});
 $('selectLabel').textContent=[...selected].map(i=>names[i]).join(' + ')||'SÉLECTION';
 const summary=[];
 for(const u of units)if(u.orders.length){
  summary.push('<div class="order-line"><span>'+names[u.id]+'</span>'+u.orders.map(o=>(o.type==='follow'?'Suivre '+names[o.follow]:(o.type==='aim'?'Ouvrir + viser ':'Ouvrir + entrer ')+o.door)+' · +'+o.delay+'s').join(' → ')+'</div>');
 }
 $('orderSummary').innerHTML=summary.join('')||'Aucun ordre préparé. Sélectionnez une porte ou cliquez sur +.';
}
function selectUnit(id,multi=false){
 if(!units[id]?.alive)return;
 if(!multi)selected.clear();
 if(multi&&selected.has(id)&&selected.size>1)selected.delete(id);else selected.add(id);
 renderUI();
}
function selectLasso(ids){
 if(!ids.length){notice('Aucun opérateur dans le lasso');return}
 selected=new Set(ids);renderUI();notice(ids.length+' OPÉRATEURS SÉLECTIONNÉS');
}
function openModal(id=null,roomId=null){
 const candidate=id===null?[...selected][0]??0:id;
 $('modalAgent').innerHTML=units.filter(u=>u.alive).map(u=>'<option value="'+u.id+'">'+names[u.id]+'</option>').join('');
 $('modalAgent').value=String(candidate);
 $('modalDoor').innerHTML=rooms.map(r=>'<option value="'+r.id+'">PORTE '+r.id+(r.open?' · OUVERTE':'')+'</option>').join('');
 if(roomId)$('modalDoor').value=roomId;
 $('modalFollow').innerHTML=units.filter(u=>u.id!==candidate&&u.alive).map(u=>'<option value="'+u.id+'">'+names[u.id]+'</option>').join('');
 $('modalAction').value='aim';$('modalDelay').value='0';$('orderTitle').textContent='ORDRE POUR '+names[candidate];
 updateModalFields();$('orderModal').hidden=false;
}
function updateModalFields(){
 const follow=$('modalAction').value==='follow';
 $('doorField').hidden=follow;$('followField').hidden=!follow;
 $('orderTitle').textContent='ORDRE POUR '+names[Number($('modalAgent').value)];
 const id=Number($('modalAgent').value);
 $('modalFollow').innerHTML=units.filter(u=>u.id!==id&&u.alive).map(u=>'<option value="'+u.id+'">'+names[u.id]+'</option>').join('');
}
$('modalAction').onchange=updateModalFields;$('modalAgent').onchange=updateModalFields;
$('closeModal').onclick=()=>{$('orderModal').hidden=true};
$('saveOrder').onclick=()=>{
 const p=units[Number($('modalAgent').value)];
 const type=$('modalAction').value,door=$('modalDoor').value,follow=Number($('modalFollow').value);
 if(type==='follow'&&follow===p.id){notice('Un agent ne peut pas se suivre lui-même');return}
 if(executing){notice('REPASSEZ EN PRÉPARATION POUR PROGRAMMER CET ORDRE');return}
 const delay=Math.max(0,Math.min(30,Number($('modalDelay').value)||0));
 p.orders.push({type,door,follow,delay});
 $('orderModal').hidden=true;renderUI();notice('ORDRE AJOUTÉ À '+names[p.id]);
};
$('resetOrders').onclick=()=>{
 if(executing){notice('Interrompez l’exécution avant de modifier les séquences');return}
 units.forEach(u=>{u.orders=[];u.orderIndex=0;u.delayLeft=null;u.active=null;u.following=null});renderUI();notice('PLAN EFFACÉ');
};
$('execute').onclick=()=>{
  executing=!executing;paused=false;$('pause').textContent='Ⅱ PAUSE';
  $('execute').textContent=executing?'■ REVENIR EN PRÉPARATION':'▶ EXÉCUTER';
  notice(executing?'EXÉCUTION SIMULTANÉE DES ORDRES':'PRÉPARATION · CHOISISSEZ LA PORTE SUIVANTE');renderUI();
};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ REPRENDRE':'Ⅱ PAUSE'};
$('restart').onclick=()=>location.reload();$('playAgain').onclick=()=>location.reload();
$('orderModal').addEventListener('click',e=>{if(e.target===$('orderModal'))$('orderModal').hidden=true});
function unitAt(e){
 const r=renderer.domElement.getBoundingClientRect(),mouse=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 const ray=new T.Raycaster();ray.setFromCamera(mouse,camera);
 const active=units.filter(u=>u.alive);
 const hits=ray.intersectObjects(active.map(u=>u.actor.group),true);
 for(const h of hits){let parent=h.object;while(parent.parent&&parent.parent!==scene)parent=parent.parent;
  const u=active.find(a=>a.actor.group===parent);if(u)return u;
 }
 return null;
}
function targetAt(e,items){
 const r=renderer.domElement.getBoundingClientRect(),mouse=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 const ray=new T.Raycaster();ray.setFromCamera(mouse,camera);return ray.intersectObjects(items,false)[0]||null;
}
const canvas=renderer.domElement;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.button!==2)return;
 cameraDown={id:e.pointerId,x:e.clientX,y:e.clientY,center:camCenter.clone(),lasso:e.shiftKey&&e.button===0,moved:false,button:e.button};
 if(cameraDown.lasso){$('lasso').hidden=false}
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 const d=cameraDown;if(!d||d.id!==e.pointerId)return;
 const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>4)d.moved=true;
 if(d.lasso){
  const o=$('lasso');o.style.left=Math.min(d.x,e.clientX)+'px';o.style.top=Math.min(d.y,e.clientY)+'px';
  o.style.width=Math.abs(dx)+'px';o.style.height=Math.abs(dy)+'px';
 }else if(d.moved){
  const scale=.034*zoom,hor=new T.Vector3(Math.cos(camYaw),0,-Math.sin(camYaw)),ver=new T.Vector3(-Math.sin(camYaw),0,-Math.cos(camYaw));
  camCenter.copy(d.center).addScaledVector(hor,-dx*scale).addScaledVector(ver,dy*scale);
  cameraUpdate();
 }
});
canvas.addEventListener('pointerup',e=>{
 if(!cameraDown||cameraDown.id!==e.pointerId)return;
 const d=cameraDown;cameraDown=null;$('lasso').hidden=true;
 if(d.lasso){
  if(!d.moved){const u=unitAt(e);if(u)selectUnit(u.id,true);return}
  const rect=canvas.getBoundingClientRect(),xmin=Math.min(d.x,e.clientX),xmax=Math.max(d.x,e.clientX),ymin=Math.min(d.y,e.clientY),ymax=Math.max(d.y,e.clientY);
  const matches=units.filter(u=>{
   if(!u.alive)return false;
   const p=new T.Vector3(u.x,1,u.z).project(camera),x=rect.left+(p.x+1)*rect.width/2,y=rect.top+(1-p.y)*rect.height/2;
   return x>=xmin&&x<=xmax&&y>=ymin&&y<=ymax;
  }).map(u=>u.id);selectLasso(matches);return;
 }
 if(d.moved||d.button===2)return;
 const hitDoor=targetAt(e,doorRaycast);
 if(hitDoor&&!hitDoor.object.userData.room.open){openModal([...selected][0]??0,hitDoor.object.userData.room.id);return}
 const unit=unitAt(e);if(unit){selectUnit(unit.id);return}
 const hitGround=targetAt(e,groundTargets);if(!hitGround)return;
 const point=hitGround.point;if(!passable(point.x,point.z)){notice('Zone inaccessible : ouvrez la porte concernée');return}
 const members=units.filter(u=>u.alive&&selected.has(u.id));
 members.forEach((u,i)=>orderMove(u,{x:point.x+(i-(members.length-1)/2)*.72,z:point.z}));
 renderUI();
});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.62,Math.min(1.55,zoom*(e.deltaY>0?1.08:.93)));resize()},{passive:false});
window.addEventListener('keydown',e=>{
 if(e.key>='1'&&e.key<='4')selectUnit(Number(e.key)-1,e.shiftKey);
 if(e.code==='Space'){e.preventDefault();paused=!paused;$('pause').textContent=paused?'▶ REPRENDRE':'Ⅱ PAUSE'}
 if(e.key==='Escape')$('orderModal').hidden=true;
 if(e.key.toLowerCase()==='p')$('execute').click();
});
let last=performance.now(),uiLast=0;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.04,(now-last)/1000);last=now;
 if(!paused&&!ended)gameTick(dt);
 if(now-uiLast>240){renderUI();uiLast=now}
 renderer.render(scene,camera);
}
notice('Sélectionnez un agent et une porte, puis préparez les ordres.');
renderUI();requestAnimationFrame(frame);
