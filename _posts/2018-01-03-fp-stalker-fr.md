---
layout: post
title: FP-Stalker, empreintes de navigateurs pour le suivi d'utilisateurs sur internet.
categories: [tracking]
tags: [tracking, machine learning]
description: Vulgarisation de l'article FP-Stalker publié à la conférence S&P 18. Le post présente dans quelle mesure les empreintes de navigateur peuvent être utilisées à des fins de tracking.
published: true
---

Avec des collègues ([Pierre Laperdrix](https://plaperdr.github.io/), [Walter Rudametkin](https://rudametw.github.io/) 
et [Romain Rouvoy](http://romain.rouvoy.fr/)), nous avons récemment publié un article sur l'utilisation des 
empreintes de navigateur (browser fingerprint) en tant que technique de suivi sur internet.
L'article a été accepté à la conférence [Security and Privacy 2018](https://www.ieee-security.org/TC/SP2018/index.html).
Étant une conférence scientifique, l'article est en anglais et a une structure formelle.
Dans ce post j'en propose donc une vulgarisation en français, tout en essayant de conserver un bon compromis entre vulgarisation et information.

Pour ceux intéressés par les détails des algorithmes et de la méthodologie, l'article complet est disponible sur le lien suivant : [article FP-Stalker](https://hal.inria.fr/hal-01652021)

L'objectif principal de l'article est étudier dans quelle mesure il est possible de suivre un utilisateur sur internet en utilisant uniquement son empreinte de navigateur.
Avant de répondre à cette question, nous présentons tout d'abord ce qu'est une empreinte de navigateur.
Ensuite, nous expliquons comment il est possible de conçevoir des algorithmes de suivi basés sur les empreintes de navigateurs.
Enfin, nous montrons qu'en utilisant ces algorithmes, il est possible de suivre 25% des utilisateurs pendant plus de 100 jours.

# Qu'est-ce qu'une empreinte de navigateur ?

Une empreinte de navigateur (browser fingerprint) est un ensemble d'attributs représentants les caractéristiques d'un PC, d'un smartphone ou bien d'une tablette.
Elle est constituée uniquement d'attributs accessibles depuis un navigateur (Google Chrome, Firefox, etc).
Dans notre cas, on ne considère que les attributs que l'on peut obtenir sans demander d'autorisation.

Le tableau ci-dessous présente un exemple d'empreinte :

<style>
    #fp-table td {
        min-width: 12em;
        border-bottom: 1px solid rgb(0, 0, 204);
        padding: 5px;
    }
    
    #fp-table th {
      border-bottom: 1px solid rgb(0, 0, 204);
      padding: 5px;  
    }
</style>

<table id="fp-table">
    <thead>
        <tr>
            <th>Attribut</th>
            <th>Valeur</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>User agent</td>
            <td>"Mozilla/5.0 (X11; Linux x86_64; rv:59.0) Gecko/20100101 Firefox/59.0"</td>
        </tr>
        <tr>
            <td>Accept</td>
            <td>"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"</td>
        </tr>
        <tr>
            <td>Encodage</td>
            <td>"gzip, deflate, br"</td>
        </tr>
        <tr>
            <td>Langues</td>
            <td>"en-US,en;q=0.5"</td>
        </tr>
        <tr>
            <td>Liste des plugins</td>
            <td>"Plugin 0: DivX® Web Player; DivX Web Player version 1.4.0.233; libtotem-mully-plugin.so. Plugin 1: IcedTea-Web Plugin using IcedTea-Web 1.5.3 1.5.3-0ubuntu0.14.04.1; The a href=http:icedtea.classpath.orgwikiIcedTea-WebIcedTea-Web Plugina executes Java applets.; IcedTeaPlugin.so. Plugin 2: QuickTime Plug-in 7.6.6; The a href=http:www.gnome.orgVideosa 3.10.1 plugin handles video and audio streams.; libtotem-narrowspace-plugin.so. Plugin 3: Shockwave Flash; Shockwave Flash 11.2 r202; libflashplayer.so. Plugin 4: VLC Multimedia Plugin compatible Videos 3.10.1; The a href=http:www.gnome.orgVideosa 3.10.1 plugin handles video and audio streams.; libtotem-cone-plugin.so. Plugin 5: Windows Media Player Plug-in 10 compatible; Videos; The a href=http:www.gnome.orgVideosa 3.10.1 plugin handles video and audio streams.; libtotem-gmp-plugin.so. "</td>
        </tr>
        <tr>
            <td>Plateforme</td>
            <td>"Linux x86_64"</td>
        </tr>
        <tr>
            <td>Cookies autorisés</td>
            <td>"yes"</td>
        </tr>
        <tr>
            <td>Do Not Track</td>     
            <td>"yes"</td>       
        </tr>    
        <tr>
            <td>Fuseau horaire</td>           
            <td>"-60"</td>        
        </tr>    
        <tr>
            <td>Résolution d'écran</td>            
            <td>"1366x768x24"</td>        
        </tr>    
        <tr>
            <td>Local storage</td>            
            <td>"yes"</td>        
        </tr>    
        <tr>
            <td>session storage </td>           
            <td>"yes"</td>        
        </tr>    
        <tr>
            <td>Canvas</td>         
            <td><img src="/assets/media/canvas_exp_fpstalker.png"></td>        
        </tr>    
        <tr>
            <td>WebGL Vendor</td>    
            <td>"VMware, Inc."</td>        
        </tr>
        <tr>
            <td>WebGL Renderer</td>            
            <td>"Gallium 0.4 on llvmpipe (LLVM 3.8, 256 bits)"</td>        
        </tr>    
        <tr>
            <td>Liste des polices (Flash)</td>            
            <td>"KacstFarsi, Droid Sans Armenian, Meera, FreeMono, Padauk Book, Loma, Droid Sans, Century Schoolbook L, KacstTitleL, Ubuntu Medium, Droid Arabic Naskh ..."</td>        
        </tr>    
        <tr>
            <td>Résolution d'écran (Flash)</td>           
            <td>"1366x768"</td>
        </tr>    
        <tr>
            <td>Langue (Flash)</td>           
            <td>"en"</td> 
        </tr>    
        <tr>
            <td>Plateforme (Flash)</td>            
            <td>"Linux 3.19.0-32-generic"</td>        
        </tr>
        <tr>
            <td>AdBlock</td>            
            <td>"yes"</td>        
        </tr>
    </tbody>
</table>

<br>

L'analogie avec les empreintes digitales vient du fait que cette combinaison d'attributs est bien souvent unique.
Ainsi, l'unicité des empreintes de navigateurs peut être utilisée pour essayer de suivre l'activité d'un utilisateur sur internet.

# Suivi/Tracking sur internet

Le suivi sur internet consiste à déterminer les sites visités par un utilisateur.
Bien souvent, ces données de navigation sont utilisées à des fins marketing (profiling), notamment pour proposer de la publicité ciblée.

La majorité des sites souhaitant suivre l'activité de leurs visiteurs utilisent des cookies. 
Le principe est de stocker un identifiant dans un cookie.
Ainsi, lorsqu'un utilisateur revient sur un site, il suffit de regarder l'identifiant stocké dans son cookie pour savoir de qui il s'agit.
Toutefois, il existe diverses techniques permettant de supprimer les cookies telles que le mode de navigation privée, d'où l'invention de techniques de suivi complémentaires. 

La technique de suivi que nous étudions dans cet article est appelée browser fingerprinting, et est basée sur les empreintes de navigateurs pour identifier des utilisateurs.

Le but de cet article est d'étudier l'efficacité des empreintes de navigateurs en tant que technique de suivi sur le long terme.
Pour répondre à cette question nous avons créé le projet Amiunique constitué d'un [site](https://amiunique.org/) ainsi que de deux extensions pour Chrome et Firefox.
Grâce à Amiunique nous avons collecté des empreintes de navigateurs pendant plus de 2 ans afin de pouvoir les étudier.

Dans cet article nous utilisons exclusivement les données provenant des extensions car elles permettent d'observer l'évolution des empreintes d'un individu sur le long terme.
Le graphique ci-dessous présente le nombre d'utilisateurs, ainsi que le nombre d'empreintes collectées chaque mois grâce aux extensions.

<br>
<img src="/assets/media/cdf_users_fr.png">
<br>

Au total, le jeu de données nettoyé contient 96598 empreintes de 1905 utilisateurs différents.


# Évolution des empreintes

Avant de mesurer combien de temps il est possible de suivre un utilisateur en se basant uniquement sur son empreinte, nous étudions la manière dont les empreintes de navigateur évoluent.
Jusqu'à présent, la plupart des articles se concentrent sur le fait que les empreintes de navigateurs sont relativement uniques, ce qui peut être utilisé contre les utilisateurs afin de les identifier.
Toutefois, il est important de garder à l'esprit qu'en plus d'être uniques, les empreintes doivent également rester relativement stable dans le temps.
En effet, si celles-ci changent trop régulièrement, et de manière imprévisible, alors il est difficile de s'en servir comme identifiant de suivi.

Dans cette partie nous montrons que les empreintes de navigateurs changent régulièrement, mais que cette vitesse de changement dépend des utilisateurs et des attributs.
Par exemple, lorsque que le navigateur se met à jour et change de version, cela se reflète dans l'attribut **user agent** qui contient la version du navigateur.

Le tableau ci-dessous présente pour chaque attribut la distribution du temps par utilisateur avant qu'un changement se produise.
De plus, pour chaque attribut de l'empreinte, on indique ce qui peut provoquer un changement (déclencheur):
- **Utilisateur** signifie que le changement est provoqué par une action de l'utilisateur. Par exemple le fait de changer la valeur d'une options dans le navigateur.
- **Automatique** signifie que le changement est provoqué par le navigateur lui même pendant une mise à jour.
- **Contexte** signifie que le changement dépend du contexte géographique ou temporel dans lequel se trouve l'utilisateur.

<style>
    #evol-table td {
        border-bottom: 1px solid rgb(0, 0, 204);
        padding: 5px;
    }
    
    #evol-table th {
      border-bottom: 1px solid rgb(0, 0, 204);
      padding: 5px;  
    }
