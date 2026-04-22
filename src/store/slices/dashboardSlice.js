import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const [salesRes, sessionsRes, computersRes, usersRes, replenishmentsRes] = await Promise.all([
        apiClient.get('/sales_journals?select=*,products(*),payment_methods(*)'),
        apiClient.get('/sessions?select=*,computers(*),users(*)'),
        apiClient.get('/computers?select=*,zones(*)'),
        apiClient.get('/users?select=*'),
        apiClient.get('/replenishment_logs?select=*,payment_methods(*),users(*)')
      ]);

      return {
        sales: salesRes.data || [],
        sessions: sessionsRes.data || [],
        computers: computersRes.data || [],
        users: usersRes.data || [],
        replenishments: replenishmentsRes.data || []
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки статистики');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    sales: [],
    sessions: [],
    computers: [],
    users: [],
    replenishments: [],
    isLoading: false,
    period: 'week',
    error: null
  },
  reducers: {
    setPeriod: (state, action) => { state.period = action.payload; },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sales = action.payload.sales;
        state.sessions = action.payload.sessions;
        state.computers = action.payload.computers;
        state.users = action.payload.users;
        state.replenishments = action.payload.replenishments;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setPeriod, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;