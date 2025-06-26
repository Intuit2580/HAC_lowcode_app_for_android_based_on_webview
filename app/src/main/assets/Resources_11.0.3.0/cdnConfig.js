if (!window.Forguncy) {
    window.Forguncy = {};
}
Forguncy.cdnConfig = {
    //"Bundle/forguncy.js": "http://cdnserver/subpath/forguncy.js",
    //"Bundle/forguncyCalc.js": "http://cdnserver/subpath/forguncyCalc.js",
};
Forguncy.cdnConfig.getUrl = function (originalUrl) {
    // console.log(originalUrl);
    var cdnUrl = Forguncy.cdnConfig[originalUrl];
    if (cdnUrl) {
        return cdnUrl;
    }
    return originalUrl;
};