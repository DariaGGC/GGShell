import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

// Получить все компьютеры с зонами и активными сессиями
export const fetchComputers = createAsyncThunk(
  'computers/fetchComputers',
  async (_, { rejectWithValue }) => {
    try {
      const computersResponse = await apiClient.get('/computers?select=*,zones(*)&order=number.asc');
      const computers = computersResponse.data;

      const sessionsResponse = await apiClient.get(
        '/sessions?select=*,users(*),tariffs(*)&status=eq.active'
      );
      const activeSessions = sessionsResponse.data;

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

// Получить список зон
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

// Получить список клиентов (для посадки)
export const fetchUsersForSelect = createAsyncThunk(
  'computers/fetchUsersForSelect',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/users?order=login.asc');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки клиентов');
    }
  }
);

// Посадить клиента за компьютер
export const startSession = createAsyncThunk(
  'computers/startSession',
  async ({ computerId, userId, tariffId }, { rejectWithValue, dispatch }) => {
    try {
      const now = new Date().toISOString();
      
      // Создаём сессию
      await apiClient.post('/sessions', {
        user_id: userId,
        computer_id: computerId,
        tariff_id: tariffId,
        start_time: now,
        status: 'active'
      });
      
      // Обновляем статус компьютера
      await apiClient.patch(`/computers?id=eq.${computerId}`, {
        status: 'Занят'
      });
      
      // Создаём лог авторизации
      await apiClient.post('/log_auths', {
        user_id: userId,
        computer_id: computerId,
        date: now.split('T')[0],
        time: now.split('T')[1].split('.')[0],
        action: 'login'
      });
      
      dispatch(fetchComputers());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка начала сессии');
    }
  }
);

// Отправить компьютер на обслуживание
export const setMaintenance = createAsyncThunk(
  'computers/setMaintenance',
  async ({ computerId }, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState();
      const computer = state.computers.items.find(c => c.id === computerId);
      
      // Если есть активная сессия — завершаем её
      if (computer?.activeSession) {
        await dispatch(endSession({ 
          sessionId: computer.activeSession.id, 
          computerId 
        }));
      }
      
      // Меняем статус на обслуживание
      await apiClient.patch(`/computers?id=eq.${computerId}`, {
        status: 'Обслуживание'
      });
      
      dispatch(fetchComputers());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка смены статуса');
    }
  }
);

// Вернуть компьютер из обслуживания
export const setFree = createAsyncThunk(
  'computers/setFree',
  async ({ computerId }, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.patch(`/computers?id=eq.${computerId}`, {
        status: 'Свободен'
      });
      
      dispatch(fetchComputers());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка смены статуса');
    }
  }
);

// Завершить сессию принудительно
export const endSession = createAsyncThunk(
  'computers/endSession',
  async ({ sessionId, computerId }, { rejectWithValue, dispatch }) => {
    try {
      const endTime = new Date().toISOString();
      
      const sessionResponse = await apiClient.get(`/sessions?id=eq.${sessionId}&select=*,tariffs(*),users(*)`);
      const session = sessionResponse.data[0];
      
      const startTime = new Date(session.start_time);
      const durationHours = (new Date(endTime) - startTime) / (1000 * 60 * 60);
      const totalCost = Math.ceil(durationHours * session.tariffs.price_per_hour);
      
      // Обновляем сессию (сохраняем статистику, но НЕ списываем деньги)
      await apiClient.patch(`/sessions?id=eq.${sessionId}`, {
        end_time: endTime,
        total_cost: totalCost,
        status: 'finished'
      });
      
      // Обновляем статус компьютера
      await apiClient.patch(`/computers?id=eq.${computerId}`, {
        status: 'Свободен'
      });
      
      // Лог выхода
      await apiClient.post('/log_auths', {
        user_id: session.users.id,
        computer_id: computerId,
        date: endTime.split('T')[0],
        time: endTime.split('T')[1].split('.')[0],
        action: 'logout'
      });
      
      dispatch(fetchComputers());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка завершения сессии');
    }
  }
);

// Динамическое списание баланса (вызывается по таймеру)
export const tickBalance = createAsyncThunk(
  'computers/tickBalance',
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState();
      const computers = state.computers.items;
      
      for (const computer of computers) {
        if (computer.activeSession) {
          const session = computer.activeSession;
          const user = session.users;
          
          if (user && user.balance > 0) {
            const pricePerMinute = session.tariffs.price_per_hour / 60;
            const newBalance = Math.max(0, user.balance - pricePerMinute);
            
            await apiClient.patch(`/users?id=eq.${user.id}`, {
              balance: Math.round(newBalance)
            });
            
            // Если баланс кончился — завершаем сессию
            if (newBalance <= 0) {
              await dispatch(endSession({ 
                sessionId: session.id, 
                computerId: computer.id 
              }));
            }
          } else if (user && user.balance <= 0) {
            // Баланс 0 — завершаем сессию
            await dispatch(endSession({ 
              sessionId: session.id, 
              computerId: computer.id 
            }));
          }
        }
      }
      
      dispatch(fetchComputers());
      return { success: true };
    } catch (error) {
      console.error('Tick error:', error);
      return rejectWithValue(error.response?.data || 'Ошибка списания баланса');
    }
  }
);

const computersSlice = createSlice({
  name: 'computers',
  initialState: {
    items: [],
    zones: [],
    users: [],
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
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.zones = action.payload;
      })
      .addCase(fetchUsersForSelect.fulfilled, (state, action) => {
        state.users = action.payload;
      });
  },
});

export const { setSelectedZone, clearError } = computersSlice.actions;
export default computersSlice.reducer;