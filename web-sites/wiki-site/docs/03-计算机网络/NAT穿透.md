---
slug: /ComputerNetwork/NAT
---

# NAT 穿透

## 背景

因为全球IPv4地址短缺, 所以发明了NAT来解决这个问题, 简单的说:

- 大部分机器都使用私有IP地址(192.168.x.x / ...)
- 他们如果要访问公网服务, 那么需要:
  - 出向流量: 经过一台NAT设备, 他会对流量进行SNAT, 将私有 srcIP + Port 抓换成工的IP+Port, 然后将包发出去
  - 应答流向: 到达NAT设备后进行反向的转换, 然后再转发给客户端

整个过程是透明的

那么, 我们怎么让两台经过NAT的机器进行点对点的通信呢?

直接使用IP互联显然是不行的. 在Tailscale中, 我们会建立一个WireGuard隧道来解决这个问题. 

更加广泛的场景是:

- WebRTC
- VolP

