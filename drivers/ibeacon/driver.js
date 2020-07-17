"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');

class IBeaconDriver extends BeaconDriver {

    /**
     * @return string
     */
    getBleName() {
        return 'iBeacon';
    }

    /**
     * @return number
     */
    getBeaconType() {
        return BeaconAdvertisement.btaIBeacon;
    }
}

module.exports = IBeaconDriver;
