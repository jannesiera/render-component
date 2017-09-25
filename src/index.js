// Peforms: (de)serialization, observed properties and automatic rendering (in animationframe)

/* Attributes to properties */
// Assumes property names as fooBar and attribute names as foo-bar and maps them accordingly
// Inspired by: https://github.com/elix/elix/blob/master/mixins/AttributeMarshallingMixin.js

const deserialize = {
    bool: (val) => {
        if(val === true || val == 'true') return true;
        if(val === false || val == 'false') return false;
        return null;
    },
    string: (val) =>  val + "",
    func: (val) => {
        if(typeof val === 'function') return val;
        if(typeof val === 'string') {
            if(window[val]) return window[val];
            return new Function(val);
        }
        return null;
     },
    object: (val) => {
        if(typeof val === 'object') return val;
        return null; // TODO try JSON.deserialize
    },
    array: (val) => { 
        if(Array.isArray(val)) return val;
        throw 'not implemented';
    },
    date: (val) => { 
        if(val instanceof window.Date) return val;
        throw 'not implemented';
    },
    number: (val) => {
        var val = Number(val);
        if(isNaN(val)) return null;
        return val;
    },
    any: (val) => val,
};

const defaultValues = {
    bool: true,
    string: '',
    func: function() {},
    object: {},
    array: [],
    date: null,
    number: 0,
    any: ''
}

class RenderComponent extends HTMLElement {
    constructor() {
        super();

        // Create a (private) properties object with custom getter/setter
        var observedAttributes = [];
        Object.keys(this.constructor.properties).forEach((key) => {
            var backingProperty = Symbol(key);
            Object.defineProperty(this, key, {
                get: function() {
                    return this[backingProperty];
                },
                set: function(val) {
                    if(deserialize[this.constructor.properties[key].type]) {
                        val = deserialize[this.constructor.properties[key].type](val);
                        if(val === null) return;
                    }
                    //if(this[backingProperty] === val) return; // breaks referential types (objects)
                    this[backingProperty] = val;
                    // Schedule a render
                    this._scheduleRender();
                    if(this.constructor.properties[key].attribute) {
                        // TODO map prop name to attr name
                        this.setAttribute(key, val); // Sync attribute
                    }
                }
            });
            if(this.constructor.properties[key].attribute) {
                observedAttributes.push(key);// TODO map prop name to attr name
            }
            // Set default val based on type
            this[backingProperty] = defaultValues[this.constructor.properties[key].type];
        });
    };

    // Element appended to the DOM
    connectedCallback() {
        this._scheduleRender();
        Object.keys(this.constructor.properties).forEach((key) => {
            // Set default property values (if defined)
            if('value' in this.constructor.properties[key]) {
                this[key] = this.constructor.properties[key].value;
            }
        });
    }

    _scheduleRender() {
        if(this._renderScheduled) return;
        this._renderScheduled = true;
        requestAnimationFrame(() => {
            this._renderScheduled = false;
            this.render();
        });
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        if (super.attributeChangedCallback) { super.attributeChangedCallback(); }
        if(oldValue === newValue) return;
        const propertyName = attributeToPropertyName(attributeName);
        if (propertyName in this) {
            this[propertyName] = newValue;
        }
    }
}

    
// Memoized maps of attribute to property names and vice versa.
const attributeToPropertyNames = {};
const propertyNamesToAttributes = {};

/**
 * Convert hyphenated foo-bar attribute name to camel case fooBar property name.
 */
function attributeToPropertyName(attributeName) {
    let propertyName = attributeToPropertyNames[attributeName];
    if (!propertyName) {
        // Convert and memoize.
        const hyphenRegEx = /-([a-z])/g;
        propertyName = attributeName.replace(hyphenRegEx, match => match[1].toUpperCase());
        attributeToPropertyNames[attributeName] = propertyName;
    }
    return propertyName;
}

export { RenderComponent }