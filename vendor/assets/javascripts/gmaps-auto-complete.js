class GmapsCompleter {
  static initClass() {
    this.prototype.geocoder = null;
    this.prototype.map = null;
    this.prototype.marker = null;
    this.prototype.inputField = null;
    this.prototype.errorField = null;
    this.prototype.positionOutputter = null;
    this.prototype.updateUI = null;
    this.prototype.updateMap = null;
    this.prototype.region = null;
    this.prototype.country = null;
    this.prototype.debugOn = false;
  
    // initialise the google maps objects, and add listeners
    this.prototype.mapElem = null;
    this.prototype.zoomLevel = 2;
    this.prototype.mapType = null;
    this.prototype.pos = [0, 0];
    this.prototype.inputField = '#gmaps-input-address';
    this.prototype.errorField = '#gmaps-error';
  }

  constructor(opts) {
    this.performGeocode = this.performGeocode.bind(this);
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.init(opts);
  }

  init(opts) {
    opts      = opts || {};
    let callOpts  = $.extend(true, {}, opts);

    this.debugOn    = opts['debugOn'];

    this.debug('init(opts)', opts);

    let completerAssistClass = opts['assist'];

    try {
      this.assist = new completerAssistClass;

    } catch (error) {
      this.debug('assist error', error, opts['assist']);
    }

    if (!this.assist) { this.assist = new GmapsCompleterDefaultAssist; }

    this.defaultOptions = opts['defaultOptions'] || this.assist.options;
    opts  = $.extend(true, {}, this.defaultOptions, opts);

    this.positionOutputter  = opts['positionOutputter'] || this.assist.positionOutputter;
    this.updateUI           = opts['updateUI'] || this.assist.updateUI;
    this.updateMap          = opts['updateMap'] || this.assist.updateMap;

    this.geocodeErrorMsg    = opts['geocodeErrorMsg'] || this.assist.geocodeErrorMsg;
    this.geocodeErrorMsg    = opts['geocodeErrorMsg'] || this.assist.geocodeErrorMsg;
    this.noAddressFoundMsg  = opts['noAddressFoundMsg'] || this.assist.noAddressFoundMsg;

    let pos   = opts['pos'];
    let lat   = pos[0];
    let lng   = pos[1];

    let mapType   = opts['mapType'];
    let mapElem   = null;
    this.mapElem  =  $("gmaps-canvas");

    if (opts['mapElem']) { this.mapElem  = $(opts['mapElem']).get(0); }
    this.mapType  = google.maps.MapTypeId.ROADMAP;

    let zoomLevel = opts['zoomLevel'];
    let scrollwheel = opts['scrollwheel'];

    this.inputField = opts['inputField'];
    this.errorField = opts['#gmaps-error'];
    this.debugOn    = opts['debugOn'];

    this.submitFormOnSelect = opts['submitFormOnSelect'];

    this.debug('called with opts',  callOpts);
    this.debug('final completerAssist', this.completerAssist);
    this.debug('defaultOptions',    this.defaultOptions);
    this.debug('options after merge with defaults', opts);

    // center of the universe
    let latlng = new google.maps.LatLng(lat, lng);
    this.debug('lat,lng', latlng);

    let mapOptions = {
      zoom: zoomLevel,
      scrollwheel,
      center: latlng,
      mapTypeId: mapType
    };

    this.debug('map options', mapOptions);

    // the geocoder object allows us to do latlng lookup based on address
    this.geocoder = new google.maps.Geocoder();

    let self = this;

    if (typeof(this.mapElem) === 'undefined') {
      this.showError(`Map element ${opts['mapElem']} could not be resolved!`);
    }

    this.debug('mapElem', this.mapElem);

    if (!this.mapElem) { return; }

    // create our map object
    this.map = new google.maps.Map(this.mapElem, mapOptions);

    if (!this.map) { return; }

    // the marker shows us the position of the latest address
    this.marker = new google.maps.Marker({
      map: this.map,
      draggable: true
    });

    return self.addMapListeners(this.marker, this.map);
  }

  debug(label, obj) {
    if (!this.debugOn) { return; }
    return console.log(label, obj);
  }

  addMapListeners(marker, map) {
    let self = this;
    // event triggered when marker is dragged and dropped
    google.maps.event.addListener(marker, 'dragend', () => self.geocodeLookup('latLng', marker.getPosition()));

    // event triggered when map is clicked
    return google.maps.event.addListener(map, 'click', function(event) {
      marker.setPosition(event.latLng);
      return self.geocodeLookup('latLng', event.latLng);
    });
  }


  // Query the Google geocode object
  //
  // type: 'address' for search by address
  //       'latLng'  for search by latLng (reverse lookup)
  //
  // value: search query
  //
  // update: should we update the map (center map and position marker)?
  geocodeLookup( type, value, update ) {
    // default value: update = false
    if (!this.update) { this.update = false; }

    let request = {};
    request[type] = value;

    return this.geocoder.geocode(request, this.performGeocode);
  }

  performGeocode(results, status) {
    this.debug('performGeocode', status);

    $(this.errorField).html('');

    if (status === google.maps.GeocoderStatus.OK) { return this.geocodeSuccess(results); } else { return this.geocodeFailure(type, value); }
  }

  geocodeSuccess(results) {
    this.debug('geocodeSuccess', results);

    // Google geocoding has succeeded!
    if (results[0]) {
      // Always update the UI elements with new location data
      this.updateUI(results[0].formatted_address, results[0].geometry.location);

      // Only update the map (position marker and center map) if requested
      if (this.update) { return this.updateMap(results[0].geometry); }

    } else {
      // Geocoder status ok but no results!?
      return this.showError(this.geocodeErrorMsg());
    }
  }

  geocodeFailure(type, value) {
    this.debug('geocodeFailure', type);

    // Google Geocoding has failed. Two common reasons:
    //   * Address not recognised (e.g. search for 'zxxzcxczxcx')
    //   * Location doesn't map to address (e.g. click in middle of Atlantic)
    if (type === 'address') {
      // User has typed in an address which we can't geocode to a location
      return this.showError(this.invalidAddressMsg(value));
    } else {
      // User has clicked or dragged marker to somewhere that Google can't do a reverse lookup for
      // In this case we display a warning, clear the address box, but fill in LatLng
      this.showError(this.noAddressFoundMsg());
      return this.updateUI('', value);
    }
  }

  showError(msg) {
    $(this.errorField).html(msg);
    $(this.errorField).show();

    return setTimeout( function() {
      return $(this.errorField).hide();
    }
    , 1000);
  }

  // initialise the jqueryUI autocomplete element
  autoCompleteInit(opts) {
    opts      = opts || {};
    this.region   = opts['region']  || this.defaultOptions['region'];
    this.country  = opts['country'] || this.defaultOptions['country'];
    this.debug('region', this.region);

    let self = this;

    let autocompleteOpts = opts['autocomplete'] || {};

    let defaultAutocompleteOpts = {
      // event triggered when drop-down option selected
      select(event,ui) {
        self.updateUI(ui.item.value, ui.item.geocode.geometry.location);
        return self.updateMap(ui.item.geocode.geometry);
      },
      // source is the list of input options shown in the autocomplete dropdown.
      // see documentation: http://jqueryui.com/demos/autocomplete/
      source(request,response) {
        // https://developers.google.com/maps/documentation/geocoding/#RegionCodes
        let region_postfix  = '';
        let { region }          = self;

        if (region) { region_postfix = `, ${region}`; }
        let address = request.term + region_postfix;

        self.debug('geocode address', address);

        let geocodeOpts = { address };

        // the geocode method takes an address or LatLng to search for
        // and a callback function which should process the results into
        // a format accepted by jqueryUI autocomplete
        return self.geocoder.geocode(geocodeOpts, (results, status) =>
          response(
            $.map(results, function(item) {
              let uiAddress = item.formatted_address.replace(`, ${self.country}`, '');
              // var uiAddress = item.formatted_address;
              return {
              label: uiAddress, // appears in dropdown box
              value: uiAddress, // inserted into input element when selected
              geocode: item    // all geocode data: used in select callback event
              };
            })
          )
        );
      }
    };

    autocompleteOpts = $.extend(true, defaultAutocompleteOpts, autocompleteOpts);

    $(this.inputField).autocomplete(autocompleteOpts);

    // triggered when user presses a key in the address box
    return $(this.inputField).bind('keydown', this.keyDownHandler);
  }
    // autocomplete_init

  keyDownHandler(event) {
    if (event.keyCode === 13) {
      this.geocodeLookup('address', $(this.inputField).val(), true);
      // ensures dropdown disappears when enter is pressed
      return $(this.inputField).autocomplete("disable");
    } else {
      // re-enable if previously disabled above
      return $(this.inputField).autocomplete("enable");
    }
  }
}
GmapsCompleter.initClass();


