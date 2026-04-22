import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card, Tabs, Table, Button, Space, Spin, Alert,
  Statistic, Row, Col, Typography, DatePicker, Tag
} from 'antd';
import {
  ReloadOutlined, ShoppingCartOutlined,
  WalletOutlined, HistoryOutlined
} from '@ant-design/icons';
import {
  fetchSales, fetchReplenishments, fetchSessionsHistory, setActiveTab
} from '../../store/slices/journalSlice';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import locale from 'antd/es/date-picker/locale/ru_RU';
import { formatMoscowDateTime } from '../../utils/dateUtils';
import './Journal.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('ru');

const { Title } = Typography;
const { RangePicker } = DatePicker;

function JournalPage() {
  const dispatch = useDispatch();
  const { sales, replenishments, sessionsHistory, isLoading, activeTab, error } =
    useSelector(state => state.journal);

  const [dateRange, setDateRange] = useState([
    dayjs().startOf('day'),
    dayjs().add(1, 'day').endOf('day')
  ]);

  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchReplenishments());
    dispatch(fetchSessionsHistory());
  }, [dispatch]);

  const handleRangeChange = (dates) => {
    if (!dates) {
      setDateRange([dayjs().startOf('day'), dayjs().add(1, 'day').endOf('day')]);
      return;
    }
    setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
  };

  const filterByDateRange = (data, dateField = 'date') => {
    if (!dateRange?.[0] || !dateRange?.[1]) return data;
    const [startDate, endDate] = dateRange;
    return data.filter(item => {
      const itemDate = dayjs(item[dateField]);
      return itemDate.isSameOrAfter(startDate) && itemDate.isSameOrBefore(endDate);
    });
  };

  const filteredSales = useMemo(() => filterByDateRange(sales, 'date'), [sales, dateRange]);
  const filteredReplenishments = useMemo(() => filterByDateRange(replenishments, 'date'), [replenishments, dateRange]);
  const filteredSessions = useMemo(() => filterByDateRange(sessionsHistory, 'start_time'), [sessionsHistory, dateRange]);

  const salesColumns = [
    { title: 'Дата', dataIndex: 'date', key: 'date', width: 120, render: d => dayjs(d).format('DD.MM.YYYY') },
    { title: 'Время', dataIndex: 'time', key: 'time', width: 100 },
    { title: 'Товар', dataIndex: ['products', 'name'], key: 'product' },
    { title: 'Кол-во', dataIndex: 'quantity', key: 'quantity', width: 80 },
    {
      title: 'Сумма', dataIndex: 'total_price', key: 'total_price', width: 110,
      render: v => <span className="sales-amount">{v} ₽</span>
    },
    {
      title: 'Оплата', dataIndex: ['payment_methods', 'name'], key: 'payment_method', width: 120,
      render: name => {
        if (!name) return <Tag>—</Tag>;
        const color = name.toLowerCase().includes('нал') ? 'green' : 'blue';
        return <Tag color={color}>{name}</Tag>;
      }
    }
  ];

  const replenishmentColumns = [
    { title: 'Дата', dataIndex: 'date', key: 'date', width: 120, render: d => dayjs(d).format('DD.MM.YYYY') },
    { title: 'Время', dataIndex: 'time', key: 'time', width: 100 },
    { title: 'Клиент', dataIndex: ['users', 'login'], key: 'user' },
    {
      title: 'Сумма', dataIndex: 'amount', key: 'amount', width: 130,
      render: v => <span className="replenishment-amount">+{v} ₽</span>
    },
    {
      title: 'Способ', dataIndex: ['payment_methods', 'name'], key: 'method', width: 130,
      render: name => {
        if (!name) return <Tag>—</Tag>;
        const color = name.toLowerCase().includes('нал') ? 'green' : 'blue';
        return <Tag color={color}>{name}</Tag>;
      }
    }
  ];

  const sessionsColumns = [
    { title: 'Клиент', dataIndex: ['users', 'login'], key: 'user' },
    { title: 'ПК', dataIndex: ['computers', 'number'], key: 'computer', width: 70, render: n => `№${n}` },
    {
      title: 'Начало', dataIndex: 'start_time', key: 'start_time', width: 160,
      render: t => formatMoscowDateTime(t, 'DD.MM.YYYY HH:mm')
    },
    {
      title: 'Конец', dataIndex: 'end_time', key: 'end_time', width: 160,
      render: t => formatMoscowDateTime(t, 'DD.MM.YYYY HH:mm')
    },
    {
      title: 'Длит.', key: 'duration', width: 100,
      render: (_, r) => {
        if (!r.end_time) return '—';
        const minutes = dayjs(r.end_time).diff(dayjs(r.start_time), 'minute');
        return `${Math.floor(minutes / 60)}ч ${minutes % 60}мин`;
      }
    },
    {
      title: 'Стоимость', dataIndex: 'total_cost', key: 'total_cost', width: 110,
      render: v => <span className="session-cost">{v} ₽</span>
    }
  ];

  const totalSales = filteredSales.reduce((s, i) => s + (i.total_price || 0), 0);
  const totalReplenishments = filteredReplenishments.reduce((s, i) => s + (i.amount || 0), 0);
  const totalRevenue = totalSales + totalReplenishments;

  const tabItems = [
    {
      key: 'sales',
      label: <span><ShoppingCartOutlined /> Продажи ({filteredSales.length})</span>,
      children: (
        <Table columns={salesColumns} dataSource={filteredSales} rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `Всего ${t} записей` }}
          scroll={{ x: 750 }} />
      )
    },
    {
      key: 'replenishments',
      label: <span><WalletOutlined /> Пополнения ({filteredReplenishments.length})</span>,
      children: (
        <Table columns={replenishmentColumns} dataSource={filteredReplenishments} rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `Всего ${t} записей` }}
          scroll={{ x: 600 }} />
      )
    },
    {
      key: 'sessions',
      label: <span><HistoryOutlined /> Сессии ({filteredSessions.length})</span>,
      children: (
        <Table columns={sessionsColumns} dataSource={filteredSessions} rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `Всего ${t} записей` }}
          scroll={{ x: 800 }} />
      )
    }
  ];

  if (error) {
    return (
      <Alert message="Ошибка загрузки" description={error} type="error" showIcon
        action={<Button size="small" onClick={() => { dispatch(fetchSales()); dispatch(fetchReplenishments()); dispatch(fetchSessionsHistory()); }}>Повторить</Button>} />
    );
  }

  return (
    <div className="journal-page">
      <div className="journal-header">
        <Title level={2}>📋 Журнал</Title>
        <Space>
          <RangePicker locale={locale} value={dateRange} onChange={handleRangeChange}
            format="DD.MM.YYYY" placeholder={['Начало', 'Конец']} allowClear={false} />
          <Button icon={<ReloadOutlined />} onClick={() => { dispatch(fetchSales()); dispatch(fetchReplenishments()); dispatch(fetchSessionsHistory()); }} loading={isLoading}>
            Обновить
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="journal-stats">
        <Col span={8}>
          <Card><Statistic title="Общая выручка" value={totalRevenue} suffix="₽" prefix={<ShoppingCartOutlined />} styles={{ content: { color: '#52c41a' } }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Выручка от продаж" value={totalSales} suffix="₽" prefix={<ShoppingCartOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Пополнения баланса" value={totalReplenishments} suffix="₽" prefix={<WalletOutlined />} styles={{ content: { color: '#1677ff' } }} /></Card>
        </Col>
      </Row>

      <Card>
        <Spin spinning={isLoading}>
          <Tabs activeKey={activeTab} onChange={key => dispatch(setActiveTab(key))} items={tabItems} />
        </Spin>
      </Card>
    </div>
  );
}

export default JournalPage;