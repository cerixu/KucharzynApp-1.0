const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():"id-"+Date.now()+"-"+Math.random().toString(16).slice(2);
const now=()=>new Date().toISOString();
let state={route:"start",recipes:[],categories:[],shopping:[],settings:{theme:"dark",profile:"pro"},history:[],cook:{},pizzaProfiles:[],activePizzaProfileId:null,selectedCat:"Wszystkie",query:"",sort:"recent",googleQuery:""};
const baseCats=["Pizza","Pasta","Sosy","Mięso","Ryby","Owoce morza","Warzywa","Desery","Pieczywo","Zupy","Sałatki","Cocktaile","Prep","Sosy bazowe","Inne"];

const seed=[
{name:"Pizza Napoletana",category:"Pizza",description:"Klasyczne ciasto pizza; dane przykładowe do własnej edycji.",yield:10,yieldUnit:"szt.",prep:20,cook:2,ferment:24,temp:450,tags:["pizza","ciasto"],traditional:true,flag:"🇮🇹",servings:10,ingredients:[["Mąka",1000,"g",100],["Woda",650,"g",65],["Sól",30,"g",3],["Drożdże",2,"g",0.2]],steps:["Wymieszaj mąkę z większością wody.","Dodaj sól i resztę wody, następnie drożdże.","Wyrób do uzyskania gładkiego ciasta.","Fermentuj według własnego procesu i podziel na kulki.","Wypiekaj w bardzo gorącym piecu."],notes:"Przykładowa receptura — dostosuj do własnej mąki i procesu.",source:"Tradycyjna receptura / przykład",sourceUrl:""},
{name:"Carbonara",category:"Pasta",description:"Klasyczna pasta z guanciale, żółtek, pecorino i pieprzu.",yield:4,yieldUnit:"porcja",prep:10,cook:12,ferment:0,temp:0,tags:["pasta","rzym"],traditional:true,flag:"🇮🇹",servings:4,ingredients:[["Spaghetti",400,"g",""],["Guanciale",180,"g",""],["Żółtka",6,"szt.",""],["Pecorino Romano",120,"g",""],["Pieprz czarny",5,"g",""]],steps:["Podsmaż guanciale i zachowaj tłuszcz.","Utrzyj żółtka z pecorino i dużą ilością pieprzu.","Ugotuj makaron al dente, zachowaj wodę.","Połącz makaron poza ogniem, regulując wodą z gotowania.","Dodaj guanciale i podawaj natychmiast."],notes:"Pieprz dopiero na końcu, jeśli taki jest Twój proces.",source:"Tradycyjna receptura / przykład",sourceUrl:""},
{name:"Sos pomidorowy",category:"Sosy bazowe",description:"Prosty sos z pomidorów San Marzano.",yield:2500,yieldUnit:"g",prep:10,cook:30,ferment:0,temp:0,tags:["sos","pomidor"],traditional:true,flag:"🇮🇹",servings:10,ingredients:[["Pomidory San Marzano",2500,"g",""],["Sól",25,"g",""],["Oliwa",40,"ml",""],["Bazylia",20,"g",""]],steps:["Rozgrzej oliwę.","Dodaj pomidory i sól.","Gotuj spokojnie do pożądanej konsystencji.","Dodaj bazylię pod koniec.","Ostudź lub użyj od razu."],notes:"Dane przykładowe; dopasuj sól i redukcję do produktu.",source:"Tradycyjna receptura / przykład",sourceUrl:""}
];

