import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

// Получить все товары
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

// Получить способы оплаты
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

// Оформить продажу
export const createSale = createAsyncThunk(
  'sales/createSale',
  async ({ items, paymentMethodId }, { rejectWithValue, dispatch }) => {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];

      // Создаём записи в журнале продаж и обновляем количество товаров
      for (const item of items) {
        // Создаём запись о продаже
        await apiClient.post('/sales_journals', {
          product_id: item.id,
          quantity: item.cartQuantity,
          total_price: item.cartQuantity * item.price,
          date: date,
          time: time,
        });

        // Обновляем количество товара на складе
        await apiClient.patch(`/products?id=eq.${item.id}`, {
          quantity: item.quantity - item.cartQuantity,
        });
      }

      // Обновляем список товаров
      dispatch(fetchProducts());

      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка оформления продажи');
    }
  }
);

// Добавить приход товара (увеличить количество)
export const addStock = createAsyncThunk(
  'sales/addStock',
  async ({ productId, quantity }, { rejectWithValue, dispatch }) => {
    try {
      // Получаем текущий товар
      const response = await apiClient.get(`/products?id=eq.${productId}`);
      const product = response.data[0];
      
      if (!product) {
        return rejectWithValue('Товар не найден');
      }
      
      // Увеличиваем количество
      await apiClient.patch(`/products?id=eq.${productId}`, {
        quantity: product.quantity + quantity
      });
      
      // Обновляем список товаров
      dispatch(fetchProducts());
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка пополнения товара');
    }
  }
);
// Обновить существующий товар (название, цена)
export const updateProduct = createAsyncThunk(
  'sales/updateProduct',
  async ({ productId, name, price }, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.patch(`/products?id=eq.${productId}`, {
        name,
        price
      });
      
      // Обновляем список товаров
      dispatch(fetchProducts());
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка обновления товара');
    }
  }
);

// Создать новый товар
export const createProduct = createAsyncThunk(
  'sales/createProduct',
  async (productData, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.post('/products', {
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity || 0
      });
      
      // Обновляем список товаров
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
    cart: [], // Товары в корзине: [{ id, name, price, quantity, cartQuantity }]
    isLoading: false,
    isSubmitting: false,
    error: null,
  },
  reducers: {
    // Добавить товар в корзину
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.cart.find(item => item.id === product.id);

      if (existingItem) {
        // Если товар уже в корзине, увеличиваем количество
        if (existingItem.cartQuantity < product.quantity) {
          existingItem.cartQuantity += 1;
        }
      } else {
        // Добавляем новый товар
        state.cart.push({
          ...product,
          cartQuantity: 1,
        });
      }
    },

    // Удалить товар из корзины
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.cart = state.cart.filter(item => item.id !== productId);
    },

    // Изменить количество товара в корзине
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.cart.find(item => item.id === productId);
      if (item) {
        const product = state.products.find(p => p.id === productId);
        if (product && quantity <= product.quantity && quantity > 0) {
          item.cartQuantity = quantity;
        }
      }
    },

    // Очистить корзину
    clearCart: (state) => {
      state.cart = [];
    },

    // Очистить ошибку
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(updateProduct.pending, (state) => {
  state.isLoading = true;
  state.error = null;
})
.addCase(updateProduct.fulfilled, (state) => {
  state.isLoading = false;
})
.addCase(updateProduct.rejected, (state, action) => {
  state.isLoading = false;
  state.error = action.payload;
})
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // fetchPaymentMethods
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload;
      })
      
      // createSale
      .addCase(createSale.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state) => {
        state.isSubmitting = false;
        state.cart = [];
      })
      .addCase(createSale.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      
      // addStock
      .addCase(addStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addStock.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // createProduct
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  clearError,
} = salesSlice.actions;

export default salesSlice.reducer;