var __cheat_fullbright = false;
var __cheat_spectator = false;
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
        player.fx = x;
        player.fy = y;
    },
    mv(x, y) {
        player.fx += x;
        player.fy += y;
    }
}