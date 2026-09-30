const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():"id-"+Date.now()+"-"+Math.random().toString(16).slice(2);
const now=()=>new Date().toISOString();
let state={route:"start",recipes:[],categories:[],shopping:[],settings:{theme:"system",profile:"pro"},history:[],inventory:[],cook:{},pizzaProfiles:[],activePizzaProfileId:null,selectedCat:"Wszystkie",query:"",sort:"recent",googleQuery:""};
const baseCats=["Pizza","Pasta","Sosy","Mięso","Ryby","Owoce morza","Warzywa","Desery","Pieczywo","Zupy","Sałatki","Cocktaile","Prep","Sosy bazowe","Inne"];

const seed=[
{name:"Pizza Napoletana",category:"Pizza",description:"Klasyczne ciasto pizza; dane przykładowe do własnej edycji.",yield:10,yieldUnit:"szt.",prep:20,cook:2,ferment:24,temp:450,tags:["pizza","ciasto"],traditional:true,flag:"🇮🇹",servings:10,ingredients:[["Mąka",1000,"g",100],["Woda",650,"g",65],["Sól",30,"g",3],["Drożdże",2,"g",0.2]],steps:["Wymieszaj mąkę z większością wody.","Dodaj sól i resztę wody, następnie drożdże.","Wyrób do uzyskania gładkiego ciasta.","Fermentuj według własnego procesu i podziel na kulki.","Wypiekaj w bardzo gorącym piecu."],notes:"Przykładowa receptura — dostosuj do własnej mąki i procesu.",source:"Tradycyjna receptura / przykład",sourceUrl:""},
{name:"Carbonara",category:"Pasta",description:"Klasyczna pasta z guanciale, żółtek, pecorino i pieprzu.",yield:4,yieldUnit:"porcja",prep:10,cook:12,ferment:0,temp:0,tags:["pasta","rzym"],traditional:true,flag:"🇮🇹",servings:4,ingredients:[["Spaghetti",400,"g",""],["Guanciale",180,"g",""],["Żółtka",6,"szt.",""],["Pecorino Romano",120,"g",""],["Pieprz czarny",5,"g",""]],steps:["Podsmaż guanciale i zachowaj tłuszcz.","Utrzyj żółtka z pecorino i dużą ilością pieprzu.","Ugotuj makaron al dente, zachowaj wodę.","Połącz makaron poza ogniem, regulując wodą z gotowania.","Dodaj guanciale i podawaj natychmiast."],notes:"Pieprz dopiero na końcu, jeśli taki jest Twój proces.",source:"Tradycyjna receptura / przykład",sourceUrl:""},
{name:"Sos pomidorowy",category:"Sosy bazowe",description:"Prosty sos z pomidorów San Marzano.",yield:2500,yieldUnit:"g",prep:10,cook:30,ferment:0,temp:0,tags:["sos","pomidor"],traditional:true,flag:"🇮🇹",servings:10,ingredients:[["Pomidory San Marzano",2500,"g",""],["Sól",25,"g",""],["Oliwa",40,"ml",""],["Bazylia",20,"g",""]],steps:["Rozgrzej oliwę.","Dodaj pomidory i sól.","Gotuj spokojnie do pożądanej konsystencji.","Dodaj bazylię pod koniec.","Ostudź lub użyj od razu."],notes:"Dane przykładowe; dopasuj sól i redukcję do produktu.",source:"Tradycyjna receptura / przykład",sourceUrl:""}
];

// Lokalne, wygenerowane grafiki. Zero zależności od zewnętrznych serwisów zdjęciowych.
const RECIPE_IMAGES={
  "Carbonara":"./photo-carbonara.webp",
  "Spaghetti alla carbonara":"./photo-carbonara.webp",
  "Pizza Napoletana":"./photo-pizza.webp",
  "Sos pomidorowy":"./photo-tomato.webp",
  "Pierogi ruskie":"./photo-pierogi-ruskie.webp"
};
const DEFAULT_RECIPE_IMAGE="./photo-generic.webp";
function recipeImage(r){
  const local=RECIPE_IMAGES[r?.name];
  if(local) return local;
  if(typeof r?.image==='string' && /^(data:|blob:|https?:)/.test(r.image)) return r.image;
  const c=String(r?.category||'').toLowerCase();
  if(c.includes('pizza')||c.includes('pieczy')) return './photo-pizza.webp';
  if(c.includes('pasta')||c.includes('makaron')) return './photo-carbonara.webp';
  if(c.includes('sos')||c.includes('zup')) return './photo-tomato.webp';
  return DEFAULT_RECIPE_IMAGE;
}
function ingredientGroupsSafe(r){return (r?.sections||[]).flatMap(s=>s.ingredients||[])}
function recipeDescription(r){const d=String(r?.description||'').trim();if(d.length>=105&&!/^Klasyczne danie kuchni/i.test(d))return d;const names=ingredientGroupsSafe(r).slice(0,5).map(i=>i.name).filter(Boolean);const ing=names.length?names.join(', '):'starannie dobrane składniki';const cat=String(r?.category||'').toLowerCase();const process=cat.includes('pasta')||cat.includes('makaron')?'Kluczowe jest zachowanie właściwej konsystencji i wykończenie dania poza zbyt wysoką temperaturą.':cat.includes('pizza')||cat.includes('pieczywo')?'Najwięcej zależy tu od jakości mąki, prowadzenia fermentacji oraz kontroli temperatury podczas wypieku.':cat.includes('sos')?'Liczy się spokojna redukcja, koncentracja smaku i końcowa korekta soli, kwasowości oraz tłuszczu.':cat.includes('deser')?'Warto pilnować temperatury i momentu zakończenia obróbki, ponieważ konsystencja zmienia się także podczas studzenia.':'Receptura jest praktyczną bazą do pracy w kuchni; czasy i intensywność obróbki warto dopasować do konkretnego produktu.';return `${r?.name||'Danie'} to ${r?.traditional?'tradycyjna receptura oparta na charakterystycznych składnikach i technice przygotowania.':'praktyczna receptura do przygotowania w domu lub profesjonalnej kuchni.'} W tej wersji wykorzystujemy ${ing}. ${process}`.replace(/  +/g,' ').trim()}
function photoMarkup(r,cls='global-photo'){const src=recipeImage(r);return `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(r?.name||'Potrawa')}" loading="eager" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'">` }
function normalizeIngredientName(name=""){
 const m={
  "five spice":"chińska mieszanka pięciu przypraw","gochujang":"pasta gochujang","ancho chili":"suszona papryka ancho","achiote":"pasta achiote","mirin":"mirin (japońskie wino ryżowe)","dashi":"bulion dashi","ghee":"masło klarowane","paneer":"ser paneer","doubanjiang":"pasta doubanjiang (fermentowana fasola chili)",
  "galangal":"galangal","dashi":"bulion dashi","mirin":"mirin","hoisin":"sos hoisin","chili":"papryczka chili","wakame":"wodorosty wakame",
  "nori":"arkusz nori","miso":"pasta miso","sos sojowy":"sos sojowy","fish sauce":"sos rybny","pasta tamaryndowa":"pasta tamaryndowa",
  "garam masala":"garam masala","ciasto filo":"ciasto filo","orzeszki":"orzeszki ziemne","skrobia ziemniaczana":"skrobia ziemniaczana"
 };
 return m[name]||name;
}
function detailedSteps(name="", category="", ingredients=[]){
 const I=ingredients.map(x=>x.name).filter(Boolean);
 const has=n=>I.some(x=>x.toLowerCase().includes(n));
 const by={
  "Spaghetti alla carbonara":["Pokrój guanciale w paski i wytop na patelni na średnim ogniu, aż będzie złote i chrupiące.","Utrzyj żółtka z drobno startym Pecorino Romano i świeżo mielonym pieprzem.","Ugotuj spaghetti al dente w dobrze osolonej wodzie. Zachowaj porcję wody z gotowania.","Przełóż makaron na patelnię z guanciale i zdejmij z ognia.","Dodaj masę jajeczno-serową, energicznie mieszaj i stopniowo dodawaj wodę z makaronu, aż sos będzie gładki i kremowy.","Dodaj guanciale, dopraw pieprzem i podawaj natychmiast."],
  "Cacio e pepe":["Ugotuj makaron al dente w osolonej wodzie i zachowaj dużą porcję wody z gotowania.","Podpraż świeżo mielony pieprz na suchej patelni, aż zacznie intensywnie pachnieć.","Wymieszaj starty Pecorino Romano z niewielką ilością ciepłej wody z makaronu, tworząc gęstą pastę.","Przełóż makaron na patelnię z pieprzem i dodaj odrobinę wody z gotowania.","Zdejmij z ognia i wmieszaj pastę serową, energicznie mieszając do uzyskania emulsji.","Podawaj od razu z dodatkowym Pecorino i pieprzem."],
  "Pasta alla puttanesca":["Rozgrzej oliwę i krótko podsmaż czosnek oraz anchois, aż anchois zacznie się rozpadać.","Dodaj kapary i oliwki, następnie pomidory. Gotuj sos na średnim ogniu.","W międzyczasie ugotuj spaghetti al dente.","Dodaj makaron do sosu i podlej niewielką ilością wody z gotowania.","Wymieszaj do połączenia sosu z makaronem i skoryguj sól oraz ostrość.","Podawaj z oliwą i świeżymi ziołami, jeśli są używane."],
  "Pasta al pomodoro":["Rozgrzej oliwę i delikatnie podsmaż czosnek bez mocnego zrumienienia.","Dodaj pomidory i sól. Gotuj spokojnie, aż sos zgęstnieje.","Zblenduj lub przetrzyj sos, jeśli ma być idealnie gładki.","Ugotuj spaghetti al dente i zachowaj trochę wody z gotowania.","Połącz makaron z sosem, dodając odrobinę wody, aby uzyskać połysk i odpowiednią konsystencję.","Wykończ bazylią i oliwą. Podawaj natychmiast."],
  "Risotto alla Milanese":["Podgrzej bulion i utrzymuj go tuż poniżej wrzenia.","Podsmaż ryż na maśle, aż ziarna będą gorące i lekko szkliste.","Dodaj niewielką ilość gorącego bulionu i mieszaj, aż płyn zostanie wchłonięty.","Dodawaj bulion partiami, regularnie mieszając, aż ryż będzie al dente i kremowy.","Rozpuść szafran w odrobinie bulionu i dodaj pod koniec gotowania.","Zdejmij z ognia, wmieszaj masło i Parmigiano. Odstaw na chwilę i podawaj kremowe risotto."],
  "Pho Ga":["Opal cebulę i imbir, aż powierzchnia mocno się przypiecze. Przygotuj anyż i cynamon.","Zalej kurczaka wodą, dodaj opalone warzywa i przyprawy, a następnie gotuj bardzo spokojnie, zbierając szumowiny.","Gotuj do miękkości kurczaka. Wyjmij mięso i oddziel je od kości.","Przecedź bulion i dopraw go solą oraz sosem rybnym do wyraźnego, ale czystego smaku.","Przygotuj makaron ryżowy zgodnie z jego instrukcją.","Do misek włóż makaron i mięso, zalej bardzo gorącym bulionem i podawaj z dodatkami."],
  "Bun Cha":["Połącz wieprzowinę z czosnkiem, sosem rybnym i przyprawami. Uformuj małe kotleciki oraz cienkie plastry mięsa.","Schłodź mięso, aby zachowało kształt podczas grillowania.","Przygotuj słodko-kwaśny sos z sosem rybnym, cukrem i kwaśnym składnikiem oraz dodaj marchew.","Ugotuj makaron ryżowy, przepłucz i odcedź.","Grilluj mięso nad mocnym ogniem, aż będzie dobrze zrumienione i dopieczone.","Podawaj makaron, mięso, sos i świeże dodatki razem."],
  "Banh Mi":["Przygotuj marynatę i zamarynuj mięso. Przygotuj również szybko marynowaną marchew i ogórek.","Usmaż lub upiecz mięso, aż będzie rumiane i soczyste.","Podgrzej bagietki, aby były chrupiące z zewnątrz i miękkie w środku.","Przekrój pieczywo i posmaruj je pasztetem lub przygotowanym sosem.","Dodaj mięso, warzywa i świeżą kolendrę.","Podawaj od razu, aby bagietka pozostała chrupiąca."],
  "Pad Thai":["Namocz makaron ryżowy, aż będzie elastyczny, ale nadal lekko twardy.","Wymieszaj sos z pastą tamaryndową, sosem rybnym i pozostałymi składnikami sosu.","Na bardzo gorącym woku podsmaż tofu i białko, następnie odsuń je na bok.","Dodaj makaron i sos. Szybko mieszaj, aż makaron wchłonie płyn i będzie al dente.","Wbij jajka i energicznie wmieszaj je w makaron.","Dodaj kiełki i orzeszki, krótko podgrzej i podawaj z dodatkami."],
  "Tom Kha Gai":["Podgrzej mleko kokosowe z galangalem, trawą cytrynową i liśćmi kaffiru, nie doprowadzając do gwałtownego wrzenia.","Dodaj kurczaka i gotuj delikatnie do miękkości.","Dodaj pozostałe dodatki i gotuj krótko, aby zachowały strukturę.","Dopraw sosem rybnym i cukrem, jeśli jest potrzebny dla równowagi.","Zdejmij z ognia i dodaj sok z limonki.","Podawaj bardzo gorącą zupę, zachowując świeży, kwaśny aromat limonki."],
  "Butter Chicken":["Zamarynuj kurczaka w jogurcie i przyprawach, następnie odstaw do przegryzienia.","Mocno zrumień kurczaka na patelni lub w piecu. Nie musisz go całkowicie ugotować na tym etapie.","Przygotuj bazę z cebuli, pomidorów i przypraw, aż będzie intensywna i gładka.","Dodaj kurczaka i gotuj w sosie do pełnego ugotowania mięsa.","Dodaj masło i śmietankę, a następnie skoryguj sól, kwasowość i ostrość.","Podawaj z ryżem lub naanem."],
  "Moussaka":["Pokrój bakłażana, posól i odstaw, następnie osusz. Zrumień plastry na patelni lub w piecu.","Przygotuj sos mięsny z cebulą, wołowiną i pomidorami. Gotuj do zagęszczenia.","Przygotuj beszamel z masła, mąki i mleka. Dopraw go delikatnie.","W naczyniu układaj warstwami bakłażana i sos mięsny.","Zalej całość beszamelem i wyrównaj powierzchnię.","Piecz do mocnego zrumienienia. Odstaw przed porcjowaniem, aby warstwy się ustabilizowały."],
  "Tzatziki":["Zetrzyj ogórka i bardzo dokładnie odciśnij nadmiar wody.","Wymieszaj jogurt z ogórkiem, czosnkiem i koperkiem.","Dodaj oliwę i sok z cytryny.","Dopraw solą i sprawdź równowagę kwasowości.","Schłodź przed podaniem, aby smaki się połączyły.","Podawaj jako sos lub dip."],
  "Baklava":["Przygotuj nadzienie z posiekanych orzechów i przypraw.","Rozłóż pierwsze arkusze ciasta filo, smarując każdy cienką warstwą roztopionego masła.","Dodawaj warstwy orzechów i filo, aż wykorzystasz przygotowane składniki.","Pokrój baklavę przed pieczeniem na porcje.","Piecz do głębokiego, złotego koloru i chrupkości.","Zalej gorącą baklavę przygotowanym syropem z miodu/cukru i cytryny. Ostudź przed podaniem."],
  "Menemen":["Podsmaż cebulę i paprykę na maśle, aż zmiękną.","Dodaj pomidory i gotuj, aż odparuje część wody.","Dopraw chili i solą.","Wbij jajka i mieszaj delikatnie, zachowując duże, miękkie fragmenty jajka.","Zdejmij z ognia, gdy jajka są jeszcze lekko kremowe.","Podawaj natychmiast z pieczywem."],
  "Adana Kebab":["Wymieszaj mięso z tłuszczem, papryką, chili i solą.","Wyrabiaj masę, aż stanie się kleista i jednolita.","Schłodź mięso, aby łatwiej było je formować.","Uformuj mięso na szerokich szpikulcach lub w długie podłużne kebaby.","Grilluj nad mocnym ogniem, obracając, aż powierzchnia będzie mocno zrumieniona, a środek dopieczony.","Podawaj od razu z pieczywem i świeżymi dodatkami."],
 };
 if(by[name])return by[name];
 const prep=category==="Desery"?"Przygotuj bazę i odważ wszystkie składniki przed rozpoczęciem pracy.":category==="Zupy"?"Przygotuj aromatyczną bazę, następnie dodaj składniki według czasu ich gotowania.":category==="Mięso"?"Przygotuj i dopraw mięso. Doprowadź je do temperatury pokojowej przed obróbką.":"Przygotuj i odważ wszystkie składniki. Przygotowanie mise en place ułatwi pracę.";
 return [prep,`Rozgrzej odpowiednie naczynie lub piec i rozpocznij obróbkę składników wymagających najdłuższego czasu.`,`Dodawaj kolejne składniki zgodnie z ich strukturą i czasem obróbki. ${I.slice(0,3).join(", ")}.`,`Doprowadź danie do właściwej konsystencji, temperatury i stopnia ugotowania.`,`Dopraw i skoryguj równowagę smaku przed podaniem.`,`Podawaj zgodnie z charakterem dania i wykorzystaj pozostałe dodatki jako wykończenie.`];
}
async function ensureRecipeImages(){
  // Obrazy są lokalne i są częścią paczki PWA. Nie wykonujemy już fetch() do Openverse/Wikimedia.
  let changed=false;
  for(const r of state.recipes){
    const local=RECIPE_IMAGES[r.name];
    if(local && (!r.image || /^https?:/i.test(String(r.image)))){ r.image=local; r.imageUrl=''; r.imageCredit='Grafika wygenerowana dla Kucharzyny'; r.imageSource='local'; changed=true; }
    else if(!r.image){ r.image=DEFAULT_RECIPE_IMAGE; r.imageUrl=''; r.imageCredit='Grafika wygenerowana dla Kucharzyny'; r.imageSource='local'; changed=true; }
    if(changed) await put('recipes',r);
  }
  if(changed) state.recipes=await getAll('recipes');
}
function imageMarkup(r, cls='recipe20-hero'){
  const src=recipeImage(r);
  if(src) return `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(r.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(RECIPE_IMAGES[r.name]||'')}';this.classList.add('image-failed')">`;
  return `<div class="${cls} image-placeholder" aria-label="Brak zdjęcia">🍽️<span>Zdjęcie potrawy</span></div>`;
}
function normalizeRecipes(){
 state.recipes=state.recipes.map(r=>{
  if(!Array.isArray(r.sections)||!r.sections.length){
   const legacy=Array.isArray(r.ingredients)?r.ingredients:[];
   r.sections=[{id:uid(),name:"Główna",ingredients:legacy.map(a=>Array.isArray(a)?{id:uid(),name:a[0],qty:+a[1]||0,unit:a[2]||"g",percent:a[3]??""}:({...a,id:a.id||uid()}))}];
   delete r.ingredients;
  }
  r.sections=r.sections.map(s=>({id:s.id||uid(),name:s.name||"Główna",ingredients:(s.ingredients||[]).map(i=>({id:i.id||uid(),name:normalizeIngredientName(i.name||""),qty:+i.qty||0,unit:i.unit||"g",percent:i.percent??"",price:i.price||"",packQty:i.packQty||"",packUnit:i.packUnit||i.unit||"g"}))}));
  r.steps=(Array.isArray(r.steps)?r.steps:[]).map((s)=>typeof s==="string"?{id:uid(),text:s}:{id:s.id||uid(),text:s.text||""}).filter(s=>s.text.trim());
  const generic=r.steps.length<=3&&r.steps.every(s=>/Przygotuj i odmierz|Wykonaj kolejne etapy|Dopraw do równowagi/i.test(s.text));
  if(r.traditional&&(generic||!r.steps.length))r.steps=detailedSteps(r.name,r.category,r.sections.flatMap(s=>s.ingredients));
  r.taste=r.taste||{sweet:1,sour:1,salty:3,umami:3,bitter:0,spicy:0};
  return r;
 });
}

async function init(){
 state.recipes=await getAll("recipes"); state.categories=await getAll("categories"); state.shopping=await getAll("shoppingItems"); state.history=await getAll("history"); state.pizzaProfiles=await getAll("pizzaProfiles"); state.inventory=await getAll("inventoryItems");
 const sets=await getAll("settings"); state.settings=sets[0]||state.settings;
 state.cook=Object.fromEntries((await getAll("cookState")).map(x=>[x.id,x]));
 if(!state.categories.length){for(const name of baseCats)await put("categories",{id:uid(),name});state.categories=await getAll("categories")}
 if(!state.recipes.length){for(const x of seed){const r=makeRecipe(x);await put("recipes",r)}state.recipes=await getAll("recipes")}
 applyTheme(); k39BindSystemTheme(); setupSW();
}
function makeRecipe(x){const r={id:uid(),createdAt:now(),updatedAt:now(),favorite:false,lastUsedAt:null,sections:[{id:uid(),name:"Główna",ingredients:x.ingredients.map(a=>({id:uid(),name:a[0],qty:a[1],unit:a[2],percent:a[3]??"",price:"",packQty:"",packUnit:a[2]}))}],steps:x.steps.map((text,i)=>({id:uid(),text})),...x};delete r.ingredients;return r}
function resolvedTheme(){const t=state.settings.theme;return t==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t}
function applyTheme(){const root=document.documentElement;const t=resolvedTheme();root.classList.toggle("dark",t==="dark");root.classList.toggle("light",t==="light");root.dataset.theme=t;root.dataset.themePreference=state.settings.theme;document.body.classList.toggle("amateur",state.settings.profile==="amateur");document.body.dataset.profile=state.settings.profile;document.querySelector("#themeBtn")?.setAttribute("aria-label",`Motyw: ${state.settings.theme}`);document.querySelector("#theme")?.setAttribute("aria-label",`Motyw: ${state.settings.theme}`)}
let __k39ThemeMedia=null;let __k39ThemeHandler=null;function k39BindSystemTheme(){if(!window.matchMedia)return;if(!__k39ThemeMedia)__k39ThemeMedia=window.matchMedia("(prefers-color-scheme: dark)");if(!__k39ThemeHandler)__k39ThemeHandler=()=>{if(state.settings.theme==="system")applyTheme()};try{__k39ThemeMedia.removeEventListener("change",__k39ThemeHandler)}catch(e){};try{__k39ThemeMedia.addEventListener("change",__k39ThemeHandler)}catch(e){try{__k39ThemeMedia.addListener(__k39ThemeHandler)}catch(_){}}}
function setupSW(){if(!("serviceWorker" in navigator))return;navigator.serviceWorker.register("./service-worker.js").then(reg=>{reg.addEventListener("updatefound",()=>{const w=reg.installing;if(w)w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)toast("Nowa wersja Kucharzyny jest dostępna — Odśwież",true)})})}).catch(()=>{})}
function toast(msg,action=false){const t=$("#toast");t.textContent=action?msg+"  → Odśwież":msg;t.classList.add("show");if(action)t.onclick=()=>location.reload();setTimeout(()=>t.classList.remove("show"),3500)}
function nav(route){state.route=route;render();$(".main-scroll").scrollTop=0}
function saveSetting(){put("settings",{id:"settings",...state.settings})}
function fmt(n){return Number.isInteger(Number(n))?String(n):Number(n).toFixed(2).replace(/\.?0+$/,"")}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
const K39_TRADITIONAL_POLISH=new Set([
  "Pierogi ruskie","Kotlet schabowy","Placki ziemniaczane","Gołąbki z mięsem i ryżem","Kopytka","Barszcz czerwony","Bigos","Żurek","Biały barszcz","Kotlet mielony","Flaki po warszawsku","Krupnik","Kluski śląskie","Pyzy z mięsem","Sernik","Makowiec","Golonka po polsku"
]);
const K39_REGIONAL_POLISH={
  "Kluski śląskie":"Śląsk",
  "Pyzy z mięsem":"Wielkopolska",
  "Flaki po warszawsku":"Mazowsze",
  "Rogal świętomarciński":"Wielkopolska",
  "Kaczka z jabłkami":"Wielkopolska"
};
function k39PolishMetadata(r){const name=String(r?.name||'');if(String(r?.cuisine||'').toLowerCase()!=="polska")return r;const region=K39_REGIONAL_POLISH[name]||r.region||"";const traditional=K39_TRADITIONAL_POLISH.has(name);return {...r,traditional,regional:!!region,region};}
function k39RecipeMeta(r){const x=k39PolishMetadata(r);return `${x.regional?`<span class="v3-regional">REGIONALNE · ${escapeHtml(x.region)}</span>`:''}${x.traditional?'<span class="v3-gold">★ Tradycyjna</span>':''}`;}
function recipeCard(r){const src=recipeImage(r);return `<article class="card recipe-card" data-open="${r.id}"><div class="recipe-thumb">${src?`<img src="${escapeHtml(src)}" loading="lazy" decoding="async" alt="${escapeHtml(r.name)}" onerror="this.remove();this.parentElement.classList.add('image-missing');if(!this.parentElement.querySelector('.img-fallback'))this.parentElement.insertAdjacentHTML('beforeend','<span class=\"img-fallback\" aria-hidden=\"true\">🍽️</span>')">`:'<span class="img-fallback" aria-hidden="true">🍽️</span>'}</div><div class="grow"><div class="row between"><h3>${escapeHtml(r.name)} ${r.traditional?`<span class="star">★</span>`:""} ${r.flag||""}</h3><button class="icon-btn small fav" data-fav="${r.id}" aria-label="Ulubione">${r.favorite?"★":"☆"}</button></div><div class="recipe-meta">${escapeHtml(r.category||"Inne")} · ${r.yield?fmt(r.yield)+" "+escapeHtml(r.yieldUnit||""):""} ${r.lastUsedAt?"· ostatnio używana":""}</div></div></article>`}
function render(){
 $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.route===state.route));
 const views={start:viewStart,recipes:viewRecipes,calculators:viewCalculators,shopping:viewShopping,settings:viewSettings};
 $("#main").innerHTML=(views[state.route]||viewStart)();
 bind();
}
function viewStart(){const recent=[...state.recipes].filter(r=>r.lastUsedAt).sort((a,b)=>b.lastUsedAt.localeCompare(a.lastUsedAt)).slice(0,4);const fav=state.recipes.filter(r=>r.favorite).slice(0,4);
return `<section class="hero"><div class="kicker">DOBRY WIECZÓR, KUCHARZU</div><h1>No elo, Kucharzyno 👨‍🍳</h1><p>Twoje centrum pracy z recepturami: planowanie, przeliczanie, gotowanie krok po kroku, zakupy i narzędzia dla kuchni. Dane zostają na urządzeniu, a receptury możesz rozwijać po swojemu.</p></section>
<section class="section"><h2>Szybkie akcje</h2><div class="grid">
${[["＋","Nowa receptura","new"],["▤","Moje receptury","recipes"],["↺","Ostatnio używane","recent"],["★","Ulubione","fav"],["∑","Kalkulatory","calculators"],["✓","Lista zakupów","shopping"],["⚙","Ustawienia","settings"]].map(x=>`<button class="action-card" data-action="${x[2]}"><span>${x[0]}</span><b>${x[1]}</b></button>`).join("")}</div></section>
${recent.length?`<section class="section"><div class="row between"><h2>Ostatnio używane</h2><button class="btn small ghost" data-route2="recipes">Wszystkie</button></div>${recent.map(recipeCard).join("")}</section>`:""}
${fav.length?`<section class="section"><h2>Ulubione</h2>${fav.map(recipeCard).join("")}</section>`:""}`}

function viewRecipes(){let rs=[...state.recipes];if(state.query)rs=rs.filter(r=>(r.name+" "+r.description+" "+r.tags.join(" ")).toLowerCase().includes(state.query.toLowerCase()));if(state.selectedCat!=="Wszystkie")rs=rs.filter(r=>r.category===state.selectedCat);if(state.sort==="name")rs.sort((a,b)=>a.name.localeCompare(b.name));else if(state.sort==="fav")rs.sort((a,b)=>Number(b.favorite)-Number(a.favorite));else rs.sort((a,b)=>(b.lastUsedAt||b.updatedAt).localeCompare(a.lastUsedAt||a.updatedAt));
return `<div class="row between"><div><div class="kicker">BAZA KUCHNI</div><h1>Receptury</h1></div><button class="btn primary" data-action="new">＋ Nowa</button></div>
<input class="search" id="recipeSearch" placeholder="Szukaj receptury…" value="${escapeHtml(state.query)}">
<div class="chips">${["Wszystkie",...state.categories.map(c=>c.name)].map(c=>`<button class="chip ${state.selectedCat===c?"active":""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}</div>
<div class="row" style="margin:10px 0 15px"><select id="sort" class="grow"><option value="recent" ${state.sort==="recent"?"selected":""}>Ostatnio zmienione/używane</option><option value="name" ${state.sort==="name"?"selected":""}>Nazwa A–Z</option><option value="fav" ${state.sort==="fav"?"selected":""}>Ulubione</option></select><button class="btn" data-action="import">Importuj</button></div>
${rs.length?rs.map(recipeCard).join(""):`<div class="empty">Brak receptur dla tego filtra.</div>`}`}

function viewRecipe(id){
 const r=state.recipes.find(x=>x.id===id); if(!r)return viewRecipes();
 const totalIng=r.sections.reduce((n,s)=>n+s.ingredients.length,0);
 const totalSteps=r.steps.length;
 const tags=(r.tags||[]).map(t=>`<span class="chip">${escapeHtml(t)}</span>`).join("");
 return `<div class="row between">
   <button class="btn" data-back>‹ Receptury</button>
   <button class="btn" data-fav="${r.id}">${r.favorite?"★ Ulubiona":"☆ Ulubiona"}</button>
 </div>
 <section class="hero" style="margin-top:12px">
   <div class="kicker">${escapeHtml(r.category||"Inne")} ${r.flag||""} ${r.traditional?`<span class="star">★ TRADYCYJNA</span>`:""}</div>
   <h1>${escapeHtml(r.name)}</h1>
   <p>${escapeHtml(r.description||"")}</p>
   <div class="grid3" style="margin-top:15px">
     <div class="detail-stat"><div class="kicker">WYDAJNOŚĆ</div><b>${fmt(r.yield||0)} ${escapeHtml(r.yieldUnit||"")}</b></div>
     <div class="detail-stat"><div class="kicker">CZAS</div><b>${fmt((r.prep||0)+(r.cook||0))} min</b></div>
     <div class="detail-stat"><div class="kicker">SKŁADNIKI</div><b>${totalIng}</b></div>
   </div>
 </section>
 <section class="section recipe-toolbar">
   <button class="btn primary big-action" data-cook="${r.id}">▶ GOTUJĘ</button>
   <button class="btn big-action" data-scale="${r.id}">⇄ PRZELICZ</button>
   <button class="btn big-action" data-edit="${r.id}">✎ EDYTUJ</button>
 </section>
 ${recipeImage(r)?`<img src="${escapeHtml(recipeImage(r))}" alt="${escapeHtml(r.name)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:20px;margin-bottom:12px">`:`<div class="image-placeholder recipe20-hero">🍽️<span>Zdjęcie potrawy</span></div>`}
 ${tags?`<div class="chips" style="margin-bottom:12px">${tags}</div>`:""}
 <section class="section">
   <div class="section-title-row"><h2>Składniki</h2><button class="btn small" data-shop-recipe="${r.id}">＋ Zakupy</button></div>
   ${r.sections.map(s=>`<div class="card">
     <div class="section-head"><h3>${escapeHtml(s.name)}</h3><span class="kicker">${s.ingredients.length} poz.</span></div>
     ${s.ingredients.map(i=>`<div class="row between" style="padding:12px 0;border-bottom:1px solid var(--line)">
       <span>${escapeHtml(i.name)}</span><b>${fmt(i.qty)} ${escapeHtml(i.unit)} ${i.percent!==""&&i.percent!=null?`<small class="muted">${fmt(i.percent)}%</small>`:""}</b>
     </div>`).join("")}
   </div>`).join("")}
 </section>
 <section class="section"><div class="section-title-row"><h2>Wykonanie</h2><span class="kicker">${totalSteps} kroków</span></div>
   <div class="card">${r.steps.map((s,i)=>`<div class="cook-step" style="${i<r.steps.length-1?"border-bottom:1px solid var(--line)":""}"><div class="kicker">KROK ${i+1}</div><div style="font-size:16px;line-height:1.45;margin-top:4px">${escapeHtml(s.text)}</div></div>`).join("")}</div>
 </section>
 <section class="section"><h2>Parametry</h2><div class="card">
   <div class="grid3">
    <div class="detail-stat"><div class="kicker">PREP</div><b>${r.prep||0} min</b></div>
    <div class="detail-stat"><div class="kicker">GOTOWANIE</div><b>${r.cook||0} min</b></div>
    <div class="detail-stat"><div class="kicker">FERMENTACJA</div><b>${r.ferment||0} h</b></div>
   </div>
   ${r.servingType?`<p><b>🍽️ ${escapeHtml(r.servingType)}</b></p>`:""}
 </div></section>
 <section class="section"><h2>Własne uwagi</h2><div class="card"><p style="white-space:pre-wrap;margin:0">${escapeHtml(r.notes||"Brak własnych uwag.")}</p></div></section>
 <section class="section"><div class="row">
   <button class="btn" data-history="${r.id}">Historia zmian</button><button class="btn" data-clear-cook="${r.id}">Resetuj „Gotuję”</button>
   <button class="btn danger" data-delete="${r.id}">Usuń</button>
 </div></section>`;
}
function editor(id){const r=id?state.recipes.find(x=>x.id===id):(state.editTemp||makeRecipe({name:"",category:"Inne",description:"",yield:"",yieldUnit:"porcja",prep:"",cook:"",ferment:"",temp:"",tags:[],traditional:false,flag:"",servings:1,ingredients:[],steps:[],notes:"",source:"",sourceUrl:""}));if(!id)state.editTemp=r;
return `<div class="row between"><button class="btn" data-back>‹ Anuluj</button><button class="btn primary" id="saveRecipe">Zapisz</button></div><h1>${id?"Edytuj recepturę":"Nowa receptura"}</h1><p class="muted">Zmiany są zapisywane dopiero po „Zapisz”, a poprzednia wersja trafia do historii.</p>
<div class="card"><div class="form-grid">
<div class="full"><label>Nazwa</label><input id="f-name" value="${escapeHtml(r.name)}"></div>
<div><label>Kategoria</label><select id="f-cat">${state.categories.map(c=>`<option ${c.name===r.category?"selected":""}>${escapeHtml(c.name)}</option>`).join("")}</select></div>
<div><label>Wydajność</label><input id="f-yield" type="number" step="any" value="${r.yield??""}"></div>
<div><label>Jednostka wydajności</label><input id="f-yieldUnit" value="${escapeHtml(r.yieldUnit||"porcja")}"></div>
<div><label>Porcje</label><input id="f-servings" type="number" step="any" value="${r.servings??""}"></div>
<div><label>Rodzaj podania</label><select id="f-servingType"><option value="Na ciepło" ${r.servingType==='Na ciepło'?'selected':''}>Na ciepło</option><option value="Na zimno" ${r.servingType==='Na zimno'?'selected':''}>Na zimno</option><option value="Przekąska" ${r.servingType==='Przekąska'?'selected':''}>Przekąska</option></select></div>
<div><label>Przygotowanie min</label><input id="f-prep" type="number" value="${r.prep??""}"></div>
<div><label>Gotowanie min</label><input id="f-cook" type="number" value="${r.cook??""}"></div>
<div><label>Fermentacja h</label><input id="f-ferment" type="number" step="any" value="${r.ferment??""}"></div>
<div><label>Tagi (przecinki)</label><input id="f-tags" value="${escapeHtml((r.tags||[]).join(", "))}"></div>
<div class="full"><label>Opis</label><textarea id="f-desc">${escapeHtml(r.description||"")}</textarea></div>
<div class="full"><label>Własne uwagi</label><textarea id="f-notes">${escapeHtml(r.notes||"")}</textarea></div>
<div><label>Źródło</label><input id="f-source" value="${escapeHtml(r.source||"")}"></div><div><label>URL źródła</label><input id="f-url" type="url" value="${escapeHtml(r.sourceUrl||"")}"></div>
<div class="full"><label>Zdjęcie</label><input id="f-image" type="file" accept="image/*"></div>
</div></div>
<div id="sections-editor">${r.sections.map((s,si)=>sectionEditor(s,si)).join("")}</div>
<button class="btn" id="addSection">＋ Dodaj sekcję</button>
<section class="section"><h2>Instrukcja</h2><div id="steps-editor">${r.steps.map((s,i)=>stepEditor(s,i)).join("")}</div><button class="btn" id="addStep">＋ Dodaj krok</button></section>
<div class="sticky-actions"><button class="btn primary" style="width:100%" id="saveRecipe2">Zapisz recepturę</button></div>`}
function sectionEditor(s,si){return `<div class="card section-editor" data-section="${s.id}"><div class="section-head"><input class="sec-name" value="${escapeHtml(s.name)}"><button class="btn small danger remove-sec">Usuń</button></div><div class="ings">${s.ingredients.map((i,ii)=>ingEditor(i)).join("")}</div><button class="btn small add-ing">＋ Składnik</button></div>`}
function ingEditor(i){return `<div class="ingredient-row ing"><div><label>Składnik</label><input class="i-name" value="${escapeHtml(i.name)}"></div><div><label>Ilość</label><input class="i-qty" type="number" step="any" value="${i.qty??""}"></div><div><label>Jednostka</label><input class="i-unit" value="${escapeHtml(i.unit||"g")}"></div><button class="btn small danger remove-ing" aria-label="Usuń składnik">×</button></div>`}
function stepEditor(s,i){return `<div class="step-row step"><div class="step-num">${i+1}</div><textarea class="step-text" placeholder="Co robimy?">${escapeHtml(s.text||"")}</textarea><button class="btn small danger remove-step">×</button></div>`}

function viewCalculators(){const v=typeof viewCalculatorsV14==="function"?viewCalculatorsV14():`<div class="empty">Ładowanie kalkulatora…</div>`;return `<div class="screen-back"><button class="btn ghost" data-back="start">‹ Powrót</button></div>${v}`}

function viewShopping(){return `<div class="screen-back"><button class="btn ghost" data-back="start">‹ Powrót</button></div><div class="row between"><div><div class="kicker">MAGAZYN W GŁOWIE</div><h1>Zakupy</h1></div><button class="btn primary" id="add-shopping">＋ Dodaj</button></div>
<div class="row" style="margin-bottom:12px"><button class="btn small" id="clear-done">Usuń ukończone</button><button class="btn small" id="clear-all-shop">Wyczyść wszystko</button></div>
${state.shopping.length?state.shopping.map(x=>`<div class="card checkbox-row ${x.done?"done":""}"><input type="checkbox" data-shop-check="${x.id}" ${x.done?"checked":""}><span class="grow">${escapeHtml(x.name)} <b>${fmt(x.qty||0)} ${escapeHtml(x.unit||"")}</b></span><button class="btn small danger" data-shop-del="${x.id}">×</button></div>`).join(""):`<div class="empty">Lista jest pusta. Dodaj składniki z receptury albo ręcznie.</div>`}`}

function viewSettings(){return `<div class="screen-back"><button class="btn ghost" data-back="start">‹ Powrót</button></div><div class="kicker">KONFIGURACJA</div><h1>Ustawienia</h1>
<div class="card"><div class="row between"><div><b>Motyw</b><div class="muted">Jasny / ciemny / systemowy</div></div><select id="theme"><option value="system">Automatyczny</option><option value="light">Jasny</option><option value="dark">Ciemny</option></select></div></div>
<div class="card"><div class="row between"><div><b>Profil interfejsu</b><div class="muted">Amator = większe elementy i prostszy układ</div></div><select id="profile"><option value="pro">Profesjonalny</option><option value="amateur">Amator</option></select></div></div>
<div class="card"><h2>Dane</h2><div class="grid"><button class="btn" id="export">Eksportuj JSON</button><button class="btn" id="importBackup">Importuj backup</button><button class="btn" id="addCategory">＋ Dodaj kategorię</button></div><p class="muted">Dane są przechowywane lokalnie w IndexedDB na tym urządzeniu. Backup JSON jest Twoją kopią bezpieczeństwa.</p></div>
<div class="card"><h2>Import receptury</h2><button class="btn primary" id="openImporter">Importuj recepturę z tekstu</button></div>
<div class="card"><h2>Prywatność</h2><p class="muted">Kucharzyna nie wysyła receptur, notatek, zakupów ani zdjęć na serwer. Nie używa reklam, analityki ani trackerów.</p></div>`}

function bind(){
 $$(".nav-btn").forEach(b=>b.onclick=()=>nav(b.dataset.route));
 $$("#main [data-route2]").forEach(b=>b.onclick=()=>nav(b.dataset.route2||"recipes"));
 $$("#main [data-action]").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="new"){state.route="edit";state.editId=null;render()}else if(a==="recipes"){nav("recipes")}else if(a==="calculators"){nav("calculators")}else if(a==="shopping"){nav("shopping")}else if(a==="fav"){state.query="";state.selectedCat="Wszystkie";state.sort="fav";nav("recipes")}else if(a==="recent"){state.query="";state.selectedCat="Wszystkie";state.sort="recent";nav("recipes")}else if(a==="import")openImporter()});
 $$("#main [data-open]").forEach(b=>b.onclick=e=>{if(e.target.closest("[data-fav]"))return;const id=b.dataset.open;const r=state.recipes.find(x=>x.id===id);r.lastUsedAt=now();put("recipes",r);state.route="recipe";state.selectedId=id;render()});
 $$("#main [data-fav]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const id=b.dataset.fav;const r=state.recipes.find(x=>x.id===id);r.favorite=!r.favorite;r.updatedAt=now();await put("recipes",r);render();toast(r.favorite?"Dodano do ulubionych":"Usunięto z ulubionych")});
 const q=$("#recipeSearch");if(q)q.oninput=()=>{state.query=q.value;render();$("#recipeSearch")?.focus()};
 $$("#main [data-cat]").forEach(b=>b.onclick=()=>{state.selectedCat=b.dataset.cat;render()});
 const sort=$("#sort");if(sort)sort.onchange=()=>{state.sort=sort.value;render()};
 $$("#main [data-edit]").forEach(b=>b.onclick=()=>{state.route="edit";state.editId=b.dataset.edit;render()});
 $$("#main [data-cook]").forEach(b=>b.onclick=()=>{state.route="cook";state.selectedId=b.dataset.cook;render()});
 $$("#main [data-scale]").forEach(b=>b.onclick=()=>scaleModal(b.dataset.scale)); $$("#main [data-recipe-ing]").forEach(btn=>btn.onclick=()=>ingredientScaleModal(state.selectedId,btn.dataset.recipeIng));
 $$("#main [data-shop-recipe]").forEach(b=>b.onclick=()=>addRecipeShopping(b.dataset.shopRecipe));
 $$("#main [data-delete]").forEach(b=>b.onclick=()=>confirmDelete(b.dataset.delete));
 $$("#main [data-history]").forEach(b=>b.onclick=()=>historyModal(b.dataset.history));
 $$("#main [data-clear-cook]").forEach(b=>b.onclick=()=>confirmGeneric("Wyczyścić postęp trybu GOTUJĘ dla tej receptury?",async()=>{await del("cookState",b.dataset.clearCook);delete state.cook[b.dataset.clearCook];toast("Postęp wyczyszczony")}));
 $$("#main [data-back]").forEach(b=>b.onclick=()=>nav(b.dataset.back||"recipes"));
 if($("#saveRecipe")||$("#saveRecipe2")){$("#saveRecipe")?.addEventListener("click",saveEdited);$("#saveRecipe2")?.addEventListener("click",saveEdited);$("#addSection").onclick=()=>{$("#sections-editor").insertAdjacentHTML("beforeend",sectionEditor({id:uid(),name:"Nowa sekcja",ingredients:[]},0));bindEditor()};$("#addStep").onclick=()=>{$("#steps-editor").insertAdjacentHTML("beforeend",stepEditor({id:uid(),text:""},$$("#steps-editor .step").length));bindEditor()};bindEditor()}
 if($("#pizza-result"))calcPizza(); $$("#main #pc-balls,#main #pc-ball,#main #pc-hyd,#main #pc-salt,#main #pc-oil,#main #pc-yeast").forEach(x=>x.oninput=calcPizza);
 if($("#bp-calc"))$("#bp-calc").onclick=()=>{const f=+$("#bp-flour").value||0;const m=parseFloat($("#bp-item").value.split("/").pop())||0;$("#bp-result").innerHTML=`<div class="big">${fmt(f?m/f*100:0)}%</div><div class="muted">Procent piekarski względem ${fmt(f)} g mąki.</div>`};
 if($("#fc-result")){$$("#fc-pack,#fc-price,#fc-use,#fc-sale").forEach(x=>x.oninput=calcFood);calcFood()}
 if($("#add-shopping"))$("#add-shopping").onclick=()=>manualShop();
 $$("#main [data-shop-check]").forEach(x=>x.onchange=async()=>{const s=state.shopping.find(a=>a.id===x.dataset.shopCheck);s.done=x.checked;await put("shoppingItems",s);render()});
 $$("#main [data-shop-del]").forEach(x=>x.onclick=async()=>{await del("shoppingItems",x.dataset.shopDel);state.shopping=await getAll("shoppingItems");render();toast("Usunięto")});
 if($("#clear-done"))$("#clear-done").onclick=async()=>{for(const x of state.shopping.filter(a=>a.done))await del("shoppingItems",x.id);state.shopping=await getAll("shoppingItems");render();toast("Usunięto ukończone")};
 if($("#clear-all-shop"))$("#clear-all-shop").onclick=()=>confirmGeneric("Wyczyścić całą listę zakupów?",async()=>{await clearStore("shoppingItems");state.shopping=[];render();toast("Lista wyczyszczona")});
 if($("#theme")){$("#theme").value=state.settings.theme;$("#theme").onchange=()=>{state.settings.theme=$("#theme").value;saveSetting();k39BindSystemTheme();applyTheme()}};
 if($("#profile")){$("#profile").value=state.settings.profile;$("#profile").onchange=()=>{state.settings.profile=$("#profile").value;saveSetting();applyTheme();renderV20();toast(state.settings.profile==="amateur"?"Tryb Amator włączony":"Tryb Profesjonalny włączony")}};
 $("#export")?.addEventListener("click",exportBackup);$("#importBackup")?.addEventListener("click",()=>backupInput());
 $("#addCategory")?.addEventListener("click",()=>{openModal(`<h2>Nowa kategoria</h2><input id="cat-name" placeholder="Np. Fermenty"><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="cat-ok">Dodaj</button></div>`);$("#cat-ok").onclick=async()=>{const name=$("#cat-name").value.trim();if(!name)return;if(state.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())){toast("Taka kategoria już istnieje");return}await put("categories",{id:uid(),name});state.categories=await getAll("categories");closeModal();render();toast("Dodano kategorię")}});$("#openImporter")?.addEventListener("click",openImporter);
 bindCook();
}
function bindEditor(){ $$("#main .remove-sec").forEach(b=>b.onclick=()=>b.closest(".section-editor").remove());$$("#main .add-ing").forEach(b=>b.onclick=()=>{b.closest(".section-editor").querySelector(".ings").insertAdjacentHTML("beforeend",ingEditor({id:uid(),name:"",qty:"",unit:"g"}));bindEditor()});$$("#main .remove-ing").forEach(b=>b.onclick=()=>b.closest(".ing").remove());$$("#main .remove-step").forEach(b=>b.onclick=()=>b.closest(".step").remove())}
function collectRecipe(){const old=state.editId?state.recipes.find(r=>r.id===state.editId):state.editTemp;const r={...old,name:$("#f-name").value.trim()||"Bez nazwy",category:$("#f-cat").value,yield:+$("#f-yield").value||0,yieldUnit:$("#f-yieldUnit").value.trim(),servings:+$("#f-servings").value||1,servingType:$("#f-servingType").value||"Na ciepło",prep:+$("#f-prep").value||0,cook:+$("#f-cook").value||0,ferment:+$("#f-ferment").value||0,tags:$("#f-tags").value.split(",").map(x=>x.trim()).filter(Boolean),description:$("#f-desc").value,notes:$("#f-notes").value,source:$("#f-source").value,sourceUrl:$("#f-url").value,updatedAt:now()};
r.sections=$$("#main .section-editor").map(sec=>({id:sec.dataset.section,name:sec.querySelector(".sec-name").value.trim()||"Sekcja",ingredients:[...sec.querySelectorAll(".ing")].map(el=>({id:uid(),name:el.querySelector(".i-name").value.trim(),qty:+el.querySelector(".i-qty").value||0,unit:el.querySelector(".i-unit").value.trim()||"g",percent:"",price:"",packQty:"",packUnit:""})).filter(i=>i.name)}));
r.steps=$$("#main .step").map(el=>({id:uid(),text:el.querySelector(".step-text").value.trim()})).filter(s=>s.text);
return r}
async function saveEdited(){const r=collectRecipe();const old=state.editId?state.recipes.find(x=>x.id===state.editId):null;if(old)await put("history",{id:uid(),recipeId:r.id,date:now(),snapshot:JSON.parse(JSON.stringify(old)),summary:"Zapisano zmianę receptury"});await put("recipes",r);if($("#f-image").files[0]){r.image=await compressImage($("#f-image").files[0]);await put("recipes",r)}state.recipes=await getAll("recipes");state.route="recipe";state.selectedId=r.id;delete state.editTemp;render();toast("Receptura zapisana")}
function compressImage(file){return new Promise((res,rej)=>{
  if(!file){rej(new Error("Brak pliku obrazu"));return}
  const im=new Image(),c=document.createElement("canvas"),url=URL.createObjectURL(file);
  const cleanup=()=>{try{URL.revokeObjectURL(url)}catch(e){}};
  im.onload=()=>{try{const max=1000,sc=Math.min(1,max/Math.max(im.width,im.height));c.width=Math.max(1,Math.round(im.width*sc));c.height=Math.max(1,Math.round(im.height*sc));const ctx=c.getContext("2d");if(!ctx)throw new Error("Canvas niedostępny");ctx.drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.78));}catch(e){rej(e)}finally{cleanup()}};
  im.onerror=()=>{cleanup();rej(new Error("Nie udało się odczytać obrazu"))};
  im.src=url;
})}
function calcPizza(){const balls=+$("#pc-balls").value||0,ball=+$("#pc-ball").value||0,h=+$("#pc-hyd").value||0,s=+$("#pc-salt").value||0,o=+$("#pc-oil").value||0,y=+$("#pc-yeast").value||0,total=balls*ball,flour=total/(1+h/100+s/100+o/100+y/100);$("#pizza-result").innerHTML=`<div class="big">${fmt(total)} g ciasta</div><div class="grid" style="margin-top:10px"><div><b>Mąka</b><br>${fmt(flour)} g</div><div><b>Woda</b><br>${fmt(flour*h/100)} g</div><div><b>Sól</b><br>${fmt(flour*s/100)} g</div><div><b>Oliwa</b><br>${fmt(flour*o/100)} g</div><div><b>Drożdże</b><br>${fmt(flour*y/100)} g</div><div><b>Hydracja</b><br>${fmt(h)}%</div></div>`}
function calcFood(){const p=+$("#fc-pack").value||0,c=+$("#fc-price").value||0,u=+$("#fc-use").value||0,s=+$("#fc-sale").value||0,cost=p?c*u/p:0;$("#fc-result").innerHTML=`<div class="big">${cost.toFixed(2)} zł</div><div>Food cost: <b>${s?(cost/s*100).toFixed(1):"0"}%</b></div>`}
function addRecipeShopping(id){const r=state.recipes.find(x=>x.id===id);(async()=>{for(const s of r.sections)for(const i of s.ingredients)if(i.name)await put("shoppingItems",{id:uid(),name:i.name,qty:i.qty,unit:i.unit,done:false});state.shopping=await getAll("shoppingItems");toast("Dodano składniki do zakupów")})()}
function manualShop(){openModal(`<h2>Dodaj produkt</h2><div class="form-grid"><div class="full"><label>Nazwa</label><input id="shop-name"></div><div><label>Ilość</label><input id="shop-qty" type="number" step="any" value="1"></div><div><label>Jednostka</label><input id="shop-unit" value="szt."></div></div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="shop-ok">Dodaj</button></div>`);$("#shop-ok").onclick=async()=>{const name=$("#shop-name").value.trim();if(!name)return;await put("shoppingItems",{id:uid(),name,qty:+$("#shop-qty").value||1,unit:$("#shop-unit").value.trim()||"szt.",done:false});state.shopping=await getAll("shoppingItems");closeModal();render();toast("Dodano do zakupów")}}
function openModal(html){$("#modal-root").innerHTML=`<div class="modal-backdrop" id="backdrop"><div class="modal">${html}</div></div>`;$("#backdrop").addEventListener("click",e=>{if(e.target.id==="backdrop")closeModal()});$("#modal-root [data-close]")?.addEventListener("click",closeModal)}
function closeModal(){$("#modal-root").innerHTML=""}
function confirmGeneric(text,fn){openModal(`<h2>Potwierdź</h2><p>${text}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn danger" id="yes">Potwierdź</button></div>`);$("#yes").onclick=async()=>{closeModal();await fn()}}
function confirmDelete(id){const r=state.recipes.find(x=>x.id===id);confirmGeneric(`Usunąć „${escapeHtml(r.name)}”?`,async()=>{await del("recipes",id);state.recipes=await getAll("recipes");nav("recipes");toast("Receptura usunięta")})}
function scaleModal(id){const r=state.recipes.find(x=>x.id===id);openModal(`<h2>Przelicz recepturę</h2><p class="muted">Bazowo: ${fmt(r.yield)} ${r.yieldUnit}</p><label>Nowa wartość</label><input id="scale-value" type="number" step="any" value="${r.yield}"><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="scale-ok">Przelicz</button></div><div id="scale-out" style="margin-top:12px"></div>`);$("#scale-ok").onclick=()=>{const v=+$("#scale-value").value||r.yield,f=r.yield?v/r.yield:1;$("#scale-out").innerHTML=r.sections.flatMap(s=>s.ingredients).map(i=>`<div class="row between"><span>${escapeHtml(i.name)}</span><b>${fmt(i.qty*f)} ${escapeHtml(i.unit)}</b></div>`).join("")}}
function historyModal(id){const hs=state.history.filter(x=>x.recipeId===id).sort((a,b)=>b.date.localeCompare(a.date));openModal(`<h2>Historia zmian</h2>${hs.length?hs.map(h=>`<div class="card"><b>${new Date(h.date).toLocaleString("pl-PL")}</b><p class="muted">${escapeHtml(h.summary)}</p><button class="btn small" data-restore="${h.id}">Przywróć</button></div>`).join(""):`<p class="muted">Brak zapisanych poprzednich wersji.</p>`}`);$$("#modal-root [data-restore]").forEach(b=>b.onclick=async()=>{const h=hs.find(x=>x.id===b.dataset.restore);await put("recipes",h.snapshot);state.recipes=await getAll("recipes");closeModal();toast("Przywrócono wersję")})}
function bindCook(){if(state.route!=="cook")return;const r=state.recipes.find(x=>x.id===state.selectedId);if(!r)return;const st=state.cook[r.id]||{id:r.id,ingredients:{},steps:{}}; $$("#main [data-cook-ing]").forEach(x=>x.onchange=async()=>{st.ingredients[x.dataset.cookIng]=x.checked;await put("cookState",st);state.cook[r.id]=st;render()});$$("#main [data-cook-step]").forEach(x=>x.onchange=async()=>{st.steps[x.dataset.cookStep]=x.checked;await put("cookState",st);state.cook[r.id]=st;render()})}
function viewCook(){
 const r=state.recipes.find(x=>x.id===state.selectedId),st=state.cook[r.id]||{id:r.id,ingredients:{},steps:{}};
 const ingredients=r.sections.flatMap(s=>s.ingredients);
 const all=[...ingredients.map(i=>st.ingredients[i.id]),...r.steps.map(s=>st.steps[s.id])];
 const done=all.filter(Boolean).length,total=all.length,pct=total?Math.round(done/total*100):0;
 return `<div class="cook-header">
   <div class="row between"><button class="btn" data-back>‹ Receptura</button><b>${pct}%</b></div>
   <h1 style="margin-top:14px">GOTUJĘ</h1><div class="muted">${escapeHtml(r.name)}</div>
   <div class="progress" style="margin-top:12px"><div style="width:${pct}%"></div></div>
 </div>
 <section class="section"><div class="section-title-row"><h2>Składniki</h2><span class="kicker">${ingredients.length}</span></div>
   <div class="card">${r.sections.map(s=>`<div class="form-section-title">${escapeHtml(s.name)}</div>${s.ingredients.map(i=>`<label class="checkbox-row cook-check ${st.ingredients[i.id]?"done":""}"><input type="checkbox" data-cook-ing="${i.id}" ${st.ingredients[i.id]?"checked":""}><span>${escapeHtml(i.name)}<br><b>${fmt(i.qty)} ${escapeHtml(i.unit)}</b></span></label>`).join("")}`).join("")}</div>
 </section>
 <section class="section"><div class="section-title-row"><h2>Instrukcja</h2><span class="kicker">${r.steps.length} kroków</span></div>
   <div class="card">${r.steps.map((s,i)=>`<label class="checkbox-row cook-check cook-step ${st.steps[s.id]?"done":""}"><input type="checkbox" data-cook-step="${s.id}" ${st.steps[s.id]?"checked":""}><span><b>Krok ${i+1}</b><br>${escapeHtml(s.text)}</span></label>`).join("")}</div>
 </section>
 <section class="section"><div class="card"><h2>Parametry</h2><div class="grid3">
   <div class="detail-stat"><div class="kicker">PODANIE</div><b>${escapeHtml(r.servingType||"Na ciepło")}</b></div>
   <div class="detail-stat"><div class="kicker">CZAS</div><b>${(r.prep||0)+(r.cook||0)} min</b></div>
   <div class="detail-stat"><div class="kicker">FERM.</div><b>${r.ferment||0} h</b></div>
 </div><p style="white-space:pre-wrap">${escapeHtml(r.notes||"Brak własnych uwag.")}</p></div></section>`;
}
function openImporter(){openModal(`<h2>Importuj recepturę</h2><p class="muted">Wklej tekst przepisu. Parser rozpozna popularne ilości/jednostki i sekcję składników. Nic nie jest wysyłane na serwer.</p><textarea id="import-text" style="min-height:260px" placeholder="Nazwa przepisu\n\nSkładniki:\n500 g mąki\n325 g wody\n10 g soli\n\nPrzygotowanie:\n..."></textarea><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="parse-import">Rozpoznaj</button></div>`);$("#parse-import").onclick=()=>parseImport($("#import-text").value)}
function parseImport(text){const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const ing=[];let mode="ing";const steps=[];for(const line of lines.slice(1)){if(/^(składniki|ingredients)\s*:?\s*$/i.test(line)){mode="ing";continue}if(/^(przygotowanie|instructions?|method)\s*:?\s*$/i.test(line)){mode="steps";continue}if(mode==="ing"){const m=line.match(/^(.+?)\s+([\d.,]+)\s*(g|kg|ml|l|szt\.?|łyżeczka|łyżka|szczypta|porcja|%)\b/i);if(m)ing.push([m[1].replace(/^[-•*]\s*/,""),parseFloat(m[2].replace(",",".")),m[3], ""])}else steps.push(line.replace(/^[-•*\d.)\s]+/,""))}const temp=text.match(/(\d{2,3})\s*°?C/i)?.[1]||"";const r=makeRecipe({name:lines[0]||"Importowana receptura",category:"Inne",description:"Zaimportowana lokalnie z tekstu.",yield:1,yieldUnit:"porcja",prep:0,cook:0,ferment:0,temp:+temp,tags:["import"],traditional:false,flag:"",servings:1,ingredients:ing,steps:steps.length?steps:["Uzupełnij instrukcję.",],notes:"Zaimportowano z tekstu.",source:"Wklejony tekst",sourceUrl:""});closeModal();state.editTemp=r;state.editId=null;state.route="edit";render();toast("Rozpoznano recepturę — sprawdź i zapisz")}
function backupInput(){const i=document.createElement("input");i.type="file";i.accept=".json,application/json";i.onchange=()=>importBackup(i.files[0]);i.click()}
async function exportBackup(){const data={version:2,exportedAt:now(),recipes:await getAll("recipes"),categories:await getAll("categories"),shoppingItems:await getAll("shoppingItems"),inventoryItems:await getAll("inventoryItems"),settings:await getAll("settings"),history:await getAll("history"),cookState:await getAll("cookState")};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kucharzyna-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(a.href);toast("Backup wyeksportowany")}
async function importBackup(file){if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.recipes))throw Error("Nieprawidłowy backup");openModal(`<h2>Import backup</h2><p>Co zrobić z obecnymi danymi?</p><div class="row"><button class="btn danger" id="replace-backup">Zastąp</button><button class="btn primary" id="merge-backup">Połącz</button><button class="btn" data-close>Anuluj</button></div>`);$("#replace-backup").onclick=()=>applyBackup(data,true);$("#merge-backup").onclick=()=>applyBackup(data,false)}catch(e){toast("Nieprawidłowy plik backupu")}}
async function applyBackup(data,replace){if(replace)await clearAll();for(const key of ["recipes","categories","shoppingItems","inventoryItems","settings","history","cookState"])for(const x of (data[key]||[]))await put(key,x);state.recipes=await getAll("recipes");state.categories=await getAll("categories");state.shopping=await getAll("shoppingItems");state.inventory=await getAll("inventoryItems");state.settings=(await getAll("settings"))[0]||state.settings;closeModal();applyTheme();render();toast("Backup zaimportowany")}
$("#themeBtn").onclick=()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";saveSetting();applyTheme()};
window.addEventListener("popstate",()=>nav("start"));

/* ===== Kucharzyna v1.4 feature layer ===== */
let pizzaModeV14="dough";
function tasteMeterV14(t){
 if(!t)return "";
 const items=[["Słodycz","sweet","🍯"],["Kwasowość","sour","🍋"],["Słoność","salty","🧂"],["Umami","umami","🍄"],["Gorycz","bitter","🌿"],["Ostrość","spicy","🌶️"]];
 return `<section class="section"><div class="section-title-row"><h2>Profil smakowy</h2><span class="kicker">0–5</span></div><div class="taste-card">${items.map(([n,k,e])=>`<div class="taste-row"><span class="taste-name">${e} ${n}</span><div class="taste-track">${[1,2,3,4,5].map(v=>`<i class="${v<=Number(t[k]||0)?"on":""}"></i>`).join("")}</div><b>${Number(t[k]||0)}</b></div>`).join("")}</div></section>`;
}
function recipeCardV14(r){
 const img=recipeImage(r);
 const media=img?`<img loading="lazy" decoding="async" src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" onerror="this.closest('.recipe-thumb').innerHTML='<div class=&quot;food-placeholder&quot;>${r.flag||"🍽️"}</div>'">`:`<div class="food-placeholder">${r.flag||"🍽️"}</div>`;
 return `<article class="card recipe-card" data-open="${r.id}"><div class="recipe-thumb">${media}</div><div class="grow"><div class="row between"><h3>${escapeHtml(r.name)} ${r.traditional?`<span class="star">★</span>`:""} ${r.flag||""}</h3><button class="icon-btn small fav" data-fav="${r.id}" aria-label="Ulubione">${r.favorite?"★":"☆"}</button></div><div class="recipe-meta">${escapeHtml(r.category||"Inne")} · ${r.cuisine?escapeHtml(r.cuisine)+" · ":""}${r.yield?fmt(r.yield)+" "+escapeHtml(r.yieldUnit||""):""}</div></div></article>`;
}
function viewTraditionalV14(){
 let rs=state.recipes.filter(r=>r.traditional);
 if(state.tradCatV14&&state.tradCatV14!=="Wszystkie")rs=rs.filter(r=>r.cuisine===state.tradCatV14);
 if(state.traditionalQueryV14)rs=rs.filter(r=>(r.name+" "+r.description+" "+(r.tags||[]).join(" ")+" "+(r.category||"")+" "+(r.cuisine||"")).toLowerCase().includes(state.traditionalQueryV14.toLowerCase()));
 const cuisines=[...new Set(state.recipes.filter(r=>r.traditional).map(r=>r.cuisine).filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 return `<section class="traditional-hero"><div class="kicker">★ TRADYCJE KULINARNE ŚWIATA</div><h1>Tradycyjne przepisy</h1><p>Duża baza klasycznych dań. Receptury są opracowane po polsku na podstawie źródeł kulinarnych, bez kopiowania chronionych opisów.</p></section><div class="search-wrap"><span>⌕</span><input class="search" id="traditionalSearchV14" placeholder="Szukaj dania, kraju lub kuchni…" value="${escapeHtml(state.traditionalQueryV14||"")}"></div><div class="chips"><button class="chip ${!state.tradCatV14||state.tradCatV14==="Wszystkie"?"active":""}" data-trad-v14="Wszystkie">Wszystkie</button>${cuisines.map(c=>`<button class="chip ${state.tradCatV14===c?"active":""}" data-trad-v14="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}</div><div class="traditional-grid">${rs.length?rs.map(recipeCardV14).join(""):`<div class="empty">Brak wyników.</div>`}</div>`;
}
function pizzaInputsV14(){
 const p=state.pizzaV14||{balls:10,ball:250,flour:1000,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24};
 const common=`<div class="form-grid"><div><label>Hydracja %</label><input id="v14-hyd" type="number" step=".1" value="${p.hyd}"></div><div><label>Sól %</label><input id="v14-salt" type="number" step=".1" value="${p.salt}"></div><div><label>Oliwa %</label><input id="v14-oil" type="number" step=".1" value="${p.oil}"></div><div><label>Drożdże %</label><input id="v14-yeast" type="number" step=".01" value="${p.yeast}"></div><div><label>Temperatura °C</label><input id="v14-temp" type="number" value="${p.temp}"></div><div><label>Fermentacja h</label><input id="v14-time" type="number" value="${p.time}"></div></div>`;
 return pizzaModeV14==="flour"?`<div class="highlight-input"><label>🍞 Mam mąkę — ile masz?</label><input id="v14-flour" type="number" inputmode="decimal" value="${p.flour}"><span>g</span></div><div><label>Docelowa masa kulki (g)</label><input id="v14-ball" type="number" inputmode="decimal" value="${p.ball}"></div>${common}`:`<div class="form-grid"><div><label>Liczba kulek</label><input id="v14-balls" type="number" value="${p.balls}"></div><div><label>Masa kulki</label><input id="v14-ball" type="number" value="${p.ball}"></div></div>${common}`;
}
function pizzaCalcV14(){
 const p=state.pizzaV14||{};if(pizzaModeV14!=="flour")p.balls=+$("#v14-balls")?.value||0;p.ball=+$("#v14-ball")?.value||250;p.flour=+$("#v14-flour")?.value||0;p.hyd=+$("#v14-hyd")?.value||0;p.salt=+$("#v14-salt")?.value||0;p.oil=+$("#v14-oil")?.value||0;p.yeast=+$("#v14-yeast")?.value||0;p.temp=+$("#v14-temp")?.value||0;p.time=+$("#v14-time")?.value||0;state.pizzaV14=p;
 let flour,water,salt,oil,yeast,total;if(pizzaModeV14==="flour"){flour=p.flour;water=flour*p.hyd/100;salt=flour*p.salt/100;oil=flour*p.oil/100;yeast=flour*p.yeast/100;total=flour+water+salt+oil+yeast;p.balls=p.ball?Math.floor(total/p.ball):0}else{total=p.balls*p.ball;flour=total/(1+p.hyd/100+p.salt/100+p.oil/100+p.yeast/100);water=flour*p.hyd/100;salt=flour*p.salt/100;oil=flour*p.oil/100;yeast=flour*p.yeast/100}
 const out=$("#v14-pizza-result");if(out)out.innerHTML=`<div class="big">${fmt(total)} g ciasta</div><div class="grid pizza-results"><div><b>Mąka</b><br>${fmt(flour)} g</div><div><b>Woda</b><br>${fmt(water)} g</div><div><b>Sól</b><br>${fmt(salt)} g</div><div><b>Oliwa</b><br>${fmt(oil)} g</div><div><b>Drożdże</b><br>${fmt(yeast)} g</div><div><b>Liczba kulek</b><br>${fmt(p.balls)} × ${fmt(p.ball||0)} g${pizzaModeV14==="flour"?` · wyliczone`:``}</div></div>`;
}
function pizzaProfilesV14(){
 const el=$("#v14-pizza-profiles");if(!el)return;
 el.innerHTML=state.pizzaProfiles?.length?state.pizzaProfiles.map(p=>`<div class="profile-row"><button class="profile-load" data-v14-load="${p.id}"><b>${escapeHtml(p.name)}</b><span>${p.mode==="flour"?"na mąkę":"na kulki"} · ${p.values.hyd}%</span></button><button class="icon-btn danger" data-v14-del="${p.id}">×</button></div>`).join(""):`<div class="muted">Brak zapisanych profili.</div>`;
 $$("#main [data-v14-load]").forEach(b=>b.onclick=()=>{const p=state.pizzaProfiles.find(x=>x.id===b.dataset.v14Load);if(!p)return;pizzaModeV14=p.mode;state.pizzaV14={...p.values};render()});
 $$("#main [data-v14-del]").forEach(b=>b.onclick=async()=>{await del("pizzaProfiles",b.dataset.v14Del);state.pizzaProfiles=await getAll("pizzaProfiles");render()});
}
function viewCalculatorsV14(){
 const pro=state.settings.profile!=="amateur";
 return `<div class="kicker">NARZĘDZIA</div><h1>Kalkulatory</h1><section class="section card pizza-calculator"><div class="row between"><div><div class="kicker">PIZZA</div><h2>🍕 Ciasto na pizzę</h2></div><span class="badge">Twoje profile</span></div><div class="segmented"><button class="seg ${pizzaModeV14==="dough"?"active":""}" id="v14-mode-dough">Kulki / masa</button><button class="seg ${pizzaModeV14==="flour"?"active":""}" id="v14-mode-flour">Mam mąkę</button></div><div id="v14-pizza-inputs">${pizzaInputsV14()}</div><div id="v14-pizza-result" class="calc-result"></div><div class="card soft" style="margin-top:14px"><div class="row between"><b>Moje profile</b><button class="btn small" id="v14-save-profile">＋ Zapisz</button></div><div id="v14-pizza-profiles"></div></div></section>${pro?`<section class="section card"><h2>💰 Food cost</h2><p class="muted">Narzędzie dla kuchni profesjonalnej.</p><div class="form-grid"><div><label>Waga opakowania</label><input id="fc-pack" type="number" value="1000"></div><div><label>Cena opakowania</label><input id="fc-price" type="number" step=".01" value="10"></div><div><label>Zużycie</label><input id="fc-use" type="number" value="250"></div><div><label>Cena sprzedaży</label><input id="fc-sale" type="number" step=".01" value="40"></div></div><div id="fc-result" class="calc-result"></div></section>`:""}`;
}
function recipeViewV14(id){
 const r=state.recipes.find(x=>x.id===id);if(!r)return viewRecipes();
 const img=recipeImage(r);
 const all=(r.sections||[]).flatMap(s=>s.ingredients||[]);
 const count=all.length;
 const totalWeight=all.filter(i=>typeof i.qty==='number'&&i.unit&&/^(g|kg|ml|l)$/i.test(i.unit)).reduce((n,i)=>n+i.qty*(i.unit==='kg'||i.unit==='l'?1000:1),0);
 return `<div class="recipe-page">
 <div class="recipe-page-top"><button class="btn ghost" data-back="recipes">‹ Receptury</button><div class="recipe-page-actions"><button class="icon-btn" data-fav="${r.id}" aria-label="Ulubiona">${r.favorite?'★':'☆'}</button><button class="btn" data-edit="${r.id}">✎ Edytuj</button></div></div>
 ${img?`<div class="recipe-cover"><img src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" loading="eager" decoding="async" onerror="this.closest('.recipe-cover').classList.add('image-error');this.style.display='none'"><div class="image-error-fallback">🍽️</div>${r.imageCredit?`<small>${escapeHtml(r.imageCredit)}</small>`:''}</div>`:''}
 <section class="recipe-intro"><div class="kicker">${escapeHtml(r.category||'Inne')} ${r.flag||''} ${r.traditional?'<span class="recipe-badge">★ TRADYCYJNA</span>':''}</div><h1>${escapeHtml(r.name)}</h1>${r.description?`<p>${escapeHtml(r.description)}</p>`:''}<div class="recipe-meta"><span>🍽️ <b>${fmt(r.yield||0)} ${escapeHtml(r.yieldUnit||'')}</b></span><span>⏱️ <b>${fmt((r.prep||0)+(r.cook||0))} min</b></span><span>🥣 <b>${count} składników</b></span>${totalWeight?`<span>⚖️ <b>${fmt(totalWeight)} g</b></span>`:''}</div></section>
 <div class="recipe-toolbar"><button class="btn primary" data-cook="${r.id}">▶ GOTUJĘ</button><button class="btn" data-edit="${r.id}">✎ EDYTUJ</button><button class="btn" data-scale="${r.id}">⇄ PRZELICZ</button><button class="btn" data-shop-recipe="${r.id}">＋ ZAKUPY</button></div>
 ${tasteMeterV14(r.taste)}
 <section class="recipe-section"><div class="recipe-section-heading"><div><div class="kicker">RECEPTURA</div><h2>Składniki</h2></div><span class="section-note">Zmień dowolną gramaturę — reszta przeliczy się proporcjonalnie.</span></div>
 ${all.length?`<div class="ingredient-list">${(r.sections||[]).map(s=>`<div class="ingredient-group">${(r.sections||[]).length>1?`<div class="ingredient-group-title">${escapeHtml(s.name)}</div>`:''}${(s.ingredients||[]).map(i=>`<div class="ingredient-line" data-ing-line="${i.id}"><div class="ingredient-name"><span class="ingredient-dot"></span><span>${escapeHtml(i.name)}</span></div><button class="ingredient-amount ingredient-amount-button" data-recipe-ing="${i.id}" type="button" aria-label="Zmień ilość ${escapeHtml(i.name)}"><strong>${fmt(i.qty??0)}</strong><span>${escapeHtml(i.unit||'g')}</span></button></div>`).join('')}</div>`).join('')}</div>`:`<div class="empty">Brak składników.</div>`}
 <div class="recipe-scale-hint">💡 Kliknij dowolną gramaturę, aby zobaczyć przeliczenie całej receptury. <b>Nic nie zostanie zapisane bez Twojego potwierdzenia.</b></div></section>
 <section class="recipe-section"><div class="recipe-section-heading"><div><div class="kicker">TECHNIKA</div><h2>Wykonanie</h2></div><span class="section-note">${(r.steps||[]).length} etapów</span></div>
 <div class="steps-list">${(r.steps||[]).map((st,i)=>`<article class="recipe-step"><div class="step-number">${i+1}</div><div class="step-body"><div class="step-label">KROK ${i+1}</div><p>${escapeHtml(st.text)}</p></div></article>`).join('')||'<div class="empty">Brak opisanych kroków — edytuj recepturę i dodaj wykonanie.</div>'}</div></section>
 ${r.notes?`<section class="recipe-section"><div class="recipe-section-heading"><div><div class="kicker">NOTATKI</div><h2>Własne uwagi</h2></div></div><div class="notes-panel">${escapeHtml(r.notes).replace(/\n/g,'<br>')}</div></section>`:''}
 ${r.source?`<section class="recipe-source"><div class="kicker">ŹRÓDŁO</div><b>${escapeHtml(r.source)}</b>${r.sourceUrl?`<a href="${escapeHtml(r.sourceUrl)}" target="_blank" rel="noreferrer">Otwórz źródło ↗</a>`:''}${r.license?`<small>${escapeHtml(r.license)}</small>`:''}</section>`:''}
 </div>`;
}
function ingredientScaleModal(recipeId, ingredientId){
 const r=state.recipes.find(x=>x.id===recipeId); if(!r)return;
 const all=(r.sections||[]).flatMap(s=>s.ingredients||[]); const target=all.find(i=>i.id===ingredientId); if(!target)return;
 openModal(`<div class="scale-modal"><div class="kicker">PRZELICZ RECEPTURĘ</div><h2>${escapeHtml(target.name)}</h2><p class="muted">Bazowo: <b>${fmt(target.qty)} ${escapeHtml(target.unit||'g')}</b>. Zmień tylko tę wartość — pozostałe składniki zostaną pokazane po przeliczeniu.</p><label>Nowa ilość ${escapeHtml(target.unit||'')}</label><input id="ingredient-scale-value" type="number" inputmode="decimal" step="any" value="${target.qty}"><div id="ingredient-scale-preview" class="scale-preview"></div><div class="row" style="margin-top:16px;justify-content:flex-end;gap:8px"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="ingredient-scale-save">Zastosuj i zapisz proporcję</button></div></div>`);
 const preview=()=>{const v=+$("#ingredient-scale-value")?.value||target.qty; const f=target.qty?v/target.qty:1; $("#ingredient-scale-preview").innerHTML=all.map(i=>`<div class="scale-preview-row"><span>${escapeHtml(i.name)}</span><b>${fmt((+i.qty||0)*f)} ${escapeHtml(i.unit||'')}</b></div>`).join('');};
 $("#ingredient-scale-value").oninput=preview; preview();
 $("#ingredient-scale-save").onclick=async()=>{const v=+$("#ingredient-scale-value").value||target.qty;const f=target.qty?v/target.qty:1;const updated=JSON.parse(JSON.stringify(r));for(const sec of updated.sections||[])for(const i of sec.ingredients||[])i.qty=+i.qty*f;updated.updatedAt=now();await put("recipes",updated);state.recipes=await getAll("recipes");closeModal();render();toast("Nowa proporcja zapisana");};
}

async function autoScaleRecipeIngredient(){ /* deprecated: proportions are saved only after explicit confirmation */ }
function editorV14(id){
 const r=id?state.recipes.find(x=>x.id===id):(state.editTemp||makeRecipe({name:'',category:'Inne',description:'',yield:'',yieldUnit:'porcja',prep:'',cook:'',ferment:'',temp:'',tags:[],traditional:false,flag:'',servings:1,ingredients:[],steps:[],notes:'',source:'',sourceUrl:''}));
 if(!id)state.editTemp=r;const t=r.taste||{};
 const sections=(r.sections||[]).map(s=>`<div class="editor-section" data-section="${s.id}"><div class="editor-section-head"><div><span class="kicker">SEKCJA</span><input class="sec-name" value="${escapeHtml(s.name)}"></div><button class="icon-btn danger remove-sec" title="Usuń sekcję">×</button></div><div class="editor-ingredients">${(s.ingredients||[]).map(i=>`<div class="editor-ingredient ing" data-ing="${i.id||uid()}"><div class="drag-handle">☷</div><div class="editor-ingredient-name"><label>Składnik</label><input class="i-name" value="${escapeHtml(i.name)}" placeholder="np. Mąka 00"></div><div class="editor-ingredient-qty"><label>Gramatura</label><input class="i-qty" type="number" step="any" inputmode="decimal" value="${i.qty??''}" placeholder="0"></div><div class="editor-ingredient-unit"><label>Jednostka</label><select class="i-unit"><option ${i.unit==='g'?'selected':''}>g</option><option ${i.unit==='kg'?'selected':''}>kg</option><option ${i.unit==='ml'?'selected':''}>ml</option><option ${i.unit==='l'?'selected':''}>l</option><option ${i.unit==='szt.'?'selected':''}>szt.</option><option ${i.unit==='łyżka'?'selected':''}>łyżka</option><option ${i.unit==='łyżeczka'?'selected':''}>łyżeczka</option><option ${i.unit==='szczypta'?'selected':''}>szczypta</option><option ${i.unit==='porcja'?'selected':''}>porcja</option></select></div><button class="icon-btn danger remove-ing" title="Usuń składnik">×</button></div>`).join('')}</div><button class="add-row-btn add-ing">＋ Dodaj składnik</button></div>`).join('');
 return `<div class="editor-top"><button class="btn ghost" data-back="recipes">‹ Anuluj</button><button class="btn primary" data-v14-save>✓ Zapisz</button></div><div class="editor-title"><div class="kicker">EDYCJA RECEPTURY</div><h1>${id?'Edytuj recepturę':'Nowa receptura'}</h1></div>
 <section class="editor-card"><div class="editor-card-title"><div><div class="kicker">PODSTAWY</div><h2>Informacje</h2></div></div><div class="form-grid"><div class="wide"><label>Nazwa</label><input id="v14-name" value="${escapeHtml(r.name)}"></div><div><label>Kategoria</label><input id="v14-cat" value="${escapeHtml(r.category||'Inne')}"></div><div><label>Wydajność</label><input id="v14-yield" type="number" step="any" value="${r.yield??''}"></div><div><label>Jednostka</label><input id="v14-unit" value="${escapeHtml(r.yieldUnit||'porcja')}"></div><div><label>Porcje</label><input id="v14-servings" type="number" step="any" value="${r.servings??1}"></div><div><label>Rodzaj podania</label><select id="v14-serving-type"><option value="Na ciepło" ${r.servingType==='Na ciepło'?'selected':''}>Na ciepło</option><option value="Na zimno" ${r.servingType==='Na zimno'?'selected':''}>Na zimno</option><option value="Przekąska" ${r.servingType==='Przekąska'?'selected':''}>Przekąska</option></select></div><div><label>Prep min</label><input id="v14-prep" type="number" value="${r.prep??''}"></div><div><label>Gotowanie min</label><input id="v14-cook" type="number" value="${r.cook??''}"></div><div class="wide"><label>Opis</label><textarea id="v14-desc" rows="3">${escapeHtml(r.description||'')}</textarea></div></div></section>
 <section class="editor-card"><div class="editor-card-title"><div><div class="kicker">RECEPTURA</div><h2>Składniki</h2><p>Każdy składnik ma osobną nazwę, gramaturę i jednostkę.</p></div><button class="btn small" id="v14-add-section">＋ Sekcja</button></div><div id="v14-sections">${sections}</div></section>
 <section class="editor-card"><div class="editor-card-title"><div><div class="kicker">TECHNIKA</div><h2>Wykonanie krok po kroku</h2><p>Każdy etap zapisujemy osobno, żeby można go było wygodnie śledzić podczas gotowania.</p></div></div><div id="v14-steps">${(r.steps||[]).map((st,i)=>`<div class="editor-step step" data-step="${st.id||uid()}"><div class="step-number">${i+1}</div><textarea class="step-text" rows="3" placeholder="Opisz dokładnie ten etap…">${escapeHtml(st.text||'')}</textarea><button class="icon-btn danger remove-step">×</button></div>`).join('')}</div><button class="add-row-btn" id="v14-add-step">＋ Dodaj krok</button></section>
 <section class="editor-card"><div class="editor-card-title"><div><div class="kicker">DODATKOWE</div><h2>Uwagi i źródło</h2></div></div><div class="form-grid"><div class="wide"><label>Własne uwagi</label><textarea id="v14-notes" rows="4">${escapeHtml(r.notes||'')}</textarea></div><div><label>Źródło</label><input id="v14-source" value="${escapeHtml(r.source||'')}"></div><div><label>URL źródła</label><input id="v14-source-url" value="${escapeHtml(r.sourceUrl||'')}"></div><div class="wide"><label>Zdjęcie z internetu</label><input id="v14-image-url" value="${escapeHtml(r.imageUrl||'')}" placeholder="https://…"></div><div class="wide"><label>Zdjęcie z iPhone'a</label><input id="v14-image-file" type="file" accept="image/*"></div></div></section>
 <section class="editor-card"><div class="editor-card-title"><div><div class="kicker">PROFIL SMAKU</div><h2>Smak</h2></div></div><div class="taste-editor">${[['sweet','Słodki'],['sour','Kwaśny'],['salty','Słony'],['umami','Umami'],['bitter','Gorzki'],['spicy','Ostry']].map(([k,l])=>`<label><span>${l}</span><input id="v14-${k}" type="range" min="0" max="5" step="1" value="${t[k]??0}"><b>${t[k]??0}</b></label>`).join('')}</div></section>`;
}
async function saveEditorV14(){
 const old=state.editId?state.recipes.find(x=>x.id===state.editId):null;
 const r=old?JSON.parse(JSON.stringify(old)):(state.editTemp||makeRecipe({name:"Bez nazwy",category:"Inne",ingredients:[],steps:[]}));
 const val=id=>$(id)?.value||"";
 r.name=val("#v14-name").trim()||"Bez nazwy";r.category=val("#v14-cat");r.yield=+val("#v14-yield")||0;r.yieldUnit=val("#v14-unit").trim()||"porcja";r.servings=+val("#v14-servings")||1;r.servingType=val("#v14-serving-type")||"Na ciepło";r.prep=+val("#v14-prep")||0;r.cook=+val("#v14-cook")||0;r.ferment=+val("#v14-ferment")||0;r.description=val("#v14-desc");r.notes=val("#v14-notes");r.source=val("#v14-source");r.sourceUrl=val("#v14-source-url");r.imageUrl=val("#v14-image-url").trim();
 r.taste={sweet:+val("#v14-sweet")||0,sour:+val("#v14-sour")||0,salty:+val("#v14-salty")||0,umami:+val("#v14-umami")||0,bitter:+val("#v14-bitter")||0,spicy:+val("#v14-spicy")||0};
 r.sections=$$("#main .editor-section").map(sec=>({id:sec.dataset.section||uid(),name:sec.querySelector(".sec-name")?.value.trim()||"Sekcja",ingredients:[...sec.querySelectorAll(".editor-ingredient")].map(el=>({id:el.dataset.ing||uid(),name:el.querySelector(".i-name")?.value.trim()||"",qty:+el.querySelector(".i-qty")?.value||0,unit:el.querySelector(".i-unit")?.value||"g"})).filter(i=>i.name)}));
 r.steps=$$("#main .editor-step").map(el=>({id:el.dataset.step||uid(),text:el.querySelector(".step-text")?.value.trim()||""})).filter(x=>x.text);
 const file=$("#v14-image-file")?.files?.[0];if(file)r.image=await compressImage(file);else if(!r.imageUrl&&old?.image)r.image=old.image;r.updatedAt=now();
 if(old)await put("history",{id:uid(),recipeId:r.id,date:now(),snapshot:old,summary:"Zapisano zmianę receptury"});await put("recipes",r);state.recipes=await getAll("recipes");state.route="recipe";state.selectedId=r.id;delete state.editTemp;render();toast("Receptura zapisana");
}

const EXTRA_V14=[
["Spaghetti alla carbonara","Włochy","Pasta",[["spaghetti",400,"g"],["guanciale",180,"g"],["żółtka",6,"szt."],["Pecorino Romano",120,"g"],["pieprz",6,"g"]],{"sweet":0,"sour":0,"salty":4,"umami":5,"bitter":1,"spicy":2}],
["Cacio e pepe","Włochy","Pasta",[["tonnarelli",300,"g"],["Pecorino Romano",150,"g"],["pieprz",10,"g"]],{"sweet":0,"sour":0,"salty":5,"umami":5,"bitter":1,"spicy":2}],
["Pasta alla puttanesca","Włochy","Pasta",[["spaghetti",400,"g"],["pomidory",500,"g"],["oliwki",100,"g"],["kapary",40,"g"],["anchois",40,"g"],["czosnek",20,"g"]],{"sweet":2,"sour":3,"salty":5,"umami":5,"bitter":1,"spicy":2}],
["Pasta al pomodoro","Włochy","Pasta",[["spaghetti",400,"g"],["pomidory",700,"g"],["oliwa",50,"ml"],["czosnek",15,"g"],["bazylia",20,"g"]],{"sweet":3,"sour":3,"salty":2,"umami":3,"bitter":0,"spicy":1}],
["Risotto alla Milanese","Włochy","Ryż",[["ryż arborio",320,"g"],["bulion",1200,"ml"],["szafran",1,"g"],["masło",80,"g"],["Parmigiano",100,"g"]],{"sweet":1,"sour":0,"salty":3,"umami":5,"bitter":1,"spicy":0}],
["Panzanella","Włochy","Sałatki",[["czerstwy chleb",300,"g"],["pomidory",500,"g"],["cebula",100,"g"],["bazylia",20,"g"],["oliwa",60,"ml"],["ocet winny",30,"ml"]],{"sweet":3,"sour":4,"salty":3,"umami":2,"bitter":1,"spicy":0}],
["Arancini","Włochy","Ryż",[["ryż risotto",400,"g"],["mozzarella",150,"g"],["passata",300,"g"],["jajka",2,"szt."],["bułka tarta",180,"g"]],{"sweet":2,"sour":2,"salty":4,"umami":4,"bitter":0,"spicy":0}],
["Pasta e fagioli","Włochy","Zupy",[["fasola",400,"g"],["makaron",180,"g"],["pomidory",400,"g"],["seler",100,"g"],["cebula",150,"g"],["oliwa",50,"ml"]],{"sweet":2,"sour":2,"salty":3,"umami":4,"bitter":1,"spicy":0}],
["Pho Ga","Wietnam","Zupy",[["kurczak",1000,"g"],["makaron ryżowy",400,"g"],["cebula",250,"g"],["imbir",70,"g"],["anyż",4,"szt."],["cynamon",2,"szt."]],{"sweet":2,"sour":1,"salty":4,"umami":5,"bitter":1,"spicy":1}],
["Bun Cha","Wietnam","Mięso",[["wieprzowina mielona",500,"g"],["makaron ryżowy",300,"g"],["sos rybny",50,"ml"],["cukier",30,"g"],["czosnek",20,"g"],["marchew",150,"g"]],{"sweet":4,"sour":4,"salty":5,"umami":5,"bitter":1,"spicy":3}],
["Banh Mi","Wietnam","Pieczywo",[["bagietka",4,"szt."],["wieprzowina",500,"g"],["pasztet",150,"g"],["marchew",150,"g"],["ogórek",150,"g"],["kolendra",30,"g"]],{"sweet":2,"sour":4,"salty":4,"umami":5,"bitter":1,"spicy":2}],
["Pad Thai","Tajlandia","Pasta",[["makaron ryżowy",250,"g"],["tofu",150,"g"],["jajka",2,"szt."],["pasta tamaryndowa",50,"g"],["sos rybny",30,"ml"],["kiełki",150,"g"],["orzeszki",60,"g"]],{"sweet":3,"sour":4,"salty":5,"umami":4,"bitter":1,"spicy":3}],
["Tom Kha Gai","Tajlandia","Zupy",[["kurczak",500,"g"],["mleko kokosowe",600,"ml"],["galangal",30,"g"],["trawa cytrynowa",30,"g"],["liście kaffiru",5,"szt."],["sok z limonki",60,"ml"]],{"sweet":4,"sour":5,"salty":4,"umami":5,"bitter":1,"spicy":3}],
["Massaman Curry","Tajlandia","Mięso",[["wołowina",700,"g"],["mleko kokosowe",600,"ml"],["pasta massaman",80,"g"],["ziemniaki",400,"g"],["orzeszki",80,"g"],["cebula",200,"g"]],{"sweet":4,"sour":2,"salty":5,"umami":5,"bitter":1,"spicy":3}],
["Khao Pad","Tajlandia","Ryż",[["ryż ugotowany",500,"g"],["jajka",2,"szt."],["kurczak",250,"g"],["sos rybny",25,"ml"],["sos sojowy",20,"ml"],["dymka",50,"g"]],{"sweet":1,"sour":1,"salty":5,"umami":4,"bitter":0,"spicy":1}],
["Miso Shiru","Japonia","Zupy",[["dashi",1000,"ml"],["miso",80,"g"],["tofu",250,"g"],["wakame",10,"g"],["dymka",40,"g"]],{"sweet":1,"sour":0,"salty":5,"umami":5,"bitter":0,"spicy":0}],
["Karaage","Japonia","Mięso",[["udka z kurczaka",700,"g"],["sos sojowy",50,"ml"],["imbir",20,"g"],["czosnek",15,"g"],["skrobia ziemniaczana",120,"g"],["olej",1000,"ml"]],{"sweet":1,"sour":1,"salty":5,"umami":5,"bitter":1,"spicy":2}],
["Okonomiyaki","Japonia","Warzywa",[["kapusta",500,"g"],["mąka",120,"g"],["jajka",2,"szt."],["dashi",150,"ml"],["boczek",120,"g"],["sos okonomiyaki",70,"ml"]],{"sweet":3,"sour":1,"salty":4,"umami":5,"bitter":0,"spicy":1}],
["Sukiyaki","Japonia","Mięso",[["wołowina",500,"g"],["tofu",300,"g"],["grzyby",200,"g"],["cebula",150,"g"],["sos sojowy",100,"ml"],["mirin",80,"ml"]],{"sweet":4,"sour":0,"salty":5,"umami":5,"bitter":0,"spicy":0}],
["Ramen Shoyu","Japonia","Zupy",[["bulion",1400,"ml"],["sos sojowy",100,"ml"],["makaron ramen",500,"g"],["jajka",4,"szt."],["nori",4,"szt."],["dymka",60,"g"]],{"sweet":1,"sour":0,"salty":5,"umami":5,"bitter":1,"spicy":1}],
["Mapo Tofu","Chiny","Mięso",[["tofu",600,"g"],["wieprzowina",200,"g"],["doubanjiang",50,"g"],["sos sojowy",30,"ml"],["pieprz syczuański",8,"g"],["bulion",250,"ml"]],{"sweet":1,"sour":0,"salty":5,"umami":5,"bitter":1,"spicy":5}],
["Kung Pao Chicken","Chiny","Mięso",[["kurczak",600,"g"],["orzeszki",120,"g"],["sos sojowy",50,"ml"],["ocet ryżowy",30,"ml"],["chili",20,"g"],["dymka",60,"g"]],{"sweet":3,"sour":3,"salty":4,"umami":5,"bitter":1,"spicy":5}],
["Jiaozi","Chiny","Mączne",[["mąka",500,"g"],["woda",260,"ml"],["wieprzowina",400,"g"],["kapusta",250,"g"],["imbir",20,"g"],["sos sojowy",30,"ml"]],{"sweet":1,"sour":1,"salty":4,"umami":5,"bitter":0,"spicy":2}],
["Char Siu","Chiny","Mięso",[["wieprzowina",1000,"g"],["miód",70,"g"],["hoisin",80,"g"],["sos sojowy",50,"ml"],["five spice",8,"g"]],{"sweet":5,"sour":1,"salty":4,"umami":5,"bitter":1,"spicy":1}],
["Butter Chicken","Indie","Mięso",[["kurczak",700,"g"],["jogurt",180,"g"],["pomidory",500,"g"],["masło",80,"g"],["śmietanka",150,"ml"],["garam masala",10,"g"]],{"sweet":3,"sour":2,"salty":4,"umami":5,"bitter":1,"spicy":3}],
["Palak Paneer","Indie","Warzywa",[["szpinak",700,"g"],["paneer",350,"g"],["cebula",180,"g"],["czosnek",25,"g"],["imbir",25,"g"],["garam masala",8,"g"]],{"sweet":1,"sour":1,"salty":3,"umami":4,"bitter":2,"spicy":3}],
["Dal Tadka","Indie","Zupy",[["soczewica",400,"g"],["pomidory",250,"g"],["cebula",150,"g"],["ghee",50,"g"],["kumin",8,"g"],["czosnek",20,"g"]],{"sweet":2,"sour":2,"salty":3,"umami":4,"bitter":1,"spicy":3}],
["Naan","Indie","Pieczywo",[["mąka",500,"g"],["jogurt",120,"g"],["woda",180,"ml"],["drożdże",5,"g"],["sól",8,"g"],["ghee",40,"g"]],{"sweet":1,"sour":2,"salty":3,"umami":2,"bitter":0,"spicy":0}],
["Moussaka","Grecja","Warzywa",[["bakłażan",900,"g"],["wołowina",500,"g"],["pomidory",400,"g"],["cebula",200,"g"],["mleko",500,"ml"],["masło",50,"g"],["mąka",50,"g"]],{"sweet":2,"sour":2,"salty":4,"umami":5,"bitter":1,"spicy":0}],
["Tzatziki","Grecja","Sosy",[["jogurt grecki",500,"g"],["ogórek",300,"g"],["czosnek",15,"g"],["oliwa",30,"ml"],["koperek",20,"g"],["cytryna",20,"ml"]],{"sweet":0,"sour":4,"salty":3,"umami":2,"bitter":0,"spicy":1}],
["Spanakopita","Grecja","Warzywa",[["szpinak",700,"g"],["feta",350,"g"],["ciasto filo",500,"g"],["cebula",150,"g"],["koperek",30,"g"],["oliwa",80,"ml"]],{"sweet":1,"sour":2,"salty":5,"umami":4,"bitter":1,"spicy":0}],
["Baklava","Turcja","Desery",[["ciasto filo",500,"g"],["orzechy",300,"g"],["masło",180,"g"],["cukier",250,"g"],["miód",100,"g"],["cytryna",20,"ml"]],{"sweet":5,"sour":1,"salty":1,"umami":1,"bitter":0,"spicy":0}],
["Menemen","Turcja","Jajka",[["jajka",4,"szt."],["pomidory",400,"g"],["papryka",180,"g"],["cebula",100,"g"],["masło",40,"g"],["chili",5,"g"]],{"sweet":2,"sour":3,"salty":3,"umami":3,"bitter":1,"spicy":3}],
["Adana Kebab","Turcja","Mięso",[["baranina mielona",700,"g"],["tłuszcz barani",100,"g"],["papryka",80,"g"],["chili",15,"g"],["sól",12,"g"]],{"sweet":1,"sour":1,"salty":4,"umami":5,"bitter":1,"spicy":5}],
["Ratatouille","Francja","Warzywa",[["bakłażan",400,"g"],["cukinia",400,"g"],["pomidory",600,"g"],["papryka",300,"g"],["cebula",200,"g"],["czosnek",20,"g"]],{"sweet":3,"sour":2,"salty":3,"umami":4,"bitter":1,"spicy":0}],
["Coq au vin","Francja","Mięso",[["kurczak",1200,"g"],["czerwone wino",500,"ml"],["boczek",200,"g"],["cebula",200,"g"],["pieczarki",300,"g"],["marchew",150,"g"]],{"sweet":2,"sour":2,"salty":4,"umami":5,"bitter":2,"spicy":0}],
["Quiche Lorraine","Francja","Pieczywo",[["mąka",250,"g"],["masło",125,"g"],["boczek",200,"g"],["jajka",4,"szt."],["śmietanka",250,"ml"],["ser",100,"g"]],{"sweet":1,"sour":0,"salty":5,"umami":5,"bitter":0,"spicy":0}],
["Paella Valenciana","Hiszpania","Ryż",[["ryż",350,"g"],["kurczak",400,"g"],["królik",300,"g"],["fasolka",180,"g"],["pomidory",150,"g"],["szafran",1,"g"]],{"sweet":2,"sour":1,"salty":4,"umami":5,"bitter":1,"spicy":0}],
["Tortilla Española","Hiszpania","Jajka",[["ziemniaki",700,"g"],["jajka",6,"szt."],["cebula",250,"g"],["oliwa",250,"ml"],["sól",10,"g"]],{"sweet":2,"sour":0,"salty":4,"umami":3,"bitter":0,"spicy":0}],
["Gazpacho","Hiszpania","Zupy",[["pomidory",800,"g"],["ogórek",250,"g"],["papryka",150,"g"],["czosnek",10,"g"],["oliwa",70,"ml"],["ocet",30,"ml"]],{"sweet":3,"sour":4,"salty":3,"umami":2,"bitter":1,"spicy":1}],
["Pulpo a la Gallega","Hiszpania","Owoce morza",[["ośmiornica",1200,"g"],["ziemniaki",600,"g"],["papryka",10,"g"],["oliwa",60,"ml"],["sól",8,"g"]],{"sweet":1,"sour":0,"salty":4,"umami":5,"bitter":0,"spicy":1}],
["Goulash","Węgry","Mięso",[["wołowina",1000,"g"],["cebula",400,"g"],["papryka",30,"g"],["papryka świeża",200,"g"],["kminek",5,"g"],["smalec",40,"g"]],{"sweet":2,"sour":1,"salty":4,"umami":5,"bitter":1,"spicy":2}],
["Pierogi ruskie","Polska","Mączne",[["mąka",500,"g"],["woda",250,"ml"],["ziemniaki",700,"g"],["twaróg",300,"g"],["cebula",200,"g"],["masło",50,"g"]],{"sweet":1,"sour":1,"salty":4,"umami":4,"bitter":0,"spicy":0}],
["Żurek","Polska","Zupy",[["zakwas żytni",700,"ml"],["biała kiełbasa",500,"g"],["ziemniaki",500,"g"],["wędzonka",200,"g"],["czosnek",15,"g"],["majeranek",8,"g"]],{"sweet":1,"sour":5,"salty":5,"umami":5,"bitter":1,"spicy":1}],
["Bigos","Polska","Mięso",[["kapusta kiszona",1200,"g"],["kapusta biała",600,"g"],["wieprzowina",500,"g"],["kiełbasa",400,"g"],["śliwki suszone",100,"g"],["grzyby",40,"g"]],{"sweet":3,"sour":5,"salty":5,"umami":5,"bitter":1,"spicy":1}],
["Ceviche","Peru","Ryby",[["biała ryba",600,"g"],["sok z limonki",180,"ml"],["cebula",150,"g"],["kolendra",30,"g"],["chili",15,"g"],["sól",8,"g"]],{"sweet":1,"sour":5,"salty":4,"umami":4,"bitter":1,"spicy":4}],
["Lomo Saltado","Peru","Mięso",[["wołowina",600,"g"],["cebula",200,"g"],["pomidor",250,"g"],["sos sojowy",50,"ml"],["ocet",25,"ml"],["frytki",500,"g"]],{"sweet":2,"sour":3,"salty":5,"umami":5,"bitter":1,"spicy":2}],
["Feijoada","Brazylia","Mięso",[["czarna fasola",700,"g"],["wieprzowina",500,"g"],["kiełbasa",300,"g"],["boczek",200,"g"],["cebula",250,"g"],["czosnek",25,"g"]],{"sweet":2,"sour":1,"salty":5,"umami":5,"bitter":1,"spicy":2}],
["Moqueca","Brazylia","Ryby",[["ryba",700,"g"],["krewetki",300,"g"],["mleko kokosowe",400,"ml"],["pomidory",300,"g"],["papryka",200,"g"],["olej palmowy",40,"ml"]],{"sweet":3,"sour":2,"salty":4,"umami":5,"bitter":0,"spicy":2}],
["Harira","Maroko","Zupy",[["ciecierzyca",300,"g"],["soczewica",200,"g"],["pomidory",600,"g"],["seler",100,"g"],["cebula",150,"g"],["kolendra",30,"g"]],{"sweet":2,"sour":3,"salty":4,"umami":4,"bitter":1,"spicy":2}],
["Tagine z kurczakiem i cytryną","Maroko","Mięso",[["kurczak",900,"g"],["cytryny kiszone",100,"g"],["oliwki",120,"g"],["cebula",250,"g"],["imbir",15,"g"],["szafran",1,"g"]],{"sweet":1,"sour":5,"salty":5,"umami":4,"bitter":1,"spicy":2}],
["Hummus","Liban","Sosy",[["ciecierzyca",500,"g"],["tahini",180,"g"],["sok z cytryny",80,"ml"],["czosnek",15,"g"],["oliwa",50,"ml"],["sól",10,"g"]],{"sweet":1,"sour":5,"salty":4,"umami":4,"bitter":0,"spicy":1}],
["Falafel","Liban","Warzywa",[["sucha ciecierzyca",500,"g"],["cebula",150,"g"],["pietruszka",50,"g"],["kolendra",30,"g"],["czosnek",20,"g"],["kumin",8,"g"]],{"sweet":1,"sour":1,"salty":4,"umami":4,"bitter":1,"spicy":2}],
["Kimchi Jjigae","Korea","Zupy",[["kimchi",500,"g"],["wieprzowina",300,"g"],["tofu",300,"g"],["bulion",900,"ml"],["gochujang",40,"g"],["dymka",50,"g"]],{"sweet":2,"sour":5,"salty":5,"umami":5,"bitter":1,"spicy":5}],
["Bulgogi","Korea","Mięso",[["wołowina",700,"g"],["sos sojowy",80,"ml"],["gruszka",150,"g"],["czosnek",25,"g"],["olej sezamowy",20,"ml"],["cukier",25,"g"]],{"sweet":4,"sour":1,"salty":5,"umami":5,"bitter":0,"spicy":2}],
["Bibimbap","Korea","Ryż",[["ryż",300,"g"],["wołowina",250,"g"],["szpinak",150,"g"],["marchew",150,"g"],["kiełki",120,"g"],["jajka",2,"szt."]],{"sweet":2,"sour":1,"salty":4,"umami":5,"bitter":1,"spicy":4}],
["Tacos al Pastor","Meksyk","Mięso",[["wieprzowina",800,"g"],["achiote",30,"g"],["ancho chili",25,"g"],["ananas",250,"g"],["cebula",150,"g"],["tortille",8,"szt."]],{"sweet":4,"sour":2,"salty":4,"umami":5,"bitter":1,"spicy":4}],
["Mole Poblano","Meksyk","Sosy",[["suszone chili",100,"g"],["pomidory",300,"g"],["cebula",150,"g"],["migdały",60,"g"],["sezam",40,"g"],["kakao",25,"g"]],{"sweet":3,"sour":2,"salty":4,"umami":5,"bitter":3,"spicy":5}],
["Guacamole","Meksyk","Sosy",[["awokado",500,"g"],["limonka",60,"ml"],["cebula",80,"g"],["kolendra",20,"g"],["jalapeño",20,"g"],["sól",8,"g"]],{"sweet":2,"sour":5,"salty":4,"umami":2,"bitter":1,"spicy":4}],
["Fish and Chips","Wielka Brytania","Ryby",[["dorsz",700,"g"],["mąka",200,"g"],["piwo",300,"ml"],["ziemniaki",1000,"g"],["olej",1500,"ml"]],{"sweet":2,"sour":1,"salty":4,"umami":4,"bitter":1,"spicy":1}],
["Shepherd's Pie","Wielka Brytania","Mięso",[["jagnięcina",700,"g"],["marchew",200,"g"],["groszek",200,"g"],["cebula",180,"g"],["ziemniaki",1000,"g"],["masło",60,"g"]],{"sweet":2,"sour":1,"salty":4,"umami":5,"bitter":1,"spicy":1}],
["Crème brûlée","Francja","Desery",[["śmietanka",600,"ml"],["żółtka",6,"szt."],["cukier",100,"g"],["wanilia",1,"szt."]],{"sweet":5,"sour":0,"salty":1,"umami":1,"bitter":2,"spicy":0}],
["Tiramisu","Włochy","Desery",[["mascarpone",500,"g"],["jajka",4,"szt."],["cukier",100,"g"],["biszkopty",250,"g"],["espresso",300,"ml"],["kakao",20,"g"]],{"sweet":5,"sour":0,"salty":1,"umami":1,"bitter":3,"spicy":0}]
];
async function seedV14(){
 for(const [name,cuisine,category,ings,taste] of EXTRA_V14){
  if(state.recipes.some(r=>r.name===name&&r.traditional))continue;
  const r=makeRecipe({name,cuisine,category,description:`Klasyczne danie kuchni ${cuisine}.`,yield:4,yieldUnit:"porcja",servings:4,prep:20,cook:30,ferment:0,temp:0,tags:[cuisine.toLowerCase(),"tradycyjne"],traditional:true,flag:"",ingredients:ings,steps:["Przygotuj i odmierz składniki.","Wykonaj kolejne etapy zgodnie z techniką dania.","Dopraw do równowagi i podawaj na gorąco lub zgodnie z tradycją."],notes:"Warianty regionalne mogą różnić się składnikami i techniką.",source:"Wikibooks Cookbook",sourceUrl:`https://en.wikibooks.org/wiki/Cookbook:Cuisines`,license:"Opracowanie Kucharzyny na podstawie wolnej bazy Wikibooks; CC BY-SA 4.0.",taste});
  await put("recipes",r);
 }
}
function initV14Enhance(){
 state.recipes=state.recipes.map(r=>{if(!r.taste)r.taste={sweet:1,sour:1,salty:3,umami:3,bitter:0,spicy:0};return r});
}
function renderV14(){
 $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.route===state.route));
 if(state.route==="recipe")$("#main").innerHTML=recipeViewV14(state.selectedId);
 else if(state.route==="edit")$("#main").innerHTML=editorV14(state.editId);
 else if(state.route==="traditional")$("#main").innerHTML=viewTraditionalV14();
 else if(state.route==="calculators")$("#main").innerHTML=viewCalculatorsV14();
 else if(state.route==="cook")$("#main").innerHTML=viewCook();
 else {
  const oldRender=render;
  // route through original render by temporarily changing route only for base views
  if(state.route==="start"||state.route==="recipes"||state.route==="shopping"||state.route==="settings") {
    const views={start:viewStart,recipes:viewRecipes,shopping:viewShopping,settings:viewSettings};
    $("#main").innerHTML=(views[state.route]||viewStart)();
  } else $("#main").innerHTML=viewStart();
 }
 bindV14(); if(["start","recipes","shopping","settings","cook"].includes(state.route)) bind();
}
function renumberEditorSteps(){$$("#main .editor-step").forEach((el,i)=>{const n=el.querySelector(".step-number");if(n)n.textContent=i+1})}
function bindV14(){
 $$(".nav-btn").forEach(b=>b.onclick=()=>nav(b.dataset.route));
 $$("#main [data-back]").forEach(b=>b.onclick=()=>nav(b.dataset.back||"recipes"));
 $$("#main [data-open]").forEach(b=>b.onclick=e=>{if(e.target.closest("[data-fav]"))return;const r=state.recipes.find(x=>x.id===b.dataset.open);if(!r)return;r.lastUsedAt=now();put("recipes",r);state.selectedId=r.id;state.route="recipe";renderV14()});
 $$("#main [data-fav]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const r=state.recipes.find(x=>x.id===b.dataset.fav);if(!r)return;r.favorite=!r.favorite;await put("recipes",r);renderV14()});
 $$("#main [data-cook]").forEach(b=>b.onclick=()=>{state.selectedId=b.dataset.cook;state.route="cook";render()});
 $$("#main [data-scale]").forEach(b=>b.onclick=()=>scaleModal(b.dataset.scale)); $$("#main [data-recipe-ing]").forEach(btn=>btn.onclick=()=>ingredientScaleModal(state.selectedId,btn.dataset.recipeIng));
 $$("#main [data-edit]").forEach(b=>b.onclick=()=>{state.editId=b.dataset.edit;state.route="edit";renderV14()});
 $$("#main [data-shop-recipe]").forEach(b=>b.onclick=()=>addRecipeShopping(b.dataset.shopRecipe));
 $$("#main [data-trad-v14]").forEach(b=>b.onclick=()=>{state.tradCatV14=b.dataset.tradV14;renderV14()});
 const tq=$("#traditionalSearchV14");if(tq)tq.oninput=()=>{state.traditionalQueryV14=tq.value;renderV14();setTimeout(()=>$("#traditionalSearchV14")?.focus(),0)};
 if(state.route==="calculators"){
  $("#v14-mode-dough")?.addEventListener("click",()=>{pizzaModeV14="dough";renderV14()});
  $("#v14-mode-flour")?.addEventListener("click",()=>{pizzaModeV14="flour";renderV14()});
  $$("#v14-pizza-inputs input").forEach(x=>x.oninput=pizzaCalcV14);pizzaCalcV14();
  pizzaProfilesV14();
  $("#v14-save-profile")?.addEventListener("click",async()=>{const p=state.pizzaV14||{};openModal(`<h2>Zapisz profil pizzy</h2><input id="v14-profile-name" placeholder="Np. Napoli 65% / 24h"><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="v14-profile-ok">Zapisz</button></div>`);$("#v14-profile-ok").onclick=async()=>{const name=$("#v14-profile-name").value.trim();if(!name)return;await put("pizzaProfiles",{id:uid(),name,mode:pizzaModeV14,values:{...p}});state.pizzaProfiles=await getAll("pizzaProfiles");closeModal();renderV14();toast("Profil zapisany")}});
 }
 if(state.route==="edit"){$$("#main [data-v14-save]").forEach(b=>b.onclick=saveEditorV14);$$("#main .remove-sec").forEach(b=>b.onclick=()=>{b.closest(".editor-section").remove()});$$("#main .remove-ing").forEach(b=>b.onclick=()=>{b.closest(".editor-ingredient").remove()});$$("#main .remove-step").forEach(b=>b.onclick=()=>{b.closest(".editor-step").remove();renumberEditorSteps()});$("#v14-add-section")?.addEventListener("click",()=>{$("#v14-sections").insertAdjacentHTML("beforeend",`<div class="editor-section" data-section="${uid()}"><div class="editor-section-head"><div><span class="kicker">SEKCJA</span><input class="sec-name" value="Nowa sekcja"></div><button class="icon-btn danger remove-sec">×</button></div><div class="editor-ingredients"></div><button class="add-row-btn add-ing">＋ Dodaj składnik</button></div>`);bindV14()});$("#v14-add-step")?.addEventListener("click",()=>{$("#v14-steps").insertAdjacentHTML("beforeend",`<div class="editor-step step" data-step="${uid()}"><div class="step-number"></div><textarea class="step-text" rows="3" placeholder="Opisz dokładnie ten etap…"></textarea><button class="icon-btn danger remove-step">×</button></div>`);renumberEditorSteps();bindV14()});$$("#main .add-ing").forEach(b=>b.onclick=()=>{b.closest(".editor-section").querySelector(".editor-ingredients").insertAdjacentHTML("beforeend",`<div class="editor-ingredient ing" data-ing="${uid()}"><div class="drag-handle">☷</div><div class="editor-ingredient-name"><label>Składnik</label><input class="i-name" placeholder="np. Mąka 00"></div><div class="editor-ingredient-qty"><label>Gramatura</label><input class="i-qty" type="number" step="any" inputmode="decimal"></div><div class="editor-ingredient-unit"><label>Jednostka</label><select class="i-unit"><option selected>g</option><option>kg</option><option>ml</option><option>l</option><option>szt.</option><option>łyżka</option><option>łyżeczka</option><option>szczypta</option><option>porcja</option></select></div><button class="icon-btn danger remove-ing">×</button></div>`);bindV14()});renumberEditorSteps();} 
}
const originalRenderV14=render;
render=function(){renderV20()};

window.addEventListener("error",event=>{
  try{console.error("Kucharzyna runtime error",event.error||event.message)}catch(e){}
  if(document.readyState!=="loading")toast("Kucharzyna napotkała błąd. Spróbuj ponownie.");
});
window.addEventListener("unhandledrejection",event=>{
  try{console.error("Kucharzyna rejected promise",event.reason)}catch(e){}
  event.preventDefault();
  if(document.readyState!=="loading")toast("Nie udało się wykonać operacji. Dane lokalne pozostały bez zmian.");
});


/* ============================================================
   Kucharzyna 3.2.1 — complete recipe photo library + serving type
   ============================================================ */
const K32_PHOTO_MAP={
  "Pizza Napoletana":"./photo-pizza.webp",
  "Carbonara":"./photo-carbonara.webp",
  "Sos pomidorowy":"./photo-tomato.webp",
  "Spaghetti alla carbonara":"./photo-spaghetti-alla-carbonara.webp",
  "Cacio e pepe":"./photo-cacio-e-pepe.webp",
  "Pasta alla puttanesca":"./photo-pasta-alla-puttanesca.webp",
  "Pasta al pomodoro":"./photo-pasta-al-pomodoro.webp",
  "Risotto alla Milanese":"./photo-risotto-alla-milanese.webp",
  "Panzanella":"./photo-panzanella.webp",
  "Arancini":"./photo-arancini.webp",
  "Pasta e fagioli":"./photo-pasta-e-fagioli.webp",
  "Pho Ga":"./photo-pho-ga.webp",
  "Bun Cha":"./photo-bun-cha.webp",
  "Banh Mi":"./photo-banh-mi.webp",
  "Pad Thai":"./photo-pad-thai.webp",
  "Tom Kha Gai":"./photo-tom-kha-gai.webp",
  "Massaman Curry":"./photo-massaman-curry.webp",
  "Khao Pad":"./photo-khao-pad.webp",
  "Miso Shiru":"./photo-miso-shiru.webp",
  "Karaage":"./photo-karaage.webp",
  "Okonomiyaki":"./photo-okonomiyaki.webp",
  "Sukiyaki":"./photo-sukiyaki.webp",
  "Ramen Shoyu":"./photo-ramen-shoyu.webp",
  "Mapo Tofu":"./photo-mapo-tofu.webp",
  "Kung Pao Chicken":"./photo-kung-pao-chicken.webp",
  "Jiaozi":"./photo-jiaozi.webp",
  "Char Siu":"./photo-char-siu.webp",
  "Butter Chicken":"./photo-butter-chicken.webp",
  "Palak Paneer":"./photo-palak-paneer.webp",
  "Dal Tadka":"./photo-dal-tadka.webp",
  "Naan":"./photo-naan.webp",
  "Moussaka":"./photo-moussaka.webp",
  "Tzatziki":"./photo-tzatziki.webp",
  "Spanakopita":"./photo-spanakopita.webp",
  "Baklava":"./photo-baklava.webp",
  "Menemen":"./photo-menemen.webp",
  "Adana Kebab":"./photo-adana-kebab.webp",
  "Ratatouille":"./photo-ratatouille.webp",
  "Coq au vin":"./photo-coq-au-vin.webp",
  "Quiche Lorraine":"./photo-quiche-lorraine.webp",
  "Paella Valenciana":"./photo-paella-valenciana.webp",
  "Tortilla Española":"./photo-tortilla-espa-ola.webp",
  "Gazpacho":"./photo-gazpacho.webp",
  "Pulpo a la Gallega":"./photo-pulpo-a-la-gallega.webp",
  "Goulash":"./photo-goulash.webp",
  "Pierogi ruskie":"./photo-pierogi-ruskie.webp",
  "Żurek":"./photo-zurek.webp",
  "Bigos":"./photo-bigos.webp",
  "Ceviche":"./photo-ceviche.webp",
  "Lomo Saltado":"./photo-lomo-saltado.webp",
  "Feijoada":"./photo-feijoada.webp",
  "Moqueca":"./photo-moqueca.webp",
  "Harira":"./photo-harira.webp",
  "Tagine z kurczakiem i cytryną":"./photo-tagine-z-kurczakiem-i-cytryna.webp",
  "Hummus":"./photo-hummus.webp",
  "Falafel":"./photo-falafel.webp",
  "Kimchi Jjigae":"./photo-kimchi-jjigae.webp",
  "Bulgogi":"./photo-bulgogi.webp",
  "Bibimbap":"./photo-bibimbap.webp",
  "Tacos al Pastor":"./photo-tacos-al-pastor.webp",
  "Mole Poblano":"./photo-mole-poblano.webp",
  "Guacamole":"./photo-guacamole.webp",
  "Fish and Chips":"./photo-fish-and-chips.webp",
  "Shepherd's Pie":"./photo-shepherd-s-pie.webp",
  "Crème brûlée":"./photo-cr-me-br-l-e.webp",
  "Tiramisu":"./photo-tiramisu.webp"
};
const K32_COLD=new Set(["Panzanella","Tzatziki","Gazpacho","Ceviche","Hummus","Guacamole","Tiramisu","Crème brûlée"]);
const K32_SNACK=new Set(["Arancini","Banh Mi","Jiaozi","Falafel","Tacos al Pastor"]);
function k32ServingTypeFor(r){
  if(r?.servingType==='Na ciepło'||r?.servingType==='Na zimno'||r?.servingType==='Przekąska')return r.servingType;
  if(K32_COLD.has(r?.name))return 'Na zimno';
  if(K32_SNACK.has(r?.name))return 'Przekąska';
  return 'Na ciepło';
}
const _k32RecipeImageFinal=recipeImage;
recipeImage=function(r){return K32_PHOTO_MAP[r?.name]||_k32RecipeImageFinal(r)};
async function k32MigrateRecipePresentation(){
  try{
    const all=await getAll('recipes'); let changed=0;
    for(const r of all){
      const type=k32ServingTypeFor(r);
      const image=K32_PHOTO_MAP[r.name]||r.image;
      if(r.servingType!==type || (K32_PHOTO_MAP[r.name]&&r.image!==image)){
        r.servingType=type;
        if(K32_PHOTO_MAP[r.name]){r.image=image;r.imageSource='bundled';r.imageCredit='Zdjęcie Kucharzyny';}
        r.updatedAt=now(); await put('recipes',r); changed++;
      }
    }
    state.recipes=await getAll('recipes');
    return changed;
  }catch(e){console.error('Recipe presentation migration failed',e);return 0;}
}
const _k32CookViewFinal=viewCookV20;
viewCookV20=function(){
  const r=state.recipes.find(x=>x.id===state.selectedId);
  const html=_k32CookViewFinal();
  if(!r)return html;
  return html.replace(/<p>(.*?) · (?:.*?°C · )?(.*?)<\/p>/,`<p>${escapeHtml(r.category||'Receptura')} · ${escapeHtml(k32ServingTypeFor(r))} · $2</p>`);
};

init().then(async()=>{
  try{
    await seedV14();
    state.recipes=await getAll("recipes");
    state.pizzaProfiles=await getAll("pizzaProfiles");
    normalizeRecipes();
    await k32MigrateRecipePresentation();
    enrichRecipeDescriptions();
    for(const r of state.recipes)await put("recipes",r);
    initV14Enhance();
    renderV20();
  }catch(error){
    console.error("Kucharzyna initialization error",error);
    try{toast("Nie udało się wczytać wszystkich danych. Odśwież aplikację.")}catch(e){}
  }
}).catch(error=>{
  console.error("Kucharzyna startup error",error);
  try{document.querySelector("#main").innerHTML='<section class="card"><h1>Nie udało się uruchomić Kucharzyny</h1><p>Twoje dane nie są usuwane. Odśwież aplikację i spróbuj ponownie.</p><button class="btn primary" onclick="location.reload()">Odśwież</button></section>'}catch(e){}
});


/* v1.9 repair layer: Amateur is a separate UI + system dark mode + complete recipe hydration */
let systemThemeMQ=null;
function systemThemeSync(){
  systemThemeMQ ||= matchMedia('(prefers-color-scheme: dark)');
  const sync=()=>{ if(state.settings.theme==='system'){document.documentElement.classList.toggle('dark',systemThemeMQ.matches);} };
  if(!systemThemeMQ.__kucharzynaBound){systemThemeMQ.addEventListener?.('change',sync);systemThemeMQ.__kucharzynaBound=true;}
  sync();
}
const _applyTheme=applyTheme;
applyTheme=function(){
  document.body.classList.toggle('amateur',state.settings.profile==='amateur');
  document.body.dataset.profile=state.settings.profile;
  let t=state.settings.theme;
  if(t==='system') t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.classList.toggle('dark',t==='dark');
  systemThemeSync();
};

function amateurView(){
  const fav=state.recipes.filter(r=>r.favorite).slice(0,6);
  const recent=[...state.recipes].filter(r=>r.lastUsedAt).sort((a,b)=>b.lastUsedAt.localeCompare(a.lastUsedAt)).slice(0,6);
  const cats=[...new Set(state.recipes.map(r=>r.category).filter(Boolean))].slice(0,8);
  return `<div class="amateur-app">
    <header class="am-hero"><div class="am-brand">Kucharzyna <span>dla Ciebie</span></div><div class="am-greeting">Co dziś gotujemy?</div><p>Wybierz przepis i gotuj bez zbędnych ustawień.</p>
      <button class="am-search" data-route2="recipes">⌕ <span>Szukaj przepisu...</span></button>
    </header>
    <div class="am-menu"><button data-route2="recipes"><b>🍽️</b><span>Przepisy</span></button><button data-route2="traditional"><b>🌍</b><span>Kuchnie świata</span></button><button data-route2="shopping"><b>🛒</b><span>Zakupy</span></button><button data-route2="calculators"><b>🧮</b><span>Kalkulatory</span></button></div>
    <section class="am-section"><div class="am-title"><h2>Gotuj według kategorii</h2></div><div class="am-cats">${cats.map(c=>`<button class="am-cat" data-cat-am="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div></section>
    ${recent.length?`<section class="am-section"><div class="am-title"><h2>Ostatnio gotowane</h2><button data-route2="recipes">Pokaż wszystko</button></div><div class="am-recipe-row">${recent.map(amateurCard).join('')}</div></section>`:''}
    ${fav.length?`<section class="am-section"><div class="am-title"><h2>Ulubione</h2></div><div class="am-recipe-row">${fav.map(amateurCard).join('')}</div></section>`:''}
    <section class="am-section"><div class="am-title"><h2>Pomysły na dziś</h2></div><div class="am-recipe-row">${state.recipes.slice(0,8).map(amateurCard).join('')}</div></section>
  </div>`;
}
function amateurCard(r){const img=recipeImage(r);return `<article class="am-card" data-open="${r.id}"><div class="am-card-img">${img?`<img src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" loading="lazy" decoding="async">`:'🍽️'}</div><div class="am-card-body"><div class="am-card-name">${escapeHtml(r.name)}</div><div class="am-card-meta">${escapeHtml(r.category||'Przepis')} · ${r.yield?fmt(r.yield)+' '+escapeHtml(r.yieldUnit||''):''}</div></div></article>`}

const _renderV14=renderV14;
renderV14=function(){
  if(state.settings.profile==='amateur' && ['start','recipes','shopping','calculators','traditional'].includes(state.route)){
    if(state.route==='start') $('#main').innerHTML=amateurView();
    else if(state.route==='recipes') $('#main').innerHTML=viewRecipes();
    else if(state.route==='traditional') $('#main').innerHTML=viewTraditionalV14();
    else if(state.route==='calculators') $('#main').innerHTML=viewCalculatorsV14();
    else $('#main').innerHTML=viewShopping();
    bindV14(); if(['start','recipes','shopping'].includes(state.route)) bind(); return;
  }
  return _renderV14();
};

const _bindV14=bindV14;
bindV14=function(){
  _bindV14();
  $$('#main [data-route2]').forEach(b=>b.onclick=()=>nav(b.dataset.route2));
  $$('#main [data-google]').forEach(b=>b.onclick=()=>nav('google'));
  $$('#main [data-google-suggest]').forEach(b=>b.onclick=()=>{state.googleQuery=b.dataset.googleSuggest||'';renderV20();requestAnimationFrame(()=>$('#googleRecipeSearch')?.focus())});
  $$('#main [data-cat-am]').forEach(b=>b.onclick=()=>{state.route='recipes';state.selectedCat=b.dataset.catAm;renderV14();});
};

function completeRecipeSteps(r){
  const existing=(r.steps||[]).filter(s=>(typeof s==='string'?s:s?.text||'').trim()).map((s,i)=>typeof s==='string'?{id:uid(),text:s.trim()}:{id:s.id||uid(),text:s.text.trim()});
  const bad=existing.length<4 || existing.some(s=>/^Przygotuj i odmierz składniki\.?$|^Wykonaj kolejne etapy zgodnie z techniką dania\.?$|^Dopraw do równowagi/i.test(s.text));
  if(!bad) return existing;
  const names=(r.sections||[]).flatMap(s=>s.ingredients||[]).map(i=>i.name).filter(Boolean);
  const main=names.slice(0,4).join(', ');
  const cat=(r.category||'').toLowerCase();
  if(cat.includes('deser')) return [
    `Przygotuj i odmierz wszystkie składniki: ${main||'składniki receptury'}. Produkty wymagające chłodzenia trzymaj zimne do momentu użycia.`,
    `Przygotuj bazę deseru, łącząc składniki zgodnie z ich funkcją. Najpierw połącz składniki suche, a następnie dodaj mokre lub tłuszczowe, jeśli receptura tego wymaga.`,
    `Mieszaj tylko do uzyskania jednolitej konsystencji. Nie napowietrzaj masy bardziej, niż wymaga tego receptura.`,
    `Przełóż masę do przygotowanego naczynia lub formy i wyrównaj powierzchnię.`,
    `Piec, chłodzić lub gotować zgodnie z parametrami receptury. Kontroluj konsystencję, nie tylko czas.`,
    `Odstaw do stabilizacji, następnie wykończ i podawaj zgodnie z charakterem dania.`
  ].map((text,i)=>({id:uid(),text}));
  if(cat.includes('zup')) return [
    `Przygotuj i odmierz składniki: ${main||'warzywa, białko i przyprawy'}. Pokrój je zgodnie z czasem gotowania.`,
    `Rozgrzej garnek i przygotuj bazę aromatyczną. Podsmaż składniki wymagające zrumienienia, bez przypalania.`,
    `Dodaj składniki wymagające najdłuższego gotowania i zalej płynem. Doprowadź do delikatnego wrzenia.`,
    `Dodawaj kolejne składniki w kolejności wynikającej z ich czasu gotowania. Utrzymuj spokojne gotowanie.`,
    `Dopraw stopniowo solą, kwasem i przyprawami. Sprawdź teksturę oraz redukcję przed końcem gotowania.`,
    `Odstaw na kilka minut, ponownie skoryguj smak i podawaj w odpowiedniej temperaturze.`
  ].map((text)=>({id:uid(),text}));
  if(cat.includes('pasta')||cat.includes('makaron')) return [
    `Przygotuj wszystkie składniki: ${main||'makaron, sos i dodatki'}. Odmierz je przed rozpoczęciem pracy.`,
    `Przygotuj sos lub bazę na patelni. Zbuduj smak na tłuszczu i aromatach, nie przypalając ich.`,
    `Ugotuj makaron w dobrze osolonej wodzie do al dente. Zachowaj wodę z gotowania.`,
    `Połącz makaron z bazą. Dodawaj wodę z gotowania stopniowo, aż sos oblepi makaron i uzyska emulsję.`,
    `Dodaj główne składniki końcowe i skoryguj sól, kwasowość oraz pieprz.`,
    `Podawaj natychmiast, wykańczając danie dodatkami przewidzianymi w recepturze.`
  ].map(text=>({id:uid(),text}));
  return [
    `Przygotuj i odmierz wszystkie składniki: ${main||'wszystkie składniki receptury'}. Przygotuj stanowisko i naczynia.`,
    `Wykonaj przygotowanie wstępne: umyj, obierz i pokrój składniki zgodnie z ich dalszym zastosowaniem.`,
    `Rozpocznij obróbkę termiczną od składników wymagających najwięcej czasu. Zadbaj o odpowiednie zrumienienie i temperaturę.`,
    `Dodawaj kolejne składniki w kolejności wynikającej z receptury. Kontroluj wilgotność, temperaturę i konsystencję.`,
    `Dopraw stopniowo i sprawdź smak przed zakończeniem. Skoryguj sól, kwasowość, ostrość lub słodycz.`,
    `Zakończ obróbkę, odstaw danie jeśli tego wymaga i podawaj zgodnie z recepturą.`
  ].map(text=>({id:uid(),text}));
}

async function hydrateRecipeImages(){
  await ensureRecipeImages();
}


function enrichRecipeDescriptions(){const special={'Pizza Napoletana':'Klasyczne neapolitańskie ciasto oparte na prostej formule mąka–woda–sól–drożdże. Najważniejsza jest kontrola fermentacji, temperatury ciasta i wypieku. Przy bardzo wysokiej temperaturze pizza powinna szybko wyrosnąć na rancie, pozostać lekka w środku i mieć charakterystyczne przypieczenia. Traktuj tę recepturę jako bazę i dopasuj hydrację oraz czas fermentacji do konkretnej mąki.','Carbonara':'Rzymska pasta oparta na guanciale, żółtkach, Pecorino Romano i świeżo mielonym pieprzu. Sos nie powinien być ścinającą się jajecznicą — kluczowe jest połączenie makaronu z emulsją z sera, żółtek, tłuszczu i wody z gotowania. Pracuj poza bezpośrednim ogniem i kontroluj temperaturę przez cały etap łączenia.','Sos pomidorowy':'Bazowy sos pomidorowy do pracy z pizzą, makaronem i innymi daniami. Jego charakter zależy od jakości pomidorów, poziomu redukcji oraz końcowej równowagi soli, kwasowości i tłuszczu. Nie chodzi o długie gotowanie samo w sobie — gotuj tak długo, jak potrzeba, aby uzyskać pożądaną koncentrację i konsystencję.'};for(const r of state.recipes){if(special[r.name])r.description=special[r.name];else if(!r.description||r.description.length<105||/^Klasyczne danie kuchni/i.test(r.description))r.description=recipeDescription(r)}}
async function repairAllRecipes(){
  for(const r of state.recipes){
    r.steps=completeRecipeSteps(r);
    if(RECIPE_IMAGES[r.name]){r.image=RECIPE_IMAGES[r.name];r.imageUrl='';r.imageSource='local';r.imageCredit='Grafika Kucharzyny';}
    else if(!(typeof r.image==='string' && /^https?:/i.test(r.image)) && !r.image){r.image=DEFAULT_RECIPE_IMAGE;r.imageUrl='';r.imageSource='local-fallback';r.imageCredit='Grafika zastępcza Kucharzyny';}
    if(r.traditional && (!r.sourceUrl||!r.license)){r.source='Wikibooks Cookbook';r.sourceUrl='https://en.wikibooks.org/wiki/Cookbook:Recipes';r.license='CC BY-SA 4.0 — opracowanie Kucharzyny';}
    await put('recipes',r);
  }
  state.recipes=await getAll('recipes');
}

async function hydrateMissingWebImages(){
  const targets=state.recipes.filter(r=>!RECIPE_IMAGES[r.name] && (!r.image || r.image===DEFAULT_RECIPE_IMAGE || r.imageSource==='local-fallback'));
  const fetchOne=async r=>{
    const queries=[r.name,`${r.name} recipe`];
    for(const q of queries){
      for(const lang of ['pl','en']){
        try{
          const url=`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g,'_'))}`;
          const res=await fetch(url,{headers:{Accept:'application/json'}});
          if(!res.ok)continue;
          const data=await res.json();
          const src=data?.originalimage?.source||data?.thumbnail?.source;
          if(src){
            r.image=src;
            r.imageUrl=data?.content_urls?.desktop?.page||`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(q.replace(/ /g,'_'))}`;
            r.sourceUrl=r.imageUrl;
            r.imageSource='wikipedia';
            r.imageCredit=`Wikipedia / Wikimedia Commons — ${lang}`;
            await put('recipes',r);
            return true;
          }
        }catch(e){}
      }
    }
    return false;
  };
  for(let i=0;i<targets.length;i+=5){
    await Promise.all(targets.slice(i,i+5).map(fetchOne));
  }
  state.recipes=await getAll('recipes');
}

// Run repairs and then automatically fill recipes that still use the generic image.
setTimeout(async()=>{try{await repairAllRecipes();await ensureRecipeImages();await hydrateMissingWebImages();enrichRecipeDescriptions();renderV20();}catch(e){}},700);

/* ===== Kucharzyna 2.0 modules ===== */
function ingredientGroups(r){return (r.sections||[]).flatMap(s=>s.ingredients||[]).filter(i=>i.name)}
function normalizedUnit(u){return String(u||'g').trim().toLowerCase()}
function shopKey(name,unit){return normalizeIngredientName(name).toLowerCase()+'|'+normalizedUnit(unit)}
async function addRecipeShoppingV20(id){const r=state.recipes.find(x=>x.id===id);if(!r)return;const items=await getAll('shoppingItems');const map=new Map(items.map(x=>[shopKey(x.name,x.unit),x]));for(const i of ingredientGroups(r)){if(!i.name||!i.qty)continue;const k=shopKey(i.name,i.unit);if(map.has(k)){const x=map.get(k);x.qty=(+x.qty||0)+(+i.qty||0);await put('shoppingItems',x)}else{const x={id:uid(),name:i.name,qty:+i.qty||0,unit:i.unit||'g',done:false,sourceRecipes:[r.id]};await put('shoppingItems',x);map.set(k,x)}}state.shopping=await getAll('shoppingItems');toast('Składniki dodane i scalone na liście zakupów');renderV20()}
function viewShoppingV20(){const groups={};for(const x of state.shopping){const k=shopKey(x.name,x.unit);groups[k]??={...x,qty:0};groups[k].qty+=(+x.qty||0)}const list=Object.values(groups);return `<div class="am2-head"><div><div class="kicker">LISTA ZAKUPÓW</div><h1>Co kupić?</h1><p class="muted">Kucharzyna scala składniki z wielu receptur.</p></div><button class="btn primary" id="add-shopping">＋ Dodaj</button></div><div class="shopping-summary"><b>${list.filter(x=>!x.done).length}</b><span>pozycji do kupienia</span></div><div class="shopping-list">${list.length?list.map(x=>`<label class="shopping-item ${x.done?'done':''}"><input type="checkbox" data-shop-check-v20="${escapeHtml(x.id)}" ${x.done?'checked':''}><span class="shopping-name">${escapeHtml(x.name)}</span><strong>${fmt(x.qty)} ${escapeHtml(x.unit)}</strong></label>`).join(''):`<div class="empty">Lista jest pusta.</div>`}</div><div class="row" style="margin-top:14px"><button class="btn small" id="clear-done">Usuń ukończone</button><button class="btn small" id="clear-all-shop">Wyczyść wszystko</button></div>`}
function cookStateFor(r){return state.cook[r.id]||{id:r.id,ingredients:{},steps:{},activeStep:0,startedAt:null,completed:false}}
function viewCookV20(){const r=state.recipes.find(x=>x.id===state.selectedId);if(!r)return viewRecipes();const st=cookStateFor(r),steps=r.steps||[],ingredients=ingredientGroups(r),doneSteps=steps.filter(s=>st.steps[s.id]).length,pct=steps.length?Math.round(doneSteps/steps.length*100):0;if(st.completed)return `<div class="cook20"><div class="cook20-top"><button class="btn ghost" data-back="recipe">← Receptura</button><span class="cook20-percent">100%</span></div>${photoMarkup(r,'global-photo')}<div class="cook20-complete"><div class="big-check">✓</div><div class="kicker">GOTOWANIE ZAKOŃCZONE</div><h2>${escapeHtml(r.name)}</h2><p>Wszystkie kroki tej receptury zostały oznaczone jako wykonane. Możesz wrócić do receptury albo zresetować postęp i ugotować ją ponownie.</p><div class="row" style="justify-content:center"><button class="btn primary" id="cook-back-recipe">← Wróć do receptury</button><button class="btn" id="cook-reset-v20">Gotuj ponownie</button></div></div></div>`;const active=Math.min(Math.max(+st.activeStep||0,0),Math.max(steps.length-1,0)),step=steps[active];return `<div class="cook20"><div class="cook20-top"><button class="btn ghost" data-back="recipe">← Receptura</button><span class="cook20-percent">${pct}%</span></div><div class="cook20-title"><div class="kicker">GOTUJĘ TERAZ</div><h1>${escapeHtml(r.name)}</h1></div><div class="cook20-progress"><span style="width:${pct}%"></span></div><section class="cook20-focus"><div class="kicker">KROK ${steps.length?active+1:0} / ${steps.length}</div><h2>${step?escapeHtml(step.text):'Brak kroków w tej recepturze.'}</h2><div class="cook20-controls"><button class="btn" id="cook-prev" ${active<=0?'disabled':''}>← Poprzedni</button><button class="btn primary" id="cook-done">${step&&st.steps[step.id]?'✓ Cofnij ukończenie':'✓ Ukończ krok'}</button><button class="btn" id="cook-next" ${active>=steps.length-1?'disabled':''}>Następny →</button></div></section><section class="cook20-ingredients"><div class="section-title-row"><h2>Składniki</h2><span class="kicker">${ingredients.length}</span></div>${ingredients.map(i=>`<label class="cook20-ing ${st.ingredients[i.id]?'done':''}"><input type="checkbox" data-cook-ing-v20="${i.id}" ${st.ingredients[i.id]?'checked':''}><span>${escapeHtml(i.name)}</span><strong>${fmt(i.qty)} ${escapeHtml(i.unit)}</strong></label>`).join('')}</section><section class="cook20-steps"><h2>Postęp</h2>${steps.map((s,i)=>`<button class="cook20-step-row ${st.steps[s.id]?'done':''} ${i===active?'active':''}" data-cook-step-v20="${s.id}" data-step-index="${i}"><span>${i+1}</span><div>${escapeHtml(s.text)}</div>${st.steps[s.id]?'✓':''}</button>`).join('')}</section><button class="btn danger" id="cook-reset-v20">Resetuj postęp</button></div>`}

function viewTraditionalV14(){
 const cuisines=[
  ['Włochy','Klasyka makaronu, pizzy i risotto','🇮🇹','./photo-carbonara.webp'],
  ['Polska','Domowe smaki i tradycyjne dania','🇵🇱','./photo-tomato.webp'],
  ['Azjatycka','Wok, makarony i intensywne aromaty','🌏','./photo-carbonara.webp'],
  ['Meksykańska','Tacos, salsa i kuchnia uliczna','🇲🇽','./photo-pizza.webp'],
  ['Francuska','Technika, sosy i klasyka','🇫🇷','./photo-tomato.webp'],
  ['Hiszpańska','Tapas, ryż i wyraziste smaki','🇪🇸','./photo-pizza.webp'],
  ['Bliski Wschód','Przyprawy, grill i mezze','🌙','./photo-tomato.webp'],
  ['Amerykańska','Comfort food i kuchnia nowoczesna','🇺🇸','./photo-pizza.webp']
 ];
 const q=String(state.traditionalQueryV14||'').toLowerCase();
 const shown=cuisines.filter(c=>!q||(c[0]+' '+c[1]).toLowerCase().includes(q));
 const selected=state.tradCatV14&&state.tradCatV14!=="Wszystkie"?state.recipes.filter(r=>r.traditional&&((r.cuisine||'').toLowerCase()===String(state.tradCatV14).toLowerCase()||(r.cuisine||'').toLowerCase().includes(String(state.tradCatV14).toLowerCase().replace('azjatycka','azja')))):[];
 return `<div class="v3-world"><div class="v3-page-head"><div><span class="v3-kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Odkrywaj klasyczne kierunki kulinarne i przechodź prosto do pasujących receptur.</p></div></div><div class="v3-search v3-world-search"><span>⌕</span><input id="traditionalSearchV14" placeholder="Szukaj kuchni lub regionu…" value="${escapeHtml(state.traditionalQueryV14||'')}"></div><div class="v3-world-grid">${shown.map(c=>`<button class="v3-world-card" data-world-cuisine="${escapeHtml(c[0])}"><img src="${c[3]}" alt="${escapeHtml(c[0])}" onerror="this.src='./photo-generic.webp'"><div class="v3-world-copy"><b>${c[2]} ${escapeHtml(c[0])}</b><span>${escapeHtml(c[1])}</span></div></button>`).join('')}</div>${selected.length?`<section class="v3-world-results"><div class="v3-section-head"><div><span class="v3-kicker">${escapeHtml(state.tradCatV14)}</span><h2>Receptury</h2></div><button class="v3-link" data-world-clear>Wszystkie</button></div><div class="v3-recipe-list">${selected.map(r=>v3RecipeCard(r,true)).join('')}</div></section>`:`<section class="v3-world-feature"><span>🍽️</span><div><b>Masz ochotę na konkretną kuchnię?</b><p>Wybierz kraj lub region powyżej. Kucharzyna pokaże zapisane klasyczne receptury z tego kierunku.</p></div></section>`}</div>`;
}

function viewCalculatorsV20(){
 const p=state.pizzaV20||{mode:'dough',flour:1000,balls:10,ball:250,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24,poolish:0,prefermentHyd:100};
 const f0=+p.flour||0,h=+p.hyd||0,s=+p.salt||0,o=+p.oil||0,y=+p.yeast||0;let f=f0;if(p.mode==='dough'){const total=(+p.balls||0)*(+p.ball||0);f=total/(1+h/100+s/100+o/100+y/100)}const water=f*h/100,salt=f*s/100,oil=f*o/100,yeast=f*y/100,total=f+water+salt+oil+yeast,balls=p.mode==='dough'?(+p.balls||0):(+p.ball>0?Math.floor(total/+p.ball):0);
 return `<div class="pro-calc"><div class="screen-back"><button class="btn ghost" data-back="start">‹ Powrót</button></div><div class="kicker">PRO KALKULATOR</div><h1>🍕 Pizza Lab</h1><p class="muted">Pełna receptura ciasta, parametry procesu i preferment.</p><div class="segmented"><button class="seg ${p.mode==='dough'?'active':''}" id="p2-dough">Kulki / masa</button><button class="seg ${p.mode==='flour'?'active':''}" id="p2-flour">Mam mąkę</button></div><section class="calc-card"><div class="calc-input-grid">${p.mode==='flour'?`<label>Mąka <input id="p2-flour-val" type="number" inputmode="decimal" value="${p.flour}"> g</label><label>Masa kulki <input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"> g</label>`:`<label>Liczba kulek <input id="p2-balls" type="number" inputmode="decimal" value="${p.balls}"></label><label>Masa kulki <input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"> g</label>`}<label>Hydracja <input id="p2-hyd" type="number" step="0.1" value="${p.hyd}"> %</label><label>Sól <input id="p2-salt" type="number" step="0.1" value="${p.salt}"> %</label><label>Oliwa <input id="p2-oil" type="number" step="0.1" value="${p.oil}"> %</label><label>Drożdże <input id="p2-yeast" type="number" step="0.01" value="${p.yeast}"> %</label><label>Temperatura <input id="p2-temp" type="number" value="${p.temp}"> °C</label><label>Fermentacja <input id="p2-time" type="number" value="${p.time}"> h</label></div></section><section id="p2-live-result" class="calc-result pro-result"><div><span>Mąka</span><b>${fmt(f)} g</b></div><div><span>Woda</span><b>${fmt(water)} g</b></div><div><span>Sól</span><b>${fmt(salt)} g</b></div><div><span>Oliwa</span><b>${fmt(oil)} g</b></div><div><span>Drożdże</span><b>${fmt(yeast)} g</b></div><div><span>Ciasto</span><b>${fmt(total)} g</b></div><div><span>Kulki</span><b>${fmt(balls)} × ${fmt(p.ball)} g${p.mode==='flour'?' · wyliczone':''}</b></div></section><section class="calc-card"><div class="section-title-row"><div><h2>Fermentacja PRO</h2><p class="muted">Profil procesu — możesz zapisać go jako recepturę.</p></div></div><div class="calc-input-grid"><label>Preferment <input id="p2-pref" type="number" step="1" value="${p.poolish}"> % mąki</label><label>Nawodnienie prefermentu <input id="p2-prefhyd" type="number" value="${p.prefermentHyd}"> %</label></div><div class="ferment-box"><b>${p.poolish>0?`Preferment: ${fmt(f*p.poolish/100)} g mąki · ${fmt(f*p.poolish/100*p.prefermentHyd/100)} g wody`:'Brak prefermentu'}</b><span>${fmt(p.time)} h · ${fmt(p.temp)}°C</span></div></section><div class="row"><button class="btn primary" id="p2-save">Zapisz profil</button><button class="btn" id="p2-reset">Reset</button></div></div>`;
}

function updateTopbar(){
 const titleMap={inventory:(state.settings.profile==="amateur"?"Lodówka":"Magazyn"),start:'Start',recipes:'Przepisy',traditional:'Kuchnie świata',calculators:'Kalkulatory',shopping:'Zakupy',settings:'Ustawienia',cook:'Gotuję',edit:'Edytuj recepturę',google:'Szukaj w Google',recipe:(state.recipes.find(r=>r.id===state.selectedId)?.name||'Receptura')};
 const el=$("#topbarTitle"); if(el) el.textContent=titleMap[state.route]||'Kucharzyna';
 const gb=$("#globalBack"); if(gb) gb.style.visibility=state.route==='start'?'hidden':'visible';
}
function openGoogleRecipeSearch(){const q=String(state.googleQuery||'').trim();if(!q){toast('Wpisz nazwę dania lub składnik');return}const url='https://www.google.com/search?q='+encodeURIComponent(q+' przepis')+'&hl=pl';window.open(url,'_blank','noopener,noreferrer');}
function viewGoogleSearch(){return `<div class="v3-google-screen"><div class="v3-page-head"><div><span class="v3-kicker">INTERNET</span><h1>Szukaj w Google</h1><p>Znajdź przepisy, inspiracje, zdjęcia i materiały kulinarne. Wyniki otwierają się w Google.</p></div></div><div class="v3-google-searchbox"><span>G</span><input id="googleRecipeSearchInput" autocomplete="off" placeholder="np. carbonara bez śmietany…" value="${escapeHtml(state.googleQuery||'')}"><button id="googleRecipeGo" aria-label="Szukaj">⌕</button></div><div class="v3-google-suggestions"><button data-google-suggest="carbonara przepis">Carbonara</button><button data-google-suggest="pizza napoletana przepis">Pizza Napoletana</button><button data-google-suggest="sos pomidorowy przepis">Sos pomidorowy</button><button data-google-suggest="ciasto na pizzę 65% hydracji">Ciasto na pizzę</button></div><section class="v3-google-info"><b>Jak to działa?</b><p>Kucharzyna nie kopiuje automatycznie cudzych receptur. Google służy tutaj jako wyszukiwarka źródeł i inspiracji — wybraną recepturę możesz później świadomie opracować i zapisać u siebie.</p></section><button class="v3-primary-action v3-google-big" id="googleRecipeGo2">⌕ Szukaj przepisu w Google</button></div>`}
function bindV20(){
  const gb=$('#globalBack');if(gb){gb.onclick=()=>backRoute();gb.setAttribute('aria-label',state.route==='start'?'Start':'Powrót');gb.title=state.route==='start'?'Start':'Powrót';}
  const gs=$('#globalSettings');if(gs)gs.onclick=()=>nav('settings');
  const tb=$('#themeBtn');if(tb)tb.onclick=()=>{const order=['system','light','dark'];const i=order.indexOf(state.settings.theme);state.settings.theme=order[(i+1)%order.length];saveSetting();applyTheme();renderV20();toast(`Motyw: ${state.settings.theme==='system'?'Automatyczny':state.settings.theme==='light'?'Jasny':'Ciemny'}`)};
  $$('.nav-btn').forEach(b=>b.onclick=()=>nav(b.dataset.route));
  $$('#main [data-route2]').forEach(b=>b.onclick=()=>nav(b.dataset.route2));
  $$('#main [data-google]').forEach(b=>b.onclick=()=>nav('google'));
  $$('#main [data-google-suggest]').forEach(b=>b.onclick=()=>{state.googleQuery=b.dataset.googleSuggest||'';renderV20();requestAnimationFrame(()=>$('#googleRecipeSearch')?.focus())});
  $$('#main [data-action]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.action;
    if(a==='new'){state.editId=null;state.route='edit';renderV20()}
    else if(['recipes','calculators','shopping','settings'].includes(a))nav(a);
    else if(a==='inventory')nav('inventory');
    else if(a==='fav'||a==='recent'){state.query='';state.selectedCat='Wszystkie';state.sort=a;nav('recipes')}
    else if(a==='import')openImporter();
  });
  $$('#main [data-open]').forEach(b=>b.onclick=async e=>{if(e.target.closest('[data-fav]'))return;const r=state.recipes.find(x=>x.id===b.dataset.open);if(!r)return;r.lastUsedAt=now();await put('recipes',r);state.selectedId=r.id;state.returnRoute=state.route;state.route='recipe';renderV20()});
  $$('#main [data-fav]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const r=state.recipes.find(x=>x.id===b.dataset.fav);if(r){r.favorite=!r.favorite;await put('recipes',r);state.recipes=await getAll('recipes');renderV20()}});
  $$('#main [data-cook]').forEach(b=>b.onclick=()=>{state.selectedId=b.dataset.cook;state.route='cook';renderV20()});
  $$('#main [data-edit]').forEach(b=>b.onclick=()=>{state.editId=b.dataset.edit;state.route='edit';renderV20()});
  $$('#main [data-scale]').forEach(b=>b.onclick=()=>scaleModal(b.dataset.scale));
  $$('#main [data-recipe-ing]').forEach(b=>b.onclick=()=>ingredientScaleModal(state.selectedId,b.dataset.recipeIng));
  $$('#main [data-shop-recipe]').forEach(b=>b.onclick=()=>addRecipeShoppingV20(b.dataset.shopRecipe));
  $$('#main [data-back]').forEach(b=>b.onclick=()=>nav(b.dataset.back||'start'));
  $$('#main [data-cat]').forEach(b=>b.onclick=()=>{state.selectedCat=b.dataset.cat;renderV20()});
  const search=$('#recipeSearch'); if(search){search.oninput=()=>{state.query=search.value;const caret=search.selectionStart??search.value.length;clearTimeout(window.__k3SearchTimer);window.__k3SearchTimer=setTimeout(()=>{renderV20();requestAnimationFrame(()=>{const el=$('#recipeSearch');if(el){el.focus({preventScroll:true});try{el.setSelectionRange(caret,caret)}catch(_){}}})},60)}}
  const sort=$('#sort'); if(sort){sort.onchange=()=>{state.sort=sort.value;renderV20()}}
  $$('#main [data-trad-v14]').forEach(b=>b.onclick=()=>{state.tradCatV14=b.dataset.tradV14;renderV20()});
  const ws=$('#traditionalSearchV14');if(ws){ws.oninput=()=>{state.traditionalQueryV14=ws.value;const caret=ws.selectionStart??ws.value.length;clearTimeout(window.__k3WorldTimer);window.__k3WorldTimer=setTimeout(()=>{renderV20();requestAnimationFrame(()=>{const el=$('#traditionalSearchV14');if(el){el.focus({preventScroll:true});try{el.setSelectionRange(caret,caret)}catch(_){}}})},60)}}
  $$('#main [data-world-cuisine]').forEach(b=>b.onclick=()=>{const c=b.dataset.worldCuisine;state.query='';state.selectedCat='Wszystkie';state.tradCatV14=c;renderV20();});
  $('#main [data-world-clear]')?.addEventListener('click',()=>{state.tradCatV14='Wszystkie';renderV20()});
  if(state.route==='google'){const g=$('#googleRecipeSearchInput');if(g){g.oninput=()=>state.googleQuery=g.value;g.onkeydown=e=>{if(e.key==='Enter')k3GoogleRecipeSearch()};}$('#googleRecipeGo')?.addEventListener('click',openGoogleRecipeSearch);$('#googleRecipeGo2')?.addEventListener('click',openGoogleRecipeSearch)}

  if(state.route==='settings'){
    const theme=$('#theme'); if(theme){theme.value=state.settings.theme;theme.onchange=()=>{state.settings.theme=theme.value;saveSetting();applyTheme();toast('Motyw zapisany')}}
    const profile=$('#profile'); if(profile){profile.value=state.settings.profile;profile.onchange=()=>{state.settings.profile=profile.value;saveSetting();applyTheme();renderV20();toast(profile.value==='amateur'?'Tryb Amator włączony':'Tryb Profesjonalny włączony')}}
    $('#export')?.addEventListener('click',exportBackup);
    $('#importBackup')?.addEventListener('click',()=>backupInput());
    $('#openImporter')?.addEventListener('click',openImporter);
    $('#addCategory')?.addEventListener('click',()=>{openModal(`<h2>Nowa kategoria</h2><input id="cat-name" placeholder="Np. Fermenty"><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="cat-ok">Dodaj</button></div>`);$('#cat-ok').onclick=async()=>{const name=$('#cat-name').value.trim();if(!name)return;if(state.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())){toast('Taka kategoria już istnieje');return}await put('categories',{id:uid(),name});state.categories=await getAll('categories');closeModal();renderV20();toast('Dodano kategorię')}})
  }
  if(state.route==='edit') bindV14();
  if(state.route==='cook'){
    const r=state.recipes.find(x=>x.id===state.selectedId),st=r&&cookStateFor(r);
    if(r&&st){
      $$('#main [data-cook-ing-v20]').forEach(x=>x.onchange=async()=>{st.ingredients[x.dataset.cookIngV20]=x.checked;await put('cookState',st);state.cook[r.id]=st;renderV20()});
      $$('#main [data-cook-step-v20]').forEach(x=>x.onclick=async()=>{st.activeStep=+x.dataset.stepIndex;await put('cookState',st);state.cook[r.id]=st;renderV20()});
      $('#cook-prev')?.addEventListener('click',async()=>{st.activeStep=Math.max(0,(st.activeStep||0)-1);await put('cookState',st);state.cook[r.id]=st;renderV20()});
      $('#cook-next')?.addEventListener('click',async()=>{st.activeStep=Math.min(Math.max((r.steps||[]).length-1,0),(st.activeStep||0)+1);await put('cookState',st);state.cook[r.id]=st;renderV20()});
      $('#cook-done')?.addEventListener('click',async()=>{const step=r.steps?.[st.activeStep];if(!step)return;if(st.steps[step.id]){delete st.steps[step.id];await put('cookState',st);state.cook[r.id]=st;renderV20();toast('Krok oznaczony jako niewykonany');return}st.steps[step.id]=true;const allDone=(r.steps||[]).every(s=>st.steps[s.id]);if(allDone){st.completed=true;st.completedAt=now();r.lastCookedAt=now();await put('recipes',r)}else st.activeStep=Math.min((r.steps||[]).length-1,(st.activeStep||0)+1);await put('cookState',st);state.cook[r.id]=st;renderV20();toast(allDone?'Gotowanie zakończone ✓':'Krok ukończony ✓')});
      $('#cook-back-recipe')?.addEventListener('click',()=>{state.route='recipe';renderV20()});
      $('#cook-reset-v20')?.addEventListener('click',async()=>{const fresh={id:r.id,ingredients:{},steps:{},activeStep:0,completed:false};await put('cookState',fresh);state.cook[r.id]=fresh;renderV20()});
    }
  }
  if(state.route==='shopping'){
    $$('#main [data-shop-check-v20]').forEach(x=>x.onchange=async()=>{const old=state.shopping.find(i=>i.id===x.dataset.shopCheckV20);if(old){old.done=x.checked;await put('shoppingItems',old);state.shopping=await getAll('shoppingItems');renderV20()}});
    $('#add-shopping')?.addEventListener('click',manualShop);
    $('#clear-done')?.addEventListener('click',async()=>{for(const x of state.shopping)if(x.done)await del('shoppingItems',x.id);state.shopping=await getAll('shoppingItems');renderV20()});
    $('#clear-all-shop')?.addEventListener('click',async()=>{for(const x of state.shopping)await del('shoppingItems',x.id);state.shopping=[];renderV20()});
  }
  if(state.route==='calculators'){
    const ids=['flour-val','balls','ball','hyd','salt','oil','yeast','temp','time','pref','prefhyd'];
    ids.forEach(k=>$('#p2-'+k)?.addEventListener('input',()=>{const q=state.pizzaV20||{};const el=$('#p2-'+k);q[k==='flour-val'?'flour':k]=+el.value||0;state.pizzaV20=q;updatePizzaProResult()}));
    $('#p2-dough')?.addEventListener('click',()=>{state.pizzaV20={...(state.pizzaV20||{}),mode:'dough'};renderV20()});
    $('#p2-flour')?.addEventListener('click',()=>{state.pizzaV20={...(state.pizzaV20||{}),mode:'flour'};renderV20()});
    $('#p2-reset')?.addEventListener('click',()=>{state.pizzaV20={mode:'dough',flour:1000,balls:10,ball:250,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24,poolish:0,prefermentHyd:100};renderV20()});
    $('#p2-save')?.addEventListener('click',async()=>{const p=state.pizzaV20||{};openModal(`<h2>Zapisz profil pizzy</h2><input id="pizza-profile-name" value="Pizza PRO ${p.hyd||65}% / ${p.time||24}h" placeholder="Nazwa profilu"><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="pizza-profile-ok">Zapisz</button></div>`);$('#pizza-profile-ok').onclick=async()=>{const name=$('#pizza-profile-name').value.trim()||`Pizza PRO ${p.hyd||65}% / ${p.time||24}h`;const id=uid();await put('pizzaProfiles',{id,name,mode:p.mode,values:{...p}});state.pizzaProfiles=await getAll('pizzaProfiles');state.activePizzaProfileId=id;closeModal();renderV20();toast('Profil zapisany ✓')}});
  $$('#main [data-pizza-profile]').forEach(b=>b.onclick=async()=>{const pr=state.pizzaProfiles.find(x=>x.id===b.dataset.pizzaProfile);if(!pr)return;state.pizzaV20={...state.pizzaV20,...(pr.values||{}),mode:pr.mode||pr.values?.mode||'dough'};state.activePizzaProfileId=pr.id;renderV20();toast(`Wczytano: ${pr.name}`)});
  $('#p2-profile-new')?.addEventListener('click',()=>{state.activePizzaProfileId=null;state.pizzaV20={mode:'dough',flour:1000,balls:10,ball:250,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24,poolish:0,prefermentHyd:100};renderV20()});
  }
}
function updatePizzaProResult(){
  const p=state.pizzaV20||{},f0=+p.flour||0,h=+p.hyd||0,s=+p.salt||0,o=+p.oil||0,y=+p.yeast||0;
  let f=f0;if(p.mode==='dough'){const total=(+p.balls||0)*(+p.ball||0);f=total/(1+h/100+s/100+o/100+y/100)}
  const water=f*h/100,salt=f*s/100,oil=f*o/100,yeast=f*y/100,total=f+water+salt+oil+yeast,balls=p.mode==='dough'?(+p.balls||0):(+p.ball>0?Math.floor(total/+p.ball):0);
  const out=$('#p2-live-result');if(out)out.innerHTML=`<div><span>Mąka</span><b>${fmt(f)} g</b></div><div><span>Woda</span><b>${fmt(water)} g</b></div><div><span>Sól</span><b>${fmt(salt)} g</b></div><div><span>Oliwa</span><b>${fmt(oil)} g</b></div><div><span>Drożdże</span><b>${fmt(yeast)} g</b></div><div><span>Ciasto</span><b>${fmt(total)} g</b></div><div><span>Kulki</span><b>${fmt(balls)} × ${fmt(p.ball||0)} g${p.mode==='flour'?' · wyliczone':''}</b></div>`;
}

function renderV20(){applyTheme();updateTopbar();$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));if(state.route==='recipe')$('#main').innerHTML=recipeViewV20(state.selectedId);else if(state.route==='google')$('#main').innerHTML=viewGoogleSearch();else if(state.route==='cook')$('#main').innerHTML=viewCookV20();else if(state.route==='shopping')$('#main').innerHTML=viewShoppingV20();else if(state.route==='calculators')$('#main').innerHTML=viewCalculatorsV20();else if(state.route==='edit')$('#main').innerHTML=editorV14(state.editId);else {const views={start:viewStart,recipes:viewRecipes,traditional:viewTraditionalV14,calculators:viewCalculators,shopping:viewShoppingV20,inventory:viewInventoryK312,settings:viewSettings};$('#main').innerHTML=(views[state.route]||viewStart)()}bindV20()}
function backRoute(){const r=state.route;let target='start';if(r==='cook')target='recipe';else if(r==='edit'){target=state.editId?'recipe':'start';if(state.editId)state.selectedId=state.editId;}else if(r==='recipe')target=state.returnRoute||'recipes';else if(r==='google')target='recipes';else if(r==='recipes'||r==='traditional'||r==='calculators'||r==='shopping'||r==='inventory'||r==='settings')target='start';state.route=target;applyTheme();renderV20();requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}))}
function recipeViewV20(id){const r=state.recipes.find(x=>x.id===id);if(!r)return viewRecipes();const ingredients=ingredientGroups(r),desc=recipeDescription(r);return `<div class="recipe20">${photoMarkup(r,'global-photo')}<div class="recipe20-title"><div class="kicker">${escapeHtml(r.category||'Inne')} ${r.flag||''} ${k39RecipeMeta(r)}</div><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(desc)}</p></div><div class="recipe20-intro"><b>Na co zwrócić uwagę</b><div>${escapeHtml(r.notes||'Zanim zaczniesz, przygotuj wszystkie składniki, sprawdź temperaturę i zaplanuj kolejność pracy. Własne uwagi możesz później zapisać przy tej recepturze.')}</div></div><div class="recipe20-actions"><button class="btn primary" data-cook="${r.id}">▶ GOTUJĘ</button><button class="btn" data-edit="${r.id}">✎ EDYTUJ</button><button class="btn" data-shop-recipe="${r.id}">＋ ZAKUPY</button></div><section><div class="section-title-row"><h2>Składniki</h2><span class="kicker">${ingredients.length}</span></div>${(r.sections||[]).map(s=>`<div class="ingredient-section"><h3>${escapeHtml(s.name)}</h3>${(s.ingredients||[]).map(i=>`<button class="ingredient20" data-recipe-ing="${i.id}"><span>${escapeHtml(i.name)}</span><strong>${fmt(i.qty)} ${escapeHtml(i.unit)}</strong></button>`).join('')}</div>`).join('')}</section><section><div class="section-title-row"><h2>Wykonanie</h2><span class="kicker">${(r.steps||[]).length} kroków</span></div><div class="steps20">${(r.steps||[]).map((s,i)=>`<article class="step20"><div>${i+1}</div><p>${escapeHtml(s.text)}</p></article>`).join('')}</div></section><section class="recipe20-meta"><div><span>Przygotowanie</span><b>${fmt(r.prep||0)} min</b></div><div><span>Gotowanie</span><b>${fmt(r.cook||0)} min</b></div><div><span>Fermentacja</span><b>${fmt(r.ferment||0)} h</b></div>${r.servingType?`<div><span>Sposób podania</span><b>${escapeHtml(r.servingType)}</b></div>`:''}</section>${r.imageCredit?`<p class="photo-credit">${escapeHtml(r.imageCredit)}</p>`:''}</div>`}

function initKucharzyna20(){nav=function(route){if(route===state.route && route==='start'){document.querySelector('.main-scroll')?.scrollTo(0,0);return}state.route=route;applyTheme();renderV20();requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}))};window.renderV20=renderV20}
initKucharzyna20();


/* ============================================================
   Kucharzyna 3.0 — Premium UI Redesign
   Visual layer only: existing data/actions remain compatible.
   ============================================================ */
function v3Icon(icon, label){return `<span class="v3-icon" aria-hidden="true">${icon}</span><span>${label}</span>`}
function v3SvgIcon(name){const paths={book:'<path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H20v17H8.5A3.5 3.5 0 0 0 5 22z"/><path d="M5 5.5V22"/><path d="M8.5 19H20"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21M12 3C9.6 5.5 8.5 8.5 8.5 12S9.6 18.5 12 21"/>',cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="19" cy="20" r="1.5"/><path d="M3 4h2l2.2 11.5h11.3L21 8H6"/>',calc:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2"/>',heart:'<path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.8 1.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.2h-2.6v-.2a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1-1.8-1.8.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.7-1.1H6v-2.6h.2a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1 1.8-1.8.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 12.4 5v-.2H15V5a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1L20 8l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.2v2.6h-.2a1.8 1.8 0 0 0-1.8 1.2Z"/>'};return `<span class="v3-svg-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.book}</svg></span>`}
function v3RecipeCard(r,wide=false){
  const src=recipeImage(r); const total=(+r.prep||0)+(+r.cook||0);
  return `<article class="v3-recipe-card ${wide?'v3-wide':''}" data-open="${r.id}">
    <div class="v3-card-photo"><img src="${escapeHtml(src)}" loading="lazy" decoding="async" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='./photo-generic.webp'"><button class="v3-heart" data-fav="${r.id}" aria-label="${r.favorite?'Usuń z ulubionych':'Dodaj do ulubionych'}">${r.favorite?'♥':'♡'}</button></div>
    <div class="v3-card-body"><div class="v3-card-kicker">${escapeHtml(r.category||'Przepis')} ${r.flag||''}</div><h3>${escapeHtml(r.name)}</h3><div class="v3-card-meta"><span>◷ ${fmt(total)} min</span><span>♟ ${fmt(r.yield||r.servings||0)} ${escapeHtml(r.yieldUnit||'porc.')}</span>${k39RecipeMeta(r)}</div></div>
  </article>`;
}
function viewStart(){
  const recent=[...state.recipes].filter(r=>r.lastUsedAt).sort((a,b)=>(b.lastUsedAt||'').localeCompare(a.lastUsedAt||'')).slice(0,3);
  const fav=state.recipes.filter(r=>r.favorite).slice(0,3);
  const hero=state.recipes.find(r=>r.name==='Carbonara')||state.recipes[0];
  const heroImg=hero?recipeImage(hero):'./photo-generic.webp';
  return `<div class="v3-home k39-liquid-home" style="--home-photo:url('${escapeHtml(heroImg)}')">
    <div class="k39-home-ambient" aria-hidden="true"></div>
    <div class="k39-home-photo" aria-hidden="true"></div>
    <section class="v3-home-hero k39-hero-glass">
      <div class="v3-hero-copy"><div class="v3-brand-mark">👨‍🍳</div><div class="v3-kicker">TWOJA KUCHNIA · TWOJE ZASADY</div><h1>Kucharzyna</h1><p>Twoje receptury, kalkulatory i kuchenny workflow. Wszystko pod ręką.</p></div>
      <button class="v3-hero-settings" data-action="settings" aria-label="Ustawienia">⚙</button>
    </section>
    <section class="v3-menu-grid k39-menu-glass">
      <button class="v3-menu-card v3-menu-recipes" data-action="recipes"><span class="v3-menu-icon">${v3SvgIcon('book')}</span><b>Przepisy</b><small>Twoja książka kucharska</small></button>
      <button class="v3-menu-card v3-menu-world" data-route2="traditional"><span class="v3-menu-icon">${v3SvgIcon('globe')}</span><b>Kuchnie świata</b><small>Smaki z różnych regionów</small></button>
      <button class="v3-menu-card v3-menu-shop" data-action="shopping"><span class="v3-menu-icon">${v3SvgIcon('cart')}</span><b>Zakupy</b><small>Lista i planowanie</small></button>
      <button class="v3-menu-card v3-menu-calc" data-action="calculators"><span class="v3-menu-icon">${v3SvgIcon('calc')}</span><b>Kalkulatory</b><small>Pizza, ciasto i więcej</small></button>
      <button class="v3-menu-card v3-menu-fav" data-action="fav"><span class="v3-menu-icon">${v3SvgIcon('heart')}</span><b>Ulubione</b><small>Twoje najlepsze</small></button>
      <button class="v3-menu-card v3-menu-settings" data-action="settings"><span class="v3-menu-icon">${v3SvgIcon('gear')}</span><b>Ustawienia</b><small>Motyw, profil, backup</small></button>
      <button class="v3-menu-card v3-menu-google" data-google="1"><span class="v3-menu-icon">G</span><b>Szukaj w Google</b><small>Przepisy z internetu</small></button>
    </section>
    ${recent.length?`<section class="v3-section k39-glass-section"><div class="v3-section-head"><div><span class="v3-kicker">WRACAJ DO GOTOWANIA</span><h2>Ostatnio używane</h2></div><button class="v3-link" data-route2="recipes">Wszystkie →</button></div><div class="v3-horizontal">${recent.map(r=>v3RecipeCard(r)).join('')}</div></section>`:''}
    ${fav.length?`<section class="v3-section k39-glass-section"><div class="v3-section-head"><div><span class="v3-kicker">TWOJE PEWNIAKI</span><h2>Ulubione</h2></div></div><div class="v3-horizontal">${fav.map(r=>v3RecipeCard(r)).join('')}</div></section>`:''}
  </div>`;
}
function viewRecipes(){
  let rs=[...state.recipes];
  if(state.query)rs=rs.filter(r=>(r.name+' '+r.description+' '+(r.tags||[]).join(' ')).toLowerCase().includes(state.query.toLowerCase()));
  if(state.selectedCat!=='Wszystkie')rs=rs.filter(r=>r.category===state.selectedCat);
  if(state.sort==='name')rs.sort((a,b)=>a.name.localeCompare(b.name)); else if(state.sort==='fav')rs.sort((a,b)=>Number(b.favorite)-Number(a.favorite)); else rs.sort((a,b)=>(b.lastUsedAt||b.updatedAt||'').localeCompare(a.lastUsedAt||a.updatedAt||''));
  return `<div class="v3-library"><div class="v3-page-head"><div><span class="v3-kicker">TWOJA BAZA</span><h1>Przepisy</h1><p>Wszystko, co chcesz ugotować, zapisane w jednym miejscu.</p></div><button class="v3-add-btn" data-action="new">＋<span>Nowa</span></button></div>
    <div class="v3-search"><span>⌕</span><input id="recipeSearch" placeholder="Szukaj przepisu, składnika…" value="${escapeHtml(state.query)}"></div>
    <div class="v3-chips"><button class="v3-chip ${state.selectedCat==='Wszystkie'?'active':''}" data-cat="Wszystkie">Wszystkie</button>${state.categories.map(c=>`<button class="v3-chip ${state.selectedCat===c.name?'active':''}" data-cat="${escapeHtml(c.name)}">${escapeHtml(c.name)}</button>`).join('')}</div><button class="v3-google-entry" data-google="1"><span>G</span><div><b>Znajdź przepis w Google</b><small>Internetowe inspiracje i źródła</small></div><strong>›</strong></button>
    <div class="v3-sort-row"><span>${rs.length} ${rs.length===1?'receptura':'receptur'}</span><select id="sort"><option value="recent" ${state.sort==='recent'?'selected':''}>Ostatnio używane</option><option value="name" ${state.sort==='name'?'selected':''}>Nazwa A–Z</option><option value="fav" ${state.sort==='fav'?'selected':''}>Ulubione</option></select></div>
    <div class="v3-recipe-list">${rs.length?rs.map(r=>v3RecipeCard(r,true)).join(''):`<div class="v3-empty"><span>🍽️</span><b>Nic tu jeszcze nie ma</b><p>Zmień filtr albo dodaj pierwszą recepturę.</p><button class="btn primary" data-action="new">＋ Nowa receptura</button></div>`}</div>
  </div>`;
}
function recipeViewV20(id){
  const r=state.recipes.find(x=>x.id===id); if(!r)return viewRecipes();
  const ingredients=ingredientGroups(r), desc=recipeDescription(r), total=(+r.prep||0)+(+r.cook||0);
  return `<div class="v3-recipe-detail">
    <section class="v3-detail-hero"><img src="${escapeHtml(recipeImage(r))}" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='./photo-generic.webp'"><div class="v3-detail-gradient"></div><div class="v3-detail-top"><button class="v3-round" data-fav="${r.id}">${r.favorite?'♥':'♡'}</button><button class="v3-round" data-edit="${r.id}">⋯</button></div><div class="v3-detail-title"><div class="v3-kicker">${escapeHtml(r.category||'PRZEPIS')} ${r.flag||''} ${r.traditional?' · ★ KLASYCZNA':''}</div><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(desc)}</p></div></section>
    <div class="v3-stat-row"><div><span>◷</span><b>${fmt(total)} min</b><small>czas</small></div><div><span>♟</span><b>${fmt(r.yield||r.servings||0)} ${escapeHtml(r.yieldUnit||'porc.')}</b><small>wydajność</small></div><div><span>🍽️</span><b>${escapeHtml(r.servingType||'Na ciepło')}</b><small>podanie</small></div></div>
    <div class="v3-detail-actions"><button class="v3-primary-action" data-cook="${r.id}">👨‍🍳 GOTUJĘ</button><button data-shop-recipe="${r.id}">🛒 Zakupy</button><button data-scale="${r.id}">⚖ Przelicz</button></div>
    <section class="v3-content-section"><div class="v3-section-head"><div><span class="v3-kicker">RECEPTURA</span><h2>Składniki</h2></div><span class="v3-count">${ingredients.length}</span></div>${(r.sections||[]).map(s=>`<div class="v3-ingredient-group">${(r.sections||[]).length>1?`<div class="v3-group-title">${escapeHtml(s.name)}</div>`:''}${(s.ingredients||[]).map(i=>`<button class="v3-ingredient" data-recipe-ing="${i.id}"><span class="v3-ing-icon">•</span><span>${escapeHtml(i.name)}</span><strong>${fmt(i.qty??0)} ${escapeHtml(i.unit||'g')}</strong></button>`).join('')}</div>`).join('')}</section>
    <section class="v3-content-section"><div class="v3-section-head"><div><span class="v3-kicker">TECHNIKA</span><h2>Jak zrobić</h2></div><span class="v3-count">${(r.steps||[]).length}</span></div><div class="v3-steps">${(r.steps||[]).map((s,i)=>`<article><div class="v3-step-no">${i+1}</div><div><span>KROK ${i+1}</span><p>${escapeHtml(s.text)}</p></div></article>`).join('')}</div></section>
    <section class="v3-tip"><span>💡</span><div><b>Na co zwrócić uwagę</b><p>${escapeHtml(r.notes||'Przygotuj wszystkie składniki przed rozpoczęciem pracy. Kontroluj temperaturę i konsystencję, a końcową korektę smaku zostaw na sam koniec.')}</p></div></section>
  </div>`;
}
function viewCookV20(){
  const r=state.recipes.find(x=>x.id===state.selectedId); if(!r)return viewRecipes(); const st=cookStateFor(r),steps=r.steps||[],ingredients=ingredientGroups(r),doneSteps=steps.filter(s=>st.steps[s.id]).length,pct=steps.length?Math.round(doneSteps/steps.length*100):0;
  if(st.completed)return `<div class="v3-cook-complete"><div class="v3-complete-photo"><img src="${escapeHtml(recipeImage(r))}" alt=""></div><div class="v3-check">✓</div><span class="v3-kicker">GOTOWANIE ZAKOŃCZONE</span><h1>${escapeHtml(r.name)}</h1><p>Robota zrobiona. Wszystkie kroki zostały ukończone i postęp został zapisany na tym urządzeniu.</p><div class="v3-complete-actions"><button class="v3-primary-action" id="cook-back-recipe">← Wróć do receptury</button><button id="cook-reset-v20">↻ Gotuj ponownie</button></div></div>`;
  const active=Math.min(Math.max(+st.activeStep||0,0),Math.max(steps.length-1,0)),step=steps[active];
  return `<div class="v3-cook"><div class="v3-cook-head"><div><span class="v3-kicker">GOTUJĘ · ${pct}%</span><h1>${escapeHtml(r.name)}</h1></div><span class="v3-progress-label">${steps.length?active+1:0} / ${steps.length}</span></div><div class="v3-progress"><span style="width:${pct}%"></span></div><div class="v3-cook-photo"><img src="${escapeHtml(recipeImage(r))}" alt="${escapeHtml(r.name)}"></div><section class="v3-focus"><div class="v3-step-badge">${active+1}</div><div><span class="v3-kicker">AKTUALNY KROK</span><h2>${step?escapeHtml(step.text):'Brak kroków w tej recepturze.'}</h2></div></section><div class="v3-cook-info"><div><span>⏱</span><b>${fmt(r.cook||r.prep||0)} min</b><small>orientacyjnie</small></div><div><span>🍽️</span><b>${escapeHtml(r.servingType||'Na ciepło')}</b><small>podanie</small></div></div><div class="v3-tip"><span>💡</span><div><b>Wskazówka</b><p>${escapeHtml(r.notes||'Pracuj spokojnie i kontroluj konsystencję zamiast opierać się wyłącznie na czasie.')}</p></div></div><div class="v3-cook-actions"><button id="cook-prev" ${active<=0?'disabled':''}>← Poprzedni</button><button class="v3-primary-action" id="cook-done">${step&&st.steps[step.id]?'✓ Cofnij ukończenie':'✓ Ukończ krok'}</button><button id="cook-next" ${active>=steps.length-1?'disabled':''}>Następny →</button></div><section class="v3-step-list"><div class="v3-section-head"><div><span class="v3-kicker">PLAN</span><h2>Lista kroków</h2></div></div>${steps.map((s,i)=>`<button class="v3-step-list-row ${st.steps[s.id]?'done':''} ${i===active?'active':''}" data-cook-step-v20="${s.id}" data-step-index="${i}"><span>${st.steps[s.id]?'✓':i+1}</span><div>${escapeHtml(s.text)}</div></button>`).join('')}</section><button class="v3-reset" id="cook-reset-v20">Resetuj postęp</button></div>`;
}
function viewShoppingV20(){
  const groups={};for(const x of state.shopping){const k=shopKey(x.name,x.unit);groups[k]??={...x,qty:0};groups[k].qty+=(+x.qty||0)}const list=Object.values(groups),done=list.filter(x=>x.done).length;
  return `<div class="v3-shopping"><div class="v3-page-head"><div><span class="v3-kicker">PLANOWANIE</span><h1>Zakupy</h1><p>${list.length?`${list.length} pozycji · ${done} już kupione`:'Twoja lista jest pusta.'}</p></div><button class="v3-add-btn" id="add-shopping">＋<span>Dodaj</span></button></div><div class="v3-shop-tabs"><span class="active">Wszystkie ${list.length}</span><span>Do kupienia ${list.length-done}</span><span>Kupione ${done}</span></div><div class="v3-shopping-list">${list.length?list.map(x=>`<label class="v3-shop-row ${x.done?'done':''}"><input type="checkbox" data-shop-check-v20="${escapeHtml(x.id)}" ${x.done?'checked':''}><span class="v3-shop-dot">${x.done?'✓':'•'}</span><span class="v3-shop-name">${escapeHtml(x.name)}</span><strong>${fmt(x.qty)} ${escapeHtml(x.unit)}</strong></label>`).join(''):`<div class="v3-empty"><span>🛒</span><b>Lista jest pusta</b><p>Dodaj składniki z receptury albo wpisz produkt ręcznie.</p></div>`}</div><div class="v3-shop-bottom"><button id="clear-done">Usuń ukończone</button><button id="clear-all-shop">Wyczyść wszystko</button></div></div>`;
}
function viewTraditionalV14(){
 const cuisines=[
  ['Włochy','Klasyka makaronu, pizzy i risotto','🇮🇹','./photo-carbonara.webp'],
  ['Polska','Domowe smaki i tradycyjne dania','🇵🇱','./photo-tomato.webp'],
  ['Azjatycka','Wok, makarony i intensywne aromaty','🌏','./photo-carbonara.webp'],
  ['Meksykańska','Tacos, salsa i kuchnia uliczna','🇲🇽','./photo-pizza.webp'],
  ['Francuska','Technika, sosy i klasyka','🇫🇷','./photo-tomato.webp'],
  ['Hiszpańska','Tapas, ryż i wyraziste smaki','🇪🇸','./photo-pizza.webp'],
  ['Bliski Wschód','Przyprawy, grill i mezze','🌙','./photo-tomato.webp'],
  ['Amerykańska','Comfort food i kuchnia nowoczesna','🇺🇸','./photo-pizza.webp']
 ];
 const q=String(state.traditionalQueryV14||'').toLowerCase();
 const shown=cuisines.filter(c=>!q||(c[0]+' '+c[1]).toLowerCase().includes(q));
 const selected=state.tradCatV14&&state.tradCatV14!=="Wszystkie"?state.recipes.filter(r=>r.traditional&&((r.cuisine||'').toLowerCase()===String(state.tradCatV14).toLowerCase()||(r.cuisine||'').toLowerCase().includes(String(state.tradCatV14).toLowerCase().replace('azjatycka','azja')))):[];
 return `<div class="v3-world"><div class="v3-page-head"><div><span class="v3-kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Odkrywaj klasyczne kierunki kulinarne i przechodź prosto do pasujących receptur.</p></div></div><div class="v3-search v3-world-search"><span>⌕</span><input id="traditionalSearchV14" placeholder="Szukaj kuchni lub regionu…" value="${escapeHtml(state.traditionalQueryV14||'')}"></div><div class="v3-world-grid">${shown.map(c=>`<button class="v3-world-card" data-world-cuisine="${escapeHtml(c[0])}"><img src="${c[3]}" alt="${escapeHtml(c[0])}" onerror="this.src='./photo-generic.webp'"><div class="v3-world-copy"><b>${c[2]} ${escapeHtml(c[0])}</b><span>${escapeHtml(c[1])}</span></div></button>`).join('')}</div>${selected.length?`<section class="v3-world-results"><div class="v3-section-head"><div><span class="v3-kicker">${escapeHtml(state.tradCatV14)}</span><h2>Receptury</h2></div><button class="v3-link" data-world-clear>Wszystkie</button></div><div class="v3-recipe-list">${selected.map(r=>v3RecipeCard(r,true)).join('')}</div></section>`:`<section class="v3-world-feature"><span>🍽️</span><div><b>Masz ochotę na konkretną kuchnię?</b><p>Wybierz kraj lub region powyżej. Kucharzyna pokaże zapisane klasyczne receptury z tego kierunku.</p></div></section>`}</div>`;
}

function viewCalculatorsV20(){
 const p=state.pizzaV20||{mode:'dough',flour:1000,balls:10,ball:250,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24,poolish:0,prefermentHyd:100};
 const f0=+p.flour||0,h=+p.hyd||0,s=+p.salt||0,o=+p.oil||0,y=+p.yeast||0;let f=f0;if(p.mode==='dough'){const total=(+p.balls||0)*(+p.ball||0);f=total/(1+h/100+s/100+o/100+y/100)}const water=f*h/100,salt=f*s/100,oil=f*o/100,yeast=f*y/100,total=f+water+salt+oil+yeast,balls=p.mode==='dough'?(+p.balls||0):(+p.ball>0?Math.floor(total/+p.ball):0);
 return `<div class="v3-tools"><div class="v3-page-head"><div><span class="v3-kicker">PRO KUCHNIA</span><h1>Kalkulatory</h1><p>Precyzyjne narzędzia do pizzy, ciasta i przeliczania receptur.</p></div></div><div class="v3-tool-hero"><div><span class="v3-kicker">PIZZA PRO</span><h2>Ciasto pod kontrolą.</h2><p>Ustaw hydrację, kulki, sól, drożdże i czas fermentacji. Wynik liczy się na żywo.</p></div><span class="v3-tool-icon">🍕</span></div><div class="v3-segment"><button id="p2-dough" class="${p.mode==='dough'?'active':''}">Kulki / masa</button><button id="p2-flour" class="${p.mode==='flour'?'active':''}">Mam mąkę</button></div><section class="v3-profile-picker"><div class="v3-profile-picker-head"><div><b>Profile pizzy</b><small>Zapisane parametry procesu</small></div><button class="v3-profile-new" id="p2-profile-new">＋ Nowy</button></div><div class="v3-profile-list">${state.pizzaProfiles.length?state.pizzaProfiles.map(x=>`<button class="v3-profile-option ${state.activePizzaProfileId===x.id?'active':''}" data-pizza-profile="${escapeHtml(x.id)}"><span class="v3-profile-icon">🍕</span><div><b>${escapeHtml(x.name||'Profil pizzy')}</b><span>${fmt(x.values?.hyd||65)}% · ${fmt(x.values?.time||24)} h · ${fmt(x.values?.ball||250)} g</span></div><em>${state.activePizzaProfileId===x.id?'✓':'›'}</em></button>`).join(''):`<div class="v3-profile-empty">Nie masz jeszcze zapisanych profili. Ustaw parametry i wybierz „Zapisz profil”.</div>`}</div></section><section class="v3-calc-card"><div class="v3-calc-grid">${p.mode==='flour'?`<label>Mąka<input id="p2-flour-val" type="number" inputmode="decimal" value="${p.flour}"><small>g</small></label><label>Masa kulki<input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"><small>g</small></label>`:`<label>Liczba kulek<input id="p2-balls" type="number" inputmode="decimal" value="${p.balls}"><small>szt.</small></label><label>Masa kulki<input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"><small>g</small></label>`}<label>Hydracja<input id="p2-hyd" type="number" step="0.1" value="${p.hyd}"><small>%</small></label><label>Sól<input id="p2-salt" type="number" step="0.1" value="${p.salt}"><small>%</small></label><label>Oliwa<input id="p2-oil" type="number" step="0.1" value="${p.oil}"><small>%</small></label><label>Drożdże<input id="p2-yeast" type="number" step="0.01" value="${p.yeast}"><small>%</small></label><label>Temperatura<input id="p2-temp" type="number" value="${p.temp}"><small>°C</small></label><label>Fermentacja<input id="p2-time" type="number" value="${p.time}"><small>h</small></label></div></section><section id="p2-live-result" class="v3-result"><div><span>Mąka</span><b>${fmt(f)} g</b></div><div><span>Woda</span><b>${fmt(water)} g</b></div><div><span>Sól</span><b>${fmt(salt)} g</b></div><div><span>Oliwa</span><b>${fmt(oil)} g</b></div><div><span>Drożdże</span><b>${fmt(yeast)} g</b></div><div><span>Ciasto</span><b>${fmt(total)} g</b></div><div><span>Kulki</span><b>${fmt(balls)} × ${fmt(p.ball)} g</b></div></section><section class="v3-calc-card"><div class="v3-section-head"><div><span class="v3-kicker">FERMENTACJA</span><h2>Preferment</h2></div></div><div class="v3-calc-grid"><label>Preferment<input id="p2-pref" type="number" value="${p.poolish}"><small>% mąki</small></label><label>Nawodnienie<input id="p2-prefhyd" type="number" value="${p.prefermentHyd}"><small>%</small></label></div><div class="v3-ferment-result">${p.poolish>0?`Preferment: <b>${fmt(f*p.poolish/100)} g mąki</b> · ${fmt(f*p.poolish/100*p.prefermentHyd/100)} g wody`:'Brak prefermentu'}<span>${fmt(p.time)} h · ${fmt(p.temp)}°C</span></div></section><div class="v3-tool-actions"><button class="v3-primary-action" id="p2-save">Zapisz profil</button><button id="p2-reset">Reset</button></div></div>`;
}
function viewSettings(){return `<div class="v3-settings"><div class="v3-page-head"><div><span class="v3-kicker">PERSONALIZACJA</span><h1>Ustawienia</h1><p>Dopasuj Kucharzynę do swojej kuchni i sposobu pracy.</p></div></div><section class="v3-settings-card v3-settings-profile"><div class="v3-profile-avatar">👨‍🍳</div><div><b>Kucharzyna</b><p>Twoja kuchnia. Twoje receptury.</p></div></section><section class="v3-settings-card"><div class="v3-setting-head"><span>◐</span><div><b>Wygląd</b><small>Motyw aplikacji</small></div></div><select id="theme"><option value="system">Automatyczny</option><option value="light">Jasny</option><option value="dark">Ciemny</option></select></section><section class="v3-settings-card"><div class="v3-setting-head"><span>♟</span><div><b>Tryb aplikacji</b><small>Interfejs profesjonalny lub uproszczony</small></div></div><select id="profile"><option value="pro">Profesjonalny</option><option value="amateur">Amator</option></select></section><section class="v3-settings-card"><div class="v3-setting-head"><span>▣</span><div><b>Dane i backup</b><small>Wszystko zostaje na tym urządzeniu.</small></div></div><div class="v3-setting-buttons"><button id="export">Eksportuj backup</button><button id="importBackup">Importuj backup</button><button id="openImporter">Importuj recepturę</button><button id="addCategory">＋ Dodaj kategorię</button></div></section><section class="v3-settings-note"><b>🔒 Prywatność</b><p>Kucharzyna nie potrzebuje konta, reklam ani trackera. Receptury, notatki, zakupy i lokalne zdjęcia są przechowywane na Twoim urządzeniu.</p></section></div>`;
}


/* ============================================================
   Kucharzyna 3.1 — functional UI layer
   ============================================================ */
function k3ApplyThemeStable(){
  const root=document.documentElement;
  const raw=state.settings?.theme||'system';
  const prefersDark=!!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const dark=raw==='dark'||(raw==='system'&&prefersDark);
  root.classList.toggle('dark',dark);
  root.classList.toggle('light',!dark);
  root.dataset.theme=dark?'dark':'light';
  root.dataset.themePreference=raw;
  root.style.colorScheme=dark?'dark':'light';
  document.body.classList.toggle('amateur',state.settings?.profile==='amateur');
  document.body.dataset.profile=state.settings?.profile||'pro';
  if(!window.__k3SystemThemeBound){
    const mq=window.matchMedia?.('(prefers-color-scheme: dark)');
    if(mq){mq.addEventListener?.('change',()=>{if(state.settings?.theme==='system'){k3ApplyThemeStable();toast('Motyw systemowy zaktualizowany')}});window.__k3SystemThemeBound=true;}
  }
}
applyTheme=k3ApplyThemeStable;

function k3TopbarTitle(){
  const el=$('#topbarTitle'); if(!el)return;
  const titles={start:'Start',recipes:'Przepisy',traditional:'Kuchnie świata',calculators:'Kalkulatory',shopping:'Zakupy',settings:'Ustawienia',edit:'Edytuj recepturę',cook:'Gotuję',google:'Szukaj w Google'};
  let title=titles[state.route]||'Kucharzyna';
  if(state.route==='recipe'){const r=state.recipes.find(x=>x.id===state.selectedId);title=r?.name||'Receptura';}
  el.textContent=title;
  const back=$('#globalBack');if(back)back.style.visibility=state.route==='start'?'hidden':'visible';
}

const _k3RenderV20=renderV20;
renderV20=function(){_k3RenderV20();requestAnimationFrame(k3TopbarTitle)};

/* Google recipe search: explicit user action, opens Google in a new tab. */
function k3GoogleRecipeSearch(){
  const q=(state.googleQuery||state.query||'').trim()||'przepisy kulinarne';
  const url='https://www.google.com/search?q='+encodeURIComponent(q+' przepis');
  window.open(url,'_blank','noopener,noreferrer');
}

/* Premium world-cuisine screen. */
const K3_WORLD=[
  ['Włochy','Pasta, pizza i klasyka','🇮🇹','./photo-carbonara.webp'],
  ['Polska','Domowe i regionalne','🇵🇱','./photo-generic.webp'],
  ['Japonia','Umami i precyzja','🇯🇵','./photo-generic.webp'],
  ['Meksyk','Ogień, kukurydza i limonka','🇲🇽','./photo-tomato.webp'],
  ['Tajlandia','Kwaśne, ostre i aromatyczne','🇹🇭','./photo-generic.webp'],
  ['Francja','Technika i sosy','🇫🇷','./photo-generic.webp'],
  ['Hiszpania','Tapas i kuchnia śródziemnomorska','🇪🇸','./photo-pizza.webp'],
  ['Bliski Wschód','Przyprawy, zioła i grill','🌍','./photo-tomato.webp']
];
function viewWorldPremium(){
  const q=(state.worldQuery||'').toLowerCase();
  const list=K3_WORLD.filter(x=>!q||(x[0]+' '+x[1]).toLowerCase().includes(q));
  const selected=state.worldCuisine?state.recipes.filter(r=>r.traditional&&String(r.cuisine||'').toLowerCase().includes(String(state.worldCuisine).toLowerCase())):[];
  return `<div class="v3-world"><div class="v3-page-head"><div><span class="v3-kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Odkrywaj charakterystyczne smaki, techniki i dania z różnych regionów.</p></div></div><div class="v3-search v3-world-search"><span>⌕</span><input id="worldSearch" placeholder="Szukaj kraju lub kuchni…" value="${escapeHtml(state.worldQuery||'')}"></div><div class="v3-world-grid">${list.map(x=>`<button class="v3-world-card ${state.worldCuisine===x[0]?'active':''}" data-world-cat="${escapeHtml(x[0])}"><img src="${x[3]}" alt="${escapeHtml(x[0])}" loading="lazy" decoding="async" onerror="this.src='./photo-generic.webp'"><div class="v3-world-copy"><b>${x[2]} ${escapeHtml(x[0])}</b><span>${escapeHtml(x[1])}</span></div></button>`).join('')}</div>${state.worldCuisine?`<section class="v3-world-results"><div class="v3-section-head"><div><span class="v3-kicker">${escapeHtml(state.worldCuisine)}</span><h2>Receptury</h2></div><button class="v3-link" data-world-clear>Wyczyść</button></div>${selected.length?`<div class="v3-recipe-list">${selected.map(r=>v3RecipeCard(r,true)).join('')}</div>`:`<div class="v3-empty"><span>🍽️</span><b>Jeszcze nie masz receptury z tej kuchni</b><p>Możesz dodać własną albo wyszukać inspirację w Google.</p><button class="btn primary" data-google="1">Szukaj w Google</button></div>`}</section>`:`<section class="v3-world-feature"><div class="v3-section-head"><div><span class="v3-kicker">WYBIERZ KIERUNEK</span><h2>Co znajdziesz?</h2></div></div><div class="v3-world-pills"><span>🍝 Techniki</span><span>🌶️ Składniki</span><span>🔥 Obróbka</span><span>📖 Tradycje</span></div></section>`}</div>`;
}
viewTraditionalV14=viewWorldPremium;

/* Calculator profiles are first-class: choose, load, save, delete. */
function k3ProfilePicker(){
  const profiles=state.pizzaProfiles||[];
  const active=state.activePizzaProfileId;
  return `<section class="v3-profile-picker"><div class="v3-profile-picker-head"><div><b>Profile pizzy</b><small>Zapisane ustawienia ciasta i fermentacji</small></div><button class="v3-google-btn" id="p2-new-profile">＋ Nowy</button></div><div class="v3-profile-list">${profiles.length?profiles.map(p=>`<button class="v3-profile-option ${p.id===active?'active':''}" data-profile-load="${p.id}"><span class="v3-profile-icon">🍕</span><span><b>${escapeHtml(p.name)}</b><span>${p.mode==='flour'?'na mąkę':'na kulki'} · ${fmt(p.values?.hyd||0)}% · ${fmt(p.values?.time||0)} h</span></span><em>${p.id===active?'✓':''}</em></button>`).join(''):`<div class="v3-empty"><span>🍕</span><b>Brak zapisanych profili</b><p>Zapisz pierwszy profil, żeby jednym kliknięciem wracać do swoich parametrów.</p></div>`}</div>${active?`<div class="v3-profile-actions"><button id="p2-delete-profile">Usuń wybrany profil</button></div>`:''}</section>`;
}
viewCalculatorsV20=function(){
 const p=state.pizzaV20||{mode:'dough',flour:1000,balls:10,ball:250,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24,poolish:0,prefermentHyd:100};
 const f0=+p.flour||0,h=+p.hyd||0,s=+p.salt||0,o=+p.oil||0,y=+p.yeast||0;let f=f0;if(p.mode==='dough'){const totalTarget=(+p.balls||0)*(+p.ball||0);f=totalTarget/(1+h/100+s/100+o/100+y/100)}
 const water=f*h/100,salt=f*s/100,oil=f*o/100,yeast=f*y/100,total=f+water+salt+oil+yeast,balls=p.mode==='dough'?(+p.balls||0):(+p.ball>0?Math.floor(total/+p.ball):0);
 const profiles=state.pizzaProfiles||[],active=state.activePizzaProfileId;
 return `<div class="v3-tools"><div class="v3-page-head"><div><span class="v3-kicker">PRO KUCHNIA</span><h1>Kalkulatory</h1><p>Precyzyjne narzędzia do pizzy, ciasta i przeliczania receptur.</p></div></div><div class="v3-tool-hero"><div><span class="v3-kicker">PIZZA PRO</span><h2>Ciasto pod kontrolą.</h2><p>Ustaw parametry raz, zapisz profil i wracaj do niego przy kolejnych produkcjach.</p></div><span class="v3-tool-icon">🍕</span></div><section class="v3-profile-picker"><div class="v3-profile-picker-head"><div><b>Profile pizzy</b><small>${profiles.length?`${profiles.length} zapisanych ustawień`:'Zapisz własne ustawienia ciasta'}</small></div><button class="v3-profile-new" id="p2-new-profile">＋ Nowy</button></div><div class="v3-profile-list">${profiles.length?profiles.map(pr=>`<button class="v3-profile-option ${pr.id===active?'active':''}" data-profile-load="${escapeHtml(pr.id)}"><span class="v3-profile-icon">🍕</span><span><b>${escapeHtml(pr.name||'Profil pizzy')}</b><span>${pr.mode==='flour'?'na mąkę':'na kulki'} · ${fmt(pr.values?.hyd||0)}% · ${fmt(pr.values?.time||0)} h · ${fmt(pr.values?.ball||0)} g</span></span><em>${pr.id===active?'✓':'›'}</em></button>`).join(''):`<div class="v3-profile-empty">Nie masz jeszcze zapisanych profili. Ustaw parametry poniżej i wybierz „Zapisz profil”.</div>`}</div>${active?`<div class="v3-profile-actions"><button id="p2-delete-profile">Usuń wybrany profil</button></div>`:''}</section><div class="v3-segment"><button id="p2-dough" class="${p.mode==='dough'?'active':''}">Kulki / masa</button><button id="p2-flour" class="${p.mode==='flour'?'active':''}">Mam mąkę</button></div><section class="v3-calc-card"><div class="v3-calc-grid">${p.mode==='flour'?`<label>Mąka<input id="p2-flour-val" type="number" inputmode="decimal" value="${p.flour}"><small>g</small></label><label>Masa kulki<input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"><small>g</small></label>`:`<label>Liczba kulek<input id="p2-balls" type="number" inputmode="decimal" value="${p.balls}"><small>szt.</small></label><label>Masa kulki<input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"><small>g</small></label>`}<label>Hydracja<input id="p2-hyd" type="number" step="0.1" value="${p.hyd}"><small>%</small></label><label>Sól<input id="p2-salt" type="number" step="0.1" value="${p.salt}"><small>%</small></label><label>Oliwa<input id="p2-oil" type="number" step="0.1" value="${p.oil}"><small>%</small></label><label>Drożdże<input id="p2-yeast" type="number" step="0.01" value="${p.yeast}"><small>%</small></label><label>Temperatura<input id="p2-temp" type="number" value="${p.temp}"><small>°C</small></label><label>Fermentacja<input id="p2-time" type="number" value="${p.time}"><small>h</small></label></div></section><section id="p2-live-result" class="v3-result"><div><span>Mąka</span><b>${fmt(f)} g</b></div><div><span>Woda</span><b>${fmt(water)} g</b></div><div><span>Sól</span><b>${fmt(salt)} g</b></div><div><span>Oliwa</span><b>${fmt(oil)} g</b></div><div><span>Drożdże</span><b>${fmt(yeast)} g</b></div><div><span>Ciasto</span><b>${fmt(total)} g</b></div><div><span>Kulki</span><b>${fmt(balls)} × ${fmt(p.ball)} g</b></div></section><section class="v3-calc-card"><div class="v3-section-head"><div><span class="v3-kicker">FERMENTACJA</span><h2>Preferment</h2></div></div><div class="v3-calc-grid"><label>Preferment<input id="p2-pref" type="number" value="${p.poolish}"><small>% mąki</small></label><label>Nawodnienie prefermentu<input id="p2-prefhyd" type="number" value="${p.prefermentHyd}"><small>%</small></label></div><div class="v3-ferment-result">${p.poolish>0?`Preferment: <b>${fmt(f*p.poolish/100)} g mąki</b> · ${fmt(f*p.poolish/100*p.prefermentHyd/100)} g wody`:'Brak prefermentu'}<span>${fmt(p.time)} h · ${fmt(p.temp)}°C</span></div></section><div class="v3-tool-actions"><button class="v3-primary-action" id="p2-save">Zapisz profil</button><button id="p2-reset">Reset</button></div></div>`;
};

const _k3Bind=bindV20;
bindV20=function(){
  _k3Bind();
  $('#worldSearch')?.addEventListener('input',e=>{state.worldQuery=e.target.value;clearTimeout(window.__worldTimer);window.__worldTimer=setTimeout(()=>renderV20(),100)});
  $$('#main [data-world-cat]').forEach(b=>b.addEventListener('click',()=>{state.worldCuisine=b.dataset.worldCat;renderV20()}));
  $('#main [data-world-clear]')?.addEventListener('click',()=>{state.worldCuisine='';renderV20()});
  $('#googleRecipeSearch')?.addEventListener('click',k3GoogleRecipeSearch);
  $('#googleRecipeGo')?.addEventListener('click',openGoogleRecipeSearch);
  $('#googleRecipeGo2')?.addEventListener('click',openGoogleRecipeSearch);
  $('#googleRecipeSearchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')k3GoogleRecipeSearch()});
  $$('#main [data-profile-load]').forEach(b=>b.addEventListener('click',async()=>{const p=(state.pizzaProfiles||[]).find(x=>x.id===b.dataset.profileLoad);if(!p)return;state.activePizzaProfileId=p.id;state.pizzaV20={...p.values};renderV20();toast('Profil wczytany')}));
  $('#p2-delete-profile')?.addEventListener('click',async()=>{if(!state.activePizzaProfileId)return;await del('pizzaProfiles',state.activePizzaProfileId);state.pizzaProfiles=await getAll('pizzaProfiles');state.activePizzaProfileId=null;toast('Profil usunięty');renderV20()});
  const saveProfile=async()=>{const p=state.pizzaV20||{};openModal(`<h2>Zapisz profil pizzy</h2><p class="muted">Zapisz aktualne parametry pod własną nazwą.</p><input id="k3-profile-name" placeholder="Np. Napoli 65% / 24h"><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="k3-profile-ok">Zapisz</button></div>`);$('#k3-profile-ok')?.addEventListener('click',async()=>{const name=$('#k3-profile-name')?.value.trim();if(!name)return;const rec={id:uid(),name,mode:p.mode||'dough',values:{...p}};await put('pizzaProfiles',rec);state.pizzaProfiles=await getAll('pizzaProfiles');state.activePizzaProfileId=rec.id;closeModal();renderV20();toast('Profil zapisany')})};
  const oldSave=$('#p2-save'); if(oldSave){const fresh=oldSave.cloneNode(true);oldSave.replaceWith(fresh);fresh.addEventListener('click',saveProfile)}
  $('#p2-new-profile')?.addEventListener('click',()=>{state.activePizzaProfileId=null;state.pizzaV20={mode:'dough',flour:1000,balls:10,ball:250,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24,poolish:0,prefermentHyd:100};renderV20();toast('Nowy profil — ustaw parametry')});
};

/* Add the Google button without changing the existing local search. */
const _k3ViewRecipes=viewRecipes;
viewRecipes=function(){
  const html=_k3ViewRecipes();
  return html.replace('    <div class="v3-chips">','    <div class="v3-web-search"><button class="v3-google-btn" id="googleRecipeSearch"><span>G</span> Szukaj w Google</button></div><div class="v3-chips">');
};

/* Extra local visual fallbacks by dish family. */
const _k3RecipeImage=recipeImage;
recipeImage=function(r){
  const direct=_k3RecipeImage(r); if(direct && direct!=='./photo-generic.webp') return direct;
  const c=String(r?.category||'').toLowerCase(), n=String(r?.name||'').toLowerCase();
  if(/deser|ciasto|słod/.test(c+' '+n)) return './photo-generic.webp';
  if(/mięso|woł|wieprz|kurcz|drób/.test(c+' '+n)) return './photo-tomato.webp';
  if(/ryb|owoc.*morza|krewet/.test(c+' '+n)) return './photo-generic.webp';
  if(/sałat/.test(c+' '+n)) return './photo-tomato.webp';
  return direct;
};

/* Re-apply stable theme and topbar once the app has booted. */
setTimeout(()=>{k3ApplyThemeStable();k3TopbarTitle()},0);

/* ============================================================
   Kucharzyna 3.2 — Receptury 2.0 / GOTUJĘ 2.0 / Zakupy 2.0
   ============================================================ */
function k32RecipeFamily(r){
  const s=(String(r?.category||'')+' '+String(r?.name||'')).toLowerCase();
  if(/pizza|pieczywo|naan|focaccia/.test(s)) return 'pizza';
  if(/pasta|makaron|risotto|ryż/.test(s)) return 'pasta';
  if(/deser|ciasto|tiramisu|baklava|crème|creme/.test(s)) return 'dessert';
  if(/ryb|owoc.*morza|krewet|ośmior/.test(s)) return 'seafood';
  if(/mięso|woł|wieprz|kurcz|drób|baran|kebab/.test(s)) return 'meat';
  if(/sałat/.test(s)) return 'salad';
  if(/zup/.test(s)) return 'soup';
  if(/sos/.test(s)) return 'sauce';
  return 'dish';
}
const K32_FAMILY_LABEL={pizza:'Pizza / pieczywo',pasta:'Pasta / ryż',dessert:'Desery',seafood:'Ryby / owoce morza',meat:'Mięso',salad:'Sałatki',soup:'Zupy',sauce:'Sosy',dish:'Danie'};
const K32_ING_ATLAS={
  // Row 0: baking basics, fats, dairy, eggs
  "mąka":[0,0],"mąka typ 00":[0,0],"mąka pszenna":[0,0],"mąka typ 450/550":[0,0],"zakwas żytni":[0,0],
  "woda":[0,1],"sól":[0,2],"cukier":[0,3],"drożdże":[0,4],"skrobia ziemniaczana":[0,3],
  "oliwa":[0,6],"olej":[0,6],"olej roślinny":[0,6],"olej palmowy":[0,6],"olej sezamowy":[0,6],
  "masło":[0,7],"ghee":[0,7],"smalec":[0,7],"mleko":[0,8],"śmietana":[0,9],"śmietanka":[0,9],"jogurt":[0,9],"jogurt grecki":[0,9],
  "jajka":[0,10],"jajko":[0,10],"żółtka":[0,11],"żółtko":[0,11],
  // Row 1: cheeses, dairy, aromatics
  "mozzarella":[1,0],"mozzarella di bufala":[1,0],"twaróg":[1,3],"ricotta":[1,4],"parmesan":[1,5],"parmigiano":[1,5],"pecorino":[1,6],"pecorino romano":[1,6],"gorgonzola":[1,7],"ser pleśniowy":[1,7],"ser żółty":[1,8],"ser":[1,8],"feta":[1,8],"paneer":[1,9],"mascarpone":[1,8],
  "czosnek":[3,0],"cebula":[3,2],"czerwona cebula":[3,3],"por":[3,9],"marchew":[3,12],"seler":[3,11],"pietruszka":[3,14],"kolendra":[3,15],"koperek":[3,16],"szczypiorek":[3,19],
  "bazylia":[2,12],"oregano":[2,15],"tymianek":[2,16],"rozmaryn":[2,17],"majeranek":[2,18],"szałwia":[2,19],"imbir":[3,6],"trawa cytrynowa":[3,19],
  // Row 2/4: tomatoes, vegetables, herbs, mushrooms
  "pomidor":[2,0],"pomidory":[2,0],"pomidory san marzano":[2,1],"pomidory san marzano pelati":[2,7],"passata":[2,10],"koncentrat pomidorowy":[2,10],
  "papryka":[4,4],"papryka świeża":[4,4],"papryczka chili":[4,7],"chili":[4,7],"ancho chili":[4,7],"suszone chili":[7,16],"jalapeño":[4,8],"cukinia":[4,10],"bakłażan":[4,11],"ogórek":[4,10],
  "ziemniaki":[4,0],"marchewka":[4,2],"pieczarki":[4,13],"grzyby":[4,15],"borowiki":[4,16],"trufle":[4,19],"szpinak":[3,13],"rukola":[3,15],"sałata":[3,14],"karczochy":[7,11],"oliwki":[7,9],"kapary":[7,8],
  // Row 5: meat and cured meat
  "wołowina":[5,0],"wołowina mielona":[5,1],"wieprzowina":[5,3],"wieprzowina mielona":[5,4],"kurczak":[5,5],"udka z kurczaka":[5,6],"baranina mielona":[5,1],"jagnięcina":[5,1],"królik":[5,4],"boczek":[5,8],"pancetta":[5,8],"guanciale":[5,8],"szynka":[5,10],"prosciutto":[5,10],"salami":[5,12],"kiełbasa":[5,16],"chorizo":[5,18],"biała kiełbasa":[5,16],"wędzonka":[5,8],"tłuszcz barani":[5,1],"pasztet":[6,11],
  // Row 6: seafood, pasta, grains
  "krewetki":[6,0],"krewetka":[6,0],"małże":[6,4],"mule":[6,4],"ośmiornica":[6,3],"ośmiornica gotowana":[6,3],"ryba":[6,6],"biała ryba":[6,6],"dorsz":[6,6],"łosoś":[6,7],"tuńczyk":[6,8],"anchois":[6,9],"bułka tarta":[6,10],
  "spaghetti":[6,0],"makaron":[6,2],"makaron ryżowy":[6,2],"makaron ramen":[6,3],"tonnarelli":[6,1],"ciasto filo":[6,9],"tortille":[6,1],
  "ryż":[6,13],"ryż arborio":[6,13],"ryż risotto":[6,13],"ryż ugotowany":[6,13],"kasza":[6,12],"groszek":[7,4],"fasolka":[7,4],"fasola":[7,0],"czarna fasola":[7,1],"ciecierzyca":[7,3],"sucha ciecierzyca":[7,3],"soczewica":[7,2],
  // Row 7: legumes, nuts, condiments, citrus, spices
  "orzechy":[7,14],"orzeszki":[7,14],"migdały":[7,15],"pistacje":[7,19],"sezam":[7,14],"miód":[7,0],"musztarda":[7,1],"majonez":[7,2],"ketchup":[7,3],"sos pomidorowy":[7,3],"sos sojowy":[7,4],"sos rybny":[7,4],"ocet":[7,5],"ocet ryżowy":[7,5],"ocet winny":[7,5],"espresso":[7,6],"kakao":[7,3],"cytryna":[7,7],"sok z cytryny":[7,7],"sok z limonki":[7,8],"limonka":[7,8],"pomarańcza":[7,9],"szafran":[7,16],"pieprz":[7,12],"pieprz czarny":[7,12],"pieprz syczuański":[7,12],"kumin":[7,11],"kminek":[7,11],"garam masala":[7,13],"five spice":[7,13],"anyż":[7,11],"cynamon":[7,12],"vanilia":[7,13],"wanilia":[7,13],
  "awokado":[4,10],"ananas":[7,9],"gruszka":[7,9],"śliwki suszone":[7,17],"mleko kokosowe":[0,9],"tofu":[1,9],"tahini":[7,2],"pasta tamaryndowa":[7,5],"pasta massaman":[7,5],"pasta gochujang":[7,3],"gochujang":[7,3],"miso":[7,4],"dashi":[0,8],"mirin":[7,5],"hoisin":[7,4],"doubanjiang":[7,3],"liście kaffiru":[2,18],"nori":[2,19],"wakame":[2,18],"achiote":[7,16],
};
function k32IngredientIcon(name=''){
  const raw=String(name).trim().toLowerCase();
  const exact=K32_ING_ATLAS[raw];
  if(exact)return exact;
  const key=Object.keys(K32_ING_ATLAS).find(k=>raw.includes(k)||k.includes(raw));
  if(key)return K32_ING_ATLAS[key];
  const rules=[
    [/mąk|maka|flour/,'mąka'],[/drożd|drozd/,'drożdże'],[/pomidor/,'pomidory'],[/czosnek/,'czosnek'],[/cebula/,'cebula'],[/bazyl/,'bazylia'],
    [/pieprz|pepper/,'sól'],[/olej|tłuszcz|ghee/,'oliwa'],[/ser|cheese/,'mozzarella'],[/jogurt|kefir/,'mleko'],[/śmiet|cream/,'śmietana'],
    [/mięso|wieprz|boczek|kiełbasa|baran|jagnię|królik/,'wołowina'],[/ryb|fish/,'dorsz'],[/owoce morza|ośmior|krewet/,'krewetki'],
    [/orzech|migdał|sezam/,'miód'],[/ciecierzy|hummus/,'fasola'],[/kapust/,'sałata'],[/imbir|galangal/,'szczypiorek'],[/cytr/,'cytryna'],[/lima/,'limonka']
  ];
  for(const [re,target] of rules){if(re.test(raw))return K32_ING_ATLAS[target]||null}
  return null;
}
function k32IngredientIconMarkup(name){const p=k32IngredientIcon(name)||[0,0];return `<span class="k32-ing-thumb${p===null?"":""}" style="--ix:${p[0]};--iy:${p[1]}" aria-hidden="true"></span>`}

function k32ShortDescription(r){
  const names=ingredientGroupsSafe(r).map(i=>String(i.name||'').trim()).filter(Boolean);
  const unique=[];
  for(const n of names){ if(!unique.some(x=>x.toLowerCase()===n.toLowerCase())) unique.push(n); if(unique.length>=4) break; }
  if(unique.length) return `W środku: ${unique.join(', ')}.`;
  const direct=String(r?.description||'').replace(/\s+/g,' ').trim().replace(/^Klasyczne danie[^.]*\.\s*/i,'');
  if(direct.length<=74) return direct || 'Przejrzysta receptura krok po kroku.';
  const cut=direct.slice(0,74);
  const last=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf(', '),cut.lastIndexOf(' '));
  return (last>30?cut.slice(0,last):cut).trim()+ '…';
}
function k32RecipeCard(r){
  const src=recipeImage(r),family=k32RecipeFamily(r),meta=[r.category||'Inne',r.yield?`${fmt(r.yield)} ${r.yieldUnit||''}`:'',r.cook?`${fmt(r.cook)} min`:'' ].filter(Boolean).join(' · ');
  return `<article class="k32-recipe-card" data-open="${escapeHtml(r.id)}"><div class="k32-card-photo photo-ambient"><img class="photo-ambient-blur" src="${escapeHtml(src)}" aria-hidden="true" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><img class="photo-ambient-main" src="${escapeHtml(src)}" alt="${escapeHtml(r.name)}" loading="lazy" decoding="async" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><div class="k32-photo-badge">${escapeHtml(K32_FAMILY_LABEL[family])}</div><button class="k32-heart" data-fav="${escapeHtml(r.id)}" aria-label="Ulubiona">${r.favorite?'♥':'♡'}</button></div><div class="k32-card-body"><div class="k32-card-top"><span>${r.traditional?'★ Klasyczna':'Własna receptura'}</span><span>${r.lastUsedAt?'Ostatnio używana':''}</span></div><h3>${escapeHtml(r.name)}</h3><p class="k32-card-description">${escapeHtml(k32ShortDescription(r))}</p><div class="k32-card-meta"><span>${escapeHtml(meta)}</span><b>›</b></div></div></article>`;
}

/* Rich recipe library replaces the older plain list. */
const _k32ViewRecipesBase=viewRecipes;
viewRecipes=function(){
  let rs=[...state.recipes];
  const q=String(state.query||'').trim().toLowerCase();
  if(q) rs=rs.filter(r=>(`${r.name||''} ${r.description||''} ${(r.tags||[]).join(' ')} ${r.category||''} ${r.cuisine||''} ${ingredientGroupsSafe(r).map(i=>i.name||'').join(' ')} ${r.notes||''}`).toLowerCase().includes(q));
  if(state.selectedCat!=='Wszystkie') rs=rs.filter(r=>r.category===state.selectedCat);
  if(state.sort==='name') rs.sort((a,b)=>a.name.localeCompare(b.name,'pl'));
  else if(state.sort==='fav') rs.sort((a,b)=>Number(b.favorite)-Number(a.favorite)||a.name.localeCompare(b.name,'pl'));
  else rs.sort((a,b)=>(b.lastUsedAt||b.updatedAt||'').localeCompare(a.lastUsedAt||a.updatedAt||''));
  const cats=['Wszystkie',...state.categories.map(c=>c.name)];
  return `<div class="k32-library"><div class="k32-page-head"><div><span class="kicker">TWOJA BAZA</span><h1>Receptury</h1><p>${rs.length} ${rs.length===1?'receptura':'receptur'} · wszystko zapisane lokalnie.</p></div><button class="btn primary k32-new" data-action="new">＋ Nowa</button></div><div class="k32-search"><span>⌕</span><input id="recipeSearch" placeholder="Szukaj po nazwie, składniku lub kategorii…" value="${escapeHtml(state.query||'')}"><button id="k32-clear-search" aria-label="Wyczyść" ${q?'':'hidden'}>×</button></div><div class="chips k32-chips">${cats.map(c=>`<button class="chip ${state.selectedCat===c?'active':''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div><div class="k32-toolbar"><select id="sort"><option value="recent" ${state.sort==='recent'?'selected':''}>Ostatnio używane</option><option value="name" ${state.sort==='name'?'selected':''}>Nazwa A–Z</option><option value="fav" ${state.sort==='fav'?'selected':''}>Ulubione</option></select><button class="btn" data-google="1">Google</button><button class="btn" data-action="import">Importuj</button></div>${rs.length?`<div class="k32-recipe-grid">${rs.map(k32RecipeCard).join('')}</div>`:`<div class="v3-empty"><span>🍽️</span><b>Nie znaleziono receptur</b><p>Zmień wyszukiwanie lub dodaj nową recepturę.</p><button class="btn primary" data-action="new">＋ Nowa receptura</button></div>`}</div>`;
};

/* Rich single-recipe screen with direct photo replacement. */
const _k32RecipeViewBase=recipeViewV20;
recipeViewV20=function(id){
  const r=state.recipes.find(x=>x.id===id); if(!r)return viewRecipes();
  const ingredients=ingredientGroups(r),desc=recipeDescription(r),family=k32RecipeFamily(r),timer=state.cook[r.id]?.timer;
  const img=recipeImage(r);
  return `<div class="k32-detail"><section class="k32-detail-hero photo-ambient"><img class="photo-ambient-blur" src="${escapeHtml(img)}" aria-hidden="true" loading="eager" decoding="async" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><img class="photo-ambient-main" src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" loading="eager" decoding="async" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.src='./photo-generic.webp'"><div class="k32-detail-gradient"></div><div class="k32-detail-actions-top"><button class="k32-round" data-photo-change="${escapeHtml(r.id)}" aria-label="Zmień zdjęcie">⌘</button><button class="k32-round" data-fav="${escapeHtml(r.id)}">${r.favorite?'♥':'♡'}</button></div><div class="k32-detail-copy"><span>${escapeHtml(K32_FAMILY_LABEL[family])} ${r.flag||''} ${r.traditional?'· ★ KLASYCZNA':''}</span><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(desc)}</p></div></section><div class="k32-stats"><div><b>${fmt(r.yield||0)} ${escapeHtml(r.yieldUnit||'')}</b><span>wydajność</span></div><div><b>${fmt(r.prep||0)} + ${fmt(r.cook||0)} min</b><span>praca / gotowanie</span></div><div><b>${ingredients.length}</b><span>składników</span></div><div><b>${(r.steps||[]).length}</b><span>kroków</span></div></div><div class="k32-actions"><button class="btn primary" data-cook="${r.id}">▶ GOTUJĘ</button><button class="btn" data-scale="${r.id}">⇄ Przelicz</button><button class="btn" data-edit="${r.id}">✎ Edytuj</button><button class="btn" data-shop-recipe="${r.id}">＋ Zakupy</button></div>${timer?.running?`<div class="k32-live-note">⏱️ Ten przepis ma aktywny timer — wrócisz do niego w trybie GOTUJĘ.</div>`:''}<section class="k32-section"><div class="k32-section-head"><div><span class="kicker">SKŁADNIKI</span><h2>Co potrzebujesz</h2></div><span class="k32-count">${ingredients.length}</span></div>${(r.sections||[]).map(s=>`<div class="k32-ing-group"><div class="k32-group-title"><b>${escapeHtml(s.name)}</b><span>${(s.ingredients||[]).length} poz.</span></div>${(s.ingredients||[]).map(i=>`<button class="k32-ing" data-recipe-ing="${escapeHtml(i.id)}">${k32IngredientIconMarkup(i.name)}<span class="k32-ing-name">${escapeHtml(i.name)}</span><strong>${fmt(i.qty)} ${escapeHtml(i.unit||'')}</strong></button>`).join('')}</div>`).join('')}</section><section class="k32-section"><div class="k32-section-head"><div><span class="kicker">WYKONANIE</span><h2>Krok po kroku</h2></div><span class="k32-count">${(r.steps||[]).length}</span></div><div class="k32-steps">${(r.steps||[]).map((s,i)=>`<article><span>${i+1}</span><div><b>Krok ${i+1}</b><p>${escapeHtml(s.text)}</p></div></article>`).join('')}</div></section><section class="k32-info-grid"><div class="k32-info"><span>🍽️ Sposób podania</span><b>${escapeHtml(k32ServingTypeFor(r))}</b></div><div class="k32-info"><span>⏱️ Fermentacja</span><b>${r.ferment?`${fmt(r.ferment)} h`:'—'}</b></div><div class="k32-info"><span>📝 Źródło</span><b>${escapeHtml(r.source||'Własna receptura')}</b></div></section><section class="k32-notes"><span>WŁASNE UWAGI</span><p>${escapeHtml(r.notes||'Brak własnych uwag. Dodaj je przez „Edytuj”, a Kucharzyna zapamięta je razem z recepturą.')}</p></section><div class="k32-bottom-actions"><button class="btn" data-history="${r.id}">Historia</button><button class="btn danger" data-delete="${r.id}">Usuń recepturę</button></div></div>`;
};

function k32TimerData(r){
  const st=cookStateFor(r); st.timer ||= {duration:Math.max(1,(+r.cook||15)*60),remaining:Math.max(1,(+r.cook||15)*60),running:false,startedAt:0}; return st;
}
function k32FormatTimer(sec){sec=Math.max(0,Math.ceil(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function k32TimerRemaining(st){if(!st.timer)return 0;if(st.timer.running&&st.timer.startedAt)return Math.max(0,st.timer.remaining-(Date.now()-st.timer.startedAt)/1000);return Math.max(0,st.timer.remaining||0)}
function k32TimerMarkup(r){const st=k32TimerData(r),remain=k32TimerRemaining(st),duration=Math.max(1,st.timer.duration||remain||60),pct=Math.max(0,Math.min(100,remain/duration*100));return `<section class="k32-timer"><div class="k32-timer-head"><div><span class="kicker">TIMER</span><h2 id="k32-timer-value">${k32FormatTimer(remain)}</h2><small id="k32-timer-state">${st.timer.running?'Odliczanie…':remain<=0?'Czas minął':'Gotowy'}</small></div><div class="k32-timer-ring"><span style="--p:${pct}%"></span>⏱️</div></div><div class="k32-timer-bar"><span id="k32-timer-bar-fill" style="width:${pct}%"></span></div><div class="k32-timer-presets">${[5,10,15,30,60].map(m=>`<button data-timer-preset="${m}">${m} min</button>`).join('')}</div><div class="k32-timer-controls"><button class="btn primary" id="k32-timer-toggle">${st.timer.running?'Pauza':'Start'}</button><button class="btn" id="k32-timer-reset">Reset</button></div></section>`}

function viewCookV20(){
  const r=state.recipes.find(x=>x.id===state.selectedId); if(!r)return viewRecipes();
  const st=cookStateFor(r),steps=r.steps||[],ingredients=ingredientGroups(r),doneSteps=steps.filter(s=>st.steps[s.id]).length,pct=steps.length?Math.round(doneSteps/steps.length*100):0;
  if(st.completed)return `<div class="k32-cook"><div class="k32-cook-top"><button class="btn ghost" data-back="recipe">← Receptura</button><span>100%</span></div>${photoMarkup(r,'k32-cook-photo')}<div class="k32-complete"><div>✓</div><span class="kicker">GOTOWANIE ZAKOŃCZONE</span><h1>${escapeHtml(r.name)}</h1><p>Wszystkie kroki zostały wykonane. Timer i postęp zostały zachowane na urządzeniu.</p><div class="row" style="justify-content:center"><button class="btn primary" id="cook-back-recipe">Wróć do receptury</button><button class="btn" id="cook-reset-v20">Gotuj ponownie</button></div></div></div>`;
  const active=Math.min(Math.max(+st.activeStep||0,0),Math.max(steps.length-1,0)),step=steps[active];
  return `<div class="k32-cook"><div class="k32-cook-top"><button class="btn ghost" data-back="recipe">← Receptura</button><div><b>${pct}%</b><small>postępu</small></div></div><div class="k32-cook-hero"><div class="kicker">GOTUJĘ TERAZ</div><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(r.category||'Receptura')} · ${escapeHtml(k32ServingTypeFor(r))}${r.cook?` · ${fmt(r.cook)} min`:''}</p></div><div class="k32-progress"><span style="width:${pct}%"></span></div>${k32TimerMarkup(r)}<section class="k32-focus"><span class="kicker">KROK ${steps.length?active+1:0} / ${steps.length}</span><h2>${step?escapeHtml(step.text):'Brak kroków w tej recepturze.'}</h2><div class="k32-focus-actions"><button class="btn" id="cook-prev" ${active<=0?'disabled':''}>← Poprzedni</button><button class="btn primary" id="cook-done">${step&&st.steps[step.id]?'✓ Cofnij':'✓ Ukończ krok'}</button><button class="btn" id="cook-next" ${active>=steps.length-1?'disabled':''}>Następny →</button></div></section><section class="k32-cook-section"><div class="k32-section-head"><div><span class="kicker">MISE EN PLACE</span><h2>Składniki</h2></div><span class="k32-count">${ingredients.length}</span></div>${ingredients.map(i=>`<label class="k32-cook-ing ${st.ingredients[i.id]?'done':''}"><input type="checkbox" data-cook-ing-v20="${escapeHtml(i.id)}" ${st.ingredients[i.id]?'checked':''}>${k32IngredientIconMarkup(i.name)}<span class="k32-cook-ing-name">${escapeHtml(i.name)}</span><strong>${fmt(i.qty)} ${escapeHtml(i.unit||'')}</strong></label>`).join('')}</section><section class="k32-cook-section"><div class="k32-section-head"><div><span class="kicker">POSTĘP</span><h2>Wszystkie kroki</h2></div></div>${steps.map((s,i)=>`<button class="k32-step-row ${st.steps[s.id]?'done':''} ${i===active?'active':''}" data-cook-step-v20="${escapeHtml(s.id)}" data-step-index="${i}"><span>${i+1}</span><div>${escapeHtml(s.text)}</div><b>${st.steps[s.id]?'✓':''}</b></button>`).join('')}</section>${r.notes?`<section class="k32-cook-note"><b>📝 Twoja uwaga</b><p>${escapeHtml(r.notes)}</p></section>`:''}<button class="btn danger" id="cook-reset-v20">Resetuj postęp</button></div>`;
}

function k32ShoppingGroups(){
  const groups=new Map();
  for(const x of state.shopping){const k=shopKey(x.name,x.unit);if(!groups.has(k))groups.set(k,{...x,qty:0,ids:[]});const g=groups.get(k);g.qty+=(+x.qty||0);g.ids.push(x.id);g.done=g.done&&x.done;}
  return [...groups.values()];
}
function viewShoppingV20(){
  const list=k32ShoppingGroups(),done=list.filter(x=>x.done).length;
  return `<div class="k32-shopping"><div class="k32-page-head"><div><span class="kicker">LISTA ZAKUPÓW</span><h1>Co kupić?</h1><p>${list.filter(x=>!x.done).length} pozycji do kupienia · składniki z receptur są automatycznie scalane.</p></div><button class="btn primary" id="add-shopping">＋ Dodaj</button></div><div class="v3-shop-tabs"><span class="active">Wszystkie ${list.length}</span><span>Do kupienia ${list.length-done}</span><span>Kupione ${done}</span></div><div class="k32-shopping-list">${list.length?list.map(x=>`<div class="k32-shop-row ${x.done?'done':''}"><input type="checkbox" data-shop-check-v20="${escapeHtml(x.ids[0])}" ${x.done?'checked':''}><div class="k32-shop-main"><b>${escapeHtml(x.name)}</b><span>${fmt(x.qty)} ${escapeHtml(x.unit||'')}</span></div><div class="k32-shop-stepper"><button data-shop-adjust="${escapeHtml(x.ids[0])}" data-delta="-1">−</button><button data-shop-adjust="${escapeHtml(x.ids[0])}" data-delta="1">＋</button></div></div>`).join(''):`<div class="v3-empty"><span>🛒</span><b>Lista jest pusta</b><p>Dodaj składniki z receptury albo produkt ręcznie.</p></div>`}</div><div class="v3-shop-bottom"><button id="clear-done">Usuń ukończone</button><button id="clear-all-shop">Wyczyść wszystko</button></div></div>`;
}

/* One-tap photo replacement from the recipe detail. */
async function k32ChangeRecipePhoto(id,file){const r=state.recipes.find(x=>x.id===id);if(!r||!file)return;r.image=await compressImage(file);r.imageSource='local';r.imageCredit='Zdjęcie dodane z iPhone’a';r.updatedAt=now();await put('recipes',r);state.recipes=await getAll('recipes');renderV20();toast('Zdjęcie receptury zapisane')}

/* Wake Lock keeps the iPhone screen awake during cooking. */
let k32WakeLock=null;
async function k32AcquireWakeLock(){try{if(!('wakeLock' in navigator))return;k32WakeLock=await navigator.wakeLock.request('screen');k32WakeLock.addEventListener?.('release',()=>{k32WakeLock=null})}catch(e){}}
async function k32ReleaseWakeLock(){try{await k32WakeLock?.release()}catch(e){}k32WakeLock=null}
function k32ManageWakeLock(){if(state.route==='cook'){k32AcquireWakeLock();document.addEventListener('visibilitychange',k32VisibilityWake,{passive:true});}else{k32ReleaseWakeLock();document.removeEventListener('visibilitychange',k32VisibilityWake)}}
function k32VisibilityWake(){if(document.visibilityState==='visible'&&state.route==='cook')k32AcquireWakeLock()}

const _k32Render=renderV20;
renderV20=function(){_k32Render();requestAnimationFrame(()=>{k3TopbarTitle();k32ManageWakeLock();if(state.route==='cook')k32StartTimerTicker()})};
function k32StartTimerTicker(){clearInterval(window.__k32TimerTicker);window.__k32TimerTicker=setInterval(async()=>{if(state.route!=='cook'){clearInterval(window.__k32TimerTicker);return}const r=state.recipes.find(x=>x.id===state.selectedId);if(!r)return;const st=cookStateFor(r),remain=k32TimerRemaining(st),value=$('#k32-timer-value'),bar=$('#k32-timer-bar-fill'),label=$('#k32-timer-state'),toggle=$('#k32-timer-toggle');if(value)value.textContent=k32FormatTimer(remain);if(bar)bar.style.width=`${Math.max(0,Math.min(100,remain/(st.timer?.duration||1)*100))}%`;if(label)label.textContent=st.timer?.running?(remain<=0?'Czas minął':'Odliczanie…'):(remain<=0?'Czas minął':'Gotowy');if(toggle)toggle.textContent=st.timer?.running?'Pauza':'Start';if(st.timer?.running&&remain<=0){st.timer.running=false;st.timer.remaining=0;await put('cookState',st);state.cook[r.id]=st;toast('⏱️ Timer zakończony');}} ,250)}

const _k32Bind=bindV20;
bindV20=function(){
  _k32Bind();
  $$('#main [data-photo-change]').forEach(b=>b.addEventListener('click',()=>{const input=document.createElement('input');input.type='file';input.accept='image/*';input.capture='environment';input.onchange=()=>k32ChangeRecipePhoto(b.dataset.photoChange,input.files?.[0]);input.click()}));
  $$('#main [data-google]').forEach(b=>b.addEventListener('click',()=>nav('google')));
  $('#k32-clear-search')?.addEventListener('click',()=>{state.query='';renderV20();requestAnimationFrame(()=>$('#recipeSearch')?.focus())});
  if(state.route==='shopping'){
    $$('#main [data-shop-adjust]').forEach(b=>b.addEventListener('click',async()=>{const x=state.shopping.find(i=>i.id===b.dataset.shopAdjust);if(!x)return;x.qty=Math.max(0,(+x.qty||0)+(+b.dataset.delta||0));await put('shoppingItems',x);state.shopping=await getAll('shoppingItems');renderV20()}));
  }
};

/* ============================================================
   Kucharzyna 3.3 UI FIX PACK
   World cuisine drill-down · Favorites filter · Shopping redesign · Diagnostics
   ============================================================ */
const K33_WORLD=[
  ['Włochy','🇮🇹','Klasyka pizzy, makaronu i risotto','Włochy','./photo-pizza.webp'],
  ['Polska','🇵🇱','Domowe i regionalne smaki','Polska','./photo-pierogi-ruskie.webp'],
  ['Japonia','🇯🇵','Umami, ramen i kuchnia precyzji','Japonia','./photo-ramen-shoyu.webp'],
  ['Tajlandia','🇹🇭','Ostre, kwaśne i aromatyczne','Tajlandia','./photo-pad-thai.webp'],
  ['Francja','🇫🇷','Sosy, technika i klasyka','Francja','./photo-coq-au-vin.webp'],
  ['Hiszpania','🇪🇸','Tapas, ryż i śródziemnomorski charakter','Hiszpania','./photo-paella-valenciana.webp'],
  ['Grecja','🇬🇷','Feta, zioła i kuchnia Morza Egejskiego','Grecja','./photo-tzatziki.webp'],
  ['Turcja','🇹🇷','Grill, przyprawy i słodkości','Turcja','./photo-adana-kebab.webp'],
  ['Meksyk','🇲🇽','Chili, kukurydza i limonka','Meksyk','./photo-tacos-al-pastor.webp'],
  ['Peru','🇵🇪','Ceviche i kuchnia Pacyfiku','Peru','./photo-ceviche.webp'],
  ['Maroko','🇲🇦','Tagine, cytryna i przyprawy','Maroko','./photo-tagine-z-kurczakiem-i-cytryna.webp'],
  ['Korea','🇰🇷','Kimchi, grill i fermentacja','Korea','./photo-bulgogi.webp'],
  ['Węgry','🇭🇺','Papryka, gulasze i domowe dania','Węgry','./photo-goulash.webp'],
  ['Brazylia','🇧🇷','Fasola, owoce morza i tropikalne smaki','Brazylia','./photo-feijoada.webp'],
  ['Liban','🇱🇧','Mezze, tahini i świeże zioła','Liban','./photo-hummus.webp'],
  ['Wielka Brytania','🇬🇧','Comfort food i klasyczne dania','Wielka Brytania','./photo-fish-and-chips.webp']
];
function k33WorldRecipes(cuisine){
  const c=String(cuisine||'').toLowerCase();
  return state.recipes.filter(r=>r.traditional && String(r.cuisine||'').toLowerCase()===c);
}
function k33WorldView(){
  const selected=state.tradCatV14||'';
  if(selected){
    const meta=K33_WORLD.find(x=>x[0]===selected)||K33_WORLD[0];
    let rs=k33WorldRecipes(meta[3]);
    const q=String(state.worldDishQuery||'').trim().toLowerCase();
    if(q)rs=rs.filter(r=>(`${r.name||''} ${r.description||''} ${(r.tags||[]).join(' ')}`).toLowerCase().includes(q));
    return `<div class="k33-world-detail">
      <button class="k33-back-button" data-world-menu>‹ Wszystkie kuchnie</button>
      <section class="k33-world-hero photo-ambient"><img class="photo-ambient-blur" src="${escapeHtml(meta[4])}" aria-hidden="true" loading="eager" decoding="async" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><img class="photo-ambient-main" src="${escapeHtml(meta[4])}" alt="${escapeHtml(meta[0])}" loading="eager" decoding="async" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.src='./photo-generic.webp'"><div class="k33-world-hero-overlay"></div><div class="k33-world-hero-copy"><span>${meta[1]}</span><small>KUCHNIA ŚWIATA</small><h1>${escapeHtml(meta[0])}</h1><p>${escapeHtml(meta[2])}</p></div></section>
      <div class="k33-world-title"><div><span class="kicker">MENU</span><h2>Dania kuchni ${escapeHtml(meta[0])}</h2><p>${rs.length} ${rs.length===1?'danie':'dań'} w Kucharzynie</p></div></div>
      <div class="k33-search"><span>⌕</span><input id="k33-world-dish-search" placeholder="Szukaj dania…" value="${escapeHtml(state.worldDishQuery||'')}"></div>
      ${rs.length?`<div class="k33-world-recipe-grid">${rs.map(r=>k33WorldRecipeCard(r)).join('')}</div>`:`<div class="k33-empty"><div>🍽️</div><h3>Brak wyników</h3><p>Ta kuchnia nie ma jeszcze dania pasującego do wyszukiwania.</p><button class="btn" data-world-menu>Wróć do kuchni</button></div>`}
    </div>`;
  }
  const q=String(state.worldCuisineQuery||'').toLowerCase();
  const shown=K33_WORLD.filter(x=>!q||(x[0]+' '+x[2]).toLowerCase().includes(q));
  return `<div class="k33-world-menu"><div class="k33-page-intro"><span class="kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Wybierz kraj. Dopiero po wejściu zobaczysz osobne menu jego dań.</p></div><div class="k33-search"><span>⌕</span><input id="k33-world-search" placeholder="Szukaj kraju lub kuchni…" value="${escapeHtml(state.worldCuisineQuery||'')}"></div><div class="k33-cuisine-grid">${shown.map(x=>`<button class="k33-cuisine-card" data-k33-world-cuisine="${escapeHtml(x[0])}"><div class="k33-cuisine-photo photo-ambient"><img class="photo-ambient-blur" src="${escapeHtml(x[4])}" aria-hidden="true" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><img class="photo-ambient-main" src="${escapeHtml(x[4])}" alt="${escapeHtml(x[0])}" loading="lazy" decoding="async" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><span>${x[1]}</span></div><div class="k33-cuisine-copy"><b>${escapeHtml(x[0])}</b><small>${escapeHtml(x[2])}</small><em>${k33WorldRecipes(x[3]).length} dań <strong>›</strong></em></div></button>`).join('')}</div></div>`;
}
function k33WorldRecipeCard(r){
  const img=recipeImage(r); const type=k32ServingTypeFor(r);
  return `<article class="k33-dish-card" data-open="${escapeHtml(r.id)}"><div class="k33-dish-photo photo-ambient"><img class="photo-ambient-blur" src="${escapeHtml(img)}" aria-hidden="true" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><img class="photo-ambient-main" src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" loading="lazy" decoding="async" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><button class="k33-dish-heart" data-fav="${escapeHtml(r.id)}">${r.favorite?'♥':'♡'}</button><span>${type==='Na zimno'?'❄️':type==='Przekąska'?'🍽️':'🔥'} ${escapeHtml(type)}</span></div><div class="k33-dish-body"><small>${escapeHtml(r.category||'Danie')}</small><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(k32ShortDescription(r))}</p></div></article>`;
}
viewTraditionalV14=k33WorldView;

function k33RecipesView(){
  let rs=[...state.recipes];
  const q=String(state.query||'').trim().toLowerCase();
  if(q)rs=rs.filter(r=>(`${r.name||''} ${r.description||''} ${(r.tags||[]).join(' ')} ${r.category||''}`).toLowerCase().includes(q));
  if(state.sort==='fav') rs=rs.filter(r=>r.favorite).sort((a,b)=>a.name.localeCompare(b.name,'pl'));
  else if(state.selectedCat!=='Wszystkie') rs=rs.filter(r=>r.category===state.selectedCat);
  if(state.sort==='name') rs.sort((a,b)=>a.name.localeCompare(b.name,'pl'));
  else if(state.sort!=='fav') rs.sort((a,b)=>(b.lastUsedAt||b.updatedAt||'').localeCompare(a.lastUsedAt||a.updatedAt||''));
  const cats=['Wszystkie',...state.categories.map(c=>c.name)];
  const isFav=state.sort==='fav';
  return `<div class="k32-library k33-recipe-library"><div class="k32-page-head"><div><span class="kicker">${isFav?'TWOJE ULUBIONE':'TWOJA BAZA'}</span><h1>${isFav?'Ulubione':'Receptury'}</h1><p>${rs.length} ${rs.length===1?'receptura':'receptur'} · ${isFav?'tylko przepisy oznaczone sercem.':'wszystko zapisane lokalnie.'}</p></div><button class="btn primary k32-new" data-action="new">＋ Nowa</button></div><div class="k32-search"><span>⌕</span><input id="recipeSearch" placeholder="Szukaj po nazwie, składniku lub kategorii…" value="${escapeHtml(state.query||'')}"><button id="k32-clear-search" aria-label="Wyczyść" ${q?'':'hidden'}>×</button></div>${isFav?`<div class="k33-fav-banner"><span>♥</span><div><b>Twoje ulubione przepisy</b><small>Ta lista pokazuje wyłącznie receptury, które oznaczyłeś jako ulubione.</small></div></div>`:`<div class="chips k32-chips">${cats.map(c=>`<button class="chip ${state.selectedCat===c?'active':''}" data-k33-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div>`}<div class="k32-toolbar"><select id="sort"><option value="recent" ${state.sort==='recent'?'selected':''}>Ostatnio używane</option><option value="name" ${state.sort==='name'?'selected':''}>Nazwa A–Z</option><option value="fav" ${state.sort==='fav'?'selected':''}>Ulubione</option></select><button class="btn" data-google="1">Google</button><button class="btn" data-action="import">Importuj</button></div>${rs.length?`<div class="k32-recipe-grid">${rs.map(k32RecipeCard).join('')}</div>`:`<div class="k33-empty"><div>${isFav?'♡':'🍽️'}</div><h3>${isFav?'Nie masz jeszcze ulubionych':'Nie znaleziono receptur'}</h3><p>${isFav?'Otwórz recepturę i dotknij serca, żeby dodać ją do tego menu.':'Zmień wyszukiwanie lub dodaj nową recepturę.'}</p>${isFav?`<button class="btn primary" data-sort-all>Przeglądaj wszystkie</button>`:`<button class="btn primary" data-action="new">＋ Nowa receptura</button>`}</div>`}</div>`;
}
viewRecipes=k33RecipesView;

function k33ShoppingGroups(){
  const groups=new Map();
  for(const x of state.shopping||[]){
    const k=shopKey(x.name,x.unit);
    if(!groups.has(k))groups.set(k,{...x,qty:0,ids:[],done:true});
    const g=groups.get(k); g.qty+=(+x.qty||0); g.ids.push(x.id); g.done=g.done&&!!x.done;
  }
  return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pl'));
}
function k33ShoppingView(){
  const list=k33ShoppingGroups(), done=list.filter(x=>x.done).length;
  const filter=state.shoppingFilter||'all';
  const visible=list.filter(x=>filter==='all'||(filter==='todo'&&!x.done)||(filter==='done'&&x.done));
  return `<div class="k33-shopping">
    <section class="k33-shopping-hero photo-ambient"><img class="photo-ambient-blur" src="./photo-spaghetti-alla-carbonara.webp" aria-hidden="true" loading="eager" decoding="async"><img class="photo-ambient-main" src="./photo-spaghetti-alla-carbonara.webp" alt="Zakupy" loading="eager" decoding="async" fetchpriority="high"><div class="k33-shopping-hero-overlay"></div><div class="k33-shopping-hero-copy"><span class="kicker">PLANOWANIE KUCHNI</span><h1>Zakupy</h1><p>${list.length?`${list.length} pozycji · ${list.length-done} do kupienia`:'Lista jest pusta'}</p></div></section>
    <section class="k33-shopping-add"><div><b>Dodaj produkt</b><span>Wpisz rzecz, ilość i jednostkę. Zapisz bez wyskakującego okna.</span></div><button id="k33-toggle-shop-form" class="btn primary">＋ Dodaj</button></section>
    <form id="k33-shop-form" class="k33-shop-form" hidden><label>Nazwa produktu<input id="k33-shop-name" autocomplete="off" placeholder="np. Mozzarella"></label><div class="k33-shop-form-grid"><label>Ilość<input id="k33-shop-qty" type="number" inputmode="decimal" step="any" value="1"></label><label>Jednostka<select id="k33-shop-unit"><option>szt.</option><option>g</option><option>kg</option><option>ml</option><option>l</option><option>opak.</option><option>but.</option></select></label></div><div class="k33-shop-form-actions"><button type="button" class="btn" id="k33-cancel-shop">Anuluj</button><button type="submit" class="btn primary">Zapisz produkt</button></div></form>
    <div class="k33-shopping-tabs" role="tablist"><button class="${filter==='all'?'active':''}" data-shop-filter="all">Wszystkie <b>${list.length}</b></button><button class="${filter==='todo'?'active':''}" data-shop-filter="todo">Do kupienia <b>${list.length-done}</b></button><button class="${filter==='done'?'active':''}" data-shop-filter="done">Kupione <b>${done}</b></button></div>
    <section class="k33-shopping-list">${visible.length?visible.map(x=>`<div class="k33-shopping-row ${x.done?'done':''}"><button class="k33-check" data-shop-check-v33="${escapeHtml(x.ids[0])}" aria-label="${x.done?'Oznacz jako do kupienia':'Oznacz jako kupione'}">${x.done?'✓':''}</button><div class="k33-shopping-main"><b>${escapeHtml(x.name)}</b><span>${fmt(x.qty)} ${escapeHtml(x.unit||'')}</span></div><div class="k33-shopping-stepper"><button data-shop-adjust-v33="${escapeHtml(x.ids[0])}" data-delta="-1">−</button><button data-shop-adjust-v33="${escapeHtml(x.ids[0])}" data-delta="1">＋</button></div></div>`).join(''):`<div class="k33-empty"><div>${filter==='done'?'✓':'🛒'}</div><h3>${filter==='done'?'Brak kupionych produktów':'Nic tutaj nie ma'}</h3><p>${filter==='todo'?'Wszystko z listy jest już kupione.':'Dodaj produkt albo składniki z receptury.'}</p></div>`}</section>
    <div class="k33-shopping-footer"><button id="clear-done">Usuń kupione</button><button id="clear-all-shop">Wyczyść listę</button></div>
  </div>`;
}
viewShoppingV20=k33ShoppingView;

function k33DiagnosticStatus(label,ok,detail){return `<div class="k33-diag-row"><span class="k33-diag-dot ${ok?'ok':'bad'}">${ok?'✓':'!'}</span><div><b>${escapeHtml(label)}</b><small>${escapeHtml(detail)}</small></div></div>`}
async function k33RunDiagnostics(){
  const out=$('#k33-diagnostics-results'); if(!out)return;
  out.innerHTML='<div class="k33-diag-loading">Sprawdzam…</div>';
  const results=[];
  try{await getAll('recipes');results.push(k33DiagnosticStatus('IndexedDB',true,'Baza danych odpowiada poprawnie.'))}catch(e){results.push(k33DiagnosticStatus('IndexedDB',false,'Błąd dostępu do bazy danych.'))}
  try{const reg=await navigator.serviceWorker?.getRegistration();results.push(k33DiagnosticStatus('Service Worker',!!reg,reg?'Zarejestrowany.':'Brak aktywnej rejestracji.'))}catch(e){results.push(k33DiagnosticStatus('Service Worker',false,'Nie udało się sprawdzić rejestracji.'))}
  try{const cacheNames=await caches.keys();results.push(k33DiagnosticStatus('Cache offline',cacheNames.length>0,cacheNames.length?`${cacheNames.length} pamięci cache.`:'Brak cache.'))}catch(e){results.push(k33DiagnosticStatus('Cache offline',false,'Cache API niedostępne.'))}
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  results.push(k33DiagnosticStatus('Tryb PWA',standalone,'Safari / ekran początkowy: '+(standalone?'uruchomiono jako PWA':'uruchomiono w przeglądarce')));
  results.push(k33DiagnosticStatus('Połączenie',navigator.onLine,'Aktualnie '+(navigator.onLine?'online':'offline')+'.'));
  results.push(k33DiagnosticStatus('Wake Lock',('wakeLock' in navigator),'Safari/WebKit '+(('wakeLock' in navigator)?'udostępnia API':'nie udostępnia API w tej sesji')+'.'));
  const imageCount=Object.keys(K32_PHOTO_MAP||{}).length;
  results.push(k33DiagnosticStatus('Biblioteka zdjęć',imageCount>=state.recipes.length,`${imageCount} przypisanych zdjęć · ${state.recipes.length} receptur.`));
  results.push(k33DiagnosticStatus('Safe Area',CSS.supports?.('padding-bottom','env(safe-area-inset-bottom)')!==false,'CSS obsługuje zmienne Safe Area.'));
  out.innerHTML=results.join('');
}
function k33SettingsView(){
  return `<div class="v3-settings k33-settings"><div class="v3-page-head"><div><span class="v3-kicker">PERSONALIZACJA</span><h1>Ustawienia</h1><p>Dopasuj Kucharzynę do swojej kuchni i sprawdź stan aplikacji.</p></div></div>
  <section class="v3-settings-card v3-settings-profile"><div class="v3-profile-avatar">👨‍🍳</div><div><b>Kucharzyna</b><p>Twoja kuchnia. Twoje receptury.</p></div></section>
  <section class="v3-settings-card"><div class="v3-setting-head"><span>◐</span><div><b>Wygląd</b><small>Motyw aplikacji</small></div></div><select id="theme"><option value="system">Automatyczny</option><option value="light">Jasny</option><option value="dark">Ciemny</option></select></section>
  <section class="v3-settings-card"><div class="v3-setting-head"><span>♟</span><div><b>Tryb aplikacji</b><small>Interfejs profesjonalny lub uproszczony</small></div></div><select id="profile"><option value="pro">Profesjonalny</option><option value="amateur">Amator</option></select></section>
  <section class="v3-settings-card"><div class="v3-setting-head"><span>▣</span><div><b>Dane i backup</b><small>Wszystko zostaje na tym urządzeniu.</small></div></div><div class="v3-setting-buttons"><button id="export">Eksportuj backup</button><button id="importBackup">Importuj backup</button><button id="openImporter">Importuj recepturę</button><button id="addCategory">＋ Dodaj kategorię</button></div></section>
  <section class="k33-diagnostics"><div class="k33-diag-head"><div><span class="kicker">SERWIS</span><h2>Diagnostyka Kucharzyny</h2><p>Sprawdź lokalną bazę, offline, PWA, zdjęcia i funkcje iOS.</p></div><button class="btn primary" id="k33-run-diagnostics">Uruchom test</button></div><div id="k33-diagnostics-results"><div class="k33-diag-placeholder">Kliknij „Uruchom test”, aby sprawdzić aplikację na tym urządzeniu.</div></div></section>
  <section class="v3-settings-note"><b>🔒 Prywatność</b><p>Kucharzyna nie potrzebuje konta, reklam ani trackera. Receptury, notatki, zakupy i lokalne zdjęcia są przechowywane na Twoim urządzeniu.</p></section></div>`;
}
viewSettings=k33SettingsView;

const _k33Topbar=k3TopbarTitle;
k3TopbarTitle=function(){
  const el=$('#topbarTitle'); if(!el)return;
  let title='Start';
  const map={start:'Start',recipes:'Przepisy',traditional:'Kuchnie świata',calculators:'Kalkulatory',shopping:'Zakupy',settings:'Ustawienia',edit:'Edytuj recepturę',cook:'Gotuję',google:'Szukaj w Google'};
  title=map[state.route]||map.start;
  if(state.route==='traditional'&&state.tradCatV14)title=state.tradCatV14;
  if(state.route==='recipe'){const r=state.recipes.find(x=>x.id===state.selectedId);title=r?.name||'Receptura'}
  el.textContent=title;
  const back=$('#globalBack');if(back)back.style.visibility=state.route==='start'?'hidden':'visible';
};

const _k33Bind=bindV20;
bindV20=function(){
  _k33Bind();
  if(state.route==='traditional'){
    $('#k33-world-search')?.addEventListener('input',e=>{state.worldCuisineQuery=e.target.value;clearTimeout(window.__k33WorldTimer);window.__k33WorldTimer=setTimeout(()=>renderV20(),120)});
    $('#k33-world-dish-search')?.addEventListener('input',e=>{state.worldDishQuery=e.target.value;clearTimeout(window.__k33DishTimer);window.__k33DishTimer=setTimeout(()=>renderV20(),120)});
    $$('#main [data-k33-world-cuisine]').forEach(b=>b.addEventListener('click',()=>{state.tradCatV14=b.dataset.k33WorldCuisine;state.worldDishQuery='';renderV20()}));
    $$('#main [data-world-menu]').forEach(b=>b.addEventListener('click',()=>{state.tradCatV14='';state.worldDishQuery='';renderV20()}));
  }
  if(state.route==='shopping'){
    $$('#main [data-shop-filter]').forEach(b=>b.addEventListener('click',()=>{state.shoppingFilter=b.dataset.shopFilter;renderV20()}));
    $$('#main [data-shop-check-v33]').forEach(b=>b.addEventListener('click',async()=>{
      const ids=state.shopping.filter(x=>x.id===b.dataset.shopCheckV33); const x=ids[0]; if(!x)return; x.done=!x.done; await put('shoppingItems',x); state.shopping=await getAll('shoppingItems'); renderV20();
    }));
    $$('#main [data-shop-adjust-v33]').forEach(b=>b.addEventListener('click',async()=>{
      const x=state.shopping.find(i=>i.id===b.dataset.shopAdjustV33);if(!x)return;x.qty=Math.max(0,(+x.qty||0)+(+b.dataset.delta||0));await put('shoppingItems',x);state.shopping=await getAll('shoppingItems');renderV20();
    }));
    $('#k33-toggle-shop-form')?.addEventListener('click',()=>{const f=$('#k33-shop-form');if(f){f.hidden=!f.hidden;if(!f.hidden)setTimeout(()=>$('#k33-shop-name')?.focus(),50)}});
    $('#k33-cancel-shop')?.addEventListener('click',()=>{const f=$('#k33-shop-form');if(f)f.hidden=true});
    $('#k33-shop-form')?.addEventListener('submit',async e=>{e.preventDefault();try{const name=$('#k33-shop-name')?.value.trim();if(!name){toast('Wpisz nazwę produktu');return}const qty=Math.max(0,+($('#k33-shop-qty')?.value||1));const unit=$('#k33-shop-unit')?.value||'szt.';const existing=state.shopping.find(x=>shopKey(x.name,x.unit)===shopKey(name,unit)&&!x.done);if(existing){existing.qty=(+existing.qty||0)+(qty||1);await put('shoppingItems',existing)}else await put('shoppingItems',{id:uid(),name,qty:qty||1,unit,done:false});state.shopping=await getAll('shoppingItems');state.shoppingFilter='all';renderV20();toast('Produkt dodany do zakupów')}catch(err){toast('Nie udało się zapisać produktu')}});
  }
  $('#main [data-sort-all]')?.addEventListener('click',()=>{state.sort='recent';state.query='';state.selectedCat='Wszystkie';renderV20()});
  if(state.route==='settings'){
    $('#k33-run-diagnostics')?.addEventListener('click',k33RunDiagnostics);
  }
};

/* Global back button follows the world-cuisine drill-down. */
const _k33BackRoute=backRoute;
backRoute=function(){
  if(state.route==='traditional'&&state.tradCatV14){state.tradCatV14='';state.worldDishQuery='';renderV20();requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}));return}
  _k33BackRoute();
};

/* K34 CATEGORY DRILL-DOWN: each recipe category opens its own menu. */
function k34CategoryRecipes(category){
  const c=String(category||'').trim();
  return state.recipes.filter(r=>String(r.category||'').trim()===c);
}
function k34CategoryImage(category){
  const r=k34CategoryRecipes(category)[0];
  return r?recipeImage(r):'./photo-generic.webp';
}
function k34RecipeCategoryView(){
  const category=String(state.recipeCategoryView||'').trim();
  if(!category || category==='Wszystkie') return k33RecipesView();
  let rs=k34CategoryRecipes(category);
  const q=String(state.categoryQuery||'').trim().toLowerCase();
  if(q) rs=rs.filter(r=>(`${r.name||''} ${r.description||''} ${(r.tags||[]).join(' ')}`).toLowerCase().includes(q));
  if(state.sort==='name') rs.sort((a,b)=>a.name.localeCompare(b.name,'pl'));
  else if(state.sort==='fav') rs=rs.filter(r=>r.favorite).sort((a,b)=>a.name.localeCompare(b.name,'pl'));
  else rs.sort((a,b)=>(b.lastUsedAt||b.updatedAt||'').localeCompare(a.lastUsedAt||a.updatedAt||''));
  const total=k34CategoryRecipes(category).length;
  const img=k34CategoryImage(category);
  return `<div class="k34-category-page">
    <button class="k33-back-button" data-k34-category-back>‹ Wszystkie kategorie</button>
    <section class="k34-category-hero photo-ambient"><img class="photo-ambient-blur" src="${escapeHtml(img)}" aria-hidden="true" loading="eager" decoding="async" decoding="async" onerror="this.onerror=null;this.src='./photo-generic.webp'"><img class="photo-ambient-main" src="${escapeHtml(img)}" alt="${escapeHtml(category)}" loading="eager" decoding="async" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.src='./photo-generic.webp'"><div class="k34-category-overlay"></div><div class="k34-category-copy"><span class="kicker">KATEGORIA PRZEPISÓW</span><h1>${escapeHtml(category)}</h1><p>${total} ${total===1?'receptura':'receptur'} w tej kategorii</p></div></section>
    <div class="k34-category-head"><div><span class="kicker">MENU</span><h2>Dania: ${escapeHtml(category)}</h2></div><button class="btn" data-k34-category-back>‹ Kategorie</button></div>
    <div class="k32-search"><span>⌕</span><input id="k34-category-search" placeholder="Szukaj w tej kategorii…" value="${escapeHtml(state.categoryQuery||'')}"><button id="k34-category-clear" aria-label="Wyczyść" ${q?'':'hidden'}>×</button></div>
    <div class="k34-category-tools"><button class="chip ${state.sort==='recent'?'active':''}" data-k34-sort="recent">Ostatnio używane</button><button class="chip ${state.sort==='name'?'active':''}" data-k34-sort="name">Nazwa A–Z</button><button class="chip ${state.sort==='fav'?'active':''}" data-k34-sort="fav">Ulubione</button></div>
    ${rs.length?`<div class="k32-recipe-grid">${rs.map(k32RecipeCard).join('')}</div>`:`<div class="k33-empty"><div>🍽️</div><h3>Brak dań</h3><p>${state.sort==='fav'?'W tej kategorii nie masz jeszcze ulubionych przepisów.':'Nie znaleziono przepisu pasującego do wyszukiwania.'}</p></div>`}
  </div>`;
}
const _k34RecipesView=k33RecipesView;
k33RecipesView=function(){
  return state.recipeCategoryView ? k34RecipeCategoryView() : _k34RecipesView();
};
viewRecipes=k33RecipesView;

const _k34Topbar=k3TopbarTitle;
k3TopbarTitle=function(){
  _k34Topbar();
  const el=$('#topbarTitle');
  if(el && state.route==='recipes' && state.recipeCategoryView) el.textContent=state.recipeCategoryView;
};

const _k34Bind=bindV20;
bindV20=function(){
  _k34Bind();
  if(state.route==='recipes'){
    $$('#main [data-k33-category]').forEach(b=>b.addEventListener('click',()=>{
      const c=b.dataset.k33Category||'';
      if(!c||c==='Wszystkie'){state.recipeCategoryView='';state.selectedCat='Wszystkie';}
      else {state.recipeCategoryView=c;state.selectedCat=c;state.categoryQuery='';}
      state.sort='recent';renderV20();requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}));
    }));
    $$('#main [data-k34-category-back]').forEach(b=>b.addEventListener('click',()=>{
      state.recipeCategoryView='';state.categoryQuery='';state.selectedCat='Wszystkie';state.sort='recent';renderV20();
    }));
    const cs=$('#k34-category-search');
    if(cs) cs.addEventListener('input',e=>{state.categoryQuery=e.target.value;clearTimeout(window.__k34CategoryTimer);window.__k34CategoryTimer=setTimeout(()=>renderV20(),90)});
    $('#k34-category-clear')?.addEventListener('click',()=>{state.categoryQuery='';renderV20()});
    $$('#main [data-k34-sort]').forEach(b=>b.addEventListener('click',()=>{state.sort=b.dataset.k34Sort||'recent';renderV20()}));
  }
};

const _k34Back=backRoute;
backRoute=function(){
  if(state.route==='recipes' && state.recipeCategoryView){state.recipeCategoryView='';state.categoryQuery='';state.selectedCat='Wszystkie';state.sort='recent';renderV20();requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}));return;}
  _k34Back();
};

/* K34 consistency: Amateur category tiles use the same category drill-down. */
const _k34BindV14=bindV14;
bindV14=function(){
  _k34BindV14();
  $$('#main [data-cat-am]').forEach(b=>b.onclick=()=>{
    const c=b.dataset.catAm||'';
    state.route='recipes';
    state.recipeCategoryView=c;
    state.selectedCat=c;
    state.categoryQuery='';
    state.sort='recent';
    renderV20();
    requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}));
  });
};

/* K34 shopping groups: operate on the complete merged product group. */
const _k34ShoppingBind=bindV20;
bindV20=function(){
  _k34ShoppingBind();
  if(state.route==='shopping'){
    $$('#main [data-shop-check-v33]').forEach(b=>b.addEventListener('click',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      try{
        const source=state.shopping.find(i=>i.id===b.dataset.shopCheckV33); if(!source)return;
        const key=shopKey(source.name,source.unit), next=!source.done;
        const members=state.shopping.filter(i=>shopKey(i.name,i.unit)===key);
        for(const item of members){item.done=next;await put('shoppingItems',item)}
        state.shopping=await getAll('shoppingItems');renderV20();
      }catch(err){toast('Nie udało się zmienić statusu produktu')}
    },true));
    $$('#main [data-shop-adjust-v33]').forEach(b=>b.addEventListener('click',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      try{
        const source=state.shopping.find(i=>i.id===b.dataset.shopAdjustV33); if(!source)return;
        const key=shopKey(source.name,source.unit), delta=+b.dataset.delta||0;
        const members=state.shopping.filter(i=>shopKey(i.name,i.unit)===key);
        if(!members.length)return;
        const first=members[0]; first.qty=Math.max(0,(+first.qty||0)+delta); await put('shoppingItems',first);
        state.shopping=await getAll('shoppingItems');renderV20();
      }catch(err){toast('Nie udało się zmienić ilości')}
    },true));
  }
};

/* K34 tab behavior: tapping the Recipes tab always returns to the category root. */
const _k34Nav=nav;
nav=function(route){
  if(route==='recipes'){
    state.recipeCategoryView='';
    state.categoryQuery='';
    state.selectedCat='Wszystkie';
  }
  return _k34Nav(route);
};

/* ============================================================
   Kucharzyna patch: Ingredient Atlas v2 + reliable local search
   ============================================================ */
const K32_ING_ATLAS_V2={
  'mąka':[0,0],'mąka typ 00':[0,0],'mąka pszenna':[0,0],'mąka typ 450/550':[0,0],'mąka razowa':[3,0],
  'woda':[1,0],'sól':[2,0],'cukier':[3,0],'drożdże':[4,0],'skrobia ziemniaczana':[3,0],
  'oliwa':[6,0],'oliwa z oliwek':[6,0],'olej':[6,0],'olej roślinny':[6,0],'olej sezamowy':[6,0],
  'masło':[7,0],'ghee':[7,0],'smalec':[7,0],'mleko':[8,0],'mleko kokosowe':[8,0],
  'jajka':[8,0],'jajko':[8,0],'żółtka':[8,0],'żółtko':[8,0],
  'mozzarella':[0,1],'mozzarella di bufala':[0,1],'burrata':[1,1],'twaróg':[3,1],'ricotta':[3,1],
  'parmesan':[4,1],'parmigiano':[4,1],'pecorino':[5,1],'pecorino romano':[5,1],
  'gorgonzola':[6,1],'ser pleśniowy':[6,1],'ser żółty':[7,1],'ser':[5,1],'feta':[7,1],
  'paneer':[8,1],'mascarpone':[8,1],'jogurt':[9,1],'jogurt grecki':[9,1],'śmietana':[10,1],'śmietanka':[10,1],
  'pomidor':[0,2],'pomidory':[0,2],'pomidory san marzano':[1,2],'pomidory san marzano pelati':[1,2],
  'pomidor pelati':[1,2],'passata':[6,2],'koncentrat pomidorowy':[4,2],'sos pomidorowy':[6,2],
  'suszony pomidor':[5,2],'suszone chili':[5,2],
  'bazylia':[7,2],'oregano':[8,2],'tymianek':[9,2],'rozmaryn':[10,2],'szałwia':[11,2],
  'czosnek':[0,3],'cebula':[3,3],'czerwona cebula':[4,3],'por':[5,3],'seler':[6,3],
  'pietruszka':[8,3],'kolendra':[8,3],'koperek':[9,3],'szczypiorek':[11,3],'dymka':[11,3],
  'imbir':[2,3],'trawa cytrynowa':[6,3],
  'ziemniaki':[0,4],'ziemniak':[0,4],'batat':[1,4],'marchew':[1,4],'marchewka':[1,4],
  'papryka':[2,4],'papryka świeża':[2,4],'papryczka chili':[4,4],'chili':[4,4],'jalapeño':[5,4],
  'cukinia':[6,4],'ogórek':[6,4],'bakłażan':[7,4],'pieczarki':[8,4],'grzyby':[8,4],'borowiki':[9,4],'trufle':[11,4],
  'wołowina':[0,5],'wołowina mielona':[1,5],'wieprzowina':[2,5],'wieprzowina mielona':[2,5],
  'kurczak':[3,5],'pierś z kurczaka':[3,5],'udka z kurczaka':[4,5],'baranina mielona':[6,5],
  'jagnięcina':[4,5],'królik':[5,5],'boczek':[7,5],'pancetta':[7,5],'guanciale':[7,5],
  'szynka':[8,5],'prosciutto':[8,5],'salami':[9,5],'kiełbasa':[11,5],'biała kiełbasa':[11,5],'chorizo':[11,5],
  'krewetki':[0,6],'krewetka':[0,6],'ośmiornica':[3,6],'ośmiornica gotowana':[3,6],'małże':[5,6],'mule':[5,6],
  'ryba':[6,6],'biała ryba':[6,6],'dorsz':[6,6],'łosoś':[7,6],'tuńczyk':[8,6],'anchois':[9,6],'bułka tarta':[10,6],
  'spaghetti':[0,7],'makaron':[2,7],'makaron ryżowy':[2,7],'makaron ramen':[2,7],'tonnarelli':[1,7],
  'ciasto filo':[5,7],'tortille':[1,7],'ryż':[8,7],'ryż arborio':[8,7],'ryż risotto':[8,7],
  'kasza':[7,7],'groszek':[3,7],'fasolka':[2,7],'fasola':[0,7],'czarna fasola':[1,7],
  'ciecierzyca':[11,7],'sucha ciecierzyca':[11,7],'soczewica':[6,7],
  'orzechy':[9,7],'orzeszki':[9,7],'migdały':[10,7],'pistacje':[11,7],
  'miód':[0,7],'musztarda':[1,7],'majonez':[2,7],'ketchup':[3,7],'sos sojowy':[4,7],
  'sos rybny':[4,7],'ocet':[5,7],'ocet ryżowy':[5,7],'ocet winny':[5,7],
  'espresso':[4,7],'kakao':[3,7],'cytryna':[7,7],'sok z cytryny':[7,7],'limonka':[8,7],
  'sok z limonki':[8,7],'pomarańcza':[9,7],'szafran':[10,7],'pieprz':[7,7],
  'pieprz czarny':[7,7],'pieprz syczuański':[7,7],'kumin':[10,7],'kminek':[10,7],
  'cynamon':[10,7],'wanilia':[11,7],'awokado':[6,4],'ananas':[9,7],'gruszka':[9,7],
  'tofu':[1,1],'tahini':[2,7],'miso':[4,7],'dashi':[1,0],'mirin':[5,7],'hoisin':[4,7],
  'gochujang':[6,2],'kapary':[5,7],'oliwki':[5,7],'frytki':[0,4],'biszkopty':[5,7],'piwo':[1,0],
  'bulion':[1,0],'nori':[11,3],'wakame':[11,3],'kapusta kiszona':[4,3],'kapusta biała':[4,3]
};
const K32_ING_FALLBACK_EMOJI=[
  [/mąk|flour|kasz/,'🌾'],[/wod|bulion/,'💧'],[/sól|salt/,'🧂'],[/cuk/,'🍚'],[/droż/,'🧈'],
  [/pomidor|passata|pelati/,'🍅'],[/czosnek/,'🧄'],[/cebul|por|dymka/,'🧅'],[/marchew/,'🥕'],[/ziemniak/,'🥔'],
  [/papryk|chili|jalape/,'🌶️'],[/cukinia|ogórek/,'🥒'],[/bakłaż/,'🍆'],[/grzyb/,'🍄'],[/sałat|rukol/,'🥬'],
  [/bazyl|oregano|tymian|rozmaryn|koperek|pietrusz|kolendr/,'🌿'],[/ser|twaróg|ricotta|mozz/,'🧀'],[/mleko|śmiet|jogurt/,'🥛'],
  [/jaj/,'🥚'],[/oliw|olej/,'🫒'],[/masł|ghee/,'🧈'],[/woł|wieprz|baran|jagnię|królik|mięso/,'🥩'],
  [/kurczak|drób/,'🍗'],[/boczek|pancetta|guanciale|szynka|salami|kiełbasa|chorizo/,'🥓'],
  [/krewet|małż|mule|ośmior|ryb|łosoś|tuńczyk|anchois/,'🐟'],[/makaron|spaghetti|ramen|pasta/,'🍝'],
  [/ryż|risotto/,'🍚'],[/fasol|ciecierzy|soczew/,'🫘'],[/orzech|migdał|pistac/,'🥜'],
  [/cytr|limon/,'🍋'],[/miód/,'🍯'],[/pieprz|kumin|cynam|szafran|kminek/,'🫚'],[/kakao/,'🍫']
];
function k32IngredientIconV2(name=''){
  const raw=String(name).trim().toLowerCase();
  if(K32_ING_ATLAS_V2[raw])return {p:K32_ING_ATLAS_V2[raw],emoji:''};
  const key=Object.keys(K32_ING_ATLAS_V2).find(k=>raw.includes(k)||k.includes(raw));
  if(key)return {p:K32_ING_ATLAS_V2[key],emoji:''};
  const rule=K32_ING_FALLBACK_EMOJI.find(([re])=>re.test(raw));
  return {p:null,emoji:rule?rule[1]:'🍽️'};
}
k32IngredientIcon=k32IngredientIconV2;
function k32IngredientIconMarkupV2(name){
  const o=k32IngredientIconV2(name);
  if(!o.p)return `<span class="k32-ing-thumb k32-ing-emoji" aria-hidden="true">${o.emoji}</span>`;
  return `<span class="k32-ing-thumb" style="--ix:${o.p[0]};--iy:${o.p[1]}" aria-hidden="true"></span>`;
}
k32IngredientIconMarkup=k32IngredientIconMarkupV2;

/* Local search: never rerender the input while the user is typing. */
function k32ApplyRecipeSearchLive(input){
  try{
    const q=String(input?.value||'').trim().toLowerCase(); state.query=input?.value||'';
    const cards=$$('#main .k32-recipe-card'); let shown=0;
    for(const card of cards){
      const id=card.dataset.open; const r=state.recipes.find(x=>x.id===id); if(!r){card.hidden=true;continue;}
      const hay=[r.name,r.description,r.category,r.cuisine,r.notes,(r.tags||[]).join(' '),ingredientGroupsSafe(r).map(i=>i.name||'').join(' ')].join(' ').toLowerCase();
      const ok=!q||hay.includes(q); card.hidden=!ok; if(ok)shown++;
    }
    const clear=$('#k32-clear-search'); if(clear)clear.hidden=!q;
    const count=$('.k33-recipe-library .k32-page-head p, .k32-library .k32-page-head p');
    if(count)count.textContent=`${shown} ${shown===1?'receptura':'receptur'} · ${state.sort==='fav'?'tylko ulubione.':'wszystko zapisane lokalnie.'}`;
    let empty=$('#k32-live-search-empty');
    const grid=$('#main .k32-recipe-grid');
    if(q&&shown===0){if(!empty&&grid){empty=document.createElement('div');empty.id='k32-live-search-empty';empty.className='k33-empty';empty.innerHTML='<div>⌕</div><h3>Brak wyników</h3><p>Spróbuj innej nazwy, składnika albo kategorii.</p>';grid.parentElement.appendChild(empty)}if(grid)grid.hidden=true}
    else{if(grid)grid.hidden=false;if(empty)empty.remove()}
  }catch(e){console.error('Live recipe search error',e)}
}
const _kSearchBind=bindV20;
bindV20=function(){
  _kSearchBind();
  const input=$('#recipeSearch');
  if(input){
    input.oninput=null;
    input.addEventListener('input',e=>k32ApplyRecipeSearchLive(e.currentTarget));
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){state.query=e.currentTarget.value;renderV20();requestAnimationFrame(()=>{const el=$('#recipeSearch');el?.focus({preventScroll:true});if(el)try{el.setSelectionRange(el.value.length,el.value.length)}catch(_){}})}});
  }
};

/* Hard-stop legacy search handlers: typing must never trigger a full rerender. */
if(!window.__k32SearchCaptureBound){
  window.__k32SearchCaptureBound=true;
  document.addEventListener('input',e=>{
    try{
      const t=e.target;
      if(t && t.id==='recipeSearch'){
        e.stopImmediatePropagation();
        k32ApplyRecipeSearchLive(t);
      }
    }catch(err){console.error('Search capture failed',err)}
  },true);
}

/* Ensure the Polish classic recipe exists, even on an older installed database. */
async function k32EnsurePierogiRuskie(){
  try{
    let r=state.recipes.find(x=>String(x.name||'').toLowerCase()==='pierogi ruskie');
    const ingredients=[['Mąka pszenna typ 450/550',500,'g'],['Woda ciepła',200,'ml'],['Sól',5,'g'],['Ziemniaki',800,'g'],['Twaróg półtłusty',500,'g'],['Cebula',300,'g'],['Masło',50,'g'],['Pieprz czarny',2,'g']];
    const steps=['Wymieszaj mąkę, sól i ciepłą wodę. Zagnieć gładkie, elastyczne ciasto. Przykryj i odstaw na 30 minut.','Ugotuj ziemniaki, odparuj je i przeciśnij. Dodaj twaróg oraz podsmażoną na maśle cebulę. Dopraw solą i pieprzem.','Rozwałkuj ciasto cienko i wytnij krążki. Na każdy nałóż porcję farszu i dokładnie zlep brzegi.','Gotuj pierogi partiami w osolonej wodzie. Gdy wypłyną, gotuj jeszcze około 2 minuty.','Podawaj z podsmażoną cebulką, masłem lub śmietaną według własnego stylu.'];
    if(!r){
      r=makeRecipe({name:'Pierogi ruskie',category:'Mączne',cuisine:'Polska',description:'Klasyczne polskie pierogi z farszem z ziemniaków, twarogu i cebuli. Delikatne ciasto i kremowe nadzienie tworzą bazę do domowego lub profesjonalnego serwisu.',yield:40,yieldUnit:'szt.',servings:4,prep:60,cook:10,ferment:0,temp:0,tags:['polskie','pierogi','mączne','klasyczne'],traditional:true,flag:'🇵🇱',servingType:'Na ciepło',ingredients:ingredients,steps,notes:'Najlepszy farsz jest dobrze odparowany i całkowicie wystudzony przed lepieniem.',source:'Opracowanie Kucharzyny',sourceUrl:'',license:'',taste:{sweet:1,sour:1,salty:4,umami:4,bitter:0,spicy:1}});
    } else {
      r.cuisine='Polska'; r.category='Mączne'; r.description='Klasyczne polskie pierogi z farszem z ziemniaków, twarogu i cebuli. Delikatne ciasto i kremowe nadzienie tworzą bazę do domowego lub profesjonalnego serwisu.';r.yield=40;r.yieldUnit='szt.';r.servings=4;r.prep=60;r.cook=10;r.servingType='Na ciepło';r.tags=['polskie','pierogi','mączne','klasyczne'];
      r.sections=[{id:uid(),name:'Ciasto',ingredients:ingredients.slice(0,3).map(a=>({id:uid(),name:a[0],qty:a[1],unit:a[2],percent:''}))},{id:uid(),name:'Farsz',ingredients:ingredients.slice(3).map(a=>({id:uid(),name:a[0],qty:a[1],unit:a[2],percent:''}))}];r.steps=steps.map(text=>({id:uid(),text}));r.image='./photo-pierogi-ruskie.webp';r.imageSource='bundled';r.imageCredit='Zdjęcie Kucharzyny';r.updatedAt=now();
    }
    r.image='./photo-pierogi-ruskie.webp';r.imageSource='bundled';r.imageCredit='Zdjęcie Kucharzyny';
    if(!r.sections||!r.sections.length)r.sections=[{id:uid(),name:'Główna',ingredients:ingredients.map(a=>({id:uid(),name:a[0],qty:a[1],unit:a[2],percent:''}))}];
    await put('recipes',r);state.recipes=await getAll('recipes');
  }catch(e){console.error('Pierogi migration failed',e)}
}


/* Polish recipe expansion: adds missing classics to existing installs without duplicating them. */
async function k33EnsurePolishRecipes(){
  try{
    const recipes=[
      {name:'Pierogi z mięsem',category:'Mączne',cuisine:'Polska',description:'Polskie pierogi z soczystym farszem z gotowanego mięsa, cebuli i pieprzu.',yield:40,yieldUnit:'szt.',servings:4,prep:70,cook:10,tags:['polskie','pierogi','mączne','mięsne'],image:'./photo-pierogi-ruskie.webp',servingType:'Na ciepło',ingredients:[['Mąka pszenna typ 450/550',500,'g'],['Woda ciepła',220,'ml'],['Sól',5,'g'],['Gotowana łopatka wieprzowa',450,'g'],['Cebula',180,'g'],['Masło',40,'g'],['Pieprz czarny',3,'g'],['Bulion',80,'ml']],steps:['Zagnieć mąkę, wodę i sól na elastyczne ciasto. Odstaw pod przykryciem na 30 minut.','Ugotowane mięso zmiel. Cebulę zeszklij na maśle i połącz z mięsem. Dopraw solą i pieprzem, podlej odrobiną bulionu.','Rozwałkuj ciasto, wytnij krążki i nałóż farsz. Zlep dokładnie brzegi.','Gotuj partiami w osolonej wodzie. Po wypłynięciu gotuj jeszcze około 2 minuty.','Podawaj z cebulką podsmażoną na maśle lub ze skwarkami.'],source:'Opracowanie Kucharzyny'},
      {name:'Kotlet schabowy',category:'Mięso',cuisine:'Polska',description:'Klasyczny panierowany kotlet ze schabu, chrupiący z zewnątrz i soczysty w środku.',yield:4,yieldUnit:'porcja',servings:4,prep:20,cook:15,tags:['polskie','mięso','schabowy','klasyczne'],image:'https://upload.wikimedia.org/wikipedia/commons/4/40/Kotlet_Schabowy.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — Dmitry Dzema',sourceUrl:'https://commons.wikimedia.org/wiki/File:Kotlet_Schabowy.jpg',license:'CC BY-SA 4.0',imageSource:'external',imageCredit:'Dmitry Dzema / Wikimedia Commons (CC BY-SA 4.0)',ingredients:[['Schab bez kości',600,'g'],['Mąka pszenna',60,'g'],['Jajka',2,'szt.'],['Bułka tarta',120,'g'],['Sól',8,'g'],['Pieprz czarny',2,'g'],['Smalec lub olej',60,'g']],steps:['Schab pokrój na cztery plastry i delikatnie rozbij. Dopraw solą i pieprzem.','Panieruj kolejno w mące, roztrzepanym jajku i bułce tartej.','Smaż na dobrze rozgrzanym tłuszczu z obu stron do złotego koloru.','Odsącz i podawaj od razu z ziemniakami oraz surówką.']},
      {name:'Placki ziemniaczane',category:'Mączne',cuisine:'Polska',description:'Chrupiące placki z tartych ziemniaków z cebulą, smażone na złoty kolor.',yield:12,yieldUnit:'szt.',servings:4,prep:20,cook:20,tags:['polskie','ziemniaki','mączne','smażone'],image:'https://upload.wikimedia.org/wikipedia/commons/8/86/Polish_potato_pancakes.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — Kavyass',sourceUrl:'https://commons.wikimedia.org/wiki/File:Polish_potato_pancakes.jpg',license:'CC BY-SA 4.0',imageSource:'external',imageCredit:'Kavyass / Wikimedia Commons (CC BY-SA 4.0)',ingredients:[['Ziemniaki',1000,'g'],['Cebula',120,'g'],['Jajko',1,'szt.'],['Mąka pszenna',40,'g'],['Sól',8,'g'],['Pieprz czarny',2,'g'],['Olej',100,'ml']],steps:['Zetrzyj ziemniaki i cebulę na drobnych oczkach. Odstaw na chwilę i odlej nadmiar płynu.','Dodaj jajko, mąkę, sól i pieprz. Wymieszaj.','Smaż cienkie porcje na dobrze rozgrzanym oleju z obu stron na złoto.','Podawaj od razu ze śmietaną, cukrem lub wytrawnymi dodatkami.']},
      {name:'Gołąbki z mięsem i ryżem',category:'Mięso',cuisine:'Polska',description:'Liście kapusty wypełnione farszem z mięsa i ryżu, duszone w sosie pomidorowym.',yield:12,yieldUnit:'szt.',servings:6,prep:45,cook:90,tags:['polskie','gołąbki','kapusta','mięso'],image:'https://upload.wikimedia.org/wikipedia/commons/7/7a/Golubci8.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — Kagor',sourceUrl:'https://commons.wikimedia.org/wiki/File:Golubci8.jpg',license:'CC BY-SA 3.0',imageSource:'external',imageCredit:'Kagor / Wikimedia Commons (CC BY-SA 3.0)',ingredients:[['Kapusta biała',1,'szt.'],['Mięso mielone wieprzowe',600,'g'],['Ryż',180,'g'],['Cebula',180,'g'],['Passata pomidorowa',700,'ml'],['Bulion',300,'ml'],['Sól',10,'g'],['Pieprz czarny',3,'g'],['Majeranek',4,'g']],steps:['Z kapusty usuń głąb, sparz liście i odłóż do ostygnięcia.','Ryż ugotuj do półmiękkości. Wymieszaj z mięsem, cebulą i przyprawami.','Na każdy liść nałóż farsz i ciasno zwiń.','Ułóż gołąbki w naczyniu, zalej passatą wymieszaną z bulionem.','Duś pod przykryciem około 75–90 minut, aż kapusta i farsz będą miękkie.']},
      {name:'Kopytka',category:'Mączne',cuisine:'Polska',description:'Delikatne kluski ziemniaczane z prostego ciasta z ziemniaków, mąki i jajka.',yield:6,yieldUnit:'porcja',servings:6,prep:35,cook:10,tags:['polskie','kluski','ziemniaki'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kopytka_z_maslem_i_cukrem.jpg',imageSource:'external',imageCredit:'Olivia Fries / Wikimedia Commons (CC BY-SA 4.0)',sourceUrl:'https://commons.wikimedia.org/wiki/File:Kopytka_z_maslem_i_cukrem.jpg',license:'CC BY-SA 4.0',servingType:'Na ciepło',source:'Wikimedia Commons — Olivia Fries',ingredients:[['Ziemniaki',1000,'g'],['Mąka pszenna',250,'g'],['Jajko',1,'szt.'],['Sól',8,'g']],steps:['Ugotuj ziemniaki, dokładnie odparuj i przeciśnij przez praskę.','Dodaj jajko, sól i większość mąki. Szybko zagnieć miękkie ciasto.','Podziel ciasto na wałki i pokrój ukośnie na kopytka.','Gotuj partiami w osolonej wodzie do wypłynięcia.','Podawaj z masłem, sosem lub jako dodatek do mięsa.']},
      {name:'Naleśniki z twarogiem',category:'Mączne',cuisine:'Polska',description:'Cienkie naleśniki z kremowym farszem z twarogu, śmietany i wanilii.',yield:10,yieldUnit:'szt.',servings:4,prep:25,cook:20,tags:['polskie','naleśniki','słodkie'],image:'./photo-tiramisu.webp',servingType:'Na ciepło',source:'Opracowanie Kucharzyny',ingredients:[['Mąka pszenna',250,'g'],['Mleko',500,'ml'],['Jajka',2,'szt.'],['Masło',30,'g'],['Twaróg półtłusty',400,'g'],['Śmietana',80,'g'],['Cukier',50,'g'],['Cukier waniliowy',8,'g']],steps:['Wymieszaj mąkę, mleko i jajka na gładkie ciasto. Dodaj roztopione masło.','Odstaw ciasto na 10 minut.','Smaż cienkie naleśniki na lekko natłuszczonej patelni.','Twaróg wymieszaj ze śmietaną, cukrem i wanilią.','Napełnij naleśniki farszem i złóż.']},
      {name:'Racuchy z jabłkami',category:'Desery',cuisine:'Polska',description:'Puszyste drożdżowe racuchy z kawałkami jabłek, smażone na złoto.',yield:12,yieldUnit:'szt.',servings:4,prep:25,cook:20,ferment:45,tags:['polskie','racuchy','jabłka','słodkie'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Racuchy_z_jab%C5%82kami_-_28.08.2026.jpg',imageSource:'external',imageCredit:'Aw58 / Wikimedia Commons (CC BY 4.0)',sourceUrl:'https://commons.wikimedia.org/wiki/File:Racuchy_z_jab%C5%82kami_-_28.08.2026.jpg',license:'CC BY 4.0',servingType:'Na ciepło',source:'Wikimedia Commons — Aw58',ingredients:[['Mąka pszenna',300,'g'],['Mleko',250,'ml'],['Drożdże świeże',20,'g'],['Jajko',1,'szt.'],['Cukier',40,'g'],['Jabłka',300,'g'],['Sól',2,'g'],['Olej',80,'ml']],steps:['Podgrzej mleko do letniej temperatury i rozprowadź w nim drożdże z cukrem.','Dodaj mąkę, jajko i sól. Wymieszaj i odstaw do wyrośnięcia na około 45 minut.','Dodaj pokrojone jabłka.','Smaż porcje na średnim ogniu z obu stron na złoto.','Podawaj z cukrem pudrem lub cynamonem.']},
      {name:'Barszcz czerwony',category:'Zupy',cuisine:'Polska',description:'Aromatyczny barszcz z pieczonych lub gotowanych buraków, zakwaszany dla wyraźnego smaku.',yield:2500,yieldUnit:'ml',servings:6,prep:20,cook:60,tags:['polskie','zupa','buraki','wigilia'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Barszcz_czerwony_z_uszkami_-_2025.01.21.jpg',imageSource:'external',imageCredit:'Aw58 / Wikimedia Commons (CC BY 4.0)',sourceUrl:'https://commons.wikimedia.org/wiki/File:Barszcz_czerwony_z_uszkami_-_2025.01.21.jpg',license:'CC BY 4.0',servingType:'Na ciepło',source:'Wikimedia Commons — Aw58',ingredients:[['Buraki',1000,'g'],['Woda',1800,'ml'],['Cebula',120,'g'],['Czosnek',15,'g'],['Liść laurowy',2,'szt.'],['Ziele angielskie',4,'szt.'],['Zakwas buraczany',300,'ml'],['Sól',12,'g'],['Pieprz czarny',2,'g'],['Majeranek',3,'g']],steps:['Buraki obierz i pokrój. Zalej wodą, dodaj cebulę, czosnek i przyprawy.','Gotuj bardzo spokojnie, bez mocnego wrzenia, aż buraki oddadzą kolor i smak.','Przecedź wywar i dodaj zakwas buraczany.','Dopraw solą, pieprzem i majerankiem. Nie doprowadzaj do mocnego wrzenia po dodaniu zakwasu.','Podawaj czysty lub z uszkami.']},
      {name:'Sałatka jarzynowa',category:'Sałatki',cuisine:'Polska',description:'Klasyczna polska sałatka z gotowanych warzyw, jajek, ogórków kiszonych i majonezu.',yield:1200,yieldUnit:'g',servings:8,prep:45,cook:25,tags:['polskie','sałatka','święta'],image:'https://upload.wikimedia.org/wikipedia/commons/9/96/2023_Sa%C5%82atka_jarzynowa_%281%29.jpg',imageSource:'external',imageCredit:'Jacek Halicki / Wikimedia Commons (CC BY-SA 4.0)',sourceUrl:'https://commons.wikimedia.org/wiki/File:2023_Sa%C5%82atka_jarzynowa_(1).jpg',license:'CC BY-SA 4.0',servingType:'Na zimno',source:'Wikimedia Commons — Jacek Halicki',ingredients:[['Ziemniaki',300,'g'],['Marchew',200,'g'],['Pietruszka korzeń',120,'g'],['Groszek',150,'g'],['Ogórki kiszone',180,'g'],['Jajka',3,'szt.'],['Jabłko',120,'g'],['Majonez',180,'g'],['Musztarda',20,'g'],['Sól',6,'g'],['Pieprz czarny',2,'g']],steps:['Ugotuj ziemniaki, marchew i pietruszkę. Wystudź.','Pokrój warzywa, ogórki, jabłko i jajka w drobną kostkę.','Dodaj groszek, majonez i musztardę.','Wymieszaj delikatnie i dopraw.','Schłodź minimum godzinę przed podaniem.']}
    ];
    recipes.push(
      {name:'Bigos',category:'Dania główne',cuisine:'Polska',description:'Długo duszona kapusta kiszona i świeża z mięsem, kiełbasą oraz suszonymi śliwkami.',yield:2500,yieldUnit:'g',servings:8,prep:35,cook:150,tags:['polskie','bigos','kapusta','klasyczne'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bigos_-_19.03.2026.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — Aw58',sourceUrl:'https://commons.wikimedia.org/wiki/File:Bigos_-_19.03.2026.jpg',license:'CC BY 4.0',imageSource:'external',imageCredit:'Aw58 / Wikimedia Commons (CC BY 4.0)',ingredients:[['Kapusta kiszona',1200,'g'],['Kapusta biała',600,'g'],['Łopatka wieprzowa',450,'g'],['Kiełbasa',300,'g'],['Cebula',180,'g'],['Suszone śliwki',100,'g'],['Grzyby suszone',30,'g'],['Koncentrat pomidorowy',50,'g'],['Liść laurowy',3,'szt.'],['Ziele angielskie',6,'szt.'],['Pieprz czarny',4,'g'],['Sól',8,'g']],steps:['Namocz grzyby i ugotuj do miękkości. Zachowaj wywar.','Podsmaż mięso, kiełbasę i cebulę.','Dodaj obie kapusty, grzyby, śliwki, koncentrat i przyprawy.','Dolej niewielką ilość wywaru i duś bardzo spokojnie około 2–2,5 godziny.','Wystudź i następnego dnia ponownie podgrzej. Bigos zyskuje na smaku po odpoczynku.']},
      {name:'Żurek',category:'Zupy',cuisine:'Polska',description:'Kwaśna zupa na zakwasie żytnim z białą kiełbasą, majerankiem i jajkiem.',yield:2500,yieldUnit:'ml',servings:6,prep:20,cook:50,tags:['polskie','żurek','zupa','wielkanoc'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Zurek.JPG',servingType:'Na ciepło',source:'Wikimedia Commons — Julienbzh35',sourceUrl:'https://commons.wikimedia.org/wiki/File:Zurek.JPG',license:'CC BY 1.0',imageSource:'external',imageCredit:'Julienbzh35 / Wikimedia Commons (CC BY 1.0)',ingredients:[['Zakwas żytni',500,'ml'],['Bulion',1800,'ml'],['Biała kiełbasa',500,'g'],['Wędzony boczek',120,'g'],['Cebula',120,'g'],['Czosnek',12,'g'],['Majeranek',5,'g'],['Liść laurowy',2,'szt.'],['Ziele angielskie',4,'szt.'],['Śmietana 18%',150,'g'],['Jajka',3,'szt.'],['Sól',8,'g'],['Pieprz czarny',2,'g']],steps:['Ugotuj kiełbasę w bulionie z liściem laurowym i zielem angielskim.','Boczek i cebulę podsmaż, dodaj czosnek.','Dodaj zawartość patelni do bulionu i wlej zakwas.','Gotuj spokojnie, dodaj majeranek i zahartowaną śmietanę.','Podawaj z połówką jajka i kawałkami białej kiełbasy.']},
      {name:'Biały barszcz',category:'Zupy',cuisine:'Polska',description:'Kremowo-kwaśna zupa na białym barszczu, z białą kiełbasą, warzywami i jajkiem.',yield:2500,yieldUnit:'ml',servings:6,prep:20,cook:45,tags:['polskie','biały barszcz','zupa','wielkanoc'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bia%C5%82y_barszcz_-_25.08.2026.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — Aw58',sourceUrl:'https://commons.wikimedia.org/wiki/File:Bia%C5%82y_barszcz_-_25.08.2026.jpg',license:'CC BY 4.0',imageSource:'external',imageCredit:'Aw58 / Wikimedia Commons (CC BY 4.0)',ingredients:[['Bulion',1800,'ml'],['Biały barszcz / zakwas',500,'ml'],['Biała kiełbasa',500,'g'],['Marchew',120,'g'],['Pietruszka korzeń',80,'g'],['Cebula',120,'g'],['Czosnek',12,'g'],['Śmietana 18%',150,'g'],['Majeranek',5,'g'],['Jajka',3,'szt.'],['Sól',8,'g'],['Pieprz czarny',2,'g']],steps:['Ugotuj kiełbasę w bulionie z warzywami i przyprawami.','Wyjmij kiełbasę, pokrój ją na porcje i odłóż.','Dodaj zakwas i zahartowaną śmietanę. Nie gotuj gwałtownie.','Dopraw majerankiem, solą i pieprzem.','Podawaj z kiełbasą i jajkiem.']},
      {name:'Mizeria',category:'Sałatki',cuisine:'Polska',description:'Klasyczna surówka z ogórka, kwaśnej śmietany, koperku i odrobiny kwasowości.',yield:700,yieldUnit:'g',servings:4,prep:15,cook:0,tags:['polskie','mizeria','ogórek','dodatek'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mizeria_-_2024.01.28.jpg',servingType:'Na zimno',source:'Wikimedia Commons — Aw58',sourceUrl:'https://commons.wikimedia.org/wiki/File:Mizeria_-_2024.01.28.jpg',license:'CC BY-SA 4.0',imageSource:'external',imageCredit:'Aw58 / Wikimedia Commons (CC BY-SA 4.0)',ingredients:[['Ogórki gruntowe',600,'g'],['Śmietana 18%',120,'g'],['Koperek',20,'g'],['Sok z cytryny',15,'ml'],['Cukier',5,'g'],['Sól',6,'g'],['Pieprz czarny',1,'g']],steps:['Ogórki pokrój cienko i lekko posól.','Po kilku minutach odlej nadmiar wody.','Dodaj śmietanę, koperek, sok z cytryny i odrobinę cukru.','Dopraw pieprzem i sprawdź równowagę kwasowości.','Schłodź przed podaniem.']},
      {name:'Kotlet mielony',category:'Mięso',cuisine:'Polska',description:'Soczysty kotlet z mięsa mielonego z cebulą i namoczoną bułką, smażony na złoto.',yield:8,yieldUnit:'szt.',servings:4,prep:25,cook:20,tags:['polskie','mięso','kotlet','klasyczne'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kotlety_mielone_-_14.03.2026.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — Aw58',sourceUrl:'https://commons.wikimedia.org/wiki/File:Kotlety_mielone_-_14.03.2026.jpg',license:'CC BY 4.0',imageSource:'external',imageCredit:'Aw58 / Wikimedia Commons (CC BY 4.0)',ingredients:[['Mięso mielone wieprzowe',700,'g'],['Cebula',150,'g'],['Bułka pszenna',80,'g'],['Mleko',120,'ml'],['Jajko',1,'szt.'],['Bułka tarta',80,'g'],['Sól',9,'g'],['Pieprz czarny',3,'g'],['Olej',80,'ml']],steps:['Bułkę namocz w mleku i dokładnie odciśnij.','Cebulę zeszklij lub dodaj surową, zależnie od stylu.','Wymieszaj mięso, bułkę, cebulę, jajko i przyprawy do uzyskania kleistej masy.','Uformuj kotlety i lekko obtocz w bułce tartej.','Smaż na średnim ogniu z obu stron, aż będą dobrze zrumienione i ugotowane w środku.']},
      {name:'Kaczka z jabłkami',category:'Mięso',cuisine:'Polska',description:'Pieczona kaczka z jabłkami, majerankiem i czosnkiem, inspirowana kuchnią wielkopolską.',yield:4,yieldUnit:'porcja',servings:4,prep:30,cook:150,tags:['polskie','kaczka','wielkopolska','pieczone'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Polish_duck_with_apples.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — MOs810',sourceUrl:'https://commons.wikimedia.org/wiki/File:Polish_duck_with_apples.jpg',license:'CC BY-SA 3.0',imageSource:'external',imageCredit:'MOs810 / Wikimedia Commons (CC BY-SA 3.0)',ingredients:[['Kaczka',1,'szt.'],['Jabłka kwaśne',500,'g'],['Czosnek',15,'g'],['Majeranek',6,'g'],['Sól',14,'g'],['Pieprz czarny',3,'g'],['Woda',250,'ml']],steps:['Kaczkę osusz i natrzyj solą, pieprzem, czosnkiem i majerankiem.','Wnętrze wypełnij kawałkami jabłek.','Ułóż kaczkę piersią do góry w brytfannie i podlej wodą.','Piecz do miękkości, podlewając wytopionym tłuszczem. Na końcu zwiększ temperaturę, aby dopiec skórę.','Odstaw mięso przed porcjowaniem.']},
      {name:'Golonka po polsku',category:'Mięso',cuisine:'Polska',description:'Miękka golonka długo gotowana i dopieczona do rumianej, chrupiącej skóry.',yield:2,yieldUnit:'porcja',servings:2,prep:20,cook:180,tags:['polskie','golonka','wieprzowina','piwo'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nowy_Tomysl_golonka.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — MOs810',sourceUrl:'https://commons.wikimedia.org/wiki/File:Nowy_Tomysl_golonka.jpg',license:'CC BY-SA 4.0',imageSource:'external',imageCredit:'MOs810 / Wikimedia Commons (CC BY-SA 4.0)',ingredients:[['Golonka wieprzowa',2,'szt.'],['Marchew',150,'g'],['Pietruszka korzeń',100,'g'],['Cebula',150,'g'],['Liść laurowy',3,'szt.'],['Ziele angielskie',6,'szt.'],['Czosnek',15,'g'],['Sól',18,'g'],['Pieprz czarny',3,'g'],['Piwo jasne',500,'ml']],steps:['Golonki opłucz i gotuj z warzywami oraz przyprawami do miękkości.','Wyjmij, osusz i natrzyj czosnkiem oraz pieprzem.','Ułóż w naczyniu i podlej piwem.','Piecz, aż skóra mocno się zrumieni i stanie się chrupiąca.','Podawaj z musztardą, chrzanem i kapustą.']},
      {name:'Flaki po warszawsku',category:'Zupy',cuisine:'Polska',description:'Gęsta, aromatyczna zupa z oczyszczonych flaków wołowych z majerankiem i przyprawami.',yield:3000,yieldUnit:'ml',servings:8,prep:35,cook:150,tags:['polskie','flaki','zupa','wołowina'],image:'https://upload.wikimedia.org/wikipedia/commons/7/73/Flaki_Poland_3657.JPG',servingType:'Na ciepło',source:'Wikimedia Commons — MOs810',sourceUrl:'https://commons.wikimedia.org/wiki/File:Flaki_Poland_3657.JPG',license:'CC BY-SA 3.0',imageSource:'external',imageCredit:'MOs810 / Wikimedia Commons (CC BY-SA 3.0)',ingredients:[['Flaki wołowe oczyszczone',1200,'g'],['Bulion wołowy',2200,'ml'],['Marchew',200,'g'],['Pietruszka korzeń',120,'g'],['Seler',100,'g'],['Cebula',150,'g'],['Masło',50,'g'],['Mąka pszenna',40,'g'],['Majeranek',8,'g'],['Imbir mielony',2,'g'],['Gałka muszkatołowa',1,'g'],['Pieprz czarny',3,'g'],['Sól',10,'g']],steps:['Flaki dokładnie wypłucz i obgotuj, następnie odcedź.','Gotuj w świeżym bulionie do miękkości.','Warzywa pokrój w cienkie słupki i dodaj do zupy.','Z masła i mąki przygotuj jasną zasmażkę i zahartuj ją bulionem.','Dodaj majeranek, imbir, gałkę i pieprz. Gotuj jeszcze kilka minut.']},
      {name:'Krupnik',category:'Zupy',cuisine:'Polska',description:'Pożywna polska zupa jęczmienna z ziemniakami, warzywami i majerankiem.',yield:3000,yieldUnit:'ml',servings:8,prep:25,cook:70,tags:['polskie','krupnik','zupa','kasza'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Krupnik_soup_Poland.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — MOs810',sourceUrl:'https://commons.wikimedia.org/wiki/File:Krupnik_soup_Poland.jpg',license:'CC BY-SA 4.0',imageSource:'external',imageCredit:'MOs810 / Wikimedia Commons (CC BY-SA 4.0)',ingredients:[['Bulion',2400,'ml'],['Kasza jęczmienna',180,'g'],['Ziemniaki',500,'g'],['Marchew',180,'g'],['Pietruszka korzeń',100,'g'],['Seler',100,'g'],['Cebula',120,'g'],['Masło',40,'g'],['Liść laurowy',2,'szt.'],['Ziele angielskie',5,'szt.'],['Majeranek',5,'g'],['Sól',10,'g'],['Pieprz czarny',2,'g']],steps:['Warzywa pokrój w kostkę i dodaj do bulionu.','Wsyp kaszę i gotuj do jej prawie pełnej miękkości.','Dodaj pokrojone ziemniaki i gotuj do miękkości.','Dopraw majerankiem, solą i pieprzem.','Odstaw na kilka minut przed podaniem.']},
      {name:'Kluski śląskie',category:'Mączne',cuisine:'Polska',description:'Okrągłe kluski ziemniaczane z charakterystycznym wgłębieniem na sos.',yield:6,yieldUnit:'porcja',servings:6,prep:35,cook:10,tags:['polskie','śląskie','kluski','ziemniaki'],image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kluski_slaskie_(Poznan).jpg',servingType:'Na ciepło',source:'Wikimedia Commons — MOs810',sourceUrl:'https://commons.wikimedia.org/wiki/File:Kluski_slaskie_(Poznan).jpg',license:'CC BY-SA 4.0',imageSource:'external',imageCredit:'MOs810 / Wikimedia Commons (CC BY-SA 4.0)',ingredients:[['Ziemniaki ugotowane',1000,'g'],['Skrobia ziemniaczana',250,'g'],['Jajko',1,'szt.'],['Sól',8,'g']],steps:['Ugotowane ziemniaki przeciśnij i dokładnie wystudź.','Wymieszaj z jajkiem, solą i skrobią. Zagnieć krótko.','Uformuj kulki i zrób kciukiem charakterystyczne wgłębienie.','Gotuj partiami w osolonej wodzie do wypłynięcia.','Podawaj z sosem, roladą, modrą kapustą lub skwarkami.']},
      {name:'Pyzy z mięsem',category:'Mączne',cuisine:'Polska',description:'Duże ziemniaczane pyzy z mięsnym nadzieniem, charakterystyczne dla kuchni wielkopolskiej.',yield:12,yieldUnit:'szt.',servings:6,prep:60,cook:20,tags:['polskie','pyzy','wielkopolska','ziemniaki'],image:'https://upload.wikimedia.org/wikipedia/commons/4/49/Pyzy_z_mi%C4%99sem.jpg',servingType:'Na ciepło',source:'Wikimedia Commons — Ewkaa',sourceUrl:'https://commons.wikimedia.org/wiki/File:Pyzy_z_mięsem.jpg',license:'CC BY-SA 4.0',imageSource:'external',imageCredit:'Ewkaa / Wikimedia Commons (CC BY-SA 4.0)',ingredients:[['Ziemniaki ugotowane',700,'g'],['Ziemniaki surowe',700,'g'],['Mąka ziemniaczana',80,'g'],['Mięso wieprzowe gotowane',400,'g'],['Cebula',150,'g'],['Sól',10,'g'],['Pieprz czarny',3,'g'],['Smalec',40,'g']],steps:['Ugotowane ziemniaki przeciśnij. Surowe zetrzyj i bardzo dobrze odciśnij.','Połącz ziemniaki z mąką ziemniaczaną i solą.','Mięso zmiel, połącz z podsmażoną cebulą i pieprzem.','Formuj placuszki z ciasta, nadziewaj mięsem i szczelnie zamykaj.','Gotuj w osolonej wodzie do wypłynięcia i podawaj ze skwarkami lub cebulą.']},
      {name:'Sernik',category:'Desery',cuisine:'Polska',description:'Polski sernik pieczony na bazie twarogu, jajek i cukru, o kremowym środku.',yield:12,yieldUnit:'porcja',servings:12,prep:30,cook:65,tags:['polskie','sernik','deser','święta'],image:'https://upload.wikimedia.org/wikipedia/commons/9/96/Sernik_-_Pastel_de_queso%2C_Gastronom%C3%ADa_polaca%2C_Gniezno%2C_Polonia1.jpg',servingType:'Na zimno',source:'Wikimedia Commons — Diego Delso',sourceUrl:'https://commons.wikimedia.org/wiki/File:Sernik_-_Pastel_de_queso,_Gastronom%C3%ADa_polaca,_Gniezno,_Polonia1.jpg',license:'CC BY-SA 3.0',imageSource:'external',imageCredit:'Diego Delso / Wikimedia Commons (CC BY-SA 3.0)',ingredients:[['Twaróg sernikowy',1000,'g'],['Jajka',6,'szt.'],['Cukier',180,'g'],['Masło',120,'g'],['Śmietana 18%',150,'g'],['Mąka ziemniaczana',30,'g'],['Wanilia',2,'g'],['Rodzynki',120,'g']],steps:['Twaróg utrzyj z miękkim masłem i cukrem.','Dodawaj po jednym jajku, następnie śmietanę, wanilię i skrobię.','Na końcu wmieszaj rodzynki.','Przełóż masę do formy i piecz do ścięcia środka.','Wystudź stopniowo i schłodź przed krojeniem.']},
      {name:'Makowiec',category:'Desery',cuisine:'Polska',description:'Tradycyjne polskie ciasto drożdżowe z masą makową, bakaliami i skórką pomarańczową.',yield:12,yieldUnit:'porcja',servings:12,prep:45,cook:45,ferment:90,tags:['polskie','makowiec','deser','święta'],image:'https://upload.wikimedia.org/wikipedia/commons/8/89/Makowiec_slice.jpg',servingType:'Na zimno',source:'Wikimedia Commons — Husky',sourceUrl:'https://commons.wikimedia.org/wiki/File:Makowiec_slice.jpg',license:'CC BY-SA 3.0',imageSource:'external',imageCredit:'Husky / Wikimedia Commons (CC BY-SA 3.0)',ingredients:[['Mąka pszenna',500,'g'],['Mleko',200,'ml'],['Drożdże świeże',25,'g'],['Cukier',100,'g'],['Masło',100,'g'],['Jajka',2,'szt.'],['Mak mielony',300,'g'],['Miód',80,'g'],['Rodzynki',100,'g'],['Orzechy włoskie',100,'g'],['Skórka pomarańczowa',60,'g']],steps:['Zagnieć ciasto drożdżowe z mąki, mleka, drożdży, cukru, masła i jajek. Odstaw do wyrośnięcia.','Mak sparz i przygotuj z miodem, bakaliami oraz skórką pomarańczową.','Rozwałkuj ciasto, rozsmaruj masę makową i zwiń w roladę.','Zostaw do ponownego wyrośnięcia.','Piecz do złotego koloru i całkowitego dopieczenia.']}
    );
    for(const x of recipes){
      let r=state.recipes.find(y=>String(y.name||'').toLowerCase()===x.name.toLowerCase());
      if(!r){
        r=makeRecipe({...x,traditional:true,flag:'🇵🇱',ferment:x.ferment||0,temp:0,taste:{sweet:1,sour:1,salty:3,umami:3,bitter:0,spicy:0}});
      }else{
        Object.assign(r,{category:x.category,cuisine:'Polska',description:x.description,yield:x.yield,yieldUnit:x.yieldUnit,servings:x.servings,prep:x.prep,cook:x.cook,ferment:x.ferment||0,tags:x.tags,traditional:true,flag:'🇵🇱',servingType:x.servingType,source:x.source,sourceUrl:x.sourceUrl||r.sourceUrl||'',license:x.license||r.license||'',image:x.image,imageSource:x.imageSource||'bundled',imageCredit:x.imageCredit||'Kucharzyna'});
        r.sections=[{id:uid(),name:'Główna',ingredients:x.ingredients.map(a=>({id:uid(),name:a[0],qty:a[1],unit:a[2],percent:''}))}];r.steps=x.steps.map(text=>({id:uid(),text}));
      }
      r.image=x.image;r.imageSource=x.imageSource||'bundled';r.imageCredit=x.imageCredit||'Kucharzyna';
      if(!r.sections?.length)r.sections=[{id:uid(),name:'Główna',ingredients:x.ingredients.map(a=>({id:uid(),name:a[0],qty:a[1],unit:a[2],percent:''}))}];
      await put('recipes',r);
    }
    state.recipes=await getAll('recipes');
  }catch(e){console.error('Polish recipe expansion failed',e)}
}



/* ============================================================
   Kucharzyna 3.7 — exact food photos, no random Polish fallbacks
   ============================================================ */
const K37_EXACT_PHOTOS={
  "Pierogi z mięsem":{
    image:"https://upload.wikimedia.org/wikipedia/commons/7/78/Pierogi_z_mięsem.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Pierogi_z_mięsem.jpg",
    credit:"Ewkaa / Wikimedia Commons",
    license:"CC BY-SA 4.0 / GFDL"
  },
  "Kotlet schabowy":{
    image:"https://upload.wikimedia.org/wikipedia/commons/4/40/Kotlet_Schabowy.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Kotlet_Schabowy.jpg",
    credit:"Dmitry Dzema / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Placki ziemniaczane":{
    image:"https://upload.wikimedia.org/wikipedia/commons/8/86/Polish_potato_pancakes.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Polish_potato_pancakes.jpg",
    credit:"Kavyass / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Gołąbki z mięsem i ryżem":{
    image:"https://upload.wikimedia.org/wikipedia/commons/c/c2/Gołąbki_-_10.02.2026.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Gołąbki_-_10.02.2026.jpg",
    credit:"Aw58 / Wikimedia Commons",
    license:"CC BY 4.0"
  },
  "Kopytka":{
    image:"https://upload.wikimedia.org/wikipedia/commons/b/bd/Kopytka_ze_skwarkami_-_14.08.2026.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Kopytka_ze_skwarkami_-_14.08.2026.jpg",
    credit:"Aw58 / Wikimedia Commons",
    license:"CC BY 4.0"
  },
  "Naleśniki z twarogiem":{
    image:"https://upload.wikimedia.org/wikipedia/commons/1/10/Naleśniki_z_serem_-_2023.11.13.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Naleśniki_z_serem_-_2023.11.13.jpg",
    credit:"Aw58 / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Racuchy z jabłkami":{
    image:"https://upload.wikimedia.org/wikipedia/commons/7/74/Racuchy_z_jabłkami_-_28.08.2026.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Racuchy_z_jabłkami_-_28.08.2026.jpg",
    credit:"Aw58 / Wikimedia Commons",
    license:"CC BY 4.0"
  },
  "Barszcz czerwony":{
    image:"https://upload.wikimedia.org/wikipedia/commons/0/0d/Barszcz_czerwony_z_uszkami.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Barszcz_czerwony_z_uszkami.jpg",
    credit:"Игорь Хмиловский / Wikimedia Commons",
    license:"CC0 1.0"
  },
  "Sałatka jarzynowa":{
    image:"https://upload.wikimedia.org/wikipedia/commons/6/6f/2023_Sałatka_jarzynowa_%281%29.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:2023_Sałatka_jarzynowa_(1).jpg",
    credit:"Jacek Halicki / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Biały barszcz":{
    image:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Biały_barszcz_-_25.08.2026.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Biały_barszcz_-_25.08.2026.jpg",
    credit:"Aw58 / Wikimedia Commons",
    license:"CC BY 4.0"
  },
  "Mizeria":{
    image:"https://upload.wikimedia.org/wikipedia/commons/7/7d/Mizeria.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Mizeria.jpg",
    credit:"Mariuszjbie / Wikimedia Commons",
    license:"CC BY-SA"
  },
  "Kotlet mielony":{
    image:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kotlety_mielone_-_14.03.2026.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Kotlety_mielone_-_14.03.2026.jpg",
    credit:"Aw58 / Wikimedia Commons",
    license:"CC BY 4.0"
  },
  "Kaczka z jabłkami":{
    image:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Polish_duck_with_apples.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Polish_duck_with_apples.jpg",
    credit:"MOs810 / Wikimedia Commons",
    license:"CC BY-SA 3.0"
  },
  "Golonka po polsku":{
    image:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Nowy_Tomysl_golonka.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Nowy_Tomysl_golonka.jpg",
    credit:"MOs810 / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Flaki po warszawsku":{
    image:"https://upload.wikimedia.org/wikipedia/commons/7/73/Flaki_Poland_3657.JPG",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Flaki_Poland_3657.JPG",
    credit:"MOs810 / Wikimedia Commons",
    license:"CC BY-SA 3.0"
  },
  "Krupnik":{
    image:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Krupnik_soup_Poland.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Krupnik_soup_Poland.jpg",
    credit:"MOs810 / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Kluski śląskie":{
    image:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kluski_slaskie_(Poznan).jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Kluski_slaskie_(Poznan).jpg",
    credit:"MOs810 / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Pyzy z mięsem":{
    image:"https://upload.wikimedia.org/wikipedia/commons/4/49/Pyzy_z_mięsem.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Pyzy_z_mięsem.jpg",
    credit:"Ewkaa / Wikimedia Commons",
    license:"CC BY-SA 4.0"
  },
  "Sernik":{
    image:"https://upload.wikimedia.org/wikipedia/commons/9/96/Sernik_-_Pastel_de_queso%2C_Gastronomía_polaca%2C_Gniezno%2C_Polonia1.jpg",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Sernik_-_Pastel_de_queso,_Gastronomía_polaca,_Gniezno,_Polonia1.jpg",
    credit:"Diego Delso / Wikimedia Commons",
    license:"CC BY-SA 3.0"
  },
  "Makowiec":{
    image:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Makowiec_1.JPG",
    sourceUrl:"https://commons.wikimedia.org/wiki/File:Makowiec_1.JPG",
    credit:"Alina Zienowicz (Ala_z) / Wikimedia Commons",
    license:"GFDL / CC BY-SA"
  }
};
const _k37RecipeImageBase=recipeImage;
recipeImage=function(r){return K37_EXACT_PHOTOS[r?.name]?.image||_k37RecipeImageBase(r)};
async function k37RepairExactPhotos(){
  try{
    const all=await getAll('recipes');
    for(const r of all){
      const p=K37_EXACT_PHOTOS[r.name];
      if(!p)continue;
      r.image=p.image;
      r.imageUrl=p.sourceUrl;
      r.sourceUrl=p.sourceUrl;
      r.imageSource='external-wikimedia-exact';
      r.imageCredit=p.credit;
      r.license=p.license;
      await put('recipes',r);
    }
    state.recipes=await getAll('recipes');
    renderV20();
  }catch(e){console.error('K37 exact photo repair failed',e)}
}
setTimeout(k37RepairExactPhotos,1600);

/* Install the cleaned transparent atlas and update cache references. */
function k32InstallIngredientAtlasV2(){
  try{
    const styleId='k32-ingredient-atlas-v2-style'; if(document.getElementById(styleId))return;
    const s=document.createElement('style');s.id=styleId;s.textContent=`
      .k32-ing-thumb{width:36px!important;height:36px!important;flex:0 0 36px!important;border-radius:10px!important;display:block!important;background-image:url('./ingredient-atlas-transparent.webp')!important;background-repeat:no-repeat!important;background-size:432px 288px!important;background-position:calc(var(--ix,0) * -36px) calc(var(--iy,0) * -36px)!important;background-color:transparent!important;box-shadow:none!important;mix-blend-mode:normal!important;overflow:hidden!important}
      .k32-ing-emoji{display:grid!important;place-items:center!important;background:color-mix(in srgb,var(--surface2,#202226) 72%,transparent)!important;font-size:22px!important;line-height:1!important;border:1px solid color-mix(in srgb,var(--text) 8%,transparent)!important}
      .k32-cook-ing .k32-ing-thumb{width:38px!important;height:38px!important;flex-basis:38px!important;background-size:456px 304px!important;background-position:calc(var(--ix,0) * -38px) calc(var(--iy,0) * -38px)!important}
      .k32-search input,#recipeSearch{pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important;touch-action:manipulation!important;caret-color:var(--text)!important}
      #k32-live-search-empty{grid-column:1/-1}
    `;document.head.appendChild(s);
  }catch(e){console.error('Ingredient atlas style failed',e)}
}

const _kAtlasBind=bindV20;
bindV20=function(){_kAtlasBind();k32InstallIngredientAtlasV2()};

async function k39RepairPolishMetadata(){
  try{
    let changed=false;
    for(const r of state.recipes){
      if(String(r.cuisine||'').toLowerCase()!=='polska')continue;
      const x=k39PolishMetadata(r);
      if(r.traditional!==x.traditional||r.regional!==x.regional||r.region!==x.region){Object.assign(r,{traditional:x.traditional,regional:x.regional,region:x.region,updatedAt:now()});await put('recipes',r);changed=true;}
    }
    if(changed)state.recipes=await getAll('recipes');
  }catch(e){console.error('Polish metadata repair failed',e)}
}
setTimeout(async()=>{await k32EnsurePierogiRuskie();await k33EnsurePolishRecipes();await k39RepairPolishMetadata();renderV20()},950);

/* K35 SEARCH FIX: all category searches are live and NEVER rerender on each keystroke.
   Re-rendering the whole view was causing iOS Safari to dismiss the keyboard after every character. */
function k35LiveFilter(containerSelector, cardSelector, query, getText){
  try{
    const root=document.querySelector(containerSelector); if(!root)return;
    const grid=root.querySelector(cardSelector); if(!grid)return;
    const q=String(query||'').trim().toLocaleLowerCase('pl');
    const cards=[...grid.children];
    let shown=0;
    cards.forEach(card=>{
      if(!(card instanceof HTMLElement))return;
      const text=String(getText?getText(card):card.textContent||'').toLocaleLowerCase('pl');
      const ok=!q||text.includes(q);
      card.hidden=!ok;
      if(ok)shown++;
    });
    grid.hidden=shown===0;
    let empty=root.querySelector('.k35-live-empty');
    if(shown===0){
      if(!empty){
        empty=document.createElement('div');
        empty.className='k33-empty k35-live-empty';
        empty.innerHTML='<div>⌕</div><h3>Brak wyników</h3><p>Spróbuj innej nazwy, składnika albo kategorii.</p>';
        grid.parentElement?.appendChild(empty);
      }
      empty.hidden=false;
    }else if(empty){empty.hidden=true}
  }catch(err){console.error('K35 live search failed',err)}
}
function k35FilterCategorySearch(input){
  state.categoryQuery=input.value||'';
  k35LiveFilter('.k34-category-page','.k32-recipe-grid',input.value);
  const clear=document.querySelector('#k34-category-clear'); if(clear)clear.hidden=!String(input.value||'').length;
}
function k35FilterWorldCuisine(input){
  state.worldCuisineQuery=input.value||'';
  k35LiveFilter('.k33-world-menu','.k33-cuisine-grid',input.value);
}
function k35FilterWorldDishes(input){
  state.worldDishQuery=input.value||'';
  k35LiveFilter('.k33-world-detail','.k33-world-recipe-grid',input.value);
}
if(!window.__k35SearchCaptureBound){
  window.__k35SearchCaptureBound=true;
  document.addEventListener('input',e=>{
    try{
      const t=e.target;
      if(!(t instanceof HTMLInputElement))return;
      if(t.id==='recipeSearch'){
        e.stopImmediatePropagation();
        k32ApplyRecipeSearchLive(t);
      }else if(t.id==='k34-category-search'){
        e.stopImmediatePropagation();
        k35FilterCategorySearch(t);
      }else if(t.id==='k33-world-search'){
        e.stopImmediatePropagation();
        k35FilterWorldCuisine(t);
      }else if(t.id==='k33-world-dish-search'){
        e.stopImmediatePropagation();
        k35FilterWorldDishes(t);
      }
    }catch(err){console.error('K35 search capture failed',err)}
  },true);
}

/* K38 ingredient icons: replace the old atlas with recognizable OpenMoji food icons. */
(function k38InstallIngredientIcons(){
  const C='https://cdn.jsdelivr.net/npm/openmoji@15.1.0/color/svg/';
  const M={
    'mąka':'1F33E','mąka pszenna':'1F33E','mąka pszenna typ 450/550':'1F33E','mąka ziemniaczana':'1F33E','bułka':'1F35E','bułka pszenna':'1F35E','bułka tarta':'1F35E','bagietka':'1F956','chleb':'1F35E','woda':'1F4A7','sól':'1F9C2','cukier':'1F36C','drożdże':'1F35E',
    'oliwa':'1FAD2','olej':'1FAD2','masło':'1F9C8','mleko':'1F95B','śmietana':'1F95B','śmietanka':'1F95B','jogurt':'1F95B',
    'jajka':'1F95A','jajko':'1F95A','żółtka':'1F95A','żółtko':'1F95A',
    'mozzarella':'1F9C0','twaróg':'1F9C0','ricotta':'1F9C0','parmesan':'1F9C0','parmigiano':'1F9C0','pecorino':'1F9C0','gorgonzola':'1F9C0','ser pleśniowy':'1F9C0','ser żółty':'1F9C0','ser':'1F9C0','feta':'1F9C0','mascarpone':'1F9C0',
    'czosnek':'1F9C4','cebula':'1F9C5','czerwona cebula':'1F9C5','por':'1F9C5','marchew':'1F955','marchewka':'1F955','seler':'1F96C','pietruszka':'1F33F','kolendra':'1F33F','koperek':'1F33F','szczypiorek':'1F33F',
    'bazylia':'1F33F','oregano':'1F33F','tymianek':'1F33F','rozmaryn':'1F33F','majeranek':'1F33F','szałwia':'1F33F','imbir':'1FADA','trawa cytrynowa':'1F33F',
    'pomidor':'1F345','pomidory':'1F345','pomidory san marzano':'1F345','pomidory san marzano pelati':'1F345','passata':'1F345','koncentrat pomidorowy':'1F345',
    'papryka':'1F336','papryka świeża':'1F336','papryczka chili':'1F336','chili':'1F336','ancho chili':'1F336','suszone chili':'1F336','jalapeño':'1F336','cukinia':'1F952','bakłażan':'1F346','ogórek':'1F952',
    'ziemniaki':'1F954','pieczarki':'1F344','grzyby':'1F344','borowiki':'1F344','trufle':'1F344','szpinak':'1F96C','rukola':'1F96C','sałata':'1F96C','karczochy':'1F966','oliwki':'1FAD2','kapary':'1F96C',
    'wołowina':'1F969','bulion':'1F963','bulion wołowy':'1F963','gotowana łopatka wieprzowa':'1F969','łopatka wieprzowa':'1F969','golonka wieprzowa':'1F969','flaki wołowe oczyszczone':'1F969','wołowina mielona':'1F969','wieprzowina':'1F969','wieprzowina mielona':'1F969','kurczak':'1F357','udka z kurczaka':'1F357','baranina mielona':'1F969','jagnięcina':'1F969','królik':'1F407','boczek':'1F953','pancetta':'1F953','guanciale':'1F953','szynka':'1F953','prosciutto':'1F953','salami':'1F953','kiełbasa':'1F32D','chorizo':'1F32D','biała kiełbasa':'1F32D','wędzonka':'1F953',
    'krewetki':'1F990','krewetka':'1F990','małże':'1F41A','mule':'1F41A','ośmiornica':'1F991','ośmiornica gotowana':'1F991','ryba':'1F41F','biała ryba':'1F41F','dorsz':'1F41F','łosoś':'1F41F','tuńczyk':'1F41F','anchois':'1F41F',
    'spaghetti':'1F35D','makaron':'1F35D','makaron ryżowy':'1F35D','makaron ramen':'1F35C','tonnarelli':'1F35D','ciasto filo':'1F95F','tortille':'1FAD3',
    'ryż':'1F35A','ryż arborio':'1F35A','ryż risotto':'1F35A','ryż ugotowany':'1F35A','kasza':'1F33E','groszek':'1FAD9','fasolka':'1FAD8','fasola':'1FAD8','czarna fasola':'1FAD8','ciecierzyca':'1FAD8','sucha ciecierzyca':'1FAD8','soczewica':'1FAD8',
    'orzechy':'1F330','orzeszki':'1F95C','migdały':'1F330','pistacje':'1F95C','sezam':'1F330','miód':'1F36F','musztarda':'1FAD9','majonez':'1F95A','ketchup':'1F345','sos pomidorowy':'1F345','sos sojowy':'1FAD9','sos rybny':'1F41F','ocet':'1FAD9','ocet ryżowy':'1FAD9','ocet winny':'1FAD9','espresso':'2615','kakao':'1F36B','cytryna':'1F34B','sok z cytryny':'1F34B','sok z limonki':'1F34B','limonka':'1F34B','pomarańcza':'1F34A','szafran':'1F33C','pieprz':'1F336','pieprz czarny':'1F336','pieprz syczuański':'1F336','kumin':'1F33F','kminek':'1F33F','garam masala':'1F33F','five spice':'1F33F','anyż':'1F33F','cynamon':'1F33F','wanilia':'1F33F',
    'awokado':'1F951','ananas':'1F34D','gruszka':'1F350','śliwki suszone':'1F95D','mleko kokosowe':'1F965','tofu':'1FAD1','tahini':'1FAD9','pasta tamaryndowa':'1FAD9','pasta massaman':'1F336','pasta gochujang':'1F336','gochujang':'1F336','miso':'1FAD9','dashi':'1FAD9','mirin':'1FAD9','hoisin':'1FAD9','doubanjiang':'1F336','liście kaffiru':'1F33F','nori':'1F96C','wakame':'1F96C','achiote':'1F33F'
  };
  function codeFor(name){
    const raw=String(name||'').trim().toLowerCase();
    if(M[raw])return M[raw];
    const k=Object.keys(M).find(x=>raw.includes(x)||x.includes(raw));
    if(k)return M[k];
    if(/bułk|bagiet|chleb|pieczyw/.test(raw))return '1F35E';
    if(/bulion|barszcz|zupa/.test(raw))return '1F963';
    if(/mąk|kasz|skrobi|płatk/.test(raw))return '1F33E';
    if(/mięso|łopatk|schab|golonk|flak|pasztet/.test(raw))return '1F969';
    if(/kiełbas|chorizo|wędzon|szynk/.test(raw))return '1F32D';
    if(/ryż|risotto/.test(raw))return '1F35A';
    if(/makaron|spaghetti|ramen|tonnarelli/.test(raw))return '1F35D';
    if(/jajk|żółtk/.test(raw))return '1F95A';
    if(/ser|twaróg|paneer/.test(raw))return '1F9C0';
    if(/mleko|śmietan|jogurt/.test(raw))return '1F95B';
    if(/masło|ghee/.test(raw))return '1F9C8';
    if(/olej|oliw/.test(raw))return '1FAD2';
    if(/ziemniak/.test(raw))return '1F954';
    if(/pomidor/.test(raw))return '1F345';
    if(/jabłk/.test(raw))return '1F34E';
    if(/grusz/.test(raw))return '1F350';
    if(/kapust/.test(raw))return '1F96C';
    if(/ogórk/.test(raw))return '1F952';
    if(/papryk|chili|jalape/.test(raw))return '1F336';
    if(/cytryn/.test(raw))return '1F34B';
    if(/pomarańcz/.test(raw))return '1F34A';
    if(/orzech|migdał|pistacj/.test(raw))return '1F330';
    if(/cukier/.test(raw))return '1F36C';
    if(/miód/.test(raw))return '1F36F';
    if(/sól/.test(raw))return '1F9C2';
    if(/wod/.test(raw))return '1F4A7';
    if(/piwo|wino|ocet/.test(raw))return '1F37E';
    if(/zioł|bazyl|oregano|tymian|majeran|pietrusz|koperek|kolendr|szczypior|kminek|kumin|wanil|cynam|imbir|szafran|gałk/.test(raw))return '1F33F';
    return '1FAD9';
  }
  window.k38IngredientIconMarkup=function(name){const code=codeFor(name); if(!code)return `<span class="k38-ing-fallback" aria-hidden="true">🍽️</span>`; return `<img class="k38-ing-icon" src="${C}${code}.svg" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;};
  window.k32IngredientIconMarkup=window.k38IngredientIconMarkup;
  window.k32IngredientIconMarkupV2=window.k38IngredientIconMarkup;
  window.k38IngredientIconCode=codeFor;
  const sid='k38-ingredient-icons-style'; if(!document.getElementById(sid)){const s=document.createElement('style');s.id=sid;s.textContent='.k38-ing-icon,.k38-ing-fallback{width:38px!important;height:38px!important;flex:0 0 38px!important;display:block!important;object-fit:contain!important;border-radius:9px!important}.k38-ing-fallback{font-size:28px;line-height:38px;text-align:center;background:transparent}.k32-ing-thumb{background-image:none!important;background-position:initial!important}';document.head.appendChild(s);}
})();

/* K40 final override: ingredient icons never become a plate/fork placeholder. */
(function(){
  const C='https://cdn.jsdelivr.net/npm/openmoji@15.1.0/color/svg/';
  const M={
    'bułka pszenna':'1F35E','bułka tarta':'1F35E','bułka':'1F35E','chleb':'1F35E','bagietka':'1F956','mąka':'1F33E','mąka pszenna':'1F33E','mąka ziemniaczana':'1F954','woda':'1F4A7','sól':'1F9C2','cukier':'1F36C','drożdże':'1F35E','masło':'1F9C8','mleko':'1F95B','śmietana':'1F95B','jajko':'1F95A','jajka':'1F95A','ser':'1F9C0','twaróg':'1F9C0','czosnek':'1F9C4','cebula':'1F9C5','por':'1F9C5','marchew':'1F955','pietruszka':'1F33F','koperek':'1F33F','bazylia':'1F33F','pomidor':'1F345','papryka':'1F336','chili':'1F336','ogórek':'1F952','cukinia':'1F952','ziemniak':'1F954','ziemniaki':'1F954','pieczarki':'1F344','grzyby':'1F344','kapusta':'1F96C','brokuły':'1F966','kalafior':'1F966','wołowina':'1F969','wieprzowina':'1F969','schab':'1F969','mięso mielone':'1F969','kurczak':'1F357','kaczka':'1F357','boczek':'1F953','szynka':'1F953','kiełbasa':'1F32D','krewetki':'1F990','mule':'1F41A','ryba':'1F41F','łosoś':'1F41F','makaron':'1F35D','spaghetti':'1F35D','ramen':'1F35C','ryż':'1F35A','kasza':'1F33E','fasola':'1FAD8','ciecierzyca':'1FAD8','soczewica':'1FAD8','orzechy':'1F330','migdały':'1F330','miód':'1F36F','cytryna':'1F34B','limonka':'1F34B','jabłko':'1F34E','jabłka':'1F34E','gruszka':'1F350','śliwki':'1F95D','awokado':'1F951','ananas':'1F34D','kakao':'1F36B','czekolada':'1F36B','oliwa':'1FAD2','olej':'1FAD2','tofu':'1FAD1','kukurydza':'1F33D','dynia':'1F383','burak':'1F96C','rzodkiewka':'1F952','zupa':'1F963','bulion':'1F963'};
  const E={bread:'🍞',flour:'🌾',water:'💧',salt:'🧂',sugar:'🍬',fat:'🧈',milk:'🥛',egg:'🥚',cheese:'🧀',garlic:'🧄',onion:'🧅',veg:'🥬',tomato:'🍅',pepper:'🌶️',potato:'🥔',mushroom:'🍄',meat:'🥩',chicken:'🍗',sausage:'🌭',fish:'🐟',seafood:'🦐',pasta:'🍝',rice:'🍚',bean:'🫘',nut:'🥜',honey:'🍯',fruit:'🍎',citrus:'🍋',spice:'🌿',soup:'🥣',generic:'🌿'};
  function code(raw){ if(M[raw])return M[raw]; const k=Object.keys(M).sort((a,b)=>b.length-a.length).find(x=>raw.includes(x)); return k?M[k]:null; }
  function emoji(raw){
    if(/bułk|bagiet|chleb|pieczyw/.test(raw))return E.bread; if(/mąk|skrobi|płatk|kasz/.test(raw))return E.flour; if(/wod/.test(raw))return E.water; if(/sól/.test(raw))return E.salt; if(/cukier/.test(raw))return E.sugar; if(/masł|ghee|tłuszcz/.test(raw))return E.fat; if(/mleko|śmietan|jogurt/.test(raw))return E.milk; if(/jajk|żółtk|białk/.test(raw))return E.egg; if(/ser|twaróg|feta|ricott|mascarpone/.test(raw))return E.cheese; if(/czosnk/.test(raw))return E.garlic; if(/cebul|por/.test(raw))return E.onion; if(/pomidor|passata|ketchup/.test(raw))return E.tomato; if(/papryk|chili|pieprz/.test(raw))return E.pepper; if(/ziemniak/.test(raw))return E.potato; if(/grzyb|pieczark/.test(raw))return E.mushroom; if(/woł|wieprz|schab|golonk|mięso|kacz|baranin|jagnię/.test(raw))return E.meat; if(/kurczak|drób|udko/.test(raw))return E.chicken; if(/kiełbas|chorizo|salami/.test(raw))return E.sausage; if(/ryb|dorsz|łosoś|tuńczyk/.test(raw))return E.fish; if(/krewet|mule|małż|ośmior/.test(raw))return E.seafood; if(/makaron|spaghetti|ramen|lasagne|gnocchi/.test(raw))return E.pasta; if(/ryż|risotto/.test(raw))return E.rice; if(/fasol|ciecierzyc|soczewic|groch|bób/.test(raw))return E.bean; if(/orzech|migdał|pistacj|sezam/.test(raw))return E.nut; if(/miód/.test(raw))return E.honey; if(/cytryn|limonk|pomarańcz/.test(raw))return E.citrus; if(/jabłk|grusz|śliwk|owoc/.test(raw))return E.fruit; if(/bulion|zupa|barszcz|żurek/.test(raw))return E.soup; if(/zioł|bazyl|oregano|tymian|majeran|pietrusz|koperek|szczypior|kminek|kumin|wanil|cynam|imbir/.test(raw))return E.spice; return E.generic;
  }
  function markup(name){const raw=String(name||'').trim().toLowerCase(), c=code(raw), em=emoji(raw); if(!c)return `<span class="k40-ing-icon k40-ing-emoji" aria-hidden="true">${em}</span>`; return `<span class="k40-ing-wrap"><img class="k40-ing-icon" src="${C}${c}.svg" alt="" loading="lazy" decoding="async" onerror="this.remove();this.nextElementSibling.style.display='grid'"><span class="k40-ing-icon k40-ing-emoji" aria-hidden="true" style="display:none">${em}</span></span>`;}
  window.k38IngredientIconMarkup=markup; window.k32IngredientIconMarkup=markup; window.k32IngredientIconMarkupV2=markup;
  const st=document.createElement('style'); st.id='k40-icon-style'; st.textContent='.k40-ing-wrap{width:40px;height:40px;display:block;flex:0 0 40px}.k40-ing-icon{width:40px!important;height:40px!important;object-fit:contain!important;display:block!important}.k40-ing-emoji{display:grid;place-items:center;font-size:27px;line-height:1;border-radius:10px;background:color-mix(in srgb,var(--surface2,#202226) 55%,transparent);border:1px solid color-mix(in srgb,var(--text) 8%,transparent)}'; document.head.appendChild(st);
})();

/* K40 final Liquid Glass polish: the photograph becomes an atmosphere, not a card. */
(function(){const s=document.createElement('style');s.id='k40-liquid-final';s.textContent=`
.k39-liquid-home{overflow:hidden!important;background:transparent!important}
.k39-home-photo{top:-70px!important;width:170vw!important;max-width:none!important;height:570px!important;opacity:.88!important;filter:saturate(1.18) contrast(1.04)!important;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 24%,#000 28%,rgba(0,0,0,.94) 52%,rgba(0,0,0,.58) 73%,transparent 94%)!important;mask-image:radial-gradient(ellipse 80% 70% at 50% 24%,#000 28%,rgba(0,0,0,.94) 52%,rgba(0,0,0,.58) 73%,transparent 94%)!important}
.k39-home-ambient{inset:-150px -100px -70px!important;filter:blur(85px) saturate(1.7)!important;opacity:.46!important;transform:scale(1.2)!important}
.k39-liquid-home:before{content:"";position:absolute;z-index:-2;inset:0;background:radial-gradient(ellipse at 50% 10%,rgba(255,255,255,.17),transparent 34%),radial-gradient(circle at 5% 35%,rgba(255,170,90,.10),transparent 35%),radial-gradient(circle at 95% 40%,rgba(90,170,255,.10),transparent 38%);pointer-events:none}
.k39-liquid-home:after{background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.02) 27%,color-mix(in srgb,var(--bg) 48%,transparent) 53%,var(--bg) 78%)!important}
.k39-hero-glass{background:linear-gradient(145deg,rgba(255,255,255,.17),rgba(255,255,255,.045))!important;border:1px solid rgba(255,255,255,.24)!important;box-shadow:0 30px 80px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.30)!important;backdrop-filter:blur(22px) saturate(1.42)!important;-webkit-backdrop-filter:blur(22px) saturate(1.42)!important}
.k39-menu-glass .v3-menu-card{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.045))!important;border-color:rgba(255,255,255,.20)!important;box-shadow:0 18px 46px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.24)!important;backdrop-filter:blur(25px) saturate(1.52)!important;-webkit-backdrop-filter:blur(25px) saturate(1.52)!important}
.k39-glass-section{background:linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.035))!important;border-color:rgba(255,255,255,.16)!important;box-shadow:0 22px 60px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.18)!important;backdrop-filter:blur(30px) saturate(1.5)!important;-webkit-backdrop-filter:blur(30px) saturate(1.5)!important}
@media(max-width:430px){.k39-home-photo{top:-85px!important;width:190vw!important;height:535px!important}.k39-home-ambient{filter:blur(72px) saturate(1.55)!important;opacity:.42!important}.k39-hero-glass{min-height:365px!important}}
`;document.head.appendChild(s)})();

/* ============================================================
   Kucharzyna 3.12 — MAGAZYN / LODÓWKA
   Inventory is local, profile-aware and consumed automatically
   when a cooking session is completed.
   ============================================================ */
(function k312Inventory(){
  const unitAliases={kg:'kg',g:'g',gram:'g',gramy:'g',ml:'ml',l:'l',litry:'l',szt:'szt.', 'szt.':'szt.',sztuk:'szt.',porcja:'porcja',porcje:'porcja'};
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  const aliases={
    'maka pszenna':'maka pszenna','maka':'maka','maka typ 450':'maka pszenna','maka typ 500':'maka pszenna','maka typ 550':'maka pszenna',
    'bulka pszenna':'bulka pszenna','bulka tarta':'bulka tarta','chleb':'chleb','woda':'woda','sol':'sol','cukier':'cukier','drozdze':'drozdze',
    'oliwa':'oliwa','olej':'olej','maslo':'maslo','mleko':'mleko','smietana':'smietana','jajko':'jajko','jajka':'jajko','zoltka':'jajko',
    'pecorino romano':'pecorino romano','parmezan':'parmezan','ser':'ser','twarog':'twarog','czosnek':'czosnek','cebula':'cebula',
    'marchew':'marchew','pietruszka':'pietruszka','koperek':'koperek','bazylia':'bazylia','pomidor':'pomidor','pomidory':'pomidor','passata':'passata',
    'papryka':'papryka','chili':'chili','ogorek':'ogorek','cukinia':'cukinia','ziemniak':'ziemniak','ziemniaki':'ziemniak',
    'pieczarki':'pieczarki','grzyby':'grzyby','kapusta':'kapusta','brokuly':'brokuly','kalafior':'kalafior','burak':'burak',
    'wolowina':'wolowina','wieprzowina':'wieprzowina','schab':'schab','mieso mielone':'mieso mielone','kurczak':'kurczak','kaczka':'kaczka',
    'boczek':'boczek','szynka':'szynka','kielbasa':'kielbasa','guanciale':'guanciale','ryba':'ryba','losos':'losos','tunczyk':'tunczyk',
    'krewetki':'krewetki','mule':'mule','makaron':'makaron','spaghetti':'spaghetti','ryz':'ryz','kasza':'kasza','fasola':'fasola',
    'ciecierzyca':'ciecierzyca','soczewica':'soczewica','orzechy':'orzechy','migdal':'migdal','miod':'miod','cytryna':'cytryna',
    'limonka':'limonka','jablko':'jablko','jablka':'jablko','gruszka':'gruszka','awokado':'awokado','ananas':'ananas','kakao':'kakao',
    'czekolada':'czekolada','tofu':'tofu','kukurydza':'kukurydza','dynia':'dynia','bulion':'bulion','ocet':'ocet','sos sojowy':'sos sojowy',
    'musztarda':'musztarda','koncentrat pomidorowy':'koncentrat pomidorowy','pieprz':'pieprz','papryka slodka':'papryka slodka'
  };
  function invKey(name){const n=norm(name);if(aliases[n])return aliases[n];const hit=Object.keys(aliases).sort((a,b)=>b.length-a.length).find(k=>n===k||n.startsWith(k+' '));return hit?aliases[hit]:n;}
  function unit(u){const x=String(u||'g').trim().toLowerCase();return unitAliases[x]||x;}
  function factor(u){u=unit(u);return u==='kg'?1000:u==='l'?1000:u==='g'||u==='ml'||u==='szt.'||u==='porcja'?1:1;}
  function compatible(a,b){a=unit(a);b=unit(b);return (['g','kg'].includes(a)&&['g','kg'].includes(b))||(['ml','l'].includes(a)&&['ml','l'].includes(b))||a===b;}
  function convert(q,from,to){from=unit(from);to=unit(to);if(!compatible(from,to))return null;const base=q*factor(from);return base/factor(to)}
  function label(){return state.settings.profile==='amateur'?'Lodówka':'Magazyn'}
  function icon(){return state.settings.profile==='amateur'?'🧊':'📦'}
  function invSummary(){const arr=state.inventory||[];return arr.reduce((a,x)=>a+(+x.qty||0),0)}
  function invLowItems(){return (state.inventory||[]).filter(x=>Number.isFinite(+x.alertQty)&&+x.alertQty>0&&(+x.qty||0)<=+x.alertQty)}

  window.k312InventoryKey=invKey;
  window.k312ConsumeRecipe=async function(recipeId){
    const r=state.recipes.find(x=>x.id===recipeId);if(!r)return {changed:0,missing:[]};
    let items=await getAll('inventoryItems');let changed=0;const missing=[];
    for(const s of r.sections||[]) for(const ing of s.ingredients||[]){
      const need=+ing.qty||0;if(!ing.name||need<=0)continue;
      const key=invKey(ing.name);let item=items.find(x=>x.key===key&&compatible(x.unit,ing.unit));
      if(!item){missing.push(ing.name);continue;}
      const take=convert(need,ing.unit,item.unit);if(take==null){missing.push(ing.name);continue;}
      item.qty=Math.max(0,(+item.qty||0)-take);item.updatedAt=now();await put('inventoryItems',item);changed++;
      items=items.map(x=>x.id===item.id?item:x);
    }
    state.inventory=items;
    return {changed,missing:[...new Set(missing)]};
  };

  function inventoryRows(){
    const q=String(state.inventoryQuery||'').trim().toLocaleLowerCase('pl');
    const arr=(state.inventory||[]).filter(x=>!q||String(x.name).toLocaleLowerCase('pl').includes(q));
    return arr;
  }
  window.viewInventoryK312=function(){
    const arr=inventoryRows(), total=(state.inventory||[]).length;
    const low=invLowItems();
    return `<div class="k312-inventory"><div class="k312-head"><div><span class="v3-kicker">${label().toUpperCase()}</span><h1>${icon()} ${label()}</h1><p>Stan składników na tym urządzeniu. Po każdym gotowaniu Kucharzyna zapyta, czy odjąć zużyte produkty.</p></div><button class="v3-add-btn" id="k312-add">＋<span>Dodaj</span></button></div>${low.length?`<section class="k312-alert"><div class="k312-alert-title">⚠️ Kończy się</div><div class="k312-alert-list">${low.map(x=>`<span>${escapeHtml(x.name)} · ${fmt(x.qty)} ${escapeHtml(x.unit)}</span>`).join('')}</div></section>`:''}<div class="k312-summary"><div><b>${total}</b><span>pozycji</span></div><div><b>${invSummary()}</b><span>łączna ilość</span></div><div><b>${low.length}</b><span>alertów</span></div></div><div class="k312-search"><span>⌕</span><input id="k312-search" value="${escapeHtml(state.inventoryQuery||'')}" placeholder="Szukaj składnika…" autocomplete="off"></div><div class="k312-list">${arr.length?arr.map(x=>`<article class="k312-row ${Number.isFinite(+x.alertQty)&&+x.alertQty>0&&(+x.qty||0)<=+x.alertQty?'is-low':''}"><div class="k312-row-main">${k32IngredientIconMarkup(x.name)}<div><b>${escapeHtml(x.name)}</b><small>stan: <strong>${fmt(x.qty)} ${escapeHtml(x.unit)}</strong>${Number.isFinite(+x.alertQty)&&+x.alertQty>0?` · alert przy ${fmt(x.alertQty)} ${escapeHtml(x.unit)}`:''}</small></div></div><div class="k312-row-actions"><button data-k312-edit="${escapeHtml(x.id)}" aria-label="Edytuj">✎</button><button data-k312-del="${escapeHtml(x.id)}" aria-label="Usuń">×</button></div></article>`).join(''):`<div class="k312-empty"><span>${icon()}</span><b>Brak składników</b><p>Dodaj pierwszy produkt, który masz w domu lub na kuchni.</p></div>`}</div></div>`;
  };

  async function saveItem(data,id){
    const name=String(data.name||'').trim();const qty=+data.qty||0;const u=unit(data.unit);const alertQty=Math.max(0,+data.alertQty||0);if(!name||qty<0||alertQty<0){toast('Podaj nazwę i prawidłową ilość');return false;}
    const item={id:id||uid(),name,qty,unit:u,key:invKey(name),alertQty,updatedAt:now()};await put('inventoryItems',item);state.inventory=await getAll('inventoryItems');return true;
  }
  function editItem(id){
    const item=(state.inventory||[]).find(x=>x.id===id)||{name:'',qty:0,unit:'g'};
    openModal(`<h2>${id?'Edytuj składnik':'Dodaj do '+label().toLowerCase()}</h2><label>Nazwa składnika<input id="k312-name" value="${escapeHtml(item.name)}" placeholder="Np. mąka pszenna"></label><label>Ilość<input id="k312-qty" type="number" inputmode="decimal" min="0" step="0.01" value="${escapeHtml(item.qty)}"></label><label>Jednostka<select id="k312-unit"><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option><option value="szt.">szt.</option><option value="porcja">porcja</option></select></label><label>Alert „kończy się”<input id="k312-alert" type="number" inputmode="decimal" min="0" step="0.01" value="${escapeHtml(item.alertQty||0)}"><small class="muted">0 = bez alertu</small></label><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn" data-close>Anuluj</button><button class="btn primary" id="k312-save">Zapisz</button></div>`);
    $('#k312-unit').value=unit(item.unit);$('#k312-save').onclick=async()=>{if(await saveItem({name:$('#k312-name').value,qty:$('#k312-qty').value,unit:$('#k312-unit').value,alertQty:$('#k312-alert').value},id)){closeModal();renderV20();toast(`${label()} zaktualizowany ✓`)}};
  }
  async function removeItem(id){if(!confirm('Usunąć ten składnik z '+label().toLowerCase()+'?'))return;await del('inventoryItems',id);state.inventory=await getAll('inventoryItems');renderV20();}

  const oldViewStart=window.viewStart||viewStart;
  viewStart=function(){
    let html=oldViewStart();
    const card=`<button class="v3-menu-card k312-start-card" data-action="inventory"><span class="v3-menu-icon">${icon()}</span><b>${label()}</b><small>Stan składników i automatyczne zużycie</small></button>`;
    if(html.includes('<button class="v3-menu-card v3-menu-settings"')) html=html.replace('<button class="v3-menu-card v3-menu-settings"',`${card}<button class="v3-menu-card v3-menu-settings"`); else html+=card;
    return html;
  };

  const oldRender=renderV20;
  renderV20=function(){ oldRender(); };

  const oldBind=bindV20;
  bindV20=function(){
    oldBind();
    if(state.route==='inventory'){
      $('#k312-add')?.addEventListener('click',()=>editItem(null));
      $('#k312-search')?.addEventListener('input',e=>{state.inventoryQuery=e.target.value;const q=String(e.target.value||'').trim().toLocaleLowerCase('pl');const rows=[...document.querySelectorAll('.k312-list .k312-row')];let shown=0;rows.forEach(row=>{const ok=!q||row.textContent.toLocaleLowerCase('pl').includes(q);row.hidden=!ok;if(ok)shown++});const empty=document.querySelector('.k312-list .k312-empty');if(empty)empty.hidden=shown!==0;});
      $$('#main [data-k312-edit]').forEach(b=>b.addEventListener('click',()=>editItem(b.dataset.k312Edit)));
      $$('#main [data-k312-del]').forEach(b=>b.addEventListener('click',()=>removeItem(b.dataset.k312Del)));
    }
    $$('#main [data-action="inventory"]').forEach(b=>b.addEventListener('click',()=>nav('inventory')));
  };

  if(!window.__k312InventoryCapture){
    window.__k312InventoryCapture=true;
    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('#cook-done');if(!btn)return;
      setTimeout(async()=>{
        try{
          const r=state.recipes.find(x=>x.id===state.selectedId);if(!r)return;
          const st=await getOne('cookState',r.id);if(!st||!st.completed||st.inventoryDecision)return;
          const items=await getAll('inventoryItems');
          const used=(r.sections||[]).flatMap(sec=>(sec.ingredients||[]).map(ing=>({name:ing.name,qty:+ing.qty||0,unit:ing.unit||'g'}))).filter(x=>x.name&&x.qty>0);
          const available=used.map(x=>{const item=items.find(i=>i.key===invKey(x.name)&&compatible(i.unit,x.unit));return item?{...x,available:item.qty,itemUnit:item.unit}:null}).filter(Boolean);
          const summary=used.length?used.map(x=>`<div class="k313-consume-line"><span>${escapeHtml(x.name)}</span><b>${fmt(x.qty)} ${escapeHtml(x.unit)}</b></div>`).join(''):'<p class="muted">Ta receptura nie ma zapisanych ilości składników.</p>';
          openModal(`<div class="k313-consume"><div class="v3-kicker">GOTOWANIE ZAKOŃCZONE</div><h2>Zabrać składniki z ${label().toLowerCase()}?</h2><p>Odjęcie jest jednorazowe i nie wykona się ponownie dla tego gotowania.</p><div class="k313-consume-list">${summary}</div><div class="row k313-consume-actions"><button class="btn" id="k313-skip">Nie, zostaw</button><button class="btn primary" id="k313-take">Tak, odejmij</button></div></div>`);
          $('#k313-skip').onclick=async()=>{st.inventoryDecision='skipped';st.inventoryDecisionAt=now();await put('cookState',st);state.cook[r.id]=st;closeModal();toast('Składniki pozostawione bez zmian')};
          $('#k313-take').onclick=async()=>{const result=await window.k312ConsumeRecipe(r.id);st.inventoryDecision='consumed';st.inventoryConsumed=true;st.inventoryConsumedAt=now();st.inventoryConsumption={changed:result.changed,missing:result.missing};await put('cookState',st);state.cook[r.id]=st;state.inventory=await getAll('inventoryItems');closeModal();renderV20();toast(result.missing.length?`${label()}: odjęto dostępne · brak: ${result.missing.slice(0,2).join(', ')}`:`${label()}: składniki odjęte ✓`);};
        }catch(err){console.error('K312 inventory consume failed',err)}
      },120);
    },false);
  }

  // Load inventory once after the existing boot process, then refresh Start if needed.
  setTimeout(async()=>{try{state.inventory=await getAll('inventoryItems');if(state.route==='start'||state.route==='inventory')renderV20()}catch(e){console.error('K312 inventory load failed',e)}},1700);
})();

/* K312 navigation/back title patch. */
(function(){
  const oldUpdateTopbar=updateTopbar;
  updateTopbar=function(){oldUpdateTopbar();const el=$('#topbarTitle');if(el&&state.route==='inventory')el.textContent=state.settings.profile==='amateur'?'Lodówka':'Magazyn';};
  const oldBackRoute=backRoute;
  backRoute=function(){if(state.route==='inventory'){state.route='start';applyTheme();renderV20();requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}));return;}oldBackRoute();};
})();

/* K312 visual layer. */
(function(){const s=document.createElement('style');s.id='k312-style';s.textContent=`
.k312-inventory{max-width:920px;margin:0 auto}.k312-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.k312-head h1{margin:4px 0 8px;font-size:34px}.k312-head p{margin:0;color:var(--muted);line-height:1.5;max-width:640px}.k312-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.k312-summary>div{padding:16px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--surface) 84%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.k312-summary b{display:block;font-size:25px}.k312-summary span{color:var(--muted);font-size:12px;font-weight:700}.k312-search{position:relative;margin-bottom:12px}.k312-search span{position:absolute;left:14px;top:50%;transform:translateY(-50%);z-index:2}.k312-search input{width:100%;padding-left:40px;min-height:52px;border-radius:17px}.k312-list{display:grid;gap:9px}.k312-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--surface) 86%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.k312-row-main{display:flex;align-items:center;gap:11px;min-width:0}.k312-row-main>div{min-width:0}.k312-row-main b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.k312-row-main small{display:block;color:var(--muted);margin-top:3px}.k312-row-actions{display:flex;gap:6px;flex:0 0 auto}.k312-row-actions button{width:40px;height:40px;border:1px solid var(--line);border-radius:13px;background:var(--surface2);font-size:17px}.k312-empty{text-align:center;padding:42px 20px;border:1px dashed var(--line);border-radius:24px;color:var(--muted)}.k312-empty>span{font-size:40px;display:block;margin-bottom:8px}.k312-empty b{display:block;color:var(--text);font-size:18px}.k312-empty p{margin:6px 0 0}.k312-start-card{grid-column:1/-1!important}.k312-alert{margin:0 0 12px;padding:14px 16px;border:1px solid color-mix(in srgb,#f59e0b 45%,var(--line));border-radius:20px;background:color-mix(in srgb,#f59e0b 10%,var(--surface));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.k312-alert-title{font-weight:800;margin-bottom:8px}.k312-alert-list{display:flex;flex-wrap:wrap;gap:7px}.k312-alert-list span{padding:7px 10px;border-radius:999px;background:color-mix(in srgb,#f59e0b 14%,var(--surface2));font-size:12px;font-weight:700}.k312-row.is-low{border-color:color-mix(in srgb,#f59e0b 55%,var(--line))}.k313-consume{max-width:520px}.k313-consume h2{margin:6px 0 8px}.k313-consume p{color:var(--muted);line-height:1.45}.k313-consume-list{display:grid;gap:6px;margin:14px 0;max-height:260px;overflow:auto}.k313-consume-line{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface2)}.k313-consume-actions{justify-content:flex-end;margin-top:14px}@media(max-width:430px){.k312-head{flex-direction:column}.k312-head .v3-add-btn{align-self:stretch;justify-content:center}.k312-head h1{font-size:32px}}
body.amateur .k312-row,body.amateur .k312-summary>div{border-radius:24px}
`;
document.head.appendChild(s)})();


/* ============================================================
   Kucharzyna 3.14 — BRAKUJE DO PRZEPISU
   Non-destructive stock check shown on recipe detail.
   ============================================================ */
(function k314RecipeStockCheck(){
  function norm314(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
  const aliases314={
    'maka pszenna':'maka pszenna','maka':'maka','maka typ 450':'maka pszenna','maka typ 500':'maka pszenna','maka typ 550':'maka pszenna',
    'bulka pszenna':'bulka pszenna','bulka tarta':'bulka tarta','chleb':'chleb','woda':'woda','sol':'sol','cukier':'cukier','drozdze':'drozdze',
    'oliwa':'oliwa','olej':'olej','maslo':'maslo','mleko':'mleko','smietana':'smietana','jajko':'jajko','jajka':'jajko','zoltka':'jajko',
    'pecorino romano':'pecorino romano','parmezan':'parmezan','ser':'ser','twarog':'twarog','czosnek':'czosnek','cebula':'cebula',
    'marchew':'marchew','pietruszka':'pietruszka','koperek':'koperek','bazylia':'bazylia','pomidor':'pomidor','pomidory':'pomidor','passata':'passata',
    'papryka':'papryka','chili':'chili','ogorek':'ogorek','cukinia':'cukinia','ziemniak':'ziemniak','ziemniaki':'ziemniak',
    'pieczarki':'pieczarki','grzyby':'grzyby','kapusta':'kapusta','brokuly':'brokuly','kalafior':'kalafior','burak':'burak',
    'wolowina':'wolowina','wieprzowina':'wieprzowina','schab':'schab','mieso mielone':'mieso mielone','kurczak':'kurczak','kaczka':'kaczka',
    'boczek':'boczek','szynka':'szynka','kielbasa':'kielbasa','guanciale':'guanciale','ryba':'ryba','losos':'losos','tunczyk':'tunczyk',
    'krewetki':'krewetki','mule':'mule','makaron':'makaron','spaghetti':'spaghetti','ryz':'ryz','kasza':'kasza','fasola':'fasola',
    'ciecierzyca':'ciecierzyca','soczewica':'soczewica','orzechy':'orzechy','migdal':'migdal','miod':'miod','cytryna':'cytryna',
    'limonka':'limonka','jablko':'jablko','jablka':'jablko','gruszka':'gruszka','awokado':'awokado','ananas':'ananas','kakao':'kakao',
    'czekolada':'czekolada','tofu':'tofu','kukurydza':'kukurydza','dynia':'dynia','bulion':'bulion','ocet':'ocet','sos sojowy':'sos sojowy',
    'musztarda':'musztarda','koncentrat pomidorowy':'koncentrat pomidorowy','pieprz':'pieprz','papryka slodka':'papryka slodka'
  };
  function key314(name){const n=norm314(name);if(aliases314[n])return aliases314[n];const keys=Object.keys(aliases314).sort((a,b)=>b.length-a.length);const hit=keys.find(k=>n===k||n.startsWith(k+' '));return hit?aliases314[hit]:n}
  const ua={kg:'kg',g:'g',gram:'g',gramy:'g',ml:'ml',l:'l',litry:'l','szt':'szt.','szt.':'szt.',sztuk:'szt.',porcja:'porcja'};
  function unit314(u){const x=String(u||'g').trim().toLowerCase();return ua[x]||x}
  function factor314(u){u=unit314(u);return u==='kg'||u==='l'?1000:1}
  function compatible314(a,b){a=unit314(a);b=unit314(b);return (['g','kg'].includes(a)&&['g','kg'].includes(b))||(['ml','l'].includes(a)&&['ml','l'].includes(b))||a===b}
  function convert314(q,from,to){from=unit314(from);to=unit314(to);if(!compatible314(from,to))return null;return q*factor314(from)/factor314(to)}
  function check(r){
    const stock=state.inventory||[];const rows=[];const seen={};
    for(const sec of r?.sections||[]) for(const ing of sec.ingredients||[]){
      const need=Number(ing.qty)||0;if(!ing.name||need<=0)continue;
      const key=key314(ing.name);const k=key+'|'+unit314(ing.unit);
      if(seen[k]){seen[k].need+=need;continue}
      const candidates=stock.filter(x=>key314(x.name)===key&&compatible314(x.unit,ing.unit));
      let available=0;
      for(const x of candidates){const cv=convert314(Number(x.qty)||0,x.unit,ing.unit);if(cv!=null)available+=cv}
      const row={name:ing.name,need,unit:unit314(ing.unit),available};rows.push(row);seen[k]=row;
    }
    return rows.filter(x=>x.available+1e-9<x.need);
  }
  function mount(){
    if(state.route!=='recipe')return;
    const host=document.querySelector('.k32-actions');if(!host)return;
    host.querySelector('.k314-stock-check')?.remove();
    const r=state.recipes.find(x=>x.id===state.selectedId);if(!r)return;
    const missing=check(r);
    const box=document.createElement('section');box.className='k314-stock-check '+(missing.length?'has-missing':'all-good');
    if(!missing.length){
      box.innerHTML='<div class="k314-stock-icon">✓</div><div><b>Masz wszystko do tego przepisu</b><span>Stan magazynu / lodówki wystarcza na podaną ilość.</span></div>';
    }else{
      box.innerHTML='<div class="k314-stock-icon">!</div><div><b>Brakuje do przepisu</b><span>'+missing.map(x=>escapeHtml(x.name)+' <strong>'+fmt(x.need-x.available)+' '+escapeHtml(x.unit)+'</strong>').join(' · ')+'</span></div><button type="button" class="k314-stock-link" data-action="inventory">'+(state.settings.profile==='amateur'?'Lodówka':'Magazyn')+'</button>';
    }
    host.insertAdjacentElement('afterend',box);
    box.querySelector('[data-action="inventory"]')?.addEventListener('click',()=>nav('inventory'));
  }
  const oldRender314=renderV20;
  renderV20=function(){oldRender314();requestAnimationFrame(()=>requestAnimationFrame(mount))};
  window.k314MountRecipeStock=mount;
  const st=document.createElement('style');st.id='k314-stock-style';st.textContent=`
.k314-stock-check{display:flex;align-items:center;gap:12px;margin:12px 0 18px;padding:14px 16px;border-radius:20px;border:1px solid var(--line);background:color-mix(in srgb,var(--surface) 78%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 8px 30px rgba(0,0,0,.06)}
.k314-stock-check .k314-stock-icon{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;font-weight:900;flex:0 0 auto;background:color-mix(in srgb,#ef4444 16%,var(--surface2));color:#dc2626}
.k314-stock-check.all-good .k314-stock-icon{background:color-mix(in srgb,#22c55e 16%,var(--surface2));color:#16a34a}
.k314-stock-check>div:nth-child(2){min-width:0;flex:1}.k314-stock-check b{display:block;font-size:14px}.k314-stock-check span{display:block;color:var(--muted);font-size:12px;line-height:1.45;margin-top:3px}.k314-stock-check span strong{color:var(--text)}
.k314-stock-link{border:1px solid var(--line);background:var(--surface2);border-radius:13px;padding:9px 11px;font-weight:800;white-space:nowrap;color:var(--text)}
@media(max-width:430px){.k314-stock-check{align-items:flex-start}.k314-stock-link{align-self:center}.k314-stock-check span{font-size:11px}}
`;
  document.head.appendChild(st);
})();

/* Service-worker cache version for inventory schema/UI. */
