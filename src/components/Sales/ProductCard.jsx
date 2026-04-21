import { Card, Button, Tag, Space, Typography } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

function ProductCard({ product, onAddToCart, disabled }) {
  const isOutOfStock = product.quantity === 0;

  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      bodyStyle={{ padding: 16 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Title level={5} style={{ marginBottom: 8 }}>
          {product.name}
        </Title>
        
        <Space direction="vertical" size={4} style={{ flex: 1 }}>
          <Text type="secondary">Цена:</Text>
          <Text strong style={{ fontSize: 20, color: '#1677ff' }}>
            {product.price} ₽
          </Text>
          
          <Text type="secondary">В наличии:</Text>
          <Tag color={isOutOfStock ? 'red' : 'green'}>
            {product.quantity} шт.
          </Tag>
        </Space>

        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => onAddToCart(product)}
          disabled={disabled || isOutOfStock}
          style={{ marginTop: 16 }}
          block
        >
          {isOutOfStock ? 'Нет в наличии' : 'В корзину'}
        </Button>
      </div>
    </Card>
  );
}

export default ProductCard;