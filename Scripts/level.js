/*
const cameraScale = 1;                  Масштаб, 1 - стандарт
const blockSize = 16                    Масштаб камеры (пикселей в блоке при cameraScale = 1)
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
let layoutSwitcher = false;
let BlocksGlobalChange = {};

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

    if (loadExist()) {
		key = loadingResult.key;
		gameArea = generate(loadingResult.gameArea.width,
			loadingResult.gameArea.height,
			key);
		gameArea.timeOfDay = loadingResult.gameArea.timeOfDay;
		for (let i in loadingResult.change) {
			gameArea.map[loadingResult.change[i].x][loadingResult.change[i].y][loadingResult.change[i].layout]
				= loadingResult.change[i].newValue;
		}
		BlocksGlobalChange = loadingResult.change;

		currentTime = loadingResult.currentTime;
    	player = new Player();
    	playerCopy(player, loadingResult.player);
    } else {
    	gameArea = generate(1000, 1000, key);

    	let px = gameArea.width / 2;
    	let py = 0;
    	for (let i = Math.floor(px - Player.WIDTH / 2); i <= Math.floor(px + Player.WIDTH / 2); i++) {
    		py = Math.max(py, gameArea.elevationMap[i] + 1);
    	}

    	player = new Player(px, py);
    	player.addToInv({
    		"id" : 278,
    		"durability" : items[278].durability,
    		"name" : "Iron pickaxe"
    	});
    }

	cameraSet(player.x, player.y);
	
	// Блок функций, которые не зависят от обновления кадров
	callSetTimeOfDay(120);
}

const callSetTimeOfDay = (lengthOfDay) => {
	setTimeOfDay(currentTime, lengthOfDay);
	if (gameArea.timeOfDay === 1 || gameArea.timeOfDay === 0) {
		// Вызываем через 1\4 + 1\1000 суток (перед вечером)
		setTimeout(callSetTimeOfDay, 251 * lengthOfDay, lengthOfDay);
	} else {
		// На смену суток 125 состояний света (вызов через каждые 1\500 суток)
		setTimeout(callSetTimeOfDay, 2 * lengthOfDay, lengthOfDay);
	}
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

// Вызывается каждый кадр
const eventTick = () => {
	currentTime += deltaTime;
	playerMovement();
	mouseControl();
	UI();
	playerActionButtons();

	//TODO : Добавить поддержку в engine.js
	/*
	render.getPlayerParts(
		player.animationStates.head,
		player.animationStates.body,
		player.animationStates.legs);  // id головы, тела и ног, которые нужно сейчас воспроизводить
	*/

	// В последнюю очередь
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
			if (player.hand.index != i - 1) {
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
	if (controller.f.active) {  // Сохранение
		saveWorld('world');
	}
	if (controller.g.active) { // Удалить сохранение
		deleteDatabase();
	}
}

