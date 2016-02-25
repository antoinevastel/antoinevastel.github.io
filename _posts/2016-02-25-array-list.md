---
layout: post
title: Une implémentation d'Array List en Java
categories: [structure de données, java]
tags: [java, structure de données, array list, tableau dynamique]
description: implémentation d'array list/tableau dynamique en Java
comments: true
---

<h1>Array List/ Tableau dynamique</h1>
Dans cet article nous étudierons une possible implémentation (simpliste) d'une array list. Cette structure de données est également appelée tableau dynamique. Cet article sera rédigé en français car il existe déjà un grand nombre d'articles en anglais traitant de ce sujet.

Un tableau dynamique est une structure de données dont la taille s'adapte automatiquement à la quantité de données qu'il doit stocker. A l'instar d'un tableau classique, on accède directement aux élements grâce à leurs indices.

<h2>Attributs</h2>
Notre classe de tableau dynamique est constituée de deux attributs : 
<ul>
	<li>Donnees : un tableau de type T</li>
	<li>NbElements : un entier représentant le nombre d'élements présents dans notre tableau. Attention, le nombre d'élements ne doit pas être confondu avec la taille de notre tableau Donnees.</li>
</ul>

Lorsque l'on veut ajouter un élément à notre liste mais que le tableau est plein, c'est à dire que nbElements == Donnees.length, alors on agrandit le tableau. La nouvelle taille est égale à l'ancienne taille * 1.5 + 1. La nouvelle taille dépend des choix d'implémentation. Par exemple, en Python la classe PyListObject voit sa taille augmentée d'un facteur de 9/8.

Dans notre cas nous voulons que notre classe puisse stocker n'importe quel type de variables. Pour cela, nous allons utiliser la notion de <a href="http://imss-www.upmf-grenoble.fr/prevert/Prog/Java/CoursJava/genericite.htm">généricité</a>.

{% highlight java %}
public class ArrayList<T>{
	private T[] donnees;
	private int nbElements;
}
{% endhighlight %}

<h2>Les constructeurs</h2>
Notre classe possède deux constructeurs : le premier prend en paramètre la capacite initiale de notre tableau, le second est un constructeur par défaut.

{% highlight java %}
public ArrayList(int capaciteInitiale){
	//On verifie que la capacite initiale transmise est positive ou nulle 
	if(capaciteInitiale < 0){
	//Si ca n'est pas le cas on genere une exception
		throw new IllegalArgumentException("La nbElements initiale doit etre positive : "+ capaciteInitiale);
	}
	
	//On initialise notre tableau de donnees en lui donnant une taille egale a capaciteInitiale
	donnees = (T[]) new Object[capaciteInitiale];
	//On initialise la nombre d'elements a 0
	nbElements = 0;
}


//Notre constructeur par defaut appelle le constructeur precedent avec capaciteInitiale = 5
public ArrayList(){
	this(5);
}

{% endhighlight %}

<h2>Ajouter/Supprimer des élements</h2>
Par la suite nous allons définir plusieurs méthodes dont le rôle est d'ajouter/supprimer des éléments à notre liste.

La méthode ajouterElement ajoute un élement en fin de tableau :
{% highlight java %}
public void ajouterElement(T elt){
	//Si le tableau contenant les donnees est plein, alors on l'agrandit
	if(donnees.length == nbElements){
		int nouveauNbElements = nbElements* 3/2 + 1;
		T[] tempDonnees = donnees;
		donnees = (T[]) new Object[nouveauNbElements];
		System.arraycopy(tempDonnees, 0, donnees, 0, nbElements);
	}
	
	//On ajoute le nouvel element au tableau
	donnees[nbElements] = elt;
	nbElements++;
}
{% endhighlight %}

On définit également la méthode definirElement. Celle-ci prend en paramètre un indice et un élément à insérer. Elle retourne l'ancien élément présent à l'indice passé en paramètre.
{% highlight java %}
public T definirElement(int indice, T elt) throws IndexOutOfBoundsException{
	if(indice < 0 || indice > nbElements){
		throw new IndexOutOfBoundsException();
	}
	
	T ancienElt = obtenirElement(indice);
	donnees[indice] = elt;
	
	return ancienElt;
}
{% endhighlight %}

La méthode enleverElement prend en paramètre un élément, et si cet élément est présent dans la liste, elle retire la première occurence de celui-ci. Elle retourne true si l'élément à été supprimé et false sinon.
{% highlight java %}
public boolean enleverElement(T elt){
	for(int i = 0; i < nbElements; i++){
		if(donnees[i].equals(elt)){
			//On décale vers la gauche tous les éléments situés après l'élément supprimé
			System.arraycopy(donnees, i+1, donnees, i, nbElements - i - 1);
			nbElements--;
			return true;
		}
	}
	
	return false;
}
{% endhighlight %}

<h2>Accéder aux éléments</h2>
Pour accéder aux différents éléments de notre liste nous définissions la méthode obtenirElement qui prend en paramètre un indice et retourne l'élement présent à cet indice.
{% highlight java %}
public T obtenirElement(int indice) throws IndexOutOfBoundsException{
	if(indice < 0 || indice > nbElements){
		throw new IndexOutOfBoundsException();
	}		
	return donnees[indice];
}
{% endhighlight %}

<h2>Autres méthodes</h2>
Nous définissons la méthode contient. Elle retourne true si notre liste contient l'élément passé en paramètre et false sinon.
{% highlight java %}
public boolean contient(T elt){
	boolean contient = false;
	int i = 0;
	
	while(!contient && i < nbElements){
		if(donnees[i].equals(elt)){
			contient = true;
		}
		i++;
	}
	return contient;
}
{% endhighlight %}

Nous définissons également la méthode viderListe qui comme son nom l'indique permet de vider la liste : 
{% highlight java %}
public void viderListe(){
	//Nous assignons la valeur null a l'ensemble des elements de la liste
	for(int i = 0; i < nbElements; i++){
		donnees[i] = null;
	}
	
	//On retablit le nb d'elements de la liste a 0
	nbElements = 0;
}
{% endhighlight %}

Enfin, nous redéfinissons la méthode toString afin de pouvoir afficher notre liste : 
{% highlight java %}
public String toString(){
	String s = "";
	for(int i = 0; i < nbElements - 1; i++){
		s += donnees[i]+", ";
	}
	if(nbElements > 0){
		s += donnees[nbElements-1];
	}
	
	return s;
}
{% endhighlight %}

<h2>Test de notre classe</h2>
Vous trouverez ci-dessous un main permettant de tester les quelques methodes que nous avons définies dans notre classe ArrayList :
{% highlight java %}
public static void main(String[] args) {
	ArrayList<Integer> al = new ArrayList<Integer>();
	
	al.ajouterElement(12);
	al.ajouterElement(5);
	al.ajouterElement(7);
	al.ajouterElement(27);
	al.ajouterElement(14);
	al.ajouterElement(17);
	System.out.println(al);
	System.out.println("La liste contient 7 : "+al.contient(7));
	System.out.println("La liste contient 72 : "+al.contient(72));
	al.enleverElement(27);
	System.out.println(al);
	System.out.println("Element a l'indice 2 : "+al.obtenirElement(2));
	int nouveauElt = 4;
	int ancienElt = al.definirElement(2, nouveauElt);
	System.out.println("Ancien element : "+ancienElt);
	System.out.println("Nouveau element : "+al.obtenirElement(2));
}
{% endhighlight %}

Pour plus d'informations sur la classe ArrayList en Java n'hésitez pas à consulter <a href="https://docs.oracle.com/javase/7/docs/api/java/util/ArrayList.html">la documentation officielle</a>.

