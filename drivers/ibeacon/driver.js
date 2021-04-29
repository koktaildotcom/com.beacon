"use strict";

const BeaconDriver = require('../../lib/beacon-driver.js');

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

class IBeaconDriver extends BeaconDriver {

    /** @inheritdoc */
    supports(advertisement) {
        if (advertisement.manufacturerData !== undefined) {
            // Field manufacturerData expected in iBeacon.
            const md = advertisement.manufacturerData;
            // manufacturerData length must be 25.
            if (md.length == 25) {
                // The first 4 bytes identify an iBeacon.
                if (md[0] == 76 && md[1] == 0 && md[2] == 2 && md[3] == 21) {
                    return true;
                }
            }
        }
        return false;
    }

    /** @inheritdoc */
    extractMetadata(advertisement) {
        let metadata = super.extractMetadata(advertisement);
        if (advertisement.manufacturerData !== undefined) {
            // Field manufacturerData expected in iBeacon.
            const md = advertisement.manufacturerData;
            if (md.length == 25 && md[0] == 76 && md[1] == 0 && md[2] == 2 && md[3] == 21) {
                const uuidArr = new Uint8Array(md.slice(4, 20));
                metadata.capabilities.push('homey_distance');
                metadata['data'] = {
                    uuid: uuidArr.toHexString(),
                    major: md[20] * 256 + md[21],
                    minor: md[22] * 256 + md[23]
                }
                metadata.settings['uuid'] = metadata.data.uuid.slice(0, 8) + '-' +
                    metadata.data.uuid.slice(8, 12) + '-' + metadata.data.uuid.slice(12, 16) +
                    '-' + metadata.data.uuid.slice(16, 20) + '-' + metadata.data.uuid.slice(20);
                metadata.settings['major'] = String(metadata.data.major);
                metadata.settings['minor'] = String(metadata.data.minor);
                // Complete the name with the iBeacon identifier.
                metadata.name = metadata.name + ' ' + metadata.settings.uuid + ' ' +
                    metadata.settings.major + ' ' + metadata.settings.minor;
            }
        }
        return metadata;
    }

}

module.exports = IBeaconDriver;
