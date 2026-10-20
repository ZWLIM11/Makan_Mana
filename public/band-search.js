// Independent, bounded pagination for each 1 km band. No background prefetch.
export class BandSearch {
 constructor(request,onChange=()=>{}) {this.request=request;this.onChange=onChange;this.cache=new Map();this.bands=new Map();this.generation=0;}
 cancel(){this.controller?.abort();this.generation++;for(const band of this.bands.values())band.loading=false;}
 clear(){this.cancel();this.bands.clear();}
 get places(){return [...new Map([...this.bands.values()].flatMap(b=>b.places).map(p=>[p.id,p])).values()];}
 async start(body){
  this.clear();this.controller=new AbortController();this.body={...body};this.center=body.center;this.resolved=!body.area&&!!body.center;
  const generation=this.generation;
  for(let start=body.minDistance||0;start<body.radius;start++)this.bands.set(start,{start,places:[],offset:0,hasMore:true,loading:false,error:'',limitReached:false});
  this.onChange();
  for(const start of this.bands.keys()){
   if(generation!==this.generation)return;
   await this.load(start);
   // An unresolved area must not fall back to a different location for other bands.
   if(!this.resolved){for(const b of this.bands.values())if(!b.error)b.error='Choose a valid area and search again.';this.onChange();break;}
  }
 }
 async load(start){
  const band=this.bands.get(start);if(!band||band.loading||!band.hasMore)return;
  const generation=this.generation,signal=this.controller.signal;
  const body={...this.body,center:this.resolved?this.center:this.body.center,area:this.resolved?'':this.body.area,minDistance:start,radius:start+1,limit:10,offset:band.offset};
  const key=JSON.stringify(body);band.loading=true;band.error='';this.onChange();
  try{
   const cached=this.cache.get(key);const data=cached&&Date.now()-cached.time<300000?cached.data:await this.request(body,signal);
   if(generation!==this.generation)return;
   if(data.message&&!data.center)throw new Error(data.message);
   if(data.center){this.center=data.center;this.resolved=true;}
   this.cache.set(key,{time:cached?.time||Date.now(),data});
   if(cached&&Date.now()-cached.time>=300000)this.cache.set(key,{time:Date.now(),data});
   if(this.cache.size>40)this.cache.delete(this.cache.keys().next().value);
   band.places=[...new Map([...band.places,...data.places].map(p=>[p.id,p])).values()];
   band.offset=data.nextOffset;band.hasMore=!!data.hasMore;band.limitReached=!!data.limitReached;
  }catch(e){if(generation===this.generation&&e.name!=='AbortError')band.error=e.name==='TimeoutError'?'This group took too long. Try again.':e.message;}
  finally{if(generation===this.generation){band.loading=false;this.onChange();}}
 }
}

export function savedMatches(places,personal,status,query){const q=query.trim().toLowerCase();return places.filter(p=>(status==='all'||(status==='visited'?!!personal[p.id]?.visited:!personal[p.id]?.visited))&&p.name.toLowerCase().includes(q));}
