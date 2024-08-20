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

const host = import.meta.env.VITE_APP_DOMAIN;

interface RequestConfig extends AxiosRequestConfig {
  notice?: boolean;
}

interface PendingType {
  url?: string;
  method?: Method;
  params: any;
  data: any;
  cancel: Function;
}

interface AxiosConfig extends AxiosRequestConfig {
  tokenKey?: string;
  token?: string | undefined;
  loginErrUrl?: string;
  loginErrFn?: Function | undefined;
  noNotificationCodes?: Array<string | number>;
  errUrlFn?: Function | undefined;
  formDataUrls?: Array<string>;
  returnAllData?: boolean;
}

// 登录失效
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const controller = new AbortController();

const pendingList: Array<PendingType> = [];

// 移除重复请求
const removePending = (config: RequestConfig) => {
  for (const key in pendingList) {
    const item: number = +key;
    const list: PendingType = pendingList[key];
    // 当前请求在数组中存在时执行函数体
    if (
      list.url === config.url &&
      list.method === config.method &&
      JSON.stringify(list.params) === JSON.stringify(config.params) &&
      JSON.stringify(list.data) === JSON.stringify(config.data)
    ) {
      // 执行取消操作
      list.cancel('操作太频繁，请稍后再试');
      // 从数组中移除记录
      pendingList.splice(item, 1);
    }
  }
};

// 默认配置
const initAxiosConfig = {
  tokenKey: 'token', // token取值字段
  token: undefined, // token 优先级高于 tokenKey
  loginErrUrl: undefined, // 登录失效跳转地址
  loginErrFn: undefined, // 登录失效执行函数，设置了的话，loginErrUrl失效
  noNotificationCodes: [], // 接口返回的code值，哪些不需要弹出提示
  errUrlFn: undefined, // 404处理方法
  formDataUrls: [], // 需要用formData提交的接口列表
  isAllData: false, // 是否返回所有信息
};

const axiosInstance = axios.create({
  baseURL: host,
  timeout: 10000,
});

const Request = (configParams: AxiosConfig) => {
  configParams = { ...initAxiosConfig, ...configParams };

  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      removePending(config);

      config.headers.Authorization =
        configParams.token ||
        localStorage.getItem(configParams.tokenKey as any);

      config.url = `${config.url}`;

      // 如果是formData上传类型
      // https://axios-http.com/zh/docs/multipart
      if (configParams.formDataUrls?.includes(config.url)) {
        config.headers['Content-Type'] = 'multipart/form-data;charset=UTF-8';
        config.headers.Accept = '*/*';
      }

      return {
        ...config,
        cancelToken: source.token,
        signal: controller.signal,
      };
    },
    (err: AxiosError) => {
      // notification.error({
      //   message: '提示',
      //   description: err.toString(),
      // });
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({ ...err, data: null });
    },
  );

  axiosInstance.interceptors.response.use(
    (res: AxiosResponse) => {
      const { status, data, config } = res;

      removePending(config);

      return new Promise<any>((resolve, reject) => {
        // 请求成功，但是不是200，即业务错误
        if (status < 200 || status > 300) {
          reject(data);
        } else if (!data.success) {
          if (
            data.errorCode === '401' ||
            data.errorCode === '401_1' ||
            data.errorCode === '401_0' ||
            data.errorCode === '003'
          ) {
            // 登录失效后，取消后续的http请求
            source.cancel('登录失效');
            // 不支持 message 参数
            controller.abort();

            // 登录失效后的处理
            if (configParams.loginErrFn) {
              configParams.loginErrFn();
            } else if (configParams.loginErrUrl) {
              window.location.href = configParams.loginErrUrl;
            }
          } else {
            if (!configParams.noNotificationCodes?.includes(data.errorCode)) {
              // message.error(data.errorDesc);
            }
          }
          reject(data);
        } else {
          //   返回axios的response的完全体
          if (configParams.returnAllData) {
            resolve(data);
          } else {
            resolve(data.data);
          }
        }
      });
    },
    (err: AxiosError) => {
      //  返回给view层去处理
      return Promise.reject(err);
    },
  );

  return axiosInstance;
};

export const request = Request({
  loginErrUrl: '/login',
  returnAllData: true,
});

export default Request;
