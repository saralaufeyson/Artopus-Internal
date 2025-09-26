// frontend/src/pages/ArtworkDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Breadcrumb, Spin, message, Row, Col, Card, Tag,
  Descriptions, Image, Divider, List, Button, Space
} from 'antd';
import {
  PictureOutlined, ArrowLeftOutlined, EditOutlined, TagOutlined,
  CalendarOutlined, NumberOutlined, MoneyCollectOutlined, ShopOutlined,
  BookOutlined, FormOutlined, GlobalOutlined, AmazonOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import type { Artwork, Pricing } from '../types/artwork'; // Import both types

const { Title, Text, Paragraph, Link } = Typography;

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchArtworkDetails = useCallback(async () => {
    if (!id || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get<{ artwork: Artwork; pricing: Pricing }>(
        `http://localhost:5000/api/artworks/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArtwork(response.data.artwork);
      setPricing(response.data.pricing);
    } catch (error: any) {
      console.error('Failed to fetch artwork details:', error);
      message.error(error.response?.data?.message || 'Failed to load artwork details.');
      navigate('/artworks');
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    fetchArtworkDetails();
  }, [fetchArtworkDetails]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="Loading artwork details..." />
      </div>
    );
  }

  if (!artwork) {
    return <Title level={3}>Artwork not found.</Title>;
  }

  // Helper to render artist name, which might be populated or just an ID
  const renderArtistName = () => {
    if (
      typeof artwork.artist === 'object' &&
      artwork.artist !== null &&
      '_id' in artwork.artist &&
      'name' in artwork.artist
    ) {
      return <Link onClick={() => navigate(`/artists/${(artwork.artist as any)._id}`)}>{(artwork.artist as any).name}</Link>;
    }
    return <Text>ID: {artwork.artist}</Text>;
  };

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/artworks')}>
            <ArrowLeftOutlined /> Artworks
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><PictureOutlined /> {artwork.codeNo}</Breadcrumb.Item>
      </Breadcrumb>

      <Card
        title={<Title level={3} style={{ margin: 0 }}>{artwork.title} ({artwork.codeNo})</Title>}
        extra={<Button icon={<EditOutlined />} onClick={() => navigate(`/artworks/edit/${id}`)}>Edit</Button>}
      >
        <Row gutter={[32, 16]}>
          <Col xs={24} md={10}>
            <Image
              src={artwork.imageUrl || 'https://via.placeholder.com/400?text=No+Image'}
              alt={artwork.title}
              style={{ width: '100%', objectFit: 'contain' }}
              fallback="https://via.placeholder.com/400?text=Image+Error"
            />
          </Col>
          <Col xs={24} md={14}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Artist">{renderArtistName()}</Descriptions.Item>
              <Descriptions.Item label="Pen Name">{artwork.penName || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Medium">{artwork.medium}</Descriptions.Item>
              <Descriptions.Item label="Dimensions">
                {`${artwork.dimensions.length} x ${artwork.dimensions.breadth} ${artwork.dimensions.unit}`}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{artwork.status?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tags">
                {artwork.tags.length > 0 ? artwork.tags.map(tag => <Tag key={tag}>{tag}</Tag>) : 'No tags'}
              </Descriptions.Item>
              <Descriptions.Item label="Days to Create">{artwork.noOfDays || 'N/A'}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider orientation="left"><MoneyCollectOutlined /> Pricing & Availability</Divider>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Base Selling Price">
            <Text strong style={{ color: '#A36FFF' }}>₹{artwork.sellingPrice?.toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Original Available">
            {pricing?.isOriginalAvailable ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>}
          </Descriptions.Item>

          {pricing?.isOriginalAvailable && (
            <>
              <Descriptions.Item label="Material Cost">₹{pricing.originalPricing?.artMaterialCost?.toLocaleString() || 0}</Descriptions.Item>
              <Descriptions.Item label="Artist Charge">₹{pricing.originalPricing?.artistCharge?.toLocaleString() || 0}</Descriptions.Item>
              <Descriptions.Item label="Gallery Price (Calculated)">₹{pricing.originalPricing?.galleryPrice?.toLocaleString() || 0}</Descriptions.Item>
            </>
          )}

          <Descriptions.Item label="Print-on-Demand">
            {pricing?.isPrintOnDemandAvailable ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>}
          </Descriptions.Item>
          {pricing?.isPrintOnDemandAvailable && (
            <Descriptions.Item label="Base Print Cost (per sq ft)">
              ₹{pricing.printOnDemandPricing?.baseCostPerSqFt?.toLocaleString() || 0}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider orientation="left"><ShopOutlined /> Marketplace Listings</Divider>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label={<Space><AmazonOutlined /> Amazon</Space>}>
            {pricing?.amazonListing?.isInAmazon ? (
              <Link href={pricing.amazonListing.link} target="_blank">{pricing.amazonListing.link}</Link>
            ) : <Text type="secondary">Not listed</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><GlobalOutlined /> Other Platforms</Space>}>
            {pricing?.otherPlatformListings && pricing.otherPlatformListings.length > 0 ? (
              <List
                size="small"
                dataSource={pricing.otherPlatformListings}
                renderItem={item => <List.Item><Link href={item.link} target="_blank">{item.platform}</Link></List.Item>}
              />
            ) : <Text type="secondary">Not listed elsewhere</Text>}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left"><BookOutlined /> Internal Information</Divider>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Marketing Status">{artwork.marketingStatus || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Monitoring Items">
            {artwork.monitoringItems && artwork.monitoringItems.length > 0 ? (
              <List
                size="small"
                dataSource={artwork.monitoringItems}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            ) : <Text type="secondary">None</Text>}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left"><FormOutlined /> Internal Remarks</Divider>
        <List
          itemLayout="horizontal"
          dataSource={artwork.internalRemarks}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                title={`Remark #${index + 1}`}
                description={<Paragraph>{item.remark}</Paragraph>}
              />
              <Text type="secondary">Added on {new Date(item.createdAt).toLocaleDateString()}</Text>
            </List.Item>
          )}
          locale={{ emptyText: 'No internal remarks have been added.' }}
        />
      </Card>
    </div>
  );
};

export default ArtworkDetailPage;