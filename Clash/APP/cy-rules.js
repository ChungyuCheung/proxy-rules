// CY 分流脚本 v2.4 | Author: ChungyuCheung | 2026-09-18
// 依据 https://clash.md/zh/guide/config/best-practice
// 沿用当前配置的节点、节点来源、DNS、TUN；无需再填写订阅。
// 用法：配置详情 → 覆写脚本 → 用 raw URL 导入，保存并选中。
//
// v2.4
// - 取消全局 UDP/443 REJECT（iOS 上 HTTP/3 超时再回退 TCP，表现为上不了网或极慢），只拦 Google/YouTube QUIC。
// - MATCH 直接进 CY 稳定自动，不再因手动锁死的坏节点而断网。
// - 保留 PROXY 组（指向稳定自动），规则库 MATCH,PROXY 不会空指向。
// v2.3.1 修复 (?i) 正则；v2.3 去掉空地区组；v2.2 稳定自动。
const INFO_FILTER = "(?i)(剩余|剩餘|流量|到期|官网|官網|套餐|重置|公告|客服|traffic|expire|remaining|reset)";
const TEST_URL = "https://www.gstatic.com/generate_204";

const G_SELECT = "CY 节点选择";
const G_STABLE = "CY 稳定自动";
const G_PROXY = "PROXY";
const G_PH = "CY 🇵🇭 菲律宾最快";
const G_TW = "CY 🇹🇼 台湾最快";
const G_UK = "CY 🇬🇧 英国最快";
const G_EU = "CY 🇪🇺 欧盟最快";
const G_BYBIT = "CY Bybit";

const F_PH = "(?i)^.*(🇵🇭|菲律宾|菲律賓|马尼拉|馬尼拉|宿务|宿霧|\\b((PH|PHL|MNL|CEB|Philippines|Manila|Cebu)([-_ ]?[0-9]+)?)\\b).*$";
const F_TW = "(?i)^.*(🇹🇼|台湾|台灣|臺灣|台北|臺北|台中|臺中|高雄|新北|桃园|桃園|\\b((TW|TWN|TPE|TSA|KHH|Taiwan|Taipei|Taichung|Kaohsiung)([-_ ]?[0-9]+)?)\\b).*$";
const F_UK = "(?i)^.*(🇬🇧|英国|英國|伦敦|倫敦|曼彻斯特|曼徹斯特|\\b((UK|GB|GBR|LHR|LGW|MAN|London|Manchester)([-_ ]?[0-9]+)?|United Kingdom|Britain)\\b).*$";
const F_EU = "(?i)^.*(🇪🇺|欧盟|歐盟|欧洲|歐洲|荷兰|荷蘭|德国|德國|法国|法國|爱尔兰|愛爾蘭|奥地利|奧地利|比利时|比利時|西班牙|意大利|義大利|法兰克福|法蘭克福|阿姆斯特丹|巴黎|都柏林|维也纳|維也納|\\b((EU|EUR|NL|NLD|DE|DEU|FR|FRA|IE|IRL|AT|AUT|BE|BEL|ES|ESP|IT|ITA|AMS|CDG|DUB|VIE|MAD|BCN)([-_ ]?[0-9]+)?)\\b|Netherlands|Germany|France|Ireland|Austria|Belgium|Amsterdam|Frankfurt|Paris|Dublin).*$";
const F_STABLE = "(?i)^.*(🇹🇼|🇭🇰|🇸🇬|🇯🇵|台湾|台灣|臺灣|台北|臺北|台中|臺中|高雄|新北|桃园|桃園|香港|新加坡|狮城|獅城|日本|东京|東京|大阪|名古屋|Taiwan|Taipei|Hong Kong|HongKong|Singapore|Japan|Tokyo|Osaka|\\b((TW|TWN|HK|HKG|SG|SGP|JP|JPN|TPE|TSA|KHH|SIN|NRT|HND|KIX|NGO)([-_ ]?[0-9]+)?)\\b).*$";

const COMPANY_DOMAINS = [
  "huitone.com",
  "huinor.com",
  "synology.me",
  "kunyi-gzzc.com",
  "kunyi-gz.com",
  "kunqi-dev.com",
  "kunqi-demo.com",
  "kunqi-test.com",
  "kunyi-pro",
  "kunqi-gz",
  "jiandui.online",
  "ooioo.work"
];

const MEXC_SUFFIX = [
  "mexc.com", "mexc.link", "mexc.app", "mexc.live", "mexc.zone",
  "mxc.com", "mxc.ai", "mexc-api.com", "mexcapi.com", "mexccdn.com", "mxcapi.com"
];

