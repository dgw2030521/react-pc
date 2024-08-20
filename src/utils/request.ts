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

import { Response } from '@/utils/Common';

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
  token?: string | undefined;
  loginErrUrl?: string;
  loginErrFn?: Function | undefined;
  noNotificationCodes?: Array<string | number>;
  errUrlFn?: Function | undefined;
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
  token: undefined, // token 优先级高于 tokenKey
  loginErrUrl: undefined, // 登录失效跳转地址
  loginErrFn: undefined, // 登录失效执行函数，设置了的话，loginErrUrl失效
  noNotificationCodes: [], // 接口返回的code值，哪些不需要弹出提示
  errUrlFn: undefined, // 404处理方法

  isAllData: false, // 是否返回所有信息
};

const axiosInstance = axios.create({
  baseURL: host,
  timeout: 10000,
  withCredentials: false,
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

const configParams = {
  ...initAxiosConfig,
  ...{
    loginErrUrl: '/login',
    returnAllData: true,
  },
} as AxiosConfig;

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    removePending(config);

    config.headers.Authorization =
      configParams.token || localStorage.getItem(token_name);

    return {
      ...config,
      cancelToken: source.token,
      signal: controller.signal,
    };
  },
  (err: AxiosError) => {
    return Promise.reject(err);
  },
);

/**
 * 实例的请求处理
 */
axiosInstance.interceptors.response.use(
  async response => {
    if (
      response.data instanceof Blob &&
      response.data.type?.includes('application/json')
    ) {
      const text = await response.data?.text();
      const json = JSON.parse(text);
      return {
        ...response,
        data: json,
      };
    }
    return response;
  },
  err => {
    return Promise.reject(err);
  },
);

class RPC {
  static async axiosRequest<T>(req: AxiosRequestConfig) {
    const resp = await axiosInstance.request(req);
    const { status, config } = resp;
    removePending(config);

    const result = resp.data as Response<T>;

    if (status < 200 || status > 300) {
      throw result;
    }

    // 下载
    if (result instanceof Blob) {
      return download(resp);
    }
    // 普通返回
    if (!result.success) {
      if (
        result.errorCode === '401' ||
        result.errorCode === '401_1' ||
        result.errorCode === '401_0' ||
        result.errorCode === '003'
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
        if (!configParams.noNotificationCodes?.includes(result.errorCode)) {
          // message.error(data.errorDesc);
        }
      }
      throw result;
    } else {
      //   返回axios的response的完全体
      if (configParams.returnAllData) {
        return result;
      }
      return result.data;
    }
  }
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

  return RPC.axiosRequest<T>(req);
}

export { axiosInstance, rpcRequest };
