/*
 * Copyright (c) 2012-2026 Wolfram Schneider, https://bbbike.org
 * Copyright (c) 2011 Geofabrik GmbH, https://geofabrik.de
 *
 * BSD 2-clause license ("Simplified BSD License" or "FreeBSD License")
 * see ./COPYRIGHT.txt
 *
 */

/* run JavaScript code in strict mode, HTML5 */
"use strict";


// MapCompare config
var mc = {
    // Berlin downtown
    pos: {
        "lng": 13.38885,
        "lat": 52.51703,
        "zoom": 11
    },

    // debug
    debug: 0,

    // 0: none, 1: one line, 2: all message
    // number of maps, by default 2 maps are displayed in a table
    // up to 8 are supported
    NumberOfMaps: 3,

    // if set to zero, display all maps
    NumberOfMapsMax: 0,
    // always show N maps links
    NumberOfMapsLinks: 8,
    // open a 3rd row for more than N maps
    row3: 10,
    // open a 4rd row for more than N maps
    row4: 21,
    // open a 5rd row for more than N maps
    row5: 32,

    // pre-selected maps in columns
    mt: ['mapnik-german', 'cyclemap', 'tomtom-basic', // 1..4
    'esri-topo', 'google-map' // 5..8
    ],

    // preferences expire after N days
    preferences_expire: 180,
    // map sorting options
    sort: {
        name: 1,
        // by map name
        type: 0,
        // by map type
        bbbike: 1,
        // 0: none, 1: bbbike first
        osm: 1 // 0: none, 1: osm first/second
    },

    sort_overlay: {
        name: 1,
        opacity: 1
    },

    // with social links in footer
    social: true,

    // display mapname on map in full screen mode
    mapname_fullscreen: true,

    // responsive design is configured in css/mobile.css 
    responsive: {
        enabled: true,
        NumberOfMaps: 2,
        maxHeight: 690
    },

    // transparent overlay maps
    overlay: {
        enabled: true,
        type: "slider",
        /* select | slider */

        value: 70,
        /* in percent */
        select_step: 10,
        slider_step: 5,

        // pre-selected overlay
        mt_overlay: ['none']
    },

    choose_map_type_message: false,

    search: {
        type: 'nominatim',
        max_zoom: 16,
        show_marker: true,
        viewbox: true,
        limit: 25,
        marker_permalink: true,
        user_agent: "mc.bbbike.org",
        paging: 5
    },

    numZoomLevels: 20
};


/*
   configure profiles

   can be used as short URLs: /mc/?profile=tomtom


 */
var profile = {
    tomtom: {
        mt: ['tomtom-basic', 'tomtom-sat', 'tomtom-hybrid', 'tomtom-basic-night', 'tomtom-labels', 'tomtom-hillshade'],
        pos: {
            lon: 4.909426,
            lat: 52.377262,
            zoom: 15
        }
    },
    google: {
        mt: ['google-map', 'google-map-mapmaker', 'google-physical', 'google-bicycle-map', 'google-satellite', 'google-hybrid', 'google-hybrid-mapmaker', 'google-weather-sat', 'google-traffic-map', 'google-transit-map', 'google-layers-physical', 'google-streetview']
    },
    apple: {
        mt: ['apple-iphoto']
    },
    satellite: {
        mt: ['tomtom-sat', 'yandex-satellite', 'google-satellite'],
        // Peking
        pos: {
            lon: 116.39077,
            lat: 39.917253,
            zoom: 15
        },
    },
    mapnik: {
        mt: ['mapnik', 'mapnik-german', 'osmfr'],
        pos: {
            lon: 13.406874,
            lat: 52.519276,
            zoom: 15
        }
    },
    transit: {
        mt: ['sbahnberlin-standard', 'public_transport', 'thunderforest-transport', 'thunderforest-transport-dark', 'thunderforest-pioneer', 'openrailwaymap-standard', 'openrailwaymap-maxspeed', 'allrailmap-standard', 'oepnv-brandenburg', 'google-transit-map']
    },
    openrailwaymap: {
        mt: ['openrailwaymap-standard', 'openrailwaymap-maxspeed', 'openrailwaymap-signalling', 'openrailwaymap-electrification', 'openrailwaymap-gauge', 'mapnik-german'],
        pos: {
            lon: 8.467,
            lat: 49.489,
            zoom: 13
        }
    },
    osm: {
        mt: ['mapnik', 'mapnik-german', 'stamen-toner', 'stamen-watercolor', 'thunderforest-cyclemap', 'thunderforest-transport', 'public_transport', 'wanderreitkarte', 'skobbler-lite']
    },
    cycle: {
        mt: ['thunderforest-cyclemap', 'cyclosm', 'bbbike-bbbike', 'bbbike-smoothness']
    },
    bbbike: {
        mt: ['bbbike-bbbike', 'bbbike-smoothness', 'bbbike-handicap', 'bbbike-cycle-routes', 'bbbike-cycleway', 'bbbike-green', 'bbbike-unlit', 'bbbike-unknown']
    },
    topo: {
        mt: ['esri-topo', 'esri', 'thunderforest-cyclemap', 'thunderforest-landscape', 'tracestrack-topo', 'wanderreitkarte', 'maptoolkit-topo', 'opentopomap', 'opensnowmap', 'thunderforest-outdoors', 'google-physical', 'google-layers-physical', 'mtbmap'],
        pos: {
            zoom: 11,
            lon: 11.35474,
            lat: 46.498478
        }
    },
    germany: {
        mt: ['mapnik-german', 'thunderforest-transport', 'tomtom-basic', 'google-map'],
        pos: {
            zoom: 5,
            lon: 13.398604,
            lat: 52.520543
        },
    },
    esri: {
        mt: ['esri', 'esri-topo', 'esri-gray', 'esri-satellite', 'esri-physical', 'esri-shaded-relief', 'esri-terrain-base', 'esri-boundaries-places', 'esri-reference-overlay', 'esri-transportation', 'esri-natgeo', 'esri-ocean']
    },
    boundaries: {
        mt: ['esri-boundaries-places'],
        pos: {
            lon: 13.38885,
            lat: 52.51703,
            zoom: 12
        }
    },
    geodatenzentrum: {
        mt: ['geodatenzentrum-color', 'geodatenzentrum-topplusopen', 'geodatenzentrum-grey', 'geodatenzentrum-combshade', 'geodatenzentrum-colordem', 'geodatenzentrum-hillshade']
    },
    geofabrik: {
        mt: ['geofabrik-standard', 'geofabrik-german', 'geofabrik-basic-color', 'geofabrik-basic-greys', 'geofabrik-basic-pastels', 'geofabrik-topo', 'geofabrik-optitool']
    },
    clockwork: {
        mt: ['clockwork-streets', 'clockwork-topo', 'mapnik', 'clockwork-terrain-hillshade', 'clockwork-terrain-slope', 'clockwork-terrain-aspect', 'clockwork-terrain-raw'],
        pos: {
            lon: -122.32730,
            lat: 47.56662,
            zoom: 12
        }
    },
    retina: {
        mt: ['thunderforest-cyclemap', 'thunderforest-transport', 'tracestrack-topo', 'skobbler-day', 'openrailwaymap-standard', 'google-map']
    },
    skobbler: {
        mt: ['skobbler-day', 'skobbler-lite', 'skobbler-outdoor', 'skobbler-night']
    },
    tracestrack: {
        mt: ['tracestrack-lang-default', 'tracestrack-lang-en', 'tracestrack-topo', 'mapnik']
    },
    waymarkedtrails: {
        mt: ['waymarkedtrails-hiking', 'waymarkedtrails-cycling', 'waymarkedtrails-mtb', 'waymarkedtrails-skating', 'waymarkedtrails-riding', 'waymarkedtrails-slopes'],
        pos: {
            lon: 11.096061,
            lat: 47.490186,
            zoom: 8
        }
    },
    russian: {
        mt: ['yandex-satellite'],
        pos: {
            lon: 30.315363,
            lat: 59.937851
        }
    },
    streetview: {
        mt: ['google-streetview' /* , 'mapillary-streetview'*/ ]
    },

    safecast: {
        mt: ['safecast-2023-08-13', 'safecast-cosmic-2019-04-07'],
        pos: {
            lon: 138.5,
            lat: 36.9,
            zoom: 6
        }
    },

    yandex: {
        mt: ['yandex-satellite'],
        pos: {
            lon: 30.315363,
            lat: 59.937851
        }
    },
    bw: {
        mt: ['stamen-toner', 'stamen-toner-lite']
    },
    hillshading: {
        mt: ['maptoolkit-topo', 'geodatenzentrum-hillshade', 'esri-terrain-base', 'clockwork-terrain-hillshade', 'clockwork-terrain-slope', 'clockwork-terrain-aspect', 'clockwork-terrain-raw', 'usgs-shaded-relief-only', 'floodmap-basic'],
        pos: {
            lon: 13.108371,
            lat: 50.560996
        }
    },
    night: {
        mt: ['thunderforest-transport-dark', 'carto-darkmatter', 'skobbler-night']
    },
    thunderforest: {
        mt: ['thunderforest-cyclemap', 'thunderforest-landscape', 'thunderforest-transport', 'thunderforest-outdoors', 'thunderforest-transport-dark', 'thunderforest-pioneer', 'thunderforest-neighbourhood', 'thunderforest-spinal-map', 'thunderforest-mobile-atlas'] // 'atlas'
    },
    'lgb': {
        mt: ['lgb-webatlas', 'lgb-topo-10', 'lgb-topo-50', 'lgb-history-1902', 'lgb-history-1767', 'lgb-satellite-color', 'lgb-satellite-grey', 'lgb-satellite-infrared', 'lgb-plz', 'lgb-administrative-boundaries', 'lgb-dgm'],
        pos: {
            lon: 13.05914,
            lat: 52.400931,
            zoom: 13
        }
    },
    'histomapberlin-4236': { /* Mitte */
        mt: ['histomapberlin-4236-1935', 'histomapberlin-4236-1946', 'histomapberlin-4236-1966-ost', 'histomapberlin-4236-1984-ost', 'histomapberlin-4236-1988-west', 'histomapberlin-4236-1988-ost'],
        pos: {
            lon: 13.401722,
            lat: 52.532379,
            zoom: 15
        }
    },
    'histomapberlin-4338': { /* Renickendorf */
        mt: ['histomapberlin-4338-1935', 'histomapberlin-4338-1938', 'histomapberlin-4338-1948', 'histomapberlin-4338-1954', 'histomapberlin-4338-1967', 'histomapberlin-4338-1974', 'histomapberlin-4338-1979', 'histomapberlin-4338-1986'],
        pos: {
            lon: 13.359018,
            lat: 52.580932,
            zoom: 15
        }
    },
    'histomapberlin-4223': { /* Friedrichshain */
        mt: ['histomapberlin-4223-1928', 'histomapberlin-4223-1940', 'histomapberlin-4223-1952', 'histomapberlin-4223-1956', 'histomapberlin-4223-1961', 'histomapberlin-422-C-1963', 'histomapberlin-422-C-1966', 'histomapberlin-422-C-1972', 'histomapberlin-422-C-1978', 'histomapberlin-422-C-1985', 'histomapberlin-422-C-1990'],
        pos: {
            lon: 13.47027,
            lat: 52.51601,
            zoom: 15
        }
    },
    'viamichelin': {
        mt: ['viamichelin-map', 'viamichelin-light', 'viamichelin-hybrid']
    },
    'switzerland': {
        mt: ['osm-ch-standard', 'osm-ch-swiss', 'mapnik', 'mapnik-german', 'tomtom-basic', 'google-map'],
        pos: {
            lon: 7.451451,
            lat: 46.948271
        }
    },
    sweden: {
        mt: ['tomtom-basic', 'mapnik', 'google-map'],
        pos: {
            lon: 18.071093,
            lat: 59.325117
        }
    },
    'norway': {
        mt: ['mtbmap-norway', 'visitnorway-standard', 'mapnik', 'tomtom-basic', 'tomtom-sat', 'google-map'],
        pos: {
            lon: 10.746621,
            lat: 59.912859
        }
    },
    'welsh': {
        mt: ['mapnik', 'cymru-basic'],
        pos: {
            lon: -4.039598,
            lat: 52.050935
        },
    },
    'belgium': {
        mt: ['osmbe-fr', 'osmbe-nl', 'osmbe', 'mapnik-german'],
        pos: {
            lon: 4.344527,
            lat: 50.848954
        },
        zoom: 12
    },
    france: {
        mt: ['osmfr', 'osmfr-hot', 'osmfr-breton', 'osmfr-openriverboatmap', 'cyclemap', 'mapnik-german'],
        pos: {
            lon: -1.68,
            lat: 48.11,
            zoom: 9
        }
    },
    'japan': {
        mt: ['gsi-japan-tpale', 'gsi-japan-std', 'gsi-japan-aerial', 'mapfan-road', 'mapnik', 'tomtom-sat', 'tomtom-basic', 'gsi-japan-english', 'safecast-2023-08-13'],
        pos: {
            lon: 139.78,
            lat: 35.72,
            zoom: 10
        }
    },
    'waze': {
        mt: ['waze-world'],
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 8
        }
    },

    'basemap': {
        mt: ['basemap-standard', 'basemap-retina', 'basemap-grey', 'basemap-sat'],
        pos: {
            lon: 16.372504,
            lat: 48.208354
        }
    },
    'austria': {
        mt: ['basemap-retina', 'basemap-grey', 'basemap-sat', 'mapnik-german', 'tomtom-basic', 'bergfex-oek', 'google-map', 'tomtom-basic'],
        pos: {
            lon: 16.372504,
            lat: 48.208354
        }
    },
    berlin: {
        mt: ['bbbike-bbbike', 'mapnik-german', 'geodatenzentrum-color', 'cyclosm', 'bbbike-smoothness', 'bvg-stadtplan', 'thunderforest-transport', 'lgb-webatlas', 'lgb-history-1767', 'lgb-history-1902', 'berlin-historical-1928', 'berlin-historical-2004', 'berlin-historical-2025-summer', 'tomtom-basic', 'google-map'],
        pos: {
            lon: 13.398604,
            lat: 52.520543
        },
    },
    'berlin-historical': {
        mt: ['historicmaps-berlin-1910-straube', 'berlin-historical-1928', 'berlin-historical-1953', 'berlin-historical-2004', 'berlin-historical-2025-summer', 'berlin-historical-gebschaden', 'berlin-historical-1940', 'berlin-historical-1986', 'berlin-k5', 'berlin-historical-gebaeudealter', 'mapnik', 'ts-hausnummern'],
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },
    'berlin-satellite': {
        mt: ['berlin-historical-1928', 'berlin-historical-1953', 'berlin-historical-2002-bw', 'berlin-historical-2004', 'berlin-historical-2005-infrared', 'berlin-historical-2006-bw', 'berlin-historical-2007', 'berlin-historical-2009', 'berlin-historical-2010', 'berlin-historical-2010-infrared', 'berlin-historical-2011', 'berlin-historical-2013', 'berlin-historical-2014', 'berlin-historical-2015', 'berlin-historical-2016', 'berlin-historical-2017', 'berlin-historical-2018', 'berlin-historical-2019', 'berlin-historical-2020', 'berlin-historical-2020-truedop', 'berlin-historical-2021', 'berlin-historical-2022', 'berlin-historical-2023', 'berlin-historical-2024', 'berlin-historical-2025', 'berlin-historical-2025-summer', 'tomtom-sat', 'google-satellite', 'lgb-dgm', 'mapnik-german'],
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },

    'lgb-aerial': {
        mt: ['lgb-aerial-1953', 'lgb-aerial-1992-1997-grey', 'lgb-aerial-2001-2005-grey', 'lgb-aerial-2001-2009-grey', 'lgb-aerial-2005-2010-4m', 'lgb-aerial-2009-2012-4m', 'lgb-aerial-2013-2015', 'lgb-aerial-2016-2018-4m', 'lgb-satellite-color', 'lgb-satellite-infrared', 'lgb-satellite-grey', 'lgb-dgm'],
        pos: {
            lon: 13.05914,
            lat: 52.400931,
            zoom: 15
        }
    },

    'gdiberlin-water': {
        mt: ['gdiberlin-senken', 'gdiberlin-feuerwehreinsaetze', 'gdiberlin-gewaesser', 'gdiberlin-starkregengefahrenkarten', 'gdiberlin-hwgklow', 'gdiberlin-radverkehrsnetz', 'mapnik-german', 'tomtom-sat'],
        pos: {
            lon: 13.398604,
            lat: 52.520543
        },
    },

    'gdiberlin-traffic': {
        mt: ['gdiberlin-verkehrsmengen_2023-rad', 'bbbike-bbbike', 'gdiberlin-verkehrsmengen_2023-kfz', 'gdiberlin-verkehrsmengen_2023-lkw'],
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 15
        },
    },

    'berlin-satellite-infrared': {
        mt: ['berlin-historical-2020-infrared', 'berlin-historical-2020-truedop-infrared', 'berlin-historical-2016-infrared', 'berlin-historical-2015-infrared', 'berlin-historical-2010-infrared', 'berlin-historical-2005-infrared', 'lgb-satellite-infrared'],
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },

    'berlin-satellite-bw': {
        mt: ['berlin-historical-1928', 'berlin-historical-1953', 'berlin-historical-2002-bw', 'berlin-historical-2006-bw'],
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },

    'historicmaps-berlin-1698-1871': {
        mt: ['e-historicmaps-183', 'e-historicmaps-1132', 'e-historicmaps-471', 'e-historicmaps-197', 'e-historicmaps-466', 'e-historicmaps-292', 'e-historicmaps-287', 'e-historicmaps-1138'],
        'match-id': 'e-historicmaps',
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },
    'historicmaps-berlin-1874-1900': {
        mt: ['e-historicmaps-283', 'e-historicmaps-1150', 'e-historicmaps-199', 'e-historicmaps-233', 'e-historicmaps-1139', 'e-historicmaps-250', 'e-historicmaps-483', 'e-historicmaps-193'],
        'match-id': 'e-historicmaps',
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },
    'historicmaps-berlin-1903-1913': {
        mt: ['e-historicmaps-210', 'e-historicmaps-214', 'e-historicmaps-258', 'e-historicmaps-487', 'e-historicmaps-489', 'historicmaps-berlin-1910-straube', 'e-historicmaps-479', 'e-historicmaps-1123'],
        'match-id': 'e-historicmaps',
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },
    'historicmaps-berlin-1914-1928': {
        mt: ['e-historicmaps-192', 'e-historicmaps-484', 'e-historicmaps-1091', 'e-historicmaps-195', 'e-historicmaps-1145', 'e-historicmaps-191', 'e-historicmaps-190', 'berlin-historical-1928'],
        'match-id': 'e-historicmaps',
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 16
        }
    },
    'berlin-transit': {
        mt: ['sbahnberlin-standard', 'bvg-stadtplan', 'public_transport', 'bbbike-bbbike', 'bvg-standard', 'vbb-standard', 'thunderforest-transport', 'tomtom-basic', 'google-transit-map']
    },
    'brazil': {
        mt: ['mapnik', 'tomtom-basic', 'google-map'],
        pos: {
            lon: -47.894593,
            lat: -15.795929
        }
    },
    'bvg': {
        mt: ['bvg-stadtplan', 'bvg-stadtplan-10', 'bvg-stadtplan-50', 'bvg-standard'],
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 13
        }
    },
    'czech': {
        mt: ['mapnik-german', 'mapnik'],
        pos: {
            lon: 14.560368,
            lat: 50.058928
        }
    },
    'polish': {
        mt: ['ump-pcpl', 'osmapa', 'mapnik', 'mapnik-german'],
        pos: {
            zoom: 8,
            lon: 21.006725,
            lat: 52.231958
        }
    },
    'meteo': {
        mt: ['meteo-mapy' /*, 'meteo-temperature' */ ],
        pos: {
            zoom: 8,
            lon: 21.006725,
            lat: 52.231958
        }
    },
    'serbia': {
        mt: ['serbiamap-latin', 'serbiamap-cyrillic', 'mapnik-german', 'tomtom-basic', 'google-map'],
        pos: {
            lon: 20.440781,
            lat: 44.818329,
            zoom: 12
        }
    },
    'slovakia': {
        mt: ['freemap-slovakia-outdoor', 'freemap-slovakia', 'freemap-slovakia-hiking', 'mapnik-german'],
        pos: {
            lon: 17.116635,
            lat: 48.149391
        }
    },
    'sorbian': {
        mt: ['sorbian-mapnik', 'mapnik', 'tomtom-basic', 'geodatenzentrum-color'],
        pos: {
            lon: 14.317195,
            lat: 51.731679,
            zoom: 12
        }
    },
    'stamen': {
        mt: ['stamen-watercolor', 'stamen-terrain', 'stamen-toner', 'stamen-toner-lite'],
        pos: {
            lon: 30.776574,
            lat: 46.461103,
            zoom: 11
        }
    },
    'strava': {
        mt: ['strava-ride', 'strava-run', 'strava-winter', 'strava-water', 'mapnik', 'tomtom-sat'],
        pos: {
            lon: -71.060511,
            lat: 42.355433,
            zoom: 10
        }
    },
    'usa': {
        mt: ['usgs-topo', 'usgs-imagery-topo', 'esri-topo-usa', 'esri-topo', 'mapnik', 'waze-us', 'tomtom-sat'],
        pos: {
            lon: -122.37,
            lat: 37.80
        }
    },
    'usgs': {
        mt: ['usgs-topo', 'usgs-imagery-topo', 'usgs-imagery-only', 'tomtom-sat', 'esri-topo-usa', 'mapnik', 'usgs-shaded-relief-only', 'usgs-hydro-cached'],
        pos: {
            lon: -122.37,
            lat: 37.80
        }
    },
    'carto': {
        mt: ['carto-voyager', 'carto-positron', 'carto-darkmatter', 'carto-light-nolabels']
    },
    'outdooractive': {
        mt: ['outdooractive-summer-osm', 'outdooractive-winter-osm', 'outdooractive-summer', 'outdooractive-winter'],
        pos: {
            lon: 11.40702,
            lat: 47.24283
        }
    },
    traffic: {
        mt: ['google-traffic-map'],
    },
    commercial: {
        mt: ['tomtom-basic', 'esri', 'viamichelin-map', 'google-map']
    }
};

// MapCompare admin console /console.html
var mc_console = {
    maxTileServer: 3,

    // enable/disable configuration section
    pref_numberOfMaps: true,
    pref_centerOfMaps: true,
    pref_tileserver: true,
    pref_orderOfMaps: true,

    // cookie names
    cookie: {
        "tileserver": "mc_tileserver_",
        "numberOfMaps": "mc_number_of_maps",
        "orderOfMaps": "mc_order_of_maps",
        "centerOfMaps": "mc_center_of_maps",
        "check": "mc_cookie_check"
    }
};


// global variables shared by functions
var state = {
    non_map_tags: ["tools-top", "tools-titlebar", "bottom", "m0", "m1", "m2", "debug"],
    // hide in full screen mode
    fullscreen: false,
    fullscreen_type: 1,

    console: false,
    // in console mode
    percent: mc.overlay.value,

    layertypes: [],
    over_layertypes: [],
    layertypes_hash: {},
    over_layertypes_hash: {},
    maps: [],
    layers: [],
    over_layers: [],
    over_layers_obj: [],
    markersLayer: [],
    marker: [],
    moving: false,
    movestarted: false,
    proj4326: false,

    nonBaseLayer: [],
    marker_message: "",
    zoom: 0,

    control: {},
    // ref to controls
    //
    _ie: false // IE bugs
};

// only "map" variable keeps global
var map;

/*
   main
*/
$(document).ready(function () {
    // hide spinning wheel after all JS libs are loaded
    $('#tools-pageload').hide();

    return mc.console ? initConsole() : initMapCompare();
});


function copySimple(obj) {
    // no nested objects
    var obj_copy = new Object;
    for (var key in obj) {
        obj_copy[key] = obj[key];
    }

    return obj_copy;
}