// Движение игрока
const playerMovement = () => {

	if(controller.down.active) {
		 if(!layoutSwitcher) {
		 	layoutSwitcher = true;
		 	let layout = (player.layout === GameArea.FIRST_LAYOUT) ? GameArea.SECOND_LAYOUT : GameArea.FIRST_LAYOUT;
		 	if(player.canStay(player.fx, player.fy, layout)) {
		 		player.layout = layout;
		 		slicePlayer = (player.layout === GameArea.FIRST_LAYOUT) ? 1 : 2;
		 	}
		 }
	} else {
		layoutSwitcher = false;
	}

	// Координаты блока, в котором голова
	let headX = Math.floor(player.x + Player.HEAD_X);
	let headY = Math.floor(player.y + Player.HEAD_Y);

	// Урон от удушья 
	if (gameArea.map[headX][headY][player.layout]
		&& (items[gameArea.map[headX][headY][player.layout]].type == "water"
			|| items[gameArea.map[headX][headY][player.layout]].isCollissed)) {
		player.choke(deltaTime);
	} else {
		player.bp = Math.min(player.bp + 2 * Player.CHOKE_SPEED * deltaTime, 100);
	}
	let liquidK = player.getLiquidK();

	if (liquidK == 0) { // Если игрок на суше
		if (player.onGround()) { //....................................................... Если игрок на поверхности
			player.vy = Math.max(player.vy, 0);
			if (controller.up.active) {
				if (controller.shift.active) {
					player.vy = Player.JUMP_SPEED * 2 / 3;
				} else {
					player.vy = Player.JUMP_SPEED;
				}
			}
		} else {
			if (controller.up.active && player.vy > 0) { //.............................. Удержание прыжка
				player.vy -= GameArea.GRAVITY * deltaTime * 2 / 3;
			} else {
				if (player.vy > - Player.JUMP_SPEED * 4) {
					player.vy -= GameArea.GRAVITY * deltaTime;
				}
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
	if (Math.abs(newX - player.fx) > Player.SPEED * deltaTime / 3) {
		player.setAnimation("legs", "run");
	} else {
		player.setAnimation("legs", "idle");
	}

	// Присваиваем фактические координаты
	player.fx = newX;
	player.fy = newY;

	// Анимация падения
	if (!player.onGround()) {
		player.setAnimation("legs", "jump");
	}
	
	player.x = roundToFunc(newX, blockSize, Math.round);
	player.y = roundToFunc(newY, blockSize, Math.round);

	// Плавное движение камеры
	if (Math.abs(cameraX - newX) > 0.3) {
		cameraSet(cameraX + roundToFunc(1.5 * (player.x - cameraX) * deltaTime, blockSize, Math.round), cameraY);
	}
	if (Math.abs(cameraY - newY) > 0.3) {
		cameraSet(cameraX, cameraY + roundToFunc(1.5 * (player.y - cameraY) * deltaTime, blockSize, Math.round));
	}
	
}

const mouseControl = () => {
    // Когда зажата ЛКМ
    if (controller.mouse.click === 1) {
    	let layout = player.layout;
    	if(controller.shift.active) {
    		if(player.layout === GameArea.FIRST_LAYOUT) {
    			layout = GameArea.SECOND_LAYOUT;
    		} else {
    			layout = GameArea.BACK_LAYOUT;
    		}
    	}
    	const len = hypotenuse(controller.mouse.direction.x, controller.mouse.direction.y);
    	let targetX = Math.floor(controller.mouse.direction.x / blockSize / cameraScale + player.x);
    	let targetY = Math.floor(controller.mouse.direction.y / blockSize / cameraScale + player.y + Player.HEIGHT / 2);
    	if (gameArea.canDestroy(targetX, targetY, layout) && player.blockAvailable(targetX, targetY, player.layout)) {
    		// Анимация
    		player.setAnimation("body", "kick");

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
    } else {
    	currentBlock = undefined;
    }

	// Когда зажата ПКМ
	if (controller.mouse.click === 3 && lastPlaceBlockTime < currentTime - 0.2) {
		let layout = player.layout;
    	if(controller.shift.active) {
    		if(player.layout === GameArea.FIRST_LAYOUT) {
    			layout = GameArea.SECOND_LAYOUT;
    		} else {
    			layout = GameArea.BACK_LAYOUT;
    		}
    	}
		const len = hypotenuse(controller.mouse.direction.x, controller.mouse.direction.y);
		let targetX = Math.floor(controller.mouse.direction.x / blockSize / cameraScale + player.x);
		let targetY = Math.floor(controller.mouse.direction.y / blockSize / cameraScale + player.y + Player.HEIGHT / 2);
		if (gameArea.canPlace(targetX, targetY, layout) && player.blockAvailable(targetX, targetY, layout)) {
		       if ((gameArea.canDestroy(targetX - 1, targetY, layout) //............................... Есть блок рядом
		       	|| gameArea.canDestroy(targetX + 1, targetY, layout)
		       	|| gameArea.canDestroy(targetX, targetY - 1, layout)
		       	|| gameArea.canDestroy(targetX, targetY + 1, layout))) {
		       	// Анимация
    			player.setAnimation("body", "kick");

    			// Установка блока
		       	player.place(targetX, targetY, layout);
		       	lastPlaceBlockTime = currentTime;
		    }
		}
	}
}
