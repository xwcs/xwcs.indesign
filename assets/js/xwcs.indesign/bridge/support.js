/******************************************************************************
 * Copyright (C) 2016-2017 0ics srls <mail{at}0ics.it>
 * 
 * This file is part of xwcs libraries
 * xwcs libraries and all his part can not be copied 
 * and/or distributed without the express permission 
 * of 0ics srls
 *
 ******************************************************************************/
#include "json2_min.js"

// global features
Object.prototype.MakeClone = function(obj){
  var str = JSON.stringify(obj, function(k,v){
    // handle enums, enumerable implicitly converted to string will return number, but toString return string value
    try{
      if((v + '') !=  v.toString()){
        return  v.toString(); 
      }
    }catch(e){}
       
    // skip parent 
    return  (k == 'parent') ? undefined : v;
  });
  return JSON.parse(str);
}

/*
    Logger factory singleton
*/
var LoggerFactory = (function (ind) {
  var _indesign = ind;

  var ret = {
    getLogger : function(path){
      return __openLogger(Folder.temp + '/' + path);
    }
  };

    

  var __openLogger = function (path){
        
    return {
      log : function(msg){
        var f = new File(path);
        f.open("e");
        f.seek(0, 2);

        var d = new Date();
        f.writeln(
            ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
            d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2)+ ":" + ("0" + d.getSeconds()).slice(-2)
        + " " + msg);
                
        f.close();
      }            
    };
  };

  return ret;
})(app);