function initMapCompare() {
    initResponsiveDesign();
    initSocial();

    OpenLayers.Util.onImageLoadError = function () {
        this.src = 'img/404.png';
    }

    var mt = mc.mt;
    var mt_overlay = mc.overlay.mt_overlay;

    var proj4326 = new OpenLayers.Projection('EPSG:4326');
    state.proj4326 = proj4326;

    var projmerc = new OpenLayers.Projection('EPSG:900913');

    // var NumberOfMaps = mc.NumberOfMaps;
    var NumberOfMaps = getNumberOfMaps();

    var pos = getMapCenter();
    // keep copy of default center
    var _pos = copySimple(pos);

    //var lon = pos.lng;
    //var lat = pos.lat;
    //var zoom = pos.zoom;
    var lon, lat, zoom;

    var x = null;
    var y = null;
    var marker = "";
    var external_options = {
        "match-name": "",
        "match-id": ""
    };

    state.external_options = external_options;

    // parse arguments from hash tag in URL, e.g. #map=18/52.58592/13.36120
    parseHashtag(function (obj) {
        if (obj) {
            lat = obj.lat;
            lon = obj.lng;
            zoom = obj.zoom;
        }
    });

    parseParams(function (param, v) {
        var obj;

        switch (param) {

        case 'type':
            mt[0] = v;
            break;
        case 'mt0':
            mt[0] = v;
            break;
        case 'mt1':
            mt[1] = v;
            break;
        case 'mt2':
            mt[2] = v;
            break;
        case 'mt3':
            mt[3] = v;
            break;
        case 'mt4':
            mt[4] = v;
            break;
        case 'mt5':
            mt[5] = v;
            break;
        case 'mt6':
            mt[6] = v;
            break;
        case 'mt7':
            mt[7] = v;
            break;
        case 'mt8':
            mt[8] = v;
            break;
        case 'mt9':
            mt[9] = v;
            break;
        case 'mt10':
            mt[10] = v;
            break;
        case 'mt11':
            mt[11] = v;
            break;
        case 'mt12':
            mt[12] = v;
            break;
        case 'mt13':
            mt[13] = v;
            break;
        case 'mt14':
            mt[14] = v;
            break;

            // overlay maps
        case 'mt-1':
            mt_overlay[0] = v;
            break;
        case 'mt-1p':
            state.percent = v;
            break;

        case 'lon':
        case 'mlon':
            if (is_number(v)) {
                lon = Number(v);
            }
            break;

        case 'lat':
        case 'mlat':
            if (is_number(v)) {
                lat = Number(v);
            }
            break;

            /* old google maps: ll=lat,lon */
        case 'll':
            obj = getMapCenter('@' + v + ',15z'); // new google URL style
            lat = obj.lat;
            lon = obj.lng;
            break;

        case 'profile':
            if (profile[v]) {
                NumberOfMaps = profile[v].NumberOfMaps ? profile[v].NumberOfMaps : profile[v].mt.length;
                debug("Use profile " + v + ", with " + NumberOfMaps + " maps");
                mc.mt = profile[v].mt;

                if (profile[v].pos) {
                    lon = profile[v].pos.lon;
                    lat = profile[v].pos.lat;
                    debug("Reset center to lon,lat: " + lon + "," + lat);
                }

                // match external servers as well
                if (profile[v]["match-id"]) {
                    external_options["match-id"] = profile[v]["match-id"];
                }
                if (profile[v]["match-name"]) {
                    external_options["match-name"] = profile[v]["match-name"];
                }

                if (profile[v].pos && profile[v].pos.zoom) {
                    zoom = profile[v].pos.zoom;
                }
            }
            break;

            // external plugins
        case 'eo-match-id':
            external_options["match-id"] = v;
            break;
        case 'eo-match-name':
            external_options["match-name"] = v;
            break;

        case 'url':
            pos = tile2lnglat(v);
            if (pos) {
                lon = pos.lng;
                lat = pos.lat;
                zoom = pos.zoom;
            } else {
                debug("cannot decode url parameter");
            }
            break;

        case 'zoom':
        case 'z':
            if (is_number(v) && parseInt(v)) {
                zoom = parseInt(v);
            }
            break;

            // XXX?
        case 'x':
            x = parseInt(v);
            break;
        case 'y':
            y = parseInt(v);
            break;

        case 'num':
        case 'number':
            NumberOfMaps = parseInt(v);
            break;

        case 'debug':
            mc.debug = parseInt(v) || 0;
            break;

        case 'fullscreen':
            if (parseInt(v) > 0) setTimeout(function () {
                toggleFullScreen(parseInt(v));
            }, 300);
            break;

        case 'marker':
            marker = _decodeURIComponent(v);
            break;

            // bbbike.org/mc/?page=help
        case 'page':
            if (v == "help") {
                $(document).ready(function () {
                    $("a#tools-helptrigger").click();
                });
            }
            // /mc/console/?page=help-console will be handled in /mc/console.html 
            else {
                debug("Unknown page: " + v);
            }
            break;
        }
    });

    initKeyPress();
    initYandex();
    initLayerTypes();
    initLayerTypesUserDefined();

    var layertypes = state.layertypes;

    if (NumberOfMaps > layertypes.length) NumberOfMaps = layertypes.length;
    if (mc.NumberOfMapsMax > layertypes.length || !mc.NumberOfMapsMax) mc.NumberOfMapsMax = layertypes.length;
    if (!NumberOfMaps || NumberOfMaps < 1 || NumberOfMaps > mc.NumberOfMapsMax) NumberOfMaps = 2;

    mc.NumberOfMaps = NumberOfMaps;
    MapOrderHtml(NumberOfMaps);

    $(window).resize(function () {
        setMapHeight(NumberOfMaps);
        if ($("div#search-results").length > 0) {
            set_search_width();
        }
        validate_profile();
    });

    // no parameters, use the default config
    state.default_pos = 0;
    state.default_pos_zoom = 0;
    if (lon == undefined) {
        lon = pos.lng;
        state.default_pos = 1;
    }
    if (lat == undefined) {
        lat = pos.lat;
        state.default_pos = 1;
    }
    if (zoom == undefined) {
        zoom = pos.zoom;
        state.default_pos_zoom = 1;
    }

    pos = createMapPosition(lon, lat, x, y, zoom);

    // OpenLayers.ImgPath = OpenLayers._getScriptLocation() + '../../img/theme/geofabrik/img/';
    OpenLayers.ImgPath = 'img/theme/bbbike/img/';

    initColumnWidth(NumberOfMaps);
    var mapnames = sortMapLayersSelected(mc.mt);

    for (var n = 0; n < NumberOfMaps; n++) {
        // selected map type in menu
        var mapname = mapnames[n];

        initColumn(n);
        initSelectOptions(n, mapname);

        var _map = new OpenLayers.Map('map' + n, {
            theme: null,
            numZoomLevels: mc.numZoomLevels,
            controls: [],
            projection: projmerc,
            displayProjection: state.proj4326
        });

        _map.addControl(new OpenLayers.Control.Navigation());
        _map.addControl(new OpenLayers.Control.MousePosition({
            prefix: "lng,lat: ",
            separator: ",",
            div: $('#customMousePosition').get(0)
        }));

        // controls for first map top left
        if (n == 0) {
            _map.addControl(new OpenLayers.Control.PanZoomBar());
            _map.addControl(new OpenLayers.Control.ScaleLine({
                geodesic: true
            }));
            state.control.keyboard = new OpenLayers.Control.KeyboardDefaults();
            _map.addControl(state.control.keyboard);
        }

        state.maps[n] = _map;
        newLayer(n, mapname);

        // if first map has a configured center, use it as default
        if (n == 0) {
            //
            // 1. configured by parameter (URL, cookie)
            // 2. configured by map
            // 3. configured by default
            //
            var map0 = state.layertypes_hash[mapname];

            if (state.default_pos) {
                if (typeof map0 !== 'undefined' && typeof map0.options !== 'undefined' && typeof map0.options.pos !== 'undefined') {
                    var p = map0.options.pos;
                    if (p.zoom == undefined || state.default_pos_zoom == 0 // &zoom=... parameter
                    ) {
                        p.zoom = zoom;
                    }
                    debug("auto center by first map by default position lon=" + p.lon + " lat=" + p.lat + " zoom=" + p.zoom);
                    pos = createMapPosition(p.lon, p.lat, x, y, p.zoom);
                }
            }
        }

        setStartPos(n, pos.getLonLat(), pos.zoom);
        initMarker(n);

        _map.events.register('movestart', n, moveStart);
        _map.events.register('moveend', n, moveEnd);
        _map.events.register('mousemove', n, mouseMove);
        _map.events.register('mouseover', n, mouseOver);
        _map.events.register('mouseout', n, mouseOut);

        // move mapname on top of map
        if (mc.mapname_fullscreen) {
            $(_map.viewPortDiv).append($("div#mapname" + n));
        }
    }

    // hide the second column if only one map should be displayed
    if (NumberOfMaps == 1) {
        initColumn(1, "none");
    }

    map = state.maps[0];

    // overlay
    initSelectOptionsOverlay(-1, mt_overlay[0]);
    if (mc.overlay.type == "select") {
        initSelectOptionsTransparent(-2, state.percent);
    } else {
        initSliderTransparent();
    }

    // $('#customMousePosition').hide();
    updatePermalink();
    updateNumberOfMapsLink(mc.NumberOfMapsMax, NumberOfMaps, mc.NumberOfMapsLinks);

    // paranoid
    $(window).load(function () {
        debug("window.load done");
        setMapHeight(NumberOfMaps);
    });

    if (lon && lat && marker) {
        set_popup({
            lon: lon,
            lat: lat,
            message: marker
        });
        state.marker_message = marker;
    }

    state.zoom = zoom;
}

function is_number(number) {
    if (number == undefined) {
        return 0;
    }
    if (number == "") {
        return 0;
    }

    // 0 or 0.0 are real numbers
    if (Number(number) == 0) {
        return 1;
    }

    return Number(number) ? 1 : 0;
}

function initResponsiveDesign() {
    if (mc.responsive.enabled) {
        // $('head').append('<link rel="stylesheet" href="css/mobile.css" type="text/css" />')
    }
}

function parseHashtag(handler) {
    var url = location.href;
    var obj;

    // OpenStreetMap: #map=18/52.58592/13.36120
    if (url.indexOf("#map=") != -1) {
        obj = getMapCenter(url.substring(url.indexOf("#map=")));
    }

    // Google Maps (admin console): @52.375326,13.2926094,13z
    else if (url.indexOf("@") != -1) {
        obj = getMapCenter(url.substring(url.indexOf("@")));
    }

    // need a hash tag before @, because this is a static page!
    else if (url.indexOf("#@") != -1) {
        obj = getMapCenter(url.substring(url.indexOf("#@") + 1));
    }

    // tools.geofabrik.de: #18/52.58592/13.36120 => 13.36120,52.58592,18
    else if (url.indexOf("#") != -1) {
        obj = getMapCenter(url.substring(url.indexOf("#")));
    }


    handler(obj);
}

/*
  here are dragons!
  code copied from js/OpenLayers-2.11/OpenLayers.js: OpenLayers.Control.KeyboardDefaults

  see also: https://www.mediaevent.de/javascript/Extras-Javascript-Keycodes.html
*/
function initKeyPress() {
    // move all maps left/right/top/down

    function moveMap(direction, option) {
        for (var i = 0; i < state.maps.length; i++) {
            // google maps don't support animate flag
            var animate = state.layers[i].type.match(/^google-/) ? false : true;
            debug(state.layers[i].type + " " + animate);

            // state.layers[i].layers[1].pan(direction, option, { animate: animate });
            state.maps[i].pan(direction, option, {
                animate: animate
            });
        }
    };

    OpenLayers.Control.KeyboardDefaults.prototype.defaultKeyPress = function (evt) {
        debug("key press: " + evt.keyCode);

        switch (evt.keyCode) {

            // move the map left/right/top/bottom
        case OpenLayers.Event.KEY_LEFT:
        case 72:
            moveMap(-this.slideFactor, 0);
            break;
        case OpenLayers.Event.KEY_RIGHT:
        case 76:
            moveMap(this.slideFactor, 0);
            break;
        case OpenLayers.Event.KEY_UP:
        case 75:
            moveMap(0, -this.slideFactor);
            break;
        case OpenLayers.Event.KEY_DOWN:
        case 74:
            moveMap(0, this.slideFactor);
            break;

        case 33:
            var size = map.getSize();
            map.pan(0, -0.75 * size.h);
            break;
        case 34:
            var size = map.getSize();
            map.pan(0, 0.75 * size.h);
            break;
        case 35:
            var size = map.getSize();
            map.pan(0.75 * size.w, 0);
            break;
        case 36:
            var size = map.getSize();
            map.pan(-0.75 * size.w, 0);
            break;

            // '+', '=''
        case 43:
        case 61:
        case 187:
        case 107:
        case 171:
            // Firefox 15.x
            map.zoomIn();
            break;

            // '-'
        case 45:
        case 109:
        case 189:
        case 95:
        case 173:
            // Firefox 15.x or later, see https://github.com/openlayers/openlayers/issues/605
            map.zoomOut();
            break;

            // Map Compare
        case 70:
            // f
        case 27:
            // ESC
            // 'f': toggle fullscreen, without map name if shift or ctrl are pressed
            // are active (e.g. to switch to fullscreen browser window)
            if (evt.shiftKey || evt.altKey) {
                toggleFullScreen(2);
            } else if (evt.ctrlKey) {
                toggleFullScreen(3);
            } else {
                toggleFullScreen(1);
            }
            break;

        case 71:
            // 'g'
            locateMe();
            break;

        case 48:
            // '0' max zoom in
            for (var i = 0; i < 17; i++) {
                if (map.getZoom() < i) map.zoomIn();
            }
            break;

            // number of maps: 1..9
        case 49:
            window.location.href = getPermalink(1);
            break;
        case 50:
            window.location.href = getPermalink(2);
            break;
        case 51:
            window.location.href = getPermalink(3);
            break;
        case 52:
            window.location.href = getPermalink(4);
            break;
        case 53:
            // 5: 15 maps, 3 rows
            window.location.href = getPermalink(15);
            break;
        case 54:
            window.location.href = getPermalink(6);
            break;
        case 55:
            // 7: 24 maps, 4 rows
            window.location.href = getPermalink(24);
            break;
        case 56:
            window.location.href = getPermalink(8);
            break;
        case 57:
            // 9: all maps
            window.location.href = getPermalink(state.layertypes.length);
            break;

        case 67:
            // 'c'
            window.location.href = "console.html";
            break
        case 80:
            // 'p' - create permalink
            // window.location.href = updatePermalink();
            click_share_link();
            break
        case 191:
            // '/' (alias '?')
            $("#tools-helptrigger").trigger({
                type: 'click',
                which: 191
            });
            // window.location.href = "help.html";
            break
        case 83:
            // 's'
            $("#tools-searchtrigger").trigger({
                type: 'click',
                which: 83
            });
            // window.location.href = "search.html";
            break

/* default:
            debug("unknown key press: " + evt.keyCode);
            break;
        */

        }

        return evt.keyCode;
    };
};


/* sort maps, pre-selected first */

function sortMapLayersSelected(selectedMaps) {
    var layertypes = state.layertypes;
    var cache = {};
    var list = [];

    // these maps are first
    for (var i = 0; i < selectedMaps.length; i++) {
        cache[selectedMaps[i]] = 1;
        list.push(selectedMaps[i]);
    }

    // then the rest
    for (var i = 0; i < layertypes.length; i++) {
        var name = layertypes[i].type;
        if (!cache[name]) {
            list.push(name);
        }
    }

    return list;
}

// reorder maps by name

function reorderMaps(type, config) {
    var maplist = state[type];
    if (!config.name && !config.type) return;

    function sortByName(a, b) {
        return a.name == b.name ? 0 : a.name > b.name ? 1 : -1
    };

    function sortByType(a, b) {
        return a.type == b.type ? 0 : a.type > b.type ? 1 : -1
    };

    // special sorting of map names

    function namePref(maps) {
        var list = [];
        var cache = {};
        var hash = {};

        for (var i = 0; i < state.nonBaseLayer.length; i++)
        hash[state.nonBaseLayer[i]] = 1;

        for (var i = 0; i < maps.length; i++) {
            if (!cache[i] && config.opacity && hash[maps[i]] && hash[maps[i].type]) {
                // alert("fooA " + maps[i].type);
                list.push(maps[i]);
                cache[i] = 1;
            }
        }

        // BBBike maps first
        for (var i = 0; i < maps.length; i++) {
            if (!cache[i] && config.bbbike && maps[i].name.match(/^BBBike/i)) {
                list.push(maps[i]);
                cache[i] = 1;
            }
        }

        // OSM maps second
        for (var i = 0; i < maps.length; i++) {
            if (!cache[i] && config.osm && maps[i].name.match(/^OSM/i)) {
                list.push(maps[i]);
                cache[i] = 1;
            }
        }

        // rest
        for (var i = 0; i < maps.length; i++) {
            if (!cache[i]) list.push(maps[i]);
        }

        return list;
    };

    if (config.name) {
        maplist = namePref(maplist.sort(sortByName));
    } else if (config.type) {
        maplist = maplist.sort(sortByType);
    } else {
        // nothing
    }

    state[type] = maplist;
}

function setMapHeight(NumberOfMaps) {
    var fullscreen = state.fullscreen;
    var height = $(window).height();
    var head = $('#head0').outerHeight(true); // first map description height
    if (fullscreen) {
        height -= $('#tools-copyright').outerHeight(true); // always visible
    } else {
        height += -$('#tools-top').outerHeight(true) - $('#tools-titlebar').outerHeight(true) - $('#bottom').outerHeight(true) - $('#tools-copyright').outerHeight(true);
    }

    // split screen if more than 3 maps are displayed
    var h;
    var rows = 1;
    if (NumberOfMaps <= 3) {;
    } else if (NumberOfMaps <= mc.row3) {
        rows = 2;
    } else if (NumberOfMaps <= mc.row4) {
        rows = 3;
    } else if (NumberOfMaps <= mc.row5) {
        rows = 4;
    } else {
        rows = 5;
    }

    h = height / rows;
    if (!fullscreen) {
        h -= head;
    }
    $('.map').height(Math.floor(h));

    // development: validate map size height
    var rest;
    if (!fullscreen) {
        rest = $('#tools-top').outerHeight(true) + $('#tools-titlebar').outerHeight(true) + $('#bottom').outerHeight(true) + $('#tools-copyright').outerHeight(true) + rows * ($('#map0').outerHeight() + $('#head0.switch').outerHeight(true));
    } else {
        rest = $('#tools-copyright').outerHeight(true) + rows * ($('#map0').outerHeight());
    }
    debug("height: " + $(window).height() + " rest: " + rest + " diff: " + ($(window).height() - rest) + " map: " + $('#map0').height());
}

// pre-defined id's, for internal usage only:
// 
// e-osmlab-<xxxx> (external)
// eo-osmlab-match=<...> (external options)
//

