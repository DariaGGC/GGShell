import { configureStore } from '@reduxjs/toolkit';
import computersReducer from './slices/computersSlice';
import usersReducer from './slices/usersSlice';
import salesReducer from './slices/salesSlice';
import journalReducer from './slices/journalSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    computers: computersReducer,
    users: usersReducer,
    sales: salesReducer,
    journal: journalReducer,
    dashboard: dashboardReducer,
  },
});