var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Forguncy;
(function (Forguncy) {
    var ModuleLoader = (function () {
        function ModuleLoader() {
        }
        ModuleLoader.LoadModels = function (modules, forguncyRoot) {
            var _this = this;
            var root = forguncyRoot;
            modules = this.appendDependenceModules(modules);
            var promiseList = [];
            $.map(modules, function (moduleName) {
                var _a, _b;
                moduleName = ModuleLoader.getModuleName(moduleName);
                var module = _this.modules.modules[moduleName];
                if (!module) {
                    return;
                }
                if (module.pcOnly && MetadataLoader.IsMobileSafe()) {
                    if (!(module.supportInSimulater && MetadataLoader.IsInMobileSimulatorFrame())) {
                        module.loaded = true;
                        return;
                    }
                }
                if (module.loaded) {
                    return;
                }
                if (module.promise) {
                    return promiseList.push(module.promise);
                }
                var root2 = root;
                if (!module.isPlugin) {
                    root2 = root + "Resources/";
                }
                else if (module.pluginRoot) {
                    root2 = root + module.pluginRoot + "/";
                }
                var bundlePrefix = module.isPlugin ? "" : "Bundle/";
                var css = Forguncy.StaticData.UseBundle && module.bundleCss ? [bundlePrefix + module.bundleCss] : module.css;
                _this.LoadCss(css, root2);
                var js = module.js;
                if (!(Forguncy.StaticData.IsDebugMode || (Forguncy.ForguncyData.isDebugMode && Forguncy.ForguncyData.isDebugMode())) && module.publishJs && module.publishJs.length > 0) {
                    js = module.publishJs;
                }
                if (Forguncy.StaticData.UseBundle && module.bundleJs) {
                    js = [bundlePrefix + module.bundleJs];
                }
                if (module.isPlugin && module.pluginRoot) {
                    if (module.localeLoadMap) {
                        var resource = module.localeLoadMap[Forguncy.StaticData.Lang];
                        if (resource === null || resource === void 0 ? void 0 : resource.length) {
                            js.splice.apply(js, __spreadArray([0, 0], resource, false));
                        }
                    }
                    js.splice(0, 0, "PluginRS.js?guid=".concat(moduleName, "&lang=").concat((_a = localStorage.getItem(Forguncy.Resource.ActiveLanguageKey)) !== null && _a !== void 0 ? _a : ""));
                }
                if (((_b = module.localeDependent) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                    js = js.map(function (item) {
                        var _a;
                        return module.localeDependent.indexOf(item) > -1
                            ? item + "?lang=".concat((_a = localStorage.getItem(Forguncy.Resource.ActiveLanguageKey)) !== null && _a !== void 0 ? _a : "")
                            : item;
                    });
                }
                var promise = _this.LoadJs(js, root2);
                module.promise = promise;
                if (promise) {
                    promise.done(function () {
                        module.loaded = true;
                        module.promise = null;
                    });
                }
                else {
                    module.loaded = true;
                }
                if (module.useModularFrontend) {
                    promiseList.push($.Deferred(function (deferred) { return Forguncy.Plugin.Modular.waitForReady(moduleName).then(deferred.resolve); }));
                }
                promiseList.push(promise);
            });
            this.active++;
            var promise = $.when.apply($, promiseList.filter(function (i) { return i; }));
            promise.done(function () { _this.active--; });
            return promise;
        };
        ModuleLoader.loadReactSuite = function () {
            return Forguncy.ModuleLoader.LoadModels(["reactSuite"], Forguncy.ForguncyData.ForguncyRoot);
        };
        ModuleLoader.getTemplateValue = function (name) {
            var _a;
            if (name === "sjs_lang_name") {
                return (_a = {},
                    _a["cn"] = "zh",
                    _a["kr"] = "ko",
                    _a["ja"] = "ja",
                    _a)[Forguncy.RS.Culture];
            }
            return "";
        };
        ModuleLoader.parseTemplate = function (template) {
            if (!template) {
                return template;
            }
            var reg = /<%- ([\s\S]*?) %>/g;
            var result = template;
            var match = reg.exec(template);
            while (match) {
                var value = this.getTemplateValue(match[1]);
                result = result.replace(match[0], value);
                match = reg.exec(template);
            }
            return result;
        };
        ModuleLoader.LoadJs = function (files, root) {
            var _this = this;
            if (!files || files.length === 0) {
                return null;
            }
            var _arr = $.map(files, function (scr) {
                var promise = $.Deferred(function (deferred) {
                    if (!_this.shouldBeLoaded(scr)) {
                        deferred.resolve();
                        return;
                    }
                    var file = _this.addRootAndVersion(_this.parseTemplate(scr), root);
                    if (_this.loadedJsOrCss.has(file)) {
                        deferred.resolve();
                        return;
                    }
                    _this.loadedJsOrCss.add(file);
                    if (_this.shouldUsePostscribeLoadJs(file)) {
                        var script = "<script src=\"".concat(file, "\" type=\"text/javascript\"></script>");
                        window.postscribe(document.head, script, { done: deferred.resolve, error: deferred.resolve });
                    }
                    else {
                        var fileref = document.createElement('script');
                        fileref.setAttribute("type", "text/javascript");
                        fileref.setAttribute("src", file);
                        fileref.onload = deferred.resolve;
                        fileref.onerror = deferred.resolve;
                        fileref.async = false;
                        document.getElementsByTagName("head")[0].appendChild(fileref);
                    }
                });
                return promise;
            });
            return $.when.apply($, _arr);
        };
        ModuleLoader.shouldBeLoaded = function (file) {
            if (file.includes("sjs_lang_name")
                && ["cn", "kr", "ja"].indexOf(Forguncy.RS.Culture) == -1) {
                return false;
            }
            return true;
        };
        ModuleLoader.shouldUsePostscribeLoadJs = function (file) {
            return file.indexOf("map.baidu") > 0;
        };
        ModuleLoader.LoadCss = function (files, root) {
            if (!files || files.length === 0) {
                return null;
            }
            for (var i = files.length - 1; i >= 0; i--) {
                var file = this.addRootAndVersion(files[i], root);
                if (this.loadedJsOrCss.has(file)) {
                    return;
                }
                this.loadedJsOrCss.add(file);
                var css = $("<link>");
                $("head").prepend(css);
                css.attr({
                    rel: "stylesheet",
                    type: "text/css",
                    href: file
                });
            }
        };
        ModuleLoader.getCdnUrl = function (original, root) {
            if (original && typeof (original) === "string" && Forguncy.cdnConfig && Forguncy.cdnConfig.getUrl) {
                var updateUrl = original;
                if (root && original.indexOf(root) === 0) {
                    updateUrl = original.substring(root.length);
                }
                var versionStrIndex = updateUrl.indexOf("?v=");
                if (versionStrIndex > 0) {
                    updateUrl = updateUrl.substring(0, versionStrIndex);
                }
                var cdnUrl = Forguncy.cdnConfig.getUrl(updateUrl);
                if (cdnUrl && cdnUrl !== updateUrl) {
                    return cdnUrl;
                }
            }
            return original;
        };
        ModuleLoader.addPluginModules = function (modules, nameModuleMap) {
            if (modules) {
                for (var module in modules) {
                    this.modules.modules[module] = modules[module];
                }
            }
            if (nameModuleMap) {
                for (var i in nameModuleMap) {
                    this.nameModuleMap[i] = nameModuleMap[i];
                }
            }
        };
        ModuleLoader.addUserCustomizeModules = function (module) {
            if (module) {
                this.modules.modules["Fgc_UserCustomizeModule"] = module;
            }
        };
        ModuleLoader.isPluginLoaded = function (name) {
            var moduleName = this.nameModuleMap[name];
            var module = this.modules.modules[moduleName];
            if (module) {
                return module.loaded;
            }
            return true;
        };
        ModuleLoader.IsModuleLoaded = function (modules) {
            var _this = this;
            return modules.every(function (moduleName) {
                moduleName = ModuleLoader.getModuleName(moduleName);
                var module = _this.modules.modules[moduleName];
                if (module) {
                    return module.loaded;
                }
                return true;
            });
        };
        ModuleLoader.getModuleName = function (moduleName) {
            if (moduleName === "inputMan" && Forguncy.StaticData.UseInputManModernStyle) {
                return "inputMan5";
            }
            return moduleName;
        };
        ModuleLoader.LoadTypeModule = function (type) {
            var commandModels = Forguncy.ForguncyData.GlobalSettings.CommandsDependenceModels;
            var moduleName = this.nameModuleMap[type];
            var modules = [moduleName];
            if (commandModels && commandModels[type]) {
                modules = __spreadArray(__spreadArray([], commandModels[type], true), modules, true);
            }
            if (moduleName) {
                return this.LoadModels(modules, Forguncy.ForguncyData.ForguncyRoot);
            }
            return null;
        };
        ModuleLoader.getModulesDependenceModules = function (moduleNames) {
            var _this = this;
            var preDependenceModules = [];
            var postDependenceModules = [];
            moduleNames.forEach(function (moduleName) {
                var _a, _b;
                var module = _this.modules.modules[moduleName];
                if (!module) {
                    return;
                }
                (_a = module.preDependenceModels) !== null && _a !== void 0 ? _a : (module.preDependenceModels = []);
                (_b = module.postDependenceModels) !== null && _b !== void 0 ? _b : (module.postDependenceModels = []);
                if (!module.preDependenceModels.length && !module.postDependenceModels.length) {
                    return;
                }
                preDependenceModules.push.apply(preDependenceModules, module.preDependenceModels);
                postDependenceModules.push.apply(postDependenceModules, module.postDependenceModels);
                var modulesDependenceModules = _this.getModulesDependenceModules(__spreadArray(__spreadArray([], module.preDependenceModels, true), module.postDependenceModels, true));
                preDependenceModules.push.apply(preDependenceModules, modulesDependenceModules.preDependenceModules);
                postDependenceModules.push.apply(postDependenceModules, modulesDependenceModules.postDependenceModules);
            });
            return {
                preDependenceModules: preDependenceModules,
                postDependenceModules: postDependenceModules
            };
        };
        ModuleLoader.appendDependenceModules = function (modules) {
            var _this = this;
            var moduleSet = new Set();
            modules.forEach(function (moduleName) {
                moduleSet.add(moduleName);
                var _a = _this.getModulesDependenceModules([moduleName]), preDependenceModules = _a.preDependenceModules, postDependenceModules = _a.postDependenceModules;
                preDependenceModules.forEach(function (moduleName) { return moduleSet.add(moduleName); });
                postDependenceModules.forEach(function (moduleName) { return moduleSet.add(moduleName); });
            });
            return Array.from(moduleSet);
        };
        ModuleLoader.addRootAndVersion = function (scr, root) {
            var file = this.getCdnUrl(scr);
            if (file === scr) {
                var lower = (file + "").toLowerCase().trim();
                if (lower.indexOf("http://") === 0 ||
                    lower.indexOf("https://") === 0 ||
                    lower.indexOf("file://") === 0) {
                    return file;
                }
                file = root + file;
                if (Forguncy.StaticData.JSVersion) {
                    var prefix = file.includes("?") ? "&" : "?";
                    file += "".concat(prefix, "v=") + Forguncy.StaticData.JSVersion;
                }
            }
            return file;
        };
        ModuleLoader.getPluginRoot = function (pluginGuid) {
            var _a;
            var pluginRoot = (_a = this.modules.modules[pluginGuid]) === null || _a === void 0 ? void 0 : _a.pluginRoot;
            var root = this.root;
            if (pluginRoot) {
                if (pluginRoot.startsWith('file://') && Forguncy.StaticData.IsDesignerPreview) {
                    return pluginRoot + '/';
                }
                root = root + pluginRoot + "/";
            }
            return root;
        };
        ModuleLoader.modules = {
            modules: {
                calcEngine: {
                    js: [
                        "Scripts/SpreadJS/modules/gc.spread.common.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.calcengine.min.js",
                        'Scripts/SpreadJS/modules/gc.data.min.js',
                        "Scripts/SpreadJS/modules/gc.spread.calcengine.basicfunctions.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.calcengine.advancedfunctions.min.js",
                        "TypeScripts/SpreadJS/SpreadJSDisturbCode.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.core.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.calcengine.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.conditionalformatting.min.js",
                        "TypeScripts/SpreadJS/SpreadJSModifier.js"
                    ],
                    bundleJs: "forguncyCalc.js",
                },
                spreadJsResource: {
                    js: [
                        "Scripts/SpreadJS/resources/<%- sjs_lang_name %>/gc.spread.sheets.resources.<%- sjs_lang_name %>.min.js",
                    ]
                },
                spreadJs: {
                    postDependenceModels: ["spreadJsResource"],
                    js: [
                        "Scripts/SpreadJS/modules/gc.spread.sheets.cellstate.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.celltypes.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.contextmenu.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.bindings.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.datavalidation.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.fill.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.touch.min.js",
                        "TypeScripts/Forguncy/Listview/SpreadJSView.js",
                        "TypeScripts/Forguncy/Listview/SpreadJSCellType.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/ColumnFilterHelper.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/BasicFilter.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/AdvancedFilter.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/FormulaColumnSortFilterHelper.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/Filters/TextFilter.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/Filters/NumberFilter.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/Filters/TimeFilter.js",
                        "TypeScripts/Forguncy/Listview/ColumnFilter/Filters/DateFilter.js",
                        "TypeScripts/Forguncy/Listview/ContextMenu/ContextMenu.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/AutoMerge.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/AutoScroll.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/Selection.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/SpreadJSStyle.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/RangeChanged.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/Stretch.js",
                        "TypeScripts/Forguncy/Listview/Accessory/ListviewDeleteButton.js",
                    ],
                    css: [
                        "Content/gc.spread.sheets.excel2013lightGray.css",
                        "Content/spreadjscss.css"
                    ],
                    bundleJs: "spread.js",
                    bundleCss: "spread.css"
                },
                forguncy: {
                    js: [
                        "TypeScripts/Forguncy/Utility/PluginLocalizationResourceHelper.js",
                        "TypeScripts/Forguncy/Utility/PluginModular.js",
                        "TypeScripts/Forguncy/Api/APIDefinitions/Forguncy_API.js",
                        "TypeScripts/Forguncy/Api/APIDefinitions/Forguncy_Internal_API.js",
                        "TypeScripts/Forguncy/Api/APIDefinitions/Forguncy_Plugin_API.js",
                        "TypeScripts/Forguncy/Utility/Security/Security.js",
                        "TypeScripts/Forguncy/Utility/Numerics/Vector2.js",
                        "TypeScripts/Forguncy/EventClassBase.js",
                        "TypeScripts/Forguncy/Utility/StaticValues.js",
                        "TypeScripts/Forguncy/Utility/ImageCompressHelper.js",
                        "TypeScripts/Forguncy/Utility/Common.js",
                        "TypeScripts/Forguncy/Utility/CSSHelper.js",
                        "TypeScripts/Forguncy/Utility/ConditionHelper.js",
                        "TypeScripts/Forguncy/Utility/DependenceCellValueChangeHelper.js",
                        "TypeScripts/Forguncy/Utility/DragFileToUploadHelper.js",
                        "TypeScripts/Forguncy/Utility/Platform.js",
                        "TypeScripts/Forguncy/Utility/AjaxHelper.js",
                        "TypeScripts/Forguncy/Utility/Input/KeyCodes.js",
                        "TypeScripts/Forguncy/Utility/ArrayHelper.js",
                        "TypeScripts/Forguncy/Utility/ThemeColorHelper.js",
                        "TypeScripts/Forguncy/Utility/DomUtility.js",
                        "TypeScripts/Forguncy/Utility/ImageHelper.js",
                        "TypeScripts/Forguncy/Utility/FocusMoveHelper.js",
                        "TypeScripts/Forguncy/Utility/AutoIDManager.js",
                        "TypeScripts/Forguncy/Utility/TreeHelper.js",
                        "TypeScripts/Forguncy/Utility/StatusCacheHelper.js",
                        "TypeScripts/Forguncy/DataModel/PageDirtyCheckManager.js",
                        "TypeScripts/SpreadJS/DateTimeHelper.js",
                        "TypeScripts/SpreadJS/SpreadJSHelpMethods.js",
                        "Scripts/EXIF/exif.js",
                        "TypeScripts/Forguncy/DataType.js",
                        "TypeScripts/Forguncy/ForguncyData.js",
                        "TypeScripts/Forguncy/PageStatistics.js",
                        "TypeScripts/Forguncy/Formula/CalcSource.js",
                        "TypeScripts/Forguncy/Formula/CustomFunctions.js",
                        "TypeScripts/Forguncy/Formula/FormulaManager.js",
                        "TypeScripts/Forguncy/Formula/DefaultFormulaManager.js",
                        "TypeScripts/Forguncy/Formula/FormulaTranslator.js",
                        "TypeScripts/Forguncy/Server/HomeController.js",
                        "TypeScripts/Forguncy/UI/UserControl/UserControl.js",
                        "TypeScripts/Forguncy/UI/Modifier/Modifier.js",
                        "TypeScripts/Forguncy/UI/FlexLayout.js",
                        "TypeScripts/Forguncy/UI/Button.js",
                        "TypeScripts/Forguncy/UI/ButtonGroup.js",
                        "TypeScripts/Forguncy/UI/Toggle.js",
                        "TypeScripts/Forguncy/UI/Radio.js",
                        "TypeScripts/Forguncy/UI/RadioGroup.js",
                        "TypeScripts/Forguncy/UI/SignaturePad.js",
                        "TypeScripts/Forguncy/UI/Table.js",
                        "TypeScripts/Forguncy/UI/CheckBox.js",
                        "TypeScripts/Forguncy/UI/CheckBoxGroup.js",
                        "TypeScripts/Forguncy/UI/ContextMenu.js",
                        "TypeScripts/Forguncy/UI/Dialog.js",
                        "TypeScripts/Forguncy/UI/ListBox.js",
                        "TypeScripts/Forguncy/UI/TreeView.js",
                        "TypeScripts/Forguncy/UI/Textarea.js",
                        "TypeScripts/Forguncy/UI/TextBlock.js",
                        "TypeScripts/Forguncy/UI/IconText.js",
                        "TypeScripts/Forguncy/UI/Pagination.js",
                        "TypeScripts/Forguncy/UI/Progress.js",
                        "TypeScripts/Forguncy/UI/TextBox.js",
                        "TypeScripts/Forguncy/UI/ComboBox.js",
                        "TypeScripts/Forguncy/UI/DateTimePicker.js",
                        "TypeScripts/Forguncy/Utility/Popup/PopupHelper.js",
                        "TypeScripts/Forguncy/Utility/Popup/SendEmailHelper.js",
                        "TypeScripts/Forguncy/Listview/ListviewData.js",
                        "TypeScripts/Forguncy/Listview/ListviewBase.js",
                        "TypeScripts/Forguncy/Listview/ListViewStyleTemplate.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/SelectionCache.js",
                        "TypeScripts/Forguncy/Listview/ListViewHelper/Request.js",
                        "TypeScripts/Forguncy/DataModel/DataModel.js",
                        "TypeScripts/Forguncy/DataModel/PagingModel.js",
                        "TypeScripts/Forguncy/DataModel/CurrentRowInfoCollection.js",
                        "TypeScripts/Forguncy/DataModel/NormalCellBindingManager.js",
                        "TypeScripts/Forguncy/DataModel/PageElementManager.js",
                        "TypeScripts/Forguncy/Validate/ValidationMananger.js",
                        "TypeScripts/Forguncy/Validate/UniqueValidator.js",
                        "TypeScripts/Forguncy/Validate/DataValidator.js",
                        "TypeScripts/Forguncy/Validate/CommandValidator.js",
                        "TypeScripts/Forguncy/CellType/Base/CellTypeData.js",
                        "TypeScripts/Forguncy/CellType/Base/CellTypeBase.js",
                        "TypeScripts/Forguncy/CellType/Base/GeneralCellType.js",
                        "TypeScripts/Forguncy/CellType/Base/SupportFormatCellType.js",
                        "TypeScripts/Forguncy/CellType/StyleTemplate/CellTypeStyleTemplate.js",
                        "TypeScripts/Forguncy/CellType/StyleTemplate/CellTypeStyleTemplateUtils.js",
                        "TypeScripts/Forguncy/CellType/ItemsCellType/ItemsCellType.js",
                        "TypeScripts/Forguncy/CellType/ItemsCellType/GroupCellType.js",
                        "TypeScripts/Forguncy/CellType/MobileCellType/InputCellTypeBase.js",
                        "TypeScripts/Forguncy/CellType/MobileCellType/ComboBoxCellType_Mobile.js",
                        "TypeScripts/Forguncy/CellType/ContainerCellType/ContentContainerCellType.js",
                        "TypeScripts/Forguncy/CellType/ContainerCellType/RepeaterCellType.js",
                        "TypeScripts/Forguncy/CellType/ContainerCellType/UserControlPageCellType.js",
                        "TypeScripts/Forguncy/CellType/LayoutContainer/LayoutContainerBase.js",
                        "TypeScripts/Forguncy/CellType/LayoutContainer/FreeLayoutContainer.js",
                        "TypeScripts/Forguncy/CellType/LayoutContainer/FlexCellTypeContainer.js",
                        "TypeScripts/Forguncy/CellType/LayoutContainer/FormCellType.js",
                        "TypeScripts/Forguncy/CellType/ContainerCellType/UserControlContainerBase.js",
                        "TypeScripts/Forguncy/CellType/AttachmentCellType.js",
                        "TypeScripts/Forguncy/CellType/ButtonCellType.js",
                        "TypeScripts/Forguncy/CellType/BarcodeCellType.js",
                        "TypeScripts/Forguncy/CellType/CheckBoxCellType.js",
                        "TypeScripts/Forguncy/CellType/HyperlinkCellType.js",
                        "TypeScripts/Forguncy/CellType/ImageCellType.js",
                        "TypeScripts/Forguncy/CellType/PasswordCellType.js",
                        "TypeScripts/Forguncy/CellType/RecordNavigationCellType.js",
                        "TypeScripts/Forguncy/CellType/PageNavigateCellType.js",
                        "TypeScripts/Forguncy/CellType/CurrentUserCellType.js",
                        "TypeScripts/Forguncy/CellType/ProcessBarCellType.js",
                        "TypeScripts/Forguncy/CellType/CheckBoxGroupCellType.js",
                        "TypeScripts/Forguncy/CellType/RadioGroupCellType.js",
                        "TypeScripts/Forguncy/CellType/LabelCellType.js",
                        "TypeScripts/Forguncy/Page/PageBuilder.js",
                        "TypeScripts/Forguncy/Page/PageContentCreator.js",
                        "TypeScripts/Forguncy/Page/PageLayout.js",
                        "TypeScripts/Forguncy/Page/PageStretch.js",
                        "TypeScripts/Forguncy/Page/PageZoom.js",
                        "TypeScripts/Forguncy/UserManager.js",
                        "TypeScripts/Forguncy/Commands/CommandExecutor.js",
                        "TypeScripts/Forguncy/Commands/CommandBase.js",
                        "TypeScripts/Forguncy/Commands/ConditionCommand.js",
                        "TypeScripts/Forguncy/Commands/CommitEditTableCommand.js",
                        "TypeScripts/Forguncy/Commands/ExportToExcelCommand.js",
                        "TypeScripts/Forguncy/Commands/GoToRecordCommand.js",
                        "TypeScripts/Forguncy/Commands/GoToPageCommand.js",
                        "TypeScripts/Forguncy/Commands/NavigateCommand.js",
                        "TypeScripts/Forguncy/Commands/QueryCommand.js",
                        "TypeScripts/Forguncy/Commands/SortCommand.js",
                        "TypeScripts/Forguncy/Commands/SendMailCommand.js",
                        "TypeScripts/Forguncy/Commands/RunJavaScriptCommand.js",
                        "TypeScripts/Forguncy/Commands/ShowMessageCommand.js",
                        "TypeScripts/Forguncy/Commands/SubscribeCommand.js",
                        "TypeScripts/Forguncy/Commands/UpdateDataTableCommand/UpdateDataTableExecutor.js",
                        "TypeScripts/Forguncy/Commands/UpdateDataTableCommand/UpdateDataTableCommand.js",
                        "TypeScripts/Forguncy/Commands/ClosePopupCommand.js",
                        "TypeScripts/Forguncy/Commands/ShowPopupCommand.js",
                        "TypeScripts/Forguncy/Commands/Other/SetCellProeprtyCommand.js",
                        "TypeScripts/Forguncy/Commands/Other/SetRowColumnLayoutCommand.js",
                        "TypeScripts/Forguncy/Commands/PrintCommand.js",
                        "TypeScripts/Forguncy/Commands/UserManagerCommand.js",
                        "TypeScripts/Forguncy/Commands/LoopCommand.js",
                        "TypeScripts/Forguncy/Commands/EndLoopCommand.js",
                        "TypeScripts/Forguncy/Commands/UpdateListviewCommand.js",
                        "TypeScripts/Forguncy/Commands/DownloadExcelTemplateCommand.js",
                        "TypeScripts/Forguncy/Commands/WorkflowCommand.js",
                        "TypeScripts/Forguncy/Commands/ShareCommand.js",
                        "TypeScripts/Forguncy/Commands/ColumnOptionsCommand/ColumnOptionsCommand.js",
                        "TypeScripts/Forguncy/Commands/CallStoredProcedureCommand.js",
                        "TypeScripts/Forguncy/Commands/CallUserControlPageCommand.js",
                        "TypeScripts/Forguncy/Commands/CallUserControlPageMethod.js",
                        "TypeScripts/Forguncy/Commands/SetUserControlPagePropertyValueCommand.js",
                        "TypeScripts/Forguncy/Commands/RequestServerCommand.js",
                        "TypeScripts/Forguncy/Commands/ExportActiveReportCommand.js",
                        "TypeScripts/Forguncy/Commands/OpenActiveReportCommand.js",
                        "TypeScripts/Forguncy/Commands/OpenActiveReportWebDesignerCommand.js",
                        "TypeScripts/Forguncy/Commands/OperateCellTypeCommand.js",
                        "TypeScripts/Forguncy/Commands/RuntimeQueryCommand.js",
                        "TypeScripts/Forguncy/Commands/SetParameterCommand.js",
                        "TypeScripts/Forguncy/Commands/ReturnCommand.js",
                        "TypeScripts/Forguncy/Commands/IgnorePageDirtyCommand.js",
                        "TypeScripts/Forguncy/Commands/StopCommand.js",
                        "TypeScripts/Forguncy/Commands/SubscribeNotificationCommand.js",
                        "TypeScripts/Forguncy/Commands/UnSubscribeNotificationCommand.js",
                        "TypeScripts/Forguncy/Commands/ValidateHelpCommand.js",
                        "TypeScripts/Forguncy/Commands/SwitchLanguageCommand.js",
                        "TypeScripts/Forguncy/Validate/ValidationTooltipHelper.js",
                        "TypeScripts/Forguncy/ConditionFormat/ConditionFormatRuleHelper.js",
                        "TypeScripts/Forguncy/ConditionFormat/RuleModel.js",
                        "TypeScripts/Forguncy/ConditionFormat/ConditionFormatFormulaHelper.js",
                        "TypeScripts/Forguncy/Api/Api.js",
                        "TypeScripts/Forguncy/Api/WebApi.js",
                        "TypeScripts/Forguncy/Api/AccountApi.js",
                        "TypeScripts/Forguncy/Api/PluginApi.js",
                        "TypeScripts/Forguncy/Api/AutoTestApi.js",
                        "TypeScripts/Forguncy/BPM/Components/Common.js",
                        "TypeScripts/Forguncy/BPM/Components/UserSelectorDialog/UserSelectorDialog.js",
                        "TypeScripts/Forguncy/BPM/Components/UserSelectorDialog/UserSelectorDialogMobile.js",
                        "TypeScripts/Forguncy/BPM/Components/UserSelectorDialog/UserSelectorDialogUserSelectionArea.js",
                        "TypeScripts/Forguncy/BPM/Api/BaseApi.js",
                        "TypeScripts/Forguncy/BPM/Api/BaseEngineApi.js",
                        "TypeScripts/Forguncy/BPM/Api/BaseServerApi.js",
                        "TypeScripts/Forguncy/BPM/Api/EngineApi/DelegationConfigurationApi.js",
                        "TypeScripts/Forguncy/BPM/Api/EngineApi/TaskActionApi.js",
                        "TypeScripts/Forguncy/BPM/Api/EngineApi/ProcessInstanceApi.js",
                        "TypeScripts/Forguncy/BPM/Api/EngineApi/ProcessDefinitionApi.js",
                        "TypeScripts/Forguncy/BPM/Api/EngineApi/TaskQueryApi.js",
                        "TypeScripts/Forguncy/BPM/Api/ServerApi/DelegationConfigurationApi.js",
                        "TypeScripts/Forguncy/BPM/Api/ServerApi/TaskActionApi.js",
                        "TypeScripts/Forguncy/BPM/Model/ProcessModel.js",
                        "TypeScripts/Forguncy/BPM/Service/DelegationConfigurationService.js",
                        "TypeScripts/Forguncy/BPM/Service/ProcessDefinitionService.js",
                        "TypeScripts/Forguncy/BPM/Service/ProcessInstanceService.js",
                        "TypeScripts/Forguncy/BPM/Service/TaskQueryService.js",
                        "TypeScripts/Forguncy/BPM/Service/TaskActionService.js",
                        "TypeScripts/Forguncy/BPM/ProcessEngine.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/ProcessPanelCellType.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessTrackerCellType.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Component_Remark.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Component_Signature.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Component_Signature_Mobile.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Component_UserSelect.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Row_AddOnSign.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Row_CarbonCopy.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Row_Commit.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Row_Delegate.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Row_Remark.js",
                        "TypeScripts/Forguncy/CellType/BPM/ProcessPanelCellType/Components/TaskActionDialog/TaskActionDialog_Row_Signature.js",
                        "TypeScripts/Forguncy/Commands/BPM/ProcessStartCommand.js",
                        "TypeScripts/Forguncy/Commands/BPM/ProcessOpenOnlineCommand.js",
                        "TypeScripts/Forguncy/Commands/BPM/ProcessDelegateSettingCommand/ProcessDelegateSettingCommand.js",
                        "TypeScripts/Forguncy/Commands/BPM/ProcessDelegateSettingCommand/Components/DelegationListDialog.js",
                        "TypeScripts/Forguncy/Commands/BPM/ProcessDelegateSettingCommand/Components/CreateDelegateDialog.js",
                        "TypeScripts/Forguncy/Commands/BPM/ProcessDelegateSettingCommand/Components/UpdateDelegateDialog.js",
                        "TypeScripts/Forguncy/StaticFileHotUpdate/StaticFileHotUpdate.js",
                        "TypeScripts/Forguncy/Notification/HubManager.js",
                        "TypeScripts/Forguncy/Debugger/DebugManager.js",
                        "TypeScripts/Forguncy/Commands/DebugFrameEndCommand.js",
                        "Scripts/Bootstrap/js/tooltip.js",
                        "Scripts/Bootstrap/js/dropdown.js",
                        "Scripts/Bootstrap/js/tab.js",
                        "Scripts/SignalR/signalr.min.js",
                    ],
                    css: [
                        "Scripts/Bootstrap/css/bootstrap.css",
                        "Content/forguncycss.css",
                        "Content/forguncycss-ui.css",
                        "Content/forguncycss-ui-ex.css",
                        "Content/forguncycss-bpm.css"
                    ],
                    bundleJs: "forguncy.js",
                    bundleCss: "forguncy.css"
                },
                chart: {
                    js: [
                        "Scripts/ECharts/echarts.min.js",
                        "TypeScripts/Forguncy/Chart/ChartHelper.js",
                        "TypeScripts/Forguncy/Chart/PieChartConvertor.js",
                        "TypeScripts/Forguncy/Chart/RadarChartConvertor.js",
                        "TypeScripts/Forguncy/Chart/ScatterChartConvertor.js",
                        "TypeScripts/Forguncy/Chart/MapChartConvertor.js",
                        "TypeScripts/Forguncy/Chart/ChartLayoutHelper.js",
                        "TypeScripts/Forguncy/Chart/ChartCollection.js",
                    ],
                    bundleJs: "forguncyChart.js"
                },
                pvTable: {
                    js: [
                        "Scripts/bigNumber/bignumber.js",
                        "TypeScripts/Forguncy/Utility/hybridBignumber.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/lodash.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/enumsTS.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/ramda.min.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/resourceTS.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/utilsTS.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/CutsomSpreadJSCellType.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/DataSetTs.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCode/pivot-table.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableEvent.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableCellType.js",
                        "TypeScripts/Forguncy/CellType/PivotTable/PivotTableConditionalFormat.js",
                    ],
                    preDependenceModels: ["spreadJs"],
                    bundleJs: "pvTable.js"
                },
                inputMan: {
                    js: [
                        "Scripts/InputManJS/gc.inputman-js.ja.js",
                        "TypeScripts/InputManJS/InputmanJSHelper.js",
                        "TypeScripts/Forguncy/CellType/Inputman/InputmanCellTypeBase.js",
                        "TypeScripts/Forguncy/CellType/Inputman/ComboBoxCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/NumberCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/DateTimeCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/TimeCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/TextBoxCellType.js",
                    ],
                    css: [
                        "Scripts/InputManJS/gc.inputman-js-classic.css",
                        "Content/inputmanjs2css.css"
                    ],
                    pcOnly: true,
                    bundleJs: "inputMan.js",
                    bundleCss: "inputMan.css"
                },
                inputMan5: {
                    js: [
                        "Scripts/InputManJS/gc.inputman-js.ja.js",
                        "TypeScripts/InputManJS/InputmanJSHelper.js",
                        "TypeScripts/Forguncy/CellType/Inputman/InputmanCellTypeBase.js",
                        "TypeScripts/Forguncy/CellType/Inputman/ComboBoxCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/NumberCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/DateTimeCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/TimeCellType.js",
                        "TypeScripts/Forguncy/CellType/Inputman/TextBoxCellType.js",
                    ],
                    css: [
                        "Scripts/InputManJS/gc.inputman-js-modern.css",
                        "Content/inputmanjs5-modern-custom.css"
                    ],
                    pcOnly: true,
                    bundleJs: "inputMan5.js",
                    bundleCss: "inputMan5.css"
                },
                jsencrypt: {
                    js: [
                        "Scripts/JsEncrypt/jsencrypt.min.js",
                    ]
                },
                simpleBar: {
                    js: [
                        "Scripts/Simplebar/simplebar.js",
                    ],
                    css: [
                        "Scripts/Simplebar/simplebar.css"
                    ],
                    pcOnly: true,
                    supportInSimulater: true,
                },
                preview: {
                    js: [
                        'TypeScripts/Forguncy/Listview/ListViewHelper/Preview.js',
                        'TypeScripts/Forguncy/Api/PreviewApi.js',
                        'TypeScripts/Forguncy/Api/CellTypePreviewApi.js',
                    ],
                    bundleJs: "preview.js"
                },
                signaturePad: {
                    js: [
                        "Scripts/SignaturePad/signature_pad.umd.min.js",
                    ]
                },
                importExcel: {
                    js: [
                        "TypeScripts/Forguncy/Commands/ImportExcelToListViewCommand.js",
                        "Scripts/SpreadJS/interop/gc.spread.excelio.min.js"
                    ],
                    bundleJs: "importExcel.js"
                },
                cryptoJS: {
                    js: [
                        "Scripts/CryptoJS/crypto-js.min.js",
                    ]
                },
                "808F319C16303C6495A95682827D2F25": {
                    preDependenceModels: ["spreadJs"],
                    js: [
                        "Scripts/SpreadJS/modules/gc.spread.sheets.formulatextbox.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.floatingobjects.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.hyperlink.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.outlines.min.js",
                        "Scripts/SpreadJS/modules/gc.spread.sheets.sparklines.min.js",
                        "Scripts/SpreadJS/plugins/gc.spread.sheets.shapes.min.js",
                        "TypeScripts/SpreadJS/ReportSheetDisturbCode.js",
                        "Scripts/SpreadJS/plugins/gc.spread.sheets.charts.min.js",
                        "Scripts/SpreadJS/plugins/gc.spread.sheets.io.min.js",
                        "Scripts/SpreadJS/plugins/gc.spread.sheets.print.min.js",
                        "Scripts/SpreadJS/plugins/gc.spread.sheets.barcode.min.js",
                        "Scripts/SpreadJS/plugins/gc.spread.report.reportsheet.min.js"
                    ],
                    bundleJs: "peacocks.js"
                },
                "541272CCAF7368F69F6F959DBF00FB4C": {
                    preDependenceModels: ["spreadJs"],
                    js: []
                },
                vue2: {
                    js: [
                        "Scripts/Vue/vue-2.6.14.dev.js",
                    ],
                    publishJs: [
                        "Scripts/Vue/vue-2.6.14.prod.js",
                    ]
                },
                vue3: {
                    js: [
                        "Scripts/Vue/vue-3.2.37.dev.js",
                    ],
                    publishJs: [
                        "Scripts/Vue/vue-3.2.37.prod.js",
                    ]
                },
                iEPolyfill: {
                    js: [
                        "Scripts/Babel/7.10.4/polyfill.min.js",
                        "Scripts/Css/css-vars-ponyfill.js",
                        "Scripts/Css/init-css-polyfill-in-ie.js"
                    ]
                },
                vConsole: {
                    js: [
                        "Scripts/vConsole/vconsole.min.js",
                    ]
                },
                publicAndBuiltInFrontEndResource: {
                    localeDependent: ["PublicAndBuiltInFrontEndResource.js"],
                    js: [
                        "PublicAndBuiltInFrontEndResource.js"
                    ]
                },
                reactSuite: {
                    js: [
                        "TypeScripts/Forguncy/ReactSuite/ComponentName.js",
                        "TypeScripts/Forguncy/ReactSuite/Loader.js",
                        "TypeScripts/Forguncy/ReactSuite/Component.js"
                    ],
                    bundleJs: "reactSuite.js"
                },
                reactSuiteCompileResource: {
                    js: [
                        "Scripts/ReactSuite/react.suite.js"
                    ],
                }
            }
        };
        ModuleLoader.nameModuleMap = {};
        ModuleLoader.loadedJsOrCss = new Set();
        ModuleLoader.active = 0;
        return ModuleLoader;
    }());
    Forguncy.ModuleLoader = ModuleLoader;
    function LoadModule(module) {
        if (module instanceof Array) {
            return ModuleLoader.LoadModels(module, ModuleLoader.root);
        }
        else {
            return ModuleLoader.LoadModels([module], ModuleLoader.root);
        }
    }
    Forguncy.LoadModule = LoadModule;
    var metaDataCache = {
        userName: '',
        metaData: {}
    };
    var pageInfoCache = {};
    var requestCache = {};
    var MetadataLoader = (function () {
        function MetadataLoader() {
        }
        MetadataLoader.loggedError = function (url, jqXHR) {
            var errorText;
            try {
                errorText = url + "\r\n" + jqXHR.statusText + "\r\n" + jqXHR.responseText;
            }
            catch (_a) {
                errorText = url + "\r\n" + jqXHR.statusText;
            }
            if (jqXHR.status < 500) {
                console.warn(errorText);
            }
            else {
                (window.ForguncyErrors).push(errorText);
                console.error(errorText);
            }
        };
        MetadataLoader.GetUrlQuery = function (queryString, searchParent) {
            var query;
            if (searchParent && window.parent && window.parent.origin === window.origin) {
                query = window.parent.location.search.substring(1);
            }
            else {
                query = window.location.search.substring(1);
            }
            if (!(query && query.length > 0)) {
                return null;
            }
            if (!queryString) {
                return null;
            }
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var queryValue = vars[i].split("=");
                if (queryValue.length !== 2) {
                    continue;
                }
                if (decodeURIComponent(queryValue[0]).trim() === queryString.trim()) {
                    if (queryValue) {
                        try {
                            return decodeURIComponent(queryValue[1]);
                        }
                        catch (e) {
                            return null;
                        }
                    }
                }
            }
            return null;
        };
        MetadataLoader.IsInMobileSimulatorFrame = function () {
            try {
                return MetadataLoader.GetUrlQuery("isMobile", true) === "true";
            }
            catch (_a) {
                return false;
            }
        };
        MetadataLoader.loadVConsole = function () {
            try {
                return MetadataLoader.GetUrlQuery("vconsole", true) === "true";
            }
            catch (_a) {
                return false;
            }
        };
        MetadataLoader.IsMobileSafe = function () {
            try {
                return (MetadataLoader.IsMobile()
                    || MetadataLoader.GetUrlQuery("mobileChild", false) === "true"
                    || MetadataLoader.IsInMobileSimulatorFrame());
            }
            catch (_a) {
                return false;
            }
        };
        MetadataLoader.IsMobile = function () {
            if (Forguncy.ForguncyData.forceMobileChild) {
                return true;
            }
            if (this._isMobile !== undefined) {
                return this._isMobile;
            }
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
                this._isMobile = true;
                return true;
            }
            this._isMobile = false;
            return false;
        };
        MetadataLoader.PreloadMetadata = function () {
            ModuleLoader.root = Forguncy.StaticData.ForguncyRoot;
            ModuleLoader.nameModuleMap["Forguncy.Model.ImportExcelToListViewCommand, ServerDesignerCommon"] = "importExcel";
            ModuleLoader.nameModuleMap["Forguncy.Model.ProcessDelegateSettingCommand, ServerDesignerCommon"] = Forguncy.StaticData.UseInputManModernStyle ? "inputMan5" : "inputMan";
            var modules = ["publicAndBuiltInFrontEndResource", "calcEngine", "forguncy", "Fgc_UserCustomizeModule"];
            if (MetadataLoader.IsInMobileSimulatorFrame()) {
                modules.push("simpleBar");
            }
            if (MetadataLoader.loadVConsole()) {
                modules.push("vConsole");
            }
            if (MetadataLoader.isIE()) {
                modules.splice(0, 0, "iEPolyfill");
            }
            var preLoadBasicModules = ModuleLoader.LoadModels(modules, Forguncy.StaticData.ForguncyRoot);
            var locationPath = decodeURIComponent(location.pathname);
            MetadataLoader.GetMetadataRequest("PathName:" + locationPath, { isSubPage: false, preLoadModule: preLoadBasicModules }, function (data) {
                preLoadBasicModules.done(function () {
                    Forguncy.ForguncyData.Init();
                    if (MetadataLoader.getMetaCallback) {
                        MetadataLoader.getMetaCallback(data);
                    }
                    else {
                        MetadataLoader.metadataResult = data;
                    }
                    if (MetadataLoader.loadVConsole()) {
                        new VConsole();
                    }
                });
            });
        };
        MetadataLoader.isIE = function () {
            return !!(window.ActiveXObject || "ActiveXObject" in window);
        };
        MetadataLoader.PreloadForPreview = function () {
            document.body.append($("<div id='pageLoadingCover' style='display:none' />")[0]);
            ModuleLoader.LoadModels(["calcEngine", "forguncy", "chart", "spreadJs", "pvTable", "inputMan", "preview"], Forguncy.StaticData.ForguncyRoot).done(function () {
                Forguncy.ForguncyData.Init();
                window.pageLoaded = true;
            });
        };
        MetadataLoader.GetMetadataRequest = function (pageName, _a, successCallback) {
            var isSubPage = _a.isSubPage, _b = _a.isUserControl, isUserControl = _b === void 0 ? false : _b, _c = _a.preLoadModule, preLoadModule = _c === void 0 ? null : _c;
            var isMobile = MetadataLoader.IsMobileSafe();
            if (isSubPage) {
                var cacheMetaData = MetadataLoader.getMetadataFromCache(pageName, isMobile);
                if (cacheMetaData) {
                    MetadataLoader.loadModulesAndCallBack(cacheMetaData, successCallback);
                    return;
                }
            }
            var root = Forguncy.ForguncyData.ForguncyRoot;
            if (isUserControl) {
                var requestPage = MetadataLoader.GetPageDataRequest(pageName, root, Forguncy.StaticData.MetaDataVersion, true);
                requestPage.done(function (data) {
                    var metaData = {};
                    var pageData = data ? data[pageName.toLowerCase()] : null;
                    metaData.metaData = pageData.metaData;
                    metaData.metaDataObj = JSON.parse(pageData.metaData);
                    MetadataLoader.loadModulesAndCallBack(metaData, successCallback);
                });
            }
            else {
                var url = "Home/GetMetadata";
                var jqXHR = $.post(root + url, {
                    pageName: pageName,
                    token: MetadataLoader.GetUrlQuery("token", false),
                    isMobile: isMobile,
                    deviceInfo: MFAHelper.GetDeviceInfo()
                });
                var requestGlobalSettings_1;
                if (!MetadataLoader.globalSettingsInited) {
                    requestGlobalSettings_1 = MetadataLoader.GetPageDataRequest("90AC3BB5-87DF-4E25-B6C3-A78CC93DF159", root, Forguncy.StaticData.GlobalSettingVersion, false);
                }
                jqXHR.done(function (metaData) {
                    if (!metaData) {
                        return;
                    }
                    if (!metaData.pageName) {
                        successCallback(metaData);
                        return;
                    }
                    if (metaData.subPageInfo) {
                        metaData.autoGeneratedIDs = MetadataLoader.getAutoIdInfo(metaData.subPageInfo);
                        MetadataLoader.cacheSubPageInfo(metaData.subPageInfo);
                    }
                    var pageName = metaData.pageName;
                    var masterPageName = metaData.masterPage;
                    var requestPage = MetadataLoader.GetPageDataRequest(pageName, root, Forguncy.StaticData.MetaDataVersion, false);
                    var requestMasterPage = MetadataLoader.GetPageDataRequest(masterPageName, root, Forguncy.StaticData.MetaDataVersion, false);
                    $.when(requestPage, requestMasterPage, requestGlobalSettings_1, preLoadModule)
                        .done(function (data, masterData, globalSettings) {
                        var pageData = data ? data[0][pageName.toLowerCase()] : null;
                        masterData = masterData ? masterData[0][masterPageName.toLowerCase()] : null;
                        globalSettings = globalSettings ? globalSettings[0] : null;
                        MetadataLoader.cachePageData(metaData.storageUserName, data[0]);
                        if (globalSettings) {
                            MetadataLoader.globalSettingsInited = true;
                            metaData.globalSettings = globalSettings;
                        }
                        metaData.metaData = pageData.metaData;
                        metaData.metaDataObj = JSON.parse(pageData.metaData);
                        if (masterData) {
                            metaData.masterPageMetaData = masterData.metaData;
                            metaData.masterPageMetaDataObj = JSON.parse(masterData.metaData);
                        }
                        MetadataLoader.loadModulesAndCallBack(metaData, successCallback);
                    });
                });
                MetadataLoader.GetMetadataRequestFailed(root + url, jqXHR);
            }
        };
        MetadataLoader.getAutoIdInfo = function (subPageInfo) {
            var autoIDs = {};
            for (var page in subPageInfo) {
                MetadataLoader.mergeAutoIDMetaData(autoIDs, subPageInfo[page].AutoIDInfo);
            }
            return autoIDs;
        };
        MetadataLoader.mergeAutoIDMetaData = function (data1, data2) {
            if (!data2) {
                return;
            }
            for (var table in data2) {
                if (!data1[table]) {
                    data1[table] = {};
                }
                for (var field in data2[table]) {
                    var info = data2[table][field];
                    data1[table][field] = {
                        ID: info.ID,
                        Fields: info.Fields
                    };
                }
            }
        };
        MetadataLoader.cacheSubPageInfo = function (subPageInfo) {
            for (var page in subPageInfo) {
                if (!pageInfoCache[page]) {
                    if (subPageInfo[page].AutoIDInfo) {
                        for (var table in subPageInfo[page].AutoIDInfo) {
                            for (var field in subPageInfo[page].AutoIDInfo[table]) {
                                delete subPageInfo[page].AutoIDInfo[table][field].ID;
                            }
                        }
                    }
                    pageInfoCache[page] = subPageInfo[page];
                }
            }
        };
        MetadataLoader.cachePageData = function (userName, data) {
            userName = (userName === undefined || userName === null || userName === '') ?
                '' : userName.toLowerCase();
            if (userName !== metaDataCache.userName) {
                metaDataCache.userName = userName;
                metaDataCache.metaData = {};
            }
            for (var page in data) {
                metaDataCache.metaData[page] = data[page].metaData;
            }
        };
        MetadataLoader.getMetadataFromCache = function (pageName, isMobile) {
            if (isMobile === void 0) { isMobile = null; }
            if (!pageName) {
                return null;
            }
            if (isMobile === null) {
                isMobile = MetadataLoader.IsMobileSafe();
            }
            var lowerPageName = pageName.toLowerCase();
            var pageInfo = pageInfoCache[lowerPageName];
            if (isMobile && (pageInfo === null || pageInfo === void 0 ? void 0 : pageInfo.MobilePage)) {
                lowerPageName = pageInfo.MobilePage.toLowerCase();
                pageInfo = pageInfoCache[lowerPageName];
            }
            var pageDataStr = MetadataLoader.getSinglePageMetadataFromCache(lowerPageName);
            if (!pageDataStr) {
                return null;
            }
            var masterDataStr = null;
            var masterPageName = pageInfo === null || pageInfo === void 0 ? void 0 : pageInfo.MasterPage;
            if (masterPageName) {
                masterDataStr = MetadataLoader.getSinglePageMetadataFromCache(masterPageName.toLowerCase());
                if (!masterDataStr) {
                    return null;
                }
            }
            var autoIDInfo = {};
            if (pageInfo === null || pageInfo === void 0 ? void 0 : pageInfo.AutoIDInfo) {
                MetadataLoader.mergeAutoIDMetaData(autoIDInfo, pageInfo.AutoIDInfo);
            }
            var metaData = {
                pageName: pageName,
                metaData: pageDataStr,
                autoGeneratedIDs: autoIDInfo,
                metaDataObj: JSON.parse(pageDataStr)
            };
            if (masterDataStr) {
                metaData.masterPage = masterPageName;
                metaData.masterPageMetaData = masterDataStr;
                metaData.masterPageMetaDataObj = JSON.parse(masterDataStr);
            }
            return metaData;
        };
        MetadataLoader.getSinglePageMetadataFromCache = function (pageName) {
            var _a, _b;
            var userName = (_b = (_a = Forguncy === null || Forguncy === void 0 ? void 0 : Forguncy.ForguncyData) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.UserName;
            userName = (userName === undefined || userName === null || userName === '') ?
                '' : userName.toLowerCase();
            if (metaDataCache.userName !== userName) {
                return null;
            }
            else {
                return metaDataCache.metaData[pageName];
            }
        };
        MetadataLoader.loadModulesAndCallBack = function (metaData, callback) {
            var modules = [];
            if (metaData.metaDataObj) {
                modules = modules.concat(metaData.metaDataObj.Modules);
            }
            if (metaData.masterPageMetaDataObj) {
                modules = modules.concat(metaData.masterPageMetaDataObj.Modules);
            }
            if (!ModuleLoader.IsModuleLoaded(modules)) {
                ModuleLoader.LoadModels(modules, Forguncy.ForguncyData.ForguncyRoot).done(function () {
                    callback(metaData);
                });
            }
            else {
                callback(metaData);
            }
        };
        MetadataLoader.GetPageDataRequest = function (pageName, root, version, cacheData) {
            if (!pageName) {
                return;
            }
            var url2 = "Home/GetMetadata2";
            var isMobile = MetadataLoader.IsMobileSafe();
            var url = root + url2 + "?pageName=" + encodeURIComponent(pageName) + "&isMobile=" + isMobile + "&v2=" + version;
            if (requestCache[url] !== undefined) {
                return requestCache[url];
            }
            var jqXHR = $.ajax({
                cache: true,
                type: "GET",
                url: url
            });
            MetadataLoader.GetMetadataRequestFailed(url, jqXHR);
            requestCache[url] = jqXHR;
            jqXHR.done(function (data) {
                delete requestCache[url];
                if (cacheData) {
                    MetadataLoader.cachePageData(Forguncy.ForguncyData.userInfo.UserName, data);
                }
            });
            return jqXHR;
        };
        MetadataLoader.GetMetadataRequestFailed = function (url, jqXHR) {
            jqXHR.fail(function () {
                var _a;
                delete requestCache[url];
                Forguncy.PageBuilder === null || Forguncy.PageBuilder === void 0 ? void 0 : Forguncy.PageBuilder.hidePageLoadingCover();
                (_a = Forguncy.PageBuilder === null || Forguncy.PageBuilder === void 0 ? void 0 : Forguncy.PageBuilder.pageCover) === null || _a === void 0 ? void 0 : _a.hide();
                MetadataLoader.loggedError(url, jqXHR);
            });
        };
        MetadataLoader.GetMetaDataResult = function (callback) {
            if (MetadataLoader.metadataResult) {
                callback(MetadataLoader.metadataResult);
                MetadataLoader.metadataResult = null;
            }
            else {
                MetadataLoader.getMetaCallback = callback;
            }
        };
        MetadataLoader._isMobile = undefined;
        MetadataLoader.metadataResult = null;
        MetadataLoader.getMetaCallback = null;
        MetadataLoader.globalSettingsInited = false;
        return MetadataLoader;
    }());
    Forguncy.MetadataLoader = MetadataLoader;
    var MFAHelper = (function () {
        function MFAHelper() {
        }
        MFAHelper.GetDeviceInfo = function () {
            var _a, _b, _c;
            var infos = [];
            infos.push((_a = localStorage.getItem(MFAHelper.mfaDeviceLocalStorageKey)) !== null && _a !== void 0 ? _a : MFAHelper.mfaDeviceLocalStorageKey);
            var length = (_c = (_b = navigator.plugins) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
            for (var i = 0; i < length; i++) {
                infos.push(navigator.plugins[i].name);
            }
            infos.push(this._getCanvasFingerprint());
            return infos.join(',');
        };
        MFAHelper._getCanvasFingerprint = function () {
            try {
                var canvas = $('<canvas>')[0];
                var context = canvas.getContext('2d');
                context.font = '18pt Arial';
                context.textBaseline = 'top';
                context.fillText('Hello, user.', 2, 2);
                var result = canvas.toDataURL('image/jpeg');
                return result.length;
            }
            catch (_a) {
                return 0;
            }
        };
        MFAHelper.mfaDeviceLocalStorageKey = '25538D1E-3B9A-4E10-9FA2-3D850A47A8A6';
        return MFAHelper;
    }());
    Forguncy.MFAHelper = MFAHelper;
    var SessionStorageManager = (function () {
        function SessionStorageManager() {
        }
        Object.defineProperty(SessionStorageManager, "sessionKey", {
            get: function () {
                return "fgc-session-pagecontext-" + Forguncy.StaticData.ForguncyRoot.replace(/\//g, "");
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SessionStorageManager, "pageContext", {
            get: function () {
                if (Forguncy.DelayRefresh === null || Forguncy.DelayRefresh === void 0 ? void 0 : Forguncy.DelayRefresh._isUnitTest) {
                    return null;
                }
                if (this.isInIframe) {
                    return null;
                }
                return sessionStorage.getItem(SessionStorageManager.sessionKey);
            },
            set: function (value) {
                if (Forguncy.DelayRefresh === null || Forguncy.DelayRefresh === void 0 ? void 0 : Forguncy.DelayRefresh._isUnitTest) {
                    return;
                }
                if (this.isInIframe) {
                    return;
                }
                if (value === null) {
                    sessionStorage.removeItem(SessionStorageManager.sessionKey);
                }
                else {
                    sessionStorage.setItem(SessionStorageManager.sessionKey, value);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SessionStorageManager, "isInIframe", {
            get: function () {
                try {
                    return window.self !== window.top.window;
                }
                catch (_a) {
                    return true;
                }
            },
            enumerable: false,
            configurable: true
        });
        return SessionStorageManager;
    }());
    Forguncy.SessionStorageManager = SessionStorageManager;
})(Forguncy || (Forguncy = {}));
