// frontend/src/pages/ArtworksListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Breadcrumb, Table, Space, Button, Input, Select, Tag, Popconfirm, message, Spin } from 'antd';
import { PictureOutlined, PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../Context/NotificationContext'; // Import useNotification
import axios from 'axios';
import type { Artwork, ArtworksResponse, Artist } from '../types/artwork';
import { useAuth } from '../Context/AuthContext';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const ArtworksListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth(); // Get user to check roles
  const { showNotification } = useNotification(); // Use notification hook

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
  });

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append('page', pagination.current.toString());
      query.append('limit', pagination.pageSize.toString());
      if (filters.search) query.append('search', filters.search);
      if (filters.status) query.append('status', filters.status);

      const res = await axios.get<ArtworksResponse>(`http://localhost:5000/api/artworks?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setArtworks(res.data.artworks);
      setPagination(prev => ({
        ...prev,
        total: res.data.total,
        current: res.data.page,
      }));
    } catch (error: any) {
      console.error('Failed to fetch artworks:', error.response?.data?.message || error.message);
      showNotification('error', error.response?.data?.message || 'Failed to fetch artworks.');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, token]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);
  
  // Simplified useEffect for search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    navigate(`?${params.toString()}`, { replace: true });
  }, [filters, navigate]);


  const handleTableChange = (tablePagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: tablePagination.current,
      pageSize: tablePagination.pageSize,
    }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAddArtwork = () => navigate('/artworks/new');
  const handleView = (id: string) => navigate(`/artworks/${id}`);
  const handleEdit = (id: string) => navigate(`/artworks/edit/${id}`);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/artworks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification('success', 'Artwork permanently deleted!');
      fetchArtworks(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to delete artwork:', error.response?.data?.message || error.message);
      showNotification('error', error.response?.data?.message || 'Failed to delete artwork.');
    }
  };

  const columns = [
    { title: 'Code No.', dataIndex: 'codeNo', key: 'codeNo' },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Artist',
      dataIndex: 'artist',
      key: 'artist',
      render: (artist: Artist | string) => (
        typeof artist === 'object' && artist !== null 
          ? <a onClick={() => navigate(`/artists/${artist._id}`)}>{artist.name}</a>
          : <span>{String(artist)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status?.toUpperCase().replace('_', ' ')}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price?: number) => price ? `₹${price.toLocaleString()}` : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Artwork) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => handleView(record._id)} />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record._id)} />
          {/* Show delete button only to admins */}
          {user?.roles.includes('admin') && (
            <Popconfirm
              title="Permanently delete this artwork?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record._id)}
              okText="Yes, Delete"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><PictureOutlined /> Artworks</Breadcrumb.Item>
      </Breadcrumb>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2} style={{ margin: 0 }}>Artworks Inventory</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddArtwork}>
          Add New Artwork
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search by title, code, artist..."
          onSearch={handleSearch}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by Status"
          style={{ width: 180 }}
          onChange={handleStatusChange}
          value={filters.status || undefined}
          allowClear
        >
          <Option value="available">Available</Option>
          <Option value="on_display">On Display</Option>
          <Option value="sold">Sold</Option>
          <Option value="loaned">Loaned</Option>
          <Option value="archived">Archived</Option>
        </Select>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={artworks}
          rowKey="_id"
          pagination={{ ...pagination }}
          onChange={handleTableChange}
        />
      </Spin>
    </div>
  );
};

export default ArtworksListPage;