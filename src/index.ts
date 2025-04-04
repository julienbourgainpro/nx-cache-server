import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { logger } from 'hono/logger';

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const app = new Hono<{
  Bindings: {
    NX_CACHE_ACCESS_TOKEN: string;
    AWS_REGION: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    S3_BUCKET_NAME: string;
    S3_ENDPOINT_URL: string;
  };
  Variables: {
    s3: S3Client;
  };
}>();

app.use(async (c, next) => {
  c.set(
    's3',
    new S3Client({
      region: c.env.AWS_REGION,
      endpoint: c.env.S3_ENDPOINT_URL,
      credentials: {
        accessKeyId: c.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    }),
  );

  await next();
});

const auth = () =>
  createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const token = authHeader.split(' ')[1];

    if (token !== c.env.NX_CACHE_ACCESS_TOKEN) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await next();
  });

app.use(auth());
app.use(logger());

app.put('/v1/cache/:hash', async (c) => {
  try {
    const hash = c.req.param('hash');

    try {
      await c.get('s3').send(
        new GetObjectCommand({
          Bucket: c.env.S3_BUCKET_NAME,
          Key: hash,
        }),
      );
      return c.json({ error: 'Cache entry already exists' }, 409);
    } catch (_error: unknown) {
      // Object doesn't exist, proceed with upload
    }

    const body = await c.req.arrayBuffer();

    await c.get('s3').send(
      new PutObjectCommand({
        Bucket: c.env.S3_BUCKET_NAME,
        Key: hash,
        Body: new Uint8Array(body),
      }),
    );

    return c.json({ message: 'Successfully uploaded' }, 202);
  } catch (error: unknown) {
    console.error('Upload error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/v1/cache/:hash', async (c) => {
  try {
    const hash = c.req.param('hash');

    const command = new GetObjectCommand({
      Bucket: c.env.S3_BUCKET_NAME,
      Key: hash,
    });

    const url = await getSignedUrl(c.get('s3'), command, {
      expiresIn: 18000,
    });

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Download error:', response.statusText);

      await response.body?.cancel();

      return Response.json(
        { error: response.statusText },
        { status: response.status },
      );
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return c.json({ error: 'Not Found' }, 404);
    }
    console.error('Download error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

if (import.meta.main) {
  const port = parseInt(Deno.env.get('PORT') || '3000');
  console.log(`Server running on port ${port}`);

  Deno.serve({ port }, (req) =>
    app.fetch(req, {
      NX_CACHE_ACCESS_TOKEN: Deno.env.get('NX_CACHE_ACCESS_TOKEN'),
      AWS_REGION: Deno.env.get('AWS_REGION') || 'us-east-1',
      AWS_ACCESS_KEY_ID: Deno.env.get('AWS_ACCESS_KEY_ID'),
      AWS_SECRET_ACCESS_KEY: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
      S3_BUCKET_NAME: Deno.env.get('S3_BUCKET_NAME') || 'nx-cloud',
      S3_ENDPOINT_URL: Deno.env.get('S3_ENDPOINT_URL'),
    }));
}
