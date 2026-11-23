(function(){
'use strict';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
const point=(p,d={x:0,y:0,z:0})=>({x:Number.isFinite(p?.x)?p.x:d.x,y:Number.isFinite(p?.y)?p.y:d.y,z:Number.isFinite(p?.z)?p.z:(d.z||0)});
const move=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z||0,b.z||0,t)});
const end=e=>e.tick+e.durationTicks;
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const types=new Set(['site_selected','move','pickup','deposit','place','stage_complete','decision_rejected','stop','decision','proposal','drop','gather_site','communication','source_batch','casing_place','scaffold_ready','casing_stage_complete','casing_complete']);
function normalize(data){
  assert(data?.version===1 && data.kind==='pyramid-replay','不支援這個回放版本。');
  const initial=data.initial;
  assert(initial && Number.isInteger(initial.width)&&initial.width>0&&initial.width<=128 && Number.isInteger(initial.height)&&initial.height>0&&initial.height<=128,'場地尺寸不正確。');
  assert(Array.isArray(initial.actors)&&Array.isArray(initial.stones)&&Array.isArray(data.events),'缺少角色、石料或事件。');
  assert(initial.actors.length<=32 && initial.stones.length<=1400 && data.events.length<=8000,'回放太大，請分段。');
  const actors=initial.actors.map(a=>({...a,...point(a)})),stones=initial.stones.map(s=>({...s,...point(s)}));
  const seenActors=new Set(actors.map(a=>a.id)),seenStones=new Set(stones.map(s=>s.id));
  assert(seenActors.size===actors.length && seenStones.size===stones.length,'角色或石塊識別碼重複。');
  const events=data.events.map((ev,i)=>({ ...ev,seq:ev.seq??i+1,tick:Number(ev.tick),durationTicks:Number(ev.durationTicks??0) })).sort((a,b)=>a.tick-b.tick||a.seq-b.seq);
  for(const e of events){
    if(e.type==='source_batch'){
      assert(Array.isArray(e.stones),'缺少新增石料。');
      for(const stone of e.stones){assert(typeof stone.id==='string'&&!seenStones.has(stone.id)&&seenStones.size<1400,'新增石料識別碼無效或太多。');seenStones.add(stone.id);}
    }
    assert(Number.isFinite(e.tick)&&e.tick>=0&&Number.isFinite(e.durationTicks)&&e.durationTicks>=0,'事件時間不正確。');
    if(e.type==='scaffold_ready'){
      const xyz=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
      assert(Array.isArray(e.walkways)&&e.walkways.length<=800&&e.walkways.every(xyz),'施工通道座標不正確。');
      assert(Array.isArray(e.links)&&e.links.length<=1200&&e.links.every(link=>Array.isArray(link)&&link.length===2&&link.every(xyz)),'施工通道連接不正確。');
    }
    if(e.type==='casing_place'){
      const m=e.mesh;
      assert(m&&Array.isArray(m.vertices)&&m.vertices.length>=4&&m.vertices.length<=32&&m.vertices.every(v=>['x','y','z'].every(k=>Number.isFinite(v[k]))),'外覆石座標無法讀取。');
      assert(Array.isArray(m.faces)&&m.faces.length>0&&m.faces.length<=24&&m.faces.every(f=>Array.isArray(f)&&f.length>=3&&f.length<=12&&f.every(i=>Number.isInteger(i)&&i>=0&&i<m.vertices.length)),'外覆石面無法讀取。');
    }
    if(e.actorId!=null)assert(seenActors.has(e.actorId),'事件角色不存在。');
    if(e.stoneId!=null)assert(seenStones.has(e.stoneId),'事件石塊不存在。');
  }
  const tickMs=Number(data.tickMs);
  assert(tickMs>=40&&tickMs<=5000,'時間倍率資料不正確。');
  return {...data,tickMs,initial:{...initial,actors,stones},events,length:Math.max(1,...events.map(end))};
}
function snapshot(data,t){
  const actors=new Map(data.initial.actors.map(a=>[a.id,{...a,phase:'idle',u:0,dir:1,cargo:null,walk:0}]));
  const stones=new Map(data.initial.stones.map(s=>[s.id,{...s,location:s.location??'source'}]));
  const active=[],events=data.events;
  let site=data.initial.site??null,staging=null,scaffold=null;const sites=[];
  for(const e of events){
    if(e.tick>t)break;
    const a=actors.get(e.actorId),s=stones.get(e.stoneId),p=e.to??e.target??e.position??e.cell;
    if(e.type==='scaffold_ready'){if(end(e)<=t)scaffold={walkways:e.walkways??[],links:e.links??[]};continue;}
    if(e.type==='source_batch'){if(end(e)<=t)for(const stone of e.stones)stones.set(stone.id,{...stone,...point(stone),location:'source'});continue;}
    if(e.type==='site_selected'){site=e.site??p??site;staging=e.staging??null;sites.push({site,staging,siteId:e.siteId,size:e.size??e.site?.size});continue;}
    if(!a)continue;
    if(e.type==='move'){
      const from=point(e.from,a),to=point(p,from),u=e.durationTicks?clamp((t-e.tick)/e.durationTicks):1;
      if(Math.abs(to.x-from.x+to.y-from.y)>.001)a.dir=Math.sign(to.x-from.x+to.y-from.y);
      const strideDistance=Math.abs(to.x-from.x)+Math.abs(to.y-from.y);
      const start=a.walk; a.walk+=strideDistance*u;
      Object.assign(a,move(from,to,u));
      if(u<1){a.phase='move';a.gaitFrom=from;a.gaitTo=to;a.walkway=e.walkway===true;a.u=u;a.stridePhase=start+strideDistance*u;const norm=Math.max(.001,strideDistance);a.axis={x:(to.x-from.x+to.y-from.y)/norm,y:(to.y-from.y-to.x+from.x)/norm};}
      continue;
    }
    const placed=e.type==='deposit'||e.type==='place'||e.type==='drop'||e.type==='casing_place';
    if(s && e.type==='pickup'){
      if(t>=e.tick+e.durationTicks*.5){a.cargo=s.id;s.location='carried';s.actorId=a.id;}
    }
    if(s && placed && t>=e.tick+e.durationTicks*.65){
      Object.assign(s,point(p,s));s.location=e.type==='casing_place'?'casing':e.type==='place'?'placed':(e.type==='drop'?'source':'site');if(e.type==='casing_place')s.mesh=e.mesh;s.actorId=null;if(a.cargo===s.id)a.cargo=null;
    }
    if((e.type==='pickup'||placed) && t<end(e)){
      a.phase=e.type;a.u=clamp((t-e.tick)/e.durationTicks);a.target=point((e.type==='pickup'?(e.stoneFrom??e.from??p):p),s??a);a.actingStone=s?.id;
      const dx=a.target.x-a.x+a.target.y-a.y;if(Math.abs(dx)>.001)a.dir=Math.sign(dx);
    }
  }
  for(const a of actors.values())if(a.phase!=='idle')active.push(a.phase);
  return {actors:[...actors.values()],stones:[...stones.values()],site,staging,sites,scaffold,active};
}
const api={normalize,snapshot};if(typeof module!=="undefined")module.exports=api;if(typeof window!=="undefined")window.PyramidV2State=api;
})();
