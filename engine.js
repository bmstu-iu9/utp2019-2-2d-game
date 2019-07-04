'use strict';

// Не лезь, оно тебя сожрёт!

/*
Как это использовать?

const r = new Render(image); // инициализация движка
	image - это объект Image;

Пример использования типа Image:
const image = new Image();
image.src = 'image.png';
image.onload = () => {
	...
}

Изображения должны находится в одном файле, которые будут с помощью текстурных координат частично использования.
Рекомендуется использовать размер степени двойки.

Создание объекта:
r.createObject([x1, y1], [x2, y2], [xi1, yi1], [xi2, yi2], slice)
	x1, y1 - координаты левого верхнего угла
	x2, y2 - координаты нижнего правого угла
	xi1, yi1 - координаты левого верхнего угла на текстуре
	xi2, yi2 - координаты нижнего правого угла на текстуре
	slice - слой > 0. Чем больше значение, тем объект будет находить дальше от камеры.
		(0.01..2] - интерфейс (не двигается)
		(2..900] - игра
		(900..1000) - фон (двигается в 2 раза медленее)

Отрисовка:
r.render(x, y, height, arrayOfObjects)
	x, y - координаты камеры
	height - высота экрана
	arrayOfObjects - массив объектов

Полный рабочий пример:

const image = new Image();
image.src = 'image.png';
image.onload = () => {
	const r = new Render(image);
	let t = [];
	t.push(r.createObject([1, 1], [2, 2], [0, 0], [1, 1], 5));
	t.push(r.createObject([2.5, 2.5], [4, 4], [0, 0], [1, 1], 5));
	r.render(1, 0, 6, t);
};

Чего-то непонятно?
Обращаться к Надиму.
*/

class Render {
	constructor(image) {
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
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, document.getElementById('fragment-shader').text);
		const program = this.createProgram(vertexShader, fragmentShader);
		
		// используем шейдерную программу
		this.gl.useProgram(program);
		
		// получение атрибутов из вершинного шейдера
		this.positionAttributeLocation = this.gl.getAttribLocation(program, 'a_position');
		this.texCoordAttributeLocation = this.gl.getAttribLocation(program, 'a_texCoord');
		
		// получение uniform-переменных из шейдеров
		this.projectionMatrixUniformLocation = this.gl.getUniformLocation(program, 'u_projectionMatrix');
		this.modelviewMatrixUniformLocation = this.gl.getUniformLocation(program, 'u_modelviewMatrix');
		
		// создание текстуры
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		
		// задание параметров текстуры
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

		// единичные матрицы
		this.gl.uniformMatrix4fv(this.projectionMatrixUniformLocation, false,
			[1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1]);
		this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
			[1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1]);
	}
	createObject(a, b, ai, bi, slice) {
		if (slice <= 0) {
			throw new Error("Invalid object: slice <= 0");
		}
		// прямоугольник
		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
			[a[0], a[1], -slice,
			b[0], a[1], -slice,
			a[0], b[1], -slice,
			a[0], b[1], -slice,
			b[0], a[1], -slice,
			b[0], b[1], -slice]), this.gl.STATIC_DRAW);
			
		// текстурые координаты для прямоугольника
		const texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
			[ai[0], bi[1],
			bi[0], bi[1],
			ai[0], ai[1],
			ai[0], ai[1],
			bi[0], bi[1],
			bi[0], ai[1]]), this.gl.DYNAMIC_DRAW);
		if (slice <= 2)
			return {'pos': positionBuffer, 'img': texCoordBuffer, 'mvm': 1};
		if (slice > 900)
			return {'pos': positionBuffer, 'img': texCoordBuffer, 'mvm': 2};
		return {'pos': positionBuffer, 'img': texCoordBuffer, 'mvm': 0};
	}
	render(x, y, height, arrayOfObjects) {
		if (height <= 0) {
			throw new Error("Invalid clip: height <= 0");
		}
		this.resizeCanvas(this.gl.canvas); // подгоняем канвас под экран
		const asp = this.gl.canvas.width / this.gl.canvas.height;
		const left = x - height * asp;
		const right = x + height * asp;
		const bottom = y - height;
		const top = y + height;
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
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); // чистим буфер цвета и буфер глубины
		
		// отрисовка
		arrayOfObjects.forEach((a) => {
			this.gl.enableVertexAttribArray(this.positionAttributeLocation);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a.pos);
			this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
			
			this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a.img);
			this.gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
			
			switch (a.mvm) {
				case 0: this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
					[1,0,0,0,
					0,1,0,0,
					0,0,1,0,
					0,0,0,1]);
					break;
				case 1: this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
					[1,0,0,0,
					0,1,0,0,
					0,0,1,0,
					x,y,0,1]);
					break;
				case 2: this.gl.uniformMatrix4fv(this.modelviewMatrixUniformLocation, false,
					[1,0,0,0,
					0,1,0,0,
					0,0,1,0,
					x/2,y/2,0,1]);
					break;
			}
			console.log(a.mvm);
			
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6); // рисуем треугольники
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