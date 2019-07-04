class Game {

  constructor () {
    this.World = class {

      constructor () {

        this.friction = 0.9;
        this.gravity = 3;

        this.backgroundColor = "#000000"

        this.cols     = 16;
        this.rows     = 12;
        this.tileSize = 16;

        this.h=this.tileSize*this.rows;
        this.w=this.tileSize*this.cols;

        this.map =
        [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
         [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
         [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
         [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
         [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]

        this.collisionMap =
        [[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0,11, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0,10, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 9, 0, 3, 0, 0, 0, 0, 0, 0, 0],
         [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]

         this.Collider = class {
           static collide(type, obj, tileX, tileY, tileSize) {

             switch(type) {

               case  1: this.collidePlatformTop      (obj, tileY            ); break;
               case  2: this.collidePlatformRight    (obj, tileX + tileSize); break;
               case  3: if (this.collidePlatformTop  (obj, tileY            )) return;
                        this.collidePlatformRight    (obj, tileX + tileSize); break;
               case  4: this.collidePlatformBottom   (obj, tileY + tileSize); break;
               case  5: if (this.collidePlatformTop  (obj, tileY            )) return;
                        this.collidePlatformBottom   (obj, tileY + tileSize); break;
               case  6: if (this.collidePlatformRight(obj, tileX + tileSize)) return;
                        this.collidePlatformBottom   (obj, tileY + tileSize); break;
               case  7: if (this.collidePlatformTop  (obj, tileY            )) return;
                        if (this.collidePlatformRight(obj, tileX + tileSize)) return;
                        this.collidePlatformBottom   (obj, tileY + tileSize); break;
               case  8: this.collidePlatformLeft     (obj, tileX            ); break;
               case  9: if (this.collidePlatformTop  (obj, tileY            )) return;
                        this.collidePlatformLeft     (obj, tileX            ); break;
               case 10: if (this.collidePlatformLeft (obj, tileX            )) return;
                        this.collidePlatformRight    (obj, tileX + tileSize); break;
               case 11: if (this.collidePlatformTop  (obj, tileY            )) return;
                        if (this.collidePlatformLeft (obj, tileX            )) return;
                        this.collidePlatformRight    (obj, tileX + tileSize); break;
               case 12: if (this.collidePlatformLeft (obj, tileX            )) return;
                        this.collidePlatformBottom   (obj, tileY + tileSize); break;
               case 13: if (this.collidePlatformTop  (obj, tileY            )) return;
                        if (this.collidePlatformLeft (obj, tileX            )) return;
                        this.collidePlatformBottom   (obj, tileY + tileSize); break;
               case 14: if (this.collidePlatformLeft (obj, tileX            )) return;
                        if (this.collidePlatformRight(obj, tileX            )) return;
                        this.collidePlatformBottom   (obj, tileY + tileSize); break;
               case 15: if (this.collidePlatformTop  (obj, tileY            )) return;
                        if (this.collidePlatformLeft (obj, tileX            )) return;
                        if (this.collidePlatformRight(obj, tileX + tileSize)) return;
                        this.collidePlatformBottom   (obj, tileY + tileSize); break;
           }
         }

         static collidePlatformTop(obj, tileTop) {
           if (obj.getBottom() > tileTop && obj.getOldBottom() <= tileTop) {
             obj.setBottom(tileTop - 0.01);
             obj.vy = 0;
             obj.jumping = false;
             return true;
           } return false;
         }

         static collidePlatformBottom(obj, tileBottom) {
           if (obj.getTop() < tileBottom && obj.getOldTop() >= tileBottom) {
             obj.setTop(tileBottom);
             obj.vy = 0;
             return true;
           } return false;
         }

         static collidePlatformLeft(obj, tileLeft){
           if (obj.getRight() > tileLeft && obj.getOldRight() <= tileLeft) {
             obj.setRight(tileLeft - 0.01);
             obj.vx = 0;
             return true;
           } return false;
         }

         static collidePlatformRight(obj, tileRight) {
           if (obj.getLeft() < tileRight && obj.getOldLeft() >= tileRight) {
             obj.setLeft(tileRight);
             obj.vx = 0;
             return true;
           } return false;
         }
      }
    }

      collide (obj) {
        if (obj.x<0) {obj.x=0; obj.vx = 0;}
        else if (obj.x + obj.w > this.w) {obj.x = this.w - obj.w; obj.vx = 0;}
        if (obj.y<0) {obj.y=0; obj.vy = 0;}
        else if (obj.y + obj.h > this.h) {obj.y = this.h - obj.h; obj.jumping=false; obj.vy = 0;}

        let top, bottom, left, right, type;

        top    = Math.floor(obj.getTop()    / this.tileSize);
        left   = Math.floor(obj.getLeft()   / this.tileSize);
        type  = this.collisionMap[top][left];
        this.Collider.collide(type, obj, left * this.tileSize, top * this.tileSize, this.tileSize);

        top    = Math.floor(obj.getTop()    / this.tileSize);
        right  = Math.floor(obj.getRight()  / this.tileSize);
        type  = this.collisionMap[top][right];
        this.Collider.collide(type, obj, right * this.tileSize, top * this.tileSize, this.tileSize);

        bottom = Math.floor(obj.getBottom() / this.tileSize);
        left   = Math.floor(obj.getLeft()   / this.tileSize);
        type  = this.collisionMap[bottom][left];
        this.Collider.collide(type, obj, left * this.tileSize, bottom * this.tileSize, this.tileSize);

        bottom = Math.floor(obj.getBottom() / this.tileSize);
        right  = Math.floor(obj.getRight()  / this.tileSize);
        type  = this.collisionMap[bottom][right];
        this.Collider.collide(type, obj, right * this.tileSize, bottom * this.tileSize, this.tileSize);
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
        this.oldX       = 100;
        this.oldY       = 50;
        this.vx         = 0;
        this.vy         = 0;
      }

      getBottom()     { return this.y     + this.h; }
      getLeft()       { return this.x;              }
      getRight()      { return this.x     + this.w; }
      getTop()        { return this.y;              }
      getOldBottom()  { return this.oldY  + this.h; }
      getOldLeft()    { return this.oldX;           }
      getOldRight()   { return this.oldX  + this.w; }
      getOldTop()     { return this.oldY            }
      setBottom(y)    { this.y    = y     - this.h; }
      setLeft(x)      { this.x    = x;              }
      setRight(x)     { this.x    = x     - this.w; }
      setTop(y)       { this.y    = y;              }
      setOldBottom(y) { this.oldY = y     - this.h; }
      setOldLeft(x)   { this.oldX = x;              }
      setOldRight(x)  { this.oldX = x     - this.w; }
      setOldTop(y)    { this.oldY = y;              }

      jump() {
        if (!this.jumping) {
          this.vy = -20;
          this.jumping = true;
        }
      }

      update() {
        this.oldX = this.x;
        this.oldY = this.y;
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
