class Player {
    constructor(x, y) {
        // Задаем положение игрока
        this.x = x;
        this.y = y;
        this.fx = x;
        this.fy = y;

        // Очки жизни
        this.hp = 100;

        // Очки дыхания
        this.bp = 100;
        
        // Инвентарь, в начале пуст. Блоки пока не стакаются
        this.inv = {
            "items" : [],
            "count" : [],
            "weight" : 0,
            "capacity" : Player.CAPACITY
        }

        // Содержит индекс предмета в инвентаре
        this.fastInv = [];
        for(let i = 0; i < Player.FAST_INVENTORY_SIZE; i++){
            this.fastInv[i] = i;
        }

        // Текущий индекс предмета из быстрого инвентаря
        this.hand = {
            "item" : undefined,
            "info" : undefined,
            "index" : 0
        }
        
        // Скорость игрока
        this.vx = 0;
        this.vy = 0;

        // Сломать блок на (x, y, layout)
        this.destroy = (x, y, layout) => {
            let type;
            if (this.hand.item && this.hand.info.isTool) {
                type = this.hand.info.type; // блоки какого типа добывает инструмент
            } else {
                type = undefined; // Если в руках не инструмент
            }
            let blockType = items[gameArea.map[x][y][layout]].type; // Тип блока
            if (type === blockType) {
                //Вставляет лут в инвентарь - пока что сразу
                this.addToInv(gameArea.goodDestroy(x, y, layout));
                this.hand.item.durability--;
                if(this.hand.item.durability < 1){ // Инструмент сломался
                    this.deleteFromInvByIndex(this.fastInv[this.hand.index], 1);
                    this.hand.item = undefined;
                    this.hand.info = undefined;
                }
            } else {
                if(items[gameArea.map[x][y][layout]].isAlwaysGoodDestroy){
                    this.addToInv(gameArea.goodDestroy(x, y, layout));
                } else {
                    gameArea.destroyBlock(x, y, layout);
                }
            }
        };

        // Разместить блок из руки на (x, y, layout)
        this.place = (x, y, layout) => {
            if(this.hand.item && this.hand.info.isBlock && gameArea.canPlace(x, y, layout)) {
                gameArea.placeBlock(x, y, layout, this.hand.item);
                this.deleteFromInvByIndex(this.fastInv[this.hand.index], 1);
            }
        };

        // Если можно взаимодействовать - сделать это
        this.interact = (x, y, layout) => {
            if (this.inActionRadius(x, y)) {
                gameArea.interactWithBlock(x, y, layout);
            }
        };


        // Функции для управления инвентарём

        /*  Добавить предмет в инвентарь
            Передаваемый объект должен содержать поле id и count(в случае, если не инструмент)
            Также может содержать текущие характеристики, например оставшаяся прочность у инструмента
            Возвращает предмет не влезжший в инвентарь */
        this.addToInv = (item) => {
            // Вставляем предмет в инвентарь, если он стакается
            if(item.count != undefined) {

                // Если даже 1 не влезет
                if(items[item.id].weight + this.inv.weight > this.inv.capacity) {
                    return item;
                }
                for(let i = 0; i < this.inv.items.length; i++) {
                    if(item.id == this.inv.items[i]) {
                        if(items[item.id].weight * item.count + this.inv.weight <= this.inv.capacity) {
                            this.inv.count[i] += item.count;
                            this.inv.weight += item.count * items[item.id].weight;
                            this.setHand(this.hand.index);
                            return undefined;
                        } else {
                            this.inv.count[i] += this.inv.capacity - this.inv.weight;
                            item.count -= this.inv.capacity - this.inv.weight;
                            this.inv.weight = this.inv.capacity;
                            this.setHand(this.hand.index);
                            return item;
                        }
                    }
                }
                for(let i = 0; i <= this.inv.items.length; i++) {
                    if(this.inv.items[i] == undefined) {
                        this.inv.items[i] = item.id;
                        if(items[item.id].weight * item.count + this.inv.weight <= this.inv.capacity) {
                            this.inv.count[i] = item.count;
                            this.inv.weight += item.count * items[item.id].weight;
                            this.setHand(this.hand.index);
                            return undefined;
                        } else {
                            this.inv.count[i] = this.inv.capacity - this.inv.weight;
                            item.count -= this.inv.capacity - this.inv.weight;
                            this.inv.weight = this.inv.capacity;
                            this.setHand(this.hand.index);
                            return item;
                        }
                    }
                }
            } else { //.................................................................... Не стакается
                if(items[item.id].weight + this.inv.weight <= this.inv.capacity) {
                    for(let i = 0; i <= this.inv.items.length; i++) {
                        if(this.inv.items[i] == undefined) {
                            this.inv.items[i] = item;
                            this.inv.count[i] = undefined;
                            this.inv.weight += items[item.id].weight;
                            this.setHand(this.hand.index);
                            return undefined;
                        }
                    }
                } else {
                    return item;
                }
            }
        }

        // Удалить count предметов в инвентаре по индексу index
        this.deleteFromInvByIndex = (index, count) => {
            let drop;
            if(this.inv.items[index] == undefined || this.inv.count[index] < count
                    || this.inv.count[index] == undefined && count > 1) {
                throw new Error(`Can not delete ${count} item(s) on index ${index}`);
            } else {
                drop = {
                    "item" : this.inv.items[index],
                    "count" : count
                }
                if(this.inv.count[index] == undefined || this.inv.count[index] == count){
                    if(this.inv.count[index] == undefined){
                        this.inv.weight -= items[this.inv.items[index].id].weight * count;
                    } else {
                        this.inv.weight -= items[this.inv.items[index]].weight * count;
                    }
                    this.inv.items[index] = undefined;
                    this.inv.count[index] = undefined;
                } else {
                    this.inv.weight -= items[this.inv.items[index]].weight * count;
                    this.inv.count[index] -= count;
                }
            }
            this.setHand(this.hand.index);
            return drop;
        }

        // Поменять местами слоты в инвентаре
        this.invSwapByIndex = (i1, i2) => {
            let item = this.inv.items[i1];
            let count = this.inv.count[i1];
            this.inv.items[i1] = this.inv.items[i2];
            this.inv.count[i1] = this.inv.count[i2];
            this.inv.items[i2] = item;
            this.inv.count[i2] = count;
        }

        // Получение "руки" по индексу в быстром инвентаре
        this.setHand = (index) => {
            this.hand.index = index;
            this.hand.item = this.inv.items[this.fastInv[index]];
            if(this.hand.item == undefined) {
                this.hand.info = undefined;
            } else {
                if(this.hand.item.id == undefined) {
                    this.hand.info = items[this.hand.item];
                } else {
                    this.hand.info = items[this.hand.item.id];
                }
            }

            if(player.hand.item){
                console.log(player.hand.info.name);
            } else {
                console.log("Empty hand");
            }
        }

        // Респаун игрока
        this.respawn = () => {
            location.reload();
            this.x = gameArea.width / 2;
            this.y = gameArea.elevationMap[Math.floor(gameArea.width / 2)] + 1;
            this.hp = 100;
            this.vx = 0;
            this.vy = 0;
        }

        // Смерть игрока
        this.die = () => {
            console.log("You died");
            this.respawn();
        }

        // Получение урона
        this.getDamage = (count) => {
            console.log("Damage - " + count);
            this.hp = Math.max(this.hp - count, 0);
            if(this.hp == 0) {
                this.die();
            }
            console.log("Now you have " + this.hp + " hp");
        }

        // Восстановление здоровья
        this.heal = (count) => {
            this.hp = Math.min(this.hp + count, 100);
        }

        // Урон от падения
        this.fallingDamage = () => {
            this.getDamage(Math.max((Math.abs(this.vy) - 2 * Player.JUMP_SPEED) / 2 / Player.JUMP_SPEED * 100, 0));
        }

        // Урон от удушья
        this.choke = (deltaTime) => {
            if(this.bp > 0) {
                this.bp = Math.max(this.bp - 0.5 * Player.CHOKE_SPEED * deltaTime, 0);
            } else {
                this.getDamage(Player.CHOKE_SPEED * deltaTime);
            }
        }

        // Взять в руку следующий элемент быстрого инвентаря
        this.nextItem = () => {
            this.setHand((this.hand.index + 1) % Player.FAST_INVENTORY_SIZE);
        }

        // Взять в руку предыдущий элемент быстрого инвентаря
        this.previousItem = () => {
            this.setHand((this.hand.index - 1) % Player.FAST_INVENTORY_SIZE);
        }

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

        /*  Коэффициент плотности жидкости, в которой игрок
            0 - игрок не касается жидкости,
            (0..1) - максимальная плотность жидкости, которой касается игрок */
        this.getLiquidK = () => {
            let k = 0;
            let startX = Math.max(Math.floor(this.x - Player.WIDTH / 2), 0);
            let endX = Math.min(Math.floor(this.x + Player.WIDTH / 2), gameArea.width - 1);
            let startY = Math.max(Math.floor(this.y), 0);
            let endY = Math.min(Math.floor(this.y + Player.HEIGHT), gameArea.height - 1);
            for(let x = startX; x <= endX; x++) {
                for(let y = startY; y <= endY; y++) {
                    if(items[gameArea.map[x][y][GameArea.MAIN_LAYOUT]]
                            && items[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].density > k) {
                        k = items[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].density;
                    }
                }
            }
            return k;
        }
    }
}


// Для копирования player из indexedDB
const playerCopy = (player, obj) => {
    player.x = obj.x;
    player.y = obj.y;
    player.fx = obj.fx;
    player.fy = obj.fy;
    player.hp = obj.hp;
    player.bp = obj.bp;
    player.inv = obj.inv;
    player.fastInv = obj.fastInv;
    player.hand = obj.hand;
    player.vx = obj.vx;
    player.vy = obj.vy;
}


Player.ACTION_RADIUS = 12;      // Радиус действия игрока
Player.HEIGHT = 2.8;            // Рост игрока в блоках
Player.WIDTH = 1.5;             // Половина ширины игрока в блоках
Player.SPEED = 15;              // Модификатор скорости игрока
Player.JUMP_SPEED = 30;         // Модификатор максимальной скорости прыжка игрока
Player.CAPACITY = 500;          // Максимальный носимый вес по умолчанию
Player.FAST_INVENTORY_SIZE = 8; // Количество ячеек в инвентаре быстрого доступа
Player.HEAD_X = 0;
Player.HEAD_Y = 3 / 4 * Player.HEIGHT;
Player.CHOKE_SPEED = 15;