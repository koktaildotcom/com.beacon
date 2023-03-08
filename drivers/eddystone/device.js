'use strict';

const BeaconDevice = require('../../lib/beacon-device.js');

/**
 * Byte array to hex string conversion.
 * @returns {string}
 */
 Uint8Array.prototype.toHexString = function () {
    let s = '';
    for (let i = 0; i < this.length; i++) {
        let c = this[i].toString(16);
        if (c.length < 2)
            c = '0' + c;
        s = s + c;
    }
    return s;
}

class EddystoneUIDDevice extends BeaconDevice {

    /**
     * @inheritdoc
     */
    matchAdvertisement(advertisement) {
        const devData = this.getData();
        if (advertisement.serviceData !== undefined) {
            for (const serviceDatum of advertisement.serviceData) {
                if (serviceDatum.uuid === 'feaa') {
                    if (serviceDatum.data[0] === 0x00) {
                        const namespaceArr = new Uint8Array(serviceDatum.data.slice(2, 12));
                        const instanceArr = new Uint8Array(serviceDatum.data.slice(12, 18));
                        const namespace = namespaceArr.toHexString();
                        const instance = instanceArr.toHexString();
                        return namespace === devData.namespace && instance === devData.instance;
                    }
                }
            }
        }
        return false;
    }

    /**
     * @inheritdoc
     */
    parseAdvertisement(advertisement) {
        let beaconAdv = super.parseAdvertisement(advertisement);

        if (advertisement.serviceData !== undefined) {
            for (let serviceDatum of advertisement.serviceData) {
                if (serviceDatum.uuid === 'feaa') {
                    const calibratedPowerAt0m = serviceDatum.data[1] - 256;
                // The calibrated power for Eddystone is the RSSI at 0 meter.
                const ratio = advertisement.rssi / calibratedPowerAt0m;
                    if (ratio < 1) {
                        beaconAdv.homeyDistance = Math.pow(ratio, 10);
                    }
                    else {
                        beaconAdv.homeyDistance = 0.9 * Math.pow(ratio, 7.7) + 0.111;
                    }
                    break;
                }
            }
        }
        return beaconAdv;
    }

}

module.exports = EddystoneUIDDevice;
