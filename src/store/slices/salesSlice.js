import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export const fetchProducts = createAsyncThunk(
  'sales/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/products?order=name.asc');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки товаров');
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'sales/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/payment_methods?is_active=eq.true');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки способов оплаты');
    }
  }
);

export const createSale = createAsyncThunk(
  'sales/createSale',
  async ({ items, paymentMethodId }, { rejectWithValue, dispatch }) => {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];
      for (const item of items) {
        await apiClient.post('/sales_journals', {
          product_id: item.id,
          quantity: item.cartQuantity,
          total_price: item.cartQuantity * item.price,
          date,
          time,
          payment_method_id: paymentMethodId
        });
        await apiClient.patch(`/products?id=eq.${item.id}`, {
          quantity: item.quantity - item.cartQuantity,
        });
      }
      dispatch(fetchProducts());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка оформления продажи');
    }
  }
);

export const addStock = createAsyncThunk(
  'sales/addStock',
  async ({ productId, quantity }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get(`/products?id=eq.${productId}`);
      const product = response.data[0];
      if (!product) return rejectWithValue('Товар не найден');
      await apiClient.patch(`/products?id=eq.${productId}`, { quantity: product.quantity + quantity });
      dispatch(fetchProducts());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка пополнения товара');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'sales/updateProduct',
  async ({ productId, name, price }, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.patch(`/products?id=eq.${productId}`, { name, price });
      dispatch(fetchProducts());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка обновления товара');
    }
  }
);

export const createProduct = createAsyncThunk(
  'sales/createProduct',
  async (productData, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.post('/products', {
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity || 0
      });
      dispatch(fetchProducts());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка создания товара');
    }
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState: {
    products: [],
    paymentMethods: [],
    cart: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existing = state.cart.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity < product.quantity) existing.cartQuantity += 1;
      } else {
        state.cart.push({ ...product, cartQuantity: 1 });
      }
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter(item => item.id !== action.payload);
    },
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.cart.find(item => item.id === productId);
      const product = state.products.find(p => p.id === productId);
      if (item && product && quantity <= product.quantity && quantity > 0) {
        item.cartQuantity = quantity;
      }
    },
    clearCart: (state) => { state.cart = []; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProduct.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(updateProduct.fulfilled, (state) => { state.isLoading = false; })
      .addCase(updateProduct.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.isLoading = false; state.products = action.payload; })
      .addCase(fetchProducts.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => { state.paymentMethods = action.payload; })
      .addCase(createSale.pending, (state) => { state.isSubmitting = true; state.error = null; })
      .addCase(createSale.fulfilled, (state) => { state.isSubmitting = false; state.cart = []; })
      .addCase(createSale.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload; })
      .addCase(addStock.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(addStock.fulfilled, (state) => { state.isLoading = false; })
      .addCase(addStock.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createProduct.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createProduct.fulfilled, (state) => { state.isLoading = false; })
      .addCase(createProduct.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });
  },
});

export const { addToCart, removeFromCart, updateCartQuantity, clearCart, clearError } = salesSlice.actions;
export default salesSlice.reducer;