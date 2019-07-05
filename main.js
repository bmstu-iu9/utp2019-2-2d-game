"use strict";
window.addEventListener("load", (event) => {

  const render = () => {
    display.fill(game.world.backgroundColor);
    display.drawWorld(game.world.map, game.player.x-128, game.player.y-128, 256, 256, game);
    display.render();
  };

  const update = () => {
    if (controller.left.active)  { game.player.move("left");  }
    if (controller.right.active) { game.player.move("right"); }
    if (controller.up.active)    { game.player.jump(); controller.up.active = false; }
    game.update();
  };

  const KDU = (event) => {controller.keyDownUp(event);};
  const resize = (event) => {
    display.resize(document.documentElement.clientWidth - 32, document.documentElement.clientHeight - 32, 64 / 64);
    display.render();
  };

  const controller = new Controller(); // Обработка ввода
  const display    = new Display(document.querySelector("canvas")); // Отрисовка игры, реакция на изменение размера окна
  const game       = new Game(); // Логика и состояние игры
  const engine     = new Engine(1000/30, render, update); // Взаимодействие остальных трех

  display.buffer.canvas.height = 256;
  display.buffer.canvas.width = 256;

  window.addEventListener("resize",  resize);
  window.addEventListener("keydown", KDU);
  window.addEventListener("keyup",   KDU);

  resize();
  engine.start();

});
