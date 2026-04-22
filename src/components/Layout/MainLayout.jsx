import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  DesktopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Дашборд' },
  { key: '/computers', icon: <DesktopOutlined />, label: 'Компьютеры' },
  { key: '/sales', icon: <ShoppingCartOutlined />, label: 'Продажи' },
  { key: '/users', icon: <UserOutlined />, label: 'Пользователи' },
  { key: '/logs', icon: <HistoryOutlined />, label: 'Журнал' },
];

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          color: 'white', 
          fontSize: collapsed ? 20 : 24,
          fontWeight: 'bold',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {collapsed ? 'GG' : 'GG.Shell'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'bold' }}>
            GG.Shell — Управление компьютерным клубом
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>👤 Администратор</span>
            <span>{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;