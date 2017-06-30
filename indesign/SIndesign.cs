/******************************************************************************
 * Copyright (C) 2016-2017 0ics srls <mail{at}0ics.it>
 * 
 * This file is part of xwcs libraries
 * xwcs libraries and all his part can not be copied and/or distributed without the express
 * permission of 0ics srls
 * 
 * Every part of the software released under open source licenses
 * will be used in and redistributed 
 * under the terms provided in each of such licenses.
 * 
 *  To prove that you are entitled to use the software licensed,
 * you may be required to show a copy of the explicit 
 * authorization sent by email from 0ics srls
 * as a result of your request.
 ******************************************************************************/
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using InDesign;
using xwcs.core.evt;
using System.IO;
using xwcs.core;
using System.Threading;
using xwcs.indesign.js;

namespace xwcs.indesign
{
    // this will watch for async task result
    public class TaskResultHandler
    {
        private bool? _result = null;
        private int _timeout = 10000; // default 10 sec
        private int _taskId;
        private Thread _t;

        private readonly object _lock = new object();

        public TaskResultHandler(int taskId, int timeout = 10000)
        {
            _taskId = taskId;
            _timeout = timeout;
        }

        public bool? Result {
            get {
                lock (_lock)
                {
                    return _result;
                }
            }
            set
            {
                lock (_lock)
                {
                    _result = value;
                }
            }
        }

        private void watch()
        {
            while (_timeout > 0)
            {
                lock (_lock)
                {
                    if (_result.HasValue)
                        break;
                }

                Thread.Sleep(1);
                _timeout -= 1;
            }
            if (!_result.HasValue)
            {
                _wes_OnTimeout?.Raise(this, new EventArgs());
                return;
            }
            if (_result.Value)
            {
                _wes_OnDone?.Raise(this, new EventArgs());
                return;
            }

            _wes_OnFail?.Raise(this, new EventArgs());
        }

        // this will check value each 10 milisecs
        public void Check()
        {
            _t = new Thread(new ThreadStart(watch));
            _t.Start();
        }

        public void Abort()
        {
            _t.Abort();
            _t.Join();
        }

        private WeakEventSource<EventArgs> _wes_OnFail = null;
        public event EventHandler<EventArgs> OnFail
        {
            add
            {
                if (_wes_OnFail == null)
                {
                    _wes_OnFail = new WeakEventSource<EventArgs>();
                }
                _wes_OnFail.Subscribe(value);
            }
            remove
            {
                _wes_OnFail?.Unsubscribe(value);
            }
        }

        private WeakEventSource<EventArgs> _wes_OnDone = null;
        public event EventHandler<EventArgs> OnDone
        {
            add
            {
                if (_wes_OnDone == null)
                {
                    _wes_OnDone = new WeakEventSource<EventArgs>();
                }
                _wes_OnDone.Subscribe(value);
            }
            remove
            {
                _wes_OnDone?.Unsubscribe(value);
            }
        }

        private WeakEventSource<EventArgs> _wes_OnTimeout = null;
        public event EventHandler<EventArgs> OnTimeout
        {
            add
            {
                if (_wes_OnTimeout == null)
                {
                    _wes_OnTimeout = new WeakEventSource<EventArgs>();
                }
                _wes_OnTimeout.Subscribe(value);
            }
            remove
            {
                _wes_OnTimeout?.Unsubscribe(value);
            }
        }
    }

    


    [xwcs.core.cfg.attr.Config("MainAppConfig")]
    public class SIndesign : core.cfg.Configurable, IDisposable
    {
        private static xwcs.core.manager.ILogger _logger = core.manager.SLogManager.getInstance().getClassLogger(typeof(SIndesign));

        private static readonly object _lock = new object();

        // map of JsEventBindables
        private Dictionary<int, EventBindable> _bindables = new Dictionary<int, EventBindable>();

        // indesign
        private InDesign._Application _app = null;

        //socket server
        private AsyncSocketService _server = null;

        // some later execution
        protected CmdQueue _commandsQueue = new CmdQueue();

        // async task results
        // when wee call async indesign it will return task id
        // and when it will do it we can find here result
        private Dictionary<int, TaskResultHandler> _taskResults = new Dictionary<int, TaskResultHandler>();

        public string InDesignLogPath { get; private set; }
        public string InDesignScriptsPath { get; private set; }


        // JS API
        private static FileManager _FileManager = null;
        public static FileManager FileManager
        {
            get
            {
                if(ReferenceEquals(null, _FileManager))
                {
                    _FileManager = new FileManager();
                }
                return _FileManager;
            }
        }


        #region singleton
        private static SIndesign instance;

