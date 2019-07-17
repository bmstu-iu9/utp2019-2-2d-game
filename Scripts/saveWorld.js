'use strict';

/*
gameArea.map хранит состояние о блоках в мире + свет
player хранит данные о персонаже и инвентаре
Позднее будут сохранятся только нужные данные у этих объектов
*/

const saveWorld = () => {
    for (let i = 0; i < gameArea.width; i++) {
        for(let j = 0; j < gameArea.height; j++) {
            localStorage[i+'x'+j+'x'+GameArea.MAIN_LAYOUT] =
            gameArea.map[i][j][GameArea.MAIN_LAYOUT]
        }
    }
    localStorage.w=gameArea.width;
    localStorage.h=gameArea.height;
    localStorage.x=player.x;
    localStorage.y=player.y;
    localStorage.setItem('saved', true);
}

const loadWorld = () => {
    console.log("loaded")
    gameArea.height=localStorage.h;
    gameArea.width=localStorage.w;
    player.x=localStorage.x;
    player.y=localStorage.y;
    for (let i = 0; i < gameArea.width; i++) {
        for(let j = 0; j < gameArea.height; j++) {
            gameArea.map[i][j][GameArea.MAIN_LAYOUT]=
            localStorage[i+'x'+j+'x'+GameArea.MAIN_LAYOUT]
        }
    }
    localStorage.clear();
}