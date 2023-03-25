---
title: 你不知道的 SpringBoot 与 Vue 部署解决方案
---

### 前言

前段时间公司外网部署的演示环境全部转到内网环境中去，所有对外演示的环境都需要申请外网映射才能访问某个服务。我用一个外网地址 `www.a.com` 映射到一个内网地址 `http://ip:port`，然后在这个地址 `http://ip:port` 用 nginx 做代理转发到各个组的项目 `http://ipn:portn` 上去，其中也遇到一些静态资源 404，主要是是解决这个 404 问题。

最近又做了一个项目，考虑到用户的体验，减少部署的复杂性，我想了一个办法用 SpringBoot 做 web 服务器映射前端资源为 web 资源 。

<font color=red>条件允许或者对性能要求比较高，推荐是前后端分离部署，nginx 做 web 服务器，后端只提供接口服务</font>

以前部署的项目 A 外网访问地址是 `http://ip1:8080`，外网映射后只能访问 `http://ip/app1` ，以前项目 B 外网访问地址是 `http://ip1:8081` ，项目访问地址是 `http://ip/app2` 。这也算是一个不大不小的变动，但是切换之后遇到的第一个问题就是静态资源转发导致 `404`。

比如以前项目 A 访问地址是 `http://ip1:8080` 它是没有上下文的。

而现在 A 的访问地址为 `http://ip/app1` ,有一个上下文 app1 在这里，导致有一些资源 404。

比如说：原来 `http://ip1:8080` 请求到了 index.html 资源，现在只能 `http://ip/app1` 请求到 index.html。

```html
<!-- index.html -->
<!-- 原来部署环境写法 -->
<link href="/index.css" rel="stylesheet" />
```

以前访问 `index.css` 地址是 `http://ip1:8080/index.css` ，但是现在变成访问了 `http://ip/index.css` 导致 404，实际 index.css 地址为 `http://ip/app1/index.css`

前端使用 `vue` 编写，html 中的静态资源路径可以很好解决，修改 webpack 打包即可。

```html
<!-- 原来部署环境写法 -->
<link href="/index.css" rel="stylesheet" />

<!-- 写成相对路径 -->
<link href="./index.css" rel="stylesheet" />

<!-- 结合 webpack 打包时进行路径补充 -->
<link href="<%= BASE_URL %>index.css" rel="stylesheet" />
```

但是项目中有一些组件的请求没有办法统一处理，只能改代码。但我不想动代码，webpack 打包都不想动，基于这些需求想了一个办法来解决。

### 本文内容

-   Nginx 部署 vue 项目，怎么能友好处理静态资源的丢失
-   SpringBoot 提供 web 服务器的功能映射 vue 项目为 web 资源，并处理 vue 路由转发 index.html 问题。

[演示代码地址](https://github.com/zhangpanqin/vue-springboot)

```txt
https://github.com/zhangpanqin/vue-springboot
```

## Nginx 部署 Vue 项目

```nginx
server {
    listen 8087;
    # 它的作用是不重定向地址，比如浏览器输入 /app1 访问，也可以访问到 /app1/ ,而浏览器地址是不改变的 /app1 。没办法，强迫症
    location / {
        try_files $uri $uri/;
    }
    root /Users/zhangpanqin/staic/;
    location ~ /(.*)/ {
        index index.html /index.html;
        try_files $uri $uri/ /$1/index.html;
    }
}
```

`/Users/zhangpanqin/staic/` 放部署的项目，比如 app 的项目资源放到 `/Users/zhangpanqin/staic/app` 下。 访问地址为 `http://ip/8087/app`

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <!-- 也可以改成类似的地址  BASE_URL 等于 vue.config.js 配置的 publicPath-->
        <link rel="icon" href="<%= BASE_URL %>favicon.ico" />
        <!-- 部署之后，访问不到 index.css -->
        <link href="/index.css" rel="stylesheet" />
    </head>
</html>
```

为了可以在浏览器输入 vue 的路由 `/app/blog` 也可以访问页面，需要添加 `vue-router` 中的 base 属性。

```js
import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
    {
        path: "/",
        name: "Home",
        component: () => import("@/views/Home.vue"),
    },
    {
        path: "/blog",
        name: "Blog",
        component: () => import("@/views/Blog.vue"),
    },
    {
        // 匹配不到路由的时候跳转到这里
        path: "*",
        name: "Error404",
        component: () => import("@/views/Error404.vue"),
    },
];
const router = new VueRouter({
    // 主要是修改这里，可以根据 vue mode 环境来取值。
    // https://cli.vuejs.org/zh/guide/mode-and-env.html
    // https://router.vuejs.org/zh/api/#base
    base: process.env.VUE_APP_DEPLOY_PATH,
    mode: "history",
    routes,
});

