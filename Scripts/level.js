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
const beginPlay = () => {  // Вызывается только при запуске
    gameArea = generate(1024, 1024, key);
	_x = 0;
	_y = gameArea.elevationMap[_x];
}


const eventTick = () => {  // Вызывается каждый кадр
	gameArea.timeOfDay = _x / gameArea.width;
	let speed = 10;
	if(_x >= gameArea.width - 1){
		_x = 1;
		_y = gameArea.elevationMap[_x];
	}
	let targetX = Math.floor(_x) + 2, targetY = gameArea.elevationMap[targetX];
    cameraSet(_x += speed * (targetX - _x) * deltaTime / 1000, _y += speed * (targetY - _y) * deltaTime / 1000)
}