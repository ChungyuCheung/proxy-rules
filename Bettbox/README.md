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



----

2026.10.13  22:00

已经按模式拆分并推送到 GitHub `main`，提交为 `abad83d`。两个固定 URL 以后不会随版本号变化，直接在 Bettbox 点“更新”即可。

### 下载链接

系统代理版：

```
https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Bettbox/bettbox-system-proxy.js
```

本地文件：[bettbox-system-proxy.js (line 1)](/Z:/Proxy/proxy-rules/Bettbox/bettbox-system-proxy.js:1)

TUN 版，包含 WebRTC/STUN 防泄漏：

```
https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Bettbox/bettbox-tun.js
```

本地文件：[bettbox-tun.js (line 1)](/Z:/Proxy/proxy-rules/Bettbox/bettbox-tun.js:1)

说明文档：[README.md (line 1)](/Z:/Proxy/proxy-rules/Bettbox/README.md:1)

不要同时启用两个脚本。

### 系统代理与 TUN 的区别

| 项目                 | 系统代理模式                  | TUN 模式                                |
| -------------------- | ----------------------------- | --------------------------------------- |
| 接管方式             | 应用主动遵循 Windows 系统代理 | 虚拟网卡接管系统 IP 流量                |
| TCP/HTTP/HTTPS       | 通常可以                      | 可以                                    |
| UDP/WebRTC/游戏流量  | 通常无法接管                  | 可以接管                                |
| 不遵循系统代理的应用 | 可能直连                      | 通常可以接管                            |
| WebRTC 防泄漏        | 脚本无法保证                  | 可以通过规则代理或拒绝                  |
| 兼容性与资源占用     | 更轻量、兼容性较好            | 接管更完整，可能与其他 VPN/虚拟网卡冲突 |
| 推荐场景             | 只需要浏览器网页代理          | 重视隐私、防泄漏和全局代理              |

Mihomo 官方将系统代理端口和 TUN 都视为“流量入口”；区别是哪些流量能够进入内核。[Mihomo 入站文档](https://wiki.metacubex.one/en/config/inbound/)

### TUN 模式下脚本和规则是否生效？

会，而且这是正常工作方式：

```
应用流量
   ↓
TUN 虚拟网卡
   ↓
Mihomo 内核
   ↓
脚本生成的 DNS 与代理规则
   ↓
DIRECT / 节点代理 / REJECT
```

TUN 只负责把流量送进 Mihomo，并不等于所有流量无条件走代理。当前脚本仍会：

- 局域网、公司域名、中国大陆流量按规则直连。
- Google、YouTube、Discord 等按规则代理。
- 广告或特定流量按规则拒绝。
- 常见 STUN/TURN 流量优先走所选节点。
- 节点不支持 UDP 时拒绝 STUN，避免回落直连暴露公网 IP。

规则仍按照从上到下的顺序执行。[Mihomo 路由规则文档](https://github.com/MetaCubeX/Meta-Docs/blob/main/docs/config/rules/index.en.md)

你的情况已经出现 WebRTC 公网 IP 不一致，因此建议导入并启用 `bettbox-tun.js`，同时在 Bettbox 中开启：

1. TUN 模式。
2. 严格路由 / Strict Route。
3. 支持 UDP 的代理节点。
4. 刷新订阅并重启内核。

然后重新访问 BrowserLeaks，WebRTC IP 应与代理出口一致，或者不再显示公网 WebRTC IP。



`bettbox-script-v7.0-webrtc.js` 是拆分前创建的“带 WebRTC 防泄漏的 v7.0 版本快照”。

目前文件关系是：

- `bettbox-script.js`：旧版 v6.9。
- `bettbox-script-v7.0-webrtc.js`：v7.0 TUN/WebRTC 版本快照，用于历史留档和兼容旧链接。
- `bettbox-system-proxy.js`：系统代理模式的固定更新入口。
- `bettbox-tun.js`：TUN 模式的固定更新入口，当前功能与 `bettbox-script-v7.0-webrtc.js` 完全相同。

因此实际使用时：

- 系统代理模式：使用 `bettbox-system-proxy.js`
- TUN 模式：使用 `bettbox-tun.js`
- 不需要再导入 `bettbox-script-v7.0-webrtc.js`
- 不要同时启用 `bettbox-tun.js` 和 `bettbox-script-v7.0-webrtc.js`

保留版本快照的好处是方便回滚和兼容之前已经导入该链接的设备；以后功能更新主要更新固定入口 `bettbox-tun.js`。