// ===== Loyalsoldier 全局覆写脚本 v5.8（精简手动版）=====
// [v5.8] 按稳定性优化:
//   1. Google/YouTube/Google AI 服务继续强制走节点。
//   2. QUIC(UDP 443) 阻断从全局收窄到 Google/YouTube 相关域名，减少误伤公司、微软、国内服务。
//   3. IPv6 私网规则改为 IP-CIDR6，提升 Mihomo/Clash Verge 兼容性。
//   4. 微软规则拆分: Windows 系统服务直连，Microsoft 365/登录/云服务不再强制直连。
//   5. DNS 显式补齐 fake-ip 模式与 fake-ip-range，但不覆盖已有自定义值。
// [v5.7] 修复 Antigravity IDE (Google AI IDE): oauth2/play.googleapis.com 经 Proxifier
//   被 applications 规则误判直连→被墙超时。已加 google 域名规则强制走节点 (放在 applications 之前)。
// [v5.6] 修复"未入名单的国内.com被误走节点": 原 GEOIP,CN 带 no-resolve → 域名未解析时跳过此条、
//   掉到 MATCH 走节点。去掉 no-resolve, 让兜底域名解析后按 IP 归属判定，国内 IP 直连。
// [v5.5] 修复 Discord 更新不动: discord 域名被 L大 applications 规则误判直连→被墙。
//   已加最高优先级规则强制 discord 走节点。
// [v5.4] 纯手动选点: 代理组 select, 你选哪个就一直用哪个，绝不自动切换。
//   节点坏了也由你自己换。已去掉 unified-delay，延迟数字为常态口径。
//   注: "测速全部"会同时测 300+ 节点、互相挤带宽 → 全部假高，那不是真延迟；想看真延迟就单独点某个节点测。
// 思路: ①只用 L大规则 ②直连走 DHCP 系统 DNS ③境外走谷歌 DNS(经代理) ④单组手动选点
// [稳定性] 针对"同一节点要刷几次才能打开":
//   - tcp-concurrent: 多 IP 并发拨号，哪个先通用哪个 → 减少首连超时。
//   - 针对 Google/YouTube 阻断 QUIC(UDP 443): 强制回退到更稳的 TCP，同时避免全局误伤。
// 备注: Store 打不开的根因通常是 UWP loopback，与本脚本无关。

const PROXY = "⚡ 节点选择"

// 公司/内网域名: 一律直连，解析交给 DHCP 系统 DNS。新增直接加到这里。
const COMPANY_DOMAINS = [
    "huinor.com",
    "huitone.com",
    "synology.me",
    "kunyi-gzzc.com",
    "kunyi-gz.com",
    "kunqi-dev.com",
    "kunqi-demo.com",
    "kunqi-test.com",
    "kunyi-pro",
    "kunqi-gz",
]

// Google / YouTube / Google AI: 明确走代理，并用于定向阻断 QUIC。
const GOOGLE_PROXY_DOMAINS = [
    "google.com",
    "googleapis.com",
    "gstatic.com",
    "googleusercontent.com",
    "ggpht.com",
    "googlevideo.com",
    "youtube.com",
    "youtu.be",
    "ytimg.com",
    "youtubei.googleapis.com",
    "youtube-nocookie.com",
    "googleadservices.com",
]