</style>

<br>
<table id="evol-table">
    <thead>
        <tr>
            <th>Attribut</th>
            <th>Déclencheur</th>
            <th>Médiane</th>
            <th>90eme</th>
            <th>95eme</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Résolution d'écran</td>
            <td>Contexte</td>
            <td>Jamais</td>
            <td>3.1</td>
            <td>1.8</td>
        </tr>
        <tr>
            <td>User agent</td>
            <td>Automatique</td>
            <td>39.7</td>
            <td>13.0</td>
            <td>8.4</td>
        </tr>
        <tr>
            <td>Liste des plugins</td>
            <td>Automatique/Utilisateur</td>
            <td>44.1</td>
            <td>12.2</td>
            <td>8.7</td>
        </tr>
        <tr>
            <td>Liste des polices</td>
            <td>Automatique</td>
            <td>Jamais</td>
            <td>11.8</td>
            <td>5.4</td>
        </tr>
        <tr>
            <td>Entêtes HTTP</td>
            <td>Automatique</td>
            <td>308.0</td>
            <td>34.1</td>
            <td>14.9</td>
        </tr>
        <tr>
            <td>Canvas</td>
            <td>Automatique</td>
            <td>290.0</td>
            <td>35.3</td>
            <td>17.2</td>
        </tr>
        <tr>
            <td>Version du navigateur</td>
            <td>Automatique</td>
            <td>52.2</td>
            <td>33.3</td>
            <td>23.5</td>
        </tr>
        <tr>
            <td>Fuseau horaire</td>
            <td>Contexte</td>
            <td>206.3</td>
            <td>53.8</td>
            <td>26.8</td>
        </tr>
        <tr>
            <td>WebGL Renderer</td>
            <td>Automatique</td>
            <td>Jamais</td>
            <td>81.2</td>
            <td>30.3</td>
        </tr>
        <tr>
            <td>WebGL Vendor</td>
            <td>Automatique</td>
            <td>Jamais</td>
            <td>107.9</td>
            <td>48.6</td>
        </tr>
        <tr>
            <td>Langues</td>
            <td>Utilisateur</td>
            <td>Jamais</td>
            <td>215.1</td>
            <td>56.7</td>
        </tr>
        <tr>
            <td>Do not track</td>
            <td>Utilisateur</td>
            <td>Jamais</td>
            <td>171.4</td>
            <td>57.0</td>
        </tr>
        <tr>
            <td>Encodage</td>
            <td>Automatique</td>
            <td>Jamais</td>
            <td>106.1</td>
            <td>60.5</td>
        </tr>
        <tr>
            <td>Accept</td>
            <td>Automatique</td>
            <td>Jamais</td>
            <td>163.8</td>
            <td>109.5</td>
        </tr>
        <tr>
            <td>Local storage</td>
            <td>Utilisateur</td>
            <td>Jamais</td>
            <td>Jamais</td>
            <td>320.2</td>
        </tr>
        <tr>
            <td>Plateforme</td>
            <td>Automatique</td>
            <td>Jamais</td>
            <td>Jamais</td>
            <td>Jamais</td>
        </tr>
        <tr>
            <td>Cookies</td>
            <td>Utilisateur</td>
            <td>Jamais</td>
            <td>Jamais</td>
            <td>Jamais</td>
        </tr>
    </tbody>
