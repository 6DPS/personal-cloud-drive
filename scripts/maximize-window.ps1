# PowerShell fallback to maximize DPSir-ZhiYunPan host window
try {
    Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    using System.Diagnostics;
    using System.Collections.Generic;
    public class Win32Max {
        [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
        public static void Maximize() {
            var procs = Process.GetProcessesByName("DPSir-ZhiYunPan");
            if (procs == null || procs.Length == 0) return;
            var pids = new HashSet<uint>();
            foreach (var p in procs) {
                pids.Add((uint)p.Id);
                if (p.MainWindowHandle != IntPtr.Zero) {
                    ShowWindow(p.MainWindowHandle, 3);
                    SetForegroundWindow(p.MainWindowHandle);
                }
            }
            EnumWindows((hWnd, lParam) => {
                if (IsWindowVisible(hWnd)) {
                    uint pid;
                    GetWindowThreadProcessId(hWnd, out pid);
                    if (pids.Contains(pid)) {
                        ShowWindow(hWnd, 3);
                        SetForegroundWindow(hWnd);
                    }
                }
                return true;
            }, IntPtr.Zero);
        }
    }
"@ -ErrorAction SilentlyContinue
    [Win32Max]::Maximize()
} catch {}
