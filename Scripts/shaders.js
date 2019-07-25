'use strict';

let _vertexShader = [];
let _fragmentShader = [];

// Шейдеры написаны на языке программирования GLSL (Graphics Library Shader Language)
// VertexShader - вершинный шейдер, занимается обработкой расположения вершин фигур на экране/буфере кадров
// FragmentShader - фрагментный шейдер, занимается обработкой цвета каждого пикселя

// шейдеры для блоков, игрока, фона
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

	varying vec2 v_texCoord;
	
	void main() {
		float radius = 250.0;
		float minAlpha = 0.2;
		vec4 tex = texture2D(u_texture0, v_texCoord);
		float tex2alpha = (texture2D(u_texture2, v_texCoord)).a;
		float lightTex = (texture2D(u_texture1, (v_texCoord + 1.0 / (u_sizeBlock + 2.0)) / 2.0)).x;
		vec2 delta = u_center - gl_FragCoord.xy;
		float alpha = tex2alpha <= 0.01
			? (mod(gl_FragCoord.x + gl_FragCoord.y, 4.0) < 2.0
				? 1.0
				: clamp(sqrt(delta.x * delta.x + delta.y * delta.y) * (1.0 - minAlpha / 5.0) / radius + minAlpha / 5.0,
					minAlpha, 1.0))
			: 1.0;
		gl_FragColor = vec4(tex.rgb * lightTex * u_light, tex.a * alpha);
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
		float lightTex = (texture2D(u_texture1, (v_texCoord + 1.0 / (u_sizeBlock + 2.0)) / 2.0)).x;
		float radius = u_dynamicLight.p;
		float maxLight = u_dynamicLight.a;
		vec2 delta = u_dynamicLight.xy - gl_FragCoord.xy;
		float light = clamp(maxLight - sqrt(delta.x * delta.x + delta.y * delta.y) * maxLight / radius, 0.0, maxLight);
		gl_FragColor = vec4(tex.rgb * max(lightTex, light) * u_light, tex.a);
	}`;
