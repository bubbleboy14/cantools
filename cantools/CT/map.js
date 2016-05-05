/*
This module loads the Google Maps API via CT.scriptImport(),
as well as a utility submodule (CT.map.util) and four classes:

    - CT.map.Map
    - CT.map.Node
    - CT.map.Marker
    - CT.map.Shape
*/

CT.scriptImport("https://maps.googleapis.com/maps/api/js");
CT.require("CT.map.util");
CT.require("CT.map.Map");
CT.require("CT.map.Node");
CT.require("CT.map.Marker");
CT.require("CT.map.Shape");