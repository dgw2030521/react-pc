// 取消重复请求
/*  假如用户重复点击按钮，先后提交了 A 和 B 这两个完全相同（考虑请求路径、方法、参数）的请求，我们可以从以下几种拦截方案中选择其一：
 1. 取消 A 请求，只发出 B 请求（会导致A请求已经发出去,被后端处理了）
 2. 取消 B 请求，只发出 A 请求
 3. 取消 B 请求，只发出 A 请求，把收到的 A 请求的返回结果也作为 B 请求的返回结果
 第3种方案需要做监听处理增加了复杂性，结合我们实际的业务需求，最后采用了第2种方案来实现，即：
 只发第一个请求。在 A 请求还处于 pending 状态时，后发的所有与 A 重复的请求都取消，实际只发出 A 请求，直到 A 请求结束（成功/失败）才停止对这个请求的拦截。
*/

import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import qs from 'qs';

// 白名单，不拦截重复请求的url
const cacheWhiteList = [];
// Map对象保存键值对。任何值(对象或者原始值) 都可以作为一个键或一个值
const pendingRequest = new Map<string, any>();

/**
 * 用于根据当前请求的信息，生成请求 Key；
 * @param config
 */
function generateReqKey(config: InternalAxiosRequestConfig) {
  const { method, url, params, data } = config;
  return `${method}::${[url, qs.stringify(params), qs.stringify(data)].join(
    '&',
  )}`;
}

/**
 * 用于把当前请求信息添加到pendingRequest对象中；
 * @param config
 */
function addPendingRequest(config: InternalAxiosRequestConfig) {
  const requestKey = generateReqKey(config);
  config.cancelToken =
    config.cancelToken ||
    new axios.CancelToken(cancel => {
      if (
        !pendingRequest.has(requestKey) &&
        cacheWhiteList.indexOf(config.url) === -1
      ) {
        pendingRequest.set(requestKey, cancel);
      }
    });
}

/**
 * 检查是否存在重复请求，若存在则取消已发的请求。
 * @param config
 */
function removePendingRequest(config: InternalAxiosRequestConfig) {
  const requestKey = generateReqKey(config);
  if (pendingRequest.has(requestKey)) {
    const cancelToken = pendingRequest.get(requestKey);
    cancelToken(requestKey);
    pendingRequest.delete(requestKey);
  }
}

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

// 请求队列，缓存发出的请求
const cacheRequest = {};
/**
 * @desc 删除缓存队列中的请求
 * @param {String} config 本次请求的唯一标识 url&method
 */
function removeCacheRequest(config: InternalAxiosRequestConfig) {
  const { url, method } = config;
  const reqKey = `${url}&${method}`;
  if (cacheRequest[reqKey]) {
    // 通过AbortController实例上的abort来进行请求的取消
    cacheRequest[reqKey].abort();
    delete cacheRequest[reqKey];
  }
}
/**
 * 用于把当前请求信息添加到pendingRequest对象中；
 * @param config
 */
function addCacheRequest(config: InternalAxiosRequestConfig) {
  const { url, method } = config;
  // 请求地址和请求方式组成唯一标识，将这个标识作为取消函数的key，保存到请求队列中
  const reqKey = `${url}&${method}`;
  removeCacheRequest(config);
  // 将请求加入请求队列，通过AbortController来进行手动取消
  const controller = new AbortController();
  config.signal = controller.signal;
  cacheRequest[reqKey] = controller;
}

export {
  addCacheRequest,
  addPendingRequest,
  download,
  removeCacheRequest,
  removePendingRequest,
};
