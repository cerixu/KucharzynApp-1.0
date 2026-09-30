const VERSION="kucharzyna-v5.2-web-recipes";
const STATIC=["./", "./index.html", "./styles.css", "./app.js", "./db.js", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./ingredient-atlas-transparent.webp", "./photo-adana-kebab.webp", "./photo-arancini.webp", "./photo-baklava.webp", "./photo-banh-mi.webp", "./photo-bibimbap.webp", "./photo-bigos.webp", "./photo-bulgogi.webp", "./photo-bun-cha.webp", "./photo-butter-chicken.webp", "./photo-cacio-e-pepe.webp", "./photo-carbonara.webp", "./photo-ceviche.webp", "./photo-char-siu.webp", "./photo-coq-au-vin.webp", "./photo-cr-me-br-l-e.webp", "./photo-dal-tadka.webp", "./photo-falafel.webp", "./photo-feijoada.webp", "./photo-fish-and-chips.webp", "./photo-gazpacho.webp", "./photo-generic.webp", "./photo-goulash.webp", "./photo-guacamole.webp", "./photo-harira.webp", "./photo-hummus.webp", "./photo-jiaozi.webp", "./photo-karaage.webp", "./photo-khao-pad.webp", "./photo-kimchi-jjigae.webp", "./photo-kung-pao-chicken.webp", "./photo-lomo-saltado.webp", "./photo-mapo-tofu.webp", "./photo-massaman-curry.webp", "./photo-menemen.webp", "./photo-miso-shiru.webp", "./photo-mole-poblano.webp", "./photo-moqueca.webp", "./photo-moussaka.webp", "./photo-naan.webp", "./photo-okonomiyaki.webp", "./photo-pad-thai.webp", "./photo-paella-valenciana.webp", "./photo-palak-paneer.webp", "./photo-panzanella.webp", "./photo-pasta-al-pomodoro.webp", "./photo-pasta-alla-puttanesca.webp", "./photo-pasta-e-fagioli.webp", "./photo-pho-ga.webp", "./photo-pierogi-ruskie.webp", "./photo-pizza.webp", "./photo-pulpo-a-la-gallega.webp", "./photo-quiche-lorraine.webp", "./photo-ramen-shoyu.webp", "./photo-ratatouille.webp", "./photo-risotto-alla-milanese.webp", "./photo-shepherd-s-pie.webp", "./photo-spaghetti-alla-carbonara.webp", "./photo-spanakopita.webp", "./photo-sukiyaki.webp", "./photo-tacos-al-pastor.webp", "./photo-tagine-z-kurczakiem-i-cytryna.webp", "./photo-tiramisu.webp", "./photo-tom-kha-gai.webp", "./photo-tomato.webp", "./photo-tortilla-espa-ola.webp", "./photo-tzatziki.webp", "./photo-zurek.webp", "./splash-17-pro-max.png", "./splash-17-pro-max-landscape.png"];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    await Promise.all(STATIC.map(async url=>{
      try{await cache.add(url)}catch(error){console.warn("Kucharzyna cache miss:",url,error)}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const request=event.request;
  event.respondWith((async()=>{
    try{
      const network=await fetch(request);
      if(network && (network.ok||network.type==="opaque")){
        const url=new URL(request.url);
        if(url.origin===location.origin || request.destination==="image"){
          try{const cache=await caches.open(VERSION);await cache.put(request,network.clone())}catch(error){console.warn("Kucharzyna runtime cache skipped",error)}
        }
      }
      return network;
    }catch(error){
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==="navigate"){
        const shell=await caches.match("./index.html");
        if(shell)return shell;
      }
      throw error;
    }
  })());
});
