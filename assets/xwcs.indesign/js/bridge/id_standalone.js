#target "indesign"
#targetengine "session_CsBridge"
var arguments = [
    'indesign.log',
    (function () {
        var f;
        try{ f=_indesign.activeScript; }
        catch(_){ f=File(_.fileName); }
        alert(f.parent + '/');
        return f.parent + '/';
    })()
];
#include "id.js"