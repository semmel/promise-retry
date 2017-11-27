/**
 * promise-retry: demo.js
 *
 * Created by Matthias Seemann on 27.11.2017.
 */

var N = 3;
function resolvesTheNthTime(value) {
  if (N--) {
    return Promise.reject(new Error('nope'));
  } else {
    return Promise.resolve(value);
  }
}

var retryIt = PromiseRetry.retry({ retries: 5, delay: 500 }, resolvesTheNthTime);

await retryIt("My nice value");
// ~> "My nice value"
N = 5;
5
await retryIt("My nice value");
// ~> "My nice value"
N = 10;
await retryIt("My nice value");
// !~> Error: nope