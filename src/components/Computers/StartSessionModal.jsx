import { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, Typography, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsersForSelect, fetchZones, startSession } from '../../store/slices/computersSlice';

const { Text } = Typography;

function StartSessionModal({ visible, computer, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const { users, zones } = useSelector(state => state.computers);
  
  // Находим тариф для зоны компьютера
  const zoneTariffs = (() => {
    if (!computer) return [];
    // Здесь нужно получить тарифы для зоны
    // Пока упрощённо — используем фиксированные
    return [
      { id: 1, name: 'Стандарт час', price: 100 },
      { id: 2, name: 'VIP час', price: 150 },
      { id: 3, name: 'Буткемп час', price: 200 },
    ].filter(t => {
      if (computer?.zones?.name === 'Стандарт') return t.id === 1;
      if (computer?.zones?.name === 'Вип') return t.id === 2;
      if (computer?.zones?.name === 'Буткемп') return t.id === 3;
      return true;
    });
  })();

  useEffect(() => {
    if (visible) {
      dispatch(fetchUsersForSelect());
      dispatch(fetchZones());
    }
  }, [visible, dispatch]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const tariff = zoneTariffs[0]; // Берём первый подходящий тариф
      await dispatch(startSession({
        computerId: computer.id,
        userId: values.userId,
        tariffId: tariff?.id || 1
      })).unwrap();
      
      message.success(`Клиент посажен за ПК #${computer.number}`);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Ошибка при начале сессии');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          Посадить клиента за ПК #{computer?.number}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">Зона: {computer?.zones?.name}</Text>
        <br />
        <Text type="secondary">
          Тариф: {zoneTariffs[0]?.price || 100} ₽/час
        </Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="userId"
          label="Выберите клиента"
          rules={[{ required: true, message: 'Выберите клиента' }]}
        >
          <Select
            placeholder="Поиск по логину или имени"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label || '').toLowerCase().includes(input.toLowerCase())
            }
            options={users.map(user => ({
              value: user.id,
              label: `${user.login} (${user.name || 'Без имени'}) — Баланс: ${user.balance} ₽`
            }))}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Отмена
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Посадить
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default StartSessionModal;