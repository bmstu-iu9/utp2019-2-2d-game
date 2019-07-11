// Генерация земли
const generate = (width, height, seed) => {
    let elevationMap = new Array();
    let shadowMap = new Array();
    let seedTemp = seed;
    const random = () => {
        let x = Math.sin(seedTemp++) * 10000;
        return x - Math.floor(x);
    }

    let lakeArr = new Array();
    let dontGenHereArr = new Array();
    for(let x = 0; x < width; x++){
        lakeArr[x] = new Array();
        dontGenHereArr[x] = false;
    }

    // Генерация массива уровней поверхности
    const landGen = (minHeight, maxHeight, widthWorld, heightWorld) => {
        let heights = [Math.floor((maxHeight + minHeight) / 2)];

        let waterArrStartX = [], waterArrEndX = [];
        let waterArrStartY = [], waterArrEndY = [];

        let waterStartX = 0, waterEndX = 0;
        let waterStartY = 0, waterEndY = 0;

        let i = 1;
        let lastSign = 0;
        while (i < widthWorld) {
            let sectionLength = Math.round(random() * 9) + 1; // Длина сектора возрастания или убывания
            let sign = Math.floor(random() * 2);
            if (sign === 0) sign = -1;
            
            let lastDelta = 1;
            if(lastSign != sign){
                lastDelta = 0;
            }

            if (sign === -1 && lastDelta !== 0) {
                waterStartX = i;
                waterStartY = heights[i - 1];
            }

            lastSign = sign;
            i += sectionLength;
            while (sectionLength > 0) {
                let delta = 0;
                if(lastDelta == 0 && random() > 0.1){
                    delta = 0;
                }else{
                    if(random() > 0.5){
                        delta = 1;
                    }else{
                        if(random() > 0.5){
                            delta = 0;
                        }else{
                            delta = Math.ceil(random() * 2) + 1; // Максимальная разница в уровнях = 2
                        }
                    }
                }
                lastDelta = delta;
                let nextHeight = heights[heights.length - 1] + delta * sign;
                if ((nextHeight >= maxHeight) || (nextHeight <= minHeight)) {
                    i -= sectionLength;
                    break;
                } else heights.push(nextHeight);
                sectionLength--;
            }
            if (sign === 1 && lastDelta !== 0 && waterStartX !== 1 && lastSign !== 0) {
                if (i - 1 >= widthWorld) {
                    i = widthWorld;
                }

                waterEndX = i - 1;

                if (heights[i - 1] > waterStartY) {
                    waterEndY = waterStartY;
                } else if (random() < 0.07) {
                    waterEndY = heights[i - 1];
                    waterStartY = heights[i - 1];
                }

                if (waterEndY !== 0) {
                    waterArrStartX.push(waterStartX);
                    waterArrStartY.push(waterStartY);
                    waterArrEndX.push(waterEndX);
                    waterArrEndY.push(waterEndY);

                    waterStartX = 1;
                    waterEndY = 0;
                }
            }
        }
        elevationMap = heights;
        // Преобразование карты высот в матрицу
        let arr = new Array;
        for(let x = 0; x < widthWorld; x++){
            arr[x] = new Array;
            for(let y = 0; y < heightWorld; y++){
                arr[x][y] = (y <= heights[x]);
            }
        }
        // Заполнение озёр в финальном id массиве
        for (let i = 0; i < waterArrStartX.length; i++) {
            let x;
            let y;
            for (x = waterArrStartX[i]; x < waterArrEndX[i]; x++) {
                for (y = waterArrStartY[i]; !arr[x][y]; y--) {
                    lakeArr[x][y] = 8;
                    if (arr[x - 1][y]) {
                        lakeArr[x - 1][y] = 12;
                    }
                    if (arr[x + 1][y]) {
                        lakeArr[x + 1][y] = 12;
                    }
                }

                if (lakeArr[x][y + 1] === 8 && arr[x][y]) {
                    lakeArr[x][y] = 12;
                }
            }
        }

        return arr;
    }

    // Расширение пещеры по её "направляющей"
    const holeGen = (worldArr, caveX, caveY, maxRadius, dontGenHereArr, dontGenCountX) => {
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
                        if(!dontGenHereArr[i]){
                            dontGenHereArr[i] = true;
                            dontGenCountX++;
                        }
                }
            }
        }
        // Возвращаем новое координат, под которыми есть пещеры
        return dontGenCountX;
    }

    // Создание "направляющих" для пещер
    const caveGen = (worldArr, maxCount, maxLength) => {

        let dontGenHereArr = new Array();
        for(let x = 0; x < width; x++){
            dontGenHereArr[x] = false;
        }

        let dontGenCountX = 0;
        let count = 0;

        while(dontGenCountX < worldArr.length && maxCount > count){
            let length = random() * 0.95 * maxLength + 0.05 * maxLength;

            // Ищем координаты точки старта на поверхности для будущей пещеры
            let t = Math.ceil(random() * (worldArr.length - dontGenCountX));
            let x = -1;
            while(t > 0){
                x++;
                if(!dontGenHereArr[x]){
                    t--;
                }
            }
            if(lakeArr[x][elevationMap[x]] == 12){
                dontGenCountX++;
                dontGenHereArr[x] = true;
                continue;
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
            while(caveArrX.length < length && y > 0 && x >= 0 && x < worldArr.length && worldArr[x][y]){
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
                    if (i === 2) {
                        i = 1;
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
            if(caveArrX.length > 0.05 * maxLength){
                // Формируем пещеру по направляющей
                for(let i = 0; i < caveArrX.length; i++){
                    dontGenCountX = holeGen(worldArr, caveArrX[i], caveArrY[i], 3, dontGenHereArr, dontGenCountX)  // Дыры радиуса от 1 до 3
                }
                count++;
            }
        }
        return worldArr;
    }

    // Генерция деревьев
    const treeGen = (heights, worldArr, minHeight, maxHeight, maxCountOfTree) => {

        const foliageGen = (worldArr, treeArr, treeX, treeY) => {
            let rand = random() , radius = 2;
            while (rand < 0.3) {
                if (radius === 3) {
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
                y = heights[x];

                isTreeX[x] = true;
                countTreeX++;
            }
            while (!worldArr[x][y] && countTreeX < worldArr.length);
            if (!worldArr[x][y] && countTreeX <= worldArr.length) {
                countTreeX = worldArr.length;
                break;
            }
            else {
                if(lakeArr[x][elevationMap[x]] == 12 && countTreeX <= worldArr.length) continue;
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
                    if (lastBranchX !== startX) {
                        endOfBranchX.push(lastBranchX);
                        endOfBranchY.push(lastBranchY);
                    }
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
                        let deltaProbably = 0;
                        if (y - startY > currentHeight / 3) {
                            deltaProbably = 1;
                        }

                        let probabX = [deltaProbably * maxHeight / 3,
                            maxHeight,
                            deltaProbably * maxHeight / 3];
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
                        if(i === 2) i = 1;
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

            for (let i = leftEdge - 7; i <= rightEdge + 7; i++) {
                if (i >= 0 && i < worldArr.length) {
                    if (!isTreeX[i]) countTreeX++;
                    isTreeX[i] = true;
                }
            }
        }
        return treeArr;
    }


    // Генерация руд
    const oreGen = () => {
        let oreArr = new Array();
        for(let i = 0; i < width; i++){
            oreArr[i] = new Array();
        }

        // Создать одну залежь руды
        const createOre = (type, radius, x, y) => {
            // Очистка блоков в радиусе
            for (let i = x - radius; i <= x + radius; i++) {
                for (let j = y - radius; j <= y + radius; j++) {
                    if (i >= 0 && i < width && j >= 0 && j < height &&
                        radius * radius >= (i - x) * (i - x) + (j - y) * (j - y)) {
                        if(random() > 0.3){
                            oreArr[i][j] = type;
                        }
                    }
                }
            }
        } 
        
        // Разместить руды определенного типа
        const placeOres = (type, frequency, maxRadius, minRadius, minHeight, maxHeight) => {
            minHeight *= height;
            maxHeight *= height;
            for(let i = 0; i < Math.floor(height * (maxHeight - minHeight)) * frequency; i++){
                createOre(type, minRadius + Math.floor(random() * (maxRadius - minRadius)), Math.floor(random() * width), Math.floor(minHeight) + Math.floor(random() * (maxHeight - minHeight)));
            }
        }

        // Уголь
        placeOres(16, 1/300, 3, 2, 0, 0.7);

        // Железо
        placeOres(15, 1/400, 2, 1, 0, 0.5);

        // Золото
        placeOres(14, 1/600, 2, 1, 0.1, 0.4);

        // Алмазы
        placeOres(56, 1/1200, 1, 1, 0, 0.3);

        return oreArr;
    }
    let landMatrix = landGen(Math.floor((height / 10) * 5), Math.floor((height / 10) * 8), width, height);

    let landMatrix1 = new Array;
    for(let i = 0; i < landMatrix.length; i++){
        landMatrix1[i] = new Array;
        for(let j = 0; j < landMatrix.length; j++){
            landMatrix1[i][j] = landMatrix[i][j];
        }
    }

    let withCavesMatrix = caveGen(landMatrix1, width / 100, height);

    let oreArr = oreGen();

    let worldMap = new Array();
    for(let x = 0; x < width; x++){
        worldMap[x] = new Array();
        let grassDepth = Math.floor(random() * 7) + 15
        let dirtDepth = grassDepth - 1;
        for(let y = height - 1; y >= 0; y--){
            worldMap[x][y] = new Array();
            if(lakeArr[x][y] != undefined){
                worldMap[x][y][GameArea.MAIN_LAYOUT] = lakeArr[x][y];
                worldMap[x][y][GameArea.BACK_LAYOUT] = 12; // ID песка
                dirtDepth = --grassDepth;
            }else if(lakeArr[x][y + 1] == 12){
                worldMap[x][y][GameArea.BACK_LAYOUT] = 3 // ID грязи
                worldMap[x][y][GameArea.MAIN_LAYOUT] = 3 // ID грязи
            }else if(landMatrix[x][y]){
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
                        if(oreArr[x][y] != undefined){
                            worldMap[x][y][GameArea.MAIN_LAYOUT] = oreArr[x][y];
                        }else{
                            worldMap[x][y][GameArea.MAIN_LAYOUT] = 1 // ID камня
                        }
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
    let treeArr = treeGen(elevationMap, withCavesMatrix, 16, 19, Math.floor(width * 2 / 3));
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


    const shadowRound = (startX, startY, x, y, n, isNatural) => {
        const step = (nextX, nextY, n) => {
            if(n > 0 && (startX - x) * (startX - x) + (startY - y) * (startY - y) < (startX - nextX) * (startX - nextX) + (startY - nextY) * (startY - nextY)
                    && nextX >= 0 && nextY >= 0 && nextX < width && nextY < height 
                    && (shadowMap[nextX][nextY] == undefined || (isNatural && shadowMap[nextX][nextY] % 1000 < n) || (!isNatural && Math.floor(shadowMap[nextX][nextY] / 1000) < n))){
                    shadowRound(startX, startY, nextX, nextY, n, isNatural);
            }
        }
        if(n > 0 && (shadowMap[x][y] == undefined || (isNatural && shadowMap[x][y] % 1000 < n) || (!isNatural && Math.floor(shadowMap[x][y] / 1000) < n))){
            if(isNatural){
                if(shadowMap[x][y] == undefined){
                    shadowMap[x][y] = n;
                }else{
                    shadowMap[x][y] = Math.floor(shadowMap[x][y] / 1000) * 1000 + n;
                }
            }else{
                if(shadowMap[x][y] == undefined){
                    shadowMap[x][y] = n * 1000;
                }else{
                    shadowMap[x][y] = n * 1000 + shadowMap[x][y] % 1000;
                }
            }
            step(x + 1, y, n - 1);
            step(x - 1, y, n - 1);
            step(x, y + 1, n - 1);
            step(x, y - 1, n - 1);
        }

    }

    // Создание теней
    const createShadows = (maxLight) => {
        for(let i = 0; i < width; i++){
            shadowMap[i] = new Array();
        }

        // Natural lighting
        for(let x = 0; x < width; x++){
            for(let y = 0; y < height; y++){
				if (shadowMap[x][y] == undefined) shadowMap[x][y] = 0;
                if (worldMap[x][y][GameArea.MAIN_LAYOUT] == undefined || worldMap[x][y][GameArea.MAIN_LAYOUT] == 0){
                    shadowRound(x, y, x, y, maxLight, true);
                }else if(worldMap[x][y][GameArea.MAIN_LAYOUT] == 8 || worldMap[x][y][GameArea.MAIN_LAYOUT] == 9){
                    shadowRound(x, y, x, y, Math.floor(maxLight * 2 / 3), true);
                }
            }
        }
    }

    // Создть карту освещения
    createShadows(9);

    return new GameArea(worldMap, elevationMap, shadowMap, width, height);
}

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