export default router;
```

<img src="/blog/20200727234702.png?author=zhangpanqin" alt="image-20200727234702928" style="zoom: 25%;" />

`http://localhost:8087/app/index.css` 为 css 的真实地址。所以想办法为这些不以 `/app` 开头的资源加上 `/app` 就可以了，想了想只有 cookie 能做到。

`x_vue_path` 记录每个项目的路径，然后静态资源去这个路径下寻找，`$cookie_x_vue_path/$uri`

下面这个配置使用了 try_files 内部重定向资源，是不会在浏览器端发生重定向的。

```nginx
# gzip ，缓存 和 epoll 优化的都没写
server {
    listen 8087;
    # 它的作用是不重定向地址，比如浏览器输入 /app1 访问，也可以访问到 /app1/ ,而浏览器地址是不改变的 /app1 。没办法，强迫症
    location / {
        try_files $uri $uri/;
    }
    root /Users/zhangpanqin/staic/;

    # (.*) 匹配是哪个项目，比如说 app1 app2 等
    location ~ /(.*)/.*/ {
        index index.html /index.html;
        add_header Set-Cookie "x_vue_path=/$1;path=/;";
        # /Users/zhangpanqin/staic/+/$1/index.html 可以到每个项目下 index.html
        try_files $uri $uri/ /$1/index.html @404router;
    }
    # 查找静态资源，也可以在这里添加缓存。
    location ~ (.css|js)$ {
        try_files $uri $cookie_x_vue_path/$uri @404router;
    }
    location @404router {
        return 404;
    }
}
```

![image-20200728014849158](/blog/20200728014849.png?author=zhangpanqin)

下面这个是重定向的配置

```nginx
server {
    listen 8087;
    root /Users/zhangpanqin/staic/;

    location ~ /(.*)/.*/? {
        index index.html /index.html;
        add_header Set-Cookie "x_vue_path=/$1;path=/;";
        try_files $uri $uri/ /$1/index.html @404router;
    }
    location ~ (.css|js)$ {
        # 匹配到 /app/index.css 的资源，直接访问
        rewrite ^($cookie_x_vue_path)/.* $uri break;
        # 访问的资源 /index.css  302 临时重定向到 /app/index.css
        rewrite (.css|js)$ $cookie_x_vue_path$uri redirect;
    }
    location @404router {
        return 404;
    }
}
```

![image-20200728014654144](/blog/20200728014654.png?author=zhangpanqin)

根据这个思路就可以把所有的资源进行转发了，不用改业务代码，只需给 `vue-router` 加上一个 `base` 基础路由。

## SpringBoot 部署 Vue 项目

`Nginx` 走通了，SpringBoot 依葫芦画瓢就行了，还是 java 写的舒服，能 debug，哈哈。

### SpringBoot 映射静态资源

```java
@Configuration
public class VueWebConfig implements WebMvcConfigurer {
    /**
     * 映射的静态资源路径
     * file:./static/ 路径是相对于 user.dir 路径，jar 包同级目录下的 static
     */
    private static final String[] CLASSPATH_RESOURCE_LOCATIONS = {"file:./static/", "classpath:/META-INF/resources/",
            "classpath:/resources/", "classpath:/static/", "classpath:/public/"};

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 添加静态资源缓存
        CacheControl cacheControl = CacheControl.maxAge(5, TimeUnit.HOURS).cachePublic();
        registry.addResourceHandler("/**").addResourceLocations(CLASSPATH_RESOURCE_LOCATIONS).setCacheControl(cacheControl);
    }


    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 配置要拦截的资源,主要用于 添加 cookie
        registry.addInterceptor(new VueCookieInterceptor()).addPathPatterns("/test/**");
    }

    // vue 路由转发使用的，也做 接口请求找不到的
    @Bean
    public VueErrorController vueErrorController() {
        return new VueErrorController(new DefaultErrorAttributes());
    }
}
```

