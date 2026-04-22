import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic, Button, Spin, Alert, Typography, Progress, Space, Tag, Empty } from 'antd';
import {
  ReloadOutlined,
  DesktopOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { fetchDashboardStats, setDateRange } from '../../store/slices/dashboardSlice';
import RevenueChart from '../../components/Dashboard/RevenueChart';
import ErrorBoundary from '../../components/ErrorBoundary';

const { Title, Text } = Typography;

function DashboardPage() {
  const dispatch = useDispatch();
  const {
    sales = [],
    sessions = [],
    computers = [],
    users = [],
    isLoading,
    dateRange,
    error,
  } = useSelector(state => state.dashboard || {});

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // Статистика с проверкой на пустые массивы
  const stats = useMemo(() => {
    const totalComputers = computers?.length || 0;
    const freeComputers = computers?.filter(c => c.status === 'Свободен').length || 0;
    const occupiedComputers = computers?.filter(c => c.status === 'Занят').length || 0;
    
    const activeSessions = sessions?.filter(s => s.status === 'active') || [];
    const totalUsers = users?.length || 0;
    const activeUsers = activeSessions.length;
    
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales
      ?.filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.total_price || 0), 0) || 0;
    
    const todaySessions = sessions
      ?.filter(s => s.end_time && s.end_time.startsWith(today))
      .reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0;

    const totalBalance = users?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;

    return {
      totalComputers,
      freeComputers,
      occupiedComputers,
      totalUsers,
      activeUsers,
      todaySales,
      todaySessions,
      todayTotal: todaySales + todaySessions,
      totalBalance,
      occupancyRate: totalComputers > 0 
        ? Math.round((occupiedComputers / totalComputers) * 100)
        : 0,
    };
  }, [computers, sessions, users, sales]);

  // Топ товаров по продажам
  const topProducts = useMemo(() => {
    if (!sales?.length) return [];
    
    const productSales = {};
    sales.forEach(sale => {
      if (!productSales[sale.product_id]) {
        productSales[sale.product_id] = {
          id: sale.product_id,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[sale.product_id].quantity += sale.quantity || 0;
      productSales[sale.product_id].revenue += sale.total_price || 0;
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description={String(error)}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => dispatch(fetchDashboardStats())}>
            Повторить
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          🏠 Дашборд
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => dispatch(fetchDashboardStats())}
          loading={isLoading}
        >
          Обновить
        </Button>
      </div>

      <Spin spinning={isLoading}>
        {/* Основные показатели */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Сегодня выручка"
                value={stats.todayTotal}
                suffix="₽"
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 28 }}
              />
              <div style={{ marginTop: 8 }}>
                <Typography.Text type="secondary">
                  Продажи: {stats.todaySales} ₽ | Сессии: {stats.todaySessions} ₽
                </Typography.Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Компьютеры"
                value={stats.occupiedComputers}
                suffix={`/ ${stats.totalComputers}`}
                prefix={<DesktopOutlined />}
              />
              <Progress
                percent={stats.occupancyRate}
                size="small"
                strokeColor="#1677ff"
                style={{ marginTop: 8 }}
              />
              <Typography.Text type="secondary">
                Свободно: {stats.freeComputers}
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Пользователи"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
              />
              <Typography.Text type="secondary">
                В игре: {stats.activeUsers}
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Баланс клиентов"
                value={stats.totalBalance}
                suffix="₽"
                prefix={<WalletOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* График доходов */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
            <ErrorBoundary>
            <RevenueChart
                sales={sales}
                sessions={sessions}
                dateRange={dateRange}
                onDateRangeChange={(value) => dispatch(setDateRange(value))}
            />
            </ErrorBoundary>
        </Col>
        </Row>

        {/* Дополнительная информация */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="💻 Статус компьютеров">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="green" style={{ fontSize: 16, padding: '8px 16px' }}>
                      Свободно: {stats.freeComputers}
                    </Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="blue" style={{ fontSize: 16, padding: '8px 16px' }}>
                      Занято: {stats.occupiedComputers}
                    </Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="orange" style={{ fontSize: 16, padding: '8px 16px' }}>
                      Обслуживание: {stats.totalComputers - stats.freeComputers - stats.occupiedComputers}
                    </Tag>
                  </div>
                </Col>
              </Row>
              
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Активные сессии</Title>
                {sessions.filter(s => s.status === 'active').length > 0 ? (
                  sessions.filter(s => s.status === 'active').slice(0, 5).map(session => (
                    <div key={session.id} style={{ marginBottom: 8 }}>
                      <Space>
                        <Tag color="processing">ПК #{session.computer_id}</Tag>
                        <span>начало: {new Date(session.start_time).toLocaleTimeString('ru-RU')}</span>
                      </Space>
                    </div>
                  ))
                ) : (
                  <Typography.Text type="secondary">Нет активных сессий</Typography.Text>
                )}
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title={<span><ShoppingCartOutlined /> Топ продаж</span>}>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <Tag color={index === 0 ? 'gold' : 'default'}>#{index + 1}</Tag>
                        Товар #{product.id}
                      </span>
                      <span>
                        <strong>{product.revenue.toLocaleString()} ₽</strong>
                        <Typography.Text type="secondary" style={{ marginLeft: 16 }}>
                          ({product.quantity} шт.)
                        </Typography.Text>
                      </span>
                    </div>
                    <Progress
                      percent={Math.round((product.revenue / (topProducts[0]?.revenue || 1)) * 100)}
                      size="small"
                      showInfo={false}
                      strokeColor={index === 0 ? '#faad14' : '#1677ff'}
                    />
                  </div>
                ))
              ) : (
                <Typography.Text type="secondary">Нет данных о продажах</Typography.Text>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default DashboardPage;