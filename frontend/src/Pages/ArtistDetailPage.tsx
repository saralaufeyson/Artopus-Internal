// frontend/src/pages/ArtistDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Breadcrumb, Spin, message, Row, Col, Card, Avatar, Tag,
  Table, Space, Button, Descriptions, Image
} from 'antd';
import { UserOutlined, ArrowLeftOutlined, InstagramOutlined, GlobalOutlined, MailOutlined, PhoneOutlined, PictureOutlined, EyeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../Context/NotificationContext'; // Import useNotification
import { useAuth } from '../Context/AuthContext';
import type { Artist } from '../types/artist';
import type { Artwork, ArtworksResponse } from '../types/artwork';

const { Title, Text, Paragraph, Link } = Typography;

const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showNotification } = useNotification(); // Use notification hook

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchArtistDetails = useCallback(async () => {
    if (!id || !token) {
      showNotification('error', 'Artist ID is missing or you are not authenticated.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch artist details and artworks in parallel
      const [artistRes, artworksRes] = await Promise.all([
        axios.get<Artist>(`http://localhost:5000/api/artists/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<ArtworksResponse>(`http://localhost:5000/api/artworks?artist=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setArtist(artistRes.data);
      setArtworks(artworksRes.data.artworks);

    } catch (error: any) {
      console.error('Failed to fetch artist details:', error);
      showNotification('error', error.response?.data?.message || 'Failed to load artist details.');
      navigate('/artists'); // Redirect if artist not found
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    fetchArtistDetails();
  }, [fetchArtistDetails]);

  const artworkColumns = [
    {
      title: 'Artwork',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Artwork) => (
        <Space>
          <Image
            width={50}
            height={50}
            src={record.imageUrl || 'https://via.placeholder.com/50?text=No+Image'}
            alt={record.title}
            style={{ objectFit: 'cover' }}
            fallback="https://via.placeholder.com/50?text=Error"
          />
          <Link onClick={() => navigate(`/artworks/${record._id}`)}>{text}</Link>
        </Space>
      ),
    },
    {
      title: 'Code No.',
      dataIndex: 'codeNo',
      key: 'codeNo',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'available') color = 'green';
        if (status === 'sold') color = 'red';
        if (status === 'on_display') color = 'blue';
        return <Tag color={color}>{status.toUpperCase().replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price: number) => `₹${price.toLocaleString()}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Artwork) => (
        <Button icon={<EyeOutlined />} onClick={() => navigate(`/artworks/${record._id}`)}>
          View
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="Loading artist details..." />
      </div>
    );
  }

  if (!artist) {
    return <Title level={3}>Artist not found.</Title>;
  }

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item>
          <span onClick={() => navigate('/artists')} style={{ cursor: 'pointer' }}>
            <ArrowLeftOutlined /> Artists
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><UserOutlined /> Artist: {artist.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Avatar
              size={150}
              src={artist.profileImageUrl || undefined}
              icon={<UserOutlined />}
              style={{ marginBottom: 16, border: '2px solid #f0f0f0' }}
            />
            <Title level={3} style={{ margin: 0 }}>{artist.name}</Title>
            <Tag color={artist.status === 'active' ? 'green' : 'red'}>{artist.status?.toUpperCase() || 'N/A'}</Tag>
            <Space direction="vertical" align="start" style={{ marginTop: 24, textAlign: 'left' }}>
              {artist.contact?.email && <Text><MailOutlined /> {artist.contact.email}</Text>}
              {artist.contact?.phone && <Text><PhoneOutlined /> {artist.contact.phone}</Text>}
              {artist.socialMedia?.instagram && <Link href={artist.socialMedia.instagram} target="_blank"><InstagramOutlined /> Instagram</Link>}
              {artist.socialMedia?.website && <Link href={artist.socialMedia.website} target="_blank"><GlobalOutlined /> Website</Link>}
            </Space>
          </Col>
          <Col xs={24} md={16}>
            <Descriptions title="Artist Information" bordered column={1} size="small">
              <Descriptions.Item label="Bio">
                <Paragraph ellipsis={{ rows: 4, expandable: true, symbol: 'more' }}>
                  {artist.bio || 'No biography available.'}
                </Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Address">{artist.contact?.address || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Internal Notes">
                <Paragraph type="secondary">
                  {artist.internalNotes || 'No internal notes.'}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 24 }} title={<><PictureOutlined /> Artworks by {artist.name}</>}>
        <Table
          columns={artworkColumns}
          dataSource={artworks}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default ArtistDetailPage;