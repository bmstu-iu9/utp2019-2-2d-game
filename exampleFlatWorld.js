'use strict';

const screenBlockSize = 25;  // Кол-во блоков 1х1, которые влазят на экран по высоте
const playerPos = {x: 10, y: 20};
const flatGen = (x, y, height) => {
    let arr = new Array
    for (let i = 0; i < x; i++) {
        arr[i]=new Array
        for (let j = 0; j < y; j++) {
            arr[i][j] = (j <= height)
        }
    }
    return arr
}

const image = new Image();
image.src = 'image.png';
image.onload = () => {
	const background = new Image();
	background.src = 'background.png';
	background.onload = () => {
        const r = new Render(image, background);
        let t = [];
    
        const blocks = flatGen(100, 100, 25)

        const stopX = playerPos.x + screenBlockSize  // Рисовка по Х работает "на глаз", т.е. не учитываем реальный конец экрана
        const stopY = playerPos.y + Math.floor(screenBlockSize / 2)
        for (let i = playerPos.x - screenBlockSize; i <= stopX; i++) {
            if (i >= 0 && i < blocks.length) {
                for (let j = playerPos.y - Math.ceil(screenBlockSize / 2); j <= stopY; j++) {
                    if (j >= 0 && j < blocks[Math.floor(i)].length) {
                        if (blocks[Math.floor(i)][Math.floor(j)]) {
                            t.push(r.createObject([i - Math.floor(playerPos.x), j - Math.floor(playerPos.y)], 
                                [i - Math.floor(playerPos.x) + 1, j - Math.floor(playerPos.y) + 1], [0, 0], [1, 1], 6))
                        }
                    }
                }
            }
        }
		let e = 0;
		const update = (newtime) => {
			r.render(e += 0.1, 0, screenBlockSize, t);
			requestAnimationFrame(update);
		}
		requestAnimationFrame(update);
    };
};