import { useEffect, useState, useMemo } from 'react';
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
} from 'antd';
import {
  ReloadOutlined,
  StopOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { fetchComputers, fetchZones, endSession, setSelectedZone } from '../../store/slices/computersSlice';

const { Option } = Select;

function ComputersPage() {
  const dispatch = useDispatch();
  const { items: computers, zones, selectedZone, isLoading, error } = useSelector(state => state.computers);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Загрузка данных
  useEffect(() => {
    dispatch(fetchComputers());
    dispatch(fetchZones());

    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      dispatch(fetchComputers());
    }, 30000);
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [dispatch]);

  // Фильтрация компьютеров по зоне
  const filteredComputers = useMemo(() => {
    if (!selectedZone) return computers;
    return computers.filter(computer => computer.zone_id === selectedZone);
  }, [computers, selectedZone]);

  // Статистика
  const stats = useMemo(() => {
    const total = computers.length;
    const free = computers.filter(c => c.status === 'Свободен').length;
    const occupied = computers.filter(c => c.status === 'Занят').length;
    const maintenance = computers.filter(c => c.status === 'Обслуживание').length;
    return { total, free, occupied, maintenance };
  }, [computers]);

  // Обработчик завершения сессии
  const handleEndSession = (record) => {
    Modal.confirm({
      title: 'Завершить сессию?',
      content: `Завершить сессию для ПК #${record.number}? С баланса пользователя будет списана стоимость.`,
      okText: 'Завершить',
      cancelText: 'Отмена',
      okType: 'danger',
      onOk: async () => {
        try {
          await dispatch(endSession({
            sessionId: record.activeSession.id,
            computerId: record.id
          })).unwrap();
          message.success('Сессия успешно завершена');
        } catch (error) {
          message.error('Ошибка при завершении сессии');
        }
      },
    });
  };

  // Расчёт оставшегося времени
  const calculateRemainingTime = (session) => {
    if (!session) return null;
    
    const startTime = new Date(session.start_time);
    const now = new Date();
    const elapsedHours = (now - startTime) / (1000 * 60 * 60);
    
    // Сколько часов оплачено (баланс / цена часа)
    const balance = session.users?.balance || 0;
    const pricePerHour = session.tariffs?.price_per_hour || 100;
    const paidHours = balance / pricePerHour;
    
    const remainingHours = paidHours - elapsedHours;
    
    if (remainingHours <= 0) return { text: 'Закончилось', color: 'red', value: 0 };
    
    const hours = Math.floor(remainingHours);
    const minutes = Math.floor((remainingHours - hours) * 60);
    
    return {
      text: `${hours}ч ${minutes}мин`,
      color: remainingHours < 1 ? 'orange' : 'green',
      value: remainingHours
    };
  };

  // Колонки таблицы
  const columns = [
    {
      title: '№ ПК',
      dataIndex: 'number',
      key: 'number',
      width: 80,
      sorter: (a, b) => a.number - b.number,
    },
    {
      title: 'Зона',
      dataIndex: ['zones', 'name'],
      key: 'zone',
      width: 120,
      render: (name) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 130,
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
      width: 150,
      render: (_, record) => {
        if (record.status === 'Свободен') return '—';
        if (record.status === 'Обслуживание') return 'Обслуживание';
        return record.activeSession?.users?.login || '—';
      },
    },
    {
      title: 'Баланс',
      key: 'balance',
      width: 120,
      render: (_, record) => {
        const balance = record.activeSession?.users?.balance;
        if (!balance && balance !== 0) return '—';
        return (
          <span style={{ color: balance <= 0 ? '#ff4d4f' : '#52c41a' }}>
            {balance} ₽
          </span>
        );
      },
    },
    {
      title: 'Начало сессии',
      key: 'startTime',
      width: 150,
      render: (_, record) => {
        if (!record.activeSession) return '—';
        const time = new Date(record.activeSession.start_time);
        return time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      title: 'Окончание',
      key: 'endTime',
      width: 150,
      render: (_, record) => {
        const remaining = calculateRemainingTime(record.activeSession);
        if (!remaining) return '—';
        const endTime = new Date(Date.now() + remaining.value * 60 * 60 * 1000);
        return endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      title: 'Остаток',
      key: 'remaining',
      width: 130,
      render: (_, record) => {
        const remaining = calculateRemainingTime(record.activeSession);
        if (!remaining) return '—';
        return <Tag color={remaining.color}>{remaining.text}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        if (record.status !== 'Занят') return null;
        return (
          <Button
            type="primary"
            danger
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleEndSession(record)}
          >
            Завершить
          </Button>
        );
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
      {/* Заголовок и кнопка обновления */}
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

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Всего ПК" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Свободно" value={stats.free} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Занято" value={stats.occupied} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Обслуживание" value={stats.maintenance} valueStyle={{ color: '#faad14' }} />
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

      {/* Таблица компьютеров */}
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
    </div>
  );
}

export default ComputersPage;