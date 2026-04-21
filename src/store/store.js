import { configureStore } from '@reduxjs/toolkit';
import computersReducer from './slices/computersSlice';

export const store = configureStore({
  reducer: {
    computers: computersReducer,
  },
});