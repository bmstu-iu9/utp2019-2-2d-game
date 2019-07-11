'use strict';

/*============================================Описание свойств блока========================================================================
 id - его id в таблице blockTable, а также представление в map
 type - тип блока, определяется на основе того, чем "добывается" блок с точки зрения логики:
                        dirt         - земля, добывается лопатой
                        stone        - камень, добывается киркой
                        wood         - дерево, добывается топором
                        leaf         - листва, добывается ножницами
                        water        - блоки стоячей жидкости
                        flowingWater - блоки текучей жидкости
                        backgr       - блоки фона, стоят на отдельном фоновом слое, добываются (?) молотом (если смотреть на ту же
                                       Террарию)
                        foregr       - блоки переднего плана, добываются тоже (?) молотом 
 durability  : Прочность блока : от 1 до 100
 brightness  : Светимость блока : от 0 до 9
 isCollissed : Можно ли проходить сквозь этот блок, true/false
 isPlatform  : Является ли блок платформой - можно ли спрыгнуть с него клавишей  вниз - как в платформере
 isClickable : Можно ли нажать на блок
 hasGravity  : Подвержен ли этот блок гравитации, т.е падает ли вниз без опоры, true/false
 name        : имя блока
===========================================================================================================================================*/



// Игровое пространство
class GameArea{
    constructor(map, elevationMap, shadowMap, width, height){
        // map  - двумерная карта, состоящая из id блоков
        this.map = map;
        this.elevationMap = elevationMap;
        this.shadowMap = shadowMap;
        this.timeOfDay = 1; //От 0 до 1, где 1 - полдень, 0 - полночь

        // Ширина и высота игрового пространства
        this.width = width;
        this.height = height;

        // Возвращает освещение конкретного блока
        this.getLight = (x, y) => {
            let grad = (y > this.elevationMap[x]) ? 1 : ((y < 0.7 * this.elevationMap[x]) ? 0.2 : ((y - 0.7 * this.elevationMap[x]) / (0.3 * this.elevationMap[x]) * 0.8 + 0.2));
            let k = Math.min(1 / 3 + this.timeOfDay * 3 / 2, grad);
            let light = Math.max(Math.floor(shadowMap[x][y] / 1000) * 1000, shadowMap[x][y] % 1000);
            return Math.floor(k * light * 5) / 45;
        };

        this.updateLight = (x, y) => {

            // Добавление источника света
            const addShadowRound = (startX, startY, x, y, n, isNatural) => {
                const step = (nextX, nextY, n) => {
                    if(n > 0 && (startX - x) * (startX - x) + (startY - y) * (startY - y) < (startX - nextX) * (startX - nextX) + (startY - nextY) * (startY - nextY)
                        && nextX >= 0 && nextY >= 0 && nextX < width && nextY < height
                        && (shadowMap[nextX][nextY] === undefined || (isNatural && shadowMap[nextX][nextY] % 1000 < n) || (!isNatural && Math.floor(shadowMap[nextX][nextY] / 1000) < n))){
                        return shadowRound(startX, startY, nextX, nextY, n, isNatural);
                    }
                    return [];
                };
                if(n > 0 && (shadowMap[x][y] === undefined || (isNatural && shadowMap[x][y] % 1000 < n) || (!isNatural && Math.floor(shadowMap[x][y] / 1000) < n))){
                    if(isNatural){
                        if(shadowMap[x][y] === undefined){
                            shadowMap[x][y] = n;
                        } else{
                            shadowMap[x][y] = Math.floor(shadowMap[x][y] / 1000) * 1000 + n;
                        }
                    } else{
                        if(shadowMap[x][y] === undefined){
                            shadowMap[x][y] = n * 1000;
                        } else{
                            shadowMap[x][y] = n * 1000 + shadowMap[x][y] % 1000;
                        }
                    }
                    step(x + 1, y, n - 1);
                    step(x - 1, y, n - 1);
                    step(x, y + 1, n - 1);
                    step(x, y - 1, n - 1);
                }
            };

            // Удаление источника света
            let lights = [];
            const deleteShadowRound = (startX, startY, x, y, n, isNatural) => {
                const step = (nextX, nextY, n) => {
                    if(n > 0 && (startX - x) * (startX - x) + (startY - y) * (startY - y) <
                        (startX - nextX) * (startX - nextX) + (startY - nextY) * (startY - nextY)
                        && nextX >= 0 && nextY >= 0 && nextX < width && nextY < height){
                        if((isNatural && shadowMap[nextX][nextY] % 1000 > n) || (!isNatural && Math.floor(shadowMap[nextX][nextY] / 1000) > n)){
                            lights.push([nextX, nextY]);
                            return;
                        }
                        shadowRound(startX, startY, nextX, nextY, n, isNatural);
                    }
                };
                if(n > 0 && ((isNatural && shadowMap[x][y] % 1000 === n) || (!isNatural && Math.floor(shadowMap[x][y] / 1000) === n))){
                    if(isNatural){
                        shadowMap[x][y] = Math.floor(shadowMap[x][y] / 1000) * 1000;
                    }else{
                        shadowMap[x][y] = shadowMap[x][y] % 1000;
                    }
                    step(x + 1, y, n - 1);
                    step(x - 1, y, n - 1);
                    step(x, y + 1, n - 1);
                    step(x, y - 1, n - 1);
                }
            };

            if(shadowMap[x][y] % 1000 === 9 && map[x][y][GameArea.MAIN_LAYOUT] !== undefined){
                deleteShadowRound(x, y, x, y, 9, true);
            } else if(Math.floor(shadowMap[x][y] / 1000) === 9 && blockTable[map[x][y][GameArea.MAIN_LAYOUT]].brightness !== 9){
                deleteShadowRound(x, y, x, y, 9, false);
            } else{
                if(map[x][y][GameArea.MAIN_LAYOUT] === undefined){
                    addShadowRound(x, y, x, y, 9, true);
                } else{
                    addShadowRound(x, y, x, y, blockTable[map[x][y][GameArea.MAIN_LAYOUT]].brightness, false);
                }
            }
        };

        // Делает блок воздуха = undefined
        this.makeAirBlock = () => {
            return undefined;
        };

        // Cтоячая вода - блок с гравитацией
        this.makeWaterBlock = () => {
            return 8; //id стоячей воды
        };

        this.makeFlowingWaterBlock = (cnt) => {
            // НЕ РАБОТАЕТ
            // Текучая вода - блок без гравитации
            // В зависимости от степени наполненности имеет id от 9 до 15, 9 - наибольшая наполненность
            if (cnt > 15 || cnt < 9) {
                console.log("Invalid ID was received while generating flowing water block : {$cnt}." +
                    " Valid id : from 9 to 15. Undefined returned");
                return undefined;
            }
            return cnt; //id текучей воды : от 9 до 15 включительно
        };

        // Есть ли коллизия с этим блоком
        this.hasCollision = (x, y, layout) => {
            if(x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
            let block = this.map[x][y][layout];

            // Если это не блок воздуха и если он имеет коллизию или не найден в таблице => есть коллизия
            if(block != undefined && (blockTable[block] === undefined || blockTable[block].isCollissed)) {
                return true;
            }
            return false;
        }

        this.updateBlock = (x, y, layout) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            if (this.map[x][y][layout] === undefined) return;
            let block = blockTable[this.map[x][y][layout]];
            if (block === undefined) return;

            if (block.hasGravity) {
                // Если нет блока снизу
                if ((y - 1) >=0 && blockTable[this.map[x][y - 1][layout]].type === undefined) {
                    let block_id = this.map[x][y][layout];
                    this.destroyBlock(x, y, layout);
                    this.placeBlock(x, y - 1, layout, block_id);
                }
            }
            switch (block.type) {
                case "wood":
                    // Если блок дерева не видит под собой опоры в нижнем блоке, либо стоит на листве, плюс
                    // крайние нижние блоки - это не блоки дерева, то оно рушится
                {
                    let downB;
                    if (y - 1 >= 0) downB = blockTable[this.map[x][y - 1][layout]];
                    if (downB === undefined || downB.type === "leaf" ) {
                        let downLeftB;
                        if (x - 1 >= 0 && y - 1 >= 0) downLeftB = blockTable[this.map[x - 1][y - 1][layout]];
                        if (downLeftB === undefined || downLeftB.type !== "wood")  {
                            let downRightB;
                            if (x + 1 < this.width && y - 1 >= 0) downRightB = blockTable[this.map[x + 1][y - 1][layout]];
                            if (downRightB === undefined || downRightB.type !== "wood") {
                                this.goodDestroy(x, y, layout);
                            }
                        }
                    }
                }
                break;
                case "leaf":
                    // Если блок листвы не видит под собой опоры в нижнем, нижнем левом и нижнем правом блоке в виде
                    // дерева или листвы, то он рушится
                {
                    let downLeftB;
                    if (x - 1 >= 0 && y - 1 >= 0) downLeftB = blockTable[this.map[x - 1][y - 1][layout]];
                    if (downLeftB === undefined || downLeftB.type !== "leaf" || downLeftB.type !== "wood") {
                        let downB;
                        if (y - 1 >= 0) downB = blockTable[this.map[x][y - 1][layout]];
                        if (downB === undefined || downB.type !== "leaf" || downB.type !== "wood") {
                            let downRightB;
                            if (x + 1 < this.width && y - 1 >= 0) downRightB = blockTable[this.map[x + 1][y - 1][layout]];
                            if (downRightB === undefined || downRightB.type !== "leaf" ||
                                downRightB.type !== "wood") {
                                this.destroyBlock(x, y, layout);
                            }
                        }
                    }
                }
                break;
                case "water":
                    // НЕ РАБОТАЕТ
                    // Если 2 блока воды при течении вправо/влево пересекаются своими потоками, то на месте пересечения
                    // потоков создается цельный блок воды
                    if (this.map[x - 1][y][layout] === undefined) {
                        this.placeBlock(x - 1, y, layout, this.makeFlowingWaterBlock(9));
                    }
                    if (this.map[x + 1][y][layout] === undefined) {
                        this.placeBlock(x + 1, y, layout, this.makeFlowingWaterBlock(9));
                    }
                    break;

                case "flowingWater":
                    // НЕ РАБОТАЕТ
                    if (this.map[x][y - 1][layout] === undefined) {
                        this.placeBlock(x, y - 1, layout, this.makeFlowingWaterBlock(this.map[x][y][layout]));
                    }

                    // 15 - id блока текучей воды с наименьшей заполненностью
                    // Поведение текучей воды, пока недоделано до конца
                    if (this.map[x][y][layout] !== 15) {
                        let currID  = this.map[x][y][layout];
                        let leftID  = this.map[x - 1][y][layout];
                        let rightID = this.map[x + 1][y][layout];
                        if (rightID === undefined) {
                            this.placeBlock(x + 1, y, layout,
                                this.makeFlowingWaterBlock(currID + 1));
                        } else if (rightID > (currID + 1) && rightID <= 15) {
                            if ( 31 - rightID - currID >= GameArea.WATER_BLOCK_CAP) {
                                this.placeBlock(x + 1, y, layout,
                                    this.makeWaterBlock());
                            } else {
                                this.placeBlock(x + 1, y, layout,
                                    this.makeFlowingWaterBlock(currID + 1));
                            }
                        }
                        if (leftID === undefined) {
                            this.placeBlock(x - 1, y, layout,
                                this.makeFlowingWaterBlock(currID + 1));
                        } else if (leftID > (currID + 1) && leftID <= 15) {
                            if ( 31 - leftID - currID >= GameArea.WATER_BLOCK_CAP) {
                                this.placeBlock(x - 1, y, layout,
                                    this.makeWaterBlock());
                            } else {
                                this.placeBlock(x - 1, y, layout,
                                    this.makeFlowingWaterBlock(currID + 1));
                            }
                        }
                    }
                    break;
                default:
                    break;
                // Какое-либо стандартное поведение
            }

        };

        // Обновление окружения блока
        this.updateRadius = (x, y, layout) => {
            for (let i = x - 1; i <= x + 1; i++) {
                for (let j = y - 1; j <= y + 1; j++) {
                    if (i !== x || y !== j) this.updateBlock(i, j, layout);
                }
            }
        };

        // Действие при разрушении блока
        this.destroyBlock = (x, y, layout) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            this.map[x][y][layout] = this.makeAirBlock();
            this.updateRadius(x, y, layout);
            console.log(`Block on coordinates destroyed : [${x} ${y} ${layout}]`);
        };