function main(config) {
    if (!config || typeof config !== "object") config = {}

    // ---- 0. 速度开关: 多 IP 并发建连 (哪个先通用哪个，减少首连卡顿) ----
    config["tcp-concurrent"] = true

    // ---- 1. 代理组: 单组，纯手动选择 (选定即锁定，绝不自动切换) ----
    config["proxy-groups"] = [
        {
            name: PROXY,
            type: "select",
            "include-all": true,
            "exclude-filter":
                "(?i)(到期|剩余|过期|有效期|官网|官方|订阅|套餐|重置|流量|距离|网址|客服|expire|traffic|reset)",
        },
    ]

    // ---- 2. L大规则集 (CDN 用国内稳定的 testingcf) ----
    const CDN = "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release"
    const rp = (behavior, name) => ({
        type: "http",
        behavior,
        url: CDN + "/" + name + ".txt",
        path: "./ruleset/loyalsoldier/" + name + ".yaml",
        interval: 86400,
    })
    config["rule-providers"] = {
        reject: rp("domain", "reject"),
        icloud: rp("domain", "icloud"),
        apple: rp("domain", "apple"),
        google: rp("domain", "google"),
        proxy: rp("domain", "proxy"),
        direct: rp("domain", "direct"),
        private: rp("domain", "private"),
        gfw: rp("domain", "gfw"),
        "tld-not-cn": rp("domain", "tld-not-cn"),
        telegramcidr: rp("ipcidr", "telegramcidr"),
        cncidr: rp("ipcidr", "cncidr"),
        lancidr: rp("ipcidr", "lancidr"),
        applications: rp("classical", "applications"),
    }

    const googleDomainRules = GOOGLE_PROXY_DOMAINS.map((d) => "DOMAIN-SUFFIX," + d + "," + PROXY)
    const googleQuicDomainRules = GOOGLE_PROXY_DOMAINS.map((d) => "(DOMAIN-SUFFIX," + d + ")").join(",")

    // ---- 3. 规则 (丢弃订阅自带 rules) ----
    config.rules = [
        // 私网网段置顶直连 (防 ruleset 异步加载期间泄漏)
        "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
        "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
        "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
        "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
        "IP-CIDR6,::1/128,DIRECT,no-resolve",
        "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
        "IP-CIDR6,fe80::/10,DIRECT,no-resolve",

        // 公司/内网域名直连
        ...COMPANY_DOMAINS.map((d) => "DOMAIN-SUFFIX," + d + ",DIRECT"),

        // Windows 系统服务直连。Microsoft 365 / 登录 / OneDrive / Copilot 交给后续规则判断。
        "DOMAIN-SUFFIX,windows.com,DIRECT",
        "DOMAIN-SUFFIX,windows.net,DIRECT",
        "DOMAIN-SUFFIX,windowsupdate.com,DIRECT",
        "DOMAIN-SUFFIX,msftconnecttest.com,DIRECT",
        "DOMAIN-SUFFIX,msftncsi.com,DIRECT",
        "DOMAIN-SUFFIX,microsoftapp.net,DIRECT",
        "DOMAIN-SUFFIX,s-microsoft.com,DIRECT",
        "DOMAIN-SUFFIX,msedge.net,DIRECT",
        "DOMAIN-SUFFIX,msocdn.com,DIRECT",

        // 仅针对 Google/YouTube 阻断 QUIC(UDP 443)，避免全局 REJECT 误伤其他服务。
        // 必须放在 Google 代理规则之前，否则域名规则会先命中，QUIC 阻断不会生效。
        "AND,((NETWORK,udp),(DST-PORT,443),(OR,(" + googleQuicDomainRules + "))),REJECT",

        // Google / YouTube / Google AI 强制走节点，放在 applications 之前，避免被应用规则误判直连。
        ...googleDomainRules,

        // Discord 强制走节点 (修复: 否则 updates.discord.com 可能被 applications 规则误判直连、被墙超时)
        "DOMAIN-SUFFIX,discord.com," + PROXY,
        "DOMAIN-SUFFIX,discordapp.com," + PROXY,
        "DOMAIN-SUFFIX,discordapp.net," + PROXY,
        "DOMAIN-SUFFIX,discord.gg," + PROXY,
        "DOMAIN-SUFFIX,discord.media," + PROXY,
        "DOMAIN-SUFFIX,discordstatus.com," + PROXY,

        // L大规则集 (标准顺序: direct/cncidr 在 gfw/tld-not-cn 之前)
        "RULE-SET,applications,DIRECT",
        "RULE-SET,private,DIRECT",
        "RULE-SET,reject,REJECT",
        "RULE-SET,icloud,DIRECT",
        "RULE-SET,apple,DIRECT",
        "RULE-SET,google," + PROXY,
        "RULE-SET,proxy," + PROXY,
        "RULE-SET,direct,DIRECT",
        "RULE-SET,lancidr,DIRECT,no-resolve",
        "RULE-SET,cncidr,DIRECT,no-resolve",
        "RULE-SET,gfw," + PROXY,
        "RULE-SET,tld-not-cn," + PROXY,
        "RULE-SET,telegramcidr," + PROXY + ",no-resolve",
        "GEOIP,LAN,DIRECT,no-resolve",
        "GEOIP,CN,DIRECT",
        "MATCH," + PROXY,
    ]

    // ---- 4. DNS ----
    const dns = config.dns || {}
    if (dns.enable === undefined) dns.enable = true
    if (!dns["enhanced-mode"]) dns["enhanced-mode"] = "fake-ip"
    if (!dns["fake-ip-range"]) dns["fake-ip-range"] = "198.18.0.1/16"

    // 境外域名 → 谷歌 DNS。IP 直连 DoH + 末尾 #代理组 让查询走代理出口(防被墙、防污染)。
    dns.nameserver = [
        "https://8.8.8.8/dns-query#" + PROXY,
        "https://8.8.4.4/dns-query#" + PROXY,
    ]
    // 直连域名(国内/公司/内网) → DHCP 下发的系统 DNS
    dns["direct-nameserver"] = ["system://"]
    dns["direct-nameserver-follow-policy"] = false
    // 代理节点域名 & DoH 引导用国内 DNS 直接解析 (避免鸡生蛋)
    dns["default-nameserver"] = ["223.5.5.5", "119.29.29.29"]
    dns["proxy-server-nameserver"] = ["223.5.5.5", "119.29.29.29"]
    // 公司/内网域名排除 fake-ip，确保直连拿到真实内网 IP
    const filter = dns["fake-ip-filter"] || []
    for (const d of COMPANY_DOMAINS) {
        if (!filter.includes("+." + d)) filter.push("+." + d)
    }
    dns["fake-ip-filter"] = filter
    config.dns = dns

    // ---- 5. 关闭 WebRTC 防泄漏 ----
    config["webrtc"] = false

    return config
}