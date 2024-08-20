import { Button, Space } from 'antd';
import React, { useEffect } from 'react';

import { rpcRequest } from '@/utils/request';

export default function Home() {
  const getData = async () => {
    try {
      const result = await rpcRequest({
        method: 'POST',
        url: '/area/page',
        data: { pageNum: 1, pageSize: 3 },
      });

      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getData();
    getData();
    getData();
    getData();
    getData();
  }, []);
  return (
    <Space style={{ width: '100%' }}>
      <Button type="primary">按钮1</Button>
      <Button>按钮2</Button>
    </Space>
  );
}
