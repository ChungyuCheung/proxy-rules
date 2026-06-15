// ===== Loyalsoldier 全局覆写脚本（v4.3 优化版）=====
// [v4.3 修复] 内网域名 502: 内网域名需用企业 DNS(system://) 解析才能拿到内网 IP,
//   否则被公共 DNS(223.5.5.5) 解析到对外公网网关 → 后端不通 502。
//   现在统一用顶部 INTERNAL_DOMAINS 同时生成: 直连规则 + system:// 解析 + 排除 fake-ip。
// [重要] Microsoft Store 打不开的真正根因 = UWP 沙箱禁止访问本地代理端口(127.0.0.1),
//   与分流/DNS 无关。必须在系统侧执行 loopback 豁免 (管理员运行 fix-store-loopback.bat):
//     CheckNetIsolation LoopbackExempt -a -n=Microsoft.WindowsStore_8wekyb3d8bbwe
// [v4.2 优化] 移除过宽的 msedgewebview2.exe 直连规则(误伤其它 WebView2 应用)
// [保留] (1) direct 规则集提到 gfw/tld-not-cn 之前 (恢复 Loyalsoldier 标准顺序)
//        (2) 硬编码微软/Windows 系统域名直连
//        (3) 直连 DNS 由 system:// 改为 223.5.5.5/119.29.29.29 (修复 couldn't find ip)
// 1. 丢弃每个订阅自带的成千上万条 rules（治闪退根因）
// 2. 统一用 Loyalsoldier(L大) 规则集分流，并换用稳定的 jsDelivr 加速源
// 3. 自动聚合所有节点，选延迟最低的，超时自动切换
// 4. 本地回环/内网域名直连，Proxifier 走代理，内网 DNS 不外泄
// 5. 补齐私网 IP-CIDR 防泄漏，防御性拦截 WebRTC

const PROXY = "⚡ Slipstream"

// 内网/公司域名: 两类都会自动 (1)直连 (2)用 system:// 跟随当前网络的 DNS 解析 (3)排除 fake-ip。
// system:// = 用操作系统当前网络的 DNS, 所以会随地点自动切换:
//   公司内网 → 公司 DNS → 内网 IP(快);  在家 → 家用/ISP DNS。
//
// [双解析] 公司内外都能访问: 公司解内网IP(快), 在家解公网IP(可用)。
const SPLIT_DNS_DOMAINS = ["huinor.com", "huitone.com"]
// [纯内网] 仅公司 DNS 可解析; 在家解析不到属正常, 无法访问。
const INTERNAL_ONLY_DOMAINS = [
    "kunyi-gzzc.com",
    "huinor.com",
    "huitone.com",
    "synology.me",
    "kunyi-gzzc.com",
    "kunyi-pro",
    "kunyi-gz.com",
    "kunqi-dev.com",
    "kunqi-demo.com",
    "kunqi-test.com",
    "kunqi-gz",
]
// 合并: 两类的直连/DNS/fake-ip 处理完全一致 (差别只在能否在家解析到)。新增域名按类别加到上面列表。
const INTERNAL_DOMAINS = [...SPLIT_DNS_DOMAINS, ...INTERNAL_ONLY_DOMAINS]

