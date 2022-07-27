import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';

import { CompressionCacheWrapper } from '../index';

describe('CompressionCacheWrapper', () => {
  let cache: CompressionCacheWrapper;

  beforeEach(() => {
    cache = new CompressionCacheWrapper(new InMemoryLRUCache({ ttl: 0, ttlResolution: 0 }));
  })

  const tick = (ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

  it('Can do a basic get and set', async () => {
    // given:
    expect.assertions(2);

    // when:
    await cache.set('hello', 'world');
    // then:
    await expect(cache.get('hello')).resolves.toBe('world');
    await expect(cache.get('missing')).resolves.toBe(undefined);
  });

  it('Can do a basic set and delete', async () => {
    // given:
    expect.assertions(2);
    // and:
    await cache.set('hello2', 'world');
    // expect:
    await expect(cache.get('hello2')).resolves.toBe('world');
    
    // when:
    await cache.delete('hello2');
    // then:
    await expect(cache.get('hello2')).resolves.toBe(undefined);
  });

  it('Is able to expire keys based on ttl', async () => {
    // given:
    expect.assertions(6);
    // and:
    await cache.set('short', 's', { ttl: 1 });
    await cache.set('long', 'l', { ttl: 3 });
    // // expect:
    await expect(cache.get('short')).resolves.toBe('s');
    await expect(cache.get('long')).resolves.toBe('l');

    // when:
    await tick(1200);
    // then:
    await expect(cache.get('short')).resolves.toBe(undefined);
    await expect(cache.get('long')).resolves.toBe('l');

    // when:
    await tick(2200);
    // then:
    await expect(cache.get('short')).resolves.toBe(undefined);
    await expect(cache.get('long')).resolves.toBe(undefined);
  });

  it('Does not expire when ttl is null', async () => {
    // given:
    expect.assertions(3);
    // and:
    await cache.set('forever', 'yours', { ttl: null });
    // expect:
    await expect(cache.get('forever')).resolves.toBe('yours');

    // when:
    await tick(1200);
    // then:
    await expect(cache.get('forever')).resolves.toBe('yours');

    // when:
    await tick(2200);
    // then:
    await expect(cache.get('forever')).resolves.toBe('yours');
  });
});

describe('CompressionCacheWrapper - Compression', () => {
  let wrappedCache: InMemoryLRUCache;
  let cache: CompressionCacheWrapper;

  beforeEach(() => {
    wrappedCache = new InMemoryLRUCache();
    cache = new CompressionCacheWrapper(wrappedCache, {
      minimumCompressionSize: 11,
    });
  });

  it('Values smaller that minimumCompressionSize are not compressed', async () => {
    // given:
    const testKey = 'test-key';
    const testValue = 'test value';

    // when:
    await cache.set(testKey, testValue);
    // then:
    expect(await wrappedCache.get(testKey)).toEqual(testValue);
  });

  it('Values greater that the set minimumCompressionSize are compressed and prefixed', async () => {
    // given:
    const testKey = 'test-key';
    const testValue = 'one big test value';

    // when:
    await cache.set(testKey, testValue);
    // then:
    expect(await wrappedCache.get(testKey)).toMatch(/cmp\:.*/);
  });

  it('Values greater that the default minimumCompressionSize are compressed and prefixed', async () => {
    // given:
    const cache = new CompressionCacheWrapper(wrappedCache);
    // and:
    const testKey = 'test-key';
    let testValue = '';
    for (let i = 0; i < 262144 + 1; i++) {
      testValue += 'a';
    }
    // and:
    await cache.set(testKey, testValue);

    // when:
    const result = await wrappedCache.get(testKey);
    // then:
    expect(result).toMatch(/cmp\:.*/);
    // and:
    expect(result?.length).toBeLessThan(testValue.length);
  });

  it('Not compressed values are returned as is', async () => {
    // given:
    const testKey = 'test-key';
    const testValue = 'test value';
    // and
    await wrappedCache.set(testKey, testValue);

    // when:
    const result = await cache.get(testKey);
    // then:
    expect(result).toEqual(testValue);
  });

  it('Compressed values are decompresses before are returned', async () => {
    // given:
    const testKey = 'test-key';
    const testValue = 'one big test value';
    // and
    await wrappedCache.set(testKey, 'cmp:eAHLz0tVSMpMVyhJLS5RKEvMKU0FAD5BBrI=');

    // when:
    const result = await cache.get(testKey);
    // then:
    expect(result).toEqual(testValue);
  });
});
