/**
 * ClusterUtils.js
 *
 * Created by kylewbanks on 16-01-30.
 */
'use strict';

/**
 * @private
 */

/**
 * The default time, in seconds, that a lock will last.
 * @type {Number}
 */
var DEFAULT_LOCK_TTL = 10;

/**
 * ClusterUtils Constructor
 *
 * @param redisStore {RedisClient}
 * @constructor
 */
function ClusterUtils(redisStore) {
    this._redisStore = redisStore;

    this.setTimeout = require('./setTimeout')(this);
}

/**
 * Attempts to create a lock, and returns a boolean indicating success.
 *
 * If true, the lock was set. If false, the lock could not be set, most likely
 * due to another instance having locked the key already.
 *
 * By default, the lock will expire after `DEFAULT_LOCK_TTL` seconds.
 *
 * @param key {String}
 * @param cb {function(Error, Boolean)}
 */
ClusterUtils.prototype._setLock = function(key, cb) {
    var self = this;

    self._redisStore.setnx(key, "LOCKED", function(err, res) {
        if (err) {
            return cb(err, null);
        }

        // Notify the callback of the lock status
        cb(null, parseInt(res) === 1);

        // Set the expire time on the key
        self._redisStore.expire(key, self.config._lockTimeout, function(err) {
            if (err) {
                console.error("Failed to set expire time on lock key '%s'!", key);
            }
        });
    });
};

/**
 * Removes a lock, if it exists.
 *
 * @param key {String}
 * @param cb {function(Error)}
 */
ClusterUtils.prototype._clearLock = function(key, cb) {
    this._redisStore.del(key, cb);
};

/**
 * Functions allowing configuration of the ClusterUtils instance.
 */
ClusterUtils.prototype.config = {

    /**
     * The timeout, in seconds, that locks will last.
     */
    _lockTimeout: DEFAULT_LOCK_TTL,

    /**
     * Overrides the default lock timeout of `DEFAULT_LOCK_TTL`.
     *
     * Note: This will only affect locks created after this point. Existing locks
     * will not be affected.
     *
     * @param timeout {Number}
     */
    setDefaultLockTimeout: function(timeout) {
        this._lockTimeout = timeout;
    }

};

/**
 * @public
 * @type {ClusterUtils}
 */
module.exports = ClusterUtils;
