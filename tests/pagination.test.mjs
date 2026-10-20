import test from 'node:test';
import assert from 'node:assert/strict';
import {searchGeo,ring} from '../src/geoapify.js';
import {validSearch,filterPlaces,distance} from '../public/core.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const base={query:'',center:{lat:3.1466,lng:101.7113},mood:'all',radius:3};
test('pagination validates offsets and distance bands',()=>{
 for(const offset of [-20,1,1000,Infinity,'20'])assert.equal(validSearch({...base,offset}),false);
 for(const minDistance of [-1,3,4,'1',NaN])assert.equal(validSearch({...base,minDistance}),false);
 assert.equal(validSearch({...base,offset:20,minDistance:1}),true);
});
test('next page uses provider offset; exhaustion stops loading',async()=>{
 const old=globalThis.fetch;let requested;
 globalThis.fetch=async url=>{requested=new URL(url);return Response.json({features:Array.from({length:20},(_,i)=>({properties:{place_id:String(i),name:'Place',lat:base.center.lat,lon:base.center.lng}}))});};
 try{const r=await searchGeo({...base,offset:20},{GEOAPIFY_API_KEY:'test'});assert.equal(requested.searchParams.get('offset'),'20');assert.equal(r.nextOffset,40);assert.equal(r.hasMore,true);globalThis.fetch=async()=>Response.json({features:[]});assert.equal((await searchGeo({...base,offset:40},{GEOAPIFY_API_KEY:'test'})).hasMore,false);}finally{globalThis.fetch=old;}
});
test('farther searches use polygon hole and enforce exact range',async()=>{
 const old=globalThis.fetch;let posted;
 const places=[.5,1.5,2.5,3.5].map((km,i)=>({properties:{place_id:String(i),name:'Place',lat:base.center.lat+km/111.195,lon:base.center.lng}}));
 globalThis.fetch=async(url,options)=>{posted=JSON.parse(options.body);return Response.json({features:places});};
 try{const r=await searchGeo({...base,minDistance:1,offset:20},{GEOAPIFY_API_KEY:'test'});assert.equal(posted.filter.type,'polygon');assert.equal(posted.filter.geometry.coordinates.length,2);assert.equal(posted.offset,20);assert.equal(r.places.length,2);for(const p of r.places)assert.ok(distance(base.center,p)>=1&&distance(base.center,p)<=3);const inner=ring(base.center,1,false);assert.deepEqual(inner[0],inner.at(-1));assert.ok(Math.abs(distance(base.center,{lng:inner[0][0],lat:inner[0][1]})-1)<1e-8);}finally{globalThis.fetch=old;}
});
test('local filtering includes minimum distance and excludes nearer places',()=>{
 const items=[.5,1.5,2.5].map((km,i)=>({id:String(i),name:'Place',lat:base.center.lat+km/111.195,lng:base.center.lng}));
 assert.deepEqual(filterPlaces(items,{center:base.center,radius:3,minDistance:1}).map(p=>p.id),['1','2']);
});
test('client appends unique places, retries failed pages, and caches repeats',async()=>{
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');const fn=source.slice(source.indexOf('async function search(more=false)'),source.indexOf('\nasync function loadSaved'));
 const ctx=vm.createContext({AbortController,Date,Map,console});
 vm.runInContext(`let mode='live',config={live:true},busy=false,hasMore=false,lastSearch=null,nextOffset=0,loadingMore=false,limitReached=false,requestId=0,activeSignal,mood='all',center={lat:3,lng:101},centerSource='device',areaLabel='',places=[],savedCache=[],saved=[],selected=null,error='',calls=0,fail=false;const searchCache=new Map();const nodes={'#radius':{value:'3'},'#search':{value:''},'#area':{value:''},'#min-distance':{value:'0'}};const $=s=>nodes[s],minDistance=()=>Number(nodes['#min-distance'].value),isGeo=()=>true,foodIntent=()=>({name:'',mood:'all'}),toast=()=>{},render=()=>{},notice=m=>error=m,allPlaces=()=>places;const latest={start:()=>({signal:new AbortController().signal})};async function api(path,body){calls++;if(fail)throw new Error('offline');return {places:body.offset?[{id:'b'},{id:'c'}]:[{id:'a'},{id:'b'}],center,hasMore:body.offset===0,nextOffset:body.offset+20};}${fn}`,ctx);
 await vm.runInContext('search()',ctx);assert.equal(vm.runInContext('places.length',ctx),2);
 vm.runInContext('fail=true',ctx);await vm.runInContext('search(true)',ctx);assert.equal(vm.runInContext('places.length',ctx),2);assert.equal(vm.runInContext('nextOffset',ctx),20);
 vm.runInContext('fail=false',ctx);await vm.runInContext('search(true)',ctx);assert.equal(vm.runInContext('places.length',ctx),3);assert.equal(vm.runInContext('hasMore',ctx),false);
 await vm.runInContext('search()',ctx);assert.equal(vm.runInContext('calls',ctx),3);assert.equal(vm.runInContext('places.length',ctx),2);
});
