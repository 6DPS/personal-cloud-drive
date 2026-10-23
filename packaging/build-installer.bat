@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================================
echo     正在构建 DPSir 智云盘 Windows 商业标准安装包 (.exe)...
echo ===============================================================
echo.

set "ISCC_EXE=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
if not exist "%ISCC_EXE%" (
    set "ISCC_EXE=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
)
if not exist "%ISCC_EXE%" (
    set "ISCC_EXE=C:\Program Files\Inno Setup 6\ISCC.exe"
)
if not exist "%ISCC_EXE%" (
    echo [错误] 未找到 Inno Setup 编译器 ISCC.exe!
    pause
    exit /b 1
)

echo [1/4] 编译独立原生桌面客户端 (DPSir-ZhiYunPan.exe)...
"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /platform:x64 /win32icon:"app-icon.ico" /win32manifest:"native-bin\app.manifest" /r:native-bin\Microsoft.Web.WebView2.WinForms.dll /r:native-bin\Microsoft.Web.WebView2.Core.dll /r:System.Windows.Forms.dll /r:System.dll /r:System.Drawing.dll /out:"native-bin\DPSir-ZhiYunPan.exe" native-bin\MainWindow.cs
if %errorlevel% neq 0 (
    echo [错误] 桌面客户端编译失败!
    pause
    exit /b 1
)

echo [2/4] 检查内置运行时环境 (runtime\node.exe)...
if not exist "..\runtime\node.exe" (
    echo [提示] 正在从系统复制 node.exe 到 runtime 目录...
    mkdir "..\runtime" 2>nul
    copy /y "%ProgramFiles%\nodejs\node.exe" "..\runtime\node.exe" >nul
)
if not exist "..\runtime\node.exe" (
    echo [错误] 无法找到 node.exe，请确保系统已安装 Node.js!
    pause
    exit /b 1
)

echo [3/4] 清理旧的编译输出...
if not exist "..\dist" mkdir "..\dist"

echo [4/4] 正在调用 Inno Setup 进行 LZMA 极限高压缩编译打包...
"%ISCC_EXE%" "dpsir-cloud-drive.iss"

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================
    echo  [成功] 商业安装包构建完毕！
    echo  安装包位置: dist\DPSir-ZhiYunPan-Setup-v1.0.0.exe
    echo ===============================================================
) else (
    echo.
    echo [失败] Inno Setup 编译过程中出错，请查看上方日志。
)
