import { configureStore } from '@reduxjs/toolkit';
import computersReducer from './slices/computersSlice';
import usersReducer from './slices/usersSlice';
import salesReducer from './slices/salesSlice';
import logsReducer from './slices/logsSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    computers: computersReducer,
    users: usersReducer,
    sales: salesReducer,
    logs: logsReducer,
    dashboard: dashboardReducer,
  },
});