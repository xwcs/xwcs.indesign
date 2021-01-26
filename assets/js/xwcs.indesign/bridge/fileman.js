/******************************************************************************
 * Copyright (C) 2016-2017 0ics srls <mail{at}0ics.it>
 * 
 * This file is part of xwcs libraries
 * xwcs libraries and all his part can not be copied 
 * and/or distributed without the express permission 
 * of 0ics srls
 *
 ******************************************************************************/

/* 
    File Manger
*/
var FileManager = (function(ind){

    const TEMPLATE_FILE_NAME = 'template.indt';

    // indesign
    var _indesign = ind;

    var _err = 0;
    var _errMsg = '';
    var _myStory;
    var _myLabel;
    //var  _prefsBackup;
	var	_convertPageBreaks,
		_convertTablesTo,
		_importEndnotes,
		_importFootnotes,
		_importIndex,
		_importTOC,
		_importUnusedStyles,
		_preserveGraphics,
		_preserveLocalOverrides,
		_preserveTrackChanges,
		_removeFormatting,
		_resolveParagraphStyleClash,
		_resolveCharacterStyleClash,
		_useTypographersQuotes;
    var _indtPath = __getScriptPath() + '/tmpl/'+ TEMPLATE_FILE_NAME;

    var ret = {
        openFromDisk : function(){
            this.open(null, "UNDEFINED");
        },
        // data can be stringized json !!!
        open : function(path, data){
            _errMsg = '';
            _err = 0;
        
            var fPath = path || "";

            __log("Custom data: " + data);
            
            // Ask user to open the RTF
            _indesign.wordRTFImportPreferences.useTypographersQuotes = false;
			// Non capisco perché Giulivi abbia invece gestito la cosa nel modo che segue: se non riesce ad assegnare vero assegna falso, altrimenti vero. Boh!
			/*
			if(app.wordRTFImportPreferences.useTypographersQuotes = true){ 
				app.wordRTFImportPreferences.useTypographersQuotes = false 
			}else{ 
				app.wordRTFImportPreferences.useTypographersQuotes = true 
			} 
			*/
            
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

                    __initOpen(_indtPath);
                    
                    if (_myStory){
		
                        //$.writeln(rtfFile.fsName);

                        __setAppPreferences();
						
						// Import on a temporary doc to avoid styles garbage
						// BEGIN
						_indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
						var _docTemp = _indesign.documents.add()
						_indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
						var _boxTemp = _docTemp.textFrames.add()
						_boxTemp.geometricBounds = [0,0,1000,1000]
						var _storyTemp =  _boxTemp.parentStory
						_storyTemp.insertionPoints.item(0).place(rtfFile.fsName,false);
						_indesign.selection = null
						for (var i = 0; i < _storyTemp.texts.length; i++){
							if (i > 0){
								_storyTemp.texts[i].select(SelectionOptions.ADD_TO)
							} else {
								_storyTemp.texts[i].select()
							}
						}
						_indesign.copy()
						_docTemp.close(SaveOptions.no)
						_myStory.insertionPoints.item(0).select()
						_indesign.paste()
						// END
						
                        // The RTF is already placed
                        // _myStory.insertionPoints.item(0).place(rtfFile.fsName,false);
			
                        // save the RTF path into story label
                        var lData = {
                            RtfFilePath: rtfFile.fsName,
                            meta : typeof(data) == "string" ? JSON.parse(data) : data
                        }
                        data.RtfFilePath = rtfFile.fsName;
                        _myStory.label = JSON.stringify(lData); //iterId + '|||' + rtfFile.fsName;  // iter ID and path
                        //_indesign.activeDocument.label = JSON.stringify(lData); //iterId + '|||' + rtfFile.fsName;  // iter ID and path
                        //__restoreAppPreferences();
                        
                    }else{
                        _err = -43;
                        _errMsg = 'Il template \r"'+_indtPath+'"\r non esiste o non ha frame nella prima pagina.';
                    }
                }catch(e){
                    _err = e.number;
                    _errMsg = e.description;
                }finally{
                    if(_errMsg != '') alert (_errMsg, "FileManager.open");
                }
            }

            // give back user intercation
            _indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
        },


        saveToDisk: function (doClose) {
            var rtfFile = File.saveDialog("Save Exported File As:", ".rtf");
            return this.save(rtfFile, doClose);
        },

        // path can be empty if empty it will take it from story
        // it return object
        /*
            {
                // save file handle object
                file: SavedFile,
                // saved file parsed meta
                meta: array[]
            }

        */
        save: function (file, doClose) {
             _errMsg = '';
             _err = 0;
             var ret = null;
            
             var rtfFile = file || null;
             doClose = doClose != undefined ? doClose : false;


            _indesign.activeDocument.stories.everyItem().leading = Leading.AUTO;
            _indesign.activeDocument.stories.everyItem().autoLeading = 100;
            
            //#include "Egaf_PulisciRTF.jsx" 
            try {
                
                __initSave();
                if (_myStory) {

                    // iterId|||fileName
                    //var tmp = _myStory.label.split('|||')
                    var data = JSON.parse(_myLabel);

                    // what we do ? save in existing from story or new one?
                    if (rtfFile == null) {
                        var rtfPath = data.RtfFilePath; //tmp[1];
                        rtfFile = new File(rtfPath);

                        // save indd
                        __ensureDir(Folder.temp + '/indd');
                        var inddName = rtfFile.name.replace(".rtf", ".indd");
                        _indesign.activeDocument.save(new File(Folder.temp + '/indd/' + inddName));                       

                        // in this case file must exists
                        if (rtfFile.exists) {
                            var p = _indesign.pdfExportPresets.firstItem();
                            _myStory.exportFile(ExportFormat.RTF, rtfFile, false, p, '', true);
                            ret = { file: rtfFile, meta: data.meta };
                        } else {
                            _err = -43;
                            _errMsg = 'L\'etichetta del brano non contiene un percorso valido per il file RTF da salvare.';
                        }
                    } else {
                        // just export
                        _myStory.exportFile(ExportFormat.RTF, rtfFile);
                        ret = { file: rtfFile, meta: data.meta };
                    }                   

                    // close file
                    if (doClose) _indesign.activeDocument.close(SaveOptions.no);
                }else{
                    _err = -43;
                    _errMsg = 'Non ci sono documenti aperti o il documento attivo non ha frame nella prima pagina.';
                }
            }catch(e){
                _err = e.number;
                _errMsg = e.description;
            }finally{
                if ( _errMsg  != '') alert('Si è verificato l\'errore n°' + _err + '.\r' + _errMsg, "FileManager.save");
            }

            return ret;
        },

        closeCurrent: function () {

            _errMsg = '';
            _err = 0;

            try {
                _indesign.activeDocument.close(SaveOptions.no);
            } catch (e) {
                _err = e.number;
                _errMsg = e.description;
            } finally {
                if (_errMsg != '') alert('Si è verificato l\'errore n°' + _err + '.\r' + _errMsg, "FileManager.save");
            }
        }
    }

    function __ensureDir(path){
        new Folder(path).create();  
    }

    function __initOpen(path) {
        var myDocument;
        var myPage;
        var myTextFrame;
        var indtFile = new File(path);
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

    function __initSave() {
        var myDocument;
        var myPage;
        var myTextFrame;
        myDocument = _indesign.activeDocument;
        if (myDocument) {
            //loop all stories to check if there is a label
            var __stories = myDocument.stories.length;
            var __foundLabel=0;
            for (var i = 0; i < __stories;i++) {
              var __label = myDocument.stories[i].label;
              if ( __label) {
                var __data = JSON.parse(__label);
                if (__data.meta.id_iter) {
                  //I take the first label because more than one label is not allowed
                  _myLabel = __label;
                  __foundLabel++;
                  }
                }
              }
            if (__foundLabel == 1) {
              } else  if (__foundLabel == 0) {
                    _errMsg = 'Non trovata la label che identifica il documento Iter.';
              } else {
                    _errMsg = 'Trovata più di una label che identifica il documento Iter.';
                }
            myPage = myDocument.pages.item(0);
            if (myPage.textFrames.length > 0) {
                myTextFrame = myPage.textFrames.item(0);
                _myStory = myTextFrame.parentStory;
            }
        } else {
          _errMsg = 'Nessun documento aperto.';
        }        
        if ( _errMsg  != '') {
          throw new Error(_errMsg)
          };    
    }

    function __setAppPreferences(){
        // save current settings
		// in the ID enviroment, object properties are placeholders that are evaluated only when instantiated, so I prefer to save very single property needed
        //_prefsBackup = _indesign.wordRTFImportPreferences.properties;
		_convertPageBreaks = _indesign.wordRTFImportPreferences.convertPageBreaks;
		_convertTablesTo = _indesign.wordRTFImportPreferences.convertTablesTo;
		_importEndnotes = _indesign.wordRTFImportPreferences.importEndnotes;
		_importFootnotes = _indesign.wordRTFImportPreferences.importFootnotes;
		_importIndex = _indesign.wordRTFImportPreferences.importIndex;
		_importTOC = _indesign.wordRTFImportPreferences.importTOC;
		_importUnusedStyles = _indesign.wordRTFImportPreferences.importUnusedStyles;
		_preserveGraphics = _indesign.wordRTFImportPreferences.preserveGraphics;
		_preserveLocalOverrides = _indesign.wordRTFImportPreferences.preserveLocalOverrides;
		_preserveTrackChanges = _indesign.wordRTFImportPreferences.preserveTrackChanges;
		_removeFormatting = _indesign.wordRTFImportPreferences.removeFormatting;
		_resolveParagraphStyleClash = _indesign.wordRTFImportPreferences.resolveParagraphStyleClash;
		_resolveCharacterStyleClash = _indesign.wordRTFImportPreferences.resolveCharacterStyleClash;
		_useTypographersQuotes = _indesign.wordRTFImportPreferences.useTypographersQuotes;
		
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
		_indesign.wordRTFImportPreferences.resolveParagraphStyleClash = ResolveStyleClash.RESOLVE_CLASH_USE_EXISTING;
        _indesign.wordRTFImportPreferences.resolveCharacterStyleClash = ResolveStyleClash.RESOLVE_CLASH_USE_EXISTING;
        // _indesign.wordRTFImportPreferences.resolveParagraphStyleClash = ResolveStyleClash.RESOLVE_CLASH_AUTO_RENAME;
        // _indesign.wordRTFImportPreferences.resolveCharacterStyleClash = ResolveStyleClash.RESOLVE_CLASH_AUTO_RENAME;
        _indesign.wordRTFImportPreferences.useTypographersQuotes = true;
    }

    function __restoreAppPreferences() {
        // _indesign.wordRTFImportPreferences.properties = _prefsBackup;
		_indesign.wordRTFImportPreferences.convertPageBreaks = _convertPageBreaks;
		_indesign.wordRTFImportPreferences.convertTablesTo = _convertTablesTo;
		_indesign.wordRTFImportPreferences.importEndnotes = _importEndnotes;
		_indesign.wordRTFImportPreferences.importFootnotes = _importFootnotes;
		_indesign.wordRTFImportPreferences.importIndex = _importIndex;
		_indesign.wordRTFImportPreferences.importTOC = _importTOC;
		_indesign.wordRTFImportPreferences.importUnusedStyles = _importUnusedStyles;
		_indesign.wordRTFImportPreferences.preserveGraphics = _preserveGraphics;
		_indesign.wordRTFImportPreferences.preserveLocalOverrides = _preserveLocalOverrides;
		_indesign.wordRTFImportPreferences.preserveTrackChanges = _preserveTrackChanges;
		_indesign.wordRTFImportPreferences.removeFormatting = _removeFormatting;
		_indesign.wordRTFImportPreferences.resolveParagraphStyleClash = _resolveParagraphStyleClash;
		_indesign.wordRTFImportPreferences.resolveCharacterStyleClash = _resolveCharacterStyleClash;
		_indesign.wordRTFImportPreferences.useTypographersQuotes = _useTypographersQuotes;
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
    var __log = function(msg) {
        if(_logger == null){
            _logger = LoggerFactory.getLogger(CsBridge.options().log);
        }
        _logger.log("Filemanager : " + msg);
    };
    
    return ret;
})(app);