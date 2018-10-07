"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');

class GenericBeaconDriver extends BeaconDriver {
    getBleName() {
        return 'Generic beacon';
    }
}

module.exports = GenericBeaconDriver;