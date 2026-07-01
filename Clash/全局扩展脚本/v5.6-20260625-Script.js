// ===== Loyalsoldier 全局覆写脚本 v5.6（精简手动版）=====
// [v5.6] 修复"未入名单的国内.com被误走节点": 原 GEOIP,CN 带 no-resolve → 域名未解析时跳过此条、
//   掉到 MATCH 走节点。去掉 no-resolve, 让兑底域名解析后按 IP 归属判定, 国内 IP 直连。
// [v5.5] 修复 Discord 更新不动: discord 域名被 L大 applications 规则误判直连→被墙。
//   已加最高优先级规则强制 discord 走节点。
// [v5.4] 纯手动选点: 代理组 select, 你选哪个就一直用哪个, 绝不自动切换。
//   节点坏了也由你自己换。已去掉 unified-delay, 延迟数字为常态口径。
//   注: "测速全部"会同时测 300+ 节点、互相挤带宽 → 全部假高(~2400ms), 那不是真延迟; 想看真延迟就单独点某个节点测。
// 思路: ①只用 L大规则 ②直连走 DHCP 系统 DNS ③境外走谷歌 DNS(经代理) ④单组自动选最快
// [稳定性] 针对"同一节点要刷几次才能打开":
//   - tcp-concurrent: 多 IP 并发拨号, 哪个先通用哪个 → 大幅减少首连超时
//   - 阻断 QUIC(UDP 443): YouTube/Google 等走代理时 QUIC 极易超时, 强制回退到更稳的 TCP
// 备注: Store 打不开的根因是 UWP loopback(跑 fix-store-loopback.bat), 与本脚本无关。

const PROXY = "⚡ 节点选择"

// 公司/内网域名: 一律直连, 解析交给 DHCP 系统 DNS。新增直接加到这里。
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

function main(config) {
    if (!config || typeof config !== "object") config = {}

    // ---- 0. 速度开关: 多 IP 并发建连 (哪个先通用哪个, 减少首连卡顿) ----
    config["tcp-concurrent"] = true

    // ---- 1. 代理组: 单组, 纯手动选择 (选定即锁定, 绝不自动切换) ----
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

    // ---- 3. 规则 (丢弃订阅自带 rules) ----
    config.rules = [
        // 私网网段置顶直连 (防 ruleset 异步加载期间泄漏)
        "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
        "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
        "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
        "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
        "IP-CIDR,::1/128,DIRECT,no-resolve",
        "IP-CIDR,fc00::/7,DIRECT,no-resolve",
        "IP-CIDR,fe80::/10,DIRECT,no-resolve",

        // 阻断 QUIC(UDP 443): 强制 YouTube/Google 等走更稳的 TCP, 修"需多次刷新才打开"
        "AND,((NETWORK,udp),(DST-PORT,443)),REJECT",

        // 公司/内网域名直连
        ...COMPANY_DOMAINS.map((d) => "DOMAIN-SUFFIX," + d + ",DIRECT"),

        // 微软/Windows 系统服务直连 (否则 .com/.net 被 tld-not-cn 误判走代理, 拖慢 Windows/Store)
        "DOMAIN-SUFFIX,microsoft.com,DIRECT",
        "DOMAIN-SUFFIX,windows.com,DIRECT",
        "DOMAIN-SUFFIX,windows.net,DIRECT",
        "DOMAIN-SUFFIX,windowsupdate.com,DIRECT",
        "DOMAIN-SUFFIX,microsoftonline.com,DIRECT",
        "DOMAIN-SUFFIX,live.com,DIRECT",
        "DOMAIN-SUFFIX,office.com,DIRECT",
        "DOMAIN-SUFFIX,office.net,DIRECT",
        "DOMAIN-SUFFIX,msftconnecttest.com,DIRECT",
        "DOMAIN-SUFFIX,msftncsi.com,DIRECT",
        "DOMAIN-SUFFIX,microsoftapp.net,DIRECT",
        "DOMAIN-SUFFIX,s-microsoft.com,DIRECT",
        "DOMAIN-SUFFIX,msedge.net,DIRECT",
        "DOMAIN-SUFFIX,msocdn.com,DIRECT",

        // Discord 强制走节点 (修复: 否则 updates.discord.com 会被 L大 applications 规则误判为直连、被墙超时)
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
    // 公司/内网域名排除 fake-ip, 确保直连拿到真实内网 IP
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
