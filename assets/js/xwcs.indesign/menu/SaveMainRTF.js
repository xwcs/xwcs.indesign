/******************************************************************************
 * Copyright (C) 2016-2017 0ics srls <mail{at}0ics.it>
 * 
 * This file is part of xwcs libraries
 * xwcs libraries and all his part can not be copied 
 * and/or distributed without the express permission 
 * of 0ics srls
 *
 ******************************************************************************/
#target "indesign-14"
#targetengine "MB_BridgeRTF"

(
function(br){
    var msg = "";
    var log = br.doAction({
        what:'Log', 
        args:['<<<SaveMainRTF']
    })
    try{
        log = br.doAction({
            what:'Log', 
            args:['<<<FileManager.save_Before']
        })
        var result = FileManager.save(null, false); // save and close
        if(result != null){
            log = br.doAction({
                what:'Log', 
                args:['>>>{"FileManager.save_After": {"meta" : ' + JSON.stringify(result.meta) + '}}']
            })
            // call c# action
            log = br.doAction({
                what:'Log', 
                args:['>>>{"SaveRTF_Before": {"meta" : ' + JSON.stringify(result.meta) + '}}']
            })
            var ret = br.doAction({
                what:'SaveRtf', 
                args:[
                    true, // main
                    result.file.fullName, 
                    JSON.stringify(result.meta)
                ]
            }) || { success : false, msg: "Unhandled error" };
            log = br.doAction({
                what:'Log', 
                args:['>>>SaveRTF_After']
            })

            if(!ret.success){
                // error file will remain open
                msg = "Operazione FALLITA!  [" + ret.msg + "]"
            } else {
                // No error
                FileManager.closeCurrent();
            }
            br.log("C# response: " + JSON.stringify(ret));
        } else {
            log = br.doAction({
                what:'Log', 
                args:['>>>FileManager.save_Fail']
            })
        }
    }catch(e){
        log = br.doAction({
            what:'Log', 
            args:['>>>FileManager.save_Error']
        })
        msg = "Menu Error: " + e;
    }
    if (msg != "") {
        log = br.doAction({
            what:'Log', 
            args:['>>>Fail SaveMainRTF']
        })
        alert(msg)
    } else {
        log = br.doAction({
            what:'Log', 
            args:['>>>Ok SaveMainRTF']
        })

    }
})(CsBridge);
