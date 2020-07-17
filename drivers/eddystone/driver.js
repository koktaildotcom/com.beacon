"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');

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
    static getBeaconType() {
        return 'eddystone'
    }
}

module.exports = EddystoneDriver;
