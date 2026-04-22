import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Button, Spin, Alert, message, Typography, Space } from 'antd';
import { ReloadOutlined, ShoppingCartOutlined, UploadOutlined } from '@ant-design/icons';
import {
  fetchProducts,
  fetchPaymentMethods,
  createSale,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from '../../store/slices/salesSlice';
import ProductCard from '../../components/Sales/ProductCard';
import CartTable from '../../components/Sales/CartTable';
import PaymentModal from '../../components/Sales/PaymentModal';
import StockModal from '../../components/Sales/StockModal';
import EditProductModal from '../../components/Sales/EditProductModal';

const { Title } = Typography;

function SalesPage() {
  const dispatch = useDispatch();
  const {
    products,
    paymentMethods,
    cart,
    isLoading,
    isSubmitting,
    error,
  } = useSelector(state => state.sales);

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
      await dispatch(createSale({
        items: cart,
        paymentMethodId,
      })).unwrap();
      
      message.success('Продажа успешно оформлена!');
      setPaymentModalVisible(false);
    } catch (error) {
      message.error('Ошибка при оформлении продажи');
    }
  };

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => dispatch(fetchProducts())}>
            Повторить
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          🛒 Продажи
        </Title>
        <Space>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setStockModalVisible(true)}
          >
            Приход
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchProducts())}
            loading={isLoading}
          >
            Обновить
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Левая колонка - Корзина */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                Корзина ({cart.length})
              </span>
            }
            style={{ marginBottom: 24 }}
          >
            <Spin spinning={isLoading}>
              <CartTable
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveFromCart}
                onClear={handleClearCart}
              />
              
              {cart.length > 0 && (
                <div style={{ marginTop: 24, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => setPaymentModalVisible(true)}
                  >
                    Перейти к оплате
                  </Button>
                </div>
              )}
            </Spin>
          </Card>
        </Col>

        {/* Правая колонка - Список товаров */}
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
                    <EditProductModal
                        visible={editModalVisible}
                        product={selectedProduct}
                        onClose={() => {
                            setEditModalVisible(false);
                            setSelectedProduct(null);
                        }}
                        />
                  </Col>
                ))}
              </Row>
              
              {products.length === 0 && !isLoading && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  Нет доступных товаров
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно оплаты */}
      <PaymentModal
        visible={paymentModalVisible}
        cart={cart}
        paymentMethods={paymentMethods}
        onClose={() => setPaymentModalVisible(false)}
        onSubmit={handlePayment}
        loading={isSubmitting}
      />

      {/* Модальное окно прихода товара */}
      <StockModal
        visible={stockModalVisible}
        products={products}
        onClose={() => setStockModalVisible(false)}
      />
    </div>
  );
}

export default SalesPage;