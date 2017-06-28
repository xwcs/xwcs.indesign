using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using xwcs.core;
using xwcs.core.evt;

namespace xwcs.indesign
{
    public class JsEventBindable
    {
        private Dictionary<string, WeakEventSource<OnMessageEventArgs>> _events = new Dictionary<string, WeakEventSource<OnMessageEventArgs>>();

        protected CmdQueue _commandsQueue = new CmdQueue();

        // JsEventBindable
        public JsEventBindable(object target)
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
