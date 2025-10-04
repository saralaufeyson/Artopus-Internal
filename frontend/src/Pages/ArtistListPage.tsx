import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography, Breadcrumb, Table, Space, Button, Input, Tag, Popconfirm,
  Spin, Avatar, Card, Row, Col, Statistic
} from 'antd';
import {
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  TeamOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../Context/NotificationContext';
import axios from 'axios';
import type { Artist, ArtistsResponse } from '../types/artist';
import { useAuth } from '../Context/AuthContext';

const { Title } = Typography;
const { Search } = Input;

const ArtistsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const { showNotification } = useNotification();

  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
  });

  const fetchAllArtists = useCallback(async () => {
    setLoading(true);
    try {
      if (!token) {
        console.error("No token found. User might not be authenticated.");
        showNotification('error', 'Authentication required. Please log in.');
        setLoading(false);
        navigate('/login');
        return;
      }

      const res = await axios.get<ArtistsResponse>(`http://localhost:5000/api/artists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAllArtists(res.data);
      setPagination(prev => ({
        ...prev,
        total: res.data.length,
      }));
    } catch (error: any) {
      console.error('Failed to fetch artists:', error.response?.data?.message || error.message, error);
      showNotification('error', error.response?.data?.message || 'Failed to fetch artists.');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchAllArtists();
  }, [fetchAllArtists]);

  const filteredArtists = useMemo(() => {
    let tempArtists = allArtists;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      tempArtists = tempArtists.filter(artist =>
        artist.name.toLowerCase().includes(searchTerm) ||
        (artist.contact?.email && artist.contact.email.toLowerCase().includes(searchTerm)) ||
        (artist.contact?.phone && artist.contact.phone.includes(searchTerm))
      );
    }

    setPagination(prev => {
        if (prev.total !== tempArtists.length) {
            return { ...prev, total: tempArtists.length, current: 1 };
        }
        return prev;
    });

    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return tempArtists.slice(startIndex, endIndex);

  }, [allArtists, filters.search, pagination.current, pagination.pageSize]);

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

  const handleAddArtist = () => {
    navigate('/artists/new');
  };

  const handleView = (id: string) => {
    navigate(`/artists/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/artists/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      if (!token) {
        showNotification('error', 'Authentication required to delete an artist.');
        return;
      }

      await axios.delete(`http://localhost:5000/api/artists/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('success', 'Artist deleted successfully!');
      fetchAllArtists();
    } catch (error: any) {
      console.error('Failed to delete artist:', error.response?.data?.message || error.message);
      showNotification('error', error.response?.data?.message || 'Failed to delete artist.');
    }
  };

  const columns = [
    {
      title: 'Profile',
      dataIndex: 'profileImageUrl',
      key: 'profileImageUrl',
      width: 80,
      render: (profileImageUrl: string, record: Artist) => (
        <Avatar
          size={50}
          src={profileImageUrl || undefined}
          icon={<UserOutlined />}
          style={{ cursor: 'pointer' }}
          onClick={() => handleView(record._id)}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Artist, b: Artist) => a.name.localeCompare(b.name),
      render: (text: string, record: Artist) => (
        <a onClick={() => navigate(`/artists/${record._id}`)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['contact', 'email'],
      key: 'email',
      sorter: (a: Artist, b: Artist) => (a.contact?.email || '').localeCompare(b.contact?.email || ''),
    },
    {
      title: 'Phone',
      dataIndex: ['contact', 'phone'],
      key: 'phone',
      sorter: (a: Artist, b: Artist) => (a.contact?.phone || '').localeCompare(b.contact?.phone || ''),
      render: (phone: string) => phone || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status?: Artist['status']) => {
        let color = status === 'active' ? 'success' : (status === 'inactive' ? 'error' : 'default');
        let icon = status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
        return (
          <Tag color={color} icon={icon}>
            {status ? status.toUpperCase() : 'N/A'}
          </Tag>
        );
      },
      sorter: (a: Artist, b: Artist) => (a.status || '').localeCompare(b.status || ''),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value: any, record: Artist) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Artist) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record._id)}
            size="small"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record._id)}
            size="small"
            type="primary"
          />
          <Popconfirm
            title="Are you sure to delete this artist?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalArtists = allArtists.length;
  const activeArtists = allArtists.filter(a => a.status === 'active').length;
  const inactiveArtists = allArtists.filter(a => a.status === 'inactive').length;

  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><UserOutlined /> Artists</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Artists"
              value={totalArtists}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="Active Artists"
              value={activeArtists}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="Inactive Artists"
              value={inactiveArtists}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>Artists Management</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddArtist} size="large">
            Add New Artist
          </Button>
        </Space>

        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search by name, email, phone..."
            onSearch={handleSearch}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{ width: 400 }}
            allowClear
          />
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredArtists}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} artists`,
            }}
            onChange={handleTableChange}
            locale={{ emptyText: 'No artists found. Add your first artist to get started!' }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ArtistsListPage;
