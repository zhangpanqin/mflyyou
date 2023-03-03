---
title: 再也不用为跨域而苦恼
---

## 前言

最近没时间写博客，只好把以前写的博客整理到自己的博客网站上去

## 跨域

跨域解决的方案有好几种，熟练掌握 `CORS` 就行了，并晓得一些原理。

jsonp 基本告别了，了解即可。

将前端的域与后端保持一致就行了，通过 nginx 代理转发。

### 什么情况下会跨域呢？

跨域是指从一个源去请求另一个源的资源，浏览器基于完全考虑并遵循同源策略，禁止跨域访问。

但是我们可以通过一些手段 `JSONP` 或者 `CORS`来实现跨域。

<font color=red>跨域只会发生在浏览器中，后端服务之间的接口调用是没有跨域一说的。</font>

简单理解：当 url 中的协议/域名/端口不同时，就产生了跨域。

![](http://oss.mflyyou.cn/blog/20200606200050.png?author=zhangpanqin)

### 跨域的解决方案？

-   nginx 反向代理，将请求的接口全部转发就行了
-   jsonp
-   cors

#### nginx 反向代理解决跨域

```txt
location /api {
    proxy_pass  http://192.168.202.50:8082/;
}

匹配 url 中以 /api 开头的路径
http://192.168.202.50:8081/api -->  http://192.168.202.50:8082
http://192.168.202.50:8081/api/users/2 --> http://192.168.202.50:8082/users/2
```

来自 8081 的页面请求了 /api/users/2 代理接口，nginx 经过路径匹配，找到对应的 location 处理，将其转发到实际接口 /8082/users/2，从而规避跨域。

#### jsonp 解决跨域

jsonp 解决跨域了跨域，但是也有自己的缺陷，服务端需要对跨域和非跨域做不同的处理。

```js
$.ajax({
    url:'http:192.168.202.50:8082/users/2'
    type:'get',
    dataType:'jsonp',
    success(data){},
    error(error){}
});
```

> 在发送请求的时候，浏览器会多携带一个 callback 参数

```java
// 服务端使用 SpringBoot 处理
@GetMapping(value = "/users/2")
public String domainAjaxJsonpNoCookie(HttpServletRequest request){
    HashMap<Object, Object> ret = new HashMap<>(16);
    ret.put("key1","ajax-jsonp-no-cookie");
    ret.put("key2", Math.random());

    String callback = request.getParameter("callback");

    String retString= JSON.toJSONString(ret);

    // 跨域处理，当不是跨域的时候，这样处理ajax 会拿不到正确的数据
    retString=callback+"("+retString+")";
    return retString;
}
```

### CORS

cors 解决跨域，只需要服务端配合就行，现在浏览器基本都支持 cors，ie 你需要测试。浏览器会自动判断是否跨域，添加 origin 请求头。

服务端只需要添加响应头 Access-Control-Allow-Origin:\* (这样 cookie 不能携带)

Access-Control-Allow-Origin:http://192.168.202.8080 (只有指定具体的地址才可以携带 cookie)。

<font color=red>敏感的验证信息不推荐放入到 cookie，请求头中有一个 Authorization ,可以用这个放入验证信息。cookie 容易被 xss (跨站脚本攻击)  和 csrf (跨站请求伪造)。为了安全也不要允许 cookie 可以被前端操作，设置 httponly true</font>

CORS 实际就是设置响应头。

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: FooBar
Access-Control-Request-Method:*
Access-Control-Request-Headers:
Access-Control-Allow-Headers
Access-Control-Max-Age:
```

#### Origin

发生跨域的时候，`Origin` 指定当前的地址，浏览器自动添加。

#### Access-Control-Allow-Origin

设置允许哪些地址跨域，`Access-Control-Allow-Origin:*` 标识所有的地址都允许跨域，但是这种配置后端不允许跨域请求携带 cookie。

设置具体的地址 `Access-Control-Allow-Origin:https://juejin.im`，允许 `https://juejin.im` 跨域，后端可以允许跨域请求携 cookie。

当出现跨域需要处理 `cookie` 的时候，需要前端和后端配合，需要设置跨域请求携带 `cookie`，

```js
// 前端 axios http 库设置 withCredentials 为 true 标识跨域的时候，携带 cookie,默认是 false
axios.get('/aaa',{withCredentials: true});

// 后端需要设置响应头
Access-Control-Allow-Credentials:true
```

#### Access-Control-Allow-Credentials

设置跨域请求是否携带 `cookie`。为了安全，针对具体的 domain 设置。

#### Access-Control-Expose-Headers

跨域访问时，这些请求头 Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma 通过 js 可以拿到，如果 js 要操作其它响应头头，则需要服务器设置本响应头 Access-Control-Expose-Headers。

比如你自定义的响应头（mflyyou），尽管你可以在 google 的开发工具 network 下看到响应头，但是你的 js 是无法获取到这个响应头的，需要在后端配置 `Access-Control-Expose-Headers:mflyyou,mflyyou1`，mflyyou 和 mflyyou1 都可以通过 js 拿到。

#### Access-Control-Request-Method

设置跨域请求允许的请求方式 `POST,PUT,GET,DELETE,OPTIONS`

#### Access-Control-Max-Age

设置预检请求的有效期，有效期内不会发生预检请求（见下文），单位秒。

#### Access-Control-Request-Headers

`Access-Control-Request-Headers:header1,header2` 在预检请求中，告诉服务端，header1,header2 等请求头哪些是正式请求可以携带。

服务端响应预检请求的时候，需要设置 `Access-Control-Allow-Headers` 告诉浏览器正式请求的时候可以携带哪些请求头。

#### Access-Control-Allow-Headers

`Access-Control-Allow-Headers` 首部字段用于预检请求的响应。其指明了实际请求中允许携带的首部字段。

后端如果使用 `SpringBoot` 可以看下 `CorsFilter` 源码即可理解。

![image-20200607105838792](http://oss.mflyyou.cn/blog/20200607105838.png?author=zhangpanqin)

#### 简单请求

若请求满足所有下述条件，则该请求可视为“简单请求”：

-   使用下列方法之一：
    -   `GET`
    -   `HEAD`
    -   `POST`
-   `Content-Type`的值仅限于下列三者之一：

    -   `text/plain`
    -   `multipart/form-data`
    -   `application/x-www-form-urlencoded`

-   非自定义请求头

    <font color=red>http 协议中定义的请求头也有一部分满足简单请求。但是自定义请求头一定不是简单请求。</font>

简单请求和非简单请求的区别：非简单请求会正式请求之前，使用请求方式 `OPTIONS` 发送一次预检请求，检验本次请求是否合法，合法即可发送请求。

#### SpringBoot 使用注解 @CrossOrigin

```java
// 注解可以添加到类上或者方法上
@CrossOrigin(value = "http://192.168.202.50:8080",allowCredentials="true")
@GetMapping(value = "/domain/cors/cookie")
public Map domainCorsCookie(HttpServletRequest request, HttpServletResponse response){
    Cookie[] cookies = request.getCookies();
    HashMap<Object, Object> ret = new HashMap<>(16);
    if(cookies!=null){
        for (Cookie cookie1 : cookies) {
            if (Objects.equals("corsCookie",cookie1.getName())) {
                ret.put(cookie1.getName(),cookie1.getValue());
            }
        }
    }
    return ret;
}
```

#### CorsFilter 过滤器

```java
@Configuration
public class MyCorsConfig {
    @Autowired
    private AppProperties appProperties;
    /**
     * 配置 cors 过滤器
     */
    private CorsConfigurationSource getMyCorsConfigurationSource(String path){
        CorsConfiguration config = new CorsConfiguration();
        // 设置跨域允许携带 cookie
        config.setAllowCredentials(true);
        // 配置允许那些网址跨域
        config.setAllowedOrigins(appProperties.getAllowIp());
        // 配置多长时间不用跨域预检请求
        config.setMaxAge(1800L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(path, config);
        return source;
    }

    @Bean
    public FilterRegistrationBean  registrationCorsFilterBean(){
        FilterRegistrationBean filterRegistrationBean =new FilterRegistrationBean();
        // 所有的请求都允许跨域
        CorsConfigurationSource myCorsConfigurationSource = getMyCorsConfigurationSource("/**");
        CorsFilter corsFilter = new CorsFilter(myCorsConfigurationSource);
        filterRegistrationBean.setFilter(corsFilter);
        return filterRegistrationBean;
    }
}

@Configuration
@ConfigurationProperties(prefix = "app.cors")
@Data
public class AppProperties {
    private List<String> allowIp;
}
```

### 遇到的坑

#### 跨域的时候 cookie 服务端获取不到 cookie

这个需要客户端和服务端同时配合，服务端才能拿到 cookie

```js
$.ajax({
    url:'http:192.168.202.50:8082/users/2'
    type:'get',
    dataType:'jsonp',

    // 告诉浏览器要携带 cookie
    xhrFields: {
        withCredentials: true
    },
    success(data){},
    error(error){}
});
```

```java
// Access-Control-Allow-Origin:http://192.168.202.8080,
// 这个属性需要设置对应的地址，设置 * 不行
// allowCredentials  服务端配置允许携带 cookie
@CrossOrigin(value = "http://192.168.202.50:8080",allowCredentials="true")
```

```java
// 配置过滤器属性，Access-Control-Allow-Origin 和 allowCredentials
 private CorsConfigurationSource getMyCorsConfigurationSource(String path){
        CorsConfiguration config = new CorsConfiguration();
        // 设置跨域允许携带 cookie
        config.setAllowCredentials(true);
        // 配置允许那些 网址跨域
        config.setAllowedOrigins(appProperties.getAllowIp());
        // 配置多长时间不用跨域预检请求
        config.setMaxAge(1800L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(path, config);
        return source;
    }
```

#### cookie Path 设置错误

![](http://oss.mflyyou.cn/blog/20200606200102.png?author=zhangpanqin)

> 上图只能看到当前页面可以访问的 cookie

> 查看域名下所有的 cookie

![](http://oss.mflyyou.cn/blog/20200606200112.png?author=zhangpanqin)

> 进入下级页面即可看到 cookie 选项

> 可以查看某个域名下的全部 cookie
> ![](http://oss.mflyyou.cn/blog/20200606200124.png?author=zhangpanqin)

```java
        Cookie retCookie=new Cookie("serverCookie",String.valueOf(Math.random()));
        retCookie.setMaxAge(10000000);
        retCookie.setHttpOnly(true);
        // 跨域设置 cookie 必须设置 path
//        retCookie.setPath("/");
        response.addCookie(retCookie);
```

> 当你没有设置 Path 的时候，默认设置请求接口路径。

比如说，你登陆接口（/login）返回 cookie（name=login）,cookie 没有设置 path,会自动给你设置 /login。而当你请求/users/2 的接口的时候，是不会携带 cookie(name=login)。