function initLayerTypes() {
    var BingApiKey = "AjkRC9uldL9KVU3pa6N59e7fjpNdCzKTtMqFhdafSEQlcNGPLVEm3b3mukoZCLWr";

    var YandexBounds = state.YandexBounds;
    var proj4326 = state.proj4326;


    var layer_options = {
        tileOptions: {
            crossOriginKeyword: null
        },
        sphericalMercator: true,
        // buffer: 0,
        transitionEffect: "resize",
        numZoomLevels: 19
    };


    var layer_options22 = {
        tileOptions: {
            crossOriginKeyword: null
        },
        sphericalMercator: true,
        transitionEffect: "resize",
        numZoomLevels: 22
    };

    var layer_options17 = {
        tileOptions: {
            crossOriginKeyword: null
        },
        sphericalMercator: true,
        // buffer: 0,
        transitionEffect: "resize",
        numZoomLevels: 17
    };

    var layer_options12 = {
        tileOptions: {
            crossOriginKeyword: null
        },
        sphericalMercator: true,
        // buffer: 0,
        transitionEffect: "resize",
        numZoomLevels: 12
    };

    var berlin_historical_options = {
        tileOptions: {
            crossOriginKeyword: null
        },
        sphericalMercator: true,
        // buffer: 0,
        // transitionEffect: "resize",
        numZoomLevels: 20
    };


    function google_layertypes() {
        return [

        new LayerType('google-map', 'Google Map', function () {
            return new OpenLayers.Layer.Google('Google (Map)', {
                type: google.maps.MapTypeId.ROADMAP
            });
        }),

        new LayerType('google-map-mapmaker', 'Google Map MapMaker', function () {
            var _map = new OpenLayers.Layer.Google('Google (Map)', {
                type: google.maps.MapTypeId.ROADMAP
            });

            /* XXX: it needs to be called some milliseconds later */
            setTimeout(function () {
                _map.mapObject.setOptions({
                    mapMaker: true
                });
            }, 0);
            return _map;
        }),

        new LayerType('google-satellite', 'Google Satellite', function () {
            return new OpenLayers.Layer.Google('Google (Satellite)', {
                type: google.maps.MapTypeId.SATELLITE
            });
        }),

        new LayerType('google-hybrid', 'Google Hybrid', function () {
            return new OpenLayers.Layer.Google('Google (Hybrid)', {
                type: google.maps.MapTypeId.HYBRID
            });
        }),

        new LayerType('google-hybrid-mapmaker', 'Google Hybrid MapMaker', function () {
            var _map = new OpenLayers.Layer.Google('Google (Map)', {
                type: google.maps.MapTypeId.HYBRID
            });

            /* XXX: it needs to be called some milliseconds later */
            setTimeout(function () {
                _map.mapObject.setOptions({
                    mapMaker: true
                });
            }, 0);
            return _map;
        }),

        new LayerType('google-physical', 'Google Physical', function () {
            return new OpenLayers.Layer.Google('Google (Physical)', {
                type: google.maps.MapTypeId.TERRAIN
            });
        }),

        new LayerType('google-bicycle-map', 'Google Bicycle (Map)', function () {
            var g = new OpenLayers.Layer.Google('Google (Bicycle)', {
                type: google.maps.MapTypeId.ROADMAP
            });

            setTimeout(function () {
                new google.maps.BicyclingLayer().setMap(g.mapObject);
            }, 0);
            return g;
        }),

        new LayerType('google-traffic-map', 'Google Traffic (Map)', function () {
            var g = new OpenLayers.Layer.Google('Google (Traffic)', {
                type: google.maps.MapTypeId.ROADMAP
            });

            setTimeout(function () {
                new google.maps.TrafficLayer().setMap(g.mapObject);
            }, 0);
            return g;
        }),

        new LayerType('google-weather-sat', 'Google Weather (Sat)', function () {
            var g = new OpenLayers.Layer.Google('Google (Weather)', {
                type: google.maps.MapTypeId.SATELLITE
            });

            setTimeout(function () {
                new google.maps.weather.WeatherLayer().setMap(g.mapObject);
            }, 0);
            return g;
        }),

        new LayerType('google-transit-map', 'Google Transit (Map)', function () {
            var myLatlng = new google.maps.LatLng(51.501904, -0.115871);

            var g = new OpenLayers.Layer.Google('Google (Transit)', {
                center: myLatlng,
                zoom: 13,
                type: google.maps.MapTypeId.ROADMAP
            });

            setTimeout(function () {
                new google.maps.TransitLayer().setMap(g.mapObject);
            }, 0);
            return g;
        }),

        new LayerType('google-layers-physical', 'Google Layers (Physical)', function () {
            var myLatlng = new google.maps.LatLng(51.501904, -0.115871);

            var g = new OpenLayers.Layer.Google('Google (Transit)', {
                center: myLatlng,
                zoom: 13,
                type: google.maps.MapTypeId.TERRAIN
            });

            setTimeout(function () {
                new google.maps.BicyclingLayer().setMap(g.mapObject);
                new google.maps.TransitLayer().setMap(g.mapObject);
                new google.maps.weather.WeatherLayer().setMap(g.mapObject);
                new google.maps.TrafficLayer().setMap(g.mapObject);
            }, 0);
            return g;
        }),

        new LayerType('google-streetview', 'Google Street View Coverage', function () {
            return new OpenLayers.Layer.OSM('Google Street View Coverage', switch_url('https://mts{switch:0,1,2,3}.googleapis.com/vt?hl=en-US&lyrs=svv|cb_client:apiv3&style=40,21&x=${x}&y=${y}&z=${z}'), layer_options);
        })

        ];

    }; // google layers
    // default options for the city of Berlin    
    var berlin_options = {
        pos: {
            lon: 13.398604,
            lat: 52.520543,
            zoom: 13
        }
    };


    state.layertypes = [

    /* BBBike.de base layers */
    new LayerType('bbbike-bbbike', 'BBBike bbbike', function () {
        return new OpenLayers.Layer.OSM('BBBike bbbike', 'https://tile.bbbike.org/osm/bbbike/${z}/${x}/${y}.png', layer_options)
    }, berlin_options),

    /* BBBike.de overlay layers */
    new LayerType('bbbike-smoothness', 'BBBike smoothness', function () {
        return new OpenLayers.Layer.OSM('BBBike smoothness', 'https://tile.bbbike.org/osm/bbbike-smoothness/${z}/${x}/${y}.png', layer_options);
    }, berlin_options),

    new LayerType('bbbike-handicap', 'BBBike handicap', function () {
        return new OpenLayers.Layer.OSM('BBBike handicap', 'https://tile.bbbike.org/osm/bbbike-handicap/${z}/${x}/${y}.png', layer_options);
    }, berlin_options),

    new LayerType('bbbike-cycle-routes', 'BBBike cycle routes', function () {
        return new OpenLayers.Layer.OSM('BBBike cycle-routes', 'https://tile.bbbike.org/osm/bbbike-cycle-routes/${z}/${x}/${y}.png', layer_options);
    }, berlin_options),

    new LayerType('bbbike-cycleway', 'BBBike cycleway', function () {
        return new OpenLayers.Layer.OSM('BBBike cycleway', 'https://tile.bbbike.org/osm/bbbike-cycleway/${z}/${x}/${y}.png', layer_options);
    }, berlin_options),

    new LayerType('bbbike-green', 'BBBike green', function () {
        return new OpenLayers.Layer.OSM('BBBike green', 'https://tile.bbbike.org/osm/bbbike-green/${z}/${x}/${y}.png', layer_options);
    }, berlin_options),

    new LayerType('bbbike-unlit', 'BBBike unlit', function () {
        return new OpenLayers.Layer.OSM('BBBike unlit', 'https://tile.bbbike.org/osm/bbbike-unlit/${z}/${x}/${y}.png', layer_options);
    }, berlin_options),

    new LayerType('bbbike-unknown', 'BBBike unknown', function () {
        return new OpenLayers.Layer.OSM('BBBike unknown', 'https://tile.bbbike.org/osm/bbbike-unknown/${z}/${x}/${y}.png', layer_options);
    }, berlin_options),

    new LayerType('mapnik', 'OSM Mapnik', function () {
        return new OpenLayers.Layer.OSM.Mapnik("OSM Mapnik");
    }),

    new LayerType('mapnik-german', 'OSM Mapnik (de)', function () {
        return new OpenLayers.Layer.OSM('OSM Mapnik (de)', 'https://tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png', {
            tileOptions: {
                crossOriginKeyword: null
            },
            sphericalMercator: true,
            transitionEffect: "resize",
            numZoomLevels: 20
        });
    }),


/* new API
    new LayerType('mapillary-streetview', 'Mapillary Coverage', function () {
        return new OpenLayers.Layer.OSM('Mapillary Coverage', switch_url('https://d6a1v2w10ny40.cloudfront.net/v0.1/${z}/${x}/${y}.png'), layer_options18);
    }),
    */

    /* Berlin Aerial and Historical Maps */
    new LayerType('berlin-historical-2025-summer', 'Berlin Aerial 2025 TrueO. Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2025 TrueO. Summer', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2025-truedop20rgb/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2025', 'Berlin Aerial 2025 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2025 Spring', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2025-dop20rgb/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2024', 'Berlin Aerial 2024 TrueO. Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2024 TrueO. Summer', 'https://tiles.codefor.de/berlin-2024-dop20rgbi/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2023', 'Berlin Aerial 2023 TrueO. Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2023 TrueO. Summer', switch_url('https://tiles.codefor.de/berlin-2023-dop20rgbi/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2022', 'Berlin Aerial 2022 TrueO. Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2022 TrueO. Spring', switch_url('https://tiles.codefor.de/berlin-2022-dop20rgbi/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2021', 'Berlin Aerial 2021 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2021 Spring', switch_url('https://tiles.codefor.de/berlin-2021-dop20rgbi/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2020', 'Berlin Aerial 2020 Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2020 Summer', switch_url('https://tiles.codefor.de/berlin-2020-dop20rgb//${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2020-truedop', 'Berlin Aerial 2020 TrueO. Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2020 TrueO. Summer', switch_url('https://tiles.codefor.de/berlin-2020-truedop20rgb/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2020-infrared', 'Berlin Aerial 2020 Infrared Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2020 Infrared Summer', switch_url('https://tiles.codefor.de/berlin-2020-dop20cir//${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2020-truedop-infrared', 'Berlin Aerial 2020 TrueO. Infrared Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2020 TrueO. Infrared Summer', switch_url('https://tiles.codefor.de/berlin-2020-truedop20cir/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2019', 'Berlin Aerial 2019 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2019 Spring', switch_url('https://tiles.codefor.de/berlin-2019/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2018', 'Berlin Aerial 2018 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2018 Spring', switch_url('https://tiles.codefor.de/berlin-2018/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2017', 'Berlin Aerial 2017 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2017 Spring', switch_url('https://tiles.codefor.de/berlin-2017/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2016', 'Berlin Aerial 2016 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2016 Spring', switch_url('https://tiles.codefor.de/berlin-2016/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2016-infrared', 'Berlin Aerial 2016 Infrared Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2016 Infrared Spring', switch_url('https://tiles.codefor.de/berlin-2016i/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2015', 'Berlin Aerial 2015 Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2015 Summer', switch_url('https://tiles.codefor.de/berlin-2015/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2015-infrared', 'Berlin Aerial 2015 Infrared Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2015 Infrared Summer', switch_url('https://tiles.codefor.de/berlin-2015-dop20cir/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2014', 'Berlin Aerial 2014 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2014i Spring', switch_url('https://tiles.codefor.de/berlin-2014/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2013', 'Berlin Aerial 2013 TrueO. Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2013 TrueO. Summer', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2013-truedop20rgb/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2011', 'Berlin Aerial 2011 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2011 Spring', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2011-dop20rgb/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2010', 'Berlin Aerial 2010 Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2010 Summer', switch_url('https://tiles.codefor.de/berlin-2010/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2010-infrared', 'Berlin Aerial 2010 Infrared Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2010 Infrared Summer', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2010-dop20cir/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2009', 'Berlin Aerial 2009 Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2009 Summer', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2009-dop20rgb/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2007', 'Berlin Aerial 2007 Spring', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2007i Spring', switch_url('https://tiles.codefor.de/berlin-2007/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2006-bw', 'Berlin Aerial 2006 B/W', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2006 B/W', switch_url('https://tiles.codefor.de/berlin-2006-dop15pan/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2005-infrared', 'Berlin Aerial 2005 Infrared Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2005 Infrared Summer', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2005-dop15cir/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2002-bw', 'Berlin Aerial 2002 B/W', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2002 B/W', 'https://tiles.codefor.de/berlin/geoportal/luftbilder/2002-dop40pan/${z}/${x}/${y}.png', berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-2004', 'Berlin Aerial 2004 Summer', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 2004 Summer', switch_url('https://tiles.codefor.de/berlin-2004/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1953', 'Berlin Aerial 1953 B/W', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 1953 B/W', switch_url('https://tiles.codefor.de/berlin-1953/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1928', 'Berlin Aerial 1928 B/W', function () {
        return new OpenLayers.Layer.OSM('Berlin Aerial 1928 B/W', switch_url('https://tiles.codefor.de/berlin-1928/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),


    new LayerType('berlin-historical-1650', 'Berlin 1650', function () {
        return new OpenLayers.Layer.OSM('Berlin 1650', switch_url('https://tiles.codefor.de/berlin-1650/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1690', 'Berlin 1690', function () {
        return new OpenLayers.Layer.OSM('Berlin 1690', switch_url('https://tiles.codefor.de/berlin-1690/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1750', 'Berlin 1750', function () {
        return new OpenLayers.Layer.OSM('Berlin 1750', switch_url('https://tiles.codefor.de/berlin-1750/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1800', 'Berlin 1800', function () {
        return new OpenLayers.Layer.OSM('Berlin 1800', switch_url('https://tiles.codefor.de/berlin-1800/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1850', 'Berlin 1850', function () {
        return new OpenLayers.Layer.OSM('Berlin 1850', switch_url('https://tiles.codefor.de/berlin-1850/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1880', 'Berlin 1880', function () {
        return new OpenLayers.Layer.OSM('Berlin 1880', switch_url('https://tiles.codefor.de/berlin-1880/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1910', 'Berlin 1910', function () {
        return new OpenLayers.Layer.OSM('Berlin 1910', switch_url('https://tiles.codefor.de/berlin-1910/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1940', 'Berlin 1940', function () {
        return new OpenLayers.Layer.OSM('Berlin 1940', switch_url('https://tiles.codefor.de/berlin-1940/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-1986', 'Berlin 1986', function () {
        return new OpenLayers.Layer.OSM('Berlin 1986', switch_url('https://tiles.codefor.de/berlin-1986/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

/*
    new LayerType('berlin-historical-geo', 'Berlin Geo 1874-1937', function () {
        return new OpenLayers.Layer.OSM('Berlin Geo 1874-1937', switch_url('https://tiles.jochenklar.de/geo/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),
    */

    new LayerType('berlin-historical-hobrecht', 'Berlin Hobrechtplan 1862', function () {
        return new OpenLayers.Layer.OSM('Berlin Hobrechtplan 1862', switch_url('https://tiles.codefor.de/berlin-hobrecht/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-gebschaden', 'Berlin Gebäudeschäden 1945', function () {
        return new OpenLayers.Layer.OSM('Berlin Gebäudeschäden 1945', switch_url('https://tiles.codefor.de/berlin-gebschaden/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-historical-gebaeudealter', 'Berlin Gebäudealter 1992/93', function () {
        return new OpenLayers.Layer.OSM('Berlin Gebäudealter 1992/93', switch_url('https://tiles.codefor.de/berlin-gebaeudealter/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options), /**/

    new LayerType('historicmaps-berlin-1910-straube', 'Berlin Straube 1910', function () {
        return new OpenLayers.Layer.OSM('Berlin Straube 1910', switch_url('https://tiles.codefor.de/berlin-straubeplan/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),

    new LayerType('berlin-k5', 'Berlin 1:5000 K5 Farbe', function () {
        return new OpenLayers.Layer.OSM('Berlin 1:5000 K5 Farbe', switch_url('https://tiles.codefor.de/berlin-k5/${z}/${x}/${y}.png'), berlin_historical_options);
    }, berlin_options),


    new LayerType('geofabrik-standard', 'Geofabrik Standard (OSM)', function () {
        return new OpenLayers.Layer.OSM('Geofabrik Standard (OSM)', "https://tile.geofabrik.de/205678792ae24998a27b9554998082be/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('geofabrik-german', 'Geofabrik German (OSM)', function () {
        return new OpenLayers.Layer.OSM('Geofabrik German (OSM)', "https://tile.geofabrik.de/23228979966ae9040ceb0597251e12a2/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('geofabrik-basic-color', 'Geofabrik Basic Color (OSM)', function () {
        return new OpenLayers.Layer.OSM('Geofabrik Basic Color (OSM)', "https://tile.geofabrik.de/f4b99c53772daf077663f1032c85fb9e/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('geofabrik-basic-greys', 'Geofabrik Basic Greys (OSM)', function () {
        return new OpenLayers.Layer.OSM('Geofabrik Basic Greys (OSM)', "https://tile.geofabrik.de/c92f820ec8abcfd7f51b075e3efa157e/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('geofabrik-basic-pastels', 'Geofabrik Basic Pastels (OSM)', function () {
        return new OpenLayers.Layer.OSM('Geofabrik Basic Pastels (OSM)', "https://tile.geofabrik.de/76dc70b2351eb1f35b88988e68f424a6/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('geofabrik-topo', 'Geofabrik Topo (OSM)', function () {
        return new OpenLayers.Layer.OSM('Geofabrik Topo (OSM)', "https://tile.geofabrik.de/15173cf79060ee4a66573954f6017ab0/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('geofabrik-optitool', 'Optitool Truck (OSM)', function () {
        return new OpenLayers.Layer.OSM('Optitool Truck (OSM)', "https://ha-01.ot-hosting.de:8484/tiles/osm_de_truck/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('sbahnberlin-standard', 'S-Bahn Berlin (OSM)', function () {
        return new OpenLayers.Layer.OSM('S-Bahn Berlin (OSM)', "https://baumgardt-maps.de/bcmap/wmts/sbahn_basis/GLOBAL_WEBMERCATOR/${z}/${x}/${y}.png", berlin_historical_options)
    }),

    new LayerType('vbb-standard', 'VBB (OSM)', function () {
        return new OpenLayers.Layer.OSM('VBB (OSM)', "https://vbb-gis-de-b.haf.as/hafas-tiles/osm/2/${z}/${x}/${y}.png", berlin_historical_options)
    }),

    new LayerType('mappy-map', 'mappy (OSM)', function () {
        return new OpenLayers.Layer.OSM('mappy (OSM)', switch_url("https://map{switch:1,2,3,4}.mappy.net/map/1.0/slab/standard_hd/256/${z}/${x}/${y}"), layer_options);
    }),

    new LayerType('ts-hausnummern', 'Hausnummern Berlin TS (OSM)', function () {
        return new OpenLayers.Layer.OSM('Hausnummern Berlin TS (OSM)', "https://a-dsst-maps.tagesspiegel.de/berlin-hausnummern-retina/${z}/${x}/${y}.png", layer_options)
    }),

    /* Stadia Maps × Stamen Design */
    new LayerType('stamen-toner', 'Stamen Toner (OSM)', function () {
        return new OpenLayers.Layer.OSM('Stamen Toner (OSM)', 'https://tiles.stadiamaps.com/tiles/stamen_toner/${z}/${x}/${y}@2x.png', {
            sphericalMercator: true,
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 20
        });
    }),

    new LayerType('stamen-toner-lite', 'Stamen Toner Lite (OSM)', function () {
        return new OpenLayers.Layer.OSM('Stamen Toner Lite (OSM)', 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/${z}/${x}/${y}@2x.png', {
            sphericalMercator: true,
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 20
        });
    }),

    new LayerType('stamen-terrain', 'Stamen Terrain (OSM)', function () {
        return new OpenLayers.Layer.OSM('Stamen Terrain (OSM)', 'https://tiles.stadiamaps.com/tiles/stamen_terrain/${z}/${x}/${y}@2x.png', {
            sphericalMercator: true,
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 20
        });
    }),

    new LayerType('stamen-watercolor', 'Stamen Watercolor (OSM)', function () {
        return new OpenLayers.Layer.OSM('Stamen Watercolor (OSM)', 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/${z}/${x}/${y}.jpg', {
            sphericalMercator: true,
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 20
        });
    }),

    new LayerType('maptoolkit-topo', 'Maptookit Topo (OSM)', function () {
        return new OpenLayers.Layer.OSM('Maptookit Topo (OSM)', switch_url('https://rtc-cdn.maptoolkit.net/toursprung-hillshading/${z}/${x}/${y}.png?api_key=toursprung'), {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        });
    }),

    new LayerType('opentopomap', 'OSM OpenTopoMap', function () {
        return new OpenLayers.Layer.OSM('OSM OpenTopoMap', switch_url('https://tile.opentopomap.org/${z}/${x}/${y}.png'), {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 16
        });
    }),

    new LayerType('osmbe', 'OSM Belgium', function () {
        return new OpenLayers.Layer.OSM('OSM Belgium', 'https://tile.openstreetmap.be/osmbe/${z}/${x}/${y}.png', layer_options);
    }), new LayerType('osmbe-fr', 'OSM Belgium FR', function () {
        return new OpenLayers.Layer.OSM('OSM Belgium FR', 'https://tile.openstreetmap.be/osmbe-fr/${z}/${x}/${y}.png', layer_options);
    }), new LayerType('osmbe-nl', 'OSM Belgium NL', function () {
        return new OpenLayers.Layer.OSM('OSM Belgium FR', 'https://tile.openstreetmap.be/osmbe-nl/${z}/${x}/${y}.png', layer_options);
    }),

    new LayerType('osmfr', 'OSM FR', function () {
        return new OpenLayers.Layer.OSM('OSM FR', 'https://c.tile.openstreetmap.fr/osmfr/${z}/${x}/${y}.png', layer_options);
    }),

    new LayerType('osmfr-hot', 'OSM FR hot', function () {
        return new OpenLayers.Layer.OSM('OSM FR hot', 'https://a.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png', layer_options);
    }),

    new LayerType('osmfr-openriverboatmap', 'OSM FR openriverboatmap', function () {
        return new OpenLayers.Layer.OSM('OSM FR hot openriverboatmap', 'https://c.tile.openstreetmap.fr/openriverboatmap/${z}/${x}/${y}.png', layer_options);
    }),

    new LayerType('osmfr-breton', 'OSM FR breton', function () {
        return new OpenLayers.Layer.OSM('OSM FR breton', "https://tile.openstreetmap.bzh/br/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('lightningmaps-standard', 'Lightningmaps standard', function () {
        return new OpenLayers.Layer.OSM('Lightningmaps', ["https://tiles.lightningmaps.org/?x=${x}&y=${y}&z=${z}&s=256&t=5&T=13334890"], layer_options);
    }),

    new LayerType('wigle-wifi', 'WiGLE WI-FI', function () {
        return new OpenLayers.Layer.OSM('WiGLE WI-FI', "https://www.wigle.net/tile?tileX=${x}&tileY=${y}&tileZoom=${z}", layer_options);
    }),

    new LayerType('bvg-standard', 'BVG (OSM)', function () {
        return new OpenLayers.Layer.OSM('BVG (OSM)', "https://bvg-gis-c.hafas.de/hafas-tiles/inno2017/2/${z}/${x}/${y}.png", berlin_historical_options)
    }),

    new LayerType('bvg-stadtplan-10', 'BVG (level 10)', function () {
        return new OpenLayers.Layer.OSM('BVG', ["https://stadtplan.bvg.de/api/data/10/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 17
        })
    }),

    new LayerType('bvg-stadtplan', 'BVG (level 20)', function () {
        return new OpenLayers.Layer.OSM('BVG', ["https://stadtplan.bvg.de/api/data/20/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 17
        })
    }),

    new LayerType('bvg-stadtplan-50', 'BVG (level 50)', function () {
        return new OpenLayers.Layer.OSM('BVG', ["https://stadtplan.bvg.de/api/data/50/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 14 /* min zoom: 10 */
        })
    }),

    new LayerType('waze-world', 'Waze (World)', function () {
        return new OpenLayers.Layer.OSM('Waze', switch_url("https://www.waze.com/row-tiles/live/base/${z}/${x}/${y}/tile.png?highres=true"), layer_options);
    }),

    new LayerType('osm-ch-standard', 'OSM CH standard', function () {
        return new OpenLayers.Layer.OSM('OSM CH standard', ["https://tile.osm.ch/switzerland/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 22
        })
    }),

    new LayerType('osm-ch-swiss', 'OSM CH swiss', function () {
        return new OpenLayers.Layer.OSM('OSM CH swiss', ["https://tile.osm.ch/osm-swiss-style/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 22
        })
    }),


    new LayerType('visitnorway-standard', 'Visitnorway', function () {
        return new OpenLayers.Layer.OSM('Visitnorway', switch_url('https://services.geodataonline.no/arcgis/rest/services/Geocache_WMAS_WGS84/GeocacheBasis/MapServer/tile/${z}/${y}/${x}'), layer_options);
    }),

    // https://maps.openstreetmap.ie
/* site is down
    new LayerType('osm-ie-ga', 'OSM IE Gaelic', function () {
        return new OpenLayers.Layer.OSM('OSM IE Gaelic', switch_url('https://tile.openstreetmap.ie/ga/${z}/${x}/${y}.png'), layer_options);
    }),
    */


    /* Thunderforest */

    new LayerType('cyclemap', 'OSM OpenCycleMap', function () {
        return new OpenLayers.Layer.OSM('OSM OpenCycleMap (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/cycle/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),


    new LayerType('thunderforest-landscape', 'Thunderforest Landscape (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Landscape (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/landscape/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('thunderforest-transport', 'Thunderforest Transport (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Transport (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/transport/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('thunderforest-cyclemap', 'Thunderforest Cycle (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Cycle (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/cycle/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }), /**/

    new LayerType('thunderforest-outdoors', 'Thunderforest Outdoors (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Outdoors (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/outdoors/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('thunderforest-transport-dark', 'Thunderforest Transport Dark (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Transport Dark (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/transport-dark/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('thunderforest-pioneer', 'Thunderforest Pioneer railroad (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Pioneer railroad (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/pioneer/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('thunderforest-spinal-map', 'Thunderforest Spinal Map (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Spinal Map (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/spinal-map/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('thunderforest-neighbourhood', 'Thunderforest Neighbourhood (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Neighbourhood (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/neighbourhood/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('thunderforest-mobile-atlas', 'Thunderforest Mobile Atlas (OSM)', function () {
        return new OpenLayers.Layer.OSM('Thunderforest Mobile Atlas (OSM)', switch_url("https://{switch:a,b,c}.tile.thunderforest.com/mobile-atlas/${z}/${x}/${y}@2x.png?apikey=6170aad10dfd42a38d4d8c709a536f38"), layer_options);
    }),

    new LayerType('f4map', 'F4map (OSM)', function () {
        return new OpenLayers.Layer.OSM('F4map (OSM)', switch_url("https://tile{switch:1,2,3,4}.f4map.com/tiles/f4_2d/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('cyclosm', 'OSM CyclOSM', function () {
        return new OpenLayers.Layer.OSM('OSM CyclOSM', "https://c.tile-cyclosm.openstreetmap.fr/cyclosm/${z}/${x}/${y}.png", layer_options);
    }),

/* only latvia 
    new LayerType('openmap-public-transport', 'OpenMap Public Transport', function () {
        return new OpenLayers.Layer.OSM('OpenMap Public Transport', "https://pt.openmap.lt/${z}/${x}/${y}.png", layer_options);
    }),
    */

    new LayerType('public_transport', 'OSM Public Transport', function () {
        return new OpenLayers.Layer.OSM("OSM OEPNV", ["https://tile.memomaps.de/tilegen/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('oepnv-brandenburg', 'ÖPNVmap Brandenburg', function () {
        return new OpenLayers.Layer.OSM("ÖPNVmap Brandenburg", ["https://map-oepnv.de/xyz_tiles/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 16
        })
    }),


    new LayerType('openrailwaymap-standard', 'OpenRailwayMap Stand.', function () {
        return new OpenLayers.Layer.OSM("OSM OpenRailwayMap Stand.", switch_url("https://{switch:a,b,c}.tiles.openrailwaymap.org/standard/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('openrailwaymap-maxspeed', 'OpenRailwayMap Max Speed', function () {
        return new OpenLayers.Layer.OSM("OSM OpenRailwayMap Max Speed", switch_url("https://{switch:a,b,c}.tiles.openrailwaymap.org/maxspeed/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('openrailwaymap-signalling', 'OpenRailwayMap Signal.', function () {
        return new OpenLayers.Layer.OSM("OSM OpenRailwayMap Signal.", switch_url("https://{switch:a,b,c}.tiles.openrailwaymap.org/signals/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('openrailwaymap-electrification', 'OpenRailwayMap Electrif.', function () {
        return new OpenLayers.Layer.OSM("OSM OpenRailwayMap Electrif.", switch_url("https://{switch:a,b,c}.tiles.openrailwaymap.org/electrification/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('openrailwaymap-gauge', 'OpenRailwayMap Track Gauge', function () {
        return new OpenLayers.Layer.OSM("OSM OpenRailwayMap Track Gauge", switch_url("https://{switch:a,b,c}.tiles.openrailwaymap.org/gauge/${z}/${x}/${y}.png"), layer_options);
    }),

    // https://allrailmap.com
    new LayerType('allrailmap-standard', 'AllRailMap (OSM)', function () {
        return new OpenLayers.Layer.OSM("AllRailMap (OSM)", "https://map.allrailmap.com/rail/${z}/${x}/${y}.png", layer_options);
    }),

    // Clockwork Micro
    new LayerType('clockwork-streets', 'Clockwork Micro Streets (OSM)', function () {
        return new OpenLayers.Layer.OSM("Clockwork Micro Streets (OSM)", ["https://maps.clockworkmicro.com/streets/v1/raster/${z}/${x}/${y}?x-api-key=2d33HqvhuU3z6lPsPOqQR6Zwl2LQ2pmo9NnWbboL"], layer_options);
    }),

    new LayerType('clockwork-terrain-hillshade', 'Clockwork Micro Terrain Hillshade', function () {
        return new OpenLayers.Layer.OSM("Clockwork Micro Terrain Hillshade", ["https://layer.clockworkmicro.com/v1/terrainlayers?z=${z}&x=${x}&y=${y}&transform_type=hillshade&x-api-key=2d33HqvhuU3z6lPsPOqQR6Zwl2LQ2pmo9NnWbboL"], layer_options);
    }),

    new LayerType('clockwork-terrain-slope', 'Clockwork Micro Terrain Slope', function () {
        return new OpenLayers.Layer.OSM("Clockwork Micro Terrain Slope", ["https://layer.clockworkmicro.com/v1/terrainlayers?z=${z}&x=${x}&y=${y}&transform_type=slope&x-api-key=2d33HqvhuU3z6lPsPOqQR6Zwl2LQ2pmo9NnWbboL"], layer_options);
    }),

    new LayerType('clockwork-terrain-aspect', 'Clockwork Micro Terrain Aspect', function () {
        return new OpenLayers.Layer.OSM("Clockwork Micro Terrain Aspect", ["https://layer.clockworkmicro.com/v1/terrainlayers?z=${z}&x=${x}&y=${y}&transform_type=aspect&x-api-key=2d33HqvhuU3z6lPsPOqQR6Zwl2LQ2pmo9NnWbboL"], layer_options);
    }),

    new LayerType('clockwork-terrain-raw', 'Clockwork Micro Terrain Raw', function () {
        return new OpenLayers.Layer.OSM("Clockwork Micro Terrain Raw", ["https://layer.clockworkmicro.com/v1/terrainlayers?z=${z}&x=${x}&y=${y}&transform_type=raw&x-api-key=2d33HqvhuU3z6lPsPOqQR6Zwl2LQ2pmo9NnWbboL"], layer_options);
    }),

    new LayerType('clockwork-topo', 'Clockwork Micro Topo (USGS)', function () {
        return new OpenLayers.Layer.OSM("Clockwork Micro Topo (USGS)", ["https://topo.clockworkmicro.com/v2/${z}/${x}/${y}.png?x-api-key=2d33HqvhuU3z6lPsPOqQR6Zwl2LQ2pmo9NnWbboL"], layer_options);
    }),



    new LayerType('cymru-basic', 'OSM Cymru/Welsh', function () {
        return new OpenLayers.Layer.OSM('OSM Cymru/Welsh', switch_url("https://openstreetmap.cymru/osm_tiles/${z}/${x}/${y}.png"), layer_options);
    }),

    // No HTTPS
    new LayerType('wanderreitkarte', 'OSM Wanderreitkarte', function () {
        return new OpenLayers.Layer.OSM("OSM Wanderreitkarte", ["https://www.wanderreitkarte.de/topo/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('openseamap-seamark', 'OSM OpenSeaMap', function () {
        return new OpenLayers.Layer.OSM('OSM OpenSeaMap', switch_url("https://tiles.openseamap.org/seamark/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('kartogiraffe-map', 'Kartogiraffe Map (OSM)', function () {
        return new OpenLayers.Layer.OSM('Kartogiraffe Map (OSM)', "https://www.kartogiraffe.de/tiles/map/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('tomtom-sat', 'Bing Aerial', function () {
        return new OpenLayers.Layer.Bing(OpenLayers.Util.extend({
            initLayer: function () {
                if (this.metadata.resourceSets.length > 0) {
                    this.metadata.resourceSets[0].resources[0].zoomMin = 0;
                    OpenLayers.Layer.Bing.prototype.initLayer.apply(this, arguments);
                }
            }
        }, {
            key: BingApiKey,
            type: "Aerial",
            numZoomLevels: 18
        }));
    }),


    // you may get warnings in the browser console because the esri server returns a wrong mime type image/jpg instead image/jpeg
/* ESRI Basemaps
     *
     * https://help.arcgis.com/en/arcgisserver/10.0/help/datamaps/index.html#//00v900000005000000.htm
     */
    new LayerType('esri', 'Esri', function () {
        return new OpenLayers.Layer.OSM('Esri', "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}.jpg", layer_options);
    }),

    new LayerType('esri-satellite', 'Esri Satellite', function () {
        return new OpenLayers.Layer.OSM('Esri Satellite', "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}.jpg", layer_options);
    }),

    new LayerType('esri-physical', 'Esri Physical', function () {
        return new OpenLayers.Layer.OSM('Esri Physical', "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/${z}/${y}/${x}.jpg", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 9
        })
    }),

    new LayerType('esri-shaded-relief', 'Esri Shaded Relief', function () {
        return new OpenLayers.Layer.OSM('Esri Shaded Relief', "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/${z}/${y}/${x}.jpg", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 13
        })
    }),

    new LayerType('esri-terrain-base', 'Esri Terrain', function () {
        return new OpenLayers.Layer.OSM('Esri Terrain', "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/${z}/${y}/${x}.jpg", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 10
        })
    }),

    new LayerType('esri-topo', 'Esri Topo', function () {
        return new OpenLayers.Layer.OSM('Esri Topo', "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}.jpg", layer_options);
    }),

    new LayerType('esri-topo-usa', 'Esri Topo USA', function () {
        return new OpenLayers.Layer.OSM('Esri Topo USA', "https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/${z}/${y}/${x}.jpg", layer_options);
    }),

    new LayerType('esri-gray', 'Esri Gray', function () {
        return new OpenLayers.Layer.OSM('Esri Gray', "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${z}/${y}/${x}.jpg", layer_options);
    }),

    new LayerType('esri-natgeo', 'Esri National Geographic', function () {
        return new OpenLayers.Layer.OSM('Esri National Geographic', "https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/${z}/${y}/${x}.jpg", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 13
        });
    }),

    new LayerType('esri-ocean', 'Esri Ocean', function () {
        return new OpenLayers.Layer.OSM('Esri Ocean', "https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/${z}/${y}/${x}.jpg", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 11
        });
    }),


/*
     *   ESRI Reference layers
     *
     */

    new LayerType('esri-boundaries-places', 'Esri Boundaries & Places', function () {
        return new OpenLayers.Layer.OSM('Esri Boundaries & Places', "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}.jpg", layer_options);
    }),

    new LayerType('esri-reference-overlay', 'Esri Reference Overlay', function () {
        return new OpenLayers.Layer.OSM('Esri Reference Overlay', "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/${z}/${y}/${x}.jpg", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 10
        })
    }),

    new LayerType('esri-transportation', 'Esri Transportation', function () {
        return new OpenLayers.Layer.OSM('Esri Transportation', "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${z}/${y}/${x}.jpg", layer_options);
    }),

    // No HTTPS "http://gsp2.apple.com/tile?api=1&style=slideshow&layers=default&lang=de_DE&z=${z}&x=${x}&y=${y}&v=9"
    new LayerType('apple-iphoto', 'Apple iPhoto (OSM)', function () {
        return new OpenLayers.Layer.OSM('Apple iPhoto (OSM)', "https://y.tile.bbbike.org/tile?api=1&style=slideshow&layers=default&lang=de_DE&z=${z}&x=${x}&y=${y}&v=9", {
            tileOptions: {
                crossOriginKeyword: null
            },
            sphericalMercator: true,
            numZoomLevels: 15
        });
    }),


    new LayerType('skobbler', 'Skobbler (OSM)', function () {
        return new OpenLayers.Layer.OSM('Skobbler (OSM)', switch_url("https://tiles{switch:1,2,3,4}-bc7b4da77e971c12cb0e069bffcf2771.skobblermaps.com/TileService/tiles/2.0/01021113210/7/${z}/${x}/${y}.png@2x?traffic=false"), layer_options);
    }),

    // https://tiles4-bc7b4da77e971c12cb0e069bffcf2771.skobblermaps.com/TileService/tiles/2.0/01021113210/7/6/31/24.png@2x?traffic=false
    new LayerType('skobbler-lite', 'Skobbler Lite (OSM)', function () {
        return new OpenLayers.Layer.OSM('Skobbler Lite (OSM)', switch_url("https://tiles{switch:1,2,3,4}-bc7b4da77e971c12cb0e069bffcf2771.skobblermaps.com/TileService/tiles/2.0/01021113210/7/${z}/${x}/${y}.png@2x?traffic=false"), layer_options);
    }),

    new LayerType('skobbler-day', 'Skobbler Day (OSM)', function () {
        return new OpenLayers.Layer.OSM('Skobbler Day (OSM)', switch_url("https://tiles{switch:1,2,3,4}-bc7b4da77e971c12cb0e069bffcf2771.skobblermaps.com/TileService/tiles/2.0/01021113210/0/${z}/${x}/${y}.png@2x?traffic=false"), layer_options);
    }),

    new LayerType('skobbler-night', 'Skobbler Night (OSM)', function () {
        return new OpenLayers.Layer.OSM('Skobbler Night (OSM)', switch_url("https://tiles{switch:1,2,3,4}-bc7b4da77e971c12cb0e069bffcf2771.skobblermaps.com/TileService/tiles/2.0/01021113210/2/${z}/${x}/${y}.png@2x?traffic=false"), layer_options);
    }),

    new LayerType('skobbler-outdoor', 'Skobbler Outdoor (OSM)', function () {
        return new OpenLayers.Layer.OSM('Skobbler Outdoor (OSM)', switch_url("https://tiles{switch:1,2,3,4}-bc7b4da77e971c12cb0e069bffcf2771.skobblermaps.com/TileService/tiles/2.0/01021113210/5/${z}/${x}/${y}.png@2x?traffic=false"), layer_options);
    }),


    /* Strava */
    new LayerType('strava-water', 'Strava Water', function () {
        return new OpenLayers.Layer.OSM('Strava Water', "https://heatmap-external-a.strava.com/tiles/water/hot/${z}/${x}/${y}.png", layer_options12);
    }),

    new LayerType('strava-ride', 'Strava Ride', function () {
        return new OpenLayers.Layer.OSM('Strava Ride', "https://heatmap-external-a.strava.com/tiles/ride/hot/${z}/${x}/${y}.png", layer_options12);
    }),

    new LayerType('strava-run', 'Strava Run', function () {
        return new OpenLayers.Layer.OSM('Strava Run', "https://heatmap-external-a.strava.com/tiles/run/hot/${z}/${x}/${y}.png", layer_options12);
    }),

    new LayerType('strava-winter', 'Strava Winter', function () {
        return new OpenLayers.Layer.OSM('Strava Winter', "https://heatmap-external-a.strava.com/tiles/winter/blue/${z}/${x}/${y}.png", layer_options12);
    }),


    new LayerType('wheregroup-lyrk', 'WhereGroup Lyrk (OSM)', function () {
        return new OpenLayers.Layer.OSM('WhereGroup Lyrk (OSM)', switch_url("https://osm-demo-{switch:a,b,c}.wheregroup.com/tiles/1.0.0/osm/webmercator/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('osm-gps', 'OSM GPS', function () {
        return new OpenLayers.Layer.OSM('OSM GPS', switch_url("https://gps-tile.openstreetmap.org/lines/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('carto-positron', 'Carto Positron (OSM)', function () {
        return new OpenLayers.Layer.OSM('Carto Positron (OSM)', switch_url("https://{switch:a,b,c,d}.basemaps.cartocdn.com/light_all/${z}/${x}/${y}@2x.png"), layer_options);
    }),

    new LayerType('carto-darkmatter', 'Carto Dark Matter (OSM)', function () {
        return new OpenLayers.Layer.OSM('Carto Dark Matter (OSM)', switch_url("https://{switch:a,b,c,d}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png"), layer_options);
    }),

    new LayerType('carto-light-nolabels', 'Carto Light No Labels', function () {
        return new OpenLayers.Layer.OSM('Carto Light No Labels', switch_url("https://{switch:a,b,c,d}.basemaps.cartocdn.com/light_nolabels/${z}/${x}/${y}@2x.png"), layer_options);
    }),

    new LayerType('carto-voyager', 'Carto Voyager', function () {
        return new OpenLayers.Layer.OSM('Carto Voyager', switch_url("https://{switch:a,b,c,d}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png"), layer_options);
    }),

    // https://w1.outdooractive.com/map/v1/png/osm/11/1086/719/t.png?project=api-dev-oa
    new LayerType('outdooractive-summer-osm', 'Outdooractive Summer (OSM)', function () {
        return new OpenLayers.Layer.OSM('Outdooractive Summer (OSM)', switch_url("https://w{switch:1,2,3}.outdooractive.com/map/v1/png/osm/${z}/${x}/${y}/t.png?project=api-dev-oa"), layer_options);
    }),

    new LayerType('outdooractive-winter-osm', 'Outdooractive Winter (OSM)', function () {
        return new OpenLayers.Layer.OSM('Outdooractive Winter (OSM)', switch_url("https://w{switch:1,2,3}.outdooractive.com/map/v1/png/osm_winter/${z}/${x}/${y}/t.png?project=api-dev-oa"), layer_options);
    }),

    new LayerType('outdooractive-summer', 'Outdooractive Summer', function () {
        return new OpenLayers.Layer.OSM('Outdooractive Summer', switch_url("https://w{switch:1,2,3}.outdooractive.com/map/v1/png/oac/${z}/${x}/${y}/t.png?project=api-dev-oa"), layer_options);
    }),

    new LayerType('outdooractive-winter', 'Outdooractive Winter', function () {
        return new OpenLayers.Layer.OSM('Outdooractive Winter', switch_url("https://w{switch:1,2,3}.outdooractive.com/map/v1/png/oac_winter/${z}/${x}/${y}/t.png?project=api-dev-oa"), layer_options);
    }),

    // No HTTPS
    new LayerType('opensnowmap', 'OSM OpenSnowMap base', function () {
        return new OpenLayers.Layer.OSM('OSM OpenSnowMap base', switch_url("https://tiles.opensnowmap.org/base_snow_map/${z}/${x}/${y}.png"), layer_options);
    }), new LayerType('opensnowmap-ski-pistes', 'OSM OpenSnowMap ski pistes', function () {
        return new OpenLayers.Layer.OSM('OSM OpenSnowMap pki pistes', switch_url("https://tiles.opensnowmap.org/pistes/${z}/${x}/${y}.png"), layer_options);
    }),


    new LayerType('sigma-cycle', 'Sigma Cycle (OSM)', function () {
        return new OpenLayers.Layer.OSM('OSM Sigma Cycle', switch_url("https://tiles1.sigma-dc-control.com/layer5/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('sigma-topo', 'Sigma Topo (OSM)', function () {
        return new OpenLayers.Layer.OSM('OSM Sigma Topo', switch_url("https://tiles1.sigma-dc-control.com/layer8/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('geodatenzentrum-color', 'Geodatenzentrum Color', function () {
        return new OpenLayers.Layer.OSM('Geodatenzentrum Color', switch_url("https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_farbe/default/GLOBAL_WEBMERCATOR/${z}/${y}/${x}.png"), layer_options);
    }),

    new LayerType('geodatenzentrum-grey', 'Geodatenzentrum Grey', function () {
        return new OpenLayers.Layer.OSM('Geodatenzentrum Grey', switch_url("https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_grau/default/GLOBAL_WEBMERCATOR/${z}/${y}/${x}.png"), layer_options);
    }),

    new LayerType('geodatenzentrum-combshade', 'Geodatenzentrum Combshade', function () {
        return new OpenLayers.Layer.OSM('Geodatenzentrum Combshade', switch_url("https://sgx.geodatenzentrum.de/wmts_basemapde_schummerung/tile/1.0.0/de_basemapde_web_raster_combshade/default/GLOBAL_WEBMERCATOR/${z}/${y}/${x}.png"), layer_options);
    }),

    new LayerType('geodatenzentrum-colordem', 'Geodatenzentrum ColorDEM', function () {
        return new OpenLayers.Layer.OSM('Geodatenzentrum ColorDEM', switch_url("https://sgx.geodatenzentrum.de/wmts_basemapde_schummerung/tile/1.0.0/de_basemapde_web_raster_colordem/default/GLOBAL_WEBMERCATOR/${z}/${y}/${x}.png"), layer_options);
    }),

    new LayerType('geodatenzentrum-hillshade', 'Geodatenzentrum Hillshade', function () {
        return new OpenLayers.Layer.OSM('Geodatenzentrum Hillshade', switch_url("https://sgx.geodatenzentrum.de/wmts_basemapde_schummerung/tile/1.0.0/de_basemapde_web_raster_hillshade/default/GLOBAL_WEBMERCATOR/${z}/${y}/${x}.png"), layer_options);
    }),

    new LayerType('geodatenzentrum-topplusopen', 'Geodatenzentrum TopPlusOpen', function () {
        return new OpenLayers.Layer.OSM('Geodatenzentrum TopPlusOpen', switch_url("https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/${z}/${y}/${x}.png"), layer_options);
    }),

    new LayerType('mapilion-kurviger-liberty', 'Mapilion Kurviger Liberty', function () {
        return new OpenLayers.Layer.OSM('Mapilion Kurviger Liberty', "https://a-tiles.mapilion.com/raster/styles/kurviger-liberty/${z}/${x}/${y}@2x.png?key=b582abd4-d55d-4cb1-8f34-f4254cd52aa7", layer_options);
    }),

    new LayerType('floodmap-basic', 'Floodmap Basic', function () {
        return new OpenLayers.Layer.OSM('Floodmap Basic', "https://www.floodmap.net/getFMTile.ashx?x=${x}&y=${y}&z=${z}&e=400", layer_options);
    }),

    new LayerType('basemap-standard', 'Basemap.at Standard', function () {
        return new OpenLayers.Layer.WMTS({
            name: "basemap.at",
            url: "https://mapsneu.wien.gv.at/basemap/geolandbasemap/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
            layer: "geolandbasemap",
            matrixSet: "google3857",
            requestEncoding: "REST",
            style: "normal",
            numZoomLevels: 21,
            isBaseLayer: true
        });
    }),

    new LayerType('basemap-retina', 'Basemap.at Retina', function () {
        return new OpenLayers.Layer.WMTS({
            name: "basemap.at",
            url: "https://mapsneu.wien.gv.at/basemap/bmaphidpi/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg",
            layer: "bmaphidpi",
            matrixSet: "google3857",
            requestEncoding: "REST",
            style: "normal",
            numZoomLevels: 20,
            isBaseLayer: true
        });
    }),

    new LayerType('basemap-grey', 'Basemap.at Grey', function () {
        return new OpenLayers.Layer.WMTS({
            name: "basemap.at",
            url: "https://mapsneu.wien.gv.at/basemap/bmapgrau/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
            layer: "bmapgrau",
            matrixSet: "google3857",
            requestEncoding: "REST",
            style: "normal",
            numZoomLevels: 20,
            isBaseLayer: true
        });
    }),

    new LayerType('basemap-sat', 'Basemap.at Satellite', function () {
        return new OpenLayers.Layer.WMTS({
            name: "basemap.at",
            url: "https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg",
            layer: "bmaporthofoto30cm",
            matrixSet: "google3857",
            requestEncoding: "REST",
            style: "normal",
            numZoomLevels: 21,
            isBaseLayer: true
        });
    }),

    new LayerType('bergfex-oek', 'Bergfex (OEK)', function () {
        return new OpenLayers.Layer.OSM('Bergfex (OEK)', switch_url("https://tiles.bergfex.at/styles/bergfex-oek/${z}/${x}/${y}@2x.jpg"), {
            tileOptions: {
                crossOriginKeyword: null
            },
            sphericalMercator: true,
            // buffer: 0,
            transitionEffect: "resize",
            numZoomLevels: 16
        });
    }, {
        pos: {
            lon: 16.386744,
            lat: 48.201766,
            zoom: 14
        }
    }),

    new LayerType('bergfex-osm', 'Bergfex (OSM)', function () {
        return new OpenLayers.Layer.OSM('Bergfex (OSM)', switch_url("https://tiles.bergfex.at/styles/bergfex-osm/${z}/${x}/${y}@2x.jpg"), {
            tileOptions: {
                crossOriginKeyword: null
            },
            sphericalMercator: true,
            // buffer: 0,
            transitionEffect: "resize",
            numZoomLevels: 16
        });
    }),

    new LayerType('yandex-satellite', "Yandex Satellite", function () {
        return new OpenLayers.Layer.TMS("Yandex Satellite", "", {
            maxExtent: YandexBounds,
            maxResolution: 156543.0339,
            href: "https://sat01.maps.yandex.net/tiles?l=sat&v=1.35.0",
            getURL: yandex_getTileURL,
            isBaseLayer: true,
            projection: new OpenLayers.Projection("EPSG:900913"),
            numZoomLevels: 19
        });
    }),

    // plan.tomtom.com
    // raster tiles, PNG
    new LayerType('tomtom-basic', 'TomTom Standard', function () {
        return new OpenLayers.Layer.OSM('TomTom Standard', 'https://d.api.tomtom.com/map/1/tile/basic/main/${z}/${x}/${y}.png?key=VKrqFdARVAJe0uCbON8UxpkzlWdPhY4T&tileSize=256', layer_options22);
    }),

    new LayerType('tomtom-basic-night', 'TomTom Standard Night', function () {
        return new OpenLayers.Layer.OSM('TomTom Standard', 'https://d.api.tomtom.com/map/1/tile/basic/night/${z}/${x}/${y}.png?key=VKrqFdARVAJe0uCbON8UxpkzlWdPhY4T&tileSize=512', layer_options22);
    }),

    new LayerType('tomtom-hybrid', 'TomTom Hybrid', function () {
        return new OpenLayers.Layer.OSM('TomTom Hybrid', 'https://d.api.tomtom.com/map/1/tile/hybrid/main/${z}/${x}/${y}.png?key=VKrqFdARVAJe0uCbON8UxpkzlWdPhY4T&tileSize=512', layer_options22);
    }),

    new LayerType('tomtom-labels', 'TomTom Labels', function () {
        return new OpenLayers.Layer.OSM('TomTom Labels', 'https://d.api.tomtom.com/map/1/tile/labels/main/${z}/${x}/${y}.png?key=VKrqFdARVAJe0uCbON8UxpkzlWdPhY4T&tileSize=512', layer_options22);
    }),

    new LayerType('tomtom-hillshade', 'TomTom Hillshade', function () {
        return new OpenLayers.Layer.OSM('TomTom Hill', 'https://d.api.tomtom.com/map/1/tile/hill/main/${z}/${x}/${y}.png?key=VKrqFdARVAJe0uCbON8UxpkzlWdPhY4T', layer_options12);
    }),

    // JPG images
    new LayerType('tomtom-sat', 'TomTom Satellite', function () {
        return new OpenLayers.Layer.OSM('TomTom Satellite', 'https://d.api.tomtom.com/map/1/tile/sat/main/${z}/${x}/${y}.jpg?key=VKrqFdARVAJe0uCbON8UxpkzlWdPhY4T', layer_options);
    }),

    new LayerType('waymarkedtrails-hiking', 'OSM Trails Hiking', function () {
        return new OpenLayers.Layer.OSM("OSM Hiking Waymarkedtrails", ["https://tile.waymarkedtrails.org/hiking/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('waymarkedtrails-cycling', 'OSM Trails Cycling', function () {
        return new OpenLayers.Layer.OSM("OSM Trails Cycling", ["https://tile.waymarkedtrails.org/cycling/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('waymarkedtrails-mtb', 'OSM Trails MTB', function () {
        return new OpenLayers.Layer.OSM("OSM Trails MTB", ["https://tile.waymarkedtrails.org/mtb/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('waymarkedtrails-skating', 'OSM Trails Skating', function () {
        return new OpenLayers.Layer.OSM("OSM Trails Skating", ["https://tile.waymarkedtrails.org/skating/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('waymarkedtrails-riding', 'OSM Trails Riding', function () {
        return new OpenLayers.Layer.OSM("OSM Trails Riding", ["https://tile.waymarkedtrails.org/riding/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('waymarkedtrails-slopes', 'OSM Trails Slopes', function () {
        return new OpenLayers.Layer.OSM("OSM Trails Slopes", ["https://tile.waymarkedtrails.org/slopes/${z}/${x}/${y}.png"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 18
        })
    }),

    new LayerType('slub-maptiler-basic', 'SLUB (OSM)', function () {
        return new OpenLayers.Layer.OSM('SLUB (OSM)', "https://tile-4.kartenforum.slub-dresden.de/styles/maptiler-basic-v2/${z}/${x}/${y}@2x.png", layer_options);
    }),

    new LayerType('mtbmap', 'MTB map (OSM)', function () {
        return new OpenLayers.Layer.OSM('MTB map (OSM)', "https://tile.mtbmap.cz/mtbmap_tiles/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('mtbmap-norway', 'MTB map Norway (OSM)', function () {
        return new OpenLayers.Layer.OSM('MTB map Norway (OSM)', "https://mtbmap.no/tiles/osm/mtbmap/${z}/${x}/${y}.jpg", layer_options);
    }),


    new LayerType('tracestrack-lang-default', 'Tracestrack default lang (OSM)', function () {
        return new OpenLayers.Layer.OSM('Tracestrack default lang (OSM)', switch_url("https://tile.tracestrack.com/_/${z}/${x}/${y}.png?key=d9344714a8fbf28773ce4c955ea8adfb"), layer_options);
    }),

    new LayerType('tracestrack-lang-en', 'Tracestrack Dark English (OSM)', function () {
        return new OpenLayers.Layer.OSM('Tracestrack English OSM)', switch_url("https://tile.tracestrack.com/en/${z}/${x}/${y}.png?key=d9344714a8fbf28773ce4c955ea8adfb&style=dark"), layer_options);
    }),

    new LayerType('tracestrack-topo', 'Tracestrack Topo (OSM)', function () {
        return new OpenLayers.Layer.OSM('Tracestrack English OSM)', switch_url("https://tile.tracestrack.com/topo__/${z}/${x}/${y}.png?key=d9344714a8fbf28773ce4c955ea8adfb"), layer_options);
    }),

    new LayerType('relief', 'Relief SRTM', function () {
        return new OpenLayers.Layer.OSM("Relief SRTM", ["https://maps-for-free.com/layer/relief/z${z}/row${y}/${z}_${x}-${y}.jpg"], {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 12
        })
    }),

    // HistoMap Berlin Mitte, Rosenthaler Vorstadt: Kartenblatt 4236
    new LayerType('histomapberlin-4236-1935', 'HistoMap Berlin 4236/1935', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4236/1935', "", {
            // tileOptions: { crossOriginKeyword: null },
            layers: '4236_1935',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4236-1946', 'HistoMap Berlin 4236/1946', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4236/1946', "", {
            layers: '4236_1946',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4236-1966-ost', 'HistoMap Berlin 4236/1966 Ost', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4236/1966 Ost', "", {
            layer_dir: 'k5_historical',
            layers: '423_B_1966',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4236-1984-ost', 'HistoMap Berlin 4236/1984 Ost', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4236/1984', "", {
            layer_dir: 'k5_historical',
            layers: '423_B_1984',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4236-1988-west', 'HistoMap Berlin 4236/1988 West', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4236/1988 West', "", {
            layers: '4236_1988',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4236-1988-ost', 'HistoMap Berlin 4236/1988 Ost', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4236/1988 Ost', "", {
            layer_dir: 'k5_historical',
            layers: '423_B_1988',
            getURL: histomapberlin_getTileURL
        });
    }),

    // HistoMap Berlin Reinickendorf: Kartenblatt 4338
    new LayerType('histomapberlin-4338-1935', 'HistoMap Berlin 4338/1935', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1935', "", {
            layers: '4338_1935',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4338-1938', 'HistoMap Berlin 4338/1938', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1938', "", {
            layers: '4338_1938',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4338-1948', 'HistoMap Berlin 4338/1948', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1948', "", {
            layers: '4338_1948',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4338-1954', 'HistoMap Berlin 4338/1954', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1954', "", {
            layers: '4338_1954_M',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4338-1967', 'HistoMap Berlin 4338/1967 Ost', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1967 Ost', "", {
            layer_dir: 'k5_historical',
            layers: '433_A_1967',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4338-1974', 'HistoMap Berlin 4338/1974 West', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1974 West', "", {
            layers: '4338_1974',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4338-1979', 'HistoMap Berlin 4338/1979 Ost', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1979 Ost', "", {
            layer_dir: 'k5_historical',
            layers: '433_A_1979',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4338-1986', 'HistoMap Berlin 4338/1986 Ost', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4338/1986', "", {
            layer_dir: 'k5_historical',
            layers: '433_A_1986',
            getURL: histomapberlin_getTileURL
        });
    }),

    // HistoMap Berlin Friedrichshain: Kartenblatt 4223_1956
    new LayerType('histomapberlin-4223-1928', 'HistoMap Berlin 4223/1928', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4223/1928', "", {
            layers: '4223_1928',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4223-1928', 'HistoMap Berlin 4223/1928', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4223/1928', "", {
            layers: '4223_1928',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4223-1940', 'HistoMap Berlin 4223/1940', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4223/1940', "", {
            layers: '4223_1940',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4223-1952', 'HistoMap Berlin 4223/1952', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4223/1952', "", {
            layers: '4223_1952',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4223-1956', 'HistoMap Berlin 4223/1956', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4223/1956', "", {
            layers: '4223_1956',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-4223-1961', 'HistoMap Berlin 4223/1961', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 4223/1961', "", {
            layers: '4223_1961',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-422-C-1963', 'HistoMap Berlin 422_C_1963', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 422_C_1963', "", {
            layers: '422_C_1963',
            layer_dir: 'k5_historical',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-422-C-1963', 'HistoMap Berlin 422_C_1963', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 422_C_1963', "", {
            layers: '422_C_1963',
            layer_dir: 'k5_historical',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-422-C-1966', 'HistoMap Berlin 422_C_1966', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 422_C_1966', "", {
            layers: '422_C_1966',
            layer_dir: 'k5_historical',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-422-C-1972', 'HistoMap Berlin 422_C_1972', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 422_C_1972', "", {
            layers: '422_C_1972',
            layer_dir: 'k5_historical',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-422-C-1978', 'HistoMap Berlin 422_C_1978', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 422_C_1978', "", {
            layers: '422_C_1978',
            layer_dir: 'k5_historical',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-422-C-1985', 'HistoMap Berlin 422_C_1985', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 422_C_1985', "", {
            layers: '422_C_1985',
            layer_dir: 'k5_historical',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('histomapberlin-422-C-1990', 'HistoMap Berlin 422_C_1990', function () {
        return new OpenLayers.Layer.OSM('HistoMap Berlin 422_C_1990', "", {
            layers: '422_C_1990',
            layer_dir: 'k5_historical',
            getURL: histomapberlin_getTileURL
        });
    }),


    // https://gdi.berlin.de/services/wms/ua_srhk?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&CACHEID=7783753&LAYERS=l_srhk_senken&SINGLETILE=true&CRS=EPSG%3A25833&STYLES=&WIDTH=1172&HEIGHT=788&BBOX=390452.2059906468%2C5817573.690844088%2C393553.1209828194%2C5819658.6063849
    new LayerType('gdiberlin-senken', 'GDI Berlin Senken', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Senken', "", {
            href: 'https://gdi.berlin.de/services/wms/ua_srhk',
            layers: 'l_srhk_senken',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('gdiberlin-feuerwehreinsaetze', 'GDI Berlin Feuerwehreinsaetze', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Feuerwehreinsaetze', "", {
            href: 'https://gdi.berlin.de/services/wms/ua_srhk',
            layers: 'g_srhk_feuerwehreinsaetze',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('gdiberlin-gewaesser', 'GDI Berlin Gewaesser', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Gewaesser', "", {
            href: 'https://gdi.berlin.de/services/wms/ua_srhk',
            layers: 'f_srhk_gewaesser',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('gdiberlin-starkregengefahrenkarten', 'GDI Berlin Starkregengefahrenkarten', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin starkregengefahrenkarten', "", {
            href: 'https://gdi.berlin.de/services/wms/ua_srhk',
            layers: 'a_srhk_starkregengefahrenkarten_vorhanden',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('gdiberlin-hwgklow', 'GDI Berlin Hochwasser', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Hochwasser', "", {
            href: 'https://gdi.berlin.de/services/wms/ua_srhk',
            layers: 'm_hwgklow',
            getURL: histomapberlin_getTileURL
        });
    }),

    // https://gdi.berlin.de/services/wms/radverkehrsnetz?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=True&CACHEID=3066410&LAYERS=radverkehrsnetz&WIDTH=512&HEIGHT=512&CRS=EPSG:25833&STYLES=&BBOX=389290.6955616911,5819159.994513603,389629.36204547784,5819498.66099739
    new LayerType('gdiberlin-radverkehrsnetz', 'GDI Berlin Radverkehrsnetz', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Radverkehrsnetz', "", {
            href: 'https://gdi.berlin.de/services/wms/radverkehrsnetz',
            layers: 'radverkehrsnetz',
            getURL: histomapberlin_getTileURL
        });
    }),

    // https://gdi.berlin.de/services/wms/verkehrsmengen_2023?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&CACHEID=1659309&LAYERS=dtvw2023rad&SINGLETILE=true&WIDTH=2787&HEIGHT=987&CRS=EPSG%3A25833&BBOX=390915.8026513671%2C5820868.472244186%2C391696.1626513671%2C5821144.832244186
    new LayerType('gdiberlin-verkehrsmengen_2023-rad', 'GDI Berlin Verkehrsmengen 2023 Rad', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Verkehrsmengen 2023 Rad', "", {
            href: 'https://gdi.berlin.de/services/wms/verkehrsmengen_2023',
            layers: 'dtvw2023rad',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('gdiberlin-verkehrsmengen_2023-kfz', 'GDI Berlin Verkehrsmengen 2023 Kfz', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Verkehrsmengen 2023 LKW', "", {
            href: 'https://gdi.berlin.de/services/wms/verkehrsmengen_2023',
            layers: 'dtvw2023kfz',
            getURL: histomapberlin_getTileURL
        });
    }),

    new LayerType('gdiberlin-verkehrsmengen_2023-lkw', 'GDI Berlin Verkehrsmengen 2023 LKW', function () {
        return new OpenLayers.Layer.OSM('GDI Berlin Verkehrsmengen 2023 LKW', "", {
            href: 'https://gdi.berlin.de/services/wms/verkehrsmengen_2023',
            layers: 'dtvw2023lkw',
            getURL: histomapberlin_getTileURL
        });
    }),

    // https://api.viz.berlin.de/geoserver/mdh/gwc/service/wmts?layer=vmzlos-step&style=mdh%3Avmzlos-step&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A900913%3A10&TileCol=548&TileRow=336
/* needs setup for TileCol=548&TileRow=336 (?) 
    new LayerType('vizberlin-traffic', 'VIZ Berlin Traffic', function () {
        return new OpenLayers.Layer.OSM('VIZ Berlin Traffic', "", {
            href: 'https://api.viz.berlin.de/geoserver/mdh/gwc/service/wmts',
            layers: 'vmzlos-step',
	    srs: 'EPSG%3A900913%3A10',
            getURL: histomapberlin_getTileURL
        });
    }),
    */

    // https://fbinter.stadt-berlin.de/fb/wms/senstadt/brw_2020_amtlich?cmd=&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=1,2,3,4&CRS=EPSG%3A25833&STYLES=&WIDTH=774&HEIGHT=846&BBOX=389541.25%2C5814996.25%2C391234.375%2C5816846.875
/*
    new LayerType('berlin-brw2020', 'Berlin Bodenrichtwerte 2020', function () {
        return new OpenLayers.Layer.OSM('VIZ Berlin Traffic', "", {
            href: 'https://fbinter.stadt-berlin.de/fb/wms/senstadt/brw_2020_amtlich',
            layers: '1,2,4,3',
            // crs: 'EPSG%3A25833',
            crs: 'EPSG%3A4326',
            version: "1.3.0",
            width: 1024,
            height: 1024,
            getURL: histomapberlin_getTileURL
        });
    }),
    */

/*
    new LayerType('meteo-temperature', 'Meteo Temperature 1.5m', function () {
        return new OpenLayers.Layer.OSM('Meteo Temperature 1.5m', "", {
            href: 'https://maps.meteo.pl/geoserver/gwc/service/wms',
            layers: 'um%3AUM4_TEMPERATURE_AT_1_5M',
	    srs: 'EPSG%3A3857',
            getURL: histomapberlin_getTileURL
        });
    }),
    */

    new LayerType('lgb-webatlas', 'LGB Brandenburg Webatlas', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Webatlas', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'webatlasde_2019',
            layers: 'WebAtlasDE_BEBB_halbton',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-webatlas-grey', 'LGB Brandenburg Webatlas grey', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Webatlas grey', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'webatlasde_2019',
            layers: 'WebAtlasDE_BEBB_grau',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-topo-10', 'LGB Brandenburg DTK10 Farbe 1986-2000', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg DTK10 Farbe 1986-2000', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy/dtk10_1986_2000_farbe/service/wms',
            layer_dir: '',
            layers: 'bb_dtk10_1986-2000_farbe',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-topo-25', 'LGB Brandenburg DTK25 Farbe 1989-2001', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg DTK25 Farbe 1989-2001', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy/dtk25_1989_2001_farbe/service/wms',
            layer_dir: '',
            layers: 'bb_dtk25_1989-2001_farbe',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-topo-50', 'LGB Brandenburg DTK50 Farbe 1993-2005', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg DTK50 Farbe 1993-2005', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dtk50_1993_2005_farbe/service/wms',
            layer_dir: '',
            layers: 'bb_dtk50_1993-2005_farbe',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-topo-100', 'LGB Brandenburg DTK100 Farbe 1987-2004', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg DTK100 Farbe 1987-2004', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dtk100_1987_2004_farbe/service/wms',
            layer_dir: '',
            layers: 'bb_dtk100_1987-2004_farbe',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-plz', 'LGB Brandenburg PLZ', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg PLZ', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/ows/plz_wms',
            layer_dir: '',
            layers: 'plz_bebb',
            srs: 'EPSG%3A4326',
            width: 1024,
            height: 1024,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-administrative-boundaries', 'LGB Brandenburg Verwaltungsgrenzen', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Admin. Boundaries', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/ows/vg_wms',
            layer_dir: '',
            layers: 'sorbgeb%2Creg%2Cotl%2Cvgrz%2Cnvgrz%2Cngev%2Cnge%2Cnotl%2Cnreg',
            srs: 'EPSG%3A4326',
            width: 1024,
            height: 1024,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-kataster-flurstuecke', 'LGB Brandenburg Kataster Flurst.', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Kataster Flurst.', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/ows/alkis_wms',
            layer_dir: '',
            layers: 'adv_alkis_gebaeude%2Cadv_alkis_flurstuecke',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-kataster-boden', 'LGB Brandenburg Kataster Boden', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Kataster Boden', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/ows/alkis_wms',
            layer_dir: '',
            layers: 'adv_alkis_bodensch',
            width: 1024,
            height: 1024,
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-satellite-color-sentinel', 'LGB Brandenburg Aerial Color Sentinel', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial Color', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'dop20c_sentinel',
            layers: 'sentinel_europe%2Cdop_brandenburg',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-satellite-color', 'LGB Brandenburg Aerial Color', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial Color', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'dop20c',
            layers: 'bebb_dop20c',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-sentinel2-rgb', 'LGB Brandenburg Sentinel2 RGB', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Sentinel2 RGB', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/ows/bkg_sentinel_wms',
            layer_dir: '',
            layers: 'rgb',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-sentinel2-nir', 'LGB Brandenburg Sentinel2 Nir', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Sentinel2 Nir', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/ows/bkg_sentinel_wms',
            layer_dir: '',
            layers: 'nir',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-sentinel2-nirrer', 'LGB Brandenburg Sentinel2 NirRER', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Sentinel2 NirRER', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/ows/bkg_sentinel_wms',
            layer_dir: '',
            layers: 'nirrer',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-2016-2018-4m', 'LGB Brandenburg Aerial 2016-2018', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 2016-2018', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop20_2016_2018/service/wms',
            layer_dir: '',
            layers: 'dop20_bebb_2016_2018_farbe',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-2013-2015', 'LGB Brandenburg Aerial 2013-2015', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 2013-2015', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop20_2013_2015/service/wms',
            layer_dir: '',
            layers: 'dop20_bebb_2013_2015_farbe',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-2009-2012-4m', 'LGB Brandenburg Aerial 2009-2012', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 2009-2012', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop20_2009_2012/service/wms',
            layer_dir: '',
            layers: 'dop20_bebb_2009_2012_farbe',
            /* [dop20_bebb_2009_2012_graustufen] */
            srs: 'EPSG%3A4326',
            numZoomLevels: 16,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-2005-2010-4m', 'LGB Brandenburg Aerial 2005-2010', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 2005-2010', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop20_2005_2010/service/wms',
            layer_dir: '',
            layers: 'dop20_bebb_2005_2010_farbe',
            /* dop20_bebb_2005_2010_graustufen */
            srs: 'EPSG%3A4326',
            numZoomLevels: 16,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-2001-2009-grey', 'LGB Brandenburg Aerial 2001-2009 grey', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 2001-2009 grey', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop40g_2001_2009/service/wms',
            layer_dir: '',
            layers: 'bb_dop40g_2001_2009',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-2001-2005-grey', 'LGB Brandenburg Aerial 2001-2005 grey', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 2001-2005 grey', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop100g_2001_2005/service/wms',
            layer_dir: '',
            layers: 'bb_dop100g_2001_2005',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-1953', 'LGB Brandenburg Aerial 1953', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 1953', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop100g_1953/service/wms',
            layer_dir: '',
            layers: 'bb_dop100g_1953',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-aerial-1992-1997-grey', 'LGB Brandenburg Aerial 1992-1997 Grey', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial 1992-1997 Grey', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy/dop50g_1992_1997/service/wms',
            layer_dir: '',
            layers: 'bb_dop50g_1992_1997',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-satellite-infrared', 'LGB Brandenburg Aerial Infrared', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial Infrared', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'dop20cir',
            layers: 'bb_dop20cir',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-satellite-grey', 'LGB Brandenburg Aerial Grey', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg Aerial Grey', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'jpeg',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'dop20g',
            layers: 'bebb_dop20g',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-history-1902', 'LGB Brandenburg 1902-1948 grey', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg 1902-1948 grey', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'dr25',
            layers: 'dr25',
            srs: 'EPSG%3A4326',
            numZoomLevels: 20,
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-history-1767', 'LGB Brandenburg 1767-1787 Schmettau', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg 1767-1787 Schmettau', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'schmettau',
            layers: 'schmettau',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('lgb-dgm', 'LGB Brandenburg DGM', function () {
        return new OpenLayers.Layer.OSM('LGB Brandenburg DGM', "", {
            tileOptions: {
                crossOriginKeyword: null
            },
            type: 'png',
            href: 'https://isk.geobasis-bb.de/mapproxy',
            layer_dir: 'dgm',
            layers: 'dgm',
            srs: 'EPSG%3A4326',
            getURL: lgb_getTileURL
        });
    }),

    new LayerType('balticmaps', 'BalticMaps', function () {
        return new OpenLayers.Layer.WMS('BalticMaps', "https://wmsbm5.kartes.lv/BMWzwEGBT/wgs/15/", {
            layers: "0",
            format: "image/png"
        }, {
            projection: "EPSG:3857"
        });
    }),

    new LayerType('viamichelin-map', 'Michelin Map', function () {
        return new OpenLayers.Layer.OSM("Michelin Map", switch_url("https://map{switch:1,2,3}.viamichelin.com/map/mapdirect?map=viamichelin&z=${z}&x=${x}&y=${y}&format=png&version=201503191157&layer=background"), layer_options);
    }),

    new LayerType('viamichelin-light', 'Michelin Simplified', function () {
        return new OpenLayers.Layer.OSM("Michelin Simplified", switch_url("https://map{switch:1,2,3}.viamichelin.com/map/mapdirect?map=light&z=${z}&x=${x}&y=${y}&format=png&version=201503191157&layer=background"), layer_options);
    }),

    new LayerType('viamichelin-hybrid', 'Michelin Labels', function () {
        return new OpenLayers.Layer.OSM("Michelin Labels", switch_url("https://map{switch:1,2,3}.viamichelin.com/map/mapdirect?map=hybrid&z=${z}&x=${x}&y=${y}&format=png&version=201503191157&layer=network"), layer_options);
    }),

    new LayerType('freemap-slovakia', 'Freemap Slovakia (OSM)', function () {
        return new OpenLayers.Layer.OSM('Freemap Slovakia (OSM)', switch_url("https://{switch:a,b,c}.freemap.sk/A/${z}/${x}/${y}.png"), {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 17
        });
    }),

    new LayerType('freemap-slovakia-outdoor', 'Freemap Slovakia Outdoor (OSM)', function () {
        return new OpenLayers.Layer.OSM('Freemap Slovakia Outdoor (OSM)', "https://outdoor.tiles.freemap.sk/${z}/${x}/${y}", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 19
        });
    }),

    new LayerType('freemap-slovakia-hiking', 'Freemap Slovakia Hiking (OSM)', function () {
        return new OpenLayers.Layer.OSM('Freemap Slovakia Hiking (OSM)', "https://tile.freemap.sk/T/${z}/${x}/${y}.jpeg", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 17
        });
    }),

    new LayerType('serbiamap-latin', 'Serbiamap Latin', function () {
        return new OpenLayers.Layer.OSM('Serbiamap Latin', "https://serbiamap.net/Tiles.ashx?z=${z}&x=${x}&y=${y}", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 17
        });
    }),

    new LayerType('sorbian-mapnik', 'Sorbian', function () {
        return new OpenLayers.Layer.OSM('Sorbian', "https://tile.openstreetmap.de/osmhrb/${z}/${x}/${y}.png", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 17
        });
    }),

    new LayerType('serbiamap-cyrillic', 'Serbiamap Cyrillic', function () {
        return new OpenLayers.Layer.OSM('Serbiamap Cyrillic', "https://serbiamap.net/Tiles.ashx?z=${z}&x=${x}&y=${y}&lang=sr-cyrl", {
            tileOptions: {
                crossOriginKeyword: null
            },
            numZoomLevels: 17
        });
    }),

    /* polish maps */
    new LayerType('ump-pcpl', 'UMP-pcPL', function () {
        return new OpenLayers.Layer.OSM('UMP-pcPL', switch_url("https://{switch:1,2,3}.tiles.ump.waw.pl/ump_tiles/${z}/${x}/${y}.png"), layer_options);
    }),

    new LayerType('osmapa', 'osmapa.pl (OSM)', function () {
        return new OpenLayers.Layer.OSM('osmapa.pl (OSM)', "https://c.tile.openstreetmap.pl/osmapa.pl/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('meteo-mapy', 'Meteo Mapy', function () {
        return new OpenLayers.Layer.OSM('Meteo Mapy', "https://mapy.meteo.pl/meteo_overlay/${z}/${x}/${y}.png", layer_options);
    }),


    new LayerType('gsi-japan-tpale', 'GSI Japan tPale', function () {
        return new OpenLayers.Layer.OSM('GSI Japan tPale', "https://cyberjapandata.gsi.go.jp/xyz/pale/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('gsi-japan-std', 'GSI Japan Std', function () {
        return new OpenLayers.Layer.OSM('GSI Japan Std', "https://maps.gsi.go.jp/xyz/std/${z}/${x}/${y}.png?_=20210915a", layer_options);
    }),

    new LayerType('gsi-japan-english', 'GSI Japan English', function () {
        return new OpenLayers.Layer.OSM('GSI Japan English', "https://maps.gsi.go.jp/xyz/english/${z}/${x}/${y}.png?_=20210915a", {
            tileOptions: {
                crossOriginKeyword: null
            },
            sphericalMercator: true,
            transitionEffect: "resize",
            numZoomLevels: 12
        });
    }),

    new LayerType('gsi-japan-aerial', 'GSI Japan Aerial', function () {
        return new OpenLayers.Layer.OSM('GSI Japan Aerial', "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/${z}/${x}/${y}.jpg", layer_options);
    }),

    new LayerType('mapfan-road', 'MapFan Road (Japan)', function () {
        return new OpenLayers.Layer.OSM('MapFan Road (Japan)', "https://d3a9yephh38bqr.cloudfront.net/EPSG:3857:${z}/${x}/${y}?mapstyle=std_pc&logo=on&lang=ja&resolution=2&bldgname=on", layer_options);
    }),

    new LayerType('safecast-2023-08-13', 'Safecast 2023-08-13', function () {
        return new OpenLayers.Layer.OSM('Safecast 2023-08-13', "https://s3.amazonaws.com/te512.safecast.org/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('safecast-cosmic-2019-04-07', 'Safecast Cosmic 2019-04-07', function () {
        return new OpenLayers.Layer.OSM('Safecast Cosmic 2019-04-07', "https://s3.amazonaws.com/cosmic.safecast.org/${z}/${x}/${y}.png", layer_options);
    }),

    new LayerType('usgs-topo', 'USGS Topo', function () {
        return new OpenLayers.Layer.OSM('USGS Topo', "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/${z}/${y}/${x}", layer_options17);
    }),

    new LayerType('usgs-imagery-topo', 'USGS Imagery Topo', function () {
        return new OpenLayers.Layer.OSM('USGS Imagery Topo', "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/${z}/${y}/${x}", layer_options17);
    }),

    new LayerType('usgs-imagery-only', 'USGS Imagery Only', function () {
        return new OpenLayers.Layer.OSM('USGS Imagery Only', "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/${z}/${y}/${x}", layer_options17);
    }),

    new LayerType('usgs-shaded-relief-only', 'USGS Shaded Relief Only', function () {
        return new OpenLayers.Layer.OSM('USGS Shaded Relief Only', "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/${z}/${y}/${x}", layer_options17);
    }),

    new LayerType('usgs-hydro-cached', 'USGS Hydro Cached', function () {
        return new OpenLayers.Layer.OSM('USGS Hydro Cached', "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/${z}/${y}/${x}", layer_options17);
    }),

    new LayerType('global-building-atlas-lod1', 'GlobalBuildingAtlas LoD1', function () {
        return new OpenLayers.Layer.OSM("GlobalBuildingAtlas LoD1", "https://tubvsig-so2sat-vm1.srv.mwn.de/geoserver/gwc/service/tms/1.0.0/global3D:volume_480m@EPSG:900913@png/${z}/${x}/${y}.png", {
            sphericalMercator: true,
            tileSize: new OpenLayers.Size(256, 256),
        });
    }),

    //
    // LAST ENTRY WITHOUT COMMA
    //
    new LayerType('osm-southeastasia', 'OSM SouthEastAsia', function () {
        return new OpenLayers.Layer.OSM('', switch_url('https://{switch:a,b,c,d}.tile.osm-tools.org/osm/${z}/${x}/${y}.png'), {
            numZoomLevels: 18
        });
    })

    // EOF padding
    ];

    // check if the google maps JavaScript libs were successfully loaded    
    if (typeof google === 'undefined') {
        // IE8?
        if (window.console) {
            console.warn("Error: could not load google JS libs, disable google maps");
        }
    } else {
        var google_layertypes = google_layertypes();
        for (var i = 0; i < google_layertypes.length; i++) {
            state.layertypes.push(google_layertypes[i]);
        }
    }


    // overlay types, just a copy + isBaseLayer: false
    state.over_layertypes = [

    AddOverlay('bbbike-smoothness'), AddOverlay('bbbike-handicap'), AddOverlay('bbbike-cycle-routes'), AddOverlay('bbbike-cycleway'),

    AddOverlay('bbbike-green'), AddOverlay('bbbike-unlit'), AddOverlay('bbbike-unknown'),

    AddOverlay('gdiberlin-verkehrsmengen_2023-rad'), AddOverlay('gdiberlin-verkehrsmengen_2023-kfz'), AddOverlay('gdiberlin-verkehrsmengen_2023-lkw'),

    AddOverlay('yandex-satellite'),

    AddOverlay('mapnik-german'), AddOverlay('stamen-toner'),

    AddOverlay('tomtom-sat'),

    AddOverlay('tomtom-basic'),

    AddOverlay('esri-topo'),

    AddOverlay('waymarkedtrails-hiking'), AddOverlay('waymarkedtrails-cycling'), AddOverlay('waymarkedtrails-mtb'),

    AddOverlay('waymarkedtrails-skating'), AddOverlay('osm-gps'),

    AddOverlay('opensnowmap-ski-pistes'), AddOverlay('openrailwaymap-standard'), AddOverlay('openrailwaymap-maxspeed'),

    AddOverlay('lgb-administrative-boundaries'), AddOverlay('lgb-plz'), AddOverlay('lgb-dgm'),

    AddOverlay('basemap-retina'),

    AddOverlay('google-streetview'), /* AddOverlay('mapillary-streetview'), */

    AddOverlay('lightningmaps-standard'),

    AddOverlay('safecast-2023-08-13'), AddOverlay('safecast-cosmic-2019-04-07'),

    AddOverlay('wigle-wifi'),

    AddOverlay('openseamap-seamark')];



    // add additional external configured layers
    if (typeof external_layer_js !== 'undefined') {
        add_external_layers(external_layer_js);
    }

    update_map_config();
}

function update_map_config() {
    reorderMaps("layertypes", mc.sort);
    reorderMaps("over_layertypes", mc.sort_overlay);
    getOrderOfPrefMaps();
}

/* https://xbb.uz/openlayers/i-Yandex.Maps
*/
function yandex_getTileURL(bounds) {
    var r = this.map.getResolution();
    var maxExt = (this.maxExtent) ? this.maxExtent : state.YandexBounds;
    // var maxExt = state.YandexBounds;
    // maxExt = new OpenLayers.Bounds();
    var w = (this.tileSize) ? this.tileSize.w : 256;
    var h = (this.tileSize) ? this.tileSize.h : 256;
    var x = Math.round((bounds.left - maxExt.left) / (r * w));
    var y = Math.round((maxExt.top - bounds.top) / (r * h));
    var z = this.map.getZoom();
    var lim = Math.pow(2, z);
    if (y < 0 >= lim) {
        return OpenLayers.Util.getImagesLocation() + "404.png";
    } else {
        x = ((x % lim) + lim) % lim;
        // var url = (this.url) ? this.url : "https://vec02.maps.yandex.net/tiles?l=map&v=2.2.3";
        var url = (this.href) ? this.href : "https://sat01.maps.yandex.net/tiles?l=sat&v=1.35.0";
        return url + "&x=" + x + "&y=" + y + "&z=" + z;
    }
}

function bvg_getTileURL(bounds) {
    var r = this.map.getResolution();
    var maxExt = (this.maxExtent) ? this.maxExtent : state.YandexBounds;

    var w = (this.tileSize) ? this.tileSize.w : 256;
    var h = (this.tileSize) ? this.tileSize.h : 256;
    var x = Math.round((bounds.left - maxExt.left) / (r * w));
    var y = Math.round((maxExt.top - bounds.top) / (r * h));
    var z = this.map.getZoom();
    var lim = Math.pow(2, z);
    var url = (this.href) ? this.href : "/tiles/";

    // scary, isn't it???
    y = (1 << z) - y - 1;
    return url + z + "/" + x + "/" + y + ".png";
}

function initYandex() {
    var YandexBounds = new OpenLayers.Bounds(-20037508, -20002151, 20037508, 20072865);
    state.YandexBounds = YandexBounds;
}

function wms_getTileURL(bounds) {
    var llbounds = new OpenLayers.Bounds();
    llbounds.extend(OpenLayers.Layer.SphericalMercator.inverseMercator(bounds.left, bounds.bottom));
    llbounds.extend(OpenLayers.Layer.SphericalMercator.inverseMercator(bounds.right, bounds.top));

    var url = this.href;
    url += "&WIDTH=256&HEIGHT=256";
    url += '&BBOX=' + llbounds.toBBOX();

    return url
}


// https://isk.geobasis-bb.de/mapproxy/bebb-webatlasde/service/wms?LAYERS=WebAtlasDE_BEBB_halbton&FORMAT=image%2Fpng&BGCOLOR=0xFFFFFF&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A25833&BBOX=383990.81444778,5868434.0867246,410081.30601358,5894524.5782904&WIDTH=256&HEIGHT=256

function lgb_getTileURL(bounds) {
    var llbounds = new OpenLayers.Bounds();
    llbounds.extend(OpenLayers.Layer.SphericalMercator.inverseMercator(bounds.left, bounds.bottom));
    llbounds.extend(OpenLayers.Layer.SphericalMercator.inverseMercator(bounds.right, bounds.top));

    var url = this.href;
    if (this.layer_dir) {
        url += '/' + this.layer_dir + "/service/wms";
    }

    var width = this.width ? this.width : 256;
    var height = this.height ? this.height : 256;
    var srs = this.srs || 'EPSG%3A4326'
    var type = this.type || 'png';

    url += '?LAYERS=' + this.layers;
    url += '&FORMAT=image%2F' + type + '&BGCOLOR=0xFFFFFF&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=';
    url += '&SRS=' + srs;
    url += '&BBOX=' + llbounds.toBBOX() + "&WIDTH=" + width + " &HEIGHT=" + height;

    return url
}

// https://histomapberlin.de:8443/geoserver/histomap/wms?SERVICE=WMS&LAYERS=4338_1935&EXCEPTIONS=application/vnd.ogc.se_inimage&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.1.1&REQUEST=GetMap&STYLES=&TILED=true&SRS=EPSG:3068&BBOX=22203.352725154,28680.676055704,22247.951577795,28725.274908345&WIDTH=256&HEIGHT=256

function histomapberlin_getTileURL(bounds) {
    var llbounds = new OpenLayers.Bounds();
    llbounds.extend(OpenLayers.Layer.SphericalMercator.inverseMercator(bounds.left, bounds.bottom));
    llbounds.extend(OpenLayers.Layer.SphericalMercator.inverseMercator(bounds.right, bounds.top));

    var layer_dir = this.layer_dir || 'histomap';
    var url = this.href || 'https://histomapberlin.de:8443/geoserver/' + layer_dir + '/wms';

    var width = this.width ? this.width : 256;
    var height = this.height ? this.height : 256;
    var srs = this.srs || 'EPSG%3A4326';
    var type = this.type || 'png';
    var version = this.version || '1.1.1';

    url += '?LAYERS=' + this.layers;
    url += '&FORMAT=image%2F' + type + '&BGCOLOR=0xFFFFFF&SERVICE=WMS&VERSION=' + version + '&REQUEST=GetMap&STYLES=';
    if (this.crs) {
        url += '&CRS=' + this.crs;
    } else {
        url += '&SRS=' + srs;
    }

    url += '&BBOX=' + llbounds.toBBOX() + "&WIDTH=" + width + "&HEIGHT=" + height;

    return url
}

function initMarker(n) {
    state.markersLayer[n] = new OpenLayers.Layer.Markers("Marker");
    state.maps[n].addLayer(state.markersLayer[n]);
    state.marker[n] = new OpenLayers.Marker(state.maps[n].getCenter(), new OpenLayers.Icon('img/cross.png', new OpenLayers.Size(20, 20), new OpenLayers.Pixel(-10, -10)));
    state.markersLayer[n].setVisibility(false);
    state.markersLayer[n].addMarker(state.marker[n]);
}

/*
 * We set the marker in the middle of the map. If the marker moved, we
 * will later re-set the middle to the marker again.
 *
 */
function set_popup(obj) {
    if (!obj) return;

    var map = state.maps[0];
    var message = obj.message || "marker";
    var pos = new OpenLayers.LonLat(obj.lon, obj.lat).transform(state.proj4326, map.getProjectionObject());
    debug("set marker: " + obj.lon + "," + obj.lat);


    var message_p = "";
    if (mc.search.marker_permalink) {
        // message_p += '<p/><div><a href="' + $("#permalink").attr("href") + '&marker=' + message + '">permalink</a></div>';
        message_p += '<p/><div><a class="share_link" onclick="click_share_link(' + obj.lon + ',' + obj.lat + ')">share</a></div>';
    }

    // A popup with some information about our location
    var popup = new OpenLayers.Popup.FramedCloud("Popup", pos, null, // new OpenLayers.Size(50,50), // null,
    "<span id='mc_popup'>" + message + "</span>" + message_p, null, true // <-- true if we want a close (X) button, false otherwise
    );

    // limit popup width and height
    popup.maxSize = new OpenLayers.Size(420, 360)
    debug("max popup size: " + popup.maxSize);

    // remove old popups from search clicks
    if (state.popup) {
        map.removePopup(state.popup);
    }

    map.addPopup(popup);

    // keep values for further usage (delete, position)
    state.popup = popup;
    state.marker_message = message;
}

function click_share_link(lon, lat) {
    if (lat && lon) {
        map.setCenter(new OpenLayers.LonLat(lon, lat).transform(state.proj4326, map.getProjectionObject()));
    }

    debug("marker click feature");

    // close existing helper windows
    $('.dialog-close').trigger({
        type: 'click'
    });

    $("#tools-sharetrigger").trigger({
        type: 'click'
    });
}

function share_marker(pos) {
    var proj4326 = new OpenLayers.Projection('EPSG:4326');

    // remove old marker
    if (state.marker_vectors) {
        map.removeLayer(state.marker_vectors);
    }

    var vectors = new OpenLayers.Layer.Vector("Vector Layer", {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: "img/marker-blue.png",
            graphicXOffset: -12,
            graphicYOffset: -39,
            graphicWidth: 25,
            graphicHeight: 41,
            graphicName: "cross"
            // pointRadius: 24
        })
    });

    state.marker_vectors = vectors;
    map.addLayer(vectors);

    var marker = new OpenLayers.Control.DragFeature(vectors, {
        onComplete: function (feature, pixel) {
            var point = new OpenLayers.Geometry.Point(feature.geometry.x, feature.geometry.y).transform(map.getProjectionObject(), proj4326);
            debug("marker on complete feature: " + point);
            debug("marker on complete mouse pixel: " + pixel + " " + map.getLonLatFromViewPortPx(pixel).transform(map.getProjectionObject(), proj4326));

            setTimeout(function () {
                click_share_link(point.x, point.y);
            }, 300);
        }
    });

    map.addControl(marker);
    marker.activate();

    // remove popup cloud marker if exists before setting a new marker
    if (state.popup) {
        pos = state.popup.lonlat.transform(map.getProjectionObject(), proj4326);

        debug("delete old popup, new pos: " + pos);
        map.removePopup(state.popup);
        delete state.popup;

        // re-center new marker
        map.setCenter(new OpenLayers.LonLat(pos.lon, pos.lat).transform(proj4326, map.getProjectionObject()));
        // state.marker_message = "";
        updatePermalink();
    }

    // var point = new OpenLayers.Geometry.Point(pos.lon, pos.lat).transform(proj4326, map.getProjectionObject());
    var point = new OpenLayers.Geometry.Point(pos.lon, pos.lat).transform(proj4326, map.getProjectionObject());
    vectors.addFeatures(new OpenLayers.Feature.Vector(point));
}

function setVisibilityWrapper(layer, value) {
    if (layer) {
        layer.setVisibility(value);
    } else {
        // to slow, wait some seconds
        setTimeout(function () {
            if (layer) layer.setVisibility(value);
        }, 2000);
    }
}

function moveStart() {
    state.movestarted = true;
    for (var i = 0; i < mc.NumberOfMaps; i++) {
        setVisibilityWrapper(state.markersLayer[i], false);
    }
    return (false);
}

function moveEnd() {
    if (state.moving) {
        return;
    }

    state.moving = true;
    for (var i = 0; i < mc.NumberOfMaps; i++) {
        if (i != this && state.maps[i]) {
            state.maps[i].setCenter(
            state.maps[this].getCenter().clone().transform(state.maps[this].getProjectionObject(), state.maps[i].getProjectionObject()), state.maps[this].getZoom());
        }
        setVisibilityWrapper(state.markersLayer[i], true);
    }

    state.moving = false;
    updatePermalink();
    state.movestarted = false;
    // state.markersLayer[1-this].setVisibility(true);
    return false;
}

function mouseMove(evt) {
    for (var i = 0; i < mc.NumberOfMaps; i++) {
        if (i != this && state.marker[i]) {
            state.marker[i].moveTo(state.maps[this].getLayerPxFromViewPortPx(evt.xy));
        }
    }
    return (false);
}

function mouseOver(evt) {
    if (!state.movestarted) {
        for (var i = 0; i < mc.NumberOfMaps; i++) {
            if (i != this) {
                setVisibilityWrapper(state.markersLayer[i], true);
            }
        }
    }

    $('#customMousePosition').show();
    $('#customMousePosition').removeClass("mouseOut").addClass("mouseIn");
    $('#customZoomLevel').removeClass("mouseOut").addClass("mouseIn");

    return false;
}

function mouseOut(evt) {
    for (var i = 0; i < mc.NumberOfMaps; i++) {
        setVisibilityWrapper(state.markersLayer[i], false);
    }

    // $('#customMousePosition').hide();
    $('#customMousePosition').removeClass("mouseIn").addClass("mouseOut");
    $('#customZoomLevel').removeClass("mouseIn").addClass("mouseOut");

    return false;
}

function initSelectOptions(n, type) {
    var sw = $('#sw' + n);
    if (!sw || sw.length == 0) return;

    var optgroup;
    var optgroup_label = "none";

    // cleanup everything in <select> first
    sw.empty();

    for (var i = 0; i < state.layertypes.length; i++) {
        var l = state.layertypes[i];

/* We put the maps into groups, by prefix
         * e.g. "OSM Mapnik" => "OSM" >> "OSM Mapnik"
         */
        var str = l.name.split(/\s+/);
        if (str.length > 0 && str[0] != optgroup_label) {
            if (mc.debug >= 2) {
                debug("New optgroup label: " + str[0]);
            }
            optgroup_label = str[0];

            optgroup = $("<optgroup/>");
            optgroup.attr("label", optgroup_label);
            sw.append(optgroup);
        }

        var opt = $("<option/>");
        opt.attr("value", l.type);
        opt.text(l.name);
        // opt.css("padding", "1px");
        if (l.type == type) {
            opt.attr("selected", "selected");
        }

        optgroup.append(opt);
    }
    sw.bind('change', n, changeLayer);
}

function initSelectOptionsOverlay(n, type) {
    var sw = $('#sw' + n);
    if (!sw || sw.length == 0) return;
    if (!type) type = "none";

    var optgroup;
    var optgroup_label = "none";

    // cleanup everything in <select> first
    sw.empty();
    sw.append('<optgroup label="None"><option value="none">None</option></optgroup>');

    for (var i = 0; i < state.over_layertypes.length; i++) {
        var l = state.over_layertypes[i];

        if (!l.name) {
            debug("Error: unknknown overlay layer: " + l.error)
            continue;
        }

/* We put the maps into groups, by prefix
         * e.g. "OSM Mapnik" => "OSM" >> "OSM Mapnik"
         */
        var str = l.name.split(/\s+/);
        if (str.length > 0 && str[0] != optgroup_label) {
            if (mc.debug >= 2) {
                debug("New optgroup label overlay: " + str[0]);
            }
            optgroup_label = str[0];

            optgroup = $("<optgroup/>");
            optgroup.attr("label", optgroup_label);
            sw.append(optgroup);
        }

        // XXX: IE8
        if (!l) {
            debug("WARNING: unknown overlay config: " + i + " after: " + state.over_layertypes[i - 1].type);
            continue;
        }

        var opt = $("<option/>");
        opt.attr("value", l.type);
        opt.text(l.name);
        // opt.css("padding", "1px");
        if (l.type == type) {
            opt.attr("selected", "selected");
        }

        optgroup.append(opt);
    }

    sw.bind('change', n, changeOverLayer);
    state.over_layers[0] = type;

    if (type == "none") {
        showTransparentMenu(false);
    } else {
        changeOverLayer(null, type);
    }
}

function showTransparentMenu(flag, n) {
    if (!n) n = -2;
    var sw = mc.overlay.type == "select" ? $('#sw' + n) : $('#slider_box');
    if (!sw) return;

    flag ? sw.show() : sw.hide();
}

function initSelectOptionsTransparent(n, percent) {
    var sw = $('#sw' + n);
    if (!sw) return;
    if (typeof percent === 'undefined') percent = state.percent;

    if (!mc.overlay.enabled) return;

    var step = mc.overlay.select_step;

    for (var i = 0, j = 1; i <= 100; i += step, j++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.text = i + "%"
        opt.style.padding = '1px';
        if (i == percent) {
            opt.selected = true;
        }
        sw[0].options[j] = opt;
    }

    sw.bind('change', n, changeTransparent);
    state.percent = percent;

    return state.percent;
}

function initSliderTransparent(n, percent) {
    var sw = $('#slider_box');

    if (!sw) return;

    if (typeof percent === 'undefined') percent = state.percent;

    if (!mc.overlay.enabled) return;

    var step = mc.overlay.slider_step;

    sw.slider({
        step: 5,
        value: percent,
        animate: "fast",
        slide: function (event, ui) {
            changeTransparent(null, ui.value);
        }

        /* ,change: function(event, ui) { changeTransparent(null, ui.value); } */
    });

    state.percent = percent;
}

function changeTransparent(event, _percent) {
    var percent = event ? event.target.value : _percent;
    var overlayer_name = state.over_layers[0];

    if (overlayer_name == "none" || overlayer_name == "") return state.percent;

    debug("percent: " + percent);
    // default opacity
    if (percent == "" || percent < 0) {
        // reset layer
        if (percent != -2) // called from changeOverLayer
        changeOverLayer(null, overlayer_name);

        // select "default" in menu
        var sw = $('#sw' + "-2");
        if (sw && sw[0] && sw[0].options) sw[0].options[0].selected = true;

        debug("nothing to change: " + overlayer_name + " " + percent);
        return state.percent;
    }

    if (percent < 0 || percent > 100) {
        debug("percent out of range: " + percent + ", reset to 50");
        percent = 50;
    }
    state.percent = percent;

    debug("set transparent percentage to: " + percent);

    for (var n = 0; n < mc.NumberOfMaps; n++) {
        if (state.over_layers_obj[n]) {
            state.over_layers_obj[n].setOpacity(percent / 100);
        }
    }

    updatePermalink();
    return state.percent;
}

// make the column visible

function initColumn(n, display) {
    if (!display) {
        display = "table-cell";
    }
    var column = $('#column' + n);
    column.css("display", display);
}

// set the column width depending on the number of maps

function initColumnWidth(n) {
    var number;
    if (n <= 3) { // one row
        number = n;
    } else if (n <= mc.row3) { // second row
        number = Math.ceil(n / 2);
    } else if (n <= mc.row4) { // 3rd row
        number = Math.ceil(n / 3);
    } else if (n <= mc.row5) { // 4rd row
        number = Math.ceil(n / 4);
    } else { // 5rd row
        number = Math.ceil(n / 5);
    }

    var width = Math.floor(100 / number) + "%";
    $('td.maps').css("width", width);
}

function setStartPos(n, lonlat, zoom) {
    var center = lonlat.clone();
    center.transform(state.proj4326, state.maps[n].getProjectionObject());

    // adjust for maps with lower zoom levels
    var z = state.maps[n].getNumZoomLevels(zoom) - 1;
    if (z < zoom) zoom = z;

    state.maps[n].setCenter(center, zoom);
}

function updatePermalink() {
    var url = getPermalink(mc.NumberOfMaps);
    var permalink = $('#permalink');
    if (!permalink || permalink.length == 0) {
        return;
    }

    permalink[0].href = url;
    $('#customZoomLevel').html('zoom=' + state.maps[0].getZoom());

    updateExtractlink();

    return url;
}


function getPermalink(NumberOfMaps) {
    var pos = getPosition();

    // full base URL, without parameters
    var base = window.location.href;
    if (base.indexOf("?") != -1) {
        base = base.substring(0, base.indexOf("?"));
    }

    // bbbike.org/mc/#map=5/51.509/-5.603
    if (base.indexOf("#") != -1) {
        debug("cleanup '#' in url: " + base);
        base = base.substring(0, base.indexOf("#"));
    }

    var url = base + '?lon=' + pos.lon + '&lat=' + pos.lat + '&zoom=' + pos.zoom + "&num=" + NumberOfMaps;
    for (var i = 0; i < mc.NumberOfMapsMax; i++) {
        if (state.layers[i]) {
            url += "&mt" + i + "=" + state.layers[i].type;
        }
    }

    if (state.over_layers[0] && state.over_layers[0] != 'none') {
        url += "&mt-1" + "=" + state.over_layers[0];
        url += "&mt-1p" + "=" + state.percent;
    }
    if (state.fullscreen) {
        url += "&fullscreen=1";
    }
    if (state.marker_message != "") {
        url += "&marker=" + encodeURI(state.marker_message);
    }

    // external filter options
    if (state.external_options["match-id"] != "") {
        url += "&eo-match-id=" + encodeURI(state.external_options["match-id"]);
    }
    if (state.external_options["match-name"] != "") {
        url += "&eo-match-name=" + encodeURI(state.external_options["match-name"]);
    }

    return url;
}

function updateExtractlink() {
    var extractlink = $('#extractlink');

    if (!extractlink || extractlink.length == 0) {
        debug("No extract link found, ignored");
        return "";
    }

    var url = extractlink.attr("href");
    extractlink.attr("href", getExtractlink(url));

    return url;
}

function getExtractlink(href) {
    var box = map.getExtent();
    var pos = box.transform(map.getProjectionObject(), state.proj4326)

    // full base URL, without parameters
    var base = href;
    if (base.indexOf("?") != -1) {
        base = base.substring(0, base.indexOf("?"));
    }

    // bbbike.org/mc/#map=5/51.509/-5.603
    if (base.indexOf("#") != -1) {
        debug("cleanup '#' in url: " + base);
        base = base.substring(0, base.indexOf("#"));
    }

    var url = base + '?sw_lng=' + pos.left + '&sw_lat=' + pos.bottom + '&ne_lng=' + pos.right + '&ne_lat=' + pos.top + "&source=mc";

    return url;
}

function updateNumberOfMapsLink(NumberOfMapsMax, NumberOfMaps, NumberOfMapsLinks) {
    var message = "number of maps: <span id='nom_links'>";
    var pl_class = "";
    var last = "";

    for (var i = 1; i <= NumberOfMapsMax; i++) {
        // don't show all links, only the important ones
        if (ignoreLink(NumberOfMapsMax, NumberOfMaps, NumberOfMapsLinks, i)) {
            continue;
        }

        if (i > 1) {
            message += " ";
        }
        if (i == NumberOfMaps) {
            message += i;
        } else {
            // last link get a plus symbol: 1 2 4 6 8+
            if (i == NumberOfMapsLinks && NumberOfMaps < NumberOfMapsLinks) {
                last = "+";
            } else {
                last = "";
            }

            pl_class = i > 12 && i != NumberOfMapsMax ? 'pl_small' : 'pl_normal';
            message += "<a href='#' class='" + pl_class + "' onclick='this.href=getPermalink(" + i + ");'>" + i + last + '</a>';
        }
    }
    message += '</span>';

    $('#NumberOfMaps').html(message);
}

function ignoreLink(NumberOfMapsMax, NumberOfMaps, NumberOfMapsLinks, i) {

    // show only the first 8 links if there are less than 8 maps
    // on the map
    if (NumberOfMapsLinks && (NumberOfMaps < NumberOfMapsLinks) && i > NumberOfMapsLinks) return 1;

    // ignore odd small number links
    if (i == 5 || i == 7) return 1;

    // always show the last link
    if (NumberOfMapsMax == i) return 0;

    if (i > NumberOfMapsLinks && i <= mc.row3 && i % 2 == 1) return 1;

    if (i > NumberOfMapsLinks && i > mc.row3 && i <= mc.row4 && i % 3 != 0) return 1;

    if (i > NumberOfMapsLinks && i > mc.row4 && i <= mc.row5 && i % 4 != 0) return 1;

    if (i > NumberOfMapsLinks && i > mc.row5 && i % 10 != 0) return 1;

    // for more than 60 maps: step is 20, etc.
    if (i >= 200 && i % 100 != 0) return 1;
    if (i >= 100 && i < 200 && i % 40 != 0) return 1;
    if (i >= 60 && i < 100 && i % 20 != 0) return 1;


    return 0;
}

function LayerType(type, name, create, options) {
    this.type = type;
    this.name = name;
    this.create = create;
    this.options = options;

    if (state.layertypes_hash[type]) {
        debug("Warning: override map type '" + type + "'")
    }
    state.layertypes_hash[type] = this;
}

function OverLayerType(type, name, create) {
    this.type = type;
    this.name = name;
    this.create = create;

    state.over_layertypes_hash[type] = this;
}

// add an existing map to overlay menu

function AddOverlay(type) {
    var obj = state.layertypes_hash[type];

    if (obj && obj.type) {
        return new OverLayerType("ol_" + obj.type, obj.name, obj.create);
    } else {
        debug("Error unknown map type: " + type, " cannot create overlay");
        return {
            error: type
        };
    }
}


function MapLayer(layertype) {
    var layertype_default = "mapnik";

    // debug("MapLayer: " + layertype);
    var lt = state.layertypes_hash[layertype];
    if (!lt) {
        debug("unknown layer type: '" + layertype + "', fall back to " + layertype_default);
        lt = state.layertypes_hash[layertype_default];

        // XXX: give up!
        if (!lt) return {};
    }
    this.layer = lt;
    this.type = lt.type;
    this.name = lt.name;
    this.options = lt.options;
    this.obj = lt.create();
}

// unfocus select box for key events on a map

function mc_unfocus() {
    var focus = $(':focus');
    if (focus.attr('id')) {
        focus.trigger("blur");
        debug("MapLayer focus is on form element: " + focus.attr('id') + ", unfocus with blur(), type:  " + document.activeElement);
    }
}

function newLayer(map, layertype) {
    debug("newLayer: map number=" + map + " layertype=" + layertype);

    state.layers[map] = new MapLayer(layertype);
    state.maps[map].addLayer(state.layers[map].obj);
}

function changeOverLayer(event, _name) {
    var name = event ? event.target.value : _name;
    debug(name);

    var oldLayerName = state.over_layers[0];
    debug("old overlayer name: " + oldLayerName);

    // remove old overlay layers
    for (var n = 0; n < mc.NumberOfMaps; n++) {
        var layers = state.maps[n].layers;
        if (state.over_layers_obj[n]) {
            state.maps[n].removeLayer(state.over_layers_obj[n]);
            delete state.over_layers_obj[n];
        }
    }

    // done
    if (name == "none") {
        showTransparentMenu(false);
        state.over_layers[0] = name;
        updatePermalink();
        return name;
    }

    for (var n = 0; n < mc.NumberOfMaps; n++) {
        if (!state.over_layertypes_hash[name]) {
            debug("unknown overlay name: '" + name + "'");
            continue;
        }

        var overlay = state.over_layertypes_hash[name].create();

        // by default all overlays are not a base layer
        overlay.isBaseLayer = false;

        debug("name: " + name + " n: " + n);
        state.maps[n].addLayer(overlay);
        state.over_layers_obj[n] = overlay;
    }

    state.over_layers[0] = name;
    updatePermalink();
    showTransparentMenu(true);

    // set opacity after an overlayer change
    // if (state.percent > 0) changeTransparent(null, -1);
    changeTransparent(null, state.percent);

    mc_unfocus();
    return name;
}

function changeLayer(event) {
    // number of map: 0 .. 14
    var map = event.data;
    debug("changeLayer map=" + map);

    var maps = state.maps;

    var oldproj = maps[map].getProjectionObject();
    var oldcenter = maps[map].getCenter().clone();
    var oldzoom = maps[map].getZoom();

    var newmap = event.target.value

    maps[map].removeLayer(maps[map].baseLayer);
    newLayer(map, newmap);

    try {
        state.layers[map].obj.setMapType();
    } catch (e) {
        // debug(e.error);
    }

    if (map == 0 && state.layers[map].options && typeof state.layers[map].options.pos !== 'undefined') {
        var _zoom = state.layers[map].options.pos.zoom ? state.layers[map].options.pos.zoom : oldzoom;
        var center = new OpenLayers.LonLat(state.layers[map].options.pos.lon, state.layers[map].options.pos.lat);

        debug("auto center by first map: lon=" + center.lon + " lat=" + center.lat + " zoom=" + _zoom);

        maps[map].setCenter(center.transform(state.proj4326, maps[map].getProjectionObject()), _zoom);
    } else {
        maps[map].setCenter(oldcenter.transform(oldproj, maps[map].getProjectionObject()), oldzoom);
    }

    updatePermalink();
    mc_unfocus();
}

function osm_getTileURL(bounds) {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();
    var limit = Math.pow(2, z);

    if (y < 0 || y >= limit) {
        return OpenLayers.Util.getImagesLocation() + "404.png";
    } else {
        x = ((x % limit) + limit) % limit;
        return this.url + z + "/" + x + "/" + y + "." + this.type;
    }
}

function MapOrderHtml(NumberOfMaps) {
    var tr0 = $('tr#tr0');
    var tr1 = $('tr#tr1');
    var tr2 = $('tr#tr2');
    var tr3 = $('tr#tr3');
    var tr4 = $('tr#tr4');
    var data0 = "";
    var data1 = "";
    var data2 = "";
    var data3 = "";
    var data4 = "";

    debug("MapOrderHtml: " + NumberOfMaps);

    // for the first 3 maps use only one row
    if (NumberOfMaps <= 3) {
        for (var i = 0; i < NumberOfMaps; i++) {
            data0 += MapTD(i);
        }

        tr0.html(data0);
    }

    // for more than 3 maps, use 2 rows
    else if (NumberOfMaps <= mc.row3) {
        var half = Math.ceil(NumberOfMaps / 2);
        for (var i = 0; i < NumberOfMaps; i++) {
            if (i < half) {
                data0 += MapTD(i);
            } else {
                data1 += MapTD(i);
            }
        }

        tr0.html(data0);
        tr1.html(data1);
    }

    // for 11 and more maps, use 3 rows
    else if (NumberOfMaps <= mc.row4) {
        var half = Math.ceil(NumberOfMaps / 3);
        for (var i = 0; i < NumberOfMaps; i++) {
            if (i < half) {
                data0 += MapTD(i);
            } else if (i < half + half) {
                data1 += MapTD(i);
            } else {
                data2 += MapTD(i);
            }
        }

        tr0.html(data0);
        tr1.html(data1);
        tr2.html(data2);
    }
    // 4 rows
    else if (NumberOfMaps <= mc.row5) {
        var half = Math.ceil(NumberOfMaps / 4);
        for (var i = 0; i < NumberOfMaps; i++) {
            if (i < half) {
                data0 += MapTD(i);
            } else if (i < half + half) {
                data1 += MapTD(i);
            } else if (i < half + half + half) {
                data2 += MapTD(i);
            } else {
                data3 += MapTD(i);
            }
        }

        tr0.html(data0);
        tr1.html(data1);
        tr2.html(data2);
        tr3.html(data3);
    }
    // 5 rows
    else {
        var half = Math.ceil(NumberOfMaps / 5);
        for (var i = 0; i < NumberOfMaps; i++) {
            if (i < half) {
                data0 += MapTD(i);
            } else if (i < 2 * half) {
                data1 += MapTD(i);
            } else if (i < 3 * half) {
                data2 += MapTD(i);
            } else if (i < 4 * half) {
                data3 += MapTD(i);
            } else {
                data4 += MapTD(i);
            }
        }

        tr0.html(data0);
        tr1.html(data1);
        tr2.html(data2);
        tr3.html(data3);
        tr4.html(data4);
    }

    // XXX: without this, the left map0 will be half size or 3/4 size
    setMapHeight(NumberOfMaps);
}

function MapTD(number) {
    var help = mc.NumberOfMaps >= 7 || !mc.choose_map_type_message ? "" : "<span class='cmtm'>Choose map type: </span>";
    var td = "";
    td += '<td class="maps" id="column' + number + '">';
    td += '   <form action="" class="switch" id="head' + number + '">';
    td += '      <div>' + help + '<select id="sw' + number + '" name="sw' + number + '"><option/></select></div>';
    td += '   </form>';
    td += '   <div class="mapname" id="mapname' + number + '"></div>';
    td += '   <div class="map" id="map' + number + '"></div>';
    td += '</td>';

    return td;
}

/*
 * helper function
 */
function toggleFullScreen(overlay) {
    var fullscreen = !state.fullscreen;
    var fullscreen_type = typeof overlay !== 'undefined' ? overlay : state.fullscreen_type;

    // elements by id
    for (var i = 0; i < state.non_map_tags.length; i++) {
        toggleID(state.non_map_tags[i], fullscreen);
    }

    // map titles
    for (var i = 0; i < mc.NumberOfMaps; i++) {
        toggleID("head" + i, fullscreen);
    }

    state.fullscreen = fullscreen;
    setMapHeight(mc.NumberOfMaps);

    // if active, make the font size larger
    if (fullscreen) {
        $("#fullscreen").removeClass("font_deactive").addClass("font_active");
    } else {
        $("#fullscreen").removeClass("font_active").addClass("font_deactive");
    }

    display_map_name(fullscreen_type);

    state.fullscreen_type = fullscreen_type;
    debug("fullscreen state: " + state.fullscreen + ", type: " + state.fullscreen_type);

    return state.fullscreen;
}

function display_map_name(overlay) {
    var list = $("div#table tr > td > form > div > select");
    var id, number, name, mapname_id;

    for (var i = 0; i < list.length; i++) {
        id = $(list[i]).attr("id");
        number = id.substring(2); // sw0 -> 0
        name = $(list[i]).find("option:selected").text();

        mapname_id = "#mapname" + number;
        $(mapname_id).text(name);

        if (state.fullscreen && overlay != 2) {
            $(mapname_id).show();
        } else {
            $(mapname_id).hide();
        }

        $(mapname_id).css("color", overlay == 3 ? "white" : "black");
        debug("id: " + id + ", name: " + name);
    }
}

function toggleID(tagname, fullscreen) {
    var tag = $("#" + tagname);

    if (tag) fullscreen ? tag.hide() : tag.show();
}

/*
   0: no logging
   1: log to console
   2: log to <div id="debug">
   3: log to <div id="debug">, endless growing
*/
function debug(text, id) {
    if (!mc.debug) return;
    if (!window.console) return; // IE8 ?
    // always log to JavaScript console for debug >= 1
    console.log("Map Compare: " + text);

    if (mc.debug == 1) return;

    if (!id) id = "debug";
    var tag = $("#" + id);

    if (!tag) return;

    // log to HTML page
    var prefix = "debug: ";
    var html = tag.html() ? tag.html() + "; " : prefix;
    tag.html((mc.debug == 3 ? html : prefix) + text)
}

/*
 * geo-location services, find out your current position
 *
 */
function locateMe() {
    if (!navigator || !navigator.geolocation) return;

    var tag = locateMe_tag();
    if (tag) {
        tag.show();
        navigator.geolocation.getCurrentPosition(locateMe_cb, locateMe_error);
        setTimeout(function () {
            tag.hide();
        }, 8000); // paranoid
    }
}

function locateMe_tag() {
    return $("#tools-geolocation");
}

function locateMe_cb(position) {
    var zoom = 15;

    var pos = new MapPosition(position.coords.longitude, position.coords.latitude, zoom);
    setStartPos(1, pos.getLonLat(), pos.zoom);
    locateMe_tag().hide();
    debug("set position lat,lon: " + pos.lat + "," + pos.lon + ", zoom: " + zoom);
}

function locateMe_error(error) {
    debug("could not found position");
    locateMe_tag().hide();
    return;
}

/*
 * set Map Compare preferences in admin console
 *
 */
function initConsole() {
    // debug("init console");
    initCookieCheck();

    initSocial();
    initLayerTypes();

    consoleNumberOfMaps();
    consoleCenterOfMaps();
    consoleTileServer();

    initLayerTypesUserDefined();
    consoleOrderOfMaps();
}

function initCookieCheck() {
    var name = mc_console.cookie.check;

    setCookie(name, "1", true);
};

function initSocial() {
    var tag = $("#social");
    if (!tag) return;

    mc.social ? tag.show() : tag.hide();
}

// returns the configured number of maps

function getNumberOfMaps(override) {
    var number = $.cookie(mc_console.cookie.numberOfMaps);

    if (!number || override) {
        if (!override && mc.responsive.enabled && $(window).height() < mc.responsive.maxHeight) {
            number = 2; // mc.responsive.NumberOfMaps;
            debug("Responsive design: reset number of maps to " + number);
        } else {
            number = mc.NumberOfMaps;
        }
    }

    number = parseInt(number);
    if (number < 1 || number > 999) number = 2;

    return number;
}


function getOrderOfPrefMaps(override) {
    var cookie = $.cookie(mc_console.cookie.orderOfMaps);
    if (!cookie) return mc.mt;

    var list = cookie.split("^");
    if (list.length <= 0) return mc.mt;

    for (var i = 0; i < list.length; i++) {
        if (list[i]) mc.mt[i] = list[i];
    }
    return mc.mt;
}

function getTileServer(number) {
    var obj = {};

    return obj;
}

function setTileServer(obj) {}

function consoleStoreTileServer() {
    // debug("foo");
}

function consoleStoreTileServerOrder() {
    var list = [];

    for (var i = 0; i < mc.mt.length && i < mc.NumberOfMaps; i++) {
        list.push(mc.mt[i]);
    }

    var value = list.join("^");
    setCookie(mc_console.cookie.orderOfMaps, value);
    debug("order of maps: " + value);
}

/* There are several ways to keep the GPS position in a string. For our
 * convenience we support them all: Map Compare, Google Maps, OpenStreeMaps
 *
 * returns: (x,y,z): 13.38885,52.51,12
 * 
 * see the /jasmine.html regression tests
*/
function pos_center_to_mc(pos_string) {
    var data = "";
    var list = [];
    var list2 = [];
    var zoom, lat, lng;

    // illegal parameter
    if (!pos_string || pos_string == "") {
        debug("Oops, wrong paramter in pos_center_to_mc");
    }

    // bbbike.org/mc/?lon=11.583309&lat=50.93314&zoom=10
    // => '11.583309,50.93314,10'
    else if ((list = pos_string.match(/lon=([\d\.\-]+)&lat=([\d\.\-]+)&zoom=(\d+)/))) {
        data = [list[1], list[2], list[3]].join();
    }

    // https://a.tile.bbbike.org/osm/bbbike-smoothness/15/17602/10746.png
    // => 13.38134765625,52.52290594027805,11
    else if ((list = pos_string.match(/\/(\d+)\/(\d+)\/(\d+)(\.png|\.jpg|\.jpeg)?$/i))) {
        zoom = list[1];
        data = [tile2lng(list[2], zoom), tile2lat(list[3], zoom), zoom].join();
    }

    // OpenStreetMap: #map=18/52.58592/13.36120
    // => 13.36120,52.58592,18
    else if ((list = pos_string.match(/#map=(\d+)\/([\d\.\-]+)\/([\d\.\-]+)$/))) {
        data = [list[3], list[2], list[1]].join();
    }

    // tools.geofabrik.de: https://tools.geofabrik.de/mc/#15/49.0090/8.3981
    // => 8.3981,49.0090,15
    else if ((list = pos_string.match(/#(\d+)\/([\d\.\-]+)\/([\d\.\-]+)/))) {
        data = [list[3], list[2], list[1]].join();
    }

    // Google Maps:   @55.6713442,12.4907999,12z/
    // => 12.4907999,55.6713442,12
    else if ((list = pos_string.match(/@([\d\.\-]+),([\d\.\-]+),(\d+)z/))) {
        zoom = list[3];
        data = [list[2], list[1], zoom].join();
    }

    // Map Compare:   13.38885,52.51,12
    else {
        data = pos_string;
    }

    debug('Got position: "' + pos_string + '" => "' + data + '"');
    return data;
}


// wrapper to catch undefined errors

function _decodeURIComponent(v) {
    var result = "";

    if (typeof v == 'undefined') {
        return "";
    }

    try {
        result = decodeURIComponent(v)
    } catch (e) {;
    }

    // if undefined, return an empty string
    if (typeof result == 'undefined') {
        result = "";
    }

    return result;
}

/*
   get center of map as [lng,lat] array

   checked in order:
   1. cgi parameter
   2. cookies
   3. MC config
*/
function getMapCenter(override) {
    var p = {};
    var pos;
    var zoom = mc.pos.zoom;

    parseParams(function (param, v) {
        p[param] = _decodeURIComponent(v).replace(/\+*$|^\+*/g, "").replace(/\+/g, " ");
    });

    var pos_string = override || p["center"] || $.cookie(mc_console.cookie.centerOfMaps);

    if (!pos_string) return mc.pos;

    // lng,lat,zoom (x,y,z): 13.38885,52.51,12
    pos = pos_center_to_mc(pos_string).split(",");

    if (pos.length < 2) {
        debug("unknown pos: " + pos_string);
        return mc.pos;
    }
    if (!check_lng(pos[0])) {
        debug("unknown lng: " + pos[0]);
        return mc.pos;
    }
    if (!check_lat(pos[1])) {
        debug("unknown lat: " + pos[1]);
        return mc.pos;
    }


    if (pos[2]) {
        if (isNaN(pos[2]) || pos[2] > 20 || pos[2] < 0) {
            debug("unknown zoom level: " + pos[2] + ", ignored");
        } else {
            zoom = pos[2];
        }
    }

    var p = {
        "lng": pos[0],
        "lat": pos[1],
        "zoom": zoom
    };

    return p;
}

function consoleStoreMapCenter() {
    var tag = $('#center');
    var value = tag ? tag.attr("value") : "";

    var pos = getMapCenter(value);
    var string = pos2string(pos);

    setCookie(mc_console.cookie.centerOfMaps, string);
    debug("center of maps: " + string);
}


/*
   display menu to configure the default number of maps
*/
function consoleNumberOfMaps() {
    if (!mc_console.pref_numberOfMaps) return $("#pref_numberOfMaps").hide();

    var tag = $('#consoleNumberOfMaps');
    if (!tag) return false;

    var NumberOfMaps = getNumberOfMaps();

    for (var i = 0; i < state.layertypes.length; i++) {
        var j = i + 1;
        var opt = document.createElement('option');
        opt.value = j;
        opt.text = j;
        opt.style.padding = '1px';
        tag[0].options[i] = opt;

        // pre-select value
        if (j == NumberOfMaps) tag[0].options[i].selected = true;
    }

    // keep current value, even if nothing changed and the user pressed click
    mc.NumberOfMaps = NumberOfMaps;

    // on change update javascript variables
    tag.bind('change', null, function (event) {
        mc.NumberOfMaps = event.target.value;
    });

    return true;
}

function pos2string(pos) {
    var string = pos.lng + "," + pos.lat;
    if (pos.zoom) string += "," + pos.zoom;

    return string;
}

function consoleCenterOfMaps() {
    if (!mc_console.pref_centerOfMaps) { // disable section
        return $("#pref_centerOfMaps").hide();
    }

    var tag = $('#center');
    if (!tag) return false;

    var pos = getMapCenter();

    tag.attr("value", pos2string(pos));
    return true;
}

/*
 * XXX: should be rewritten using standard code function
 *
 */
function consoleOrderOfMaps() {
    var mapsPerRow = 2; // number of maps per row, 2..4
    if (!mc_console.pref_orderOfMaps) return $("#pref_orderOfMaps").hide();

    var tag = $('#consoleOrderOfMaps');
    if (!tag) return false;

    var NumberOfMaps = getNumberOfMaps();
    if (NumberOfMaps > 8) // show only 8 maps, more don't make sense
    NumberOfMaps = 8;

    var layertypes = state.layertypes;
    var html = "\n";
    for (var n = 1; n <= NumberOfMaps; n++) {
        html += "Map " + n + ": ";

        var optgroup_label = "none";
        html += '<select id="order_' + n + '">';
        // html += '<option value="">default</option>';
        for (var i = 0; i < layertypes.length; i++) {
            var str = layertypes[i].name.split(/\s+/);
            if (str.length > 0 && str[0] != optgroup_label) {
                optgroup_label = str[0];
                if (i > 0) html += '</optgroup>';

                html += '<optgroup label="' + optgroup_label + '">';
            }

            html += '<option '
            if (mc.mt[n - 1] && layertypes[i].type == mc.mt[n - 1]) html += 'selected="selected" '
            html += 'value="' + layertypes[i].type + '">' + layertypes[i].name + '</option>';
        }
        html += "</optgroup>\n";
        html += "</select>\n";
        html += (n % mapsPerRow == 0 ? "<br/>" : "\n");
    }
    tag.before(html);

    for (var n = 1; n <= NumberOfMaps; n++) {
        var tag = $('#order_' + n);

        // on change update javascript variables
        tag.bind('change', null, (function (number) {
            return function (event) {
                var value = event.target.value;
                if (value) mc.mt[number] = value;
                debug(value + " " + number);
            };
        })(n - 1)); // call by value, not a reference to n variable
    }

    debug(mc.mt.join("/"));
    return true;
}


function consoleStoreCookieNumberOfMaps() {
    var number = getNumberOfMaps(true);

    setCookie(mc_console.cookie.numberOfMaps, number);
    debug("number of maps: " + number);
}

function cookieCheck() {
    var name = mc_console.cookie.check;
    var value = $.cookie(name);

    if (!value) {
        var tag = $("#tools-console");
        tag.before('<p class="error">Please enable cookies!</p>');
    }
}

function setCookie(name, value, nocheck) {
    if (!nocheck) cookieCheck();

    $.cookie(name, value, {
        expires: mc.preferences_expire,
        path: '/'
    });
}

/*
   delete cookie by name, or all if no argument is given
*/
function consoleDeleteCookies(array) {
    var list = array || [];

    // delete all cookies
    if (list.length == 0) {
        list.push(mc_console.cookie.numberOfMaps);
        list.push(mc_console.cookie.orderOfMaps);
        list.push(mc_console.cookie.centerOfMaps);

        // all tile servers
        for (var i = 1; i <= mc_console.maxTileServer; i++) {
            list.push(mc_console.cookie.tileserver + i);
        }
    }

    for (var i = 0; i < list.length; i++) {
        $.cookie(list[i], null, {
            path: '/'
        });
    }
}

/*
  returns a tile server config object for a given number (1..4)
  The data is from the URL parameters or a cookie
*/
function getTileServerConfig(number) {
    var i = number;

    var p = {}
    parseParams(function (param, v) {
        p[param] = _decodeURIComponent(v).replace(/\+*$|^\+*/g, "").replace(/\+/g, " ");
    });

    var obj = {
        name: 'local_tileserver_name_' + i,
        url: 'local_tileserver_url_' + i,
        base: 'local_tileserver_isbaselayer_' + i,
        cookie: mc_console.cookie.tileserver + i
    };

    // validate tile server config

    function validateObj(obj, p, cookie) {
        var maxNameLength = 25;
        // cleanup
        for (var key in obj) {
            if (key.match(/_v$/)) continue; // XXX
            var k = cookie ? key : obj[key]; // cookie or cgi param
            if (typeof p[k] === 'undefined') p[k] = "";

            var val = p[k];
            obj[key + "_v"] = xss(val) ? "" : val;
        }

        if (obj.name_v.length > maxNameLength) {
            obj.name_v = obj.name_v.substring(0, maxNameLength);
        } else if (obj.name_v == "" && obj.url_v != '') {
            obj.name_v = "unknown";
        }

        obj.url_v = normalizeTileServerURL(obj.url_v);
        if (obj.url_v.length > 200) obj.url_v = "";
    }

    // read from URL parameters
    if (p["pref_tileserver"]) {
        validateObj(obj, p);
    }
    // read from cookie
    else {
        var _p = parseCookieTileServer(number);
        validateObj(obj, _p, true);
    }

    obj["pref_tileserver"] = p["pref_tileserver"];

    // disallow spaces in URLs
    if (!isURL(obj.url_v) || obj.url_v.match(/\s|\+/)) obj.url_v = "";

    return obj;
}


/*
  console: display user tile server configuration table
*/
function consoleTileServer() {
    if (!mc_console.pref_tileserver) return $("#pref_tileserver").hide();

    var tag = $('#table_tileserver');
    if (!tag) return false;

    var maxTileServer = mc_console.maxTileServer;

    for (var i = 1; i <= maxTileServer; i++) {
        var obj = getTileServerConfig(i);

        var text = '<tr>' + '<td>' + i + '</td>' + '<td><input maxlength="32" name="' + obj.name + '" type="text" value="' + obj.name_v + '"></td>' + '<td><input maxlength="256" name="' + obj.url + '" type="text" value="' + obj.url_v + '" /></td>' + '<td><select name="' + obj.base + '"><option value="1">yes</option>' + '<option value="0"' + (obj.base_v == "0" ? ' selected="selected"' : "") + '>no</option></td>' + '</tr>';

        tag.append(text);

        var cookie_value = obj.name_v + "^" + obj.url_v + "^" + obj.base_v;
        if (obj.url_v != "") {
            debug("cookie: " + obj.cookie + " " + cookie_value);
            setCookie(obj.cookie, cookie_value);
        } else {
            if (obj.pref_tileserver) {
                consoleDeleteCookies([obj.cookie]);
                debug(obj.cookie);
            }
        }
    }

    return true;
}

/*
  read all user tile server configs from cookies
*/
function initLayerTypesUserDefined() {
    for (var i = mc_console.maxTileServer; i > 0; i--) {
        var cookie = $.cookie(mc_console.cookie.tileserver + i)
        if (cookie) initLayerTypesCookie(i, cookie);
    }
}


/*
  check for valid input
*/
function xss(string) {
    var result = string.match(/[<>"'\^]/) ? 1 : 0;

    if (result) debug("xss detected");

    debug("xss: " + result);
    return result;
}

/*
   /osm/11/1100/671.png    -> /osm/${z}/${x}/${y}.png
   /osm/11/1100/671@2x.png -> /osm/${z}/${x}/${y}@2x.png
   /osm/11/1100/671.png?token=secret    -> /osm/${z}/${x}/${y}.png?token=secret
   
*/
function normalizeTileServerURL(url) {
    // https://tile.bbbike.org/osm/bbbike-smoothness/15/17602/10746.png
    var regex = new RegExp('/[12]?\\d/\\d+/\\d+\(@\\d+x)?(\.png|\.jpg|\.jpeg)?(\\?.*)?$');

    if (!url) return url;

    var u = url;
    if (u.match(regex)) {
        url = u.replace(regex, "/${z}/${x}/${y}$1$2$3");
    }

    // debug("Normalized URL: " + url);
    return url;
}

function parseCookieTileServer(i, cookie) {
    if (!cookie) cookie = $.cookie(mc_console.cookie.tileserver + i);
    if (!cookie) return {};

    var data = cookie.split("^");

    var obj = {
        "name": data[0],
        "url": data[1],
        // normalizeTileServerURL($data[1]),
        "base": data[2],
        "type": 'user_' + i
    };

    // must be a real URL
    if (!isURL(obj.url)) return {};
    if (xss(obj.url)) return {};

    return obj;
}

function isURL(url) {
    if (typeof url === 'undefined' || url == "") return false;

    // support multiple servers
    url = url.replace(/\{switch:([a-z0-9]+).*?\}/, "$1");

    var isURL = url.match(/^https?:\/\/[\w+_\-\.]+(:\d+)?\/[\$\w]+/i) ? true : false;

    debug("isURL: " + isURL);
    return isURL;
}

/*
 * support multiple servers in URL config
 * https://{switch:a,b}.tile.bbbike.org -> ["https://a.tile.bbbike.org", "https://a.tile.bbbike.org" ]
 */
function switch_url(url) {
    // Prefix: "http://", "https://", "//"
    var list = url.match(/^(https?:\/\/[0-9a-z\-]*?|\/\/[0-9a-z\-]*?)\{switch:([a-z0-9,]+)\}(.*)/i);

    if (!list || list.length == 0) {
        return url;
    }

    var servers = list[2].split(",");
    var url_list = [];
    for (var i = 0; i < servers.length; i++) {
        url_list.push(list[1] + servers[i] + list[3]);
    }

    return url_list;
}

/*
  add a user tile server
*/
function initLayerTypesCookie(i, cookie) {
    debug("got cookie: " + cookie);

    var obj = parseCookieTileServer(i, cookie);
    if (!isURL(obj.url)) return;

    if (obj.base != "0") {
        state.layertypes.unshift(new LayerType(obj.type, obj.name, function () {
            return new OpenLayers.Layer.OSM(obj.name, switch_url(obj.url), {
                tileOptions: {
                    crossOriginKeyword: null
                },
                // openlayers 2.12
                sphericalMercator: true
            })
        }));
        // addMaptypeToOrder(obj.type);
    } else {
        // over_layertypes.unshift(l);
        state.over_layertypes.unshift(new OverLayerType(obj.type, obj.name, function () {
            return new OpenLayers.Layer.OSM(obj.name, switch_url(obj.url), {
                tileOptions: {
                    crossOriginKeyword: null
                },
                sphericalMercator: true,
                isBaseLayer: false
            })
        }));
    }
}

// add a maptype to prefered order list

function addMaptypeToOrder(maptype) {
    for (var i = 0; i < mc.mt.length; i++) {
        // maptype already exists, skip
        if (mc.mt[i] == maptype) return;
    }
    mc.mt.unshift(maptype);
}

/*
  social links
*/

/*
   see https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
*/
function tile2lng(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

function tile2lnglat(url) {
    // https://tile.bbbike.org/osm/bbbike-smoothness/15/17602/10746.png
    var regex = new RegExp(/^https?:\/\/.*?\/([12]?\\d)\/(\\d+)\/(\\d+)(@\\d+x)?\.(png|jpg)$/i);

    var lng;
    var lat;

    if (!url) return undefined;

    var match = regex.exec(url);

    if (!match) {
        return undefined;
    }

    var zoom = match[1];
    lng = tile2lng(match[2], zoom);
    lat = tile2lat(match[3], zoom);
    if (isNaN(lng) || isNaN(lat)) {
        return undefined;
    }

    var obj = {
        "lng": lng,
        "lat": lat,
        "zoom": zoom
    };

    return obj;
}


/* validate lat or lng values */

function check_lat(number) {
    return check_coord(number, 90)
}

function check_lng(number) {
    return check_coord(number, 180)
}

function check_coord(number, max) {
    if (isNaN(number) || number == "") {
        return false;
    }
    if (number >= -max && number <= max) {
        return true;
    }

    return false;
}

function chooseAddrBTLR(b, t, l, r, lon, lat, message) {
    chooseAddr(l, b, r, t, lon, lat, message)
}

function chooseAddr(l, b, r, t, lon, lat, message) {
    var bounds = new OpenLayers.Bounds(l, b, r, t).transform("EPSG:4326", "EPSG:900913");
    map.zoomToExtent(bounds);
    var zoom = map.zoom;

    if (mc.search.max_zoom && mc.search.max_zoom < zoom) {
        zoom = mc.search.max_zoom;
        debug("reset zoom level for address: " + zoom);
        map.zoomTo(zoom);
    }

    // marker for address
    if (mc.search.show_marker) {
        set_popup({
            "lon": lon,
            "lat": lat,
            "message": message
        });
    }
}

function set_search_width() {
    var width = $(window).width();
    var height = $("div#search-results").outerHeight(true) + $("div#search-form").outerHeight(true);
    var max_with = 760;

    if (width > max_with) {
        width = max_with;
    }
    var help_width = Math.floor(width * 0.95);

    $(".jqmWindow").width(help_width);
    $(".jqmWindow").css("right", 20);

    $(".dialog-search").height(height + 20);
    debug("search help width: " + help_width + " height: " + $(".dialog-search").outerHeight(true));
}

function mc_search(query) {
    if (!query) {
        query = $("input#address-query").attr("value") || "";
    }

    if (mc.search.type == 'nominatim') {
        mc_search_nominatim(query);
    } else {
        debug("unknown search type");
    }
}

function init_search() {
    // $('#address-submit').click(function () {
    // IE8, IE9 submit on enter, see https://support.microsoft.com/kb/298498/
    $('div#search-form form').on('submit', function () {
        mc_search();
        return false;
    });

    // disable keyboard shortcuts on input fields
    $("div#search-form").on("focus blur mousein mouseout mouseover", "input#address-query", function () {
        var active = document.activeElement.id == this.id;

        debug("document active: " + (document.activeElement.id ? document.activeElement.id : "ACTIVE") + " " + active);
        active ? state.control.keyboard.deactivate() : state.control.keyboard.activate();
    });

    set_search_width();

    // XXX: on newer jqModal we need a timeout
    setTimeout(function () {
        set_search_width();
    }, 0);

    // XXX: jquery 1.8.3 set the focus later
    // inital focus set
    setTimeout(function () {
        $("div#search-form input#address-query").focus();
    }, 50);
}

function init_share() {
    function show_url(url) {
        var message = '<a href="' + url + '">' + url + "</a>";
        $("span#url_share").html(message);
    }

    function show_url_from_input() {
        var url = jQuery('#permalink').attr("href");
        var u = url;

        // remove old marker parameter
        if (u.indexOf("&marker=") != -1) {
            u = u.substring(0, u.indexOf("&marker="));
            debug("cleanup old marker message: " + url);
        }

        var marker_value = $("input#share-message").attr("value");
        if (marker_value != "") {
            show_url(u + "&marker=" + encodeURI(marker_value));
        } else {
            show_url(u);
        }

        state.marker_message = marker_value;
    }

    $('input#share-message').change(function () {
        show_url_from_input()
    });
    $('input#share-message').keyup(function () {
        show_url_from_input()
    });

    // zoom level changes will trigger some actions
    map.events.register("zoomend", map, function () {
        if ($("input#share-message:visible").length) {
            debug("zoom change");
            show_url_from_input();
        }
    });

    // disable keyboard shortcuts on input fields
    $("div#share-form").on("focus blur mousein mouseout mouseover", "input#share-message", function () {
        var active = document.activeElement.id == this.id;

        debug("document active: " + (document.activeElement.id ? document.activeElement.id : "ACTIVE") + " " + active);
        active ? state.control.keyboard.deactivate() : state.control.keyboard.activate();
    });

    // pre-filled form
    if (state.marker_message) {
        $("input#share-message").attr("value", state.marker_message);
    }

    share_marker(getPosition());
    show_url_from_input();

    set_share_width();

    // XXX: jquery 1.8.3 set the focus later
    // inital focus set
    setTimeout(function () {
        $("div#share-form input#share-message").focus();
    }, 50);
}

function set_share_width() {
    var width = $(window).width();
    var height = $("div.dialog-share").outerHeight(true);
    var max_with = 720;

    if (width > max_with) {
        width = max_with;
    }
    var share_width = Math.floor(width * 0.95);

    $(".jqmWindow").width(share_width);
    $(".jqmWindow").css("right", 20);

    $("div.dialog-share").height(height + 30);
    debug("search help width: " + share_width + " height: " + $(".dialog-share").outerHeight(true));
}

/*
 viewbox=<left>,<top>,<right>,<bottom>
 or viewboxlbrt=<left>,<bottom>,<right>,<top>
   The preferred area to find search results
   */

function get_viewport(map) {
    var proj = map.getProjectionObject();
    var center = map.getCenter().clone();
    var zoom = map.getZoom();

    var box = map.getExtent();
    // 13.184573,52.365721,13.593127,52.66782
    // x1,y1 x2,y2
    var bbox = box.transform(map.getProjectionObject(), state.proj4326).toArray();

    debug(bbox + " " + bbox.length);

    if (bbox && bbox.length == 4) {
        return bbox.join(",");
    } else {
        debug("Warning: no viewboxlbrt found");
        return "";
    }
}

function mc_search_nominatim(query, offset, paging) {
    var limit = mc.search.limit || 25;
    var viewport = "";

    if (!paging) {
        paging = mc.search.paging || 5;
    }
    if (!offset) {
        offset = 0;
    }

    var items = [];
    var counter = 0;


    if (mc.search.viewbox) {
        viewport = get_viewport(map);
    }

    debug("start address search query: " + query + " limit: " + limit + " viewport: " + viewport);
    $("div#search-results").html("<p>start searching...</p>"); // remove old results first
    set_search_width();

    var email = mc.search.user_agent ? "&email=" + mc.search.user_agent : "";

    // async search request to nominatim
    var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=' + limit + "&viewboxlbrt=" + viewport + '&q=' + encodeURI(query) + email;;

    // IE8/IE9
    // $.support.cors = false;
    $.getJSON(url, function (data) {
        $("div#search-results").html(""); // remove old results first
        $.each(data, function (index, val) {
            counter++;
            if (index >= offset && index < offset + paging) {
                if (items.length == 0) {
                    $("div#search-results").append("<br/>");
                }
                debug("Address: " + index + ". " + val.display_name + " lat: " + val.lat + " lon: " + val.lon);

                var link = "<p><a title='lat,lon: " + val.lat + "," + val.lon + " [" + val["class"] + "]'";
                link += "href='#' onclick='chooseAddrBTLR(" + val.boundingbox + "," + val.lon + "," + val.lat + ", \"" + escapeHtmlEntities(val.display_name) + "\");return false;'>";
                link += (data.length == 1 ? "" : counter + ") "); // only one hit, no numbers
                link += escapeHtmlEntities(val.display_name + " [" + val["class"] + "]") + "</a></p>";
                $("div#search-results").append(link);
                items.push(link);
            }
        });

        // nothing found
        if (items.length == 0) {
            $("div#search-results").append("<p>No results found</p>");
        }

        // probably more results, search again
        else if (items.length == paging && offset + paging < counter) {
            $("div#search-results").append("<hr/><a href='#' onclick='mc_search_nominatim(\"" + query + "\"," + (offset + paging) + ", " + paging + "); return false;'>More results...</a>");
        }

        set_search_width();

    }).fail(function (data, textStatus, error) {
        debug("error nominatim search: " + url);
        debug("error nominatim: data: " + data + ", textStatus: " + textStatus + ", error: " + error);
        $("div#search-results").html("<p>Search with nominatim failed. Please try again later. Sorry!</p>" + "<p>" + error + "</p>");
        set_search_width();
    });
}

function escapeHtmlEntities(str) {
    // does not work with single or double quotes
    // var text = $('<div/>').text(str).html();
    var text = str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    debug("link text: " + text);
    return text;
}

/*
 * js/common.js
 *
 */

function parseParams(handler) {
    var perma = location.search.substr(1);
    if (perma != '') {
        var paras = perma.split('&');
        for (var i = 0; i < paras.length; i++) {
            // &a=1
            // &a=
            // &a
            var p = paras[i].split('=');
            handler(p[0], typeof p[1] == 'undefined' ? "" : p[1]);
        }
    }
}

function getPosition() {
    var proj = state.proj4326; // proj4326
    var center = map.getCenter().clone().transform(map.getProjectionObject(), proj);
    return new MapPosition(
    Math.round(center.lon * 1000000) / 1000000, Math.round(center.lat * 1000000) / 1000000, map.getZoom());
}

/* the help window must be smaller than the main window
 * otherwise we don't see the cancel button on mobile devices
 */
function set_help_width() {
    var width = $(window).width();
    var height = $(window).height();

    if (width > 780) {
        width = 780;
    }
    var help_width = Math.floor(width * 0.95);

    debug("help width: " + help_width + " height: " + height);
    $("#tools-helpwin").width(help_width);
    $("#tools-helpwin").css("left", Math.floor(($(window).width() - help_width) / 2));

    $(".dialog-msg").height(height - 100);
}

$(document).ready(function () {
    if ($('#tools-helpwin').length == 0) return;

    // $('#tools-switcher').bind('change', chooseTool);
    // helper window, blocking
    $('#tools-helpwin').jqm({
        ajax: '@href',
        trigger: 'a.tools-helptrigger',
        overlay: 20,
        /* overlayClass: 'whiteOverlay', */
        onLoad: function (hash) {
            hash.w.jqmAddClose('.dialog-close');
            $("#tools-helpwin").css("top", 20); // always on top of a page
            debug("onLoad helpwin");
        }
    }).draggable();

    // search window, with input, moveable
    $('#tools-inputwin').jqm({
        ajax: '@href',
        trigger: 'a.tools-inputtrigger',
        overlay: 0,
        onLoad: function (hash) {
            hash.w.jqmAddClose('.dialog-close');
            $("#tools-inputwin").css("top", 20); // always on top of a page
            debug("onLoad inputwin");
        }
    }).draggable();
});

/* ================================================== */

function MapPosition(lon, lat, zoom) {
    this.lon = lon;
    this.lat = lat;
    this.zoom = zoom;
}

MapPosition.prototype.getLonLat = function () {
    return new OpenLayers.LonLat(this.lon, this.lat);
}

MapPosition.prototype.tileX = function () {
    if ((this.zoom < 3) || (this.zoom > 18)) {
        return 0;
    }
    return Math.round((1 << (this.zoom - 3)) * (this.lon + 180.0) / 45.0);
}

MapPosition.prototype.tileY = function () {
    if ((this.zoom < 3) || (this.zoom > 18)) {
        return 0;
    }
    var l = this.lat / 180 * Math.PI;
    var pf = Math.log(Math.tan(l) + (1 / Math.cos(l)));
    return Math.round((1 << (this.zoom - 1)) * (Math.PI - pf) / Math.PI);
}

function createMapPositionFromTiles(x, y, zoom) {
    var lon;
    var lat;

    if ((zoom < 3) || (zoom > 18)) {
        lon = 0;
    } else {
        lon = (x + 0.5) * 45.0 / (1 << (zoom - 3)) - 180.0;
    }

    if ((zoom < 3) || (zoom > 18)) {
        lat = 0;
    } else {
        lat = Math.atan(sinh(Math.PI - (Math.PI * (y + 0.5) / (1 << (zoom - 1))))) * 180 / Math.PI;
    }

    return new MapPosition(lon, lat, zoom);
}

function sinh(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2;
}

function createMapPosition(lon, lat, x, y, zoom) {
    if (x != null && y != null) {
        return createMapPositionFromTiles(x, y, zoom);
    } else if (lon != null && lat != null) {
        return new MapPosition(lon, lat, zoom);
    } else {
        return new MapPosition(0, 0, zoom);
    }
}

function validate_profile(p) {
    if (!p) {
        p = profile;
    }

    for (var alias in p) {
        if (mc.debug >= 2) debug("profile: " + alias + ", length: " + p[alias].mt.length);
        for (var i = 0; i < p[alias].mt.length; i++) {
            var type = p[alias].mt[i];
            if (!state.layertypes_hash[type]) {
                debug("profile: '" + alias + "', unknown map: " + type);
            }
        }
    }
}

// wms needs some more options

function get_external_layer_options_wms(max_zoom, url) {
    var data = get_external_layer_options(max_zoom);

    data.href = url;
    data.getURL = wms_getTileURL;

    return data;
}

// tms

function get_external_layer_options(max_zoom) {
    if (!max_zoom) {
        max_zoom = 19;
    }

    return {
        tileOptions: {
            crossOriginKeyword: null
        },
        sphericalMercator: true,
        // buffer: 0,
        transitionEffect: "resize",
        numZoomLevels: max_zoom
    };
}

function get_external_layers_pos(l) {
    var options = {};

    var zoom_level = 5; // level up to max_zoom
    var zoom_default = 8;
    var min_zoom = 6;

    if (l.box) {
        var lon = (l.box[0][0] + l.box[1][0]) / 2;
        var lat = (l.box[0][1] + l.box[1][1]) / 2;

        // full world coverage, use default center Berlin
        if (lon == 0 && lat == 0) {
            lon = mc.pos.lng;
            lat = mc.pos.lat;
        }

        // half between max and min zoom
        if (l.max_zoom !== undefined && l.min_zoom !== undefined) {
            zoom_default = Math.round((l.max_zoom + l.min_zoom) / 2 - 0.5);
        }

        // guess a value close, but not to fare away from max_zoom 
        else if (l.max_zoom !== undefined) {
            zoom_default = Math.round((l.max_zoom + min_zoom) / 2 - 0.5);
        }

        // debug("center lon=" + lon + " lat=" +lat + " name=" + " zoom=" + zoom_default + " name=" + l.name)
        options = {
            pos: {
                lon: lon,
                lat: lat,
                zoom: zoom_default
            }
        };
    }

    return options;
}

function is_enabled_external_layer(id, name) {
    var mt = mc.mt;

    // if the map id is set in the URL (mt0 .. mt14)
    for (var i = 0; i < mt.length; i++) {
        if (mt[i] == id) {
            return 1;
        }
    }

    // if we configured the parameter &eo-osmlab-match=
    var match_id = state.external_options["match-id"];
    var match_name = state.external_options["match-name"];

    // console.log("id=" + id + " match-id=" + match_id + " name=" + name + " match-name=" + match_name);
    // a dot ('.') is a wildcard and match everything
    if (match_id == "." || match_name == ".") {
        return 2;
    }

    if (match_id != "" && id.indexOf(match_id) != -1) {
        return 3;
    }
    if (match_name != "" && name.indexOf(match_name) != -1) {
        return 3;
    }

    // not match, ignore
    return 0;
}

// we can have multiple external providers: osmlab, historicmaps

function add_external_layers(providers) {
    for (var i = 0; i < providers.length; i++) {
        add_external_layer(providers[i]);
    }
}

// we configure new layers if enabled by id or name

function add_external_layer(layer_config) {
    for (var i = 0, l; i < layer_config.length; i++) {
        l = layer_config[i];

        // ignore layer
        if (is_enabled_external_layer(l.id, l.name) == 0) {
            continue;
        }

        state.layertypes.push(
        new LayerType(l.id, l.name, (function (l) {
            return function () {
                debug("init id: " + l.id + " url: " + l.url + " name: " + l.name + " maxzoom=" + l.max_zoom);
                // console.log( get_external_layers_pos(l));
                // console.log(state.external_options);
                if (l.type == "tms") {
                    return new OpenLayers.Layer.OSM(l.name, switch_url(l.url), get_external_layer_options(l.max_zoom));
                } else if (l.type == "wms") {
                    return new OpenLayers.Layer.OSM(l.name, "", get_external_layer_options_wms(l.max_zoom, l.url));
                }
            }
        })(l), // need to pass value of "l" right now, not later, 3rd argument
        get_external_layers_pos(l) // LayerType 4th argument
        ) // new LayerType
        ) // push
    }
}

/* EOF */
