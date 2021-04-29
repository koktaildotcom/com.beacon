'use strict';

const BeaconDevice = require('../../lib/beacon-device.js');

class GenericBeaconDevice extends BeaconDevice {

    /**
     * @inheritdoc
     */
    matchAdvertisement(advertisement) {
        const deviceData = this.getData();
        if (advertisement.uuid === deviceData.uuid) {
            return true;
        }
        return false;
    }
}

module.exports = GenericBeaconDevice;
