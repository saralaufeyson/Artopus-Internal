// frontend/src/pages/ArtworkFormPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography, Breadcrumb, Button, Form, Input, Select, Space, message,
  Spin, Image, Row, Col, Checkbox, InputNumber, Divider, Tag, Radio, Card, Collapse
} from 'antd';
import { useNotification } from '../Context/NotificationContext';
import { PictureOutlined, ArrowLeftOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import type { Artwork, PackagingOptions } from '../types/artwork';
import type { Artist } from '../types/artist';
import { getApiUrl } from '../config/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PRINT_PRICES: { [key: string]: number } = { A4: 350, A5: 262.5, A3: 525 };
const PACKAGING_COSTS: { [key: string]: number } = {
  cardboard: 100, frame: 280, designerSheet: 50, cornerSafe: 40, translucentSheet: 20,
  brandSticker: 20, catalogue: 10, artstorySticker: 30, labelBillSticker: 50, easyshipAmazon: 250,
};
const SERVICE_CHARGE = 500;
const PRINT_DIMENSIONS = {
  A3: { length: 16.54, breadth: 11.69, unit: 'inches' },
  A4: { length: 11.69, breadth: 8.27, unit: 'inches' },
  A5: { length: 8.27, breadth: 5.83, unit: 'inches' },
} as const;

const ArtworkFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { token } = useAuth();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingArtwork, setFetchingArtwork] = useState<boolean>(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [fetchingArtists, setFetchingArtists] = useState<boolean>(false);
  const [listingType, setListingType] = useState<'original' | 'print'>('original');
  const [printSize, setPrintSize] = useState<'A4' | 'A5' | 'A3'>('A4');
  const [packaging, setPackaging] = useState<PackagingOptions>({});
  const [showBreakdown, setShowBreakdown] = useState(false);

  const packagingKeys = Object.keys(PACKAGING_COSTS);
  const selectedPackagingCount = packagingKeys.filter(
    key => packaging[key as keyof PackagingOptions]
  ).length;
  const allPackagingSelected = selectedPackagingCount === packagingKeys.length;
  const somePackagingSelected = selectedPackagingCount > 0 && !allPackagingSelected;

  const handleSelectAllPackaging = (checked: boolean) => {
    setPackaging(
      Object.fromEntries(packagingKeys.map(key => [key, checked])) as PackagingOptions
    );
  };

  const isEditing = !!id;

  useEffect(() => {
    const fetchArtists = async () => {
      setFetchingArtists(true);
      try {
        const res = await axios.get<Artist[]>(getApiUrl('/api/artists'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArtists(res.data);
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to fetch artists.');
        console.error('Failed to fetch artists:', error);
      } finally {
        setFetchingArtists(false);
      }
    };
    if (token) fetchArtists();
  }, [token, showNotification]);

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!isEditing || !token) {
        setFetchingArtwork(false);
        return;
      }
      setFetchingArtwork(true);
      try {
        const artworkRes = await axios.get<{ artwork: Artwork; pricing: any }>(getApiUrl(`/api/artworks/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { artwork, pricing } = artworkRes.data;
        setListingType(artwork.listingType as 'original' | 'print' || 'original');
        setPrintSize((artwork.printSize as 'A4' | 'A5' | 'A3') || 'A4');
        setPackaging(pricing?.packagingOptions || {});

        const formData = {
          ...artwork,
          dimensionsLength: artwork.dimensions?.length,
          dimensionsBreadth: artwork.dimensions?.breadth,
          dimensionsUnit: artwork.dimensions?.unit,
          tags: artwork.tags ? artwork.tags.join(', ') : '',
          internalRemarks: artwork.internalRemarks && artwork.internalRemarks.length > 0
                           ? artwork.internalRemarks.map(r => r.remark).join('\n') : '',
          monitoringItems: artwork.monitoringItems?.map(item => ({ value: item })) || [],
          isOriginalAvailable: pricing?.isOriginalAvailable,
          artMaterialCost: pricing?.originalPricing?.artMaterialCost,
          artistCharge: pricing?.originalPricing?.artistCharge,
          packingAndDeliveryCharges: pricing?.originalPricing?.packingAndDeliveryCharges,
          isPrintOnDemandAvailable: pricing?.isPrintOnDemandAvailable,
          basePrintCostPerSqFt: pricing?.printOnDemandPricing?.baseCostPerSqFt,
          isInAmazon: pricing?.amazonListing?.isInAmazon,
          amazonLink: pricing?.amazonListing?.link,
          otherPlatformListings: pricing?.otherPlatformListings || [],
          isSold: pricing?.originalPricing?.soldDetails?.isSold,
          saleDate: pricing?.originalPricing?.soldDetails?.saleDate ? new Date(pricing.originalPricing.soldDetails.saleDate) : undefined,
          sellingPriceOriginal: pricing?.originalPricing?.soldDetails?.sellingPrice,
          buyerName: pricing?.originalPricing?.soldDetails?.buyerName,
          buyerContact: pricing?.originalPricing?.soldDetails?.buyerContact,
        };
        form.setFieldsValue(formData);
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to fetch artwork details.');
        navigate('/artworks');
      } finally {
        setFetchingArtwork(false);
      }
    };
    fetchArtwork();
  }, [id, isEditing, token, form, navigate, showNotification]);

  const calculatePricing = () => {
    const packagingTotal = Object.keys(packaging).reduce((sum, key) => {
      return sum + (packaging[key as keyof PackagingOptions] ? (PACKAGING_COSTS[key] || 0) : 0);
    }, 0);

    const isAmazon = form.getFieldValue('isInAmazon');
    const basePrice = listingType === 'print' ? PRINT_PRICES[printSize] : form.getFieldValue('sellingPrice') || 0;
    const grandTotal = basePrice + packagingTotal + SERVICE_CHARGE;

    let amazonPrice = 0;
    if (isAmazon && listingType === 'print') {
      const referral = grandTotal * 0.15;
      const gst = (grandTotal + referral) * 0.18;
      const profit = Math.round((grandTotal * 0.30) / 100) * 100;
      amazonPrice = grandTotal + referral + gst + profit;
    }

    return { basePrice, packagingTotal, grandTotal, amazonPrice, isAmazon, listingType };
  };

  const { grandTotal, amazonPrice, basePrice, packagingTotal, isAmazon } = calculatePricing();

  const onFinish = async (values: any) => {
    if (listingType === 'print' && isAmazon) {
      // Amazon only supports prints
    } else if (listingType === 'print' && !values.printSize) {
      showNotification('error', 'Please select a print size!');
      return;
    }

    setLoading(true);
    if (!token) {
      showNotification('error', 'Authentication required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        codeNo: values.codeNo,
        title: values.title,
        penName: values.penName,
        artistId: values.artist,
        medium: values.medium,
        dimensions: listingType === 'print'
          ? PRINT_DIMENSIONS[printSize]
          : {
              length: values.dimensionsLength,
              breadth: values.dimensionsBreadth,
              unit: values.dimensionsUnit,
            },
        status: values.status,
        noOfDays: values.noOfDays,
        imageUrl: values.imageUrl,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        sellingPrice: values.sellingPrice,
        listingType: listingType,
        printSize: listingType === 'print' ? printSize : undefined,
        packagingOptions: packaging,

        isOriginalAvailable: values.isOriginalAvailable,
        artMaterialCost: values.artMaterialCost,
        artistCharge: values.artistCharge,
        packingAndDeliveryCharges: values.packingAndDeliveryCharges,
        isPrintOnDemandAvailable: values.isPrintOnDemandAvailable,
        basePrintCostPerSqFt: values.basePrintCostPerSqFt,
        isInAmazon: values.isInAmazon,
        amazonLink: values.amazonLink,
        otherPlatformListings: values.otherPlatformListings || [],

        internalRemarks: values.internalRemarks || '',
        monitoringItems: values.monitoringItems?.map((item: { value: string }) => item.value) || [],
        marketingStatus: values.marketingStatus,
        hasParticipatedInCompetition: values.hasParticipatedInCompetition,

        soldDetails: values.isOriginalAvailable && values.isSold ? {
          isSold: values.isSold,
          saleDate: values.saleDate || new Date(),
          sellingPrice: values.sellingPriceOriginal,
          buyerName: values.buyerName,
          buyerContact: values.buyerContact,
        } : undefined,
      };

      let response;
      if (isEditing) {
        response = await axios.put(getApiUrl(`/api/artworks/${id}`), payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification('success', 'Artwork updated successfully!');
      } else {
        response = await axios.post(getApiUrl('/api/artworks'), payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification('success', 'Artwork added successfully!');
      }
      navigate('/artworks');
    } catch (error: any) {
      console.error('Failed to save artwork:', error);
      showNotification('error', error.response?.data?.message || 'Failed to save artwork.');
    } finally {
      setLoading(false);
    }
  };

  if ((fetchingArtwork && isEditing) || fetchingArtists) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item>
          <span onClick={() => navigate('/artworks')} style={{ cursor: 'pointer' }}>
            <ArrowLeftOutlined /> Artworks
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><PictureOutlined /> {isEditing ? `Edit Artwork` : 'Add New Artwork'}</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>{isEditing ? `Edit Artwork` : 'Add New Artwork'}</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'available',
          dimensionsUnit: 'inches',
          hasParticipatedInCompetition: false,
          isOriginalAvailable: true,
          isPrintOnDemandAvailable: false,
          isInAmazon: false,
          monitoringItems: [],
          listingType: 'original',
          printSize: 'A4',
        }}
        style={{ maxWidth: 1200 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="codeNo" label="Artwork Code No." rules={[{ required: true, message: 'Please input artwork code!' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please input title!' }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="artist" label="Artist" rules={[{ required: true, message: 'Please select artist!' }]}>
              <Select showSearch placeholder="Select an artist" optionFilterProp="children" loading={fetchingArtists}
                filterOption={(input, option) =>
                  option?.children && typeof option.children === 'string'
                    ? (option.children as string).toLowerCase().indexOf(input.toLowerCase()) >= 0 : false
                }>
                {artists.map(artist => (
                  <Option key={artist._id} value={artist._id}>{artist.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="penName" label="Pen Name">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="medium" label="Medium" rules={[{ required: true, message: 'Please input medium!' }]}>
          <Input />
        </Form.Item>

        <Divider orientation="left">Listing Type & Dimensions</Divider>

        <Form.Item name="listingType" label="Listing Type" rules={[{ required: true }]}>
          <Radio.Group onChange={(e) => setListingType(e.target.value as 'original' | 'print')}>
            <Radio value="original">Original (Manual Dimensions)</Radio>
            <Radio value="print">Print (Predefined Sizes)</Radio>
          </Radio.Group>
        </Form.Item>

        {listingType === 'print' ? (
          <Form.Item name="printSize" label="Print Size" rules={[{ required: true }]}>
            <Select onChange={(val) => setPrintSize(val as 'A4' | 'A5' | 'A3')}>
              <Option value="A4">A4 Canvas - ₹350</Option>
              <Option value="A5">A5 Canvas - ₹262.50</Option>
              <Option value="A3">A3 Canvas - ₹525</Option>
            </Select>
          </Form.Item>
        ) : (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dimensionsLength" label="Length" rules={[{ required: true }]}>
                <InputNumber min={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dimensionsBreadth" label="Breadth" rules={[{ required: true }]}>
                <InputNumber min={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dimensionsUnit" label="Unit" rules={[{ required: true }]}>
                <Select>
                  <Option value="inches">Inches</Option>
                  <Option value="cm">cm</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select>
            <Option value="available">Available</Option>
            <Option value="sold">Sold</Option>
            <Option value="on_display">On Display</Option>
            <Option value="loaned">Loaned</Option>
            <Option value="archived">Archived</Option>
          </Select>
        </Form.Item>

        <Form.Item name="sellingPrice" label={listingType === 'print' ? `Base Selling Price (₹${PRINT_PRICES[printSize]})` : "Selling Price (₹)"} rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} formatter={value => `₹ ${value}`} />
        </Form.Item>

        <Divider orientation="left">Packaging Options (Optional)</Divider>

        <Card style={{ marginBottom: 16 }}>
          <Checkbox
            checked={allPackagingSelected}
            indeterminate={somePackagingSelected}
            onChange={(e) => handleSelectAllPackaging(e.target.checked)}
            style={{ marginBottom: 16 }}
          >
            Select all packaging options
          </Checkbox>
          <Row gutter={[16, 16]}>
            {Object.entries(PACKAGING_COSTS).map(([key, cost]) => (
              <Col span={12} key={key}>
                <Checkbox
                  onChange={(e) => setPackaging({ ...packaging, [key]: e.target.checked })}
                  checked={packaging[key as keyof PackagingOptions] || false}
                >
                  <span>{key.replace(/([A-Z])/g, ' $1').trim()} - <strong>₹{cost}</strong></span>
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Card>

        <Card style={{ background: '#f5f5f5', marginBottom: 16 }}>
          <Title level={4}>Cost Summary</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Text>Base Price: <strong>₹{basePrice.toLocaleString()}</strong></Text><br />
              <Text>Packaging Total: <strong>₹{packagingTotal.toLocaleString()}</strong></Text><br />
              <Text>Service Charge: <strong>₹500</strong></Text><br />
              <Title level={3} style={{ margin: '8px 0 0 0', color: '#1890ff' }}>GRAND TOTAL: ₹{grandTotal.toLocaleString()}</Title>
            </Col>
            <Col span={12}>
              {isAmazon && listingType === 'print' && (
                <>
                  <Text>Amazon Subtotal: <strong>₹{grandTotal.toLocaleString()}</strong></Text><br />
                  <Text>Referral (15%): <strong>₹{Math.round(grandTotal * 0.15).toLocaleString()}</strong></Text><br />
                  <Text>GST (18%): <strong>₹{Math.round((grandTotal + grandTotal * 0.15) * 0.18).toLocaleString()}</strong></Text><br />
                  <Text>Profit (30%): <strong>₹{Math.round(Math.round((grandTotal * 0.30) / 100) * 100).toLocaleString()}</strong></Text><br />
                  <Title level={3} style={{ margin: '8px 0 0 0', color: '#ff7a45' }}>AMAZON PRICE: ₹{amazonPrice.toLocaleString()}</Title>
                </>
              )}
            </Col>
          </Row>
          <div style={{ marginTop: 12 }}>
            <a onClick={() => setShowBreakdown(!showBreakdown)}>{showBreakdown ? 'Hide' : 'Show'} Detailed Breakdown</a>
            {showBreakdown && (
              <div style={{ marginTop: 12, fontSize: 12, padding: '8px', background: 'white', borderRadius: 4 }}>
                <Text>Base: ₹{basePrice}</Text><br />
                {Object.entries(packaging).map(([key, val]) => val ? <Text key={key}>{key}: ₹{PACKAGING_COSTS[key]}<br /></Text> : null)}
                <Text>Service: ₹500</Text>
              </div>
            )}
          </div>
        </Card>

        <Form.Item name="noOfDays" label="Days to Create">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="imageUrl" label="Image URL" rules={[{ type: 'url', message: 'Invalid URL' }]}>
          <Input placeholder="Google Drive link" />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, curValues) => prevValues.imageUrl !== curValues.imageUrl}>
          {({ getFieldValue }) => {
            const imageUrl = getFieldValue('imageUrl');
            return imageUrl ? (
              <div style={{ marginBottom: 24 }}>
                <Title level={5}>Image Preview:</Title>
                <Image src={imageUrl} alt="Preview" style={{ maxWidth: 300, maxHeight: 300 }} />
              </div>
            ) : null;
          }}
        </Form.Item>

        <Form.Item name="tags" label="Tags (comma separated)">
          <Input placeholder="e.g., abstract, landscape" />
        </Form.Item>

        <Form.Item name="hasParticipatedInCompetition" valuePropName="checked">
          <Checkbox>Participated in Competition?</Checkbox>
        </Form.Item>

        <Divider orientation="left">Pricing & Availability</Divider>

        <Form.Item name="isOriginalAvailable" valuePropName="checked">
          <Checkbox>Original Available?</Checkbox>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, curValues) => prevValues.isOriginalAvailable !== curValues.isOriginalAvailable}>
          {({ getFieldValue }) => {
            if (getFieldValue('isOriginalAvailable')) {
              return (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="artMaterialCost" label="Material Cost (₹)" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="artistCharge" label="Artist Charge (₹)" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="packingAndDeliveryCharges" label="Packing & Delivery (₹)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Space>
              );
            }
            return null;
          }}
        </Form.Item>

        <Form.Item name="isPrintOnDemandAvailable" valuePropName="checked" style={{ marginTop: 20 }}>
          <Checkbox>Print-on-Demand Available?</Checkbox>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, curValues) => prevValues.isPrintOnDemandAvailable !== curValues.isPrintOnDemandAvailable}>
          {({ getFieldValue }) => {
            if (getFieldValue('isPrintOnDemandAvailable')) {
              return (
                <Form.Item name="basePrintCostPerSqFt" label="Base Print Cost Per Sq. Inch (₹)" initialValue={500}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              );
            }
            return null;
          }}
        </Form.Item>

        <Divider orientation="left">Marketplace Listings</Divider>

        <Form.Item name="isInAmazon" valuePropName="checked">
          <Checkbox>Listed on Amazon? {listingType === 'original' && <Tag color="red">Not supported for Original</Tag>}</Checkbox>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, curValues) => prevValues.isInAmazon !== curValues.isInAmazon}>
          {({ getFieldValue }) => {
            if (getFieldValue('isInAmazon') && listingType === 'print') {
              return (
                <Form.Item name="amazonLink" label="Amazon Link" rules={[{ type: 'url' }]}>
                  <Input />
                </Form.Item>
              );
            }
            return null;
          }}
        </Form.Item>

        <Title level={5} style={{ marginTop: 20 }}>Other Platforms</Title>
        <Form.List name="otherPlatformListings">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, 'platform']} rules={[{ required: true }]}>
                    <Input placeholder="Platform" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'link']} rules={[{ required: true, type: 'url' }]}>
                    <Input placeholder="Link" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Platform</Button>
            </>
          )}
        </Form.List>

        <Divider orientation="left">Internal Management</Divider>

        <Form.Item name="marketingStatus" label="Marketing Status">
          <Input />
        </Form.Item>

        <Title level={5} style={{ marginTop: 20 }}>Monitoring Items</Title>
        <Form.List name="monitoringItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, 'value']} rules={[{ required: true }]}>
                    <Input placeholder="Monitoring item" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add({ value: '' })} block icon={<PlusOutlined />}>Add Item</Button>
            </>
          )}
        </Form.List>

        <Form.Item name="internalRemarks" label="Internal Remarks">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item style={{ marginTop: 30 }}>
          <Button type="primary" htmlType="submit" loading={loading}>{isEditing ? 'Update' : 'Add'}</Button>
          <Button onClick={() => navigate('/artworks')} style={{ marginLeft: 8 }}>Cancel</Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ArtworkFormPage;
