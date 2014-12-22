expect = (chai && chai.expect) || require('chai').expect;

// test data;
var options = {
    spinTime: 1000, // spinning time in ms;
    template: _.template("<div class='part'><%= name %></div>"),
    repeatItems: 2,
    reelLength: 6,
    reels: [{
        el: $("#reel-1"),
        items: [{
            "name": "coffee maker",
            "type": "coffee"
        }, {
            "name": "teapot",
            "type": "tea"
        }, {
            "name": "espresso",
            "type": "espresso"
        }]
    }, {
        el: $("#reel-2"),
        items: [{
            "name": "coffee filter",
            "type": "coffee"
        }, {
            "name": "tea strainer",
            "type": "tea"
        }, {
            "name": "espresso tamper",
            "type": "espresso"
        }]
    }, {
        el: $("#reel-3"),
        items: [{
            "name": "coffee grounds",
            "type": "coffee"
        }, {
            "name": "loose tea",
            "type": "tea"
        }, {
            "name": "ground espresso beans",
            "type": "tea"
        }]
    }]
};

describe('Reel', function() {
    it('should apply css when called spin', function(done) {
        var el = $("#reel-1");

        var reel = new SlotMachine.Reel(el);
        reel.spin(500, 260, 5);

        expect(el[0].style.transition).to.equal("500ms");
        expect(el[0].style.transform).to.equal("rotateX(-260deg)");
        done();
    });

    it("spin should return promise", function(done) {
        var el = $("#reel-1");

        var reel = new SlotMachine.Reel(el);
        var spin = reel.spin(500, 260, 5);

        expect(_.has(spin, "then")).to.be.true;

        done();

    });

    it("spin promise.then should return index", function(done) {
        var el = $("#reel-1");

        var reel = new SlotMachine.Reel(el);
        var spin = reel.spin(500, 260, 5);

        spin.then(function(index) {
            expect(index).to.equal(5);
            done();
        });

    });
});


describe("ItemCollection", function() {
    it("check sample index [1,1,1] is of same kind -- true case", function(done) {
        var itemCollection = SlotMachine.ItemCollection(options.reels);
        isSameKind = itemCollection.areItemsSameKind([1, 1, 1]);
        expect(_.isString(isSameKind)).to.be.true;
        expect(isSameKind).to.equal("tea");
        done();
    });

    it("check sample index [1,0,1] is not of same kind -- false case", function(done) {
        var itemCollection = SlotMachine.ItemCollection(options.reels);
        isSameKind = itemCollection.areItemsSameKind([1, 0, 1]);
        expect(isSameKind).to.be.false;
        done();
    });
});


describe("Reels", function() {
    it("expeted to instantiate Reel", function(done) {
        var startSpinning = SlotMachine.Reels(options).startSpinning();
        var els = [$("#reel-1"), $("#reel-2"), $("#reel-3")];

        els.forEach(function(el) {
            expect(el[0].style.transition).to.match(/\d+ms/);
        });
        done();
    });
    it("startSpinning to return array of promise", function(done) {
        var startSpinning = SlotMachine.Reels(options).startSpinning();
        expect(startSpinning).to.be.an.Array;

        startSpinning.forEach(function(reel) {
            expect(_.has(reel, "then")).to.be.true;
        });
        done();
    });
});

describe("Game", function() {
    it("render to inject markup into dom", function(done) {
        var game = new SlotMachine.Game(options);
        game.render();
        expect($("#reel-1").children().length).to.equal(6);
        done();
    });

    it("play should return the result", function(done) {
        var game = new SlotMachine.Game(options);
        game.render().play().then(function(result) {
            // both lost and won case;
            var resultType = _.isBoolean(result) || _.isString(result);
            expect(resultType).to.be.true;
            done();
        }).fail(function(e) {
            done(e);
        });
    });
});