/*
Как использовать?

методы:
add(Имя, Путь, Громкость) - добавить новую аудиодорожку
put(Имя, Путь, Громкость) - изменить аудиодорожку
smartPlay(Имя) - вызывется каждый кадр, если звук должен воспроизводиться
pause(Имя) - поставить на пуазу
stop(Имя) - пауза + сброс дорожки на начало
playLoop(Имя) - воспроизводить по кругу
playOnce(Имя) - воспроизвести всю дорожку один раз
getVol(Имя) \ setVol(Имя, Значение) - громкость
smoothPause(Имя, ВремяВСек) - плавное затухание
smoothPlay и smoothVolChange(name, time, beginVol, endVol, steps = 10) - аналогично
*/


class AudioStorage {
    constructor() {
        this.storage = {};
        this.smart = {};

        // Воспроизводится, пока вызывается этот метод (каждый кадр нужно вызывать newFrame)
        this.smartPlay = (name) => {
            if (this.smart[name] === undefined) {
                this.playLoop(name);
            }
            this.smart[name] = true;
        }

        this.smartPlayOnce = (name) => {
            if (this.smart[name] === undefined) {
                this.playOnce(name);
            }
            this.smart[name] = true;
        }

        this.newFrame = () => {
            for (let name in this.smart) {
                if (this.smart[name] === false) {
                    delete this.smart[name];
                    this.stop(name);
                } else {
                    this.smart[name] = false;
                }
            }
        }

        this.add = (name, path, volume = 1) => {
            if (this.storage[name] !== undefined) {
                console.error('Sound "' + name + '" already exist');
            }
            this.put(name, path, volume);
        }

        this.put = (name, path, vol = 1) => {
            this.storage[name] = new Audio();
            this.storage[name].src = path;
            this.storage[name].volume = vol;
        }

        this.isPlaying = (name) => {
            return !this.storage[name].paused;
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

        this.setVol = (name, vol) => {
            this.storage[name].volume = vol;
        }

        this.getVol = (name) => {
            return this.storage[name].volume;
        }

        this.smoothVolChange = (name, time, beginVol, endVol, steps = 10) => {
            for (let i = 0; i <= steps; i++) {
                setTimeout(this.setVol, i / steps * time * 1000, name, beginVol + i / steps * (endVol - beginVol));
            }
        }

        this.smoothPause = (name, time) => {
            const curVol = this.getVol(name);
            this.smoothVolChange(name, time, curVol, 0);
            setTimeout(this.stop, time * 1000, name);
            setTimeout(this.setVol, time * 1000, name, curVol);
        }

        this.smoothPlay = (name, time, targetVol) => {
            this.setVol(name, 0);
            this.playLoop(name);
            this.smoothVolChange(name, time, 0, targetVol);
        }
    }
}