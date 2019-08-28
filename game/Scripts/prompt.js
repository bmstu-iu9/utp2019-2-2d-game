'use strict';

const prompts = [
    {  // start prompt
        startCondition: () => !controller.left.active && !controller.right.active,
        stopCondition: () => controller.left.active || controller.right.active,
        message: "press -a- or -d- to move"
    },

    {  // second prompt
        startCondition: () => controller.left.active || controller.right.active,
        stopCondition: () => controller.up.active,
        message: "press -w- to jump"
    },

    {
        startCondition: () => controller.up.active,
        stopCondition: () => controller.mouse.click === 1,
        message: "hold LMB to destroy the block.",
        time: 5
    },

    {
        startCondition: () => controller.mouse.click === 1,
        stopCondition: () => controller.f.active,
        message: "press -f- to save world,      \npress -g- to delete world.",
        time: 3
    },

    {
        startCondition: () => player.hand.info !== undefined && player.hand.info.isBlock,
        stopCondition: () => player.hand.info === undefined,
        message: "right click to place the block.",
        time: 5
    },

    {
        startCondition: () => gameArea.get(Math.floor(player.x) - 1, Math.floor(player.y), player.layout) === 17
            || gameArea.get(Math.floor(player.x) + 1, Math.floor(player.y), player.layout) === 17,
        stopCondition: () => controller.down.active,
        message: "press -s- to switch to another layer."
    },

    {
        startCondition: () => items[gameArea.map[Math.floor(player.x + Player.HEAD_X)]
            [Math.floor(player.y + Player.HEAD_Y)][player.layout]].type === "water",
        stopCondition: () => items[gameArea.map[Math.floor(player.x + Player.HEAD_X)]
            [Math.floor(player.y + Player.HEAD_Y)][player.layout]].type !== "water",
        message: "you are choking under water. press w to pop up",
        time: 3
    },

    {
        startCondition: () => player.sp / player.maxSP < 0.1,
        stopCondition: () => player.sp / player.maxSP > 0.1,
        message: "you are tired. stop jumping and mining to relax.",
        time: 3
    },

    {
        startCondition: () => player.hp !== player.maxHP && player.sp !== player.maxSP,
        stopCondition: () => player.sp === player.maxSP,
        message: "you got a damage. keep full stamina to heal.",
        time: 3
    },

    {
        startCondition: () => player.inv.weight !== 0,
        stopCondition: () => controller.inv.active || controller.craft.active,
        message: "press -i- to open inventary,\npress -o- to open crafts.       "  // Баг с отчетом символов
    }
];


class PromptSet {
    constructor() {
        this.timeId = undefined;
        this.set = new Set();
        this.add = (startCondition, stopCondition, message, time) => {
            const lines = message.split("\n");
            message = lines[lines.length - 1];
            for (let i = lines.length - 2; i >= 0; i--) {
                message += "\n" + lines[i];
            }
            this.set.add({
                startCondition: startCondition,
                stopCondition: stopCondition,
                message: message,
                time: time
            });
        }
        this.addAll = (array) => {
            for (let i = 0; i < array.length; i++) {
                this.add(array[i].startCondition, array[i].stopCondition, array[i].message, array[i].time);
            }
        }
        this.check = () => {
            for (let p of this.set) {
                if (p.startCondition()) {
                    const tmp = p;
                    if (this.timeId !== undefined) {
                        clearInterval(this.timeId);
                    }
                    this.set.delete(p);
                    showFloatMessage(tmp.message, tmp.time);
                    // Если открыта старая подсказка, то нужно заспамить новую
                    this.timeId = setInterval(() => {
                        if (tmp.stopCondition()) {
                            clearInterval(this.timeId);
                        } else {
                            showFloatMessage(tmp.message, tmp.time);
                        }
                    }, 50);
                    return;
                }
            }
        }
    }
}

const promptSet = new PromptSet();
promptSet.addAll(prompts);
