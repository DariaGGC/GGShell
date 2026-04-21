import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ComputersPage from './pages/Computers';

// Заглушки для остальных страниц
const Dashboard = () => <div>Дашборд (в разработке)</div>;
const Sales = () => <div>Продажи (в разработке)</div>;
const Users = () => <div>Пользователи (в разработке)</div>;
const Logs = () => <div>Логи (в разработке)</div>;

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/computers" element={<ComputersPage />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/users" element={<Users />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </MainLayout>
  );
}

export default App;