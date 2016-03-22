---
layout: post
title: Lissage exponentiel double en Javascript
categories: [Prédiction, Javascript]
tags: [Série temporelle, Lissage exponentiel, Javascript, HighchartJs]
description: Dans la série lissage exponentiel, nous continuons sur le lissage exponentiel double afin de prédire des séries temporelles avec tendance. 
comments: true
---
Contrairement au lissage exponentiel simple qui ne s'applique qu'aux séries temporelles sans tendance, le lissage exponentiel double (LED) permet d'établir une prévision lorsque la série présente une tendance.

Cet article a pour objectif de présenter une implémentation possible du lissage exponentiel double en Javascript. Il fait suite au <a href="{% post_url 2016-03-20-lissage-exponentiel-simple %}">post sur le lissage exponentiel simple</a>, et portera les mêmes points : 
<ul>
	<li>Implémentation du LED en Javascript;</li>
	<li>Calcul de la valeur optimale d'alpha;</li>
	<li>Utilisation de la librairie HighchartJs pour générer un graphique.</li>
</ul>

<h2>Nos données</h2>
Nous utiliserons les données suivantes :

<style type="text/css">
	table{
		border : 1px;
	}

	th{
		border: 1px solid black;
		padding : 7px;
	}

	td{
		padding : 7px;
		width: 110px;
		border: 1px solid black;
	}
</style>

<div class="container">
	<div class="col-md-5">
		<p>
			<table>
				<tr>
					<th>Mois</th>
					<th>CA(k€)</th>
				</tr>
				<tr>
					<td>Janvier</td>
					<td>112</td>
				</tr>
				<tr>
					<td>Février</td>
					<td>108</td>
				</tr>
				<tr>
					<td>Mars</td>
					<td>117</td>
				</tr>
				<tr>
					<td>Avril</td>
					<td>122</td>
				</tr>
				<tr>
					<td>Mai</td>
					<td>119</td>
				</tr>
				<tr>
					<td>Juin</td>
					<td>127</td>
				</tr>
				<tr>
					<td>Juillet</td>
					<td>132</td>
				</tr>
				<tr>
					<td>Août</td>
					<td>131</td>
				</tr>
				<tr>
					<td>Septembre</td>
					<td>139</td>
				</tr>
				<tr>
					<td>Octobre</td>
					<td>145</td>
				</tr>
				<tr>
					<td>Novembre</td>
					<td>148</td>
				</tr>
				<tr>
					<td>Décembre</td>
					<td>150</td>
				</tr>
				<tr>
					<td>Janvier</td>
					<td>?</td>
				</tr>

				<tr>
					<td>Février</td>
					<td>?</td>
				</tr>
			</table>
		</p>
	</div>
	<div class="col-md-1"></div>

	<div class="col-md-6">
		<p>
		L'objectif du lissage exponentiel double sera de déterminer la valeur du chiffre d'affaires pour le dernier mois de Janvier. La valeur de cette prédiction dépend du paramètre alpha. Nous expliquerons donc également comment sélectionner la valeur optimale d'alpha.
		</p>
	</div>
</div>

<h2>Lissage exponentiel double</h2>
Comme son nom l'indique, nous allons effectuer deux lissages : le premier sur les données d'origines, le second portant sur les données issues du premier lissage.

Une fois les deux lissages effectués, nous calculons les valeurs de deux coefficients (a et b). La valeur de a correspond au coefficient directeur et est égale à (alpha/(1-alpha))*(premier_lissage - second_lissage).

B correspond à une sorte d'ordonnée à l'origine locale et est égale à 2*premier_lissage - second_lissage.

Concernant l'initialisation, plusieurs solutions sont possibles (moyenne, valeur initiale etc.). Pour plus d'informations, n'hésitez pas à consulter l'excellent site <a href="http://www.jybaudot.fr/Previsions/led.html">www.jybaudot.fr</a>

{% highlight javascript %}
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
{% endhighlight %}

<h2>Trouver la valeur optimale d'alpha</h2>
Pour trouver la meilleure valeur du paramètre alpha, nous cherchons à minimiser l'erreur quadratique. Celle-ci est égale à 1/(n-1)*(valeur[1]-prediction[1] + valeur[2]-prediction[2] + ... + valeur[n]-prediction[n]).

En Javascript cela donne : 
{% highlight javascript %}
function computeMeanSquaredError(data, forecast)
{
	var error = 0.0;
	for(var i = 1; i < data.length; ++i)
	{
		error += Math.pow(data[i] - forecast[i], 2);
	}
	return 1/(data.length-1)*error;
}
{% endhighlight %}

Pour trouver la meilleure valeur de alpha, on itère entre 0 et 1 avec un pas passé en paramètre à notre fonction. L'objectif est de garder la valeur d'alpha permettant de minimiser l'erreur quadratique.

{% highlight javascript %}
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
{% endhighlight %}

Une fois la valeur optimale de alpha trouvée, il suffit de générer les prédictions : 
{% highlight javascript %}
var bestAlpha = findBestAlpha(data, 20);
var forecast = led(data, bestAlpha, 2); //Prévision à t+2
{% endhighlight %}

<h2>Représentation graphique avec HighchartJs</h2>
Nous allons utiliser la librairie HighchartJs afin de tracer nos deux séries (celle réalisée et celle prédite). Pour cela il suffit d'inclure Jquery, ainsi que le fichier Highcharts.js. Ensuite, nous insérons le code suivant, en modifiant les différents champs en fonction de nos besoins :
{% highlight javascript %}
<script type="text/javascript">
    $(function () {
        $('#container').highcharts({
            title: {
                text: 'Chiffre d\'affaires mensuel',
                x: -20 //center
            },
            subtitle: {
                text: 'Source: fakeSource.com',
                x: -20
            },
            xAxis: {
                categories: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin',
                    'Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
            },
            yAxis: {
                title: {
                    text: 'CA (k€)'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: 'k€'
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            series: [{
                name: 'Réalisé',
                data: data
            }, {
                name: 'Prévisions',
                data: forecast
            }]
        });
    });
</script>

<div id="container" style="min-width: 310px; height: 400px; margin: 0 auto"></div>
{% endhighlight %}

<br/>
Nous obtenons le résultat ci-dessous : 
<br/>

<script src='/assets/js/led.js' type="text/javascript"></script>


<script type="text/javascript">
    $(function () {
        $('#container').highcharts({
            title: {
                text: 'Chiffre d\'affaires mensuel',
                x: -20 //center
            },
            subtitle: {
                text: 'Source: fakeSource.com',
                x: -20
            },
            xAxis: {
                categories: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin',
                    'Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
            },
            yAxis: {
                title: {
                    text: 'CA (k€)'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: 'k€'
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            series: [{
                name: 'Réalisé',
                data: data
            }, {
                name: 'Prévisions',
                data: forecast
            }]
        });
    });
</script>

<script src='/assets/js/Highcharts/js/highcharts.js' type="text/javascript"></script>
<script src='/assets/js/Highcharts/js/modules/exporting.js' type="text/javascript"></script>

<div id="container" style="min-width: 310px; height: 400px; margin: 0 auto"></div>