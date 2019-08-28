'use strict';

const _lightChance = 0.0005; // шанс вспышки молнии во время дождя для каждого кадра
const _elevationMap = [];

// подсчёт карты высот для всего мира
const elevationCalculate = () => {
	for (let i = 0; i < gameArea.width; i++) {
		for (let j = gameArea.height - 1; j >= 0; j--) {
			const id = gameArea.get(i, j, GameArea.FIRST_LAYOUT);
			if (id !== undefined) {
				_elevationMap[i] = j;
				if (id >= 9000 && id <= 9016) {
					_elevationMap[i] -= Math.abs(9008 - id) * 15 / 128;
				}
				break;
			}
		}
	}
}

// обновление карты высот только при установке/удалении блока
const elevationUpdate = (x, y) => {
	if (y >= _elevationMap[x]) {
		for (let j = y; j >= 0; j--) {
			const id = gameArea.get(i, j, GameArea.FIRST_LAYOUT);
			if (id !== undefined) {
				_elevationMap[i] = j;
				if (id >= 9000 && id <= 9016) {
					_elevationMap[i] -= Math.abs(9008 - id) * 15 / 128;
				}
				break;
			}
		}
	}
}

const initRain = () => {
	render.elevationMap = _elevationMap;
	render.lightChance = _lightChance;
	setTimeout(startRain, 30000 + 10000 * Math.random());
}

const startRain = () => {
	render.startRain();
	setTimeout(stopRain, 30000 + 10000 * Math.random());
}

const stopRain = () => {
	render.stopRain();
	setTimeout(startRain, 60000 + 60000 * Math.random());
}
