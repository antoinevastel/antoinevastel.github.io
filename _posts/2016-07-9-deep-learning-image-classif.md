---
layout: post
title: Réseau de neuronnes pré-entrainé appliqué à la classification d'images
categories: [Deep learning, Machine learning]
tags: [MxNet , Python, Scikit learn, réseau de neuronnes, classification images]
description: Utilisation d'un réseau de neuronnes  pré-entrainé pour résoudre un problème de classification d'images différent de celui pour lequel le réseau de neuronnes a été entrainé.
---

Cet article présente comment utiliser un réseau de neuronnes pré-entrainé pour résoudre un problème de classification d'images (tâche différente que celle pour laquelle le réseau a été préalablement entrainé). Dans notre cas, l'objectif est de classer des images satellites de toits en 4 catégories : orientation EST/OUEST, orientation NORD/SUD, toit plat, et catégorie "Autre". Il est important de préciser une nouvelle fois que cette tâche de classification est différente de celle pour laquelle le réseau de neuronnes que nous allons utiliser a été entrainé.

<h2>Librairie MxNet</h2>
La librairie de réseau de neuronnes que nous utiliserons se nomme MxNET. Elle est disponible à la fois sous Linux et Windows, et possède (entre autre) un wrapper en Python et en R. Dans cet article le code a été exécuté sous Ubuntu avec le wrapper Python.

<h3>Installation de la librairie sous Ubuntu</h3>
Tout d'abord, exécutez les commandes suivantes : 
{% highlight javascript %}
sudo apt-get update
sudo apt-get install -y build-essential git libatlas-base-dev libopencv-dev
{% endhighlight %}

Ensuite, clonez le dépot Github de MxNet grâce à la commande ci-après :
{% highlight javascript %}
git clone --recursive https://github.com/dmlc/mxnet
{% endhighlight %}

Puis pour compiler la librairie : 
{% highlight javascript %}
cd mxnet; make -j$(nproc)
{% endhighlight %}

Si vous disposez d'un GPU assez récent et que vous avez déjà installé les librairies CUDA suffisantes, vous pouvez compiler la librairie avec la commande ci-dessous. Cela permettra à MxNet de tirer partie de votre GPU.
{% highlight javascript %}
cd mxnet;make -j4 USE_CUDA=1
{% endhighlight %}

Enfin, pour installer le package Python : 
{% highlight javascript %}
cd python; sudo python setup.py install
{% endhighlight %}

En cas de problème lors de la phase d'installation, n'hésitez pas à consulter directement la <a href="http://myungjun-youn-demo.readthedocs.io/en/latest/how_to/build.html">documentation de MxNet.</a>

<h2>Extracteur de features</h2>
Le réseau de neuronnes que nous allons utiliser se nomme Inception. Il a été entrainé sur le jeu de données Image Net et a une précision top-1 de 70% et top-5 de 89.9%.

Pour information, le jeu de données Image Net contient divers types d'images telles que des plantes, des animaux, des ustensiles etc... Sont but est de correctement prédire le type d'une image, ce qui est différent de notre tâche de classification. Toutefois, ce réseau a appris à extraire des caractéristiques des images afin de pouvoir les différencier les unes des autres. Il a appris, lors de sa phase d'apprentissage, à représenter les images sous une autre forme que le format brut dont on dispose.
Cela est similaire à une approche plus traditionnelle qui consiste à utiliser les HOGs (Histogramme de gradient orienté) ou aux SIFT (Scale-Invariant feature transform) pour extraire des features d'une image puis de se servir de celles-ci pour entrainer un classifieur supervisé.

