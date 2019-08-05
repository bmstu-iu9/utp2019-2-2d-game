const WOODEN_EFFICIENCY = 2;
const STONE_EFFICIENCY = 4;
const IRON_EFFICIENCY = 7;
const DIAMOND_EFFICIENCY = 10;

const WEIGHT_OF_INSTRUMENTS = 5;
const WEIGHT_OF_BLOCKS = 2;
const WEIGHT_OF_ORES = 1;

const WOODEN_DURABILITY = 100;
const STONE_DURABILITY = 150;
const IRON_DURABILITY = 200;
const DIAMOND_DURABILITY = 300;
const textureSize = 512;
const itemSize = 32;
let _textureItems;
const GRASS_TIME_UPDATE = 30;  // Рандомный промежуток с верхним концом [сек]
const WATER_TIME_UPDATE = 0.2;


const createItem = (id, count) => {
    if (items[id].isTool) {
        return {
            id: id,
            durability: items[id].durability,
            name: items[id].name
        }
    } else {
        if (count) {
            return {
                id: id,
                count: count
            }
        } else {
            return {
                id: id,
                count: 1
            }
        }
    }
}


// Never used
const isWater = (id) => {
    return (id >= 9000 && id <= 9016) || id === 8;
}
const firstLowerFullWater = (currentId, targetId) => {
    if (currentId === 8) {
        return false;
    }
    if (!isWater(currentId)) {
        return true;
    }
    return ((currentId - 9000) % 8 > (targetId - 9000) % 8)
        || (targetId === 9016 && currentId !== 9016);
}
const needPlaceWater = (targetId, id) => {
    return targetId === undefined;
}


const fallingWaterUpdate = (x, y, l, gA, id) => {
    setTimeout(() => {
        if ((y + 1) < gA.height && firstLowerFullWater(gA.map[x][y + 1][l], id)
            && (x - 1) >= 0 && firstLowerFullWater(gA.map[x - 1][y][l], id)
            && (x + 1) < gA.width && firstLowerFullWater(gA.map[x + 1][y][l], id)) {
    
            gA.placeBlock(x, y, l, undefined);
            return;
        }
        if ((y - 1) >= 0 && gA.map[x][y - 1][l] === 9016) {
            return;
        }

        if ((y - 1) >= 0 && needPlaceWater(gA.map[x][y - 1][l], id)) {
            // 16 - вода стоит
            gA.placeBlock(x, y - 1, l, gA.makeFlowingWaterBlock(9000 + 16));
        } else {
            if ((x - 1) >= 0 && id !== 9007 && needPlaceWater(gA.map[x - 1][y][l], id)) {
                // 0 ... 7 - вода течет влево (0 - макс наполнена)
                gA.placeBlock(x - 1, y, l, gA.makeFlowingWaterBlock(id + 1));
            }
            if ((x + 1) < gA.height && id !== 9015 && needPlaceWater(gA.map[x + 1][y][l], id)) {
                // 8 ... 15 - вода течет вправо (8 - макс наполнена)
                gA.placeBlock(x + 1, y, l, gA.makeFlowingWaterBlock(id + 1));
            }
        }
    }, WATER_TIME_UPDATE * 1000);
}


const getTextureCoordinates = (x, y) => {
    return [
        [ (x * itemSize + 0.5) / textureSize, (y * itemSize + 0.5) / textureSize],
        [ ((x + 1) * itemSize - 0.5) / textureSize, ((y + 1) * itemSize - 0.5) / textureSize],
        _textureItems
    ];
}

