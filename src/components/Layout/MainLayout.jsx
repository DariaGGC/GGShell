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
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  return (
    <div className="layout-wrapper">
      <Layout className="layout-main">
        <Sider width={260} style={{ background: '#ffffff', borderRadius: '8px', margin: '0 0 24px 24px'}}>
          <div className="logo">GG.Shell</div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ fontSize: '16px'}}
          />
        </Sider>
        
        <Layout className="layout-content-wrapper">
          <Header className="layout-header" style={{ background: colorBgContainer }}>
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