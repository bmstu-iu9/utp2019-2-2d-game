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

        this.add = (name, path, volume) => {
            if (this.storage[name] !== undefined) {
                console.error('Sound "' + name + '" already exist');
            }
            this.put(name, path, volume);
        }

        this.put = (name, path, vol) => {
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

        this.smoothPause = (name, time) => {
            const currentVol = this.getVol(name);
            for (let i = 0.1; i <= 1; i += 0.1) {
                setTimeout(this.setVol, i * time * 1000 , name, currentVol * (1 - i));
            }
        }

        this.smoothPlay = (name, time, targetVol) => {
            this.setVol(name, 0);
            this.playLoop(name);
            for (let i = 0.1; i <= 1; i += 0.1) {
                setTimeout(this.setVol, i * time * 1000, name, targetVol * i);
            }
        }

        this.smoothVolChange = (name, time, beginVol, endVol, steps = 10) => {
            for (let i = 0; i <= steps; i++) {
                setTimeout(this.setVol, i / steps * time * 1000, name, beginVol + i / steps * (endVol - beginVol));
            }
        }
    }
}