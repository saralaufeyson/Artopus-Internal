// frontend/src/pages/RegisterPage.tsx
import React from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../Context/NotificationContext'; // Import useNotification

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { showNotification } = useNotification(); // Use notification hook

  const onFinish = async (values: any) => {
    const { username, email, password, firstName, lastName, roles } = values;
    try {
      await axios.post('http://localhost:5000/api/users/register', {
        username,
        email,
        password,
        firstName,
        lastName,
        roles,
      });
      showNotification('success', 'Registration successful! Please log in with your credentials.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      showNotification('error', error.response?.data?.message || 'Registration failed. Please try again.');
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
        style={{ width: 450, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/artopus-logo.png"
            alt="Artopus India Logo"
            style={{ height: 80, marginBottom: 16 }}
          />
          <Title level={3}>Create New Account</Title>
          <Text type="secondary">Join the Artopus India Team</Text>
        </div>
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          scrollToFirstError
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input a username!', whitespace: true }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'The input is not a valid E-mail!' },
              { required: true, message: 'Please input your E-mail!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords that you entered do not match!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'Please input your first name!' }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="First Name" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Please input your last name!' }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="Last Name" />
            </Form.Item>
          </Space>
          
          <Form.Item
            name="roles"
            label="Role"
            initialValue={['data_entry']}
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select mode="tags" placeholder="Select roles for the user">
              <Option value="data_entry">Data Entry</Option>
              <Option value="admin">Admin</Option>
              <Option value="pricing_manager">Pricing Manager</Option>
              <Option value="marketing">Marketing</Option>
              <Option value="artist_manager">Artist Manager</Option>
            </Select>
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
              Register
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Text>Already have an account? <Link to="/login">Log in here</Link></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
