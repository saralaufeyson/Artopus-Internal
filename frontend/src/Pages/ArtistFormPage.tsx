// frontend/src/pages/ArtistFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Typography, Breadcrumb, Button, Form, Input, Select, Space, message, Spin, Image, Row, Col } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import type { Artist } from '../types/artist'; // Use Artist type
 // Use Artist type

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ArtistFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Will be undefined for new artist
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { token } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingArtist, setFetchingArtist] = useState<boolean>(true);

  const isEditing = !!id;

  // --- Fetch Artist Data for Editing ---
  useEffect(() => {
    const fetchArtist = async () => {
      if (!isEditing || !token) {
        setFetchingArtist(false); // No need to fetch if creating new or no token
        return;
      }
      setFetchingArtist(true);
      try {
        const res = await axios.get<Artist>(`http://localhost:5000/api/artists/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Prepare data for the form, especially for nested objects
        const artistData = {
          ...res.data,
          // Flatten nested contact and socialMedia for Ant Design Form.Item names
          contactEmail: res.data.contact?.email,
          contactPhone: res.data.contact?.phone,
          contactAddress: res.data.contact?.address,
          instagram: res.data.socialMedia?.instagram,
          website: res.data.socialMedia?.website,
          otherSocialMedia: res.data.socialMedia?.other, // Assuming 'other' for consistency
        };
        form.setFieldsValue(artistData);
      } catch (error: any) {
        message.error(error.response?.data?.message || 'Failed to fetch artist details.');
        console.error('Failed to fetch artist:', error);
        navigate('/artists'); // Redirect if artist not found
      } finally {
        setFetchingArtist(false);
      }
    };
    fetchArtist();
  }, [id, isEditing, token, form, navigate]);


  // --- Form Submission Handler ---
  const onFinish = async (values: any) => {
    setLoading(true);
    if (!token) {
      message.error("Authentication required.");
      setLoading(false);
      return;
    }

    try {
      let response;
      // Reconstruct nested objects for the backend payload
      const payload = {
        name: values.name,
        bio: values.bio,
        internalNotes: values.internalNotes,
        status: values.status,
        profileImageUrl: values.profileImageUrl, // Include profile image URL
        contact: {
          email: values.contactEmail,
          phone: values.contactPhone,
          address: values.contactAddress,
        },
        socialMedia: {
          instagram: values.instagram,
          website: values.website,
          other: values.otherSocialMedia,
        },
      };

      if (isEditing) {
        response = await axios.put(`http://localhost:5000/api/artists/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Artist updated successfully!');
      } else {
        response = await axios.post(`http://localhost:5000/api/artists`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Artist added successfully!');
      }
      console.log('Artist saved/updated:', response.data);
      navigate('/artists'); // Go back to the artists list
    } catch (error: any) {
      console.error('Failed to save artist:', error.response?.data?.message || error.message);
      message.error(error.response?.data?.message || 'Failed to save artist.');
    } finally {
      setLoading(false);
    }
  };


  // --- Conditional Loading State ---
  if (fetchingArtist && isEditing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="Loading artist details..." />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item>
          <span onClick={() => navigate('/artists')} style={{ cursor: 'pointer' }}>
            <ArrowLeftOutlined /> Artists
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><UserOutlined /> {isEditing ? `Edit Artist: ${id}` : 'Add New Artist'}</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>{isEditing ? `Edit Artist` : 'Add New Artist'}</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'active', // Default status for new artist
          // Default contact and social media values if needed
        }}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input the artist name!' }]}
        >
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactEmail"
              label="Email"
              rules={[
                { required: true, message: 'Please input the artist email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="Phone"
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="contactAddress"
          label="Address"
        >
          <TextArea rows={2} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select the artist status!' }]}
        >
          <Select placeholder="Select status">
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Form.Item>

        {/* Profile Image URL Input and Preview */}
        <Form.Item
          name="profileImageUrl"
          label="Profile Image URL (Google Drive Link)"
          rules={[{ type: 'url', message: 'Please enter a valid URL or leave blank if no image.' }]}
        >
          <Input placeholder="Paste public Google Drive image link here (optional)" />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prevValues, curValues) => prevValues.profileImageUrl !== curValues.profileImageUrl}>
          {({ getFieldValue }) => {
            const currentImageUrl = getFieldValue('profileImageUrl');
            return currentImageUrl ? (
              <div style={{ marginBottom: 24 }}>
                <Title level={5}>Image Preview:</Title>
                <Image
                  src={currentImageUrl}
                  alt="Artist Profile Preview"
                  style={{ maxWidth: 150, maxHeight: 150, objectFit: 'cover', borderRadius: '50%', border: '1px solid #ddd' }}
                  fallback="https://via.placeholder.com/150?text=Invalid+Image" // Fallback for broken links
                />
              </div>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          name="bio"
          label="Bio"
        >
          <TextArea rows={4} />
        </Form.Item>

        <Title level={4} style={{ marginTop: 30 }}>Social Media Links</Title>
        <Form.Item
          name="instagram"
          label="Instagram"
          rules={[{ type: 'url', message: 'Please enter a valid URL!' }]}
        >
          <Input placeholder="e.g., https://instagram.com/artistname" />
        </Form.Item>
        <Form.Item
          name="website"
          label="Website"
          rules={[{ type: 'url', message: 'Please enter a valid URL!' }]}
        >
          <Input placeholder="e.g., https://www.artistwebsite.com" />
        </Form.Item>
        <Form.Item
          name="otherSocialMedia"
          label="Other Social Media Link"
          rules={[{ type: 'url', message: 'Please enter a valid URL!' }]}
        >
          <Input placeholder="e.g., https://twitter.com/artist" />
        </Form.Item>

        <Form.Item
          name="internalNotes"
          label="Internal Notes (Admin Only)"
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<UserOutlined />}>
            {isEditing ? 'Update Artist' : 'Add Artist'}
          </Button>
          <Button onClick={() => navigate('/artists')} style={{ marginLeft: 8 }}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ArtistFormPage;