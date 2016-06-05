---
layout: post
title: Transformée de Fourier appliquée à la prédiction de séries temporelles
categories: [Algorithme, Séries temporelles]
tags: [Algorithme , Javascript, transformée de Fourier]
description: Application de la transformée de Fourier pour prédire des séries temporelles.
comments: true
---

Dans cet article nous présenterons un algorithme utilisant la transformée de Fourier afin d'extrapoler un signal/fonction. L'objectif est d'approximer notre fonction par une somme de fonctions sinus et cosinus.

La seule librairie que nous utiliserons est <a href="https://github.com/jensnockert/fft.js">ffts.js</a>. Elle fournit une implémentation de la transformation de Fourier rapide (Fast Fourier Transform) en Javascript.

<h1>Implémentation de l'algorithme</h1>

La première étape de l'algorithme consiste à retirer la tendance de nos données. Nous considérerons une tendance linéaire que nous estimons en effectuant une régression linéaire.

{% highlight javascript %}
function retirerTendanceLineaire(data)
{
	var x = Array();
	//On considere que les donnees sont separees d'un pas de 1 dans le temps
	//(Axe x)
	for(var i = 0; i < data.length; ++i)
	{
		x[i] = i;
	}

	//On effectue une regression lineaire
	var sum_x = 0, sum_y = 0,
	sum_xx = 0, sum_xy = 0;
	 
	for (var i = 0; i < data.length; i++) {
		sum_x += x[i];
		sum_y += data[i];
		 
		sum_xx += Math.pow(x[i], 2);
		sum_xy += x[i]*data[i];
	}
 	
 	//On calcule le coefficient directeur de la droite
	var slope = (data.length * sum_xy - sum_x * sum_y) / (data.length * sum_xx - sum_x * sum_x);

	//On soustrait la tendance (coef directeur ) aux donnees
	var donnees_sans_tendance = Array();

	for(var i = 0; i < data.length; ++i)
	{
		donnees_sans_tendance[i] = data[i] - slope*i;
	}
	
	//On retourne un objet contenant les donnees sans la tendance
	//Ainsi que le coefficient de la tendance dont nous aurons besoin a la fin
	return {"donnees": donnees_sans_tendance, "coef": slope};
}

//Nous utilisons le jeu de donnees ci-dessous : 
var donnees = [669, 592, 664, 1005, 699, 401, 646, 472, 598, 681, 1126, 1260, 562, 491, 714, 530, 521, 687, 776, 802, 499, 536, 871, 801, 965, 768, 381, 497, 458, 699, 549, 427, 358, 219, 635, 756, 775, 969, 598, 630, 649, 722, 835, 812, 724, 966, 778, 584, 697, 737, 777, 1059, 1218, 848, 713, 884, 879, 1056, 1273, 1848, 780, 1206, 1404, 1444, 1412, 1493, 1576, 1178, 836, 1087, 1101, 1082, 775, 698, 620, 651, 731, 906, 958, 1039, 1105, 620, 576, 707, 888, 1052, 1072, 1357, 768, 986, 816, 889, 973, 983, 1351, 1266, 1053, 1879, 2085, 2419, 1880, 2045, 2212, 1491, 1378, 1524, 1231, 1577, 2459, 1848, 1506, 1589, 1386, 1111, 1180, 1075, 1595, 1309, 2092, 1846, 2321, 2036, 3587, 1637, 1416, 1432, 1110, 1135, 1233, 1439, 894, 628, 967, 1176, 1069, 1193, 1771, 1199, 888, 1155, 1254, 1403, 1502, 1692, 1187, 1110, 1382, 1808, 2039, 1810, 1819, 1408, 803, 1568, 1227, 1270, 1268, 1535, 873, 1006, 1328, 1733, 1352, 1906, 2029, 1734, 1314, 1810, 1540, 1958, 1420, 1530, 1126, 721, 771, 874, 997, 1186, 1415, 973, 1146, 1147, 1079, 3854, 3407, 2257, 1200, 734, 1051, 1030, 1370, 2422, 1531, 1062, 530, 1030, 1061, 1249, 2080, 2251, 1190, 756, 1161, 1053, 1063, 932, 1604, 1130, 744, 930, 948, 1107, 1161, 1194, 1366, 1155, 785, 602, 903, 1142, 1410, 1256, 742, 985, 1037, 1067, 1196, 1412, 1127, 779, 911, 989, 946, 888, 1349, 1124, 761, 994, 1068, 971, 1157, 1558, 1223, 782, 2790, 1835, 1444, 1098, 1399, 1255, 950, 1110, 1345, 1224, 1092, 1446, 1210, 1122, 1259, 1181, 1035, 1325, 1481, 1278, 769, 911, 876, 877, 950, 1383, 980, 705, 888, 877, 638, 1065, 1142, 1090, 1316, 1270, 1048, 1256, 1009, 1175, 1176, 870, 856, 860];

