/* .drawObjects(texture, array)
        * texture - текстура, полученная из .createTexture
        * array - массив, состоящий из объектов вида:
        * {'pa': [paX, paY], 'pb': [pbX, pbY], 'ta': [taX, taY], 'tb': [tbX, tbY]}
            * pa - нижний левый угол позиции объекта
            * pb - верхний правый угол позиции объекта
            * ta - нижний левый угол текстурных координат
            * tb - ерхний правый угол текстурных координат
        Вызывать можно только после .render!
        render.getCanvasSize() возвращает массив с размерами экрана*/


let fullUI;  // Якорь в % + размер в пикселях
let screenUI;

let UIMap = new Map();

class Sprite {
    constructor(image, rect, indent) {
        this.recountRect = undefined;
        this.children = [];
        this.image = image;
        this.rect = rect;
        this.indent = indent;
        this.id = Sprite.counter++;

        this.draw = (parent) => {
            if (this.recountRect) {
                this.recountRect(this.rect);
            }

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
            if (!isScreenUI && image !== undefined) {
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

// Инициализация интерфейса
const initUI = () => {
    const _size = render.getCanvasSize(); // получаем размер экрана
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

        let fastInvPanel = new Sprite(
            undefined,
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1 / 3,
                    y: (1 / 24) * _size[0] / _size[1]
                }
            },
            {
                pa: {
                    x: 20,
                    y: 20
                },
                pb: {
                    x: 20,
                    y: 20
                }
            });
        fastInvPanel.recountRect = (rect) => {
            let _size = render.getCanvasSize();
            rect.pb.y = rect.pb.x / 8 * _size[0] / _size[1];
        }
        UIMap.fastInvPanel = fastInvPanel;
        UIMap.fastInv = [];
        for(let i = 0; i < 8; i++) {
            let slot = new Sprite([ [0, 0], [0.25, 0.25] ],
                {
                    pa: {
                        x: i / 8,
                        y: 0
                    },
                    pb: {
                        x: (i + 1) / 8,
                        y: 1
                    }
                },
                {
                    pa: {
                        x: 0,
                        y: 0
                    },
                    pb: {
                        x: 0,
                        y: 0
                    }
                });
            UIMap.fastInv[i] = slot;
            fastInvPanel.add(slot);
        }
        UIMap.activeSlot = new Sprite([ [0.25, 0], [0.5, 0.25] ],
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1 / 8,
                    y: 1
                }
            },
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 0,
                    y: 0
                }
            });
        fastInvPanel.add(UIMap.activeSlot);


        screenUI.add(fastInvPanel);
}

// Изменения состояния интерфейса

const UISetActiveSlot = (index) => {
    UIMap.activeSlot.rect.pa.x = index / 8;
    UIMap.activeSlot.rect.pb.x = (index + 1) / 8;
}