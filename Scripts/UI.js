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
let _mouseMessageUIArr = [];
let defaultWidth = 1920;
let defaultHeight = 1080;

let UIMap = new Map();

const getBlockRect = (x, y, width, height) => {
    let _size = render.getCanvasSize();
    return {
        pa: {
            x: ((x - cameraX) * blockSize * cameraScale + _size[0] / 2) / _size[0],
            y: ((y - cameraY) * blockSize * cameraScale + _size[1] / 2) / _size[1]
        },
        pb: {
            x: ((x + width - cameraX) * blockSize * cameraScale + _size[0] / 2) / _size[0],
            y: ((y + height - cameraY) * blockSize * cameraScale + _size[1] / 2) / _size[1]
        }
    }
}

setOnClickListener = (sprite, clickAction, holdAction, releaseAction, longHoldAction) => {
    sprite.click = clickAction;
    sprite.hold = holdAction;
    sprite.release = releaseAction;
    sprite.longHold = longHoldAction;
    sprite.interactive = true;
}

// Обработка клика при отпускании ЛКМ
const clickAction = (sprite) => {
    if (!sprite) return;
    if (sprite.click) {
        sprite.click();
    } else if (sprite.release) {
        sprite.release();
    }
}

// Обработка длинного нажатия кнопки
let buttonLongHoldLength = 0.5;
const longHoldAction = (sprite) => {
    if (!sprite) return;
    if (sprite.longHold) {
        sprite.longHold();
    } else if (sprite.hold) {
        sprite.hold();
    }
}

// Обработка удержания кнопки
const holdAction = (sprite) => {
    if (!sprite) return;
    if (sprite.hold) {
        sprite.hold();
    }
}