</table>

<br>

On peut observer que certains attributs tels que le **user agent** ou bien la liste des **plugins** évoluent fréquemment pour l'ensemble des utilisateurs.
Au contraire, certains attributs tels que les **langues** ou bien le fait d'autoriser les **cookies** évoluent très peu.
Pour certains attributs, la fréquence de changement est dépendente des utilisateurs, c'est le cas de la **résolution d'écran**.
En effet, on remarque que pour plus de 50% des utilisateurs, la résolution d'écran ne change jamais.
Au contraire, pour 10% des utilisateurs (90eme percentile), celle-ci change tous les 1.8 jours en moyenne.
Cela peut s'expliquer par le fait que certains utilisateurs possèdent un écran externe.
A l'opposé, d'autres utilisateurs ne disposent pas de plusieurs écrans, et ont donc une résolution d'écran qui ne change jamais.

De manière général, le graphique ci-dessous représente la probabilité qu'une empreinte change au bout d'un nombre de jours donné dans les deux situations suivantes:
- Probabilité calculée sur l'ensemble des empreintes (en bleu);
- Probabilité calculée sur la moyenne de chaque utilisateur (en orange).

La différence entre les deux courbes peut être expliquée par le fait que tous les utilisateurs ne voient pas leur empreintes évoluer à la même vitesse.
Sur la courbe orange, on remarque qu'environ 50% des utilisateurs présentent au moins un changement dans leur empreinte au bout de 5 jours.
Au contraire, pour plus de 20% des utilisateurs il est nécessaire d'attendre 10 jours avant qu'un changement se produise.

