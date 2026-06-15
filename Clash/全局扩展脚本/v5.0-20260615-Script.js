// ===== Loyalsoldier 全局覆写脚本 v5.0（精简版）=====
//   ① 丢弃订阅自带的海量 rules, 统一用 L大(Loyalsoldier) 规则集分流
//   ② 直连域名(国内/内网) → DHCP 下发的系统 DNS (system://)
//   ③ 境外域名 → 谷歌 DNS (经代理出口, 防污染防被墙)
//   ④ 单一代理组, 自动选延迟最低, 不分组
//
// 两点必要说明:
// - 内网域名(COMPANY_DOMAINS)必须显式直连: 否则 .com 会被 tld-not-cn 误判走代理 → 不通。
//   (DHCP DNS 只决定"解析成什么 IP", 不决定"走直连还是代理"; 路由由规则决定。)
// - Microsoft Store 打不开的根因是 UWP 沙箱禁止访问本地代理端口, 需系统侧 loopback 豁免 (管理员运行 fix-store-loopback.bat), 与本脚本无关。

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

    // ---- 1. 代理组: 单组, 自动选延迟最低 (不分组) ----
    config["proxy-groups"] = [
        {
            name: PROXY,
            type: "url-test",
            "include-all": true,
            "exclude-filter":
                "(?i)(到期|剩余|过期|有效期|官网|官方|订阅|套餐|重置|流量|距离|网址|客服|expire|traffic|reset)",
            url: "http://www.gstatic.com/generate_204",
            interval: 600,
            tolerance: 150,
            lazy: true,
        },
    ]

    // ---- 2. L大规则集 (CDN 用稳定的 testingcf) ----
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

        // 公司/内网域名直连
        ...COMPANY_DOMAINS.map((d) => "DOMAIN-SUFFIX," + d + ",DIRECT"),

        // 微软/Windows 系统服务直连 (否则 .com/.net 会被 tld-not-cn 误判走代理, 影响 Windows/Store)
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
        "GEOIP,CN,DIRECT,no-resolve",
        "MATCH," + PROXY,
    ]

    // ---- 4. DNS ----
    const dns = config.dns || {}
    if (dns.enable === undefined) dns.enable = true
    // 境外域名 → 谷歌 DNS。用 IP 直连 DoH + 末尾 #代理组 让查询走代理出口,
    //   否则国内直连 8.8.8.8 会被封 → 解析超时 → 外网变慢/需多次刷新。
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