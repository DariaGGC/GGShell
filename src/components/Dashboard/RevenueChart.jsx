import { Card, Radio, Typography, Empty } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const { Title, Text } = Typography;

function RevenueChart({ sales = [], sessions = [], dateRange, onDateRangeChange }) {
  // Подготовка простых тестовых данных если реальных нет
  const chartData = (() => {
    // Если нет данных — показываем тестовые
    if (!sales?.length && !sessions?.length) {
      return [
        { name: 'Пн', sales: 0, sessions: 0, total: 0 },
        { name: 'Вт', sales: 0, sessions: 0, total: 0 },
        { name: 'Ср', sales: 0, sessions: 0, total: 0 },
        { name: 'Чт', sales: 0, sessions: 0, total: 0 },
        { name: 'Пт', sales: 0, sessions: 0, total: 0 },
        { name: 'Сб', sales: 0, sessions: 0, total: 0 },
        { name: 'Вс', sales: 0, sessions: 0, total: 0 },
      ];
    }

    // Группировка по дням недели (упрощённо)
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const data = days.map(day => ({ name: day, sales: 0, sessions: 0, total: 0 }));

    // Суммируем продажи
    sales.forEach(sale => {
      if (sale.date) {
        const date = new Date(sale.date);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        if (dayIndex >= 0 && dayIndex < 7) {
          data[dayIndex].sales += sale.total_price || 0;
        }
      }
    });

    // Суммируем сессии
    sessions.forEach(session => {
      if (session.end_time) {
        const date = new Date(session.end_time);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        if (dayIndex >= 0 && dayIndex < 7) {
          data[dayIndex].sessions += session.total_cost || 0;
        }
      }
    });

    // Считаем total
    data.forEach(d => { d.total = d.sales + d.sessions; });

    return data;
  })();

  const totalRevenue = chartData.reduce((sum, d) => sum + d.total, 0);
  const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0);
  const totalSessions = chartData.reduce((sum, d) => sum + d.sessions, 0);

  // Если всё по нулям — показываем Empty
  if (totalRevenue === 0) {
    return (
      <Card
        title={<Title level={4}>📈 Доходы</Title>}
        extra={
          <Radio.Group 
            value={dateRange} 
            onChange={(e) => onDateRangeChange(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="week">Неделя</Radio.Button>
            <Radio.Button value="month">Месяц</Radio.Button>
            <Radio.Button value="year">Год</Radio.Button>
          </Radio.Group>
        }
      >
        <Empty 
          description="Нет данных о доходах за выбранный период"
          style={{ padding: '40px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card
      title={<Title level={4}>📈 Доходы</Title>}
      extra={
        <Radio.Group 
          value={dateRange} 
          onChange={(e) => onDateRangeChange(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="week">Неделя</Radio.Button>
          <Radio.Button value="month">Месяц</Radio.Button>
          <Radio.Button value="year">Год</Radio.Button>
        </Radio.Group>
      }
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <Text type="secondary">Общая выручка</Text>
          <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
            {totalRevenue.toLocaleString()} ₽
          </Title>
        </div>
        <div>
          <Text type="secondary">Продажи товаров</Text>
          <Title level={4} style={{ margin: 0 }}>
            {totalSales.toLocaleString()} ₽
          </Title>
        </div>
        <div>
          <Text type="secondary">Игровые сессии</Text>
          <Title level={4} style={{ margin: 0 }}>
            {totalSessions.toLocaleString()} ₽
          </Title>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `${value?.toLocaleString() || 0} ₽`} />
          <Legend />
          <Bar dataKey="sales" name="Продажи" fill="#1677ff" radius={[8, 8, 0, 0]} />
          <Bar dataKey="sessions" name="Сессии" fill="#52c41a" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default RevenueChart;