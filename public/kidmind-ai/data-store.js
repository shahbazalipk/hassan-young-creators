/** Simple localStorage wrapper for KidMind AI */
var DataStore = (function () {
  var PREFIX = "kidmind_";
  var LEGACY_PREFIX = "quizbuddy_";

  function migrateLegacyKeys() {
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(LEGACY_PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) {
        var next = PREFIX + k.slice(LEGACY_PREFIX.length);
        if (localStorage.getItem(next) === null) {
          localStorage.setItem(next, localStorage.getItem(k));
        }
        localStorage.removeItem(k);
      });
    } catch (e) {
      /* ignore migration errors */
    }
  }

  migrateLegacyKeys();

  function key(name) {
    return PREFIX + name;
  }

  function get(name, fallback) {
    try {
      var raw = localStorage.getItem(key(name));
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(name, value) {
    try {
      localStorage.setItem(key(name), JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(name) {
    try {
      localStorage.removeItem(key(name));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAll() {
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); });
      return true;
    } catch (e) {
      return false;
    }
  }

  return { get: get, set: set, remove: remove, clearAll: clearAll, PREFIX: PREFIX };
})();
