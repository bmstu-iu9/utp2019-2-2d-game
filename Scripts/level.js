/*
const cameraScale = 1;                  Масштаб, 1 - стандарт
const scale = 16                        Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;           Положение камеры
const chankWidth = 8, chankHeight = 8   Размеры чанка
const minLayout = 2, maxLayout = 3      Обрабатываемые слои
const blockResolution = 32              Разрешение текстуры блока
let deltaTime = 0                       Изменение времени между кадрами в секундах
let gameArea;                           Игровой мир (объект GameArea)
cameraSet(x, y)                         Устанавливает ккординаты камеры на (x, y)
*/



const key = Date.now(); 		// Ключ генерации
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

    player.addToInv({
    	"id" : 257,
    	"durability" : items[257].durability,
		"name" : "Iron pickaxe"
    });
}

// Вызывается каждый кадр
const eventTick = () => {
	currentTime += deltaTime;
	setTimeOfDay(currentTime, 600);
	playerMovement();
	mouseControl();
	UI();
}

// Установка текущего времени суток
const setTimeOfDay = (currentTime, lenghtOfDay) => {
	currentTime = currentTime / lenghtOfDay * Math.PI * 4 % (Math.PI * 4);
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

// Управление интерфейсом
const UI = () => {
	// Кнопки 1..8
	for(let i = 1; i <= 8; i++) {
		if(controller.numbers[i].active) {
			if(player.hand.index != i - 1){
				player.setHand(i - 1);
			}
			break;
		}
	}
}

// Движение игрока
const playerMovement = () => {
	// Координаты блока, в котором голова
	let headX = Math.floor(player.x + Player.HEAD_X);
	let headY = Math.floor(player.y + Player.HEAD_Y);
	// Урон от удушья 
	if(gameArea.map[headX][headY][GameArea.MAIN_LAYOUT]
			&& (items[gameArea.map[headX][headY][GameArea.MAIN_LAYOUT]].type == "water"
			|| items[gameArea.map[headX][headY][GameArea.MAIN_LAYOUT]].isCollissed)) {
		player.choke(deltaTime);
	} else {
		player.bp = Math.min(player.bp + 2 * Player.CHOKE_SPEED * deltaTime, 100);
	}
	let liquidK = player.getLiquidK();
	if(liquidK == 0) { // Если игрок на суше
		if(player.onGround()) { //.................................................... Если игрок на поверхности
			player.vy = Math.max(player.vy, 0);
			if(controller.up.active) {
				player.vy = Player.JUMP_SPEED;
			}
		} else {
			if(controller.up.active && player.vy > 0) { //................................... Удержание прыжка
				player.vy -= GameArea.GRAVITY * deltaTime * 2 / 3;
			} else {
				if(player.vy > - Player.JUMP_SPEED * 4){
					player.vy -= GameArea.GRAVITY * deltaTime;
				}
			}
		}
		if(controller.left.active) player.vx = -Player.SPEED; //......................... Если нажато вправо
		if(controller.right.active) player.vx = Player.SPEED; //......................... Если нажато влево
		if(!controller.left.active && !controller.right.active) player.vx = 0; //........ Если нет движения в стороны
	} else { //................................................................. Если в жидкости
		if(controller.left.active) player.vx -= Player.SPEED * deltaTime;
		if(controller.right.active) player.vx += Player.SPEED * deltaTime;
		if(controller.up.active) player.vy += Player.SPEED * deltaTime;
		if(controller.down.active) player.vy -= Player.SPEED * deltaTime;

		// Силы сопротивления
		if(!player.onGround()) {
			player.vy -= 2 / 3 * liquidK * Math.abs(player.vy) * 2 * player.vy * deltaTime;
		} else {
			player.vy = Math.max(player.vy, 0);
		}
		player.vx -= 2 / 3 * liquidK * Math.abs(player.vx) * 2 * player.vx * deltaTime;
	}

	// Новые координаты
	let newX = playerFloatX + player.vx * deltaTime;
    let newY = playerFloatY + player.vy * deltaTime;

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
	let changedX = false;
	let changedY = false;
	const steps = 5;
	for(let i = 1; i <= steps; i++){
		let k =  i / steps;
		let iX = playerFloatX + (newX - playerFloatX) * k;
		let iY = playerFloatY + (newY - playerFloatY) * k;
		let ansX = playerFloatX + (newX - playerFloatX) * (i - 1) / steps;
		let ansY = playerFloatY + (newY - playerFloatY) * (i - 1) / steps;

		if(!changedX){
			if(player.vx < 0 && player.isCollisionLeft(iX, changedY ? newY : iY)) {
				player.vx = 0;
				changedX = true;
			}
			if(player.vx > 0 && player.isCollisionRight(iX, changedY ? newY : iY)) {
				player.vx = 0;
				changedX = true;
			}
			if(changedX){
				newX = ansX;
			}
		}
		
		if(!changedY){
			if(player.vy > 0 && player.isCollisionUp(changedX ? newX : iX, iY)) {
				player.vy = 0;
				changedY = true;
			}
			if(player.vy < 0 && player.isCollisionDown(changedX ? newX : iX, iY)) {
				player.fallingDamage();
				ansY = Math.floor(ansY);
				player.vy = 0;
				changedY = true;
			}
			if(changedY){
				newY = ansY;
			}
		}

		if(changedX && changedY){
			break;
		}
	}

	playerFloatX = newX;
	playerFloatY = newY;
	
	player.x = Math.round(newX * 16) / 16;
	player.y = Math.round(newY * 16) / 16;

	// Плавное движение камеры
	if(Math.abs(cameraX - newX) > 0.3){
		cameraSet(cameraX + Math.round((1.5 * (player.x - cameraX) * deltaTime) * 16) / 16, cameraY);
	}
	if(Math.abs(cameraY - newY) > 0.3){
		cameraSet(cameraX, cameraY + Math.round(1.5 * ((player.y - cameraY) * deltaTime) * 16) / 16);
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
            if(gameArea.canDestroy(x, y)) {
                if (currentBlock === undefined || currentBlock.x !== x || currentBlock.y !== y) {
					currentBlock = {
						x: x, y: y,
						type: items[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].type,
						durability: items[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].durability
					}
					let effK = ((player.hand.item && currentBlock.type == player.hand.info.type))
						? player.hand.info.efficiency : 1;
					currentBlock.durability -= deltaTime * effK;
				} else if (currentBlock.durability > 0) {
					let effK = ((player.hand.item && currentBlock.type == player.hand.info.type))
						? player.hand.info.efficiency : 1;
					currentBlock.durability -= deltaTime * effK;
				} else {
					currentBlock = undefined;
					player.destroy(x, y);
				}
                break;
            }
        }
	} else {
		currentBlock = undefined;
	}
	// Когда зажата ПКМ
	if(controller.mouse.click === 3 && lastPlaceBlockTime < currentTime - 0.2) {
		const len = Math.sqrt(controller.mouse.direction.x * controller.mouse.direction.x +
			controller.mouse.direction.y * controller.mouse.direction.y);
		let x = player.x;
		let y = player.y;
		let isAllowPlace = true; //.......................................... Действительно ли выбрано допустимое место
        for(let i = 0; i < len / scale / cameraScale; i += 1 / scale / cameraScale){
            x = Math.floor(i * controller.mouse.direction.x / len + player.x);
			y = Math.floor(i * controller.mouse.direction.y / len + player.y + Player.HEIGHT / 2);
			if (x < 0 || x >= gameArea.width || y < 0 || y >= gameArea.height || i > Player.ACTION_RADIUS
					|| (gameArea.map[x][y][GameArea.MAIN_LAYOUT] != undefined
            		&& items[gameArea.map[x][y][GameArea.MAIN_LAYOUT]].isCollissed)) {
				isAllowPlace = false;
				break;
			}
        }
        if(isAllowPlace && (x - 1 >= 0 //..................................................................... Есть блок рядом
        		&& gameArea.canDestroy(x - 1, y)
        		|| x + 1 < gameArea.width
        		&& gameArea.canDestroy(x + 1, y)
        		|| y - 1 >= 0
        		&& gameArea.canDestroy(x, y - 1)
        		|| y + 1 < gameArea.height
        		&& gameArea.canDestroy(x, y + 1))){
        	player.place(x, y);
        	lastPlaceBlockTime = currentTime;
        }
	}
}
