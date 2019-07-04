// Генерация массива уровней поверхности
const landGen = (minHeight, maxHeight, widthWorld) => {
    let heights = [Math.floor((maxHeight + minHeight) / 2)];
    let i = 1;

    while (i < widthWorld) {
        let sectionLength = Math.round(Math.random() * 7) + 1; // Длина сектора возрастания или убывания
        let sign = Math.floor(Math.random() * 2);
        if (sign === 0) sign = -1;
        i += sectionLength;

        while (sectionLength > 0) {
            let delta = Math.ceil(Math.random() * 3); // Максимальная разница в уровнях = 2
            let nextHeight = heights[heights.length - 1] + delta * sign;
            if ((nextHeight >= maxHeight) || (nextHeight <= minHeight)) {
                i -= sectionLength;
                break;
            } else heights.push(nextHeight);
            sectionLength--;
        }
    }

    return heights;
}
