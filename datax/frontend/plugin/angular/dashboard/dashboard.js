;(function() {
'use strict';
/* globals window, angular */

angular.module('dashboard', ['dashboardInterface'])
  .constant('_', window._)
  .constant('jQuery', window.$)
  .constant('Drop', window.Drop)
  .constant('consts', {
    addCount: true, // add count field to Dataset.dataschema
    debug: true,
    useUrl: true,
    logging: true,
    logLevel: 'INFO',
    logPrintLevel: 'INFO',
    logToWebSql: false, // in user studies, set this to true
    hideMoreFn: true, // hide belowFold functions and "more" & "less" toggles in functionselect during user studies
    appId: 'dashboard',

  });
}());

;(function() {
angular.module('dashboard').run(['$templateCache', function($templateCache) {$templateCache.put('components/chartlist/chartlist.html','<ul class="nav nav-list accordion-group" ng-repeat="kind in kinds"><li class="nav-header" ng-if="!kind.hideInChartList"><i class="icon-plus icon-white"></i> \u5206\u7C7B:{{kind.kind}}</li><li class="boxes"><div ng-if="!data.hideInChartList" class="box box-element" id="box_{{ data.charttype }}_{{data.id}}" ng-repeat="data in kind.data"><div class="preview chart-title">{{data.name}}</div><div ng-drag="true" ng-drag-data="data"></div></div></li></ul><div class="box box-element" ng-drag-clone=""><div class="preview chart-title">{{clonedData.name}}</div></div>');
$templateCache.put('components/filters/normaltext.html','<div class="cellbox"><div class="option-btn"><i class="fa fa-bars"></i></div><span class="filter-title">{{config.title}}</span> <input class="filter-module"><div class="drop-option"><div class="option-row" ng-click="showData()">\u67E5\u770B\u6570\u636E</div><div class="option-row" ng-click="removeAction()">\u79FB\u9664</div></div></div>');
$templateCache.put('components/griditem/griditem.html','<div class="parent-content" id="charts_{{ config.data.id }}"><div class="release-link chart-tools" ng-click="releaseLink()" ng-if="config.data && config.data.link && config.data.link == \'linkStart\'"><i class="fa fa-unlink" title="\u6E05\u9664\u8054\u52A8"></i></div><div class="chart-enlarge chart-tools" ng-click="fullShowChart()" ng-if="!dropType && config.data.datatype == \'chart\' && config.data.datatype != \'table\' && deviceType == \'pc\'"><i class="fa fa-arrows-alt" title="\u5168\u5C4F\u5C55\u793A"></i></div><div class="option-btn"><i class="fa fa-bars fa-item-config-btn" ng-click="openDropOption($event)"></i></div><div class="filter-compnenet-wrapper text-filter-wrapper"></div><div ng-if="dropType==\'date\'"><div class="filter-label-container" style="width: 30%; display: inline-block;"><label class="searchlable filter-label">{{config.data.filterName}}</label></div><div style="width: calc(35% - 15px); display: inline-block;"><md-datepicker ng-model="dateFilter.startDate" md-placeholder="\u5F00\u59CB\u65F6\u95F4" ng-change="selectDateChange()" md-hide-icons="calendar" md-open-on-focus=""></md-datepicker></div><div style="width: 30px; display: inline-block; position: relative;"></div><div style="width: calc(35% - 15px); display: inline-block;"><md-datepicker ng-model="dateFilter.endDate" md-placeholder="\u622A\u6B62\u65F6\u95F4" ng-change="selectDateChange()" md-hide-icons="calendar" md-open-on-focus=""></md-datepicker></div></div><div class="filter-compnenet-wrapper select-filter-wrapper"></div><div class="rich-text-content full-content" ng-if="dropType==\'labelBox\'" ng-class="{\'scroll-auto\': config.data.componentType == \'text\'}"><div class="auto-hide" ng-class="{\'auto-show\': config.data.componentType == \'text\'}" ng-dblclick="openTextEditor()" ng-bind-html="config.data.textContent"></div><div class="auto-hide full-content" ng-class="{\'auto-show\': config.data.componentType == \'webPage\'}" style="background-color: #ffffff;"><div ng-repeat="link in config.data.links" class="full-content"><iframe class="full-content embedded-frame" id="{{ link.id }}"></iframe></div></div></div><div ng-if="!dropType && config.data.datatype == \'chart\' && config.data.datatype != \'table\'" class="chart-content" id="{{ config.data.id }}"></div><div ng-if="!dropType && config.data.datatype == \'table\'" class="chart-content" ng-class="{\'lite-border\': config.data.styleConfig.liteBorder}"><div class="table-header" ng-if="config.data.jsonconfig.tableTitle && config.data.jsonconfig.tableTitle.length > 1">{{ config.data.jsonconfig.tableTitle }}</div><dx-table columns="columns" data="tableObj.data" custom-config="customConfig" full-fix="config.data.styleConfig.fullFix" height="itemTotalHeight" row-height="tableRowHeight"></dx-table></div><div ng-if="config.data.datatype && (config.data.datatype == \'chart\' || config.data.datatype == \'table\') && config.data.commentsConfig.showComments" class="chart-label" ng-click="openLabelText($event)" ng-class="{\'hover-show\':deviceType==\'pc\'}"><i class="fa fa-edit"></i>&nbsp;\u8BC4\u8BBA</div><div class="chart-label-arrow" ng-style="config.data.commentsConfig.style.total"></div></div>');
$templateCache.put('components/modal/modal.html','<div class="ngmodal" ng-if="isOpen"><div class="modal-wrapper" style="{{wrapperStyle}}" ng-transclude=""></div></div>');
$templateCache.put('components/modal/modalclosebutton.html','<div class="right"><a ng-click="closeModal()" class="right"><i class="fa fa-times"></i></a></div>');}]);
}());

