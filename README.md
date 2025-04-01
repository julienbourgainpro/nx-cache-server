# Nx Custom Self-Hosted Remote Cache Server

A Deno-based server implementation of the Nx Custom Self-Hosted Remote Cache
specification ([RFC](https://github.com/nrwl/nx/discussions/30548)). This server
provides a caching layer for Nx build outputs using Amazon S3 as the storage
backend.

> **Note:** This is a work in progress and the API is not yet stable. Finalizing
> the API will be done then the
> [RFC](https://github.com/nrwl/nx/discussions/30548) is accepted.

## Features

- Implements the Nx custom remote cache specification
- Uses Amazon S3 for storage
- Secure authentication using Bearer tokens
- Efficient file streaming

## Prerequisites

- [Deno](https://deno.land/) installed on your system
- S3 compatible storage

## Environment Variables

The following environment variables are required:

```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
S3_ENDPOINT_URL=your-s3-endpoint-url
NX_CACHE_ACCESS_TOKEN=your-secure-token
PORT=3000  # Optional, defaults to 3000
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd nx-cloud
```

2. Run docker compose to start the MinIO server:

```bash
docker compose up -d
```

## Running the Server

Start the server with:

```bash
deno task start
```

## Testing

Run the tests with:

```bash
deno task test
```

> **Note:** The tests assume that the MinIO server is running and that the
> `nx-cloud` bucket exists. Be sure to run `docker compose up -d` before running
> the tests.

## License

MIT
