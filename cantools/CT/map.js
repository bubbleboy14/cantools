/*
This module loads the Google Maps API via CT.scriptImport(),
as well as a utility submodule (CT.map.util) and five classes:

    - CT.map.Map
    - CT.map.Node
    - CT.map.Marker
    - CT.map.Shape
    - CT.map.Panorama

To facilitate key injection, we recommend loading this module
dynamically, like so:

    CT.setVal("mapkey", MY_MAP_KEY);
    CT.require("CT.map", true);
*/

var key = CT.getVal("mapkey");
CT.scriptImport("https://maps.googleapis.com/maps/api/js" + (key ? "?key=" + key : ""));
CT.require("CT.map.util");
CT.require("CT.map.Map");
CT.require("CT.map.Node");
CT.require("CT.map.Marker");
CT.require("CT.map.Shape");
CT.require("CT.map.Panorama");