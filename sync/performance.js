/** @typedef {{ [name: string]: number}} ScopeInfo */
/** @type {{ [name: string]: ScopeInfo}} */
const scopedData = {};

module.exports = function(scopeName) {
    if (!scopedData[scopeName]) {
        scopedData[scopeName] = {};
    }

    const scope = scopedData[scopeName];

    /**
     * Records the start time of a given operation.
     * @param {string} name 
     */
    function start(name) {
        scope[name] = Date.now();
    }

    /**
     * Records the end time of a given operation and prints the elapsed time
     * if `process.env.PROFILE_SYNC` is set.
     * @param {string} name 
     */
    function end(name) {
        if (!(name in scope)) {
            return;
        }
        if (process.env.PROFILE_SYNC) {
            console.log(`${name} took ${Date.now() - scope[name]}ms`);
        }
    }

    function timedFunc(name, func, callback) {
        start(name);
        func((err) => {
            end(name);
            callback(err);
        });
    }

    return {
        start,
        end,
        timedFunc,
    }
}
