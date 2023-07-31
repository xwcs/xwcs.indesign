#targetengine "MB_BridgeRTF"

(function(br){

  br.log("Eccomi nel menu, chiamo DOC_TAG");
    try{
      DOC_TAG(app.activeDocument);
    }catch(e){
        alert(e);
    }    

})(CsBridge);
