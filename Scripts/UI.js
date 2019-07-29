let fullUI;  // Якорь в % + размер в пикселях
let screenUI;
let _array = [];

class Sprite {
    constructor(image, rect, indent) {
        this.children = [];
        this.image = image;
        this.rect = rect;
        this.indent = indent;
        this.id = Sprite.counter++;

        this.draw = (parent) => {
            let isScreenUI = false;
            if (parent === undefined) {
                parent = {
                    'pa': [0, 0],
                    'pb': render.getCanvasSize()
                };
                isScreenUI = true;
            }
            const pa = [
                parent.pa[0] + (parent.pb[0] - parent.pa[0]) * rect.pa.x + indent.pa.x * Sprite.pixelScale,
                parent.pa[1] + (parent.pb[1] - parent.pa[1]) * rect.pa.y + indent.pa.y * Sprite.pixelScale
            ], pb = [
                parent.pa[0] + (parent.pb[0] - parent.pa[0]) * rect.pb.x + indent.pb.x * Sprite.pixelScale,
                parent.pa[1] + (parent.pb[1] - parent.pa[1]) * rect.pb.y + indent.pb.y * Sprite.pixelScale
            ];

            let ans = [];
            if (!isScreenUI) {
                ans[0] = {
                    'pa': pa,
                    'pb': pb,
                    'ta': this.image[0],
                    'tb': this.image[1]
                };
            }
            for (let i = 0; i < this.children.length; i++) {
                ans = ans.concat(this.children[i].draw({
                    'pa': pa,
                    'pb': pb
                }));
            }
            return ans;
        }

        this.add = (obj) => {
            this.children.push(obj);
        }

        this.deleteChild = (id) => {
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i].id === id) {
                    this.children.splice(i, 1);
                    return;
                }
            }
        }

        this.get = (id) => {
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i].id === id) {
                    return this.children[i];
                }
            }
        }
    }
}

Sprite.counter = 1;
Sprite.pixelScale = 1;

// Возмращает _array по-умолчанию
const defaultUI = () => {
    fullUI = [[0, 0], [1, 1]];
    screenUI = new Sprite(fullUI, {
            pa: {
                x: 0,
                y: 0
            },
            pb: {
                x: 1,
                y: 1
            }
        }, {
            pa: {
                x: 0,
                y: 0
            },
            pb: {
                x: 0,
                y: 0
            }
        });
        screenUI.add(new Sprite(fullUI, {
            pa: {
                x: 0,
                y: 0
            },
            pb: {
                x: 1,
                y: 1
            }
        }, {
            pa: {
                x: 0,
                y: 0
            },
            pb: {
                x: 0,
                y: 0
            }
        }));
}

// Вызывается каждый кадр после EventTick
const drawUI = () => {
    const _size = render.getCanvasSize(); // получаем размер экрана

        /* .drawObjects(texture, array)
        * texture - текстура, полученная из .createTexture
        * array - массив, состоящий из объектов вида:
        * {'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY]}
            * pa - нижний левый угол позиции объекта
            * pb - верхний правый угол позиции объекта
            * ta - нижний левый угол текстурных координат
            * tb - ерхний правый угол текстурных координат
        Вызывать можно только после .render! */
        _array = screenUI.draw();
        console.log(_array);
        return true;
        // Возвращает true, если требуется перерисовка интерфейса
}