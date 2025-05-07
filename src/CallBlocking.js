import {NativeModules} from 'react-native';

const {CallBlocking} = NativeModules;

export default {
  /**
   * Block a phone number
   * @param {string} phoneNumber - The phone number to block
   * @returns {Promise<boolean>} - Returns true if successful
   */
  blockNumber: phoneNumber => {
    return new Promise((resolve, reject) => {
      CallBlocking.blockNumber(phoneNumber, success => {
        if (success) {
          resolve(true);
        } else {
          reject(new Error('Failed to block number'));
        }
      });
    });
  },

  /**
   * Unblock a phone number
   * @param {string} phoneNumber - The phone number to unblock
   * @returns {Promise<boolean>} - Returns true if successful
   */
  unblockNumber: phoneNumber => {
    return new Promise((resolve, reject) => {
      CallBlocking.unblockNumber(phoneNumber, success => {
        if (success) {
          resolve(true);
        } else {
          reject(new Error('Failed to unblock number'));
        }
      });
    });
  },

  /**
   * Unblock multiple phone numbers
   * @param {string[]} phoneNumbers - Array of phone numbers to unblock
   * @returns {Promise<boolean>} - Returns true if successful
   */
  unblockNumbers: phoneNumbers => {
    return new Promise((resolve, reject) => {
      CallBlocking.unblockNumbers(phoneNumbers, success => {
        if (success) {
          resolve(true);
        } else {
          reject(new Error('Failed to unblock numbers'));
        }
      });
    });
  },

  /**
   * Remove all blocked numbers
   * @returns {Promise<boolean>} - Returns true if successful
   */
  removeAllBlockedNumbers: () => {
    return new Promise((resolve, reject) => {
      CallBlocking.removeAllBlockedNumbers(success => {
        if (success) {
          resolve(true);
        } else {
          reject(new Error('Failed to remove all blocked numbers'));
        }
      });
    });
  },

  /**
   * Get all currently blocked numbers
   * @returns {Promise<string[]>} - Returns array of blocked numbers
   */
  getBlockedNumbers: () => {
    return new Promise((resolve, reject) => {
      CallBlocking.getBlockedNumbers(numbers => {
        if (Array.isArray(numbers)) {
          resolve(numbers);
        } else {
          reject(new Error('Failed to get blocked numbers'));
        }
      });
    });
  },
};
