// frontend/src/pages/LoginPage.tsx
import React from 'react';
import { Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: any) => { // Use 'any' or define specific login form types
    const { email, password } = values;
    const result = await login(email, password);
    if (result.success) {
      message.success('Login successful!');
      navigate('/dashboard', { replace: true });
    } else {
      message.error(result.message || 'Login failed.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #A36FFF, #FF7B8D)'
    }}>
      <Card
        style={{ width: 400, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/artopus-logo.png"
            alt="Artopus India Logo"
            style={{ height: 80, marginBottom: 16 }}
          />
          <Title level={3}>Welcome to Artopus India</Title>
          <Text type="secondary">Login to your account</Text>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your Email!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Email"
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large"
              style={{
                background: 'linear-gradient(to right, #A36FFF, #FF7B8D)',
                border: 'none',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(163, 111, 255, 0.4)',
              }}
            >
              Log In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;