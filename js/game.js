(function(root, factory) {
    "use strict";

    // Set up game appropriately for the environment. Start with AMD.
    // 
    if (typeof define === 'function' && define.amd) {
        define(['underscore', 'jquery', 'exports'], function(_, $, exports) {

            root.SlotMachine = factory(root, exports, _, $);

        });

    } else if (typeof exports !== 'undefined') {
        var _ = require('underscore');
        factory(root, exports, _);

    } else {
        root.SlotMachine = factory(root, {}, root._, root.jQuery);
    }

    $.whenall = function(arr) {
        return $.when.apply($, arr).pipe(function() {
            return Array.prototype.slice.call(arguments);
        });
    };

}(this, function(root, SlotMachine, _, $) {
    "use strict";

    var transitionEnd = ["webkitTransitionEnd", "transitionend",
        "oTransitionEnd", "transitionend", "otransitionend"
    ].join(" ");

    /**
     * Reel or wheel is part of the slot machine;
     * Reel takes the container el and returns reel
     * operation methods like spin.
     */

    var Reel = SlotMachine.Reel = function(el) {
        this.$el = el;
    };

    Reel.prototype = {
        constructor: SlotMachine.Reel,
        spin: function(time, degree, index) {
            /**
             * Spins the reel with time and degree;
             * It returns the promise with index.
             */

            var dfd = new jQuery.Deferred();

            this.$el.css({
                "transform": "rotateX(-" + degree + "deg)",
                "transition": time + "ms"
            }).on(transitionEnd, function() {
                return dfd.resolve(index);
            });

            return dfd.promise();
        }
    };

    // Reels iterates over all options.reels and
    // creates instance of Reel class

    var Reels = SlotMachine.Reels = (function(options) {
        var reels = options.reels;

        var reel;
        var reelInstances = reels.map(function(reel) {
            reel = new Reel(reel.el);
            return reel.spin.bind(reel);
        });

        var callSpinReel = function(fn) {
            // spin time
            var time = _.random(1000, options.spinTime);

            // random number based on the reellength;
            var indx = _.random(0, options.reelLength - 1);

            var degree = indx * (360 / options.reelLength) + (360 * _.random(50, 100));

            return fn(time, degree, (indx > 2) ? Math.abs(indx - (options.reelLength / options.repeatItems)) : indx);
        };

        var startSpinning = function() {
            return reelInstances.map(callSpinReel);
        };

        return {
            startSpinning: startSpinning
        };

    });


    // Items collection has helper methods over the items in the wheel;
    // once the reel stops we got to match if item in each reel are of same kind;
    // 

    var ItemCollection = SlotMachine.ItemCollection = (function(reels) {

        // with item indexs get items from each reel;

        var getSelectedItems = function(indxs) {
            return indxs.reduce(function(arr, indx, arrIndex) {
                return _(arr).push(reels[arrIndex].items[indx]);
            }, []);
        };

        var areItemsSameKind = function(indexs) {
            var selectedItems = getSelectedItems(indexs);

            // select the first element;
            var matchType = selectedItems[0].type;

            // check if there are other elements apart from the selected one;
            // if yes then no match; items are related with the 'TYPE' atttibute 

            return !_.find(selectedItems, function(item) {
                return item.type !== matchType;
            }) ? matchType : false;
        };

        return {
            areItemsSameKind: areItemsSameKind
        };
    });

    var Game = SlotMachine.Game = function(options) {
        var defaultOptions = {
            spinTime: 10000
        };

        this.options = $.extend(defaultOptions, options);

        if (!this.options.reels) {
            throw new Error("Game items arugment missing");
        }

        this.reels = Reels(this.options);
        this.itemCollection = new ItemCollection(this.options.reels);
    };

    Game.prototype = {
        constructor: Game,
        play: function() {
            // returns promise; it spins the items, computes the result 
            // and returns the result;
            var that = this;

            return $.whenall(this.reels.startSpinning()).then(function(result) {
                return that.itemCollection.areItemsSameKind(result);
            });
        },
        render: function() {
            var that = this;

            this.options.reels.map(function(reel) {
                // repeat items: if the number of items are less it hard 
                // to form a wheel. Example with 3 items it will look like triangle

                reel.items = _.flatten(_.times(that.options.repeatItems, function() {
                    return reel.items;
                }));

                return reel;
            });

            var inject = function(reel) {
                reel.el.html(reel.items.map(that.options.template));
            };

            this.options.reels.map(inject);

            return new Game(this.options);
        }
    };

    return SlotMachine;
}));


$(function() {
    "use strict";

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

    var game = new SlotMachine.Game(options).render();
    var $result = $("#result");

    $("#play").bind("click", function() {
        // reset the result;
        $result.html("");

        game.play().then(function(result) {
            if (!result) {
                return $result.html("Sorry, you did not win anything today. Better luck next time");
            }

            $result.html("Hurry! you won " + result + ". Enjoy!");

        }).fail(function(e) {
            console.log(e);
        });
    });
});