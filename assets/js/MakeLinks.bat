@echo off
rem set DEST=%appdata%\Adobe\InDesign\Version 8.0\it_IT\Scripts\Scripts Panel
rem set DEST=C:\users\ivan.DOM_EGAF\AppData\Roaming\Adobe\InDesign\Version 8.0\it_IT\Scripts\Scripts Panel
rem set DEST=%appdata%\Adobe\InDesign\Version 13.0\it_IT\Scripts\Scripts Panel
set DEST=C:\users\ivan.DOM_EGAF\AppData\Roaming\Adobe\InDesign\Version 13.0\it_IT\Scripts\Scripts Panel
if EXIST "%DEST%\js" goto end
rem mklink "%DEST%\js" "%cd%" /D
mklink "%DEST%\js" "%~dp0" /D
:end

rem %cd% is available either to a batch file or at the command prompt and expands to the drive letter and path of the current directory (which can change e.g. by using the CD command)
rem %~dp0 is only available within a batch file and expands to the drive letter and path in which that batch file is located (which cannot change). It is obtained from %0 which is the batch file's name.