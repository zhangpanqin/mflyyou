# auth0

## 我的 auth0 信息

- homepage url：[https://dev-pgd4nrcr.us.auth0.com](https://dev-pgd4nrcr.us.auth0.com)

如果你有很多个系统，每个系统都有自己的用户，而你又想统一用户来源和权限管理。name auth0 可以帮到你。

比如说我们想要 github 的某个 org 下的所有用户都可以登录你们公司的 auth0。并且别的系统也用 github 的用户来做登录管理和权限管理。



### 关联 Github 和公司的 auth0

- 在 github 的组织下创建 OAuth app 用于登录 auth0
  - Go to github organizations 下的  `Settings`
  -  Go to `Developer settings` > `OAuth Apps` ，点击 new OAuth app
  - 参考 [GitHub Integration with Auth0](https://marketplace.auth0.com/integrations/github-social-connection) 填写 Application name，Homepage URL，Authorization callback URL
- 在 auth0 上创建一个 machine-to-machine application, 然后用 terraform 去管理 auth0 的资源
