const baseUrl = "http://10.158.15.75:99/Proxy/";
const postUrl = "PostInWeb?xmid=test&requestUrl=";
const getUrl = "GetInWeb?xmid=test&requestUrl=";
const appName = "app_test/";


(function() {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    const origSend = XMLHttpRequest.prototype.send;

    let origUrl, origMethod, origAsync;


    XMLHttpRequest.prototype.open = function(method, url, async) {


        origMethod = method;
        origAsync = async;

        console.log(url);

        //var urlT = url.replace(appName, "app_test/");

        var newUrl = baseUrl + postUrl + url

        if(method.toLowerCase() == "get") {
            newUrl = baseUrl + getUrl + url.replace(/\&/g, '%26');
        }

        if(newUrl.search("GetMetadata2") != -1) {
            var globalVersion = Math.round(Math.random()*100000000);
            newUrl = newUrl.replace("#GlobalSettingVersion#", globalVersion);
            var metaVersion = Math.round(Math.random()*100000000);
            newUrl = newUrl.replace("#MetadataVersion#", metaVersion);
        }

        newUrl = newUrl.replace(appName, "");
        console.log(newUrl)

        origUrl = newUrl;

        return origOpen.call(this, method, newUrl, async);
    };

    // 拦截 setRequestHeader（用于统一添加 header）
     XMLHttpRequest.prototype.setRequestHeader = function(header, value) {


        if (header.toLowerCase() === "content-type") {

            if (value.search("json") != -1) {
                this.contentType = "json";
            } else {
                value = "application/json; charset=UTF-8";
                this.contentType = "string";
            }

        }

     // 调用原始 setRequestHeader
        return origSetRequestHeader.call(this, header, value);
    };

    XMLHttpRequest.prototype.send = function(body) {
        var self = this;

        // 如果 body 是 form-data 格式（包含 '=' 字符），尝试转换为 JSON
        if (body && typeof body === 'string' && body.indexOf('=') !== -1 && this.contentType === "string") {

            try {
                // 解析 form 数据
                var formData = new URLSearchParams(body);
                var jsonBody = {};

                var pageName = "";

                // 构造 JSON 对象
                for (var [key, value] of formData.entries()) {
                    jsonBody[key] = value;
                    console.log(key + ":" + value);
                    if (origMethod.toLowerCase() === "post" && key === "pageName" && origUrl.search("GetMetadata") != -1 && value.search(":") === -1) {
                        pageName = value;
                    }
                }

                if (pageName != "") {
                    console.log(pageName);
                    origOpen.call(this, origMethod, origUrl + "?pageName=" + pageName, origAsync);
                }

                // 使用 JSON.stringify 后发送
                return origSend.call(this, JSON.stringify(jsonBody));
            } catch (e) {
                console.error("Form to JSON 转换失败:", e);
            }
        }

        // 默认行为：原样发送
        return origSend.call(this, body);
    };

})();
