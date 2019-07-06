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
*/

const key = 1654  // Ключ генерации
const beginPlay = () => {  // Вызывается только при запуске
    blocks = generate(1024, 1024, key)
}

let a = 150, b = 400
const eventTick = () => {  // Вызывается каждый кадр
    cameraSet(a += 20*deltaTime / 1000, b+=5*deltaTime / 1000)  // 20 по х и 5 по у блоков в сек
}