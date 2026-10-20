const limits=new Map();
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default {async fetch(request,env){const u=new URL(request.url);if(!u.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(u.pathname==='/api/trips/config')return json({search:!!env.GEOAPIFY_API_KEY});
 if(u.pathname!=='/api/trips/places'||request.method!=='GET')return json({error:'Not found'},404);
 if(!env.GEOAPIFY_API_KEY)return json({error:'Place search is optional. Add a place by name and address, or select a pin on the map.'},503);
 const query=u.searchParams.get('q')?.trim();if(!query||query.length<3||query.length>180)return json({error:'Enter 3–180 characters.'},400);
 const ip=request.headers.get('CF-Connecting-IP')||'local',now=Date.now();let b=limits.get(ip);if(!b||now-b.time>60000){b={time:now,n:0};limits.set(ip,b);}if(++b.n>10)return json({error:'Please wait a minute before searching again.'},429);if(limits.size>2000)for(const [k,v]of limits)if(now-v.time>60000)limits.delete(k);
 try{const url=new URL('https://api.geoapify.com/v1/geocode/search');url.searchParams.set('text',query);url.searchParams.set('format','json');url.searchParams.set('limit','5');url.searchParams.set('apiKey',env.GEOAPIFY_API_KEY);const r=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const data=await r.json();return json({places:(data.results||[]).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>({name:p.name||p.address_line1||query,address:p.formatted||'',lat:p.lat,lng:p.lon}))});}catch{return json({error:'Search is unavailable. You can still add a name, address or map pin.'},502);}
}};