<br>
<img src="/assets/media/proportion_fp_change_time_fr.png">
<br>

Si les empreintes de navigateurs étaient totalement uniques et stables dans le temps, alors il suffirait de regarder si deux empreintes sont identiques pour savoir si elles appartiennent à un même utilisateur.
Toutefois, nous venons de montrer que :
1. Les empreintes de navigateurs changent régulièrement,
2. Les attributs composant une empreinte évoluent à des vitesses différentes.

Ainsi, il est nécessaire de prendre en compte ces deux points si l'on souhaite concevoir des algorithmes de suivi efficaces.

# Algorithmes de suivi/tracking

Afin de pouvoir évaluer la possibilité de suivre des utilisateurs grâce à leur empreinte de navigateur, nous nous plaçons du côté des fingerprinters, c'est à dire des sites qui utilisent le fingerprinting pour suivre des utilisateurs.

Le schéma ci-dessous présente le processus de fingerprinting en 5 étapes.

1. Un utilisateur visite une page web en utilisant son navigateur.
2. Le site web (fingerprinter) collecte son empreinte de navigateur.
3. Le site compare l'empreinte collectée avec des empreintes connues dans sa base de données.
4. Une fois les comparaisons finies, l'algorithme prédit si la nouvelle empreinte appartient à un utilisateur connu ou bien si elle correspond à un nouvel utilisateur.
5. (1) On ajoute l'empreinte à la base de données des empreintes connues. (2) Si l'empreinte appartient à un utilisateur qui n'était pas encore présent en base, alors on ajoute ce nouvel utilisateur.

<br>
<img src="/assets/media/general_recap_fp_fr.png">
<br>

L'étape de collecte de l'empreinte (étape 2) se passe essentiellement dans le navigateur, et peut donc être observée et analysée.
Toutefois, les algorithmes pour suivre les utilisateurs ne sont pas accessibles depuis le navigateur car ceux-ci sont exécutés sur les serveurs des fingerprinters.
C'est la raison pour laquelle nous devons nous même créer des versions de ces algorithmes, afin de pouvoir ensuite évaluer leur capacité à suivre des utilisateurs.

