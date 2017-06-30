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

        public object open(string path, int iterId)
        {
            return Call(_(path, iterId));
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
