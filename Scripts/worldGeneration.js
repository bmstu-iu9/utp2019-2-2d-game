var __observe = [];

// Генерация земли, changes необходимы при загрузке с изменениями исходного мира
const generate = (width, height, seed, changes) => {
    console.time('World generation');
    seed = 1565010173969;
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
        add(a, b) {
            if (arguments.length === 1)
                return new Point(this.x + a.x, this.y + a.y);
            else
                return new Point(this.x + a, this.y + b);
        }
        sub(a, b) {
            if (arguments.length === 1)
                return new Point(this.x - a.x, this.y - a.y);
            else
                return new Point(this.x - a, this.y - b);
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
    const WOOD_PLANKS_BLOCK = 5;
    const BEDROCK_BLOCK = 7;
    const WATER_BLOCK = 8;
    const LAVA_BLOCK = 10;
    const SAND_BLOCK = 12;
    const GOLD_ORE_BLOCK = 14;
    const IRON_ORE_BLOCK = 15;
    const COAL_ORE_BLOCK = 16;
    const WOOD_BLOCK = 17;
    const LEAVES_BLOCK = 18;
    const TORCH_BLOCK = 19;
    const GLASS_BLOCK = 20;
    const STONE_BRICK_BLOCK = 21;
    const DIAMOND_ORE_BLOCK = 56;
    const IRON_WOOD_BLOCK = 57;
    const GOLD_LEAF_BLOCK = 58;
    const CLOSED_TRAPDOOR_BLOCK = 60;
    const TRAPDOOR_BLOCK = 61;
    const CLOSED_DOOR_BLOCK = 62;
    const DOOR_BLOCK = 63;

    const NONE_ZONE = 0;
    const LAKE_ZONE = 1;
    const CAVE_ZONE = 2;
    const LAVA_LAKE_ZONE = 3;
    // const ORE_ZONE = 4;
    const CAVE_SPECIAL_ZONE = 5; //Зона пещеры, не предназначенная для переопределения
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
            return;
        worldMap[x][y][layer] = block;
    }
    const getBlock = (x, y, layer) => {
        if (x < 0 || y < 0 || x >= width || y >= height)
            return AIR_BLOCK;
        return worldMap[x][y][layer];
    }
    const isBlock = (x, y, layer) => {
        if (x < 0 || y < 0 || x >= width || y >= height)
            return undefined;
        return worldMap[x][y][layer] !== undefined && worldMap[x][y][layer] !== AIR_BLOCK;
    }
    const setZone = (x, y, zone) => {
        if (x < 0 || y < 0 || x >= width || y >= height)
            return;
        worldZones[x][y] = zone;
    }
    const getZone = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height)
            return NONE_ZONE;
        return worldZones[x][y] !== undefined ? worldZones[x][y] : NONE_ZONE;
    }
    //#endregion
     
    let elevationMap = new Array();
    let shadowMap = new Array();

    let dontGenHereArr = new Array(width);
    for (let x = 0; x < width; x++) {
        dontGenHereArr[x] = false;
    }

    //Функции рисования сложных объектов (эллипсы, линии, карты и т.д.)
    //#region draws
    const drawLine = (startPoint, stopPoint, setf) => {
        if (Math.abs(stopPoint.x - startPoint.x) >= Math.abs(stopPoint.y - startPoint.y)) {
            if (startPoint.x > stopPoint.x) {
                let t = startPoint;
                startPoint = stopPoint;
                stopPoint = t;
            }
            let interval = stopPoint.sub(startPoint).add(1, 0);
            let theta = Math.atan2(interval.y, interval.x);
            let curH = startPoint.y;
            for (let x = 0; x < Math.abs(interval.x); x++) {
                setf(startPoint.x + x, Math.round(curH));
                curH += theta;
            }
        }
        else {
            if (startPoint.y > stopPoint.y) {
                let t = startPoint;
                startPoint = stopPoint;
                stopPoint = t;
            }
            let interval = stopPoint.sub(startPoint).add(0, 1);
            let theta = Math.atan2(interval.x, interval.y);
            let curW = startPoint.x;
            for (let y = 0; y < Math.abs(interval.y); y++) {
                setf(Math.round(curW), startPoint.y + y);
                curW += theta;
            }
        }
    }

    const createCaveSeg = (startPoint, stopPoint, zone) => {
        const setCaveBlock = (x, y) => {
            if (getZone(x, y) === LAKE_ZONE || getZone(x, y + 1) === LAKE_ZONE)
                return;
            if (zone !== undefined)
                setZone(x, y, zone);
            setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
        }

        const drawCircle = (center, radius, setf) => {
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

        let lastR = random() < 0.25 ? 3 : 2;
        lastR = random() < 0.25 ? lastR + 1 : lastR;
        drawLine(startPoint, stopPoint, (x, y) => {
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
            drawCircle(new Point(x, y), cr, setCaveBlock);
        });
    }

    const drawByScheme = (loc, blocks, firstL, secondL) => {
        const drawToLayer = (layer, scheme) => {
            for (let i = 0; i < scheme.length; i++) {
                for (let j = 0; j < scheme[i].length; j++) {
                    if (scheme[i][j] === ' ')
                        continue;
                    if (scheme[i][j] === '.')
                        setBlock(loc.x + j, loc.y + i, layer, AIR_BLOCK);
                    if (blocks[scheme[i][j]] === undefined)
                        continue; //Или throw? Или в log?
                    setBlock(loc.x + j, loc.y + i, layer, blocks[scheme[i][j]]);
                }
            }
        }
        drawToLayer(GameArea.FIRST_LAYOUT, firstL);
        drawToLayer(GameArea.SECOND_LAYOUT, secondL);
    }
    //#endregion

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
            if (getZone(x, y) === LAKE_ZONE || getZone(x, y + 1) === LAKE_ZONE)
                return;
            setZone(x, y, CAVE_ZONE);
            setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
        }

        // Расширение пещеры по её "направляющей"
        const holeGen = (caveX, caveY, maxRadius, dontGenHereArr, dontGenCountX) => {
            // Выбор радиуса
            let rand = random() , radius = 2;
            while (rand < 0.5) {
                if (radius === maxRadius) {
                    break;
                }
                rand = random();
                radius++;
            }

            let r_2 = radius * radius;
            let r1_2 = (radius - 1) * (radius - 1);

            // Очистка блоков в радиусе
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    if (caveX + i >= 0 && caveX + i < width && caveY + j >= 0 && caveY + j < height) {
                        let t = random() < 0.3 ? r1_2 : r_2;
                        if (t >= i * i + j * j) {
                            setCaveBlock(caveX + i, caveY + j);
                            if (!dontGenHereArr[i]) {
                                dontGenHereArr[i] = true;
                                dontGenCountX++;
                            }
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
        //Создает прямую пещеру между двумя точками
        const checkSegment = (startPoint, stopPoint) => {
            //Возвращает false, если сегмент никого не пересекает или точку пересечения
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
                createCaveSeg(segs[i - 1], segs[i], CAVE_ZONE);
            }
        }

        //Процесс выбора точек старта
        let seqStart = Math.floor(random() * 90);
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
            createHorCave(new Point(xi, yi));
        }
        underSpecial1Gen(200, 100);
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
                            if (getBlock(i, j, GameArea.FIRST_LAYOUT) === STONE_BLOCK) {
                                // setZone(i, j, ORE_ZONE);
                                setBlock(i, j, GameArea.FIRST_LAYOUT, type);
                            }
                            if (random() < 0.5 && getBlock(i, j, GameArea.SECOND_LAYOUT) === STONE_BLOCK) {
                                // setZone(i, j, ORE_ZONE);
                                setBlock(i, j, GameArea.SECOND_LAYOUT, type);
                            }
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
            return (getZone(x + 1, y) === NONE_ZONE)
                && (getZone(x - 1, y) === NONE_ZONE)
                && (getZone(x, y + 1) === NONE_ZONE)
                && (getZone(x, y - 1) === NONE_ZONE);
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
                if (layout === GameArea.FIRST_LAYOUT) {
                    treeArr[treeArrX[i]][treeArrY[i]] = 1;
                    setBlock(treeArrX[i], treeArrY[i], GameArea.FIRST_LAYOUT, WOOD_BLOCK);
                    if (getBlock(treeArrX[i], treeArrY[i] - 1, GameArea.FIRST_LAYOUT) === GRASS_BKOCK)
                        setBlock(treeArrX[i], treeArrY[i] - 1, GameArea.FIRST_LAYOUT, DIRT_BLOCK);
                } else {
                    treeArr[treeArrX[i]][treeArrY[i]] = 3;
                    setBlock(treeArrX[i], treeArrY[i], GameArea.SECOND_LAYOUT, WOOD_BLOCK);
                    if (getBlock(treeArrX[i], treeArrY[i] - 1, GameArea.SECOND_LAYOUT) === GRASS_BKOCK)
                        setBlock(treeArrX[i], treeArrY[i] - 1, GameArea.SECOND_LAYOUT, DIRT_BLOCK);
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

    //Методы генерации особых объектов
    //#region specials
    
    // Создание особых подхемных пещер 1 типа (с деревом)
    const underSpecial1Gen = (minHeight, maxHeightShift, count) => {
        const fillEllipse = (center, xr, yr, setf) => {
            //setf - функция установки точки
            let xr_2 = xr * xr;
            let yr_2 = yr * yr;
            let xr1_2 = (xr - 2) * (xr - 1);
            let yr1_2 =  (yr - 2) * (yr - 1);
            for (let x = -xr; x < xr; x++) {
                let x_2 = x * x;
                for (let y = -yr; y < yr; y++) {
                    let tx = random() < 0.4 ? xr1_2 : xr_2;
                    let ty = random() < 0.4 ? yr1_2 : yr_2;
                    if (x * x / tx + y * y / ty < 1)
                        setf(center.x + x, center.y + y);
                }
            }
        }

        const findCaveNear = (loc, xradius, yradius) => {
            let flag = false;
            for (let i = 3; i < yradius + 25; i += 3) { //Справа
                for (let j = 0; j < 15; j++) {
                    let curx = loc.x + xradius + j * 2;
                    let cury = loc.y + i;
                    if (curx < 5 || curx > width - 5)
                        break;
                    if (getZone(curx, cury) === CAVE_ZONE) {
                        createCaveSeg(new Point(curx, cury).add(3, 3), loc, CAVE_ZONE);
                        flag = true;
                        break;
                    }
                }
                if (flag)
                    break;
            }
            flag = false;
            for (let i = 3; i < yradius + 25; i += 3) { //Слева
                for (let j = 0; j < 15; j++) {
                    let curx = loc.x - xradius - j * 2;
                    let cury = loc.y + i;
                    if (curx < 5 || curx > width - 5)
                        break;
                    if (getZone(curx, cury) === CAVE_ZONE) {
                        createCaveSeg(new Point(curx, cury).add(-3, 3), loc, CAVE_ZONE);
                        flag = true;
                        break;
                    }
                }
                if (flag)
                    break;
            }
            flag = false;
            for (let i = yradius + 4; i < yradius + 25; i += 3) {
                for (let j = -1; j < 2; j++) {
                    let curx = loc.x + j * 5;
                    let cury = loc.y + i;
                    if (curx < 5 || curx > width - 5)
                        break;
                    if (getZone(curx, cury) === CAVE_ZONE) {
                        createCaveSeg(new Point(curx, cury).add(0, 4), loc, CAVE_ZONE);
                        flag = true;
                        break;
                    }
                }
                if (flag)
                    break;
            }
        } 

        const clearZone = (loc, xradius, yradius) => {
            const outaCoeff = 4;
            const outbCoeff = 3;
            const inCoeff = 10;
            const tanCoeff = 0.8;
            for (let x = -xradius - Math.ceil(outaCoeff); x <= xradius + Math.ceil(outaCoeff); x++) {
                let x_2 = x * x;
                for (let y = -yradius - Math.ceil(outbCoeff); y <= yradius + Math.ceil(outbCoeff); y++) {
                    let y_2 = y * y;
                    let wave = Math.abs(Math.sin(inCoeff * Math.atan(tanCoeff * y / x)));
                    let xr_2 = (xradius + outaCoeff * wave) * (xradius + outaCoeff * wave);
                    let yr_2 = (yradius + outbCoeff * wave) * (yradius + outbCoeff * wave);
                    if (x_2 / xr_2 + y_2 / yr_2 < 1) {
                        setZone(loc.x + x, loc.y + y, CAVE_SPECIAL_ZONE);
                        setBlock(loc.x + x, loc.y + y, GameArea.FIRST_LAYOUT, STONE_BLOCK);
                        setBlock(loc.x + x, loc.y + y, GameArea.SECOND_LAYOUT, STONE_BLOCK);
                        setBlock(loc.x + x, loc.y + y, GameArea.BACK_LAYOUT, STONE_BLOCK);
                    }
                }
            }
            setZone(loc.x, loc.y, CAVE_SPECIAL_ZONE);
            setBlock(loc.x, loc.y, GameArea.FIRST_LAYOUT, STONE_BLOCK);
            setBlock(loc.x, loc.y, GameArea.SECOND_LAYOUT, STONE_BLOCK);
            setBlock(loc.x, loc.y, GameArea.BACK_LAYOUT, STONE_BLOCK);
        }

        const create = (loc, xradius, yradius, dirtLevel) => {
            //Смещение центра эллипса, чтобы координата отражала корень дерева
            let center = loc.add(0, yradius - dirtLevel);
            clearZone(center, xradius + 4, yradius + 4);
            //Выкапываем пещеру
            fillEllipse(center, xradius, yradius, (x, y) => {
                setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
            });
            fillEllipse(center, xradius - 4, yradius - 3, (x, y) => {
                setBlock(x, y, GameArea.SECOND_LAYOUT, AIR_BLOCK);
                if (random() < 0.05)
                    setBlock(x, y, GameArea.BACK_LAYOUT, COBBLESTONE_BLOCK);
            });
            //Ищем рядом пещеру для присоединения
            findCaveNear(center, xradius, yradius);
            //Насыпаем землю
            const fillSideByDirt = (side) => {
                let sh = 0;
                let dirtSh = 1;
                for (let i = 0; side * i < xradius; i += side) {
                    if (getBlock(loc.x + i, loc.y + sh + 2, GameArea.FIRST_LAYOUT) !== AIR_BLOCK) {
                        //Если два блока над точкой есть блок - ставим землю над точкой
                        setBlock(loc.x + i, loc.y + sh + 1, GameArea.FIRST_LAYOUT, DIRT_BLOCK);
                        setBlock(loc.x + i, loc.y + sh + 1, GameArea.SECOND_LAYOUT, DIRT_BLOCK);
                    }
                    if (getBlock(loc.x + i, loc.y + sh + 1, GameArea.FIRST_LAYOUT) !== AIR_BLOCK) {
                        //Если над точкой есть блок - ставим землю в точку
                        setBlock(loc.x + i, loc.y + sh, GameArea.FIRST_LAYOUT, DIRT_BLOCK);
                        setBlock(loc.x + i, loc.y + sh, GameArea.SECOND_LAYOUT, DIRT_BLOCK);
                    }
                    else {
                        //Иначе ставим траву в точку
                        setBlock(loc.x + i, loc.y + sh, GameArea.FIRST_LAYOUT, GRASS_BKOCK);
                        setBlock(loc.x + i, loc.y + sh, GameArea.SECOND_LAYOUT, GRASS_BKOCK);
                    }
                    let j = 1;
                    while (getBlock(loc.x + i, loc.y + sh - j, GameArea.FIRST_LAYOUT) === AIR_BLOCK
                        || getBlock(loc.x + i, loc.y + sh - j - 1, GameArea.FIRST_LAYOUT) === AIR_BLOCK
                        || getBlock(loc.x + i, loc.y + sh - j - 2, GameArea.FIRST_LAYOUT) === AIR_BLOCK) {
                        setBlock(loc.x + i, loc.y + sh - j, GameArea.FIRST_LAYOUT, DIRT_BLOCK);
                        setBlock(loc.x + i, loc.y + sh - j, GameArea.SECOND_LAYOUT, DIRT_BLOCK);
                        j++;
                    }
                    for (let k = 0; k < dirtSh; k++) {
                        setBlock(loc.x + i, loc.y + sh - j - k, GameArea.FIRST_LAYOUT, DIRT_BLOCK);
                        setBlock(loc.x + i, loc.y + sh - j - k, GameArea.SECOND_LAYOUT, DIRT_BLOCK);
                    }
                    let rand = random();
                    if (rand < 0.3)
                        sh += 1;
                    else if (rand < 0.5)
                        sh -= 1;
                    rand = random();
                    if (rand < 0.5)
                        dirtSh = 1;
                    else if (rand < 0.9)
                        dirtSh = 2;
                    else
                        dirtSh = 3;
                }
            }
            fillSideByDirt(+1);
            fillSideByDirt(-1);
            //Устанавливаем дерево
            const setTree = (loc, width, height) => {
                //width - максимальное отклонение от цента по x
                const maxDepth = 4;

                const setLeafBlock = (x, y) => {
                    if (getBlock(x, y, GameArea.FIRST_LAYOUT) !== IRON_WOOD_BLOCK) {
                        setBlock(x, y, GameArea.FIRST_LAYOUT, GOLD_LEAF_BLOCK);
                        setBlock(x, y, GameArea.SECOND_LAYOUT, AIR_BLOCK);
                    }
                };

                const createBranch = (start, depth)=> {
                    //TODO: красивые деревья
                    if (random() < 0.3) { //Две ветки
                        let rand = random();
                        let dy = Math.floor(height / maxDepth);
                        dy += Math.floor(random() * 4) - 2;
                        if (start.y + dy > loc.y + height)
                            return;
                        let dx = Math.floor(random() * 4);
                        if (start.x + dx <= loc.x + width) {
                            let nextP = start.add(dx, dy);
                            drawLine(start, nextP, (x, y) => {
                                setBlock(x, y, GameArea.FIRST_LAYOUT, IRON_WOOD_BLOCK);
                            });
                            fillEllipse(nextP, 4, dy, setLeafBlock);
                            if (depth != maxDepth && rand < 0.49)
                                createBranch(nextP, depth + 1);
                        }
                        dy = Math.floor(height / maxDepth);
                        dy += Math.floor(random() * 4) - 2;
                        if (start.y + dy > loc.y + height)
                            return;
                        dx = Math.floor(random() * 4);
                        if (start.x + dx <= loc.x + width) {
                            let nextP = start.add(dx, dy);
                            drawLine(start, nextP, (x, y) => {
                                setBlock(x, y, GameArea.FIRST_LAYOUT, IRON_WOOD_BLOCK);
                            });
                            fillEllipse(nextP, 4, dy, setLeafBlock);
                            if (depth != maxDepth && rand > 0.51)
                                createBranch(nextP, depth + 1);
                        }
                    }
                    else { //Одна ветка
                        let dy = Math.floor(height / maxDepth);
                        dy += Math.floor(random() * 4) - 2;
                        if (start.y + dy > loc.y + height)
                            return;
                        let dx = Math.floor(random() * 4);
                        dx *= loc.x !== start.x ? Math.sign(loc.x - start.x) : (random() < 0.5 ? -1 : 1);
                        if (start.x + dx > loc.x + width || start.x + dx < loc.x - width)
                            dx = -dx;
                        let nextP = start.add(dx, dy);
                        drawLine(start, nextP, (x, y) => {
                            setBlock(x, y, GameArea.FIRST_LAYOUT, IRON_WOOD_BLOCK);
                        });
                        fillEllipse(nextP, 5, dy, setLeafBlock);
                        if (depth != maxDepth)
                            createBranch(nextP, depth + 1);
                    }
                }

                drawLine(loc, loc.add(0, 3), (x, y) => {
                    setBlock(x, y, GameArea.FIRST_LAYOUT, IRON_WOOD_BLOCK);
                });
                createBranch(loc.add(0, 3));
            }
            setBlock(loc.x, loc.y, GameArea.FIRST_LAYOUT, DIRT_BLOCK);
            setTree(loc.add(0, 1), xradius - 4, 2 * yradius - dirtLevel - 10);
            // __observe.push(loc); //TEMP
        }

        const checkZone = (center, w, h) => {
            if (center.x - w < 5 || center.x + w > width - 5)
                return false;
            for (let i = -w; i <= w; i++)
                for (let j = -h; j <= h; j++)
                    if (getZone(center.x + i, center.y + j) === CAVE_SPECIAL_ZONE)
                        return false;
            return true;
        }

        for (let i = 0; i < count; i++) {
            let curX = (i + 1) * (width - 100) / count;
            curX += Math.floor(random() * ((width - 100) / (2 * count)));
            let curY = Math.floor(random() * (elevationMap[curX] - minHeight - maxHeightShift)) + minHeight;
            let xradius = 13 + Math.floor(random() * 5);
            let yradius = 20 + Math.floor(random() * 5);
            let dirtLevel = random() < 0.2 ? 5 : 6;
            dirtLevel += random() < 0.2 ? 1 : 2;
            dirtLevel += random() < 0.2 ? 0 : 1;
            if (checkZone(new Point(curX, curY + yradius - dirtLevel), xradius + 3, yradius + 3)) {
                create(new Point(curX, curY), xradius, yradius, dirtLevel);
            }
            else {
                i--;
                continue;
            }
        }
    }

    //Создание подземной деревни
    const villageGen = () => {
        const vLoc = new Point(500, 900); //Top-left corner
        const vWidth = 190;
        const vHeight = 90;

        let lCenterEnter, rCenterEnter; //Входы в центр

        const clearZone = () => {
            const clearBlock = (x, y) => {
                setZone(x, y, CAVE_SPECIAL_ZONE);
                setBlock(x, y, GameArea.FIRST_LAYOUT, STONE_BLOCK);
                setBlock(x, y, GameArea.SECOND_LAYOUT, STONE_BLOCK);
                setBlock(x, y, GameArea.BACK_LAYOUT, STONE_BLOCK);
            }
            const vW_2 = vWidth * vWidth;
            const vH_2 = vHeight * vHeight;
            //Верхняя и нижняя границы
            for (let i = 0; i <= vWidth; i++) {
                let s = i - vWidth / 2;
                let bound = 5 * Math.min((1 - (4 * s * s / vW_2)), Math.abs(Math.sin(i / 3)));
                // bound += random() * 3 - 1;
                for (let j = 0; j <= 2 + bound; j++) {
                    clearBlock(vLoc.x + i, vLoc.y + j);
                    clearBlock(vLoc.x + i, vLoc.y - vHeight - j);
                }
            }
            //Правая и левая границы
            for (let i = 0; i <= vHeight; i++) {
                let s = i - vHeight / 2;
                let bound = 5 * Math.min((1 - (4 * s * s / vH_2)), Math.abs(Math.sin(i / 3)));
                // bound += random() * 3 - 1;
                for (let j = 0; j <= 2 + bound; j++) {
                    clearBlock(vLoc.x - j, vLoc.y - i);
                    clearBlock(vLoc.x + vWidth + j, vLoc.y - i);
                }
            }
            // Заливка
            for (let i = 0; i < vWidth; i++)
                for (let j = 0; j < vHeight; j++)
                    clearBlock(vLoc.x + i, vLoc.y - j);
        }
        
        //Максимальный размер - 27x18
        const createSmall = (loc, mirror) => {
            const createCave = (w, h) => {
                //Похоже на прямленный скругольник
                //w - ширина ровной части
                //h - высота в ровной части

                const fillEllipse = (center, xr, yr, setf) => {
                    //setf - функция установки точки
                    let xr_2 = xr * xr;
                    let yr_2 = yr * yr;
                    let xr1_2 = (xr + 1) * (xr + 1);
                    let yr1_2 =  (yr + 2) * (yr + 2);
                    for (let x = -xr; x < xr; x++) {
                        let x_2 = x * x;
                        for (let y = -yr; y < yr; y++) {
                            let tx = random() < 0.25 ? xr1_2 : xr_2;
                            let ty = random() < 0.25 ? yr1_2 : yr_2;
                            if (x * x / tx + y * y / ty < 1)
                                setf(center.x + x, center.y + y);
                        }
                    }
                }

                for (let i = Math.floor(-w / 2); i <= w / 2; i++) {
                    let fl = random() < 0.25 ? 1 : 0;
                    for (let j = Math.floor(-h / 2); j <= h / 2 + fl; j++) {
                        setBlock(loc.x + i, loc.y + j, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                        setBlock(loc.x + i, loc.y + j, GameArea.SECOND_LAYOUT, AIR_BLOCK);
                        setBlock(loc.x + i, loc.y + j, GameArea.BACK_LAYOUT, random() < 0.2 ? COBBLESTONE_BLOCK : STONE_BLOCK);
                    }
                }
                let side = Math.floor(random() * 4) + 6;
                fillEllipse(new Point(loc.x + Math.floor(w / 2) - 1, loc.y), side, Math.floor(h / 2) + 1, (x, y) => {
                    setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                    setBlock(x, y, GameArea.SECOND_LAYOUT, AIR_BLOCK);
                    setBlock(x, y, GameArea.BACK_LAYOUT, random() < 0.2 ? COBBLESTONE_BLOCK : STONE_BLOCK);
                });
                side = Math.floor(random() * 4) + 6;
                fillEllipse(new Point(loc.x - Math.floor(w / 2) + 1, loc.y), side, Math.floor(h / 2) + 1, (x, y) => {
                    setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                    setBlock(x, y, GameArea.SECOND_LAYOUT, AIR_BLOCK);
                    setBlock(x, y, GameArea.BACK_LAYOUT, random() < 0.2 ? COBBLESTONE_BLOCK : STONE_BLOCK);
                });

                let t = loc.x;
                while (getBlock(t, loc.y, GameArea.FIRST_LAYOUT) === AIR_BLOCK)
                    t += mirror ? -1 : 1;
                t += mirror ? 2 : -2;
                // createCaveSeg(new Point(t, loc.y), mirror ? rCenterEnter : lCenterEnter, CAVE_SPECIAL_ZONE);
                drawLine(new Point(t, loc.y), mirror ? rCenterEnter : lCenterEnter, (x, y) => {
                    fillEllipse(new Point(x, y), 4, 5, (tx, ty) => {
                        setBlock(tx, ty, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                    });
                });
                fillEllipse(new Point(t, loc.y), 1, 1, (x, y) => {
                    setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                    setBlock(x, y, GameArea.SECOND_LAYOUT, AIR_BLOCK);
                });
            }

            const createHouse = (loc) => {
                const _ROOF_BLOCK = WOOD_BLOCK;

                const blockMap = {
                    //Пробел - не изменять этот блок
                    //Точка - убрать любые блоки
                    'w': WOOD_PLANKS_BLOCK, //Стены
                    'r': _ROOF_BLOCK, //Крыша
                    'd': CLOSED_DOOR_BLOCK,
                    't': CLOSED_TRAPDOOR_BLOCK,
                    'l': TORCH_BLOCK,
                    's': WOOD_PLANKS_BLOCK, //Это должен быть сундук
                };
                let firstL = [
                    '   rrrrrrrr  ',
                    '  r...l...d  ',
                    ' rr.......d  ',
                    ' rr.......d  ',
                    'rrwwttwwwwwrr',
                    'rrw.......wrr',
                    'r w...l...w r',
                    '  w.......w  ',
                    '  w.......w  ',
                    '  w....s..w  ',
                    '  wwwwwwwww  '
                ].reverse();
                let secondL = [
                    '   rrrrrrrr  ',
                    '  rrrrrrrrr  ',
                    ' rrrrrrrrrrr ',
                    ' rrrrrrrrrrr ',
                    'rrwwwwwwwwwrr',
                    'rrwwwwwwwwwrr',
                    'r wwwwwwwww r',
                    '  wwwwwwwww  ',
                    '  wwwwwwwww  ',
                    '  wwwwwwwww  ',
                    '  wwwwwwwww  '
                ].reverse();
                if (mirror) {
                    for (let i = 0; i < firstL.length; i++)
                        firstL[i] = firstL[i].split('').reverse().join('');
                    for (let i = 0; i < secondL.length; i++)
                        secondL[i] = secondL[i].split('').reverse().join('');
                }
                drawByScheme(loc, blockMap, firstL, secondL);
            }

            createCave(14, 14);
            if (mirror)
                createHouse(new Point(loc.x - 6, loc.y - 9));
            else
                createHouse(new Point(loc.x - 6, loc.y - 9));
        }

        const createCenter = (loc) => {
            const fillEllipse = (center, xr, yr, setf) => {
                //setf - функция установки точки
                let xr_2 = xr * xr;
                let yr_2 = yr * yr;
                let xr1_2 = (xr + 2) * (xr + 2);
                let yr1_2 =  (yr + 2) * (yr + 2);
                for (let x = -xr; x < xr; x++) {
                    let x_2 = x * x;
                    for (let y = -yr; y < yr; y++) {
                        let tx = random() < 0.25 ? xr1_2 : xr_2;
                        let ty = random() < 0.25 ? yr1_2 : yr_2;
                        if (x * x / tx + y * y / ty < 1)
                            setf(center.x + x, center.y + y);
                    }
                }
            }

            const xr = 25, yr = 30;
            let waterLevel = loc.y - Math.floor(random() * 8 - 4) - yr + 7;
            fillEllipse(loc, xr, yr, (x, y) => {
                if (y > waterLevel) {
                    setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                    setBlock(x, y, GameArea.SECOND_LAYOUT, AIR_BLOCK);
                }
                else {
                    setBlock(x, y, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                    setBlock(x, y, GameArea.SECOND_LAYOUT, LAVA_BLOCK);
                }
                setBlock(x, y, GameArea.BACK_LAYOUT, random() < 0.2 ? COBBLESTONE_BLOCK : STONE_BLOCK);
            });
            for (let i = -xr - 4; i <= xr + 4; i++) {
                let wave = Math.round((Math.cos(i / 1.5) / 2 + 0.5) * 3);
                wave += Math.round(random() * 2 - 1);
                for (let j = 0; j <= wave; j++)
                    setBlock(loc.x + i, waterLevel + 1 + j, GameArea.SECOND_LAYOUT, STONE_BLOCK);
            }
            drawLine(loc.add(-30, 0), loc.add(30, 0), (x, y) => {
                fillEllipse(new Point(x, y), 4, 5, (tx, ty) => {
                    setBlock(tx, ty, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                });
            });
            lCenterEnter = loc.add(-30, 0);
            rCenterEnter = loc.add(30, 0);
            
            //Ворота на входе
            for (let i = -5; i <= 5; i++) {
                for (let j = -1; j <= 1; j++) {
                    setBlock(rCenterEnter.x + j - 5, rCenterEnter.y + i, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(rCenterEnter.x + j - 5, rCenterEnter.y + i, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                    setBlock(lCenterEnter.x + j + 5, rCenterEnter.y + i, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(lCenterEnter.x + j + 5, rCenterEnter.y + i, GameArea.FIRST_LAYOUT, AIR_BLOCK);
                }
                setBlock(rCenterEnter.x - 5, rCenterEnter.y + i, GameArea.FIRST_LAYOUT, CLOSED_DOOR_BLOCK);
                setBlock(lCenterEnter.x + 5, rCenterEnter.y + i, GameArea.FIRST_LAYOUT, CLOSED_DOOR_BLOCK);
            }
            for (let i = -1; i <= 1; i++) {
                for (let j = 0; j <= 2; j++) {
                    setBlock(rCenterEnter.x + i - 5, rCenterEnter.y + j + 6, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(rCenterEnter.x + i - 5, rCenterEnter.y - j - 6, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(lCenterEnter.x + i + 5, lCenterEnter.y + j + 6, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(lCenterEnter.x + i + 5, lCenterEnter.y - j - 6, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(rCenterEnter.x + i - 5, rCenterEnter.y + j + 6, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(rCenterEnter.x + i - 5, rCenterEnter.y - j - 6, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(lCenterEnter.x + i + 5, lCenterEnter.y + j + 6, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                    setBlock(lCenterEnter.x + i + 5, lCenterEnter.y - j - 6, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                }
            }
            for (let i = 0; i <= 5; i++) {
                setBlock(rCenterEnter.x - 5, rCenterEnter.y + i + 5, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                setBlock(rCenterEnter.x - 5, rCenterEnter.y - i - 5, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                setBlock(lCenterEnter.x + 5, lCenterEnter.y + i + 5, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                setBlock(lCenterEnter.x + 5, lCenterEnter.y - i - 5, GameArea.FIRST_LAYOUT, STONE_BRICK_BLOCK);
                setBlock(rCenterEnter.x - 5, rCenterEnter.y + i + 5, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                setBlock(rCenterEnter.x - 5, rCenterEnter.y - i - 5, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                setBlock(lCenterEnter.x + 5, lCenterEnter.y + i + 5, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
                setBlock(lCenterEnter.x + 5, lCenterEnter.y - i - 5, GameArea.SECOND_LAYOUT, STONE_BRICK_BLOCK);
            }

            const blocksMap = {
                'b': STONE_BRICK_BLOCK,
                'c': COBBLESTONE_BLOCK,
                'l': TORCH_BLOCK,
                's': WOOD_PLANKS_BLOCK, //Это должен быть сундук
            }
            //Центральная площадка
            const firstL = [
                '    bbbbb    ',
                '   bb...bb   ',
                '  bb.....bb  ',
                ' bb.......bb ',
                ' ........... ',
                ' ........... ',
                '.............',
                '...l.....l...',
                '.............',
                '.............',
                '.............',
                '......s......',
                '..bbbbbbbbb..',
                'bbbbbbbbbbbbb',
                ' cbbbcccbbbc ',
                ' ccbbbcbbbcc ',
                '  cbbbbbbbc  ',
                '  ccbbbbbcc  ',
                '   ccccccc   ',
            ].reverse();
            const secondL = [
                '    bbbbb    ',
                '   bbbbbbb   ',
                '  bbbbbbbbb  ',
                ' bbb bbb bbb ',
                ' bbb bbb bbb ',
                ' b b bbb b b ',
                'bb b bbb b bb',
                'bb b bbb b bb',
                'bb b bbb b bb',
                'bb b bbb b bb',
                'bb b bbb b bb',
                'bbbbbbbbbbbbb', //Floor
                'bbbbbbbbbbbbb',
                'bbbbbbbbbbbbb',
                ' cbbbcccbbbc ',
                ' ccbbbcbbbcc ',
                '  cbbbbbbbc  ',
                '  ccbbbbbcc  ',
                '   ccccccc   ',
            ].reverse();

            for (let i = loc.y - 2; i <= loc.y + yr + 1; i++) {
                setBlock(loc.x - 5, i, GameArea.SECOND_LAYOUT, WOOD_BLOCK);
                setBlock(loc.x + 5, i, GameArea.SECOND_LAYOUT, WOOD_BLOCK);
            }
            drawByScheme(loc.add(-6, -9), blocksMap, firstL, secondL);

            //Мосты
            drawLine(lCenterEnter.add(6, -6), new Point(loc.x - 7, loc.y - 4), (x, y) => {
                setBlock(x, y, GameArea.FIRST_LAYOUT, WOOD_PLANKS_BLOCK);
                let fenceHeigh = (x % 3 === 0) ? 3 : 2;
                for (let i = 0; i < fenceHeigh; i++)
                    setBlock(x, y + i, GameArea.SECOND_LAYOUT, WOOD_PLANKS_BLOCK);
            });
            drawLine(rCenterEnter.add(-6, -6), new Point(loc.x + 7, loc.y - 4), (x, y) => {
                setBlock(x, y, GameArea.FIRST_LAYOUT, WOOD_PLANKS_BLOCK);
                let fenceHeigh = (x % 3 === 0) ? 3 : 2;
                for (let i = 0; i < fenceHeigh; i++)
                    setBlock(x, y + i, GameArea.SECOND_LAYOUT, WOOD_PLANKS_BLOCK);
            });
        }

        clearZone();
        createCenter(vLoc.add(Math.floor(vWidth / 2), -Math.floor(vHeight / 2)));
        let points = [
            new Point(vLoc.x + 20, vLoc.y - 20), 
            new Point(vLoc.x + 36, vLoc.y - vHeight + 20),
            new Point(vLoc.x + vWidth - 40, vLoc.y - 20),
            new Point(vLoc.x + vWidth - 26, vLoc.y - vHeight + 20)
        ];
        let shift = new Point(Math.round(random() * 16 - 8), Math.round(random() * 10 - 5));
        createSmall(points[0].add(shift), false);
        shift = new Point(Math.round(random() * 16 - 8), Math.round(random() * 10 - 5));
        createSmall(points[1].add(shift), false);
        shift = new Point(Math.round(random() * 16 - 8), Math.round(random() * 10 - 5));
        createSmall(points[2].add(shift), true);
        shift = new Point(Math.round(random() * 16 - 8), Math.round(random() * 10 - 5));
        createSmall(points[3].add(shift), true);
        
        __observe.push(vLoc); //TEMP
    }
    //#endregion

    //Процесс генерации
    landGen(Math.floor((height / 10) * 5), Math.floor((height / 10) * 8), width, height); //elevationMap + озера
    surfaceGen();
    caveGen(width / 100, height / 3);
    undergroundCavseGen(100, 50, 60);
    lavaLakes(20, height / 2, 1 / 4000);
    treeGen(16, 19, Math.floor(width * 2 / 3));

    villageGen();
    underSpecial1Gen(200, 200, 5);
    oreGen();
    
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
