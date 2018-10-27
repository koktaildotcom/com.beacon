# Beacon

## Introduction
This app integrate the basic flows for BLE beacons into Homey.
Once the app is installed it will do a discovery of BLE devices, after a short adjustable timeout it wil keep discovering.
After each discovery the app compares the found devices with the one paired.
If the beacon is not found within the new "discovered list" the beaon is changed in state. 

For filtering out false positives there is a verification amount inside or outside the range available in the settings.
This setting is the amount of times the beacon needs to be changed before it wil marked as such. The amount will be reset if the beacon is not in that current state.

Do you like the app? You can make me happy by buying me a beer! [![](https://img.shields.io/badge/paypal-donate-green.svg)](https://www.paypal.me/koktaildotcom)

## Supported devices:
* Generic beacon

## Usage
1. Install app
2. Add device(s) to Homey.
4. Make a flow with one of the cards.

## Cards
### Device cards
#### Trigger cards
1. The beacon is detected
   * beacon name
2. The beacon is undetected
   * beacon name

### Global cards
#### Trigger cards
1. The beacon is detected
   * beacon name
2. The beacon is undetected
   * beacon name
3. The beacon discovered
   * beacon name
   
## History
### v1.0.0 - 04.10.18
  * first alpha to app store.
### v1.0.1 - 05.10.18
  * add support for NRF51822  
  * add app icon
  * refactoring the drivers
### v1.0.2 - 07.10.18
  * add trigger card for discovered devices
  * add icon for discovery
### v1.0.3 - 07.10.18
  * add generic device
### v1.0.4 - 20.10.18  
  * add verify process for detect/undetect events
### v1.0.5 - 07.10.24
  * improve discovery of the devices
  * change card description
### v1.0.6 - 07.10.24
  * improve by connection and find the advertisement
### v1.0.7 - 07.10.24
  * bump version
### v1.0.8 - 07.10.25
  * improve sequence update beacons
  * get peripheral for accurate range
  * change timeout to 1 second
  * improve logging to the app
  * add retry strategy
### v1.0.9 - 07.10.25
  * bump version
### v1.0.10 - 07.10.27
  * introducing timeout and verification settings
  * revert back to discovery strategy to improve speed
  * add translations
  * improve logging
  
## Final note ##
The repository is available at: https://github.com/koktaildotcom/com.koktail.beacon