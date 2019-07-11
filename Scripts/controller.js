class Controller {

    constructor() {
        this.down   = new ButtonInput();
        this.left   = new ButtonInput();
        this.right  = new ButtonInput();
        this.up     = new ButtonInput();
        this.mouse 	= new MouseInput();
    }

    keyDownUp(event) {
        const down = event.type == "keydown"; 
        switch(event.keyCode) {
            case 65: 
                this.left.getInput(down);
                break;
            case 87:
                this.up.getInput(down);
                break;
            case 68:
                this.right.getInput(down);
                break;
            case 83:
                this.down.getInput(down);
                break;
        }
    }
    
    mouseMove(event) {
        const playerPlixelLocateX = (cameraX - player.x) * scale * cameraScale,
            playerPlixelLocateY = (cameraY - player.y) * scale * cameraScale;
        this.mouse.x = event.pageX;
        this.mouse.y = event.pageY;
        this.mouse.direction.x = this.mouse.x - (document.getElementById('canvas').width / 2 - playerPlixelLocateX);
        this.mouse.direction.y = (document.getElementById('canvas').height / 2 - playerPlixelLocateY) - this.mouse.y -
            Player.HEIGHT * scale * cameraScale / 2;
    }

    mouseDown() {
        this.mouse.active = true;
    }

    mouseUp() {
        this.mouse.active = false;
    }
}

class ButtonInput {

    constructor() {
        this.active = this.down = false;
    }

    getInput(down) {    
        if (this.down != down) this.active = down;
        this.down = down; 
    }
}

class MouseInput {

	constructor() {
		this.active = false;
        this.x = this.y = 0;
        this.direction = {
            x: 0, y: 0
        }
	}
}
