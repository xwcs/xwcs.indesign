using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace xwcs.indesign
{
    namespace json
    {
        public enum DataKind
        {
            Ping = 0,       // ping
            Event = 1,      // js event notify dono later on C#
            Action = 2,      // sync code execution, routin must not touch InDesign DOM!!!!!
            TaskResult = 3   // result of soem async task
        }


        public class Message
        {
            public int id { get; set; }
            public BaseData data { get; set; }
        }

        [JsonConverter(typeof(core.json.JsonSubtypes), "DataKindType")]
        [core.json.JsonSubtypes.KnownSubType(typeof(JsPing), DataKind.Ping)]
        [core.json.JsonSubtypes.KnownSubType(typeof(JsEvent), DataKind.Event)]
        [core.json.JsonSubtypes.KnownSubType(typeof(JsAction), DataKind.Action)]
        [core.json.JsonSubtypes.KnownSubType(typeof(JsTaskResult), DataKind.TaskResult)]
        public class BaseData
        {
            public DataKind DataKindType { get; set; }
        }

        public class JsPing : BaseData
        {

        }

        public class JsAction : BaseData
        {
            public string what { get; set; }
            public object[] args { get; set; }
        }

        /*
            bubbles : evt.bubbles,
            cancelable : evt.cancelable,
            defaultPrevented: evt.defaultPrevented,
            eventType: evt.eventType,
            id: evt.id,
            index: evt.index,
            isValid: evt.isValid,
            propagationStopped: evt.propagationStopped,
            timeStamp: evt.timeStamp
            currentTargetID: evt.currentTarget.id,
            parentID: evt.parent.id,
            targetID: evt.target.id,
            eventKind: eventKind

         */
        public class JsEvent : BaseData
        {
            public bool bubbles { get; set; }
            public bool cancelable { get; set; }
            public bool defaultPrevented { get; set; }
            public string eventType { get; set; }
            public int id { get; set; }
            public int index { get; set; }
            public bool isValid { get; set; }
            public bool propagationStopped { get; set; }
            public DateTime timeStamp { get; set; }
            public int currentTargetID { get; set; }
            public int parentID { get; set; }
            public int targetID { get; set; }
            public string eventKind { get; set; }
        }

        /*
         * taskId : what.taskId,
            status : ret
         */
        public class JsTaskResult : BaseData
        {
            public int taskId { get; set; }
            public bool status { get; set; }
        }
    }
}





