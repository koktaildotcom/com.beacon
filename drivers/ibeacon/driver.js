"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');

class IBeaconDriver extends BeaconDriver {
    getBleName() {
        return 'iBeacon';
    }

    get handledBeaconType() {
        return BeaconAdvertisement.btaIBeacon;
    }
}

module.exports = IBeaconDriver;