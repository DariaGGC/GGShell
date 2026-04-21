import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

// Получить все компьютеры с зонами и активными сессиями
export const fetchComputers = createAsyncThunk(
  'computers/fetchComputers',
  async (_, { rejectWithValue }) => {
    try {
      // Получаем компьютеры с данными о зонах
      const computersResponse = await apiClient.get('/computers?select=*,zones(*)&order=number.asc');
      const computers = computersResponse.data;

      // Получаем активные сессии с пользователями
      const sessionsResponse = await apiClient.get(
        '/sessions?select=*,users(*),tariffs(*)&status=eq.active'
      );
      const activeSessions = sessionsResponse.data;

      // Объединяем данные: к каждому компьютеру добавляем информацию о сессии
      const computersWithSessions = computers.map(computer => {
        const activeSession = activeSessions.find(
          session => session.computer_id === computer.id
        );
        return {
          ...computer,
          activeSession: activeSession || null,
        };
      });

      return computersWithSessions;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки компьютеров');
    }
  }
);

// Получить список зон для фильтра
export const fetchZones = createAsyncThunk(
  'computers/fetchZones',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/zones?order=name.asc');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки зон');
    }
  }
);

// Завершить сессию
export const endSession = createAsyncThunk(
  'computers/endSession',
  async ({ sessionId, computerId }, { rejectWithValue, dispatch }) => {
    try {
      const endTime = new Date().toISOString();
      
      // Получаем данные сессии для расчёта стоимости
      const sessionResponse = await apiClient.get(`/sessions?id=eq.${sessionId}&select=*,tariffs(*)`);
      const session = sessionResponse.data[0];
      
      const startTime = new Date(session.start_time);
      const durationHours = (new Date(endTime) - startTime) / (1000 * 60 * 60);
      const totalCost = Math.ceil(durationHours * session.tariffs.price_per_hour);
      
      // Обновляем сессию
      await apiClient.patch(`/sessions?id=eq.${sessionId}`, {
        end_time: endTime,
        total_cost: totalCost,
        status: 'finished'
      });
      
      // Обновляем статус компьютера
      await apiClient.patch(`/computers?id=eq.${computerId}`, {
        status: 'Свободен'
      });
      
      // Списываем деньги с баланса пользователя
      const userResponse = await apiClient.get(`/users?id=eq.${session.user_id}`);
      const user = userResponse.data[0];
      
      await apiClient.patch(`/users?id=eq.${session.user_id}`, {
        balance: user.balance - totalCost
      });
      
      // Обновляем список компьютеров
      dispatch(fetchComputers());
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка завершения сессии');
    }
  }
);

const computersSlice = createSlice({
  name: 'computers',
  initialState: {
    items: [],
    zones: [],
    selectedZone: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setSelectedZone: (state, action) => {
      state.selectedZone = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchComputers
      .addCase(fetchComputers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComputers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchComputers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // fetchZones
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.zones = action.payload;
      });
  },
});

export const { setSelectedZone, clearError } = computersSlice.actions;
export default computersSlice.reducer;