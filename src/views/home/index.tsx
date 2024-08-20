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
      const result1 = await request.post<IProps>('/area/page', {
        pageNum: 1,
        pageSize: 3,
      });
      const result2 = await request.post<IProps>('/area/page', {
        pageNum: 1,
        pageSize: 3,
      });
      const result3 = await request.post<IProps>('/area/page', {
        pageNum: 1,
        pageSize: 3,
      });

      // const result2 = await rpcRequest<IProps>({
      //   url: '/area/page',
      //   method: 'post',
      //   data: { pageNum: 1, pageSize: 3 },
      // });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getData();
  }, []);
  return (
    <Space style={{ width: '100%' }}>
      <Button type="primary">按钮1</Button>
      <Button>按钮2</Button>
    </Space>
  );
}
