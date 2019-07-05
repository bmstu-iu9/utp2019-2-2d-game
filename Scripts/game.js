'use strict';

const screenBlockSize = 25;  // Кол-во блоков 1х1, которые влазят на экран по высоте
let Vx = 0, Vy = 0, x, y;  // Рекомендация: не использовать скорость больше, чем 1 чанк в кадр (в таких случаях лучше телепортироваться)
let cameraX = 0, cameraY = 0;  // Положение камеры
const blockSize = 32
const countBlocks = 8

const image = new Image();
image.src = '../Images/blocks.png';
image.onload = () => {
	const background = new Image();
	background.src = '../Images/background.png';
	background.onload = () => {
        const r = new Render(image, background);    
        const chankWidth = 16, chankHeight = 16
        let chankFirstMatchInT = { }, t = [ ];
        const blocks = generate(1024, 1024, 1341241)  // Инициализация мира

        const loadChank = (xLocate, yLocate, lt) => {
            const stopX = (xLocate + 1) * chankWidth
            const stopY = (yLocate + 1) * chankHeight
            chankFirstMatchInT[[xLocate, yLocate]] = lt.length

            for (let i = xLocate * chankWidth; i < stopX; i++) {
                for (let j = yLocate * chankHeight; j < stopY; j++) {
                    if (i >= 0 && j >= 0 && i < blocks.width && j < blocks.height) {
                        switch (blocks.map[Math.floor(i)][Math.floor(j)][GameArea.MAIN_LAYOUT]) {  // Разделение отрисовки текстур по id блока
                            case 1:
                                lt.push(r.createObject([i, j], [i + 1, j + 1], [0, 0], [1/countBlocks, 1/countBlocks], 5))
                                break;

                            case 2:
                                lt.push(r.createObject([i, j], [i + 1, j + 1], [0, 1/countBlocks], [1/countBlocks, 2/countBlocks], 5))
                                break;

                            case 3:
                                lt.push(r.createObject([i, j], [i + 1, j + 1], [0, 1/countBlocks], [1/countBlocks, 2/countBlocks], 5))
                                break;

                            case 17:
                                lt.push(r.createObject([i, j], [i + 1, j + 1], [0, 2/countBlocks], [1/countBlocks, 3/countBlocks], 5))
                                break;

                            case 18:
                                lt.push(r.createObject([i, j], [i + 1, j + 1], [1/256, 1/256], [31/256, 31/256], 5))
                                break;

                            case 7:
                                lt.push(r.createObject([i, j], [i + 1, j + 1], [1/256, 1/256], [31/256, 31/256], 5))
                                break;

                            case undefined:
                                lt.push({ })
                                break;

                            default:
                                throw Error('undefined block id')
                        }
                    } else {
                        lt.push({ })  // Каждый чанк занимает одинаковое место в t
                    }
                }
            }
        }
        const deleteChankByLocate = (xLocate, yLocate, lt) => {
            deleteChankById([xLocate, yLocate], lt)
        }
        const deleteChankById = (id, lt) => {
            if (chankFirstMatchInT[id] == 'undefined') {
                return
            }

            const chankElems = chankWidth * chankHeight
            lt.splice(chankFirstMatchInT[id], chankElems)

            for (let i in chankFirstMatchInT) {
                if (chankFirstMatchInT[i] > chankFirstMatchInT[id]) {
                    chankFirstMatchInT[i] -= chankElems
                }
            }
            delete chankFirstMatchInT[id]
        }
		const update = (newtime) => {
            const curChankX = Math.floor(cameraX / chankWidth), curChankY = Math.floor(cameraY / chankHeight);

            for (let i in chankFirstMatchInT) {
                if ( !(i === [curChankX, curChankY] ||
                    i === [curChankX + 1, curChankY] ||
                    i === [curChankX - 1, curChankY] ||
                    i === [curChankX, curChankY + 1] ||
                    i === [curChankX, curChankY - 1] ||
                    i === [curChankX + 1, curChankY + 1] ||
                    i === [curChankX + 1, curChankY - 1] ||
                    i === [curChankX - 1, curChankY + 1] ||
                    i === [curChankX - 1, curChankY + 1])) {  // Если не чанк в +\- 1 от некущего
                    deleteChankById(i, t)
                }
            }

            for (let i = curChankX - 1; i <= curChankX + 1; i++) {
                for (let j = curChankY - 1; j <= curChankY + 1; j++) {
                    if (chankFirstMatchInT[[i, j]] === undefined) {  // Если чанки вокруг (на 1) выгружены - загружаем их
                        loadChank(i, j, t)
                    }
                }
            }
            r.render(cameraX += Vx, cameraY += Vy, screenBlockSize, t);
            if ((cameraX - Vx >= x && cameraX <= x) || (cameraX - Vx <= x && cameraX >= x) ||  // Достигли по х
            (cameraY - Vy >= y && cameraY <= y) || (cameraY - Vy <= y && cameraY >= y)) {  // Достигли по у
                return
            }
			requestAnimationFrame(update);
        }
        


		requestAnimationFrame(update);
    };
};

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
moveTo (40, 100, -1, 0)
