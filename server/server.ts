import Fastify from 'fastify';

import items from './items.json' with { type: 'json' };
import { Item } from './types.ts';
import { ItemsGetInQuerySchema, ItemUpdateInSchema } from './validation.ts';
import { treeifyError, ZodError } from 'zod';
import { doesItemNeedRevision } from './utils.ts';

const ITEMS = items as Item[];

const getPortFromArgs = (): number | undefined => {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--port=')) {
      const parsed = Number(arg.slice('--port='.length));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  const portIndex = process.argv.findIndex(arg => arg === '--port');
  if (portIndex !== -1) {
    const nextArg = process.argv[portIndex + 1];
    const parsed = Number(nextArg);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const fastify = Fastify({
  logger: true,
});

await fastify.register((await import('@fastify/middie')).default);

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
);

// CORS with configurable allowlist for local and docker usage.
fastify.use((request, reply, next) => {
  const origin = request.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    reply.setHeader('Access-Control-Allow-Origin', origin);
    reply.setHeader('Vary', 'Origin');
  }

  reply.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  reply.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    reply.statusCode = 204;
    reply.end();
    return;
  }

  next();
});

interface ItemGetRequest extends Fastify.RequestGenericInterface {
  Params: {
    id: string;
  };
}

fastify.get<ItemGetRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id);

  if (!Number.isFinite(itemId)) {
    reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' });
    return;
  }

  const item = ITEMS.find(item => item.id === itemId);

  if (!item) {
    reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" });
    return;
  }

  return {
    ...item,
    needsRevision: doesItemNeedRevision(item),
  };
});

interface ItemsGetRequest extends Fastify.RequestGenericInterface {
  Querystring: {
    q?: string;
    limit?: string;
    skip?: string;
    categories?: string;
    needsRevision?: string;
  };
}

fastify.get<ItemsGetRequest>('/items', request => {
  const {
    q,
    limit,
    skip,
    needsRevision,
    categories,
    sortColumn,
    sortDirection,
  } = ItemsGetInQuerySchema.parse(request.query);

  const filteredItems = ITEMS.filter(item => {
    return (
      item.title.toLowerCase().includes(q.toLowerCase()) &&
      (!needsRevision || doesItemNeedRevision(item)) &&
      (!categories?.length ||
        categories.some(category => item.category === category))
    );
  });

  return {
    items: filteredItems
      .toSorted((item1, item2) => {
        let comparisonValue = 0;

        if (!sortDirection) return comparisonValue;

        if (sortColumn === 'title') {
          comparisonValue = item1.title.localeCompare(item2.title);
        } else if (sortColumn === 'createdAt') {
          comparisonValue =
            new Date(item1.createdAt).valueOf() -
            new Date(item2.createdAt).valueOf();
        }

        return (sortDirection === 'desc' ? -1 : 1) * comparisonValue;
      })
      .slice(skip, skip + limit)
      .map(item => ({
        id: item.id,
        category: item.category,
        title: item.title,
        price: item.price,
        needsRevision: doesItemNeedRevision(item),
      })),
    total: filteredItems.length,
  };
});

interface ItemUpdateRequest extends Fastify.RequestGenericInterface {
  Params: {
    id: string;
  };
}

fastify.put<ItemUpdateRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id);

  if (!Number.isFinite(itemId)) {
    reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' });
    return;
  }

  const itemIndex = ITEMS.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" });
    return;
  }

  try {
    const parsedData = ItemUpdateInSchema.parse({
      category: ITEMS[itemIndex].category,
      ...(request.body as {}),
    });

    ITEMS[itemIndex] = {
      id: ITEMS[itemIndex].id,
      createdAt: ITEMS[itemIndex].createdAt,
      updatedAt: new Date().toISOString(),
      ...parsedData,
    };

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      reply.status(400).send({ success: false, error: treeifyError(error) });
      return;
    }

    throw error;
  }
});

const cliPort = getPortFromArgs();
const envPort = Number(process.env.PORT);
const port = cliPort ?? (Number.isFinite(envPort) ? envPort : 8080);
const host = process.env.HOST ?? '0.0.0.0';

fastify.listen({ host, port }, function (err, _address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.debug(`Server is listening on port ${port}`);
});
