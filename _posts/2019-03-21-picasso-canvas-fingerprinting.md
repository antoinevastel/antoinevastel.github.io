---
layout: post
title: Demonstration of Picasso canvas fingerprinting
categories: [Browser Fingerprinting]
tags: [Browser Fingerprinting]
description: Demonstration of a canvas fingerprint used to detect devices spoofing their real OS or browser. It is inspired by the <a href="https://ai.google/research/pubs/pub45581">Picasso paper</a> written by Elie Bursztein.
---

<style>
    #canvasgenerated {
        margin-top: 40px;
    }

    form {
      margin-top: 30px;
    }

    form h2 {
      margin-bottom: 25px;
    }
</style>

This post presents an implementation of a canvas fingerprint inspired by the <a href="https://ai.google/research/pubs/pub45581">Picasso paper</a> written by Elie Bursztein.
Contrary to the majority of the canvas presented in this <a href="{% post_url 2019-02-19-canvas-fingerprint-on-the-web %}"> other post</a>,
the goal of this canvas is to detect devices spoofing the real nature of their OS or browser.
For example, it can be used to detect desktop devices pretending to be iPhones,
or to distinguish between real Android devices and Android emulators.
If you want to learn more about how it works, I advise you to read the excellent <a href="https://ai.google/research/pubs/pub45581">Picasso paper</a> or this <a href="https://adtechmadness.wordpress.com/2019/03/19/overview-of-googles-picasso/">blog post</a> by Adtechmadness.

The form below enables you to modify the different parameters used to generate the canvas.
- **Number of rounds:** it corresponds to the number of canvas primitives drawn on the canvas. The primitives available are the following: drawing text, an arc, a Bezier curve,
a quadratic curve and an ellipse (not in the original Picasso paper).
- **Canvas width and height:** they correspond to the dimension of the canvas generated in pixels.
- **Offset and multiplier**: these parameters are used by the pseudo-random number generator.
- **Font size scale factor**: this parameter controls the size of the text drawn on the canvas.
- **Max shadow blur**: it represents an upper bound of the maximum blur that can be applied on the canvas at a given round.

Whenever you click on the generate canvas button, it generates a canvas based on the form
parameters, as well as a random seed.
The code of the canvas and the demo is available on <a href="https://github.com/antoinevastel/picasso-like-canvas-fingerprinting">Github</a>.
Note that in addition to the four primitives used in the original Picasso paper,
I also added an ellipse primitive.

<div class="container-fluid">
    <div class="row">
        <div class="col"></div>
        <div class="col-10">
            <form>
                <h2>Canvas parameters</h2>
                <div class="form-group row">
                    <label for="numshapes" class="col-sm-2 col-form-label">Number of rounds</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="numshapes" value="5" min="1">
                    </div>

                    <label for="seed" class="col-sm-2 col-form-label">Seed</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="seed" value="42" min="1">
                    </div>


                </div>
                <div class="form-group row">
                    <label for="widtharea" class="col-sm-2 col-form-label">Canvas width</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="widtharea" value="300" min="1">
                    </div>

                    <label for="heightarea" class="col-sm-2 col-form-label">Canvas height</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="heightarea" value="300" min="1">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="offsetParameter" class="col-sm-2 col-form-label">Offset</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="offsetParameter"
                               value="2001000001" min="1" step="10000">
                    </div>

                    <label for="multiplier" class="col-sm-2 col-form-label">Multiplier</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="multiplier"
                               value="15000" min="1" step="100">
                    </div>
                </div>

                <div class="form-group row">
                    <label for="fontSizeFactor" class="col-sm-2 col-form-label">Font size scale factor</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="fontSizeFactor" step="0.1"
                               value="1.5" min="0.1">
                    </div>

                    <label for="maxShadowBlur" class="col-sm-2 col-form-label">Max shadow blur</label>
                    <div class="col-sm-2">
                        <input type="number" class="form-control" id="maxShadowBlur" step="1"
                               value="50" min="1">
                    </div>
                </div>

                <button id="canvasbtn" type="submit" class="btn btn-primary mb-2">Generate canvas</button>

            </form>

            <div style="text-align:center;" id="canvasgenerated"></div>
        </div>
        <div class="col"></div>
    </div>
</div>

<script src='/assets/js/picasso_canvas.js'></script>
