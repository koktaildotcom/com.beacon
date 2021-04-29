# Beacon

## Introduction
This app integrate the basic flows for BLE beacons into Homey.
Once the app is installed it will do a discovery of BLE devices, after a short adjustable timeout it wil keep discovering.
After each discovery the app compares the found devices with the one paired.
If the beacon is not found within the new "discovered list" the beacon is changed in state. 

For filtering out false positives there is a verification amount inside or outside the range available in the settings.
This setting is the amount of times the beacon needs to be changed before it wil marked as such. The amount will be reset if the beacon is not in that current state.

Do you like the app? You can make me happy by buying me a beer! [![](https://img.shields.io/badge/paypal-donate-green.svg)](https://www.paypal.me/koktaildotcom)

## Supported devices:
* Generic BLE beacon (every BLE device that is public discoverable)

#### Tested devices
Here is a list of used devices

|Beacon name|Max range (through concrete)|
| --- | --- |
|*Tile Pro 2018*|*8m*|
|*Tile Mate 2018*|*8m*|
|*Nordic nRF51822*|*5m*|
|*Keeper*|*8m*|
|*iTag*|*5m*|
|*Nedis mini*|*3m*|
|*Lapa*|*?m*

> WARNING: The tile pro 2020 does not work because it is not publicly discoverable

## Usage
1. Install app
2. Make the device discoverable.
2. Add device(s) to Homey.
4. Make a flow with one of the cards.

## Settings
There are some settings to improve and tweak the apps behaviour.
> NOTE: Changing this settings can result into an unstable situation. 

#### Update settings
The delay between reading sensor values in seconds. (default 10 seconds)

#### Discovery timeout
The amount of seconds that is given to discover the beacons. (30 seconds)

#### VerificationAmountInside
The amount of verifications the app need to mark a beacon inside the range. (1 time)

#### VerificationAmountOutside
The amount of verifications the app need to mark a beacon outside the range. (5 times)

## Cards
An overview of all the trigger cards that can be used

| Type | Context | Name | Tokens |
| :---: | :---: | :---: | :---: |
| Trigger | Global | A beacon detected state is changed | (beacon name, detected) |
| Trigger | Global | A beacon is inside range | (beacon name) |
| Trigger | Global | A beacon is outside range | (beacon name) |
| Trigger | Global | A beacon has been discovered | (beacon name, uuid) |
| Trigger | Global | Update beacon presence | - |
| Trigger | Global | The beacon detected state is changed | (beacon name, detected) |
| Trigger | Global | The app generates a log | (log) |
| Condition | Global | The beacon is inside range | beacon name |
| Condition | Global | The beacon is outside range | beacon name |
| Action | Global | Update all the beacon presence |
   
## History
### v1.0.0 - 04.10.2018
  * first alpha to app store.
### v1.0.1 - 05.10.2018
  * add support for NRF51822  
  * add app icon
  * refactoring the drivers
### v1.0.2 - 07.10.2018
  * add trigger card for discovered devices
  * add icon for discovery
### v1.0.3 - 07.10.2018
  * add generic device
### v1.0.4 - 20.10.2018  
  * add verify process for detect/undetect events
### v1.0.5 - 24.10.2018
  * improve discovery of the devices
  * change card description
### v1.0.6 - 24.10.2018
  * improve by connection and find the advertisement
### v1.0.7 - 24.10.2018
  * bump version
### v1.0.8 - 24.10.2018
  * improve sequence update beacons
  * get peripheral for accurate range
  * change timeout to 1 second
  * improve logging to the app
  * add retry strategy
### v1.0.9 - 25.10.2018
  * bump version
### v1.0.10 - 27.10.2018
  * introducing timeout and verification settings
  * revert back to discovery strategy to improve speed
  * add translations
  * improve logging
### v1.0.11 - 27.10.2018
  * mismatch variable name bug
  * also check on bigger that the amount if app restarts
### v1.0.12 - 30.10.2018
  * add default values in settings
  * change comparator typo
### v1.0.13 - 07.11.2018
  * fixed change detect comparison mismatch
  * add log handler to watch false positives
  * fixed zero verification times 
### v1.0.14 - 11.11.2018
  * add homeyCommunityTopicId
  * add version number app for logging
  * add triggercards detect state changed
### v1.0.15 - 04.12.2018
  * resolved issue of not triggering the device `change` cards
### v1.0.16 - 06.12.2018
  * add BLE permission into manifest
### v1.0.17 - 10.12.2018
  * removed BLE permission into manifest due to incompatibility with < v2.0.0
### v1.2.0 - 12.12.2018
  * moved registering cards to the app due to make them work in 2.0
### v1.2.1 - 11.01.2019
  * update icon because of wrong viewport
### v1.2.2 - 01.03.2019
  * update icon capability
### v1.2.3 - 07.03.2019
  * update the discovery sequence for pairing
### v1.2.4 - 14.03.2019
  * introduce condition card for beacon in/not in zone
### v1.2.5 - 18.03.2019
  * bump version v1.2.4
### v1.2.6 - 27.03.2019
  * fixed typo in the condition card
### v1.2.7 - 28.04.2019
  * add warning if the beacon is outside range
  * change discovery timeout to 10 seconds
### v1.2.8 - 23.05.2019
  * removed warning because condition cards won't trigger again
### v1.2.9 - 23.05.2019
  * bump 1.2.8 due to app store bug
### v1.2.10 - 04.03.2020
  * make automatic detection optional
  * add flow card for update beacon presence
### v1.3.0 - 29.04.2021
  * add support for ibeacon and eddystone beacons
  * prevent memory leak in log
  * ignore non-static address by default
  * deprecate the log trigger
 
## Final note ##
The repository is available at: https://github.com/koktaildotcom/com.koktail.beacon
