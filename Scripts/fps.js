'use strict';

// Счётчик FPS
let _fpsTime = performance.now();
let _fpsCountner = 0;
let _startFps = _fpsTime;
let _fpsCountnerAVG = 0;
const _classFpsStyle = document.getElementsByClassName('fps')[0].style;

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
		_fpsTime += delta - (delta % 1000);
		_fpsCountner = 0;
	}
	const dpr = 1 / window.devicePixelRatio;
	_classFpsStyle.top = (20 * dpr) + 'px';
	_classFpsStyle.right = (20 * dpr) + 'px';
	_classFpsStyle.fontSize = (20 * dpr) + 'px';
	_classFpsStyle.padding = (10 * dpr) + 'px ' + (17 * dpr) + 'px';
}

requestAnimationFrame(fpsUpdate);
