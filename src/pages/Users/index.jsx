import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table, Tag, Button, Input, Select, Space, Card,
  Statistic, Row, Col, Spin, Alert, Typography
} from 'antd';
import {
  ReloadOutlined, SearchOutlined, PlusOutlined,
  WalletOutlined, EditOutlined
} from '@ant-design/icons';
import {
  fetchUsers, fetchPaymentMethods, topUpBalance,
  setSearchText, setFilterStatus
} from '../../store/slices/usersSlice';
import TopUpModal from '../../components/Users/TopUpModal';
import EditUserModal from '../../components/Users/EditUserModal';
import AddUserModal from '../../components/Users/AddUserModal';
import './Users.css';

const { Title } = Typography;
const { Option } = Select;

function UsersPage() {
  const dispatch = useDispatch();
  const { items: users, paymentMethods, isLoading, error, searchText, filterStatus } =
    useSelector(state => state.users);

  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
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
    if (filterStatus === 'authorized') {
      filtered = filtered.filter(user => user.activeSession !== null);
    } else if (filterStatus === 'unauthorized') {
      filtered = filtered.filter(user => user.activeSession === null);
    }
    return filtered;
  }, [users, searchText, filterStatus]);

  const stats = useMemo(() => {
    const total = users.length;
    const today = new Date().toISOString().split('T')[0];
    const todayRegistrations = users.filter(u => u.created_at?.startsWith(today)).length;
    return { total, todayRegistrations };
  }, [users]);

  const handleTopUp = (user) => {
    setSelectedUser(user);
    setTopUpModalVisible(true);
  };

  const handleTopUpSubmit = async (data) => {
    await dispatch(topUpBalance(data)).unwrap();
  };

  const handleEditUser = (user) => {
    setSelectedUserForEdit(user);
    setEditModalVisible(true);
  };

  const columns = [
    { title: 'Логин', dataIndex: 'login', key: 'login', width: 130 },
    {
      title: 'ФИО', key: 'fullName', width: 180,
      render: (_, record) => {
        const name = [record.lastName, record.firstName].filter(Boolean).join(' ');
        return name || record.name || '—';
      },
    },
    { title: 'Телефон', dataIndex: 'phone', key: 'phone', width: 150, render: (phone) => phone || '—' },
    {
      title: 'Баланс', dataIndex: 'balance', key: 'balance', width: 110,
      render: (balance) => {
        let color = balance > 0 ? '#52c41a' : balance < 0 ? '#ff4d4f' : '#faad14';
        return <span style={{ color, fontWeight: 'bold' }}>{balance || 0} ₽</span>;
      },
    },
    {
      title: 'Статус', key: 'status', width: 130,
      render: (_, record) => (
        record.activeSession ? <Tag color="processing">Авторизован</Tag> : <Tag color="default">Не авторизован</Tag>
      ),
    },
    {
      title: '№ ПК', key: 'computer', width: 80,
      render: (_, record) => record.activeSession ? <Tag color="blue">{record.activeSession.computers?.number}</Tag> : '—',
    },
    {
      title: 'Действия', key: 'actions', width: 150, fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<WalletOutlined />} onClick={() => handleTopUp(record)}>
            Пополнить
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <Alert message="Ошибка загрузки" description={error} type="error" showIcon
        action={<Button size="small" onClick={() => dispatch(fetchUsers())}>Повторить</Button>} />
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <Title level={2}>👥 Пользователи</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchUsers())} loading={isLoading}>
            Обновить
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            Добавить
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="users-stats">
        <Col span={12}>
          <Card bodyStyle={{ padding: '6px 16px' }}>
            <Statistic title="Всего пользователей" value={stats.total} />
          </Card>
        </Col>
        <Col span={12}>
          <Card bodyStyle={{ padding: '6px 16px' }}>
            <Statistic title="Регистраций за сегодня" value={stats.todayRegistrations}
              valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card className="users-filters">
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

      <Card>
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
              pagination={{
                total: filteredUsers.length,
                pageSize: 20,
                showTotal: (total) => `Всего ${total} пользователей`,
              }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        </Spin>
      </Card>

      <TopUpModal visible={topUpModalVisible} user={selectedUser} paymentMethods={paymentMethods}
        onClose={() => { setTopUpModalVisible(false); setSelectedUser(null); }}
        onSubmit={handleTopUpSubmit} />

      <EditUserModal visible={editModalVisible} user={selectedUserForEdit}
        onClose={() => { setEditModalVisible(false); setSelectedUserForEdit(null); }} />

      <AddUserModal visible={addModalVisible} onClose={() => setAddModalVisible(false)} />
    </div>
  );
}

export default UsersPage;