'use strict';

const image = new Image();
image.src = 'Images/blocks.png';
image.onload = () => {
	const background = new Image();
	background.src = 'Images/background.png';
	background.onload = () => {
		const r = new Render(image, background);
		
		r.settings(32, 4, 3);
		
		r.createObjects(
			[{'id':1, 'a':[32.5/256, 32.5/256], 'b':[63.5/256, 63.5/256]},
			{'id':3, 'a':[0.5/256, 0.5/256], 'b':[31.5/256, 31.5/256]}]);
		
        let arrayOfChunk = [{
			'chunk':
				[[1,1,1,1],
				[1,1,3,3],
				[1,1,1,1]],

			'slice': 1,
			'light': 1,
			'x': 0,
			'y': 0
			}];
		let e = -20;
		let oldtime = 0;
		const update = (newtime) => {
			newtime *= 0.005;
			const deltaTime = newtime - oldtime;
			oldtime = newtime;
			r.render(e += deltaTime, 0, 1, arrayOfChunk);
			fpsUpdate();
			requestAnimationFrame(update);
		}
		requestAnimationFrame(update);
    };
};