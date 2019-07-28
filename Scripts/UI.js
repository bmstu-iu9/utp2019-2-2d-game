const holeUI = [[0, 0], [_UI.width, _UI.height]]  // Якорь в % + размер в пикселях
const drawUIElement = (image, part, rect, )

class Sprite {
    constructor(image, rect, indent, pixelScale) {
        this.children = [];
        this.draw = (parent) => {
            if (parent === undefined) {
                
            }
            const pa = [
                parent.pa[0] + (parent.pb[0] - parent.pa[0]) * rect.pa.x + ident.pa.x * pixelScale,
                parent.pa[1] + (parent.pb[1] - parent.pa[1]) * rect.pa.y + ident.pa.y * pixelScale
            ], pb = [
                parent.pb[0] + (parent.pb[0] - parent.pa[0]) * rect.pb.x + ident.pb.x * pixelScale,
                parent.pb[1] + (parent.pb[1] - parent.pa[1]) * rect.pb.y + ident.pb.y * pixelScale
            ];
            let ans = [
                {
                    'pa': pa,
                    'pb': pb,
                    'ta': image[0],
                    'tb': image[1]
                }
            ];
            for (let i = 0; i < this.children.length; i++) {
                ans.concat(children[i].draw({
                    'pa': pa,
                    'pb': pb
                }));
            }
            return ans;
        }
    }
}

// Возмращает _array по-умолчанию
const defaultUI = () => {
    const _size = render.getCanvasSize(); // получаем размер экрана
    return [
        {
            'pa': [_size[0] / 2, _size[1] / 2], 'pb': [_size[0] / 2 * 3, _size[1] / 2 * 3],
            'ta': [0.5, 0.5], 'tb': [1, 1]	
        },
        {
            'pa': [10, 10 ], 'pb': [110, 110], 'ta': [0, 0], 'tb': [1, 1]
        }];
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
        


        return true;
        // Возвращает true, если требуется перерисовка интерфейса
}