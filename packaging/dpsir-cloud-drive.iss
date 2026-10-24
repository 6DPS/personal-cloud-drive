; ==============================================================================
; DPSir Personal Cloud Drive - Inno Setup Script
; Commercial Windows Installer Builder
; ==============================================================================

#define MyAppName "DPSir 智云盘"
#define MyAppVersion "1.0.6"
#define MyAppPublisher "DPSir Studio"
#define MyAppExeName "DPSir-ZhiYunPan.exe"
#define MyIconFile "app-icon.ico"

[Setup]
AppId={{C81B8563-718D-4D3F-B5E3-A7851A31024D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible
DefaultDirName={autopf}\DPSir 智云盘
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=DPSir-ZhiYunPan-Setup-v1.0.6
SetupIconFile={#MyIconFile}
WizardSmallImageFile=wizard-small.bmp
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=yes
UninstallDisplayIcon={app}\DPSir-ZhiYunPan.exe
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "chinesesimp"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart"; Description: "开机自动在后台静默运行网盘服务 (端口8081常驻待命，手机可随时连，无弹窗打扰)"; GroupDescription: "自动化选项:"; Flags: unchecked

[InstallDelete]
; 清理可能残留的旧版本启动项，确保干净安装
Type: files; Name: "{userstartup}\{#MyAppName}.lnk"
Type: files; Name: "{userstartup}\{#MyAppName}后台服务.lnk"
Type: files; Name: "{autostartup}\{#MyAppName}.lnk"
Type: files; Name: "{autostartup}\{#MyAppName}后台服务.lnk"

[Files]
; 原生桌面客户端引擎及运行库 (独立原生 EXE，彻底消除 Edge 图标问题)
Source: "native-bin\DPSir-ZhiYunPan.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "native-bin\Microsoft.Web.WebView2.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "native-bin\Microsoft.Web.WebView2.WinForms.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "native-bin\WebView2Loader.dll"; DestDir: "{app}"; Flags: ignoreversion

; 运行时与核心程序
Source: "app-icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\runtime\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "..\server.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\.env.example"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\public\favicon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "launch-desktop.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "stop-desktop.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\scripts\enable-autostart.vbs"; DestDir: "{app}"; DestName: "开启开机后台自启.vbs"; Flags: ignoreversion
Source: "..\scripts\disable-autostart.vbs"; DestDir: "{app}"; DestName: "关闭开机自启.vbs"; Flags: ignoreversion

; 依赖与静态资源库
Source: "..\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\tools\*"; DestDir: "{app}\tools"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\开机自启管理\开启开机后台自启"; Filename: "wscript.exe"; Parameters: """{app}\scripts\enable-autostart.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app-icon.ico"
Name: "{group}\开机自启管理\关闭开机后台自启"; Filename: "wscript.exe"; Parameters: """{app}\scripts\disable-autostart.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app-icon.ico"
Name: "{group}\停止网盘服务"; Filename: "wscript.exe"; Parameters: """{app}\stop-desktop.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app-icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon
Name: "{autostartup}\{#MyAppName}后台服务"; Filename: "wscript.exe"; Parameters: """{app}\scripts\autostart-service.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app-icon.ico"; Tasks: autostart

[Run]
; 自动配置 Windows 防火墙允许 8081 局域网访问（手机扫码互联畅通）
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""DPSir ZhiYunPan"" dir=in action=allow protocol=TCP localport=8081"; Flags: runhidden
; 安装完成后启动程序
Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Description: "立即启动 {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; 卸载时停止服务并清理防火墙规则
Filename: "wscript.exe"; Parameters: """{app}\stop-desktop.vbs"" /silent"; WorkingDir: "{app}"; Flags: runhidden; RunOnceId: "StopDPSirCloudDrive"
Filename: "wscript.exe"; Parameters: """{app}\scripts\disable-autostart.vbs"" /silent"; WorkingDir: "{app}"; Flags: runhidden; RunOnceId: "DisableDPSirCloudDriveAutostart"
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""DPSir ZhiYunPan"""; Flags: runhidden; RunOnceId: "RemoveDPSirFirewallRule"

[Code]
// 准备安装前自动静默停止旧进程，避免文件占用
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM DPSir-ZhiYunPan.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('powershell.exe', '-NoProfile -NonInteractive -Command "$p = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue }"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := '';
end;

// 初始化默认 .env 配置文件（如果已存在则保留，绝不破坏老用户的任何配置和数据路径）
procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvPath: String;
  DefaultStorage: String;
  EnvContent: String;
begin
  if CurStep = ssPostInstall then
  begin
    EnvPath := ExpandConstant('{app}\.env');
    if not FileExists(EnvPath) then
    begin
      if DirExists('D:\') then
        DefaultStorage := 'D:\PersonalCloudDrive'
      else if DirExists('E:\') then
        DefaultStorage := 'E:\PersonalCloudDrive'
      else
        DefaultStorage := 'C:\PersonalCloudDrive';

      // 自动创建数据根目录
      if not DirExists(DefaultStorage) then
        CreateDir(DefaultStorage);

      EnvContent := 'PORT=8081' + #13#10 +
                    'HOST=0.0.0.0' + #13#10 +
                    'STORAGE_BASE_ROOT=' + DefaultStorage + #13#10 +
                    'CLOUD_DRIVE_PASSWORD=' + #13#10;
      SaveStringToFile(EnvPath, EnvContent, False);
    end;
  end;
end;