// Lokalne, wygenerowane grafiki. Zero zależności od zewnętrznych serwisów zdjęciowych.
const RECIPE_IMAGES={
  "Carbonara":"./photo-carbonara.jpg",
  "Spaghetti alla carbonara":"./photo-carbonara.jpg",
  "Pizza Napoletana":"./photo-pizza.jpg",
  "Sos pomidorowy":"./photo-tomato.jpg"
};
const DEFAULT_RECIPE_IMAGE="./photo-generic.jpg";
function recipeImage(r){
  const local=RECIPE_IMAGES[r?.name];
  if(local) return local;
  if(typeof r?.image==='string' && /^(data:|blob:)/.test(r.image)) return r.image;
  const c=String(r?.category||'').toLowerCase();
  if(c.includes('pizza')||c.includes('pieczy')) return './photo-pizza.jpg';
  if(c.includes('pasta')||c.includes('makaron')) return './photo-carbonara.jpg';
  if(c.includes('sos')||c.includes('zup')) return './photo-tomato.jpg';
  return DEFAULT_RECIPE_IMAGE;
}
function ingredientGroupsSafe(r){return (r?.sections||[]).flatMap(s=>s.ingredients||[])}
function recipeDescription(r){const d=String(r?.description||'').trim();if(d.length>=105&&!/^Klasyczne danie kuchni/i.test(d))return d;const names=ingredientGroupsSafe(r).slice(0,5).map(i=>i.name).filter(Boolean);const ing=names.length?names.join(', '):'starannie dobrane składniki';const cat=String(r?.category||'').toLowerCase();const process=cat.includes('pasta')||cat.includes('makaron')?'Kluczowe jest zachowanie właściwej konsystencji i wykończenie dania poza zbyt wysoką temperaturą.':cat.includes('pizza')||cat.includes('pieczywo')?'Najwięcej zależy tu od jakości mąki, prowadzenia fermentacji oraz kontroli temperatury podczas wypieku.':cat.includes('sos')?'Liczy się spokojna redukcja, koncentracja smaku i końcowa korekta soli, kwasowości oraz tłuszczu.':cat.includes('deser')?'Warto pilnować temperatury i momentu zakończenia obróbki, ponieważ konsystencja zmienia się także podczas studzenia.':'Receptura jest praktyczną bazą do pracy w kuchni; czasy i intensywność obróbki warto dopasować do konkretnego produktu.';return `${r?.name||'Danie'} to ${r?.traditional?'tradycyjna receptura oparta na charakterystycznych składnikach i technice przygotowania.':'praktyczna receptura do przygotowania w domu lub profesjonalnej kuchni.'} W tej wersji wykorzystujemy ${ing}. ${process}`.replace(/  +/g,' ').trim()}
function photoMarkup(r,cls='global-photo'){const src=recipeImage(r);return `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(r?.name||'Potrawa')}" loading="eager" onerror="this.onerror=null;this.src='./photo-generic.jpg'">` }
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
  if(src) return `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(RECIPE_IMAGES[r.name]||'')}';this.classList.add('image-failed')">`;
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
 state.recipes=await getAll("recipes"); state.categories=await getAll("categories"); state.shopping=await getAll("shoppingItems"); state.history=await getAll("history"); state.pizzaProfiles=await getAll("pizzaProfiles");
 const sets=await getAll("settings"); state.settings=sets[0]||state.settings;
 state.cook=Object.fromEntries((await getAll("cookState")).map(x=>[x.id,x]));
 if(!state.categories.length){for(const name of baseCats)await put("categories",{id:uid(),name});state.categories=await getAll("categories")}
 if(!state.recipes.length){for(const x of seed){const r=makeRecipe(x);await put("recipes",r)}state.recipes=await getAll("recipes")}
 applyTheme(); setupSW();
}
function makeRecipe(x){const r={id:uid(),createdAt:now(),updatedAt:now(),favorite:false,lastUsedAt:null,sections:[{id:uid(),name:"Główna",ingredients:x.ingredients.map(a=>({id:uid(),name:a[0],qty:a[1],unit:a[2],percent:a[3]??"",price:"",packQty:"",packUnit:a[2]}))}],steps:x.steps.map((text,i)=>({id:uid(),text})),...x};delete r.ingredients;return r}
function resolvedTheme(){const t=state.settings.theme;return t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t}
function applyTheme(){const root=document.documentElement;const t=resolvedTheme();root.classList.toggle("dark",t==="dark");root.classList.toggle("light",t==="light");root.dataset.theme=t;root.dataset.themePreference=state.settings.theme;document.body.classList.toggle("amateur",state.settings.profile==="amateur");document.body.dataset.profile=state.settings.profile;document.querySelector("#themeBtn")?.setAttribute("aria-label",`Motyw: ${state.settings.theme}`)}
function setupSW(){if(!("serviceWorker" in navigator))return;navigator.serviceWorker.register("./service-worker.js").then(reg=>{reg.addEventListener("updatefound",()=>{const w=reg.installing;if(w)w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)toast("Nowa wersja Kucharzyny jest dostępna — Odśwież",true)})})}).catch(()=>{})}
function toast(msg,action=false){const t=$("#toast");t.textContent=action?msg+"  → Odśwież":msg;t.classList.add("show");if(action)t.onclick=()=>location.reload();setTimeout(()=>t.classList.remove("show"),3500)}
function nav(route){state.route=route;render();$(".main-scroll").scrollTop=0}
function saveSetting(){put("settings",{id:"settings",...state.settings})}
function fmt(n){return Number.isInteger(Number(n))?String(n):Number(n).toFixed(2).replace(/\.?0+$/,"")}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function recipeCard(r){const src=recipeImage(r);return `<article class="card recipe-card" data-open="${r.id}"><div class="recipe-thumb">${src?`<img src="${escapeHtml(src)}" loading="lazy" alt="${escapeHtml(r.name)}" onerror="this.remove();this.parentElement.classList.add('image-missing');if(!this.parentElement.querySelector('.img-fallback'))this.parentElement.insertAdjacentHTML('beforeend','<span class=\"img-fallback\" aria-hidden=\"true\">🍽️</span>')">`:'<span class="img-fallback" aria-hidden="true">🍽️</span>'}</div><div class="grow"><div class="row between"><h3>${escapeHtml(r.name)} ${r.traditional?`<span class="star">★</span>`:""} ${r.flag||""}</h3><button class="icon-btn small fav" data-fav="${r.id}" aria-label="Ulubione">${r.favorite?"★":"☆"}</button></div><div class="recipe-meta">${escapeHtml(r.category||"Inne")} · ${r.yield?fmt(r.yield)+" "+escapeHtml(r.yieldUnit||""):""} ${r.lastUsedAt?"· ostatnio używana":""}</div></div></article>`}
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
 if($("#theme")){$("#theme").value=state.settings.theme;$("#theme").onchange=()=>{state.settings.theme=$("#theme").value;saveSetting();applyTheme()}};
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
async function exportBackup(){const data={version:1,exportedAt:now(),recipes:await getAll("recipes"),categories:await getAll("categories"),shoppingItems:await getAll("shoppingItems"),settings:await getAll("settings"),history:await getAll("history"),cookState:await getAll("cookState")};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kucharzyna-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(a.href);toast("Backup wyeksportowany")}
async function importBackup(file){if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.recipes))throw Error("Nieprawidłowy backup");openModal(`<h2>Import backup</h2><p>Co zrobić z obecnymi danymi?</p><div class="row"><button class="btn danger" id="replace-backup">Zastąp</button><button class="btn primary" id="merge-backup">Połącz</button><button class="btn" data-close>Anuluj</button></div>`);$("#replace-backup").onclick=()=>applyBackup(data,true);$("#merge-backup").onclick=()=>applyBackup(data,false)}catch(e){toast("Nieprawidłowy plik backupu")}}
async function applyBackup(data,replace){if(replace)await clearAll();for(const key of ["recipes","categories","shoppingItems","settings","history","cookState"])for(const x of (data[key]||[]))await put(key,x);state.recipes=await getAll("recipes");state.categories=await getAll("categories");state.shopping=await getAll("shoppingItems");state.settings=(await getAll("settings"))[0]||state.settings;closeModal();applyTheme();render();toast("Backup zaimportowany")}
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
 const media=img?`<img loading="lazy" src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" onerror="this.closest('.recipe-thumb').innerHTML='<div class=&quot;food-placeholder&quot;>${r.flag||"🍽️"}</div>'">`:`<div class="food-placeholder">${r.flag||"🍽️"}</div>`;
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
 ${img?`<div class="recipe-cover"><img src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" loading="eager" onerror="this.closest('.recipe-cover').classList.add('image-error');this.style.display='none'"><div class="image-error-fallback">🍽️</div>${r.imageCredit?`<small>${escapeHtml(r.imageCredit)}</small>`:''}</div>`:''}
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
  "Pizza Napoletana":"./photo-pizza.jpg",
  "Carbonara":"./photo-carbonara.jpg",
  "Sos pomidorowy":"./photo-tomato.jpg",
  "Spaghetti alla carbonara":"./photo-spaghetti-alla-carbonara.jpg",
  "Cacio e pepe":"./photo-cacio-e-pepe.jpg",
  "Pasta alla puttanesca":"./photo-pasta-alla-puttanesca.jpg",
  "Pasta al pomodoro":"./photo-pasta-al-pomodoro.jpg",
  "Risotto alla Milanese":"./photo-risotto-alla-milanese.jpg",
  "Panzanella":"./photo-panzanella.jpg",
  "Arancini":"./photo-arancini.jpg",
  "Pasta e fagioli":"./photo-pasta-e-fagioli.jpg",
  "Pho Ga":"./photo-pho-ga.jpg",
  "Bun Cha":"./photo-bun-cha.jpg",
  "Banh Mi":"./photo-banh-mi.jpg",
  "Pad Thai":"./photo-pad-thai.jpg",
  "Tom Kha Gai":"./photo-tom-kha-gai.jpg",
  "Massaman Curry":"./photo-massaman-curry.jpg",
  "Khao Pad":"./photo-khao-pad.jpg",
  "Miso Shiru":"./photo-miso-shiru.jpg",
  "Karaage":"./photo-karaage.jpg",
  "Okonomiyaki":"./photo-okonomiyaki.jpg",
  "Sukiyaki":"./photo-sukiyaki.jpg",
  "Ramen Shoyu":"./photo-ramen-shoyu.jpg",
  "Mapo Tofu":"./photo-mapo-tofu.jpg",
  "Kung Pao Chicken":"./photo-kung-pao-chicken.jpg",
  "Jiaozi":"./photo-jiaozi.jpg",
  "Char Siu":"./photo-char-siu.jpg",
  "Butter Chicken":"./photo-butter-chicken.jpg",
  "Palak Paneer":"./photo-palak-paneer.jpg",
  "Dal Tadka":"./photo-dal-tadka.jpg",
  "Naan":"./photo-naan.jpg",
  "Moussaka":"./photo-moussaka.jpg",
  "Tzatziki":"./photo-tzatziki.jpg",
  "Spanakopita":"./photo-spanakopita.jpg",
  "Baklava":"./photo-baklava.jpg",
  "Menemen":"./photo-menemen.jpg",
  "Adana Kebab":"./photo-adana-kebab.jpg",
  "Ratatouille":"./photo-ratatouille.jpg",
  "Coq au vin":"./photo-coq-au-vin.jpg",
  "Quiche Lorraine":"./photo-quiche-lorraine.jpg",
  "Paella Valenciana":"./photo-paella-valenciana.jpg",
  "Tortilla Española":"./photo-tortilla-espa-ola.jpg",
  "Gazpacho":"./photo-gazpacho.jpg",
  "Pulpo a la Gallega":"./photo-pulpo-a-la-gallega.jpg",
  "Goulash":"./photo-goulash.jpg",
  "Pierogi ruskie":"./photo-pierogi-ruskie.jpg",
  "Żurek":"./photo-zurek.jpg",
  "Bigos":"./photo-bigos.jpg",
  "Ceviche":"./photo-ceviche.jpg",
  "Lomo Saltado":"./photo-lomo-saltado.jpg",
  "Feijoada":"./photo-feijoada.jpg",
  "Moqueca":"./photo-moqueca.jpg",
  "Harira":"./photo-harira.jpg",
  "Tagine z kurczakiem i cytryną":"./photo-tagine-z-kurczakiem-i-cytryna.jpg",
  "Hummus":"./photo-hummus.jpg",
  "Falafel":"./photo-falafel.jpg",
  "Kimchi Jjigae":"./photo-kimchi-jjigae.jpg",
  "Bulgogi":"./photo-bulgogi.jpg",
  "Bibimbap":"./photo-bibimbap.jpg",
  "Tacos al Pastor":"./photo-tacos-al-pastor.jpg",
  "Mole Poblano":"./photo-mole-poblano.jpg",
  "Guacamole":"./photo-guacamole.jpg",
  "Fish and Chips":"./photo-fish-and-chips.jpg",
  "Shepherd's Pie":"./photo-shepherd-s-pie.jpg",
  "Crème brûlée":"./photo-cr-me-br-l-e.jpg",
  "Tiramisu":"./photo-tiramisu.jpg"
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
const _k32RecipeViewFinal=recipeViewV20;
recipeViewV20=function(id){
  const r=state.recipes.find(x=>x.id===id);
  const html=_k32RecipeViewFinal(id);
  if(!r)return html;
  return html.replace(/<div class="k32-info"><span>🔥 Temperatura<\/span><b>.*?<\/b><\/div>/,'<div class="k32-info"><span>🍽️ Sposób podania</span><b>'+escapeHtml(k32ServingTypeFor(r))+'</b></div>');
};
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
function amateurCard(r){const img=recipeImage(r);return `<article class="am-card" data-open="${r.id}"><div class="am-card-img">${img?`<img src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" loading="lazy">`:'🍽️'}</div><div class="am-card-body"><div class="am-card-name">${escapeHtml(r.name)}</div><div class="am-card-meta">${escapeHtml(r.category||'Przepis')} · ${r.yield?fmt(r.yield)+' '+escapeHtml(r.yieldUnit||''):''}</div></div></article>`}

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
    if(RECIPE_IMAGES[r.name]){r.image=RECIPE_IMAGES[r.name];r.imageUrl='';r.imageSource='local';r.imageCredit='Grafika wygenerowana dla Kucharzyny';}
    else if(typeof r.image==='string' && /^https?:/i.test(r.image)){r.image=DEFAULT_RECIPE_IMAGE;r.imageUrl='';r.imageSource='local';r.imageCredit='Grafika wygenerowana dla Kucharzyny';}
    else if(!r.image){r.image=DEFAULT_RECIPE_IMAGE;r.imageSource='local';r.imageCredit='Grafika wygenerowana dla Kucharzyny';}
    if(r.traditional && (!r.sourceUrl||!r.license)){r.source='Wikibooks Cookbook';r.sourceUrl='https://en.wikibooks.org/wiki/Cookbook:Recipes';r.license='CC BY-SA 4.0 — opracowanie Kucharzyny';}
    await put('recipes',r);
  }
  state.recipes=await getAll('recipes');
}

