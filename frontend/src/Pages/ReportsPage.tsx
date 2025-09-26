// frontend/src/Pages/ReportsPage.tsx
import React from 'react';
import { Typography, Breadcrumb, Card } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ReportsPage: React.FC = () => {
  return (
    <div>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><BarChartOutlined /> Reports</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>Reports & Analytics</Title>
      <Text type="secondary">
        This section will provide insights into sales, inventory, and artist performance.
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>Coming Soon!</Title>
        <Paragraph>
          Interactive charts and data tables will be available here to help you make informed decisions.
        </Paragraph>
      </Card>
    </div>
  );
};

export default ReportsPage;