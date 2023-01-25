# linux-常见错误

## ENOSPC:System limit for number of file watchers reached

解释:　系统对文件监控的数量达到限制数量

解决: 

```bash
# 编辑配置文件
vim /etc/sysctl.conf

# 添加到文件末尾
fs.inotify.max_user_watches=524288

# 生效
sudo sysctl -p
```