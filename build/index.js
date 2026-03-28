"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/prefs.ts
  function get(key) {
    const val = globalThis.Zotero?.Prefs?.get(`${PREFIX}.${key}`);
    return val !== void 0 ? val : DEFAULTS[key];
  }
  var PREFIX, DEFAULTS, getApiUrl, getSyncInterval, getChatMaxChunks, getSyncOnStartup, getAutoSync;
  var init_prefs = __esm({
    "src/prefs.ts"() {
      "use strict";
      PREFIX = "extensions.zotero-ai";
      DEFAULTS = {
        apiUrl: "http://localhost:6500",
        syncInterval: 12,
        syncOnStartup: true,
        autoSync: true,
        theme: "auto",
        accentColor: "blue",
        graphNodeSize: "M",
        chatModel: "google/gemma-2-9b-it",
        chatMaxChunks: 8,
        chatStream: true,
        discoveryPubmed: true,
        discoverySemanticScholar: true,
        discoveryOpenAlex: false,
        autoCascadeDelete: false
      };
      getApiUrl = () => get("apiUrl");
      getSyncInterval = () => get("syncInterval");
      getChatMaxChunks = () => get("chatMaxChunks");
      getSyncOnStartup = () => get("syncOnStartup");
      getAutoSync = () => get("autoSync");
    }
  });

  // src/api/client.ts
  async function withRetry(fn, maxRetries = 3) {
    let lastError = new Error("Unknown error");
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (err instanceof ApiError && err.status < 500)
          throw err;
        await new Promise((r2) => setTimeout(r2, Math.pow(2, attempt) * 500));
      }
    }
    throw lastError;
  }
  async function apiFetch(path, options = {}) {
    const base = getApiUrl();
    const url = `${base}/api/plugin${path}`;
    return withRetry(async () => {
      const resp = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers ?? {} }
      });
      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const body = await resp.json();
          msg = body.error ?? msg;
        } catch {
        }
        throw new ApiError(resp.status, msg);
      }
      return resp.json();
    });
  }
  var ApiError;
  var init_client = __esm({
    "src/api/client.ts"() {
      "use strict";
      init_prefs();
      ApiError = class extends Error {
        constructor(status, message) {
          super(message);
          this.status = status;
          this.name = "ApiError";
        }
      };
    }
  });

  // node_modules/react/cjs/react.production.min.js
  var require_react_production_min = __commonJS({
    "node_modules/react/cjs/react.production.min.js"(exports) {
      "use strict";
      var l = Symbol.for("react.element");
      var n3 = Symbol.for("react.portal");
      var p2 = Symbol.for("react.fragment");
      var q = Symbol.for("react.strict_mode");
      var r2 = Symbol.for("react.profiler");
      var t2 = Symbol.for("react.provider");
      var u = Symbol.for("react.context");
      var v = Symbol.for("react.forward_ref");
      var w = Symbol.for("react.suspense");
      var x = Symbol.for("react.memo");
      var y = Symbol.for("react.lazy");
      var z = Symbol.iterator;
      function A(a7) {
        if (null === a7 || "object" !== typeof a7)
          return null;
        a7 = z && a7[z] || a7["@@iterator"];
        return "function" === typeof a7 ? a7 : null;
      }
      var B = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } };
      var C = Object.assign;
      var D = {};
      function E(a7, b, e8) {
        this.props = a7;
        this.context = b;
        this.refs = D;
        this.updater = e8 || B;
      }
      E.prototype.isReactComponent = {};
      E.prototype.setState = function(a7, b) {
        if ("object" !== typeof a7 && "function" !== typeof a7 && null != a7)
          throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, a7, b, "setState");
      };
      E.prototype.forceUpdate = function(a7) {
        this.updater.enqueueForceUpdate(this, a7, "forceUpdate");
      };
      function F() {
      }
      F.prototype = E.prototype;
      function G(a7, b, e8) {
        this.props = a7;
        this.context = b;
        this.refs = D;
        this.updater = e8 || B;
      }
      var H = G.prototype = new F();
      H.constructor = G;
      C(H, E.prototype);
      H.isPureReactComponent = true;
      var I = Array.isArray;
      var J = Object.prototype.hasOwnProperty;
      var K = { current: null };
      var L = { key: true, ref: true, __self: true, __source: true };
      function M(a7, b, e8) {
        var d, c = {}, k = null, h = null;
        if (null != b)
          for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b)
            J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
        var g = arguments.length - 2;
        if (1 === g)
          c.children = e8;
        else if (1 < g) {
          for (var f2 = Array(g), m2 = 0; m2 < g; m2++)
            f2[m2] = arguments[m2 + 2];
          c.children = f2;
        }
        if (a7 && a7.defaultProps)
          for (d in g = a7.defaultProps, g)
            void 0 === c[d] && (c[d] = g[d]);
        return { $$typeof: l, type: a7, key: k, ref: h, props: c, _owner: K.current };
      }
      function N(a7, b) {
        return { $$typeof: l, type: a7.type, key: b, ref: a7.ref, props: a7.props, _owner: a7._owner };
      }
      function O(a7) {
        return "object" === typeof a7 && null !== a7 && a7.$$typeof === l;
      }
      function escape(a7) {
        var b = { "=": "=0", ":": "=2" };
        return "$" + a7.replace(/[=:]/g, function(a8) {
          return b[a8];
        });
      }
      var P = /\/+/g;
      function Q(a7, b) {
        return "object" === typeof a7 && null !== a7 && null != a7.key ? escape("" + a7.key) : b.toString(36);
      }
      function R(a7, b, e8, d, c) {
        var k = typeof a7;
        if ("undefined" === k || "boolean" === k)
          a7 = null;
        var h = false;
        if (null === a7)
          h = true;
        else
          switch (k) {
            case "string":
            case "number":
              h = true;
              break;
            case "object":
              switch (a7.$$typeof) {
                case l:
                case n3:
                  h = true;
              }
          }
        if (h)
          return h = a7, c = c(h), a7 = "" === d ? "." + Q(h, 0) : d, I(c) ? (e8 = "", null != a7 && (e8 = a7.replace(P, "$&/") + "/"), R(c, b, e8, "", function(a8) {
            return a8;
          })) : null != c && (O(c) && (c = N(c, e8 + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a7)), b.push(c)), 1;
        h = 0;
        d = "" === d ? "." : d + ":";
        if (I(a7))
          for (var g = 0; g < a7.length; g++) {
            k = a7[g];
            var f2 = d + Q(k, g);
            h += R(k, b, e8, f2, c);
          }
        else if (f2 = A(a7), "function" === typeof f2)
          for (a7 = f2.call(a7), g = 0; !(k = a7.next()).done; )
            k = k.value, f2 = d + Q(k, g++), h += R(k, b, e8, f2, c);
        else if ("object" === k)
          throw b = String(a7), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a7).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
        return h;
      }
      function S(a7, b, e8) {
        if (null == a7)
          return a7;
        var d = [], c = 0;
        R(a7, d, "", "", function(a8) {
          return b.call(e8, a8, c++);
        });
        return d;
      }
      function T(a7) {
        if (-1 === a7._status) {
          var b = a7._result;
          b = b();
          b.then(function(b2) {
            if (0 === a7._status || -1 === a7._status)
              a7._status = 1, a7._result = b2;
          }, function(b2) {
            if (0 === a7._status || -1 === a7._status)
              a7._status = 2, a7._result = b2;
          });
          -1 === a7._status && (a7._status = 0, a7._result = b);
        }
        if (1 === a7._status)
          return a7._result.default;
        throw a7._result;
      }
      var U = { current: null };
      var V = { transition: null };
      var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
      function X() {
        throw Error("act(...) is not supported in production builds of React.");
      }
      exports.Children = { map: S, forEach: function(a7, b, e8) {
        S(a7, function() {
          b.apply(this, arguments);
        }, e8);
      }, count: function(a7) {
        var b = 0;
        S(a7, function() {
          b++;
        });
        return b;
      }, toArray: function(a7) {
        return S(a7, function(a8) {
          return a8;
        }) || [];
      }, only: function(a7) {
        if (!O(a7))
          throw Error("React.Children.only expected to receive a single React element child.");
        return a7;
      } };
      exports.Component = E;
      exports.Fragment = p2;
      exports.Profiler = r2;
      exports.PureComponent = G;
      exports.StrictMode = q;
      exports.Suspense = w;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
      exports.act = X;
      exports.cloneElement = function(a7, b, e8) {
        if (null === a7 || void 0 === a7)
          throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a7 + ".");
        var d = C({}, a7.props), c = a7.key, k = a7.ref, h = a7._owner;
        if (null != b) {
          void 0 !== b.ref && (k = b.ref, h = K.current);
          void 0 !== b.key && (c = "" + b.key);
          if (a7.type && a7.type.defaultProps)
            var g = a7.type.defaultProps;
          for (f2 in b)
            J.call(b, f2) && !L.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
        }
        var f2 = arguments.length - 2;
        if (1 === f2)
          d.children = e8;
        else if (1 < f2) {
          g = Array(f2);
          for (var m2 = 0; m2 < f2; m2++)
            g[m2] = arguments[m2 + 2];
          d.children = g;
        }
        return { $$typeof: l, type: a7.type, key: c, ref: k, props: d, _owner: h };
      };
      exports.createContext = function(a7) {
        a7 = { $$typeof: u, _currentValue: a7, _currentValue2: a7, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
        a7.Provider = { $$typeof: t2, _context: a7 };
        return a7.Consumer = a7;
      };
      exports.createElement = M;
      exports.createFactory = function(a7) {
        var b = M.bind(null, a7);
        b.type = a7;
        return b;
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(a7) {
        return { $$typeof: v, render: a7 };
      };
      exports.isValidElement = O;
      exports.lazy = function(a7) {
        return { $$typeof: y, _payload: { _status: -1, _result: a7 }, _init: T };
      };
      exports.memo = function(a7, b) {
        return { $$typeof: x, type: a7, compare: void 0 === b ? null : b };
      };
      exports.startTransition = function(a7) {
        var b = V.transition;
        V.transition = {};
        try {
          a7();
        } finally {
          V.transition = b;
        }
      };
      exports.unstable_act = X;
      exports.useCallback = function(a7, b) {
        return U.current.useCallback(a7, b);
      };
      exports.useContext = function(a7) {
        return U.current.useContext(a7);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(a7) {
        return U.current.useDeferredValue(a7);
      };
      exports.useEffect = function(a7, b) {
        return U.current.useEffect(a7, b);
      };
      exports.useId = function() {
        return U.current.useId();
      };
      exports.useImperativeHandle = function(a7, b, e8) {
        return U.current.useImperativeHandle(a7, b, e8);
      };
      exports.useInsertionEffect = function(a7, b) {
        return U.current.useInsertionEffect(a7, b);
      };
      exports.useLayoutEffect = function(a7, b) {
        return U.current.useLayoutEffect(a7, b);
      };
      exports.useMemo = function(a7, b) {
        return U.current.useMemo(a7, b);
      };
      exports.useReducer = function(a7, b, e8) {
        return U.current.useReducer(a7, b, e8);
      };
      exports.useRef = function(a7) {
        return U.current.useRef(a7);
      };
      exports.useState = function(a7) {
        return U.current.useState(a7);
      };
      exports.useSyncExternalStore = function(a7, b, e8) {
        return U.current.useSyncExternalStore(a7, b, e8);
      };
      exports.useTransition = function() {
        return U.current.useTransition();
      };
      exports.version = "18.3.1";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.min.js
  var require_scheduler_production_min = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.min.js"(exports) {
      "use strict";
      function f2(a7, b) {
        var c = a7.length;
        a7.push(b);
        a:
          for (; 0 < c; ) {
            var d = c - 1 >>> 1, e8 = a7[d];
            if (0 < g(e8, b))
              a7[d] = b, a7[c] = e8, c = d;
            else
              break a;
          }
      }
      function h(a7) {
        return 0 === a7.length ? null : a7[0];
      }
      function k(a7) {
        if (0 === a7.length)
          return null;
        var b = a7[0], c = a7.pop();
        if (c !== b) {
          a7[0] = c;
          a:
            for (var d = 0, e8 = a7.length, w = e8 >>> 1; d < w; ) {
              var m2 = 2 * (d + 1) - 1, C = a7[m2], n3 = m2 + 1, x = a7[n3];
              if (0 > g(C, c))
                n3 < e8 && 0 > g(x, C) ? (a7[d] = x, a7[n3] = c, d = n3) : (a7[d] = C, a7[m2] = c, d = m2);
              else if (n3 < e8 && 0 > g(x, c))
                a7[d] = x, a7[n3] = c, d = n3;
              else
                break a;
            }
        }
        return b;
      }
      function g(a7, b) {
        var c = a7.sortIndex - b.sortIndex;
        return 0 !== c ? c : a7.id - b.id;
      }
      if ("object" === typeof performance && "function" === typeof performance.now) {
        l = performance;
        exports.unstable_now = function() {
          return l.now();
        };
      } else {
        p2 = Date, q = p2.now();
        exports.unstable_now = function() {
          return p2.now() - q;
        };
      }
      var l;
      var p2;
      var q;
      var r2 = [];
      var t2 = [];
      var u = 1;
      var v = null;
      var y = 3;
      var z = false;
      var A = false;
      var B = false;
      var D = "function" === typeof setTimeout ? setTimeout : null;
      var E = "function" === typeof clearTimeout ? clearTimeout : null;
      var F = "undefined" !== typeof setImmediate ? setImmediate : null;
      "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
      function G(a7) {
        for (var b = h(t2); null !== b; ) {
          if (null === b.callback)
            k(t2);
          else if (b.startTime <= a7)
            k(t2), b.sortIndex = b.expirationTime, f2(r2, b);
          else
            break;
          b = h(t2);
        }
      }
      function H(a7) {
        B = false;
        G(a7);
        if (!A)
          if (null !== h(r2))
            A = true, I(J);
          else {
            var b = h(t2);
            null !== b && K(H, b.startTime - a7);
          }
      }
      function J(a7, b) {
        A = false;
        B && (B = false, E(L), L = -1);
        z = true;
        var c = y;
        try {
          G(b);
          for (v = h(r2); null !== v && (!(v.expirationTime > b) || a7 && !M()); ) {
            var d = v.callback;
            if ("function" === typeof d) {
              v.callback = null;
              y = v.priorityLevel;
              var e8 = d(v.expirationTime <= b);
              b = exports.unstable_now();
              "function" === typeof e8 ? v.callback = e8 : v === h(r2) && k(r2);
              G(b);
            } else
              k(r2);
            v = h(r2);
          }
          if (null !== v)
            var w = true;
          else {
            var m2 = h(t2);
            null !== m2 && K(H, m2.startTime - b);
            w = false;
          }
          return w;
        } finally {
          v = null, y = c, z = false;
        }
      }
      var N = false;
      var O = null;
      var L = -1;
      var P = 5;
      var Q = -1;
      function M() {
        return exports.unstable_now() - Q < P ? false : true;
      }
      function R() {
        if (null !== O) {
          var a7 = exports.unstable_now();
          Q = a7;
          var b = true;
          try {
            b = O(true, a7);
          } finally {
            b ? S() : (N = false, O = null);
          }
        } else
          N = false;
      }
      var S;
      if ("function" === typeof F)
        S = function() {
          F(R);
        };
      else if ("undefined" !== typeof MessageChannel) {
        T = new MessageChannel(), U = T.port2;
        T.port1.onmessage = R;
        S = function() {
          U.postMessage(null);
        };
      } else
        S = function() {
          D(R, 0);
        };
      var T;
      var U;
      function I(a7) {
        O = a7;
        N || (N = true, S());
      }
      function K(a7, b) {
        L = D(function() {
          a7(exports.unstable_now());
        }, b);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(a7) {
        a7.callback = null;
      };
      exports.unstable_continueExecution = function() {
        A || z || (A = true, I(J));
      };
      exports.unstable_forceFrameRate = function(a7) {
        0 > a7 || 125 < a7 ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a7 ? Math.floor(1e3 / a7) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return y;
      };
      exports.unstable_getFirstCallbackNode = function() {
        return h(r2);
      };
      exports.unstable_next = function(a7) {
        switch (y) {
          case 1:
          case 2:
          case 3:
            var b = 3;
            break;
          default:
            b = y;
        }
        var c = y;
        y = b;
        try {
          return a7();
        } finally {
          y = c;
        }
      };
      exports.unstable_pauseExecution = function() {
      };
      exports.unstable_requestPaint = function() {
      };
      exports.unstable_runWithPriority = function(a7, b) {
        switch (a7) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            a7 = 3;
        }
        var c = y;
        y = a7;
        try {
          return b();
        } finally {
          y = c;
        }
      };
      exports.unstable_scheduleCallback = function(a7, b, c) {
        var d = exports.unstable_now();
        "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
        switch (a7) {
          case 1:
            var e8 = -1;
            break;
          case 2:
            e8 = 250;
            break;
          case 5:
            e8 = 1073741823;
            break;
          case 4:
            e8 = 1e4;
            break;
          default:
            e8 = 5e3;
        }
        e8 = c + e8;
        a7 = { id: u++, callback: b, priorityLevel: a7, startTime: c, expirationTime: e8, sortIndex: -1 };
        c > d ? (a7.sortIndex = c, f2(t2, a7), null === h(r2) && a7 === h(t2) && (B ? (E(L), L = -1) : B = true, K(H, c - d))) : (a7.sortIndex = e8, f2(r2, a7), A || z || (A = true, I(J)));
        return a7;
      };
      exports.unstable_shouldYield = M;
      exports.unstable_wrapCallback = function(a7) {
        var b = y;
        return function() {
          var c = y;
          y = b;
          try {
            return a7.apply(this, arguments);
          } finally {
            y = c;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.min.js
  var require_react_dom_production_min = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.min.js"(exports) {
      "use strict";
      var aa = require_react();
      var ca = require_scheduler();
      function p2(a7) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a7, c = 1; c < arguments.length; c++)
          b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a7 + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var da = /* @__PURE__ */ new Set();
      var ea = {};
      function fa(a7, b) {
        ha(a7, b);
        ha(a7 + "Capture", b);
      }
      function ha(a7, b) {
        ea[a7] = b;
        for (a7 = 0; a7 < b.length; a7++)
          da.add(b[a7]);
      }
      var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var ja = Object.prototype.hasOwnProperty;
      var ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
      var la = {};
      var ma = {};
      function oa(a7) {
        if (ja.call(ma, a7))
          return true;
        if (ja.call(la, a7))
          return false;
        if (ka.test(a7))
          return ma[a7] = true;
        la[a7] = true;
        return false;
      }
      function pa(a7, b, c, d) {
        if (null !== c && 0 === c.type)
          return false;
        switch (typeof b) {
          case "function":
          case "symbol":
            return true;
          case "boolean":
            if (d)
              return false;
            if (null !== c)
              return !c.acceptsBooleans;
            a7 = a7.toLowerCase().slice(0, 5);
            return "data-" !== a7 && "aria-" !== a7;
          default:
            return false;
        }
      }
      function qa(a7, b, c, d) {
        if (null === b || "undefined" === typeof b || pa(a7, b, c, d))
          return true;
        if (d)
          return false;
        if (null !== c)
          switch (c.type) {
            case 3:
              return !b;
            case 4:
              return false === b;
            case 5:
              return isNaN(b);
            case 6:
              return isNaN(b) || 1 > b;
          }
        return false;
      }
      function v(a7, b, c, d, e8, f2, g) {
        this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
        this.attributeName = d;
        this.attributeNamespace = e8;
        this.mustUseProperty = c;
        this.propertyName = a7;
        this.type = b;
        this.sanitizeURL = f2;
        this.removeEmptyString = g;
      }
      var z = {};
      "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a7) {
        z[a7] = new v(a7, 0, false, a7, null, false, false);
      });
      [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a7) {
        var b = a7[0];
        z[b] = new v(b, 1, false, a7[1], null, false, false);
      });
      ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a7) {
        z[a7] = new v(a7, 2, false, a7.toLowerCase(), null, false, false);
      });
      ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a7) {
        z[a7] = new v(a7, 2, false, a7, null, false, false);
      });
      "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a7) {
        z[a7] = new v(a7, 3, false, a7.toLowerCase(), null, false, false);
      });
      ["checked", "multiple", "muted", "selected"].forEach(function(a7) {
        z[a7] = new v(a7, 3, true, a7, null, false, false);
      });
      ["capture", "download"].forEach(function(a7) {
        z[a7] = new v(a7, 4, false, a7, null, false, false);
      });
      ["cols", "rows", "size", "span"].forEach(function(a7) {
        z[a7] = new v(a7, 6, false, a7, null, false, false);
      });
      ["rowSpan", "start"].forEach(function(a7) {
        z[a7] = new v(a7, 5, false, a7.toLowerCase(), null, false, false);
      });
      var ra = /[\-:]([a-z])/g;
      function sa(a7) {
        return a7[1].toUpperCase();
      }
      "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a7) {
        var b = a7.replace(
          ra,
          sa
        );
        z[b] = new v(b, 1, false, a7, null, false, false);
      });
      "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a7) {
        var b = a7.replace(ra, sa);
        z[b] = new v(b, 1, false, a7, "http://www.w3.org/1999/xlink", false, false);
      });
      ["xml:base", "xml:lang", "xml:space"].forEach(function(a7) {
        var b = a7.replace(ra, sa);
        z[b] = new v(b, 1, false, a7, "http://www.w3.org/XML/1998/namespace", false, false);
      });
      ["tabIndex", "crossOrigin"].forEach(function(a7) {
        z[a7] = new v(a7, 1, false, a7.toLowerCase(), null, false, false);
      });
      z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
      ["src", "href", "action", "formAction"].forEach(function(a7) {
        z[a7] = new v(a7, 1, false, a7.toLowerCase(), null, true, true);
      });
      function ta(a7, b, c, d) {
        var e8 = z.hasOwnProperty(b) ? z[b] : null;
        if (null !== e8 ? 0 !== e8.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1])
          qa(b, c, e8, d) && (c = null), d || null === e8 ? oa(b) && (null === c ? a7.removeAttribute(b) : a7.setAttribute(b, "" + c)) : e8.mustUseProperty ? a7[e8.propertyName] = null === c ? 3 === e8.type ? false : "" : c : (b = e8.attributeName, d = e8.attributeNamespace, null === c ? a7.removeAttribute(b) : (e8 = e8.type, c = 3 === e8 || 4 === e8 && true === c ? "" : "" + c, d ? a7.setAttributeNS(d, b, c) : a7.setAttribute(b, c)));
      }
      var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      var va = Symbol.for("react.element");
      var wa = Symbol.for("react.portal");
      var ya = Symbol.for("react.fragment");
      var za = Symbol.for("react.strict_mode");
      var Aa = Symbol.for("react.profiler");
      var Ba = Symbol.for("react.provider");
      var Ca = Symbol.for("react.context");
      var Da = Symbol.for("react.forward_ref");
      var Ea = Symbol.for("react.suspense");
      var Fa = Symbol.for("react.suspense_list");
      var Ga = Symbol.for("react.memo");
      var Ha = Symbol.for("react.lazy");
      Symbol.for("react.scope");
      Symbol.for("react.debug_trace_mode");
      var Ia = Symbol.for("react.offscreen");
      Symbol.for("react.legacy_hidden");
      Symbol.for("react.cache");
      Symbol.for("react.tracing_marker");
      var Ja = Symbol.iterator;
      function Ka(a7) {
        if (null === a7 || "object" !== typeof a7)
          return null;
        a7 = Ja && a7[Ja] || a7["@@iterator"];
        return "function" === typeof a7 ? a7 : null;
      }
      var A = Object.assign;
      var La;
      function Ma(a7) {
        if (void 0 === La)
          try {
            throw Error();
          } catch (c) {
            var b = c.stack.trim().match(/\n( *(at )?)/);
            La = b && b[1] || "";
          }
        return "\n" + La + a7;
      }
      var Na = false;
      function Oa(a7, b) {
        if (!a7 || Na)
          return "";
        Na = true;
        var c = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          if (b)
            if (b = function() {
              throw Error();
            }, Object.defineProperty(b.prototype, "props", { set: function() {
              throw Error();
            } }), "object" === typeof Reflect && Reflect.construct) {
              try {
                Reflect.construct(b, []);
              } catch (l) {
                var d = l;
              }
              Reflect.construct(a7, [], b);
            } else {
              try {
                b.call();
              } catch (l) {
                d = l;
              }
              a7.call(b.prototype);
            }
          else {
            try {
              throw Error();
            } catch (l) {
              d = l;
            }
            a7();
          }
        } catch (l) {
          if (l && d && "string" === typeof l.stack) {
            for (var e8 = l.stack.split("\n"), f2 = d.stack.split("\n"), g = e8.length - 1, h = f2.length - 1; 1 <= g && 0 <= h && e8[g] !== f2[h]; )
              h--;
            for (; 1 <= g && 0 <= h; g--, h--)
              if (e8[g] !== f2[h]) {
                if (1 !== g || 1 !== h) {
                  do
                    if (g--, h--, 0 > h || e8[g] !== f2[h]) {
                      var k = "\n" + e8[g].replace(" at new ", " at ");
                      a7.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a7.displayName));
                      return k;
                    }
                  while (1 <= g && 0 <= h);
                }
                break;
              }
          }
        } finally {
          Na = false, Error.prepareStackTrace = c;
        }
        return (a7 = a7 ? a7.displayName || a7.name : "") ? Ma(a7) : "";
      }
      function Pa(a7) {
        switch (a7.tag) {
          case 5:
            return Ma(a7.type);
          case 16:
            return Ma("Lazy");
          case 13:
            return Ma("Suspense");
          case 19:
            return Ma("SuspenseList");
          case 0:
          case 2:
          case 15:
            return a7 = Oa(a7.type, false), a7;
          case 11:
            return a7 = Oa(a7.type.render, false), a7;
          case 1:
            return a7 = Oa(a7.type, true), a7;
          default:
            return "";
        }
      }
      function Qa(a7) {
        if (null == a7)
          return null;
        if ("function" === typeof a7)
          return a7.displayName || a7.name || null;
        if ("string" === typeof a7)
          return a7;
        switch (a7) {
          case ya:
            return "Fragment";
          case wa:
            return "Portal";
          case Aa:
            return "Profiler";
          case za:
            return "StrictMode";
          case Ea:
            return "Suspense";
          case Fa:
            return "SuspenseList";
        }
        if ("object" === typeof a7)
          switch (a7.$$typeof) {
            case Ca:
              return (a7.displayName || "Context") + ".Consumer";
            case Ba:
              return (a7._context.displayName || "Context") + ".Provider";
            case Da:
              var b = a7.render;
              a7 = a7.displayName;
              a7 || (a7 = b.displayName || b.name || "", a7 = "" !== a7 ? "ForwardRef(" + a7 + ")" : "ForwardRef");
              return a7;
            case Ga:
              return b = a7.displayName || null, null !== b ? b : Qa(a7.type) || "Memo";
            case Ha:
              b = a7._payload;
              a7 = a7._init;
              try {
                return Qa(a7(b));
              } catch (c) {
              }
          }
        return null;
      }
      function Ra(a7) {
        var b = a7.type;
        switch (a7.tag) {
          case 24:
            return "Cache";
          case 9:
            return (b.displayName || "Context") + ".Consumer";
          case 10:
            return (b._context.displayName || "Context") + ".Provider";
          case 18:
            return "DehydratedFragment";
          case 11:
            return a7 = b.render, a7 = a7.displayName || a7.name || "", b.displayName || ("" !== a7 ? "ForwardRef(" + a7 + ")" : "ForwardRef");
          case 7:
            return "Fragment";
          case 5:
            return b;
          case 4:
            return "Portal";
          case 3:
            return "Root";
          case 6:
            return "Text";
          case 16:
            return Qa(b);
          case 8:
            return b === za ? "StrictMode" : "Mode";
          case 22:
            return "Offscreen";
          case 12:
            return "Profiler";
          case 21:
            return "Scope";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 25:
            return "TracingMarker";
          case 1:
          case 0:
          case 17:
          case 2:
          case 14:
          case 15:
            if ("function" === typeof b)
              return b.displayName || b.name || null;
            if ("string" === typeof b)
              return b;
        }
        return null;
      }
      function Sa(a7) {
        switch (typeof a7) {
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return a7;
          case "object":
            return a7;
          default:
            return "";
        }
      }
      function Ta(a7) {
        var b = a7.type;
        return (a7 = a7.nodeName) && "input" === a7.toLowerCase() && ("checkbox" === b || "radio" === b);
      }
      function Ua(a7) {
        var b = Ta(a7) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a7.constructor.prototype, b), d = "" + a7[b];
        if (!a7.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
          var e8 = c.get, f2 = c.set;
          Object.defineProperty(a7, b, { configurable: true, get: function() {
            return e8.call(this);
          }, set: function(a8) {
            d = "" + a8;
            f2.call(this, a8);
          } });
          Object.defineProperty(a7, b, { enumerable: c.enumerable });
          return { getValue: function() {
            return d;
          }, setValue: function(a8) {
            d = "" + a8;
          }, stopTracking: function() {
            a7._valueTracker = null;
            delete a7[b];
          } };
        }
      }
      function Va(a7) {
        a7._valueTracker || (a7._valueTracker = Ua(a7));
      }
      function Wa(a7) {
        if (!a7)
          return false;
        var b = a7._valueTracker;
        if (!b)
          return true;
        var c = b.getValue();
        var d = "";
        a7 && (d = Ta(a7) ? a7.checked ? "true" : "false" : a7.value);
        a7 = d;
        return a7 !== c ? (b.setValue(a7), true) : false;
      }
      function Xa(a7) {
        a7 = a7 || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof a7)
          return null;
        try {
          return a7.activeElement || a7.body;
        } catch (b) {
          return a7.body;
        }
      }
      function Ya(a7, b) {
        var c = b.checked;
        return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a7._wrapperState.initialChecked });
      }
      function Za(a7, b) {
        var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
        c = Sa(null != b.value ? b.value : c);
        a7._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
      }
      function ab(a7, b) {
        b = b.checked;
        null != b && ta(a7, "checked", b, false);
      }
      function bb(a7, b) {
        ab(a7, b);
        var c = Sa(b.value), d = b.type;
        if (null != c)
          if ("number" === d) {
            if (0 === c && "" === a7.value || a7.value != c)
              a7.value = "" + c;
          } else
            a7.value !== "" + c && (a7.value = "" + c);
        else if ("submit" === d || "reset" === d) {
          a7.removeAttribute("value");
          return;
        }
        b.hasOwnProperty("value") ? cb(a7, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a7, b.type, Sa(b.defaultValue));
        null == b.checked && null != b.defaultChecked && (a7.defaultChecked = !!b.defaultChecked);
      }
      function db(a7, b, c) {
        if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
          var d = b.type;
          if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value))
            return;
          b = "" + a7._wrapperState.initialValue;
          c || b === a7.value || (a7.value = b);
          a7.defaultValue = b;
        }
        c = a7.name;
        "" !== c && (a7.name = "");
        a7.defaultChecked = !!a7._wrapperState.initialChecked;
        "" !== c && (a7.name = c);
      }
      function cb(a7, b, c) {
        if ("number" !== b || Xa(a7.ownerDocument) !== a7)
          null == c ? a7.defaultValue = "" + a7._wrapperState.initialValue : a7.defaultValue !== "" + c && (a7.defaultValue = "" + c);
      }
      var eb = Array.isArray;
      function fb(a7, b, c, d) {
        a7 = a7.options;
        if (b) {
          b = {};
          for (var e8 = 0; e8 < c.length; e8++)
            b["$" + c[e8]] = true;
          for (c = 0; c < a7.length; c++)
            e8 = b.hasOwnProperty("$" + a7[c].value), a7[c].selected !== e8 && (a7[c].selected = e8), e8 && d && (a7[c].defaultSelected = true);
        } else {
          c = "" + Sa(c);
          b = null;
          for (e8 = 0; e8 < a7.length; e8++) {
            if (a7[e8].value === c) {
              a7[e8].selected = true;
              d && (a7[e8].defaultSelected = true);
              return;
            }
            null !== b || a7[e8].disabled || (b = a7[e8]);
          }
          null !== b && (b.selected = true);
        }
      }
      function gb(a7, b) {
        if (null != b.dangerouslySetInnerHTML)
          throw Error(p2(91));
        return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a7._wrapperState.initialValue });
      }
      function hb(a7, b) {
        var c = b.value;
        if (null == c) {
          c = b.children;
          b = b.defaultValue;
          if (null != c) {
            if (null != b)
              throw Error(p2(92));
            if (eb(c)) {
              if (1 < c.length)
                throw Error(p2(93));
              c = c[0];
            }
            b = c;
          }
          null == b && (b = "");
          c = b;
        }
        a7._wrapperState = { initialValue: Sa(c) };
      }
      function ib(a7, b) {
        var c = Sa(b.value), d = Sa(b.defaultValue);
        null != c && (c = "" + c, c !== a7.value && (a7.value = c), null == b.defaultValue && a7.defaultValue !== c && (a7.defaultValue = c));
        null != d && (a7.defaultValue = "" + d);
      }
      function jb(a7) {
        var b = a7.textContent;
        b === a7._wrapperState.initialValue && "" !== b && null !== b && (a7.value = b);
      }
      function kb(a7) {
        switch (a7) {
          case "svg":
            return "http://www.w3.org/2000/svg";
          case "math":
            return "http://www.w3.org/1998/Math/MathML";
          default:
            return "http://www.w3.org/1999/xhtml";
        }
      }
      function lb(a7, b) {
        return null == a7 || "http://www.w3.org/1999/xhtml" === a7 ? kb(b) : "http://www.w3.org/2000/svg" === a7 && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a7;
      }
      var mb;
      var nb = function(a7) {
        return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e8) {
          MSApp.execUnsafeLocalFunction(function() {
            return a7(b, c, d, e8);
          });
        } : a7;
      }(function(a7, b) {
        if ("http://www.w3.org/2000/svg" !== a7.namespaceURI || "innerHTML" in a7)
          a7.innerHTML = b;
        else {
          mb = mb || document.createElement("div");
          mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
          for (b = mb.firstChild; a7.firstChild; )
            a7.removeChild(a7.firstChild);
          for (; b.firstChild; )
            a7.appendChild(b.firstChild);
        }
      });
      function ob(a7, b) {
        if (b) {
          var c = a7.firstChild;
          if (c && c === a7.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
          }
        }
        a7.textContent = b;
      }
      var pb = {
        animationIterationCount: true,
        aspectRatio: true,
        borderImageOutset: true,
        borderImageSlice: true,
        borderImageWidth: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        columnCount: true,
        columns: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        gridArea: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowSpan: true,
        gridRowStart: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnSpan: true,
        gridColumnStart: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        tabSize: true,
        widows: true,
        zIndex: true,
        zoom: true,
        fillOpacity: true,
        floodOpacity: true,
        stopOpacity: true,
        strokeDasharray: true,
        strokeDashoffset: true,
        strokeMiterlimit: true,
        strokeOpacity: true,
        strokeWidth: true
      };
      var qb = ["Webkit", "ms", "Moz", "O"];
      Object.keys(pb).forEach(function(a7) {
        qb.forEach(function(b) {
          b = b + a7.charAt(0).toUpperCase() + a7.substring(1);
          pb[b] = pb[a7];
        });
      });
      function rb(a7, b, c) {
        return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a7) && pb[a7] ? ("" + b).trim() : b + "px";
      }
      function sb(a7, b) {
        a7 = a7.style;
        for (var c in b)
          if (b.hasOwnProperty(c)) {
            var d = 0 === c.indexOf("--"), e8 = rb(c, b[c], d);
            "float" === c && (c = "cssFloat");
            d ? a7.setProperty(c, e8) : a7[c] = e8;
          }
      }
      var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
      function ub(a7, b) {
        if (b) {
          if (tb[a7] && (null != b.children || null != b.dangerouslySetInnerHTML))
            throw Error(p2(137, a7));
          if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children)
              throw Error(p2(60));
            if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML))
              throw Error(p2(61));
          }
          if (null != b.style && "object" !== typeof b.style)
            throw Error(p2(62));
        }
      }
      function vb(a7, b) {
        if (-1 === a7.indexOf("-"))
          return "string" === typeof b.is;
        switch (a7) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var wb = null;
      function xb(a7) {
        a7 = a7.target || a7.srcElement || window;
        a7.correspondingUseElement && (a7 = a7.correspondingUseElement);
        return 3 === a7.nodeType ? a7.parentNode : a7;
      }
      var yb = null;
      var zb = null;
      var Ab = null;
      function Bb(a7) {
        if (a7 = Cb(a7)) {
          if ("function" !== typeof yb)
            throw Error(p2(280));
          var b = a7.stateNode;
          b && (b = Db(b), yb(a7.stateNode, a7.type, b));
        }
      }
      function Eb(a7) {
        zb ? Ab ? Ab.push(a7) : Ab = [a7] : zb = a7;
      }
      function Fb() {
        if (zb) {
          var a7 = zb, b = Ab;
          Ab = zb = null;
          Bb(a7);
          if (b)
            for (a7 = 0; a7 < b.length; a7++)
              Bb(b[a7]);
        }
      }
      function Gb(a7, b) {
        return a7(b);
      }
      function Hb() {
      }
      var Ib = false;
      function Jb(a7, b, c) {
        if (Ib)
          return a7(b, c);
        Ib = true;
        try {
          return Gb(a7, b, c);
        } finally {
          if (Ib = false, null !== zb || null !== Ab)
            Hb(), Fb();
        }
      }
      function Kb(a7, b) {
        var c = a7.stateNode;
        if (null === c)
          return null;
        var d = Db(c);
        if (null === d)
          return null;
        c = d[b];
        a:
          switch (b) {
            case "onClick":
            case "onClickCapture":
            case "onDoubleClick":
            case "onDoubleClickCapture":
            case "onMouseDown":
            case "onMouseDownCapture":
            case "onMouseMove":
            case "onMouseMoveCapture":
            case "onMouseUp":
            case "onMouseUpCapture":
            case "onMouseEnter":
              (d = !d.disabled) || (a7 = a7.type, d = !("button" === a7 || "input" === a7 || "select" === a7 || "textarea" === a7));
              a7 = !d;
              break a;
            default:
              a7 = false;
          }
        if (a7)
          return null;
        if (c && "function" !== typeof c)
          throw Error(p2(231, b, typeof c));
        return c;
      }
      var Lb = false;
      if (ia)
        try {
          Mb = {};
          Object.defineProperty(Mb, "passive", { get: function() {
            Lb = true;
          } });
          window.addEventListener("test", Mb, Mb);
          window.removeEventListener("test", Mb, Mb);
        } catch (a7) {
          Lb = false;
        }
      var Mb;
      function Nb(a7, b, c, d, e8, f2, g, h, k) {
        var l = Array.prototype.slice.call(arguments, 3);
        try {
          b.apply(c, l);
        } catch (m2) {
          this.onError(m2);
        }
      }
      var Ob = false;
      var Pb = null;
      var Qb = false;
      var Rb = null;
      var Sb = { onError: function(a7) {
        Ob = true;
        Pb = a7;
      } };
      function Tb(a7, b, c, d, e8, f2, g, h, k) {
        Ob = false;
        Pb = null;
        Nb.apply(Sb, arguments);
      }
      function Ub(a7, b, c, d, e8, f2, g, h, k) {
        Tb.apply(this, arguments);
        if (Ob) {
          if (Ob) {
            var l = Pb;
            Ob = false;
            Pb = null;
          } else
            throw Error(p2(198));
          Qb || (Qb = true, Rb = l);
        }
      }
      function Vb(a7) {
        var b = a7, c = a7;
        if (a7.alternate)
          for (; b.return; )
            b = b.return;
        else {
          a7 = b;
          do
            b = a7, 0 !== (b.flags & 4098) && (c = b.return), a7 = b.return;
          while (a7);
        }
        return 3 === b.tag ? c : null;
      }
      function Wb(a7) {
        if (13 === a7.tag) {
          var b = a7.memoizedState;
          null === b && (a7 = a7.alternate, null !== a7 && (b = a7.memoizedState));
          if (null !== b)
            return b.dehydrated;
        }
        return null;
      }
      function Xb(a7) {
        if (Vb(a7) !== a7)
          throw Error(p2(188));
      }
      function Yb(a7) {
        var b = a7.alternate;
        if (!b) {
          b = Vb(a7);
          if (null === b)
            throw Error(p2(188));
          return b !== a7 ? null : a7;
        }
        for (var c = a7, d = b; ; ) {
          var e8 = c.return;
          if (null === e8)
            break;
          var f2 = e8.alternate;
          if (null === f2) {
            d = e8.return;
            if (null !== d) {
              c = d;
              continue;
            }
            break;
          }
          if (e8.child === f2.child) {
            for (f2 = e8.child; f2; ) {
              if (f2 === c)
                return Xb(e8), a7;
              if (f2 === d)
                return Xb(e8), b;
              f2 = f2.sibling;
            }
            throw Error(p2(188));
          }
          if (c.return !== d.return)
            c = e8, d = f2;
          else {
            for (var g = false, h = e8.child; h; ) {
              if (h === c) {
                g = true;
                c = e8;
                d = f2;
                break;
              }
              if (h === d) {
                g = true;
                d = e8;
                c = f2;
                break;
              }
              h = h.sibling;
            }
            if (!g) {
              for (h = f2.child; h; ) {
                if (h === c) {
                  g = true;
                  c = f2;
                  d = e8;
                  break;
                }
                if (h === d) {
                  g = true;
                  d = f2;
                  c = e8;
                  break;
                }
                h = h.sibling;
              }
              if (!g)
                throw Error(p2(189));
            }
          }
          if (c.alternate !== d)
            throw Error(p2(190));
        }
        if (3 !== c.tag)
          throw Error(p2(188));
        return c.stateNode.current === c ? a7 : b;
      }
      function Zb(a7) {
        a7 = Yb(a7);
        return null !== a7 ? $b(a7) : null;
      }
      function $b(a7) {
        if (5 === a7.tag || 6 === a7.tag)
          return a7;
        for (a7 = a7.child; null !== a7; ) {
          var b = $b(a7);
          if (null !== b)
            return b;
          a7 = a7.sibling;
        }
        return null;
      }
      var ac = ca.unstable_scheduleCallback;
      var bc = ca.unstable_cancelCallback;
      var cc = ca.unstable_shouldYield;
      var dc = ca.unstable_requestPaint;
      var B = ca.unstable_now;
      var ec = ca.unstable_getCurrentPriorityLevel;
      var fc = ca.unstable_ImmediatePriority;
      var gc = ca.unstable_UserBlockingPriority;
      var hc = ca.unstable_NormalPriority;
      var ic = ca.unstable_LowPriority;
      var jc = ca.unstable_IdlePriority;
      var kc = null;
      var lc = null;
      function mc(a7) {
        if (lc && "function" === typeof lc.onCommitFiberRoot)
          try {
            lc.onCommitFiberRoot(kc, a7, void 0, 128 === (a7.current.flags & 128));
          } catch (b) {
          }
      }
      var oc = Math.clz32 ? Math.clz32 : nc;
      var pc = Math.log;
      var qc = Math.LN2;
      function nc(a7) {
        a7 >>>= 0;
        return 0 === a7 ? 32 : 31 - (pc(a7) / qc | 0) | 0;
      }
      var rc = 64;
      var sc = 4194304;
      function tc(a7) {
        switch (a7 & -a7) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return a7 & 4194240;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return a7 & 130023424;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 1073741824;
          default:
            return a7;
        }
      }
      function uc(a7, b) {
        var c = a7.pendingLanes;
        if (0 === c)
          return 0;
        var d = 0, e8 = a7.suspendedLanes, f2 = a7.pingedLanes, g = c & 268435455;
        if (0 !== g) {
          var h = g & ~e8;
          0 !== h ? d = tc(h) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
        } else
          g = c & ~e8, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
        if (0 === d)
          return 0;
        if (0 !== b && b !== d && 0 === (b & e8) && (e8 = d & -d, f2 = b & -b, e8 >= f2 || 16 === e8 && 0 !== (f2 & 4194240)))
          return b;
        0 !== (d & 4) && (d |= c & 16);
        b = a7.entangledLanes;
        if (0 !== b)
          for (a7 = a7.entanglements, b &= d; 0 < b; )
            c = 31 - oc(b), e8 = 1 << c, d |= a7[c], b &= ~e8;
        return d;
      }
      function vc(a7, b) {
        switch (a7) {
          case 1:
          case 2:
          case 4:
            return b + 250;
          case 8:
          case 16:
          case 32:
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return b + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return -1;
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function wc(a7, b) {
        for (var c = a7.suspendedLanes, d = a7.pingedLanes, e8 = a7.expirationTimes, f2 = a7.pendingLanes; 0 < f2; ) {
          var g = 31 - oc(f2), h = 1 << g, k = e8[g];
          if (-1 === k) {
            if (0 === (h & c) || 0 !== (h & d))
              e8[g] = vc(h, b);
          } else
            k <= b && (a7.expiredLanes |= h);
          f2 &= ~h;
        }
      }
      function xc(a7) {
        a7 = a7.pendingLanes & -1073741825;
        return 0 !== a7 ? a7 : a7 & 1073741824 ? 1073741824 : 0;
      }
      function yc() {
        var a7 = rc;
        rc <<= 1;
        0 === (rc & 4194240) && (rc = 64);
        return a7;
      }
      function zc(a7) {
        for (var b = [], c = 0; 31 > c; c++)
          b.push(a7);
        return b;
      }
      function Ac(a7, b, c) {
        a7.pendingLanes |= b;
        536870912 !== b && (a7.suspendedLanes = 0, a7.pingedLanes = 0);
        a7 = a7.eventTimes;
        b = 31 - oc(b);
        a7[b] = c;
      }
      function Bc(a7, b) {
        var c = a7.pendingLanes & ~b;
        a7.pendingLanes = b;
        a7.suspendedLanes = 0;
        a7.pingedLanes = 0;
        a7.expiredLanes &= b;
        a7.mutableReadLanes &= b;
        a7.entangledLanes &= b;
        b = a7.entanglements;
        var d = a7.eventTimes;
        for (a7 = a7.expirationTimes; 0 < c; ) {
          var e8 = 31 - oc(c), f2 = 1 << e8;
          b[e8] = 0;
          d[e8] = -1;
          a7[e8] = -1;
          c &= ~f2;
        }
      }
      function Cc(a7, b) {
        var c = a7.entangledLanes |= b;
        for (a7 = a7.entanglements; c; ) {
          var d = 31 - oc(c), e8 = 1 << d;
          e8 & b | a7[d] & b && (a7[d] |= b);
          c &= ~e8;
        }
      }
      var C = 0;
      function Dc(a7) {
        a7 &= -a7;
        return 1 < a7 ? 4 < a7 ? 0 !== (a7 & 268435455) ? 16 : 536870912 : 4 : 1;
      }
      var Ec;
      var Fc;
      var Gc;
      var Hc;
      var Ic;
      var Jc = false;
      var Kc = [];
      var Lc = null;
      var Mc = null;
      var Nc = null;
      var Oc = /* @__PURE__ */ new Map();
      var Pc = /* @__PURE__ */ new Map();
      var Qc = [];
      var Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
      function Sc(a7, b) {
        switch (a7) {
          case "focusin":
          case "focusout":
            Lc = null;
            break;
          case "dragenter":
          case "dragleave":
            Mc = null;
            break;
          case "mouseover":
          case "mouseout":
            Nc = null;
            break;
          case "pointerover":
          case "pointerout":
            Oc.delete(b.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            Pc.delete(b.pointerId);
        }
      }
      function Tc(a7, b, c, d, e8, f2) {
        if (null === a7 || a7.nativeEvent !== f2)
          return a7 = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e8] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a7;
        a7.eventSystemFlags |= d;
        b = a7.targetContainers;
        null !== e8 && -1 === b.indexOf(e8) && b.push(e8);
        return a7;
      }
      function Uc(a7, b, c, d, e8) {
        switch (b) {
          case "focusin":
            return Lc = Tc(Lc, a7, b, c, d, e8), true;
          case "dragenter":
            return Mc = Tc(Mc, a7, b, c, d, e8), true;
          case "mouseover":
            return Nc = Tc(Nc, a7, b, c, d, e8), true;
          case "pointerover":
            var f2 = e8.pointerId;
            Oc.set(f2, Tc(Oc.get(f2) || null, a7, b, c, d, e8));
            return true;
          case "gotpointercapture":
            return f2 = e8.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a7, b, c, d, e8)), true;
        }
        return false;
      }
      function Vc(a7) {
        var b = Wc(a7.target);
        if (null !== b) {
          var c = Vb(b);
          if (null !== c) {
            if (b = c.tag, 13 === b) {
              if (b = Wb(c), null !== b) {
                a7.blockedOn = b;
                Ic(a7.priority, function() {
                  Gc(c);
                });
                return;
              }
            } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
              a7.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
              return;
            }
          }
        }
        a7.blockedOn = null;
      }
      function Xc(a7) {
        if (null !== a7.blockedOn)
          return false;
        for (var b = a7.targetContainers; 0 < b.length; ) {
          var c = Yc(a7.domEventName, a7.eventSystemFlags, b[0], a7.nativeEvent);
          if (null === c) {
            c = a7.nativeEvent;
            var d = new c.constructor(c.type, c);
            wb = d;
            c.target.dispatchEvent(d);
            wb = null;
          } else
            return b = Cb(c), null !== b && Fc(b), a7.blockedOn = c, false;
          b.shift();
        }
        return true;
      }
      function Zc(a7, b, c) {
        Xc(a7) && c.delete(b);
      }
      function $c() {
        Jc = false;
        null !== Lc && Xc(Lc) && (Lc = null);
        null !== Mc && Xc(Mc) && (Mc = null);
        null !== Nc && Xc(Nc) && (Nc = null);
        Oc.forEach(Zc);
        Pc.forEach(Zc);
      }
      function ad(a7, b) {
        a7.blockedOn === b && (a7.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
      }
      function bd(a7) {
        function b(b2) {
          return ad(b2, a7);
        }
        if (0 < Kc.length) {
          ad(Kc[0], a7);
          for (var c = 1; c < Kc.length; c++) {
            var d = Kc[c];
            d.blockedOn === a7 && (d.blockedOn = null);
          }
        }
        null !== Lc && ad(Lc, a7);
        null !== Mc && ad(Mc, a7);
        null !== Nc && ad(Nc, a7);
        Oc.forEach(b);
        Pc.forEach(b);
        for (c = 0; c < Qc.length; c++)
          d = Qc[c], d.blockedOn === a7 && (d.blockedOn = null);
        for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); )
          Vc(c), null === c.blockedOn && Qc.shift();
      }
      var cd = ua.ReactCurrentBatchConfig;
      var dd = true;
      function ed(a7, b, c, d) {
        var e8 = C, f2 = cd.transition;
        cd.transition = null;
        try {
          C = 1, fd(a7, b, c, d);
        } finally {
          C = e8, cd.transition = f2;
        }
      }
      function gd(a7, b, c, d) {
        var e8 = C, f2 = cd.transition;
        cd.transition = null;
        try {
          C = 4, fd(a7, b, c, d);
        } finally {
          C = e8, cd.transition = f2;
        }
      }
      function fd(a7, b, c, d) {
        if (dd) {
          var e8 = Yc(a7, b, c, d);
          if (null === e8)
            hd(a7, b, d, id, c), Sc(a7, d);
          else if (Uc(e8, a7, b, c, d))
            d.stopPropagation();
          else if (Sc(a7, d), b & 4 && -1 < Rc.indexOf(a7)) {
            for (; null !== e8; ) {
              var f2 = Cb(e8);
              null !== f2 && Ec(f2);
              f2 = Yc(a7, b, c, d);
              null === f2 && hd(a7, b, d, id, c);
              if (f2 === e8)
                break;
              e8 = f2;
            }
            null !== e8 && d.stopPropagation();
          } else
            hd(a7, b, d, null, c);
        }
      }
      var id = null;
      function Yc(a7, b, c, d) {
        id = null;
        a7 = xb(d);
        a7 = Wc(a7);
        if (null !== a7)
          if (b = Vb(a7), null === b)
            a7 = null;
          else if (c = b.tag, 13 === c) {
            a7 = Wb(b);
            if (null !== a7)
              return a7;
            a7 = null;
          } else if (3 === c) {
            if (b.stateNode.current.memoizedState.isDehydrated)
              return 3 === b.tag ? b.stateNode.containerInfo : null;
            a7 = null;
          } else
            b !== a7 && (a7 = null);
        id = a7;
        return null;
      }
      function jd(a7) {
        switch (a7) {
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 1;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "toggle":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 4;
          case "message":
            switch (ec()) {
              case fc:
                return 1;
              case gc:
                return 4;
              case hc:
              case ic:
                return 16;
              case jc:
                return 536870912;
              default:
                return 16;
            }
          default:
            return 16;
        }
      }
      var kd = null;
      var ld = null;
      var md = null;
      function nd() {
        if (md)
          return md;
        var a7, b = ld, c = b.length, d, e8 = "value" in kd ? kd.value : kd.textContent, f2 = e8.length;
        for (a7 = 0; a7 < c && b[a7] === e8[a7]; a7++)
          ;
        var g = c - a7;
        for (d = 1; d <= g && b[c - d] === e8[f2 - d]; d++)
          ;
        return md = e8.slice(a7, 1 < d ? 1 - d : void 0);
      }
      function od(a7) {
        var b = a7.keyCode;
        "charCode" in a7 ? (a7 = a7.charCode, 0 === a7 && 13 === b && (a7 = 13)) : a7 = b;
        10 === a7 && (a7 = 13);
        return 32 <= a7 || 13 === a7 ? a7 : 0;
      }
      function pd() {
        return true;
      }
      function qd() {
        return false;
      }
      function rd(a7) {
        function b(b2, d, e8, f2, g) {
          this._reactName = b2;
          this._targetInst = e8;
          this.type = d;
          this.nativeEvent = f2;
          this.target = g;
          this.currentTarget = null;
          for (var c in a7)
            a7.hasOwnProperty(c) && (b2 = a7[c], this[c] = b2 ? b2(f2) : f2[c]);
          this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
          this.isPropagationStopped = qd;
          return this;
        }
        A(b.prototype, { preventDefault: function() {
          this.defaultPrevented = true;
          var a8 = this.nativeEvent;
          a8 && (a8.preventDefault ? a8.preventDefault() : "unknown" !== typeof a8.returnValue && (a8.returnValue = false), this.isDefaultPrevented = pd);
        }, stopPropagation: function() {
          var a8 = this.nativeEvent;
          a8 && (a8.stopPropagation ? a8.stopPropagation() : "unknown" !== typeof a8.cancelBubble && (a8.cancelBubble = true), this.isPropagationStopped = pd);
        }, persist: function() {
        }, isPersistent: pd });
        return b;
      }
      var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a7) {
        return a7.timeStamp || Date.now();
      }, defaultPrevented: 0, isTrusted: 0 };
      var td = rd(sd);
      var ud = A({}, sd, { view: 0, detail: 0 });
      var vd = rd(ud);
      var wd;
      var xd;
      var yd;
      var Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a7) {
        return void 0 === a7.relatedTarget ? a7.fromElement === a7.srcElement ? a7.toElement : a7.fromElement : a7.relatedTarget;
      }, movementX: function(a7) {
        if ("movementX" in a7)
          return a7.movementX;
        a7 !== yd && (yd && "mousemove" === a7.type ? (wd = a7.screenX - yd.screenX, xd = a7.screenY - yd.screenY) : xd = wd = 0, yd = a7);
        return wd;
      }, movementY: function(a7) {
        return "movementY" in a7 ? a7.movementY : xd;
      } });
      var Bd = rd(Ad);
      var Cd = A({}, Ad, { dataTransfer: 0 });
      var Dd = rd(Cd);
      var Ed = A({}, ud, { relatedTarget: 0 });
      var Fd = rd(Ed);
      var Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Hd = rd(Gd);
      var Id = A({}, sd, { clipboardData: function(a7) {
        return "clipboardData" in a7 ? a7.clipboardData : window.clipboardData;
      } });
      var Jd = rd(Id);
      var Kd = A({}, sd, { data: 0 });
      var Ld = rd(Kd);
      var Md = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var Nd = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
      function Pd(a7) {
        var b = this.nativeEvent;
        return b.getModifierState ? b.getModifierState(a7) : (a7 = Od[a7]) ? !!b[a7] : false;
      }
      function zd() {
        return Pd;
      }
      var Qd = A({}, ud, { key: function(a7) {
        if (a7.key) {
          var b = Md[a7.key] || a7.key;
          if ("Unidentified" !== b)
            return b;
        }
        return "keypress" === a7.type ? (a7 = od(a7), 13 === a7 ? "Enter" : String.fromCharCode(a7)) : "keydown" === a7.type || "keyup" === a7.type ? Nd[a7.keyCode] || "Unidentified" : "";
      }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a7) {
        return "keypress" === a7.type ? od(a7) : 0;
      }, keyCode: function(a7) {
        return "keydown" === a7.type || "keyup" === a7.type ? a7.keyCode : 0;
      }, which: function(a7) {
        return "keypress" === a7.type ? od(a7) : "keydown" === a7.type || "keyup" === a7.type ? a7.keyCode : 0;
      } });
      var Rd = rd(Qd);
      var Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 });
      var Td = rd(Sd);
      var Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd });
      var Vd = rd(Ud);
      var Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Xd = rd(Wd);
      var Yd = A({}, Ad, {
        deltaX: function(a7) {
          return "deltaX" in a7 ? a7.deltaX : "wheelDeltaX" in a7 ? -a7.wheelDeltaX : 0;
        },
        deltaY: function(a7) {
          return "deltaY" in a7 ? a7.deltaY : "wheelDeltaY" in a7 ? -a7.wheelDeltaY : "wheelDelta" in a7 ? -a7.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var Zd = rd(Yd);
      var $d = [9, 13, 27, 32];
      var ae = ia && "CompositionEvent" in window;
      var be = null;
      ia && "documentMode" in document && (be = document.documentMode);
      var ce = ia && "TextEvent" in window && !be;
      var de = ia && (!ae || be && 8 < be && 11 >= be);
      var ee = String.fromCharCode(32);
      var fe = false;
      function ge(a7, b) {
        switch (a7) {
          case "keyup":
            return -1 !== $d.indexOf(b.keyCode);
          case "keydown":
            return 229 !== b.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function he(a7) {
        a7 = a7.detail;
        return "object" === typeof a7 && "data" in a7 ? a7.data : null;
      }
      var ie = false;
      function je(a7, b) {
        switch (a7) {
          case "compositionend":
            return he(b);
          case "keypress":
            if (32 !== b.which)
              return null;
            fe = true;
            return ee;
          case "textInput":
            return a7 = b.data, a7 === ee && fe ? null : a7;
          default:
            return null;
        }
      }
      function ke(a7, b) {
        if (ie)
          return "compositionend" === a7 || !ae && ge(a7, b) ? (a7 = nd(), md = ld = kd = null, ie = false, a7) : null;
        switch (a7) {
          case "paste":
            return null;
          case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
              if (b.char && 1 < b.char.length)
                return b.char;
              if (b.which)
                return String.fromCharCode(b.which);
            }
            return null;
          case "compositionend":
            return de && "ko" !== b.locale ? null : b.data;
          default:
            return null;
        }
      }
      var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
      function me(a7) {
        var b = a7 && a7.nodeName && a7.nodeName.toLowerCase();
        return "input" === b ? !!le[a7.type] : "textarea" === b ? true : false;
      }
      function ne(a7, b, c, d) {
        Eb(d);
        b = oe(b, "onChange");
        0 < b.length && (c = new td("onChange", "change", null, c, d), a7.push({ event: c, listeners: b }));
      }
      var pe = null;
      var qe = null;
      function re(a7) {
        se(a7, 0);
      }
      function te(a7) {
        var b = ue(a7);
        if (Wa(b))
          return a7;
      }
      function ve(a7, b) {
        if ("change" === a7)
          return b;
      }
      var we = false;
      if (ia) {
        if (ia) {
          ye = "oninput" in document;
          if (!ye) {
            ze = document.createElement("div");
            ze.setAttribute("oninput", "return;");
            ye = "function" === typeof ze.oninput;
          }
          xe = ye;
        } else
          xe = false;
        we = xe && (!document.documentMode || 9 < document.documentMode);
      }
      var xe;
      var ye;
      var ze;
      function Ae() {
        pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
      }
      function Be(a7) {
        if ("value" === a7.propertyName && te(qe)) {
          var b = [];
          ne(b, qe, a7, xb(a7));
          Jb(re, b);
        }
      }
      function Ce(a7, b, c) {
        "focusin" === a7 ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a7 && Ae();
      }
      function De(a7) {
        if ("selectionchange" === a7 || "keyup" === a7 || "keydown" === a7)
          return te(qe);
      }
      function Ee(a7, b) {
        if ("click" === a7)
          return te(b);
      }
      function Fe(a7, b) {
        if ("input" === a7 || "change" === a7)
          return te(b);
      }
      function Ge(a7, b) {
        return a7 === b && (0 !== a7 || 1 / a7 === 1 / b) || a7 !== a7 && b !== b;
      }
      var He = "function" === typeof Object.is ? Object.is : Ge;
      function Ie(a7, b) {
        if (He(a7, b))
          return true;
        if ("object" !== typeof a7 || null === a7 || "object" !== typeof b || null === b)
          return false;
        var c = Object.keys(a7), d = Object.keys(b);
        if (c.length !== d.length)
          return false;
        for (d = 0; d < c.length; d++) {
          var e8 = c[d];
          if (!ja.call(b, e8) || !He(a7[e8], b[e8]))
            return false;
        }
        return true;
      }
      function Je(a7) {
        for (; a7 && a7.firstChild; )
          a7 = a7.firstChild;
        return a7;
      }
      function Ke(a7, b) {
        var c = Je(a7);
        a7 = 0;
        for (var d; c; ) {
          if (3 === c.nodeType) {
            d = a7 + c.textContent.length;
            if (a7 <= b && d >= b)
              return { node: c, offset: b - a7 };
            a7 = d;
          }
          a: {
            for (; c; ) {
              if (c.nextSibling) {
                c = c.nextSibling;
                break a;
              }
              c = c.parentNode;
            }
            c = void 0;
          }
          c = Je(c);
        }
      }
      function Le(a7, b) {
        return a7 && b ? a7 === b ? true : a7 && 3 === a7.nodeType ? false : b && 3 === b.nodeType ? Le(a7, b.parentNode) : "contains" in a7 ? a7.contains(b) : a7.compareDocumentPosition ? !!(a7.compareDocumentPosition(b) & 16) : false : false;
      }
      function Me() {
        for (var a7 = window, b = Xa(); b instanceof a7.HTMLIFrameElement; ) {
          try {
            var c = "string" === typeof b.contentWindow.location.href;
          } catch (d) {
            c = false;
          }
          if (c)
            a7 = b.contentWindow;
          else
            break;
          b = Xa(a7.document);
        }
        return b;
      }
      function Ne(a7) {
        var b = a7 && a7.nodeName && a7.nodeName.toLowerCase();
        return b && ("input" === b && ("text" === a7.type || "search" === a7.type || "tel" === a7.type || "url" === a7.type || "password" === a7.type) || "textarea" === b || "true" === a7.contentEditable);
      }
      function Oe(a7) {
        var b = Me(), c = a7.focusedElem, d = a7.selectionRange;
        if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
          if (null !== d && Ne(c)) {
            if (b = d.start, a7 = d.end, void 0 === a7 && (a7 = b), "selectionStart" in c)
              c.selectionStart = b, c.selectionEnd = Math.min(a7, c.value.length);
            else if (a7 = (b = c.ownerDocument || document) && b.defaultView || window, a7.getSelection) {
              a7 = a7.getSelection();
              var e8 = c.textContent.length, f2 = Math.min(d.start, e8);
              d = void 0 === d.end ? f2 : Math.min(d.end, e8);
              !a7.extend && f2 > d && (e8 = d, d = f2, f2 = e8);
              e8 = Ke(c, f2);
              var g = Ke(
                c,
                d
              );
              e8 && g && (1 !== a7.rangeCount || a7.anchorNode !== e8.node || a7.anchorOffset !== e8.offset || a7.focusNode !== g.node || a7.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e8.node, e8.offset), a7.removeAllRanges(), f2 > d ? (a7.addRange(b), a7.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a7.addRange(b)));
            }
          }
          b = [];
          for (a7 = c; a7 = a7.parentNode; )
            1 === a7.nodeType && b.push({ element: a7, left: a7.scrollLeft, top: a7.scrollTop });
          "function" === typeof c.focus && c.focus();
          for (c = 0; c < b.length; c++)
            a7 = b[c], a7.element.scrollLeft = a7.left, a7.element.scrollTop = a7.top;
        }
      }
      var Pe = ia && "documentMode" in document && 11 >= document.documentMode;
      var Qe = null;
      var Re = null;
      var Se = null;
      var Te = false;
      function Ue(a7, b, c) {
        var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
        Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a7.push({ event: b, listeners: d }), b.target = Qe)));
      }
      function Ve(a7, b) {
        var c = {};
        c[a7.toLowerCase()] = b.toLowerCase();
        c["Webkit" + a7] = "webkit" + b;
        c["Moz" + a7] = "moz" + b;
        return c;
      }
      var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") };
      var Xe = {};
      var Ye = {};
      ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
      function Ze(a7) {
        if (Xe[a7])
          return Xe[a7];
        if (!We[a7])
          return a7;
        var b = We[a7], c;
        for (c in b)
          if (b.hasOwnProperty(c) && c in Ye)
            return Xe[a7] = b[c];
        return a7;
      }
      var $e = Ze("animationend");
      var af = Ze("animationiteration");
      var bf = Ze("animationstart");
      var cf = Ze("transitionend");
      var df = /* @__PURE__ */ new Map();
      var ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
      function ff(a7, b) {
        df.set(a7, b);
        fa(b, [a7]);
      }
      for (gf = 0; gf < ef.length; gf++) {
        hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
        ff(jf, "on" + kf);
      }
      var hf;
      var jf;
      var kf;
      var gf;
      ff($e, "onAnimationEnd");
      ff(af, "onAnimationIteration");
      ff(bf, "onAnimationStart");
      ff("dblclick", "onDoubleClick");
      ff("focusin", "onFocus");
      ff("focusout", "onBlur");
      ff(cf, "onTransitionEnd");
      ha("onMouseEnter", ["mouseout", "mouseover"]);
      ha("onMouseLeave", ["mouseout", "mouseover"]);
      ha("onPointerEnter", ["pointerout", "pointerover"]);
      ha("onPointerLeave", ["pointerout", "pointerover"]);
      fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
      fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
      fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
      fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
      var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
      var mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
      function nf(a7, b, c) {
        var d = a7.type || "unknown-event";
        a7.currentTarget = c;
        Ub(d, b, void 0, a7);
        a7.currentTarget = null;
      }
      function se(a7, b) {
        b = 0 !== (b & 4);
        for (var c = 0; c < a7.length; c++) {
          var d = a7[c], e8 = d.event;
          d = d.listeners;
          a: {
            var f2 = void 0;
            if (b)
              for (var g = d.length - 1; 0 <= g; g--) {
                var h = d[g], k = h.instance, l = h.currentTarget;
                h = h.listener;
                if (k !== f2 && e8.isPropagationStopped())
                  break a;
                nf(e8, h, l);
                f2 = k;
              }
            else
              for (g = 0; g < d.length; g++) {
                h = d[g];
                k = h.instance;
                l = h.currentTarget;
                h = h.listener;
                if (k !== f2 && e8.isPropagationStopped())
                  break a;
                nf(e8, h, l);
                f2 = k;
              }
          }
        }
        if (Qb)
          throw a7 = Rb, Qb = false, Rb = null, a7;
      }
      function D(a7, b) {
        var c = b[of];
        void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
        var d = a7 + "__bubble";
        c.has(d) || (pf(b, a7, 2, false), c.add(d));
      }
      function qf(a7, b, c) {
        var d = 0;
        b && (d |= 4);
        pf(c, a7, d, b);
      }
      var rf = "_reactListening" + Math.random().toString(36).slice(2);
      function sf(a7) {
        if (!a7[rf]) {
          a7[rf] = true;
          da.forEach(function(b2) {
            "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a7), qf(b2, true, a7));
          });
          var b = 9 === a7.nodeType ? a7 : a7.ownerDocument;
          null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
        }
      }
      function pf(a7, b, c, d) {
        switch (jd(b)) {
          case 1:
            var e8 = ed;
            break;
          case 4:
            e8 = gd;
            break;
          default:
            e8 = fd;
        }
        c = e8.bind(null, b, c, a7);
        e8 = void 0;
        !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e8 = true);
        d ? void 0 !== e8 ? a7.addEventListener(b, c, { capture: true, passive: e8 }) : a7.addEventListener(b, c, true) : void 0 !== e8 ? a7.addEventListener(b, c, { passive: e8 }) : a7.addEventListener(b, c, false);
      }
      function hd(a7, b, c, d, e8) {
        var f2 = d;
        if (0 === (b & 1) && 0 === (b & 2) && null !== d)
          a:
            for (; ; ) {
              if (null === d)
                return;
              var g = d.tag;
              if (3 === g || 4 === g) {
                var h = d.stateNode.containerInfo;
                if (h === e8 || 8 === h.nodeType && h.parentNode === e8)
                  break;
                if (4 === g)
                  for (g = d.return; null !== g; ) {
                    var k = g.tag;
                    if (3 === k || 4 === k) {
                      if (k = g.stateNode.containerInfo, k === e8 || 8 === k.nodeType && k.parentNode === e8)
                        return;
                    }
                    g = g.return;
                  }
                for (; null !== h; ) {
                  g = Wc(h);
                  if (null === g)
                    return;
                  k = g.tag;
                  if (5 === k || 6 === k) {
                    d = f2 = g;
                    continue a;
                  }
                  h = h.parentNode;
                }
              }
              d = d.return;
            }
        Jb(function() {
          var d2 = f2, e9 = xb(c), g2 = [];
          a: {
            var h2 = df.get(a7);
            if (void 0 !== h2) {
              var k2 = td, n3 = a7;
              switch (a7) {
                case "keypress":
                  if (0 === od(c))
                    break a;
                case "keydown":
                case "keyup":
                  k2 = Rd;
                  break;
                case "focusin":
                  n3 = "focus";
                  k2 = Fd;
                  break;
                case "focusout":
                  n3 = "blur";
                  k2 = Fd;
                  break;
                case "beforeblur":
                case "afterblur":
                  k2 = Fd;
                  break;
                case "click":
                  if (2 === c.button)
                    break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  k2 = Bd;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  k2 = Dd;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  k2 = Vd;
                  break;
                case $e:
                case af:
                case bf:
                  k2 = Hd;
                  break;
                case cf:
                  k2 = Xd;
                  break;
                case "scroll":
                  k2 = vd;
                  break;
                case "wheel":
                  k2 = Zd;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  k2 = Jd;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  k2 = Td;
              }
              var t2 = 0 !== (b & 4), J = !t2 && "scroll" === a7, x = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
              t2 = [];
              for (var w = d2, u; null !== w; ) {
                u = w;
                var F = u.stateNode;
                5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t2.push(tf(w, F, u))));
                if (J)
                  break;
                w = w.return;
              }
              0 < t2.length && (h2 = new k2(h2, n3, null, c, e9), g2.push({ event: h2, listeners: t2 }));
            }
          }
          if (0 === (b & 7)) {
            a: {
              h2 = "mouseover" === a7 || "pointerover" === a7;
              k2 = "mouseout" === a7 || "pointerout" === a7;
              if (h2 && c !== wb && (n3 = c.relatedTarget || c.fromElement) && (Wc(n3) || n3[uf]))
                break a;
              if (k2 || h2) {
                h2 = e9.window === e9 ? e9 : (h2 = e9.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
                if (k2) {
                  if (n3 = c.relatedTarget || c.toElement, k2 = d2, n3 = n3 ? Wc(n3) : null, null !== n3 && (J = Vb(n3), n3 !== J || 5 !== n3.tag && 6 !== n3.tag))
                    n3 = null;
                } else
                  k2 = null, n3 = d2;
                if (k2 !== n3) {
                  t2 = Bd;
                  F = "onMouseLeave";
                  x = "onMouseEnter";
                  w = "mouse";
                  if ("pointerout" === a7 || "pointerover" === a7)
                    t2 = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
                  J = null == k2 ? h2 : ue(k2);
                  u = null == n3 ? h2 : ue(n3);
                  h2 = new t2(F, w + "leave", k2, c, e9);
                  h2.target = J;
                  h2.relatedTarget = u;
                  F = null;
                  Wc(e9) === d2 && (t2 = new t2(x, w + "enter", n3, c, e9), t2.target = u, t2.relatedTarget = J, F = t2);
                  J = F;
                  if (k2 && n3)
                    b: {
                      t2 = k2;
                      x = n3;
                      w = 0;
                      for (u = t2; u; u = vf(u))
                        w++;
                      u = 0;
                      for (F = x; F; F = vf(F))
                        u++;
                      for (; 0 < w - u; )
                        t2 = vf(t2), w--;
                      for (; 0 < u - w; )
                        x = vf(x), u--;
                      for (; w--; ) {
                        if (t2 === x || null !== x && t2 === x.alternate)
                          break b;
                        t2 = vf(t2);
                        x = vf(x);
                      }
                      t2 = null;
                    }
                  else
                    t2 = null;
                  null !== k2 && wf(g2, h2, k2, t2, false);
                  null !== n3 && null !== J && wf(g2, J, n3, t2, true);
                }
              }
            }
            a: {
              h2 = d2 ? ue(d2) : window;
              k2 = h2.nodeName && h2.nodeName.toLowerCase();
              if ("select" === k2 || "input" === k2 && "file" === h2.type)
                var na = ve;
              else if (me(h2))
                if (we)
                  na = Fe;
                else {
                  na = De;
                  var xa = Ce;
                }
              else
                (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
              if (na && (na = na(a7, d2))) {
                ne(g2, na, c, e9);
                break a;
              }
              xa && xa(a7, h2, d2);
              "focusout" === a7 && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
            }
            xa = d2 ? ue(d2) : window;
            switch (a7) {
              case "focusin":
                if (me(xa) || "true" === xa.contentEditable)
                  Qe = xa, Re = d2, Se = null;
                break;
              case "focusout":
                Se = Re = Qe = null;
                break;
              case "mousedown":
                Te = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                Te = false;
                Ue(g2, c, e9);
                break;
              case "selectionchange":
                if (Pe)
                  break;
              case "keydown":
              case "keyup":
                Ue(g2, c, e9);
            }
            var $a;
            if (ae)
              b: {
                switch (a7) {
                  case "compositionstart":
                    var ba = "onCompositionStart";
                    break b;
                  case "compositionend":
                    ba = "onCompositionEnd";
                    break b;
                  case "compositionupdate":
                    ba = "onCompositionUpdate";
                    break b;
                }
                ba = void 0;
              }
            else
              ie ? ge(a7, c) && (ba = "onCompositionEnd") : "keydown" === a7 && 229 === c.keyCode && (ba = "onCompositionStart");
            ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e9, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a7, null, c, e9), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
            if ($a = ce ? je(a7, c) : ke(a7, c))
              d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e9 = new Ld("onBeforeInput", "beforeinput", null, c, e9), g2.push({ event: e9, listeners: d2 }), e9.data = $a);
          }
          se(g2, b);
        });
      }
      function tf(a7, b, c) {
        return { instance: a7, listener: b, currentTarget: c };
      }
      function oe(a7, b) {
        for (var c = b + "Capture", d = []; null !== a7; ) {
          var e8 = a7, f2 = e8.stateNode;
          5 === e8.tag && null !== f2 && (e8 = f2, f2 = Kb(a7, c), null != f2 && d.unshift(tf(a7, f2, e8)), f2 = Kb(a7, b), null != f2 && d.push(tf(a7, f2, e8)));
          a7 = a7.return;
        }
        return d;
      }
      function vf(a7) {
        if (null === a7)
          return null;
        do
          a7 = a7.return;
        while (a7 && 5 !== a7.tag);
        return a7 ? a7 : null;
      }
      function wf(a7, b, c, d, e8) {
        for (var f2 = b._reactName, g = []; null !== c && c !== d; ) {
          var h = c, k = h.alternate, l = h.stateNode;
          if (null !== k && k === d)
            break;
          5 === h.tag && null !== l && (h = l, e8 ? (k = Kb(c, f2), null != k && g.unshift(tf(c, k, h))) : e8 || (k = Kb(c, f2), null != k && g.push(tf(c, k, h))));
          c = c.return;
        }
        0 !== g.length && a7.push({ event: b, listeners: g });
      }
      var xf = /\r\n?/g;
      var yf = /\u0000|\uFFFD/g;
      function zf(a7) {
        return ("string" === typeof a7 ? a7 : "" + a7).replace(xf, "\n").replace(yf, "");
      }
      function Af(a7, b, c) {
        b = zf(b);
        if (zf(a7) !== b && c)
          throw Error(p2(425));
      }
      function Bf() {
      }
      var Cf = null;
      var Df = null;
      function Ef(a7, b) {
        return "textarea" === a7 || "noscript" === a7 || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
      }
      var Ff = "function" === typeof setTimeout ? setTimeout : void 0;
      var Gf = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var Hf = "function" === typeof Promise ? Promise : void 0;
      var Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a7) {
        return Hf.resolve(null).then(a7).catch(If);
      } : Ff;
      function If(a7) {
        setTimeout(function() {
          throw a7;
        });
      }
      function Kf(a7, b) {
        var c = b, d = 0;
        do {
          var e8 = c.nextSibling;
          a7.removeChild(c);
          if (e8 && 8 === e8.nodeType)
            if (c = e8.data, "/$" === c) {
              if (0 === d) {
                a7.removeChild(e8);
                bd(b);
                return;
              }
              d--;
            } else
              "$" !== c && "$?" !== c && "$!" !== c || d++;
          c = e8;
        } while (c);
        bd(b);
      }
      function Lf(a7) {
        for (; null != a7; a7 = a7.nextSibling) {
          var b = a7.nodeType;
          if (1 === b || 3 === b)
            break;
          if (8 === b) {
            b = a7.data;
            if ("$" === b || "$!" === b || "$?" === b)
              break;
            if ("/$" === b)
              return null;
          }
        }
        return a7;
      }
      function Mf(a7) {
        a7 = a7.previousSibling;
        for (var b = 0; a7; ) {
          if (8 === a7.nodeType) {
            var c = a7.data;
            if ("$" === c || "$!" === c || "$?" === c) {
              if (0 === b)
                return a7;
              b--;
            } else
              "/$" === c && b++;
          }
          a7 = a7.previousSibling;
        }
        return null;
      }
      var Nf = Math.random().toString(36).slice(2);
      var Of = "__reactFiber$" + Nf;
      var Pf = "__reactProps$" + Nf;
      var uf = "__reactContainer$" + Nf;
      var of = "__reactEvents$" + Nf;
      var Qf = "__reactListeners$" + Nf;
      var Rf = "__reactHandles$" + Nf;
      function Wc(a7) {
        var b = a7[Of];
        if (b)
          return b;
        for (var c = a7.parentNode; c; ) {
          if (b = c[uf] || c[Of]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child)
              for (a7 = Mf(a7); null !== a7; ) {
                if (c = a7[Of])
                  return c;
                a7 = Mf(a7);
              }
            return b;
          }
          a7 = c;
          c = a7.parentNode;
        }
        return null;
      }
      function Cb(a7) {
        a7 = a7[Of] || a7[uf];
        return !a7 || 5 !== a7.tag && 6 !== a7.tag && 13 !== a7.tag && 3 !== a7.tag ? null : a7;
      }
      function ue(a7) {
        if (5 === a7.tag || 6 === a7.tag)
          return a7.stateNode;
        throw Error(p2(33));
      }
      function Db(a7) {
        return a7[Pf] || null;
      }
      var Sf = [];
      var Tf = -1;
      function Uf(a7) {
        return { current: a7 };
      }
      function E(a7) {
        0 > Tf || (a7.current = Sf[Tf], Sf[Tf] = null, Tf--);
      }
      function G(a7, b) {
        Tf++;
        Sf[Tf] = a7.current;
        a7.current = b;
      }
      var Vf = {};
      var H = Uf(Vf);
      var Wf = Uf(false);
      var Xf = Vf;
      function Yf(a7, b) {
        var c = a7.type.contextTypes;
        if (!c)
          return Vf;
        var d = a7.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === b)
          return d.__reactInternalMemoizedMaskedChildContext;
        var e8 = {}, f2;
        for (f2 in c)
          e8[f2] = b[f2];
        d && (a7 = a7.stateNode, a7.__reactInternalMemoizedUnmaskedChildContext = b, a7.__reactInternalMemoizedMaskedChildContext = e8);
        return e8;
      }
      function Zf(a7) {
        a7 = a7.childContextTypes;
        return null !== a7 && void 0 !== a7;
      }
      function $f() {
        E(Wf);
        E(H);
      }
      function ag(a7, b, c) {
        if (H.current !== Vf)
          throw Error(p2(168));
        G(H, b);
        G(Wf, c);
      }
      function bg(a7, b, c) {
        var d = a7.stateNode;
        b = b.childContextTypes;
        if ("function" !== typeof d.getChildContext)
          return c;
        d = d.getChildContext();
        for (var e8 in d)
          if (!(e8 in b))
            throw Error(p2(108, Ra(a7) || "Unknown", e8));
        return A({}, c, d);
      }
      function cg(a7) {
        a7 = (a7 = a7.stateNode) && a7.__reactInternalMemoizedMergedChildContext || Vf;
        Xf = H.current;
        G(H, a7);
        G(Wf, Wf.current);
        return true;
      }
      function dg(a7, b, c) {
        var d = a7.stateNode;
        if (!d)
          throw Error(p2(169));
        c ? (a7 = bg(a7, b, Xf), d.__reactInternalMemoizedMergedChildContext = a7, E(Wf), E(H), G(H, a7)) : E(Wf);
        G(Wf, c);
      }
      var eg = null;
      var fg = false;
      var gg = false;
      function hg(a7) {
        null === eg ? eg = [a7] : eg.push(a7);
      }
      function ig(a7) {
        fg = true;
        hg(a7);
      }
      function jg() {
        if (!gg && null !== eg) {
          gg = true;
          var a7 = 0, b = C;
          try {
            var c = eg;
            for (C = 1; a7 < c.length; a7++) {
              var d = c[a7];
              do
                d = d(true);
              while (null !== d);
            }
            eg = null;
            fg = false;
          } catch (e8) {
            throw null !== eg && (eg = eg.slice(a7 + 1)), ac(fc, jg), e8;
          } finally {
            C = b, gg = false;
          }
        }
        return null;
      }
      var kg = [];
      var lg = 0;
      var mg = null;
      var ng = 0;
      var og = [];
      var pg = 0;
      var qg = null;
      var rg = 1;
      var sg = "";
      function tg(a7, b) {
        kg[lg++] = ng;
        kg[lg++] = mg;
        mg = a7;
        ng = b;
      }
      function ug(a7, b, c) {
        og[pg++] = rg;
        og[pg++] = sg;
        og[pg++] = qg;
        qg = a7;
        var d = rg;
        a7 = sg;
        var e8 = 32 - oc(d) - 1;
        d &= ~(1 << e8);
        c += 1;
        var f2 = 32 - oc(b) + e8;
        if (30 < f2) {
          var g = e8 - e8 % 5;
          f2 = (d & (1 << g) - 1).toString(32);
          d >>= g;
          e8 -= g;
          rg = 1 << 32 - oc(b) + e8 | c << e8 | d;
          sg = f2 + a7;
        } else
          rg = 1 << f2 | c << e8 | d, sg = a7;
      }
      function vg(a7) {
        null !== a7.return && (tg(a7, 1), ug(a7, 1, 0));
      }
      function wg(a7) {
        for (; a7 === mg; )
          mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
        for (; a7 === qg; )
          qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
      }
      var xg = null;
      var yg = null;
      var I = false;
      var zg = null;
      function Ag(a7, b) {
        var c = Bg(5, null, null, 0);
        c.elementType = "DELETED";
        c.stateNode = b;
        c.return = a7;
        b = a7.deletions;
        null === b ? (a7.deletions = [c], a7.flags |= 16) : b.push(c);
      }
      function Cg(a7, b) {
        switch (a7.tag) {
          case 5:
            var c = a7.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a7.stateNode = b, xg = a7, yg = Lf(b.firstChild), true) : false;
          case 6:
            return b = "" === a7.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a7.stateNode = b, xg = a7, yg = null, true) : false;
          case 13:
            return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a7.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a7, a7.child = c, xg = a7, yg = null, true) : false;
          default:
            return false;
        }
      }
      function Dg(a7) {
        return 0 !== (a7.mode & 1) && 0 === (a7.flags & 128);
      }
      function Eg(a7) {
        if (I) {
          var b = yg;
          if (b) {
            var c = b;
            if (!Cg(a7, b)) {
              if (Dg(a7))
                throw Error(p2(418));
              b = Lf(c.nextSibling);
              var d = xg;
              b && Cg(a7, b) ? Ag(d, c) : (a7.flags = a7.flags & -4097 | 2, I = false, xg = a7);
            }
          } else {
            if (Dg(a7))
              throw Error(p2(418));
            a7.flags = a7.flags & -4097 | 2;
            I = false;
            xg = a7;
          }
        }
      }
      function Fg(a7) {
        for (a7 = a7.return; null !== a7 && 5 !== a7.tag && 3 !== a7.tag && 13 !== a7.tag; )
          a7 = a7.return;
        xg = a7;
      }
      function Gg(a7) {
        if (a7 !== xg)
          return false;
        if (!I)
          return Fg(a7), I = true, false;
        var b;
        (b = 3 !== a7.tag) && !(b = 5 !== a7.tag) && (b = a7.type, b = "head" !== b && "body" !== b && !Ef(a7.type, a7.memoizedProps));
        if (b && (b = yg)) {
          if (Dg(a7))
            throw Hg(), Error(p2(418));
          for (; b; )
            Ag(a7, b), b = Lf(b.nextSibling);
        }
        Fg(a7);
        if (13 === a7.tag) {
          a7 = a7.memoizedState;
          a7 = null !== a7 ? a7.dehydrated : null;
          if (!a7)
            throw Error(p2(317));
          a: {
            a7 = a7.nextSibling;
            for (b = 0; a7; ) {
              if (8 === a7.nodeType) {
                var c = a7.data;
                if ("/$" === c) {
                  if (0 === b) {
                    yg = Lf(a7.nextSibling);
                    break a;
                  }
                  b--;
                } else
                  "$" !== c && "$!" !== c && "$?" !== c || b++;
              }
              a7 = a7.nextSibling;
            }
            yg = null;
          }
        } else
          yg = xg ? Lf(a7.stateNode.nextSibling) : null;
        return true;
      }
      function Hg() {
        for (var a7 = yg; a7; )
          a7 = Lf(a7.nextSibling);
      }
      function Ig() {
        yg = xg = null;
        I = false;
      }
      function Jg(a7) {
        null === zg ? zg = [a7] : zg.push(a7);
      }
      var Kg = ua.ReactCurrentBatchConfig;
      function Lg(a7, b, c) {
        a7 = c.ref;
        if (null !== a7 && "function" !== typeof a7 && "object" !== typeof a7) {
          if (c._owner) {
            c = c._owner;
            if (c) {
              if (1 !== c.tag)
                throw Error(p2(309));
              var d = c.stateNode;
            }
            if (!d)
              throw Error(p2(147, a7));
            var e8 = d, f2 = "" + a7;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2)
              return b.ref;
            b = function(a8) {
              var b2 = e8.refs;
              null === a8 ? delete b2[f2] : b2[f2] = a8;
            };
            b._stringRef = f2;
            return b;
          }
          if ("string" !== typeof a7)
            throw Error(p2(284));
          if (!c._owner)
            throw Error(p2(290, a7));
        }
        return a7;
      }
      function Mg(a7, b) {
        a7 = Object.prototype.toString.call(b);
        throw Error(p2(31, "[object Object]" === a7 ? "object with keys {" + Object.keys(b).join(", ") + "}" : a7));
      }
      function Ng(a7) {
        var b = a7._init;
        return b(a7._payload);
      }
      function Og(a7) {
        function b(b2, c2) {
          if (a7) {
            var d2 = b2.deletions;
            null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
          }
        }
        function c(c2, d2) {
          if (!a7)
            return null;
          for (; null !== d2; )
            b(c2, d2), d2 = d2.sibling;
          return null;
        }
        function d(a8, b2) {
          for (a8 = /* @__PURE__ */ new Map(); null !== b2; )
            null !== b2.key ? a8.set(b2.key, b2) : a8.set(b2.index, b2), b2 = b2.sibling;
          return a8;
        }
        function e8(a8, b2) {
          a8 = Pg(a8, b2);
          a8.index = 0;
          a8.sibling = null;
          return a8;
        }
        function f2(b2, c2, d2) {
          b2.index = d2;
          if (!a7)
            return b2.flags |= 1048576, c2;
          d2 = b2.alternate;
          if (null !== d2)
            return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
          b2.flags |= 2;
          return c2;
        }
        function g(b2) {
          a7 && null === b2.alternate && (b2.flags |= 2);
          return b2;
        }
        function h(a8, b2, c2, d2) {
          if (null === b2 || 6 !== b2.tag)
            return b2 = Qg(c2, a8.mode, d2), b2.return = a8, b2;
          b2 = e8(b2, c2);
          b2.return = a8;
          return b2;
        }
        function k(a8, b2, c2, d2) {
          var f3 = c2.type;
          if (f3 === ya)
            return m2(a8, b2, c2.props.children, d2, c2.key);
          if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type))
            return d2 = e8(b2, c2.props), d2.ref = Lg(a8, b2, c2), d2.return = a8, d2;
          d2 = Rg(c2.type, c2.key, c2.props, null, a8.mode, d2);
          d2.ref = Lg(a8, b2, c2);
          d2.return = a8;
          return d2;
        }
        function l(a8, b2, c2, d2) {
          if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation)
            return b2 = Sg(c2, a8.mode, d2), b2.return = a8, b2;
          b2 = e8(b2, c2.children || []);
          b2.return = a8;
          return b2;
        }
        function m2(a8, b2, c2, d2, f3) {
          if (null === b2 || 7 !== b2.tag)
            return b2 = Tg(c2, a8.mode, d2, f3), b2.return = a8, b2;
          b2 = e8(b2, c2);
          b2.return = a8;
          return b2;
        }
        function q(a8, b2, c2) {
          if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2)
            return b2 = Qg("" + b2, a8.mode, c2), b2.return = a8, b2;
          if ("object" === typeof b2 && null !== b2) {
            switch (b2.$$typeof) {
              case va:
                return c2 = Rg(b2.type, b2.key, b2.props, null, a8.mode, c2), c2.ref = Lg(a8, null, b2), c2.return = a8, c2;
              case wa:
                return b2 = Sg(b2, a8.mode, c2), b2.return = a8, b2;
              case Ha:
                var d2 = b2._init;
                return q(a8, d2(b2._payload), c2);
            }
            if (eb(b2) || Ka(b2))
              return b2 = Tg(b2, a8.mode, c2, null), b2.return = a8, b2;
            Mg(a8, b2);
          }
          return null;
        }
        function r2(a8, b2, c2, d2) {
          var e9 = null !== b2 ? b2.key : null;
          if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2)
            return null !== e9 ? null : h(a8, b2, "" + c2, d2);
          if ("object" === typeof c2 && null !== c2) {
            switch (c2.$$typeof) {
              case va:
                return c2.key === e9 ? k(a8, b2, c2, d2) : null;
              case wa:
                return c2.key === e9 ? l(a8, b2, c2, d2) : null;
              case Ha:
                return e9 = c2._init, r2(
                  a8,
                  b2,
                  e9(c2._payload),
                  d2
                );
            }
            if (eb(c2) || Ka(c2))
              return null !== e9 ? null : m2(a8, b2, c2, d2, null);
            Mg(a8, c2);
          }
          return null;
        }
        function y(a8, b2, c2, d2, e9) {
          if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2)
            return a8 = a8.get(c2) || null, h(b2, a8, "" + d2, e9);
          if ("object" === typeof d2 && null !== d2) {
            switch (d2.$$typeof) {
              case va:
                return a8 = a8.get(null === d2.key ? c2 : d2.key) || null, k(b2, a8, d2, e9);
              case wa:
                return a8 = a8.get(null === d2.key ? c2 : d2.key) || null, l(b2, a8, d2, e9);
              case Ha:
                var f3 = d2._init;
                return y(a8, b2, c2, f3(d2._payload), e9);
            }
            if (eb(d2) || Ka(d2))
              return a8 = a8.get(c2) || null, m2(b2, a8, d2, e9, null);
            Mg(b2, d2);
          }
          return null;
        }
        function n3(e9, g2, h2, k2) {
          for (var l2 = null, m3 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
            u.index > w ? (x = u, u = null) : x = u.sibling;
            var n4 = r2(e9, u, h2[w], k2);
            if (null === n4) {
              null === u && (u = x);
              break;
            }
            a7 && u && null === n4.alternate && b(e9, u);
            g2 = f2(n4, g2, w);
            null === m3 ? l2 = n4 : m3.sibling = n4;
            m3 = n4;
            u = x;
          }
          if (w === h2.length)
            return c(e9, u), I && tg(e9, w), l2;
          if (null === u) {
            for (; w < h2.length; w++)
              u = q(e9, h2[w], k2), null !== u && (g2 = f2(u, g2, w), null === m3 ? l2 = u : m3.sibling = u, m3 = u);
            I && tg(e9, w);
            return l2;
          }
          for (u = d(e9, u); w < h2.length; w++)
            x = y(u, e9, w, h2[w], k2), null !== x && (a7 && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f2(x, g2, w), null === m3 ? l2 = x : m3.sibling = x, m3 = x);
          a7 && u.forEach(function(a8) {
            return b(e9, a8);
          });
          I && tg(e9, w);
          return l2;
        }
        function t2(e9, g2, h2, k2) {
          var l2 = Ka(h2);
          if ("function" !== typeof l2)
            throw Error(p2(150));
          h2 = l2.call(h2);
          if (null == h2)
            throw Error(p2(151));
          for (var u = l2 = null, m3 = g2, w = g2 = 0, x = null, n4 = h2.next(); null !== m3 && !n4.done; w++, n4 = h2.next()) {
            m3.index > w ? (x = m3, m3 = null) : x = m3.sibling;
            var t3 = r2(e9, m3, n4.value, k2);
            if (null === t3) {
              null === m3 && (m3 = x);
              break;
            }
            a7 && m3 && null === t3.alternate && b(e9, m3);
            g2 = f2(t3, g2, w);
            null === u ? l2 = t3 : u.sibling = t3;
            u = t3;
            m3 = x;
          }
          if (n4.done)
            return c(
              e9,
              m3
            ), I && tg(e9, w), l2;
          if (null === m3) {
            for (; !n4.done; w++, n4 = h2.next())
              n4 = q(e9, n4.value, k2), null !== n4 && (g2 = f2(n4, g2, w), null === u ? l2 = n4 : u.sibling = n4, u = n4);
            I && tg(e9, w);
            return l2;
          }
          for (m3 = d(e9, m3); !n4.done; w++, n4 = h2.next())
            n4 = y(m3, e9, w, n4.value, k2), null !== n4 && (a7 && null !== n4.alternate && m3.delete(null === n4.key ? w : n4.key), g2 = f2(n4, g2, w), null === u ? l2 = n4 : u.sibling = n4, u = n4);
          a7 && m3.forEach(function(a8) {
            return b(e9, a8);
          });
          I && tg(e9, w);
          return l2;
        }
        function J(a8, d2, f3, h2) {
          "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
          if ("object" === typeof f3 && null !== f3) {
            switch (f3.$$typeof) {
              case va:
                a: {
                  for (var k2 = f3.key, l2 = d2; null !== l2; ) {
                    if (l2.key === k2) {
                      k2 = f3.type;
                      if (k2 === ya) {
                        if (7 === l2.tag) {
                          c(a8, l2.sibling);
                          d2 = e8(l2, f3.props.children);
                          d2.return = a8;
                          a8 = d2;
                          break a;
                        }
                      } else if (l2.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l2.type) {
                        c(a8, l2.sibling);
                        d2 = e8(l2, f3.props);
                        d2.ref = Lg(a8, l2, f3);
                        d2.return = a8;
                        a8 = d2;
                        break a;
                      }
                      c(a8, l2);
                      break;
                    } else
                      b(a8, l2);
                    l2 = l2.sibling;
                  }
                  f3.type === ya ? (d2 = Tg(f3.props.children, a8.mode, h2, f3.key), d2.return = a8, a8 = d2) : (h2 = Rg(f3.type, f3.key, f3.props, null, a8.mode, h2), h2.ref = Lg(a8, d2, f3), h2.return = a8, a8 = h2);
                }
                return g(a8);
              case wa:
                a: {
                  for (l2 = f3.key; null !== d2; ) {
                    if (d2.key === l2)
                      if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                        c(a8, d2.sibling);
                        d2 = e8(d2, f3.children || []);
                        d2.return = a8;
                        a8 = d2;
                        break a;
                      } else {
                        c(a8, d2);
                        break;
                      }
                    else
                      b(a8, d2);
                    d2 = d2.sibling;
                  }
                  d2 = Sg(f3, a8.mode, h2);
                  d2.return = a8;
                  a8 = d2;
                }
                return g(a8);
              case Ha:
                return l2 = f3._init, J(a8, d2, l2(f3._payload), h2);
            }
            if (eb(f3))
              return n3(a8, d2, f3, h2);
            if (Ka(f3))
              return t2(a8, d2, f3, h2);
            Mg(a8, f3);
          }
          return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c(a8, d2.sibling), d2 = e8(d2, f3), d2.return = a8, a8 = d2) : (c(a8, d2), d2 = Qg(f3, a8.mode, h2), d2.return = a8, a8 = d2), g(a8)) : c(a8, d2);
        }
        return J;
      }
      var Ug = Og(true);
      var Vg = Og(false);
      var Wg = Uf(null);
      var Xg = null;
      var Yg = null;
      var Zg = null;
      function $g() {
        Zg = Yg = Xg = null;
      }
      function ah(a7) {
        var b = Wg.current;
        E(Wg);
        a7._currentValue = b;
      }
      function bh(a7, b, c) {
        for (; null !== a7; ) {
          var d = a7.alternate;
          (a7.childLanes & b) !== b ? (a7.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
          if (a7 === c)
            break;
          a7 = a7.return;
        }
      }
      function ch(a7, b) {
        Xg = a7;
        Zg = Yg = null;
        a7 = a7.dependencies;
        null !== a7 && null !== a7.firstContext && (0 !== (a7.lanes & b) && (dh = true), a7.firstContext = null);
      }
      function eh(a7) {
        var b = a7._currentValue;
        if (Zg !== a7)
          if (a7 = { context: a7, memoizedValue: b, next: null }, null === Yg) {
            if (null === Xg)
              throw Error(p2(308));
            Yg = a7;
            Xg.dependencies = { lanes: 0, firstContext: a7 };
          } else
            Yg = Yg.next = a7;
        return b;
      }
      var fh = null;
      function gh(a7) {
        null === fh ? fh = [a7] : fh.push(a7);
      }
      function hh(a7, b, c, d) {
        var e8 = b.interleaved;
        null === e8 ? (c.next = c, gh(b)) : (c.next = e8.next, e8.next = c);
        b.interleaved = c;
        return ih(a7, d);
      }
      function ih(a7, b) {
        a7.lanes |= b;
        var c = a7.alternate;
        null !== c && (c.lanes |= b);
        c = a7;
        for (a7 = a7.return; null !== a7; )
          a7.childLanes |= b, c = a7.alternate, null !== c && (c.childLanes |= b), c = a7, a7 = a7.return;
        return 3 === c.tag ? c.stateNode : null;
      }
      var jh = false;
      function kh(a7) {
        a7.updateQueue = { baseState: a7.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
      }
      function lh(a7, b) {
        a7 = a7.updateQueue;
        b.updateQueue === a7 && (b.updateQueue = { baseState: a7.baseState, firstBaseUpdate: a7.firstBaseUpdate, lastBaseUpdate: a7.lastBaseUpdate, shared: a7.shared, effects: a7.effects });
      }
      function mh(a7, b) {
        return { eventTime: a7, lane: b, tag: 0, payload: null, callback: null, next: null };
      }
      function nh(a7, b, c) {
        var d = a7.updateQueue;
        if (null === d)
          return null;
        d = d.shared;
        if (0 !== (K & 2)) {
          var e8 = d.pending;
          null === e8 ? b.next = b : (b.next = e8.next, e8.next = b);
          d.pending = b;
          return ih(a7, c);
        }
        e8 = d.interleaved;
        null === e8 ? (b.next = b, gh(d)) : (b.next = e8.next, e8.next = b);
        d.interleaved = b;
        return ih(a7, c);
      }
      function oh(a7, b, c) {
        b = b.updateQueue;
        if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
          var d = b.lanes;
          d &= a7.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a7, c);
        }
      }
      function ph(a7, b) {
        var c = a7.updateQueue, d = a7.alternate;
        if (null !== d && (d = d.updateQueue, c === d)) {
          var e8 = null, f2 = null;
          c = c.firstBaseUpdate;
          if (null !== c) {
            do {
              var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
              null === f2 ? e8 = f2 = g : f2 = f2.next = g;
              c = c.next;
            } while (null !== c);
            null === f2 ? e8 = f2 = b : f2 = f2.next = b;
          } else
            e8 = f2 = b;
          c = { baseState: d.baseState, firstBaseUpdate: e8, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
          a7.updateQueue = c;
          return;
        }
        a7 = c.lastBaseUpdate;
        null === a7 ? c.firstBaseUpdate = b : a7.next = b;
        c.lastBaseUpdate = b;
      }
      function qh(a7, b, c, d) {
        var e8 = a7.updateQueue;
        jh = false;
        var f2 = e8.firstBaseUpdate, g = e8.lastBaseUpdate, h = e8.shared.pending;
        if (null !== h) {
          e8.shared.pending = null;
          var k = h, l = k.next;
          k.next = null;
          null === g ? f2 = l : g.next = l;
          g = k;
          var m2 = a7.alternate;
          null !== m2 && (m2 = m2.updateQueue, h = m2.lastBaseUpdate, h !== g && (null === h ? m2.firstBaseUpdate = l : h.next = l, m2.lastBaseUpdate = k));
        }
        if (null !== f2) {
          var q = e8.baseState;
          g = 0;
          m2 = l = k = null;
          h = f2;
          do {
            var r2 = h.lane, y = h.eventTime;
            if ((d & r2) === r2) {
              null !== m2 && (m2 = m2.next = {
                eventTime: y,
                lane: 0,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
              });
              a: {
                var n3 = a7, t2 = h;
                r2 = b;
                y = c;
                switch (t2.tag) {
                  case 1:
                    n3 = t2.payload;
                    if ("function" === typeof n3) {
                      q = n3.call(y, q, r2);
                      break a;
                    }
                    q = n3;
                    break a;
                  case 3:
                    n3.flags = n3.flags & -65537 | 128;
                  case 0:
                    n3 = t2.payload;
                    r2 = "function" === typeof n3 ? n3.call(y, q, r2) : n3;
                    if (null === r2 || void 0 === r2)
                      break a;
                    q = A({}, q, r2);
                    break a;
                  case 2:
                    jh = true;
                }
              }
              null !== h.callback && 0 !== h.lane && (a7.flags |= 64, r2 = e8.effects, null === r2 ? e8.effects = [h] : r2.push(h));
            } else
              y = { eventTime: y, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m2 ? (l = m2 = y, k = q) : m2 = m2.next = y, g |= r2;
            h = h.next;
            if (null === h)
              if (h = e8.shared.pending, null === h)
                break;
              else
                r2 = h, h = r2.next, r2.next = null, e8.lastBaseUpdate = r2, e8.shared.pending = null;
          } while (1);
          null === m2 && (k = q);
          e8.baseState = k;
          e8.firstBaseUpdate = l;
          e8.lastBaseUpdate = m2;
          b = e8.shared.interleaved;
          if (null !== b) {
            e8 = b;
            do
              g |= e8.lane, e8 = e8.next;
            while (e8 !== b);
          } else
            null === f2 && (e8.shared.lanes = 0);
          rh |= g;
          a7.lanes = g;
          a7.memoizedState = q;
        }
      }
      function sh(a7, b, c) {
        a7 = b.effects;
        b.effects = null;
        if (null !== a7)
          for (b = 0; b < a7.length; b++) {
            var d = a7[b], e8 = d.callback;
            if (null !== e8) {
              d.callback = null;
              d = c;
              if ("function" !== typeof e8)
                throw Error(p2(191, e8));
              e8.call(d);
            }
          }
      }
      var th = {};
      var uh = Uf(th);
      var vh = Uf(th);
      var wh = Uf(th);
      function xh(a7) {
        if (a7 === th)
          throw Error(p2(174));
        return a7;
      }
      function yh(a7, b) {
        G(wh, b);
        G(vh, a7);
        G(uh, th);
        a7 = b.nodeType;
        switch (a7) {
          case 9:
          case 11:
            b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
            break;
          default:
            a7 = 8 === a7 ? b.parentNode : b, b = a7.namespaceURI || null, a7 = a7.tagName, b = lb(b, a7);
        }
        E(uh);
        G(uh, b);
      }
      function zh() {
        E(uh);
        E(vh);
        E(wh);
      }
      function Ah(a7) {
        xh(wh.current);
        var b = xh(uh.current);
        var c = lb(b, a7.type);
        b !== c && (G(vh, a7), G(uh, c));
      }
      function Bh(a7) {
        vh.current === a7 && (E(uh), E(vh));
      }
      var L = Uf(0);
      function Ch(a7) {
        for (var b = a7; null !== b; ) {
          if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data))
              return b;
          } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.flags & 128))
              return b;
          } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
          }
          if (b === a7)
            break;
          for (; null === b.sibling; ) {
            if (null === b.return || b.return === a7)
              return null;
            b = b.return;
          }
          b.sibling.return = b.return;
          b = b.sibling;
        }
        return null;
      }
      var Dh = [];
      function Eh() {
        for (var a7 = 0; a7 < Dh.length; a7++)
          Dh[a7]._workInProgressVersionPrimary = null;
        Dh.length = 0;
      }
      var Fh = ua.ReactCurrentDispatcher;
      var Gh = ua.ReactCurrentBatchConfig;
      var Hh = 0;
      var M = null;
      var N = null;
      var O = null;
      var Ih = false;
      var Jh = false;
      var Kh = 0;
      var Lh = 0;
      function P() {
        throw Error(p2(321));
      }
      function Mh(a7, b) {
        if (null === b)
          return false;
        for (var c = 0; c < b.length && c < a7.length; c++)
          if (!He(a7[c], b[c]))
            return false;
        return true;
      }
      function Nh(a7, b, c, d, e8, f2) {
        Hh = f2;
        M = b;
        b.memoizedState = null;
        b.updateQueue = null;
        b.lanes = 0;
        Fh.current = null === a7 || null === a7.memoizedState ? Oh : Ph;
        a7 = c(d, e8);
        if (Jh) {
          f2 = 0;
          do {
            Jh = false;
            Kh = 0;
            if (25 <= f2)
              throw Error(p2(301));
            f2 += 1;
            O = N = null;
            b.updateQueue = null;
            Fh.current = Qh;
            a7 = c(d, e8);
          } while (Jh);
        }
        Fh.current = Rh;
        b = null !== N && null !== N.next;
        Hh = 0;
        O = N = M = null;
        Ih = false;
        if (b)
          throw Error(p2(300));
        return a7;
      }
      function Sh() {
        var a7 = 0 !== Kh;
        Kh = 0;
        return a7;
      }
      function Th() {
        var a7 = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
        null === O ? M.memoizedState = O = a7 : O = O.next = a7;
        return O;
      }
      function Uh() {
        if (null === N) {
          var a7 = M.alternate;
          a7 = null !== a7 ? a7.memoizedState : null;
        } else
          a7 = N.next;
        var b = null === O ? M.memoizedState : O.next;
        if (null !== b)
          O = b, N = a7;
        else {
          if (null === a7)
            throw Error(p2(310));
          N = a7;
          a7 = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
          null === O ? M.memoizedState = O = a7 : O = O.next = a7;
        }
        return O;
      }
      function Vh(a7, b) {
        return "function" === typeof b ? b(a7) : b;
      }
      function Wh(a7) {
        var b = Uh(), c = b.queue;
        if (null === c)
          throw Error(p2(311));
        c.lastRenderedReducer = a7;
        var d = N, e8 = d.baseQueue, f2 = c.pending;
        if (null !== f2) {
          if (null !== e8) {
            var g = e8.next;
            e8.next = f2.next;
            f2.next = g;
          }
          d.baseQueue = e8 = f2;
          c.pending = null;
        }
        if (null !== e8) {
          f2 = e8.next;
          d = d.baseState;
          var h = g = null, k = null, l = f2;
          do {
            var m2 = l.lane;
            if ((Hh & m2) === m2)
              null !== k && (k = k.next = { lane: 0, action: l.action, hasEagerState: l.hasEagerState, eagerState: l.eagerState, next: null }), d = l.hasEagerState ? l.eagerState : a7(d, l.action);
            else {
              var q = {
                lane: m2,
                action: l.action,
                hasEagerState: l.hasEagerState,
                eagerState: l.eagerState,
                next: null
              };
              null === k ? (h = k = q, g = d) : k = k.next = q;
              M.lanes |= m2;
              rh |= m2;
            }
            l = l.next;
          } while (null !== l && l !== f2);
          null === k ? g = d : k.next = h;
          He(d, b.memoizedState) || (dh = true);
          b.memoizedState = d;
          b.baseState = g;
          b.baseQueue = k;
          c.lastRenderedState = d;
        }
        a7 = c.interleaved;
        if (null !== a7) {
          e8 = a7;
          do
            f2 = e8.lane, M.lanes |= f2, rh |= f2, e8 = e8.next;
          while (e8 !== a7);
        } else
          null === e8 && (c.lanes = 0);
        return [b.memoizedState, c.dispatch];
      }
      function Xh(a7) {
        var b = Uh(), c = b.queue;
        if (null === c)
          throw Error(p2(311));
        c.lastRenderedReducer = a7;
        var d = c.dispatch, e8 = c.pending, f2 = b.memoizedState;
        if (null !== e8) {
          c.pending = null;
          var g = e8 = e8.next;
          do
            f2 = a7(f2, g.action), g = g.next;
          while (g !== e8);
          He(f2, b.memoizedState) || (dh = true);
          b.memoizedState = f2;
          null === b.baseQueue && (b.baseState = f2);
          c.lastRenderedState = f2;
        }
        return [f2, d];
      }
      function Yh() {
      }
      function Zh(a7, b) {
        var c = M, d = Uh(), e8 = b(), f2 = !He(d.memoizedState, e8);
        f2 && (d.memoizedState = e8, dh = true);
        d = d.queue;
        $h(ai.bind(null, c, d, a7), [a7]);
        if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
          c.flags |= 2048;
          bi(9, ci.bind(null, c, d, e8, b), void 0, null);
          if (null === Q)
            throw Error(p2(349));
          0 !== (Hh & 30) || di(c, b, e8);
        }
        return e8;
      }
      function di(a7, b, c) {
        a7.flags |= 16384;
        a7 = { getSnapshot: b, value: c };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a7]) : (c = b.stores, null === c ? b.stores = [a7] : c.push(a7));
      }
      function ci(a7, b, c, d) {
        b.value = c;
        b.getSnapshot = d;
        ei(b) && fi(a7);
      }
      function ai(a7, b, c) {
        return c(function() {
          ei(b) && fi(a7);
        });
      }
      function ei(a7) {
        var b = a7.getSnapshot;
        a7 = a7.value;
        try {
          var c = b();
          return !He(a7, c);
        } catch (d) {
          return true;
        }
      }
      function fi(a7) {
        var b = ih(a7, 1);
        null !== b && gi(b, a7, 1, -1);
      }
      function hi(a7) {
        var b = Th();
        "function" === typeof a7 && (a7 = a7());
        b.memoizedState = b.baseState = a7;
        a7 = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a7 };
        b.queue = a7;
        a7 = a7.dispatch = ii.bind(null, M, a7);
        return [b.memoizedState, a7];
      }
      function bi(a7, b, c, d) {
        a7 = { tag: a7, create: b, destroy: c, deps: d, next: null };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a7.next = a7) : (c = b.lastEffect, null === c ? b.lastEffect = a7.next = a7 : (d = c.next, c.next = a7, a7.next = d, b.lastEffect = a7));
        return a7;
      }
      function ji() {
        return Uh().memoizedState;
      }
      function ki(a7, b, c, d) {
        var e8 = Th();
        M.flags |= a7;
        e8.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
      }
      function li(a7, b, c, d) {
        var e8 = Uh();
        d = void 0 === d ? null : d;
        var f2 = void 0;
        if (null !== N) {
          var g = N.memoizedState;
          f2 = g.destroy;
          if (null !== d && Mh(d, g.deps)) {
            e8.memoizedState = bi(b, c, f2, d);
            return;
          }
        }
        M.flags |= a7;
        e8.memoizedState = bi(1 | b, c, f2, d);
      }
      function mi(a7, b) {
        return ki(8390656, 8, a7, b);
      }
      function $h(a7, b) {
        return li(2048, 8, a7, b);
      }
      function ni(a7, b) {
        return li(4, 2, a7, b);
      }
      function oi(a7, b) {
        return li(4, 4, a7, b);
      }
      function pi(a7, b) {
        if ("function" === typeof b)
          return a7 = a7(), b(a7), function() {
            b(null);
          };
        if (null !== b && void 0 !== b)
          return a7 = a7(), b.current = a7, function() {
            b.current = null;
          };
      }
      function qi(a7, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a7]) : null;
        return li(4, 4, pi.bind(null, b, a7), c);
      }
      function ri() {
      }
      function si(a7, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1]))
          return d[0];
        c.memoizedState = [a7, b];
        return a7;
      }
      function ti(a7, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1]))
          return d[0];
        a7 = a7();
        c.memoizedState = [a7, b];
        return a7;
      }
      function ui(a7, b, c) {
        if (0 === (Hh & 21))
          return a7.baseState && (a7.baseState = false, dh = true), a7.memoizedState = c;
        He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a7.baseState = true);
        return b;
      }
      function vi(a7, b) {
        var c = C;
        C = 0 !== c && 4 > c ? c : 4;
        a7(true);
        var d = Gh.transition;
        Gh.transition = {};
        try {
          a7(false), b();
        } finally {
          C = c, Gh.transition = d;
        }
      }
      function wi() {
        return Uh().memoizedState;
      }
      function xi(a7, b, c) {
        var d = yi(a7);
        c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a7))
          Ai(b, c);
        else if (c = hh(a7, b, c, d), null !== c) {
          var e8 = R();
          gi(c, a7, d, e8);
          Bi(c, b, d);
        }
      }
      function ii(a7, b, c) {
        var d = yi(a7), e8 = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a7))
          Ai(b, e8);
        else {
          var f2 = a7.alternate;
          if (0 === a7.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2))
            try {
              var g = b.lastRenderedState, h = f2(g, c);
              e8.hasEagerState = true;
              e8.eagerState = h;
              if (He(h, g)) {
                var k = b.interleaved;
                null === k ? (e8.next = e8, gh(b)) : (e8.next = k.next, k.next = e8);
                b.interleaved = e8;
                return;
              }
            } catch (l) {
            } finally {
            }
          c = hh(a7, b, e8, d);
          null !== c && (e8 = R(), gi(c, a7, d, e8), Bi(c, b, d));
        }
      }
      function zi(a7) {
        var b = a7.alternate;
        return a7 === M || null !== b && b === M;
      }
      function Ai(a7, b) {
        Jh = Ih = true;
        var c = a7.pending;
        null === c ? b.next = b : (b.next = c.next, c.next = b);
        a7.pending = b;
      }
      function Bi(a7, b, c) {
        if (0 !== (c & 4194240)) {
          var d = b.lanes;
          d &= a7.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a7, c);
        }
      }
      var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false };
      var Oh = { readContext: eh, useCallback: function(a7, b) {
        Th().memoizedState = [a7, void 0 === b ? null : b];
        return a7;
      }, useContext: eh, useEffect: mi, useImperativeHandle: function(a7, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a7]) : null;
        return ki(
          4194308,
          4,
          pi.bind(null, b, a7),
          c
        );
      }, useLayoutEffect: function(a7, b) {
        return ki(4194308, 4, a7, b);
      }, useInsertionEffect: function(a7, b) {
        return ki(4, 2, a7, b);
      }, useMemo: function(a7, b) {
        var c = Th();
        b = void 0 === b ? null : b;
        a7 = a7();
        c.memoizedState = [a7, b];
        return a7;
      }, useReducer: function(a7, b, c) {
        var d = Th();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a7 = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a7, lastRenderedState: b };
        d.queue = a7;
        a7 = a7.dispatch = xi.bind(null, M, a7);
        return [d.memoizedState, a7];
      }, useRef: function(a7) {
        var b = Th();
        a7 = { current: a7 };
        return b.memoizedState = a7;
      }, useState: hi, useDebugValue: ri, useDeferredValue: function(a7) {
        return Th().memoizedState = a7;
      }, useTransition: function() {
        var a7 = hi(false), b = a7[0];
        a7 = vi.bind(null, a7[1]);
        Th().memoizedState = a7;
        return [b, a7];
      }, useMutableSource: function() {
      }, useSyncExternalStore: function(a7, b, c) {
        var d = M, e8 = Th();
        if (I) {
          if (void 0 === c)
            throw Error(p2(407));
          c = c();
        } else {
          c = b();
          if (null === Q)
            throw Error(p2(349));
          0 !== (Hh & 30) || di(d, b, c);
        }
        e8.memoizedState = c;
        var f2 = { value: c, getSnapshot: b };
        e8.queue = f2;
        mi(ai.bind(
          null,
          d,
          f2,
          a7
        ), [a7]);
        d.flags |= 2048;
        bi(9, ci.bind(null, d, f2, c, b), void 0, null);
        return c;
      }, useId: function() {
        var a7 = Th(), b = Q.identifierPrefix;
        if (I) {
          var c = sg;
          var d = rg;
          c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
          b = ":" + b + "R" + c;
          c = Kh++;
          0 < c && (b += "H" + c.toString(32));
          b += ":";
        } else
          c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
        return a7.memoizedState = b;
      }, unstable_isNewReconciler: false };
      var Ph = {
        readContext: eh,
        useCallback: si,
        useContext: eh,
        useEffect: $h,
        useImperativeHandle: qi,
        useInsertionEffect: ni,
        useLayoutEffect: oi,
        useMemo: ti,
        useReducer: Wh,
        useRef: ji,
        useState: function() {
          return Wh(Vh);
        },
        useDebugValue: ri,
        useDeferredValue: function(a7) {
          var b = Uh();
          return ui(b, N.memoizedState, a7);
        },
        useTransition: function() {
          var a7 = Wh(Vh)[0], b = Uh().memoizedState;
          return [a7, b];
        },
        useMutableSource: Yh,
        useSyncExternalStore: Zh,
        useId: wi,
        unstable_isNewReconciler: false
      };
      var Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
        return Xh(Vh);
      }, useDebugValue: ri, useDeferredValue: function(a7) {
        var b = Uh();
        return null === N ? b.memoizedState = a7 : ui(b, N.memoizedState, a7);
      }, useTransition: function() {
        var a7 = Xh(Vh)[0], b = Uh().memoizedState;
        return [a7, b];
      }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
      function Ci(a7, b) {
        if (a7 && a7.defaultProps) {
          b = A({}, b);
          a7 = a7.defaultProps;
          for (var c in a7)
            void 0 === b[c] && (b[c] = a7[c]);
          return b;
        }
        return b;
      }
      function Di(a7, b, c, d) {
        b = a7.memoizedState;
        c = c(d, b);
        c = null === c || void 0 === c ? b : A({}, b, c);
        a7.memoizedState = c;
        0 === a7.lanes && (a7.updateQueue.baseState = c);
      }
      var Ei = { isMounted: function(a7) {
        return (a7 = a7._reactInternals) ? Vb(a7) === a7 : false;
      }, enqueueSetState: function(a7, b, c) {
        a7 = a7._reactInternals;
        var d = R(), e8 = yi(a7), f2 = mh(d, e8);
        f2.payload = b;
        void 0 !== c && null !== c && (f2.callback = c);
        b = nh(a7, f2, e8);
        null !== b && (gi(b, a7, e8, d), oh(b, a7, e8));
      }, enqueueReplaceState: function(a7, b, c) {
        a7 = a7._reactInternals;
        var d = R(), e8 = yi(a7), f2 = mh(d, e8);
        f2.tag = 1;
        f2.payload = b;
        void 0 !== c && null !== c && (f2.callback = c);
        b = nh(a7, f2, e8);
        null !== b && (gi(b, a7, e8, d), oh(b, a7, e8));
      }, enqueueForceUpdate: function(a7, b) {
        a7 = a7._reactInternals;
        var c = R(), d = yi(a7), e8 = mh(c, d);
        e8.tag = 2;
        void 0 !== b && null !== b && (e8.callback = b);
        b = nh(a7, e8, d);
        null !== b && (gi(b, a7, d, c), oh(b, a7, d));
      } };
      function Fi(a7, b, c, d, e8, f2, g) {
        a7 = a7.stateNode;
        return "function" === typeof a7.shouldComponentUpdate ? a7.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e8, f2) : true;
      }
      function Gi(a7, b, c) {
        var d = false, e8 = Vf;
        var f2 = b.contextType;
        "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e8 = Zf(b) ? Xf : H.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a7, e8) : Vf);
        b = new b(c, f2);
        a7.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
        b.updater = Ei;
        a7.stateNode = b;
        b._reactInternals = a7;
        d && (a7 = a7.stateNode, a7.__reactInternalMemoizedUnmaskedChildContext = e8, a7.__reactInternalMemoizedMaskedChildContext = f2);
        return b;
      }
      function Hi(a7, b, c, d) {
        a7 = b.state;
        "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
        "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
        b.state !== a7 && Ei.enqueueReplaceState(b, b.state, null);
      }
      function Ii(a7, b, c, d) {
        var e8 = a7.stateNode;
        e8.props = c;
        e8.state = a7.memoizedState;
        e8.refs = {};
        kh(a7);
        var f2 = b.contextType;
        "object" === typeof f2 && null !== f2 ? e8.context = eh(f2) : (f2 = Zf(b) ? Xf : H.current, e8.context = Yf(a7, f2));
        e8.state = a7.memoizedState;
        f2 = b.getDerivedStateFromProps;
        "function" === typeof f2 && (Di(a7, b, f2, c), e8.state = a7.memoizedState);
        "function" === typeof b.getDerivedStateFromProps || "function" === typeof e8.getSnapshotBeforeUpdate || "function" !== typeof e8.UNSAFE_componentWillMount && "function" !== typeof e8.componentWillMount || (b = e8.state, "function" === typeof e8.componentWillMount && e8.componentWillMount(), "function" === typeof e8.UNSAFE_componentWillMount && e8.UNSAFE_componentWillMount(), b !== e8.state && Ei.enqueueReplaceState(e8, e8.state, null), qh(a7, c, e8, d), e8.state = a7.memoizedState);
        "function" === typeof e8.componentDidMount && (a7.flags |= 4194308);
      }
      function Ji(a7, b) {
        try {
          var c = "", d = b;
          do
            c += Pa(d), d = d.return;
          while (d);
          var e8 = c;
        } catch (f2) {
          e8 = "\nError generating stack: " + f2.message + "\n" + f2.stack;
        }
        return { value: a7, source: b, stack: e8, digest: null };
      }
      function Ki(a7, b, c) {
        return { value: a7, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
      }
      function Li(a7, b) {
        try {
          console.error(b.value);
        } catch (c) {
          setTimeout(function() {
            throw c;
          });
        }
      }
      var Mi = "function" === typeof WeakMap ? WeakMap : Map;
      function Ni(a7, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        c.payload = { element: null };
        var d = b.value;
        c.callback = function() {
          Oi || (Oi = true, Pi = d);
          Li(a7, b);
        };
        return c;
      }
      function Qi(a7, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        var d = a7.type.getDerivedStateFromError;
        if ("function" === typeof d) {
          var e8 = b.value;
          c.payload = function() {
            return d(e8);
          };
          c.callback = function() {
            Li(a7, b);
          };
        }
        var f2 = a7.stateNode;
        null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
          Li(a7, b);
          "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
          var c2 = b.stack;
          this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
        });
        return c;
      }
      function Si(a7, b, c) {
        var d = a7.pingCache;
        if (null === d) {
          d = a7.pingCache = new Mi();
          var e8 = /* @__PURE__ */ new Set();
          d.set(b, e8);
        } else
          e8 = d.get(b), void 0 === e8 && (e8 = /* @__PURE__ */ new Set(), d.set(b, e8));
        e8.has(c) || (e8.add(c), a7 = Ti.bind(null, a7, b, c), b.then(a7, a7));
      }
      function Ui(a7) {
        do {
          var b;
          if (b = 13 === a7.tag)
            b = a7.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
          if (b)
            return a7;
          a7 = a7.return;
        } while (null !== a7);
        return null;
      }
      function Vi(a7, b, c, d, e8) {
        if (0 === (a7.mode & 1))
          return a7 === b ? a7.flags |= 65536 : (a7.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a7;
        a7.flags |= 65536;
        a7.lanes = e8;
        return a7;
      }
      var Wi = ua.ReactCurrentOwner;
      var dh = false;
      function Xi(a7, b, c, d) {
        b.child = null === a7 ? Vg(b, null, c, d) : Ug(b, a7.child, c, d);
      }
      function Yi(a7, b, c, d, e8) {
        c = c.render;
        var f2 = b.ref;
        ch(b, e8);
        d = Nh(a7, b, c, d, f2, e8);
        c = Sh();
        if (null !== a7 && !dh)
          return b.updateQueue = a7.updateQueue, b.flags &= -2053, a7.lanes &= ~e8, Zi(a7, b, e8);
        I && c && vg(b);
        b.flags |= 1;
        Xi(a7, b, d, e8);
        return b.child;
      }
      function $i(a7, b, c, d, e8) {
        if (null === a7) {
          var f2 = c.type;
          if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps)
            return b.tag = 15, b.type = f2, bj(a7, b, f2, d, e8);
          a7 = Rg(c.type, null, d, b, b.mode, e8);
          a7.ref = b.ref;
          a7.return = b;
          return b.child = a7;
        }
        f2 = a7.child;
        if (0 === (a7.lanes & e8)) {
          var g = f2.memoizedProps;
          c = c.compare;
          c = null !== c ? c : Ie;
          if (c(g, d) && a7.ref === b.ref)
            return Zi(a7, b, e8);
        }
        b.flags |= 1;
        a7 = Pg(f2, d);
        a7.ref = b.ref;
        a7.return = b;
        return b.child = a7;
      }
      function bj(a7, b, c, d, e8) {
        if (null !== a7) {
          var f2 = a7.memoizedProps;
          if (Ie(f2, d) && a7.ref === b.ref)
            if (dh = false, b.pendingProps = d = f2, 0 !== (a7.lanes & e8))
              0 !== (a7.flags & 131072) && (dh = true);
            else
              return b.lanes = a7.lanes, Zi(a7, b, e8);
        }
        return cj(a7, b, c, d, e8);
      }
      function dj(a7, b, c) {
        var d = b.pendingProps, e8 = d.children, f2 = null !== a7 ? a7.memoizedState : null;
        if ("hidden" === d.mode)
          if (0 === (b.mode & 1))
            b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
          else {
            if (0 === (c & 1073741824))
              return a7 = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a7, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a7, null;
            b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
            d = null !== f2 ? f2.baseLanes : c;
            G(ej, fj);
            fj |= d;
          }
        else
          null !== f2 ? (d = f2.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
        Xi(a7, b, e8, c);
        return b.child;
      }
      function gj(a7, b) {
        var c = b.ref;
        if (null === a7 && null !== c || null !== a7 && a7.ref !== c)
          b.flags |= 512, b.flags |= 2097152;
      }
      function cj(a7, b, c, d, e8) {
        var f2 = Zf(c) ? Xf : H.current;
        f2 = Yf(b, f2);
        ch(b, e8);
        c = Nh(a7, b, c, d, f2, e8);
        d = Sh();
        if (null !== a7 && !dh)
          return b.updateQueue = a7.updateQueue, b.flags &= -2053, a7.lanes &= ~e8, Zi(a7, b, e8);
        I && d && vg(b);
        b.flags |= 1;
        Xi(a7, b, c, e8);
        return b.child;
      }
      function hj(a7, b, c, d, e8) {
        if (Zf(c)) {
          var f2 = true;
          cg(b);
        } else
          f2 = false;
        ch(b, e8);
        if (null === b.stateNode)
          ij(a7, b), Gi(b, c, d), Ii(b, c, d, e8), d = true;
        else if (null === a7) {
          var g = b.stateNode, h = b.memoizedProps;
          g.props = h;
          var k = g.context, l = c.contextType;
          "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
          var m2 = c.getDerivedStateFromProps, q = "function" === typeof m2 || "function" === typeof g.getSnapshotBeforeUpdate;
          q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
          jh = false;
          var r2 = b.memoizedState;
          g.state = r2;
          qh(b, d, g, e8);
          k = b.memoizedState;
          h !== d || r2 !== k || Wf.current || jh ? ("function" === typeof m2 && (Di(b, c, m2, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r2, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
        } else {
          g = b.stateNode;
          lh(a7, b);
          h = b.memoizedProps;
          l = b.type === b.elementType ? h : Ci(b.type, h);
          g.props = l;
          q = b.pendingProps;
          r2 = g.context;
          k = c.contextType;
          "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
          var y = c.getDerivedStateFromProps;
          (m2 = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r2 !== k) && Hi(b, g, d, k);
          jh = false;
          r2 = b.memoizedState;
          g.state = r2;
          qh(b, d, g, e8);
          var n3 = b.memoizedState;
          h !== q || r2 !== n3 || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n3 = b.memoizedState), (l = jh || Fi(b, c, l, d, r2, n3, k) || false) ? (m2 || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n3, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n3, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a7.memoizedProps && r2 === a7.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a7.memoizedProps && r2 === a7.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n3), g.props = d, g.state = n3, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a7.memoizedProps && r2 === a7.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a7.memoizedProps && r2 === a7.memoizedState || (b.flags |= 1024), d = false);
        }
        return jj(a7, b, c, d, f2, e8);
      }
      function jj(a7, b, c, d, e8, f2) {
        gj(a7, b);
        var g = 0 !== (b.flags & 128);
        if (!d && !g)
          return e8 && dg(b, c, false), Zi(a7, b, f2);
        d = b.stateNode;
        Wi.current = b;
        var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
        b.flags |= 1;
        null !== a7 && g ? (b.child = Ug(b, a7.child, null, f2), b.child = Ug(b, null, h, f2)) : Xi(a7, b, h, f2);
        b.memoizedState = d.state;
        e8 && dg(b, c, true);
        return b.child;
      }
      function kj(a7) {
        var b = a7.stateNode;
        b.pendingContext ? ag(a7, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a7, b.context, false);
        yh(a7, b.containerInfo);
      }
      function lj(a7, b, c, d, e8) {
        Ig();
        Jg(e8);
        b.flags |= 256;
        Xi(a7, b, c, d);
        return b.child;
      }
      var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
      function nj(a7) {
        return { baseLanes: a7, cachePool: null, transitions: null };
      }
      function oj(a7, b, c) {
        var d = b.pendingProps, e8 = L.current, f2 = false, g = 0 !== (b.flags & 128), h;
        (h = g) || (h = null !== a7 && null === a7.memoizedState ? false : 0 !== (e8 & 2));
        if (h)
          f2 = true, b.flags &= -129;
        else if (null === a7 || null !== a7.memoizedState)
          e8 |= 1;
        G(L, e8 & 1);
        if (null === a7) {
          Eg(b);
          a7 = b.memoizedState;
          if (null !== a7 && (a7 = a7.dehydrated, null !== a7))
            return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a7.data ? b.lanes = 8 : b.lanes = 1073741824, null;
          g = d.children;
          a7 = d.fallback;
          return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a7 = Tg(a7, d, c, null), f2.return = b, a7.return = b, f2.sibling = a7, b.child = f2, b.child.memoizedState = nj(c), b.memoizedState = mj, a7) : qj(b, g);
        }
        e8 = a7.memoizedState;
        if (null !== e8 && (h = e8.dehydrated, null !== h))
          return rj(a7, b, g, d, h, e8, c);
        if (f2) {
          f2 = d.fallback;
          g = b.mode;
          e8 = a7.child;
          h = e8.sibling;
          var k = { mode: "hidden", children: d.children };
          0 === (g & 1) && b.child !== e8 ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e8, k), d.subtreeFlags = e8.subtreeFlags & 14680064);
          null !== h ? f2 = Pg(h, f2) : (f2 = Tg(f2, g, c, null), f2.flags |= 2);
          f2.return = b;
          d.return = b;
          d.sibling = f2;
          b.child = d;
          d = f2;
          f2 = b.child;
          g = a7.child.memoizedState;
          g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
          f2.memoizedState = g;
          f2.childLanes = a7.childLanes & ~c;
          b.memoizedState = mj;
          return d;
        }
        f2 = a7.child;
        a7 = f2.sibling;
        d = Pg(f2, { mode: "visible", children: d.children });
        0 === (b.mode & 1) && (d.lanes = c);
        d.return = b;
        d.sibling = null;
        null !== a7 && (c = b.deletions, null === c ? (b.deletions = [a7], b.flags |= 16) : c.push(a7));
        b.child = d;
        b.memoizedState = null;
        return d;
      }
      function qj(a7, b) {
        b = pj({ mode: "visible", children: b }, a7.mode, 0, null);
        b.return = a7;
        return a7.child = b;
      }
      function sj(a7, b, c, d) {
        null !== d && Jg(d);
        Ug(b, a7.child, null, c);
        a7 = qj(b, b.pendingProps.children);
        a7.flags |= 2;
        b.memoizedState = null;
        return a7;
      }
      function rj(a7, b, c, d, e8, f2, g) {
        if (c) {
          if (b.flags & 256)
            return b.flags &= -257, d = Ki(Error(p2(422))), sj(a7, b, g, d);
          if (null !== b.memoizedState)
            return b.child = a7.child, b.flags |= 128, null;
          f2 = d.fallback;
          e8 = b.mode;
          d = pj({ mode: "visible", children: d.children }, e8, 0, null);
          f2 = Tg(f2, e8, g, null);
          f2.flags |= 2;
          d.return = b;
          f2.return = b;
          d.sibling = f2;
          b.child = d;
          0 !== (b.mode & 1) && Ug(b, a7.child, null, g);
          b.child.memoizedState = nj(g);
          b.memoizedState = mj;
          return f2;
        }
        if (0 === (b.mode & 1))
          return sj(a7, b, g, null);
        if ("$!" === e8.data) {
          d = e8.nextSibling && e8.nextSibling.dataset;
          if (d)
            var h = d.dgst;
          d = h;
          f2 = Error(p2(419));
          d = Ki(f2, d, void 0);
          return sj(a7, b, g, d);
        }
        h = 0 !== (g & a7.childLanes);
        if (dh || h) {
          d = Q;
          if (null !== d) {
            switch (g & -g) {
              case 4:
                e8 = 2;
                break;
              case 16:
                e8 = 8;
                break;
              case 64:
              case 128:
              case 256:
              case 512:
              case 1024:
              case 2048:
              case 4096:
              case 8192:
              case 16384:
              case 32768:
              case 65536:
              case 131072:
              case 262144:
              case 524288:
              case 1048576:
              case 2097152:
              case 4194304:
              case 8388608:
              case 16777216:
              case 33554432:
              case 67108864:
                e8 = 32;
                break;
              case 536870912:
                e8 = 268435456;
                break;
              default:
                e8 = 0;
            }
            e8 = 0 !== (e8 & (d.suspendedLanes | g)) ? 0 : e8;
            0 !== e8 && e8 !== f2.retryLane && (f2.retryLane = e8, ih(a7, e8), gi(d, a7, e8, -1));
          }
          tj();
          d = Ki(Error(p2(421)));
          return sj(a7, b, g, d);
        }
        if ("$?" === e8.data)
          return b.flags |= 128, b.child = a7.child, b = uj.bind(null, a7), e8._reactRetry = b, null;
        a7 = f2.treeContext;
        yg = Lf(e8.nextSibling);
        xg = b;
        I = true;
        zg = null;
        null !== a7 && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a7.id, sg = a7.overflow, qg = b);
        b = qj(b, d.children);
        b.flags |= 4096;
        return b;
      }
      function vj(a7, b, c) {
        a7.lanes |= b;
        var d = a7.alternate;
        null !== d && (d.lanes |= b);
        bh(a7.return, b, c);
      }
      function wj(a7, b, c, d, e8) {
        var f2 = a7.memoizedState;
        null === f2 ? a7.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e8 } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c, f2.tailMode = e8);
      }
      function xj(a7, b, c) {
        var d = b.pendingProps, e8 = d.revealOrder, f2 = d.tail;
        Xi(a7, b, d.children, c);
        d = L.current;
        if (0 !== (d & 2))
          d = d & 1 | 2, b.flags |= 128;
        else {
          if (null !== a7 && 0 !== (a7.flags & 128))
            a:
              for (a7 = b.child; null !== a7; ) {
                if (13 === a7.tag)
                  null !== a7.memoizedState && vj(a7, c, b);
                else if (19 === a7.tag)
                  vj(a7, c, b);
                else if (null !== a7.child) {
                  a7.child.return = a7;
                  a7 = a7.child;
                  continue;
                }
                if (a7 === b)
                  break a;
                for (; null === a7.sibling; ) {
                  if (null === a7.return || a7.return === b)
                    break a;
                  a7 = a7.return;
                }
                a7.sibling.return = a7.return;
                a7 = a7.sibling;
              }
          d &= 1;
        }
        G(L, d);
        if (0 === (b.mode & 1))
          b.memoizedState = null;
        else
          switch (e8) {
            case "forwards":
              c = b.child;
              for (e8 = null; null !== c; )
                a7 = c.alternate, null !== a7 && null === Ch(a7) && (e8 = c), c = c.sibling;
              c = e8;
              null === c ? (e8 = b.child, b.child = null) : (e8 = c.sibling, c.sibling = null);
              wj(b, false, e8, c, f2);
              break;
            case "backwards":
              c = null;
              e8 = b.child;
              for (b.child = null; null !== e8; ) {
                a7 = e8.alternate;
                if (null !== a7 && null === Ch(a7)) {
                  b.child = e8;
                  break;
                }
                a7 = e8.sibling;
                e8.sibling = c;
                c = e8;
                e8 = a7;
              }
              wj(b, true, c, null, f2);
              break;
            case "together":
              wj(b, false, null, null, void 0);
              break;
            default:
              b.memoizedState = null;
          }
        return b.child;
      }
      function ij(a7, b) {
        0 === (b.mode & 1) && null !== a7 && (a7.alternate = null, b.alternate = null, b.flags |= 2);
      }
      function Zi(a7, b, c) {
        null !== a7 && (b.dependencies = a7.dependencies);
        rh |= b.lanes;
        if (0 === (c & b.childLanes))
          return null;
        if (null !== a7 && b.child !== a7.child)
          throw Error(p2(153));
        if (null !== b.child) {
          a7 = b.child;
          c = Pg(a7, a7.pendingProps);
          b.child = c;
          for (c.return = b; null !== a7.sibling; )
            a7 = a7.sibling, c = c.sibling = Pg(a7, a7.pendingProps), c.return = b;
          c.sibling = null;
        }
        return b.child;
      }
      function yj(a7, b, c) {
        switch (b.tag) {
          case 3:
            kj(b);
            Ig();
            break;
          case 5:
            Ah(b);
            break;
          case 1:
            Zf(b.type) && cg(b);
            break;
          case 4:
            yh(b, b.stateNode.containerInfo);
            break;
          case 10:
            var d = b.type._context, e8 = b.memoizedProps.value;
            G(Wg, d._currentValue);
            d._currentValue = e8;
            break;
          case 13:
            d = b.memoizedState;
            if (null !== d) {
              if (null !== d.dehydrated)
                return G(L, L.current & 1), b.flags |= 128, null;
              if (0 !== (c & b.child.childLanes))
                return oj(a7, b, c);
              G(L, L.current & 1);
              a7 = Zi(a7, b, c);
              return null !== a7 ? a7.sibling : null;
            }
            G(L, L.current & 1);
            break;
          case 19:
            d = 0 !== (c & b.childLanes);
            if (0 !== (a7.flags & 128)) {
              if (d)
                return xj(a7, b, c);
              b.flags |= 128;
            }
            e8 = b.memoizedState;
            null !== e8 && (e8.rendering = null, e8.tail = null, e8.lastEffect = null);
            G(L, L.current);
            if (d)
              break;
            else
              return null;
          case 22:
          case 23:
            return b.lanes = 0, dj(a7, b, c);
        }
        return Zi(a7, b, c);
      }
      var zj;
      var Aj;
      var Bj;
      var Cj;
      zj = function(a7, b) {
        for (var c = b.child; null !== c; ) {
          if (5 === c.tag || 6 === c.tag)
            a7.appendChild(c.stateNode);
          else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
          }
          if (c === b)
            break;
          for (; null === c.sibling; ) {
            if (null === c.return || c.return === b)
              return;
            c = c.return;
          }
          c.sibling.return = c.return;
          c = c.sibling;
        }
      };
      Aj = function() {
      };
      Bj = function(a7, b, c, d) {
        var e8 = a7.memoizedProps;
        if (e8 !== d) {
          a7 = b.stateNode;
          xh(uh.current);
          var f2 = null;
          switch (c) {
            case "input":
              e8 = Ya(a7, e8);
              d = Ya(a7, d);
              f2 = [];
              break;
            case "select":
              e8 = A({}, e8, { value: void 0 });
              d = A({}, d, { value: void 0 });
              f2 = [];
              break;
            case "textarea":
              e8 = gb(a7, e8);
              d = gb(a7, d);
              f2 = [];
              break;
            default:
              "function" !== typeof e8.onClick && "function" === typeof d.onClick && (a7.onclick = Bf);
          }
          ub(c, d);
          var g;
          c = null;
          for (l in e8)
            if (!d.hasOwnProperty(l) && e8.hasOwnProperty(l) && null != e8[l])
              if ("style" === l) {
                var h = e8[l];
                for (g in h)
                  h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
              } else
                "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f2 || (f2 = []) : (f2 = f2 || []).push(l, null));
          for (l in d) {
            var k = d[l];
            h = null != e8 ? e8[l] : void 0;
            if (d.hasOwnProperty(l) && k !== h && (null != k || null != h))
              if ("style" === l)
                if (h) {
                  for (g in h)
                    !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
                  for (g in k)
                    k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
                } else
                  c || (f2 || (f2 = []), f2.push(
                    l,
                    c
                  )), c = k;
              else
                "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f2 = f2 || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f2 = f2 || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a7), f2 || h === k || (f2 = [])) : (f2 = f2 || []).push(l, k));
          }
          c && (f2 = f2 || []).push("style", c);
          var l = f2;
          if (b.updateQueue = l)
            b.flags |= 4;
        }
      };
      Cj = function(a7, b, c, d) {
        c !== d && (b.flags |= 4);
      };
      function Dj(a7, b) {
        if (!I)
          switch (a7.tailMode) {
            case "hidden":
              b = a7.tail;
              for (var c = null; null !== b; )
                null !== b.alternate && (c = b), b = b.sibling;
              null === c ? a7.tail = null : c.sibling = null;
              break;
            case "collapsed":
              c = a7.tail;
              for (var d = null; null !== c; )
                null !== c.alternate && (d = c), c = c.sibling;
              null === d ? b || null === a7.tail ? a7.tail = null : a7.tail.sibling = null : d.sibling = null;
          }
      }
      function S(a7) {
        var b = null !== a7.alternate && a7.alternate.child === a7.child, c = 0, d = 0;
        if (b)
          for (var e8 = a7.child; null !== e8; )
            c |= e8.lanes | e8.childLanes, d |= e8.subtreeFlags & 14680064, d |= e8.flags & 14680064, e8.return = a7, e8 = e8.sibling;
        else
          for (e8 = a7.child; null !== e8; )
            c |= e8.lanes | e8.childLanes, d |= e8.subtreeFlags, d |= e8.flags, e8.return = a7, e8 = e8.sibling;
        a7.subtreeFlags |= d;
        a7.childLanes = c;
        return b;
      }
      function Ej(a7, b, c) {
        var d = b.pendingProps;
        wg(b);
        switch (b.tag) {
          case 2:
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return S(b), null;
          case 1:
            return Zf(b.type) && $f(), S(b), null;
          case 3:
            d = b.stateNode;
            zh();
            E(Wf);
            E(H);
            Eh();
            d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
            if (null === a7 || null === a7.child)
              Gg(b) ? b.flags |= 4 : null === a7 || a7.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
            Aj(a7, b);
            S(b);
            return null;
          case 5:
            Bh(b);
            var e8 = xh(wh.current);
            c = b.type;
            if (null !== a7 && null != b.stateNode)
              Bj(a7, b, c, d, e8), a7.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            else {
              if (!d) {
                if (null === b.stateNode)
                  throw Error(p2(166));
                S(b);
                return null;
              }
              a7 = xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.type;
                var f2 = b.memoizedProps;
                d[Of] = b;
                d[Pf] = f2;
                a7 = 0 !== (b.mode & 1);
                switch (c) {
                  case "dialog":
                    D("cancel", d);
                    D("close", d);
                    break;
                  case "iframe":
                  case "object":
                  case "embed":
                    D("load", d);
                    break;
                  case "video":
                  case "audio":
                    for (e8 = 0; e8 < lf.length; e8++)
                      D(lf[e8], d);
                    break;
                  case "source":
                    D("error", d);
                    break;
                  case "img":
                  case "image":
                  case "link":
                    D(
                      "error",
                      d
                    );
                    D("load", d);
                    break;
                  case "details":
                    D("toggle", d);
                    break;
                  case "input":
                    Za(d, f2);
                    D("invalid", d);
                    break;
                  case "select":
                    d._wrapperState = { wasMultiple: !!f2.multiple };
                    D("invalid", d);
                    break;
                  case "textarea":
                    hb(d, f2), D("invalid", d);
                }
                ub(c, f2);
                e8 = null;
                for (var g in f2)
                  if (f2.hasOwnProperty(g)) {
                    var h = f2[g];
                    "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d.textContent, h, a7), e8 = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
                      d.textContent,
                      h,
                      a7
                    ), e8 = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
                  }
                switch (c) {
                  case "input":
                    Va(d);
                    db(d, f2, true);
                    break;
                  case "textarea":
                    Va(d);
                    jb(d);
                    break;
                  case "select":
                  case "option":
                    break;
                  default:
                    "function" === typeof f2.onClick && (d.onclick = Bf);
                }
                d = e8;
                b.updateQueue = d;
                null !== d && (b.flags |= 4);
              } else {
                g = 9 === e8.nodeType ? e8 : e8.ownerDocument;
                "http://www.w3.org/1999/xhtml" === a7 && (a7 = kb(c));
                "http://www.w3.org/1999/xhtml" === a7 ? "script" === c ? (a7 = g.createElement("div"), a7.innerHTML = "<script><\/script>", a7 = a7.removeChild(a7.firstChild)) : "string" === typeof d.is ? a7 = g.createElement(c, { is: d.is }) : (a7 = g.createElement(c), "select" === c && (g = a7, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a7 = g.createElementNS(a7, c);
                a7[Of] = b;
                a7[Pf] = d;
                zj(a7, b, false, false);
                b.stateNode = a7;
                a: {
                  g = vb(c, d);
                  switch (c) {
                    case "dialog":
                      D("cancel", a7);
                      D("close", a7);
                      e8 = d;
                      break;
                    case "iframe":
                    case "object":
                    case "embed":
                      D("load", a7);
                      e8 = d;
                      break;
                    case "video":
                    case "audio":
                      for (e8 = 0; e8 < lf.length; e8++)
                        D(lf[e8], a7);
                      e8 = d;
                      break;
                    case "source":
                      D("error", a7);
                      e8 = d;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      D(
                        "error",
                        a7
                      );
                      D("load", a7);
                      e8 = d;
                      break;
                    case "details":
                      D("toggle", a7);
                      e8 = d;
                      break;
                    case "input":
                      Za(a7, d);
                      e8 = Ya(a7, d);
                      D("invalid", a7);
                      break;
                    case "option":
                      e8 = d;
                      break;
                    case "select":
                      a7._wrapperState = { wasMultiple: !!d.multiple };
                      e8 = A({}, d, { value: void 0 });
                      D("invalid", a7);
                      break;
                    case "textarea":
                      hb(a7, d);
                      e8 = gb(a7, d);
                      D("invalid", a7);
                      break;
                    default:
                      e8 = d;
                  }
                  ub(c, e8);
                  h = e8;
                  for (f2 in h)
                    if (h.hasOwnProperty(f2)) {
                      var k = h[f2];
                      "style" === f2 ? sb(a7, k) : "dangerouslySetInnerHTML" === f2 ? (k = k ? k.__html : void 0, null != k && nb(a7, k)) : "children" === f2 ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a7, k) : "number" === typeof k && ob(a7, "" + k) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k && "onScroll" === f2 && D("scroll", a7) : null != k && ta(a7, f2, k, g));
                    }
                  switch (c) {
                    case "input":
                      Va(a7);
                      db(a7, d, false);
                      break;
                    case "textarea":
                      Va(a7);
                      jb(a7);
                      break;
                    case "option":
                      null != d.value && a7.setAttribute("value", "" + Sa(d.value));
                      break;
                    case "select":
                      a7.multiple = !!d.multiple;
                      f2 = d.value;
                      null != f2 ? fb(a7, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                        a7,
                        !!d.multiple,
                        d.defaultValue,
                        true
                      );
                      break;
                    default:
                      "function" === typeof e8.onClick && (a7.onclick = Bf);
                  }
                  switch (c) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                      d = !!d.autoFocus;
                      break a;
                    case "img":
                      d = true;
                      break a;
                    default:
                      d = false;
                  }
                }
                d && (b.flags |= 4);
              }
              null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            }
            S(b);
            return null;
          case 6:
            if (a7 && null != b.stateNode)
              Cj(a7, b, a7.memoizedProps, d);
            else {
              if ("string" !== typeof d && null === b.stateNode)
                throw Error(p2(166));
              c = xh(wh.current);
              xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.memoizedProps;
                d[Of] = b;
                if (f2 = d.nodeValue !== c) {
                  if (a7 = xg, null !== a7)
                    switch (a7.tag) {
                      case 3:
                        Af(d.nodeValue, c, 0 !== (a7.mode & 1));
                        break;
                      case 5:
                        true !== a7.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a7.mode & 1));
                    }
                }
                f2 && (b.flags |= 4);
              } else
                d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
            }
            S(b);
            return null;
          case 13:
            E(L);
            d = b.memoizedState;
            if (null === a7 || null !== a7.memoizedState && null !== a7.memoizedState.dehydrated) {
              if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128))
                Hg(), Ig(), b.flags |= 98560, f2 = false;
              else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
                if (null === a7) {
                  if (!f2)
                    throw Error(p2(318));
                  f2 = b.memoizedState;
                  f2 = null !== f2 ? f2.dehydrated : null;
                  if (!f2)
                    throw Error(p2(317));
                  f2[Of] = b;
                } else
                  Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
                S(b);
                f2 = false;
              } else
                null !== zg && (Fj(zg), zg = null), f2 = true;
              if (!f2)
                return b.flags & 65536 ? b : null;
            }
            if (0 !== (b.flags & 128))
              return b.lanes = c, b;
            d = null !== d;
            d !== (null !== a7 && null !== a7.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a7 || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
            null !== b.updateQueue && (b.flags |= 4);
            S(b);
            return null;
          case 4:
            return zh(), Aj(a7, b), null === a7 && sf(b.stateNode.containerInfo), S(b), null;
          case 10:
            return ah(b.type._context), S(b), null;
          case 17:
            return Zf(b.type) && $f(), S(b), null;
          case 19:
            E(L);
            f2 = b.memoizedState;
            if (null === f2)
              return S(b), null;
            d = 0 !== (b.flags & 128);
            g = f2.rendering;
            if (null === g)
              if (d)
                Dj(f2, false);
              else {
                if (0 !== T || null !== a7 && 0 !== (a7.flags & 128))
                  for (a7 = b.child; null !== a7; ) {
                    g = Ch(a7);
                    if (null !== g) {
                      b.flags |= 128;
                      Dj(f2, false);
                      d = g.updateQueue;
                      null !== d && (b.updateQueue = d, b.flags |= 4);
                      b.subtreeFlags = 0;
                      d = c;
                      for (c = b.child; null !== c; )
                        f2 = c, a7 = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a7, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a7 = g.dependencies, f2.dependencies = null === a7 ? null : { lanes: a7.lanes, firstContext: a7.firstContext }), c = c.sibling;
                      G(L, L.current & 1 | 2);
                      return b.child;
                    }
                    a7 = a7.sibling;
                  }
                null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
              }
            else {
              if (!d)
                if (a7 = Ch(g), null !== a7) {
                  if (b.flags |= 128, d = true, c = a7.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I)
                    return S(b), null;
                } else
                  2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
              f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f2.last, null !== c ? c.sibling = g : b.child = g, f2.last = g);
            }
            if (null !== f2.tail)
              return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
            S(b);
            return null;
          case 22:
          case 23:
            return Hj(), d = null !== b.memoizedState, null !== a7 && null !== a7.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
          case 24:
            return null;
          case 25:
            return null;
        }
        throw Error(p2(156, b.tag));
      }
      function Ij(a7, b) {
        wg(b);
        switch (b.tag) {
          case 1:
            return Zf(b.type) && $f(), a7 = b.flags, a7 & 65536 ? (b.flags = a7 & -65537 | 128, b) : null;
          case 3:
            return zh(), E(Wf), E(H), Eh(), a7 = b.flags, 0 !== (a7 & 65536) && 0 === (a7 & 128) ? (b.flags = a7 & -65537 | 128, b) : null;
          case 5:
            return Bh(b), null;
          case 13:
            E(L);
            a7 = b.memoizedState;
            if (null !== a7 && null !== a7.dehydrated) {
              if (null === b.alternate)
                throw Error(p2(340));
              Ig();
            }
            a7 = b.flags;
            return a7 & 65536 ? (b.flags = a7 & -65537 | 128, b) : null;
          case 19:
            return E(L), null;
          case 4:
            return zh(), null;
          case 10:
            return ah(b.type._context), null;
          case 22:
          case 23:
            return Hj(), null;
          case 24:
            return null;
          default:
            return null;
        }
      }
      var Jj = false;
      var U = false;
      var Kj = "function" === typeof WeakSet ? WeakSet : Set;
      var V = null;
      function Lj(a7, b) {
        var c = a7.ref;
        if (null !== c)
          if ("function" === typeof c)
            try {
              c(null);
            } catch (d) {
              W(a7, b, d);
            }
          else
            c.current = null;
      }
      function Mj(a7, b, c) {
        try {
          c();
        } catch (d) {
          W(a7, b, d);
        }
      }
      var Nj = false;
      function Oj(a7, b) {
        Cf = dd;
        a7 = Me();
        if (Ne(a7)) {
          if ("selectionStart" in a7)
            var c = { start: a7.selectionStart, end: a7.selectionEnd };
          else
            a: {
              c = (c = a7.ownerDocument) && c.defaultView || window;
              var d = c.getSelection && c.getSelection();
              if (d && 0 !== d.rangeCount) {
                c = d.anchorNode;
                var e8 = d.anchorOffset, f2 = d.focusNode;
                d = d.focusOffset;
                try {
                  c.nodeType, f2.nodeType;
                } catch (F) {
                  c = null;
                  break a;
                }
                var g = 0, h = -1, k = -1, l = 0, m2 = 0, q = a7, r2 = null;
                b:
                  for (; ; ) {
                    for (var y; ; ) {
                      q !== c || 0 !== e8 && 3 !== q.nodeType || (h = g + e8);
                      q !== f2 || 0 !== d && 3 !== q.nodeType || (k = g + d);
                      3 === q.nodeType && (g += q.nodeValue.length);
                      if (null === (y = q.firstChild))
                        break;
                      r2 = q;
                      q = y;
                    }
                    for (; ; ) {
                      if (q === a7)
                        break b;
                      r2 === c && ++l === e8 && (h = g);
                      r2 === f2 && ++m2 === d && (k = g);
                      if (null !== (y = q.nextSibling))
                        break;
                      q = r2;
                      r2 = q.parentNode;
                    }
                    q = y;
                  }
                c = -1 === h || -1 === k ? null : { start: h, end: k };
              } else
                c = null;
            }
          c = c || { start: 0, end: 0 };
        } else
          c = null;
        Df = { focusedElem: a7, selectionRange: c };
        dd = false;
        for (V = b; null !== V; )
          if (b = V, a7 = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a7)
            a7.return = b, V = a7;
          else
            for (; null !== V; ) {
              b = V;
              try {
                var n3 = b.alternate;
                if (0 !== (b.flags & 1024))
                  switch (b.tag) {
                    case 0:
                    case 11:
                    case 15:
                      break;
                    case 1:
                      if (null !== n3) {
                        var t2 = n3.memoizedProps, J = n3.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J);
                        x.__reactInternalSnapshotBeforeUpdate = w;
                      }
                      break;
                    case 3:
                      var u = b.stateNode.containerInfo;
                      1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
                      break;
                    case 5:
                    case 6:
                    case 4:
                    case 17:
                      break;
                    default:
                      throw Error(p2(163));
                  }
              } catch (F) {
                W(b, b.return, F);
              }
              a7 = b.sibling;
              if (null !== a7) {
                a7.return = b.return;
                V = a7;
                break;
              }
              V = b.return;
            }
        n3 = Nj;
        Nj = false;
        return n3;
      }
      function Pj(a7, b, c) {
        var d = b.updateQueue;
        d = null !== d ? d.lastEffect : null;
        if (null !== d) {
          var e8 = d = d.next;
          do {
            if ((e8.tag & a7) === a7) {
              var f2 = e8.destroy;
              e8.destroy = void 0;
              void 0 !== f2 && Mj(b, c, f2);
            }
            e8 = e8.next;
          } while (e8 !== d);
        }
      }
      function Qj(a7, b) {
        b = b.updateQueue;
        b = null !== b ? b.lastEffect : null;
        if (null !== b) {
          var c = b = b.next;
          do {
            if ((c.tag & a7) === a7) {
              var d = c.create;
              c.destroy = d();
            }
            c = c.next;
          } while (c !== b);
        }
      }
      function Rj(a7) {
        var b = a7.ref;
        if (null !== b) {
          var c = a7.stateNode;
          switch (a7.tag) {
            case 5:
              a7 = c;
              break;
            default:
              a7 = c;
          }
          "function" === typeof b ? b(a7) : b.current = a7;
        }
      }
      function Sj(a7) {
        var b = a7.alternate;
        null !== b && (a7.alternate = null, Sj(b));
        a7.child = null;
        a7.deletions = null;
        a7.sibling = null;
        5 === a7.tag && (b = a7.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
        a7.stateNode = null;
        a7.return = null;
        a7.dependencies = null;
        a7.memoizedProps = null;
        a7.memoizedState = null;
        a7.pendingProps = null;
        a7.stateNode = null;
        a7.updateQueue = null;
      }
      function Tj(a7) {
        return 5 === a7.tag || 3 === a7.tag || 4 === a7.tag;
      }
      function Uj(a7) {
        a:
          for (; ; ) {
            for (; null === a7.sibling; ) {
              if (null === a7.return || Tj(a7.return))
                return null;
              a7 = a7.return;
            }
            a7.sibling.return = a7.return;
            for (a7 = a7.sibling; 5 !== a7.tag && 6 !== a7.tag && 18 !== a7.tag; ) {
              if (a7.flags & 2)
                continue a;
              if (null === a7.child || 4 === a7.tag)
                continue a;
              else
                a7.child.return = a7, a7 = a7.child;
            }
            if (!(a7.flags & 2))
              return a7.stateNode;
          }
      }
      function Vj(a7, b, c) {
        var d = a7.tag;
        if (5 === d || 6 === d)
          a7 = a7.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a7, b) : c.insertBefore(a7, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a7, c)) : (b = c, b.appendChild(a7)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
        else if (4 !== d && (a7 = a7.child, null !== a7))
          for (Vj(a7, b, c), a7 = a7.sibling; null !== a7; )
            Vj(a7, b, c), a7 = a7.sibling;
      }
      function Wj(a7, b, c) {
        var d = a7.tag;
        if (5 === d || 6 === d)
          a7 = a7.stateNode, b ? c.insertBefore(a7, b) : c.appendChild(a7);
        else if (4 !== d && (a7 = a7.child, null !== a7))
          for (Wj(a7, b, c), a7 = a7.sibling; null !== a7; )
            Wj(a7, b, c), a7 = a7.sibling;
      }
      var X = null;
      var Xj = false;
      function Yj(a7, b, c) {
        for (c = c.child; null !== c; )
          Zj(a7, b, c), c = c.sibling;
      }
      function Zj(a7, b, c) {
        if (lc && "function" === typeof lc.onCommitFiberUnmount)
          try {
            lc.onCommitFiberUnmount(kc, c);
          } catch (h) {
          }
        switch (c.tag) {
          case 5:
            U || Lj(c, b);
          case 6:
            var d = X, e8 = Xj;
            X = null;
            Yj(a7, b, c);
            X = d;
            Xj = e8;
            null !== X && (Xj ? (a7 = X, c = c.stateNode, 8 === a7.nodeType ? a7.parentNode.removeChild(c) : a7.removeChild(c)) : X.removeChild(c.stateNode));
            break;
          case 18:
            null !== X && (Xj ? (a7 = X, c = c.stateNode, 8 === a7.nodeType ? Kf(a7.parentNode, c) : 1 === a7.nodeType && Kf(a7, c), bd(a7)) : Kf(X, c.stateNode));
            break;
          case 4:
            d = X;
            e8 = Xj;
            X = c.stateNode.containerInfo;
            Xj = true;
            Yj(a7, b, c);
            X = d;
            Xj = e8;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
              e8 = d = d.next;
              do {
                var f2 = e8, g = f2.destroy;
                f2 = f2.tag;
                void 0 !== g && (0 !== (f2 & 2) ? Mj(c, b, g) : 0 !== (f2 & 4) && Mj(c, b, g));
                e8 = e8.next;
              } while (e8 !== d);
            }
            Yj(a7, b, c);
            break;
          case 1:
            if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount))
              try {
                d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
              } catch (h) {
                W(c, b, h);
              }
            Yj(a7, b, c);
            break;
          case 21:
            Yj(a7, b, c);
            break;
          case 22:
            c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a7, b, c), U = d) : Yj(a7, b, c);
            break;
          default:
            Yj(a7, b, c);
        }
      }
      function ak(a7) {
        var b = a7.updateQueue;
        if (null !== b) {
          a7.updateQueue = null;
          var c = a7.stateNode;
          null === c && (c = a7.stateNode = new Kj());
          b.forEach(function(b2) {
            var d = bk.bind(null, a7, b2);
            c.has(b2) || (c.add(b2), b2.then(d, d));
          });
        }
      }
      function ck(a7, b) {
        var c = b.deletions;
        if (null !== c)
          for (var d = 0; d < c.length; d++) {
            var e8 = c[d];
            try {
              var f2 = a7, g = b, h = g;
              a:
                for (; null !== h; ) {
                  switch (h.tag) {
                    case 5:
                      X = h.stateNode;
                      Xj = false;
                      break a;
                    case 3:
                      X = h.stateNode.containerInfo;
                      Xj = true;
                      break a;
                    case 4:
                      X = h.stateNode.containerInfo;
                      Xj = true;
                      break a;
                  }
                  h = h.return;
                }
              if (null === X)
                throw Error(p2(160));
              Zj(f2, g, e8);
              X = null;
              Xj = false;
              var k = e8.alternate;
              null !== k && (k.return = null);
              e8.return = null;
            } catch (l) {
              W(e8, b, l);
            }
          }
        if (b.subtreeFlags & 12854)
          for (b = b.child; null !== b; )
            dk(b, a7), b = b.sibling;
      }
      function dk(a7, b) {
        var c = a7.alternate, d = a7.flags;
        switch (a7.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            ck(b, a7);
            ek(a7);
            if (d & 4) {
              try {
                Pj(3, a7, a7.return), Qj(3, a7);
              } catch (t2) {
                W(a7, a7.return, t2);
              }
              try {
                Pj(5, a7, a7.return);
              } catch (t2) {
                W(a7, a7.return, t2);
              }
            }
            break;
          case 1:
            ck(b, a7);
            ek(a7);
            d & 512 && null !== c && Lj(c, c.return);
            break;
          case 5:
            ck(b, a7);
            ek(a7);
            d & 512 && null !== c && Lj(c, c.return);
            if (a7.flags & 32) {
              var e8 = a7.stateNode;
              try {
                ob(e8, "");
              } catch (t2) {
                W(a7, a7.return, t2);
              }
            }
            if (d & 4 && (e8 = a7.stateNode, null != e8)) {
              var f2 = a7.memoizedProps, g = null !== c ? c.memoizedProps : f2, h = a7.type, k = a7.updateQueue;
              a7.updateQueue = null;
              if (null !== k)
                try {
                  "input" === h && "radio" === f2.type && null != f2.name && ab(e8, f2);
                  vb(h, g);
                  var l = vb(h, f2);
                  for (g = 0; g < k.length; g += 2) {
                    var m2 = k[g], q = k[g + 1];
                    "style" === m2 ? sb(e8, q) : "dangerouslySetInnerHTML" === m2 ? nb(e8, q) : "children" === m2 ? ob(e8, q) : ta(e8, m2, q, l);
                  }
                  switch (h) {
                    case "input":
                      bb(e8, f2);
                      break;
                    case "textarea":
                      ib(e8, f2);
                      break;
                    case "select":
                      var r2 = e8._wrapperState.wasMultiple;
                      e8._wrapperState.wasMultiple = !!f2.multiple;
                      var y = f2.value;
                      null != y ? fb(e8, !!f2.multiple, y, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                        e8,
                        !!f2.multiple,
                        f2.defaultValue,
                        true
                      ) : fb(e8, !!f2.multiple, f2.multiple ? [] : "", false));
                  }
                  e8[Pf] = f2;
                } catch (t2) {
                  W(a7, a7.return, t2);
                }
            }
            break;
          case 6:
            ck(b, a7);
            ek(a7);
            if (d & 4) {
              if (null === a7.stateNode)
                throw Error(p2(162));
              e8 = a7.stateNode;
              f2 = a7.memoizedProps;
              try {
                e8.nodeValue = f2;
              } catch (t2) {
                W(a7, a7.return, t2);
              }
            }
            break;
          case 3:
            ck(b, a7);
            ek(a7);
            if (d & 4 && null !== c && c.memoizedState.isDehydrated)
              try {
                bd(b.containerInfo);
              } catch (t2) {
                W(a7, a7.return, t2);
              }
            break;
          case 4:
            ck(b, a7);
            ek(a7);
            break;
          case 13:
            ck(b, a7);
            ek(a7);
            e8 = a7.child;
            e8.flags & 8192 && (f2 = null !== e8.memoizedState, e8.stateNode.isHidden = f2, !f2 || null !== e8.alternate && null !== e8.alternate.memoizedState || (fk = B()));
            d & 4 && ak(a7);
            break;
          case 22:
            m2 = null !== c && null !== c.memoizedState;
            a7.mode & 1 ? (U = (l = U) || m2, ck(b, a7), U = l) : ck(b, a7);
            ek(a7);
            if (d & 8192) {
              l = null !== a7.memoizedState;
              if ((a7.stateNode.isHidden = l) && !m2 && 0 !== (a7.mode & 1))
                for (V = a7, m2 = a7.child; null !== m2; ) {
                  for (q = V = m2; null !== V; ) {
                    r2 = V;
                    y = r2.child;
                    switch (r2.tag) {
                      case 0:
                      case 11:
                      case 14:
                      case 15:
                        Pj(4, r2, r2.return);
                        break;
                      case 1:
                        Lj(r2, r2.return);
                        var n3 = r2.stateNode;
                        if ("function" === typeof n3.componentWillUnmount) {
                          d = r2;
                          c = r2.return;
                          try {
                            b = d, n3.props = b.memoizedProps, n3.state = b.memoizedState, n3.componentWillUnmount();
                          } catch (t2) {
                            W(d, c, t2);
                          }
                        }
                        break;
                      case 5:
                        Lj(r2, r2.return);
                        break;
                      case 22:
                        if (null !== r2.memoizedState) {
                          gk(q);
                          continue;
                        }
                    }
                    null !== y ? (y.return = r2, V = y) : gk(q);
                  }
                  m2 = m2.sibling;
                }
              a:
                for (m2 = null, q = a7; ; ) {
                  if (5 === q.tag) {
                    if (null === m2) {
                      m2 = q;
                      try {
                        e8 = q.stateNode, l ? (f2 = e8.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                      } catch (t2) {
                        W(a7, a7.return, t2);
                      }
                    }
                  } else if (6 === q.tag) {
                    if (null === m2)
                      try {
                        q.stateNode.nodeValue = l ? "" : q.memoizedProps;
                      } catch (t2) {
                        W(a7, a7.return, t2);
                      }
                  } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a7) && null !== q.child) {
                    q.child.return = q;
                    q = q.child;
                    continue;
                  }
                  if (q === a7)
                    break a;
                  for (; null === q.sibling; ) {
                    if (null === q.return || q.return === a7)
                      break a;
                    m2 === q && (m2 = null);
                    q = q.return;
                  }
                  m2 === q && (m2 = null);
                  q.sibling.return = q.return;
                  q = q.sibling;
                }
            }
            break;
          case 19:
            ck(b, a7);
            ek(a7);
            d & 4 && ak(a7);
            break;
          case 21:
            break;
          default:
            ck(
              b,
              a7
            ), ek(a7);
        }
      }
      function ek(a7) {
        var b = a7.flags;
        if (b & 2) {
          try {
            a: {
              for (var c = a7.return; null !== c; ) {
                if (Tj(c)) {
                  var d = c;
                  break a;
                }
                c = c.return;
              }
              throw Error(p2(160));
            }
            switch (d.tag) {
              case 5:
                var e8 = d.stateNode;
                d.flags & 32 && (ob(e8, ""), d.flags &= -33);
                var f2 = Uj(a7);
                Wj(a7, f2, e8);
                break;
              case 3:
              case 4:
                var g = d.stateNode.containerInfo, h = Uj(a7);
                Vj(a7, h, g);
                break;
              default:
                throw Error(p2(161));
            }
          } catch (k) {
            W(a7, a7.return, k);
          }
          a7.flags &= -3;
        }
        b & 4096 && (a7.flags &= -4097);
      }
      function hk(a7, b, c) {
        V = a7;
        ik(a7, b, c);
      }
      function ik(a7, b, c) {
        for (var d = 0 !== (a7.mode & 1); null !== V; ) {
          var e8 = V, f2 = e8.child;
          if (22 === e8.tag && d) {
            var g = null !== e8.memoizedState || Jj;
            if (!g) {
              var h = e8.alternate, k = null !== h && null !== h.memoizedState || U;
              h = Jj;
              var l = U;
              Jj = g;
              if ((U = k) && !l)
                for (V = e8; null !== V; )
                  g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e8) : null !== k ? (k.return = g, V = k) : jk(e8);
              for (; null !== f2; )
                V = f2, ik(f2, b, c), f2 = f2.sibling;
              V = e8;
              Jj = h;
              U = l;
            }
            kk(a7, b, c);
          } else
            0 !== (e8.subtreeFlags & 8772) && null !== f2 ? (f2.return = e8, V = f2) : kk(a7, b, c);
        }
      }
      function kk(a7) {
        for (; null !== V; ) {
          var b = V;
          if (0 !== (b.flags & 8772)) {
            var c = b.alternate;
            try {
              if (0 !== (b.flags & 8772))
                switch (b.tag) {
                  case 0:
                  case 11:
                  case 15:
                    U || Qj(5, b);
                    break;
                  case 1:
                    var d = b.stateNode;
                    if (b.flags & 4 && !U)
                      if (null === c)
                        d.componentDidMount();
                      else {
                        var e8 = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                        d.componentDidUpdate(e8, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
                      }
                    var f2 = b.updateQueue;
                    null !== f2 && sh(b, f2, d);
                    break;
                  case 3:
                    var g = b.updateQueue;
                    if (null !== g) {
                      c = null;
                      if (null !== b.child)
                        switch (b.child.tag) {
                          case 5:
                            c = b.child.stateNode;
                            break;
                          case 1:
                            c = b.child.stateNode;
                        }
                      sh(b, g, c);
                    }
                    break;
                  case 5:
                    var h = b.stateNode;
                    if (null === c && b.flags & 4) {
                      c = h;
                      var k = b.memoizedProps;
                      switch (b.type) {
                        case "button":
                        case "input":
                        case "select":
                        case "textarea":
                          k.autoFocus && c.focus();
                          break;
                        case "img":
                          k.src && (c.src = k.src);
                      }
                    }
                    break;
                  case 6:
                    break;
                  case 4:
                    break;
                  case 12:
                    break;
                  case 13:
                    if (null === b.memoizedState) {
                      var l = b.alternate;
                      if (null !== l) {
                        var m2 = l.memoizedState;
                        if (null !== m2) {
                          var q = m2.dehydrated;
                          null !== q && bd(q);
                        }
                      }
                    }
                    break;
                  case 19:
                  case 17:
                  case 21:
                  case 22:
                  case 23:
                  case 25:
                    break;
                  default:
                    throw Error(p2(163));
                }
              U || b.flags & 512 && Rj(b);
            } catch (r2) {
              W(b, b.return, r2);
            }
          }
          if (b === a7) {
            V = null;
            break;
          }
          c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function gk(a7) {
        for (; null !== V; ) {
          var b = V;
          if (b === a7) {
            V = null;
            break;
          }
          var c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function jk(a7) {
        for (; null !== V; ) {
          var b = V;
          try {
            switch (b.tag) {
              case 0:
              case 11:
              case 15:
                var c = b.return;
                try {
                  Qj(4, b);
                } catch (k) {
                  W(b, c, k);
                }
                break;
              case 1:
                var d = b.stateNode;
                if ("function" === typeof d.componentDidMount) {
                  var e8 = b.return;
                  try {
                    d.componentDidMount();
                  } catch (k) {
                    W(b, e8, k);
                  }
                }
                var f2 = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, f2, k);
                }
                break;
              case 5:
                var g = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, g, k);
                }
            }
          } catch (k) {
            W(b, b.return, k);
          }
          if (b === a7) {
            V = null;
            break;
          }
          var h = b.sibling;
          if (null !== h) {
            h.return = b.return;
            V = h;
            break;
          }
          V = b.return;
        }
      }
      var lk = Math.ceil;
      var mk = ua.ReactCurrentDispatcher;
      var nk = ua.ReactCurrentOwner;
      var ok = ua.ReactCurrentBatchConfig;
      var K = 0;
      var Q = null;
      var Y = null;
      var Z = 0;
      var fj = 0;
      var ej = Uf(0);
      var T = 0;
      var pk = null;
      var rh = 0;
      var qk = 0;
      var rk = 0;
      var sk = null;
      var tk = null;
      var fk = 0;
      var Gj = Infinity;
      var uk = null;
      var Oi = false;
      var Pi = null;
      var Ri = null;
      var vk = false;
      var wk = null;
      var xk = 0;
      var yk = 0;
      var zk = null;
      var Ak = -1;
      var Bk = 0;
      function R() {
        return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
      }
      function yi(a7) {
        if (0 === (a7.mode & 1))
          return 1;
        if (0 !== (K & 2) && 0 !== Z)
          return Z & -Z;
        if (null !== Kg.transition)
          return 0 === Bk && (Bk = yc()), Bk;
        a7 = C;
        if (0 !== a7)
          return a7;
        a7 = window.event;
        a7 = void 0 === a7 ? 16 : jd(a7.type);
        return a7;
      }
      function gi(a7, b, c, d) {
        if (50 < yk)
          throw yk = 0, zk = null, Error(p2(185));
        Ac(a7, c, d);
        if (0 === (K & 2) || a7 !== Q)
          a7 === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a7, Z)), Dk(a7, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
      }
      function Dk(a7, b) {
        var c = a7.callbackNode;
        wc(a7, b);
        var d = uc(a7, a7 === Q ? Z : 0);
        if (0 === d)
          null !== c && bc(c), a7.callbackNode = null, a7.callbackPriority = 0;
        else if (b = d & -d, a7.callbackPriority !== b) {
          null != c && bc(c);
          if (1 === b)
            0 === a7.tag ? ig(Ek.bind(null, a7)) : hg(Ek.bind(null, a7)), Jf(function() {
              0 === (K & 6) && jg();
            }), c = null;
          else {
            switch (Dc(d)) {
              case 1:
                c = fc;
                break;
              case 4:
                c = gc;
                break;
              case 16:
                c = hc;
                break;
              case 536870912:
                c = jc;
                break;
              default:
                c = hc;
            }
            c = Fk(c, Gk.bind(null, a7));
          }
          a7.callbackPriority = b;
          a7.callbackNode = c;
        }
      }
      function Gk(a7, b) {
        Ak = -1;
        Bk = 0;
        if (0 !== (K & 6))
          throw Error(p2(327));
        var c = a7.callbackNode;
        if (Hk() && a7.callbackNode !== c)
          return null;
        var d = uc(a7, a7 === Q ? Z : 0);
        if (0 === d)
          return null;
        if (0 !== (d & 30) || 0 !== (d & a7.expiredLanes) || b)
          b = Ik(a7, d);
        else {
          b = d;
          var e8 = K;
          K |= 2;
          var f2 = Jk();
          if (Q !== a7 || Z !== b)
            uk = null, Gj = B() + 500, Kk(a7, b);
          do
            try {
              Lk();
              break;
            } catch (h) {
              Mk(a7, h);
            }
          while (1);
          $g();
          mk.current = f2;
          K = e8;
          null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
        }
        if (0 !== b) {
          2 === b && (e8 = xc(a7), 0 !== e8 && (d = e8, b = Nk(a7, e8)));
          if (1 === b)
            throw c = pk, Kk(a7, 0), Ck(a7, d), Dk(a7, B()), c;
          if (6 === b)
            Ck(a7, d);
          else {
            e8 = a7.current.alternate;
            if (0 === (d & 30) && !Ok(e8) && (b = Ik(a7, d), 2 === b && (f2 = xc(a7), 0 !== f2 && (d = f2, b = Nk(a7, f2))), 1 === b))
              throw c = pk, Kk(a7, 0), Ck(a7, d), Dk(a7, B()), c;
            a7.finishedWork = e8;
            a7.finishedLanes = d;
            switch (b) {
              case 0:
              case 1:
                throw Error(p2(345));
              case 2:
                Pk(a7, tk, uk);
                break;
              case 3:
                Ck(a7, d);
                if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
                  if (0 !== uc(a7, 0))
                    break;
                  e8 = a7.suspendedLanes;
                  if ((e8 & d) !== d) {
                    R();
                    a7.pingedLanes |= a7.suspendedLanes & e8;
                    break;
                  }
                  a7.timeoutHandle = Ff(Pk.bind(null, a7, tk, uk), b);
                  break;
                }
                Pk(a7, tk, uk);
                break;
              case 4:
                Ck(a7, d);
                if ((d & 4194240) === d)
                  break;
                b = a7.eventTimes;
                for (e8 = -1; 0 < d; ) {
                  var g = 31 - oc(d);
                  f2 = 1 << g;
                  g = b[g];
                  g > e8 && (e8 = g);
                  d &= ~f2;
                }
                d = e8;
                d = B() - d;
                d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
                if (10 < d) {
                  a7.timeoutHandle = Ff(Pk.bind(null, a7, tk, uk), d);
                  break;
                }
                Pk(a7, tk, uk);
                break;
              case 5:
                Pk(a7, tk, uk);
                break;
              default:
                throw Error(p2(329));
            }
          }
        }
        Dk(a7, B());
        return a7.callbackNode === c ? Gk.bind(null, a7) : null;
      }
      function Nk(a7, b) {
        var c = sk;
        a7.current.memoizedState.isDehydrated && (Kk(a7, b).flags |= 256);
        a7 = Ik(a7, b);
        2 !== a7 && (b = tk, tk = c, null !== b && Fj(b));
        return a7;
      }
      function Fj(a7) {
        null === tk ? tk = a7 : tk.push.apply(tk, a7);
      }
      function Ok(a7) {
        for (var b = a7; ; ) {
          if (b.flags & 16384) {
            var c = b.updateQueue;
            if (null !== c && (c = c.stores, null !== c))
              for (var d = 0; d < c.length; d++) {
                var e8 = c[d], f2 = e8.getSnapshot;
                e8 = e8.value;
                try {
                  if (!He(f2(), e8))
                    return false;
                } catch (g) {
                  return false;
                }
              }
          }
          c = b.child;
          if (b.subtreeFlags & 16384 && null !== c)
            c.return = b, b = c;
          else {
            if (b === a7)
              break;
            for (; null === b.sibling; ) {
              if (null === b.return || b.return === a7)
                return true;
              b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
          }
        }
        return true;
      }
      function Ck(a7, b) {
        b &= ~rk;
        b &= ~qk;
        a7.suspendedLanes |= b;
        a7.pingedLanes &= ~b;
        for (a7 = a7.expirationTimes; 0 < b; ) {
          var c = 31 - oc(b), d = 1 << c;
          a7[c] = -1;
          b &= ~d;
        }
      }
      function Ek(a7) {
        if (0 !== (K & 6))
          throw Error(p2(327));
        Hk();
        var b = uc(a7, 0);
        if (0 === (b & 1))
          return Dk(a7, B()), null;
        var c = Ik(a7, b);
        if (0 !== a7.tag && 2 === c) {
          var d = xc(a7);
          0 !== d && (b = d, c = Nk(a7, d));
        }
        if (1 === c)
          throw c = pk, Kk(a7, 0), Ck(a7, b), Dk(a7, B()), c;
        if (6 === c)
          throw Error(p2(345));
        a7.finishedWork = a7.current.alternate;
        a7.finishedLanes = b;
        Pk(a7, tk, uk);
        Dk(a7, B());
        return null;
      }
      function Qk(a7, b) {
        var c = K;
        K |= 1;
        try {
          return a7(b);
        } finally {
          K = c, 0 === K && (Gj = B() + 500, fg && jg());
        }
      }
      function Rk(a7) {
        null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
        var b = K;
        K |= 1;
        var c = ok.transition, d = C;
        try {
          if (ok.transition = null, C = 1, a7)
            return a7();
        } finally {
          C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
        }
      }
      function Hj() {
        fj = ej.current;
        E(ej);
      }
      function Kk(a7, b) {
        a7.finishedWork = null;
        a7.finishedLanes = 0;
        var c = a7.timeoutHandle;
        -1 !== c && (a7.timeoutHandle = -1, Gf(c));
        if (null !== Y)
          for (c = Y.return; null !== c; ) {
            var d = c;
            wg(d);
            switch (d.tag) {
              case 1:
                d = d.type.childContextTypes;
                null !== d && void 0 !== d && $f();
                break;
              case 3:
                zh();
                E(Wf);
                E(H);
                Eh();
                break;
              case 5:
                Bh(d);
                break;
              case 4:
                zh();
                break;
              case 13:
                E(L);
                break;
              case 19:
                E(L);
                break;
              case 10:
                ah(d.type._context);
                break;
              case 22:
              case 23:
                Hj();
            }
            c = c.return;
          }
        Q = a7;
        Y = a7 = Pg(a7.current, null);
        Z = fj = b;
        T = 0;
        pk = null;
        rk = qk = rh = 0;
        tk = sk = null;
        if (null !== fh) {
          for (b = 0; b < fh.length; b++)
            if (c = fh[b], d = c.interleaved, null !== d) {
              c.interleaved = null;
              var e8 = d.next, f2 = c.pending;
              if (null !== f2) {
                var g = f2.next;
                f2.next = e8;
                d.next = g;
              }
              c.pending = d;
            }
          fh = null;
        }
        return a7;
      }
      function Mk(a7, b) {
        do {
          var c = Y;
          try {
            $g();
            Fh.current = Rh;
            if (Ih) {
              for (var d = M.memoizedState; null !== d; ) {
                var e8 = d.queue;
                null !== e8 && (e8.pending = null);
                d = d.next;
              }
              Ih = false;
            }
            Hh = 0;
            O = N = M = null;
            Jh = false;
            Kh = 0;
            nk.current = null;
            if (null === c || null === c.return) {
              T = 1;
              pk = b;
              Y = null;
              break;
            }
            a: {
              var f2 = a7, g = c.return, h = c, k = b;
              b = Z;
              h.flags |= 32768;
              if (null !== k && "object" === typeof k && "function" === typeof k.then) {
                var l = k, m2 = h, q = m2.tag;
                if (0 === (m2.mode & 1) && (0 === q || 11 === q || 15 === q)) {
                  var r2 = m2.alternate;
                  r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
                }
                var y = Ui(g);
                if (null !== y) {
                  y.flags &= -257;
                  Vi(y, g, h, f2, b);
                  y.mode & 1 && Si(f2, l, b);
                  b = y;
                  k = l;
                  var n3 = b.updateQueue;
                  if (null === n3) {
                    var t2 = /* @__PURE__ */ new Set();
                    t2.add(k);
                    b.updateQueue = t2;
                  } else
                    n3.add(k);
                  break a;
                } else {
                  if (0 === (b & 1)) {
                    Si(f2, l, b);
                    tj();
                    break a;
                  }
                  k = Error(p2(426));
                }
              } else if (I && h.mode & 1) {
                var J = Ui(g);
                if (null !== J) {
                  0 === (J.flags & 65536) && (J.flags |= 256);
                  Vi(J, g, h, f2, b);
                  Jg(Ji(k, h));
                  break a;
                }
              }
              f2 = k = Ji(k, h);
              4 !== T && (T = 2);
              null === sk ? sk = [f2] : sk.push(f2);
              f2 = g;
              do {
                switch (f2.tag) {
                  case 3:
                    f2.flags |= 65536;
                    b &= -b;
                    f2.lanes |= b;
                    var x = Ni(f2, k, b);
                    ph(f2, x);
                    break a;
                  case 1:
                    h = k;
                    var w = f2.type, u = f2.stateNode;
                    if (0 === (f2.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                      f2.flags |= 65536;
                      b &= -b;
                      f2.lanes |= b;
                      var F = Qi(f2, h, b);
                      ph(f2, F);
                      break a;
                    }
                }
                f2 = f2.return;
              } while (null !== f2);
            }
            Sk(c);
          } catch (na) {
            b = na;
            Y === c && null !== c && (Y = c = c.return);
            continue;
          }
          break;
        } while (1);
      }
      function Jk() {
        var a7 = mk.current;
        mk.current = Rh;
        return null === a7 ? Rh : a7;
      }
      function tj() {
        if (0 === T || 3 === T || 2 === T)
          T = 4;
        null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
      }
      function Ik(a7, b) {
        var c = K;
        K |= 2;
        var d = Jk();
        if (Q !== a7 || Z !== b)
          uk = null, Kk(a7, b);
        do
          try {
            Tk();
            break;
          } catch (e8) {
            Mk(a7, e8);
          }
        while (1);
        $g();
        K = c;
        mk.current = d;
        if (null !== Y)
          throw Error(p2(261));
        Q = null;
        Z = 0;
        return T;
      }
      function Tk() {
        for (; null !== Y; )
          Uk(Y);
      }
      function Lk() {
        for (; null !== Y && !cc(); )
          Uk(Y);
      }
      function Uk(a7) {
        var b = Vk(a7.alternate, a7, fj);
        a7.memoizedProps = a7.pendingProps;
        null === b ? Sk(a7) : Y = b;
        nk.current = null;
      }
      function Sk(a7) {
        var b = a7;
        do {
          var c = b.alternate;
          a7 = b.return;
          if (0 === (b.flags & 32768)) {
            if (c = Ej(c, b, fj), null !== c) {
              Y = c;
              return;
            }
          } else {
            c = Ij(c, b);
            if (null !== c) {
              c.flags &= 32767;
              Y = c;
              return;
            }
            if (null !== a7)
              a7.flags |= 32768, a7.subtreeFlags = 0, a7.deletions = null;
            else {
              T = 6;
              Y = null;
              return;
            }
          }
          b = b.sibling;
          if (null !== b) {
            Y = b;
            return;
          }
          Y = b = a7;
        } while (null !== b);
        0 === T && (T = 5);
      }
      function Pk(a7, b, c) {
        var d = C, e8 = ok.transition;
        try {
          ok.transition = null, C = 1, Wk(a7, b, c, d);
        } finally {
          ok.transition = e8, C = d;
        }
        return null;
      }
      function Wk(a7, b, c, d) {
        do
          Hk();
        while (null !== wk);
        if (0 !== (K & 6))
          throw Error(p2(327));
        c = a7.finishedWork;
        var e8 = a7.finishedLanes;
        if (null === c)
          return null;
        a7.finishedWork = null;
        a7.finishedLanes = 0;
        if (c === a7.current)
          throw Error(p2(177));
        a7.callbackNode = null;
        a7.callbackPriority = 0;
        var f2 = c.lanes | c.childLanes;
        Bc(a7, f2);
        a7 === Q && (Y = Q = null, Z = 0);
        0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
          Hk();
          return null;
        }));
        f2 = 0 !== (c.flags & 15990);
        if (0 !== (c.subtreeFlags & 15990) || f2) {
          f2 = ok.transition;
          ok.transition = null;
          var g = C;
          C = 1;
          var h = K;
          K |= 4;
          nk.current = null;
          Oj(a7, c);
          dk(c, a7);
          Oe(Df);
          dd = !!Cf;
          Df = Cf = null;
          a7.current = c;
          hk(c, a7, e8);
          dc();
          K = h;
          C = g;
          ok.transition = f2;
        } else
          a7.current = c;
        vk && (vk = false, wk = a7, xk = e8);
        f2 = a7.pendingLanes;
        0 === f2 && (Ri = null);
        mc(c.stateNode, d);
        Dk(a7, B());
        if (null !== b)
          for (d = a7.onRecoverableError, c = 0; c < b.length; c++)
            e8 = b[c], d(e8.value, { componentStack: e8.stack, digest: e8.digest });
        if (Oi)
          throw Oi = false, a7 = Pi, Pi = null, a7;
        0 !== (xk & 1) && 0 !== a7.tag && Hk();
        f2 = a7.pendingLanes;
        0 !== (f2 & 1) ? a7 === zk ? yk++ : (yk = 0, zk = a7) : yk = 0;
        jg();
        return null;
      }
      function Hk() {
        if (null !== wk) {
          var a7 = Dc(xk), b = ok.transition, c = C;
          try {
            ok.transition = null;
            C = 16 > a7 ? 16 : a7;
            if (null === wk)
              var d = false;
            else {
              a7 = wk;
              wk = null;
              xk = 0;
              if (0 !== (K & 6))
                throw Error(p2(331));
              var e8 = K;
              K |= 4;
              for (V = a7.current; null !== V; ) {
                var f2 = V, g = f2.child;
                if (0 !== (V.flags & 16)) {
                  var h = f2.deletions;
                  if (null !== h) {
                    for (var k = 0; k < h.length; k++) {
                      var l = h[k];
                      for (V = l; null !== V; ) {
                        var m2 = V;
                        switch (m2.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(8, m2, f2);
                        }
                        var q = m2.child;
                        if (null !== q)
                          q.return = m2, V = q;
                        else
                          for (; null !== V; ) {
                            m2 = V;
                            var r2 = m2.sibling, y = m2.return;
                            Sj(m2);
                            if (m2 === l) {
                              V = null;
                              break;
                            }
                            if (null !== r2) {
                              r2.return = y;
                              V = r2;
                              break;
                            }
                            V = y;
                          }
                      }
                    }
                    var n3 = f2.alternate;
                    if (null !== n3) {
                      var t2 = n3.child;
                      if (null !== t2) {
                        n3.child = null;
                        do {
                          var J = t2.sibling;
                          t2.sibling = null;
                          t2 = J;
                        } while (null !== t2);
                      }
                    }
                    V = f2;
                  }
                }
                if (0 !== (f2.subtreeFlags & 2064) && null !== g)
                  g.return = f2, V = g;
                else
                  b:
                    for (; null !== V; ) {
                      f2 = V;
                      if (0 !== (f2.flags & 2048))
                        switch (f2.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(9, f2, f2.return);
                        }
                      var x = f2.sibling;
                      if (null !== x) {
                        x.return = f2.return;
                        V = x;
                        break b;
                      }
                      V = f2.return;
                    }
              }
              var w = a7.current;
              for (V = w; null !== V; ) {
                g = V;
                var u = g.child;
                if (0 !== (g.subtreeFlags & 2064) && null !== u)
                  u.return = g, V = u;
                else
                  b:
                    for (g = w; null !== V; ) {
                      h = V;
                      if (0 !== (h.flags & 2048))
                        try {
                          switch (h.tag) {
                            case 0:
                            case 11:
                            case 15:
                              Qj(9, h);
                          }
                        } catch (na) {
                          W(h, h.return, na);
                        }
                      if (h === g) {
                        V = null;
                        break b;
                      }
                      var F = h.sibling;
                      if (null !== F) {
                        F.return = h.return;
                        V = F;
                        break b;
                      }
                      V = h.return;
                    }
              }
              K = e8;
              jg();
              if (lc && "function" === typeof lc.onPostCommitFiberRoot)
                try {
                  lc.onPostCommitFiberRoot(kc, a7);
                } catch (na) {
                }
              d = true;
            }
            return d;
          } finally {
            C = c, ok.transition = b;
          }
        }
        return false;
      }
      function Xk(a7, b, c) {
        b = Ji(c, b);
        b = Ni(a7, b, 1);
        a7 = nh(a7, b, 1);
        b = R();
        null !== a7 && (Ac(a7, 1, b), Dk(a7, b));
      }
      function W(a7, b, c) {
        if (3 === a7.tag)
          Xk(a7, a7, c);
        else
          for (; null !== b; ) {
            if (3 === b.tag) {
              Xk(b, a7, c);
              break;
            } else if (1 === b.tag) {
              var d = b.stateNode;
              if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
                a7 = Ji(c, a7);
                a7 = Qi(b, a7, 1);
                b = nh(b, a7, 1);
                a7 = R();
                null !== b && (Ac(b, 1, a7), Dk(b, a7));
                break;
              }
            }
            b = b.return;
          }
      }
      function Ti(a7, b, c) {
        var d = a7.pingCache;
        null !== d && d.delete(b);
        b = R();
        a7.pingedLanes |= a7.suspendedLanes & c;
        Q === a7 && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a7, 0) : rk |= c);
        Dk(a7, b);
      }
      function Yk(a7, b) {
        0 === b && (0 === (a7.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
        var c = R();
        a7 = ih(a7, b);
        null !== a7 && (Ac(a7, b, c), Dk(a7, c));
      }
      function uj(a7) {
        var b = a7.memoizedState, c = 0;
        null !== b && (c = b.retryLane);
        Yk(a7, c);
      }
      function bk(a7, b) {
        var c = 0;
        switch (a7.tag) {
          case 13:
            var d = a7.stateNode;
            var e8 = a7.memoizedState;
            null !== e8 && (c = e8.retryLane);
            break;
          case 19:
            d = a7.stateNode;
            break;
          default:
            throw Error(p2(314));
        }
        null !== d && d.delete(b);
        Yk(a7, c);
      }
      var Vk;
      Vk = function(a7, b, c) {
        if (null !== a7)
          if (a7.memoizedProps !== b.pendingProps || Wf.current)
            dh = true;
          else {
            if (0 === (a7.lanes & c) && 0 === (b.flags & 128))
              return dh = false, yj(a7, b, c);
            dh = 0 !== (a7.flags & 131072) ? true : false;
          }
        else
          dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
        b.lanes = 0;
        switch (b.tag) {
          case 2:
            var d = b.type;
            ij(a7, b);
            a7 = b.pendingProps;
            var e8 = Yf(b, H.current);
            ch(b, c);
            e8 = Nh(null, b, d, a7, e8, c);
            var f2 = Sh();
            b.flags |= 1;
            "object" === typeof e8 && null !== e8 && "function" === typeof e8.render && void 0 === e8.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e8.state && void 0 !== e8.state ? e8.state : null, kh(b), e8.updater = Ei, b.stateNode = e8, e8._reactInternals = b, Ii(b, d, a7, c), b = jj(null, b, d, true, f2, c)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e8, c), b = b.child);
            return b;
          case 16:
            d = b.elementType;
            a: {
              ij(a7, b);
              a7 = b.pendingProps;
              e8 = d._init;
              d = e8(d._payload);
              b.type = d;
              e8 = b.tag = Zk(d);
              a7 = Ci(d, a7);
              switch (e8) {
                case 0:
                  b = cj(null, b, d, a7, c);
                  break a;
                case 1:
                  b = hj(null, b, d, a7, c);
                  break a;
                case 11:
                  b = Yi(null, b, d, a7, c);
                  break a;
                case 14:
                  b = $i(null, b, d, Ci(d.type, a7), c);
                  break a;
              }
              throw Error(p2(
                306,
                d,
                ""
              ));
            }
            return b;
          case 0:
            return d = b.type, e8 = b.pendingProps, e8 = b.elementType === d ? e8 : Ci(d, e8), cj(a7, b, d, e8, c);
          case 1:
            return d = b.type, e8 = b.pendingProps, e8 = b.elementType === d ? e8 : Ci(d, e8), hj(a7, b, d, e8, c);
          case 3:
            a: {
              kj(b);
              if (null === a7)
                throw Error(p2(387));
              d = b.pendingProps;
              f2 = b.memoizedState;
              e8 = f2.element;
              lh(a7, b);
              qh(b, d, null, c);
              var g = b.memoizedState;
              d = g.element;
              if (f2.isDehydrated)
                if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
                  e8 = Ji(Error(p2(423)), b);
                  b = lj(a7, b, d, c, e8);
                  break a;
                } else if (d !== e8) {
                  e8 = Ji(Error(p2(424)), b);
                  b = lj(a7, b, d, c, e8);
                  break a;
                } else
                  for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; )
                    c.flags = c.flags & -3 | 4096, c = c.sibling;
              else {
                Ig();
                if (d === e8) {
                  b = Zi(a7, b, c);
                  break a;
                }
                Xi(a7, b, d, c);
              }
              b = b.child;
            }
            return b;
          case 5:
            return Ah(b), null === a7 && Eg(b), d = b.type, e8 = b.pendingProps, f2 = null !== a7 ? a7.memoizedProps : null, g = e8.children, Ef(d, e8) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a7, b), Xi(a7, b, g, c), b.child;
          case 6:
            return null === a7 && Eg(b), null;
          case 13:
            return oj(a7, b, c);
          case 4:
            return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a7 ? b.child = Ug(b, null, d, c) : Xi(a7, b, d, c), b.child;
          case 11:
            return d = b.type, e8 = b.pendingProps, e8 = b.elementType === d ? e8 : Ci(d, e8), Yi(a7, b, d, e8, c);
          case 7:
            return Xi(a7, b, b.pendingProps, c), b.child;
          case 8:
            return Xi(a7, b, b.pendingProps.children, c), b.child;
          case 12:
            return Xi(a7, b, b.pendingProps.children, c), b.child;
          case 10:
            a: {
              d = b.type._context;
              e8 = b.pendingProps;
              f2 = b.memoizedProps;
              g = e8.value;
              G(Wg, d._currentValue);
              d._currentValue = g;
              if (null !== f2)
                if (He(f2.value, g)) {
                  if (f2.children === e8.children && !Wf.current) {
                    b = Zi(a7, b, c);
                    break a;
                  }
                } else
                  for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
                    var h = f2.dependencies;
                    if (null !== h) {
                      g = f2.child;
                      for (var k = h.firstContext; null !== k; ) {
                        if (k.context === d) {
                          if (1 === f2.tag) {
                            k = mh(-1, c & -c);
                            k.tag = 2;
                            var l = f2.updateQueue;
                            if (null !== l) {
                              l = l.shared;
                              var m2 = l.pending;
                              null === m2 ? k.next = k : (k.next = m2.next, m2.next = k);
                              l.pending = k;
                            }
                          }
                          f2.lanes |= c;
                          k = f2.alternate;
                          null !== k && (k.lanes |= c);
                          bh(
                            f2.return,
                            c,
                            b
                          );
                          h.lanes |= c;
                          break;
                        }
                        k = k.next;
                      }
                    } else if (10 === f2.tag)
                      g = f2.type === b.type ? null : f2.child;
                    else if (18 === f2.tag) {
                      g = f2.return;
                      if (null === g)
                        throw Error(p2(341));
                      g.lanes |= c;
                      h = g.alternate;
                      null !== h && (h.lanes |= c);
                      bh(g, c, b);
                      g = f2.sibling;
                    } else
                      g = f2.child;
                    if (null !== g)
                      g.return = f2;
                    else
                      for (g = f2; null !== g; ) {
                        if (g === b) {
                          g = null;
                          break;
                        }
                        f2 = g.sibling;
                        if (null !== f2) {
                          f2.return = g.return;
                          g = f2;
                          break;
                        }
                        g = g.return;
                      }
                    f2 = g;
                  }
              Xi(a7, b, e8.children, c);
              b = b.child;
            }
            return b;
          case 9:
            return e8 = b.type, d = b.pendingProps.children, ch(b, c), e8 = eh(e8), d = d(e8), b.flags |= 1, Xi(a7, b, d, c), b.child;
          case 14:
            return d = b.type, e8 = Ci(d, b.pendingProps), e8 = Ci(d.type, e8), $i(a7, b, d, e8, c);
          case 15:
            return bj(a7, b, b.type, b.pendingProps, c);
          case 17:
            return d = b.type, e8 = b.pendingProps, e8 = b.elementType === d ? e8 : Ci(d, e8), ij(a7, b), b.tag = 1, Zf(d) ? (a7 = true, cg(b)) : a7 = false, ch(b, c), Gi(b, d, e8), Ii(b, d, e8, c), jj(null, b, d, true, a7, c);
          case 19:
            return xj(a7, b, c);
          case 22:
            return dj(a7, b, c);
        }
        throw Error(p2(156, b.tag));
      };
      function Fk(a7, b) {
        return ac(a7, b);
      }
      function $k(a7, b, c, d) {
        this.tag = a7;
        this.key = c;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.ref = null;
        this.pendingProps = b;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = d;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function Bg(a7, b, c, d) {
        return new $k(a7, b, c, d);
      }
      function aj(a7) {
        a7 = a7.prototype;
        return !(!a7 || !a7.isReactComponent);
      }
      function Zk(a7) {
        if ("function" === typeof a7)
          return aj(a7) ? 1 : 0;
        if (void 0 !== a7 && null !== a7) {
          a7 = a7.$$typeof;
          if (a7 === Da)
            return 11;
          if (a7 === Ga)
            return 14;
        }
        return 2;
      }
      function Pg(a7, b) {
        var c = a7.alternate;
        null === c ? (c = Bg(a7.tag, b, a7.key, a7.mode), c.elementType = a7.elementType, c.type = a7.type, c.stateNode = a7.stateNode, c.alternate = a7, a7.alternate = c) : (c.pendingProps = b, c.type = a7.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
        c.flags = a7.flags & 14680064;
        c.childLanes = a7.childLanes;
        c.lanes = a7.lanes;
        c.child = a7.child;
        c.memoizedProps = a7.memoizedProps;
        c.memoizedState = a7.memoizedState;
        c.updateQueue = a7.updateQueue;
        b = a7.dependencies;
        c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
        c.sibling = a7.sibling;
        c.index = a7.index;
        c.ref = a7.ref;
        return c;
      }
      function Rg(a7, b, c, d, e8, f2) {
        var g = 2;
        d = a7;
        if ("function" === typeof a7)
          aj(a7) && (g = 1);
        else if ("string" === typeof a7)
          g = 5;
        else
          a:
            switch (a7) {
              case ya:
                return Tg(c.children, e8, f2, b);
              case za:
                g = 8;
                e8 |= 8;
                break;
              case Aa:
                return a7 = Bg(12, c, b, e8 | 2), a7.elementType = Aa, a7.lanes = f2, a7;
              case Ea:
                return a7 = Bg(13, c, b, e8), a7.elementType = Ea, a7.lanes = f2, a7;
              case Fa:
                return a7 = Bg(19, c, b, e8), a7.elementType = Fa, a7.lanes = f2, a7;
              case Ia:
                return pj(c, e8, f2, b);
              default:
                if ("object" === typeof a7 && null !== a7)
                  switch (a7.$$typeof) {
                    case Ba:
                      g = 10;
                      break a;
                    case Ca:
                      g = 9;
                      break a;
                    case Da:
                      g = 11;
                      break a;
                    case Ga:
                      g = 14;
                      break a;
                    case Ha:
                      g = 16;
                      d = null;
                      break a;
                  }
                throw Error(p2(130, null == a7 ? a7 : typeof a7, ""));
            }
        b = Bg(g, c, b, e8);
        b.elementType = a7;
        b.type = d;
        b.lanes = f2;
        return b;
      }
      function Tg(a7, b, c, d) {
        a7 = Bg(7, a7, d, b);
        a7.lanes = c;
        return a7;
      }
      function pj(a7, b, c, d) {
        a7 = Bg(22, a7, d, b);
        a7.elementType = Ia;
        a7.lanes = c;
        a7.stateNode = { isHidden: false };
        return a7;
      }
      function Qg(a7, b, c) {
        a7 = Bg(6, a7, null, b);
        a7.lanes = c;
        return a7;
      }
      function Sg(a7, b, c) {
        b = Bg(4, null !== a7.children ? a7.children : [], a7.key, b);
        b.lanes = c;
        b.stateNode = { containerInfo: a7.containerInfo, pendingChildren: null, implementation: a7.implementation };
        return b;
      }
      function al(a7, b, c, d, e8) {
        this.tag = b;
        this.containerInfo = a7;
        this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.pendingContext = this.context = null;
        this.callbackPriority = 0;
        this.eventTimes = zc(0);
        this.expirationTimes = zc(-1);
        this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = zc(0);
        this.identifierPrefix = d;
        this.onRecoverableError = e8;
        this.mutableSourceEagerHydrationData = null;
      }
      function bl(a7, b, c, d, e8, f2, g, h, k) {
        a7 = new al(a7, b, c, h, k);
        1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
        f2 = Bg(3, null, null, b);
        a7.current = f2;
        f2.stateNode = a7;
        f2.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
        kh(f2);
        return a7;
      }
      function cl(a7, b, c) {
        var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return { $$typeof: wa, key: null == d ? null : "" + d, children: a7, containerInfo: b, implementation: c };
      }
      function dl(a7) {
        if (!a7)
          return Vf;
        a7 = a7._reactInternals;
        a: {
          if (Vb(a7) !== a7 || 1 !== a7.tag)
            throw Error(p2(170));
          var b = a7;
          do {
            switch (b.tag) {
              case 3:
                b = b.stateNode.context;
                break a;
              case 1:
                if (Zf(b.type)) {
                  b = b.stateNode.__reactInternalMemoizedMergedChildContext;
                  break a;
                }
            }
            b = b.return;
          } while (null !== b);
          throw Error(p2(171));
        }
        if (1 === a7.tag) {
          var c = a7.type;
          if (Zf(c))
            return bg(a7, c, b);
        }
        return b;
      }
      function el(a7, b, c, d, e8, f2, g, h, k) {
        a7 = bl(c, d, true, a7, e8, f2, g, h, k);
        a7.context = dl(null);
        c = a7.current;
        d = R();
        e8 = yi(c);
        f2 = mh(d, e8);
        f2.callback = void 0 !== b && null !== b ? b : null;
        nh(c, f2, e8);
        a7.current.lanes = e8;
        Ac(a7, e8, d);
        Dk(a7, d);
        return a7;
      }
      function fl(a7, b, c, d) {
        var e8 = b.current, f2 = R(), g = yi(e8);
        c = dl(c);
        null === b.context ? b.context = c : b.pendingContext = c;
        b = mh(f2, g);
        b.payload = { element: a7 };
        d = void 0 === d ? null : d;
        null !== d && (b.callback = d);
        a7 = nh(e8, b, g);
        null !== a7 && (gi(a7, e8, g, f2), oh(a7, e8, g));
        return g;
      }
      function gl(a7) {
        a7 = a7.current;
        if (!a7.child)
          return null;
        switch (a7.child.tag) {
          case 5:
            return a7.child.stateNode;
          default:
            return a7.child.stateNode;
        }
      }
      function hl(a7, b) {
        a7 = a7.memoizedState;
        if (null !== a7 && null !== a7.dehydrated) {
          var c = a7.retryLane;
          a7.retryLane = 0 !== c && c < b ? c : b;
        }
      }
      function il(a7, b) {
        hl(a7, b);
        (a7 = a7.alternate) && hl(a7, b);
      }
      function jl() {
        return null;
      }
      var kl = "function" === typeof reportError ? reportError : function(a7) {
        console.error(a7);
      };
      function ll(a7) {
        this._internalRoot = a7;
      }
      ml.prototype.render = ll.prototype.render = function(a7) {
        var b = this._internalRoot;
        if (null === b)
          throw Error(p2(409));
        fl(a7, b, null, null);
      };
      ml.prototype.unmount = ll.prototype.unmount = function() {
        var a7 = this._internalRoot;
        if (null !== a7) {
          this._internalRoot = null;
          var b = a7.containerInfo;
          Rk(function() {
            fl(null, a7, null, null);
          });
          b[uf] = null;
        }
      };
      function ml(a7) {
        this._internalRoot = a7;
      }
      ml.prototype.unstable_scheduleHydration = function(a7) {
        if (a7) {
          var b = Hc();
          a7 = { blockedOn: null, target: a7, priority: b };
          for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++)
            ;
          Qc.splice(c, 0, a7);
          0 === c && Vc(a7);
        }
      };
      function nl(a7) {
        return !(!a7 || 1 !== a7.nodeType && 9 !== a7.nodeType && 11 !== a7.nodeType);
      }
      function ol(a7) {
        return !(!a7 || 1 !== a7.nodeType && 9 !== a7.nodeType && 11 !== a7.nodeType && (8 !== a7.nodeType || " react-mount-point-unstable " !== a7.nodeValue));
      }
      function pl() {
      }
      function ql(a7, b, c, d, e8) {
        if (e8) {
          if ("function" === typeof d) {
            var f2 = d;
            d = function() {
              var a8 = gl(g);
              f2.call(a8);
            };
          }
          var g = el(b, d, a7, 0, null, false, false, "", pl);
          a7._reactRootContainer = g;
          a7[uf] = g.current;
          sf(8 === a7.nodeType ? a7.parentNode : a7);
          Rk();
          return g;
        }
        for (; e8 = a7.lastChild; )
          a7.removeChild(e8);
        if ("function" === typeof d) {
          var h = d;
          d = function() {
            var a8 = gl(k);
            h.call(a8);
          };
        }
        var k = bl(a7, 0, false, null, null, false, false, "", pl);
        a7._reactRootContainer = k;
        a7[uf] = k.current;
        sf(8 === a7.nodeType ? a7.parentNode : a7);
        Rk(function() {
          fl(b, k, c, d);
        });
        return k;
      }
      function rl(a7, b, c, d, e8) {
        var f2 = c._reactRootContainer;
        if (f2) {
          var g = f2;
          if ("function" === typeof e8) {
            var h = e8;
            e8 = function() {
              var a8 = gl(g);
              h.call(a8);
            };
          }
          fl(b, g, a7, e8);
        } else
          g = ql(c, b, a7, e8, d);
        return gl(g);
      }
      Ec = function(a7) {
        switch (a7.tag) {
          case 3:
            var b = a7.stateNode;
            if (b.current.memoizedState.isDehydrated) {
              var c = tc(b.pendingLanes);
              0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
            }
            break;
          case 13:
            Rk(function() {
              var b2 = ih(a7, 1);
              if (null !== b2) {
                var c2 = R();
                gi(b2, a7, 1, c2);
              }
            }), il(a7, 1);
        }
      };
      Fc = function(a7) {
        if (13 === a7.tag) {
          var b = ih(a7, 134217728);
          if (null !== b) {
            var c = R();
            gi(b, a7, 134217728, c);
          }
          il(a7, 134217728);
        }
      };
      Gc = function(a7) {
        if (13 === a7.tag) {
          var b = yi(a7), c = ih(a7, b);
          if (null !== c) {
            var d = R();
            gi(c, a7, b, d);
          }
          il(a7, b);
        }
      };
      Hc = function() {
        return C;
      };
      Ic = function(a7, b) {
        var c = C;
        try {
          return C = a7, b();
        } finally {
          C = c;
        }
      };
      yb = function(a7, b, c) {
        switch (b) {
          case "input":
            bb(a7, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
              for (c = a7; c.parentNode; )
                c = c.parentNode;
              c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
              for (b = 0; b < c.length; b++) {
                var d = c[b];
                if (d !== a7 && d.form === a7.form) {
                  var e8 = Db(d);
                  if (!e8)
                    throw Error(p2(90));
                  Wa(d);
                  bb(d, e8);
                }
              }
            }
            break;
          case "textarea":
            ib(a7, c);
            break;
          case "select":
            b = c.value, null != b && fb(a7, !!c.multiple, b, false);
        }
      };
      Gb = Qk;
      Hb = Rk;
      var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] };
      var tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
      var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a7) {
        a7 = Zb(a7);
        return null === a7 ? null : a7.stateNode;
      }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!vl.isDisabled && vl.supportsFiber)
          try {
            kc = vl.inject(ul), lc = vl;
          } catch (a7) {
          }
      }
      var vl;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
      exports.createPortal = function(a7, b) {
        var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!nl(b))
          throw Error(p2(200));
        return cl(a7, b, null, c);
      };
      exports.createRoot = function(a7, b) {
        if (!nl(a7))
          throw Error(p2(299));
        var c = false, d = "", e8 = kl;
        null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e8 = b.onRecoverableError));
        b = bl(a7, 1, false, null, null, c, false, d, e8);
        a7[uf] = b.current;
        sf(8 === a7.nodeType ? a7.parentNode : a7);
        return new ll(b);
      };
      exports.findDOMNode = function(a7) {
        if (null == a7)
          return null;
        if (1 === a7.nodeType)
          return a7;
        var b = a7._reactInternals;
        if (void 0 === b) {
          if ("function" === typeof a7.render)
            throw Error(p2(188));
          a7 = Object.keys(a7).join(",");
          throw Error(p2(268, a7));
        }
        a7 = Zb(b);
        a7 = null === a7 ? null : a7.stateNode;
        return a7;
      };
      exports.flushSync = function(a7) {
        return Rk(a7);
      };
      exports.hydrate = function(a7, b, c) {
        if (!ol(b))
          throw Error(p2(200));
        return rl(null, a7, b, true, c);
      };
      exports.hydrateRoot = function(a7, b, c) {
        if (!nl(a7))
          throw Error(p2(405));
        var d = null != c && c.hydratedSources || null, e8 = false, f2 = "", g = kl;
        null !== c && void 0 !== c && (true === c.unstable_strictMode && (e8 = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
        b = el(b, null, a7, 1, null != c ? c : null, e8, false, f2, g);
        a7[uf] = b.current;
        sf(a7);
        if (d)
          for (a7 = 0; a7 < d.length; a7++)
            c = d[a7], e8 = c._getVersion, e8 = e8(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e8] : b.mutableSourceEagerHydrationData.push(
              c,
              e8
            );
        return new ml(b);
      };
      exports.render = function(a7, b, c) {
        if (!ol(b))
          throw Error(p2(200));
        return rl(null, a7, b, false, c);
      };
      exports.unmountComponentAtNode = function(a7) {
        if (!ol(a7))
          throw Error(p2(40));
        return a7._reactRootContainer ? (Rk(function() {
          rl(null, null, a7, false, function() {
            a7._reactRootContainer = null;
            a7[uf] = null;
          });
        }), true) : false;
      };
      exports.unstable_batchedUpdates = Qk;
      exports.unstable_renderSubtreeIntoContainer = function(a7, b, c, d) {
        if (!ol(c))
          throw Error(p2(200));
        if (null == a7 || void 0 === a7._reactInternals)
          throw Error(p2(38));
        return rl(a7, b, c, false, d);
      };
      exports.version = "18.3.1-next-f1338f8080-20240426";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports) {
      "use strict";
      var m2 = require_react_dom();
      if (true) {
        exports.createRoot = m2.createRoot;
        exports.hydrateRoot = m2.hydrateRoot;
      } else {
        i = m2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        exports.createRoot = function(c, o5) {
          i.usingClientEntryPoint = true;
          try {
            return m2.createRoot(c, o5);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
        exports.hydrateRoot = function(c, h, o5) {
          i.usingClientEntryPoint = true;
          try {
            return m2.hydrateRoot(c, h, o5);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
      }
      var i;
    }
  });

  // node_modules/@phosphor-icons/react/dist/defs/Chat.es.js
  var e, a;
  var init_Chat_es = __esm({
    "node_modules/@phosphor-icons/react/dist/defs/Chat.es.js"() {
      e = __toESM(require_react(), 1);
      a = /* @__PURE__ */ new Map([
        [
          "bold",
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("path", { d: "M216,44H40A20,20,0,0,0,20,64V224A19.82,19.82,0,0,0,31.56,242.1a20.14,20.14,0,0,0,8.49,1.9,19.91,19.91,0,0,0,12.82-4.72l.12-.11L84.47,212H216a20,20,0,0,0,20-20V64A20,20,0,0,0,216,44Zm-4,144H80a11.93,11.93,0,0,0-7.84,2.92L44,215.23V68H212Z" }))
        ],
        [
          "duotone",
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(
            "path",
            {
              d: "M224,64V192a8,8,0,0,1-8,8H80L45.15,230.11A8,8,0,0,1,32,224V64a8,8,0,0,1,8-8H216A8,8,0,0,1,224,64Z",
              opacity: "0.2"
            }
          ), /* @__PURE__ */ e.createElement("path", { d: "M216,48H40A16,16,0,0,0,24,64V224a15.84,15.84,0,0,0,9.25,14.5A16.05,16.05,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78l.09-.07L83,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,224h0ZM216,192H80a8,8,0,0,0-5.23,1.95L40,224V64H216Z" }))
        ],
        [
          "fill",
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("path", { d: "M232,64V192a16,16,0,0,1-16,16H83l-32.6,28.16-.09.07A15.89,15.89,0,0,1,40,240a16.05,16.05,0,0,1-6.79-1.52A15.84,15.84,0,0,1,24,224V64A16,16,0,0,1,40,48H216A16,16,0,0,1,232,64Z" }))
        ],
        [
          "light",
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("path", { d: "M216,50H40A14,14,0,0,0,26,64V224a13.88,13.88,0,0,0,8.09,12.69A14.11,14.11,0,0,0,40,238a13.87,13.87,0,0,0,9-3.31l.06-.05L82.23,206H216a14,14,0,0,0,14-14V64A14,14,0,0,0,216,50Zm2,142a2,2,0,0,1-2,2H80a6,6,0,0,0-3.92,1.46L41.26,225.53A2,2,0,0,1,38,224V64a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2Z" }))
        ],
        [
          "regular",
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("path", { d: "M216,48H40A16,16,0,0,0,24,64V224a15.84,15.84,0,0,0,9.25,14.5A16.05,16.05,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78l.09-.07L83,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,224h0ZM216,192H80a8,8,0,0,0-5.23,1.95L40,224V64H216Z" }))
        ],
        [
          "thin",
          /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("path", { d: "M216,52H40A12,12,0,0,0,28,64V224a11.89,11.89,0,0,0,6.93,10.88A12.17,12.17,0,0,0,40,236a11.89,11.89,0,0,0,7.69-2.83l0,0L81.49,204H216a12,12,0,0,0,12-12V64A12,12,0,0,0,216,52Zm4,140a4,4,0,0,1-4,4H80a4,4,0,0,0-2.62,1L42.56,227.06A4,4,0,0,1,36,224V64a4,4,0,0,1,4-4H216a4,4,0,0,1,4,4Z" }))
        ]
      ]);
    }
  });

  // node_modules/@phosphor-icons/react/dist/defs/MagnifyingGlass.es.js
  var e2, a2;
  var init_MagnifyingGlass_es = __esm({
    "node_modules/@phosphor-icons/react/dist/defs/MagnifyingGlass.es.js"() {
      e2 = __toESM(require_react(), 1);
      a2 = /* @__PURE__ */ new Map([
        [
          "bold",
          /* @__PURE__ */ e2.createElement(e2.Fragment, null, /* @__PURE__ */ e2.createElement("path", { d: "M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" }))
        ],
        [
          "duotone",
          /* @__PURE__ */ e2.createElement(e2.Fragment, null, /* @__PURE__ */ e2.createElement("path", { d: "M192,112a80,80,0,1,1-80-80A80,80,0,0,1,192,112Z", opacity: "0.2" }), /* @__PURE__ */ e2.createElement("path", { d: "M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" }))
        ],
        [
          "fill",
          /* @__PURE__ */ e2.createElement(e2.Fragment, null, /* @__PURE__ */ e2.createElement("path", { d: "M168,112a56,56,0,1,1-56-56A56,56,0,0,1,168,112Zm61.66,117.66a8,8,0,0,1-11.32,0l-50.06-50.07a88,88,0,1,1,11.32-11.31l50.06,50.06A8,8,0,0,1,229.66,229.66ZM112,184a72,72,0,1,0-72-72A72.08,72.08,0,0,0,112,184Z" }))
        ],
        [
          "light",
          /* @__PURE__ */ e2.createElement(e2.Fragment, null, /* @__PURE__ */ e2.createElement("path", { d: "M228.24,219.76l-51.38-51.38a86.15,86.15,0,1,0-8.48,8.48l51.38,51.38a6,6,0,0,0,8.48-8.48ZM38,112a74,74,0,1,1,74,74A74.09,74.09,0,0,1,38,112Z" }))
        ],
        [
          "regular",
          /* @__PURE__ */ e2.createElement(e2.Fragment, null, /* @__PURE__ */ e2.createElement("path", { d: "M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" }))
        ],
        [
          "thin",
          /* @__PURE__ */ e2.createElement(e2.Fragment, null, /* @__PURE__ */ e2.createElement("path", { d: "M226.83,221.17l-52.7-52.7a84.1,84.1,0,1,0-5.66,5.66l52.7,52.7a4,4,0,0,0,5.66-5.66ZM36,112a76,76,0,1,1,76,76A76.08,76.08,0,0,1,36,112Z" }))
        ]
      ]);
    }
  });

  // node_modules/@phosphor-icons/react/dist/defs/PaperPlaneTilt.es.js
  var a3, e3;
  var init_PaperPlaneTilt_es = __esm({
    "node_modules/@phosphor-icons/react/dist/defs/PaperPlaneTilt.es.js"() {
      a3 = __toESM(require_react(), 1);
      e3 = /* @__PURE__ */ new Map([
        [
          "bold",
          /* @__PURE__ */ a3.createElement(a3.Fragment, null, /* @__PURE__ */ a3.createElement("path", { d: "M230.14,25.86a20,20,0,0,0-19.57-5.11l-.22.07L18.44,79a20,20,0,0,0-3.06,37.25L99,157l40.71,83.65a19.81,19.81,0,0,0,18,11.38c.57,0,1.15,0,1.73-.07A19.82,19.82,0,0,0,177,237.56L235.18,45.65a1.42,1.42,0,0,0,.07-.22A20,20,0,0,0,230.14,25.86ZM156.91,221.07l-34.37-70.64,46-45.95a12,12,0,0,0-17-17l-46,46L34.93,99.09,210,46Z" }))
        ],
        [
          "duotone",
          /* @__PURE__ */ a3.createElement(a3.Fragment, null, /* @__PURE__ */ a3.createElement(
            "path",
            {
              d: "M223.69,42.18l-58.22,192a8,8,0,0,1-14.92,1.25L108,148,20.58,105.45a8,8,0,0,1,1.25-14.92l192-58.22A8,8,0,0,1,223.69,42.18Z",
              opacity: "0.2"
            }
          ), /* @__PURE__ */ a3.createElement("path", { d: "M227.32,28.68a16,16,0,0,0-15.66-4.08l-.15,0L19.57,82.84a16,16,0,0,0-2.49,29.8L102,154l41.3,84.87A15.86,15.86,0,0,0,157.74,248q.69,0,1.38-.06a15.88,15.88,0,0,0,14-11.51l58.2-191.94c0-.05,0-.1,0-.15A16,16,0,0,0,227.32,28.68ZM157.83,231.85l-.05.14,0-.07-40.06-82.3,48-48a8,8,0,0,0-11.31-11.31l-48,48L24.08,98.25l-.07,0,.14,0L216,40Z" }))
        ],
        [
          "fill",
          /* @__PURE__ */ a3.createElement(a3.Fragment, null, /* @__PURE__ */ a3.createElement("path", { d: "M231.4,44.34s0,.1,0,.15l-58.2,191.94a15.88,15.88,0,0,1-14,11.51q-.69.06-1.38.06a15.86,15.86,0,0,1-14.42-9.15L107,164.15a4,4,0,0,1,.77-4.58l57.92-57.92a8,8,0,0,0-11.31-11.31L96.43,148.26a4,4,0,0,1-4.58.77L17.08,112.64a16,16,0,0,1,2.49-29.8l191.94-58.2.15,0A16,16,0,0,1,231.4,44.34Z" }))
        ],
        [
          "light",
          /* @__PURE__ */ a3.createElement(a3.Fragment, null, /* @__PURE__ */ a3.createElement("path", { d: "M225.88,30.12a13.83,13.83,0,0,0-13.7-3.58l-.11,0L20.14,84.77A14,14,0,0,0,18,110.85l85.56,41.64L145.12,238a13.87,13.87,0,0,0,12.61,8c.4,0,.81,0,1.21-.05a13.9,13.9,0,0,0,12.29-10.09l58.2-191.93,0-.11A13.83,13.83,0,0,0,225.88,30.12Zm-8,10.4L159.73,232.43l0,.11a2,2,0,0,1-3.76.26l-40.68-83.58,49-49a6,6,0,1,0-8.49-8.49l-49,49L23.15,100a2,2,0,0,1,.31-3.74l.11,0L215.48,38.08a1.94,1.94,0,0,1,1.92.52A2,2,0,0,1,217.92,40.52Z" }))
        ],
        [
          "regular",
          /* @__PURE__ */ a3.createElement(a3.Fragment, null, /* @__PURE__ */ a3.createElement("path", { d: "M227.32,28.68a16,16,0,0,0-15.66-4.08l-.15,0L19.57,82.84a16,16,0,0,0-2.49,29.8L102,154l41.3,84.87A15.86,15.86,0,0,0,157.74,248q.69,0,1.38-.06a15.88,15.88,0,0,0,14-11.51l58.2-191.94c0-.05,0-.1,0-.15A16,16,0,0,0,227.32,28.68ZM157.83,231.85l-.05.14,0-.07-40.06-82.3,48-48a8,8,0,0,0-11.31-11.31l-48,48L24.08,98.25l-.07,0,.14,0L216,40Z" }))
        ],
        [
          "thin",
          /* @__PURE__ */ a3.createElement(a3.Fragment, null, /* @__PURE__ */ a3.createElement("path", { d: "M224.47,31.52a11.87,11.87,0,0,0-11.82-3L20.74,86.67a12,12,0,0,0-1.91,22.38L105,151l41.92,86.15A11.88,11.88,0,0,0,157.74,244c.34,0,.69,0,1,0a11.89,11.89,0,0,0,10.52-8.63l58.21-192,0-.08A11.85,11.85,0,0,0,224.47,31.52Zm-4.62,9.54-58.23,192a4,4,0,0,1-7.48.59l-41.3-84.86,50-50a4,4,0,1,0-5.66-5.66l-50,50-84.9-41.31a3.88,3.88,0,0,1-2.27-4,3.93,3.93,0,0,1,3-3.54L214.9,36.16A3.93,3.93,0,0,1,216,36a4,4,0,0,1,2.79,1.19A3.93,3.93,0,0,1,219.85,41.06Z" }))
        ]
      ]);
    }
  });

  // node_modules/@phosphor-icons/react/dist/defs/User.es.js
  var e4, a4;
  var init_User_es = __esm({
    "node_modules/@phosphor-icons/react/dist/defs/User.es.js"() {
      e4 = __toESM(require_react(), 1);
      a4 = /* @__PURE__ */ new Map([
        [
          "bold",
          /* @__PURE__ */ e4.createElement(e4.Fragment, null, /* @__PURE__ */ e4.createElement("path", { d: "M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" }))
        ],
        [
          "duotone",
          /* @__PURE__ */ e4.createElement(e4.Fragment, null, /* @__PURE__ */ e4.createElement("path", { d: "M192,96a64,64,0,1,1-64-64A64,64,0,0,1,192,96Z", opacity: "0.2" }), /* @__PURE__ */ e4.createElement("path", { d: "M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" }))
        ],
        [
          "fill",
          /* @__PURE__ */ e4.createElement(e4.Fragment, null, /* @__PURE__ */ e4.createElement("path", { d: "M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z" }))
        ],
        [
          "light",
          /* @__PURE__ */ e4.createElement(e4.Fragment, null, /* @__PURE__ */ e4.createElement("path", { d: "M229.19,213c-15.81-27.32-40.63-46.49-69.47-54.62a70,70,0,1,0-63.44,0C67.44,166.5,42.62,185.67,26.81,213a6,6,0,1,0,10.38,6C56.4,185.81,90.34,166,128,166s71.6,19.81,90.81,53a6,6,0,1,0,10.38-6ZM70,96a58,58,0,1,1,58,58A58.07,58.07,0,0,1,70,96Z" }))
        ],
        [
          "regular",
          /* @__PURE__ */ e4.createElement(e4.Fragment, null, /* @__PURE__ */ e4.createElement("path", { d: "M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" }))
        ],
        [
          "thin",
          /* @__PURE__ */ e4.createElement(e4.Fragment, null, /* @__PURE__ */ e4.createElement("path", { d: "M227.46,214c-16.52-28.56-43-48.06-73.68-55.09a68,68,0,1,0-51.56,0c-30.64,7-57.16,26.53-73.68,55.09a4,4,0,0,0,6.92,4C55,184.19,89.62,164,128,164s73,20.19,92.54,54a4,4,0,0,0,3.46,2,3.93,3.93,0,0,0,2-.54A4,4,0,0,0,227.46,214ZM68,96a60,60,0,1,1,60,60A60.07,60.07,0,0,1,68,96Z" }))
        ]
      ]);
    }
  });

  // node_modules/@phosphor-icons/react/dist/lib/context.es.js
  var import_react, o;
  var init_context_es = __esm({
    "node_modules/@phosphor-icons/react/dist/lib/context.es.js"() {
      import_react = __toESM(require_react(), 1);
      o = (0, import_react.createContext)({
        color: "currentColor",
        size: "1em",
        weight: "regular",
        mirrored: false
      });
    }
  });

  // node_modules/@phosphor-icons/react/dist/lib/IconBase.es.js
  var e5, p;
  var init_IconBase_es = __esm({
    "node_modules/@phosphor-icons/react/dist/lib/IconBase.es.js"() {
      e5 = __toESM(require_react(), 1);
      init_context_es();
      p = e5.forwardRef(
        (s, a7) => {
          const {
            alt: n3,
            color: r2,
            size: t2,
            weight: o5,
            mirrored: c,
            children: i,
            weights: m2,
            ...x
          } = s, {
            color: d = "currentColor",
            size: l,
            weight: f2 = "regular",
            mirrored: g = false,
            ...w
          } = e5.useContext(o);
          return /* @__PURE__ */ e5.createElement(
            "svg",
            {
              ref: a7,
              xmlns: "http://www.w3.org/2000/svg",
              width: t2 != null ? t2 : l,
              height: t2 != null ? t2 : l,
              fill: r2 != null ? r2 : d,
              viewBox: "0 0 256 256",
              transform: c || g ? "scale(-1, 1)" : void 0,
              ...w,
              ...x
            },
            !!n3 && /* @__PURE__ */ e5.createElement("title", null, n3),
            i,
            m2.get(o5 != null ? o5 : f2)
          );
        }
      );
      p.displayName = "IconBase";
    }
  });

  // node_modules/@phosphor-icons/react/dist/csr/Chat.es.js
  var o2, t, n;
  var init_Chat_es2 = __esm({
    "node_modules/@phosphor-icons/react/dist/csr/Chat.es.js"() {
      o2 = __toESM(require_react(), 1);
      init_IconBase_es();
      init_Chat_es();
      t = o2.forwardRef((a7, e8) => /* @__PURE__ */ o2.createElement(p, { ref: e8, ...a7, weights: a }));
      t.displayName = "ChatIcon";
      n = t;
    }
  });

  // node_modules/@phosphor-icons/react/dist/csr/MagnifyingGlass.es.js
  var a5, o3, f;
  var init_MagnifyingGlass_es2 = __esm({
    "node_modules/@phosphor-icons/react/dist/csr/MagnifyingGlass.es.js"() {
      a5 = __toESM(require_react(), 1);
      init_IconBase_es();
      init_MagnifyingGlass_es();
      o3 = a5.forwardRef((s, n3) => /* @__PURE__ */ a5.createElement(p, { ref: n3, ...s, weights: a2 }));
      o3.displayName = "MagnifyingGlassIcon";
      f = o3;
    }
  });

  // node_modules/@phosphor-icons/react/dist/csr/PaperPlaneTilt.es.js
  var e6, a6, m;
  var init_PaperPlaneTilt_es2 = __esm({
    "node_modules/@phosphor-icons/react/dist/csr/PaperPlaneTilt.es.js"() {
      e6 = __toESM(require_react(), 1);
      init_IconBase_es();
      init_PaperPlaneTilt_es();
      a6 = e6.forwardRef((o5, r2) => /* @__PURE__ */ e6.createElement(p, { ref: r2, ...o5, weights: e3 }));
      a6.displayName = "PaperPlaneTiltIcon";
      m = a6;
    }
  });

  // node_modules/@phosphor-icons/react/dist/csr/User.es.js
  var e7, o4, n2;
  var init_User_es2 = __esm({
    "node_modules/@phosphor-icons/react/dist/csr/User.es.js"() {
      e7 = __toESM(require_react(), 1);
      init_IconBase_es();
      init_User_es();
      o4 = e7.forwardRef((r2, s) => /* @__PURE__ */ e7.createElement(p, { ref: s, ...r2, weights: a4 }));
      o4.displayName = "UserIcon";
      n2 = o4;
    }
  });

  // node_modules/@phosphor-icons/react/dist/index.es.js
  var init_index_es = __esm({
    "node_modules/@phosphor-icons/react/dist/index.es.js"() {
      init_Chat_es2();
      init_MagnifyingGlass_es2();
      init_PaperPlaneTilt_es2();
      init_User_es2();
    }
  });

  // src/api/chat.ts
  function streamChat(zoteroKey, question, onToken, onDone, onError, maxChunks) {
    const base = getApiUrl();
    const url = `${base}/api/plugin/chat/stream`;
    const controller = new AbortController();
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zotero_key: zoteroKey,
        question,
        max_chunks: maxChunks ?? getChatMaxChunks()
      }),
      signal: controller.signal
    }).then(async (resp) => {
      if (!resp.ok) {
        onError(`HTTP ${resp.status}`);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: "))
            continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.token)
              onToken(parsed.token);
            if (parsed.done)
              onDone(parsed.sources ?? []);
          } catch {
          }
        }
      }
    }).catch((err) => {
      if (err.name !== "AbortError")
        onError(String(err));
    });
    return () => controller.abort();
  }
  var init_chat = __esm({
    "src/api/chat.ts"() {
      "use strict";
      init_prefs();
    }
  });

  // src/api/search.ts
  async function similarItems(zoteroKey, limit = 6) {
    const data = await apiFetch(
      `/similar/${zoteroKey}?limit=${limit}`
    );
    return data.results;
  }
  var init_search = __esm({
    "src/api/search.ts"() {
      "use strict";
      init_client();
    }
  });

  // src/api/author.ts
  async function fetchAuthorProfile(authorName) {
    return apiFetch(`/author/${encodeURIComponent(authorName)}`);
  }
  var init_author = __esm({
    "src/api/author.ts"() {
      "use strict";
      init_client();
    }
  });

  // src/ui/components/ScoreChip.tsx
  function ScoreChip({ score }) {
    const pct = Math.round(score * 100);
    const color = score >= 0.9 ? "#a6e3a1" : score >= 0.8 ? "#f9e2af" : "#f38ba8";
    return /* @__PURE__ */ import_react2.default.createElement("span", { style: {
      background: color,
      color: "#1e1e2e",
      borderRadius: 3,
      padding: "1px 5px",
      fontSize: "0.65rem",
      fontWeight: 600
    } }, pct);
  }
  var import_react2;
  var init_ScoreChip = __esm({
    "src/ui/components/ScoreChip.tsx"() {
      "use strict";
      import_react2 = __toESM(require_react());
    }
  });

  // src/ui/ItemPaneTab.tsx
  var ItemPaneTab_exports = {};
  __export(ItemPaneTab_exports, {
    ItemPaneTab: () => ItemPaneTab
  });
  function ItemPaneTab({ zoteroKey, title, authors }) {
    const [tab, setTab] = (0, import_react3.useState)("chat");
    const [messages, setMessages] = (0, import_react3.useState)([]);
    const [input, setInput] = (0, import_react3.useState)("");
    const [streaming, setStreaming] = (0, import_react3.useState)(false);
    const [similar, setSimilar] = (0, import_react3.useState)([]);
    const [authorProfile, setAuthorProfile] = (0, import_react3.useState)(null);
    const [selectedAuthor, setSelectedAuthor] = (0, import_react3.useState)(null);
    const bottomRef = (0, import_react3.useRef)(null);
    const cancelRef = (0, import_react3.useRef)(null);
    (0, import_react3.useEffect)(() => {
      if (tab === "similar")
        loadSimilar();
    }, [tab, zoteroKey]);
    async function loadSimilar() {
      const results = await similarItems(zoteroKey);
      setSimilar(results);
    }
    async function loadAuthor(name) {
      setSelectedAuthor(name);
      const profile = await fetchAuthorProfile(name);
      setAuthorProfile(profile);
    }
    function sendMessage() {
      if (!input.trim() || streaming)
        return;
      const question = input.trim();
      setInput("");
      setMessages((prev) => [...prev, { role: "user", text: question }]);
      setStreaming(true);
      let buffer = "";
      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);
      cancelRef.current = streamChat(
        zoteroKey,
        question,
        (token) => {
          buffer += token;
          setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", text: buffer }]);
          bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
        },
        (sources) => {
          setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", text: buffer, sources }]);
          setStreaming(false);
        },
        (err) => {
          setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", text: `Error: ${err}` }]);
          setStreaming(false);
        },
        void 0
      );
    }
    const tabBtn = (id, icon, label) => /* @__PURE__ */ import_react3.default.createElement("button", { onClick: () => setTab(id), style: {
      background: tab === id ? "#313244" : "transparent",
      border: "none",
      borderRadius: 4,
      padding: "3px 8px",
      fontSize: "0.7rem",
      color: tab === id ? "var(--accent, #89b4fa)" : "#6c7086",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 4
    } }, icon, " ", label);
    return /* @__PURE__ */ import_react3.default.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100%", fontSize: "0.8rem" } }, /* @__PURE__ */ import_react3.default.createElement("div", { style: { display: "flex", gap: 4, padding: "4px 8px", borderBottom: "1px solid #313244" } }, tabBtn("chat", /* @__PURE__ */ import_react3.default.createElement(n, { size: 12 }), "Chat"), tabBtn("similar", /* @__PURE__ */ import_react3.default.createElement(f, { size: 12 }), "Similar"), tabBtn("author", /* @__PURE__ */ import_react3.default.createElement(n2, { size: 12 }), "Author")), tab === "chat" && /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0.5rem", display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ import_react3.default.createElement("div", { style: { textAlign: "center", color: "#6c7086", fontSize: "0.7rem", padding: "4px 0" } }, "Chatting with: ", title), messages.map((m2, i) => /* @__PURE__ */ import_react3.default.createElement("div", { key: i, style: {
      alignSelf: m2.role === "user" ? "flex-end" : "flex-start",
      background: m2.role === "user" ? "#313244" : "#1e1e2e",
      border: m2.role === "assistant" ? "1px solid #444" : "none",
      borderRadius: 6,
      padding: "6px 10px",
      maxWidth: "90%",
      color: "#cdd6f4"
    } }, m2.text, m2.sources && m2.sources.length > 0 && /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#6c7086", fontSize: "0.65rem", marginTop: 4 } }, "p.", m2.sources.map((s) => s.page).join(", "), " \xB7 ", m2.sources.length, " chunk", m2.sources.length !== 1 ? "s" : ""))), /* @__PURE__ */ import_react3.default.createElement("div", { ref: bottomRef })), /* @__PURE__ */ import_react3.default.createElement("div", { style: { padding: "6px", borderTop: "1px solid #313244", display: "flex", gap: 6 } }, /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        value: input,
        onChange: (e8) => setInput(e8.target.value),
        onKeyDown: (e8) => e8.key === "Enter" && sendMessage(),
        placeholder: "Ask about this paper...",
        style: { flex: 1, fontSize: "0.75rem", padding: "4px 8px", background: "#313244", border: "1px solid #444", borderRadius: 4, color: "#cdd6f4" }
      }
    ), /* @__PURE__ */ import_react3.default.createElement("button", { onClick: sendMessage, disabled: streaming, "aria-label": "Send", style: {
      background: "var(--accent, #89b4fa)",
      border: "none",
      borderRadius: 4,
      padding: "4px 8px",
      cursor: "pointer",
      color: "#1e1e2e"
    } }, /* @__PURE__ */ import_react3.default.createElement(m, { size: 14, weight: "fill" })))), tab === "similar" && /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0.5rem", display: "flex", flexDirection: "column", gap: 4 } }, similar.length === 0 && /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#6c7086", textAlign: "center", marginTop: "2rem" } }, "Loading..."), similar.map((item) => /* @__PURE__ */ import_react3.default.createElement("div", { key: item.zotero_key, style: { background: "#313244", borderRadius: 6, padding: "6px 8px" } }, /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#cdd6f4", marginBottom: 2 } }, item.title), /* @__PURE__ */ import_react3.default.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ import_react3.default.createElement("span", { style: { color: "#6c7086", fontSize: "0.65rem" } }, item.creators?.[0]?.lastName ?? "", item.date ? ` \xB7 ${item.date}` : ""), /* @__PURE__ */ import_react3.default.createElement(ScoreChip, { score: item.score }), /* @__PURE__ */ import_react3.default.createElement("span", { style: { marginLeft: "auto", color: "var(--accent, #89b4fa)", fontSize: "0.65rem", cursor: "pointer" } }, "open"))))), tab === "author" && /* @__PURE__ */ import_react3.default.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "0.5rem" } }, !selectedAuthor ? /* @__PURE__ */ import_react3.default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#6c7086", fontSize: "0.7rem", marginBottom: 4 } }, "Select an author:"), authors.map((a7) => {
      const name = `${a7.firstName} ${a7.lastName}`.trim();
      return /* @__PURE__ */ import_react3.default.createElement("button", { key: name, onClick: () => loadAuthor(name), style: {
        background: "#313244",
        border: "none",
        borderRadius: 6,
        padding: "6px 8px",
        color: "#cdd6f4",
        cursor: "pointer",
        textAlign: "left"
      } }, name);
    })) : authorProfile ? /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("button", { onClick: () => {
      setSelectedAuthor(null);
      setAuthorProfile(null);
    }, style: {
      background: "transparent",
      border: "none",
      color: "var(--accent, #89b4fa)",
      fontSize: "0.7rem",
      cursor: "pointer",
      marginBottom: 8,
      padding: 0
    } }, "Back"), /* @__PURE__ */ import_react3.default.createElement("div", { style: { fontWeight: 600, color: "#cdd6f4", marginBottom: 4 } }, authorProfile.author), /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#6c7086", fontSize: "0.65rem", marginBottom: 8 } }, authorProfile.items.length, " papers in library"), authorProfile.coauthors.length > 0 && /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#6c7086", fontSize: "0.65rem", marginBottom: 8 } }, "Co-authors: ", authorProfile.coauthors.slice(0, 5).join(", ")), authorProfile.items.map((item) => /* @__PURE__ */ import_react3.default.createElement("div", { key: item.key, style: { background: "#313244", borderRadius: 4, padding: "4px 8px", marginBottom: 4 } }, /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#cdd6f4", fontSize: "0.75rem" } }, item.title), /* @__PURE__ */ import_react3.default.createElement("div", { style: { color: "#6c7086", fontSize: "0.65rem" } }, item.date)))) : null));
  }
  var import_react3;
  var init_ItemPaneTab = __esm({
    "src/ui/ItemPaneTab.tsx"() {
      "use strict";
      import_react3 = __toESM(require_react());
      init_index_es();
      init_chat();
      init_search();
      init_author();
      init_ScoreChip();
    }
  });

  // src/events.ts
  init_prefs();
  var notifierID = null;
  function registerEventHooks() {
    notifierID = Zotero.Notifier.registerObserver(
      {
        notify: async (event, type, ids) => {
          if (type !== "item")
            return;
          if (event === "add") {
            const hasRegular = ids.some((id) => {
              const item = Zotero.Items.get(id);
              return item && item.isRegularItem();
            });
            if (hasRegular)
              await queueSync();
          }
          if (event === "modify") {
            await queueSync();
          }
        }
      },
      ["item"]
    );
  }
  function unregisterEventHooks() {
    if (notifierID) {
      Zotero.Notifier.unregisterObserver(notifierID);
      notifierID = null;
    }
  }
  async function queueSync() {
    try {
      await fetch(`${getApiUrl()}/api/plugin/sync`, { method: "POST" });
    } catch (e8) {
      console.warn("[AI Companion] Failed to queue sync:", e8);
    }
  }

  // src/menu.ts
  function registerMenus(win) {
    const doc = win.document;
    const toolsMenu = doc.getElementById("menu_ToolsPopup");
    if (!toolsMenu)
      return;
    const menu = doc.createXULElement("menu");
    menu.setAttribute("label", "AI Companion");
    menu.setAttribute("id", "zotero-ai-menu");
    const popup = doc.createXULElement("menupopup");
    const items = [
      { id: "zotero-ai-graph", label: "Similarity Graph", command: "openGraph" },
      { id: "zotero-ai-discovery", label: "Discovery", command: "openDiscovery" },
      { id: "zotero-ai-health", label: "Library Health", command: "openHealth" },
      { id: "zotero-ai-queue", label: "Index Queue", command: "openQueue" },
      { id: "zotero-ai-settings", label: "Settings", command: "openSettings" }
    ];
    for (const item of items) {
      const menuitem = doc.createXULElement("menuitem");
      menuitem.setAttribute("id", item.id);
      menuitem.setAttribute("label", item.label);
      menuitem.addEventListener(
        "command",
        () => win.dispatchEvent(new CustomEvent("zotero-ai-command", { detail: { command: item.command } }))
      );
      popup.appendChild(menuitem);
    }
    menu.appendChild(popup);
    toolsMenu.appendChild(menu);
  }
  function registerContextMenu(win) {
    const doc = win.document;
    const itemContextMenu = doc.getElementById("zotero-itemmenu");
    if (!itemContextMenu)
      return;
    const deleteItem = doc.createXULElement("menuitem");
    deleteItem.setAttribute("id", "zotero-ai-cascade-delete");
    deleteItem.setAttribute("label", "Delete with AI cleanup");
    deleteItem.addEventListener(
      "command",
      () => win.dispatchEvent(new CustomEvent("zotero-ai-command", { detail: { command: "cascadeDelete" } }))
    );
    itemContextMenu.appendChild(deleteItem);
  }

  // src/bootstrap.ts
  init_prefs();

  // src/api/sync.ts
  init_client();
  async function triggerSync() {
    return apiFetch("/sync", { method: "POST" });
  }

  // src/bootstrap.ts
  init_client();
  var syncTimer = null;
  var windowListeners = /* @__PURE__ */ new Map();
  async function startup({ rootURI }) {
    registerEventHooks();
    for (const win of Zotero.getMainWindows()) {
      initWindow(win);
    }
    if (getSyncOnStartup()) {
      try {
        await triggerSync();
      } catch (e8) {
        console.warn("[AI Companion] Startup sync failed:", e8);
      }
    }
    scheduleSync();
    Zotero.ItemPaneManager.registerSection({
      paneID: "zotero-ai-companion",
      pluginID: "zotero-ai-companion@dsmoz",
      header: {
        l10nID: "ai-companion-header",
        icon: `${rootURI}content/icons/icon16.png`
      },
      sidenav: {
        l10nID: "ai-companion-sidenav",
        icon: `${rootURI}content/icons/icon20.png`
      },
      onRender: ({ body, item }) => {
        const { createRoot } = require_client();
        const { createElement: createElement10 } = require_react();
        const { ItemPaneTab: ItemPaneTab2 } = (init_ItemPaneTab(), __toCommonJS(ItemPaneTab_exports));
        const authors = item.getCreators().map((c) => ({ firstName: c.firstName || "", lastName: c.lastName || "" }));
        let root = body._aiRoot;
        if (!root) {
          root = createRoot(body);
          body._aiRoot = root;
        }
        root.render(createElement10(ItemPaneTab2, {
          zoteroKey: item.key,
          title: item.getField("title"),
          authors
        }));
        return () => {
          root.unmount();
          delete body._aiRoot;
        };
      }
    });
  }
  function shutdown() {
    unregisterEventHooks();
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
    for (const [win, handler] of windowListeners) {
      win.removeEventListener("zotero-ai-command", handler);
      win.document.getElementById("zotero-ai-menu")?.remove();
      win.document.getElementById("zotero-ai-cascade-delete")?.remove();
    }
    windowListeners.clear();
  }
  function initWindow(win) {
    registerMenus(win);
    registerContextMenu(win);
    const handler = (e8) => handleCommand(e8.detail.command, win).catch(
      (err) => console.error("[AI Companion] Command error:", err)
    );
    win.addEventListener("zotero-ai-command", handler);
    windowListeners.set(win, handler);
  }
  function scheduleSync() {
    if (syncTimer)
      clearInterval(syncTimer);
    if (!getAutoSync())
      return;
    const intervalMs = getSyncInterval() * 60 * 60 * 1e3;
    syncTimer = setInterval(async () => {
      try {
        await triggerSync();
      } catch (e8) {
        console.warn("[AI Companion] Scheduled sync failed:", e8);
      }
    }, intervalMs);
  }
  async function handleCommand(command, win) {
    switch (command) {
      case "openGraph":
      case "openDiscovery":
      case "openHealth":
      case "openQueue":
      case "openSettings":
        Zotero.getActiveZoteroPane()?.openTab(`zotero-ai-${command.replace("open", "").toLowerCase()}`);
        break;
      case "cascadeDelete": {
        const selectedItems = Zotero.getActiveZoteroPane()?.getSelectedItems() ?? [];
        for (const item of selectedItems) {
          const title = item.getField("title");
          const confirmed = win.confirm(
            `Delete "${title}" from Zotero, Qdrant, synctracker, and Neo4j?`
          );
          if (confirmed) {
            try {
              await apiFetch(`/items/${item.key}`, { method: "DELETE" });
              await Zotero.Items.trashTx([item.id]);
            } catch (e8) {
              console.error("[AI Companion] Cascade delete failed:", e8);
            }
          }
        }
        break;
      }
    }
  }
})();
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
