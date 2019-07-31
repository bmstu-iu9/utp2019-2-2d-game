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
let _array;
let defaultWeight = 1920;
let defaultHeight = 1080;

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
                this.recountRect(this.rect, this.indent, parent, this.image);
            }

            let isScreenUI = false;
            if (parent === undefined) {
                parent = {
                    'pa': [0, 0],
                    'pb': render.getCanvasSize(),
                    'ca': [0, 0],
                    'cb': render.getCanvasSize()
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
                    'tb': this.image[1],
                    'ca': parent.ca,
                    'cb': parent.cb,
                    'tex': image[2]
                };
            }
            for (let i = 0; i < this.children.length; i++) {
                ans = ans.concat(this.children[i].draw({
                    'pa': pa,
                    'pb': pb,
                    'ca': [ Math.max(parent.ca[0], pa[0]), Math.max(parent.ca[1], pa[1]) ],
                    'cb': [ Math.min(parent.cb[0], pb[0]), Math.min(parent.cb[1], pb[1]) ]
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
                    //return;
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
Sprite.pixelScale = (render.getCanvasSize()[0] / defaultWeight + render.getCanvasSize()[1] / defaultHeight) / 2;

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
        // Инвентарь
        let invPanel = new Sprite(
            [ [0, 0.51], [0.125, 0.615] ],
            {
                pa: {
                    x: 0,
                    y: undefined
                },
                pb: {
                    x: 1 / 3,
                    y: 1
                }
            },
            {
                pa: {
                    x: 20,
                    y: 40
                },
                pb: {
                    x: 10,
                    y: - 20
                }
            });
        invPanel.recountRect = (rect, indent, parent, image) => {
            rect.pa.y = rect.pb.x / 8 * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        UIMap.invPanel = invPanel;
       
        let invScrollPanel = new Sprite(
            undefined,
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1,
                    y: 1
                }
            },
            {
                pa: {
                    x: 5,
                    y: 10
                },
                pb: {
                    x: -5,
                    y: -5
                }
            });
        for (let i = 0; i < 10; i++) {
            invScrollPanel.add(createItemCard(i, 1));
        }
        invPanel.add(invScrollPanel);
        UIMap.invScrollPanel = invScrollPanel;
        
        //screenUI.add(invPanel);
        // Кастомное окно по середине
        let actionPanel = new Sprite(
            [ [0, 0.5], [0.125, 0.625] ],
            {
                pa: {
                    x: 1 / 3,
                    y: 0
                },
                pb: {
                    x: 3 / 4,
                    y: 1
                }
            },
            {
                pa: {
                    x: 30,
                    y: 20
                },
                pb: {
                    x: - 30,
                    y: - 20
                }
            });
        UIMap.actionPanel = actionPanel;
        //screenUI.add(actionPanel);

        // Быстрый инвентарь
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
        fastInvPanel.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = rect.pb.x / 8 * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
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


        UIMap.bars = [];
        UIMap.barsPanel = new Sprite(
            undefined,
            {
                pa: {
                    x: 3 / 4,
                    y: 0
                },
                pb: {
                    x: 1,
                    y: 1
                }
            },
            {
                pa: {
                    x: -20,
                    y: 20
                },
                pb: {
                    x: -20,
                    y: 20
                }
            });

        UIMap.healthBarEmpty = new Sprite([ [0, 0.25], [202 / 256, 0.3125] ],
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1,
                    y: undefined
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

        UIMap.healthBarEmpty.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        UIMap.barsPanel.add(UIMap.healthBarEmpty);

        UIMap.healthBar = new Sprite([ [0, 0.3125], [202 / 256, 0.375] ],
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1,
                    y: undefined
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
        UIMap.healthBar.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        UIMap.bars[0] = {
            empty: UIMap.healthBarEmpty,
            bar: UIMap.healthBar,
            priority: 0
        }
        UIMap.barsPanel.add(UIMap.healthBar);

        UIMap.breathBarEmpty = new Sprite([ [0, 0.25], [202 / 256, 0.3125] ],
            {
                pa: {
                    x: 0,
                    y: undefined
                },
                pb: {
                    x: 1,
                    y: undefined
                }
            },
            {
                pa: {
                    x: 0,
                    y: 5
                },
                pb: {
                    x: 0,
                    y: 5
                }
            });
        UIMap.breathBarEmpty.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = 2 * (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
            rect.pa.y = (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        UIMap.barsPanel.add(UIMap.breathBarEmpty);

        UIMap.breathBar = new Sprite([ [0, 0.375], [202 / 256, 0.4375] ],
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1,
                    y: undefined
                }
            },
            {
                pa: {
                    x: 0,
                    y: 5
                },
                pb: {
                    x: 0,
                    y: 5
                }
            });
        UIMap.breathBar.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = 2 * (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
            rect.pa.y = (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        UIMap.bars[5] = {
            empty: UIMap.breathBarEmpty,
            bar: UIMap.breathBar,
            priority: 5
        }
        UIMap.barsPanel.add(UIMap.breathBar);



        UIMap.staminaBarEmpty = new Sprite([ [0, 0.25], [202 / 256, 0.3125] ],
            {
                pa: {
                    x: 0,
                    y: undefined
                },
                pb: {
                    x: 1,
                    y: undefined
                }
            },
            {
                pa: {
                    x: 0,
                    y: 5
                },
                pb: {
                    x: 0,
                    y: 5
                }
            });
        UIMap.staminaBarEmpty.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = 2 * (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
            rect.pa.y = (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        UIMap.barsPanel.add(UIMap.staminaBarEmpty);

        UIMap.staminaBar = new Sprite([ [0, 0.4375], [202 / 256, 0.5] ],
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1,
                    y: undefined
                }
            },
            {
                pa: {
                    x: 0,
                    y: 5
                },
                pb: {
                    x: 0,
                    y: 5
                }
            });
        UIMap.staminaBar.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = 2 * (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
            rect.pa.y = (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        UIMap.bars[1] = {
            empty: UIMap.staminaBarEmpty,
            bar: UIMap.staminaBar,
            priority: 1
        }
        UIMap.barsPanel.add(UIMap.staminaBar);



        screenUI.add(UIMap.barsPanel);
}

// Вызывается каждый кадр после EventTick
let needUIRedraw = false;
let lastCanvasSize = [ 0, 0 ];
const drawUI = () => {
    const _size = render.getCanvasSize();
    Sprite.pixelScale = (_size[0] / defaultWeight + _size[1] / defaultHeight) / 2;

    if (lastCanvasSize[0] !== _size[0] || lastCanvasSize[1] !== _size[1] || needUIRedraw) {
        _array = screenUI.draw();
        needUIRedraw = false;
        lastCanvasSize = _size;
    }
}

const UISetActiveSlot = (index) => {
    needUIRedraw = true;
    UIMap.activeSlot.rect.pa.x = index / 8;
    UIMap.activeSlot.rect.pb.x = (index + 1) / 8;
}

const UISetBar = (count, bar, length, height, padding, number) => {
    needUIRedraw = true;
    let bars = UIMap.bars;
    let priority = number;
    for(let i = number - 1; i >= 0; i--) {
        if (bars[i] === undefined || !UIMap.barsPanel.get(bars[i].bar.id)) number--;
    }

    bar.image = [ bar.image[0], [ length * count / _UI.width, bar.image[1][1] ] ];
    bar.recountRect = (rect, indent, parent, image) => {
        rect.pb.y = (number + 1) * height / length * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        rect.pa.y = number * height / length * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        indent.pa.y = 5 * number;
        indent.pb.y = 5 * number;
        rect.pb.x = count;
    }
    bars[priority].empty.recountRect = (rect, indent, parent, image) => {
        rect.pb.y = (number + 1) * (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        rect.pa.y = number * (image[1][1] - image[0][1]) / (image[1][0] - image[0][0]) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        indent.pa.y = 5 * number;
        indent.pb.y = 5 * number;
    }
}

const createItemCard = (number, id) => {
    let card = new Sprite(
        [ [0.125, 0.51], [0.250, 0.615] ],
        {
            pa: {
                x: 0,
                y: undefined
            },
            pb: {
                x: 1,
                y: undefined
            }
        },
        {
            pa: {
                x: 5,
                y: 5
            },
            pb: {
                x: -5,
                y: -5
            }
        });
    card.recountRect = (rect, indent, parent, image) => {
        let height = 1 / 4 * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        rect.pa.y = 1 - (number + 1) * height;
        rect.pb.y = 1 - number * height;
    }

    let slot = new Sprite(
        [ [0.250, 0.51], [0.375, 0.615] ],
        {
            pa: {
                x: 0,
                y: 0
            },
            pb: {
                x: undefined,
                y: 1
            }
        },
        {
            pa: {
                x: 15,
                y: 15
            },
            pb: {
                x: -15,
                y: -15
            }
        });
    slot.recountRect = (rect, indent, parent, image) => {
        rect.pb.x = (parent.pb[1] - parent.pa[1]) / (parent.pb[0] - parent.pa[0]);
    }
    card.add(slot);

    if (id) {
        let item = new Sprite(
        items[id].texture(),
        {
            pa: {
                x: 0,
                y: 0
            },
            pb: {
                x: 1,
                y: 1
            }
        },
        {
            pa: {
                x: 15,
                y: 15
            },
            pb: {
                x: -15,
                y: -15
            }
        });
        slot.add(item);
    }

    return card;
}

const UISetFastInvItem = (id, index) => {
    let slot = UIMap.fastInv[index];
    slot.children = [];
    if (id) {
        slot.add(new Sprite(
        items[id].texture(),
        {
            pa: {
                x: 0,
                y: 0
            },
            pb: {
                x: 1,
                y: 1
            }
        },
        {
            pa: {
                x: 15,
                y: 15
            },
            pb: {
                x: -15,
                y: -15
            }
        }));
    }
}