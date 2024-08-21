import { Button, Space } from 'antd';
import React, { useEffect } from 'react';

import { request } from '@/utils/request';

interface IProps {
  list: any[];
  pageNum: number;
  pageSize: number;
  total: number;
  totalPage: number;
}

export default function Home() {
  const getData = async () => {
    try {
      const result = await request.post<IProps>('/area/page', {
        pageNum: 1,
        pageSize: 3,
      });

      console.log('111', result);
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
    getData();
    getData();
    getData();
  }, []);
  return (
    <Space style={{ width: '100%' }}>
      <Button
        type="primary"
        onClick={() => {
          getData();
        }}
      >
        按钮1
      </Button>
      <Button>按钮2</Button>
    </Space>
  );
}
