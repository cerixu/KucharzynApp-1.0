const DB_NAME="kucharzyna-db", DB_VERSION=3;
let dbPromise;
function openDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB_NAME,DB_VERSION);
  r.onupgradeneeded=()=>{const db=r.result;
   for(const s of ["recipes","ingredients","categories","shoppingItems","settings","history","cookState","pizzaProfiles"]) if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:"id"});
  };
  r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
 }); return dbPromise;
}
async function tx(store,mode="readonly"){
  const db=await openDB();
  if(!db.objectStoreNames.contains(store)) throw new Error(`Unknown IndexedDB store: ${store}`);
  return db.transaction(store,mode).objectStore(store);
}
function dbRequest(store,requestFactory){return new Promise((res,rej)=>{
  tx(store).then(s=>{const r=requestFactory(s);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error||new Error(`IndexedDB request failed: ${store}`));}).catch(rej);
})}
async function getAll(store){return dbRequest(store,s=>s.getAll())}
async function getOne(store,id){return dbRequest(store,s=>s.get(id))}
async function put(store,obj){return new Promise((res,rej)=>{
  tx(store,"readwrite").then(s=>{const r=s.put(obj);r.onsuccess=()=>res(obj);r.onerror=()=>rej(r.error||new Error(`IndexedDB write failed: ${store}`));}).catch(rej);
})}
async function del(store,id){return new Promise((res,rej)=>{
  tx(store,"readwrite").then(s=>{const r=s.delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error||new Error(`IndexedDB delete failed: ${store}`));}).catch(rej);
})}
async function clearStore(store){return new Promise((res,rej)=>{
  tx(store,"readwrite").then(s=>{const r=s.clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error||new Error(`IndexedDB clear failed: ${store}`));}).catch(rej);
})}
async function clearAll(){for(const s of ["recipes","ingredients","categories","shoppingItems","settings","history","cookState","pizzaProfiles"])await clearStore(s)}
