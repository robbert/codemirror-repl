void function ()
{
    /** @typedef {{ id: number, callee: string, arguments: Array }} */
    var RemoteCall;

    function toArray(arg)
    {
        var i = 0, l = arg.length, r = Array(l);
        for(; i < l; i++)
            r[i] = arg[i];
        return r;
    };

    var isWebWorker = typeof importScripts == "function"
                   && typeof window == "undefined"
                   && typeof self != "undefined"

    if (isWebWorker)
    {
        onmessage = function (evt) {

            if (isCall("eval", evt.data))
            {
                returnValue(evt.data, function () {
                    return eval(evt.data.arguments[0]);
                });
            }
        };

        /**
         * @param {string} fn
         * @param {RemoteCall|*} msg
         * @return {boolean}
         */
        function isCall(fn, msg)
        {
            return typeof msg === "object"
                && msg
                && typeof msg.id === "number"
                && msg.callee === fn
                && Array.isArray(msg.arguments)
        }

        function returnValue(msg, result)
        {
            var error;

            if (typeof result === "function")
            {
                try
                {
                    result = result();
                }
                catch (e)
                {
                    result = undefined;
                    error = e;
                }
            }

            postMessage({
                id: msg.id,
                value: result,
                error: error
            });
        }
        function returnError(msg, result)
        {
            postMessage({
                id: msg.id,
                value: undefined,
                error: result
            });
        }
    }
    else if (typeof Worker === "function")
    {
        var worker = new Worker("scripts/worker-communication.js");

        var id = 0;

        var promises = [];

        workerEval = function ()
        {
            var deferred;

            var promise = new Promise(function (resolve, reject) {
                deferred = {
                    resolve: resolve,
                    reject: reject,
                    promise: this
                }
            });

            promises[id] = deferred;

            /** @type {RemoteCall} */
            var call = {
                id: id,
                callee: "eval",
                arguments: toArray(arguments)
            };

            worker.postMessage(call);

            id++;

            return promise;
        }

        worker.onmessage = function (evt)
        {
            if (isReturnValue(evt.data))
            {
                var msg = evt.data;

                var deferred = promises[msg.id];
                if (deferred)
                {
                    promises[msg.id] = undefined;
                    deferred.resolve(msg.value);
                }
            }
        }

        function isReturnValue(msg)
        {
            return typeof msg === "object"
                && msg
                && typeof msg.id === "number"
                && "value" in msg;
        }
    }
}();