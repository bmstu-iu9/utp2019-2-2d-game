'use strict';

let cameraScale = 1;  // Масштаб, 1 - стандарт
const blockSize = 16;  // Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;  // Положение камеры
const chankWidth = 8, chankHeight = 8;  // Размеры чанка
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
			render.settings(blockSize, chankWidth, chankHeight);

			// Отправка образцов объектов
			{
				const blocksCountX = Math.floor(image.width / blockResolution), blocksCountY =
					Math.floor(image.height / blockResolution);
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
							]});
					}
				}
				render.createObjects(objects);
			}

			let arrOfChunks = {};
			let oldTime = 0;
			const deleteChankById = (xLocate, yLocate) => {
				for (let chunk in arrOfChunks) {
					if (arrOfChunks[chunk].x === xLocate && arrOfChunks[chunk].y === yLocate) {
						delete arrOfChunks[chunk];  // Удаляем все слои чанка
					}
				}
			};
			const loadChank = (xLocate, yLocate) => {
				const stopX = (xLocate + 1) * chankWidth;
				const stopY = (yLocate + 1) * chankHeight;
				const startX = xLocate * chankWidth;
				const startY = yLocate * chankHeight;

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
									// TODO : УБРАТЬ, КОГДА ДОБАВЯТ НОРМАЛЬНУЮ ТЕКСТУРУ РАЗНЫХ ВИДОВ ВОДЫ
									if (Math.floor(gameArea.map[Math.floor(i)][Math.floor(j)][layout] / 1000) >= 1 )
										layoutChunk.chunk[i - startX][j - startY] = Math.floor(gameArea
											.map[Math.floor(i)][Math.floor(j)][layout] / 1000);
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
			};
			
			const update = (newTime) => {
				deltaTime = (newTime - oldTime) / 1000;
				oldTime = newTime;

				eventTick();
        
				{  // Обновление чанков
					const curChankX = Math.floor(cameraX / chankWidth), curChankY = Math.floor(cameraY / chankHeight);
					const halfScreenChunkCapasityX = Math.ceil(render.getFieldSize()[0] / (2 * chankWidth)),
						halfScreenChunkCapasityY = Math.ceil(render.getFieldSize()[1] / (2 * chankHeight))
					let neigChunk = {};
					for (let i = curChankX - halfScreenChunkCapasityX; i <= curChankX + halfScreenChunkCapasityX;
						i++) {
						neigChunk[i] = {};
						for (let j = curChankY - halfScreenChunkCapasityY; j <= curChankY + halfScreenChunkCapasityY;
							j++) {
							neigChunk[i][j] = false;
						}
					}

					for (let chunk in arrOfChunks) {
						if (neigChunk[arrOfChunks[chunk].x] === undefined ||
						neigChunk[arrOfChunks[chunk].x][arrOfChunks[chunk].y] === undefined) {
							// Если не ближайший чанк, то удаляем
							deleteChankById(arrOfChunks[chunk].x, arrOfChunks[chunk].y);
						} else {
							// Если чанк ближайший, то помечаем как отрисованный
							neigChunk[arrOfChunks[chunk].x][arrOfChunks[chunk].y] = true;
						}
					}

					for (let i = curChankX - halfScreenChunkCapasityX; i <= curChankX + halfScreenChunkCapasityX;
						i++) {
						for (let j = curChankY - halfScreenChunkCapasityY; j <= curChankY + halfScreenChunkCapasityY;
							j++) {
							loadChank(i, j);
						}
					}
				}
				
				render.OLDrender(cameraX, cameraY, player.x, player.y, cameraScale, arrOfChunks);
				fpsUpdate();
				requestAnimationFrame(update);
			}
			
			if (loadExist()) {
				let wait = async () => {
					return new Promise (responce => {
						load('world')
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
