class AudioStorage {
    constructor() {
        this.storage = {};
        this.smart = {};

        // Воспроизводится, пока вызывается этот метод (каждый кадр нужно вызывать newFrame)
        this.smartPlay = (name) => {
            if (this.smart[name] === undefined) {
                if (this.storage[name] === undefined) {
                    throw("Audio " + name + " doesn't exist")
                }
                this.smart[name] = true;
                this.playLoop(name);
            }
        }

        this.newFrame = () => {
            for (let name in this.smart) {
                if (this.smart[name] === undefined) {
                    delete this.smart[name];
                    this.stop(name);
                } else {
                    this.smart[name] = undefined;
                }
            }
        }

        this.add = (name, path) => {
            if (this.storage[name] !== undefined) {
                console.error('Sound "' + name + '" already exist');
            }
            this.put(name, path);
        }

        this.put = (name, path) => {
            this.storage[name] = new Audio();
            this.storage[name].src = path;
        }

        this.playLoop = (name) => {
            this.storage[name].loop = true;
            this.storage[name].play();
        }

        this.playOnce = (name) => {
            this.storage[name].loop = false;
            this.storage[name].play();
        }

        this.pause = (name) => {
            this.storage[name].pause();
        }

        this.stop = (name) => {
            this.storage[name].currentTime = 0;
            this.pause(name);
        }
    }
}