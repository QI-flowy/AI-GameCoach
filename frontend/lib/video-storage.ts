// 简单 IndexedDB 封装：存储视频文件，跨页面读取
const DB = "AiCoachVideoDB";
const STORE = "videos";
const VER = 1;

function open(): Promise<IDBDatabase> {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB, VER);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

export async function saveVideo(key: string, file: File): Promise<void> {
  var db = await open();
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, key);
    tx.oncomplete = function () { resolve(); };
    tx.onerror = function () { reject(tx.error); };
  });
}

export async function loadVideo(key: string): Promise<Blob | null> {
  var db = await open();
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(STORE, "readonly");
    var req = tx.objectStore(STORE).get(key);
    req.onsuccess = function () { resolve(req.result || null); };
    req.onerror = function () { reject(req.error); };
  });
}

export async function deleteVideo(key: string): Promise<void> {
  var db = await open();
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = function () { resolve(); };
    tx.onerror = function () { reject(tx.error); };
  });
}