        //singleton need private ctor
        private SIndesign()
        {
            InDesignLogPath = xwcs.core.manager.SPersistenceManager.getInstance().TemplatizePath(getCfgParam("Indesign/LogFile", ""));
            InDesignScriptsPath = xwcs.core.manager.SPersistenceManager.getInstance().TemplatizePath(getCfgParam("Indesign/ScriptDir", ""));
        }

        [MethodImpl(MethodImplOptions.Synchronized)]
        public static SIndesign getInstance()
        {
            if (instance == null)
            {
                instance = new SIndesign();
            }
            return instance;
        }

        public static void Start()
        {
            lock (_lock)
            {
                if (instance == null)
                {
                    instance = new SIndesign();
                }
            }
            instance.ResetApp();
        }
        #endregion

        public static _Application App
        {
            get
            {
                lock (_lock)
                {
                    if (instance == null)
                    {
                        instance = new SIndesign();
                    }
                }

                if (ReferenceEquals(null, instance._app))
                {
                    instance.ResetApp();
                }

                // check if app is on
                try
                {
                    // if indesign is down this go in exception
                    string tmp = instance._app.FullName;
                }
                catch (Exception e)
                {
                    if (e is System.Runtime.InteropServices.COMException && e.HResult == unchecked((int)0x800706ba))
                    {
                        instance.ResetApp();
                    }
                    else
                    {
                        // not managed exception type , forward it
                        throw;
                    }
                }

                return instance._app;
            }
        }

        #region events
        private static WeakEventSource<EventArgs> _wes_AfterInit = null;
        public static event EventHandler<EventArgs> AfterInit
        {
            add
            {
                if (_wes_AfterInit == null)
                {
                    _wes_AfterInit = new WeakEventSource<EventArgs>();
                }
                _wes_AfterInit.Subscribe(value);
            }
            remove
            {
                _wes_AfterInit?.Unsubscribe(value);
            }
        }

        private static WeakEventSource<OnMessageEventArgs> _wes_OnJsAction = null;
        public static event EventHandler<OnMessageEventArgs> OnJsAction
        {
            add
            {
                if (_wes_OnJsAction == null)
                {
                    _wes_OnJsAction = new WeakEventSource<OnMessageEventArgs>();
                }
                _wes_OnJsAction.Subscribe(value);
            }
            remove
            {
                _wes_OnJsAction?.Unsubscribe(value);
            }
        }
        #endregion


        public static EventBindable GetJsBindable(object target)
        {
            EventBindable jeb = new EventBindable(target);
            // check if we have it
            EventBindable trg;
            if (instance._bindables.TryGetValue(jeb.TargetId,  out trg))
            {
                // found
                return trg;
            }else
            {
                instance._bindables[jeb.TargetId] = jeb;
                return jeb;
            }
        }

        private object ExecScriptInternal(_Application a, string script, params object[] pms)
        {
            try
            {
                return a.DoScript(
                    string.Format(@"
                        #target 'indesign';
                        #targetengine 'session_CsBridge';
                        {0}", script),
                    global::InDesign.idScriptLanguage.idJavascript,
                    pms
                );
            }catch(Exception e)
            {
                throw new ApplicationException(string.Format("Javascript error : {0}", e.Message));    
            }            
        }

        public static object ExecScript(string script, params object[] pms)
        {
            return instance.ExecScriptInternal(App, script, pms);
        }

        /// <summary>
        /// Reset all data and reinit InDesign
        /// </summary>
        private void ResetApp()
        {
            // reset server
            if (ReferenceEquals(_server, null))
            {
                // make server
                int port = int.Parse(getCfgParam("Indesign/CshpServerPort", "0"));
                _server = new AsyncSocketService(port);

                // register to message
                _server.OnMessage += _server_OnMessage;

                _server.RunAsync();
            }

            // reset chached data
            _bindables.Clear();


            // recreate
            Type type = Type.GetTypeFromProgID("InDesign.Application.CS6", true);
            _app = (_Application) Activator.CreateInstance(type, true);

            string ver = (string)(ExecScriptInternal(_app, @"
                                try {
                                    ver = CsBridge.version();
                                }catch(e){
                                    error = e.message;
                                }",
                                new object[] { }) ?? "");
            if (ver != "1.0.7")
            {

                // load script
                string scr = new Composer().Compose("id.js", core.manager.SPersistenceManager.getInstance().GetDefaultAssetsPath(typeof(SIndesign), core.manager.SPersistenceManager.AssetKind.Any) + "\\js\\bridge");
#if DEBUG_TRACE_LOG_ON
                _logger.Debug("Script: {0}", scr.Substring(0, 512));
#endif
                // here we need also 3 options for to have paths
                _app.DoScript(
                    scr,
                    global::InDesign.idScriptLanguage.idJavascript,
                    new object[] {
                        InDesignLogPath,
                        InDesignScriptsPath
                    }
                );
            }


            // connect to c# server
            if ((bool)(ExecScriptInternal(_app, @"
                        CsBridge.open({
                                url:arguments[0]
                        });
                ", new object[] {
                    _server.Url
                }) ?? false))
            {
                _PingCounter = 100;
                _commandsQueue.ExecuteLater(DoPing);
            }else
            {
                throw new ApplicationException("Connection from Indesign failed!");
            }
        }

