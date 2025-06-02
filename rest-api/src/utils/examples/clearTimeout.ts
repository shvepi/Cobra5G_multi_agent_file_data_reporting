/**
 * timeout2 was scheduled to run after 5 seconds, but we clear it before it runs.
 */

function anotherFunction() {
	console.log("another function");
}
const timers: Array<NodeJS.Timeout> = [];

const timeout = setTimeout(() => {
	console.log("timeout done");
	// clear timeout
	timers.forEach((timer) => clearTimeout(timer));

	console.log("doing something else...");
	anotherFunction();
}, 2000);

const timeout2 = setTimeout(() => {
	console.log("timeout2 done");
}, 5000);
timers.push(timeout);
timers.push(timeout2);
