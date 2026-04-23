import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table, Tag, Button, Select, Space, Card, Statistic, Row, Col,
  Modal, message, Spin, Alert, Dropdown
} from 'antd';
import {
  ReloadOutlined, StopOutlined, FilterOutlined, UserAddOutlined,
  ToolOutlined, CheckCircleOutlined, DownOutlined
} from '@ant-design/icons';
import {
  fetchComputers, fetchZones, endSession, setSelectedZone,
  setSelectedStatus, tickBalance, setMaintenance, setFree
} from '../../store/slices/computersSlice';
import StartSessionModal from '../../components/Computers/StartSessionModal';
import { formatMoscowTime } from '../../utils/dateUtils';
import './Computers.css';

const { Option } = Select;

function ComputersPage() {
  const dispatch = useDispatch();
  const {
    items: computers,
    zones,
    selectedZone,
    selectedStatus,
    isLoading,
    error,
  } = useSelector(state => state.computers);

  const [startModalVisible, setStartModalVisible] = useState(false);
  const [selectedComputer, setSelectedComputer] = useState(null);
  const tickInterval = useRef(null);

  useEffect(() => {
    dispatch(fetchComputers());
    dispatch(fetchZones());

    tickInterval.current = setInterval(() => {
      dispatch(tickBalance());
    }, 60000);

    return () => {
      if (tickInterval.current) clearInterval(tickInterval.current);
    };
  }, [dispatch]);

  const filteredComputers = useMemo(() => {
    let filtered = computers;
    if (selectedZone) filtered = filtered.filter(c => c.zone_id === selectedZone);
    if (selectedStatus) filtered = filtered.filter(c => c.status === selectedStatus);
    return filtered;
  }, [computers, selectedZone, selectedStatus]);

  const stats = useMemo(() => {
    const free = computers.filter(c => c.status === 'Свободен').length;
    const occupied = computers.filter(c => c.status === 'Занят').length;
    const maintenance = computers.filter(c => c.status === 'Обслуживание').length;
    return { free, occupied, maintenance };
  }, [computers]);

  const handleEndSession = (record) => {
    Modal.confirm({
      title: 'Завершить сессию?',
      content: `Принудительно завершить сессию для ПК #${record.number}?`,
      okText: 'Завершить',
      cancelText: 'Отмена',
      okType: 'danger',
      onOk: async () => {
        try {
          await dispatch(endSession({
            sessionId: record.activeSession.id,
            computerId: record.id
          })).unwrap();
          message.success('Сессия завершена');
        } catch (error) {
          message.error('Ошибка при завершении сессии');
        }
      },
    });
  };

  const handleStartSession = (computer) => {
    setSelectedComputer(computer);
    setStartModalVisible(true);
  };

  const handleSetMaintenance = (computer) => {
    Modal.confirm({
      title: 'Отправить на обслуживание?',
      content: `ПК #${computer.number} будет отправлен на обслуживание.`,
      okText: 'Отправить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await dispatch(setMaintenance({ computerId: computer.id })).unwrap();
          message.success(`ПК #${computer.number} отправлен на обслуживание`);
        } catch (error) {
          message.error('Ошибка при смене статуса');
        }
      },
    });
  };

  const handleSetFree = (computer) => {
    Modal.confirm({
      title: 'Вернуть в работу?',
      content: `ПК #${computer.number} будет возвращён в работу.`,
      okText: 'Вернуть',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await dispatch(setFree({ computerId: computer.id })).unwrap();
          message.success(`ПК #${computer.number} снова доступен`);
        } catch (error) {
          message.error('Ошибка при смене статуса');
        }
      },
    });
  };

  const columns = [
    {
      title: '№ ПК',
      dataIndex: 'number',
      key: 'number',
      width: 80,
      sorter: (a, b) => a.number - b.number,
      render: (number) => <span className="pc-number">{number}</span>,
    },
    {
      title: 'Зона',
      dataIndex: ['zones', 'name'],
      key: 'zone',
      width: 100,
      render: (name) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => {
        const colors = {
          'Свободен': 'success',
          'Занят': 'processing',
          'Обслуживание': 'warning',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Пользователь',
      key: 'user',
      width: 130,
      render: (_, record) => {
        if (record.status === 'Свободен') return '—';
        if (record.status === 'Обслуживание') return 'Обслуживание';
        return record.activeSession?.users?.login || '—';
      },
    },
    {
      title: 'Баланс',
      key: 'balance',
      width: 100,
      render: (_, record) => {
        const balance = record.activeSession?.users?.balance;
        if (!balance && balance !== 0) return '—';
        return (
          <span className={balance <= 0 ? 'balance-low' : 'balance-ok'}>
            {balance} ₽
          </span>
        );
      },
    },
    {
      title: 'Начало',
      key: 'startTime',
      width: 90,
      render: (_, record) => {
        if (!record.activeSession) return '—';
        return formatMoscowTime(record.activeSession.start_time, 'HH:mm');
      },
    },
    {
      title: 'Окончание',
      key: 'endTime',
      width: 90,
      render: (_, record) => {
        const session = record.activeSession;
        if (!session) return '—';
        const user = session.users;
        if (!user) return '—';
        const balance = user.balance || 0;
        const pricePerHour = session.tariffs?.price_per_hour || 100;
        if (balance <= 0) return <Tag color="red">Закончилось</Tag>;
        const remainingHours = balance / pricePerHour;
        const endTime = new Date();
        endTime.setTime(endTime.getTime() + remainingHours * 60 * 60 * 1000);
        return endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      title: 'Остаток',
      key: 'remaining',
      width: 110,
      render: (_, record) => {
        const session = record.activeSession;
        if (!session) return '—';
        const user = session.users;
        if (!user) return '—';
        const pricePerHour = session.tariffs?.price_per_hour || 100;
        const balance = user.balance || 0;
        const remainingHours = balance / pricePerHour;
        if (remainingHours <= 0) return <Tag color="red">0 мин</Tag>;
        const hours = Math.floor(remainingHours);
        const minutes = Math.floor((remainingHours - hours) * 60);
        let color = 'green';
        if (remainingHours < 0.5) color = 'red';
        else if (remainingHours < 1) color = 'orange';
        return <Tag color={color}>{hours > 0 ? `${hours}ч ` : ''}{minutes}мин</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => {
        if (record.status === 'Свободен') {
          return (
            <Space>
              <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={() => handleStartSession(record)}>
                Посадить
              </Button>
              <Button size="small" icon={<ToolOutlined />} onClick={() => handleSetMaintenance(record)}>
                Ремонт
              </Button>
            </Space>
          );
        }
        if (record.status === 'Занят') {
          return (
            <Space>
              <Button type="primary" danger size="small" icon={<StopOutlined />} onClick={() => handleEndSession(record)}>
                Завершить
              </Button>
              <Dropdown menu={{ items: [{ key: 'maintenance', label: 'На обслуживание', icon: <ToolOutlined />, onClick: () => handleSetMaintenance(record) }] }}>
                <Button size="small"><DownOutlined /></Button>
              </Dropdown>
            </Space>
          );
        }
        if (record.status === 'Обслуживание') {
          return (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleSetFree(record)} className="btn-return">
              Вернуть
            </Button>
          );
        }
        return null;
      },
    },
  ];

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description={error}
        type="error"
        showIcon
        action={<Button size="small" onClick={() => dispatch(fetchComputers())}>Повторить</Button>}
      />
    );
  }

  return (
    <div className="computers-page">
      <div className="page-header">
        <h2>💻 Управление компьютерами</h2>
        <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchComputers())} loading={isLoading}>
          Обновить
        </Button>
      </div>

      <Row gutter={16} className="stats-row">
        <Col span={8}>
          <Card bodyStyle={{ padding: '6px 16px' }}>
            <Statistic title="Свободно" value={stats.free} valueStyle={{ color: '#52c41a', fontSize: 24 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '6px 16px' }}>
            <Statistic title="Занято" value={stats.occupied} valueStyle={{ color: '#1677ff', fontSize: 24 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '6px 16px' }}>
            <Statistic title="Обслуживание" value={stats.maintenance} valueStyle={{ color: '#faad14', fontSize: 24 }} />
          </Card>
        </Col>
      </Row>

      <Card className="filter-card">
        <Space wrap>
          <FilterOutlined />
          <span>Зона:</span>
          <Select
            style={{ width: 180 }}
            placeholder="Все зоны"
            allowClear
            value={selectedZone}
            onChange={(value) => dispatch(setSelectedZone(value))}
          >
            {zones.map(zone => <Option key={zone.id} value={zone.id}>{zone.name}</Option>)}
          </Select>
          <span className="filter-divider">Статус:</span>
          <Select
            style={{ width: 180 }}
            placeholder="Все статусы"
            allowClear
            value={selectedStatus}
            onChange={(value) => dispatch(setSelectedStatus(value))}
          >
            <Option value="Свободен">🟢 Свободен</Option>
            <Option value="Занят">🔴 Занят</Option>
            <Option value="Обслуживание">🟡 Обслуживание</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filteredComputers}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Spin>
      </Card>

      <StartSessionModal
        visible={startModalVisible}
        computer={selectedComputer}
        onClose={() => {
          setStartModalVisible(false);
          setSelectedComputer(null);
        }}
      />
    </div>
  );
}

export default ComputersPage;