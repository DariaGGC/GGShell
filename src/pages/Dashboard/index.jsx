import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic, Table, Progress, Typography, Radio, Spin, Tag } from 'antd';
import {
  UserOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
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
    sessions = [],
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
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  // Сегодня
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

  // Вчера
  const yesterdaySalesCash = sales
    .filter(s => s.date === yesterday && s.payment_methods?.name?.toLowerCase().includes('нал'))
    .reduce((sum, s) => sum + (s.total_price || 0), 0);

  const yesterdaySalesCard = sales
    .filter(s => s.date === yesterday && s.payment_methods?.name?.toLowerCase().includes('карт'))
    .reduce((sum, s) => sum + (s.total_price || 0), 0);

  const yesterdayReplenishmentCash = replenishments
    .filter(r => r.date === yesterday && r.payment_methods?.name?.toLowerCase().includes('нал'))
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const yesterdayReplenishmentCard = replenishments
    .filter(r => r.date === yesterday && r.payment_methods?.name?.toLowerCase().includes('карт'))
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const yesterdayCash = yesterdaySalesCash + yesterdayReplenishmentCash;
  const yesterdayCard = yesterdaySalesCard + yesterdayReplenishmentCard;
  const yesterdayTotal = yesterdayCash + yesterdayCard;

  // Сравнение с вчера
  const revenueChange = yesterdayTotal > 0 
    ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
    : 0;
  const cashChange = yesterdayCash > 0 
    ? Math.round(((todayCash - yesterdayCash) / yesterdayCash) * 100)
    : 0;
  const cardChange = yesterdayCard > 0 
    ? Math.round(((todayCard - yesterdayCard) / yesterdayCard) * 100)
    : 0;

  // ==================== ПОЛЬЗОВАТЕЛИ ====================
  const totalUsers = users.length;

  // Новые пользователи
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

  // Предыдущие периоды
  const prevDayUsers = users.filter(u => {
    if (!u.created_at) return false;
    const d = dayjs(u.created_at);
    const y = dayjs().subtract(1, 'day');
    return d.isAfter(y.startOf('day')) && d.isBefore(y.endOf('day'));
  }).length;

  const prevWeekUsers = users.filter(u => {
    if (!u.created_at) return false;
    const d = dayjs(u.created_at);
    const start = dayjs().subtract(14, 'day');
    const end = dayjs().subtract(7, 'day');
    return d.isAfter(start) && d.isBefore(end);
  }).length;

  const prevMonthUsers = users.filter(u => {
    if (!u.created_at) return false;
    const d = dayjs(u.created_at);
    const start = dayjs().subtract(60, 'day');
    const end = dayjs().subtract(30, 'day');
    return d.isAfter(start) && d.isBefore(end);
  }).length;

  const prevYearUsers = users.filter(u => {
    if (!u.created_at) return false;
    const d = dayjs(u.created_at);
    const start = dayjs().subtract(730, 'day');
    const end = dayjs().subtract(365, 'day');
    return d.isAfter(start) && d.isBefore(end);
  }).length;

  const getTrend = (current, prev) => {
    if (prev === 0) return { value: 0, color: '#8c8c8c', arrow: '' };
    const diff = current - prev;
    const percent = Math.round((diff / prev) * 100);
    return {
      value: Math.abs(percent),
      color: diff >= 0 ? '#52c41a' : '#ff4d4f',
      arrow: diff >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />,
    };
  };

  const dayTrend = getTrend(newUsersToday, prevDayUsers);
  const weekTrend = getTrend(newUsersWeek, prevWeekUsers);
  const monthTrend = getTrend(newUsersMonth, prevMonthUsers);
  const yearTrend = getTrend(newUsersYear, prevYearUsers);

  // Активные vs Неактивные
  const activeUsers = users.filter(u => {
    const lastActive = u.lastVisitDate || u.activeSession?.start_time || u.created_at;
    if (!lastActive) return false;
    return dayjs(lastActive).isAfter(dayjs().subtract(7, 'day'));
  }).length;

  const inactiveUsers = users.filter(u => {
    const lastActive = u.lastVisitDate || u.activeSession?.start_time || u.created_at;
    if (!lastActive) return true;
    return dayjs(lastActive).isBefore(dayjs().subtract(30, 'day'));
  }).length;

  // Последняя регистрация
const lastRegistration = useMemo(() => {
  const sortedUsers = [...users].sort((a, b) => {
    return dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf();
  });
  const lastUser = sortedUsers[0];
  if (!lastUser?.created_at) return '—';
  return dayjs(lastUser.created_at).format('DD.MM HH:mm');
}, [users]);

// Средний депозит активных пользователей
const avgActiveDeposit = useMemo(() => {
  if (activeUsers === 0) return 0;
  const activeUsersList = users.filter(u => {
    const lastActive = u.lastVisitDate || u.activeSession?.start_time || u.created_at;
    if (!lastActive) return false;
    return dayjs(lastActive).isAfter(dayjs().subtract(7, 'day'));
  });
  const totalBalance = activeUsersList.reduce((sum, u) => sum + (u.balance || 0), 0);
  return Math.round(totalBalance / activeUsers);
}, [users, activeUsers]);

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

  // ==================== ПОПУЛЯРНОСТЬ ЗОН ====================
  const zonePopularity = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const zoneSessions = { 1: 0, 2: 0, 3: 0 };
    
    sessions.forEach(session => {
      if (session.start_time && dayjs(session.start_time).format('YYYY-MM-DD') === todayStr) {
        const zoneId = session.computers?.zone_id;
        if (zoneId && zoneSessions[zoneId] !== undefined) {
          zoneSessions[zoneId]++;
        }
      }
    });
    
    const total = zoneSessions[1] + zoneSessions[2] + zoneSessions[3];
    
    return {
      1: { sessions: zoneSessions[1], percent: total ? Math.round((zoneSessions[1] / total) * 100) : 0 },
      2: { sessions: zoneSessions[2], percent: total ? Math.round((zoneSessions[2] / total) * 100) : 0 },
      3: { sessions: zoneSessions[3], percent: total ? Math.round((zoneSessions[3] / total) * 100) : 0 },
      total
    };
  }, [sessions]);

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
    
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [sales, topPeriod]);

  // ==================== ТОП ПО ДЕПОЗИТАМ ====================
  const topDepositors = useMemo(() => {
    const filtered = replenishments.filter(r => inPeriod(r.date, topPeriod));
    const map = {};
    
    filtered.forEach(r => {
      const uid = r.user_id;
      const name = r.users?.login || r.users?.name || `Пользователь #${uid}`;
      
      if (!map[uid]) map[uid] = { id: uid, name, total: 0 };
      map[uid].total += r.amount || 0;
    });
    
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [replenishments, topPeriod]);

  // ==================== КОЛОНКИ ТАБЛИЦ ====================
  const productColumns = [
    { title: 'Товар', dataIndex: 'name', key: 'name' },
    { title: 'Продано', dataIndex: 'count', key: 'count', width: 80 },
    { title: 'Сумма', dataIndex: 'total', key: 'total', width: 100, render: v => `${v?.toLocaleString() || 0} ₽` },
  ];

  const depositorColumns = [
    { title: 'Пользователь', dataIndex: 'name', key: 'name' },
    { title: 'Депозит', dataIndex: 'total', key: 'total', width: 100, render: v => `${v?.toLocaleString() || 0} ₽` },
  ];

  // ==================== РЕНДЕР ====================
  return (
    <Spin spinning={isLoading}>
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>📊 Дашборд</Title>

        {/* ВЕРХНЯЯ ЛИНЕЙКА */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {/* Выручка сегодня */}
          <Col xs={24} sm={12} lg={12}>
            <Card style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                    <Statistic
                      title={<span><RiseOutlined /> Выручка сегодня</span>}
                      value={todayTotal}
                      suffix="₽"
                      valueStyle={{ color: '#389e0d', fontWeight: 700 }}
                    />
                    <span style={{ 
                      color: revenueChange >= 0 ? '#52c41a' : '#ff4d4f', 
                      fontSize: 18, 
                      fontWeight: 600 
                    }}>
                      {revenueChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(revenueChange)}%
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div>
                      <Text type="secondary">💵 Наличные</Text><br />
                      <strong>{todayCash.toLocaleString()} ₽</strong>
                      <span style={{ marginLeft: 12, color: cashChange >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 14 }}>
                        {cashChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(cashChange)}%
                      </span>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        Продажи: {todaySalesCash.toLocaleString()} ₽ · Пополнения: {todayReplenishmentCash.toLocaleString()} ₽
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary">💳 Карта</Text><br />
                      <strong>{todayCard.toLocaleString()} ₽</strong>
                      <span style={{ marginLeft: 12, color: cardChange >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 14 }}>
                        {cardChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(cardChange)}%
                      </span>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        Продажи: {todaySalesCard.toLocaleString()} ₽ · Пополнения: {todayReplenishmentCard.toLocaleString()} ₽
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ width: 1, height: 130, background: '#f0f0f0' }} />
                
                <div style={{ minWidth: 120 }}>
                  <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Вчера</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 20 }}>{yesterdayTotal.toLocaleString()} ₽</Text>
                    <div style={{ marginTop: 12, fontSize: 14 }}>
                      <div>💵 {yesterdayCash.toLocaleString()} ₽</div>
                      <div style={{ marginTop: 4 }}>💳 {yesterdayCard.toLocaleString()} ₽</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

