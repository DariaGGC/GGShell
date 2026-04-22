import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

// Получить всех пользователей с активными сессиями
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const usersResponse = await apiClient.get('/users?order=login.asc');
      const users = usersResponse.data;

      const sessionsResponse = await apiClient.get(
        '/sessions?select=*,computers(*),tariffs(*)&status=eq.active'
      );
      const activeSessions = sessionsResponse.data;

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

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, login, firstName, lastName, phone }, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.patch(`/users?id=eq.${userId}`, {
        login,
        firstName,
        lastName,
        phone
      });
      
      // Обновляем список пользователей
      dispatch(fetchUsers());
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка обновления пользователя');
    }
  }
);

// Пополнить баланс
export const topUpBalance = createAsyncThunk(
  'users/topUpBalance',
  async ({ userId, amount, paymentMethodId }, { rejectWithValue, dispatch }) => {
    try {
      const userResponse = await apiClient.get(`/users?id=eq.${userId}`);
      const user = userResponse.data[0];
      const newBalance = user.balance + amount;

      await apiClient.patch(`/users?id=eq.${userId}`, {
        balance: newBalance
      });

      const now = new Date();
      await apiClient.post('/replenishment_logs', {
        user_id: userId,
        payment_method_id: paymentMethodId,
        amount: amount,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0]
      });

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
    filterStatus: 'all', // 'all', 'authorized', 'unauthorized'
  },
  reducers: {
    setSearchText: (state, action) => {
      state.searchText = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
        .addCase(updateUser.pending, (state) => {
    state.isLoading = true;
    state.error = null;
    })
    .addCase(updateUser.fulfilled, (state) => {
    state.isLoading = false;
    })
    .addCase(updateUser.rejected, (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    })
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
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload;
      })
      .addCase(topUpBalance.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setSearchText, setFilterStatus, clearError } = usersSlice.actions;
export default usersSlice.reducer;