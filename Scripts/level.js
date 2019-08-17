'use strict';

/*
const cameraScale = 1;                  Масштаб, 1 - стандарт
const blockSize = 32                    Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;           Положение камеры
const chankWidth = 8, chankHeight = 8   Размеры чанка
const minLayout = 2, maxLayout = 3      Обрабатываемые слои
const blockResolution = 32              Разрешение текстуры блока
let deltaTime = 0                       Изменение времени между кадрами в секундах
let gameArea;                           Игровой мир (объект GameArea)
cameraSet(x, y)                         Устанавливает ккординаты камеры на (x, y)
*/



let key = Date.now(); 		// Ключ генерации
let currentTime = 0; 			// Текущее время в миллисекундах
let currentBlock = undefined;
let lastPlaceBlockTime = 0;
let BlocksGlobalChange = {};
let staminaNotUsed = true;
let player;

// Вызывается при запуске игры
const beginPlay = () => {
	// Управление
    this.controller = new Controller();
    const KDU = (event) => {
    	controller.keyDownUp(event);
    };
    window.addEventListener("keydown", KDU);
    window.addEventListener("keyup", KDU);
    window.addEventListener("mousemove", (event) => {
    	controller.mouseMove(event);
    });
    window.addEventListener("mouseup", (event) => {
    	controller.mouseUp(event);
    });
    window.addEventListener("mousedown", (event) => {
    	controller.mouseDown(event);
    });

    if (choosedWorld() !== undefined) {
		key = loadingResult.key;
		BlocksGlobalChange = loadingResult.change;
		currentTime = loadingResult.currentTime;

		gameArea = generate(loadingResult.gameArea.width,
			loadingResult.gameArea.height,
			key,
			BlocksGlobalChange);
		gameArea.inventoryBlocks = loadingResult.gameArea.inventoryBlocks;
		gameArea.timeOfDay = loadingResult.gameArea.timeOfDay;

    	player = new Player();
    	playerCopy(player, loadingResult.player);
		slicePlayer = (player.layout === GameArea.FIRST_LAYOUT) ? 1 : 2;
		for (let i in BlocksGlobalChange) {
			gameArea.updateBlock(
				BlocksGlobalChange[i].x,
				BlocksGlobalChange[i].y,
				BlocksGlobalChange[i].layout,
				player);
			gameArea.updateRadius(
				BlocksGlobalChange[i].x,
				BlocksGlobalChange[i].y,
				BlocksGlobalChange[i].layout,
				player);
		}

    } else {
		gameArea = generate(2000, 1000, key);

    	let px = gameArea.width / 2;
    	let py = 0;
    	for (let i = Math.floor(px - Player.WIDTH / 2); i <= Math.floor(px + Player.WIDTH / 2); i++) {
    		py = Math.max(py, gameArea.elevationMap[i] + 1);
    	}

    	player = new Player(px, py);
	}
	
	
	// player.addToInv(items[8]);
	cameraSet(player.x, player.y);
	
	elevationCalculate(); // расчитывает карту высот для погоды
	
	// Блок функций, которые не зависят от обновления кадров
	callSetTimeOfDay(300);
}

const callSetTimeOfDay = (lengthOfDay) => {
	setTimeOfDay(currentTime, lengthOfDay);
	setTimeout(callSetTimeOfDay, 1000, lengthOfDay);
}

// Установка текущего времени суток. При изменении не забудь заглянуть в callSetTimeOfDay
const setTimeOfDay = (currentTime, lenghtOfDay) => {
	currentTime = currentTime / lenghtOfDay * Math.PI * 4 % (Math.PI * 4);
	if (currentTime < Math.PI) { //................................................... День
		gameArea.timeOfDay = 1;
	} else if (currentTime < 2 * Math.PI) { //........................................ День -> Ночь
		gameArea.timeOfDay = (Math.cos(currentTime % Math.PI) + 1) / 2;
	} else if (currentTime < 3 * Math.PI) { //........................................ Ночь
		gameArea.timeOfDay = 0;
	} else { //....................................................................... Ночь -> День
		gameArea.timeOfDay = 1 - (Math.cos(currentTime % Math.PI) + 1) / 2;
	}
}

// На первом тике после инициализации мира
const onStart = () => {
	initUI();
	__cheat_apply();
}

