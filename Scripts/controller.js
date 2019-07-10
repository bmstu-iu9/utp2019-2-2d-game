class Controller {

  constructor() {
    this.down  = new ButtonInput();
    this.left  = new ButtonInput();
    this.right = new ButtonInput();
    this.up    = new ButtonInput();
  }

  keyDownUp(event) {

    const down = event.type == "keydown";

    switch(event.keyCode) {

      case 65: this.left.getInput(down);  break;
      case 87: this.up.getInput(down);    break;
      case 68: this.right.getInput(down); break;
      case 83: this.down.getInput(down);

    }

  }

};

class ButtonInput {

  constructor() {this.active = this.down = false;}

  getInput(down) {

    if (this.down != down) this.active = down;
    this.down = down;

  }

};
