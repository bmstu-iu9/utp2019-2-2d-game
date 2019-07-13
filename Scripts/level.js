/*
const cameraScale = 1;                  Масштаб, 1 - стандарт
const scale = 16                        Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;           Положение камеры
const chankWidth = 8, chankHeight = 8   Размеры чанка
const minLayout = 2, maxLayout = 3      Обрабатываемые слои
const blockResolution = 32              Разрешение текстуры блока
let deltaTime = 0                       Изменение времени между кадрами в мс
let gameArea;                           Игровой мир (объект GameArea)
cameraSet(x, y)                         Устанавливает ккординаты камеры на (x, y)
*/



const key = Date.now();;  		// Ключ генерации
let currentTime = 0; 			// Текущее время в миллисекундах
let currentBlock = undefined;
let lastPlaceBlockTime = 0;
let playerFloatX = 0;
let playerFloatY = 0;

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

    gameArea = generate(1000, 1000, key);
    player = new Player(gameArea.width / 2, gameArea.elevationMap[Math.floor(gameArea.width / 2)] + 1);
    playerFloatX = player.x;
    playerFloatY = player.y;
    cameraSet(player.x, player.y);
}

// Вызывается каждый кадр
const eventTick = () => {
	currentTime += deltaTime;
	setTimeOfDay(currentTime, 600);
	playerMovement();
	mouseControl();
}

// Установка текущего времени суток
const setTimeOfDay = (currentTime, lenghtOfDay) => {
	currentTime = currentTime / 1000 / lenghtOfDay * Math.PI * 4 % (Math.PI * 4);
	if(currentTime < Math.PI){ //.................................................... День
		gameArea.timeOfDay = 1;
	}else if(currentTime < 2 * Math.PI){ //.......................................... День -> Ночь
		gameArea.timeOfDay = (Math.cos(currentTime % Math.PI) + 1) / 2;
	}else if(currentTime < 3 * Math.PI){ //.......................................... Ночь
		gameArea.timeOfDay = 0;
	}else{ //........................................................................ Ночь -> День
		gameArea.timeOfDay = 1 - (Math.cos(currentTime % Math.PI) + 1) / 2;
	}
}

// Движение игрока
const playerMovement = () => {
	if(player.onGround()) { //....................................................... Если игрок на земле
		player.vy = Math.max(player.vy, 0);
		if(controller.up.active) {
			player.vy = Player.JUMP_SPEED;
		}
	} else {
		if(controller.up.active && player.vy > 0) { //................................... Удержание прыжка
			player.vy -= GameArea.GRAVITY * deltaTime / 1500;
		} else {
			if(player.vy > - Player.JUMP_SPEED * 4){
				player.vy -= GameArea.GRAVITY * deltaTime / 1000;
			}
		}
	}
	if(controller.left.active) player.vx = -Player.SPEED; //......................... Если нажато вправо
	if(controller.right.active) player.vx = Player.SPEED; //......................... Если нажато влево
	if(!controller.left.active && !controller.right.active) player.vx = 0; //........ Если нет движения в стороны

	// Новые координаты
	let newX = playerFloatX + player.vx * deltaTime / 1000;
    let newY = playerFloatY + player.vy * deltaTime / 1000;

    // Пока новые координаты не перестанут конфликтовать с окружением
	// Выход за карту
	if(newX - Player.WIDTH / 2 < 0 && newX + Player.WIDTH / 2 > gameArea.width) {
		player.vx = 0;
		newX = playerFloatX;
		canGo = false;
	}
	if(newY < 0 && newY + Player.HEIGHT > gameArea.height) {
		player.vy = 0;
		newY = playerFloatY;
	}
	// Проверка, не упёрся ли игрок
	if(player.vx < 0 && player.isCollisionLeft(newX, newY)) {
		newX = playerFloatX;
		player.vx = 0;
	}
	if(player.vx > 0 && player.isCollisionRight(newX, newY)) {
		newX = playerFloatX;
		player.vx = 0;
	}
	if(player.vy > 0 && player.isCollisionUp(newX, newY)) {
		newY = playerFloatY;
		player.vy = 0;
	}
	if(player.vy < 0 && player.isCollisionDown(newX, newY)) {
		newY = Math.floor(playerFloatY);
		player.vy = 0;
	}

	playerFloatX = newX;
	playerFloatY = newY;
	
	player.x = Math.round(newX * 16) / 16;
	player.y = Math.round(newY * 16) / 16;

	// cameraSet(player.x, player.y);

	// Плавное движение камеры
	if(Math.abs(cameraX - newX) > 0.3){
		cameraSet(cameraX + Math.round((1.5 * (player.x - cameraX) * deltaTime / 1000) * 16) / 16, cameraY);
	}
	if(Math.abs(cameraY - newY) > 0.3){
		cameraSet(cameraX, cameraY + Math.round(1.5 * ((player.y - cameraY) * deltaTime / 1000) * 16) / 16);
	}
	
}

