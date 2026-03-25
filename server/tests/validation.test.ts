import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemUpdateInSchema, ItemsGetInQuerySchema } from '../validation.ts';

test('ItemsGetInQuerySchema applies defaults', () => {
  const parsed = ItemsGetInQuerySchema.parse({});

  assert.equal(parsed.q, '');
  assert.equal(parsed.limit, 10);
  assert.equal(parsed.skip, 0);
  assert.equal(parsed.needsRevision, false);
});

test('ItemsGetInQuerySchema parses categories list', () => {
  const parsed = ItemsGetInQuerySchema.parse({
    categories: 'auto,electronics',
    limit: '10',
    skip: '0',
  });

  assert.deepEqual(parsed.categories, ['auto', 'electronics']);
});

test('ItemUpdateInSchema rejects negative price', () => {
  const result = ItemUpdateInSchema.safeParse({
    category: 'real_estate',
    title: 'Квартира',
    price: -1,
    params: {
      type: 'flat',
      address: 'Москва',
      area: 42,
      floor: 5,
    },
  });

  assert.equal(result.success, false);
});

test('ItemUpdateInSchema accepts valid payload', () => {
  const result = ItemUpdateInSchema.safeParse({
    category: 'electronics',
    title: 'Ноутбук',
    description: 'Почти новый',
    price: 78000,
    params: {
      type: 'laptop',
      brand: 'Lenovo',
      model: 'ThinkPad',
      condition: 'used',
      color: 'black',
    },
  });

  assert.equal(result.success, true);
});
