import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, message, Typography, Divider } from 'antd';
import { EditOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/usersSlice';

const { Text } = Typography;

function EditUserModal({ visible, user, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && visible) {
      form.setFieldsValue({
        login: user.login,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user, visible, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await dispatch(updateUser({
        userId: user.id,
        login: values.login,
        firstName: values.firstName,
        lastName: values.lastName,
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

  // Форматирование даты и времени
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Не указано';
    return `${formatDate(dateString)} в ${formatTime(dateString)}`;
  };

  return (
    <Modal
      title={
        <span>
          <EditOutlined style={{ marginRight: 8 }} />
          Редактировать пользователя
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
      {/* Информация о регистрации */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 20 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <CalendarOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          <Text strong>Дата регистрации:</Text>
          <Text style={{ marginLeft: 8 }}>{formatDate(user?.created_at)}</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ClockCircleOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          <Text strong>Время регистрации:</Text>
          <Text style={{ marginLeft: 8 }}>{formatTime(user?.created_at)}</Text>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          ID: {user?.id} | Баланс: {user?.balance} ₽
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
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

        <Form.Item
          name="lastName"
          label="Фамилия"
        >
          <Input placeholder="Фамилия" />
        </Form.Item>

        <Form.Item
          name="firstName"
          label="Имя"
        >
          <Input placeholder="Имя" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Телефон"
          rules={[
            {
              pattern: /^[\+]?[0-9\s\-\(\)]{10,20}$/,
              message: 'Неверный формат телефона'
            }
          ]}
        >
          <Input placeholder="+7 (999) 123-45-67" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Отмена</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Сохранить
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditUserModal;