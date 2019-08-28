'use strict';

/*============================================Описание свойств блока===================================================
 id - его id в таблице items, а также представление в map
 type - тип блока, определяется на основе того, чем "добывается" блок с точки зрения логики:
						dirt		 - земля, добывается лопатой
						stone		- камень, добывается киркой
						wood		 - дерево, добывается топором
						leaf		 - листва, добывается ножницами
						water		- блоки стоячей жидкости
 durability  : Время ломания блока рукой в секундах
 brightness  : Светимость блока от 0 до 9
 isCollissed : Можно ли проходить сквозь этот блок, true/false
 isSolid	 : Является ли данный блок твердым, то есть можно ли на его место ставить другие блоки
 isClickable : Можно ли нажать на блок
 hasGravity  : Подвержен ли этот блок гравитации, т.е падает ли вниз без опоры, true/false
 name		: имя блока
=======================================================================================================================
*/

// Игровое пространство
class GameArea{
	constructor(map, elevationMap, shadowMap, width, height, chestsInvs) {
		// map  - двумерная карта, состоящая из id блоков
		this.map = map;
		this.elevationMap = elevationMap;
		this.shadowMap = shadowMap;
		this.timeOfDay = 1; //От 0 до 1, где 1 - полдень, 0 - полночь

		// Ассоциативный массив inventoryBlocks[[x, y, layout]] -> [ ] инвентарь блока
		this.inventoryBlocks = chestsInvs; // this.inventoryBlocks = new Map();

		// Ширина и высота игрового пространства
		this.width = width;
		this.height = height;

		// Отслеживание изменений для engine.js
		this.chunkDifferList = {};  // Хранит объекты изменения чанков
		// Размеры чанка для engine.js.
		//TODO: Откорректировать как нужно
		this.chunkHeight = 1;
		this.chunkWidth = 1;
		// Возвращает освещение конкретного блока
		this.getLight = (x, y) => {
			let grad = (y > this.elevationMap[x])
				? 1
				: ((y < 0.9 * this.elevationMap[x])
					? 0.2
					: ((y - 0.9 * this.elevationMap[x]) / (0.1 * this.elevationMap[x]) * 0.8 + 0.2));
			let k = Math.min(1 / 3 + this.timeOfDay * 3 / 2, grad);

			// Берем наибольший свет из естественный и искусственного
			if (this.getArtificalLight(x, y) > this.getNaturalLight(x, y) * k) {
				return this.getArtificalLight(x, y) / 9;
			} else {
				// Естественный свет с шагом в 5 (чтобы не изменялся каждый кадр)
				return roundTo(k * this.getNaturalLight(x, y), 5) / 9;
			}
		}

		// Естественный свет в точке (без времени суток и высоты)
		this.getNaturalLight = (x, y) => {
			if (shadowMap === undefined || shadowMap[x] === undefined || shadowMap[x][y] === undefined) {
				return undefined;
			}
			return shadowMap[x][y] % 1000;
		}

		// Искусственный свет в точке
		this.getArtificalLight = (x, y) => {
			if (shadowMap === undefined || shadowMap[x] === undefined || shadowMap[x][y] === undefined) {
				return undefined;
			}
			return Math.floor(shadowMap[x][y] / 1000);
		}

		// Добавление источника света
		this.addLightRound = (startX, startY, x, y, n, isNatural, isForce) => {
			const step = (nextX, nextY, n) => {
				if (n > 0 && vectorLengthSqr(x, y, startX, startY) < vectorLengthSqr(startX, startY, nextX, nextY)
						&& inRange(nextX, 0, width) && inRange(nextY, 0, height)
						&& (shadowMap[nextX][nextY] === undefined
							|| (isNatural && this.getNaturalLight(nextX, nextY) < n)
							|| (!isNatural && this.getArtificalLight(nextX, nextY) < n))) {

					this.addLightRound(startX, startY, nextX, nextY, n, isNatural, isForce);
				}
			};
			if (n > 0 && (isForce || (shadowMap[x][y] === undefined
					|| (isNatural && this.getNaturalLight(x, y) < n)
					|| (!isNatural && this.getArtificalLight(x, y) < n)))) {

				if (isNatural) {
					if (shadowMap[x][y] === undefined) {
						this.gameAreaShadowMapSet(x, y, n);
					} else {
						this.gameAreaShadowMapSet(x, y, this.getArtificalLight(x, y) * 1000 + n);
					}
				} else {
					if (shadowMap[x][y] === undefined) {
						this.gameAreaShadowMapSet(x, y, n * 1000)
					} else {
						this.gameAreaShadowMapSet(x, y, n * 1000 + this.getNaturalLight(x, y));
					}
				}
				step(x + 1, y, n - 1);
				step(x - 1, y, n - 1);
				step(x, y + 1, n - 1);
				step(x, y - 1, n - 1);
			}
		}

		// Удаление источника света
		this.deleteLightRound = (startX, startY, x, y, n, isNatural) => {
			let lights = [];

			const deleteLightNoUpdateRound = (startX, startY, x, y, n, isNatural) => {
				const step = (nextX, nextY, n) => {
					if (n > 0 && vectorLengthSqr(x, y, startX, startY) < vectorLengthSqr(startX, startY, nextX, nextY)
							&& inRange(nextX, 0, width) && inRange(nextY, 0, height)) {

						if (isNatural && this.getNaturalLight(nextX, nextY) > n) {
							lights.push([nextX, nextY, this.getNaturalLight(nextX, nextY), isNatural]);
							return;
						} else if (!isNatural && this.getArtificalLight(nextX, nextY) > n) {
							lights.push([nextX, nextY, this.getArtificalLight(nextX, nextY), isNatural]);
							return;
						}
						deleteLightNoUpdateRound(startX, startY, nextX, nextY, n, isNatural);
					}
				}
				if (n > 0
					&& ((isNatural && this.getNaturalLight(x, y) === n)
						|| (!isNatural && this.getArtificalLight(x, y) === n))) {

					if (isNatural) {
						this.gameAreaShadowMapSet(x, y, this.getArtificalLight(x, y) * 1000);
					} else {
						this.gameAreaShadowMapSet(x, y, this.getNaturalLight(x, y));
					}
					step(x + 1, y, n - 1);
					step(x - 1, y, n - 1);
					step(x, y + 1, n - 1);
					step(x, y - 1, n - 1);
				}
			};
			deleteLightNoUpdateRound(startX, startY, x, y, n, isNatural);
			for (let i = 0; i < lights.length; i++) {
				this.addLightRound(lights[i][0], lights[i][1], lights[i][0], lights[i][1], lights[i][2], lights[i][3],
					true);
			}
		}

		// Добавить предмет в инвентарь блока [x, y, layout]
		this.addToInvBlock = (x, y, layout, item) => {
			let inv = this.inventoryBlocks[ [x, y, layout] ];

			// Вставляем предмет в инвентарь, если он стакается
			if (item.count != undefined) {

				// Если даже 1 не влезет
				if (items[item.id].weight + inv[2] > inv[3]) {
					return item;
				}
				needChestRedraw = true;
				for (let i = 0; i < inv[0].length; i++) {
					if (item.id == inv[0][i]) {
						if (items[item.id].weight * item.count + inv[2] <= inv[3]) {
							inv[1][i] += item.count;
							inv[2] += item.count * items[item.id].weight;
							return undefined;
						} else {
							let count = Math.floor((inv[3] - inv[2]) / items[item.id].weight);
							inv[1][i] += count;
							item.count -= count;
							inv[2] += count * items[item.id].weight;
							return item;
						}
					}
				}
				for (let i = 0; i <= inv[0].length; i++) {
					if (inv[0][i] === undefined) {
						inv[0][i] = item.id;
						if (items[item.id].weight * item.count + inv[2] <= inv[3]) {
							inv[1][i] = item.count;
							inv[2] += item.count * items[item.id].weight;
							return undefined;
						} else {
							let count = Math.floor((inv[3] - inv[2]) / items[item.id].weight);
							inv[1][i] = count;
							item.count -= count;
							inv[2] += count * items[item.id].weight;
							return item;
						}
					}
				}
			} else { //.................................................................... Не стакается
				if (items[item.id].weight + inv[2] <= inv[3]) {
					for (let i = 0; i <= inv[0].length; i++) {
						if (inv[0][i] == undefined) {
							inv[0][i] = item;
							inv[1][i] = undefined;
							inv[2] += items[item.id].weight;
							return undefined;
						}
					}
				} else {
					return item;
				}
			}
		}

		// Удалить count предметов в инвентаре блока [x, y, layout] по индексу index
		this.deleteFromInvBlockByIndex = (x, y, layout, index, count) => {
			let inv = this.inventoryBlocks[ [x, y, layout] ];
			let drop;
			if (inv[0][index] == undefined || inv[1][index] < count
					|| inv[1][index] == undefined && count > 1) {
				throw new Error(`Can not delete ${count} item(s) on index ${index}`);
			} else {
				drop = inv[0][index].id ? inv[0][index] : {
					"id" : inv[0][index],
					"count" : count
				}
				if (inv[1][index] == undefined || inv[1][index] == count) {
					if (inv[1][index] == undefined) {
						inv[2] -= items[inv[0][index].id].weight * count;
					} else {
						inv[2] -= items[inv[0][index]].weight * count;
					}
					inv[0][index] = undefined;
					inv[1][index] = undefined;
				} else {
					inv[2] -= items[inv[0][index]].weight * count;
					if (!inv[1]) {
						inv[1] = 0;
					}
					inv[1][index] -= count;
				}
			}
			return drop;
		}

		// Делает блок воздуха = undefined
		this.makeAirBlock = () => {
			return undefined;
		};

		// Cтоячая вода - блок с гравитацией
		this.makeWaterBlock = () => {
			return 8; //id стоячей воды
		};

		this.makeFlowingWaterBlock = (cnt) => {
			// Текучая вода - блок без гравитации
			return cnt;
		};

		this.makeFlowingLavaBlock = (cnt) => {
			// Текучая лава - блок без гравитации
			return cnt;
		};

		// Есть ли коллизия с этим блоком
		this.hasCollision = (x, y, layout) => {
			if (x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
			let block = this.map[x][y][layout];

			// Если это не блок воздуха и если он имеет коллизию или не найден в таблице => есть коллизия
			if (block != undefined && (items[block] === undefined || items[block].isCollissed)) {
				return true;
			}
			return false;
		};

		this.updateBlock = (x, y, layout, player) => {
			if (x < 0 || x >= this.width
				|| y < 0 || y >= this.height
				|| this.map[x][y][layout] === undefined
				|| items[this.map[x][y][layout]] === undefined) {
					return;
				}
			const block = items[this.map[x][y][layout]];

			if (block.hasGravity) {
				// Если нет блока с коллизией снизу
				if ((y - 1) >= 0 && (this.map[x][y - 1][layout] === undefined
					|| !items[this.map[x][y - 1][layout]].isCollissed)) {
					const lastId = this.map[x][y][layout];
					setTimeout(() => {
						const id = this.map[x][y][layout];
						if (id !== lastId) {
							return;
						}
						this.destroyBlock(x, y, layout, player);
						this.placeBlock(x, y - 1, layout, id);
					}, GameArea.FALLING_BLOCKS * 1000);
				}
			}

			if (block.update !== undefined) {
				block.update(x, y, layout);
			}
		}

		// Обновление окружения блока
		this.updateRadius = (x, y, layout, player) => {
			for (let i = x - 1; i <= x + 1; i++) {
				for (let j = y - 1; j <= y + 1; j++) {
					if (i !== x || y !== j) {
						this.updateBlock(i, j, layout, player);
						if (layout === GameArea.FIRST_LAYOUT) {
							this.updateBlock(i, j, GameArea.SECOND_LAYOUT, player);
						}
					}
				}
			}
		}

		// Действие при разрушении блока
		this.destroyBlock = (x, y, layout, player, reason) => {
			if (!this.exist(x, y)) return; // проверка на выход из карты
			let lastBlock = this.map[x][y][layout];
			this.gameAreaMapSet(x, y, layout, this.makeAirBlock());
			if (lastBlock !== undefined && layout === GameArea.FIRST_LAYOUT) {
				this.deleteLightRound(x, y, x, y, items[lastBlock].brightness,
					items[lastBlock].isNaturalLight === true);
				this.addLightRound(x, y, x, y, 9, true, false);
			}
			if (items[lastBlock].destroyFunction) {
				items[lastBlock].destroyFunction(x, y, layout, reason);
			}
			this.updateRadius(x, y, layout, player);
		}

		// К этому блоку можно приставлять другие
		this.canAttach = (x, y, layout) => {
			return this.exist(x, y)
					&& this.map[x][y][layout] !== undefined
					&& items[this.map[x][y][layout]].type !== "water"
					&& items[this.map[x][y][layout]].isCollissed;
		}

		//  Замещая этот блок можно поставить другой блок
		this.canPlaceInBlock = (x, y, layout) => {
			return this.exist(x, y)
					&& (this.map[x][y][layout] === undefined
						|| items[this.map[x][y][layout]].type === "water"
						|| items[this.map[x][y][layout]].type === "flowingWater"
						|| items[this.map[x][y][layout]].type === "lava"
						|| items[this.map[x][y][layout]].type === "flowingLava"
						|| items[this.map[x][y][layout]].type === "fire"); 
		}

		// Можно ставить блок на (x, y, layout)
		this.canPlace = (x, y, layout, checkFunc, ignorePlayerField) => {
			let startX = Math.floor(player.x - Player.WIDTH / 2);
			let endX = Math.floor(player.x + Player.WIDTH / 2);
			let startY = Math.floor(player.y);
			let endY = Math.floor(player.y + Player.HEIGHT);
			return this.canPlaceInBlock(x, y, layout)
					&& (player.layout !== layout
						|| ignorePlayerField
						|| !(x >= startX && x <= endX && y >= startY && y <= endY)) // Площадь игрока
					&& (checkFunc && checkFunc(x, y, layout)
						|| !checkFunc
							&& (this.canAttach(x + 1, y, layout)
								|| this.canAttach(x - 1, y, layout)
								|| this.canAttach(x, y + 1, layout)
								|| this.canAttach(x, y - 1, layout)));
		}

		// Можно ли ломать блок на (x, y, layout)
		this.canDestroy = (x, y, layout) => {
			// Если задний слой, то можно ломать только с краёв
			return !this.canPlaceInBlock(x, y, layout)
				&& (layout === GameArea.BACK_LAYOUT 
						&& (!this.canAttach(x + 1, y, layout)
							|| !this.canAttach(x - 1, y, layout)
							|| !this.canAttach(x, y + 1, layout)
							|| !this.canAttach(x, y - 1, layout))
					|| layout !== GameArea.BACK_LAYOUT);
		}

		// Действие при установке блока
		this.placeBlock = (x, y, layout, id) => {
			if(!this.exist(x, y)) return false; // проверка на выход из карты
			if(!this.map[x][y][layout] || this.canPlaceInBlock(x, y, layout)) {
				let lastBlock = this.map[x][y][layout];
				this.gameAreaMapSet(x, y, layout, id);
				if (layout === GameArea.FIRST_LAYOUT) {
					if (lastBlock == undefined) {
						this.deleteLightRound(x, y, x, y, 9, true);
					} else {
						this.deleteLightRound(x, y, x, y, items[lastBlock].brightness,
							items[lastBlock].isNaturalLight === true);
					}
					this.addLightRound(x, y, x, y, items[id].brightness, items[id].isNaturalLight === true, false);
				}
				this.updateRadius(x, y, layout);
				this.updateBlock(x, y, layout);

				return true;
			}
			return false;
		}

		// Функция взаимодействия с блоком
		this.interactWithBlock = (x, y, layout) => {
			if(!this.exist(x, y)) return; // проверка на выход из карты
			let block = items[this.map[x][y][layout]];
			if(block.isClickable) {
				block.interactFunction(x, y, layout);
				return true;
			}
			return false;
		}

		// Функция сброса лута
		this.dropLoot = (x, y, block) => {
			// Оставил x, y - в будующем лут будет падать там, где разрушен блок, пока падает в инвентарь
			return createItem(items[block.id].dropId ? items[block.id].dropId : block.id, 1);
		}

		// Функция разрушения блока со сбросом лута
		this.goodDestroy = (x, y, layout, player) => {
			let block = items[this.map[x][y][layout]];
			if (player) {
				this.destroyBlock(x, y, layout, player);
				player.addToInv(this.dropLoot(x, y, block));
			} else this.destroyBlock(x, y, layout, player);
		}

		// Находится ли точка в мире
		this.exist = (x, y) => {
			return inRange(x, 0, this.width) && inRange(y, 0, this.height);
		}

		// Получить id блока если он внутри границ мира
		this.get = (x, y, layout) => {
			if (this.exist(x, y)) {
				return gameArea.map[x][y][layout];
			} else {
				return undefined;
			}
		}

		// Необходим для отслеживания изменений
		this.gameAreaMapSet = (x, y, layout, id) => {
			let chunkX = Math.floor(x / chunkHeight), chunkY = Math.floor(y / chunkHeight);
			if(this.chunkDifferList[chunkX + "x" + chunkY] === undefined) {
				this.chunkDifferList[chunkX + "x" + chunkY] = {};
				this.chunkDifferList[chunkX + "x" + chunkY][x + "x" + y + "x" + layout] = {
					x: x,
					y: y,
					layout: layout,
					newValue: id
				}
			} else {
				this.chunkDifferList[chunkX + "x" + chunkY][x + "x" + y + "x" + layout] = {
					x: x,
					y: y,
					layout: layout,
					newValue: id
				}
			}

			this.map[x][y][layout] = id;
			if (items[id].isInventoryBlock) {
				this.inventoryBlocks[[x, y, layout]] = [ [], [], 0, items[id].capacity ];
			} else {
				this.inventoryBlocks[[x, y, layout]] = undefined;
			}
			
			// обновляем карту высот для погоды
			if (layout == GameArea.FIRST_LAYOUT) {
				elevationUpdate(x, y);
			}
		}

		// Отслеживание изменений света
		this.gameAreaShadowMapSet = (x, y, n) => {
			let chunkX = Math.floor(x / chunkHeight), chunkY = Math.floor(y / chunkHeight);
			if(this.chunkDifferList[chunkX + "x" + chunkY] === undefined) {
				this.chunkDifferList[chunkX + "x" + chunkY] = {};
				this.chunkDifferList[chunkX + "x" + chunkY][x + "x" + y + "x" + "L"] = true;
			}

			this.shadowMap[x][y] = n;
		}
	}
}

// Вспомогательные функции
// Квадрат расстояния между точками
const vectorLengthSqr = (x, y, x1, y1) => {
	return (x1 - x) * (x1 - x) + (y1 - y) * (y1 - y);
}

const inRange = (n, start, length) => {
	return n >= start && n < length + start;
}

const between = (n, a, b) => {
	return n > Math.min(a, b) && n < Math.max(a, b);
}

const hypotenuse = (x, y) => {
	return Math.sqrt(x * x + y * y);
}

// Округление до
const roundToFunc = (x, fraction, roundFunction) => {
	return roundFunction(x * fraction) / fraction;
}

const roundTo = (x, fraction) => {
	return roundToFunc(x, fraction, Math.floor);
}

// Меньший угол
const angleMin = (a1, a2) => {
	if (((Math.PI * 2 - a1) + a2) % (Math.PI * 2) < Math.PI) {
		return a1;
	} else {
		return a2;
	}
}
// Больший угол
const angleMax = (a1, a2) => {
	if (((Math.PI * 2 - a1) + a2) % (Math.PI * 2) > Math.PI) {
		return a1;
	} else {
		return a2;
	}
}

// Для копирования gameArea из indexedDB
const gameAreaCopy = (gameArea, obj) => {
	gameArea.width = obj.width;
	gameArea.height = obj.height;
	gameArea.inventoryBlocks = obj.inventoryBlocks;
}

// Константы уровня
GameArea.FORWARD_LAYOUT = 1;
GameArea.FIRST_LAYOUT = 2;
GameArea.SECOND_LAYOUT = 3;
GameArea.BACK_LAYOUT = 4;

// Константы поведения игрового пространства
GameArea.GRAVITY = 100;			  // Ускорение свободного падения
GameArea.FALLING_BLOCKS = 0.1;	   // Время падения блока на 1 блок вниз
