import { useState } from 'react';
import { Modal, Form, InputNumber, Select, Button, Space, Typography, message } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import './TopUpModal.css';

const { Text } = Typography;

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

function TopUpModal({ visible, user, paymentMethods, onClose, onSubmit }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await onSubmit({
        userId: user.id,
        amount: values.amount,
        paymentMethodId: values.paymentMethodId
      });
      message.success(`Баланс пополнен на ${values.amount} ₽`);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Ошибка при пополнении баланса');
    } finally {
      setLoading(false);
    }
  };

  const balanceColor = (user?.balance || 0) > 0 ? '#52c41a' : '#ff4d4f';

  return (
    <Modal
      title={
        <Space>
          <WalletOutlined />
          <span>Пополнение баланса</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div className="topup-user-info">
        <Text type="secondary">Клиент:</Text>
        <div className="topup-user-name">{user?.name || user?.login}</div>
        <Text type="secondary">Текущий баланс:</Text>
        <div className="topup-user-balance" style={{ color: balanceColor }}>
          {user?.balance || 0} ₽
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Быстрый выбор">
          <Space wrap>
            {QUICK_AMOUNTS.map(amount => (
              <Button key={amount} onClick={() => form.setFieldsValue({ amount })}>
                {amount} ₽
              </Button>
            ))}
          </Space>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Сумма пополнения"
          rules={[
            { required: true, message: 'Введите сумму' },
            { type: 'number', min: 1, message: 'Минимум 1 ₽' },
            { type: 'number', max: 50000, message: 'Максимум 50 000 ₽' },
          ]}
        >
          <InputNumber
            className="topup-amount-input"
            placeholder="Введите сумму"
            min={1}
            max={50000}
            addonAfter="₽"
          />
        </Form.Item>

        <Form.Item
          name="paymentMethodId"
          label="Способ оплаты"
          rules={[{ required: true, message: 'Выберите способ оплаты' }]}
        >
          <Select placeholder="Выберите способ оплаты">
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
            <Button type="primary" htmlType="submit" loading={loading}>
              Пополнить
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default TopUpModal;