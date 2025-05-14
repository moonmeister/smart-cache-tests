import { Command } from "commander";

function log(options, command) {
	const { runTime, interval, logFolder } = options;
	console.log("Logging caching configuration...");
	console.log(`Run time: ${runTime} seconds`);
	console.log(`Interval: ${interval} seconds`);
	console.log(`Log folder: ${logFolder}`);
}

export default new Command("log")
	.description("Logs the current caching configuration of your WPGraphQL endpoint over time.")
	.option("-r, --run-time <seconds>", "Run time in seconds", 60)
	.option("-i, --interval <seconds>", "Interval between requests in seconds", 5)
	.option("-l, --log-folder <folder>", "Log folder path", "./logs")
	.action(log);
