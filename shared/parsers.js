export function parseInt(value) {
	const num = Number(value);

	if (isNaN(num)) {
		throw new Error(`Invalid number: ${value}`);
	}

	return num;
}

export function parseUrl(value) {
	try {
		return new URL(value);
	} catch (error) {
		throw new Error(`Invalid URL: ${value}`);
	}
}
