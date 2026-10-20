import test from 'node:test';import assert from 'node:assert/strict';
import {makeBackup,parseBackup,mergeBackup,shortlistText} from '../public/library-tools.js';
test('backup round trip preserves notes and status while excluding unrelated data',()=>{
 const data=makeBackup(['geo-place1'],{'geo-place1':{note:'Try the soup 🍜',visited:true},other:{note:'not saved',visited:false}});
 const parsed=parseBackup(JSON.stringify(data));assert.equal(parsed.personal['geo-place1'].note,'Try the soup 🍜');assert.equal(parsed.personal['geo-place1'].visited,true);assert.deepEqual(Object.keys(parsed.personal),['geo-place1']);
});
test('invalid, oversized and unsafe backups are rejected',()=>{
 for(const text of ['not json','x'.repeat(200001),JSON.stringify({app:'other',version:1,saved:[]}),JSON.stringify({app:'makan-mana',version:1,saved:['__proto__']}),JSON.stringify({app:'makan-mana',version:1,saved:['geo-place1'],personal:{'geo-place1':{visited:true,note:'x'.repeat(501)}}})])assert.throws(()=>parseBackup(text));
});
test('merging keeps current notes, restores missing notes and respects capacity',()=>{
 const saved=Array.from({length:12},(_,i)=>'geo-place'+i),personal={'geo-place0':{note:'Keep mine',visited:true}};
 const backup=parseBackup(JSON.stringify({app:'makan-mana',version:1,saved:['geo-place0','geo-place1','geo-newplace','sample-1'],personal:{'geo-place0':{note:'Imported',visited:false},'geo-place1':{note:'Fill missing',visited:false},'sample-1':{note:'Demo',visited:false}}}));
 const merged=mergeBackup(saved,personal,backup);assert.equal(merged.personal['geo-place0'].note,'Keep mine');assert.equal(merged.personal['geo-place1'].note,'Fill missing');assert.equal(merged.added,1);assert.equal(merged.skipped,1);assert.equal(merged.existing,2);assert.equal(saved.length,12);assert.equal(personal['geo-place1'],undefined);
});
test('share includes real venue identity but never notes or device location',()=>{
 const text=shortlistText([{name:'Cafe A',address:'Setapak',sample:false,note:'private secret',lat:3,lng:101},{name:'Demo',address:'Sample address',sample:true}]);assert.match(text,/Cafe A/);assert.match(text,/google.com\/maps\/search/);assert.match(text,/fictional sample/);assert.ok(!text.includes('private secret'));assert.ok(!text.includes('lat'));
});