// Run repairs after the original boot has finished.
setTimeout(async()=>{try{await repairAllRecipes();await ensureRecipeImages();enrichRecipeDescriptions();renderV20();}catch(e){}},700);

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
  ['Włochy','Klasyka makaronu, pizzy i risotto','🇮🇹','./photo-carbonara.jpg'],
  ['Polska','Domowe smaki i tradycyjne dania','🇵🇱','./photo-tomato.jpg'],
  ['Azjatycka','Wok, makarony i intensywne aromaty','🌏','./photo-carbonara.jpg'],
  ['Meksykańska','Tacos, salsa i kuchnia uliczna','🇲🇽','./photo-pizza.jpg'],
  ['Francuska','Technika, sosy i klasyka','🇫🇷','./photo-tomato.jpg'],
  ['Hiszpańska','Tapas, ryż i wyraziste smaki','🇪🇸','./photo-pizza.jpg'],
  ['Bliski Wschód','Przyprawy, grill i mezze','🌙','./photo-tomato.jpg'],
  ['Amerykańska','Comfort food i kuchnia nowoczesna','🇺🇸','./photo-pizza.jpg']
 ];
 const q=String(state.traditionalQueryV14||'').toLowerCase();
 const shown=cuisines.filter(c=>!q||(c[0]+' '+c[1]).toLowerCase().includes(q));
 const selected=state.tradCatV14&&state.tradCatV14!=="Wszystkie"?state.recipes.filter(r=>r.traditional&&((r.cuisine||'').toLowerCase()===String(state.tradCatV14).toLowerCase()||(r.cuisine||'').toLowerCase().includes(String(state.tradCatV14).toLowerCase().replace('azjatycka','azja')))):[];
 return `<div class="v3-world"><div class="v3-page-head"><div><span class="v3-kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Odkrywaj klasyczne kierunki kulinarne i przechodź prosto do pasujących receptur.</p></div></div><div class="v3-search v3-world-search"><span>⌕</span><input id="traditionalSearchV14" placeholder="Szukaj kuchni lub regionu…" value="${escapeHtml(state.traditionalQueryV14||'')}"></div><div class="v3-world-grid">${shown.map(c=>`<button class="v3-world-card" data-world-cuisine="${escapeHtml(c[0])}"><img src="${c[3]}" alt="${escapeHtml(c[0])}" onerror="this.src='./photo-generic.jpg'"><div class="v3-world-copy"><b>${c[2]} ${escapeHtml(c[0])}</b><span>${escapeHtml(c[1])}</span></div></button>`).join('')}</div>${selected.length?`<section class="v3-world-results"><div class="v3-section-head"><div><span class="v3-kicker">${escapeHtml(state.tradCatV14)}</span><h2>Receptury</h2></div><button class="v3-link" data-world-clear>Wszystkie</button></div><div class="v3-recipe-list">${selected.map(r=>v3RecipeCard(r,true)).join('')}</div></section>`:`<section class="v3-world-feature"><span>🍽️</span><div><b>Masz ochotę na konkretną kuchnię?</b><p>Wybierz kraj lub region powyżej. Kucharzyna pokaże zapisane klasyczne receptury z tego kierunku.</p></div></section>`}</div>`;
}

