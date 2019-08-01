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
let _renderingUIArr;
let _interactiveUIArr = [];
let defaultWidth = 1920;
let defaultHeight = 1080;

let UIMap = new Map();

setOnClickListener = (sprite, action, releaseAction) => {
    sprite.click = action;
    if (releaseAction) {
        sprite.onRelease = releaseAction;
    }
    sprite.interactive = true;
}

class Sprite {
    constructor(image, rect, indent, props) {
        this.recountRect = undefined;
        this.children = [];
        this.image = image;
        this.rect = rect;
        this.indent = indent;
        this.props = props;
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
                _interactiveUIArr = [];
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
                    'tex': image[2],
                    'id': this.id
                };
            }
            if (this.interactive) {
                _interactiveUIArr.push({
                    'sprite': this,
                    'pa': [ Math.max(parent.ca[0], pa[0]), Math.max(parent.ca[1], pa[1]) ],
                    'pb': [ Math.min(parent.cb[0], pb[0]), Math.min(parent.cb[1], pb[1]) ],
                    'id': this.id
                });
            }

            for (let i = 0; i < this.children.length; i++) {
                ans = ans.concat(this.children[i].draw({
                    'pa': pa,
                    'pb': pb,
                    'ca': [ Math.max(parent.ca[0], pa[0]), Math.max(parent.ca[1], pa[1]) ],
                    'cb': [ Math.min(parent.cb[0], pb[0]), Math.min(parent.cb[1], pb[1]) ],
                    'id': this.id
                }));
            }
            return ans;
        }

        this.add = (obj) => {
            this.children.push(obj);
            obj.parent = this;
        }

        this.deleteChild = (id) => {
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i].id === id) {
                    this.children.splice(i, 1);
                }
            }
        }

        this.deleteChildren = () => {
            this.children = [];
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
Sprite.pixelScale = render.getCanvasSize()[0] / defaultWidth;

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
let inventoryOpened = false;
let lastCanvasSize = [ 0, 0 ];
const drawUI = () => {
    const _size = render.getCanvasSize();
    Sprite.pixelScale = _size[0] / defaultWidth;

    if (inventoryOpened) {
        reloadInv();
    }

    if (lastCanvasSize[0] !== _size[0] || lastCanvasSize[1] !== _size[1] || needUIRedraw) {
        _renderingUIArr = screenUI.draw();
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

const createItemCard = (number, id, text) => {
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

    if (text) {
        let textCard = new Sprite(
            undefined,
            {
                pa: {
                    x: undefined,
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
                    y: 20
                },
                pb: {
                    x: -15,
                    y: -20
                }
            });
        textCard.recountRect = (rect, indent, parent, image) => {
            rect.pa.x = (parent.pb[1] - parent.pa[1]) / (parent.pb[0] - parent.pa[0]);
        }
        textCard.add(createText(text));
        card.add(textCard);
    }

    return card;
}

const UISetFastInvItem = (id, index) => {
    needUIRedraw = true;
    let slot = UIMap.fastInv[index];
    slot.deleteChildren = [];
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

const getLetterTexture = (s) => {
    s = s.toUpperCase();
    if (s >= 'A' && s <= 'Z') {
        let x = (s.charCodeAt(0) - 'A'.charCodeAt(0)) % 8;
        let y = Math.floor((s.charCodeAt(0) - 'A'.charCodeAt(0)) / 8);
        return [
            [ (x + 0.015) / 8, y / 8 ],
            [ (x + 0.97) / 8, (y + 1) / 8 ],
            _fontUI
        ];
    } else if (s >= '0' && s <= '9') {
        let x = (s.charCodeAt(0) - '0'.charCodeAt(0) + 26) % 8;
        let y = Math.floor((s.charCodeAt(0) - '0'.charCodeAt(0) + 26) / 8);
        return [
            [ (x + 0.015) / 8, y / 8 ],
            [ (x + 0.97) / 8, (y + 1) / 8 ],
            _fontUI
        ];
    } else switch (s) {
        case ':':
            return [
                [ (4 + 0.015) / 8, 4 / 8 ],
                [ (4 + 0.97) / 8, (4 + 1) / 8 ],
                _fontUI
            ];
        case '-':
            return [
                [ (5 + 0.015) / 8, 4 / 8 ],
                [ (5 + 0.97) / 8, (4 + 1) / 8 ],
                _fontUI
            ];
        case '.':
            return [
                [ (6 + 0.015) / 8, 4 / 8 ],
                [ (6 + 0.97) / 8, (4 + 1) / 8 ],
                _fontUI
            ];
        case ',':
            return [
                [ (7 + 0.015) / 8, 4 / 8 ],
                [ (7 + 0.97) / 8, (4 + 1) / 8 ],
                _fontUI
            ];
        case '/':
            return [
                [ (0 + 0.015) / 8, 5 / 8 ],
                [ (0 + 0.97) / 8, (5 + 1) / 8 ],
                _fontUI
            ];
        case '!':
            return [
                [ (1 + 0.015) / 8, 5 / 8 ],
                [ (1 + 0.97) / 8, (5 + 1) / 8 ],
                _fontUI
            ];
        case '?':
            return [
                [ (2 + 0.015) / 8, 5 / 8 ],
                [ (2 + 0.97) / 8, (5 + 1) / 8 ],
                _fontUI
            ];
        case ';':
            return [
                [ (3 + 0.015) / 8, 5 / 8 ],
                [ (3 + 0.97) / 8, (5 + 1) / 8 ],
                _fontUI
            ];
        case ' ':
            return [
                [ (4 + 0.015) / 8, 5 / 8 ],
                [ (4 + 0.97) / 8, (5 + 1) / 8 ],
                _fontUI
            ];
        default: 
            throw new Error("Can not transform letter " + s + " to our font");
    }
}

const createText = (word) => {
    word = word.toUpperCase();
    let strings = word.split('\n');
    let stringHeight = 1 / strings.length;
    let textCard = new Sprite(
            undefined,
            {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 1,
                    y: stringHeight * strings.length
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
    for(let n = 0; n < strings.length; n++) {
        let wordCard = new Sprite(
            undefined,
            {
                pa: {
                    x: 0,
                    y: n * stringHeight
                },
                pb: {
                    x: undefined,
                    y: (n + 1) * stringHeight
                }
            },
            {
                pa: {
                    x: 0,
                    y: 3
                },
                pb: {
                    x: 0,
                    y: -3
                }
            });
        wordCard.recountRect = (rect, indent, parent, image) => {
            rect.pb.x = 2 / 3 * strings[n].length / strings.length * (parent.pb[1] - parent.pa[1]) / (parent.pb[0] - parent.pa[0]);
            if (rect.pb.x > 1) {
                rect.pb.y = (n + 1) * stringHeight - 1 / rect.pb.x * (parent.pb[1] - parent.pa[1]) / (parent.pb[0] - parent.pa[0]);
                rect.pb.x = 1;
            }
        }

        for(let i = 0; i < strings[n].length; i++) {
            wordCard.add(new Sprite(
            getLetterTexture(strings[n][i]),
            {
                pa: {
                    x: i / strings[n].length,
                    y: 0
                },
                pb: {
                    x: (i + 1) / strings[n].length,
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
            }));
        }
        textCard.add(wordCard);
    }
    return textCard;
}

const UIOpenInv = () => {
    inventoryOpened = true;
    if (UIMap.invPanel) screenUI.deleteChild(UIMap.invPanel.id);
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
                y: -20
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
                y: 100
            },
            pb: {
                x: -5,
                y: -60
            }
        });
    let label = new Sprite(
        undefined,
        {
            pa: {
                x: 0,
                y: 1
            },
            pb: {
                x: 1,
                y: 1
            }
        },
        {
            pa: {
                x: 15,
                y: -50
            },
            pb: {
                x: -5,
                y: -10
            }
        });
    label.add(createText("Inventory " + player.inv.weight + "/" + player.inv.capacity));
    UIMap.invPanel.add(label);
    let scrollingContent = new Sprite(
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
                x: 0,
                y: 0
            },
            pb: {
                x: 0,
                y: 0
            }
        },
        {
            scrollX: 0
        });
    UIMap.invScrollingContent = scrollingContent;
    reloadInv();

    let downButton = new Sprite(
        [ [0.4385, 0.5635], [0.375, 0.501] ],
        {
            pa: {
                x: 1,
                y: 0
            },
            pb: {
                x: 1,
                y: 0
            }
        },
        {
            pa: {
                x: -200,
                y: 0
            },
            pb: {
                x: -100,
                y: 100
            }
        });
    setOnClickListener(downButton, () => {
        downButton.image = [ [0.4385 + 0.0625, 0.5635], [0.375 + 0.0625, 0.501] ];
        scrollingContent.props.scrollX -= 600 * deltaTime;
    },
    () => {
        downButton.image = [ [0.4385, 0.5635], [0.375, 0.501] ];
    });

    let upButton = new Sprite(
        [ [0.376, 0.501], [0.4375, 0.5625] ],
        {
            pa: {
                x: 1,
                y: 0
            },
            pb: {
                x: 1,
                y: 0
            }
        },
        {
            pa: {
                x: -100,
                y: 0
            },
            pb: {
                x: 0,
                y: 100
            }
        });
    setOnClickListener(upButton, () => {
        upButton.image = [ [0.376 + 0.0625, 0.501], [0.4375 + 0.0625, 0.5625] ];
        scrollingContent.props.scrollX += 600 * deltaTime;
    },
    () => {
        upButton.image = [ [0.376, 0.501], [0.4375, 0.5625] ];
    });

    invPanel.add(downButton);
    invPanel.add(upButton);

    invScrollPanel.add(scrollingContent);
    invPanel.add(invScrollPanel);
    UIMap.invScrollPanel = invScrollPanel;
    needUIRedraw = true;
    screenUI.add(invPanel);
}

const reloadInv = () => {
    let scrollingContent = UIMap.invScrollingContent;
    scrollingContent.deleteChildren();
    for (let i = 0; i < player.inv.items.length; i++) {
        if (player.inv.items[i]) {
            if (player.inv.items[i].id) {
                let card = createItemCard(i, player.inv.items[i].id,
                     "Weight: " + items[player.inv.items[i].id].weight + "\n"
                    + "\nDurability: " + player.inv.items[i].durability
                    + "\n" +items[player.inv.items[i].id].name);
                scrollingContent.add(card);
                card.indent.pa.y += scrollingContent.props.scrollX;
                card.indent.pb.y += scrollingContent.props.scrollX;
            } else {
                let card = createItemCard(i, player.inv.items[i],
                    "Weight: " + items[player.inv.items[i]].weight * player.inv.count[i]
                    + "\n\n" + "Count: " + player.inv.count[i]
                    + "\n"+items[player.inv.items[i]].name);
                scrollingContent.add(card);
                card.indent.pa.y += scrollingContent.props.scrollX;
                card.indent.pb.y += scrollingContent.props.scrollX;
            }
        }
    }
    needUIRedraw = true;
}

const UICloseInv = () => {
    inventoryOpened = false;
    screenUI.deleteChild(UIMap.invPanel.id);
    needUIRedraw = true;
}