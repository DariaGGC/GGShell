import { configureStore } from '@reduxjs/toolkit';
import computersReducer from './slices/computersSlice';
import usersReducer from './slices/usersSlice';
import salesReducer from './slices/salesSlice';

export const store = configureStore({
  reducer: {
    computers: computersReducer,
    users: usersReducer,
    sales: salesReducer,
  },
});