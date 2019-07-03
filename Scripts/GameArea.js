// Класс координат в игровом пространстве
class Coordinate{
	constructor(x, y, layout){
		this.x = x;
		this.y = y;
		this.layout = layout;
	}
}

// Класс блока
class Block{
	constructor(id, type, coordinates, durability, brightness, isCollissed, isPlatform, isClickable){
		this.id = id;
		this.type = type;
		this.coordinates = coordinates;
		this.durability = durability;
		this.brightness = brightness;
		this.isCollissed = isCollissed;
		this.isPlatform = isPlatform;
		this.isClickable = isClickable;
	}
}

// Функция выполняется при клике на блок правой кнопкой мыши
Block.onClick = () => {
	if(this.isClickable){
		console.log("Interaction with block on (${coordinates.x},${coordinates.y}), layout: ${coordinates.layout}; id: ${id}");
	}
};

// Игровое пространство
class GameArea{
	constructor(map){
		this.map = map;

		// Проверка окружения блока, при наличии у него особого поведения. Особое поведение определеяется по типу
		this.makeAirBlock = (coordinates) => {
			// Делает блок воздуха
			return new Block(0, "air", coordinates, 100, 0,
				false, false, false);
		};

		// =====Группа функций, возвращающая координаты относительно заданной=====
		this.down = (coordinates)  => {
			return new Coordinate(coordinates.x, coordinates.y - 1, coordinates.layout);
		};

		this.up = (coordinates)  => {
			return new Coordinate(coordinates.x, coordinates.y + 1, coordinates.layout);
		};

		this.left = (coordinates)  => {
			return new Coordinate(coordinates.x - 1, coordinates.y, coordinates.layout);
		};

		this.right = (coordinates)  => {
			return new Coordinate(coordinates.x + 1, coordinates.y, coordinates.layout);
		};

		this.downLeft = (coordinates)  => {
			return new Coordinate(coordinates.x - 1, coordinates.y - 1, coordinates.layout);
		};

		this.downRight = (coordinates)  => {
			return new Coordinate(coordinates.x + 1, coordinates.y - 1, coordinates.layout);
		};

		this.upLeft = (coordinates)  => {
			return new Coordinate(coordinates.x - 1, coordinates.y + 1, coordinates.layout);
		};

		this.upRight = (coordinates)  => {
			return new Coordinate(coordinates.x + 1, coordinates.y + 1, coordinates.layout);
		};
		// =====

		this.updateBlock = (coordinates) => {
			let type = this.map[coordinates].type;
			switch (type) {
				case "wood":
					break;
				case "water":
					break;
				case "sand":
					if (this.map[this.down(coordinates)].type === "air") {
						let block = this.map[coordinates];
						this.destroyBlock(coordinates);
						this.placeBlock(this.down(coordinates), new Block(block.id, block.type,
							this.down(block.coordinates), block.durability, block.brightness,
							block.isCollissed, block.isPlatform, block.isClickable));
					}
					break;
				default:
					// Какое-либо стандартное поведение
			}
		};

		// Обновление окружения блока
		this.updateRadius = (coordinates) => {
			this.updateBlock(this.up(coordinates));
			this.updateBlock(this.down(coordinates));
			this.updateBlock(this.left(coordinates));
			this.updateBlock(this.right(coordinates));
			this.updateBlock(this.upLeft(coordinates));
			this.updateBlock(this.upRight(coordinates));
			this.updateBlock(this.downLeft(coordinates));
			this.updateBlock(this.downRight(coordinates));
		};

		// Действие при разрушении блока
		this.destroyBlock = (coordinates) => {
			this.map[coordinates] = this.makeAirBlock(coordinates);
			this.updateRadius(coordinates);
		};

		// Действие при установке блока
		this.placeBlock = (coordinates, block) => {
			if (this.map[coordinates].isCollissed === false) {
				this.map[coordinates] = block;
				this.updateRadius(coordinates);
				this.updateBlock(coordinates);

			}
		}
	}
}