Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"
!include "${INSTALLER_FILE_LIST}"
!ifndef PAYLOAD_DIR
 !define PAYLOAD_DIR "${PROJECT_DIR}/release/win-unpacked"
!endif
Name "JH Diesel Calibration Suite"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\JH Diesel Calibration Suite"
InstallDirRegKey HKCU "Software\JHDiesel" "InstallDir"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\JH Diesel Calibration Suite.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch JH Diesel"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Function .onInit
 ${IfNot} ${AtLeastWin10}
  MessageBox MB_ICONSTOP "JH Diesel requires Windows 10 or Windows 11."
  Abort
 ${EndIf}
 ${IfNot} ${RunningX64}
  MessageBox MB_ICONSTOP "This installer requires 64-bit Windows 10 or Windows 11."
  Abort
 ${EndIf}
FunctionEnd
Section "JH Diesel"
 SetShellVarContext current
 SetOutPath "$INSTDIR"
 SetOverwrite on
 ClearErrors
 File /r "${PAYLOAD_FILES}"
 IfErrors 0 +3
  MessageBox MB_ICONSTOP "Installation could not copy all files. Close JH Diesel, check disk space and run this installer again."
  Abort
 WriteUninstaller "$INSTDIR\Uninstall JH Diesel.exe"
 CreateDirectory "$SMPROGRAMS\JH Diesel"
 CreateShortCut "$SMPROGRAMS\JH Diesel\JH Diesel.lnk" "$INSTDIR\JH Diesel Calibration Suite.exe"
 CreateShortCut "$SMPROGRAMS\JH Diesel\Uninstall.lnk" "$INSTDIR\Uninstall JH Diesel.exe"
 CreateShortCut "$DESKTOP\JH Diesel.lnk" "$INSTDIR\JH Diesel Calibration Suite.exe"
 WriteRegStr HKCU "Software\JHDiesel" "InstallDir" "$INSTDIR"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel" "DisplayName" "JH Diesel Calibration Suite"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel" "DisplayVersion" "${VERSION}"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel" "UninstallString" '$\"$INSTDIR\Uninstall JH Diesel.exe$\"'
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel" "DisplayIcon" "$INSTDIR\JH Diesel Calibration Suite.exe"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel" "InstallLocation" "$INSTDIR"
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel" "NoModify" 1
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel" "NoRepair" 1
SectionEnd
Section "Uninstall"
 SetShellVarContext current
 !insertmacro RemoveInstalledFiles
 Delete "$INSTDIR\Uninstall JH Diesel.exe"
 RMDir "$INSTDIR"
 Delete "$DESKTOP\JH Diesel.lnk"
 Delete "$SMPROGRAMS\JH Diesel\JH Diesel.lnk"
 Delete "$SMPROGRAMS\JH Diesel\Uninstall.lnk"
 RMDir "$SMPROGRAMS\JH Diesel"
 DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\JHDiesel"
 DeleteRegKey HKCU "Software\JHDiesel"
SectionEnd
