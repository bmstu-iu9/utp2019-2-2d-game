const foliageGen = (worldArr, treeArr, treeX, treeY) => {
    let rand = Math.random() , radius = 1;
    while (rand < 0.5) {
        if (radius === 2) {
            break;
        }
        rand = Math.random();
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

const treeGen = (heights, worldArr, treeArr, minHeight, maxHeight, maxCountOfTree) => {

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

        // Поиск координат корня нового дерева
        let t, x, y;
        do {
            t = Math.ceil(Math.random() * (worldArr.length - countTreeX));
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

        if (!worldArr[x][y] && countTreeX < worldArr.length) {
            break;
        }
        else {
            countTree++;
        }

        // Границы дерева
        let rightEdge = x;
        let leftEdge = x;

        let lastBranchX = x; // Координата заключающего блока ветки по X
        let lastBranchY = y; // Координата заключающего блока ветки по Y

        let startX = x, forkX = x; // forkX - координата по X блока развилки
        let startY = y + 1, forkY = ++y; // forkY - координата по Y блока развилки

        let currentBranchLength; // Длина рассматриваемой боковой ветки
        let currentHeight = Math.ceil(Math.random() * (maxHeight - minHeight)) + minHeight; // Высота дерева в определенных пределах

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

            // Поиск следующей координаты
            while (nextX === x && nextY === y) {

                // Ищем X
                if (x === startX) {
                    let probabX = [(y - startY) / 2,
                        maxHeight,
                        (y - startY) / 2];
                    let maxProbab = probabX[0] + probabX[1] + probabX[2];
                    let rand = Math.ceil(Math.random() * maxProbab);
                    let randK = (Math.random() > 0.5) ? 1 : -1;
                    let i = -1;
                    for (; i < 2; i++) {
                        rand -= probabX[i * randK + 1];
                        if (rand <= 0) {
                            break;
                        }
                    }
                    nextX += i * randK;
                } else {
                    nextX += (x < startX) ? (-Math.floor(Math.random() * 2)) : Math.floor(Math.random() * 2);
                }

                // Ищем Y
                nextY += (Math.round(Math.random() * 4) > 0) ? 1 : 0;
            }

            if (x === forkX && nextX !== x) {
                currentBranchLength = Math.ceil(Math.random() * (forkY - startY)) + 1;
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
