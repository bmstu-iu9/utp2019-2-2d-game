'use strict';

let _fpsTime = performance.now();
let _fpsCountner = 0;
let _startFps = _fpsTime;
let _fpsCountnerAVG = 0;

const fpsUpdate = () => {
	const nowtime = performance.now();
	const delta = nowtime - _fpsTime;
	const deltaAvg = nowtime - _startFps;
	_fpsCountnerAVG++;
	if (delta < 1000) {
		_fpsCountner++;
	} else {
		document.getElementById('fps').innerHTML = '';
		if (_fpsCountner < 100) {
			document.getElementById('fps').innerHTML = ' ';
			if (_fpsCountner < 10) {
				document.getElementById('fps').innerHTML += ' ';
			}
		}
		document.getElementById('fps').innerHTML += _fpsCountner + ' FPS | ';
		const AVG = Math.floor(_fpsCountnerAVG / deltaAvg * 1000);
		if (AVG < 100) {
			document.getElementById('fps').innerHTML += ' ';
			if (AVG < 10) {
				document.getElementById('fps').innerHTML += ' ';
			}
		}
		document.getElementById('fps').innerHTML += AVG + ' AVG';
		document.getElementById('fps').innerHTML += ` x:${player.x} y:${player.y}`;
		_fpsTime += 1000;
		_fpsCountner = 0;
	}
}
