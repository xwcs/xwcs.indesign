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
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using xwcs.core;
using xwcs.core.evt;

namespace xwcs.indesign.js
{
    public class EventBindable
    {
        private Dictionary<string, WeakEventSource<OnMessageEventArgs>> _events = new Dictionary<string, WeakEventSource<OnMessageEventArgs>>();

        protected CmdQueue _commandsQueue = new CmdQueue();

        // JsEventBindable
        public EventBindable(object target)
        {
            Target = target;
            TargetId = (int)this["Id"];
        }

        // forward props
        public object this[string propertyName]
        {
            get {
                try
                {
                    return DispatchUtility.Invoke(Target, propertyName, null);
                }
                catch (Exception)
                {
                    throw new ApplicationException(string.Format("Missing property : {0}", propertyName));
                }                
            }
        }

        public void AddEventHandler(string eventKind, EventHandler<OnMessageEventArgs> handler)
        {
            Monitor.Enter(_events);
            WeakEventSource<OnMessageEventArgs> es;
            if(!_events.TryGetValue(eventKind, out es)) es = new WeakEventSource<OnMessageEventArgs>();

            // hook Indesign JS
            SIndesign.ExecScript("CsBridge.addEventHandler(arguments[0], 'beforeInvoke');", new object[] { Target });
            
            es.Subscribe(handler);
            _events[eventKind] = es; 
            Monitor.Exit(_events);
        }

        public void RemoveEventHandler(string eventKind, EventHandler<OnMessageEventArgs> handler)
        {
            Monitor.Enter(_events);
            WeakEventSource<OnMessageEventArgs> es;
            if (!_events.TryGetValue(eventKind, out es)) return;
            es.Unsubscribe(handler);
            Monitor.Exit(_events);
        }

        public void RaiseEvent(string eventKind, OnMessageEventArgs args)
        {
            Monitor.Enter(_events);
            WeakEventSource<OnMessageEventArgs> es;
            if (!_events.TryGetValue(eventKind, out es)) return;
            _commandsQueue.ExecuteLater(() => es.Raise(this, args));
            Monitor.Exit(_events);
        }

        // JsEvent object id
        public int TargetId { get; private set; }
        public object Target { get; private set; }
    }
}
