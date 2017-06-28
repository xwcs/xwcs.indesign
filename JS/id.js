#target "indesign"
#targetengine "session_CsBridge"

var LoggerFactory = (function(ind){
    var _indesign = ind;

    var ret = {
        getLogger : function(path){
            return __openLogger(path);
        }
    };

    var __openLogger = function (path){
       
        return {
            log : function(msg){
                 var f = new File(path);
                f.open("e");
                f.seek(0, 2);
                f.writeln(msg);
                f.close();
            }            
        };
    };

    return ret;
})(app);

var CsBridge = (function(ind){
    // this will help mantain C# <-> IND compatibility
    var _CsBridge_version = '0.0.2';

    // private closure
    var _indesign = ind;

    /// @Socket
    var _tube = null;

    /// @Logger
    var _logger = null;

    // options
    var _opt = {
        url : 'localhost:13000',
        log : 'c:/tmp/indesign.log',
        scriptPath : 'C:/Users/Laco/AppData/Roaming/Adobe/InDesign/Version 8.0/it_IT/Scripts/Scripts Panel'
    };

    var _listenersMap = {};

    /*
        map of elements
        {
            sender : <sender>
            kind: <event kind>
        }
    */
    var _handlers = new Object();


    // public interface
    var ret = {
        version : function(){
            return _CsBridge_version;
        },
        open : function(options){
            try{
                __merge_options (options);

                __log("Connecting ...");     

                return __connect (_opt.url);
            }catch(e){
                __log(e.message);
            }
            
        },
        
        addEventHandler : function(evtSource, evtKind){
            // first check event listener presence
            // we look for label   :   CsBridge + evtSource.Id + evtKind
            var label = 'CsBridge_' + evtSource.id + '-' + evtKind;
            if(_listenersMap.hasOwnProperty(label)){
                // we have old listener already
                // so just return
                __log("Skipped add handler : " + label );
                return ;
            }
            var listener = evtSource.addEventListener(evtKind, function(evt){
                __eventHandler(evtKind, evt);    
            });
            _listenersMap[label] = listener.id;
            __log("Added handler : " + label );
        },

        close : function(){
            _tube.close();
        },    

        ping : function(){
            __log("Sending ping ...");
            var ret = __sendMessage('JsPing', {});
            if(ret.status == 'ok'){
                __log("Ping OK!");
                return true;
            }
            __log("Ping FAIL!");
            return false;
        },

        runAsync : function(what){
            // we need send counter value from here cause inside it will use closure
            return __registerTask({
                taskId : _asyncTaskCounter++,
                task: what
            });
        },

        options : function(){
            return _opt;
        }
    };

    var __eventHandler = function(eventKind, evt){
        __log("Event: " + eventKind);

        var ret = __sendMessage("JsEvent", {
            bubbles : evt.bubbles,
            cancelable : evt.cancelable,
            defaultPrevented: evt.defaultPrevented,
            eventType: evt.eventType,
            id: evt.id,
            index: evt.index,
            isValid: evt.isValid,
            propagationStopped: evt.propagationStopped,
            timeStamp: evt.timeStamp,
            currentTargetID: evt.currentTarget.id,
            parentID: evt.parent.id,
            targetID: evt.target.id,
            eventKind: eventKind
        });    
        
        __logResult(ret);
    
    };

    var __logResult = function (result){
        if(result.status == 'ok'){
            if(result.hasOwnProperty('data')){
                __log(JSON.stringify(result.data));
            }else{
                __log(JSON.stringify(result));
            }           
        }else{
            __log('Error:' + result.msg);
        }
    };

    var __getMessageKind = function(kindStr){
        switch(kindStr){
            case 'JsEvent' : return 1;
            case 'JsAction' : return 2;
            case 'JsTaskResult' : return 3;
            case 'JsPing' :
            default : return 0; // ping
        }
    };

    var __sendMessage = function(kindStr, what){
        
        what.DataKindType = __getMessageKind(kindStr);

        _tube.write(JSON.stringify({
            id: 1,
            data: what
        }));
        
        // parse
        var result = _tube.read();
        if(result == "") return {status: 'error', msg: 'empty resposne'};
        try{
            var d = JSON.parse(result);
            if(d.hasOwnProperty("status")){
                return d;
            }else{
                return {status: 'ok', data : d};
            }   
        }catch(e){
            return {status: 'error', msg: e.message};
        }
    };
    
    // private functions
    var __connected = function(){
        return _tube != null && _tube.connected;
    };

    var __connect = function(url){
        if(__connected()) {
            __log("Already connected check ping ...");
            return true;
        }
        _tube = new Socket;
        if (_tube.open(url)) {
            __log("Connected.");
            return true;
        }
        // not good
        __log("Cant connect to C# server!");
        _tube = null;
        return false;
    };

    var __merge_options = function(opt){
        for(v in opt){
            _opt[v] = opt[v];
        }
    };

    var __log = function(msg){
        if(_logger == null){
            _logger = LoggerFactory.getLogger(_opt.log);
        }
        _logger.log(msg);
    };


    // do init work


    //1:    create idel task for some sort of async management
    //      this task will be activated when there will be async call
    var _asyncTaskCounter = 0;    
    var __registerTask = function(what){
        var _asyncTask = _indesign.idleTasks.add({name: 'CsBridge_idle_task' + _asyncTaskCounter, sleep:0}); // it will not run for now
        
        __log("Async task : " + _asyncTaskCounter + " registered!");

        // add handler closure
        _asyncTask.addEventListener(IdleEvent.ON_IDLE, function(evt){
            __asyncTaskHandler(what, evt);    
        });
        // activate task
        _asyncTask.sleep = 1;

        return what.taskId;
    };
    var __asyncTaskHandler = function(job, evt){
        __log("Async task handler ...");
        evt.parent.sleep = 0; // stop handling task here, putting almost infinite wait
        
        __log("Async task handler ... Start run task " + job.taskId + " ...");
        var ret = job.task();
        __log("Async task handler ... Task done ...");

        // send back status if possible , in case of failed ping it will stop here 
        __log("Async task handler ... Sending result ...");
        var ret = __sendMessage("JsTaskResult", {
            taskId : job.taskId,
            status : ret
        });  
        __log("Async task handler ... Returned ..." + JSON.stringify(ret));
    };
    

    __log("CsBridge Started");


    return ret;
})(app);
 


