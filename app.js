'use strict';

const Homey = require('homey');

class Beacon extends Homey.App {
    async onInit() {

        console.log(await this.getAmountOfBleAdvertisements())

        setTimeout(async () => {
            console.log(await this.getAmountOfBleAdvertisements())
        },10000)

        setTimeout(async () => {
            console.log(await this.getAmountOfBleAdvertisements())
        },20000)

        setTimeout(async () => {
            console.log(await this.getAmountOfBleAdvertisements())
        },30000)

        setTimeout(async () => {
            console.log(await this.getAmountOfBleAdvertisements())
        },40000)

        setTimeout(async () => {
            console.log(await this.getAmountOfBleAdvertisements())
        },50000)
    }

    async getAmountOfBleAdvertisements() {
        return `The amount of found advertisements is: ${(await this.homey.ble.discover([])).length}`
    }
}

module.exports = Beacon;
