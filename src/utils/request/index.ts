/**
 * 请求库axios封装 https://axios-http.com/zh/docs/req_config
 * 1、普通表单提交 application/x-www-form-urlencoded https://axios-http.com/zh/docs/urlencoded
 * 2、文件上传 formData https://axios-http.com/zh/docs/multipart
 * 3、json提交 application/json
 * 4、下载文件 stream
 *
 * !!! 需增加能力
 * 1、取消重复请求
 * 2、登录失效，取消后续所有无效请求
 */

import type {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';

import { Response } from '@/types/Common';
import {
  addPendingRequest,
  download,
  removePendingRequest,
} from '@/utils/request/tools';

const token_name = 'token';

const host = import.meta.env.VITE_APP_DOMAIN;

const controller = new AbortController();

// 默认实例
const axiosInstance = axios.create({
  baseURL: host,
  timeout: 10000,
  // 跨域请求是否携带cookie
  withCredentials: true,
  responseType: 'json',
  // responseType: 'blob'; 下载
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    // 登录完成之后，将用户的token通过localStorage或者cookie存在本地
    Authorization: localStorage.getItem(token_name),
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (reqConfig: InternalAxiosRequestConfig) => {
    // FormData的时候需要特殊处理，或者两个都自己设置
    if (reqConfig.data instanceof FormData) {
      reqConfig.headers['Content-Type'] = 'multipart/form-data;charset=utf-8';
    }
    const token = localStorage.getItem(token_name);
    if (token) reqConfig.headers.Authorization = token;

    // 检查是否存在重复请求，若存在则取消已发的请求
    removePendingRequest(reqConfig);
    // 把当前请求信息添加到pendingRequest对象中
    addPendingRequest(reqConfig);

    return {
      ...reqConfig,
      signal: controller.signal,
    };
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * 响应拦截器
 */
axiosInstance.interceptors.response.use(
  async response => {
    // 特殊响应，下载文件
    if (
      response.config.responseType === 'blob' &&
      response.data instanceof Blob &&
      response.data.type?.includes('application/json')
    ) {
      const dataText = await response.data?.text();
      const dataJson = JSON.parse(dataText);
      return {
        ...response,
        data: dataJson,
      };
    }
    if (response.status === 200) {
      // 从pendingRequest对象中移除请求
      removePendingRequest(response.config);
      return Promise.resolve(response);
    }
    return Promise.reject(response);
  },
  error => {
    // 从pendingRequest对象中移除请求
    removePendingRequest(error.config || {});
    if (axios.isCancel(error)) {
      // console.log(`已取消的重复请求：${error.message}`);
      return Promise.reject(error);
    }
    if (error.response.status) {
      switch (error.response.status) {
        // 401: 未登录
        // 未登录则跳转登录页面，并携带当前页面的路径
        // 在登录成功后返回当前页面，这一步需要在登录页操作。
        case 401:
          // router.replace({
          //   path: '/login',
          //   query: {
          //     redirect: router.currentRoute.fullPath,
          //   },
          // });
          console.error('未登录');
          // controller.abort('取消请求');
          break;

        // 403 token过期
        // 登录过期对用户进行提示
        // 清除本地token和清空store中token对象
        // 跳转登录页面
        case 403:
          console.error('登录过期，请重新登录');
          // 清除token
          localStorage.removeItem('token');
          // controller.abort('取消请求');

          // store.commit('loginSuccess', null);
          // // 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面
          // setTimeout(() => {
          //   router.replace({
          //     path: '/login',
          //     query: {
          //       redirect: router.currentRoute.fullPath,
          //     },
          //   });
          // }, 1000);
          break;

        // 404请求不存在
        case 404:
          console.error('网络请求不存在');
          break;
        // 其他错误，直接抛出错误提示
        default:
          console.error('请求错误');
      }
      return Promise.reject(error.response);
    }
  },
);

async function axiosRequest<T>(req: Partial<AxiosRequestConfig>) {
  return new Promise<T>((resolve, reject) => {
    axiosInstance
      .request<Response<T>>(req)
      .then(resp => {
        console.log('完整的response:::', resp);
        // 只接收了status=200的请求
        const result = resp.data;
        // 下载
        if (result instanceof Blob) {
          download(resp);
          resolve(null);
        }
        // 普通返回
        if (!result.success) {
          if (result.errorCode.indexOf('401') > -1) {
            // controller.abort('取消请求');
            // 登录失效后的处理
            // window.location.href = configParams.loginErrUrl;
          }
          // @NOTICE 业务失败
          reject(result);
        } else {
          resolve(result.data);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

const request = {
  get: <T>(url: string, config?: Partial<AxiosRequestConfig>) =>
    axiosRequest<T>({ ...config, url, method: 'GET' }),
  delete: <T>(url: string, config?: Partial<AxiosRequestConfig>) =>
    axiosRequest<T>({ ...config, url, method: 'DELETE' }),
  post: <T>(url: string, data: any, config?: Partial<AxiosRequestConfig>) =>
    axiosRequest<T>({ ...config, url, data, method: 'POST' }),
  put: <T>(url: string, data: any, config?: Partial<AxiosRequestConfig>) =>
    axiosRequest<T>({ ...config, url, data, method: 'PUT' }),
};

export { axiosInstance as axios, axiosRequest, request };
