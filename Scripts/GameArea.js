'use strict';

//============================================Описание свойств блока========================================================================
// Cами блоки со свойствами лежат в файле block_table.json
		// id - его id в таблице block_table, а также представление в map
		/* type - тип блока, определяется на основе того, чем "добывается" блок с точки зрения логики:
								dirt         - земля, добывается лопатой
								stone        - камень, добывается киркой
								wood         - дерево, добывается топором
								leaf         - листва, добывается ножницами
								water        - блоки стоячей жидкости
								flowingWater - блоки текучей жидкости
								backgr       - блоки фона, стоят на отдельном фоновом слое, добываются (?) молотом (если смотреть на ту же
								               Террарию)
								foregr       - блоки переднего плана, добываются тоже (?) молотом */
		// durability  : Прочность блока : от 1 до 100
		// brightness  : Светимость блока : от 0 до 100
		// isCollissed : Можно ли проходить сквозь этот блок, true/false
		// isPlatform  : Является ли блок платформой - можно ли спрыгнуть с него клавишей  вниз - как в платформере
		// isClickable : Можно ли нажать на блок
		// hasGravity  : Подвержен ли этот блок гравитации, т.е падает ли вниз без опоры, true/false
        // name        : имя блока
//===========================================================================================================================================
// Игровое пространство
class GameArea{
	constructor(map, width, height, path){
		// map  - двумерная карта, состоящая из id блоков
        // path - путь к таблице с блоками в формате json
		if (path === undefined) path = './block_table.json';
		this.map = map;
		//block_table - ассоциативный массив, сопоставляющий конкретное id его описанию 
		//this.block_table = require(path);
		// Ширина и высота игрового пространства
		this.width = width;
		this.height = height;
		// Проверка окружения блока, при наличии у него особого поведения. Особое поведение определеяется по типу
		this.makeAirBlock = () => {
			// Делает блок воздуха = undefined
			return undefined;
		};

		this.makeWaterBlock = () => {
			// Cтоячая вода - блок с гравитацией
			return 8; //id стоячей воды
		};

		this.makeFlowingWaterBlock = (cnt) => {
			// Текучая вода - блок без гравитации
            // В зависимости от степени наполненности имеет id от 9 до 15, 9 - наибольшая наполненность
            if (cnt > 15 || cnt < 9) {
                console.log("Invalid ID was received while generating flowing water block : {$cnt}." +
                    " Valid id : from 9 to 15. Undefined returned");
                return undefined;
            }
			return cnt; //id текучей воды : от 9 до 15 включительно
		};

		this.updateBlock = (x, y, layout) => {
			let block = this.block_table[this.map[x][y][layout]];
			if (block === undefined) return;
			if (block.hasGravity) {
				// Если нет блока снизу
				if (this.block_table[this.map[x][y - 1][layout]].type === undefined) {
					let block_id = this.map[[x, y, layout]];
					this.destroyBlock(x, y, layout);
					this.placeBlock(x, y - 1, layout, block_id);
				}
			}
			switch (block.type) {
                case "wood":
					// Если блок дерева не видит под собой опоры в нижнем блоке, либо стоит на листве, плюс
					// крайние нижние блоки - это не блоки дерева, то оно рушится
					{
						let downB = this.block_table[this.map[x][y - 1][layout]];
						if (downB === undefined || downB.type === "leaf" ) {
							let downLeftB = this.block_table[this.map[x - 1][y - 1][layout]];
							if (downLeftB === undefined || downLeftB.type !== "wood")  {
                                let downRightB = this.block_table[this.map[x + 1][y - 1][layout]];
								if (downRightB === undefined || downRightB.type !== "wood") {
								    this.destroyBlock(x, y, layout);
							    }
                            }
						}
						break;
					}
                case "leaf":
					// Если блок листвы не видит под собой опоры в нижнем, нижнем левом и нижнем правом блоке в виде
					// дерева или листвы, то он рушится
					{
						let downLeftB = this.block_table[this.map[x - 1][y - 1][layout]];
						if (downLeftB === undefined || downLeftB.type !== "leaf" || downLeftB.type !== "wood") {
							let downB = this.block_table[this.map[x][y - 1][layout]];
							if (downB === undefined || downB.type !== "leaf" || downB.type !== "wood") {
								let downRightB = this.block_table[this.map[x + 1][y - 1][layout]];
                                if (downRightB === undefined || downRightB.type !== "leaf" ||
                                    downRightB.type !== "wood") {
                                    this.destroyBlock([x, y, layout]);
                                }
							}
						}
						break;
					}
				case "water":
					// Если 2 блока воды при течении вправо/влево пересекаются своими потоками, то на месте пересечения
					// потоков создается цельный блок воды
					if (this.map[x - 1][y][layout] === undefined) {
						this.placeBlock(x - 1, y, layout, this.makeFlowingWaterBlock(9));
					}
					if (this.map[x + 1][y][layout] === undefined) {
						this.placeBlock(x + 1, y, layout, this.makeFlowingWaterBlock(9));
					}
					break;

                case "flowingWater":
					if (this.map[x][y - 1][layout] === undefined) {
						this.placeBlock(x, y - 1, layout, this.makeFlowingWaterBlock(this.map[x][y][layout]));
					}

					// 15 - id блока текучей воды с наименьшей заполненностью
                    // Поведение текучей воды, пока недоделано до конца
					if (this.map[x][y][layout] !== 15) {
					    let currID  = this.map[x][y][layout];
					    let leftID  = this.map[x - 1][y][layout];
					    let rightID = this.map[x + 1][y][layout];
                        if (rightID === undefined) {
                            this.placeBlock(x + 1, y, layout,
                                this.makeFlowingWaterBlock(currID + 1));
                        } else if (rightID > (currID + 1) && rightID <= 15) {
                            if ( 31 - rightID - currID >= GameArea.WATER_BLOCK_CAP) {
                                this.placeBlock(x + 1, y, layout,
                                    this.makeWaterBlock());
                            } else {
                                this.placeBlock(x + 1, y, layout,
                                    this.makeFlowingWaterBlock(currID + 1));
                            }
                        }
                        if (leftID === undefined) {
                            this.placeBlock(x - 1, y, layout,
                                this.makeFlowingWaterBlock(currID + 1));
                        } else if (leftID > (currID + 1) && leftID <= 15) {
                            if ( 31 - leftID - currID >= GameArea.WATER_BLOCK_CAP) {
                                this.placeBlock(x - 1, y, layout,
                                    this.makeWaterBlock());
                            } else {
                                this.placeBlock(x - 1, y, layout,
                                    this.makeFlowingWaterBlock(currID + 1));
                            }
                        }
                    }
					break;
				default:
					// Какое-либо стандартное поведение
			}
		};

		// Обновление окружения блока
		this.updateRadius = (x, y, layout) => {
			for (let i = x - 1; i <= x + 1; i++) {
			    for (let j = y - 1; j <= y + 1; j++) {
			        if (i !== x || y !== j) this.updateBlock(i, j, layout);
                }
            }
		};

		// Действие при разрушении блока
		this.destroyBlock = (x, y, layout) => {
			this.map[x][y][layout] = this.makeAirBlock();
			this.updateRadius(x, y, layout);
		};

		// Действие при установке блока
		this.placeBlock = (x, y, layout, id) => {
			if (this.block_table[this.map[x][y][layout]].isCollissed === false) {
				this.map[x][y][layout] = id;
				this.updateRadius(x, y, layout);
				this.updateBlock(x, y, layout);
			}
		};


		// Функция взаимодействия с блоком
		this.interactWithBlock = (x, y, layout) => {
            console.log("Interaction with block on coordinates : [${x} ${y} ${layout}]");
        };

		// Функция сброса лута
		this.dropLoot = (x, y, block) => {

        };


		// Функция разрушения блока со сбросом лута
		this.goodDestroy = (x, y, layout) => {
		    let block = this.block_table[this.map[x][y][layout]];
		    this.destroyBlock(x, y, layout);
		    this.dropLoot(x,y, block);
        }
	}
}

// Константы уровня

GameArea.FORWARD_LAYOUT = 1;
GameArea.MAIN_LAYOUT = 2;
GameArea.BACK_LAYOUT = 3;

// Константы поведения игрового пространства
GameArea.WATER_BLOCK_CAP = 12;  // Какова должна быть наполненность сходящихся потоков воды, чтобы на их месте создался
                                // блок стоячей воды min = 1, max = 14. При этом наполненность блока стоячей воды = 8,
                                // в то время как наполненность блока текучей воды изменяется от 7 до 1
                                // id изменяются соотвественно от 9 до 15 включительно
