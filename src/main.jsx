import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import App from './App';
import { store } from './store/store';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider locale={ruRU} theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
          },
        }}>
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);