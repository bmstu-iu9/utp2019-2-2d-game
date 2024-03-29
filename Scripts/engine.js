'use strict';

// Версия: 3

// Не лезь, оно тебя сожрёт!

/***********************************************************************************************************************

Как это использовать?

	ИНИЦИАЛИЗАЦИЯ:
Инициализация движка:
const r = new Engine();
r.init([image, background, playerImage, interface], [waterAnimation, lavaAnimation]);
	image - это объект Image
	background - это изображение с фоном объекта Image
	playerImage - это изображение с игроком объекта Image
	interface - это изображение с интерфейсом объекта Image
	waterAnimation - это изображение с анимацией воды
	lavaAnimation - это изображение с анимацией лавы

Пример использования типа Image:
const image = new Image();
image.src = 'image.png';
image.onload = () => {
	...
}

Изображения должны находится в виде текстурного атласа, которые будут с помощью текстурных координат частично
использоваться.
Изображения должны быть квадратными и использовать размер степени двойки.

Настройка (должна быть вызвана перед созданием объектов обязательно):
.settings(size, widthChunk, heightChunk, lightOfChunks)
	size - размер блоков
	widthChunk - ширина чанков
	heightChunk - высота чанков
	lightOfChunks - массив коэфициентов освещения слоёв (на данный момент не используется)

Создание объектов:
.createObjects(arrayOfObjects)
	arrayOfChunk - массив/объект таких ассоциативных массивов:
		{'id': id, 'a': [x1, y1], 'b': [x2, y2]}
			id - id блока
			x1, y1 - координаты левого верхнего угла на текстуре [0..1]
			x2, y2 - координаты нижнего правого угла на текстуре [0..1]

Инициализация анимаций:
.initAnimations(array)
	array - это массив таких массивов:
		[function, id]
			function - функция, которая должна проверять, подходит ли этот блок под анимацию
			id - затычка для анимации (не знаю как это назвать, спрашивайте Надима, если вдруг это нужно, но всё равно
				никто это читать не будет и не знаю зачем я это всё пишу)


	ОТРИСОВКА:
Отрисовка чанка в буфер кадров (создание/обновление):
.drawChunk(x, y, blocksOfChunk, lightChunk)
	x, y - координаты чанка
	blocksOfChunk - массив чанков блоков (чанки должны передаваться на 1 больше по высоте!)
	lightChunk - чанк освещения (будет применён на все слои)

Удаление чанка из буфера кадров:
.deleteChunk(x, y)
	x, y - координаты чанка

Отрисовка:
.render(xc, yc, xp, yp, scale, time, deltaTime, lightOfDay, lightOfPlayer, slicePlayer, rotatePlayer, dynamicLight)
	xc, yc - координаты камеры
	xp, yp - координаты игрока
	scale - масштаб экрана
	time - время прошедшее с начала работы игры (или с какого-то определённого момента, главное, что оно не обнуляется
		во время игры
	deltaTime - время прошедшее между отрисовкой предыдущего и текущего кадра в секундах
	lightOfDay - освещение фона [0..1]
	lightOfPlayer - освещение игрового персонажа [0..1]
	slicePlayer - 1 = игрок перед передним слоем, 2 = игрок за передним слоем
	rotatePlayer - если значение положительное, то игровой персонаж повёрнут направо, если отрицательное, то игровой
		персонаж повёрнут налево
	dynamicLight - массив, состоящий из двух элементов, где первый элемент задаёт диаметр динамического освещения,
		а второй параметр задаёт максимальное освещение в центральной точке (в месте, где находится игровой персонаж)


	ПОГОДА:
Плавный запуск дождя:
.startRain()

Плавная остановка дождя:
.stopRain()
Возвращает примерное время в секундах до окончания дождя.


	ОТРИСОВКА ОБЪЕКТОВ (ИНТЕРФЕЙСА):
Создать текстуру:
.createTexture(image, width, height)
	image - изображение (должно быть квадратным)
	width, height - ширина и высота изображения. Изображение будет растянуто под указанную ширину и высоту.
Исходное изображение должно быть квадратным! Вызывать желательно только 1 раз на каждое изображение при инициализации!
Возвращает textureID

Получить размер экрана в пикселях:
.getCanvasSize()
Возвращает массив из двух элементов (ширина и высота экрана)

Отправить объекты на отрисовку:
.drawObjects(texture, array)
	texture - textureID, полученный из .createTexture (используется по умолчанию)
	array - массив, состоящий из объектов вида:
	{'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY], 'ca': [caX, caY], 'cb': [cbX, cbY],
	 'tex': textureID}
		pa - нижний левый угол позиции объекта
		pb - верхний правый угол позиции объекта
		ta - нижний левый угол текстурных координат
		tb - верхний правый угол текстурных координат
		сa - нижний левый угол позиции обрезания объекта (не обязательно)
		сb - верхний правый угол позиции обрезания объекта (не обязательно)
		tex - textureID для использования отрисовки текущего изображения (не обязательно)
Вызывать можно только после .render!

Отправить индикаторы на отрисовку:
.drawProgressBars(texture0, texture1, array)
	texture0 - textureID, полученная из .createTexture для заполненного значения
	texture1 - textureID, полученная из .createTexture для пустого значения
	array - массив, состоящий из объектов вида:
	{'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY]}
		pa - нижний левый угол позиции объекта
		pb - верхний правый угол позиции объекта
		ta - нижний левый угол текстурных координат
		tb - верхний правый угол текстурных координат
		hor - true = горизонтальный индикатор, false = вертикальный индикатор
		status - заполненность индикатора [0..1]
Вызывать можно только после .render!


Полный пример (на данный момент не актуален и не работает):

const image = new Image();
image.src = 'Images/image.png';
image.onload = () => {
	const background = new Image();
	background.src = 'Images/background.png';
	background.onload = () => {
		const playerImage = new Image();
		playerImage.src = 'Images/player.png';
		playerImage.onload = () => {
			const r = new Render(image, background, playerImage);
			
			r.settings(32, 4, 3);
			
			r.createObjects(
				[{'id':1, 'a':[32.5/128, 32.5/128], 'b':[63.5/128, 63.5/128]},
				{'id':3, 'a':[0.5/128, 0.5/128], 'b':[31.5/128, 31.5/128]}]);
			
			const arrayOfChunk = [{
				'chunk':
					[[1,1,1,1],
					[1,1,3,3],
					[1,1,1,1]],
				'slice': 1,
				'x': 0,
				'y': 0
				}];
			let e = -20;
			let oldtime = 0;
			const update = (newtime) => {
				newtime *= 0.005;
				const deltaTime = newtime - oldtime;
				oldtime = newtime;
				r.render(e += deltaTime, 0, e, 0, 1, 1, arrayOfChunk);
				requestAnimationFrame(update);
			}
			requestAnimationFrame(update);
		};
	};
};

Чего-то непонятно?
Обращаться к Надиму

***********************************************************************************************************************/


