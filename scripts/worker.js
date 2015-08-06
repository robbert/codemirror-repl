window.addEventListener("DOMContentLoaded", function () {
    var geval = eval;

    var repl = new CodeMirrorREPL("repl", {
        mode: "javascript",
        theme: "eclipse"
    });

	function printValue(value)
	{
		console.log(value)
		repl.print(String(value))
	}

	function printError(value)
	{
		repl.print(String(value), 'error')
	}

	repl.eval = function (code) {
		
		workerEval(code)
			.then(
				printValue,
				printError
			)
	}

	// Allow starting the worker with an expression, e.g.:
	// worker.html#typeof importScripts
	var code = location.hash.substring(1)
	if (code)
		repl.eval(code)

}, false)