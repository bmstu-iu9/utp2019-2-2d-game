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
		this.gl = canvas.getContext('webgl'); // получаем доступ к webgl
		if (!this.gl) {
			const ErrorMsg = 'Browser is very old';
			stop();
			alert(ErrorMsg);
			throw new Error(ErrorMsg);
		}
		
		// сборка и компиляция шейдерной программы
		const vertexShader = this.createShader(this.gl.VERTEX_SHADER, document.getElementById('vertex-shader').text);
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER,
			document.getElementById('fragment-shader').text);
		this.program = this.createProgram(vertexShader, fragmentShader);
		
		// используем шейдерную программу
		this.gl.useProgram(this.program);
		
		// прозрачность
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.BLEND);
		
		// получение uniform-переменных из шейдеров
		this.projectionMatrixUniformLocation = this.gl.getUniformLocation(this.program, 'u_projectionMatrix');
		this.translateUniformLocation = this.gl.getUniformLocation(this.program, 'u_translate');
		this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
		this.lightUniformLocation = this.gl.getUniformLocation(this.program, 'u_light');
		
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
	
	settings(size, widthChunk, heightChunk) {
		this.size = size;
		this.widthChunk = widthChunk;
		this.heightChunk = heightChunk;
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
		4 - фреймбуфер
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
		const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(positionAttributeLocation);
		this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание буфера и атрибута текстурных координат
		const texCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
		const texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(texCoordAttributeLocation);
		this.gl.vertexAttribPointer(texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		this.frameBufferTextures = {};
	}
	
	createChunk(x, y, lightOfFrontChunk, blocksOfFrontChunk, lightOfBackChunk, blocksOfBackChunk, lightChunk) {
		const w = this.widthChunk * this.size;
		const h = this.heightChunk * this.size;
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		
		//this.gl.flush(); // тест
		
		
		
		
		this.arrayOfChunk[`${x}x${y}`] = {
			x: x,
			y: y,
			tex: textute
		}
	}
	
	deleteChunk(x, y) {
		this.gl.deleteTexture(this.arrayOfChunks[`${x}x${y}`].tex);
		this.gl.deleteFramebuffer(this.arrayOfChunks[`${x}x${y}`].fb);
		this.arrayOfChunk[`${x}x${y}`] = undefined;
	}
	
	isExistChunk(x, y) {
		return this.arrayOfChunks[`${x}x${y}`] != undefined;
	}
	
	NEWrender(xc, yc, xp, yp, scale) {
		this.resizeCanvas(this.gl.canvas); // подгоняем канвас под экран
		
		// "вырезаем" кусок экрана для отображения
		const ch = this.size / this.gl.canvas.height;
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = scale * asp;
		const left = x * ch - width / 2;
		const right = x * ch + width / 2;
		const bottom = y * ch - scale / 2;
		const top = y * ch + scale / 2;
		const near = 0.01;
		const far = 11;
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false, [
			2.0 / (right - left), 0.0, 0.0, 0.0,
			0.0, 2.0 / (top - bottom), 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0]); 
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.uniform1f(this.lightUniformLocation, 1);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0.53, 0.81, 0.98, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
		
		// отрисовка чанков
		for (let c in arrayOfChunk) {
			const xChunk = this.widthChunk * this.arrayOfChunks[c].x * ch;
			const yChunk = this.heightChunk * this.arrayOfChunks[c].y * ch;
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].texture);
			this.gl.uniform3f(this.translateUniformLocation, xChunk, yChunk, -4);
			this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
		}
		
		// отрисовка игрока
		this.gl.disable(this.gl.DEPTH_TEST);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]);
		this.gl.uniform1f(this.lightUniformLocation, lightOfDay);
		this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
		this.gl.uniform3f(this.translateUniformLocation, xp * ch, yp * ch, -1);
		this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
		this.gl.enable(this.gl.DEPTH_TEST);
	}
	
	render(x, y, xp, yp, scale, arrayOfChunk) {
		this.resizeCanvas(this.gl.canvas);
		const ch = this.size / this.gl.canvas.height;
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = scale * asp;
		const left = x * ch - width / 2;
		const right = x * ch + width / 2;
		const bottom = y * ch - scale / 2;
		const top = y * ch + scale / 2;
		const near = 0.01;
		const far = 11;
		
		// отрисовка блоков в фреймбуфер
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
		this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
		
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false, [
			2.0, 0.0, 0.0, 0.0,
			0.0, 2.0, 0.0, 0.0,
			0.0, 0.0, -2.0 / (far - near), 0.0,
			-1.0, -1.0, (far + near) / (near - far), 1.0]);
		const w = this.widthChunk * this.size;
		const h = this.heightChunk * this.size;
		this.gl.uniform1f(this.resolutionUniformLocation, this.heightChunk * this.size);
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
		for (let c in arrayOfChunk) {
			if (arrayOfChunk[c].light != -100) {
				if (this.arrayOfChunks[c] == undefined) {
					// фреймбуфер
					const texture = this.gl.createTexture();
					this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
					this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
						null);
					this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
					this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
					this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
						texture, 0);
					
					this.gl.viewport(0, 0, w, h); // указываем границы отрисовки
					this.gl.clearColor(0.0, 0.0, 0.0, 0.0); // заливаем экран прозрачным цветом
					this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
					this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
					
					for (let x in arrayOfChunk[c].chunk) {
						const xh = x / this.widthChunk;
						for (let y in arrayOfChunk[c].chunk[x]) {
							const yh = y /this.heightChunk;
							const id = arrayOfChunk[c].chunk[x][y];
							if (id !== undefined) {
								const light = arrayOfChunk[c].light * arrayOfChunk[c.slice(0, -1) + "L"].chunk[x][y];
								if (light < 0.01) {
									this.gl.uniform1f(this.lightUniformLocation, 0);
									this.gl.uniform3f(this.translateUniformLocation,
										xh, yh, -arrayOfChunk[c].slice);
									this.gl.drawArrays(this.gl.TRIANGLES, 12, 6);
								} else {
									this.gl.uniform1f(this.lightUniformLocation, light);
									this.gl.uniform3f(this.translateUniformLocation,
										xh, yh, -arrayOfChunk[c].slice);
									this.gl.drawArrays(this.gl.TRIANGLES, this.ids[id] * 6, 6);
								}
							}
						}
					}
					this.arrayOfChunks[c] = {
						x: arrayOfChunk[c].x,
						y: arrayOfChunk[c].y,
						t: texture
					}
				}
			}
        }
		
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0
			]); // "вырезаем" кусок экрана для отображения
		
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); // включаем отрисовку в canvas
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height); // указываем границы отрисовки
		this.gl.clearColor(0.53, 0.81, 0.98, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		
		// отрисовка фона
		//this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[1]);
		//this.gl.uniform1f(this.resolutionUniformLocation, 1);
		const lightOfDay = Math.round((1 + gameArea.timeOfDay * 2) * 20) / 60;

		//this.gl.uniform1f(this.lightUniformLocation, lightOfDay);
		//const z = 0.1 - far;
		
		// необходимо изменить!
		/*
		for (let i = 0; i < asp / 2 + 2; i++) {
			this.gl.uniform3f(this.translateUniformLocation,
				x * ch - (x * ch / 2) % (this.backgroundAsp * 2) + this.backgroundAsp * i + 0.5, y * ch - 0.5, z);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
			this.gl.uniform3f(this.translateUniformLocation,
				x * ch - (x * ch / 2) % (this.backgroundAsp * 2) + this.backgroundAsp * -i - 0.5, y * ch - 0.5, z);
			this.gl.drawArrays(this.gl.TRIANGLES, 6, 6);
		}*/
		
		this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
		this.gl.uniform1f(this.lightUniformLocation, 1); // стандартное освещение
		//this.gl.disable(this.gl.DEPTH_TEST);
		
		for (let c in arrayOfChunk) {
			if (this.arrayOfChunks[c] != undefined) {
				const xc = this.widthChunk * arrayOfChunk[c].x * ch;
				const yc = this.heightChunk * arrayOfChunk[c].y * ch;
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrayOfChunks[c].t);
				this.gl.uniform3f(this.translateUniformLocation, xc, yc, -arrayOfChunk[c].slice);
				this.gl.drawArrays(this.gl.TRIANGLES, 24, 6);
			}
		}
		
		// отрисовка игрока
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]);
		this.gl.uniform1f(this.lightUniformLocation, lightOfDay);
		this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
		this.gl.uniform3f(this.translateUniformLocation, xp * ch, yp * ch, -1);
		this.gl.drawArrays(this.gl.TRIANGLES, 18, 6);
		this.gl.enable(this.gl.DEPTH_TEST);
	}
	
	createShader(type, source) {
		// создание шейдера
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			return shader;
		}
		if (type === this.gl.VERTEX_SHADER) {
			console.log('VERTEX SHADER ERROR:');
		} else if (type === this.gl.FRAGMENT_SHADER) {
			console.log('FRAGMENT SHADER ERROR:');
		} else {
			console.log('SHADER ERROR:');
		}
		console.log(this.gl.getShaderInfoLog(shader));
		this.gl.deleteShader(shader);
		throw new Error();
	}
	
	createProgram(vertexShader, fragmentShader){
		// создание программы из шейдеров
		const program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			return program;
		}
		console.log('GLSL PROGRAM CREATE ERROR:\n', this.gl.getProgramInfoLog(program));
		this.gl.deleteProgram(program);
		throw new Error();
	}
	
	resizeCanvas(canvas, multiplier) {
		// подгоняем канвас под экран
		multiplier = multiplier || 1;
		const width = canvas.clientWidth * multiplier | 0;
		const height = canvas.clientHeight * multiplier | 0;
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}
	}
}
