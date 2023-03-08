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

class EddystoneDriver extends BeaconDriver {

    /** @inheritdoc */
    supports(advertisement) {
        if (advertisement.serviceData !== undefined) {
            for (const serviceDatum of advertisement.serviceData) {
                // 0xFEAA is the 16 bit UUID data type of the Eddystone Service
                // UUID.
                // Reference: https://github.com/google/eddystone/blob/master/protocol-specification.md
                if (serviceDatum.uuid === 'feaa') {
                    // The specific type of Eddystone frame is encoded in the
                    // high order four bits of the first octet in the Service
                    // Data associated with the Service UUID (the four low
                    // order bits have a fixed value of 0000). The value 0x00
                    // indicates the Eddystone UID frame; the value 0x30
                    // indicates the Eddystone EID frame.
                    if (serviceDatum.data[0] === 0x00) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /** @inheritdoc */
    extractMetadata(advertisement) {
        let metadata = super.extractMetadata(advertisement);
        if (advertisement.serviceData !== undefined) {
            for (const serviceDatum of advertisement.serviceData) {
                if (serviceDatum.uuid === 'feaa') {
                    if (serviceDatum.data[0] === 0x00) {
                        metadata.capabilities.push('homey_distance');
                        const namespaceArr = new Uint8Array(serviceDatum.data.slice(2, 12));
                        const instanceArr = new Uint8Array(serviceDatum.data.slice(12, 18));
                        metadata['data'] = {
                            namespace: namespaceArr.toHexString(),
                            instance: instanceArr.toHexString()
                        }
                        metadata.settings['namespace'] = String(metadata.data.namespace);
                        metadata.settings['instance'] = String(metadata.data.instance);
                        // Complete the name with the Eddystone identifier.
                        metadata.name = metadata.name + ' ' + metadata.settings.namespace +
                            ' ' + metadata.settings.instance;
                        break;
                    }
                }
            }
        }
        return metadata;
    }
}

module.exports = EddystoneDriver;
