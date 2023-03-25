#!/bin/bash
set -eo pipefail

# grep “test” -rl ./* | xargs sed -i ‘s/test/zhaochaoxing/g’

grep 'oss.mflyyou.cn/blog' -rl ./*.md