Pour chaque image nous allons donc extraire les caractéristiques générées par le réseau de neuronnes. Dans le cas du programme ci-après, nous avons les fichiers id_train.csv dans le répertoire courant (contient les ids et labels des images de la phase d'entrainement), ainsi qu'un dossier roof_images contenant l'ensemble des images.

Le code ci-dessous extrait les features des images qui nous serviront à entrainer notre classifeur supervisé. Celles-ci sont écrites dans le fichier features_train.csv.

{% highlight python %}
import mxnet as mx
import logging
import numpy as np
from skimage import io, transform
import matplotlib.pyplot as plt
import numpy as np
from scipy import ndimage as ndi
import Image
from skimage.util import img_as_float
from skimage.transform import resize
import skimage.io as i
import pandas as pd

directory = "./roof_images/"

def PreprocessImage(path, show_img=False, mean_img=None):
    #Chargement de l'image
    img = io.imread(path)
    short_egde = min(img.shape[:2])
    yy = int((img.shape[0] - short_egde) / 2)
    xx = int((img.shape[1] - short_egde) / 2)
    crop_img = img[yy : yy + short_egde, xx : xx + short_egde]
    #On redimensionne l'image a 224, 224
    resized_img = transform.resize(crop_img, (224, 224))
    if show_img:
        io.imshow(resized_img)
    sample = np.asarray(resized_img) * 256
    #On inverse les axes de l'image pour la transformer de (224, 224, 4) a (3, 224, 224)
    sample = np.swapaxes(sample, 0, 2)
    sample = np.swapaxes(sample, 1, 2)
    #On soustrait la moyenne
    normed_img = sample - mean_img.asnumpy()
    normed_img.resize(1, 3, 224, 224)
    return normed_img


def read_images():
    df = pd.read_csv("./id_train.csv")
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    #On charge le reseau pre entraine
    prefix = "Inception/Inception_BN"
    num_round = 39
    model = mx.model.FeedForward.load(prefix, num_round, ctx=mx.cpu(), numpy_batch_size=1)

    #on charge l'image moyenne
    mean_img = mx.nd.load("Inception/mean_224.nd")["mean_img"]
    synset = [l.strip() for l in open('Inception/synset.txt').readlines()]
    cpt = 0
    f = open("./features_train.csv", 'w')
    internals = model.symbol.get_internals()
    fea_symbol = internals["global_pool_output"]
    feature_extractor = mx.model.FeedForward(ctx=mx.cpu(), symbol=fea_symbol, numpy_batch_size=1,
                                 arg_params=model.arg_params, aux_params=model.aux_params,
                                 allow_extra_params=True)
    #column0 = id image, colonne1= label, autres colonnes = features
    for index, row in df.iterrows():
        imagePath = "./"+directory+str(row["Id"])+".jpg"
        batch = PreprocessImage(imagePath, False, mean_img)
        global_pooling_feature = feature_extractor.predict(batch)
        f.write(str(row["Id"])+","+str(row["label"]))
        f.write(",")
        for i in range(0, len(global_pooling_feature[0])-1):
            f.write(str(global_pooling_feature[0][i][0][0]))
            f.write(",")
        f.write(str(global_pooling_feature[0][len(global_pooling_feature[0])-1][0][0]))
        f.write("\n")
        cpt += 1

    f.close()


read_images()
{% endhighlight %}

Cette première phase nous a donc permis d'extraire un ensemble de caractéristique des images. Dans l'étape suivante nous utiliserons ces caractéristiques afin d'entrainer un classifieur supervisé. Nous explorerons plusieurs possibilités telles que kNN, random forest ainsi que la SVM.

<h2>Entrainement du classifieur supervisé</h2>
L'objectif désormais est d'entrainer un classifieur supervisé sur les caractéristiques que nous venons d'extraire dans l'étape précédente. Celui-ci aura pour rôle d'apprendre à classer correctement les images dans l'une des quatre catégories suivantes : 
<ul>
    <li>Toit orienté Est/Ouest</li>
    <li>Toit orienté Nord/Sud</li>
    <li>Toit plat</li>
    <li>Autre</li>
</ul>

Notre programme permet de tester 3 algorithmes pour classer nos toits : kNN, random forest, SVM. Le programme ci-dessous est inspiré de celui que j'ai utilisé par la compétition Datascience Game. Grâce aux différents paramètres du début du programme on peut facilement changer le type de classifieur à utiliser (svm, kNN, random forest), le nombre de voisins dans le cas de l'algorithme kNN, ainsi que le nombre d'images à utiliser pour entrainer notre classifieur.

{% highlight python %}
import matplotlib.pyplot as plt
import numpy as np
from scipy import ndimage as ndi
import skimage.io as io
import pandas as pd
import pylab as pl
from sklearn.cross_validation import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn import svm
from sklearn.neighbors import KNeighborsClassifier

directory = "./roof_images/"
n_neighbors = 9
n_estimators = 32 #Pour random forest
kernel_type = "linear" #kernel a utiliser pour la svm
#models : knn, randomforest, svm
modelName = "svm"
nbImagesTrainToRead = 6500
nbImagesTestToRead = 1500

#lit les features generees dans l'etape precedente
def read_features(df, nbImagesToRead, verbose=False):
    X = []
    Y = []
    ids = []
    cpt = 0
    for index, row in df.iterrows():
        X.append(row[2:].as_matrix())
        Y.append(row[1])
        ids.append(int(row[0]))
        cpt += 1
        if verbose and cpt%50 == 0:
            print(cpt)
        if cpt > nbImagesToRead:
            break
    X = np.array(X)
    print(len(X[0]))
    Y = np.array(Y)
    ids = np.array(ids)
    return X, Y, ids

#entraine notre classifieur (knn, random forest ou svm)
def train_model(modelName, X_train, Y_train):
    print("Start training model")
    if modelName == "knn":
        knn = KNeighborsClassifier(n_jobs=4, n_neighbors = n_neighbors)
        knn.fit(X_train, Y_train)
        return knn
    elif modelName == "randomforest":
        model = RandomForestClassifier(n_estimators = n_estimators, n_jobs=4)
        model.fit(X_train, Y_train)
        return model
    elif modelName == "svm":
        model = svm.SVC(kernel=kernel_type, C=5.0)
        model.fit(X_train, Y_train)
        return model

#calcule la precision de notre classifieur
def compute_accuracy(prediction, Y_test):
    right = 0
    wrong = 0
    for i in range(0, len(Y_test)):
        if Y_test[i] == prediction[i]:
            right += 1
        else:
            wrong += 1
    return right, wrong



df = pd.read_csv("./features_train.csv")

#on separe notre jeu de donnees en deux echantillons : un pour entrainer notre classifieur
#le second pour tester la qualite de celui-ci
train, test = train_test_split(df, train_size = nbImagesTrainToRead, test_size = nbImagesTestToRead)
X_train, Y_train, ids = read_features(train, nbImagesTrainToRead, False)
X_test, Y_test, ids = read_features(test, nbImagesTestToRead, False)

    
model = train_model(modelName, X_train, Y_train)

prediction = model.predict(X_test)
right, wrong = compute_accuracy(prediction, Y_test)
print("right : ",right)
print("wrong : ",wrong)
print("accuracy : ",float(right)/float(right+wrong))

{% endhighlight %}

Le maximum de précision atteint en local est ~0.77 avec une svm utilisant un kernel rbf (radial basis function). Lors de l'évaluation sur Kaggle pour la compétition Datascience Game, le modèle a obtenu une précision de 0.73. Cela est globalement du au fait que notre jeu de données contient peu d'images de la catégorie "Autre" et que c'est une catégorie que nous avons du mal à prédire avec notre modèle.

<h3>Morale de l'histoire</h3>
Nous partions plutot négatif pour cette compétition car de nos jours on associe souvent classification d'images avec deep learning. Or, il est très long de faire du deep learning sans carte graphique et/ou un bon processeur. De plus, à l'origine nous n'avions pas de connaissances particulière en traitement de l'image.

Il faut savoir que la génération des features avec le réseau de neuronnes a pris une 15ene d'heures sur un pc portable avec un processeur intel Celeron(ça existe encore en 2016 ...), un disque dur classique (pas de ssd), et seulement 4GO de ram. L'entrainement du classifieur supervisé par la suite est très rapide ~1min, et est donc négligeable fasse au temps d'extraction des features.

Il est donc encore possible de nos jours de survivre dans les compétitions Kaggle ou de machine learning en général, même avec un pc légèrement (voir totalement) dépassé.

<h3>Remerciements</h3>
Je tiens à remercier (par ordre alphabétique) : Fabien Gontier, Perrine Martin et Jacques Peeters avec qui j'ai réalisé cette compétition. Je laisse à Jacques Peeters (s'il le souhaite) le soin d'expliquer le modèle le plus compétent que nous avons réalisé car il en est à l'origine.