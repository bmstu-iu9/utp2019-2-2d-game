class Engine {

  constructor(time_step, update, render) {

  this.accumulated_time        = 0;// Прошло времени с последнего обновления
  this.animation_frame_request = undefined,// ссылка на AFR
  this.time                    = undefined,// Время последнего цикла
  this.time_step               = time_step,// "Шаг" - записывается в виде 1000/x, где х - желаемый тикрейт

  this.updated = false;

  this.update = update;
  this.render = render;

  this.handleRun = (time_step) => { this.run(time_step); };

  }

  run(time_stamp) {

    this.accumulated_time += time_stamp - this.time;
    this.time = time_stamp;

    /* Обновляем состояние игры, если прошло достаточно времени */
    while(this.accumulated_time >= this.time_step) {
      this.accumulated_time -= this.time_step;
      this.update(time_stamp);
      this.updated = true;
    }

    /* Перерисовываем картинку, если обновились */
    if (this.updated) {
      this.updated = false;
      this.render(time_stamp);
    }

    this.animation_frame_request = window.requestAnimationFrame(this.handleRun); //Запрашиваем следующий кадр

  }

  start() {

    this.accumulated_time = this.time_step;
    this.time = window.performance.now();
    this.animation_frame_request = window.requestAnimationFrame(this.handleRun);

  }

  stop() {

    window.cancelAnimationFrame(this.animation_frame_request);

  }

};
