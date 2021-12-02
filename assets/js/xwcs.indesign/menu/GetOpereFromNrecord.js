
#targetengine "MB_BridgeRTF"

(function (br) {
    if (!String.prototype.endsWith) {
      String.prototype.endsWith = function(search, this_len) {
        if (this_len === undefined || this_len > this.length) {
          this_len = this.length;
        }
        return this.substring(this_len - search.length, this_len) === search;
      };
    }

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(search, rawPos) {
                var pos = rawPos > 0 ? rawPos|0 : 0;
                return this.substring(pos, pos + search.length) === search;
        };
    }

    main();

    //-----------------------------------------------------------------------------
    function main() {
        var currDoc = app.activeDocument;
        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        var text = app.selection[0].contents;
        if (!text) {
            alert("Devi selezionare il testo sul quale costruire i rimandi");
            exit();
        }
        var currStory = app.selection[0].insertionPoints[0].parentStory;
        var tags = menu();
        var nrecord = tags.nrecord;
        var numnote = tags.numnote;
        //Verifico l'esistenza del Nrecord
        var opere = getOpereFromBO(nrecord);
        if (!opere || !opere.data) {
            alert("Opere non trovate o errore per nrecord: " + nrecord);
            exit();    
        } else {
            opere = opere.data;
        }

        var foundedCrossRef = false;
        var foundedGrep;
        var allFounds;
        var textTag;
        var i = 0;
        while ((!foundedCrossRef) && (i < currDoc.indexes[0].topics.length)) {
            //$.level = 1; debugger;
            var topic = currDoc.indexes[0].topics[i];
            if (topic.name.indexOf('a="' + nrecord + '"') > -1) {
                foundedCrossRef = true;
            } else {
                i++;
            }
        }
        /*
            if (foundedCrossRef){
              alert("Esiste già un'indicizzazione per il codice : " + nrecord)
              return
            }
        */
        if (text.toUpperCase().indexOf("ART") >= 0 && text.toUpperCase().indexOf("ARTICOLI") == -1 && text.toUpperCase().indexOf("ARTT") == -1) {
            app.findGrepPreferences.findWhat = "\\d+";
            foundedGrep = app.selection[0].findGrep();
            var art = foundedGrep[0].contents;
            app.findGrepPreferences = NothingEnum.nothing;
            app.changeGrepPreferences = NothingEnum.nothing;
            if (tags.searchonlyinnotes) {
                app.findGrepPreferences.pointSize = 8;
            }
            app.findGrepPreferences.findWhat = "\(\(ART\\.|Art\\.|art\\.|Articolo|articolo|ARTICOLO\)\) \\b" + art + "\\b";
            //app.changeTextPreferences.changeTo = "{ix}<?xw-a  id=\""+nrecord+"_p\" a=\""+nrecord+"\"?>{#ix}"+text+"{ix}<?xw-a  off?>{#ix}";
            if (tags.keep_note) {
                textTag = "{ix}<?xw-a  id=\"" + nrecord + "_p\" a=\"" + nrecord + "\"?>{#ix}$1 " + art + "{ix}<?xw-a  off?>{#ix} (" + numnote + ")";
            } else {
                textTag = "{ix}<?xw-a  id=\"" + nrecord + "_p\" a=\"" + nrecord + "\"?>{#ix}$1 " + art + "{ix}<?xw-a  off?>{#ix}";
            }
            app.changeGrepPreferences.changeTo = textTag;
            allFounds = app.activeDocument.findGrep();
            for (var i = 0; i < allFounds.length; i++) {
                var curFound = allFounds[i];
                curFound.select();
                app.layoutWindows[0].zoomPercentage = 120;
                //if (confirm("Vuoi sostituire?", undefined, "Find/Replace")) {
                if (PROG_Confirm("Find/Replace", "Vuoi sostituire?")) {
                    curFound.changeGrep();
                }
            }
        } else if (text.toUpperCase().indexOf("ARTT") >= 0 || text.toUpperCase().indexOf("ARTICOLI") >= 0) {
            //  if (text.toUpperCase().indexOf("ARTT")>=0) {
            app.findGrepPreferences.findWhat = "\\d+";
            foundedGrep = app.selection[0].findGrep();
            var art = foundedGrep[0].contents;
            app.findGrepPreferences = NothingEnum.nothing;
            app.changeGrepPreferences = NothingEnum.nothing;
            if (tags.searchonlyinnotes) {
                app.findGrepPreferences.pointSize = 8;
            }
            app.findGrepPreferences.findWhat = "\(\(ARTT\\.|Artt\\.|artt\\.|Articoli|articoli|ARTICOLI\)\) \\b" + art + "\\b";
            //app.changeTextPreferences.changeTo = "{ix}<?xw-a  id=\""+nrecord+"_p\" a=\""+nrecord+"\"?>{#ix}"+text+"{ix}<?xw-a  off?>{#ix}";
            if (tags.keep_note) {
                textTag = "{ix}<?xw-a  id=\"" + nrecord + "_p\" a=\"" + nrecord + "\"?>{#ix}$1 " + art + "{ix}<?xw-a  off?>{#ix} (" + numnote + ")";
            } else {
                textTag = "{ix}<?xw-a  id=\"" + nrecord + "_p\" a=\"" + nrecord + "\"?>{#ix}$1 " + art + "{ix}<?xw-a  off?>{#ix}";
            }
            app.changeGrepPreferences.changeTo = textTag;
            allFounds = app.activeDocument.findGrep();
            for (var i = 0; i < allFounds.length; i++) {
                var curFound = allFounds[i];
                curFound.select();
                app.layoutWindows[0].zoomPercentage = 120;
                //if (confirm("Vuoi sostituire?", undefined, "Find/Replace")) {
                if (PROG_Confirm("Find/Replace", "Vuoi sostituire?")) {
                    curFound.changeGrep();
                }
            }
        } else {
            app.findGrepPreferences = NothingEnum.nothing;
            app.changeGrepPreferences = NothingEnum.nothing;
            if (tags.searchonlyinnotes) {
                app.findGrepPreferences.pointSize = 8;
            }
            app.findChangeTextOptions.wholeWord = true;
            var textToReplace = text;
            textToReplace =textToReplace.replace("(", "\\(");
            textToReplace = textToReplace.replace(")", "\\)");
            if (! textToReplace.startsWith("\\(")) {
                    textToReplace = "\\b" + textToReplace ;
               }
            if (! textToReplace.endsWith("\\)")) {
                    textToReplace = textToReplace + "\\b";
               }
           
            app.findGrepPreferences.findWhat = textToReplace;
            //app.changeTextPreferences.changeTo = "{ix}<?xw-a  id=\""+nrecord+"_p\" a=\""+nrecord+"\"?>{#ix}"+text+"{ix}<?xw-a  off?>{#ix}";
            if (tags.keep_note) {
                textTag = "{ix}<?xw-a  id=\"" + nrecord + "_p\" a=\"" + nrecord + "\"?>{#ix}" + text + "{ix}<?xw-a  off?>{#ix} (" + numnote + ")";
            } else {
                textTag = "{ix}<?xw-a  id=\"" + nrecord + "_p\" a=\"" + nrecord + "\"?>{#ix}" + text + "{ix}<?xw-a  off?>{#ix}";
            }
            textTag = textTag.replace("\\(", "(");
            textTag = textTag.replace("\\)", ")");
            app.changeGrepPreferences.changeTo = textTag;
            allFounds = app.activeDocument.findGrep();
            for (var i = 0; i < allFounds.length; i++) {
                var curFound = allFounds[i];
                curFound.select();
                app.layoutWindows[0].zoomPercentage = 120;
                //if (confirm("Vuoi sostituire?", undefined, "Find/Replace")) {
                if (PROG_Confirm("Find/Replace", "Vuoi sostituire?")) {
                    curFound.changeGrep();
                }
            }
        }
        var Le;
        //var tags = menu();
        //if (tags.replace_index && currDoc.indexes.length > 0) {
        //Non canccella più i riferimenti presenti
        /* if (currDoc.indexes.length > 0) {
             currDoc.indexes[0].topics.everyItem().remove();
         }*/
        if (currDoc.indexes.length == 0) {
            currDoc.indexes.add();
        }
        tagsToCharacterStyles(currDoc, tags);
        foundedGrep = currDoc.findGrep();
        Le = foundedGrep.length;
        var w = new Window('palette', 'Creating topics');
        w.pbar = w.add('progressbar', [0, 0, 300, 20], 0, Le);
        w.show();
        for (var i = Le - 1; i > -1; i--) {
            w.pbar.value = Le - i;
            addPageRef(currDoc, foundedGrep[i], tags);
        }
  
        // if (tags.keep_tags == false) {
        if (true) {
            delete_tags(currDoc);
        }
        changeNoteReferencesCharacterStyle(currStory,numnote);
        if (tags.keep_note) {
            var nota = appendNotes(currStory,numnote,opere);
        }
        w.close();
    }

    function write_history(obj) {
        var f = File(scriptName().replace(/\.js.*$/, '.txt'));
        f.open('w');
        f.encoding = 'utf-8';
        f.write(obj.toSource());
        f.close();
    }

    function read_history() {
        var f = File(scriptName().replace(/\.js.*$/, '.txt'));
        var o = {
            nrecord: 'nrecord',
            searchonlyinnotes: false,
            start: '{ix}',
            stop: '{#ix}',
            replace: true
        };
        if (f.exists) {
            f.open('r');
            f.encoding = 'utf-8';
            var obj = f.read();
            f.close();
            try {
                return eval(obj);
            } catch (_) {
                return o;
            }
        }
        return o;
    }

    function disallowed(ch) {
        //~   return "\\{}\"$%^&*()+=\[\]:;@~#?/<>".indexOf(ch) > -1;
        return "\\{}\"$^&*()+=\[\]:;?/~<>".indexOf(ch) > -1;
    }

    function addEscapes(s) {
        s = s.replace(/\\/g, '\\\\');
        s = s.replace(/([~.{}()\[\]])/g, '\\$1');
        return s.replace(/\$/g, '[$]');
    }

    function errorM(m) {
        alert(m, 'Error', true);
        exit();
    }

    function scriptName() {
        try {
            return String(app.activeScript);
        } catch (e) {
            return e.fileName;
        }
    }
    // Remove start and end tags
    function strip(s, tags) {
        s = s.replace(RegExp('^' + tags.start), '');
        return s.replace(RegExp(tags.stop + '$'), '');
    }
    //-----------------------------------------------------------------------------------------------------
    function create_topic(index, s, tags) {
        var topic, parts;
        topic = index.topics.add(s);
        return topic;
    }

    function addPageRef(doc, found, tags) {
        var ip = found.insertionPoints[0].index;
        var topic_text = strip(found.contents, tags);
        var topic = create_topic(doc.indexes[0], topic_text, tags);
        if (topic == '') return; // If the topic is a cross-reference, an empty string is returned
        var p_ref = topic.pageReferences.add(found.insertionPoints[0], PageReferenceType.CURRENT_PAGE);
        if (Math.abs(p_ref.sourceText.index - ip) > 0) { // Workaround for the table bug
            try {
                found.parentStory.characters[p_ref.sourceText.index].move(LocationOptions.after, found.insertionPoints[0]);
            } catch (_) {}
        }
    }

    function delete_tags(doc) {
        app.findGrepPreferences = app.changeGrepPreferences = null;
        app.findGrepPreferences.findWhat = '~I'; //'~I' è l'indicatore di indice nel menù di sostituzione grep
        app.changeGrepPreferences.appliedCharacterStyle = doc.characterStyles[0];
        doc.changeGrep();
        app.findGrepPreferences = app.changeGrepPreferences = null;
        app.findGrepPreferences.appliedCharacterStyle = doc.characterStyles.item('index_from_tags');
        doc.changeGrep();
        try {
            doc.characterStyles.item('index_from_tags').remove();
        } catch (_) {}
    }

    function tagsToCharacterStyles(doc, tags) {
        if (!doc.characterStyles.item('index_from_tags').isValid) {
            doc.characterStyles.add({
                name: 'index_from_tags',
                pointSize: '0.1 pt',
                horizontalScale: 1
            });
            // doc.characterStyles.add ({name: 'index_from_tags', fillColor: 'C=0 M=100 Y=0 K=0'});
        }
        app.findGrepPreferences = app.changeGrepPreferences = null;
        app.changeGrepPreferences.appliedCharacterStyle = doc.characterStyles.item('index_from_tags');
        app.findChangeGrepOptions.includeFootnotes = true;
        app.findGrepPreferences.findWhat = tags.start + '.+?' + tags.stop;
        doc.changeGrep();
    }

    function trovaUltimoNumeroNota() {
        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        app.findGrepPreferences.pointSize = 8;
        app.findGrepPreferences.findWhat = '\\(\\d+\\)';
        var allFounds = app.activeDocument.findGrep();
        // $.level = 1; debugger;
        var max = -1;
        for (var i = 0; i < allFounds.length; i++) {
            var num = allFounds[i].contents.replace("(", "").replace(")", "") * 1;
            if (num > max) {
                max = num;
            }
        }
        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        return max + 1;
    }
    // Interface -----------------------------------------------------------------------------
    function menu() {
        var previous = read_history();
        var maxNumNota = trovaUltimoNumeroNota();
        if (maxNumNota <= 0) {
            maxNumNota = previous.numnote;
        }
        var w = new Window('dialog', 'Index from text tags', undefined, {
            closeButton: false
        });
        w.alignChildren = 'fill';
        //w.main = w.add ('panel {orientation: "column", alignChildren: ["right", "top"]}');
        w.main = w.add('panel {alignChildren: "right"}');
        var g1 = w.main.add('group');
        g1.add('statictext', undefined, 'Nrecord: ');
        var nrecord = g1.add("edittext", undefined, previous.nrecord);
        nrecord.characters = 10;
        nrecord.active = true;
        var g2 = w.main.add('group');
        g2.add('statictext', undefined, 'Start tag: ');
        var start_tag = g2.add('edittext', undefined, previous.start);
        start_tag.characters = 10;
        start_tag.active = true;
        start_tag.enabled = false;
        var g3 = w.main.add('group');
        g3.add('statictext', undefined, 'End tag: ');
        var stop_tag = g3.add('edittext', undefined, previous.stop);
        stop_tag.characters = 10;
        stop_tag.active = true;
        stop_tag.enabled = false;
        w.main2 = w.add('panel {alignChildren: "left"}');
        var g4 = w.main.add('group');
        g4.add('statictext', undefined, 'N. nota');
        var numnote = g4.add("edittext", undefined, maxNumNota);
        numnote.characters = 10;
        numnote.active = true;
        var searchOnlyInNotes = w.main2.add('checkbox', undefined, 'Crea link solo nelle note');
        searchOnlyInNotes.value = previous.searchonlyonnotes;
        var keep_note = w.main2.add('checkbox', undefined, 'Vuoi creare anche le note?');
        w.buttons = w.add('group {orientation: "row", alignChildren: ["right", "bottom"]}');
        w.buttons.add('button', undefined, 'OK');
        w.buttons.add('button', undefined, 'Cancel', {
            name: 'cancel'
        });
        if (w.show() == 2) exit();
        if (start_tag.text == '' || stop_tag.text == '') {
            errorM('Start tag and End tag must not be empty.');
        }
        write_history({
            nrecord: nrecord.text,
            numnote: numnote.text,
            searchonlyinnotes: searchOnlyInNotes.value,
            start: start_tag.text,
            stop: stop_tag.text,
            keep_note: keep_note.value
        });
        return {
            nrecord: nrecord.text,
            numnote: numnote.text,
            searchonlyinnotes: searchOnlyInNotes.value,
            start: addEscapes(start_tag.text),
            stop: addEscapes(stop_tag.text),
            keep_note: keep_note.value
        };
    }

    function getOpereFromBO(nrecord) {
        if (!nrecord || isNaN(parseInt(nrecord))) {
            alert("Attenzione!" + "\n" + "NRECORD mancante o non numerico");
            exit();
        }
        try {
            // call c# action
            var ret = br.doAction({
                what: 'MakeVedasiForNrecord',
                args: [
                    nrecord
                ]
            })|| {
                success: false,
                msg: "Unhandled error"
            };
            if (!ret.success) {
                // error file will remain open
                alert("Operazione FALLITA!  [" + ret.errmsg + "]");
                return false;
            } else {
                // No error
                return ret;
            }
            br.log("C# response: " + JSON.stringify(ret));
        } catch (e) {
            alert(e);
            return false;
        }
    }

    function appendNotes(myStory, numnote, text) {
        if (text) {
            //Accodo in fondo al testo della story
            var nota = "\t(" + numnote + ")\t" + text + "\r";
            myStory.insertionPoints[-1].contents = nota;
            // Per applicare uno stile particolare alla nota appena aggiunta, occorre risalire al paragrafo
            // che ho appena aggiunto, passando per insertionPoint
            // Qualcosa tipo:
            //myStory.insertionPoints[-2].parentParagraph //(se esiste parentParagraph)

            /*
            //Aggiunta delle note in un box di testo
            tframe = myDoc.textFrames.add({geometricBounds : [36, 36, 100, 100]});
            placedstory = tframe.parentStory;
            placedstory.insertionPoints[-1].contents = nota"
            */
        }
    }

    function changeNoteReferencesCharacterStyle(myStory, numnote) {
        if (numnote) {
            app.findGrepPreferences = NothingEnum.nothing;
            app.changeGrepPreferences = NothingEnum.nothing;
            app.findGrepPreferences.findWhat = "\\(" + numnote + "\\)";
            //app.changeGrepPreferences.changeTo = "\(" + numnote + "\)";
            allFounds = app.activeDocument.findGrep();
            for (var i = 0; i < allFounds.length; i++) {
                var curFound = allFounds[i];
                curFound.select();
                //curFound.changeGrep();
                curFound.pointSize = "8pt";
            }
        }
    }
    
    function PROG_Confirm(title, testo) {
        var G_continua = false;
        var x_1 = 600;
        var y_1 = 400;
        var larg = 300;
        var alt = 100;
        var finestra = new Window('dialog', title);
        finestra.bounds = [x_1, y_1, x_1 + larg, y_1 + alt];
        with(finestra) {
            finestra.t1 = add("statictext", [10, 10, 290, 30], testo);
            //finestra.t2 = add("edittext",[10,40,590,410],elenco, {multiline:true, scrolling:true});
            finestra.Puls_Manuale = add("button", [10, 50, 150, 75], "Ok");
            finestra.Puls_Manuale.onClick = function(e) {
                G_continua = true;
                finestra.close();
            };
            finestra.Puls_PIM = add("button", [170, 50, 290, 75], "Annulla");
            finestra.Puls_PIM.onClick = function(e) {
                G_continua = false;
                finestra.close();
            };
        }
        finestra.show();
        return G_continua;
    }

})(CsBridge);