        private int _PingCounter = 100;
        
        private void DoPing()
        {
            _logger.Debug("Ping: {0}", _PingCounter);

            int taskid = (int)(ExecScriptInternal(_app, "CsBridge.runAsync(CsBridge.ping);", new object[] { }) ?? -1);
            if(taskid >= 0)
            {
                // good task
                TaskResultHandler th = new TaskResultHandler(taskid);
                _taskResults[taskid] = th;
                th.OnDone += Th_OnDone; 
                th.OnFail += Th_OnFail;
                th.OnTimeout += (s, e) => {
                    _logger.Debug("Task timeout!");
                    // remove task
                    _taskResults.Remove(taskid);
                    throw new ApplicationException("Problem with InDesig ping!");
                };
                th.Check(); // start internal thread
            }
            else
            {
                throw new ApplicationException("Asyn exec problem!");
            }
        }

        private void Th_OnDone1(object sender, EventArgs e)
        {
            throw new NotImplementedException();
        }

        private void Th_OnDone(object sender, EventArgs e)
        {
            _logger.Debug("Task done!");
            _commandsQueue.ExecuteLater(RaiseAfterInit);
        }

        private void Th_OnFail(object sender, EventArgs e)
        {
            _logger.Debug("Task fail!");
            if(--_PingCounter > 0)
            {
                _commandsQueue.ExecuteLater(DoPing);
                return;
            }

            throw new ApplicationException("Problem with InDesig ping!");
        }


        private void RaiseAfterInit()
        {
            _wes_AfterInit?.Raise(this, new EventArgs());
        }

        private void _server_OnMessage(object sender, OnMessageEventArgs e)
        {
            if(e.Message.data is js.json.JsAction)
            {
                // do action
                _wes_OnJsAction?.Raise(this, e);
            }
            else if (e.Message.data is js.json.JsTaskResult)
            {
                TaskResultHandler th;
                if(_taskResults.TryGetValue((e.Message.data as js.json.JsTaskResult).taskId, out th))
                {
                    th.Result = (e.Message.data as js.json.JsTaskResult).status;
                    _taskResults.Remove((e.Message.data as js.json.JsTaskResult).taskId);
                }else
                {
                    throw new ApplicationException(string.Format("Missing task {0}", (e.Message.data as js.json.JsTaskResult).taskId));
                }
            }
            else if(e.Message.data is js.json.JsEvent)
            {
                // find Target
                EventBindable trg;
                if(_bindables.TryGetValue((e.Message.data as js.json.JsEvent).currentTargetID, out trg))
                {
                    trg.RaiseEvent((e.Message.data as js.json.JsEvent).eventKind, e);
                }else
                {
                    throw new ApplicationException(string.Format("Missing event target with id = {0}", (e.Message.data as js.json.JsEvent).currentTargetID));
                }
            }
        }

        #region IDisposable Support
        private bool disposedValue = false; // To detect redundant calls

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    if(_app != null)
                    {
                        try
                        {
                            _app.Quit();
                        }
                        catch (Exception e)
                        {
                            {
                                if (!(e is System.Runtime.InteropServices.COMException && e.HResult == unchecked((int)0x800706ba)))
                                {
                                    // not managed exception type , forward it
                                    throw;
                                }
                            }
                        }
                       
                    }
                    // kill eventual task handlers
                    foreach(TaskResultHandler a in _taskResults.Values)
                    {
                        a.Abort();
                    }
                }

                // TODO: free unmanaged resources (unmanaged objects) and override a finalizer below.
                // TODO: set large fields to null.

                disposedValue = true;
            }
        }

        // TODO: override a finalizer only if Dispose(bool disposing) above has code to free unmanaged resources.
        // ~SIndesign() {
        //   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
        //   Dispose(false);
        // }

        // This code added to correctly implement the disposable pattern.
        public void Dispose()
        {
            // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
            Dispose(true);
            // TODO: uncomment the following line if the finalizer is overridden above.
            // GC.SuppressFinalize(this);
        }
        #endregion
    }
}
