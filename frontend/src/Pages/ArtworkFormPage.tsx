// frontend/src/pages/ArtworkFormPage.tsx
import React from 'react';
import { Typography, Breadcrumb, Button } from 'antd';
import { PictureOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ArtworkFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Will be undefined for new artwork
  const navigate = useNavigate();

  const isEditing = !!id; // True if 'id' exists, meaning we're editing

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
      <p>This page will contain the form for {isEditing ? `editing artwork ${id}` : 'adding a new artwork'}.</p>
      <Button type="primary" onClick={() => console.log('Save form')}>Save Artwork</Button>
    </div>
  );
};

export default ArtworkFormPage;