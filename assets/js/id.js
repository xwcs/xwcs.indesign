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

#include "xwcs.indesign/bridge/support.js"

#include "xwcs.indesign/bridge/bridge.js"

#include "xwcs.indesign/bridge/fileman.js"

#include "xwcs.indesign/bridge/menu.js"


// activate new menus
(function(br)
{
    var _br = br;
    
    MenuHelper.addMenus( 
        // name
        "C#",
        // features
        [
            { caption: "Action", fileName: "xwcs.indesign/menu/Action.js", subName: "" },
            { separator: true, subName: "" },
            { caption: "Info", fileName: "xwcs.indesign/menu/About.js", subName: "" }			
        ],
        // INDESIGN_ROOT_MENU 
        _br.Indesign().menus.item( '$ID/Main' ),
        // LO_END
        LocationOptions.atEnd
    );

})(CsBridge);