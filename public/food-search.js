export function foodIntent(text,mood='all'){
 const q=text.trim().toLowerCase();const groups=[['local',/^(nasi lemak|nasi|malaysian|malay|local food)$/],['noodles',/^(noodles?|ramen|mee|laksa)$/],['cafe',/^(caf[eé]s?|coffee|kopi)$/],['western',/^(burgers?|pizza|western|comfort food)$/],['dessert',/^(desserts?|ice cream|cake|sweet)$/]];
 for(const [category,pattern] of groups)if(pattern.test(q))return {mood:category,name:'',note:'Searching mapped cuisine categories; individual dishes are not verified.'};
 return {mood,name:text.trim(),note:''};
}
export function locationError(code){return ({1:'Location permission was denied. Allow location in your browser’s site settings, then try again—or enter an area.',2:'Your device could not determine its location. Check location services, or enter an area.',3:'Location lookup timed out. Try again near a window, or enter an area.'})[code]||'Location is unavailable. You can enter an area instead.';}
export class LatestRequest{constructor(){this.controller=null;}start(){this.controller?.abort();this.controller=new AbortController();return this.controller;}cancel(){this.controller?.abort();this.controller=null;}}
