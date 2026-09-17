# proxy-rules
个人自用的一些代理规则，如 Shadowrocket、Clash Verge、Clash for Apple

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
