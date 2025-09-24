// frontend/src/pages/ArtworksListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Breadcrumb, Table, Space, Button, Input, Select, Tag, Popconfirm, message, Spin, type PaginationProps } from 'antd';
import { PictureOutlined, PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import type { Artwork, ArtworksResponse } from '../types/artwork'; // Import your Artwork types
 // Import your Artwork types
import { useAuth } from '../Context/AuthContext'; // To get token for authenticated requests

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input; // Using Ant Design's Input.Search

const ArtworksListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth(); // Get token from AuthContext

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
    // You can add more filters here, e.g., artist: searchParams.get('artist') || '',
  });

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      // Construct query parameters
      const query = new URLSearchParams();
      query.append('page', pagination.current.toString());
      query.append('limit', pagination.pageSize.toString());
      if (filters.search) query.append('search', filters.search);
      if (filters.status) query.append('status', filters.status);
      // Add other filters as needed

      const res = await axios.get<ArtworksResponse>(`http://localhost:5000/api/artworks?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setArtworks(res.data.artworks);
      setPagination(prev => ({
        ...prev,
        total: res.data.count,
        current: res.data.currentPage,
      }));
    } catch (error: any) {
      console.error('Failed to fetch artworks:', error.response?.data?.message || error.message);
      message.error(error.response?.data?.message || 'Failed to fetch artworks.');
      // Optionally, redirect to login if 401 Unauthorized
      if (error.response?.status === 401) {
        // logout(); // Uncomment if you want to auto-logout on unauthorized access
        // navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, token]);

  useEffect(() => {
    // Update URL search params when filters or pagination change
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (pagination.current > 1) params.set('page', pagination.current.toString());
    if (pagination.pageSize !== 10) params.set('limit', pagination.pageSize.toString());

    setSearchParams(params); // Update the URL
    fetchArtworks(); // Fetch data based on current state
  }, [filters, pagination.current, pagination.pageSize, fetchArtworks, setSearchParams]);

  // --- Handlers for interactions ---
  const handleTableChange = (pagination: any) => { // Ant Design Table's pagination type is 'TablePaginationConfig'
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, status: '', page: 1 })); // Reset page/status on new search
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value, page: 1 }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAddArtwork = () => {
    navigate('/artworks/new'); // Navigate to a form for adding new artwork
  };

  const handleView = (id: string) => {
    navigate(`/artworks/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/artworks/${id}/edit`); // Navigate to a form for editing artwork
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/artworks/${id}/delete-request`, { reason: 'Requested by user' }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      message.success('Deletion request submitted successfully!');
      fetchArtworks(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to submit deletion request:', error.response?.data?.message || error.message);
      message.error(error.response?.data?.message || 'Failed to submit deletion request.');
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: 'Code No.',
      dataIndex: 'codeNo',
      key: 'codeNo',
      sorter: true, // Enable sorting if your backend supports it
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
    },
    {
      title: 'Artist',
      dataIndex: ['artist', 'name'], // Access nested artist name
      key: 'artist',
      render: (text: string, record: Artwork) => (
        <a onClick={() => navigate(`/artists/${record.artist._id}`)}>{text}</a>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Artwork['status']) => {
        let color;
        switch (status) {
          case 'published': color = 'green'; break;
          case 'in_gallery': color = 'blue'; break;
          case 'sold': color = 'red'; break;
          case 'pending': color = 'gold'; break;
          default: color = 'default';
        }
        return <Tag color={color}>{status.toUpperCase().replace('_', ' ')}</Tag>;
      },
      sorter: true,
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price?: number) => price ? `€${price.toLocaleString()}` : 'N/A',
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Artwork) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => handleView(record._id)} />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record._id)} />
          <Popconfirm
            title="Are you sure to submit deletion request?"
            onConfirm={() => handleDeleteRequest(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger disabled={record.isDeleted} />
          </Popconfirm>
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
          value={filters.search} // Controlled component
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by Status"
          style={{ width: 180 }}
          onChange={handleStatusChange}
          value={filters.status || undefined} // Ant Design Select needs undefined for no selection
          allowClear
        >
          <Option value="published">Published</Option>
          <Option value="in_gallery">In Gallery</Option>
          <Option value="sold">Sold</Option>
          <Option value="pending">Pending</Option>
          <Option value="archived">Archived</Option>
        </Select>
        {/* Add more filter options here */}
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={artworks}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange} // Handle pagination, sorting, filtering changes
          // rowClassName={(record) => record.isDeleted ? 'artwork-deleted-row' : ''} // Optional: visually mark deleted
        />
      </Spin>
    </div>
  );
};

export default ArtworksListPage;