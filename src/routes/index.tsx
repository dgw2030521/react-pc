import React from 'react';

import NotFound from '@/components/NotFound';
import BasicLayout from '@/layouts/BasicLayout';
import Home from '@/views/home';
import Login from '@/views/login';

const routes = [
  {
    path: '/',
    handle: {
      title: 'pc模板 ',
    },
    element: <BasicLayout />,
    children: [
      {
        index: true,
        handle: {
          title: '首页 ',
        },
        element: <Home />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
export default routes;
