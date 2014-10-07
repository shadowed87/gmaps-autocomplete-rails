// Generated by LiveScript 1.2.0
(function(){
  var Displayer, AutoCompleter, GeoCoder, Debugger, ErrorHandler, GmapsCompleter;
  Displayer = require('./displayer');
  AutoCompleter = require('./auto-completer');
  GeoCoder = require('./geocoder');
  Debugger = require('./debugger');
  ErrorHandler = require('./error-handler');
  module.exports = GmapsCompleter = (function(){
    GmapsCompleter.displayName = 'GmapsCompleter';
    var prototype = GmapsCompleter.prototype, constructor = GmapsCompleter;
    importAll$(prototype, arguments[0]);
    importAll$(prototype, arguments[1]);
    importAll$(prototype, arguments[2]);
    function GmapsCompleter(options){
      options == null && (options = {});
      this.configure();
      this;
    }
    prototype.configHelpers = function(){
      var i$, ref$, len$, helper, results$ = [];
      for (i$ = 0, len$ = (ref$ = ['displayer', 'autoCompleter', 'geocoder']).length; i$ < len$; ++i$) {
        helper = ref$[i$];
        results$.push(this[helper] = options[helper] || this.defaults[helper]());
      }
      return results$;
    };
    prototype.defaults = {
      displayer: function(){
        return new Displayer(this);
      },
      autoCompleter: function(){
        return new AutoCompleter;
      },
      geocoder: function(){
        return new GeoCoder(this);
      }
    };
    prototype.configure = function(){
      import$(this.config, options);
      this.configHelpers();
      this.debugOn = this.config.debug;
      this.lat = this.config.map.lat;
      this.lng = this.config.map.lng;
      this.inputField = $(config.element.input);
      this.errorField = $(config.element.error);
      this.geocoder = new google.maps.Geocoder;
      return this;
    };
    prototype.mapElement = function(){
      this.map = $(config.element.map);
      if (!this.map) {
        return this.error("Map element " + config.element.map + " could not be resolved!");
      }
    };
    prototype.config = {
      map: {
        zoom: 2,
        type: google.maps.MapTypeId.ROADMAP,
        position: {
          lat: 0,
          lng: 0
        }
      },
      element: {
        map: '#gmaps-canvas',
        input: '#gmaps-input-address',
        error: '#gmaps-error',
        latitude: '#gmaps-output-latitude',
        longitude: '#gmaps-output-longitude'
      },
      debug: false
    };
    return GmapsCompleter;
  }(ErrorHandler, Debugger, Listeners));
  function importAll$(obj, src){
    for (var key in src) obj[key] = src[key];
    return obj;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);