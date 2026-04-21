import { Table, InputNumber, Button, Space, Typography, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

function CartTable({ cart, onUpdateQuantity, onRemove, onClear }) {
  if (cart.length === 0) {
    return (
      <Empty
        description="Корзина пуста"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const columns = [
    {
      title: 'Товар',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      width: '20%',
      render: (price) => `${price} ₽`,
    },
    {
      title: 'Количество',
      key: 'quantity',
      width: '20%',
      render: (_, record) => (
        <InputNumber
          min={1}
          max={record.quantity}
          value={record.cartQuantity}
          onChange={(value) => onUpdateQuantity(record.id, value)}
          size="small"
          style={{ width: 70 }}
        />
      ),
    },
    {
      title: 'Сумма',
      key: 'total',
      width: '15%',
      render: (_, record) => (
        <Text strong>{record.cartQuantity * record.price} ₽</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: '5%',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onRemove(record.id)}
          size="small"
        />
      ),
    },
  ];

  const totalSum = cart.reduce(
    (sum, item) => sum + item.cartQuantity * item.price,
    0
  );

  return (
    <div>
      <Table
        columns={columns}
        dataSource={cart}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 500 }}
      />
      
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>
            Итого: {totalSum} ₽
          </Title>
          <Button size="small" onClick={onClear}>
            Очистить корзину
          </Button>
        </Space>
      </div>
    </div>
  );
}

export default CartTable;