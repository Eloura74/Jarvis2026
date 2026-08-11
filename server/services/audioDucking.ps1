param (
    [string]$Action,
    [string[]]$ExcludeApps = @("chrome", "msedge", "node", "electron")
)

# Fonction utilitaire pour interagir avec AudioSessionManager2
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

namespace AudioDucking {
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int GetMasterVolumeLevelScalar(out float pfLevel);
        int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid id, int clsCtx, IntPtr activationParams, out IntPtr ppInterface);
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
    }

    [Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionManager2 {
        int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
    }

    [Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionEnumerator {
        int GetCount(out int SessionCount);
        int GetSession(int SessionCount, out IAudioSessionControl Session);
    }

    [Guid("F4B1A599-7266-4319-A8CA-E70ACB11E8CD"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionControl {
        int GetState(out int pRetVal);
    }

    [Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface ISimpleAudioVolume {
        int SetMasterVolume(float fLevel, Guid EventContext);
        int GetMasterVolume(out float pfLevel);
    }

    [Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionControl2 : IAudioSessionControl {
        new int GetState(out int pRetVal);
        int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int GetProcessId(out uint pRetVal);
        int IsSystemSoundsSession();
        int SetDuckingPreference(bool optOut);
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDeviceEnumeratorComObject { }

    public static class VolumeController {
        public static IMMDevice GetDefaultDevice() {
            var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
            IMMDevice device = null;
            enumerator.GetDefaultAudioEndpoint(0, 1, out device);
            return device;
        }

        public static IAudioSessionManager2 GetSessionManager(IMMDevice device) {
            Guid IID_IAudioSessionManager2 = typeof(IAudioSessionManager2).GUID;
            IntPtr ptr;
            device.Activate(ref IID_IAudioSessionManager2, 23, IntPtr.Zero, out ptr);
            return (IAudioSessionManager2)Marshal.GetObjectForIUnknown(ptr);
        }
    }
}
"@

$device = [AudioDucking.VolumeController]::GetDefaultDevice()
$manager = [AudioDucking.VolumeController]::GetSessionManager($device)

$enumerator = $null
$manager.GetSessionEnumerator([ref]$enumerator) | Out-Null

$count = 0
$enumerator.GetCount([ref]$count) | Out-Null

# Fichier Temp pour sauvegarder les volumes initiaux
$cacheFile = "$env:TEMP\jarvis_audio_ducking_cache.json"

if ($Action -eq "duck") {
    $sessionData = @{}
    
    for ($i = 0; $i -lt $count; $i++) {
        $control = $null
        $enumerator.GetSession($i, [ref]$control) | Out-Null
        $control2 = $control -as [AudioDucking.IAudioSessionControl2]

        if ($control2) {
            $pid = 0
            $control2.GetProcessId([ref]$pid) | Out-Null
            
            if ($pid -ne 0) {
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    $procName = $process.ProcessName.ToLower()

                    $isExcluded = $false
                    foreach ($ex in $ExcludeApps) {
                        if ($procName -like "*$ex*") {
                            $isExcluded = $true
                            break
                        }
                    }

                    if (-not $isExcluded) {
                        $simpleVol = $control -as [AudioDucking.ISimpleAudioVolume]
                        if ($simpleVol) {
                            $currentVol = [float]0.0
                            $simpleVol.GetMasterVolume([ref]$currentVol) | Out-Null
                            
                            if ($currentVol -gt [float]0.1) {
                                # Sauvegarder l'état
                                $sessionData["$pid"] = $currentVol

                                # Baisser à 15% de sa valeur ou au moins à 10% global
                                $targetVol = [Math]::Max([float]0.1, [float]($currentVol * 0.15))
                                $simpleVol.SetMasterVolume($targetVol, [Guid]::Empty) | Out-Null
                            }
                        }
                    }
                } catch {}
            }
        }
    }
    
    if ($sessionData.Count -gt 0) {
        $sessionData | ConvertTo-Json | Out-File $cacheFile -Encoding utf8
    }
    Write-Output "Ducked"

} elseif ($Action -eq "restore") {
    if (Test-Path $cacheFile) {
        $sessionData = Get-Content $cacheFile | ConvertFrom-Json
        
        for ($i = 0; $i -lt $count; $i++) {
            $control = $null
            $enumerator.GetSession($i, [ref]$control) | Out-Null
            $control2 = $control -as [AudioDucking.IAudioSessionControl2]

            if ($control2) {
                $pid = 0
                $control2.GetProcessId([ref]$pid) | Out-Null
                $pidStr = $pid.ToString()

                # Si cette session avait été abaissée, on la restaure
                if ($sessionData.PSObject.Properties.Name -contains $pidStr) {
                    $simpleVol = $control -as [AudioDucking.ISimpleAudioVolume]
                    if ($simpleVol) {
                        $originalVol = [float]$sessionData.$pidStr
                        $simpleVol.SetMasterVolume($originalVol, [Guid]::Empty) | Out-Null
                    }
                }
            }
        }
        Remove-Item $cacheFile -ErrorAction SilentlyContinue
        Write-Output "Restored"
    } else {
        Write-Output "No cache"
    }
}
