'use strict';

const image = new Image();
image.src = 'Images/image.png';
image.onload = () => {
	const background = new Image();
	background.src = 'Images/background.png';
	background.onload = () => {
		const r = new Render(image, background);
		let t = [];
		t.push(r.createObject([1, 1], [2, 2], [0, 0], [1, 1], 5));
		t.push(r.createObject([2.5, 2.5], [4, 4], [0, 0], [0.5, 1], 5));
		t.push(r.createObject([6.5, 2.5], [8, 4], [0.5, 0], [1, 1], 5));
		r.render(16, 0, 17, t);
	};
};
