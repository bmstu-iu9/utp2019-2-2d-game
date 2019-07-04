// Преобразование карты высот в матрицу
const hightToArr = (heights, worldHight, worldWidth) => {
    let arr = new Array;
    for(let x = 0; x < worldWidth; x++){
        arr[x] = new Array;
        for(let y = 0; y < worldHight; y++){
            arr[x][y] = (y <= heights[x]);
        }
    }

    return arr;
}

// Расширение пещеры по её "направляющей"
const holeGen = (worldArr, caveX, caveY, maxRadius, isCaveX, countCaveX) => {
    // Выбор радиуса
    let rand = Math.random() , radius = 1;
    while (rand < 0.5) {
        if (radius === maxRadius) {
            break;
        }
        rand = Math.random();
        radius++;
    }

    // Очистка блоков в радиусе
    for (let i = caveX - radius; i <= caveX + radius; i++) {
        for (let j = caveY - radius; j <= caveY + radius; j++) {
            if (i >= 0 && i < worldArr.length && j >= 0 && j < worldArr[i].length &&
                radius * radius >= (i - caveX) * (i - caveX) + (j - caveY) * (j - caveY)) {
                    worldArr[i][j] = false;
                    if(!isCaveX[i]){
                        isCaveX[i] = true;
                        countCaveX++;
                    }
            }
        }
    }
    // Возвращаем новое координат, под которыми есть пещеры
    return countCaveX;
}

// Создание "направляющих" для пещер
const сaveGen = (worldArr, maxLength) => {

    // Массив координат, под которыми нет пещер
    // Используется, чтобы напосредственно под каждым блоком поверхности находилась как минимум одна пещера
    let isCaveX = new Array;
    for(let i = 0; i < worldArr.length; i++){
        isCaveX[i] = false;
    }
    let countCaveX = 0;

    while(countCaveX < worldArr.length){

        // Ищем координаты точки старта на поверхности для будущей пещеры
        let t = Math.ceil(Math.random() * (worldArr.length - countCaveX));
        let x = -1;
        while(t > 0){
            x++;
            if(!isCaveX[x]){
                t--;
            }
        }
        let y = worldArr[0].length - 1;
        while(y > 0 && !worldArr[x][y]){
            y--;
        };

        // Запоминаем точку старта
        let startX = x;
        let startY = y;

        // Храним координаты "направляющей" пещеры
        let caveArrX = new Array;
        let caveArrY = new Array;

        // Ищем следующую координату
        let randK = (Math.random() > 0.5) ? 1 : -1;
        while(caveArrX.length < maxLength && y > 0 && x >= 0 && x < worldArr.length && worldArr[x][y]){
            caveArrX.push(x);
            caveArrY.push(y);
            let nextX = x;
            let nextY = y;
            while(nextX === x && nextY === y){

                // Ищем X (Генерируем рандомное направление следующего шага с учетом распределения вероятностей 
                // для придания пещере нужной формы)
                let probabX = [ Math.abs(caveArrX[Math.floor(caveArrX.length / 2)] - (x - 1)) + Math.abs(startX - (x - 1)),
                                Math.abs(caveArrX[Math.floor(caveArrX.length / 2)] - x) + Math.abs(startX - x),
                                Math.abs(caveArrX[Math.floor(caveArrX.length / 2)] - (x + 1)) + Math.abs(startX - (x + 1)) ];
                let maxProbab = probabX[0] + probabX[1] + probabX[2];
                let rand = Math.floor(Math.random() * maxProbab);
                let i = -1;
                for (; i < 2; i++) {
                    rand -= probabX[i * randK + 1];
                    if(rand <= 0){
                        break; 
                    }
                }
                nextX += i * randK;

                // Ищем Y (Генерируем рандомное направление следующего шага с учетом распределения вероятностей 
                // для придания пещере нужной формы)
                let probabY = [ Math.abs(caveArrY[Math.floor(caveArrY.length / 2)] - (y - 1)) + Math.abs(startY - (y - 1)) + y,
                                Math.abs(caveArrY[Math.floor(caveArrY.length / 2)] - y) + Math.abs(startY - y),
                                Math.abs(caveArrY[Math.floor(caveArrY.length / 2)] - (y + 1)) + Math.abs(startY - (y + 1)) - y ];
                maxProbab = probabY[0] + probabY[1] + probabY[2];
                rand = Math.floor(Math.random() * maxProbab);
                i = -1;
                for (; i < 2; i++) {
                    rand -= probabY[i + 1];
                    if(rand <= 0) {
                        break;
                    } 
                }
                nextY += i;
            }
            x = nextX;
            y = nextY;
        }
        // Формируем пещеру по направляющей
        for(let i = 0; i < caveArrX.length; i++){
            countCaveX = holeGen(worldArr, caveArrX[i], caveArrY[i], 3, isCaveX, countCaveX)  // Дыры радиуса от 1 до 3
        }
    }
    return worldArr;
};


