Object.values = function(obj) {
	var k, vals = [];
	for (k in obj)
		vals.push(obj[k]);
	return vals;
};