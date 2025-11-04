; NSIS Custom Installer Script for QDaria QRNG
; Additional configuration for Windows installer

!define PRODUCT_NAME "QDaria QRNG"
!define PRODUCT_VERSION "0.1.0"
!define PRODUCT_PUBLISHER "QDaria"
!define PRODUCT_WEB_SITE "https://qdaria.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\qrng-harvester.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; Custom Pages
!define MUI_WELCOMEPAGE_TITLE "Welcome to QDaria QRNG Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of ${PRODUCT_NAME}.$\r$\n$\r$\nQuantum Random Number Generator with Post-Quantum Cryptography$\r$\n$\r$\nClick Next to continue."

!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} has been installed successfully.$\r$\n$\r$\nConfigure your quantum provider credentials in:%USERPROFILE%\.qdaria\qrng\config.yaml"
!define MUI_FINISHPAGE_RUN "$INSTDIR\qrng-harvester.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run QDaria QRNG now"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.md"

; Custom Functions
Function .onInit
  ; Check if already installed
  ReadRegStr $R0 HKLM "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done

  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "${PRODUCT_NAME} is already installed. $\n$\nClick OK to remove the previous version or Cancel to cancel this upgrade." \
    IDOK uninst
  Abort

  uninst:
    ClearErrors
    ExecWait '$R0 _?=$INSTDIR'

  done:
FunctionEnd

; Environment Variable Setup
Section "Environment Variables"
  ; Add to PATH
  EnVar::SetHKCU
  EnVar::AddValue "PATH" "$INSTDIR\bin"
  Pop $0

  ; Create user config directory
  CreateDirectory "$PROFILE\.qdaria\qrng"

  ; Set permissions
  AccessControl::GrantOnFile "$PROFILE\.qdaria\qrng" "(S-1-5-32-545)" "FullAccess"
SectionEnd

; Registry Keys
Section "Registry"
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\bin\qrng-harvester.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\bin\qrng-harvester.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

; Uninstaller
Section "Uninstall"
  ; Remove from PATH
  EnVar::SetHKCU
  EnVar::DeleteValue "PATH" "$INSTDIR\bin"
  Pop $0

  ; Remove registry keys
  DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"

  ; Remove files and directories
  Delete "$INSTDIR\*.*"
  RMDir /r "$INSTDIR"

  ; Remove shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\*.*"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
SectionEnd
