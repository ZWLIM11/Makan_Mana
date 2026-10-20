import test from 'node:test';
import assert from 'node:assert/strict';
import {BandSearch,savedMatches} from '../public/band-search.js';
import {validSearch} from '../public/core.js';
const base={query:'',area:'',center:{lat:3,lng:101},mood:'all',radius:3,minDistance:0};
function page(body){return {places:Array.from({length:10},(_,i)=>({id:`${body.minDistance}-${body.offset+i}`,name:'Cafe'})),center:base.center,nextOffset:body.offset+10,hasMore:true};}
test('balanced discovery loads ten per band with independent cursors and stable centre',async()=>{
 const calls=[];const bands=new BandSearch(async body=>{calls.push(body);return page(body);});await bands.start({...base,area:'Setapak',center:null});
 assert.equal(bands.places.length,30);assert.deepEqual(calls.map(b=>[b.minDistance,b.radius,b.limit,b.offset]),[[0,1,10,0],[1,2,10,0],[2,3,10,0]]);
 assert.equal(calls[0].area,'Setapak');assert.equal(calls[1].area,'');assert.deepEqual(calls[1].center,base.center);
 await bands.load(1);assert.equal(bands.bands.get(1).places.length,20);assert.equal(bands.bands.get(0).places.length,10);assert.equal(bands.bands.get(2).offset,10);assert.equal(calls.at(-1).offset,10);
});
test('band failures retain prior results and retry the same offset without duplicates',async()=>{
 let fail=false;const bands=new BandSearch(async body=>{if(fail)throw Error('Temporary failure');const result=page(body);if(body.offset)result.places[0]={id:`${body.minDistance}-0`};return result;});await bands.start(base);fail=true;await bands.load(2);
 assert.equal(bands.bands.get(2).places.length,10);assert.equal(bands.bands.get(2).offset,10);assert.match(bands.bands.get(2).error,/Temporary/);fail=false;await bands.load(2);assert.equal(bands.bands.get(2).places.length,19);assert.equal(bands.bands.get(0).error,'');
});
test('cached repeated searches make no extra provider requests; exhausted bands stop',async()=>{
 let calls=0;const bands=new BandSearch(async body=>{calls++;return {...page(body),hasMore:false};});await bands.start(base);await bands.start(base);assert.equal(calls,3);await bands.load(0);assert.equal(calls,3);
});
test('new search ignores stale band responses and cancels their signal',async()=>{
 let resolve,oldSignal;const bands=new BandSearch((body,signal)=>{if(body.query==='old'){oldSignal=signal;return new Promise(r=>resolve=r);}return Promise.resolve(page(body));});const first=bands.start({...base,query:'old'});await bands.start({...base,query:'new'});resolve({places:[{id:'stale'}],center:base.center,hasMore:true,nextOffset:10});await first;assert.equal(oldSignal.aborted,true);assert.equal(bands.places.some(p=>p.id==='stale'),false);assert.equal(bands.places.length,30);
});
test('unresolved area never starts remaining bands against a fallback location',async()=>{
 let calls=0;const bands=new BandSearch(async()=>{calls++;return {places:[],message:'Area not found'};});await bands.start({...base,center:null,area:'unknown'});assert.equal(calls,1);assert.equal(bands.resolved,false);assert.match(bands.bands.get(1).error,/valid area/);
});
test('saved status and name filters compose without changing source data',()=>{
 const places=[{id:'a',name:'Kopi Cafe'},{id:'b',name:'Noodle Cafe'},{id:'c',name:'Rice Shop'}],personal={a:{visited:true}};
 assert.deepEqual(savedMatches(places,personal,'visited','CAFE').map(p=>p.id),['a']);assert.deepEqual(savedMatches(places,personal,'wanted','cafe').map(p=>p.id),['b']);assert.equal(savedMatches(places,personal,'all','').length,3);
});
test('ten-result band requests validate radius and offset boundaries',()=>{
 assert.equal(validSearch({...base,radius:2,minDistance:1,limit:10,offset:10}),true);assert.equal(validSearch({...base,radius:4,minDistance:3,limit:10,offset:990}),true);
 for(const limit of [0,100,11,'10'])assert.equal(validSearch({...base,limit}),false);
 assert.equal(validSearch({...base,limit:10,offset:5}),false);assert.equal(validSearch({...base,limit:10,offset:1000}),false);
});