noTendanceObj = retirerTendanceLineaire(donnees);
donnees_sans_tendance = noTendanceObj.donnees;
coef_tendance = noTendanceObj.coef;
{% endhighlight %}

Ensuite nous calculons la transformation de Fourier discrète à l'aide de la librairie fft.js.

{% highlight javascript %}
function fft(data) {
	var o1 = new Array(2*data.length);
	var fft = new FFT.complex(data.length, false);
	
	
	fft.simple(o1, data, 'real')
	//Le tableau o1 contient le resultat de la fft
	//Les elements d'indices pairs sont les parties reelles
	//Les elements d'indices impairs les parties imaginaires
	//Nous constituons un tableau d'objets contenant directement
	//des attributes "reel" et "imaginaire" pour faciliter
	//les calculs par la suite
	var cpt = 0;
	var tabComplexe = Array();
	for(var i = 0; i < o1.length; i += 2)
	{
		tabComplexe[cpt] = {"reel": o1[i], "imaginaire": o1[i+1]};
		cpt++;
	}

	return tabComplexe;
}

domaine_freq = fft(donnees_sans_tendance);
{% endhighlight %}

Nous calculons la fréquence d'échantillonage et trions les indices des fréquences selon leur valeur absolue. 

{% highlight javascript %}
function fftfreq(n)
{
	var val = 1.0/n
	var results = Array();
	var N = Math.floor((n-1)/2)+1;
	var p1 = Array();
	for(var i = 0; i < N; i++)
	{
		results[i] = i*val;
	}

	for(var i = N; i < n; i++)
	{
		results[i] = (-Math.floor(n/2) -(N - i))*val;
	}

	return results;
}

function trier_indice_frequences(freqs)
{
	var tmpTab = Array();
	for(var i = 0; i < freqs.length; i++)
	{
		tmpTab[i] = {"freq": freqs[i], "indice": i};
	}

	function ordre(elt1, elt2)
	{
		return Math.abs(elt1.freq) - Math.abs(elt2.freq);
	}

	tmpTab.sort(ordre);

	var result = Array();
	for(var i = 0; i < tmpTab.length; i++)
	{
		result[i] = tmpTab[i].indice;
	}

	return result;
}

f = fftfreq(donnees.length);
//on trie les indices des fréquences selon la valeur absolue des éléments de f
indices_tries = trier_indice_frequences(f);
{% endhighlight %}

Une fois ce travail préliminaire effectué, nous pouvons passer à la phase de prédiction à proprement parler. Pour cela nous devons introduire deux nouvelles variables : 
- horizon, qui correspond à l'horizon de la prédiction;
- nb_harmonique, qui correspond grossièrement au nombre de fonctions sinus/cosinus que nous allons utiliser pour extrapoler notre série. Attention à ne pas choisir une valeur trop élevée, ce qui reviendrait à faire de l'overfitting.



