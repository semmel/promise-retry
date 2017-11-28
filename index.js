/* jshint unused: vars */

(function (root, factory)
{
	if (typeof define === 'function' && define.amd)
	{
		define(['ramda'], factory);
	}
	else if (typeof module === 'object' && module.exports)
	{
		module.exports = factory(require('ramda'));
	}
	else
	{
		// Browser globals (root is window)
		root.retryPromise = factory(root.R);
	}
}(typeof self !== 'undefined' ? self : this, function (R)
{
	// Helper functions //
	const
	/**
		 *
		 * @param {Number} milliseconds
		 * @return {Promise}
		 */
		delay = function(milliseconds)
		{
			return new Promise(function(resolve)
				{
					setTimeout(resolve, milliseconds);
				}
			);
		};
	
	const retry = R.curry(
		/**
		 *
		 * @param {Object} settings
		 * @param {Number|function({error: Error, retriesDone: Number}): Number} settings.delay
		 * @param {Number} settings.retries
		 * @param {function(Error): Boolean} [settings.isRetryable]
		 * @param {function(...*): Promise} creator
		 * @return {function(...*): Promise}
		 */
		function promiseRetry(settings, creator)
		{
			if (!settings || typeof settings.retries !== 'number')
			{
				throw new Error("settings.retries must be a number");
			}
			
			const
				getDelay = typeof settings.delay === 'function' ?
					settings.delay :
					function ()
					{
						return settings.delay || 0;
					},
			
				shouldContinue = typeof settings.isRetryable === 'function' ?
					settings.isRetryable :
					function(error)
					{
						return true;
					};
			
			return function beginInvoking()
			{
				const args = arguments;
				
				var failureCount = 0;
				
				const tryCreating = function()
				{
					return creator.apply(undefined, args)
					.catch(function(error)
					{
						failureCount++;
						if (failureCount > settings.retries || !shouldContinue(error))
						{
							throw error;
						}
						
						return delay(getDelay({error: error, retriesDone: failureCount}))
						.then(tryCreating);
					});
				};
				
				return tryCreating();
			};
		}
	);
	
	return retry;
	
}));

