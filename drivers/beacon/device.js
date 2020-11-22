'use strict';

const BeaconDevice = require('../../lib/beacon-device.js');

class GenericBeaconDevice extends BeaconDevice {
    getIdentificationSignature () {
        return this.key ? this.key : this.getData().uuid;
    }
}

module.exports = GenericBeaconDevice;
