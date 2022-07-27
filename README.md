## CompressionCacheWrapper

[![Tests](https://github.com/kdybicz/apollo-server-compression-cache-wrapper/actions/workflows/tests.yml/badge.svg)](https://github.com/kdybicz/apollo-server-compression-cache-wrapper/actions/workflows/tests.yml)
[![CodeQL](https://github.com/kdybicz/apollo-server-compression-cache-wrapper/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/kdybicz/apollo-server-compression-cache-wrapper/actions/workflows/codeql-analysis.yml)
[![npm version](https://badge.fury.io/js/apollo-server-compression-cache-wrapper.svg)](https://badge.fury.io/js/apollo-server-compression-cache-wrapper)
[![npm downloads](https://img.shields.io/npm/dw/apollo-server-compression-cache-wrapper)](https://www.npmjs.com/package/apollo-server-compression-cache-wrapper)

This package exports an implementation of `KeyValueCache` that allows wrapping any other
[Apollo](https://github.com/apollographql/apollo-server) `KeyValueCache` implementation with a
configurable (default: `zlib deflate`) compression layer. Its main goal is
to limit the amount of memory used by the caching environment and at the same time the amount of
data being in-transit from and to the caching environment.

## Usage

```js
const { RedisCache } = require('apollo-server-cache-redis');
const { CompressionCacheWrapper } = require('apollo-server-compression-cache-wrapper');
const 'zlib' = require('zlib');

const redisCache = new RedisCache({
  host: 'redis-server',
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: new CompressionCacheWrapper(redisCache, {
    compress: (data: Buffer) => zlib.deflateSync(data, { level: 1 }),
    decompress: (data: Buffer) => zlib.inflateSync(data),
    minimumCompressionSize: 262144,
  }),
  dataSources: () => ({
    moviesAPI: new MoviesAPI(),
  }),
});
```

## Options

- **compress** (default: `zlib deflate`) - defines a custom compression method taking and returning a `Buffer`.
- **decompress** (default: `zlib deflate`) - defines a custom decompression method taking and returning a `Buffer`.
- **minimumCompressionSize** (default: 262144) - defines minimal length of the data _string_, after
  exceeding which data proxied to wrapped cache are compressed before being passed forward.

## Debug

For better performance  monitor of **CompressionCacheWrapper** module in your app, run your app with
_DEBUG_ env.

To get all debug messages from all modules:
```
DEBUG=* npm run start
```

To get debug messages only from _compression-wrapper_ module:
```
DEBUG=compression-wrapper npm run start
```
