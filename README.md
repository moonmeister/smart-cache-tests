# Smart Cache Tests

This project is a tool for testing and benchmarking caching mechanisms, specifically focusing on HTTP caching headers like `Cache-Control`, `s-maxage`, and `max-age`. It evaluates caching behavior across different layers, such as Cloudflare and Varnish, and logs the results for analysis.

## Overview

Smart Cache Tests automates the process of sending requests to a specified endpoint, analyzing caching headers, and logging metrics like TTL (Time-to-Live), cache hit/miss status, and age. This helps developers understand and optimize caching strategies for their applications.

## Features

- **Cache Header Analysis**: Extracts and prioritizes `s-maxage` and `max-age` values from `Cache-Control` headers.
- **Multi-Layer Cache Support**: Tracks caching behavior for Cloudflare and Varnish.
- **CSV Logging**: Logs results in CSV format for easy analysis.
- **Configurable Runtime**: Adjust runtime and request intervals via environment variables.
- **Real-Time Metrics**: Outputs cache status and TTL information during execution.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/moonmeister/smart-cache-tests.git
   cd smart-cache-tests
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory:
     ```ini
     WORDPRESS_URL=https://your-wordpress-site.com
     RUN_TIME=30
     INTERVAL=5
     ```

## Usage

### Running the Tests

To start the cache tests, run:

```bash
pnpm start
```

### Development Mode

For live reloading during development, use:

```bash
pnpm dev
```

### Output

- Logs are saved in the `logs/` directory as CSV files.
- Each log file is named with a timestamp and the target host.

## Configuration

You can configure the following environment variables:

- `WORDPRESS_URL`: The base URL of the WordPress site to test.
- `RUN_TIME`: Total runtime for the test in seconds (default: `Infinity`).
- `INTERVAL`: Interval between requests in seconds (default: `1`).

## Example Log Output

A sample CSV log file:

```csv
ATTEMPT,TIME_STAMP,VARNISH_STATUS,VARNISH_TTL,VARNISH_AGE,CLOUDFLARE_STATUS,CLOUDFLARE_TTL,CLOUDFLARE_AGE
1,2025-05-01T20:40:22.089Z,HIT: 1,600,NaN,HIT,600,529
2,2025-05-01T20:40:27.175Z,HIT: 1,600,NaN,HIT,600,534
```

## Development

### Code Structure

- **`index.js`**: Main script for running the tests.
- **Environment Variables**: Configured via `.env` or `.env.development`.
- **Logs**: Stored in the `logs/` directory.

### Scripts

- `pnpm start`: Runs the tests with production settings.
- `pnpm dev`: Runs the tests in development mode with live reloading.

## License

This project is licensed under the BSD Zero Clause License. See the `LICENSE` file for details.
