import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Button, Spin, Alert, message, Typography, Space } from 'antd';
import { ReloadOutlined, ShoppingCartOutlined, UploadOutlined } from '@ant-design/icons';
import {
  fetchProducts, fetchPaymentMethods, createSale,
  addToCart, removeFromCart, updateCartQuantity, clearCart
} from '../../store/slices/salesSlice';
import ProductCard from '../../components/Sales/ProductCard';
import CartTable from '../../components/Sales/CartTable';
import PaymentModal from '../../components/Sales/PaymentModal';
import StockModal from '../../components/Sales/StockModal';
import EditProductModal from '../../components/Sales/EditProductModal';
import './Sales.css';

const { Title } = Typography;

function SalesPage() {
  const dispatch = useDispatch();
  const { products, paymentMethods, cart, isLoading, isSubmitting, error } =
    useSelector(state => state.sales);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setEditModalVisible(true);
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    message.success(`${product.name} добавлен в корзину`);
  };

  const handleUpdateQuantity = (productId, quantity) => {
    dispatch(updateCartQuantity({ productId, quantity }));
  };

  const handleRemoveFromCart = (productId) => {
    dispatch(removeFromCart(productId));
    message.info('Товар удалён из корзины');
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    message.info('Корзина очищена');
  };

  const handlePayment = async (paymentMethodId) => {
    try {
      await dispatch(createSale({ items: cart, paymentMethodId })).unwrap();
      message.success('Продажа успешно оформлена!');
      setPaymentModalVisible(false);
    } catch {
      message.error('Ошибка при оформлении продажи');
    }
  };

  if (error) {
    return (
      <Alert message="Ошибка загрузки" description={error} type="error" showIcon
        action={<Button size="small" onClick={() => dispatch(fetchProducts())}>Повторить</Button>} />
    );
  }

  return (
    <div className="sales-page">
      <div className="sales-header">
        <Title level={2}>🛒 Продажи</Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setStockModalVisible(true)}>Приход</Button>
          <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchProducts())} loading={isLoading}>Обновить</Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title={<span><ShoppingCartOutlined /> Корзина ({cart.length})</span>} className="cart-card">
            <Spin spinning={isLoading}>
              <CartTable
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveFromCart}
                onClear={handleClearCart}
              />
              {cart.length > 0 && (
                <div className="cart-actions">
                  <Button type="primary" size="large" onClick={() => setPaymentModalVisible(true)}>
                    Перейти к оплате
                  </Button>
                </div>
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="📦 Товары в наличии">
            <Spin spinning={isLoading}>
              <Row gutter={[16, 16]}>
                {products.map(product => (
                  <Col xs={24} sm={12} md={8} key={product.id}>
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onEdit={handleEditProduct}
                      disabled={product.quantity === 0}
                    />
                  </Col>
                ))}
              </Row>
              {products.length === 0 && !isLoading && (
                <div className="empty-products">Нет доступных товаров</div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      <PaymentModal
        visible={paymentModalVisible}
        cart={cart}
        paymentMethods={paymentMethods}
        onClose={() => setPaymentModalVisible(false)}
        onSubmit={handlePayment}
        loading={isSubmitting}
      />

      <StockModal
        visible={stockModalVisible}
        products={products}
        onClose={() => setStockModalVisible(false)}
      />

      <EditProductModal
        visible={editModalVisible}
        product={selectedProduct}
        onClose={() => { setEditModalVisible(false); setSelectedProduct(null); }}
      />
    </div>
  );
}

export default SalesPage;