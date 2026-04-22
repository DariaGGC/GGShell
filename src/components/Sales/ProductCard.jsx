import { Card, Button, Tag, Space, Typography, Dropdown } from 'antd';
import { ShoppingCartOutlined, MoreOutlined, EditOutlined } from '@ant-design/icons';
import './ProductCard.css';

const { Text, Title } = Typography;

function ProductCard({ product, onAddToCart, onEdit, disabled }) {
  const isOutOfStock = product.quantity === 0;

  const menuItems = [
    {
      key: 'edit',
      label: 'Редактировать',
      icon: <EditOutlined />,
      onClick: () => onEdit(product),
    },
  ];

  return (
    <Card hoverable className="product-card">
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button type="text" icon={<MoreOutlined />} className="product-menu-btn" />
      </Dropdown>

      <div className="product-content">
        <Title level={5} className="product-title">{product.name}</Title>
        
        <Space direction="vertical" size={4} className="product-info">
          <Text type="secondary">Цена:</Text>
          <Text strong className="product-price">{product.price} ₽</Text>
          
          <Text type="secondary">В наличии:</Text>
          <Tag color={isOutOfStock ? 'red' : 'green'}>{product.quantity} шт.</Tag>
        </Space>

        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => onAddToCart(product)}
          disabled={disabled || isOutOfStock}
          className="product-add-btn"
          block
        >
          {isOutOfStock ? 'Нет в наличии' : 'В корзину'}
        </Button>
      </div>
    </Card>
  );
}

export default ProductCard;