import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Spin,
  Alert,
  Statistic,
  Row,
  Col,
  Typography,
  DatePicker,
  Tag,  // ← ДОБАВИТЬ
} from 'antd';
import {
  ReloadOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  fetchSales,
  fetchReplenishments,
  fetchSessionsHistory,
  setActiveTab,
} from '../../store/slices/journalSlice';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import locale from 'antd/es/date-picker/locale/ru_RU';
import { formatMoscowDateTime } from '../../utils/dateUtils';

// Подключаем плагины
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('ru');

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Настройка локали для dayjs
dayjs.locale('ru');

function JournalPage() {
  const dispatch = useDispatch();
  const {
    sales,
    replenishments,
    sessionsHistory,
    isLoading,
    activeTab,
    error,
  } = useSelector(state => state.journal);

  // По умолчанию — сегодня и завтра (с 00:00 сегодня до 23:59 завтра)
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('day'),
    dayjs().add(1, 'day').endOf('day')
  ]);

  useEffect(() => {
    loadAllData();
  }, [dispatch]);

  const loadAllData = () => {
    dispatch(fetchSales());
    dispatch(fetchReplenishments());
    dispatch(fetchSessionsHistory());
  };

  // Обработчик изменения диапазона дат
  const handleRangeChange = (dates) => {
    if (!dates) {
      setDateRange([
        dayjs().startOf('day'),
        dayjs().add(1, 'day').endOf('day')
      ]);
      return;
    }
    setDateRange([
      dates[0].startOf('day'),
      dates[1].endOf('day')
    ]);
  };

  // Фильтрация по датам (включая границы)
  const filterByDateRange = (data, dateField = 'date') => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return data;
    
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    
    return data.filter(item => {
      const itemDate = dayjs(item[dateField]);
      return (itemDate.isSameOrAfter(startDate) && itemDate.isSameOrBefore(endDate));
    });
  };

  const filteredSales = useMemo(() => filterByDateRange(sales, 'date'), [sales, dateRange]);
  const filteredReplenishments = useMemo(() => filterByDateRange(replenishments, 'date'), [replenishments, dateRange]);
  const filteredSessions = useMemo(() => filterByDateRange(sessionsHistory, 'end_time'), [sessionsHistory, dateRange]);

  // Колонки для таблицы продаж
  const salesColumns = [
  {
    title: 'Дата',
    dataIndex: 'date',
    key: 'date',
    width: 120,
    render: (date) => dayjs(date).format('DD.MM.YYYY'),
  },
  {
    title: 'Время',
    dataIndex: 'time',
    key: 'time',
    width: 100,
  },
  {
    title: 'Товар',
    dataIndex: ['products', 'name'],
    key: 'product',
  },
  {
    title: 'Кол-во',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 80,
  },
  {
    title: 'Сумма',
    dataIndex: 'total_price',
    key: 'total_price',
    width: 110,
    render: (value) => (
      <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
        {value} ₽
      </span>
    ),
  },
  {
    title: 'Оплата',
    dataIndex: ['payment_methods', 'name'],
    key: 'payment_method',
    width: 120,
    render: (name) => {
      if (!name) return <Tag>—</Tag>;
      const color = name.toLowerCase().includes('нал') ? 'green' : 'blue';
      return <Tag color={color}>{name}</Tag>;
    },
  },
];

  // Колонки для таблицы пополнений
  const replenishmentColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Время',
      dataIndex: 'time',
      key: 'time',
      width: 100,
    },
    {
      title: 'Клиент',
      dataIndex: ['users', 'login'],
      key: 'user',
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#1677ff' }}>
          +{value} ₽
        </span>
      ),
    },
    {
      title: 'Способ',
      dataIndex: ['payment_methods', 'name'],
      key: 'method',
      width: 130,
    },
  ];

  // Колонки для истории сессий
  const sessionsColumns = [
    {
      title: 'Клиент',
      dataIndex: ['users', 'login'],
      key: 'user',
    },
    {
      title: 'ПК',
      dataIndex: ['computers', 'number'],
      key: 'computer',
      render: (number) => `№${number}`,
      width: 70,
    },
    {
      title: 'Начало',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 160,
      render: (time) => formatMoscowDateTime(time, 'DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Конец',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 160,
      render: (time) => formatMoscowDateTime(time, 'DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Длит.',
      key: 'duration',
      width: 100,
      render: (_, record) => {
        if (!record.end_time) return '—';
        const start = dayjs(record.start_time);
        const end = dayjs(record.end_time);
        const minutes = end.diff(start, 'minute');
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}ч ${mins}мин`;
      },
    },
    {
      title: 'Стоимость',
      dataIndex: 'total_cost',
      key: 'total_cost',
      width: 110,
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {value} ₽
        </span>
      ),
    },
  ];

  // Статистика
const totalSales = filteredSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
const totalReplenishments = filteredReplenishments.reduce((sum, r) => sum + (r.amount || 0), 0);
const totalRevenue = totalSales + totalReplenishments;

  const tabItems = [
    {
      key: 'sales',
      label: (
        <span>
          <ShoppingCartOutlined />
          Продажи ({filteredSales.length})
        </span>
      ),
      children: (
<Table
  columns={salesColumns}
  dataSource={filteredSales}
  rowKey="id"
  pagination={{ 
    pageSize: 10, 
    showSizeChanger: true,
    showTotal: (total) => `Всего ${total} записей`
  }}
  scroll={{ x: 750 }}  // ← Увеличили ширину
/>
      ),
    },
    {
      key: 'replenishments',
      label: (
        <span>
          <WalletOutlined />
          Пополнения ({filteredReplenishments.length})
        </span>
      ),
      children: (
        <Table
          columns={replenishmentColumns}
          dataSource={filteredReplenishments}
          rowKey="id"
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total) => `Всего ${total} записей`
          }}
          scroll={{ x: 600 }}
        />
      ),
    },
    {
      key: 'sessions',
      label: (
        <span>
          <HistoryOutlined />
          Сессии ({filteredSessions.length})
        </span>
      ),
      children: (
        <Table
          columns={sessionsColumns}
          dataSource={filteredSessions}
          rowKey="id"
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total) => `Всего ${total} записей`
          }}
          scroll={{ x: 800 }}
        />
      ),
    },
  ];

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadAllData}>
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
        <Title level={2} style={{ margin: 0 }}>📋 Журнал</Title>
        <Space>
          <RangePicker
            locale={locale}
            value={dateRange}
            onChange={handleRangeChange}
            format="DD.MM.YYYY"
            placeholder={['Начало', 'Конец']}
            allowClear={false}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadAllData}
            loading={isLoading}
          >
            Обновить
          </Button>
        </Space>
      </div>

 {/* Статистика */}
<Row gutter={16} style={{ marginBottom: 24 }}>
  <Col span={8}>
    <Card>
      <Statistic
        title="Общая выручка"
        value={totalRevenue}
        suffix="₽"
        prefix={<ShoppingCartOutlined />}
        styles={{ content: { color: '#52c41a' } }}
      />
    </Card>
  </Col>
  <Col span={8}>
    <Card>
      <Statistic
        title="Выручка от продаж"
        value={totalSales}
        suffix="₽"
        prefix={<ShoppingCartOutlined />}
      />
    </Card>
  </Col>
  <Col span={8}>
    <Card>
      <Statistic
        title="Пополнения баланса"
        value={totalReplenishments}
        suffix="₽"
        prefix={<WalletOutlined />}
        styles={{ content: { color: '#1677ff' } }}
      />
    </Card>
  </Col>
</Row>

      {/* Табы с логами */}
      <Card>
        <Spin spinning={isLoading}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => dispatch(setActiveTab(key))}
            items={tabItems}
          />
        </Spin>
      </Card>
    </div>
  );
}

export default JournalPage;