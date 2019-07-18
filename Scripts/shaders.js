'use strict';

const _vertexShader =
	`attribute vec2 a_position;
	attribute vec2 a_texCoord;

	uniform vec3 u_translate;
	uniform mat4 u_projectionMatrix;
	uniform float u_resolution;
	uniform float u_light;

	varying vec2 v_texCoord;
	varying float v_light;

	void main() {
		v_texCoord = a_texCoord;
		v_light = u_light;
		vec4 pos = vec4(u_translate + vec3(a_position / u_resolution, 0.0), 1.0);
		gl_Position = u_projectionMatrix * pos;
	}`;

const _fragmentShader =
	`precision mediump float;

	uniform sampler2D u_texture;

	varying vec2 v_texCoord;
	varying float v_light;

	void main() {
		vec4 tex = texture2D(u_texture, v_texCoord);
		gl_FragColor = vec4(tex.rgb * v_light, tex.a);
	}`;
