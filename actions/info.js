import { getGraphQLURL, makeGraphQLRequest } from "../shared/client.js";
import { GET_TTL } from "../shared/constants.js";
import { services } from "../providers/wpengine.js";
import { styleText } from "node:util";
/**
 *
 * @param {Header} header
 * @returns number - returns the TTL value in seconds or 0 if not set
 *
 */
function parseTTL(header) {
	if (!header) return undefined;

	const ttl = header.value.match(GET_TTL);

	return Number(ttl?.groups?.s_ttl || ttl?.groups?.m_ttl) || 0;
}

/**
 * @typedef {object} Header
 * @property {string} [value] - The value of the header
 * @property {string} name - The name of the header
 *
 * @param {PossibleValue} [header] - The value of the header
 * @returns {boolean} - True if the header is a valid header object
 * @description Check if the header is a valid header object
 */
function isHeader(header) {
	return Boolean(header && typeof header === "object" && "name" in header);
}

/**
 * @description Function to get the header value
 * @param {string[]} names - The name of the header
 * @returns {(response: Response) => Header} - The function to get the header value
 */
export function getCacheHeaderFactory(...names) {
	return (response) => {
		for (const name of names) {
			if (response.headers.has(name)) {
				return { name, value: response.headers.get(name) };
			}
		}
	};
}

/**
 * @description Function to get the header value
 * @param {string} name - The name of the header
 * @returns {(response: Response) => string} - The function to get the header value
 */
export function headerValueFactory(name) {
	return (response) => response.headers.get(name);
}

/**
 * @description Function to check if the header exists
 * @param {string} name - The name of the header
 * @returns {(response: Response) => boolean} - The function to check if the header exists
 */
export function headerExistsFactory(name) {
	return (response) => response.headers.has(name);
}

/**
 * @typedef {string|number|undefined|Header} PossibleValue
 * @typedef {(response?: Response | Header) => PossibleValue} PossibleValueFn
 *
 * @description Function to get the value if the service is enabled
 * @param {[PossibleValue|PossibleValueFn, PossibleValue|PossibleValueFn]} args - The arguments to pass to the function
 *
 * @returns {GetIfEnabled} - The value or undefined if not enabled
 */
// @ts-ignore
export function ifEnabled(...args) {
	const options = Array.isArray(args[0]) ? args[0] : args;
	return (data, enabled) =>
		execIfFn(enabled ? execIfFn(options[0], data) : execIfFn(options[1], data), data);
}

/**
 * @description Function to execute the function if it's a function otherwise return the value
 * @param {PossibleValue | PossibleValueFn} fn
 * @param {Response | Header} data
 * @returns {PossibleValue}
 */
const execIfFn = (fn, data) => (typeof fn === "function" ? fn(data) : fn);

/**
 * @description Function to get the time stamp from the response
 * @param {Response} response - The response object from the GraphQL request
 * @returns {string} - The time stamp in ISO format
 *
 */
function getTimeStamp(response) {
	const timeStamp = response.headers.get("date");
	if (!timeStamp) return new Date().toISOString();

	return new Date(timeStamp).toISOString();
}

/**
 *
 * @typedef {(response: Response) => boolean} GetEnabled
 * @description Function to check if the service is enabled
 *
 * @typedef {(response: Response, enabled: boolean) => PossibleValue } GetIfEnabled
 * @description Function Passed
 *
 * @typedef {PossibleValue | PossibleValueFn | PossibleValue[] | PossibleValueFn[]} PossibleValues
 *
 * @typedef {object} Service
 * @property {string} ServiceFactoryConfig.name - Name of the service
 * @property {string} [ServiceFactoryConfig.service] - Function to get the service name
 * @property {string} ServiceFactoryConfig.layer - Layer of the service
 * @property {GetEnabled} config.getEnabled - Function to check if the service is enabled
 * @property {PossibleValues} [ServiceFactoryConfig.getStatus] - Function to get the status of the service
 * @property {PossibleValues} [ServiceFactoryConfig.getAGE] - Function to get the age of the service
 * @property {(response: Response) => Header} [ServiceFactoryConfig.getCacheHeader] - Function to get the cache header of the service
 */

/**
 * @description Function to get the service data
 * @param { Response } response - The response object from the GraphQL request
 * @param { Service } service - The service
 *
 */
function getServiceData(
	response,
	{ name, service, layer, getEnabled, getStatus, getAGE, getCacheHeader },
) {
	const isEnabled = getEnabled ? getEnabled(response) : false;
	const cache_header = ifEnabled(getCacheHeader)(response, isEnabled);

	return {
		name,
		service,
		layer,
		enabled: isEnabled,
		status: ifEnabled(getStatus, "--")(response, isEnabled),
		ttl: isHeader(cache_header) ? parseTTL(cache_header) : "--",
		age: ifEnabled(getAGE, "--")(response, isEnabled),
		cache_header: ifEnabled(getCacheHeader, "--")(response, isEnabled),
	};
}

export async function getInfo(opts) {
	const url = getGraphQLURL(opts);
	const response = await makeGraphQLRequest(url);

	const results = {};

	for (const service of services) {
		const result = getServiceData(response, service);
		results[result.name] = result;
	}

	return {
		time_stamp: getTimeStamp(response),
		url,
		data: results,
	};
}

export default async function (_options, command) {
	const info = await getInfo(command.parent.opts());

	const headingFormat = ["bold", "blue"];
	console.log("");
	console.log("------------------------------------");

	console.log(styleText(headingFormat, "WordPress URL: "), info.url.origin + info.url.pathname);
	console.log(styleText(headingFormat, "TimeStamp: "), new Date(info.time_stamp).toUTCString());
	console.log("------------------------------------");

	console.table(info.data, ["service", "layer", "enabled", "cache_header", "ttl"]);
	console.log("");
}
