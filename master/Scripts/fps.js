'use strict';

let _fps_time = performance.now() || Date.now(), _fps_countner = 0;

const fpsUpdate = () => {
	const nowtime = performance.now() || Date.now();
	const delta = nowtime - _fps_time;
	if (delta < 1000) {
		_fps_countner++;
	} else {
		if (_fps_countner < 100) {
			document.getElementById('fps').innerHTML = ' ';
			if (_fps_countner < 10) {
				document.getElementById('fps').innerHTML += ' ';
			}
		}
		document.getElementById('fps').innerHTML += _fps_countner + ' FPS';
		_fps_time = nowtime;
		_fps_countner = 0;
	}
}