/*
    CsBridge singleton
*/

var CsBridge = (function (ind, opt) {
    // this will help mantain C# <-> IND compatibility
    const _CsBridge_version = '1.0.7';

    // private closure
    var _indesign = ind;

    /// @Socket
    var _tube = null;

    /// @Logger
    var _logger = null;

    // arrive from id_standalone.js or as DoScript params from C#
    var _opt = opt;

    var _listenersMap = {};

    /*
        map of elements
        {
            sender : <sender>
            kind: <event kind>
        }
    */
    var _handlers = new Object();


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
            __log("Connected ... reopen ...");
            _tube.close();
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
        _logger.log("CsBridge : " + msg);
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
    
    // some message
    __log("CsBridge Started (" + _CsBridge_version + ")");

    // return public interface
    return {
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
        options: function () {
            return _opt;
        }
    };
})(
    app,
    // options overwrite
    {
        url: '',
        log: arguments[0],
        scriptPath: arguments[1]
    }
);