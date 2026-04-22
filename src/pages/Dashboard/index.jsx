import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic, Table, Progress, Typography, Radio, Spin, Tag } from 'antd';
import {
  UserOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { fetchDashboardStats, setPeriod } from '../../store/slices/dashboardSlice';
import RevenueChart from '../../components/Dashboard/RevenueChart';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const cardStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

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

  // Проверка вхождения даты в период (для топов)
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

  // ==================== ВЫРУЧКА СЕГОДНЯ ====================
  const today = dayjs().format('YYYY-MM-DD');

  const todaySalesCash = sales
    .filter(s => s.date === today && s.payment_methods?.name?.toLowerCase().includes('нал'))
    .reduce((sum, s) => sum + (s.total_price || 0), 0);

  const todaySalesCard = sales
    .filter(s => s.date === today && s.payment_methods?.name?.toLowerCase().includes('карт'))
    .reduce((sum, s) => sum + (s.total_price || 0), 0);

  const todayReplenishmentCash = replenishments
    .filter(r => r.date === today && r.payment_methods?.name?.toLowerCase().includes('нал'))
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const todayReplenishmentCard = replenishments
    .filter(r => r.date === today && r.payment_methods?.name?.toLowerCase().includes('карт'))
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const todayCash = todaySalesCash + todayReplenishmentCash;
  const todayCard = todaySalesCard + todayReplenishmentCard;
  const todayTotal = todayCash + todayCard;

  // ==================== ПОЛЬЗОВАТЕЛИ ====================
  const totalUsers = users.length;

  const newUsersToday = users.filter(u => 
    u.created_at && dayjs(u.created_at).isSame(dayjs(), 'day')
  ).length;

  const newUsersWeek = users.filter(u => 
    u.created_at && dayjs(u.created_at).isAfter(dayjs().subtract(7, 'day'))
  ).length;

  const newUsersMonth = users.filter(u => 
    u.created_at && dayjs(u.created_at).isAfter(dayjs().subtract(30, 'day'))
  ).length;

  const newUsersYear = users.filter(u => 
    u.created_at && dayjs(u.created_at).isAfter(dayjs().subtract(365, 'day'))
  ).length;

  // ==================== ЗАГРУЗКА ПО ЗОНАМ ====================
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

  // ==================== ТОП ТОВАРОВ ====================
  const topProducts = useMemo(() => {
    const filtered = sales.filter(s => inPeriod(s.date, topPeriod));
    const map = {};
    
    filtered.forEach(s => {
      const id = s.product_id;
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

  // ==================== ТОП ПО ДЕПОЗИТАМ ====================
  const topDepositors = useMemo(() => {
    const filtered = replenishments.filter(r => inPeriod(r.date, topPeriod));
    const map = {};
    
    filtered.forEach(r => {
      const uid = r.user_id;
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

  // ==================== КОЛОНКИ ТАБЛИЦ ====================
  const productColumns = [
    { title: 'Товар', dataIndex: 'name', key: 'name' },
    { title: 'Продано', dataIndex: 'count', key: 'count', width: 80 },
    { 
      title: 'Сумма', 
      dataIndex: 'total', 
      key: 'total', 
      width: 100, 
      render: v => `${v?.toLocaleString() || 0} ₽` 
    },
  ];

  const depositorColumns = [
    { title: 'Пользователь', dataIndex: 'name', key: 'name' },
    { 
      title: 'Депозит', 
      dataIndex: 'total', 
      key: 'total', 
      width: 100, 
      render: v => `${v?.toLocaleString() || 0} ₽` 
    },
  ];

  // ==================== РЕНДЕР ====================
  return (
    <Spin spinning={isLoading}>
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>📊 Дашборд</Title>

        {/* ВЕРХНЯЯ ЛИНЕЙКА: Выручка + Пользователи */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {/* Выручка сегодня */}
          <Col xs={24} sm={12} lg={12}>
            <Card style={cardStyle}>
              <Statistic
                title={<span><RiseOutlined /> Выручка сегодня</span>}
                value={todayTotal}
                suffix="₽"
                valueStyle={{ color: '#389e0d', fontWeight: 700 }}
              />
              <div style={{ marginTop: 16, display: 'flex', gap: 32 }}>
                <div>
                  <Text type="secondary">💵 Наличные</Text><br />
                  <strong>{todayCash.toLocaleString()} ₽</strong>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    <div>Продажи: {todaySalesCash.toLocaleString()} ₽</div>
                    <div>Пополнения: {todayReplenishmentCash.toLocaleString()} ₽</div>
                  </div>
                </div>
                <div>
                  <Text type="secondary">💳 Карта</Text><br />
                  <strong>{todayCard.toLocaleString()} ₽</strong>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    <div>Продажи: {todaySalesCard.toLocaleString()} ₽</div>
                    <div>Пополнения: {todayReplenishmentCard.toLocaleString()} ₽</div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Пользователи */}
          <Col xs={24} sm={12} lg={12}>
            <Card style={cardStyle}>
              <Statistic
                title={<span><UserOutlined /> Пользователи</span>}
                value={totalUsers}
                valueStyle={{ fontWeight: 700 }}
              />
              <div style={{ marginTop: 20 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>🆕 Новых:</Text>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 24 }}>
                <div>
                  <Text type="secondary">Сегодня</Text><br />
                  <strong style={{ fontSize: 18 }}>{newUsersToday}</strong>
                </div>
                <div>
                  <Text type="secondary">Неделя</Text><br />
                  <strong style={{ fontSize: 18 }}>{newUsersWeek}</strong>
                </div>
                <div>
                  <Text type="secondary">Месяц</Text><br />
                  <strong style={{ fontSize: 18 }}>{newUsersMonth}</strong>
                </div>
                <div>
                  <Text type="secondary">Год</Text><br />
                  <strong style={{ fontSize: 18 }}>{newUsersYear}</strong>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ГРАФИК ДОХОДОВ + ЗАГРУЗКА ПО ЗОНАМ */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <RevenueChart
              sales={sales}
              replenishments={replenishments}
              period={period}
              setPeriod={(p) => dispatch(setPeriod(p))}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Card title="📈 Загрузка по зонам" style={cardStyle}>
              {zones.map(z => (
                <div key={z.name} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{z.name}</strong>
                    <span>
                      {z.used} / {z.total}
                      {z.maintenance > 0 && (
                        <span style={{ marginLeft: 8, color: '#faad14' }}>🔧 {z.maintenance}</span>
                      )}
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

        {/* ТОП ТОВАРОВ + ТОП ПО ДЕПОЗИТАМ */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card
              title="🏆 Топ товаров"
              extra={
                <Radio.Group 
                  value={topPeriod} 
                  onChange={e => setTopPeriod(e.target.value)} 
                  size="small" 
                  buttonStyle="solid"
                >
                  <Radio.Button value="today">Сегодня</Radio.Button>
                  <Radio.Button value="week">Неделя</Radio.Button>
                  <Radio.Button value="month">Месяц</Radio.Button>
                  <Radio.Button value="year">Год</Radio.Button>
                </Radio.Group>
              }
              style={cardStyle}
            >
              <Table
                dataSource={topProducts}
                columns={productColumns}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: 'Нет данных' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="👑 Топ по депозитам"
              extra={
                <Radio.Group 
                  value={topPeriod} 
                  onChange={e => setTopPeriod(e.target.value)} 
                  size="small" 
                  buttonStyle="solid"
                >
                  <Radio.Button value="today">Сегодня</Radio.Button>
                  <Radio.Button value="week">Неделя</Radio.Button>
                  <Radio.Button value="month">Месяц</Radio.Button>
                  <Radio.Button value="year">Год</Radio.Button>
                </Radio.Group>
              }
              style={cardStyle}
            >
              <Table
                dataSource={topDepositors}
                columns={depositorColumns}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{ emptyText: 'Нет данных' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
}

export default DashboardPage;