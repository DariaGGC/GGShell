import { useMemo } from 'react';
import { Card, Radio, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const { Title } = Typography;

const PERIODS = { today: 'Сегодня', week: 'Неделя', month: 'Месяц', year: 'Год' };

export default function RevenueChart({ sales = [], replenishments = [], period, setPeriod }) {
  const getIndex = (date, periodType) => {
    const now = dayjs();
    const d = dayjs(date);
    if (periodType === 'today') return d.isSame(now, 'day') ? 0 : -1;
    if (periodType === 'week') {
      const diff = now.diff(d, 'day');
      return diff >= 0 && diff < 7 ? 6 - diff : -1;
    }
    if (periodType === 'month') {
      const week = Math.floor(d.date() / 7);
      return week < 4 ? week : -1;
    }
    if (periodType === 'year') return d.month();
    return -1;
  };

  const chartData = useMemo(() => {
    const now = dayjs();
    let labels = [];
    if (period === 'today') labels = [now.format('DD.MM')];
    else if (period === 'week') labels = Array.from({ length: 7 }, (_, i) => now.subtract(6 - i, 'day').format('DD.MM'));
    else if (period === 'month') labels = Array.from({ length: 4 }, (_, i) => `Нед ${i + 1}`);
    else labels = Array.from({ length: 12 }, (_, i) => now.subtract(11 - i, 'month').format('MMM'));

    const data = labels.map(name => ({ name, salesCash: 0, salesCard: 0, refillCash: 0, refillCard: 0 }));

    sales.forEach(s => {
      const idx = getIndex(s.date, period);
      if (idx === -1) return;
      if (s.payment_method?.includes('нал')) data[idx].salesCash += s.total_price || 0;
      else data[idx].salesCard += s.total_price || 0;
    });

    replenishments.forEach(r => {
      const idx = getIndex(r.date, period);
      if (idx === -1) return;
      const method = r.payment_methods?.name?.toLowerCase() || '';
      if (method.includes('нал')) data[idx].refillCash += r.amount || 0;
      else if (method.includes('карт')) data[idx].refillCard += r.amount || 0;
    });

    return data;
  }, [sales, replenishments, period]);

  const total = chartData.reduce((s, d) => s + d.salesCash + d.salesCard + d.refillCash + d.refillCard, 0);

  return (
    <Card
      title={<Title level={4}>📊 Доходы</Title>}
      extra={
        <Radio.Group value={period} onChange={e => setPeriod(e.target.value)} size="small" buttonStyle="solid">
          {Object.entries(PERIODS).map(([k, v]) => <Radio.Button key={k} value={k}>{v}</Radio.Button>)}
        </Radio.Group>
      }
    >
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={v => `${v} ₽`} />
            <Legend />
            <Bar dataKey="salesCash" name="Продажи нал" fill="#52c41a" stackId="sales" />
            <Bar dataKey="salesCard" name="Продажи карта" fill="#1677ff" stackId="sales" />
            <Bar dataKey="refillCash" name="Пополнения нал" fill="#95de64" stackId="refill" />
            <Bar dataKey="refillCard" name="Пополнения карта" fill="#69b1ff" stackId="refill" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>Нет данных</div>
      )}
    </Card>
  );
}