import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  Alert,
  Statistic,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  ReloadOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  LoginOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  fetchSales,
  fetchReplenishments,
  fetchAuthLogs,
  fetchSessionsHistory,
  setActiveTab,
} from '../../store/slices/logsSlice';

const { Title } = Typography;

function LogsPage() {
  const dispatch = useDispatch();
  const {
    sales,
    replenishments,
    authLogs,
    sessionsHistory,
    isLoading,
    activeTab,
    error,
  } = useSelector(state => state.logs);

  useEffect(() => {
    loadAllData();
  }, [dispatch]);

  const loadAllData = () => {
    dispatch(fetchSales());
    dispatch(fetchReplenishments());
    dispatch(fetchAuthLogs());
    dispatch(fetchSessionsHistory());
  };

  // Колонки для таблицы продаж
  const salesColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => new Date(date).toLocaleDateString('ru-RU'),
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
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
    },
    {
      title: 'Сумма',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 130,
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {value} ₽
        </span>
      ),
    },
  ];

  // Колонки для таблицы пополнений
  const replenishmentColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => new Date(date).toLocaleDateString('ru-RU'),
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
      title: 'Способ оплаты',
      dataIndex: ['payment_methods', 'name'],
      key: 'method',
      width: 150,
    },
  ];

  // Колонки для таблицы авторизаций
  const authColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => new Date(date).toLocaleDateString('ru-RU'),
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
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => (
        <Tag color={action === 'login' ? 'green' : 'orange'}>
          {action === 'login' ? 'Вход' : 'Выход'}
        </Tag>
      ),
    },
    {
      title: 'Компьютер',
      dataIndex: ['computers', 'number'],
      key: 'computer',
      width: 120,
      render: (number) => number ? `ПК #${number}` : '—',
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
      title: 'Компьютер',
      dataIndex: ['computers', 'number'],
      key: 'computer',
      render: (number) => `ПК #${number}`,
    },
    {
      title: 'Начало',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => new Date(time).toLocaleString('ru-RU'),
    },
    {
      title: 'Конец',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time) => time ? new Date(time).toLocaleString('ru-RU') : '—',
    },
    {
      title: 'Длительность',
      key: 'duration',
      render: (_, record) => {
        if (!record.end_time) return '—';
        const start = new Date(record.start_time);
        const end = new Date(record.end_time);
        const hours = Math.floor((end - start) / (1000 * 60 * 60));
        const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}ч ${minutes}мин`;
      },
    },
    {
      title: 'Стоимость',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {value} ₽
        </span>
      ),
    },
  ];

  // Статистика
  const totalSales = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const totalReplenishments = replenishments.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalSessions = sessionsHistory.length;
  const totalSessionsRevenue = sessionsHistory.reduce((sum, s) => sum + (s.total_cost || 0), 0);

  const tabItems = [
    {
      key: 'sales',
      label: (
        <span>
          <ShoppingCartOutlined />
          Продажи ({sales.length})
        </span>
      ),
      children: (
        <Table
          columns={salesColumns}
          dataSource={sales}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
        />
      ),
    },
    {
      key: 'replenishments',
      label: (
        <span>
          <WalletOutlined />
          Пополнения ({replenishments.length})
        </span>
      ),
      children: (
        <Table
          columns={replenishmentColumns}
          dataSource={replenishments}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
        />
      ),
    },
    {
      key: 'auth',
      label: (
        <span>
          <LoginOutlined />
          Авторизации ({authLogs.length})
        </span>
      ),
      children: (
        <Table
          columns={authColumns}
          dataSource={authLogs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
        />
      ),
    },
    {
      key: 'sessions',
      label: (
        <span>
          <HistoryOutlined />
          Сессии ({sessionsHistory.length})
        </span>
      ),
      children: (
        <Table
          columns={sessionsColumns}
          dataSource={sessionsHistory}
          rowKey="id"
          pagination={{ pageSize: 10 }}
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
        <Title level={2} style={{ margin: 0 }}>
          📋 Логи и история
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadAllData}
          loading={isLoading}
        >
          Обновить
        </Button>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Выручка от продаж"
              value={totalSales}
              suffix="₽"
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Пополнения баланса"
              value={totalReplenishments}
              suffix="₽"
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего сессий"
              value={totalSessions}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Выручка от сессий"
              value={totalSessionsRevenue}
              suffix="₽"
              valueStyle={{ color: '#52c41a' }}
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

export default LogsPage;