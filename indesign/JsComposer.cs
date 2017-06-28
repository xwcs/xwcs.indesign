using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace xwcs.indesign
{
    [xwcs.core.cfg.attr.Config("MainAppConfig")]
    public class JsComposer : core.cfg.Configurable
    {
        private static string _pattern = @"^(?:#include\s+""([^""]+)"")$";
        private MatchEvaluator _evaluator;
        private static HashSet<string> _doneFiles = new HashSet<string>();
        private string _currentWorkDir;

        public JsComposer()
        {
            _evaluator = new MatchEvaluator(Includer);
        }

        /// <summary>
        /// read wanted file, and repalce all ocoourences #include "<FileName>"
        /// with file content
        /// and return final composed string 
        /// </summary>
        /// <param name="fName"></param>
        /// <param name="path">if empty composer will take assets default path</param>
        /// <returns></returns>
        public string Compose(string fName, string path = "")
        {
            _currentWorkDir = path;

            return ComposeInternal(fName);            
        }        

        private string ComposeInternal(string fName)
        {
            try
            {
                var lines = File
                .ReadLines(string.Format("{0}\\{1}", _currentWorkDir, fName))
                .Select(l => Regex.Replace(l, _pattern, _evaluator));
                return string.Join("\r\n", lines);
            }
            catch (Exception e)
            {
                return string.Format(@"
/*
    Error: {0}
*/
                ", e.Message);
            }            
        }

        public string Includer(Match match)
        {
            string fName = match.Groups[1].Value;

            if (_doneFiles.Contains(fName))
            {
                // we skip it, just comment include
                return "//" + match.Value;
            }else
            {
                _doneFiles.Add(fName);
                return ComposeInternal(fName);
            }
        }
    }
}
