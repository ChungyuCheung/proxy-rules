# Bettbox 脚本版本

| 模式 | 文件 | 适用场景 | WebRTC/UDP |
| --- | --- | --- | --- |
| 系统代理 | `bettbox-system-proxy.js` | 轻量、兼容性优先，只代理遵循系统代理的应用 | 无法接管绕过系统代理的 UDP，不能单靠脚本防止 WebRTC 泄漏 |
| TUN | `bettbox-tun.js` | 隐私与全局接管优先 | 可接管 TCP/UDP；常见 STUN/TURN 端口先走代理，节点不支持时拒绝 |

## 固定下载地址

系统代理版：

```text
https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Bettbox/bettbox-system-proxy.js
```

TUN 版：

```text
https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Bettbox/bettbox-tun.js
```

两个文件名是稳定入口，以后升级只更新文件内容，不更换 URL。不要同时启用两个脚本。

TUN 只是把系统流量送入 Mihomo。流量进入内核后，脚本生成的 DNS、规则、策略组仍然生效，继续决定 `DIRECT`、代理或 `REJECT`。
