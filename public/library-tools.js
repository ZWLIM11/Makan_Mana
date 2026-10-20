import {reviewLink} from './core.js';
const validId=id=>typeof id==='string'&&!['__proto__','constructor','prototype'].includes(id)&&/^[-_A-Za-z0-9]{5,200}$/.test(id);
export function shortlistText(places){return 'Makan Mana — food shortlist\n\n'+places.slice(0,3).map((p,i)=>`${i+1}. ${p.name}${p.sample?' (fictional sample)':''}\n${p.address||''}${p.sample?'':'\n'+reviewLink(p)}`).join('\n\n');}
export function parseBackup(text){
 if(typeof text!=='string'||text.length>200000)throw Error('Backup is too large. Choose a Makan Mana JSON backup under 200 KB.');
 let data;try{data=JSON.parse(text);}catch{throw Error('This is not a valid JSON backup.');}
 if(data?.app!=='makan-mana'||data.version!==1||!Array.isArray(data.saved)||data.saved.length>24||data.saved.some(id=>!validId(id)))throw Error('This is not a supported Makan Mana backup.');
 const saved=[...new Set(data.saved)],personal=Object.create(null);
 for(const id of saved){const entry=data.personal?.[id];if(entry!==undefined){if(!entry||typeof entry.note!=='string'||entry.note.length>500||typeof entry.visited!=='boolean')throw Error('A saved note or visit status is invalid.');personal[id]={note:entry.note,visited:entry.visited};}}
 return {saved,personal};
}
export function mergeBackup(saved,personal,backup){
 const ids=[...saved],notes=Object.assign(Object.create(null),personal);let added=0,skipped=0,existing=0;
 for(const id of backup.saved){if(ids.includes(id)){existing++;if(!notes[id]&&backup.personal[id])notes[id]=backup.personal[id];continue;}
  if(ids.filter(x=>x.startsWith('sample-')===id.startsWith('sample-')).length>=12){skipped++;continue;}
  ids.push(id);if(backup.personal[id])notes[id]=backup.personal[id];added++;
 }
 return {saved:ids,personal:notes,added,skipped,existing};
}
export function makeBackup(saved,personal){const notes=Object.create(null);for(const id of saved)if(personal[id])notes[id]={note:String(personal[id].note||'').slice(0,500),visited:!!personal[id].visited};return {app:'makan-mana',version:1,saved:[...saved],personal:notes};}