// Обработка отводка курсора с кнопки
const releaseAction = (sprite) => {
    if (!sprite) return;
    if (sprite.release) {
        sprite.release();
    }
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
                this.recountRect(this.rect, this.indent, parent, this.image, this.props);
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
                _mouseMessageUIArr = [];
                isScreenUI = true;
            }

            this.pixelWidth = (parent.pb[0] - parent.pa[0]) / Sprite.pixelScale;
            this.pixelHeight = (parent.pb[1] - parent.pa[1]) / Sprite.pixelScale;

            const pa = [
                parent.pa[0] + (parent.pb[0] - parent.pa[0]) * rect.pa.x + indent.pa.x * Sprite.pixelScale,
                parent.pa[1] + (parent.pb[1] - parent.pa[1]) * rect.pa.y + indent.pa.y * Sprite.pixelScale
            ], pb = [
                parent.pa[0] + (parent.pb[0] - parent.pa[0]) * rect.pb.x + indent.pb.x * Sprite.pixelScale,
                parent.pa[1] + (parent.pb[1] - parent.pa[1]) * rect.pb.y + indent.pb.y * Sprite.pixelScale
            ];

            let ans = [];
            if (parent.ca[0] < parent.cb[0] && parent.ca[1] < parent.cb[1]) {
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
                if (this.mouseMessage) {
                    _mouseMessageUIArr.push({
                        'sprite': this,
                        'pa': [ Math.max(parent.ca[0], pa[0]), Math.max(parent.ca[1], pa[1]) ],
                        'pb': [ Math.min(parent.cb[0], pb[0]), Math.min(parent.cb[1], pb[1]) ],
                        'message': this.mouseMessage
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

                // Добавляем элементы поверх всего интерфейса
                if (isScreenUI) {
                    // Сообщение у мышки
                    if (mouseMessage) {
                        ans = ans.concat(mouseMessage.draw({
                            'pa': pa,
                            'pb': pb,
                            'ca': [ Math.max(parent.ca[0], pa[0]), Math.max(parent.ca[1], pa[1]) ],
                            'cb': [ Math.min(parent.cb[0], pb[0]), Math.min(parent.cb[1], pb[1]) ],
                            'id': this.id
                        }));
                    }
                }
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

let mouseMessage;
const showMouseMessage = (str) => {
    let fontSize = 40;
    let _size = render.getCanvasSize();
    let mouseX = controller.mouse.x;
    let mouseY = _size[1] - controller.mouse.y;

    let height = 1;
    let width = 0;
    let counter = 0;
    for(let i = 0; i < str.length; i++) {
        if (str[i] === '\n') {
            height++;
            counter = 0;
        } else {
            counter++;
            if (counter * 2 / 3 > width) width = counter * 2 / 3;
        }
    }

    let panel = new Sprite(
        [ [0, 0.51], [0.125, 0.615] ],
        {
            pa: {
                x: mouseX / _size[0],
                y: mouseY / _size[1]
            },
            pb: {
                x: mouseX / _size[0],
                y: mouseY / _size[1]
            }
        },
        {
            pa: {
                x: controller.mouse.x > _size[0] / 2 ? (-width * fontSize - 30) : 10,
                y: controller.mouse.y > _size[1] / 2 ? 10 : (-height * fontSize - 30)
            },
            pb: {
                x: controller.mouse.x > _size[0] / 2 ? -10 : (width * fontSize + 30),
                y: controller.mouse.y > _size[1] / 2 ? (height * fontSize + 30) : -10
            }
        });
    let darkPanel = new Sprite(
        [ [0.250, 0.51], [0.375, 0.615] ],
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
                y: 5
            },
            pb: {
                x: -5,
                y: -5
            }
        });
    panel.add(darkPanel);

    let contentPanel = new Sprite(
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
                x: 10,
                y: 10
            },
            pb: {
                x: -10,
                y: -10
            }
        });
    contentPanel.add(createText(str));

    darkPanel.add(contentPanel);

    mouseMessage = panel;
}

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
            setOnClickListener(slot, () => {
                let activeElement = UIMap.activeElement;
                if (activeElement && activeElement.props.type === 'invSlot') {
                    for(let i = 0; i < player.fastInv.length; i++) {
                        if (player.fastInv[i] === activeElement.props.invIndex) {
                            player.fastInv[i] = undefined;
                        }
                    }
                    player.fastInv[i] = activeElement.props.invIndex;
                    player.setHand(player.hand.index);
                    needInvRedraw = true;

                    UIMap.activeElement = undefined;
                }
            });
            UIMap.fastInv[i] = slot;
            fastInvPanel.add(slot);
        }

        let invButton = new Sprite([ [0.375 + 0.125, 0.501], [0.4385 + 0.125, 0.5635] ],
                {
                    pa: {
                        x: 9 / 24,
                        y: 0
                    },
                    pb: {
                        x: 10 / 24,
                        y: undefined
                    }
                },
                {
                    pa: {
                        x: 0,
                        y: 20
                    },
                    pb: {
                        x: 0,
                        y: 20
                    }
                },
                {
                    selected: [ [0.375 + 0.125, 0.501 + 0.0625], [0.4385 + 0.125, 0.5635 + 0.0625] ],
                    notSelected: [ [0.375 + 0.125, 0.501], [0.4385 + 0.125, 0.5635] ]
                });
        invButton.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = (rect.pb.x - rect.pa.x) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        setOnClickListener(invButton, () => {
            if (inventoryOpened) {
                UICloseInv();
                if (craftOpened) UICloseCraft();
            } else {
                UIOpenInv();
            }
        },
        () => {
            invButton.image = invButton.props.selected;
        },
        () => {
            invButton.image = invButton.props.notSelected;
        });
        UIMap.invButton = invButton;

        let craftButton = new Sprite([ [0.375 + 0.1875, 0.501], [0.4385 + 0.1875, 0.5635] ],
                {
                    pa: {
                        x: 10 / 24,
                        y: 0
                    },
                    pb: {
                        x: 11 / 24,
                        y: undefined
                    }
                },
                {
                    pa: {
                        x: 0,
                        y: 20
                    },
                    pb: {
                        x: 0,
                        y: 20
                    }
                },
                {
                    selected: [ [0.375 + 0.1875, 0.501 + 0.0625], [0.4385 + 0.1875, 0.5635 + 0.0625] ],
                    notSelected: [ [0.375 + 0.1875, 0.501], [0.4385 + 0.1875, 0.5635] ]
                });
        craftButton.recountRect = (rect, indent, parent, image) => {
            rect.pb.y = (rect.pb.x - rect.pa.x) * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);
        }
        setOnClickListener(craftButton, () => {
            if (craftOpened) {
                UICloseCraft();
            } else {
                UIOpenCraft();
                if (!inventoryOpened) UIOpenInv();
            }
        },
        () => {
            craftButton.image = craftButton.props.selected;
        },
        () => {
            craftButton.image = craftButton.props.notSelected;
        });
        UIMap.craftButton = craftButton;

        screenUI.add(invButton);
        screenUI.add(craftButton);

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
            },
            {
                animationStartX: 0,
                animationCurrentX: 0,
                animationTargetX: 0
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

        UISetBar(player.hp / player.maxHP, UIMap.healthBar, 202, 16, 1, 0);
        UISetBar(player.bp / player.maxBP, UIMap.breathBar, 202, 16, 1, 5);
        UISetBar(player.sp / player.maxSP, UIMap.breathBar, 202, 16, 1, 5);

        player.setHand(0);


        needUIRedraw = true;
        needCraftRedraw = true;
        needInvRedraw = true;
}

