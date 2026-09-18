// CY groups-only v1.0 | 2026-09-18
// iOS Clash 规则库只导入 rules / rule-providers，不会把 YAML 里的 proxy-groups 组进配置。
// 本脚本只补 PROXY / AUTO，不改规则。和 cy-verge-rules.yaml 一起用在 Grok 配置。
// 不要和 cy-rules.js 同时挂。

function main(config) {
  var groups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"].slice() : [];
  var names = {};
  for (var i = 0; i < groups.length; i++) {
    if (groups[i] && groups[i].name) names[groups[i].name] = true;
  }

  if (!names.AUTO) {
    groups.unshift({
      name: "AUTO",
      type: "url-test",
      "include-all": true,
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      lazy: true
    });
  }

  if (!names.PROXY) {
    groups.unshift({
      name: "PROXY",
      type: "select",
      "include-all": true,
      proxies: ["AUTO", "DIRECT"]
    });
  }

  config["proxy-groups"] = groups;
  return config;
}
