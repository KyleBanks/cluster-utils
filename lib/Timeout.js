/**
 * Timeout.js
 *
 * Created by kylewbanks on 16-01-30.
 */
'use strict';

/**
 * @imports
 */
var util = require('util');

/**
 * @private
 */

/**
 * Timeout Constructor
 *
 * @param clusterUtils {ClusterUtils}
 * @param name {String}
 * @param func {Function}
 * @param delay {Number}
 * @constructor
 */
function Timeout(clusterUtils, name, func, delay) {
    this._clusterUtils = clusterUtils;
    this._func = func;

    this.lockKey = util.format('ClusterUtils:setTimeout:Lock:%s', name);
    this.timeoutId = setTimeout(_runIfLocked.bind(this), delay);
}

/**
 * Attempts to run the function provided if a lock can be achieved on the lock key.
 */
function _runIfLocked() {
    var self = this;

    self._clusterUtils._setLock(self.lockKey, function(err, lock) {
        if (err) {
            throw err;
        } else if (!lock) {
            return;
        }

        process.nextTick(self._func);
    });
}

/**
 * @public
 * @type {Timeout}
 */
module.exports = Timeout;