// Вызывается каждый кадр
const eventTick = () => {
	mouseMessage = undefined;
	currentTime += deltaTime;
	staminaNotUsed = true;
	playerMovement();
	mouseControl();
	UI();
	playerActionButtons();
	
	if (player.hand.item !== undefined) {
		// обработка предмета в руке
		const widthItems = 16;
		const texture = player.hand.info.texture();
		const itemInHand = {
			'a': texture[0],
			'b': texture[1]
			};
		
		if (player.animationStates.body === 1) {
			// если рука поднята
			itemInHand.angle = -30;
			itemInHand.pos = [58, 19];
		} else {
			// если рука опущена
			itemInHand.angle = 0;
			itemInHand.pos = [33, 35];
		}
		
		render.getPlayerParts(
			player.animationStates.head,
			player.animationStates.body,
			player.animationStates.legs,
			itemInHand);  // id головы, тела и ног, которые нужно сейчас воспроизводить, а также предмет в руке
	} else {
		// если рука пуста
		render.getPlayerParts(
			player.animationStates.head,
			player.animationStates.body,
			player.animationStates.legs);  // id головы, тела и ног, которые нужно сейчас воспроизводить
	}
	
	// В последнюю очередь
	if (player.sp === player.maxSP) player.heal(0.5 * deltaTime);
	// Анимации
	animationsTickCount++;
	player.animate();
	// Запись изменений
	worldChange();

}

// Управление интерфейсом
const UI = () => {
	// Кнопки 1..8
	for (let i = 1; i <= 8; i++) {
		if (controller.numbers[i].active) {
			if (player.hand.index !== i - 1) {
				player.setHand(i - 1);
			}
			break;
		}
	}
}

// Запись изменений блоков мира
const worldChange = () => {
	for (let chunk in gameArea.chunkDifferList) {
		for (let change in gameArea.chunkDifferList[chunk]) {
			if(change[change.length - 1] === "L") {  // Изменение света
				continue;
			}
			const obj = gameArea.chunkDifferList[chunk][change];
			BlocksGlobalChange[obj.x + "x" + obj.y + "x" + obj.layout] = {
				x: obj.x,
				y: obj.y,
				layout: obj.layout,
				newValue: obj.newValue
			}
		}
	}
}

// Действия при нажатии клавиш действия
const playerActionButtons = () => {
	let layout = player.layout;
    if(controller.shift.active) {
    	if(player.layout === GameArea.FIRST_LAYOUT) {
    		layout = GameArea.SECOND_LAYOUT;
    	} else {
    		layout = GameArea.BACK_LAYOUT;
    	}
    }

	if (controller.f.active) {  // Сохранение
		saveWorld('world').then(() => chooseWorld('world'));
	}
	if (controller.g.active) { // Удалить сохранение
		deleteWorld('world');
	}

	// Нажата E
	if (controller.interact.active && lastPlaceBlockTime < currentTime - 0.2) {
		if (chestOpened) {
			UICloseChest();
		} else {
			player.interactWithNearest(layout);
		}
		lastPlaceBlockTime = currentTime;
	}

	// Нажата клавиша I
	if(controller.inv.active) {
		 if(!controller.invClick) {
		 	controller.invClick = true;
		 	if (inventoryOpened) {
		 		UICloseInv();
		 	} else {
		 		UIOpenInv();
		 	}
		 }
	} else {
		controller.invClick = false;
	}

	// Нажата клавиша O
	if(controller.craft.active) {
		 if(!controller.craftClick) {
		 	controller.craftClick = true;
		 	if (craftOpened) {
		 		UICloseCraft();
		 	} else {
		 		UIOpenCraft();
		 	}
		 }
	} else {
		controller.craftClick = false;
	}

	if (staminaNotUsed) {
    	player.updateSP(player.sp + 4 * deltaTime);
	}
}

