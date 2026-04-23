import { useState, useEffect } from 'react';
import { Layout, Menu, theme, Drawer, Button } from 'antd';
import {
  DashboardOutlined,
  DesktopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  HistoryOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';

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
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="layout-wrapper">
      <Layout className="layout-main">
        {!isMobile && (
          <Sider 
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            breakpoint="lg"
            collapsedWidth={60}
            width={240}
            style={{ background: '#ffffff' }}
          >
            <div className={`logo ${collapsed ? 'logo-collapsed' : ''}`}>
              {collapsed ? 'GG' : 'GG.Shell'}
            </div>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
            />
          </Sider>
        )}
        
        {isMobile && (
          <Drawer
            title="Меню"
            placement="left"
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            bodyStyle={{ padding: 0 }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => { navigate(key); setDrawerOpen(false); }}
            />
          </Drawer>
        )}
        
        <Layout className="layout-content-wrapper">
          <Header className="layout-header" style={{ background: colorBgContainer }}>
            {isMobile && <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />}
            <h1 className="header-title">Управление компьютерным клубом</h1>
            <div className="header-info">
              <span>👤 Дарья Т.</span>
              <span>{new Date().toLocaleDateString('ru-RU')}</span>
            </div>
          </Header>
          
          <Content 
            className="layout-content"
            style={{ 
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default MainLayout;