let animationsTickCount = 0;

let animations = {
	player : {
		head : {
			idle : [ 0 ]
		},
		body : {
			idle : [ 0 ],
			kick : [ 1, 0, 0 ]
		},
		legs : {
			idle : [ 0 ],
			run : [ 1, 2, 3, 4, 5, 6, 0 ],
			walk : [ 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 0, 0 ],
			jump : [ 7 ]
		}
	}
}