'use strict';

let imageCounter = 0, totalImages = 0;
let heigthCount = 50;  // Количество блоков, которые влезают на экран по высоте
let cameraScale = 1;  // Масштаб, 1 - стандарт, зависит от heigthCount
const blockSize = 32;  // Масштаб камеры (пикселей в блоке при cameraScale = 1)
let cameraX = 0, cameraY = 0;  // Положение камеры
const chunkWidth = 16, chunkHeight = 16;  // Размеры чанка
const minLayout = 2, maxLayout = 4;  // Обрабатываемые слои
const blockResolution = 32;  // Разрешение текстуры блока
let deltaTime = 0;  // Изменение времени между кадрами в секундах
let gameArea;  // Игровой мир (объект GameArea)
let slicePlayer = 1; // 1 - игрок на переднем слое, 2 - за передним слоем
const playerResolutionX = 48, playerResolutionY = 96;
let loadingResult = undefined;
let _textureUI;
let _fontUI;

const loadImage = (source) => {
	totalImages++;
	const tmp = new Image();
	tmp.src = source;
	tmp.onload = () => {
		imageCounter++;
		if (totalImages === imageCounter) {
			preprocessing();
		}
	}
	return tmp;
}

const _UI = loadImage('Images/UI.png'),  // Загрузка текстур
	_Items = loadImage('Images/items.png'),
	_Font = loadImage('Images/font.png'),
	image = loadImage('Images/blocks.png'),
	background = loadImage('Images/background.png'),
	playerImage = loadImage('Images/player.png'),
	animationWater = loadImage('Images/animations/water.png'),
	animationLava = loadImage('Images/animations/lava.png');

