/* 
    File Manger
*/
var FileManager = (function(ind){
    var _indesign = ind;

    const TEMPLATE_FILE_NAME = 'template.indt',
          SCRIPT_NAME = 'Apri RTF';
    var err = 0,
        errMsg = '',
        myStory,
        convertPageBreaks,
        convertTablesTo,
        importEndnotes,
        importFootnotes,
        importIndex,
        importTOC,
        importUnusedStyles,
        preserveGraphics,
        preserveLocalOverrides,
        preserveTrackChanges,
        removeFormatting,
        resolveParagraphStyleClash,
        resolveCharacterStyleClash,
        useTypographersQuotes,
        indtPath = getScriptPath() + '/'+ TEMPLATE_FILE_NAME;

    var ret = {
        open : function(path){

            var fPath = path || "";
            // Ask user to open the RTF
            if(_indesign.wordRTFImportPreferences.useTypographersQuotes = true){ 
                _indesign.wordRTFImportPreferences.useTypographersQuotes = false 
            }else{ 
                _indesign.wordRTFImportPreferences.useTypographersQuotes = true 
            } 

            var rtfFile = null;

            if( !(rtfFile = File(fPath)).exists )
            {
                rtfFile = File.openDialog('Apri RTF','Rich Text Format:*.*',false); 
            }
            
            _indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
            if(rtfFile){
                try{
                    init(indtPath);
                    
                    if (myStory){
		
                        //$.writeln(rtfFile.fsName);
			
                        setAppPreferences();
			
                        // place the RTF
                        myStory.insertionPoints.item(0).place(rtfFile.fsName,false);
			
                        // save the RTF path into story label
                        myStory.label = rtfFile.fsName;
			
                        //restoreAppPreferences();
                        
                    }else{
                        err = -43;
                        errMsg = 'Il template \r"'+indtPath+'"\r non esiste o non ha frame nella prima pagina.';
                    }
                }catch(e){
                    err = e.number;
                    errMsg = e.description;
                }finally{
                    if(errMsg != '')alert (errMsg, SCRIPT_NAME);
                }
            }

            _indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
        }
    }

    function init(indtPath){
        var myDocument,
            myPage,
            myTextFrame,
            indtFile = new File(indtPath);
        if(indtFile.exists){
            myDocument = _indesign.open(indtFile);
            myPage = myDocument.pages.item(0);
            if(myPage.textFrames.length>0){
                myTextFrame = myPage.textFrames.item(0);
                myStory = myTextFrame.parentStory;
            }
        }
    }

    function setAppPreferences(){
        // save current settings
        convertPageBreaks = _indesign.wordRTFImportPreferences.convertPageBreaks;
        convertTablesTo = _indesign.wordRTFImportPreferences.convertTablesTo;
        importEndnotes = _indesign.wordRTFImportPreferences.importEndnotes;
        importFootnotes = _indesign.wordRTFImportPreferences.importFootnotes;
        importIndex = _indesign.wordRTFImportPreferences.importIndex;
        importTOC = _indesign.wordRTFImportPreferences.importTOC;
        importUnusedStyles = _indesign.wordRTFImportPreferences.importUnusedStyles;
        preserveGraphics = _indesign.wordRTFImportPreferences.preserveGraphics;
        preserveLocalOverrides = _indesign.wordRTFImportPreferences.preserveLocalOverrides;
        preserveTrackChanges = _indesign.wordRTFImportPreferences.preserveTrackChanges;
        removeFormatting = _indesign.wordRTFImportPreferences.removeFormatting;
        resolveParagraphStyleClash = _indesign.wordRTFImportPreferences.resolveParagraphStyleClash;
        resolveCharacterStyleClash = _indesign.wordRTFImportPreferences.resolveCharacterStyleClash;
        useTypographersQuotes = _indesign.wordRTFImportPreferences.useTypographersQuotes;
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

    function restoreAppPreferences(){
        _indesign.wordRTFImportPreferences.convertPageBreaks = convertPageBreaks;
        _indesign.wordRTFImportPreferences.convertTablesTo = convertTablesTo;
        _indesign.wordRTFImportPreferences.importEndnotes = importEndnotes;
        _indesign.wordRTFImportPreferences.importFootnotes = importFootnotes;
        _indesign.wordRTFImportPreferences.importIndex = importIndex;
        _indesign.wordRTFImportPreferences.importTOC = importTOC;
        _indesign.wordRTFImportPreferences.importUnusedStyles = importUnusedStyles;
        _indesign.wordRTFImportPreferences.preserveGraphics = preserveGraphics;
        _indesign.wordRTFImportPreferences.preserveLocalOverrides = preserveLocalOverrides;
        _indesign.wordRTFImportPreferences.preserveTrackChanges = preserveTrackChanges;
        _indesign.wordRTFImportPreferences.removeFormatting = removeFormatting;
        _indesign.wordRTFImportPreferences.resolveParagraphStyleClash = resolveParagraphStyleClash;
        _indesign.wordRTFImportPreferences.resolveCharacterStyleClash = resolveCharacterStyleClash;
        _indesign.wordRTFImportPreferences.useTypographersQuotes = useTypographersQuotes;
    }

    function getScriptPath() {
        return CsBridge.options().scriptPath;        
    }

    function pathOnly (inString)  {
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
        _logger.log(msg);
    };
    
    return ret;
})(app);