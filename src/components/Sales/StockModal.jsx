
import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, message, Tabs } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addStock, createProduct } from '../../store/slices/salesSlice';

const { TabPane } = Tabs;

function StockModal({ visible, products, onClose }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [newProductForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('existing');

  // Пополнение существующего товара
  const handleAddStock = async (values) => {
    setLoading(true);
    try {
      await dispatch(addStock({
        productId: values.productId,
        quantity: values.quantity
      })).unwrap();
      
      message.success(`Товар пополнен на ${values.quantity} шт.`);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Ошибка при пополнении товара');
    } finally {
      setLoading(false);
    }
  };

  // Создание нового товара
  const handleCreateProduct = async (values) => {
    setLoading(true);
    try {
      await dispatch(createProduct({
        name: values.name,
        price: values.price,
        quantity: values.quantity || 0
      })).unwrap();
      
      message.success(`Товар "${values.name}" создан`);
      newProductForm.resetFields();
      onClose();
    } catch (error) {
      message.error('Ошибка при создании товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <UploadOutlined style={{ marginRight: 8 }} />
          Приход товара
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Вкладка: Пополнить существующий */}
        <Tabs.TabPane tab="📦 Пополнить существующий" key="existing">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddStock}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="productId"
              label="Выберите товар"
              rules={[{ required: true, message: 'Выберите товар' }]}
            >
              <Select
                placeholder="Поиск по названию"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label || '').toLowerCase().includes(input.toLowerCase())
                }
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.name} (в наличии: ${p.quantity} шт., цена: ${p.price} ₽)`
                }))}
              />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Количество для добавления"
              rules={[
                { required: true, message: 'Введите количество' },
                { type: 'number', min: 1, message: 'Минимум 1 шт.' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Введите количество"
                min={1}
                addonAfter="шт."
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={onClose}>Отмена</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Пополнить
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        {/* Вкладка: Создать новый товар */}
        <Tabs.TabPane tab="🆕 Создать новый" key="new">
          <Form
            form={newProductForm}
            layout="vertical"
            onFinish={handleCreateProduct}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="name"
              label="Название товара"
              rules={[
                { required: true, message: 'Введите название' },
                { min: 2, message: 'Минимум 2 символа' }
              ]}
            >
              <Input placeholder="Например: Snickers" />
            </Form.Item>

            <Form.Item
              name="price"
              label="Цена (₽)"
              rules={[
                { required: true, message: 'Введите цену' },
                { type: 'number', min: 1, message: 'Минимум 1 ₽' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Цена за единицу"
                min={1}
                addonAfter="₽"
              />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Начальное количество"
              rules={[
                { type: 'number', min: 0, message: 'Минимум 0 шт.' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
                addonAfter="шт."
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={onClose}>Отмена</Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<PlusOutlined />}
                >
                  Создать товар
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
}

export default StockModal;