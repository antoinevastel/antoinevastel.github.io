---
layout: post
title: Lissage exponentiel simple en Javascript
categories: [Prédiction, Javascript]
tags: [Série temporelle, Lissage exponentiel, Javascript, HighchartJs]
description: Description blabla
comments: true
---
Le lissage exponentiel simple est une technique de prévision à t+1 s'appliquant à des séries temporelles sans tendance. L'objectif étant de donner plus ou moins d'importance aux dernières observations grâce à un paramètre alpha. Dans le cas d'une série temporelle avec tendance, il est préférable d'utiliser le lissage exponentiel double.

Cet article a pour objectif de présenter une implémentation possible du lissage exponentiel simple en Javascript. Nous aborderons également l'utilisation de l'erreur quadratique pour déterminer la valeur optimale de alpha, ainsi que l'utilisation de la librairie HighchartJs afin de représenter graphiquement nos séries temporelles.

<h2>Nos données</h2>
Nous utiliserons les données issues de <a href="http://www.jybaudot.fr/Previsions/les.html">ce site</a>.

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
					<td>25</td>
				</tr>
				<tr>
					<td>Février</td>
					<td>29</td>
				</tr>
				<tr>
					<td>Mars</td>
					<td>24</td>
				</tr>
				<tr>
					<td>Avril</td>
					<td>21</td>
				</tr>
				<tr>
					<td>Mai</td>
					<td>26</td>
				</tr>
				<tr>
					<td>Juin</td>
					<td>23</td>
				</tr>
				<tr>
					<td>Juillet</td>
					<td>27</td>
				</tr>
				<tr>
					<td>Août</td>
					<td>25</td>
				</tr>
				<tr>
					<td>Septembre</td>
					<td>21</td>
				</tr>
				<tr>
					<td>Octobre</td>
					<td>24</td>
				</tr>
				<tr>
					<td>Novembre</td>
					<td>26</td>
				</tr>
				<tr>
					<td>Décembre</td>
					<td>29</td>
				</tr>
				<tr>
					<td>Janvier</td>
					<td>25</td>
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
		L'objectif du lissage exponentiel simple sera de déterminer la valeur du chiffre d'affaires pour le dernier mois de Février. La valeur de cette prédiction dépend du paramètre alpha. Nous expliquerons donc également comment sélectionner la valeur optimale d'alpha.
		</p>
	</div>
</div>

<h2>Lissage exponentiel simple</h2>
La prédiction en t est égale à l'erreur sur la prédiction précédente (valeur(t-1) - prédiction(t-1)) multipliée par le paramètre alpha, auquel on ajoute la prédiction en t-1.

{% highlight javascript %}
function les(data, alpha)
{
	var forecast = Array();
	forecast[0] = null;
	//on initialise la premiere valeur du lissage avec la moyenne des deux premiers
	forecast[1] = 0.5*(data[0] + data[1]);
	for(var i = 2; i <= data.length; ++i)
	{
		forecast[i] = alpha*(data[i-1] - forecast[i-1]) + forecast[i-1];
		//forecast[i] = alpha * erreur(t-1) + prédiction(t-1)
	}
	return forecast;
}
{% endhighlight %}

<h2>Trouver la valeur optimale pour alpha</h2>
Pour trouver la meilleure valeur du paramètre alpha nous allons chercher à minimiser l'erreur quadratique. Celle-ci est égale à 1/(n-1)*(valeur[1]-prediction[1] + valeur[2]-prediction[2] + ... + valeur[n]-prediction[n]).

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

Pour trouver la meilleure valeur de alpha on itère entre 0 et 1 avec un pas passé en paramètre à notre fonction. L'objectif est de garder la valeur d'alpha permettant de minimiser l'erreur quadratique.

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

Une fois la valeur optimate de alpha trouvée, il suffit de générer les prédictions : 
{% highlight javascript %}
var bestAlpha = findBestAlpha(data, 20);
var forecast = les(data, bestAlpha);
{% endhighlight %}

<h2>Représentation graphique avec HighchartJs</h2>
Nous allons utiliser la librairie HighchartJs afin de tracer nos deux séries (celle réalisée et celle prédite). Pour cela il suffit d'inclure Jquery, ainsi que le fichier Highcharts.js. Ensuite, nous insérons le code suivant, en modifiant les différents champs en fonction de vos besoins :
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
Pour plus de graphiques réalisables avec HighchartJs, n'hésitez pas à vous rendre sur leur <a href="http://www.highcharts.com/demo">site</a> où différents exemples sont présentés.
<br/>
Nous obtenons le résultat ci-dessous : 
<br/>

<script src='/assets/js/les.js' type="text/javascript"></script>


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