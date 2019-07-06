'use strict';

const cameraScale = 1;  // Масштаб, 1 - стандарт
let Vx = 0, Vy = 0, x, y;  // Рекомендация: не использовать скорость больше, чем 1 чанк в кадр (в таких случаях лучше телепортироваться)
let cameraX = 0, cameraY = 0;  // Положение камеры
const scale = 32  // Масштаб камеры (пикселей в блоке при cameraScale = 1)
const chankWidth = 64, chankHeight = 32
const minLayout = 2, maxLayout = 2
const blockResolution = 32  // Разрешение текстуры блока
let deltaTime = 0

const image = new Image();
image.src = 'Images/blocks.png';
image.onload = () => {
	const background = new Image();
	background.src = 'Images/background.png';
	background.onload = () => {
        const r = new Render(image, image);
        r.settings(scale, chankWidth, chankHeight)

        {
            const blocksCountX = Math.floor(image.width / blockResolution), blocksCountY = Math.floor(image.height / blockResolution)
            let objects = [ ]
            for (let i = 0; i < blocksCountX; i++) {
                for (let j = 0; j < blocksCountY; j++) {
                    objects.push({'id': j * blocksCountX + i + 1,
                'a': [i * 1 / blocksCountX + 1 / image.width, j * 1 / blocksCountY + 1 / image.height],
                'b': [(i + 1) * 1 / blocksCountX - 1 / image.width, (j + 1) * 1 / blocksCountY - 1 / image.height]})
                }
            }
            r.createObjects(objects);
        }

        const blocks = generate(1024, 1024, 1341241);  // Инициализация мира

        let arrOfChunks = { }
        
        let oldTime = 0
		const update = (newTime) => {
            const curChankX = Math.floor(cameraX / chankWidth), curChankY = Math.floor(cameraY / chankHeight);
            newTime *= 0.01;
            deltaTime = newTime - oldTime
            oldTime = newTime
            let neigChunk = [
                [false, false, false],
                [false, false, false],
                [false, false, false]]
                
            for (let chunk in arrOfChunks) {
                if ( !((chunk.x === curChankX && chunk.y === curChankY) ||
                    (chunk.x === curChankX + 1 && chunk.y === curChankY) ||
                    (chunk.x === curChankX - 1 && chunk.y === curChankY) ||
                    (chunk.x === curChankX && chunk.y === curChankY + 1) ||
                    (chunk.x === curChankX && chunk.y === curChankY - 1) ||
                    (chunk.x === curChankX + 1 && chunk.y === curChankY + 1) ||
                    (chunk.x === curChankX + 1 && chunk.y === curChankY - 1) ||
                    (chunk.x === curChankX - 1 && chunk.y === curChankY + 1) ||
                    (chunk.x === curChankX - 1 && chunk.y === curChankY - 1))) {  // Если не чанк в +\- 1 от некущего
                    deleteChankById(chunk.x, chunk.y, arrOfChunks)
                } else {  // Если чанк ближайший, то помечаем как отрисованный
                    neigChunk[chunk.x + 1 - curChankX][chunk.y + 1 - curChankY] = true
                }
            }

            for (let i = 0; i < neigChunk.length; i++) {
                for (let j = 0; j < neigChunk[i].length; j++) {
                    if(!neigChunk[i][j]) {
                        loadChank(i + curChankX - 1, j + curChankY - 1, blocks, arrOfChunks)
                    }
                }
            }

            r.render(cameraX += Vx * deltaTime, cameraY += Vy * deltaTime, cameraScale, arrOfChunks);
            if ((cameraX - Vx >= x && cameraX <= x) || (cameraX - Vx <= x && cameraX >= x) ||  // Достигли по х
            (cameraY - Vy >= y && cameraY <= y) || (cameraY - Vy <= y && cameraY >= y)) {  // Достигли по у
                return
            }
            fpsUpdate()
			requestAnimationFrame(update);
        }

		requestAnimationFrame(update);
    };
};

const deleteChankById = (xLocate, yLocate, arrOfChunks) => {
    for (let chunk in arrOfChunks) {
        if (chunk.x === xLocate && chunk.y === yLocate) {
            delete arrOfChunks[chunk]  // Удаляем все слои чанка
        }
    }
}

const loadChank = (xLocate, yLocate, blocks, arrOfChunks) => {
    const stopX = (xLocate + 1) * chankWidth
    const stopY = (yLocate + 1) * chankHeight
    const startX = xLocate * chankWidth
    const startY = yLocate * chankHeight

    for (let layout = minLayout; layout <= maxLayout; layout++) {
        let layoutChunk = { chunk: [ ], x: xLocate, y: yLocate, slice: layout }
        for (let i = startX; i < stopX; i++) {
            layoutChunk.chunk[i - startX] = [ ]
            for (let j = startY; j < stopY; j++) {
                if (i >= 0 && j >= 0 && i < blocks.width && j < blocks.height) {
                    layoutChunk.chunk[i % chankWidth][j % chankHeight] = blocks.map[Math.floor(i)][Math.floor(j)][layout]
                } else {
                    layoutChunk.chunk[i % chankWidth][j % chankWidth] = undefined
                }
            }
        }
        arrOfChunks[xLocate + "x" + yLocate + "x" + layout] = layoutChunk
    }
}

const moveTo = (toX, toY, curVx, curVy) => {
    x = toX
    y = toY
    Vx = curVx
    Vy = curVy
}
const teleportTo = (toX, toY) => {
    cameraX = toX
    cameraY = toY
}

teleportTo(150, 600)
moveTo (40, 100, 0.2, 0)
