import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';

// Заглушки страниц (пока)
const Dashboard = () => <div>Дашборд</div>;
const Computers = () => <div>Компьютеры</div>;
const Sales = () => <div>Продажи</div>;
const Users = () => <div>Пользователи</div>;
const Logs = () => <div>Логи</div>;

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/computers" element={<Computers />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/users" element={<Users />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </MainLayout>
  );
}

export default App;