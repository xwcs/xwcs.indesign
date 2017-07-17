using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace xwcs.indesign.js
{
    [xwcs.core.cfg.attr.Config("MainAppConfig")]
    public class Composer : core.cfg.Configurable
    {
        private static string _pattern = @"^(?:#include\s+""([^""]+)"")$";
        private MatchEvaluator _evaluator;
        private HashSet<string> _doneFiles = new HashSet<string>();
        private string _currentWorkDir;

        public Composer()
        {
            _evaluator = new MatchEvaluator(m => ComposeInternal(_currentWorkDir, m.Groups[1].Value)); // Includer);
        }

        /// <summary>
        /// read wanted file, and repalce all ocoourences #include "<FileName>"
        /// with file content
        /// and return final composed string 
        /// </summary>
        /// <param name="fName"></param>
        /// <param name="path">if empty composer will take assets default path</param>
        /// <returns></returns>
        public string Compose(string fName, string path = null)
        {
            path = path == null ? core.manager.SPersistenceManager.GetDefaultAssetsPath(core.manager.SPersistenceManager.AssetKind.JavaScript) : path;

            //#if DEBUG
            return ComposeInternal(path, fName);
/* This give not valid script in Indesign ....
#else
            Microsoft.Ajax.Utilities.Minifier m = new Microsoft.Ajax.Utilities.Minifier();
            return m.MinifyJavaScript(ComposeInternal(path, fName)); 
#endif
*/
        }

        private string ComposeInternal(string path, string fName)
        {
            // save current dir, so we can turn it back when we done this file
            string oldCurrentDir = _currentWorkDir;

            try
            {
                string fn = string.Format("{0}{1}{2}", path, Path.DirectorySeparatorChar, fName);

                // check file not done
                if (_doneFiles.Contains(fn))
                {
                    return "// Skipped Cycle: " + fn;
                }
                // new file
                _doneFiles.Add(fn);

                // set curent dir for current file includes, it will be its own path
                _currentWorkDir = Path.GetDirectoryName(fn);
                // process file
                var lines = File
                .ReadLines(fn)
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
            finally
            {
                _currentWorkDir = oldCurrentDir;
            }            
        }

        /*
        public string Includer(Match match)
        {
            return ComposeInternal(_currentWorkDir, match.Groups[1].Value);
        }
        */
    }
}
