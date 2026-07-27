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

set "UI_DIR=!JELLYFIN_WEB!\ui"
if not exist "!UI_DIR!" (
    mkdir "!UI_DIR!"
    echo  [+] Created ui folder.
) else (
    echo  [-] ui folder exists.
)

echo  Copying files...

set "SRC=%~dp0"

if exist "!SRC!spotlight.html" (
    copy /y "!SRC!spotlight.html" "!UI_DIR!\spotlight.html" >nul
    echo  [+] spotlight.html
) else (
    echo  [X] spotlight.html not found. Aborting.
    exit /b 1
)

if exist "!SRC!spotlight.css" (
    copy /y "!SRC!spotlight.css" "!UI_DIR!\spotlight.css" >nul
    echo  [+] spotlight.css
) else (
    echo  [X] spotlight.css not found. Aborting.
    exit /b 1
)

if exist "!SRC!spotlight-loader.js" (
    copy /y "!SRC!spotlight-loader.js" "!UI_DIR!\spotlight-loader.js" >nul
    echo  [+] spotlight-loader.js
) else (
    echo  [X] spotlight-loader.js not found. Aborting.
    exit /b 1
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

set "ABYSS_INDEX=!JELLYFIN_WEB!\index.html"
if not exist "!ABYSS_INDEX!" (
    echo  [X] Jellyfin index not found: !ABYSS_INDEX!
    exit /b 1
)
powershell -NoProfile -Command "$p=$env:ABYSS_INDEX; $h=[IO.File]::ReadAllText($p); $h=[regex]::Replace($h,'<script[^>]*\bdata-abyss-spotlight\b[^>]*></script>','',[Text.RegularExpressions.RegexOptions]::IgnoreCase); if ($h -notmatch '(?i)</body>') { throw 'index.html has no closing body tag' }; $t='<script src='+[char]34+'ui/spotlight-loader.js'+[char]34+' data-abyss-spotlight></script>'; $r=[regex]::new('</body>',[Text.RegularExpressions.RegexOptions]::IgnoreCase); $h=$r.Replace($h,$t+'</body>',1); $tmp=Join-Path (Split-Path $p) ('.abyss-index-'+[guid]::NewGuid().ToString('N')); try { [IO.File]::WriteAllText($tmp,$h,(New-Object Text.UTF8Encoding($false))); [IO.File]::Replace($tmp,$p,$null) } finally { if (Test-Path $tmp) { Remove-Item $tmp -Force } }"
if errorlevel 1 (
    echo  [X] Failed to install Spotlight loader.
    exit /b 1
)
echo  [+] Spotlight loader installed.

exit /b 0
