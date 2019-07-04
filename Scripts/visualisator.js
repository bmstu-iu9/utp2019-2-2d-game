visualisator = (matrix) =>{
	let str = "";
	for(let i = 0; i < matrix.length; i++){
		for (let j = 0; j < matrix[i].length; j++){
			if (matrix[i][j]){
				str += "#";
			}else {
				str += " ";
			}
		}
		console.log(str);
		str = "";
	}
}

