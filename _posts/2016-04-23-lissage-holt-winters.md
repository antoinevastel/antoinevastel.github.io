---
layout: post
title: Lissage de Holt Winters (additif et multiplicatif) en Javascript
categories: [Prédiction, Javascript]
tags: [Série temporelle, Lissage de Holt Winters, Javascript, HighchartJs]
description: Après nous êtres penchés sur les lissages exponentiels simples et doubles, nous passons désormais au lissage de Holt-Winters.
comments: true
---
Contrairement aux lissages exponentiels simple et double, le lissage de Holt Winters permet de prendre en compte à la fois la tendance, mais également la notion de cycles/saisonnalité.

Pour prendre en compte l'ensemble de ces facteurs, nous allons devoir désormais utiliser 3 paramètres : alpha, gamma et delta.

Cet article a pour objectif de présenter une implémentation possible du lissage de Holt Winters en Javascript. Il fait suite au <a href="{% post_url 2016-03-22-lissage-exponentiel-double %}">post sur le lissage exponentiel double</a>, et portera les mêmes points : 
<ul>
	<li>Implémentation du lissage du Holt-Winters en Javascript;</li>
	<li>Calcul de la valeur optimale d'alpha, gamma et delta;</li>
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

	var data = [61.5, 63.2, 55.8, 71.4, 70, 71.4, 63.9, 78.9, 78.3, 78.6, 71.9, 87, 86.2, 87.5, 80.1, 92.5];
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
					<td>61.5</td>
				</tr>
				<tr>
					<td>Février</td>
					<td>63.2</td>
				</tr>
				<tr>
					<td>Mars</td>
					<td>55.8</td>
				</tr>
				<tr>
					<td>Avril</td>
					<td>71.4</td>
				</tr>
				<tr>
					<td>Mai</td>
					<td>70</td>
				</tr>
				<tr>
					<td>Juin</td>
					<td>71.4</td>
				</tr>
				<tr>
					<td>Juillet</td>
					<td>63.9</td>
				</tr>
				<tr>
					<td>Août</td>
					<td>78.9</td>
				</tr>
				<tr>
					<td>Septembre</td>
					<td>78.3</td>
				</tr>
				<tr>
					<td>Octobre</td>
					<td>78.6</td>
				</tr>
				<tr>
					<td>Novembre</td>
					<td>71.9</td>
				</tr>
				<tr>
					<td>Décembre</td>
					<td>87</td>
				</tr>
				<tr>
					<td>Janvier</td>
					<td>86.2</td>
				</tr>

				<tr>
					<td>Février</td>
					<td>87.5</td>
				</tr>

				<tr>
					<td>Mars</td>
					<td>80.1</td>
				</tr>

				<tr>
					<td>Avril</td>
					<td>92.5</td>
				</tr>

				<tr>
					<td>Mai</td>
					<td>?</td>
				</tr>

				<tr>
					<td>Juin</td>
					<td>?</td>
				</tr>

				<tr>
					<td>Juillet</td>
					<td>?</td>
				</tr>

				<tr>
					<td>Août</td>
					<td>?</td>
				</tr>
			</table>
		</p>
	</div>
	<div class="col-md-1"></div>

	<div class="col-md-6">
		<p>
			Ici, nous sommes en présence de cycles durant 4 mois et dont la magnitude ne croît pas au cours du temps. Nous utiliserons donc le lissage de Holt-Winters additif (par opposition au multiplicatif). Notre objectif sera de déterminer les valeurs du CA pour le prochain cycle.
		</p>
	</div>
</div>

<h2>Lissage de Holt Winters</h2>
Le code est extrait et adapté de la <a href="https://github.com/antoinevastel/zodiac-ts">librairie zodiac-ts</a> que j'ai mise en ligne sur Github.

{% highlight javascript %}
//Création de la classe HoltWintersSmoothing
//On doit lui passer en paramètre les données, les 3 paramètres alpha, gamma et delta nous avons parlé précédemment, la longueur de la saison, ainsi qu'un booléen indiquant si on souhaite appliquer le lissage multiplicatif ou addifif

HoltWintersSmoothing = function(data, alpha, gamma, delta, seasonLength, mult)
{
	this.data = data;
	this.alpha = alpha;
	this.gamma = gamma;
	this.delta = delta;
	this.seasonLength = seasonLength;
	this.mult = mult;
	this.forecast = null;
};

//Nous définissons la méthode prédict qui aura pour but d'appeller la méthode de prédiction multicative ou additive selon le paramètre passé dans le constructeur
HoltWintersSmoothing.prototype.predict =function ()
{
	if(this.mult)
	{
		return this.predictMult();
	}
	else
	{
		return this.predictAdd();
	}
}

//Méthode de prédiction pour le cas additif
HoltWintersSmoothing.prototype.predictAdd = function()
{
	A = Array();
	B = Array();
	S = Array();

	A[this.seasonLength-1] = 0;
	var averageFirstSeason = 0;
	for(var i = 0; i < this.seasonLength; ++i)
	{
		averageFirstSeason += this.data[i];
	} 
	B[this.seasonLength-1] = averageFirstSeason/this.seasonLength;

	for(var i = 0; i < this.seasonLength; ++i)
	{
		S[i] = this.data[i] - averageFirstSeason/this.seasonLength;
	}

	for(var i = this.seasonLength; i < this.data.length; ++i)
	{
		B[i] = this.alpha*(this.data[i]- S[i - this.seasonLength])+(1-this.alpha)*(B[i-1]+A[i-1]);
		A[i] = this.gamma*(B[i]-B[i-1])+(1-this.gamma)*A[i-1];
		S[i] = this.delta*(this.data[i]-B[i])+(1-this.delta)*S[i-this.seasonLength];
	}

	var forecast = Array();
	for(var i = 0; i < this.seasonLength; ++i)
	{
		forecast[i]= null;
	}

	for(var i = this.seasonLength; i < this.data.length; ++i)
	{
		forecast[i] = A[i-1] + B[i-1] + S[i - this.seasonLength];
	}

	for(var i = this.data.length; i < this.data.length + this.seasonLength; ++i)
	{
		forecast[i] = B[this.data.length-1] + (i - this.data.length + 1)*A[this.data.length-1] + S[i - this.seasonLength];
	}

	this.forecast = forecast;
	return forecast;
}

