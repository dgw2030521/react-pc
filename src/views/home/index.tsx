import { Button, Space } from 'antd';
import React from 'react';

export default function Home() {
  return (
    <Space style={{ width: '100%' }}>
      <Button type="primary">按钮1</Button>
      <Button>按钮2</Button>
    </Space>
  );
}
