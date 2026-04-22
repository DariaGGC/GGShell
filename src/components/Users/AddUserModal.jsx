import { useState } from 'react';
import { Modal, Form, Input, Button, Space, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import apiClient from '../../api/client';
import { fetchUsers } from '../../store/slices/usersSlice';

function AddUserModal({ visible, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      await apiClient.post('/users', {
        login: values.login,
        firstName: values.firstName || '',
        lastName: values.lastName || '',
        phone: values.phone || '',
        balance: 0,
        created_at: now
      });
      
      message.success(`Пользователь "${values.login}" создан`);
      form.resetFields();
      dispatch(fetchUsers());
      onClose();
    } catch (error) {
      message.error('Ошибка при создании пользователя');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <UserAddOutlined style={{ marginRight: 8 }} />
          Добавить нового пользователя
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
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

        <Form.Item name="lastName" label="Фамилия">
          <Input placeholder="Фамилия" />
        </Form.Item>

        <Form.Item name="firstName" label="Имя">
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
              Создать
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddUserModal;