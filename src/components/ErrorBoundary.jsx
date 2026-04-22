import { Component } from 'react';
import { Alert, Button } from 'antd';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Ошибка загрузки графика"
          description="Не удалось отобразить график. Возможно, нет данных для отображения."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => this.setState({ hasError: false })}>
              Попробовать снова
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;