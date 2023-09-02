/**
 * This file holds relevant information about the resources used by this application
 */

import {iCPSAppOptions} from "../../app/factory.js";

/**
 * File encoding for all text based files written by this application
 */
export const FILE_ENCODING = `utf8`;

/**
 * Filename of the resource file
 */
export const RESOURCE_FILE_NAME = `.icloud-photos-sync`;

/**
 * The name of the log file
 */
export const LOG_FILE_NAME = `.icloud-photos-sync.log`;

/**
 * The name of the metrics file
 */
export const METRICS_FILE_NAME = `.icloud-photos-sync.metrics`;

/**
 * The name of the HAR file generated by the network capture
 */
export const HAR_FILE_NAME = `.icloud-photos-sync.har`;

/**
 * Resources held by the resource manager
 */
export type iCPSResources = ResourceFile
    & iCPSAppOptions
    & PhotosAccount
    & NetworkResources;

/**
 * Persistent information, stored in a resource file
 */
export type ResourceFile = {
    /**
     * The library version of the currently present library
     * @minimum 1
     * @default 1
     */
    libraryVersion: number,
    /**
     * The currently used trust token
     */
    trustToken?: string
}

/**
 * Non persistent network resources, required to access the iCloud API
 */
type NetworkResources = {
    /**
     * Session secret, either acquired on successful sign in, or after trusting the device
     */
    sessionSecret?: string,
}

/**
 * Information to interact with the iCloud Photos backend
 */
type PhotosAccount = {
    /**
     * The primary photos library zone
     */
    primaryZone?: PhotosAccountZone,
    /**
     * The shared photos library zone
     */
    sharedZone?: PhotosAccountZone
}

/**
 * Information about photos library zones
 */
export type PhotosAccountZone = {
    /**
     * The zone name, either PrimarySync or SharedSync-<UUID>
     */
    zoneName: string,
    /**
     * The zone type, usually REGULAR_CUSTOM_ZONE
     */
    zoneType: string,
    /**
     * The owner name, usually _<UUID>
     */
    ownerRecordName: string,
}