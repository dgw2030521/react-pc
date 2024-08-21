/**
 * 请求库axios封装 https://axios-http.com/zh/docs/req_config
 * 1、普通表单提交 application/x-www-form-urlencoded https://axios-http.com/zh/docs/urlencoded
 * 2、文件上传 formData https://axios-http.com/zh/docs/multipart
 * 3、json提交 application/json
 * 4、下载文件 stream
 */

import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from 'axios';
import axios from 'axios';

import { Response } from '@/types/Common';

const token_name = 'token';

const host = import.meta.env.VITE_APP_DOMAIN;

/**
 * 下载文件功能
 * @param response
 */
const download = (response: AxiosResponse) => {
  const { data, headers } = response;
  const fileName = headers['content-disposition'].replace(
    /\w+;filename=(.*)/,
    '$1',
  ) as string;

  // 此处当返回json文件时需要先对data进行JSON.stringify处理，其他类型文件不用做处理
  // const blob = new Blob([JSON.stringify(data)], ...)
  const blob = new Blob([data], { type: headers['content-type'] });
  const dom = document.createElement('a');
  const url = window.URL.createObjectURL(blob);
  dom.href = url;
  dom.download = decodeURI(fileName);
  dom.style.display = 'none';
  document.body.appendChild(dom);
  dom.click();
  dom.parentNode.removeChild(dom);
  window.URL.revokeObjectURL(url);
};

interface PendingType {
  url?: string;
  method?: Method | string;
  params: any;
  data: any;
  cancel: Function;
}
// 取消重复请求
const pending: Array<PendingType> = [];

// 登录失效
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
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
    if (reqConfig.data instanceof FormData) {
      reqConfig.headers['Content-Type'] = 'multipart/form-data;charset=utf-8';
    }
    const token = localStorage.getItem(token_name);
    if (token) reqConfig.headers.Authorization = token;

    return {
      ...reqConfig,
      cancelToken: source.token,
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
    // if (
    //   response.data instanceof Blob &&
    //   response.data.type?.includes('application/json')
    // ) {
    //   const text = await response.data?.text();
    //   const json = JSON.parse(text);
    //   return {
    //     ...response,
    //     data: json,
    //   };
    // }
    // return response;

    if (response.status === 200) {
      return Promise.resolve(response);
    }
    return Promise.reject(response);
  },
  error => {
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
          break;

        // 403 token过期
        // 登录过期对用户进行提示
        // 清除本地token和清空vuex中token对象
        // 跳转登录页面
        case 403:
          console.error('登录过期，请重新登录');
          // 清除token
          localStorage.removeItem('token');
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

async function axiosRequest<T>(req: AxiosRequestConfig) {
  return new Promise<T>((resolve, reject) => {
    axiosInstance
      .request<Response<T>>(req)
      .then(resp => {
        const { status } = resp;

        console.log('###status', status);
        const result = resp.data;
        // 下载
        if (result instanceof Blob) {
          return download(resp);
        }
        // 普通返回
        if (!result.success) {
          if (result.errorCode.indexOf('401') > -1) {
            // 登录失效后，取消后续的http请求
            source.cancel('登录失效');
            // 不支持 message 参数
            controller.abort();

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

function rpcRequest<T>(props: Partial<AxiosRequestConfig>) {
  const req: AxiosRequestConfig = {
    // `paramsSerializer` 是一个负责 `params` 序列化的函数
    // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
    // paramsSerializer(params) {
    //   return Qs.stringify(params, { arrayFormat: 'brackets' });
    // },
    ...props,
    method: props.method || 'GET',
  };

  if (props.data) {
    const { data } = props;
    // 文件上传
    if (
      req.headers?.['Content-Type'] === 'multipart/form-data' ||
      data instanceof FormData
    ) {
      req.data = data;
    } else if (req.method.toUpperCase() === 'GET') {
      req.params = data;
    } else {
      // 转成string
      req.data = JSON.stringify(data);
    }
  }

  return axiosRequest<T>(req);
}

const request = {
  get: <T>(url: string, config?: Partial<AxiosRequestConfig>) =>
    rpcRequest<T>({ ...config, url, method: 'GET' }),
  post: <T>(url: string, data: any, config?: Partial<AxiosRequestConfig>) =>
    rpcRequest<T>({ ...config, url, data, method: 'POST' }),
  put: <T>(url: string, data: any, config?: Partial<AxiosRequestConfig>) =>
    rpcRequest<T>({ ...config, url, data, method: 'PUT' }),
};

export { axiosInstance as axios, request, rpcRequest };
