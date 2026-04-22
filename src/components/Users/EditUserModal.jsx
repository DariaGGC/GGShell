import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, message, Typography, Divider } from 'antd';
import { EditOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/usersSlice';
import './EditUserModal.css';

const { Text } = Typography;

function EditUserModal({ visible, user, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && visible) {
      form.setFieldsValue({
        login: user.login || '',
        name: user.name || '',
        phone: user.phone || user.mobile || '',
      });
    }
  }, [user, visible, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await dispatch(updateUser({
        userId: user.id,
        login: values.login,
        name: values.name,
        phone: values.phone
      })).unwrap();
      
      message.success(`Пользователь "${values.login}" обновлён`);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Ошибка при обновлении пользователя');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Не указано';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Не указано';
    }
  };

  return (
    <Modal
      title={<span><EditOutlined className="modal-icon" /> Редактировать пользователя</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
      <div className="user-registration-info">
        <div className="registration-row">
          <Text strong>Пользователь:</Text>
          <Text>{user?.name || user?.login || '—'}</Text>
        </div>
        <div className="registration-row">
          <CalendarOutlined className="registration-icon" />
          <Text strong>Дата регистрации:</Text>
          <Text>{formatDate(user?.created_at)}</Text>
        </div>
        <div className="registration-row">
          <ClockCircleOutlined className="registration-icon" />
          <Text strong>Время регистрации:</Text>
          <Text>{formatTime(user?.created_at)}</Text>
        </div>
        <Divider className="registration-divider" />
        <Text type="secondary" className="registration-meta">
          ID: {user?.id} | Баланс: {user?.balance || 0} ₽
        </Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="login"
          label="Логин"
          rules={[
            { required: true, message: 'Введите логин' },
            { min: 3, message: 'Минимум 3 символа' },
            { max: 20, message: 'Максимум 20 символов' }
          ]}
        >
          <Input placeholder="Логин" />
        </Form.Item>

        <Form.Item name="name" label="ФИО">
          <Input placeholder="Иванов Иван" />
        </Form.Item>

        <Form.Item name="phone" label="Телефон">
          <Input placeholder="+7 (999) 123-45-67" />
        </Form.Item>

        <Form.Item className="modal-actions">
          <Space>
            <Button onClick={onClose}>Отмена</Button>
            <Button type="primary" htmlType="submit" loading={loading}>Сохранить</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditUserModal;