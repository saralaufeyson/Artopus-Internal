import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Breadcrumb, Spin, Row, Col, Card, Avatar, Tag,
  Table, Space, Button, Descriptions, Image, Divider, Statistic
} from 'antd';
import {
  UserOutlined, ArrowLeftOutlined, InstagramOutlined, GlobalOutlined,
  MailOutlined, PhoneOutlined, PictureOutlined, EyeOutlined,
  EditOutlined, EnvironmentOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../Context/NotificationContext';
import { useAuth } from '../Context/AuthContext';
import type { Artist } from '../types/artist';
import type { Artwork, ArtworksResponse } from '../types/artwork';

const { Title, Text, Paragraph, Link } = Typography;

const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showNotification } = useNotification();

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
      navigate('/artists');
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    fetchArtistDetails();
  }, [fetchArtistDetails]);

  const artworkColumns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string, record: Artwork) => (
        <Image
          width={60}
          height={60}
          src={imageUrl || 'https://via.placeholder.com/60?text=No+Image'}
          alt={record.title}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://via.placeholder.com/60?text=Error"
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Artwork) => (
        <Link onClick={() => navigate(`/artworks/${record._id}`)}>{text}</Link>
      ),
    },
    {
      title: 'Code No.',
      dataIndex: 'codeNo',
      key: 'codeNo',
    },
    {
      title: 'Medium',
      dataIndex: 'medium',
      key: 'medium',
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
        if (status === 'loaned') color = 'orange';
        return <Tag color={color}>{status.toUpperCase().replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price: number) => <Text strong>₹{price.toLocaleString('en-IN')}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
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

  const totalArtworks = artworks.length;
  const availableArtworks = artworks.filter(a => a.status === 'available').length;
  const soldArtworks = artworks.filter(a => a.status === 'sold').length;
  const totalValue = artworks.reduce((sum, a) => sum + (a.sellingPrice || 0), 0);

  return (
    <div style={{ paddingBottom: 40 }}>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item>
          <span onClick={() => navigate('/artists')} style={{ cursor: 'pointer' }}>
            <ArrowLeftOutlined /> Artists
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><UserOutlined /> {artist.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Card
        style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '40px 32px', color: 'white' }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={6} style={{ textAlign: 'center' }}>
              <Avatar
                size={150}
                src={artist.profileImageUrl || undefined}
                icon={<UserOutlined />}
                style={{ border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Title level={2} style={{ color: 'white', marginBottom: 8 }}>{artist.name}</Title>
              <Space size="large" wrap>
                <Tag color={artist.status === 'active' ? 'success' : 'error'} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {artist.status?.toUpperCase() || 'N/A'}
                </Tag>
                {artist.contact?.email && (
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <MailOutlined /> {artist.contact.email}
                  </Text>
                )}
                {artist.contact?.phone && (
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <PhoneOutlined /> {artist.contact.phone}
                  </Text>
                )}
              </Space>
              {artist.contact?.address && (
                <div style={{ marginTop: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <EnvironmentOutlined /> {artist.contact.address}
                  </Text>
                </div>
              )}
              <Space size="middle" style={{ marginTop: 16 }}>
                {artist.socialMedia?.instagram && (
                  <Link href={artist.socialMedia.instagram} target="_blank" style={{ color: 'white' }}>
                    <InstagramOutlined style={{ fontSize: 24 }} />
                  </Link>
                )}
                {artist.socialMedia?.website && (
                  <Link href={artist.socialMedia.website} target="_blank" style={{ color: 'white' }}>
                    <GlobalOutlined style={{ fontSize: 24 }} />
                  </Link>
                )}
              </Space>
            </Col>
            <Col xs={24} md={6} style={{ textAlign: 'right' }}>
              <Button
                type="default"
                size="large"
                icon={<EditOutlined />}
                onClick={() => navigate(`/artists/edit/${id}`)}
                style={{ backgroundColor: 'white', color: '#667eea' }}
              >
                Edit Artist
              </Button>
            </Col>
          </Row>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Artworks"
              value={totalArtworks}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Available"
              value={availableArtworks}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Sold"
              value={soldArtworks}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={totalValue}
              prefix="₹"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Divider orientation="left"><InfoCircleOutlined /> Artist Information</Divider>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Biography">
            <Paragraph style={{ margin: 0 }}>
              {artist.bio || 'No biography available.'}
            </Paragraph>
          </Descriptions.Item>
          {artist.internalNotes && (
            <Descriptions.Item label="Internal Notes">
              <Paragraph type="secondary" style={{ margin: 0 }}>
                {artist.internalNotes}
              </Paragraph>
            </Descriptions.Item>
          )}
          {artist.socialMedia?.other && (
            <Descriptions.Item label="Other Social Media">
              <Link href={artist.socialMedia.other} target="_blank">{artist.socialMedia.other}</Link>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={<><PictureOutlined /> Artworks by {artist.name}</>}>
        <Table
          columns={artworkColumns}
          dataSource={artworks}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} artworks` }}
          locale={{ emptyText: 'No artworks found for this artist.' }}
        />
      </Card>
    </div>
  );
};

export default ArtistDetailPage;
