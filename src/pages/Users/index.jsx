import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Spin,
  Alert,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  fetchUsers,
  fetchPaymentMethods,
  topUpBalance,
  setSearchText,
  setFilterBalance,
} from '../../store/slices/usersSlice';
import TopUpModal from '../../components/Users/TopUpModal';

const { Option } = Select;

function UsersPage() {
  const dispatch = useDispatch();
  const {
    items: users,
    paymentMethods,
    isLoading,
    error,
    searchText,
    filterBalance,
  } = useSelector(state => state.users);

  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  // Фильтрация пользователей
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Поиск по тексту
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(user =>
        user.login?.toLowerCase().includes(search) ||
        user.name?.toLowerCase().includes(search) ||
        user.phone?.includes(search)
      );
    }

    // Фильтр по балансу
    if (filterBalance === 'positive') {
      filtered = filtered.filter(user => user.balance > 0);
    } else if (filterBalance === 'zero') {
      filtered = filtered.filter(user => user.balance === 0);
    } else if (filterBalance === 'negative') {
      filtered = filtered.filter(user => user.balance < 0);
    }

    return filtered;
  }, [users, searchText, filterBalance]);

  // Статистика
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.activeSession).length;
    const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
    const avgBalance = total > 0 ? Math.round(totalBalance / total) : 0;
    return { total, active, totalBalance, avgBalance };
  }, [users]);

  const handleTopUp = (user) => {
    setSelectedUser(user);
    setTopUpModalVisible(true);
  };

  const handleTopUpSubmit = async (data) => {
    await dispatch(topUpBalance(data)).unwrap();
  };

  // Колонки таблицы
  const columns = [
    {
      title: 'Логин',
      dataIndex: 'login',
      key: 'login',
      width: 150,
      sorter: (a, b) => a.login.localeCompare(b.login),
      render: (login) => (
        <Space>
          <UserOutlined />
          <span style={{ fontWeight: 500 }}>{login}</span>
        </Space>
      ),
    },
    {
      title: 'ФИО',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (name) => name || '—',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone) => phone || '—',
    },
    {
      title: 'Баланс',
      dataIndex: 'balance',
      key: 'balance',
      width: 130,
      sorter: (a, b) => a.balance - b.balance,
      render: (balance) => {
        let color = '#52c41a';
        if (balance < 0) color = '#ff4d4f';
        else if (balance === 0) color = '#faad14';
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            {balance} ₽
          </span>
        );
      },
    },
    {
      title: 'Статус',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.activeSession) {
          return (
            <Tooltip title={`ПК #${record.activeSession.computers?.number}`}>
              <Tag color="processing">В игре</Tag>
            </Tooltip>
          );
        }
        return <Tag color="default">Не в игре</Tag>;
      },
    },
    {
      title: 'Компьютер',
      key: 'computer',
      width: 120,
      render: (_, record) => {
        if (record.activeSession) {
          return `ПК #${record.activeSession.computers?.number}`;
        }
        return '—';
      },
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('ru-RU');
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<WalletOutlined />}
          onClick={() => handleTopUp(record)}
        >
          Пополнить
        </Button>
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
          <Button size="small" onClick={() => dispatch(fetchUsers())}>
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
        <h2 style={{ margin: 0 }}>👥 Управление пользователями</h2>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchUsers())}
            loading={isLoading}
          >
            Обновить
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            Добавить пользователя
          </Button>
        </Space>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Всего пользователей" value={stats.total} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="В игре"
              value={stats.active}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Общий баланс"
              value={stats.totalBalance}
              suffix="₽"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Средний баланс"
              value={stats.avgBalance}
              suffix="₽"
            />
          </Card>
        </Col>
      </Row>

      {/* Фильтры и поиск */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Поиск по логину, ФИО, телефону"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => dispatch(setSearchText(e.target.value))}
            allowClear
          />
          <Select
            style={{ width: 180 }}
            placeholder="Фильтр по балансу"
            allowClear
            value={filterBalance}
            onChange={(value) => dispatch(setFilterBalance(value))}
          >
            <Option value="positive">Положительный</Option>
            <Option value="zero">Нулевой</Option>
            <Option value="negative">Отрицательный</Option>
          </Select>
        </Space>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Всего ${total} пользователей`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Spin>
      </Card>

      {/* Модальное окно пополнения */}
      <TopUpModal
        visible={topUpModalVisible}
        user={selectedUser}
        paymentMethods={paymentMethods}
        onClose={() => {
          setTopUpModalVisible(false);
          setSelectedUser(null);
        }}
        onSubmit={handleTopUpSubmit}
      />
    </div>
  );
}

export default UsersPage;