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
    player = new Player(2, gameArea.elevationMap[0] + 1);
}

// Вызывается каждый кадр
const eventTick = () => {
	currentTime += deltaTime;
	setTimeOfDay(currentTime, 60);
	playerMovement();
	mouseControl();
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
		if(controller.up.active) {
			player.vy = Player.JUMP_SPEED;
		}
	} else {
		if(controller.up.active && player.vy > 0) { //................................... Удержание прыжка
			player.vy -= GameArea.GRAVITY * deltaTime / 1500;
		} else {
			player.vy -= GameArea.GRAVITY * deltaTime / 1000;
		}
	}
	if(controller.left.active) player.vx = -Player.SPEED; //......................... Если нажато вправо
	if(controller.right.active) player.vx = Player.SPEED; //......................... Если нажато влево
	if(!controller.left.active && !controller.right.active) player.vx = 0; //........ Если нет движения в стороны

	// Новые координаты
	let newX = player.x + player.vx * deltaTime / 1000;
    let newY = player.y + player.vy * deltaTime / 1000;

    // Пока новые координаты не перестанут конфликтовать с окружением
	// Выход за карту
	if(newX - Player.WIDTH / 2 < 0 && newX + Player.WIDTH / 2 > gameArea.width) {
		player.vx = 0;
		newX = player.x;
		canGo = false;
	}
	if(newY < 0 && newY + Player.HEIGHT > gameArea.height) {
		player.vy = 0;
		newY = player.y;
	}
	// Проверка, не упёрся ли игрок
	if(player.vx < 0 && player.isCollisionLeft(newX, newY)) {
		newX = player.x;
		player.vx = 0;
	}
	if(player.vx > 0 && player.isCollisionRight(newX, newY)) {
		newX = player.x;
		player.vx = 0;
	}
	if(player.vy > 0 && player.isCollisionUp(newX, newY)) {
		newY = player.y;
		player.vy = 0;
	}
	if(player.vy < 0 && player.isCollisionDown(newX, newY)) {
		newY = Math.floor(player.y);
		player.vy = 0;
	}

	player.x = newX;
	player.y = newY;

	cameraSet(player.x, player.y);
}

const mouseControl = () => {
    // Когда зажата ЛКМ
    if(controller.mouse.click === 1){
        const len = Math.sqrt(controller.mouse.direction.x * controller.mouse.direction.x +
			controller.mouse.direction.y * controller.mouse.direction.y);
        for(let i = 0; i < Math.min(Player.ACTION_RADIUS, len / scale / cameraScale); i += 1 / scale / cameraScale){
            const x = Math.floor(i * controller.mouse.direction.x / len + player.x);
			const y = Math.floor(i * controller.mouse.direction.y / len + player.y + Player.HEIGHT / 2);
			if (x < 0 || x >= gameArea.width || y < 0 || y >= gameArea.height) {
				break;
			}
            if(gameArea.map[x][y][GameArea.MAIN_LAYOUT] != undefined) {
                gameArea.destroyBlock(x, y, GameArea.MAIN_LAYOUT);
                break;
            }
        }
	}
	// Когда зажата ПКМ
	if(controller.mouse.click === 3){

	}
}