class Engine {
	constructor() {
		const canvas = document.getElementById('canvas'); // получаем канвас
		this.gl = canvas.getContext('webgl', {
				premultipliedAlpha: false,
				alpha: false
			}); // получаем доступ к webgl
		if (!this.gl) {
			this.gl = canvas.getContext('experimental-webgl', {
					premultipliedAlpha: false,
					alpha: false
				}); // иначе получаем доступ к experimental-webgl
			if (!this.gl) {
				canvas.parentNode.removeChild(canvas);
				document.getElementById("loading").innerHTML =
					`ERROR #1!<br>
					Please create an issue for<br>
					<a href="https://github.com/bmstu-iu9/utp2019-2-2d-game/issues">
						github.com/bmstu-iu9/utp2019-2-2d-game</a><br>with this information:<br>
					<h6>1: ${navigator.userAgent}<br>`;
				throw new Error('Browser is very old');
			}
		}
		
		// заливаем экран цветом 
		this.resizeCanvas();
		this.gl.clearColor(0.53, 0.81, 0.98, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		
		this.gl.flush(); // очистка данных
		
		// прозрачность
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		//this.gl.enable(this.gl.DEPTH_TEST);
		
		// сборка и компиляция шейдерной программы
		this.program = [];
		this.uniform = [];
		this.attribute = [];
		
		// SHADER PROGRAM 0
		const vertexShader0 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[0]);
		const fragmentShader0 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[0]);
		this.program[0] = this.createProgram(vertexShader0, fragmentShader0);
		this.setProgram(0);
		
		this.attribute[0] = this.createAttributeLocation(this.program[0], [
				'a_position',
				'a_texCoord'
			]); // получение атрибутов из шейдеров
		
		this.uniform[0] = this.createUniformLocation(this.program[0], [
				'u_projectionMatrix',
				'u_translate',
				'u_resolution',
				'u_light'
			]); // получение uniform-переменных из шейдеров
		