// Вызывается каждый кадр после EventTick
let needUIRedraw = false;
let needInvRedraw = false;
let needChestRedraw = true;
let inventoryOpened = false;
let chestOpened = undefined;
let lastChest = {
    x: 0,
    y: 0
}
let lastCanvasSize = [ 0, 0 ];
const drawUI = () => {
    const _size = render.getCanvasSize();
    Sprite.pixelScale = _size[0] / defaultWidth;

    // Анимации
    let animationSpeed = 5;

    let activeSlot = UIMap.activeSlot;
    if (activeSlot.props.animationTargetX !== activeSlot.props.animationCurrentX) {
        let direction = Math.sign(activeSlot.props.animationTargetX - activeSlot.props.animationCurrentX);
        let step = activeSlot.props.animationCurrentX
                    + (activeSlot.props.animationTargetX - activeSlot.props.animationStartX)
                        * animationSpeed * deltaTime;
        let index = (Math.sign(activeSlot.props.animationTargetX - step) !== direction)
                ? activeSlot.props.animationTargetX : step;

        activeSlot.props.animationCurrentX  = index;
        activeSlot.rect.pa.x = index / 8;
        activeSlot.rect.pb.x = (index + 1) / 8;
        needUIRedraw = true;
    }

    let invPanel = UIMap.invPanel;
    if (invPanel) {
        if (inventoryOpened) {
            if (invPanel.props.animationState < 1) {
                invPanel.props.animationState = Math.min(invPanel.props.animationState + animationSpeed * deltaTime, 1);
                needUIRedraw = true;
            }
        } else { 
            if (invPanel.props.animationState > 0) {
                invPanel.props.animationState = Math.max(invPanel.props.animationState - animationSpeed * deltaTime, 0);
            } else {
                screenUI.deleteChild(UIMap.invPanel.id);
                UIMap.invButton.image = UIMap.invButton.props.notSelected;
                UIMap.invPanel = undefined;
                needUIRedraw = true;
            }
        }
    }

    let craftPanel = UIMap.craftPanel;
    if (craftPanel) {
        if (craftOpened) {
            if (craftPanel.props.animationState < 1) {
                craftPanel.props.animationState = Math.min(craftPanel.props.animationState + animationSpeed * deltaTime, 1);
                needUIRedraw = true;
            }
        } else { 
            if (craftPanel.props.animationState > 0) {
                craftPanel.props.animationState = Math.max(craftPanel.props.animationState - animationSpeed * deltaTime, 0);
            } else {
                screenUI.deleteChild(UIMap.craftPanel.id);
                UIMap.craftButton.image = UIMap.craftButton.props.notSelected;
                UIMap.craftPanel = undefined;
                needUIRedraw = true;
            }
        }
    }

    let chestPanel = UIMap.chestPanel;
    if (chestPanel) {
        if (chestOpened) {
            if (chestPanel.props.animationState < 1) {
                chestPanel.props.animationState = Math.min(chestPanel.props.animationState + animationSpeed * deltaTime, 1);
                needUIRedraw = true;
            }
        } else { 
            if (chestPanel.props.animationState > 0) {
                chestPanel.props.animationState = Math.max(chestPanel.props.animationState - animationSpeed * deltaTime, 0);
            } else {
                screenUI.deleteChild(UIMap.chestPanel.id);
                UIMap.chestPanel = undefined;
                needUIRedraw = true;
            }
        }
    }

    // Обновление интерфейса
    if (needCraftRedraw && craftOpened) {
        reloadCraft();
    }

    if (needInvRedraw && inventoryOpened) {
        reloadInv();
    }

    if (needChestRedraw && chestOpened) {
        reloadChest(chestOpened.x, chestOpened.y, chestOpened.layout);
    }

    if (lastCanvasSize[0] !== _size[0] || lastCanvasSize[1] !== _size[1] || needUIRedraw) {
        _renderingUIArr = screenUI.draw();
        needUIRedraw = false;
        lastCanvasSize = _size;
    }


}

