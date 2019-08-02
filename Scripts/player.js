class Player {
    constructor(x, y) {
        // Задаем положение игрока
        this.x = x;
        this.y = y;
        this.fx = x;
        this.fy = y;
        this.layout = GameArea.FIRST_LAYOUT;
        this.direction = 1;

        this.animation = {
            head : {
                go: false,
                name : "idle",
                startTick : 0
            },
            body : {
                go: false,
                name : "idle",
                startTick : 0
            },
            legs : {
                go: false,
                name : "idle",
                startTick : 0
            },
        }

        this.animationStates = {
            head : 0,
            body : 0,
            legs : 0
        }

        // Очки жизни
        this.hp = 100;
        this.maxHP = 100;

        // Очки дыхания
        this.bp = 100;
        this.maxBP = 100;

        // Очки выносливости
        this.sp = 100;
        this.maxSP = 100;

        // Освещение
        this.defaultLight = 0.2;
        this.light = this.defaultLight;
        
        // Инвентарь, в начале пуст. Блоки пока не стакаются
        this.inv = {
            "items" : [],
            "count" : [],
            "weight" : 0,
            "capacity" : Player.CAPACITY
        }

        // Содержит индекс предмета в инвентаре
        this.fastInv = [];
        for (let i = 0; i < Player.FAST_INVENTORY_SIZE; i++) {
            this.fastInv[i] = undefined;
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
               gameArea.goodDestroy(x, y, layout, this);
                this.hand.item.durability--;
                if (this.hand.item.durability < 1) { // Инструмент сломался
                    this.deleteFromInvByIndex(this.fastInv[this.hand.index], 1);
                    this.hand.item = undefined;
                    this.hand.info = undefined;
                }
            } else {
                if (items[gameArea.map[x][y][layout]].isAlwaysGoodDestroy) {
                    gameArea.goodDestroy(x, y, layout, this);
                } else {
                    gameArea.destroyBlock(x, y, layout);
                }
            }
        };

        // Разместить блок из руки на (x, y, layout)
        this.place = (x, y, layout) => {
            if (this.hand.item && this.hand.info.isBlock && gameArea.canPlace(x, y, layout)
                    && (!items[this.hand.item].canPlace || items[this.hand.item].canPlace(x, y, layout))) {
                gameArea.placeBlock(x, y, layout, this.hand.item);

                // Уменьшение выносливости
                player.updateSP(player.sp - this.hand.info.weight);
                staminaNotUsed = false;

                this.deleteFromInvByIndex(this.fastInv[this.hand.index], 1);
            }
        };

        // Если можно взаимодействовать - сделать это
        this.interact = (x, y, layout) => {
            if (this.blockAvailable(x, y, layout)) {
                gameArea.interactWithBlock(x, y, layout);

                // Анимация
                player.setAnimation("body", "kick");
            }
        }

        // Взаимодействовать с ближайшим интерактивным блоком
        this.interactWithNearest = (layout) => {
            let interactArr = [];
            for (let x = Math.floor(this.x - Player.INTERACTION_RADIUS);
                    x <= Math.floor(this.x + Player.INTERACTION_RADIUS); x++) {
                for (let y = Math.floor(this.y + Player.HEIGHT / 2 - Player.INTERACTION_RADIUS);
                        y <= Math.floor(this.y + Player.HEIGHT / 2 + Player.INTERACTION_RADIUS); y++) {
                    if (inRange(x, 0, gameArea.width) && inRange(y, 0, gameArea.height)
                            && gameArea.map[x][y][layout] !== undefined
                            && items[gameArea.map[x][y][layout]].isClickable) {
                        interactArr.push({
                            id: items[gameArea.map[x][y][layout]].id,
                            x: x,
                            y: y
                        })
                    }
                }
            }

            interactArr.sort((a, b) => {
                return hypotenuse(a.x - this.x, a.y - this.y - Player.HEIGHT / 2)
                        - hypotenuse(b.x - this.x, b.y - this.y - Player.HEIGHT / 2);
            });

            for(let i = 0; i < interactArr.length; i++) {
                let block = interactArr[i]; 
                if (this.blockAvailable(block.x, block.y, layout)) {
                    player.direction = Math.sign(block.x + 0.5 - player.x);
                    this.interact(block.x, block.y, layout);
                    break;
                }
            }
        }

        // Можно взаимодействовать через этот блок
        this.canInteractThrough = (x, y, layout) => {
            x = Math.floor(x);
            y = Math.floor(y);
            return gameArea.map[x][y][layout] === undefined
                    || items[gameArea.map[x][y][layout]].isCanInteractThrow;
        }

        // Может дотянуться до блока
        this.blockAvailable = (x, y, layout) => {
        	layout = Math.max(layout, this.layout);
            x = Math.floor(x);
            y = Math.floor(y);
            if (!inRange(x, 0, gameArea.width) || !inRange(y, 0, gameArea.height)
                    || hypotenuse(x + 0.5 - this.x, y + 0.5 - this.y) > Player.ACTION_RADIUS) {
                return false;
            }
            let targetAngles = this.anglesToBlock(x, y);

            let visitedX = new Array();
            let visitedY = new Array();

            // Не рассматриваем текущий блок
            visitedX.push(x);
            visitedY.push(y);

            const isVisited = (x, y) => {
                for (let i = 0; i < visitedX.length; i++) {
                    if (visitedX[i] === x && visitedY[i] === y) {
                        return true;
                    }
                }
                return false;
            }
            // Не мешает ли блок
            const meetBlock = (blockX, blockY) => {
                blockX = Math.floor(blockX);
                blockY = Math.floor(blockY);
                if (!inRange(blockX, 0, gameArea.width) || !inRange(blockY, 0, gameArea.height)) return false;
                if (!this.canInteractThrough(blockX, blockY, layout)) {
                    if (!isVisited(blockX, blockY)) {
                        let angles = this.anglesToBlock(blockX, blockY);
                        let newAngle = angleMax(angles.maxAngle, targetAngles.minAngle);
                        if (targetAngles.minAngle != newAngle) {
                            targetAngles.minAngle = roundTo(newAngle, 360) + Math.PI / 180;
                        }
                        visitedX.push(blockX);
                        visitedY.push(blockY);
                        return true;
                    }
                }
                return false;
            }

            let ansReady = false;
            while (!ansReady) {
                ansReady = true;
                for (let lineX = Math.floor(this.x - Player.ACTION_RADIUS);
                        lineX <= Math.floor(this.x + Player.ACTION_RADIUS); lineX++) {
                    if (between(lineX, this.x, x + 0.5)) {
                        let pX = [ lineX + 0.5, lineX - 0.5 ];
                        let pY = [ (lineX - this.x) * Math.tan(targetAngles.minAngle)
                                        + this.y + Player.HEIGHT / 2,
                                    (lineX - this.x) * Math.tan(targetAngles.minAngle)
                                        + this.y + Player.HEIGHT / 2 ];

                        if (meetBlock(pX[0], pY[0]) || meetBlock(pX[1], pY[1])) {
                            if (targetAngles.minAngle === angleMax(targetAngles.minAngle, targetAngles.maxAngle)) {
                                return false;
                            } else {
                                ansReady = false;
                                continue;
                            }
                        }
                    }
                }

                for (let lineY = Math.floor(this.y - Player.ACTION_RADIUS);
                        lineY <= Math.floor(this.y + Player.ACTION_RADIUS); lineY++) {
                    if (between(lineY, this.y, y + 0.5)) {
                        let pX = [ (lineY - this.y - Player.HEIGHT / 2)
                                            / Math.tan(targetAngles.minAngle) + this.x,
                                    (lineY - this.y - Player.HEIGHT / 2)
                                            / Math.tan(targetAngles.minAngle) + this.x ];
                        let pY = [ lineY + 0.5, lineY - 0.5 ];

                        if (meetBlock(pX[0], pY[0]) || meetBlock(pX[1], pY[1])) {
                            if (targetAngles.minAngle === angleMax(targetAngles.minAngle, targetAngles.maxAngle)) {
                                return false;
                            } else {
                                ansReady = false;
                                continue;
                            }
                        }
                    }
                }
            }
            return true;
        }

        // Рассчитать угол до объекта
        this.angle = (x, y) => {
            return Math.sign(y - this.y - Player.HEIGHT / 2)
                    * Math.acos((x - this.x) / hypotenuse(x - this.x, y - this.y - Player.HEIGHT / 2));
        }

        // Диапозон видимости блока (в углах)
        this.anglesToBlock = (x, y) => {
            let angles = [ this.angle(x, y), this.angle(x + 1, y), this.angle(x, y + 1), this.angle(x + 1, y + 1) ];
            let minAngle = angles[0];
            let maxAngle = angles[0];
            for (let i = 1; i < angles.length; i++) {
                minAngle = angleMin(minAngle, angles[i]);
                maxAngle = angleMax(maxAngle, angles[i]);
            }
            return {
                minAngle : minAngle,
                maxAngle : maxAngle
            }
        }

        // Функции для управления инвентарём

        /*  Добавить предмет в инвентарь
            Передаваемый объект должен содержать поле id и count(в случае, если не инструмент)
            Также может содержать текущие характеристики, например оставшаяся прочность у инструмента
            Возвращает предмет не влезжший в инвентарь */
        this.addToInv = (item) => {
            // Вставляем предмет в инвентарь, если он стакается
            if (item.count != undefined) {

                // Если даже 1 не влезет
                if (items[item.id].weight + this.inv.weight > this.inv.capacity) {
                    return item;
                }
                needCraftRedraw = true;
                for (let i = 0; i < this.inv.items.length; i++) {
                    if (item.id == this.inv.items[i]) {
                        if (items[item.id].weight * item.count + this.inv.weight <= this.inv.capacity) {
                            this.inv.count[i] += item.count;
                            this.inv.weight += item.count * items[item.id].weight;
                            this.setHand(this.hand.index);
                            needInvRedraw = true;
                            return undefined;
                        } else {
                            this.inv.count[i] += this.inv.capacity - this.inv.weight;
                            item.count -= this.inv.capacity - this.inv.weight;
                            this.inv.weight = this.inv.capacity;
                            this.setHand(this.hand.index);
                            needInvRedraw = true;
                            return item;
                        }
                    }
                }
                for (let i = 0; i <= this.inv.items.length; i++) {
                    if (this.inv.items[i] == undefined) {
                        this.inv.items[i] = item.id;
                        if (items[item.id].weight * item.count + this.inv.weight <= this.inv.capacity) {
                            this.inv.count[i] = item.count;
                            this.inv.weight += item.count * items[item.id].weight;
                            this.setHand(this.hand.index);
                            needInvRedraw = true;
                            return undefined;
                        } else {
                            this.inv.count[i] = this.inv.capacity - this.inv.weight;
                            item.count -= this.inv.capacity - this.inv.weight;
                            this.inv.weight = this.inv.capacity;
                            this.setHand(this.hand.index);
                            needInvRedraw = true;
                            return item;
                        }
                    }
                }
            } else { //.................................................................... Не стакается
                if (items[item.id].weight + this.inv.weight <= this.inv.capacity) {
                    for (let i = 0; i <= this.inv.items.length; i++) {
                        if (this.inv.items[i] == undefined) {
                            this.inv.items[i] = item;
                            this.inv.count[i] = undefined;
                            this.inv.weight += items[item.id].weight;
                            this.setHand(this.hand.index);
                            needInvRedraw = true;
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
            if (this.inv.items[index] == undefined || this.inv.count[index] < count
                    || this.inv.count[index] == undefined && count > 1) {
                throw new Error(`Can not delete ${count} item(s) on index ${index}`);
            } else {
                drop = {
                    "item" : this.inv.items[index],
                    "count" : count
                }
                if (this.inv.count[index] == undefined || this.inv.count[index] == count) {
                    if (this.inv.count[index] == undefined) {
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
            needInvRedraw = true;
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

            // Меняем местами слоты быстрого инвентаря
            let fi1, fi2;
            for(let i = 0; i < this.fastInv.length; i++) {
                if (this.fastInv[i] === i1) {
                    fi1 = i;
                }
                if (this.fastInv[i] === i2) {
                    fi2 = i;
                }
            }
            if (fi1 !== undefined) {
                this.fastInv[fi1] = i2;
            }
            if (fi2 !== undefined) {
                this.fastInv[fi2] = i1;
            }

            this.setHand(this.hand.index);
            needInvRedraw = true;
        }

        // Получение "руки" по индексу в быстром инвентаре
        this.setHand = (index) => {
            this.hand.index = index;
            this.hand.item = this.inv.items[this.fastInv[index]];
            if (this.hand.item === undefined) {
                this.hand.info = undefined;
            } else {
                if (this.hand.item.id === undefined) {
                    this.hand.info = items[this.hand.item];
                } else {
                    this.hand.info = items[this.hand.item.id];
                }
            }
            // Свечение предмета в руке
            if (this.hand.info && this.hand.info.brightness) {
                this.light = Math.max(this.defaultLight, this.hand.info.brightness / 9);
            } else {
                this.light = this.defaultLight;
            }

            UISetActiveSlot(index);
            for (let i = 0; i < this.fastInv.length; i++) {
                if (this.inv.items[this.fastInv[i]]) {
                    if (this.inv.items[this.fastInv[i]].id) {
                        UISetFastInvItem(this.inv.items[this.fastInv[i]].id, i);
                    } else {
                        UISetFastInvItem(this.inv.items[this.fastInv[i]], i);
                    }
                } else {
                    UISetFastInvItem(undefined, i);
                }
            }
        }

        // Респаун игрока
        this.respawn = () => {
            location.reload();
            this.x = gameArea.width / 2;
            this.y = gameArea.elevationMap[Math.floor(gameArea.width / 2)] + 1;
            this.hp = this.maxHP;
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
            if (count > 0) {
                this.hp = Math.max(this.hp - count, 0);
                if (this.hp == 0) {
                    this.die();
                }
                UISetBar(this.hp / this.maxHP, UIMap.healthBar, 202, 16, 1, 0);
            }
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
            if (this.bp > 0) {
                this.updateBP(Math.max(this.bp - 0.5 * Player.CHOKE_SPEED * deltaTime, 0));
            } else {
                this.getDamage(Player.CHOKE_SPEED * deltaTime);
            }
        }

        this.updateBP = (count) => {
            this.bp = count;
            if (count >= this.maxBP) {
                this.bp = this.maxBP;
                UIMap.barsPanel.deleteChild(UIMap.breathBar.id);
                UIMap.barsPanel.deleteChild(UIMap.breathBarEmpty.id);
            } else if (!UIMap.barsPanel.get(UIMap.breathBar.id)) {
                UIMap.barsPanel.add(UIMap.breathBar);
                UIMap.barsPanel.add(UIMap.breathBarEmpty);
            }
            UISetBar(this.bp / this.maxBP, UIMap.breathBar, 202, 16, 1, 5);
        }

        this.updateSP = (count) => {
            this.sp = Math.max(0, count);
            if (count >= this.maxSP) {
                this.sp = this.maxSP;
                UIMap.barsPanel.deleteChild(UIMap.staminaBar.id);
                UIMap.barsPanel.deleteChild(UIMap.staminaBarEmpty.id);
            } else {
                if (!UIMap.barsPanel.get(UIMap.staminaBar.id)) {
                    UIMap.barsPanel.add(UIMap.staminaBar);
                    UIMap.barsPanel.add(UIMap.staminaBarEmpty);
                }
            } 
            UISetBar(this.sp / this.maxSP, UIMap.staminaBar, 202, 16, 1, 1);
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
            for (let j = Math.floor(newY); j < Math.ceil(newY + Player.HEIGHT); j++) {
                if (gameArea.hasCollision(i, j, this.layout)) {
                    return true;
                }
            }
            return false;
        }

        // Задевает ли правая грань игрока блоки с коллизией
        this.isCollisionRight = (newX, newY) => {
            let i = Math.floor(newX + Player.WIDTH / 2);
            for (let j = Math.floor(newY); j < Math.ceil(newY + Player.HEIGHT); j++) {
                if (gameArea.hasCollision(i, j, this.layout)) {
                    return true;
                }
            }
            return false;
        }

        // Задевает ли верхняя грань игрока блоки с коллизией
        this.isCollisionUp = (newX, newY) => {
            let j = Math.floor(newY + Player.HEIGHT);
            for (let i = Math.floor(newX - Player.WIDTH / 2); i < Math.ceil(newX + Player.WIDTH / 2); i++) {
                if (gameArea.hasCollision(i, j, this.layout)) {
                    return true;
                }
            }
            return false;
        }

        // Задевает ли нижняя грань игрока блоки с коллизией
        this.isCollisionDown = (newX, newY) => {
            let j = Math.floor(newY);
            for (let i = Math.floor(newX - Player.WIDTH / 2); i < Math.ceil(newX + Player.WIDTH / 2); i++) {
                if (gameArea.hasCollision(i, j, this.layout)) {
                    return true;
                }
            }
            return false;
        }

        // Стоит ли на поверхности
        this.onGround = () => {
            if (this.y - 0.0001 < 0) return true;
            return this.isCollisionDown(this.fx, this.fy - 0.0001);
        }

        // Может ли вместиться игрок на x, y, layout
        this.canStay = (x, y, layout) => {
            let startX = Math.max(Math.floor(x - Player.WIDTH / 2), 0);
            let endX = Math.min(Math.floor(x + Player.WIDTH / 2), gameArea.width - 1);
            let startY = Math.max(Math.floor(y), 0);
            let endY = Math.min(Math.floor(y + Player.HEIGHT), gameArea.height - 1);
            for (let i = startX; i <= endX; i++) {
                for (let j = startY; j <= endY; j++) {
                    if(gameArea.hasCollision(i, j, layout)) return false;
                }
            }
            return true;
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
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    if (items[gameArea.map[x][y][this.layout]]
                            && items[gameArea.map[x][y][this.layout]].density > k) {
                        k = items[gameArea.map[x][y][this.layout]].density;
                    }
                }
            }
            return k;
        }

        this.getLight = () => {
            let light = 0;
            let n = 0;
            let startX = Math.max(Math.floor(this.x - Player.WIDTH / 2), 0);
            let endX = Math.min(Math.floor(this.x + Player.WIDTH / 2), gameArea.width - 1);
            let startY = Math.max(Math.floor(this.y), 0);
            let endY = Math.min(Math.floor(this.y + Player.HEIGHT), gameArea.height - 1);
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    n++;
                    light += gameArea.getLight(x, y);
                }
            }
            return Math.max(0.2, light / n);
        }

        this.setAnimation = (part, animation) => {
            if (this.animation[part].name !== animation) {
                this.animation[part].name = animation;
                this.animation[part].startTick = animationsTickCount;
            }
            this.animation[part].go = true;
        }

        this.animate = () => {
            if (!this.animation.head.go) {
                if (animationsTickCount - this.animation.head.startTick
                        >= animations.player.head[this.animation.head.name].length) {
                    this.animationStates.head = 0;
                } else {
                    this.animationStates.head = animations.player.head[this.animation.head.name]
                                                                [animationsTickCount - this.animation.head.startTick];
                }
            } else {
                if (animationsTickCount - this.animation.head.startTick
                        >= animations.player.head[this.animation.head.name].length) {
                    this.animation.head.startTick = animationsTickCount;
                }

                this.animationStates.head = animations.player.head[this.animation.head.name]
                                                                [animationsTickCount - this.animation.head.startTick];
            }

            if (!this.animation.body.go) {
                if (animationsTickCount - this.animation.body.startTick
                        >= animations.player.body[this.animation.body.name].length) {
                    this.animationStates.body = 0;
                } else {
                    this.animationStates.body = animations.player.body[this.animation.body.name]
                                                                [animationsTickCount - this.animation.body.startTick];
                }
            } else {
                if (animationsTickCount - this.animation.body.startTick
                        >= animations.player.body[this.animation.body.name].length) {
                    this.animation.body.startTick = animationsTickCount;
                }

                this.animationStates.body = animations.player.body[this.animation.body.name]
                                                                [animationsTickCount - this.animation.body.startTick];
            }

            if (!this.animation.legs.go) {
                if (animationsTickCount - this.animation.legs.startTick
                        >= animations.player.legs[this.animation.legs.name].length) {
                    this.animationStates.legs = 0;
                } else {
                    this.animationStates.legs = animations.player.legs[this.animation.legs.name]
                                                                [animationsTickCount - this.animation.legs.startTick];
                }
            } else {
                if (animationsTickCount - this.animation.legs.startTick
                        >= animations.player.legs[this.animation.legs.name].length) {
                    this.animation.legs.startTick = animationsTickCount;
                }

                this.animationStates.legs = animations.player.legs[this.animation.legs.name]
                                                                [animationsTickCount - this.animation.legs.startTick];
            }
            
            this.animation.head.go = false;
            this.animation.body.go = false;
            this.animation.legs.go = false;
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
    player.layout = obj.layout;
}

// Константы
Player.ACTION_RADIUS = 12;      // Радиус действия игрока
Player.INTERACTION_RADIUS = 5;  // Радиус взаимодействия с интерактивными блоками
Player.HEIGHT = 2.8;            // Рост игрока в блоках
Player.WIDTH = 1.5;             // Половина ширины игрока в блоках
Player.SPEED = 15;              // Модификатор скорости игрока
Player.JUMP_SPEED = 30;         // Модификатор максимальной скорости прыжка игрока
Player.CAPACITY = 500;          // Максимальный носимый вес по умолчанию
Player.FAST_INVENTORY_SIZE = 8; // Количество ячеек в инвентаре быстрого доступа
Player.HEAD_X = 0;
Player.HEAD_Y = 3 / 4 * Player.HEIGHT;
Player.CHOKE_SPEED = 15;