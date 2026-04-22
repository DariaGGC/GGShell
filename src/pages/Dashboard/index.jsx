import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic, Table, Progress, Typography, Radio, Spin } from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { fetchDashboardStats, setPeriod } from '../../store/slices/dashboardSlice';
import RevenueChart from '../../components/Dashboard/RevenueChart';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function DashboardPage() {
  const dispatch = useDispatch();
  const {
    sales = [],
    computers = [],
    users = [],
    replenishments = [],
    isLoading,
    period,
  } = useSelector(state => state.dashboard);

  const [topPeriod, setTopPeriod] = useState('week');

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  useEffect(() => {
  console.log('📊 Sales:', sales);
  console.log('💰 Replenishments:', replenishments);
}, [sales, replenishments]);

  const inPeriod = (date, periodType) => {
    if (!date) return false;
    const d = dayjs(date);
    const now = dayjs();
    if (periodType === 'today') return d.isSame(now, 'day');
    if (periodType === 'week') return d.isAfter(now.subtract(7, 'day'));
    if (periodType === 'month') return d.isAfter(now.subtract(30, 'day'));
    if (periodType === 'year') return d.isAfter(now.subtract(365, 'day'));
    return true;
  };

  // сегодня
  const today = dayjs().format('YYYY-MM-DD');
  const todaySalesTotal = sales
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + (s.total_price || 0), 0);

  const todayCash = replenishments
    .filter(r => r.date === today && r.payment_methods?.name?.toLowerCase().includes('нал'))
    .reduce((s, r) => s + (r.amount || 0), 0);

  const todayCard = replenishments
    .filter(r => r.date === today && r.payment_methods?.name?.toLowerCase().includes('карт'))
    .reduce((s, r) => s + (r.amount || 0), 0);

  const todayTotal = todaySalesTotal + todayCash + todayCard;

  // пользователи
  const totalUsers = users.length;
  const newUsersToday = users.filter(u =>
    u.created_at && dayjs(u.created_at).isSame(dayjs(), 'day')
  ).length;

  // зоны
  const zones = useMemo(() => {
    const zoneMap = {
      1: { name: 'Стандарт', total: 0, busy: 0, maintenance: 0 },
      2: { name: 'VIP', total: 0, busy: 0, maintenance: 0 },
      3: { name: 'Буткемп', total: 0, busy: 0, maintenance: 0 },
    };
    computers.forEach(c => {
      if (!zoneMap[c.zone_id]) return;
      zoneMap[c.zone_id].total++;
      if (c.status === 'Занят') zoneMap[c.zone_id].busy++;
      if (c.status === 'Обслуживание') zoneMap[c.zone_id].maintenance++;
    });
    return Object.values(zoneMap).map(z => ({
      ...z,
      used: z.busy + z.maintenance,
      percent: z.total ? Math.round(((z.busy + z.maintenance) / z.total) * 100) : 0
    }));
  }, [computers]);

// Топ товаров
const topProducts = useMemo(() => {
  const filtered = sales.filter(s => inPeriod(s.date, topPeriod));
  const map = {};
  
  filtered.forEach(s => {
    const id = s.product_id;
    // Берём название из связанной таблицы products
    const name = s.products?.name || `Товар #${id}`;
    
    if (!map[id]) {
      map[id] = { id, name, total: 0, count: 0 };
    }
    map[id].total += s.total_price || 0;
    map[id].count += s.quantity || 0;
  });
  
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}, [sales, topPeriod]);

// Топ пользователей по депозитам
const topDepositors = useMemo(() => {
  const filtered = replenishments.filter(r => inPeriod(r.date, topPeriod));
  const map = {};
  
  filtered.forEach(r => {
    const uid = r.user_id;
    // Берём логин из связанной таблицы users
    const name = r.users?.login || r.users?.name || `Пользователь #${uid}`;
    
    if (!map[uid]) {
      map[uid] = { id: uid, name, total: 0 };
    }
    map[uid].total += r.amount || 0;
  });
  
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}, [replenishments, topPeriod]);

  const productColumns = [
    { title: 'Товар', dataIndex: 'name', key: 'name' },
    { title: 'Продано', dataIndex: 'count', key: 'count', width: 80 },
    { title: 'Сумма', dataIndex: 'total', key: 'total', width: 100, render: v => `${v} ₽` },
  ];

  const depositorColumns = [
    { title: 'Пользователь', dataIndex: 'name', key: 'name' },
    { title: 'Депозит', dataIndex: 'total', key: 'total', width: 100, render: v => `${v} ₽` },
  ];

  return (
    <Spin spinning={isLoading}>
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>📊 Дашборд</Title>

        {/* Верхняя линейка */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<span><RiseOutlined /> Выручка сегодня</span>}
                value={todayTotal}
                suffix="₽"
                valueStyle={{ color: '#389e0d', fontWeight: 700 }}
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 24 }}>
                <div><Text type="secondary">💵 Наличные</Text><br /><strong>{todayCash} ₽</strong></div>
                <div><Text type="secondary">💳 Карта</Text><br /><strong>{todayCard} ₽</strong></div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={<span><UserOutlined /> Пользователи</span>}
                value={totalUsers}
                valueStyle={{ fontWeight: 700 }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">🆕 Новых сегодня: {newUsersToday}</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* График + загрузка зон */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <RevenueChart
              sales={sales}
              replenishments={replenishments}
              period={period}
              setPeriod={p => dispatch(setPeriod(p))}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Card title="📈 Загрузка по зонам">
              {zones.map(z => (
                <div key={z.name} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{z.name}</strong>
                    <span>
                      {z.used} / {z.total}
                      {z.maintenance > 0 && <span style={{ marginLeft: 8, color: '#faad14' }}>🔧{z.maintenance}</span>}
                    </span>
                  </div>
                  <Progress
                    percent={z.percent}
                    status={z.percent > 80 ? 'exception' : 'active'}
                    strokeColor={
                      z.name === 'Стандарт' ? '#1677ff' :
                      z.name === 'VIP' ? '#faad14' : '#52c41a'
                    }
                  />
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {/* Топы */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card
              title="🏆 Топ товаров"
              extra={
                <Radio.Group value={topPeriod} onChange={e => setTopPeriod(e.target.value)} size="small" buttonStyle="solid">
                  <Radio.Button value="today">Сегодня</Radio.Button>
                  <Radio.Button value="week">Неделя</Radio.Button>
                  <Radio.Button value="month">Месяц</Radio.Button>
                  <Radio.Button value="year">Год</Radio.Button>
                </Radio.Group>
              }
            >
              <Table dataSource={topProducts} columns={productColumns} rowKey="id" pagination={false} size="small" />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="👑 Топ по депозитам"
              extra={
                <Radio.Group value={topPeriod} onChange={e => setTopPeriod(e.target.value)} size="small" buttonStyle="solid">
                  <Radio.Button value="today">Сегодня</Radio.Button>
                  <Radio.Button value="week">Неделя</Radio.Button>
                  <Radio.Button value="month">Месяц</Radio.Button>
                  <Radio.Button value="year">Год</Radio.Button>
                </Radio.Group>
              }
            >
              <Table dataSource={topDepositors} columns={depositorColumns} rowKey="id" pagination={false} size="small" />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
}

export default DashboardPage;