		// SHADER PROGRAM 1
		const vertexShader1 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[1]);
		const fragmentShader1 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[1]);
		this.program[1] = this.createProgram(vertexShader1, fragmentShader1);
		this.setProgram(1);
		
		this.attribute[1] = this.createAttributeLocation(this.program[1], [
				'a_position',
				'a_texCoord'
			]); // получение атрибутов из шейдеров
		
		this.uniform[1] = this.createUniformLocation(this.program[1], [
				'u_projectionMatrix',
				'u_translate',
				'u_resolution',
				'u_light',
				'u_sizeBlock',
				'u_center',
				'u_radius',
				'u_devicePixelRatio'
			]); // получение uniform-переменных из шейдеров
		
		// привязка текстур к текстурным блокам
		const texture0UniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_texture0');
		const texture1UniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_texture1');
		const texture2UniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_texture2');
		this.gl.uniform1i(texture0UniformLocation1, 0);
		this.gl.uniform1i(texture1UniformLocation1, 1);
		this.gl.uniform1i(texture2UniformLocation1, 2);
		
		// SHADER PROGRAM 2
		const vertexShader2 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[2]);
		const fragmentShader2 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[2]);
		this.program[2] = this.createProgram(vertexShader2, fragmentShader2);
		this.setProgram(2);
		
		this.attribute[2] = this.createAttributeLocation(this.program[2], [
				'a_position',
				'a_texCoord'
			]); // получение атрибутов из шейдеров
		
		this.uniform[2] = this.createUniformLocation(this.program[2], [
				'u_projectionMatrix',
				'u_translate',
				'u_resolution',
				'u_light',
				'u_sizeBlock',
				'u_dynamicLight'
			]); // получение uniform-переменных из шейдеров
		
		// привязка текстур к текстурным блокам
		const texture0UniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_texture0');
		const texture1UniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_texture1');
		this.gl.uniform1i(texture0UniformLocation2, 0);
		this.gl.uniform1i(texture1UniformLocation2, 1);
		
		// SHADER PROGRAM 3
		const vertexShader3 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[3]);
		const fragmentShader3 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[3]);
		this.program[3] = this.createProgram(vertexShader3, fragmentShader3);
		this.setProgram(3);
		
		this.attribute[3] = this.createAttributeLocation(this.program[3], [
				'a_position',
				'a_texCoord'
			]); // получение атрибутов из шейдеров
		
		this.uniform[3] = this.createUniformLocation(this.program[3], [
				'u_rotation',
				'u_texture'
			]); // получение uniform-переменных из шейдеров
		
		// инициализация uniform-переменных
		this.setUniform2fv(this.uniform[3].u_rotation, [0.0, 1.0]);
		
		// SHADER PROGRAM 4
		const vertexShader4 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[4]);
		const fragmentShader4 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[4]);
		this.program[4] = this.createProgram(vertexShader4, fragmentShader4);
		this.setProgram(4);
		
		this.uniform[4] = this.createUniformLocation(this.program[4], [
				'u_progress',
				'u_texture0',
				'u_texture1'
			]);
		
		// SHADER PROGRAM 5
		const vertexShader5 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[5]);
		const fragmentShader5 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[5]);
		this.program[5] = this.createProgram(vertexShader5, fragmentShader5);
		this.setProgram(5);
		
		this.attribute[5] = this.createAttributeLocation(this.program[5], [
				'a_id'
			]); // получение атрибутов из шейдеров
		
		this.uniform[5] = this.createUniformLocation(this.program[5], [
				'u_translate',
				'u_resolution',
				'u_number',
				'u_time',
				'u_pos',
				'u_devicePixelRatio',
				'u_move'
			]); // получение uniform-переменных из шейдеров
		
		// SHADER PROGRAM 6
		const vertexShader6 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[6]);
		const fragmentShader6 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[6]);
		this.program[6] = this.createProgram(vertexShader6, fragmentShader6);
		this.setProgram(6);
		
		this.attribute[6] = this.createAttributeLocation(this.program[6], [
				'a_position',
				'a_texCoord'
			]); // получение атрибутов из шейдеров
		
		this.uniform[6] = this.createUniformLocation(this.program[6], [
				'u_projectionMatrix',
				'u_translate',
				'u_resolution',
				'u_sizeBlock',
				'u_time',
				'u_sizeTexture'
			]); // получение uniform-переменных из шейдеров
		
		// привязка текстур к текстурным блокам
		const texture0UniformLocation6 = this.gl.getUniformLocation(this.program[6], 'u_texture0');
		const texture1UniformLocation6 = this.gl.getUniformLocation(this.program[6], 'u_texture1');
		const texture2UniformLocation6 = this.gl.getUniformLocation(this.program[6], 'u_texture2');
		const texture3UniformLocation6 = this.gl.getUniformLocation(this.program[6], 'u_texture3');
		this.gl.uniform1i(texture0UniformLocation6, 0);
		this.gl.uniform1i(texture1UniformLocation6, 1);
		this.gl.uniform1i(texture2UniformLocation6, 2);
		this.gl.uniform1i(texture3UniformLocation6, 3);
		
		// используем шейдерную программу
		this.setProgram(0);
		
		// буфер чанков
		this.arrayOfChunks = {};
		this.frameBufferTextures = {};
		this.unusedArrayOfChunks = [];
		this.frameBuffer = this.gl.createFramebuffer();
		
		// указываем как упаковывать данные (кратность обработки)
		const alignment = 2;
		this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, alignment);
		
		// отрисовка объектов (интерфейс)
		this.textureID = 8;
		this.buffer0 = this.gl.createBuffer();
		this.buffer1 = this.gl.createBuffer();
		
		this.positionBufferPlayerHand = this.gl.createBuffer();
		this.texCoordBufferPlayerHand = this.gl.createBuffer();
		
		// погода
		this.rain = false;
		this.speedRain = 5;
		this.weather = [];
		this.weather[0] = this.gl.createBuffer();
		this.weather[1] = 0;
		this.weather[2] = 0;
		this.weather[3] = 0;
		this.weather[4] = 0; // статус молнии
		this.lightChance = 0;
	}
	
	init(images, animations) {
		// создание текстуры
		this.textures = [];
		for (let i in images) {
			if (images[i].width !== images[i].height) {
				throw new Error('Width image != height image');
			}
			
			const texture = this.gl.createTexture();
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			
			// задание параметров текстуры
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			
			// генерируем текстуру из изображения
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, images[i]);
			
			// генерируем уменьшенные копии
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
			
			this.textures.push(texture);
		}
		
		this.texturesSize = [];
		
		for (let i in animations) {
			if (animations[i].width !== animations[i].height) {
				throw new Error('Width image != height image');
			}
			
			const texture = this.gl.createTexture();
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			
			// задание параметров текстуры
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			
			// генерируем текстуру из изображения
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, animations[i]);
			
			// генерируем уменьшенные копии
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
			
			this.textures.push(texture);
			this.texturesSize.push(animations[i].width);
		}
	}
	
	settings(size, widthChunk, heightChunk, lightOfChunks) {
		this.size = size;
		this.widthChunk = widthChunk;
		this.heightChunk = heightChunk;
		this.lightOfChunks = lightOfChunks;
	}
	
	getFieldSize() {
		return [this.gl.canvas.width / this.size, this.gl.canvas.height / this.size];
	}

	createObjects(arrayOfObjects) {
		this.arrayOfObjects = {};
		
		const backgroundAsp = 512 / 512; // размер фона
		
		/*
		ID:
		0 - фон
		1 - игрок
		2 - отзеркаленный игрок
		3 - буфер кадров
		*/
		
		const l = 0, h = this.size;
		
		// заполняем буферы
		const arrayOfPosition = [
			// ID: 0
			0, 0,
			backgroundAsp, 0,
			0, 1,
			0, 1,
			backgroundAsp, 0,
			backgroundAsp, 1,
			
			// ID: 1
			h * -0.75,	l,
			h * 1.75,	l,
			h * -0.75,	h * 3,
			h * -0.75,	h * 3,
			h * 1.75,	l,
			h * 1.75,	h * 3,
			
			// ID: 2
			h * -1.75, l,
			h * 0.75, l,
			h * -1.75, h * 3,
			h * -1.75, h * 3,
			h * 0.75, l,
			h * 0.75, h * 3,
			
			// ID: 3
			l - 0.25, l - 0.25,
			h * this.widthChunk + 0.25, l - 0.25,
			l - 0.25, h * this.heightChunk + 0.25,
			l - 0.25, h * this.heightChunk + 0.25,
			h * this.widthChunk + 0.25, l - 0.25,
			h * this.widthChunk + 0.25, h * this.heightChunk + 0.25];
		
		const ptw = 80 / 128; // ширина буфера текстуры игрового персонажа
		const pth = 96 / 128; // высота буфера текстуры игрового персонажа
		
		const arrayOfTexCoord = [
			// ID: 0
			0, 1,
			1, 1,
			0, 0,
			0, 0,
			1, 1,
			1, 0,
			
			// ID: 1
			0, 0,
			ptw, 0,
			0, pth,
			0, pth,
			ptw, 0,
			ptw, pth,
			
			// ID: 2
			ptw, 0,
			0, 0,
			ptw, pth,
			ptw, pth,
			0, 0,
			0, 96 / 128,
			
			// ID: 3
			0, 0,
			1, 0,
			0, 1,
			0, 1,
			1, 0,
			1, 1];
		
		for (let i in arrayOfObjects) {
			this.arrayOfObjects[arrayOfObjects[i].id] = arrayOfObjects[i];
		}
		
		this.setProgram(0);
		
		// создание буфера и атрибута координат позиций
		this.positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(this.attribute[0].a_position);
		this.gl.vertexAttribPointer(this.attribute[0].a_position, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание буфера и атрибута текстурных координат
		this.texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(this.attribute[0].a_texCoord);
		this.gl.vertexAttribPointer(this.attribute[0].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
	}
	
	createAnimations(playerResolutionX, playerResolutionY, playerAnims) {
		this.playerResolution = [playerResolutionX, playerResolutionY];
		const arrayOfPosition = [];
		const arrayOfTexCoord = [];
		
		// используем шейдерную программу
		this.setProgram(3);
		
		this.playerAsp = playerResolutionY / (playerResolutionX + this.size) / 2;
			
		// заполняем буферы
		for (let i in playerAnims) {
			const head = playerAnims[i].head;
			const body = playerAnims[i].body;
			const legs = playerAnims[i].legs;
			
			arrayOfPosition.push(
				// голова
				0, body[2] / playerResolutionY,
				this.playerAsp, body[2] / playerResolutionY,
				0, head[2] / playerResolutionY,
				0, head[2] / playerResolutionY,
				this.playerAsp, body[2] / playerResolutionY,
				this.playerAsp, head[2] / playerResolutionY,
				
				// тело
				0, legs[2] / playerResolutionY,
				this.playerAsp, legs[2] / playerResolutionY,
				0, body[2] / playerResolutionY,
				0, body[2] / playerResolutionY,
				this.playerAsp, legs[2] / playerResolutionY,
				this.playerAsp, body[2] / playerResolutionY,
				
				// ноги
				0, 0,
				this.playerAsp, 0,
				0, legs[2] / playerResolutionY,
				0, legs[2] / playerResolutionY,
				this.playerAsp, 0,
				this.playerAsp, legs[2] / playerResolutionY);
			
			arrayOfTexCoord.push(
				// голова
				head[0][0], head[1][1],
				head[1][0], head[1][1],
				head[0][0], head[0][1],
				head[0][0], head[0][1],
				head[1][0], head[1][1],
				head[1][0], head[0][1],
				
				// тело
				body[0][0], body[1][1],
				body[1][0], body[1][1],
				body[0][0], body[0][1],
				body[0][0], body[0][1],
				body[1][0], body[1][1],
				body[1][0], body[0][1],
				
				// ноги
				legs[0][0], legs[1][1],
				legs[1][0], legs[1][1],
				legs[0][0], legs[0][1],
				legs[0][0], legs[0][1],
				legs[1][0], legs[1][1],
				legs[1][0], legs[0][1]);
		}
		
		// создание буфера и атрибута координат позиций
		this.positionBufferPlayer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBufferPlayer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(this.attribute[3].a_position);
		this.gl.vertexAttribPointer(this.attribute[3].a_position, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание буфера и атрибута текстурных координат
		this.texCoordBufferPlayer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBufferPlayer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(this.attribute[3].a_texCoord);
		this.gl.vertexAttribPointer(this.attribute[3].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание текстурного буфера отрисовки
		this.texturePlayer = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturePlayer);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 128, 128, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
	}
	
	initAnimations(array) {
		this.animation = [];
		for (let i in array) {
			this.animation[i * 2] = array[i][0];
			this.animation[i * 2 + 1] = array[i][1];
		}
		
		this.setProgram(6);
		
		const img0 = this.widthChunk * this.size / this.texturesSize[0];
		const img1 = this.widthChunk * this.size / this.texturesSize[1];
		this.gl.uniform2f(this.uniform[6].u_sizeTexture[0], img0, img1);
		
		delete this.texturesSize;
	}
	
	getPlayerParts(head, body, legs, item) {
		// используем шейдерную программу
		this.setProgram(3);
		
		const textureSize = [this.playerResolution[0] / this.playerAsp, this.playerResolution[1]];
		
		// отрисовываем в буфер кадров
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
			this.texturePlayer, 0);
		this.gl.viewport(0, 0, textureSize[0], textureSize[1]);
		this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		
		if (item !== undefined) {
			// отрисовка предмета в руке
			const angleInRad = this.degToRad(item.angle);
			const rotation = [Math.sin(angleInRad), Math.cos(angleInRad)];
			this.setUniform2fv(this.uniform[3].u_rotation, rotation);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[3]);
			
			const posX = item.pos[0] / textureSize[0];
			const posY = item.pos[1] / textureSize[1];
			const width = this.size / textureSize[0];
			const height = this.size / textureSize[1];
			
			// координаты предмета в руке
			const arrayOfPosition = [
				posX, posY,
				posX + width, posY,
				posX, posY + height,
				posX, posY + height,
				posX + width, posY,
				posX + width, posY + height];
			
			// создаём буфер координат в руке
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBufferPlayerHand);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
			this.gl.enableVertexAttribArray(this.attribute[3].a_position);
			this.gl.vertexAttribPointer(this.attribute[3].a_position, 2, this.gl.FLOAT, false, 0, 0);
			
			// текстурные координаты предмета в руке
			const arrayOfTexCoord = [
				item.a[0], item.b[1],
				item.b[0], item.b[1],
				item.a[0], item.a[1],
				item.a[0], item.a[1],
				item.b[0], item.b[1],
				item.b[0], item.a[1]];
			
			// создаём буфер текстурных координат в руке
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBufferPlayerHand);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
			this.gl.enableVertexAttribArray(this.attribute[3].a_texCoord);
			this.gl.vertexAttribPointer(this.attribute[3].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
			
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
			this.setUniform2fv(this.uniform[3].u_rotation, [0.0, 1.0]);
		}
		
		// задаём буферы
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBufferPlayer);
		this.gl.vertexAttribPointer(this.attribute[3].a_position, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBufferPlayer);
		this.gl.vertexAttribPointer(this.attribute[3].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
		
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]); // используем текстуру игрока
		this.gl.drawArrays(this.gl.TRIANGLES, head * 18, 6);
		this.gl.drawArrays(this.gl.TRIANGLES, body * 18 + 6, 6);
		this.gl.drawArrays(this.gl.TRIANGLES, legs * 18 + 12, 6);
	}
	
	drawChunk(x, y, blocksOfChunk, lightChunk) {
		const width = this.widthChunk * this.size;
		const height = this.heightChunk * this.size;
		const c = `${x}x${y}`;
		const count = blocksOfChunk.length;
		
		// буфер кадров
		if (this.arrayOfChunks[c] === undefined) {
			if (this.unusedArrayOfChunks.length === 0) {
				// при отсутствии буфера кадров создадим его
				const texture = [], blockBuffer = [], texBuffer = [];
				const exist = [];
				for (let i = 0; i < count + 1; i++) {
					texture[i] = this.gl.createTexture();
					this.gl.bindTexture(this.gl.TEXTURE_2D, texture[i]);
					this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA,
						this.gl.UNSIGNED_BYTE, null);
					
					// настройки изображения, хранимого в буфере кадров
					this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
					this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
					this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
					this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
					
					blockBuffer[i] = this.gl.createBuffer();
					texBuffer[i] = this.gl.createBuffer();
					
					exist[i] = false;
				}
				
				const light = this.gl.createTexture();
				this.gl.bindTexture(this.gl.TEXTURE_2D, light);
				
				// настройки мягкого освещения
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
				
				const level = 0;
				this.gl.texImage2D(this.gl.TEXTURE_2D, level, this.gl.LUMINANCE, this.widthChunk * 2,
					this.heightChunk * 2, 0, this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE,
					new Uint8Array(this.widthChunk * this.heightChunk * 4));
				
				this.arrayOfChunks[c] = {
					x: x,
					y: y,
					exist: exist,
					tex: texture,
					light: light,
					blockBuffer: blockBuffer,
					texBuffer: texBuffer,
				}
			} else {
				// если буфер кадров создан, но неиспользуется, то используем его
				this.arrayOfChunks[c] = this.unusedArrayOfChunks.pop();
				this.arrayOfChunks[c].x = x;
				this.arrayOfChunks[c].y = y;
			}
		}
		
		// заполняем буфер света освещением
		const length = lightChunk.length;
		const array = new Uint8Array(length);
		for (let i = 0; i < length; i++) {
			array[i] = lightChunk[i] * 255;
		}
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
		this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, this.widthChunk + 2, this.heightChunk + 2, this.gl.LUMINANCE,
			this.gl.UNSIGNED_BYTE, array);
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
		
		this.gl.viewport(0, 0, width, height);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
		
		this.setProgram(3);
		
		const w = 1 / this.widthChunk;
		const h = 1 / this.heightChunk;
		
		const animateArrayOfBuffer = [];
		const animateTextureOfBuffer = [];
		let lv = 0;
		
		// отрисовка слоёв
		for (let i = 0; i < count; i++) {
			const arrayOfBuffer = [];
			const textureOfBuffer = [];
			
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
				this.arrayOfChunks[c].tex[i], 0);
			this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			
			let v = 0;
			
			for (let xb = 0; xb < this.widthChunk; xb++) {
				const xh = xb * w;
				for (let yb = 0; yb < this.heightChunk; yb++) {
					const yh = yb * h;
					let id = blocksOfChunk[i][yb][xb];
					let aoo = this.arrayOfObjects[id];
					if (aoo != undefined) {
						if (this.animation[0](id)) {
							if (this.animation[0](blocksOfChunk[i][yb + 1][xb])) {
								aoo = this.arrayOfObjects[this.animation[1]];
							}
							
							animateArrayOfBuffer.push(
								xh, yh,
								xh + w, yh,
								xh, yh + h,
								xh, yh + h,
								xh + w, yh,
								xh + w, yh + h);
							
							const a0 = aoo.a[0], a1 = aoo.a[1], b0 = aoo.b[0], b1 = aoo.b[1];
							animateTextureOfBuffer.push(
								a0, b1,
								b0, b1,
								a0, a1,
								a0, a1,
								b0, b1,
								b0, a1);
							lv += 6;
						} else if (this.animation[2](id)) {
							if (this.animation[2](blocksOfChunk[i][yb + 1][xb])) {
								aoo = this.arrayOfObjects[this.animation[3]];
							}
							
							animateArrayOfBuffer.push(
								xh, yh,
								xh + w, yh,
								xh, yh + h,
								xh, yh + h,
								xh + w, yh,
								xh + w, yh + h);
							
							const a0 = aoo.a[0], a1 = aoo.a[1], b0 = aoo.b[0], b1 = aoo.b[1];
							animateTextureOfBuffer.push(
								a0, b1,
								b0, b1,
								a0, a1,
								a0, a1,
								b0, b1,
								b0, a1);
							lv += 6;
						} else {
							arrayOfBuffer.push(
								xh, yh,
								xh + w, yh,
								xh, yh + h,
								xh, yh + h,
								xh + w, yh,
								xh + w, yh + h);
							
							const a0 = aoo.a[0], a1 = aoo.a[1], b0 = aoo.b[0], b1 = aoo.b[1];
							textureOfBuffer.push(
								a0, b1,
								b0, b1,
								a0, a1,
								a0, a1,
								b0, b1,
								b0, a1);
							v += 6;
						}
					}
				}
			}
			
			if (v > 0) {
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.arrayOfChunks[c].blockBuffer[i]);
				this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfBuffer), this.gl.DYNAMIC_DRAW);
				this.gl.vertexAttribPointer(this.attribute[3].a_position, 2, this.gl.FLOAT, false, 0, 0);
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.arrayOfChunks[c].texBuffer[i]);
				this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureOfBuffer), this.gl.DYNAMIC_DRAW);
				this.gl.vertexAttribPointer(this.attribute[3].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
				this.gl.drawArrays(this.gl.TRIANGLES, 0, v);
				this.arrayOfChunks[c].exist[i] = true;
			} else {
				this.arrayOfChunks[c].exist[i] = false;
			}
		}
		
		// отрисовка анимаций
		if (lv > 0) {
			// привязываем буфер кадров и очищаем его
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
				this.arrayOfChunks[c].tex[count], 0);
			this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			
			// задаём буферы отрисовки
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.arrayOfChunks[c].blockBuffer[count]);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(animateArrayOfBuffer), this.gl.DYNAMIC_DRAW);
			this.gl.vertexAttribPointer(this.attribute[3].a_position, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.arrayOfChunks[c].texBuffer[count]);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(animateTextureOfBuffer), this.gl.DYNAMIC_DRAW);
			this.gl.vertexAttribPointer(this.attribute[3].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
			
			// отрисовываем
			this.gl.drawArrays(this.gl.TRIANGLES, 0, lv);
			this.arrayOfChunks[c].exist[count] = true;
		} else {
			this.arrayOfChunks[c].exist[count] = false;
		}
		
		for (let i = 0; i < count; i++) {
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[i]);
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_LINEAR);
		}
		
	}
	
	deleteChunk(x, y) {
		// удаление чанка
		const c = `${x}x${y}`;
		
		// на всякий случай проверяем существование чанка
		if (this.arrayOfChunks[c] !== undefined) {
			// если чанк существует, то добавляем его в массив неиспользуемых
			this.unusedArrayOfChunks.push(this.arrayOfChunks[c]);
			delete this.arrayOfChunks[c];
		}
	}
	
	isExistChunk(x, y) {
		return this.arrayOfChunks[`${x}x${y}`] !== undefined;
	}
	
	render(xc, yc, xp, yp, scale, time, deltaTime, lightOfDay, lightOfPlayer, slicePlayer, rotatePlayer, dynamicLight) {
		this.resizeCanvas(); // подгоняем канвас под экран
		
		// используем шейдерную программу
		this.setProgram(0);
		
		// задаём буферы отрисовки
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.vertexAttribPointer(this.attribute[0].a_position, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.vertexAttribPointer(this.attribute[0].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
		
		// "вырезаем" кусок экрана для отображения
		// TODO: избавиться, т.к. это нерационально
		const ch = this.size / this.gl.canvas.height;
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = scale * asp;
		const left = xc * ch - width / 2;
		const right = xc * ch + width / 2;
		const bottom = yc * ch - scale / 2;
		const top = yc * ch + scale / 2;
		const near = 0.01;
		const far = 11;
		const projectionMatrix = [
			2.0 / (right - left), 0.0, 0.0, 0.0,
			0.0, 2.0 / (top - bottom), 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0];
		this.setUniformMatrix4fv(this.uniform[0].u_projectionMatrix, false, projectionMatrix);
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0.53, 0.81, 0.98, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT/* | this.gl.DEPTH_BUFFER_BIT*/);
		
		// отрисовка фона
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[1]);
		this.setUniform1f(this.uniform[0].u_resolution, 1 / scale);
		this.gl.uniform1f(this.uniform[0].u_light[0], lightOfDay);
		
		for (let i = 0; i <= asp * scale + 1; i++) {
			this.gl.uniform2f(this.uniform[0].u_translate[0],
				xc * ch + i * scale - asp * scale * 0.5, yc * ch - scale * 0.5);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
		}
		
		// TODO: Привести код в порядок
		// отрисовка чанков
		this.setUniform1f(this.uniform[0].u_resolution, this.gl.canvas.height);
		this.gl.uniform1f(this.uniform[0].u_light[0], 1); // стандартное освещение
		//this.gl.disable(this.gl.DEPTH_TEST);
		
		this.setProgram(2);
		const deltaX = (xp - xc) * this.size / scale + this.gl.canvas.width / 2;
		const deltaY = (yp - yc + 1.5) * this.size / scale + this.gl.canvas.height / 2;
		
		this.gl.uniform4fv(this.uniform[2].u_dynamicLight[0],
			[deltaX, deltaY, dynamicLight[0] * this.size / scale, dynamicLight[1]]);
		this.setUniform1f(this.uniform[2].u_sizeBlock, this.size);
		this.setUniformMatrix4fv(this.uniform[2].u_projectionMatrix, false, projectionMatrix);
		this.setUniform1f(this.uniform[2].u_resolution, this.gl.canvas.height);
		
		// яркость 2 слоя
		let ls;
		if (slicePlayer === 1) {
			ls = 0.63; // если игрок на 1 слое
		} else {
			ls = 0.75; // если игрок на 2 слое
		}
		
		// отрисовка 2 и 3 слоя
		for (let c in this.arrayOfChunks) {
			const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
			const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
			this.gl.activeTexture(this.gl.TEXTURE1);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.uniform2fv(this.uniform[2].u_translate[0], [xc, yc]);
			if (this.arrayOfChunks[c].exist[2]) {
				this.gl.uniform1f(this.uniform[2].u_light[0], ls / 2);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[2]);
				this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
			}
			if (this.arrayOfChunks[c].exist[1]) {
				this.gl.uniform1f(this.uniform[2].u_light[0], ls);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[1]);
				this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
			}
		}
		
		if (slicePlayer === 2) {
			this.setProgram(0);
			
			// отрисовка игрока
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturePlayer);
			this.gl.uniform1f(this.uniform[0].u_light[0], Math.max(lightOfPlayer, dynamicLight[1]));
			this.gl.uniform2fv(this.uniform[0].u_translate[0], [xp * ch, yp * ch]);
			if (rotatePlayer > 0) {
				// игровой персонаж повёрнут направо
				this.gl.drawArrays(this.gl.TRIANGLES, 6, 6);
			} else {
				// игровой персонаж повёрнут налево
				this.gl.drawArrays(this.gl.TRIANGLES, 12, 6);
			}
			
			this.setProgram(1);
			this.gl.uniform2fv(this.uniform[1].u_center[0], [deltaX, deltaY]);
			this.setUniform1f(this.uniform[1].u_light, 1);
			this.setUniform1f(this.uniform[1].u_sizeBlock, this.size);
			this.setUniformMatrix4fv(this.uniform[1].u_projectionMatrix, false, projectionMatrix);
			this.setUniform1f(this.uniform[1].u_resolution, this.gl.canvas.height);
			this.setUniform1f(this.uniform[1].u_radius, 250.0 * scale);
			this.setUniform1f(this.uniform[1].u_devicePixelRatio, window.devicePixelRatio);
			
			// отрисовка 1 слоя с полупрозрачным кругом
			for (let c in this.arrayOfChunks) {
				if (this.arrayOfChunks[c].exist[0]) {
					const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
					const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
					this.gl.activeTexture(this.gl.TEXTURE1);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
					this.gl.activeTexture(this.gl.TEXTURE2);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[1]);
					this.gl.activeTexture(this.gl.TEXTURE0);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[0]);
					this.gl.uniform2f(this.uniform[1].u_translate[0], xc, yc);
					this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
				}
			}
		} else {
			this.setProgram(2);
			
			this.gl.uniform1f(this.uniform[2].u_light[0], 1);
			
			// отрисовка 1 слоя без полупрозрачного круга
			for (let c in this.arrayOfChunks) {
				if (this.arrayOfChunks[c].exist[0]) {
					const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
					const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
					this.gl.activeTexture(this.gl.TEXTURE1);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
					this.gl.activeTexture(this.gl.TEXTURE0);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[0]);
					this.gl.uniform2f(this.uniform[2].u_translate[0], xc, yc);
					this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
				}
			}
		}
		
		if (slicePlayer === 1) {
			this.setProgram(0);
			
			// отрисовка игрока
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturePlayer);
			this.gl.uniform1f(this.uniform[0].u_light[0], Math.max(lightOfPlayer, dynamicLight[1]));
			this.gl.uniform2fv(this.uniform[0].u_translate[0], [xp * ch, yp * ch]);
			if (rotatePlayer > 0) {
				this.gl.drawArrays(this.gl.TRIANGLES, 6, 6);
			} else {
				this.gl.drawArrays(this.gl.TRIANGLES, 12, 6);
			}
		}
		
		// анимации
		this.setProgram(6);
			
		this.setUniform1f(this.uniform[6].u_sizeBlock, this.size);
		this.setUniformMatrix4fv(this.uniform[6].u_projectionMatrix, false, projectionMatrix);
		this.setUniform1f(this.uniform[6].u_resolution, this.gl.canvas.height);
		this.gl.uniform1f(this.uniform[6].u_time[0], Math.pow(Math.sin(time / 8000), 2) * 5);
			
		// отрисовка анимаций 1 слоя без полупрозрачного круга
		for (let c in this.arrayOfChunks) {
			if (this.arrayOfChunks[c].exist[3]) {
				const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
				const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
				this.gl.activeTexture(this.gl.TEXTURE3);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[5]);
				this.gl.activeTexture(this.gl.TEXTURE2);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[4]);
				this.gl.activeTexture(this.gl.TEXTURE1);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
				this.gl.activeTexture(this.gl.TEXTURE0);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[3]);
				this.gl.uniform2f(this.uniform[6].u_translate[0], xc, yc);
				this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
			}
		}
		
		this.gl.flush(); // очистка данных (?)
		
		// погода
		if (this.weather[3] > 0) {
			if (this.weather[4] > 0 && (this.weather[4] <= 0.1 || this.weather[4] > 0.2)) {
				// вспышка молнии
				this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
				this.gl.clear(this.gl.COLOR_BUFFER_BIT);
				if (this.weather[4] > 0.3) {
					this.weather[4] = 0;
				} else {
					this.weather[4] += deltaTime;
				}
			} else {
				if (this.weather[4] > 0) {
					this.weather[4] += deltaTime;
				} else if (yp + 1 >= this.elevationMap[Math.floor(xp)]) {
					if (Math.random() < this.lightChance) {
						this.weather[4] = deltaTime;
					}
				}
				
				// дождь
				this.setProgram(5);
				
				const xh = Math.round(this.gl.canvas.width * scale / this.size * 0.5 + 1);
				const maxnum = Math.ceil(this.size * this.gl.canvas.height * window.devicePixelRatio * 0.001);
				const raw = this.weather[3] * this.gl.canvas.height * window.devicePixelRatio * 0.001;
				const num = Math.ceil(raw);
				const max = maxnum * xh * 2;
				const xt = -(xc % 1);
				
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.weather[0]);
				this.gl.vertexAttribPointer(this.attribute[5].a_id, 1, this.gl.FLOAT, false, 0, 0);
				
				// если количество капелек не хватает (из-за увеличения размера экрана), то пересоздаём буфер с ними
				if (maxnum > this.weather[1]) {
					const wIDs = new Float32Array(maxnum);
					for (let i = 0; i < maxnum; i++) {
						wIDs[i] = i + 1;
					}
					this.gl.bufferData(this.gl.ARRAY_BUFFER, wIDs, this.gl.STATIC_DRAW);
					this.weather[1] = maxnum;
				}
				
				const w = this.size / this.gl.canvas.width / scale;
				const h = this.size / this.gl.canvas.height / scale;
				
				// устанавливаем параметры дождя
				this.setUniform1f(this.uniform[5].u_number, max);
				this.gl.uniform1f(this.uniform[5].u_time[0], time * this.speedRain * 0.0001);
				this.setUniform2fv(this.uniform[5].u_resolution, [w, h]);
				this.setUniform1f(this.uniform[5].u_devicePixelRatio, window.devicePixelRatio);
				this.setUniform1f(this.uniform[5].u_move, yc);
				
				// отрисовка дождя
				const d = num === 1 ? Math.ceil(Math.log(1 / raw) / Math.log(2)) : 1; // средний шаг дождя в блоках
				for (let i = 0; i <= xh; i += d) {
					// левая половина экрана
					const yt0 = (this.elevationMap[Math.floor(xc - i)] + 1 - yc) * this.size;
					this.gl.uniform1f(this.uniform[5].u_pos[0], Math.floor(xc - i));
					this.gl.uniform2fv(this.uniform[5].u_translate[0],
						[(xt - i) * w, Math.max(yt0, this.weather[2] * scale) * h / 16]);
					this.gl.drawArrays(this.gl.POINTS, 0, num);
					
					// правая половина экрана
					const yt1 = (this.elevationMap[Math.floor(xc + i + d)] + 1 - yc) * this.size;
					this.gl.uniform1f(this.uniform[5].u_pos[0], Math.floor(xc + i + d));
					this.gl.uniform2fv(this.uniform[5].u_translate[0],
						[(xt + i + d) * w, Math.max(yt1, this.weather[2] * scale) * h / 16]);
					this.gl.drawArrays(this.gl.POINTS, 0, num);
				}
				
				this.weather[2] -= deltaTime * this.speedRain * 100 / scale;
				if (this.rain) {
					this.weather[3] = Math.min(this.weather[3] + deltaTime * this.speedRain / 6, this.size);
				} else {
					this.weather[3] -= deltaTime * this.speedRain / 6;
				}
			}
		}
	}
	
	startRain() {
		// начинается дождь
		if (this.weather[3] <= 0) {
			this.weather[2] = this.gl.canvas.height / 2;
			this.weather[3] = 1;
		}
		this.rain = true;
	}
	
	stopRain() {
		// заканчивается дождь
		this.rain = false;
		return this.weather[3] / this.speedRain * 6; // примерное время в секундах до окончания дождя
	}
	
	createShader(type, source) {
		// создание шейдера
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			return shader;
		}
		
		// если не удалось создать шейдер, то выводим ошибку
		let error = '\n';
		if (type === this.gl.VERTEX_SHADER) {
			error += 'VERTEX SHADER ERROR:\n';
		} else if (type === this.gl.FRAGMENT_SHADER) {
			error += 'FRAGMENT SHADER ERROR:\n';
		} else {
			error += 'SHADER ERROR:\n';
		}
		error += this.gl.getShaderInfoLog(shader);
		this.gl.deleteShader(shader);
		throw new Error(error);
	}
	
	createProgram(vertexShader, fragmentShader) {
		// создание программы из шейдеров
		const program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			return program;
		}
		
		// если не удалось создать программу, то выводим ошибку
		const error = '\nGLSL PROGRAM CREATE ERROR:\n' + this.gl.getProgramInfoLog(program);
		this.gl.deleteProgram(program);
		throw new Error(error);
	}
	
	createAttributeLocation(program, params) {
		// получение ссылок на атрибуты в шейдерах
		const attributeLocation = {};
		for (let i in params) {
			attributeLocation[params[i]] = this.gl.getAttribLocation(program, params[i]);
		}
		return attributeLocation;
	}
	
	createUniformLocation(program, params) {
		// получение ссылок на uniform-переменные в шейдерах
		const uniformLocation = {};
		for (let i in params) {
			uniformLocation[params[i]] = [this.gl.getUniformLocation(program, params[i])];
		}
		return uniformLocation;
	}
	
	// оптимизированные функции-оболочки присваивания uniform-переменных
	setUniform1f(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform1f(location[0], value);
		}
	}
	
	setUniform2fv(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform2fv(location[0], value);
		}
	}
	
	setUniform3fv(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform3fv(location[0], value);
		}
	}
	
	setUniform4fv(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform4fv(location[0], value);
		}
	}
	
	setUniform1i(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform1i(location[0], value);
		}
	}
	
	setUniform2iv(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform2iv(location[0], value);
		}
	}
	
	setUniform3iv(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform3iv(location[0], value);
		}
	}
	
	setUniform4iv(location, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniform4iv(location[0], value);
		}
	}
	
	setUniformMatrix3fv(location, normalize, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniformMatrix3fv(location[0], normalize, value);
		}
	}
	
	setUniformMatrix4fv(location, normalize, value) {
		if (value !== location[1]) {
			location[1] = value;
			this.gl.uniformMatrix4fv(location[0], normalize, value);
		}
	}
	
	setProgram(n) {
		if (n != this.activeProgram) {
			this.gl.useProgram(this.program[n]);
			this.activeProgram = n;
		}
	}
	
	resizeCanvas(multiplier) {
		// подгоняем канвас под размер экрана
		multiplier = multiplier || 1;
		const width = Math.floor(this.gl.canvas.clientWidth * multiplier/* * window.devicePixelRatio*/);
		const height = Math.floor(this.gl.canvas.clientHeight * multiplier/* * window.devicePixelRatio*/);
		if (this.gl.canvas.width !== width || this.gl.canvas.height !== height) {
			this.gl.canvas.width = width;
			this.gl.canvas.height = height;
		}
	}
	
	radToDeg(r) {
		return r * 180 / Math.PI;
	}
	
	degToRad(d) {
		return d * Math.PI / 180;
	}
	
	// отрисовка объетов
	createTexture(image, width, height) {
		const texture = this.gl.createTexture();
		this.textureID--;
		this.gl.activeTexture(this.gl.TEXTURE0 + this.textureID);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			
		// задание параметров текстуры
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
		this.gl.generateMipmap(this.gl.TEXTURE_2D);
		this.gl.activeTexture(this.gl.TEXTURE0);
		
		return this.textureID;
	}
	
	getCanvasSize() {
		return [this.gl.canvas.width, this.gl.canvas.height];
	}
	
	// array: { 'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY], 'ca': [caX, caY],
	//			'cb': [cbX, cbY], 'tex': textureID }
	drawObjects(texture, array) {
		this.setProgram(3);
		//this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		let arrayOfBuffer = [];
		let textureOfBuffer = [];
		//let v = 0;
		
		let w, h;
		let a, b;
		for (let i in array) {
			if (array[i].ca === undefined || array[i].cb === undefined) {
				w = 1 / this.gl.canvas.width;
				h = 1 / this.gl.canvas.height;
				this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
				a = 0, b = 0;
			} else {
				a = array[i].ca[0], b = array[i].ca[1];
				w = 1 / (array[i].cb[0] - a);
				h = 1 / (array[i].cb[1] - b);
				this.gl.viewport(a, b, array[i].cb[0] - a, array[i].cb[1] - b);
			}
			if (array[i].tex === undefined) {
				this.setUniform1i(this.uniform[3].u_texture, texture);
			} else {
				this.setUniform1i(this.uniform[3].u_texture, array[i].tex);
			}
			
			arrayOfBuffer = [
				(array[i].pa[0] - a) * w, (array[i].pa[1] - b) * h,
				(array[i].pb[0] - a) * w, (array[i].pa[1] - b) * h,
				(array[i].pa[0] - a) * w, (array[i].pb[1] - b) * h,
				(array[i].pa[0] - a) * w, (array[i].pb[1] - b) * h,
				(array[i].pb[0] - a) * w, (array[i].pa[1] - b) * h,
				(array[i].pb[0] - a) * w, (array[i].pb[1] - b) * h];
			
			textureOfBuffer = [
				array[i].ta[0], array[i].tb[1],
				array[i].tb[0], array[i].tb[1],
				array[i].ta[0], array[i].ta[1],
				array[i].ta[0], array[i].ta[1],
				array[i].tb[0], array[i].tb[1],
				array[i].tb[0], array[i].ta[1]];
			//v += 6;
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer0);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfBuffer), this.gl.DYNAMIC_DRAW);
			this.gl.vertexAttribPointer(this.attribute[3].a_position, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer1);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureOfBuffer), this.gl.DYNAMIC_DRAW);
			this.gl.vertexAttribPointer(this.attribute[3].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
		}
		this.setUniform1i(this.uniform[3].u_texture, 0);
	}
	
	// array: { 'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY], 'hor': true/false, 'status': 0..1 }
	drawProgressBars(texture0, texture1, array) {
		this.setProgram(4);
		this.setUniform1i(this.uniform[4].u_texture0, texture0);
		this.setUniform1i(this.uniform[4].u_texture1, texture1);
		
		let arrayOfBuffer = [];
		let textureOfBuffer = [];
		
		const w = 1 / this.gl.canvas.width;
		const h = 1 / this.gl.canvas.height;
		
		// заполняем буфер для отрисовки
		for (let i in array) {
			arrayOfBuffer.push(
				array[i].pa[0] * w, array[i].pa[1] * h,
				array[i].pb[0] * w, array[i].pa[1] * h,
				array[i].pa[0] * w, array[i].pb[1] * h,
				array[i].pa[0] * w, array[i].pb[1] * h,
				array[i].pb[0] * w, array[i].pa[1] * h,
				array[i].pb[0] * w, array[i].pb[1] * h);
			textureOfBuffer.push(
				array[i].ta[0], array[i].tb[1],
				array[i].tb[0], array[i].tb[1],
				array[i].ta[0], array[i].ta[1],
				array[i].ta[0], array[i].ta[1],
				array[i].tb[0], array[i].tb[1],
				array[i].tb[0], array[i].ta[1]);
		}
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer0);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfBuffer), this.gl.DYNAMIC_DRAW);
		this.gl.vertexAttribPointer(this.attribute[4].a_position, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer1);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureOfBuffer), this.gl.DYNAMIC_DRAW);
		this.gl.vertexAttribPointer(this.attribute[4].a_texCoord, 2, this.gl.FLOAT, false, 0, 0);
		
		for (let i in array) {
			if (array[i].hor) {
				const a = (array[i].pb[0] - array[i].pa[0]) * array[i].status;
				this.gl.uniform2fv(this.uniform[4].u_progress[0], [array[i].pa[0] + a, this.gl.canvas.height]);
			} else {
				const b = (array[i].pb[1] - array[i].pa[1]) * array[i].status;
				this.gl.uniform2fv(this.uniform[4].u_progress[0], [this.gl.canvas.width, array[i].pa[1] + b]);
			}
			this.gl.drawArrays(this.gl.TRIANGLES, i * 6, 6);
		}
	}
}

// инициализация графического движка
const render = new Engine();
