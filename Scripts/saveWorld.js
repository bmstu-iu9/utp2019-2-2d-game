'use strict';

/*
На данный момент при сохранении запоминаются:
    * gameArea хранит состояние о мире
    * player хранит данные о персонаже и инвентаре
    * 
Позднее будут сохранятся только нужные данные у этих объектов

loadExist()             Существует ли сохранение
getLoadList()           Получить массив с именами всех сохранений
deleteDatabase()        Очистить БД
save(имя сохранения)    Сохранить текущее состояние
load(имя сохранения)    Возвращает объект с полями, идентичными gameArea и player
                        (ВАЖНО! поле для корректной работы необходимо создать объекты
                        Player, gameArea и скопировать данные в них)

Внимение! Если сохранения перестали работать и мbр больше не загружается, попробуйсте вызвавть функцию deleteDatabase()
*/
const DB_NAME = 'indexedDB';
const DB_VERSION = 1;
const DB_STORE_NAME = 'request';

let _db;

const loadExist = () => {
    return getLoadList().length !== 0;
}

const getLoadList = () => {
    return localStorage.loadList !== undefined
        ? JSON.parse(localStorage.loadList)
        : [];
}

const deleteDatabase = () => {
    let req = indexedDB.deleteDatabase(DB_NAME);
    localStorage.clear();

    req.onerror = (event) => {
        console.error("Couldn't delete database: " + event);
    }
}

// deleteDatabase();
const save = async (worldName) => {
    if (!window.indexedDB) {
        window.alert("Ваш браузер не поддерживат стабильную версию IndexedDB. Сохранения будут недоступны");
    }

    return new Promise((resolve, reject) => {
        let request = window.indexedDB.open(DB_NAME, 1);

        request.onerror = (event) => {
            console.error("Couldn't create database: " + event);
            reject(event);
        }
    
        request.onupgradeneeded = (event) => {
            _db = event.target.result;
    
            let objectStore = _db.createObjectStore(DB_STORE_NAME, {
                ketPath: "worldName",
                autoIncrement : true,
                unique: true
            });
    
            objectStore.createIndex("player", "player", {
                unique: false
            });
            objectStore.createIndex("gameArea", "gameArea", {
                unique: false
            });
    
            let pCopy = {}, gCopy = {};
            playerCopy(pCopy, player);
            gameAreaCopy(gCopy, gameArea);
            objectStore.add({
                player: pCopy,
                gameArea: gCopy
            },
            worldName);
    
            localStorage.loadList = JSON.stringify(localStorage.loadList === undefined
                ? [worldName]
                : JSON
                    .parse(localStorage.loadList)
                    .push(worldName));
            resolve(event);
        }
    });
}

const load = async (worldName) => {
    return await new Promise((resolve, reject) => {
        let request = window.indexedDB.open(DB_NAME, 1);

        request.onerror = (event) => {
            console.error("Couldn't load database: " + event);
            reject(event);
        }

        request.onsuccess = (event) => {
            _db = event.target.result;

            let req = _db
            .transaction([DB_STORE_NAME], "readwrite")
            .objectStore(DB_STORE_NAME)
            .get(worldName);

            req.onsuccess = (event) => {
                resolve({
                    gameArea: req.result.gameArea,
                    player: req.result.player
                });
            }
        }
    });
}
