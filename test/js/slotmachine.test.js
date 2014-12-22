expect = (chai && chai.expect) || require('chai').expect;

describe('sample', function() {
  it('display test start events', function(done) {
    setTimeout((function() {
      done();
    }), 1862);
    expect(true).to.be.true;
  });
});