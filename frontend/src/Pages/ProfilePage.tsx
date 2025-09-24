// frontend/src/pages/ProfilePage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><SettingOutlined /> Profile</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>User Profile</Title>
      <p>Your profile details and settings will be here.</p>
    </div>
  );
};

export default ProfilePage;