const items = { 
    undefined: {},

    '790': //__cheat
    {
        id: '790',
        name: 'SupStone',
        type: 'stone',
        isTool: true,
        durability: 999,
        efficiency: 999,
        weight: 1,
        texture: () => {
            return getTextureCoordinates(11, 1)
        }
    },
    '791': //__cheat
    {
        id: '791',
        name: 'SupWood',
        type: 'wood',
        isTool: true,
        durability: 999,
        efficiency: 999,
        weight: 1,
        texture: () => {
            return getTextureCoordinates(12, 1)
        }
    },


    '1':
    {
        id: '1',
        name: 'Stone',
        type: 'stone',
        isBlock: true,
        dropId: '4',
        weight: WEIGHT_OF_BLOCKS,
        durability: 7,
        brightness: 0,
        isCollissed: true,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(0, 0)
        }
    },

    '2':
    {
        id: '2',
        name: 'Grass',
        type: 'dirt',
        isBlock: true,
        isAlwaysGoodDestroy: true,
        dropId: '3',
        weight: WEIGHT_OF_BLOCKS,
        durability: 1.5,
        brightness: 0,
        isCollissed: true,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(1, 0)
        },
        update: (x, y, l, gA) => {
            if (gA.map[x][y + 1][l] === undefined) {
                return;
            }
            setTimeout(() => {
                if ((y + 1) >= gA.height) {
                    return;
                }
                if (gA.map[x][y + 1][l] !== undefined && gA.map[x][y][l] === 2) {
                    gA.map[x][y][l] = undefined;
                    gA.placeBlock(x, y, l, 3);
                }
            }, GRASS_TIME_UPDATE * Math.random() * 1000);
        }
    },

    '3':
    {
        id: '3',
        name: 'Dirt',
        type: 'dirt',
        isBlock: true,
        isAlwaysGoodDestroy: true,
        dropId: '3',
        weight: WEIGHT_OF_BLOCKS,
        durability: 1.5,
        brightness: 0,
        isCollissed: true,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(2, 0)
        },
        update: (x, y, l, gA) => {
            if (gA.map[x][y + 1][l] !== undefined) {
                return;
            }
            setTimeout(() => {
                if ((y + 1) >= gA.height) {
                    return;
                }
                if (gA.map[x][y + 1][l] === undefined && gA.map[x][y][l] === 3) {
                    gA.map[x][y][l] = undefined;
                    gA.placeBlock(x, y, l, 2);
                }
            }, GRASS_TIME_UPDATE * Math.random() * 1000);
        }
    },

    '4':
    {
        id: '4',
        name: 'Cobblestone',
        type: 'stone',
        isBlock: true,
        dropId: '4',
        weight: WEIGHT_OF_BLOCKS,
        meltingId: '1',
        costOfMelting: '100',
        durability: 7,
        brightness: 0,
        isCollissed: true,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(3, 0)
        }
    },

    '5':
    {
        id: '5',
        name: 'Wood Planks',
        type: 'wood',
        isBlock: true,
        isCollissed: true,
        durability: 3,
        isAlwaysGoodDestroy: true,
        dropId: '5',
        isSolid: true,
        weight: WEIGHT_OF_BLOCKS,
        meltingId: '263',
        costOfMelting: '50',
        texture: () => {
            return getTextureCoordinates(4, 0)
        }
    },

    '7':
    {
        id: '7',
        name: 'Bedrock',
        isBlock: true,
        weight: '2',
        type: 'bedrock',
        durability: 1000,
        brightness: 0,
        isCollissed: true,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(6, 0)
        }
    },

    '8':
    {
        id: '8',
        name: 'Water',
        dropId: '326',
        weight: WEIGHT_OF_INSTRUMENTS,
        type: 'water',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        hasGravity: false,
        density: 0.5,
        isNaturalLight: true,
        update: (x, y, l, gA, id = 8) => {
            setTimeout(() => {
                if (id === 9016
                    && (y + 1) < gA.height && !isWater(gA.map[x][y + 1][l])) {
            
                    gA.placeBlock(x, y, l, undefined);
                    return;
                }
                if ((y - 1) >= 0 && (gA.map[x][y - 1][l] >= 9000 && gA.map[x][y - 1][l] <= 9016)) {
                    return;
                }

                if ((y - 1) >= 0 && needPlaceWater(gA.map[x][y - 1][l], id)) {
                    // 16 - вода стоит
                    gA.placeBlock(x, y - 1, l, gA.makeFlowingWaterBlock(9000 + 16));
                } else {
                    if ((x - 1) >= 0 && needPlaceWater(gA.map[x - 1][y][l], id)) {
                        // 0 ... 7 - вода течет влево (0 - макс наполнена)
                        gA.placeBlock(x - 1, y, l, gA.makeFlowingWaterBlock(9000));
                    }
                    if ((x + 1) < gA.height && needPlaceWater(gA.map[x + 1][y][l], id)) {
                        // 8 ... 16 - вода течет вправо (8 - макс наполнена)
                        gA.placeBlock(x + 1, y, l, gA.makeFlowingWaterBlock(9000 + 8));
                    }
                }
            }, WATER_TIME_UPDATE * 1000);
        }
    },

    '9':
    {
        id: '9',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCanInteractThrow: true,
        isCollissed: false,
        isNaturalLight: true,
        name: 'flowing-water-image'
    },

    '10':
    {
        id: '10',
        name: 'Lava',
        dropId: '326',
        weight: WEIGHT_OF_INSTRUMENTS,
        type: 'water',
        durability: 1,
        brightness: 8,
        isCanInteractThrow: true,
        isCollissed: false,
        hasGravity: true,
        density: 0.9
    },

    '11':
    {
        id: '11',
        type: 'flowingWater',
        durability: 1,
        brightness: 8,
        isCanInteractThrow: true,
        isCollissed: false,
        name: 'flowing-lava-image'
    },

    '12':
    {
        id: '12',
        name: 'Sand',
        type: 'dirt',
        isBlock: true,
        isAlwaysGoodDestroy: true,
        dropId: '12',
        weight: WEIGHT_OF_BLOCKS,
        meltingId: '20',
        costOfMelting: '100',
        durability: 1.2,
        brightness: 0,
        isCollissed: true,
        isSolid: true,
        hasGravity: true,
        texture: () => {
            return getTextureCoordinates(5, 0)
        }
    },

    '14':
    {
        id: '14',
        name: 'Golden Ore',
        type: 'stone',
        isBlock: true,
        dropId: '14',
        weight: WEIGHT_OF_BLOCKS,
        isCollissed: true,
        durability: 10,
        meltingId: '266',
        costOfMelting: '100',
        texture: () => {
            return getTextureCoordinates(7, 0)
        }
    },

    '15':
    {
        id: '15',
        name: 'Iron Ore',
        type: 'stone',
        isBlock: true,
        dropId: '15',
        weight: WEIGHT_OF_BLOCKS,
        isCollissed: true,
        durability: 12,
        meltingId: '265',
        costOfMelting: '100',
        texture: () => {
            return getTextureCoordinates(8, 0)
        }
    },

    '16':
    {
        id: '16',
        name: 'Coal Ore',
        type: 'stone',
        isBlock: true,
        dropId: '263',
        weight: WEIGHT_OF_BLOCKS,
        durability: 8,
        brightness: 0,
        isCollissed: true,
        isSolid: true
    },

    '17':
    {
        id: '17',
        name: 'Wood',
        type: 'wood',
        isBlock: true,
        isAlwaysGoodDestroy: true,
        dropId: '17',
        weight: WEIGHT_OF_BLOCKS,
        meltingId: '263',
        costOfMelting: '100',
        durability: 4,
        brightness: 0,
        isCollissed: true,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(9, 0)
        }
    },

    '18':
    {
        id: '18',
        name: 'Leaf',
        type: 'leaf',
        isBlock: true,
        dropId: '18',
        weight: WEIGHT_OF_BLOCKS,
        durability: 0.5,
        brightness: 0,
        isCollissed: false,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(10, 0)
        }
    },

    '19': {
        id: '19',
        name: 'Torch',
        type: 'other',
        isBlock: true,
        brightness: 9,
        isCollissed: false,
        isCanInteractThrow: true,
        isAlwaysGoodDestroy: true,
        isSolid: true,
        texture: () => {
            return getTextureCoordinates(13, 1)
        },
        canPlace: (x, y, layout) => {
            return layout === GameArea.FIRST_LAYOUT && gameArea.canAttach(x, y, GameArea.SECOND_LAYOUT);
        },
        weight: 1
    },

    '20': 
    {
        id: '20',
        name: 'Glass',
        type: 'other',
        isBlock: true,
        weight: WEIGHT_OF_BLOCKS
    },

    '21':
    {
        id: '21',
        name: 'Stone bricks',
        type: 'stone',
        isBlock: true,
        isCollissed: true,
        durability: 9,
        isSolid: true,
        weight: WEIGHT_OF_BLOCKS,
        texture: () => {
            return getTextureCoordinates(13, 0)
        }
    },

    '56':
    {
        id: '56',
        name: 'Diamond Ore',
        type: 'stone',
        durability: 15,
        isCollissed: true,
        dropId: 264,
        isBlock: true,
        weight: WEIGHT_OF_BLOCKS
    },

    '57':
    {
        id: '57',
        name: 'Iron wood',
        type: 'stone',
        durability: 15,
        isBlock: true,
        isCollissed: true,
        dropId: 15,
        weight: WEIGHT_OF_BLOCKS
    },

    '58':
    {
        id: '58',
        name: 'Gold leaf',
        type: 'stone',
        durability: 12,
        dropId: 264,
        isBlock: true,
        brightness: 6,
        isCollissed: true,
        dropId: 14,
        weight: WEIGHT_OF_BLOCKS
    },

    '60':
    {
        id: '60',
        name: 'Closed Trapdoor',
        type: 'wood',
        isBlock: true,
        dropId: '61',
        durability: 3,
        isAlwaysGoodDestroy: true,
        weight: WEIGHT_OF_BLOCKS,
        isSolid: false,
        isCollissed: true,
        isClickable: true,
        interactFunction: (x, y, layout) => {
            gameArea.gameAreaMapSet(x, y, layout, 61);

            if (inRange(x + 1, 0, gameArea.height)
                    && gameArea.map[x + 1][y][layout] === 60) gameArea.interactWithBlock(x + 1, y, layout);
            if (inRange(x - 1, 0, gameArea.height)
                    && gameArea.map[x - 1][y][layout] === 60) gameArea.interactWithBlock(x - 1, y, layout);
        },
        canPlace: (x, y, layout) => {
            return (gameArea.map[x + 1][y][layout] === 61
                        || gameArea.map[x + 1][y][layout] === 60
                        || gameArea.canAttach(x + 1, y, layout))
                || (gameArea.map[x - 1][y][layout] === 61
                        || gameArea.map[x - 1][y][layout] === 60
                        || gameArea.canAttach(x - 1, y, layout));
        },
        destroyFunction: (x, y, layout) => {
            if (gameArea.get(x - 1, y, layout) === 61 || gameArea.get(x - 1, y, layout) === 60) {
                gameArea.goodDestroy(x - 1, y, layout, player);
            }
            if (gameArea.get(x + 1, y, layout) === 61 || gameArea.get(x + 1, y, layout) === 60) {
                gameArea.goodDestroy(x + 1, y, layout, player);
            }
        }
    },

    '61':
    {
        id: '61',
        name: 'Trapdoor',
        type: 'wood',
        isBlock: true,
        dropId: '61',
        durability: 3,
        isAlwaysGoodDestroy: true,
        weight: WEIGHT_OF_BLOCKS,
        isSolid: false,
        isCollissed: false,
        isClickable: true,
        isCanInteractThrow: true,
        texture: () => {
            return getTextureCoordinates(12, 0)
        },
        interactFunction: (x, y, layout) => {
            gameArea.gameAreaMapSet(x, y, layout, 60);

            if (inRange(x + 1, 0, gameArea.height)
                    && gameArea.map[x + 1][y][layout] === 61) gameArea.interactWithBlock(x + 1, y, layout);
            if (inRange(x - 1, 0, gameArea.height)
                    && gameArea.map[x - 1][y][layout] === 61) gameArea.interactWithBlock(x - 1, y, layout);
        },
        canPlace: (x, y, layout) => {
            return (gameArea.map[x + 1][y][layout] === 61
                        || gameArea.map[x + 1][y][layout] === 60
                        || gameArea.canAttach(x + 1, y, layout))
                || (gameArea.map[x - 1][y][layout] === 61
                        || gameArea.map[x - 1][y][layout] === 60
                        || gameArea.canAttach(x - 1, y, layout));
        },
        destroyFunction: (x, y, layout) => {
            if (gameArea.get(x - 1, y, layout) === 61 || gameArea.get(x - 1, y, layout) === 60) {
                gameArea.goodDestroy(x - 1, y, layout, player);
            }
            if (gameArea.get(x + 1, y, layout) === 61 || gameArea.get(x + 1, y, layout) === 60) {
                gameArea.goodDestroy(x + 1, y, layout, player);
            }
        }
    },

    '62':
    {
        id: '62',
        name: 'Closed Door',
        type: 'wood',
        isBlock: true,
        dropId: '63',
        durability: 3,
        isAlwaysGoodDestroy: true,
        weight: WEIGHT_OF_BLOCKS,
        isSolid: false,
        isCollissed: true,
        isClickable: true,
        interactFunction: (x, y, layout) => {
            gameArea.gameAreaMapSet(x, y, layout, 63);

            if (inRange(y + 1, 0, gameArea.height)
                    && gameArea.map[x][y + 1][layout] === 62) gameArea.interactWithBlock(x, y + 1, layout);
            if (inRange(y - 1, 0, gameArea.height)
                    && gameArea.map[x][y - 1][layout] === 62) gameArea.interactWithBlock(x, y - 1, layout);
        },
        canPlace: (x, y, layout) => {
            return (gameArea.map[x][y - 1][layout] === 61
                        || gameArea.map[x][y - 1][layout] === 60
                        || gameArea.canAttach(x, y - 1, layout));
        },
        destroyFunction: (x, y, layout) => {
            if (gameArea.get(x, y - 1, layout) === 63 || gameArea.get(x, y - 1, layout) === 62) {
                gameArea.goodDestroy(x, y - 1, layout, player);
            }
            if (gameArea.get(x, y + 1, layout) === 63 || gameArea.get(x, y + 1, layout) === 62) {
                gameArea.goodDestroy(x, y + 1, layout, player);
            }
        }
    },

    '63':
    {
        id: '63',
        name: 'Door',
        type: 'wood',
        isBlock: true,
        dropId: '63',
        durability: 3,
        isAlwaysGoodDestroy: true,
        weight: WEIGHT_OF_BLOCKS,
        isSolid: true,
        isCollissed: false,
        isClickable: true,
        isCanInteractThrow: true,
        texture: () => {
            return getTextureCoordinates(11, 0)
        },
        interactFunction: (x, y, layout) => {
            gameArea.gameAreaMapSet(x, y, layout, 62);


            if (inRange(y + 1, 0, gameArea.height)
                    && gameArea.map[x][y + 1][layout] === 63) gameArea.interactWithBlock(x, y + 1, layout);
            if (inRange(y - 1, 0, gameArea.height)
                    && gameArea.map[x][y - 1][layout] === 63) gameArea.interactWithBlock(x, y - 1, layout);
        },
        canPlace: (x, y, layout) => {
            return (gameArea.map[x][y - 1][layout] === 61
                        || gameArea.map[x][y - 1][layout] === 60
                        || gameArea.canAttach(x, y - 1, layout));
        },
        destroyFunction: (x, y, layout) => {
            if (gameArea.get(x, y - 1, layout) === 63 || gameArea.get(x, y - 1, layout) === 62) {
                gameArea.goodDestroy(x, y - 1, layout, player);
            }
            if (gameArea.get(x, y + 1, layout) === 63 || gameArea.get(x, y + 1, layout) === 62) {
                gameArea.goodDestroy(x, y + 1, layout, player);
            }
        }
    },

    '256':
    {
        id: '256',
        name: 'Iron Shovel',
        type: 'dirt',
        isTool: true,
        durability: IRON_DURABILITY,
        efficiency: IRON_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(7, 1)
        }
    },

    '257':
    {
        id: '257',
        name: 'Iron Pickaxe',
        type: 'stone',
        isTool: true,
        durability: IRON_DURABILITY,
        efficiency: IRON_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(8, 1)
        }
    },

    '258':
    {
        id: '258',
        name: 'Iron Axe',
        type: 'wood',
        isTool: true,
        durability: IRON_DURABILITY,
        efficiency: IRON_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(9, 1)
        }
    },

    '263':
    { 
        id: '263',
        name: 'Coal', 
        weight: WEIGHT_OF_ORES,
        texture: () => {
            return getTextureCoordinates(0, 2)
        }
    },

    '264': 
    { 
        id: '264',
        name: 'Diamond', 
        weight: WEIGHT_OF_ORES,
        texture: () => {
            return getTextureCoordinates(1, 2)
        }
    },

    '265': 
    { 
        id: '265', 
        name: 'Iron', 
        weight: WEIGHT_OF_ORES
    },

    '266': 
    { 
        id: '266', 
        name: 'Gold', 
        weight: WEIGHT_OF_ORES
    },

    '267': {
        id: '267',
        name: 'Shaft',
        texture: () => {
            return getTextureCoordinates(0, 1)
        },
        weight: 1
    },

    '269':
    {
        id: '269',
        name: 'Wooden Shovel',
        type: 'dirt',
        isTool: true,
        durability: WOODEN_DURABILITY,
        efficiency: WOODEN_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(1, 1)
        }
    },

    '270':
    {
        id: '270',
        name: 'Wooden Pickaxe',
        type: 'stone',
        isTool: true,
        durability: WOODEN_DURABILITY,
        efficiency: WOODEN_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(2, 1)
        }
    },

    '271':
    {
        id: '271',
        name: 'Wooden Axe',
        type: 'wood',
        isTool: true,
        durability: WOODEN_DURABILITY,
        efficiency: WOODEN_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(3, 1)
        }
    },

    '273':
    {
        id: '273',
        name: 'Stone Shovel',
        type: 'dirt',
        isTool: true,
        durability: STONE_DURABILITY,
        efficiency: STONE_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(4, 1)
        }
    },

    '274':
    {
        id: '274',
        name: 'Stone Pickaxe',
        type: 'stone',
        isTool: true,
        durability: STONE_DURABILITY,
        efficiency: STONE_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(5, 1)
        }
    },

    '275':
    {
        id: '275',
        name: 'Stone Axe',
        type: 'wood',
        isTool: true,
        durability: STONE_DURABILITY,
        efficiency: STONE_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(6, 1)
        }
    },

    '277':
    {
        id: '277',
        name: 'Diamond Shovel',
        type: 'dirt',
        isTool: true,
        durability: DIAMOND_DURABILITY,
        efficiency: DIAMOND_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(10, 1)
        }
    },

    '278':
    {
        id: '278',
        name: 'Diamond Pickaxe',
        type: 'stone',
        isTool: true,
        durability: DIAMOND_DURABILITY,
        efficiency: DIAMOND_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(11, 1)
        }
    },

    '279':
    {
        id: '279',
        name: 'Diamond Axe',
        type: 'wood',
        isTool: true,
        durability: DIAMOND_DURABILITY,
        efficiency: DIAMOND_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS,
        texture: () => {
            return getTextureCoordinates(12, 1)
        }
    },

    '370':
    {
        id: '370',
        name: 'Scissors',
        type: 'leaf',
        isTool: true,
        durability: DIAMOND_DURABILITY,
        efficiency: DIAMOND_EFFICIENCY,
        weight: WEIGHT_OF_INSTRUMENTS
    },

    '9000':
    {
        id: '9000',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-0',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9000);
        }
    },

    '9001':
    {
        id: '9001',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-1',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9001);
        }
    },

    '9002':
    {
        id: '9002',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-2',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9002);
        }
    },

    '9003':
    {
        id: '9003',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-3',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9003);
        }
    },

    '9004':
    {
        id: '9004',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-4',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9004);
        }
    },

    '9005':
    {
        id: '9005',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-5',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9005);
        }
    },

    '9006':
    {
        id: '9006',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-6',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9006);
        }
    },

    '9007':
    {
        id: '9007',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-7',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9007);
        }
    },

    '9008':
    {
        id: '9008',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-8',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9008);
        }
    },

    '9009':
    {
        id: '9009',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-9',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9009);
        }
    },

    '9010':
    {
        id: '9010',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-10',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9010);
        }
    },

    '9011':
    {
        id: '9011',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-11',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9011);
        }
    },

    '9012':
    {
        id: '9012',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-12',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9012);
        }
    },

    '9013':
    {
        id: '9013',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-13',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9013);
        }
    },

    '9014':
    {
        id: '9014',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-14',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9014);
        }
    },

    '9015':
    {
        id: '9015',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-15',
        update: (x, y, l, gA) => {
            fallingWaterUpdate(x, y, l, gA, 9015);
        }
    },

    '9016':
    {
        id: '9016',
        type: 'flowingWater',
        durability: 1,
        brightness: 6,
        isCollissed: false,
        isCanInteractThrow: true,
        isNaturalLight: true,
        name: 'flowing-water-16',
        update: (x, y, l, gA) => {
            items['8'].update(x, y, l, gA, 9016);
        }
    }

    // TODO : вояснить необходимость
    // '9017':
    // {
    //     id: '9017',
    //     type: 'flowingWater',
    //     durability: 1,
    //     brightness: 6,
    //     isCollissed: false,
    //     isNaturalLight: true,
    //     name: 'flowing-water-17'
    // },

    // '9018':
    // {
    //     id: '9018',
    //     type: 'flowingWater',
    //     durability: 1,
    //     brightness: 6,
    //     isCollissed: false,
    //     isNaturalLight: true,
    //     name: 'flowing-water-18'
    // },

    // '9019':
    // {
    //     id: '9019',
    //     type: 'flowingWater',
    //     durability: 1,
    //     brightness: 6,
    //     isCollissed: false,
    //     isNaturalLight: true,
    //     name: 'flowing-water-19'
    // },

    // '9020':
    // {
    //     id: '9020',
    //     type: 'flowingWater',
    //     durability: 1,
    //     brightness: 6,
    //     isCollissed: false,
    //     isNaturalLight: true,
    //     name: 'flowing-water-20'
    // },

    // '9021':
    // {
    //     id: '9021',
    //     type: 'flowingWater',
    //     durability: 1,
    //     brightness: 6,
    //     isCollissed: false,
    //     isNaturalLight: true,
    //     name: 'flowing-water-21'
    // },

    // '9022':
    // {
    //     id: '9022',
    //     type: 'flowingWater',
    //     durability: 1,
    //     brightness: 6,
    //     isCollissed: false,
    //     isNaturalLight: true,
    //     name: 'flowing-water-22'
    // },

    // '9023':
    // {
    //     id: '9023',
    //     type: 'flowingWater',
    //     durability: 1,
    //     brightness: 6,
    //     isCollissed: false,
    //     isNaturalLight: true,
    //     name: 'flowing-water-23'
    // }
}