Les algorithmes que nous proposons interviennent lors des étapes 3 et 4.
Dans l'étape 3 cela consiste en une stratégie pour comparer les différentes empreintes entre elles.
Dans l'étape 4, l'algorithme doit décider selon quels critères il considère que deux empreintes appartiennent 
à un même utilisateur.

Nous proposons deux algorithmes, un premier à base de règles, et un second à base de règles et d'apprentissage automatique.

## Algorithme à base de règles

Le premier algorithme que nous proposons utilise un ensemble de règles.
De manière simplifiée, il compare la nouvelle empreinte dont on cherche à identifier le propriétaire, avec chaque empreinte connue présente en base.

A chaque comparaison il vérifie les règles suivantes :
1. Le **système d'exploitation**, la **plateforme** ainsi que le **navigateur** des deux empreintes doivent être les mêmes.
2. La **version du navigateur** de l'empreinte inconnue doit être supérieure ou égale à celle de l'empreinte connue. L'intuition derrière cette règle est que la version du navigateur ne fait qu'augmenter car peu de gens réinstallent des versions antèrieures de leur navigateur.
3. Les attributs **local storage**, **do not track**, **cookies** et **canvas** doivent être identiques entre les deux empreintes. 
4. Les **polices d'écriture** de l'empreinte inconnue, si celles-ci sont disponibles, doivent être un sous-ensemble ou un sur ensemble de celles de l'empreinte connue.
5. Les attributs **user agent**, **vendor**, **renderer**, **plugins**, **langues**, **accept** et **entêtes** des deux empreintes doivent avoir une similarité supérieure à 75% (formule mathématique). De plus, on n'autorise pas plus de deux attributs de cette liste à être différents entre les deux empreintes.
6. Les attributs **resolution**, **fuseau horaire** et **encodage** peuvent etre différents entre les deux empreintes. Toutefois, seul un attribut à la fois peut être différent.
7. Le nombre de changements total des règles 5 et 6 doit être inférieur ou égal à 2.
<br>

Pour chaque empreinte connue avec laquelle on compare la nouvelle empreinte que l'on cherche à identifier, celle-ci n'est conservée que si elle vérifie les 7 règles.
À la fin des comparaisons, si aucune empreinte n'a vérifié les 7 règles, alors on estime que l'empreinte inconnue appartient à un nouvel utilisateur.
Autrement, la décision dépend du nombre d'empreintes en base qui vérifient les 7 règles.

## Algorithme hybride

Un des problèmes de l'algorithme précédent vient de la manière dont sont déterminées les règles.
Pour certaines telles que les règles 1 et 2, ce sont des sortes de contraintes, alors que d'autres sont issues d'un mélange entre des analyses statistiques ainsi que des connaissances métier.
Ainsi, en dehors de règles 1 et 2, il y a une part de subjectivité non négligeable dans la définition des règles.
Pour formaliser la manière d'établir des règles, nous avons donc créé un nouvel algorithme qui utilise le machine learning (apprentissage automatique) en plus des règles 1 et 2.

Le machine learning est un ensemble d'outils mathématiques permettant d'apprendre automatiquement des règles ou des décisions à partir de données du passé.
Toutefois, étant un outil mathématique, le machine learning ne fonctionne que sur des nombres.

La première étape pour conçevoir notre nouvel algorithme consiste donc à convertir nos empreintes de navigateurs en un ensemble de nombres (vecteur).
Dans notre cas, cela consiste à comparer les attributs de deux empreintes 2 à 2, et de calculer leur similarité lorsque cela à un sens.
Dans le cas de certains attributs comme le **canvas**, ou les attributes n'ayant que deux valeurs (**cookies**, **local storage**), nous n'utilisons pas de similarité mais plutot une valeur valant 1 si les deux attributs sont identiques, et 0 si ils sont différents.

Le tableau ci-dessous montre comment nous transformons un couple d'empreintes (empreinte connue/inconnue) en un 
vecteur de nombres.

<style>
    #vectorisation-fp td {
        border-bottom: 1px solid rgb(0, 0, 204);
        padding: 5px;
    }
    
    #vectorisation-fp th {
      border-bottom: 1px solid rgb(0, 0, 204);
      padding: 5px;  
    }
