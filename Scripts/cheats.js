var __cheat_fullbright = true;
var __cheat_spectator = true;
var __cheat_seed = undefined;
var __cheat_freePlacement = true;
var __cheat_noLayout = true;

const cheat = {
    bright() {
        __cheat_fullbright = !__cheat_fullbright;
        console.log(`Set bright to ${__cheat_fullbright ? "fullbright" : "normal"}`);
    },
    spectator() {
        __cheat_spectator = !__cheat_spectator;
        console.log(`Set spectator mode to ${__cheat_spectator ? "enabled" : "disabled"}`);
    },
    seed() {
        console.log(`Seed: ${__cheat_seed}`);
    },
    tp(x, y) {
        if (arguments.length == 2) {
            player.fx = x;
            player.fy = y;
        }
        else if (arguments.length == 1) {
            player.fx = x.x;
            player.fy = x.y;
        } 
        cameraX = player.fx;
        cameraY = player.fy;
    },
    mv(x, y) {
        player.fx += x;
        player.fy += y;
    },
    freePlacement() {
        __cheat_freePlacement = !__cheat_freePlacement;
        console.log(`Set fullplacement to ${__cheat_freePlacement ? "fullbright" : "normal"}`);
    },
    get(id, count = 1) {
        player.addToInv(createItem(id, count));
    },
    layout(lay) {
        if (arguments.length === 0)
            lay = player.layout === GameArea.FIRST_LAYOUT ? 2 : 1
        player.layout = lay === 2 ? GameArea.SECOND_LAYOUT : GameArea.FIRST_LAYOUT;
        slicePlayer = (player.layout === GameArea.FIRST_LAYOUT) ? 1 : 2;

    }
}

const __cheat_apply = () => {
    cheat.tp(138, 227);
    cheat.get(790, 1);
    cheat.get(791, 1);
    cheat.get(21, 100);
    // cheat.get(55, 100);
    cheat.get(12, 40);
    cheat.get(19, 20)
}

const writeScheme = (x, y, w, h) => {
    //writeScheme(510, 810, 50, 20)
    const bMap = {
        2:  'm', //GRASS_BKOCK
        3:  'n', //DIRT_BLOCK
        4:  'c', //COBBLESTONE_BLOCK
        5:  'p', //WOOD_PLANKS_BLOCK
        8:  'i', //WATER_BLOCK
        10: 'j', //LAVA_BLOCK
        12: 'y', //SAND
        17: 'w', //WOOD_BLOCK
        19: 'l', //TORCH_BLOCK
        20: 'g', //GLASS_BLOCK
        21: 'b', //STONE_BRICK_BLOCK
        22: 'e', //CHEST
        60: 't', //TRAPDOOR_BLOCK
        62: 'd', //DOOR_BLOCK
    };
    let totalF = [];
    let totalS = [];
    for (let j = 0; j < h; j++) {
        let curF = [];
        let curS = [];
            for (let i = 0; i < w; i++) {
            let t = gameArea.get(x + i, y + j, GameArea.FIRST_LAYOUT);
            curF.push(t === undefined ? '.' : bMap[t]);
            t = gameArea.get(x + i, y + j, GameArea.SECOND_LAYOUT);
            curS.push(t === undefined ? '.' : bMap[t]);
        }
        totalF.push(curF.join(''));
        totalS.push(curS.join(''));
    }
    console.log(JSON.stringify(totalF));
    console.log(JSON.stringify(totalS));

}