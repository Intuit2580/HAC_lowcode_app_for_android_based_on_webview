package com.huozige.lab.container.utilities;

import static android.os.Looper.getMainLooper;

import android.os.Handler;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;


import java.io.IOException;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;


public class JsBridgeInterface {
    private final WebView webView;
    private OkHttpClient httpClient;
    public JsBridgeInterface(WebView webView) {
        this.webView = webView;
        httpClient = new OkHttpClient();
    }

    @JavascriptInterface
    public void onJsPostRequest(String callbackId, String url, String body) {

        new Thread(() -> {
            try {
                String response = forwardPost(url, body);
                final String finalResponse = response;

                new Handler(getMainLooper()).post(() ->
                        webView.evaluateJavascript(
                                String.format("window.__handlePostResponse('%s', %s)",
                                        callbackId, finalResponse),
                                null
                        ));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    @JavascriptInterface
    public void onJsGetRequest(String callbackId, String url) {
        new Thread(() -> {
            try {
                String response = fetchRemoteGet(url); // 使用 OkHttp 发起真实请求
                final String finalResponse = response;

                new Handler(getMainLooper()).post(() ->
                        webView.evaluateJavascript(
                                String.format("window.__handleGetResponse('%s', %s)",
                                        callbackId, finalResponse),
                                null
                        ));

            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private String forwardPost(String originalUrl, String body) throws IOException {

        String base = "https://hac.app.hzgcloud.cn";

        String newUrl =(originalUrl.contains(base) ? "" : base) + originalUrl.replace("TestRedirct", "TestRedirct2");

        RequestBody requestBody = RequestBody.create(body, MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder()
                .url(newUrl)
                .post(requestBody)
                .build();

        Response response = httpClient.newCall(request).execute();
        if (response.isSuccessful() && response.body() != null) {
            return response.body().string();
        }
        return "{\"error\": \"request failed\"}";
    }

    private String fetchRemoteGet(String url) throws IOException {
        Request request = new Request.Builder()
                .url(url)
                .build();

        Response response = httpClient.newCall(request).execute();
        if (response.isSuccessful() && response.body() != null) {
            return response.body().string();
        }
        return "{\"error\": \"GET request failed\"}";
    }

}
