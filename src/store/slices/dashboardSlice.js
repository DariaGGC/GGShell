import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const [salesRes, sessionsRes, computersRes, usersRes] = await Promise.all([
        apiClient.get('/sales_journals?select=*'),
        apiClient.get('/sessions?select=*'),
        apiClient.get('/computers?select=*'),
        apiClient.get('/users?select=*'),
      ]);

      return {
        sales: salesRes.data || [],
        sessions: sessionsRes.data || [],
        computers: computersRes.data || [],
        users: usersRes.data || [],
      };
    } catch (error) {
      console.error('Dashboard fetch error:', error);
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
    isLoading: false,
    dateRange: 'week',
    error: null,
  },
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sales = action.payload.sales;
        state.sessions = action.payload.sessions;
        state.computers = action.payload.computers;
        state.users = action.payload.users;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setDateRange, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;