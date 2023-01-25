# Nginx常用配置

一个最基础的Nginx前端项目部署配置:

```
server {
  listen  80;
  server_name  www.xxx.com;

  location / {
    index  /data/dist/index.html;
  }
}
```

## Location 匹配规则

- `=`表示精确匹配。只有请求的url路径与后面的字符串完全相等时，才会命中.
- `^~`表示如果该符号后面的字符是最佳匹配，采用该规则，不再进行后续的查找。
- `~`表示该规则是使用正则定义的，区分大小写。
- `~*`表示该规则是使用正则定义的，不区分大小写。

> 1. `nginx`的匹配优先顺序按照上面的顺序进行优先匹配，一旦命中直接退出，不再继续匹配.
> 2.  剩下的普通匹配会按照最长匹配长度优先级来匹配, 谁匹配的多就用谁

```nginx
# 例子1:
server {
    server_name website.com;
    location /document {
        return 701;
    }
    location ~* ^/docume.*$ {
        return 702;
    }
    location ~* ^/document$ {
        return 703;
    }

}
curl -I  website.com:8080/document 702
# 匹配702 因为正则的优先级更高,而且正则是一旦匹配到就直接退出 所以不会再匹配703


# 例子2
server {
    server_name website.com;
    location ~* ^/docume.*$ {
        return 701;
    }

    location ^~ /doc {
        return 702;
    }
    location ~* ^/document$ {
        return 703;
    }
}
curl http://website.com/document
HTTP/1.1 702
# 匹配702 因为 ^~精确匹配的优先级比正则高 也是匹配到之后支持退出

# 例子3
server {
    server_name website.com;
    location /doc {
        return 702;
    }
    location /docu {
        return 701;
    }
}
# 701 前缀匹配匹配是按照最长匹配，跟顺序无关
```


## History路由适配

在`spa`模式下, 会导致无法进入前端路由, 可以这么配置:

```nginx
server {
  listen  80;
  server_name  www.xxx.com;

  location / {
     index index.html index.htm;
    proxy_set_header Host $host;
    # history模式最重要就是这里
    try_files $uri $uri/ /index.html;
    # index.html文件不可以设置强缓存 设置协商缓存即可
    add_header Cache-Control 'no-cache, must-revalidate, proxy-revalidate, max-age=0';
  }
}
```

## 接口反向代理

```nginx
location ^~ /api/ {
    # 跨域处理 设置头部域名
    add_header Access-Control-Allow-Origin *;
    # 跨域处理 设置头部方法
    add_header Access-Control-Allow-Methods 'GET,POST,DELETE,OPTIONS,HEAD';
    # 改写路径
    rewrite ^/api/(.*)$ /$1 break;
    # 反向代理
    proxy_pass http://static_env;
    proxy_set_header Host $http_host;
}
```

## 静态资源缓存

```nginx
location ~* \.(?:css(\.map)?|js(\.map)?|gif|svg|jfif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$ {
    # 静态资源设置七天强缓存
    expires 7d;
    access_log off;
}
```

## 用目录区分多个网站

```nginx

server {
    listen 80;
    server_name taobao.com;
    index index.html index.htm;
    # 通过正则来匹配捕获 [tmall|alipay]中间的这个路径
    location ~ ^/([^\/]+)/(.*)$ {
        try_files $uri $uri/ /$1/dist/index.html =404;
    }
}
```

## 负载均衡

```nginx
upstream backserver{ 
    # 哈希算法，自动定位到该服务器 保证唯一ip定位到同一部机器 用于解决session登录态的问题
    ip_hash; 
    server 127.0.0.1:9090 down; (down 表示单前的server暂时不参与负载) 
    server 127.0.0.1:8080 weight=2; (weight 默认为1.weight越大，负载的权重就越大) 
    server 127.0.0.1:6060; 
    server 127.0.0.1:7070 backup; (其它所有的非backup机器down或者忙的时候，请求backup机器) 
} 
```

## 灰度部署

通过Header区分环境, 访问不同的服务