function viewCalculatorsV20(){
 const p=state.pizzaV20||{mode:'dough',flour:1000,balls:10,ball:250,hyd:65,salt:3,oil:0,yeast:.2,temp:22,time:24,poolish:0,prefermentHyd:100};
 const f0=+p.flour||0,h=+p.hyd||0,s=+p.salt||0,o=+p.oil||0,y=+p.yeast||0;let f=f0;if(p.mode==='dough'){const total=(+p.balls||0)*(+p.ball||0);f=total/(1+h/100+s/100+o/100+y/100)}const water=f*h/100,salt=f*s/100,oil=f*o/100,yeast=f*y/100,total=f+water+salt+oil+yeast,balls=p.mode==='dough'?(+p.balls||0):(+p.ball>0?Math.floor(total/+p.ball):0);
 return `<div class="pro-calc"><div class="screen-back"><button class="btn ghost" data-back="start">‹ Powrót</button></div><div class="kicker">PRO KALKULATOR</div><h1>🍕 Pizza Lab</h1><p class="muted">Pełna receptura ciasta, parametry procesu i preferment.</p><div class="segmented"><button class="seg ${p.mode==='dough'?'active':''}" id="p2-dough">Kulki / masa</button><button class="seg ${p.mode==='flour'?'active':''}" id="p2-flour">Mam mąkę</button></div><section class="calc-card"><div class="calc-input-grid">${p.mode==='flour'?`<label>Mąka <input id="p2-flour-val" type="number" inputmode="decimal" value="${p.flour}"> g</label><label>Masa kulki <input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"> g</label>`:`<label>Liczba kulek <input id="p2-balls" type="number" inputmode="decimal" value="${p.balls}"></label><label>Masa kulki <input id="p2-ball" type="number" inputmode="decimal" value="${p.ball}"> g</label>`}<label>Hydracja <input id="p2-hyd" type="number" step="0.1" value="${p.hyd}"> %</label><label>Sól <input id="p2-salt" type="number" step="0.1" value="${p.salt}"> %</label><label>Oliwa <input id="p2-oil" type="number" step="0.1" value="${p.oil}"> %</label><label>Drożdże <input id="p2-yeast" type="number" step="0.01" value="${p.yeast}"> %</label><label>Temperatura <input id="p2-temp" type="number" value="${p.temp}"> °C</label><label>Fermentacja <input id="p2-time" type="number" value="${p.time}"> h</label></div></section><section id="p2-live-result" class="calc-result pro-result"><div><span>Mąka</span><b>${fmt(f)} g</b></div><div><span>Woda</span><b>${fmt(water)} g</b></div><div><span>Sól</span><b>${fmt(salt)} g</b></div><div><span>Oliwa</span><b>${fmt(oil)} g</b></div><div><span>Drożdże</span><b>${fmt(yeast)} g</b></div><div><span>Ciasto</span><b>${fmt(total)} g</b></div><div><span>Kulki</span><b>${fmt(balls)} × ${fmt(p.ball)} g${p.mode==='flour'?' · wyliczone':''}</b></div></section><section class="calc-card"><div class="section-title-row"><div><h2>Fermentacja PRO</h2><p class="muted">Profil procesu — możesz zapisać go jako recepturę.</p></div></div><div class="calc-input-grid"><label>Preferment <input id="p2-pref" type="number" step="1" value="${p.poolish}"> % mąki</label><label>Nawodnienie prefermentu <input id="p2-prefhyd" type="number" value="${p.prefermentHyd}"> %</label></div><div class="ferment-box"><b>${p.poolish>0?`Preferment: ${fmt(f*p.poolish/100)} g mąki · ${fmt(f*p.poolish/100*p.prefermentHyd/100)} g wody`:'Brak prefermentu'}</b><span>${fmt(p.time)} h · ${fmt(p.temp)}°C</span></div></section><div class="row"><button class="btn primary" id="p2-save">Zapisz profil</button><button class="btn" id="p2-reset">Reset</button></div></div>`;
}

