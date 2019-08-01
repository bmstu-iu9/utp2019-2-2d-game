var __cheat_fullbright = true;
var __cheat_spectator = true;
var __cheat_seed = undefined;

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
    },
    mv(x, y) {
        player.fx += x;
        player.fy += y;
    }
}