export class FoodMap{
 constructor(container,onSelect,onSearch){this.container=container;this.onSelect=onSelect;this.onSearch=onSearch;this.map=null;this.key='';}
 destroy(){this.map?.remove();this.map=null;this.key='';}
 render(places,selected,center){
 if(!window.L){this.container.textContent='Map library could not load. Use the place directions link instead.';return;}
 if(!this.map){this.container.innerHTML='<div class="map-tools"><button class="outline" id="map-search-area" type="button">Search this area ↻</button><span id="map-message">Move the map to explore, then search.</span></div><div id="food-map" aria-label="Interactive restaurant map"></div><div class="real-map-list"></div>';
 this.map=L.map(this.container.querySelector('#food-map'),{scrollWheelZoom:false}).setView([center?.lat||places[0].lat,center?.lng||places[0].lng],15);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',updateWhenIdle:true,keepBuffer:1}).addTo(this.map).on('tileerror',()=>{this.container.querySelector('#map-message').textContent='Some map tiles could not load. Place buttons and directions still work.';});
 this.layer=L.layerGroup().addTo(this.map);this.container.querySelector('#map-search-area').onclick=()=>{const c=this.map.getCenter();this.onSearch({lat:c.lat,lng:((c.lng+180)%360+360)%360-180});};
 }
 const key=places.map(p=>p.id).join('|');this.layer.clearLayers();const list=this.container.querySelector('.real-map-list');list.replaceChildren();
 places.forEach((p,i)=>{const icon=L.divIcon({className:'food-marker '+(p.id===selected?'selected':''),html:`<span>${i+1}</span>`,iconSize:[36,36],iconAnchor:[18,36]});L.marker([p.lat,p.lng],{icon,title:p.name,alt:p.name,keyboard:true}).addTo(this.layer).on('click',()=>this.onSelect(p.id));const button=document.createElement('button');button.textContent=`${i+1}. ${p.name}`;button.setAttribute('aria-pressed',String(p.id===selected));button.onclick=()=>this.onSelect(p.id);list.append(button);});
 if(key!==this.key&&places.length){this.map.fitBounds(places.map(p=>[p.lat,p.lng]),{padding:[35,35],maxZoom:16,animate:false});this.key=key;}
 requestAnimationFrame(()=>this.map?.invalidateSize());
 }
}