function main(config) {
    if (!config || typeof config !== "object") config = {}

    // ---- 1. 代理组：聚合所有节点，自动选延迟最低，超时剔除 ----
    config["proxy-groups"] = [
        {
            name: PROXY,
            type: "url-test",
            "include-all": true,
            "exclude-filter": "(?i)(到期|剩余|过期|有效期|官网|官方|订阅|套餐|重置|流量|距离|网址|客服|expire|traffic|reset)",
            url: "http://www.gstatic.com/generate_204",
            interval: 300,
            tolerance: 100,
            lazy: true,
        },
    ]

    // ---- 2. Loyalsoldier 规则集 (CDN 换成更稳定的 testingcf) ----
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

    // ---- 3. 规则：完全替换，丢弃订阅自带 rules ----
    config.rules = [
        // 核心私网网段置顶 (硬编码直连，防止 rule-providers 异步加载期间请求泄漏到匹配代理)
        "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
        "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
        "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
        "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
        "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
        "IP-CIDR,::1/128,DIRECT,no-resolve",
        "IP-CIDR,fc00::/7,DIRECT,no-resolve",
        "IP-CIDR,fe80::/10,DIRECT,no-resolve",

        // 核心程序分流
        "PROCESS-NAME,Proxifier.exe," + PROXY,

        // Microsoft Store 主进程直连 (catalog/授权接口)
        // 注: Store 打不开的根因是 UWP 沙箱无法访问本地代理端口,
        //     真正修复需在系统侧添加 loopback 豁免 (见 fix-store-loopback.bat);
        //     此处仅保证 Store 经代理时走直连。已移除过宽的 msedgewebview2.exe 直连
        "PROCESS-NAME,WinStore.App.exe,DIRECT",

        // AI 服务核心域名置顶，分流到 PROXY
        // OpenAI / ChatGPT
        "DOMAIN-SUFFIX,chatgpt.com," + PROXY,
        "DOMAIN-SUFFIX,openai.com," + PROXY,
        "DOMAIN-SUFFIX,oaiusercontent.com," + PROXY,
        "DOMAIN-SUFFIX,oaistatic.com," + PROXY,
        "DOMAIN-SUFFIX,sora.com," + PROXY,
        // Anthropic / Claude
        "DOMAIN-SUFFIX,anthropic.com," + PROXY,
        "DOMAIN-SUFFIX,claude.ai," + PROXY,
        // Google Gemini
        "DOMAIN-SUFFIX,gemini.google," + PROXY,
        "DOMAIN-SUFFIX,gemini.google.com," + PROXY,
        "DOMAIN-SUFFIX,generativelanguage.googleapis.com," + PROXY,
        "DOMAIN-SUFFIX,proactivebackend-pa.googleapis.com," + PROXY,
        "DOMAIN-SUFFIX,alkalimena-pa.clients6.google.com," + PROXY,
        // xAI / Grok
        "DOMAIN-SUFFIX,x.ai," + PROXY,
        "DOMAIN-SUFFIX,grok.com," + PROXY,
        // Microsoft Copilot
        "DOMAIN-SUFFIX,copilot.microsoft.com," + PROXY,
        // Perplexity
        "DOMAIN-SUFFIX,perplexity.ai," + PROXY,

        // 公司及内部域名直连 (来自顶部 INTERNAL_DOMAINS, 统一维护)
        ...INTERNAL_DOMAINS.map((d) => "DOMAIN-SUFFIX," + d + ",DIRECT"),

        // Microsoft Store / Windows 系统服务直连 (修复 Store 初始化失败)
        // 注: copilot.microsoft.com 已在上方 AI 区块走代理, 优先级更高不受影响
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
        "DOMAIN-SUFFIX,xboxlive.com,DIRECT",
        // Store 前端/CDN (日志显示 microsoftapp.net 被 proxy 规则集误判走代理)
        "DOMAIN-SUFFIX,microsoftapp.net,DIRECT",
        "DOMAIN-SUFFIX,s-microsoft.com,DIRECT",
        "DOMAIN-SUFFIX,msedge.net,DIRECT",
        "DOMAIN-SUFFIX,msocdn.com,DIRECT",

        // 规则集匹配
        "RULE-SET,applications,DIRECT",
        "RULE-SET,private,DIRECT",
        "RULE-SET,reject,REJECT",
        "RULE-SET,icloud,DIRECT",
        "RULE-SET,apple,DIRECT",
        "RULE-SET,google," + PROXY,
        "RULE-SET,proxy," + PROXY,
        // [v4.1] direct/cncidr 提前到 gfw/tld-not-cn 之前, 否则非 .cn 的直连域名(微软等)会被 tld-not-cn 误判走代理
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

    // ---- 4. DNS 与网络：内网域名走系统解析，避免泄漏到境外 DoH ----
    const dns = config.dns || {}
    if (dns.enable === undefined) dns.enable = true
    // [v4.1 修复] 直连 DNS 原为 system://, Clash 内置 DNS 解析直连域名时返回空
    //   (日志: DIRECT 域名 dns resolve failed couldn't find ip, 与是否 TUN 无关)
    //   → 改为明确的国内公共 DNS
    dns["direct-nameserver"] = ["223.5.5.5", "119.29.29.29"]
    dns["direct-nameserver-follow-policy"] = true
    // 兑底保险: 若订阅未提供 nameserver, 补上默认解析器
    if (!dns.nameserver || !dns.nameserver.length) {
        dns.nameserver = ["223.5.5.5", "119.29.29.29", "tls://223.5.5.5:853"]
    }
    // 内网域名用企业 DNS(system://) 解析, 并排除 fake-ip, 防公共 DNS 解析到错误 IP 导致 502
    const policy = dns["nameserver-policy"] || {}
    const filter = dns["fake-ip-filter"] || []
    for (const d of INTERNAL_DOMAINS) {
        policy["+." + d] = "system://"
        if (!filter.includes("+." + d)) filter.push("+." + d)
    }
    dns["nameserver-policy"] = policy
    dns["fake-ip-filter"] = filter
    config.dns = dns

    // ---- 5. 禁用 内置 WebRTC 泄漏 ----
    config["webrtc"] = false

    return config
}
