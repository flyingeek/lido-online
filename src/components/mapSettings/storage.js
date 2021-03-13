import {kmlRegex} from './ColorPinCombo.svelte';
import {kmlDefaultOptions} from '../kml';

class Storage {
    constructor() {}
    getItem(key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
            try {
                return JSON.parse(value);
            } catch (err) {
                this.removeItem(key);
                console.log(`invalid json in ${key}`);
            }
        }
        return null;
    }
    setItem(key, value) {
        const toSave = JSON.stringify(value);
        if (toSave !== '{}') {
            localStorage.setItem(key, toSave);
        }
    }
    removeItem(key) {
        localStorage.removeItem(key);
    }
}
export const stores = Object.freeze({
    "optionsKML": "optionsKML",
    "shortcut": "shortcut",
    "downloadType": "downloadType"
});

export const storage = new Storage();

export const validate = (options) => {
    const validated = {};
    for (let [key, value] of Object.entries(options)) {
        if (key in kmlDefaultOptions) { 
            if (key.endsWith('Pin')) {
                value *= 1; // coalesce to number or NaN
                if (!isNaN(value)) {
                    validated[key] = value;
                }
            } else if (key.endsWith('Color') && value.match(kmlRegex)) {
                validated[key] = value.toUpperCase();
            } else if (key.endsWith('Display')) {
                validated[key] = !!(value); //coerce to boolean
            } else if (key.endsWith('Change')) {
                value *= 1; // coalesce to number or NaN
                if (!isNaN(value)) {
                    validated[key] = value.toFixed(1);
                }
            }
        }
    }
    return {...kmlDefaultOptions, ...validated};
};


export const setHistory = (kmlOptions, route, name="Mon OFP2MAP") => {
    const options = {};
    for (const [key, store] of Object.entries(stores)) {
        let value = storage.getItem(store);
        if (key === stores.optionsKML && kmlOptions) {
            const diff = {};
            for (const key of Object.keys(kmlOptions).filter(k => kmlOptions[k] !== kmlDefaultOptions[k])){
                diff[key] = kmlOptions[key];
            }
            value = diff;
        }
        if (value !== null) {
            if (key === stores.optionsKML) {
                for (const[k, v] of Object.entries(value)) {
                    options[k] = v;
                }
            } else {
                options[key] = value;
            }
        }
    }
    const query = Object.entries(options)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    const permalink =
        window.location.origin +
        window.location.pathname +
        (query ? "?" + query : "") +
        '#' + route;
    window.history.replaceState(options, name, permalink);
};

export const storeSettingsFromURL = (url) => {
    const rawData = {}
    const validated = {}
    if (url.length > 1) {
        const query = url.substr(1) || "";
        query.split("&").forEach(function(part) {
            const item = part.split("=");
            rawData[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
        });
    }
    for (let [key, value] of Object.entries(rawData)) {
        if (key in kmlDefaultOptions) {
            let valid=undefined;
            if (key.endsWith('Pin')) {
                value *= 1; // coalesce to number or NaN
                if (!isNaN(value)) {
                    valid = value;
                }
            } else if (key.endsWith('Color') && value.match(kmlRegex)) {
                valid = value.toUpperCase();
            } else if (key.endsWith('Display')) {
                valid = !!(value); //coerce to boolean
            } else if (key.endsWith('Change')) {
                value *= 1; // coalesce to number or NaN
                if (!isNaN(value)) {
                    valid = value.toFixed(1);
                }
            }
            if (valid !== undefined) {
                validated[key] = valid;
            }
        }else if (key === 'downloadType') {
            value *= 1;
            if (!isNaN(value)) {
                storage.setItem(stores.downloadType, value);
            }
        }else if (key === 'shortcut') {
            value = value.trim();
            if (value) {
                storage.setItem(stores.shortcut, value);
            }
        }
    }
    storage.setItem(stores.optionsKML, validated);
}