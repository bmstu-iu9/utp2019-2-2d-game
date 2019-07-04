class Game {

  constructor () {
    this.World = class {

      constructor () {
        this.h=72;
        this.w=128;

        this.friction = 0.9;
        this.gravity = 3;

        this.backgroundColor = "#000000"
      }

      collide (obj) {
        if (obj.x<0) {obj.x=0; obj.vx = 0;}
        else if (obj.x + obj.w > this.w) {obj.x = this.w - obj.w; obj.vx = 0;}
        if (obj.y<0) {obj.y=0; obj.vy = 0;}
        else if (obj.y + obj.h > this.h) {obj.y = this.h - obj.h; obj.jumping=false; obj.vy = 0;}
      }
    }

    this.Player = class {
      constructor (x,y) {
        this.color      = "#ff0000";
        this.h          = 16;
        this.w          = 16;
        this.jumping    = true;
        this.x          = 100;
        this.y          = 50;
        this.vx         = 0;
        this.vy         = 0;
      }

      jump() {
        if (!this.jumping) {
          this.vy = -20;
          this.jumping = true;
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
      }

      move(side) {
        switch(side) {
          case "left":  this.vx -=0.5; break;
          case "right": this.vx +=0.5; break;
        }
      }
    }

    this.world = new this.World;
    this.player = new this.Player;
  }

  update() {
    this.player.vy += this.world.gravity;
    this.player.update();

    this.player.vx *= this.world.friction;

    this.world.collide(this.player);
  }

};
