class Player {
    constructor(gamearea, x, y) {
        gamearea.setPlayer(x, y); // Задаем положение игрока
        this.inv = []; // Инвентарь, в начале пуст. Блоки пока не стакаются
        this.vx = 0;
        this.vy = 0;
        this.hand = undefined; // Предмет в руках, определяет исход добычи того или иного блока

        this.inActionRadius = (x, y) => {
            if (x < 0 || y < 0 || x >= gamearea.width || y >= gamearea.height) return false; // проверка на выход из карты
            let dx = x - gamearea.player.x;
            let dy = y - gamearea.player.y;
            return Math.floor(Math.sqrt(dx * dx + dy * dy)) <= Player.ACTION_RADIUS;
        };

        this.destroy = (x, y) => {
            if (this.inActionRadius(x, y)) {
                let lt;
                let type;
                if (this.hand && this.hand.isTool) {
                    lt = this.hand.layout; // Блоки какого уровня добывает инструмент
                    type = this.hand.toolType; // блоки какого типа добывает инструмент
                } else {
                    lt = GameArea.MAIN_LAYOUT;
                    type = undefined; // Если в руках не инструмент
                }
                let blockType = gamearea.map[x][y][lt]; // Тип блока
                if (type === blockType) {
                    this.inv.push(gamearea.goodDestroy(x, y, lt)); // вставляет лут в инвентарь - пока что сразу
                } else gamearea.destroyBlock(x, y, lt);
            }
        };

        this.place = (x, y) => {
            // Пока ставим только в MAIN_LAYOUT
            if (this.hand && !this.hand.isTool && this.inActionRadius(x, y)) {
                let id = gamearea.map[x][y][GameArea.MAIN_LAYOUT]; // id того, что там сейчас
                if (id === undefined || !block_table[id].isCollissed) {
                    gamearea.placeBlock(x, y, GameArea.MAIN_LAYOUT, this.hand.id);
                    let ind = this.inv.indexOf(this.hand);
                    if (ind > - 1) this.inv.splice(ind, 1);
                    else console.log(`Error: Block in hand placed, which is not in inventory`);
					this.hand = undefined;
                }
                else console.log(`Impossible to place block on ${x} ${y}`)
            }
        };

        this.interact = (x, y) => {
            // Если можно взаимодействовать - сделать это
            // Пока взаимодействуем только в MAIN_LAYOUT
            if (this.inActionRadius(x, y)) {
                gamearea.interactWithBlock(x, y, GameArea.MAIN_LAYOUT);
            }
        };

        this.info = (x, y) => {
            // Получение информации о блоке, пока только в MAIN_LAYOUT
            if (this.inActionRadius(x, y)) {
                let block = block_table[gamearea.map[x][y][GameArea.MAIN_LAYOUT]];
                alert(`Block on ${x} ${y} : ` + JSON.stringify(block));
            }
        };

        // Движение игрока относительно его координат
        this.movePlayer = (deltaT) => {
            let newX = gamearea.player.x + this.vx*deltaT;
            let newY = gamearea.player.y + this.vy*deltaT;

            if (newX - Player.HALF_WIDTH >= 0 && newX + Player.HALF_WIDTH <= gamearea.width && newY >= 0 && newY + Player.HEIGHT <= gamearea.height) {
                let mapX = Math.floor(newX);
                let mapY = Math.floor(newY);
                if (this.vx > 0) {
                    if (this.checkRightCol(newX, newY)) {
                        if (this.vy > 0) {
                            if (this.checkUpCol(newX, newY)) {
                                gamearea.setPlayer(newX, newY);
                                console.log(`Moved to ${newX} ${newY} Map Coord : ${mapX} ${mapY}`);
                                this.vx /= 2;
                                this.vy /= 2;
                            } else {
                                this.vx = 0;
                                this.vy = 0;
                            }
                        } else {
                            if (this.checkDownCol(newX, newY)) {
                                gamearea.setPlayer(newX, newY);
                                console.log(`Moved to ${newX} ${newY} Map Coord : ${mapX} ${mapY}`);
                                this.vx /= 2;
                                this.vy /= 2;
                            } else {
                                this.vx = 0;
                                this.vy = 0;
                            }
                        }
                    } else {
                       this.vx = 0;
                       this.vy = 0;
                    }
                } else if (this.vx < 0) {
                    if (this.checkLeftCol(newX, newY)) {
                        if (this.vy > 0) {
                            if (this.checkUpCol(newX, newY)) {

                                gamearea.setPlayer(newX, newY);
                                console.log(`Moved to ${newX} ${newY} Map Coord : ${mapX} ${mapY}`);
                                this.vx /= 2;
                                this.vy /= 2;
                            } else {
                                this.vx = 0;
                                this.vy = 0;
                            }
                        } else {
                            if (this.checkDownCol(newX, newY)) {
                                gamearea.setPlayer(newX, newY);
                                console.log(`Moved to ${newX} ${newY} Map Coord : ${mapX} ${mapY}`);
                                this.vx /= 2;
                                this.vy /= 2;
                            } else {
                                this.vx = 0;
                                this.vy = 0;
                            }
                        }
                    } else {
                        this.vx = 0;
                        this.vy = 0;
                    }
                } else {
                    if (this.vy > 0 && this.checkUpCol(newX, newY)) {
                        gamearea.setPlayer(newX, newY);
                        console.log(`Moved to ${newX} ${newY} Map Coord : ${mapX} ${mapY}`);
                        this.vx /= 2;
                        this.vy /= 2;
                    } else if (this.vy < 0 && this.checkDownCol(newX, newY)) {
                        gamearea.setPlayer(newX, newY);
                        console.log(`Moved to ${newX} ${newY} Map Coord : ${mapX} ${mapY}`);
                        this.vx /= 2;
                        this.vy /= 2;
                    } else if (this.vy !== 0) {
                        this.vx = 0;
                        this.vy = 0;
                    }
                }
            } else {
                console.log(`Attempt to move player to invalid coordinates: ${newX} ${newY}`);
                this.vx = 0;
                this.vy = 0;
            }
        };

        // Меняет скорость игрока
        this.adjustSpeed = (vx, vy) => {
            this.vx += vx;
            this.vy += vy;
        };

        this.takeInHand = (invNum) => {
            let id = this.inv[invNum];
            if (id !== undefined) this.hand = block_table[id];
        };


        // Функции, проверяющие доступность движения по направлениям
        this.checkRightCol = (newX, newY) => {
            for (let y = Math.ceil(newY + Player.HEIGHT); y > Math.floor(newY); y--) {
                if (gamearea.map[Math.floor(newX + Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT] &&
                    (block_table[gamearea.map[Math.floor(newX + Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]] === undefined ||
                    block_table[gamearea.map[Math.floor(newX + Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    console.log(`Attempt to move to collised block: x : ${Math.floor(newX + Player.HALF_WIDTH)} y : ${y} block id : ${gamearea.map[Math.floor(newX + Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]}`);
                    return false;
                }
            }
            return true;
        };

        this.checkLeftCol = (newX, newY) => {
            for (let y = Math.ceil(newY + Player.HEIGHT); y > Math.floor(newY); y--) {
                if (gamearea.map[Math.floor(newX - Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT] &&
                    (block_table[gamearea.map[Math.floor(newX - Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]] === undefined ||
                    block_table[gamearea.map[Math.floor(newX - Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    console.log(`Attempt to move to collised block: x : ${Math.floor(newX - Player.HALF_WIDTH)} y : ${y} block id : ${gamearea.map[Math.floor(newX - Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]}`);
                    return false;
                }
            }
            return true;
        };

        this.checkUpCol = (newX, newY) => {
            for (let x = newX - Player.HALF_WIDTH; Math.floor(x) <= Math.floor(newX + Player.HALF_WIDTH); x++) {
                if (gamearea.map[Math.floor(x)][Math.ceil(newY + Player.HEIGHT)][GameArea.MAIN_LAYOUT] &&
                    (block_table[gamearea.map[Math.floor(x)][Math.ceil(newY + Player.HEIGHT)][GameArea.MAIN_LAYOUT]] === undefined ||
                    block_table[gamearea.map[Math.floor(x)][Math.ceil(newY + Player.HEIGHT)][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    console.log(`Attempt to move to collised block: x : ${Math.floor(x)} y : ${Math.ceil(newY + Player.HEIGHT)} block id : ${gamearea.map[Math.floor(x)][Math.ceil(newY + Player.HEIGHT)][GameArea.MAIN_LAYOUT]}`);
                    return false;
                }
            }
            return true;
        };

        this.checkDownCol = (newX, newY) => {
            for (let x = newX - Player.HALF_WIDTH; Math.floor(x) <= Math.floor(newX + Player.HALF_WIDTH); x++) {
                if (gamearea.map[Math.floor(x)][Math.floor(newY + 1)][GameArea.MAIN_LAYOUT] &&
                    (block_table[gamearea.map[Math.floor(x)][Math.floor(newY + 1)][GameArea.MAIN_LAYOUT]] === undefined ||
                    block_table[gamearea.map[Math.floor(x)][Math.floor(newY + 1)][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    console.log(`Attempt to move to collised block: x : ${Math.floor(x)} y : ${Math.floor(newY + 1)} block id : ${gamearea.map[Math.floor(x)][Math.floor(newY + 1)][GameArea.MAIN_LAYOUT]}`);
                    return false;
                }
            }
            return true;
        }
    }
}


Player.ACTION_RADIUS = 12; // Радиус действия игрока
Player.HEIGHT = 2.8; // "Рост" игрока в блоках
Player.HALF_WIDTH = 0.75; // Половина ширины игрока в блоках
Player.SPEED = 10; // Модификатор скорости игрока