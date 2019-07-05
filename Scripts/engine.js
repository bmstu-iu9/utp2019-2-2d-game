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

Создание объекта:
r.createObject([x1, y1], [x2, y2], [xi1, yi1], [xi2, yi2], slice)
	x1, y1 - координаты левого верхнего угла
	x2, y2 - координаты нижнего правого угла
	xi1, yi1 - координаты левого верхнего угла на текстуре
	xi2, yi2 - координаты нижнего правого угла на текстуре
	slice - слой > 0. Чем больше значение, тем объект будет находить дальше от камеры.
		(0.01..2) - интерфейс (не двигается)
		(2..999) - игра

Отрисовка:
r.render(x, y, height, arrayOfObjects)
	x, y - координаты камеры
	height - высота экрана
	arrayOfObjects - массив объектов

Полный рабочий пример:

const image = new Image();
image.src = 'image.png';
image.onload = () => {
	const background = new Image();
	background.src = 'background.png';
	background.onload = () => {
		const r = new Render(image, background);
		let t = [];
		t.push(r.createObject([1, 1], [2, 2], [0, 0], [1, 1], 5));
		t.push(r.createObject([2.5, 2.5], [4, 4], [0, 0], [0.5, 1], 5));
		t.push(r.createObject([6.5, 2.5], [8, 4], [0.5, 0], [1, 1], 5));
		r.render(1, 0, 6, t);
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
		
		// получение атрибутов из вершинного шейдера
		this.positionAttributeLocation = this.gl.getAttribLocation(program, 'a_position');
		this.texCoordAttributeLocation = this.gl.getAttribLocation(program, 'a_texCoord');
		
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
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
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

	createObjects(arrayOfObjects) {
		const size = 32;
		let endId = 0;
		this.ids = [];
		
		let arrayOfPosition = [];
		let arrayOfTexCoord = [];
		arrayOfObjects.forEach((obj) => {
			arrayOfPosition = arrayOfPosition.concat(
				[0, 0,
				size, 0,
				0, size,
				0, size,
				size, 0,
				size, size]);
			arrayOfTexCoord = arrayOfTexCoord.concat(
				[obj.a[0], obj.b[1],
				obj.b[0], obj.b[1],
				obj.a[0], obj.a[1],
				obj.a[0], obj.a[1],
				obj.b[0], obj.b[1],
				obj.b[0], obj.a[1]]);
			this.ids[obj.id] = endId++;
		});
		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfPosition), this.gl.STATIC_DRAW);
		
		const texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayOfTexCoord), this.gl.STATIC_DRAW);
		
		this.gl.enableVertexAttribArray(this.positionAttributeLocation);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
			
		this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
		this.gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
	}
	
	render(x, y, height, arrayOfChunk) {
		if (height <= 0) {
			throw new Error("Invalid clip: height <= 0");
		}
		this.resizeCanvas(this.gl.canvas);
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = height * asp;
		const left = x - width / 2;
		const right = x + width / 2;
		const bottom = y - height / 2;
		const top = y + height / 2;
		const near = 0.0001;
		const far = 1000;
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0
			]); // "вырезаем" кусок экрана для отображения
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0.53, 0.81, 0.98, 1); // заполняем фон цветом
		arrayOfChunk.forEach((c) => {
			c.chunk.forEach((arr, y) => {
				arr.forEach((id, x) => {
					if (this.ids[id] === undefined) {
						throw new Error("Такого Id нет: " + id);
					}
					this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
					this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
						[1, 0, 0, 0,
						0, 1, 0, 0,
						0, 0, 1, 0,
						x / this.gl.canvas.height * 32, y / this.gl.canvas.height * 32, c.slice, 1]);
					this.gl.drawArrays(this.gl.TRIANGLES, this.ids[id] * 6, 6);
				});
			});
		});
	}
	
	Nrender(x, y, height, arrayOfObjects) {
		/*
		if (height <= 0) {
			throw new Error("Invalid clip: height <= 0");
		}
		this.resizeCanvas(this.gl.canvas); // подгоняем канвас под экран
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const width = height * asp;
		const left = x - width / 2;
		const right = x + width / 2;
		const bottom = y - height / 2;
		const top = y + height / 2;
		const near = 0.0001;
		const far = 1000;
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false, [
				2.0 / (right - left), 0.0, 0.0, 0.0,
				0.0, 2.0 / (top - bottom), 0.0, 0.0,
				0.0, 0.0, -2.0 / (far - near), 0.0,
				(right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1.0
			]); // "вырезаем" кусок экрана для отображения
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0.53, 0.81, 0.98, 1); // заполняем фон цветом
			*/
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); // чистим буфер цвета и буфер глубины
		
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
			const l = x - height * this.backgroundAsp / 2;
			const r = x + height * this.backgroundAsp / 2;
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
		this.gl.uniform1f(this.resolutionUniformLocation, this.gl.canvas.height);
		
		// отрисовка остального
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
		arrayOfObjects.forEach((a) => {
			if (a.pos != undefined) {
				this.gl.enableVertexAttribArray(this.positionAttributeLocation);
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a.pos);
				this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
				
				this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a.img);
				this.gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
				
				switch (a.mvm) {
					case 0:
						this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
							[1, 0, 0, 0,
							0, 1, 0, 0,
							0, 0, 1, 0,
							0, 0, 0, 1]);
						break;
					case 1:
						this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
							[1, 0, 0, 0,
							0, 1, 0, 0,
							0, 0, 1, 0,
							x, y, 0, 1]);
						break;
					default:
						this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
							[1, 0, 0, 0,
							0, 1, 0, 0,
							0, 0, 1, 0,
							0, 0, 0, 1]);
				}
				this.gl.drawArrays(this.gl.TRIANGLES, 0, 6); // рисуем треугольники
			}
		});
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
