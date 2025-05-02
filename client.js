export function getGraphQLURL(config) {
	const { url, graphqlPath } = config;

	try {
		return new URL(graphqlPath, url);
	} catch (error) {
		throw new Error("Error creating GraphQL URL:", error);
	}
}

/**
 * @description Function to get the GraphQL Request to Read the cache headers
 * @param {URL} url - The URL to make the request to
 * @returns {Promise<Response>} - The response object from the GraphQL request
 */
export async function makeGraphQLRequest(url) {
	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
			Agent: "WPESmartCacheTest/0.1",
			// "X-WPE-No-Cache": "Cause I can", // Uncomment to disable caching on EverCache, this only works with EFPC disabled
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}; ${response.statusText}`);
	}

	return response;
}
