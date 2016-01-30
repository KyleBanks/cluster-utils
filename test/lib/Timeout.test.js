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

var chai = require('chai');
chai.should();

/**
 * @private
 */
var FileName = 'lib/Timeout';

describe(FileName, function() {

    var Timeout = null;

    it('requires without error', function(done) {
        Timeout = require(path.join(process.cwd(), FileName));
        done();
    });

    it('exports a constructor', function(done) {
        Timeout.should.be.a('function');
        done();
    });

});