{/* Пользователи */}
<Col xs={24} sm={12} lg={12}>
  <Card style={cardStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      {/* Левая часть — Пользователи (по центру) */}
      <div style={{ textAlign: 'center', minWidth: 100 }}>
        <Text type="secondary" style={{ fontSize: 14 }}>
          <UserOutlined /> Пользователи
        </Text>
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2 }}>
          {totalUsers}
        </div>
      </div>

      {/* Правая часть — Активные / Неактивные */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>🟢 Активные (7 дн)</Text>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{activeUsers}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>🔴 Неактивные (30+ дн)</Text>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#ff4d4f' }}>{inactiveUsers}</div>
        </div>
      </div>
    </div>

    {/* Средняя строка: новых за периоды с трендами */}
    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <Text type="secondary" style={{ fontSize: 13 }}>🆕 Новых:</Text>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Text type="secondary">Сегодня</Text>
        <strong>{newUsersToday}</strong>
        {dayTrend.value > 0 && (
          <span style={{ color: dayTrend.color, fontSize: 12 }}>
            {dayTrend.arrow} {dayTrend.value}%
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Text type="secondary">Неделя</Text>
        <strong>{newUsersWeek}</strong>
        {weekTrend.value > 0 && (
          <span style={{ color: weekTrend.color, fontSize: 12 }}>
            {weekTrend.arrow} {weekTrend.value}%
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Text type="secondary">Месяц</Text>
        <strong>{newUsersMonth}</strong>
        {monthTrend.value > 0 && (
          <span style={{ color: monthTrend.color, fontSize: 12 }}>
            {monthTrend.arrow} {monthTrend.value}%
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Text type="secondary">Год</Text>
        <strong>{newUsersYear}</strong>
        {yearTrend.value > 0 && (
          <span style={{ color: yearTrend.color, fontSize: 12 }}>
            {yearTrend.arrow} {yearTrend.value}%
          </span>
        )}
      </div>
    </div>

    {/* Нижняя строка: последняя регистрация + средний депозит активных */}
    <div style={{ 
      marginTop: 16, 
      paddingTop: 12, 
      borderTop: '1px solid #f0f0f0',
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>🕐 Последняя регистрация</Text>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{lastRegistration}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>💰 Средний депозит активных</Text>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1677ff' }}>
          {avgActiveDeposit.toLocaleString()} ₽
        </div>
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
              {zones.map(z => {
                const zoneId = z.name === 'Стандарт' ? 1 : z.name === 'VIP' ? 2 : 3;
                const popularity = zonePopularity[zoneId];
                
                return (
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
                );
              })}
              
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: 13, marginBottom: 12, display: 'block' }}>
                  📊 Популярность сегодня ({zonePopularity.total} сессий)
                </Text>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="blue">Стандарт</Tag>
                    <div><strong>{zonePopularity[1].sessions}</strong></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{zonePopularity[1].percent}%</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="gold">VIP</Tag>
                    <div><strong>{zonePopularity[2].sessions}</strong></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{zonePopularity[2].percent}%</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="green">Буткемп</Tag>
                    <div><strong>{zonePopularity[3].sessions}</strong></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{zonePopularity[3].percent}%</Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ТОПЫ */}
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
              style={cardStyle}
            >
              <Table dataSource={topProducts} columns={productColumns} rowKey="id" pagination={false} size="small" locale={{ emptyText: 'Нет данных' }} />
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
              style={cardStyle}
            >
              <Table dataSource={topDepositors} columns={depositorColumns} rowKey="id" pagination={false} size="small" locale={{ emptyText: 'Нет данных' }} />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
}

export default DashboardPage;