class GmapsCompleterDefaultAssist {
  static initClass() {
    this.prototype.options = {
      mapElem: '#gmaps-canvas',
      zoomLevel: 2,
      mapType: google.maps.MapTypeId.ROADMAP,
      pos: [0, 0],
      inputField: '#gmaps-input-address',
      errorField: '#gmaps-error',
      debugOn: true
    };
  }

  // move the marker to a new position, and center the map on it
  updateMap(geometry) {
    let { map }     = this;
    let { marker }  = this;

    if (map) { map.fitBounds(geometry.viewport); }
    if (marker) { return marker.setPosition(geometry.location); }
  }

  // fill in the UI elements with new position data
  updateUI(address, latLng) {
    let { inputField } = this;
    let { country } = this;

    $(inputField).autocomplete('close');

    this.debug('country', country);

    let updateAdr = address.replace(`, ${country}`, '');
    updateAdr = address;

    this.debug('updateAdr', updateAdr);

    $(inputField).val(updateAdr);

    //submit rails form
    if (this.submitFormOnSelect) {
      $(this.inputField).trigger('submit.rails');
    }

    return this.positionOutputter(latLng);
  }

  positionOutputter(latLng) {
    $('#gmaps-output-latitude').html(latLng.lat());
    return $('#gmaps-output-longitude').html(latLng.lng());
  }

  geocodeErrorMsg() {
    return "Sorry, something went wrong. Try again!";
  }

  invalidAddressMsg(value) {
    return `Sorry! We couldn't find ${value}. Try a different search term, or click the map.`;
  }

  noAddressFoundMsg() {
    return "Woah... that's pretty remote! You're going to have to manually enter a place name.";
  }
}
GmapsCompleterDefaultAssist.initClass();

window.GmapsCompleter = GmapsCompleter;
window.GmapsCompleterDefaultAssist = GmapsCompleterDefaultAssist;