const BYBIT_EU_SUFFIX = ["bybit.eu", "bybit.nl"];
const BYBIT_EU_EXACT = ["api.bybit.eu", "testnet.bybit.eu", "www.bybit.eu"];
const BYBIT_GLOBAL_SUFFIX = [
  "bybit.com", "bybit.global", "bybit.biz", "bybit.cloud",
  "bybit-global.com", "bybitglobal.com", "bytick.com",
  "bybit.tr", "bybit-tr.com", "bybit.kz", "bybitgeorgia.ge",
  "bybit.ae", "bybit.id", "byhkbit.com"
];
const BYBIT_GLOBAL_EXACT = ["bybit-exchange.github.io", "bybit.ada.support"];
const BYBIT_SHARED_SUFFIX = [
  "byapis.com", "bycsi.com", "bycbe.com", "bymj.io", "byffbb.com",
  "bybit-aws.com", "bybdc6.com", "byabcde.com", "byapps.net",
  "byd3c3.com", "bybits.org"
];
const PAYPAL_SUFFIX = ["paypal.com", "paypalobjects.com", "paypal.me"];
const AI_SUFFIX = [
  "chatgpt.com", "openai.com", "openaiapi.com", "oaiusercontent.com", "oaistatic.com",
  "sora.com", "ai.com", "anthropic.com", "claude.ai", "claudeusercontent.com",
  "gemini.google.com", "aistudio.google.com", "makersuite.google.com", "notebooklm.google.com",
  "generativelanguage.googleapis.com", "proactivebackend-pa.googleapis.com",
  "x.ai", "grok.com", "githubcopilot.com", "github.com", "githubusercontent.com",
  "perplexity.ai", "poe.com", "quora.com", "cursor.com", "cursor.sh", "cursorapi.com",
  "huggingface.co", "hf.co", "hf.space", "cdn-lfs.huggingface.co",
  "mistral.ai", "meta.ai", "you.com", "phind.com", "character.ai",
  "replicate.com", "together.ai", "cohere.com", "groq.com", "fireworks.ai"
];
const AI_EXACT = ["copilot.microsoft.com", "alkalimena-pa.clients6.google.com"];
const GOOGLE_QUIC = [
  "google.com", "googleapis.com", "gstatic.com", "googleusercontent.com",
  "ggpht.com", "googlevideo.com", "youtube.com", "youtu.be", "ytimg.com",
  "youtubei.googleapis.com", "youtube-nocookie.com", "googleadservices.com"
];

function urlTestGroup(name, filter, interval, tolerance) {
  return {
    name: name,
    type: "url-test",
    url: TEST_URL,
    interval: interval || 600,
    timeout: 5000,
    tolerance: tolerance == null ? 50 : tolerance,
    filter: filter,
    "exclude-filter": INFO_FILTER,
    "include-all": true
  };
}

function clashToJsRegExp(filter) {
  var src = String(filter || "");
  var flags = "";
  if (src.indexOf("(?i)") === 0) {
    src = src.slice(4);
    flags = "i";
  }
  src = src.split("(?i)").join("");
  try {
    return new RegExp(src, flags);
  } catch (e) {
    return null;
  }
}

function usableNodeNames(config) {
  const reInfo = clashToJsRegExp(INFO_FILTER);
  const list = Array.isArray(config.proxies) ? config.proxies : [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const n = list[i] && list[i].name;
    if (n && (!reInfo || !reInfo.test(n))) out.push(n);
  }
  return out;
}

function filterHasNodes(names, filter) {
  const re = clashToJsRegExp(filter);
  if (!re) return false;
  for (let i = 0; i < names.length; i++) {
    if (re.test(names[i])) return true;
  }
  return false;
}

function blockQuicThen(matcher, policy) {
  return [
    "AND,((NETWORK,udp),(DST-PORT,443),(" + matcher + ")),REJECT",
    matcher + "," + policy
  ];
}

function suffixRules(list, policy) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    Array.prototype.push.apply(out, blockQuicThen("DOMAIN-SUFFIX," + list[i], policy));
  }
  return out;
}

function exactRules(list, policy) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    Array.prototype.push.apply(out, blockQuicThen("DOMAIN," + list[i], policy));
  }
  return out;
}

function keywordRules(list, policy) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    Array.prototype.push.apply(out, blockQuicThen("DOMAIN-KEYWORD," + list[i], policy));
  }
  return out;
}

