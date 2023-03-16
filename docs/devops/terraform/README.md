# Terraform



## Login & Token

我们本地运行 terraform 命令的时候，但是 terraform state 保存在 terraform cloud 上。这就需要我们配置 token 让我们本地的可以访问 terraform cloud 。

### terraform login

```shell
# 保存登录凭证到 ${HOME}/.terraform.d/credentials.tfrc.json，这个是全局配置
terraform login

# 推荐配置，也是全局，配置了 `export TF_CLI_CONFIG_FILE=.terraformrc` 就不会找全局的 `${HOME}/.terraformrc`
${HOME}/.terraformrc
```

### .terraformrc

我们也可以将 token 保存在 .terraformrc 中，terraform 默认会找当前 Home 下的 .terraformrc 文件，既 `${HOME}/.terraformrc`



```
credentials "app.terraform.io" {
token = ""
}
```



如果有多个 terraform 项目来自不同的 org，我们可以通过配置 `TF_CLI_CONFIG_FILE` ,让不同的项目读取不同的 token。

创建了 `.envrc` 文件，其中定义了 terraform 项目 token 从哪里去

```text
export TF_CLI_CONFIG_FILE="$HOME/.terraformrc-mflyyou"
```

在 `$HOME/.terraformrc-mflyyou` 写入 terraform token 信息

```text
credentials "app.terraform.io" {
token = ""
}
```



## Terraform state

terraform 会存储我们创建的资源和配置的状态，以便于 Terraform 来确定要对哪些资源进行了更改。

这些元数据信息默认会保存在 本地的 `terraform.tfstate` 中，不过我们也可以将 state 保存在 terraform cloud 上或者别的第三方存储服务上，比如说 s3。

tfstate 状态文件的内容格式是 JSON。

### local state

```terraform
terraform {
  required_version = ">= 1.1.7"

  backend "local" {
    path = "relative/terraform.tfstate"
  }
}
```

::: tip

我们不会使用 loca state 进行项目开发，一般我们本地 spike 或者研究性可以。

:::



### command

```shell
# 从 state 文件中移除这个 resource，不会销毁 infra.
tf state rm docker_container.web
# 从远程拉取 statue 保存到本地的 terraform.tfstate
tf state pull > terraform.tfstate
```







### terraform import

`terraform import` 用于导入已经创建好的基础设施，让 terraform 来管理。

例如，我已经创建了一个 docker container 在本地，我想让这个 container 的让 terraform 管理。

我就可以将其导入 terraform 中去。

::: tip

terraform import 直接操作的就是 state，如果是 remote 模式，直接就改变了线上 state。

最好在本地实验好之后，在在远程 state 操作。

:::

- 创建一个 container

  ```shell
  docker run --name hashicorp-learn --detach --publish 8080:80 nginx:latest
  
  # 查看 container 运行
  docker ps --filter="name=hashicorp-learn"
  ```

- 拉取远程 state 到本地，我们直接操作这个本地 state，防止修改了线上

  ```shell
  tf state pull > terraform.tfstate
  ```

- 修改 terraform backend 为 local

  ```terraform
  terraform {
    #   cloud {
    #     organization = "mflyyou"
    #     workspaces {
    #       name = "learn-terraform-import"
    #     }
    #   }
  
    backend "local" {
      path = "terraform.tfstate"
    }
   }
  ```

- 先创建少对应的 resource 不用加配置

  ```terraform
  provider "docker" {
    # 兼容 colima
    host = "unix:///Users/panqinzhang/.colima/docker.sock"
  }
  resource "docker_container" "web" {}
  ```

- 导入 state 到本地的 terraform.tfstate 文件

  ```shell
  terraform import -state=terraform.tfstate docker_container.web $(docker inspect --format="{{.ID}}" hashicorp-learn)
  ```

- tf plan 查看执行计划

  ```shell
  tfp -state=terraform.tfstate
  ```

- 修改 resource 配置到 tf plan 在期望的变更内

- 然后切换 remote 模式，用 tf import 把 state 同步到远程去。

- 然后 tf plan 查看执行计划，然后在预期内，tf apply





## Terraform demo code

### shell_script

[Terraform shell_script provider](https://registry.terraform.io/providers/scottwinkler/shell/latest/docs/resources/shell_script_resource)

[fly-devops/terraform/shell-script](https://github.com/zhangpanqin/fly-devops/tree/master/terraform/shell-script)

根据传入的 bound_styra_systems 去查询对应的 system_id，然后根据 id 拿到对应的 dir，去创建这个 dir。

bound_styra_systems 取值可以是 a，b，c 中的任意组合。



## Debug terraform

### 查看执行日志

```shell
export TF_LOG=1
```



### 查看执行代码输出

```shell
cd ./debug

terraform init
# 进入控制台查看变量，控制台 exit 退出

terraform console -var-file sandbox.auto.tfvars.json
# *.auto.tfvars.json 会自动识别
terraform console
```



有的时候我们写的 terraform 逻辑比较复杂，想调试的时候，可以使用 `terraform console` 来读取计算之后的变量值。