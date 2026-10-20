import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {foodLink,parseFoodReturn,newStop} from '../public/trips/core.js';
import {parseJalanRequest,jalanReturn} from '../public/jalan-bridge.js';
test('combined worker shares the existing Geoapify secret for trip search',async()=>{
 const env={GEOAPIFY_API_KEY:'test-only-secret'};
 const ready=await worker.fetch(new Request('https://example.com/api/trips/config'),env);
 assert.deepEqual(await ready.json(),{search:true});
 const original=globalThis.fetch;
 try{globalThis.fetch=async url=>{assert.equal(new URL(url).searchParams.get('apiKey'),env.GEOAPIFY_API_KEY);return Response.json({results:[{name:'KLCC',formatted:'Kuala Lumpur',lat:3.15,lon:101.71}]});};
 const res=await worker.fetch(new Request('https://example.com/api/trips/places?q=KLCC'),env);
 assert.equal(res.status,200);assert.equal((await res.json()).places[0].name,'KLCC');
 }finally{globalThis.fetch=original;}
});
test('food selection returns to the integrated trip path and validates intent',()=>{
 const intent=foodLink(newStop({name:'KLCC',lat:3.15,lng:101.71}),'trip','day','https://example.com/trips');
 const url=new URL(intent.url);assert.equal(url.origin,'https://example.com');assert.equal(url.pathname,'/');
 const request=parseJalanRequest(url.search);assert.equal(request.url,'https://example.com/trips/');
 const returned=new URL(jalanReturn(request,{name:'Cafe',address:'KL',lat:3.15,lng:101.71}));
 assert.equal(returned.pathname,'/trips/');
 assert.equal(parseFoodReturn(new URLSearchParams(returned.hash.slice(1)).get('food'),intent).name,'Cafe');
});
