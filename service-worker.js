const VERSION="kucharzyna-v3.2.2";
const STATIC=["./", "./index.html", "./styles.css", "./app.js", "./db.js", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./photo-adana-kebab.jpg", "./photo-arancini.jpg", "./photo-baklava.jpg", "./photo-banh-mi.jpg", "./photo-bibimbap.jpg", "./photo-bigos.jpg", "./photo-bulgogi.jpg", "./photo-bun-cha.jpg", "./photo-butter-chicken.jpg", "./photo-cacio-e-pepe.jpg", "./photo-carbonara.jpg", "./photo-ceviche.jpg", "./photo-char-siu.jpg", "./photo-coq-au-vin.jpg", "./photo-cr-me-br-l-e.jpg", "./photo-dal-tadka.jpg", "./photo-falafel.jpg", "./photo-feijoada.jpg", "./photo-fish-and-chips.jpg", "./photo-gazpacho.jpg", "./photo-generic.jpg", "./photo-goulash.jpg", "./photo-guacamole.jpg", "./photo-harira.jpg", "./photo-hummus.jpg", "./photo-jiaozi.jpg", "./photo-karaage.jpg", "./photo-khao-pad.jpg", "./photo-kimchi-jjigae.jpg", "./photo-kung-pao-chicken.jpg", "./photo-lomo-saltado.jpg", "./photo-mapo-tofu.jpg", "./photo-massaman-curry.jpg", "./photo-menemen.jpg", "./photo-miso-shiru.jpg", "./photo-mole-poblano.jpg", "./photo-moqueca.jpg", "./photo-moussaka.jpg", "./photo-naan.jpg", "./photo-okonomiyaki.jpg", "./photo-pad-thai.jpg", "./photo-paella-valenciana.jpg", "./photo-palak-paneer.jpg", "./photo-panzanella.jpg", "./photo-pasta-al-pomodoro.jpg", "./photo-pasta-alla-puttanesca.jpg", "./photo-pasta-e-fagioli.jpg", "./photo-pho-ga.jpg", "./photo-pierogi-ruskie.jpg", "./photo-pizza.jpg", "./photo-pulpo-a-la-gallega.jpg", "./photo-quiche-lorraine.jpg", "./photo-ramen-shoyu.jpg", "./photo-ratatouille.jpg", "./photo-risotto-alla-milanese.jpg", "./photo-shepherd-s-pie.jpg", "./photo-spaghetti-alla-carbonara.jpg", "./photo-spanakopita.jpg", "./photo-sukiyaki.jpg", "./photo-tacos-al-pastor.jpg", "./photo-tagine-z-kurczakiem-i-cytryna.jpg", "./photo-tiramisu.jpg", "./photo-tom-kha-gai.jpg", "./photo-tomato.jpg", "./photo-tortilla-espa-ola.jpg", "./photo-tzatziki.jpg", "./photo-zurek.jpg", "./splash-17-pro-max.png", "./splash-17-pro-max-landscape.png"];

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