{% highlight javascript %}
function predire(horizon, nb_harmonique, domaine_freq, f, indices_tries, coef_tendance)
{
	signal_restaure = Array();
	for(var i = 0; i < domaine_freq.length + horizon; ++i)
	{
		signal_restaure[i] = 0;
	}

	for(var i = 0; i < (1+ nb_harmonique*2); i++)
	{
		var indice = indices_tries[i];
		var amplitude = Math.sqrt(Math.pow(domaine_freq[indice].reel, 2) + Math.pow(domaine_freq[indice].imaginaire, 2))/domaine_freq.length;
		var phase = Math.atan2(domaine_freq[indice].imaginaire, domaine_freq[indice].reel);

		var facteur = 2*Math.PI*f[indice];

		for(var j = 0; j < domaine_freq.length + horizon; j++)
		{
			signal_restaure[j] += amplitude*Math.cos(facteur*j+phase);
		}
	}

	//On reajoute la tendance aux donnees predites
	for( var i = 0; i < signal_restaure.length; ++i)
	{
		signal_restaure[i] += i*coef_tendance;
	}

	return signal_restaure;
}

var horizon = 30;
var nb_harmonique = 25;
prediction = predire(horizon, nb_harmonique, domaine_freq, f, indices_tries, coef_tendance);
{% endhighlight %}

<h2>Représentation graphique</h2>
En appliquant notre algorithme aux données précédentes nous obtenons le résultat suivant : 

<script src='/assets/js/complex.js' type="text/javascript"></script>

