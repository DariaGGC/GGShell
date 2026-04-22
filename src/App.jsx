import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import DashboardPage from './pages/Dashboard';
import ComputersPage from './pages/Computers';
import UsersPage from './pages/Users';
import SalesPage from './pages/Sales';
import LogsPage from './pages/Logs';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/computers" element={<ComputersPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;