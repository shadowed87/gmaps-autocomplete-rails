jQuery(function() {
    let completer = new GmapsCompleter({
        inputField: '#gmaps-input-address',
        errorField: '#gmaps-error'
    });

    return completer.autoCompleteInit({
        country: "us"});
});
