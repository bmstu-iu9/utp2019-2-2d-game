const landGen = (minHeight, maxHeight, widthWorld, heightWorld) => {
    let heights = [Math.floor((maxHeight + minHeight) / 2)];
    let i = 1;
    let lastSign = 0;
    while (i < widthWorld) {
        let sectionLength = Math.round(random() * 9) + 1; // Длина сектора возрастания или убывания
        let sign = Math.floor(random() * 2);
        if (sign === 0) sign = -1;
        i += sectionLength;
        let lastDelta = 1;
        if(lastSign != sign){
            lastDelta = 0;
        }
        lastSign = sign;
        while (sectionLength > 0) {
            let delta = 0;
            if(lastDelta == 0 && random() > 0.07){
                delta = 0;
            }else{
                delta = Math.ceil(random() * 3); // Максимальная разница в уровнях = 2
            }
            lastDelta = delta;
            let nextHeight = heights[heights.length - 1] + delta * sign;
            if ((nextHeight >= maxHeight) || (nextHeight <= minHeight)) {
                i -= sectionLength;
                break;
            } else heights.push(nextHeight);
            sectionLength--;
        }
    }
    // Преобразование карты высот в матрицу
    let arr = new Array;
    for(let x = 0; x < widthWorld; x++){
        arr[x] = new Array;
        for(let y = 0; y < heightWorld; y++){
            arr[x][y] = (y <= heights[x]);
        }
    }
    return arr;
}