// Движение игрока
const playerMovement = () => {

	if(!__cheat_noLayout && controller.down.active) {
		 if(!controller.downClick) {
		 	controller.downClick = true;
		 	let layout = (player.layout === GameArea.FIRST_LAYOUT) ? GameArea.SECOND_LAYOUT : GameArea.FIRST_LAYOUT;
		 	if(player.canStay(player.fx, player.fy, layout)) {
		 		player.layout = layout;
		 		slicePlayer = (player.layout === GameArea.FIRST_LAYOUT) ? 1 : 2;
		 	}
		 }
	} else {
		controller.downClick = false;
	}

	// Координаты блока, в котором голова
	let headX = Math.floor(player.x + Player.HEAD_X);
	let headY = Math.floor(player.y + Player.HEAD_Y);

	// Урон от удушья 
	if (!__cheat_spectator &&
		gameArea.map[headX][headY][player.layout]
		&& (items[gameArea.map[headX][headY][player.layout]].type == "water"
			|| items[gameArea.map[headX][headY][player.layout]].type == "flowingWater"
			|| items[gameArea.map[headX][headY][player.layout]].isCollissed)) {
		player.choke(deltaTime);
	} else {
		player.updateBP(Math.min(player.bp + 2 * Player.CHOKE_SPEED * deltaTime, 100));
	}
	let liquidK = player.getLiquidK();

	if (__cheat_spectator) {
		if (controller.left.active) player.fx -= Player.SPEED * deltaTime;
		if (controller.right.active) player.fx += Player.SPEED * deltaTime;
		if (controller.up.active) player.fy += Player.SPEED * deltaTime;
		if (controller.down.active) player.fy -= Player.SPEED * deltaTime;
	}
	else if (liquidK == 0) { // Если игрок на суше
		if (player.onGround()) { //....................................................... Если игрок на поверхности
			player.vy = Math.max(player.vy, 0);
			if (controller.up.active) {
				if (controller.shift.active) {
					if (player.sp >= Player.JUMP_SPEED * 2 / 3 / 30) {
						player.vy = Player.JUMP_SPEED * 2 / 3;

						// Уменьшение выносливости
	                	player.updateSP(player.sp - Player.JUMP_SPEED * 2 / 3 / 30);
	                	staminaNotUsed = false;
					}
				} else {
					if (player.sp >= Player.JUMP_SPEED / 5) {
						player.vy = Player.JUMP_SPEED;

						// Уменьшение выносливости
	                	player.updateSP(player.sp - Player.JUMP_SPEED / 30);
	                	staminaNotUsed = false;
	                }
				}
			}
		} else {
			if (controller.up.active && player.vy > 0 && player.sp >= 3 * deltaTime) { // Удержание прыжка
				player.vy -= GameArea.GRAVITY * deltaTime * 2 / 3;

				// Уменьшение выносливости
	            player.updateSP(player.sp - 3 * deltaTime);
                staminaNotUsed = false;
			} else {
				player.vy -= Math.max(- Player.JUMP_SPEED * 4, GameArea.GRAVITY * deltaTime);
				if (player.vy > - Player.JUMP_SPEED * 4) {
					
				}
				staminaNotUsed = false;
			}
		}
		if (controller.shift.active) { // На шифте
			if (controller.left.active) player.vx = -Player.SPEED / 2; //................ Если нажато вправо
			if (controller.right.active) player.vx = Player.SPEED / 2; //................ Если нажато влево
		} else {
			if (controller.left.active) player.vx = -Player.SPEED; //.................... Если нажато вправо
			if (controller.right.active) player.vx = Player.SPEED; //.................... Если нажато влево
		}
		if (!controller.left.active && !controller.right.active) player.vx = 0; //....... Если нет движения в стороны
	} else { //.......................................................................... Если в жидкости
		if (controller.left.active) player.vx -= Player.SPEED * deltaTime;
		if (controller.right.active) player.vx += Player.SPEED * deltaTime;
		if (controller.up.active) player.vy += Player.SPEED * deltaTime;
		if (controller.down.active) player.vy -= Player.SPEED * deltaTime;

		// Силы сопротивления
		if (!player.onGround()) {
			player.vy -= 2 / 3 * liquidK * Math.abs(player.vy) * 2 * player.vy * deltaTime;
		} else {
			player.vy = Math.max(player.vy, 0);
		}
		player.vx -= 2 / 3 * liquidK * Math.abs(player.vx) * 2 * player.vx * deltaTime;
	}

	// Новые координаты
	let newX = player.fx + player.vx * deltaTime;
	let newY = player.fy + player.vy * deltaTime;

    // Пока новые координаты не перестанут конфликтовать с окружением
	// Выход за карту
	if (newX - Player.WIDTH / 2 < 0 && newX + Player.WIDTH / 2 > gameArea.width) {
		player.vx = 0;
		newX = player.fx;
	}
	if (newY < 0 && newY + Player.HEIGHT > gameArea.height) {
		player.vy = 0;
		newY = player.fy;
	}
	// Проверка, не упёрся ли игрок
	let changedX = false;
	let changedY = false;
	const steps = 5;
	for (let i = 1; i <= steps; i++) {
		let k =  i / steps;
		let iX = player.fx + (newX - player.fx) * k;
		let iY = player.fy + (newY - player.fy) * k;
		let ansX = player.fx + (newX - player.fx) * (i - 1) / steps;
		let ansY = player.fy + (newY - player.fy) * (i - 1) / steps;

		if (!changedX) {
			if (controller.shift.active && player.onGround() && !player.isCollisionDown(iX, player.fy - 0.001)) {
				player.vx = 0;
				changedX = true;
			}
			if (player.vx < 0 && player.isCollisionLeft(iX, changedY ? newY : iY)) {
				player.vx = 0;
				changedX = true;
			}
			if (player.vx > 0 && player.isCollisionRight(iX, changedY ? newY : iY)) {
				player.vx = 0;
				changedX = true;
			}
			if (changedX) {
				newX = ansX;
			}
		}
		
		if (!changedY) {
			if (player.vy > 0 && player.isCollisionUp(changedX ? newX : iX, iY)) {
				player.vy = 0;
				changedY = true;
			}
			if (player.vy < 0 && player.isCollisionDown(changedX ? newX : iX, iY)) {
				player.fallingDamage();
				ansY = Math.floor(ansY);
				player.vy = 0;
				changedY = true;
			}
			if (changedY) {
				newY = ansY;
			}
		}

		if (changedX && changedY) {
			break;
		}
	}

	// Анимация
	if (Math.abs(newX - player.fx) > Player.SPEED * deltaTime * 2 / 3) {
		player.setAnimation("legs", "run");
	} else if (Math.abs(newX - player.fx) > Player.SPEED * deltaTime / 3) {
		player.setAnimation("legs", "walk");
	} else {
		player.setAnimation("legs", "idle");
	}

	// Направление игрока
	if (newX - player.fx != 0) {
		player.direction = Math.sign(newX - player.fx);
	} else {
		if (controller.mouse.click) {
			player.direction = Math.sign(controller.mouse.direction.x);
		}
	}

	// Присваиваем фактические координаты
	player.fx = newX;
	player.fy = newY;

	// Анимация + звук падения
	if (!player.onGround()) {
		player.setAnimation("legs", "jump");
	}
	
	player.x = roundToFunc(newX, blockSize, Math.round);
	player.y = roundToFunc(newY, blockSize, Math.round);

	// Закрыть интерфейс сундука, если игрок вышел за радиус досягаемости
	if (chestOpened 
			&& hypotenuse(Math.abs(player.x - lastChest.x), Math.abs(player.y - lastChest.y)) > Player.ACTION_RADIUS) {
		UICloseChest();
	}
	// Закрыть интерфейс крафта, если игрок вышел за радиус досягаемости
	if (craftOpened && lastCraftBlock && hypotenuse(Math.abs(player.x - lastCraftBlock.x),
											Math.abs(player.y - lastCraftBlock.y)) > Player.ACTION_RADIUS) {
		UICloseCraft();
	}

	// Плавное движение камеры
	if (Math.abs(cameraX - newX) > 1) {
		cameraSet(cameraX + roundToFunc(1.5 * (player.x - cameraX) * deltaTime, blockSize, Math.round), cameraY);
	}
	if (Math.abs(cameraY - newY) > 1) {
		cameraSet(cameraX, cameraY + roundToFunc(1.5 * (player.y - cameraY) * deltaTime, blockSize, Math.round));
	}
	
}

