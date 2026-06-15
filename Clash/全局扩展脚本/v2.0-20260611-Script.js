// Loyalsoldier 白名单分流 + 通用自动选最低延迟组（超时自动切换）
// 适用任何订阅：proxy 类规则指向脚本自建的 AUTO 组，不再依赖订阅自带的 "Proxy" 策略名
function main(config) {
  const AUTO = "⚡ 低延迟自动";

  // ===== 1) Loyalsoldier 规则集 =====
  const ld = (name, behavior) => ({
    type: "http", behavior,
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/" + name + ".txt",
    path: "./ruleset/" + name + ".yaml", interval: 86400,
  });
  config["rule-providers"] = Object.assign({}, config["rule-providers"], {
    reject: ld("reject", "domain"),
    icloud: ld("icloud", "domain"),
    apple: ld("apple", "domain"),
    google: ld("google", "domain"),
    proxy: ld("proxy", "domain"),
    direct: ld("direct", "domain"),
    private: ld("private", "domain"),
    telegramcidr: ld("telegramcidr", "ipcidr"),
    cncidr: ld("cncidr", "ipcidr"),
    lancidr: ld("lancidr", "ipcidr"),
    applications: ld("applications", "classical"),
  });

  // ===== 2) 一个通用自动组：纳入所有节点，测速选最低延迟，超时自动切换 =====
  const excludeFilter = "(?i)(到期|剩余|过期|有效期|官网|官方|订阅|套餐|重置|流量|距离|网址|客服|expire|traffic|reset)";
  const autoGroup = {
    name: AUTO, type: "url-test", "include-all": true, "exclude-filter": excludeFilter,
    url: "http://www.gstatic.com/generate_204", interval: 120, tolerance: 50, lazy: true,
  };
  config["proxy-groups"] = config["proxy-groups"] || [];
  const existing = new Set(config["proxy-groups"].map((g) => g && g.name));
  if (!existing.has(AUTO)) config["proxy-groups"] = [autoGroup].concat(config["proxy-groups"]);

  // ===== 3) 规则（Loyalsoldier 白名单，proxy 类指向 AUTO）=====
  config["rules"] = [
    "DOMAIN-SUFFIX,huinor.com,DIRECT",
    "DOMAIN-SUFFIX,huitone.com,DIRECT",
    "RULE-SET,applications,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,reject,REJECT",
    "RULE-SET,icloud,DIRECT",
    "RULE-SET,apple,DIRECT",
    "RULE-SET,google," + AUTO,
    "RULE-SET,proxy," + AUTO,
    "RULE-SET,direct,DIRECT",
    "RULE-SET,lancidr,DIRECT,no-resolve",
    "RULE-SET,cncidr,DIRECT,no-resolve",
    "RULE-SET,telegramcidr," + AUTO + ",no-resolve",
    "GEOIP,LAN,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT,no-resolve",
    "MATCH," + AUTO,
  ].concat(config["rules"] || []);

  // ===== 4) 内网 DNS（双保险，彻底绕开订阅可能自带的境外 DoH 兜底）=====
  const internalDomains = ["+.huinor.com", "+.huitone.com"];
  config.dns = config.dns || {};
  if (config.dns.enable === undefined) config.dns.enable = true;

  // (a) 直连域名一律用当前网络的系统 DNS 解析（内网域名命中直连规则 → 走内网 DNS）
  //     这是最可靠的一层：绕开 nameserver-policy 里的 geosite:!cn 境外 DoH 兜底
  if (config.dns["direct-nameserver"] === undefined ||
    (Array.isArray(config.dns["direct-nameserver"]) && config.dns["direct-nameserver"].length === 0)) {
    config.dns["direct-nameserver"] = ["system://"];
  }
  config.dns["direct-nameserver-follow-policy"] = false;

  // (b) 再加一层 nameserver-policy，内网域名放最前（通配域名优先级高于 geosite）
  const policy = {};
  for (const d of internalDomains) policy[d] = "system://";
  config.dns["nameserver-policy"] = Object.assign({}, policy, config.dns["nameserver-policy"]);

  // (c) fake-ip 模式下让内网域名拿真实 IP（redir-host 模式下无害）
  const fif = Array.isArray(config.dns["fake-ip-filter"]) ? config.dns["fake-ip-filter"].slice() : [];
  for (const d of internalDomains) if (!fif.includes(d)) fif.push(d);
  config.dns["fake-ip-filter"] = fif;

  return config;
}