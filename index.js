'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Peforms: (de)serialization, observed properties and automatic rendering (in animationframe)

/* Attributes to properties */
// Assumes property names as fooBar and attribute names as foo-bar and maps them accordingly
// Inspired by: https://github.com/elix/elix/blob/master/mixins/AttributeMarshallingMixin.js

var deserialize = {
    bool: function bool(val) {
        if (val === true || val == 'true') return true;
        if (val === false || val == 'false') return false;
        return null;
    },
    string: function string(val) {
        return val + "";
    },
    func: function func(val) {
        if (typeof val === 'function') return val;
        if (typeof val === 'string') {
            if (window[val]) return window[val];
            return new Function(val);
        }
        return null;
    },
    object: function object(val) {
        if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') return val;
        return null; // TODO try JSON.deserialize
    },
    array: function array(val) {
        throw 'not implemented';
    },
    date: function date(val) {
        throw 'not implemented';
    },
    number: function number(val) {
        var val = Number(val);
        if (isNaN(val)) return null;
        return val;
    },
    any: function any(val) {
        return val;
    }
};

var defaultValues = {
    bool: true,
    string: '',
    func: function func() {},
    object: {},
    array: [],
    date: null,
    number: 0,
    any: ''
};

var RenderComponent = function (_HTMLElement) {
    _inherits(RenderComponent, _HTMLElement);

    function RenderComponent() {
        _classCallCheck(this, RenderComponent);

        // Create a (private) properties object with custom getter/setter
        var _this = _possibleConstructorReturn(this, (RenderComponent.__proto__ || Object.getPrototypeOf(RenderComponent)).call(this));

        var observedAttributes = [];
        Object.keys(_this.constructor.properties).forEach(function (key) {
            var backingProperty = Symbol(key);
            Object.defineProperty(_this, key, {
                get: function get() {
                    return this[backingProperty];
                },
                set: function set(val) {
                    if (deserialize[this.constructor.properties[key].type]) {
                        val = deserialize[this.constructor.properties[key].type](val);
                        if (val === null) return;
                    }
                    if (this[backingProperty] === val) return;
                    this[backingProperty] = val;
                    // Schedule a render
                    this._scheduleRender();
                    if (this.constructor.properties[key].attribute) {
                        // TODO map prop name to attr name
                        this.setAttribute(key, val); // Sync attribute
                    }
                    //this.render();
                }
            });
            if (_this.constructor.properties[key].attribute) {
                observedAttributes.push(key); // TODO map prop name to attr name
            }
            // Set default val based on type
            _this[backingProperty] = defaultValues[_this.constructor.properties[key].type];
        });
        return _this;
    }

    _createClass(RenderComponent, [{
        key: 'connectedCallback',


        // Element appended to the DOM
        value: function connectedCallback() {
            var _this2 = this;

            this._scheduleRender();
            Object.keys(this.constructor.properties).forEach(function (key) {
                // Set default property values (if defined)
                if ('value' in _this2.constructor.properties[key]) {
                    _this2[key] = _this2.constructor.properties[key].value;
                }
            });
        }
    }, {
        key: '_scheduleRender',
        value: function _scheduleRender() {
            var _this3 = this;

            if (this._renderScheduled) return;
            this._renderScheduled = true;
            requestAnimationFrame(function () {
                _this3._renderScheduled = false;
                _this3.render();
            });
        }
    }, {
        key: 'attributeChangedCallback',
        value: function attributeChangedCallback(attributeName, oldValue, newValue) {
            if (_get(RenderComponent.prototype.__proto__ || Object.getPrototypeOf(RenderComponent.prototype), 'attributeChangedCallback', this)) {
                _get(RenderComponent.prototype.__proto__ || Object.getPrototypeOf(RenderComponent.prototype), 'attributeChangedCallback', this).call(this);
            }
            if (oldValue === newValue) return;
            var propertyName = attributeToPropertyName(attributeName);
            if (propertyName in this) {
                this[propertyName] = newValue;
            }
        }
    }]);

    return RenderComponent;
}(HTMLElement);

// Memoized maps of attribute to property names and vice versa.


var attributeToPropertyNames = {};
var propertyNamesToAttributes = {};

/**
 * Convert hyphenated foo-bar attribute name to camel case fooBar property name.
 */
function attributeToPropertyName(attributeName) {
    var propertyName = attributeToPropertyNames[attributeName];
    if (!propertyName) {
        // Convert and memoize.
        var hyphenRegEx = /-([a-z])/g;
        propertyName = attributeName.replace(hyphenRegEx, function (match) {
            return match[1].toUpperCase();
        });
        attributeToPropertyNames[attributeName] = propertyName;
    }
    return propertyName;
}

exports.RenderComponent = RenderComponent;
