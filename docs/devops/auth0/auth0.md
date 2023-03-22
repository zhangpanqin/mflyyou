# auth0

## 我的 auth0 信息

- homepage url：[https://dev-pgd4nrcr.us.auth0.com](https://dev-pgd4nrcr.us.auth0.com)

如果你有很多个系统，每个系统都有自己的用户，而你又想统一用户来源和权限管理。name auth0 可以帮到你。

比如说我们想要 github 的某个 org 下的所有用户都可以登录你们公司的 auth0。并且别的系统也用 github 的用户来做登录管理和权限管理。

auth0 是你和某个系统集成用的 application，然后添加 authentication 比如 github，数据库等等。这样你的 github 就可以登录你的系统了。 

比如你购买了一个 styra saas 服务。styra 也提供了 sso 服务。你可以在 auth0 新建一个 application 和你的 styra 集成 sso。然后登录用户，可以在 

authentication 建一个 socail github，这样你就可以用 github 登录的应用。



为了方便我们用 terraform 去管理 auth0 资源的创建。

- 在 auth0 上创建一个 machine-to-machine application, 然后记录它的 client id 和 client secret
- 然后我们用这个 id 和 secret 用 terraform 创建资源。



比如再创建 一个 application 和 authentication（github），可以使用 github 登录我们的 styra。 

