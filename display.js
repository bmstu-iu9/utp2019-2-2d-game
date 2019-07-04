class Display {

  constructor (canvas) {
    this.buffer  = document.createElement("canvas").getContext("2d"),
    this.context = canvas.getContext("2d");
  }

  drawRectangle(x, y, w, h, color) {
    this.buffer.fillStyle = color;
    this.buffer.fillRect(Math.round(x), Math.round(y), w, h);
  }

  drawMap(map) {
    for (let i=0;i<map.length;i++) {
      for (let j=0;j<map[i].length;j++) {
        if (map[i][j]==1) {
          this.drawRectangle(16*j, 16*i, 16, 16, "#00ff00");
        }
      }
    }
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
