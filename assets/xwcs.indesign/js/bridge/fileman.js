/* 
    File Manger
*/
var FileManager = (function(ind){

    const TEMPLATE_FILE_NAME = 'template.indt',
          SCRIPT_NAME = 'Apri RTF';

    // indesign
    var _indesign = ind;

    var _err = 0,
        _errMsg = '',
        _myStory,
        _prefsBackup,
        _indtPath = __getScriptPath() + '/'+ TEMPLATE_FILE_NAME;

    var ret = {
        open : function(path, iterId){

            var fPath = path || "";

            // Ask user to open the RTF
            _indesign.wordRTFImportPreferences.useTypographersQuotes = false;
            
            var rtfFile = null;

            if( !(rtfFile = File(fPath)).exists )
            {
                rtfFile = File.openDialog('Apri RTF','Rich Text Format:*.*',false); 
            }
            
            // block user
            _indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;

            if(rtfFile){
                try {
                    // load template
                    __init(_indtPath);
                    
                    if (_myStory){
		
                        //$.writeln(rtfFile.fsName);
			
                        __setAppPreferences();
			
                        // place the RTF
                        _myStory.insertionPoints.item(0).place(rtfFile.fsName,false);
			
                        // save the RTF path into story label
                        _myStory.label = iterId + '|||' + rtfFile.fsName;  // iter ID and path
                        _indesign.activeDocument.label = iterId + '|||' + rtfFile.fsName;  // iter ID and path
                        //__restoreAppPreferences();
                        
                    }else{
                        _err = -43;
                        _errMsg = 'Il template \r"'+_indtPath+'"\r non esiste o non ha frame nella prima pagina.';
                    }
                }catch(e){
                    _err = e.number;
                    _errMsg = e.description;
                }finally{
                    if(_errMsg != '') alert (_errMsg, SCRIPT_NAME);
                }
            }

            // give back user intercation
            _indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
        }
    }

    function __init(path){
        var myDocument,
            myPage,
            myTextFrame,
            indtFile = new File(path);
        if(indtFile.exists){
            myDocument = _indesign.open(indtFile);
            myPage = myDocument.pages.item(0);
            if(myPage.textFrames.length>0){
                myTextFrame = myPage.textFrames.item(0);

                // set story
                _myStory = myTextFrame.parentStory;
            }
        }
    }

    function __setAppPreferences(){
        // save current settings
        _prefsBackup = _indesign.wordRTFImportPreferences.properties;

        // set predefined settings for the script
        _indesign.wordRTFImportPreferences.convertPageBreaks = ConvertPageBreaks.NONE;
        _indesign.wordRTFImportPreferences.convertTablesTo = ConvertTablesOptions.UNFORMATTED_TABBED_TEXT;
        _indesign.wordRTFImportPreferences.importEndnotes = false;
        _indesign.wordRTFImportPreferences.importFootnotes = false;
        _indesign.wordRTFImportPreferences.importIndex = true;
        _indesign.wordRTFImportPreferences.importTOC = true;
        _indesign.wordRTFImportPreferences.importUnusedStyles = true;
        _indesign.wordRTFImportPreferences.preserveGraphics = true;
        _indesign.wordRTFImportPreferences.preserveLocalOverrides = true;
        _indesign.wordRTFImportPreferences.preserveTrackChanges = true;
        _indesign.wordRTFImportPreferences.removeFormatting = false;
        _indesign.wordRTFImportPreferences.resolveParagraphStyleClash = ResolveStyleClash.RESOLVE_CLASH_AUTO_RENAME;
        _indesign.wordRTFImportPreferences.resolveCharacterStyleClash = ResolveStyleClash.RESOLVE_CLASH_AUTO_RENAME;
        _indesign.wordRTFImportPreferences.useTypographersQuotes = true;
    }

    function __restoreAppPreferences() {
        _indesign.wordRTFImportPreferences.properties = _prefsBackup;
    }

    function __getScriptPath() {
        return CsBridge.options().scriptPath;        
    }

    function __pathOnly (inString)  {
        var s = inString + "";
        var a = s.split ("/", 10000);
        if(a.length > 0) a.pop();
        return (a.join ("/") + "/");
    }

    var _logger = null;
    var __log = function(msg){
        if(_logger == null){
            _logger = LoggerFactory.getLogger(CsBridge.options().log);
        }
        _logger.log("Filemanager : " + msg);
    };
    
    return ret;
})(app);