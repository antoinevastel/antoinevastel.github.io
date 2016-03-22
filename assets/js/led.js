var alpha = 0.4;
var data = [112, 108, 117, 122, 119, 127, 132, 131, 139, 145, 148, 150];

function led(data, alpha, horizon)
{
	var lissage = Object();
	//on initialise la premiere valeur du lissage avec la moyenne des deux premiers
	//éléments de la série
	lissage.premier = Array();
	lissage.second = Array();

	lissage.premier[0] = data[0];
	lissage.premier[1] = data[1];

	for(var i = 2; i < data.length; ++i)
	{
		lissage.premier[i] = alpha*data[i] + (1-alpha)*lissage.premier[i-1];
	}

	lissage.second[0] = lissage.premier[0];
	for(var i = 1; i < data.length; ++i)
	{
		lissage.second[i] = alpha*lissage.premier[i] + (1-alpha)*lissage.second[i-1];
	}

	lissage.a = Array();
	lissage.b = Array();
	for(var i = 1; i < data.length; ++i)
	{
		lissage.a[i] = (alpha/(1-alpha))*(lissage.premier[i] - lissage.second[i]);
		lissage.b[i] = 2*lissage.premier[i] - lissage.second[i];
	}

	var previsions = Array();
	previsions[0] = null;
	previsions[1] = null;
	for(var i = 2; i <= data.length; ++i)
	{
		previsions[i] = lissage.a[i-1] + lissage.b[i-1];
	}

	for(var i = data.length +1; i < data.length + horizon; ++i)
	{
		previsions[i] = previsions[i-1] + lissage.a[data.length-1];
	}

	return previsions;
}

function computeMeanSquaredError(data, forecast)
{
	var error = 0.0;
	for(var i = 1; i < data.length; ++i)
	{
		error += Math.pow(data[i] - forecast[i], 2);
	}
	return 1/(data.length-1)*error;
}

//On cherche la meilleure valeur de alpha en minimisant l'erreur quadratique
function findBestAlpha(data, nbIter)
{
	var incr = 1/nbIter;
	var bestAlpha = 0.0;
	var bestError = -1;
	var alpha = bestAlpha;

	while(alpha < 1)
	{
		var forecast = led(data, alpha);
		var error = computeMeanSquaredError(data, forecast);
		if(error < bestError || bestError == -1)
		{
			bestAlpha = alpha;
			bestError = error;
		}
		alpha += incr;
	}
	return bestAlpha;
}

var bestAlpha = findBestAlpha(data, 20);
forecast = led(data, bestAlpha, 2);