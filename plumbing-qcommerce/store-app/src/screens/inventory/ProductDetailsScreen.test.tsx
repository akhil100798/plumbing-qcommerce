import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

(globalThis as any).__DEV__ = false;

const getStoreInventoryMock = vi.fn();
const updateStockMock = vi.fn();
const getCurrentStoreProfileMock = vi.fn();

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('@react-navigation/stack', () => ({}));
vi.mock('@react-navigation/native', () => ({}));
vi.mock('expo-secure-store', () => ({}));

vi.mock('../../assets/icons/arrow-left.svg', () => ({ default: 'ArrowLeftIcon' }));
vi.mock('../../assets/icons/warehouse.svg', () => ({ default: 'WarehouseIcon' }));
vi.mock('../../services/inventory/inventoryService', () => ({
  inventoryService: {
    getStoreInventory: getStoreInventoryMock,
    updateStock: updateStockMock,
  },
}));
vi.mock('../../services/store/storeService', () => ({
  storeService: {
    getCurrentStoreProfile: getCurrentStoreProfileMock,
  },
}));

describe('ProductDetailsScreen stock update contract', () => {
  it('passes explicit product, stock, and store fields to inventoryService', async () => {
    getStoreInventoryMock.mockResolvedValueOnce([
      { id: 6, name: 'QA Pipe', stock: 4, reservedQuantity: 0 },
    ]);
    getCurrentStoreProfileMock.mockResolvedValueOnce({ id: 21 });
    updateStockMock.mockResolvedValueOnce({});

    const { ProductDetailsScreen } = await import('./ProductDetailsScreen');
    const navigation = { canGoBack: () => true, goBack: vi.fn(), navigate: vi.fn() };
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(ProductDetailsScreen, {
          route: { params: { productId: 6 } },
          navigation,
        } as any)
      );
      await Promise.resolve();
    });

    const touchables = () => renderer!.root.findAll((node) => Boolean(node.props?.onPress));
    const childText = (node: TestRenderer.ReactTestInstance) => {
      const child = Array.isArray(node.props.children) ? node.props.children[0] : node.props.children;
      return child?.props?.children;
    };
    const updateButton = touchables().find((node) =>
      childText(node) === 'Update Stock Quantity'
    );
    expect(updateButton).toBeDefined();

    await act(async () => {
      updateButton!.props.onPress();
    });

    const input = renderer!.root.find((node) => Boolean(node.props?.onChangeText));
    expect(input.props.value).toBe('4');
    await act(async () => {
      input.props.onChangeText('12');
    });
    const saveButton = touchables().find((node) =>
      childText(node) === 'Save Updated Stock'
    );
    expect(saveButton).toBeDefined();

    await act(async () => {
      await saveButton!.props.onPress();
      await Promise.resolve();
    });
    expect(updateStockMock).toHaveBeenCalledWith({
      productId: 6,
      stockCount: 12,
      storeId: 21,
    });
  });
});
