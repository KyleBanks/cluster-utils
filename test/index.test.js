/**
 * index.test.js
 *
 * Created by kylewbanks on 16-01-30.
 */
'use strict';

/**
 * @imports
 */
var path = require('path');

var chai = require('chai');
chai.should();

/**
 * @private
 */
var FileName = 'index';

describe(FileName, function() {

    var index = null;

    it('requires without error', function(done) {
        index = require(path.join(process.cwd(), FileName));
        done();
    });

    it('exports the ClusterUtils class', function(done) {
        index.should.be.a('function');
        index.toString().indexOf('ClusterUtils').should.equal('function '.length);
        done();
    });

});

// Ensure this is the next test to run
require('./lib/ClusterUtils.test');