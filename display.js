class Display {

  constructor (canvas) {
    this.buffer  = document.createElement("canvas").getContext("2d"),
    this.context = canvas.getContext("2d");
  }

  drawRectangle(x, y, w, h, color) {
    this.buffer.fillStyle = color;
    this.buffer.fillRect(Math.round(x), Math.round(y), w, h);
  }

  drawWorld(map, x, y, w, h, game) {
    let min_x = Math.max(0,Math.floor(x/16));
    let min_y = Math.max(0,Math.floor(y/16));
    let max_x = Math.min(map[0].length,Math.ceil((x+w)/16));
    let max_y = Math.min(map.length,Math.ceil((y+h)/16));
    for (let i=min_y;i<max_y;i++) {
      for (let j=min_x;j<max_x;j++) {
        if (map[i][j]==1) {
          this.drawRectangle(16*j-x, 16*i-y, 16, 16, "#00ff00");
        }
      }
    }
    this.drawRectangle(game.player.x-x, game.player.y-y, game.player.w, game.player.h, game.player.color);
  }

  fill(color) {
    this.buffer.fillStyle = color;
    this.buffer.fillRect(0, 0, this.buffer.canvas.width, this.buffer.canvas.height);
  }

  render() { this.context.drawImage(this.buffer.canvas, 0, 0, this.buffer.canvas.width, this.buffer.canvas.height, 0, 0, this.context.canvas.width, this.context.canvas.height); }

  resize(w, h, ratio) {
    if (h/w > ratio) {
      this.context.canvas.height = w*ratio;
      this.context.canvas.width = w;
    } else {
      this.context.canvas.height = h;
      this.context.canvas.width = h/ratio;
    }
    this.context.imageSmoothingEnabled = false;
  }

};
