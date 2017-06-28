/*
    Logger factory singleton
*/
var LoggerFactory = (function (ind) {
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
