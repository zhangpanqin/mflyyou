#!/bin/bash
set -eo pipefail

BASE_DIR=$(
    cd $(dirname $0)
    pwd
)

dist=${BASE_DIR}/docs/.vuepress/dist
if [ -d ${dist} ]; then
    rm -fr ${dist}
    echo "删除目录 ${dist}"
fi

yarn docs:build:mflyyou

if [ $? != 0 ]; then
    echo "构建失败,退出"
    exit -1
fi

public=${BASE_DIR}/docs/.vuepress/dist


if [ -d ${dist} ]; then
    scp -i /Users/panqinzhang/.ssh/mflyyou/id_rsa -rp ${dist}/* mflyyou@121.43.180.141:/usr/share/nginx/html/
    echo "部署成功"
else
    echo "${dist} 不存在,部署失败"
fi

#!/bin/bash
set -eo pipefail

BASE_DIR=$(
    cd $(dirname $0)
    pwd
)

dist=${BASE_DIR}/docs/.vuepress/dist
if [ -d ${dist} ]; then
    rm -fr ${dist}
    echo "删除目录 ${dist}"
fi

yarn docs:build:mflyyou

if [ $? != 0 ]; then
    echo "构建失败,退出"
    exit -1
fi

public=${BASE_DIR}/docs/.vuepress/dist


if [ -d ${dist} ]; then
    scp -i /Users/panqinzhang/.ssh/mflyyou/id_rsa -rp ${dist}/* mflyyou@121.43.180.141:/usr/share/nginx/html/
    echo "部署成功"
else
    echo "${dist} 不存在,部署失败"
fi
