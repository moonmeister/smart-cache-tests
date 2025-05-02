import { Option, Command } from "commander";
import { GRAPHQL_PATH } from "./constants.js";
import packageInfo from "./package.json" with { type: "json"};
import { getInfo } from "./info.js";
import { styleText } from 'node:util';

const program = new Command(packageInfo.name)
	.version(packageInfo.version)
	.description("WordPress GraphQL Smart Cache Test for WPEngine Managed WordPress Hosting.")
	.addOption(
		new Option("-u, --url <url>", "WordPress URL").env("WORDPRESS_URL").makeOptionMandatory())
	.addOption(
		new Option("-g, --graphql-path <endpoint>", "GraphQL URI").default(GRAPHQL_PATH).env("GRAPHQL_PATH")
	).action(() => {
			program.outputHelp()
		}
	)
	.addCommand(new Command("info")
		.description("Provides info on the current caching configuration of your WPGraphQL endpoint.")
		.action(async () => {
			const info = await getInfo(program.opts())

			// console.table({
			// 	"WordPress URL": info.url.origin + info.url.pathname,
			// 	TimeStamp: new Date(info.time_stamp).toUTCString(),

			// })
			const headingFormat = ["bold", "blue"];
			console.log("");
			console.log("------------------------------------");

			console.log(styleText(["bold", "blue"], "WordPress URL: "), info.url.origin + info.url.pathname);
			console.log(styleText(["bold", "blue"], "TimeStamp: "), new Date(info.time_stamp).toUTCString());
			console.log("------------------------------------");

			console.table(info.data,["service", "layer", "enabled", "cache_header", "ttl"] );
			console.log("");


		})
	)
// .option("-r, --run-time <seconds>", "Run time in seconds", env.RUN_TIME)
// .option("-i, --interval <seconds>", "Interval between requests in seconds", env.INTERVAL)
// .option("-l, --log-folder <folder>", "Log folder path", env.LOG_FOLDER);

program.parseAsync();

