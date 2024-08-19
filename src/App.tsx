/**
 * 首页，不在router的context之中，所有hooks调用在BasicLayout中
 */
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Vconsole from 'vconsole';

import routes from './router';
import { LoginProvider } from './store/user';

console.log('process.env.NODE_ENV', process.env.NODE_ENV);

const router = createBrowserRouter(routes, {
  basename: import.meta.env.VITE_PUBLIC_PATH,
});

// 从本地加载之前的登录信息
const initUserInfo: Partial<any> = {
  Token: localStorage.getItem('token_name'),
  TokenExpireTime: localStorage.getItem('tokenExpireTime'),
  TokenUpdateCode: localStorage.getItem('tokenUpdateCode'),
  ID: localStorage.getItem('ID'),
  Name: localStorage.getItem('Name'),
  UUKey: localStorage.getItem('UUKey'),
  LoginScriptValue: localStorage.getItem('LoginScriptValue'),
};

const App = () => {
  const vConsole = new Vconsole();
  console.log(vConsole);

  return (
    <ConfigProvider locale={zhCN}>
      <LoginProvider initUserInfo={initUserInfo}>
        <RouterProvider router={router} />
      </LoginProvider>
    </ConfigProvider>
  );
};

export default App;
