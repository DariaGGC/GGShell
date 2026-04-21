import { configureStore } from '@reduxjs/toolkit';
import computersReducer from './slices/computersSlice';
import usersReducer from './slices/usersSlice';

export const store = configureStore({
  reducer: {
    computers: computersReducer,
    users: usersReducer,
  },
});