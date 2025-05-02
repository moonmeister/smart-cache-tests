import { getCacheHeaderFactory, headerValueFactory, headerExistsFactory } from "./info.js";

/**
 * @description Array of services
 * @type {import("./info.js").Service[]}
 */
export const services = [
	{
		name: "WPGraphQL Smart Cache",
		service: "WordPress",
		layer: "Application",
		getEnabled: headerExistsFactory("x-graphql-keys"),
		getStatus: undefined,
		getCacheHeader: getCacheHeaderFactory("x-orig-cache-control"),
		getAGE: undefined,
	},
	{
		name: "Page Cache",
		service: "Varnish",
		layer: "Server",
		getEnabled: (response) => !response.headers.get("x-cacheable").includes("NO"),
		getStatus: [
			headerValueFactory("x-cache"),
			(response) => `${response.headers.get("x-cacheable")}:${response.headers.get("x-pass-why")}`,
		],
		getCacheHeader: getCacheHeaderFactory("Cache-Control"),
		getAGE: undefined,
	},
	{
		name: "Edge Full Page Cache",
		service: "GES | Advanced Network (Cloudflare)",
		layer: "Edge",
		getEnabled: (response) => response.headers.get("cf-cache-status") !== "DYNAMIC",
		getStatus: headerValueFactory("cf-cache-status"),
		getCacheHeader: getCacheHeaderFactory(
			"Cloudflare-CDN-Cache-Control",
			"CDN-Cache-Control",
			"Cache-Control"
		),
		getAGE: (response) => Number(response.headers.get("age") || 0),
	},
];
