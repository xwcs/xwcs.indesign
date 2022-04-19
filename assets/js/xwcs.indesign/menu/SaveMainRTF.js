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
    br.doAction({
        what:'Log', 
        args:['<<<SaveMainRTF']
    })
    try{
        br.doAction({
            what:'Log', 
            args:['<<<Before FileManager.save']
        })
        var result = FileManager.save(null, false); // save and close
        if(result != null){
            br.doAction({
                what:'Log', 
                args:['>>>"After_FileManager.save": {' + JSON.stringify(result.meta) + '}']
            })
            // call c# action
            br.doAction({
                what:'Log', 
                args:['<<<Before_SaveRTF']
            })
            var ret = br.doAction({
                what:'SaveRtf', 
                args:[
                    true, // main
                    result.file.fullName, 
                    JSON.stringify(result.meta)
                ]
            }) || { success : false, msg: "Unhandled error" };
            br.doAction({
                what:'Log', 
                args:['>>>After SaveRTF']
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
            br.doAction({
                what:'Log', 
                args:['>>>Fail FileManager.save']
            })
        }
    }catch(e){
        br.doAction({
            what:'Log', 
            args:['>>>Error FileManager.save']
        })
        msg = "Menu Error: " + e;
    }
    if (msg != "") {
        br.doAction({
            what:'Log', 
            args:['>>>Fail SaveMainRTF']
        })
        alert(msg)
    } else {
        br.doAction({
            what:'Log', 
            args:['>>>Ok SaveMainRTF']
        })

    }
})(CsBridge);
