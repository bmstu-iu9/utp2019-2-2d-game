'use strict';

// Версия: 3

// Не лезь, оно тебя сожрёт!

/*
Как это использовать?

const r = new Render(image, background, playerImage); // инициализация движка
	image - это объект Image
	background - это изображение с фоном объекта Image
	playerImage - это изображение с игроком объекта Image

Для корректного изображения фона, левая и правая половины фона должны быть абсолютно одинаковыми!!!

Пример использования типа Image:
const image = new Image();
image.src = 'image.png';
image.onload = () => {
	...
}

Изображения должны находится в виде текстурного аталаса, которые будут с помощью текстурных координат частично
использоваться.
Рекомендуется использовать размер степени двойки.

Настройка (должна быть вызвана перед созданием объектов обязательно):
r.settings(size, widthChunk, heightChunk)
	size - размер блоков
	widthChunk - ширина чанков
	heightChunk - высота чанков

Создание объектов:
r.createObjects(arrayOfObjects)
	arrayOfChunk - массив/объект таких ассоциативных массивов:
		{'id': id, 'a': [x1, y1], 'b': [x2, y2]}
			id - id блока
			x1, y1 - координаты левого верхнего угла на текстуре [0..1]
			x2, y2 - координаты нижнего правого угла на текстуре [0..1]

Отрисовка:
r.render(xc, yc, xp, yp, scale, arrayOfObjects)
	xc, yc - координаты камеры
	xp, yp - координаты игрока
	scale - масштаб экрана
	arrayOfObjects - массив/объект чанков, которые представляются в виде ассоциативных массивов:
		{'chunk': chunk', 'slice': slice, 'x': xc, 'y': yc}
			chunk - матрица с id блоков
			slice - слой на котором должен находиться чанк (1..10]
			light - освещённость слоя [0..1]
			xc, yc - координаты чанка

Полный рабочий пример:

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
			
			let arrayOfChunk = [{
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

Отрисовка объектов:
Создать текстуру:
.createTexture(image, width, height)
* image - изображение (должно быть квадратным)
* width, height - ширина и высота изображения. Изображение будет растянуто под указанную ширину и высоту.
Исходное изображение должно быть квадратным! Вызывать желательно только 1 раз на каждое изображение при инициализации!

Получить размер экрана в пикселях:
.getCanvasSize()
* возвращает массив из двух элементов (ширина и высота экрана)

Отправить объекты на отрисовку:
.drawObjects(texture, array)
* texture - текстура, полученная из .createTexture
* array - массив, состоящий из объектов вида:
* {'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY]}
	* pa - нижний левый угол позиции объекта
	* pb - верхний правый угол позиции объекта
	* ta - нижний левый угол текстурных координат
	* tb - ерхний правый угол текстурных координат
Вызывать можно только после .render!

Чего-то непонятно?
Обращаться к Надиму
*/

const _positionAttributeLocation = 0;
const _texCoordAttributeLocation = 1;

class Render {
	constructor() {
		const canvas = document.getElementById('canvas'); // получаем канвас
		this.gl = canvas.getContext('webgl', {
				premultipliedAlpha: false,
				alpha: false
			}) || canvas.getContext('experimental-webgl', {
				premultipliedAlpha: false,
				alpha: false
			}); // получаем доступ к webgl
		if (!this.gl) {
			const ErrorMsg = 'Browser is very old';
			stop();
			alert(ErrorMsg);
			throw new Error(ErrorMsg);
		}
		this.gl.clearColor(0.53, 0.81, 0.98, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		
		this.gl.flush(); // очистка данных
		
		// прозрачность
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		
		// сборка и компиляция шейдерной программы
		this.program = [];
		this.uniform = [];
		
		// SHADER PROGRAM 0
		const vertexShader0 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[0]);
		const fragmentShader0 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[0]);
		const linker0 = [
			{
				'id': _positionAttributeLocation,
				'name': 'a_position'
			},
			{
				'id': _texCoordAttributeLocation,
				'name': 'a_texCoord'
			}];
		this.program[0] = this.createProgram(vertexShader0, fragmentShader0, linker0);
		this.gl.useProgram(this.program[0]);
		
