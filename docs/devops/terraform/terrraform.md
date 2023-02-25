### Terraform login

创建了 `.envrc` 文件，其中定义了项目token 从哪里去

```text
export TF_CLI_CONFIG_FILE="$HOME/.terraformrc-mflyyou"
```

在 `$HOME/.terraformrc-mflyyou` 写入 terraform token 信息

```text
credentials "app.terraform.io" {
token = ""
}
```

### Debug terraform

```shell
cd ./debug
terraform init
# 进入控制台查看变量，控制台 exit 退出
terraform console -var-file sandbox.auto.tfvars.json
# *.auto.tfvars.json 会自动识别
terraform console
```

### 查看执行日志

```shell
export TF_LOG=1
```

### Terraform Token 设置

```shell
# 保存登录凭证到 ${HOME}/.terraform.d/credentials.tfrc.json，这个是全局配置
terraform login

# 推荐配置，也是全局，配置了 `export TF_CLI_CONFIG_FILE=.terraformrc` 就不会找全局的 `${HOME}/.terraformrc`
${HOME}/.terraformrc


mkdir -p $HOME/.terraform.d/plugin-cache && cat ${HOME}/.terraformrc <<EOF
# This directory must already exist before Terraform will cache plugins; Terraform will not create the directory itself.
plugin_cache_dir = "$HOME/.terraform.d/plugin-cache"
# 配置 terraform token
credentials "app.terraform.io" {
token = ""
}
<<EOF
```
