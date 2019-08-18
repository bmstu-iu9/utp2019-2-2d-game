class PromptSet {
    constructor() {
        this.set = new Set();
        this.add = (condition, message, time = 2) => {
            this.set.add({
                condition: condition,
                message: message,
                time: time
            });
        }
        this.check = () => {
            for (let p of this.set) {
                if (p.condition()) {
                    showFloatMessage(p.message, p.time);
                    this.set.delete(p);
                    return;
                }
            }
        }
    }
}
const promptSet = new PromptSet();
promptSet.add(
    () => gameArea.get(Math.floor(player.x) - 1, Math.floor(player.y), player.layout) === 17
        || gameArea.get(Math.floor(player.x) + 1, Math.floor(player.y), player.layout) === 17,
    "press s to switch to another layer",
);