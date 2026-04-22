import { useState } from 'react';
import { Modal, Form, Input, Button, Space, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import apiClient from '../../api/client';
import { fetchUsers } from '../../store/slices/usersSlice';
import './AddUserModal.css';

function AddUserModal({ visible, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      const userData = {
        login: values.login,
        name: values.name || `${values.lastName || ''} ${values.firstName || ''}`.trim(),
        phone: values.phone || '',
        balance: 0,
        created_at: now
      };
      
      await apiClient.post('/users', userData);
      
      message.success(`Пользователь "${values.login}" создан`);
      form.resetFields();
      dispatch(fetchUsers());
      onClose();
    } catch (error) {
      message.error('Ошибка при создании пользователя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span><UserAddOutlined className="modal-icon" /> Добавить нового пользователя</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
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
            <Button type="primary" htmlType="submit" loading={loading}>Создать</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddUserModal;