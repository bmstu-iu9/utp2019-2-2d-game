let blockTable = {
    "1" : {
        "id" : "1",
        "type" : "stone",
        "durability" : 7000,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "stone"
    },

    "2" : {
        "id" : "2",
        "type" : "dirt",
        "durability" : 1500,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "grass"
    },

    "3" : {
        "id" : "3",
        "type" : "dirt",
        "durability" : 1500,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "dirt"
    },

    "7" : {
        "id" : "7",
        "type" : "bedrock",
        "durability" : 100000,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "bedrock"
    },

    "8" : {
        "id" : "8",
        "type" : "water",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "hasGravity" : true,
        "density" : 0.5,
        "name" : "water",
        "isNaturalLight" : true
    },

    "9" : {
        "id" : "9",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-image"
    },

    "12" : {
        "id" : "12",
        "type" : "dirt",
        "durability" : 1200,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "sand"
    },

    "16" : {
        "id" : "16",
        "type" : "stone",
        "durability" : 8000,
        "brightness" : 0,
        "isCollissed" : true,
        "name" : "coal-ore"
    },

    "17" : {
        "id" : "17",
        "type" : "wood",
        "durability" : 4000,
        "brightness" : 0,
        "isCollissed" : false,
        "name" : "wood"
    },

    "18" : {
        "id" : "18",
        "type" : "leaf",
        "durability" : 500,
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
    },

    "9000" : {
        "id" : "9000",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-0"
    },

    "9001" : {
        "id" : "9001",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-1"
    },
    "9002" : {
        "id" : "9002",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-2"
    },
    "9003" : {
        "id" : "9003",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-3"
    },
    "9004" : {
        "id" : "9004",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-4"
    },
    "9005" : {
        "id" : "9005",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-5"
    },
    "9006" : {
        "id" : "9006",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-6"
    },
    "9007" : {
        "id" : "9007",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-7"
    },
    "9008" : {
        "id" : "9008",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-8"
    },
    "9009" : {
        "id" : "9009",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-9"
    },
    "9010" : {
        "id" : "9010",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-10"
    },
    "9011" : {
        "id" : "9011",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-11"
    },
    "9012" : {
        "id" : "9012",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-12"
    },
    "9013" : {
        "id" : "9013",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-13"
    },
    "9014" : {
        "id" : "9014",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-14"
    },

    "9015" : {
        "id" : "9015",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-15"
    },

    "9016" : {
        "id" : "9016",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-16"
    },

    "9017" : {
        "id" : "9017",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-17"
    },

    "9018" : {
        "id" : "9018",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-18"
    },

    "9019" : {
        "id" : "9019",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-19"
    },
    "9020" : {
        "id" : "9020",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-20"
    },

    "9021" : {
        "id" : "9021",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-21"
    },

    "9022" : {
        "id" : "9022",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-22"
    },

    "9023" : {
        "id" : "9023",
        "type" : "flowingWater",
        "durability" : 1000,
        "brightness" : 6,
        "isCollissed" : false,
        "isNaturalLight" : true,
        "name" : "flowing-water-23"
    }

};