;(function() {
/*!
 * JSON3 with compact stringify -- Modified by Kanit Wongsuphasawat.   https://github.com/kanitw/json3
 *
 * Forked from JSON v3.3.2 | https://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org
 */
;(function () {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // A set of types used to distinguish objects from primitives.
  var objectTypes = {
    "function": true,
    "object": true
  };

  // Detect the `exports` object exposed by CommonJS implementations.
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context,
  // and the `window` object in browsers. Rhino exports a `global` function
  // instead.
  var root = objectTypes[typeof window] && window || this,
      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (true) { // used to be !has("json")
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the `Date` methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native `Object#hasOwnProperty` method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the object's prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level `Object` constructor.
            constructor = members.constructor;
            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // `prototype` property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (true) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string `value`, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack, maxLineLength) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;

          maxLineLength = maxLineLength || 0;

          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the `Date#toJSON` method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the `getUTC*` methods are
                  // buggy. Adapted from @Yaffle's `date-shim` project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The `time` value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                  // to compute `A modulo B`, as the `%` operator does not
                  // correspond to the `modulo` operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
              // ignores all `toJSON` methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by `JSON.stringify`.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              var totalLength = indentation.length, result;
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation,
                  stack, maxLineLength);
                result = element === undef ? "null" : element;
                totalLength += result.length + (index > 0 ? 1 : 0);
                results.push(result);
              }
              result = results.length ?
                (
                  whitespace && (totalLength > maxLineLength) ?
                  "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" :
                  "[" + results.join(",") + "]"
                )
                : "[]";
            } else {
              var totalLength = indentation.length, index=0;
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var result, element = serialize(property, value, callback, properties, whitespace, indentation,
                                        stack, maxLineLength);

                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                  // is not the empty string, let `member` {quote(property) + ":"}
                  // be the concatenation of `member` and the `space` character."
                  // The "`space` character" refers to the literal space
                  // character, not the `space` {width} argument provided to
                  // `JSON.stringify`.
                  result = quote(property) + ":" + (whitespace ? " " : "") + element;
                  totalLength += result.length + (index++ > 0 ? 1 : 0);
                  results.push(result);
                }
              });
              result = results.length ?
                (
                  whitespace && (totalLength > maxLineLength) ?
                  "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" :
                  "{" + results.join(",") + "}"
                )
                : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.

        exports.stringify = function (source, filter, width, maxLineLength) {
          var whitespace, callback, properties, className;
          if (objectTypes[typeof filter] && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the `width` to an integer and create a string containing
              // `width` number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // (`""`) only if they are used directly within an object member list
          // (e.g., `!("" in { "": 1})`).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", [], maxLineLength);
        };

        exports.compactStringify = function (source, filter, width){
          return exports.stringify(source, filter, width, 60);
        }
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forEach` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  if (freeExports && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, freeExports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON,
        previousJSON = root["JSON3"],
        isRestored = false;

    var JSON3 = runInContext(root, (root["JSON3"] = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        if (!isRestored) {
          isRestored = true;
          root.JSON = nativeJSON;
          root["JSON3"] = previousJSON;
          nativeJSON = previousJSON = null;
        }
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}).call(this);
}());

;(function() {
'use strict';

angular.module('dashboard')
    .directive('chartList', function() {
        return {
            templateUrl: 'components/chartlist/chartlist.html',
            restrict: 'E',
            scope: {
                kinds: '=',
                items: '='
            },
            link: function(scope, element /*, attrs*/ ) {},
            controller: ['$scope', '$http', function($scope, $http) {
                $scope.addChart = function(data) {
                    var lists = angular.copy($scope.items);

                    var sort = lists.sort(function(a, b) {
                        return b.row - a.row;
                    });
                    $scope.items.push({
                        sizeX: 12,
                        sizeY: 5,
                        row: sort.length > 0 ? sort[0].row + sort[0].sizeY : 0,
                        col: 0,
                        data: data
                    });
                };
            }]
        };
    });
}());

;(function() {
'use strict';

angular.module('dashboard')
    .directive('normaltext', ['Drop', function(Drop) {
        return {
            templateUrl: 'components/griditem/griditem.html',
            restrict: 'E',
            scope: {
                config: '=',
                tableData: '=',
                removeAction: '&'
            },
            link: function(scope, element /*, attrs*/ ) {
                scope.typePopup = new Drop({
                    content: element.parent().find('.drop-option')[0],
                    target: element.parent().find('.fa-bars')[0],
                    position: 'bottom right',
                    openOn: 'click'
                });
                scope.width = element.parent().width() - 5;
                scope.height = element.parent().height();
                scope.$on('$destroy', function() {
                    if (scope.typePopup && scope.typePopup.destroy) {
                        scope.typePopup.destroy();
                    }
                });
            },
            controller: ['$scope', '$element', '$http', '$timeout', 'Modals', function($scope, $element, $http, $timeout, Modals) {
                $scope.table = {
                    column: [],
                    tableData: []
                };
                $scope.showData = function() {
                    Modals.open('data-modal');
                    if ($scope.data.length > 0) {
                        $scope.tableData = angular.copy($scope.table);
                    }
                    $scope.typePopup.close();
                };
                if (!$scope.config.data.echartconfig) return;
                $scope.ecconfig = JSON.parse($scope.config.data.echartconfig);
                $scope.$watch('ecconfig.data.url', function(val) {
                    if (typeof val == 'string') {
                        $http.get($scope.ecconfig.data.url).then(function(response) {
                            //debugger;
                            $scope.config.data.lists = response.data;
                            $scope.ecconfig.width = $($element).find('.chart-content').width(); //$scope.width;
                            $scope.ecconfig.height = $scope.height;
                            buildEchart($scope.ecconfig, $($element).find('.chart-content'), $scope.config.data.lists);
                        });
                    }
                });
            }]
        };
    }]);
}());

;(function() {
"use strict";

angular.module("dashboard").directive("gridItem", [
  "Drop", "filterValueChange",
  function (Drop, filterValueChange) {
    return {
      templateUrl: "components/griditem/griditem.html",
      restrict: "E",
      scope: {
        openFilterPanel: "&",
        olapids: "=",
        config: "=",
        configitems: "=",
        tableData: "=",
        dropType: "=",
        globalConfig: "=",
        syncFontColor: "=",
        sceneOptions: "=",
        removeAction: "&",
        showTextEditor: "&",
        itemStyleConfig: "&",
        openLinkagePanel: "&",
        updateComponent: "&",
        openCommentsSection: "&",
        reloadingDashboardStatus: "=",
        scenesContentWidth: "=",
        rowHeight: "=?rowHeight",
        afterDataLoad: "&",
      },
      link: function (scope, element) {},
      controller: ['$scope', '$element', '$http', '$window', '$timeout', '$compile', 'Modals', function (
        $scope,
        $element,
        $http,
        $window,
        $timeout,
        $compile,
        Modals
      ) {
        var vm = $scope
        if (!$scope.rowHeight) {
          $scope.rowHeight = 50;
        }
        $scope.componentUuid = generateUuid(8, 16);
        $scope.deviceType = terminalType;
        $scope.viewType = viewType;
        $scope.newScene = true;

        /* #region 菜单功能 */
        $scope.openDropOption = function ($event) {
          if (dropOptionElement) {
            dropOptionElement.remove();
            dropOptionElement = null;
          } else {
            var off = $($event.target).offset();
            var dropOptionStyle =
              "position:absolute;top:" +
              (off.top + 20) +
              "px;left:" +
              off.left +
              "px;display:block;";
            var html = dropOptionHtmlStr.replace("_style_", dropOptionStyle);
            var template = angular.element(html);
            dropOptionElement = $compile(template)($scope);
            angular.element(document.body).append(dropOptionElement);
          }
        };
        $scope.closeDropOption = function () {
          if (dropOptionElement) {
            dropOptionElement.remove();
            dropOptionElement = null;
          }
        };
        $scope.resizeCol = function ($event) {
          if (tableColResizeElement) {
            tableColResizeElement.remove();
            tableColResizeElement = null;
          } else {
            if ($($event.target).offset().top + tableConfig["columns"].length * 32 + 20 > $window.innerHeight) {
              var tableColResizeStyle =
                "position:absolute;bottom:" +
                20 +
                "px;left:" +
                ($($event.target).offset().left - 220) +
                "px;display:block;";
            } else {
              var tableColResizeStyle =
                "position:absolute;top:" +
                $($event.target).offset().top +
                "px;left:" +
                ($($event.target).offset().left - 220) +
                "px;display:block;";
            }

            var html = tableColResizeElementStr.replace("_style_", tableColResizeStyle);
            var template = angular.element(html);
            tableColResizeElement = $compile(template)($scope);
            angular.element(document.body).append(tableColResizeElement);
          }
          $scope.closeDropOption()
        }
        /* #endregion */
        if ($scope.config && $scope.config.data) {} else {
          return;
        }

        if (isNotNull($scope.config.data.id)) {
          $($element)
            .find(".parent-content")
            .addClass("charts-" + $scope.config.data.id);
        }
        $scope.configType = $scope.config.data.datatype ?
          $scope.config.data.datatype :
          $scope.config.data.dropType;
        if (
          currentSceneId.length > 1 ||
          (getQueryString("scenesId") && getQueryString("scenesId").length > 1)
        ) {
          $scope.newScene = false;
        }
        if ($scope.viewType == "show") {
          $(".option-btn").remove();
        }
        var currentWidth = $window.innerWidth;
        $scope.showPanel = false;

        $scope.dateFilter = {
          startDate: "",
          endDate: ""
        };

        $scope.textFilter = {
          data: "",
          filterWay: ""
        };

        $scope.filterData = "";

        $scope.replayText = "";

        /* #region 组件配置各个菜单功能  */

        $scope.filterPanel = function () {
          $scope.closeDropOption();
          $scope.openFilterPanel();
        };

        $scope.linkagePanel = function () {
          $scope.closeDropOption();
          $scope.openLinkagePanel();
        };

        $scope.openTextEditor = function () {
          $$scope.closeDropOption();
          $scope.showTextEditor();
        };

        $scope.showData = function () {
          Modals.open("data-modal");
          if ($scope.data.length > 0) {
            $scope.tableData = angular.copy($scope.table);
          }
          $scope.closeDropOption();
        };

        $scope.showStyleConfig = function () {
          $scope.closeDropOption();
          $scope.itemStyleConfig();
        };

        // 组件删除
        $scope.removeComponent = function () {
          $(".drop-option").hide();
          // 重置过滤条件
          if (
            $scope.config.data.dropType == "select" ||
            $scope.config.data.dropType == "date" ||
            $scope.config.data.dropType == "text"
          ) {
            $scope.textFilter.data = "";
            $scope.filterData = "";
            $scope.textFilter = {
              data: "",
              filterWay: ""
            };
            //startFilter();
          }
          $scope.removeAction();
        };

        /* #endregion */

        /* #region select、文本、日期过滤器 */
        if (
          $scope.config.data.dropType == "select" ||
          $scope.config.data.dropType == "date" ||
          $scope.config.data.dropType == "text"
        ) {
          if (isNull($scope.config.data.styleConfig.separationClass)) {
            $scope.config.data.styleConfig.separationClass = "separation-46";
          }
          $scope.deleteSelect = function () {
            $scope.config.data.filterDatas.forEach(function (item) {
              item.checked = false;
            });
            $scope.multipleSelectChange();
          };

          if ($scope.config.data.dropType == "text") {
            if (
              $scope.config.data.defaultVal &&
              $scope.config.data.defaultVal.length > 0
            ) {
              $scope.textFilter.data = $scope.config.data.defaultVal;
              $scope.config.data.val = $scope.textFilter.data
            }
            if (
              $scope.config.data.defaultValText &&
              $scope.config.data.defaultValText.length > 0
            ) {
              $scope.textFilter.data = $scope.config.data.defaultValText;
              $scope.config.data.val = $scope.textFilter.data
            }
            var textComponentTemplate = angular.element(textComponentHtml);
            var textComponentElement = $compile(textComponentTemplate)($scope);
            var textFilterWrapperEle = angular.element($element[0].querySelector('.text-filter-wrapper'))
            textFilterWrapperEle.append(textComponentElement);
            textFilterWrapperEle.addClass($scope.config.data.styleConfig.separationClass)
            textFilterWrapperEle.addClass('auto-show')
            $scope.textFilterChange = function () {
              var filterText = $scope.textFilter.data;
              $timeout(function () {
                if ($scope.textFilter.data == filterText) {
                  $scope.startTextFilter()
                  filterValueChange.afterChange($scope.configitems, $scope.config)
                  // if (vm.config.data.customCode && vm.config.data.customCode.enabled) {
                  //   eval(vm.config.data.customCode.afterValueChangeCode)
                  // }
                }
              }, 1500);
            };
            $scope.$watch('config.data.customValue', function (newval) {
              if (newval && (newval + '').length > 0) {
                $scope.textFilter.data = (newval + '')
                $scope.startTextFilter()
              }
            })
            $scope.startTextFilter = function () {
              if ($scope.config.data.textFilterWay) {
                $scope.textFilter.filterWay = $scope.config.data.textFilterWay
              }
              $scope.config.data.val = $scope.textFilter.data
              startFilter(
                $scope.config,
                $scope.configitems,
                $scope.textFilter
              );
            }
          }
          
          // 监听多选框的值 触发图表刷新
          if ($scope.config.data.dropType == "select") {
            var selectComponentTemplate = angular.element(selectComponentHtml);
            var selectComponentElement = $compile(selectComponentTemplate)($scope);
            var selectFilterWrapperEle = angular.element($element[0].querySelector('.select-filter-wrapper'))
            selectFilterWrapperEle.append(selectComponentElement);
            selectFilterWrapperEle.addClass($scope.config.data.styleConfig.separationClass)
            selectFilterWrapperEle.addClass('auto-show')
            $scope.searchTerm = "";
            $scope.clearSearchTerm = function () {
              $scope.searchTerm = "";
            };
            $scope.multiSelectVal = []
            $scope.singleSelectVal = ''
            $scope.$watch('config.data.customValue', function (newval) {
              if (newval && (newval + '').length > 0) {
                if ($scope.config.data.multipleSelect) {
                  $scope.multiSelectVal = [newval];
                  $scope.config.data.val = $scope.multiSelectVal
                } else {
                  $scope.singleSelectVal = newval
                  $scope.config.data.val = $scope.singleSelectVal
                }
                startFilter(
                  $scope.config,
                  $scope.configitems,
                  (newval+'')
                );
              }
            })
            $scope.$watch('config.data.filterDatas', function (newval) {
              if ($scope.config.data.filterDatas && $scope.config.data.filterDatas.length > 0) {
                $scope.selectArr = []
                if (isNotNull(newval) && newval.length > 0) {
                  $scope.config.data.filterDatas.forEach(function (value) {
                    $scope.selectArr.push(value.id)
                  })
                }
                /**自动生成的默认值 */
                $scope.waitingInitDefault = true
                if (isNotNull($scope.config.data.defaultVal) && $scope.config.data.defaultVal.length > 0) {
                  $scope.waitingInitDefault = false
                  var tempVal = [];
                  $scope.config.data.defaultVal.forEach(function (element) {
                    tempVal.push(element.id);
                  });
                  if (tempVal && tempVal.length > 0) {
                    if ($scope.config.data.multipleSelect) {
                      $scope.multiSelectVal = tempVal;
                      $scope.config.data.val = $scope.multiSelectVal
                    } else {
                      $scope.singleSelectVal = tempVal[0]
                      $scope.config.data.val = $scope.singleSelectVal
                    }
                    $timeout(function () {
                      $scope.waitingInitDefault = true
                    }, 1000)

                  }
                }
                /**自定义的默认值 */
                if (isNotNull($scope.config.data.defaultValText) && $scope.config.data.defaultValText.length > 0) {
                  $scope.waitingInitDefault = false
                  var tempVal = [];
                  $scope.config.data.defaultValText = $scope.config.data.defaultValText.replace(/，/g, ",")
                  tempVal = $scope.config.data.defaultValText.split(',')
                  if (tempVal && tempVal.length > 0) {
                    if ($scope.config.data.multipleSelect) {
                      $scope.multiSelectVal = tempVal
                      $scope.config.data.val = $scope.multiSelectVal
                    } else {
                      $scope.singleSelectVal = tempVal[0]
                      $scope.config.data.val = $scope.singleSelectVal
                    }
                    $timeout(function () {
                      $scope.waitingInitDefault = true
                    }, 1000)
                  }
                }
              }
            }, true)

            $scope.selectAll = function () {
              $scope.filterData = ''
              startFilter(
                $scope.config,
                $scope.configitems,
                $scope.filterData
              );
            }

            $scope.changeSelect = function (slectVal) {
              if ($scope.reloadingDashboardStatus == "complete") {}
              $scope.filterData = "";
              
              if ($scope.config.data.multipleSelect) {
                $scope.config.data.val = slectVal;
                slectVal.forEach(function (value) {
                  $scope.filterData = $scope.filterData + value + ",";
                });
                if ($scope.filterData.length > 0) {
                  $scope.filterData = $scope.filterData.substring(
                    0,
                    $scope.filterData.length - 1
                  );
                }
              } else {
                $scope.config.data.val = slectVal;
                $scope.filterData = slectVal;
              }
              if ($scope.waitingInitDefault) {
                startFilter(
                  $scope.config,
                  $scope.configitems,
                  $scope.filterData
                );
                filterValueChange.afterChange($scope.configitems, $scope.config)
                // if (vm.config.data.customCode && vm.config.data.customCode.enabled) {
                //   eval(vm.config.data.customCode.afterValueChangeCode)
                // }
              }
              $scope.waitingInitDefault = true
            }
          }

          if ($scope.config.data.dropType == "date") {
            if (
              $scope.config.data.defaultVal &&
              $scope.config.data.defaultVal.length == 2
            ) {
              $scope.dateFilter.startDate = $scope.config.data.defaultVal[0];
              $scope.dateFilter.endDate = $scope.config.data.defaultVal[1];
            }
            $scope.selectDateChange = function () {
              if (
                $scope.dateFilter.startDate == "" ||
                $scope.dateFilter.endDate == ""
              ) {
                if ($scope.dateFilter.startDate == $scope.dateFilter.endDate) {
                  startFilter(
                    $scope.config,
                    $scope.configitems,
                    $scope.dateFilter
                  );
                }
              } else {
                if (
                  new Date($scope.dateFilter.startDate) >
                  new Date($scope.dateFilter.endDate)
                ) {
                  $scope.dateFilter.endDate = "";
                  alert("开始日期不得大于结束日期");
                } else {
                  startFilter(
                    $scope.config,
                    $scope.configitems,
                    $scope.dateFilter
                  );
                }
              }
            };
          }
        }
        /* #endregion */

        /* #region 评论模块优化 */

        $scope.isInitCommentsArea = false;
        $scope.openLabelText = function ($event) {
          if (screenHeight < 500) {
            alert("页面高度不够，无法显示，请保证页面高度大于500像素");
            return;
          }
          if (chartLabelElement) {
            chartLabelElement.remove();
            chartLabelElement = null;
          } else {
            $scope.config.data.commentsConfig.style = $scope.sceneOptions.options.commentsStyle;
            $scope.config.data.commentsConfig.comments.forEach(function (
              _item,
              _index,
              _arr
            ) {
              $scope.isExpandComments = false;
              if (_index > 2) {
                _item.show = false;
              }
            });
            $scope.updateCommentsFromServer();
            $scope.loginUserName = dataXLoginUserInfo.username;
            if (dataXLoginUserInfo.role == "admin") {
              $scope.loginUserName = "AnonymousUsers";
            }
            var chartLabelOff = $($event.target).offset();
            var screenHeight = document.body.offsetHeight;
            var commentsDivTop = "";
            var commentsDivWidth = ""
            if (terminalType == "phone") {
              commentsDivWidth = "width:calc(100% - 70px);"
            }
            if ((chartLabelOff.top + 30) > screenHeight) {
              commentsDivTop = "bottom:30px;"
            } else {
              commentsDivTop = "bottom:" + (screenHeight - chartLabelOff.top - 30) + "px;"
            }

            var chartLabelStyle =
              "position:absolute;" +
              commentsDivWidth +
              commentsDivTop +
              "left:" +
              (chartLabelOff.left + 40) + "px;";
            var chartLabelHtml = chartLabelHtmlStr.replace("_style_", chartLabelStyle);
            var chartLabelTemplate = angular.element(chartLabelHtml);
            chartLabelElement = $compile(chartLabelTemplate)($scope);
            angular.element(document.body).append(chartLabelElement);
            $timeout(function () {
              new PerfectScrollbar(".show-area");
            }, 2000);
          }


        };

        $scope.startChartReply = function () {
          $(".reply-show-edit").hide();
          $(".reply-edit-area").show();
        };

        $scope.postReplayByKey = function ($event, postType, item) {
          if ($event.keyCode == 13) {
            //回车
            $scope.expandComments();
            if (postType == "update") {
              item.status = "edit";
              //item.text = strToUnicode(item.text)
              $timeout(function () {
                $scope.updateCommentsFromServer();
              });
            } else {
              $scope.postReplay();
            }
          }
        };

        $scope.openBarrage = function () {
          if ($scope.config.data.commentsConfig.barrage) {
            $scope.config.data.commentsConfig.barragerCount = 0;
          }
          barragerConfig($scope.config);
        };

        $scope.postReplay = function () {
          if ($scope.replayText && $scope.replayText.length > 0) {
            var userName = dataXLoginUserInfo.username;
            if (dataXLoginUserInfo.role == "admin") {
              userName = "匿名";
            }
            $scope.config.data.commentsConfig.comments.unshift({
              id: generateUuid(32, 16),
              user: userName,
              date: dateFtt(),
              show: true,
              text: $scope.replayText,
              status: "edit",
              rate: 0,
              like: 0,
              options: {}
            });
            $scope.expandComments();
            $scope.updateCommentsFromServer();
            $scope.replayText = "";
            $(".reply-show-edit").show();
            $(".reply-edit-area").hide();
          }
        };

        $scope.delReplay = function (item) {
          item.status = "delete";
          $scope.expandComments();
          $scope.updateCommentsFromServer();
        };

        $scope.updateCommentsFromServer = function () {
          if ($scope.configType == "chart") {
            quickSave($scope.config, "echarts", "singleItem", "comments");
          } else if ($scope.configType == "table") {
            quickSave($scope.config, "table", "singleItem", "comments");
          } else {
            alert("读取组件类型失败,无法修改评论");
          }
        };

        $scope.expandComments = function () {
          $scope.isExpandComments = true;
          $scope.config.data.commentsConfig.comments.forEach(function (
            _item,
            _index,
            _arr
          ) {
            _item.show = true;
          });
        };

        /* #endregion */

        /* #region 全屏展示  */
        $scope.fullShowChart = function () {
          $(".full-screen-content").height(document.body.clientHeight * 0.98);
          $(".full-screen-content").show();
          $timeout(function () {
            var currentChart = echarts.getInstanceByDom(
              $element.find(".chart-content")[0]
            );
            var myChart = echarts.init(
              document.getElementById("fullShowChart")
            );
            var tempOption = currentChart.getOption();
            updateChartFontColor("echarts", tempOption, "rgba(0, 0, 0, 1)");
            myChart.setOption(tempOption);
            myChart.off();
          });
        };
        /* #endregion */

        /* #region 表格  */

        if (
          $scope.config.data.datatype &&
          $scope.config.data.datatype == "table"
        ) {
          $scope.srollHeight = 0
          
          $scope.calcTableHeight = function() {
            $scope.itemTotalHeight = $scope.config.sizeY * $scope.rowHeight - 40;
            if ($scope.config.data.jsonconfig.tableTitle && $scope.config.data.jsonconfig.tableTitle.length > 1) {
              $scope.itemTotalHeight = $scope.itemTotalHeight - 35
            }
          }
          $scope.calcTableHeight()
          $scope.tableClass = "scenes-table-" + $scope.componentUuid;
          $scope.tableBodyClass = "scenes-table-body-" + $scope.componentUuid;
          $scope.tableObj = {
            column: [],
            data: [],
            totalItems: 0,
            page: 1,
            limit: 10,
            currentPageNum: 5,
            totalPage: 0
          };
          if ($scope.config.data.styleConfig.rowHeight && $scope.config.data.styleConfig.rowHeight > 10) {
            $scope.tableRowHeight = $scope.config.data.styleConfig.rowHeight
          } else {
            $scope.tableRowHeight = 35
          }
          var tableConfig = $scope.config.data.jsonconfig;

          if ($scope.config.data.styleConfig.editable) {
            $scope.customConfig = {
              editable: true,
              customAfterchangeCode: $scope.config.data.styleConfig.afterChangeCode
            }
          } else {
            $scope.customConfig = {
              editable: false,
              customAfterchangeCode: ''
            }
          }
          $scope.queryList = function (page) {
            var _tempClass = "charts-" + $scope.config.data.id;
            dataxLoding.showLoading("charts-" + $scope.config.data.id);
            $scope.tableObj.heads = [];
            $http({
              method: "POST",
              url: encodeURI($scope.config.data.jsonconfig.data.url),
              headers: {
                "X-CSRFToken": getCookie("csrftoken")
              },
              data: {
                column: JSON.stringify(tableConfig.columns),
                olapid: tableConfig.olapid,
                limit: tableConfig.length,
                merge: tableConfig.merge,
                mergeCols: JSON.stringify(tableConfig.mergeCols),
                page: page
              }
            }).then(function (rs) {
              dataxLoding.hideLoading(_tempClass);
              var rsdata = rs.data;
              if (rsdata.data && rsdata.data.length >= 0) {
                $scope.tableObj.column = tableConfig["columns"];
                $scope.tableObj.data = rsdata.data;
                $scope.tableObj.heads = angular.copy(
                  $scope.config.data.jsonconfig.theads
                );
                $scope.tableObj.page = page;
                if (typeof rsdata.total == "number") {
                  $scope.tableObj.totalItems = rsdata.total;
                } else if (typeof rsdata.total == "object") {
                  $scope.tableObj.totalItems = rsdata.total.total;
                } else {
                  $scope.tableObj.totalItems = 0;
                }
                $scope.tableObj.limit = tableConfig.length;
                $scope.tableObj.totalPage = Math.ceil(
                  rsdata.total / tableConfig.length
                );
              }
              $scope.afterDataLoad({ev:{type:'table', data: $scope.config}})
            }, function (rs) {
              $scope.afterDataLoad({ev:{type:'table', data: $scope.config}})
              dataxLoding.hideLoading(_tempClass);
              console.error('与后台交互发生错误, 后台返回信息为:', rs)
            });
          };

          var colCount = tableConfig["columns"].length;
          if (
            !tableConfig["fixColWidths"] ||
            tableConfig["fixColWidths"].length != colCount
          ) {
            tableConfig["fixColWidths"] = new Array(colCount);
            tableConfig["columns"].forEach(function (value, index) {
              tableConfig["fixColWidths"][index] = 0;
            });
          }
          $scope.fixColWidths = tableConfig["fixColWidths"].map(function () {
            return 0
          })
          $scope.tableCellStyle = new Array(colCount);
          $scope.fixTableStyle = function (fixColWidths) {
            // 获取控件总高宽
            // 判断是否有分页栏和汇总栏等
            // var totalHeight = $($element).find('.parent-content').height() - 30;
            $scope.calcTableHeight()
            var totalHeight = $scope.config.sizeY * $scope.rowHeight - 40;
            if (!$scope.config.data.styleConfig.showPage) {
              totalHeight = totalHeight + 15;
            }
            var totalWidth;
            if (terminalType == "phone") {
              totalWidth = $($element)
                .find(".parent-content")
                .width();
            } else {
              totalWidth =
                ($window.innerWidth / 96).toFixed(2) * $scope.config.sizeX - 20;
            }

            $scope.columns = []
            $scope.tempColumns = []
            $scope.colInfos = ($scope.config.data.jsonconfig.theads[$scope.config.data.jsonconfig.theads.length - 1]).rows
            // 宽度100%
            if ($scope.config.data.styleConfig.fullFix) {
              $scope.unitWidth = (totalWidth / $scope.colInfos.length).toFixed(2)
            } else {
              $scope.unitWidth = 100
            }
            $scope.totalWidth = 0
            $scope.config.data.jsonconfig.theads.forEach(function (row, rowIndex) {
              $scope.tempColumns.push({
                rows: []
              })
              row.rows.forEach(function (col, colIndex) {
                var itemColspan = col['colspan'] ? col['colspan'] : '1'
                var colObj = {
                  'rowspan': col['rowspan'] ? col['rowspan'] : '1',
                  'colspan': itemColspan,
                  'width': Number($scope.unitWidth) + Number(fixColWidths[colIndex]),
                  'title': col['title'] ? col['title'] : '',
                  'field': col['field'] ? col['field'] : '',
                  'isedit': col['isedit'] ? col['isedit'] : '0',
                  'format': col['format'] ? col['format'] : '',
                }
                if (rowIndex == ($scope.config.data.jsonconfig.theads.length - 1)) {
                  /**列锁定 */
                  if ($scope.config.data.styleConfig.fixedLeft &&
                    $scope.config.data.styleConfig.fixedLeft > 0 &&
                    colIndex < $scope.config.data.styleConfig.fixedLeft) {
                    colObj['fixed'] = 'left'
                  }
                  $scope.totalWidth = $scope.totalWidth + Number(colObj['width'])
                }
                $scope.tempColumns[rowIndex].rows.push(colObj)
              })
            })
            /** 当表格宽度和容器宽度差距过大时，重新计算表格宽度 */
            var colFixWidth = ((totalWidth - $scope.totalWidth) / ($scope.colInfos.length)).toFixed(2);
            if (colFixWidth > 1 || (colFixWidth < -1 && $scope.config.data.styleConfig.fullFix)) {
              $scope.tempColumns[$scope.tempColumns.length - 1].rows.forEach(function (item) {
                item['width'] = Number(item['width']) + Number(colFixWidth)
              })
            }
            $scope.columns = angular.copy($scope.tempColumns)

            if (isNotNull($scope.config.data.styleConfig.tableBorderColor)) {
              $scope.dataTableStyle.tableStyle['borderColor'] = $scope.config.data.styleConfig.tableBorderColor
            }

            $scope.fixColWidth = function (newval, index) {
              tableConfig["fixColWidths"][index] = newval
              $scope.fixTableStyle(tableConfig["fixColWidths"])
            }

            $timeout(function () {

            });
          };

          $scope.$watch("config.data.jsonconfig.data.url", function () {
            if ($scope.config.data.refreshCount > 0) {
              $scope.queryList(1);
            }
          });

          $scope.$watch('config.data.styleConfig', function (newval) {
            if (isNotNull(newval) && isNotNull(newval.tableBorderColor) &&
              isNotNull($scope.dataTableStyle) && isNotNull($scope.dataTableStyle.tableStyle)) {
              $scope.dataTableStyle.tableStyle['borderColor'] = newval.tableBorderColor
            }
          })

          $scope.$watch(
            function () {
              return $scope.config.data.refreshCount;
            },
            function (newval) {
              // 防止初始化时多次加载
              if ($scope.config.data.refreshCount > 0) {
                $scope.fixTableStyle(tableConfig["fixColWidths"]);
              }
            }
          );

          $scope.$watch("scenesContentWidth", function (newval) {
            if ($scope.config) {
              // 防止初始化时多次加载
              $scope.currentWidth = $window.innerWidth;
              if ($scope.currentWidth == newval) {
                // 调整浏览器宽度1S后刷新
                $timeout(function () {
                  if ($scope.currentWidth == newval) {
                    $scope.fixTableStyle(tableConfig["fixColWidths"]);
                  }
                }, 1000);
              }
            }
          });
        }
        /* #endregion */

        /* #region 图表 */
        if (
          $scope.config.data.datatype &&
          $scope.config.data.datatype == "chart"
        ) {
          if (!$scope.config.data.echartconfig) return;

          //清除联动
          $scope.releaseLink = function () {
            if (
              $scope.config.data.link &&
              $scope.config.data.link == "linkStart"
            ) {
              releaseSingleLink($scope.config.data, $scope.configitems);
            }
          };

          $scope.chartFontColor = "";
          $scope.$watch(
            "config.data.styleConfig",
            function (newval) {
              // 确保在此方法只在新增界面和编辑(查看)界面的数据读取完成之后才会执行
              if (
                $scope.reloadingDashboardStatus == "complete" &&
                $scope.config.data.refreshCount > 0
              ) {
                if ($scope.syncFontColor) {
                  var chartFontColor = "";
                  if (newval && newval.color && newval.color.length > 7) {
                    chartFontColor = newval.color;
                  } else {
                    chartFontColor = $(".main-app-content").css("color");
                  }
                  if ($scope.chartFontColor != chartFontColor) {
                    $scope.chartFontColor = chartFontColor;
                    var echartConfigObj = JSON.parse(
                      $scope.config.data.echartconfig
                    );
                    if (
                      $scope.config.data.jsonconfig &&
                      $scope.config.data.jsonconfig == "single"
                    ) {
                      updateChartFontColor(
                        "single",
                        echartConfigObj,
                        chartFontColor
                      );
                    } else {
                      updateChartFontColor(
                        "echarts",
                        echartConfigObj,
                        chartFontColor
                      );
                    }
                    $scope.config.data.echartconfig = JSON.stringify(
                      echartConfigObj
                    );
                    $scope.config.data.refreshCount += 1;
                  }
                }
              }
            },
            true
          );

          $scope.$watch("config.data.refreshCount", function (newval) {
            if ($scope.config.data.refreshCount > 0) {
              $scope.ecconfig = JSON.parse($scope.config.data.echartconfig);
              if (typeof $scope.ecconfig.data.url == "string") {
                dataxLoding.showLoading("charts-" + $scope.config.data.id);
                $http
                  .get(encodeURI($scope.ecconfig.data.url))
                  .then(function (response) {
                    $scope.config.data.lists = response.data;

                    // var dataSetObj = JSON.parse($scope.config.data);

                    $scope.ecconfig.width = $($element)
                      .find(".parent-content")
                      .width(); //$scope.width;
                    $scope.ecconfig.height =
                      $scope.config.sizeY * $scope.rowHeight - 6;
                    buildEchart(
                      $scope.ecconfig,
                      $($element).find(".chart-content"),
                      $scope.config.data.lists,
                      null,
                      "dashbboard2",
                      $scope.config,
                      $scope.configitems
                    );
                    $scope.config.data.chartHeight = $scope.ecconfig.height;
                    $scope.config.data.chartWidth = $scope.ecconfig.width;
                    dataxLoding.hideLoading("charts-" + $scope.config.data.id);
                    $scope.afterDataLoad({ev:{type:'chart', data: $scope.config}})
                  }, function (rs) {
                    $scope.afterDataLoad({ev:{type:'chart', data: $scope.config}})
                    dataxLoding.hideLoading("charts-" + $scope.config.data.id);
                    console.error('与后台交互发生错误, 后台返回信息为:', rs)
                  });
              }
            }
          });

          $scope.$watch("scenesContentWidth", function (newval) {
            // 防止初始化时多次加载
            if (
              $scope.scenesContentWidth > 0 &&
              $scope.config.data.refreshCount > 0
            ) {
              $scope.currentWidth = $window.innerWidth;
              $timeout(function () {
                if ($scope.currentWidth == newval) {
                  $($element).find(".chart-content")[0].style.width = "100%";
                  $($element).find(".chart-content")[0].style.height = "100%";
                  if (
                    $scope.config.data.jsonconfig != "single" &&
                    echarts.getInstanceByDom(
                      $($element).find(".chart-content")[0]
                    )
                  ) {
                    echarts
                      .getInstanceByDom($($element).find(".chart-content")[0])
                      .resize();
                  }
                }
              }, 1000);
            }
          });
        }
        /* #endregion */
      }]
    };
  }
]);
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:modal
 * @description
 * # modal
 */
angular.module('dashboard')
  .directive('modal', ['$document', 'Modals', function ($document, Modals) {
    return {
      templateUrl: 'components/modal/modal.html',
      restrict: 'E',
      transclude: true,
      scope: {
        autoOpen: '<',
        maxWidth: '@'
      },
      // Provide an interface for child directives to close this modal
      controller: ['$scope', function($scope) {
        this.close = function() {
          $scope.isOpen = false;
        };
      }],
      link: function(scope, element, attrs) {
        var modalId = attrs.id;

        if (scope.maxWidth) {
          scope.wrapperStyle = 'max-width:' + scope.maxWidth;
        }

        // Default to closed unless autoOpen is set
        scope.isOpen = scope.autoOpen;

        // close on esc
        function escape(e) {
          if (e.keyCode === 27 && scope.isOpen) {
            scope.isOpen = false;
            scope.$digest();
          }
        }

        angular.element($document).on('keydown', escape);

        // Register this modal with the service
        Modals.register(modalId, scope);
        scope.$on('$destroy', function() {
          Modals.deregister(modalId);
        });
      }
    };
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:modalCloseButton
 * @description
 * # modalCloseButton
 */
angular.module('dashboard')
  .directive('modalCloseButton', function() {
    return {
      templateUrl: 'components/modal/modalclosebutton.html',
      restrict: 'E',
      require: '^^modal',
      scope: {
        closeAction: '&'
      },
      link: function(scope, element, attrs, modalController) {
        scope.closeModal = function() {
          modalController.close();
          if (scope.closeAction) {
            scope.closeAction();
          }
        };
      }
    };
  });
}());

;(function() {
'use strict';

/**
 * @ngdoc service
 * @name vlui.Modals
 * @description
 * # Modals
 * Service used to control modal visibility from anywhere in the application
 */
angular.module('dashboard')
  .factory('Modals', ['$cacheFactory', function ($cacheFactory) {

    // TODO: The use of scope here as the method by which a modal directive
    // is registered and controlled may need to change to support retrieving
    // data from a modal as may be needed in #77
    var modalsCache = $cacheFactory('modals');

    // Public API
    return {
      register: function(id, scope) {
        if (modalsCache.get(id)) {
          console.error('Cannot register two modals with id ' + id);
          return;
        }
        modalsCache.put(id, scope);
      },

      deregister: function(id) {
        modalsCache.remove(id);
      },

      // Open a modal
      open: function(id) {
        var modalScope = modalsCache.get(id);
        if (!modalScope) {
          console.error('Unregistered modal id ' + id);
          return;
        }
        modalScope.isOpen = true;
      },

      // Close a modal
      close: function(id) {
        var modalScope = modalsCache.get(id);
        if (!modalScope) {
          console.error('Unregistered modal id ' + id);
          return;
        }
        modalScope.isOpen = false;
      },

      empty: function() {
        modalsCache.removeAll();
      },

      count: function() {
        return modalsCache.info().size;
      }
    };
  }]);
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwidGVtcGxhdGVDYWNoZUh0bWwuanMiLCJ2ZW5kb3IvanNvbjMtY29tcGFjdHN0cmluZ2lmeS5qcyIsImNvbXBvbmVudHMvY2hhcnRsaXN0L2NoYXJ0bGlzdC5qcyIsImNvbXBvbmVudHMvZmlsdGVycy9ub3JtYWx0ZXh0LmpzIiwiY29tcG9uZW50cy9ncmlkaXRlbS9ncmlkaXRlbS5qcyIsImNvbXBvbmVudHMvbW9kYWwvbW9kYWwuanMiLCJjb21wb25lbnRzL21vZGFsL21vZGFsY2xvc2VidXR0b24uanMiLCJjb21wb25lbnRzL21vZGFsL21vZGFscy5zZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3Q2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZGFzaGJvYXJkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG4vKiBnbG9iYWxzIHdpbmRvdywgYW5ndWxhciAqL1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2Rhc2hib2FyZCcsIFsnZGFzaGJvYXJkSW50ZXJmYWNlJ10pXHJcbiAgLmNvbnN0YW50KCdfJywgd2luZG93Ll8pXHJcbiAgLmNvbnN0YW50KCdqUXVlcnknLCB3aW5kb3cuJClcclxuICAuY29uc3RhbnQoJ0Ryb3AnLCB3aW5kb3cuRHJvcClcclxuICAuY29uc3RhbnQoJ2NvbnN0cycsIHtcclxuICAgIGFkZENvdW50OiB0cnVlLCAvLyBhZGQgY291bnQgZmllbGQgdG8gRGF0YXNldC5kYXRhc2NoZW1hXHJcbiAgICBkZWJ1ZzogdHJ1ZSxcclxuICAgIHVzZVVybDogdHJ1ZSxcclxuICAgIGxvZ2dpbmc6IHRydWUsXHJcbiAgICBsb2dMZXZlbDogJ0lORk8nLFxyXG4gICAgbG9nUHJpbnRMZXZlbDogJ0lORk8nLFxyXG4gICAgbG9nVG9XZWJTcWw6IGZhbHNlLCAvLyBpbiB1c2VyIHN0dWRpZXMsIHNldCB0aGlzIHRvIHRydWVcclxuICAgIGhpZGVNb3JlRm46IHRydWUsIC8vIGhpZGUgYmVsb3dGb2xkIGZ1bmN0aW9ucyBhbmQgXCJtb3JlXCIgJiBcImxlc3NcIiB0b2dnbGVzIGluIGZ1bmN0aW9uc2VsZWN0IGR1cmluZyB1c2VyIHN0dWRpZXNcclxuICAgIGFwcElkOiAnZGFzaGJvYXJkJyxcclxuXHJcbiAgfSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdkYXNoYm9hcmQnKS5ydW4oWyckdGVtcGxhdGVDYWNoZScsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7JHRlbXBsYXRlQ2FjaGUucHV0KCdjb21wb25lbnRzL2NoYXJ0bGlzdC9jaGFydGxpc3QuaHRtbCcsJzx1bCBjbGFzcz1cIm5hdiBuYXYtbGlzdCBhY2NvcmRpb24tZ3JvdXBcIiBuZy1yZXBlYXQ9XCJraW5kIGluIGtpbmRzXCI+PGxpIGNsYXNzPVwibmF2LWhlYWRlclwiIG5nLWlmPVwiIWtpbmQuaGlkZUluQ2hhcnRMaXN0XCI+PGkgY2xhc3M9XCJpY29uLXBsdXMgaWNvbi13aGl0ZVwiPjwvaT4gXFx1NTIwNlxcdTdDN0I6e3traW5kLmtpbmR9fTwvbGk+PGxpIGNsYXNzPVwiYm94ZXNcIj48ZGl2IG5nLWlmPVwiIWRhdGEuaGlkZUluQ2hhcnRMaXN0XCIgY2xhc3M9XCJib3ggYm94LWVsZW1lbnRcIiBpZD1cImJveF97eyBkYXRhLmNoYXJ0dHlwZSB9fV97e2RhdGEuaWR9fVwiIG5nLXJlcGVhdD1cImRhdGEgaW4ga2luZC5kYXRhXCI+PGRpdiBjbGFzcz1cInByZXZpZXcgY2hhcnQtdGl0bGVcIj57e2RhdGEubmFtZX19PC9kaXY+PGRpdiBuZy1kcmFnPVwidHJ1ZVwiIG5nLWRyYWctZGF0YT1cImRhdGFcIj48L2Rpdj48L2Rpdj48L2xpPjwvdWw+PGRpdiBjbGFzcz1cImJveCBib3gtZWxlbWVudFwiIG5nLWRyYWctY2xvbmU9XCJcIj48ZGl2IGNsYXNzPVwicHJldmlldyBjaGFydC10aXRsZVwiPnt7Y2xvbmVkRGF0YS5uYW1lfX08L2Rpdj48L2Rpdj4nKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dCgnY29tcG9uZW50cy9maWx0ZXJzL25vcm1hbHRleHQuaHRtbCcsJzxkaXYgY2xhc3M9XCJjZWxsYm94XCI+PGRpdiBjbGFzcz1cIm9wdGlvbi1idG5cIj48aSBjbGFzcz1cImZhIGZhLWJhcnNcIj48L2k+PC9kaXY+PHNwYW4gY2xhc3M9XCJmaWx0ZXItdGl0bGVcIj57e2NvbmZpZy50aXRsZX19PC9zcGFuPiA8aW5wdXQgY2xhc3M9XCJmaWx0ZXItbW9kdWxlXCI+PGRpdiBjbGFzcz1cImRyb3Atb3B0aW9uXCI+PGRpdiBjbGFzcz1cIm9wdGlvbi1yb3dcIiBuZy1jbGljaz1cInNob3dEYXRhKClcIj5cXHU2N0U1XFx1NzcwQlxcdTY1NzBcXHU2MzZFPC9kaXY+PGRpdiBjbGFzcz1cIm9wdGlvbi1yb3dcIiBuZy1jbGljaz1cInJlbW92ZUFjdGlvbigpXCI+XFx1NzlGQlxcdTk2NjQ8L2Rpdj48L2Rpdj48L2Rpdj4nKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dCgnY29tcG9uZW50cy9ncmlkaXRlbS9ncmlkaXRlbS5odG1sJywnPGRpdiBjbGFzcz1cInBhcmVudC1jb250ZW50XCIgaWQ9XCJjaGFydHNfe3sgY29uZmlnLmRhdGEuaWQgfX1cIj48ZGl2IGNsYXNzPVwicmVsZWFzZS1saW5rIGNoYXJ0LXRvb2xzXCIgbmctY2xpY2s9XCJyZWxlYXNlTGluaygpXCIgbmctaWY9XCJjb25maWcuZGF0YSAmJiBjb25maWcuZGF0YS5saW5rICYmIGNvbmZpZy5kYXRhLmxpbmsgPT0gXFwnbGlua1N0YXJ0XFwnXCI+PGkgY2xhc3M9XCJmYSBmYS11bmxpbmtcIiB0aXRsZT1cIlxcdTZFMDVcXHU5NjY0XFx1ODA1NFxcdTUyQThcIj48L2k+PC9kaXY+PGRpdiBjbGFzcz1cImNoYXJ0LWVubGFyZ2UgY2hhcnQtdG9vbHNcIiBuZy1jbGljaz1cImZ1bGxTaG93Q2hhcnQoKVwiIG5nLWlmPVwiIWRyb3BUeXBlICYmIGNvbmZpZy5kYXRhLmRhdGF0eXBlID09IFxcJ2NoYXJ0XFwnICYmIGNvbmZpZy5kYXRhLmRhdGF0eXBlICE9IFxcJ3RhYmxlXFwnICYmIGRldmljZVR5cGUgPT0gXFwncGNcXCdcIj48aSBjbGFzcz1cImZhIGZhLWFycm93cy1hbHRcIiB0aXRsZT1cIlxcdTUxNjhcXHU1QzRGXFx1NUM1NVxcdTc5M0FcIj48L2k+PC9kaXY+PGRpdiBjbGFzcz1cIm9wdGlvbi1idG5cIj48aSBjbGFzcz1cImZhIGZhLWJhcnMgZmEtaXRlbS1jb25maWctYnRuXCIgbmctY2xpY2s9XCJvcGVuRHJvcE9wdGlvbigkZXZlbnQpXCI+PC9pPjwvZGl2PjxkaXYgY2xhc3M9XCJmaWx0ZXItY29tcG5lbmV0LXdyYXBwZXIgdGV4dC1maWx0ZXItd3JhcHBlclwiPjwvZGl2PjxkaXYgbmctaWY9XCJkcm9wVHlwZT09XFwnZGF0ZVxcJ1wiPjxkaXYgY2xhc3M9XCJmaWx0ZXItbGFiZWwtY29udGFpbmVyXCIgc3R5bGU9XCJ3aWR0aDogMzAlOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XCI+PGxhYmVsIGNsYXNzPVwic2VhcmNobGFibGUgZmlsdGVyLWxhYmVsXCI+e3tjb25maWcuZGF0YS5maWx0ZXJOYW1lfX08L2xhYmVsPjwvZGl2PjxkaXYgc3R5bGU9XCJ3aWR0aDogY2FsYygzNSUgLSAxNXB4KTsgZGlzcGxheTogaW5saW5lLWJsb2NrO1wiPjxtZC1kYXRlcGlja2VyIG5nLW1vZGVsPVwiZGF0ZUZpbHRlci5zdGFydERhdGVcIiBtZC1wbGFjZWhvbGRlcj1cIlxcdTVGMDBcXHU1OUNCXFx1NjVGNlxcdTk1RjRcIiBuZy1jaGFuZ2U9XCJzZWxlY3REYXRlQ2hhbmdlKClcIiBtZC1oaWRlLWljb25zPVwiY2FsZW5kYXJcIiBtZC1vcGVuLW9uLWZvY3VzPVwiXCI+PC9tZC1kYXRlcGlja2VyPjwvZGl2PjxkaXYgc3R5bGU9XCJ3aWR0aDogMzBweDsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+PGRpdiBzdHlsZT1cIndpZHRoOiBjYWxjKDM1JSAtIDE1cHgpOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XCI+PG1kLWRhdGVwaWNrZXIgbmctbW9kZWw9XCJkYXRlRmlsdGVyLmVuZERhdGVcIiBtZC1wbGFjZWhvbGRlcj1cIlxcdTYyMkFcXHU2QjYyXFx1NjVGNlxcdTk1RjRcIiBuZy1jaGFuZ2U9XCJzZWxlY3REYXRlQ2hhbmdlKClcIiBtZC1oaWRlLWljb25zPVwiY2FsZW5kYXJcIiBtZC1vcGVuLW9uLWZvY3VzPVwiXCI+PC9tZC1kYXRlcGlja2VyPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XCJmaWx0ZXItY29tcG5lbmV0LXdyYXBwZXIgc2VsZWN0LWZpbHRlci13cmFwcGVyXCI+PC9kaXY+PGRpdiBjbGFzcz1cInJpY2gtdGV4dC1jb250ZW50IGZ1bGwtY29udGVudFwiIG5nLWlmPVwiZHJvcFR5cGU9PVxcJ2xhYmVsQm94XFwnXCIgbmctY2xhc3M9XCJ7XFwnc2Nyb2xsLWF1dG9cXCc6IGNvbmZpZy5kYXRhLmNvbXBvbmVudFR5cGUgPT0gXFwndGV4dFxcJ31cIj48ZGl2IGNsYXNzPVwiYXV0by1oaWRlXCIgbmctY2xhc3M9XCJ7XFwnYXV0by1zaG93XFwnOiBjb25maWcuZGF0YS5jb21wb25lbnRUeXBlID09IFxcJ3RleHRcXCd9XCIgbmctZGJsY2xpY2s9XCJvcGVuVGV4dEVkaXRvcigpXCIgbmctYmluZC1odG1sPVwiY29uZmlnLmRhdGEudGV4dENvbnRlbnRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiYXV0by1oaWRlIGZ1bGwtY29udGVudFwiIG5nLWNsYXNzPVwie1xcJ2F1dG8tc2hvd1xcJzogY29uZmlnLmRhdGEuY29tcG9uZW50VHlwZSA9PSBcXCd3ZWJQYWdlXFwnfVwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2ZmZmZmZjtcIj48ZGl2IG5nLXJlcGVhdD1cImxpbmsgaW4gY29uZmlnLmRhdGEubGlua3NcIiBjbGFzcz1cImZ1bGwtY29udGVudFwiPjxpZnJhbWUgY2xhc3M9XCJmdWxsLWNvbnRlbnQgZW1iZWRkZWQtZnJhbWVcIiBpZD1cInt7IGxpbmsuaWQgfX1cIj48L2lmcmFtZT48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IG5nLWlmPVwiIWRyb3BUeXBlICYmIGNvbmZpZy5kYXRhLmRhdGF0eXBlID09IFxcJ2NoYXJ0XFwnICYmIGNvbmZpZy5kYXRhLmRhdGF0eXBlICE9IFxcJ3RhYmxlXFwnXCIgY2xhc3M9XCJjaGFydC1jb250ZW50XCIgaWQ9XCJ7eyBjb25maWcuZGF0YS5pZCB9fVwiPjwvZGl2PjxkaXYgbmctaWY9XCIhZHJvcFR5cGUgJiYgY29uZmlnLmRhdGEuZGF0YXR5cGUgPT0gXFwndGFibGVcXCdcIiBjbGFzcz1cImNoYXJ0LWNvbnRlbnRcIiBuZy1jbGFzcz1cIntcXCdsaXRlLWJvcmRlclxcJzogY29uZmlnLmRhdGEuc3R5bGVDb25maWcubGl0ZUJvcmRlcn1cIj48ZGl2IGNsYXNzPVwidGFibGUtaGVhZGVyXCIgbmctaWY9XCJjb25maWcuZGF0YS5qc29uY29uZmlnLnRhYmxlVGl0bGUgJiYgY29uZmlnLmRhdGEuanNvbmNvbmZpZy50YWJsZVRpdGxlLmxlbmd0aCA+IDFcIj57eyBjb25maWcuZGF0YS5qc29uY29uZmlnLnRhYmxlVGl0bGUgfX08L2Rpdj48ZHgtdGFibGUgY29sdW1ucz1cImNvbHVtbnNcIiBkYXRhPVwidGFibGVPYmouZGF0YVwiIGN1c3RvbS1jb25maWc9XCJjdXN0b21Db25maWdcIiBmdWxsLWZpeD1cImNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLmZ1bGxGaXhcIiBoZWlnaHQ9XCJpdGVtVG90YWxIZWlnaHRcIiByb3ctaGVpZ2h0PVwidGFibGVSb3dIZWlnaHRcIj48L2R4LXRhYmxlPjwvZGl2PjxkaXYgbmctaWY9XCJjb25maWcuZGF0YS5kYXRhdHlwZSAmJiAoY29uZmlnLmRhdGEuZGF0YXR5cGUgPT0gXFwnY2hhcnRcXCcgfHwgY29uZmlnLmRhdGEuZGF0YXR5cGUgPT0gXFwndGFibGVcXCcpICYmIGNvbmZpZy5kYXRhLmNvbW1lbnRzQ29uZmlnLnNob3dDb21tZW50c1wiIGNsYXNzPVwiY2hhcnQtbGFiZWxcIiBuZy1jbGljaz1cIm9wZW5MYWJlbFRleHQoJGV2ZW50KVwiIG5nLWNsYXNzPVwie1xcJ2hvdmVyLXNob3dcXCc6ZGV2aWNlVHlwZT09XFwncGNcXCd9XCI+PGkgY2xhc3M9XCJmYSBmYS1lZGl0XCI+PC9pPiZuYnNwO1xcdThCQzRcXHU4QkJBPC9kaXY+PGRpdiBjbGFzcz1cImNoYXJ0LWxhYmVsLWFycm93XCIgbmctc3R5bGU9XCJjb25maWcuZGF0YS5jb21tZW50c0NvbmZpZy5zdHlsZS50b3RhbFwiPjwvZGl2PjwvZGl2PicpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KCdjb21wb25lbnRzL21vZGFsL21vZGFsLmh0bWwnLCc8ZGl2IGNsYXNzPVwibmdtb2RhbFwiIG5nLWlmPVwiaXNPcGVuXCI+PGRpdiBjbGFzcz1cIm1vZGFsLXdyYXBwZXJcIiBzdHlsZT1cInt7d3JhcHBlclN0eWxlfX1cIiBuZy10cmFuc2NsdWRlPVwiXCI+PC9kaXY+PC9kaXY+Jyk7XG4kdGVtcGxhdGVDYWNoZS5wdXQoJ2NvbXBvbmVudHMvbW9kYWwvbW9kYWxjbG9zZWJ1dHRvbi5odG1sJywnPGRpdiBjbGFzcz1cInJpZ2h0XCI+PGEgbmctY2xpY2s9XCJjbG9zZU1vZGFsKClcIiBjbGFzcz1cInJpZ2h0XCI+PGkgY2xhc3M9XCJmYSBmYS10aW1lc1wiPjwvaT48L2E+PC9kaXY+Jyk7fV0pOyIsIi8qIVxyXG4gKiBKU09OMyB3aXRoIGNvbXBhY3Qgc3RyaW5naWZ5IC0tIE1vZGlmaWVkIGJ5IEthbml0IFdvbmdzdXBoYXNhd2F0LiAgIGh0dHBzOi8vZ2l0aHViLmNvbS9rYW5pdHcvanNvbjNcclxuICpcclxuICogRm9ya2VkIGZyb20gSlNPTiB2My4zLjIgfCBodHRwczovL2Jlc3RpZWpzLmdpdGh1Yi5pby9qc29uMyB8IENvcHlyaWdodCAyMDEyLTIwMTQsIEtpdCBDYW1icmlkZ2UgfCBodHRwOi8va2l0Lm1pdC1saWNlbnNlLm9yZ1xyXG4gKi9cclxuOyhmdW5jdGlvbiAoKSB7XHJcbiAgLy8gRGV0ZWN0IHRoZSBgZGVmaW5lYCBmdW5jdGlvbiBleHBvc2VkIGJ5IGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy4gVGhlXHJcbiAgLy8gc3RyaWN0IGBkZWZpbmVgIGNoZWNrIGlzIG5lY2Vzc2FyeSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIGByLmpzYC5cclxuICB2YXIgaXNMb2FkZXIgPSB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZDtcclxuXHJcbiAgLy8gQSBzZXQgb2YgdHlwZXMgdXNlZCB0byBkaXN0aW5ndWlzaCBvYmplY3RzIGZyb20gcHJpbWl0aXZlcy5cclxuICB2YXIgb2JqZWN0VHlwZXMgPSB7XHJcbiAgICBcImZ1bmN0aW9uXCI6IHRydWUsXHJcbiAgICBcIm9iamVjdFwiOiB0cnVlXHJcbiAgfTtcclxuXHJcbiAgLy8gRGV0ZWN0IHRoZSBgZXhwb3J0c2Agb2JqZWN0IGV4cG9zZWQgYnkgQ29tbW9uSlMgaW1wbGVtZW50YXRpb25zLlxyXG4gIHZhciBmcmVlRXhwb3J0cyA9IG9iamVjdFR5cGVzW3R5cGVvZiBleHBvcnRzXSAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XHJcblxyXG4gIC8vIFVzZSB0aGUgYGdsb2JhbGAgb2JqZWN0IGV4cG9zZWQgYnkgTm9kZSAoaW5jbHVkaW5nIEJyb3dzZXJpZnkgdmlhXHJcbiAgLy8gYGluc2VydC1tb2R1bGUtZ2xvYmFsc2ApLCBOYXJ3aGFsLCBhbmQgUmluZ28gYXMgdGhlIGRlZmF1bHQgY29udGV4dCxcclxuICAvLyBhbmQgdGhlIGB3aW5kb3dgIG9iamVjdCBpbiBicm93c2Vycy4gUmhpbm8gZXhwb3J0cyBhIGBnbG9iYWxgIGZ1bmN0aW9uXHJcbiAgLy8gaW5zdGVhZC5cclxuICB2YXIgcm9vdCA9IG9iamVjdFR5cGVzW3R5cGVvZiB3aW5kb3ddICYmIHdpbmRvdyB8fCB0aGlzLFxyXG4gICAgICBmcmVlR2xvYmFsID0gZnJlZUV4cG9ydHMgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIG1vZHVsZV0gJiYgbW9kdWxlICYmICFtb2R1bGUubm9kZVR5cGUgJiYgdHlwZW9mIGdsb2JhbCA9PSBcIm9iamVjdFwiICYmIGdsb2JhbDtcclxuXHJcbiAgaWYgKGZyZWVHbG9iYWwgJiYgKGZyZWVHbG9iYWxbXCJnbG9iYWxcIl0gPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbFtcIndpbmRvd1wiXSA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsW1wic2VsZlwiXSA9PT0gZnJlZUdsb2JhbCkpIHtcclxuICAgIHJvb3QgPSBmcmVlR2xvYmFsO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBJbml0aWFsaXplcyBKU09OIDMgdXNpbmcgdGhlIGdpdmVuIGBjb250ZXh0YCBvYmplY3QsIGF0dGFjaGluZyB0aGVcclxuICAvLyBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBmdW5jdGlvbnMgdG8gdGhlIHNwZWNpZmllZCBgZXhwb3J0c2Agb2JqZWN0LlxyXG4gIGZ1bmN0aW9uIHJ1bkluQ29udGV4dChjb250ZXh0LCBleHBvcnRzKSB7XHJcbiAgICBjb250ZXh0IHx8IChjb250ZXh0ID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcclxuICAgIGV4cG9ydHMgfHwgKGV4cG9ydHMgPSByb290W1wiT2JqZWN0XCJdKCkpO1xyXG5cclxuICAgIC8vIE5hdGl2ZSBjb25zdHJ1Y3RvciBhbGlhc2VzLlxyXG4gICAgdmFyIE51bWJlciA9IGNvbnRleHRbXCJOdW1iZXJcIl0gfHwgcm9vdFtcIk51bWJlclwiXSxcclxuICAgICAgICBTdHJpbmcgPSBjb250ZXh0W1wiU3RyaW5nXCJdIHx8IHJvb3RbXCJTdHJpbmdcIl0sXHJcbiAgICAgICAgT2JqZWN0ID0gY29udGV4dFtcIk9iamVjdFwiXSB8fCByb290W1wiT2JqZWN0XCJdLFxyXG4gICAgICAgIERhdGUgPSBjb250ZXh0W1wiRGF0ZVwiXSB8fCByb290W1wiRGF0ZVwiXSxcclxuICAgICAgICBTeW50YXhFcnJvciA9IGNvbnRleHRbXCJTeW50YXhFcnJvclwiXSB8fCByb290W1wiU3ludGF4RXJyb3JcIl0sXHJcbiAgICAgICAgVHlwZUVycm9yID0gY29udGV4dFtcIlR5cGVFcnJvclwiXSB8fCByb290W1wiVHlwZUVycm9yXCJdLFxyXG4gICAgICAgIE1hdGggPSBjb250ZXh0W1wiTWF0aFwiXSB8fCByb290W1wiTWF0aFwiXSxcclxuICAgICAgICBuYXRpdmVKU09OID0gY29udGV4dFtcIkpTT05cIl0gfHwgcm9vdFtcIkpTT05cIl07XHJcblxyXG4gICAgLy8gRGVsZWdhdGUgdG8gdGhlIG5hdGl2ZSBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBpbXBsZW1lbnRhdGlvbnMuXHJcbiAgICBpZiAodHlwZW9mIG5hdGl2ZUpTT04gPT0gXCJvYmplY3RcIiAmJiBuYXRpdmVKU09OKSB7XHJcbiAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gbmF0aXZlSlNPTi5zdHJpbmdpZnk7XHJcbiAgICAgIGV4cG9ydHMucGFyc2UgPSBuYXRpdmVKU09OLnBhcnNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbnZlbmllbmNlIGFsaWFzZXMuXHJcbiAgICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlLFxyXG4gICAgICAgIGdldENsYXNzID0gb2JqZWN0UHJvdG8udG9TdHJpbmcsXHJcbiAgICAgICAgaXNQcm9wZXJ0eSwgZm9yRWFjaCwgdW5kZWY7XHJcblxyXG4gICAgLy8gVGVzdCB0aGUgYERhdGUjZ2V0VVRDKmAgbWV0aG9kcy4gQmFzZWQgb24gd29yayBieSBAWWFmZmxlLlxyXG4gICAgdmFyIGlzRXh0ZW5kZWQgPSBuZXcgRGF0ZSgtMzUwOTgyNzMzNDU3MzI5Mik7XHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBUaGUgYGdldFVUQ0Z1bGxZZWFyYCwgYE1vbnRoYCwgYW5kIGBEYXRlYCBtZXRob2RzIHJldHVybiBub25zZW5zaWNhbFxyXG4gICAgICAvLyByZXN1bHRzIGZvciBjZXJ0YWluIGRhdGVzIGluIE9wZXJhID49IDEwLjUzLlxyXG4gICAgICBpc0V4dGVuZGVkID0gaXNFeHRlbmRlZC5nZXRVVENGdWxsWWVhcigpID09IC0xMDkyNTIgJiYgaXNFeHRlbmRlZC5nZXRVVENNb250aCgpID09PSAwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDRGF0ZSgpID09PSAxICYmXHJcbiAgICAgICAgLy8gU2FmYXJpIDwgMi4wLjIgc3RvcmVzIHRoZSBpbnRlcm5hbCBtaWxsaXNlY29uZCB0aW1lIHZhbHVlIGNvcnJlY3RseSxcclxuICAgICAgICAvLyBidXQgY2xpcHMgdGhlIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgZGF0ZSBtZXRob2RzIHRvIHRoZSByYW5nZSBvZlxyXG4gICAgICAgIC8vIHNpZ25lZCAzMi1iaXQgaW50ZWdlcnMgKFstMiAqKiAzMSwgMiAqKiAzMSAtIDFdKS5cclxuICAgICAgICBpc0V4dGVuZGVkLmdldFVUQ0hvdXJzKCkgPT0gMTAgJiYgaXNFeHRlbmRlZC5nZXRVVENNaW51dGVzKCkgPT0gMzcgJiYgaXNFeHRlbmRlZC5nZXRVVENTZWNvbmRzKCkgPT0gNiAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbGxpc2Vjb25kcygpID09IDcwODtcclxuICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cclxuXHJcbiAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBuYXRpdmUgYEpTT04uc3RyaW5naWZ5YCBhbmQgYHBhcnNlYFxyXG4gICAgLy8gaW1wbGVtZW50YXRpb25zIGFyZSBzcGVjLWNvbXBsaWFudC4gQmFzZWQgb24gd29yayBieSBLZW4gU255ZGVyLlxyXG4gICAgZnVuY3Rpb24gaGFzKG5hbWUpIHtcclxuICAgICAgaWYgKGhhc1tuYW1lXSAhPT0gdW5kZWYpIHtcclxuICAgICAgICAvLyBSZXR1cm4gY2FjaGVkIGZlYXR1cmUgdGVzdCByZXN1bHQuXHJcbiAgICAgICAgcmV0dXJuIGhhc1tuYW1lXTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgaXNTdXBwb3J0ZWQ7XHJcbiAgICAgIGlmIChuYW1lID09IFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpIHtcclxuICAgICAgICAvLyBJRSA8PSA3IGRvZXNuJ3Qgc3VwcG9ydCBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgdXNpbmcgc3F1YXJlXHJcbiAgICAgICAgLy8gYnJhY2tldCBub3RhdGlvbi4gSUUgOCBvbmx5IHN1cHBvcnRzIHRoaXMgZm9yIHByaW1pdGl2ZXMuXHJcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBcImFcIlswXSAhPSBcImFcIjtcclxuICAgICAgfSBlbHNlIGlmIChuYW1lID09IFwianNvblwiKSB7XHJcbiAgICAgICAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgYm90aCBgSlNPTi5zdHJpbmdpZnlgIGFuZCBgSlNPTi5wYXJzZWAgYXJlXHJcbiAgICAgICAgLy8gc3VwcG9ydGVkLlxyXG4gICAgICAgIGlzU3VwcG9ydGVkID0gaGFzKFwianNvbi1zdHJpbmdpZnlcIikgJiYgaGFzKFwianNvbi1wYXJzZVwiKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgdmFsdWUsIHNlcmlhbGl6ZWQgPSAne1wiYVwiOlsxLHRydWUsZmFsc2UsbnVsbCxcIlxcXFx1MDAwMFxcXFxiXFxcXG5cXFxcZlxcXFxyXFxcXHRcIl19JztcclxuICAgICAgICAvLyBUZXN0IGBKU09OLnN0cmluZ2lmeWAuXHJcbiAgICAgICAgaWYgKG5hbWUgPT0gXCJqc29uLXN0cmluZ2lmeVwiKSB7XHJcbiAgICAgICAgICB2YXIgc3RyaW5naWZ5ID0gZXhwb3J0cy5zdHJpbmdpZnksIHN0cmluZ2lmeVN1cHBvcnRlZCA9IHR5cGVvZiBzdHJpbmdpZnkgPT0gXCJmdW5jdGlvblwiICYmIGlzRXh0ZW5kZWQ7XHJcbiAgICAgICAgICBpZiAoc3RyaW5naWZ5U3VwcG9ydGVkKSB7XHJcbiAgICAgICAgICAgIC8vIEEgdGVzdCBmdW5jdGlvbiBvYmplY3Qgd2l0aCBhIGN1c3RvbSBgdG9KU09OYCBtZXRob2QuXHJcbiAgICAgICAgICAgICh2YWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgfSkudG9KU09OID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID1cclxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggMy4xYjEgYW5kIGIyIHNlcmlhbGl6ZSBzdHJpbmcsIG51bWJlciwgYW5kIGJvb2xlYW5cclxuICAgICAgICAgICAgICAgIC8vIHByaW1pdGl2ZXMgYXMgb2JqZWN0IGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KDApID09PSBcIjBcIiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyLCBhbmQgSlNPTiAyIHNlcmlhbGl6ZSB3cmFwcGVkIHByaW1pdGl2ZXMgYXMgb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAvLyBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgTnVtYmVyKCkpID09PSBcIjBcIiAmJlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBTdHJpbmcoKSkgPT0gJ1wiXCInICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiB0aHJvdyBhbiBlcnJvciBpZiB0aGUgdmFsdWUgaXMgYG51bGxgLCBgdW5kZWZpbmVkYCwgb3JcclxuICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IGRlZmluZSBhIGNhbm9uaWNhbCBKU09OIHJlcHJlc2VudGF0aW9uICh0aGlzIGFwcGxpZXMgdG9cclxuICAgICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBgdG9KU09OYCBwcm9wZXJ0aWVzIGFzIHdlbGwsICp1bmxlc3MqIHRoZXkgYXJlIG5lc3RlZFxyXG4gICAgICAgICAgICAgICAgLy8gd2l0aGluIGFuIG9iamVjdCBvciBhcnJheSkuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoZ2V0Q2xhc3MpID09PSB1bmRlZiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gSUUgOCBzZXJpYWxpemVzIGB1bmRlZmluZWRgIGFzIGBcInVuZGVmaW5lZFwiYC4gU2FmYXJpIDw9IDUuMS43IGFuZFxyXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjMgcGFzcyB0aGlzIHRlc3QuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodW5kZWYpID09PSB1bmRlZiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS43IGFuZCBGRiAzLjFiMyB0aHJvdyBgRXJyb3JgcyBhbmQgYFR5cGVFcnJvcmBzLFxyXG4gICAgICAgICAgICAgICAgLy8gcmVzcGVjdGl2ZWx5LCBpZiB0aGUgdmFsdWUgaXMgb21pdHRlZCBlbnRpcmVseS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSgpID09PSB1bmRlZiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIG5vdCBhIG51bWJlcixcclxuICAgICAgICAgICAgICAgIC8vIHN0cmluZywgYXJyYXksIG9iamVjdCwgQm9vbGVhbiwgb3IgYG51bGxgIGxpdGVyYWwuIFRoaXMgYXBwbGllcyB0b1xyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzIGFzIHdlbGwsIHVubGVzcyB0aGV5IGFyZSBuZXN0ZWRcclxuICAgICAgICAgICAgICAgIC8vIGluc2lkZSBvYmplY3Qgb3IgYXJyYXkgbGl0ZXJhbHMuIFlVSSAzLjAuMGIxIGlnbm9yZXMgY3VzdG9tIGB0b0pTT05gXHJcbiAgICAgICAgICAgICAgICAvLyBtZXRob2RzIGVudGlyZWx5LlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHZhbHVlKSA9PT0gXCIxXCIgJiZcclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdmFsdWVdKSA9PSBcIlsxXVwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBQcm90b3R5cGUgPD0gMS42LjEgc2VyaWFsaXplcyBgW3VuZGVmaW5lZF1gIGFzIGBcIltdXCJgIGluc3RlYWQgb2ZcclxuICAgICAgICAgICAgICAgIC8vIGBcIltudWxsXVwiYC5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWZdKSA9PSBcIltudWxsXVwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBZVUkgMy4wLjBiMSBmYWlscyB0byBzZXJpYWxpemUgYG51bGxgIGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwpID09IFwibnVsbFwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiBoYWx0cyBzZXJpYWxpemF0aW9uIGlmIGFuIGFycmF5IGNvbnRhaW5zIGEgZnVuY3Rpb246XHJcbiAgICAgICAgICAgICAgICAvLyBgWzEsIHRydWUsIGdldENsYXNzLCAxXWAgc2VyaWFsaXplcyBhcyBcIlsxLHRydWUsXSxcIi4gRkYgMy4xYjNcclxuICAgICAgICAgICAgICAgIC8vIGVsaWRlcyBub24tSlNPTiB2YWx1ZXMgZnJvbSBvYmplY3RzIGFuZCBhcnJheXMsIHVubGVzcyB0aGV5XHJcbiAgICAgICAgICAgICAgICAvLyBkZWZpbmUgY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3VuZGVmLCBnZXRDbGFzcywgbnVsbF0pID09IFwiW251bGwsbnVsbCxudWxsXVwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgc2VyaWFsaXphdGlvbiB0ZXN0LiBGRiAzLjFiMSB1c2VzIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlc1xyXG4gICAgICAgICAgICAgICAgLy8gd2hlcmUgY2hhcmFjdGVyIGVzY2FwZSBjb2RlcyBhcmUgZXhwZWN0ZWQgKGUuZy4sIGBcXGJgID0+IGBcXHUwMDA4YCkuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoeyBcImFcIjogW3ZhbHVlLCB0cnVlLCBmYWxzZSwgbnVsbCwgXCJcXHgwMFxcYlxcblxcZlxcclxcdFwiXSB9KSA9PSBzZXJpYWxpemVkICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSBhbmQgYjIgaWdub3JlIHRoZSBgZmlsdGVyYCBhbmQgYHdpZHRoYCBhcmd1bWVudHMuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCwgdmFsdWUpID09PSBcIjFcIiAmJlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFsxLCAyXSwgbnVsbCwgMSkgPT0gXCJbXFxuIDEsXFxuIDJcXG5dXCIgJiZcclxuICAgICAgICAgICAgICAgIC8vIEpTT04gMiwgUHJvdG90eXBlIDw9IDEuNywgYW5kIG9sZGVyIFdlYktpdCBidWlsZHMgaW5jb3JyZWN0bHlcclxuICAgICAgICAgICAgICAgIC8vIHNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycy5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtOC42NGUxNSkpID09ICdcIi0yNzE4MjEtMDQtMjBUMDA6MDA6MDAuMDAwWlwiJyAmJlxyXG4gICAgICAgICAgICAgICAgLy8gVGhlIG1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNSwgYnV0IHJlcXVpcmVkIGluIDUuMS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSg4LjY0ZTE1KSkgPT0gJ1wiKzI3NTc2MC0wOS0xM1QwMDowMDowMC4wMDBaXCInICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDw9IDExLjAgaW5jb3JyZWN0bHkgc2VyaWFsaXplcyB5ZWFycyBwcmlvciB0byAwIGFzIG5lZ2F0aXZlXHJcbiAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IHllYXJzIGluc3RlYWQgb2Ygc2l4LWRpZ2l0IHllYXJzLiBDcmVkaXRzOiBAWWFmZmxlLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC02MjE5ODc1NTJlNSkpID09ICdcIi0wMDAwMDEtMDEtMDFUMDA6MDA6MDAuMDAwWlwiJyAmJlxyXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS41IGFuZCBPcGVyYSA+PSAxMC41MyBpbmNvcnJlY3RseSBzZXJpYWxpemUgbWlsbGlzZWNvbmRcclxuICAgICAgICAgICAgICAgIC8vIHZhbHVlcyBsZXNzIHRoYW4gMTAwMC4gQ3JlZGl0czogQFlhZmZsZS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtMSkpID09ICdcIjE5NjktMTItMzFUMjM6NTk6NTkuOTk5WlwiJztcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gc3RyaW5naWZ5U3VwcG9ydGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUZXN0IGBKU09OLnBhcnNlYC5cclxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tcGFyc2VcIikge1xyXG4gICAgICAgICAgdmFyIHBhcnNlID0gZXhwb3J0cy5wYXJzZTtcclxuICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2UgPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIGEgYmFyZSBsaXRlcmFsIGlzIHByb3ZpZGVkLlxyXG4gICAgICAgICAgICAgIC8vIENvbmZvcm1pbmcgaW1wbGVtZW50YXRpb25zIHNob3VsZCBhbHNvIGNvZXJjZSB0aGUgaW5pdGlhbCBhcmd1bWVudCB0b1xyXG4gICAgICAgICAgICAgIC8vIGEgc3RyaW5nIHByaW9yIHRvIHBhcnNpbmcuXHJcbiAgICAgICAgICAgICAgaWYgKHBhcnNlKFwiMFwiKSA9PT0gMCAmJiAhcGFyc2UoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgcGFyc2luZyB0ZXN0LlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZShzZXJpYWxpemVkKTtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZVN1cHBvcnRlZCA9IHZhbHVlW1wiYVwiXS5sZW5ndGggPT0gNSAmJiB2YWx1ZVtcImFcIl1bMF0gPT09IDE7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjIgYW5kIEZGIDMuMWIxIGFsbG93IHVuZXNjYXBlZCB0YWJzIGluIHN0cmluZ3MuXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSAhcGFyc2UoJ1wiXFx0XCInKTtcclxuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG4gICAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wIGFuZCA0LjAuMSBhbGxvdyBsZWFkaW5nIGArYCBzaWducyBhbmQgbGVhZGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gZGVjaW1hbCBwb2ludHMuIEZGIDQuMCwgNC4wLjEsIGFuZCBJRSA5LTEwIGFsc28gYWxsb3dcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIGNlcnRhaW4gb2N0YWwgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMDFcIikgIT09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAsIDQuMC4xLCBhbmQgUmhpbm8gMS43UjMtUjQgYWxsb3cgdHJhaWxpbmcgZGVjaW1hbFxyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gcG9pbnRzLiBUaGVzZSBlbnZpcm9ubWVudHMsIGFsb25nIHdpdGggRkYgMy4xYjEgYW5kIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIGFsbG93IHRyYWlsaW5nIGNvbW1hcyBpbiBKU09OIG9iamVjdHMgYW5kIGFycmF5cy5cclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIxLlwiKSAhPT0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xyXG4gICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gcGFyc2VTdXBwb3J0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBoYXNbbmFtZV0gPSAhIWlzU3VwcG9ydGVkO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0cnVlKSB7IC8vIHVzZWQgdG8gYmUgIWhhcyhcImpzb25cIilcclxuICAgICAgLy8gQ29tbW9uIGBbW0NsYXNzXV1gIG5hbWUgYWxpYXNlcy5cclxuICAgICAgdmFyIGZ1bmN0aW9uQ2xhc3MgPSBcIltvYmplY3QgRnVuY3Rpb25dXCIsXHJcbiAgICAgICAgICBkYXRlQ2xhc3MgPSBcIltvYmplY3QgRGF0ZV1cIixcclxuICAgICAgICAgIG51bWJlckNsYXNzID0gXCJbb2JqZWN0IE51bWJlcl1cIixcclxuICAgICAgICAgIHN0cmluZ0NsYXNzID0gXCJbb2JqZWN0IFN0cmluZ11cIixcclxuICAgICAgICAgIGFycmF5Q2xhc3MgPSBcIltvYmplY3QgQXJyYXldXCIsXHJcbiAgICAgICAgICBib29sZWFuQ2xhc3MgPSBcIltvYmplY3QgQm9vbGVhbl1cIjtcclxuXHJcbiAgICAgIC8vIERldGVjdCBpbmNvbXBsZXRlIHN1cHBvcnQgZm9yIGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyBieSBpbmRleC5cclxuICAgICAgdmFyIGNoYXJJbmRleEJ1Z2d5ID0gaGFzKFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpO1xyXG5cclxuICAgICAgLy8gRGVmaW5lIGFkZGl0aW9uYWwgdXRpbGl0eSBtZXRob2RzIGlmIHRoZSBgRGF0ZWAgbWV0aG9kcyBhcmUgYnVnZ3kuXHJcbiAgICAgIGlmICghaXNFeHRlbmRlZCkge1xyXG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XHJcbiAgICAgICAgLy8gQSBtYXBwaW5nIGJldHdlZW4gdGhlIG1vbnRocyBvZiB0aGUgeWVhciBhbmQgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW5cclxuICAgICAgICAvLyBKYW51YXJ5IDFzdCBhbmQgdGhlIGZpcnN0IG9mIHRoZSByZXNwZWN0aXZlIG1vbnRoLlxyXG4gICAgICAgIHZhciBNb250aHMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdO1xyXG4gICAgICAgIC8vIEludGVybmFsOiBDYWxjdWxhdGVzIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuIHRoZSBVbml4IGVwb2NoIGFuZCB0aGVcclxuICAgICAgICAvLyBmaXJzdCBkYXkgb2YgdGhlIGdpdmVuIG1vbnRoLlxyXG4gICAgICAgIHZhciBnZXREYXkgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICAgIHJldHVybiBNb250aHNbbW9udGhdICsgMzY1ICogKHllYXIgLSAxOTcwKSArIGZsb29yKCh5ZWFyIC0gMTk2OSArIChtb250aCA9ICsobW9udGggPiAxKSkpIC8gNCkgLSBmbG9vcigoeWVhciAtIDE5MDEgKyBtb250aCkgLyAxMDApICsgZmxvb3IoKHllYXIgLSAxNjAxICsgbW9udGgpIC8gNDAwKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiBhIHByb3BlcnR5IGlzIGEgZGlyZWN0IHByb3BlcnR5IG9mIHRoZSBnaXZlblxyXG4gICAgICAvLyBvYmplY3QuIERlbGVnYXRlcyB0byB0aGUgbmF0aXZlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIG1ldGhvZC5cclxuICAgICAgaWYgKCEoaXNQcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5KSkge1xyXG4gICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgaWYgKChtZW1iZXJzLl9fcHJvdG9fXyA9IG51bGwsIG1lbWJlcnMuX19wcm90b19fID0ge1xyXG4gICAgICAgICAgICAvLyBUaGUgKnByb3RvKiBwcm9wZXJ0eSBjYW5ub3QgYmUgc2V0IG11bHRpcGxlIHRpbWVzIGluIHJlY2VudFxyXG4gICAgICAgICAgICAvLyB2ZXJzaW9ucyBvZiBGaXJlZm94IGFuZCBTZWFNb25rZXkuXHJcbiAgICAgICAgICAgIFwidG9TdHJpbmdcIjogMVxyXG4gICAgICAgICAgfSwgbWVtYmVycykudG9TdHJpbmcgIT0gZ2V0Q2xhc3MpIHtcclxuICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC4zIGRvZXNuJ3QgaW1wbGVtZW50IGBPYmplY3QjaGFzT3duUHJvcGVydHlgLCBidXRcclxuICAgICAgICAgICAgLy8gc3VwcG9ydHMgdGhlIG11dGFibGUgKnByb3RvKiBwcm9wZXJ0eS5cclxuICAgICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgIC8vIENhcHR1cmUgYW5kIGJyZWFrIHRoZSBvYmplY3QncyBwcm90b3R5cGUgY2hhaW4gKHNlZSBzZWN0aW9uIDguNi4yXHJcbiAgICAgICAgICAgICAgLy8gb2YgdGhlIEVTIDUuMSBzcGVjKS4gVGhlIHBhcmVudGhlc2l6ZWQgZXhwcmVzc2lvbiBwcmV2ZW50cyBhblxyXG4gICAgICAgICAgICAgIC8vIHVuc2FmZSB0cmFuc2Zvcm1hdGlvbiBieSB0aGUgQ2xvc3VyZSBDb21waWxlci5cclxuICAgICAgICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLl9fcHJvdG9fXywgcmVzdWx0ID0gcHJvcGVydHkgaW4gKHRoaXMuX19wcm90b19fID0gbnVsbCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgb3JpZ2luYWwgcHJvdG90eXBlIGNoYWluLlxyXG4gICAgICAgICAgICAgIHRoaXMuX19wcm90b19fID0gb3JpZ2luYWw7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENhcHR1cmUgYSByZWZlcmVuY2UgdG8gdGhlIHRvcC1sZXZlbCBgT2JqZWN0YCBjb25zdHJ1Y3Rvci5cclxuICAgICAgICAgICAgY29uc3RydWN0b3IgPSBtZW1iZXJzLmNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgICAvLyBVc2UgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgdG8gc2ltdWxhdGUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW5cclxuICAgICAgICAgICAgLy8gb3RoZXIgZW52aXJvbm1lbnRzLlxyXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgdmFyIHBhcmVudCA9ICh0aGlzLmNvbnN0cnVjdG9yIHx8IGNvbnN0cnVjdG9yKS5wcm90b3R5cGU7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5IGluIHRoaXMgJiYgIShwcm9wZXJ0eSBpbiBwYXJlbnQgJiYgdGhpc1twcm9wZXJ0eV0gPT09IHBhcmVudFtwcm9wZXJ0eV0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbWVtYmVycyA9IG51bGw7XHJcbiAgICAgICAgICByZXR1cm4gaXNQcm9wZXJ0eS5jYWxsKHRoaXMsIHByb3BlcnR5KTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogTm9ybWFsaXplcyB0aGUgYGZvci4uLmluYCBpdGVyYXRpb24gYWxnb3JpdGhtIGFjcm9zc1xyXG4gICAgICAvLyBlbnZpcm9ubWVudHMuIEVhY2ggZW51bWVyYXRlZCBrZXkgaXMgeWllbGRlZCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uXHJcbiAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBzaXplID0gMCwgUHJvcGVydGllcywgbWVtYmVycywgcHJvcGVydHk7XHJcblxyXG4gICAgICAgIC8vIFRlc3RzIGZvciBidWdzIGluIHRoZSBjdXJyZW50IGVudmlyb25tZW50J3MgYGZvci4uLmluYCBhbGdvcml0aG0uIFRoZVxyXG4gICAgICAgIC8vIGB2YWx1ZU9mYCBwcm9wZXJ0eSBpbmhlcml0cyB0aGUgbm9uLWVudW1lcmFibGUgZmxhZyBmcm9tXHJcbiAgICAgICAgLy8gYE9iamVjdC5wcm90b3R5cGVgIGluIG9sZGVyIHZlcnNpb25zIG9mIElFLCBOZXRzY2FwZSwgYW5kIE1vemlsbGEuXHJcbiAgICAgICAgKFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB0aGlzLnZhbHVlT2YgPSAwO1xyXG4gICAgICAgIH0pLnByb3RvdHlwZS52YWx1ZU9mID0gMDtcclxuXHJcbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgUHJvcGVydGllc2AgY2xhc3MuXHJcbiAgICAgICAgbWVtYmVycyA9IG5ldyBQcm9wZXJ0aWVzKCk7XHJcbiAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBtZW1iZXJzKSB7XHJcbiAgICAgICAgICAvLyBJZ25vcmUgYWxsIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxyXG4gICAgICAgICAgaWYgKGlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkpIHtcclxuICAgICAgICAgICAgc2l6ZSsrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBQcm9wZXJ0aWVzID0gbWVtYmVycyA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgaXRlcmF0aW9uIGFsZ29yaXRobS5cclxuICAgICAgICBpZiAoIXNpemUpIHtcclxuICAgICAgICAgIC8vIEEgbGlzdCBvZiBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cclxuICAgICAgICAgIG1lbWJlcnMgPSBbXCJ2YWx1ZU9mXCIsIFwidG9TdHJpbmdcIiwgXCJ0b0xvY2FsZVN0cmluZ1wiLCBcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsIFwiaXNQcm90b3R5cGVPZlwiLCBcImhhc093blByb3BlcnR5XCIsIFwiY29uc3RydWN0b3JcIl07XHJcbiAgICAgICAgICAvLyBJRSA8PSA4LCBNb3ppbGxhIDEuMCwgYW5kIE5ldHNjYXBlIDYuMiBpZ25vcmUgc2hhZG93ZWQgbm9uLWVudW1lcmFibGVcclxuICAgICAgICAgIC8vIHByb3BlcnRpZXMuXHJcbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGxlbmd0aDtcclxuICAgICAgICAgICAgdmFyIGhhc1Byb3BlcnR5ID0gIWlzRnVuY3Rpb24gJiYgdHlwZW9mIG9iamVjdC5jb25zdHJ1Y3RvciAhPSBcImZ1bmN0aW9uXCIgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIG9iamVjdC5oYXNPd25Qcm9wZXJ0eV0gJiYgb2JqZWN0Lmhhc093blByb3BlcnR5IHx8IGlzUHJvcGVydHk7XHJcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgLy8gR2Vja28gPD0gMS4wIGVudW1lcmF0ZXMgdGhlIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyB1bmRlclxyXG4gICAgICAgICAgICAgIC8vIGNlcnRhaW4gY29uZGl0aW9uczsgSUUgZG9lcyBub3QuXHJcbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiBoYXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggbm9uLWVudW1lcmFibGUgcHJvcGVydHkuXHJcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gbWVtYmVycy5sZW5ndGg7IHByb3BlcnR5ID0gbWVtYmVyc1stLWxlbmd0aF07IGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgY2FsbGJhY2socHJvcGVydHkpKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIGlmIChzaXplID09IDIpIHtcclxuICAgICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuNCBlbnVtZXJhdGVzIHNoYWRvd2VkIHByb3BlcnRpZXMgdHdpY2UuXHJcbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgc2V0IG9mIGl0ZXJhdGVkIHByb3BlcnRpZXMuXHJcbiAgICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHk7XHJcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgLy8gU3RvcmUgZWFjaCBwcm9wZXJ0eSBuYW1lIHRvIHByZXZlbnQgZG91YmxlIGVudW1lcmF0aW9uLiBUaGVcclxuICAgICAgICAgICAgICAvLyBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgaXMgbm90IGVudW1lcmF0ZWQgZHVlIHRvIGNyb3NzLVxyXG4gICAgICAgICAgICAgIC8vIGVudmlyb25tZW50IGluY29uc2lzdGVuY2llcy5cclxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmICFpc1Byb3BlcnR5LmNhbGwobWVtYmVycywgcHJvcGVydHkpICYmIChtZW1iZXJzW3Byb3BlcnR5XSA9IDEpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gTm8gYnVncyBkZXRlY3RlZDsgdXNlIHRoZSBzdGFuZGFyZCBgZm9yLi4uaW5gIGFsZ29yaXRobS5cclxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgaXNDb25zdHJ1Y3RvcjtcclxuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcclxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiAhKGlzQ29uc3RydWN0b3IgPSBwcm9wZXJ0eSA9PT0gXCJjb25zdHJ1Y3RvclwiKSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBNYW51YWxseSBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSBkdWUgdG9cclxuICAgICAgICAgICAgLy8gY3Jvc3MtZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxyXG4gICAgICAgICAgICBpZiAoaXNDb25zdHJ1Y3RvciB8fCBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCAocHJvcGVydHkgPSBcImNvbnN0cnVjdG9yXCIpKSkge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZvckVhY2gob2JqZWN0LCBjYWxsYmFjayk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBQdWJsaWM6IFNlcmlhbGl6ZXMgYSBKYXZhU2NyaXB0IGB2YWx1ZWAgYXMgYSBKU09OIHN0cmluZy4gVGhlIG9wdGlvbmFsXHJcbiAgICAgIC8vIGBmaWx0ZXJgIGFyZ3VtZW50IG1heSBzcGVjaWZ5IGVpdGhlciBhIGZ1bmN0aW9uIHRoYXQgYWx0ZXJzIGhvdyBvYmplY3QgYW5kXHJcbiAgICAgIC8vIGFycmF5IG1lbWJlcnMgYXJlIHNlcmlhbGl6ZWQsIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MgYW5kIG51bWJlcnMgdGhhdFxyXG4gICAgICAvLyBpbmRpY2F0ZXMgd2hpY2ggcHJvcGVydGllcyBzaG91bGQgYmUgc2VyaWFsaXplZC4gVGhlIG9wdGlvbmFsIGB3aWR0aGBcclxuICAgICAgLy8gYXJndW1lbnQgbWF5IGJlIGVpdGhlciBhIHN0cmluZyBvciBudW1iZXIgdGhhdCBzcGVjaWZpZXMgdGhlIGluZGVudGF0aW9uXHJcbiAgICAgIC8vIGxldmVsIG9mIHRoZSBvdXRwdXQuXHJcbiAgICAgIGlmICh0cnVlKSB7XHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy5cclxuICAgICAgICB2YXIgRXNjYXBlcyA9IHtcclxuICAgICAgICAgIDkyOiBcIlxcXFxcXFxcXCIsXHJcbiAgICAgICAgICAzNDogJ1xcXFxcIicsXHJcbiAgICAgICAgICA4OiBcIlxcXFxiXCIsXHJcbiAgICAgICAgICAxMjogXCJcXFxcZlwiLFxyXG4gICAgICAgICAgMTA6IFwiXFxcXG5cIixcclxuICAgICAgICAgIDEzOiBcIlxcXFxyXCIsXHJcbiAgICAgICAgICA5OiBcIlxcXFx0XCJcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogQ29udmVydHMgYHZhbHVlYCBpbnRvIGEgemVyby1wYWRkZWQgc3RyaW5nIHN1Y2ggdGhhdCBpdHNcclxuICAgICAgICAvLyBsZW5ndGggaXMgYXQgbGVhc3QgZXF1YWwgdG8gYHdpZHRoYC4gVGhlIGB3aWR0aGAgbXVzdCBiZSA8PSA2LlxyXG4gICAgICAgIHZhciBsZWFkaW5nWmVyb2VzID0gXCIwMDAwMDBcIjtcclxuICAgICAgICB2YXIgdG9QYWRkZWRTdHJpbmcgPSBmdW5jdGlvbiAod2lkdGgsIHZhbHVlKSB7XHJcbiAgICAgICAgICAvLyBUaGUgYHx8IDBgIGV4cHJlc3Npb24gaXMgbmVjZXNzYXJ5IHRvIHdvcmsgYXJvdW5kIGEgYnVnIGluXHJcbiAgICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgd2hlcmUgYDAgPT0gLTBgLCBidXQgYFN0cmluZygtMCkgIT09IFwiMFwiYC5cclxuICAgICAgICAgIHJldHVybiAobGVhZGluZ1plcm9lcyArICh2YWx1ZSB8fCAwKSkuc2xpY2UoLXdpZHRoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogRG91YmxlLXF1b3RlcyBhIHN0cmluZyBgdmFsdWVgLCByZXBsYWNpbmcgYWxsIEFTQ0lJIGNvbnRyb2xcclxuICAgICAgICAvLyBjaGFyYWN0ZXJzIChjaGFyYWN0ZXJzIHdpdGggY29kZSB1bml0IHZhbHVlcyBiZXR3ZWVuIDAgYW5kIDMxKSB3aXRoXHJcbiAgICAgICAgLy8gdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcclxuICAgICAgICAvLyBgUXVvdGUodmFsdWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxyXG4gICAgICAgIHZhciB1bmljb2RlUHJlZml4ID0gXCJcXFxcdTAwXCI7XHJcbiAgICAgICAgdmFyIHF1b3RlID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gJ1wiJywgaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgsIHVzZUNoYXJJbmRleCA9ICFjaGFySW5kZXhCdWdneSB8fCBsZW5ndGggPiAxMDtcclxuICAgICAgICAgIHZhciBzeW1ib2xzID0gdXNlQ2hhckluZGV4ICYmIChjaGFySW5kZXhCdWdneSA/IHZhbHVlLnNwbGl0KFwiXCIpIDogdmFsdWUpO1xyXG4gICAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGFyQ29kZSA9IHZhbHVlLmNoYXJDb2RlQXQoaW5kZXgpO1xyXG4gICAgICAgICAgICAvLyBJZiB0aGUgY2hhcmFjdGVyIGlzIGEgY29udHJvbCBjaGFyYWN0ZXIsIGFwcGVuZCBpdHMgVW5pY29kZSBvclxyXG4gICAgICAgICAgICAvLyBzaG9ydGhhbmQgZXNjYXBlIHNlcXVlbmNlOyBvdGhlcndpc2UsIGFwcGVuZCB0aGUgY2hhcmFjdGVyIGFzLWlzLlxyXG4gICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XHJcbiAgICAgICAgICAgICAgY2FzZSA4OiBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTI6IGNhc2UgMTM6IGNhc2UgMzQ6IGNhc2UgOTI6XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gRXNjYXBlc1tjaGFyQ29kZV07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHVuaWNvZGVQcmVmaXggKyB0b1BhZGRlZFN0cmluZygyLCBjaGFyQ29kZS50b1N0cmluZygxNikpO1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1c2VDaGFySW5kZXggPyBzeW1ib2xzW2luZGV4XSA6IHZhbHVlLmNoYXJBdChpbmRleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiByZXN1bHQgKyAnXCInO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSBzZXJpYWxpemVzIGFuIG9iamVjdC4gSW1wbGVtZW50cyB0aGVcclxuICAgICAgICAvLyBgU3RyKGtleSwgaG9sZGVyKWAsIGBKTyh2YWx1ZSlgLCBhbmQgYEpBKHZhbHVlKWAgb3BlcmF0aW9ucy5cclxuICAgICAgICB2YXIgc2VyaWFsaXplID0gZnVuY3Rpb24gKHByb3BlcnR5LCBvYmplY3QsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2ssIG1heExpbmVMZW5ndGgpIHtcclxuICAgICAgICAgIHZhciB2YWx1ZSwgY2xhc3NOYW1lLCB5ZWFyLCBtb250aCwgZGF0ZSwgdGltZSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcywgcmVzdWx0cywgZWxlbWVudCwgaW5kZXgsIGxlbmd0aCwgcHJlZml4LCByZXN1bHQ7XHJcblxyXG4gICAgICAgICAgbWF4TGluZUxlbmd0aCA9IG1heExpbmVMZW5ndGggfHwgMDtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBOZWNlc3NhcnkgZm9yIGhvc3Qgb2JqZWN0IHN1cHBvcnQuXHJcbiAgICAgICAgICAgIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cclxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xyXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBkYXRlQ2xhc3MgJiYgIWlzUHJvcGVydHkuY2FsbCh2YWx1ZSwgXCJ0b0pTT05cIikpIHtcclxuICAgICAgICAgICAgICBpZiAodmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRGF0ZXMgYXJlIHNlcmlhbGl6ZWQgYWNjb3JkaW5nIHRvIHRoZSBgRGF0ZSN0b0pTT05gIG1ldGhvZFxyXG4gICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjkuNS40NC4gU2VlIHNlY3Rpb24gMTUuOS4xLjE1XHJcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIElTTyA4NjAxIGRhdGUgdGltZSBzdHJpbmcgZm9ybWF0LlxyXG4gICAgICAgICAgICAgICAgaWYgKGdldERheSkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBNYW51YWxseSBjb21wdXRlIHRoZSB5ZWFyLCBtb250aCwgZGF0ZSwgaG91cnMsIG1pbnV0ZXMsXHJcbiAgICAgICAgICAgICAgICAgIC8vIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgaWYgdGhlIGBnZXRVVEMqYCBtZXRob2RzIGFyZVxyXG4gICAgICAgICAgICAgICAgICAvLyBidWdneS4gQWRhcHRlZCBmcm9tIEBZYWZmbGUncyBgZGF0ZS1zaGltYCBwcm9qZWN0LlxyXG4gICAgICAgICAgICAgICAgICBkYXRlID0gZmxvb3IodmFsdWUgLyA4NjRlNSk7XHJcbiAgICAgICAgICAgICAgICAgIGZvciAoeWVhciA9IGZsb29yKGRhdGUgLyAzNjUuMjQyNSkgKyAxOTcwIC0gMTsgZ2V0RGF5KHllYXIgKyAxLCAwKSA8PSBkYXRlOyB5ZWFyKyspO1xyXG4gICAgICAgICAgICAgICAgICBmb3IgKG1vbnRoID0gZmxvb3IoKGRhdGUgLSBnZXREYXkoeWVhciwgMCkpIC8gMzAuNDIpOyBnZXREYXkoeWVhciwgbW9udGggKyAxKSA8PSBkYXRlOyBtb250aCsrKTtcclxuICAgICAgICAgICAgICAgICAgZGF0ZSA9IDEgKyBkYXRlIC0gZ2V0RGF5KHllYXIsIG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgLy8gVGhlIGB0aW1lYCB2YWx1ZSBzcGVjaWZpZXMgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkgKHNlZSBFU1xyXG4gICAgICAgICAgICAgICAgICAvLyA1LjEgc2VjdGlvbiAxNS45LjEuMikuIFRoZSBmb3JtdWxhIGAoQSAlIEIgKyBCKSAlIEJgIGlzIHVzZWRcclxuICAgICAgICAgICAgICAgICAgLy8gdG8gY29tcHV0ZSBgQSBtb2R1bG8gQmAsIGFzIHRoZSBgJWAgb3BlcmF0b3IgZG9lcyBub3RcclxuICAgICAgICAgICAgICAgICAgLy8gY29ycmVzcG9uZCB0byB0aGUgYG1vZHVsb2Agb3BlcmF0aW9uIGZvciBuZWdhdGl2ZSBudW1iZXJzLlxyXG4gICAgICAgICAgICAgICAgICB0aW1lID0gKHZhbHVlICUgODY0ZTUgKyA4NjRlNSkgJSA4NjRlNTtcclxuICAgICAgICAgICAgICAgICAgLy8gVGhlIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBhbmQgbWlsbGlzZWNvbmRzIGFyZSBvYnRhaW5lZCBieVxyXG4gICAgICAgICAgICAgICAgICAvLyBkZWNvbXBvc2luZyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheS4gU2VlIHNlY3Rpb24gMTUuOS4xLjEwLlxyXG4gICAgICAgICAgICAgICAgICBob3VycyA9IGZsb29yKHRpbWUgLyAzNmU1KSAlIDI0O1xyXG4gICAgICAgICAgICAgICAgICBtaW51dGVzID0gZmxvb3IodGltZSAvIDZlNCkgJSA2MDtcclxuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IGZsb29yKHRpbWUgLyAxZTMpICUgNjA7XHJcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHRpbWUgJSAxZTM7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB5ZWFyID0gdmFsdWUuZ2V0VVRDRnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWx1ZS5nZXRVVENNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgICBkYXRlID0gdmFsdWUuZ2V0VVRDRGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICBob3VycyA9IHZhbHVlLmdldFVUQ0hvdXJzKCk7XHJcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB2YWx1ZS5nZXRVVENNaW51dGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSB2YWx1ZS5nZXRVVENTZWNvbmRzKCk7XHJcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHZhbHVlLmdldFVUQ01pbGxpc2Vjb25kcygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gU2VyaWFsaXplIGV4dGVuZGVkIHllYXJzIGNvcnJlY3RseS5cclxuICAgICAgICAgICAgICAgIHZhbHVlID0gKHllYXIgPD0gMCB8fCB5ZWFyID49IDFlNCA/ICh5ZWFyIDwgMCA/IFwiLVwiIDogXCIrXCIpICsgdG9QYWRkZWRTdHJpbmcoNiwgeWVhciA8IDAgPyAteWVhciA6IHllYXIpIDogdG9QYWRkZWRTdHJpbmcoNCwgeWVhcikpICtcclxuICAgICAgICAgICAgICAgICAgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBtb250aCArIDEpICsgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBkYXRlKSArXHJcbiAgICAgICAgICAgICAgICAgIC8vIE1vbnRocywgZGF0ZXMsIGhvdXJzLCBtaW51dGVzLCBhbmQgc2Vjb25kcyBzaG91bGQgaGF2ZSB0d29cclxuICAgICAgICAgICAgICAgICAgLy8gZGlnaXRzOyBtaWxsaXNlY29uZHMgc2hvdWxkIGhhdmUgdGhyZWUuXHJcbiAgICAgICAgICAgICAgICAgIFwiVFwiICsgdG9QYWRkZWRTdHJpbmcoMiwgaG91cnMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBtaW51dGVzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgc2Vjb25kcykgK1xyXG4gICAgICAgICAgICAgICAgICAvLyBNaWxsaXNlY29uZHMgYXJlIG9wdGlvbmFsIGluIEVTIDUuMCwgYnV0IHJlcXVpcmVkIGluIDUuMS5cclxuICAgICAgICAgICAgICAgICAgXCIuXCIgKyB0b1BhZGRlZFN0cmluZygzLCBtaWxsaXNlY29uZHMpICsgXCJaXCI7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlLnRvSlNPTiA9PSBcImZ1bmN0aW9uXCIgJiYgKChjbGFzc05hbWUgIT0gbnVtYmVyQ2xhc3MgJiYgY2xhc3NOYW1lICE9IHN0cmluZ0NsYXNzICYmIGNsYXNzTmFtZSAhPSBhcnJheUNsYXNzKSB8fCBpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSkge1xyXG4gICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBhZGRzIG5vbi1zdGFuZGFyZCBgdG9KU09OYCBtZXRob2RzIHRvIHRoZVxyXG4gICAgICAgICAgICAgIC8vIGBOdW1iZXJgLCBgU3RyaW5nYCwgYERhdGVgLCBhbmQgYEFycmF5YCBwcm90b3R5cGVzLiBKU09OIDNcclxuICAgICAgICAgICAgICAvLyBpZ25vcmVzIGFsbCBgdG9KU09OYCBtZXRob2RzIG9uIHRoZXNlIG9iamVjdHMgdW5sZXNzIHRoZXkgYXJlXHJcbiAgICAgICAgICAgICAgLy8gZGVmaW5lZCBkaXJlY3RseSBvbiBhbiBpbnN0YW5jZS5cclxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihwcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLyBJZiBhIHJlcGxhY2VtZW50IGZ1bmN0aW9uIHdhcyBwcm92aWRlZCwgY2FsbCBpdCB0byBvYnRhaW4gdGhlIHZhbHVlXHJcbiAgICAgICAgICAgIC8vIGZvciBzZXJpYWxpemF0aW9uLlxyXG4gICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpO1xyXG4gICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBib29sZWFuQ2xhc3MpIHtcclxuICAgICAgICAgICAgLy8gQm9vbGVhbnMgYXJlIHJlcHJlc2VudGVkIGxpdGVyYWxseS5cclxuICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyB2YWx1ZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSB7XHJcbiAgICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gYEluZmluaXR5YCBhbmQgYE5hTmAgYXJlIHNlcmlhbGl6ZWQgYXNcclxuICAgICAgICAgICAgLy8gYFwibnVsbFwiYC5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDAgPyBcIlwiICsgdmFsdWUgOiBcIm51bGxcIjtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XHJcbiAgICAgICAgICAgIC8vIFN0cmluZ3MgYXJlIGRvdWJsZS1xdW90ZWQgYW5kIGVzY2FwZWQuXHJcbiAgICAgICAgICAgIHJldHVybiBxdW90ZShcIlwiICsgdmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdHMgYW5kIGFycmF5cy5cclxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoaXMgaXMgYSBsaW5lYXIgc2VhcmNoOyBwZXJmb3JtYW5jZVxyXG4gICAgICAgICAgICAvLyBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2YgdW5pcXVlIG5lc3RlZCBvYmplY3RzLlxyXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHN0YWNrLmxlbmd0aDsgbGVuZ3RoLS07KSB7XHJcbiAgICAgICAgICAgICAgaWYgKHN0YWNrW2xlbmd0aF0gPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDeWNsaWMgc3RydWN0dXJlcyBjYW5ub3QgYmUgc2VyaWFsaXplZCBieSBgSlNPTi5zdHJpbmdpZnlgLlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cclxuICAgICAgICAgICAgc3RhY2sucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbCBhbmQgaW5kZW50IG9uZSBhZGRpdGlvbmFsIGxldmVsLlxyXG4gICAgICAgICAgICBwcmVmaXggPSBpbmRlbnRhdGlvbjtcclxuICAgICAgICAgICAgaW5kZW50YXRpb24gKz0gd2hpdGVzcGFjZTtcclxuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgdmFyIHRvdGFsTGVuZ3RoID0gaW5kZW50YXRpb24ubGVuZ3RoLCByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIGFycmF5IGVsZW1lbnRzLlxyXG4gICAgICAgICAgICAgIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gc2VyaWFsaXplKGluZGV4LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICBzdGFjaywgbWF4TGluZUxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBlbGVtZW50ID09PSB1bmRlZiA/IFwibnVsbFwiIDogZWxlbWVudDtcclxuICAgICAgICAgICAgICAgIHRvdGFsTGVuZ3RoICs9IHJlc3VsdC5sZW5ndGggKyAoaW5kZXggPiAwID8gMSA6IDApO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID9cclxuICAgICAgICAgICAgICAgIChcclxuICAgICAgICAgICAgICAgICAgd2hpdGVzcGFjZSAmJiAodG90YWxMZW5ndGggPiBtYXhMaW5lTGVuZ3RoKSA/XHJcbiAgICAgICAgICAgICAgICAgIFwiW1xcblwiICsgaW5kZW50YXRpb24gKyByZXN1bHRzLmpvaW4oXCIsXFxuXCIgKyBpbmRlbnRhdGlvbikgKyBcIlxcblwiICsgcHJlZml4ICsgXCJdXCIgOlxyXG4gICAgICAgICAgICAgICAgICBcIltcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIl1cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgOiBcIltdXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdmFyIHRvdGFsTGVuZ3RoID0gaW5kZW50YXRpb24ubGVuZ3RoLCBpbmRleD0wO1xyXG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBvYmplY3QgbWVtYmVycy4gTWVtYmVycyBhcmUgc2VsZWN0ZWQgZnJvbVxyXG4gICAgICAgICAgICAgIC8vIGVpdGhlciBhIHVzZXItc3BlY2lmaWVkIGxpc3Qgb2YgcHJvcGVydHkgbmFtZXMsIG9yIHRoZSBvYmplY3RcclxuICAgICAgICAgICAgICAvLyBpdHNlbGYuXHJcbiAgICAgICAgICAgICAgZm9yRWFjaChwcm9wZXJ0aWVzIHx8IHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQsIGVsZW1lbnQgPSBzZXJpYWxpemUocHJvcGVydHksIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjaywgbWF4TGluZUxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT09IHVuZGVmKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIEFjY29yZGluZyB0byBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zOiBcIklmIGBnYXBgIHt3aGl0ZXNwYWNlfVxyXG4gICAgICAgICAgICAgICAgICAvLyBpcyBub3QgdGhlIGVtcHR5IHN0cmluZywgbGV0IGBtZW1iZXJgIHtxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIn1cclxuICAgICAgICAgICAgICAgICAgLy8gYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgYG1lbWJlcmAgYW5kIHRoZSBgc3BhY2VgIGNoYXJhY3Rlci5cIlxyXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgXCJgc3BhY2VgIGNoYXJhY3RlclwiIHJlZmVycyB0byB0aGUgbGl0ZXJhbCBzcGFjZVxyXG4gICAgICAgICAgICAgICAgICAvLyBjaGFyYWN0ZXIsIG5vdCB0aGUgYHNwYWNlYCB7d2lkdGh9IGFyZ3VtZW50IHByb3ZpZGVkIHRvXHJcbiAgICAgICAgICAgICAgICAgIC8vIGBKU09OLnN0cmluZ2lmeWAuXHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHF1b3RlKHByb3BlcnR5KSArIFwiOlwiICsgKHdoaXRlc3BhY2UgPyBcIiBcIiA6IFwiXCIpICsgZWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgdG90YWxMZW5ndGggKz0gcmVzdWx0Lmxlbmd0aCArIChpbmRleCsrID4gMCA/IDEgOiAwKTtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggP1xyXG4gICAgICAgICAgICAgICAgKFxyXG4gICAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlICYmICh0b3RhbExlbmd0aCA+IG1heExpbmVMZW5ndGgpID9cclxuICAgICAgICAgICAgICAgICAgXCJ7XFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIn1cIiA6XHJcbiAgICAgICAgICAgICAgICAgIFwie1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwifVwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICA6IFwie31cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIG9iamVjdCBmcm9tIHRoZSB0cmF2ZXJzZWQgb2JqZWN0IHN0YWNrLlxyXG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBQdWJsaWM6IGBKU09OLnN0cmluZ2lmeWAuIFNlZSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxyXG5cclxuICAgICAgICBleHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChzb3VyY2UsIGZpbHRlciwgd2lkdGgsIG1heExpbmVMZW5ndGgpIHtcclxuICAgICAgICAgIHZhciB3aGl0ZXNwYWNlLCBjYWxsYmFjaywgcHJvcGVydGllcywgY2xhc3NOYW1lO1xyXG4gICAgICAgICAgaWYgKG9iamVjdFR5cGVzW3R5cGVvZiBmaWx0ZXJdICYmIGZpbHRlcikge1xyXG4gICAgICAgICAgICBpZiAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwoZmlsdGVyKSkgPT0gZnVuY3Rpb25DbGFzcykge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrID0gZmlsdGVyO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgcHJvcGVydHkgbmFtZXMgYXJyYXkgaW50byBhIG1ha2VzaGlmdCBzZXQuXHJcbiAgICAgICAgICAgICAgcHJvcGVydGllcyA9IHt9O1xyXG4gICAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0gZmlsdGVyLmxlbmd0aCwgdmFsdWU7IGluZGV4IDwgbGVuZ3RoOyB2YWx1ZSA9IGZpbHRlcltpbmRleCsrXSwgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKSksIGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcyB8fCBjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpICYmIChwcm9wZXJ0aWVzW3ZhbHVlXSA9IDEpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHdpZHRoKSB7XHJcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh3aWR0aCkpID09IG51bWJlckNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgYHdpZHRoYCB0byBhbiBpbnRlZ2VyIGFuZCBjcmVhdGUgYSBzdHJpbmcgY29udGFpbmluZ1xyXG4gICAgICAgICAgICAgIC8vIGB3aWR0aGAgbnVtYmVyIG9mIHNwYWNlIGNoYXJhY3RlcnMuXHJcbiAgICAgICAgICAgICAgaWYgKCh3aWR0aCAtPSB3aWR0aCAlIDEpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh3aGl0ZXNwYWNlID0gXCJcIiwgd2lkdGggPiAxMCAmJiAod2lkdGggPSAxMCk7IHdoaXRlc3BhY2UubGVuZ3RoIDwgd2lkdGg7IHdoaXRlc3BhY2UgKz0gXCIgXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MpIHtcclxuICAgICAgICAgICAgICB3aGl0ZXNwYWNlID0gd2lkdGgubGVuZ3RoIDw9IDEwID8gd2lkdGggOiB3aWR0aC5zbGljZSgwLCAxMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiBkaXNjYXJkcyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBlbXB0eSBzdHJpbmcga2V5c1xyXG4gICAgICAgICAgLy8gKGBcIlwiYCkgb25seSBpZiB0aGV5IGFyZSB1c2VkIGRpcmVjdGx5IHdpdGhpbiBhbiBvYmplY3QgbWVtYmVyIGxpc3RcclxuICAgICAgICAgIC8vIChlLmcuLCBgIShcIlwiIGluIHsgXCJcIjogMX0pYCkuXHJcbiAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKFwiXCIsICh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHNvdXJjZSwgdmFsdWUpLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgXCJcIiwgW10sIG1heExpbmVMZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGV4cG9ydHMuY29tcGFjdFN0cmluZ2lmeSA9IGZ1bmN0aW9uIChzb3VyY2UsIGZpbHRlciwgd2lkdGgpe1xyXG4gICAgICAgICAgcmV0dXJuIGV4cG9ydHMuc3RyaW5naWZ5KHNvdXJjZSwgZmlsdGVyLCB3aWR0aCwgNjApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUHVibGljOiBQYXJzZXMgYSBKU09OIHNvdXJjZSBzdHJpbmcuXHJcbiAgICAgIGlmICghaGFzKFwianNvbi1wYXJzZVwiKSkge1xyXG4gICAgICAgIHZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIHVuZXNjYXBlZFxyXG4gICAgICAgIC8vIGVxdWl2YWxlbnRzLlxyXG4gICAgICAgIHZhciBVbmVzY2FwZXMgPSB7XHJcbiAgICAgICAgICA5MjogXCJcXFxcXCIsXHJcbiAgICAgICAgICAzNDogJ1wiJyxcclxuICAgICAgICAgIDQ3OiBcIi9cIixcclxuICAgICAgICAgIDk4OiBcIlxcYlwiLFxyXG4gICAgICAgICAgMTE2OiBcIlxcdFwiLFxyXG4gICAgICAgICAgMTEwOiBcIlxcblwiLFxyXG4gICAgICAgICAgMTAyOiBcIlxcZlwiLFxyXG4gICAgICAgICAgMTE0OiBcIlxcclwiXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IFN0b3JlcyB0aGUgcGFyc2VyIHN0YXRlLlxyXG4gICAgICAgIHZhciBJbmRleCwgU291cmNlO1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogUmVzZXRzIHRoZSBwYXJzZXIgc3RhdGUgYW5kIHRocm93cyBhIGBTeW50YXhFcnJvcmAuXHJcbiAgICAgICAgdmFyIGFib3J0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xyXG4gICAgICAgICAgdGhyb3cgU3ludGF4RXJyb3IoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogUmV0dXJucyB0aGUgbmV4dCB0b2tlbiwgb3IgYFwiJFwiYCBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkXHJcbiAgICAgICAgLy8gdGhlIGVuZCBvZiB0aGUgc291cmNlIHN0cmluZy4gQSB0b2tlbiBtYXkgYmUgYSBzdHJpbmcsIG51bWJlciwgYG51bGxgXHJcbiAgICAgICAgLy8gbGl0ZXJhbCwgb3IgQm9vbGVhbiBsaXRlcmFsLlxyXG4gICAgICAgIHZhciBsZXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgc291cmNlID0gU291cmNlLCBsZW5ndGggPSBzb3VyY2UubGVuZ3RoLCB2YWx1ZSwgYmVnaW4sIHBvc2l0aW9uLCBpc1NpZ25lZCwgY2hhckNvZGU7XHJcbiAgICAgICAgICB3aGlsZSAoSW5kZXggPCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcclxuICAgICAgICAgICAgICBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTM6IGNhc2UgMzI6XHJcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgdG9rZW5zLCBpbmNsdWRpbmcgdGFicywgY2FycmlhZ2UgcmV0dXJucywgbGluZVxyXG4gICAgICAgICAgICAgICAgLy8gZmVlZHMsIGFuZCBzcGFjZSBjaGFyYWN0ZXJzLlxyXG4gICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIGNhc2UgMTIzOiBjYXNlIDEyNTogY2FzZSA5MTogY2FzZSA5MzogY2FzZSA1ODogY2FzZSA0NDpcclxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGEgcHVuY3R1YXRvciB0b2tlbiAoYHtgLCBgfWAsIGBbYCwgYF1gLCBgOmAsIG9yIGAsYCkgYXRcclxuICAgICAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IHBvc2l0aW9uLlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjaGFySW5kZXhCdWdneSA/IHNvdXJjZS5jaGFyQXQoSW5kZXgpIDogc291cmNlW0luZGV4XTtcclxuICAgICAgICAgICAgICAgIEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgY2FzZSAzNDpcclxuICAgICAgICAgICAgICAgIC8vIGBcImAgZGVsaW1pdHMgYSBKU09OIHN0cmluZzsgYWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kXHJcbiAgICAgICAgICAgICAgICAvLyBiZWdpbiBwYXJzaW5nIHRoZSBzdHJpbmcuIFN0cmluZyB0b2tlbnMgYXJlIHByZWZpeGVkIHdpdGggdGhlXHJcbiAgICAgICAgICAgICAgICAvLyBzZW50aW5lbCBgQGAgY2hhcmFjdGVyIHRvIGRpc3Rpbmd1aXNoIHRoZW0gZnJvbSBwdW5jdHVhdG9ycyBhbmRcclxuICAgICAgICAgICAgICAgIC8vIGVuZC1vZi1zdHJpbmcgdG9rZW5zLlxyXG4gICAgICAgICAgICAgICAgZm9yICh2YWx1ZSA9IFwiQFwiLCBJbmRleCsrOyBJbmRleCA8IGxlbmd0aDspIHtcclxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5lc2NhcGVkIEFTQ0lJIGNvbnRyb2wgY2hhcmFjdGVycyAodGhvc2Ugd2l0aCBhIGNvZGUgdW5pdFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxlc3MgdGhhbiB0aGUgc3BhY2UgY2hhcmFjdGVyKSBhcmUgbm90IHBlcm1pdHRlZC5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXJDb2RlID09IDkyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSByZXZlcnNlIHNvbGlkdXMgKGBcXGApIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYW4gZXNjYXBlZFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRyb2wgY2hhcmFjdGVyIChpbmNsdWRpbmcgYFwiYCwgYFxcYCwgYW5kIGAvYCkgb3IgVW5pY29kZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzY2FwZSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgOTI6IGNhc2UgMzQ6IGNhc2UgNDc6IGNhc2UgOTg6IGNhc2UgMTE2OiBjYXNlIDExMDogY2FzZSAxMDI6IGNhc2UgMTE0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IFVuZXNjYXBlc1tjaGFyQ29kZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSAxMTc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBcXHVgIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYSBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIGFuZCB2YWxpZGF0ZSB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCBjb2RlIHBvaW50LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbiA9ICsrSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleCArIDQ7IEluZGV4IDwgcG9zaXRpb247IEluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHZhbGlkIHNlcXVlbmNlIGNvbXByaXNlcyBmb3VyIGhleGRpZ2l0cyAoY2FzZS1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnNlbnNpdGl2ZSkgdGhhdCBmb3JtIGEgc2luZ2xlIGhleGFkZWNpbWFsIHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3IHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEwMiB8fCBjaGFyQ29kZSA+PSA2NSAmJiBjaGFyQ29kZSA8PSA3MCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBmcm9tQ2hhckNvZGUoXCIweFwiICsgc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgZXNjYXBlIHNlcXVlbmNlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMzQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIEFuIHVuZXNjYXBlZCBkb3VibGUtcXVvdGUgY2hhcmFjdGVyIG1hcmtzIHRoZSBlbmQgb2YgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdHJpbmcuXHJcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAvLyBPcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiBjYXNlIHdoZXJlIGEgc3RyaW5nIGlzIHZhbGlkLlxyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjaGFyQ29kZSA+PSAzMiAmJiBjaGFyQ29kZSAhPSA5MiAmJiBjaGFyQ29kZSAhPSAzNCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBzdHJpbmcgYXMtaXMuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gMzQpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kIHJldHVybiB0aGUgcmV2aXZlZCBzdHJpbmcuXHJcbiAgICAgICAgICAgICAgICAgIEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFVudGVybWluYXRlZCBzdHJpbmcuXHJcbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBudW1iZXJzIGFuZCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHBhc3QgdGhlIG5lZ2F0aXZlIHNpZ24sIGlmIG9uZSBpcyBzcGVjaWZpZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDUpIHtcclxuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYW4gaW50ZWdlciBvciBmbG9hdGluZy1wb2ludCB2YWx1ZS5cclxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nykge1xyXG4gICAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIHplcm9lcyBhcmUgaW50ZXJwcmV0ZWQgYXMgb2N0YWwgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0OCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXggKyAxKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgb2N0YWwgbGl0ZXJhbC5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlzU2lnbmVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBpbnRlZ2VyIGNvbXBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgZm9yICg7IEluZGV4IDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IEluZGV4KyspO1xyXG4gICAgICAgICAgICAgICAgICAvLyBGbG9hdHMgY2Fubm90IGNvbnRhaW4gYSBsZWFkaW5nIGRlY2ltYWwgcG9pbnQ7IGhvd2V2ZXIsIHRoaXNcclxuICAgICAgICAgICAgICAgICAgLy8gY2FzZSBpcyBhbHJlYWR5IGFjY291bnRlZCBmb3IgYnkgdGhlIHBhcnNlci5cclxuICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSA0Nikge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gKytJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZGVjaW1hbCBjb21wb25lbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCB0cmFpbGluZyBkZWNpbWFsLlxyXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSBleHBvbmVudHMuIFRoZSBgZWAgZGVub3RpbmcgdGhlIGV4cG9uZW50IGlzXHJcbiAgICAgICAgICAgICAgICAgIC8vIGNhc2UtaW5zZW5zaXRpdmUuXHJcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMTAxIHx8IGNoYXJDb2RlID09IDY5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHBhc3QgdGhlIHNpZ24gZm9sbG93aW5nIHRoZSBleHBvbmVudCwgaWYgb25lIGlzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0MyB8fCBjaGFyQ29kZSA9PSA0NSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGV4cG9uZW50aWFsIGNvbXBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBlbXB0eSBleHBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgLy8gQ29lcmNlIHRoZSBwYXJzZWQgdmFsdWUgdG8gYSBKYXZhU2NyaXB0IG51bWJlci5cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuICtzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIEEgbmVnYXRpdmUgc2lnbiBtYXkgb25seSBwcmVjZWRlIG51bWJlcnMuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTaWduZWQpIHtcclxuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGB0cnVlYCwgYGZhbHNlYCwgYW5kIGBudWxsYCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJ0cnVlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA1KSA9PSBcImZhbHNlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJudWxsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBVbnJlY29nbml6ZWQgdG9rZW4uXHJcbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBSZXR1cm4gdGhlIHNlbnRpbmVsIGAkYCBjaGFyYWN0ZXIgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZCB0aGUgZW5kXHJcbiAgICAgICAgICAvLyBvZiB0aGUgc291cmNlIHN0cmluZy5cclxuICAgICAgICAgIHJldHVybiBcIiRcIjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogUGFyc2VzIGEgSlNPTiBgdmFsdWVgIHRva2VuLlxyXG4gICAgICAgIHZhciBnZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgIHZhciByZXN1bHRzLCBoYXNNZW1iZXJzO1xyXG4gICAgICAgICAgaWYgKHZhbHVlID09IFwiJFwiKSB7XHJcbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgZW5kIG9mIGlucHV0LlxyXG4gICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIGlmICgoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoMCkgOiB2YWx1ZVswXSkgPT0gXCJAXCIpIHtcclxuICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFBhcnNlIG9iamVjdCBhbmQgYXJyYXkgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIltcIikge1xyXG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gYXJyYXksIHJldHVybmluZyBhIG5ldyBKYXZhU2NyaXB0IGFycmF5LlxyXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBzcXVhcmUgYnJhY2tldCBtYXJrcyB0aGUgZW5kIG9mIHRoZSBhcnJheSBsaXRlcmFsLlxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGFycmF5IGxpdGVyYWwgY29udGFpbnMgZWxlbWVudHMsIHRoZSBjdXJyZW50IHRva2VuXHJcbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0aW5nIHRoZSBwcmV2aW91cyBlbGVtZW50IGZyb20gdGhlXHJcbiAgICAgICAgICAgICAgICAvLyBuZXh0LlxyXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIGFycmF5IGxpdGVyYWwuXHJcbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggYXJyYXkgZWxlbWVudC5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBFbGlzaW9ucyBhbmQgbGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChnZXQodmFsdWUpKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCJ7XCIpIHtcclxuICAgICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIG9iamVjdCwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgb2JqZWN0LlxyXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSB7fTtcclxuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBjdXJseSBicmFjZSBtYXJrcyB0aGUgZW5kIG9mIHRoZSBvYmplY3QgbGl0ZXJhbC5cclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBvYmplY3QgbGl0ZXJhbCBjb250YWlucyBtZW1iZXJzLCB0aGUgY3VycmVudCB0b2tlblxyXG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdG9yLlxyXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIG9iamVjdCBsaXRlcmFsLlxyXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIG9iamVjdCBtZW1iZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gTGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQsIG9iamVjdCBwcm9wZXJ0eSBuYW1lcyBtdXN0IGJlXHJcbiAgICAgICAgICAgICAgICAvLyBkb3VibGUtcXVvdGVkIHN0cmluZ3MsIGFuZCBhIGA6YCBtdXN0IHNlcGFyYXRlIGVhY2ggcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIC8vIG5hbWUgYW5kIHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiIHx8IHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIHx8IChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSAhPSBcIkBcIiB8fCBsZXgoKSAhPSBcIjpcIikge1xyXG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0c1t2YWx1ZS5zbGljZSgxKV0gPSBnZXQobGV4KCkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRva2VuIGVuY291bnRlcmVkLlxyXG4gICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBVcGRhdGVzIGEgdHJhdmVyc2VkIG9iamVjdCBtZW1iZXIuXHJcbiAgICAgICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSB3YWxrKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcclxuICAgICAgICAgIGlmIChlbGVtZW50ID09PSB1bmRlZikge1xyXG4gICAgICAgICAgICBkZWxldGUgc291cmNlW3Byb3BlcnR5XTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNvdXJjZVtwcm9wZXJ0eV0gPSBlbGVtZW50O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSB0cmF2ZXJzZXMgYSBwYXJzZWQgSlNPTiBvYmplY3QsIGludm9raW5nIHRoZVxyXG4gICAgICAgIC8vIGBjYWxsYmFja2AgZnVuY3Rpb24gZm9yIGVhY2ggdmFsdWUuIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlXHJcbiAgICAgICAgLy8gYFdhbGsoaG9sZGVyLCBuYW1lKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cclxuICAgICAgICB2YXIgd2FsayA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW3Byb3BlcnR5XSwgbGVuZ3RoO1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIGBmb3JFYWNoYCBjYW4ndCBiZSB1c2VkIHRvIHRyYXZlcnNlIGFuIGFycmF5IGluIE9wZXJhIDw9IDguNTRcclxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpdHMgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW1wbGVtZW50YXRpb24gcmV0dXJucyBgZmFsc2VgXHJcbiAgICAgICAgICAgIC8vIGZvciBhcnJheSBpbmRpY2VzIChlLmcuLCBgIVsxLCAyLCAzXS5oYXNPd25Qcm9wZXJ0eShcIjBcIilgKS5cclxuICAgICAgICAgICAgaWYgKGdldENsYXNzLmNhbGwodmFsdWUpID09IGFycmF5Q2xhc3MpIHtcclxuICAgICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgbGVuZ3RoLS07KSB7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGUodmFsdWUsIGxlbmd0aCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBmb3JFYWNoKHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwoc291cmNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04ucGFyc2VgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cclxuICAgICAgICBleHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHNvdXJjZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgIHZhciByZXN1bHQsIHZhbHVlO1xyXG4gICAgICAgICAgSW5kZXggPSAwO1xyXG4gICAgICAgICAgU291cmNlID0gXCJcIiArIHNvdXJjZTtcclxuICAgICAgICAgIHJlc3VsdCA9IGdldChsZXgoKSk7XHJcbiAgICAgICAgICAvLyBJZiBhIEpTT04gc3RyaW5nIGNvbnRhaW5zIG11bHRpcGxlIHRva2VucywgaXQgaXMgaW52YWxpZC5cclxuICAgICAgICAgIGlmIChsZXgoKSAhPSBcIiRcIikge1xyXG4gICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gUmVzZXQgdGhlIHBhcnNlciBzdGF0ZS5cclxuICAgICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcclxuICAgICAgICAgIHJldHVybiBjYWxsYmFjayAmJiBnZXRDbGFzcy5jYWxsKGNhbGxiYWNrKSA9PSBmdW5jdGlvbkNsYXNzID8gd2FsaygodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSByZXN1bHQsIHZhbHVlKSwgXCJcIiwgY2FsbGJhY2spIDogcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnRzW1wicnVuSW5Db250ZXh0XCJdID0gcnVuSW5Db250ZXh0O1xyXG4gICAgcmV0dXJuIGV4cG9ydHM7XHJcbiAgfVxyXG5cclxuICBpZiAoZnJlZUV4cG9ydHMgJiYgIWlzTG9hZGVyKSB7XHJcbiAgICAvLyBFeHBvcnQgZm9yIENvbW1vbkpTIGVudmlyb25tZW50cy5cclxuICAgIHJ1bkluQ29udGV4dChyb290LCBmcmVlRXhwb3J0cyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIEV4cG9ydCBmb3Igd2ViIGJyb3dzZXJzIGFuZCBKYXZhU2NyaXB0IGVuZ2luZXMuXHJcbiAgICB2YXIgbmF0aXZlSlNPTiA9IHJvb3QuSlNPTixcclxuICAgICAgICBwcmV2aW91c0pTT04gPSByb290W1wiSlNPTjNcIl0sXHJcbiAgICAgICAgaXNSZXN0b3JlZCA9IGZhbHNlO1xyXG5cclxuICAgIHZhciBKU09OMyA9IHJ1bkluQ29udGV4dChyb290LCAocm9vdFtcIkpTT04zXCJdID0ge1xyXG4gICAgICAvLyBQdWJsaWM6IFJlc3RvcmVzIHRoZSBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgZ2xvYmFsIGBKU09OYCBvYmplY3QgYW5kXHJcbiAgICAgIC8vIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIGBKU09OM2Agb2JqZWN0LlxyXG4gICAgICBcIm5vQ29uZmxpY3RcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghaXNSZXN0b3JlZCkge1xyXG4gICAgICAgICAgaXNSZXN0b3JlZCA9IHRydWU7XHJcbiAgICAgICAgICByb290LkpTT04gPSBuYXRpdmVKU09OO1xyXG4gICAgICAgICAgcm9vdFtcIkpTT04zXCJdID0gcHJldmlvdXNKU09OO1xyXG4gICAgICAgICAgbmF0aXZlSlNPTiA9IHByZXZpb3VzSlNPTiA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBKU09OMztcclxuICAgICAgfVxyXG4gICAgfSkpO1xyXG5cclxuICAgIHJvb3QuSlNPTiA9IHtcclxuICAgICAgXCJwYXJzZVwiOiBKU09OMy5wYXJzZSxcclxuICAgICAgXCJzdHJpbmdpZnlcIjogSlNPTjMuc3RyaW5naWZ5XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gRXhwb3J0IGZvciBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuXHJcbiAgaWYgKGlzTG9hZGVyKSB7XHJcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gSlNPTjM7XHJcbiAgICB9KTtcclxuICB9XHJcbn0pLmNhbGwodGhpcyk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdkYXNoYm9hcmQnKVxyXG4gICAgLmRpcmVjdGl2ZSgnY2hhcnRMaXN0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL2NoYXJ0bGlzdC9jaGFydGxpc3QuaHRtbCcsXHJcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgICAgICBraW5kczogJz0nLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6ICc9J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCAvKiwgYXR0cnMqLyApIHt9LFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRodHRwKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuYWRkQ2hhcnQgPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3RzID0gYW5ndWxhci5jb3B5KCRzY29wZS5pdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzb3J0ID0gbGlzdHMuc29ydChmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiLnJvdyAtIGEucm93O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pdGVtcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZVg6IDEyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplWTogNSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm93OiBzb3J0Lmxlbmd0aCA+IDAgPyBzb3J0WzBdLnJvdyArIHNvcnRbMF0uc2l6ZVkgOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2w6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2Rhc2hib2FyZCcpXHJcbiAgICAuZGlyZWN0aXZlKCdub3JtYWx0ZXh0JywgWydEcm9wJywgZnVuY3Rpb24oRHJvcCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy9ncmlkaXRlbS9ncmlkaXRlbS5odG1sJyxcclxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZzogJz0nLFxyXG4gICAgICAgICAgICAgICAgdGFibGVEYXRhOiAnPScsXHJcbiAgICAgICAgICAgICAgICByZW1vdmVBY3Rpb246ICcmJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCAvKiwgYXR0cnMqLyApIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLnR5cGVQb3B1cCA9IG5ldyBEcm9wKHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlbGVtZW50LnBhcmVudCgpLmZpbmQoJy5kcm9wLW9wdGlvbicpWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogZWxlbWVudC5wYXJlbnQoKS5maW5kKCcuZmEtYmFycycpWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYm90dG9tIHJpZ2h0JyxcclxuICAgICAgICAgICAgICAgICAgICBvcGVuT246ICdjbGljaydcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgc2NvcGUud2lkdGggPSBlbGVtZW50LnBhcmVudCgpLndpZHRoKCkgLSA1O1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuaGVpZ2h0ID0gZWxlbWVudC5wYXJlbnQoKS5oZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUudHlwZVBvcHVwICYmIHNjb3BlLnR5cGVQb3B1cC5kZXN0cm95KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnR5cGVQb3B1cC5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsICRodHRwLCAkdGltZW91dCwgTW9kYWxzKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudGFibGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICB0YWJsZURhdGE6IFtdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnNob3dEYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgTW9kYWxzLm9wZW4oJ2RhdGEtbW9kYWwnKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmRhdGEubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudGFibGVEYXRhID0gYW5ndWxhci5jb3B5KCRzY29wZS50YWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS50eXBlUG9wdXAuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5jb25maWcuZGF0YS5lY2hhcnRjb25maWcpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZyA9IEpTT04ucGFyc2UoJHNjb3BlLmNvbmZpZy5kYXRhLmVjaGFydGNvbmZpZyk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdlY2NvbmZpZy5kYXRhLnVybCcsIGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLmdldCgkc2NvcGUuZWNjb25maWcuZGF0YS51cmwpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZGVidWdnZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEubGlzdHMgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLndpZHRoID0gJCgkZWxlbWVudCkuZmluZCgnLmNoYXJ0LWNvbnRlbnQnKS53aWR0aCgpOyAvLyRzY29wZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5oZWlnaHQgPSAkc2NvcGUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVpbGRFY2hhcnQoJHNjb3BlLmVjY29uZmlnLCAkKCRlbGVtZW50KS5maW5kKCcuY2hhcnQtY29udGVudCcpLCAkc2NvcGUuY29uZmlnLmRhdGEubGlzdHMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XSk7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5hbmd1bGFyLm1vZHVsZShcImRhc2hib2FyZFwiKS5kaXJlY3RpdmUoXCJncmlkSXRlbVwiLCBbXHJcbiAgXCJEcm9wXCIsIFwiZmlsdGVyVmFsdWVDaGFuZ2VcIixcclxuICBmdW5jdGlvbiAoRHJvcCwgZmlsdGVyVmFsdWVDaGFuZ2UpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiBcImNvbXBvbmVudHMvZ3JpZGl0ZW0vZ3JpZGl0ZW0uaHRtbFwiLFxyXG4gICAgICByZXN0cmljdDogXCJFXCIsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgb3BlbkZpbHRlclBhbmVsOiBcIiZcIixcclxuICAgICAgICBvbGFwaWRzOiBcIj1cIixcclxuICAgICAgICBjb25maWc6IFwiPVwiLFxyXG4gICAgICAgIGNvbmZpZ2l0ZW1zOiBcIj1cIixcclxuICAgICAgICB0YWJsZURhdGE6IFwiPVwiLFxyXG4gICAgICAgIGRyb3BUeXBlOiBcIj1cIixcclxuICAgICAgICBnbG9iYWxDb25maWc6IFwiPVwiLFxyXG4gICAgICAgIHN5bmNGb250Q29sb3I6IFwiPVwiLFxyXG4gICAgICAgIHNjZW5lT3B0aW9uczogXCI9XCIsXHJcbiAgICAgICAgcmVtb3ZlQWN0aW9uOiBcIiZcIixcclxuICAgICAgICBzaG93VGV4dEVkaXRvcjogXCImXCIsXHJcbiAgICAgICAgaXRlbVN0eWxlQ29uZmlnOiBcIiZcIixcclxuICAgICAgICBvcGVuTGlua2FnZVBhbmVsOiBcIiZcIixcclxuICAgICAgICB1cGRhdGVDb21wb25lbnQ6IFwiJlwiLFxyXG4gICAgICAgIG9wZW5Db21tZW50c1NlY3Rpb246IFwiJlwiLFxyXG4gICAgICAgIHJlbG9hZGluZ0Rhc2hib2FyZFN0YXR1czogXCI9XCIsXHJcbiAgICAgICAgc2NlbmVzQ29udGVudFdpZHRoOiBcIj1cIixcclxuICAgICAgICByb3dIZWlnaHQ6IFwiPT9yb3dIZWlnaHRcIixcclxuICAgICAgICBhZnRlckRhdGFMb2FkOiBcIiZcIixcclxuICAgICAgfSxcclxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7fSxcclxuICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKFxyXG4gICAgICAgICRzY29wZSxcclxuICAgICAgICAkZWxlbWVudCxcclxuICAgICAgICAkaHR0cCxcclxuICAgICAgICAkd2luZG93LFxyXG4gICAgICAgICR0aW1lb3V0LFxyXG4gICAgICAgICRjb21waWxlLFxyXG4gICAgICAgIE1vZGFsc1xyXG4gICAgICApIHtcclxuICAgICAgICB2YXIgdm0gPSAkc2NvcGVcclxuICAgICAgICBpZiAoISRzY29wZS5yb3dIZWlnaHQpIHtcclxuICAgICAgICAgICRzY29wZS5yb3dIZWlnaHQgPSA1MDtcclxuICAgICAgICB9XHJcbiAgICAgICAgJHNjb3BlLmNvbXBvbmVudFV1aWQgPSBnZW5lcmF0ZVV1aWQoOCwgMTYpO1xyXG4gICAgICAgICRzY29wZS5kZXZpY2VUeXBlID0gdGVybWluYWxUeXBlO1xyXG4gICAgICAgICRzY29wZS52aWV3VHlwZSA9IHZpZXdUeXBlO1xyXG4gICAgICAgICRzY29wZS5uZXdTY2VuZSA9IHRydWU7XHJcblxyXG4gICAgICAgIC8qICNyZWdpb24g6I+c5Y2V5Yqf6IO9ICovXHJcbiAgICAgICAgJHNjb3BlLm9wZW5Ecm9wT3B0aW9uID0gZnVuY3Rpb24gKCRldmVudCkge1xyXG4gICAgICAgICAgaWYgKGRyb3BPcHRpb25FbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGRyb3BPcHRpb25FbGVtZW50LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBkcm9wT3B0aW9uRWxlbWVudCA9IG51bGw7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgb2ZmID0gJCgkZXZlbnQudGFyZ2V0KS5vZmZzZXQoKTtcclxuICAgICAgICAgICAgdmFyIGRyb3BPcHRpb25TdHlsZSA9XHJcbiAgICAgICAgICAgICAgXCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6XCIgK1xyXG4gICAgICAgICAgICAgIChvZmYudG9wICsgMjApICtcclxuICAgICAgICAgICAgICBcInB4O2xlZnQ6XCIgK1xyXG4gICAgICAgICAgICAgIG9mZi5sZWZ0ICtcclxuICAgICAgICAgICAgICBcInB4O2Rpc3BsYXk6YmxvY2s7XCI7XHJcbiAgICAgICAgICAgIHZhciBodG1sID0gZHJvcE9wdGlvbkh0bWxTdHIucmVwbGFjZShcIl9zdHlsZV9cIiwgZHJvcE9wdGlvblN0eWxlKTtcclxuICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gYW5ndWxhci5lbGVtZW50KGh0bWwpO1xyXG4gICAgICAgICAgICBkcm9wT3B0aW9uRWxlbWVudCA9ICRjb21waWxlKHRlbXBsYXRlKSgkc2NvcGUpO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKGRyb3BPcHRpb25FbGVtZW50KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5jbG9zZURyb3BPcHRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAoZHJvcE9wdGlvbkVsZW1lbnQpIHtcclxuICAgICAgICAgICAgZHJvcE9wdGlvbkVsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIGRyb3BPcHRpb25FbGVtZW50ID0gbnVsbDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5yZXNpemVDb2wgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XHJcbiAgICAgICAgICBpZiAodGFibGVDb2xSZXNpemVFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRhYmxlQ29sUmVzaXplRWxlbWVudC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdGFibGVDb2xSZXNpemVFbGVtZW50ID0gbnVsbDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICgkKCRldmVudC50YXJnZXQpLm9mZnNldCgpLnRvcCArIHRhYmxlQ29uZmlnW1wiY29sdW1uc1wiXS5sZW5ndGggKiAzMiArIDIwID4gJHdpbmRvdy5pbm5lckhlaWdodCkge1xyXG4gICAgICAgICAgICAgIHZhciB0YWJsZUNvbFJlc2l6ZVN0eWxlID1cclxuICAgICAgICAgICAgICAgIFwicG9zaXRpb246YWJzb2x1dGU7Ym90dG9tOlwiICtcclxuICAgICAgICAgICAgICAgIDIwICtcclxuICAgICAgICAgICAgICAgIFwicHg7bGVmdDpcIiArXHJcbiAgICAgICAgICAgICAgICAoJCgkZXZlbnQudGFyZ2V0KS5vZmZzZXQoKS5sZWZ0IC0gMjIwKSArXHJcbiAgICAgICAgICAgICAgICBcInB4O2Rpc3BsYXk6YmxvY2s7XCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdmFyIHRhYmxlQ29sUmVzaXplU3R5bGUgPVxyXG4gICAgICAgICAgICAgICAgXCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6XCIgK1xyXG4gICAgICAgICAgICAgICAgJCgkZXZlbnQudGFyZ2V0KS5vZmZzZXQoKS50b3AgK1xyXG4gICAgICAgICAgICAgICAgXCJweDtsZWZ0OlwiICtcclxuICAgICAgICAgICAgICAgICgkKCRldmVudC50YXJnZXQpLm9mZnNldCgpLmxlZnQgLSAyMjApICtcclxuICAgICAgICAgICAgICAgIFwicHg7ZGlzcGxheTpibG9jaztcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGh0bWwgPSB0YWJsZUNvbFJlc2l6ZUVsZW1lbnRTdHIucmVwbGFjZShcIl9zdHlsZV9cIiwgdGFibGVDb2xSZXNpemVTdHlsZSk7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IGFuZ3VsYXIuZWxlbWVudChodG1sKTtcclxuICAgICAgICAgICAgdGFibGVDb2xSZXNpemVFbGVtZW50ID0gJGNvbXBpbGUodGVtcGxhdGUpKCRzY29wZSk7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KS5hcHBlbmQodGFibGVDb2xSZXNpemVFbGVtZW50KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICRzY29wZS5jbG9zZURyb3BPcHRpb24oKVxyXG4gICAgICAgIH1cclxuICAgICAgICAvKiAjZW5kcmVnaW9uICovXHJcbiAgICAgICAgaWYgKCRzY29wZS5jb25maWcgJiYgJHNjb3BlLmNvbmZpZy5kYXRhKSB7fSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc05vdE51bGwoJHNjb3BlLmNvbmZpZy5kYXRhLmlkKSkge1xyXG4gICAgICAgICAgJCgkZWxlbWVudClcclxuICAgICAgICAgICAgLmZpbmQoXCIucGFyZW50LWNvbnRlbnRcIilcclxuICAgICAgICAgICAgLmFkZENsYXNzKFwiY2hhcnRzLVwiICsgJHNjb3BlLmNvbmZpZy5kYXRhLmlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJHNjb3BlLmNvbmZpZ1R5cGUgPSAkc2NvcGUuY29uZmlnLmRhdGEuZGF0YXR5cGUgP1xyXG4gICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmRhdGF0eXBlIDpcclxuICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kcm9wVHlwZTtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBjdXJyZW50U2NlbmVJZC5sZW5ndGggPiAxIHx8XHJcbiAgICAgICAgICAoZ2V0UXVlcnlTdHJpbmcoXCJzY2VuZXNJZFwiKSAmJiBnZXRRdWVyeVN0cmluZyhcInNjZW5lc0lkXCIpLmxlbmd0aCA+IDEpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAkc2NvcGUubmV3U2NlbmUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCRzY29wZS52aWV3VHlwZSA9PSBcInNob3dcIikge1xyXG4gICAgICAgICAgJChcIi5vcHRpb24tYnRuXCIpLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgY3VycmVudFdpZHRoID0gJHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgICRzY29wZS5zaG93UGFuZWwgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmRhdGVGaWx0ZXIgPSB7XHJcbiAgICAgICAgICBzdGFydERhdGU6IFwiXCIsXHJcbiAgICAgICAgICBlbmREYXRlOiBcIlwiXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnRleHRGaWx0ZXIgPSB7XHJcbiAgICAgICAgICBkYXRhOiBcIlwiLFxyXG4gICAgICAgICAgZmlsdGVyV2F5OiBcIlwiXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmZpbHRlckRhdGEgPSBcIlwiO1xyXG5cclxuICAgICAgICAkc2NvcGUucmVwbGF5VGV4dCA9IFwiXCI7XHJcblxyXG4gICAgICAgIC8qICNyZWdpb24g57uE5Lu26YWN572u5ZCE5Liq6I+c5Y2V5Yqf6IO9ICAqL1xyXG5cclxuICAgICAgICAkc2NvcGUuZmlsdGVyUGFuZWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAkc2NvcGUuY2xvc2VEcm9wT3B0aW9uKCk7XHJcbiAgICAgICAgICAkc2NvcGUub3BlbkZpbHRlclBhbmVsKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmxpbmthZ2VQYW5lbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICRzY29wZS5jbG9zZURyb3BPcHRpb24oKTtcclxuICAgICAgICAgICRzY29wZS5vcGVuTGlua2FnZVBhbmVsKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLm9wZW5UZXh0RWRpdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJCRzY29wZS5jbG9zZURyb3BPcHRpb24oKTtcclxuICAgICAgICAgICRzY29wZS5zaG93VGV4dEVkaXRvcigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5zaG93RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIE1vZGFscy5vcGVuKFwiZGF0YS1tb2RhbFwiKTtcclxuICAgICAgICAgIGlmICgkc2NvcGUuZGF0YS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICRzY29wZS50YWJsZURhdGEgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnRhYmxlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICRzY29wZS5jbG9zZURyb3BPcHRpb24oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuc2hvd1N0eWxlQ29uZmlnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJHNjb3BlLmNsb3NlRHJvcE9wdGlvbigpO1xyXG4gICAgICAgICAgJHNjb3BlLml0ZW1TdHlsZUNvbmZpZygpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIOe7hOS7tuWIoOmZpFxyXG4gICAgICAgICRzY29wZS5yZW1vdmVDb21wb25lbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAkKFwiLmRyb3Atb3B0aW9uXCIpLmhpZGUoKTtcclxuICAgICAgICAgIC8vIOmHjee9rui/h+a7pOadoeS7tlxyXG4gICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuZHJvcFR5cGUgPT0gXCJzZWxlY3RcIiB8fFxyXG4gICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuZHJvcFR5cGUgPT0gXCJkYXRlXCIgfHxcclxuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmRyb3BUeXBlID09IFwidGV4dFwiXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgJHNjb3BlLnRleHRGaWx0ZXIuZGF0YSA9IFwiXCI7XHJcbiAgICAgICAgICAgICRzY29wZS5maWx0ZXJEYXRhID0gXCJcIjtcclxuICAgICAgICAgICAgJHNjb3BlLnRleHRGaWx0ZXIgPSB7XHJcbiAgICAgICAgICAgICAgZGF0YTogXCJcIixcclxuICAgICAgICAgICAgICBmaWx0ZXJXYXk6IFwiXCJcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy9zdGFydEZpbHRlcigpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgJHNjb3BlLnJlbW92ZUFjdGlvbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qICNlbmRyZWdpb24gKi9cclxuXHJcbiAgICAgICAgLyogI3JlZ2lvbiBzZWxlY3TjgIHmlofmnKzjgIHml6XmnJ/ov4fmu6TlmaggKi9cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuZHJvcFR5cGUgPT0gXCJzZWxlY3RcIiB8fFxyXG4gICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmRyb3BUeXBlID09IFwiZGF0ZVwiIHx8XHJcbiAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuZHJvcFR5cGUgPT0gXCJ0ZXh0XCJcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGlmIChpc051bGwoJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnNlcGFyYXRpb25DbGFzcykpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnNlcGFyYXRpb25DbGFzcyA9IFwic2VwYXJhdGlvbi00NlwiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgJHNjb3BlLmRlbGV0ZVNlbGVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmZpbHRlckRhdGFzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICBpdGVtLmNoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICRzY29wZS5tdWx0aXBsZVNlbGVjdENoYW5nZSgpO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLmRyb3BUeXBlID09IFwidGV4dFwiKSB7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuZGVmYXVsdFZhbCAmJlxyXG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsLmxlbmd0aCA+IDBcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLnRleHRGaWx0ZXIuZGF0YSA9ICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsO1xyXG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS52YWwgPSAkc2NvcGUudGV4dEZpbHRlci5kYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsVGV4dCAmJlxyXG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsVGV4dC5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICRzY29wZS50ZXh0RmlsdGVyLmRhdGEgPSAkc2NvcGUuY29uZmlnLmRhdGEuZGVmYXVsdFZhbFRleHQ7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLnZhbCA9ICRzY29wZS50ZXh0RmlsdGVyLmRhdGFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdGV4dENvbXBvbmVudFRlbXBsYXRlID0gYW5ndWxhci5lbGVtZW50KHRleHRDb21wb25lbnRIdG1sKTtcclxuICAgICAgICAgICAgdmFyIHRleHRDb21wb25lbnRFbGVtZW50ID0gJGNvbXBpbGUodGV4dENvbXBvbmVudFRlbXBsYXRlKSgkc2NvcGUpO1xyXG4gICAgICAgICAgICB2YXIgdGV4dEZpbHRlcldyYXBwZXJFbGUgPSBhbmd1bGFyLmVsZW1lbnQoJGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLnRleHQtZmlsdGVyLXdyYXBwZXInKSlcclxuICAgICAgICAgICAgdGV4dEZpbHRlcldyYXBwZXJFbGUuYXBwZW5kKHRleHRDb21wb25lbnRFbGVtZW50KTtcclxuICAgICAgICAgICAgdGV4dEZpbHRlcldyYXBwZXJFbGUuYWRkQ2xhc3MoJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnNlcGFyYXRpb25DbGFzcylcclxuICAgICAgICAgICAgdGV4dEZpbHRlcldyYXBwZXJFbGUuYWRkQ2xhc3MoJ2F1dG8tc2hvdycpXHJcbiAgICAgICAgICAgICRzY29wZS50ZXh0RmlsdGVyQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIHZhciBmaWx0ZXJUZXh0ID0gJHNjb3BlLnRleHRGaWx0ZXIuZGF0YTtcclxuICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnRleHRGaWx0ZXIuZGF0YSA9PSBmaWx0ZXJUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5zdGFydFRleHRGaWx0ZXIoKVxyXG4gICAgICAgICAgICAgICAgICBmaWx0ZXJWYWx1ZUNoYW5nZS5hZnRlckNoYW5nZSgkc2NvcGUuY29uZmlnaXRlbXMsICRzY29wZS5jb25maWcpXHJcbiAgICAgICAgICAgICAgICAgIC8vIGlmICh2bS5jb25maWcuZGF0YS5jdXN0b21Db2RlICYmIHZtLmNvbmZpZy5kYXRhLmN1c3RvbUNvZGUuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAvLyAgIGV2YWwodm0uY29uZmlnLmRhdGEuY3VzdG9tQ29kZS5hZnRlclZhbHVlQ2hhbmdlQ29kZSlcclxuICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sIDE1MDApO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdjb25maWcuZGF0YS5jdXN0b21WYWx1ZScsIGZ1bmN0aW9uIChuZXd2YWwpIHtcclxuICAgICAgICAgICAgICBpZiAobmV3dmFsICYmIChuZXd2YWwgKyAnJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRleHRGaWx0ZXIuZGF0YSA9IChuZXd2YWwgKyAnJylcclxuICAgICAgICAgICAgICAgICRzY29wZS5zdGFydFRleHRGaWx0ZXIoKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgJHNjb3BlLnN0YXJ0VGV4dEZpbHRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLnRleHRGaWx0ZXJXYXkpIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS50ZXh0RmlsdGVyLmZpbHRlcldheSA9ICRzY29wZS5jb25maWcuZGF0YS50ZXh0RmlsdGVyV2F5XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS52YWwgPSAkc2NvcGUudGV4dEZpbHRlci5kYXRhXHJcbiAgICAgICAgICAgICAgc3RhcnRGaWx0ZXIoXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLFxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZ2l0ZW1zLFxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRleHRGaWx0ZXJcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIOebkeWQrOWkmumAieahhueahOWAvCDop6blj5Hlm77ooajliLfmlrBcclxuICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnLmRhdGEuZHJvcFR5cGUgPT0gXCJzZWxlY3RcIikge1xyXG4gICAgICAgICAgICB2YXIgc2VsZWN0Q29tcG9uZW50VGVtcGxhdGUgPSBhbmd1bGFyLmVsZW1lbnQoc2VsZWN0Q29tcG9uZW50SHRtbCk7XHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RDb21wb25lbnRFbGVtZW50ID0gJGNvbXBpbGUoc2VsZWN0Q29tcG9uZW50VGVtcGxhdGUpKCRzY29wZSk7XHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RGaWx0ZXJXcmFwcGVyRWxlID0gYW5ndWxhci5lbGVtZW50KCRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5zZWxlY3QtZmlsdGVyLXdyYXBwZXInKSlcclxuICAgICAgICAgICAgc2VsZWN0RmlsdGVyV3JhcHBlckVsZS5hcHBlbmQoc2VsZWN0Q29tcG9uZW50RWxlbWVudCk7XHJcbiAgICAgICAgICAgIHNlbGVjdEZpbHRlcldyYXBwZXJFbGUuYWRkQ2xhc3MoJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnNlcGFyYXRpb25DbGFzcylcclxuICAgICAgICAgICAgc2VsZWN0RmlsdGVyV3JhcHBlckVsZS5hZGRDbGFzcygnYXV0by1zaG93JylcclxuICAgICAgICAgICAgJHNjb3BlLnNlYXJjaFRlcm0gPSBcIlwiO1xyXG4gICAgICAgICAgICAkc2NvcGUuY2xlYXJTZWFyY2hUZXJtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICRzY29wZS5zZWFyY2hUZXJtID0gXCJcIjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJHNjb3BlLm11bHRpU2VsZWN0VmFsID0gW11cclxuICAgICAgICAgICAgJHNjb3BlLnNpbmdsZVNlbGVjdFZhbCA9ICcnXHJcbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2NvbmZpZy5kYXRhLmN1c3RvbVZhbHVlJywgZnVuY3Rpb24gKG5ld3ZhbCkge1xyXG4gICAgICAgICAgICAgIGlmIChuZXd2YWwgJiYgKG5ld3ZhbCArICcnKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLm11bHRpcGxlU2VsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5tdWx0aVNlbGVjdFZhbCA9IFtuZXd2YWxdO1xyXG4gICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEudmFsID0gJHNjb3BlLm11bHRpU2VsZWN0VmFsXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAkc2NvcGUuc2luZ2xlU2VsZWN0VmFsID0gbmV3dmFsXHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS52YWwgPSAkc2NvcGUuc2luZ2xlU2VsZWN0VmFsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdGFydEZpbHRlcihcclxuICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyxcclxuICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZ2l0ZW1zLFxyXG4gICAgICAgICAgICAgICAgICAobmV3dmFsKycnKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2NvbmZpZy5kYXRhLmZpbHRlckRhdGFzJywgZnVuY3Rpb24gKG5ld3ZhbCkge1xyXG4gICAgICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnLmRhdGEuZmlsdGVyRGF0YXMgJiYgJHNjb3BlLmNvbmZpZy5kYXRhLmZpbHRlckRhdGFzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RBcnIgPSBbXVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzTm90TnVsbChuZXd2YWwpICYmIG5ld3ZhbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5maWx0ZXJEYXRhcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RBcnIucHVzaCh2YWx1ZS5pZClcclxuICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8qKuiHquWKqOeUn+aIkOeahOm7mOiupOWAvCAqL1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLndhaXRpbmdJbml0RGVmYXVsdCA9IHRydWVcclxuICAgICAgICAgICAgICAgIGlmIChpc05vdE51bGwoJHNjb3BlLmNvbmZpZy5kYXRhLmRlZmF1bHRWYWwpICYmICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgJHNjb3BlLndhaXRpbmdJbml0RGVmYXVsdCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgIHZhciB0ZW1wVmFsID0gW107XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wVmFsLnB1c2goZWxlbWVudC5pZCk7XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICBpZiAodGVtcFZhbCAmJiB0ZW1wVmFsLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLm11bHRpcGxlU2VsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubXVsdGlTZWxlY3RWYWwgPSB0ZW1wVmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLnZhbCA9ICRzY29wZS5tdWx0aVNlbGVjdFZhbFxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2luZ2xlU2VsZWN0VmFsID0gdGVtcFZhbFswXVxyXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLnZhbCA9ICRzY29wZS5zaW5nbGVTZWxlY3RWYWxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLndhaXRpbmdJbml0RGVmYXVsdCA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKVxyXG5cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyoq6Ieq5a6a5LmJ55qE6buY6K6k5YC8ICovXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNOb3ROdWxsKCRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsVGV4dCkgJiYgJHNjb3BlLmNvbmZpZy5kYXRhLmRlZmF1bHRWYWxUZXh0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgJHNjb3BlLndhaXRpbmdJbml0RGVmYXVsdCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgIHZhciB0ZW1wVmFsID0gW107XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsVGV4dCA9ICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsVGV4dC5yZXBsYWNlKC/vvIwvZywgXCIsXCIpXHJcbiAgICAgICAgICAgICAgICAgIHRlbXBWYWwgPSAkc2NvcGUuY29uZmlnLmRhdGEuZGVmYXVsdFZhbFRleHQuc3BsaXQoJywnKVxyXG4gICAgICAgICAgICAgICAgICBpZiAodGVtcFZhbCAmJiB0ZW1wVmFsLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLm11bHRpcGxlU2VsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubXVsdGlTZWxlY3RWYWwgPSB0ZW1wVmFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEudmFsID0gJHNjb3BlLm11bHRpU2VsZWN0VmFsXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaW5nbGVTZWxlY3RWYWwgPSB0ZW1wVmFsWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEudmFsID0gJHNjb3BlLnNpbmdsZVNlbGVjdFZhbFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUud2FpdGluZ0luaXREZWZhdWx0ID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIDEwMDApXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIHRydWUpXHJcblxyXG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0QWxsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICRzY29wZS5maWx0ZXJEYXRhID0gJydcclxuICAgICAgICAgICAgICBzdGFydEZpbHRlcihcclxuICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcsXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnaXRlbXMsXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmlsdGVyRGF0YVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICRzY29wZS5jaGFuZ2VTZWxlY3QgPSBmdW5jdGlvbiAoc2xlY3RWYWwpIHtcclxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLnJlbG9hZGluZ0Rhc2hib2FyZFN0YXR1cyA9PSBcImNvbXBsZXRlXCIpIHt9XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmZpbHRlckRhdGEgPSBcIlwiO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnLmRhdGEubXVsdGlwbGVTZWxlY3QpIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS52YWwgPSBzbGVjdFZhbDtcclxuICAgICAgICAgICAgICAgIHNsZWN0VmFsLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5maWx0ZXJEYXRhID0gJHNjb3BlLmZpbHRlckRhdGEgKyB2YWx1ZSArIFwiLFwiO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmZpbHRlckRhdGEubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAkc2NvcGUuZmlsdGVyRGF0YSA9ICRzY29wZS5maWx0ZXJEYXRhLnN1YnN0cmluZyhcclxuICAgICAgICAgICAgICAgICAgICAwLFxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5maWx0ZXJEYXRhLmxlbmd0aCAtIDFcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLnZhbCA9IHNsZWN0VmFsO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZpbHRlckRhdGEgPSBzbGVjdFZhbDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKCRzY29wZS53YWl0aW5nSW5pdERlZmF1bHQpIHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0RmlsdGVyKFxyXG4gICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLFxyXG4gICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnaXRlbXMsXHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5maWx0ZXJEYXRhXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyVmFsdWVDaGFuZ2UuYWZ0ZXJDaGFuZ2UoJHNjb3BlLmNvbmZpZ2l0ZW1zLCAkc2NvcGUuY29uZmlnKVxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKHZtLmNvbmZpZy5kYXRhLmN1c3RvbUNvZGUgJiYgdm0uY29uZmlnLmRhdGEuY3VzdG9tQ29kZS5lbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyAgIGV2YWwodm0uY29uZmlnLmRhdGEuY3VzdG9tQ29kZS5hZnRlclZhbHVlQ2hhbmdlQ29kZSlcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgJHNjb3BlLndhaXRpbmdJbml0RGVmYXVsdCA9IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnLmRhdGEuZHJvcFR5cGUgPT0gXCJkYXRlXCIpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsICYmXHJcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmRlZmF1bHRWYWwubGVuZ3RoID09IDJcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmRhdGVGaWx0ZXIuc3RhcnREYXRlID0gJHNjb3BlLmNvbmZpZy5kYXRhLmRlZmF1bHRWYWxbMF07XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmRhdGVGaWx0ZXIuZW5kRGF0ZSA9ICRzY29wZS5jb25maWcuZGF0YS5kZWZhdWx0VmFsWzFdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3REYXRlQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICRzY29wZS5kYXRlRmlsdGVyLnN0YXJ0RGF0ZSA9PSBcIlwiIHx8XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGF0ZUZpbHRlci5lbmREYXRlID09IFwiXCJcclxuICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZGF0ZUZpbHRlci5zdGFydERhdGUgPT0gJHNjb3BlLmRhdGVGaWx0ZXIuZW5kRGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICBzdGFydEZpbHRlcihcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLFxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWdpdGVtcyxcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGF0ZUZpbHRlclxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKCRzY29wZS5kYXRlRmlsdGVyLnN0YXJ0RGF0ZSkgPlxyXG4gICAgICAgICAgICAgICAgICBuZXcgRGF0ZSgkc2NvcGUuZGF0ZUZpbHRlci5lbmREYXRlKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS5kYXRlRmlsdGVyLmVuZERhdGUgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICBhbGVydChcIuW8gOWni+aXpeacn+S4jeW+l+Wkp+S6jue7k+adn+aXpeacn1wiKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXJ0RmlsdGVyKFxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcsXHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZ2l0ZW1zLFxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kYXRlRmlsdGVyXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvKiAjZW5kcmVnaW9uICovXHJcblxyXG4gICAgICAgIC8qICNyZWdpb24g6K+E6K665qih5Z2X5LyY5YyWICovXHJcblxyXG4gICAgICAgICRzY29wZS5pc0luaXRDb21tZW50c0FyZWEgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUub3BlbkxhYmVsVGV4dCA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcclxuICAgICAgICAgIGlmIChzY3JlZW5IZWlnaHQgPCA1MDApIHtcclxuICAgICAgICAgICAgYWxlcnQoXCLpobXpnaLpq5jluqbkuI3lpJ/vvIzml6Dms5XmmL7npLrvvIzor7fkv53or4HpobXpnaLpq5jluqblpKfkuo41MDDlg4/ntKBcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChjaGFydExhYmVsRWxlbWVudCkge1xyXG4gICAgICAgICAgICBjaGFydExhYmVsRWxlbWVudC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgY2hhcnRMYWJlbEVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmNvbW1lbnRzQ29uZmlnLnN0eWxlID0gJHNjb3BlLnNjZW5lT3B0aW9ucy5vcHRpb25zLmNvbW1lbnRzU3R5bGU7XHJcbiAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5jb21tZW50c0NvbmZpZy5jb21tZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChcclxuICAgICAgICAgICAgICBfaXRlbSxcclxuICAgICAgICAgICAgICBfaW5kZXgsXHJcbiAgICAgICAgICAgICAgX2FyclxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRDb21tZW50cyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGlmIChfaW5kZXggPiAyKSB7XHJcbiAgICAgICAgICAgICAgICBfaXRlbS5zaG93ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUNvbW1lbnRzRnJvbVNlcnZlcigpO1xyXG4gICAgICAgICAgICAkc2NvcGUubG9naW5Vc2VyTmFtZSA9IGRhdGFYTG9naW5Vc2VySW5mby51c2VybmFtZTtcclxuICAgICAgICAgICAgaWYgKGRhdGFYTG9naW5Vc2VySW5mby5yb2xlID09IFwiYWRtaW5cIikge1xyXG4gICAgICAgICAgICAgICRzY29wZS5sb2dpblVzZXJOYW1lID0gXCJBbm9ueW1vdXNVc2Vyc1wiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBjaGFydExhYmVsT2ZmID0gJCgkZXZlbnQudGFyZ2V0KS5vZmZzZXQoKTtcclxuICAgICAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgICB2YXIgY29tbWVudHNEaXZUb3AgPSBcIlwiO1xyXG4gICAgICAgICAgICB2YXIgY29tbWVudHNEaXZXaWR0aCA9IFwiXCJcclxuICAgICAgICAgICAgaWYgKHRlcm1pbmFsVHlwZSA9PSBcInBob25lXCIpIHtcclxuICAgICAgICAgICAgICBjb21tZW50c0RpdldpZHRoID0gXCJ3aWR0aDpjYWxjKDEwMCUgLSA3MHB4KTtcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgoY2hhcnRMYWJlbE9mZi50b3AgKyAzMCkgPiBzY3JlZW5IZWlnaHQpIHtcclxuICAgICAgICAgICAgICBjb21tZW50c0RpdlRvcCA9IFwiYm90dG9tOjMwcHg7XCJcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb21tZW50c0RpdlRvcCA9IFwiYm90dG9tOlwiICsgKHNjcmVlbkhlaWdodCAtIGNoYXJ0TGFiZWxPZmYudG9wIC0gMzApICsgXCJweDtcIlxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY2hhcnRMYWJlbFN0eWxlID1cclxuICAgICAgICAgICAgICBcInBvc2l0aW9uOmFic29sdXRlO1wiICtcclxuICAgICAgICAgICAgICBjb21tZW50c0RpdldpZHRoICtcclxuICAgICAgICAgICAgICBjb21tZW50c0RpdlRvcCArXHJcbiAgICAgICAgICAgICAgXCJsZWZ0OlwiICtcclxuICAgICAgICAgICAgICAoY2hhcnRMYWJlbE9mZi5sZWZ0ICsgNDApICsgXCJweDtcIjtcclxuICAgICAgICAgICAgdmFyIGNoYXJ0TGFiZWxIdG1sID0gY2hhcnRMYWJlbEh0bWxTdHIucmVwbGFjZShcIl9zdHlsZV9cIiwgY2hhcnRMYWJlbFN0eWxlKTtcclxuICAgICAgICAgICAgdmFyIGNoYXJ0TGFiZWxUZW1wbGF0ZSA9IGFuZ3VsYXIuZWxlbWVudChjaGFydExhYmVsSHRtbCk7XHJcbiAgICAgICAgICAgIGNoYXJ0TGFiZWxFbGVtZW50ID0gJGNvbXBpbGUoY2hhcnRMYWJlbFRlbXBsYXRlKSgkc2NvcGUpO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKGNoYXJ0TGFiZWxFbGVtZW50KTtcclxuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIG5ldyBQZXJmZWN0U2Nyb2xsYmFyKFwiLnNob3ctYXJlYVwiKTtcclxuICAgICAgICAgICAgfSwgMjAwMCk7XHJcbiAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuc3RhcnRDaGFydFJlcGx5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJChcIi5yZXBseS1zaG93LWVkaXRcIikuaGlkZSgpO1xyXG4gICAgICAgICAgJChcIi5yZXBseS1lZGl0LWFyZWFcIikuc2hvdygpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5wb3N0UmVwbGF5QnlLZXkgPSBmdW5jdGlvbiAoJGV2ZW50LCBwb3N0VHlwZSwgaXRlbSkge1xyXG4gICAgICAgICAgaWYgKCRldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgICAgIC8v5Zue6L2mXHJcbiAgICAgICAgICAgICRzY29wZS5leHBhbmRDb21tZW50cygpO1xyXG4gICAgICAgICAgICBpZiAocG9zdFR5cGUgPT0gXCJ1cGRhdGVcIikge1xyXG4gICAgICAgICAgICAgIGl0ZW0uc3RhdHVzID0gXCJlZGl0XCI7XHJcbiAgICAgICAgICAgICAgLy9pdGVtLnRleHQgPSBzdHJUb1VuaWNvZGUoaXRlbS50ZXh0KVxyXG4gICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVDb21tZW50c0Zyb21TZXJ2ZXIoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAkc2NvcGUucG9zdFJlcGxheSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLm9wZW5CYXJyYWdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5jb25maWcuZGF0YS5jb21tZW50c0NvbmZpZy5iYXJyYWdlKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5jb21tZW50c0NvbmZpZy5iYXJyYWdlckNvdW50ID0gMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJhcnJhZ2VyQ29uZmlnKCRzY29wZS5jb25maWcpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5wb3N0UmVwbGF5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5yZXBsYXlUZXh0ICYmICRzY29wZS5yZXBsYXlUZXh0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHVzZXJOYW1lID0gZGF0YVhMb2dpblVzZXJJbmZvLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICBpZiAoZGF0YVhMb2dpblVzZXJJbmZvLnJvbGUgPT0gXCJhZG1pblwiKSB7XHJcbiAgICAgICAgICAgICAgdXNlck5hbWUgPSBcIuWMv+WQjVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5jb21tZW50c0NvbmZpZy5jb21tZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgICBpZDogZ2VuZXJhdGVVdWlkKDMyLCAxNiksXHJcbiAgICAgICAgICAgICAgdXNlcjogdXNlck5hbWUsXHJcbiAgICAgICAgICAgICAgZGF0ZTogZGF0ZUZ0dCgpLFxyXG4gICAgICAgICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgICAgICAgdGV4dDogJHNjb3BlLnJlcGxheVRleHQsXHJcbiAgICAgICAgICAgICAgc3RhdHVzOiBcImVkaXRcIixcclxuICAgICAgICAgICAgICByYXRlOiAwLFxyXG4gICAgICAgICAgICAgIGxpa2U6IDAsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge31cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICRzY29wZS5leHBhbmRDb21tZW50cygpO1xyXG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlQ29tbWVudHNGcm9tU2VydmVyKCk7XHJcbiAgICAgICAgICAgICRzY29wZS5yZXBsYXlUZXh0ID0gXCJcIjtcclxuICAgICAgICAgICAgJChcIi5yZXBseS1zaG93LWVkaXRcIikuc2hvdygpO1xyXG4gICAgICAgICAgICAkKFwiLnJlcGx5LWVkaXQtYXJlYVwiKS5oaWRlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmRlbFJlcGxheSA9IGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICBpdGVtLnN0YXR1cyA9IFwiZGVsZXRlXCI7XHJcbiAgICAgICAgICAkc2NvcGUuZXhwYW5kQ29tbWVudHMoKTtcclxuICAgICAgICAgICRzY29wZS51cGRhdGVDb21tZW50c0Zyb21TZXJ2ZXIoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUudXBkYXRlQ29tbWVudHNGcm9tU2VydmVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5jb25maWdUeXBlID09IFwiY2hhcnRcIikge1xyXG4gICAgICAgICAgICBxdWlja1NhdmUoJHNjb3BlLmNvbmZpZywgXCJlY2hhcnRzXCIsIFwic2luZ2xlSXRlbVwiLCBcImNvbW1lbnRzXCIpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkc2NvcGUuY29uZmlnVHlwZSA9PSBcInRhYmxlXCIpIHtcclxuICAgICAgICAgICAgcXVpY2tTYXZlKCRzY29wZS5jb25maWcsIFwidGFibGVcIiwgXCJzaW5nbGVJdGVtXCIsIFwiY29tbWVudHNcIik7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhbGVydChcIuivu+WPlue7hOS7tuexu+Wei+Wksei0pSzml6Dms5Xkv67mlLnor4TorrpcIik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmV4cGFuZENvbW1lbnRzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJHNjb3BlLmlzRXhwYW5kQ29tbWVudHMgPSB0cnVlO1xyXG4gICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmNvbW1lbnRzQ29uZmlnLmNvbW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKFxyXG4gICAgICAgICAgICBfaXRlbSxcclxuICAgICAgICAgICAgX2luZGV4LFxyXG4gICAgICAgICAgICBfYXJyXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgX2l0ZW0uc2hvdyA9IHRydWU7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKiAjZW5kcmVnaW9uICovXHJcblxyXG4gICAgICAgIC8qICNyZWdpb24g5YWo5bGP5bGV56S6ICAqL1xyXG4gICAgICAgICRzY29wZS5mdWxsU2hvd0NoYXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJChcIi5mdWxsLXNjcmVlbi1jb250ZW50XCIpLmhlaWdodChkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCAqIDAuOTgpO1xyXG4gICAgICAgICAgJChcIi5mdWxsLXNjcmVlbi1jb250ZW50XCIpLnNob3coKTtcclxuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRDaGFydCA9IGVjaGFydHMuZ2V0SW5zdGFuY2VCeURvbShcclxuICAgICAgICAgICAgICAkZWxlbWVudC5maW5kKFwiLmNoYXJ0LWNvbnRlbnRcIilbMF1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdmFyIG15Q2hhcnQgPSBlY2hhcnRzLmluaXQoXHJcbiAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmdWxsU2hvd0NoYXJ0XCIpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wT3B0aW9uID0gY3VycmVudENoYXJ0LmdldE9wdGlvbigpO1xyXG4gICAgICAgICAgICB1cGRhdGVDaGFydEZvbnRDb2xvcihcImVjaGFydHNcIiwgdGVtcE9wdGlvbiwgXCJyZ2JhKDAsIDAsIDAsIDEpXCIpO1xyXG4gICAgICAgICAgICBteUNoYXJ0LnNldE9wdGlvbih0ZW1wT3B0aW9uKTtcclxuICAgICAgICAgICAgbXlDaGFydC5vZmYoKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyogI2VuZHJlZ2lvbiAqL1xyXG5cclxuICAgICAgICAvKiAjcmVnaW9uIOihqOagvCAgKi9cclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmRhdGF0eXBlICYmXHJcbiAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuZGF0YXR5cGUgPT0gXCJ0YWJsZVwiXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAkc2NvcGUuc3JvbGxIZWlnaHQgPSAwXHJcbiAgICAgICAgICBcclxuICAgICAgICAgICRzY29wZS5jYWxjVGFibGVIZWlnaHQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJHNjb3BlLml0ZW1Ub3RhbEhlaWdodCA9ICRzY29wZS5jb25maWcuc2l6ZVkgKiAkc2NvcGUucm93SGVpZ2h0IC0gNDA7XHJcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnLmRhdGEuanNvbmNvbmZpZy50YWJsZVRpdGxlICYmICRzY29wZS5jb25maWcuZGF0YS5qc29uY29uZmlnLnRhYmxlVGl0bGUubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICRzY29wZS5pdGVtVG90YWxIZWlnaHQgPSAkc2NvcGUuaXRlbVRvdGFsSGVpZ2h0IC0gMzVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgJHNjb3BlLmNhbGNUYWJsZUhlaWdodCgpXHJcbiAgICAgICAgICAkc2NvcGUudGFibGVDbGFzcyA9IFwic2NlbmVzLXRhYmxlLVwiICsgJHNjb3BlLmNvbXBvbmVudFV1aWQ7XHJcbiAgICAgICAgICAkc2NvcGUudGFibGVCb2R5Q2xhc3MgPSBcInNjZW5lcy10YWJsZS1ib2R5LVwiICsgJHNjb3BlLmNvbXBvbmVudFV1aWQ7XHJcbiAgICAgICAgICAkc2NvcGUudGFibGVPYmogPSB7XHJcbiAgICAgICAgICAgIGNvbHVtbjogW10sXHJcbiAgICAgICAgICAgIGRhdGE6IFtdLFxyXG4gICAgICAgICAgICB0b3RhbEl0ZW1zOiAwLFxyXG4gICAgICAgICAgICBwYWdlOiAxLFxyXG4gICAgICAgICAgICBsaW1pdDogMTAsXHJcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlTnVtOiA1LFxyXG4gICAgICAgICAgICB0b3RhbFBhZ2U6IDBcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnJvd0hlaWdodCAmJiAkc2NvcGUuY29uZmlnLmRhdGEuc3R5bGVDb25maWcucm93SGVpZ2h0ID4gMTApIHtcclxuICAgICAgICAgICAgJHNjb3BlLnRhYmxlUm93SGVpZ2h0ID0gJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnJvd0hlaWdodFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHNjb3BlLnRhYmxlUm93SGVpZ2h0ID0gMzVcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhciB0YWJsZUNvbmZpZyA9ICRzY29wZS5jb25maWcuZGF0YS5qc29uY29uZmlnO1xyXG5cclxuICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnLmRhdGEuc3R5bGVDb25maWcuZWRpdGFibGUpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmN1c3RvbUNvbmZpZyA9IHtcclxuICAgICAgICAgICAgICBlZGl0YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICBjdXN0b21BZnRlcmNoYW5nZUNvZGU6ICRzY29wZS5jb25maWcuZGF0YS5zdHlsZUNvbmZpZy5hZnRlckNoYW5nZUNvZGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHNjb3BlLmN1c3RvbUNvbmZpZyA9IHtcclxuICAgICAgICAgICAgICBlZGl0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgY3VzdG9tQWZ0ZXJjaGFuZ2VDb2RlOiAnJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAkc2NvcGUucXVlcnlMaXN0ID0gZnVuY3Rpb24gKHBhZ2UpIHtcclxuICAgICAgICAgICAgdmFyIF90ZW1wQ2xhc3MgPSBcImNoYXJ0cy1cIiArICRzY29wZS5jb25maWcuZGF0YS5pZDtcclxuICAgICAgICAgICAgZGF0YXhMb2Rpbmcuc2hvd0xvYWRpbmcoXCJjaGFydHMtXCIgKyAkc2NvcGUuY29uZmlnLmRhdGEuaWQpO1xyXG4gICAgICAgICAgICAkc2NvcGUudGFibGVPYmouaGVhZHMgPSBbXTtcclxuICAgICAgICAgICAgJGh0dHAoe1xyXG4gICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgdXJsOiBlbmNvZGVVUkkoJHNjb3BlLmNvbmZpZy5kYXRhLmpzb25jb25maWcuZGF0YS51cmwpLFxyXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiWC1DU1JGVG9rZW5cIjogZ2V0Q29va2llKFwiY3NyZnRva2VuXCIpXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBjb2x1bW46IEpTT04uc3RyaW5naWZ5KHRhYmxlQ29uZmlnLmNvbHVtbnMpLFxyXG4gICAgICAgICAgICAgICAgb2xhcGlkOiB0YWJsZUNvbmZpZy5vbGFwaWQsXHJcbiAgICAgICAgICAgICAgICBsaW1pdDogdGFibGVDb25maWcubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgbWVyZ2U6IHRhYmxlQ29uZmlnLm1lcmdlLFxyXG4gICAgICAgICAgICAgICAgbWVyZ2VDb2xzOiBKU09OLnN0cmluZ2lmeSh0YWJsZUNvbmZpZy5tZXJnZUNvbHMpLFxyXG4gICAgICAgICAgICAgICAgcGFnZTogcGFnZVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocnMpIHtcclxuICAgICAgICAgICAgICBkYXRheExvZGluZy5oaWRlTG9hZGluZyhfdGVtcENsYXNzKTtcclxuICAgICAgICAgICAgICB2YXIgcnNkYXRhID0gcnMuZGF0YTtcclxuICAgICAgICAgICAgICBpZiAocnNkYXRhLmRhdGEgJiYgcnNkYXRhLmRhdGEubGVuZ3RoID49IDApIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS50YWJsZU9iai5jb2x1bW4gPSB0YWJsZUNvbmZpZ1tcImNvbHVtbnNcIl07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudGFibGVPYmouZGF0YSA9IHJzZGF0YS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRhYmxlT2JqLmhlYWRzID0gYW5ndWxhci5jb3B5KFxyXG4gICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuanNvbmNvbmZpZy50aGVhZHNcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudGFibGVPYmoucGFnZSA9IHBhZ2U7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJzZGF0YS50b3RhbCA9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICRzY29wZS50YWJsZU9iai50b3RhbEl0ZW1zID0gcnNkYXRhLnRvdGFsO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcnNkYXRhLnRvdGFsID09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgJHNjb3BlLnRhYmxlT2JqLnRvdGFsSXRlbXMgPSByc2RhdGEudG90YWwudG90YWw7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAkc2NvcGUudGFibGVPYmoudG90YWxJdGVtcyA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudGFibGVPYmoubGltaXQgPSB0YWJsZUNvbmZpZy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudGFibGVPYmoudG90YWxQYWdlID0gTWF0aC5jZWlsKFxyXG4gICAgICAgICAgICAgICAgICByc2RhdGEudG90YWwgLyB0YWJsZUNvbmZpZy5sZW5ndGhcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICRzY29wZS5hZnRlckRhdGFMb2FkKHtldjp7dHlwZTondGFibGUnLCBkYXRhOiAkc2NvcGUuY29uZmlnfX0pXHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChycykge1xyXG4gICAgICAgICAgICAgICRzY29wZS5hZnRlckRhdGFMb2FkKHtldjp7dHlwZTondGFibGUnLCBkYXRhOiAkc2NvcGUuY29uZmlnfX0pXHJcbiAgICAgICAgICAgICAgZGF0YXhMb2RpbmcuaGlkZUxvYWRpbmcoX3RlbXBDbGFzcyk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5LiO5ZCO5Y+w5Lqk5LqS5Y+R55Sf6ZSZ6K+vLCDlkI7lj7Dov5Tlm57kv6Hmga/kuLo6JywgcnMpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICB2YXIgY29sQ291bnQgPSB0YWJsZUNvbmZpZ1tcImNvbHVtbnNcIl0ubGVuZ3RoO1xyXG4gICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAhdGFibGVDb25maWdbXCJmaXhDb2xXaWR0aHNcIl0gfHxcclxuICAgICAgICAgICAgdGFibGVDb25maWdbXCJmaXhDb2xXaWR0aHNcIl0ubGVuZ3RoICE9IGNvbENvdW50XHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgdGFibGVDb25maWdbXCJmaXhDb2xXaWR0aHNcIl0gPSBuZXcgQXJyYXkoY29sQ291bnQpO1xyXG4gICAgICAgICAgICB0YWJsZUNvbmZpZ1tcImNvbHVtbnNcIl0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgdGFibGVDb25maWdbXCJmaXhDb2xXaWR0aHNcIl1baW5kZXhdID0gMDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAkc2NvcGUuZml4Q29sV2lkdGhzID0gdGFibGVDb25maWdbXCJmaXhDb2xXaWR0aHNcIl0ubWFwKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDBcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAkc2NvcGUudGFibGVDZWxsU3R5bGUgPSBuZXcgQXJyYXkoY29sQ291bnQpO1xyXG4gICAgICAgICAgJHNjb3BlLmZpeFRhYmxlU3R5bGUgPSBmdW5jdGlvbiAoZml4Q29sV2lkdGhzKSB7XHJcbiAgICAgICAgICAgIC8vIOiOt+WPluaOp+S7tuaAu+mrmOWuvVxyXG4gICAgICAgICAgICAvLyDliKTmlq3mmK/lkKbmnInliIbpobXmoI/lkozmsYfmgLvmoI/nrYlcclxuICAgICAgICAgICAgLy8gdmFyIHRvdGFsSGVpZ2h0ID0gJCgkZWxlbWVudCkuZmluZCgnLnBhcmVudC1jb250ZW50JykuaGVpZ2h0KCkgLSAzMDtcclxuICAgICAgICAgICAgJHNjb3BlLmNhbGNUYWJsZUhlaWdodCgpXHJcbiAgICAgICAgICAgIHZhciB0b3RhbEhlaWdodCA9ICRzY29wZS5jb25maWcuc2l6ZVkgKiAkc2NvcGUucm93SGVpZ2h0IC0gNDA7XHJcbiAgICAgICAgICAgIGlmICghJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnNob3dQYWdlKSB7XHJcbiAgICAgICAgICAgICAgdG90YWxIZWlnaHQgPSB0b3RhbEhlaWdodCArIDE1O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciB0b3RhbFdpZHRoO1xyXG4gICAgICAgICAgICBpZiAodGVybWluYWxUeXBlID09IFwicGhvbmVcIikge1xyXG4gICAgICAgICAgICAgIHRvdGFsV2lkdGggPSAkKCRlbGVtZW50KVxyXG4gICAgICAgICAgICAgICAgLmZpbmQoXCIucGFyZW50LWNvbnRlbnRcIilcclxuICAgICAgICAgICAgICAgIC53aWR0aCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRvdGFsV2lkdGggPVxyXG4gICAgICAgICAgICAgICAgKCR3aW5kb3cuaW5uZXJXaWR0aCAvIDk2KS50b0ZpeGVkKDIpICogJHNjb3BlLmNvbmZpZy5zaXplWCAtIDIwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkc2NvcGUuY29sdW1ucyA9IFtdXHJcbiAgICAgICAgICAgICRzY29wZS50ZW1wQ29sdW1ucyA9IFtdXHJcbiAgICAgICAgICAgICRzY29wZS5jb2xJbmZvcyA9ICgkc2NvcGUuY29uZmlnLmRhdGEuanNvbmNvbmZpZy50aGVhZHNbJHNjb3BlLmNvbmZpZy5kYXRhLmpzb25jb25maWcudGhlYWRzLmxlbmd0aCAtIDFdKS5yb3dzXHJcbiAgICAgICAgICAgIC8vIOWuveW6pjEwMCVcclxuICAgICAgICAgICAgaWYgKCRzY29wZS5jb25maWcuZGF0YS5zdHlsZUNvbmZpZy5mdWxsRml4KSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLnVuaXRXaWR0aCA9ICh0b3RhbFdpZHRoIC8gJHNjb3BlLmNvbEluZm9zLmxlbmd0aCkudG9GaXhlZCgyKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICRzY29wZS51bml0V2lkdGggPSAxMDBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkc2NvcGUudG90YWxXaWR0aCA9IDBcclxuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmpzb25jb25maWcudGhlYWRzLmZvckVhY2goZnVuY3Rpb24gKHJvdywgcm93SW5kZXgpIHtcclxuICAgICAgICAgICAgICAkc2NvcGUudGVtcENvbHVtbnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICByb3dzOiBbXVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgcm93LnJvd3MuZm9yRWFjaChmdW5jdGlvbiAoY29sLCBjb2xJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZW1Db2xzcGFuID0gY29sWydjb2xzcGFuJ10gPyBjb2xbJ2NvbHNwYW4nXSA6ICcxJ1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbE9iaiA9IHtcclxuICAgICAgICAgICAgICAgICAgJ3Jvd3NwYW4nOiBjb2xbJ3Jvd3NwYW4nXSA/IGNvbFsncm93c3BhbiddIDogJzEnLFxyXG4gICAgICAgICAgICAgICAgICAnY29sc3Bhbic6IGl0ZW1Db2xzcGFuLFxyXG4gICAgICAgICAgICAgICAgICAnd2lkdGgnOiBOdW1iZXIoJHNjb3BlLnVuaXRXaWR0aCkgKyBOdW1iZXIoZml4Q29sV2lkdGhzW2NvbEluZGV4XSksXHJcbiAgICAgICAgICAgICAgICAgICd0aXRsZSc6IGNvbFsndGl0bGUnXSA/IGNvbFsndGl0bGUnXSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAnZmllbGQnOiBjb2xbJ2ZpZWxkJ10gPyBjb2xbJ2ZpZWxkJ10gOiAnJyxcclxuICAgICAgICAgICAgICAgICAgJ2lzZWRpdCc6IGNvbFsnaXNlZGl0J10gPyBjb2xbJ2lzZWRpdCddIDogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAnZm9ybWF0JzogY29sWydmb3JtYXQnXSA/IGNvbFsnZm9ybWF0J10gOiAnJyxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChyb3dJbmRleCA9PSAoJHNjb3BlLmNvbmZpZy5kYXRhLmpzb25jb25maWcudGhlYWRzLmxlbmd0aCAtIDEpKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8qKuWIl+mUgeWumiAqL1xyXG4gICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLmZpeGVkTGVmdCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5zdHlsZUNvbmZpZy5maXhlZExlZnQgPiAwICYmXHJcbiAgICAgICAgICAgICAgICAgICAgY29sSW5kZXggPCAkc2NvcGUuY29uZmlnLmRhdGEuc3R5bGVDb25maWcuZml4ZWRMZWZ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sT2JqWydmaXhlZCddID0gJ2xlZnQnXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgJHNjb3BlLnRvdGFsV2lkdGggPSAkc2NvcGUudG90YWxXaWR0aCArIE51bWJlcihjb2xPYmpbJ3dpZHRoJ10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUudGVtcENvbHVtbnNbcm93SW5kZXhdLnJvd3MucHVzaChjb2xPYmopXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLyoqIOW9k+ihqOagvOWuveW6puWSjOWuueWZqOWuveW6puW3rui3nei/h+Wkp+aXtu+8jOmHjeaWsOiuoeeul+ihqOagvOWuveW6piAqL1xyXG4gICAgICAgICAgICB2YXIgY29sRml4V2lkdGggPSAoKHRvdGFsV2lkdGggLSAkc2NvcGUudG90YWxXaWR0aCkgLyAoJHNjb3BlLmNvbEluZm9zLmxlbmd0aCkpLnRvRml4ZWQoMik7XHJcbiAgICAgICAgICAgIGlmIChjb2xGaXhXaWR0aCA+IDEgfHwgKGNvbEZpeFdpZHRoIDwgLTEgJiYgJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLmZ1bGxGaXgpKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLnRlbXBDb2x1bW5zWyRzY29wZS50ZW1wQ29sdW1ucy5sZW5ndGggLSAxXS5yb3dzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW1bJ3dpZHRoJ10gPSBOdW1iZXIoaXRlbVsnd2lkdGgnXSkgKyBOdW1iZXIoY29sRml4V2lkdGgpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkc2NvcGUuY29sdW1ucyA9IGFuZ3VsYXIuY29weSgkc2NvcGUudGVtcENvbHVtbnMpXHJcblxyXG4gICAgICAgICAgICBpZiAoaXNOb3ROdWxsKCRzY29wZS5jb25maWcuZGF0YS5zdHlsZUNvbmZpZy50YWJsZUJvcmRlckNvbG9yKSkge1xyXG4gICAgICAgICAgICAgICRzY29wZS5kYXRhVGFibGVTdHlsZS50YWJsZVN0eWxlWydib3JkZXJDb2xvciddID0gJHNjb3BlLmNvbmZpZy5kYXRhLnN0eWxlQ29uZmlnLnRhYmxlQm9yZGVyQ29sb3JcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJHNjb3BlLmZpeENvbFdpZHRoID0gZnVuY3Rpb24gKG5ld3ZhbCwgaW5kZXgpIHtcclxuICAgICAgICAgICAgICB0YWJsZUNvbmZpZ1tcImZpeENvbFdpZHRoc1wiXVtpbmRleF0gPSBuZXd2YWxcclxuICAgICAgICAgICAgICAkc2NvcGUuZml4VGFibGVTdHlsZSh0YWJsZUNvbmZpZ1tcImZpeENvbFdpZHRoc1wiXSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICRzY29wZS4kd2F0Y2goXCJjb25maWcuZGF0YS5qc29uY29uZmlnLmRhdGEudXJsXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCRzY29wZS5jb25maWcuZGF0YS5yZWZyZXNoQ291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLnF1ZXJ5TGlzdCgxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgJHNjb3BlLiR3YXRjaCgnY29uZmlnLmRhdGEuc3R5bGVDb25maWcnLCBmdW5jdGlvbiAobmV3dmFsKSB7XHJcbiAgICAgICAgICAgIGlmIChpc05vdE51bGwobmV3dmFsKSAmJiBpc05vdE51bGwobmV3dmFsLnRhYmxlQm9yZGVyQ29sb3IpICYmXHJcbiAgICAgICAgICAgICAgaXNOb3ROdWxsKCRzY29wZS5kYXRhVGFibGVTdHlsZSkgJiYgaXNOb3ROdWxsKCRzY29wZS5kYXRhVGFibGVTdHlsZS50YWJsZVN0eWxlKSkge1xyXG4gICAgICAgICAgICAgICRzY29wZS5kYXRhVGFibGVTdHlsZS50YWJsZVN0eWxlWydib3JkZXJDb2xvciddID0gbmV3dmFsLnRhYmxlQm9yZGVyQ29sb3JcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAkc2NvcGUuJHdhdGNoKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5jb25maWcuZGF0YS5yZWZyZXNoQ291bnQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChuZXd2YWwpIHtcclxuICAgICAgICAgICAgICAvLyDpmLLmraLliJ3lp4vljJbml7blpJrmrKHliqDovb1cclxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNvbmZpZy5kYXRhLnJlZnJlc2hDb3VudCA+IDApIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5maXhUYWJsZVN0eWxlKHRhYmxlQ29uZmlnW1wiZml4Q29sV2lkdGhzXCJdKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgJHNjb3BlLiR3YXRjaChcInNjZW5lc0NvbnRlbnRXaWR0aFwiLCBmdW5jdGlvbiAobmV3dmFsKSB7XHJcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnKSB7XHJcbiAgICAgICAgICAgICAgLy8g6Ziy5q2i5Yid5aeL5YyW5pe25aSa5qyh5Yqg6L29XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRXaWR0aCA9ICR3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLmN1cnJlbnRXaWR0aCA9PSBuZXd2YWwpIHtcclxuICAgICAgICAgICAgICAgIC8vIOiwg+aVtOa1j+iniOWZqOWuveW6pjFT5ZCO5Yi35pawXHJcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuY3VycmVudFdpZHRoID09IG5ld3ZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5maXhUYWJsZVN0eWxlKHRhYmxlQ29uZmlnW1wiZml4Q29sV2lkdGhzXCJdKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgMTAwMCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyogI2VuZHJlZ2lvbiAqL1xyXG5cclxuICAgICAgICAvKiAjcmVnaW9uIOWbvuihqCAqL1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5kYXRhdHlwZSAmJlxyXG4gICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmRhdGF0eXBlID09IFwiY2hhcnRcIlxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgaWYgKCEkc2NvcGUuY29uZmlnLmRhdGEuZWNoYXJ0Y29uZmlnKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgLy/muIXpmaTogZTliqhcclxuICAgICAgICAgICRzY29wZS5yZWxlYXNlTGluayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5saW5rICYmXHJcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmxpbmsgPT0gXCJsaW5rU3RhcnRcIlxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICByZWxlYXNlU2luZ2xlTGluaygkc2NvcGUuY29uZmlnLmRhdGEsICRzY29wZS5jb25maWdpdGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgJHNjb3BlLmNoYXJ0Rm9udENvbG9yID0gXCJcIjtcclxuICAgICAgICAgICRzY29wZS4kd2F0Y2goXHJcbiAgICAgICAgICAgIFwiY29uZmlnLmRhdGEuc3R5bGVDb25maWdcIixcclxuICAgICAgICAgICAgZnVuY3Rpb24gKG5ld3ZhbCkge1xyXG4gICAgICAgICAgICAgIC8vIOehruS/neWcqOatpOaWueazleWPquWcqOaWsOWinueVjOmdouWSjOe8lui+kSjmn6XnnIsp55WM6Z2i55qE5pWw5o2u6K+75Y+W5a6M5oiQ5LmL5ZCO5omN5Lya5omn6KGMXHJcbiAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbG9hZGluZ0Rhc2hib2FyZFN0YXR1cyA9PSBcImNvbXBsZXRlXCIgJiZcclxuICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5yZWZyZXNoQ291bnQgPiAwXHJcbiAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnN5bmNGb250Q29sb3IpIHtcclxuICAgICAgICAgICAgICAgICAgdmFyIGNoYXJ0Rm9udENvbG9yID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgaWYgKG5ld3ZhbCAmJiBuZXd2YWwuY29sb3IgJiYgbmV3dmFsLmNvbG9yLmxlbmd0aCA+IDcpIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGFydEZvbnRDb2xvciA9IG5ld3ZhbC5jb2xvcjtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGFydEZvbnRDb2xvciA9ICQoXCIubWFpbi1hcHAtY29udGVudFwiKS5jc3MoXCJjb2xvclwiKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNoYXJ0Rm9udENvbG9yICE9IGNoYXJ0Rm9udENvbG9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNoYXJ0Rm9udENvbG9yID0gY2hhcnRGb250Q29sb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVjaGFydENvbmZpZ09iaiA9IEpTT04ucGFyc2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuZWNoYXJ0Y29uZmlnXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEuanNvbmNvbmZpZyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmpzb25jb25maWcgPT0gXCJzaW5nbGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdXBkYXRlQ2hhcnRGb250Q29sb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2luZ2xlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVjaGFydENvbmZpZ09iaixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhcnRGb250Q29sb3JcclxuICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNoYXJ0Rm9udENvbG9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImVjaGFydHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWNoYXJ0Q29uZmlnT2JqLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFydEZvbnRDb2xvclxyXG4gICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmVjaGFydGNvbmZpZyA9IEpTT04uc3RyaW5naWZ5KFxyXG4gICAgICAgICAgICAgICAgICAgICAgZWNoYXJ0Q29uZmlnT2JqXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnLmRhdGEucmVmcmVzaENvdW50ICs9IDE7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRydWVcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgJHNjb3BlLiR3YXRjaChcImNvbmZpZy5kYXRhLnJlZnJlc2hDb3VudFwiLCBmdW5jdGlvbiAobmV3dmFsKSB7XHJcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY29uZmlnLmRhdGEucmVmcmVzaENvdW50ID4gMCkge1xyXG4gICAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZyA9IEpTT04ucGFyc2UoJHNjb3BlLmNvbmZpZy5kYXRhLmVjaGFydGNvbmZpZyk7XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiAkc2NvcGUuZWNjb25maWcuZGF0YS51cmwgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgZGF0YXhMb2Rpbmcuc2hvd0xvYWRpbmcoXCJjaGFydHMtXCIgKyAkc2NvcGUuY29uZmlnLmRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgJGh0dHBcclxuICAgICAgICAgICAgICAgICAgLmdldChlbmNvZGVVUkkoJHNjb3BlLmVjY29uZmlnLmRhdGEudXJsKSlcclxuICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmxpc3RzID0gcmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIGRhdGFTZXRPYmogPSBKU09OLnBhcnNlKCRzY29wZS5jb25maWcuZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy53aWR0aCA9ICQoJGVsZW1lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAuZmluZChcIi5wYXJlbnQtY29udGVudFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgLndpZHRoKCk7IC8vJHNjb3BlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5oZWlnaHQgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5zaXplWSAqICRzY29wZS5yb3dIZWlnaHQgLSA2O1xyXG4gICAgICAgICAgICAgICAgICAgIGJ1aWxkRWNoYXJ0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJCgkZWxlbWVudCkuZmluZChcIi5jaGFydC1jb250ZW50XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmxpc3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgIFwiZGFzaGJib2FyZDJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnaXRlbXNcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5jaGFydEhlaWdodCA9ICRzY29wZS5lY2NvbmZpZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLmNoYXJ0V2lkdGggPSAkc2NvcGUuZWNjb25maWcud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YXhMb2RpbmcuaGlkZUxvYWRpbmcoXCJjaGFydHMtXCIgKyAkc2NvcGUuY29uZmlnLmRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hZnRlckRhdGFMb2FkKHtldjp7dHlwZTonY2hhcnQnLCBkYXRhOiAkc2NvcGUuY29uZmlnfX0pXHJcbiAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChycykge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hZnRlckRhdGFMb2FkKHtldjp7dHlwZTonY2hhcnQnLCBkYXRhOiAkc2NvcGUuY29uZmlnfX0pXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YXhMb2RpbmcuaGlkZUxvYWRpbmcoXCJjaGFydHMtXCIgKyAkc2NvcGUuY29uZmlnLmRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+S4juWQjuWPsOS6pOS6kuWPkeeUn+mUmeivrywg5ZCO5Y+w6L+U5Zue5L+h5oGv5Li6OicsIHJzKVxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICRzY29wZS4kd2F0Y2goXCJzY2VuZXNDb250ZW50V2lkdGhcIiwgZnVuY3Rpb24gKG5ld3ZhbCkge1xyXG4gICAgICAgICAgICAvLyDpmLLmraLliJ3lp4vljJbml7blpJrmrKHliqDovb1cclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICRzY29wZS5zY2VuZXNDb250ZW50V2lkdGggPiAwICYmXHJcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZy5kYXRhLnJlZnJlc2hDb3VudCA+IDBcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRXaWR0aCA9ICR3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmN1cnJlbnRXaWR0aCA9PSBuZXd2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgJCgkZWxlbWVudCkuZmluZChcIi5jaGFydC1jb250ZW50XCIpWzBdLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XHJcbiAgICAgICAgICAgICAgICAgICQoJGVsZW1lbnQpLmZpbmQoXCIuY2hhcnQtY29udGVudFwiKVswXS5zdHlsZS5oZWlnaHQgPSBcIjEwMCVcIjtcclxuICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWcuZGF0YS5qc29uY29uZmlnICE9IFwic2luZ2xlXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBlY2hhcnRzLmdldEluc3RhbmNlQnlEb20oXHJcbiAgICAgICAgICAgICAgICAgICAgICAkKCRlbGVtZW50KS5maW5kKFwiLmNoYXJ0LWNvbnRlbnRcIilbMF1cclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVjaGFydHNcclxuICAgICAgICAgICAgICAgICAgICAgIC5nZXRJbnN0YW5jZUJ5RG9tKCQoJGVsZW1lbnQpLmZpbmQoXCIuY2hhcnQtY29udGVudFwiKVswXSlcclxuICAgICAgICAgICAgICAgICAgICAgIC5yZXNpemUoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyogI2VuZHJlZ2lvbiAqL1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgdmx1aS5kaXJlY3RpdmU6bW9kYWxcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgbW9kYWxcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCdkYXNoYm9hcmQnKVxyXG4gIC5kaXJlY3RpdmUoJ21vZGFsJywgZnVuY3Rpb24gKCRkb2N1bWVudCwgTW9kYWxzKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvbW9kYWwvbW9kYWwuaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgYXV0b09wZW46ICc8JyxcclxuICAgICAgICBtYXhXaWR0aDogJ0AnXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFByb3ZpZGUgYW4gaW50ZXJmYWNlIGZvciBjaGlsZCBkaXJlY3RpdmVzIHRvIGNsb3NlIHRoaXMgbW9kYWxcclxuICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0sXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgIHZhciBtb2RhbElkID0gYXR0cnMuaWQ7XHJcblxyXG4gICAgICAgIGlmIChzY29wZS5tYXhXaWR0aCkge1xyXG4gICAgICAgICAgc2NvcGUud3JhcHBlclN0eWxlID0gJ21heC13aWR0aDonICsgc2NvcGUubWF4V2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZWZhdWx0IHRvIGNsb3NlZCB1bmxlc3MgYXV0b09wZW4gaXMgc2V0XHJcbiAgICAgICAgc2NvcGUuaXNPcGVuID0gc2NvcGUuYXV0b09wZW47XHJcblxyXG4gICAgICAgIC8vIGNsb3NlIG9uIGVzY1xyXG4gICAgICAgIGZ1bmN0aW9uIGVzY2FwZShlKSB7XHJcbiAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAyNyAmJiBzY29wZS5pc09wZW4pIHtcclxuICAgICAgICAgICAgc2NvcGUuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHNjb3BlLiRkaWdlc3QoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkZG9jdW1lbnQpLm9uKCdrZXlkb3duJywgZXNjYXBlKTtcclxuXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgdGhpcyBtb2RhbCB3aXRoIHRoZSBzZXJ2aWNlXHJcbiAgICAgICAgTW9kYWxzLnJlZ2lzdGVyKG1vZGFsSWQsIHNjb3BlKTtcclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBNb2RhbHMuZGVyZWdpc3Rlcihtb2RhbElkKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgdmx1aS5kaXJlY3RpdmU6bW9kYWxDbG9zZUJ1dHRvblxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBtb2RhbENsb3NlQnV0dG9uXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnZGFzaGJvYXJkJylcclxuICAuZGlyZWN0aXZlKCdtb2RhbENsb3NlQnV0dG9uJywgZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvbW9kYWwvbW9kYWxjbG9zZWJ1dHRvbi5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVxdWlyZTogJ15ebW9kYWwnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGNsb3NlQWN0aW9uOiAnJidcclxuICAgICAgfSxcclxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtb2RhbENvbnRyb2xsZXIpIHtcclxuICAgICAgICBzY29wZS5jbG9zZU1vZGFsID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBtb2RhbENvbnRyb2xsZXIuY2xvc2UoKTtcclxuICAgICAgICAgIGlmIChzY29wZS5jbG9zZUFjdGlvbikge1xyXG4gICAgICAgICAgICBzY29wZS5jbG9zZUFjdGlvbigpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2Mgc2VydmljZVxyXG4gKiBAbmFtZSB2bHVpLk1vZGFsc1xyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBNb2RhbHNcclxuICogU2VydmljZSB1c2VkIHRvIGNvbnRyb2wgbW9kYWwgdmlzaWJpbGl0eSBmcm9tIGFueXdoZXJlIGluIHRoZSBhcHBsaWNhdGlvblxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ2Rhc2hib2FyZCcpXHJcbiAgLmZhY3RvcnkoJ01vZGFscycsIGZ1bmN0aW9uICgkY2FjaGVGYWN0b3J5KSB7XHJcblxyXG4gICAgLy8gVE9ETzogVGhlIHVzZSBvZiBzY29wZSBoZXJlIGFzIHRoZSBtZXRob2QgYnkgd2hpY2ggYSBtb2RhbCBkaXJlY3RpdmVcclxuICAgIC8vIGlzIHJlZ2lzdGVyZWQgYW5kIGNvbnRyb2xsZWQgbWF5IG5lZWQgdG8gY2hhbmdlIHRvIHN1cHBvcnQgcmV0cmlldmluZ1xyXG4gICAgLy8gZGF0YSBmcm9tIGEgbW9kYWwgYXMgbWF5IGJlIG5lZWRlZCBpbiAjNzdcclxuICAgIHZhciBtb2RhbHNDYWNoZSA9ICRjYWNoZUZhY3RvcnkoJ21vZGFscycpO1xyXG5cclxuICAgIC8vIFB1YmxpYyBBUElcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihpZCwgc2NvcGUpIHtcclxuICAgICAgICBpZiAobW9kYWxzQ2FjaGUuZ2V0KGlkKSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ2Fubm90IHJlZ2lzdGVyIHR3byBtb2RhbHMgd2l0aCBpZCAnICsgaWQpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RhbHNDYWNoZS5wdXQoaWQsIHNjb3BlKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGRlcmVnaXN0ZXI6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgbW9kYWxzQ2FjaGUucmVtb3ZlKGlkKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIE9wZW4gYSBtb2RhbFxyXG4gICAgICBvcGVuOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHZhciBtb2RhbFNjb3BlID0gbW9kYWxzQ2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICBpZiAoIW1vZGFsU2NvcGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VucmVnaXN0ZXJlZCBtb2RhbCBpZCAnICsgaWQpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RhbFNjb3BlLmlzT3BlbiA9IHRydWU7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBDbG9zZSBhIG1vZGFsXHJcbiAgICAgIGNsb3NlOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHZhciBtb2RhbFNjb3BlID0gbW9kYWxzQ2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICBpZiAoIW1vZGFsU2NvcGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VucmVnaXN0ZXJlZCBtb2RhbCBpZCAnICsgaWQpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RhbFNjb3BlLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIG1vZGFsc0NhY2hlLnJlbW92ZUFsbCgpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgY291bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBtb2RhbHNDYWNoZS5pbmZvKCkuc2l6ZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9KTtcclxuIl19
