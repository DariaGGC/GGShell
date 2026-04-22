import { Modal, Form, Select, Button, Space, Typography, Divider } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import './PaymentModal.css';

const { Text, Title } = Typography;

function PaymentModal({ visible, cart, paymentMethods, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  const totalSum = cart.reduce((sum, item) => sum + item.cartQuantity * item.price, 0);

  const handleSubmit = (values) => {
    onSubmit(values.paymentMethodId);
  };

  return (
    <Modal
      title={
        <Space>
          <CreditCardOutlined />
          <span>Оформление продажи</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
      <div className="cart-summary">
        <Text type="secondary">Товары в корзине:</Text>
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <Text>{item.name} × {item.cartQuantity}</Text>
            <Text strong className="cart-item-price">
              {item.cartQuantity * item.price} ₽
            </Text>
          </div>
        ))}
        <Divider className="cart-divider" />
        <div className="cart-total">
          <Title level={5}>Итого к оплате:</Title>
          <Title level={4} className="cart-total-price">{totalSum} ₽</Title>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="paymentMethodId"
          label="Способ оплаты"
          rules={[{ required: true, message: 'Выберите способ оплаты' }]}
        >
          <Select placeholder="Выберите способ оплаты" size="large">
            {paymentMethods.map(method => (
              <Select.Option key={method.id} value={method.id}>
                {method.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item className="modal-actions">
          <Space>
            <Button onClick={onClose}>Отмена</Button>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              Оплатить
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default PaymentModal;