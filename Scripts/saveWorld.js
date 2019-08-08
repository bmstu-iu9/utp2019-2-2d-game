'use strict';

/*
Как эим пользоваться?

loadExist()                    Существует ли сохранение
getLoadList()                  Получить массив с именами всех сохранений
deleteDatabase()               Очистить БД
saveWorld(имя сохранения)      Сохранить текущее состояние, перезаписывает состояние, если такое имя уже занято
chooseWorld(имя сохранения)    После перезагрузки будет загружено данное сохранение
loadWorld(имя сохранения)      Возвращает объект с состоянием мира
deleteWorld(имя сохранения)    Удаляет сохранение

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
    if (localStorage.loadList === undefined) {
        return [];
    }
    return JSON.parse(localStorage.loadList);
}

const deleteDatabase = () => {
    let req = indexedDB.deleteDatabase(DB_NAME);
    localStorage.clear();

    req.onerror = (event) => {
        console.error("Couldn't delete database: " + event);
    }
}

const chooseWorld = (worldName) => {
    if (worldName === undefined) {
        delete localStorage.choosedWorld;
    } else {
        localStorage.choosedWorld = worldName;
    }
}

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
                ketPath: worldName,
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
            change: BlocksGlobalChange,
            currentTime: currentTime
        },
        worldName);

        if (localStorage.loadList === undefined) {
            localStorage.loadList = JSON.stringify(new Array);
        }
        let loadList = JSON.parse(localStorage.loadList);
        if (loadList.indexOf(worldName) !== -1) {
            console.warn(worldName + " has been overwrite");
        } else {
            loadList.push(worldName);
        }
        localStorage.loadList = JSON.stringify(loadList);
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
                    change: req.result.change,
                    currentTime: req.result.currentTime
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
    }

    request.onupgradeneeded = (event) => {
        console.error("Database does not exist");
        deleteDatabase();
    }

    request.onsuccess = (event) => {
        if (localStorage.loadList !== undefined) {
            let loadList = JSON.parse(localStorage.loadList);
            loadList.splice(loadList.indexOf(worldName), 1);
            if (loadList.length === 0) {
                delete localStorage.loadList;
            } else {
                localStorage.loadList = JSON.stringify(loadList);
            }
        } else {
            console.error(worldName + " does not exist");
        }

        _db = event.target.result;

        let req = _db
        .transaction([DB_STORE_NAME], "readwrite")
        .objectStore(DB_STORE_NAME);
        req.delete(worldName);
        if (localStorage.choosedWorld === worldName) {
            chooseWorld(undefined);
        }
    }
}