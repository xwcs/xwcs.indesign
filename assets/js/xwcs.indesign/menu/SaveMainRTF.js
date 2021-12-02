/******************************************************************************
 * Copyright (C) 2016-2017 0ics srls <mail{at}0ics.it>
 * 
 * This file is part of xwcs libraries
 * xwcs libraries and all his part can not be copied 
 * and/or distributed without the express permission 
 * of 0ics srls
 *
 ******************************************************************************/
#targetengine "MB_BridgeRTF"

(
function(br){
    try{
        var result = FileManager.save(null, false); // save and close
        if(result != null){
            // call c# action
            var ret = br.doAction({
                what:'SaveRtf', 
                args:[
                    true, // main
                    result.file.fullName, 
                    JSON.stringify(result.meta)
                ]
            }) || { success : false, msg: "Unhandled error" };

            

            if(!ret.success){
                // error file will remain open
                alert("Operazione FALLITA!  [" + ret.msg + "]");
            } else {
                // No error
                FileManager.closeCurrent();
            }
            br.log("C# response: " + JSON.stringify(ret));
        }
        

    }catch(e){
        alert("Menu Error: " + e);
    }    

})(CsBridge);
