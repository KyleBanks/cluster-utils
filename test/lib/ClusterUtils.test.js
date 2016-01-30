/**
 * ClusterUtils.test.js
 *
 * Created by kylewbanks on 16-01-30.
 */
'use strict';

/**
 * @imports
 */
var path = require('path');

var chai = require('chai'),
    redis = require('redis'),
    async = require('async');

chai.should();
var expect = chai.expect;

/**
 * @private
 */
var FileName = 'lib/ClusterUtils';

describe(FileName, function() {

    var ClusterUtils = null,
        redisClient = redis.createClient(),
        clusterUtils = null;

    /**
     * Initialization
     */
    it('requires without error', function(done) {
        ClusterUtils = require(path.join(process.cwd(), FileName));
        done();
    });

    it('exports the ClusterUtils class', function(done) {
        ClusterUtils.should.be.a('function');
        ClusterUtils.toString().indexOf('ClusterUtils').should.equal('function '.length);
        done();
    });

    it('constructs successfully with a redis client', function(done) {
        clusterUtils = new ClusterUtils(redisClient);
        clusterUtils.should.be.a('object');
        done();
    });

    it('references the redis client it was constructed with', function(done) {
        clusterUtils._redisStore.should.equal(redisClient);
        done();
    });

    it('initializes a `setTimeout` function', function(done) {
        clusterUtils.setTimeout.should.be.a('function');
        done();
    });

    /**
     * Private Functions
     */

    var lockKey = "LK:" + new Date().getTime();
    describe('_setLock', function() {
        it('returns true on an unlocked key', function(done) {
            clusterUtils._setLock(lockKey, function(err, locked) {
                if (err) {
                    return done(err);
                }

                locked.should.equal(true);
                done();
            });
        });

        it('returns false on a locked key', function(done) {
            clusterUtils._setLock(lockKey, function(err, locked) {
                if (err) {
                    return done(err);
                }

                locked.should.equal(false);
                done();
            });
        });

        it('expires a key automatically by default', function(done) {
            var autoExpireKey = "LK:AutoExpire:" + new Date().getTime();

            clusterUtils._setLock(autoExpireKey, function(err) {
                if (err) {
                    return done(err);
                }

                // _setLock doesn't wait for the expire time to be set,
                // so we must take that into account here
                process.nextTick(function() {
                    redisClient.ttl(autoExpireKey, function(err, res) {
                        if (err) {
                            return done(err);
                        }
                        res = parseInt(res);

                        res.should.be.at.least(0);
                        done();
                    });
                });
            });
        });
    });

    describe('_clearLock', function() {
        it('deletes a locked key', function(done) {
            clusterUtils._clearLock(lockKey, function(err) {
                if (err) {
                    return done(err);
                }

                redisClient.get(lockKey, function(err, res) {
                    if (err) {
                        return done(err);
                    }

                    expect(res).to.equal(null);
                    done();
                });
            });
        });

        it('doesn\'t throw on an unknown key', function(done) {
            clusterUtils._clearLock("UnknownLockKey", done);
        });
    });

    /**
     * Public Functions
     */

    describe('setTimeout', function() {
        function _getRandomTimeoutName() {
            return new Date().getTime().toString();
        }

        it('executes a simple function after a specified delay', function(done) {
            clusterUtils.setTimeout(_getRandomTimeoutName(), done, 10);
        });

        it('returns an object representing the timeout', function(done) {
            var timeout = clusterUtils.setTimeout(_getRandomTimeoutName(), done, 10);

            timeout.should.be.a('object');
        });

        it('return value contains the lock key', function(done) {
            var functionName = _getRandomTimeoutName();
            var timeout = clusterUtils.setTimeout(functionName, done, 10);

            timeout.lockKey.should.be.a('string');
            timeout.lockKey.indexOf(functionName).should.be.at.least(0);
        });

        it('return value contains the `setTimeout` ID', function(done) {
            var timeout = clusterUtils.setTimeout(_getRandomTimeoutName(), done, 10);

            timeout.timeoutId.should.be.a('object');
        });

        it('executes only one function with the given timeout name', function(done) {
            var timeoutName = _getRandomTimeoutName(),
                callCount = 0;

            // Ten functions with the same name, only one should be called
            for (var i = 0; i < 10; i++) {
                clusterUtils.setTimeout(timeoutName, function() {
                    callCount ++;
                }, 1);
            }

            setTimeout(function() {
                callCount.should.equal(1);
                done();
            }, 15);
        });

        it('executes all functions when they have different names', function(done) {
            var numFunctions = 10,
                callCount = 0,
                baseFunctionName = _getRandomTimeoutName();

            for (var i = 0; i < numFunctions; i++) {
                clusterUtils.setTimeout(baseFunctionName + i, function() {
                    callCount ++;
                }, 1);
            }

            setTimeout(function() {
                callCount.should.equal(numFunctions);
                done();
            }, 15);
        });

    });

    /**
     * Configuration
     */

    describe('config', function() {
        it('contains functions allowing configuration of the cluster utils', function(done) {
            clusterUtils.config.should.be.a('object');
            done();
        });

        describe('setDefaultLockTimeout', function() {
            it('allows a custom lock timeout to be set', function(done) {
                var defaultLockTimeout = clusterUtils.config._lockTimeout;
                defaultLockTimeout.should.be.a('number');

                var newLockTimeout = defaultLockTimeout * 10;
                clusterUtils.config.setDefaultLockTimeout(newLockTimeout);
                clusterUtils.config._lockTimeout.should.equal(newLockTimeout);


                var randomKey = "Random:" + new Date().getTime();
                clusterUtils._setLock(randomKey, function(err) {
                    if (err) {
                        return done(err);
                    }

                    process.nextTick(function() {
                        redisClient.ttl(randomKey, function(err, res) {
                            if (err) {
                                return done(err);
                            }
                            res = parseInt(res);

                            res.should.be.within(defaultLockTimeout, newLockTimeout);

                            clusterUtils.config.setDefaultLockTimeout(defaultLockTimeout);
                            done();
                        });
                    });
                });
            });
        });
    });
});