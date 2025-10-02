// frontend/src/pages/ArtworkDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Breadcrumb, Spin, Row, Col, Card, Tag,
  Descriptions, Image, Divider, List, Button, Space, Tooltip, notification
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
      setPricing(response.data.pricing || null);
      
      // If no pricing data exists, show a warning
      if (!response.data.pricing) {
        showNotification('warning', 'No pricing data found for this artwork. Please edit the artwork to add pricing details.');
      }
    } catch (error: any) {
      console.error('Failed to fetch artwork details:', error);
      showNotification('error', error.response?.data?.message || 'Failed to load artwork details.');
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
                <br />
                <Text type="secondary">
                  ({(artwork.dimensions.length * artwork.dimensions.breadth).toLocaleString()} square inches)
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{artwork.status?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tags">
                {artwork.tags.length > 0 ? artwork.tags.map(tag => <Tag key={tag}>{tag}</Tag>) : 'No tags'}
              </Descriptions.Item>
              <Descriptions.Item label="Days to Create">{artwork.noOfDays || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Base Selling Price">
                <Text strong style={{ color: '#A36FFF' }}>₹{artwork.sellingPrice?.toLocaleString('en-IN')}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider orientation="left"><MoneyCollectOutlined /> Pricing Details</Divider>
      <Divider orientation="left"><MoneyCollectOutlined /> Pricing Details</Divider>
      
      {!pricing ? (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              No pricing data available for this artwork.
            </Text>
            <br />
            <Button 
              type="primary" 
              style={{ marginTop: 16 }}
              onClick={() => navigate(`/artworks/edit/${id}`)}
            >
              Edit Artwork to Add Pricing
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {pricing.isOriginalAvailable && originalBreakdown && (
            <Card size="small" type="inner" title="Original Artwork Price Breakdown" style={{ marginBottom: 24 }}>
              <Descriptions bordered column={1} size="small">
                <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 1: Base Costs</Title>
                <PriceBreakdownItem label="Art Material Cost" value={originalBreakdown.artMaterialCost} />
                <PriceBreakdownItem label="Artist Charge" value={originalBreakdown.artistCharge} />
                <PriceBreakdownItem label="Packing & Delivery Charges" value={originalBreakdown.packingAndDeliveryCharges} />
                <Descriptions.Item label={<Text strong>Raw Total</Text>}>
                  <Text strong style={{ color: '#1890ff' }}>₹{originalBreakdown.rawTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </Descriptions.Item>
                
                <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 2: Add Profit (30%)</Title>
                <Descriptions.Item label={<Text strong>RT + Profit (Raw Total × 1.3)</Text>}>
                  <Text strong style={{ color: '#52c41a' }}>₹{originalBreakdown.rtPlusProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </Descriptions.Item>
                
                <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 3: Add GST (12%)</Title>
                <Descriptions.Item label={<Text strong>Total (RT + Profit × 1.12)</Text>}>
                  <Text strong style={{ color: '#fa8c16' }}>₹{originalBreakdown.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </Descriptions.Item>
                
                <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 4: Gallery Markup (×5)</Title>
                <Descriptions.Item label={<Text strong>Grand Total (Total × 5)</Text>}>
                  <Text strong style={{ color: '#722ed1' }}>₹{originalBreakdown.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </Descriptions.Item>
                
                <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 5: Amazon Print Calculations</Title>
                <PriceBreakdownItem label="Print on Amazon (Original) - Grand Total × 0.8" value={originalBreakdown.printOnAmazonOriginal} />
                <PriceBreakdownItem label="Print on Amazon (Small)" value={originalBreakdown.printOnAmazonSmall} />
                <PriceBreakdownItem label="Print on Amazon (Big)" value={originalBreakdown.printOnAmazonBig} />
                
                <Descriptions.Item label={<Text strong>Main Total</Text>}>
                  <Text strong style={{ color: '#13c2c2' }}>₹{originalBreakdown.mainTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item label={<Title level={4}>*5 Gallery Price (Main Total ÷ 2)</Title>}>
                  <Title level={4} style={{ color: '#A36FFF', fontSize: '24px' }}>₹{originalBreakdown.galleryPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {pricing.isPrintOnDemandAvailable && podBreakdown && (
             <Card size="small" type="inner" title="Print-on-Demand Price Breakdown" style={{ marginBottom: 24 }}>
               <Descriptions bordered column={1} size="small">
                 <Descriptions.Item label="Square Inches">
                   <Text strong>{podBreakdown.sqInches?.toLocaleString()} sq inches</Text>
                 </Descriptions.Item>
                 <Descriptions.Item label="Base Cost Per Sq Inch">
                   <Text>₹{podBreakdown.baseCostPerSqFt?.toLocaleString()}</Text>
                 </Descriptions.Item>
                 
                 <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 1: Calculate Base Prices</Title>
                 <PriceBreakdownItem 
                   label="Print Small (sq × 0.7 × 500)" 
                   value={podBreakdown.printSmall}
                   note={`${podBreakdown.sqInches} × 0.7 × 500`}
                 />
                 <PriceBreakdownItem 
                   label="Print Original (sq × 500)" 
                   value={podBreakdown.printOriginal}
                   note={`${podBreakdown.sqInches} × 500`}
                 />
                 <PriceBreakdownItem 
                   label="Print Big (sq × 2 × 500)" 
                   value={podBreakdown.printBig}
                   note={`${podBreakdown.sqInches} × 2 × 500`}
                 />
                 
                 <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 2: Add Profit (30%)</Title>
                 <PriceBreakdownItem label="Print Profit Small (× 1.3)" value={podBreakdown.printProfitSmall} />
                 <PriceBreakdownItem label="Print Profit Original (× 1.3)" value={podBreakdown.printProfitOriginal} />
                 <PriceBreakdownItem label="Print Profit Big (× 1.3)" value={podBreakdown.printProfitBig} />
                 
                 <Title level={5} style={{ margin: '16px 0 8px 0' }}>Step 3: Final Prices with GST (12%)</Title>
                 <Descriptions.Item label={<Title level={5}>Final Price Small (× 1.12)</Title>}>
                   <Title level={5} style={{ color: '#A36FFF' }}>₹{podBreakdown.finalPriceSmall?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
                 </Descriptions.Item>
                 <Descriptions.Item label={<Title level={4}>Final Price Original (× 1.12)</Title>}>
                   <Title level={4} style={{ color: '#A36FFF', fontSize: '20px' }}>₹{podBreakdown.finalPriceOriginal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
                 </Descriptions.Item>
                 <Descriptions.Item label={<Title level={5}>Final Price Big (× 1.12)</Title>}>
                   <Title level={5} style={{ color: '#A36FFF' }}>₹{podBreakdown.finalPriceBig?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
                 </Descriptions.Item>
               </Descriptions>
             </Card>
          )}
        </>
      )}
        <Divider orientation="left"><ShopOutlined /> Marketplace Listings</Divider>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label={<Space><AmazonOutlined /> Amazon</Space>}>
            {pricing?.amazonListing?.isInAmazon ? (
              <Link href={pricing.amazonListing.link} target="_blank">{pricing.amazonListing.link || 'Link not provided'}</Link>
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