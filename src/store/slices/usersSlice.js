import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

// Получить всех пользователей с активными сессиями
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      // Получаем пользователей
      const usersResponse = await apiClient.get('/users?order=login.asc');
      const users = usersResponse.data;

      // Получаем активные сессии с компьютерами
      const sessionsResponse = await apiClient.get(
        '/sessions?select=*,computers(*)&status=eq.active'
      );
      const activeSessions = sessionsResponse.data;

      // Объединяем данные
      const usersWithSessions = users.map(user => {
        const activeSession = activeSessions.find(
          session => session.user_id === user.id
        );
        return {
          ...user,
          activeSession: activeSession || null,
        };
      });

      return usersWithSessions;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки пользователей');
    }
  }
);

// Пополнить баланс
export const topUpBalance = createAsyncThunk(
  'users/topUpBalance',
  async ({ userId, amount, paymentMethodId }, { rejectWithValue, dispatch }) => {
    try {
      // Получаем текущий баланс
      const userResponse = await apiClient.get(`/users?id=eq.${userId}`);
      const user = userResponse.data[0];
      const newBalance = user.balance + amount;

      // Обновляем баланс пользователя
      await apiClient.patch(`/users?id=eq.${userId}`, {
        balance: newBalance
      });

      // Создаём запись о пополнении
      const now = new Date();
      await apiClient.post('/replenishment_logs', {
        user_id: userId,
        payment_method_id: paymentMethodId,
        amount: amount,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0]
      });

      // Обновляем список пользователей
      dispatch(fetchUsers());

      return { success: true, newBalance };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка пополнения баланса');
    }
  }
);

// Получить способы оплаты
export const fetchPaymentMethods = createAsyncThunk(
  'users/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/payment_methods?is_active=eq.true');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки способов оплаты');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    paymentMethods: [],
    isLoading: false,
    error: null,
    searchText: '',
    filterBalance: null, // 'positive', 'zero', 'negative', null
  },
  reducers: {
    setSearchText: (state, action) => {
      state.searchText = action.payload;
    },
    setFilterBalance: (state, action) => {
      state.filterBalance = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // fetchPaymentMethods
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload;
      })
      // topUpBalance
      .addCase(topUpBalance.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setSearchText, setFilterBalance, clearError } = usersSlice.actions;
export default usersSlice.reducer;