'use strict';

const Homey = require('homey');

class BeaconDevice extends Homey.Device {

    setDetect() {
        this.setCapabilityValue("detect", true);
    }

    setUndetect() {
        this.setCapabilityValue("detect", false);
    }
}

module.exports = BeaconDevice;