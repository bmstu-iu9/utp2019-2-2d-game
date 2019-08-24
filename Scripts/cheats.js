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
}

const __cheat_apply = () => {
    //Вызывается при загрузке мира
}