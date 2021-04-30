IF NOT [%userDIR%]==[] GOTO inizio
ECHO OFF
ECHO Questo è solo il pezzo finale del bat, la prima parte viene creata dallo
ECHO script di apertura del BO e il bat finale vine messo in C:\Temp\MakeLinks.bat
ECHO Per creare i link devi lanciare come amministratore il file C:\Temp\MakeLinks.bat
PAUSE
GOTO:EOF

:inizio
SET DEST=%userDIR%\Adobe\InDesign\Version 14.0\it_IT\Scripts\Scripts Panel

if NOT EXIST "%DEST%\js" MKDIR "%DEST%\js"
start "" "%DEST%\js"

FOR %%D IN (MB_BridgeRTF,xwcs.indesign,tmpl) DO (
if NOT EXIST "%DEST%\js\%%D" mklink "%DEST%\js\%%D" "%~dp0"\%%D /D
)

FOR %%F IN (id.js, id_standalone.js, null) DO (
if NOT EXIST "%DEST%\js\%%F" mklink "%DEST%\js\%%F" "%~dp0\%%F"
)

rem %cd% is available either to a batch file or at the command prompt and expands to the drive letter and path of the current directory (which can change e.g. by using the CD command)
rem %~dp0 is only available within a batch file and expands to the drive letter and path in which that batch file is located (which cannot change). It is obtained from %0 which is the batch file's name.

CD C:\ProgramData\EgafBOiter\assets\js
if NOT EXIST "C:\Program Files\Adobe\Adobe InDesign CC 2019\Scripts\Scripts Panel\MB_BridgeRTF" mklink "C:\Program Files\Adobe\Adobe InDesign CC 2019\Scripts\Scripts Panel\MB_BridgeRTF" "C:\ProgramData\EgafBOiter\assets\js\MB_BridgeRTF" /D

