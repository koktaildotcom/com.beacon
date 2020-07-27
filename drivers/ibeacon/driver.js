"use strict";

const drivers = require('../drivers');
const BeaconDriver = require('../../lib/beacon-driver.js');

class IBeaconDriver extends BeaconDriver {

    /**
     * @return string
     */
    getBleName() {
        return 'iBeacon';
    }

    /**
     * @return string
     */
    getBeaconType() {
        return drivers.IBEACON;
    }
}

module.exports = IBeaconDriver;
