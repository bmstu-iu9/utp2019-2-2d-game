'use strict';

let cameraScale = 1;  // Масштаб, 1 - стандарт
const blockSize = 16;  // Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;  // Положение камеры
const chunkWidth = 8, chunkHeight = 8;  // Размеры чанка
const minLayout = 2, maxLayout = 3;  // Обрабатываемые слои
const blockResolution = 32;  // Разрешение текстуры блока
let deltaTime = 0;  // Изменение времени между кадрами в секундах
let gameArea;  // Игровой мир (объект GameArea)
let loadingResult = undefined;

const render = new Render();

const image = new Image();
image.src = 'Images/blocks.png';
image.onload = () => {
	const background = new Image();
	background.src = 'Images/background.png';
	background.onload = () => {
		const playerImage = new Image();
		playerImage.src = 'Images/player.png';
		playerImage.onload = () => {
			render.init(image, background, playerImage);
			render.settings(blockSize, chunkWidth, chunkHeight, 1, 0.5);

			// Отправка образцов объектов
			{
				const blocksCountX = Math.floor(image.width / blockResolution),
					blocksCountY = Math.floor(image.height / blockResolution);
				let objects = [];
				for (let i = 0; i < blocksCountX; i++) {
					for (let j = 0; j < blocksCountY; j++) {
						objects.push({
							'id': j * blocksCountX + i + 1,
							'a': [
								i / blocksCountX + 1 / image.width,
								j / blocksCountY + 1 / image.height
							],
							'b': [
								(i + 1) / blocksCountX - 1 / image.width,
								(j + 1) / blocksCountY - 1 / image.height
							],
							'transparency': items[j * blocksCountX + i + 1] !== undefined
								? !items[j * blocksCountX + i + 1].isSolid
								: false
							});
					}
				}
				render.createObjects(objects);
			}

			let arrOfChunks = {};
			let oldTime = 0;
			const deletechunkById = (xLocate, yLocate) => {
				for (let chunk in arrOfChunks) {
					if (arrOfChunks[chunk].x === xLocate && arrOfChunks[chunk].y === yLocate) {
						delete arrOfChunks[chunk];  // Удаляем все слои чанка
					}
				}
				render.deleteChunk(xLocate, yLocate);
			};
			const loadchunk = (xLocate, yLocate) => {
				const stopX = (xLocate + 1) * chunkWidth;
				const stopY = (yLocate + 1) * chunkHeight;
				const startX = xLocate * chunkWidth;
				const startY = yLocate * chunkHeight;

				// + 1 слой света
				for (let layout = minLayout; layout <= maxLayout + 1; layout++) {
					let layoutChunk = {
						chunk: [], x: xLocate, y: yLocate
					};

					if (layout !== maxLayout + 1) {  //............ Если не слой света
						layoutChunk.slice = layout;
						if (layout === GameArea.MAIN_LAYOUT) {
							layoutChunk.light = 1;
						} else {
							layoutChunk.light = 0.5;
						}
					} else {  //................................... У слоя света нет поля slice
						layoutChunk.light = -100;  //.............. Слой света имеет light = -100
					}

					for (let i = startX; i < stopX; i++) {
						layoutChunk.chunk[i - startX] = [];
						for (let j = startY; j < stopY; j++) {
							if (i >= 0 && j >= 0 && i < gameArea.width && j < gameArea.height) {

								// Элементы слоя света - уровень освещенности блока
								if (layout === maxLayout + 1) {
									layoutChunk.chunk[i - startX][j - startY] =
										gameArea.getLight(Math.floor(i), Math.floor(j));
								} else {
									if (Math.floor(gameArea.map[Math.floor(i)][Math.floor(j)][layout] / 9000) === 1) // TODO : УБРАТЬ, КОГДА ДОБАВЯТ НОРМАЛЬНУЮ ТЕКСТУРУ РАЗНЫХ ВИДОВ ВОДЫ
										layoutChunk.chunk[i - startX][j - startY] = 9;
									else layoutChunk.chunk[i - startX][j - startY] =
										gameArea.map[Math.floor(i)][Math.floor(j)][layout];
								}
							} else {
								layoutChunk.chunk[i - startX][j - startY] = undefined;
							}
						}
					}
					arrOfChunks[xLocate + "x" + yLocate + "x" + (layout === maxLayout + 1 ? "L" : layout)] =
						layoutChunk;
				}
				// Строго 2 слоя
				if (gameArea.chunkDifferList[xLocate + "x" + yLocate] !== undefined) {
					render.drawChunk(xLocate, yLocate, arrOfChunks[xLocate + "x" + yLocate + "x" + minLayout].chunk,
						arrOfChunks[xLocate + "x" + yLocate + "x" + maxLayout].chunk,
						arrOfChunks[xLocate + "x" + yLocate + "x" + "L"].chunk);
				}
			};
			
			const update = (newTime) => {
				deltaTime = (newTime - oldTime) / 1000;
				oldTime = newTime;
				gameArea.chunkDifferList = {};  // TODO : нормальную работу с полем chunkDifferList

				eventTick();
        
				{  // Обновление чанков
					const curchunkX = Math.floor(cameraX / chunkWidth), curchunkY = Math.floor(cameraY / chunkHeight);
					const halfScreenChunkCapasityX = Math.ceil(render.getFieldSize()[0] * cameraScale / (2 * chunkWidth)),
						halfScreenChunkCapasityY = Math.ceil(render.getFieldSize()[1] * cameraScale / (2 * chunkHeight))
					let neigChunk = {};
					for (let i = curchunkX - halfScreenChunkCapasityX; i <= curchunkX + halfScreenChunkCapasityX;
						i++) {
						neigChunk[i] = {};
						for (let j = curchunkY - halfScreenChunkCapasityY; j <= curchunkY + halfScreenChunkCapasityY;
							j++) {
							neigChunk[i][j] = false;
						}
					}

					for (let chunk in arrOfChunks) {
						if (neigChunk[arrOfChunks[chunk].x] === undefined ||
						neigChunk[arrOfChunks[chunk].x][arrOfChunks[chunk].y] === undefined) {
							// Если не ближайший чанк, то удаляем
							deletechunkById(arrOfChunks[chunk].x, arrOfChunks[chunk].y);
						} else {
							// Если чанк ближайший, то помечаем как отрисованный
							neigChunk[arrOfChunks[chunk].x][arrOfChunks[chunk].y] = true;
							gameArea.chunkDifferList[arrOfChunks[chunk].x + "x" + arrOfChunks[chunk].y] = true;
						}
					}

					for (let i = curchunkX - halfScreenChunkCapasityX; i <= curchunkX + halfScreenChunkCapasityX;
						i++) {
						for (let j = curchunkY - halfScreenChunkCapasityY; j <= curchunkY + halfScreenChunkCapasityY;
							j++) {
							loadchunk(i, j);
						}
					}
				}

				render.render(cameraX, cameraY, player.x, player.y, cameraScale);
				fpsUpdate();
				requestAnimationFrame(update);
			}

			if (loadExist()) {
				let wait = async () => {
					return new Promise (responce => {
						loadWorld('world')
						.then(result => {
							loadingResult = result;
							responce();
						});
					});
				}

				wait().then(() => {
					beginPlay();
					const elem = document.getElementById("loading");
					elem.parentNode.removeChild(elem);
					requestAnimationFrame(update);
				});
			} else {
				beginPlay();
				const elem = document.getElementById("loading");
				elem.parentNode.removeChild(elem);
				requestAnimationFrame(update);
			}
		}
    }
}

const cameraSet = (x, y) => {
    cameraX = x;
    cameraY = y;
}
