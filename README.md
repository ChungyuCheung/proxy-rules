# proxy-rules
个人自用的一些代理规则，如shadowrocket，clash verge

### Shadowrocket：
https://raw.githubusercontent.com/ChungyuCheung/proxy-rules/main/Shadowrocket/cy.conf

### fix-store-lookback.bat ：

真正的根因：UWP 应用无法访问本地回环代理

逻辑推演：

全局直连模式下，Clash 不代理任何内容、规则也不起作用——可 Store 照样失败。

说明问题不是分流、不是 DNS（你的 nslookup 也证明解析正常，返回 52.168.112.67）。

唯一的变量是：只要 Clash 在运行，系统代理就被设成 

127.0.0.1:7890

（你的截图：系统代理 ON、虚拟网卡 OFF、DNS 覆写 OFF）。退出 Clash → 系统代理被清除 → Store 直连 → 正常。

关键机制： Microsoft Store 是 UWP 应用，跑在 AppContainer 沙箱里。Windows 默认禁止 UWP 应用访问回环地址（127.0.0.1）。所以当系统代理指向 127.0.0.1:7890 时，Store 根本连不上这个本地代理端口 → 拿不到网络 → "初始化失败"。

这和节点、规则、DNS 全都无关——纯粹是 UWP 沙箱 + 本地代理 的兼容问题。我前面几版脚本都修错了层。