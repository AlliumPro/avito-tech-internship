import test from 'node:test';
import assert from 'node:assert/strict';
import { doesItemNeedRevision } from '../utils.ts';
import type { Item } from '../types.ts';

const baseItem = {
  id: 1,
  title: 'Тестовое объявление',
  price: 100000,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const;

test('doesItemNeedRevision returns true when description is missing', () => {
  const item: Item = {
    ...baseItem,
    category: 'auto',
    params: {
      brand: 'Toyota',
      model: 'Camry',
      yearOfManufacture: 2018,
      transmission: 'automatic',
      mileage: 55000,
      enginePower: 181,
    },
  };

  assert.equal(doesItemNeedRevision(item), true);
});

test('doesItemNeedRevision returns false for fully filled auto item', () => {
  const item: Item = {
    ...baseItem,
    description: 'В хорошем состоянии, один владелец.',
    category: 'auto',
    params: {
      brand: 'Toyota',
      model: 'Camry',
      yearOfManufacture: 2018,
      transmission: 'automatic',
      mileage: 55000,
      enginePower: 181,
    },
  };

  assert.equal(doesItemNeedRevision(item), false);
});

test('doesItemNeedRevision returns true when required params are missing', () => {
  const item: Item = {
    ...baseItem,
    description: 'Почти полное объявление.',
    category: 'electronics',
    params: {
      type: 'phone',
      brand: 'Apple',
      model: 'iPhone 13',
      // missing condition/color
    },
  };

  assert.equal(doesItemNeedRevision(item), true);
});
