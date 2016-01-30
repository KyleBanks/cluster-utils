/**
 * setTimeout.test.js
 *
 * Created by kylewbanks on 16-01-30.
 */
'use strict';

/**
 * @imports
 */
var path = require('path');

var chai = require('chai'),
    redis = require('redis');
chai.should();

var ClusterUtils = require(process.cwd());

/**
 * @private
 */
var FileName = 'lib/setTimeout';

describe(FileName, function() {

    function _getRandomTimeoutName() {
        return new Date().getTime().toString();
    }

    var setTimeoutClass = null,
        clusterUtils = new ClusterUtils(redis.createClient());

    it('requires without error', function(done) {
        setTimeoutClass = require(path.join(process.cwd(), FileName));
        done();
    });

    it('exports a function that returns the setTimeout implementation', function(done) {
        setTimeoutClass.should.be.a('function');
        var setTimeout = setTimeoutClass(clusterUtils);
        setTimeout.should.be.a('function');

        done();
    });

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

        timeout._lockKey.should.be.a('string');
        timeout._lockKey.indexOf(functionName).should.be.at.least(0);
    });

    it('return value contains the `setTimeout` ID', function(done) {
        var timeout = clusterUtils.setTimeout(_getRandomTimeoutName(), done, 10);

        timeout._timeoutId.should.be.a('object');
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