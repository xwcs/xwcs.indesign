// activate new menus
// -------------------------------------
// Install and/or update the menu/submenu and connect
// the corresponding menu actions if script files are available
var MenuHelper = (function(ind)   
{
    var _indesign = ind;
    var _FEATURE_LOCATION_PATH = "";
    
    var __rootPath = function () {
        if (CsBridge == undefined) {
            alert("Failed CsBridge load!");
            return '';
        } else {
            return CsBridge.options().scriptPath + '/';
        }
    };

    var __work = function (MENU_NAME, FEATURES, INDESIGN_ROOT_MENU, LO_END) {
        _FEATURE_LOCATION_PATH = __rootPath();
        // (Re)set the actions
        // Note: checks also whether script files are available
        // ---
        var t, f, i = FEATURES.length;
        while (i--) {
            t = FEATURES[i];
            if (t.separator) continue;

            if ((f = File(_FEATURE_LOCATION_PATH + t.fileName)).exists) {
                CsBridge.log('Adding menu ... : ' + _FEATURE_LOCATION_PATH + t.fileName);
                // The script file exists => create the corresponding action
                // and directly attach the event listener to the file
                // (no need to use _indesign.doScript(...) here)
                // ---
                (t.action = _indesign.scriptMenuActions.add(t.caption)).
                    addEventListener('onInvoke', f);
            }
            else {
                CsBridge.log('Missing file for menu ... : ' + _FEATURE_LOCATION_PATH + t.fileName);
                // The script file does not exist => remove that feature
                // ---
                FEATURES.splice(i, 1);
            }
        }

        // ---
        // Create/reset the custom menu container *if necessary*
        // Note:  menus/submenus are application-persistent
        // ---
        var mnu = INDESIGN_ROOT_MENU.submenus.itemByName(MENU_NAME);
        if (!mnu.isValid) {
            // Our custom menu hasn't been created yet
            // ---
            if (!FEATURES.length) return;
            mnu = INDESIGN_ROOT_MENU.submenus.add(
                MENU_NAME,
                LocationOptions.after,
                INDESIGN_ROOT_MENU.submenus.item('$ID/&Window')
                );
        }
        else {
            // Our custom menu already exists, but we must clear
            // any sub element in order to rebuild a fresh structure
            // ---
            mnu.menuElements.everyItem().remove();

            // If FEATURES is empty, remove the menu itself
            // ---
            if (!FEATURES.length) { mnu.remove(); return; }
        }

        // ---
        // Now, let's fill mnu with respect to FEATURES' order
        // (Possible submenus are specified in .subName and created on the fly)
        // ---
        var s,
            n = FEATURES.length,
            subs = {},
            sub = null;
        for (i = 0 ; i < n ; ++i) {
            t = FEATURES[i];

            // Target the desired submenu
            // ---
            sub = (s = t.subName) ?
                (subs[s] || (subs[s] = mnu.submenus.add(s, LO_END))) :
                mnu;

            // Connect the related action OR create a separator
            // ---
            if (t.separator)
                sub.menuSeparators.add(LO_END);
            else
                sub.menuItems.add(t.action, LO_END);
        }
    };


    // public 
    return {
        addMenus: function (name, features, root, lo_end) {
            __work(name, features, root, lo_end);
        }
    };
    
})(app);
