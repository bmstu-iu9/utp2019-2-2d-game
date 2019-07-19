'use strict';

/*============================================Описание свойств блока===================================================
 id - его id в таблице items, а также представление в map
 type - тип блока, определяется на основе того, чем "добывается" блок с точки зрения логики:
                        dirt         - земля, добывается лопатой
                        stone        - камень, добывается киркой
                        wood         - дерево, добывается топором
                        leaf         - листва, добывается ножницами
                        water        - блоки стоячей жидкости
                        flowingWater - блоки текучей жидкости
                        backgr       - блоки фона, стоят на отдельном фоновом слое, добываются (?) молотом
                                        (если смотреть на ту же Террарию)
                        foregr       - блоки переднего плана, добываются тоже (?) молотом 
 durability  : Прочность блока : от 1 до 100
 brightness  : Светимость блока : от 0 до 9
 isCollissed : Можно ли проходить сквозь этот блок, true/false
 isSolid     : Является ли данный блок твердым, то есть можно ли на его место ставить другие блоки
 isPlatform  : Является ли блок платформой - можно ли спрыгнуть с него клавишей  вниз - как в платформере
 isClickable : Можно ли нажать на блок
 hasGravity  : Подвержен ли этот блок гравитации, т.е падает ли вниз без опоры, true/false
 name        : имя блока

 О жидкостях:
  Если блок стоячей жидкости имеет id x, то блок-изображение всех вариантов текучей жидкости этого типа имеет id = x + 1.
 При этом непосредственно сами блоки текучей жидкости имеют id от (x+1)*1000 до (x+1)*1000 + 23 включительно с обеих
 сторон. id от (x+1)*1000 до (x+1)*1000 + 7 - жидкость, текущая влево
            от (x+1)*1000 + 8 до (x+1)*1000 + 15 - жидкость, текущая вправо
            от (x+1)*1000 + 16 до (x+1)*1000 + 23 - жидкость, текущая вниз
         При одном направлении: чем больше id, тем меньше наполненность
=======================================================================================================================
*/



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
            let grad = (y > this.elevationMap[x])
                ? 1
                : ((y < 0.9 * this.elevationMap[x])
                    ? 0.2
                    : ((y - 0.9 * this.elevationMap[x]) / (0.1 * this.elevationMap[x]) * 0.8 + 0.2));
            let k = Math.min(1 / 3 + this.timeOfDay * 3 / 2, grad);
            if(Math.floor(shadowMap[x][y] / 1000) > shadowMap[x][y] % 1000 * k){
                return Math.floor(shadowMap[x][y] / 1000) / 9;
            } else {
                return Math.floor(k * (shadowMap[x][y] % 1000) * 5) / 45;
            }
        };

        // Добавление источника света
        this.addLightRound = (startX, startY, x, y, n, isNatural, isForce) => {
            const step = (nextX, nextY, n) => {
                if (n > 0
                        && ((startX - x) * (startX - x) + (startY - y) * (startY - y)
                            < (startX - nextX) * (startX - nextX) + (startY - nextY) * (startY - nextY))
                        && nextX >= 0
                        && nextY >= 0
                        && nextX < width
                        && nextY < height
                        && (shadowMap[nextX][nextY] === undefined
                            || (isNatural && shadowMap[nextX][nextY] % 1000 < n)
                            || (!isNatural && Math.floor(shadowMap[nextX][nextY] / 1000) < n))) {

                    this.addLightRound(startX, startY, nextX, nextY, n, isNatural, isForce);
                }
            };
            if (n > 0 && (isForce
                    || (shadowMap[x][y] === undefined
                        || (isNatural && shadowMap[x][y] % 1000 < n)
                        || (!isNatural && Math.floor(shadowMap[x][y] / 1000) < n)))) {

                if(isNatural){
                    if(shadowMap[x][y] === undefined){
                        shadowMap[x][y] = n;
                    } else {
                        shadowMap[x][y] = Math.floor(shadowMap[x][y] / 1000) * 1000 + n;
                    }
                } else{
                    if(shadowMap[x][y] === undefined){
                        shadowMap[x][y] = n * 1000;
                    } else {
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
        this.deleteLightRound = (startX, startY, x, y, n, isNatural) => {
            let lights = [];
            const deleteLightNoUpdateRound = (startX, startY, x, y, n, isNatural) => {
                const step = (nextX, nextY, n) => {
                    if(n > 0 && (startX - x) * (startX - x) + (startY - y) * (startY - y) <
                        (startX - nextX) * (startX - nextX) + (startY - nextY) * (startY - nextY)
                        && nextX >= 0 && nextY >= 0 && nextX < width && nextY < height) {

                        if(isNatural && shadowMap[nextX][nextY] % 1000 > n) {
                            lights.push([nextX, nextY, shadowMap[nextX][nextY] % 1000, isNatural]);
                            return;
                        } else if(!isNatural && Math.floor(shadowMap[nextX][nextY] / 1000) > n) {
                            lights.push([nextX, nextY, Math.floor(shadowMap[nextX][nextY] / 1000), isNatural]);
                            return;
                        }
                        deleteLightNoUpdateRound(startX, startY, nextX, nextY, n, isNatural);
                    }
                };
                if (n > 0
                    && ((isNatural && shadowMap[x][y] % 1000 === n)
                        || (!isNatural && Math.floor(shadowMap[x][y] / 1000) === n))) {

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
            deleteLightNoUpdateRound(startX, startY, x, y, n, isNatural);
            for(let i = 0; i < lights.length; i++){
                this.addLightRound(lights[i][0], lights[i][1], lights[i][0], lights[i][1], lights[i][2], lights[i][3],
                    true);
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
            // Текучая вода - блок без гравитации
            return cnt;
        };

        // Есть ли коллизия с этим блоком
        this.hasCollision = (x, y, layout) => {
            if(x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
            let block = this.map[x][y][layout];
			
            // Если это не блок воздуха и если он имеет коллизию или не найден в таблице => есть коллизия
            if(block != undefined && (items[block] === undefined || items[block].isCollissed)) {
                return true;
            }
            return false;
        };

        this.updateBlock = (x, y, layout, player) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            if (this.map[x][y][layout] === undefined) return;
            let block = items[this.map[x][y][layout]];
            if (block === undefined) return;

            if (block.hasGravity) {
                // Если нет блока снизу
                if ((y - 1) >=0 && items[this.map[x][y - 1][layout]] === undefined) {
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

                    if (y - 1 >= 0 && this.map[x][y - 1][GameArea.MAIN_LAYOUT] === undefined) {
                        for (let i = x - 1; i <= x + 1; i++) {
                            if (i >=0 && i < this.width && (this.map[x][y - 1][layout] === undefined ||
                                items[this.map[x][y - 1][layout]].type !== "wood")) {}
                            else {
                                return;
                            }
                        }
                        this.goodDestroy(x, y, layout, player);
                    }
                }
                break;
                case "leaf":
                    // Если блок листвы не видит под собой опоры в нижнем, нижнем левом и нижнем правом блоке в виде
                    // дерева или листвы или же в левом или правом, в виде дерева, то он рушится
                {
                    for (let i = x - 1; i <= x + 1; i++) {
                        if (i >=0 && i < this.width)
                            for (let j = y - 1; j <= y; j++) {
                                if (i !== x && j !== y)
                                    if (y - 1 >= 0 && j === y - 1)
                                        if (this.map[i][j][layout] === undefined ||
                                            items[this.map[i][j][layout]].type !== "leaf" &&
                                            items[this.map[i][j][layout]].type !== "wood"){}
                                        else return;
                                    else if (this.map[i][j][layout] === undefined ||
                                        items[this.map[i][j][layout]].type !== "wood") {}
                                    else return;
                            }
                    }
                    this.destroyBlock(x, y, layout);
                }
                    break;
                case "water": {
                    const LIQUID_TYPE = +block.id + 1;
                    if (this.map[x][y - 1][layout] === undefined) {
                        setTimeout(() => {
                            if (this.map[x][y - 1][layout] === undefined) {
                                this.placeBlock(x, y - 1, layout, this.makeFlowingWaterBlock(LIQUID_TYPE*1000 + 16));
                            }
                        })
                    } else if (Math.floor((this.map[x][y - 1][layout] - LIQUID_TYPE*1000) / 8) !== 2) {
                        if (this.map[x - 1][y][layout] === undefined) {
                            setTimeout(() => {
                                if (this.map[x - 1][y][layout] === undefined) {
                                    this.placeBlock(x - 1, y, layout, this.makeFlowingWaterBlock(LIQUID_TYPE*1000));
                                }
                            }, 200);
                        }
                        if (this.map[x + 1][y][layout] === undefined) {
                            setTimeout(() => {
                                if (this.map[x + 1][y][layout] === undefined) {
                                    this.placeBlock(x + 1, y, layout, this.makeFlowingWaterBlock(LIQUID_TYPE*1000 + 8));
                                }
                            }, 200);
                        }
                    }
                }
                    break;

                case "flowingWater": {
                    const LIQUID_TYPE = Math.floor(+block.id / 1000);
                    const power = (+block.id - 1000 * LIQUID_TYPE) % 8;
                    if (this.map[x + 1][y][layout] !== (LIQUID_TYPE - 1)
                        && this.map[x - 1][y][layout] !== (LIQUID_TYPE - 1)
                        && this.map[x][y + 1][layout] !== (LIQUID_TYPE - 1)
                        && (!this.map[x + 1][y][layout]
                            || (this.map[x + 1][y][layout] - 1000 * LIQUID_TYPE) % 8 >= power
                            || this.map[x + 1][y][layout] < 1000 * LIQUID_TYPE)
                        && (!this.map[x - 1][y][layout]
                            || (this.map[x - 1][y][layout] - 1000 * LIQUID_TYPE) % 8 >= power
                            || this.map[x - 1][y][layout] < 1000 * LIQUID_TYPE)
                        && (!this.map[x][y + 1][layout]
                            || (this.map[x][y + 1][layout] - 1000 * LIQUID_TYPE) % 8 > power
                            || this.map[x][y + 1][layout] < 1000 * LIQUID_TYPE)) {

                        setTimeout(() => {
                            if (this.map[x][y][layout] === +block.id) this.destroyBlock(x, y, layout);
                        }, 50);
                    } else {

                        let direction = Math.floor((+block.id - 1000 * LIQUID_TYPE) / 8);
                        if (this.map[x][y - 1][layout] === undefined) {

                            setTimeout(() => {
                                if (this.map[x][y][layout] === +block.id)
                                    this.placeBlock(x, y - 1, layout,
                                        this.makeFlowingWaterBlock(this.map[x][y][layout] + 8 * (2 - direction)));
                            }, 50);
                        } else if (this.map[x][y - 1][layout] !== undefined
                            && items[this.map[x][y - 1][layout]].type !== "flowingWater"
                            && +block.id !== 1000 * LIQUID_TYPE + 23 && direction === Math.floor((+block.id - 1000 * LIQUID_TYPE + 1) / 8)) {

                            if (this.map[x - 1][y][layout] === undefined && direction !== 1) {

                                if (direction === 0) setTimeout(() => {
                                    if (this.map[x][y][layout] === +block.id
                                        && this.map[x - 1][y][layout] === undefined) {

                                        this.placeBlock(x - 1, y,
                                            layout, this.makeFlowingWaterBlock(this.map[x][y][layout] + 1));
                                    }
                                }, 200);
                                else {
                                    setTimeout(() => {
                                        if (this.map[x][y][layout] === +block.id
                                            && this.map[x - 1][y][layout] === undefined) {

                                            this.placeBlock(x - 1, y,
                                                layout, this.makeFlowingWaterBlock(this.map[x][y][layout] - 15));
                                        }
                                    }, 200);
                                }
                            } else if (this.map[x + 1][y][layout] === undefined && direction !== 0) {
                                if (direction === 1) {
                                    setTimeout(() => {
                                        if (this.map[x][y][layout] === +block.id
                                            && this.map[x + 1][y][layout] === undefined) {

                                            this.placeBlock(x + 1, y,
                                                layout, this.makeFlowingWaterBlock(this.map[x][y][layout] + 1));
                                        }
                                    }, 200);
                                } else {
                                    setTimeout(() => {
                                        if (this.map[x][y][layout] === +block.id
                                            && this.map[x + 1][y][layout] === undefined) {

                                            this.placeBlock(x + 1, y,
                                                layout, this.makeFlowingWaterBlock(this.map[x][y][layout] - 7));
                                        }
                                    }, 200);
                                }
                            }
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
        this.updateRadius = (x, y, layout, player) => {
            for (let i = x - 1; i <= x + 1; i++) {
                for (let j = y - 1; j <= y + 1; j++) {
                    if (i !== x || y !== j) {
                        this.updateBlock(i, j, layout, player);
                        if (layout === GameArea.MAIN_LAYOUT) this.updateBlock(i, j, GameArea.BACK_LAYOUT, player);
                    }
                }
            }
        };

        // Действие при разрушении блока
        this.destroyBlock = (x, y, layout, player) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            let lastBlock = this.map[x][y][layout];
            this.map[x][y][layout] = this.makeAirBlock();
            if(layout === GameArea.MAIN_LAYOUT) {
                this.deleteLightRound(x, y, x, y, items[lastBlock].brightness,
                    items[lastBlock].isNaturalLight === true);
            }
            this.addLightRound(x, y, x, y, 9, true, false);
            this.updateRadius(x, y, layout, player);
        };

        // Можно ставить блок на (x, y, layout)
        this.canPlace = (x, y, layout) => {
            if(layout === GameArea.MAIN_LAYOUT) {
                let startX = Math.floor(player.x - Player.WIDTH / 2);
                let endX = Math.floor(player.x + Player.WIDTH / 2);
                let startY = Math.floor(player.y);
                let endY = Math.floor(player.y + Player.HEIGHT);
                return x >= 0 && y >= 0 && x < this.width && y < this.height // Пределы мира
                    && !(x >= startX && x <= endX && y >= startY && y <= endY) // Площадь игрока
                    && (this.map[x][y][GameArea.MAIN_LAYOUT] == undefined
                    || this.map[x][y][GameArea.MAIN_LAYOUT].type == "water");
            } else {
                return x >= 0 && y >= 0 && x < this.width && y < this.height // Пределы мира
                    && this.map[x][y][layout] == undefined;
            }
        }

        // Можно ли ломать блок на (x, y, layout)
        this.canDestroy = (x, y, layout) => {
            // Если не основной слой, можно ломать только с краёв
            if (layout != GameArea.MAIN_LAYOUT
                && (!this.canPlace(x, y + 1, layout)
                && !this.canPlace(x + 1, y, layout)
                && !this.canPlace(x - 1, y, layout)
                && !this.canPlace(x, y - 1, layout))) return false;

            return x >= 0 && y >= 0 && x < this.width && y < this.height // Пределы мира
                && this.map[x][y][layout] != undefined
                && this.map[x][y][layout].type != "water";
        }

        // Действие при установке блока
        this.placeBlock = (x, y, layout, id) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            if (!this.map[x][y][layout] || (items[this.map[x][y][layout]] && !items[this.map[x][y][layout]].isSolid)) {
                let lastBlock = this.map[x][y][layout];
                this.map[x][y][layout] = id;
                if(layout === GameArea.MAIN_LAYOUT) {
                    if(lastBlock == undefined){
                        this.deleteLightRound(x, y, x, y, 9, true);
                    } else {
                        this.deleteLightRound(x, y, x, y, items[lastBlock].brightness,
                            items[lastBlock].isNaturalLight === true);
                    }
                    this.addLightRound(x, y, x, y, items[id].brightness, items[id].isNaturalLight === true, false);
                }
                this.updateRadius(x, y, layout);
                this.updateBlock(x, y, layout);
            }
        };

        // Функция взаимодействия с блоком
        this.interactWithBlock = (x, y, layout) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) return; // проверка на выход из карты
            console.log("Interaction with block on coordinates : [${x} ${y} ${layout}]");
            let block = items[this.map[x][y][layout]];
            if (block.isClickable) {
                block.interactFunction();
            }
        };

        // Функция сброса лута
        this.dropLoot = (x, y, block) => {
            // Оставил x, y - в будующем лут будет падать там, где разрушен блок, пока падает в инвентарь
            return {
                "id" : items[block.id].dropId ? items[block.id].dropId : block.id,
                "count" : 1
            }
        };


        // Функция разрушения блока со сбросом лута
        this.goodDestroy = (x, y, layout, player) => {
            let block = items[this.map[x][y][layout]];
            if (player) {
                this.destroyBlock(x, y, layout, player);
                player.addToInv(this.dropLoot(x, y, block));
            } else this.destroyBlock(x, y, layout, player);
        };

    }
}

// Константы уровня
GameArea.FORWARD_LAYOUT = 1;
GameArea.MAIN_LAYOUT = 2;
GameArea.BACK_LAYOUT = 3;

// Константы поведения игрового пространства
GameArea.GRAVITY = 100;         // Ускорение свободного падения
