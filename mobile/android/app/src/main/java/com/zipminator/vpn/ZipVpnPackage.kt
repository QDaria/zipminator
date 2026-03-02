package com.zipminator.vpn

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * ZipVpnPackage — ReactPackage that registers [ZipVpnModule] with the React Native bridge.
 *
 * Registration in MainApplication.kt:
 * ```kotlin
 * override fun getPackages(): List<ReactPackage> = listOf(
 *     MainReactPackage(),
 *     ZipVpnPackage()
 * )
 * ```
 */
class ZipVpnPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(ZipVpnModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
