// Генерация земли
const generate = (width, height, seed) => {
    let seedTemp = seed;
    const random = () => {
        let x = Math.sin(seedTemp++) * 10000;
        return x - Math.floor(x);
    }

    // Генерация массива уровней поверхности
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

    // Расширение пещеры по её "направляющей"
    const holeGen = (worldArr, caveX, caveY, maxRadius, isCaveX, countCaveX) => {
        // Выбор радиуса
        let rand = random() , radius = 1;
        while (rand < 0.5) {
            if (radius === maxRadius) {
                break;
            }
            rand = random();
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
    const caveGen = (worldArr, maxLength) => {

        // Массив координат, под которыми нет пещер
        // Используется, чтобы напосредственно под каждым блоком поверхности находилась как минимум одна пещера
        let isCaveX = new Array;
        for(let i = 0; i < worldArr.length; i++){
            isCaveX[i] = false;
        }
        let countCaveX = 0;

        while(countCaveX < worldArr.length){

            // Ищем координаты точки старта на поверхности для будущей пещеры
            let t = Math.ceil(random() * (worldArr.length - countCaveX));
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
            let randK = (random() > 0.5) ? 1 : -1;
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
                    let rand = Math.floor(random() * maxProbab);
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
                    rand = Math.floor(random() * maxProbab);
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
    }

    // Генерция деревьев
    const treeGen = (heights, worldArr, minHeight, maxHeight, maxCountOfTree) => {

        const foliageGen = (worldArr, treeArr, treeX, treeY) => {
            let rand = random() , radius = 1;
            while (rand < 0.5) {
                if (radius === 2) {
                    break;
                }
                rand = random();
                radius++;
            }

            for (let i = treeX - radius; i <= treeX + radius; i++) {
                for (let j = treeY - radius; j <= treeY + radius; j++) {
                    if (i >= 0 && i < worldArr.length && j >= 0 && j < worldArr[i].length &&
                        radius * radius >= (i - treeX) * (i - treeX) + (j - treeY) * (j - treeY) && treeArr[i][j] < 1 && !worldArr[i][j]) {
                        treeArr[i][j] = 2;
                    }
                }
            }
        }

        let treeArr = new Array();

        for (let i = 0; i < worldArr.length; i++) {
            treeArr[i] = new Array();
            for (let j = 0; j < worldArr[i].length; j++) {
                treeArr[i].push(0);
            }
        }

        let isTreeX = [];
        for (let i = 0; i < worldArr.length; i++) {
            isTreeX[i] = false;
        }

        let countTree = 0;
        let countTreeX = 0;

        while (countTreeX < worldArr.length && countTree < maxCountOfTree) {

            let treeArrX = [], endOfBranchX = [];
            let treeArrY = [], endOfBranchY = [];

            let t, x, y;
            do {
                t = Math.ceil(random() * (worldArr.length - countTreeX));
                x = -1;
                while (t > 0) {
                    x++;
                    if (!isTreeX[x]) {
                        t--;
                    }
                }
                y = heights[x].length - 1;
                while(y > 0 && !worldArr[x][y]){
                    y--;
                };
                isTreeX[x] = true;
                countTreeX++;
            }
            while (!worldArr[x][y] && countTreeX < worldArr.length);

            if (!worldArr[x][y] && countTreeX < worldArr.length) {
                break;
            }
            else {
                countTree++;
            }

            let rightEdge = x;
            let leftEdge = x;

            let lastBranchX = x;
            let lastBranchY = y;

            let startX = x, forkX = x; // forkX - координата по X блока развилки
            let startY = y + 1, forkY = ++y; // forkY - координата по Y блока развилки

            let currentBranchLength; // Длина рассматриваемой боковой ветки
            let currentHeight = Math.ceil(random() * (maxHeight - minHeight)) + minHeight;

            while (((x >= 0 && x < worldArr.length && y < worldArr[x].length && !worldArr[x][y] && !isTreeX[x]) ||
                (forkY < worldArr[forkX].length && !worldArr[forkX][forkY])) && (forkY - startY < currentHeight)) {

                if (x !== startX &&
                    (currentBranchLength === 0 || !(x >= 0 && x < worldArr.length && y < worldArr[x].length && !worldArr[x][y] && !isTreeX[x]) ||
                    (y - startY >= maxHeight))) {
                    endOfBranchX.push(lastBranchX);
                    endOfBranchY.push(lastBranchY);
                    x = forkX;
                    y = ++forkY;
                }

                treeArrX.push(x);
                treeArrY.push(y);

                let nextX = x;
                let nextY = y;

                while (nextX === x && nextY === y) {

                    // Ищем X
                    if (x === startX) {
                        let probabX = [(y - startY) / 2,
                            maxHeight,
                            (y - startY) / 2];
                        let maxProbab = probabX[0] + probabX[1] + probabX[2];
                        let rand = Math.ceil(random() * maxProbab);
                        let randK = (random() > 0.5) ? 1 : -1;
                        let i = -1;
                        for (; i < 2; i++) {
                            rand -= probabX[i * randK + 1];
                            if (rand <= 0) {
                                break;
                            }
                        }
                        nextX += i * randK;
                    } else {
                        nextX += (x < startX) ? (-Math.floor(random() * 2)) : Math.floor(random() * 2);
                    }

                    // Ищем Y
                    nextY += (Math.round(random() * 4) > 0) ? 1 : 0;
                }

                if (x === forkX && nextX !== x) {
                    currentBranchLength = Math.ceil(random() * (forkY - startY)) + 1;
                }

                lastBranchX = x;
                lastBranchY = y;

                x = nextX;
                y = nextY;

                if (x === startX) {
                    forkX = x;
                    forkY = y;
                } else {
                    currentBranchLength--;
                }
            }

            endOfBranchX.push(forkX);
            endOfBranchY.push(forkY);

            for (let i = 0; i < treeArrX.length; i++) {
                treeArr[treeArrX[i]][treeArrY[i]] = 1;
            }

            for (let i = 0; i < endOfBranchX.length; i++) {

                if (endOfBranchX[i] < leftEdge) leftEdge = endOfBranchX[i];
                if (endOfBranchX[i] > rightEdge) rightEdge = endOfBranchX[i];

                foliageGen(worldArr, treeArr, endOfBranchX[i], endOfBranchY[i]);
            }

            for (let i = leftEdge - 5; i <= rightEdge + 5; i++) {
                if (i >= 0 && i < worldArr.length) {
                    if (!isTreeX[i]) countTreeX++;
                    isTreeX[i] = true;
                }
            }
        }
        return treeArr;
    }

    let landMatrix = landGen(Math.floor((height / 10) * 5), Math.floor((height / 10) * 8), width, height);

    let landMatrix1 = new Array;
    for(let i = 0; i < landMatrix.length; i++){
        landMatrix1[i] = new Array;
        for(let j = 0; j < landMatrix.length; j++){
            landMatrix1[i][j] = landMatrix[i][j];
        }
    }

    let withCavesMatrix = caveGen(landMatrix1, height * 2);

    let worldMap = new Array();
    for(let x = 0; x < width; x++){
        worldMap[x] = new Array();
        let grassDepth = Math.floor(random() * 4) + 2
        let dirtDepth = grassDepth - 1;
        for(let y = height - 1; y >= 0; y--){
            worldMap[x][y] = new Array();
            if(landMatrix[x][y]){
                if(grassDepth > 0){
                    if(grassDepth > dirtDepth){
                        worldMap[x][y][GameArea.BACK_LAYOUT] = 2 // ID травы
                        if(withCavesMatrix[x][y]){
                            worldMap[x][y][GameArea.MAIN_LAYOUT] = 2 // ID травы
                        }
                    }else{
                        worldMap[x][y][GameArea.BACK_LAYOUT] = 3 // ID грязи
                        if(withCavesMatrix[x][y]){
                            worldMap[x][y][GameArea.MAIN_LAYOUT] = 3 // ID грязи
                        }
                    }
                    grassDepth--;
                }else{
                    worldMap[x][y][GameArea.BACK_LAYOUT] = 1 // ID камня
                    if(withCavesMatrix[x][y]){
                        worldMap[x][y][GameArea.MAIN_LAYOUT] = 1 // ID камня
                    }
                }
            }
        }
        let bedrockHeight = Math.floor(random() * 3) + 1
        for(let y = 0; y < bedrockHeight; y++){
            worldMap[x][y][GameArea.MAIN_LAYOUT] = 7 // ID бедрока
        }
    }

    // Установка деревьев
    let treeArr = treeGen(landMatrix, withCavesMatrix, 14, 23, Math.floor(width * 2 / 3));
    for(let i = 0; i < treeArr.length; i++){
        for (let j = 0; j < treeArr[i].length; j++){
            if (!treeArr[i][j] == 0){
                if (treeArr[i][j] === 1) {
                    worldMap[i][j][GameArea.MAIN_LAYOUT] = 17;
                }
                else worldMap[i][j][GameArea.MAIN_LAYOUT] = 18;
            }
        }
    }
    
    return new GameArea(worldMap, width, height, "./block_table.json");


// Визуализация полученной матрицы в консоли
const visualisator = (gameArea) => {
    let str = "";
    for(let i = 0; i < gameArea.width; i++){
        for (let j = 0; j < gameArea.height; j++){
            let block = gameArea.map[i][j][GameArea.MAIN_LAYOUT];
            if(block != undefined){
                if(block == 17){
                    str += "#";
                }else{
                    if(block == 18){

                        str += "@";
                    }else str += block;
                }
            }
            else{
                str += " ";
            }
        }
        console.log(str);
        str = "";
    }
}

// Пример генерации
/* visualisator(generate(1024, 1024, 1341241)); */
