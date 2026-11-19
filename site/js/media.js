// Decode a day's illustrated layers before showing its card. Other days stay unloaded.
const decodedGiftImages=new WeakMap();
let calendarScrollLock=null;
function prepareGiftMedia(day){
const section=$(DAY_MEDIA[day]);if(!section)return null;
const pending=[];
const prepare=image=>{
const source=image.getAttribute?.('src')||image.src;if(!source||typeof image.decode!=='function'||decodedGiftImages.get(image)===source)return;
pending.push(Promise.resolve().then(()=>image.decode()).then(()=>decodedGiftImages.set(image,source)));
};
section.querySelectorAll('img[data-src]').forEach(image=>{image.src=image.dataset.src;image.removeAttribute('data-src')});
const images=Array.from(section.querySelectorAll('img'));images.forEach(prepare);
const nativeDecode=images.some(image=>typeof image.decode==='function');
const extra=day===7?[MOVIE_ROOT+'couple-holding-v2.webp']:day===9?[ENERGY_BATTERY]:day===10?MATCH_COLORS.map(color=>MATCH_ROOT+'bear-'+color+'.webp'):[];
for(const source of extra){let image=preloadedMedia.get(source);if(!image){image=new Image();image.src=source;preloadedMedia.set(source,image)}
// DOM harnesses without native image decoding can still initialize games synchronously.
if(nativeDecode)prepare(image);
}
if(!pending.length)return null;
return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Images took too long to load')),15000);Promise.all(pending).then(()=>{clearTimeout(timeout);resolve()},error=>{clearTimeout(timeout);reject(error)})});
}
function lockCalendarScroll(){
if(calendarScrollLock)return;
const view=typeof window==='undefined'?null:window;
calendarScrollLock={x:view?.scrollX||0,y:view?.scrollY||0};
document.body.style.setProperty('--calendar-top',-calendarScrollLock.y+'px');
const gutter=view&&document.documentElement?Math.max(0,view.innerWidth-document.documentElement.clientWidth):0;
document.body.style.setProperty('--calendar-gutter',gutter+'px');
document.body.classList.add('gift-scroll-locked');document.documentElement?.classList.add('has-open-gift');
}
function unlockCalendarScroll(){
if(!calendarScrollLock)return;const position=calendarScrollLock;calendarScrollLock=null;
document.body.classList.remove('gift-scroll-locked');document.documentElement?.classList.remove('has-open-gift');
document.body.style.removeProperty?.('--calendar-top');document.body.style.removeProperty?.('--calendar-gutter');
if(typeof window!=='undefined')window.scrollTo(position.x,position.y);
}
