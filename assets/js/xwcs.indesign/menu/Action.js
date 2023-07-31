#targetengine "MB_BridgeRTF"

(function(br){

  br.log("Eccomi nel menu, chiamo c#");
  try{
    //var ret = br.doAction({a:'test', d:'prova'});
    var ret = br.doAction({what:'Prova',args: ['Prova']});
    br.log("C# response: " + JSON.stringify(ret));
    alert("C# response: " + JSON.stringify(ret));
  }catch(e){
    //$.writeln(e);
    alert(e);
  }    

})(CsBridge);
