"use strict";

const drivers = require('../drivers');
const BeaconDriver = require('../../lib/beacon-driver.js');

class EddystoneDriver extends BeaconDriver {

    /**
     * @return string
     */
    getBleName() {
        return 'Eddystone';
    }

    /**
     * @return string
     */
    getBeaconType() {
        return drivers.EDDYSTONE;
    }
}

module.exports = EddystoneDriver;
