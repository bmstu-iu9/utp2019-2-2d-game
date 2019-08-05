'use strict';

let _fpsTime = performance.now();
let _fpsCountner = 0;
let _startFps = _fpsTime;
let _fpsCountnerAVG = 0;

const fpsUpdate = () => {
	const nowTime = performance.now();
	const delta = nowTime - _fpsTime;
	_fpsCountnerAVG++;
	if (delta < 1000) {
		_fpsCountner++;
	} else {
		const deltaAvg = nowTime - _startFps;
		let text = '';
		if (_fpsCountner < 100) {
			text = ' ';
			if (_fpsCountner < 10) {
				text += ' ';
			}
		}
		document.getElementById('fps').innerHTML = text + _fpsCountner;
		text = '';
		const AVG = Math.floor(_fpsCountnerAVG / deltaAvg * 1000);
		if (AVG < 100) {
			text = ' ';
			if (AVG < 10) {
				text += ' ';
			}
		}
		document.getElementById('avg').innerHTML = text + AVG;
		document.getElementById('fps').innerHTML += ` x:${player.x} y:${player.y}`;
		_fpsTime += delta - (delta % 1000);
		_fpsCountner = 0;
	}
}
