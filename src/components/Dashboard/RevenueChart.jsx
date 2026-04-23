import { useMemo, useState } from 'react';
import { Card, Radio, Typography, DatePicker, Space, Button, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/ru_RU';
import './RevenueChart.css';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PERIODS = { week: 'Неделя', month: 'Месяц', year: 'Год' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((entry, index) => (
        <div key={index} className="tooltip-item">
          <span className="tooltip-color" style={{ backgroundColor: entry.color }} />
          <span className="tooltip-name">{entry.name}:</span>
          <span className="tooltip-value">{entry.value?.toLocaleString()} ₽</span>
        </div>
      ))}
      <div className="tooltip-total">
        <span>Всего:</span>
        <span>{total.toLocaleString()} ₽</span>
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
    
    if (intervalType === 'day') return d.diff(startDate, 'day');
    if (intervalType === 'month') return d.diff(startDate, 'month');
    return -1;
  };

  const { chartData, totalRevenue } = useMemo(() => {
    let startDate, endDate, intervalType;
    
    if (mode === 'custom' && customRange) {
      startDate = dayjs(customRange[0]).startOf('day');
      endDate = dayjs(customRange[1]).endOf('day');
      const days = endDate.diff(startDate, 'day') + 1;
      
      intervalType = days <= 31 ? 'day' : 'month';
    } else {
      const now = dayjs();
      endDate = now.endOf('day');
      
      if (period === 'week') {
        startDate = now.subtract(6, 'day').startOf('day');
        intervalType = 'day';
      } else if (period === 'month') {
        startDate = now.subtract(29, 'day').startOf('day');
        intervalType = 'day';
      } else {
        startDate = now.subtract(11, 'month').startOf('month');
        intervalType = 'month';
      }
    }

    const labelArray = [];
    let current = startDate;
    
    if (intervalType === 'day') {
      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        labelArray.push(current.format('DD.MM'));
        current = current.add(1, 'day');
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
        <div className="chart-header">
          <Space>
            <Title level={4} className="chart-title" style={{margin: '0'}}>📊 Доходы</Title>
            <Tag color="green" className="chart-total-tag">
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
                className="chart-range-picker"
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
              <Button size="small" onClick={() => setMode('preset')}>Сбросить</Button>
            </Space>
          )}
        </Space>
      }
      className="revenue-card"
    >
      {totalRevenue > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="salesCash" name="Продажи нал" fill="#52c41a" stackId="revenue" />
            <Bar dataKey="salesCard" name="Продажи карта" fill="#1677ff" stackId="revenue" />
            <Bar dataKey="refillCash" name="Пополнения нал" fill="#95de64" stackId="revenue" />
            <Bar dataKey="refillCard" name="Пополнения карта" fill="#69b1ff" stackId="revenue" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">Нет данных за выбранный период</div>
      )}
    </Card>
  );
}