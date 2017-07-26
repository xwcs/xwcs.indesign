using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace xwcs.indesign.js
{
    public class Object
    {
        private string _name;

        protected Object(string n)
        {
            _name = n;
        }

        protected static object[] _(params object[] args)
        {
            return args;
        }

        protected object Call(object[] pms, [CallerMemberName] string fnc = "")
        {
            StringBuilder sbpms = new StringBuilder();
            string sep = "";
            for(int i = 0; i < pms.Length; ++i)
            {
                sbpms.Append(sep).AppendFormat("arguments[{0}]", i);
                sep = ",";
            }
            StringBuilder sb = new StringBuilder(_name).AppendFormat(".{0}({1});", fnc, sbpms);

            return SIndesign.ExecScript(sb.ToString(), pms);
        }
    }

    public class FileManager : Object
    {
        public FileManager() : base("FileManager") { }

        public object open(string path, object data)
        {
            // there is object data marshaling problem so serialize data in json
            return Call(_(path, Newtonsoft.Json.JsonConvert.SerializeObject(data)));
        }
    }

    public class CsBridge : Object
    {
        public CsBridge() : base("CsBridge") { }
        
        public string version()
        {
            return (string)Call(_());
        }
    }
}
