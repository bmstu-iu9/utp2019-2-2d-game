'use strict';

// TEST
const canvas = document.getElementById("test");
const context = canvas.getContext("2d");
let mouse;

canvas.addEventListener("mousemove", (e) => {
	if (mouse !== undefined) {
		context.lineTo(mouse.x, mouse.y);
		context.stroke();
	}
});
// TEST

class Controller {

    constructor() {
        this.mouse  = new MouseInput();
        this.down   = new ButtonInput();
        this.left   = new ButtonInput();
        this.right  = new ButtonInput();
        this.up     = new ButtonInput();
        this.shift  = new ButtonInput();
        this.f      = new ButtonInput();
        this.g      = new ButtonInput();
        this.inv    = new ButtonInput();
        this.craft  = new ButtonInput();
        this.interact      = new ButtonInput();

        this.numbers = [];
        for (let i = 0; i < 10; i++) {
            this.numbers[i] = new ButtonInput();
        }

        this.invClick = false;
        this.craftClick = false;
        this.downClick = false;
    }

    keyDownUp(event) {
        const down = event.type == "keydown";
        if (event.keyCode >= 49 && event.keyCode <= 58) {
            if (event.keyCode == 58) {
                this.numbers[0].getInput(down);
            } else {
                this.numbers[event.keyCode - 48].getInput(down);
            }
        } else switch(event.keyCode) {
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
            case 16:
                this.shift.getInput(down);
                break;
            case 70:
                this.f.getInput(down);
                break;
            case 71:
                this.g.getInput(down);
                break;
            case 69:
                this.interact.getInput(down);
                break;
            case 73: 
                this.inv.getInput(down);
                break;
            case 79: 
                this.craft.getInput(down);
                break;
        }
    }
    
    mouseMove(event) {
        const playerPlixelLocateX = (player.x - cameraX) * blockSize * cameraScale,
            playerPlixelLocateY = (player.y - cameraY) * blockSize * cameraScale;
		const canvasSize = render.getCanvasSize();
		this.mouse.x = event.pageX * window.devicePixelRatio;
		this.mouse.y = event.pageY * window.devicePixelRatio;
		this.mouse.direction.x = this.mouse.x - canvasSize[0] / 2 - playerPlixelLocateX;
		this.mouse.direction.y = canvasSize[1] / 2 - playerPlixelLocateY - this.mouse.y
			- Player.HEIGHT * blockSize * cameraScale / 2;
		/* TEST */mouse = this.mouse;
    }

    mouseDown(event) {
        this.mouse.click = event.which;
        this.mouse.active = true;
    }

    mouseUp(event) {
        this.mouse.click = undefined;
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
        this.click = undefined;
        this.x = this.y = 0;
        this.direction = {
            x: 0, y: 0
        }
    }
}
