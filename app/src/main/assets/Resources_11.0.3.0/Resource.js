var Forguncy;
(function (Forguncy) {
    var LocaleFonts = (function () {
        function LocaleFonts() {
        }
        Object.defineProperty(LocaleFonts, "default", {
            get: function () {
                var _e;
                var multipleLanguageSettings = Forguncy.ForguncyData.GlobalSettings.MultipleLanguageSettings;
                var fontFamily = (_e = Forguncy.ForguncyData.GlobalSettings) === null || _e === void 0 ? void 0 : _e.ThemeFont;
                if (multipleLanguageSettings.EnableMultipleLanguage) {
                    var activeLanguageFontFamily = Forguncy.MultipleLanguageHelper.getMultipleLanguageFontFamily();
                    fontFamily = activeLanguageFontFamily && activeLanguageFontFamily != "Body" ? activeLanguageFontFamily : fontFamily;
                }
                return fontFamily !== null && fontFamily !== void 0 ? fontFamily : LocaleFonts[Forguncy.RS.Culture];
            },
            enumerable: false,
            configurable: true
        });
        var _a, _b, _c, _d;
        _a = "en", _b = "cn", _c = "ja", _d = "kr";
        LocaleFonts[_a] = "Calibri";
        LocaleFonts[_b] = "Microsoft YaHei";
        LocaleFonts[_c] = "Meiryo UI";
        LocaleFonts[_d] = "Malgun Gothic";
        return LocaleFonts;
    }());
    Forguncy.LocaleFonts = LocaleFonts;
    var Resource = (function () {
        function Resource() {
        }
        Resource.ActiveLanguageKey = "activeLanguage";
        return Resource;
    }());
    Forguncy.Resource = Resource;
    var RS = (function () {
        function RS() {
        }
        RS.Culture = "en";
        return RS;
    }());
    Forguncy.RS = RS;
    function SetBuiltInResource(culture, resources) {
        RS.Culture = culture;
        for (var key in resources) {
            RS[key] = resources[key];
        }
    }
    Forguncy.SetBuiltInResource = SetBuiltInResource;
})(Forguncy || (Forguncy = {}));