</style>
<br>
<table id="vectorisation-fp">
    <thead>
        <tr>
            <th>Attribut</th>
            <th>Empreinte inconnue</th>
            <th>Empreinte connue</th>
            <th>Vecteur</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>User agent</td>
            <td>"Mozilla/5.0 (X11; Linux x86_64; rv:59.0) Gecko/20100101 Firefox/59.0"</td>
            <td>"Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0"</td>
            <td>0.97</td>
        </tr>
        <tr>
            <td>Accept</td>
            <td>"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"</td>
            <td>"text/html,application/xhtml+xml,*/*;q=0.8"</td>
            <td>0.79</td>
        </tr>
        <tr>
            <td>Encodage</td>
            <td>"gzip, deflate, br"</td>
            <td>"gzip, deflate"</td>
            <td>0.87</td>
        </tr>
        <tr>
            <td>Langues</td>
            <td>"en-US,en;q=0.5"</td>
            <td>"fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4"</td>
            <td>0.53</td>
        </tr>
        <tr>
            <td>...</td>
            <td>...</td>
            <td>...</td>
            <td>...</td>
        </tr>
        <tr>
            <td>Canvas</td>         
            <td><img src="/assets/media/canvas_exp_fpstalker.png"></td> 
            <td><img src="/assets/media/canvas_exp_fpstalker_2.png"></td>     
            <td>0</td>   
        </tr>
        <tr>
            <td>Cookies</td>
            <td>"yes</td>
            <td>"no"</td>
            <td>0</td>
        </tr>
    </tbody>
</table>
<br>

Maintenant que nous avons trouvé un moyen de transformer nos empreintes en nombres, nous devons choisir un modèle d'apprentissage capable de calculer la probabilité que deux empreintes appartiennent à un même utilisateur.
Pour cela nous utilisons une forêt d'arbres de décision.
L'image ci-dessous présente les premiers étages d'un arbre de décision.

<br>
<img src="/assets/media/new_nice_tree.png">
<br>
<br>

Pour calculer la probabilité que deux empreintes appartiennent à un même utilisateur, on fournit le vecteur de nombres représentant le couple d'empreintes connue/inconnue à un arbre de décision.
Chaque rectangle correspond à une condition à vérifier.
Dans notre exemple, le premier rectangle teste si la similarité entre les deux attributs **langues** est inférieure à 0.978.
Si c'est le cas (True), on suit la flèche gauche.
Autrement (False), on suit la flèche droite.
On répète ce processus jusqu'à arriver en bas de l'arbre.
En fonction du chemin suivi, l'arbre prédit si oui ou non les deux empreintes proviennent d'un même utilisateur.
Une forêt d'arbres de décision est constituée de plusieurs arbres de décision.
La décision finale émise par la forêt peut être vue comme un vote entre les différents arbres qui la constitue, et correspond à la majorité des votes.

Afin de calculer la probabilité que deux empreintes appartiennent à un même utilisateur, il est nécessaire d'entrainer la forêt au préalable, d'où la notion d'apprentissage.
Pour cela, on lui montre des couples d'empreintes venant de mêmes utilisateurs, ainsi que des couples venant d'utilisateurs différents.
En fonction des bonnes ou mauvaises réponses fournies par la forêt, celle-ci adapte automatiquement les différents seuils de similarité, ainsi que les différentes conditions dans le but que les réponses futures soient plus précises.

Ce second algorithme commence donc par l'application des règles 1 et 2 que nous avons présentées dans l'algorithme précédent.
Dans un second temps, on garde l'ensemble des empreintes connues qui vérifient ces deux règles, puis on les transmet à la forêt d'arbres de décision qui, pour chacune d'elles, calcule la probabilité que l'empreinte inconnue et l'empreinte connue appartiennent au même utilisateur.
Ensuite, on garde l'empreinte la plus probable (celle avec la plus grande probabilité associée).
Si la plus grande probabilité est trop faible, on ne prend pas le risque de lier l'empreinte à un utilisateur présent en base, et on considère qu'elle appartient à un nouvel utilisateur.
Autrement la décision dépend du nombre d'empreintes connues en base qui ont une probabilité suffisament élevée.

# Évaluation des algorithmes

Ne perdons pas de vue un l'objectif principal de l'article qui est de mesurer dans quelle mesure il est possible de suivre un utilisateur en utilisant son empreinte de navigateur.

