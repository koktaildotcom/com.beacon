"use strict";

const BeaconDriver = require('../../lib/beacon-driver.js');

class GenericBeaconDriver extends BeaconDriver {

    /**
     * @inheritdoc
     */
    supports(advertisement) {
        // As of Beacon app v1.2.10, file app.js, row 238.
        if (advertisement.localName === undefined) {
            return false;
        }

        // As stated in BT SIG specification v4.2, Volume 6 (Low Energy),
        // Part B (Link Layer), section 1.3 (Device Address) and Volume 3 (Host),
        // Part C (GAP) section 10.8 (Random Device Address), a random address
        // is not necessarily static. Thus it can vary from time to time and
        // it cannot be used for identifying a device.
        if (false === this.homey.settings.get('ignoreAddressType') && advertisement.addressType !== 'random') {
            return false;
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    extractMetadata(advertisement) {
        let metadata = super.extractMetadata(advertisement);
        metadata['data'] = {
            id: advertisement.id,
            uuid: advertisement.uuid,
            address: advertisement.uuid,
            name: (advertisement.localName ? advertisement.localName : 'Unknown device'),
            type: advertisement.addressType,
            version: "v" + this.homey.app.manifest.version
        }
        return metadata;
    }

}

module.exports = GenericBeaconDriver;
