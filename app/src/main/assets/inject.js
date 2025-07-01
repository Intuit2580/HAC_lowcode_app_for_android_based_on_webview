const baseUrl = "http://10.158.15.75:99/Proxy/";
const postUrl = "PostInWeb?xmid=test&requestUrl=";
const getUrl = "GetInWeb?xmid=test&requestUrl=";
const appName = "app_test2/";


(function() {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    const origSend = XMLHttpRequest.prototype.send;


    XMLHttpRequest.prototype.open = function(method, url, async) {

        console.log(url);

        url = url.replace(appName, "app_test/");

      //  url = url.replace(/\&/g, '%26');

        var newUrl = baseUrl + postUrl + url

        if(method.toLowerCase() == "get") {
            newUrl = baseUrl + getUrl + url
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

        if (header.toLowerCase() === "content-type") {
            value = "application/json; charset=UTF-8";
        }

        // 调用原始 setRequestHeader
        return origSetRequestHeader.call(this, header, value);
      };

       XMLHttpRequest.prototype.send = function(body) {

               this.addEventListener('load', function() {

                           alert(`Request Body:`, body);
                           alert(`Response:`, this.responseText || this.response);

                       });

               // 调用原始 setRequestHeader
               return origSend.call(this, body);
         };

})();
