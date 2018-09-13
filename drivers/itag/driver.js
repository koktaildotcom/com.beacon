"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');

class ItagDriver extends BeaconDriver {
    getBleIntentifier() {
        return 'ITAG';
    }
    getBleName() {
        return 'Itag';
    }
}

module.exports = ItagDriver;