// frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Breadcrumb, Row, Col, Card, Statistic, Spin, List, Tag, message, Space, Button } from 'antd';
import { HomeOutlined, UserOutlined, PictureOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../Context/AuthContext';
import { useNotification } from '../Context/NotificationContext'; // Import useNotification
import axios from 'axios';
import type { Artwork, ArtworksResponse, Artist } from '../types/artwork';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface DashboardStats {
  totalArtworks: number;
  totalArtists: number;
}

const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification(); // Use notification hook

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentArtworks, setRecentArtworks] = useState<Artwork[]>([]);
  const [recentArtists, setRecentArtists] = useState<Artist[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      // Fetch artworks and artists in parallel
      const [artworksRes, artistsRes] = await Promise.all([
        axios.get<ArtworksResponse>(`http://localhost:5000/api/artworks?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Artist[]>(`http://localhost:5000/api/artists`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setRecentArtworks(artworksRes.data.artworks);
      const totalArtworks = artworksRes.data.total;

      setRecentArtists(artistsRes.data.slice(0, 5));
      const totalArtists = artistsRes.data.length;

      setStats({
        totalArtworks: totalArtworks || 0,
        totalArtists: totalArtists || 0,
      });

    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error.response?.data?.message || error.message, error);
      showNotification('error', error.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><HomeOutlined /> Dashboard</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>Welcome, {user ? user.username : 'User'}!</Title>
      <Text type="secondary">Here's a quick overview of your Artopus India inventory.</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Artworks"
              value={stats?.totalArtworks}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#A36FFF' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Artists"
              value={stats?.totalArtists}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#6A5ACD' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Recently Added Artworks" bordered={false}>
            <List
              itemLayout="horizontal"
              dataSource={recentArtworks}
              renderItem={artwork => (
                <List.Item
                  actions={[<a key="view" onClick={() => navigate(`/artworks/${artwork._id}`)}><EyeOutlined /> View</a>]}
                >
                  <List.Item.Meta
                    avatar={<PictureOutlined style={{ fontSize: '24px', color: '#A36FFF' }} />}
                    title={<a onClick={() => navigate(`/artworks/${artwork._id}`)}>{artwork.title}</a>}
                    description={
                      <Space>
                        <Text type="secondary">by {(artwork.artist as Artist).name}</Text>
                        <Tag color="blue">{artwork.status.toUpperCase().replace('_', ' ')}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            <Button type="link" onClick={() => navigate('/artworks')} style={{ marginTop: 16 }}>
              View All Artworks
            </Button>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recently Added Artists" bordered={false}>
            <List
              itemLayout="horizontal"
              dataSource={recentArtists}
              renderItem={artist => (
                <List.Item
                  actions={[<a key="view" onClick={() => navigate(`/artists/${artist._id}`)}><EyeOutlined /> View</a>]}
                >
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: '24px', color: '#6A5ACD' }} />}
                    title={<a onClick={() => navigate(`/artists/${artist._id}`)}>{artist.name}</a>}
                    description={<Text type="secondary">{artist.contact?.email || artist.contact?.phone || 'No contact'}</Text>}
                  />
                </List.Item>
              )}
            />
            <Button type="link" onClick={() => navigate('/artists')} style={{ marginTop: 16 }}>
              View All Artists
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;