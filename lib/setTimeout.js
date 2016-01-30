/**
 * setTimeout.js
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
var standardSetTimeout = setTimeout;

/**
 * Internal implementation of the cluster-aware `setTimeout` function.
 *
 * @param clusterUtils {ClusterUtils}
 * @param name {String}
 * @param func {Function}
 * @param delay {Number}
 * @returns {Object}
 */
function _setTimeout(clusterUtils, name, func, delay) {
    var timeout = {

        _lockKey: util.format('ClusterUtils:setTimeout:Lock:%s', name),

        _timeoutId: standardSetTimeout(function() {
            clusterUtils._setLock(timeout._lockKey, function(err, lock) {
                if (err) {
                    throw err;
                } else if (!lock) {
                    return;
                }

                process.nextTick(func);
            });
        }, delay)
    };
    return timeout;
}

/**
 * @public
 */

/**
 * Returns an initialized `setTimeout` function that is cluster-aware.
 *
 * @param clusterUtils {ClusterUtils}
 * @returns {function(String, Function, Number)}
 */
module.exports = function(clusterUtils) {
    return _setTimeout.bind(_setTimeout, clusterUtils);
};