# reference:
# - https://github.com/raelmax/android-webview
# - https://czak.pl/posts/minimal-android-project

AMAN = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0" >

    <uses-sdk />

    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="%s"
        android:theme="@android:style/Theme.NoTitleBar" >
        <activity
            android:name="%s.MainActivity"
            android:configChanges="orientation|screenSize"
            android:label="%s"
            android:exported="true" >
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""

AMAC = """package %s;
import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Window;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        MainActivity thaz = this;
        getWindow().requestFeature(Window.FEATURE_NO_TITLE);
        mWebView = new WebView(this);
        mWebView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        mWebView.getSettings().setJavaScriptEnabled(true);
        mWebView.getSettings().setDomStorageEnabled(true);
        mWebView.getSettings().setUseWideViewPort(true);
        mWebView.loadUrl("%s");
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        mWebView.setWebChromeClient(new WebChromeClient(){
            // Need to accept permissions to use the camera
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // grants permission for app. video not showing
                if (ContextCompat.checkSelfPermission(thaz, Manifest.permission.CAMERA)
                    != PackageManager.PERMISSION_GRANTED
                ) {
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, 1010);
                }

                if (ContextCompat.checkSelfPermission(thaz, Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED
                ) {
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1010);
                }

                request.grant(request.getResources()); // is this right?
            }
        });
        this.setContentView(mWebView);
    }

    @Override
    public boolean onKeyDown(final int keyCode, final KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}"""

ABG = """buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.5.2'
    }
}

repositories {
    google()
}

apply plugin: 'com.android.application'

dependencies {
    implementation 'androidx.appcompat:appcompat:1.1.0'
}

android {
    namespace = "%s"

    compileSdkVersion 34

    defaultConfig {
        targetSdk = 34
        minSdkVersion = 14
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_%s
        targetCompatibility JavaVersion.VERSION_%s
    }
}"""

AGP = """android.useAndroidX=true
android.enableJetifier=true"""

TEMPLATES = {
    "android": {
        "manifest": AMAN,
        "activity": AMAC,
        "gradle": ABG,
        "properties": AGP,
        "icons": "convert -background none %s -resize %s %s/ic_launcher.png",
        "tstore": "%s -Djavax.net.ssl.trustStore=%s -Djavax.net.ssl.trustStorePassword=%s",
        "isizes": {
            'ldpi': '36x36',
            'mdpi': '48x48',
            'hdpi': '72x72',
            'xhdpi': '96x96'
        },
        "env": {
            "JAVA_HOME": {
                "locater": "cacerts|grep jvm/java-_JV_-",
                "splitter": "/lib/security"
            },
            "ANDROID_HOME": {
                "locater": "/lib/android-sdk",
                "splitter": "\n"
            }
        }
    }
}