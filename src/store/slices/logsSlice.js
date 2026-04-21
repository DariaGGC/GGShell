import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

// Получить все продажи
export const fetchSales = createAsyncThunk(
  'logs/fetchSales',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        '/sales_journals?select=*,products(*)&order=date.desc,time.desc'
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки продаж');
    }
  }
);

// Получить пополнения баланса
export const fetchReplenishments = createAsyncThunk(
  'logs/fetchReplenishments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        '/replenishment_logs?select=*,users(*),payment_methods(*)&order=date.desc,time.desc'
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки пополнений');
    }
  }
);

// Получить логи авторизаций
export const fetchAuthLogs = createAsyncThunk(
  'logs/fetchAuthLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        '/log_auths?select=*,users(*),computers(*)&order=date.desc,time.desc'
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки логов авторизаций');
    }
  }
);

// Получить завершённые сессии
export const fetchSessionsHistory = createAsyncThunk(
  'logs/fetchSessionsHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        '/sessions?select=*,users(*),computers(*),tariffs(*)&status=eq.finished&order=end_time.desc'
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки истории сессий');
    }
  }
);

const logsSlice = createSlice({
  name: 'logs',
  initialState: {
    sales: [],
    replenishments: [],
    authLogs: [],
    sessionsHistory: [],
    isLoading: false,
    activeTab: 'sales',
    error: null,
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSales
      .addCase(fetchSales.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // fetchReplenishments
      .addCase(fetchReplenishments.fulfilled, (state, action) => {
        state.replenishments = action.payload;
      })
      // fetchAuthLogs
      .addCase(fetchAuthLogs.fulfilled, (state, action) => {
        state.authLogs = action.payload;
      })
      // fetchSessionsHistory
      .addCase(fetchSessionsHistory.fulfilled, (state, action) => {
        state.sessionsHistory = action.payload;
      });
  },
});

export const { setActiveTab, clearError } = logsSlice.actions;
export default logsSlice.reducer;