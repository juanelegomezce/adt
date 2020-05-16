import { APIEvent } from 'homebridge';
import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ADTPlatformAccessory, ADTSecuritySystem } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ADTHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service = this.api.hap.Service;
  public readonly Characteristic = this.api.hap.Characteristic;
  private const deviceMapping = {
    "2e24162e-a854-41f8-9c2b-60c9913a2bfd": ADTPlatformAccessory,
    "a95cda96-221b-4be5-aed7-6202fdde7f50": ADTSecuritySystem,
    "a89b9fe8-2896-4abf-9c23-df8d3b4f6f89": ADTPlatformAccessory,
  }

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.loadDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  loadDevices() {

    // generate a unique id for the accessory this should be generated from
    // something globally unique, but constant, for example, the device serial
    // number or MAC address
    const uuid = this.api.hap.uuid.generate(this.config.deviceId);

    // check that the device has not already been registered by checking the
    // cached devices we stored in the `configureAccessory` method above
    if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
      this.log.info('Registering new accessory:', this.config.deviceName);

      // create a new accessory
      const accessory = new this.api.platformAccessory(this.config.deviceName, uuid);

      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.device = this.config;

      // create the accessory handler
      // this is imported from `platformAccessory.ts`
      new ADTPlatformAccessory(this, accessory);
      const prueba = new this.deviceMapping["2e24162e-a854-41f8-9c2b-60c9913a2bfd"](this, accessory);

      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

      // push into accessory cache
      this.accessories.push(accessory);

      // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
      // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
}
