import { Option, Command } from "commander";
import { GRAPHQL_PATH } from "./shared/constants.js";
import packageInfo from "./package.json" with { type: "json" };
import infoAction from "./actions/info.js";
import logAction from "./actions/log.js";
import { parseUrl, parseInt } from "./shared/parsers.js";

const program = new Command(packageInfo.name)
	.version(packageInfo.version)
	.description("WordPress GraphQL Smart Cache Test for WPEngine Managed WordPress Hosting.")
	.addOption(
		new Option("-u, --url <url>", "WordPress URL")
			.argParser(parseUrl)
			.env("WORDPRESS_URL")
			.makeOptionMandatory(),
	)
	.addOption(
		new Option("-g, --graphql-path <endpoint>", "GraphQL URI")
			.default(GRAPHQL_PATH)
			.env("GRAPHQL_PATH"),
	)
	.addCommand(
		new Command("log")
			.description("Logs the current caching configuration of your WPGraphQL endpoint over time.")
			.addOption(
				new Option("-r, --run-time <seconds>", "Run time in seconds")
					.argParser((value) => {
						const num = parseInt(value);
						if (num <= 0) {
							return Infinity;
						}
						return num;
					})
					.default(60)
					.env("RUN_TIME"),
			)
			.addOption(
				new Option("-i, --interval <seconds>", "Interval between requests in seconds")
					.argParser((value) => {
						const num = parseInt(value);
						if (num < 1) {
							return 1;
						}
						return num;
					})
					.default(5)
					.env("INTERVAL"),
			)
			.addOption(
				new Option("-l, --log-folder <folder>", "Log folder path")
					.default("./logs")
					.env("LOG_FOLDER"),
			)
			.action(logAction),
	)
	.addCommand(
		new Command("info")
			.description("Provides info on the current caching configuration of your WPGraphQL endpoint.")
			.action(infoAction),
	);

program.parseAsync();
