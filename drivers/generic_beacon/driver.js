"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');

class GenericBeaconDriver extends BeaconDriver {

    /**
     * @return string
     */
    getBleName() {
        return 'Generic generic_beacon';
    }

    /**
     * @return string
     */
    static getBeaconType() {
        return 'generic'
    }
}

module.exports = GenericBeaconDriver;