### 项目静态资源路径添加 cookie

```java
public class VueCookieInterceptor implements HandlerInterceptor {
    public static final String VUE_HTML_COOKIE_NAME = "x_vue_path";

    public static final String VUE_HTML_COOKIE_VALUE = "/test";

    /**
     * 配置请求资源路径 /test 下全部加上 cookie
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        final Cookie cookieByName = getCookieByName(request, VUE_HTML_COOKIE_NAME);
        if (Objects.isNull(cookieByName)) {
            final Cookie cookie = new Cookie(VUE_HTML_COOKIE_NAME, VUE_HTML_COOKIE_VALUE);
            // 项目下的 url 都带能带上
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            response.addCookie(cookie);
        }
        return true;
    }

    public static Cookie getCookieByName(HttpServletRequest httpServletRequest, String cookieName) {
        final Cookie[] cookies = httpServletRequest.getCookies();
        if (Objects.isNull(cookieName) || Objects.isNull(cookies)) {
            return null;
        }
        for (Cookie cookie : cookies) {
            final String name = cookie.getName();
            if (Objects.equals(cookieName, name)) {
                return cookie;
            }
        }
        return null;
    }
}
```

### 请求出现错误做资源的转发

访问错误的跳转要分清楚 接口请求和静态资源的请求，通过 accept 可以判断。

```java
@RequestMapping("/error")
public class VueErrorController extends AbstractErrorController {

    private static final String ONLINE_SAIL = VUE_HTML_COOKIE_NAME;

    private static final String ERROR_BEFORE_PATH = "javax.servlet.error.request_uri";

    public VueErrorController(DefaultErrorAttributes defaultErrorAttributes) {
        super(defaultErrorAttributes);
    }

    @Override
    public String getErrorPath() {
        return "/error";
    }

    @RequestMapping
    public ModelAndView errorHtml(HttpServletRequest httpServletRequest, HttpServletResponse response, @CookieValue(name = ONLINE_SAIL, required = false, defaultValue = "") String cookie) {
        final Object attribute = httpServletRequest.getAttribute(ERROR_BEFORE_PATH);
        if (cookie.length() > 0 && Objects.nonNull(attribute)) {
            response.setStatus(HttpStatus.OK.value());
            String requestURI = attribute.toString();
            // 访问的路径没有以 vue 部署的路径结尾，补充上路径转发去访问
            if (!requestURI.startsWith(cookie)) {
                ModelAndView modelAndView = new ModelAndView();
                modelAndView.setStatus(HttpStatus.OK);
                // 静态资源不想转发，重定向的话，修改为 redirect
                String viewName = "forward:" + cookie + requestURI;
                modelAndView.setViewName(viewName);
                return modelAndView;
            }
        }
        ModelAndView modelAndView = new ModelAndView();
        modelAndView.setStatus(HttpStatus.OK);
        modelAndView.setViewName("forward:/test/index.html");
        return modelAndView;
    }

    // 处理请求头为 accept 为 application/json 的请求，就是接口请求返回json 数据
    @RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> error(HttpServletRequest request) {
        HttpStatus status = getStatus(request);
        if (status == HttpStatus.NO_CONTENT) {
            return new ResponseEntity<>(status);
        }
        final Map<String, Object> errorAttributes = getErrorAttributes(request, true);
        return new ResponseEntity<>(errorAttributes, status);
    }

```

### 首页跳转

```java
@Controller
public class IndexController {
    @RequestMapping(value = {"/test", "/test"})
    public String index() {
        return "forward:/test/index.html";
    }
}
```
