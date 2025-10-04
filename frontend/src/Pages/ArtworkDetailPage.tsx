// frontend/src/pages/ArtworkDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Breadcrumb, Spin, Row, Col, Card, Tag,
  Descriptions, Image, Divider, List, Button, Space
} from 'antd';
import {
  PictureOutlined, ArrowLeftOutlined, EditOutlined,
  MoneyCollectOutlined, ShopOutlined, BookOutlined, FormOutlined,
  GlobalOutlined, AmazonOutlined, ShoppingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import type { Artwork, Pricing, Artist } from '../types/artwork';
import { useNotification } from '../Context/NotificationContext';

const { Title, Text, Paragraph, Link } = Typography;

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showNotification } = useNotification();

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

  const original = pricing?.originalPricing;
  const pod = pricing?.printOnDemandPricing;

  return (
    <div style={{ paddingBottom: '40px' }}>
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
                {`${artwork.dimensions.length} × ${artwork.dimensions.breadth} ${artwork.dimensions.unit}`}
                <br />
                <Text type="secondary">
                  ({(artwork.dimensions.length * artwork.dimensions.breadth).toLocaleString()} sq inches)
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color="blue">{artwork.status?.toUpperCase()}</Tag></Descriptions.Item>
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

        <div style={{ overflowX: 'auto' }}>
          {!pricing ? (
            <Card style={{ marginBottom: 24 }}>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">No pricing data available.</Text>
              </div>
            </Card>
          ) : (
            <>
              {/* --- Original Pricing --- */}
              {pricing.isOriginalAvailable && original && (
                <Card size="small" type="inner" title="Original Artwork Price Breakdown" style={{ marginBottom: 24 }}>
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Art Material Cost">₹{original.artMaterialCost?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Artist Charge">₹{original.artistCharge?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Packing & Delivery Charges">₹{original.packingAndDeliveryCharges?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Raw Total"><Text strong>₹{original.rawTotal?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Raw Total + Profit (×1.3)"><Text strong style={{ color: '#52c41a' }}>₹{original.rawTotalPlusProfit?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Total + GST (×1.12)"><Text strong style={{ color: '#fa8c16' }}>₹{original.totalWithGST?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Gallery Markup (×5)"><Text strong style={{ color: '#722ed1' }}>₹{original.grandTotal?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Print on Amazon (Original)">₹{original.printOnAmazonOriginal?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Print on Amazon (Small)">₹{original.printOnAmazonSmall?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Print on Amazon (Big)">₹{original.printOnAmazonBig?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Main Total"><Text strong style={{ color: '#13c2c2' }}>₹{original.mainTotal?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Gallery Price"><Title level={4} style={{ color: '#A36FFF' }}>₹{original.galleryPrice?.toLocaleString('en-IN')}</Title></Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              {/* --- Print-on-Demand Pricing --- */}
              {pricing.isPrintOnDemandAvailable && pod && (
                <Card size="small" type="inner" title="Print-on-Demand Price Breakdown" style={{ marginBottom: 24 }}>
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Square Inches">{pod.sqInches?.toLocaleString()} sq in</Descriptions.Item>
                    <Descriptions.Item label="Base Cost per Sq Ft">₹{pod.baseCostPerSqFt?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Print Small (sq×0.7×500)">₹{pod.printSmall?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Print Original (sq×500)">₹{pod.printOriginal?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Print Big (sq×2×500)">₹{pod.printBig?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Profit Small (×1.3)">₹{pod.printProfitSmall?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Profit Original (×1.3)">₹{pod.printProfitOriginal?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Profit Big (×1.3)">₹{pod.printProfitBig?.toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Final Small (×1.12)"><Text strong>₹{pod.smallPrice?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Final Original (×1.12)"><Text strong style={{ color: '#A36FFF' }}>₹{pod.originalSizePrice?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Final Big (×1.12)"><Text strong>₹{pod.largePrice?.toLocaleString('en-IN')}</Text></Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
            </>
          )}
        </div>

        {/* --- Sold Information --- */}
        {pricing?.isOriginalAvailable && pricing?.originalPricing?.soldDetails?.isSold && (
          <>
            <Divider orientation="left"><ShoppingOutlined /> Sold Information</Divider>
            <Card size="small" type="inner" style={{ marginBottom: 24, background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Sale Status">
                  <Tag color="success">SOLD</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Selling Price">
                  <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                    ₹{pricing.originalPricing.soldDetails.sellingPrice?.toLocaleString('en-IN') || 'N/A'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Sale Date">
                  {pricing.originalPricing.soldDetails.saleDate
                    ? new Date(pricing.originalPricing.soldDetails.saleDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Buyer Name">
                  {pricing.originalPricing.soldDetails.buyerName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Buyer Contact">
                  {pricing.originalPricing.soldDetails.buyerContact || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
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
            {pricing?.otherPlatformListings?.length ? (
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
            {artwork.monitoringItems?.length ? (
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
