---
title: http 缓存
---

## Http Cache 有什么好处？

-   减轻服务器压力，节省带宽和流量

-   浏览器能提高首屏渲染的速度，提升用户体验。

### 浏览器缓存

-   `memory cache`:它是将资源文件缓存到内存中，缓存有效直接从内存加载。

-   `disk cache`: 它是将资源文件缓存到硬盘中，缓存有效直接从硬盘中加载。

先从 `memory cache` 找，找不到从 `disk cache` 找，再找不到，请求网络资源。

## 缓存分类

-   `协商缓存`
-   `强缓存`

`协商缓存` 每次都要去服务器询问缓存是否过期，没有过期使用本地的缓存。

::: tip

协商缓存每次会发送请求去服务器校验缓存，但是当缓存没有过期，服务端只返回响应头（304），而没有响应体的。

缓存过期了，会返回 200，也就是正常响应。

:::

`强缓存` 会有缓存过期时间，在有效期内不会去服务端校验缓存，直接使用本地缓存。

::: tip

强缓存也就是浏览器不会发送 http 请求，去请求资源。

:::

`webpack` 可以根据文件内容的 `hash` 生产类似 `app.asdfa21342.js` 这样的文件。

其实就是想使用强缓存，当网站更新，新的页面会解析加载不一样的资源，从而降低缓存校验对服务器性能的损耗。

### 协商缓存

协商缓存有以下两种分类：

-   `ETag/if-None-Match`
-   `Last-Modified/if-Modify-Since`

http 协议规定，当这两种响应头都存在的时候，必须都要满足，才能使用缓存。

浏览器第一次访问一个资源的时候，响应头 `Last-Modified` 返回，标识文件的最后修改时间。

当浏览器再次正常访问（不强制刷新资源）相同资源，请求头会加上 `If-Modified-Since`，该值为之前资源响应返回的 `Last-Modified` ；服务端将请求头 `If-Modified-Since` 和资源的最后修改时间(`Last-Modified`)进行比较，值相同则命中缓存，返回 304，否则返回资源，状态码为 200，并更新缓存时间。

`ETag` 为缓存的 hash 值（服务端返回），请求的时候 `if-None-Match` 的值是它，然后服务端比较有没有变化，没变化，返回 304，变化了就返回 200。

### 强制缓存

#### Expires

`Expires` 是 `http1.0` 的规范，它的值是一个绝对时间的 GMT 格式的时间字符串。这个时间代表的该资源的失效时间，如果在该时间之前请求的话，则都是从缓存里面读取的。如果服务端和客户端时区不一致会导致判断不准确。

#### Cache-Control（推荐）

`Cache-Control` 是 `http1.1` 的规范，它是利用该字段 `max-age` 值进行判断的。该值是一个相对时间，比如 `Cache-Control: max-age=3600` 代表该资源的有效期是 3600 秒。除了该字段外，我们还有如下字段可以设置：

**no-cache:** 需要进行协商缓存，发送请求到服务器确认是否使用缓存。

**no-store：**禁止使用缓存，每一次都要重新请求数据。

**public：**可以被所有的用户缓存，包括终端用户和 CDN 等中间代理服务器。

**private：**只能被终端用户的浏览器缓存，不允许 CDN 等中继缓存服务器对其缓存。

## 推荐实践

Index.html 可以使用协商缓存，别的静态资源，css,js 等图片可以使用强缓存。现在的工具会给这些路径加上 hash 值。

-   Html 页面

```yaml
Cache-Control: max-age=0, private, must-revalidate
Etag:
Content-Encoding: gzip
Last-Modified:
Vary: Accept-Encoding
```

-   Css,js,img

```shell
Cache-Control: public, max-age=31536000
Etag:
Content-Encoding: gzip
Last-Modified:
Vary: Accept-Encoding
```
