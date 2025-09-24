// frontend/src/pages/ArtistDetailPage.tsx
import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Specify type for useParams
  const navigate = useNavigate();

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item onClick={() => navigate('/artists')}>
          <span style={{ cursor: 'pointer' }}><ArrowLeftOutlined /> Artists</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><UserOutlined /> Artist: {id}</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>Artist Details for ID: {id}</Title>
      <p>Detailed information about this artist will be displayed here.</p>
    </div>
  );
};

export default ArtistDetailPage;