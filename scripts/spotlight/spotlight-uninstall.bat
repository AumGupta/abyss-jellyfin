@echo off
setlocal EnableDelayedExpansion

set "JELLYFIN_WEB="

for %%P in (
    "C:\Program Files\Jellyfin\Server\jellyfin-web"
    "C:\Program Files (x86)\Jellyfin\Server\jellyfin-web"
    "C:\ProgramData\Jellyfin\Server\jellyfin-web"
) do (
    if exist %%P (
        set "JELLYFIN_WEB=%%~P"
        goto :found_web
    )
)

echo  [?] Could not auto-detect Jellyfin web directory.
echo      Enter the full path to your jellyfin-web folder:
echo      Example: C:\Program Files\Jellyfin\Server\jellyfin-web
set /p JELLYFIN_WEB="  Path: "

if not exist "!JELLYFIN_WEB!" (
    echo  [X] Directory not found: !JELLYFIN_WEB!
    exit /b 1
)

:found_web
echo  [+] Web directory: !JELLYFIN_WEB!

set "ABYSS_INDEX=!JELLYFIN_WEB!\index.html"
if exist "!ABYSS_INDEX!" (
    powershell -NoProfile -Command "$p=$env:ABYSS_INDEX; $h=[IO.File]::ReadAllText($p); $h=[regex]::Replace($h,'<script[^>]*\bdata-abyss-spotlight\b[^>]*></script>','',[Text.RegularExpressions.RegexOptions]::IgnoreCase); $tmp=Join-Path (Split-Path $p) ('.abyss-index-'+[guid]::NewGuid().ToString('N')); try { [IO.File]::WriteAllText($tmp,$h,(New-Object Text.UTF8Encoding($false))); [IO.File]::Replace($tmp,$p,$null) } finally { if (Test-Path $tmp) { Remove-Item $tmp -Force } }"
    if errorlevel 1 (
        echo  [X] Failed to remove Spotlight loader.
        exit /b 1
    )
    echo  [+] Spotlight loader removed.
)

for %%F in ("!JELLYFIN_WEB!\home-html.*.chunk.js") do (
    if exist "%%~fF.bak" (
        findstr /c:"featurediframe" /c:"abyss-spotlight-frame" "%%~fF" >nul
        if not errorlevel 1 (
            copy /y "%%~fF.bak" "%%~fF" >nul
            if errorlevel 1 exit /b 1
            fc /b "%%~fF.bak" "%%~fF" >nul
            if errorlevel 1 exit /b 1
            del /f "%%~fF.bak" >nul
            echo  [+] Restored legacy home chunk backup.
        )
    )
)

echo  Removing spotlight files...

set "UI_DIR=!JELLYFIN_WEB!\ui"

if exist "!UI_DIR!\spotlight.html" (
    del /f "!UI_DIR!\spotlight.html" >nul
    echo  [+] Removed spotlight.html
) else (
    echo  [-] spotlight.html not found, skipping.
)

if exist "!UI_DIR!\spotlight.css" (
    del /f "!UI_DIR!\spotlight.css" >nul
    echo  [+] Removed spotlight.css
) else (
    echo  [-] spotlight.css not found, skipping.
)

if exist "!UI_DIR!\spotlight-loader.js" (
    del /f "!UI_DIR!\spotlight-loader.js" >nul
    echo  [+] Removed spotlight-loader.js
) else (
    echo  [-] spotlight-loader.js not found, skipping.
)

for /f %%A in ('dir /b /a "!UI_DIR!" 2^>nul') do goto :ui_not_empty
    rmdir "!UI_DIR!" >nul
    echo  [+] Removed empty ui folder.
    goto :ui_done
:ui_not_empty
    echo  [-] ui folder has other files, leaving in place.
:ui_done

exit /b 0
