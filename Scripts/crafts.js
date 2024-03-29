'use strict';

// Список того, что можно крафтить по инвентарю
const getCrafts = (inventory, isCraftingTable, isFurnace) => {

	const addToSet = (array, obj) => {
		for (let i = 0; i < array.length; i++) {
			if (array[i] === obj) return;
		}
		array[array.length] = obj;
	}

	let ready = [];
	let notReady = [];
	for (let i = 0; i < inventory.items.length; i++) {
		if (inventory.items[i] === undefined) continue;

		let id = (inventory.items[i].id) ? inventory.items[i].id : inventory.items[i];
		if (+id === 263 && isFurnace) continue;

		let canCraft = needForCraft[id];

		if (canCraft) {
			for (let j = 0; j < canCraft.length; j++) {
				if (isFurnace && crafts[canCraft[j]].needFurance) {
					if (isReadyCraft(canCraft[j], inventory)) {
						addToSet(ready, canCraft[j]);
					} else {
						addToSet(notReady, canCraft[j]);
					}
				} else if (!isFurnace && (!crafts[canCraft[j]].needFurance
						&& (crafts[canCraft[j]].needCradftingTable && isCraftingTable
							|| !crafts[canCraft[j]].needCradftingTable))) {
					if (isReadyCraft(canCraft[j], inventory)) {
						addToSet(ready, canCraft[j]);
					} else {
						addToSet(notReady, canCraft[j]);
					}
				}
			}
		}
	}

	return {
		ready: ready.sort((a, b) => {
			if (items[a].name > items[b].name) {
				return 1;
			} else {
				return -1;
			}
		}),
		notReady: notReady.sort((a, b) => {
			if (items[a].name > items[b].name) {
				return 1;
			} else {
				return -1;
			}
		}),
	}
}
const isReadyCraft = (id, inventory, isFurnace) => {
	let need = crafts[id];
	for (let i = 0; i < need.needId.length; i++) {
		let count = 0;
		for (let j = 0; j < inventory.items.length; j++) {
			if (inventory.items[j]) {
				let invItemId = (inventory.items[j].id) ? inventory.items[j].id : inventory.items[j];
				if (+invItemId === +need.needId[i]) {
					count = (inventory.count[j]) ? inventory.count[j] : 1;
					break;
				}
			} 
		}
		if (count < need.needCount[i]) return false;
	}
	return true;
}

// Элемент -> что нужно для крафта
let crafts = {
	'1': {
		needId: [ 4, 263 ],
		needCount: [ 5, 2 ],
		needFurance: true,
		resultCount: 5
	},
	'5': {
		needId: [ 17 ],
		needCount: [ 1 ],
		resultCount: 2
	},
	'20': {
		needId: [ 12, 263 ],
		needCount: [ 1, 1 ],
		needFurance: true,
		resultCount: 3
	},
	'21': {
		needId: [ 1 ],
		needCount: [ 1 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'22': {
		needId: [ 5 ],
		needCount: [ 8 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'23': {
		needId: [ 5, 4 ],
		needCount: [ 6, 1 ],
		resultCount: 1
	},
	'24': {
		needId: [ 4 ],
		needCount: [ 8 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'263': {
		needId: [ 17, 263 ],
		needCount: [ 1, 1 ],
		needFurance: true,
		resultCount: 3
	},
	'265': {
		needId: [ 15, 263 ],
		needCount: [ 1, 1 ],
		needFurance: true,
		resultCount: 1
	},
	'266': {
		needId: [ 14, 263 ],
		needCount: [ 1, 1 ],
		needFurance: true,
		resultCount: 1
	},
	'267': {
		needId: [ 5 ],
		needCount: [ 2 ],
		resultCount: 3
	},
	'269': {
		needId: [ 267, 5 ],
		needCount: [ 1, 2 ],
		resultCount: 1
	},
	'270': {
		needId: [ 267, 5 ],
		needCount: [ 1, 2 ],
		resultCount: 1
	},
	'271': {
		needId: [ 267, 5 ],
		needCount: [ 1, 2 ],
		resultCount: 1
	},
	'273': {
		needId: [ 267, 4 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'274': {
		needId: [ 267, 4 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'275': {
		needId: [ 267, 4 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'63': {
		needId: [ 5 ],
		needCount: [ 5 ],
		needCradftingTable: true,
		resultCount: 3
	},
	'61': {
		needId: [ 5 ],
		needCount: [ 5 ],
		needCradftingTable: true,
		resultCount: 3
	},
	'19': {
		needId: [ 267, 263 ],
		needCount: [ 1, 1 ],
		resultCount: 1
	},
	'277': {
		needId: [ 267, 264 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'278': {
		needId: [ 267, 264 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'279': {
		needId: [ 267, 264 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'256': {
		needId: [ 267, 265 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'257': {
		needId: [ 267, 265 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	},
	'258': {
		needId: [ 267, 265 ],
		needCount: [ 1, 2 ],
		needCradftingTable: true,
		resultCount: 1
	}
}

// Элемент -> объекты, которые из него крафтятся
let needForCraft = {};
for (let i in crafts) {
	for (let j = 0; j < crafts[i].needId.length; j++) {
		if (!needForCraft[crafts[i].needId[j]]) {
			needForCraft[crafts[i].needId[j]] = [ i ];
		} else {
			let added = false;
			for (let k = 0; k < needForCraft[crafts[i].needId[j]].length; k++) {
				if (needForCraft[crafts[i].needId[j]][k] === i) {
					added = true;
					break;
				}
			}
			if (!added) {
				needForCraft[crafts[i].needId[j]][needForCraft[crafts[i].needId[j]].length] = i;
			}
		}
	}
}
