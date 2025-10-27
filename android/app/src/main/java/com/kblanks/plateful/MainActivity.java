package com.kblanks.plateful;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.net.URLEncoder;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleSharedIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSharedIntent(intent);
    }

    private void handleSharedIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null &&
                ("text/plain".equals(type) || type.startsWith("text/"))) {
            handleSharedText(intent);
        }
    }

    private void handleSharedText(Intent intent) {
        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        String sharedTitle = intent.getStringExtra(Intent.EXTRA_SUBJECT);

        if (sharedText != null || sharedTitle != null) {
            try {
                // Create JSON object with shared data
                JSONObject intentData = new JSONObject();
                if (sharedTitle != null) {
                    intentData.put("title", sharedTitle);
                }
                if (sharedText != null) {
                    intentData.put("text", sharedText);
                }

                // Create URL with intent data
                String encodedData = URLEncoder.encode(intentData.toString(), "UTF-8");
                String url = "https://app.plateful.cloud/recipe/add?intent=" + encodedData;

                // Use JavaScript to notify your ShareHandler
                getBridge().getWebView().post(() -> {
                    String js = String.format(
                            "window.dispatchEvent(new CustomEvent('shareIntent', { detail: %s }));",
                            intentData.toString());
                    getBridge().getWebView().evaluateJavascript(js, null);
                });

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