        // Действие при установке блока
        this.placeBlock = (x, y, layout, id) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            if (!this.map[x][y][layout] || blockTable[this.map[x][y][layout]].isCollissed === false) {
                this.map[x][y][layout] = id;
                this.updateRadius(x, y, layout);
                this.updateBlock(x, y, layout);
            }
        };

        // Функция взаимодействия с блоком
        this.interactWithBlock = (x, y, layout) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            console.log("Interaction with block on coordinates : [${x} ${y} ${layout}]");
            let block = blockTable[this.map[x][y][layout]];
            if (block.isClickable) {
                block.interactFunction();
            }
        };

        // Функция сброса лута
        this.dropLoot = (x, y, block) => {
            return block.id; // Оставил x, y - в будующем лут будет падать там, где разрушен блок, пока падает в инвентарь
        };


        // Функция разрушения блока со сбросом лута
        this.goodDestroy = (x, y, layout) => {
            let block = blockTable[this.map[x][y][layout]];
            this.destroyBlock(x, y, layout);
            return this.dropLoot(x, y, block);
        };

    }
}

// Константы уровня
GameArea.FORWARD_LAYOUT = 1;
GameArea.MAIN_LAYOUT = 2;
GameArea.BACK_LAYOUT = 3;

// Константы поведения игрового пространства
GameArea.WATER_BLOCK_CAP = 12;  // Какова должна быть наполненность сходящихся потоков воды, чтобы на их месте создался
                                // блок стоячей воды min = 1, max = 14. При этом наполненность блока стоячей воды = 8,
                                // в то время как наполненность блока текучей воды изменяется от 7 до 1
                                // id изменяются соотвественно от 9 до 15 включительно

GameArea.GRAVITY = 100;         // Ускорение свободного падения
