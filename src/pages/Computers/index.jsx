import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  Tag,
  Button,
  Select,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Modal,
  message,
  Spin,
  Alert,
  Dropdown,
} from 'antd';
import {
  ReloadOutlined,
  StopOutlined,
  FilterOutlined,
  UserAddOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  fetchComputers,
  fetchZones,
  endSession,
  setSelectedZone,
  tickBalance,
  setMaintenance,
  setFree,
} from '../../store/slices/computersSlice';
import StartSessionModal from '../../components/Computers/StartSessionModal';

const { Option } = Select;

function ComputersPage() {
  const dispatch = useDispatch();
  const { items: computers, zones, selectedZone, isLoading, error } = useSelector(state => state.computers);
  
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [selectedComputer, setSelectedComputer] = useState(null);
  const tickInterval = useRef(null);

  // Загрузка данных
  useEffect(() => {
    dispatch(fetchComputers());
    dispatch(fetchZones());

    // Запускаем таймер для динамического списания (каждую минуту)
    tickInterval.current = setInterval(() => {
      dispatch(tickBalance());
    }, 60000); // 60 секунд

    return () => {
      if (tickInterval.current) {
        clearInterval(tickInterval.current);
      }
    };
  }, [dispatch]);

  // Фильтрация компьютеров по зоне
  const filteredComputers = useMemo(() => {
    if (!selectedZone) return computers;
    return computers.filter(computer => computer.zone_id === selectedZone);
  }, [computers, selectedZone]);

  // Статистика (без "Всего ПК")
  const stats = useMemo(() => {
    const free = computers.filter(c => c.status === 'Свободен').length;
    const occupied = computers.filter(c => c.status === 'Занят').length;
    const maintenance = computers.filter(c => c.status === 'Обслуживание').length;
    return { free, occupied, maintenance };
  }, [computers]);

  // Обработчики
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

  // Расчёт оставшегося времени
  const calculateRemainingTime = (session) => {
    if (!session) return null;
    
    const user = session.users;
    if (!user) return { text: '—', color: 'default' };
    
    const pricePerHour = session.tariffs?.price_per_hour || 100;
    const balance = user.balance || 0;
    const remainingHours = balance / pricePerHour;
    
    if (remainingHours <= 0) return { text: 'Закончилось', color: 'red' };
    
    const hours = Math.floor(remainingHours);
    const minutes = Math.floor((remainingHours - hours) * 60);
    
    return {
      text: `${hours}ч ${minutes}мин`,
      color: remainingHours < 1 ? 'orange' : 'green'
    };
  };


// Колонки таблицы
const columns = [
  {
    title: '№ ПК',
    dataIndex: 'number',
    key: 'number',
    width: 70,
    sorter: (a, b) => a.number - b.number,
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
        <span style={{ color: balance <= 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
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
      const time = new Date(record.activeSession.start_time);
      return time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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
      
      // Расчёт времени окончания
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
      
      return (
        <Tag color={color}>
          {hours > 0 ? `${hours}ч ` : ''}{minutes}мин
        </Tag>
      );
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
            <Button
              type="primary"
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => handleStartSession(record)}
            >
              Посадить
            </Button>
            <Button
              size="small"
              icon={<ToolOutlined />}
              onClick={() => handleSetMaintenance(record)}
            >
              Ремонт
            </Button>
          </Space>
        );
      }
      
      if (record.status === 'Занят') {
        return (
          <Space>
            <Button
              type="primary"
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleEndSession(record)}
            >
              Завершить
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'maintenance',
                    label: 'На обслуживание',
                    icon: <ToolOutlined />,
                    onClick: () => handleSetMaintenance(record)
                  }
                ]
              }}
            >
              <Button size="small">
                <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        );
      }
      
      if (record.status === 'Обслуживание') {
        return (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleSetFree(record)}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
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
        action={
          <Button size="small" onClick={() => dispatch(fetchComputers())}>
            Повторить
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>💻 Управление компьютерами</h2>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchComputers())}
            loading={isLoading}
          >
            Обновить
          </Button>
        </Space>
      </div>

      {/* Статистика (без "Всего ПК") */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Свободно" 
              value={stats.free} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Занято" 
              value={stats.occupied} 
              valueStyle={{ color: '#1677ff' }} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Обслуживание" 
              value={stats.maintenance} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Фильтр по зонам */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <FilterOutlined />
          <span>Фильтр по зоне:</span>
          <Select
            style={{ width: 200 }}
            placeholder="Все зоны"
            allowClear
            value={selectedZone}
            onChange={(value) => dispatch(setSelectedZone(value))}
          >
            {zones.map(zone => (
              <Option key={zone.id} value={zone.id}>{zone.name}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Таблица */}
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

      {/* Модальное окно посадки клиента */}
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