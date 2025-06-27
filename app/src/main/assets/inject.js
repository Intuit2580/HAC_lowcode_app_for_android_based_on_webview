const baseUrl = "http://10.158.15.75:99/Proxy/";
const appName = "demo/";


(function() {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function(method, url, async) {

        console.log(url);
        var newUrl = baseUrl + "PostInWeb?xmid=test&requestUrl=" + url

        if(method.toLowerCase() == "get") {
            newUrl = baseUrl + "GetInWeb?xmid=test&requestUrl=" + url
        }

        if(newUrl.search("GetMetadata2") != -1) {
            var globalVersion = Math.round(Math.random()*100000000);
            newUrl = newUrl.replace("#GlobalSettingVersion#", globalVersion);
            var metaVersion = Math.round(Math.random()*100000000);
            newUrl = newUrl.replace("#MetadataVersion#", metaVersion);
        }

        newUrl = newUrl.replace(appName, "");
        console.log(newUrl)

        return origOpen.call(this, method, url, async);
    };

    // 拦截 setRequestHeader（用于统一添加 header）
      XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        // 示例：统一添加 Authorization 头
        if (header.toLowerCase() === "content-type") {
            value = "application/json; charset=UTF-8"
        }

        // 调用原始 setRequestHeader
        return origSetRequestHeader.call(this, header, value);
      };


})();
