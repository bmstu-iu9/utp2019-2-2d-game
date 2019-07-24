'use strict';

let cameraScale = 1;  // Масштаб, 1 - стандарт
const blockSize = 16;  // Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;  // Положение камеры
const chunkWidth = 16, chunkHeight = 16;  // Размеры чанка
const minLayout = 2, maxLayout = 4;  // Обрабатываемые слои
const blockResolution = 32;  // Разрешение текстуры блока
let deltaTime = 0;  // Изменение времени между кадрами в секундах
let gameArea;  // Игровой мир (объект GameArea)
let slicePlayer = 1; // 1 - игрок на переднем слое, 2 - за передним слоем

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
			render.settings(blockSize, chunkWidth, chunkHeight, [1, 0.65, 0.4]);

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
							]
							});
					}
				}
				render.createObjects(objects);
			}

			let OnScreen = {};
			let arrOfChunks = {};
			let oldTime = 0;
			let oldTimeOfDay = 0;
			const deletechunkById = (xLocate, yLocate) => {
				for (let chunk in arrOfChunks) {
					if (arrOfChunks[chunk].x === xLocate && arrOfChunks[chunk].y === yLocate) {
						delete arrOfChunks[chunk];  // Удаляем все слои чанка
					}
				}
				delete OnScreen[xLocate + "x" + yLocate];
				render.deleteChunk(xLocate, yLocate);
			};
			const loadchunk = (xLocate, yLocate) => {
				const stopX = (xLocate + 1) * chunkWidth;
				const stopY = (yLocate + 1) * chunkHeight;
				const startX = xLocate * chunkWidth;
				const startY = yLocate * chunkHeight;

				for (let layout = minLayout; layout <= maxLayout; layout++) {
					let layoutChunk = [];

					for (let i = startX; i < stopX; i++) {
						layoutChunk[i - startX] = [];
						for (let j = startY; j < stopY; j++) {
							if (i >= 0 && j >= 0 && i < gameArea.width && j < gameArea.height) {

								// Элементы слоя света - уровень освещенности блока
								if (layout === maxLayout + 1) {
									layoutChunk[i - startX][j - startY] =
										gameArea.getLight(Math.floor(i), Math.floor(j));
								} else {
									// TODO : УБРАТЬ, КОГДА ДОБАВЯТ НОРМАЛЬНУЮ ТЕКСТУРУ РАЗНЫХ ВИДОВ ВОДЫ
									if (Math.floor(gameArea.map[Math.floor(i)][Math.floor(j)][layout] / 9000) === 1)
										layoutChunk[i - startX][j - startY] = 9;
									else layoutChunk[i - startX][j - startY] =
										gameArea.map[Math.floor(i)][Math.floor(j)][layout];
								}
							} else {
								layoutChunk[i - startX][j - startY] = undefined;
							}
						}
					}

					arrOfChunks[xLocate + "x" + yLocate + "x" + layout] =
						layoutChunk;
				}

				arrOfChunks[xLocate + "x" + yLocate + "xL"] = [];
				for (let i = startX - 1; i <= stopX; i++) {
					for (let j = startY - 1; j <= stopY; j++) {
						arrOfChunks[xLocate + "x" + yLocate + "xL"].push(gameArea
							.getLight(
								Math.floor(i < 0
									? 0 : (i >= gameArea.width
										? gameArea.width - 1: i)),
								Math.floor(j < 0
									? 0 : (j >=gameArea.height
										? gameArea.height - 1 : j))));
					}
				}console.log(arrOfChunks[xLocate + "x" + yLocate + "xL"])

				// Строго 3 слоя
				render.drawChunk(xLocate, yLocate,
					[
						arrOfChunks[xLocate + "x" + yLocate + "x" + GameArea.FIRST_LAYOUT],
						arrOfChunks[xLocate + "x" + yLocate + "x" + GameArea.SECOND_LAYOUT],
						arrOfChunks[xLocate + "x" + yLocate + "x" + GameArea.BACK_LAYOUT]
					],
					arrOfChunks[xLocate + "x" + yLocate + "xL"]);
			}

			const update = (newTime) => {
				deltaTime = (newTime - oldTime) / 1000;
				oldTime = newTime;

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
						}
					}

					let changeTimeOfDay = oldTimeOfDay !== gameArea.timeOfDay;
					for (let i = curchunkX - halfScreenChunkCapasityX; i <= curchunkX + halfScreenChunkCapasityX;
						i++) {
						for (let j = curchunkY - halfScreenChunkCapasityY; j <= curchunkY + halfScreenChunkCapasityY;
							j++) {
								if (gameArea.chunkDifferList[i + "x" + j] !== undefined
									|| !OnScreen[i + "x" + j] || changeTimeOfDay) {

									OnScreen[i + "x" + j] = true;
									loadchunk(i, j);
								}
						}
					}
					oldTimeOfDay = gameArea.timeOfDay;
				}

				gameArea.chunkDifferList = {};  // Очистка изменений для следующего кадра
				const lightOfDay = Math.round((1 + gameArea.timeOfDay * 2) * 30) / 90; // освещённость фона
				const lightOfPlayer = player.getLight(); // освещённость игрока
				render.render(cameraX, cameraY, player.x, player.y, cameraScale, lightOfDay, lightOfPlayer, slicePlayer);
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
