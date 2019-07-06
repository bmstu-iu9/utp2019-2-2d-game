'use strict';

// Не лезь, оно тебя сожрёт!

/*
Как это использовать?

const r = new Render(image, background); // инициализация движка
	image - это объект Image
	background - это изображение с фоном объекта Image

Для корректного изображения фона, левая и правая половины фона должны быть абсолютно одинаковыми!!!

Пример использования типа Image:
const image = new Image();
image.src = 'image.png';
image.onload = () => {
	...
}

Изображения должны находится в одном файле (кроме фона),
которые будут с помощью текстурных координат частично использования.
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
r.render(x, y, scale, arrayOfObjects)
	x, y - координаты камеры
	scale - масштаб экрана
	arrayOfObjects - массив/объект чанков, которые представляются в виде ассоциативных массивов:
		{'chunk': chunk', 'slice': slice, 'x': xc, 'y': yc}
			chunk - матрица с id блоков
			slice - слой на котором должен находиться чанк [4..1000]
			xc, yc - координаты чанка

Полный рабочий пример:

const image = new Image();
image.src = 'Images/image.png';
image.onload = () => {
	const background = new Image();
	background.src = 'Images/background.png';
	background.onload = () => {
		const r = new Render(image, background);
		
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
			r.render(e += deltaTime, 0, 1, arrayOfChunk);
			requestAnimationFrame(update);
		}
		requestAnimationFrame(update);
    };
};

Чего-то непонятно?
Обращаться к Надиму.
*/

class Render {
	constructor(image, background) {
		const canvas = document.getElementById('canvas'); // получаем канвас
		this.gl = canvas.getContext('webgl'); // получаем доступ к webgl
		if (!this.gl) {
			const ErrorMsg = 'Browser is very old';
			stop();
			alert(ErrorMsg);
			throw new Error(ErrorMsg);
		}
		
		// сборка и компиляция шейдерной программы
		const vertexShader = this.createShader(this.gl.VERTEX_SHADER,
			document.getElementById('vertex-shader').text);
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER,
			document.getElementById('fragment-shader').text);
		const program = this.createProgram(vertexShader, fragmentShader);
		
		// используем шейдерную программу
		this.gl.useProgram(program);
		
