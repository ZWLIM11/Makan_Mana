import {searchGeo,savedGeo} from './geoapify.js';
import {normalize,validSearch} from '../public/core.js';
const fields='id,displayName,formattedAddress,location,types,primaryTypeDisplayName,rating,userRatingCount,priceLevel,currentOpeningHours,googleMapsUri,websiteUri';
const requests=new Map();
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
async function google(path,env,body){const response=await fetch(`https://places.googleapis.com/v1/${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Goog-Api-Key':env.GOOGLE_PLACES_API_KEY,'X-Goog-FieldMask':body?fields.split(',').map(f=>'places.'+f).join(','):fields},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error(response.status===429?'BUSY':'PROVIDER');return response.json();}
export default {async fetch(request,env){const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(url.pathname==='/api/config'&&request.method==='GET')return json({live:!!(env.GEOAPIFY_API_KEY||env.GOOGLE_PLACES_API_KEY),provider:env.GEOAPIFY_API_KEY?'geoapify':'google',mapKey:env.GEOAPIFY_API_KEY?'':env.GOOGLE_MAPS_EMBED_KEY||''});
 if(!['/api/search','/api/saved'].includes(url.pathname))return json({error:'Not found.'},404);
 if(request.method!=='POST')return json({error:'Use POST.'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Request origin is not allowed.'},403);
 if(!env.GEOAPIFY_API_KEY&&!env.GOOGLE_PLACES_API_KEY)return json({error:'Live search is not connected yet. You can explore sample mode for now.',code:'NOT_CONFIGURED'},503);
 const ip=request.headers.get('CF-Connecting-IP')||'local';const now=Date.now();let bucket=requests.get(ip);if(!bucket||now-bucket.start>60000){bucket={start:now,count:0};requests.set(ip,bucket);}if(++bucket.count>8)return json({error:'A few too many searches. Please try again in a minute.'},429);if(requests.size>2000)for(const [key,value] of requests)if(now-value.start>60000)requests.delete(key);
 try{const text=await request.text();if(text.length>3000)return json({error:'Request is too large.'},413);let body;try{body=JSON.parse(text);}catch{return json({error:'Invalid request.'},400);}
 if(url.pathname==='/api/saved'){if(!Array.isArray(body.ids)||body.ids.length>12||body.ids.some(id=>typeof id!=='string'||!/^[-_A-Za-z0-9]{5,200}$/.test(id)))return json({error:'Invalid saved places.'},400);
 if(env.GEOAPIFY_API_KEY)return json(await savedGeo(body.ids,env));
 const settled=await Promise.allSettled(body.ids.map(id=>google('places/'+encodeURIComponent(id),env)));return json({places:settled.filter(r=>r.status==='fulfilled').map(r=>normalize(r.value)),failed:settled.filter(r=>r.status==='rejected').length});}
 if(!validSearch(body))return json({error:'Check your search area and distance.'},400);
 if(body.area!==undefined&&(typeof body.area!=='string'||body.area.length>180))return json({error:'Check your area name.'},400);
 if(env.GEOAPIFY_API_KEY)return json(await searchGeo(body,env));
 const {query,center,mood,radius}=body;let result;const terms={all:'restaurants',local:'Malaysian restaurants',noodles:'noodle restaurants',cafe:'cafes',western:'burgers pizza restaurants',dessert:'dessert shops'};
 if(center&&!query.trim()&&mood==='all'){result=await google('places:searchNearby',env,{includedTypes:['restaurant','cafe','bakery'],maxResultCount:20,rankPreference:'DISTANCE',locationRestriction:{circle:{center:{latitude:center.lat,longitude:center.lng},radius:radius*1000}}});}
 else {result=await google('places:searchText',env,{textQuery:`${terms[mood]} ${query.trim()||(!center?'in Kuala Lumpur':'')}`,pageSize:20,languageCode:'en',...(center?{locationBias:{circle:{center:{latitude:center.lat,longitude:center.lng},radius:radius*1000}}}:{})});}
 return json({places:(result.places||[]).map(normalize).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng))});
 }catch(error){return json({error:error.message==='BUSY'?'The food search provider is busy. Try again shortly.':'Couldn’t reach live food search. Please retry, or explore sample mode.'},502);}
 }};