const UISetActiveSlot = (index) => {
    UIMap.activeSlot.props.animationTargetX = index;
    UIMap.activeSlot.props.animationStartX = UIMap.activeSlot.props.animationCurrentX;
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

const createItemCard = (number, id, text, invIndex, isClickable) => {
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
    slot.deleteChildren();
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

// Открыть меню инвентаря
const UIOpenInv = () => {
    if (inventoryOpened) return;
    inventoryOpened = true;
    if (UIMap.invPanel) screenUI.deleteChild(UIMap.invPanel.id);

    let invButton = UIMap.invButton;
    invButton.image = UIMap.invButton.props.selected;
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
                x: 0,
                y: -20
            }
        },
        {
            animationState: 0,
            opened: {
                rect: {
                    pa: {
                        x: 0,
                        y: undefined
                    },
                    pb: {
                        x: 1 / 3,
                        y: 1
                    }
                },
                indent: {
                    pa: {
                        x: 20,
                        y: 40
                    },
                    pb: {
                        x: 0,
                        y: -20
                    }
                }
            },
            closed: {
                rect: {
                    pa: {
                        x: invButton.rect.pb.x,
                        y: invButton.rect.pa.y
                    },
                    pb: {
                        x: invButton.rect.pb.x,
                        y: invButton.rect.pa.y
                    }
                },
                indent: {
                    pa: {
                        x: invButton.indent.pa.x,
                        y: invButton.indent.pa.y
                    },
                    pb: {
                        x: invButton.indent.pb.x,
                        y: invButton.indent.pb.y
                    }
                }
            }
        });
    invPanel.recountRect = (rect, indent, parent, image, props) => {
        props.opened.rect.pa.y = props.opened.rect.pb.x / 8
                                    * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);

        rect.pa = {
            x: props.closed.rect.pa.x + props.animationState * (props.opened.rect.pa.x - props.closed.rect.pa.x),
            y: props.closed.rect.pa.y + props.animationState * (props.opened.rect.pa.y - props.closed.rect.pa.y)
        }
        rect.pb = {
            x: props.closed.rect.pb.x + props.animationState * (props.opened.rect.pb.x - props.closed.rect.pb.x),
            y: props.closed.rect.pb.y + props.animationState * (props.opened.rect.pb.y - props.closed.rect.pb.y)
        }

        indent.pa = {
            x: props.closed.indent.pa.x + props.animationState * (props.opened.indent.pa.x - props.closed.indent.pa.x),
            y: props.closed.indent.pa.y + props.animationState * (props.opened.indent.pa.y - props.closed.indent.pa.y)
        }
        indent.pb = {
            x: props.closed.indent.pb.x + props.animationState * (props.opened.indent.pb.x - props.closed.indent.pb.x),
            y: props.closed.indent.pb.y + props.animationState * (props.opened.indent.pb.y - props.closed.indent.pb.y)
        }
    }
    UIMap.invPanel = invPanel;
    
    let invScrollPanel = new Sprite(
        [ [0.250, 0.51], [0.375, 0.615] ],
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
    UIMap.inventoryLabel = label;
    UIMap.invPanel.add(label);

    let closeButton = new Sprite(
        [ [0.625, 0.501], [0.6885, 0.5635] ],
        {
            pa: {
                x: 1,
                y: 1
            },
            pb: {
                x: 1,
                y: 1
            }
        },
        {
            pa: {
                x: -55,
                y: -55
            },
            pb: {
                x: -5,
                y: -5
            }
        });
    setOnClickListener(closeButton,
    () => {
        closeButton.image = [ [0.625, 0.501], [0.6885, 0.5635] ];
        UICloseInv();
    },
    () => {
        closeButton.image = [ [0.625 + 0.0625, 0.501], [0.6885 + 0.0625, 0.5635] ];
    },
    () => {
        closeButton.image = [ [0.625, 0.501], [0.6885, 0.5635] ];
    });
    invPanel.add(closeButton);

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
        },
        {
            type: 'button'
        });
    setOnClickListener(downButton,
    undefined,
    () => {
        downButton.image = [ [0.4385 + 0.0625, 0.5635], [0.375 + 0.0625, 0.501] ];
        if (scrollingContent.props.scrollX - 600 * deltaTime > 0) {
            scrollingContent.props.scrollX -= 600 * deltaTime;
        } else {
            scrollingContent.props.scrollX = 0;
        }
        needInvRedraw = true;
    },
    () => {
        downButton.image = [ [0.4385, 0.5635], [0.375, 0.501] ];
        needInvRedraw = false;
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
        },
        {
            type: 'button'
        });
    setOnClickListener(upButton,
    undefined,
    () => {
        upButton.image = [ [0.376 + 0.0625, 0.501], [0.4375 + 0.0625, 0.5625] ];
        scrollingContent.props.scrollX += 600 * deltaTime;
        needInvRedraw = true;
    },
    () => {
        upButton.image = [ [0.376, 0.501], [0.4375, 0.5625] ];
        needInvRedraw = false;
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
    let invLabel = UIMap.inventoryLabel;
    invLabel.deleteChildren();
    invLabel.add(createText("Inventory " + player.inv.weight + "/" + player.inv.capacity));

    let scrollingContent = UIMap.invScrollingContent;
    let selected = UIMap.activeElement;
    scrollingContent.deleteChildren();
    let insertIndex = 0;
    for (let i = 0; i < player.inv.items.length; i++) {
        if (player.inv.items[i]) {
            let card;
            if (player.inv.items[i].id) {
                card = createItemCard(insertIndex, player.inv.items[i].id,
                     "Weight: " + items[player.inv.items[i].id].weight + "\n"
                    + "\nDurability: " + player.inv.items[i].durability
                    + "\n" +items[player.inv.items[i].id].name);

            } else {
                card = createItemCard(insertIndex, player.inv.items[i],
                    "Weight: " + items[player.inv.items[i]].weight * player.inv.count[i]
                    + "\n\n" + "Count: " + player.inv.count[i]
                    + "\n"+items[player.inv.items[i]].name);
            }

            card.props = {
                type: 'invSlot',
                invIndex: i,
                selectedImage: [ [0, 0.635], [0.125, 0.740] ],
                unselectedImage: [ [0.125, 0.51], [0.250, 0.615] ]
            }

            setOnClickListener(card, () => {
                let activeElement = UIMap.activeElement;
                if (activeElement) {
                    // Если дважды нажали на один предмет
                    if (activeElement.props.invIndex === card.props.invIndex) {
                        card.image = card.props.unselectedImage;
                        UIMap.activeElement = undefined;
                    } else {
                        if (activeElement.props.type === 'invSlot') {
                            player.invSwapByIndex(activeElement.props.invIndex, card.props.invIndex);
                            needUIRedraw = true;
                        }

                        UIMap.activeElement = undefined;
                    }
                } else {
                    card.image = card.props.selectedImage;
                    UIMap.activeElement = card;
                }
            });

            card.indent.pa.y += scrollingContent.props.scrollX;
            card.indent.pb.y += scrollingContent.props.scrollX;
            if (selected && selected.props.type === 'invSlot' && selected.props.invIndex === i) {
                card.image = card.props.selectedImage;
            }
            let deleteButton = new Sprite(
                [ [0.376, 0.501 + 0.0625], [0.4375, 0.5625 + 0.0625] ],
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
                        x: -50,
                        y: 0
                    },
                    pb: {
                        x: 0,
                        y: 50
                    }
                });
            setOnClickListener(deleteButton, () => {
                player.deleteFromInvByIndex(i, 1);
                needInvRedraw = true;

                deleteButton.image = [ [0.376, 0.501 + 0.0625], [0.4375, 0.5625 + 0.0625] ];
            },
            () => {
                deleteButton.image = [ [0.376 + 0.0625, 0.501 + 0.0625], [0.4375 + 0.0625, 0.5625 + 0.0625] ];
                needInvRedraw = false;
            },
            () => {
                deleteButton.image = [ [0.376, 0.501 + 0.0625], [0.4375, 0.5625 + 0.0625] ];
                needInvRedraw = false;
            },
            () => {
                player.deleteFromInvByIndex(i, player.inv.count[i]);
                needChestRedraw = true;
            });
            card.add(deleteButton);

            let toChestButton = new Sprite(
                [ [0.626, 0.5635], [0.6875, 0.625] ],
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
                        x: -50,
                        y: 55
                    },
                    pb: {
                        x: 0,
                        y: 105
                    }
                });
            setOnClickListener(toChestButton, () => {
                let item = player.deleteFromInvByIndex(i, 1);
                item = gameArea.addToInvBlock(chestOpened.x, chestOpened.y, chestOpened.layout, item);
                if (item) {
                    player.addToInv(item);
                }
                needInvRedraw = true;
                needChestRedraw = true;

                toChestButton.image = [ [0.626, 0.5635], [0.6875, 0.625] ];
            },
            () => {
                toChestButton.image = [ [0.626 + 0.0625, 0.5635], [0.6875 + 0.0625, 0.625] ];
                needInvRedraw = false;
            },
            () => {
                toChestButton.image = [ [0.626, 0.5635], [0.6875, 0.625] ];
                needInvRedraw = false;
            },
            () => {
                toChestButton.image = [ [0.626, 0.5635], [0.6875, 0.625] ];
                let item = player.deleteFromInvByIndex(i, player.inv.count[i]);
                item = gameArea.addToInvBlock(chestOpened.x, chestOpened.y, chestOpened.layout, item);
                if (item) {
                    player.addToInv(item);
                }
                needInvRedraw = true;
                needChestRedraw = true;
            });
            if (chestOpened) {
                card.add(toChestButton);
            }

            scrollingContent.add(card);

            insertIndex++;
        }
    }
    needUIRedraw = true;
}

