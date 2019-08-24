let __cheat_seed = undefined;

const cheat = {
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
    
}

const writeScheme = (x, y, w, h) => {
    //writeScheme(130, 160, 30, 30)
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