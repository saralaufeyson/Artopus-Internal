// frontend/src/pages/ArtworkFormPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography, Breadcrumb, Button, Form, Input, Select, Space, message,
  Spin, Image, Row, Col, Checkbox, InputNumber, Divider, Tag
} from 'antd';
import { useNotification } from '../Context/NotificationContext'; // Import useNotification
import { PictureOutlined, ArrowLeftOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import type { Artwork } from '../types/artwork';
import type { Artist } from '../types/artist';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ArtworkFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { token } = useAuth();
  const { showNotification } = useNotification(); // Use notification hook

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingArtwork, setFetchingArtwork] = useState<boolean>(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [fetchingArtists, setFetchingArtists] = useState<boolean>(false);

  const isEditing = !!id;

  // --- Fetch Artists for Select Dropdown ---
  useEffect(() => {
    const fetchArtists = async () => {
      setFetchingArtists(true);
      try {
        const res = await axios.get<Artist[]>(`http://localhost:5000/api/artists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArtists(res.data);
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to fetch artists for dropdown.');
        console.error('Failed to fetch artists:', error);
      } finally {
        setFetchingArtists(false);
      }
    };
    if (token) {
      fetchArtists();
    }
  }, [token]);

  // --- Fetch Artwork Data for Editing ---
  useEffect(() => {
    const fetchArtwork = async () => {
      if (!isEditing || !token) {
        setFetchingArtwork(false);
        return;
      }
      setFetchingArtwork(true);
      try {
        const artworkRes = await axios.get<{ artwork: Artwork; pricing: any }>(`http://localhost:5000/api/artworks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { artwork, pricing } = artworkRes.data;

        // Prepare data for the form, flattening pricing fields
        const formData = {
          ...artwork,
          // Flatten dimensions
          dimensionsLength: artwork.dimensions?.length,
          dimensionsBreadth: artwork.dimensions?.breadth,
          dimensionsUnit: artwork.dimensions?.unit,
          
          // ✨ FIX: Convert tags array to a comma-separated string for the Input field
          tags: artwork.tags ? artwork.tags.join(', ') : '',

          // Flatten internal remarks (handle undefined safely, map to a single string)
          internalRemarks: artwork.internalRemarks && artwork.internalRemarks.length > 0
                           ? artwork.internalRemarks.map(r => r.remark).join('\n')
                           : '',

          // For Form.List of monitoringItems, map each string to an object { value: string }
          monitoringItems: artwork.monitoringItems?.map(item => ({ value: item })) || [],

          // Pricing details
          isOriginalAvailable: pricing?.isOriginalAvailable,
          artMaterialCost: pricing?.originalPricing?.artMaterialCost,
          artistCharge: pricing?.originalPricing?.artistCharge, // Total artist charge
          packingAndDeliveryCharges: pricing?.originalPricing?.packingAndDeliveryCharges,
          isPrintOnDemandAvailable: pricing?.isPrintOnDemandAvailable,
          basePrintCostPerSqFt: pricing?.printOnDemandPricing?.baseCostPerSqFt,
          isInAmazon: pricing?.amazonListing?.isInAmazon,
          amazonLink: pricing?.amazonListing?.link,
          otherPlatformListings: pricing?.otherPlatformListings || [],

          // Sold details for original pricing
          isSold: pricing?.originalPricing?.soldDetails?.isSold,
          saleDate: pricing?.originalPricing?.soldDetails?.saleDate ? new Date(pricing.originalPricing.soldDetails.saleDate) : undefined,
          sellingPriceOriginal: pricing?.originalPricing?.soldDetails?.sellingPrice,
          buyerName: pricing?.originalPricing?.soldDetails?.buyerName,
          buyerContact: pricing?.originalPricing?.soldDetails?.buyerContact,
        };
        form.setFieldsValue(formData);
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to fetch artwork details.');
        console.error('Failed to fetch artwork:', error);
        navigate('/artworks');
      } finally {
        setFetchingArtwork(false);
      }
    };
    fetchArtwork();
  }, [id, isEditing, token, form, navigate]);

  // --- Form Submission Handler ---
  const onFinish = async (values: any) => {
    setLoading(true);
    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
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
        dimensions: {
          length: values.dimensionsLength,
          breadth: values.dimensionsBreadth,
          unit: values.dimensionsUnit,
        },
        status: values.status,
        noOfDays: values.noOfDays,
        imageUrl: values.imageUrl,
        // This logic now works because values.tags will always be a string
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        sellingPrice: values.sellingPrice,

        isOriginalAvailable: values.isOriginalAvailable,
        artMaterialCost: values.artMaterialCost,
        artistCharge: values.artistCharge, // Total artist charge
        packingAndDeliveryCharges: values.packingAndDeliveryCharges,
        isPrintOnDemandAvailable: values.isPrintOnDemandAvailable,
        basePrintCostPerSqFt: values.basePrintCostPerSqFt,
        isInAmazon: values.isInAmazon,
        amazonLink: values.amazonLink,
        otherPlatformListings: values.otherPlatformListings || [],

        // For internalRemarks: send the string, backend will convert to array of objects
        internalRemarks: values.internalRemarks || '',
        // For monitoringItems: extract the 'value' from each object sent by Form.List
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
        response = await axios.put(`http://localhost:5000/api/artworks/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification('success', 'Artwork updated successfully!');
      } else {
        response = await axios.post(`http://localhost:5000/api/artworks`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification('success', 'Artwork added successfully!');
      }
      console.log('Artwork saved/updated:', response.data);
      navigate('/artworks');
    } catch (error: any) {
      console.error('Failed to save artwork:', error.response?.data?.message || error.message);
      showNotification('error', error.response?.data?.message || 'Failed to save artwork.');
    } finally {
      setLoading(false);
    }
  };


  // --- Conditional Loading State ---
  if ((fetchingArtwork && isEditing) || fetchingArtists) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip={fetchingArtists ? "Loading artists..." : "Loading artwork details..."} />
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
        <Breadcrumb.Item><PictureOutlined /> {isEditing ? `Edit Artwork: ${id}` : 'Add New Artwork'}</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>{isEditing ? `Edit Artwork` : 'Add New Artwork'}</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'available', // Default status for new artwork
          dimensionsUnit: 'inches',
          hasParticipatedInCompetition: false,
          isOriginalAvailable: true,
          isPrintOnDemandAvailable: false,
          isInAmazon: false,
          monitoringItems: [],
        }}
        style={{ maxWidth: 1000 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="codeNo"
              label="Artwork Code No."
              rules={[{ required: true, message: 'Please input the artwork code number!' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please input the artwork title!' }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="artist"
              label="Artist"
              rules={[{ required: true, message: 'Please select the artist!' }]}
            >
              <Select
                showSearch
                placeholder="Select an artist"
                optionFilterProp="children"
                loading={fetchingArtists}
                filterOption={(input, option) =>
                  option?.children && typeof option.children === 'string'
                    ? (option.children as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                    : false
                }
              >
                {artists.map(artist => (
                  <Option key={artist._id} value={artist._id}>{artist.name} ({artist.contact?.email})</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="penName"
              label="Pen Name (Artist Alias)"
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="medium"
          label="Medium"
          rules={[{ required: true, message: 'Please input the medium!' }]}
        >
          <Input />
        </Form.Item>

        <Title level={4} style={{ marginTop: 30 }}>Dimensions</Title>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="dimensionsLength"
              label="Length"
              rules={[{ required: true, message: 'Please input length!' }]}
            >
              <InputNumber min={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="dimensionsBreadth"
              label="Breadth"
              rules={[{ required: true, message: 'Please input breadth!' }]}
            >
              <InputNumber min={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="dimensionsUnit"
              label="Unit"
              rules={[{ required: true, message: 'Please select unit!' }]}
            >
              <Select>
                <Option value="inches">Inches</Option>
                <Option value="cm">cm</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="status"
          label="Artwork Status"
          rules={[{ required: true, message: 'Please select artwork status!' }]}
        >
          <Select placeholder="Select status">
            <Option value="available">Available</Option>
            <Option value="sold">Sold (Soft-mark as sold, actual sale details below)</Option>
            <Option value="on_display">On Display</Option>
            <Option value="loaned">Loaned</Option>
            <Option value="archived">Archived</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="sellingPrice"
          label="Selling Price (Artwork Base Price)"
          rules={[{ required: true, message: 'Please input the base selling price!' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>

        <Form.Item
          name="noOfDays"
          label="Number of Days to Create (if applicable)"
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="imageUrl"
          label="Artwork Image URL (Google Drive Link)"
          rules={[{ type: 'url', message: 'Please enter a valid URL or leave blank.' }]}
        >
          <Input placeholder="Paste public Google Drive image link here" />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prevValues, curValues) => prevValues.imageUrl !== curValues.imageUrl}>
          {({ getFieldValue }) => {
            const currentImageUrl = getFieldValue('imageUrl');
            return currentImageUrl ? (
              <div style={{ marginBottom: 24 }}>
                <Title level={5}>Image Preview:</Title>
                <Image
                  src={currentImageUrl}
                  alt="Artwork Preview"
                  style={{ maxWidth: 300, maxHeight: 300, objectFit: 'contain', border: '1px solid #ddd' }}
                  fallback="https://via.placeholder.com/300x200?text=Invalid+Image" // Fallback for broken links
                />
              </div>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          name="tags"
          label="Tags (comma separated)"
        >
          <Input placeholder="e.g., abstract, landscape, oil, modern" />
        </Form.Item>

        <Form.Item
          name="hasParticipatedInCompetition"
          valuePropName="checked"
        >
          <Checkbox>Has Participated in Competition?</Checkbox>
        </Form.Item>

        <Divider orientation="left">Pricing & Availability</Divider>

        <Form.Item
          name="isOriginalAvailable"
          valuePropName="checked"
        >
          <Checkbox>Original Artwork Available for Sale?</Checkbox>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => prevValues.isOriginalAvailable !== curValues.isOriginalAvailable}
        >
          {({ getFieldValue }) => {
            if (getFieldValue('isOriginalAvailable')) {
              return (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="artMaterialCost"
                        label="Art Material Cost (₹)"
                        rules={[{ required: true, message: 'Please input material cost!' }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="artistCharge"
                        label="Total Artist Charge (₹)"
                        rules={[{ required: true, message: 'Please input artist charge!' }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="packingAndDeliveryCharges"
                    label="Packing & Delivery Charges (₹)"
                  >
                    <InputNumber min={0} style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                  <Title level={5}>Original Sold Details</Title>
                  <Form.Item name="isSold" valuePropName="checked">
                      <Checkbox>Original is Sold</Checkbox>
                  </Form.Item>
                  <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, curValues) => prevValues.isSold !== curValues.isSold}
                  >
                      {({ getFieldValue: getFieldValueSold }) =>
                          getFieldValueSold('isSold') ? (
                              <>
                                  <Form.Item
                                      name="sellingPriceOriginal"
                                      label="Original Sale Price (₹)"
                                  >
                                      <InputNumber min={0} style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                  </Form.Item>
                                  <Form.Item name="buyerName" label="Buyer Name">
                                      <Input />
                                  </Form.Item>
                                  <Form.Item name="buyerContact" label="Buyer Contact">
                                      <Input />
                                  </Form.Item>
                                  {/* Not including a DatePicker for now for simplicity, backend can auto-set saleDate */}
                              </>
                          ) : null
                      }
                  </Form.Item>
                </Space>
              );
            }
            return null;
          }}
        </Form.Item>

        <Form.Item
          name="isPrintOnDemandAvailable"
          valuePropName="checked"
          style={{ marginTop: 20 }}
        >
          <Checkbox>Print-on-Demand Available?</Checkbox>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => prevValues.isPrintOnDemandAvailable !== curValues.isPrintOnDemandAvailable}
        >
          {({ getFieldValue }) => {
            if (getFieldValue('isPrintOnDemandAvailable')) {
              return (
                <Form.Item
                  name="basePrintCostPerSqFt"
                  label="Base Print Cost Per Sq. Inch (₹) - Default: 500"
                  rules={[{ required: true, message: 'Please input base print cost!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              );
            }
            return null;
          }}
        </Form.Item>

        <Divider orientation="left">Marketplace Listings</Divider>

        <Form.Item
          name="isInAmazon"
          valuePropName="checked"
        >
          <Checkbox>Listed on Amazon?</Checkbox>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => prevValues.isInAmazon !== curValues.isInAmazon}
        >
          {({ getFieldValue }) => {
            if (getFieldValue('isInAmazon')) {
              return (
                <Form.Item
                  name="amazonLink"
                  label="Amazon Link"
                  rules={[{ type: 'url', message: 'Please enter a valid URL!' }]}
                >
                  <Input placeholder="e.g., https://amazon.in/artwork-product-link" />
                </Form.Item>
              );
            }
            return null;
          }}
        </Form.Item>

        <Title level={5} style={{ marginTop: 20 }}>Other Platform Listings</Title>
        <Form.List name="otherPlatformListings">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'platform']}
                    rules={[{ required: true, message: 'Missing platform' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Platform Name (e.g., Etsy, SaatchiArt)" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'link']}
                    rules={[{ required: true, type: 'url', message: 'Missing valid link' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Link" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Other Platform Listing
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider orientation="left">Internal Management</Divider>

        <Form.Item
          name="marketingStatus"
          label="Marketing Status"
        >
          <Input />
        </Form.Item>

        <Title level={5} style={{ marginTop: 20 }}>Monitoring Items</Title>
        <Form.List name="monitoringItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'value']} // Use 'value' as the field name within the object
                    rules={[{ required: true, message: 'Missing monitoring item' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Monitoring Item (e.g., Google Ads, Social Media Campaign)" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ value: '' })} block icon={<PlusOutlined />}>
                  Add Monitoring Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item
          name="internalRemarks"
          label="Internal Remarks (Admin Only)"
        >
          <TextArea rows={3} placeholder="Add internal notes about the artwork..." />
        </Form.Item>


        <Form.Item style={{ marginTop: 30 }}>
          <Button type="primary" htmlType="submit" loading={loading} icon={<PictureOutlined />}>
            {isEditing ? 'Update Artwork' : 'Add Artwork'}
          </Button>
          <Button onClick={() => navigate('/artworks')} style={{ marginLeft: 8 }}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ArtworkFormPage;