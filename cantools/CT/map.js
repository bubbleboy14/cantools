/*
This module loads the Google Maps API via CT.scriptImport(),
as well as a utility submodule (CT.map.util) and four classes:

    - CT.map.Map
    - CT.map.Node
    - CT.map.Marker
    - CT.map.Shape
*/

var maplib = "https://maps.googleapis.com/maps/api/js",
	key = CT.getVal("mapkey");
if (key)
	maplib += "?key=" + key;
CT.scriptImport(maplib);
CT.require("CT.map.util");
CT.require("CT.map.Map");
CT.require("CT.map.Node");
CT.require("CT.map.Marker");
CT.require("CT.map.Shape");