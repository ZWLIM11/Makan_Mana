import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJalanRequest,jalanReturn} from '../public/jalan-bridge.js';
test('trip handoff validates destination and coordinates',()=>{
 const params=new URLSearchParams({jalan:'https://jalan.example/',lat:'3.14',lng:'101.69',trip:'trip1',day:'day1',token:'token1'});
 const req=parseJalanRequest(params.toString());assert.ok(req);
 const url=new URL(jalanReturn(req,{name:'Cafe',address:'KL',lat:3.14,lng:101.69}));
 const data=JSON.parse(new URLSearchParams(url.hash.slice(1)).get('food'));
 assert.equal(data.token,'token1');assert.equal(data.name,'Cafe');assert.equal(url.origin,'https://jalan.example');
 assert.equal(jalanReturn(req,{sample:true,lat:3,lng:101}),null);
 params.set('jalan','javascript:alert(1)');assert.equal(parseJalanRequest(params.toString()),null);
 params.set('jalan','https://jalan.example/');params.set('lat','');assert.equal(parseJalanRequest(params.toString()),null);
});