Pour évaluer la capacité de nos algorithmes à suivre des utilisateurs, nous séparons nos empreintes en deux groupes : un groupe d'apprentissage, et un groupe de test.
Cela est nécessaire à cause de l'algorithme hybride qui utilise des techniques d'apprentissage automatique.
De plus, nous n'utilisons pas directement l'ensemble d'empreintes de test.
A partir de celui-ci, nous génèrons un jeu de données qui simule la fréquence de collecte des empreintes.
Cela nous permet de tester l'impact de la fréquence de collecte des empreintes sur le temps de suivi.
Par exemple, comment le fait de récolter une empreinte une fois tous les 10 jours dégrade le temps de suivi par rapport au fait de le récolter une fois par jour ?

Outre nos deux algorithmes, nous nous comparons également avec un algorithme proposer par Eckersley en 2010 (Panopticlick), un des premiers chercheurs à avoir mis en lumière le fingerprinting.

Le graphique ci-dessous présente le temps de suivi moyen en fonction de la fréquence de collecte pour les 3 algorithmes.
Nous observons que la version hybride est la plus performante.
Elle arrive à suivre les utilisateurs pendant plus de 50 jours en moyenne.
La version à base de règles suit les utilisateurs environ 10 jours de moins que la version hybride.
Enfin, l'algorithme propos" par Eckersley en 2010 affiche des performances beaucoup plus faibles (environ 12 jours), ce qui n'est pas étonnant car celui-ci utilise moins d'attributs.

<br>
<img src="/assets/media/raw_days_frequency_fr.png">
<br>

Le graphique ci-dessous présente le temps maximum de suivi moyen en fonction de la fréquence de collecte pour les 3 algorithmes.
Cela correspond à la moyenne des temps maximum pendant lesquels un algorithme est capable de suivre un utilisateur.
On observe que l'ordre des performances est le même que pour la métrique précédente.
Lorsque la fréquence de collecte d'empreinte est de 5 jours, on remarque que l'algorithme hybride est capable de suivre au maximum un utilisateur environ 75 jours en moyenne.
Pour la version à base de règle la durée s'élève à environ 70 jours.

<br>
<img src="/assets/media/raw_max_days_frequency_fr.png">
<br>

Le graphique ci-dessous présente 3 courbes permettant d'analyser plus finement les résultats de la version hybride lorsque la fréquence de collecte des empreintes est de 7 jours.
Ces courbes présentent le pourcentage d'utilisateurs (axe vertical) qui peuvent être traqués au moins un certains nombre de jours donné (axe horizontal).

La courbe grise présente le résultat optimal qu'il est possible d'atteindre dans notre cas.
En effet, dans notre évaluation la capacité à pouvoir suivre un utilisateur dépend de la durée pendant laquelle celui-ci a participé à notre collecte de données.
La courbe noir présente le temps maximum de suivi moyen, et la courbe rouge le temps de suivi moyen.
Ainsi, nous observons qu'en collectons des empreintes toutes les semaines, 26% des utilisateurs peuvent être suivis au moins une fois pendant plus de 100 jours (courbe noire).

<br>
<img src="/assets/media/cdf_tracking_time_inverse_fr.png">
<br>

# Discussion
Dans la pratique le fingerprinting n'est pas utilisé seul, mais en plus des cookies.
Ainsi, contrairement à notre article dans lequel nous évaluons le temps de suivi en utilisant uniquement le fingerprinting, il sera utilisé seulement quand un utilisateur se présente sur un site sans cookie.
Le site peut donc utiliser l'empreinte de navigateur pour savoir si l'utilisateur est déjà venu sur le site mais a supprimé son cookie, ou bien s'il s'agit d'un nouvel utilisateur.

Différentes stratégies plus ou moins adaptées au grand public ont été développées pour se protéger de cette technique de suivi.
 
L'une des solutions la plus simple est d'utiliser des extensions permettant de bloquer les scripts de tracking tels que 
[Ghostery](https://www.ghostery.com/fr/) ou [Privacy Badger](https://www.eff.org/fr/privacybadger).
Il est également possible d'activer le mode anti fingerprinting dans Firefox ou bien d'utiliser un navigateur 
comme  [Brave](https://www.brave.com/) qui intègre directement une solution contre le fingerprinting.


