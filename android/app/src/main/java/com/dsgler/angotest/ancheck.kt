package com.dsgler.angotest

import ancheck.Ancheck
//import ancheck.Ancheck.getStore
//import ancheck.Ancheck.setStore
import ancheck.MyClient
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import org.json.JSONObject
import org.json.JSONArray

fun readableMapToJson(readableMap: ReadableMap): JSONObject {
    val jsonObject = JSONObject()

    val iterator = readableMap.keySetIterator()
    while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        when (readableMap.getType(key)) {
            ReadableType.Null -> jsonObject.put(key, JSONObject.NULL)
            ReadableType.Boolean -> jsonObject.put(key, readableMap.getBoolean(key))
            ReadableType.Number -> jsonObject.put(key, readableMap.getDouble(key))
            ReadableType.String -> jsonObject.put(key, readableMap.getString(key))
            ReadableType.Map -> jsonObject.put(key, readableMapToJson(readableMap.getMap(key)!!))
            ReadableType.Array -> jsonObject.put(key, readableArrayToJson(readableMap.getArray(key)!!))
        }
    }
    return jsonObject
}

fun readableArrayToJson(readableArray: ReadableArray): JSONArray {
    val jsonArray = JSONArray()
    for (i in 0 until readableArray.size()) {
        when (readableArray.getType(i)) {
            ReadableType.Null -> jsonArray.put(JSONObject.NULL)
            ReadableType.Boolean -> jsonArray.put(readableArray.getBoolean(i))
            ReadableType.Number -> jsonArray.put(readableArray.getDouble(i))
            ReadableType.String -> jsonArray.put(readableArray.getString(i))
            ReadableType.Map -> jsonArray.put(readableMapToJson(readableArray.getMap(i)!!))
            ReadableType.Array -> jsonArray.put(readableArrayToJson(readableArray.getArray(i)!!))
        }
    }
    return jsonArray
}


class AncheckModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "Ancheck"

    @ReactMethod
    fun InitStore() {
        Ancheck.initStore()
    }

    //    @ReactMethod
    fun SetStore(user: String, mc: MyClient) {
        Ancheck.setStore(user, mc)
    }

    //    @ReactMethod
    fun GetStore(user: String): MyClient? {
        return Ancheck.getStore(user)
    }

    @ReactMethod
    fun say() {
        val amc = MyClient()
        amc.user = "test"
        SetStore("test", MyClient())
        Log.d("my6", "导入" + name + "成功")
    }

    @ReactMethod
    fun login(uid: String, passwd: String, promise: Promise) {
        val amc = ancheck.MyClient()
        try {
            amc.login(uid, passwd, 3)
        } catch (e: Exception) {
            promise.reject(e)
            return
        }
        SetStore(amc.user, amc)
        promise.resolve(true)
    }

    @ReactMethod
    fun check(user: String, promise: Promise) {
        val amc = GetStore(user)
        if (amc == null) {
            promise.reject(Exception("内部错误：此user没有记录"))
            return
        }

        try {
            val name = amc.checkIsLoged()
            promise.resolve(name)
        } catch (e: Exception) {
            promise.reject(e)
        }
    }

    @ReactMethod
    fun get(user: String, url: String, headers: ReadableMap,promise: Promise) {
        val amc = GetStore(user)
        if (amc == null) {
            promise.reject(Exception("内部错误：此user没有记录"))
            return
        }

        val ret = try {
            amc.get(url,readableMapToJson(headers).toString())
        } catch (e: Exception) {
            promise.reject(e)
            return
        }

        val m = Arguments.createMap()
        m.putString("body",ancheck.Ancheck.bytes2String(ret.body))
        m.putString("statusCode",ret.statusCode.toString())
        promise.resolve(m)
    }

    @ReactMethod
    fun post(user: String, url: String, inbody: String,headers: ReadableMap, promise: Promise) {
        val amc = GetStore(user)
        if (amc == null) {
            promise.reject(Exception("内部错误：此user没有记录"))
            return
        }

        val ret = try {
            amc.post(url, inbody.toByteArray(),readableMapToJson(headers).toString())
        } catch (e: Exception) {
            promise.reject(e)
            return
        }

        val m = Arguments.createMap()
        m.putString("body",ancheck.Ancheck.bytes2String(ret.body))
        m.putString("statusCode",ret.statusCode.toString())
        promise.resolve(m)
    }


}