#!/bin/bash
set -eo pipefail
BASE_DIR=$(
    cd $(dirname $0)
    pwd
)
# 进入项目路径下
cd ${BASE_DIR}

# 判断执行是否成功
if [ $? != 0 ]; then
    echo "将本地路径前缀替换错误"
    exit -1
fi

yarn run build
hexo d
if [ $? != 0 ]; then
    echo "构建失败,退出"
    exit -1
fi

# 拷贝项目路径下 themes/matery/source  到 oss zhangpanqin-blog/source

/Users/panqinzhang/app/oss/ossutilmac64 cp -rf ${BASE_DIR}/themes/matery/source oss://zhangpanqin-blog/source --meta=Cache-Control:public,max-age=2592000 -c /Users/panqinzhang/.ossutilconfig

if [ $? != 0 ]; then
    echo "上传 oss 失败,退出"
    exit -1
fi

public=${BASE_DIR}/public

if [ -d ${public} ]; then
    scp -i /Users/panqinzhang/.ssh/mflyyou/id_rsa -rp ${public}/* mflyyou@121.43.180.141:/usr/share/nginx/html/
    echo "部署成功"
else
    echo "${public} 不存在,部署失败"
fi
