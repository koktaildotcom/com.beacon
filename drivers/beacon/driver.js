"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');

class GenericBeaconDriver extends BeaconDriver {

    /**
     * @return string
     */
    getBleName() {
        return 'Generic beacon';
    }

    /**
     * @return number
     */
    getBeaconType() {
        return BeaconAdvertisement.btaGenericBeacon;
    }
}

module.exports = GenericBeaconDriver;
