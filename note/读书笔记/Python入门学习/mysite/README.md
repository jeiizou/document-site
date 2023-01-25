创建数据表:

```cmd
python manage.py makemigrations polls

python manage.py sqlmigrate polls 0001

python manage.py migrate
```

进入命令行:

```cmd
python manage.py shell
```

创建管理员:

```
python manage.py createsuperuser
```

启动简易服务器:

```cmd
python manage.py runserver
```
