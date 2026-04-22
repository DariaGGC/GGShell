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
  Typography,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  fetchUsers,
  fetchPaymentMethods,
  topUpBalance,
  setSearchText,
  setFilterStatus,
} from '../../store/slices/usersSlice';
import TopUpModal from '../../components/Users/TopUpModal';

const { Title } = Typography;
const { Option } = Select;

function UsersPage() {
  const dispatch = useDispatch();
  const {
    items: users,
    paymentMethods,
    isLoading,
    error,
    searchText,
    filterStatus,
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
        user.phone?.includes(search) ||
        user.lastName?.toLowerCase().includes(search) ||
        user.firstName?.toLowerCase().includes(search)
      );
    }

    // Фильтр по статусу авторизации
    if (filterStatus === 'authorized') {
      filtered = filtered.filter(user => user.activeSession !== null);
    } else if (filterStatus === 'unauthorized') {
      filtered = filtered.filter(user => user.activeSession === null);
    }

    return filtered;
  }, [users, searchText, filterStatus]);

  // Статистика
  const stats = useMemo(() => {
    const total = users.length;
    const today = new Date().toISOString().split('T')[0];
    const todayRegistrations = users.filter(u => 
      u.created_at?.startsWith(today)
    ).length;

    return { total, todayRegistrations };
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
      width: 130,
      sorter: (a, b) => a.login.localeCompare(b.login),
    },
    {
      title: 'ФИО',
      key: 'fullName',
      width: 180,
      render: (_, record) => {
        const name = [record.lastName, record.firstName].filter(Boolean).join(' ');
        return name || record.name || '—';
      },
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone) => phone || '—',
    },
    {
      title: 'Баланс',
      dataIndex: 'balance',
      key: 'balance',
      width: 110,
      sorter: (a, b) => a.balance - b.balance,
      render: (balance) => {
        let color = '#52c41a';
        if (balance < 0) color = '#ff4d4f';
        else if (balance === 0) color = '#faad14';
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            {balance || 0} ₽
          </span>
        );
      },
    },
    {
      title: 'Статус',
      key: 'status',
      width: 130,
      render: (_, record) => {
        if (record.activeSession) {
          return <Tag color="processing">Авторизован</Tag>;
        }
        return <Tag color="default">Не авторизован</Tag>;
      },
    },
    {
      title: '№ ПК',
      key: 'computer',
      width: 80,
      render: (_, record) => {
        if (record.activeSession) {
          return <Tag color="blue">{record.activeSession.computers?.number}</Tag>;
        }
        return '—';
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
        <Title level={2} style={{ margin: 0 }}>👥 Пользователи</Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchUsers())}
            loading={isLoading}
          >
            Обновить
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            Добавить
          </Button>
        </Space>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic title="Всего пользователей" value={stats.total} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic 
              title="Регистраций за сегодня" 
              value={stats.todayRegistrations}
              valueStyle={{ color: '#52c41a' }}
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
            style={{ width: 200 }}
            placeholder="Фильтр по статусу"
            allowClear
            value={filterStatus === 'all' ? undefined : filterStatus}
            onChange={(value) => dispatch(setFilterStatus(value || 'all'))}
          >
            <Option value="all">Все</Option>
            <Option value="authorized">Авторизован</Option>
            <Option value="unauthorized">Не авторизован</Option>
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
            scroll={{ x: 1000 }}
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