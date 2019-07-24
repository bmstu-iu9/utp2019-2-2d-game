'use strict';

let _vertexShader = [];
let _fragmentShader = [];

// Шейдеры написаны на языке программирования GLSL (Graphics Library Shader Language)
// VertexShader - вершинный шейдер, занимается обработкой расположения вершин фигур на экране/буфере кадров
// FragmentShader - фрагментный шейдер, занимается обработкой цвета каждого пикселя

//u_light
_vertexShader[0] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;

	uniform vec3 u_translate;
	uniform mat4 u_projectionMatrix;
	uniform float u_resolution;
	uniform float u_light;

	varying vec2 v_texCoord;

	void main() {
		v_texCoord = a_texCoord;
		vec4 pos = vec4(u_translate + vec3(a_position / u_resolution, 0.0), 1.0);
		gl_Position = u_projectionMatrix * pos;
	}`;

_fragmentShader[0] = `
	precision mediump float;

	uniform sampler2D u_texture;

	varying vec2 v_texCoord;

	void main() {
		vec4 tex = texture2D(u_texture, v_texCoord);
		gl_FragColor = vec4(tex.rgb, tex.a);
	}`;

_vertexShader[1] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;

	uniform vec3 u_translate;
	uniform mat4 u_projectionMatrix;
	uniform float u_resolution;
	uniform float u_light;
	uniform vec2 u_center;

	varying vec2 v_texCoord;
	varying float v_light;
	varying vec2 v_center;

	void main() {
		v_texCoord = a_texCoord;
		v_light = u_light;
		v_center = u_center;
		vec4 pos = vec4(u_translate + vec3(a_position / u_resolution, 0.0), 1.0);
		gl_Position = u_projectionMatrix * pos;
	}`;

_fragmentShader[1] = `
	precision mediump float;

	uniform sampler2D u_texture0;
	uniform sampler2D u_texture1;

	varying vec2 v_texCoord;
	varying float v_light;
	varying vec2 v_center;

	void main() {
		float radius = 250.0;
		float minAlpha = 0.2;
		vec4 tex = texture2D(u_texture0, v_texCoord);
		vec4 lightTex = texture2D(u_texture1, vec2(v_texCoord.x / 2.0 + 1.0 / 36.0, v_texCoord.y / 2.0 + 1.0 / 36.0));
		vec2 delta = v_center - gl_FragCoord.xy;
		float alpha = clamp(sqrt(delta.x * delta.x + delta.y * delta.y) * (1.0 - minAlpha) / radius + minAlpha,
			minAlpha, 1.0);
		gl_FragColor = vec4(tex.rgb * lightTex.x, tex.a * alpha);
	}`;

_vertexShader[2] = `
	attribute vec2 a_position;
	attribute vec2 a_texCoord;

	uniform vec3 u_translate;
	uniform mat4 u_projectionMatrix;
	uniform float u_resolution;
	uniform float u_light;
	uniform vec4 u_dynamicLight;

	varying vec2 v_texCoord;
	varying float v_light;
	varying vec4 v_dynamicLight;

	void main() {
		v_texCoord = a_texCoord;
		v_light = u_light;
		v_dynamicLight = u_dynamicLight;
		vec4 pos = vec4(u_translate + vec3(a_position / u_resolution, 0.0), 1.0);
		gl_Position = u_projectionMatrix * pos;
	}`;

_fragmentShader[2] = `
	precision mediump float;

	uniform sampler2D u_texture0;
	uniform sampler2D u_texture1;

	varying vec2 v_texCoord;
	varying float v_light;
	varying vec4 v_dynamicLight;

	void main() {
		vec4 tex = texture2D(u_texture0, v_texCoord);
		vec4 lightTex = texture2D(u_texture1, vec2(v_texCoord.x / 2.0 + 1.0 / 36.0, v_texCoord.y / 2.0 + 1.0 / 36.0));
		float radius = v_dynamicLight.p;
		float maxLight = v_dynamicLight.a;
		vec2 delta = v_dynamicLight.xy - gl_FragCoord.xy;
		float light = clamp(maxLight - sqrt(delta.x * delta.x + delta.y * delta.y) / radius, 0.0, maxLight);
		gl_FragColor = vec4(tex.rgb * max(lightTex.x, light) * v_light, tex.a);
	}`;
