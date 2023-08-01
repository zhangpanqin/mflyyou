# Git Hook

希望在提交代码，推送代码，推送 tag 之前，都对代码进行一些操作。这就设计 git hook，它可以帮我们完成这些东西。



## Pre commit

[pre-commit](https://pre-commit.com/) 可以帮我们更方便的设置 git hook



### 定义 hook 在哪些文件变更时跑

```shell
pip install identify
```

`pre-comit` 使用 identify 对文件类型来过滤，看有没有文件，没有就不执行 hook

```shell
# ["file", "non-executable", "python", "text"]
identify-cli a.py
```



files 和 types 判断是 and 关系。这个例子会匹配到  `foo/1.py` 但不会匹配 `setup.py`.

```yaml
files: ^foo/
types: [file, python]
```



### language

- system

```yaml
- id: "pre-commit"
  name: "check run"
  entry: "echo run"
  language: system
  always_run: true
```

entry 是系统上的执行文件。

- script：

```shell
- id: "pre-commit"
  name: "check run"
  entry: "echo run"
  language: system
  always_run: true
```

precommit 会执行相对于 `.pre-commit-config.yaml` 的 echo 文件。



### 单线程跑 hook

如果希望当前 hook 单线程跑，可以加这个参数。

```yaml
require_serial: true
```



### Java pre commit

```yaml
---
default_stages: [pre-commit]
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v3.3.0
    hooks:
      - id: check-added-large-files
      - id: check-case-conflict
      - id: check-docstring-first
      - id: check-executables-have-shebangs
      - id: check-json
      - id: check-merge-conflict
      - id: check-symlinks
      - id: check-toml
      - id: check-yaml
        args: ["--allow-multiple-documents"]
        exclude: "charts/.*/templates/|helm/templates"
      - id: detect-private-key
      # - id: forbid-new-submodules
      - id: end-of-file-fixer
      - id: mixed-line-ending
      - id: trailing-whitespace
  - repo: https://github.com/syntaqx/git-hooks
    rev: '0e275832e1b85f5a430241ab8f56185d5708e264' # gitleaks:allow
    hooks:
      - id: shellcheck
        types: [shell]
  # 帮助生成 markdown 文章标题
  - repo: https://github.com/thlorenz/doctoc
    rev: v2.2.0
    hooks:
      - id: doctoc
        args: [--github, --maxlevel, '4']
        exclude: .shared/
  - repo: https://github.com/zricethezav/gitleaks
    rev: v8.16.0
    hooks:
    # 插件是否推送了敏感信息到仓库
      - id: gitleaks
        entry: gitleaks protect --verbose --redact --staged
  - repo: https://github.com/jguttman94/pre-commit-gradle
    rev: v0.3.0
    hooks:
    # 推送代码的时候，保证测试都过
      - id: gradle-task
        name: gradle clean & check
        args: [ '-w', --wrapper, 'clean check' ]
        stages: [ pre-push ]
  - repo: local
    hooks:
    # commit message
      - id: commit-message-format-check
        name: commit message format check
        entry: ./commit-msg.sh
        always_run: true
        language: script
        stages: [commit-msg]

```









## Hooks

### Commit message

```shell
#!/bin/bash
set -eo pipefail

RED='\033[0;31m'
Green='\033[0;32m'
NC='\033[0m'
MSG_CONTENT=$(cat "$1")

# Initialize constants here
REGEX="^\[(.*)\] (feat|fix|docs|style|refactor|test|build|ci|perf|release)(\(((.+)-[0-9]{1,}|N\/A)\): (.+))"
NOTICE="A valid commit message looks like:  ${Green}[a & b] feat(XX-123): hello, world!${NC}"
if [[ ! $MSG_CONTENT =~ $REGEX ]]; then
	echo -e "${RED}invalid commit message format!${NC}: ${MSG_CONTENT}"
	echo -e "$NOTICE"
	exit 1
fi
```

### Tag message

```shell
#!/bin/bash
set -eo pipefail

RED='\033[0;31m'
Green='\033[0;32m'
NC='\033[0m'

REGEX="^\[(.*)\] (feat|fix|docs|style|refactor|test|build|ci|perf|release)(\(((.+)-[0-9]{1,}|N\/A)\): (.+))"

function validate {
  local message="$2"
  if [[ ! "$message" =~ $REGEX ]]; then
    echo -e "${RED}The message format of tag \"$1\" is invalid!${NC}. A valid tag message looks like:  ${Green}[a & b] feat(XX-123): hello, world!${NC}"
    echo "Message: \"$message\""
    exit 1
  fi
}
# PRE_COMMIT_LOCAL_BRANCH 是 pre-commit 设置的环境变量
if [[ "$PRE_COMMIT_LOCAL_BRANCH" == *"refs/tags/"* ]]
then
  tag_name=$(echo "$PRE_COMMIT_LOCAL_BRANCH" | sed 's/refs\/tags\/\(.*\)/\1/')
  tag_message=$(git show -s --pretty=full "$tag_name" | sed -n 4p | xargs)

  validate "$tag_name" "$tag_message"
fi

```
