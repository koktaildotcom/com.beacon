"use strict";

const drivers = require('../drivers');
const BeaconDriver = require('../../lib/beacon-driver.js');

class GenericBeaconDriver extends BeaconDriver {

    /**
     * @return string
     */
    getBleName() {
        return 'Generic beacon';
    }

    /**
     * @return string
     */
    getBeaconType() {
        return drivers.GENERIC;
    }
}

module.exports = GenericBeaconDriver;