<script type="text/javascript">
	function retirerTendanceLineaire(data)
	{
		var x = Array();
		for(var i = 0; i < data.length; ++i)
		{
			x[i] = i;
		}

		//On effectue une regression lineaire
		var sum_x = 0, sum_y = 0,
		sum_xx = 0, sum_xy = 0;
		 
		for (var i = 0; i < data.length; i++) {
			sum_x += x[i];
			sum_y += data[i];
			 
			sum_xx += Math.pow(x[i], 2);
			sum_xy += x[i]*data[i];
		}
	 
		var slope = (data.length * sum_xy - sum_x * sum_y) / (data.length * sum_xx - sum_x * sum_x);

		//On soustrait la tendance aux donnees
		var donnees_sans_tendance = Array();

		for(var i = 0; i < data.length; ++i)
		{
			donnees_sans_tendance[i] = data[i] - slope*i;
		}

		return {"donnees": donnees_sans_tendance, "coef": slope};
	}

	function fft(data) {
		var o1 = new Array(2*data.length);
		var fft = new FFT.complex(data.length, false);
		
		
		fft.simple(o1, data, 'real')
		
		var cpt = 0;
		var tabComplexe = Array();
		for(var i = 0; i < o1.length; i += 2)
		{
			tabComplexe[cpt] = {"reel": o1[i], "imaginaire": o1[i+1]};
			cpt++;
		}

		return tabComplexe;
	}

	function fftfreq(n)
	{
		var val = 1.0/n
		var results = Array();
		var N = Math.floor((n-1)/2)+1;
		var p1 = Array();
		for(var i = 0; i < N; i++)
		{
			results[i] = i*val;
		}

		for(var i = N; i < n; i++)
		{
			results[i] = (-Math.floor(n/2) -(N - i))*val;
		}

		return results;
	}

	function trier_indice_frequences(freqs)
	{
		var tmpTab = Array();
		for(var i = 0; i < freqs.length; i++)
		{
			tmpTab[i] = {"freq": freqs[i], "indice": i};
		}

		function ordre(elt1, elt2)
		{
			return Math.abs(elt1.freq) - Math.abs(elt2.freq);
		}

		tmpTab.sort(ordre);

		var result = Array();
		for(var i = 0; i < tmpTab.length; i++)
		{
			result[i] = tmpTab[i].indice;
		}

		return result;
	}

	function predire(horizon, nb_harmonique, domaine_freq, f, indices_tries, coef_tendance)
	{
		signal_restaure = Array();
		for(var i = 0; i < domaine_freq.length + horizon; ++i)
		{
			signal_restaure[i] = 0;
		}

		for(var i = 0; i < (1+ nb_harmonique*2); i++)
		{
			var indice = indices_tries[i];
			var amplitude = Math.sqrt(Math.pow(domaine_freq[indice].reel, 2) + Math.pow(domaine_freq[indice].imaginaire, 2))/domaine_freq.length;
			var phase = Math.atan2(domaine_freq[indice].imaginaire, domaine_freq[indice].reel);

			var facteur = 2*Math.PI*f[indice];

			for(var j = 0; j < domaine_freq.length + horizon; j++)
			{
				signal_restaure[j] += amplitude*Math.cos(facteur*j+phase);
			}
		}

		//On reajoute la tendance aux donnees predites
		for( var i = 0; i < signal_restaure.length; ++i)
		{
			signal_restaure[i] += i*coef_tendance;
		}

		return signal_restaure;
	}
	
	var donnees = [669, 592, 664, 1005, 699, 401, 646, 472, 598, 681, 1126, 1260, 562, 491, 714, 530, 521, 687, 776, 802, 499, 536, 871, 801, 965, 768, 381, 497, 458, 699, 549, 427, 358, 219, 635, 756, 775, 969, 598, 630, 649, 722, 835, 812, 724, 966, 778, 584, 697, 737, 777, 1059, 1218, 848, 713, 884, 879, 1056, 1273, 1848, 780, 1206, 1404, 1444, 1412, 1493, 1576, 1178, 836, 1087, 1101, 1082, 775, 698, 620, 651, 731, 906, 958, 1039, 1105, 620, 576, 707, 888, 1052, 1072, 1357, 768, 986, 816, 889, 973, 983, 1351, 1266, 1053, 1879, 2085, 2419, 1880, 2045, 2212, 1491, 1378, 1524, 1231, 1577, 2459, 1848, 1506, 1589, 1386, 1111, 1180, 1075, 1595, 1309, 2092, 1846, 2321, 2036, 3587, 1637, 1416, 1432, 1110, 1135, 1233, 1439, 894, 628, 967, 1176, 1069, 1193, 1771, 1199, 888, 1155, 1254, 1403, 1502, 1692, 1187, 1110, 1382, 1808, 2039, 1810, 1819, 1408, 803, 1568, 1227, 1270, 1268, 1535, 873, 1006, 1328, 1733, 1352, 1906, 2029, 1734, 1314, 1810, 1540, 1958, 1420, 1530, 1126, 721, 771, 874, 997, 1186, 1415, 973, 1146, 1147, 1079, 3854, 3407, 2257, 1200, 734, 1051, 1030, 1370, 2422, 1531, 1062, 530, 1030, 1061, 1249, 2080, 2251, 1190, 756, 1161, 1053, 1063, 932, 1604, 1130, 744, 930, 948, 1107, 1161, 1194, 1366, 1155, 785, 602, 903, 1142, 1410, 1256, 742, 985, 1037, 1067, 1196, 1412, 1127, 779, 911, 989, 946, 888, 1349, 1124, 761, 994, 1068, 971, 1157, 1558, 1223, 782, 2790, 1835, 1444, 1098, 1399, 1255, 950, 1110, 1345, 1224, 1092, 1446, 1210, 1122, 1259, 1181, 1035, 1325, 1481, 1278, 769, 911, 876, 877, 950, 1383, 980, 705, 888, 877, 638, 1065, 1142, 1090, 1316, 1270, 1048, 1256, 1009, 1175, 1176, 870, 856, 860];

	noTendanceObj = retirerTendanceLineaire(donnees);
	donnees_sans_tendance = noTendanceObj.donnees;
	coef_tendance = noTendanceObj.coef;
	domaine_freq = fft(donnees_sans_tendance);
	f = fftfreq(donnees.length);
	indices_tries = trier_indice_frequences(f);
	var horizon = 70;
	var nb_harmonique = 40;
	prediction = predire(horizon, nb_harmonique, domaine_freq, f, indices_tries, coef_tendance);
</script>

<script type="text/javascript">
    $(function () {
        $('#container').highcharts({
            title: {
                text: 'Chiffre d\'affaires journalier',
                x: -20 //center
            },
            subtitle: {
                text: 'Source: fakeSource.com',
                x: -20
            },
            xAxis: {
                categories: []
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
                data: donnees
            }, {
                name: 'Prévisions',
                data: prediction
            }]
        });
    });
</script>

<script src='/assets/js/Highcharts/js/highcharts.js' type="text/javascript"></script>
<script src='/assets/js/Highcharts/js/modules/exporting.js' type="text/javascript"></script>

<div id="container" style="min-width: 310px; height: 400px; margin: 0 auto"></div>


