import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export const fetchSales = createAsyncThunk(
  'logs/fetchSales',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        '/sales_journals?select=*,products(*),payment_methods(*)&order=date.desc,time.desc'
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки продаж');
    }
  }
);

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
    sessionsHistory: [],
    isLoading: false,
    activeTab: 'sales',
    dateRange: null,
    error: null,
  },
  reducers: {
    setActiveTab: (state, action) => { state.activeTab = action.payload; },
    setDateRange: (state, action) => { state.dateRange = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchSales.fulfilled, (state, action) => { state.isLoading = false; state.sales = action.payload; })
      .addCase(fetchSales.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchReplenishments.fulfilled, (state, action) => { state.replenishments = action.payload; })
      .addCase(fetchSessionsHistory.fulfilled, (state, action) => { state.sessionsHistory = action.payload; });
  },
});

export const { setActiveTab, setDateRange, clearError } = logsSlice.actions;
export default logsSlice.reducer;