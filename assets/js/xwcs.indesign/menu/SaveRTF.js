/******************************************************************************
 * Copyright (C) 2016-2017 0ics srls <mail{at}0ics.it>
 * 
 * This file is part of xwcs libraries
 * xwcs libraries and all his part can not be copied 
 * and/or distributed without the express permission 
 * of 0ics srls
 *
 ******************************************************************************/
#target "indesign"
#targetengine "session_CsBridge"

(function(br){

    try{
        
        var result = FileManager.save(null, false); // save and close
        if(result != null){
            // call c# action
            var ret = br.doAction({
                what:'SaveRtf', 
                args:[
                    false, // not main
                    result.file.fullName, 
                    JSON.stringify(result.meta)
                ]
            })|| { success : false, msg: "Unhadled error" };

            if(!ret.success){
                // error file will remain open
                alert("Operazione FALITA!  [" + ret.msg + "]");
            } else {
                // No error
                FileManager.closeCurrent();
            }

            br.log("C# response: " + JSON.stringify(ret));
        }
        

    }catch(e){
        alert(e);
    }    

})(CsBridge);
