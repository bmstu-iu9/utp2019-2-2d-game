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
        "name" : "stone",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "4",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "2" : {
        "id" : "2",
        "name" : "grass",
        "type" : "leaf",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "2",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "3" : {
        "id" : "3",
        "name" : "dirt",
        "type" : "dirt"
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "3",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "4" : {
        "id" : "4",
        "name" : "cobblestone",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "4",
        "weight" : WEIGHT_OF_BLOCKS,
        "isGoodMelting" : "1",
        "costOfMelting" : "100"
    },

    "5" : {
        "id" : "5",
        "name" : "wood-planks",
        "type" : "wood",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "5",
        "weight" : WEIGHT_OF_BLOCKS,
        "isGoodMelting" : "263",
        "costOfMelting" : "50"
    },

    "7" : {
        "id" : "7",
        "name" : "bedrock",
        "isBlock" : true,
        "weight" : "2"
    },

    "8" : {
        "id" : "8",
        "name" : "water",
        "dropId" : "326"
        "weight" : WEIGHT_OF_INSTRUMETS,
    },


    "12" : {
        "id" : "12",
        "name" : "sand",
        "type" : "dirt",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "12",
        "weight" : WEIGHT_OF_BLOCKS,
        "isGoodMelting" : "20",
        "costOfMelting" : "100"
    },

    "14" : {
        "id" : "14",
        "name" : "golden-ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "14",
        "weight" : WEIGHT_OF_BLOCKS,
        "isGoodMelting" : "14",
        "costOfMelting" : "100"

    },

    "15" : {
        "id" : "15",
        "name" : "iron-ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "15",
        "weight" : WEIGHT_OF_BLOCKS, 
        "isGoodMelting" : "15",
        "costOfMelting" : "100"
    },

    "16" : {
        "id" : "16",
        "name" : "coal-ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "263",
        "weight" : WEIGHT_OF_BLOCKS,
    },

    "17" : {
        "id" : "17",
        "name" : "wood",
        "type" : "wood",
        "isBlock" : true,
        "isAlwaysGoodDestroy" : true,
        "dropId" : "17",
        "weight" : WEIGHT_OF_BLOCKS,
        "isGoodMelting" : "263",
        "costOfMelting" : "100"
    },

    "18" : {
        "id" : "18",
        "name" : "leaf",
        "type" : "leaf",
        "isBlock" : true,
        "dropId" : "18",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "20" : {
        "id" : "20",
        "name" : "glass",
        "isBlock" : true,
        "weight" : WEIGHT_OF_BLOCKS
    },

    "56" : {
        "id" : "56",
        "name" : "diamond-ore",
        "type" : "stone",
        "isBlock" : true,
        "dropId" : "264",
        "weight" : WEIGHT_OF_BLOCKS
    },

    "263" : {
        "id" : "263",
        "name" : "coal",
        "weight" : WEIGHT_OF_ORES

    },

    "264" : {
        "id" : "264",
        "name" : "diamond",
        "weight" : WEIGHT_OF_ORES
    },

    "265" : {
        "id" : "265",
        "name" : "iron",
        "weight" : WEIGHT_OF_ORES
    },

    "256" : {
        "id" : "256",
        "name" : "iron-shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : IRON_DURABILITY,
        "efficiency" : IRON_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "257" : {
        "id" : "257",
        "name" : "iron-pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : IRON_DURABILITY,
        "efficiency" : IRON_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "258" : {
        "id" : "258",
        "name" : "iron-axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : IRON_DURABILITY,
        "efficiency" : IRON_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "269" : {
        "id" : "269",
        "name" : "wooden-shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : WOODEN_DURABILITY,
        "efficiency" : WOODEN_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "270" : {
        "id" : "270",
        "name" : "wooden-pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : WOODEN_DURABILITY,
        "efficiency" : WOODEN_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "271" : {
        "id" : "271",
        "name" : "wooden-axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : WOODEN_DURABILITY,
        "efficiency" : WOODEN_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "273" : {
        "id" : "273",
        "name" : "stone-shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : STONE_DURABILITY,
        "efficiency" : STONE_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "274" : {
        "id" : "274",
        "name" : "stone-pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : STONE_DURABILITY,
        "efficiency" : STONE_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "275" : {
        "id" : "275",
        "name" : "stone-axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : STONE_DURABILITY,
        "efficiency" : STONE_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "277" : {
        "id" : "277",
        "name" : "diamond-shovel",
        "type" : "dirt",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "278" : {
        "id" : "278",
        "name" : "diamond-pickaxe",
        "type" : "stone",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "279" : {
        "id" : "279",
        "name" : "diamond-axe",
        "type" : "wood",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    },

    "370" : {
        "id" : "370",
        "name" : "scissors",
        "type" : "leaf",
        "isTool" : true,
        "durability" : DIAMOND_DURABILITY,
        "efficiency" : DIAMOND_EFFICIENCY,
        "weight" : WEIGHT_OF_INSTRUMETS
    }

};