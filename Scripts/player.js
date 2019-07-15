class Player {
    constructor(x, y) {
        // Задаем положение игрока
        this.x = x;
        this.y = y;
        
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

        // Сломать блок на (x, y, MAIN_LAYOUT)
        this.destroy = (x, y) => {
            let type;
            if (this.hand.item && this.hand.info.isTool) {
                type = this.hand.info.type; // блоки какого типа добывает инструмент
            } else {
                type = undefined; // Если в руках не инструмент
            }
            let blockType = blockTable[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].type; // Тип блока
            if (type === blockType) {
                //Вставляет лут в инвентарь - пока что сразу
                this.addToInv(gameArea.goodDestroy(x, y, GameArea.MAIN_LAYOUT));
                this.hand.item.durability--;
                if(this.hand.item.durability < 1){ // Инструмент сломался
                    this.deleteFromInvByIndex(this.fastInv[this.hand.index], 1);
                    this.hand.item = undefined;
                    this.hand.info = undefined;
                }
            } else {
                if(items[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].isAlwaysGoodDestroy){
                    this.addToInv(gameArea.goodDestroy(x, y, GameArea.MAIN_LAYOUT));
                } else {
                    gameArea.destroyBlock(x, y, GameArea.MAIN_LAYOUT);
                }
            }
        };

        // Разместить блок из руки на (x, y, MAIN_LAYOUT)
        this.place = (x, y) => {
            if(this.hand.item && this.hand.info.isBlock && gameArea.canPlace(x, y)) {
                gameArea.placeBlock(x, y, GameArea.MAIN_LAYOUT, this.hand.item);
                this.deleteFromInvByIndex(this.fastInv[this.hand.index], 1);
            }
        };

        // Если можно взаимодействовать - сделать это
        this.interact = (x, y) => {
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
    }
}


Player.ACTION_RADIUS = 12;      // Радиус действия игрока
Player.HEIGHT = 2.8;            // Рост игрока в блоках
Player.WIDTH = 1.5;             // Половина ширины игрока в блоках
Player.SPEED = 15;              // Модификатор скорости игрока
Player.JUMP_SPEED = 30;         // Модификатор максимальной скорости прыжка игрока
Player.CAPACITY = 500;          // Максимальный носимый вес по умолчанию
Player.FAST_INVENTORY_SIZE = 8; // Количество ячеек в инвентаре быстрого доступа