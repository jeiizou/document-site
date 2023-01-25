# 常用操作-Docker

> CentOS

1. 卸载Docker

```sh
sudo yum remove docker \
                docker-client \
                docker-client-latest \
                docker-common \
                docker-latest \
                docker-latest-logrotate \
                docker-logrotate \
                docket-engine
```

2. 安装Docker


```sh
sudo yum install -y docker-ce docker-ce-cli containerd.io
```

- docker-ce: 社区版
- docker-ce-cli: 命令行工具
- containerd.io: 一个守护进程


3. 开机自启动

```sh
systemctl enable docker
```