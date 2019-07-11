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



const key = performance.now();  // Ключ генерации
let currentTime = 0; 			// Текущее время в миллисекундах

const beginPlay = () => {
    gameArea = generate(1024, 1024, key);
	player = new Player(gameArea, Player.HALF_WIDTH, gameArea.elevationMap[0] + 5);
}

// Вызывается каждый кадр
const eventTick = () => {
	currentTime += deltaTime;
	setTimeOfDay(currentTime, 60);
	playerMovement();
}

// Вызывается только при запуске
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
		if(controller.up.active) player.vy = Player.JUMP_SPEED; //................... Если нажат прыжок
	} else {
		player.vy -= GameArea.GRAVITY * deltaTime / 1000;
	}
	if(controller.left.active) player.vx = -Player.SPEED; //......................... Если нажато вправо
	if(controller.right.active) player.vx = Player.SPEED; //......................... Если нажато влево
	if(!controller.left.active && !controller.right.active) player.vx = 0; //........ Если нет движения в стороны

	// Новые координаты
	let newX = player.x + player.vx * deltaTime / 1000;
    let newY = player.y + player.vy * deltaTime / 1000;

    


    // Пока новые координаты не будут конфликтовать с окружением
    let canGo = false;
    while(!canGo){
    	canGo = true;

	    // Выход за карту
		if(newX - Player.HALF_WIDTH < 0 && newX + Player.HALF_WIDTH > gameArea.width) {
			player.vx = 0;
			newX = player.x;
			canGo = false;
		}
		if(newY < 0 && newY + Player.HEIGHT > gameArea.height) {
			player.vy = 0;
			newY = player.y;
			canGo = false;
		}
		if(!canGo) continue;

		// Проверка, не упёрся ли игрок
		if(!player.checkLeftCol(newX, newY) || !player.checkRightCol(newX, newY)) {
			newX = player.x;
			player.vx = 0;
		}
		if(!canGo) continue;

		if(!player.checkUpCol(newX, newY)) {
			newY = player.y;
			player.vy = 0;
		}
		if(!canGo) continue;

		if(!player.checkDownCol(newX, newY)) {
			newY = Math.floor(player.y);
			player.vy = 0;
		}
	}

	player.moveTo(newX, newY);

	cameraSet(player.x, player.y);
}