		// прозрачность
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.BLEND);
		
		// получение uniform-переменных из шейдеров
		this.projectionMatrixUniformLocation = this.gl.getUniformLocation(program, 'u_projectionMatrix');
		this.modelviewMatrixUniformLocation = this.gl.getUniformLocation(program, 'u_modelviewMatrix');
		this.resolutionUniformLocation = this.gl.getUniformLocation(program, 'u_resolution');
		
		// создание текстуры
		const imgs = [image, background];
		this.textures = [];
		for (let i = 0; i < 2; i++) {
			const texture = this.gl.createTexture();
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			
			// задание параметров текстуры
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imgs[i]);
			
			this.textures.push(texture);
		}
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
		this.backgroundAsp = background.width / background.height / 2;
		
		// единичные матрицы
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false,
			[1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1]);
		this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
			[1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1]);
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
		let endId = 0;
		this.ids = [];
		
		let arrayOfPosition = [];
		let arrayOfTexCoord = [];
		arrayOfObjects.forEach((obj) => {
			arrayOfPosition = arrayOfPosition.concat(
				[0, 0,
				this.size, 0,
				0, this.size,
				0, this.size,
				this.size, 0,
				this.size, this.size]);
			arrayOfTexCoord = arrayOfTexCoord.concat(
				[obj.a[0], obj.b[1],
				obj.b[0], obj.b[1],
				obj.a[0], obj.a[1],
				obj.a[0], obj.a[1],
				obj.b[0], obj.b[1],
				obj.b[0], obj.a[1]]);
			this.ids[obj.id] = endId++;
		});
		
		// получение атрибутов из вершинного шейдера
		const positionAttributeLocation = this.gl.getAttribLocation(program, 'a_position');
		const texCoordAttributeLocation = this.gl.getAttribLocation(program, 'a_texCoord');
		
		// создание буфера и атрибута координат позиций
		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(positionAttributeLocation);
		this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
		
		// создание буфера и атрибута текстурных координат
		const texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(texCoordAttributeLocation);
		this.gl.vertexAttribPointer(texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
	}
	
	render(x, y, scale, arrayOfChunk) {
		if (scale <= 0) {
			throw new Error("Invalid scale: scale <= 0");
		}
		this.resizeCanvas(this.gl.canvas);
		const ch = this.size / this.gl.canvas.height;
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = scale * asp;
		const left = x * ch - width / 2;
		const right = x * ch + width / 2;
		const bottom = y * ch - scale / 2;
		const top = y * ch + scale / 2;
		const near = 0.0001;
		const far = 1002;
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0
			]); // "вырезаем" кусок экрана для отображения
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0.53, 0.81, 0.98, 1); // заполняем фон цветом
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		
		// отрисовка фона
		
		
		// отрисовка блоков
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
		this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
		for (let c in arrayOfChunk) {
			const xc = this.widthChunk * arrayOfChunk[c].x * ch;
			const yc = this.heightChunk * arrayOfChunk[c].y * ch;
            for (let y in arrayOfChunk[c].chunk) {
				for (let x in arrayOfChunk[c].chunk[y]) {
					const id = arrayOfChunk[c].chunk[y][x];
                    if (id !== undefined) {
                        if (this.ids[id] === undefined) {
                            throw new Error("Такого Id нет: " + id);
                        }
                        this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
                            [1, 0, 0, 0,
                            0, 1, 0, 0,
                            0, 0, 1, 0,
                            y * ch + xc, x * ch + yc, -arrayOfChunk[c].slice, 1]);
                        this.gl.drawArrays(this.gl.TRIANGLES, this.ids[id] * 6, 6);
                    }
                }
            }
        }
	}
	
	OLDrender(x, y, scale, arrayOfObjects) {
		// НЕ РАБОТАЕТ!!!
		// отрисовка фона
		this.gl.uniform1f(this.resolutionUniformLocation, 1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[1]);
		const posBuffBackground = this.gl.createBuffer();
		const texCoordBuffBackground = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffBackground);
		const z = 1 - far;
		let m = left % (2 * width);
		if (m < 0) {
			m = m + 2 * width;
		}
		if (asp > this.backgroundAsp) {
			// растянуть по ширине
			const b = y - width / this.backgroundAsp / 2;
			const t = y + width / this.backgroundAsp / 2;
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
				[left, b, z,
				right, b, z,
				left, t, z,
				left, t, z,
				right, b, z,
				right, t, z]), this.gl.STATIC_DRAW);
		} else {
			// растянуть по высоте
			const l = x - scale * this.backgroundAsp / 2;
			const r = x + scale * this.backgroundAsp / 2;
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
				[l, bottom, z,
				r, bottom, z,
				l, top, z,
				l, top, z,
				r, bottom, z,
				r, top, z]), this.gl.STATIC_DRAW);
		}
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffBackground);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
			[m / width / 4, 1,
			m / width / 4 + 0.5, 1,
			m / width / 4, 0,
			m / width / 4, 0,
			m / width / 4 + 0.5, 1,
			m / width / 4 + 0.5, 0]), this.gl.DYNAMIC_DRAW);
		
		this.gl.enableVertexAttribArray(this.positionAttributeLocation);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffBackground);
		this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
		
		this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffBackground);
		this.gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
			
		this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
			[1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1]);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
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
		}
		else if (type === this.gl.FRAGMENT_SHADER) {
			console.log('FRAGMENT SHADER ERROR:');
		}
		else {
			console.log('SHADER ERROR:');
		}
		console.log(this.gl.getShaderInfoLog(shader));
		this.gl.deleteShader(shader);
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
	}
	
	resizeCanvas(canvas, multiplier) {
		// подгоняем канвас под экран
		multiplier = multiplier || 1;
		var width = canvas.clientWidth * multiplier | 0;
		var height = canvas.clientHeight * multiplier | 0;
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}
	}
}
