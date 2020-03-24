#target "indesign-14"
#targetengine "MB_BridgeRTF"
(function(br){

  //alert("msg:1");
  br.log("Eccomi nel menu, chiamo libRTF");
  var abstractToSave = [ABSTRACT_SEND(app.activeDocument)];
  br.log("Chiamo c#");
  try{
    var ret = br.doAction(
        {
          what:'SaveAbstract', 
          args: abstractToSave
        }
    );

    /* eventuale risposta
    {
        status: {'OK|ERROR'},
        errmsg: '',
        cmd:'LoadData', 
        data: {
            tipo_iter: 'normativa'
        }
    }
    */

    br.log("C# response: " + JSON.stringify(ret));
    if (ret.success) {
      br.log(ret.data);
      //alert(ret.data);
    } else {
      br.log("C# success: false");
      alert("Richiesta al server fallita");
    }
  }catch(e){
    alert(e);
  }    

})(CsBridge);
