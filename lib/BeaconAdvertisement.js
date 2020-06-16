// The instances of this class represente a a specialized type of
// advertisement: the beacon advertisements. The class allows to construct
// new instances from a standard Homey BLE advertisement.  

const Homey = require('homey');

const btaUnknown = 0;    // Unknown
const btaPeripheral = 1; // Generic BLE periperal
const btaIBeacon = 2;    // iBeacon
const btaEddystone = 3;  // Eddystone UID


Number.prototype.pad2 = function () {
    var s = this.toString(16);
    if (s.length < 2)
        s = "0" + s;
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
                        proximityUUID: {
                            0: UUIDArr[0],
                            1: UUIDArr[1],
                            2: UUIDArr[2],
                            3: UUIDArr[3],
                            4: UUIDArr[4],
                            5: UUIDArr[5],
                            6: UUIDArr[6],
                            7: UUIDArr[7],
                            8: UUIDArr[8],
                            9: UUIDArr[9],
                            10: UUIDArr[10],
                            11: UUIDArr[11],
                            12: UUIDArr[12],
                            13: UUIDArr[13],
                            14: UUIDArr[14],
                            15: UUIDArr[15]
                        },
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
                            NS: {
                                0: NSArr[0],
                                1: NSArr[1],
                                2: NSArr[2],
                                3: NSArr[3],
                                4: NSArr[4],
                                5: NSArr[5],
                                6: NSArr[6],
                                7: NSArr[7],
                                8: NSArr[8],
                                9: NSArr[9]
                            },
                            instance: {
                                0: instanceArr[0],
                                1: instanceArr[1],
                                2: instanceArr[2],
                                3: instanceArr[3],
                                4: instanceArr[4],
                                5: instanceArr[5]
                            }
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


    iBeaconProximityUUIDToString() {
        let u = this.key.iBeacon.proximityUUID;
        return u[0].pad2() + u[1].pad2() + u[2].pad2() + u[3].pad2() + '-' + u[4].pad2() +
            u[5].pad2() + '-' + u[6].pad2() + u[7].pad2() + '-' + u[8].pad2() +
            u[9].pad2() + '-' + u[10].pad2() + u[11].pad2() + u[12].pad2() + u[13].pad2() +
            u[14].pad2() + u[15].pad2();
    }


    eddystoneNSToString() {
        let u = this.key.eddystone.NS;
        return u[0].pad2() + u[1].pad2() + u[2].pad2() + u[3].pad2() + u[4].pad2() +
            u[5].pad2() + u[6].pad2() + u[7].pad2() + u[8].pad2() + u[9].pad2();
    }


    eddystoneInstanceToString() {
        let u = this.key.eddystone.instance;
        return u[0].pad2() + u[1].pad2() + u[2].pad2() + u[3].pad2() + u[4].pad2() +
            u[5].pad2();
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
                if (this.name !== undefined) {
                    nameStr = this.name + '-ib';
                }
                else {
                    nameStr = this.iBeaconProximityUUIDToString() + ' ' +
                        this.key.iBeacon.major.toString() + ' ' +
                        this.key.iBeacon.minor.toString();
                }
                iconFilename = "ibeacon.svg";
                typeNameStr = 'iBeacon';
                iBeaconProximityUUIDStr = this.iBeaconProximityUUIDToString();
                iBeaconMajorStr = this.key.iBeacon.major.toString();
                iBeaconMinorStr = this.key.iBeacon.minor.toString();
                eddystoneNSStr = '-';
                eddystoneInstanceStr = '-';
                capabilityArr = ["detect", "signal_strength", "homey_distance"];
                break;
            case btaEddystone:
                if (this.name !== undefined) {
                    nameStr = this.name + '-eu';
                }
                else {
                    nameStr = this.eddystoneNSToString() + ' ' +
                        this.eddystoneInstanceToString();
                }
                iconFilename = "eddystone.svg";
                typeNameStr = 'Eddystone';
                iBeaconProximityUUIDStr = '-';
                iBeaconMajorStr = '-';
                iBeaconMinorStr = '-';
                eddystoneNSStr = this.eddystoneNSToString();
                eddystoneInstanceStr = this.eddystoneInstanceToString();
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
                advertisedName: this.advertisedNameToString(),
                calibratedPower: this.calibratedPowerToString(),
                typeName: typeNameStr,
                iBeaconProximityUUID: iBeaconProximityUUIDStr,
                iBeaconMajor: iBeaconMajorStr,
                iBeaconMinor: iBeaconMinorStr,
                eddystoneNS: eddystoneNSStr,
                eddystoneInstance: eddystoneInstanceStr
            },
            store: {
                advertisedName_: this.name,
                calibratedPower_: this.calibratedPower
            },
            icon: iconFilename, // relative to: /drivers/<driver_id>/assets/
            capabilities: capabilityArr
        };
    }
}

module.exports = BeaconAdvertisement;
