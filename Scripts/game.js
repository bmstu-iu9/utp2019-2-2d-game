'use strict';

const cameraScale = 1;  // Масштаб, 1 - стандарт
let Vx = 0, Vy = 0, x, y;  // Рекомендация: не использовать скорость больше, чем 1 чанк в кадр (в таких случаях лучше телепортироваться)
let cameraX = 0, cameraY = 0;  // Положение камеры
const scale = 16  // Масштаб камеры (пикселей в блоке при cameraScale = 1)
const chankWidth = 4, chankHeight = 4
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

            {
                const halfScreenChunkCapasityX = Math.ceil(r.getFieldSize()[0] / (2 * chankWidth)),
                    halfScreenChunkCapasityY = Math.ceil(r.getFieldSize()[1] / (2 * chankHeight))
                let neigChunk = { }
                for (let i = curChankX - halfScreenChunkCapasityX; i <= curChankX + halfScreenChunkCapasityX; i++) {
                    neigChunk[i] = { }
                    for (let j = curChankY - halfScreenChunkCapasityY; j <= curChankY + halfScreenChunkCapasityY; j++) {
                        neigChunk[i][j] = false
                    }
                }

                for (let chunk in arrOfChunks) {
                    if (neigChunk[arrOfChunks[chunk].x] === undefined ||
                    neigChunk[arrOfChunks[chunk].x][arrOfChunks[chunk].y] === undefined) {  // Если не ближайший чанк
                        deleteChankById(arrOfChunks[chunk].x, arrOfChunks[chunk].y, arrOfChunks)
                    } else {  // Если чанк ближайший, то помечаем как отрисованный
                        neigChunk[arrOfChunks[chunk].x][arrOfChunks[chunk].y] = true
                    }
                }

                for (let i = curChankX - halfScreenChunkCapasityX; i <= curChankX + halfScreenChunkCapasityX; i++) {
                    for (let j = curChankY - halfScreenChunkCapasityY; j <= curChankY + halfScreenChunkCapasityY; j++) {
                        if(!neigChunk[i][j]) {
                            loadChank(i, j, blocks, arrOfChunks)
                        }
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
        if (arrOfChunks[chunk].x === xLocate && arrOfChunks[chunk].y === yLocate) {
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
                    layoutChunk.chunk[i - startX][j - startY] = blocks.map[Math.floor(i)][Math.floor(j)][layout]
                } else {
                    layoutChunk.chunk[i - startX][j - startY] = undefined
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

teleportTo(500, 700)
moveTo (-1,-1, 0.2, 0)
