// frontend/src/pages/ProfilePage.tsx
import React from 'react';
import { Typography, Breadcrumb, Card, Descriptions, Tag, Avatar, Spin } from 'antd';
import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../Context/AuthContext';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><SettingOutlined /> Profile</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>User Profile</Title>
      
      {user ? (
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Avatar size={96} icon={<UserOutlined />} style={{ backgroundColor: '#A36FFF' }}>
              {user.username?.[0]?.toUpperCase()}
            </Avatar>
            <Title level={3} style={{ marginTop: '16px' }}>{user.username}</Title>
          </div>
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="First Name">{user.firstName || 'Not set'}</Descriptions.Item>
            <Descriptions.Item label="Last Name">{user.lastName || 'Not set'}</Descriptions.Item>
            <Descriptions.Item label="Roles">
              {user.roles && user.roles.map(role => (
                <Tag color="blue" key={role}>{role.toUpperCase()}</Tag>
              ))}
            </Descriptions.Item>
             <Descriptions.Item label="User ID">{user._id}</Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card>
          <p>Could not load user details. Please try logging in again.</p>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;