# promise-retry

Retry a function until its returned promise succeeds. 

The api is like [Bacon.retry](http://baconjs.github.io/api.html#bacon-retry) except that here a promise with just a single final value is returned instead of creating an event stream. 

```js
var R = require('ramda');
var retryPromise = require('promise-retry');
var retryTwiceEveryHundredMil = retryPromise({ retries: 2, delay: 100 });

var calls = 0;
function resolvesTheForthTime() {
  if (++calls < 4) {
    return Promise.reject(new Error('nope'));
  } else {
    return Promise.resolve('yay!');
  }
}

var tryFnTwiceEveryHundredMil = retryTwiceEveryHundredMil(resolvesTheForthTime);

tryFnTwiceEveryHundredMil()
  .then(function(result){
    // never called here,
    // but if `retries` was >= 3,
    // result would be === 'yay!'
    console.log("success with " + result);
  }).catch(function(err){
    // err instanceof Error === true
    // err.message === 'nope'
    console.error("failed with " + err.message);
  });

// do it again (i.e. tries no. 3, 4 and 5)
tryFnTwiceEveryHundredMil()
.then(function(result){
    // result  === 'yay!'
  },
  function(error)
  {
  	// never reached
  });
```

## Options

`retries`: positive (>= 0) number. The initial call doesn't count as a retry. If you set it to `3`, then your function might be called up to 4 times.

`delay`: the delay between retries or a `function(context){}` returning the delay. Does not apply on initial call. If a function is passed, it will receive a context object with the retry index as `retriesDone` field (`1, 2, 3 ...`) and the current error object as `error` field.

`isRetryable`: a function returning true to continue retrying, false to stop. Defaults to true. The error that occurred is given as a parameter. For example, there is usually no reason to retry a 404 HTTP error, whereas a 500 or a timeout might work on the next attempt.


### Example:

see also [demo.js](demo.js)

```js
var retryWithIncreasingDelay = retryPromise({ retries: 10, delay: function(retryIndex) {
    return 100 * retryIndex;
});

/* time line:

0 > initial fail
0 + 100 > first retry
100 + 200 > second retry
300 + 300 > third retry
600 + 400 > fourth...

```

## Composition

As `promise-retry` input and output is a function returning a promise, you can compose them easily:

```js
var retryTwice = retryPromise({ retries: 2 });
var retryOnceAfterTwoSeconds = retryPromise({ retries: 1, delay: 2000 });
var getRejected = function(){
  return Promise.reject('nope');
};

retryOnceAfterTwoSeconds(retryTwice(getRejected))().then(function(){
  // no way here
}).catch(function(){
  // at this point, `getRejected` will have been called 6 times
});
```

In the above exemple, the `getRejected`, this will happen:

1. Initial nest retry call
  1. initial `getRejected` call - callcount: 1
  1. first of two retries - callcount: 2
  1. second of two retries - callcount: 3
1. wait 2000ms
1. first and only retry
  1. initial `getRejected` call - callcount: 4
  1. first of two retries - callcount: 5
  1. second of two retries - callcount: 6
1. final rejection

# See also

`promise-retry` composes really well with the following promise helper:

* [`promise-timeout`](https://github.com/songkick/promise-timeout):
