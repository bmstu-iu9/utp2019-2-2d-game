// Класс координат в игровом пространстве
class Coordinate{
	constructor(x, y, layout){
		this.x = x
		this.y = y
		this.layout = layout
	}
}

// Класс блока
class Block{
	constructor(id, type, coordinates, durability, brightness, isCollissed, isPlatform, isClickable){
		this.id = id
		this.type = type
		this.coordinates = coordinates
		this.durability = durability
		this.brightness = brightness
		this.isCollissed = isCollissed
		this.isPlatform = isPlatform
		this.isClickable = isClickable
	}
}

// Функция выполняется при клике на блок правой кнопкой мыши
Block.onClick = () => {
	if(isClickable){
		Console.Log("Interaction with block on (${coordinates.x},${coordinates.y}), layout: ${coordinates.layout}; id: ${id}")
	}
}

// Игровое пространство
class GameArea{
	constructor(map){
		this.map = map
		this.destroyBlock = (coordinates) => {
			let block = map[coordinates]
			if(block.type === "wood"){
				let underCoord = new Coordinate(coordinates.x, coordinates.y - 1, layout)
				if(map[underCoord].type !== "wood")
			}
		}
	}
}