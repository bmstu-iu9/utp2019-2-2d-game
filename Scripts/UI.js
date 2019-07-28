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