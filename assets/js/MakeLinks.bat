set DEST=%appdata%\Adobe\InDesign\Version 8.0\it_IT\Scripts\Scripts Panel

if EXIST "%DEST%\js" goto end
mklink "%DEST%\js" "%cd%" /D
:end