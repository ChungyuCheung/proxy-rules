# proxy-rules
个人自用的一些代理规则，如 Shadowrocket、Clash Verge、Clash for Apple、Bettbox

## Clash for Apple（iPhone / iPad）

用脚本覆盖机场自带规则：节点仍走订阅，规则走这份脚本。

导入地址：

https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Clash/APP/cy-rules.js

操作：

1. 先加好机场订阅并更新出节点。
2. 打开该设定档，关掉「使用原始设定档」。
3. 覆写 → 高级 → 脚本 → 管理本地脚本 → 贴上面的 URL 导入并勾选启用。
4. 出站模式选「规则」。每一个机场设定档都要挂一次。

当前策略：

- MEXC → `CY 🇵🇭 菲律宾最快`
- Bybit EU（bybit.eu / api.bybit.eu / bybit.nl）→ `CY 🇪🇺 欧盟最快`
- Bybit 全球站（bybit.com）→ `CY 🇹🇼 台湾最快`
- Bybit 共用 CDN → `CY Bybit`（默认欧盟，可手切）
- PayPal → `CY 🇬🇧 英国最快`
- AI / GitHub → `CY 节点选择`

地区组为空会 REJECT。订阅里要有带对应地区名的节点。

## Bettbox（Windows / Android）

全局扩展脚本（Loyalsoldier 规则集 + 单节点组 + 公司域名直连 + 系统 DNS），基于 Clash 目录下的 v6.2 脚本，针对 Bettbox 小改。

导入地址：

https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Bettbox/bettbox-script.js

国内未连代理时可用镜像（有缓存，更新会延迟几个小时）：

https://testingcf.jsdelivr.net/gh/ChungyuCheung/proxy-rules@main/Bettbox/bettbox-script.js

操作：

1. 先加好机场订阅并更新出节点。
2. 在「脚本」里用上面的 URL 导入，并设为当前脚本。
3. 确认该配置文件的「使用全局脚本覆写」已打开（默认打开）。
4. **关闭「覆写 DNS」**。否则 Bettbox 会在脚本之后用设置页的 DNS 整体替换脚本的 `dns` 段，公司域名会被解析成公网 IP。
5. 「禁用 QUIC」保持关闭。脚本只阻断 Google/YouTube 的 QUIC，打开它会阻断全部 UDP 443。

说明：

- 脚本模式下，配置文件里的「覆写」规则编辑不生效，这是正常的。
- Bettbox 以 `main(config)` 调用脚本（QuickJS），不传 profileName，不支持 fetch。
- 相对原 v6.2 的改动：`dns.enable` 强制为 `true`；12 个公司域名写入 `nameserver-policy`，指定 `system`。
- DNS 分工：直连流量（国内网站、公司域名）用系统 / DHCP DNS；走代理的域名交给节点远端解析；需要判断 GEOIP 时用经代理的 8.8.8.8 / 8.8.4.4 DoH；节点域名用 223.5.5.5 / 119.29.29.29。
- 新增公司域名：改脚本里的 `COMPANY_DOMAINS`；新增纠错规则：改 `CUSTOM_RULES`。改完提交后在 Bettbox 里刷新脚本即可，链接不变。

## Shadowrocket

https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Shadowrocket/cy.conf

## fix-store-lookback.bat

真正的根因：UWP 应用无法访问本地回环代理。

逻辑推演：

全局直连模式下，Clash 不代理任何内容、规则也不起作用——可 Store 照样失败。

说明问题不是分流、不是 DNS（nslookup 也证明解析正常，返回 52.168.112.67）。

唯一的变量是：只要 Clash 在运行，系统代理就被设成

127.0.0.1:7890

（系统代理 ON、虚拟网卡 OFF、DNS 覆写 OFF）。退出 Clash → 系统代理被清除 → Store 直连 → 正常。

关键机制： Microsoft Store 是 UWP 应用，跑在 AppContainer 沙箱里。Windows 默认禁止 UWP 应用访问回环地址（127.0.0.1）。所以当系统代理指向 127.0.0.1:7890 时，Store 根本连不上这个本地代理端口 → 拿不到网络 → "初始化失败"。

这和节点、规则、DNS 全都无关——纯粹是 UWP 沙箱 + 本地代理 的兼容问题。
