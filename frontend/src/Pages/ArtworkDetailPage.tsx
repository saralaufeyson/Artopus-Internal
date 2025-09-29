// frontend/src/pages/ArtworkDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Breadcrumb, Spin, message, Row, Col, Card, Tag,
  Descriptions, Image, Divider, List, Button, Space, Tooltip
} from 'antd';
import {
  PictureOutlined, ArrowLeftOutlined, EditOutlined,
  MoneyCollectOutlined, ShopOutlined, BookOutlined, FormOutlined,
  GlobalOutlined, AmazonOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import type { Artwork, Pricing, Artist } from '../types/artwork';

const { Title, Text, Paragraph, Link } = Typography;

// Helper component for Price Breakdown items - now safer
const PriceBreakdownItem: React.FC<{ label: string; value?: number; note?: string }> = ({ label, value = 0, note }) => (
  <Descriptions.Item label={
    <Space>
      {label}
      {note && <Tooltip title={note}><InfoCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} /></Tooltip>}
    </Space>
  }>
    ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </Descriptions.Item>
);

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

  const renderArtistName = () => {
    const artist = artwork?.artist as Artist;
    return <Link onClick={() => navigate(`/artists/${artist._id}`)}>{artist.name}</Link>;
  };

  const originalBreakdown = pricing?.originalPricing;
  const podBreakdown = pricing?.printOnDemandPricing;

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

        <Divider orientation="left"><MoneyCollectOutlined /> Pricing Details</Divider>
        
        {pricing?.isOriginalAvailable && originalBreakdown && (
          <Card size="small" type="inner" title="Original Artwork Price Breakdown" style={{ marginBottom: 24 }}>
            <Descriptions bordered column={1} size="small">
              <PriceBreakdownItem label="Art Material Cost" value={originalBreakdown.artMaterialCost} />
              <PriceBreakdownItem 
                label="Total Artist Charge" 
                value={originalBreakdown.totalArtistCharge}
                note={`(₹${originalBreakdown.artistChargePerDay?.toLocaleString()} per day for ${originalBreakdown.noOfDays} days)`}
              />
              <PriceBreakdownItem label="Packing & Delivery" value={originalBreakdown.packingAndDeliveryCharges} />
              <Descriptions.Item label={<Text strong>Subtotal (Costs)</Text>}>
                <Text strong>₹{originalBreakdown.rawTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </Descriptions.Item>
              <PriceBreakdownItem 
                label={`Profit Margin (${(originalBreakdown.profitMargin || 0) * 100}%)`} 
                value={originalBreakdown.profitAmount}
              />
               <Descriptions.Item label={<Text strong>Subtotal (Before GST)</Text>}>
                <Text strong>₹{originalBreakdown.rawTotalPlusProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
               </Descriptions.Item>
              <PriceBreakdownItem label="GST (12%)" value={originalBreakdown.gstOnProfit} />
              <Descriptions.Item label={<Title level={5}>Total (Before Gallery Markup)</Title>}>
                <Title level={5}>₹{originalBreakdown.totalWithGST?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Title>
              </Descriptions.Item>
                <Descriptions.Item label={<Title level={4}>Final Gallery Price</Title>}>
                <Title level={4} style={{ color: '#A36FFF' }}>₹{pricing.originalPricing?.galleryPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Title>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {pricing?.isPrintOnDemandAvailable && podBreakdown && (
           <Card size="small" type="inner" title="Print-on-Demand Price Breakdown (Original Size)">
             <Descriptions bordered column={1} size="small">
               <PriceBreakdownItem label="Printing Cost" value={podBreakdown.printingCost} note={`Based on area at ₹${podBreakdown.baseCostPerSqFt}/sq.ft.`} />
               <PriceBreakdownItem label="Artist Charge (Flat)" value={podBreakdown.artistCharge} />
               <Descriptions.Item label={<Text strong>Subtotal (Costs)</Text>}>
                <Text strong>₹{podBreakdown.rawTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
               </Descriptions.Item>
              <PriceBreakdownItem 
                label={`Profit Margin (${(podBreakdown.profitMargin || 0) * 100}%)`} 
                value={podBreakdown.profitAmount}
              />
               <Descriptions.Item label={<Text strong>Subtotal (Before GST)</Text>}>
                <Text strong>₹{podBreakdown.rawTotalPlusProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
               </Descriptions.Item>
               <PriceBreakdownItem label="GST (12%)" value={podBreakdown.gstOnProfit} />
               <Descriptions.Item label={<Title level={4}>Final Price (Original Size Print)</Title>}>
                <Title level={4} style={{ color: '#A36FFF' }}>₹{podBreakdown.originalSizePrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Title>
               </Descriptions.Item>
             </Descriptions>
           </Card>
        )}

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

