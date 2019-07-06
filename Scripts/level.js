/*
const cameraScale = 1;                  Масштаб, 1 - стандарт
const scale = 16                        Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;           Положение камеры
const chankWidth = 8, chankHeight = 8   Размеры чанка
const minLayout = 2, maxLayout = 3      Обрабатываемые слои
const blockResolution = 32              Разрешение текстуры блока
let deltaTime = 0                       Изменение времени между кадрами в мс
let blocks;                             Игровой мир (объект GameArea)
cameraSet(x, y)                         Устанавливает ккординаты камеры на (x, y)
elevationMap							Карта высот мира
*/



const key = performance.now();  // Ключ генерации
let x = 0, y = 0;
const beginPlay = () => {  // Вызывается только при запуске
    blocks = generate(1024, 1024, key);
	x = 0;
	y = elevationMap[x];
}


const eventTick = () => {  // Вызывается каждый кадр
	let speed = 3;
	if(x >= blocks.width - 1){
		x = 1;
		y = elevationMap[x];
	}
	let targetX = Math.floor(x) + 2, targetY = elevationMap[targetX];
    cameraSet(x += speed * (targetX - x) * deltaTime / 1000, y += speed * (targetY - y) * deltaTime / 1000)
}