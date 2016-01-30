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