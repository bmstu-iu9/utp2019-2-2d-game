<!DOCTYPE html>
<head>
	<link rel="stylesheet" href="style.css">
<body>
	<canvas id="canvas"></canvas>
	<!-- GLSL -- Тут ничего не трограть, либо писать Надиму! -->
	<script id="vertex-shader" type="none">
		precision highp float;
		
		attribute vec3 a_position;
		attribute vec2 a_texCoord;
		
		uniform mat4 u_modelviewMatrix;
		uniform mat4 u_projectionMatrix;
		
		varying vec2 u_texCoord;

		void main() {
			u_texCoord = a_texCoord;
			vec4 pos = u_modelviewMatrix * vec4(a_position, 1.0);
			gl_Position = u_projectionMatrix * pos;
		}
	</script>
	<script id="fragment-shader" type="none">
		precision highp float;
		
		uniform sampler2D u_texture;
		
		varying vec2 u_texCoord;
		
		void main() {
			gl_FragColor = texture2D(u_texture, u_texCoord); 
		}
	</script>
	<!-- JavaScript -- Сюда писать ваши скрипты -->
	<script src="engine.js"></script>
</body>