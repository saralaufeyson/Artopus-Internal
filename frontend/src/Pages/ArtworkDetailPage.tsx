// frontend/src/pages/ArtworkDetailPage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { PictureOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Specify type for useParams
  const navigate = useNavigate();

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item onClick={() => navigate('/artworks')}>
          <span style={{ cursor: 'pointer' }}><ArrowLeftOutlined /> Artworks</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><PictureOutlined /> Artwork: {id}</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>Artwork Details for ID: {id}</Title>
      <p>Detailed information about this artwork will be displayed here.</p>
    </div>
  );
};

export default ArtworkDetailPage;