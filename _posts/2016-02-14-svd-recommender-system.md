---
layout: post
title: A simple SVD recommender system using Python
categories: [machine learning, python]
tags: [python, recommender system, sparse matrix]
description: In this article we will see how we can build a recommender system for movies using Python and exploiting the sparsity of the data.
---

<h1>SVD recommender system for movies</h1>
In this article we will see how it is possible to use python in order to build a SVD based recommender system. Before going further, I want to precise that the goal of this article is not to explain how and why SVD works to make recommendations. This article only aims to show a possible and simple implementation of a SVD based recommender system using Python and Scipy.

In this example we consider an input file whose each line contains 3 columns (user id, movie id, rating). One important thing is that most of the time, datasets are really sparse when it comes about recommender systems. Most of the examples you'll find on the internet don't take advantage of the sparsity of the data. However, in our case we'll pay attention to use appropriate data structures in order to increase the speed of our program.

<h2>Read the dataset</h2>
{% highlight python %}
import numpy as np
from scipy.sparse import csr_matrix

#constants defining the dimensions of our User Rating Matrix (URM)
MAX_PID = 37143
MAX_UID = 15375

def readUrm():
	urm = np.zeros(shape=(MAX_UID,MAX_PID), dtype=np.float32)
	with open('/PathToTrainFile.csv', 'rb') as trainFile:
		urmReader = csv.reader(trainFile, delimiter=',')
		for row in urmReader:
			if float(row[2]) >= 6:
				urm[int(row[0]), int(row[1])] = float(row[2])

	return csr_matrix(urm, dtype=np.float32)

{% endhighlight %}

We read our dataset and store it in sparse matrix using csr format. To do so we use the scipy library. It enables us to store only the non zero elements.

<h2>Retrieve the test users</h2>
First we are going to create a function readUsersTest in order to get the ids of the users for which we want to make a prediction.

{% highlight python %}
def readUsersTest():
	uTest = dict()
	with open("./testSample.csv", 'rb') as testFile:
		testReader = csv.reader(testFile, delimiter=',')
		for row in testReader:
			uTest[int(row[0])] = list()

	return uTest
{% endhighlight %}

Then we want to find the movies already seen by these users in order not to recommend them again.

{% highlight python %}
def getMoviesSeen():
	moviesSeen = dict()
	with open("./trainSample.csv", 'rb') as trainFile:
		urmReader = csv.reader(trainFile, delimiter=',')
		for row in urmReader:
			try:
				moviesSeen[int(row[0])].append(int(row[1]))
			except:
				moviesSeen[int(row[0])] = list()
				moviesSeen[int(row[0])].append(int(row[1]))

	return moviesSeen
{% endhighlight %}

<h2>Compute the SVD of our user rating matrix</h2>
In order to compute the singolar value decomposition of our user rating matrix we need to create a function with two parameters : the user rating matrix, the rank of our SVD. The SVD is computed using the sparsesvd package (https://pypi.python.org/pypi/sparsesvd/)

{% highlight python %}
import math as mt
import csv
from sparsesvd import sparsesvd

def computeSVD(urm, K):
	U, s, Vt = sparsesvd(urm, K)

	dim = (len(s), len(s))
	S = np.zeros(dim, dtype=np.float32)
	for i in range(0, len(s)):
		S[i,i] = mt.sqrt(s[i])

	U = csr_matrix(np.transpose(U), dtype=np.float32)
	S = csr_matrix(S, dtype=np.float32)
	Vt = csr_matrix(Vt, dtype=np.float32)

	return U, S, Vt	
{% endhighlight %}

As s is returned as a vector, we want to create a matrix S whose diagonal has for value the elements of vector s. Once again, in order to save memory space and to increase the speed of our program we do not forget to convert our new matrices to csr format.

<h2>Predict the movies for our test users</h2>
The final step is to predict recommendations for our test users. To do so we will use the matrices computed in the previous step.

{% highlight python %}
from scipy.sparse.linalg import * #used for matrix multiplication

def computeEstimatedRatings(urm, U, S, Vt, uTest, moviesSeen, K, test):
	rightTerm = S*Vt 

	estimatedRatings = np.zeros(shape=(MAX_UID, MAX_PID), dtype=np.float16)
	for userTest in uTest:
		prod = U[userTest, :]*rightTerm

		#we convert the vector to dense format in order to get the indices of the movies with the best estimated ratings 
		estimatedRatings[userTest, :] = prod.todense()
		recom = (-estimatedRatings[userTest, :]).argsort()[:250]
		for r in recom:
			if r not in moviesSeen[userTest]:
				uTest[userTest].append(r)

				if len(uTest[userTest]) == 5:
					break

	return uTest
{% endhighlight %}

In our function we retrieve the best 250 estimated ratings. Why 250 ? We choose this number as our goal was to recommend 5 NEW movies for our test users. Therefore, by choosing 250 movies, we are almost sure that we will find at least 5 movies which have not been seen by our user.

<h2>Main of our program</h2>
Finally we obtain the following main : 
{% highlight python %}
def main():
	K = 90
	urm = readUrm()
	U, S, Vt = computeSVD(urm, K)
	uTest = readUsersTest()
	moviesSeen = getMoviesSeen()
	uTest = computeEstimatedRatings(urm, U, S, Vt, uTest, moviesSeen, K, True)
{% endhighlight %}