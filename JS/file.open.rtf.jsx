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
	indtPath = pathOnly(getScriptPath())+ TEMPLATE_FILE_NAME;

// Ask user to open the RTF
if(app.wordRTFImportPreferences.useTypographersQuotes = true){ 
app.wordRTFImportPreferences.useTypographersQuotes = false 
}else{ 
app.wordRTFImportPreferences.useTypographersQuotes = true 
} 
rtfFile = File.openDialog('Apri RTF','Rich Text Format:*.*',false);
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
if(rtfFile){
	try{
		init(indtPath);
		if (myStory){
		
			$.writeln(rtfFile.fsName);
			
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

function init(indtPath){
	var myDocument,
		myPage,
		myTextFrame,
		indtFile = new File(indtPath);
	if(indtFile.exists){
		myDocument = app.open(indtFile);
		myPage = myDocument.pages.item(0);
		if(myPage.textFrames.length>0){
			myTextFrame = myPage.textFrames.item(0);
			myStory = myTextFrame.parentStory;
		}
	}
}

function setAppPreferences(){
	// save current settings
	convertPageBreaks = app.wordRTFImportPreferences.convertPageBreaks;
	convertTablesTo = app.wordRTFImportPreferences.convertTablesTo;
	importEndnotes = app.wordRTFImportPreferences.importEndnotes;
	importFootnotes = app.wordRTFImportPreferences.importFootnotes;
	importIndex = app.wordRTFImportPreferences.importIndex;
	importTOC = app.wordRTFImportPreferences.importTOC;
	importUnusedStyles = app.wordRTFImportPreferences.importUnusedStyles;
	preserveGraphics = app.wordRTFImportPreferences.preserveGraphics;
	preserveLocalOverrides = app.wordRTFImportPreferences.preserveLocalOverrides;
	preserveTrackChanges = app.wordRTFImportPreferences.preserveTrackChanges;
	removeFormatting = app.wordRTFImportPreferences.removeFormatting;
	resolveParagraphStyleClash = app.wordRTFImportPreferences.resolveParagraphStyleClash;
	resolveCharacterStyleClash = app.wordRTFImportPreferences.resolveCharacterStyleClash;
	useTypographersQuotes = app.wordRTFImportPreferences.useTypographersQuotes;
	// set predefined settings for the script
	app.wordRTFImportPreferences.convertPageBreaks = ConvertPageBreaks.NONE;
	app.wordRTFImportPreferences.convertTablesTo = ConvertTablesOptions.UNFORMATTED_TABBED_TEXT;
	app.wordRTFImportPreferences.importEndnotes = false;
	app.wordRTFImportPreferences.importFootnotes = false;
	app.wordRTFImportPreferences.importIndex = true;
	app.wordRTFImportPreferences.importTOC = true;
	app.wordRTFImportPreferences.importUnusedStyles = true;
	app.wordRTFImportPreferences.preserveGraphics = true;
	app.wordRTFImportPreferences.preserveLocalOverrides = true;
	app.wordRTFImportPreferences.preserveTrackChanges = true;
	app.wordRTFImportPreferences.removeFormatting = false;
	app.wordRTFImportPreferences.resolveParagraphStyleClash = ResolveStyleClash.RESOLVE_CLASH_AUTO_RENAME;
	app.wordRTFImportPreferences.resolveCharacterStyleClash = ResolveStyleClash.RESOLVE_CLASH_AUTO_RENAME;
	app.wordRTFImportPreferences.useTypographersQuotes = true;
}

function restoreAppPreferences(){
	app.wordRTFImportPreferences.convertPageBreaks = convertPageBreaks;
	app.wordRTFImportPreferences.convertTablesTo = convertTablesTo;
	app.wordRTFImportPreferences.importEndnotes = importEndnotes;
	app.wordRTFImportPreferences.importFootnotes = importFootnotes;
	app.wordRTFImportPreferences.importIndex = importIndex;
	app.wordRTFImportPreferences.importTOC = importTOC;
	app.wordRTFImportPreferences.importUnusedStyles = importUnusedStyles;
	app.wordRTFImportPreferences.preserveGraphics = preserveGraphics;
	app.wordRTFImportPreferences.preserveLocalOverrides = preserveLocalOverrides;
	app.wordRTFImportPreferences.preserveTrackChanges = preserveTrackChanges;
	app.wordRTFImportPreferences.removeFormatting = removeFormatting;
	app.wordRTFImportPreferences.resolveParagraphStyleClash = resolveParagraphStyleClash;
	app.wordRTFImportPreferences.resolveCharacterStyleClash = resolveCharacterStyleClash;
	app.wordRTFImportPreferences.useTypographersQuotes = useTypographersQuotes;
}

function getScriptPath() {
  // returns the path to the active script, even when running ESTK
  try { 
    return app.activeScript; 
  } catch(e) { 
    return File(e.fileName); 
  }
}

function pathOnly (inString)  {
     var s = inString + "";
    var a = s.split ("/", 10000);
    if(a.length > 0) a.pop();
    return (a.join ("/") + "/");
}
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;