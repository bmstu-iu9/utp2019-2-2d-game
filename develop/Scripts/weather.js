'use strict';

let _elevationMap = [];

const elevationCalculate = () => {
	for (let i = 0; i < gameArea.width; i++) {
		for (let j = gameArea.height - 1; j >= 0; j--) {
			if (gameArea.get(i, j, GameArea.FIRST_LAYOUT) !== undefined) {
				_elevationMap[i] = j;
				break;
			}
		}
	}
}

const elevationUpdate = (x, y) => {
	if (y >= _elevationMap[x]) {
		for (let j = y; j >= 0; j--) {
			if (gameArea.get(x, j, GameArea.FIRST_LAYOUT) !== undefined) {
				_elevationMap[x] = j;
				break;
			}
		}
	}
}

const initRain = () => {
	render.elevationMap = _elevationMap;
	setTimeout(startRain, 30000 + 10000 * Math.random);
}

const startRain = () => {
	render.rain = true;
	setTimeout(stopRain, 30000 + 10000 * Math.random());
}

const stopRain = () => {
	render.rain = false;
	setTimeout(startRain, 60000 + 60000 * Math.random());
}
