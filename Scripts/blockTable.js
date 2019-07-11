let blockTable = {
    "1" : {
        "id" : "1",
        "type" : "stone",
        "durability" : 50,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "stone"
    },

    "2" : {
        "id" : "2",
        "type" : "dirt",
        "durability" : 20,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "grass"
    },

    "3" : {
        "id" : "3",
        "type" : "dirt",
        "durability" : 20,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "dirt"
    },

    "7" : {
        "id" : "7",
        "type" : "bedrock",
        "durability" : 100,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "bedrock"
    },

    "8" : {
        "id" : "8",
        "type" : "water",
        "durability" : 100,
        "brightness" : 0,
        "isCollissed" : false,
        "hasGravity" : true,
        "name" : "water"
    },

    "9" : {
        "id" : "8",
        "type" : "flowingWater",
        "durability" : 100,
        "brightness" : 0,
        "isCollissed" : false,
        "name" : "flowing-water-1"
    },

    "12" : {
        "id" : "12",
        "type" : "dirt",
        "durability" : 100,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "sand"
    },

    "16" : {
        "id" : "16",
        "type" : "stone",
        "durability" : 60,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "coal-ore"
    },

    "17" : {
        "id" : "17",
        "type" : "wood",
        "durability" : 35,
        "brightness" : 0,
        "isCollissed" : false,
        "name" : "wood"
    },

    "18" : {
        "id" : "18",
        "type" : "leaf",
        "durability" : 10,
        "brightness" : 0,
        "isCollissed" : false,
        "name" : "leaf"
    },

    "54" : {
      "id" : "54",
      "type" : "clickableBlocks",
      "durability" : 35,
      "brightness" : 0,
      "isCollissed" : false,
      "isClickable" : true,
      "interactFunction" : () => {
          alert("1");
      } // Функция взаимодействия у кликабельных предметов

    },

    "256" : {
        "id" : "256",
        "type" : "shovel",
        "durability" : 100,
        "isTool" : true,                 // Является ли инструментом
        "toolType" : "dirt",
        "layout" : GameArea.MAIN_LAYOUT, // Область, в которой действует инструмент
        "name" : "shovel"
    }
};