//Méthode de prédiction pour le cas multiplicatif
HoltWintersSmoothing.prototype.predictMult = function()
{
	A = Array();
	B = Array();
	S = Array();

	A[this.seasonLength-1] = 0;
	var averageFirstSeason = 0;
	for(var i = 0; i < this.seasonLength; ++i)
	{
		averageFirstSeason += this.data[i];
	} 
	B[this.seasonLength-1] = averageFirstSeason/this.seasonLength;

	for(var i = 0; i < this.seasonLength; ++i)
	{
		S[i] = (this.data[i])/(averageFirstSeason/this.seasonLength);
	}

	for(var i = this.seasonLength; i < this.data.length; ++i)
	{
		B[i] = this.alpha*(this.data[i]/S[i - this.seasonLength])+(1-this.alpha)*(B[i-1]+A[i-1]);
		A[i] = this.gamma*(B[i]-B[i-1])+(1-this.gamma)*A[i-1];
		S[i] = this.delta*(this.data[i]/B[i])+(1-this.delta)*S[i-this.seasonLength];
	}

	var forecast = Array();
	for(var i = 0; i < this.seasonLength; ++i)
	{
		forecast[i]= null;
	}

	for(var i = this.seasonLength; i < this.data.length; ++i)
	{
		forecast[i] = (A[i-1] + B[i-1])*S[i - this.seasonLength];
	}

	for(var i = this.data.length; i < this.data.length + this.seasonLength; ++i)
	{
		forecast[i] = (B[this.data.length-1] + (i - this.data.length + 1)*A[this.data.length-1])*S[i -this.seasonLength];
	}

	this.forecast = forecast;
	return forecast;
}
{% endhighlight %}

<h2>Trouver les valeurs optimales d'alpha, gamma et delta</h2>
Pour trouver les meilleures valeurs des paramètres alpha, gamma et delta nous cherchons de nouveau à minimiser l'erreur quadratique. Celle-ci est égale à 1/(n-1)*(valeur[1]-prediction[1] + valeur[2]-prediction[2] + ... + valeur[n]-prediction[n]).

En Javascript cela donne : 
{% highlight javascript %}
HoltWintersSmoothing.prototype.computeMeanSquaredError = function()
{ 
	var SSE = 0.0;
	var n = 0;
	for(var i = 0; i < this.data.length; ++i)
	{
		if(this.data[i] != null && this.forecast[i] != null)
		{
			SSE += Math.pow(this.data[i] - this.forecast[i], 2);	
			n++;
		} 
		
	}
	return 1/(n-1)*SSE;
};
{% endhighlight %}

Pour trouver les meilleures valeurs, on itère entre 0 et 1 pour chaque paramètre, avec un pas passé en paramètre à notre méthode. L'objectif est de garder les valeurs d'alpha, gamma et delta permettant de minimiser l'erreur quadratique.

{% highlight javascript %}
HoltWintersSmoothing.prototype.optimizeParameters = function(iter)
{
	var incr = 1/iter;
	var bestAlpha = 0.0;
	var bestError = -1;
	this.alpha = bestAlpha;
	var bestGamma = 0.0;
	this.gamma = bestGamma;
	var bestDelta = 0.0;
	this.delta = bestDelta;

	while(this.alpha < 1)
	{
		while(this.gamma < 1)
		{
			while(this.delta < 1)
			{
				var forecast = this.predict();
				var error = this.computeMeanSquaredError();
				if(error < bestError || bestError == -1)
				{
					bestAlpha = this.alpha;
					bestGamma = this.gamma;
					bestDelta = this.delta;
					bestError = error;
				}
				this.delta += incr;
			}
			this.delta = 0;
			this.gamma += incr;
		}
		this.gamma = 0;
		this.alpha += incr;
	}

	this.alpha = bestAlpha;
	this.gamma = bestGamma;
	this.delta = bestDelta;
	return {"alpha":this.alpha, "gamma":this.gamma, "delta":this.delta};
}
{% endhighlight %}

Une fois les paramètres optimaux estimés, il suffit de générer les prédictions associées aux valeurs de ces paramètres : 
{% highlight javascript %}
//On peut se permettre de passer alpha, gamma et delta à null si on souhaite les optimiser par la suite
var hws = new HoltWintersSmoothing(data, alpha, gamma, delta, seasonLength, false);
optimizedParameters = hws.optimizeParameters(20);
var forecast = hws.predict();
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

<script type="text/javascript">
	var data = [61.5, 63.2, 55.8, 71.4, 70, 71.4, 63.9, 78.9, 78.3, 78.6, 71.9, 87, 86.2, 87.5, 80.1, 92.5];
	
	var forecast = [ null,
	  null,
	  null,
	  null,
	  61.5,
	  67.62,
	  63.20560000000001,
	  80.64028800000003,
	  73.94226624000001,
	  77.84038123519998,
	  71.78072448409598,
	  88.6745170953421,
	  84.2596635386487,
	  86.2487507534348,
	  80.39000451578548,
	  96.72919502259661,
	  92.21761270235353,
	  92.83168513314526,
	  85.4677591235588,
	  100.2336908819292 ];

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
                    'Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout']
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