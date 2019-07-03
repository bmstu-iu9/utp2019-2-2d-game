class Controller {

  constructor() {
    this.down  = new ButtonInput();
    this.left  = new ButtonInput();
    this.right = new ButtonInput();
    this.up    = new ButtonInput();

    this.handleKeyDownUp = (event) => { this.keyDownUp(event); };
  }

  keyDownUp(event) {

    const down = event.type == "keydown";

    switch(event.keyCode) {

      case 37: this.left.getInput(down);  break;
      case 38: this.up.getInput(down);    break;
      case 39: this.right.getInput(down); break;
      case 40: this.down.getInput(down);

    }

    alert("Сюда лут! " + event.keyCode + " голды.");

  }

};

class ButtonInput {

  constructor() {this.active = this.down = false;}

  getInput(down) {

    if (this.down != down) this.active = down;
    this.down = down;

  }

};