/* EGAF CODE */
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


// activate new menus
(function(ind)
    // -------------------------------------
    // Install and/or update the menu/submenu and connect
    // the corresponding menu actions if script files are available
{
        var _indesign = ind;
    
    // Settings and constants
    // ---
    var MENU_NAME = "Egaf",
        FEATURES = [
            { caption: "Apri RTF...", fileName: "Scripts%20Panel/file.open.rtf.jsx", subName: "" },
            { caption: "Salva RTF", fileName: "Scripts%20Panel/file.save.rtf.jsx", subName: "" },
            { caption: "Salva RTF nuovo documento", fileName: "Scripts%20Panel/file.save.rtf.new.doc.jsx", subName: "" },
			{ separator: true, subName: "" },
			{ caption: "Inserisci tag figure/categorie...", fileName: "Scripts%20Panel/edit.insert.tags.figcat.js", subName: "" }
        ],
        LO_END = LocationOptions.atEnd,
        INDESIGN_ROOT_MENU = _indesign.menus.item( '$ID/Main' ),
        FEATURE_LOCATION_PATH = (function()
        {
            var f;
            try{ f=_indesign.activeScript; }
            catch(_){ f=File(_.fileName); }
            return f.parent.parent + '/';
        })();
 
    // (Re)set the actions
    // Note: checks also whether script files are available
    // ---
    var    t, f,
        i = FEATURES.length;
    while( i-- )
    {
        t = FEATURES[i];
        if( t.separator ) continue;
 
        if( (f=File(FEATURE_LOCATION_PATH + t.fileName)).exists )
        {
            // The script file exists => create the corresponding action
            // and directly attach the event listener to the file
            // (no need to use _indesign.doScript(...) here)
            // ---
            (t.action = _indesign.scriptMenuActions.add( t.caption )).
                addEventListener('onInvoke', f);
        }
        else
        {
            // The script file does not exist => remove that feature
            // ---
            FEATURES.splice(i,1);
        }
    }
 
    // ---
    // Create/reset the custom menu container *if necessary*
    // Note:  menus/submenus are application-persistent
    // ---
    var    mnu = INDESIGN_ROOT_MENU.submenus.itemByName( MENU_NAME );
    if( !mnu.isValid )
    {
        // Our custom menu hasn't been created yet
        // ---
        if( !FEATURES.length ) return;
        mnu = INDESIGN_ROOT_MENU.submenus.add(
            MENU_NAME,
            LocationOptions.after,
            INDESIGN_ROOT_MENU.submenus.item( '$ID/&Window' )
            );
    }
    else
    {
        // Our custom menu already exists, but we must clear
        // any sub element in order to rebuild a fresh structure
        // ---
        mnu.menuElements.everyItem().remove();
 
        // If FEATURES is empty, remove the menu itself
        // ---
        if( !FEATURES.length ){ mnu.remove(); return; }
    }
 
    // ---
    // Now, let's fill mnu with respect to FEATURES' order
    // (Possible submenus are specified in .subName and created on the fly)
    // ---
    var s,
        n = FEATURES.length,
        subs = {},
        sub = null;
    for( i=0 ; i < n ; ++i )
    {
        t = FEATURES[i];
 
        // Target the desired submenu
        // ---
        sub = (s=t.subName) ?
            ( subs[s] || (subs[s]=mnu.submenus.add( s, LO_END )) ) :
            mnu;
 
        // Connect the related action OR create a separator
        // ---
        if( t.separator )
            sub.menuSeparators.add( LO_END);
        else
            sub.menuItems.add( t.action, LO_END );
    }
})(app);

// JSON
var JSON;if(!JSON){JSON={}}(function(){'use strict';function f(n){return n<10?'0'+n:n}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(a){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(a){return this.valueOf()}}var e=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(b){escapable.lastIndex=0;return escapable.test(b)?'"'+b.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+b+'"'}function str(a,b){var i,k,v,length,mind=gap,partial,value=b[a];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(a)}if(typeof rep==='function'){value=rep.call(b,a,value)}switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null'}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null'}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v}}if(typeof JSON.stringify!=='function'){JSON.stringify=function(a,b,c){var i;gap='';indent='';if(typeof c==='number'){for(i=0;i<c;i+=1){indent+=' '}}else if(typeof c==='string'){indent=c}rep=b;if(b&&typeof b!=='function'&&(typeof b!=='object'||typeof b.length!=='number')){throw new Error('JSON.stringify');}return str('',{'':a})}}if(typeof JSON.parse!=='function'){JSON.parse=function(c,d){var j;function walk(a,b){var k,v,value=a[b];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return d.call(a,b,value)}c=String(c);e.lastIndex=0;if(e.test(c)){c=c.replace(e,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(c.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+c+')');return typeof d==='function'?walk({'':j},''):j}throw new SyntaxError('JSON.parse');}}}());