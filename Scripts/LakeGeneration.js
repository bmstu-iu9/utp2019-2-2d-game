// Генерация земли
let seed = 1000000;

const random = () => {
    /*let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);*/
    return Math.random();
};

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
        if (lastSign !== sign) {
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
            if (lastDelta === 0 && random() > 0.07) {
                delta = 0;
            } else {
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

    // Преобразование карты высот в матрицу
    let arr = [];
    for (let x = 0; x < widthWorld; x++) {
        arr[x] = [];
        for (let y = 0; y < heightWorld; y++) {
            arr[x][y] = (y <= heights[x]) ? 1 : -1;
        }
    }

    for (let i = 0; i < waterArrStartX.length; i++) {
        let x;
        let y;
        for (x = waterArrStartX[i]; x < waterArrEndX[i]; x++) {
            for (y = waterArrStartY[i]; arr[x][y] === -1; y--) {
                arr[x][y] = 3;
                if (arr[x - 1][y] === 1) {
                    arr[x - 1][y] = 2;
                }
                if (arr[x + 1][y] === 1) {
                    arr[x + 1][y] = 2;
                }
            }

            if (arr[x - 1][y + 1] === 3 && arr[x][y] === 1) {
                arr[x][y] = 2;
            }
        }
    }

    return arr;
};

// Пример генерации
let arr = landGen(64, 128, 300, 256);

for (let i = 0; i < arr.length; i++) {
    let str = '';
    for (let j = 0; j < arr[i].length; j++) {
        if (arr[i][j] === -1) {
            str += ' ';
        }
        else if (arr[i][j] === 1) {
            str += '#';
        }
        else if (arr[i][j] === 2) {
            str += '*';
        }
        else str += 'O';
    }
    console.log(str);
}