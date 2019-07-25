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

Чего-то непонятно?
Обращаться к Надиму
*/

class Render {
	constructor() {
		const canvas = document.getElementById('canvas'); // получаем канвас
		this.gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: false }); // получаем доступ к webgl
		if (!this.gl) {
			const ErrorMsg = 'Browser is very old';
			stop();
			alert(ErrorMsg);
			throw new Error(ErrorMsg);
		}
		this.gl.clearColor(0.53, 0.81, 0.98, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		
		// сборка и компиляция шейдерной программы
		this.program = [];
		for (let i in _vertexShader) {
			const vertexShader = this.createShader(this.gl.VERTEX_SHADER, _vertexShader[i]);
			const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, _fragmentShader[i]);
			this.program[i] = this.createProgram(vertexShader, fragmentShader);
		}
		
		// прозрачность
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		
		// SHADER PROGRAM 0
		this.gl.useProgram(this.program[0]);
		// получение uniform-переменных из шейдеров
		this.projectionMatrixUniformLocation0 = this.gl.getUniformLocation(this.program[0], 'u_projectionMatrix');
		this.translateUniformLocation0 = this.gl.getUniformLocation(this.program[0], 'u_translate');
		this.resolutionUniformLocation0 = this.gl.getUniformLocation(this.program[0], 'u_resolution');
		this.lightUniformLocation0 = this.gl.getUniformLocation(this.program[0], 'u_light');
		
		// SHADER PROGRAM 1
		this.gl.useProgram(this.program[1]);
		// получение uniform-переменных из шейдеров
		this.projectionMatrixUniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_projectionMatrix');
		this.translateUniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_translate');
		this.resolutionUniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_resolution');
		this.lightUniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_light');
		this.centerUniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_center');
		this.texture0UniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_texture0');
		this.texture1UniformLocation1 = this.gl.getUniformLocation(this.program[1], 'u_texture1');
		
		this.gl.uniform1i(this.texture0UniformLocation1, 0);
		this.gl.uniform1i(this.texture1UniformLocation1, 1);
		
		// SHADER PROGRAM 2
		this.gl.useProgram(this.program[2]);
		// получение uniform-переменных из шейдеров
		this.projectionMatrixUniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_projectionMatrix');
		this.translateUniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_translate');
		this.resolutionUniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_resolution');
		this.lightUniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_light');
		this.sizeBlockUniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_sizeBlock');
		this.dynamicLightUniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_dynamicLight');
		this.texture0UniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_texture0');
		this.texture1UniformLocation2 = this.gl.getUniformLocation(this.program[2], 'u_texture1');
		
		this.gl.uniform1i(this.texture0UniformLocation2, 0);
		this.gl.uniform1i(this.texture1UniformLocation2, 1);
		
		// используем шейдерную программу
		this.gl.useProgram(this.program[0]);
		
		// буфер чанков
		this.arrayOfChunks = {};
		this.frameBuffer = this.gl.createFramebuffer();
		
		this.backgroundAsp = 512 / 512; // размер фона
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
		let endId = 5;
		this.ids = [];
		
		/*
		ID:
		0 - фон 1
		1 - фон 2
		2 - чёрный блок
		3 - игрок
		4 - буфер кадров
		5+ - остальные блоки
		*/
		
		const l = 0, h = this.size;
		
		let arrayOfPosition = [
			0, 0, // ID: 0
			this.backgroundAsp, 0,
			0, 1,
			0, 1,
			this.backgroundAsp, 0,
			this.backgroundAsp, 1,
			
			0, 0, // ID: 1
			this.backgroundAsp, 0,
			0, 1,
			0, 1,
			this.backgroundAsp, 0,
			this.backgroundAsp, 1,
			
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
			
			l, l, // ID: 4
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
			
			0, 96 / 256, // ID: 3
			48 / 256, 96 / 256,
			0, 0,
			0, 0,
			48 / 256, 96 / 256,
			48 / 256, 0,
			
			0, 0, // ID: 4
			1, 0,
			0, 1,
			0, 1,
			1, 0,
			1, 1];
		
		arrayOfObjects.forEach((obj) => {
			arrayOfPosition = arrayOfPosition.concat([
				l, l,
				h, l,
				l, h,
				l, h,
				h, l,
				h, h]);
			arrayOfTexCoord = arrayOfTexCoord.concat([
				obj.a[0], obj.b[1],
				obj.b[0], obj.b[1],
				obj.a[0], obj.a[1],
				obj.a[0], obj.a[1],
				obj.b[0], obj.b[1],
				obj.b[0], obj.a[1]]);
			this.ids[obj.id] = endId++;
		});
		
		// создание буфера и атрибута координат позиций
		const positionAttributeLocation = this.gl.getAttribLocation(this.program[0], 'a_position');
		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(positionAttributeLocation);
		this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание буфера и атрибута текстурных координат
		const texCoordAttributeLocation = this.gl.getAttribLocation(this.program[0], 'a_texCoord');
		const texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(texCoordAttributeLocation);
		this.gl.vertexAttribPointer(texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		this.frameBufferTextures = {};
		const near = 0.01;
		const far = 11;
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation0, false, [
			2.0, 0.0, 0.0, 0.0,
			0.0, 2.0, 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			-1.0, -1.0, (far + near) / (near - far), 1.0]);
	}
	
	drawChunk(x, y, blocksOfChunk, lightChunk) {
		const width = this.widthChunk * this.size;
		const height = this.heightChunk * this.size;
		const c = `${x}x${y}`;
		
		// буфер кадров
		if (this.arrayOfChunks[c] == undefined) {
			let texture = [];
			for (let i in blocksOfChunk) {
				texture[i] = this.gl.createTexture();
				this.gl.bindTexture(this.gl.TEXTURE_2D, texture[i]);
				this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA,
					this.gl.UNSIGNED_BYTE, null);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
			}
			
			let light = this.gl.createTexture();
			this.gl.bindTexture(this.gl.TEXTURE_2D, light);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, this.widthChunk * 2, this.heightChunk * 2, 0,
				this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, new Uint8Array(lightChunk.map((a) => {
					return a * 255;
				})));
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.arrayOfChunks[c] = {
				x: x,
				y: y,
				tex: texture,
				light: light
			};
		} else {
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[`${x}x${y}`].light);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, this.widthChunk * 2, this.heightChunk * 2, 0,
				this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, new Uint8Array(lightChunk.map((a) => {
					return a * 255;
				})));
		}
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
		this.gl.uniform1f(this.resolutionUniformLocation0, height);
		//this.gl.flush(); // тест
		
		this.gl.viewport(0, 0, width, height);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
		this.gl.uniform1f(this.lightUniformLocation0, 1);
		
		// Отрисовка слоёв
		for (let i in this.arrayOfChunks[c].tex) {
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
				this.arrayOfChunks[c].tex[i], 0);
			this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			
			for (let x = 0; x < this.widthChunk; x++) {
				const xh = x / this.widthChunk;
				for (let y = 0; y < this.heightChunk; y++) {
					const yh = y / this.heightChunk;
					const id = blocksOfChunk[i][x][y];
					if (id != undefined) {
						this.gl.uniform3f(this.translateUniformLocation0, xh, yh, -1);
						this.gl.drawArrays(this.gl.TRIANGLES, this.ids[id] * 6, 6);
					}
				}
			}
		}
	}
	
	deleteChunk(x, y) {
		if (this.arrayOfChunks[`${x}x${y}`] != undefined) {
			for (let i in this.arrayOfChunks[`${x}x${y}`].tex) {
				this.gl.deleteTexture(this.arrayOfChunks[`${x}x${y}`].tex[i]);
				delete this.arrayOfChunks[`${x}x${y}`].tex[i];
			}
			this.gl.deleteTexture(this.arrayOfChunks[`${x}x${y}`].light);
			delete this.arrayOfChunks[`${x}x${y}`].light;
			delete this.arrayOfChunks[`${x}x${y}`];
		}
	}
	
	isExistChunk(x, y) {
		return this.arrayOfChunks[`${x}x${y}`] != undefined;
	}
	
	render(xc, yc, xp, yp, scale, lightOfDay, lightOfPlayer, slicePlayer) {
		this.resizeCanvas(this.gl.canvas); // подгоняем канвас под экран
		
		// "вырезаем" кусок экрана для отображения
		const ch = this.size / this.gl.canvas.height;
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = scale * asp;
		const left = xc * ch - width / 2;
		const right = xc * ch + width / 2;
		const bottom = yc * ch - scale / 2;
		const top = yc * ch + scale / 2;
		const near = 0.01;
		const far = 11;
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation0, false, [
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
		this.gl.uniform1f(this.resolutionUniformLocation0, 1 / scale);
		this.gl.uniform1f(this.lightUniformLocation0, lightOfDay);
		
		for (let i = 0; i <= asp * scale + 1; i++) {
			this.gl.uniform3f(this.translateUniformLocation0,
				xc * ch + i - asp * scale / 2, yc * ch - scale / 2, z);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
		}
		
		// отрисовка чанков
		this.gl.uniform1f(this.resolutionUniformLocation0, this.gl.canvas.height);
		this.gl.uniform1f(this.lightUniformLocation0, 1); // стандартное освещение
		this.gl.disable(this.gl.DEPTH_TEST);
		
		this.gl.useProgram(this.program[2]);
		const deltaX = (xp - xc) * this.size + this.gl.canvas.width / 2;
		const deltaY = (yp + 1.5 - yc) * this.size + this.gl.canvas.height / 2;
		
		this.gl.uniform4f(this.dynamicLightUniformLocation2, deltaX, deltaY, 8 * this.size, 0.3);
		this.gl.uniform1f(this.sizeBlockUniformLocation2, this.size);
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation2, false, [
			2.0 / (right - left), 0.0, 0.0, 0.0,
			0.0, 2.0 / (top - bottom), 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]);
		this.gl.uniform1f(this.resolutionUniformLocation2, this.gl.canvas.height);
		let ls = 0.65;
		if (slicePlayer == 2) {
			ls = 0.75;
		}
		for (let c in this.arrayOfChunks) {
			if (this.arrayOfChunks[c] != undefined) {
				const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
				const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
				this.gl.activeTexture(this.gl.TEXTURE1);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
				this.gl.activeTexture(this.gl.TEXTURE0);
				this.gl.uniform1f(this.lightUniformLocation2, ls / 2);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[2]);
				this.gl.uniform3f(this.translateUniformLocation2, xc, yc, -3);
				this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
				this.gl.uniform1f(this.lightUniformLocation2, ls);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[1]);
				this.gl.uniform3f(this.translateUniformLocation2, xc, yc, -3);
				this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
			}
		}
		this.gl.useProgram(this.program[0]);
		
		if (slicePlayer == 2) {			
			// отрисовка игрока
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]);
			this.gl.uniform1f(this.lightUniformLocation0, lightOfPlayer);
			this.gl.uniform1f(this.resolutionUniformLocation0, this.gl.canvas.height);
			this.gl.uniform3f(this.translateUniformLocation0, xp * ch, yp * ch, -1);
			this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
			
			this.gl.useProgram(this.program[1]);
			this.gl.uniform2f(this.centerUniformLocation1, deltaX, deltaY);
			this.gl.uniform1f(this.lightUniformLocation1, 1);
			this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation1, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]);
			this.gl.uniform1f(this.resolutionUniformLocation1, this.gl.canvas.height);
			
			for (let c in this.arrayOfChunks) {
				if (this.arrayOfChunks[c] != undefined) {
					const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
					const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
					this.gl.activeTexture(this.gl.TEXTURE1);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
					this.gl.activeTexture(this.gl.TEXTURE0);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[0]);
					this.gl.uniform3f(this.translateUniformLocation1, xc, yc, -2);
					this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
				}
			}
			this.gl.useProgram(this.program[0]);
		} else {
			this.gl.useProgram(this.program[2]);
			
			this.gl.uniform1f(this.lightUniformLocation2, 1);
			this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation2, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]);
			this.gl.uniform1f(this.resolutionUniformLocation2, this.gl.canvas.height);
			
			for (let c in this.arrayOfChunks) {
				if (this.arrayOfChunks[c] != undefined) {
					const xc = this.widthChunk * this.arrayOfChunks[c].x * ch;
					const yc = this.heightChunk * this.arrayOfChunks[c].y * ch;
					this.gl.activeTexture(this.gl.TEXTURE1);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].light);
					this.gl.activeTexture(this.gl.TEXTURE0);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].tex[0]);
					this.gl.uniform3f(this.translateUniformLocation2, xc, yc, -2);
					this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
				}
			}
			this.gl.useProgram(this.program[0]);
		}
		
		if (slicePlayer == 1) {
			// отрисовка игрока
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]);
			this.gl.uniform1f(this.lightUniformLocation0, lightOfPlayer);
			this.gl.uniform1f(this.resolutionUniformLocation0, this.gl.canvas.height);
			this.gl.uniform3f(this.translateUniformLocation0, xp * ch, yp * ch, -1);
			this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
		}
		
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation0, false, [
			2.0, 0.0, 0.0, 0.0,
			0.0, 2.0, 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			-1.0, -1.0, (far + near) / (near - far), 1.0]);
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
	
	createProgram(vertexShader, fragmentShader) {
		// создание программы из шейдеров
		const program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			return program;
		}
		const error = '\nGLSL PROGRAM CREATE ERROR:\n' + this.gl.getProgramInfoLog(program);
		this.gl.deleteProgram(program);
		throw new Error(error);
	}
	
	resizeCanvas(canvas, multiplier) {
		// подгоняем канвас под экран
		multiplier = multiplier || 1;
		const width = Math.floor(canvas.clientWidth * multiplier);
		const height = Math.floor(canvas.clientHeight * multiplier);
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}
	}
}
