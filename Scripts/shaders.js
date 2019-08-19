'use strict';

/***********************************************************************************************************************

Что это такое?

Здесь находятся шейдерные программы, которые будут выполняться на графическом ускорителе (GPU), в отличие от всего
остального кода, написанного на JavaScript. Вся прелесть шейдерных программ в том, что графическое ускорители (GPU)
изначально оптимизированы для вычисления сложной математики (в основном линейной алгебры) и могут параллельно вычислять
большое количество подобных данных (при отрисовке). Также, благодаря некоторым аппаратным способам оптимизации,
графической ускоритель может определять какие данные считать не нужно, так как не будут отрисованы (на языке
программирования JavaScript это сделать не менее эффективно невозможно).

Шейдерные программы написаны на языке программирования GLSL (Graphics Library Shader Language)
Используется версия 1.00 (WebGL 1.0 / OpenGL ES 2.0)

VertexShader - это вершинный шейдер, занимается обработкой расположения вершин фигур на экране/буфере кадров
Поподробнее об вершинных шейдерах можно почитать на официальном сайте спецификации:
https://www.khronos.org/opengl/wiki/Vertex_Shader

FragmentShader - это фрагментный шейдер, занимается обработкой цвета каждого видимого пикселя
Поподробнее об фрагментных шейдерах можно почитать на официальном сайте спецификации:
https://www.khronos.org/opengl/wiki/Fragment_Shader

***********************************************************************************************************************/

const _vertexShader = [];
const _fragmentShader = [];

// шейдеры для чанков, фона, буферов
_vertexShader[0] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;

	uniform vec3 u_translate;
	uniform mat4 u_projectionMatrix;
	uniform float u_resolution;

	varying vec2 v_texCoord;

	void main() {
		v_texCoord = a_texCoord;
		vec4 pos = vec4(u_translate + vec3(a_position / u_resolution, 0.0), 1.0);
		gl_Position = u_projectionMatrix * pos;
	}`;

_fragmentShader[0] = `
	precision mediump float;

	uniform sampler2D u_texture;
	uniform float u_light;

	varying vec2 v_texCoord;

	void main() {
		vec4 tex = texture2D(u_texture, v_texCoord);
		gl_FragColor = vec4(tex.rgb * u_light, tex.a);
	}`;

// шейдеры для 1 слоя
_vertexShader[1] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;

	uniform vec3 u_translate;
	uniform mat4 u_projectionMatrix;
	uniform float u_resolution;

	varying vec2 v_texCoord;

	void main() {
		v_texCoord = a_texCoord;
		vec4 pos = vec4(u_translate + vec3(a_position / u_resolution, 0.0), 1.0);
		gl_Position = u_projectionMatrix * pos;
	}`;

_fragmentShader[1] = `
	precision mediump float;

	uniform sampler2D u_texture0;
	uniform sampler2D u_texture1;
	uniform sampler2D u_texture2;
	uniform float u_light;
	uniform float u_sizeBlock;
	uniform vec2 u_center;
	uniform float u_radius;
	uniform float u_devicePixelRatio;

	varying vec2 v_texCoord;
	
	void main() {
		float minAlpha = 0.25;
		vec4 tex = texture2D(u_texture0, v_texCoord);
		float tex2alpha = (texture2D(u_texture2, v_texCoord)).a;
		float lightTex = (texture2D(u_texture1, (v_texCoord + 1.0 / u_sizeBlock) * 0.5)).x;
		vec2 delta = u_center - gl_FragCoord.xy;
		float alpha = tex2alpha < 0.01
			? (mod(gl_FragCoord.x + gl_FragCoord.y, 4.0) < 2.0
				? 1.0
				: clamp((sqrt(delta.x * delta.x + delta.y * delta.y) * (1.0 - minAlpha * 0.2)
					* u_devicePixelRatio * u_devicePixelRatio / u_radius + minAlpha * 0.2), minAlpha, 1.0))
			: 1.0;
		vec4 color = vec4(tex.rgb * lightTex * u_light, tex.a * alpha);
		gl_FragColor = color;
	}`;