const mouseControl = () => {
    // Когда зажата ЛКМ
    if(controller.mouse.click === 1) {
        const len = Math.sqrt(controller.mouse.direction.x * controller.mouse.direction.x +
			controller.mouse.direction.y * controller.mouse.direction.y);
        for(let i = 0; i < Math.min(Player.ACTION_RADIUS, len / scale / cameraScale); i += 1 / scale / cameraScale){
            const x = Math.floor(i * controller.mouse.direction.x / len + player.x);
			const y = Math.floor(i * controller.mouse.direction.y / len + player.y + Player.HEIGHT / 2);
			if (x < 0 || x >= gameArea.width || y < 0 || y >= gameArea.height) {
				break;
			}
            if(gameArea.map[x][y][GameArea.MAIN_LAYOUT] != undefined
            		&& blockTable[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].type != "water") {
                if (currentBlock === undefined || currentBlock.x !== x || currentBlock.y !== y) {
					currentBlock = {
						x: x, y: y,
						durability: blockTable[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].durability
					}
					currentBlock.durability -= deltaTime;
				} else if (currentBlock.durability > 0) {
					currentBlock.durability -= deltaTime;
				} else {
					currentBlock = undefined;
					gameArea.destroyBlock(x, y, GameArea.MAIN_LAYOUT);
				}
                break;
            }
        }
	} else {
		currentBlock = undefined;
	}
	// Когда зажата ПКМ
	if(controller.mouse.click === 3 && lastPlaceBlockTime < currentTime / 1000 - 0.2) {
		const len = Math.sqrt(controller.mouse.direction.x * controller.mouse.direction.x +
			controller.mouse.direction.y * controller.mouse.direction.y);
		let x = player.x;
		let y = player.y;
		let isOk = true; //.................................................. Действительно ли выбрано допустимое место
        for(let i = 0; i < len / scale / cameraScale; i += 1 / scale / cameraScale){
            x = Math.floor(i * controller.mouse.direction.x / len + player.x);
			y = Math.floor(i * controller.mouse.direction.y / len + player.y + Player.HEIGHT / 2);
			if (x < 0 || x >= gameArea.width || y < 0 || y >= gameArea.height || i > Player.ACTION_RADIUS
					|| (gameArea.map[x][y][GameArea.MAIN_LAYOUT] != undefined
            		&& blockTable[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].isCollissed)) {
				isOk = false;
				break;
			}
        }
        if(isOk && (x - 1 >= 0 //..................................................................... Есть блок рядом
        		&& gameArea.map[x - 1][y][GameArea.MAIN_LAYOUT] != undefined
        		&& blockTable[gameArea.map[x - 1][y][GameArea.MAIN_LAYOUT]].type != "water"
        		|| x + 1 < gameArea.width
        		&& gameArea.map[x + 1][y][GameArea.MAIN_LAYOUT] != undefined
        		&& blockTable[gameArea.map[x + 1][y][GameArea.MAIN_LAYOUT]].type != "water"
        		|| y - 1 >= 0
        		&& gameArea.map[x][y - 1][GameArea.MAIN_LAYOUT] != undefined
        		&& blockTable[gameArea.map[x][y - 1][GameArea.MAIN_LAYOUT]].type != "water"
        		|| y + 1 < gameArea.height
        		&& gameArea.map[x][y + 1][GameArea.MAIN_LAYOUT] != undefined
        		&& blockTable[gameArea.map[x][y + 1][GameArea.MAIN_LAYOUT]].type != "water")){
        	gameArea.placeBlock(x, y, GameArea.MAIN_LAYOUT, 1);
        	lastPlaceBlockTime = currentTime / 1000;
        }
	}
}