function main(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("CY: 配置无效");
  }
  const nodes = Array.isArray(config.proxies) ? config.proxies : [];
  if (!nodes.length && !Object.keys(config["proxy-providers"] || {}).length) {
    throw new Error("CY: 请在已有节点的配置中使用");
  }

  config["tcp-concurrent"] = true;

  const available = usableNodeNames(config);
  const hasPH = filterHasNodes(available, F_PH);
  const hasTW = filterHasNodes(available, F_TW);
  const hasUK = filterHasNodes(available, F_UK);
  const hasEU = filterHasNodes(available, F_EU);

  const phPolicy = hasPH ? G_PH : G_STABLE;
  const twPolicy = hasTW ? G_TW : G_STABLE;
  const ukPolicy = hasUK ? G_UK : G_STABLE;
  const euPolicy = hasEU ? G_EU : G_STABLE;

  const groups = [];
  if (hasPH) groups.push(urlTestGroup(G_PH, F_PH));
  if (hasTW) groups.push(urlTestGroup(G_TW, F_TW));
  if (hasUK) groups.push(urlTestGroup(G_UK, F_UK));
  if (hasEU) groups.push(urlTestGroup(G_EU, F_EU));
  groups.push(urlTestGroup(G_STABLE, F_STABLE, 1800, 150));

  const selectProxies = [G_STABLE];
  if (hasTW) selectProxies.push(G_TW);
  if (hasPH) selectProxies.push(G_PH);
  if (hasUK) selectProxies.push(G_UK);
  if (hasEU) selectProxies.push(G_EU);
  groups.push({
    name: G_SELECT,
    type: "select",
    proxies: selectProxies,
    "exclude-filter": INFO_FILTER,
    "include-all": true
  });
  groups.push({
    name: G_PROXY,
    type: "select",
    proxies: [G_STABLE, G_SELECT]
  });

  const bybitProxies = [];
  if (hasEU) bybitProxies.push(G_EU);
  if (hasTW) bybitProxies.push(G_TW);
  bybitProxies.push(G_STABLE, G_SELECT);
  groups.push({
    name: G_BYBIT,
    type: "select",
    proxies: bybitProxies
  });

  const providers = {
    "CY-Apple_Domain": {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      url: "https://raw.githubusercontent.com/Sydney-Moses/Network-Profiles/refs/heads/main/MRS/Apple_Domain.mrs",
      path: "./rules/cy-Apple_Domain.mrs"
    },
    "CY-ChinaMax_Domain": {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      url: "https://raw.githubusercontent.com/Sydney-Moses/Network-Profiles/refs/heads/main/MRS/ChinaMax_Domain.mrs",
      path: "./rules/cy-ChinaMax_Domain.mrs"
    },
    "CY-ChinaMax_IP": {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      url: "https://raw.githubusercontent.com/Sydney-Moses/Network-Profiles/refs/heads/main/MRS/ChinaMax_IP.mrs",
      path: "./rules/cy-ChinaMax_IP.mrs"
    }
  };

  const googleQuicOr = GOOGLE_QUIC.map(function (d) {
    return "(DOMAIN-SUFFIX," + d + ")";
  }).join(",");

  const rules = [].concat(
    [
      "DOMAIN,localhost,DIRECT",
      "DOMAIN-SUFFIX,local,DIRECT",
      "DOMAIN-SUFFIX,lan,DIRECT",
      "DOMAIN-SUFFIX,internal,DIRECT",
      "DOMAIN-SUFFIX,ls.apple.com,DIRECT",
      "DOMAIN,sequoia.apple.com,DIRECT",
      "DOMAIN,seed-sequoia.siri.apple.com,DIRECT",
      "DOMAIN,register.appattest.apple.com,DIRECT",
      "DOMAIN,captive.apple.com,DIRECT",
      "DOMAIN-SUFFIX,mesu.apple.com,DIRECT",
      "DOMAIN-SUFFIX,swscan.apple.com,DIRECT",
      "DOMAIN-SUFFIX,gdmf.apple.com,DIRECT",
      "DOMAIN-SUFFIX,ocsp.apple.com,DIRECT",
      "DOMAIN-SUFFIX,ess.apple.com,DIRECT"
    ],
    COMPANY_DOMAINS.map(function (d) { return "DOMAIN-SUFFIX," + d + ",DIRECT"; }),
    [
      "DOMAIN-SUFFIX,brightdata.com," + G_STABLE
    ],
    suffixRules(MEXC_SUFFIX, phPolicy),
    keywordRules(["mexc"], phPolicy),
    exactRules(BYBIT_EU_EXACT, euPolicy),
    suffixRules(BYBIT_EU_SUFFIX, euPolicy),
    suffixRules(BYBIT_SHARED_SUFFIX, G_BYBIT),
    exactRules(BYBIT_GLOBAL_EXACT, twPolicy),
    suffixRules(BYBIT_GLOBAL_SUFFIX, twPolicy),
    keywordRules(["bytick"], twPolicy),
    keywordRules(["bybit"], G_BYBIT),
    suffixRules(PAYPAL_SUFFIX, ukPolicy),
    suffixRules(AI_SUFFIX, G_STABLE),
    exactRules(AI_EXACT, G_STABLE),
    [
      "IP-CIDR,0.0.0.0/8,DIRECT,no-resolve",
      "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
      "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
      "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
      "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
      "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
      "IP-CIDR,192.0.0.0/24,DIRECT,no-resolve",
      "IP-CIDR,192.0.2.0/24,DIRECT,no-resolve",
      "IP-CIDR,192.88.99.0/24,DIRECT,no-resolve",
      "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
      "IP-CIDR,198.51.100.0/24,DIRECT,no-resolve",
      "IP-CIDR,203.0.113.0/24,DIRECT,no-resolve",
      "IP-CIDR,216.36.82.250/32,DIRECT",
      "IP-CIDR,224.0.0.0/4,DIRECT,no-resolve",
      "IP-CIDR,255.255.255.255/32,DIRECT,no-resolve",
      "IP-CIDR6,::1/128,DIRECT,no-resolve",
      "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
      "IP-CIDR6,fe80::/10,DIRECT,no-resolve",
      "DOMAIN-KEYWORD,apple-support.akadns.net,DIRECT",
      "DOMAIN-KEYWORD,apple.com.akadns.net,DIRECT",
      "DOMAIN-KEYWORD,apple.com.edgekey.net,DIRECT",
      "DOMAIN-KEYWORD,buy.itunes.apple.com,DIRECT",
      "DOMAIN-KEYWORD,smp-device,DIRECT",
      "DOMAIN-KEYWORD,testflight,DIRECT",
      "DOMAIN-KEYWORD,icloud.com.akadns.net,DIRECT",
      "IP-CIDR,139.178.128.0/18,DIRECT",
      "IP-CIDR,144.178.0.0/19,DIRECT",
      "IP-CIDR,144.178.36.0/22,DIRECT",
      "IP-CIDR,144.178.48.0/20,DIRECT",
      "IP-CIDR,17.0.0.0/8,DIRECT",
      "IP-CIDR,192.35.50.0/24,DIRECT",
      "IP-CIDR,198.183.17.0/24,DIRECT",
      "IP-CIDR,205.180.175.0/24,DIRECT",
      "IP-CIDR,63.92.224.0/19,DIRECT",
      "IP-CIDR,65.199.22.0/23,DIRECT",
      "IP-CIDR6,2403:300::/32,DIRECT",
      "IP-CIDR6,2620:149::/32,DIRECT",
      "IP-CIDR6,2a01:b740::/32,DIRECT",
      "RULE-SET,CY-Apple_Domain,DIRECT",
      "DOMAIN-SUFFIX,tmall.com,DIRECT",
      "DOMAIN-KEYWORD,alicdn,DIRECT",
      "DOMAIN-KEYWORD,alipay,DIRECT",
      "DOMAIN-KEYWORD,aliyun,DIRECT",
      "DOMAIN-KEYWORD,baidu,DIRECT",
      "DOMAIN-KEYWORD,beplay,DIRECT",
      "DOMAIN-KEYWORD,officecdn,DIRECT",
      "DOMAIN-KEYWORD,taobao,DIRECT",
      "DOMAIN-KEYWORD,bilibili,DIRECT",
      "DOMAIN-KEYWORD,qiyi,DIRECT",
      "DOMAIN-KEYWORD,hnagroup,DIRECT",
      "DOMAIN-KEYWORD,stripe,DIRECT",
      "DOMAIN-KEYWORD,weibo,DIRECT",
      "RULE-SET,CY-ChinaMax_Domain,DIRECT",
      "RULE-SET,CY-ChinaMax_IP,DIRECT",
      "GEOIP,CN,DIRECT",
      "AND,((NETWORK,udp),(DST-PORT,443),(OR,(" + googleQuicOr + "))),REJECT",
      "MATCH," + G_STABLE
    ]
  );

  const names = groups.map(function (g) { return g.name; });
  nodes.forEach(function (n) {
    if (names.indexOf(n.name) >= 0) throw new Error("CY: 节点与策略组重名: " + n.name);
  });
  config["proxy-groups"] = groups;

  const other = {};
  Object.keys(config).forEach(function (k) {
    if (k !== "rules" && k !== "rule-providers") other[k] = config[k];
  });
  const references = JSON.stringify(other);
  const kept = {};
  Object.keys(config["rule-providers"] || {}).forEach(function (k) {
    if (references.indexOf(k) >= 0) kept[k] = config["rule-providers"][k];
  });
  config["rule-providers"] = Object.assign(kept, providers);
  config.rules = rules;
  config.mode = "rule";
  return config;
}
