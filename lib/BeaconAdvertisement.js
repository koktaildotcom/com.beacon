// The instances of this class represente a a specialized type of
// advertisement: the beacon advertisements. The class allows to construct
// new instances from a standard Homey BLE advertisement.  

const Homey = require('homey');

const btaUnknown = 0;    // Unknown
const btaPeripheral = 1; // Generic BLE periperal
const btaIBeacon = 2;    // iBeacon
const btaEddystone = 3;  // Eddystone UID


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


class BeaconAdvertisement {

    constructor(advertisement) {
        this.name = advertisement.localName;
        this.rssi = advertisement.rssi;
        this.address = advertisement.address;
        if (advertisement.manufacturerData !== undefined) {
            // Field manufacturerData expected in iBeacon
            let md = advertisement.manufacturerData;
            if (md.length == 25 && md[0] == 76 && md[1] == 0 && md[2] == 2 && md[3] == 21) {
                let UUIDArr = new Uint8Array(md.slice(4, 20));
                this.key = {
                    typeId: btaIBeacon,
                    iBeacon: {
                        proximityUUID: UUIDArr.toHexString(),
                        major: md[20] * 256 + md[21],
                        minor: md[22] * 256 + md[23]
                    }
                }
                this.calibratedPower = md[24] - 256;
                return;
            }
        }
        if (advertisement.serviceData !== undefined) {
            for (let i = 0; i < advertisement.serviceData.length; i++) {
                let serviceDatum = advertisement.serviceData[i];
                if (serviceDatum.uuid == 'feaa' && serviceDatum.data[0] == 0) {
                    let NSArr = new Uint8Array(serviceDatum.data.slice(2, 12));
                    let instanceArr = new Uint8Array(serviceDatum.data.slice(12, 18));
                    this.key = {
                        typeId: btaEddystone,
                        eddystone: {
                            NS: NSArr.toHexString(),
                            instance: instanceArr.toHexString()
                        }
                    }
                    this.calibratedPower = serviceDatum.data[1] - 256;
                    return;
                }
            };
        }
        if (advertisement.localName !== undefined) {
            this.key = {
                typeId: btaPeripheral,
                peripheral: {
                    id: advertisement.id,
                    uuid: advertisement.uuid,
                    address: advertisement.uuid,
                    name: advertisement.localName,
                    type: advertisement.addressType,
                    version: "v" + Homey.manifest.version
                }
            }
            return;
        }
        this.key = {
            typeId: btaUnknown
        }
    }


    advertisedNameToString() {
        if (this.name !== undefined && this.name !== null) 
            return this.name;
        return '-';
    }

    calibratedPowerToString() {
        if (this.calibratedPower !== undefined && this.calibratedPower !== null)
            return this.calibratedPower.toString() + ' dBm';
        return '-';
    }


    deviceToBePaired() {
        let iconFilename;
        let nameStr, advertisedNameStr;
        let calibratedPowerStr;
        let typeNameStr;
        let iBeaconProximityUUIDStr, iBeaconMajorStr, iBeaconMinorStr;
        let eddystoneNSStr, eddystoneInstanceStr;
        let capabilityArr;
        switch (this.key.typeId) {
            case btaIBeacon:
                iconFilename = "ibeacon.svg";
                typeNameStr = 'iBeacon';
                iBeaconProximityUUIDStr = this.key.iBeacon.proximityUUID.slice(0, 8) + '-' +
                    this.key.iBeacon.proximityUUID.slice(8, 12) + '-' +
                    this.key.iBeacon.proximityUUID.slice(12, 16) + '-' +
                    this.key.iBeacon.proximityUUID.slice(16, 20) + '-' +
                    this.key.iBeacon.proximityUUID.slice(20);
                iBeaconMajorStr = this.key.iBeacon.major.toString();
                iBeaconMinorStr = this.key.iBeacon.minor.toString();
                eddystoneNSStr = '-';
                eddystoneInstanceStr = '-';
                if (this.name !== undefined) {
                    nameStr = this.name + '-ib';
                }
                else {
                    nameStr = iBeaconProximityUUIDStr + ' ' +
                        iBeaconMajorStr + ' ' + iBeaconMinorStr;
                }
                capabilityArr = ["detect", "signal_strength", "homey_distance"];
                break;
            case btaEddystone:
                iconFilename = "eddystone.svg";
                typeNameStr = 'Eddystone';
                iBeaconProximityUUIDStr = '-';
                iBeaconMajorStr = '-';
                iBeaconMinorStr = '-';
                eddystoneNSStr = this.key.eddystone.NS;
                eddystoneInstanceStr = this.key.eddystone.instance;
                if (this.name !== undefined) {
                    nameStr = this.name + '-eu';
                }
                else {
                    nameStr = eddystoneNSStr + ' ' + eddystoneInstanceStr;
                }
                capabilityArr = ["detect", "signal_strength", "homey_distance"];
                break;
            case btaPeripheral:
                nameStr = this.name;
                iconFilename = "icon.svg";
                typeNameStr = 'BLE Peripheral';
                iBeaconProximityUUIDStr = '-';
                iBeaconMajorStr = '-';
                iBeaconMinorStr = '-';
                eddystoneNSStr = '-';
                eddystoneInstanceStr = '-';
                capabilityArr = ["detect", "signal_strength"];
                break; 
        };
        return {
            name: nameStr,
            data: this.key,
            settings: {
                address: this.address,
                advertised_name: this.advertisedNameToString(),
                calibrated_power: this.calibratedPowerToString(),
                typeName: typeNameStr,
                iBeaconProximityUUID: iBeaconProximityUUIDStr,
                iBeaconMajor: iBeaconMajorStr,
                iBeaconMinor: iBeaconMinorStr,
                eddystoneNS: eddystoneNSStr,
                eddystoneInstance: eddystoneInstanceStr
            },
            store: {
                advertised_name_: this.name,
                calibrated_power_: this.calibratedPower
            },
            icon: iconFilename, // relative to: /drivers/<driver_id>/assets/
            capabilities: capabilityArr
        };
    }
}

module.exports = BeaconAdvertisement;