function updateTopbar(){
 const titleMap={start:'Start',recipes:'Przepisy',traditional:'Kuchnie świata',calculators:'Kalkulatory',shopping:'Zakupy',settings:'Ustawienia',cook:'Gotuję',edit:'Edytuj recepturę',google:'Szukaj w Google',recipe:(state.recipes.find(r=>r.id===state.selectedId)?.name||'Receptura')};
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
  const search=$('#recipeSearch'); if(search){search.oninput=()=>{state.query=search.value;clearTimeout(window.__k3SearchTimer);window.__k3SearchTimer=setTimeout(()=>renderV20(),80)}}
  const sort=$('#sort'); if(sort){sort.onchange=()=>{state.sort=sort.value;renderV20()}}
  $$('#main [data-trad-v14]').forEach(b=>b.onclick=()=>{state.tradCatV14=b.dataset.tradV14;renderV20()});
  const ws=$('#traditionalSearchV14');if(ws){ws.oninput=()=>{state.traditionalQueryV14=ws.value;clearTimeout(window.__k3WorldTimer);window.__k3WorldTimer=setTimeout(()=>renderV20(),80)}}
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

function renderV20(){applyTheme();updateTopbar();$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));if(state.route==='recipe')$('#main').innerHTML=recipeViewV20(state.selectedId);else if(state.route==='google')$('#main').innerHTML=viewGoogleSearch();else if(state.route==='cook')$('#main').innerHTML=viewCookV20();else if(state.route==='shopping')$('#main').innerHTML=viewShoppingV20();else if(state.route==='calculators')$('#main').innerHTML=viewCalculatorsV20();else if(state.route==='edit')$('#main').innerHTML=editorV14(state.editId);else {const views={start:viewStart,recipes:viewRecipes,traditional:viewTraditionalV14,settings:viewSettings};$('#main').innerHTML=(views[state.route]||viewStart)()}bindV20()}
function backRoute(){const r=state.route;let target='start';if(r==='cook')target='recipe';else if(r==='edit'){target=state.editId?'recipe':'start';if(state.editId)state.selectedId=state.editId;}else if(r==='recipe')target=state.returnRoute||'recipes';else if(r==='google')target='recipes';else if(r==='recipes'||r==='traditional'||r==='calculators'||r==='shopping'||r==='settings')target='start';state.route=target;applyTheme();renderV20();requestAnimationFrame(()=>document.querySelector('.main-scroll')?.scrollTo({top:0,left:0,behavior:'auto'}))}
function recipeViewV20(id){const r=state.recipes.find(x=>x.id===id);if(!r)return viewRecipes();const ingredients=ingredientGroups(r),desc=recipeDescription(r);return `<div class="recipe20">${photoMarkup(r,'global-photo')}<div class="recipe20-title"><div class="kicker">${escapeHtml(r.category||'Inne')} ${r.flag||''} ${r.traditional?'<span class="star">★ TRADYCYJNA</span>':''}</div><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(desc)}</p></div><div class="recipe20-intro"><b>Na co zwrócić uwagę</b><div>${escapeHtml(r.notes||'Zanim zaczniesz, przygotuj wszystkie składniki, sprawdź temperaturę i zaplanuj kolejność pracy. Własne uwagi możesz później zapisać przy tej recepturze.')}</div></div><div class="recipe20-actions"><button class="btn primary" data-cook="${r.id}">▶ GOTUJĘ</button><button class="btn" data-edit="${r.id}">✎ EDYTUJ</button><button class="btn" data-shop-recipe="${r.id}">＋ ZAKUPY</button></div><section><div class="section-title-row"><h2>Składniki</h2><span class="kicker">${ingredients.length}</span></div>${(r.sections||[]).map(s=>`<div class="ingredient-section"><h3>${escapeHtml(s.name)}</h3>${(s.ingredients||[]).map(i=>`<button class="ingredient20" data-recipe-ing="${i.id}"><span>${escapeHtml(i.name)}</span><strong>${fmt(i.qty)} ${escapeHtml(i.unit)}</strong></button>`).join('')}</div>`).join('')}</section><section><div class="section-title-row"><h2>Wykonanie</h2><span class="kicker">${(r.steps||[]).length} kroków</span></div><div class="steps20">${(r.steps||[]).map((s,i)=>`<article class="step20"><div>${i+1}</div><p>${escapeHtml(s.text)}</p></article>`).join('')}</div></section><section class="recipe20-meta"><div><span>Przygotowanie</span><b>${fmt(r.prep||0)} min</b></div><div><span>Gotowanie</span><b>${fmt(r.cook||0)} min</b></div><div><span>Fermentacja</span><b>${fmt(r.ferment||0)} h</b></div>${r.servingType?`<div><span>Sposób podania</span><b>${escapeHtml(r.servingType)}</b></div>`:''}</section>${r.imageCredit?`<p class="photo-credit">${escapeHtml(r.imageCredit)}</p>`:''}</div>`}

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
    <div class="v3-card-photo"><img src="${escapeHtml(src)}" loading="lazy" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='./photo-generic.jpg'"><button class="v3-heart" data-fav="${r.id}" aria-label="${r.favorite?'Usuń z ulubionych':'Dodaj do ulubionych'}">${r.favorite?'♥':'♡'}</button></div>
    <div class="v3-card-body"><div class="v3-card-kicker">${escapeHtml(r.category||'Przepis')} ${r.flag||''}</div><h3>${escapeHtml(r.name)}</h3><div class="v3-card-meta"><span>◷ ${fmt(total)} min</span><span>♟ ${fmt(r.yield||r.servings||0)} ${escapeHtml(r.yieldUnit||'porc.')}</span>${r.traditional?'<span class="v3-gold">★ Klasyczna</span>':''}</div></div>
  </article>`;
}
function viewStart(){
  const recent=[...state.recipes].filter(r=>r.lastUsedAt).sort((a,b)=>(b.lastUsedAt||'').localeCompare(a.lastUsedAt||'')).slice(0,3);
  const fav=state.recipes.filter(r=>r.favorite).slice(0,3);
  const hero=state.recipes.find(r=>r.name==='Carbonara')||state.recipes[0];
  return `<div class="v3-home">
    <section class="v3-home-hero">
      <div class="v3-hero-image">${hero?`<img src="${escapeHtml(recipeImage(hero))}" alt="${escapeHtml(hero.name)}">`:''}<div class="v3-hero-overlay"></div>
        <div class="v3-hero-copy"><div class="v3-brand-mark">👨‍🍳</div><div class="v3-kicker">TWOJA KUCHNIA · TWOJE ZASADY</div><h1>Kucharzyna</h1><p>Twoje receptury, kalkulatory i kuchenny workflow. Wszystko pod ręką.</p></div>
        <button class="v3-hero-settings" data-action="settings" aria-label="Ustawienia">⚙</button>
      </div>
    </section>
    <section class="v3-menu-grid">
      <button class="v3-menu-card v3-menu-recipes" data-action="recipes"><span class="v3-menu-icon">${v3SvgIcon('book')}</span><b>Przepisy</b><small>Twoja książka kucharska</small></button>
      <button class="v3-menu-card v3-menu-world" data-route2="traditional"><span class="v3-menu-icon">${v3SvgIcon('globe')}</span><b>Kuchnie świata</b><small>Tradycyjne smaki</small></button>
      <button class="v3-menu-card v3-menu-shop" data-action="shopping"><span class="v3-menu-icon">${v3SvgIcon('cart')}</span><b>Zakupy</b><small>Lista i planowanie</small></button>
      <button class="v3-menu-card v3-menu-calc" data-action="calculators"><span class="v3-menu-icon">${v3SvgIcon('calc')}</span><b>Kalkulatory</b><small>Pizza, ciasto i więcej</small></button>
      <button class="v3-menu-card v3-menu-fav" data-action="fav"><span class="v3-menu-icon">${v3SvgIcon('heart')}</span><b>Ulubione</b><small>Twoje najlepsze</small></button>
      <button class="v3-menu-card v3-menu-settings" data-action="settings"><span class="v3-menu-icon">${v3SvgIcon('gear')}</span><b>Ustawienia</b><small>Motyw, profil, backup</small></button><button class="v3-menu-card v3-menu-google" data-google="1"><span class="v3-menu-icon">G</span><b>Szukaj w Google</b><small>Przepisy z internetu</small></button>
    </section>
    ${recent.length?`<section class="v3-section"><div class="v3-section-head"><div><span class="v3-kicker">WRACAJ DO GOTOWANIA</span><h2>Ostatnio używane</h2></div><button class="v3-link" data-route2="recipes">Wszystkie →</button></div><div class="v3-horizontal">${recent.map(r=>v3RecipeCard(r)).join('')}</div></section>`:''}
    ${fav.length?`<section class="v3-section"><div class="v3-section-head"><div><span class="v3-kicker">TWOJE PEWNIAKI</span><h2>Ulubione</h2></div></div><div class="v3-horizontal">${fav.map(r=>v3RecipeCard(r)).join('')}</div></section>`:''}
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
    <section class="v3-detail-hero"><img src="${escapeHtml(recipeImage(r))}" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='./photo-generic.jpg'"><div class="v3-detail-gradient"></div><div class="v3-detail-top"><button class="v3-round" data-fav="${r.id}">${r.favorite?'♥':'♡'}</button><button class="v3-round" data-edit="${r.id}">⋯</button></div><div class="v3-detail-title"><div class="v3-kicker">${escapeHtml(r.category||'PRZEPIS')} ${r.flag||''} ${r.traditional?' · ★ KLASYCZNA':''}</div><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(desc)}</p></div></section>
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
  ['Włochy','Klasyka makaronu, pizzy i risotto','🇮🇹','./photo-carbonara.jpg'],
  ['Polska','Domowe smaki i tradycyjne dania','🇵🇱','./photo-tomato.jpg'],
  ['Azjatycka','Wok, makarony i intensywne aromaty','🌏','./photo-carbonara.jpg'],
  ['Meksykańska','Tacos, salsa i kuchnia uliczna','🇲🇽','./photo-pizza.jpg'],
  ['Francuska','Technika, sosy i klasyka','🇫🇷','./photo-tomato.jpg'],
  ['Hiszpańska','Tapas, ryż i wyraziste smaki','🇪🇸','./photo-pizza.jpg'],
  ['Bliski Wschód','Przyprawy, grill i mezze','🌙','./photo-tomato.jpg'],
  ['Amerykańska','Comfort food i kuchnia nowoczesna','🇺🇸','./photo-pizza.jpg']
 ];
 const q=String(state.traditionalQueryV14||'').toLowerCase();
 const shown=cuisines.filter(c=>!q||(c[0]+' '+c[1]).toLowerCase().includes(q));
 const selected=state.tradCatV14&&state.tradCatV14!=="Wszystkie"?state.recipes.filter(r=>r.traditional&&((r.cuisine||'').toLowerCase()===String(state.tradCatV14).toLowerCase()||(r.cuisine||'').toLowerCase().includes(String(state.tradCatV14).toLowerCase().replace('azjatycka','azja')))):[];
 return `<div class="v3-world"><div class="v3-page-head"><div><span class="v3-kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Odkrywaj klasyczne kierunki kulinarne i przechodź prosto do pasujących receptur.</p></div></div><div class="v3-search v3-world-search"><span>⌕</span><input id="traditionalSearchV14" placeholder="Szukaj kuchni lub regionu…" value="${escapeHtml(state.traditionalQueryV14||'')}"></div><div class="v3-world-grid">${shown.map(c=>`<button class="v3-world-card" data-world-cuisine="${escapeHtml(c[0])}"><img src="${c[3]}" alt="${escapeHtml(c[0])}" onerror="this.src='./photo-generic.jpg'"><div class="v3-world-copy"><b>${c[2]} ${escapeHtml(c[0])}</b><span>${escapeHtml(c[1])}</span></div></button>`).join('')}</div>${selected.length?`<section class="v3-world-results"><div class="v3-section-head"><div><span class="v3-kicker">${escapeHtml(state.tradCatV14)}</span><h2>Receptury</h2></div><button class="v3-link" data-world-clear>Wszystkie</button></div><div class="v3-recipe-list">${selected.map(r=>v3RecipeCard(r,true)).join('')}</div></section>`:`<section class="v3-world-feature"><span>🍽️</span><div><b>Masz ochotę na konkretną kuchnię?</b><p>Wybierz kraj lub region powyżej. Kucharzyna pokaże zapisane klasyczne receptury z tego kierunku.</p></div></section>`}</div>`;
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
  ['Włochy','Pasta, pizza i klasyka','🇮🇹','./photo-carbonara.jpg'],
  ['Polska','Domowe i regionalne','🇵🇱','./photo-generic.jpg'],
  ['Japonia','Umami i precyzja','🇯🇵','./photo-generic.jpg'],
  ['Meksyk','Ogień, kukurydza i limonka','🇲🇽','./photo-tomato.jpg'],
  ['Tajlandia','Kwaśne, ostre i aromatyczne','🇹🇭','./photo-generic.jpg'],
  ['Francja','Technika i sosy','🇫🇷','./photo-generic.jpg'],
  ['Hiszpania','Tapas i kuchnia śródziemnomorska','🇪🇸','./photo-pizza.jpg'],
  ['Bliski Wschód','Przyprawy, zioła i grill','🌍','./photo-tomato.jpg']
];
function viewWorldPremium(){
  const q=(state.worldQuery||'').toLowerCase();
  const list=K3_WORLD.filter(x=>!q||(x[0]+' '+x[1]).toLowerCase().includes(q));
  const selected=state.worldCuisine?state.recipes.filter(r=>r.traditional&&String(r.cuisine||'').toLowerCase().includes(String(state.worldCuisine).toLowerCase())):[];
  return `<div class="v3-world"><div class="v3-page-head"><div><span class="v3-kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Odkrywaj charakterystyczne smaki, techniki i dania z różnych regionów.</p></div></div><div class="v3-search v3-world-search"><span>⌕</span><input id="worldSearch" placeholder="Szukaj kraju lub kuchni…" value="${escapeHtml(state.worldQuery||'')}"></div><div class="v3-world-grid">${list.map(x=>`<button class="v3-world-card ${state.worldCuisine===x[0]?'active':''}" data-world-cat="${escapeHtml(x[0])}"><img src="${x[3]}" alt="${escapeHtml(x[0])}" loading="lazy" onerror="this.src='./photo-generic.jpg'"><div class="v3-world-copy"><b>${x[2]} ${escapeHtml(x[0])}</b><span>${escapeHtml(x[1])}</span></div></button>`).join('')}</div>${state.worldCuisine?`<section class="v3-world-results"><div class="v3-section-head"><div><span class="v3-kicker">${escapeHtml(state.worldCuisine)}</span><h2>Receptury</h2></div><button class="v3-link" data-world-clear>Wyczyść</button></div>${selected.length?`<div class="v3-recipe-list">${selected.map(r=>v3RecipeCard(r,true)).join('')}</div>`:`<div class="v3-empty"><span>🍽️</span><b>Jeszcze nie masz receptury z tej kuchni</b><p>Możesz dodać własną albo wyszukać inspirację w Google.</p><button class="btn primary" data-google="1">Szukaj w Google</button></div>`}</section>`:`<section class="v3-world-feature"><div class="v3-section-head"><div><span class="v3-kicker">WYBIERZ KIERUNEK</span><h2>Co znajdziesz?</h2></div></div><div class="v3-world-pills"><span>🍝 Techniki</span><span>🌶️ Składniki</span><span>🔥 Obróbka</span><span>📖 Tradycje</span></div></section>`}</div>`;
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
  const direct=_k3RecipeImage(r); if(direct && direct!=='./photo-generic.jpg') return direct;
  const c=String(r?.category||'').toLowerCase(), n=String(r?.name||'').toLowerCase();
  if(/deser|ciasto|słod/.test(c+' '+n)) return './photo-generic.jpg';
  if(/mięso|woł|wieprz|kurcz|drób/.test(c+' '+n)) return './photo-tomato.jpg';
  if(/ryb|owoc.*morza|krewet/.test(c+' '+n)) return './photo-generic.jpg';
  if(/sałat/.test(c+' '+n)) return './photo-tomato.jpg';
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
function k32RecipeCard(r){
  const src=recipeImage(r),family=k32RecipeFamily(r),meta=[r.category||'Inne',r.yield?`${fmt(r.yield)} ${r.yieldUnit||''}`:'',r.cook?`${fmt(r.cook)} min`:'' ].filter(Boolean).join(' · ');
  return `<article class="k32-recipe-card" data-open="${escapeHtml(r.id)}"><div class="k32-card-photo"><img src="${escapeHtml(src)}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.onerror=null;this.src='./photo-generic.jpg'"><div class="k32-photo-badge">${escapeHtml(K32_FAMILY_LABEL[family])}</div><button class="k32-heart" data-fav="${escapeHtml(r.id)}" aria-label="Ulubiona">${r.favorite?'♥':'♡'}</button></div><div class="k32-card-body"><div class="k32-card-top"><span>${r.traditional?'★ Klasyczna':'Własna receptura'}</span><span>${r.lastUsedAt?'Ostatnio używana':''}</span></div><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(recipeDescription(r).slice(0,125))}${recipeDescription(r).length>125?'…':''}</p><div class="k32-card-meta"><span>${escapeHtml(meta)}</span><b>›</b></div></div></article>`;
}

/* Rich recipe library replaces the older plain list. */
const _k32ViewRecipesBase=viewRecipes;
viewRecipes=function(){
  let rs=[...state.recipes];
  const q=String(state.query||'').trim().toLowerCase();
  if(q) rs=rs.filter(r=>(`${r.name||''} ${r.description||''} ${(r.tags||[]).join(' ')} ${r.category||''}`).toLowerCase().includes(q));
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
  return `<div class="k32-detail"><section class="k32-detail-hero"><img src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" onerror="this.onerror=null;this.src='./photo-generic.jpg'"><div class="k32-detail-gradient"></div><div class="k32-detail-actions-top"><button class="k32-round" data-photo-change="${escapeHtml(r.id)}" aria-label="Zmień zdjęcie">⌘</button><button class="k32-round" data-fav="${escapeHtml(r.id)}">${r.favorite?'♥':'♡'}</button></div><div class="k32-detail-copy"><span>${escapeHtml(K32_FAMILY_LABEL[family])} ${r.flag||''} ${r.traditional?'· ★ KLASYCZNA':''}</span><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(desc)}</p></div></section><div class="k32-stats"><div><b>${fmt(r.yield||0)} ${escapeHtml(r.yieldUnit||'')}</b><span>wydajność</span></div><div><b>${fmt(r.prep||0)} + ${fmt(r.cook||0)} min</b><span>praca / gotowanie</span></div><div><b>${ingredients.length}</b><span>składników</span></div><div><b>${(r.steps||[]).length}</b><span>kroków</span></div></div><div class="k32-actions"><button class="btn primary" data-cook="${r.id}">▶ GOTUJĘ</button><button class="btn" data-scale="${r.id}">⇄ Przelicz</button><button class="btn" data-edit="${r.id}">✎ Edytuj</button><button class="btn" data-shop-recipe="${r.id}">＋ Zakupy</button></div>${timer?.running?`<div class="k32-live-note">⏱️ Ten przepis ma aktywny timer — wrócisz do niego w trybie GOTUJĘ.</div>`:''}<section class="k32-section"><div class="k32-section-head"><div><span class="kicker">SKŁADNIKI</span><h2>Co potrzebujesz</h2></div><span class="k32-count">${ingredients.length}</span></div>${(r.sections||[]).map(s=>`<div class="k32-ing-group"><div class="k32-group-title"><b>${escapeHtml(s.name)}</b><span>${(s.ingredients||[]).length} poz.</span></div>${(s.ingredients||[]).map(i=>`<button class="k32-ing" data-recipe-ing="${escapeHtml(i.id)}"><span>${escapeHtml(i.name)}</span><strong>${fmt(i.qty)} ${escapeHtml(i.unit||'')}</strong></button>`).join('')}</div>`).join('')}</section><section class="k32-section"><div class="k32-section-head"><div><span class="kicker">WYKONANIE</span><h2>Krok po kroku</h2></div><span class="k32-count">${(r.steps||[]).length}</span></div><div class="k32-steps">${(r.steps||[]).map((s,i)=>`<article><span>${i+1}</span><div><b>Krok ${i+1}</b><p>${escapeHtml(s.text)}</p></div></article>`).join('')}</div></section><section class="k32-info-grid"><div class="k32-info"><span>🍽️ Sposób podania</span><b>${escapeHtml(k32ServingTypeFor(r))}</b></div><div class="k32-info"><span>⏱️ Fermentacja</span><b>${r.ferment?`${fmt(r.ferment)} h`:'—'}</b></div><div class="k32-info"><span>📝 Źródło</span><b>${escapeHtml(r.source||'Własna receptura')}</b></div></section><section class="k32-notes"><span>WŁASNE UWAGI</span><p>${escapeHtml(r.notes||'Brak własnych uwag. Dodaj je przez „Edytuj”, a Kucharzyna zapamięta je razem z recepturą.')}</p></section><div class="k32-bottom-actions"><button class="btn" data-history="${r.id}">Historia</button><button class="btn danger" data-delete="${r.id}">Usuń recepturę</button></div></div>`;
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
  return `<div class="k32-cook"><div class="k32-cook-top"><button class="btn ghost" data-back="recipe">← Receptura</button><div><b>${pct}%</b><small>postępu</small></div></div><div class="k32-cook-hero"><div class="kicker">GOTUJĘ TERAZ</div><h1>${escapeHtml(r.name)}</h1><p>${escapeHtml(r.category||'Receptura')} · ${escapeHtml(k32ServingTypeFor(r))}${r.cook?` · ${fmt(r.cook)} min`:''}</p></div><div class="k32-progress"><span style="width:${pct}%"></span></div>${k32TimerMarkup(r)}<section class="k32-focus"><span class="kicker">KROK ${steps.length?active+1:0} / ${steps.length}</span><h2>${step?escapeHtml(step.text):'Brak kroków w tej recepturze.'}</h2><div class="k32-focus-actions"><button class="btn" id="cook-prev" ${active<=0?'disabled':''}>← Poprzedni</button><button class="btn primary" id="cook-done">${step&&st.steps[step.id]?'✓ Cofnij':'✓ Ukończ krok'}</button><button class="btn" id="cook-next" ${active>=steps.length-1?'disabled':''}>Następny →</button></div></section><section class="k32-cook-section"><div class="k32-section-head"><div><span class="kicker">MISE EN PLACE</span><h2>Składniki</h2></div><span class="k32-count">${ingredients.length}</span></div>${ingredients.map(i=>`<label class="k32-cook-ing ${st.ingredients[i.id]?'done':''}"><input type="checkbox" data-cook-ing-v20="${escapeHtml(i.id)}" ${st.ingredients[i.id]?'checked':''}><span>${escapeHtml(i.name)}</span><strong>${fmt(i.qty)} ${escapeHtml(i.unit||'')}</strong></label>`).join('')}</section><section class="k32-cook-section"><div class="k32-section-head"><div><span class="kicker">POSTĘP</span><h2>Wszystkie kroki</h2></div></div>${steps.map((s,i)=>`<button class="k32-step-row ${st.steps[s.id]?'done':''} ${i===active?'active':''}" data-cook-step-v20="${escapeHtml(s.id)}" data-step-index="${i}"><span>${i+1}</span><div>${escapeHtml(s.text)}</div><b>${st.steps[s.id]?'✓':''}</b></button>`).join('')}</section>${r.notes?`<section class="k32-cook-note"><b>📝 Twoja uwaga</b><p>${escapeHtml(r.notes)}</p></section>`:''}<button class="btn danger" id="cook-reset-v20">Resetuj postęp</button></div>`;
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
  ['Włochy','🇮🇹','Klasyka pizzy, makaronu i risotto','Włochy','./photo-pizza.jpg'],
  ['Polska','🇵🇱','Domowe i regionalne smaki','Polska','./photo-pierogi-ruskie.jpg'],
  ['Japonia','🇯🇵','Umami, ramen i kuchnia precyzji','Japonia','./photo-ramen-shoyu.jpg'],
  ['Tajlandia','🇹🇭','Ostre, kwaśne i aromatyczne','Tajlandia','./photo-pad-thai.jpg'],
  ['Francja','🇫🇷','Sosy, technika i klasyka','Francja','./photo-coq-au-vin.jpg'],
  ['Hiszpania','🇪🇸','Tapas, ryż i śródziemnomorski charakter','Hiszpania','./photo-paella-valenciana.jpg'],
  ['Grecja','🇬🇷','Feta, zioła i kuchnia Morza Egejskiego','Grecja','./photo-tzatziki.jpg'],
  ['Turcja','🇹🇷','Grill, przyprawy i słodkości','Turcja','./photo-adana-kebab.jpg'],
  ['Meksyk','🇲🇽','Chili, kukurydza i limonka','Meksyk','./photo-tacos-al-pastor.jpg'],
  ['Peru','🇵🇪','Ceviche i kuchnia Pacyfiku','Peru','./photo-ceviche.jpg'],
  ['Maroko','🇲🇦','Tagine, cytryna i przyprawy','Maroko','./photo-tagine-z-kurczakiem-i-cytryna.jpg'],
  ['Korea','🇰🇷','Kimchi, grill i fermentacja','Korea','./photo-bulgogi.jpg'],
  ['Węgry','🇭🇺','Papryka, gulasze i domowe dania','Węgry','./photo-goulash.jpg'],
  ['Brazylia','🇧🇷','Fasola, owoce morza i tropikalne smaki','Brazylia','./photo-feijoada.jpg'],
  ['Liban','🇱🇧','Mezze, tahini i świeże zioła','Liban','./photo-hummus.jpg'],
  ['Wielka Brytania','🇬🇧','Comfort food i klasyczne dania','Wielka Brytania','./photo-fish-and-chips.jpg']
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
      <section class="k33-world-hero"><img src="${escapeHtml(meta[4])}" alt="${escapeHtml(meta[0])}" onerror="this.src='./photo-generic.jpg'"><div class="k33-world-hero-overlay"></div><div class="k33-world-hero-copy"><span>${meta[1]}</span><small>KUCHNIA ŚWIATA</small><h1>${escapeHtml(meta[0])}</h1><p>${escapeHtml(meta[2])}</p></div></section>
      <div class="k33-world-title"><div><span class="kicker">MENU</span><h2>Dania kuchni ${escapeHtml(meta[0])}</h2><p>${rs.length} ${rs.length===1?'danie':'dań'} w Kucharzynie</p></div></div>
      <div class="k33-search"><span>⌕</span><input id="k33-world-dish-search" placeholder="Szukaj dania…" value="${escapeHtml(state.worldDishQuery||'')}"></div>
      ${rs.length?`<div class="k33-world-recipe-grid">${rs.map(r=>k33WorldRecipeCard(r)).join('')}</div>`:`<div class="k33-empty"><div>🍽️</div><h3>Brak wyników</h3><p>Ta kuchnia nie ma jeszcze dania pasującego do wyszukiwania.</p><button class="btn" data-world-menu>Wróć do kuchni</button></div>`}
    </div>`;
  }
  const q=String(state.worldCuisineQuery||'').toLowerCase();
  const shown=K33_WORLD.filter(x=>!q||(x[0]+' '+x[2]).toLowerCase().includes(q));
  return `<div class="k33-world-menu"><div class="k33-page-intro"><span class="kicker">INSPIRACJE</span><h1>Kuchnie świata</h1><p>Wybierz kraj. Dopiero po wejściu zobaczysz osobne menu jego dań.</p></div><div class="k33-search"><span>⌕</span><input id="k33-world-search" placeholder="Szukaj kraju lub kuchni…" value="${escapeHtml(state.worldCuisineQuery||'')}"></div><div class="k33-cuisine-grid">${shown.map(x=>`<button class="k33-cuisine-card" data-k33-world-cuisine="${escapeHtml(x[0])}"><div class="k33-cuisine-photo"><img src="${escapeHtml(x[4])}" alt="${escapeHtml(x[0])}" loading="lazy" onerror="this.src='./photo-generic.jpg'"><span>${x[1]}</span></div><div class="k33-cuisine-copy"><b>${escapeHtml(x[0])}</b><small>${escapeHtml(x[2])}</small><em>${k33WorldRecipes(x[3]).length} dań <strong>›</strong></em></div></button>`).join('')}</div></div>`;
}
function k33WorldRecipeCard(r){
  const img=recipeImage(r); const type=k32ServingTypeFor(r);
  return `<article class="k33-dish-card" data-open="${escapeHtml(r.id)}"><div class="k33-dish-photo"><img src="${escapeHtml(img)}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.src='./photo-generic.jpg'"><button class="k33-dish-heart" data-fav="${escapeHtml(r.id)}">${r.favorite?'♥':'♡'}</button><span>${type==='Na zimno'?'❄️':type==='Przekąska'?'🍽️':'🔥'} ${escapeHtml(type)}</span></div><div class="k33-dish-body"><small>${escapeHtml(r.category||'Danie')}</small><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(recipeDescription(r).slice(0,90))}</p></div></article>`;
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
    <section class="k33-shopping-hero"><div class="k33-shopping-photo"><img src="./photo-pizza.jpg" alt="Kuchnia"><img src="./photo-spaghetti-alla-carbonara.jpg" alt="Makaron"><img src="./photo-tomato.jpg" alt="Sos"></div><div class="k33-shopping-hero-copy"><span class="kicker">PLANOWANIE KUCHNI</span><h1>Zakupy</h1><p>${list.length?`${list.length} pozycji · ${list.length-done} do kupienia`:'Lista jest pusta'}</p></div></section>
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
  return r?recipeImage(r):'./photo-generic.jpg';
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
    <section class="k34-category-hero"><img src="${escapeHtml(img)}" alt="${escapeHtml(category)}" onerror="this.onerror=null;this.src='./photo-generic.jpg'"><div class="k34-category-overlay"></div><div class="k34-category-copy"><span class="kicker">KATEGORIA PRZEPISÓW</span><h1>${escapeHtml(category)}</h1><p>${total} ${total===1?'receptura':'receptur'} w tej kategorii</p></div></section>
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
