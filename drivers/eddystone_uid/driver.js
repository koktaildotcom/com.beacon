"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');

class EddystoneUIDDriver extends BeaconDriver {
    getBleName() {
        return 'Eddystone UID';
    }

    get handledBeaconType() {
        return BeaconAdvertisement.btaEddystoneUID;
    }
}

module.exports = EddystoneUIDDriver;