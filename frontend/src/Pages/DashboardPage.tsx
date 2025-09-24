// frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Breadcrumb, Row, Col, Card, Statistic, Spin, List, Tag, message, Space, Button } from 'antd';
import { HomeOutlined, UserOutlined, PictureOutlined, LoadingOutlined, CheckCircleOutlined, InfoCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../Context/AuthContext';
import axios from 'axios';
import type { Artwork, ArtworksResponse } from '../types/artwork'; // Reuse artwork types
 // Reuse artwork types
// Reuse artwork types
import type { Artist, ArtistsResponse } from '../types/artist'; // Reuse artist types
   // Reuse artist types
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// --- Type Definitions for Dashboard Stats ---
interface DashboardStats {
  totalArtworks: number;
  totalArtists: number;
  pendingArtworkDeletionRequests: number; // Assuming you can query this
  // Add more stats as needed
}

const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentArtworks, setRecentArtworks] = useState<Artwork[]>([]);
  const [pendingDeletionArtworks, setPendingDeletionArtworks] = useState<Artwork[]>([]);
  const [recentArtists, setRecentArtists] = useState<Artist[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    if (!token) {
      message.error("Authentication required. Please log in.");
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      // --- Fetch Total Artworks & Pending Deletion Artworks ---
      // Assuming your /api/artworks endpoint can filter by status and count total
      const artworksRes = await axios.get<ArtworksResponse>(`http://localhost:5000/api/artworks?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentArtworks(artworksRes.data.artworks); // For recent, get first 5
      const totalArtworks = artworksRes.data.count; // Assuming artworksRes has 'count' from backend

      // For pending deletion, assume you have a way to filter or a separate endpoint
      // For now, we'll simulate by filtering the fetched list or making a separate call
      const pendingDeletionRes = await axios.get<ArtworksResponse>(`http://localhost:5000/api/artworks?deletionApprovalStatus=pending&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingDeletionArtworks(pendingDeletionRes.data.artworks);


      // --- Fetch Total Artists & Recent Artists ---
      // Assuming /api/artists returns an array directly and has no count for now (based on previous discussion)
      // If your backend for /api/artists supports page/limit, use those instead.
      // For now, we'll fetch all and slice on frontend.
      const artistsRes = await axios.get<Artist[]>(`http://localhost:5000/api/artists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentArtists(artistsRes.data.slice(0, 5)); // Get first 5 for recent
      const totalArtists = artistsRes.data.length;


      // --- Set Stats ---
      setStats({
        totalArtworks: totalArtworks || 0, // Fallback if backend doesn't provide count
        totalArtists: totalArtists || 0,   // Fallback
        pendingArtworkDeletionRequests: pendingDeletionRes.data.count || 0, // Fallback
      });

    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error.response?.data?.message || error.message, error);
      message.error(error.response?.data?.message || 'Failed to load dashboard data.');
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
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Pending Deletion Requests"
              value={stats?.pendingArtworkDeletionRequests}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
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
                        <Text type="secondary">by {artwork.artist.name}</Text>
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
                    description={<Text type="secondary">{artist.contact?.email || artist.phone || 'No contact'}</Text>}
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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Artworks Awaiting Deletion Approval" bordered={false}>
            <List
              itemLayout="horizontal"
              dataSource={pendingDeletionArtworks}
              renderItem={artwork => (
                <List.Item
                  actions={[<a key="view" onClick={() => navigate(`/artworks/${artwork._id}`)}><EyeOutlined /> View</a>]}
                >
                  <List.Item.Meta
                    avatar={<LoadingOutlined style={{ fontSize: '24px', color: '#faad14' }} />}
                    title={<a onClick={() => navigate(`/artworks/${artwork._id}`)}>{artwork.title}</a>}
                    description={
                      <Space>
                        <Text type="secondary">by {artwork.artist.name}</Text>
                        <Tag color="gold">PENDING APPROVAL</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            {pendingDeletionArtworks.length === 0 && (
                <Text type="secondary">No artworks currently awaiting deletion approval.</Text>
            )}
          </Card>
        </Col>
        {/* You could add another card here for other recent activities or stats */}
      </Row>

    </div>
  );
};

export default DashboardPage;