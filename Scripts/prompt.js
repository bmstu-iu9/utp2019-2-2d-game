'use strict';

const prompts = [
    {
        condition: () => gameArea.get(Math.floor(player.x) - 1, Math.floor(player.y), player.layout) === 17
            || gameArea.get(Math.floor(player.x) + 1, Math.floor(player.y), player.layout) === 17,
        message: "press s to switch to another layer"
    },

    {
        condition: () => player.bp !== player.maxBP,
        message: "you are choking underwater. pop up to stop it."
    }
];


class PromptSet {
    constructor() {
        this.set = new Set();
        this.add = (condition, message, time = 1) => {
            const lines = message.split("\n");
            message = lines[lines.length - 1];
            for (let i = lines.length - 2; i >= 0; i--) {
                message += "\n" + lines[i];
            }
            this.set.add({
                condition: condition,
                message: message,
                time: time
            });
        }

        this.addAll = (array) => {
            for (let i = 0; i < array.length; i++) {
                this.add(array[i].condition, array[i].message, array[i].time);
            }
        }
        this.check = () => {
            for (let p of this.set) {
                if (p.condition()) {
                    // Если открыта старая подсказка, то нужно заспамить новую
                    const timeId = setInterval(() => {
                        if (p.condition()) {
                            showFloatMessage(p.message, p.time);
                        } else {
                            clearInterval(timeId);
                            this.set.delete(p);
                        }
                    }, p.time / 2);
                    return;
                }
            }
        }
    }
}

const promptSet = new PromptSet();
promptSet.addAll(prompts);
