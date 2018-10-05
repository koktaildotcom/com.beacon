"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');

class NRF51822Driver extends BeaconDriver {
    getBleIntentifier() {
        return 'NRF51822';
    }
    getBleName() {
        return 'NRF51822';
    }
}

module.exports = NRF51822Driver;