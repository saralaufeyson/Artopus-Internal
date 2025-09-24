// frontend/src/pages/ArtistsListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { Typography, Breadcrumb, Table, Space, Button, Input, Tag, Popconfirm, message, Spin } from 'antd';
import { UserOutlined, PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import type { Artist, ArtistsResponse } from '../types/artist'; // Import your Artist types
import { useAuth } from '../Context/AuthContext';

const { Title } = Typography;
const { Search } = Input;

const ArtistsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();

  const [allArtists, setAllArtists] = useState<Artist[]>([]); // Store all fetched artists
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0, // This will be set based on the filtered results
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
  });

  // Fetch ALL artists (or adjust if backend will add pagination later)
  const fetchAllArtists = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Current token in ArtistsListPage:', token);

      if (!token) {
        console.error("No token found. User might not be authenticated.");
        message.error("Authentication required. Please log in.");
        setLoading(false);
        navigate('/login');
        return;
      }

      // Modified to call the API without pagination parameters, expecting full array
      const res = await axios.get<ArtistsResponse>(`http://localhost:5000/api/artists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API response for artists (direct array):', res.data); // This should be the array
      setAllArtists(res.data); // Set the array directly
      setPagination(prev => ({
        ...prev,
        total: res.data.length, // Set total based on the length of the fetched array
      }));
    } catch (error: any) {
      console.error('Failed to fetch artists:', error.response?.data?.message || error.message, error);
      message.error(error.response?.data?.message || 'Failed to fetch artists.');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchAllArtists(); // Fetch all artists once on component mount
  }, [fetchAllArtists]);


  // --- Filtering and Pagination on the Frontend ---
  const filteredArtists = useMemo(() => {
    let tempArtists = allArtists;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      tempArtists = tempArtists.filter(artist =>
        artist.name.toLowerCase().includes(searchTerm) ||
        (artist.contact?.email && artist.contact.email.toLowerCase().includes(searchTerm)) ||
        (artist.contact?.phone && artist.contact.phone.includes(searchTerm))
        // Add more fields to search as needed
      );
    }

    // Update total for pagination based on filtered results
    setPagination(prev => {
        if (prev.total !== tempArtists.length) {
            return { ...prev, total: tempArtists.length, current: 1 }; // Reset to page 1 if total changes
        }
        return prev;
    });

    // Apply frontend pagination
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return tempArtists.slice(startIndex, endIndex);

  }, [allArtists, filters.search, pagination.current, pagination.pageSize]); // Depend on allArtists and filters

  // --- Handlers for interactions ---
  const handleTableChange = (tablePagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: tablePagination.current,
      pageSize: tablePagination.pageSize,
    }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1 on new search
  };

  const handleAddArtist = () => {
    navigate('/artists/new');
  };

  const handleView = (id: string) => {
    navigate(`/artists/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/artists/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    try {
      if (!token) {
        message.error("Authentication required to delete an artist.");
        return;
      }

      await axios.delete(`http://localhost:5000/api/artists/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      message.success('Artist deleted successfully!');
      // After deletion, refetch ALL artists to ensure consistency
      fetchAllArtists();
    } catch (error: any) {
      console.error('Failed to delete artist:', error.response?.data?.message || error.message);
      message.error(error.response?.data?.message || 'Failed to delete artist.');
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Artist, b: Artist) => a.name.localeCompare(b.name), // Client-side sorting
      render: (text: string, record: Artist) => (
        <a onClick={() => navigate(`/artists/${record._id}`)}>{text}</a>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['contact', 'email'], // Access nested contact.email
      key: 'email',
      sorter: (a: Artist, b: Artist) => (a.contact?.email || '').localeCompare(b.contact?.email || ''),
    },
    {
      title: 'Phone',
      dataIndex: ['contact', 'phone'], // Access nested contact.phone
      key: 'phone',
      sorter: (a: Artist, b: Artist) => (a.contact?.phone || '').localeCompare(b.contact?.phone || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status?: Artist['status']) => { // Status is optional now
        let color = status === 'active' ? 'green' : (status === 'inactive' ? 'red' : 'default');
        return <Tag color={color}>{status ? status.toUpperCase() : 'N/A'}</Tag>;
      },
      sorter: (a: Artist, b: Artist) => (a.status || '').localeCompare(b.status || ''),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Artist) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => handleView(record._id)} />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record._id)} />
          <Popconfirm
            title="Are you sure to delete this artist?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><UserOutlined /> Artists</Breadcrumb.Item>
      </Breadcrumb>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2} style={{ margin: 0 }}>Artists Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddArtist}>
          Add New Artist
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search by name, email, phone..."
          onSearch={handleSearch}
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ width: 300 }}
        />
        {/* Add more filter options for artists if needed */}
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredArtists} // Use the frontend-paginated and filtered data
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total, // Use total from filtered data
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange} // Ant Design Table handles its own pagination/sorting UI changes
        />
      </Spin>
    </div>
  );
};

export default ArtistsListPage;