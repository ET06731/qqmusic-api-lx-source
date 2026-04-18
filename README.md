# QQMusicApi

[![NPM](https://img.shields.io/npm/v/qq-music-api.svg)](https://www.npmjs.com/package/qq-music-api)
[![github](https://img.shields.io/badge/github-QQMusicApi-brightgreen.svg)](https://github.com/jsososo/QQMusicApi)
[![GitHub Pages Star](https://img.shields.io/github/stars/jsososo/QQMusicApi.svg)](https://github.com/jsososo/QQMusicApi)


接口参考：

[接口文档 Github](https://jsososo.github.io/QQMusicApi/#/)

[接口文档 Vercel](https://qq-api-soso.vercel.app/)


## 快速上手

### LX Music / Vercel 部署说明

此 fork 针对 LX Music 自定义源做了两处部署适配：

- 增加 `api/index.js` 与 `vercel.json`，可直接作为 Vercel Serverless 项目部署。
- `/song/url?ownCookie=1` 会优先使用请求 Cookie 里的 `uin`、`qqmusic_key` 或 `qm_keyst`，方便上游桥接服务通过 `QQ_COOKIE` 环境变量取链。
- `/song/url?debug=1` 在取链失败时返回上游 `midurlinfo` 等诊断字段，便于区分 Cookie、版权和部署出口网络问题。

部署后可将 Vercel 地址配置为 LX 桥接服务的 `QQ_API_BASE`。

### Node 服务

```shell script
git clone git@github.com:jsososo/QQMusicApi.git

yarn

yarn start
```

### Docker

```shell script
yarn build:docker

yarn start:docker
```


### npm

```shell script
yarn add qq-music-api
```

#### 接口调用

```javascript
const qqMusic = require('qq-music-api');

// 部分接口依赖 cookie, 这里穿参可以使用字符串或对象
qqMusic.setCookie('xxx=xxx; xxx=xxx;');
// or
qqMusic.setCookie({ a: 'xxx', b: 'xxx' });

qqMusic.api('search', { key: '周杰伦' })
    .then(res => console.log(res))
    .catch(err => console.log('接口调用出错'))

qqMusic.api('search', { key: '周杰伦' })
    .then((res) => console.log('搜索周杰伦：', res))
    .catch(err => console.log('接口调用出错'))

qqMusic.api('search/hot')
    .then((res) => console.log('热搜词：', res))
    .catch(err => console.log('接口调用出错'))//

// 刷新登陆
qqMusic.api('user/refresh')
```

#### 获取当前cookie

```javascript
const qqMusic = require('qq-music-api');

console.log(qqMusic.cookie);
```

#### 获取当前 cookie 用户
```javascript
const qqMusic = require('qq-music-api');

console.log(qqMusic.uin);
```