let buttonHoldCounter = 0; // Отсчёт длинного нажатия на кнопку
const mouseControl = () => {
	// Наведение на сообщение
	for (let i = _mouseMessageUIArr.length - 1; i >= 0; i--) {
		if (_mouseMessageUIArr[i].pa[0] < controller.mouse.x
			&& _mouseMessageUIArr[i].pb[0] > controller.mouse.x
			&& _mouseMessageUIArr[i].pa[1] < render.getCanvasSize()[1] - controller.mouse.y
			&& _mouseMessageUIArr[i].pb[1] > render.getCanvasSize()[1] - controller.mouse.y) {
			showMouseMessage(_mouseMessageUIArr[i].message);
		}
	}

	let layout = player.layout;
    if(controller.shift.active) {
    	if(player.layout === GameArea.FIRST_LAYOUT) {
    		layout = GameArea.SECOND_LAYOUT;
    	} else {
    		layout = GameArea.BACK_LAYOUT;
    	}
    }

    // Когда зажата ЛКМ
    if (controller.mouse.click === 1) {

		// Нажатие по интерфейсу
		let interactWithUI = false;
		if (buttonHoldCounter <= buttonLongHoldLength) {
			for (let i = _interactiveUIArr.length - 1; i >= 0; i--) {
				if (_interactiveUIArr[i].pa[0] < controller.mouse.x
						&& _interactiveUIArr[i].pb[0] > controller.mouse.x
						&& _interactiveUIArr[i].pa[1] < render.getCanvasSize()[1] - controller.mouse.y
						&& _interactiveUIArr[i].pb[1] > render.getCanvasSize()[1] - controller.mouse.y) {
					// action to click
					let sprite = _interactiveUIArr[i].sprite;
					let lastButton = UIMap.lastButton;
					let activeElement = UIMap.activeElement;

					if (sprite.longHold && lastButton === sprite) {
						buttonHoldCounter += deltaTime;
					} else {
						buttonHoldCounter = 0;
					}

					if (buttonHoldCounter >= buttonLongHoldLength) { // Действие зажатия
						longHoldAction(sprite);
					} else {
						holdAction(sprite);
					}

					if (lastButton !== sprite) {
						releaseAction(lastButton);
					}

					UIMap.lastButton = sprite;
					interactWithUI = true;
					break;
				}
			}
		}

		if (!interactWithUI) {
			releaseAction(UIMap.lastButton);
			UIMap.lastButton = undefined;

			let targetX = Math.floor(controller.mouse.direction.x / (blockSize / cameraScale) + player.x);
	    	let targetY = Math.floor(controller.mouse.direction.y / (blockSize / cameraScale) + player.y
	    		+ Player.HEIGHT / 2);
	    	if (gameArea.canDestroy(targetX, targetY, layout) && player.blockAvailable(targetX, targetY, player.layout)
	      		&& player.sp > 0) {
	    		//Неломаемый блок (подсказка)
	    		if (items[gameArea.get(targetX, targetY, layout)].durability > 300) {
	    			showFloatMessage("I do not think I can break it");
	    		}

	            // Анимация
	            player.setAnimation("body", "kick");

	            // Уменьшение выносливости
	            player.updateSP(player.sp - 4 * deltaTime);
	            staminaNotUsed = false;

	    		// Разрушение
	    		if (currentBlock === undefined || currentBlock.x !== targetX || currentBlock.y !== targetY) {
	    			currentBlock = {
	    				x: targetX, y: targetY, layout: layout,
	    				type: items[gameArea.map[targetX][targetY][layout]].type,
	    				durability: items[gameArea.map[targetX][targetY][layout]].durability
	    			}
	    			let effK = ((player.hand.item && player.hand.info.isTool
	    				&& currentBlock.type == player.hand.info.type))
	    			? player.hand.info.efficiency : 1;
	    			currentBlock.durability -= deltaTime * effK;
	    		} else if (currentBlock.durability > 0) {
	    			let effK = ((player.hand.item && player.hand.info.isTool
	    				&& currentBlock.type == player.hand.info.type))
	    			? player.hand.info.efficiency : 1;
	    			currentBlock.durability -= deltaTime * effK;
	    		} else {
	    			currentBlock = undefined;
	    			player.destroy(targetX, targetY, layout);
	    		}
	    	}
		}
    } else {
    	currentBlock = undefined;

    	if (buttonHoldCounter < buttonLongHoldLength) {
    		clickAction(UIMap.lastButton);
    	}
		UIMap.lastButton = undefined;
		buttonHoldCounter = 0;
    }

	// Когда зажата ПКМ
	if (controller.mouse.click === 3 && lastPlaceBlockTime < currentTime - 0.2) {
		let targetX = Math.floor(controller.mouse.direction.x / (blockSize / cameraScale) + player.x);
		let targetY = Math.floor(controller.mouse.direction.y / (blockSize / cameraScale) + player.y
			+ Player.HEIGHT / 2);
		if (player.blockAvailable(targetX, targetY, player.layout)) {
			// Взаимодействие с блоком
			if (player.interact(targetX, targetY, layout)) {
				lastPlaceBlockTime = currentTime;

	            // Анимация
	            player.setAnimation("body", "kick");
			} else if (player.place(targetX, targetY, layout)) { // Установка блока
		    	lastPlaceBlockTime = currentTime;

	            // Анимация
	            player.setAnimation("body", "kick");
		    }
		}
	}
}
