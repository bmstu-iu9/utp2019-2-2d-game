class Game {

  constructor () {
    this.color  = "rgb(0,0,0)";
    this.colors = [0, 0, 0];
  }

  update() {

    for (let index = 0; index < 3; index ++) {
      const newColor = Math.floor(Math.random() * 255);
      this.colors[index] = newColor;
    }

    this.color = "rgb(" + this.colors[0] + "," + this.colors[1] + "," + this.colors[2] + ")";

  }

};
