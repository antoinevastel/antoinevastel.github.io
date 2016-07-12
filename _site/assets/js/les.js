var alpha = 0.4;
var data = [25, 29, 24, 21, 26, 23, 27, 25, 21, 24, 26, 29, 25];

function les(data, alpha)
{
	var forecast = Array();
	//on initialise la premiere valeur du lissage avec la moyenne des deux premiers
	//éléments de la série
	forecast[0] = null;
	forecast[1] = 0.5*(data[0] + data[1]);
	for(var i = 2; i <= data.length; ++i)
	{
		forecast[i] = alpha*(data[i-1] - forecast[i-1]) + forecast[i-1];
	}
	return forecast;
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
		var forecast = les(data, alpha);
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
var forecast = les(data, bestAlpha);