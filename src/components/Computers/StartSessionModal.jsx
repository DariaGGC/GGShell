import { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, Typography, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsersForSelect, startSession } from '../../store/slices/computersSlice';
import './StartSessionModal.css';

const { Text } = Typography;

// Тарифы пока захардкожены — в будущем будут подтягиваться из базы
const ZONE_TARIFFS = [
  { id: 1, name: 'Стандарт час', price: 100 },
  { id: 2, name: 'VIP час', price: 150 },
  { id: 3, name: 'Буткемп час', price: 200 },
];

function StartSessionModal({ visible, computer, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { users } = useSelector(state => state.computers);

  const zoneTariff = ZONE_TARIFFS.find(t => {
    if (computer?.zones?.name === 'Стандарт') return t.id === 1;
    if (computer?.zones?.name === 'Вип') return t.id === 2;
    if (computer?.zones?.name === 'Буткемп') return t.id === 3;
    return false;
  });

  // При открытии модалки подгружаем список пользователей
  useEffect(() => {
    if (visible) dispatch(fetchUsersForSelect());
  }, [visible, dispatch]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await dispatch(startSession({
        computerId: computer.id,
        userId: values.userId,
        tariffId: zoneTariff?.id || 1
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
      title={<span><UserOutlined className="modal-icon" /> Посадить клиента за ПК #{computer?.number}</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div className="session-info">
        <Text type="secondary">Зона: {computer?.zones?.name}</Text>
        <br />
        <Text type="secondary">Тариф: {zoneTariff?.price || 100} ₽/час</Text>
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

        <Form.Item className="modal-actions">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="primary" htmlType="submit" loading={loading}>Посадить</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default StartSessionModal;