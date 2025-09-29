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
import { useNotification } from '../Context/NotificationContext'; // Import useNotification
import type { Artwork, Pricing, Artist } from '../types/artwork';

const { Title, Text, Paragraph, Link } = Typography;

// Helper component for Price Breakdown items - now safer
const PriceBreakdownItem: React.FC<{ label: string; value?: number; note?: string; isTotal?: boolean }> = ({ label, value = 0, note, isTotal = false }) => (
  <Descriptions.Item label={
    <Space>
      {isTotal ? <Text strong>{label}</Text> : label}
      {note && <Tooltip title={note}><InfoCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} /></Tooltip>}
    </Space>
  }>
    {isTotal ? (
      <Text strong style={{ fontSize: '16px', color: '#A36FFF' }}>
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    ) : (
      <Text>₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
    )}
  </Descriptions.Item>
);

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showNotification } = useNotification(); // Use notification hook

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
              {/* Step 1: Raw Total Calculation */}
              <PriceBreakdownItem label="Art Material Cost" value={originalBreakdown.artMaterialCost} />
              <PriceBreakdownItem label="Artist Charge" value={originalBreakdown.artistCharge} />
              <PriceBreakdownItem label="Packing & Delivery" value={originalBreakdown.packingAndDeliveryCharges} />
              <PriceBreakdownItem label="Raw Total" value={originalBreakdown.rawTotal} isTotal />
              
              {/* Step 2: RT + Profit */}
              <PriceBreakdownItem label="RT + Profit (Raw Total × 1.3)" value={originalBreakdown.rawTotalPlusProfit} isTotal />
              <PriceBreakdownItem label="Profit Amount (30%)" value={originalBreakdown.profitAmount} />
              
              {/* Step 3: Profit + GST */}
              <PriceBreakdownItem label="Total (RT + Profit × 1.12)" value={originalBreakdown.totalWithGST} isTotal />
              <PriceBreakdownItem label="GST Amount (12%)" value={originalBreakdown.gstAmount} />
              
              {/* Step 4: Grand Total */}
              <PriceBreakdownItem label="Grand Total (Total × 5)" value={originalBreakdown.grandTotal} isTotal />
              
              {/* Step 5: Print on Amazon calculations */}
              <PriceBreakdownItem label="Print on Amazon (Original) - Grand Total × 0.8" value={originalBreakdown.printOnAmazonOriginal} />
              {originalBreakdown.printOnAmazonSmall && (
                <PriceBreakdownItem label="Print on Amazon (Small)" value={originalBreakdown.printOnAmazonSmall} />
              )}
              {originalBreakdown.printOnAmazonBig && (
                <PriceBreakdownItem label="Print on Amazon (Big)" value={originalBreakdown.printOnAmazonBig} />
              )}
              
              {/* Step 6: Main Total */}
              <PriceBreakdownItem label="Main Total" value={originalBreakdown.mainTotal} isTotal />
              
              {/* Final Gallery Price */}
              <Descriptions.Item label={<Title level={4}>*5 Gallery Price (Main Total ÷ 2)</Title>}>
                <Title level={4} style={{ color: '#A36FFF' }}>
                  ₹{originalBreakdown.galleryPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Title>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {pricing?.isPrintOnDemandAvailable && podBreakdown && (
           <Card size="small" type="inner" title="Print-on-Demand Price Breakdown" style={{ marginBottom: 24 }}>
             <Descriptions bordered column={1} size="small">
               <PriceBreakdownItem 
                 label="Square Inches" 
                 value={podBreakdown.sqInches} 
                 note={`${artwork.dimensions.length}" × ${artwork.dimensions.breadth}"`}
               />
               <PriceBreakdownItem 
                 label="Base Cost per Sq. Inch" 
                 value={podBreakdown.baseCostPerSqFt} 
               />
               
               {/* Step 1: Base Prices */}
               <Divider orientation="left" style={{ margin: '12px 0' }}>Step 1: Base Prices</Divider>
               <PriceBreakdownItem 
                 label="Print Small (sq × 0.7 × 500)" 
                 value={podBreakdown.printSmall}
               />
               <PriceBreakdownItem 
                 label="Print Original (sq × 500)" 
                 value={podBreakdown.printOriginal}
               />
               <PriceBreakdownItem 
                 label="Print Big (sq × 2 × 500)" 
                 value={podBreakdown.printBig}
               />
               
               {/* Step 2: With Profit */}
               <Divider orientation="left" style={{ margin: '12px 0' }}>Step 2: Add Profit (30%)</Divider>
               <PriceBreakdownItem 
                 label="Print Profit Small (× 1.3)" 
                 value={podBreakdown.printProfitSmall}
               />
               <PriceBreakdownItem 
                 label="Print Profit Original (× 1.3)" 
                 value={podBreakdown.printProfitOriginal}
               />
               <PriceBreakdownItem 
                 label="Print Profit Big (× 1.3)" 
                 value={podBreakdown.printProfitBig}
               />
               
               {/* Step 3: Final Prices with GST */}
               <Divider orientation="left" style={{ margin: '12px 0' }}>Step 3: Final Prices with GST (12%)</Divider>
               <PriceBreakdownItem 
                 label="Final Price Small (× 1.12)" 
                 value={podBreakdown.finalPriceSmall}
                 isTotal
               />
               <PriceBreakdownItem 
                 label="Final Price Original (× 1.12)" 
                 value={podBreakdown.finalPriceOriginal}
                 isTotal
               />
               <PriceBreakdownItem 
                 label="Final Price Big (× 1.12)" 
                 value={podBreakdown.finalPriceBig}
                 isTotal
               />
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

