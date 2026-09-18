// CY groups-only v1.2 | 2026-09-18
// 不再在启动时拉 13 个远程规则集，也不写 GEOIP,LAN（mihomo 不认这个码，会拒绝配置导致隧道被停）。
// 精细分流仍用 All + cy-rules.js。

function main(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("CY: 配置无效");
  }

  config["proxy-groups"] = [
    {
      name: "PROXY",
      type: "select",
      proxies: ["AUTO", "DIRECT"]
    },
    {
      name: "AUTO",
      type: "url-test",
      "include-all": true,
      "exclude-filter": "(剩余|剩餘|流量|到期|官网|官網|套餐|重置|公告|客服|traffic|expire|remaining|reset)",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      timeout: 5000,
      tolerance: 50,
      lazy: true
    }
  ];

  config["rule-providers"] = {};

  config.rules = [
    "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
    "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
    "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
    "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
    "IP-CIDR6,::1/128,DIRECT,no-resolve",
    "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
    "IP-CIDR6,fe80::/10,DIRECT,no-resolve",
    "DOMAIN-SUFFIX,huinor.com,DIRECT",
    "DOMAIN-SUFFIX,huitone.com,DIRECT",
    "DOMAIN-SUFFIX,synology.me,DIRECT",
    "DOMAIN-SUFFIX,kunyi-gzzc.com,DIRECT",
    "DOMAIN-SUFFIX,kunyi-gz.com,DIRECT",
    "DOMAIN-SUFFIX,kunqi-dev.com,DIRECT",
    "DOMAIN-SUFFIX,kunqi-demo.com,DIRECT",
    "DOMAIN-SUFFIX,kunqi-test.com,DIRECT",
    "DOMAIN-SUFFIX,jiandui.online,DIRECT",
    "DOMAIN-SUFFIX,ooioo.work,DIRECT",
    "DOMAIN,login.live.com,DIRECT",
    "DOMAIN,login.microsoftonline.com,DIRECT",
    "DOMAIN-SUFFIX,msauth.net,DIRECT",
    "DOMAIN-SUFFIX,msftauth.net,DIRECT",
    "DOMAIN-SUFFIX,windows.com,DIRECT",
    "DOMAIN-SUFFIX,apple.com,DIRECT",
    "DOMAIN-SUFFIX,icloud.com,DIRECT",
    "DOMAIN-SUFFIX,icloud-content.com,DIRECT",
    "DOMAIN-SUFFIX,cdn-apple.com,DIRECT",
    "DOMAIN-SUFFIX,google.com,PROXY",
    "DOMAIN-SUFFIX,googleapis.com,PROXY",
    "DOMAIN-SUFFIX,gstatic.com,PROXY",
    "DOMAIN-SUFFIX,youtube.com,PROXY",
    "DOMAIN-SUFFIX,youtu.be,PROXY",
    "DOMAIN-SUFFIX,googlevideo.com,PROXY",
    "DOMAIN-SUFFIX,discord.com,PROXY",
    "DOMAIN-SUFFIX,discordapp.com,PROXY",
    "DOMAIN-SUFFIX,x.com,PROXY",
    "DOMAIN-SUFFIX,twitter.com,PROXY",
    "GEOIP,CN,DIRECT",
    "MATCH,PROXY"
  ];

  config.mode = "rule";
  return config;
}
