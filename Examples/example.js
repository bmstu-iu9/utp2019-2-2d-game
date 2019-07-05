'use strict';

const image = new Image();
image.src = 'Images/image.png';
image.onload = () => {
	const background = new Image();
	background.src = 'Images/background.png';
	background.onload = () => {
		const r = new Render(image, background);
		
		r.createObjects(
			[{'id':1, 'a':[0,0], 'b':[63/128,1]}, // зелёный блок
			{'id':3, 'a':[65/128,0], 'b':[1,1]}]); // жёлтый блок
		
        let arrayOfChunk = [{
			'chunk':
				[[1,1,1,1],
				[1,1,3,3],
				[1,1,1,1]],
			'slice': -1,
			'x': 0,
			'y': 0
		}];
		let e = -0.8;
		let oldtime = 0;
		const update = (newtime) => {
			newtime *= 0.0001;
			const deltaTime = newtime - oldtime;
			oldtime = newtime;
			r.render(e += deltaTime, 0, 1, arrayOfChunk);
			requestAnimationFrame(update);
		}
		requestAnimationFrame(update);
    };
};