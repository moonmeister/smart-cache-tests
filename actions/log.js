import { performance } from "node:perf_hooks";
import { appendFile, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getInfo } from "./info.js";
import { constantCase } from "change-case";
import stringifyObject from "stringify-object";

function objectKeysToCsvHeaders(data, prefix = "") {
	const csvHeaders = Object.keys(data).map((key) => {
		if (typeof data[key] === "object" && key !== "cache_header") {
			return objectKeysToCsvHeaders(
				data[key],
				`${prefix.toLocaleLowerCase()}_${key.toLocaleLowerCase()}`,
			);
		}
		return constantCase(prefix.toLocaleLowerCase() + "_" + key.toLocaleLowerCase());
	});

	return csvHeaders.join(",");
}

function objectValuesToCsvData(data) {
	const csvData = Object.entries(data).map(([key, value]) => {
		if (typeof value === "object" && key == "cache_header") {
			return `"${stringifyObject(value, {
				indent: "",
			}).replaceAll("\n", "")}"`;
		} else if (typeof value === "object") {
			return objectValuesToCsvData(value);
		}
		return value;
	});

	return csvData.join(",");
}

async function logDataToFs(data, LOG_FOLDER, LOG_FILE) {
	const csvData = objectValuesToCsvData([data]) + "\n";

	const log_file_path = join(LOG_FOLDER, LOG_FILE);

	try {
		await stat(log_file_path);

		await appendFile(log_file_path, csvData);
	} catch (error) {
		if (error.code === "ENOENT") {
			await mkdir(LOG_FOLDER, { recursive: true });

			const csvHeaders = objectKeysToCsvHeaders(data) + "\n";

			await appendFile(log_file_path, csvHeaders + csvData);
		}
	}
}

export default async function log(options, command) {
	const { url } = command.parent.opts();
	const { logFolder, interval, runTime } = options;

	const LOG_FILE = `${new Date().toISOString()}_${url.host.replaceAll(".", "-")}_cache-test.csv`;
	const start_time = performance.now();

	console.info("Starting cache testing...");
	while (Math.floor((performance.now() - start_time) / 1000) < runTime) {
		const { data, ...results } = await getInfo(command.parent.opts());

		console.table(data, ["service", "layer", "enabled", "ttl", "status", "age"]);

		await logDataToFs({ ...results, ...data }, logFolder, LOG_FILE);
		await new Promise((resolve) => setTimeout(resolve, interval * 1000));
	}

	console.info("Load test completed.");
}
