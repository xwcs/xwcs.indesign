#target "indesign"
#targetengine "session_CsBridge"

(function(br){

    br.log("Eccomi nel menu, chiamo c#");
    try{
        var ret = br.doAction({a:'test', d:'prova'});
        br.log("C# response: " + JSON.stringify(ret));
    }catch(e){
        alert(e);
    }    

})(CsBridge);