		this.uniform[0] = this.createUniformLocation(this.program[0], [
				'u_projectionMatrix',
				'u_translate',
				'u_resolution',
				'u_light'
			]); // получение uniform-переменных из шейдеров
		
		// SHADER PROGRAM 1
		const vertexShader1 = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[1]);
		const fragmentShader1 = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[1]);
		const linker1 = [
			{
				'id': _positionAttributeLocation,
				'name': 'a_position'
			},
			{
				'id': _texCoordAttributeLocation,
				'name': 'a_texCoord'
			}];
		this.program[1] = this.createProgram(vertexShader1, fragmentShader1, linker1);
		this.gl.useProgram(this.program[1]);
		
		this.uniform[1] = this.createUniformLocation(this.program[1], [
				'u_projectionMatrix',
				'u_translate',
				'u_resolution',
				'u_light',
				'u_sizeBlock',
				'u_center'
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
		const linker2 = [
			{
				'id': _positionAttributeLocation,
				'name': 'a_position'
			},
			{
				'id': _texCoordAttributeLocation,
				'name': 'a_texCoord'
			}];
		this.program[2] = this.createProgram(vertexShader2, fragmentShader2, linker2);
		this.gl.useProgram(this.program[2]);
		
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
		const linker3 = [
			{
				'id': _positionAttributeLocation,
				'name': 'a_position'
			},
			{
				'id': _texCoordAttributeLocation,
				'name': 'a_texCoord'
			}];
		this.program[3] = this.createProgram(vertexShader3, fragmentShader3, linker3);
		this.gl.useProgram(this.program[3]);
		
		// используем шейдерную программу
		this.gl.useProgram(this.program[0]);
		
		// буфер чанков
		this.arrayOfChunks = {};
		this.frameBufferTextures = {};
		this.frameBuffer = this.gl.createFramebuffer();
		
		const near = 0.01;
		const far = 11;
		this.gl.uniformMatrix4fv(this.uniform[0].u_projectionMatrix, false, [
			2.0, 0.0, 0.0, 0.0,
			0.0, 2.0, 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			-1.0, -1.0, (far + near) / (near - far), 1.0]);
	}
	
	init(image, background, playerImage) {
		// создание текстуры
		const images = [image, background, playerImage];
		this.textures = [];
		for (let i = 0; i < 3; i++) {
			const texture = this.gl.createTexture();
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			
			// задание параметров текстуры
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, images[i]);
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
			
			this.textures.push(texture);
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
		this.arrayOfObjects = arrayOfObjects;
		this.IDs = [];
		
		const backgroundAsp = 512 / 512; // размер фона
		
		/*
		ID:
		0 - фон
		1 - задел на успешное будущее
		2 - чёрный блок // TODO: удалить
		3 - игрок // TODO: удалить
		4 - отзеркаленный игрок // TODO: удалить
		5 - буфер кадров // TODO: удалить
		*/
		
		const l = 0, h = this.size;
		
		let arrayOfPosition = [
			0, 0, // ID: 0
			backgroundAsp, 0,
			0, 1,
			0, 1,
			backgroundAsp, 0,
			backgroundAsp, 1,
			
			0, 0, // ID: 1
			1, 0,
			0, 1,
			0, 1,
			1, 0,
			1, 1,
			
			l, l, // ID: 2
			h, l,
			l, h,
			l, h,
			h, l,
			h, h,
			
			h * -0.75, l, // ID: 3
			h * 0.75, l,
			h * -0.75, h * 3,
			h * -0.75, h * 3,
			h * 0.75, l,
			h * 0.75, h * 3,
			
			h * -0.75, l, // ID: 4
			h * 0.75, l,
			h * -0.75, h * 3,
			h * -0.75, h * 3,
			h * 0.75, l,
			h * 0.75, h * 3,
			
			l, l, // ID: 5
			h * this.widthChunk, l,
			l, h * this.heightChunk,
			l, h * this.heightChunk,
			h * this.widthChunk, l,
			h * this.widthChunk, h * this.heightChunk];
		
		let arrayOfTexCoord = [
			0, 1, // ID: 0
			1, 1,
			0, 0,
			0, 0,
			1, 1,
			1, 0, 
			
			0, 1, // ID: 1
			1, 1,
			0, 0,
			0, 0,
			1, 1,
			1, 0,
			
			1, 1, // ID: 2
			1, 1,
			1, 1,
			1, 1,
			1, 1,
			1, 1,
			
			0, 0, // ID: 3
			48 / 128, 0,
			0, 96 / 128,
			0, 96 / 128,
			48 / 128, 0,
			48 / 128, 96 / 128,
			
			48 / 128, 0, // ID: 4
			0, 0,
			48 / 128, 96 / 128,
			48 / 128, 96 / 128,
			0, 0,
			0, 96 / 128,
			
			0, 0, // ID: 5
			1, 0,
			0, 1,
			0, 1,
			1, 0,
			1, 1];
		
		for (let i in arrayOfObjects) {
			this.IDs[arrayOfObjects[i].id] = i;
		}
		
		// создание буфера и атрибута координат позиций
		this.positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(_positionAttributeLocation);
		this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание буфера и атрибута текстурных координат
		this.texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(_texCoordAttributeLocation);
		this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
	}
	
	createAnimations(playerResolutionX, playerResolutionY, playerAnims) {
		this.playerResolution = [playerResolutionX, playerResolutionY];
		let arrayOfPosition = [];
		let arrayOfTexCoord = [];
		
		for (let i in playerAnims) {
			arrayOfPosition.push(
				0, playerAnims[i].body[2] / playerResolutionY,
				1, playerAnims[i].body[2] / playerResolutionY,
				0, playerAnims[i].head[2] / playerResolutionY,
				0, playerAnims[i].head[2] / playerResolutionY,
				1, playerAnims[i].body[2] / playerResolutionY,
				1, playerAnims[i].head[2] / playerResolutionY,
				
				0, playerAnims[i].legs[2] / playerResolutionY,
				1, playerAnims[i].legs[2] / playerResolutionY,
				0, playerAnims[i].body[2] / playerResolutionY,
				0, playerAnims[i].body[2] / playerResolutionY,
				1, playerAnims[i].legs[2] / playerResolutionY,
				1, playerAnims[i].body[2] / playerResolutionY,
				
				0, 0,
				1, 0,
				0, playerAnims[i].legs[2] / playerResolutionY,
				0, playerAnims[i].legs[2] / playerResolutionY,
				1, 0,
				1, playerAnims[i].legs[2] / playerResolutionY);
			
			arrayOfTexCoord.push(
				playerAnims[i].head[0][0], playerAnims[i].head[1][1],
				playerAnims[i].head[1][0], playerAnims[i].head[1][1],
				playerAnims[i].head[0][0], playerAnims[i].head[0][1],
				playerAnims[i].head[0][0], playerAnims[i].head[0][1],
				playerAnims[i].head[1][0], playerAnims[i].head[1][1],
				playerAnims[i].head[1][0], playerAnims[i].head[0][1],
				
				playerAnims[i].body[0][0], playerAnims[i].body[1][1],
				playerAnims[i].body[1][0], playerAnims[i].body[1][1],
				playerAnims[i].body[0][0], playerAnims[i].body[0][1],
				playerAnims[i].body[0][0], playerAnims[i].body[0][1],
				playerAnims[i].body[1][0], playerAnims[i].body[1][1],
				playerAnims[i].body[1][0], playerAnims[i].body[0][1],
				
				playerAnims[i].legs[0][0], playerAnims[i].legs[1][1],
				playerAnims[i].legs[1][0], playerAnims[i].legs[1][1],
				playerAnims[i].legs[0][0], playerAnims[i].legs[0][1],
				playerAnims[i].legs[0][0], playerAnims[i].legs[0][1],
				playerAnims[i].legs[1][0], playerAnims[i].legs[1][1],
				playerAnims[i].legs[1][0], playerAnims[i].legs[0][1]);
		}
		
		// создание буфера и атрибута координат позиций
		this.positionBufferPlayer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBufferPlayer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(_positionAttributeLocation);
		this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание буфера и атрибута текстурных координат
		this.texCoordBufferPlayer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBufferPlayer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(_texCoordAttributeLocation);
		this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		this.texturePlayer = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturePlayer);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 128, 128, 0, this.gl.RGBA,
			this.gl.UNSIGNED_BYTE, null);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
	}
	
	getPlayerParts(head, body, legs) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBufferPlayer);
		this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBufferPlayer);
		this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		this.gl.useProgram(this.program[3]);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
			this.texturePlayer, 0);
		this.gl.viewport(0, 0, this.playerResolution[0], this.playerResolution[1]);
		this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]);
		this.gl.drawArrays(this.gl.TRIANGLES, head * 18, 6);
		this.gl.drawArrays(this.gl.TRIANGLES, body * 18 + 6, 6);
		this.gl.drawArrays(this.gl.TRIANGLES, legs * 18 + 12, 6);
		this.gl.useProgram(this.program[0]);
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
	}
	
	drawChunk(x, y, blocksOfChunk, lightChunk) {
		const width = this.widthChunk * this.size;
		const height = this.heightChunk * this.size;
		const c = `${x}x${y}`;
		
		// буфер кадров
		if (this.arrayOfChunks[c] === undefined) {
			let texture = [], blockBuffer = [], texBuffer = [];
			for (let i in blocksOfChunk) {
				texture[i] = this.gl.createTexture();
				this.gl.bindTexture(this.gl.TEXTURE_2D, texture[i]);
				this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA,
					this.gl.UNSIGNED_BYTE, null);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
				
				blockBuffer[i] = this.gl.createBuffer();
				texBuffer[i] = this.gl.createBuffer();
			}
			
			let light = this.gl.createTexture();
			this.gl.bindTexture(this.gl.TEXTURE_2D, light);
			
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			
			this.arrayOfChunks[c] = {
				x: x,
				y: y,
				tex: texture,
				light: light,
				blockBuffer: blockBuffer,
				texBuffer: texBuffer,
			};
		}
		
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, this.widthChunk * 2, this.heightChunk * 2, 0,
			this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, new Uint8Array(lightChunk.map((a) => {
				return a * 255;
			})));
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
		
		this.gl.viewport(0, 0, width, height);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
		
		this.gl.useProgram(this.program[3]);
		
		const w = 1 / this.widthChunk;
		const h = 1 / this.heightChunk;
		
		// Отрисовка слоёв
		for (let i in this.arrayOfChunks[c].tex) {
			let arrayOfBuffer = [];
			let textureOfBuffer = [];
			
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
				this.arrayOfChunks[c].tex[i], 0);
			this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			
			let v = 0;
			
			for (let x = 0; x < this.widthChunk; x++) {
				const xh = x * w;
				for (let y = 0; y < this.heightChunk; y++) {
					const yh = y * h;
					const aoo = this.arrayOfObjects[this.IDs[blocksOfChunk[i][y][x]]];
					if (aoo != undefined) {
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
			
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.arrayOfChunks[c].blockBuffer[i]);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfBuffer), this.gl.DYNAMIC_DRAW);
			this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.arrayOfChunks[c].texBuffer[i]);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureOfBuffer), this.gl.DYNAMIC_DRAW);
			this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, v);
		}
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
		this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
		this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
	}
	
	deleteChunk(x, y) {
		const c = `${x}x${y}`;
		if (this.arrayOfChunks[c] !== undefined) {
			for (let i in this.arrayOfChunks[c].tex) {
				this.gl.deleteTexture(this.arrayOfChunks[c].tex[i]);
				delete this.arrayOfChunks[c].tex[i];
				this.gl.deleteBuffer(this.arrayOfChunks[c].blockBuffer[i]);
				delete this.arrayOfChunks[c].blockBuffer[i];
				this.gl.deleteBuffer(this.arrayOfChunks[c].texBuffer[i]);
				delete this.arrayOfChunks[c].texBuffer[i];
			}
			this.gl.deleteTexture(this.arrayOfChunks[c].light);
			delete this.arrayOfChunks[c].light;
			delete this.arrayOfChunks[c];
		}
	}
	
	isExistChunk(x, y) {
		return this.arrayOfChunks[`${x}x${y}`] != undefined;
	}
	
	render(xc, yc, xp, yp, scale, lightOfDay, lightOfPlayer, slicePlayer, rotatePlayer, drawObjects) {
		this.resizeCanvas(); // подгоняем канвас под экран
		
		// "вырезаем" кусок экрана для отображения
		const ch = this.size / this.gl.canvas.height;
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = scale * asp;
		const left = xc * ch - width / 2;
		const right = xc * ch + width / 2;
		const bottom = yc * ch - scale / 2;
		const top = yc * ch + scale / 2;
		this.gl.useProgram(this.program[0]);
		const near = 0.01;
		const far = 11;
		this.gl.uniformMatrix4fv(this.uniform[0].u_projectionMatrix, false, [
			2.0 / (right - left), 0.0, 0.0, 0.0,
			0.0, 2.0 / (top - bottom), 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]);
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0.53, 0.81, 0.98, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		
		// отрисовка фона
		const z = 0.1 - far;
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[1]);
		this.gl.uniform1f(this.uniform[0].u_resolution, 1 / scale);
		this.gl.uniform1f(this.uniform[0].u_light, lightOfDay);
		
		for (let i = 0; i <= asp * scale + 1; i++) {
			this.gl.uniform3f(this.uniform[0].u_translate,
				xc * ch + i - asp * scale / 2, yc * ch - scale / 2, z);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
		}
		
		// TODO: Привести код в порядок
		// отрисовка чанков
		this.gl.uniform1f(this.uniform[0].u_resolution, this.gl.canvas.height);
		this.gl.uniform1f(this.uniform[0].u_light, 1); // стандартное освещение
		this.gl.disable(this.gl.DEPTH_TEST);
		
		this.gl.useProgram(this.program[2]);
		const deltaX = (xp - xc) * this.size + this.gl.canvas.width / 2;
		const deltaY = (yp + 1.5 - yc) * this.size + this.gl.canvas.height / 2;
		
		this.gl.uniform4f(this.uniform[2].u_dynamicLight, deltaX, deltaY, 9 * this.size, 0.2);
		this.gl.uniform1f(this.uniform[2].u_sizeBlock, this.size);
		this.gl.uniformMatrix4fv(this.uniform[2].u_projectionMatrix, false, [
			2.0 / (right - left), 0.0, 0.0, 0.0,
			0.0, 2.0 / (top - bottom), 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]);
		this.gl.uniform1f(this.uniform[2].u_resolution, this.gl.canvas.height);
		let ls = 0.65;
		if (slicePlayer == 2) {
			ls = 0.75;
		}
		for (let c in this.arrayOfChunks) {
			if (this.arrayOfChunks[c] !== undefined) {
				const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
				const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
				this.gl.activeTexture(this.gl.TEXTURE1);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
				this.gl.activeTexture(this.gl.TEXTURE0);
				this.gl.uniform1f(this.uniform[2].u_light, ls / 2);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[2]);
				this.gl.uniform3f(this.uniform[2].u_translate, xc, yc, -3);
				this.gl.drawArrays(this.gl.TRIANGLES, 30, 6);
				this.gl.uniform1f(this.uniform[2].u_light, ls);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[1]);
				this.gl.drawArrays(this.gl.TRIANGLES, 30, 6);
			}
		}
		this.gl.useProgram(this.program[0]);
		
		if (slicePlayer == 2) {			
			// отрисовка игрока
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturePlayer);
			this.gl.uniform1f(this.uniform[0].u_light, lightOfPlayer);
			this.gl.uniform3f(this.uniform[0].u_translate, xp * ch, yp * ch, -1);
			if (rotatePlayer > 0) {
				this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
			} else {
				this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
			}
			
			this.gl.useProgram(this.program[1]);
			this.gl.uniform2f(this.uniform[1].u_center, deltaX, deltaY);
			this.gl.uniform1f(this.uniform[1].u_light, 1);
			this.gl.uniform1f(this.uniform[1].u_sizeBlock, this.size);
			this.gl.uniformMatrix4fv(this.uniform[1].u_projectionMatrix, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]);
			this.gl.uniform1f(this.uniform[1].u_resolution, this.gl.canvas.height);
			
			for (let c in this.arrayOfChunks) {
				if (this.arrayOfChunks[c] !== undefined) {
					const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
					const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
					this.gl.activeTexture(this.gl.TEXTURE1);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
					this.gl.activeTexture(this.gl.TEXTURE2);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[1]);
					this.gl.activeTexture(this.gl.TEXTURE0);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[0]);
					this.gl.uniform3f(this.uniform[1].u_translate, xc, yc, -2);
					this.gl.drawArrays(this.gl.TRIANGLES, 30, 6);
				}
			}
		} else {
			this.gl.useProgram(this.program[2]);
			
			this.gl.uniform1f(this.uniform[2].u_light, 1);
			this.gl.uniformMatrix4fv(this.uniform[2].u_projectionMatrix, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]);
			
			for (let c in this.arrayOfChunks) {
				if (this.arrayOfChunks[c] !== undefined) {
					const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
					const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
					this.gl.activeTexture(this.gl.TEXTURE1);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
					this.gl.activeTexture(this.gl.TEXTURE0);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[0]);
					this.gl.uniform3f(this.uniform[2].u_translate, xc, yc, -2);
					this.gl.drawArrays(this.gl.TRIANGLES, 30, 6);
				}
			}
		}
		this.gl.useProgram(this.program[0]);
		
		if (slicePlayer == 1) {
			// отрисовка игрока
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturePlayer);
			this.gl.uniform1f(this.uniform[0].u_light, lightOfPlayer);
			this.gl.uniform3f(this.uniform[0].u_translate, xp * ch, yp * ch, -1);
			if (rotatePlayer > 0) {
				this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
			} else {
				this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
			}
		}
		
		this.gl.uniformMatrix4fv(this.uniform[0].u_projectionMatrix, false, [
			2.0, 0.0, 0.0, 0.0,
			0.0, 2.0, 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			-1.0, -1.0, (far + near) / (near - far), 1.0]);
		
		this.gl.flush(); // очистка данных
	}
	
	createShader(type, source) {
		// создание шейдера
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			return shader;
		}
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
	
	createUniformLocation(program, params) {
		let uniformLocation = {};
		for (let i in params) {
			uniformLocation[params[i]] = this.gl.getUniformLocation(program, params[i]);
		}
		return uniformLocation;
	}
	
	createProgram(vertexShader, fragmentShader, linker) {
		// создание программы из шейдеров
		const program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		for (let i in linker) {
			this.gl.bindAttribLocation(program, linker[i].id, linker[i].name);
		}
		this.gl.linkProgram(program);
		if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			return program;
		}
		const error = '\nGLSL PROGRAM CREATE ERROR:\n' + this.gl.getProgramInfoLog(program);
		this.gl.deleteProgram(program);
		throw new Error(error);
	}
	
	resizeCanvas(multiplier) {
		// подгоняем канвас под экран
		multiplier = multiplier || 1;
		const width = Math.floor(this.gl.canvas.clientWidth * multiplier);
		const height = Math.floor(this.gl.canvas.clientHeight * multiplier);
		if (this.gl.canvas.width !== width || this.gl.canvas.height !== height) {
			this.gl.canvas.width = width;
			this.gl.canvas.height = height;
		}
	}
	
	// отрисовка
	createTexture(image, width, height) {
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			
		// задание параметров текстуры
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
		//this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
		//this.gl.generateMipmap(this.gl.TEXTURE_2D);
		
		const buffer0 = this.gl.createBuffer();
		const buffer1 = this.gl.createBuffer();
		return [texture, buffer0, buffer1];
	}
	
	getCanvasSize() {
		this.resizeCanvas();
		return [this.gl.canvas.width, this.gl.canvas.height];
	}
	
	// array: {'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY]}
	drawObjects(texture, array) {
		this.gl.useProgram(this.program[3]);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture[0]);
		
		let arrayOfBuffer = [];
		let textureOfBuffer = [];
		let v = 0;
		
		const w = 1 / this.gl.canvas.width;
		const h = 1 / this.gl.canvas.height;
		
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
				v += 6;
		}
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texture[1]);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfBuffer), this.gl.DYNAMIC_DRAW);
		this.gl.vertexAttribPointer(_positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texture[2]);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureOfBuffer), this.gl.DYNAMIC_DRAW);
		this.gl.vertexAttribPointer(_texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, v);
	}
}
