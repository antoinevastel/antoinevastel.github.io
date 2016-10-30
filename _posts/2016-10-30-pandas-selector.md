---
layout: post
title: Cheat sheet Pandas selectors
categories: [Machine learning]
tags: [Python, Scikit learn, pandas]
description: Small cheat sheet containing examples of different Python Pandas selectors.
---

This article is a small cheat sheet of Pandas selectors. To illustrate our examples we will use the following <a href="/assets/data/albuquerque.csv">dataset</a> containing information about price of housing in Albuquerque. For further information you can check <a href="http://www.pmean.com/00files/housing.htm">this page</a>.

I will try to regularly update this page with new examples.

<h1>Examples of selectors</h1>
We have a dataframe <em>df</em> containing the following columns : Price, SquareFeet, AgeYearsNumberFeatures, Northeast, CustomBuild, CornerLot.

You can select a column by using its name :
{% highlight python %}
df["Price"]
{% endhighlight %}

You can select a subset of columns by passing a list of the names :
{% highlight python %}
df[["Price", "CornerLot"]]
{% endhighlight %}

The first column of our dataframe is the price (target variable). All the other columns are the predictor variables, which we can use to predict the price. If we want to select all of the predictor variables we can use the following code : 
{% highlight python %}
pred_variables = df.ix[:, 1:]
#or with iloc
pred_variables = df.iloc[:,1:]
{% endhighlight %}

You can get the names of the columns and then select the predictor variables in another way :
{% highlight python %}
cols = df.columns.tolist()
pred_variables = df[cols[1:]]
{% endhighlight %}

We can select the first 50 rows (from 0 to 49):
{% highlight python %}
df[:50]
{% endhighlight %}

We can select rows whose price is > $135000 :
{% highlight python %}
df[df.Price > 135000]
{% endhighlight %}

We can also filter using two variables :
{% highlight python %}
df[(df.Price > 135000) & (df.CornerLot == "No")]
{% endhighlight %}

You can try to mix the different previous techniques :
{% highlight python %}
df[(df.Price > 135000) & (df.CornerLot == "No")].iloc[0:100, 0:3]
{% endhighlight %}

In all of our examples we don't get a copy of the sub dataframe but a reference to it. This means that if we make a change to our "new" dataframe, it will also impact the original dataframe.
{% highlight python %}
df2 = df["Price"]
#we change the value in our second dataframe
df2[:] = 600
#since it is a reference to df, df["Price"] is now equal to 600
print(df["Price"])

#To do a copy of a dataframe we can use the copy method
df2 = df["Price"].copy()
#we change the value to 900
df2[:] = 900
#since df2 is a copy and NOT a reference, it doesn't impact the original value if df
print(df["Price"])
{% endhighlight %}

More examples coming soon...
