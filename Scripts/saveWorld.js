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
    return getLoadList() !== undefined;
}

const getLoadList = () => {
    return localStorage.loadList;
}

const deleteDatabase = () => {
    let req = indexedDB.deleteDatabase(DB_NAME);
    localStorage.clear();

    req.onerror = (event) => {
        console.error("Couldn't delete database: " + event);
    }
}
// deleteDatabase();
const saveWorld = (worldName) => {
    if (!window.indexedDB) {
        window.alert("Ваш браузер не поддерживат стабильную версию IndexedDB. Сохранения будут недоступны");
    }

    let request = window.indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
        console.error("Couldn't open database: " + event);
        deleteDatabase();
    }
    
    request.onupgradeneeded = (event) => {
        event
            .target
            .result
            .createObjectStore(DB_STORE_NAME, {
                ketPath: "worldName",
                autoIncrement : true,
                unique: true
        });
    }

    request.onsuccess = (event) => {
        _db = event.target.result;

        let objectStore = _db
            .transaction([DB_STORE_NAME], "readwrite")
            .objectStore(DB_STORE_NAME);

        let pCopy = {}, gCopy = {};
        playerCopy(pCopy, player);
        gameAreaCopy(gCopy, gameArea);
        objectStore.put({
            key: key,
            player: pCopy,
            gameArea: gCopy,
            change: BlocksGlobalChange
        },
        worldName);
    
        localStorage.loadList = worldName;
    }
}

const loadWorld = (worldName) => {
    if (!window.indexedDB) {
        window.alert("Ваш браузер не поддерживат стабильную версию IndexedDB. Сохранения будут недоступны");
    }

    return new Promise((resolve, reject) => {
        let request = window.indexedDB.open(DB_NAME, 1);

        request.onerror = (event) => {
            console.error("Couldn't open database: " + event);
            deleteDatabase();
            reject(event);
        }

        request.onsuccess = (event) => {
            _db = event.target.result;

            let req = _db
            .transaction([DB_STORE_NAME], "readwrite")
            .objectStore(DB_STORE_NAME)
            .get(worldName);

            req.onsuccess = () => {
                resolve({
                    gameArea: req.result.gameArea,
                    key: req.result.key,
                    player: req.result.player,
                    change: req.result.change
                });
            }
        }
    });
}

const deleteWorld = (worldName) => {
    if (!window.indexedDB) {
        window.alert("Ваш браузер не поддерживат стабильную версию IndexedDB. Сохранения будут недоступны");
    }

    let request = window.indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
        console.error("Couldn't open database: " + event);
        deleteDatabase();
    }

    request.onupgradeneeded = (event) => {
        console.error("Database does not exist");
        deleteDatabase();
    }

    request.onsuccess = (event) => {
        localStorage[worldName] = undefined;
        _db = event.target.result;

        let transaction = _db.transaction([DB_STORE_NAME], "readwrite");

        // TODO : добавить метод удаления object store
    }
}