const preprocessing = () => {
	render.init([image, background, playerImage, _Items], [animationWater, animationLava]);
	render.settings(blockSize, chunkWidth, chunkHeight, [1, 0.65, 0.4]);
	initRain();
	_textureUI = render.createTexture(_UI, _UI.width, _UI.height);
	_fontUI = render.createTexture(_Font, _Font.width, _Font.height);
	_textureItems = render.createTexture(_Items, _Items.width, _Items.height);

	// Отправка образцов объектов
	{
		const blocksCountX = Math.floor(image.width / blockResolution),
			blocksCountY = Math.floor(image.height / blockResolution);
		let objects = [];
		for (let i = 0; i < blocksCountX; i++) {
			for (let j = 0; j < blocksCountY; j++) {
				objects[j * blocksCountX + i] = {
					'id': j * blocksCountX + i + 1,
					'a': [
						i / blocksCountX, //+ 1 / image.width,              Для альтернативного метода сглаживания
						j / blocksCountY //+ 1 / image.height
					],
					'b': [
						(i + 1) / blocksCountX, //- 1 / image.width,
						(j + 1) / blocksCountY //- 1 / image.height
					]
				};
			}
		}
		render.createObjects(objects);

		const playerAnimsCountX = playerImage.width / playerResolutionX,
			playerAnimsCountY = playerImage.height / playerResolutionY;
		let playerAnims = [];
		for (let j = 0; j < playerAnimsCountY; j++) {
			for (let i = 0; i < playerAnimsCountX; i++) {
				playerAnims[j * playerAnimsCountY + i] = {
					'head': [
						[
							i / playerAnimsCountX,
							j / playerAnimsCountY
						],
						[
							(i + 1) / playerAnimsCountX,
							j / playerAnimsCountY + 30 / playerImage.height
							// Конец головы по у, 30 прикселей - длина головы
						],
						96 // конец головы (снизу вверх)
					],
					'body': [
						[
							i / playerAnimsCountX,
							j / playerAnimsCountY + 31 / playerImage.height
						],
						[
							(i + 1) / playerAnimsCountX,
							j / playerAnimsCountY + (30 + 28) / playerImage.height
							// Конец тела по у, 28 прикселей - длина тела
						],
						38 + 28 // конец тела (снизу вверх)
					],
					'legs': [
						[
							i / playerAnimsCountX,
							j / playerAnimsCountY + 59 / playerImage.height
						],
						[
							(i + 1) / playerAnimsCountX,
							j / playerAnimsCountY + (58 + 38) / playerImage.height
							// Конец ног по у, 38 прикселей - длина ног
						],
						38 // конец ног (снизу вверх)
					]
				};
			}
		}
		render.createAnimations(playerResolutionX, playerResolutionY, playerAnims);
	}
	
	{ // инициализация анимаций
		// вода
		const waterTex = (id) => {
			return id === 8 || id === 9 || (id >= 129 && id <= 152);
		}
		
		// лава
		const lavaTex = (id) => {
			return id === 10 || id === 11 || (id >= 153 && id <= 176);
		}
		
		render.initAnimations([[waterTex, 191], [lavaTex, 192]]);
	}

	let OnScreen = {};
	let arrOfChunks = {};
	let oldTime;
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
			let layoutChunk = {
				chunk: [], x: xLocate, y: yLocate
			};

			for (let j = startY; j <= stopY; j++) {
				layoutChunk.chunk[j - startY] = [];
				for (let i = startX; i < stopX; i++) {
					if (i >= 0 && j >= 0 && i < gameArea.width && j < gameArea.height) {
						// id блоков выше 9000 на текстуре находятся начиная с половины
						if (Math.floor(gameArea.map[Math.floor(i)][Math.floor(j)][layout] / 9000) === 1) {
							layoutChunk.chunk[j - startY][i - startX] =
							gameArea.map[Math.floor(i)][Math.floor(j)][layout] - 9000 + 129;
						} else {
							layoutChunk.chunk[j - startY][i - startX] =
								gameArea.map[Math.floor(i)][Math.floor(j)][layout];
						}
					} else {
						layoutChunk.chunk[j - startY][i - startX] = undefined;
					}
				}
			}

			arrOfChunks[xLocate + "x" + yLocate + "x" + layout] = layoutChunk;
		}

		arrOfChunks[xLocate + "x" + yLocate + "xL"] = {
			chunk: [],
			layout: "L"
		};
		for (let j = startY - 1; j <= stopY; j++) {
			for (let i = startX - 1; i <= stopX; i++) {
				arrOfChunks[xLocate + "x" + yLocate + "xL"]
					.chunk
					.push(gameArea
					.getLight(
						Math.floor(i < 0
							? 0 : (i >= gameArea.width
								? gameArea.width - 1: i)),
						Math.floor(j < 0
							? 0 : (j >= gameArea.height
								? gameArea.height - 1 : j))));
			}
		}

		render.drawChunk(xLocate, yLocate,
			[
				arrOfChunks[xLocate + "x" + yLocate + "x" + GameArea.FIRST_LAYOUT].chunk,
				arrOfChunks[xLocate + "x" + yLocate + "x" + GameArea.SECOND_LAYOUT].chunk,
				arrOfChunks[xLocate + "x" + yLocate + "x" + GameArea.BACK_LAYOUT].chunk
			],
			arrOfChunks[xLocate + "x" + yLocate + "xL"].chunk);
	}

	const bufferOldTime = (newTime) => {
		oldTime = newTime;
		onStart();
		requestAnimationFrame(update);
	}

	const update = (newTime) => {
		deltaTime = (newTime - oldTime) / 1000;
		if (deltaTime > 0.1) {
			deltaTime = 0.1;
		}
		oldTime = newTime;
		const canvasSize = render.getCanvasSize();
		if (canvasSize[0] > 2 * canvasSize[1]) {
			cameraScale = (2 * heigthCount * blockSize) / canvasSize[0];
		} else {
			cameraScale = (heigthCount * blockSize) / canvasSize[1];
		}

		eventTick();

		{  // Обновление чанков
			const curchunkX = Math.floor(cameraX / chunkWidth), curchunkY = Math.floor(cameraY / chunkHeight);
			const halfScreenChunkCapasityX =
				Math.ceil(render.getFieldSize()[0] * cameraScale / (2 * chunkWidth)),
				halfScreenChunkCapasityY =
					Math.ceil(render.getFieldSize()[1] * cameraScale / (2 * chunkHeight));
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
				if (arrOfChunks[chunk].layout === "L") {
					continue;
				}
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
		const dynamicLight = [9, player.light]; // 1 элемент - диаметр в блоках, 2 элемент - максимальное освещение (от 0 до 1)

		render.render(cameraX, cameraY, player.x, player.y, cameraScale, oldTime, deltaTime, lightOfDay, lightOfPlayer,
			slicePlayer, player.direction, dynamicLight);
		
		drawUI();
		render.drawObjects(_textureUI, _renderingUIArr);
		
		fpsUpdate();
		requestAnimationFrame(update);
	}

	const loadingGame = async () => {
		await beginPlay();
		const elem = document.getElementById("loading");
		elem.parentNode.removeChild(elem);
	}

	if (localStorage.choosedWorld !== undefined) {
		const wait = async () => {
			return new Promise (responce => {
				loadWorld(localStorage.choosedWorld)
				.then(result => {
					loadingResult = result;
					responce();
				});
			});
		}

		wait().then(() => {
			loadingGame().then(() => {
				requestAnimationFrame(bufferOldTime);
			});
		});
	} else {
		loadingGame().then(() => {
			requestAnimationFrame(bufferOldTime);
		});
	}
}

const cameraSet = (x, y) => {
	cameraX = x;
	cameraY = y;
}	
