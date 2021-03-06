@echo off
SET DEST=%appdata%\Adobe\InDesign\Version 14.0\it_IT\Scripts\Scripts Panel

if NOT EXIST "%DEST%\js" MKDIR "%DEST%\js"

FOR %%D IN (MB_BridgeRTF,xwcs.indesign,tmpl) DO (
if NOT EXIST "%DEST%\js\%%D" mklink "%DEST%\js\%%D" "%~dp0"\%%D /D
)

FOR %%F IN (id.js, id_standalone.js, null) DO (
if NOT EXIST "%DEST%\js\%%F" mklink "%DEST%\js\%%F" "%~dp0\%%F"
)

rem %cd% is available either to a batch file or at the command prompt and expands to the drive letter and path of the current directory (which can change e.g. by using the CD command)
rem %~dp0 is only available within a batch file and expands to the drive letter and path in which that batch file is located (which cannot change). It is obtained from %0 which is the batch file's name.