// шейдеры для 2 и 3 слоя
_vertexShader[2] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;

	uniform vec3 u_translate;
	uniform mat4 u_projectionMatrix;
	uniform float u_resolution;

	varying vec2 v_texCoord;

	void main() {
		v_texCoord = a_texCoord;
		vec4 pos = vec4(u_translate + vec3(a_position / u_resolution, 0.0), 1.0);
		gl_Position = u_projectionMatrix * pos;
	}`;

_fragmentShader[2] = `
	precision mediump float;

	uniform sampler2D u_texture0;
	uniform sampler2D u_texture1;
	uniform float u_light;
	uniform float u_sizeBlock;
	uniform vec4 u_dynamicLight;

	varying vec2 v_texCoord;

	void main() {
		vec4 tex = texture2D(u_texture0, v_texCoord);
		float lightTex = (texture2D(u_texture1, (v_texCoord + 1.0 / u_sizeBlock) * 0.5)).x;
		float radius = u_dynamicLight.p;
		float maxLight = u_dynamicLight.a;
		vec2 delta = u_dynamicLight.xy - gl_FragCoord.xy;
		float light = clamp(maxLight - sqrt(delta.x * delta.x + delta.y * delta.y) * maxLight / radius, 0.0, maxLight);
		vec4 color = vec4(tex.rgb * max(lightTex, light) * u_light, tex.a);
		gl_FragColor = color;
	}`;

// шейдеры для игрока и блоков
_vertexShader[3] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;
	
	uniform vec2 u_rotation;
	
	varying vec2 v_texCoord;
	
	void main() {
		v_texCoord = a_texCoord;
		vec2 rotatedPosition = vec2(
			a_position.x * u_rotation.y + a_position.y * u_rotation.x,
			a_position.y * u_rotation.y - a_position.x * u_rotation.x);
		vec4 pos = vec4(rotatedPosition * 2.0 - 1.0, 0.0, 1.0);
		gl_Position = pos;
	}`;

_fragmentShader[3] = `
	precision mediump float;

	uniform sampler2D u_texture;
	
	varying vec2 v_texCoord;

	void main() {
		vec4 tex = texture2D(u_texture, v_texCoord);
		gl_FragColor = tex;
	}`;

// шейдеры для индикаторов
_vertexShader[4] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;
	
	varying vec2 v_texCoord;
	
	void main() {
		v_texCoord = a_texCoord;
		vec4 pos = vec4(a_position * 2.0 - 1.0, 0.0, 1.0);
		gl_Position = pos;
	}`;

_fragmentShader[4] = `
	precision mediump float;

	uniform sampler2D u_texture0;
	uniform sampler2D u_texture1;
	uniform vec2 u_progress;
	
	varying vec2 v_texCoord;
	
	void main() {
		vec4 tex = gl_FragCoord.x <= u_progress.x && gl_FragCoord.y <= u_progress.y
			? texture2D(u_texture0, v_texCoord) : texture2D(u_texture1, v_texCoord);
		gl_FragColor = tex;
	}`;

// шейдеры для дождя
_vertexShader[5] = `
	attribute float a_id;
	
	uniform vec2 u_translate;
	uniform vec2 u_resolution;
	uniform float u_number;
	uniform float u_time;
	uniform float u_pos;
	uniform float u_devicePixelRatio;
	uniform float u_move;
	
	float hash(float i) {
		vec2 p = fract(vec2(i * 5.3983, i * 5.4427));
		p += dot(p.yx, p.xy + vec2(21.5351, 14.3137));
		return fract(p.x * p.y * 95.4337);
	}
	
	void main() {
		float delta = (a_id * u_pos) / u_number;
		float offset = floor(u_time + delta) * 0.001;
		float t = u_time * u_resolution.y * 31.25 + hash(delta) + u_move * u_resolution.y * 1.15;
		float x = (hash(delta / floor(t)) * u_resolution.x + u_translate.x) * 2.0;
		float y = fract(t) * -2.0 + 1.0;
		if (y >= u_translate.y) {
			gl_Position = vec4(x, y, 0.0, 1.0);
			gl_PointSize = 2.0 / u_devicePixelRatio;
		} else if (u_translate.y - y < u_resolution.y * 4.0) {
			gl_Position = vec4(x, u_translate.y, 0.0, 1.0);
			gl_PointSize = 2.0 / u_devicePixelRatio;
		}
	}`;

_fragmentShader[5] = `
	precision lowp float;
	
	void main() {
		gl_FragColor = vec4(0.0, 0.0, 1.0, 0.9);
	}`;
