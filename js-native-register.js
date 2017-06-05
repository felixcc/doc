/**
 * Created by xiaoyun on 16/12/6.
 */
import webapi from '../../api/webapi'
import store from '../../store'

/**
 * 保存抓取日志
 * @private
 */
const _postDeviceLog = async (phase, type, errorCode) => {
  await webapi.creditItem.saveDeviceLog({
    userId: store.state.userState.user.userId,
    channelCode: store.state.userState.user.channelCode,
    phase,
    type,
    errorCode
  })
}

const _nativeBridge = {
  bridge: null,
  registerJSFunc: function() {
    _nativeBridge.bridge.registerHandler('fpjkBridgeCallJavaScript')
  },
  callNativeFunc: function(name, data, func, phase) {
    return new Promise((resolve, reject) => {
      try {
        // debug
        debug('SDK调用开始', name)
        _nativeBridge.bridge.callHandler('fpjkBridgeCallNative', {'opt': name, 'data': data}, (param) => {  // 处理回调参数类型
          debug('SDK调用成功', name, param)
          if (param.body && param.body.errorCode) {
            _postDeviceLog(phase, name, param.body.errorCode)
            return reject('native error')
          }
          if (func) {
            func(param).then(res => {
              // debug
              debug('上报数据派成功', name, res)
              resolve(res)
            })
          } else {
            resolve('ok')
          }
        })
      } catch (e) {
        // debug
        const data = e.message ? e.message : e
        debug('调用SDK出错', name, data)
        reject({name, data})
      }
    })
  }
}

  ;
(function(callback) {
  if (window.WebViewJavascriptBridge) {
    return callback(window.WebViewJavascriptBridge)
  }
  if (window.WVJBCallbacks) {
    return window.WVJBCallbacks.push(callback)
  }
  window.WVJBCallbacks = [callback]
  var WVJBIframe = document.createElement('iframe')
  WVJBIframe.style.display = 'none'
  WVJBIframe.src = 'wvjbscheme://__BRIDGE_LOADED__'
  document.documentElement.appendChild(WVJBIframe)
  setTimeout(function() {
    document.documentElement.removeChild(WVJBIframe)
  }, 0)
}(function(bridge) {
  _nativeBridge.bridge = bridge
  _nativeBridge.registerJSFunc()
}))

const _native = {
  // 使用native webview打开指定URL
  openUrl: (data, callback, phase) => _nativeBridge.callNativeFunc('openUrl', data, callback, phase),

  // 获取设备基本信息
  getDeviceInfo: (callback, phase) => _nativeBridge.callNativeFunc('getDeviceInfo', null, callback, phase),

  // 获取用户地理位置信息,geocoder 是否进行地址解析,默认否
  getLocation: (callback, geocoder = false, phase) => _nativeBridge.callNativeFunc('getLocation', {geocoder: Number(geocoder)}, callback, phase),

  // 获取用户通讯录
  getContacts: (uid, callback, phase) => _nativeBridge.callNativeFunc('getContacts', {uid}, callback, phase),

  // 抓取指定url下的cookie
  getCookie: (url, callback, phase) => _nativeBridge.callNativeFunc('getCookie', {url: url}, callback, phase),

  // 获取通话记录
  getCallRecords: (uid, callback, phase) => _nativeBridge.callNativeFunc('getCallRecords', {uid}, callback, phase),

  // 获取短信记录
  getSMSRecords: (uid, callback, phase) => _nativeBridge.callNativeFunc('getSMSRecords', {uid}, callback, phase),

  // 更新导航栏,回调函数 为必填
  refreshNavigation: () => _nativeBridge.callNativeFunc('refreshNavigation', null, () => {}),

  // 退出,回调函数 为必填
  logout: () => _nativeBridge.callNativeFunc('logout', null, () => {})
}

export default _native
