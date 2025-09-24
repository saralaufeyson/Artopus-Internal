// frontend/src/components/AppLayout/index.tsx
import React, { useState, type ReactNode } from 'react';
import { Layout, Menu, Button, theme, Input, Dropdown, Avatar, Space, Badge, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserOutlined,
  PictureOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Search } = Input;
const { Text } = Typography;

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const {
    token: { colorBgContainer, colorPrimary, colorText },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/artists',
      icon: <UserOutlined />,
      label: 'Artists',
      onClick: () => navigate('/artists'),
    },
    {
      key: '/artworks',
      icon: <PictureOutlined />,
      label: 'Artworks',
      onClick: () => navigate('/artworks'),
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      onClick: () => navigate('/reports'),
    },
    {
      key: '/profile',
      icon: <SettingOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout-menu-item', // Unique key for logout that won't conflict with path
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const profileMenuItems = [
    {
      key: 'user-profile',
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout-dropdown-item', // Unique key for dropdown logout
      label: 'Logout',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleSearch = (value: string) => {
    if (value.trim()) {
      console.log('Searching for:', value);
      navigate(`/artworks?search=${encodeURIComponent(value)}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={220}>
        <div
          className="logo-container"
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            overflow: 'hidden',
            background: '#ffffff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <img
            src="/artopus-logo.png"
            alt="Artopus India Logo"
            style={{
              height: 40,
              width: collapsed ? 40 : 'auto',
              maxWidth: '100%',
              marginRight: collapsed ? 0 : 8,
            }}
          />
          {!collapsed && (
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: '1.2em',
                color: '#333',
                whiteSpace: 'nowrap',
              }}
            >
              ARTOPUS <br /> <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>INDIA</span>
            </Text>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24, borderBottom: '1px solid #f0f0f0' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Search
              placeholder="Search artworks, artists..."
              onSearch={handleSearch}
              style={{ width: 280 }}
              allowClear
              prefix={<SearchOutlined style={{ color: colorPrimary }} />}
            />
            <Badge count={5} overflowCount={99} size="small" offset={[-4, 4]}>
              <BellOutlined style={{ fontSize: '18px', color: colorText }} />
            </Badge>
            <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  <Avatar style={{ backgroundColor: colorPrimary }}>
                    {user ? user.username[0].toUpperCase() : <UserOutlined />}
                  </Avatar>
                  <Text strong style={{ color: colorText }}>
                    {user ? user.username : 'User'}
                  </Text>
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#f0f2f5',
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;