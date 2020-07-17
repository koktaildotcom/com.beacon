"use strict";

const BeaconDriver = require('../../lib/BeaconDriver.js');
const BeaconAdvertisement = require('../../lib/BeaconAdvertisement.js');

class EddystoneUIDDriver extends BeaconDriver {

    /**
     * @return string
     */
    getBleName() {
        return 'Eddystone UID';
    }

    /**
     * @return number
     */
    getBeaconType() {
        return BeaconAdvertisement.btaEddystoneUID;
    }
}

module.exports = EddystoneUIDDriver;
