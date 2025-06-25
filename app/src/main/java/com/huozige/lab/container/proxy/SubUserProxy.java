package com.huozige.lab.container.proxy;

import android.webkit.JavascriptInterface;

import com.huozige.lab.container.platform.CallbackParams;
import com.nctlj.sznt_slave.SzntManager;
import com.nctlj.sznt_slave.User;

public class SubUserProxy extends AbstractProxy {
    @Override
    public String getName() {
        return "subUser";
    }

    @JavascriptInterface
    public void userInfoAsync(String ticket, String type) {

        registryCallbackTicket(ticket);

        SzntManager manager = new SzntManager(getWebView().getContext());

        User user = manager.getUserInfo();

        if (user == null) {
            callback(CallbackParams.error("身份失效"));
        } else {
            switch (type) {
                case ("name"): callback(CallbackParams.success(user.getUserName())); break;
                case ("token"): callback(CallbackParams.success(user.getToken())); break;
                default:
                    throw new IllegalStateException("Unexpected value: " + type);
            }
        }
    }
}
