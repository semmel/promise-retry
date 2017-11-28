/**
 * promise-retry: demo.js
 *
 * Created by Matthias Seemann on 27.11.2017.
 */

const ErrorKind = {
	SEVERE: Symbol('severe'),
	REGULAR: Symbol('regular'),
	FATAL : Symbol('fatal')
};

const workerResolvesWith4thCall = (function(){
    var count = 0;
    const worker = function(value){
        count++;
		console.log("call #" + count);
		var error = new Error("failure");
        error.kind = (count <= 2) ? ErrorKind.REGULAR : ErrorKind.SEVERE;
        return (count >= 4) ? Promise.resolve(value) : Promise.reject(error);
    };
	worker.rearm = function(){ count = 0; };
	return worker;
}());

var try4TimesUnlessFatalError = retryPromise({
	retries: 3,
	delay: 100,
	isRetryable: error => error.kind !== ErrorKind.FATAL
});

var assert = function(condition, message)
{
	console.log((condition ? '<Ok> ' : '<failed> ') + (message || ''));
};

async function demo()
{
	var try4TimesUnlessFatalErrorTestWorker = try4TimesUnlessFatalError(workerResolvesWith4thCall);

	assert(await try4TimesUnlessFatalErrorTestWorker("success") === "success");
	
	workerResolvesWith4thCall.rearm();
	
	assert(await try4TimesUnlessFatalErrorTestWorker("success too") === "success too");
	
	workerResolvesWith4thCall.rearm();
	
	var tryTwice = retryPromise({
		retries: 1,
		delay: 100
	});
	
	var tryTwiceTestWorker = tryTwice(workerResolvesWith4thCall);
	
	try {
		await tryTwiceTestWorker("never seen"); // !~> Error: failure
	}
	catch(error)
	{
		assert(error.kind === ErrorKind.REGULAR, "aborts retrying after 2nd call");
	}
	
	var try10TimesUnlessSevereError = retryPromise({
		retries: 9,
		delay: ctx => (ctx.retriesDone + 1) * 500,
		isRetryable: error => error.kind !== ErrorKind.SEVERE
	});
	
	workerResolvesWith4thCall.rearm();
	
	var try10TimesUnlessSevereErrorTestWorker = try10TimesUnlessSevereError(workerResolvesWith4thCall);
	
	try
	{
		await try10TimesUnlessSevereErrorTestWorker("no chance"); // !~> Error: failure
	}
	catch (error)
	{
		assert(error.kind === ErrorKind.SEVERE, "aborts after severe error");
	}
}


