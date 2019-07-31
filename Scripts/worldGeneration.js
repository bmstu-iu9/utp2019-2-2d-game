// Генерация земли, changes необходимы при загрузке с изменениями исходного мира
const generate = (width, height, seed, changes) => {
    console.time('World generation');
    // seed = 1564182166636;
    __cheat_seed = seed;

    //Вспомогательные функции и объекты
    //#region utils
    let seedTemp = seed;
    const random = () => {
        let x = Math.sin(seedTemp++) * 10000;
        return x - Math.floor(x);
    }

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        add(oth) {
            return new Point(this.x + oth.x, this.y + oth.y);
        }
        sub(oth) {
            return new Point(this.x - oth.x, this.y - oth.y);
        }
    }  
    class Interval { //Одномерный интервал
        constructor(start, stop) {
            this.start = start;
            this.stop = stop;
        }
        isSurround(x) {
            return this.start <= x && x <= this.stop;
        }
    }
    //#endregion

    //Константы для id блоков и зон
    //#region defines
    const AIR_BLOCK = undefined;
    const STONE_BLOCK = 1;
    const GRASS_BKOCK = 2;
    const DIRT_BLOCK = 3;
    const COBBLESTONE_BLOCK = 4;
    const BEDROCK_BLOCK = 7;
    const WATER_BLOCK = 8;
    const LAVA_BLOCK = 10;
    const SAND_BLOCK = 12;
    const GOLD_ORE_BLOCK = 14;
    const IRON_ORE_BLOCK = 15;
    const COAL_ORE_BLOCK = 16;
    const WOOD_BLOCK = 17;
    const LEAVES_BLOCK = 18;
    const DIAMOND_ORE_BLOCK = 56;

    const NONE_ZONE = 0;
    const LAKE_ZONE = 1;
    const CAVE_ZONE = 2;
    const LAVA_LAKE_ZONE = 3;
    const ORE_ZONE = 4;
    //#endregion

    //Методы для установки/чтения блоков/зон на карте
    //#region mapIntercations
    let worldMap = new Array(width);
    let worldZones = new Array(width); //Массив, описывающий зоны (зона с озером, зона с пещерой и т.д.)
    for (let i = 0; i < worldMap.length; i++) {
        worldMap[i] = new Array(height);
        worldZones[i] = new Array(height);
        for (let j = 0; j < height; j++)
            worldMap[i][j] = new Array();
    }
    const setBlock = (x, y, layer, block) => {
        if (x < 0 || y < 0 || x >= width || y >= height)
            throw "Out of bound";
        worldMap[x][y][layer] = block;
    }
    const getBlock = (x, y, layer) => {
        if (x < 0 || y < 0 || x >= width || y >= height)
            return undefined;
        return worldMap[x][y][layer];
    }
    const isBlock = (x, y, layer) => {
        if (x < 0 || y < 0 || x >= width || y >= height)
            return undefined;
        return worldMap[x][y][layer] !== undefined && worldMap[x][y][layer] !== AIR_BLOCK;
    }
    const setZone = (x, y, zone) => {
        worldZones[x][y] = zone;
    }
    const getZone = (x, y) => {
        return worldZones[x][y] !== undefined ? worldZones[x][y] : NONE_ZONE;
    }
    //#endregion
     
    let elevationMap = new Array();
    let shadowMap = new Array();

    let dontGenHereArr = new Array(width);
    for (let x = 0; x < width; x++) {
        dontGenHereArr[x] = false;
    }

    //Методы генерации определенных объектов (поверхности, озер, пещер, и т.п.)
    //#region methods
    // Генерация массива уровней поверхности
    const landGen = (minHeight, maxHeight, widthWorld, heightWorld) => {
        let heights = [Math.floor((maxHeight + minHeight) / 2)];

        let waterArrStart = [];
        let waterArrEnd = [];

        let waterStart = new Point(0, 0);
        let waterEnd = new Point(0, 0);

        let i = 1;
        let lastSign = 0;
        while (i < widthWorld) {
            let sectionLength = Math.round(random() * 9) + 1; // Длина сектора возрастания или убывания
            let sign = Math.floor(random() * 2);
            if (sign === 0) sign = -1;
            
            let lastDelta = 1;
            if (lastSign != sign) {
                lastDelta = 0;
            }

            if (sign === -1 && lastDelta !== 0) {
                waterStart = new Point(i, heights[i - 1]);
            }

            lastSign = sign;
            i += sectionLength;
            while (sectionLength > 0) {
                let delta = 0;
                if (lastDelta == 0 && random() > 0.1) {
                    delta = 0;
                } else {
                    if (random() > 0.5) {
                        delta = 1;
                    } else {
                        if (random() > 0.5) {
                            delta = 0;
                        } else {
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
            if (sign === 1 && lastDelta !== 0 && waterStart.x !== 1 && lastSign !== 0) {
                if (i - 1 >= widthWorld) {
                    i = widthWorld;
                }

                waterEnd.x = i - 1;

                if (heights[i - 1] > waterStart.y) {
                    waterEnd.y = waterStart.y;
                } else if (random() < 0.07) {
                    waterEnd.y = heights[i - 1];
                    waterStart.y = heights[i - 1];
                }

                if (waterEnd.y !== 0) {
                    waterArrStart.push(new Point(waterStart.x, waterStart.y));
                    waterArrEnd.push(new Point(waterEnd.x, waterEnd.y));
                    waterStart.x = 1;
                    waterEnd.y = 0;
                }
            }
        }
        elevationMap = heights;
        // Заполнение озёр в финальном id массиве
        for (let i = 0; i < waterArrStart.length; i++) {
            let x;
            let y;
            for (x = waterArrStart[i].x; x < waterArrEnd[i].x; x++) {
                for (y = waterArrStart[i].y; y > elevationMap[x]; y--) {
                    setZone(x, y, LAKE_ZONE);
                    setBlock(x, y, GameArea.FIRST_LAYOUT, WATER_BLOCK);
                    setBlock(x, y, GameArea.SECOND_LAYOUT, SAND_BLOCK);
                    setBlock(x, y, GameArea.BACK_LAYOUT, SAND_BLOCK);
                    if (y <= elevationMap[x - 1]) {
                        setZone(x - 1, y, LAKE_ZONE);
                        setBlock(x - 1, y, GameArea.FIRST_LAYOUT, SAND_BLOCK);
                        setBlock(x - 1, y, GameArea.SECOND_LAYOUT, SAND_BLOCK);
                        setBlock(x - 1, y, GameArea.BACK_LAYOUT, SAND_BLOCK);
                    }
                    if (y <= elevationMap[x + 1]) {
                        setZone(x + 1, y, LAKE_ZONE);
                        setBlock(x + 1, y, GameArea.FIRST_LAYOUT, SAND_BLOCK);
                        setBlock(x + 1, y, GameArea.SECOND_LAYOUT, SAND_BLOCK);
                        setBlock(x + 1, y, GameArea.BACK_LAYOUT, SAND_BLOCK);
                    }
                }
                if (getBlock(x, y + 1, GameArea.FIRST_LAYOUT) === WATER_BLOCK && y <= elevationMap[x]) {
                    setZone(x, y, LAKE_ZONE);
                    setBlock(x, y, GameArea.FIRST_LAYOUT, SAND_BLOCK);
                    setBlock(x, y, GameArea.SECOND_LAYOUT, SAND_BLOCK);
                    setBlock(x, y, GameArea.BACK_LAYOUT, SAND_BLOCK);
                }
            }
        }
    }

    // Создание земли и слоя камня
    const surfaceGen = () => {
        for (let x = 0; x < width; x++) {
            let dirtDepth = Math.floor(random() * 7) + 15;
            let needGrass = true;
            for (let y = height - 1; y >= 0; y--) {
                if (getZone(x, y) === LAKE_ZONE) {
                    //Если блок - часть озера (песок или вода)
                    dirtDepth--;
                    needGrass = false;
                }
                else if (getZone(x, y + 1) === LAKE_ZONE && getBlock(x, y + 1, GameArea.FIRST_LAYOUT) === SAND_BLOCK) {
                    //Если строго над нами - часть озера, и она - песок
                    //Создаем дополнительную прослойку земли
                    worldMap[x][y][GameArea.SECOND_LAYOUT] = DIRT_BLOCK;
                    worldMap[x][y][GameArea.FIRST_LAYOUT] = DIRT_BLOCK;
                    worldMap[x][y][GameArea.BACK_LAYOUT] = DIRT_BLOCK;
                } 
                else if (y <= elevationMap[x]) { //Иначе - если точка ниже уровня земли
                    if (dirtDepth > 0) {
                        //Устанавливаем слой земли
                        if (needGrass) {
                            //Слой травы
                            worldMap[x][y][GameArea.SECOND_LAYOUT] = GRASS_BKOCK;
                            worldMap[x][y][GameArea.BACK_LAYOUT] = GRASS_BKOCK;
                            if (getZone(x, y) === NONE_ZONE) {
                                worldMap[x][y][GameArea.FIRST_LAYOUT] = GRASS_BKOCK;
                            }
                            needGrass = false;
                        } else {
                            //Слой не травы
                            worldMap[x][y][GameArea.BACK_LAYOUT] = DIRT_BLOCK;
                            worldMap[x][y][GameArea.SECOND_LAYOUT] = DIRT_BLOCK;
                            if (getZone(x, y) === NONE_ZONE) {
                                worldMap[x][y][GameArea.FIRST_LAYOUT] = DIRT_BLOCK;
                            }
                        }
                        dirtDepth--;
                    } 
                    else {
                        //Андерграунд
                        worldMap[x][y][GameArea.BACK_LAYOUT] = STONE_BLOCK;
                        worldMap[x][y][GameArea.SECOND_LAYOUT] = STONE_BLOCK;
                        worldMap[x][y][GameArea.FIRST_LAYOUT] = STONE_BLOCK;
                    }
                }
            }
        }
    }

    // Создание вертикальных пещер с поверхности
    const caveGen = (maxCount, maxLength) => {
        const setCaveBlock = (x, y) => {
            setZone(x, y, CAVE_ZONE);
            setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
        }

        // Расширение пещеры по её "направляющей"
        const holeGen = (caveX, caveY, maxRadius, dontGenHereArr, dontGenCountX) => {
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
                    if (i >= 0 && i < width && j >= 0 && j < height &&
                        radius * radius >= (i - caveX) * (i - caveX) + (j - caveY) * (j - caveY)) {
                            setCaveBlock(i, j);
                            if (!dontGenHereArr[i]) {
                                dontGenHereArr[i] = true;
                                dontGenCountX++;
                            }
                    }
                }
            }
            // Возвращаем новое координат, под которыми есть пещеры
            return dontGenCountX;
        }

        let dontGenHereArr = new Array();
        for (let x = 0; x < width; x++) {
            dontGenHereArr[x] = false;
        }

        let dontGenCountX = 0;
        let count = 0;

        while (dontGenCountX < width && maxCount > count) {
            let length = random() * 0.95 * maxLength + 0.05 * maxLength;

            // Ищем координаты точки старта на поверхности для будущей пещеры
            let t = Math.ceil(random() * (width - dontGenCountX));
            let x = -1;
            while (t > 0) {
                x++;
                if (!dontGenHereArr[x]) {
                    t--;
                }
            }
            if (getBlock(x, elevationMap[x], GameArea.FIRST_LAYOUT) == SAND_BLOCK) {
                dontGenCountX++;
                dontGenHereArr[x] = true;
                continue;
            }
            let y = elevationMap[x];

            // Запоминаем точку старта
            let startX = x;
            let startY = y;

            // Храним координаты "направляющей" пещеры
            let caveArrX = new Array;
            let caveArrY = new Array;

            // Ищем следующую координату
            let randK = (random() > 0.5) ? 1 : -1;
            // while (caveArrX.length < length && y > 0 && x >= 0 && x < width && worldArr[x][y]) {
            while (caveArrX.length < length && y > 0 && x >= 0 && x < width && y <= elevationMap[x]) {
                caveArrX.push(x);
                caveArrY.push(y);
                let nextX = x;
                let nextY = y;
                while (nextX === x && nextY === y) {

                    // Ищем X (Генерируем рандомное направление следующего шага с учетом распределения вероятностей 
                    // для придания пещере нужной формы)
                    let probabX = [
						Math.abs(caveArrX[Math.floor(caveArrX.length / 2)] - (x - 1)) + Math.abs(startX - (x - 1)),
                        Math.abs(caveArrX[Math.floor(caveArrX.length / 2)] - x) + Math.abs(startX - x),
                        Math.abs(caveArrX[Math.floor(caveArrX.length / 2)] - (x + 1)) + Math.abs(startX - (x + 1)) ];
                    let maxProbab = probabX[0] + probabX[1] + probabX[2];
                    let rand = Math.floor(random() * maxProbab);
                    let i = -1;
                    for (; i < 2; i++) {
                        rand -= probabX[i * randK + 1];
                        if (rand <= 0) {
                            break; 
                        }
                    }
                    if (i === 2) {
                        i = 1;
                    }

                    nextX += i * randK;

                    // Ищем Y (Генерируем рандомное направление следующего шага с учетом распределения вероятностей 
                    // для придания пещере нужной формы)
                    let probabY = [
						Math.abs(caveArrY[Math.floor(caveArrY.length / 2)] - (y - 1)) + Math.abs(startY - (y - 1)) + y,
						Math.abs(caveArrY[Math.floor(caveArrY.length / 2)] - y) + Math.abs(startY - y),
						Math.abs(caveArrY[Math.floor(caveArrY.length / 2)] - (y + 1)) + Math.abs(startY - (y + 1)) - y];
                    maxProbab = probabY[0] + probabY[1] + probabY[2];
                    rand = Math.floor(random() * maxProbab);
                    i = -1;
                    for (; i < 2; i++) {
                        rand -= probabY[i + 1];
                        if (rand <= 0) {
                            break;
                        } 
                    }
                    nextY += i;
                }
                x = nextX;
                y = nextY;
            }
            if (caveArrX.length > 0.05 * maxLength) {
                // Формируем пещеру по направляющей
                for (let i = 0; i < caveArrX.length; i++) {
                    dontGenCountX = holeGen(caveArrX[i], caveArrY[i], 3, dontGenHereArr, dontGenCountX); // Дыры радиуса от 1 до 3
                }
                count++;
            }
        }
    }

    // Создание подземных пещер
    const undergroundCavseGen = (minHeight, maxHeightShift, count) => {
        const setCaveBlock = (x, y) => {
            setZone(x, y, CAVE_ZONE);
            setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
        }

        const fillCircle = (center, radius, setf) => {
            //setf - функция установки точки
            let r_2 = radius * radius;
            let r1_2 = (radius - 1) * (radius - 1);
            for (let x = -radius; x < radius; x++) {
                let x_2 = x * x;
                for (let y = -radius; y < radius; y++) {
                    let t = random() < 0.3 ? r1_2 : r_2;
                    if (t > x_2 + y * y)
                        setf(center.x + x, center.y + y);
                }
            }
        }

        //Создает прямую пещеру между двумя точками
        const createCaveSeg = (startPoint, stopPoint) => {
            //Корректируем границы сегмента (с отступом от краев)
            if (startPoint.x < 8)
                startPoint.x = 9;
            if (startPoint.x > width - 9)
                startPoint.x = width - 10;
            if (startPoint.y < 14)
                startPoint.y = 15;
            if (stopPoint.x < 8)
                stopPoint.x = 9;
            if (stopPoint.x > width - 9)
                stopPoint.x = width - 10;
            if (stopPoint.y < 14)
                stopPoint.y = 15;
            
            if (Math.abs(stopPoint.x - startPoint.x) >= Math.abs(stopPoint.y - startPoint.y)) {
                if (startPoint.x > stopPoint.x) {
                    let t = startPoint;
                    startPoint = stopPoint;
                    stopPoint = t;
                }
                let interval = stopPoint.sub(startPoint);
                let theta = Math.atan2(interval.y, interval.x);
                let curH = startPoint.y;
                let lastR = random() < 0.25 ? 3 : 2;
                lastR = random() < 0.25 ? lastR + 1 : lastR;
                for (let x = 0; x < Math.abs(interval.x); x++) {
                    let cr = lastR;
                    let rand = random();
                    if (rand < 0.15)
                        cr += random() < 0.4 ? -2 : 2;
                    else if (rand < 0.4)
                        cr += random() < 0.45 ? -1 : 1;
                    if (cr < 2)
                        cr = 2;
                    if (cr > 5)
                        cr = 5;
                    fillCircle(new Point(startPoint.x + x, Math.floor(curH)), cr, setCaveBlock);
                    curH += theta;
                }
            }
            else {
                if (startPoint.y > stopPoint.y) {
                    let t = startPoint;
                    startPoint = stopPoint;
                    stopPoint = t;
                }
                let interval = stopPoint.sub(startPoint);
                let theta = Math.atan2(interval.x, interval.y);
                let curW = startPoint.x;
                let lastR = random() < 0.25 ? 3 : 2;
                lastR = random() < 0.25 ? lastR + 1 : lastR;
                for (let y = 0; y < Math.abs(interval.y); y++) {
                    let cr = lastR;
                    let rand = random();
                    if (rand < 0.15)
                        cr += random() < 0.4 ? -2 : 2;
                    else if (rand < 0.4)
                        cr += random() < 0.45 ? -1 : 1;
                    if (cr < 2)
                        cr = 2;
                    if (cr > 5)
                        cr = 5;
                    fillCircle(new Point(Math.floor(curW), startPoint.y + y), cr, setCaveBlock);
                    curW += theta;
                }
            }
        }

        const checkSegment = (startPoint, stopPoint) => {
            //Возвращает false, если сегмент никого не пересекает или точку пересечения
            if (startPoint.x < 8)
                startPoint.x = 9;
            if (startPoint.x > width - 9)
                startPoint.x = width - 10;
            if (startPoint.y < 14)
                startPoint.y = 15;
            if (stopPoint.x < 8)
                stopPoint.x = 9;
            if (stopPoint.x > width - 9)
                stopPoint.x = width - 10;
            if (stopPoint.y < 14)
                stopPoint.y = 15;

            if (Math.abs(stopPoint.x - startPoint.x) >= Math.abs(stopPoint.y - startPoint.y)) {
                if (startPoint.x > stopPoint.x) {
                    let t = startPoint;
                    startPoint = stopPoint;
                    stopPoint = t;
                }
                let interval = stopPoint.sub(startPoint);
                let theta = Math.atan2(interval.y, interval.x);
                let curH = startPoint.y;
                for (let x = 0; x < Math.abs(interval.x); x++) {
                    if (!isBlock(startPoint.x + x, Math.floor(curH), GameArea.FIRST_LAYOUT)) {
                        let t = Math.min(Math.abs(interval.x), x + 4);
                        return new Point(startPoint.x + t, Math.floor(curH));
                    }
                    curH += theta;
                }
            }
            else {
                if (startPoint.y > stopPoint.y) {
                    let t = startPoint;
                    startPoint = stopPoint;
                    stopPoint = t;
                }
                let interval = stopPoint.sub(startPoint);
                let theta = Math.atan2(interval.x, interval.y);
                let curW = startPoint.x;
                for (let y = 0; y < Math.abs(interval.y); y++) {
                    if (!isBlock(Math.floor(curW), startPoint.y + y, GameArea.FIRST_LAYOUT)) {
                        let t = Math.min(Math.abs(interval.y), y + 4);
                        return new Point(Math.floor(curW), startPoint.y + t);
                    }
                    curW += theta;
                }
            }
            return false;
        }

        const createHorCave = (startPoint) => {
            let side = random() < 0.5 ? 1 : -1;
            let count = 0;
            let curPoint = startPoint;
            let segs = [startPoint];
            let len = 0;
            while (count < 25) { //Максимум 25 сегментов
                let dx = Math.floor(random() * 12 + 4);
                let dy = Math.floor(random() * 16 + 4);
                dy = random() < 0.6 ? -dy : dy;
                if (curPoint.y + dy > elevationMap[curPoint.x] - maxHeightShift)
                    dy = -dy;
                let inter = checkSegment(curPoint, curPoint.add(new Point(dx * side, dy)));
                if (inter) {
                    let tx = inter.x - curPoint.x;
                    let ty = inter.y - curPoint.y;
                    len += tx * tx + ty * ty;
                    segs.push(inter);
                    count++;
                    break;
                }
                curPoint = curPoint.add(new Point(dx * side, dy));
                segs.push(curPoint);
                len += Math.sqrt(dx * dx + dy * dy);
                count++;
                if (len > 60 && random() < 0.05)
                    break;
            }
            if (len < 60)
                return;
            // curve(segs);
            for (let i = 1; i < segs.length; i++) {
                createCaveSeg(segs[i - 1], segs[i]);
            }
        }

        //Процесс выбора точек старта
        let seqStart = Math.floor(random() * 100);
        for (let i = seqStart; i < seqStart + count; i++) {
            let g = 1.32471795724474602596;
            let a1 = 1.0 / g;
            let a2 = 1.0 / (g * g);
            let xi = Math.floor(((0.5 + a1 * i) % 1) * (width - 20) + 10); 
            let yi = Math.floor(((0.5 + a2 * i) % 1) * (elevationMap[xi] - minHeight - maxHeightShift) + minHeight);
            if (!isBlock(xi, yi, GameArea.FIRST_LAYOUT)) { //Если в точке уже есть пещера
                for (let j = 0; j < 6; j++) { //Пытаемся найти точку рядом
                    if (isBlock(xi + j, yi, GameArea.FIRST_LAYOUT)) {
                        xi += j;
                        break;
                    }
                    if (isBlock(xi + j, yi, GameArea.FIRST_LAYOUT)) {
                        xi -= j;
                        break;
                    }
                }
                if (!isBlock(xi, yi, GameArea.FIRST_LAYOUT))
                    continue;
            }
            //Добавим случайное смещение к выбранной точке
            xi += Math.floor(random() * 50) - 25;
            yi += Math.floor(random() * 50) - 25;
            //(xi, yi) - точка старта горизонтальной пещеры
            createHorCave(new Point(xi, yi));
        }
    }

    // Генерация руд
    const oreGen = () => {
        // Создать одну залежь руды
        const createOre = (type, radius, x, y) => {
            // Очистка блоков в радиусе
            for (let i = x - radius; i <= x + radius; i++) {
                for (let j = y - radius; j <= y + radius; j++) {
                    if (i >= 0 && i < width && j >= 0 && j < height &&
                        radius * radius >= (i - x) * (i - x) + (j - y) * (j - y)) {
                        if (random() > 0.3) {
                            if (getBlock(i, j, GameArea.FIRST_LAYOUT) === STONE_BLOCK)
                                setBlock(i, j, GameArea.FIRST_LAYOUT, type);
                            if (random() < 0.5 && getBlock(i, j, GameArea.SECOND_LAYOUT) === STONE_BLOCK)
                                setBlock(i, j, GameArea.SECOND_LAYOUT, type);
                        }
                    }
                }
            }
        } 
        
        // Разместить руды определенного типа
        const placeOres = (type, frequency, maxRadius, minRadius, minHeight, maxHeight) => {
            minHeight *= height;
            maxHeight *= height;
            for (let i = 0; i < Math.floor(height * (maxHeight - minHeight)) * frequency; i++) {
                createOre(type, minRadius + Math.floor(random() * (maxRadius - minRadius)),
					Math.floor(random() * width), Math.floor(minHeight) + Math.floor(random() * (maxHeight - minHeight)));
            }
        }

        placeOres(COAL_ORE_BLOCK, 1 / 300, 3, 2, 0, 0.7);
        placeOres(IRON_ORE_BLOCK, 1 / 400, 2, 1, 0, 0.5);
        placeOres(GOLD_ORE_BLOCK, 1 / 600, 2, 1, 0.1, 0.4);
        placeOres(DIAMOND_ORE_BLOCK, 1 / 1200, 1, 1, 0, 0.3);
    }
    
    // Создание пещер с лавовыми озерами
    const lavaLakes = (minHeight, maxHeight, frequency) => {
        let curLake; //Точки озера
        const noCaveAround = (x, y) => {      
            return isBlock(x + 1, y, GameArea.FIRST_LAYOUT)
                && isBlock(x - 1, y, GameArea.FIRST_LAYOUT)
                && isBlock(x, y + 1, GameArea.FIRST_LAYOUT)
                && isBlock(x, y - 1, GameArea.FIRST_LAYOUT);
        }
        // Создать полость радиуса
        const createHole = (radius, x, y) => {
            for (let i = x - radius; i <= x + radius; i++) {
                if (i > 0 && i < width - 1) {
                    for (let j = y - radius; j <= y + radius; j++) {
                        if (j > 0 && j < height - 1 && radius * radius >= (i - x) * (i - x) + (j - y) * (j - y)) {
                            if (noCaveAround(i, j)) {
                                curLake.push(new Point(i, j));
                            } else {
                                return;
                            }
                        }
                    }
                }
            }
        }

        for (let j = 0; j < Math.floor(height * (maxHeight - minHeight)) * frequency; j++) {
            curLake = new Array();
            let length = Math.floor(random() * 4) + 2;
            let maxCenterHeight = 0;

            let x = Math.floor(random() * width);
            let y = Math.floor(random() * (maxHeight - minHeight)) + minHeight;
            for (let i = 0; i < length; i++) {
                createHole(Math.floor(random() * 4) + 3, x, y);
                maxCenterHeight = Math.max(maxCenterHeight, y);
                x++;
                y = Math.floor(random() * 3) - 1 + y;
            }
            for (let i = 0; i < curLake.length; i++) {
                if (curLake[i].y <= maxCenterHeight) {
                    setZone(curLake[i].x, curLake[i].y, LAVA_LAKE_ZONE);
                    setBlock(curLake[i].x, curLake[i].y, GameArea.FIRST_LAYOUT, LAVA_BLOCK);
                } else {
                    setZone(curLake[i].x, curLake[i].y, LAVA_LAKE_ZONE);
                    setBlock(curLake[i].x, curLake[i].y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                }
            }
        }
    }

    // Генерция деревьев
    const treeGen = (minHeight, maxHeight, maxCountOfTree) => {
        const foliageGen = (treeArr, treeX, treeY, layout) => {
            let rand = random(), radius = 2;
            while (rand < 0.3) {
                if (radius === 3) {
                    break;
                }
                rand = random();
                radius++;
            }

            for (let i = treeX - radius; i <= treeX + radius; i++) {
                for (let j = treeY - radius; j <= treeY + radius; j++) {
                    if (i >= 0 && i < width && j >= 0 && j < height
                        && radius * radius >= (i - treeX) * (i - treeX) + (j - treeY) * (j - treeY)
                        && treeArr[i][j] < 1 && !isBlock(i, j, GameArea.FIRST_LAYOUT)) {
                        if (layout === GameArea.FIRST_LAYOUT) {
                            treeArr[i][j] = 2;
                            setBlock(i, j, GameArea.FIRST_LAYOUT, LEAVES_BLOCK);
                        } else {
                            treeArr[i][j] = 4;
                            setBlock(i, j, GameArea.SECOND_LAYOUT, LEAVES_BLOCK);
                        }
                    }
                }
            }
        }


        let treeArr = new Array();

        for (let i = 0; i < width; i++) {
            treeArr[i] = new Array();
            for (let j = 0; j < height; j++) {
                treeArr[i].push(0);
            }
        }

        let isTreeX = [];
        for (let i = 0; i < width; i++) {
            isTreeX[i] = false;
        }

        let countTree = 0;
        let countTreeX = 0;

        while (countTreeX < width && countTree < maxCountOfTree) {
            let layout = random() > 0.5 ? GameArea.FIRST_LAYOUT : GameArea.SECOND_LAYOUT;

            let treeArrX = [], endOfBranchX = [];
            let treeArrY = [], endOfBranchY = [];

            let t, x, y;
            do {
                t = Math.ceil(random() * (width - countTreeX));
                x = -1;
                while (t > 0) {
                    x++;
                    if (!isTreeX[x]) {
                        t--;
                    }
                }
                y = elevationMap[x];

                isTreeX[x] = true;
                countTreeX++;
            }
            while (!isBlock(x, y, GameArea.FIRST_LAYOUT) && countTreeX < width);
            if (!isBlock(x, y, GameArea.FIRST_LAYOUT) && countTreeX <= width) {
                countTreeX = width;
                break;
            } else {
                if (getBlock(x, elevationMap[x], GameArea.FIRST_LAYOUT) == SAND_BLOCK && countTreeX <= width)
                    continue;
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

            while (((x >= 0 && x < width && y < height && !isBlock(x, y, GameArea.FIRST_LAYOUT) && !isTreeX[x]) ||
                (forkY < height && !isBlock(forkX, forkY, GameArea.FIRST_LAYOUT))) && (forkY - startY < currentHeight)) {

                if (x !== startX &&
                    (currentBranchLength === 0 || !(x >= 0 && x < width && y < height
                        && !isBlock(x, y, GameArea.FIRST_LAYOUT) && !isTreeX[x]) ||
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
                        if (i === 2) i = 1;
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
                if(layout === GameArea.FIRST_LAYOUT) {
                    treeArr[treeArrX[i]][treeArrY[i]] = 1;
                    setBlock(treeArrX[i], treeArrY[i], GameArea.FIRST_LAYOUT, WOOD_BLOCK);
                } else {
                    treeArr[treeArrX[i]][treeArrY[i]] = 3;
                    setBlock(treeArrX[i], treeArrY[i], GameArea.SECOND_LAYOUT, WOOD_BLOCK);
                }
            }

            for (let i = 0; i < endOfBranchX.length; i++) {

                if (endOfBranchX[i] < leftEdge) leftEdge = endOfBranchX[i];
                if (endOfBranchX[i] > rightEdge) rightEdge = endOfBranchX[i];

                foliageGen(treeArr, endOfBranchX[i], endOfBranchY[i], layout);
            }

            for (let i = leftEdge - 7; i <= rightEdge + 7; i++) {
                if (i >= 0 && i < width) {
                    if (!isTreeX[i]) countTreeX++;
                    isTreeX[i] = true;
                }
            }
        }
    }
    //#endregion

    //Процесс генерации
    landGen(Math.floor((height / 10) * 5), Math.floor((height / 10) * 8), width, height); //elevationMap + озера
    surfaceGen();
    caveGen(width / 100, height / 3);
    undergroundCavseGen(100, 50, 80);
    oreGen();
    lavaLakes(20, height / 2, 1 / 4000);
    treeGen(16, 19, Math.floor(width * 2 / 3));
    
    //Слой бедрока
    for (let x = 0; x < width; x++) {
        let bedrockHeight = Math.floor(random() * 3) + 1
        for (let y = 0; y < bedrockHeight; y++) {
            worldMap[x][y][GameArea.FIRST_LAYOUT] = BEDROCK_BLOCK;
            worldMap[x][y][GameArea.SECOND_LAYOUT] = BEDROCK_BLOCK;
            worldMap[x][y][GameArea.BACK_LAYOUT] = BEDROCK_BLOCK;
        }
    }

    //Что-то связанное с освещением
    //#region shading
    const shadowRound = (startX, startY, x, y, n, isNatural) => {
        const step = (nextX, nextY, n) => {
            if (n > 0 && (startX - x) * (startX - x) + (startY - y) * (startY - y) < (startX - nextX) * (startX - nextX)
				+ (startY - nextY) * (startY - nextY)
                && nextX >= 0 && nextY >= 0 && nextX < width && nextY < height 
                && (shadowMap[nextX][nextY] == undefined || (isNatural && shadowMap[nextX][nextY] % 1000 < n)
				|| (!isNatural && Math.floor(shadowMap[nextX][nextY] / 1000) < n))) {
                shadowRound(startX, startY, nextX, nextY, n, isNatural);
            }
        }
        if (n > 0 && (shadowMap[x][y] == undefined || (isNatural && shadowMap[x][y] % 1000 < n)
			|| (!isNatural && Math.floor(shadowMap[x][y] / 1000) < n))) {
            if (isNatural) {
                if (shadowMap[x][y] == undefined) {
                    shadowMap[x][y] = n;
                } else {
                    shadowMap[x][y] = Math.floor(shadowMap[x][y] / 1000) * 1000 + n;
                }
            } else {
                if (shadowMap[x][y] == undefined) {
                    shadowMap[x][y] = n * 1000;
                } else {
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
        for (let i = 0; i < width; i++) {
            shadowMap[i] = new Array();
        }

        // Natural lighting
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
				if (shadowMap[x][y] == undefined) shadowMap[x][y] = 0;
                if (worldMap[x][y][GameArea.FIRST_LAYOUT] == undefined || worldMap[x][y][GameArea.FIRST_LAYOUT] == 0) {
                    shadowRound(x, y, x, y, maxLight, true);
                } else if (items[worldMap[x][y][GameArea.FIRST_LAYOUT]] != undefined
					&& items[worldMap[x][y][GameArea.FIRST_LAYOUT]].brightness > 0) {
                    shadowRound(x, y, x, y, items[worldMap[x][y][GameArea.FIRST_LAYOUT]].brightness,
						items[worldMap[x][y][GameArea.FIRST_LAYOUT]].isNaturalLight === true);
                }
            }
        }
    }
    
    // Внесение изменений в сгенерировааный мир до расчета теней
	for (let i in changes) {
		worldMap[changes[i].x][changes[i].y][changes[i].layout] = changes[i].newValue;
    }
    
    // Создть карту освещения
    createShadows(9);

    console.timeEnd('World generation');
    return new GameArea(worldMap, elevationMap, shadowMap, width, height);
    //#endregion
}

// Визуализация полученной матрицы в консоли
const visualisator = (gameArea) => {
    let str = "";
    for (let i = 0; i < gameArea.width; i++) {
        for (let j = 0; j < gameArea.height; j++) {
            let block = gameArea.map[i][j][GameArea.FIRST_LAYOUT];
            if (block != undefined) {
                if (block == 17) {
                    str += "#";
                } else {
                    if (block == 18) {
                        str += "@";
                    } else str += block;
                }
            } else {
                str += " ";
            }
        }
        console.log(str);
        str = "";
    }
}
