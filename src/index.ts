import { KeyValueCacheSetOptions, KeyValueCache } from '@apollo/utils.keyvaluecache';
import Debug from 'debug';
import { StringDecoder } from 'string_decoder';
import zlib from 'zlib';

const debug = Debug('compression-wrapper');

export interface CompressionOptions {
  compress?: (data: Buffer) => Buffer;
  decompress?: (data: Buffer) => Buffer;
  minimumCompressionSize?: number;
}

export class CompressionCacheWrapper implements KeyValueCache<string>  {

  readonly defaultCompressionOptions: CompressionOptions = {
    minimumCompressionSize: 262144,
  };
  readonly prefix = 'cmp:';

  constructor(
    private readonly cache: KeyValueCache<string>,
    private readonly compressionOptions: CompressionOptions = {},
  ) {
    debug(`Creating a Compression Wrapper for ${cache.constructor.name} with options: %j`, compressionOptions);
  }

  async set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions,
  ): Promise<void> {
    debug(`[SET] Storing data in cache for key: ${key}`);

    let { compress, minimumCompressionSize } = Object.assign({}, this.defaultCompressionOptions, this.compressionOptions);
    if (compress === undefined || typeof compress === 'function') {
      compress = (data: Buffer) => zlib.deflateSync(data, { level: 1 });
    }

    const uncompressedSize = value.length;
    if (minimumCompressionSize === undefined || uncompressedSize > minimumCompressionSize) {
      try {
        debug(`[SET] Compression start for key: ${key}`);

        const buff = Buffer.from(value);
        value = this.prefix + compress(buff).toString('base64');
      } finally {
        const compressedSize = value.length;
        debug(`[SET] Compression ended - reduced size from: ${uncompressedSize}, to: ${compressedSize}, compression level: ${(1-(compressedSize/uncompressedSize)).toFixed(2)}`);
      }
    } else {
      debug(`[SET] No data compression needed for key: ${key}`);
    }

    await this.cache.set(key, value, options);
    debug(`[SET] Data stored in cached for key: ${key}`);
  }

  async get(key: string): Promise<string | undefined> {
    debug(`[GET] Getting data from cache for key: ${key}`);

    let { decompress } = Object.assign({}, this.defaultCompressionOptions, this.compressionOptions);
    if (decompress === undefined || typeof decompress === 'function') {
      decompress = (data: Buffer) => zlib.inflateSync(data);
    }

    const reply = await this.cache.get(key);

    if (reply !== undefined) {
      if (reply.startsWith(this.prefix)) {
        try {
          debug(`[GET] Decompression start for key: ${key}`);
          const buff = decompress(Buffer.from(reply.slice(this.prefix.length), 'base64'));
          return new StringDecoder('utf8').end(buff);
        } finally {
          debug(`[GET] Decompression ended`);
        }
      }

      debug(`[GET] Data not compressed for key: ${key}`);
      return reply
    }

    debug(`[GET] No data found for key: ${key}`);
    return;
  }

  async delete(key: string): Promise<boolean | void> {
    debug(`[DELETE] Removing data for key: ${key}`);
    await this.cache.delete(key);
  }
}
