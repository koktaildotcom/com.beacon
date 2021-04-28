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

class IBeaconDevice extends BeaconDevice {

    /** @inheritdoc */
    matchAdvertisement(advertisement) {
        const devData = this.getData();
        if (advertisement.manufacturerData !== undefined) {
            const md = advertisement.manufacturerData;
            if (md.length == 25) {
                if (md[0] == 76 && md[1] == 0 && md[2] == 2 && md[3] == 21) {
                    const uuidArr = new Uint8Array(md.slice(4, 20));
                    const uuid = uuidArr.toHexString();
                    const major = md[20] * 256 + md[21];
                    const minor = md[22] * 256 + md[23];
                    return uuid == devData.uuid && major == devData.major && minor == devData.minor;
                }
            }
        }
        return false;
    }    

    /** @inheritdoc */
    parseAdvertisement(advertisement) {
        let beaconAdv = super.parseAdvertisement(advertisement);
        if (advertisement.manufacturerData !== undefined) {
            const md = advertisement.manufacturerData;
            if (md.length == 25) {
                // The calibrated power for iBeacon is the RSSI at 1 meter.
                const calibratedPowerAt1m = md[24] - 256;
                const ratio = advertisement.rssi / calibratedPowerAt1m;
                if (ratio < 1.0) {
                    beaconAdv.homeyDistance = Math.pow(ratio, 10);
                }
                else {
                    beaconAdv.homeyDistance = 0.19 * Math.pow(ratio, 8);
                }
            }
        }
        return beaconAdv;
    }

}

module.exports = IBeaconDevice;