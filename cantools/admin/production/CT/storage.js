CT.storage={"init":function(opts){if(!CT.storage.opts){CT.storage.opts=CT.merge(opts,{"backend":localStorage,"json":true,"compress":true});if(CT.storage.opts.compress)
CT.require("CT.lib.lz_string",true);}
return CT.storage.opts;},"_jsp":function(s){try{return JSON.parse(s);}catch(err){return null;}},"get":function(key){var opts=CT.storage.init(),val=opts.backend.getItem(key);if(opts.compress)
val=LZString.decompress(val);return opts.json?CT.storage._jsp(val):val;},"set":function(key,val){var opts=CT.storage.init();if(opts.json)
val=JSON.stringify(val);if(opts.compress)
val=LZString.compress(val);opts.backend.setItem(key,val);},"clear":function(){CT.storage.init().backend.clear();}};;