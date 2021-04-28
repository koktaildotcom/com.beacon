'use strict';

const BeaconDevice = require('../../lib/beacon-device.js');

class GenericBeaconDevice extends BeaconDevice {

    /** @inheritdoc */
    matchAdvertisement(advertisement) {
        const devData = this.getData();
        if (advertisement.uuid == devData.uuid) {
            return true;
        }
        return false;
    }    
    
}

module.exports = GenericBeaconDevice;
