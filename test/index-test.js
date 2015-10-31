'use strict';

var assert = require('chai').assert;
var icebox = require('../');

describe('Public API', function() {
  it('loads', function() {
    assert.ok(icebox);
    assert.equal(icebox.foo(), 'foot');
  });
});
