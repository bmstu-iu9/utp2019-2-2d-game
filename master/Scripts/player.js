class Player {
    constructor(x, y) {
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
            if (x < 0 || y < 0 || x >= gameArea.width || y >= gameArea.height) return false; // проверка на выход из карты
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
                    lt = gameArea.MAIN_LAYOUT;
                    type = undefined; // Если в руках не инструмент
                }
                let blockType = gameArea.map[x][y][lt]; // Тип блока
                if (type === blockType) {
                    this.inv.push(gameArea.goodDestroy(x, y, lt)); // вставляет лут в инвентарь - пока что сразу
                } else gameArea.destroyBlock(x, y, lt);
            }
        };

        this.place = (x, y) => {
            // Пока ставим только в MAIN_LAYOUT
            if (this.hand && !this.hand.isTool && this.inActionRadius(x, y)) {
                let id = gameArea.map[x][y][gameArea.MAIN_LAYOUT]; // id того, что там сейчас
                if (id === undefined || !blockTable[id].isCollissed) {
                    gameArea.placeBlock(x, y, gameArea.MAIN_LAYOUT, this.hand.id);
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
                gameArea.interactWithBlock(x, y, gameArea.MAIN_LAYOUT);
            }
        };

        // Получение информации о блоке, пока только в MAIN_LAYOUT
        this.info = (x, y) => {
            if (this.inActionRadius(x, y)) {
                let block = blockTable[gameArea.map[x][y][gameArea.MAIN_LAYOUT]];
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


        // Проверка коллизии граней игрока с блоками

        // Задевает ли левая грань игрока блоки с коллизией
        this.isCollisionLeft = (newX, newY) => {
            let i = Math.floor(newX - Player.WIDTH / 2);
            for(let j = Math.floor(newY); j < Math.ceil(newY + Player.HEIGHT); j++) {
                if(gameArea.hasCollision(i, j, GameArea.MAIN_LAYOUT)){
                    return true;
                }
            }
            return false;
        }

        // Задевает ли правая грань игрока блоки с коллизией
        this.isCollisionRight = (newX, newY) => {
            let i = Math.floor(newX + Player.WIDTH / 2);
            for(let j = Math.floor(newY); j < Math.ceil(newY + Player.HEIGHT); j++) {
                if(gameArea.hasCollision(i, j, GameArea.MAIN_LAYOUT)){
                    return true;
                }
            }
            return false;
        }

        // Задевает ли верхняя грань игрока блоки с коллизией
        this.isCollisionUp = (newX, newY) => {
            let j = Math.floor(newY + Player.HEIGHT);
            for(let i = Math.floor(newX - Player.WIDTH / 2); i < Math.ceil(newX + Player.WIDTH / 2); i++) {
                if(gameArea.hasCollision(i, j, GameArea.MAIN_LAYOUT)){
                    return true;
                }
            }
            return false;
        }

        // Задевает ли нижняя грань игрока блоки с коллизией
        this.isCollisionDown = (newX, newY) => {
            let j = Math.floor(newY);
            for(let i = Math.floor(newX - Player.WIDTH / 2); i < Math.ceil(newX + Player.WIDTH / 2); i++) {
                if(gameArea.hasCollision(i, j, GameArea.MAIN_LAYOUT)){
                    return true;
                }
            }
            return false;
        }

        // Стоит ли на поверхности
        this.onGround = () => {
            if(this.y - 0.0001 < 0) return true;
            return this.isCollisionDown(this.x, this.y - 0.0001);
        }
    }
}


Player.ACTION_RADIUS = 12;      // Радиус действия игрока
Player.HEIGHT = 2.8;            // "Рост" игрока в блоках
Player.WIDTH = 1.5;             // Половина ширины игрока в блоках
Player.SPEED = 15;              // Модификатор скорости игрока
Player.JUMP_SPEED = 30;         // Модификатор максимальной скорости прыжка игрока