const UICloseInv = () => {
    inventoryOpened = false;
}


// Меню крафтов
let needCraftRedraw = false;
let craftOpened = false;
let isCraftingTable = false;
let isFurnace = false;
let lastCraftBlock = undefined;
const UIOpenCraft = (x, y, layout) => {
    if (craftOpened && lastCraftBlock
                        && lastCraftBlock.x === x
                        && lastCraftBlock.y === y
                        && lastCraftBlock.layout === layout) return;
    craftOpened = true;
    if (x !== undefined && y !== undefined && layout !== undefined) {
        lastCraftBlock = {};
        lastCraftBlock.x = x;
        lastCraftBlock.y = y;
        lastCraftBlock.layout = layout;
    } else {
        lastCraftBlock = undefined;
    }

    isCraftingTable = lastCraftBlock
                        && gameArea.get(lastCraftBlock.x, lastCraftBlock.y, lastCraftBlock.layout) === 23;

    if (UIMap.craftPanel) screenUI.deleteChild(UIMap.craftPanel.id);

    // Панель крафтов
    let craftButton = UIMap.craftButton;
    craftButton.image = craftButton.props.selected;
    let craftPanel = new Sprite(
        [ [0, 0.51], [0.125, 0.615] ],
        {
            pa: {
                x: 2 / 3,
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
                y: 40
            },
            pb: {
                x: -20,
                y: -20
            }
        },
        {
            animationState: 0,
            opened: {
                rect: {
                    pa: {
                        x: 2 / 3,
                        y: 0
                    },
                    pb: {
                        x: 1,
                        y: 1
                    }
                },
                indent: {
                    pa: {
                        x: 0,
                        y: 40
                    },
                    pb: {
                        x: -20,
                        y: -20
                    }
                }
            },
            closed: {
                rect: {
                    pa: {
                        x: craftButton.rect.pa.x,
                        y: craftButton.rect.pa.y
                    },
                    pb: {
                        x: craftButton.rect.pa.x,
                        y: craftButton.rect.pa.y
                    }
                },
                indent: {
                    pa: {
                        x: craftButton.indent.pa.x,
                        y: craftButton.indent.pa.y + 20
                    },
                    pb: {
                        x: craftButton.indent.pb.x,
                        y: craftButton.indent.pb.y
                    }
                }
            }
        });
    craftPanel.recountRect = (rect, indent, parent, image, props) => {
        if (lastCraftBlock) {
            craftPanel.props.closed.rect = getBlockRect(lastCraftBlock.x, lastCraftBlock.y, 1, 1);
            craftPanel.props.closed.indent = {
                pa: {
                    x: 0,
                    y: 0
                },
                pb: {
                    x: 0,
                    y: 0
                }
            }
        } 

        rect.pa = {
            x: props.closed.rect.pa.x + props.animationState * (props.opened.rect.pa.x - props.closed.rect.pa.x),
            y: props.closed.rect.pa.y + props.animationState * (props.opened.rect.pa.y - props.closed.rect.pa.y)
        }
        rect.pb = {
            x: props.closed.rect.pb.x + props.animationState * (props.opened.rect.pb.x - props.closed.rect.pb.x),
            y: props.closed.rect.pb.y + props.animationState * (props.opened.rect.pb.y - props.closed.rect.pb.y)
        }

        indent.pa = {
            x: props.closed.indent.pa.x + props.animationState * (props.opened.indent.pa.x - props.closed.indent.pa.x),
            y: props.closed.indent.pa.y + props.animationState * (props.opened.indent.pa.y - props.closed.indent.pa.y)
        }
        indent.pb = {
            x: props.closed.indent.pb.x + props.animationState * (props.opened.indent.pb.x - props.closed.indent.pb.x),
            y: props.closed.indent.pb.y + props.animationState * (props.opened.indent.pb.y - props.closed.indent.pb.y)
        }
    }
    
    UIMap.craftPanel = craftPanel;

    // Наличие блоков для крафта
    let craftingTable = new Sprite(
        isCraftingTable ? items[23].texture() : [ [0.250, 0.51], [0.375, 0.615] ],
        {
            pa: {
                x: 1,
                y: 1
            },
            pb: {
                x: 1,
                y: 1
            }
        },
        {
            pa: {
                x: -110,
                y: -55
            },
            pb: {
                x: -60,
                y: -5
            }
        });
    craftPanel.add(craftingTable);
    
    let craftScrollPanel = new Sprite(
        [ [0.250, 0.51], [0.375, 0.615] ],
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
    label.add(createText("Crafting"));
    UIMap.craftLabel = label;
    UIMap.craftPanel.add(label);

    let closeButton = new Sprite(
        [ [0.625, 0.501], [0.6885, 0.5635] ],
        {
            pa: {
                x: 1,
                y: 1
            },
            pb: {
                x: 1,
                y: 1
            }
        },
        {
            pa: {
                x: -55,
                y: -55
            },
            pb: {
                x: -5,
                y: -5
            }
        });
    setOnClickListener(closeButton,
    () => {
        closeButton.image = [ [0.625, 0.501], [0.6885, 0.5635] ];
        UICloseCraft();
    },
    () => {
        closeButton.image = [ [0.625 + 0.0625, 0.501], [0.6885 + 0.0625, 0.5635] ];
    },
    () => {
        closeButton.image = [ [0.625, 0.501], [0.6885, 0.5635] ];
    });
    craftPanel.add(closeButton);

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
    UIMap.craftScrollingContent = scrollingContent;
    reloadCraft();

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
        },
        {
            type: 'button'
        });
    setOnClickListener(downButton,
    undefined,
    () => {
        downButton.image = [ [0.4385 + 0.0625, 0.5635], [0.375 + 0.0625, 0.501] ];
        if (scrollingContent.props.scrollX - 600 * deltaTime > 0) {
            scrollingContent.props.scrollX -= 600 * deltaTime;
        } else {
            scrollingContent.props.scrollX = 0;
        }
        needCraftRedraw = true;
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
        },
        {
            type: 'button'
        });
    setOnClickListener(upButton,
    undefined,
    () => {
        upButton.image = [ [0.376 + 0.0625, 0.501], [0.4375 + 0.0625, 0.5625] ];
        scrollingContent.props.scrollX += 600 * deltaTime;
        needCraftRedraw = true;
    },
    () => {
        upButton.image = [ [0.376, 0.501], [0.4375, 0.5625] ];
    });

    craftPanel.add(downButton);
    craftPanel.add(upButton);

    craftScrollPanel.add(scrollingContent);
    craftPanel.add(craftScrollPanel);
    UIMap.craftScrollPanel = craftScrollPanel;
    needUIRedraw = true;
    screenUI.add(craftPanel);
}

