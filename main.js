"use strict";
window.addEventListener("load", (event) => {

  const render = () => {
    display.renderColor(game.color);
    display.render();
  };

  const update = () => {
    game.update();
  };

    const controller = new Controller(); // Обработка ввода
    const display    = new Display(document.querySelector("canvas")); // Отрисовка игры, реакция на изменение размера окна
    const game       = new Game(); // Логика и состояние игры
    const engine     = new Engine(1000/3, render, update); // Взаимодействие остальных трех

    window.addEventListener("resize",  display.handleResize);
    window.addEventListener("keydown", controller.handleKeyDownUp);
    window.addEventListener("keyup",   controller.handleKeyDownUp);

    display.resize();
    engine.start();

});
