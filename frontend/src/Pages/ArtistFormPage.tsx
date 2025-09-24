// frontend/src/pages/ArtistFormPage.tsx
import React from 'react';
import { Typography, Breadcrumb, Button } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ArtistFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditing = !!id;

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item onClick={() => navigate('/artists')}>
          <span style={{ cursor: 'pointer' }}><ArrowLeftOutlined /> Artists</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item><UserOutlined /> {isEditing ? `Edit Artist: ${id}` : 'Add New Artist'}</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>{isEditing ? `Edit Artist` : 'Add New Artist'}</Title>
      <p>This page will contain the form for {isEditing ? `editing artist ${id}` : 'adding a new artist'}.</p>
      <Button type="primary" onClick={() => console.log('Save form')}>Save Artist</Button>
    </div>
  );
};

export default ArtistFormPage;