const reloadCraft = () => {
    let scrollingContent = UIMap.craftScrollingContent;
    scrollingContent.deleteChildren();

    let availableCraft = getCrafts(player.inv, isCraftingTable);

    // Добавляем готовые предметы
    for (let i = 0; i < availableCraft.ready.length; i++) {
        let card = createItemCard(i, availableCraft.ready[i], 
            "\n\nCount: " + crafts[availableCraft.ready[i]].resultCount + "\n"
            + items[availableCraft.ready[i]].name, i);

        let id = availableCraft.ready[i];
        let recipe = "";
        for(let i = crafts[id].needId.length; i >= 0; i--) {
            if (crafts[id].needId[i]) {
                recipe += items[crafts[id].needId[i]].name + ": " + crafts[id].needCount[i] + "\n";
            }
        }
        recipe += "Required:";

        card.mouseMessage = recipe;

        card.indent.pa.y += scrollingContent.props.scrollX;
        card.indent.pb.y += scrollingContent.props.scrollX;

        setOnClickListener(card, () => {
            for(let k = 0; k < crafts[availableCraft.ready[i]].needId.length; k++) {
                for(let j = 0; j < player.inv.items.length; j++) {
                    if (+player.inv.items[j] === crafts[availableCraft.ready[i]].needId[k]) {
                        player.deleteFromInvByIndex(j, crafts[availableCraft.ready[i]].needCount[k]);
                        break;
                    }
                }
            }
            player.addToInv(createItem(availableCraft.ready[i], crafts[availableCraft.ready[i]].resultCount));
            needInvRedraw = true;
            needCraftRedraw = true;
            card.image = [ [0.125, 0.51], [0.250, 0.615] ];
        },
        () => {
            card.image = [ [0, 0.635], [0.125, 0.740] ];
            needCraftRedraw = false;
        },
        () => {
            card.image = [ [0.125, 0.51], [0.250, 0.615] ];
            needCraftRedraw = false;
        },
        () => {
            let id = availableCraft.ready[i];
            while (id === getCrafts(player.inv, isCraftingTable).ready[i] && isReadyCraft(id, player.inv)) {
                availableCraft = getCrafts(player.inv, isCraftingTable);
                for(let k = 0; k < crafts[availableCraft.ready[i]].needId.length; k++) {
                    for(let j = 0; j < player.inv.items.length; j++) {
                        if (+player.inv.items[j] === crafts[availableCraft.ready[i]].needId[k]) {
                            player.deleteFromInvByIndex(j, crafts[availableCraft.ready[i]].needCount[k]);
                            break;
                        }
                    }
                }
                player.addToInv(createItem(availableCraft.ready[i], crafts[availableCraft.ready[i]].resultCount));
            }
            needInvRedraw = true;
            needCraftRedraw = true;
            card.image = [ [0.125, 0.51], [0.250, 0.615] ];
        });
        scrollingContent.add(card);
    }

    // Добавляем не готовые предметы
    for (let i = 0; i < availableCraft.notReady.length; i++) {
        let card = createItemCard(i + availableCraft.ready.length, availableCraft.notReady[i], 
            "Not enough resourses!\n\nCount: " + crafts[availableCraft.notReady[i]].resultCount + "\n"
            + items[availableCraft.notReady[i]].name, i);

        let id = availableCraft.notReady[i];
        let recipe = "";
        for(let i = crafts[id].needId.length; i >= 0; i--) {
            if (crafts[id].needId[i]) {
                recipe += items[crafts[id].needId[i]].name + ": " + crafts[id].needCount[i] + "\n";
            }
        }
        recipe += "Required:";

        card.mouseMessage = recipe;

        card.indent.pa.y += scrollingContent.props.scrollX;
        card.indent.pb.y += scrollingContent.props.scrollX;

        scrollingContent.add(card);
        
    }

    needUIRedraw = true;
}

