set DEST=%appdata%\Adobe\InDesign\Version 8.0\it_IT\Scripts\Scripts Panel

mklink "%DEST%\file.open.rtf.jsx" "%cd%\file.open.rtf.jsx"
mklink "%DEST%\file.save.rtf.jsx" "%cd%\file.save.rtf.jsx"
mklink "%DEST%\file.save.rtf.new.doc.jsx" "%cd%\file.save.rtf.new.doc.jsx"
mklink "%DEST%\template.indt" "%cd%\template.indt"

rem debug

mklink "%DEST%\logger.js" "%cd%\bridge\logger.js"
mklink "%DEST%\bridge.js" "%cd%\bridge\bridge.js"
mklink "%DEST%\fileman.js" "%cd%\bridge\fileman.js"
mklink "%DEST%\json2_min.js" "%cd%\bridge\json2_min.js"
mklink "%DEST%\id.js" "%cd%\bridge\id.js"
mklink "%DEST%\egaf.js" "%cd%\bridge\id_standalone.js"
