class Player {
    constructor(gamearea, x, y) {
        // Задаем положение игрока
        this.x = x;
        this.y = y;
        
        // Инвентарь, в начале пуст. Блоки пока не стакаются
        this.inv = [];
        
        // Скорость игрока
        this.vx = 0;
        this.vy = 0;

        // Предмет в руках, определяет исход добычи того или иного блока
        this.hand = undefined;

        this.inActionRadius = (x, y) => {
            if (x < 0 || y < 0 || x >= gamearea.width || y >= gamearea.height) return false; // проверка на выход из карты
            let dx = x - this.x;
            let dy = y - this.y;
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
                if (id === undefined || !blockTable[id].isCollissed) {
                    gamearea.placeBlock(x, y, GameArea.MAIN_LAYOUT, this.hand.id);
                    let ind = this.inv.indexOf(this.hand);
                    if (ind > - 1) this.inv.splice(ind, 1);
					this.hand = undefined;
                }
            }
        };

        this.interact = (x, y) => {
            // Если можно взаимодействовать - сделать это
            // Пока взаимодействуем только в MAIN_LAYOUT
            if (this.inActionRadius(x, y)) {
                gamearea.interactWithBlock(x, y, GameArea.MAIN_LAYOUT);
            }
        };

        // Получение информации о блоке, пока только в MAIN_LAYOUT
        this.info = (x, y) => {
            if (this.inActionRadius(x, y)) {
                let block = blockTable[gamearea.map[x][y][GameArea.MAIN_LAYOUT]];
                alert(`Block on ${x} ${y} : ` + JSON.stringify(block));
            }
        };

        // Установка игрока по координатам
        this.moveTo = (x, y) => {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) throw new Error("Going beyond the world");
            this.x = x;
            this.y = y;
        };

        // Меняет скорость игрока
        this.adjustSpeed = (vx, vy) => {
            this.vx += vx;
            this.vy += vy;
        };

        this.takeInHand = (invNum) => {
            let id = this.inv[invNum];
            if (id !== undefined) this.hand = blockTable[id];
        };


        // Функции, проверяющие доступность движения по направлениям
        this.checkRightCol = (newX, newY) => {
            for (let y = Math.ceil(newY + Player.HEIGHT); y > Math.floor(newY); y--) {
                if (gamearea.map[Math.floor(newX + Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT] &&
                    (blockTable[gamearea.map[Math.floor(newX + Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]] === undefined ||
                    blockTable[gamearea.map[Math.floor(newX + Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    return false;
                }
            }
            return true;
        };

        this.checkLeftCol = (newX, newY) => {
            for (let y = Math.ceil(newY + Player.HEIGHT); y > Math.floor(newY); y--) {
                if (gamearea.map[Math.floor(newX - Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT] &&
                    (blockTable[gamearea.map[Math.floor(newX - Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]] === undefined ||
                    blockTable[gamearea.map[Math.floor(newX - Player.HALF_WIDTH)][y][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    return false;
                }
            }
            return true;
        };

        this.checkUpCol = (newX, newY) => {
            for (let x = newX - Player.HALF_WIDTH; Math.floor(x) <= Math.floor(newX + Player.HALF_WIDTH); x++) {
                if (gamearea.map[Math.floor(x)][Math.ceil(newY + Player.HEIGHT)][GameArea.MAIN_LAYOUT] &&
                    (blockTable[gamearea.map[Math.floor(x)][Math.ceil(newY + Player.HEIGHT)][GameArea.MAIN_LAYOUT]] === undefined ||
                    blockTable[gamearea.map[Math.floor(x)][Math.ceil(newY + Player.HEIGHT)][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    return false;
                }
            }
            return true;
        };

        this.checkDownCol = (newX, newY) => {
            for (let x = newX - Player.HALF_WIDTH; Math.floor(x) <= Math.floor(newX + Player.HALF_WIDTH); x++) {
                if (gamearea.map[Math.floor(x)][Math.floor(newY + 1)][GameArea.MAIN_LAYOUT] &&
                    (blockTable[gamearea.map[Math.floor(x)][Math.floor(newY + 1)][GameArea.MAIN_LAYOUT]] === undefined ||
                    blockTable[gamearea.map[Math.floor(x)][Math.floor(newY + 1)][GameArea.MAIN_LAYOUT]].isCollissed)) {
                    return false;
                }
            }
            return true;
        }

        this.onGround = () => {
            return !this.checkDownCol(x, y - 0.0001);
        }
    }
}


Player.ACTION_RADIUS = 12; // Радиус действия игрока
Player.HEIGHT = 2.8; // "Рост" игрока в блоках
Player.HALF_WIDTH = 0.75; // Половина ширины игрока в блоках
Player.SPEED = 15; // Модификатор скорости игрока
Player.JUMP_SPEED = 31; // Модификатор скорости игрока