import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { updateProduct } from '../../store/slices/salesSlice';
import './EditProductModal.css';

function EditProductModal({ visible, product, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && visible) {
      form.setFieldsValue({
        name: product.name,
        price: product.price,
      });
    }
  }, [product, visible, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await dispatch(updateProduct({
        productId: product.id,
        name: values.name,
        price: values.price
      })).unwrap();
      
      message.success(`Товар "${values.name}" обновлён`);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Ошибка при обновлении товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span><EditOutlined className="modal-icon" /> Редактировать товар</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div className="product-current-info">
        <strong>Текущие данные:</strong>
        <div>Название: {product?.name}</div>
        <div>Цена: {product?.price} ₽</div>
        <div>В наличии: {product?.quantity} шт.</div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Новое название"
          rules={[
            { required: true, message: 'Введите название' },
            { min: 2, message: 'Минимум 2 символа' }
          ]}
        >
          <Input placeholder="Название товара" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Новая цена (₽)"
          rules={[
            { required: true, message: 'Введите цену' },
            { type: 'number', min: 1, message: 'Минимум 1 ₽' }
          ]}
        >
          <InputNumber
            className="price-input"
            placeholder="Цена за единицу"
            min={1}
            addonAfter="₽"
          />
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

export default EditProductModal;