const WOODEN_EFFICIENCY = 2;
const STONE_EFFICIENCY = 2,5;
const IRON_EFFICIENCY = 3;
const DIAMOND_EFFICIENCY = 4;

const WEIGHT_OF_INSTRUMETS = 5;
const WEIGHT_OF_BLOCKS = 2;
const WEIGHT_OF_ORES = 1;

const WOODEN_DURABILITY = 100;
const STONE_DURABILITY = 150;
const IRON_DURABILITY = 200;
const DIAMOND_DURABILITY = 300;

let items = {
    "1" : {
        "id" : "1",
        "name" : "Stone",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "4",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "2" : {
        "id" : "2",
        "name" : "Grass",
        "type" : "leaf",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "3",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "3" : {
        "id" : "3",
        "name" : "Dirt",
        "type" : "dirt"
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "3",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "4" : {
        "id" : "4",
        "name" : "Cobblestone",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "4",
        "weight" : WEIGHT_OF_BLOCKS,
        "meltingId" : "1",
        "costOfMelting" : "100"
    },

    "5" : {
        "id" : "5",
        "name" : "Wood Planks",
        "type" : "wood",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "5",
        "weight" : WEIGHT_OF_BLOCKS,
        "meltingId" : "263",
        "costOfMelting" : "50"
    },

    "7" : {
        "id" : "7",
        "name" : "Bedrock",
        "isBlock" : true,
        "weight" : "2"
    },

    "8" : {
        "id" : "8",
        "name" : "Water",
        "dropId" : "326"
        "weight" : WEIGHT_OF_INSTRUMETS,
    },


    "12" : {
        "id" : "12",
        "name" : "Sand",
        "type" : "dirt",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "12",
        "weight" : WEIGHT_OF_BLOCKS,
        "meltingId" : "20",
        "costOfMelting" : "100"
    },

    "14" : {
        "id" : "14",
        "name" : "Golden Ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "14",
        "weight" : WEIGHT_OF_BLOCKS,
        "meltingId" : "266",
        "costOfMelting" : "100"

    },

    "15" : {
        "id" : "15",
        "name" : "Iron Ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "15",
        "weight" : WEIGHT_OF_BLOCKS, 
        "meltingId" : "265",
        "costOfMelting" : "100"
    },

    "16" : {
        "id" : "16",
        "name" : "Coal Ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "263",
        "weight" : WEIGHT_OF_BLOCKS,
    },

    "17" : {
        "id" : "17",
        "name" : "Wood",
        "type" : "wood",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "17",
        "weight" : WEIGHT_OF_BLOCKS,
        "meltingId" : "263",
        "costOfMelting" : "100"
    },

    "18" : {
        "id" : "18",
        "name" : "Leaf",
        "type" : "leaf",
        "isBlock" : true,
        "dropId" : "18",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "20" : {
        "id" : "20",
        "name" : "Glass",
        "isBlock" : true,
        "weight" : WEIGHT_OF_BLOCKS
    },

    "56" : {
        "id" : "56",
        "name" : "Diamond Ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "264",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "263" : {
        "id" : "263",
        "name" : "Coal",
        "weight" : WEIGHT_OF_ORES

    },

    "264" : {
        "id" : "264",
        "name" : "Diamond",
        "weight" : WEIGHT_OF_ORES
    },

    "265" : {
        "id" : "265",
        "name" : "Iron",
        "weight" : WEIGHT_OF_ORES
    },

    "266" : {
        "id" : "266",
        "name" : "Gold",
        "weight" : WEIGHT_OF_ORES
    },

    "256" : {
        "id" : "256",
        "name" : "Iron Shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : IRON_DURABILITY,
        "efficiency" : IRON_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "257" : {
        "id" : "257",
        "name" : "Iron Pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : IRON_DURABILITY,
        "efficiency" : IRON_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "258" : {
        "id" : "258",
        "name" : "Iron Axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : IRON_DURABILITY,
        "efficiency" : IRON_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "269" : {
        "id" : "269",
        "name" : "Wooden Shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : WOODEN_DURABILITY,
        "efficiency" : WOODEN_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "270" : {
        "id" : "270",
        "name" : "Wooden Pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : WOODEN_DURABILITY,
        "efficiency" : WOODEN_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "271" : {
        "id" : "271",
        "name" : "Wooden Axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : WOODEN_DURABILITY,
        "efficiency" : WOODEN_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "273" : {
        "id" : "273",
        "name" : "Stone Shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : STONE_DURABILITY,
        "efficiency" : STONE_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "274" : {
        "id" : "274",
        "name" : "Stone Pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : STONE_DURABILITY,
        "efficiency" : STONE_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "275" : {
        "id" : "275",
        "name" : "Stone Axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : STONE_DURABILITY,
        "efficiency" : STONE_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "277" : {
        "id" : "277",
        "name" : "Diamond Shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "278" : {
        "id" : "278",
        "name" : "Diamond Pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "279" : {
        "id" : "279",
        "name" : "Diamond Axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "370" : {
        "id" : "370",
        "name" : "Scissors",
        "type" : "leaf",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    }

};