const UICloseCraft = () => {
    craftOpened = false;
}

// Сундук
const UIOpenChest = (x, y, layout) => {
    if (chestOpened) {
        if (chestOpened.x === x && chestOpened.y === y && chestOpened.layout === layout) return;
        reloadChest(x, y, layout);
        return;
    }
    chestOpened = {
        x: x,
        y: y,
        layout: layout
    }
    lastChest.x = x;
    lastChest.y = y;

    needInvRedraw = true;

    if (UIMap.chestPanel) screenUI.deleteChild(UIMap.chestPanel.id);

    let chestPanel = new Sprite(
        [ [0, 0.51], [0.125, 0.615] ],
        {
            pa: {
                x: 1 / 3,
                y: 0
            },
            pb: {
                x: 2 / 3,
                y: 1
            }
        },
        {
            pa: {
                x: 10,
                y: 40
            },
            pb: {
                x: -10,
                y: -20
            }
        },
        {
            animationState: 0,
            opened: {
                rect: {
                    pa: {
                        x: 1 / 3,
                        y: 0
                    },
                    pb: {
                        x: 2 / 3,
                        y: 1
                    }
                },
                indent: {
                    pa: {
                        x: 10,
                        y: 40
                    },
                    pb: {
                        x: -10,
                        y: -20
                    }
                }
            },
            closed: {
                rect: {
                    pa: {
                        x: 1 / 2,
                        y: 0
                    },
                    pb: {
                        x: 1 / 2,
                        y: 0
                    }
                },
                indent: {
                    pa: {
                        x: 0,
                        y: 0
                    },
                    pb: {
                        x: 0,
                        y: 0
                    }
                },
            }
        });
    chestPanel.recountRect = (rect, indent, parent, image, props) => {
        props.opened.rect.pa.y = (props.opened.rect.pb.x - props.opened.rect.pa.x) / 8
                                    * (parent.pb[0] - parent.pa[0]) / (parent.pb[1] - parent.pa[1]);

        props.closed.rect = getBlockRect(lastChest.x, lastChest.y, 1, 1);

        rect.pa = {
            x: props.closed.rect.pa.x + props.animationState * (props.opened.rect.pa.x - props.closed.rect.pa.x),
            y: props.closed.rect.pa.y + props.animationState * (props.opened.rect.pa.y - props.closed.rect.pa.y)
        }
        rect.pb = {
            x: props.closed.rect.pb.x + props.animationState * (props.opened.rect.pb.x - props.closed.rect.pb.x),
            y: props.closed.rect.pb.y + props.animationState * (props.opened.rect.pb.y - props.closed.rect.pb.y)
        }

        indent.pa = {
            x: props.closed.indent.pa.x + props.animationState * (props.opened.indent.pa.x - props.closed.indent.pa.x),
            y: props.closed.indent.pa.y + props.animationState * (props.opened.indent.pa.y - props.closed.indent.pa.y)
        }
        indent.pb = {
            x: props.closed.indent.pb.x + props.animationState * (props.opened.indent.pb.x - props.closed.indent.pb.x),
            y: props.closed.indent.pb.y + props.animationState * (props.opened.indent.pb.y - props.closed.indent.pb.y)
        }
    }
    
    UIMap.chestPanel = chestPanel;
    
    let chestScrollPanel = new Sprite(
        [ [0.250, 0.51], [0.375, 0.615] ],
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
    label.add(createText("Chest"));
    UIMap.chestLabel = label;
    UIMap.chestPanel.add(label);

    let closeButton = new Sprite(
        [ [0.625, 0.501], [0.6885, 0.5635] ],
        {
            pa: {
                x: 1,
                y: 1
            },
            pb: {
                x: 1,
                y: 1
            }
        },
        {
            pa: {
                x: -55,
                y: -55
            },
            pb: {
                x: -5,
                y: -5
            }
        });
    setOnClickListener(closeButton,
    () => {
        closeButton.image = [ [0.625, 0.501], [0.6885, 0.5635] ];
        UICloseChest();
    },
    () => {
        closeButton.image = [ [0.625 + 0.0625, 0.501], [0.6885 + 0.0625, 0.5635] ];
    },
    () => {
        closeButton.image = [ [0.625, 0.501], [0.6885, 0.5635] ];
    });
    chestPanel.add(closeButton);

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
    UIMap.chestScrollingContent = scrollingContent;
    reloadChest(x, y, layout);

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
        },
        {
            type: 'button'
        });
    setOnClickListener(downButton,
    undefined,
    () => {
        downButton.image = [ [0.4385 + 0.0625, 0.5635], [0.375 + 0.0625, 0.501] ];
        if (scrollingContent.props.scrollX - 600 * deltaTime > 0) {
            scrollingContent.props.scrollX -= 600 * deltaTime;
        } else {
            scrollingContent.props.scrollX = 0;
        }
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
        },
        {
            type: 'button'
        });
    setOnClickListener(upButton,
    undefined,
    () => {
        upButton.image = [ [0.376 + 0.0625, 0.501], [0.4375 + 0.0625, 0.5625] ];
        scrollingContent.props.scrollX += 600 * deltaTime;
    },
    () => {
        upButton.image = [ [0.376, 0.501], [0.4375, 0.5625] ];
    });

    chestPanel.add(downButton);
    chestPanel.add(upButton);

    chestScrollPanel.add(scrollingContent);
    chestPanel.add(chestScrollPanel);
    UIMap.chestScrollPanel = chestScrollPanel;
    needUIRedraw = true;
    screenUI.add(chestPanel);
}

