import { env } from "node:process";
import { performance } from "node:perf_hooks";
import { interval, intervalToDuration } from "date-fns";
import { appendFile, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { GRAPHQL_PATH } from "./constants.js";
import { makeGraphQLRequest } from "./client.js";

const GRAPHQL_URL = new URL(GRAPHQL_PATH, env.WORDPRESS_URL);
const LOG_FILE = `${new Date().toISOString()}_${GRAPHQL_URL.host.replaceAll(
	".",
	"-"
)}_cache-test.csv`;
const LOG_FOLDER = env.LOG_FOLDER || "./logs";
const RUN_TIME = Number(env.RUN_TIME) <= 0 ? Infinity : Number(env.RUN_TIME); // seconds
const INTERVAL = Number(env.INTERVAL) <= 0 ? 1 : Number(env.INTERVAL); // seconds
const start_time = performance.now();

let last_hit_count = 1;
let last_hit_count_reset_handled = false;
let last_hit_count_reset_time;

const GET_MAX_AGE = /s-maxage=(?<s_ttl>\d+)|max-age=(?!.*s-maxage)(?<m_ttl>\d+)/;
const GET_HIT = /(?<hit>\d+)/;

function getCFCacheHeader(headers) {
	return (
		headers.get("Cloudflare-CDN-Cache-Control") ??
		headers.get("CDN-Cache-Control") ??
		headers.get("Cache-Control")
	);
}

function getTTL(header) {
	if (!header) {
		return undefined;
	}
	const ttl = header.match(GET_MAX_AGE);

	return Number(ttl?.groups?.s_ttl || ttl?.groups?.m_ttl) || 0;
}

function timeElapsed() {
	const elapsed = performance.now() - start_time;
	return Math.floor(elapsed / 1000);
}

function objectKeysToCsvHeaders(data, prefix = "") {
	const csvHeaders = Object.keys(data).map((key) => {
		if (typeof data[key] === "object") {
			return objectKeysToCsvHeaders(data[key], `${prefix}${key}_`);
		}
		return (prefix + key).toUpperCase();
	});

	return csvHeaders.join(",");
}

function objectValuesToCsvData(data) {
	const csvData = Object.values(data).map((value) => {
		if (typeof value === "object") {
			return objectValuesToCsvData(value);
		}
		return value;
	});

	return csvData.join(",");
}

async function logDataToFs(data) {
	const csvData = objectValuesToCsvData(data) + "\n";

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

function trackVarnishTTL(response) {
	const varnishStatus = response.headers.get("x-cache");
	const curr_hit_count = Number(response.headers.get("x-cache").match(GET_HIT)?.groups?.hit) || 0;

	if (
		!last_hit_count_reset_handled &&
		(varnishStatus === "MISS" || curr_hit_count < last_hit_count)
	) {
		last_hit_count_reset_handled = true;
		last_hit_count_reset_time = Date.now();
	}

	last_hit_count = curr_hit_count;

	if (last_hit_count_reset_handled && varnishStatus !== "MISS") {
		last_hit_count_reset_handled = false;
	}
}

function timeSinceLastHit(response) {
	if (!last_hit_count_reset_time) {
		// const CF_TTL = getTTL(getCFCacheHeader(response.headers));
		// const V_HIT_COUNT = Number(response.headers.get("x-cache").match(GET_HIT)?.groups?.hit) || 0;

		// let estimated_time = CF_TTL * V_HIT_COUNT;

		return NaN;
	}

	const timeSince =
		intervalToDuration(interval(Date.now(), new Date(last_hit_count_reset_time))).seconds ?? 0;

	return Math.abs(timeSince);
}

export async function checkResponse() {
	const response = await makeGraphQLRequest(GRAPHQL_URL);

	// console.log("Response Headers:", response.headers);

	trackVarnishTTL(response);

	const isWPGQLSCEnabled = response.headers.has("x-graphql-keys");
	const isECEnabled = !response.headers.get("x-cacheable").includes("NO");
	const isANEnabled = response.headers.has("cf-cache-status");
	const isEFPCEnabled = isANEnabled && response.headers.get("cf-cache-status") !== "DYNAMIC";

	return {
		time_stamp: new Date().toISOString(),
		data: {
			"WPGraphQL Smart Cache": {
				Service: "WordPress",
				Layer: "Application",
				Enabled: isWPGQLSCEnabled,
				Status: "--",
				TTL: getTTL(response.headers.get("x-orig-cache-control")),
				AGE: "--",
			},
			"EverCache®": {
				Service: "Varnish",
				Layer: "Server",
				Enabled: isECEnabled,
				Status: isECEnabled
					? response.headers.get("x-cache")
					: `${response.headers.get("x-cacheable")}:${response.headers.get("x-pass-why")}`,
				TTL: isECEnabled ? getTTL(response.headers.get("Cache-Control")) : "--",
				AGE: isECEnabled ? timeSinceLastHit(response) : "--",
			},
			"Edge Full Page Cache": {
				Service: isANEnabled ? "Advanced Network (Cloudflare)" : "None",
				Layer: "Edge",
				Enabled: isEFPCEnabled,
				Status: isANEnabled ? response.headers.get("cf-cache-status") : "--",
				TTL: isEFPCEnabled ? getTTL(getCFCacheHeader(response.headers)) : "--",
				AGE: isEFPCEnabled ? Number(response.headers.get("age")) || 0 : "--",
			},
		},
	};
}

async function main() {
	console.info("Starting cache testing...");
	while (timeElapsed() < RUN_TIME) {
		const { data, ...results } = await checkResponse();

		console.table(data);

		await logDataToFs({ ...results, ...data });
		await new Promise((resolve) => setTimeout(resolve, INTERVAL * 1000));
	}

	console.info("Load test completed.");
}

await main();
