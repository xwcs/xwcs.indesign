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

//$.level = 1; //debugger

var FileManager = (function(ind){

    const TEMPLATE_FILE_NAME = 'template.indt';

    // indesign
    var _indesign = ind;

    var _err = 0;
    var _errMsg = '';
    var _myStory;
    var _myLabel;
    //var  _prefsBackup;
    var  _convertPageBreaks,
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
              app.wordRTFImportPreferences.useTypographersQuotes = false;
            } else { 
              app.wordRTFImportPreferences.useTypographersQuotes = true;
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
            
                        // Import to a temporary doc to avoid styles garbage
                        // BEGIN
                        _indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
                        var docTemp = _indesign.documents.add();
                        _indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
                        var boxTemp = docTemp.textFrames.add();
                        boxTemp.geometricBounds = [0,0,1000,1000];
                        var storyTemp =  boxTemp.parentStory;
                        storyTemp.insertionPoints.item(0).place(rtfFile.fsName,false);
                        _indesign.selection = null;
						//$.writeln("storyTemp.texts.length:" + storyTemp.texts.length);
                        for (var i = 0; i < storyTemp.texts.length; i++){
						  //$.writeln("storyTemp.texts[" + i + "]:");
                          if (i > 0){
                            storyTemp.texts[i].select(SelectionOptions.ADD_TO);
                          } else {
                            storyTemp.texts[i].select();
                          }
                        }
                        //$.writeln("storyTemp.contents: " + storyTemp.contents.slice(0, 40));
                        //$.writeln("typeof docTemp: " + typeof docTemp);
                        if (app.selection[0].length > 0 && storyTemp.isValid) {
                          //$.writeln("DENTRO if (storyTemp.isValid)");
                          _indesign.copy();
                          //$.writeln("AFTER _indesign.copy()");
                          docTemp.close(SaveOptions.no);
                          docTemp = undefined;
                          _myStory.insertionPoints.item(0).select();
                          //$.writeln("BEFORE _indesign.paste()" + _myStory.contents.slice(0, 40));
                          _indesign.paste();
                          //$.writeln("AFTER _indesign.paste()" + _myStory.contents.slice(0, 40));
                        }
                        if (docTemp){
                          //$.writeln("typeof docTemp: " + typeof docTemp);
                          docTemp.close(SaveOptions.no);
                        }
                        // END
            
                        // The RTF is already placed
                        // _myStory.insertionPoints.item(0).place(rtfFile.fsName,false);
      
                        // save the RTF path into story label
                        var lData = {
                            RtfFilePath: rtfFile.fsName,
                            meta : typeof(data) == "string" ? JSON.parse(data) : data
                        };
                        data.RtfFilePath = rtfFile.fsName;
                        _myStory.label = JSON.stringify(lData);
                        //$.writeln("_myStory.label" + _myStory.label);
                        //iterId + '|||' + rtfFile.fsName;  // iter ID and path
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
            $.hiresTimer;
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
                    //$.writeln("save: _myStory.label" + _myStory.label);
                    // Apply default replaces to standardize document
                    $.writeln('Before __pulisciRTF: ' + $.hiresTimer/1000000);
                    __pulisciRTF(_indesign.activeDocument);
                    $.writeln('After __pulisciRTF: ' + $.hiresTimer/1000000);
                    // Elimina la riga vuota inserita da ID dopo tutte le tabelle
                    $.writeln('before __EliminaRigaVuotaDopoTabella: ' + $.hiresTimer/1000000);
                    __EliminaRigaVuotaDopoTabella(_indesign.activeDocument, _myStory);
                    $.writeln('after __EliminaRigaVuotaDopoTabella: ' + $.hiresTimer/1000000);
                    //Controlla gli eventuali glifi inesistenti nei font del documento
                    //_indesign.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
                    $.writeln('before __FindMissingGlyph: ' + $.hiresTimer/1000000);
                    if (__FindMissingGlyph(_indesign.activeDocument)) {
                      throw new Error(-43, 'Sono presenti glifi senza font. Impossibile continuare.');
                    }
                    $.writeln('after __FindMissingGlyph: ' + $.hiresTimer/1000000);
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
                        $.writeln('before SaveINDD: ' + $.hiresTimer/1000000);
                        _indesign.activeDocument.save(new File(Folder.temp + '/indd/' + inddName));
                        $.writeln('after SaveINDD: ' + $.hiresTimer/1000000);

                        // in this case file must exists
                        if (rtfFile.exists) {
                            var p = _indesign.pdfExportPresets.firstItem();
                            $.writeln('before SaveRTF rtfFile == null: ' + $.hiresTimer/1000000);
                            _myStory.exportFile(ExportFormat.RTF, rtfFile, false, p, '', true);
                            $.writeln('after SaveRTF rtfFile == null: ' + $.hiresTimer/1000000);
                            ret = { file: rtfFile, meta: data.meta };
                        } else {
                            _err = -43;
                            _errMsg = 'L\'etichetta del brano non contiene un percorso valido per il file RTF da salvare.';
                        }
                    } else {
                        // just export
                        $.writeln('before SaveRTF: ' + $.hiresTimer/1000000);
                        _myStory.exportFile(ExportFormat.RTF, rtfFile);
                        $.writeln('after SaveRTF: ' + $.hiresTimer/1000000);
                        ret = { file: rtfFile, meta: data.meta };
                    }                   

                    // close file
                    $.writeln('before doClose: ' + $.hiresTimer/1000000);
                    if (doClose) _indesign.activeDocument.close(SaveOptions.no);
                    $.writeln('after doClose: ' + $.hiresTimer/1000000);
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
    };

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
            $.writeln("sto:"+ myDocument.stories.length);
            var lista_sto = myDocument.stories.everyItem().getElements();
            var __foundLabel=0;
            for (var i = 0; i < __stories;i++) {
              var __label = lista_sto[i].label; //myDocument.stories[i].label;
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
          throw new Error(_errMsg);
          }    
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
  

  function __pulisciRTF (myDocument) {
    // Parametri: __cambia(myDocument, stringa1,stringa2, grep, wholeword, fontstyle1, fontstyle2, parastyle1, parastyle2 )
    
    // Create default styles if missing
    __verifyStyle(myDocument, "TITOLO_SOMMARIO");
    __verifyStyle(myDocument, "TESTO");
    
    //Imposto parametri di change
    __initReplace();
    
    // ex cambiagrep
    __cambia(myDocument, "  +", " ", true, false, false, false, false, false);
    __cambia(myDocument, "A’|A'", "À", true, false, false, false, false, false);
    __cambia(myDocument, "E’|E'", "È", true, false, false, false, false, false);
    __cambia(myDocument, "I’|I'", "Ì", true, false, false, false, false, false);
    __cambia(myDocument, "O’|O'", "Ò", true, false, false, false, false, false);
    __cambia(myDocument, "U’|U'", "Ù", true, false, false, false, false, false);
    __cambia(myDocument, "a’|a'", "à", true, false, false, false, false, false);
    __cambia(myDocument, "e’|e'", "è", true, false, false, false, false, false);
    __cambia(myDocument, "i’|i'", "ì", true, false, false, false, false, false);
    __cambia(myDocument, "o’|o'", "ò", true, false, false, false, false, false);
    __cambia(myDocument, "u’|u'", "ù", true, false, false, false, false, false);
    __cambia(myDocument, " $", "");
    
    //ex cambia
    __cambia(myDocument, "( ", "(", false, false, false, false, false, false);
    __cambia(myDocument, " )", ")", false, false, false, false, false, false);
    __cambia(myDocument, " :", ":", false, false, false, false, false, false);
    __cambia(myDocument, " ,", ",", false, false, false, false, false, false);
    __cambia(myDocument, " ;", ";", false, false, false, false, false, false);
    __cambia(myDocument, "«", "“", false, false, false, false, false, false);
    __cambia(myDocument, "»", "”", false, false, false, false, false, false);
    __cambia(myDocument, "–", "-", false, false, false, false, false, false);
    __cambia(myDocument, "“", "\"", false, false, false, false, false, false);
    __cambia(myDocument, "”", "\"", false, false, false, false, false, false);
    __cambia(myDocument, "…", "...", false, false, false, false, false, false);
    __cambia(myDocument, "^k", "", false, false, false, false, false, false);
    
    //ex cambiagrep2 (in realtà il nome non era giusto non eseguiva un changeGrep, ma un changeText)
    __cambia(myDocument, "pò","po'", false, true, false, false, false, false);

    
    // ex cambia_bold (ripetere la riga per ciascuno stile da sostituire)
    __cambia(myDocument, "(", "(", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, "(", "(", false, false, "Bold Italic", "Italic", false, false);
    
    __cambia(myDocument, ")", ")", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, ")", ")", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, ".", ".", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, ".", ".", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, ":", ":", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, ":", ":", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, ";", ";", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, ";", ";", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, ",", ",", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, ",", ",", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, "“", "“", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, "“", "“", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, "”", "”", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, "”", "”", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, "\"", "\"", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, "\"", "\"", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, "•", "•", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, "•", "•", false, false, "Bold Italic", "Italic", false, false);

    __cambia(myDocument, "-", "-", false, false, "Bold", "Regular", false, false);
    __cambia(myDocument, "-", "-", false, false, "Bold Italic", "Italic", false, false);
    
    // Change pagragraph style
    __cambia(myDocument, "^p^p", "^p^p", false, false, false, false, "TITOLO_SOMMARIO", "TESTO");

    // Change styleRifG
    __cambia(myDocument, ".", false, true, false, false, false, "RifG", "RifG");

    // Change RifT
    __cambia(myDocument, ".", false, true, false, false, false, "RifT", "RifT");

    //Reset of replace parameters
    __resetReplace();
  }

  function __initReplace () {
    //changeText options
    _indesign.findTextPreferences = NothingEnum.nothing;
    _indesign.changeTextPreferences = NothingEnum.nothing;
    _indesign.findChangeTextOptions.caseSensitive = false;
    _indesign.findChangeTextOptions.includeFootnotes = true;
    _indesign.findChangeTextOptions.includeHiddenLayers = false;
    _indesign.findChangeTextOptions.includeLockedLayersForFind = false;
    _indesign.findChangeTextOptions.includeLockedStoriesForFind = false;
    _indesign.findChangeTextOptions.includeMasterPages = false;
    _indesign.findChangeTextOptions.wholeWord = false;
    
    // changeGrep options
    _indesign.findGrepPreferences = NothingEnum.nothing;
    _indesign.changeGrepPreferences = NothingEnum.nothing;
    _indesign.findChangeGrepOptions.includeFootnotes = true;
    _indesign.findChangeGrepOptions.includeHiddenLayers = false;
    _indesign.findChangeGrepOptions.includeLockedLayersForFind = false;
    _indesign.findChangeGrepOptions.includeLockedStoriesForFind = false;
    _indesign.findChangeGrepOptions.includeMasterPages = false;
  }

  function __resetReplace () {
    //changeText options
    _indesign.findTextPreferences = NothingEnum.nothing;
    _indesign.changeTextPreferences = NothingEnum.nothing;
    
    // changeGrep options
    _indesign.findGrepPreferences = NothingEnum.nothing;
    _indesign.changeGrepPreferences = NothingEnum.nothing;
  }
  
  function __cambia(myDocument, stringa1, stringa2, grep, wholeword, fontstyle1, fontstyle2, parastyle1, parastyle2 ) {
    //https://indesignsecrets.com/resources/grep
    //https://indesignsecrets.com/favorite-grep-expressions-you-can-use.php
    //https://indesignsecrets.com/grep-and-text-metacharacter-cheat-sheet.php
    //https://indesignsecrets.com/removing-the-paragraph-return-at-the-end-of-story.php
    //https://indesignsecrets.com/findbetween-a-useful-grep-string.php
    
    __initReplace();
    if (grep) {
      _indesign.findGrepPreferences.findWhat = stringa1;
      if (stringa2) {
        _indesign.changeGrepPreferences.changeTo = stringa2;
      }
      if (parastyle1 && parastyle2) {
        _indesign.findGrepPreferences.appliedParagraphStyle = parastyle1;
        _indesign.findGrepPreferences.appliedParagraphStyle = parastyle2;
      }
      // Do replace
      myDocument.changeGrep();
    } else {
      _indesign.findTextPreferences.findWhat = stringa1;
      _indesign.changeTextPreferences.changeTo = stringa2;
      if (wholeword) {
        _indesign.findChangeTextOptions.wholeWord = true;
      }
      if (fontstyle1 && fontstyle2) {
        _indesign.findTextPreferences.fontStyle = fontstyle1;
        _indesign.changeTextPreferences.fontStyle = fontstyle2;
      }
      if (parastyle1 && parastyle2) {
        _indesign.findTextPreferences.appliedParagraphStyle = parastyle1;
        _indesign.changeTextPreferences.appliedParagraphStyle = parastyle2;
      }
      // Do replace
      myDocument.changeText();
    }
    _indesign.findTextPreferences = NothingEnum.nothing;
    __resetReplace();
  }


  function __verifyStyle(myDocument, mystyle){
    var style, myName;
    style = myDocument.paragraphStyles.item(mystyle);
    if (style.isValid){
      myName = style.name;
    } else {
      style = myDocument.paragraphStyles.add({name:mystyle});
    }
    /*
    try{
        style = myDocument.paragraphStyles.item(mystyle);
        //If the paragraph style does not exist, trying to get its name will generate an error.
        myName = style.name;
      }
      catch (myError){
        //The paragraph style did not exist, so create it.
        style = myDocument.paragraphStyles.add({name:mystyle});
      }
      */
  }
  
  function __EliminaRigaVuotaDopoTabella(myDocument, myStory) {
    //__cambia(myDocument, stringa1,stringa2, grep, wholeword, fontstyle1, fontstyle2, parastyle1, parastyle2 ) {
    //Pulisco le righe costituite solo da spaziature
    __cambia(myDocument, "^[ |\\t]+$", "", true, false, false, false, false, false);
    var lista_par = myStory.paragraphs.everyItem().getElements();
    var max_par = lista_par.length;
    
    for (var j = 0; j < max_par; j++) {
      var currPara = lista_par[j];
      if (currPara == null || currPara == undefined ) {
        // continue;
      } else {
        if (currPara.tables.length>0) {
          var k = j;
          k++;
          //alert (myStory.paragraphs[j].contents + " " + myStory.paragraphs[k].contents);
          if (myStory.paragraphs[k].isValid && myStory.paragraphs.length >= k && (myStory.paragraphs[k].contents == "\r" || myStory.paragraphs[k].contents == "\n" || myStory.paragraphs[k].contents == "")) {
            myStory.paragraphs[k].remove();
          j--;
          }
        }
      }
    }

    //Tolgo gli spazi vuoti alla fine della story
    //non toglie i tag figure (voci d'indice xe identificati come ~I) che ID include nel \s
    __cambia(myDocument, "[\\s^~I]+\\Z", "\\r", true, false, false, false, false, false);
  }


  function __FindMissingGlyph(myDocument){
    var missing = false;
    var founded = [];
    var lista_font = myDocument.fonts.everyItem().getElements();
    var numFonts = lista_font.length;  //myDocument.fonts.length;
    $.writeln("numFonts:" + numFonts);
    for (var z=0;z<numFonts;z++) {
      var fontS = lista_font[z];
      var fontName = fontS.fontFamily + "\t" + fontS.fontStyleName;
      founded = [];
      _indesign.findGlyphPreferences = NothingEnum.nothing;
      _indesign.findGlyphPreferences = NothingEnum.nothing;
      _indesign.findGlyphPreferences.glyphID  = 0;
      _indesign.findGlyphPreferences.appliedFont = fontName;
      founded = _indesign.findGlyph ();
      if (founded.length>0) {
        //$.writeln(founded.length+ ' Trovati glyphi mancanti in  ' + fontName );
        missing = true;
        for (var y=0;y<founded.length;y++) {
          //$.writeln( founded[y].contents+ '   ' +founded[y].contents.charCodeAt(0) );
          founded[y].select();
          _indesign.layoutWindows[0].zoomPercentage = 120;
          if (confirm("Trovati glifi mancanti per font:\r\n" + fontName + "\r\n\r\nVuoi sostituire?", undefined, "Glifi mancanti")) {
            exit();
          }
        }
      }
    }
    return missing;
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