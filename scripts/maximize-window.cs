using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

namespace DPSir {
    static class WindowMaximizer {
        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        const int SW_MAXIMIZE = 3;

        static void Main(string[] args) {
            try {
                Process[] procs = Process.GetProcessesByName("DPSir-ZhiYunPan");
                if (procs == null || procs.Length == 0) return;

                HashSet<uint> targetPids = new HashSet<uint>();
                foreach (Process p in procs) {
                    targetPids.Add((uint)p.Id);
                    if (p.MainWindowHandle != IntPtr.Zero) {
                        ShowWindow(p.MainWindowHandle, SW_MAXIMIZE);
                        SetForegroundWindow(p.MainWindowHandle);
                    }
                }

                EnumWindows(delegate(IntPtr hWnd, IntPtr lParam) {
                    if (IsWindowVisible(hWnd)) {
                        uint pid;
                        GetWindowThreadProcessId(hWnd, out pid);
                        if (targetPids.Contains(pid)) {
                            ShowWindow(hWnd, SW_MAXIMIZE);
                            SetForegroundWindow(hWnd);
                        }
                    }
                    return true;
                }, IntPtr.Zero);
            } catch {}
        }
    }
}
