// CY groups-only v1.1 | 2026-09-18
// iOS Clash 挂上覆写脚本后，规则方案会变成「由覆写脚本接管」。
// 向导组配置时若还没 PROXY 组，指向 PROXY 的规则会被丢掉，内核就会在启动过程中被停止。
// 本脚本同时补 PROXY / AUTO，并写回 Verge 规则与规则集。
// 不要和 cy-rules.js 同时挂。精细分流用 All + cy-rules.js。

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
      "exclude-filter": "(?i)(剩余|剩餘|流量|到期|官网|官網|套餐|重置|公告|客服|traffic|expire|remaining|reset|PROXY|AUTO)",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      timeout: 5000,
      tolerance: 50,
      lazy: true
    }
  ];

  config["rule-providers"] = {
    reject: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
      path: "./rules/cy-ls-reject.yaml"
    },
    icloud: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
      path: "./rules/cy-ls-icloud.yaml"
    },
    apple: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
      path: "./rules/cy-ls-apple.yaml"
    },
    google: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
      path: "./rules/cy-ls-google.yaml"
    },
    proxy: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
      path: "./rules/cy-ls-proxy.yaml"
    },
    direct: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
      path: "./rules/cy-ls-direct.yaml"
    },
    private: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
      path: "./rules/cy-ls-private.yaml"
    },
    gfw: {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
      path: "./rules/cy-ls-gfw.yaml"
    },
    "tld-not-cn": {
      type: "http",
      behavior: "domain",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
      path: "./rules/cy-ls-tld-not-cn.yaml"
    },
    telegramcidr: {
      type: "http",
      behavior: "ipcidr",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
      path: "./rules/cy-ls-telegramcidr.yaml"
    },
    cncidr: {
      type: "http",
      behavior: "ipcidr",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
      path: "./rules/cy-ls-cncidr.yaml"
    },
    lancidr: {
      type: "http",
      behavior: "ipcidr",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
      path: "./rules/cy-ls-lancidr.yaml"
    },
    applications: {
      type: "http",
      behavior: "classical",
      format: "yaml",
      interval: 86400,
      url: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
      path: "./rules/cy-ls-applications.yaml"
    }
  };

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
    "DOMAIN-SUFFIX,brightdata.com,PROXY",
    "DOMAIN-SUFFIX,icanhazip.com,PROXY",
    "DOMAIN-SUFFIX,ippure.com,PROXY",
    "DOMAIN-SUFFIX,huinor.com,DIRECT",
    "DOMAIN-SUFFIX,huitone.com,DIRECT",
    "DOMAIN-SUFFIX,synology.me,DIRECT",
    "DOMAIN-SUFFIX,kunyi-gzzc.com,DIRECT",
    "DOMAIN-SUFFIX,kunyi-gz.com,DIRECT",
    "DOMAIN-SUFFIX,kunqi-dev.com,DIRECT",
    "DOMAIN-SUFFIX,kunqi-demo.com,DIRECT",
    "DOMAIN-SUFFIX,kunqi-test.com,DIRECT",
    "DOMAIN-SUFFIX,kunyi-pro,DIRECT",
    "DOMAIN-SUFFIX,kunqi-gz,DIRECT",
    "DOMAIN-SUFFIX,jiandui.online,DIRECT",
    "DOMAIN-SUFFIX,ooioo.work,DIRECT",
    "DOMAIN,login.live.com,DIRECT",
    "DOMAIN,account.live.com,DIRECT",
    "DOMAIN,login.microsoftonline.com,DIRECT",
    "DOMAIN,login.windows.net,DIRECT",
    "DOMAIN,sts.windows.net,DIRECT",
    "DOMAIN,clientconfig.passport.net,DIRECT",
    "DOMAIN-SUFFIX,msauth.net,DIRECT",
    "DOMAIN-SUFFIX,msftauth.net,DIRECT",
    "DOMAIN-SUFFIX,msauthimages.net,DIRECT",
    "DOMAIN-SUFFIX,msftauthimages.net,DIRECT",
    "DOMAIN-SUFFIX,microsoftonline-p.com,DIRECT",
    "DOMAIN-SUFFIX,windows.com,DIRECT",
    "DOMAIN-SUFFIX,windowsupdate.com,DIRECT",
    "DOMAIN-SUFFIX,msftconnecttest.com,DIRECT",
    "DOMAIN-SUFFIX,msftncsi.com,DIRECT",
    "DOMAIN-SUFFIX,microsoftapp.net,DIRECT",
    "DOMAIN-SUFFIX,s-microsoft.com,DIRECT",
    "DOMAIN-SUFFIX,msedge.net,DIRECT",
    "DOMAIN-SUFFIX,msocdn.com,DIRECT",
    "DOMAIN-SUFFIX,google.com,PROXY",
    "DOMAIN-SUFFIX,googleapis.com,PROXY",
    "DOMAIN-SUFFIX,gstatic.com,PROXY",
    "DOMAIN-SUFFIX,googleusercontent.com,PROXY",
    "DOMAIN-SUFFIX,ggpht.com,PROXY",
    "DOMAIN-SUFFIX,googlevideo.com,PROXY",
    "DOMAIN-SUFFIX,youtube.com,PROXY",
    "DOMAIN-SUFFIX,youtu.be,PROXY",
    "DOMAIN-SUFFIX,ytimg.com,PROXY",
    "DOMAIN-SUFFIX,youtubei.googleapis.com,PROXY",
    "DOMAIN-SUFFIX,youtube-nocookie.com,PROXY",
    "DOMAIN-SUFFIX,googleadservices.com,PROXY",
    "DOMAIN-SUFFIX,discord.com,PROXY",
    "DOMAIN-SUFFIX,discordapp.com,PROXY",
    "DOMAIN-SUFFIX,discordapp.net,PROXY",
    "DOMAIN-SUFFIX,discord.gg,PROXY",
    "DOMAIN-SUFFIX,discord.media,PROXY",
    "DOMAIN-SUFFIX,discordstatus.com,PROXY",
    "DOMAIN-SUFFIX,discordcdn.com,PROXY",
    "RULE-SET,applications,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,reject,REJECT",
    "RULE-SET,icloud,DIRECT",
    "RULE-SET,apple,DIRECT",
    "RULE-SET,google,PROXY",
    "RULE-SET,proxy,PROXY",
    "RULE-SET,direct,DIRECT",
    "RULE-SET,lancidr,DIRECT,no-resolve",
    "RULE-SET,cncidr,DIRECT,no-resolve",
    "RULE-SET,gfw,PROXY",
    "RULE-SET,tld-not-cn,PROXY",
    "RULE-SET,telegramcidr,PROXY,no-resolve",
    "GEOIP,LAN,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT",
    "MATCH,PROXY"
  ];

  config.mode = "rule";
  return config;
}
