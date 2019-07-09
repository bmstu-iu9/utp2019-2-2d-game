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
let _x = 0, _y = 0;
let currentTime = 0;
const beginPlay = () => {  // Вызывается только при запуске
    gameArea = generate(1024, 1024, key);
	_x = 0;
	_y = gameArea.elevationMap[_x];
  player = new Player(gameArea, _x + Player.HALF_WIDTH, _y + 1);
}

const eventTick = () => {  // Вызывается каждый кадр
	currentTime += deltaTime;
	setTimeOfDay(currentTime, 60);
}

const setTimeOfDay = (currentTime, lenghtOfDay) => {
	currentTime = currentTime / 1000 / lenghtOfDay * Math.PI * 4 % (Math.PI * 4);
	if(currentTime < Math.PI){ //День
		gameArea.timeOfDay = 1;
	}else if(currentTime < 2 * Math.PI){ // День -> Ночь
		gameArea.timeOfDay = (Math.cos(currentTime % Math.PI) + 1) / 2;
	}else if(currentTime < 3 * Math.PI){ // Ночь
		gameArea.timeOfDay = 0;
	}else{ // Ночь -> День
		gameArea.timeOfDay = 1 - (Math.cos(currentTime % Math.PI) + 1) / 2;
	}
}
