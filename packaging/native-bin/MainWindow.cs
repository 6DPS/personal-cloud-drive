using System;
using System.IO;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;

[assembly: AssemblyTitle("DPSir 智云盘")]
[assembly: AssemblyDescription("DPSir 智云盘桌面客户端")]
[assembly: AssemblyCompany("DPSir Studio")]
[assembly: AssemblyProduct("DPSir 智云盘")]
[assembly: AssemblyCopyright("Copyright © 2026 DPSir Studio")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace DPSir.ZhiYunPan {
    static class Program {
        [DllImport("shell32.dll", SetLastError = true)]
        static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);

        [DllImport("shcore.dll")]
        static extern int SetProcessDpiAwareness(int awareness);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool SetProcessDPIAware();

        private static readonly IntPtr DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = new IntPtr(-4);

        [STAThread]
        static void Main() {
            // 启用顶级 Per-Monitor V2 高 DPI 矢量渲染，防止 125%/150%/200% 屏幕缩放下的字体模糊
            try {
                if (!SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2)) {
                    try {
                        SetProcessDpiAwareness(2); // PROCESS_PER_MONITOR_DPI_AWARE
                    } catch {
                        SetProcessDPIAware();
                    }
                }
            } catch {}

            try {
                // 专属 AppID，确保 Windows 任务栏完全独立归类并使用专属图标
                SetCurrentProcessExplicitAppUserModelID("DPSir.ZhiYunPan.Client");
            } catch {}

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            try {
                CoreWebView2Environment.SetLoaderDllFolderPath(appDir);
            } catch {}

            EnsureServerRunning(appDir);

            Application.Run(new MainForm(appDir));
        }

        static void EnsureServerRunning(string appDir) {
            try {
                using (var client = new System.Net.Sockets.TcpClient()) {
                    var asyncResult = client.BeginConnect("127.0.0.1", 8081, null, null);
                    if (asyncResult.AsyncWaitHandle.WaitOne(300)) {
                        client.EndConnect(asyncResult);
                        return;
                    }
                }
            } catch {}

            try {
                string nodeExe = Path.Combine(appDir, @"runtime\node.exe");
                if (!File.Exists(nodeExe)) nodeExe = "node.exe";
                string script = Path.Combine(appDir, @"scripts\server-watchdog.js");

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = nodeExe;
                psi.Arguments = "\"" + script + "\"";
                psi.WorkingDirectory = appDir;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.UseShellExecute = false;
                psi.EnvironmentVariables["PORT"] = "8081";
                psi.EnvironmentVariables["HOST"] = "0.0.0.0";
                Process.Start(psi);
            } catch {}
        }
    }

    class MainForm : Form {
        private WebView2 webView;
        private string appDir;

        public MainForm(string baseDir) {
            this.appDir = baseDir;
            this.Text = "DPSir 智云盘";
            this.Width = 1240;
            this.Height = 840;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.MinimumSize = new Size(800, 600);
            this.BackColor = Color.FromArgb(240, 244, 249);
            this.WindowState = FormWindowState.Maximized;

            // 优先加载打包的高清图标
            string iconPath = Path.Combine(appDir, "app-icon.ico");
            if (File.Exists(iconPath)) {
                try {
                    this.Icon = new Icon(iconPath);
                } catch {}
            } else {
                try {
                    this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                } catch {}
            }

            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            this.Controls.Add(webView);

            InitWebView();
        }

        private async void InitWebView() {
            try {
                string localData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "DPSirCloudDrive", "WebView2Profile"
                );
                var env = await CoreWebView2Environment.CreateAsync(null, localData);
                await webView.EnsureCoreWebView2Async(env);

                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;

                // 等待服务端口 8081 就绪（最多循环 30 次约 9 秒）
                for (int i = 0; i < 30; i++) {
                    try {
                        using (var client = new System.Net.Sockets.TcpClient()) {
                            var asyncResult = client.BeginConnect("127.0.0.1", 8081, null, null);
                            if (asyncResult.AsyncWaitHandle.WaitOne(200)) {
                                client.EndConnect(asyncResult);
                                break;
                            }
                        }
                    } catch {}
                    await System.Threading.Tasks.Task.Delay(300);
                }

                webView.Source = new Uri("http://localhost:8081");
            } catch (Exception ex) {
                MessageBox.Show("启动显示引擎遇到异常：" + ex.Message, "DPSir 智云盘", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        protected override void OnFormClosed(FormClosedEventArgs e) {
            base.OnFormClosed(e);
            try {
                // 判断当前是否处于“专用服务器模式 (已开启开机自启)”
                string userStartup = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
                string lnkA = Path.Combine(userStartup, "DPSir 智云盘后台服务.lnk");
                string lnkB = Path.Combine(userStartup, "DPSir 智云盘.lnk");
                string commonStartup = Environment.GetFolderPath(Environment.SpecialFolder.CommonStartup);
                string lnkC = Path.Combine(commonStartup, "DPSir 智云盘后台服务.lnk");

                bool isServerMode = File.Exists(lnkA) || File.Exists(lnkB) || File.Exists(lnkC);
                if (!isServerMode) {
                    // 日常电脑模式（未开自启）：退出客户端时自动彻底停止后台服务，立刻释放 8081 端口！
                    StopServer();
                }
            } catch {}
        }

        private void StopServer() {
            try {
                string vbs = Path.Combine(appDir, "stop-desktop.vbs");
                if (!File.Exists(vbs)) {
                    vbs = Path.Combine(appDir, @"scripts\stop-desktop.vbs");
                }
                if (File.Exists(vbs)) {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = "wscript.exe";
                    psi.Arguments = "\"" + vbs + "\" /silent";
                    psi.CreateNoWindow = true;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.UseShellExecute = false;
                    Process p = Process.Start(psi);
                    if (p != null) p.WaitForExit(1500);
                }
            } catch {}
        }
    }
}
