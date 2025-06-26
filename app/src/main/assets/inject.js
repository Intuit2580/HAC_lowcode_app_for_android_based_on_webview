const baseUrl = "http://10.158.15.75:99/Proxy/";


(function() {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function(method, url, async) {

        var newUrl = baseUrl + "PostInWeb?xmid=test&requestUrl=" + url

        if(method.toLowerCase() == "get") {
            newUrl = baseUrl + "GetInWeb?xmid=test&requestUrl=" + url
        }

        console.log(newUrl)

        return origOpen.call(this, method, url, async);
    };

    // 拦截 setRequestHeader（用于统一添加 header）
      XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        // 示例：统一添加 Authorization 头
//        if (header.toLowerCase() === "authorization") {
//          value = "store.state.vuex_gwjxtoken"
//        }

        // 调用原始 setRequestHeader
        return origSetRequestHeader.call(this, header, value);
      };


})();
