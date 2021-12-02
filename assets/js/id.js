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

#include "xwcs.indesign/bridge/base64.js"

#include "xwcs.indesign/bridge/support.js"

#include "xwcs.indesign/bridge/bridge.js"

#include "xwcs.indesign/bridge/fileman.js"

#include "xwcs.indesign/bridge/menu.js"

#include "MB_BridgeRTF/libRTF_connect.js"

// activate new menus
(function(br)
{
    var _br = br;
    
    MenuHelper.addMenus( 
        // name
        "BackOffice",
        // features
        [
            //{ caption: "Incolla RTF", fileName: "xwcs.indesign/menu/SaveRTF.js", subName: "" },
            { caption: "Incolla RTF PRINCIPALE", fileName: "xwcs.indesign/menu/SaveMainRTF.js", subName: "" },
            { separator: true, subName: "" },
            { caption: "Opere per NRECORD", fileName: "xwcs.indesign/menu/GetOpereFromNrecord.js", subName: "" },
            //{ separator: true, subName: "" },
            //{ caption: "Trova destinazione della selezione", fileName: "lib.indesign/LoadDataFromDb.js", subName: "" },
            { separator: true, subName: "" },
            { caption: "Prova", fileName: "xwcs.indesign/menu/Action.js", subName: "" },
            { separator: true, subName: "" },
            { caption: "Prepara RTF per tag", fileName: "xwcs.indesign/menu/TagDoc.js", subName: "" },
            { caption: "Salva abstract", fileName: "xwcs.indesign/menu/SaveAbstract.js", subName: "" },
            { separator: true, subName: "" },
            { caption: "Info", fileName: "xwcs.indesign/menu/About.js", subName: "" }		
        ],
        // INDESIGN_ROOT_MENU 
        _br.Indesign().menus.item( '$ID/Main' ),
        // LO_END
        LocationOptions.atEnd
    );
  //Activate context menu from libRTF
  MENU_Installa()
})(CsBridge);