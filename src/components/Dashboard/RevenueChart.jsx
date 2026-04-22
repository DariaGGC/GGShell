import { useMemo, useState } from 'react';
import { Card, Radio, Typography, DatePicker, Space, Button, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/ru_RU';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PERIODS = { today: 'Сегодня', week: 'Неделя', month: 'Месяц', year: 'Год' };

// Кастомный тултип
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  // Считаем общую сумму для этой точки
  const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

  return (
    <div style={{
      background: 'white',
      padding: '12px 16px',
      borderRadius: 8,
      border: '1px solid #d9d9d9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{label}</div>
      {payload.map((entry, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: entry.color
          }} />
          <span style={{ flex: 1 }}>{entry.name}:</span>
          <span style={{ fontWeight: 500 }}>{entry.value?.toLocaleString()} ₽</span>
        </div>
      ))}
      <div style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid #e8e8e8',
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: 'bold'
      }}>
        <span>Всего:</span>
        <span style={{ color: '#389e0d' }}>{total.toLocaleString()} ₽</span>
      </div>
    </div>
  );
};

export default function RevenueChart({ sales = [], replenishments = [], period, setPeriod }) {
  const [customRange, setCustomRange] = useState(null);
  const [mode, setMode] = useState('preset');

  const getIndex = (date, startDate, endDate, intervalType) => {
    const d = dayjs(date);
    if (d.isBefore(startDate) || d.isAfter(endDate)) return -1;
    
    if (intervalType === 'day') {
      return d.diff(startDate, 'day');
    }
    if (intervalType === 'week') {
      return Math.floor(d.diff(startDate, 'day') / 7);
    }
    if (intervalType === 'month') {
      return d.diff(startDate, 'month');
    }
    return -1;
  };

  const { chartData, totalRevenue } = useMemo(() => {
    let startDate, endDate, intervalType;
    
    if (mode === 'custom' && customRange) {
      startDate = dayjs(customRange[0]).startOf('day');
      endDate = dayjs(customRange[1]).endOf('day');
      const days = endDate.diff(startDate, 'day') + 1;
      
      if (days <= 7) intervalType = 'day';
      else if (days <= 60) intervalType = 'week';
      else intervalType = 'month';
    } else {
      const now = dayjs();
      endDate = now.endOf('day');
      
      if (period === 'today') {
        startDate = now.startOf('day');
        intervalType = 'day';
      } else if (period === 'week') {
        startDate = now.subtract(6, 'day').startOf('day');
        intervalType = 'day';
      } else if (period === 'month') {
        startDate = now.subtract(29, 'day').startOf('day');
        intervalType = 'week';
      } else {
        startDate = now.subtract(11, 'month').startOf('month');
        intervalType = 'month';
      }
    }

    // Генерация labels
    const labelArray = [];
    let current = startDate;
    
    if (intervalType === 'day') {
      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        labelArray.push(current.format('DD.MM'));
        current = current.add(1, 'day');
      }
    } else if (intervalType === 'week') {
      let weekNum = 1;
      while (current.isBefore(endDate)) {
        labelArray.push(`Нед ${weekNum++}`);
        current = current.add(1, 'week');
      }
    } else {
      while (current.isBefore(endDate) || current.isSame(endDate, 'month')) {
        labelArray.push(current.format('MMM YY'));
        current = current.add(1, 'month');
      }
    }

    const data = labelArray.map(name => ({ 
      name, 
      salesCash: 0, 
      salesCard: 0, 
      refillCash: 0, 
      refillCard: 0 
    }));

    // Продажи
    sales.forEach(s => {
      if (!s.date) return;
      const idx = getIndex(s.date, startDate, endDate, intervalType);
      if (idx === -1 || idx >= data.length) return;
      
      const method = s.payment_methods?.name?.toLowerCase() || '';
      if (method.includes('нал')) {
        data[idx].salesCash += s.total_price || 0;
      } else if (method.includes('карт')) {
        data[idx].salesCard += s.total_price || 0;
      }
    });

    // Пополнения
    replenishments.forEach(r => {
      if (!r.date) return;
      const idx = getIndex(r.date, startDate, endDate, intervalType);
      if (idx === -1 || idx >= data.length) return;
      
      const method = r.payment_methods?.name?.toLowerCase() || '';
      if (method.includes('нал')) {
        data[idx].refillCash += r.amount || 0;
      } else if (method.includes('карт')) {
        data[idx].refillCard += r.amount || 0;
      }
    });

    const total = data.reduce((s, d) => s + d.salesCash + d.salesCard + d.refillCash + d.refillCard, 0);

    return { chartData: data, totalRevenue: total };
  }, [sales, replenishments, period, mode, customRange]);

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>📊 Доходы</Title>
            <Tag color="green" style={{ fontSize: 16, padding: '4px 12px' }}>
              {totalRevenue.toLocaleString()} ₽
            </Tag>
          </Space>
        </div>
      }
      extra={
        <Space>
          {mode === 'preset' ? (
            <>
              <Radio.Group value={period} onChange={e => setPeriod(e.target.value)} size="small" buttonStyle="solid">
                {Object.entries(PERIODS).map(([k, v]) => (
                  <Radio.Button key={k} value={k}>{v}</Radio.Button>
                ))}
              </Radio.Group>
              <RangePicker
                locale={locale}
                format="DD.MM.YYYY"
                placeholder={['Начало', 'Конец']}
                onChange={(dates) => {
                  if (dates) {
                    setCustomRange(dates);
                    setMode('custom');
                  }
                }}
                size="small"
                style={{ marginLeft: 8 }}
              />
            </>
          ) : (
            <Space>
              <RangePicker
                locale={locale}
                value={customRange}
                format="DD.MM.YYYY"
                onChange={(dates) => setCustomRange(dates)}
                size="small"
              />
              <Button size="small" onClick={() => setMode('preset')}>
                Сбросить
              </Button>
            </Space>
          )}
        </Space>
      }
      style={{ height: '100%' }}
    >
      {totalRevenue > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="salesCash" name="Продажи нал" fill="#52c41a" stackId="sales" />
            <Bar dataKey="salesCard" name="Продажи карта" fill="#1677ff" stackId="sales" />
            <Bar dataKey="refillCash" name="Пополнения нал" fill="#95de64" stackId="refill" />
            <Bar dataKey="refillCard" name="Пополнения карта" fill="#69b1ff" stackId="refill" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
          Нет данных за выбранный период
        </div>
      )}
    </Card>
  );
}