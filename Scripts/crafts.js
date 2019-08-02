// Элемент -> что нужно для крафта
let crafts = {
	'5': {
		needId: [ 17 ],
		needCount: [ 1 ],
		resultCount: [ 2 ]
	}
}

// Элемент -> объекты, которые из него крафтятся
let needForCraft = {};
for(let i in crafts) {
	for(let j = 0; j < crafts[i].needId.length; j++) {
		if (!needForCraft[crafts[i].needId[j]]) {
			needForCraft[crafts[i].needId[j]] = [ i ];
		} else {
			let added = false;
			for(let k = 0; k < needForCraft[j].length; j++) {
				if (needForCraft[crafts[i].needId[j]][k] === i) {
					added = true;
					break;
				}
			}
			if (!added) {
				needForCraft[crafts[i].needId[j]][needForCraft[j].length] = i;
			}
		}
	}
}

const getCrafts = (inventory, isCraftingTable) => {
	let ready = [];
	let notReady = [];
	for(let i = 0; i < inventory.items.length; i++) {
		let canCraft = needForCraft[inventory.items[i]];
		for(let j = 0; j < canCraft.length; j++) {
			
		}
	}
}