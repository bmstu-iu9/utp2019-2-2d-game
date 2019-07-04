
// Константы уровня

const FORWARD_LAYOUT = 2;
const MAIN_LAYOUT = 3;
const BACK_LAYOUT = 4;


// Класс блока
class Block{
	constructor(id, type, durability, brightness, transparency, isCollissed, isPlatform, isClickable, hasGravity){
		this.id = id; // id - его id в таблице block_table, а также представление в map
		this.type = type; /* type - тип блока, определяется на основе того, чем "добывается" блок с точки зрения логики:
								dirt   - земля, добывается лопатой
								stone  - камень, добывается киркой
								wood   - дерево, добывается топором
								leaf   - листва, добывается ножницами
								water  - блоки стоячей жидкости
								flowingWater - блоки текучей жидкости
								backgr - блоки фона, стоят на отдельном фоновом слое, добываются (?) молотом (если смотреть на ту же
								 Террарию)
								foregr - блоки переднего плана, добываются тоже (?) молотом */
		this.durability = durability; // Прочность блока : от 1 до 100
		this.brightness = brightness; // Светимость блока : от 0 до 100
		this.isCollissed = isCollissed;   // Можно ли проходить сквозь этот блок, true/false
		this.isPlatform = isPlatform;     // Является ли блок платформой - можно ли спрыгнуть с него клавишей  вниз - как в платформере
		this.isClickable = isClickable;   // Можно ли нажать на блок
		this.hasGravity = hasGravity;   // Подвержен ли этот блок гравитации, т.е падает ли вниз без опоры, true/false
	}
}

// Функция выполняется при клике на блок правой кнопкой мыши
Block.onClick = () => {
	if(this.isClickable){
		console.log("Interaction with ${id}");
	}
};

// Игровое пространство
class GameArea{
	constructor(map, block_table, width, height){
		// map  - двумерная карта, состоящая из id блоков
		this.map = map;
		//block_table - ассоциативный массив, сопоставляющий конкретное id его описанию
		this.block_table = block_table;
		//ширина и высота игрового пространства
		this.width = width;
		this.height = height;
		// Проверка окружения блока, при наличии у него особого поведения. Особое поведение определеяется по типу
		this.makeAirBlock = () => {
			// Делает блок воздуха = undefined
			return undefined;
		};

		this.makeWaterBlock = () => {
			//стоячая вода - блок с гравитацией
			return 8; //id стоячей воды
		};

		this.makeFlowingWaterBlock = () => {
			// текучая вода - блок без гравитации
			return 9; //id текучей воды
		};

		// =====Группа функций, возвращающая координаты относительно заданной=====
		this.down = ([x, y, layout])  => {
			return [x, y-1, layout];
		};

		this.up = ([x, y, layout])  => {
			return [x, y + 1, layout];
		};

		this.left = ([x, y, layout])  => {
			return [x - 1, y, layout];
		};

		this.right = ([x, y, layout])  => {
			return [x + 1, y, layout];
		};

		this.downLeft = ([x, y, layout])  => {
			return [x - 1, y - 1, layout];
		};

		this.downRight = ([x, y, layout])  => {
			return [x + 1, y - 1, layout];
		};

		this.upLeft = ([x, y, layout])  => {
			return [x - 1, y + 1, layout];
		};

		this.upRight = ([x, y, layout])  => {
			return [x + 1, y + 1, layout];
		};
		// =====

		this.updateBlock = ([x, y, layout]) => {
			let block = this.block_table[this.map[[x, y, layout]]];
			if (block.hasGravity) {
				if (this.block_table[this.map[this.down([x, y, layout])]].type === undefined) {
					let block_id = this.map[[x, y, layout]];
					this.destroyBlock([x, y, layout]);
					this.placeBlock(this.down([x, y, layout]), block_id);
				}
			}
			switch (block.type) {
				case "wood":
				case "leaf":
					// Если блок дерева/листвы не видит под собой опоры в нижнем, нижнем левом и нижнем правом блоке, то он
					// рушится
					if (this.map[this.down([x, y, layout])] === undefined && this.map[this.downRight([x, y, layout])] === undefined &&
						this.map[this.downLeft([x, y, layout])] === undefined) {
						this.destroyBlock([x, y, layout]);
					}
					break;
				case "water":
					// Если 2 блока воды при течении вправо/влево пересекаются своими потоками, то на месте пересечения
					// потоков создается цельный блок воды
					if (this.map[this.right([x, y, layout])] === undefined) {
						this.placeBlock(this.right([x, y, layout]), this.makeFlowingWaterBlock());
					} else if (this.map[this.right([x, y, layout])].type === "flowingWater") {
						this.placeBlock(this.right([x, y, layout]), this.makeWaterBlock());
					}
					if (this.map[this.left([x, y, layout])] === undefined) {
						this.placeBlock(this.left([x, y, layout]), this.makeFlowingWaterBlock());
					} else if (this.map[this.left([x, y, layout])].type === "flowingWater") {
						this.placeBlock(this.left([x, y, layout]), this.makeWaterBlock())
					}
					break;

				case "flowingWater":
					if (this.map[this.down([x, y, layout])] === undefined) {
						this.placeBlock(this.down([x, y, layout]), this.makeFlowingWaterBlock())
					}
					break;
				default:
					// Какое-либо стандартное поведение
			}
		};

		// Обновление окружения блока
		this.updateRadius = ([x, y, layout]) => {
			this.updateBlock(this.up([x, y, layout]));
			this.updateBlock(this.down([x, y, layout]));
			this.updateBlock(this.left([x, y, layout]));
			this.updateBlock(this.right([x, y, layout]));
			this.updateBlock(this.upLeft([x, y, layout]));
			this.updateBlock(this.upRight([x, y, layout]));
			this.updateBlock(this.downLeft([x, y, layout]));
			this.updateBlock(this.downRight([x, y, layout]));
		};

		// Действие при разрушении блока
		this.destroyBlock = ([x, y, layout]) => {
			this.map[[x, y, layout]] = this.makeAirBlock();
			this.updateRadius([x, y, layout]);
		};

		// Действие при установке блока
		this.placeBlock = ([x, y, layout], id) => {
			if (this.block_table[this.map[[x, y, layout]]].isCollissed === false) {
				this.map[[x, y, layout]] = id;
				this.updateRadius([x, y, layout]);
				this.updateBlock([x, y, layout]);
			}
		};
	}
}