```nginx
upstream stable {
    server xxx max_fails=1 fail_timeout=60;
    server xxx max_fails=1 fail_timeout=60;
 }
upstream canara {
   server xxx max_fails=1 fail_timeout=60;
}

server {
    listen 80;
    server_name  xxx;
    # 设置默认
    set $group "stable";

    # 根据cookie头部设置接入的服务
    if ($http_cookie ~* "tts_version_id=canara"){
        set $group canara;
    }
    if ($http_cookie ~* "tts_version_id=stable"){
        set $group stable;
    }
    location / {
        proxy_pass http://$group;
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        index  index.html index.htm;
    }
}
```

## SSR降级

当SSR的Node服务Down了, 可以返回500状态码, 降低到CSR:

```nginx
upstream ssr {
    server xxx max_fails=1 fail_timeout=60;
    server xxx max_fails=1 fail_timeout=60;
 }
upstream csr {
    server xxx max_fails=1 fail_timeout=60;
    server xxx max_fails=1 fail_timeout=60;
}

location ^~ /ssr/ {
    proxy_pass http://ssr;
    # 开启自定义错误捕获 如果这里不设置为on的话 会走向nginx处理的默认错误页面
    proxy_intercept_errors on;
    # 捕获500系列错误 如果500错误的话降级为下面的csr渲染
    error_page 500 501 502 503 504 = @csr_location

    # error_page 500 501 502 503 504 = 200 @csr_location
    # 注意这上面的区别 等号前面没有200 表示 最终返回的状态码已 @csr_location为准 加了200的话表示不管@csr_location返回啥都返回200状态码
}

location @csr_location {
    # 这时候地址还是带着/ssr/的要去除
    rewrite ^/ssr/(.*)$ /$1 break;
    proxy_pass http://csr;
    rewrite_log on;
}
```

## webp自动降级

```nginx

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  # 设置日志格式
  log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
  '$status $body_bytes_sent "$http_referer" '
  '"$http_user_agent" "$http_x_forwarded_for"'
  '"$proxy_host" "$upstream_addr"';

  access_log  /var/log/nginx/access.log  main;

  sendfile        on;
  keepalive_timeout  65;

  # 开启gzip
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

  # 负载均衡 这里可以是多个cos桶地址即可
  upstream static_env {
    server xxx;
    server xxx;
  }

  # map 设置变量映射 第一个变量指的是要通过映射的key值 Accpet 第二个值的是变量别名
  map $http_accept $webp_suffix {
    # 默认为 空字符串
    default   "";
    # 正则匹配如果Accep含有webp字段 设置为.webp值
    "~*webp"  ".webp";
  }
  server {

    listen 8888;
    absolute_redirect off;    #取消绝对路径的重定向
    #网站主页路径。此路径仅供参考，具体请您按照实际目录操作。
    root /usr/share/nginx/html;

    location / {
      index index.html index.htm;
      proxy_set_header Host $host;
      try_files $uri $uri/ /index.html;
      add_header Cache-Control 'no-cache, max-age=0';
    }

    # favicon.ico
    location = /favicon.ico {
      log_not_found off;
      access_log off;
    }

    # robots.txt
    location = /robots.txt {
      log_not_found off;
      access_log off;
    }

    # 
    location ~* \.(png|jpe?g)$ {
      # Pass WebP support header to backend
      # 如果header头部中支持webp
      if ($webp_suffix ~* webp) {
        # 先尝试找是否有webp格式图片
        rewrite ^/(.*)\.(png|jpe?g)$ /$1.webp break;
        # 找不到的话 这里捕获404错误 返回原始错误 注意这里的=号 代表最终返回的是@static_img的状态吗
        error_page 404 = @static_img;
      }
      proxy_intercept_errors on;
      add_header Vary Accept;
      proxy_pass http://static_env;
      proxy_set_header Host $http_host;
      expires 7d;
      access_log off;
    }

    location @static_img {
      #set $complete $schema $server_addr $request_uri;
      rewrite ^/.+$ $request_uri break;
      proxy_pass http://static_env;
      proxy_set_header Host $http_host;
      expires 7d;
    }


    # assets, media
    location ~* \.(?:css(\.map)?|js(\.map)?|gif|svg|jfif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$ {
      proxy_pass http://static_env;
      proxy_set_header Host $http_host;
      expires 7d;
      access_log off;
    }


    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
      root   /usr/share/nginx/html;
    }
  }
}
```

## 参考来源

- [前端到底用nginx来做啥](https://juejin.cn/post/7064378702779891749)