// ===== Loyalsoldier 全局覆写脚本 v5.9（Microsoft 登录修正版）=====
// [v5.9] Microsoft Account / WAM / Edge / Store 身份认证域名统一 DIRECT，修复 Edge 登录
//   个人账号出现 0x80190001；删除过宽的 windows.net 直连规则，其他微软业务仍交给规则集判断。
// [v5.8] Google 服务继续走节点；QUIC 阻断收窄到 Google/YouTube；IPv6 私网规则改用
//   IP-CIDR6；DNS 补齐 fake-ip 模式和地址范围。
// [v5.7] 修复 Google AI IDE 域名被 applications 规则误判直连。
//
// [v5.6] 修复"未入名单的国内.com被误走节点":
//   原 GEOIP,CN 带 no-resolve → 域名未解析时跳过此条、掉到 MATCH 走节点。
//   去掉 no-resolve, 让兜底域名解析后按 IP 归属判定，国内 IP 直连。
//
// [v5.5] Discord 域名置于 applications 之前，避免更新被误判直连。
// [v5.4] 单组手动选点，关闭自动切换。
// 思路: ①只用 L大规则 ②公司/国内/系统服务按需直连 ③境外 DNS 经代理
//   ④单组手动选点 ⑤Microsoft 身份认证保持同一 DIRECT 出口
// 备注: Microsoft Store 的 UWP loopback 问题与本脚本的域名分流无关。
const PROXY = "⚡ 节点选择"
// 公司/内网域名: 一律直连，解析交给 DHCP / 系统 DNS。新增直接加到这里。
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
    "jiandui.online",
    "ooioo.work",
]
// Microsoft 身份认证域名: 保持同一 DIRECT 出口，不扩大到整个微软生态。
// 必须精确匹配的认证主机
const MICROSOFT_AUTH_DOMAINS = [
    "login.live.com",
    "account.live.com",
    "login.microsoftonline.com",
    "login.windows.net",
    "sts.windows.net",
    "clientconfig.passport.net",
]

// 整个后缀均属于或高度关联 Microsoft 身份认证
const MICROSOFT_AUTH_SUFFIXES = [
    "msauth.net",
    "msftauth.net",
    "msauthimages.net",
    "msftauthimages.net",
    "microsoftonline-p.com",
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
    // ---- 0. 多 IP 并发建连，减少首连卡顿 ----
    config["tcp-concurrent"] = true
    // ---- 1. 单组手动选择，选定后不自动切换 ----
    config["proxy-groups"] = [
        {
            name: PROXY,
            type: "select",
            "include-all": true,
            "exclude-filter":
                "(?i)(到期|剩余|过期|有效期|官网|官方|订阅|套餐|重置|流量|距离|网址|客服|expire|traffic|reset)",
        },
    ]
    // ---- 2. Loyalsoldier 规则集 ----
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
    const microsoftAuthDomainRules = MICROSOFT_AUTH_DOMAINS.map((d) => "DOMAIN," + d + ",DIRECT")

    const microsoftAuthSuffixRules = MICROSOFT_AUTH_SUFFIXES.map((d) => "DOMAIN-SUFFIX," + d + ",DIRECT")
    // ---- 3. 主规则，丢弃订阅自带 rules ----
    config.rules = [
        // 私网网段置顶直连，防止 ruleset 异步加载期间泄漏。
        "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
        "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
        "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
        "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",

        "IP-CIDR6,::1/128,DIRECT,no-resolve",
        "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
        "IP-CIDR6,fe80::/10,DIRECT,no-resolve",
        // 公司/内网域名直连。
        ...COMPANY_DOMAINS.map((d) => "DOMAIN-SUFFIX," + d + ",DIRECT"),
        // Microsoft 身份认证须位于 proxy / gfw 之前，以保持 DIRECT 出口一致。
        ...microsoftAuthDomainRules,
        ...microsoftAuthSuffixRules,
        // Windows 基础服务直连；不含范围过大的 windows.net。
        "DOMAIN-SUFFIX,windows.com,DIRECT",
        "DOMAIN-SUFFIX,windowsupdate.com,DIRECT",
        "DOMAIN-SUFFIX,msftconnecttest.com,DIRECT",
        "DOMAIN-SUFFIX,msftncsi.com,DIRECT",
        "DOMAIN-SUFFIX,microsoftapp.net,DIRECT",
        "DOMAIN-SUFFIX,s-microsoft.com,DIRECT",

        // Edge 基础服务/CDN 保持直连，以账号稳定性优先。
        "DOMAIN-SUFFIX,msedge.net,DIRECT",

        // Office CDN 保持原 v5.8 行为
        "DOMAIN-SUFFIX,msocdn.com,DIRECT",
        // 仅阻断 Google/YouTube 的 QUIC，强制回退 TCP；须放在其代理规则之前。
        "AND,((NETWORK,udp),(DST-PORT,443),(OR,(" + googleQuicDomainRules + "))),REJECT",
        // Google / YouTube / Google AI 强制走节点。
        ...googleDomainRules,
        // Discord 强制走节点，避免被 applications 规则误判直连。
        "DOMAIN-SUFFIX,discord.com," + PROXY,
        "DOMAIN-SUFFIX,discordapp.com," + PROXY,
        "DOMAIN-SUFFIX,discordapp.net," + PROXY,
        "DOMAIN-SUFFIX,discord.gg," + PROXY,
        "DOMAIN-SUFFIX,discord.media," + PROXY,
        "DOMAIN-SUFFIX,discordstatus.com," + PROXY,
        "DOMAIN-SUFFIX,discordcdn.com," + PROXY,
        // Loyalsoldier 标准顺序: direct/cncidr 在 gfw/tld-not-cn 之前。
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
        // GEOIP / 最终兜底。
        "GEOIP,LAN,DIRECT,no-resolve",

        // 不加 no-resolve，使未命中域名规则的请求可按 CN IP 判断。
        "GEOIP,CN,DIRECT",

        // 其余全部走手动选择的节点
        "MATCH," + PROXY,
    ]
    // ---- 4. DNS ----
    const dns = config.dns || {}

    if (dns.enable === undefined) {
        dns.enable = true
    }

    if (!dns["enhanced-mode"]) {
        dns["enhanced-mode"] = "fake-ip"
    }

    if (!dns["fake-ip-range"]) {
        dns["fake-ip-range"] = "198.18.0.1/16"
    }
    // 境外 DNS 经代理，避免污染和国内直连 Google DNS。
    dns.nameserver = ["https://8.8.8.8/dns-query#" + PROXY, "https://8.8.4.4/dns-query#" + PROXY]
    // DIRECT 流量使用系统/DHCP DNS，保持 DNS 与实际出口一致。
    dns["direct-nameserver"] = ["system://"]

    dns["direct-nameserver-follow-policy"] = false
    // 代理节点域名及 DoH 引导使用国内 DNS，避免循环依赖。
    dns["default-nameserver"] = ["223.5.5.5", "119.29.29.29"]

    dns["proxy-server-nameserver"] = ["223.5.5.5", "119.29.29.29"]
    // 公司/内网域名排除 fake-ip；微软认证仍由域名规则识别，不扩大排除范围。
    const filter = dns["fake-ip-filter"] || []

    for (const d of COMPANY_DOMAINS) {
        const item = "+." + d

        if (!filter.includes(item)) {
            filter.push(item)
        }
    }

    dns["fake-ip-filter"] = filter

    config.dns = dns
    // ---- 5. 关闭 WebRTC 防泄漏 ----
    config["webrtc"] = false

    return config
}
