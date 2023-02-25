# Elasticsearch-7.6.1

## 分词

分词由分词器（Analyzer）完成。

### 分词器（Analyzer）

分词器由 `Character Filters` 、`Tokenizer`  和 `Token Filter` 组成。`Tokenizer` 是必须的。

![image-20200314174642330](http://oss.mflyyou.cn/blog/20200314174642.png?author=zhangpanqin)



Tokenizer 是将 `Character Filters` 处理之后的文本再处理。调用顺序如上所述。



### 查看分词结果

- 直接查看分词

```http
GET /_analyze
{
  "text": "张攀钦",
  "analyzer": "ik_max_word"
}
```

- 查看索引下的某个字段分词

```http
GET /case_info/_analyze
{
  "field": "detailInfo",
  "text": [
    "好好学习"
  ],
  "analyzer": "ik_max_word",
  "explain": true
}
```

- 自定义分词器测试

```http
POST /_analyze
{
  "tokenizer": "ik_max_word",
  "filter": ["lowercase"],
  "char_filter": ["html_strip"],
  "text": ["<p>I&apos;m so <b>HAPPY 上山打老虎</b>!</p>"]
}
```

> 定义 mapping 的时候定义分词器

```http
GET /test_custom_analyze/_analyze
{
  "field": "my_text",
  "text": ["<p>I&apos;m so <b>HAPPY 上山打老虎</b>!</p>"],
  "analyzer": "my_std_folded"
}
PUT /test_custom_analyze
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_std_folded": {
          "tokenizer": "ik_max_word",
          "filter": [
            "lowercase"
          ],
          "char_filter": [
            "html_strip"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "my_text": {
        "type": "text",
        "analyzer": "my_std_folded"
      }
    }
  }
}
```

## 索引

### 分词

#### 查看字段分词

```http
# /{index}/_analyze
GET /case_info/_analyze
{
  "field": "detailInfo",
  "text": [
    "上山打老虎"
  ],
  "analyzer": "ik_max_word",
  "explain": true
}
```



## Mapping

### 定义 Mapping 的参数



### 创建索引 mapping

#### 创建一个不存在的 mapping

```http
PUT /study_es_1
{
  "mappings": {
    "properties": {
      "my_field_content": {
        "type": "text",
        "analyzer": "ik_max_word",
        "fields": {
          "term_my_field_content": {
            "type": "keyword"
          }
        }
      }
    }
  }
}

```

#### 在存在 mapping 中添加新的字段

```http
PUT /study_es_1/_mapping
{
  "properties": {
    "my_field2": {
      "type": "text",
      "analyzer": "ik_max_word"
    }
  }
}
```

### mapping 中参数设置

- analyzer

指定分词器。比如 ik 分词器中的 `ik_max_word` 。如果对同一个字段需要不同的分词器，可以这样做。在 `fields` 中添加字段。

- index

设置字段是否用于索引。默认为 `true` 当设置为 false 时，不会进行索引，不可查询。

- fields

设置字段用于不同的索引方式。

`my_field_content` 用于全文索引，`my_field_content.term_my_field_content` 可以用于关键字搜索。

```http
PUT /study_es_1
{
  "mappings": {
    "properties": {
      "my_field_content": {
        "type": "text",
        "analyzer": "ik_max_word",
        "fields": {
          "term_my_field_content": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
```

- store--<font color=red>不是很理解</font>

默认字段用于索引，但是不保存。`_source` 为原始字段值。

- properties

设置 `object` 和 `nested` 中字段。

```http
PUT my_index
{
  "mappings": {
    "properties": { 
      "manager": {
        "properties": { 
          "age":  { "type": "integer" },
          "name": { "type": "text"  }
        }
      },
      "employees": {
        "type": "nested",
        "properties": { 
          "age":  { "type": "integer" },
          "name": { "type": "text"  }
        }
      }
    }
  }
}

PUT my_index/_doc/1 
{
  "region": "US",
  "manager": {
    "name": "Alice White",
    "age": 30
  },
  "employees": [
    {
      "name": "John Smith",
      "age": 34
    },
    {
      "name": "Peter Brown",
      "age": 26
    }
  ]
}
```



- coerce

强制字段的值为定义的类型,不然保存报错。

- copy_to

将别的值复制到一个字段中用于查询。`full name` 可以用于查询 `first_name` 和 `last_name`

```http
PUT my_index
{
  "mappings": {
    "properties": {
      "first_name": {
        "type": "text",
        "copy_to": "full_name" 
      },
      "last_name": {
        "type": "text",
        "copy_to": "full_name" 
      },
      "full_name": {
        "type": "text"
      }
    }
  }
}
```

- dynamic

允许动态添加字段和 `mapping` 的策略。默认 `true` 可以动态加入。`false` 可以保存数据，但是不会索引和添加到 `mapping` 。`strict` 添加 `mapping` 中不存在的字段直接报错。

- enabled

用于设置对象只能保存，不被索引和查询。`_source`中会包含这个数据。 

- format

将符合格式的日期保存为日期。

```htpp
PUT my_index
{
  "mappings": {
    "properties": {
      "date": {
        "type":   "date",
        "format": "yyyy-MM-dd"
      }
    }
  }
}
PUT /my_index77/_doc/1
{
  "date":"2019-12-10"
}
```

- ignore_above

长于 `ignore_above` 设置的字符数字段不会用于索引。数组中的字符串用于各个匹配。

```http
PUT my_index
{
  "mappings": {
    "properties": {
      "message": {
        "type": "keyword",
        "ignore_above": 12
      }
    }
  }
}
PUT my_index/_doc/1 
{
  "message": "张攀钦1234567890"
}
PUT my_index/_doc/2
{
  "message": "张攀钦123456789"
}

# 搜索不到数据
POST my_index/_search
{
  "query": {
    "term": {
      "message": {
        "value": "张攀钦1234567890"
      }
    }
  }
}

# 可以搜索到数据
POST my_index/_search
{
  "query": {
    "term": {
      "message": {
        "value": "张攀钦123456789"
      }
    }
  }
}
```

- ignore_malformed

设置为 `true` 忽略传入值与设置类型不一致的错误。错误的不会进行索引，但是其余字段正常索引处理。可以类型转换的没有问题。`"11"` 可以转换为 11。

 `number_two` 只能传数值，`number_one`  可以 传非数值字段。

```http
PUT my_index
{
  "mappings": {
    "properties": {
      "number_one": {
        "type": "integer",
        "ignore_malformed": true
      },
      "number_two": {
        "type": "integer"
      }
    }
  }
}

PUT my_index/_doc/1
{
  "text":       "Some text value",
  "number_one": "foo" 
}

PUT my_index/_doc/2
{
  "text":       "Some text value",
  "number_two": "foo" 
}
```



### 查看 mapping

#### 查看索引的 mapping

```http
# /索引/_mapping
GET /case_info/_mapping
```

#### 查看某个字段 mapping

/`index`/\_mapping/field/`字段`

```http
# 查看索引 my-index 中 age 的 mapping
GET /my-index/_mapping/field/age
```

### 更改字段索引类型

创建一个新的索引，和别名，然后从新索引你的数据到新的索引

```http
POST _reindex
{
  "source": {
    "index": "twitter",
    "type": "user"
  },
  "dest": {
    "index": "users",
    "type": "_doc"
  }
}
```

## 数据

### 保存数据

> /`index`/\_doc

```js
POST /test_index/_doc
{
    "caseId": "案例主键 id",
    "caseName": "案例名称",
    "casePictureUrl": "/asd",
    "detailInfo": "案例详情",
    "caseLevel":1,
    "caseYear": "2019",
    "baseArea":"所属区域",
    "provinceName":"省名称",
    "cityName": "城市名称",
    "saleName":["陈平安","阿良"]
}


{
 // 索引
  "_index" : "test_index",
  // type,未来会弃用，目前一个索引存储一种类型的数据
  "_type" : "_doc",
  // 主键 id
  "_id" : "cCYa1HABWJRN301QEXbs",
  // 数据版本号
  "_version" : 1,
  // 操作说明，create,updated,deleted
  "result" : "created",
  // 分片
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 2,
  "_primary_term" : 1
}
```

### 更新数据

>  /`index`/\_doc_/`id`

```http
PUT /test_index/_doc/1
{
    "caseId": "案例主键 id",
    "caseName": "案例名称",
    "casePictureUrl": "/asd",
    "detailInfo": "案例详情",
    "caseLevel":1,
    "caseYear": "2019",
    "baseArea":"所属区域",
    "provinceName":"省名称",
    "cityName": "城市名称",
    "saleName":["陈平安","阿良"]
}
# 返回值
{
  "_index" : "test_index",
  "_type" : "_doc",
  "_id" : "cCYa1HABWJRN301QEXbs",
  "_version" : 2,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 3,
  "_primary_term" : 1
}
```

### 删除数据

> /`index`/\_doc/`id`

```http
DELETE /test_index/_doc/cCYa1HABWJRN301QEXbs
{
  "_index" : "test_index",
  "_type" : "_doc",
  "_id" : "cCYa1HABWJRN301QEXbs",
  "_version" : 3,
  "result" : "deleted",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 7,
  "_primary_term" : 1
}
```

## 查询

### 简单查询

- 根据 id 查询，返回数据，不包含元数据

```http
GET /test_index/_source/cCYa1HABWJRN301QEXbs
```

- 根据 id 查询，返回数据包含元数据

```http

```



### 布尔查询-Bool Query

```http
POST _search
{
  "query": {
    "bool" : {
      "must" : {
        "term" : { "user" : "kimchy" }
      },
      "filter": {
        "term" : { "tag" : "tech" }
      },
      "must_not" : {
        "range" : {
          "age" : { "gte" : 10, "lte" : 20 }
        }
      },
      "should" : [
        { "term" : { "tag" : "wow" } },
        { "term" : { "tag" : "elasticsearch" } }
      ]
    }
  }
}
```

### 关键字查询-Term Query



### Match Query

- 模拟数据

创建字段 my_field_content，和用于关键字查询的 term_my_field_content（查询结果中不会显示这个字段）

```http
PUT /study_es_1/
{
  "mappings": {
    "properties": {
      "my_field_content": {
        "type": "text",
        "analyzer": "ik_max_word",
        "fields": {
          "term_my_field_content": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
PUT /study_es_1/_mapping
{
  "properties": {
    "my_field2": {
      "type": "text",
      "analyzer": "ik_max_word"
    }
  }
}
POST /study_es_1/_doc
{
  "my_field_content":"上山打老虎"
}
POST /study_es_1/_doc
{
  "my_field_content":"和尚上山打老虎"
}
POST /study_es_1/_doc
{
  "my_field_content":"白也战六妖",
  "my_field2":"老虎吃人"
}
```



```http
# my_text 为字段。简单写法。
GET /test-mapping2/_search
{
 "query": {
   "match": {
     "my_field_content": "打"
   }
 }
}
```

> 匹配有 `老虎` 或 `和尚` 的文档。显示两条数据。

```http
GET /study_es_1/_search
{
  "query": {
    "match": {
      "my_field_content": {
        "query": "和尚 老虎",
        "operator": "or"
      }
    }
  }
}
```

> 匹配同时有 `老虎` 和 `和尚` 的文档。显示一条数据。`query` 用于匹配词条。

```http
GET /study_es_1/_search
{
  "query": {
    "match": {
      "my_field_content": {
        "query": "和尚 老虎",
        "operator": "and"
      }
    }
  }
}
```

> 上述 mapping 对 `my_field_content` 下定义了一个字段用于关键字 term 查询。准备匹配，不进行分词。

```http
GET /study_es_1/_search
{
  "query": {
    "term": {
      "my_field_content.term_my_field_content": {
        "value": "和尚上山打老虎"
      }
    }
  }
}
```



### 所有字段模糊查询-Query String

> 三条数据全部查出来

```http
GET /study_es_1/_search
{
  "query": {
    "query_string": {
      "query": "老虎"
    }
  }
}
```





## 部署运维

### 设置文件描述符

```bash
ulimit -a 可以查看设置信息
# 调大打开的文件描述符，设置太大，可能不成功
sudo su  
ulimit -n 65535 
su elasticsearch 

此操作没有持久化
```

- 持久化更改文件操作符

```bash
# /etc/security/limits.conf
elasticsearch  -  nofile  65535
```

```bash
# rpm 包设置
/etc/sysconfig/elasticsearch
```

![image-20200313220432178](http://oss.mflyyou.cn/blog/20200313220432.png?author=zhangpanqin)

```http
# 查看文件描述符
GET _nodes/stats/process?filter_path=**.max_file_descriptors
```

### Ik 词库

[深蓝词库转换](https://github.com/studyzy/imewlconverter)

将搜狗词库转换为 txt

```bash
dotnet ImeWlConverterCmd.dll -i:scel ./a.scel -o:word ./word.txt
```

### 热更新词库

ik 分词器配置文件：`{esroot}/config/analysis-ik/IKAnalyzer.cfg.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
	<comment>IK Analyzer 扩展配置</comment>
	<!--用户可以在这里配置自己的扩展字典 -->
	<entry key="ext_dict">my_main.dic</entry>
	 <!--用户可以在这里配置自己的扩展停止词字典-->
	<entry key="ext_stopwords"></entry>
	<!--用户可以在这里配置远程扩展字典 -->
	<entry key="remote_ext_dict">http://localhost:8888/ik/a.txt</entry>
	<!--用户可以在这里配置远程扩展停止词字典-->
	<!-- <entry key="remote_ext_stopwords">words_location</entry> -->
</properties>
```

nginx 配置词库文件位置

```nginx
location /ik/ {
    alias /Users/zhangpanqin/stduy_app/ik/;
    autoindex off;
    expires 7h;
}
```

