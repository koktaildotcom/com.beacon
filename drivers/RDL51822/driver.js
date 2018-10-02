"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');

class RDL51822gDriver extends BeaconDriver {
    getBleIntentifier() {
        return 'RDL51822';
    }
    getBleName() {
        return 'RDL51822';
    }
}

module.exports = RDL51822gDriver;