const reloadChest = (x, y, layout) => {
    let inv = gameArea.inventoryBlocks[ [x, y, layout] ];
    let chestLabel = UIMap.chestLabel;
    chestLabel.deleteChildren();
    chestLabel.add(createText("Chest " + inv[2] + "/" + inv[3]));

    let scrollingContent = UIMap.chestScrollingContent;
    let selected = UIMap.activeElement;
    scrollingContent.deleteChildren();
    let insertIndex = 0;
    for (let i = 0; i < inv[0].length; i++) {
        if (inv[0][i]) {
            let card;
            if (inv[0][i].id) {
                card = createItemCard(insertIndex, inv[0][i].id,
                     "Weight: " + items[inv[0][i].id].weight + "\n"
                    + "\nDurability: " + inv[0][i].durability
                    + "\n" + items[inv[0][i].id].name);

            } else {
                card = createItemCard(insertIndex, inv[0][i],
                    "Weight: " + items[inv[0][i]].weight * inv[1][i]
                    + "\n\n" + "Count: " + inv[1][i]
                    + "\n" + items[inv[0][i]].name);
            }

            card.props = {
                type: 'chestSlot',
                invIndex: i,
                selectedImage: [ [0, 0.635], [0.125, 0.740] ],
                unselectedImage: [ [0.125, 0.51], [0.250, 0.615] ]
            }

            setOnClickListener(card, () => {
                let item = gameArea.deleteFromInvBlockByIndex(x, y, layout, i, 1);
                item = player.addToInv(item);
                if (item) {
                    gameArea.addToInvBlock(x, y, layout, createItem(back.id, back.count));
                }
                needInvRedraw = true;
                needChestRedraw = true;
                card.image = [ [0.125, 0.51], [0.250, 0.615] ];
            },
            () => {
                card.image = [ [0, 0.635], [0.125, 0.740] ];
                needChestRedraw = false;
            },
            () => {
                card.image = [ [0.125, 0.51], [0.250, 0.615] ];
                needChestRedraw = false;
            },
            () => {
                let item = gameArea.deleteFromInvBlockByIndex(x, y, layout, i, inv[1][i]);
                item = player.addToInv(item);
                if (item) {
                    gameArea.addToInvBlock(x, y, layout, item);
                }
                needInvRedraw = true;
                needChestRedraw = true;
                card.image = [ [0.125, 0.51], [0.250, 0.615] ];
            });

            card.indent.pa.y += scrollingContent.props.scrollX;
            card.indent.pb.y += scrollingContent.props.scrollX;

            let deleteButton = new Sprite(
                [ [0.376, 0.501 + 0.0625], [0.4375, 0.5625 + 0.0625] ],
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
                        x: -50,
                        y: 0
                    },
                    pb: {
                        x: 0,
                        y: 50
                    }
                });
            setOnClickListener(deleteButton, () => {
                gameArea.deleteFromInvBlockByIndex(x, y, layout, i, 1);
                needChestRedraw = true;

                deleteButton.image = [ [0.376, 0.501 + 0.0625], [0.4375, 0.5625 + 0.0625] ];
            },
            () => {
                deleteButton.image = [ [0.376 + 0.0625, 0.501 + 0.0625], [0.4375 + 0.0625, 0.5625 + 0.0625] ];
                needChestRedraw = false;
            },
            () => {
                deleteButton.image = [ [0.376, 0.501 + 0.0625], [0.4375, 0.5625 + 0.0625] ];
                needChestRedraw = false;
            },
            () => {
                gameArea.deleteFromInvBlockByIndex(x, y, layout, i, inv[1][i]);
                needChestRedraw = true;
            });
            card.add(deleteButton);
            scrollingContent.add(card);

            insertIndex++;
        }
    }
    needUIRedraw = true;
}

const UICloseChest = () => {
    chestOpened = undefined;
    needInvRedraw = true;
}