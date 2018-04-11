CT.parse={"_linkProcessor":null,"_NUMS":'0123456789',"imgTypes":[".jpg",".JPG",".gif",".GIF",".png",".PNG","jpeg","JPEG"],"setLinkProcessor":function(a){CT.parse._linkProcessor=a;},"breakurl":function(a){return a.replace(/&/g,"&&#8203;").replace(/\//g,"/&#8203;").replace(/_/g,"_&#8203;");},"url2link":function(a,b){var c=a;if(c.slice(0,7)=="http://")a=a.slice(7);else if(c.slice(0,8)=="https://")a=a.slice(8);else c="http://"+c;return '<a target="_blank" href='+c+'>'+(b||CT.parse.breakurl(a))+"</a>";},"processLink":function(a,b){var c=CT.parse.imgTypes,d=a.slice(-4);if(c.indexOf(d)!=-1)return '<img src='+a+'>';for(var e=0;e<c.length;e++)if(a.indexOf(c[e]+"?")!=-1)return '<img src='+a+'>';return CT.parse._linkProcessor&&CT.parse._linkProcessor(a,b)||CT.parse.url2link(a);},"validEmail":function(a){var b=a.indexOf('@',1);var c=a.indexOf('.',b);if(b==-1||c==-1||c==a.length-1||b+2>c)return false;return true;},"validPassword":function(a){return a&&a.length>5;},"numOnly":function(a,b,c){a.onkeyup=function(){var d,e,f="",g=false;for(d=0;d<a.value.length;d++){e=a.value.charAt(d);if(b&&!g&&e==".")g=true;else if(!(!c&&!d&&e=="-")&&(CT.parse._NUMS.indexOf(e)==-1))continue;f+=e;}a.value=f;};return a;},"capitalize":function(a){return a.slice(0,1).toUpperCase()+a.slice(1);},"toCaps":function(a){var b=[];for(var c=0;c<a.length;c++)b.push(CT.parse.capitalize(a[c]));return b;},"key2title":function(a){return CT.parse.toCaps(a.split("_")).join(" ");},"words2title":function(a){return CT.parse.toCaps(a.split(" ")).join(" ");},"keys2titles":function(a){var b=[];for(var c=0;c<a.length;c++)b.push(CT.parse.key2title(a[c]));return b;},"month2num":function(a){return CT.dom._monthnames.indexOf(a)+1;},"extractImage":function(a){var b,c,d=a.replace("<"," <").split(" ");for(b=0;b<d.length;b++){c=d[b];if(c.startsWith("http")&&CT.parse.imgTypes.indexOf(c.slice(-4))!=-1)return c;}},"stripLast":function(a){var b="",c=a.charAt(a.length-1);while(['.',',',':',';',')',']','!'].indexOf(c)!=-1){a=a.slice(0,a.length-1);b=c+b;c=a.charAt(a.length-1);}return [b,a];},"stripToNums":function(a){a=a||"";var b='';for(var c=0;c<a.length;c++)if(CT.parse._NUMS.indexOf(a.charAt(c))!=-1)b+=a.charAt(c);return b;},"stripToZip":function(a){var b=CT.parse.stripToNums(a);if(b.length<5)return "";return b.slice(0,5);},"stripToPhone":function(a){var b=CT.parse.stripToNums(a);if(b.length<10)return "";return b.slice(0,10);},"formatPhone":function(a){var b=CT.parse.stripToPhone(a);return b.slice(0,3)+"-"+b.slice(3,6)+"-"+b.slice(6);},"formatPhoneLink":function(a){var b=CT.parse.formatPhone(a);return "<a href='tel:+1"+b+"'>"+b+"</a>";},"shortened":function(a,b,c,d){if(c){if(d)a=a.split(" http")[0];a=a.split(" ").slice(0,c).join(" ");}b=b||500;return(a.length<b)?a:a.slice(0,b)+' ...';},"sanitize":function(a){var b="<scr"+"ipt";var c="</sc"+"ript>";var d=a.indexOf(b);while(d!=-1){var e=a.indexOf(c,d);if(e==-1)e=a.length;a=a.slice(0,d)+a.slice(e+9,a.length);d=a.indexOf(b);}return a.replace(/^\s+|\s+$/g,"");},"niceNum":function(a){if(a<999)return a;var b=a.toString(),c=b.length-3;while(c>0){b=b.slice(0,c)+","+b.slice(c);c-=3;}return b;},"_countdown":function(a){var b,c,d,e=[];b=~~(a/60);a-=b*60;c=~~(b/60);b-=c*60;d=~~(c/24);c-=d*24;if(d)e.push(d+" days");if(c)e.push(c+" hours");if(b)e.push(b+" minutes");if(a)e.push(~~a+" seconds");return e.join(", ");},"countdown":function(a,b){var c=CT.dom.span(CT.parse._countdown(a));setInterval(function(){a-=1;CT.dom.setContent(c,CT.parse._countdown(a));!a&&b&&b();},1000);return c;},"date2string":function(a,b){a=a||new Date();var c=a.getMonth()+1,d=a.getDate();if(c<10)c='0'+c;if(d<10)d='0'+d;return a.getFullYear()+'-'+c+'-'+d+(b?' ':'T')+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds()+(b?'':'Z');},"string2date":function(a){var b,c,d,e,f,g,h;[b,c,d]=a.split("-");e=d.slice(0,2);if(d.indexOf(":")!=-1){[f,g,h]=d.slice(3).split(":");h=parseInt(h);}return new Date(b,parseInt(c)-1,e,f,g,h);},"_stampString":function(a,b){if(!a)return false;return a+" "+b+(a==1?"":"s");},"_ts_server_offset":0,"set_ts_server_offset":function(a){CT.parse._ts_server_offset=a;},"timeStamp":function(a){var b=new Date();b.setHours(b.getHours()+(b.getTimezoneOffset()/60)-CT.parse._ts_server_offset);var c=new Date(a.replace('T',' ').replace(/-/g,'/')),d=(b-c)/1000,e=~~(d/60),f=~~(e/60),g=~~(f/24);return(CT.parse._stampString(g,"day")||CT.parse._stampString(f,"hour")||CT.parse._stampString(e,"min")||"moments")+" ago";},"process":function(a,b,c){if(!a)return "";var d=a.replace(new RegExp(String.fromCharCode(10),'g'),' ').replace(new RegExp(String.fromCharCode(13),'g'),' ').replace(/</g," <").replace(/>/g,"> ").replace(/&nbsp;/g," ").replace(/  /g,' ');var e=d.match(/\d{3}-\d{3}-\d{4}/g);if(e)e.forEach(function(a){var b=d.indexOf(a);var c=d.charAt(b-1);if(c!=">"&&c!=":"&&d.slice(b-2,b)!="+1")d=d.replace(a,CT.parse.formatPhoneLink(a));});var f=d.trim().split(" ");for(var g=0;g<f.length;g++){var h=f[g];if(h.indexOf(":")==-1&&CT.parse.validEmail(h)){f[g]="<a href='mailto:"+h+"'>"+h+"</a>";continue;}var i=h.indexOf("https://");if(i==-1)i=h.indexOf("http://");if(i!=-1&&h[i-1]!='"'){var j=h.slice(0,i);h=h.slice(i);var k="";var l=h.indexOf('<');if(l!=-1){k=h.slice(l);h=h.slice(0,l);}var m=CT.parse.stripLast(h),n=m[0],h=m[1];f[g]=j+(b?CT.parse.url2link:CT.parse.processLink)(h,c)+n+k;}}return f.join(" ").replace(/ <\//g,"</");}};;