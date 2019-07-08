class Player {
    constructor(gamearea, x, y) {
        gamearea.setPlayer(x, y); // Задаем положение игрока
        this.inv = []; // Инвентарь, в начале пуст. Блоки пока не стакаются

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

        // Движение игрока относительно его координат
        this.movePlayer = (dx, dy) => {
            let newX = gamearea.player.x + dx;
            let newY = gamearea.player.y + dy;
            if (newX >= 0 && newX <= gamearea.width && newY >= 0 && newY <= gamearea.height) {
                if (!gamearea.map[newX][newY][GameArea.MAIN_LAYOUT] || gamearea.map[newX][newY][GameArea.MAIN_LAYOUT].isCollissed) {
                    gamearea.setPlayer(newX, newY);
                } else console.log(`Attempt to move player at collissed block: ${x} ${y}`);
            } else {
                console.log(`Attempt to move player to invalid coordinates: ${x} ${y}`);
            }
        };

        this.takeInHand = (invNum) => {
            let id = this.inv[invNum];
            if (id !== undefined) this.hand = block_table[id];
        }
    }
}


Player.ACTION_RADIUS = 12; // Радиус действия игрока