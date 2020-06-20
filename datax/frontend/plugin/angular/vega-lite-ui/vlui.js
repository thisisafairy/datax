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
window.     vlSchema = {
  "oneOf": [
    {
      "$ref": "#/definitions/ExtendedUnitSpec",
      "description": "Schema for a unit Vega-Lite specification, with the syntactic sugar extensions:\n\n- `row` and `column` are included in the encoding.\n\n- (Future) label, box plot\n\n\n\nNote: the spec could contain facet."
    },
    {
      "$ref": "#/definitions/FacetSpec"
    },
    {
      "$ref": "#/definitions/LayerSpec"
    }
  ],
  "definitions": {
    "ExtendedUnitSpec": {
      "type": "object",
      "properties": {
        "mark": {
          "$ref": "#/definitions/Mark",
          "description": "The mark type.\n\nOne of `\"bar\"`, `\"circle\"`, `\"square\"`, `\"tick\"`, `\"line\"`,\n\n`\"area\"`, `\"point\"`, `\"rule\"`, and `\"text\"`."
        },
        "encoding": {
          "$ref": "#/definitions/Encoding",
          "description": "A key-value mapping between encoding channels and definition of fields."
        },
        "name": {
          "description": "Name of the visualization for later reference.",
          "type": "string"
        },
        "description": {
          "description": "An optional description of this mark for commenting purpose.\n\nThis property has no effect on the output visualization.",
          "type": "string"
        },
        "data": {
          "$ref": "#/definitions/Data",
          "description": "An object describing the data source"
        },
        "transform": {
          "$ref": "#/definitions/Transform",
          "description": "An object describing filter and new field calculation."
        },
        "config": {
          "$ref": "#/definitions/Config",
          "description": "Configuration object"
        }
      },
      "required": [
        "mark"
      ]
    },
    "Mark": {
      "type": "string",
      "enum": [
        "area",
        "bar",
        "line",
        "point",
        "text",
        "tick",
        "rule",
        "circle",
        "square",
        "errorBar"
      ]
    },
    "Encoding": {
      "type": "object",
      "properties": {
        "row": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "Vertical facets for trellis plots."
        },
        "column": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "Horizontal facets for trellis plots."
        },
        "x": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "X coordinates for `point`, `circle`, `square`,\n\n`line`, `rule`, `text`, and `tick`\n\n(or to width and height for `bar` and `area` marks)."
        },
        "y": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "Y coordinates for `point`, `circle`, `square`,\n\n`line`, `rule`, `text`, and `tick`\n\n(or to width and height for `bar` and `area` marks)."
        },
        "x2": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "X2 coordinates for ranged `bar`, `rule`, `area`"
        },
        "y2": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "Y2 coordinates for ranged `bar`, `rule`, `area`"
        },
        "color": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "Color of the marks – either fill or stroke color based on mark type.\n\n(By default, fill color for `area`, `bar`, `tick`, `text`, `circle`, and `square` /\n\nstroke color for `line` and `point`.)"
        },
        "opacity": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "Opacity of the marks – either can be a value or in a range."
        },
        "size": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "Size of the mark.\n\n- For `point`, `square` and `circle`\n\n– the symbol size, or pixel area of the mark.\n\n- For `bar` and `tick` – the bar and tick's size.\n\n- For `text` – the text's font size.\n\n- Size is currently unsupported for `line` and `area`."
        },
        "shape": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "The symbol's shape (only for `point` marks). The supported values are\n\n`\"circle\"` (default), `\"square\"`, `\"cross\"`, `\"diamond\"`, `\"triangle-up\"`,\n\nor `\"triangle-down\"`, or else a custom SVG path string."
        },
        "detail": {
          "description": "Additional levels of detail for grouping data in aggregate views and\n\nin line and area marks without mapping data to a specific visual channel.",
          "oneOf": [
            {
              "$ref": "#/definitions/FieldDef",
              "description": "Interface for any kind of FieldDef;\n\nFor simplicity, we do not declare multiple interfaces of FieldDef like\n\nwe do for JSON schema."
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/definitions/FieldDef",
                "description": "Interface for any kind of FieldDef;\n\nFor simplicity, we do not declare multiple interfaces of FieldDef like\n\nwe do for JSON schema."
              }
            }
          ]
        },
        "text": {
          "$ref": "#/definitions/FieldDef",
          "description": "Text of the `text` mark."
        },
        "label": {
          "$ref": "#/definitions/FieldDef"
        },
        "path": {
          "description": "Order of data points in line marks.",
          "oneOf": [
            {
              "$ref": "#/definitions/OrderChannelDef"
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/definitions/OrderChannelDef"
              }
            }
          ]
        },
        "order": {
          "description": "Layer order for non-stacked marks, or stack order for stacked marks.",
          "oneOf": [
            {
              "$ref": "#/definitions/OrderChannelDef"
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/definitions/OrderChannelDef"
              }
            }
          ]
        }
      }
    },
    "PositionChannelDef": {
      "type": "object",
      "properties": {
        "axis": {
          "oneOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/Axis"
            }
          ]
        },
        "scale": {
          "$ref": "#/definitions/Scale"
        },
        "sort": {
          "oneOf": [
            {
              "$ref": "#/definitions/SortField"
            },
            {
              "$ref": "#/definitions/SortOrder"
            }
          ]
        },
        "field": {
          "description": "Name of the field from which to pull a data value.",
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/Type",
          "description": "The encoded field's type of measurement. This can be either a full type\n\nname (`\"quantitative\"`, `\"temporal\"`, `\"ordinal\"`,  and `\"nominal\"`)\n\nor an initial character of the type name (`\"Q\"`, `\"T\"`, `\"O\"`, `\"N\"`).\n\nThis property is case insensitive."
        },
        "value": {
          "description": "A constant value in visual domain.",
          "oneOf": [
            {
              "type": "number"
            },
            {
              "type": "string"
            },
            {
              "type": "boolean"
            }
          ]
        },
        "timeUnit": {
          "$ref": "#/definitions/TimeUnit",
          "description": "Time unit for a `temporal` field  (e.g., `year`, `yearmonth`, `month`, `hour`)."
        },
        "bin": {
          "description": "Flag for binning a `quantitative` field, or a bin property object\n\nfor binning parameters.",
          "oneOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/Bin",
              "description": "Binning properties or boolean flag for determining whether to bin data or not."
            }
          ]
        },
        "aggregate": {
          "$ref": "#/definitions/AggregateOp",
          "description": "Aggregation function for the field\n\n(e.g., `mean`, `sum`, `median`, `min`, `max`, `count`)."
        },
        "title": {
          "description": "Title for axis or legend.",
          "type": "string"
        }
      }
    },
    "Axis": {
      "type": "object",
      "properties": {
        "labelAngle": {
          "description": "The rotation angle of the axis labels.",
          "type": "number"
        },
        "format": {
          "description": "The formatting pattern for axis labels.",
          "type": "string"
        },
        "orient": {
          "$ref": "#/definitions/AxisOrient",
          "description": "The orientation of the axis. One of top, bottom, left or right. The orientation can be used to further specialize the axis type (e.g., a y axis oriented for the right edge of the chart)."
        },
        "title": {
          "description": "A title for the axis. Shows field name and its function by default.",
          "type": "string"
        },
        "values": {
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "axisWidth": {
          "description": "Width of the axis line",
          "type": "number"
        },
        "layer": {
          "description": "A string indicating if the axis (and any gridlines) should be placed above or below the data marks.",
          "type": "string"
        },
        "offset": {
          "description": "The offset, in pixels, by which to displace the axis from the edge of the enclosing group or data rectangle.",
          "type": "number"
        },
        "axisColor": {
          "description": "Color of axis line.",
          "type": "string"
        },
        "grid": {
          "description": "A flag indicate if gridlines should be created in addition to ticks. If `grid` is unspecified, the default value is `true` for ROW and COL. For X and Y, the default value is `true` for quantitative and time fields and `false` otherwise.",
          "type": "boolean"
        },
        "gridColor": {
          "description": "Color of gridlines.",
          "type": "string"
        },
        "gridDash": {
          "description": "The offset (in pixels) into which to begin drawing with the grid dash array.",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "gridOpacity": {
          "description": "The stroke opacity of grid (value between [0,1])",
          "type": "number"
        },
        "gridWidth": {
          "description": "The grid width, in pixels.",
          "type": "number"
        },
        "labels": {
          "description": "Enable or disable labels.",
          "type": "boolean"
        },
        "labelAlign": {
          "description": "Text alignment for the Label.",
          "type": "string"
        },
        "labelBaseline": {
          "description": "Text baseline for the label.",
          "type": "string"
        },
        "labelMaxLength": {
          "description": "Truncate labels that are too long.",
          "minimum": 1,
          "type": "number"
        },
        "shortTimeLabels": {
          "description": "Whether month and day names should be abbreviated.",
          "type": "boolean"
        },
        "subdivide": {
          "description": "If provided, sets the number of minor ticks between major ticks (the value 9 results in decimal subdivision). Only applicable for axes visualizing quantitative scales.",
          "type": "number"
        },
        "ticks": {
          "description": "A desired number of ticks, for axes visualizing quantitative scales. The resulting number may be different so that values are \"nice\" (multiples of 2, 5, 10) and lie within the underlying scale's range.",
          "minimum": 0,
          "type": "number"
        },
        "tickColor": {
          "description": "The color of the axis's tick.",
          "type": "string"
        },
        "tickLabelColor": {
          "description": "The color of the tick label, can be in hex color code or regular color name.",
          "type": "string"
        },
        "tickLabelFont": {
          "description": "The font of the tick label.",
          "type": "string"
        },
        "tickLabelFontSize": {
          "description": "The font size of label, in pixels.",
          "type": "number"
        },
        "tickPadding": {
          "description": "The padding, in pixels, between ticks and text labels.",
          "type": "number"
        },
        "tickSize": {
          "description": "The size, in pixels, of major, minor and end ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickSizeMajor": {
          "description": "The size, in pixels, of major ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickSizeMinor": {
          "description": "The size, in pixels, of minor ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickSizeEnd": {
          "description": "The size, in pixels, of end ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickWidth": {
          "description": "The width, in pixels, of ticks.",
          "type": "number"
        },
        "titleColor": {
          "description": "Color of the title, can be in hex color code or regular color name.",
          "type": "string"
        },
        "titleFont": {
          "description": "Font of the title.",
          "type": "string"
        },
        "titleFontSize": {
          "description": "Size of the title.",
          "type": "number"
        },
        "titleFontWeight": {
          "description": "Weight of the title.",
          "type": "string"
        },
        "titleOffset": {
          "description": "A title offset value for the axis.",
          "type": "number"
        },
        "titleMaxLength": {
          "description": "Max length for axis title if the title is automatically generated from the field's description. By default, this is automatically based on cell size and characterWidth property.",
          "minimum": 0,
          "type": "number"
        },
        "characterWidth": {
          "description": "Character width for automatically determining title max length.",
          "type": "number"
        },
        "properties": {
          "description": "Optional mark property definitions for custom axis styling."
        }
      }
    },
    "AxisOrient": {
      "type": "string",
      "enum": [
        "top",
        "right",
        "left",
        "bottom"
      ]
    },
    "Scale": {
      "type": "object",
      "properties": {
        "type": {
          "$ref": "#/definitions/ScaleType"
        },
        "domain": {
          "description": "The domain of the scale, representing the set of data values. For quantitative data, this can take the form of a two-element array with minimum and maximum values. For ordinal/categorical data, this may be an array of valid input values.",
          "oneOf": [
            {
              "type": "array",
              "items": {
                "type": "number"
              }
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "range": {
          "description": "The range of the scale, representing the set of visual values. For numeric values, the range can take the form of a two-element array with minimum and maximum values. For ordinal or quantized data, the range may by an array of desired output values, which are mapped to elements in the specified domain. For ordinal scales only, the range can be defined using a DataRef: the range values are then drawn dynamically from a backing data set.",
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "number"
              }
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "round": {
          "description": "If true, rounds numeric output values to integers. This can be helpful for snapping to the pixel grid.",
          "type": "boolean"
        },
        "bandSize": {
          "minimum": 0,
          "type": "number"
        },
        "padding": {
          "description": "Applies spacing among ordinal elements in the scale range. The actual effect depends on how the scale is configured. If the __points__ parameter is `true`, the padding value is interpreted as a multiple of the spacing between points. A reasonable value is 1.0, such that the first and last point will be offset from the minimum and maximum value by half the distance between points. Otherwise, padding is typically in the range [0, 1] and corresponds to the fraction of space in the range interval to allocate to padding. A value of 0.5 means that the range band width will be equal to the padding width. For more, see the [D3 ordinal scale documentation](https://github.com/mbostock/d3/wiki/Ordinal-Scales).",
          "type": "number"
        },
        "clamp": {
          "description": "If true, values that exceed the data domain are clamped to either the minimum or maximum range value",
          "type": "boolean"
        },
        "nice": {
          "description": "If specified, modifies the scale domain to use a more human-friendly value range. If specified as a true boolean, modifies the scale domain to use a more human-friendly number range (e.g., 7 instead of 6.96). If specified as a string, modifies the scale domain to use a more human-friendly value range. For time and utc scale types only, the nice value should be a string indicating the desired time interval.",
          "oneOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/NiceTime"
            }
          ]
        },
        "exponent": {
          "description": "Sets the exponent of the scale transformation. For pow scale types only, otherwise ignored.",
          "type": "number"
        },
        "zero": {
          "description": "If `true`, ensures that a zero baseline value is included in the scale domain.\n\nDefault value: `true` for `x` and `y` channel if the quantitative field is not binned\n\nand no custom `domain` is provided; `false` otherwise.",
          "type": "boolean"
        },
        "useRawDomain": {
          "description": "Uses the source data range as scale domain instead of aggregated data for aggregate axis.\n\nThis property only works with aggregate functions that produce values within the raw data domain (`\"mean\"`, `\"average\"`, `\"stdev\"`, `\"stdevp\"`, `\"median\"`, `\"q1\"`, `\"q3\"`, `\"min\"`, `\"max\"`). For other aggregations that produce values outside of the raw data domain (e.g. `\"count\"`, `\"sum\"`), this property is ignored.",
          "type": "boolean"
        }
      }
    },
    "ScaleType": {
      "type": "string",
      "enum": [
        "linear",
        "log",
        "pow",
        "sqrt",
        "quantile",
        "quantize",
        "ordinal",
        "time",
        "utc"
      ]
    },
    "NiceTime": {
      "type": "string",
      "enum": [
        "second",
        "minute",
        "hour",
        "day",
        "week",
        "month",
        "year"
      ]
    },
    "SortField": {
      "type": "object",
      "properties": {
        "field": {
          "description": "The field name to aggregate over.",
          "type": "string"
        },
        "op": {
          "$ref": "#/definitions/AggregateOp",
          "description": "The sort aggregation operator"
        },
        "order": {
          "$ref": "#/definitions/SortOrder"
        }
      },
      "required": [
        "field",
        "op"
      ]
    },
    "AggregateOp": {
      "type": "string",
      "enum": [
        "values",
        "count",
        "valid",
        "missing",
        "distinct",
        "sum",
        "mean",
        "average",
        "variance",
        "variancep",
        "stdev",
        "stdevp",
        "median",
        "q1",
        "q3",
        "modeskew",
        "min",
        "max",
        "argmin",
        "argmax"
      ]
    },
    "SortOrder": {
      "type": "string",
      "enum": [
        "ascending",
        "descending",
        "none"
      ]
    },
    "Type": {
      "type": "string",
      "enum": [
        "quantitative",
        "ordinal",
        "temporal",
        "nominal"
      ]
    },
    "TimeUnit": {
      "type": "string",
      "enum": [
        "year",
        "month",
        "day",
        "date",
        "hours",
        "minutes",
        "seconds",
        "milliseconds",
        "yearmonth",
        "yearmonthdate",
        "yearmonthdatehours",
        "yearmonthdatehoursminutes",
        "yearmonthdatehoursminutesseconds",
        "hoursminutes",
        "hoursminutesseconds",
        "minutesseconds",
        "secondsmilliseconds",
        "quarter",
        "yearquarter",
        "quartermonth",
        "yearquartermonth"
      ]
    },
    "Bin": {
      "type": "object",
      "properties": {
        "min": {
          "description": "The minimum bin value to consider. If unspecified, the minimum value of the specified field is used.",
          "type": "number"
        },
        "max": {
          "description": "The maximum bin value to consider. If unspecified, the maximum value of the specified field is used.",
          "type": "number"
        },
        "base": {
          "description": "The number base to use for automatic bin determination (default is base 10).",
          "type": "number"
        },
        "step": {
          "description": "An exact step size to use between bins. If provided, options such as maxbins will be ignored.",
          "type": "number"
        },
        "steps": {
          "description": "An array of allowable step sizes to choose from.",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "minstep": {
          "description": "A minimum allowable step size (particularly useful for integer values).",
          "type": "number"
        },
        "div": {
          "description": "Scale factors indicating allowable subdivisions. The default value is [5, 2], which indicates that for base 10 numbers (the default base), the method may consider dividing bin sizes by 5 and/or 2. For example, for an initial step size of 10, the method can check if bin sizes of 2 (= 10/5), 5 (= 10/2), or 1 (= 10/(5*2)) might also satisfy the given constraints.",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "maxbins": {
          "description": "Maximum number of bins.",
          "minimum": 2,
          "type": "number"
        }
      }
    },
    "ChannelDefWithLegend": {
      "type": "object",
      "properties": {
        "legend": {
          "$ref": "#/definitions/Legend"
        },
        "scale": {
          "$ref": "#/definitions/Scale"
        },
        "sort": {
          "oneOf": [
            {
              "$ref": "#/definitions/SortField"
            },
            {
              "$ref": "#/definitions/SortOrder"
            }
          ]
        },
        "field": {
          "description": "Name of the field from which to pull a data value.",
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/Type",
          "description": "The encoded field's type of measurement. This can be either a full type\n\nname (`\"quantitative\"`, `\"temporal\"`, `\"ordinal\"`,  and `\"nominal\"`)\n\nor an initial character of the type name (`\"Q\"`, `\"T\"`, `\"O\"`, `\"N\"`).\n\nThis property is case insensitive."
        },
        "value": {
          "description": "A constant value in visual domain.",
          "oneOf": [
            {
              "type": "number"
            },
            {
              "type": "string"
            },
            {
              "type": "boolean"
            }
          ]
        },
        "timeUnit": {
          "$ref": "#/definitions/TimeUnit",
          "description": "Time unit for a `temporal` field  (e.g., `year`, `yearmonth`, `month`, `hour`)."
        },
        "bin": {
          "description": "Flag for binning a `quantitative` field, or a bin property object\n\nfor binning parameters.",
          "oneOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/Bin",
              "description": "Binning properties or boolean flag for determining whether to bin data or not."
            }
          ]
        },
        "aggregate": {
          "$ref": "#/definitions/AggregateOp",
          "description": "Aggregation function for the field\n\n(e.g., `mean`, `sum`, `median`, `min`, `max`, `count`)."
        },
        "title": {
          "description": "Title for axis or legend.",
          "type": "string"
        }
      }
    },
    "Legend": {
      "type": "object",
      "properties": {
        "format": {
          "description": "An optional formatting pattern for legend labels. Vega uses D3\\'s format pattern.",
          "type": "string"
        },
        "title": {
          "description": "A title for the legend. (Shows field name and its function by default.)",
          "type": "string"
        },
        "values": {
          "description": "Explicitly set the visible legend values.",
          "type": "array",
          "items": {}
        },
        "orient": {
          "description": "The orientation of the legend. One of \"left\" or \"right\". This determines how the legend is positioned within the scene. The default is \"right\".",
          "type": "string"
        },
        "offset": {
          "description": "The offset, in pixels, by which to displace the legend from the edge of the enclosing group or data rectangle.",
          "type": "number"
        },
        "padding": {
          "description": "The padding, in pixels, between the lengend and axis.",
          "type": "number"
        },
        "margin": {
          "description": "The margin around the legend, in pixels",
          "type": "number"
        },
        "gradientStrokeColor": {
          "description": "The color of the gradient stroke, can be in hex color code or regular color name.",
          "type": "string"
        },
        "gradientStrokeWidth": {
          "description": "The width of the gradient stroke, in pixels.",
          "type": "number"
        },
        "gradientHeight": {
          "description": "The height of the gradient, in pixels.",
          "type": "number"
        },
        "gradientWidth": {
          "description": "The width of the gradient, in pixels.",
          "type": "number"
        },
        "labelAlign": {
          "description": "The alignment of the legend label, can be left, middle or right.",
          "type": "string"
        },
        "labelBaseline": {
          "description": "The position of the baseline of legend label, can be top, middle or bottom.",
          "type": "string"
        },
        "labelColor": {
          "description": "The color of the legend label, can be in hex color code or regular color name.",
          "type": "string"
        },
        "labelFont": {
          "description": "The font of the lengend label.",
          "type": "string"
        },
        "labelFontSize": {
          "description": "The font size of lengend lable.",
          "type": "number"
        },
        "labelOffset": {
          "description": "The offset of the legend label.",
          "type": "number"
        },
        "shortTimeLabels": {
          "description": "Whether month names and weekday names should be abbreviated.",
          "type": "boolean"
        },
        "symbolColor": {
          "description": "The color of the legend symbol,",
          "type": "string"
        },
        "symbolShape": {
          "description": "The shape of the legend symbol, can be the 'circle', 'square', 'cross', 'diamond',\n\n'triangle-up', 'triangle-down', or else a custom SVG path string.",
          "type": "string"
        },
        "symbolSize": {
          "description": "The size of the lengend symbol, in pixels.",
          "type": "number"
        },
        "symbolStrokeWidth": {
          "description": "The width of the symbol's stroke.",
          "type": "number"
        },
        "titleColor": {
          "description": "Optional mark property definitions for custom legend styling.\n\nThe color of the legend title, can be in hex color code or regular color name.",
          "type": "string"
        },
        "titleFont": {
          "description": "The font of the legend title.",
          "type": "string"
        },
        "titleFontSize": {
          "description": "The font size of the legend title.",
          "type": "number"
        },
        "titleFontWeight": {
          "description": "The font weight of the legend title.",
          "type": "string"
        },
        "properties": {
          "description": "Optional mark property definitions for custom legend styling."
        }
      }
    },
    "FieldDef": {
      "type": "object",
      "properties": {
        "field": {
          "description": "Name of the field from which to pull a data value.",
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/Type",
          "description": "The encoded field's type of measurement. This can be either a full type\n\nname (`\"quantitative\"`, `\"temporal\"`, `\"ordinal\"`,  and `\"nominal\"`)\n\nor an initial character of the type name (`\"Q\"`, `\"T\"`, `\"O\"`, `\"N\"`).\n\nThis property is case insensitive."
        },
        "value": {
          "description": "A constant value in visual domain.",
          "oneOf": [
            {
              "type": "number"
            },
            {
              "type": "string"
            },
            {
              "type": "boolean"
            }
          ]
        },
        "timeUnit": {
          "$ref": "#/definitions/TimeUnit",
          "description": "Time unit for a `temporal` field  (e.g., `year`, `yearmonth`, `month`, `hour`)."
        },
        "bin": {
          "description": "Flag for binning a `quantitative` field, or a bin property object\n\nfor binning parameters.",
          "oneOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/Bin",
              "description": "Binning properties or boolean flag for determining whether to bin data or not."
            }
          ]
        },
        "aggregate": {
          "$ref": "#/definitions/AggregateOp",
          "description": "Aggregation function for the field\n\n(e.g., `mean`, `sum`, `median`, `min`, `max`, `count`)."
        },
        "title": {
          "description": "Title for axis or legend.",
          "type": "string"
        }
      }
    },
    "OrderChannelDef": {
      "type": "object",
      "properties": {
        "sort": {
          "$ref": "#/definitions/SortOrder"
        },
        "field": {
          "description": "Name of the field from which to pull a data value.",
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/Type",
          "description": "The encoded field's type of measurement. This can be either a full type\n\nname (`\"quantitative\"`, `\"temporal\"`, `\"ordinal\"`,  and `\"nominal\"`)\n\nor an initial character of the type name (`\"Q\"`, `\"T\"`, `\"O\"`, `\"N\"`).\n\nThis property is case insensitive."
        },
        "value": {
          "description": "A constant value in visual domain.",
          "oneOf": [
            {
              "type": "number"
            },
            {
              "type": "string"
            },
            {
              "type": "boolean"
            }
          ]
        },
        "timeUnit": {
          "$ref": "#/definitions/TimeUnit",
          "description": "Time unit for a `temporal` field  (e.g., `year`, `yearmonth`, `month`, `hour`)."
        },
        "bin": {
          "description": "Flag for binning a `quantitative` field, or a bin property object\n\nfor binning parameters.",
          "oneOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/Bin",
              "description": "Binning properties or boolean flag for determining whether to bin data or not."
            }
          ]
        },
        "aggregate": {
          "$ref": "#/definitions/AggregateOp",
          "description": "Aggregation function for the field\n\n(e.g., `mean`, `sum`, `median`, `min`, `max`, `count`)."
        },
        "title": {
          "description": "Title for axis or legend.",
          "type": "string"
        }
      }
    },
    "Data": {
      "type": "object",
      "properties": {
        "format": {
          "$ref": "#/definitions/DataFormat",
          "description": "An object that specifies the format for the data file or values."
        },
        "url": {
          "description": "A URL from which to load the data set. Use the format.type property\n\nto ensure the loaded data is correctly parsed.",
          "type": "string"
        },
        "values": {
          "description": "Pass array of objects instead of a url to a file.",
          "type": "array",
          "items": {}
        }
      }
    },
    "DataFormat": {
      "type": "object",
      "properties": {
        "type": {
          "$ref": "#/definitions/DataFormatType",
          "description": "Type of input data: `\"json\"`, `\"csv\"`, `\"tsv\"`.\n\nThe default format type is determined by the extension of the file url.\n\nIf no extension is detected, `\"json\"` will be used by default."
        },
        "property": {
          "description": "JSON only) The JSON property containing the desired data.\n\nThis parameter can be used when the loaded JSON file may have surrounding structure or meta-data.\n\nFor example `\"property\": \"values.features\"` is equivalent to retrieving `json.values.features`\n\nfrom the loaded JSON object.",
          "type": "string"
        },
        "feature": {
          "description": "The name of the TopoJSON object set to convert to a GeoJSON feature collection.\n\nFor example, in a map of the world, there may be an object set named `\"countries\"`.\n\nUsing the feature property, we can extract this set and generate a GeoJSON feature object for each country.",
          "type": "string"
        },
        "mesh": {
          "description": "The name of the TopoJSON object set to convert to a mesh.\n\nSimilar to the `feature` option, `mesh` extracts a named TopoJSON object set.\n\nUnlike the `feature` option, the corresponding geo data is returned as a single, unified mesh instance, not as inidividual GeoJSON features.\n\nExtracting a mesh is useful for more efficiently drawing borders or other geographic elements that you do not need to associate with specific regions such as individual countries, states or counties.",
          "type": "string"
        }
      }
    },
    "DataFormatType": {
      "type": "string",
      "enum": [
        "json",
        "csv",
        "tsv",
        "topojson"
      ]
    },
    "Transform": {
      "type": "object",
      "properties": {
        "filter": {
          "description": "A string containing the filter Vega expression. Use `datum` to refer to the current data object.",
          "oneOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/EqualFilter"
            },
            {
              "$ref": "#/definitions/RangeFilter"
            },
            {
              "$ref": "#/definitions/InFilter"
            },
            {
              "type": "array",
              "items": {
                "oneOf": [
                  {
                    "type": "string"
                  },
                  {
                    "$ref": "#/definitions/EqualFilter"
                  },
                  {
                    "$ref": "#/definitions/RangeFilter"
                  },
                  {
                    "$ref": "#/definitions/InFilter"
                  }
                ]
              }
            }
          ]
        },
        "filterInvalid": {
          "description": "Whether to filter invalid values (`null` and `NaN`) from the data. By default (`undefined`), only quantitative and temporal fields are filtered. If set to `true`, all data items with null values are filtered. If `false`, all data items are included.",
          "type": "boolean"
        },
        "calculate": {
          "description": "Calculate new field(s) using the provided expresssion(s). Calculation are applied before filter.",
          "type": "array",
          "items": {
            "$ref": "#/definitions/Formula",
            "description": "Formula object for calculate."
          }
        }
      }
    },
    "EqualFilter": {
      "type": "object",
      "properties": {
        "timeUnit": {
          "$ref": "#/definitions/TimeUnit",
          "description": "Time unit for the field to be filtered."
        },
        "field": {
          "description": "Field to be filtered.",
          "type": "string"
        },
        "equal": {
          "description": "Value that the field should be equal to.",
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "number"
            },
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/DateTime",
              "description": "Object for defining datetime in Vega-Lite Filter.\n\nIf both month and quarter are provided, month has higher precedence.\n\n`day` cannot be combined with other date.\n\nWe accept string for month and day names."
            }
          ]
        }
      },
      "required": [
        "field",
        "equal"
      ]
    },
    "DateTime": {
      "type": "object",
      "properties": {
        "year": {
          "description": "Integer value representing the year.",
          "type": "number"
        },
        "quarter": {
          "description": "Integer value representing the quarter of the year (from 1-4).",
          "type": "number"
        },
        "month": {
          "description": "One of: (1) integer value representing the month from `1`-`12`. `1` represents January;  (2) case-insensitive month name (e.g., `\"January\"`);  (3) case-insensitive, 3-character short month name (e.g., `\"Jan\"`).",
          "oneOf": [
            {
              "type": "number"
            },
            {
              "type": "string"
            }
          ]
        },
        "date": {
          "description": "Integer value representing the date from 1-31.",
          "type": "number"
        },
        "day": {
          "description": "Value representing the day of week.  This can be one of: (1) integer value -- `1` represents Monday; (2) case-insensitive day name (e.g., `\"Monday\"`);  (3) case-insensitive, 3-character short day name (e.g., `\"Mon\"`).   <br/> **Warning:** A DateTime definition object with `day`** should not be combined with `year`, `quarter`, `month`, or `date`.",
          "oneOf": [
            {
              "type": "number"
            },
            {
              "type": "string"
            }
          ]
        },
        "hours": {
          "description": "Integer value representing the hour of day from 0-23.",
          "type": "number"
        },
        "minutes": {
          "description": "Integer value representing minute segment of a time from 0-59.",
          "type": "number"
        },
        "seconds": {
          "description": "Integer value representing second segment of a time from 0-59.",
          "type": "number"
        },
        "milliseconds": {
          "description": "Integer value representing millisecond segment of a time.",
          "type": "number"
        }
      }
    },
    "RangeFilter": {
      "type": "object",
      "properties": {
        "timeUnit": {
          "$ref": "#/definitions/TimeUnit",
          "description": "time unit for the field to be filtered."
        },
        "field": {
          "description": "Field to be filtered",
          "type": "string"
        },
        "range": {
          "description": "Array of inclusive minimum and maximum values\n\nfor a field value of a data item to be included in the filtered data.",
          "maxItems": 2,
          "minItems": 2,
          "type": "array",
          "items": {
            "oneOf": [
              {
                "type": "number"
              },
              {
                "$ref": "#/definitions/DateTime",
                "description": "Object for defining datetime in Vega-Lite Filter.\n\nIf both month and quarter are provided, month has higher precedence.\n\n`day` cannot be combined with other date.\n\nWe accept string for month and day names."
              }
            ]
          }
        }
      },
      "required": [
        "field",
        "range"
      ]
    },
    "InFilter": {
      "type": "object",
      "properties": {
        "timeUnit": {
          "$ref": "#/definitions/TimeUnit",
          "description": "time unit for the field to be filtered."
        },
        "field": {
          "description": "Field to be filtered",
          "type": "string"
        },
        "in": {
          "description": "A set of values that the `field`'s value should be a member of,\n\nfor a data item included in the filtered data.",
          "type": "array",
          "items": {
            "oneOf": [
              {
                "type": "string"
              },
              {
                "type": "number"
              },
              {
                "type": "boolean"
              },
              {
                "$ref": "#/definitions/DateTime",
                "description": "Object for defining datetime in Vega-Lite Filter.\n\nIf both month and quarter are provided, month has higher precedence.\n\n`day` cannot be combined with other date.\n\nWe accept string for month and day names."
              }
            ]
          }
        }
      },
      "required": [
        "field",
        "in"
      ]
    },
    "Formula": {
      "type": "object",
      "properties": {
        "field": {
          "description": "The field in which to store the computed formula value.",
          "type": "string"
        },
        "expr": {
          "description": "A string containing an expression for the formula. Use the variable `datum` to to refer to the current data object.",
          "type": "string"
        }
      },
      "required": [
        "field",
        "expr"
      ]
    },
    "Config": {
      "type": "object",
      "properties": {
        "viewport": {
          "description": "The width and height of the on-screen viewport, in pixels. If necessary, clipping and scrolling will be applied.",
          "type": "number"
        },
        "background": {
          "description": "CSS color property to use as background of visualization. Default is `\"transparent\"`.",
          "type": "string"
        },
        "numberFormat": {
          "description": "D3 Number format for axis labels and text tables. For example \"s\" for SI units.",
          "type": "string"
        },
        "timeFormat": {
          "description": "Default datetime format for axis and legend labels. The format can be set directly on each axis and legend.",
          "type": "string"
        },
        "countTitle": {
          "description": "Default axis and legend title for count fields.",
          "type": "string"
        },
        "cell": {
          "$ref": "#/definitions/CellConfig",
          "description": "Cell Config"
        },
        "mark": {
          "$ref": "#/definitions/MarkConfig",
          "description": "Mark Config"
        },
        "overlay": {
          "$ref": "#/definitions/OverlayConfig",
          "description": "Mark Overlay Config"
        },
        "scale": {
          "$ref": "#/definitions/ScaleConfig",
          "description": "Scale Config"
        },
        "axis": {
          "$ref": "#/definitions/AxisConfig",
          "description": "Axis Config"
        },
        "legend": {
          "$ref": "#/definitions/LegendConfig",
          "description": "Legend Config"
        },
        "facet": {
          "$ref": "#/definitions/FacetConfig",
          "description": "Facet Config"
        }
      }
    },
    "CellConfig": {
      "type": "object",
      "properties": {
        "width": {
          "type": "number"
        },
        "height": {
          "type": "number"
        },
        "clip": {
          "type": "boolean"
        },
        "fill": {
          "description": "The fill color.",
          "format": "color",
          "type": "string"
        },
        "fillOpacity": {
          "description": "The fill opacity (value between [0,1]).",
          "type": "number"
        },
        "stroke": {
          "description": "The stroke color.",
          "type": "string"
        },
        "strokeOpacity": {
          "description": "The stroke opacity (value between [0,1]).",
          "type": "number"
        },
        "strokeWidth": {
          "description": "The stroke width, in pixels.",
          "type": "number"
        },
        "strokeDash": {
          "description": "An array of alternating stroke, space lengths for creating dashed or dotted lines.",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "strokeDashOffset": {
          "description": "The offset (in pixels) into which to begin drawing with the stroke dash array.",
          "type": "number"
        }
      }
    },
    "MarkConfig": {
      "type": "object",
      "properties": {
        "filled": {
          "description": "Whether the shape\\'s color should be used as fill color instead of stroke color.\n\nThis is only applicable for \"bar\", \"point\", and \"area\".\n\nAll marks except \"point\" marks are filled by default.\n\nSee Mark Documentation (http://vega.github.io/vega-lite/docs/marks.html)\n\nfor usage example.",
          "type": "boolean"
        },
        "color": {
          "description": "Default color.",
          "format": "color",
          "type": "string"
        },
        "fill": {
          "description": "Default Fill Color.  This has higher precedence than config.color",
          "format": "color",
          "type": "string"
        },
        "stroke": {
          "description": "Default Stroke Color.  This has higher precedence than config.color",
          "format": "color",
          "type": "string"
        },
        "opacity": {
          "minimum": 0,
          "maximum": 1,
          "type": "number"
        },
        "fillOpacity": {
          "minimum": 0,
          "maximum": 1,
          "type": "number"
        },
        "strokeOpacity": {
          "minimum": 0,
          "maximum": 1,
          "type": "number"
        },
        "strokeWidth": {
          "minimum": 0,
          "type": "number"
        },
        "strokeDash": {
          "description": "An array of alternating stroke, space lengths for creating dashed or dotted lines.",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "strokeDashOffset": {
          "description": "The offset (in pixels) into which to begin drawing with the stroke dash array.",
          "type": "number"
        },
        "stacked": {
          "$ref": "#/definitions/StackOffset"
        },
        "orient": {
          "$ref": "#/definitions/Orient",
          "description": "The orientation of a non-stacked bar, tick, area, and line charts.\n\nThe value is either horizontal (default) or vertical.\n\n- For bar, rule and tick, this determines whether the size of the bar and tick\n\nshould be applied to x or y dimension.\n\n- For area, this property determines the orient property of the Vega output.\n\n- For line, this property determines the sort order of the points in the line\n\nif `config.sortLineBy` is not specified.\n\nFor stacked charts, this is always determined by the orientation of the stack;\n\ntherefore explicitly specified value will be ignored."
        },
        "interpolate": {
          "$ref": "#/definitions/Interpolate",
          "description": "The line interpolation method to use. One of linear, step-before, step-after, basis, basis-open, cardinal, cardinal-open, monotone."
        },
        "tension": {
          "description": "Depending on the interpolation type, sets the tension parameter.",
          "type": "number"
        },
        "lineSize": {
          "description": "Size of line mark.",
          "type": "number"
        },
        "ruleSize": {
          "description": "Size of rule mark.",
          "type": "number"
        },
        "barSize": {
          "description": "The size of the bars.  If unspecified, the default size is  `bandSize-1`,\n\nwhich provides 1 pixel offset between bars.",
          "type": "number"
        },
        "barThinSize": {
          "description": "The size of the bars on continuous scales.",
          "type": "number"
        },
        "shape": {
          "description": "The symbol shape to use. One of circle (default), square, cross, diamond, triangle-up, or triangle-down, or a custom SVG path.",
          "oneOf": [
            {
              "$ref": "#/definitions/Shape"
            },
            {
              "type": "string"
            }
          ]
        },
        "size": {
          "description": "The pixel area each the point. For example: in the case of circles, the radius is determined in part by the square root of the size value.",
          "type": "number"
        },
        "tickSize": {
          "description": "The width of the ticks.",
          "type": "number"
        },
        "tickThickness": {
          "description": "Thickness of the tick mark.",
          "type": "number"
        },
        "align": {
          "$ref": "#/definitions/HorizontalAlign",
          "description": "The horizontal alignment of the text. One of left, right, center."
        },
        "angle": {
          "description": "The rotation angle of the text, in degrees.",
          "type": "number"
        },
        "baseline": {
          "$ref": "#/definitions/VerticalAlign",
          "description": "The vertical alignment of the text. One of top, middle, bottom."
        },
        "dx": {
          "description": "The horizontal offset, in pixels, between the text label and its anchor point. The offset is applied after rotation by the angle property.",
          "type": "number"
        },
        "dy": {
          "description": "The vertical offset, in pixels, between the text label and its anchor point. The offset is applied after rotation by the angle property.",
          "type": "number"
        },
        "radius": {
          "description": "Polar coordinate radial offset, in pixels, of the text label from the origin determined by the x and y properties.",
          "type": "number"
        },
        "theta": {
          "description": "Polar coordinate angle, in radians, of the text label from the origin determined by the x and y properties. Values for theta follow the same convention of arc mark startAngle and endAngle properties: angles are measured in radians, with 0 indicating \"north\".",
          "type": "number"
        },
        "font": {
          "description": "The typeface to set the text in (e.g., Helvetica Neue).",
          "type": "string"
        },
        "fontSize": {
          "description": "The font size, in pixels.",
          "type": "number"
        },
        "fontStyle": {
          "$ref": "#/definitions/FontStyle",
          "description": "The font style (e.g., italic)."
        },
        "fontWeight": {
          "$ref": "#/definitions/FontWeight",
          "description": "The font weight (e.g., bold)."
        },
        "format": {
          "description": "The formatting pattern for text value. If not defined, this will be determined automatically.",
          "type": "string"
        },
        "shortTimeLabels": {
          "description": "Whether month names and weekday names should be abbreviated.",
          "type": "boolean"
        },
        "text": {
          "description": "Placeholder Text",
          "type": "string"
        },
        "applyColorToBackground": {
          "description": "Apply color field to background color instead of the text.",
          "type": "boolean"
        }
      }
    },
    "StackOffset": {
      "type": "string",
      "enum": [
        "zero",
        "center",
        "normalize",
        "none"
      ]
    },
    "Orient": {
      "type": "string",
      "enum": [
        "horizontal",
        "vertical"
      ]
    },
    "Interpolate": {
      "type": "string",
      "enum": [
        "linear",
        "linear-closed",
        "step",
        "step-before",
        "step-after",
        "basis",
        "basis-open",
        "basis-closed",
        "cardinal",
        "cardinal-open",
        "cardinal-closed",
        "bundle",
        "monotone"
      ]
    },
    "Shape": {
      "type": "string",
      "enum": [
        "circle",
        "square",
        "cross",
        "diamond",
        "triangle-up",
        "triangle-down"
      ]
    },
    "HorizontalAlign": {
      "type": "string",
      "enum": [
        "left",
        "right",
        "center"
      ]
    },
    "VerticalAlign": {
      "type": "string",
      "enum": [
        "top",
        "middle",
        "bottom"
      ]
    },
    "FontStyle": {
      "type": "string",
      "enum": [
        "normal",
        "italic"
      ]
    },
    "FontWeight": {
      "type": "string",
      "enum": [
        "normal",
        "bold"
      ]
    },
    "OverlayConfig": {
      "type": "object",
      "properties": {
        "line": {
          "description": "Whether to overlay line with point.",
          "type": "boolean"
        },
        "area": {
          "$ref": "#/definitions/AreaOverlay",
          "description": "Type of overlay for area mark (line or linepoint)"
        },
        "pointStyle": {
          "$ref": "#/definitions/MarkConfig",
          "description": "Default style for the overlayed point."
        },
        "lineStyle": {
          "$ref": "#/definitions/MarkConfig",
          "description": "Default style for the overlayed point."
        }
      }
    },
    "AreaOverlay": {
      "type": "string",
      "enum": [
        "line",
        "linepoint",
        "none"
      ]
    },
    "ScaleConfig": {
      "type": "object",
      "properties": {
        "round": {
          "description": "If true, rounds numeric output values to integers.\n\nThis can be helpful for snapping to the pixel grid.\n\n(Only available for `x`, `y`, `size`, `row`, and `column` scales.)",
          "type": "boolean"
        },
        "textBandWidth": {
          "description": "Default band width for `x` ordinal scale when is mark is `text`.",
          "minimum": 0,
          "type": "number"
        },
        "bandSize": {
          "description": "Default band size for (1) `y` ordinal scale,\n\nand (2) `x` ordinal scale when the mark is not `text`.",
          "minimum": 0,
          "type": "number"
        },
        "opacity": {
          "description": "Default range for opacity.",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "padding": {
          "description": "Default padding for `x` and `y` ordinal scales.",
          "type": "number"
        },
        "useRawDomain": {
          "description": "Uses the source data range as scale domain instead of aggregated data for aggregate axis.\n\nThis property only works with aggregate functions that produce values within the raw data domain (`\"mean\"`, `\"average\"`, `\"stdev\"`, `\"stdevp\"`, `\"median\"`, `\"q1\"`, `\"q3\"`, `\"min\"`, `\"max\"`). For other aggregations that produce values outside of the raw data domain (e.g. `\"count\"`, `\"sum\"`), this property is ignored.",
          "type": "boolean"
        },
        "nominalColorRange": {
          "description": "Default range for nominal color scale",
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "sequentialColorRange": {
          "description": "Default range for ordinal / continuous color scale",
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "shapeRange": {
          "description": "Default range for shape",
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "barSizeRange": {
          "description": "Default range for bar size scale",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "fontSizeRange": {
          "description": "Default range for font size scale",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "ruleSizeRange": {
          "description": "Default range for rule stroke widths",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "tickSizeRange": {
          "description": "Default range for tick spans",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "pointSizeRange": {
          "description": "Default range for bar size scale",
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      }
    },
    "AxisConfig": {
      "type": "object",
      "properties": {
        "axisWidth": {
          "description": "Width of the axis line",
          "type": "number"
        },
        "layer": {
          "description": "A string indicating if the axis (and any gridlines) should be placed above or below the data marks.",
          "type": "string"
        },
        "offset": {
          "description": "The offset, in pixels, by which to displace the axis from the edge of the enclosing group or data rectangle.",
          "type": "number"
        },
        "axisColor": {
          "description": "Color of axis line.",
          "type": "string"
        },
        "grid": {
          "description": "A flag indicate if gridlines should be created in addition to ticks. If `grid` is unspecified, the default value is `true` for ROW and COL. For X and Y, the default value is `true` for quantitative and time fields and `false` otherwise.",
          "type": "boolean"
        },
        "gridColor": {
          "description": "Color of gridlines.",
          "type": "string"
        },
        "gridDash": {
          "description": "The offset (in pixels) into which to begin drawing with the grid dash array.",
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "gridOpacity": {
          "description": "The stroke opacity of grid (value between [0,1])",
          "type": "number"
        },
        "gridWidth": {
          "description": "The grid width, in pixels.",
          "type": "number"
        },
        "labels": {
          "description": "Enable or disable labels.",
          "type": "boolean"
        },
        "labelAngle": {
          "description": "The rotation angle of the axis labels.",
          "type": "number"
        },
        "labelAlign": {
          "description": "Text alignment for the Label.",
          "type": "string"
        },
        "labelBaseline": {
          "description": "Text baseline for the label.",
          "type": "string"
        },
        "labelMaxLength": {
          "description": "Truncate labels that are too long.",
          "minimum": 1,
          "type": "number"
        },
        "shortTimeLabels": {
          "description": "Whether month and day names should be abbreviated.",
          "type": "boolean"
        },
        "subdivide": {
          "description": "If provided, sets the number of minor ticks between major ticks (the value 9 results in decimal subdivision). Only applicable for axes visualizing quantitative scales.",
          "type": "number"
        },
        "ticks": {
          "description": "A desired number of ticks, for axes visualizing quantitative scales. The resulting number may be different so that values are \"nice\" (multiples of 2, 5, 10) and lie within the underlying scale's range.",
          "minimum": 0,
          "type": "number"
        },
        "tickColor": {
          "description": "The color of the axis's tick.",
          "type": "string"
        },
        "tickLabelColor": {
          "description": "The color of the tick label, can be in hex color code or regular color name.",
          "type": "string"
        },
        "tickLabelFont": {
          "description": "The font of the tick label.",
          "type": "string"
        },
        "tickLabelFontSize": {
          "description": "The font size of label, in pixels.",
          "type": "number"
        },
        "tickPadding": {
          "description": "The padding, in pixels, between ticks and text labels.",
          "type": "number"
        },
        "tickSize": {
          "description": "The size, in pixels, of major, minor and end ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickSizeMajor": {
          "description": "The size, in pixels, of major ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickSizeMinor": {
          "description": "The size, in pixels, of minor ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickSizeEnd": {
          "description": "The size, in pixels, of end ticks.",
          "minimum": 0,
          "type": "number"
        },
        "tickWidth": {
          "description": "The width, in pixels, of ticks.",
          "type": "number"
        },
        "titleColor": {
          "description": "Color of the title, can be in hex color code or regular color name.",
          "type": "string"
        },
        "titleFont": {
          "description": "Font of the title.",
          "type": "string"
        },
        "titleFontSize": {
          "description": "Size of the title.",
          "type": "number"
        },
        "titleFontWeight": {
          "description": "Weight of the title.",
          "type": "string"
        },
        "titleOffset": {
          "description": "A title offset value for the axis.",
          "type": "number"
        },
        "titleMaxLength": {
          "description": "Max length for axis title if the title is automatically generated from the field's description. By default, this is automatically based on cell size and characterWidth property.",
          "minimum": 0,
          "type": "number"
        },
        "characterWidth": {
          "description": "Character width for automatically determining title max length.",
          "type": "number"
        },
        "properties": {
          "description": "Optional mark property definitions for custom axis styling."
        }
      }
    },
    "LegendConfig": {
      "type": "object",
      "properties": {
        "orient": {
          "description": "The orientation of the legend. One of \"left\" or \"right\". This determines how the legend is positioned within the scene. The default is \"right\".",
          "type": "string"
        },
        "offset": {
          "description": "The offset, in pixels, by which to displace the legend from the edge of the enclosing group or data rectangle.",
          "type": "number"
        },
        "padding": {
          "description": "The padding, in pixels, between the lengend and axis.",
          "type": "number"
        },
        "margin": {
          "description": "The margin around the legend, in pixels",
          "type": "number"
        },
        "gradientStrokeColor": {
          "description": "The color of the gradient stroke, can be in hex color code or regular color name.",
          "type": "string"
        },
        "gradientStrokeWidth": {
          "description": "The width of the gradient stroke, in pixels.",
          "type": "number"
        },
        "gradientHeight": {
          "description": "The height of the gradient, in pixels.",
          "type": "number"
        },
        "gradientWidth": {
          "description": "The width of the gradient, in pixels.",
          "type": "number"
        },
        "labelAlign": {
          "description": "The alignment of the legend label, can be left, middle or right.",
          "type": "string"
        },
        "labelBaseline": {
          "description": "The position of the baseline of legend label, can be top, middle or bottom.",
          "type": "string"
        },
        "labelColor": {
          "description": "The color of the legend label, can be in hex color code or regular color name.",
          "type": "string"
        },
        "labelFont": {
          "description": "The font of the lengend label.",
          "type": "string"
        },
        "labelFontSize": {
          "description": "The font size of lengend lable.",
          "type": "number"
        },
        "labelOffset": {
          "description": "The offset of the legend label.",
          "type": "number"
        },
        "shortTimeLabels": {
          "description": "Whether month names and weekday names should be abbreviated.",
          "type": "boolean"
        },
        "symbolColor": {
          "description": "The color of the legend symbol,",
          "type": "string"
        },
        "symbolShape": {
          "description": "The shape of the legend symbol, can be the 'circle', 'square', 'cross', 'diamond',\n\n'triangle-up', 'triangle-down', or else a custom SVG path string.",
          "type": "string"
        },
        "symbolSize": {
          "description": "The size of the lengend symbol, in pixels.",
          "type": "number"
        },
        "symbolStrokeWidth": {
          "description": "The width of the symbol's stroke.",
          "type": "number"
        },
        "titleColor": {
          "description": "Optional mark property definitions for custom legend styling.\n\nThe color of the legend title, can be in hex color code or regular color name.",
          "type": "string"
        },
        "titleFont": {
          "description": "The font of the legend title.",
          "type": "string"
        },
        "titleFontSize": {
          "description": "The font size of the legend title.",
          "type": "number"
        },
        "titleFontWeight": {
          "description": "The font weight of the legend title.",
          "type": "string"
        },
        "properties": {
          "description": "Optional mark property definitions for custom legend styling."
        }
      }
    },
    "FacetConfig": {
      "type": "object",
      "properties": {
        "scale": {
          "$ref": "#/definitions/FacetScaleConfig",
          "description": "Facet Scale Config"
        },
        "axis": {
          "$ref": "#/definitions/AxisConfig",
          "description": "Facet Axis Config"
        },
        "grid": {
          "$ref": "#/definitions/FacetGridConfig",
          "description": "Facet Grid Config"
        },
        "cell": {
          "$ref": "#/definitions/CellConfig",
          "description": "Facet Cell Config"
        }
      }
    },
    "FacetScaleConfig": {
      "type": "object",
      "properties": {
        "round": {
          "type": "boolean"
        },
        "padding": {
          "type": "number"
        }
      }
    },
    "FacetGridConfig": {
      "type": "object",
      "properties": {
        "color": {
          "format": "color",
          "type": "string"
        },
        "opacity": {
          "type": "number"
        },
        "offset": {
          "type": "number"
        }
      }
    },
    "FacetSpec": {
      "type": "object",
      "properties": {
        "facet": {
          "$ref": "#/definitions/Facet"
        },
        "spec": {
          "oneOf": [
            {
              "$ref": "#/definitions/LayerSpec"
            },
            {
              "$ref": "#/definitions/UnitSpec"
            }
          ]
        },
        "name": {
          "description": "Name of the visualization for later reference.",
          "type": "string"
        },
        "description": {
          "description": "An optional description of this mark for commenting purpose.\n\nThis property has no effect on the output visualization.",
          "type": "string"
        },
        "data": {
          "$ref": "#/definitions/Data",
          "description": "An object describing the data source"
        },
        "transform": {
          "$ref": "#/definitions/Transform",
          "description": "An object describing filter and new field calculation."
        },
        "config": {
          "$ref": "#/definitions/Config",
          "description": "Configuration object"
        }
      },
      "required": [
        "facet",
        "spec"
      ]
    },
    "Facet": {
      "type": "object",
      "properties": {
        "row": {
          "$ref": "#/definitions/PositionChannelDef"
        },
        "column": {
          "$ref": "#/definitions/PositionChannelDef"
        }
      }
    },
    "LayerSpec": {
      "type": "object",
      "properties": {
        "layers": {
          "description": "Unit specs that will be layered.",
          "type": "array",
          "items": {
            "$ref": "#/definitions/UnitSpec"
          }
        },
        "name": {
          "description": "Name of the visualization for later reference.",
          "type": "string"
        },
        "description": {
          "description": "An optional description of this mark for commenting purpose.\n\nThis property has no effect on the output visualization.",
          "type": "string"
        },
        "data": {
          "$ref": "#/definitions/Data",
          "description": "An object describing the data source"
        },
        "transform": {
          "$ref": "#/definitions/Transform",
          "description": "An object describing filter and new field calculation."
        },
        "config": {
          "$ref": "#/definitions/Config",
          "description": "Configuration object"
        }
      },
      "required": [
        "layers"
      ]
    },
    "UnitSpec": {
      "type": "object",
      "properties": {
        "mark": {
          "$ref": "#/definitions/Mark",
          "description": "The mark type.\n\nOne of `\"bar\"`, `\"circle\"`, `\"square\"`, `\"tick\"`, `\"line\"`,\n\n`\"area\"`, `\"point\"`, `\"rule\"`, and `\"text\"`."
        },
        "encoding": {
          "$ref": "#/definitions/UnitEncoding",
          "description": "A key-value mapping between encoding channels and definition of fields."
        },
        "name": {
          "description": "Name of the visualization for later reference.",
          "type": "string"
        },
        "description": {
          "description": "An optional description of this mark for commenting purpose.\n\nThis property has no effect on the output visualization.",
          "type": "string"
        },
        "data": {
          "$ref": "#/definitions/Data",
          "description": "An object describing the data source"
        },
        "transform": {
          "$ref": "#/definitions/Transform",
          "description": "An object describing filter and new field calculation."
        },
        "config": {
          "$ref": "#/definitions/Config",
          "description": "Configuration object"
        }
      },
      "required": [
        "mark"
      ]
    },
    "UnitEncoding": {
      "type": "object",
      "properties": {
        "x": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "X coordinates for `point`, `circle`, `square`,\n\n`line`, `rule`, `text`, and `tick`\n\n(or to width and height for `bar` and `area` marks)."
        },
        "y": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "Y coordinates for `point`, `circle`, `square`,\n\n`line`, `rule`, `text`, and `tick`\n\n(or to width and height for `bar` and `area` marks)."
        },
        "x2": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "X2 coordinates for ranged `bar`, `rule`, `area`"
        },
        "y2": {
          "$ref": "#/definitions/PositionChannelDef",
          "description": "Y2 coordinates for ranged `bar`, `rule`, `area`"
        },
        "color": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "Color of the marks – either fill or stroke color based on mark type.\n\n(By default, fill color for `area`, `bar`, `tick`, `text`, `circle`, and `square` /\n\nstroke color for `line` and `point`.)"
        },
        "opacity": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "Opacity of the marks – either can be a value or in a range."
        },
        "size": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "Size of the mark.\n\n- For `point`, `square` and `circle`\n\n– the symbol size, or pixel area of the mark.\n\n- For `bar` and `tick` – the bar and tick's size.\n\n- For `text` – the text's font size.\n\n- Size is currently unsupported for `line` and `area`."
        },
        "shape": {
          "$ref": "#/definitions/ChannelDefWithLegend",
          "description": "The symbol's shape (only for `point` marks). The supported values are\n\n`\"circle\"` (default), `\"square\"`, `\"cross\"`, `\"diamond\"`, `\"triangle-up\"`,\n\nor `\"triangle-down\"`, or else a custom SVG path string."
        },
        "detail": {
          "description": "Additional levels of detail for grouping data in aggregate views and\n\nin line and area marks without mapping data to a specific visual channel.",
          "oneOf": [
            {
              "$ref": "#/definitions/FieldDef",
              "description": "Interface for any kind of FieldDef;\n\nFor simplicity, we do not declare multiple interfaces of FieldDef like\n\nwe do for JSON schema."
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/definitions/FieldDef",
                "description": "Interface for any kind of FieldDef;\n\nFor simplicity, we do not declare multiple interfaces of FieldDef like\n\nwe do for JSON schema."
              }
            }
          ]
        },
        "text": {
          "$ref": "#/definitions/FieldDef",
          "description": "Text of the `text` mark."
        },
        "label": {
          "$ref": "#/definitions/FieldDef"
        },
        "path": {
          "description": "Order of data points in line marks.",
          "oneOf": [
            {
              "$ref": "#/definitions/OrderChannelDef"
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/definitions/OrderChannelDef"
              }
            }
          ]
        },
        "order": {
          "description": "Layer order for non-stacked marks, or stack order for stacked marks.",
          "oneOf": [
            {
              "$ref": "#/definitions/OrderChannelDef"
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/definitions/OrderChannelDef"
              }
            }
          ]
        }
      }
    }
  },
  "$schema": "http://json-schema.org/draft-04/schema#"
};
}());

;(function() {
'use strict';
/* globals window, angular */

angular.module('vlui', [
    'LocalStorageModule',
    'angular-google-analytics',
    'angular-sortable-view',
    'angular-websql',
    'ui-rangeSlider'
  ])
  .constant('_', window._)
  // datalib, vegalite, vega
  .constant('cql', window.cql)
  .constant('vlSchema', window.vlSchema)
  // other libraries
  .constant('jQuery', window.$)
  .constant('Papa', window.Papa)
  .constant('Blob', window.Blob)
  .constant('URL', window.URL)
  .constant('Drop', window.Drop)
  // Use the customized vendor/json3-compactstringify
  .constant('JSON3', window.JSON3.noConflict())
  .constant('ANY', '__ANY__')
  // constants
  .constant('consts', {
    addCount: true, // add count field to Dataset.dataschema
    debug: true,
    useUrl: true,
    logging: true,
    logLevel: 'INFO',
    logPrintLevel: 'INFO',
    logToWebSql: false, // in user studies, set this to true
    hideMoreFn: true, // hide belowFold functions and "more" & "less" toggles in functionselect during user studies
    appId: 'vlui',
    // embedded polestar and voyager with known data
    embeddedData: window.vguiData || undefined,
    priority: {
      bookmark: 0,
      popup: 0,
      vislist: 1000
    },
    myriaRest: 'http://ec2-52-1-38-182.compute-1.amazonaws.com:8753',
    defaultTimeFn: 'year',
    wildcardFn: true,
    hideOrdinalTypeSelect: true
  })
  .config(['cql', function(cql) {
    cql.config.DEFAULT_QUERY_CONFIG.channels = ['x', 'y', 'column', 'size', 'color'];
    cql.config.DEFAULT_QUERY_CONFIG.stylize = false;
  }]);
}());

;(function() {
angular.module("vlui").run(["$templateCache", function($templateCache) {$templateCache.put("dataset/changeloadeddataset.html","<div class=\"change-loaded-dataset\"><div ng-if=\"userData.length\"><h3>已定义的指标</h3><ul><li ng-repeat=\"dataset in userData track by dataset.id\" ng-class=\"{selected: Dataset.currentDataset.id === dataset.id}\"><a class=\"dataset\" ng-click=\"selectDataset(dataset)\" ng-disabled=\"Dataset.currentDataset.id === dataset.id\"><i class=\"fa fa-database\"></i> <strong>{{dataset.name}}</strong></a> <span ng-if=\"dataset.description\">{{dataset.description}}</span> <strong ng-if=\"Dataset.currentDataset === dataset\">(已选中)</strong></li></ul></div><h3>请点击选择</h3><ul class=\"loaded-dataset-list\"><li ng-repeat=\"dataset in sampleData track by dataset.id\" ng-class=\"{selected: Dataset.currentDataset.id === dataset.id}\"><a class=\"dataset\" ng-click=\"selectDataset(dataset)\" ng-disabled=\"Dataset.currentDataset.id === dataset.id\"><i class=\"fa fa-database\"></i> <strong>{{dataset.name}}</strong></a> <strong ng-if=\"Dataset.currentDataset === dataset\">(已选中)</strong> <em ng-if=\"dataset.description\">{{dataset.description}}</em></li></ul></div>");
$templateCache.put("dataset/datasetmodal.html","<modal id=\"dataset-modal\" max-width=\"800px\"><div class=\"modal-header\"><modal-close-button></modal-close-button><h2>选择指标</h2></div><div class=\"modal-main\"><tabset><tab heading=\"可用指标\"><change-loaded-dataset></change-loaded-dataset></tab></tabset></div></modal>");
$templateCache.put("dataset/datasetselector.html","<button id=\"select-data\" class=\"btn btn-default btn-xs\" ng-click=\"loadDataset();\"><span class=\"glyphicon glyphicon-cloud-download\"></span>选择指标</button>");
$templateCache.put("components/fieldinfo/fieldinfo.html","<span class=\"field-info\"><span class=\"hflex full-width\" ng-click=\"clicked($event)\"><span class=\"type-caret\" ng-class=\"{active: !disableCaret}\"><span class=\"type fa {{icon}}\" ng-show=\"showType\" title=\"{{typeName}}\"></span></span> <span ng-if=\"fieldDef.aggregate!==\'count\'\" class=\"field-info-text\"><span ng-if=\"func(fieldDef)\" class=\"field-func\" title=\"{{ func(fieldDef) }}\" ng-class=\"{any: fieldDef._any}\">{{ func(fieldDef) }}</span><span class=\"field-name\" title=\"{{ (fieldDef.title || fieldTitle(fieldDef.field)) | underscore2space }}\" ng-class=\"{hasfunc: func(fieldDef), any: fieldDef._any}\">{{ (fieldDef.title || fieldTitle(fieldDef.field)) | underscore2space }}</span> <span class=\"wildcard-field-count\">{{ fieldCount(fieldDef.field) }}</span></span> <span ng-if=\"fieldDef.aggregate===\'count\' || fieldDef.autoCount\" class=\"field-count field-info-text\"><span class=\"field-name\">数量</span></span> <span class=\"no-shrink remove\" ng-show=\"showRemove\"><a class=\"remove-field\" ng-click=\"removeAction()\"><i class=\"fa fa-times\"></i></a></span></span></span>");
$templateCache.put("components/ecchannel/ecchannel.html","<div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label\">{{ channelTitle }}</div><div class=\"field-drop\" ng-model=\"thismodal\" data-drop=\"canDrag == \'1\'\" jqyoui-droppable=\"{onDrop:\'FieldDropped()\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"selected full-width field-info\" ng-show=\"field.field\"><span class=\"hflex full-width\"><span class=\"type-caret drop-target active\" ng-show=\"canDrop == \'1\'\"><i class=\"fa fa-caret-down\"></i></span> <span class=\"field-info-text\">{{ field.field }}</span> <span class=\"no-shrink remove\"><a class=\"remove-field\" ng-click=\"removeAction()\"><i class=\"fa fa-times\"></i></a></span></span></span> <span class=\"placeholder\" ng-show=\"!field.field && canDrag == \'1\'\">将字段拖到此处</span></div></div><div class=\"drop-container\"><div class=\"popup-menu echart-type\"><div ng-if=\"dropType == \'type\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">颜色默认</label><div class=\"col-sm-4\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.autoColor\"></div></div><div class=\"form-group clearfix\" ng-show=\"field.autoColor == \'false\'\"><label class=\"col-sm-4\">颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width color-input\" ng-blur=\"setMixColor()\" ng-model=\"mix_color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">数据形状</label><div class=\"col-sm-4\"><select ng-model=\"field.truetype\"><option value=\"bar\">柱状</option><option value=\"line\">线性</option><option value=\"area\">区域图</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">数值文字</label><div class=\"col-sm-4\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.normal.show\"></div></div><div class=\"form-group clearfix\" ng-show=\"field.truetype==\'bar\'\"><label class=\"col-sm-4\">文字位置</label><div class=\"col-sm-4\"><select ng-model=\"field.label.normal.position\"><option value=\"left\">left</option><option value=\"right\">right</option><option value=\"top\">top</option><option value=\"bottom\">bottom</option><option value=\"inside\">inside</option><option value=\"insideTop\">insideTop</option><option value=\"insideLeft\">insideLeft</option><option value=\"insideRight\">insideRight</option><option value=\"insideBottom\">insideBottom</option><option value=\"insideTopLeft\">insideTopLeft</option><option value=\"insideTopRight\">insideTopRight</option><option value=\"insideBottomLeft\">insideBottomLeft</option><option value=\"insideBottomRight\">insideBottomRight</option></select></div></div><div class=\"form-group clearfix\" ng-show=\"field.truetype==\'bar\'\"><label class=\"col-sm-4\">文字翻转</label><div class=\"col-sm-4\"><input type=\"checkbox\" ng-true-value=\"\'90\'\" ng-false-value=\"\'0\'\" ng-model=\"field.label.normal.rotate\"></div></div></div><div style=\"width: 250px;\" ng-if=\"dropType == \'label\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-6\">文字显示</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.show\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">位置</label><div class=\"col-sm-5\"><select class=\"full-width\" ng-model=\"field.label.position\"><option value=\"outside\">外侧</option><option value=\"inside\">内部</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">百分比</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.showpercent\"></div></div></div><div style=\"width:150px\" ng-if=\"dropType == \'style\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-6\">文字显示</label><div class=\"col-sm-5\"><input type=\"text\" class=\"full-width\" ng-model=\"field.name\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">百分比</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.showPercent\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">数值大小</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0; padding: 0;\" min=\"10\" max=\"25\" model-max=\"field.style.detail.fontSize\" pin-handle=\"min\"></div></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">单位大小</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;\" min=\"10\" max=\"25\" model-max=\"field.style.title.fontSize\" pin-handle=\"min\"></div></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">线条粗细</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;\" min=\"1\" max=\"20\" model-max=\"field.style.axisLine.lineStyle.width\" pin-handle=\"min\"></div></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">刻度长度</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;\" min=\"1\" max=\"20\" model-max=\"field.style.axisTick.length\" pin-handle=\"min\"></div></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">分割长度</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;\" min=\"5\" max=\"25\" model-max=\"field.style.splitLine.length\" pin-handle=\"min\"></div></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">动态最大值</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.autoMax\"></div></div><div class=\"form-group clearfix\" ng-if=\"field.autoMax == \'false\'\"><label class=\"col-sm-6\">最大值</label><div class=\"col-sm-6\"><input type=\"text\" class=\"full-width\" ng-model=\"field.max\"></div></div></div><div style=\"width: 200px;\" ng-if=\"dropType == \'mappoint\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width point-color-input\" rel=\"normal\" ng-blur=\"setPointColor(\'normal\')\" ng-model=\"point_color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">突出显示</label><div class=\"col-sm-4\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.iftop\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">排序</label><div class=\"col-sm-4\"><select class=\"full-width\" ng-model=\"field.order\"><option value=\"asc\">顺序</option><option value=\"desc\">倒序</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">显示数量</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width\" ng-model=\"field.order_num\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">突出颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width point-color-input\" rel=\"top\" ng-blur=\"setPointColor(\'top\')\" ng-model=\"point_top_color\"></div></div></div><div style=\"width: 200px;\" ng-if=\"dropType == \'single\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">标题</label><div class=\"col-sm-8\"><input type=\"text\" class=\"full-width\" ng-model=\"field.label\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">单位</label><div class=\"col-sm-8\"><input type=\"text\" class=\"full-width\" ng-model=\"field.unit\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">字体大小</label><div class=\"col-sm-8\"><div range-slider=\"\" min=\"12\" max=\"24\" model-max=\"field.fontsize\" pin-handle=\"min\"></div></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\"></label><div class=\"col-sm-8\"><input type=\"text\" class=\"full-width\" readonly=\"\" ng-model=\"field.fontsize\"></div></div></div></div></div></div><div class=\"shelf-group\" ng-if=\"moreDrag && field.autoMax == \'true\'\"><div class=\"shelf\"><div class=\"shelf-label\">最大值</div><div class=\"field-drop\" ng-model=\"field.maxField\" data-drop=\"true\" jqyoui-droppable=\"{}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"selected full-width field-info\"><span class=\"hflex full-width\"><span class=\"field-info-text\">{{ field.maxField.field }}</span></span></span> <span class=\"placeholder\" ng-show=\"!field.field && canDrag == \'1\'\">此为 {{ field.field }} 的 最大值</span></div></div></div></div>");
$templateCache.put("components/modal/modal.html","<div class=\"ngmodal\" ng-if=\"isOpen\"><div class=\"modal-wrapper\" style=\"{{wrapperStyle}}\" ng-transclude=\"\"></div></div>");
$templateCache.put("components/modal/modalclosebutton.html","<div class=\"right\"><a ng-click=\"closeModal()\" class=\"right\"><i class=\"fa fa-times\"></i></a></div>");
$templateCache.put("components/schemalist/schemalist.html","<div class=\"schema no-top-margin full-width scroll-y\"><schema-list-item ng-repeat=\"fieldDef in fieldDefs | orderBy : orderBy\" field-def=\"fieldDef\" filter-manager=\"filterManager\" show-add=\"showAdd\"></schema-list-item><div class=\"schema-list-drop\" ng-show=\"showDrop\" ng-model=\"droppedFieldDef\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'fieldDropped\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\">Create a new wildcard.</div></div>");
$templateCache.put("components/schemalist/schemalistitem.html","<div class=\"schema-list-item\" ng-model=\"droppedFieldDef\" data-drop=\"isAnyField && fieldDef.field !== \'?\'\" jqyoui-droppable=\"{onDrop:\'fieldDropped\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><field-info ng-show=\"!isAnyField || fieldDef.field === \'?\' || fieldDef.field.enum.length > 0\" class=\"pill draggable full-width no-right-margin\" ng-class=\"{any: isEnumSpec(fieldDef.field)}\" field-def=\"fieldDef\" ng-model=\"pill\" data-drag=\"true\" jqyoui-draggable=\"{placeholder: \'keep\', deepCopy: true, onStart: \'fieldDragStart\', onStop:\'fieldDragStop\'}\" data-jqyoui-options=\"{revert: \'invalid\', helper: \'clone\'}\" show-add=\"showAdd\" show-caret=\"true\" disable-caret=\"fieldDef.immutable || fieldDef.aggregate === \'count\' || allowedTypes.length<=1\" show-type=\"true\" add-action=\"fieldAdd(fieldDef)\" show-filter=\"!!filterManager\" filter-action=\"toggleFilter()\" use-title=\"true\" popup-content=\"fieldInfoPopupContent\"></field-info></div><div class=\"drop-container\"><div class=\"popup-menu schema-menu\" ng-hide=\"!allowedTypes || allowedTypes.length<=1\"><div class=\"mb5 field-type\" ng-if=\"allowedTypes.length>1 && !isAnyField\"><h4>Type</h4><label class=\"type-label\" ng-repeat=\"type in allowedTypes\" ng-if=\"type !== \'ordinal\' || !consts.hideOrdinalTypeSelect\"><input type=\"radio\" ng-value=\"type\" ng-model=\"fieldDef.type\"> {{type}}</label></div><div class=\"wildcard-menu\" ng-show=\"isAnyField && fieldDef.field.enum\"><div><label class=\"wildcard-title-label\"><h4>Name</h4><input type=\"text\" ng-model=\"fieldDef.title\" placeholder=\"{{fieldTitle(fieldDef.field)}}\"></label></div><h4>Wildcard Fields</h4><div class=\"wildcard-fields\"><field-info ng-repeat=\"field in fieldDef.field.enum\" class=\"pill list-item full-width no-right-margin\" field-def=\"field === \'*\' ? countFieldDef : Dataset.schema.fieldSchema(field)\" show-type=\"true\" show-remove=\"true\" remove-action=\"removeWildcardField($index)\"></field-info></div><a class=\"remove-action\" ng-click=\"removeWildcard()\"><i class=\"fa fa-times\"></i> Delete Wildcard</a></div></div></div>");
$templateCache.put("components/shelves/shelves.html","<div class=\"card vflex shelves no-top-margin no-right-margin abs-100\"><div class=\"full-width\" style=\"position: relative;\" ng-mouseover=\"showmarktype=true\" ng-mouseleave=\"showmarktype=false\"><button type=\"button\" class=\"select-btn\" ng-click=\"showmarktype = !showmarktype\"><i class=\"fa {{ markdetail.icon }}\">{{ markdetail.title }}</i></button><ul class=\"marktype-list\" ng-show=\"showmarktype\"><li ng-repeat=\"type in marksWithAny track by $index\" ng-click=\"changetype(type)\"><i class=\"fa {{ marksicon[type].icon }}\"></i> {{ marksicon[type].title }}</li></ul></div><div class=\"shelf-pane shelf-encoding-pane full-width\"><h2 ng-show=\"spec.mark != \'single\'\">标题</h2><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">标题</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-blur=\"setNormalTitle(\'title\');\" ng-model=\"normalTitle\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-title\" ng-blur=\"setColor(\'bt\')\" rel=\"bt\" ng-model=\"titletextcolor\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">小标题</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-blur=\"setNormalTitle(\'sub_title\');\" ng-model=\"normalSubTitle\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-title\" ng-blur=\"setColor(\'sbt\')\" rel=\"sbt\" ng-model=\"subtitletextcolor\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">位置</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.title.position\"><option value=\"upleft\">左上</option><option value=\"upcenter\">上中心</option><option value=\"upright\">右上</option><option value=\"downleft\">左下</option><option value=\"downcenter\">下中心</option><option value=\"downright\">右下</option></select></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark != \'bmap\' && spec.mark != \'single\'\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">主题</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.theme\"><option value=\"vitality\">活力四射</option><option value=\"greenGarden\">绿色花园</option><option value=\"roman\">紫丁香</option><option value=\"purple\">紫罗兰</option><option value=\"air\">清新空气</option></select></div></div></div></div><h2>属性</h2><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'single\'\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">标题</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-blur=\"setNormalTitle(\'title\');\" ng-model=\"normalTitle\"></div></div></div><ec-channel drop-type=\"\'single\'\" can-drop=\"\'1\'\" channel-title=\"\'度量\'\" can-drag=\"\'0\'\" channel-key=\"yval\" remove-action=\"removeMix(\'y\',$index)\" ng-repeat=\"yval in ecconfig.field.y track by $index\" field=\"yval\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\" ng-show=\"ecconfig.field.y.length < 4\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"singleModel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'singleFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动字段到此处统计度量度</span></div></div></div></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'pie\'\"><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'维度\'\" drop-type=\"\'label\'\" can-drop=\"\'1\'\" can-drag=\"\'0\'\" channel-key=\"xkey\" remove-action=\"removeMix(\'x\',$index)\" ng-repeat=\"xval in ecconfig.field.x track by $index\" field=\"xval\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"piexmodel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'piexFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动字段到此处统计维度</span></div></div></div><h2>圆心距离</h2><div range-slider=\"\" min=\"0\" max=\"20\" model-max=\"ecconfig.start_radius\" pin-handle=\"min\"></div><h2>间隔</h2><div range-slider=\"\" min=\"0\" max=\"20\" model-max=\"ecconfig.radius_range\" pin-handle=\"min\"></div><h2>填充宽度</h2><div range-slider=\"\" min=\"0\" max=\"80\" model-max=\"ecconfig.radius_interval\" pin-handle=\"min\"></div></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"hasLegend(spec.mark)\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">显示图例</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.legend.show\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">图例翻转</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'horizontal\'\" ng-false-value=\"\'vertical\'\" ng-model=\"ecconfig.legend.orient\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">滚动图例</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'scroll\'\" ng-false-value=\"\'plain\'\" ng-model=\"ecconfig.legend.type\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">图例位置</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.legend.position\"><option value=\"upleft\">左上</option><option value=\"upcenter\">上中心</option><option value=\"upright\">右上</option><option value=\"downleft\">左下</option><option value=\"downcenter\">下中心</option><option value=\"downright\">右下</option></select></div></div></div></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'funnel\'\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'gauge\'\"><ec-channel channel-title=\"\'度量\'+($index+1)\" can-drag=\"\'1\'\" more-drag=\"\'true\'\" drop-type=\"\'style\'\" can-drop=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeMix(\'y\',$index)\" ng-repeat=\"gaugemodal in ecconfig.field.y track by $index\" field=\"gaugemodal\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\" ng-show=\"ecconfig.field.y.length < 3\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"gaugeY\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'gaugeYFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动字段到此处统计维度</span></div></div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-if=\"spec.mark == \'bmap\'\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">百度地图</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.mapdata.ifBmap\"></div></div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\' && ecconfig.mapdata.ifBmap != \'1\'\"><div class=\"shelf-group\"><div class=\"shelf-label drop-target\">地图样式</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.mapdata.map_theme\"><option value=\"light\">明</option><option value=\"dark\">暗</option></select></div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\'\"><div class=\"shelf-group\"><div class=\"tab active\" ng-class=\"{\'tab1\':\'tab-active\'}[tab]\" ng-click=\"setTab(\'tab1\');\">区域</div><div class=\"tab\" ng-class=\"{\'tab2\':\'tab-active\'}[tab]\" ng-click=\"setTab(\'tab2\');\">标记</div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\' && tab == \'tab1\'\"><div class=\"shelf-group\" ng-if=\"ecconfig.mapdata.ifBmap == \'1\'\">百度地图不支持区域数据展示</div><ec-channel channel-title=\"\'区域地区\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeArea(\'x\')\" field=\"ecconfig.area.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'区域数值\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeArea(\'y\')\" field=\"ecconfig.area.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-repeat=\"pointrow in ecconfig.point track by $index\" ng-show=\"spec.mark == \'bmap\' && tab == \'tab2\'\"><ec-channel channel-title=\"\'标记地区\'\" drop-type=\"\'mappoint\'\" can-drop=\"\'1\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removePoint(\'x\',$index)\" field=\"pointrow.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'标记数值\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removePoint(\'y\',$index)\" field=\"pointrow.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\' && tab == \'tab2\'\"><div class=\"shelf-group\" ng-show=\"ecconfig.point.length < 3\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"pointModel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'pointFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动地区字段到此处增加标记</span></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'mixed\'\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" drop-type=\"\'type\'\" can-drop=\"\'1\'\" can-drag=\"\'0\'\" remove-action=\"removeMix(\'y\',$index)\" ng-repeat=\"yval in ecconfig.field.y track by $index\" field=\"yval\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"ymodel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'mixedyFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动数值类字段到此处统计度量</span></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'mixed\'\"><h2>选项</h2><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">合并</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.ifmerge\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">转置</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.transpose\"></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'scatter\'\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'x轴度量\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'y轴度量\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'y\',\'1\')\" field=\"ecconfig.field.y[1]\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'radar\'\"><ec-channel channel-title=\"\'分类\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'legend\',\'0\')\" field=\"ecconfig.field.legend\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel></div><h2 ng-if=\"spec.mark == \'single\'\">选项</h2><div class=\"shelf-pane shelf-marks-pane full-width\" ng-if=\"spec.mark == \'single\'\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">形式</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.type\"><option value=\"card\">指标卡</option><option value=\"list\">指标条</option></select></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">小数点</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-model=\"ecconfig.option.fixed\"></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-if=\"spec.mark == \'single\'\"><div class=\"shelf-group\" ng-show=\"ecconfig.type == \'card\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">外框颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-single\" ng-blur=\"setColor(\'stroke\')\" rel=\"stroke\" ng-model=\"stroke_color\"></div></div></div><div class=\"shelf-group\" ng-show=\"ecconfig.type == \'card\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">背景颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-single\" ng-blur=\"setColor(\'fill\')\" rel=\"fill\" ng-model=\"fill_color\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">数值颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-single\" ng-blur=\"setColor(\'value\')\" rel=\"value\" ng-model=\"value_color\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">文字颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-single\" ng-blur=\"setColor(\'title\')\" rel=\"title\" ng-model=\"title_color\"></div></div></div></div></div></div>");
$templateCache.put("components/tabs/tab.html","<div ng-if=\"active\" ng-transclude=\"\"></div>");
$templateCache.put("components/tabs/tabset.html","<div class=\"tab-container\"><div><a class=\"tab\" ng-repeat=\"tab in tabset.tabs\" ng-class=\"{\'active\': tab.active}\" ng-click=\"tabset.showTab(tab)\">{{tab.heading}}</a></div><div class=\"tab-contents\" ng-transclude=\"\"></div></div>");}]);
}());

;(function() {
'use strict';

/**
 * @ngdoc filter
 * @name vega-lite-ui.filter:inGroup
 * @function
 * @description
 * # inGroup
 * Get datasets in a particular group
 * @param  {String} datasetGroup One of "sample," "user", or "myria"
 * @return {Array} An array of datasets in the specified group
 */
angular.module('vlui')
  .filter('inGroup', ['_', function(_) {
    return function(arr, datasetGroup) {
      return _.filter(arr, {
        group: datasetGroup
      });
    };
  }]);

/**
 * @ngdoc directive
 * @name vlui.directive:changeLoadedDataset
 * @description
 * # changeLoadedDataset
 */
angular.module('vlui')
  .directive('changeLoadedDataset', ['Dataset', '_', function (Dataset, _) {
    return {
      templateUrl: 'dataset/changeloadeddataset.html',
      restrict: 'E',
      require: '?^^modal',
      replace: true,
      scope: true,
      link: function postLink(scope, element, attrs, modalController) {
        // If this directive occurs within a a modal, give ourselves a way to close
        // that modal once the add button has been clicked
        function closeModal() {
          if (modalController) {
            modalController.close();
          }
        }

        // Expose dataset object itself so current dataset can be marked
        scope.Dataset = Dataset;

        scope.userData = _.filter(Dataset.datasets, function(dataset) {
          return dataset.group !== 'sample';
        });

        scope.sampleData = _.filter(Dataset.datasets, {
          group: 'sample'
        });

        var datasetWatcher = scope.$watch(function() {
          return Dataset.datasets.length;
        }, function() {
          scope.userData = _.filter(Dataset.datasets, function(dataset) {
            return dataset.group !== 'sample';
          });
        });

        scope.selectDataset = function(dataset) {
          // Activate the selected dataset

          Dataset.update(dataset);
          closeModal();
        };

        scope.$on('$destroy', function() {
          // Clean up watchers
          datasetWatcher();
        });
      }
    };
  }]);
}());

;(function() {
'use strict';

angular.module('vlui')
  .factory('Dataset', ['$http', '$q', '_', 'cql', 'SampleData', 'Config', 'Logger', function($http, $q, _, cql, SampleData, Config, Logger) {
    var Dataset = {};
    // Start with the list of sample datasets
    var datasets = SampleData;

    Dataset.datasets = datasets;
    Dataset.dataset = datasets[0];
    Dataset.currentDataset = undefined;  // dataset before update
    Dataset.stats = {};
    Dataset.type = undefined;
    Dataset.noData = false;
    Dataset.loading = false;
    var typeOrder = {
      nominal: 0,
      ordinal: 0,
      geographic: 2,
      temporal: 3,
      quantitative: 4
    };

    Dataset.fieldOrderBy = {};

    Dataset.fieldOrderBy.type = function(fieldDef) {
      if (fieldDef.aggregate==='count') return 4;
      return typeOrder[fieldDef.type];
    };

    Dataset.fieldOrderBy.typeThenName = function(fieldDef) {
      return Dataset.fieldOrderBy.type(fieldDef) + '_' +
        (fieldDef.aggregate === 'count' ? '~' : fieldDef.field.toLowerCase());
        // ~ is the last character in ASCII
    };

    Dataset.fieldOrderBy.original = function() {
      return 0; // no swap will occur
    };

    Dataset.fieldOrderBy.field = function(fieldDef) {
      return fieldDef.field;
    };

    Dataset.fieldOrder = Dataset.fieldOrderBy.typeThenName;

    // update the schema and stats
    Dataset.onUpdate = [];

    Dataset.update = function(dataset) {
      Dataset.data = [];
      Dataset.currentDataset.name = dataset.name;
      Dataset.loading = true;
      var updatePromise;

      Logger.logInteraction(Logger.actions.DATASET_CHANGE, dataset.name);

      if (dataset.values) {
        updatePromise = $q(function(resolve, reject) {
          // jshint unused:false
          Dataset.type = undefined;
          updateFromData(dataset, dataset.values);
          resolve();
        });
      } else {
        updatePromise = $http.get(dataset.url, {cache: true}).then(function(response) {
          
          var data;

          // first see whether the data is JSON, otherwise try to parse CSV
          if (_.isObject(response.data)) {
             data = response.data;
             Dataset.type = 'json';
          } 
          // else {
          //   data = util.read(response.data, {type: 'csv'});
          //   Dataset.type = 'csv';
          // }

          updateFromData(dataset, data);
          Dataset.loading = false;
        });
      }

      Dataset.onUpdate.forEach(function(listener) {
        updatePromise = updatePromise.then(listener);
      });

      // Copy the dataset into the config service once it is ready
      updatePromise.then(function() {
        Config.updateDataset(dataset, Dataset.type);
      });

      return updatePromise;
    };

    // function getFieldDefs(schema, order) {
    //   var fieldDefs = schema.fields().map(function(field) {
    //     return {
    //       field: field,
    //       type: schema.type(field),
    //       primitiveType: schema.primitiveType(field)
    //     };
    //   });

    //   fieldDefs = util.stablesort(fieldDefs, order || Dataset.fieldOrderBy.typeThenName, Dataset.fieldOrderBy.field);

    //   fieldDefs.push({ field: '*', title: 'Count' });
    //   return fieldDefs;
    // }

    function updateFromData(dataset, data) {
      Dataset.data = data;
      Dataset.currentDataset = dataset;

      Dataset.schema = cql.schema.Schema.build(data);
      // TODO: find all reference of Dataset.stats.sample and replace
    }

    Dataset.buildSchema = function(){
      Dataset.update(Dataset.dataset);
    };

    Dataset.add = function(dataset) {
      if (!dataset.id) {
        dataset.id = dataset.url;
      }
      datasets.push(dataset);

      return dataset;
    };

    return Dataset;
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:datasetModal
 * @description
 * # datasetModal
 */
angular.module('vlui')
  .directive('datasetModal', function () {
    return {
      templateUrl: 'dataset/datasetmodal.html',
      restrict: 'E',
      scope: false
    };
  });
}());

;(function() {
'use strict';

angular.module('vlui')
  .directive('datasetSelector', ['Modals', 'Logger', function(Modals, Logger) {
    return {
      templateUrl: 'dataset/datasetselector.html',
      restrict: 'E',
      replace: true,
      scope: {},
      link: function postLink(scope/*, element, attrs*/) {
        scope.loadDataset = function() {
          Logger.logInteraction(Logger.actions.DATASET_OPEN);
          Modals.open('dataset-modal');
        };
      }
    };
  }]);
}());

;(function() {
'use strict';

angular.module('vlui').constant('SampleData', [{
  name: 'Barley',
  description: 'Barley yield by variety across the upper midwest in 1931 and 1932',
  url: '/data/barley.json',
  id: 'barley',
  group: 'sample'
},{
  name: 'Cars',
  description: 'Automotive statistics for a variety of car models between 1970 & 1982',
  url: '/data/cars.json',
  id: 'cars',
  group: 'sample'
},{
  name: 'Crimea',
  url: '/data/crimea.json',
  id: 'crimea',
  group: 'sample'
},{
  name: 'Driving',
  url: '/data/driving.json',
  id: 'driving',
  group: 'sample'
},{
  name: 'Iris',
  url: '/data/iris.json',
  id: 'iris',
  group: 'sample'
},{
  name: 'Jobs',
  url: '/data/jobs.json',
  id: 'jobs',
  group: 'sample'
},{
  name: 'Population',
  url: '/data/population.json',
  id: 'population',
  group: 'sample'
},{
  name: 'Movies',
  url: '/data/movies.json',
  id: 'movies',
  group: 'sample'
},{
  name: 'Birdstrikes',
  url: '/data/birdstrikes.json',
  id: 'birdstrikes',
  group: 'sample'
},{
  name: 'Burtin',
  url: '/data/burtin.json',
  id: 'burtin',
  group: 'sample'
},{
  name: 'Campaigns',
  url: '/data/weball26.json',
  id: 'weball26',
  group: 'sample'
}]);
}());

;(function() {
'use strict';

angular.module('vlui')
  .directive('ecChannel', ['Drop', function (Drop) {
    return {
      templateUrl: 'components/ecchannel/ecchannel.html',
      restrict: 'E',
      replace: true,
      scope: {
        modal: '=',
        field: '=',
        canDrag: '<',
        channelTitle: '<',
        removeAction: '&',
        canDrop: '<',
        dropType: '<',
        moreDrag: '<'

      },
      link: function (scope, element /*, attrs*/) {
        scope.FieldDropped = function () {
          scope.field = angular.copy(scope.thismodal);
        };

    
        if (element.find('.type-caret').length > 0 && element.find('.echart-type').length > 0) {
          var typePopup = new Drop({
            content: element.find('.echart-type')[0],
            target: element.find('.type-caret')[0],
            position: 'top left',
            openOn: 'click'
          });
          if (scope.dropType == 'type' && scope.field && scope.field.color) {
            scope.mix_color = angular.copy(scope.field.color);
            typePopup.on('open', function () {
              $(".drop-content .color-input").colorpicker({ align: 'right' }).on('changeColor', function () {
                scope.mix_color = $(this).val();
              });
            });
          }
          if (scope.dropType == 'mappoint' && scope.field && scope.field.color) {
            scope.point_color = angular.copy(scope.field.color);
            scope.point_top_color = angular.copy(scope.field.top_color);
            typePopup.on('open', function () {
              $(".drop-content .point-color-input").colorpicker({ align: 'right' }).on('changeColor', function () {
                if($(this).attr('rel') == 'normal'){
                  scope.point_color = $(this).val();
                }
                if($(this).attr('rel') == 'top'){
                  scope.point_top_color = $(this).val();
                }
              });
            });
          }
        }

        scope.setMixColor = function () {
          scope.field.color = angular.copy(scope.mix_color);
          typePopup.open();
        };

        scope.setPointColor = function (type) {
          if(type == 'normal'){
            scope.field.color = angular.copy(scope.point_color);
          }
          if(type == 'top'){
            scope.field.top_color = angular.copy(scope.point_top_color);
          }
          typePopup.open();
        };

        scope.$watch('field.truetype', function (n) {
          if (!scope.field || !scope.field.truetype || !scope.field.type) {
            return;
          }
          if (n === 'area') {
            scope.field.type = 'line';
            scope.field.isarea = '1';
          }
          else {
            scope.field.type = n;
          }
          if (n !== 'bar') {
            scope.field.label.normal.position = 'top';
          }
        });

        scope.$on('$destroy', function () {
          if (typePopup && typePopup.destroy) {
            typePopup.destroy();
          }
        });
      }
    };
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:fieldInfo
 * @description
 * # fieldInfo
 */
angular.module('vlui')
  .directive('fieldInfo', ['ANY', 'Drop', 'cql', 'Dataset', function (ANY, Drop, cql, Dataset) {
    return {
      templateUrl: 'components/fieldinfo/fieldinfo.html',
      restrict: 'E',
      replace: true,
      scope: {
        fieldDef: '<',
        filterAction: '&',
        showAdd: '<',
        showCaret: '<',
        showFilter: '=',
        showRemove: '<',
        showType: '<',
        showEnumSpecFn: '<',
        popupContent: '<',
        action: '&',
        addAction: '&',
        removeAction: '&',
        disableCaret: '<'
      },
      link: function(scope, element) {
        var funcsPopup;

        // Properties that are created by a watcher later
        scope.typeName = null;
        scope.icon = null;
        scope.null = null;

        scope.fieldTitle = function(field) {
          if (cql.enumSpec.isEnumSpec(field)) {
            return (field.enum || ['Wildcard'])
              .map(function(field) {
                return field === '*' ? 'COUNT' : field;
              }).join(',');
          }
          return field;
        };

        scope.fieldCount = function(field) {
          if (cql.enumSpec.isEnumSpec(field)) {
            return field.enum ? ' (' + field.enum.length + ')' : '';
          }
          return '';
        };

        scope.clicked = function($event){
          if(scope.action && $event.target !== element.find('.fa-caret-down')[0] &&
            $event.target !== element.find('span.type')[0]) {
            scope.action($event);
          }
        };

        var isEnumSpec = cql.enumSpec.isEnumSpec;

        scope.func = function(fieldDef) {
          if (fieldDef.aggregate) {
            if (!isEnumSpec(fieldDef.aggregate)) {
              return fieldDef.aggregate;
            } else if (scope.showEnumSpecFn) {
              return '?';
            }
          }
          if (fieldDef.timeUnit) {
            if (!isEnumSpec(fieldDef.timeUnit)) {
              return fieldDef.timeUnit;
            } else if (scope.showEnumSpecFn) {
              return '?';
            }
          }
          if (fieldDef.bin) {
            if (!isEnumSpec(fieldDef.bin)) {
              return 'bin';
            } else if (scope.showEnumSpecFn) {
              return '?';
            }
          }

          return fieldDef._aggregate || fieldDef._timeUnit ||
            (fieldDef._bin && 'bin') || (fieldDef._any && 'auto') || '';
        };

        // var popupContentWatcher = scope.$watch('popupContent', function(popupContent) {
        //   if (!popupContent) { return; }

        //   if (funcsPopup) {
        //     funcsPopup.destroy();
        //   }

        //   funcsPopup = new Drop({
        //     content: popupContent,
        //     target: element.find('.type-caret')[0],
        //     position: 'bottom left',
        //     openOn: 'click'
        //   });
        // });

        var TYPE_NAMES = {
          nominal: 'text',
          ordinal: 'text-ordinal',
          quantitative: 'number',
          temporal: 'time',
          geographic: 'geo'
        };

        var TYPE_ICONS = {
          nominal: 'fa-font',
          ordinal: 'fa-font',
          quantitative: 'icon-hash',
          temporal: 'fa-calendar',
        };
        TYPE_ICONS[ANY] = 'fa-asterisk'; // separate line because we might change what's the string for ANY

        function getTypeDictValue(type, dict) {
          if (cql.enumSpec.isEnumSpec(type)) { // is enumSpec
            if (!type.enum) {
              return ANY; // enum spec without specific values
            }

            var val = null;
            for (var i = 0; i < type.enum.length; i++) {
              var _type = type.enum[i];
              var v = dict ? dict[_type] : _type;
              if (val === null) {
                val = v;
              } else {
                if (val !== v) {
                  return ANY; // If there are many conflicting types
                }
              }
            }
            return val;
          }
          return dict ? dict[type] : type;
        }

        var fieldDefWatcher = scope.$watch('fieldDef.type', function(type) {
          scope.icon = getTypeDictValue(type, TYPE_ICONS);
          var typeName = type;
          if (typeName === 'ordinal' || typeName === 'nominal') {
            typeName += (' (' + Dataset.schema.primitiveType(scope.fieldDef.field) + ')');
          } else if (type && type.enum) {
            typeName = type.enum[0]; // FIXME join them if we support many types
          }
          scope.typeName = typeName;
        });

        scope.$on('$destroy', function() {
          if (funcsPopup && funcsPopup.destroy) {
            funcsPopup.destroy();
          }

          // unregister watchers
          // popupContentWatcher();
          fieldDefWatcher();
        });
      }
    };
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:modal
 * @description
 * # modal
 */
angular.module('vlui')
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
angular.module('vlui')
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
angular.module('vlui')
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

;(function() {
'use strict';

angular.module('vlui')
  .directive('schemaList', ['cql', 'Logger', 'Pills', function(cql, Logger, Pills) {
    return {
      templateUrl: 'components/schemalist/schemalist.html',
      restrict: 'E',
      scope: {
        orderBy: '<',
        fieldDefs: '<',
        filterManager: '=',
        showAdd: '<',
        showCount: '<',
        showDrop: '<'
      },
      replace: true,
      link: function(scope) {
        scope.Pills = Pills;
        scope.isEnumSpec = cql.enumSpec.isEnumSpec;

        scope.droppedFieldDef = {};
        scope.countFieldDef = Pills.countFieldDef;

        scope.fieldDropped = function() {
          Logger.logInteraction(Logger.actions.ADD_WILDCARD, scope.droppedFieldDef);
          Pills.addWildcard(scope.droppedFieldDef);
          scope.droppedFieldDef = {};
        };
      }
    };
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name polestar.directive:schemaListItem
 * @description
 * # schemaListItem
 */
angular.module('vlui')
  .directive('schemaListItem', ['Dataset', 'Drop', 'Logger', 'Pills', 'cql', 'consts', function (Dataset, Drop, Logger, Pills, cql, consts) {
    return {
      templateUrl: 'components/schemalist/schemalistitem.html',
      restrict: 'E',
      replace: false,
      scope: {
        fieldDef: '=', // Two-way
        showAdd: '<',
        filterManager: '='
      },
      link: function postLink(scope, element) {
        scope.Dataset = Dataset;
        scope.consts = consts;
        scope.countFieldDef = Pills.countFieldDef;

        scope.isAnyField = false;
        scope.droppedFieldDef = null;
        scope.fieldInfoPopupContent = element.find('.schema-menu')[0];

        scope.isEnumSpec = cql.enumSpec.isEnumSpec;

        scope.fieldAdd = function (fieldDef) {
          Pills.add(fieldDef);
        };

        scope.toggleFilter = function () {
          if (!scope.filterManager) return;
          scope.filterManager.toggle(scope.fieldDef.field);
        };

        scope.fieldDragStart = function () {
          var fieldDef = scope.fieldDef;

          scope.pill = {
            field: fieldDef.field,
            title: fieldDef.title,
            type: fieldDef.type,
            aggregate: fieldDef.aggregate
          };
          Pills.dragStart(scope.pill, null);
        };

        scope.fieldDragStop = Pills.dragStop;

        scope.fieldDropped = function () {
          Pills.addWildcardField(scope.fieldDef, scope.droppedFieldDef);
          Logger.logInteraction(Logger.actions.ADD_WILDCARD_FIELD, scope.fieldDef, {
            addedField: scope.droppedFieldDef
          });
          scope.droppedFieldDef = null;
        };

        scope.removeWildcardField = function (index) {
          var field = scope.fieldDef.field;
          Logger.logInteraction(Logger.actions.REMOVE_WILDCARD_FIELD, scope.fieldDef, {
            removedField: field.enum[index] === '*' ? 'COUNT' : field.enum[index]
          });
          Pills.removeWildcardField(scope.fieldDef, index);
        };

        scope.removeWildcard = function () {
          Logger.logInteraction(Logger.actions.REMOVE_WILDCARD, scope.fieldDef);
          Pills.removeWildcard(scope.fieldDef);
        };

        // TODO(https://github.com/vega/vega-lite-ui/issues/187):
        // consider if we can use validator / cql instead
        var thisType = {
          "Type": {
            "QUANTITATIVE": "quantitative",
            "quantitative": "QUANTITATIVE",
            "ORDINAL": "ordinal",
            "ordinal": "ORDINAL",
            "TEMPORAL": "temporal",
            "temporal": "TEMPORAL",
            "NOMINAL": "nominal",
            "nominal": "NOMINAL"
          },
          "QUANTITATIVE": "quantitative",
          "ORDINAL": "ordinal",
          "TEMPORAL": "temporal",
          "NOMINAL": "nominal",
          "SHORT_TYPE": {
            "quantitative": "Q",
            "temporal": "T",
            "nominal": "N",
            "ordinal": "O"
          },
          "TYPE_FROM_SHORT_TYPE": {
            "Q": "quantitative",
            "T": "temporal",
            "O": "ordinal",
            "N": "nominal"
          }
        };
        var allowedCasting = {
          integer: [thisType.QUANTITATIVE, thisType.ORDINAL, thisType.NOMINAL],
          number: [thisType.QUANTITATIVE, thisType.ORDINAL, thisType.NOMINAL],
          date: [thisType.TEMPORAL],
          string: [thisType.NOMINAL],
          boolean: [thisType.NOMINAL],
          all: [thisType.QUANTITATIVE, thisType.TEMPORAL, thisType.ORDINAL, thisType.NOMINAL]
        };

        var unwatchFieldDef = scope.$watch('fieldDef', function (fieldDef) {
          if (cql.enumSpec.isEnumSpec(fieldDef.field)) {
            scope.allowedTypes = allowedCasting.all;
          } else {
            scope.allowedTypes = allowedCasting[fieldDef.primitiveType];
          }

          scope.isAnyField = cql.enumSpec.isEnumSpec(fieldDef.field);
        });

        scope.fieldTitle = function (field) {
          if (cql.enumSpec.isEnumSpec(field)) {
            return (field.enum || ['Wildcard'])
              .map(function (field) {
                return field === '*' ? 'COUNT' : field;
              }).join(',');
          }
          return field;
        };

        scope.$on('$destroy', function () {
          scope.fieldAdd = null;
          scope.fieldDragStop = null;
          scope.isEnumSpec = null;

          unwatchFieldDef();
        });
      }
    };
  }]);
}());

;(function() {
'use strict';

angular.module('vlui')
  .directive('shelves', function () {

    return {
      templateUrl: 'components/shelves/shelves.html',
      restrict: 'E',
      scope: {
        spec: '=',
        preview: '<',
        supportAny: '<',
        supportAutoMark: '<',
        filterManager: '=',
        chron: '<',
        ecconfig:'='
      },
      replace: true,
      link: function () {
        return function () {

        };
      },
      controller: ['$scope', '$timeout', 'ANY', 'Config', 'Dataset', 'Logger', 'Pills', function ($scope, $timeout, ANY, Config, Dataset, Logger, Pills) {

        $scope.ANY = ANY;
        $scope.anyChannelIds = [];
        $scope.Dataset = Dataset;
        $scope.freshModel = true;
        
        $scope.min = 0;
        $scope.max = 100;
        // $scope.marks = ['point', 'tick', 'bar', 'line', 'area', 'text'];
        $scope.marks = ['pie', 'gauge', 'bmap','mixed','scatter','radar','single', 'funnel'];
        $scope.echartthemelist = [{ v: 'infographic', t: '样式一' }, { v: 'macarons', t: '样式二' }, { v: 'shine', t: '样式三' }, { v: 'dark', t: '样式四' }, { v: 'roma', t: '样式五' }];
      
        $scope.marksicon = {
          "pie": {
            icon: 'fa-pie-chart',
            title: '饼状图'
          },
          "gauge": {
            icon: 'fa-tachometer',
            title: '仪表盘'
          },
          "bmap": {
            icon: 'fa-location-arrow',
            title: '地图'
          },

          "mixed":{
            icon:'fa-tachometer',
            title:'混合'
          },
          "scatter":{
            icon:'fa-tachometer',
            title:'散点'
          },
          "radar":{
            icon:'fa-tachometer',
            title:'雷达图'
          },
          "single":{
            icon:'fa-tachometer',
            title:'单指标'
          },
          "funnel":{
            icon:'fa-tachometer',
            title:'漏斗图'
          }
        };
        $scope.ifechart = false;
        $scope.tab = 'tab1';
        $scope.echartShape = ['pie', 'gauge', 'bmap','mixed','scatter','radar','single','funnel'];

        // $scope.marksicon[ANY] = {
        //   icon: 'fa-bullseye',
        //   title: '自动'
        // };
        $scope.showmarktype = false;
        $scope.changetype = function (mark) {
          $scope.spec.mark = mark;
          $scope.markdetail = $scope.marksicon[mark];
          $scope.showmarktype = false;
        };
        $scope.spec.mark = 'pie';
        $scope.markdetail = $scope.marksicon['pie'];
        $scope.marksWithAny = $scope.marks;

        $scope.markChange = function () {
          Logger.logInteraction(Logger.actions.MARK_CHANGE, $scope.spec.mark);
        };

      
        $scope.setTab = function(tab){
          $scope.tab = tab;
        };
        $scope.clear = function () {
          Logger.logInteraction(Logger.actions.SPEC_CLEAN, $scope.spec);
          Pills.reset();
        };

        $scope.$watch('ecconfig.title',function(val){
          if($scope.ecconfig && $scope.ecconfig.title){
            $scope.normalTitle = angular.copy(val.text );
            $scope.normalSubTitle = angular.copy(val.subtext);
            $scope.normalTitlePosition = angular.copy(val.left);
            $scope.titletextcolor = angular.copy(val.textStyle.color);
            $scope.subtitletextcolor = angular.copy(val.subtextStyle.color);
          }
        },true);

        $scope.$watch('ecconfig.option',function(val){
          if($scope.ecconfig && $scope.ecconfig.option && $scope.ecconfig.data.type === 'single'){
            $scope.border_color = val.thermometer.bordercolor;
            $scope.bar_color = val.thermometer.barcolor;
            $scope.point_color = val.thermometer.pointcolor;
            $scope.title_color = val.thermometer.titlecolor;
            $scope.value_color = val.card.valuecolor;
            $scope.fill_color = val.card.fillcolor;
            $scope.stroke_color = val.card.strokecolor;
          }
        },true);
        $scope.$watch('spec.mark', function (mark) {
          $scope.markdetail = $scope.marksicon[mark];
          if ($scope.echartShape.indexOf(mark) >= 0) {
            $scope.ifechart = true;
          }
          else {
            $scope.ifechart = false;
          }
        });
        $timeout(function () {
          $(".color-input-title").colorpicker().on('changeColor', function () {
            if ($(this).attr('rel') === 'bt') {
              $scope.titletextcolor = $(this).val();
            }
            if ($(this).attr('rel') === 'sbt') {
              $scope.subtitletextcolor = $(this).val();
            }
        }); });
        
        $scope.$watch('ecconfig.type',function(type){
          if(type){
              $timeout(function () {
                $(".color-input-single").colorpicker().on('changeColor', function () {
                  if ($(this).attr('rel') === 'border') {
                    $scope.border_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'point') {
                    $scope.point_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'bar') {
                    $scope.bar_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'title') {
                    $scope.title_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'fill') {
                    $scope.fill_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'stroke') {
                    $scope.stroke_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'value') {
                    $scope.value_color = $(this).val();
                  }
                  
                });
              });
          }
        });
        $scope.setNormalTitle = function (title_type) {
          if ($scope.freshModel) {
            if (title_type === 'title') {
              $scope.ecconfig.title.text = angular.copy($scope.normalTitle);
            }
            else {
              $scope.ecconfig.title.subtext = angular.copy($scope.normalSubTitle);
            }
          }
        };
        $scope.setTop = function () {
          if ($scope.freshModel) {
            if ($scope.ecconfig.mapdata.order_modal !== '0') {
              $scope.ecconfig.mapdata.top_num = angular.copy($scope.top_num);
            }
          }
        };
        $scope.setColor = function (type) {
          if (type === 'border') {
            $scope.ecconfig.option.thermometer.bordercolor = angular.copy($scope.border_color);
          }
          if(type === 'point'){
            $scope.ecconfig.option.thermometer.pointcolor = angular.copy($scope.point_color);
          }
          
          if(type === 'bar'){
            $scope.ecconfig.option.thermometer.barcolor = angular.copy($scope.bar_color);
          }

          if(type === "title"){
            $scope.ecconfig.option.thermometer.titlecolor = angular.copy($scope.title_color);
            $scope.ecconfig.option.card.titlecolor = angular.copy($scope.title_color);
          }
          if(type === 'fill'){
            $scope.ecconfig.option.card.fillcolor = angular.copy($scope.fill_color);
          }
          if(type === 'stroke'){
            $scope.ecconfig.option.card.strokecolor = angular.copy($scope.stroke_color);
          }
          if(type === 'value'){
            $scope.ecconfig.option.card.valuecolor = angular.copy($scope.value_color);
          }
          if(type === 'bt'){
            $scope.ecconfig.title.textStyle.color = angular.copy($scope.titletextcolor);
          }

          if(type === 'sbt'){
            $scope.ecconfig.title.subtextStyle.color = angular.copy($scope.subtitletextcolor);
          }
        };
        $scope.setOrder = function () {
          if ($scope.freshModel) {
            $scope.ecconfig.mapdata.order_modal = angular.copy($scope.order_modal);
          }
        };
        $scope.setTitlePosition = function () {
          if ($scope.freshModel) {
            $scope.ecconfig.mapdata.map_title_left = angular.copy($scope.map_title_left);
          }
        };

        $scope.setNormalTitlePosition = function () {
          if ($scope.freshModel) {
            $scope.ecconfig.title.left = angular.copy($scope.normalTitlePosition);
          }
        };
        //mixed 
        $scope.mixedyFieldDrop = function(){
          $scope.ymodel.type = 'bar';
          $scope.ymodel.truetype = 'bar';
          $scope.ymodel.isarea = '0';
          $scope.ymodel.autoColor = 'true';
          $scope.ymodel.color = "#333";
          $scope.ymodel.label = {
            normal:{
              show:'true',
              position:'top',
              rotate:'0'
            }
          };
          $scope.ecconfig.field.y.push(angular.copy($scope.ymodel));
        };

        $scope.pointFieldDrop  = function(){
          $scope.pointModel.color = "#333";
          $scope.pointModel.iftop = 'false';
          $scope.pointModel.order = 'asc';
          $scope.pointModel.order_num = '5';
          $scope.pointModel.top_color = 'blue';
          $scope.ecconfig.point.push({
            x:angular.copy($scope.pointModel),
            y:{}
          });
        };
        $scope.hasLegend = function(mark){
          if(['mixed','pie','funnel','scatter','radar'].indexOf(mark) >= 0){
            return true;
          }
          else{
            return false;
          }
        };
        $scope.piexFieldDrop = function(){
          $scope.piexmodel.label = {
            show:'true',
            position:'inside',
            showpercent:'true'
          };
          $scope.ecconfig.field.x.push(angular.copy($scope.piexmodel));
        };

        $scope.gaugeYFieldDrop = function(){
          $scope.gaugeY.name = "";
          $scope.gaugeY.showPercent = "false";
          $scope.gaugeY.autoMax = "false";
          $scope.gaugeY.maxField = {};
          $scope.gaugeY.max = "100";
          $scope.gaugeY.style = {
            axisLine:{
              lineStyle:{
                width: 10
              }
            },
            axisTick:{
              length: '15',        // 属性length控制线长
              lineStyle: {       // 属性lineStyle控制线条样式
                  color: 'auto'
              }
            },
            splitLine:{
              length: '20',         // 属性length控制线长
              lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                  color: 'auto'
              }
            },
            detail:{
              fontSize:'12'
            },
            title:{
              fontSize:'20'
            }
          };
          $scope.ecconfig.field.y.push(angular.copy($scope.gaugeY));
        };

        $scope.singleFieldDrop = function(){
          $scope.singleModel.label = angular.copy($scope.singleModel.field);
          $scope.singleModel.unit = "";
          $scope.singleModel.fontsize = '12';
          $scope.ecconfig.field.y.push(angular.copy($scope.singleModel));
        };

        $scope.removeMix = function(field,num) {
          if (Array.isArray($scope.ecconfig.field[field])) { 
            $scope.ecconfig.field[field].splice(num,1);
          }
          else{
            $scope.ecconfig.field[field] = {};
          }
        };
        $scope.removePoint = function(field,num){
          if(field == 'x'){
            var a = confirm('是否删除这个标记');
            if(a){
              $scope.ecconfig.point.splice(num,1);
            }
          }
          else{
            $scope.ecconfig.point[num].y = {};
          }
        };

        $scope.removeArea = function(field){
          $scope.ecconfig.area[field] = {};
        };
        // var specWatcher = $scope.$watch('spec', function (spec) {
        //   // populate anyChannelIds so we show all or them
        //   if ($scope.supportAny) {
        //     $scope.anyChannelIds = util.keys(spec.encoding).reduce(function (anyChannelIds, channelId) {
        //       if (Pills.isAnyChannel(channelId)) {
        //         anyChannelIds.push(channelId);
        //       }
        //       return anyChannelIds;
        //     }, []);
        //   }
        //   // Only call Pills.update, which will trigger Spec.spec to update if it's not a preview.
        //   if (!$scope.preview) {
        //     var Spec = Pills.update(spec);
        //     var logData = null;
        //     if (Spec) {
        //       if (Spec.charts) {
        //         logData = { specific: false, numCharts: Spec.charts.length };
        //       } else if (Spec.chart) {
        //         logData = { specific: true };
        //       } else {
        //         logData = { specific: false, numCharts: 0 };
        //       }
        //     }
        //     Logger.logInteraction(Logger.actions.SPEC_CHANGE, spec, logData);
        //   }
        // }, true); //, true /* watch equality rather than reference */);


        $scope.$on('$destroy', function () {
          // Clean up watcher
          specWatcher();
        });
      }]
    };
  });
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:tab
 * @description
 * # tab
 */
angular.module('vlui')
  .directive('tab', function() {
    return {
      templateUrl: 'components/tabs/tab.html',
      restrict: 'E',
      require: '^^tabset',
      replace: true,
      transclude: true,
      scope: {
        heading: '@'
      },
      link: function(scope, element, attrs, tabsetController) {
        tabsetController.addTab(scope);
      }
    };
  });
}());

;(function() {
'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:tabset
 * @description
 * # tabset
 */
angular.module('vlui')
  .directive('tabset', function() {
    return {
      templateUrl: 'components/tabs/tabset.html',
      restrict: 'E',
      transclude: true,

      // Interface for tabs to register themselves
      controller: function() {
        var self = this;

        this.tabs = [];

        this.addTab = function(tabScope) {
          // First tab is always auto-activated; others auto-deactivated
          tabScope.active = self.tabs.length === 0;
          self.tabs.push(tabScope);
        };

        this.showTab = function(selectedTab) {
          self.tabs.forEach(function(tab) {
            // Activate the selected tab, deactivate all others
            tab.active = tab === selectedTab;
          });
        };
      },

      // Expose controller to templates as "tabset"
      controllerAs: 'tabset'
    };
  });
}());

;(function() {
'use strict';

angular.module('vlui')
  .filter('compactJSON', ['JSON3', function(JSON3) {
    return function(input) {
      return JSON3.stringify(input, null, '  ', 80);
    };
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc filter
 * @name vega-lite-ui.filter:encodeUri
 * @function
 * @description
 * # encodeUri
 * Filter in the vega-lite-ui.
 */
angular.module('vlui')
  .filter('encodeURI', function () {
    return function (input) {
      return window.encodeURI(input);
    };
  });
}());

;(function() {
'use strict';

/**
 * @ngdoc filter
 * @name facetedviz.filter:reportUrl
 * @function
 * @description
 * # reportUrl
 * Filter in the facetedviz.
 */
angular.module('vlui')
  .filter('reportUrl', ['compactJSONFilter', '_', 'consts', function (compactJSONFilter, _, consts) {
    function voyagerReport(params) {
      var url = 'https://docs.google.com/forms/d/1T9ZA14F3mmzrHR7JJVUKyPXzrMqF54CjLIOjv2E7ZEM/viewform?';

      if (params.fields) {
        var query = encodeURI(compactJSONFilter(_.values(params.fields)));
        url += 'entry.1245199477=' + query + '&';
      }

      if (params.spec) {
        var spec = _.omit(params.spec, 'config');
        spec = encodeURI(compactJSONFilter(spec));
        url += 'entry.1323680136=' + spec + '&';
      }

      if (params.spec2) {
        var spec2 = _.omit(params.spec2, 'config');
        spec2 = encodeURI(compactJSONFilter(spec2));
        url += 'entry.853137786=' + spec2 + '&';
      }

      var typeProp = 'entry.1940292677=';
      switch (params.type) {
        case 'vl':
          url += typeProp + 'Visualization+Rendering+(Vegalite)&';
          break;
        case 'vr':
          url += typeProp + 'Recommender+Algorithm+(Visrec)&';
          break;
        case 'fv':
          url += typeProp + 'Recommender+UI+(FacetedViz)&';
          break;

      }
      return url;
    }

    function vluiReport(params) {
      var url = 'https://docs.google.com/forms/d/1xKs-qGaLZEUfbTmhdmSoS13OKOEpuu_NNWE5TAAml_Y/viewform?';
      if (params.spec) {
        var spec = _.omit(params.spec, 'config');
        spec = encodeURI(compactJSONFilter(spec));
        url += 'entry.1245199477=' + spec + '&';
      }
      return url;
    }

    return consts.appId === 'voyager' ? voyagerReport : vluiReport;
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc filter
 * @name vega-lite-ui.filter:underscore2space
 * @function
 * @description
 * # underscore2space
 * Filter in the vega-lite-ui.
 */
angular.module('vlui')
  .filter('underscore2space', function () {
    return function (input) {
      return input ? input.replace(/_+/g, ' ') : '';
    };
  });
}());

;(function() {
'use strict';

angular.module('vlui')
  .service('Chart', ['cql', '_', function (cql, _) {
    var Chart = {
      getChart: getChart,
      transpose: transpose
    };

    /**
     *
     * @param {SpecQueryModelGroup | SpecQueryModel} item
     */
    function getChart(item) {
      if (!item) {
        return {
          /** @type {Object} concise spec generated */
          vlSpec: null,
          fieldSet: null,

          /** @type {String} generated vl shorthand */
          shorthand: null,
          enumSpecIndex: null
        };
      }

      var specM = item instanceof cql.model.SpecQueryModelGroup ?
        item.getTopSpecQueryModel():
        item;
      return {
        enumSpecIndex: specM.enumSpecIndex,
        fieldSet: specM.specQuery.encodings,
        vlSpec: specM.toSpec(),
        shorthand: specM.toShorthand()
      };
    }

    function transpose(spec) {
      var encoding = _.clone(spec.encoding);
      var oldXEnc = encoding.x;
      var oldYEnc = encoding.y;
      encoding.y = oldXEnc;
      encoding.x = oldYEnc;

      var oldRowEnc = encoding.row;
      var oldColEnc = encoding.column;
      encoding.row = oldColEnc;
      encoding.column = oldRowEnc;

      spec.encoding = encoding;
    }

    return Chart;
  }]);
}());

;(function() {
'use strict';

// Service for the spec config.
// We keep this separate so that changes are kept even if the spec changes.
angular.module('vlui')
  .factory('Config', function() {
    var Config = {};

    Config.data = {};
    Config.config = {};

    Config.getConfig = function() {
      return {};
    };

    Config.getData = function() {
      return Config.data;
    };

    Config.large = function() {
      return {
        cell: {
          width: 300,
          height: 300
        },
        facet: {
          cell: {
            width: 150,
            height: 150
          }
        },
        overlay: {line: true},
        scale: {useRawDomain: true}
      };
    };

    Config.small = function() {
      return {
        facet: {
          cell: {
            width: 150,
            height: 150
          }
        },
        overlay: {line: true},
        scale: {useRawDomain: true}
      };
    };

    Config.updateDataset = function(dataset, type) {
      if (dataset.values) {
        Config.data.values = dataset.values;
        delete Config.data.url;
        Config.data.formatType = undefined;
      } else {
        Config.data.url = dataset.url;
        delete Config.data.values;
        Config.data.formatType = type;
      }
    };

    return Config;
  });
}());

;(function() {
'use strict';

angular.module('vlui')
  .service('FilterManager', ['_', 'Dataset', 'Logger', function (_, Dataset, Logger) {
    var self = this;

    /** local object for this object */
    self.filterIndex = {};

    this.toggle = function(field) {
      if (!self.filterIndex[field]) {
        self.filterIndex[field] = initFilter(field);
      } else {
        self.filterIndex[field].enabled = !self.filterIndex[field].enabled;
      }
      Logger.logInteraction(
        self.filterIndex[field].enabled ? Logger.actions.FILTER_ENABLED : Logger.actions.FILTER_DISABLED,
        field,
        self.filterIndex[field]
      );
    };

    this.add = function(field) {
      if (!self.filterIndex[field]) {
        self.filterIndex[field] = initFilter(field);
        Logger.logInteraction(Logger.actions.FILTER_ENABLED, field, self.filterIndex[field]);
        return true;
      }
      else if(self.filterIndex[field]&&!self.filterIndex[field].enabled)// jnp fixed delete bug
      {
        self.filterIndex[field].enabled = true;
        return true;
      }
      return false;
    }

    this.reset = function(oldFilter, hard) {
      if (hard) {
        self.filterIndex = {};
      } else {
        _.forEach(self.filterIndex, function(value, field) {
          if (self.filterIndex[field].enabled) {
            self.filterIndex[field] = initFilter(field);
          }
        });
      }

      if (oldFilter) {
        oldFilter.forEach(function(filter) {
          self.filterIndex[filter.field] = angular.extend({enabled: true}, filter);
        });
      }

      return self.filterIndex;
    };

    this.getVlFilter = function() {
      var vlFilter = _.reduce(self.filterIndex, function (filters, filter) {
        var field = filter.field;
        var timeUnit = filter.timeUnit;

        if (filter.in) {
          if ( filter.in.length === 0 ||
               filter.in.length === Dataset.schema.cardinality({field: field}) ) {
            return filters;
          }
        } else if (filter.range) {
          var domain = Dataset.schema.domain({
            field: field,
            timeUnit: timeUnit
          });

          if (filter.range[0] === domain[0] && filter.range[1] === domain[1]) {
            return filters;
          }
        }

        if (filter.enabled) {
          filters.push(_.omit(filter, 'enabled'));
        }
        return filters;
      }, []);

      return vlFilter.length ? vlFilter : undefined;
    };

    function initFilter(field) {
      var type = Dataset.schema.type(field);
      var thisType = {
        "Type": {
          "QUANTITATIVE": "quantitative",
          "quantitative": "QUANTITATIVE",
          "ORDINAL": "ordinal",
          "ordinal": "ORDINAL",
          "TEMPORAL": "temporal",
          "temporal": "TEMPORAL",
          "NOMINAL": "nominal",
          "nominal": "NOMINAL"
        },
        "QUANTITATIVE": "quantitative",
        "ORDINAL": "ordinal",
        "TEMPORAL": "temporal",
        "NOMINAL": "nominal",
        "SHORT_TYPE": {
          "quantitative": "Q",
          "temporal": "T",
          "nominal": "N",
          "ordinal": "O"
        },
        "TYPE_FROM_SHORT_TYPE": {
          "Q": "quantitative",
          "T": "temporal",
          "O": "ordinal",
          "N": "nominal"
        }
      };
      switch (type) {
        case thisType.NOMINAL:
        case thisType.ORDINAL:
          return {
            enabled: true,
            field: field,
            in: Dataset.schema.domain({field: field})
          };
        case thisType.QUANTITATIVE:
          return {
            enabled: true,
            field: field,
            range: [
              Dataset.schema.stats({field: field}).min,
              Dataset.schema.stats({field: field}).max
            ]
          };
        case thisType.TEMPORAL:
          return {
            enabled: true,
            field: field,
            range: [
              Dataset.schema.stats({field: field}).min,
              Dataset.schema.stats({field: field}).max
            ]
          };
      }
    }
  }]);
}());

;(function() {
'use strict';

/**
 * @ngdoc service
 * @name vega-lite-ui.logger
 * @description
 * # logger
 * Service in the vega-lite-ui.
 */
angular.module('vlui')
  .service('Logger', ['$location', '$window', '$webSql', '_', 'consts', 'Analytics', 'Papa', 'Blob', 'URL', function ($location, $window, $webSql, _, consts, Analytics, Papa, Blob, URL) {

    var service = {};

    service.levels = {
      OFF: {id:'OFF', rank:0},
      TRACE: {id:'TRACE', rank:1},
      DEBUG: {id:'DEBUG', rank:2},
      INFO: {id:'INFO', rank:3},
      WARN: {id:'WARN', rank:4},
      ERROR: {id:'ERROR', rank:5},
      FATAL: {id:'FATAL', rank:6}
    };

    service.actions = {
      // DATA
      INITIALIZE: {category: 'DATA', id: 'INITIALIZE', level: service.levels.DEBUG},
      UNDO: {category: 'DATA', id: 'UNDO', level: service.levels.INFO},
      REDO: {category: 'DATA', id: 'REDO', level: service.levels.INFO},
      DATASET_CHANGE: {category: 'DATA', id: 'DATASET_CHANGE', level: service.levels.INFO},
      DATASET_OPEN: {category: 'DATA', id: 'DATASET_OPEN', level: service.levels.INFO},
      DATASET_NEW_PASTE: {category: 'DATA', id: 'DATASET_NEW_PASTE', level: service.levels.INFO},
      DATASET_NEW_URL: {category: 'DATA', id: 'DATASET_NEW_URL', level: service.levels.INFO},
      // BOOKMARK
      BOOKMARK_ADD: {category: 'BOOKMARK', id:'BOOKMARK_ADD', level: service.levels.INFO},
      BOOKMARK_REMOVE: {category: 'BOOKMARK', id:'BOOKMARK_REMOVE', level: service.levels.INFO},
      BOOKMARK_OPEN: {category: 'BOOKMARK', id:'BOOKMARK_OPEN', level: service.levels.INFO},
      BOOKMARK_CLOSE: {category: 'BOOKMARK', id:'BOOKMARK_CLOSE', level: service.levels.INFO},
      BOOKMARK_CLEAR: {category: 'BOOKMARK', id: 'BOOKMARK_CLEAR', level: service.levels.INFO},
      BOOKMARK_ANNOTATE: {category: 'BOOKMARK', id: 'BOOKMARK_ANNOTATE', level: service.levels.INFO},
      // CHART
      CHART_MOUSEOVER: {category: 'CHART', id:'CHART_MOUSEOVER', level: service.levels.DEBUG},
      CHART_MOUSEOUT: {category: 'CHART', id:'CHART_MOUSEOUT', level: service.levels.DEBUG},
      CHART_RENDER: {category: 'CHART', id:'CHART_RENDER', level: service.levels.DEBUG},
      CHART_EXPOSE: {category: 'CHART', id:'CHART_EXPOSE', level: service.levels.DEBUG},
      CHART_TOOLTIP: {category: 'CHART', id:'CHART_TOOLTIP', level: service.levels.DEBUG},
      CHART_TOOLTIP_END: {category: 'CHART', id:'CHART_TOOLTIP_END', level: service.levels.DEBUG},

      SORT_TOGGLE: {category: 'CHART', id:'SORT_TOGGLE', level: service.levels.INFO},
      MARK_TOGGLE: {category: 'CHART', id:'MARK_TOGGLE', level: service.levels.INFO},
      DRILL_DOWN_OPEN: {category: 'CHART', id:'DRILL_DOWN_OPEN', level: service.levels.INFO},
      DRILL_DOWN_CLOSE: {category: 'CHART', id: 'DRILL_DOWN_CLOSE', level: service.levels.INFO},
      LOG_TOGGLE: {category: 'CHART', id: 'LOG_TOGGLE', level: service.levels.INFO},
      TRANSPOSE_TOGGLE: {category: 'CHART', id: 'TRANSPOSE_TOGGLE', level: service.levels.INFO},
      NULL_FILTER_TOGGLE: {category: 'CHART', id:'NULL_FILTER_TOGGLE', level: service.levels.INFO},

      CLUSTER_SELECT: {category: 'CHART', id:'CLUSTER_SELECT', level: service.levels.INFO},
      LOAD_MORE: {category: 'CHART', id:'LOAD_MORE', level: service.levels.INFO},

      // FIELDS
      FIELDS_CHANGE: {category: 'FIELDS', id: 'FIELDS_CHANGE', level: service.levels.INFO},
      FIELDS_RESET: {category: 'FIELDS', id: 'FIELDS_RESET', level: service.levels.INFO},
      FUNC_CHANGE: {category: 'FIELDS', id: 'FUNC_CHANGE', level: service.levels.INFO},
      ADD_FIELD: {category: 'FIELDS', id: 'ADD_FIELD', level: service.levels.INFO},

      // Field Info
      FIELDDEF_HIGHLIGHTED: {category: 'FIELDINFO', id: 'FIELDDEF_HIGHLIGHTED', level: service.levels.INFO},
      FIELDDEF_UNHIGHLIGHTED: {category: 'FIELDINFO', id: 'FIELDDEF_UNHIGHLIGHTED', level: service.levels.INFO},

      // WILDCARD
      ADD_WILDCARD: {category: 'WILDCARD', id: 'ADD_WILDCARD', level: service.levels.INFO},
      ADD_WILDCARD_FIELD: {category: 'WILDCARD', id: 'ADD_WILDCARD_FIELD', level: service.levels.INFO},
      REMOVE_WILDCARD_FIELD: {category: 'WILDCARD', id: 'REMOVE_WILDCARD_FIELD', level: service.levels.INFO},
      REMOVE_WILDCARD: {category: 'WILDCARD', id: 'REMOVE_WILDCARD', level: service.levels.INFO},

      // POLESTAR
      SPEC_CLEAN: {category:'POLESTAR', id: 'SPEC_CLEAN', level: service.levels.INFO},
      SPEC_CHANGE: {category:'POLESTAR', id: 'SPEC_CHANGE', level: service.levels.INFO},
      FIELD_DROP: {category: 'POLESTAR', id: 'FIELD_DROP', level: service.levels.INFO},
      FIELD_REMOVED: {category: 'POLESTAR', id: 'FIELD_REMOVED', level: service.levels.INFO},
      MARK_CHANGE: {category: 'POLESTAR', id: 'MARK_CHANGE', level: service.levels.INFO},

      // Filter
      FILTER_ENABLED: {category:'FILTER', id: 'FILTER_ENABLED', level: service.levels.INFO},
      FILTER_DISABLED: {category:'FILTER', id: 'FILTER_DISABLED', level: service.levels.INFO},
      FILTER_CHANGE: {category:'FILTER', id: 'FILTER_CHANGE', level: service.levels.INFO},
      FILTER_CLEAR: {category:'FILTER', id: 'FILTER_CLEAR', level: service.levels.INFO},

      // Voyager 2
      SPEC_SELECT: {category:'VOYAGER2', id: 'SPEC_SELECT', level: service.levels.INFO},

      // Alternatives
      SET_ALTERNATIVES_TYPE: {category:'ALTERNATIVES', id: 'SET_ALTERNATIVES_TYPE', level: service.levels.INFO},
      TOGGLE_SHOW_ALTERNATIVES: {category:'ALTERNATIVES', id: 'TOGGLE_SHOW_ALTERNATIVES', level: service.levels.INFO},
      TOGGLE_HIDE_ALTERNATIVES: {category:'ALTERNATIVES', id: 'TOGGLE_HIDE_ALTERNATIVES', level: service.levels.INFO},

      // Preview
      SPEC_PREVIEW_ENABLED: {category:'PREVIEW', id: 'SPEC_PREVIEW_ENABLED', level: service.levels.INFO},
      SPEC_PREVIEW_DISABLED: {category:'PREVIEW', id: 'SPEC_PREVIEW_DISABLED', level: service.levels.INFO}
    };

    // create noop service if websql is not supported
    if ($window.openDatabase === undefined) {
      console.warn('No websql support and thus no logging.');
      service.logInteraction = function() {};
      return service;
    }

    // get user id once in the beginning
    var userid = service.userid = $location.search().userid;

    service.db = $webSql.openDatabase('logs', '1.0', 'Logs', 2 * 1024 * 1024);

    service.tableName = 'Logs_' + consts.appId;

    // (zening) TODO: check if the table is correct, do we really need time? will time be automatically added?
    service.createTableIfNotExists = function() {
      service.db.createTable(service.tableName, {
        'userid': {
          'type': 'INTEGER',
          'null': 'NOT NULL'
        },
        'time': {
          'type': 'TIMESTAMP',
          'null': 'NOT NULL'
        },
        'actionCategory': {
          'type': 'TEXT',
          'null': 'NOT NULL'
        },
        'actionId': {
          'type': 'TEXT',
          'null': 'NOT NULL'
        },
        'label': {
          'type': 'TEXT',
          'null': 'NOT NULL'
        },
        'data': {
          'type': 'TEXT'
        }
      });
    };

    service.clear = function() {
      var r = $window.confirm('Really clear the logs?');
      if (r === true) {
        service.db.dropTable(service.tableName);
        service.createTableIfNotExists();
      }
    };

    service.export = function() {
      service.db.selectAll(service.tableName).then(function(results) {
        if (results.rows.length === 0) {
          console.warn('No logs');
          return;
        }

        var rows = [];

        for(var i=0; i < results.rows.length; i++) {
          rows.push(results.rows.item(i));
        }

        var csv = Papa.unparse(rows);

        var csvData = new Blob([csv], { type: 'text/csv' });
        var csvUrl = URL.createObjectURL(csvData);

        var element = angular.element('<a/>');
        element.attr({
          href: csvUrl,
          target: '_blank',
          download: service.tableName + '_' + userid + '_' + new Date().toISOString() + '.csv'
        })[0].click();
      });
    };


    service.logInteraction = function(action, label, data) {
      if (!consts.logging) {
        return;
      }
      var value = data ? data.value : undefined;
      if(action.level.rank >= service.levels[consts.logLevel || 'INFO'].rank) {
        Analytics.trackEvent(action.category, action.id, label, value);

        if (consts.logToWebSql) {
          var row = {
            userid: userid,
            time: new Date().toISOString(),
            actionCategory: action.category,
            actionId: action.id,
            label: _.isObject(label) ? JSON.stringify(label) : label,
            data: data ? JSON.stringify(data) : undefined
          };
          service.db.insert(service.tableName, row);
        }

        if (action.level.rank >= service.levels[consts.logPrintLevel || 'INFO'].rank) {
          console.log('[Logging] ', action.id, label, data);
        }
      }
    };

    service.createTableIfNotExists();
    console.log('app:', consts.appId, 'started');
    service.logInteraction(service.actions.INITIALIZE, consts.appId);

    return service;
  }]);
}());

;(function() {
'use strict';

angular.module('vlui')
  .service('Pills', ['ANY', 'consts', 'cql', function (ANY, consts, cql) {
    var Pills = {
      // Functions
      isAnyChannel: isAnyChannel,
      getNextAnyChannelId: getNextAnyChannelId,
      getEmptyAnyChannelId: getEmptyAnyChannelId,
      isEnumeratedChannel: isEnumeratedChannel,
      isEnumeratedField: isEnumeratedField,

      get: get,
      // Event
      dragDrop: dragDrop,
      dragStart: dragStart,
      dragStop: dragStop,
      // Event, with handler in the listener

      /** Set a fieldDef for a channel */
      set: set,

      /** Remove a fieldDef from a channel */
      remove: remove,

      countFieldDef: {field: '*',type: 'quantitative'},

      // Data
      // TODO: split between encoding related and non-encoding related
      pills: {},
      highlighted: {},
      /** pill being dragged */
      dragging: null,
      isDraggingWildcard: null,
      /** channelId that's the pill is being dragged from */
      cidDragFrom: null,
      /** Listener  */
      listener: null
    };

    // Add listener type that Pills just pass arguments to its listener
    // FIXME: properly implement listener pattern
    [
      'add', 'parse', 'select', 'preview', 'update', 'reset',
      'rescale', 'sort', 'toggleFilterInvalid', 'transpose',
      'addWildcardField', 'addWildcard', 'removeWildcardField', 'removeWildcard'
    ].forEach(function(listenerType) {
      Pills[listenerType] = function() {
        if (Pills.listener && Pills.listener[listenerType]) {
          return Pills.listener[listenerType].apply(null, arguments);
        }
      };
    });

    /**
     * Returns whether the given channel id is an "any" channel
     *
     * @param {any} channelId
     */
    function isAnyChannel(channelId) {
      return channelId && channelId.indexOf(ANY) === 0; // prefix by ANY
    }
    function getkeys(x) {
      var keys = [], k;
      for (k in x) {keys.push(k);}
      return keys;
    }
    function getEmptyAnyChannelId() {
      var anyChannels = getkeys(Pills.pills).filter(function(channelId) {
        return channelId.indexOf(ANY) === 0;
      });
      for (var i=0 ; i < anyChannels.length; i++) {
        var channelId = anyChannels[i];
        if (!Pills.pills[channelId].field) {
          return channelId;
        }
      }
      throw new Error('No empty any channel available!');
    }

    function getNextAnyChannelId() {
      var i = 0;
      while (Pills.pills[ANY + i]) {
        i++;
      }

      if (!consts.maxAnyShelf || i >= consts.maxAnyShelf) {
        return null;
      }

      return ANY + i;
    }

    /**
     * Set a fieldDef of a pill of a given channelId
     * @param channelId channel id of the pill to be updated
     * @param fieldDef fieldDef to to be updated
     * @param update whether to propagate change to the channel update listener
     */
    function set(channelId, fieldDef, update) {
      Pills.pills[channelId] = fieldDef;

      if (update && Pills.listener) {
        Pills.listener.set(channelId, fieldDef);
      }
    }

    /**
     * Get a fieldDef of a pill of a given channelId
     */
    function get(channelId) {
      return Pills.pills[channelId];
    }

    function isEnumeratedChannel(channelId) {
      if (Pills.listener && Pills.listener.isEnumeratedChannel) {
        return Pills.listener.isEnumeratedChannel(channelId, Pills.pills[channelId]);
      }
      return false;
    }

    function isEnumeratedField(channelId) {
      if (Pills.listener && Pills.listener.isEnumeratedField) {
        return Pills.listener.isEnumeratedField(channelId, Pills.pills[channelId]);
      }
      return false;
    }

    function remove(channelId) {
      delete Pills.pills[channelId];
      if (Pills.listener) {
        Pills.listener.remove(channelId);
      }
    }

    /**
     * @param {any} pill pill being dragged
     * @param {any} cidDragFrom channel id that the pill is dragged from
     */
    function dragStart(pill, cidDragFrom) {
      Pills.dragging = pill;
      Pills.isDraggingWildcard = cql.enumSpec.isEnumSpec(pill.field);
      Pills.cidDragFrom = cidDragFrom;
    }

    /** Stop pill dragging */
    function dragStop() {
      Pills.dragging = null;
    }

    /**
     * When a pill is dropped
     * @param cidDragTo  channelId that's the pill is being dragged to
     */
    function dragDrop(cidDragTo) {
      if (Pills.listener) {
        Pills.listener.dragDrop(cidDragTo, Pills.cidDragFrom);
      }
    }

    return Pills;
  }]);
}());

;(function() {
'use strict';

// Service for serving VL Schema
angular.module('vlui')
  .factory('Schema', ['vlSchema', function(vlSchema) {
    var Schema = {};

    Schema.schema = vlSchema;

    Schema.getChannelSchema = function(channel) {
      var def = null;
      var encodingChannelProp = Schema.schema.definitions.Encoding.properties[channel];
      // for detail, just get the flat version
      var ref = encodingChannelProp ?
        (encodingChannelProp.$ref || encodingChannelProp.oneOf[0].$ref) :
        'FieldDef'; // just use the generic version for ANY channel
      def = ref.slice(ref.lastIndexOf('/')+1);
      return Schema.schema.definitions[def];
    };

    return Schema;
  }]);
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzb24zLWNvbXBhY3RzdHJpbmdpZnkuanMiLCJ2bC1zY2hlbWEuanMiLCJpbmRleC5qcyIsInRlbXBsYXRlQ2FjaGVIdG1sLmpzIiwiZGF0YXNldC9jaGFuZ2Vsb2FkZWRkYXRhc2V0LmpzIiwiZGF0YXNldC9kYXRhc2V0LnNlcnZpY2UuanMiLCJkYXRhc2V0L2RhdGFzZXRtb2RhbC5qcyIsImRhdGFzZXQvZGF0YXNldHNlbGVjdG9yLmpzIiwiZGF0YXNldC9zYW1wbGVkYXRhLmpzIiwiY29tcG9uZW50cy9lY2NoYW5uZWwvZWNjaGFubmVsLmpzIiwiY29tcG9uZW50cy9maWVsZGluZm8vZmllbGRpbmZvLmpzIiwiY29tcG9uZW50cy9tb2RhbC9tb2RhbC5qcyIsImNvbXBvbmVudHMvbW9kYWwvbW9kYWxjbG9zZWJ1dHRvbi5qcyIsImNvbXBvbmVudHMvbW9kYWwvbW9kYWxzLnNlcnZpY2UuanMiLCJjb21wb25lbnRzL3NjaGVtYWxpc3Qvc2NoZW1hbGlzdC5qcyIsImNvbXBvbmVudHMvc2NoZW1hbGlzdC9zY2hlbWFsaXN0aXRlbS5qcyIsImNvbXBvbmVudHMvc2hlbHZlcy9zaGVsdmVzLmpzIiwiY29tcG9uZW50cy90YWJzL3RhYi5qcyIsImNvbXBvbmVudHMvdGFicy90YWJzZXQuanMiLCJmaWx0ZXJzL2NvbXBhY3Rqc29uL2NvbXBhY3Rqc29uLmZpbHRlci5qcyIsImZpbHRlcnMvZW5jb2RldXJpL2VuY29kZXVyaS5maWx0ZXIuanMiLCJmaWx0ZXJzL3JlcG9ydHVybC9yZXBvcnR1cmwuZmlsdGVyLmpzIiwiZmlsdGVycy91bmRlcnNjb3JlMnNwYWNlL3VuZGVyc2NvcmUyc3BhY2UuZmlsdGVyLmpzIiwic2VydmljZXMvY2hhcnQvY2hhcnQuc2VydmljZS5qcyIsInNlcnZpY2VzL2NvbmZpZy9jb25maWcuc2VydmljZS5qcyIsInNlcnZpY2VzL2ZpbHRlcm1hbmFnZXIvZmlsdGVybWFuYWdlci5qcyIsInNlcnZpY2VzL2xvZ2dlci9sb2dnZXIuc2VydmljZS5qcyIsInNlcnZpY2VzL3BpbGxzL3BpbGxzLnNlcnZpY2UuanMiLCJzZXJ2aWNlcy9zY2hlbWEvc2NoZW1hLnNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FBS0EsQ0FBQyxDQUFDLFlBQVk7OztFQUdaLElBQUksV0FBVyxPQUFPLFdBQVcsY0FBYyxPQUFPOzs7RUFHdEQsSUFBSSxjQUFjO0lBQ2hCLFlBQVk7SUFDWixVQUFVOzs7O0VBSVosSUFBSSxjQUFjLFlBQVksT0FBTyxZQUFZLFdBQVcsQ0FBQyxRQUFRLFlBQVk7Ozs7OztFQU1qRixJQUFJLE9BQU8sWUFBWSxPQUFPLFdBQVcsVUFBVTtNQUMvQyxhQUFhLGVBQWUsWUFBWSxPQUFPLFdBQVcsVUFBVSxDQUFDLE9BQU8sWUFBWSxPQUFPLFVBQVUsWUFBWTs7RUFFekgsSUFBSSxlQUFlLFdBQVcsY0FBYyxjQUFjLFdBQVcsY0FBYyxjQUFjLFdBQVcsWUFBWSxhQUFhO0lBQ25JLE9BQU87Ozs7O0VBS1QsU0FBUyxhQUFhLFNBQVMsU0FBUztJQUN0QyxZQUFZLFVBQVUsS0FBSztJQUMzQixZQUFZLFVBQVUsS0FBSzs7O0lBRzNCLElBQUksU0FBUyxRQUFRLGFBQWEsS0FBSztRQUNuQyxTQUFTLFFBQVEsYUFBYSxLQUFLO1FBQ25DLFNBQVMsUUFBUSxhQUFhLEtBQUs7UUFDbkMsT0FBTyxRQUFRLFdBQVcsS0FBSztRQUMvQixjQUFjLFFBQVEsa0JBQWtCLEtBQUs7UUFDN0MsWUFBWSxRQUFRLGdCQUFnQixLQUFLO1FBQ3pDLE9BQU8sUUFBUSxXQUFXLEtBQUs7UUFDL0IsYUFBYSxRQUFRLFdBQVcsS0FBSzs7O0lBR3pDLElBQUksT0FBTyxjQUFjLFlBQVksWUFBWTtNQUMvQyxRQUFRLFlBQVksV0FBVztNQUMvQixRQUFRLFFBQVEsV0FBVzs7OztJQUk3QixJQUFJLGNBQWMsT0FBTztRQUNyQixXQUFXLFlBQVk7UUFDdkIsWUFBWSxTQUFTOzs7SUFHekIsSUFBSSxhQUFhLElBQUksS0FBSyxDQUFDO0lBQzNC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TSxxQkFBcUIsSUFBSSxTQUFTLFdBQVcsS0FBSztNQUN4RCxNQUFNLGNBQWM7Ozs7SUFJdEIsU0FBUyxXQUFXO01BQ2xCLE1BQU0sV0FBVzs7Ozs7OztJQU9uQixTQUFTLFNBQVMsV0FBVztNQUMzQixJQUFJLE1BQU0sVUFBVTtRQUNsQixNQUFNLFNBQVMsU0FBUyxXQUFXLE1BQU07Ozs7SUFJN0MsT0FBTzs7QUFFWDs7O0FDbEtBOzs7QUFHQSxRQUFRLE9BQU87R0FDWixRQUFRLHVCQUFVLFNBQVMsVUFBVTtJQUNwQyxJQUFJLFNBQVM7O0lBRWIsT0FBTyxTQUFTOztJQUVoQixPQUFPLG1CQUFtQixTQUFTLFNBQVM7TUFDMUMsSUFBSSxNQUFNO01BQ1YsSUFBSSxzQkFBc0IsT0FBTyxPQUFPLFlBQVksU0FBUyxXQUFXOztNQUV4RSxJQUFJLE1BQU07U0FDUCxvQkFBb0IsUUFBUSxvQkFBb0IsTUFBTSxHQUFHO1FBQzFEO01BQ0YsTUFBTSxJQUFJLE1BQU0sSUFBSSxZQUFZLEtBQUs7TUFDckMsT0FBTyxPQUFPLE9BQU8sWUFBWTs7O0lBR25DLE9BQU87O0FBRVgiLCJmaWxlIjoidmx1aS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxyXG4gKiBKU09OMyB3aXRoIGNvbXBhY3Qgc3RyaW5naWZ5IC0tIE1vZGlmaWVkIGJ5IEthbml0IFdvbmdzdXBoYXNhd2F0LiAgIGh0dHBzOi8vZ2l0aHViLmNvbS9rYW5pdHcvanNvbjNcclxuICpcclxuICogRm9ya2VkIGZyb20gSlNPTiB2My4zLjIgfCBodHRwczovL2Jlc3RpZWpzLmdpdGh1Yi5pby9qc29uMyB8IENvcHlyaWdodCAyMDEyLTIwMTQsIEtpdCBDYW1icmlkZ2UgfCBodHRwOi8va2l0Lm1pdC1saWNlbnNlLm9yZ1xyXG4gKi9cclxuOyhmdW5jdGlvbiAoKSB7XHJcbiAgLy8gRGV0ZWN0IHRoZSBgZGVmaW5lYCBmdW5jdGlvbiBleHBvc2VkIGJ5IGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy4gVGhlXHJcbiAgLy8gc3RyaWN0IGBkZWZpbmVgIGNoZWNrIGlzIG5lY2Vzc2FyeSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIGByLmpzYC5cclxuICB2YXIgaXNMb2FkZXIgPSB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZDtcclxuXHJcbiAgLy8gQSBzZXQgb2YgdHlwZXMgdXNlZCB0byBkaXN0aW5ndWlzaCBvYmplY3RzIGZyb20gcHJpbWl0aXZlcy5cclxuICB2YXIgb2JqZWN0VHlwZXMgPSB7XHJcbiAgICBcImZ1bmN0aW9uXCI6IHRydWUsXHJcbiAgICBcIm9iamVjdFwiOiB0cnVlXHJcbiAgfTtcclxuXHJcbiAgLy8gRGV0ZWN0IHRoZSBgZXhwb3J0c2Agb2JqZWN0IGV4cG9zZWQgYnkgQ29tbW9uSlMgaW1wbGVtZW50YXRpb25zLlxyXG4gIHZhciBmcmVlRXhwb3J0cyA9IG9iamVjdFR5cGVzW3R5cGVvZiBleHBvcnRzXSAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XHJcblxyXG4gIC8vIFVzZSB0aGUgYGdsb2JhbGAgb2JqZWN0IGV4cG9zZWQgYnkgTm9kZSAoaW5jbHVkaW5nIEJyb3dzZXJpZnkgdmlhXHJcbiAgLy8gYGluc2VydC1tb2R1bGUtZ2xvYmFsc2ApLCBOYXJ3aGFsLCBhbmQgUmluZ28gYXMgdGhlIGRlZmF1bHQgY29udGV4dCxcclxuICAvLyBhbmQgdGhlIGB3aW5kb3dgIG9iamVjdCBpbiBicm93c2Vycy4gUmhpbm8gZXhwb3J0cyBhIGBnbG9iYWxgIGZ1bmN0aW9uXHJcbiAgLy8gaW5zdGVhZC5cclxuICB2YXIgcm9vdCA9IG9iamVjdFR5cGVzW3R5cGVvZiB3aW5kb3ddICYmIHdpbmRvdyB8fCB0aGlzLFxyXG4gICAgICBmcmVlR2xvYmFsID0gZnJlZUV4cG9ydHMgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIG1vZHVsZV0gJiYgbW9kdWxlICYmICFtb2R1bGUubm9kZVR5cGUgJiYgdHlwZW9mIGdsb2JhbCA9PSBcIm9iamVjdFwiICYmIGdsb2JhbDtcclxuXHJcbiAgaWYgKGZyZWVHbG9iYWwgJiYgKGZyZWVHbG9iYWxbXCJnbG9iYWxcIl0gPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbFtcIndpbmRvd1wiXSA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsW1wic2VsZlwiXSA9PT0gZnJlZUdsb2JhbCkpIHtcclxuICAgIHJvb3QgPSBmcmVlR2xvYmFsO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBJbml0aWFsaXplcyBKU09OIDMgdXNpbmcgdGhlIGdpdmVuIGBjb250ZXh0YCBvYmplY3QsIGF0dGFjaGluZyB0aGVcclxuICAvLyBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBmdW5jdGlvbnMgdG8gdGhlIHNwZWNpZmllZCBgZXhwb3J0c2Agb2JqZWN0LlxyXG4gIGZ1bmN0aW9uIHJ1bkluQ29udGV4dChjb250ZXh0LCBleHBvcnRzKSB7XHJcbiAgICBjb250ZXh0IHx8IChjb250ZXh0ID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcclxuICAgIGV4cG9ydHMgfHwgKGV4cG9ydHMgPSByb290W1wiT2JqZWN0XCJdKCkpO1xyXG5cclxuICAgIC8vIE5hdGl2ZSBjb25zdHJ1Y3RvciBhbGlhc2VzLlxyXG4gICAgdmFyIE51bWJlciA9IGNvbnRleHRbXCJOdW1iZXJcIl0gfHwgcm9vdFtcIk51bWJlclwiXSxcclxuICAgICAgICBTdHJpbmcgPSBjb250ZXh0W1wiU3RyaW5nXCJdIHx8IHJvb3RbXCJTdHJpbmdcIl0sXHJcbiAgICAgICAgT2JqZWN0ID0gY29udGV4dFtcIk9iamVjdFwiXSB8fCByb290W1wiT2JqZWN0XCJdLFxyXG4gICAgICAgIERhdGUgPSBjb250ZXh0W1wiRGF0ZVwiXSB8fCByb290W1wiRGF0ZVwiXSxcclxuICAgICAgICBTeW50YXhFcnJvciA9IGNvbnRleHRbXCJTeW50YXhFcnJvclwiXSB8fCByb290W1wiU3ludGF4RXJyb3JcIl0sXHJcbiAgICAgICAgVHlwZUVycm9yID0gY29udGV4dFtcIlR5cGVFcnJvclwiXSB8fCByb290W1wiVHlwZUVycm9yXCJdLFxyXG4gICAgICAgIE1hdGggPSBjb250ZXh0W1wiTWF0aFwiXSB8fCByb290W1wiTWF0aFwiXSxcclxuICAgICAgICBuYXRpdmVKU09OID0gY29udGV4dFtcIkpTT05cIl0gfHwgcm9vdFtcIkpTT05cIl07XHJcblxyXG4gICAgLy8gRGVsZWdhdGUgdG8gdGhlIG5hdGl2ZSBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBpbXBsZW1lbnRhdGlvbnMuXHJcbiAgICBpZiAodHlwZW9mIG5hdGl2ZUpTT04gPT0gXCJvYmplY3RcIiAmJiBuYXRpdmVKU09OKSB7XHJcbiAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gbmF0aXZlSlNPTi5zdHJpbmdpZnk7XHJcbiAgICAgIGV4cG9ydHMucGFyc2UgPSBuYXRpdmVKU09OLnBhcnNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbnZlbmllbmNlIGFsaWFzZXMuXHJcbiAgICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlLFxyXG4gICAgICAgIGdldENsYXNzID0gb2JqZWN0UHJvdG8udG9TdHJpbmcsXHJcbiAgICAgICAgaXNQcm9wZXJ0eSwgZm9yRWFjaCwgdW5kZWY7XHJcblxyXG4gICAgLy8gVGVzdCB0aGUgYERhdGUjZ2V0VVRDKmAgbWV0aG9kcy4gQmFzZWQgb24gd29yayBieSBAWWFmZmxlLlxyXG4gICAgdmFyIGlzRXh0ZW5kZWQgPSBuZXcgRGF0ZSgtMzUwOTgyNzMzNDU3MzI5Mik7XHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBUaGUgYGdldFVUQ0Z1bGxZZWFyYCwgYE1vbnRoYCwgYW5kIGBEYXRlYCBtZXRob2RzIHJldHVybiBub25zZW5zaWNhbFxyXG4gICAgICAvLyByZXN1bHRzIGZvciBjZXJ0YWluIGRhdGVzIGluIE9wZXJhID49IDEwLjUzLlxyXG4gICAgICBpc0V4dGVuZGVkID0gaXNFeHRlbmRlZC5nZXRVVENGdWxsWWVhcigpID09IC0xMDkyNTIgJiYgaXNFeHRlbmRlZC5nZXRVVENNb250aCgpID09PSAwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDRGF0ZSgpID09PSAxICYmXHJcbiAgICAgICAgLy8gU2FmYXJpIDwgMi4wLjIgc3RvcmVzIHRoZSBpbnRlcm5hbCBtaWxsaXNlY29uZCB0aW1lIHZhbHVlIGNvcnJlY3RseSxcclxuICAgICAgICAvLyBidXQgY2xpcHMgdGhlIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgZGF0ZSBtZXRob2RzIHRvIHRoZSByYW5nZSBvZlxyXG4gICAgICAgIC8vIHNpZ25lZCAzMi1iaXQgaW50ZWdlcnMgKFstMiAqKiAzMSwgMiAqKiAzMSAtIDFdKS5cclxuICAgICAgICBpc0V4dGVuZGVkLmdldFVUQ0hvdXJzKCkgPT0gMTAgJiYgaXNFeHRlbmRlZC5nZXRVVENNaW51dGVzKCkgPT0gMzcgJiYgaXNFeHRlbmRlZC5nZXRVVENTZWNvbmRzKCkgPT0gNiAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbGxpc2Vjb25kcygpID09IDcwODtcclxuICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cclxuXHJcbiAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBuYXRpdmUgYEpTT04uc3RyaW5naWZ5YCBhbmQgYHBhcnNlYFxyXG4gICAgLy8gaW1wbGVtZW50YXRpb25zIGFyZSBzcGVjLWNvbXBsaWFudC4gQmFzZWQgb24gd29yayBieSBLZW4gU255ZGVyLlxyXG4gICAgZnVuY3Rpb24gaGFzKG5hbWUpIHtcclxuICAgICAgaWYgKGhhc1tuYW1lXSAhPT0gdW5kZWYpIHtcclxuICAgICAgICAvLyBSZXR1cm4gY2FjaGVkIGZlYXR1cmUgdGVzdCByZXN1bHQuXHJcbiAgICAgICAgcmV0dXJuIGhhc1tuYW1lXTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgaXNTdXBwb3J0ZWQ7XHJcbiAgICAgIGlmIChuYW1lID09IFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpIHtcclxuICAgICAgICAvLyBJRSA8PSA3IGRvZXNuJ3Qgc3VwcG9ydCBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgdXNpbmcgc3F1YXJlXHJcbiAgICAgICAgLy8gYnJhY2tldCBub3RhdGlvbi4gSUUgOCBvbmx5IHN1cHBvcnRzIHRoaXMgZm9yIHByaW1pdGl2ZXMuXHJcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBcImFcIlswXSAhPSBcImFcIjtcclxuICAgICAgfSBlbHNlIGlmIChuYW1lID09IFwianNvblwiKSB7XHJcbiAgICAgICAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgYm90aCBgSlNPTi5zdHJpbmdpZnlgIGFuZCBgSlNPTi5wYXJzZWAgYXJlXHJcbiAgICAgICAgLy8gc3VwcG9ydGVkLlxyXG4gICAgICAgIGlzU3VwcG9ydGVkID0gaGFzKFwianNvbi1zdHJpbmdpZnlcIikgJiYgaGFzKFwianNvbi1wYXJzZVwiKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgdmFsdWUsIHNlcmlhbGl6ZWQgPSAne1wiYVwiOlsxLHRydWUsZmFsc2UsbnVsbCxcIlxcXFx1MDAwMFxcXFxiXFxcXG5cXFxcZlxcXFxyXFxcXHRcIl19JztcclxuICAgICAgICAvLyBUZXN0IGBKU09OLnN0cmluZ2lmeWAuXHJcbiAgICAgICAgaWYgKG5hbWUgPT0gXCJqc29uLXN0cmluZ2lmeVwiKSB7XHJcbiAgICAgICAgICB2YXIgc3RyaW5naWZ5ID0gZXhwb3J0cy5zdHJpbmdpZnksIHN0cmluZ2lmeVN1cHBvcnRlZCA9IHR5cGVvZiBzdHJpbmdpZnkgPT0gXCJmdW5jdGlvblwiICYmIGlzRXh0ZW5kZWQ7XHJcbiAgICAgICAgICBpZiAoc3RyaW5naWZ5U3VwcG9ydGVkKSB7XHJcbiAgICAgICAgICAgIC8vIEEgdGVzdCBmdW5jdGlvbiBvYmplY3Qgd2l0aCBhIGN1c3RvbSBgdG9KU09OYCBtZXRob2QuXHJcbiAgICAgICAgICAgICh2YWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgfSkudG9KU09OID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID1cclxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggMy4xYjEgYW5kIGIyIHNlcmlhbGl6ZSBzdHJpbmcsIG51bWJlciwgYW5kIGJvb2xlYW5cclxuICAgICAgICAgICAgICAgIC8vIHByaW1pdGl2ZXMgYXMgb2JqZWN0IGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KDApID09PSBcIjBcIiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyLCBhbmQgSlNPTiAyIHNlcmlhbGl6ZSB3cmFwcGVkIHByaW1pdGl2ZXMgYXMgb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAvLyBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgTnVtYmVyKCkpID09PSBcIjBcIiAmJlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBTdHJpbmcoKSkgPT0gJ1wiXCInICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiB0aHJvdyBhbiBlcnJvciBpZiB0aGUgdmFsdWUgaXMgYG51bGxgLCBgdW5kZWZpbmVkYCwgb3JcclxuICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IGRlZmluZSBhIGNhbm9uaWNhbCBKU09OIHJlcHJlc2VudGF0aW9uICh0aGlzIGFwcGxpZXMgdG9cclxuICAgICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBgdG9KU09OYCBwcm9wZXJ0aWVzIGFzIHdlbGwsICp1bmxlc3MqIHRoZXkgYXJlIG5lc3RlZFxyXG4gICAgICAgICAgICAgICAgLy8gd2l0aGluIGFuIG9iamVjdCBvciBhcnJheSkuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoZ2V0Q2xhc3MpID09PSB1bmRlZiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gSUUgOCBzZXJpYWxpemVzIGB1bmRlZmluZWRgIGFzIGBcInVuZGVmaW5lZFwiYC4gU2FmYXJpIDw9IDUuMS43IGFuZFxyXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjMgcGFzcyB0aGlzIHRlc3QuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodW5kZWYpID09PSB1bmRlZiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS43IGFuZCBGRiAzLjFiMyB0aHJvdyBgRXJyb3JgcyBhbmQgYFR5cGVFcnJvcmBzLFxyXG4gICAgICAgICAgICAgICAgLy8gcmVzcGVjdGl2ZWx5LCBpZiB0aGUgdmFsdWUgaXMgb21pdHRlZCBlbnRpcmVseS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSgpID09PSB1bmRlZiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIG5vdCBhIG51bWJlcixcclxuICAgICAgICAgICAgICAgIC8vIHN0cmluZywgYXJyYXksIG9iamVjdCwgQm9vbGVhbiwgb3IgYG51bGxgIGxpdGVyYWwuIFRoaXMgYXBwbGllcyB0b1xyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzIGFzIHdlbGwsIHVubGVzcyB0aGV5IGFyZSBuZXN0ZWRcclxuICAgICAgICAgICAgICAgIC8vIGluc2lkZSBvYmplY3Qgb3IgYXJyYXkgbGl0ZXJhbHMuIFlVSSAzLjAuMGIxIGlnbm9yZXMgY3VzdG9tIGB0b0pTT05gXHJcbiAgICAgICAgICAgICAgICAvLyBtZXRob2RzIGVudGlyZWx5LlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHZhbHVlKSA9PT0gXCIxXCIgJiZcclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdmFsdWVdKSA9PSBcIlsxXVwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBQcm90b3R5cGUgPD0gMS42LjEgc2VyaWFsaXplcyBgW3VuZGVmaW5lZF1gIGFzIGBcIltdXCJgIGluc3RlYWQgb2ZcclxuICAgICAgICAgICAgICAgIC8vIGBcIltudWxsXVwiYC5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWZdKSA9PSBcIltudWxsXVwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBZVUkgMy4wLjBiMSBmYWlscyB0byBzZXJpYWxpemUgYG51bGxgIGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwpID09IFwibnVsbFwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiBoYWx0cyBzZXJpYWxpemF0aW9uIGlmIGFuIGFycmF5IGNvbnRhaW5zIGEgZnVuY3Rpb246XHJcbiAgICAgICAgICAgICAgICAvLyBgWzEsIHRydWUsIGdldENsYXNzLCAxXWAgc2VyaWFsaXplcyBhcyBcIlsxLHRydWUsXSxcIi4gRkYgMy4xYjNcclxuICAgICAgICAgICAgICAgIC8vIGVsaWRlcyBub24tSlNPTiB2YWx1ZXMgZnJvbSBvYmplY3RzIGFuZCBhcnJheXMsIHVubGVzcyB0aGV5XHJcbiAgICAgICAgICAgICAgICAvLyBkZWZpbmUgY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3VuZGVmLCBnZXRDbGFzcywgbnVsbF0pID09IFwiW251bGwsbnVsbCxudWxsXVwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgc2VyaWFsaXphdGlvbiB0ZXN0LiBGRiAzLjFiMSB1c2VzIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlc1xyXG4gICAgICAgICAgICAgICAgLy8gd2hlcmUgY2hhcmFjdGVyIGVzY2FwZSBjb2RlcyBhcmUgZXhwZWN0ZWQgKGUuZy4sIGBcXGJgID0+IGBcXHUwMDA4YCkuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoeyBcImFcIjogW3ZhbHVlLCB0cnVlLCBmYWxzZSwgbnVsbCwgXCJcXHgwMFxcYlxcblxcZlxcclxcdFwiXSB9KSA9PSBzZXJpYWxpemVkICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSBhbmQgYjIgaWdub3JlIHRoZSBgZmlsdGVyYCBhbmQgYHdpZHRoYCBhcmd1bWVudHMuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCwgdmFsdWUpID09PSBcIjFcIiAmJlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFsxLCAyXSwgbnVsbCwgMSkgPT0gXCJbXFxuIDEsXFxuIDJcXG5dXCIgJiZcclxuICAgICAgICAgICAgICAgIC8vIEpTT04gMiwgUHJvdG90eXBlIDw9IDEuNywgYW5kIG9sZGVyIFdlYktpdCBidWlsZHMgaW5jb3JyZWN0bHlcclxuICAgICAgICAgICAgICAgIC8vIHNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycy5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtOC42NGUxNSkpID09ICdcIi0yNzE4MjEtMDQtMjBUMDA6MDA6MDAuMDAwWlwiJyAmJlxyXG4gICAgICAgICAgICAgICAgLy8gVGhlIG1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNSwgYnV0IHJlcXVpcmVkIGluIDUuMS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSg4LjY0ZTE1KSkgPT0gJ1wiKzI3NTc2MC0wOS0xM1QwMDowMDowMC4wMDBaXCInICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDw9IDExLjAgaW5jb3JyZWN0bHkgc2VyaWFsaXplcyB5ZWFycyBwcmlvciB0byAwIGFzIG5lZ2F0aXZlXHJcbiAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IHllYXJzIGluc3RlYWQgb2Ygc2l4LWRpZ2l0IHllYXJzLiBDcmVkaXRzOiBAWWFmZmxlLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC02MjE5ODc1NTJlNSkpID09ICdcIi0wMDAwMDEtMDEtMDFUMDA6MDA6MDAuMDAwWlwiJyAmJlxyXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS41IGFuZCBPcGVyYSA+PSAxMC41MyBpbmNvcnJlY3RseSBzZXJpYWxpemUgbWlsbGlzZWNvbmRcclxuICAgICAgICAgICAgICAgIC8vIHZhbHVlcyBsZXNzIHRoYW4gMTAwMC4gQ3JlZGl0czogQFlhZmZsZS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtMSkpID09ICdcIjE5NjktMTItMzFUMjM6NTk6NTkuOTk5WlwiJztcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gc3RyaW5naWZ5U3VwcG9ydGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUZXN0IGBKU09OLnBhcnNlYC5cclxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tcGFyc2VcIikge1xyXG4gICAgICAgICAgdmFyIHBhcnNlID0gZXhwb3J0cy5wYXJzZTtcclxuICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2UgPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIGEgYmFyZSBsaXRlcmFsIGlzIHByb3ZpZGVkLlxyXG4gICAgICAgICAgICAgIC8vIENvbmZvcm1pbmcgaW1wbGVtZW50YXRpb25zIHNob3VsZCBhbHNvIGNvZXJjZSB0aGUgaW5pdGlhbCBhcmd1bWVudCB0b1xyXG4gICAgICAgICAgICAgIC8vIGEgc3RyaW5nIHByaW9yIHRvIHBhcnNpbmcuXHJcbiAgICAgICAgICAgICAgaWYgKHBhcnNlKFwiMFwiKSA9PT0gMCAmJiAhcGFyc2UoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgcGFyc2luZyB0ZXN0LlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZShzZXJpYWxpemVkKTtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZVN1cHBvcnRlZCA9IHZhbHVlW1wiYVwiXS5sZW5ndGggPT0gNSAmJiB2YWx1ZVtcImFcIl1bMF0gPT09IDE7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjIgYW5kIEZGIDMuMWIxIGFsbG93IHVuZXNjYXBlZCB0YWJzIGluIHN0cmluZ3MuXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSAhcGFyc2UoJ1wiXFx0XCInKTtcclxuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG4gICAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wIGFuZCA0LjAuMSBhbGxvdyBsZWFkaW5nIGArYCBzaWducyBhbmQgbGVhZGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gZGVjaW1hbCBwb2ludHMuIEZGIDQuMCwgNC4wLjEsIGFuZCBJRSA5LTEwIGFsc28gYWxsb3dcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIGNlcnRhaW4gb2N0YWwgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMDFcIikgIT09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAsIDQuMC4xLCBhbmQgUmhpbm8gMS43UjMtUjQgYWxsb3cgdHJhaWxpbmcgZGVjaW1hbFxyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gcG9pbnRzLiBUaGVzZSBlbnZpcm9ubWVudHMsIGFsb25nIHdpdGggRkYgMy4xYjEgYW5kIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIGFsbG93IHRyYWlsaW5nIGNvbW1hcyBpbiBKU09OIG9iamVjdHMgYW5kIGFycmF5cy5cclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIxLlwiKSAhPT0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xyXG4gICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gcGFyc2VTdXBwb3J0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBoYXNbbmFtZV0gPSAhIWlzU3VwcG9ydGVkO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0cnVlKSB7IC8vIHVzZWQgdG8gYmUgIWhhcyhcImpzb25cIilcclxuICAgICAgLy8gQ29tbW9uIGBbW0NsYXNzXV1gIG5hbWUgYWxpYXNlcy5cclxuICAgICAgdmFyIGZ1bmN0aW9uQ2xhc3MgPSBcIltvYmplY3QgRnVuY3Rpb25dXCIsXHJcbiAgICAgICAgICBkYXRlQ2xhc3MgPSBcIltvYmplY3QgRGF0ZV1cIixcclxuICAgICAgICAgIG51bWJlckNsYXNzID0gXCJbb2JqZWN0IE51bWJlcl1cIixcclxuICAgICAgICAgIHN0cmluZ0NsYXNzID0gXCJbb2JqZWN0IFN0cmluZ11cIixcclxuICAgICAgICAgIGFycmF5Q2xhc3MgPSBcIltvYmplY3QgQXJyYXldXCIsXHJcbiAgICAgICAgICBib29sZWFuQ2xhc3MgPSBcIltvYmplY3QgQm9vbGVhbl1cIjtcclxuXHJcbiAgICAgIC8vIERldGVjdCBpbmNvbXBsZXRlIHN1cHBvcnQgZm9yIGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyBieSBpbmRleC5cclxuICAgICAgdmFyIGNoYXJJbmRleEJ1Z2d5ID0gaGFzKFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpO1xyXG5cclxuICAgICAgLy8gRGVmaW5lIGFkZGl0aW9uYWwgdXRpbGl0eSBtZXRob2RzIGlmIHRoZSBgRGF0ZWAgbWV0aG9kcyBhcmUgYnVnZ3kuXHJcbiAgICAgIGlmICghaXNFeHRlbmRlZCkge1xyXG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XHJcbiAgICAgICAgLy8gQSBtYXBwaW5nIGJldHdlZW4gdGhlIG1vbnRocyBvZiB0aGUgeWVhciBhbmQgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW5cclxuICAgICAgICAvLyBKYW51YXJ5IDFzdCBhbmQgdGhlIGZpcnN0IG9mIHRoZSByZXNwZWN0aXZlIG1vbnRoLlxyXG4gICAgICAgIHZhciBNb250aHMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdO1xyXG4gICAgICAgIC8vIEludGVybmFsOiBDYWxjdWxhdGVzIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuIHRoZSBVbml4IGVwb2NoIGFuZCB0aGVcclxuICAgICAgICAvLyBmaXJzdCBkYXkgb2YgdGhlIGdpdmVuIG1vbnRoLlxyXG4gICAgICAgIHZhciBnZXREYXkgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICAgIHJldHVybiBNb250aHNbbW9udGhdICsgMzY1ICogKHllYXIgLSAxOTcwKSArIGZsb29yKCh5ZWFyIC0gMTk2OSArIChtb250aCA9ICsobW9udGggPiAxKSkpIC8gNCkgLSBmbG9vcigoeWVhciAtIDE5MDEgKyBtb250aCkgLyAxMDApICsgZmxvb3IoKHllYXIgLSAxNjAxICsgbW9udGgpIC8gNDAwKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiBhIHByb3BlcnR5IGlzIGEgZGlyZWN0IHByb3BlcnR5IG9mIHRoZSBnaXZlblxyXG4gICAgICAvLyBvYmplY3QuIERlbGVnYXRlcyB0byB0aGUgbmF0aXZlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIG1ldGhvZC5cclxuICAgICAgaWYgKCEoaXNQcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5KSkge1xyXG4gICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgaWYgKChtZW1iZXJzLl9fcHJvdG9fXyA9IG51bGwsIG1lbWJlcnMuX19wcm90b19fID0ge1xyXG4gICAgICAgICAgICAvLyBUaGUgKnByb3RvKiBwcm9wZXJ0eSBjYW5ub3QgYmUgc2V0IG11bHRpcGxlIHRpbWVzIGluIHJlY2VudFxyXG4gICAgICAgICAgICAvLyB2ZXJzaW9ucyBvZiBGaXJlZm94IGFuZCBTZWFNb25rZXkuXHJcbiAgICAgICAgICAgIFwidG9TdHJpbmdcIjogMVxyXG4gICAgICAgICAgfSwgbWVtYmVycykudG9TdHJpbmcgIT0gZ2V0Q2xhc3MpIHtcclxuICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC4zIGRvZXNuJ3QgaW1wbGVtZW50IGBPYmplY3QjaGFzT3duUHJvcGVydHlgLCBidXRcclxuICAgICAgICAgICAgLy8gc3VwcG9ydHMgdGhlIG11dGFibGUgKnByb3RvKiBwcm9wZXJ0eS5cclxuICAgICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgIC8vIENhcHR1cmUgYW5kIGJyZWFrIHRoZSBvYmplY3QncyBwcm90b3R5cGUgY2hhaW4gKHNlZSBzZWN0aW9uIDguNi4yXHJcbiAgICAgICAgICAgICAgLy8gb2YgdGhlIEVTIDUuMSBzcGVjKS4gVGhlIHBhcmVudGhlc2l6ZWQgZXhwcmVzc2lvbiBwcmV2ZW50cyBhblxyXG4gICAgICAgICAgICAgIC8vIHVuc2FmZSB0cmFuc2Zvcm1hdGlvbiBieSB0aGUgQ2xvc3VyZSBDb21waWxlci5cclxuICAgICAgICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLl9fcHJvdG9fXywgcmVzdWx0ID0gcHJvcGVydHkgaW4gKHRoaXMuX19wcm90b19fID0gbnVsbCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgb3JpZ2luYWwgcHJvdG90eXBlIGNoYWluLlxyXG4gICAgICAgICAgICAgIHRoaXMuX19wcm90b19fID0gb3JpZ2luYWw7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENhcHR1cmUgYSByZWZlcmVuY2UgdG8gdGhlIHRvcC1sZXZlbCBgT2JqZWN0YCBjb25zdHJ1Y3Rvci5cclxuICAgICAgICAgICAgY29uc3RydWN0b3IgPSBtZW1iZXJzLmNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgICAvLyBVc2UgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgdG8gc2ltdWxhdGUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW5cclxuICAgICAgICAgICAgLy8gb3RoZXIgZW52aXJvbm1lbnRzLlxyXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgdmFyIHBhcmVudCA9ICh0aGlzLmNvbnN0cnVjdG9yIHx8IGNvbnN0cnVjdG9yKS5wcm90b3R5cGU7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5IGluIHRoaXMgJiYgIShwcm9wZXJ0eSBpbiBwYXJlbnQgJiYgdGhpc1twcm9wZXJ0eV0gPT09IHBhcmVudFtwcm9wZXJ0eV0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbWVtYmVycyA9IG51bGw7XHJcbiAgICAgICAgICByZXR1cm4gaXNQcm9wZXJ0eS5jYWxsKHRoaXMsIHByb3BlcnR5KTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogTm9ybWFsaXplcyB0aGUgYGZvci4uLmluYCBpdGVyYXRpb24gYWxnb3JpdGhtIGFjcm9zc1xyXG4gICAgICAvLyBlbnZpcm9ubWVudHMuIEVhY2ggZW51bWVyYXRlZCBrZXkgaXMgeWllbGRlZCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uXHJcbiAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBzaXplID0gMCwgUHJvcGVydGllcywgbWVtYmVycywgcHJvcGVydHk7XHJcblxyXG4gICAgICAgIC8vIFRlc3RzIGZvciBidWdzIGluIHRoZSBjdXJyZW50IGVudmlyb25tZW50J3MgYGZvci4uLmluYCBhbGdvcml0aG0uIFRoZVxyXG4gICAgICAgIC8vIGB2YWx1ZU9mYCBwcm9wZXJ0eSBpbmhlcml0cyB0aGUgbm9uLWVudW1lcmFibGUgZmxhZyBmcm9tXHJcbiAgICAgICAgLy8gYE9iamVjdC5wcm90b3R5cGVgIGluIG9sZGVyIHZlcnNpb25zIG9mIElFLCBOZXRzY2FwZSwgYW5kIE1vemlsbGEuXHJcbiAgICAgICAgKFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB0aGlzLnZhbHVlT2YgPSAwO1xyXG4gICAgICAgIH0pLnByb3RvdHlwZS52YWx1ZU9mID0gMDtcclxuXHJcbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgUHJvcGVydGllc2AgY2xhc3MuXHJcbiAgICAgICAgbWVtYmVycyA9IG5ldyBQcm9wZXJ0aWVzKCk7XHJcbiAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBtZW1iZXJzKSB7XHJcbiAgICAgICAgICAvLyBJZ25vcmUgYWxsIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxyXG4gICAgICAgICAgaWYgKGlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkpIHtcclxuICAgICAgICAgICAgc2l6ZSsrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBQcm9wZXJ0aWVzID0gbWVtYmVycyA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgaXRlcmF0aW9uIGFsZ29yaXRobS5cclxuICAgICAgICBpZiAoIXNpemUpIHtcclxuICAgICAgICAgIC8vIEEgbGlzdCBvZiBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cclxuICAgICAgICAgIG1lbWJlcnMgPSBbXCJ2YWx1ZU9mXCIsIFwidG9TdHJpbmdcIiwgXCJ0b0xvY2FsZVN0cmluZ1wiLCBcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsIFwiaXNQcm90b3R5cGVPZlwiLCBcImhhc093blByb3BlcnR5XCIsIFwiY29uc3RydWN0b3JcIl07XHJcbiAgICAgICAgICAvLyBJRSA8PSA4LCBNb3ppbGxhIDEuMCwgYW5kIE5ldHNjYXBlIDYuMiBpZ25vcmUgc2hhZG93ZWQgbm9uLWVudW1lcmFibGVcclxuICAgICAgICAgIC8vIHByb3BlcnRpZXMuXHJcbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGxlbmd0aDtcclxuICAgICAgICAgICAgdmFyIGhhc1Byb3BlcnR5ID0gIWlzRnVuY3Rpb24gJiYgdHlwZW9mIG9iamVjdC5jb25zdHJ1Y3RvciAhPSBcImZ1bmN0aW9uXCIgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIG9iamVjdC5oYXNPd25Qcm9wZXJ0eV0gJiYgb2JqZWN0Lmhhc093blByb3BlcnR5IHx8IGlzUHJvcGVydHk7XHJcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgLy8gR2Vja28gPD0gMS4wIGVudW1lcmF0ZXMgdGhlIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyB1bmRlclxyXG4gICAgICAgICAgICAgIC8vIGNlcnRhaW4gY29uZGl0aW9uczsgSUUgZG9lcyBub3QuXHJcbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiBoYXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggbm9uLWVudW1lcmFibGUgcHJvcGVydHkuXHJcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gbWVtYmVycy5sZW5ndGg7IHByb3BlcnR5ID0gbWVtYmVyc1stLWxlbmd0aF07IGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgY2FsbGJhY2socHJvcGVydHkpKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIGlmIChzaXplID09IDIpIHtcclxuICAgICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuNCBlbnVtZXJhdGVzIHNoYWRvd2VkIHByb3BlcnRpZXMgdHdpY2UuXHJcbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgc2V0IG9mIGl0ZXJhdGVkIHByb3BlcnRpZXMuXHJcbiAgICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHk7XHJcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgLy8gU3RvcmUgZWFjaCBwcm9wZXJ0eSBuYW1lIHRvIHByZXZlbnQgZG91YmxlIGVudW1lcmF0aW9uLiBUaGVcclxuICAgICAgICAgICAgICAvLyBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgaXMgbm90IGVudW1lcmF0ZWQgZHVlIHRvIGNyb3NzLVxyXG4gICAgICAgICAgICAgIC8vIGVudmlyb25tZW50IGluY29uc2lzdGVuY2llcy5cclxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmICFpc1Byb3BlcnR5LmNhbGwobWVtYmVycywgcHJvcGVydHkpICYmIChtZW1iZXJzW3Byb3BlcnR5XSA9IDEpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gTm8gYnVncyBkZXRlY3RlZDsgdXNlIHRoZSBzdGFuZGFyZCBgZm9yLi4uaW5gIGFsZ29yaXRobS5cclxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgaXNDb25zdHJ1Y3RvcjtcclxuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcclxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiAhKGlzQ29uc3RydWN0b3IgPSBwcm9wZXJ0eSA9PT0gXCJjb25zdHJ1Y3RvclwiKSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBNYW51YWxseSBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSBkdWUgdG9cclxuICAgICAgICAgICAgLy8gY3Jvc3MtZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxyXG4gICAgICAgICAgICBpZiAoaXNDb25zdHJ1Y3RvciB8fCBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCAocHJvcGVydHkgPSBcImNvbnN0cnVjdG9yXCIpKSkge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZvckVhY2gob2JqZWN0LCBjYWxsYmFjayk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBQdWJsaWM6IFNlcmlhbGl6ZXMgYSBKYXZhU2NyaXB0IGB2YWx1ZWAgYXMgYSBKU09OIHN0cmluZy4gVGhlIG9wdGlvbmFsXHJcbiAgICAgIC8vIGBmaWx0ZXJgIGFyZ3VtZW50IG1heSBzcGVjaWZ5IGVpdGhlciBhIGZ1bmN0aW9uIHRoYXQgYWx0ZXJzIGhvdyBvYmplY3QgYW5kXHJcbiAgICAgIC8vIGFycmF5IG1lbWJlcnMgYXJlIHNlcmlhbGl6ZWQsIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MgYW5kIG51bWJlcnMgdGhhdFxyXG4gICAgICAvLyBpbmRpY2F0ZXMgd2hpY2ggcHJvcGVydGllcyBzaG91bGQgYmUgc2VyaWFsaXplZC4gVGhlIG9wdGlvbmFsIGB3aWR0aGBcclxuICAgICAgLy8gYXJndW1lbnQgbWF5IGJlIGVpdGhlciBhIHN0cmluZyBvciBudW1iZXIgdGhhdCBzcGVjaWZpZXMgdGhlIGluZGVudGF0aW9uXHJcbiAgICAgIC8vIGxldmVsIG9mIHRoZSBvdXRwdXQuXHJcbiAgICAgIGlmICh0cnVlKSB7XHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy5cclxuICAgICAgICB2YXIgRXNjYXBlcyA9IHtcclxuICAgICAgICAgIDkyOiBcIlxcXFxcXFxcXCIsXHJcbiAgICAgICAgICAzNDogJ1xcXFxcIicsXHJcbiAgICAgICAgICA4OiBcIlxcXFxiXCIsXHJcbiAgICAgICAgICAxMjogXCJcXFxcZlwiLFxyXG4gICAgICAgICAgMTA6IFwiXFxcXG5cIixcclxuICAgICAgICAgIDEzOiBcIlxcXFxyXCIsXHJcbiAgICAgICAgICA5OiBcIlxcXFx0XCJcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogQ29udmVydHMgYHZhbHVlYCBpbnRvIGEgemVyby1wYWRkZWQgc3RyaW5nIHN1Y2ggdGhhdCBpdHNcclxuICAgICAgICAvLyBsZW5ndGggaXMgYXQgbGVhc3QgZXF1YWwgdG8gYHdpZHRoYC4gVGhlIGB3aWR0aGAgbXVzdCBiZSA8PSA2LlxyXG4gICAgICAgIHZhciBsZWFkaW5nWmVyb2VzID0gXCIwMDAwMDBcIjtcclxuICAgICAgICB2YXIgdG9QYWRkZWRTdHJpbmcgPSBmdW5jdGlvbiAod2lkdGgsIHZhbHVlKSB7XHJcbiAgICAgICAgICAvLyBUaGUgYHx8IDBgIGV4cHJlc3Npb24gaXMgbmVjZXNzYXJ5IHRvIHdvcmsgYXJvdW5kIGEgYnVnIGluXHJcbiAgICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgd2hlcmUgYDAgPT0gLTBgLCBidXQgYFN0cmluZygtMCkgIT09IFwiMFwiYC5cclxuICAgICAgICAgIHJldHVybiAobGVhZGluZ1plcm9lcyArICh2YWx1ZSB8fCAwKSkuc2xpY2UoLXdpZHRoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogRG91YmxlLXF1b3RlcyBhIHN0cmluZyBgdmFsdWVgLCByZXBsYWNpbmcgYWxsIEFTQ0lJIGNvbnRyb2xcclxuICAgICAgICAvLyBjaGFyYWN0ZXJzIChjaGFyYWN0ZXJzIHdpdGggY29kZSB1bml0IHZhbHVlcyBiZXR3ZWVuIDAgYW5kIDMxKSB3aXRoXHJcbiAgICAgICAgLy8gdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcclxuICAgICAgICAvLyBgUXVvdGUodmFsdWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxyXG4gICAgICAgIHZhciB1bmljb2RlUHJlZml4ID0gXCJcXFxcdTAwXCI7XHJcbiAgICAgICAgdmFyIHF1b3RlID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gJ1wiJywgaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgsIHVzZUNoYXJJbmRleCA9ICFjaGFySW5kZXhCdWdneSB8fCBsZW5ndGggPiAxMDtcclxuICAgICAgICAgIHZhciBzeW1ib2xzID0gdXNlQ2hhckluZGV4ICYmIChjaGFySW5kZXhCdWdneSA/IHZhbHVlLnNwbGl0KFwiXCIpIDogdmFsdWUpO1xyXG4gICAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGFyQ29kZSA9IHZhbHVlLmNoYXJDb2RlQXQoaW5kZXgpO1xyXG4gICAgICAgICAgICAvLyBJZiB0aGUgY2hhcmFjdGVyIGlzIGEgY29udHJvbCBjaGFyYWN0ZXIsIGFwcGVuZCBpdHMgVW5pY29kZSBvclxyXG4gICAgICAgICAgICAvLyBzaG9ydGhhbmQgZXNjYXBlIHNlcXVlbmNlOyBvdGhlcndpc2UsIGFwcGVuZCB0aGUgY2hhcmFjdGVyIGFzLWlzLlxyXG4gICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XHJcbiAgICAgICAgICAgICAgY2FzZSA4OiBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTI6IGNhc2UgMTM6IGNhc2UgMzQ6IGNhc2UgOTI6XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gRXNjYXBlc1tjaGFyQ29kZV07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHVuaWNvZGVQcmVmaXggKyB0b1BhZGRlZFN0cmluZygyLCBjaGFyQ29kZS50b1N0cmluZygxNikpO1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1c2VDaGFySW5kZXggPyBzeW1ib2xzW2luZGV4XSA6IHZhbHVlLmNoYXJBdChpbmRleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiByZXN1bHQgKyAnXCInO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSBzZXJpYWxpemVzIGFuIG9iamVjdC4gSW1wbGVtZW50cyB0aGVcclxuICAgICAgICAvLyBgU3RyKGtleSwgaG9sZGVyKWAsIGBKTyh2YWx1ZSlgLCBhbmQgYEpBKHZhbHVlKWAgb3BlcmF0aW9ucy5cclxuICAgICAgICB2YXIgc2VyaWFsaXplID0gZnVuY3Rpb24gKHByb3BlcnR5LCBvYmplY3QsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2ssIG1heExpbmVMZW5ndGgpIHtcclxuICAgICAgICAgIHZhciB2YWx1ZSwgY2xhc3NOYW1lLCB5ZWFyLCBtb250aCwgZGF0ZSwgdGltZSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcywgcmVzdWx0cywgZWxlbWVudCwgaW5kZXgsIGxlbmd0aCwgcHJlZml4LCByZXN1bHQ7XHJcblxyXG4gICAgICAgICAgbWF4TGluZUxlbmd0aCA9IG1heExpbmVMZW5ndGggfHwgMDtcclxuXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBOZWNlc3NhcnkgZm9yIGhvc3Qgb2JqZWN0IHN1cHBvcnQuXHJcbiAgICAgICAgICAgIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cclxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xyXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBkYXRlQ2xhc3MgJiYgIWlzUHJvcGVydHkuY2FsbCh2YWx1ZSwgXCJ0b0pTT05cIikpIHtcclxuICAgICAgICAgICAgICBpZiAodmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRGF0ZXMgYXJlIHNlcmlhbGl6ZWQgYWNjb3JkaW5nIHRvIHRoZSBgRGF0ZSN0b0pTT05gIG1ldGhvZFxyXG4gICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjkuNS40NC4gU2VlIHNlY3Rpb24gMTUuOS4xLjE1XHJcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIElTTyA4NjAxIGRhdGUgdGltZSBzdHJpbmcgZm9ybWF0LlxyXG4gICAgICAgICAgICAgICAgaWYgKGdldERheSkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBNYW51YWxseSBjb21wdXRlIHRoZSB5ZWFyLCBtb250aCwgZGF0ZSwgaG91cnMsIG1pbnV0ZXMsXHJcbiAgICAgICAgICAgICAgICAgIC8vIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgaWYgdGhlIGBnZXRVVEMqYCBtZXRob2RzIGFyZVxyXG4gICAgICAgICAgICAgICAgICAvLyBidWdneS4gQWRhcHRlZCBmcm9tIEBZYWZmbGUncyBgZGF0ZS1zaGltYCBwcm9qZWN0LlxyXG4gICAgICAgICAgICAgICAgICBkYXRlID0gZmxvb3IodmFsdWUgLyA4NjRlNSk7XHJcbiAgICAgICAgICAgICAgICAgIGZvciAoeWVhciA9IGZsb29yKGRhdGUgLyAzNjUuMjQyNSkgKyAxOTcwIC0gMTsgZ2V0RGF5KHllYXIgKyAxLCAwKSA8PSBkYXRlOyB5ZWFyKyspO1xyXG4gICAgICAgICAgICAgICAgICBmb3IgKG1vbnRoID0gZmxvb3IoKGRhdGUgLSBnZXREYXkoeWVhciwgMCkpIC8gMzAuNDIpOyBnZXREYXkoeWVhciwgbW9udGggKyAxKSA8PSBkYXRlOyBtb250aCsrKTtcclxuICAgICAgICAgICAgICAgICAgZGF0ZSA9IDEgKyBkYXRlIC0gZ2V0RGF5KHllYXIsIG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgLy8gVGhlIGB0aW1lYCB2YWx1ZSBzcGVjaWZpZXMgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkgKHNlZSBFU1xyXG4gICAgICAgICAgICAgICAgICAvLyA1LjEgc2VjdGlvbiAxNS45LjEuMikuIFRoZSBmb3JtdWxhIGAoQSAlIEIgKyBCKSAlIEJgIGlzIHVzZWRcclxuICAgICAgICAgICAgICAgICAgLy8gdG8gY29tcHV0ZSBgQSBtb2R1bG8gQmAsIGFzIHRoZSBgJWAgb3BlcmF0b3IgZG9lcyBub3RcclxuICAgICAgICAgICAgICAgICAgLy8gY29ycmVzcG9uZCB0byB0aGUgYG1vZHVsb2Agb3BlcmF0aW9uIGZvciBuZWdhdGl2ZSBudW1iZXJzLlxyXG4gICAgICAgICAgICAgICAgICB0aW1lID0gKHZhbHVlICUgODY0ZTUgKyA4NjRlNSkgJSA4NjRlNTtcclxuICAgICAgICAgICAgICAgICAgLy8gVGhlIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBhbmQgbWlsbGlzZWNvbmRzIGFyZSBvYnRhaW5lZCBieVxyXG4gICAgICAgICAgICAgICAgICAvLyBkZWNvbXBvc2luZyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheS4gU2VlIHNlY3Rpb24gMTUuOS4xLjEwLlxyXG4gICAgICAgICAgICAgICAgICBob3VycyA9IGZsb29yKHRpbWUgLyAzNmU1KSAlIDI0O1xyXG4gICAgICAgICAgICAgICAgICBtaW51dGVzID0gZmxvb3IodGltZSAvIDZlNCkgJSA2MDtcclxuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IGZsb29yKHRpbWUgLyAxZTMpICUgNjA7XHJcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHRpbWUgJSAxZTM7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB5ZWFyID0gdmFsdWUuZ2V0VVRDRnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWx1ZS5nZXRVVENNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgICBkYXRlID0gdmFsdWUuZ2V0VVRDRGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICBob3VycyA9IHZhbHVlLmdldFVUQ0hvdXJzKCk7XHJcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB2YWx1ZS5nZXRVVENNaW51dGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSB2YWx1ZS5nZXRVVENTZWNvbmRzKCk7XHJcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHZhbHVlLmdldFVUQ01pbGxpc2Vjb25kcygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gU2VyaWFsaXplIGV4dGVuZGVkIHllYXJzIGNvcnJlY3RseS5cclxuICAgICAgICAgICAgICAgIHZhbHVlID0gKHllYXIgPD0gMCB8fCB5ZWFyID49IDFlNCA/ICh5ZWFyIDwgMCA/IFwiLVwiIDogXCIrXCIpICsgdG9QYWRkZWRTdHJpbmcoNiwgeWVhciA8IDAgPyAteWVhciA6IHllYXIpIDogdG9QYWRkZWRTdHJpbmcoNCwgeWVhcikpICtcclxuICAgICAgICAgICAgICAgICAgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBtb250aCArIDEpICsgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBkYXRlKSArXHJcbiAgICAgICAgICAgICAgICAgIC8vIE1vbnRocywgZGF0ZXMsIGhvdXJzLCBtaW51dGVzLCBhbmQgc2Vjb25kcyBzaG91bGQgaGF2ZSB0d29cclxuICAgICAgICAgICAgICAgICAgLy8gZGlnaXRzOyBtaWxsaXNlY29uZHMgc2hvdWxkIGhhdmUgdGhyZWUuXHJcbiAgICAgICAgICAgICAgICAgIFwiVFwiICsgdG9QYWRkZWRTdHJpbmcoMiwgaG91cnMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBtaW51dGVzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgc2Vjb25kcykgK1xyXG4gICAgICAgICAgICAgICAgICAvLyBNaWxsaXNlY29uZHMgYXJlIG9wdGlvbmFsIGluIEVTIDUuMCwgYnV0IHJlcXVpcmVkIGluIDUuMS5cclxuICAgICAgICAgICAgICAgICAgXCIuXCIgKyB0b1BhZGRlZFN0cmluZygzLCBtaWxsaXNlY29uZHMpICsgXCJaXCI7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlLnRvSlNPTiA9PSBcImZ1bmN0aW9uXCIgJiYgKChjbGFzc05hbWUgIT0gbnVtYmVyQ2xhc3MgJiYgY2xhc3NOYW1lICE9IHN0cmluZ0NsYXNzICYmIGNsYXNzTmFtZSAhPSBhcnJheUNsYXNzKSB8fCBpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSkge1xyXG4gICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBhZGRzIG5vbi1zdGFuZGFyZCBgdG9KU09OYCBtZXRob2RzIHRvIHRoZVxyXG4gICAgICAgICAgICAgIC8vIGBOdW1iZXJgLCBgU3RyaW5nYCwgYERhdGVgLCBhbmQgYEFycmF5YCBwcm90b3R5cGVzLiBKU09OIDNcclxuICAgICAgICAgICAgICAvLyBpZ25vcmVzIGFsbCBgdG9KU09OYCBtZXRob2RzIG9uIHRoZXNlIG9iamVjdHMgdW5sZXNzIHRoZXkgYXJlXHJcbiAgICAgICAgICAgICAgLy8gZGVmaW5lZCBkaXJlY3RseSBvbiBhbiBpbnN0YW5jZS5cclxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihwcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLyBJZiBhIHJlcGxhY2VtZW50IGZ1bmN0aW9uIHdhcyBwcm92aWRlZCwgY2FsbCBpdCB0byBvYnRhaW4gdGhlIHZhbHVlXHJcbiAgICAgICAgICAgIC8vIGZvciBzZXJpYWxpemF0aW9uLlxyXG4gICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpO1xyXG4gICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBib29sZWFuQ2xhc3MpIHtcclxuICAgICAgICAgICAgLy8gQm9vbGVhbnMgYXJlIHJlcHJlc2VudGVkIGxpdGVyYWxseS5cclxuICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyB2YWx1ZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSB7XHJcbiAgICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gYEluZmluaXR5YCBhbmQgYE5hTmAgYXJlIHNlcmlhbGl6ZWQgYXNcclxuICAgICAgICAgICAgLy8gYFwibnVsbFwiYC5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDAgPyBcIlwiICsgdmFsdWUgOiBcIm51bGxcIjtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XHJcbiAgICAgICAgICAgIC8vIFN0cmluZ3MgYXJlIGRvdWJsZS1xdW90ZWQgYW5kIGVzY2FwZWQuXHJcbiAgICAgICAgICAgIHJldHVybiBxdW90ZShcIlwiICsgdmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdHMgYW5kIGFycmF5cy5cclxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoaXMgaXMgYSBsaW5lYXIgc2VhcmNoOyBwZXJmb3JtYW5jZVxyXG4gICAgICAgICAgICAvLyBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2YgdW5pcXVlIG5lc3RlZCBvYmplY3RzLlxyXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHN0YWNrLmxlbmd0aDsgbGVuZ3RoLS07KSB7XHJcbiAgICAgICAgICAgICAgaWYgKHN0YWNrW2xlbmd0aF0gPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDeWNsaWMgc3RydWN0dXJlcyBjYW5ub3QgYmUgc2VyaWFsaXplZCBieSBgSlNPTi5zdHJpbmdpZnlgLlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cclxuICAgICAgICAgICAgc3RhY2sucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbCBhbmQgaW5kZW50IG9uZSBhZGRpdGlvbmFsIGxldmVsLlxyXG4gICAgICAgICAgICBwcmVmaXggPSBpbmRlbnRhdGlvbjtcclxuICAgICAgICAgICAgaW5kZW50YXRpb24gKz0gd2hpdGVzcGFjZTtcclxuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgdmFyIHRvdGFsTGVuZ3RoID0gaW5kZW50YXRpb24ubGVuZ3RoLCByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIGFycmF5IGVsZW1lbnRzLlxyXG4gICAgICAgICAgICAgIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gc2VyaWFsaXplKGluZGV4LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICBzdGFjaywgbWF4TGluZUxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBlbGVtZW50ID09PSB1bmRlZiA/IFwibnVsbFwiIDogZWxlbWVudDtcclxuICAgICAgICAgICAgICAgIHRvdGFsTGVuZ3RoICs9IHJlc3VsdC5sZW5ndGggKyAoaW5kZXggPiAwID8gMSA6IDApO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID9cclxuICAgICAgICAgICAgICAgIChcclxuICAgICAgICAgICAgICAgICAgd2hpdGVzcGFjZSAmJiAodG90YWxMZW5ndGggPiBtYXhMaW5lTGVuZ3RoKSA/XHJcbiAgICAgICAgICAgICAgICAgIFwiW1xcblwiICsgaW5kZW50YXRpb24gKyByZXN1bHRzLmpvaW4oXCIsXFxuXCIgKyBpbmRlbnRhdGlvbikgKyBcIlxcblwiICsgcHJlZml4ICsgXCJdXCIgOlxyXG4gICAgICAgICAgICAgICAgICBcIltcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIl1cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgOiBcIltdXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdmFyIHRvdGFsTGVuZ3RoID0gaW5kZW50YXRpb24ubGVuZ3RoLCBpbmRleD0wO1xyXG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBvYmplY3QgbWVtYmVycy4gTWVtYmVycyBhcmUgc2VsZWN0ZWQgZnJvbVxyXG4gICAgICAgICAgICAgIC8vIGVpdGhlciBhIHVzZXItc3BlY2lmaWVkIGxpc3Qgb2YgcHJvcGVydHkgbmFtZXMsIG9yIHRoZSBvYmplY3RcclxuICAgICAgICAgICAgICAvLyBpdHNlbGYuXHJcbiAgICAgICAgICAgICAgZm9yRWFjaChwcm9wZXJ0aWVzIHx8IHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQsIGVsZW1lbnQgPSBzZXJpYWxpemUocHJvcGVydHksIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFjaywgbWF4TGluZUxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT09IHVuZGVmKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIEFjY29yZGluZyB0byBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zOiBcIklmIGBnYXBgIHt3aGl0ZXNwYWNlfVxyXG4gICAgICAgICAgICAgICAgICAvLyBpcyBub3QgdGhlIGVtcHR5IHN0cmluZywgbGV0IGBtZW1iZXJgIHtxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIn1cclxuICAgICAgICAgICAgICAgICAgLy8gYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgYG1lbWJlcmAgYW5kIHRoZSBgc3BhY2VgIGNoYXJhY3Rlci5cIlxyXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgXCJgc3BhY2VgIGNoYXJhY3RlclwiIHJlZmVycyB0byB0aGUgbGl0ZXJhbCBzcGFjZVxyXG4gICAgICAgICAgICAgICAgICAvLyBjaGFyYWN0ZXIsIG5vdCB0aGUgYHNwYWNlYCB7d2lkdGh9IGFyZ3VtZW50IHByb3ZpZGVkIHRvXHJcbiAgICAgICAgICAgICAgICAgIC8vIGBKU09OLnN0cmluZ2lmeWAuXHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHF1b3RlKHByb3BlcnR5KSArIFwiOlwiICsgKHdoaXRlc3BhY2UgPyBcIiBcIiA6IFwiXCIpICsgZWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgdG90YWxMZW5ndGggKz0gcmVzdWx0Lmxlbmd0aCArIChpbmRleCsrID4gMCA/IDEgOiAwKTtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggP1xyXG4gICAgICAgICAgICAgICAgKFxyXG4gICAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlICYmICh0b3RhbExlbmd0aCA+IG1heExpbmVMZW5ndGgpID9cclxuICAgICAgICAgICAgICAgICAgXCJ7XFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIn1cIiA6XHJcbiAgICAgICAgICAgICAgICAgIFwie1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwifVwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICA6IFwie31cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIG9iamVjdCBmcm9tIHRoZSB0cmF2ZXJzZWQgb2JqZWN0IHN0YWNrLlxyXG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBQdWJsaWM6IGBKU09OLnN0cmluZ2lmeWAuIFNlZSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxyXG5cclxuICAgICAgICBleHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChzb3VyY2UsIGZpbHRlciwgd2lkdGgsIG1heExpbmVMZW5ndGgpIHtcclxuICAgICAgICAgIHZhciB3aGl0ZXNwYWNlLCBjYWxsYmFjaywgcHJvcGVydGllcywgY2xhc3NOYW1lO1xyXG4gICAgICAgICAgaWYgKG9iamVjdFR5cGVzW3R5cGVvZiBmaWx0ZXJdICYmIGZpbHRlcikge1xyXG4gICAgICAgICAgICBpZiAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwoZmlsdGVyKSkgPT0gZnVuY3Rpb25DbGFzcykge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrID0gZmlsdGVyO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgcHJvcGVydHkgbmFtZXMgYXJyYXkgaW50byBhIG1ha2VzaGlmdCBzZXQuXHJcbiAgICAgICAgICAgICAgcHJvcGVydGllcyA9IHt9O1xyXG4gICAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0gZmlsdGVyLmxlbmd0aCwgdmFsdWU7IGluZGV4IDwgbGVuZ3RoOyB2YWx1ZSA9IGZpbHRlcltpbmRleCsrXSwgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKSksIGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcyB8fCBjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpICYmIChwcm9wZXJ0aWVzW3ZhbHVlXSA9IDEpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHdpZHRoKSB7XHJcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh3aWR0aCkpID09IG51bWJlckNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgYHdpZHRoYCB0byBhbiBpbnRlZ2VyIGFuZCBjcmVhdGUgYSBzdHJpbmcgY29udGFpbmluZ1xyXG4gICAgICAgICAgICAgIC8vIGB3aWR0aGAgbnVtYmVyIG9mIHNwYWNlIGNoYXJhY3RlcnMuXHJcbiAgICAgICAgICAgICAgaWYgKCh3aWR0aCAtPSB3aWR0aCAlIDEpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh3aGl0ZXNwYWNlID0gXCJcIiwgd2lkdGggPiAxMCAmJiAod2lkdGggPSAxMCk7IHdoaXRlc3BhY2UubGVuZ3RoIDwgd2lkdGg7IHdoaXRlc3BhY2UgKz0gXCIgXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MpIHtcclxuICAgICAgICAgICAgICB3aGl0ZXNwYWNlID0gd2lkdGgubGVuZ3RoIDw9IDEwID8gd2lkdGggOiB3aWR0aC5zbGljZSgwLCAxMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiBkaXNjYXJkcyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBlbXB0eSBzdHJpbmcga2V5c1xyXG4gICAgICAgICAgLy8gKGBcIlwiYCkgb25seSBpZiB0aGV5IGFyZSB1c2VkIGRpcmVjdGx5IHdpdGhpbiBhbiBvYmplY3QgbWVtYmVyIGxpc3RcclxuICAgICAgICAgIC8vIChlLmcuLCBgIShcIlwiIGluIHsgXCJcIjogMX0pYCkuXHJcbiAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKFwiXCIsICh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHNvdXJjZSwgdmFsdWUpLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgXCJcIiwgW10sIG1heExpbmVMZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGV4cG9ydHMuY29tcGFjdFN0cmluZ2lmeSA9IGZ1bmN0aW9uIChzb3VyY2UsIGZpbHRlciwgd2lkdGgpe1xyXG4gICAgICAgICAgcmV0dXJuIGV4cG9ydHMuc3RyaW5naWZ5KHNvdXJjZSwgZmlsdGVyLCB3aWR0aCwgNjApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUHVibGljOiBQYXJzZXMgYSBKU09OIHNvdXJjZSBzdHJpbmcuXHJcbiAgICAgIGlmICghaGFzKFwianNvbi1wYXJzZVwiKSkge1xyXG4gICAgICAgIHZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIHVuZXNjYXBlZFxyXG4gICAgICAgIC8vIGVxdWl2YWxlbnRzLlxyXG4gICAgICAgIHZhciBVbmVzY2FwZXMgPSB7XHJcbiAgICAgICAgICA5MjogXCJcXFxcXCIsXHJcbiAgICAgICAgICAzNDogJ1wiJyxcclxuICAgICAgICAgIDQ3OiBcIi9cIixcclxuICAgICAgICAgIDk4OiBcIlxcYlwiLFxyXG4gICAgICAgICAgMTE2OiBcIlxcdFwiLFxyXG4gICAgICAgICAgMTEwOiBcIlxcblwiLFxyXG4gICAgICAgICAgMTAyOiBcIlxcZlwiLFxyXG4gICAgICAgICAgMTE0OiBcIlxcclwiXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IFN0b3JlcyB0aGUgcGFyc2VyIHN0YXRlLlxyXG4gICAgICAgIHZhciBJbmRleCwgU291cmNlO1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogUmVzZXRzIHRoZSBwYXJzZXIgc3RhdGUgYW5kIHRocm93cyBhIGBTeW50YXhFcnJvcmAuXHJcbiAgICAgICAgdmFyIGFib3J0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xyXG4gICAgICAgICAgdGhyb3cgU3ludGF4RXJyb3IoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogUmV0dXJucyB0aGUgbmV4dCB0b2tlbiwgb3IgYFwiJFwiYCBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkXHJcbiAgICAgICAgLy8gdGhlIGVuZCBvZiB0aGUgc291cmNlIHN0cmluZy4gQSB0b2tlbiBtYXkgYmUgYSBzdHJpbmcsIG51bWJlciwgYG51bGxgXHJcbiAgICAgICAgLy8gbGl0ZXJhbCwgb3IgQm9vbGVhbiBsaXRlcmFsLlxyXG4gICAgICAgIHZhciBsZXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgc291cmNlID0gU291cmNlLCBsZW5ndGggPSBzb3VyY2UubGVuZ3RoLCB2YWx1ZSwgYmVnaW4sIHBvc2l0aW9uLCBpc1NpZ25lZCwgY2hhckNvZGU7XHJcbiAgICAgICAgICB3aGlsZSAoSW5kZXggPCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcclxuICAgICAgICAgICAgICBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTM6IGNhc2UgMzI6XHJcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgdG9rZW5zLCBpbmNsdWRpbmcgdGFicywgY2FycmlhZ2UgcmV0dXJucywgbGluZVxyXG4gICAgICAgICAgICAgICAgLy8gZmVlZHMsIGFuZCBzcGFjZSBjaGFyYWN0ZXJzLlxyXG4gICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIGNhc2UgMTIzOiBjYXNlIDEyNTogY2FzZSA5MTogY2FzZSA5MzogY2FzZSA1ODogY2FzZSA0NDpcclxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGEgcHVuY3R1YXRvciB0b2tlbiAoYHtgLCBgfWAsIGBbYCwgYF1gLCBgOmAsIG9yIGAsYCkgYXRcclxuICAgICAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IHBvc2l0aW9uLlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjaGFySW5kZXhCdWdneSA/IHNvdXJjZS5jaGFyQXQoSW5kZXgpIDogc291cmNlW0luZGV4XTtcclxuICAgICAgICAgICAgICAgIEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgY2FzZSAzNDpcclxuICAgICAgICAgICAgICAgIC8vIGBcImAgZGVsaW1pdHMgYSBKU09OIHN0cmluZzsgYWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kXHJcbiAgICAgICAgICAgICAgICAvLyBiZWdpbiBwYXJzaW5nIHRoZSBzdHJpbmcuIFN0cmluZyB0b2tlbnMgYXJlIHByZWZpeGVkIHdpdGggdGhlXHJcbiAgICAgICAgICAgICAgICAvLyBzZW50aW5lbCBgQGAgY2hhcmFjdGVyIHRvIGRpc3Rpbmd1aXNoIHRoZW0gZnJvbSBwdW5jdHVhdG9ycyBhbmRcclxuICAgICAgICAgICAgICAgIC8vIGVuZC1vZi1zdHJpbmcgdG9rZW5zLlxyXG4gICAgICAgICAgICAgICAgZm9yICh2YWx1ZSA9IFwiQFwiLCBJbmRleCsrOyBJbmRleCA8IGxlbmd0aDspIHtcclxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5lc2NhcGVkIEFTQ0lJIGNvbnRyb2wgY2hhcmFjdGVycyAodGhvc2Ugd2l0aCBhIGNvZGUgdW5pdFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxlc3MgdGhhbiB0aGUgc3BhY2UgY2hhcmFjdGVyKSBhcmUgbm90IHBlcm1pdHRlZC5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXJDb2RlID09IDkyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSByZXZlcnNlIHNvbGlkdXMgKGBcXGApIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYW4gZXNjYXBlZFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRyb2wgY2hhcmFjdGVyIChpbmNsdWRpbmcgYFwiYCwgYFxcYCwgYW5kIGAvYCkgb3IgVW5pY29kZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzY2FwZSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgOTI6IGNhc2UgMzQ6IGNhc2UgNDc6IGNhc2UgOTg6IGNhc2UgMTE2OiBjYXNlIDExMDogY2FzZSAxMDI6IGNhc2UgMTE0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IFVuZXNjYXBlc1tjaGFyQ29kZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSAxMTc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBcXHVgIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYSBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIGFuZCB2YWxpZGF0ZSB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCBjb2RlIHBvaW50LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbiA9ICsrSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleCArIDQ7IEluZGV4IDwgcG9zaXRpb247IEluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHZhbGlkIHNlcXVlbmNlIGNvbXByaXNlcyBmb3VyIGhleGRpZ2l0cyAoY2FzZS1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnNlbnNpdGl2ZSkgdGhhdCBmb3JtIGEgc2luZ2xlIGhleGFkZWNpbWFsIHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3IHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEwMiB8fCBjaGFyQ29kZSA+PSA2NSAmJiBjaGFyQ29kZSA8PSA3MCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBmcm9tQ2hhckNvZGUoXCIweFwiICsgc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgZXNjYXBlIHNlcXVlbmNlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMzQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIEFuIHVuZXNjYXBlZCBkb3VibGUtcXVvdGUgY2hhcmFjdGVyIG1hcmtzIHRoZSBlbmQgb2YgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdHJpbmcuXHJcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAvLyBPcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiBjYXNlIHdoZXJlIGEgc3RyaW5nIGlzIHZhbGlkLlxyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjaGFyQ29kZSA+PSAzMiAmJiBjaGFyQ29kZSAhPSA5MiAmJiBjaGFyQ29kZSAhPSAzNCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBzdHJpbmcgYXMtaXMuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gMzQpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kIHJldHVybiB0aGUgcmV2aXZlZCBzdHJpbmcuXHJcbiAgICAgICAgICAgICAgICAgIEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFVudGVybWluYXRlZCBzdHJpbmcuXHJcbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBudW1iZXJzIGFuZCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHBhc3QgdGhlIG5lZ2F0aXZlIHNpZ24sIGlmIG9uZSBpcyBzcGVjaWZpZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDUpIHtcclxuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYW4gaW50ZWdlciBvciBmbG9hdGluZy1wb2ludCB2YWx1ZS5cclxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nykge1xyXG4gICAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIHplcm9lcyBhcmUgaW50ZXJwcmV0ZWQgYXMgb2N0YWwgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0OCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXggKyAxKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgb2N0YWwgbGl0ZXJhbC5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlzU2lnbmVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBpbnRlZ2VyIGNvbXBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgZm9yICg7IEluZGV4IDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IEluZGV4KyspO1xyXG4gICAgICAgICAgICAgICAgICAvLyBGbG9hdHMgY2Fubm90IGNvbnRhaW4gYSBsZWFkaW5nIGRlY2ltYWwgcG9pbnQ7IGhvd2V2ZXIsIHRoaXNcclxuICAgICAgICAgICAgICAgICAgLy8gY2FzZSBpcyBhbHJlYWR5IGFjY291bnRlZCBmb3IgYnkgdGhlIHBhcnNlci5cclxuICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSA0Nikge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gKytJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZGVjaW1hbCBjb21wb25lbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCB0cmFpbGluZyBkZWNpbWFsLlxyXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSBleHBvbmVudHMuIFRoZSBgZWAgZGVub3RpbmcgdGhlIGV4cG9uZW50IGlzXHJcbiAgICAgICAgICAgICAgICAgIC8vIGNhc2UtaW5zZW5zaXRpdmUuXHJcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMTAxIHx8IGNoYXJDb2RlID09IDY5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHBhc3QgdGhlIHNpZ24gZm9sbG93aW5nIHRoZSBleHBvbmVudCwgaWYgb25lIGlzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0MyB8fCBjaGFyQ29kZSA9PSA0NSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGV4cG9uZW50aWFsIGNvbXBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBlbXB0eSBleHBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgLy8gQ29lcmNlIHRoZSBwYXJzZWQgdmFsdWUgdG8gYSBKYXZhU2NyaXB0IG51bWJlci5cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuICtzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIEEgbmVnYXRpdmUgc2lnbiBtYXkgb25seSBwcmVjZWRlIG51bWJlcnMuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTaWduZWQpIHtcclxuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGB0cnVlYCwgYGZhbHNlYCwgYW5kIGBudWxsYCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJ0cnVlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA1KSA9PSBcImZhbHNlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJudWxsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBVbnJlY29nbml6ZWQgdG9rZW4uXHJcbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBSZXR1cm4gdGhlIHNlbnRpbmVsIGAkYCBjaGFyYWN0ZXIgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZCB0aGUgZW5kXHJcbiAgICAgICAgICAvLyBvZiB0aGUgc291cmNlIHN0cmluZy5cclxuICAgICAgICAgIHJldHVybiBcIiRcIjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogUGFyc2VzIGEgSlNPTiBgdmFsdWVgIHRva2VuLlxyXG4gICAgICAgIHZhciBnZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgIHZhciByZXN1bHRzLCBoYXNNZW1iZXJzO1xyXG4gICAgICAgICAgaWYgKHZhbHVlID09IFwiJFwiKSB7XHJcbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgZW5kIG9mIGlucHV0LlxyXG4gICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIGlmICgoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoMCkgOiB2YWx1ZVswXSkgPT0gXCJAXCIpIHtcclxuICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFBhcnNlIG9iamVjdCBhbmQgYXJyYXkgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIltcIikge1xyXG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gYXJyYXksIHJldHVybmluZyBhIG5ldyBKYXZhU2NyaXB0IGFycmF5LlxyXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBzcXVhcmUgYnJhY2tldCBtYXJrcyB0aGUgZW5kIG9mIHRoZSBhcnJheSBsaXRlcmFsLlxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGFycmF5IGxpdGVyYWwgY29udGFpbnMgZWxlbWVudHMsIHRoZSBjdXJyZW50IHRva2VuXHJcbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0aW5nIHRoZSBwcmV2aW91cyBlbGVtZW50IGZyb20gdGhlXHJcbiAgICAgICAgICAgICAgICAvLyBuZXh0LlxyXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIGFycmF5IGxpdGVyYWwuXHJcbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggYXJyYXkgZWxlbWVudC5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBFbGlzaW9ucyBhbmQgbGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChnZXQodmFsdWUpKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCJ7XCIpIHtcclxuICAgICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIG9iamVjdCwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgb2JqZWN0LlxyXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSB7fTtcclxuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBjdXJseSBicmFjZSBtYXJrcyB0aGUgZW5kIG9mIHRoZSBvYmplY3QgbGl0ZXJhbC5cclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBvYmplY3QgbGl0ZXJhbCBjb250YWlucyBtZW1iZXJzLCB0aGUgY3VycmVudCB0b2tlblxyXG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdG9yLlxyXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIG9iamVjdCBsaXRlcmFsLlxyXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIG9iamVjdCBtZW1iZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gTGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQsIG9iamVjdCBwcm9wZXJ0eSBuYW1lcyBtdXN0IGJlXHJcbiAgICAgICAgICAgICAgICAvLyBkb3VibGUtcXVvdGVkIHN0cmluZ3MsIGFuZCBhIGA6YCBtdXN0IHNlcGFyYXRlIGVhY2ggcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIC8vIG5hbWUgYW5kIHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiIHx8IHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIHx8IChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSAhPSBcIkBcIiB8fCBsZXgoKSAhPSBcIjpcIikge1xyXG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0c1t2YWx1ZS5zbGljZSgxKV0gPSBnZXQobGV4KCkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRva2VuIGVuY291bnRlcmVkLlxyXG4gICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBVcGRhdGVzIGEgdHJhdmVyc2VkIG9iamVjdCBtZW1iZXIuXHJcbiAgICAgICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSB3YWxrKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcclxuICAgICAgICAgIGlmIChlbGVtZW50ID09PSB1bmRlZikge1xyXG4gICAgICAgICAgICBkZWxldGUgc291cmNlW3Byb3BlcnR5XTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNvdXJjZVtwcm9wZXJ0eV0gPSBlbGVtZW50O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSB0cmF2ZXJzZXMgYSBwYXJzZWQgSlNPTiBvYmplY3QsIGludm9raW5nIHRoZVxyXG4gICAgICAgIC8vIGBjYWxsYmFja2AgZnVuY3Rpb24gZm9yIGVhY2ggdmFsdWUuIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlXHJcbiAgICAgICAgLy8gYFdhbGsoaG9sZGVyLCBuYW1lKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cclxuICAgICAgICB2YXIgd2FsayA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW3Byb3BlcnR5XSwgbGVuZ3RoO1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIGBmb3JFYWNoYCBjYW4ndCBiZSB1c2VkIHRvIHRyYXZlcnNlIGFuIGFycmF5IGluIE9wZXJhIDw9IDguNTRcclxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpdHMgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW1wbGVtZW50YXRpb24gcmV0dXJucyBgZmFsc2VgXHJcbiAgICAgICAgICAgIC8vIGZvciBhcnJheSBpbmRpY2VzIChlLmcuLCBgIVsxLCAyLCAzXS5oYXNPd25Qcm9wZXJ0eShcIjBcIilgKS5cclxuICAgICAgICAgICAgaWYgKGdldENsYXNzLmNhbGwodmFsdWUpID09IGFycmF5Q2xhc3MpIHtcclxuICAgICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgbGVuZ3RoLS07KSB7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGUodmFsdWUsIGxlbmd0aCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBmb3JFYWNoKHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwoc291cmNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04ucGFyc2VgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cclxuICAgICAgICBleHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHNvdXJjZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgIHZhciByZXN1bHQsIHZhbHVlO1xyXG4gICAgICAgICAgSW5kZXggPSAwO1xyXG4gICAgICAgICAgU291cmNlID0gXCJcIiArIHNvdXJjZTtcclxuICAgICAgICAgIHJlc3VsdCA9IGdldChsZXgoKSk7XHJcbiAgICAgICAgICAvLyBJZiBhIEpTT04gc3RyaW5nIGNvbnRhaW5zIG11bHRpcGxlIHRva2VucywgaXQgaXMgaW52YWxpZC5cclxuICAgICAgICAgIGlmIChsZXgoKSAhPSBcIiRcIikge1xyXG4gICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gUmVzZXQgdGhlIHBhcnNlciBzdGF0ZS5cclxuICAgICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcclxuICAgICAgICAgIHJldHVybiBjYWxsYmFjayAmJiBnZXRDbGFzcy5jYWxsKGNhbGxiYWNrKSA9PSBmdW5jdGlvbkNsYXNzID8gd2FsaygodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSByZXN1bHQsIHZhbHVlKSwgXCJcIiwgY2FsbGJhY2spIDogcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnRzW1wicnVuSW5Db250ZXh0XCJdID0gcnVuSW5Db250ZXh0O1xyXG4gICAgcmV0dXJuIGV4cG9ydHM7XHJcbiAgfVxyXG5cclxuICBpZiAoZnJlZUV4cG9ydHMgJiYgIWlzTG9hZGVyKSB7XHJcbiAgICAvLyBFeHBvcnQgZm9yIENvbW1vbkpTIGVudmlyb25tZW50cy5cclxuICAgIHJ1bkluQ29udGV4dChyb290LCBmcmVlRXhwb3J0cyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIEV4cG9ydCBmb3Igd2ViIGJyb3dzZXJzIGFuZCBKYXZhU2NyaXB0IGVuZ2luZXMuXHJcbiAgICB2YXIgbmF0aXZlSlNPTiA9IHJvb3QuSlNPTixcclxuICAgICAgICBwcmV2aW91c0pTT04gPSByb290W1wiSlNPTjNcIl0sXHJcbiAgICAgICAgaXNSZXN0b3JlZCA9IGZhbHNlO1xyXG5cclxuICAgIHZhciBKU09OMyA9IHJ1bkluQ29udGV4dChyb290LCAocm9vdFtcIkpTT04zXCJdID0ge1xyXG4gICAgICAvLyBQdWJsaWM6IFJlc3RvcmVzIHRoZSBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgZ2xvYmFsIGBKU09OYCBvYmplY3QgYW5kXHJcbiAgICAgIC8vIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIGBKU09OM2Agb2JqZWN0LlxyXG4gICAgICBcIm5vQ29uZmxpY3RcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghaXNSZXN0b3JlZCkge1xyXG4gICAgICAgICAgaXNSZXN0b3JlZCA9IHRydWU7XHJcbiAgICAgICAgICByb290LkpTT04gPSBuYXRpdmVKU09OO1xyXG4gICAgICAgICAgcm9vdFtcIkpTT04zXCJdID0gcHJldmlvdXNKU09OO1xyXG4gICAgICAgICAgbmF0aXZlSlNPTiA9IHByZXZpb3VzSlNPTiA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBKU09OMztcclxuICAgICAgfVxyXG4gICAgfSkpO1xyXG5cclxuICAgIHJvb3QuSlNPTiA9IHtcclxuICAgICAgXCJwYXJzZVwiOiBKU09OMy5wYXJzZSxcclxuICAgICAgXCJzdHJpbmdpZnlcIjogSlNPTjMuc3RyaW5naWZ5XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gRXhwb3J0IGZvciBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuXHJcbiAgaWYgKGlzTG9hZGVyKSB7XHJcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gSlNPTjM7XHJcbiAgICB9KTtcclxuICB9XHJcbn0pLmNhbGwodGhpcyk7XHJcbiIsIndpbmRvdy4gICAgIHZsU2NoZW1hID0ge1xuICBcIm9uZU9mXCI6IFtcbiAgICB7XG4gICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0V4dGVuZGVkVW5pdFNwZWNcIixcbiAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTY2hlbWEgZm9yIGEgdW5pdCBWZWdhLUxpdGUgc3BlY2lmaWNhdGlvbiwgd2l0aCB0aGUgc3ludGFjdGljIHN1Z2FyIGV4dGVuc2lvbnM6XFxuXFxuLSBgcm93YCBhbmQgYGNvbHVtbmAgYXJlIGluY2x1ZGVkIGluIHRoZSBlbmNvZGluZy5cXG5cXG4tIChGdXR1cmUpIGxhYmVsLCBib3ggcGxvdFxcblxcblxcblxcbk5vdGU6IHRoZSBzcGVjIGNvdWxkIGNvbnRhaW4gZmFjZXQuXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmFjZXRTcGVjXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvTGF5ZXJTcGVjXCJcbiAgICB9XG4gIF0sXG4gIFwiZGVmaW5pdGlvbnNcIjoge1xuICAgIFwiRXh0ZW5kZWRVbml0U3BlY1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwibWFya1wiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9NYXJrXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBtYXJrIHR5cGUuXFxuXFxuT25lIG9mIGBcXFwiYmFyXFxcImAsIGBcXFwiY2lyY2xlXFxcImAsIGBcXFwic3F1YXJlXFxcImAsIGBcXFwidGlja1xcXCJgLCBgXFxcImxpbmVcXFwiYCxcXG5cXG5gXFxcImFyZWFcXFwiYCwgYFxcXCJwb2ludFxcXCJgLCBgXFxcInJ1bGVcXFwiYCwgYW5kIGBcXFwidGV4dFxcXCJgLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZW5jb2RpbmdcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRW5jb2RpbmdcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBrZXktdmFsdWUgbWFwcGluZyBiZXR3ZWVuIGVuY29kaW5nIGNoYW5uZWxzIGFuZCBkZWZpbml0aW9uIG9mIGZpZWxkcy5cIlxuICAgICAgICB9LFxuICAgICAgICBcIm5hbWVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJOYW1lIG9mIHRoZSB2aXN1YWxpemF0aW9uIGZvciBsYXRlciByZWZlcmVuY2UuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIG9wdGlvbmFsIGRlc2NyaXB0aW9uIG9mIHRoaXMgbWFyayBmb3IgY29tbWVudGluZyBwdXJwb3NlLlxcblxcblRoaXMgcHJvcGVydHkgaGFzIG5vIGVmZmVjdCBvbiB0aGUgb3V0cHV0IHZpc3VhbGl6YXRpb24uXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkYXRhXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0RhdGFcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGRhdGEgc291cmNlXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0cmFuc2Zvcm1cIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVHJhbnNmb3JtXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIG9iamVjdCBkZXNjcmliaW5nIGZpbHRlciBhbmQgbmV3IGZpZWxkIGNhbGN1bGF0aW9uLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY29uZmlnXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0NvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb25maWd1cmF0aW9uIG9iamVjdFwiXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInJlcXVpcmVkXCI6IFtcbiAgICAgICAgXCJtYXJrXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiTWFya1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwiYXJlYVwiLFxuICAgICAgICBcImJhclwiLFxuICAgICAgICBcImxpbmVcIixcbiAgICAgICAgXCJwb2ludFwiLFxuICAgICAgICBcInRleHRcIixcbiAgICAgICAgXCJ0aWNrXCIsXG4gICAgICAgIFwicnVsZVwiLFxuICAgICAgICBcImNpcmNsZVwiLFxuICAgICAgICBcInNxdWFyZVwiLFxuICAgICAgICBcImVycm9yQmFyXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiRW5jb2RpbmdcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcInJvd1wiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Qb3NpdGlvbkNoYW5uZWxEZWZcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVmVydGljYWwgZmFjZXRzIGZvciB0cmVsbGlzIHBsb3RzLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY29sdW1uXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJIb3Jpem9udGFsIGZhY2V0cyBmb3IgdHJlbGxpcyBwbG90cy5cIlxuICAgICAgICB9LFxuICAgICAgICBcInhcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvUG9zaXRpb25DaGFubmVsRGVmXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlggY29vcmRpbmF0ZXMgZm9yIGBwb2ludGAsIGBjaXJjbGVgLCBgc3F1YXJlYCxcXG5cXG5gbGluZWAsIGBydWxlYCwgYHRleHRgLCBhbmQgYHRpY2tgXFxuXFxuKG9yIHRvIHdpZHRoIGFuZCBoZWlnaHQgZm9yIGBiYXJgIGFuZCBgYXJlYWAgbWFya3MpLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwieVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Qb3NpdGlvbkNoYW5uZWxEZWZcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiWSBjb29yZGluYXRlcyBmb3IgYHBvaW50YCwgYGNpcmNsZWAsIGBzcXVhcmVgLFxcblxcbmBsaW5lYCwgYHJ1bGVgLCBgdGV4dGAsIGFuZCBgdGlja2BcXG5cXG4ob3IgdG8gd2lkdGggYW5kIGhlaWdodCBmb3IgYGJhcmAgYW5kIGBhcmVhYCBtYXJrcykuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ4MlwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Qb3NpdGlvbkNoYW5uZWxEZWZcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiWDIgY29vcmRpbmF0ZXMgZm9yIHJhbmdlZCBgYmFyYCwgYHJ1bGVgLCBgYXJlYWBcIlxuICAgICAgICB9LFxuICAgICAgICBcInkyXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJZMiBjb29yZGluYXRlcyBmb3IgcmFuZ2VkIGBiYXJgLCBgcnVsZWAsIGBhcmVhYFwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY29sb3JcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ2hhbm5lbERlZldpdGhMZWdlbmRcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ29sb3Igb2YgdGhlIG1hcmtzIOKAkyBlaXRoZXIgZmlsbCBvciBzdHJva2UgY29sb3IgYmFzZWQgb24gbWFyayB0eXBlLlxcblxcbihCeSBkZWZhdWx0LCBmaWxsIGNvbG9yIGZvciBgYXJlYWAsIGBiYXJgLCBgdGlja2AsIGB0ZXh0YCwgYGNpcmNsZWAsIGFuZCBgc3F1YXJlYCAvXFxuXFxuc3Ryb2tlIGNvbG9yIGZvciBgbGluZWAgYW5kIGBwb2ludGAuKVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DaGFubmVsRGVmV2l0aExlZ2VuZFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPcGFjaXR5IG9mIHRoZSBtYXJrcyDigJMgZWl0aGVyIGNhbiBiZSBhIHZhbHVlIG9yIGluIGEgcmFuZ2UuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaXplXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0NoYW5uZWxEZWZXaXRoTGVnZW5kXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlNpemUgb2YgdGhlIG1hcmsuXFxuXFxuLSBGb3IgYHBvaW50YCwgYHNxdWFyZWAgYW5kIGBjaXJjbGVgXFxuXFxu4oCTIHRoZSBzeW1ib2wgc2l6ZSwgb3IgcGl4ZWwgYXJlYSBvZiB0aGUgbWFyay5cXG5cXG4tIEZvciBgYmFyYCBhbmQgYHRpY2tgIOKAkyB0aGUgYmFyIGFuZCB0aWNrJ3Mgc2l6ZS5cXG5cXG4tIEZvciBgdGV4dGAg4oCTIHRoZSB0ZXh0J3MgZm9udCBzaXplLlxcblxcbi0gU2l6ZSBpcyBjdXJyZW50bHkgdW5zdXBwb3J0ZWQgZm9yIGBsaW5lYCBhbmQgYGFyZWFgLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic2hhcGVcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ2hhbm5lbERlZldpdGhMZWdlbmRcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHN5bWJvbCdzIHNoYXBlIChvbmx5IGZvciBgcG9pbnRgIG1hcmtzKS4gVGhlIHN1cHBvcnRlZCB2YWx1ZXMgYXJlXFxuXFxuYFxcXCJjaXJjbGVcXFwiYCAoZGVmYXVsdCksIGBcXFwic3F1YXJlXFxcImAsIGBcXFwiY3Jvc3NcXFwiYCwgYFxcXCJkaWFtb25kXFxcImAsIGBcXFwidHJpYW5nbGUtdXBcXFwiYCxcXG5cXG5vciBgXFxcInRyaWFuZ2xlLWRvd25cXFwiYCwgb3IgZWxzZSBhIGN1c3RvbSBTVkcgcGF0aCBzdHJpbmcuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZXRhaWxcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBZGRpdGlvbmFsIGxldmVscyBvZiBkZXRhaWwgZm9yIGdyb3VwaW5nIGRhdGEgaW4gYWdncmVnYXRlIHZpZXdzIGFuZFxcblxcbmluIGxpbmUgYW5kIGFyZWEgbWFya3Mgd2l0aG91dCBtYXBwaW5nIGRhdGEgdG8gYSBzcGVjaWZpYyB2aXN1YWwgY2hhbm5lbC5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GaWVsZERlZlwiLFxuICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZXJmYWNlIGZvciBhbnkga2luZCBvZiBGaWVsZERlZjtcXG5cXG5Gb3Igc2ltcGxpY2l0eSwgd2UgZG8gbm90IGRlY2xhcmUgbXVsdGlwbGUgaW50ZXJmYWNlcyBvZiBGaWVsZERlZiBsaWtlXFxuXFxud2UgZG8gZm9yIEpTT04gc2NoZW1hLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZpZWxkRGVmXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkludGVyZmFjZSBmb3IgYW55IGtpbmQgb2YgRmllbGREZWY7XFxuXFxuRm9yIHNpbXBsaWNpdHksIHdlIGRvIG5vdCBkZWNsYXJlIG11bHRpcGxlIGludGVyZmFjZXMgb2YgRmllbGREZWYgbGlrZVxcblxcbndlIGRvIGZvciBKU09OIHNjaGVtYS5cIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcInRleHRcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmllbGREZWZcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGV4dCBvZiB0aGUgYHRleHRgIG1hcmsuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GaWVsZERlZlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwicGF0aFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9yZGVyIG9mIGRhdGEgcG9pbnRzIGluIGxpbmUgbWFya3MuXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJvcmRlclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkxheWVyIG9yZGVyIGZvciBub24tc3RhY2tlZCBtYXJrcywgb3Igc3RhY2sgb3JkZXIgZm9yIHN0YWNrZWQgbWFya3MuXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJQb3NpdGlvbkNoYW5uZWxEZWZcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcImF4aXNcIjoge1xuICAgICAgICAgIFwib25lT2ZcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQXhpc1wiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcInNjYWxlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NjYWxlXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzb3J0XCI6IHtcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Tb3J0RmllbGRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Tb3J0T3JkZXJcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJmaWVsZFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk5hbWUgb2YgdGhlIGZpZWxkIGZyb20gd2hpY2ggdG8gcHVsbCBhIGRhdGEgdmFsdWUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0eXBlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1R5cGVcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGVuY29kZWQgZmllbGQncyB0eXBlIG9mIG1lYXN1cmVtZW50LiBUaGlzIGNhbiBiZSBlaXRoZXIgYSBmdWxsIHR5cGVcXG5cXG5uYW1lIChgXFxcInF1YW50aXRhdGl2ZVxcXCJgLCBgXFxcInRlbXBvcmFsXFxcImAsIGBcXFwib3JkaW5hbFxcXCJgLCAgYW5kIGBcXFwibm9taW5hbFxcXCJgKVxcblxcbm9yIGFuIGluaXRpYWwgY2hhcmFjdGVyIG9mIHRoZSB0eXBlIG5hbWUgKGBcXFwiUVxcXCJgLCBgXFxcIlRcXFwiYCwgYFxcXCJPXFxcImAsIGBcXFwiTlxcXCJgKS5cXG5cXG5UaGlzIHByb3BlcnR5IGlzIGNhc2UgaW5zZW5zaXRpdmUuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ2YWx1ZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgY29uc3RhbnQgdmFsdWUgaW4gdmlzdWFsIGRvbWFpbi5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwidGltZVVuaXRcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVGltZVVuaXRcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGltZSB1bml0IGZvciBhIGB0ZW1wb3JhbGAgZmllbGQgIChlLmcuLCBgeWVhcmAsIGB5ZWFybW9udGhgLCBgbW9udGhgLCBgaG91cmApLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiYmluXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRmxhZyBmb3IgYmlubmluZyBhIGBxdWFudGl0YXRpdmVgIGZpZWxkLCBvciBhIGJpbiBwcm9wZXJ0eSBvYmplY3RcXG5cXG5mb3IgYmlubmluZyBwYXJhbWV0ZXJzLlwiLFxuICAgICAgICAgIFwib25lT2ZcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQmluXCIsXG4gICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJCaW5uaW5nIHByb3BlcnRpZXMgb3IgYm9vbGVhbiBmbGFnIGZvciBkZXRlcm1pbmluZyB3aGV0aGVyIHRvIGJpbiBkYXRhIG9yIG5vdC5cIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhZ2dyZWdhdGVcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQWdncmVnYXRlT3BcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQWdncmVnYXRpb24gZnVuY3Rpb24gZm9yIHRoZSBmaWVsZFxcblxcbihlLmcuLCBgbWVhbmAsIGBzdW1gLCBgbWVkaWFuYCwgYG1pbmAsIGBtYXhgLCBgY291bnRgKS5cIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGl0bGUgZm9yIGF4aXMgb3IgbGVnZW5kLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwiQXhpc1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwibGFiZWxBbmdsZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSByb3RhdGlvbiBhbmdsZSBvZiB0aGUgYXhpcyBsYWJlbHMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJmb3JtYXRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9ybWF0dGluZyBwYXR0ZXJuIGZvciBheGlzIGxhYmVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcIm9yaWVudFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9BeGlzT3JpZW50XCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvcmllbnRhdGlvbiBvZiB0aGUgYXhpcy4gT25lIG9mIHRvcCwgYm90dG9tLCBsZWZ0IG9yIHJpZ2h0LiBUaGUgb3JpZW50YXRpb24gY2FuIGJlIHVzZWQgdG8gZnVydGhlciBzcGVjaWFsaXplIHRoZSBheGlzIHR5cGUgKGUuZy4sIGEgeSBheGlzIG9yaWVudGVkIGZvciB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgY2hhcnQpLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIHRpdGxlIGZvciB0aGUgYXhpcy4gU2hvd3MgZmllbGQgbmFtZSBhbmQgaXRzIGZ1bmN0aW9uIGJ5IGRlZmF1bHQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ2YWx1ZXNcIjoge1xuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJheGlzV2lkdGhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJXaWR0aCBvZiB0aGUgYXhpcyBsaW5lXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYXllclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc3RyaW5nIGluZGljYXRpbmcgaWYgdGhlIGF4aXMgKGFuZCBhbnkgZ3JpZGxpbmVzKSBzaG91bGQgYmUgcGxhY2VkIGFib3ZlIG9yIGJlbG93IHRoZSBkYXRhIG1hcmtzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwib2Zmc2V0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCwgaW4gcGl4ZWxzLCBieSB3aGljaCB0byBkaXNwbGFjZSB0aGUgYXhpcyBmcm9tIHRoZSBlZGdlIG9mIHRoZSBlbmNsb3NpbmcgZ3JvdXAgb3IgZGF0YSByZWN0YW5nbGUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJheGlzQ29sb3JcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb2xvciBvZiBheGlzIGxpbmUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJncmlkXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBmbGFnIGluZGljYXRlIGlmIGdyaWRsaW5lcyBzaG91bGQgYmUgY3JlYXRlZCBpbiBhZGRpdGlvbiB0byB0aWNrcy4gSWYgYGdyaWRgIGlzIHVuc3BlY2lmaWVkLCB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgdHJ1ZWAgZm9yIFJPVyBhbmQgQ09MLiBGb3IgWCBhbmQgWSwgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYHRydWVgIGZvciBxdWFudGl0YXRpdmUgYW5kIHRpbWUgZmllbGRzIGFuZCBgZmFsc2VgIG90aGVyd2lzZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJncmlkQ29sb3JcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb2xvciBvZiBncmlkbGluZXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJncmlkRGFzaFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvZmZzZXQgKGluIHBpeGVscykgaW50byB3aGljaCB0byBiZWdpbiBkcmF3aW5nIHdpdGggdGhlIGdyaWQgZGFzaCBhcnJheS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JpZE9wYWNpdHlcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc3Ryb2tlIG9wYWNpdHkgb2YgZ3JpZCAodmFsdWUgYmV0d2VlbiBbMCwxXSlcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyaWRXaWR0aFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBncmlkIHdpZHRoLCBpbiBwaXhlbHMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbHNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJFbmFibGUgb3IgZGlzYWJsZSBsYWJlbHMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibGFiZWxBbGlnblwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRleHQgYWxpZ25tZW50IGZvciB0aGUgTGFiZWwuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbEJhc2VsaW5lXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGV4dCBiYXNlbGluZSBmb3IgdGhlIGxhYmVsLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwibGFiZWxNYXhMZW5ndGhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUcnVuY2F0ZSBsYWJlbHMgdGhhdCBhcmUgdG9vIGxvbmcuXCIsXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDEsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaG9ydFRpbWVMYWJlbHNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJXaGV0aGVyIG1vbnRoIGFuZCBkYXkgbmFtZXMgc2hvdWxkIGJlIGFiYnJldmlhdGVkLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICB9LFxuICAgICAgICBcInN1YmRpdmlkZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIklmIHByb3ZpZGVkLCBzZXRzIHRoZSBudW1iZXIgb2YgbWlub3IgdGlja3MgYmV0d2VlbiBtYWpvciB0aWNrcyAodGhlIHZhbHVlIDkgcmVzdWx0cyBpbiBkZWNpbWFsIHN1YmRpdmlzaW9uKS4gT25seSBhcHBsaWNhYmxlIGZvciBheGVzIHZpc3VhbGl6aW5nIHF1YW50aXRhdGl2ZSBzY2FsZXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aWNrc1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgZGVzaXJlZCBudW1iZXIgb2YgdGlja3MsIGZvciBheGVzIHZpc3VhbGl6aW5nIHF1YW50aXRhdGl2ZSBzY2FsZXMuIFRoZSByZXN1bHRpbmcgbnVtYmVyIG1heSBiZSBkaWZmZXJlbnQgc28gdGhhdCB2YWx1ZXMgYXJlIFxcXCJuaWNlXFxcIiAobXVsdGlwbGVzIG9mIDIsIDUsIDEwKSBhbmQgbGllIHdpdGhpbiB0aGUgdW5kZXJseWluZyBzY2FsZSdzIHJhbmdlLlwiLFxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGlja0NvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBheGlzJ3MgdGljay5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tMYWJlbENvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSB0aWNrIGxhYmVsLCBjYW4gYmUgaW4gaGV4IGNvbG9yIGNvZGUgb3IgcmVndWxhciBjb2xvciBuYW1lLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGlja0xhYmVsRm9udFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb250IG9mIHRoZSB0aWNrIGxhYmVsLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGlja0xhYmVsRm9udFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzaXplIG9mIGxhYmVsLCBpbiBwaXhlbHMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aWNrUGFkZGluZ1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBwYWRkaW5nLCBpbiBwaXhlbHMsIGJldHdlZW4gdGlja3MgYW5kIHRleHQgbGFiZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGlja1NpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSwgaW4gcGl4ZWxzLCBvZiBtYWpvciwgbWlub3IgYW5kIGVuZCB0aWNrcy5cIixcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tTaXplTWFqb3JcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSwgaW4gcGl4ZWxzLCBvZiBtYWpvciB0aWNrcy5cIixcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tTaXplTWlub3JcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSwgaW4gcGl4ZWxzLCBvZiBtaW5vciB0aWNrcy5cIixcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tTaXplRW5kXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUsIGluIHBpeGVscywgb2YgZW5kIHRpY2tzLlwiLFxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGlja1dpZHRoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHdpZHRoLCBpbiBwaXhlbHMsIG9mIHRpY2tzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVDb2xvclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIHRoZSB0aXRsZSwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlRm9udFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZvbnQgb2YgdGhlIHRpdGxlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVGb250U2l6ZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlNpemUgb2YgdGhlIHRpdGxlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVGb250V2VpZ2h0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2VpZ2h0IG9mIHRoZSB0aXRsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlT2Zmc2V0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSB0aXRsZSBvZmZzZXQgdmFsdWUgZm9yIHRoZSBheGlzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVNYXhMZW5ndGhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJNYXggbGVuZ3RoIGZvciBheGlzIHRpdGxlIGlmIHRoZSB0aXRsZSBpcyBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBmcm9tIHRoZSBmaWVsZCdzIGRlc2NyaXB0aW9uLiBCeSBkZWZhdWx0LCB0aGlzIGlzIGF1dG9tYXRpY2FsbHkgYmFzZWQgb24gY2VsbCBzaXplIGFuZCBjaGFyYWN0ZXJXaWR0aCBwcm9wZXJ0eS5cIixcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImNoYXJhY3RlcldpZHRoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ2hhcmFjdGVyIHdpZHRoIGZvciBhdXRvbWF0aWNhbGx5IGRldGVybWluaW5nIHRpdGxlIG1heCBsZW5ndGguXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT3B0aW9uYWwgbWFyayBwcm9wZXJ0eSBkZWZpbml0aW9ucyBmb3IgY3VzdG9tIGF4aXMgc3R5bGluZy5cIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkF4aXNPcmllbnRcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICBcImVudW1cIjogW1xuICAgICAgICBcInRvcFwiLFxuICAgICAgICBcInJpZ2h0XCIsXG4gICAgICAgIFwibGVmdFwiLFxuICAgICAgICBcImJvdHRvbVwiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIlNjYWxlXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJ0eXBlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NjYWxlVHlwZVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZG9tYWluXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGRvbWFpbiBvZiB0aGUgc2NhbGUsIHJlcHJlc2VudGluZyB0aGUgc2V0IG9mIGRhdGEgdmFsdWVzLiBGb3IgcXVhbnRpdGF0aXZlIGRhdGEsIHRoaXMgY2FuIHRha2UgdGhlIGZvcm0gb2YgYSB0d28tZWxlbWVudCBhcnJheSB3aXRoIG1pbmltdW0gYW5kIG1heGltdW0gdmFsdWVzLiBGb3Igb3JkaW5hbC9jYXRlZ29yaWNhbCBkYXRhLCB0aGlzIG1heSBiZSBhbiBhcnJheSBvZiB2YWxpZCBpbnB1dCB2YWx1ZXMuXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwicmFuZ2VcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcmFuZ2Ugb2YgdGhlIHNjYWxlLCByZXByZXNlbnRpbmcgdGhlIHNldCBvZiB2aXN1YWwgdmFsdWVzLiBGb3IgbnVtZXJpYyB2YWx1ZXMsIHRoZSByYW5nZSBjYW4gdGFrZSB0aGUgZm9ybSBvZiBhIHR3by1lbGVtZW50IGFycmF5IHdpdGggbWluaW11bSBhbmQgbWF4aW11bSB2YWx1ZXMuIEZvciBvcmRpbmFsIG9yIHF1YW50aXplZCBkYXRhLCB0aGUgcmFuZ2UgbWF5IGJ5IGFuIGFycmF5IG9mIGRlc2lyZWQgb3V0cHV0IHZhbHVlcywgd2hpY2ggYXJlIG1hcHBlZCB0byBlbGVtZW50cyBpbiB0aGUgc3BlY2lmaWVkIGRvbWFpbi4gRm9yIG9yZGluYWwgc2NhbGVzIG9ubHksIHRoZSByYW5nZSBjYW4gYmUgZGVmaW5lZCB1c2luZyBhIERhdGFSZWY6IHRoZSByYW5nZSB2YWx1ZXMgYXJlIHRoZW4gZHJhd24gZHluYW1pY2FsbHkgZnJvbSBhIGJhY2tpbmcgZGF0YSBzZXQuXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcInJvdW5kXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSWYgdHJ1ZSwgcm91bmRzIG51bWVyaWMgb3V0cHV0IHZhbHVlcyB0byBpbnRlZ2Vycy4gVGhpcyBjYW4gYmUgaGVscGZ1bCBmb3Igc25hcHBpbmcgdG8gdGhlIHBpeGVsIGdyaWQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiYmFuZFNpemVcIjoge1xuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwicGFkZGluZ1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFwcGxpZXMgc3BhY2luZyBhbW9uZyBvcmRpbmFsIGVsZW1lbnRzIGluIHRoZSBzY2FsZSByYW5nZS4gVGhlIGFjdHVhbCBlZmZlY3QgZGVwZW5kcyBvbiBob3cgdGhlIHNjYWxlIGlzIGNvbmZpZ3VyZWQuIElmIHRoZSBfX3BvaW50c19fIHBhcmFtZXRlciBpcyBgdHJ1ZWAsIHRoZSBwYWRkaW5nIHZhbHVlIGlzIGludGVycHJldGVkIGFzIGEgbXVsdGlwbGUgb2YgdGhlIHNwYWNpbmcgYmV0d2VlbiBwb2ludHMuIEEgcmVhc29uYWJsZSB2YWx1ZSBpcyAxLjAsIHN1Y2ggdGhhdCB0aGUgZmlyc3QgYW5kIGxhc3QgcG9pbnQgd2lsbCBiZSBvZmZzZXQgZnJvbSB0aGUgbWluaW11bSBhbmQgbWF4aW11bSB2YWx1ZSBieSBoYWxmIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHBvaW50cy4gT3RoZXJ3aXNlLCBwYWRkaW5nIGlzIHR5cGljYWxseSBpbiB0aGUgcmFuZ2UgWzAsIDFdIGFuZCBjb3JyZXNwb25kcyB0byB0aGUgZnJhY3Rpb24gb2Ygc3BhY2UgaW4gdGhlIHJhbmdlIGludGVydmFsIHRvIGFsbG9jYXRlIHRvIHBhZGRpbmcuIEEgdmFsdWUgb2YgMC41IG1lYW5zIHRoYXQgdGhlIHJhbmdlIGJhbmQgd2lkdGggd2lsbCBiZSBlcXVhbCB0byB0aGUgcGFkZGluZyB3aWR0aC4gRm9yIG1vcmUsIHNlZSB0aGUgW0QzIG9yZGluYWwgc2NhbGUgZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9naXRodWIuY29tL21ib3N0b2NrL2QzL3dpa2kvT3JkaW5hbC1TY2FsZXMpLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY2xhbXBcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJZiB0cnVlLCB2YWx1ZXMgdGhhdCBleGNlZWQgdGhlIGRhdGEgZG9tYWluIGFyZSBjbGFtcGVkIHRvIGVpdGhlciB0aGUgbWluaW11bSBvciBtYXhpbXVtIHJhbmdlIHZhbHVlXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibmljZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIklmIHNwZWNpZmllZCwgbW9kaWZpZXMgdGhlIHNjYWxlIGRvbWFpbiB0byB1c2UgYSBtb3JlIGh1bWFuLWZyaWVuZGx5IHZhbHVlIHJhbmdlLiBJZiBzcGVjaWZpZWQgYXMgYSB0cnVlIGJvb2xlYW4sIG1vZGlmaWVzIHRoZSBzY2FsZSBkb21haW4gdG8gdXNlIGEgbW9yZSBodW1hbi1mcmllbmRseSBudW1iZXIgcmFuZ2UgKGUuZy4sIDcgaW5zdGVhZCBvZiA2Ljk2KS4gSWYgc3BlY2lmaWVkIGFzIGEgc3RyaW5nLCBtb2RpZmllcyB0aGUgc2NhbGUgZG9tYWluIHRvIHVzZSBhIG1vcmUgaHVtYW4tZnJpZW5kbHkgdmFsdWUgcmFuZ2UuIEZvciB0aW1lIGFuZCB1dGMgc2NhbGUgdHlwZXMgb25seSwgdGhlIG5pY2UgdmFsdWUgc2hvdWxkIGJlIGEgc3RyaW5nIGluZGljYXRpbmcgdGhlIGRlc2lyZWQgdGltZSBpbnRlcnZhbC5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL05pY2VUaW1lXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwiZXhwb25lbnRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTZXRzIHRoZSBleHBvbmVudCBvZiB0aGUgc2NhbGUgdHJhbnNmb3JtYXRpb24uIEZvciBwb3cgc2NhbGUgdHlwZXMgb25seSwgb3RoZXJ3aXNlIGlnbm9yZWQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ6ZXJvXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSWYgYHRydWVgLCBlbnN1cmVzIHRoYXQgYSB6ZXJvIGJhc2VsaW5lIHZhbHVlIGlzIGluY2x1ZGVkIGluIHRoZSBzY2FsZSBkb21haW4uXFxuXFxuRGVmYXVsdCB2YWx1ZTogYHRydWVgIGZvciBgeGAgYW5kIGB5YCBjaGFubmVsIGlmIHRoZSBxdWFudGl0YXRpdmUgZmllbGQgaXMgbm90IGJpbm5lZFxcblxcbmFuZCBubyBjdXN0b20gYGRvbWFpbmAgaXMgcHJvdmlkZWQ7IGBmYWxzZWAgb3RoZXJ3aXNlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICB9LFxuICAgICAgICBcInVzZVJhd0RvbWFpblwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlVzZXMgdGhlIHNvdXJjZSBkYXRhIHJhbmdlIGFzIHNjYWxlIGRvbWFpbiBpbnN0ZWFkIG9mIGFnZ3JlZ2F0ZWQgZGF0YSBmb3IgYWdncmVnYXRlIGF4aXMuXFxuXFxuVGhpcyBwcm9wZXJ0eSBvbmx5IHdvcmtzIHdpdGggYWdncmVnYXRlIGZ1bmN0aW9ucyB0aGF0IHByb2R1Y2UgdmFsdWVzIHdpdGhpbiB0aGUgcmF3IGRhdGEgZG9tYWluIChgXFxcIm1lYW5cXFwiYCwgYFxcXCJhdmVyYWdlXFxcImAsIGBcXFwic3RkZXZcXFwiYCwgYFxcXCJzdGRldnBcXFwiYCwgYFxcXCJtZWRpYW5cXFwiYCwgYFxcXCJxMVxcXCJgLCBgXFxcInEzXFxcImAsIGBcXFwibWluXFxcImAsIGBcXFwibWF4XFxcImApLiBGb3Igb3RoZXIgYWdncmVnYXRpb25zIHRoYXQgcHJvZHVjZSB2YWx1ZXMgb3V0c2lkZSBvZiB0aGUgcmF3IGRhdGEgZG9tYWluIChlLmcuIGBcXFwiY291bnRcXFwiYCwgYFxcXCJzdW1cXFwiYCksIHRoaXMgcHJvcGVydHkgaXMgaWdub3JlZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJTY2FsZVR5cGVcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICBcImVudW1cIjogW1xuICAgICAgICBcImxpbmVhclwiLFxuICAgICAgICBcImxvZ1wiLFxuICAgICAgICBcInBvd1wiLFxuICAgICAgICBcInNxcnRcIixcbiAgICAgICAgXCJxdWFudGlsZVwiLFxuICAgICAgICBcInF1YW50aXplXCIsXG4gICAgICAgIFwib3JkaW5hbFwiLFxuICAgICAgICBcInRpbWVcIixcbiAgICAgICAgXCJ1dGNcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJOaWNlVGltZVwiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwic2Vjb25kXCIsXG4gICAgICAgIFwibWludXRlXCIsXG4gICAgICAgIFwiaG91clwiLFxuICAgICAgICBcImRheVwiLFxuICAgICAgICBcIndlZWtcIixcbiAgICAgICAgXCJtb250aFwiLFxuICAgICAgICBcInllYXJcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJTb3J0RmllbGRcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcImZpZWxkXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZpZWxkIG5hbWUgdG8gYWdncmVnYXRlIG92ZXIuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9BZ2dyZWdhdGVPcFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc29ydCBhZ2dyZWdhdGlvbiBvcGVyYXRvclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwib3JkZXJcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvU29ydE9yZGVyXCJcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFwicmVxdWlyZWRcIjogW1xuICAgICAgICBcImZpZWxkXCIsXG4gICAgICAgIFwib3BcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJBZ2dyZWdhdGVPcFwiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwidmFsdWVzXCIsXG4gICAgICAgIFwiY291bnRcIixcbiAgICAgICAgXCJ2YWxpZFwiLFxuICAgICAgICBcIm1pc3NpbmdcIixcbiAgICAgICAgXCJkaXN0aW5jdFwiLFxuICAgICAgICBcInN1bVwiLFxuICAgICAgICBcIm1lYW5cIixcbiAgICAgICAgXCJhdmVyYWdlXCIsXG4gICAgICAgIFwidmFyaWFuY2VcIixcbiAgICAgICAgXCJ2YXJpYW5jZXBcIixcbiAgICAgICAgXCJzdGRldlwiLFxuICAgICAgICBcInN0ZGV2cFwiLFxuICAgICAgICBcIm1lZGlhblwiLFxuICAgICAgICBcInExXCIsXG4gICAgICAgIFwicTNcIixcbiAgICAgICAgXCJtb2Rlc2tld1wiLFxuICAgICAgICBcIm1pblwiLFxuICAgICAgICBcIm1heFwiLFxuICAgICAgICBcImFyZ21pblwiLFxuICAgICAgICBcImFyZ21heFwiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIlNvcnRPcmRlclwiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwiYXNjZW5kaW5nXCIsXG4gICAgICAgIFwiZGVzY2VuZGluZ1wiLFxuICAgICAgICBcIm5vbmVcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJUeXBlXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgXCJlbnVtXCI6IFtcbiAgICAgICAgXCJxdWFudGl0YXRpdmVcIixcbiAgICAgICAgXCJvcmRpbmFsXCIsXG4gICAgICAgIFwidGVtcG9yYWxcIixcbiAgICAgICAgXCJub21pbmFsXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiVGltZVVuaXRcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICBcImVudW1cIjogW1xuICAgICAgICBcInllYXJcIixcbiAgICAgICAgXCJtb250aFwiLFxuICAgICAgICBcImRheVwiLFxuICAgICAgICBcImRhdGVcIixcbiAgICAgICAgXCJob3Vyc1wiLFxuICAgICAgICBcIm1pbnV0ZXNcIixcbiAgICAgICAgXCJzZWNvbmRzXCIsXG4gICAgICAgIFwibWlsbGlzZWNvbmRzXCIsXG4gICAgICAgIFwieWVhcm1vbnRoXCIsXG4gICAgICAgIFwieWVhcm1vbnRoZGF0ZVwiLFxuICAgICAgICBcInllYXJtb250aGRhdGVob3Vyc1wiLFxuICAgICAgICBcInllYXJtb250aGRhdGVob3Vyc21pbnV0ZXNcIixcbiAgICAgICAgXCJ5ZWFybW9udGhkYXRlaG91cnNtaW51dGVzc2Vjb25kc1wiLFxuICAgICAgICBcImhvdXJzbWludXRlc1wiLFxuICAgICAgICBcImhvdXJzbWludXRlc3NlY29uZHNcIixcbiAgICAgICAgXCJtaW51dGVzc2Vjb25kc1wiLFxuICAgICAgICBcInNlY29uZHNtaWxsaXNlY29uZHNcIixcbiAgICAgICAgXCJxdWFydGVyXCIsXG4gICAgICAgIFwieWVhcnF1YXJ0ZXJcIixcbiAgICAgICAgXCJxdWFydGVybW9udGhcIixcbiAgICAgICAgXCJ5ZWFycXVhcnRlcm1vbnRoXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiQmluXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJtaW5cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgbWluaW11bSBiaW4gdmFsdWUgdG8gY29uc2lkZXIuIElmIHVuc3BlY2lmaWVkLCB0aGUgbWluaW11bSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIGZpZWxkIGlzIHVzZWQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgbWF4aW11bSBiaW4gdmFsdWUgdG8gY29uc2lkZXIuIElmIHVuc3BlY2lmaWVkLCB0aGUgbWF4aW11bSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIGZpZWxkIGlzIHVzZWQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJiYXNlXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG51bWJlciBiYXNlIHRvIHVzZSBmb3IgYXV0b21hdGljIGJpbiBkZXRlcm1pbmF0aW9uIChkZWZhdWx0IGlzIGJhc2UgMTApLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3RlcFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIGV4YWN0IHN0ZXAgc2l6ZSB0byB1c2UgYmV0d2VlbiBiaW5zLiBJZiBwcm92aWRlZCwgb3B0aW9ucyBzdWNoIGFzIG1heGJpbnMgd2lsbCBiZSBpZ25vcmVkLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3RlcHNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBhcnJheSBvZiBhbGxvd2FibGUgc3RlcCBzaXplcyB0byBjaG9vc2UgZnJvbS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibWluc3RlcFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgbWluaW11bSBhbGxvd2FibGUgc3RlcCBzaXplIChwYXJ0aWN1bGFybHkgdXNlZnVsIGZvciBpbnRlZ2VyIHZhbHVlcykuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkaXZcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTY2FsZSBmYWN0b3JzIGluZGljYXRpbmcgYWxsb3dhYmxlIHN1YmRpdmlzaW9ucy4gVGhlIGRlZmF1bHQgdmFsdWUgaXMgWzUsIDJdLCB3aGljaCBpbmRpY2F0ZXMgdGhhdCBmb3IgYmFzZSAxMCBudW1iZXJzICh0aGUgZGVmYXVsdCBiYXNlKSwgdGhlIG1ldGhvZCBtYXkgY29uc2lkZXIgZGl2aWRpbmcgYmluIHNpemVzIGJ5IDUgYW5kL29yIDIuIEZvciBleGFtcGxlLCBmb3IgYW4gaW5pdGlhbCBzdGVwIHNpemUgb2YgMTAsIHRoZSBtZXRob2QgY2FuIGNoZWNrIGlmIGJpbiBzaXplcyBvZiAyICg9IDEwLzUpLCA1ICg9IDEwLzIpLCBvciAxICg9IDEwLyg1KjIpKSBtaWdodCBhbHNvIHNhdGlzZnkgdGhlIGdpdmVuIGNvbnN0cmFpbnRzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXhiaW5zXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTWF4aW11bSBudW1iZXIgb2YgYmlucy5cIixcbiAgICAgICAgICBcIm1pbmltdW1cIjogMixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkNoYW5uZWxEZWZXaXRoTGVnZW5kXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJsZWdlbmRcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvTGVnZW5kXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzY2FsZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9TY2FsZVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic29ydFwiOiB7XG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvU29ydEZpZWxkXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvU29ydE9yZGVyXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwiZmllbGRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJOYW1lIG9mIHRoZSBmaWVsZCBmcm9tIHdoaWNoIHRvIHB1bGwgYSBkYXRhIHZhbHVlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidHlwZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UeXBlXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBlbmNvZGVkIGZpZWxkJ3MgdHlwZSBvZiBtZWFzdXJlbWVudC4gVGhpcyBjYW4gYmUgZWl0aGVyIGEgZnVsbCB0eXBlXFxuXFxubmFtZSAoYFxcXCJxdWFudGl0YXRpdmVcXFwiYCwgYFxcXCJ0ZW1wb3JhbFxcXCJgLCBgXFxcIm9yZGluYWxcXFwiYCwgIGFuZCBgXFxcIm5vbWluYWxcXFwiYClcXG5cXG5vciBhbiBpbml0aWFsIGNoYXJhY3RlciBvZiB0aGUgdHlwZSBuYW1lIChgXFxcIlFcXFwiYCwgYFxcXCJUXFxcImAsIGBcXFwiT1xcXCJgLCBgXFxcIk5cXFwiYCkuXFxuXFxuVGhpcyBwcm9wZXJ0eSBpcyBjYXNlIGluc2Vuc2l0aXZlLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidmFsdWVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIGNvbnN0YW50IHZhbHVlIGluIHZpc3VhbCBkb21haW4uXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcInRpbWVVbml0XCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1RpbWVVbml0XCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRpbWUgdW5pdCBmb3IgYSBgdGVtcG9yYWxgIGZpZWxkICAoZS5nLiwgYHllYXJgLCBgeWVhcm1vbnRoYCwgYG1vbnRoYCwgYGhvdXJgKS5cIlxuICAgICAgICB9LFxuICAgICAgICBcImJpblwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZsYWcgZm9yIGJpbm5pbmcgYSBgcXVhbnRpdGF0aXZlYCBmaWVsZCwgb3IgYSBiaW4gcHJvcGVydHkgb2JqZWN0XFxuXFxuZm9yIGJpbm5pbmcgcGFyYW1ldGVycy5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0JpblwiLFxuICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQmlubmluZyBwcm9wZXJ0aWVzIG9yIGJvb2xlYW4gZmxhZyBmb3IgZGV0ZXJtaW5pbmcgd2hldGhlciB0byBiaW4gZGF0YSBvciBub3QuXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwiYWdncmVnYXRlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0FnZ3JlZ2F0ZU9wXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFnZ3JlZ2F0aW9uIGZ1bmN0aW9uIGZvciB0aGUgZmllbGRcXG5cXG4oZS5nLiwgYG1lYW5gLCBgc3VtYCwgYG1lZGlhbmAsIGBtaW5gLCBgbWF4YCwgYGNvdW50YCkuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRpdGxlIGZvciBheGlzIG9yIGxlZ2VuZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkxlZ2VuZFwiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwiZm9ybWF0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb3B0aW9uYWwgZm9ybWF0dGluZyBwYXR0ZXJuIGZvciBsZWdlbmQgbGFiZWxzLiBWZWdhIHVzZXMgRDNcXFxcJ3MgZm9ybWF0IHBhdHRlcm4uXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgdGl0bGUgZm9yIHRoZSBsZWdlbmQuIChTaG93cyBmaWVsZCBuYW1lIGFuZCBpdHMgZnVuY3Rpb24gYnkgZGVmYXVsdC4pXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ2YWx1ZXNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJFeHBsaWNpdGx5IHNldCB0aGUgdmlzaWJsZSBsZWdlbmQgdmFsdWVzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7fVxuICAgICAgICB9LFxuICAgICAgICBcIm9yaWVudFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvcmllbnRhdGlvbiBvZiB0aGUgbGVnZW5kLiBPbmUgb2YgXFxcImxlZnRcXFwiIG9yIFxcXCJyaWdodFxcXCIuIFRoaXMgZGV0ZXJtaW5lcyBob3cgdGhlIGxlZ2VuZCBpcyBwb3NpdGlvbmVkIHdpdGhpbiB0aGUgc2NlbmUuIFRoZSBkZWZhdWx0IGlzIFxcXCJyaWdodFxcXCIuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvZmZzZXRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgb2Zmc2V0LCBpbiBwaXhlbHMsIGJ5IHdoaWNoIHRvIGRpc3BsYWNlIHRoZSBsZWdlbmQgZnJvbSB0aGUgZWRnZSBvZiB0aGUgZW5jbG9zaW5nIGdyb3VwIG9yIGRhdGEgcmVjdGFuZ2xlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwicGFkZGluZ1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBwYWRkaW5nLCBpbiBwaXhlbHMsIGJldHdlZW4gdGhlIGxlbmdlbmQgYW5kIGF4aXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXJnaW5cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgbWFyZ2luIGFyb3VuZCB0aGUgbGVnZW5kLCBpbiBwaXhlbHNcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyYWRpZW50U3Ryb2tlQ29sb3JcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgY29sb3Igb2YgdGhlIGdyYWRpZW50IHN0cm9rZSwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyYWRpZW50U3Ryb2tlV2lkdGhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgd2lkdGggb2YgdGhlIGdyYWRpZW50IHN0cm9rZSwgaW4gcGl4ZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JhZGllbnRIZWlnaHRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgaGVpZ2h0IG9mIHRoZSBncmFkaWVudCwgaW4gcGl4ZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JhZGllbnRXaWR0aFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCBvZiB0aGUgZ3JhZGllbnQsIGluIHBpeGVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsQWxpZ25cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgYWxpZ25tZW50IG9mIHRoZSBsZWdlbmQgbGFiZWwsIGNhbiBiZSBsZWZ0LCBtaWRkbGUgb3IgcmlnaHQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbEJhc2VsaW5lXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHBvc2l0aW9uIG9mIHRoZSBiYXNlbGluZSBvZiBsZWdlbmQgbGFiZWwsIGNhbiBiZSB0b3AsIG1pZGRsZSBvciBib3R0b20uXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbENvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBsZWdlbmQgbGFiZWwsIGNhbiBiZSBpbiBoZXggY29sb3IgY29kZSBvciByZWd1bGFyIGNvbG9yIG5hbWUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbEZvbnRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBvZiB0aGUgbGVuZ2VuZCBsYWJlbC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsRm9udFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzaXplIG9mIGxlbmdlbmQgbGFibGUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbE9mZnNldFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvZmZzZXQgb2YgdGhlIGxlZ2VuZCBsYWJlbC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInNob3J0VGltZUxhYmVsc1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldoZXRoZXIgbW9udGggbmFtZXMgYW5kIHdlZWtkYXkgbmFtZXMgc2hvdWxkIGJlIGFiYnJldmlhdGVkLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICB9LFxuICAgICAgICBcInN5bWJvbENvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBsZWdlbmQgc3ltYm9sLFwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3ltYm9sU2hhcGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2hhcGUgb2YgdGhlIGxlZ2VuZCBzeW1ib2wsIGNhbiBiZSB0aGUgJ2NpcmNsZScsICdzcXVhcmUnLCAnY3Jvc3MnLCAnZGlhbW9uZCcsXFxuXFxuJ3RyaWFuZ2xlLXVwJywgJ3RyaWFuZ2xlLWRvd24nLCBvciBlbHNlIGEgY3VzdG9tIFNWRyBwYXRoIHN0cmluZy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInN5bWJvbFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSBvZiB0aGUgbGVuZ2VuZCBzeW1ib2wsIGluIHBpeGVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInN5bWJvbFN0cm9rZVdpZHRoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHdpZHRoIG9mIHRoZSBzeW1ib2wncyBzdHJva2UuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZUNvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT3B0aW9uYWwgbWFyayBwcm9wZXJ0eSBkZWZpbml0aW9ucyBmb3IgY3VzdG9tIGxlZ2VuZCBzdHlsaW5nLlxcblxcblRoZSBjb2xvciBvZiB0aGUgbGVnZW5kIHRpdGxlLCBjYW4gYmUgaW4gaGV4IGNvbG9yIGNvZGUgb3IgcmVndWxhciBjb2xvciBuYW1lLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVGb250XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgb2YgdGhlIGxlZ2VuZCB0aXRsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlRm9udFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzaXplIG9mIHRoZSBsZWdlbmQgdGl0bGUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZUZvbnRXZWlnaHRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCB3ZWlnaHQgb2YgdGhlIGxlZ2VuZCB0aXRsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPcHRpb25hbCBtYXJrIHByb3BlcnR5IGRlZmluaXRpb25zIGZvciBjdXN0b20gbGVnZW5kIHN0eWxpbmcuXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJGaWVsZERlZlwiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwiZmllbGRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJOYW1lIG9mIHRoZSBmaWVsZCBmcm9tIHdoaWNoIHRvIHB1bGwgYSBkYXRhIHZhbHVlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidHlwZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UeXBlXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBlbmNvZGVkIGZpZWxkJ3MgdHlwZSBvZiBtZWFzdXJlbWVudC4gVGhpcyBjYW4gYmUgZWl0aGVyIGEgZnVsbCB0eXBlXFxuXFxubmFtZSAoYFxcXCJxdWFudGl0YXRpdmVcXFwiYCwgYFxcXCJ0ZW1wb3JhbFxcXCJgLCBgXFxcIm9yZGluYWxcXFwiYCwgIGFuZCBgXFxcIm5vbWluYWxcXFwiYClcXG5cXG5vciBhbiBpbml0aWFsIGNoYXJhY3RlciBvZiB0aGUgdHlwZSBuYW1lIChgXFxcIlFcXFwiYCwgYFxcXCJUXFxcImAsIGBcXFwiT1xcXCJgLCBgXFxcIk5cXFwiYCkuXFxuXFxuVGhpcyBwcm9wZXJ0eSBpcyBjYXNlIGluc2Vuc2l0aXZlLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidmFsdWVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIGNvbnN0YW50IHZhbHVlIGluIHZpc3VhbCBkb21haW4uXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcInRpbWVVbml0XCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1RpbWVVbml0XCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRpbWUgdW5pdCBmb3IgYSBgdGVtcG9yYWxgIGZpZWxkICAoZS5nLiwgYHllYXJgLCBgeWVhcm1vbnRoYCwgYG1vbnRoYCwgYGhvdXJgKS5cIlxuICAgICAgICB9LFxuICAgICAgICBcImJpblwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZsYWcgZm9yIGJpbm5pbmcgYSBgcXVhbnRpdGF0aXZlYCBmaWVsZCwgb3IgYSBiaW4gcHJvcGVydHkgb2JqZWN0XFxuXFxuZm9yIGJpbm5pbmcgcGFyYW1ldGVycy5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0JpblwiLFxuICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQmlubmluZyBwcm9wZXJ0aWVzIG9yIGJvb2xlYW4gZmxhZyBmb3IgZGV0ZXJtaW5pbmcgd2hldGhlciB0byBiaW4gZGF0YSBvciBub3QuXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwiYWdncmVnYXRlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0FnZ3JlZ2F0ZU9wXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFnZ3JlZ2F0aW9uIGZ1bmN0aW9uIGZvciB0aGUgZmllbGRcXG5cXG4oZS5nLiwgYG1lYW5gLCBgc3VtYCwgYG1lZGlhbmAsIGBtaW5gLCBgbWF4YCwgYGNvdW50YCkuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRpdGxlIGZvciBheGlzIG9yIGxlZ2VuZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIk9yZGVyQ2hhbm5lbERlZlwiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwic29ydFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Tb3J0T3JkZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImZpZWxkXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTmFtZSBvZiB0aGUgZmllbGQgZnJvbSB3aGljaCB0byBwdWxsIGEgZGF0YSB2YWx1ZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInR5cGVcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVHlwZVwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZW5jb2RlZCBmaWVsZCdzIHR5cGUgb2YgbWVhc3VyZW1lbnQuIFRoaXMgY2FuIGJlIGVpdGhlciBhIGZ1bGwgdHlwZVxcblxcbm5hbWUgKGBcXFwicXVhbnRpdGF0aXZlXFxcImAsIGBcXFwidGVtcG9yYWxcXFwiYCwgYFxcXCJvcmRpbmFsXFxcImAsICBhbmQgYFxcXCJub21pbmFsXFxcImApXFxuXFxub3IgYW4gaW5pdGlhbCBjaGFyYWN0ZXIgb2YgdGhlIHR5cGUgbmFtZSAoYFxcXCJRXFxcImAsIGBcXFwiVFxcXCJgLCBgXFxcIk9cXFwiYCwgYFxcXCJOXFxcImApLlxcblxcblRoaXMgcHJvcGVydHkgaXMgY2FzZSBpbnNlbnNpdGl2ZS5cIlxuICAgICAgICB9LFxuICAgICAgICBcInZhbHVlXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBjb25zdGFudCB2YWx1ZSBpbiB2aXN1YWwgZG9tYWluLlwiLFxuICAgICAgICAgIFwib25lT2ZcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aW1lVW5pdFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UaW1lVW5pdFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaW1lIHVuaXQgZm9yIGEgYHRlbXBvcmFsYCBmaWVsZCAgKGUuZy4sIGB5ZWFyYCwgYHllYXJtb250aGAsIGBtb250aGAsIGBob3VyYCkuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJiaW5cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGbGFnIGZvciBiaW5uaW5nIGEgYHF1YW50aXRhdGl2ZWAgZmllbGQsIG9yIGEgYmluIHByb3BlcnR5IG9iamVjdFxcblxcbmZvciBiaW5uaW5nIHBhcmFtZXRlcnMuXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9CaW5cIixcbiAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkJpbm5pbmcgcHJvcGVydGllcyBvciBib29sZWFuIGZsYWcgZm9yIGRldGVybWluaW5nIHdoZXRoZXIgdG8gYmluIGRhdGEgb3Igbm90LlwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcImFnZ3JlZ2F0ZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9BZ2dyZWdhdGVPcFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBZ2dyZWdhdGlvbiBmdW5jdGlvbiBmb3IgdGhlIGZpZWxkXFxuXFxuKGUuZy4sIGBtZWFuYCwgYHN1bWAsIGBtZWRpYW5gLCBgbWluYCwgYG1heGAsIGBjb3VudGApLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaXRsZSBmb3IgYXhpcyBvciBsZWdlbmQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJEYXRhXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJmb3JtYXRcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRGF0YUZvcm1hdFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvYmplY3QgdGhhdCBzcGVjaWZpZXMgdGhlIGZvcm1hdCBmb3IgdGhlIGRhdGEgZmlsZSBvciB2YWx1ZXMuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cmxcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIFVSTCBmcm9tIHdoaWNoIHRvIGxvYWQgdGhlIGRhdGEgc2V0LiBVc2UgdGhlIGZvcm1hdC50eXBlIHByb3BlcnR5XFxuXFxudG8gZW5zdXJlIHRoZSBsb2FkZWQgZGF0YSBpcyBjb3JyZWN0bHkgcGFyc2VkLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidmFsdWVzXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiUGFzcyBhcnJheSBvZiBvYmplY3RzIGluc3RlYWQgb2YgYSB1cmwgdG8gYSBmaWxlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkRhdGFGb3JtYXRcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcInR5cGVcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRGF0YUZvcm1hdFR5cGVcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVHlwZSBvZiBpbnB1dCBkYXRhOiBgXFxcImpzb25cXFwiYCwgYFxcXCJjc3ZcXFwiYCwgYFxcXCJ0c3ZcXFwiYC5cXG5cXG5UaGUgZGVmYXVsdCBmb3JtYXQgdHlwZSBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBleHRlbnNpb24gb2YgdGhlIGZpbGUgdXJsLlxcblxcbklmIG5vIGV4dGVuc2lvbiBpcyBkZXRlY3RlZCwgYFxcXCJqc29uXFxcImAgd2lsbCBiZSB1c2VkIGJ5IGRlZmF1bHQuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJwcm9wZXJ0eVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkpTT04gb25seSkgVGhlIEpTT04gcHJvcGVydHkgY29udGFpbmluZyB0aGUgZGVzaXJlZCBkYXRhLlxcblxcblRoaXMgcGFyYW1ldGVyIGNhbiBiZSB1c2VkIHdoZW4gdGhlIGxvYWRlZCBKU09OIGZpbGUgbWF5IGhhdmUgc3Vycm91bmRpbmcgc3RydWN0dXJlIG9yIG1ldGEtZGF0YS5cXG5cXG5Gb3IgZXhhbXBsZSBgXFxcInByb3BlcnR5XFxcIjogXFxcInZhbHVlcy5mZWF0dXJlc1xcXCJgIGlzIGVxdWl2YWxlbnQgdG8gcmV0cmlldmluZyBganNvbi52YWx1ZXMuZmVhdHVyZXNgXFxuXFxuZnJvbSB0aGUgbG9hZGVkIEpTT04gb2JqZWN0LlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZmVhdHVyZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBuYW1lIG9mIHRoZSBUb3BvSlNPTiBvYmplY3Qgc2V0IHRvIGNvbnZlcnQgdG8gYSBHZW9KU09OIGZlYXR1cmUgY29sbGVjdGlvbi5cXG5cXG5Gb3IgZXhhbXBsZSwgaW4gYSBtYXAgb2YgdGhlIHdvcmxkLCB0aGVyZSBtYXkgYmUgYW4gb2JqZWN0IHNldCBuYW1lZCBgXFxcImNvdW50cmllc1xcXCJgLlxcblxcblVzaW5nIHRoZSBmZWF0dXJlIHByb3BlcnR5LCB3ZSBjYW4gZXh0cmFjdCB0aGlzIHNldCBhbmQgZ2VuZXJhdGUgYSBHZW9KU09OIGZlYXR1cmUgb2JqZWN0IGZvciBlYWNoIGNvdW50cnkuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJtZXNoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG5hbWUgb2YgdGhlIFRvcG9KU09OIG9iamVjdCBzZXQgdG8gY29udmVydCB0byBhIG1lc2guXFxuXFxuU2ltaWxhciB0byB0aGUgYGZlYXR1cmVgIG9wdGlvbiwgYG1lc2hgIGV4dHJhY3RzIGEgbmFtZWQgVG9wb0pTT04gb2JqZWN0IHNldC5cXG5cXG5Vbmxpa2UgdGhlIGBmZWF0dXJlYCBvcHRpb24sIHRoZSBjb3JyZXNwb25kaW5nIGdlbyBkYXRhIGlzIHJldHVybmVkIGFzIGEgc2luZ2xlLCB1bmlmaWVkIG1lc2ggaW5zdGFuY2UsIG5vdCBhcyBpbmlkaXZpZHVhbCBHZW9KU09OIGZlYXR1cmVzLlxcblxcbkV4dHJhY3RpbmcgYSBtZXNoIGlzIHVzZWZ1bCBmb3IgbW9yZSBlZmZpY2llbnRseSBkcmF3aW5nIGJvcmRlcnMgb3Igb3RoZXIgZ2VvZ3JhcGhpYyBlbGVtZW50cyB0aGF0IHlvdSBkbyBub3QgbmVlZCB0byBhc3NvY2lhdGUgd2l0aCBzcGVjaWZpYyByZWdpb25zIHN1Y2ggYXMgaW5kaXZpZHVhbCBjb3VudHJpZXMsIHN0YXRlcyBvciBjb3VudGllcy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkRhdGFGb3JtYXRUeXBlXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgXCJlbnVtXCI6IFtcbiAgICAgICAgXCJqc29uXCIsXG4gICAgICAgIFwiY3N2XCIsXG4gICAgICAgIFwidHN2XCIsXG4gICAgICAgIFwidG9wb2pzb25cIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJUcmFuc2Zvcm1cIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcImZpbHRlclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGZpbHRlciBWZWdhIGV4cHJlc3Npb24uIFVzZSBgZGF0dW1gIHRvIHJlZmVyIHRvIHRoZSBjdXJyZW50IGRhdGEgb2JqZWN0LlwiLFxuICAgICAgICAgIFwib25lT2ZcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9FcXVhbEZpbHRlclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1JhbmdlRmlsdGVyXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvSW5GaWx0ZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICAgICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0VxdWFsRmlsdGVyXCJcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvUmFuZ2VGaWx0ZXJcIlxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9JbkZpbHRlclwiXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcImZpbHRlckludmFsaWRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJXaGV0aGVyIHRvIGZpbHRlciBpbnZhbGlkIHZhbHVlcyAoYG51bGxgIGFuZCBgTmFOYCkgZnJvbSB0aGUgZGF0YS4gQnkgZGVmYXVsdCAoYHVuZGVmaW5lZGApLCBvbmx5IHF1YW50aXRhdGl2ZSBhbmQgdGVtcG9yYWwgZmllbGRzIGFyZSBmaWx0ZXJlZC4gSWYgc2V0IHRvIGB0cnVlYCwgYWxsIGRhdGEgaXRlbXMgd2l0aCBudWxsIHZhbHVlcyBhcmUgZmlsdGVyZWQuIElmIGBmYWxzZWAsIGFsbCBkYXRhIGl0ZW1zIGFyZSBpbmNsdWRlZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjYWxjdWxhdGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDYWxjdWxhdGUgbmV3IGZpZWxkKHMpIHVzaW5nIHRoZSBwcm92aWRlZCBleHByZXNzc2lvbihzKS4gQ2FsY3VsYXRpb24gYXJlIGFwcGxpZWQgYmVmb3JlIGZpbHRlci5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Gb3JtdWxhXCIsXG4gICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRm9ybXVsYSBvYmplY3QgZm9yIGNhbGN1bGF0ZS5cIlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJFcXVhbEZpbHRlclwiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwidGltZVVuaXRcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVGltZVVuaXRcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGltZSB1bml0IGZvciB0aGUgZmllbGQgdG8gYmUgZmlsdGVyZWQuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJmaWVsZFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZpZWxkIHRvIGJlIGZpbHRlcmVkLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZXF1YWxcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJWYWx1ZSB0aGF0IHRoZSBmaWVsZCBzaG91bGQgYmUgZXF1YWwgdG8uXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0RhdGVUaW1lXCIsXG4gICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPYmplY3QgZm9yIGRlZmluaW5nIGRhdGV0aW1lIGluIFZlZ2EtTGl0ZSBGaWx0ZXIuXFxuXFxuSWYgYm90aCBtb250aCBhbmQgcXVhcnRlciBhcmUgcHJvdmlkZWQsIG1vbnRoIGhhcyBoaWdoZXIgcHJlY2VkZW5jZS5cXG5cXG5gZGF5YCBjYW5ub3QgYmUgY29tYmluZWQgd2l0aCBvdGhlciBkYXRlLlxcblxcbldlIGFjY2VwdCBzdHJpbmcgZm9yIG1vbnRoIGFuZCBkYXkgbmFtZXMuXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInJlcXVpcmVkXCI6IFtcbiAgICAgICAgXCJmaWVsZFwiLFxuICAgICAgICBcImVxdWFsXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiRGF0ZVRpbWVcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcInllYXJcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgeWVhci5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInF1YXJ0ZXJcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgcXVhcnRlciBvZiB0aGUgeWVhciAoZnJvbSAxLTQpLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibW9udGhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPbmUgb2Y6ICgxKSBpbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgbW9udGggZnJvbSBgMWAtYDEyYC4gYDFgIHJlcHJlc2VudHMgSmFudWFyeTsgICgyKSBjYXNlLWluc2Vuc2l0aXZlIG1vbnRoIG5hbWUgKGUuZy4sIGBcXFwiSmFudWFyeVxcXCJgKTsgICgzKSBjYXNlLWluc2Vuc2l0aXZlLCAzLWNoYXJhY3RlciBzaG9ydCBtb250aCBuYW1lIChlLmcuLCBgXFxcIkphblxcXCJgKS5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcImRhdGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgZGF0ZSBmcm9tIDEtMzEuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkYXlcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJWYWx1ZSByZXByZXNlbnRpbmcgdGhlIGRheSBvZiB3ZWVrLiAgVGhpcyBjYW4gYmUgb25lIG9mOiAoMSkgaW50ZWdlciB2YWx1ZSAtLSBgMWAgcmVwcmVzZW50cyBNb25kYXk7ICgyKSBjYXNlLWluc2Vuc2l0aXZlIGRheSBuYW1lIChlLmcuLCBgXFxcIk1vbmRheVxcXCJgKTsgICgzKSBjYXNlLWluc2Vuc2l0aXZlLCAzLWNoYXJhY3RlciBzaG9ydCBkYXkgbmFtZSAoZS5nLiwgYFxcXCJNb25cXFwiYCkuICAgPGJyLz4gKipXYXJuaW5nOioqIEEgRGF0ZVRpbWUgZGVmaW5pdGlvbiBvYmplY3Qgd2l0aCBgZGF5YCoqIHNob3VsZCBub3QgYmUgY29tYmluZWQgd2l0aCBgeWVhcmAsIGBxdWFydGVyYCwgYG1vbnRoYCwgb3IgYGRhdGVgLlwiLFxuICAgICAgICAgIFwib25lT2ZcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwiaG91cnNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgaG91ciBvZiBkYXkgZnJvbSAwLTIzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibWludXRlc1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkludGVnZXIgdmFsdWUgcmVwcmVzZW50aW5nIG1pbnV0ZSBzZWdtZW50IG9mIGEgdGltZSBmcm9tIDAtNTkuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZWNvbmRzXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZWdlciB2YWx1ZSByZXByZXNlbnRpbmcgc2Vjb25kIHNlZ21lbnQgb2YgYSB0aW1lIGZyb20gMC01OS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcIm1pbGxpc2Vjb25kc1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkludGVnZXIgdmFsdWUgcmVwcmVzZW50aW5nIG1pbGxpc2Vjb25kIHNlZ21lbnQgb2YgYSB0aW1lLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwiUmFuZ2VGaWx0ZXJcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcInRpbWVVbml0XCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1RpbWVVbml0XCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcInRpbWUgdW5pdCBmb3IgdGhlIGZpZWxkIHRvIGJlIGZpbHRlcmVkLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZmllbGRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGaWVsZCB0byBiZSBmaWx0ZXJlZFwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwicmFuZ2VcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBcnJheSBvZiBpbmNsdXNpdmUgbWluaW11bSBhbmQgbWF4aW11bSB2YWx1ZXNcXG5cXG5mb3IgYSBmaWVsZCB2YWx1ZSBvZiBhIGRhdGEgaXRlbSB0byBiZSBpbmNsdWRlZCBpbiB0aGUgZmlsdGVyZWQgZGF0YS5cIixcbiAgICAgICAgICBcIm1heEl0ZW1zXCI6IDIsXG4gICAgICAgICAgXCJtaW5JdGVtc1wiOiAyLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0RhdGVUaW1lXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9iamVjdCBmb3IgZGVmaW5pbmcgZGF0ZXRpbWUgaW4gVmVnYS1MaXRlIEZpbHRlci5cXG5cXG5JZiBib3RoIG1vbnRoIGFuZCBxdWFydGVyIGFyZSBwcm92aWRlZCwgbW9udGggaGFzIGhpZ2hlciBwcmVjZWRlbmNlLlxcblxcbmBkYXlgIGNhbm5vdCBiZSBjb21iaW5lZCB3aXRoIG90aGVyIGRhdGUuXFxuXFxuV2UgYWNjZXB0IHN0cmluZyBmb3IgbW9udGggYW5kIGRheSBuYW1lcy5cIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJyZXF1aXJlZFwiOiBbXG4gICAgICAgIFwiZmllbGRcIixcbiAgICAgICAgXCJyYW5nZVwiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIkluRmlsdGVyXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJ0aW1lVW5pdFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UaW1lVW5pdFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJ0aW1lIHVuaXQgZm9yIHRoZSBmaWVsZCB0byBiZSBmaWx0ZXJlZC5cIlxuICAgICAgICB9LFxuICAgICAgICBcImZpZWxkXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRmllbGQgdG8gYmUgZmlsdGVyZWRcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImluXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBzZXQgb2YgdmFsdWVzIHRoYXQgdGhlIGBmaWVsZGAncyB2YWx1ZSBzaG91bGQgYmUgYSBtZW1iZXIgb2YsXFxuXFxuZm9yIGEgZGF0YSBpdGVtIGluY2x1ZGVkIGluIHRoZSBmaWx0ZXJlZCBkYXRhLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0RhdGVUaW1lXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9iamVjdCBmb3IgZGVmaW5pbmcgZGF0ZXRpbWUgaW4gVmVnYS1MaXRlIEZpbHRlci5cXG5cXG5JZiBib3RoIG1vbnRoIGFuZCBxdWFydGVyIGFyZSBwcm92aWRlZCwgbW9udGggaGFzIGhpZ2hlciBwcmVjZWRlbmNlLlxcblxcbmBkYXlgIGNhbm5vdCBiZSBjb21iaW5lZCB3aXRoIG90aGVyIGRhdGUuXFxuXFxuV2UgYWNjZXB0IHN0cmluZyBmb3IgbW9udGggYW5kIGRheSBuYW1lcy5cIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJyZXF1aXJlZFwiOiBbXG4gICAgICAgIFwiZmllbGRcIixcbiAgICAgICAgXCJpblwiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIkZvcm11bGFcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcImZpZWxkXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZpZWxkIGluIHdoaWNoIHRvIHN0b3JlIHRoZSBjb21wdXRlZCBmb3JtdWxhIHZhbHVlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZXhwclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc3RyaW5nIGNvbnRhaW5pbmcgYW4gZXhwcmVzc2lvbiBmb3IgdGhlIGZvcm11bGEuIFVzZSB0aGUgdmFyaWFibGUgYGRhdHVtYCB0byB0byByZWZlciB0byB0aGUgY3VycmVudCBkYXRhIG9iamVjdC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJyZXF1aXJlZFwiOiBbXG4gICAgICAgIFwiZmllbGRcIixcbiAgICAgICAgXCJleHByXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiQ29uZmlnXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJ2aWV3cG9ydFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoZSBvbi1zY3JlZW4gdmlld3BvcnQsIGluIHBpeGVscy4gSWYgbmVjZXNzYXJ5LCBjbGlwcGluZyBhbmQgc2Nyb2xsaW5nIHdpbGwgYmUgYXBwbGllZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImJhY2tncm91bmRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDU1MgY29sb3IgcHJvcGVydHkgdG8gdXNlIGFzIGJhY2tncm91bmQgb2YgdmlzdWFsaXphdGlvbi4gRGVmYXVsdCBpcyBgXFxcInRyYW5zcGFyZW50XFxcImAuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJudW1iZXJGb3JtYXRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEMyBOdW1iZXIgZm9ybWF0IGZvciBheGlzIGxhYmVscyBhbmQgdGV4dCB0YWJsZXMuIEZvciBleGFtcGxlIFxcXCJzXFxcIiBmb3IgU0kgdW5pdHMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aW1lRm9ybWF0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCBkYXRldGltZSBmb3JtYXQgZm9yIGF4aXMgYW5kIGxlZ2VuZCBsYWJlbHMuIFRoZSBmb3JtYXQgY2FuIGJlIHNldCBkaXJlY3RseSBvbiBlYWNoIGF4aXMgYW5kIGxlZ2VuZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImNvdW50VGl0bGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IGF4aXMgYW5kIGxlZ2VuZCB0aXRsZSBmb3IgY291bnQgZmllbGRzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY2VsbFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DZWxsQ29uZmlnXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNlbGwgQ29uZmlnXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXJrXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL01hcmtDb25maWdcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTWFyayBDb25maWdcIlxuICAgICAgICB9LFxuICAgICAgICBcIm92ZXJsYXlcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3ZlcmxheUNvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJNYXJrIE92ZXJsYXkgQ29uZmlnXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzY2FsZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9TY2FsZUNvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTY2FsZSBDb25maWdcIlxuICAgICAgICB9LFxuICAgICAgICBcImF4aXNcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQXhpc0NvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBeGlzIENvbmZpZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwibGVnZW5kXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0xlZ2VuZENvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJMZWdlbmQgQ29uZmlnXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJmYWNldFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GYWNldENvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGYWNldCBDb25maWdcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkNlbGxDb25maWdcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcIndpZHRoXCI6IHtcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImhlaWdodFwiOiB7XG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZpbGwgY29sb3IuXCIsXG4gICAgICAgICAgXCJmb3JtYXRcIjogXCJjb2xvclwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZmlsbE9wYWNpdHlcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZmlsbCBvcGFjaXR5ICh2YWx1ZSBiZXR3ZWVuIFswLDFdKS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInN0cm9rZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzdHJva2UgY29sb3IuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzdHJva2VPcGFjaXR5XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHN0cm9rZSBvcGFjaXR5ICh2YWx1ZSBiZXR3ZWVuIFswLDFdKS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInN0cm9rZVdpZHRoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHN0cm9rZSB3aWR0aCwgaW4gcGl4ZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3Ryb2tlRGFzaFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIGFycmF5IG9mIGFsdGVybmF0aW5nIHN0cm9rZSwgc3BhY2UgbGVuZ3RocyBmb3IgY3JlYXRpbmcgZGFzaGVkIG9yIGRvdHRlZCBsaW5lcy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwic3Ryb2tlRGFzaE9mZnNldFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvZmZzZXQgKGluIHBpeGVscykgaW50byB3aGljaCB0byBiZWdpbiBkcmF3aW5nIHdpdGggdGhlIHN0cm9rZSBkYXNoIGFycmF5LlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwiTWFya0NvbmZpZ1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwiZmlsbGVkXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2hldGhlciB0aGUgc2hhcGVcXFxcJ3MgY29sb3Igc2hvdWxkIGJlIHVzZWQgYXMgZmlsbCBjb2xvciBpbnN0ZWFkIG9mIHN0cm9rZSBjb2xvci5cXG5cXG5UaGlzIGlzIG9ubHkgYXBwbGljYWJsZSBmb3IgXFxcImJhclxcXCIsIFxcXCJwb2ludFxcXCIsIGFuZCBcXFwiYXJlYVxcXCIuXFxuXFxuQWxsIG1hcmtzIGV4Y2VwdCBcXFwicG9pbnRcXFwiIG1hcmtzIGFyZSBmaWxsZWQgYnkgZGVmYXVsdC5cXG5cXG5TZWUgTWFyayBEb2N1bWVudGF0aW9uIChodHRwOi8vdmVnYS5naXRodWIuaW8vdmVnYS1saXRlL2RvY3MvbWFya3MuaHRtbClcXG5cXG5mb3IgdXNhZ2UgZXhhbXBsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjb2xvclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgY29sb3IuXCIsXG4gICAgICAgICAgXCJmb3JtYXRcIjogXCJjb2xvclwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZmlsbFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgRmlsbCBDb2xvci4gIFRoaXMgaGFzIGhpZ2hlciBwcmVjZWRlbmNlIHRoYW4gY29uZmlnLmNvbG9yXCIsXG4gICAgICAgICAgXCJmb3JtYXRcIjogXCJjb2xvclwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3Ryb2tlXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCBTdHJva2UgQ29sb3IuICBUaGlzIGhhcyBoaWdoZXIgcHJlY2VkZW5jZSB0aGFuIGNvbmZpZy5jb2xvclwiLFxuICAgICAgICAgIFwiZm9ybWF0XCI6IFwiY29sb3JcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxuICAgICAgICAgIFwibWF4aW11bVwiOiAxLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZmlsbE9wYWNpdHlcIjoge1xuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxuICAgICAgICAgIFwibWF4aW11bVwiOiAxLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3Ryb2tlT3BhY2l0eVwiOiB7XG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJtYXhpbXVtXCI6IDEsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzdHJva2VXaWR0aFwiOiB7XG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzdHJva2VEYXNoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gYXJyYXkgb2YgYWx0ZXJuYXRpbmcgc3Ryb2tlLCBzcGFjZSBsZW5ndGhzIGZvciBjcmVhdGluZyBkYXNoZWQgb3IgZG90dGVkIGxpbmVzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzdHJva2VEYXNoT2Zmc2V0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCAoaW4gcGl4ZWxzKSBpbnRvIHdoaWNoIHRvIGJlZ2luIGRyYXdpbmcgd2l0aCB0aGUgc3Ryb2tlIGRhc2ggYXJyYXkuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzdGFja2VkXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1N0YWNrT2Zmc2V0XCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcmllbnRcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JpZW50XCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvcmllbnRhdGlvbiBvZiBhIG5vbi1zdGFja2VkIGJhciwgdGljaywgYXJlYSwgYW5kIGxpbmUgY2hhcnRzLlxcblxcblRoZSB2YWx1ZSBpcyBlaXRoZXIgaG9yaXpvbnRhbCAoZGVmYXVsdCkgb3IgdmVydGljYWwuXFxuXFxuLSBGb3IgYmFyLCBydWxlIGFuZCB0aWNrLCB0aGlzIGRldGVybWluZXMgd2hldGhlciB0aGUgc2l6ZSBvZiB0aGUgYmFyIGFuZCB0aWNrXFxuXFxuc2hvdWxkIGJlIGFwcGxpZWQgdG8geCBvciB5IGRpbWVuc2lvbi5cXG5cXG4tIEZvciBhcmVhLCB0aGlzIHByb3BlcnR5IGRldGVybWluZXMgdGhlIG9yaWVudCBwcm9wZXJ0eSBvZiB0aGUgVmVnYSBvdXRwdXQuXFxuXFxuLSBGb3IgbGluZSwgdGhpcyBwcm9wZXJ0eSBkZXRlcm1pbmVzIHRoZSBzb3J0IG9yZGVyIG9mIHRoZSBwb2ludHMgaW4gdGhlIGxpbmVcXG5cXG5pZiBgY29uZmlnLnNvcnRMaW5lQnlgIGlzIG5vdCBzcGVjaWZpZWQuXFxuXFxuRm9yIHN0YWNrZWQgY2hhcnRzLCB0aGlzIGlzIGFsd2F5cyBkZXRlcm1pbmVkIGJ5IHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgc3RhY2s7XFxuXFxudGhlcmVmb3JlIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHZhbHVlIHdpbGwgYmUgaWdub3JlZC5cIlxuICAgICAgICB9LFxuICAgICAgICBcImludGVycG9sYXRlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ludGVycG9sYXRlXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBsaW5lIGludGVycG9sYXRpb24gbWV0aG9kIHRvIHVzZS4gT25lIG9mIGxpbmVhciwgc3RlcC1iZWZvcmUsIHN0ZXAtYWZ0ZXIsIGJhc2lzLCBiYXNpcy1vcGVuLCBjYXJkaW5hbCwgY2FyZGluYWwtb3BlbiwgbW9ub3RvbmUuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0ZW5zaW9uXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVwZW5kaW5nIG9uIHRoZSBpbnRlcnBvbGF0aW9uIHR5cGUsIHNldHMgdGhlIHRlbnNpb24gcGFyYW1ldGVyLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibGluZVNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTaXplIG9mIGxpbmUgbWFyay5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInJ1bGVTaXplXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2l6ZSBvZiBydWxlIG1hcmsuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJiYXJTaXplXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUgb2YgdGhlIGJhcnMuICBJZiB1bnNwZWNpZmllZCwgdGhlIGRlZmF1bHQgc2l6ZSBpcyAgYGJhbmRTaXplLTFgLFxcblxcbndoaWNoIHByb3ZpZGVzIDEgcGl4ZWwgb2Zmc2V0IGJldHdlZW4gYmFycy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImJhclRoaW5TaXplXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUgb2YgdGhlIGJhcnMgb24gY29udGludW91cyBzY2FsZXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaGFwZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzeW1ib2wgc2hhcGUgdG8gdXNlLiBPbmUgb2YgY2lyY2xlIChkZWZhdWx0KSwgc3F1YXJlLCBjcm9zcywgZGlhbW9uZCwgdHJpYW5nbGUtdXAsIG9yIHRyaWFuZ2xlLWRvd24sIG9yIGEgY3VzdG9tIFNWRyBwYXRoLlwiLFxuICAgICAgICAgIFwib25lT2ZcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NoYXBlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcInNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcGl4ZWwgYXJlYSBlYWNoIHRoZSBwb2ludC4gRm9yIGV4YW1wbGU6IGluIHRoZSBjYXNlIG9mIGNpcmNsZXMsIHRoZSByYWRpdXMgaXMgZGV0ZXJtaW5lZCBpbiBwYXJ0IGJ5IHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgc2l6ZSB2YWx1ZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tTaXplXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHdpZHRoIG9mIHRoZSB0aWNrcy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tUaGlja25lc3NcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGlja25lc3Mgb2YgdGhlIHRpY2sgbWFyay5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImFsaWduXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0hvcml6b250YWxBbGlnblwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgaG9yaXpvbnRhbCBhbGlnbm1lbnQgb2YgdGhlIHRleHQuIE9uZSBvZiBsZWZ0LCByaWdodCwgY2VudGVyLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiYW5nbGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcm90YXRpb24gYW5nbGUgb2YgdGhlIHRleHQsIGluIGRlZ3JlZXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJiYXNlbGluZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9WZXJ0aWNhbEFsaWduXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB2ZXJ0aWNhbCBhbGlnbm1lbnQgb2YgdGhlIHRleHQuIE9uZSBvZiB0b3AsIG1pZGRsZSwgYm90dG9tLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZHhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgaG9yaXpvbnRhbCBvZmZzZXQsIGluIHBpeGVscywgYmV0d2VlbiB0aGUgdGV4dCBsYWJlbCBhbmQgaXRzIGFuY2hvciBwb2ludC4gVGhlIG9mZnNldCBpcyBhcHBsaWVkIGFmdGVyIHJvdGF0aW9uIGJ5IHRoZSBhbmdsZSBwcm9wZXJ0eS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImR5XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHZlcnRpY2FsIG9mZnNldCwgaW4gcGl4ZWxzLCBiZXR3ZWVuIHRoZSB0ZXh0IGxhYmVsIGFuZCBpdHMgYW5jaG9yIHBvaW50LiBUaGUgb2Zmc2V0IGlzIGFwcGxpZWQgYWZ0ZXIgcm90YXRpb24gYnkgdGhlIGFuZ2xlIHByb3BlcnR5LlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwicmFkaXVzXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiUG9sYXIgY29vcmRpbmF0ZSByYWRpYWwgb2Zmc2V0LCBpbiBwaXhlbHMsIG9mIHRoZSB0ZXh0IGxhYmVsIGZyb20gdGhlIG9yaWdpbiBkZXRlcm1pbmVkIGJ5IHRoZSB4IGFuZCB5IHByb3BlcnRpZXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aGV0YVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlBvbGFyIGNvb3JkaW5hdGUgYW5nbGUsIGluIHJhZGlhbnMsIG9mIHRoZSB0ZXh0IGxhYmVsIGZyb20gdGhlIG9yaWdpbiBkZXRlcm1pbmVkIGJ5IHRoZSB4IGFuZCB5IHByb3BlcnRpZXMuIFZhbHVlcyBmb3IgdGhldGEgZm9sbG93IHRoZSBzYW1lIGNvbnZlbnRpb24gb2YgYXJjIG1hcmsgc3RhcnRBbmdsZSBhbmQgZW5kQW5nbGUgcHJvcGVydGllczogYW5nbGVzIGFyZSBtZWFzdXJlZCBpbiByYWRpYW5zLCB3aXRoIDAgaW5kaWNhdGluZyBcXFwibm9ydGhcXFwiLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZm9udFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB0eXBlZmFjZSB0byBzZXQgdGhlIHRleHQgaW4gKGUuZy4sIEhlbHZldGljYSBOZXVlKS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImZvbnRTaXplXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgc2l6ZSwgaW4gcGl4ZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZm9udFN0eWxlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZvbnRTdHlsZVwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzdHlsZSAoZS5nLiwgaXRhbGljKS5cIlxuICAgICAgICB9LFxuICAgICAgICBcImZvbnRXZWlnaHRcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRm9udFdlaWdodFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCB3ZWlnaHQgKGUuZy4sIGJvbGQpLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZm9ybWF0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvcm1hdHRpbmcgcGF0dGVybiBmb3IgdGV4dCB2YWx1ZS4gSWYgbm90IGRlZmluZWQsIHRoaXMgd2lsbCBiZSBkZXRlcm1pbmVkIGF1dG9tYXRpY2FsbHkuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaG9ydFRpbWVMYWJlbHNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJXaGV0aGVyIG1vbnRoIG5hbWVzIGFuZCB3ZWVrZGF5IG5hbWVzIHNob3VsZCBiZSBhYmJyZXZpYXRlZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0ZXh0XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiUGxhY2Vob2xkZXIgVGV4dFwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlDb2xvclRvQmFja2dyb3VuZFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFwcGx5IGNvbG9yIGZpZWxkIHRvIGJhY2tncm91bmQgY29sb3IgaW5zdGVhZCBvZiB0aGUgdGV4dC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJTdGFja09mZnNldFwiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwiemVyb1wiLFxuICAgICAgICBcImNlbnRlclwiLFxuICAgICAgICBcIm5vcm1hbGl6ZVwiLFxuICAgICAgICBcIm5vbmVcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJPcmllbnRcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICBcImVudW1cIjogW1xuICAgICAgICBcImhvcml6b250YWxcIixcbiAgICAgICAgXCJ2ZXJ0aWNhbFwiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIkludGVycG9sYXRlXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgXCJlbnVtXCI6IFtcbiAgICAgICAgXCJsaW5lYXJcIixcbiAgICAgICAgXCJsaW5lYXItY2xvc2VkXCIsXG4gICAgICAgIFwic3RlcFwiLFxuICAgICAgICBcInN0ZXAtYmVmb3JlXCIsXG4gICAgICAgIFwic3RlcC1hZnRlclwiLFxuICAgICAgICBcImJhc2lzXCIsXG4gICAgICAgIFwiYmFzaXMtb3BlblwiLFxuICAgICAgICBcImJhc2lzLWNsb3NlZFwiLFxuICAgICAgICBcImNhcmRpbmFsXCIsXG4gICAgICAgIFwiY2FyZGluYWwtb3BlblwiLFxuICAgICAgICBcImNhcmRpbmFsLWNsb3NlZFwiLFxuICAgICAgICBcImJ1bmRsZVwiLFxuICAgICAgICBcIm1vbm90b25lXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiU2hhcGVcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICBcImVudW1cIjogW1xuICAgICAgICBcImNpcmNsZVwiLFxuICAgICAgICBcInNxdWFyZVwiLFxuICAgICAgICBcImNyb3NzXCIsXG4gICAgICAgIFwiZGlhbW9uZFwiLFxuICAgICAgICBcInRyaWFuZ2xlLXVwXCIsXG4gICAgICAgIFwidHJpYW5nbGUtZG93blwiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIkhvcml6b250YWxBbGlnblwiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwibGVmdFwiLFxuICAgICAgICBcInJpZ2h0XCIsXG4gICAgICAgIFwiY2VudGVyXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiVmVydGljYWxBbGlnblwiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwidG9wXCIsXG4gICAgICAgIFwibWlkZGxlXCIsXG4gICAgICAgIFwiYm90dG9tXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiRm9udFN0eWxlXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgXCJlbnVtXCI6IFtcbiAgICAgICAgXCJub3JtYWxcIixcbiAgICAgICAgXCJpdGFsaWNcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJGb250V2VpZ2h0XCI6IHtcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgXCJlbnVtXCI6IFtcbiAgICAgICAgXCJub3JtYWxcIixcbiAgICAgICAgXCJib2xkXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiT3ZlcmxheUNvbmZpZ1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwibGluZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldoZXRoZXIgdG8gb3ZlcmxheSBsaW5lIHdpdGggcG9pbnQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiYXJlYVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9BcmVhT3ZlcmxheVwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUeXBlIG9mIG92ZXJsYXkgZm9yIGFyZWEgbWFyayAobGluZSBvciBsaW5lcG9pbnQpXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJwb2ludFN0eWxlXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL01hcmtDb25maWdcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCBzdHlsZSBmb3IgdGhlIG92ZXJsYXllZCBwb2ludC5cIlxuICAgICAgICB9LFxuICAgICAgICBcImxpbmVTdHlsZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9NYXJrQ29uZmlnXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgc3R5bGUgZm9yIHRoZSBvdmVybGF5ZWQgcG9pbnQuXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJBcmVhT3ZlcmxheVwiOiB7XG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgIFwiZW51bVwiOiBbXG4gICAgICAgIFwibGluZVwiLFxuICAgICAgICBcImxpbmVwb2ludFwiLFxuICAgICAgICBcIm5vbmVcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJTY2FsZUNvbmZpZ1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwicm91bmRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJZiB0cnVlLCByb3VuZHMgbnVtZXJpYyBvdXRwdXQgdmFsdWVzIHRvIGludGVnZXJzLlxcblxcblRoaXMgY2FuIGJlIGhlbHBmdWwgZm9yIHNuYXBwaW5nIHRvIHRoZSBwaXhlbCBncmlkLlxcblxcbihPbmx5IGF2YWlsYWJsZSBmb3IgYHhgLCBgeWAsIGBzaXplYCwgYHJvd2AsIGFuZCBgY29sdW1uYCBzY2FsZXMuKVwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICB9LFxuICAgICAgICBcInRleHRCYW5kV2lkdGhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IGJhbmQgd2lkdGggZm9yIGB4YCBvcmRpbmFsIHNjYWxlIHdoZW4gaXMgbWFyayBpcyBgdGV4dGAuXCIsXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJiYW5kU2l6ZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgYmFuZCBzaXplIGZvciAoMSkgYHlgIG9yZGluYWwgc2NhbGUsXFxuXFxuYW5kICgyKSBgeGAgb3JkaW5hbCBzY2FsZSB3aGVuIHRoZSBtYXJrIGlzIG5vdCBgdGV4dGAuXCIsXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCByYW5nZSBmb3Igb3BhY2l0eS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicGFkZGluZ1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcGFkZGluZyBmb3IgYHhgIGFuZCBgeWAgb3JkaW5hbCBzY2FsZXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ1c2VSYXdEb21haW5cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJVc2VzIHRoZSBzb3VyY2UgZGF0YSByYW5nZSBhcyBzY2FsZSBkb21haW4gaW5zdGVhZCBvZiBhZ2dyZWdhdGVkIGRhdGEgZm9yIGFnZ3JlZ2F0ZSBheGlzLlxcblxcblRoaXMgcHJvcGVydHkgb25seSB3b3JrcyB3aXRoIGFnZ3JlZ2F0ZSBmdW5jdGlvbnMgdGhhdCBwcm9kdWNlIHZhbHVlcyB3aXRoaW4gdGhlIHJhdyBkYXRhIGRvbWFpbiAoYFxcXCJtZWFuXFxcImAsIGBcXFwiYXZlcmFnZVxcXCJgLCBgXFxcInN0ZGV2XFxcImAsIGBcXFwic3RkZXZwXFxcImAsIGBcXFwibWVkaWFuXFxcImAsIGBcXFwicTFcXFwiYCwgYFxcXCJxM1xcXCJgLCBgXFxcIm1pblxcXCJgLCBgXFxcIm1heFxcXCJgKS4gRm9yIG90aGVyIGFnZ3JlZ2F0aW9ucyB0aGF0IHByb2R1Y2UgdmFsdWVzIG91dHNpZGUgb2YgdGhlIHJhdyBkYXRhIGRvbWFpbiAoZS5nLiBgXFxcImNvdW50XFxcImAsIGBcXFwic3VtXFxcImApLCB0aGlzIHByb3BlcnR5IGlzIGlnbm9yZWQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibm9taW5hbENvbG9yUmFuZ2VcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IHJhbmdlIGZvciBub21pbmFsIGNvbG9yIHNjYWxlXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcInNlcXVlbnRpYWxDb2xvclJhbmdlXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCByYW5nZSBmb3Igb3JkaW5hbCAvIGNvbnRpbnVvdXMgY29sb3Igc2NhbGVcIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwic2hhcGVSYW5nZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIHNoYXBlXCIsXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcImJhclNpemVSYW5nZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIGJhciBzaXplIHNjYWxlXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImZvbnRTaXplUmFuZ2VcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IHJhbmdlIGZvciBmb250IHNpemUgc2NhbGVcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicnVsZVNpemVSYW5nZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIHJ1bGUgc3Ryb2tlIHdpZHRoc1wiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aWNrU2l6ZVJhbmdlXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCByYW5nZSBmb3IgdGljayBzcGFuc1wiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwb2ludFNpemVSYW5nZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIGJhciBzaXplIHNjYWxlXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkF4aXNDb25maWdcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcImF4aXNXaWR0aFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldpZHRoIG9mIHRoZSBheGlzIGxpbmVcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImxheWVyXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBzdHJpbmcgaW5kaWNhdGluZyBpZiB0aGUgYXhpcyAoYW5kIGFueSBncmlkbGluZXMpIHNob3VsZCBiZSBwbGFjZWQgYWJvdmUgb3IgYmVsb3cgdGhlIGRhdGEgbWFya3MuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvZmZzZXRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgb2Zmc2V0LCBpbiBwaXhlbHMsIGJ5IHdoaWNoIHRvIGRpc3BsYWNlIHRoZSBheGlzIGZyb20gdGhlIGVkZ2Ugb2YgdGhlIGVuY2xvc2luZyBncm91cCBvciBkYXRhIHJlY3RhbmdsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImF4aXNDb2xvclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIGF4aXMgbGluZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyaWRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIGZsYWcgaW5kaWNhdGUgaWYgZ3JpZGxpbmVzIHNob3VsZCBiZSBjcmVhdGVkIGluIGFkZGl0aW9uIHRvIHRpY2tzLiBJZiBgZ3JpZGAgaXMgdW5zcGVjaWZpZWQsIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGB0cnVlYCBmb3IgUk9XIGFuZCBDT0wuIEZvciBYIGFuZCBZLCB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgdHJ1ZWAgZm9yIHF1YW50aXRhdGl2ZSBhbmQgdGltZSBmaWVsZHMgYW5kIGBmYWxzZWAgb3RoZXJ3aXNlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICB9LFxuICAgICAgICBcImdyaWRDb2xvclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIGdyaWRsaW5lcy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyaWREYXNoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCAoaW4gcGl4ZWxzKSBpbnRvIHdoaWNoIHRvIGJlZ2luIGRyYXdpbmcgd2l0aCB0aGUgZ3JpZCBkYXNoIGFycmF5LlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJncmlkT3BhY2l0eVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzdHJva2Ugb3BhY2l0eSBvZiBncmlkICh2YWx1ZSBiZXR3ZWVuIFswLDFdKVwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JpZFdpZHRoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGdyaWQgd2lkdGgsIGluIHBpeGVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsc1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkVuYWJsZSBvciBkaXNhYmxlIGxhYmVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbEFuZ2xlXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHJvdGF0aW9uIGFuZ2xlIG9mIHRoZSBheGlzIGxhYmVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsQWxpZ25cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUZXh0IGFsaWdubWVudCBmb3IgdGhlIExhYmVsLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwibGFiZWxCYXNlbGluZVwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRleHQgYmFzZWxpbmUgZm9yIHRoZSBsYWJlbC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsTWF4TGVuZ3RoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVHJ1bmNhdGUgbGFiZWxzIHRoYXQgYXJlIHRvbyBsb25nLlwiLFxuICAgICAgICAgIFwibWluaW11bVwiOiAxLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic2hvcnRUaW1lTGFiZWxzXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2hldGhlciBtb250aCBhbmQgZGF5IG5hbWVzIHNob3VsZCBiZSBhYmJyZXZpYXRlZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzdWJkaXZpZGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJZiBwcm92aWRlZCwgc2V0cyB0aGUgbnVtYmVyIG9mIG1pbm9yIHRpY2tzIGJldHdlZW4gbWFqb3IgdGlja3MgKHRoZSB2YWx1ZSA5IHJlc3VsdHMgaW4gZGVjaW1hbCBzdWJkaXZpc2lvbikuIE9ubHkgYXBwbGljYWJsZSBmb3IgYXhlcyB2aXN1YWxpemluZyBxdWFudGl0YXRpdmUgc2NhbGVzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGlja3NcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIGRlc2lyZWQgbnVtYmVyIG9mIHRpY2tzLCBmb3IgYXhlcyB2aXN1YWxpemluZyBxdWFudGl0YXRpdmUgc2NhbGVzLiBUaGUgcmVzdWx0aW5nIG51bWJlciBtYXkgYmUgZGlmZmVyZW50IHNvIHRoYXQgdmFsdWVzIGFyZSBcXFwibmljZVxcXCIgKG11bHRpcGxlcyBvZiAyLCA1LCAxMCkgYW5kIGxpZSB3aXRoaW4gdGhlIHVuZGVybHlpbmcgc2NhbGUncyByYW5nZS5cIixcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tDb2xvclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBjb2xvciBvZiB0aGUgYXhpcydzIHRpY2suXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aWNrTGFiZWxDb2xvclwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBjb2xvciBvZiB0aGUgdGljayBsYWJlbCwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tMYWJlbEZvbnRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBvZiB0aGUgdGljayBsYWJlbC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tMYWJlbEZvbnRTaXplXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgc2l6ZSBvZiBsYWJlbCwgaW4gcGl4ZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGlja1BhZGRpbmdcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcGFkZGluZywgaW4gcGl4ZWxzLCBiZXR3ZWVuIHRpY2tzIGFuZCB0ZXh0IGxhYmVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tTaXplXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUsIGluIHBpeGVscywgb2YgbWFqb3IsIG1pbm9yIGFuZCBlbmQgdGlja3MuXCIsXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aWNrU2l6ZU1ham9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUsIGluIHBpeGVscywgb2YgbWFqb3IgdGlja3MuXCIsXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aWNrU2l6ZU1pbm9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUsIGluIHBpeGVscywgb2YgbWlub3IgdGlja3MuXCIsXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aWNrU2l6ZUVuZFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzaXplLCBpbiBwaXhlbHMsIG9mIGVuZCB0aWNrcy5cIixcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpY2tXaWR0aFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCwgaW4gcGl4ZWxzLCBvZiB0aWNrcy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlQ29sb3JcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb2xvciBvZiB0aGUgdGl0bGUsIGNhbiBiZSBpbiBoZXggY29sb3IgY29kZSBvciByZWd1bGFyIGNvbG9yIG5hbWUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZUZvbnRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGb250IG9mIHRoZSB0aXRsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlRm9udFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTaXplIG9mIHRoZSB0aXRsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlRm9udFdlaWdodFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldlaWdodCBvZiB0aGUgdGl0bGUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZU9mZnNldFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgdGl0bGUgb2Zmc2V0IHZhbHVlIGZvciB0aGUgYXhpcy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlTWF4TGVuZ3RoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTWF4IGxlbmd0aCBmb3IgYXhpcyB0aXRsZSBpZiB0aGUgdGl0bGUgaXMgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgZnJvbSB0aGUgZmllbGQncyBkZXNjcmlwdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyBpcyBhdXRvbWF0aWNhbGx5IGJhc2VkIG9uIGNlbGwgc2l6ZSBhbmQgY2hhcmFjdGVyV2lkdGggcHJvcGVydHkuXCIsXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjaGFyYWN0ZXJXaWR0aFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNoYXJhY3RlciB3aWR0aCBmb3IgYXV0b21hdGljYWxseSBkZXRlcm1pbmluZyB0aXRsZSBtYXggbGVuZ3RoLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9wdGlvbmFsIG1hcmsgcHJvcGVydHkgZGVmaW5pdGlvbnMgZm9yIGN1c3RvbSBheGlzIHN0eWxpbmcuXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJMZWdlbmRDb25maWdcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcIm9yaWVudFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvcmllbnRhdGlvbiBvZiB0aGUgbGVnZW5kLiBPbmUgb2YgXFxcImxlZnRcXFwiIG9yIFxcXCJyaWdodFxcXCIuIFRoaXMgZGV0ZXJtaW5lcyBob3cgdGhlIGxlZ2VuZCBpcyBwb3NpdGlvbmVkIHdpdGhpbiB0aGUgc2NlbmUuIFRoZSBkZWZhdWx0IGlzIFxcXCJyaWdodFxcXCIuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvZmZzZXRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgb2Zmc2V0LCBpbiBwaXhlbHMsIGJ5IHdoaWNoIHRvIGRpc3BsYWNlIHRoZSBsZWdlbmQgZnJvbSB0aGUgZWRnZSBvZiB0aGUgZW5jbG9zaW5nIGdyb3VwIG9yIGRhdGEgcmVjdGFuZ2xlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwicGFkZGluZ1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBwYWRkaW5nLCBpbiBwaXhlbHMsIGJldHdlZW4gdGhlIGxlbmdlbmQgYW5kIGF4aXMuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXJnaW5cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgbWFyZ2luIGFyb3VuZCB0aGUgbGVnZW5kLCBpbiBwaXhlbHNcIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyYWRpZW50U3Ryb2tlQ29sb3JcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgY29sb3Igb2YgdGhlIGdyYWRpZW50IHN0cm9rZSwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImdyYWRpZW50U3Ryb2tlV2lkdGhcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgd2lkdGggb2YgdGhlIGdyYWRpZW50IHN0cm9rZSwgaW4gcGl4ZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JhZGllbnRIZWlnaHRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgaGVpZ2h0IG9mIHRoZSBncmFkaWVudCwgaW4gcGl4ZWxzLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JhZGllbnRXaWR0aFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCBvZiB0aGUgZ3JhZGllbnQsIGluIHBpeGVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsQWxpZ25cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgYWxpZ25tZW50IG9mIHRoZSBsZWdlbmQgbGFiZWwsIGNhbiBiZSBsZWZ0LCBtaWRkbGUgb3IgcmlnaHQuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbEJhc2VsaW5lXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHBvc2l0aW9uIG9mIHRoZSBiYXNlbGluZSBvZiBsZWdlbmQgbGFiZWwsIGNhbiBiZSB0b3AsIG1pZGRsZSBvciBib3R0b20uXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbENvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBsZWdlbmQgbGFiZWwsIGNhbiBiZSBpbiBoZXggY29sb3IgY29kZSBvciByZWd1bGFyIGNvbG9yIG5hbWUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbEZvbnRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBvZiB0aGUgbGVuZ2VuZCBsYWJlbC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsRm9udFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzaXplIG9mIGxlbmdlbmQgbGFibGUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJsYWJlbE9mZnNldFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvZmZzZXQgb2YgdGhlIGxlZ2VuZCBsYWJlbC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInNob3J0VGltZUxhYmVsc1wiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldoZXRoZXIgbW9udGggbmFtZXMgYW5kIHdlZWtkYXkgbmFtZXMgc2hvdWxkIGJlIGFiYnJldmlhdGVkLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICB9LFxuICAgICAgICBcInN5bWJvbENvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBsZWdlbmQgc3ltYm9sLFwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3ltYm9sU2hhcGVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2hhcGUgb2YgdGhlIGxlZ2VuZCBzeW1ib2wsIGNhbiBiZSB0aGUgJ2NpcmNsZScsICdzcXVhcmUnLCAnY3Jvc3MnLCAnZGlhbW9uZCcsXFxuXFxuJ3RyaWFuZ2xlLXVwJywgJ3RyaWFuZ2xlLWRvd24nLCBvciBlbHNlIGEgY3VzdG9tIFNWRyBwYXRoIHN0cmluZy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInN5bWJvbFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSBvZiB0aGUgbGVuZ2VuZCBzeW1ib2wsIGluIHBpeGVscy5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcInN5bWJvbFN0cm9rZVdpZHRoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHdpZHRoIG9mIHRoZSBzeW1ib2wncyBzdHJva2UuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZUNvbG9yXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT3B0aW9uYWwgbWFyayBwcm9wZXJ0eSBkZWZpbml0aW9ucyBmb3IgY3VzdG9tIGxlZ2VuZCBzdHlsaW5nLlxcblxcblRoZSBjb2xvciBvZiB0aGUgbGVnZW5kIHRpdGxlLCBjYW4gYmUgaW4gaGV4IGNvbG9yIGNvZGUgb3IgcmVndWxhciBjb2xvciBuYW1lLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwidGl0bGVGb250XCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgb2YgdGhlIGxlZ2VuZCB0aXRsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlRm9udFNpemVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzaXplIG9mIHRoZSBsZWdlbmQgdGl0bGUuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0aXRsZUZvbnRXZWlnaHRcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCB3ZWlnaHQgb2YgdGhlIGxlZ2VuZCB0aXRsZS5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPcHRpb25hbCBtYXJrIHByb3BlcnR5IGRlZmluaXRpb25zIGZvciBjdXN0b20gbGVnZW5kIHN0eWxpbmcuXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJGYWNldENvbmZpZ1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwic2NhbGVcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmFjZXRTY2FsZUNvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGYWNldCBTY2FsZSBDb25maWdcIlxuICAgICAgICB9LFxuICAgICAgICBcImF4aXNcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQXhpc0NvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGYWNldCBBeGlzIENvbmZpZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JpZFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GYWNldEdyaWRDb25maWdcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRmFjZXQgR3JpZCBDb25maWdcIlxuICAgICAgICB9LFxuICAgICAgICBcImNlbGxcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ2VsbENvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGYWNldCBDZWxsIENvbmZpZ1wiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwiRmFjZXRTY2FsZUNvbmZpZ1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwicm91bmRcIjoge1xuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICAgICAgICB9LFxuICAgICAgICBcInBhZGRpbmdcIjoge1xuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwiRmFjZXRHcmlkQ29uZmlnXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJjb2xvclwiOiB7XG4gICAgICAgICAgXCJmb3JtYXRcIjogXCJjb2xvclwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvZmZzZXRcIjoge1xuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwiRmFjZXRTcGVjXCI6IHtcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJmYWNldFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GYWNldFwiXG4gICAgICAgIH0sXG4gICAgICAgIFwic3BlY1wiOiB7XG4gICAgICAgICAgXCJvbmVPZlwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvTGF5ZXJTcGVjXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVW5pdFNwZWNcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTmFtZSBvZiB0aGUgdmlzdWFsaXphdGlvbiBmb3IgbGF0ZXIgcmVmZXJlbmNlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVzY3JpcHRpb25cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvcHRpb25hbCBkZXNjcmlwdGlvbiBvZiB0aGlzIG1hcmsgZm9yIGNvbW1lbnRpbmcgcHVycG9zZS5cXG5cXG5UaGlzIHByb3BlcnR5IGhhcyBubyBlZmZlY3Qgb24gdGhlIG91dHB1dCB2aXN1YWxpemF0aW9uLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGF0YVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9EYXRhXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBkYXRhIHNvdXJjZVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1RyYW5zZm9ybVwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvYmplY3QgZGVzY3JpYmluZyBmaWx0ZXIgYW5kIG5ldyBmaWVsZCBjYWxjdWxhdGlvbi5cIlxuICAgICAgICB9LFxuICAgICAgICBcImNvbmZpZ1wiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Db25maWdcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ29uZmlndXJhdGlvbiBvYmplY3RcIlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJyZXF1aXJlZFwiOiBbXG4gICAgICAgIFwiZmFjZXRcIixcbiAgICAgICAgXCJzcGVjXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIFwiRmFjZXRcIjoge1xuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcInJvd1wiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Qb3NpdGlvbkNoYW5uZWxEZWZcIlxuICAgICAgICB9LFxuICAgICAgICBcImNvbHVtblwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Qb3NpdGlvbkNoYW5uZWxEZWZcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcIkxheWVyU3BlY1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwibGF5ZXJzXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVW5pdCBzcGVjcyB0aGF0IHdpbGwgYmUgbGF5ZXJlZC5cIixcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Vbml0U3BlY1wiXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIm5hbWVcIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJOYW1lIG9mIHRoZSB2aXN1YWxpemF0aW9uIGZvciBsYXRlciByZWZlcmVuY2UuXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIG9wdGlvbmFsIGRlc2NyaXB0aW9uIG9mIHRoaXMgbWFyayBmb3IgY29tbWVudGluZyBwdXJwb3NlLlxcblxcblRoaXMgcHJvcGVydHkgaGFzIG5vIGVmZmVjdCBvbiB0aGUgb3V0cHV0IHZpc3VhbGl6YXRpb24uXCIsXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkYXRhXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0RhdGFcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGRhdGEgc291cmNlXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0cmFuc2Zvcm1cIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVHJhbnNmb3JtXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIG9iamVjdCBkZXNjcmliaW5nIGZpbHRlciBhbmQgbmV3IGZpZWxkIGNhbGN1bGF0aW9uLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY29uZmlnXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0NvbmZpZ1wiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb25maWd1cmF0aW9uIG9iamVjdFwiXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBcInJlcXVpcmVkXCI6IFtcbiAgICAgICAgXCJsYXllcnNcIlxuICAgICAgXVxuICAgIH0sXG4gICAgXCJVbml0U3BlY1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwibWFya1wiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9NYXJrXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBtYXJrIHR5cGUuXFxuXFxuT25lIG9mIGBcXFwiYmFyXFxcImAsIGBcXFwiY2lyY2xlXFxcImAsIGBcXFwic3F1YXJlXFxcImAsIGBcXFwidGlja1xcXCJgLCBgXFxcImxpbmVcXFwiYCxcXG5cXG5gXFxcImFyZWFcXFwiYCwgYFxcXCJwb2ludFxcXCJgLCBgXFxcInJ1bGVcXFwiYCwgYW5kIGBcXFwidGV4dFxcXCJgLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZW5jb2RpbmdcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVW5pdEVuY29kaW5nXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEga2V5LXZhbHVlIG1hcHBpbmcgYmV0d2VlbiBlbmNvZGluZyBjaGFubmVscyBhbmQgZGVmaW5pdGlvbiBvZiBmaWVsZHMuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTmFtZSBvZiB0aGUgdmlzdWFsaXphdGlvbiBmb3IgbGF0ZXIgcmVmZXJlbmNlLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVzY3JpcHRpb25cIjoge1xuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvcHRpb25hbCBkZXNjcmlwdGlvbiBvZiB0aGlzIG1hcmsgZm9yIGNvbW1lbnRpbmcgcHVycG9zZS5cXG5cXG5UaGlzIHByb3BlcnR5IGhhcyBubyBlZmZlY3Qgb24gdGhlIG91dHB1dCB2aXN1YWxpemF0aW9uLlwiLFxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGF0YVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9EYXRhXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBkYXRhIHNvdXJjZVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwidHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1RyYW5zZm9ybVwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvYmplY3QgZGVzY3JpYmluZyBmaWx0ZXIgYW5kIG5ldyBmaWVsZCBjYWxjdWxhdGlvbi5cIlxuICAgICAgICB9LFxuICAgICAgICBcImNvbmZpZ1wiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Db25maWdcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ29uZmlndXJhdGlvbiBvYmplY3RcIlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXCJyZXF1aXJlZFwiOiBbXG4gICAgICAgIFwibWFya1wiXG4gICAgICBdXG4gICAgfSxcbiAgICBcIlVuaXRFbmNvZGluZ1wiOiB7XG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwieFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Qb3NpdGlvbkNoYW5uZWxEZWZcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiWCBjb29yZGluYXRlcyBmb3IgYHBvaW50YCwgYGNpcmNsZWAsIGBzcXVhcmVgLFxcblxcbmBsaW5lYCwgYHJ1bGVgLCBgdGV4dGAsIGFuZCBgdGlja2BcXG5cXG4ob3IgdG8gd2lkdGggYW5kIGhlaWdodCBmb3IgYGJhcmAgYW5kIGBhcmVhYCBtYXJrcykuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJ5XCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJZIGNvb3JkaW5hdGVzIGZvciBgcG9pbnRgLCBgY2lyY2xlYCwgYHNxdWFyZWAsXFxuXFxuYGxpbmVgLCBgcnVsZWAsIGB0ZXh0YCwgYW5kIGB0aWNrYFxcblxcbihvciB0byB3aWR0aCBhbmQgaGVpZ2h0IGZvciBgYmFyYCBhbmQgYGFyZWFgIG1hcmtzKS5cIlxuICAgICAgICB9LFxuICAgICAgICBcIngyXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJYMiBjb29yZGluYXRlcyBmb3IgcmFuZ2VkIGBiYXJgLCBgcnVsZWAsIGBhcmVhYFwiXG4gICAgICAgIH0sXG4gICAgICAgIFwieTJcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvUG9zaXRpb25DaGFubmVsRGVmXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlkyIGNvb3JkaW5hdGVzIGZvciByYW5nZWQgYGJhcmAsIGBydWxlYCwgYGFyZWFgXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJjb2xvclwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DaGFubmVsRGVmV2l0aExlZ2VuZFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb2xvciBvZiB0aGUgbWFya3Mg4oCTIGVpdGhlciBmaWxsIG9yIHN0cm9rZSBjb2xvciBiYXNlZCBvbiBtYXJrIHR5cGUuXFxuXFxuKEJ5IGRlZmF1bHQsIGZpbGwgY29sb3IgZm9yIGBhcmVhYCwgYGJhcmAsIGB0aWNrYCwgYHRleHRgLCBgY2lyY2xlYCwgYW5kIGBzcXVhcmVgIC9cXG5cXG5zdHJva2UgY29sb3IgZm9yIGBsaW5lYCBhbmQgYHBvaW50YC4pXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0NoYW5uZWxEZWZXaXRoTGVnZW5kXCIsXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9wYWNpdHkgb2YgdGhlIG1hcmtzIOKAkyBlaXRoZXIgY2FuIGJlIGEgdmFsdWUgb3IgaW4gYSByYW5nZS5cIlxuICAgICAgICB9LFxuICAgICAgICBcInNpemVcIjoge1xuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ2hhbm5lbERlZldpdGhMZWdlbmRcIixcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2l6ZSBvZiB0aGUgbWFyay5cXG5cXG4tIEZvciBgcG9pbnRgLCBgc3F1YXJlYCBhbmQgYGNpcmNsZWBcXG5cXG7igJMgdGhlIHN5bWJvbCBzaXplLCBvciBwaXhlbCBhcmVhIG9mIHRoZSBtYXJrLlxcblxcbi0gRm9yIGBiYXJgIGFuZCBgdGlja2Ag4oCTIHRoZSBiYXIgYW5kIHRpY2sncyBzaXplLlxcblxcbi0gRm9yIGB0ZXh0YCDigJMgdGhlIHRleHQncyBmb250IHNpemUuXFxuXFxuLSBTaXplIGlzIGN1cnJlbnRseSB1bnN1cHBvcnRlZCBmb3IgYGxpbmVgIGFuZCBgYXJlYWAuXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJzaGFwZVwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DaGFubmVsRGVmV2l0aExlZ2VuZFwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc3ltYm9sJ3Mgc2hhcGUgKG9ubHkgZm9yIGBwb2ludGAgbWFya3MpLiBUaGUgc3VwcG9ydGVkIHZhbHVlcyBhcmVcXG5cXG5gXFxcImNpcmNsZVxcXCJgIChkZWZhdWx0KSwgYFxcXCJzcXVhcmVcXFwiYCwgYFxcXCJjcm9zc1xcXCJgLCBgXFxcImRpYW1vbmRcXFwiYCwgYFxcXCJ0cmlhbmdsZS11cFxcXCJgLFxcblxcbm9yIGBcXFwidHJpYW5nbGUtZG93blxcXCJgLCBvciBlbHNlIGEgY3VzdG9tIFNWRyBwYXRoIHN0cmluZy5cIlxuICAgICAgICB9LFxuICAgICAgICBcImRldGFpbFwiOiB7XG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFkZGl0aW9uYWwgbGV2ZWxzIG9mIGRldGFpbCBmb3IgZ3JvdXBpbmcgZGF0YSBpbiBhZ2dyZWdhdGUgdmlld3MgYW5kXFxuXFxuaW4gbGluZSBhbmQgYXJlYSBtYXJrcyB3aXRob3V0IG1hcHBpbmcgZGF0YSB0byBhIHNwZWNpZmljIHZpc3VhbCBjaGFubmVsLlwiLFxuICAgICAgICAgIFwib25lT2ZcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZpZWxkRGVmXCIsXG4gICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJbnRlcmZhY2UgZm9yIGFueSBraW5kIG9mIEZpZWxkRGVmO1xcblxcbkZvciBzaW1wbGljaXR5LCB3ZSBkbyBub3QgZGVjbGFyZSBtdWx0aXBsZSBpbnRlcmZhY2VzIG9mIEZpZWxkRGVmIGxpa2VcXG5cXG53ZSBkbyBmb3IgSlNPTiBzY2hlbWEuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmllbGREZWZcIixcbiAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZXJmYWNlIGZvciBhbnkga2luZCBvZiBGaWVsZERlZjtcXG5cXG5Gb3Igc2ltcGxpY2l0eSwgd2UgZG8gbm90IGRlY2xhcmUgbXVsdGlwbGUgaW50ZXJmYWNlcyBvZiBGaWVsZERlZiBsaWtlXFxuXFxud2UgZG8gZm9yIEpTT04gc2NoZW1hLlwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIFwidGV4dFwiOiB7XG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GaWVsZERlZlwiLFxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUZXh0IG9mIHRoZSBgdGV4dGAgbWFyay5cIlxuICAgICAgICB9LFxuICAgICAgICBcImxhYmVsXCI6IHtcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZpZWxkRGVmXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJwYXRoXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT3JkZXIgb2YgZGF0YSBwb2ludHMgaW4gbGluZSBtYXJrcy5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9PcmRlckNoYW5uZWxEZWZcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICAgICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9PcmRlckNoYW5uZWxEZWZcIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcIm9yZGVyXCI6IHtcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTGF5ZXIgb3JkZXIgZm9yIG5vbi1zdGFja2VkIG1hcmtzLCBvciBzdGFjayBvcmRlciBmb3Igc3RhY2tlZCBtYXJrcy5cIixcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9PcmRlckNoYW5uZWxEZWZcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICAgICAgICAgICAgXCJpdGVtc1wiOiB7XG4gICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9PcmRlckNoYW5uZWxEZWZcIlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBcIiRzY2hlbWFcIjogXCJodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA0L3NjaGVtYSNcIlxufTsiLCIndXNlIHN0cmljdCc7XHJcbi8qIGdsb2JhbHMgd2luZG93LCBhbmd1bGFyICovXHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScsIFtcclxuICAgICdMb2NhbFN0b3JhZ2VNb2R1bGUnLFxyXG4gICAgJ2FuZ3VsYXItZ29vZ2xlLWFuYWx5dGljcycsXHJcbiAgICAnYW5ndWxhci1zb3J0YWJsZS12aWV3JyxcclxuICAgICdhbmd1bGFyLXdlYnNxbCcsXHJcbiAgICAndWktcmFuZ2VTbGlkZXInXHJcbiAgXSlcclxuICAuY29uc3RhbnQoJ18nLCB3aW5kb3cuXylcclxuICAvLyBkYXRhbGliLCB2ZWdhbGl0ZSwgdmVnYVxyXG4gIC5jb25zdGFudCgnY3FsJywgd2luZG93LmNxbClcclxuICAuY29uc3RhbnQoJ3ZsU2NoZW1hJywgd2luZG93LnZsU2NoZW1hKVxyXG4gIC8vIG90aGVyIGxpYnJhcmllc1xyXG4gIC5jb25zdGFudCgnalF1ZXJ5Jywgd2luZG93LiQpXHJcbiAgLmNvbnN0YW50KCdQYXBhJywgd2luZG93LlBhcGEpXHJcbiAgLmNvbnN0YW50KCdCbG9iJywgd2luZG93LkJsb2IpXHJcbiAgLmNvbnN0YW50KCdVUkwnLCB3aW5kb3cuVVJMKVxyXG4gIC5jb25zdGFudCgnRHJvcCcsIHdpbmRvdy5Ecm9wKVxyXG4gIC8vIFVzZSB0aGUgY3VzdG9taXplZCB2ZW5kb3IvanNvbjMtY29tcGFjdHN0cmluZ2lmeVxyXG4gIC5jb25zdGFudCgnSlNPTjMnLCB3aW5kb3cuSlNPTjMubm9Db25mbGljdCgpKVxyXG4gIC5jb25zdGFudCgnQU5ZJywgJ19fQU5ZX18nKVxyXG4gIC8vIGNvbnN0YW50c1xyXG4gIC5jb25zdGFudCgnY29uc3RzJywge1xyXG4gICAgYWRkQ291bnQ6IHRydWUsIC8vIGFkZCBjb3VudCBmaWVsZCB0byBEYXRhc2V0LmRhdGFzY2hlbWFcclxuICAgIGRlYnVnOiB0cnVlLFxyXG4gICAgdXNlVXJsOiB0cnVlLFxyXG4gICAgbG9nZ2luZzogdHJ1ZSxcclxuICAgIGxvZ0xldmVsOiAnSU5GTycsXHJcbiAgICBsb2dQcmludExldmVsOiAnSU5GTycsXHJcbiAgICBsb2dUb1dlYlNxbDogZmFsc2UsIC8vIGluIHVzZXIgc3R1ZGllcywgc2V0IHRoaXMgdG8gdHJ1ZVxyXG4gICAgaGlkZU1vcmVGbjogdHJ1ZSwgLy8gaGlkZSBiZWxvd0ZvbGQgZnVuY3Rpb25zIGFuZCBcIm1vcmVcIiAmIFwibGVzc1wiIHRvZ2dsZXMgaW4gZnVuY3Rpb25zZWxlY3QgZHVyaW5nIHVzZXIgc3R1ZGllc1xyXG4gICAgYXBwSWQ6ICd2bHVpJyxcclxuICAgIC8vIGVtYmVkZGVkIHBvbGVzdGFyIGFuZCB2b3lhZ2VyIHdpdGgga25vd24gZGF0YVxyXG4gICAgZW1iZWRkZWREYXRhOiB3aW5kb3cudmd1aURhdGEgfHwgdW5kZWZpbmVkLFxyXG4gICAgcHJpb3JpdHk6IHtcclxuICAgICAgYm9va21hcms6IDAsXHJcbiAgICAgIHBvcHVwOiAwLFxyXG4gICAgICB2aXNsaXN0OiAxMDAwXHJcbiAgICB9LFxyXG4gICAgbXlyaWFSZXN0OiAnaHR0cDovL2VjMi01Mi0xLTM4LTE4Mi5jb21wdXRlLTEuYW1hem9uYXdzLmNvbTo4NzUzJyxcclxuICAgIGRlZmF1bHRUaW1lRm46ICd5ZWFyJyxcclxuICAgIHdpbGRjYXJkRm46IHRydWUsXHJcbiAgICBoaWRlT3JkaW5hbFR5cGVTZWxlY3Q6IHRydWVcclxuICB9KVxyXG4gIC5jb25maWcoZnVuY3Rpb24oY3FsKSB7XHJcbiAgICBjcWwuY29uZmlnLkRFRkFVTFRfUVVFUllfQ09ORklHLmNoYW5uZWxzID0gWyd4JywgJ3knLCAnY29sdW1uJywgJ3NpemUnLCAnY29sb3InXTtcclxuICAgIGNxbC5jb25maWcuREVGQVVMVF9RVUVSWV9DT05GSUcuc3R5bGl6ZSA9IGZhbHNlO1xyXG4gIH0pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZShcInZsdWlcIikucnVuKFtcIiR0ZW1wbGF0ZUNhY2hlXCIsIGZ1bmN0aW9uKCR0ZW1wbGF0ZUNhY2hlKSB7JHRlbXBsYXRlQ2FjaGUucHV0KFwiZGF0YXNldC9jaGFuZ2Vsb2FkZWRkYXRhc2V0Lmh0bWxcIixcIjxkaXYgY2xhc3M9XFxcImNoYW5nZS1sb2FkZWQtZGF0YXNldFxcXCI+PGRpdiBuZy1pZj1cXFwidXNlckRhdGEubGVuZ3RoXFxcIj48aDM+5bey5a6a5LmJ55qE5oyH5qCHPC9oMz48dWw+PGxpIG5nLXJlcGVhdD1cXFwiZGF0YXNldCBpbiB1c2VyRGF0YSB0cmFjayBieSBkYXRhc2V0LmlkXFxcIiBuZy1jbGFzcz1cXFwie3NlbGVjdGVkOiBEYXRhc2V0LmN1cnJlbnREYXRhc2V0LmlkID09PSBkYXRhc2V0LmlkfVxcXCI+PGEgY2xhc3M9XFxcImRhdGFzZXRcXFwiIG5nLWNsaWNrPVxcXCJzZWxlY3REYXRhc2V0KGRhdGFzZXQpXFxcIiBuZy1kaXNhYmxlZD1cXFwiRGF0YXNldC5jdXJyZW50RGF0YXNldC5pZCA9PT0gZGF0YXNldC5pZFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWRhdGFiYXNlXFxcIj48L2k+IDxzdHJvbmc+e3tkYXRhc2V0Lm5hbWV9fTwvc3Ryb25nPjwvYT4gPHNwYW4gbmctaWY9XFxcImRhdGFzZXQuZGVzY3JpcHRpb25cXFwiPnt7ZGF0YXNldC5kZXNjcmlwdGlvbn19PC9zcGFuPiA8c3Ryb25nIG5nLWlmPVxcXCJEYXRhc2V0LmN1cnJlbnREYXRhc2V0ID09PSBkYXRhc2V0XFxcIj4o5bey6YCJ5LitKTwvc3Ryb25nPjwvbGk+PC91bD48L2Rpdj48aDM+6K+354K55Ye76YCJ5oupPC9oMz48dWwgY2xhc3M9XFxcImxvYWRlZC1kYXRhc2V0LWxpc3RcXFwiPjxsaSBuZy1yZXBlYXQ9XFxcImRhdGFzZXQgaW4gc2FtcGxlRGF0YSB0cmFjayBieSBkYXRhc2V0LmlkXFxcIiBuZy1jbGFzcz1cXFwie3NlbGVjdGVkOiBEYXRhc2V0LmN1cnJlbnREYXRhc2V0LmlkID09PSBkYXRhc2V0LmlkfVxcXCI+PGEgY2xhc3M9XFxcImRhdGFzZXRcXFwiIG5nLWNsaWNrPVxcXCJzZWxlY3REYXRhc2V0KGRhdGFzZXQpXFxcIiBuZy1kaXNhYmxlZD1cXFwiRGF0YXNldC5jdXJyZW50RGF0YXNldC5pZCA9PT0gZGF0YXNldC5pZFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWRhdGFiYXNlXFxcIj48L2k+IDxzdHJvbmc+e3tkYXRhc2V0Lm5hbWV9fTwvc3Ryb25nPjwvYT4gPHN0cm9uZyBuZy1pZj1cXFwiRGF0YXNldC5jdXJyZW50RGF0YXNldCA9PT0gZGF0YXNldFxcXCI+KOW3sumAieS4rSk8L3N0cm9uZz4gPGVtIG5nLWlmPVxcXCJkYXRhc2V0LmRlc2NyaXB0aW9uXFxcIj57e2RhdGFzZXQuZGVzY3JpcHRpb259fTwvZW0+PC9saT48L3VsPjwvZGl2PlwiKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dChcImRhdGFzZXQvZGF0YXNldG1vZGFsLmh0bWxcIixcIjxtb2RhbCBpZD1cXFwiZGF0YXNldC1tb2RhbFxcXCIgbWF4LXdpZHRoPVxcXCI4MDBweFxcXCI+PGRpdiBjbGFzcz1cXFwibW9kYWwtaGVhZGVyXFxcIj48bW9kYWwtY2xvc2UtYnV0dG9uPjwvbW9kYWwtY2xvc2UtYnV0dG9uPjxoMj7pgInmi6nmjIfmoIc8L2gyPjwvZGl2PjxkaXYgY2xhc3M9XFxcIm1vZGFsLW1haW5cXFwiPjx0YWJzZXQ+PHRhYiBoZWFkaW5nPVxcXCLlj6/nlKjmjIfmoIdcXFwiPjxjaGFuZ2UtbG9hZGVkLWRhdGFzZXQ+PC9jaGFuZ2UtbG9hZGVkLWRhdGFzZXQ+PC90YWI+PC90YWJzZXQ+PC9kaXY+PC9tb2RhbD5cIik7XG4kdGVtcGxhdGVDYWNoZS5wdXQoXCJkYXRhc2V0L2RhdGFzZXRzZWxlY3Rvci5odG1sXCIsXCI8YnV0dG9uIGlkPVxcXCJzZWxlY3QtZGF0YVxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCBidG4teHNcXFwiIG5nLWNsaWNrPVxcXCJsb2FkRGF0YXNldCgpO1xcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tY2xvdWQtZG93bmxvYWRcXFwiPjwvc3Bhbj7pgInmi6nmjIfmoIc8L2J1dHRvbj5cIik7XG4kdGVtcGxhdGVDYWNoZS5wdXQoXCJjb21wb25lbnRzL2ZpZWxkaW5mby9maWVsZGluZm8uaHRtbFwiLFwiPHNwYW4gY2xhc3M9XFxcImZpZWxkLWluZm9cXFwiPjxzcGFuIGNsYXNzPVxcXCJoZmxleCBmdWxsLXdpZHRoXFxcIiBuZy1jbGljaz1cXFwiY2xpY2tlZCgkZXZlbnQpXFxcIj48c3BhbiBjbGFzcz1cXFwidHlwZS1jYXJldFxcXCIgbmctY2xhc3M9XFxcInthY3RpdmU6ICFkaXNhYmxlQ2FyZXR9XFxcIj48c3BhbiBjbGFzcz1cXFwidHlwZSBmYSB7e2ljb259fVxcXCIgbmctc2hvdz1cXFwic2hvd1R5cGVcXFwiIHRpdGxlPVxcXCJ7e3R5cGVOYW1lfX1cXFwiPjwvc3Bhbj48L3NwYW4+IDxzcGFuIG5nLWlmPVxcXCJmaWVsZERlZi5hZ2dyZWdhdGUhPT1cXCdjb3VudFxcJ1xcXCIgY2xhc3M9XFxcImZpZWxkLWluZm8tdGV4dFxcXCI+PHNwYW4gbmctaWY9XFxcImZ1bmMoZmllbGREZWYpXFxcIiBjbGFzcz1cXFwiZmllbGQtZnVuY1xcXCIgdGl0bGU9XFxcInt7IGZ1bmMoZmllbGREZWYpIH19XFxcIiBuZy1jbGFzcz1cXFwie2FueTogZmllbGREZWYuX2FueX1cXFwiPnt7IGZ1bmMoZmllbGREZWYpIH19PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJmaWVsZC1uYW1lXFxcIiB0aXRsZT1cXFwie3sgKGZpZWxkRGVmLnRpdGxlIHx8IGZpZWxkVGl0bGUoZmllbGREZWYuZmllbGQpKSB8IHVuZGVyc2NvcmUyc3BhY2UgfX1cXFwiIG5nLWNsYXNzPVxcXCJ7aGFzZnVuYzogZnVuYyhmaWVsZERlZiksIGFueTogZmllbGREZWYuX2FueX1cXFwiPnt7IChmaWVsZERlZi50aXRsZSB8fCBmaWVsZFRpdGxlKGZpZWxkRGVmLmZpZWxkKSkgfCB1bmRlcnNjb3JlMnNwYWNlIH19PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwid2lsZGNhcmQtZmllbGQtY291bnRcXFwiPnt7IGZpZWxkQ291bnQoZmllbGREZWYuZmllbGQpIH19PC9zcGFuPjwvc3Bhbj4gPHNwYW4gbmctaWY9XFxcImZpZWxkRGVmLmFnZ3JlZ2F0ZT09PVxcJ2NvdW50XFwnIHx8IGZpZWxkRGVmLmF1dG9Db3VudFxcXCIgY2xhc3M9XFxcImZpZWxkLWNvdW50IGZpZWxkLWluZm8tdGV4dFxcXCI+PHNwYW4gY2xhc3M9XFxcImZpZWxkLW5hbWVcXFwiPuaVsOmHjzwvc3Bhbj48L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJuby1zaHJpbmsgcmVtb3ZlXFxcIiBuZy1zaG93PVxcXCJzaG93UmVtb3ZlXFxcIj48YSBjbGFzcz1cXFwicmVtb3ZlLWZpZWxkXFxcIiBuZy1jbGljaz1cXFwicmVtb3ZlQWN0aW9uKClcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10aW1lc1xcXCI+PC9pPjwvYT48L3NwYW4+PC9zcGFuPjwvc3Bhbj5cIik7XG4kdGVtcGxhdGVDYWNoZS5wdXQoXCJjb21wb25lbnRzL2VjY2hhbm5lbC9lY2NoYW5uZWwuaHRtbFwiLFwiPGRpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsXFxcIj57eyBjaGFubmVsVGl0bGUgfX08L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwidGhpc21vZGFsXFxcIiBkYXRhLWRyb3A9XFxcImNhbkRyYWcgPT0gXFwnMVxcJ1xcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie29uRHJvcDpcXCdGaWVsZERyb3BwZWQoKVxcJ31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj48c3BhbiBjbGFzcz1cXFwic2VsZWN0ZWQgZnVsbC13aWR0aCBmaWVsZC1pbmZvXFxcIiBuZy1zaG93PVxcXCJmaWVsZC5maWVsZFxcXCI+PHNwYW4gY2xhc3M9XFxcImhmbGV4IGZ1bGwtd2lkdGhcXFwiPjxzcGFuIGNsYXNzPVxcXCJ0eXBlLWNhcmV0IGRyb3AtdGFyZ2V0IGFjdGl2ZVxcXCIgbmctc2hvdz1cXFwiY2FuRHJvcCA9PSBcXCcxXFwnXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtY2FyZXQtZG93blxcXCI+PC9pPjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcImZpZWxkLWluZm8tdGV4dFxcXCI+e3sgZmllbGQuZmllbGQgfX08L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJuby1zaHJpbmsgcmVtb3ZlXFxcIj48YSBjbGFzcz1cXFwicmVtb3ZlLWZpZWxkXFxcIiBuZy1jbGljaz1cXFwicmVtb3ZlQWN0aW9uKClcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10aW1lc1xcXCI+PC9pPjwvYT48L3NwYW4+PC9zcGFuPjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIiBuZy1zaG93PVxcXCIhZmllbGQuZmllbGQgJiYgY2FuRHJhZyA9PSBcXCcxXFwnXFxcIj7lsIblrZfmrrXmi5bliLDmraTlpIQ8L3NwYW4+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZHJvcC1jb250YWluZXJcXFwiPjxkaXYgY2xhc3M9XFxcInBvcHVwLW1lbnUgZWNoYXJ0LXR5cGVcXFwiPjxkaXYgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ3R5cGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuminOiJsum7mOiupDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuYXV0b0NvbG9yXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIiBuZy1zaG93PVxcXCJmaWVsZC5hdXRvQ29sb3IgPT0gXFwnZmFsc2VcXCdcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuminOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBjb2xvci1pbnB1dFxcXCIgbmctYmx1cj1cXFwic2V0TWl4Q29sb3IoKVxcXCIgbmctbW9kZWw9XFxcIm1peF9jb2xvclxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5pWw5o2u5b2i54q2PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+PHNlbGVjdCBuZy1tb2RlbD1cXFwiZmllbGQudHJ1ZXR5cGVcXFwiPjxvcHRpb24gdmFsdWU9XFxcImJhclxcXCI+5p+x54q2PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwibGluZVxcXCI+57q/5oCnPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiYXJlYVxcXCI+5Yy65Z+f5Zu+PC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5pWw5YC85paH5a2XPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCd0cnVlXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnZmFsc2VcXCdcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5sYWJlbC5ub3JtYWwuc2hvd1xcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCIgbmctc2hvdz1cXFwiZmllbGQudHJ1ZXR5cGU9PVxcJ2JhclxcJ1xcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5paH5a2X5L2N572uPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+PHNlbGVjdCBuZy1tb2RlbD1cXFwiZmllbGQubGFiZWwubm9ybWFsLnBvc2l0aW9uXFxcIj48b3B0aW9uIHZhbHVlPVxcXCJsZWZ0XFxcIj5sZWZ0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwicmlnaHRcXFwiPnJpZ2h0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwidG9wXFxcIj50b3A8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJib3R0b21cXFwiPmJvdHRvbTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImluc2lkZVxcXCI+aW5zaWRlPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlVG9wXFxcIj5pbnNpZGVUb3A8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJpbnNpZGVMZWZ0XFxcIj5pbnNpZGVMZWZ0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlUmlnaHRcXFwiPmluc2lkZVJpZ2h0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlQm90dG9tXFxcIj5pbnNpZGVCb3R0b208L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJpbnNpZGVUb3BMZWZ0XFxcIj5pbnNpZGVUb3BMZWZ0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlVG9wUmlnaHRcXFwiPmluc2lkZVRvcFJpZ2h0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlQm90dG9tTGVmdFxcXCI+aW5zaWRlQm90dG9tTGVmdDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImluc2lkZUJvdHRvbVJpZ2h0XFxcIj5pbnNpZGVCb3R0b21SaWdodDwvb3B0aW9uPjwvc2VsZWN0PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiIG5nLXNob3c9XFxcImZpZWxkLnRydWV0eXBlPT1cXCdiYXJcXCdcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuaWh+Wtl+e/u+i9rDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnOTBcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCcwXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubGFiZWwubm9ybWFsLnJvdGF0ZVxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBzdHlsZT1cXFwid2lkdGg6IDI1MHB4O1xcXCIgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ2xhYmVsXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7mloflrZfmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsLnNob3dcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPuS9jee9rjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5sYWJlbC5wb3NpdGlvblxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwib3V0c2lkZVxcXCI+5aSW5L6nPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlXFxcIj7lhoXpg6g8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7nmb7liIbmr5Q8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsLnNob3dwZXJjZW50XFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDoxNTBweFxcXCIgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ3N0eWxlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7mloflrZfmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5uYW1lXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7nmb7liIbmr5Q8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLnNob3dQZXJjZW50XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7mlbDlgLzlpKflsI88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS02XFxcIj48ZGl2IHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBzdHlsZT1cXFwibWFyZ2luOiAwOyBwYWRkaW5nOiAwO1xcXCIgbWluPVxcXCIxMFxcXCIgbWF4PVxcXCIyNVxcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5zdHlsZS5kZXRhaWwuZm9udFNpemVcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5Y2V5L2N5aSn5bCPPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDtwYWRkaW5nOiAwO1xcXCIgbWluPVxcXCIxMFxcXCIgbWF4PVxcXCIyNVxcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5zdHlsZS50aXRsZS5mb250U2l6ZVxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7nur/mnaHnspfnu4Y8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS02XFxcIj48ZGl2IHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBzdHlsZT1cXFwibWFyZ2luOiAwO3BhZGRpbmc6IDA7XFxcIiBtaW49XFxcIjFcXFwiIG1heD1cXFwiMjBcXFwiIG1vZGVsLW1heD1cXFwiZmllbGQuc3R5bGUuYXhpc0xpbmUubGluZVN0eWxlLndpZHRoXFxcIiBwaW4taGFuZGxlPVxcXCJtaW5cXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPuWIu+W6pumVv+W6pjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxkaXYgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIHN0eWxlPVxcXCJtYXJnaW46IDA7cGFkZGluZzogMDtcXFwiIG1pbj1cXFwiMVxcXCIgbWF4PVxcXCIyMFxcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5zdHlsZS5heGlzVGljay5sZW5ndGhcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5YiG5Ymy6ZW/5bqmPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDtwYWRkaW5nOiAwO1xcXCIgbWluPVxcXCI1XFxcIiBtYXg9XFxcIjI1XFxcIiBtb2RlbC1tYXg9XFxcImZpZWxkLnN0eWxlLnNwbGl0TGluZS5sZW5ndGhcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5Yqo5oCB5pyA5aSn5YC8PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCd0cnVlXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnZmFsc2VcXCdcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5hdXRvTWF4XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIiBuZy1pZj1cXFwiZmllbGQuYXV0b01heCA9PSBcXCdmYWxzZVxcJ1xcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5pyA5aSn5YC8PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubWF4XFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogMjAwcHg7XFxcIiBuZy1pZj1cXFwiZHJvcFR5cGUgPT0gXFwnbWFwcG9pbnRcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuminOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBwb2ludC1jb2xvci1pbnB1dFxcXCIgcmVsPVxcXCJub3JtYWxcXFwiIG5nLWJsdXI9XFxcInNldFBvaW50Q29sb3IoXFwnbm9ybWFsXFwnKVxcXCIgbmctbW9kZWw9XFxcInBvaW50X2NvbG9yXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7nqoHlh7rmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmlmdG9wXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7mjpLluo88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48c2VsZWN0IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQub3JkZXJcXFwiPjxvcHRpb24gdmFsdWU9XFxcImFzY1xcXCI+6aG65bqPPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZGVzY1xcXCI+5YCS5bqPPC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5pi+56S65pWw6YePPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQub3JkZXJfbnVtXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7nqoHlh7rpopzoibI8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggcG9pbnQtY29sb3ItaW5wdXRcXFwiIHJlbD1cXFwidG9wXFxcIiBuZy1ibHVyPVxcXCJzZXRQb2ludENvbG9yKFxcJ3RvcFxcJylcXFwiIG5nLW1vZGVsPVxcXCJwb2ludF90b3BfY29sb3JcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgc3R5bGU9XFxcIndpZHRoOiAyMDBweDtcXFwiIG5nLWlmPVxcXCJkcm9wVHlwZSA9PSBcXCdzaW5nbGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuagh+mimDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLThcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7ljZXkvY08L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS04XFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC51bml0XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7lrZfkvZPlpKflsI88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS04XFxcIj48ZGl2IHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBtaW49XFxcIjEyXFxcIiBtYXg9XFxcIjI0XFxcIiBtb2RlbC1tYXg9XFxcImZpZWxkLmZvbnRzaXplXFxcIiBwaW4taGFuZGxlPVxcXCJtaW5cXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLThcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgcmVhZG9ubHk9XFxcIlxcXCIgbmctbW9kZWw9XFxcImZpZWxkLmZvbnRzaXplXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctaWY9XFxcIm1vcmVEcmFnICYmIGZpZWxkLmF1dG9NYXggPT0gXFwndHJ1ZVxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsXFxcIj7mnIDlpKflgLw8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubWF4RmllbGRcXFwiIGRhdGEtZHJvcD1cXFwidHJ1ZVxcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj48c3BhbiBjbGFzcz1cXFwic2VsZWN0ZWQgZnVsbC13aWR0aCBmaWVsZC1pbmZvXFxcIj48c3BhbiBjbGFzcz1cXFwiaGZsZXggZnVsbC13aWR0aFxcXCI+PHNwYW4gY2xhc3M9XFxcImZpZWxkLWluZm8tdGV4dFxcXCI+e3sgZmllbGQubWF4RmllbGQuZmllbGQgfX08L3NwYW4+PC9zcGFuPjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIiBuZy1zaG93PVxcXCIhZmllbGQuZmllbGQgJiYgY2FuRHJhZyA9PSBcXCcxXFwnXFxcIj7mraTkuLoge3sgZmllbGQuZmllbGQgfX0g55qEIOacgOWkp+WAvDwvc3Bhbj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj5cIik7XG4kdGVtcGxhdGVDYWNoZS5wdXQoXCJjb21wb25lbnRzL21vZGFsL21vZGFsLmh0bWxcIixcIjxkaXYgY2xhc3M9XFxcIm5nbW9kYWxcXFwiIG5nLWlmPVxcXCJpc09wZW5cXFwiPjxkaXYgY2xhc3M9XFxcIm1vZGFsLXdyYXBwZXJcXFwiIHN0eWxlPVxcXCJ7e3dyYXBwZXJTdHlsZX19XFxcIiBuZy10cmFuc2NsdWRlPVxcXCJcXFwiPjwvZGl2PjwvZGl2PlwiKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dChcImNvbXBvbmVudHMvbW9kYWwvbW9kYWxjbG9zZWJ1dHRvbi5odG1sXCIsXCI8ZGl2IGNsYXNzPVxcXCJyaWdodFxcXCI+PGEgbmctY2xpY2s9XFxcImNsb3NlTW9kYWwoKVxcXCIgY2xhc3M9XFxcInJpZ2h0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdGltZXNcXFwiPjwvaT48L2E+PC9kaXY+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiY29tcG9uZW50cy9zY2hlbWFsaXN0L3NjaGVtYWxpc3QuaHRtbFwiLFwiPGRpdiBjbGFzcz1cXFwic2NoZW1hIG5vLXRvcC1tYXJnaW4gZnVsbC13aWR0aCBzY3JvbGwteVxcXCI+PHNjaGVtYS1saXN0LWl0ZW0gbmctcmVwZWF0PVxcXCJmaWVsZERlZiBpbiBmaWVsZERlZnMgfCBvcmRlckJ5IDogb3JkZXJCeVxcXCIgZmllbGQtZGVmPVxcXCJmaWVsZERlZlxcXCIgZmlsdGVyLW1hbmFnZXI9XFxcImZpbHRlck1hbmFnZXJcXFwiIHNob3ctYWRkPVxcXCJzaG93QWRkXFxcIj48L3NjaGVtYS1saXN0LWl0ZW0+PGRpdiBjbGFzcz1cXFwic2NoZW1hLWxpc3QtZHJvcFxcXCIgbmctc2hvdz1cXFwic2hvd0Ryb3BcXFwiIG5nLW1vZGVsPVxcXCJkcm9wcGVkRmllbGREZWZcXFwiIGRhdGEtZHJvcD1cXFwidHJ1ZVxcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie29uRHJvcDpcXCdmaWVsZERyb3BwZWRcXCd9XFxcIiBkYXRhLWpxeW91aS1vcHRpb25zPVxcXCJ7YWN0aXZlQ2xhc3M6IFxcJ2Ryb3AtYWN0aXZlXFwnfVxcXCI+Q3JlYXRlIGEgbmV3IHdpbGRjYXJkLjwvZGl2PjwvZGl2PlwiKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dChcImNvbXBvbmVudHMvc2NoZW1hbGlzdC9zY2hlbWFsaXN0aXRlbS5odG1sXCIsXCI8ZGl2IGNsYXNzPVxcXCJzY2hlbWEtbGlzdC1pdGVtXFxcIiBuZy1tb2RlbD1cXFwiZHJvcHBlZEZpZWxkRGVmXFxcIiBkYXRhLWRyb3A9XFxcImlzQW55RmllbGQgJiYgZmllbGREZWYuZmllbGQgIT09IFxcJz9cXCdcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwnZmllbGREcm9wcGVkXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxmaWVsZC1pbmZvIG5nLXNob3c9XFxcIiFpc0FueUZpZWxkIHx8IGZpZWxkRGVmLmZpZWxkID09PSBcXCc/XFwnIHx8IGZpZWxkRGVmLmZpZWxkLmVudW0ubGVuZ3RoID4gMFxcXCIgY2xhc3M9XFxcInBpbGwgZHJhZ2dhYmxlIGZ1bGwtd2lkdGggbm8tcmlnaHQtbWFyZ2luXFxcIiBuZy1jbGFzcz1cXFwie2FueTogaXNFbnVtU3BlYyhmaWVsZERlZi5maWVsZCl9XFxcIiBmaWVsZC1kZWY9XFxcImZpZWxkRGVmXFxcIiBuZy1tb2RlbD1cXFwicGlsbFxcXCIgZGF0YS1kcmFnPVxcXCJ0cnVlXFxcIiBqcXlvdWktZHJhZ2dhYmxlPVxcXCJ7cGxhY2Vob2xkZXI6IFxcJ2tlZXBcXCcsIGRlZXBDb3B5OiB0cnVlLCBvblN0YXJ0OiBcXCdmaWVsZERyYWdTdGFydFxcJywgb25TdG9wOlxcJ2ZpZWxkRHJhZ1N0b3BcXCd9XFxcIiBkYXRhLWpxeW91aS1vcHRpb25zPVxcXCJ7cmV2ZXJ0OiBcXCdpbnZhbGlkXFwnLCBoZWxwZXI6IFxcJ2Nsb25lXFwnfVxcXCIgc2hvdy1hZGQ9XFxcInNob3dBZGRcXFwiIHNob3ctY2FyZXQ9XFxcInRydWVcXFwiIGRpc2FibGUtY2FyZXQ9XFxcImZpZWxkRGVmLmltbXV0YWJsZSB8fCBmaWVsZERlZi5hZ2dyZWdhdGUgPT09IFxcJ2NvdW50XFwnIHx8IGFsbG93ZWRUeXBlcy5sZW5ndGg8PTFcXFwiIHNob3ctdHlwZT1cXFwidHJ1ZVxcXCIgYWRkLWFjdGlvbj1cXFwiZmllbGRBZGQoZmllbGREZWYpXFxcIiBzaG93LWZpbHRlcj1cXFwiISFmaWx0ZXJNYW5hZ2VyXFxcIiBmaWx0ZXItYWN0aW9uPVxcXCJ0b2dnbGVGaWx0ZXIoKVxcXCIgdXNlLXRpdGxlPVxcXCJ0cnVlXFxcIiBwb3B1cC1jb250ZW50PVxcXCJmaWVsZEluZm9Qb3B1cENvbnRlbnRcXFwiPjwvZmllbGQtaW5mbz48L2Rpdj48ZGl2IGNsYXNzPVxcXCJkcm9wLWNvbnRhaW5lclxcXCI+PGRpdiBjbGFzcz1cXFwicG9wdXAtbWVudSBzY2hlbWEtbWVudVxcXCIgbmctaGlkZT1cXFwiIWFsbG93ZWRUeXBlcyB8fCBhbGxvd2VkVHlwZXMubGVuZ3RoPD0xXFxcIj48ZGl2IGNsYXNzPVxcXCJtYjUgZmllbGQtdHlwZVxcXCIgbmctaWY9XFxcImFsbG93ZWRUeXBlcy5sZW5ndGg+MSAmJiAhaXNBbnlGaWVsZFxcXCI+PGg0PlR5cGU8L2g0PjxsYWJlbCBjbGFzcz1cXFwidHlwZS1sYWJlbFxcXCIgbmctcmVwZWF0PVxcXCJ0eXBlIGluIGFsbG93ZWRUeXBlc1xcXCIgbmctaWY9XFxcInR5cGUgIT09IFxcJ29yZGluYWxcXCcgfHwgIWNvbnN0cy5oaWRlT3JkaW5hbFR5cGVTZWxlY3RcXFwiPjxpbnB1dCB0eXBlPVxcXCJyYWRpb1xcXCIgbmctdmFsdWU9XFxcInR5cGVcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZERlZi50eXBlXFxcIj4ge3t0eXBlfX08L2xhYmVsPjwvZGl2PjxkaXYgY2xhc3M9XFxcIndpbGRjYXJkLW1lbnVcXFwiIG5nLXNob3c9XFxcImlzQW55RmllbGQgJiYgZmllbGREZWYuZmllbGQuZW51bVxcXCI+PGRpdj48bGFiZWwgY2xhc3M9XFxcIndpbGRjYXJkLXRpdGxlLWxhYmVsXFxcIj48aDQ+TmFtZTwvaDQ+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZERlZi50aXRsZVxcXCIgcGxhY2Vob2xkZXI9XFxcInt7ZmllbGRUaXRsZShmaWVsZERlZi5maWVsZCl9fVxcXCI+PC9sYWJlbD48L2Rpdj48aDQ+V2lsZGNhcmQgRmllbGRzPC9oND48ZGl2IGNsYXNzPVxcXCJ3aWxkY2FyZC1maWVsZHNcXFwiPjxmaWVsZC1pbmZvIG5nLXJlcGVhdD1cXFwiZmllbGQgaW4gZmllbGREZWYuZmllbGQuZW51bVxcXCIgY2xhc3M9XFxcInBpbGwgbGlzdC1pdGVtIGZ1bGwtd2lkdGggbm8tcmlnaHQtbWFyZ2luXFxcIiBmaWVsZC1kZWY9XFxcImZpZWxkID09PSBcXCcqXFwnID8gY291bnRGaWVsZERlZiA6IERhdGFzZXQuc2NoZW1hLmZpZWxkU2NoZW1hKGZpZWxkKVxcXCIgc2hvdy10eXBlPVxcXCJ0cnVlXFxcIiBzaG93LXJlbW92ZT1cXFwidHJ1ZVxcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlV2lsZGNhcmRGaWVsZCgkaW5kZXgpXFxcIj48L2ZpZWxkLWluZm8+PC9kaXY+PGEgY2xhc3M9XFxcInJlbW92ZS1hY3Rpb25cXFwiIG5nLWNsaWNrPVxcXCJyZW1vdmVXaWxkY2FyZCgpXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdGltZXNcXFwiPjwvaT4gRGVsZXRlIFdpbGRjYXJkPC9hPjwvZGl2PjwvZGl2PjwvZGl2PlwiKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dChcImNvbXBvbmVudHMvc2hlbHZlcy9zaGVsdmVzLmh0bWxcIixcIjxkaXYgY2xhc3M9XFxcImNhcmQgdmZsZXggc2hlbHZlcyBuby10b3AtbWFyZ2luIG5vLXJpZ2h0LW1hcmdpbiBhYnMtMTAwXFxcIj48ZGl2IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBzdHlsZT1cXFwicG9zaXRpb246IHJlbGF0aXZlO1xcXCIgbmctbW91c2VvdmVyPVxcXCJzaG93bWFya3R5cGU9dHJ1ZVxcXCIgbmctbW91c2VsZWF2ZT1cXFwic2hvd21hcmt0eXBlPWZhbHNlXFxcIj48YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgY2xhc3M9XFxcInNlbGVjdC1idG5cXFwiIG5nLWNsaWNrPVxcXCJzaG93bWFya3R5cGUgPSAhc2hvd21hcmt0eXBlXFxcIj48aSBjbGFzcz1cXFwiZmEge3sgbWFya2RldGFpbC5pY29uIH19XFxcIj57eyBtYXJrZGV0YWlsLnRpdGxlIH19PC9pPjwvYnV0dG9uPjx1bCBjbGFzcz1cXFwibWFya3R5cGUtbGlzdFxcXCIgbmctc2hvdz1cXFwic2hvd21hcmt0eXBlXFxcIj48bGkgbmctcmVwZWF0PVxcXCJ0eXBlIGluIG1hcmtzV2l0aEFueSB0cmFjayBieSAkaW5kZXhcXFwiIG5nLWNsaWNrPVxcXCJjaGFuZ2V0eXBlKHR5cGUpXFxcIj48aSBjbGFzcz1cXFwiZmEge3sgbWFya3NpY29uW3R5cGVdLmljb24gfX1cXFwiPjwvaT4ge3sgbWFya3NpY29uW3R5cGVdLnRpdGxlIH19PC9saT48L3VsPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtZW5jb2RpbmctcGFuZSBmdWxsLXdpZHRoXFxcIj48aDIgbmctc2hvdz1cXFwic3BlYy5tYXJrICE9IFxcJ3NpbmdsZVxcJ1xcXCI+5qCH6aKYPC9oMj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgIT0gXFwnc2luZ2xlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7moIfpopg8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLWJsdXI9XFxcInNldE5vcm1hbFRpdGxlKFxcJ3RpdGxlXFwnKTtcXFwiIG5nLW1vZGVsPVxcXCJub3JtYWxUaXRsZVxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayAhPSBcXCdzaW5nbGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+6aKc6ImyPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoIGNvbG9yLWlucHV0LXRpdGxlXFxcIiBuZy1ibHVyPVxcXCJzZXRDb2xvcihcXCdidFxcJylcXFwiIHJlbD1cXFwiYnRcXFwiIG5nLW1vZGVsPVxcXCJ0aXRsZXRleHRjb2xvclxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayAhPSBcXCdzaW5nbGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5bCP5qCH6aKYPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1ibHVyPVxcXCJzZXROb3JtYWxUaXRsZShcXCdzdWJfdGl0bGVcXCcpO1xcXCIgbmctbW9kZWw9XFxcIm5vcm1hbFN1YlRpdGxlXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrICE9IFxcJ3NpbmdsZVxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7popzoibI8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggY29sb3ItaW5wdXQtdGl0bGVcXFwiIG5nLWJsdXI9XFxcInNldENvbG9yKFxcJ3NidFxcJylcXFwiIHJlbD1cXFwic2J0XFxcIiBuZy1tb2RlbD1cXFwic3VidGl0bGV0ZXh0Y29sb3JcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgIT0gXFwnc2luZ2xlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuS9jee9rjwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy50aXRsZS5wb3NpdGlvblxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwidXBsZWZ0XFxcIj7lt6bkuIo8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJ1cGNlbnRlclxcXCI+5LiK5Lit5b+DPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwidXByaWdodFxcXCI+5Y+z5LiKPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZG93bmxlZnRcXFwiPuW3puS4izwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImRvd25jZW50ZXJcXFwiPuS4i+S4reW/gzwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImRvd25yaWdodFxcXCI+5Y+z5LiLPC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1tYXJrcy1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayAhPSBcXCdibWFwXFwnICYmIHNwZWMubWFyayAhPSBcXCdzaW5nbGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuS4u+mimDwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy50aGVtZVxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwidml0YWxpdHlcXFwiPua0u+WKm+Wbm+WwhDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImdyZWVuR2FyZGVuXFxcIj7nu7/oibLoirHlm608L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJyb21hblxcXCI+57Sr5LiB6aaZPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwicHVycGxlXFxcIj7ntKvnvZflhbA8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJhaXJcXFwiPua4heaWsOepuuawlDwvb3B0aW9uPjwvc2VsZWN0PjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxoMj7lsZ7mgKc8L2gyPjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnc2luZ2xlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7moIfpopg8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLWJsdXI9XFxcInNldE5vcm1hbFRpdGxlKFxcJ3RpdGxlXFwnKTtcXFwiIG5nLW1vZGVsPVxcXCJub3JtYWxUaXRsZVxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGVjLWNoYW5uZWwgZHJvcC10eXBlPVxcXCJcXCdzaW5nbGVcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiBjaGFubmVsLXRpdGxlPVxcXCJcXCfluqbph49cXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcwXFwnXFxcIiBjaGFubmVsLWtleT1cXFwieXZhbFxcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsJGluZGV4KVxcXCIgbmctcmVwZWF0PVxcXCJ5dmFsIGluIGVjY29uZmlnLmZpZWxkLnkgdHJhY2sgYnkgJGluZGV4XFxcIiBmaWVsZD1cXFwieXZhbFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLXNob3c9XFxcImVjY29uZmlnLmZpZWxkLnkubGVuZ3RoIDwgNFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiIG5nLW1vZGVsPVxcXCJzaW5nbGVNb2RlbFxcXCIgZGF0YS1kcm9wPVxcXCJ0cnVlXFxcIiBqcXlvdWktZHJvcHBhYmxlPVxcXCJ7b25Ecm9wOlxcJ3NpbmdsZUZpZWxkRHJvcFxcJ31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj48c3BhbiBjbGFzcz1cXFwicGxhY2Vob2xkZXJcXFwiPuaLluWKqOWtl+auteWIsOatpOWkhOe7n+iuoeW6pumHj+W6pjwvc3Bhbj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLWVjaGFydC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayA9PSBcXCdwaWVcXCdcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+W6pumHj1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnlcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgZHJvcC10eXBlPVxcXCJcXCdsYWJlbFxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcwXFwnXFxcIiBjaGFubmVsLWtleT1cXFwieGtleVxcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3hcXCcsJGluZGV4KVxcXCIgbmctcmVwZWF0PVxcXCJ4dmFsIGluIGVjY29uZmlnLmZpZWxkLnggdHJhY2sgYnkgJGluZGV4XFxcIiBmaWVsZD1cXFwieHZhbFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwicGlleG1vZGVsXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwncGlleEZpZWxkRHJvcFxcJ31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj48c3BhbiBjbGFzcz1cXFwicGxhY2Vob2xkZXJcXFwiPuaLluWKqOWtl+auteWIsOatpOWkhOe7n+iuoee7tOW6pjwvc3Bhbj48L2Rpdj48L2Rpdj48L2Rpdj48aDI+5ZyG5b+D6Led56a7PC9oMj48ZGl2IHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBtaW49XFxcIjBcXFwiIG1heD1cXFwiMjBcXFwiIG1vZGVsLW1heD1cXFwiZWNjb25maWcuc3RhcnRfcmFkaXVzXFxcIiBwaW4taGFuZGxlPVxcXCJtaW5cXFwiPjwvZGl2PjxoMj7pl7TpmpQ8L2gyPjxkaXYgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIG1pbj1cXFwiMFxcXCIgbWF4PVxcXCIyMFxcXCIgbW9kZWwtbWF4PVxcXCJlY2NvbmZpZy5yYWRpdXNfcmFuZ2VcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PGgyPuWhq+WFheWuveW6pjwvaDI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgbWluPVxcXCIwXFxcIiBtYXg9XFxcIjgwXFxcIiBtb2RlbC1tYXg9XFxcImVjY29uZmlnLnJhZGl1c19pbnRlcnZhbFxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLWVjaGFydC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcImhhc0xlZ2VuZChzcGVjLm1hcmspXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7mmL7npLrlm77kvos8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJzFcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCcyXFwnXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubGVnZW5kLnNob3dcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuWbvuS+i+e/u+i9rDwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnaG9yaXpvbnRhbFxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ3ZlcnRpY2FsXFwnXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubGVnZW5kLm9yaWVudFxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5rua5Yqo5Zu+5L6LPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCdzY3JvbGxcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdwbGFpblxcJ1xcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLmxlZ2VuZC50eXBlXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lm77kvovkvY3nva48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48c2VsZWN0IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubGVnZW5kLnBvc2l0aW9uXFxcIj48b3B0aW9uIHZhbHVlPVxcXCJ1cGxlZnRcXFwiPuW3puS4ijwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInVwY2VudGVyXFxcIj7kuIrkuK3lv4M8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJ1cHJpZ2h0XFxcIj7lj7PkuIo8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJkb3dubGVmdFxcXCI+5bem5LiLPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZG93bmNlbnRlclxcXCI+5LiL5Lit5b+DPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZG93bnJpZ2h0XFxcIj7lj7PkuIs8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLWVjaGFydC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayA9PSBcXCdmdW5uZWxcXCdcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFswXVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC55XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnZ2F1Z2VcXCdcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+W6pumHj1xcJysoJGluZGV4KzEpXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgbW9yZS1kcmFnPVxcXCJcXCd0cnVlXFwnXFxcIiBkcm9wLXR5cGU9XFxcIlxcJ3N0eWxlXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd5XFwnLCRpbmRleClcXFwiIG5nLXJlcGVhdD1cXFwiZ2F1Z2Vtb2RhbCBpbiBlY2NvbmZpZy5maWVsZC55IHRyYWNrIGJ5ICRpbmRleFxcXCIgZmllbGQ9XFxcImdhdWdlbW9kYWxcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIiBuZy1zaG93PVxcXCJlY2NvbmZpZy5maWVsZC55Lmxlbmd0aCA8IDNcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwiZ2F1Z2VZXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwnZ2F1Z2VZRmllbGREcm9wXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxzcGFuIGNsYXNzPVxcXCJwbGFjZWhvbGRlclxcXCI+5ouW5Yqo5a2X5q615Yiw5q2k5aSE57uf6K6h57u05bqmPC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtcG9zaXRpb25hbC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLWlmPVxcXCJzcGVjLm1hcmsgPT0gXFwnYm1hcFxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+55m+5bqm5Zyw5Zu+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCcxXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnMlxcJ1xcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLm1hcGRhdGEuaWZCbWFwXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnYm1hcFxcJyAmJiBlY2NvbmZpZy5tYXBkYXRhLmlmQm1hcCAhPSBcXCcxXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuWcsOWbvuagt+W8jzwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5tYXBkYXRhLm1hcF90aGVtZVxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwibGlnaHRcXFwiPuaYjjwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImRhcmtcXFwiPuaalzwvb3B0aW9uPjwvc2VsZWN0PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtcG9zaXRpb25hbC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayA9PSBcXCdibWFwXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwidGFiIGFjdGl2ZVxcXCIgbmctY2xhc3M9XFxcIntcXCd0YWIxXFwnOlxcJ3RhYi1hY3RpdmVcXCd9W3RhYl1cXFwiIG5nLWNsaWNrPVxcXCJzZXRUYWIoXFwndGFiMVxcJyk7XFxcIj7ljLrln588L2Rpdj48ZGl2IGNsYXNzPVxcXCJ0YWJcXFwiIG5nLWNsYXNzPVxcXCJ7XFwndGFiMlxcJzpcXCd0YWItYWN0aXZlXFwnfVt0YWJdXFxcIiBuZy1jbGljaz1cXFwic2V0VGFiKFxcJ3RhYjJcXCcpO1xcXCI+5qCH6K6wPC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1wb3NpdGlvbmFsLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ2JtYXBcXCcgJiYgdGFiID09IFxcJ3RhYjFcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIiBuZy1pZj1cXFwiZWNjb25maWcubWFwZGF0YS5pZkJtYXAgPT0gXFwnMVxcJ1xcXCI+55m+5bqm5Zyw5Zu+5LiN5pSv5oyB5Yy65Z+f5pWw5o2u5bGV56S6PC9kaXY+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5Yy65Z+f5Zyw5Yy6XFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZUFyZWEoXFwneFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5hcmVhLnhcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+WMuuWfn+aVsOWAvFxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVBcmVhKFxcJ3lcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuYXJlYS55XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1yZXBlYXQ9XFxcInBvaW50cm93IGluIGVjY29uZmlnLnBvaW50IHRyYWNrIGJ5ICRpbmRleFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ2JtYXBcXCcgJiYgdGFiID09IFxcJ3RhYjJcXCdcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+agh+iusOWcsOWMulxcJ1xcXCIgZHJvcC10eXBlPVxcXCJcXCdtYXBwb2ludFxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjaGFubmVsLWtleT1cXFwiXFwnMFxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlUG9pbnQoXFwneFxcJywkaW5kZXgpXFxcIiBmaWVsZD1cXFwicG9pbnRyb3cueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5qCH6K6w5pWw5YC8XFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZVBvaW50KFxcJ3lcXCcsJGluZGV4KVxcXCIgZmllbGQ9XFxcInBvaW50cm93LnlcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtcG9zaXRpb25hbC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayA9PSBcXCdibWFwXFwnICYmIHRhYiA9PSBcXCd0YWIyXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctc2hvdz1cXFwiZWNjb25maWcucG9pbnQubGVuZ3RoIDwgM1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiIG5nLW1vZGVsPVxcXCJwb2ludE1vZGVsXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwncG9pbnRGaWVsZERyb3BcXCd9XFxcIiBkYXRhLWpxeW91aS1vcHRpb25zPVxcXCJ7YWN0aXZlQ2xhc3M6IFxcJ2Ryb3AtYWN0aXZlXFwnfVxcXCI+PHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIj7mi5bliqjlnLDljLrlrZfmrrXliLDmraTlpITlop7liqDmoIforrA8L3NwYW4+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1tYXJrcy1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayA9PSBcXCdtaXhlZFxcJ1xcXCI+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn57u05bqmXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBkcm9wLXR5cGU9XFxcIlxcJ3R5cGVcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMFxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsJGluZGV4KVxcXCIgbmctcmVwZWF0PVxcXCJ5dmFsIGluIGVjY29uZmlnLmZpZWxkLnkgdHJhY2sgYnkgJGluZGV4XFxcIiBmaWVsZD1cXFwieXZhbFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwieW1vZGVsXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwnbWl4ZWR5RmllbGREcm9wXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxzcGFuIGNsYXNzPVxcXCJwbGFjZWhvbGRlclxcXCI+5ouW5Yqo5pWw5YC857G75a2X5q615Yiw5q2k5aSE57uf6K6h5bqm6YePPC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnbWl4ZWRcXCdcXFwiPjxoMj7pgInpobk8L2gyPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuWQiOW5tjwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnMVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJzJcXCdcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5pZm1lcmdlXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7ovaznva48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJzFcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCcyXFwnXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcudHJhbnNwb3NlXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLW1hcmtzLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ3NjYXR0ZXJcXCdcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneFxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnhcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ3jovbTluqbph49cXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnlbMF1cXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ3novbTluqbph49cXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJyxcXCcxXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnlbMV1cXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwncmFkYXJcXCdcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+WIhuexu1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCdsZWdlbmRcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC5sZWdlbmRcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC55XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48aDIgbmctaWY9XFxcInNwZWMubWFyayA9PSBcXCdzaW5nbGVcXCdcXFwiPumAiemhuTwvaDI+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1tYXJrcy1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLWlmPVxcXCJzcGVjLm1hcmsgPT0gXFwnc2luZ2xlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lvaLlvI88L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48c2VsZWN0IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcudHlwZVxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwiY2FyZFxcXCI+5oyH5qCH5Y2hPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwibGlzdFxcXCI+5oyH5qCH5p2hPC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5bCP5pWw54K5PC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcub3B0aW9uLmZpeGVkXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLW1hcmtzLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctaWY9XFxcInNwZWMubWFyayA9PSBcXCdzaW5nbGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIiBuZy1zaG93PVxcXCJlY2NvbmZpZy50eXBlID09IFxcJ2NhcmRcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5aSW5qGG6aKc6ImyPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoIGNvbG9yLWlucHV0LXNpbmdsZVxcXCIgbmctYmx1cj1cXFwic2V0Q29sb3IoXFwnc3Ryb2tlXFwnKVxcXCIgcmVsPVxcXCJzdHJva2VcXFwiIG5nLW1vZGVsPVxcXCJzdHJva2VfY29sb3JcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIiBuZy1zaG93PVxcXCJlY2NvbmZpZy50eXBlID09IFxcJ2NhcmRcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+6IOM5pmv6aKc6ImyPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoIGNvbG9yLWlucHV0LXNpbmdsZVxcXCIgbmctYmx1cj1cXFwic2V0Q29sb3IoXFwnZmlsbFxcJylcXFwiIHJlbD1cXFwiZmlsbFxcXCIgbmctbW9kZWw9XFxcImZpbGxfY29sb3JcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuaVsOWAvOminOiJsjwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBjb2xvci1pbnB1dC1zaW5nbGVcXFwiIG5nLWJsdXI9XFxcInNldENvbG9yKFxcJ3ZhbHVlXFwnKVxcXCIgcmVsPVxcXCJ2YWx1ZVxcXCIgbmctbW9kZWw9XFxcInZhbHVlX2NvbG9yXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7mloflrZfpopzoibI8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggY29sb3ItaW5wdXQtc2luZ2xlXFxcIiBuZy1ibHVyPVxcXCJzZXRDb2xvcihcXCd0aXRsZVxcJylcXFwiIHJlbD1cXFwidGl0bGVcXFwiIG5nLW1vZGVsPVxcXCJ0aXRsZV9jb2xvclxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiY29tcG9uZW50cy90YWJzL3RhYi5odG1sXCIsXCI8ZGl2IG5nLWlmPVxcXCJhY3RpdmVcXFwiIG5nLXRyYW5zY2x1ZGU9XFxcIlxcXCI+PC9kaXY+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiY29tcG9uZW50cy90YWJzL3RhYnNldC5odG1sXCIsXCI8ZGl2IGNsYXNzPVxcXCJ0YWItY29udGFpbmVyXFxcIj48ZGl2PjxhIGNsYXNzPVxcXCJ0YWJcXFwiIG5nLXJlcGVhdD1cXFwidGFiIGluIHRhYnNldC50YWJzXFxcIiBuZy1jbGFzcz1cXFwie1xcJ2FjdGl2ZVxcJzogdGFiLmFjdGl2ZX1cXFwiIG5nLWNsaWNrPVxcXCJ0YWJzZXQuc2hvd1RhYih0YWIpXFxcIj57e3RhYi5oZWFkaW5nfX08L2E+PC9kaXY+PGRpdiBjbGFzcz1cXFwidGFiLWNvbnRlbnRzXFxcIiBuZy10cmFuc2NsdWRlPVxcXCJcXFwiPjwvZGl2PjwvZGl2PlwiKTt9XSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBmaWx0ZXJcclxuICogQG5hbWUgdmVnYS1saXRlLXVpLmZpbHRlcjppbkdyb3VwXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBpbkdyb3VwXHJcbiAqIEdldCBkYXRhc2V0cyBpbiBhIHBhcnRpY3VsYXIgZ3JvdXBcclxuICogQHBhcmFtICB7U3RyaW5nfSBkYXRhc2V0R3JvdXAgT25lIG9mIFwic2FtcGxlLFwiIFwidXNlclwiLCBvciBcIm15cmlhXCJcclxuICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIGRhdGFzZXRzIGluIHRoZSBzcGVjaWZpZWQgZ3JvdXBcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmlsdGVyKCdpbkdyb3VwJywgZnVuY3Rpb24oXykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyciwgZGF0YXNldEdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHtcclxuICAgICAgICBncm91cDogZGF0YXNldEdyb3VwXHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHZsdWkuZGlyZWN0aXZlOmNoYW5nZUxvYWRlZERhdGFzZXRcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgY2hhbmdlTG9hZGVkRGF0YXNldFxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5kaXJlY3RpdmUoJ2NoYW5nZUxvYWRlZERhdGFzZXQnLCBmdW5jdGlvbiAoRGF0YXNldCwgXykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdkYXRhc2V0L2NoYW5nZWxvYWRlZGRhdGFzZXQuaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHJlcXVpcmU6ICc/Xl5tb2RhbCcsXHJcbiAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgIHNjb3BlOiB0cnVlLFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1vZGFsQ29udHJvbGxlcikge1xyXG4gICAgICAgIC8vIElmIHRoaXMgZGlyZWN0aXZlIG9jY3VycyB3aXRoaW4gYSBhIG1vZGFsLCBnaXZlIG91cnNlbHZlcyBhIHdheSB0byBjbG9zZVxyXG4gICAgICAgIC8vIHRoYXQgbW9kYWwgb25jZSB0aGUgYWRkIGJ1dHRvbiBoYXMgYmVlbiBjbGlja2VkXHJcbiAgICAgICAgZnVuY3Rpb24gY2xvc2VNb2RhbCgpIHtcclxuICAgICAgICAgIGlmIChtb2RhbENvbnRyb2xsZXIpIHtcclxuICAgICAgICAgICAgbW9kYWxDb250cm9sbGVyLmNsb3NlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvc2UgZGF0YXNldCBvYmplY3QgaXRzZWxmIHNvIGN1cnJlbnQgZGF0YXNldCBjYW4gYmUgbWFya2VkXHJcbiAgICAgICAgc2NvcGUuRGF0YXNldCA9IERhdGFzZXQ7XHJcblxyXG4gICAgICAgIHNjb3BlLnVzZXJEYXRhID0gXy5maWx0ZXIoRGF0YXNldC5kYXRhc2V0cywgZnVuY3Rpb24oZGF0YXNldCkge1xyXG4gICAgICAgICAgcmV0dXJuIGRhdGFzZXQuZ3JvdXAgIT09ICdzYW1wbGUnO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzY29wZS5zYW1wbGVEYXRhID0gXy5maWx0ZXIoRGF0YXNldC5kYXRhc2V0cywge1xyXG4gICAgICAgICAgZ3JvdXA6ICdzYW1wbGUnXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBkYXRhc2V0V2F0Y2hlciA9IHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiBEYXRhc2V0LmRhdGFzZXRzLmxlbmd0aDtcclxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHNjb3BlLnVzZXJEYXRhID0gXy5maWx0ZXIoRGF0YXNldC5kYXRhc2V0cywgZnVuY3Rpb24oZGF0YXNldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YXNldC5ncm91cCAhPT0gJ3NhbXBsZSc7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2NvcGUuc2VsZWN0RGF0YXNldCA9IGZ1bmN0aW9uKGRhdGFzZXQpIHtcclxuICAgICAgICAgIC8vIEFjdGl2YXRlIHRoZSBzZWxlY3RlZCBkYXRhc2V0XHJcblxyXG4gICAgICAgICAgRGF0YXNldC51cGRhdGUoZGF0YXNldCk7XHJcbiAgICAgICAgICBjbG9zZU1vZGFsKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgLy8gQ2xlYW4gdXAgd2F0Y2hlcnNcclxuICAgICAgICAgIGRhdGFzZXRXYXRjaGVyKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxuICAuZmFjdG9yeSgnRGF0YXNldCcsIGZ1bmN0aW9uKCRodHRwLCAkcSwgXywgY3FsLCBTYW1wbGVEYXRhLCBDb25maWcsIExvZ2dlcikge1xuICAgIHZhciBEYXRhc2V0ID0ge307XG4gICAgLy8gU3RhcnQgd2l0aCB0aGUgbGlzdCBvZiBzYW1wbGUgZGF0YXNldHNcbiAgICB2YXIgZGF0YXNldHMgPSBTYW1wbGVEYXRhO1xuXG4gICAgRGF0YXNldC5kYXRhc2V0cyA9IGRhdGFzZXRzO1xuICAgIERhdGFzZXQuZGF0YXNldCA9IGRhdGFzZXRzWzBdO1xuICAgIERhdGFzZXQuY3VycmVudERhdGFzZXQgPSB1bmRlZmluZWQ7ICAvLyBkYXRhc2V0IGJlZm9yZSB1cGRhdGVcbiAgICBEYXRhc2V0LnN0YXRzID0ge307XG4gICAgRGF0YXNldC50eXBlID0gdW5kZWZpbmVkO1xuICAgIERhdGFzZXQubm9EYXRhID0gZmFsc2U7XG4gICAgRGF0YXNldC5sb2FkaW5nID0gZmFsc2U7XG4gICAgdmFyIHR5cGVPcmRlciA9IHtcbiAgICAgIG5vbWluYWw6IDAsXG4gICAgICBvcmRpbmFsOiAwLFxuICAgICAgZ2VvZ3JhcGhpYzogMixcbiAgICAgIHRlbXBvcmFsOiAzLFxuICAgICAgcXVhbnRpdGF0aXZlOiA0XG4gICAgfTtcblxuICAgIERhdGFzZXQuZmllbGRPcmRlckJ5ID0ge307XG5cbiAgICBEYXRhc2V0LmZpZWxkT3JkZXJCeS50eXBlID0gZnVuY3Rpb24oZmllbGREZWYpIHtcbiAgICAgIGlmIChmaWVsZERlZi5hZ2dyZWdhdGU9PT0nY291bnQnKSByZXR1cm4gNDtcbiAgICAgIHJldHVybiB0eXBlT3JkZXJbZmllbGREZWYudHlwZV07XG4gICAgfTtcblxuICAgIERhdGFzZXQuZmllbGRPcmRlckJ5LnR5cGVUaGVuTmFtZSA9IGZ1bmN0aW9uKGZpZWxkRGVmKSB7XG4gICAgICByZXR1cm4gRGF0YXNldC5maWVsZE9yZGVyQnkudHlwZShmaWVsZERlZikgKyAnXycgK1xuICAgICAgICAoZmllbGREZWYuYWdncmVnYXRlID09PSAnY291bnQnID8gJ34nIDogZmllbGREZWYuZmllbGQudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIC8vIH4gaXMgdGhlIGxhc3QgY2hhcmFjdGVyIGluIEFTQ0lJXG4gICAgfTtcblxuICAgIERhdGFzZXQuZmllbGRPcmRlckJ5Lm9yaWdpbmFsID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gMDsgLy8gbm8gc3dhcCB3aWxsIG9jY3VyXG4gICAgfTtcblxuICAgIERhdGFzZXQuZmllbGRPcmRlckJ5LmZpZWxkID0gZnVuY3Rpb24oZmllbGREZWYpIHtcbiAgICAgIHJldHVybiBmaWVsZERlZi5maWVsZDtcbiAgICB9O1xuXG4gICAgRGF0YXNldC5maWVsZE9yZGVyID0gRGF0YXNldC5maWVsZE9yZGVyQnkudHlwZVRoZW5OYW1lO1xuXG4gICAgLy8gdXBkYXRlIHRoZSBzY2hlbWEgYW5kIHN0YXRzXG4gICAgRGF0YXNldC5vblVwZGF0ZSA9IFtdO1xuXG4gICAgRGF0YXNldC51cGRhdGUgPSBmdW5jdGlvbihkYXRhc2V0KSB7XG4gICAgICBEYXRhc2V0LmRhdGEgPSBbXTtcbiAgICAgIERhdGFzZXQuY3VycmVudERhdGFzZXQubmFtZSA9IGRhdGFzZXQubmFtZTtcbiAgICAgIERhdGFzZXQubG9hZGluZyA9IHRydWU7XG4gICAgICB2YXIgdXBkYXRlUHJvbWlzZTtcblxuICAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKExvZ2dlci5hY3Rpb25zLkRBVEFTRVRfQ0hBTkdFLCBkYXRhc2V0Lm5hbWUpO1xuXG4gICAgICBpZiAoZGF0YXNldC52YWx1ZXMpIHtcbiAgICAgICAgdXBkYXRlUHJvbWlzZSA9ICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIC8vIGpzaGludCB1bnVzZWQ6ZmFsc2VcbiAgICAgICAgICBEYXRhc2V0LnR5cGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgdXBkYXRlRnJvbURhdGEoZGF0YXNldCwgZGF0YXNldC52YWx1ZXMpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cGRhdGVQcm9taXNlID0gJGh0dHAuZ2V0KGRhdGFzZXQudXJsLCB7Y2FjaGU6IHRydWV9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgXG4gICAgICAgICAgdmFyIGRhdGE7XG5cbiAgICAgICAgICAvLyBmaXJzdCBzZWUgd2hldGhlciB0aGUgZGF0YSBpcyBKU09OLCBvdGhlcndpc2UgdHJ5IHRvIHBhcnNlIENTVlxuICAgICAgICAgIGlmIChfLmlzT2JqZWN0KHJlc3BvbnNlLmRhdGEpKSB7XG4gICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgRGF0YXNldC50eXBlID0gJ2pzb24nO1xuICAgICAgICAgIH0gXG4gICAgICAgICAgLy8gZWxzZSB7XG4gICAgICAgICAgLy8gICBkYXRhID0gdXRpbC5yZWFkKHJlc3BvbnNlLmRhdGEsIHt0eXBlOiAnY3N2J30pO1xuICAgICAgICAgIC8vICAgRGF0YXNldC50eXBlID0gJ2Nzdic7XG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgdXBkYXRlRnJvbURhdGEoZGF0YXNldCwgZGF0YSk7XG4gICAgICAgICAgRGF0YXNldC5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBEYXRhc2V0Lm9uVXBkYXRlLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgdXBkYXRlUHJvbWlzZSA9IHVwZGF0ZVByb21pc2UudGhlbihsaXN0ZW5lcik7XG4gICAgICB9KTtcblxuICAgICAgLy8gQ29weSB0aGUgZGF0YXNldCBpbnRvIHRoZSBjb25maWcgc2VydmljZSBvbmNlIGl0IGlzIHJlYWR5XG4gICAgICB1cGRhdGVQcm9taXNlLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIENvbmZpZy51cGRhdGVEYXRhc2V0KGRhdGFzZXQsIERhdGFzZXQudHlwZSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHVwZGF0ZVByb21pc2U7XG4gICAgfTtcblxuICAgIC8vIGZ1bmN0aW9uIGdldEZpZWxkRGVmcyhzY2hlbWEsIG9yZGVyKSB7XG4gICAgLy8gICB2YXIgZmllbGREZWZzID0gc2NoZW1hLmZpZWxkcygpLm1hcChmdW5jdGlvbihmaWVsZCkge1xuICAgIC8vICAgICByZXR1cm4ge1xuICAgIC8vICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAvLyAgICAgICB0eXBlOiBzY2hlbWEudHlwZShmaWVsZCksXG4gICAgLy8gICAgICAgcHJpbWl0aXZlVHlwZTogc2NoZW1hLnByaW1pdGl2ZVR5cGUoZmllbGQpXG4gICAgLy8gICAgIH07XG4gICAgLy8gICB9KTtcblxuICAgIC8vICAgZmllbGREZWZzID0gdXRpbC5zdGFibGVzb3J0KGZpZWxkRGVmcywgb3JkZXIgfHwgRGF0YXNldC5maWVsZE9yZGVyQnkudHlwZVRoZW5OYW1lLCBEYXRhc2V0LmZpZWxkT3JkZXJCeS5maWVsZCk7XG5cbiAgICAvLyAgIGZpZWxkRGVmcy5wdXNoKHsgZmllbGQ6ICcqJywgdGl0bGU6ICdDb3VudCcgfSk7XG4gICAgLy8gICByZXR1cm4gZmllbGREZWZzO1xuICAgIC8vIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUZyb21EYXRhKGRhdGFzZXQsIGRhdGEpIHtcbiAgICAgIERhdGFzZXQuZGF0YSA9IGRhdGE7XG4gICAgICBEYXRhc2V0LmN1cnJlbnREYXRhc2V0ID0gZGF0YXNldDtcblxuICAgICAgRGF0YXNldC5zY2hlbWEgPSBjcWwuc2NoZW1hLlNjaGVtYS5idWlsZChkYXRhKTtcbiAgICAgIC8vIFRPRE86IGZpbmQgYWxsIHJlZmVyZW5jZSBvZiBEYXRhc2V0LnN0YXRzLnNhbXBsZSBhbmQgcmVwbGFjZVxuICAgIH1cblxuICAgIERhdGFzZXQuYnVpbGRTY2hlbWEgPSBmdW5jdGlvbigpe1xuICAgICAgRGF0YXNldC51cGRhdGUoRGF0YXNldC5kYXRhc2V0KTtcbiAgICB9O1xuXG4gICAgRGF0YXNldC5hZGQgPSBmdW5jdGlvbihkYXRhc2V0KSB7XG4gICAgICBpZiAoIWRhdGFzZXQuaWQpIHtcbiAgICAgICAgZGF0YXNldC5pZCA9IGRhdGFzZXQudXJsO1xuICAgICAgfVxuICAgICAgZGF0YXNldHMucHVzaChkYXRhc2V0KTtcblxuICAgICAgcmV0dXJuIGRhdGFzZXQ7XG4gICAgfTtcblxuICAgIHJldHVybiBEYXRhc2V0O1xuICB9KTtcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHZsdWkuZGlyZWN0aXZlOmRhdGFzZXRNb2RhbFxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBkYXRhc2V0TW9kYWxcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCdkYXRhc2V0TW9kYWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2RhdGFzZXQvZGF0YXNldG1vZGFsLmh0bWwnLFxyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZTogZmFsc2VcclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCdkYXRhc2V0U2VsZWN0b3InLCBmdW5jdGlvbihNb2RhbHMsIExvZ2dlcikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdkYXRhc2V0L2RhdGFzZXRzZWxlY3Rvci5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgc2NvcGU6IHt9LFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbiBwb3N0TGluayhzY29wZS8qLCBlbGVtZW50LCBhdHRycyovKSB7XHJcbiAgICAgICAgc2NvcGUubG9hZERhdGFzZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIExvZ2dlci5sb2dJbnRlcmFjdGlvbihMb2dnZXIuYWN0aW9ucy5EQVRBU0VUX09QRU4pO1xyXG4gICAgICAgICAgTW9kYWxzLm9wZW4oJ2RhdGFzZXQtbW9kYWwnKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpLmNvbnN0YW50KCdTYW1wbGVEYXRhJywgW3tcclxuICBuYW1lOiAnQmFybGV5JyxcclxuICBkZXNjcmlwdGlvbjogJ0JhcmxleSB5aWVsZCBieSB2YXJpZXR5IGFjcm9zcyB0aGUgdXBwZXIgbWlkd2VzdCBpbiAxOTMxIGFuZCAxOTMyJyxcclxuICB1cmw6ICcvZGF0YS9iYXJsZXkuanNvbicsXHJcbiAgaWQ6ICdiYXJsZXknLFxyXG4gIGdyb3VwOiAnc2FtcGxlJ1xyXG59LHtcclxuICBuYW1lOiAnQ2FycycsXHJcbiAgZGVzY3JpcHRpb246ICdBdXRvbW90aXZlIHN0YXRpc3RpY3MgZm9yIGEgdmFyaWV0eSBvZiBjYXIgbW9kZWxzIGJldHdlZW4gMTk3MCAmIDE5ODInLFxyXG4gIHVybDogJy9kYXRhL2NhcnMuanNvbicsXHJcbiAgaWQ6ICdjYXJzJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0NyaW1lYScsXHJcbiAgdXJsOiAnL2RhdGEvY3JpbWVhLmpzb24nLFxyXG4gIGlkOiAnY3JpbWVhJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0RyaXZpbmcnLFxyXG4gIHVybDogJy9kYXRhL2RyaXZpbmcuanNvbicsXHJcbiAgaWQ6ICdkcml2aW5nJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0lyaXMnLFxyXG4gIHVybDogJy9kYXRhL2lyaXMuanNvbicsXHJcbiAgaWQ6ICdpcmlzJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0pvYnMnLFxyXG4gIHVybDogJy9kYXRhL2pvYnMuanNvbicsXHJcbiAgaWQ6ICdqb2JzJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ1BvcHVsYXRpb24nLFxyXG4gIHVybDogJy9kYXRhL3BvcHVsYXRpb24uanNvbicsXHJcbiAgaWQ6ICdwb3B1bGF0aW9uJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ01vdmllcycsXHJcbiAgdXJsOiAnL2RhdGEvbW92aWVzLmpzb24nLFxyXG4gIGlkOiAnbW92aWVzJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0JpcmRzdHJpa2VzJyxcclxuICB1cmw6ICcvZGF0YS9iaXJkc3RyaWtlcy5qc29uJyxcclxuICBpZDogJ2JpcmRzdHJpa2VzJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0J1cnRpbicsXHJcbiAgdXJsOiAnL2RhdGEvYnVydGluLmpzb24nLFxyXG4gIGlkOiAnYnVydGluJyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0NhbXBhaWducycsXHJcbiAgdXJsOiAnL2RhdGEvd2ViYWxsMjYuanNvbicsXHJcbiAgaWQ6ICd3ZWJhbGwyNicsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn1dKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5kaXJlY3RpdmUoJ2VjQ2hhbm5lbCcsIFsnRHJvcCcsIGZ1bmN0aW9uIChEcm9wKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvZWNjaGFubmVsL2VjY2hhbm5lbC5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBtb2RhbDogJz0nLFxyXG4gICAgICAgIGZpZWxkOiAnPScsXHJcbiAgICAgICAgY2FuRHJhZzogJzwnLFxyXG4gICAgICAgIGNoYW5uZWxUaXRsZTogJzwnLFxyXG4gICAgICAgIHJlbW92ZUFjdGlvbjogJyYnLFxyXG4gICAgICAgIGNhbkRyb3A6ICc8JyxcclxuICAgICAgICBkcm9wVHlwZTogJzwnLFxyXG4gICAgICAgIG1vcmVEcmFnOiAnPCdcclxuXHJcbiAgICAgIH0sXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCAvKiwgYXR0cnMqLykge1xyXG4gICAgICAgIHNjb3BlLkZpZWxkRHJvcHBlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHNjb3BlLmZpZWxkID0gYW5ndWxhci5jb3B5KHNjb3BlLnRoaXNtb2RhbCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICBcclxuICAgICAgICBpZiAoZWxlbWVudC5maW5kKCcudHlwZS1jYXJldCcpLmxlbmd0aCA+IDAgJiYgZWxlbWVudC5maW5kKCcuZWNoYXJ0LXR5cGUnKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICB2YXIgdHlwZVBvcHVwID0gbmV3IERyb3Aoe1xyXG4gICAgICAgICAgICBjb250ZW50OiBlbGVtZW50LmZpbmQoJy5lY2hhcnQtdHlwZScpWzBdLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IGVsZW1lbnQuZmluZCgnLnR5cGUtY2FyZXQnKVswXSxcclxuICAgICAgICAgICAgcG9zaXRpb246ICd0b3AgbGVmdCcsXHJcbiAgICAgICAgICAgIG9wZW5PbjogJ2NsaWNrJ1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBpZiAoc2NvcGUuZHJvcFR5cGUgPT0gJ3R5cGUnICYmIHNjb3BlLmZpZWxkICYmIHNjb3BlLmZpZWxkLmNvbG9yKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLm1peF9jb2xvciA9IGFuZ3VsYXIuY29weShzY29wZS5maWVsZC5jb2xvcik7XHJcbiAgICAgICAgICAgIHR5cGVQb3B1cC5vbignb3BlbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAkKFwiLmRyb3AtY29udGVudCAuY29sb3ItaW5wdXRcIikuY29sb3JwaWNrZXIoeyBhbGlnbjogJ3JpZ2h0JyB9KS5vbignY2hhbmdlQ29sb3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5taXhfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChzY29wZS5kcm9wVHlwZSA9PSAnbWFwcG9pbnQnICYmIHNjb3BlLmZpZWxkICYmIHNjb3BlLmZpZWxkLmNvbG9yKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLnBvaW50X2NvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLmZpZWxkLmNvbG9yKTtcclxuICAgICAgICAgICAgc2NvcGUucG9pbnRfdG9wX2NvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLmZpZWxkLnRvcF9jb2xvcik7XHJcbiAgICAgICAgICAgIHR5cGVQb3B1cC5vbignb3BlbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAkKFwiLmRyb3AtY29udGVudCAucG9pbnQtY29sb3ItaW5wdXRcIikuY29sb3JwaWNrZXIoeyBhbGlnbjogJ3JpZ2h0JyB9KS5vbignY2hhbmdlQ29sb3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZigkKHRoaXMpLmF0dHIoJ3JlbCcpID09ICdub3JtYWwnKXtcclxuICAgICAgICAgICAgICAgICAgc2NvcGUucG9pbnRfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PSAndG9wJyl7XHJcbiAgICAgICAgICAgICAgICAgIHNjb3BlLnBvaW50X3RvcF9jb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NvcGUuc2V0TWl4Q29sb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBzY29wZS5maWVsZC5jb2xvciA9IGFuZ3VsYXIuY29weShzY29wZS5taXhfY29sb3IpO1xyXG4gICAgICAgICAgdHlwZVBvcHVwLm9wZW4oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzY29wZS5zZXRQb2ludENvbG9yID0gZnVuY3Rpb24gKHR5cGUpIHtcclxuICAgICAgICAgIGlmKHR5cGUgPT0gJ25vcm1hbCcpe1xyXG4gICAgICAgICAgICBzY29wZS5maWVsZC5jb2xvciA9IGFuZ3VsYXIuY29weShzY29wZS5wb2ludF9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZih0eXBlID09ICd0b3AnKXtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQudG9wX2NvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLnBvaW50X3RvcF9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0eXBlUG9wdXAub3BlbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnZmllbGQudHJ1ZXR5cGUnLCBmdW5jdGlvbiAobikge1xyXG4gICAgICAgICAgaWYgKCFzY29wZS5maWVsZCB8fCAhc2NvcGUuZmllbGQudHJ1ZXR5cGUgfHwgIXNjb3BlLmZpZWxkLnR5cGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKG4gPT09ICdhcmVhJykge1xyXG4gICAgICAgICAgICBzY29wZS5maWVsZC50eXBlID0gJ2xpbmUnO1xyXG4gICAgICAgICAgICBzY29wZS5maWVsZC5pc2FyZWEgPSAnMSc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQudHlwZSA9IG47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAobiAhPT0gJ2JhcicpIHtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQubGFiZWwubm9ybWFsLnBvc2l0aW9uID0gJ3RvcCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAodHlwZVBvcHVwICYmIHR5cGVQb3B1cC5kZXN0cm95KSB7XHJcbiAgICAgICAgICAgIHR5cGVQb3B1cC5kZXN0cm95KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfV0pOyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSB2bHVpLmRpcmVjdGl2ZTpmaWVsZEluZm9cbiAqIEBkZXNjcmlwdGlvblxuICogIyBmaWVsZEluZm9cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxuICAuZGlyZWN0aXZlKCdmaWVsZEluZm8nLCBmdW5jdGlvbiAoQU5ZLCBEcm9wLCBjcWwsIERhdGFzZXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL2ZpZWxkaW5mby9maWVsZGluZm8uaHRtbCcsXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIGZpZWxkRGVmOiAnPCcsXG4gICAgICAgIGZpbHRlckFjdGlvbjogJyYnLFxuICAgICAgICBzaG93QWRkOiAnPCcsXG4gICAgICAgIHNob3dDYXJldDogJzwnLFxuICAgICAgICBzaG93RmlsdGVyOiAnPScsXG4gICAgICAgIHNob3dSZW1vdmU6ICc8JyxcbiAgICAgICAgc2hvd1R5cGU6ICc8JyxcbiAgICAgICAgc2hvd0VudW1TcGVjRm46ICc8JyxcbiAgICAgICAgcG9wdXBDb250ZW50OiAnPCcsXG4gICAgICAgIGFjdGlvbjogJyYnLFxuICAgICAgICBhZGRBY3Rpb246ICcmJyxcbiAgICAgICAgcmVtb3ZlQWN0aW9uOiAnJicsXG4gICAgICAgIGRpc2FibGVDYXJldDogJzwnXG4gICAgICB9LFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGZ1bmNzUG9wdXA7XG5cbiAgICAgICAgLy8gUHJvcGVydGllcyB0aGF0IGFyZSBjcmVhdGVkIGJ5IGEgd2F0Y2hlciBsYXRlclxuICAgICAgICBzY29wZS50eXBlTmFtZSA9IG51bGw7XG4gICAgICAgIHNjb3BlLmljb24gPSBudWxsO1xuICAgICAgICBzY29wZS5udWxsID0gbnVsbDtcblxuICAgICAgICBzY29wZS5maWVsZFRpdGxlID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgICBpZiAoY3FsLmVudW1TcGVjLmlzRW51bVNwZWMoZmllbGQpKSB7XG4gICAgICAgICAgICByZXR1cm4gKGZpZWxkLmVudW0gfHwgWydXaWxkY2FyZCddKVxuICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkID09PSAnKicgPyAnQ09VTlQnIDogZmllbGQ7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJywnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNjb3BlLmZpZWxkQ291bnQgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICAgIGlmIChjcWwuZW51bVNwZWMuaXNFbnVtU3BlYyhmaWVsZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZC5lbnVtID8gJyAoJyArIGZpZWxkLmVudW0ubGVuZ3RoICsgJyknIDogJyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfTtcblxuICAgICAgICBzY29wZS5jbGlja2VkID0gZnVuY3Rpb24oJGV2ZW50KXtcbiAgICAgICAgICBpZihzY29wZS5hY3Rpb24gJiYgJGV2ZW50LnRhcmdldCAhPT0gZWxlbWVudC5maW5kKCcuZmEtY2FyZXQtZG93bicpWzBdICYmXG4gICAgICAgICAgICAkZXZlbnQudGFyZ2V0ICE9PSBlbGVtZW50LmZpbmQoJ3NwYW4udHlwZScpWzBdKSB7XG4gICAgICAgICAgICBzY29wZS5hY3Rpb24oJGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGlzRW51bVNwZWMgPSBjcWwuZW51bVNwZWMuaXNFbnVtU3BlYztcblxuICAgICAgICBzY29wZS5mdW5jID0gZnVuY3Rpb24oZmllbGREZWYpIHtcbiAgICAgICAgICBpZiAoZmllbGREZWYuYWdncmVnYXRlKSB7XG4gICAgICAgICAgICBpZiAoIWlzRW51bVNwZWMoZmllbGREZWYuYWdncmVnYXRlKSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmllbGREZWYuYWdncmVnYXRlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzY29wZS5zaG93RW51bVNwZWNGbikge1xuICAgICAgICAgICAgICByZXR1cm4gJz8nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZmllbGREZWYudGltZVVuaXQpIHtcbiAgICAgICAgICAgIGlmICghaXNFbnVtU3BlYyhmaWVsZERlZi50aW1lVW5pdCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkRGVmLnRpbWVVbml0O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzY29wZS5zaG93RW51bVNwZWNGbikge1xuICAgICAgICAgICAgICByZXR1cm4gJz8nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZmllbGREZWYuYmluKSB7XG4gICAgICAgICAgICBpZiAoIWlzRW51bVNwZWMoZmllbGREZWYuYmluKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Jpbic7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNjb3BlLnNob3dFbnVtU3BlY0ZuKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnPyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGZpZWxkRGVmLl9hZ2dyZWdhdGUgfHwgZmllbGREZWYuX3RpbWVVbml0IHx8XG4gICAgICAgICAgICAoZmllbGREZWYuX2JpbiAmJiAnYmluJykgfHwgKGZpZWxkRGVmLl9hbnkgJiYgJ2F1dG8nKSB8fCAnJztcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB2YXIgcG9wdXBDb250ZW50V2F0Y2hlciA9IHNjb3BlLiR3YXRjaCgncG9wdXBDb250ZW50JywgZnVuY3Rpb24ocG9wdXBDb250ZW50KSB7XG4gICAgICAgIC8vICAgaWYgKCFwb3B1cENvbnRlbnQpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8gICBpZiAoZnVuY3NQb3B1cCkge1xuICAgICAgICAvLyAgICAgZnVuY3NQb3B1cC5kZXN0cm95KCk7XG4gICAgICAgIC8vICAgfVxuXG4gICAgICAgIC8vICAgZnVuY3NQb3B1cCA9IG5ldyBEcm9wKHtcbiAgICAgICAgLy8gICAgIGNvbnRlbnQ6IHBvcHVwQ29udGVudCxcbiAgICAgICAgLy8gICAgIHRhcmdldDogZWxlbWVudC5maW5kKCcudHlwZS1jYXJldCcpWzBdLFxuICAgICAgICAvLyAgICAgcG9zaXRpb246ICdib3R0b20gbGVmdCcsXG4gICAgICAgIC8vICAgICBvcGVuT246ICdjbGljaydcbiAgICAgICAgLy8gICB9KTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgdmFyIFRZUEVfTkFNRVMgPSB7XG4gICAgICAgICAgbm9taW5hbDogJ3RleHQnLFxuICAgICAgICAgIG9yZGluYWw6ICd0ZXh0LW9yZGluYWwnLFxuICAgICAgICAgIHF1YW50aXRhdGl2ZTogJ251bWJlcicsXG4gICAgICAgICAgdGVtcG9yYWw6ICd0aW1lJyxcbiAgICAgICAgICBnZW9ncmFwaGljOiAnZ2VvJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBUWVBFX0lDT05TID0ge1xuICAgICAgICAgIG5vbWluYWw6ICdmYS1mb250JyxcbiAgICAgICAgICBvcmRpbmFsOiAnZmEtZm9udCcsXG4gICAgICAgICAgcXVhbnRpdGF0aXZlOiAnaWNvbi1oYXNoJyxcbiAgICAgICAgICB0ZW1wb3JhbDogJ2ZhLWNhbGVuZGFyJyxcbiAgICAgICAgfTtcbiAgICAgICAgVFlQRV9JQ09OU1tBTlldID0gJ2ZhLWFzdGVyaXNrJzsgLy8gc2VwYXJhdGUgbGluZSBiZWNhdXNlIHdlIG1pZ2h0IGNoYW5nZSB3aGF0J3MgdGhlIHN0cmluZyBmb3IgQU5ZXG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0VHlwZURpY3RWYWx1ZSh0eXBlLCBkaWN0KSB7XG4gICAgICAgICAgaWYgKGNxbC5lbnVtU3BlYy5pc0VudW1TcGVjKHR5cGUpKSB7IC8vIGlzIGVudW1TcGVjXG4gICAgICAgICAgICBpZiAoIXR5cGUuZW51bSkge1xuICAgICAgICAgICAgICByZXR1cm4gQU5ZOyAvLyBlbnVtIHNwZWMgd2l0aG91dCBzcGVjaWZpYyB2YWx1ZXNcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbCA9IG51bGw7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGUuZW51bS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICB2YXIgX3R5cGUgPSB0eXBlLmVudW1baV07XG4gICAgICAgICAgICAgIHZhciB2ID0gZGljdCA/IGRpY3RbX3R5cGVdIDogX3R5cGU7XG4gICAgICAgICAgICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSB2O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh2YWwgIT09IHYpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBBTlk7IC8vIElmIHRoZXJlIGFyZSBtYW55IGNvbmZsaWN0aW5nIHR5cGVzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGljdCA/IGRpY3RbdHlwZV0gOiB0eXBlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpZWxkRGVmV2F0Y2hlciA9IHNjb3BlLiR3YXRjaCgnZmllbGREZWYudHlwZScsIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICBzY29wZS5pY29uID0gZ2V0VHlwZURpY3RWYWx1ZSh0eXBlLCBUWVBFX0lDT05TKTtcbiAgICAgICAgICB2YXIgdHlwZU5hbWUgPSB0eXBlO1xuICAgICAgICAgIGlmICh0eXBlTmFtZSA9PT0gJ29yZGluYWwnIHx8IHR5cGVOYW1lID09PSAnbm9taW5hbCcpIHtcbiAgICAgICAgICAgIHR5cGVOYW1lICs9ICgnICgnICsgRGF0YXNldC5zY2hlbWEucHJpbWl0aXZlVHlwZShzY29wZS5maWVsZERlZi5maWVsZCkgKyAnKScpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSAmJiB0eXBlLmVudW0pIHtcbiAgICAgICAgICAgIHR5cGVOYW1lID0gdHlwZS5lbnVtWzBdOyAvLyBGSVhNRSBqb2luIHRoZW0gaWYgd2Ugc3VwcG9ydCBtYW55IHR5cGVzXG4gICAgICAgICAgfVxuICAgICAgICAgIHNjb3BlLnR5cGVOYW1lID0gdHlwZU5hbWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoZnVuY3NQb3B1cCAmJiBmdW5jc1BvcHVwLmRlc3Ryb3kpIHtcbiAgICAgICAgICAgIGZ1bmNzUG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHVucmVnaXN0ZXIgd2F0Y2hlcnNcbiAgICAgICAgICAvLyBwb3B1cENvbnRlbnRXYXRjaGVyKCk7XG4gICAgICAgICAgZmllbGREZWZXYXRjaGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgdmx1aS5kaXJlY3RpdmU6bW9kYWxcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgbW9kYWxcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCdtb2RhbCcsIGZ1bmN0aW9uICgkZG9jdW1lbnQsIE1vZGFscykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL21vZGFsL21vZGFsLmh0bWwnLFxyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGF1dG9PcGVuOiAnPCcsXHJcbiAgICAgICAgbWF4V2lkdGg6ICdAJ1xyXG4gICAgICB9LFxyXG4gICAgICAvLyBQcm92aWRlIGFuIGludGVyZmFjZSBmb3IgY2hpbGQgZGlyZWN0aXZlcyB0byBjbG9zZSB0aGlzIG1vZGFsXHJcbiAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSkge1xyXG4gICAgICAgIHRoaXMuY2xvc2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICB2YXIgbW9kYWxJZCA9IGF0dHJzLmlkO1xyXG5cclxuICAgICAgICBpZiAoc2NvcGUubWF4V2lkdGgpIHtcclxuICAgICAgICAgIHNjb3BlLndyYXBwZXJTdHlsZSA9ICdtYXgtd2lkdGg6JyArIHNjb3BlLm1heFdpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGVmYXVsdCB0byBjbG9zZWQgdW5sZXNzIGF1dG9PcGVuIGlzIHNldFxyXG4gICAgICAgIHNjb3BlLmlzT3BlbiA9IHNjb3BlLmF1dG9PcGVuO1xyXG5cclxuICAgICAgICAvLyBjbG9zZSBvbiBlc2NcclxuICAgICAgICBmdW5jdGlvbiBlc2NhcGUoZSkge1xyXG4gICAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMjcgJiYgc2NvcGUuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzY29wZS4kZGlnZXN0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJGRvY3VtZW50KS5vbigna2V5ZG93bicsIGVzY2FwZSk7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIHRoaXMgbW9kYWwgd2l0aCB0aGUgc2VydmljZVxyXG4gICAgICAgIE1vZGFscy5yZWdpc3Rlcihtb2RhbElkLCBzY29wZSk7XHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgTW9kYWxzLmRlcmVnaXN0ZXIobW9kYWxJZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHZsdWkuZGlyZWN0aXZlOm1vZGFsQ2xvc2VCdXR0b25cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgbW9kYWxDbG9zZUJ1dHRvblxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5kaXJlY3RpdmUoJ21vZGFsQ2xvc2VCdXR0b24nLCBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy9tb2RhbC9tb2RhbGNsb3NlYnV0dG9uLmh0bWwnLFxyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICByZXF1aXJlOiAnXl5tb2RhbCcsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgY2xvc2VBY3Rpb246ICcmJ1xyXG4gICAgICB9LFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG1vZGFsQ29udHJvbGxlcikge1xyXG4gICAgICAgIHNjb3BlLmNsb3NlTW9kYWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIG1vZGFsQ29udHJvbGxlci5jbG9zZSgpO1xyXG4gICAgICAgICAgaWYgKHNjb3BlLmNsb3NlQWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmNsb3NlQWN0aW9uKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBzZXJ2aWNlXHJcbiAqIEBuYW1lIHZsdWkuTW9kYWxzXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAjIE1vZGFsc1xyXG4gKiBTZXJ2aWNlIHVzZWQgdG8gY29udHJvbCBtb2RhbCB2aXNpYmlsaXR5IGZyb20gYW55d2hlcmUgaW4gdGhlIGFwcGxpY2F0aW9uXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmZhY3RvcnkoJ01vZGFscycsIGZ1bmN0aW9uICgkY2FjaGVGYWN0b3J5KSB7XHJcblxyXG4gICAgLy8gVE9ETzogVGhlIHVzZSBvZiBzY29wZSBoZXJlIGFzIHRoZSBtZXRob2QgYnkgd2hpY2ggYSBtb2RhbCBkaXJlY3RpdmVcclxuICAgIC8vIGlzIHJlZ2lzdGVyZWQgYW5kIGNvbnRyb2xsZWQgbWF5IG5lZWQgdG8gY2hhbmdlIHRvIHN1cHBvcnQgcmV0cmlldmluZ1xyXG4gICAgLy8gZGF0YSBmcm9tIGEgbW9kYWwgYXMgbWF5IGJlIG5lZWRlZCBpbiAjNzdcclxuICAgIHZhciBtb2RhbHNDYWNoZSA9ICRjYWNoZUZhY3RvcnkoJ21vZGFscycpO1xyXG5cclxuICAgIC8vIFB1YmxpYyBBUElcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihpZCwgc2NvcGUpIHtcclxuICAgICAgICBpZiAobW9kYWxzQ2FjaGUuZ2V0KGlkKSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ2Fubm90IHJlZ2lzdGVyIHR3byBtb2RhbHMgd2l0aCBpZCAnICsgaWQpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RhbHNDYWNoZS5wdXQoaWQsIHNjb3BlKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGRlcmVnaXN0ZXI6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgbW9kYWxzQ2FjaGUucmVtb3ZlKGlkKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIE9wZW4gYSBtb2RhbFxyXG4gICAgICBvcGVuOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHZhciBtb2RhbFNjb3BlID0gbW9kYWxzQ2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICBpZiAoIW1vZGFsU2NvcGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VucmVnaXN0ZXJlZCBtb2RhbCBpZCAnICsgaWQpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RhbFNjb3BlLmlzT3BlbiA9IHRydWU7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBDbG9zZSBhIG1vZGFsXHJcbiAgICAgIGNsb3NlOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIHZhciBtb2RhbFNjb3BlID0gbW9kYWxzQ2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICBpZiAoIW1vZGFsU2NvcGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VucmVnaXN0ZXJlZCBtb2RhbCBpZCAnICsgaWQpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RhbFNjb3BlLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIG1vZGFsc0NhY2hlLnJlbW92ZUFsbCgpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgY291bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBtb2RhbHNDYWNoZS5pbmZvKCkuc2l6ZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5kaXJlY3RpdmUoJ3NjaGVtYUxpc3QnLCBmdW5jdGlvbihjcWwsIExvZ2dlciwgUGlsbHMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy9zY2hlbWFsaXN0L3NjaGVtYWxpc3QuaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgb3JkZXJCeTogJzwnLFxyXG4gICAgICAgIGZpZWxkRGVmczogJzwnLFxyXG4gICAgICAgIGZpbHRlck1hbmFnZXI6ICc9JyxcclxuICAgICAgICBzaG93QWRkOiAnPCcsXHJcbiAgICAgICAgc2hvd0NvdW50OiAnPCcsXHJcbiAgICAgICAgc2hvd0Ryb3A6ICc8J1xyXG4gICAgICB9LFxyXG4gICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSkge1xyXG4gICAgICAgIHNjb3BlLlBpbGxzID0gUGlsbHM7XHJcbiAgICAgICAgc2NvcGUuaXNFbnVtU3BlYyA9IGNxbC5lbnVtU3BlYy5pc0VudW1TcGVjO1xyXG5cclxuICAgICAgICBzY29wZS5kcm9wcGVkRmllbGREZWYgPSB7fTtcclxuICAgICAgICBzY29wZS5jb3VudEZpZWxkRGVmID0gUGlsbHMuY291bnRGaWVsZERlZjtcclxuXHJcbiAgICAgICAgc2NvcGUuZmllbGREcm9wcGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBMb2dnZXIubG9nSW50ZXJhY3Rpb24oTG9nZ2VyLmFjdGlvbnMuQUREX1dJTERDQVJELCBzY29wZS5kcm9wcGVkRmllbGREZWYpO1xyXG4gICAgICAgICAgUGlsbHMuYWRkV2lsZGNhcmQoc2NvcGUuZHJvcHBlZEZpZWxkRGVmKTtcclxuICAgICAgICAgIHNjb3BlLmRyb3BwZWRGaWVsZERlZiA9IHt9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHBvbGVzdGFyLmRpcmVjdGl2ZTpzY2hlbWFMaXN0SXRlbVxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBzY2hlbWFMaXN0SXRlbVxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5kaXJlY3RpdmUoJ3NjaGVtYUxpc3RJdGVtJywgZnVuY3Rpb24gKERhdGFzZXQsIERyb3AsIExvZ2dlciwgUGlsbHMsIGNxbCwgY29uc3RzKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvc2NoZW1hbGlzdC9zY2hlbWFsaXN0aXRlbS5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVwbGFjZTogZmFsc2UsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgZmllbGREZWY6ICc9JywgLy8gVHdvLXdheVxyXG4gICAgICAgIHNob3dBZGQ6ICc8JyxcclxuICAgICAgICBmaWx0ZXJNYW5hZ2VyOiAnPSdcclxuICAgICAgfSxcclxuICAgICAgbGluazogZnVuY3Rpb24gcG9zdExpbmsoc2NvcGUsIGVsZW1lbnQpIHtcclxuICAgICAgICBzY29wZS5EYXRhc2V0ID0gRGF0YXNldDtcclxuICAgICAgICBzY29wZS5jb25zdHMgPSBjb25zdHM7XHJcbiAgICAgICAgc2NvcGUuY291bnRGaWVsZERlZiA9IFBpbGxzLmNvdW50RmllbGREZWY7XHJcblxyXG4gICAgICAgIHNjb3BlLmlzQW55RmllbGQgPSBmYWxzZTtcclxuICAgICAgICBzY29wZS5kcm9wcGVkRmllbGREZWYgPSBudWxsO1xyXG4gICAgICAgIHNjb3BlLmZpZWxkSW5mb1BvcHVwQ29udGVudCA9IGVsZW1lbnQuZmluZCgnLnNjaGVtYS1tZW51JylbMF07XHJcblxyXG4gICAgICAgIHNjb3BlLmlzRW51bVNwZWMgPSBjcWwuZW51bVNwZWMuaXNFbnVtU3BlYztcclxuXHJcbiAgICAgICAgc2NvcGUuZmllbGRBZGQgPSBmdW5jdGlvbiAoZmllbGREZWYpIHtcclxuICAgICAgICAgIFBpbGxzLmFkZChmaWVsZERlZik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUudG9nZ2xlRmlsdGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCFzY29wZS5maWx0ZXJNYW5hZ2VyKSByZXR1cm47XHJcbiAgICAgICAgICBzY29wZS5maWx0ZXJNYW5hZ2VyLnRvZ2dsZShzY29wZS5maWVsZERlZi5maWVsZCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUuZmllbGREcmFnU3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgZmllbGREZWYgPSBzY29wZS5maWVsZERlZjtcclxuXHJcbiAgICAgICAgICBzY29wZS5waWxsID0ge1xyXG4gICAgICAgICAgICBmaWVsZDogZmllbGREZWYuZmllbGQsXHJcbiAgICAgICAgICAgIHRpdGxlOiBmaWVsZERlZi50aXRsZSxcclxuICAgICAgICAgICAgdHlwZTogZmllbGREZWYudHlwZSxcclxuICAgICAgICAgICAgYWdncmVnYXRlOiBmaWVsZERlZi5hZ2dyZWdhdGVcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBQaWxscy5kcmFnU3RhcnQoc2NvcGUucGlsbCwgbnVsbCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUuZmllbGREcmFnU3RvcCA9IFBpbGxzLmRyYWdTdG9wO1xyXG5cclxuICAgICAgICBzY29wZS5maWVsZERyb3BwZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBQaWxscy5hZGRXaWxkY2FyZEZpZWxkKHNjb3BlLmZpZWxkRGVmLCBzY29wZS5kcm9wcGVkRmllbGREZWYpO1xyXG4gICAgICAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKExvZ2dlci5hY3Rpb25zLkFERF9XSUxEQ0FSRF9GSUVMRCwgc2NvcGUuZmllbGREZWYsIHtcclxuICAgICAgICAgICAgYWRkZWRGaWVsZDogc2NvcGUuZHJvcHBlZEZpZWxkRGVmXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHNjb3BlLmRyb3BwZWRGaWVsZERlZiA9IG51bGw7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUucmVtb3ZlV2lsZGNhcmRGaWVsZCA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgICAgdmFyIGZpZWxkID0gc2NvcGUuZmllbGREZWYuZmllbGQ7XHJcbiAgICAgICAgICBMb2dnZXIubG9nSW50ZXJhY3Rpb24oTG9nZ2VyLmFjdGlvbnMuUkVNT1ZFX1dJTERDQVJEX0ZJRUxELCBzY29wZS5maWVsZERlZiwge1xyXG4gICAgICAgICAgICByZW1vdmVkRmllbGQ6IGZpZWxkLmVudW1baW5kZXhdID09PSAnKicgPyAnQ09VTlQnIDogZmllbGQuZW51bVtpbmRleF1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgUGlsbHMucmVtb3ZlV2lsZGNhcmRGaWVsZChzY29wZS5maWVsZERlZiwgaW5kZXgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLnJlbW92ZVdpbGRjYXJkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKExvZ2dlci5hY3Rpb25zLlJFTU9WRV9XSUxEQ0FSRCwgc2NvcGUuZmllbGREZWYpO1xyXG4gICAgICAgICAgUGlsbHMucmVtb3ZlV2lsZGNhcmQoc2NvcGUuZmllbGREZWYpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFRPRE8oaHR0cHM6Ly9naXRodWIuY29tL3ZlZ2EvdmVnYS1saXRlLXVpL2lzc3Vlcy8xODcpOlxyXG4gICAgICAgIC8vIGNvbnNpZGVyIGlmIHdlIGNhbiB1c2UgdmFsaWRhdG9yIC8gY3FsIGluc3RlYWRcclxuICAgICAgICB2YXIgdGhpc1R5cGUgPSB7XHJcbiAgICAgICAgICBcIlR5cGVcIjoge1xyXG4gICAgICAgICAgICBcIlFVQU5USVRBVElWRVwiOiBcInF1YW50aXRhdGl2ZVwiLFxyXG4gICAgICAgICAgICBcInF1YW50aXRhdGl2ZVwiOiBcIlFVQU5USVRBVElWRVwiLFxyXG4gICAgICAgICAgICBcIk9SRElOQUxcIjogXCJvcmRpbmFsXCIsXHJcbiAgICAgICAgICAgIFwib3JkaW5hbFwiOiBcIk9SRElOQUxcIixcclxuICAgICAgICAgICAgXCJURU1QT1JBTFwiOiBcInRlbXBvcmFsXCIsXHJcbiAgICAgICAgICAgIFwidGVtcG9yYWxcIjogXCJURU1QT1JBTFwiLFxyXG4gICAgICAgICAgICBcIk5PTUlOQUxcIjogXCJub21pbmFsXCIsXHJcbiAgICAgICAgICAgIFwibm9taW5hbFwiOiBcIk5PTUlOQUxcIlxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiUVVBTlRJVEFUSVZFXCI6IFwicXVhbnRpdGF0aXZlXCIsXHJcbiAgICAgICAgICBcIk9SRElOQUxcIjogXCJvcmRpbmFsXCIsXHJcbiAgICAgICAgICBcIlRFTVBPUkFMXCI6IFwidGVtcG9yYWxcIixcclxuICAgICAgICAgIFwiTk9NSU5BTFwiOiBcIm5vbWluYWxcIixcclxuICAgICAgICAgIFwiU0hPUlRfVFlQRVwiOiB7XHJcbiAgICAgICAgICAgIFwicXVhbnRpdGF0aXZlXCI6IFwiUVwiLFxyXG4gICAgICAgICAgICBcInRlbXBvcmFsXCI6IFwiVFwiLFxyXG4gICAgICAgICAgICBcIm5vbWluYWxcIjogXCJOXCIsXHJcbiAgICAgICAgICAgIFwib3JkaW5hbFwiOiBcIk9cIlxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiVFlQRV9GUk9NX1NIT1JUX1RZUEVcIjoge1xyXG4gICAgICAgICAgICBcIlFcIjogXCJxdWFudGl0YXRpdmVcIixcclxuICAgICAgICAgICAgXCJUXCI6IFwidGVtcG9yYWxcIixcclxuICAgICAgICAgICAgXCJPXCI6IFwib3JkaW5hbFwiLFxyXG4gICAgICAgICAgICBcIk5cIjogXCJub21pbmFsXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBhbGxvd2VkQ2FzdGluZyA9IHtcclxuICAgICAgICAgIGludGVnZXI6IFt0aGlzVHlwZS5RVUFOVElUQVRJVkUsIHRoaXNUeXBlLk9SRElOQUwsIHRoaXNUeXBlLk5PTUlOQUxdLFxyXG4gICAgICAgICAgbnVtYmVyOiBbdGhpc1R5cGUuUVVBTlRJVEFUSVZFLCB0aGlzVHlwZS5PUkRJTkFMLCB0aGlzVHlwZS5OT01JTkFMXSxcclxuICAgICAgICAgIGRhdGU6IFt0aGlzVHlwZS5URU1QT1JBTF0sXHJcbiAgICAgICAgICBzdHJpbmc6IFt0aGlzVHlwZS5OT01JTkFMXSxcclxuICAgICAgICAgIGJvb2xlYW46IFt0aGlzVHlwZS5OT01JTkFMXSxcclxuICAgICAgICAgIGFsbDogW3RoaXNUeXBlLlFVQU5USVRBVElWRSwgdGhpc1R5cGUuVEVNUE9SQUwsIHRoaXNUeXBlLk9SRElOQUwsIHRoaXNUeXBlLk5PTUlOQUxdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHVud2F0Y2hGaWVsZERlZiA9IHNjb3BlLiR3YXRjaCgnZmllbGREZWYnLCBmdW5jdGlvbiAoZmllbGREZWYpIHtcclxuICAgICAgICAgIGlmIChjcWwuZW51bVNwZWMuaXNFbnVtU3BlYyhmaWVsZERlZi5maWVsZCkpIHtcclxuICAgICAgICAgICAgc2NvcGUuYWxsb3dlZFR5cGVzID0gYWxsb3dlZENhc3RpbmcuYWxsO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2NvcGUuYWxsb3dlZFR5cGVzID0gYWxsb3dlZENhc3RpbmdbZmllbGREZWYucHJpbWl0aXZlVHlwZV07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgc2NvcGUuaXNBbnlGaWVsZCA9IGNxbC5lbnVtU3BlYy5pc0VudW1TcGVjKGZpZWxkRGVmLmZpZWxkKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2NvcGUuZmllbGRUaXRsZSA9IGZ1bmN0aW9uIChmaWVsZCkge1xyXG4gICAgICAgICAgaWYgKGNxbC5lbnVtU3BlYy5pc0VudW1TcGVjKGZpZWxkKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gKGZpZWxkLmVudW0gfHwgWydXaWxkY2FyZCddKVxyXG4gICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQgPT09ICcqJyA/ICdDT1VOVCcgOiBmaWVsZDtcclxuICAgICAgICAgICAgICB9KS5qb2luKCcsJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gZmllbGQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHNjb3BlLmZpZWxkQWRkID0gbnVsbDtcclxuICAgICAgICAgIHNjb3BlLmZpZWxkRHJhZ1N0b3AgPSBudWxsO1xyXG4gICAgICAgICAgc2NvcGUuaXNFbnVtU3BlYyA9IG51bGw7XHJcblxyXG4gICAgICAgICAgdW53YXRjaEZpZWxkRGVmKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCdzaGVsdmVzJywgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy9zaGVsdmVzL3NoZWx2ZXMuaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgc3BlYzogJz0nLFxyXG4gICAgICAgIHByZXZpZXc6ICc8JyxcclxuICAgICAgICBzdXBwb3J0QW55OiAnPCcsXHJcbiAgICAgICAgc3VwcG9ydEF1dG9NYXJrOiAnPCcsXHJcbiAgICAgICAgZmlsdGVyTWFuYWdlcjogJz0nLFxyXG4gICAgICAgIGNocm9uOiAnPCcsXHJcbiAgICAgICAgZWNjb25maWc6Jz0nXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkdGltZW91dCwgQU5ZLCBDb25maWcsIERhdGFzZXQsIExvZ2dlciwgUGlsbHMpIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLkFOWSA9IEFOWTtcclxuICAgICAgICAkc2NvcGUuYW55Q2hhbm5lbElkcyA9IFtdO1xyXG4gICAgICAgICRzY29wZS5EYXRhc2V0ID0gRGF0YXNldDtcclxuICAgICAgICAkc2NvcGUuZnJlc2hNb2RlbCA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgJHNjb3BlLm1pbiA9IDA7XHJcbiAgICAgICAgJHNjb3BlLm1heCA9IDEwMDtcclxuICAgICAgICAvLyAkc2NvcGUubWFya3MgPSBbJ3BvaW50JywgJ3RpY2snLCAnYmFyJywgJ2xpbmUnLCAnYXJlYScsICd0ZXh0J107XHJcbiAgICAgICAgJHNjb3BlLm1hcmtzID0gWydwaWUnLCAnZ2F1Z2UnLCAnYm1hcCcsJ21peGVkJywnc2NhdHRlcicsJ3JhZGFyJywnc2luZ2xlJywgJ2Z1bm5lbCddO1xyXG4gICAgICAgICRzY29wZS5lY2hhcnR0aGVtZWxpc3QgPSBbeyB2OiAnaW5mb2dyYXBoaWMnLCB0OiAn5qC35byP5LiAJyB9LCB7IHY6ICdtYWNhcm9ucycsIHQ6ICfmoLflvI/kuownIH0sIHsgdjogJ3NoaW5lJywgdDogJ+agt+W8j+S4iScgfSwgeyB2OiAnZGFyaycsIHQ6ICfmoLflvI/lm5snIH0sIHsgdjogJ3JvbWEnLCB0OiAn5qC35byP5LqUJyB9XTtcclxuICAgICAgXHJcbiAgICAgICAgJHNjb3BlLm1hcmtzaWNvbiA9IHtcclxuICAgICAgICAgIFwicGllXCI6IHtcclxuICAgICAgICAgICAgaWNvbjogJ2ZhLXBpZS1jaGFydCcsXHJcbiAgICAgICAgICAgIHRpdGxlOiAn6aW854q25Zu+J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiZ2F1Z2VcIjoge1xyXG4gICAgICAgICAgICBpY29uOiAnZmEtdGFjaG9tZXRlcicsXHJcbiAgICAgICAgICAgIHRpdGxlOiAn5Luq6KGo55uYJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiYm1hcFwiOiB7XHJcbiAgICAgICAgICAgIGljb246ICdmYS1sb2NhdGlvbi1hcnJvdycsXHJcbiAgICAgICAgICAgIHRpdGxlOiAn5Zyw5Zu+J1xyXG4gICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICBcIm1peGVkXCI6e1xyXG4gICAgICAgICAgICBpY29uOidmYS10YWNob21ldGVyJyxcclxuICAgICAgICAgICAgdGl0bGU6J+a3t+WQiCdcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcInNjYXR0ZXJcIjp7XHJcbiAgICAgICAgICAgIGljb246J2ZhLXRhY2hvbWV0ZXInLFxyXG4gICAgICAgICAgICB0aXRsZTon5pWj54K5J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwicmFkYXJcIjp7XHJcbiAgICAgICAgICAgIGljb246J2ZhLXRhY2hvbWV0ZXInLFxyXG4gICAgICAgICAgICB0aXRsZTon6Zu36L6+5Zu+J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwic2luZ2xlXCI6e1xyXG4gICAgICAgICAgICBpY29uOidmYS10YWNob21ldGVyJyxcclxuICAgICAgICAgICAgdGl0bGU6J+WNleaMh+aghydcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcImZ1bm5lbFwiOntcclxuICAgICAgICAgICAgaWNvbjonZmEtdGFjaG9tZXRlcicsXHJcbiAgICAgICAgICAgIHRpdGxlOifmvI/mlpflm74nXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUuaWZlY2hhcnQgPSBmYWxzZTtcclxuICAgICAgICAkc2NvcGUudGFiID0gJ3RhYjEnO1xyXG4gICAgICAgICRzY29wZS5lY2hhcnRTaGFwZSA9IFsncGllJywgJ2dhdWdlJywgJ2JtYXAnLCdtaXhlZCcsJ3NjYXR0ZXInLCdyYWRhcicsJ3NpbmdsZScsJ2Z1bm5lbCddO1xyXG5cclxuICAgICAgICAvLyAkc2NvcGUubWFya3NpY29uW0FOWV0gPSB7XHJcbiAgICAgICAgLy8gICBpY29uOiAnZmEtYnVsbHNleWUnLFxyXG4gICAgICAgIC8vICAgdGl0bGU6ICfoh6rliqgnXHJcbiAgICAgICAgLy8gfTtcclxuICAgICAgICAkc2NvcGUuc2hvd21hcmt0eXBlID0gZmFsc2U7XHJcbiAgICAgICAgJHNjb3BlLmNoYW5nZXR5cGUgPSBmdW5jdGlvbiAobWFyaykge1xyXG4gICAgICAgICAgJHNjb3BlLnNwZWMubWFyayA9IG1hcms7XHJcbiAgICAgICAgICAkc2NvcGUubWFya2RldGFpbCA9ICRzY29wZS5tYXJrc2ljb25bbWFya107XHJcbiAgICAgICAgICAkc2NvcGUuc2hvd21hcmt0eXBlID0gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUuc3BlYy5tYXJrID0gJ3BpZSc7XHJcbiAgICAgICAgJHNjb3BlLm1hcmtkZXRhaWwgPSAkc2NvcGUubWFya3NpY29uWydwaWUnXTtcclxuICAgICAgICAkc2NvcGUubWFya3NXaXRoQW55ID0gJHNjb3BlLm1hcmtzO1xyXG5cclxuICAgICAgICAkc2NvcGUubWFya0NoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIExvZ2dlci5sb2dJbnRlcmFjdGlvbihMb2dnZXIuYWN0aW9ucy5NQVJLX0NIQU5HRSwgJHNjb3BlLnNwZWMubWFyayk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgIFxyXG4gICAgICAgICRzY29wZS5zZXRUYWIgPSBmdW5jdGlvbih0YWIpe1xyXG4gICAgICAgICAgJHNjb3BlLnRhYiA9IHRhYjtcclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIExvZ2dlci5sb2dJbnRlcmFjdGlvbihMb2dnZXIuYWN0aW9ucy5TUEVDX0NMRUFOLCAkc2NvcGUuc3BlYyk7XHJcbiAgICAgICAgICBQaWxscy5yZXNldCgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ2VjY29uZmlnLnRpdGxlJyxmdW5jdGlvbih2YWwpe1xyXG4gICAgICAgICAgaWYoJHNjb3BlLmVjY29uZmlnICYmICRzY29wZS5lY2NvbmZpZy50aXRsZSl7XHJcbiAgICAgICAgICAgICRzY29wZS5ub3JtYWxUaXRsZSA9IGFuZ3VsYXIuY29weSh2YWwudGV4dCApO1xyXG4gICAgICAgICAgICAkc2NvcGUubm9ybWFsU3ViVGl0bGUgPSBhbmd1bGFyLmNvcHkodmFsLnN1YnRleHQpO1xyXG4gICAgICAgICAgICAkc2NvcGUubm9ybWFsVGl0bGVQb3NpdGlvbiA9IGFuZ3VsYXIuY29weSh2YWwubGVmdCk7XHJcbiAgICAgICAgICAgICRzY29wZS50aXRsZXRleHRjb2xvciA9IGFuZ3VsYXIuY29weSh2YWwudGV4dFN0eWxlLmNvbG9yKTtcclxuICAgICAgICAgICAgJHNjb3BlLnN1YnRpdGxldGV4dGNvbG9yID0gYW5ndWxhci5jb3B5KHZhbC5zdWJ0ZXh0U3R5bGUuY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sdHJ1ZSk7XHJcblxyXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ2VjY29uZmlnLm9wdGlvbicsZnVuY3Rpb24odmFsKXtcclxuICAgICAgICAgIGlmKCRzY29wZS5lY2NvbmZpZyAmJiAkc2NvcGUuZWNjb25maWcub3B0aW9uICYmICRzY29wZS5lY2NvbmZpZy5kYXRhLnR5cGUgPT09ICdzaW5nbGUnKXtcclxuICAgICAgICAgICAgJHNjb3BlLmJvcmRlcl9jb2xvciA9IHZhbC50aGVybW9tZXRlci5ib3JkZXJjb2xvcjtcclxuICAgICAgICAgICAgJHNjb3BlLmJhcl9jb2xvciA9IHZhbC50aGVybW9tZXRlci5iYXJjb2xvcjtcclxuICAgICAgICAgICAgJHNjb3BlLnBvaW50X2NvbG9yID0gdmFsLnRoZXJtb21ldGVyLnBvaW50Y29sb3I7XHJcbiAgICAgICAgICAgICRzY29wZS50aXRsZV9jb2xvciA9IHZhbC50aGVybW9tZXRlci50aXRsZWNvbG9yO1xyXG4gICAgICAgICAgICAkc2NvcGUudmFsdWVfY29sb3IgPSB2YWwuY2FyZC52YWx1ZWNvbG9yO1xyXG4gICAgICAgICAgICAkc2NvcGUuZmlsbF9jb2xvciA9IHZhbC5jYXJkLmZpbGxjb2xvcjtcclxuICAgICAgICAgICAgJHNjb3BlLnN0cm9rZV9jb2xvciA9IHZhbC5jYXJkLnN0cm9rZWNvbG9yO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sdHJ1ZSk7XHJcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc3BlYy5tYXJrJywgZnVuY3Rpb24gKG1hcmspIHtcclxuICAgICAgICAgICRzY29wZS5tYXJrZGV0YWlsID0gJHNjb3BlLm1hcmtzaWNvblttYXJrXTtcclxuICAgICAgICAgIGlmICgkc2NvcGUuZWNoYXJ0U2hhcGUuaW5kZXhPZihtYXJrKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5pZmVjaGFydCA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgJHNjb3BlLmlmZWNoYXJ0ID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJChcIi5jb2xvci1pbnB1dC10aXRsZVwiKS5jb2xvcnBpY2tlcigpLm9uKCdjaGFuZ2VDb2xvcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cigncmVsJykgPT09ICdidCcpIHtcclxuICAgICAgICAgICAgICAkc2NvcGUudGl0bGV0ZXh0Y29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAnc2J0Jykge1xyXG4gICAgICAgICAgICAgICRzY29wZS5zdWJ0aXRsZXRleHRjb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTsgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnZWNjb25maWcudHlwZScsZnVuY3Rpb24odHlwZSl7XHJcbiAgICAgICAgICBpZih0eXBlKXtcclxuICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKFwiLmNvbG9yLWlucHV0LXNpbmdsZVwiKS5jb2xvcnBpY2tlcigpLm9uKCdjaGFuZ2VDb2xvcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cigncmVsJykgPT09ICdib3JkZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmJvcmRlcl9jb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cigncmVsJykgPT09ICdwb2ludCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucG9pbnRfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAnYmFyJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5iYXJfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAndGl0bGUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRpdGxlX2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PT0gJ2ZpbGwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmZpbGxfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAnc3Ryb2tlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zdHJva2VfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAndmFsdWUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZhbHVlX2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS5zZXROb3JtYWxUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZV90eXBlKSB7XHJcbiAgICAgICAgICBpZiAoJHNjb3BlLmZyZXNoTW9kZWwpIHtcclxuICAgICAgICAgICAgaWYgKHRpdGxlX3R5cGUgPT09ICd0aXRsZScpIHtcclxuICAgICAgICAgICAgICAkc2NvcGUuZWNjb25maWcudGl0bGUudGV4dCA9IGFuZ3VsYXIuY29weSgkc2NvcGUubm9ybWFsVGl0bGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy50aXRsZS5zdWJ0ZXh0ID0gYW5ndWxhci5jb3B5KCRzY29wZS5ub3JtYWxTdWJUaXRsZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5zZXRUb3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAoJHNjb3BlLmZyZXNoTW9kZWwpIHtcclxuICAgICAgICAgICAgaWYgKCRzY29wZS5lY2NvbmZpZy5tYXBkYXRhLm9yZGVyX21vZGFsICE9PSAnMCcpIHtcclxuICAgICAgICAgICAgICAkc2NvcGUuZWNjb25maWcubWFwZGF0YS50b3BfbnVtID0gYW5ndWxhci5jb3B5KCRzY29wZS50b3BfbnVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnNldENvbG9yID0gZnVuY3Rpb24gKHR5cGUpIHtcclxuICAgICAgICAgIGlmICh0eXBlID09PSAnYm9yZGVyJykge1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcub3B0aW9uLnRoZXJtb21ldGVyLmJvcmRlcmNvbG9yID0gYW5ndWxhci5jb3B5KCRzY29wZS5ib3JkZXJfY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ3BvaW50Jyl7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5vcHRpb24udGhlcm1vbWV0ZXIucG9pbnRjb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUucG9pbnRfY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBpZih0eXBlID09PSAnYmFyJyl7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5vcHRpb24udGhlcm1vbWV0ZXIuYmFyY29sb3IgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmJhcl9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gXCJ0aXRsZVwiKXtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLm9wdGlvbi50aGVybW9tZXRlci50aXRsZWNvbG9yID0gYW5ndWxhci5jb3B5KCRzY29wZS50aXRsZV9jb2xvcik7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5vcHRpb24uY2FyZC50aXRsZWNvbG9yID0gYW5ndWxhci5jb3B5KCRzY29wZS50aXRsZV9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZih0eXBlID09PSAnZmlsbCcpe1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcub3B0aW9uLmNhcmQuZmlsbGNvbG9yID0gYW5ndWxhci5jb3B5KCRzY29wZS5maWxsX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmKHR5cGUgPT09ICdzdHJva2UnKXtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLm9wdGlvbi5jYXJkLnN0cm9rZWNvbG9yID0gYW5ndWxhci5jb3B5KCRzY29wZS5zdHJva2VfY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ3ZhbHVlJyl7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5vcHRpb24uY2FyZC52YWx1ZWNvbG9yID0gYW5ndWxhci5jb3B5KCRzY29wZS52YWx1ZV9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZih0eXBlID09PSAnYnQnKXtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLnRpdGxlLnRleHRTdHlsZS5jb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUudGl0bGV0ZXh0Y29sb3IpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmKHR5cGUgPT09ICdzYnQnKXtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLnRpdGxlLnN1YnRleHRTdHlsZS5jb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUuc3VidGl0bGV0ZXh0Y29sb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnNldE9yZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5mcmVzaE1vZGVsKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5tYXBkYXRhLm9yZGVyX21vZGFsID0gYW5ndWxhci5jb3B5KCRzY29wZS5vcmRlcl9tb2RhbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUuc2V0VGl0bGVQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmICgkc2NvcGUuZnJlc2hNb2RlbCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcubWFwZGF0YS5tYXBfdGl0bGVfbGVmdCA9IGFuZ3VsYXIuY29weSgkc2NvcGUubWFwX3RpdGxlX2xlZnQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5zZXROb3JtYWxUaXRsZVBvc2l0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5mcmVzaE1vZGVsKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy50aXRsZS5sZWZ0ID0gYW5ndWxhci5jb3B5KCRzY29wZS5ub3JtYWxUaXRsZVBvc2l0aW9uKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vbWl4ZWQgXHJcbiAgICAgICAgJHNjb3BlLm1peGVkeUZpZWxkRHJvcCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLnR5cGUgPSAnYmFyJztcclxuICAgICAgICAgICRzY29wZS55bW9kZWwudHJ1ZXR5cGUgPSAnYmFyJztcclxuICAgICAgICAgICRzY29wZS55bW9kZWwuaXNhcmVhID0gJzAnO1xyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC5hdXRvQ29sb3IgPSAndHJ1ZSc7XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmNvbG9yID0gXCIjMzMzXCI7XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmxhYmVsID0ge1xyXG4gICAgICAgICAgICBub3JtYWw6e1xyXG4gICAgICAgICAgICAgIHNob3c6J3RydWUnLFxyXG4gICAgICAgICAgICAgIHBvc2l0aW9uOid0b3AnLFxyXG4gICAgICAgICAgICAgIHJvdGF0ZTonMCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZC55LnB1c2goYW5ndWxhci5jb3B5KCRzY29wZS55bW9kZWwpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUucG9pbnRGaWVsZERyb3AgID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICRzY29wZS5wb2ludE1vZGVsLmNvbG9yID0gXCIjMzMzXCI7XHJcbiAgICAgICAgICAkc2NvcGUucG9pbnRNb2RlbC5pZnRvcCA9ICdmYWxzZSc7XHJcbiAgICAgICAgICAkc2NvcGUucG9pbnRNb2RlbC5vcmRlciA9ICdhc2MnO1xyXG4gICAgICAgICAgJHNjb3BlLnBvaW50TW9kZWwub3JkZXJfbnVtID0gJzUnO1xyXG4gICAgICAgICAgJHNjb3BlLnBvaW50TW9kZWwudG9wX2NvbG9yID0gJ2JsdWUnO1xyXG4gICAgICAgICAgJHNjb3BlLmVjY29uZmlnLnBvaW50LnB1c2goe1xyXG4gICAgICAgICAgICB4OmFuZ3VsYXIuY29weSgkc2NvcGUucG9pbnRNb2RlbCksXHJcbiAgICAgICAgICAgIHk6e31cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLmhhc0xlZ2VuZCA9IGZ1bmN0aW9uKG1hcmspe1xyXG4gICAgICAgICAgaWYoWydtaXhlZCcsJ3BpZScsJ2Z1bm5lbCcsJ3NjYXR0ZXInLCdyYWRhciddLmluZGV4T2YobWFyaykgPj0gMCl7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnBpZXhGaWVsZERyb3AgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgJHNjb3BlLnBpZXhtb2RlbC5sYWJlbCA9IHtcclxuICAgICAgICAgICAgc2hvdzondHJ1ZScsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOidpbnNpZGUnLFxyXG4gICAgICAgICAgICBzaG93cGVyY2VudDondHJ1ZSdcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICAkc2NvcGUuZWNjb25maWcuZmllbGQueC5wdXNoKGFuZ3VsYXIuY29weSgkc2NvcGUucGlleG1vZGVsKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmdhdWdlWUZpZWxkRHJvcCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAkc2NvcGUuZ2F1Z2VZLm5hbWUgPSBcIlwiO1xyXG4gICAgICAgICAgJHNjb3BlLmdhdWdlWS5zaG93UGVyY2VudCA9IFwiZmFsc2VcIjtcclxuICAgICAgICAgICRzY29wZS5nYXVnZVkuYXV0b01heCA9IFwiZmFsc2VcIjtcclxuICAgICAgICAgICRzY29wZS5nYXVnZVkubWF4RmllbGQgPSB7fTtcclxuICAgICAgICAgICRzY29wZS5nYXVnZVkubWF4ID0gXCIxMDBcIjtcclxuICAgICAgICAgICRzY29wZS5nYXVnZVkuc3R5bGUgPSB7XHJcbiAgICAgICAgICAgIGF4aXNMaW5lOntcclxuICAgICAgICAgICAgICBsaW5lU3R5bGU6e1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6IDEwXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBheGlzVGljazp7XHJcbiAgICAgICAgICAgICAgbGVuZ3RoOiAnMTUnLCAgICAgICAgLy8g5bGe5oCnbGVuZ3Ro5o6n5Yi257q/6ZW/XHJcbiAgICAgICAgICAgICAgbGluZVN0eWxlOiB7ICAgICAgIC8vIOWxnuaAp2xpbmVTdHlsZeaOp+WItue6v+adoeagt+W8j1xyXG4gICAgICAgICAgICAgICAgICBjb2xvcjogJ2F1dG8nXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzcGxpdExpbmU6e1xyXG4gICAgICAgICAgICAgIGxlbmd0aDogJzIwJywgICAgICAgICAvLyDlsZ7mgKdsZW5ndGjmjqfliLbnur/plb9cclxuICAgICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl77yI6K+m6KeBbGluZVN0eWxl77yJ5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRldGFpbDp7XHJcbiAgICAgICAgICAgICAgZm9udFNpemU6JzEyJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aXRsZTp7XHJcbiAgICAgICAgICAgICAgZm9udFNpemU6JzIwJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgJHNjb3BlLmVjY29uZmlnLmZpZWxkLnkucHVzaChhbmd1bGFyLmNvcHkoJHNjb3BlLmdhdWdlWSkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5zaW5nbGVGaWVsZERyb3AgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgJHNjb3BlLnNpbmdsZU1vZGVsLmxhYmVsID0gYW5ndWxhci5jb3B5KCRzY29wZS5zaW5nbGVNb2RlbC5maWVsZCk7XHJcbiAgICAgICAgICAkc2NvcGUuc2luZ2xlTW9kZWwudW5pdCA9IFwiXCI7XHJcbiAgICAgICAgICAkc2NvcGUuc2luZ2xlTW9kZWwuZm9udHNpemUgPSAnMTInO1xyXG4gICAgICAgICAgJHNjb3BlLmVjY29uZmlnLmZpZWxkLnkucHVzaChhbmd1bGFyLmNvcHkoJHNjb3BlLnNpbmdsZU1vZGVsKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnJlbW92ZU1peCA9IGZ1bmN0aW9uKGZpZWxkLG51bSkge1xyXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoJHNjb3BlLmVjY29uZmlnLmZpZWxkW2ZpZWxkXSkpIHsgXHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZFtmaWVsZF0uc3BsaWNlKG51bSwxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZFtmaWVsZF0gPSB7fTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5yZW1vdmVQb2ludCA9IGZ1bmN0aW9uKGZpZWxkLG51bSl7XHJcbiAgICAgICAgICBpZihmaWVsZCA9PSAneCcpe1xyXG4gICAgICAgICAgICB2YXIgYSA9IGNvbmZpcm0oJ+aYr+WQpuWIoOmZpOi/meS4quagh+iusCcpO1xyXG4gICAgICAgICAgICBpZihhKXtcclxuICAgICAgICAgICAgICAkc2NvcGUuZWNjb25maWcucG9pbnQuc3BsaWNlKG51bSwxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLnBvaW50W251bV0ueSA9IHt9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5yZW1vdmVBcmVhID0gZnVuY3Rpb24oZmllbGQpe1xyXG4gICAgICAgICAgJHNjb3BlLmVjY29uZmlnLmFyZWFbZmllbGRdID0ge307XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyB2YXIgc3BlY1dhdGNoZXIgPSAkc2NvcGUuJHdhdGNoKCdzcGVjJywgZnVuY3Rpb24gKHNwZWMpIHtcclxuICAgICAgICAvLyAgIC8vIHBvcHVsYXRlIGFueUNoYW5uZWxJZHMgc28gd2Ugc2hvdyBhbGwgb3IgdGhlbVxyXG4gICAgICAgIC8vICAgaWYgKCRzY29wZS5zdXBwb3J0QW55KSB7XHJcbiAgICAgICAgLy8gICAgICRzY29wZS5hbnlDaGFubmVsSWRzID0gdXRpbC5rZXlzKHNwZWMuZW5jb2RpbmcpLnJlZHVjZShmdW5jdGlvbiAoYW55Q2hhbm5lbElkcywgY2hhbm5lbElkKSB7XHJcbiAgICAgICAgLy8gICAgICAgaWYgKFBpbGxzLmlzQW55Q2hhbm5lbChjaGFubmVsSWQpKSB7XHJcbiAgICAgICAgLy8gICAgICAgICBhbnlDaGFubmVsSWRzLnB1c2goY2hhbm5lbElkKTtcclxuICAgICAgICAvLyAgICAgICB9XHJcbiAgICAgICAgLy8gICAgICAgcmV0dXJuIGFueUNoYW5uZWxJZHM7XHJcbiAgICAgICAgLy8gICAgIH0sIFtdKTtcclxuICAgICAgICAvLyAgIH1cclxuICAgICAgICAvLyAgIC8vIE9ubHkgY2FsbCBQaWxscy51cGRhdGUsIHdoaWNoIHdpbGwgdHJpZ2dlciBTcGVjLnNwZWMgdG8gdXBkYXRlIGlmIGl0J3Mgbm90IGEgcHJldmlldy5cclxuICAgICAgICAvLyAgIGlmICghJHNjb3BlLnByZXZpZXcpIHtcclxuICAgICAgICAvLyAgICAgdmFyIFNwZWMgPSBQaWxscy51cGRhdGUoc3BlYyk7XHJcbiAgICAgICAgLy8gICAgIHZhciBsb2dEYXRhID0gbnVsbDtcclxuICAgICAgICAvLyAgICAgaWYgKFNwZWMpIHtcclxuICAgICAgICAvLyAgICAgICBpZiAoU3BlYy5jaGFydHMpIHtcclxuICAgICAgICAvLyAgICAgICAgIGxvZ0RhdGEgPSB7IHNwZWNpZmljOiBmYWxzZSwgbnVtQ2hhcnRzOiBTcGVjLmNoYXJ0cy5sZW5ndGggfTtcclxuICAgICAgICAvLyAgICAgICB9IGVsc2UgaWYgKFNwZWMuY2hhcnQpIHtcclxuICAgICAgICAvLyAgICAgICAgIGxvZ0RhdGEgPSB7IHNwZWNpZmljOiB0cnVlIH07XHJcbiAgICAgICAgLy8gICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyAgICAgICAgIGxvZ0RhdGEgPSB7IHNwZWNpZmljOiBmYWxzZSwgbnVtQ2hhcnRzOiAwIH07XHJcbiAgICAgICAgLy8gICAgICAgfVxyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gICAgIExvZ2dlci5sb2dJbnRlcmFjdGlvbihMb2dnZXIuYWN0aW9ucy5TUEVDX0NIQU5HRSwgc3BlYywgbG9nRGF0YSk7XHJcbiAgICAgICAgLy8gICB9XHJcbiAgICAgICAgLy8gfSwgdHJ1ZSk7IC8vLCB0cnVlIC8qIHdhdGNoIGVxdWFsaXR5IHJhdGhlciB0aGFuIHJlZmVyZW5jZSAqLyk7XHJcblxyXG5cclxuICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIC8vIENsZWFuIHVwIHdhdGNoZXJcclxuICAgICAgICAgIHNwZWNXYXRjaGVyKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHZsdWkuZGlyZWN0aXZlOnRhYlxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyB0YWJcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCd0YWInLCBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy90YWJzL3RhYi5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVxdWlyZTogJ15edGFic2V0JyxcclxuICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBoZWFkaW5nOiAnQCdcclxuICAgICAgfSxcclxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB0YWJzZXRDb250cm9sbGVyKSB7XHJcbiAgICAgICAgdGFic2V0Q29udHJvbGxlci5hZGRUYWIoc2NvcGUpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSB2bHVpLmRpcmVjdGl2ZTp0YWJzZXRcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgdGFic2V0XHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmRpcmVjdGl2ZSgndGFic2V0JywgZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvdGFicy90YWJzZXQuaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcblxyXG4gICAgICAvLyBJbnRlcmZhY2UgZm9yIHRhYnMgdG8gcmVnaXN0ZXIgdGhlbXNlbHZlc1xyXG4gICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMudGFicyA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmFkZFRhYiA9IGZ1bmN0aW9uKHRhYlNjb3BlKSB7XHJcbiAgICAgICAgICAvLyBGaXJzdCB0YWIgaXMgYWx3YXlzIGF1dG8tYWN0aXZhdGVkOyBvdGhlcnMgYXV0by1kZWFjdGl2YXRlZFxyXG4gICAgICAgICAgdGFiU2NvcGUuYWN0aXZlID0gc2VsZi50YWJzLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICAgIHNlbGYudGFicy5wdXNoKHRhYlNjb3BlKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNob3dUYWIgPSBmdW5jdGlvbihzZWxlY3RlZFRhYikge1xyXG4gICAgICAgICAgc2VsZi50YWJzLmZvckVhY2goZnVuY3Rpb24odGFiKSB7XHJcbiAgICAgICAgICAgIC8vIEFjdGl2YXRlIHRoZSBzZWxlY3RlZCB0YWIsIGRlYWN0aXZhdGUgYWxsIG90aGVyc1xyXG4gICAgICAgICAgICB0YWIuYWN0aXZlID0gdGFiID09PSBzZWxlY3RlZFRhYjtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBFeHBvc2UgY29udHJvbGxlciB0byB0ZW1wbGF0ZXMgYXMgXCJ0YWJzZXRcIlxyXG4gICAgICBjb250cm9sbGVyQXM6ICd0YWJzZXQnXHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmZpbHRlcignY29tcGFjdEpTT04nLCBmdW5jdGlvbihKU09OMykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgIHJldHVybiBKU09OMy5zdHJpbmdpZnkoaW5wdXQsIG51bGwsICcgICcsIDgwKTtcclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZmlsdGVyXHJcbiAqIEBuYW1lIHZlZ2EtbGl0ZS11aS5maWx0ZXI6ZW5jb2RlVXJpXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBlbmNvZGVVcmlcclxuICogRmlsdGVyIGluIHRoZSB2ZWdhLWxpdGUtdWkuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmZpbHRlcignZW5jb2RlVVJJJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICByZXR1cm4gd2luZG93LmVuY29kZVVSSShpbnB1dCk7XHJcbiAgICB9O1xyXG4gIH0pOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZmlsdGVyXHJcbiAqIEBuYW1lIGZhY2V0ZWR2aXouZmlsdGVyOnJlcG9ydFVybFxyXG4gKiBAZnVuY3Rpb25cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgcmVwb3J0VXJsXHJcbiAqIEZpbHRlciBpbiB0aGUgZmFjZXRlZHZpei5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmlsdGVyKCdyZXBvcnRVcmwnLCBmdW5jdGlvbiAoY29tcGFjdEpTT05GaWx0ZXIsIF8sIGNvbnN0cykge1xyXG4gICAgZnVuY3Rpb24gdm95YWdlclJlcG9ydChwYXJhbXMpIHtcclxuICAgICAgdmFyIHVybCA9ICdodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9mb3Jtcy9kLzFUOVpBMTRGM21tenJIUjdKSlZVS3lQWHpyTXFGNTRDakxJT2p2MkU3WkVNL3ZpZXdmb3JtPyc7XHJcblxyXG4gICAgICBpZiAocGFyYW1zLmZpZWxkcykge1xyXG4gICAgICAgIHZhciBxdWVyeSA9IGVuY29kZVVSSShjb21wYWN0SlNPTkZpbHRlcihfLnZhbHVlcyhwYXJhbXMuZmllbGRzKSkpO1xyXG4gICAgICAgIHVybCArPSAnZW50cnkuMTI0NTE5OTQ3Nz0nICsgcXVlcnkgKyAnJic7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChwYXJhbXMuc3BlYykge1xyXG4gICAgICAgIHZhciBzcGVjID0gXy5vbWl0KHBhcmFtcy5zcGVjLCAnY29uZmlnJyk7XHJcbiAgICAgICAgc3BlYyA9IGVuY29kZVVSSShjb21wYWN0SlNPTkZpbHRlcihzcGVjKSk7XHJcbiAgICAgICAgdXJsICs9ICdlbnRyeS4xMzIzNjgwMTM2PScgKyBzcGVjICsgJyYnO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocGFyYW1zLnNwZWMyKSB7XHJcbiAgICAgICAgdmFyIHNwZWMyID0gXy5vbWl0KHBhcmFtcy5zcGVjMiwgJ2NvbmZpZycpO1xyXG4gICAgICAgIHNwZWMyID0gZW5jb2RlVVJJKGNvbXBhY3RKU09ORmlsdGVyKHNwZWMyKSk7XHJcbiAgICAgICAgdXJsICs9ICdlbnRyeS44NTMxMzc3ODY9JyArIHNwZWMyICsgJyYnO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgdHlwZVByb3AgPSAnZW50cnkuMTk0MDI5MjY3Nz0nO1xyXG4gICAgICBzd2l0Y2ggKHBhcmFtcy50eXBlKSB7XHJcbiAgICAgICAgY2FzZSAndmwnOlxyXG4gICAgICAgICAgdXJsICs9IHR5cGVQcm9wICsgJ1Zpc3VhbGl6YXRpb24rUmVuZGVyaW5nKyhWZWdhbGl0ZSkmJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3ZyJzpcclxuICAgICAgICAgIHVybCArPSB0eXBlUHJvcCArICdSZWNvbW1lbmRlcitBbGdvcml0aG0rKFZpc3JlYykmJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2Z2JzpcclxuICAgICAgICAgIHVybCArPSB0eXBlUHJvcCArICdSZWNvbW1lbmRlcitVSSsoRmFjZXRlZFZpeikmJztcclxuICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHZsdWlSZXBvcnQocGFyYW1zKSB7XHJcbiAgICAgIHZhciB1cmwgPSAnaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZm9ybXMvZC8xeEtzLXFHYUxaRVVmYlRtaGRtU29TMTNPS09FcHV1X05OV0U1VEFBbWxfWS92aWV3Zm9ybT8nO1xyXG4gICAgICBpZiAocGFyYW1zLnNwZWMpIHtcclxuICAgICAgICB2YXIgc3BlYyA9IF8ub21pdChwYXJhbXMuc3BlYywgJ2NvbmZpZycpO1xyXG4gICAgICAgIHNwZWMgPSBlbmNvZGVVUkkoY29tcGFjdEpTT05GaWx0ZXIoc3BlYykpO1xyXG4gICAgICAgIHVybCArPSAnZW50cnkuMTI0NTE5OTQ3Nz0nICsgc3BlYyArICcmJztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb25zdHMuYXBwSWQgPT09ICd2b3lhZ2VyJyA/IHZveWFnZXJSZXBvcnQgOiB2bHVpUmVwb3J0O1xyXG4gIH0pOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZmlsdGVyXHJcbiAqIEBuYW1lIHZlZ2EtbGl0ZS11aS5maWx0ZXI6dW5kZXJzY29yZTJzcGFjZVxyXG4gKiBAZnVuY3Rpb25cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgdW5kZXJzY29yZTJzcGFjZVxyXG4gKiBGaWx0ZXIgaW4gdGhlIHZlZ2EtbGl0ZS11aS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmlsdGVyKCd1bmRlcnNjb3JlMnNwYWNlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICByZXR1cm4gaW5wdXQgPyBpbnB1dC5yZXBsYWNlKC9fKy9nLCAnICcpIDogJyc7XHJcbiAgICB9O1xyXG4gIH0pOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuc2VydmljZSgnQ2hhcnQnLCBmdW5jdGlvbiAoY3FsLCBfKSB7XHJcbiAgICB2YXIgQ2hhcnQgPSB7XHJcbiAgICAgIGdldENoYXJ0OiBnZXRDaGFydCxcclxuICAgICAgdHJhbnNwb3NlOiB0cmFuc3Bvc2VcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTcGVjUXVlcnlNb2RlbEdyb3VwIHwgU3BlY1F1ZXJ5TW9kZWx9IGl0ZW1cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0Q2hhcnQoaXRlbSkge1xyXG4gICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgLyoqIEB0eXBlIHtPYmplY3R9IGNvbmNpc2Ugc3BlYyBnZW5lcmF0ZWQgKi9cclxuICAgICAgICAgIHZsU3BlYzogbnVsbCxcclxuICAgICAgICAgIGZpZWxkU2V0OiBudWxsLFxyXG5cclxuICAgICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSBnZW5lcmF0ZWQgdmwgc2hvcnRoYW5kICovXHJcbiAgICAgICAgICBzaG9ydGhhbmQ6IG51bGwsXHJcbiAgICAgICAgICBlbnVtU3BlY0luZGV4OiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHNwZWNNID0gaXRlbSBpbnN0YW5jZW9mIGNxbC5tb2RlbC5TcGVjUXVlcnlNb2RlbEdyb3VwID9cclxuICAgICAgICBpdGVtLmdldFRvcFNwZWNRdWVyeU1vZGVsKCk6XHJcbiAgICAgICAgaXRlbTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBlbnVtU3BlY0luZGV4OiBzcGVjTS5lbnVtU3BlY0luZGV4LFxyXG4gICAgICAgIGZpZWxkU2V0OiBzcGVjTS5zcGVjUXVlcnkuZW5jb2RpbmdzLFxyXG4gICAgICAgIHZsU3BlYzogc3BlY00udG9TcGVjKCksXHJcbiAgICAgICAgc2hvcnRoYW5kOiBzcGVjTS50b1Nob3J0aGFuZCgpXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNwb3NlKHNwZWMpIHtcclxuICAgICAgdmFyIGVuY29kaW5nID0gXy5jbG9uZShzcGVjLmVuY29kaW5nKTtcclxuICAgICAgdmFyIG9sZFhFbmMgPSBlbmNvZGluZy54O1xyXG4gICAgICB2YXIgb2xkWUVuYyA9IGVuY29kaW5nLnk7XHJcbiAgICAgIGVuY29kaW5nLnkgPSBvbGRYRW5jO1xyXG4gICAgICBlbmNvZGluZy54ID0gb2xkWUVuYztcclxuXHJcbiAgICAgIHZhciBvbGRSb3dFbmMgPSBlbmNvZGluZy5yb3c7XHJcbiAgICAgIHZhciBvbGRDb2xFbmMgPSBlbmNvZGluZy5jb2x1bW47XHJcbiAgICAgIGVuY29kaW5nLnJvdyA9IG9sZENvbEVuYztcclxuICAgICAgZW5jb2RpbmcuY29sdW1uID0gb2xkUm93RW5jO1xyXG5cclxuICAgICAgc3BlYy5lbmNvZGluZyA9IGVuY29kaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBDaGFydDtcclxuICB9KTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG4vLyBTZXJ2aWNlIGZvciB0aGUgc3BlYyBjb25maWcuXHJcbi8vIFdlIGtlZXAgdGhpcyBzZXBhcmF0ZSBzbyB0aGF0IGNoYW5nZXMgYXJlIGtlcHQgZXZlbiBpZiB0aGUgc3BlYyBjaGFuZ2VzLlxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmZhY3RvcnkoJ0NvbmZpZycsIGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIENvbmZpZyA9IHt9O1xyXG5cclxuICAgIENvbmZpZy5kYXRhID0ge307XHJcbiAgICBDb25maWcuY29uZmlnID0ge307XHJcblxyXG4gICAgQ29uZmlnLmdldENvbmZpZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge307XHJcbiAgICB9O1xyXG5cclxuICAgIENvbmZpZy5nZXREYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBDb25maWcuZGF0YTtcclxuICAgIH07XHJcblxyXG4gICAgQ29uZmlnLmxhcmdlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgY2VsbDoge1xyXG4gICAgICAgICAgd2lkdGg6IDMwMCxcclxuICAgICAgICAgIGhlaWdodDogMzAwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmYWNldDoge1xyXG4gICAgICAgICAgY2VsbDoge1xyXG4gICAgICAgICAgICB3aWR0aDogMTUwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDE1MFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcmxheToge2xpbmU6IHRydWV9LFxyXG4gICAgICAgIHNjYWxlOiB7dXNlUmF3RG9tYWluOiB0cnVlfVxyXG4gICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBDb25maWcuc21hbGwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmYWNldDoge1xyXG4gICAgICAgICAgY2VsbDoge1xyXG4gICAgICAgICAgICB3aWR0aDogMTUwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDE1MFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcmxheToge2xpbmU6IHRydWV9LFxyXG4gICAgICAgIHNjYWxlOiB7dXNlUmF3RG9tYWluOiB0cnVlfVxyXG4gICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBDb25maWcudXBkYXRlRGF0YXNldCA9IGZ1bmN0aW9uKGRhdGFzZXQsIHR5cGUpIHtcclxuICAgICAgaWYgKGRhdGFzZXQudmFsdWVzKSB7XHJcbiAgICAgICAgQ29uZmlnLmRhdGEudmFsdWVzID0gZGF0YXNldC52YWx1ZXM7XHJcbiAgICAgICAgZGVsZXRlIENvbmZpZy5kYXRhLnVybDtcclxuICAgICAgICBDb25maWcuZGF0YS5mb3JtYXRUeXBlID0gdW5kZWZpbmVkO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIENvbmZpZy5kYXRhLnVybCA9IGRhdGFzZXQudXJsO1xyXG4gICAgICAgIGRlbGV0ZSBDb25maWcuZGF0YS52YWx1ZXM7XHJcbiAgICAgICAgQ29uZmlnLmRhdGEuZm9ybWF0VHlwZSA9IHR5cGU7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIENvbmZpZztcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5zZXJ2aWNlKCdGaWx0ZXJNYW5hZ2VyJywgZnVuY3Rpb24gKF8sIERhdGFzZXQsIExvZ2dlcikge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIC8qKiBsb2NhbCBvYmplY3QgZm9yIHRoaXMgb2JqZWN0ICovXHJcbiAgICBzZWxmLmZpbHRlckluZGV4ID0ge307XHJcblxyXG4gICAgdGhpcy50b2dnbGUgPSBmdW5jdGlvbihmaWVsZCkge1xyXG4gICAgICBpZiAoIXNlbGYuZmlsdGVySW5kZXhbZmllbGRdKSB7XHJcbiAgICAgICAgc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0gPSBpbml0RmlsdGVyKGZpZWxkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzZWxmLmZpbHRlckluZGV4W2ZpZWxkXS5lbmFibGVkID0gIXNlbGYuZmlsdGVySW5kZXhbZmllbGRdLmVuYWJsZWQ7XHJcbiAgICAgIH1cclxuICAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKFxyXG4gICAgICAgIHNlbGYuZmlsdGVySW5kZXhbZmllbGRdLmVuYWJsZWQgPyBMb2dnZXIuYWN0aW9ucy5GSUxURVJfRU5BQkxFRCA6IExvZ2dlci5hY3Rpb25zLkZJTFRFUl9ESVNBQkxFRCxcclxuICAgICAgICBmaWVsZCxcclxuICAgICAgICBzZWxmLmZpbHRlckluZGV4W2ZpZWxkXVxyXG4gICAgICApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XHJcbiAgICAgIGlmICghc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0pIHtcclxuICAgICAgICBzZWxmLmZpbHRlckluZGV4W2ZpZWxkXSA9IGluaXRGaWx0ZXIoZmllbGQpO1xyXG4gICAgICAgIExvZ2dlci5sb2dJbnRlcmFjdGlvbihMb2dnZXIuYWN0aW9ucy5GSUxURVJfRU5BQkxFRCwgZmllbGQsIHNlbGYuZmlsdGVySW5kZXhbZmllbGRdKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmKHNlbGYuZmlsdGVySW5kZXhbZmllbGRdJiYhc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0uZW5hYmxlZCkvLyBqbnAgZml4ZWQgZGVsZXRlIGJ1Z1xyXG4gICAgICB7XHJcbiAgICAgICAgc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0uZW5hYmxlZCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucmVzZXQgPSBmdW5jdGlvbihvbGRGaWx0ZXIsIGhhcmQpIHtcclxuICAgICAgaWYgKGhhcmQpIHtcclxuICAgICAgICBzZWxmLmZpbHRlckluZGV4ID0ge307XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgXy5mb3JFYWNoKHNlbGYuZmlsdGVySW5kZXgsIGZ1bmN0aW9uKHZhbHVlLCBmaWVsZCkge1xyXG4gICAgICAgICAgaWYgKHNlbGYuZmlsdGVySW5kZXhbZmllbGRdLmVuYWJsZWQpIHtcclxuICAgICAgICAgICAgc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0gPSBpbml0RmlsdGVyKGZpZWxkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9sZEZpbHRlcikge1xyXG4gICAgICAgIG9sZEZpbHRlci5mb3JFYWNoKGZ1bmN0aW9uKGZpbHRlcikge1xyXG4gICAgICAgICAgc2VsZi5maWx0ZXJJbmRleFtmaWx0ZXIuZmllbGRdID0gYW5ndWxhci5leHRlbmQoe2VuYWJsZWQ6IHRydWV9LCBmaWx0ZXIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gc2VsZi5maWx0ZXJJbmRleDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRWbEZpbHRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgdmxGaWx0ZXIgPSBfLnJlZHVjZShzZWxmLmZpbHRlckluZGV4LCBmdW5jdGlvbiAoZmlsdGVycywgZmlsdGVyKSB7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gZmlsdGVyLmZpZWxkO1xyXG4gICAgICAgIHZhciB0aW1lVW5pdCA9IGZpbHRlci50aW1lVW5pdDtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlci5pbikge1xyXG4gICAgICAgICAgaWYgKCBmaWx0ZXIuaW4ubGVuZ3RoID09PSAwIHx8XHJcbiAgICAgICAgICAgICAgIGZpbHRlci5pbi5sZW5ndGggPT09IERhdGFzZXQuc2NoZW1hLmNhcmRpbmFsaXR5KHtmaWVsZDogZmllbGR9KSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcnM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChmaWx0ZXIucmFuZ2UpIHtcclxuICAgICAgICAgIHZhciBkb21haW4gPSBEYXRhc2V0LnNjaGVtYS5kb21haW4oe1xyXG4gICAgICAgICAgICBmaWVsZDogZmllbGQsXHJcbiAgICAgICAgICAgIHRpbWVVbml0OiB0aW1lVW5pdFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgaWYgKGZpbHRlci5yYW5nZVswXSA9PT0gZG9tYWluWzBdICYmIGZpbHRlci5yYW5nZVsxXSA9PT0gZG9tYWluWzFdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGZpbHRlci5lbmFibGVkKSB7XHJcbiAgICAgICAgICBmaWx0ZXJzLnB1c2goXy5vbWl0KGZpbHRlciwgJ2VuYWJsZWQnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmaWx0ZXJzO1xyXG4gICAgICB9LCBbXSk7XHJcblxyXG4gICAgICByZXR1cm4gdmxGaWx0ZXIubGVuZ3RoID8gdmxGaWx0ZXIgOiB1bmRlZmluZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRGaWx0ZXIoZmllbGQpIHtcclxuICAgICAgdmFyIHR5cGUgPSBEYXRhc2V0LnNjaGVtYS50eXBlKGZpZWxkKTtcclxuICAgICAgdmFyIHRoaXNUeXBlID0ge1xyXG4gICAgICAgIFwiVHlwZVwiOiB7XHJcbiAgICAgICAgICBcIlFVQU5USVRBVElWRVwiOiBcInF1YW50aXRhdGl2ZVwiLFxyXG4gICAgICAgICAgXCJxdWFudGl0YXRpdmVcIjogXCJRVUFOVElUQVRJVkVcIixcclxuICAgICAgICAgIFwiT1JESU5BTFwiOiBcIm9yZGluYWxcIixcclxuICAgICAgICAgIFwib3JkaW5hbFwiOiBcIk9SRElOQUxcIixcclxuICAgICAgICAgIFwiVEVNUE9SQUxcIjogXCJ0ZW1wb3JhbFwiLFxyXG4gICAgICAgICAgXCJ0ZW1wb3JhbFwiOiBcIlRFTVBPUkFMXCIsXHJcbiAgICAgICAgICBcIk5PTUlOQUxcIjogXCJub21pbmFsXCIsXHJcbiAgICAgICAgICBcIm5vbWluYWxcIjogXCJOT01JTkFMXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiUVVBTlRJVEFUSVZFXCI6IFwicXVhbnRpdGF0aXZlXCIsXHJcbiAgICAgICAgXCJPUkRJTkFMXCI6IFwib3JkaW5hbFwiLFxyXG4gICAgICAgIFwiVEVNUE9SQUxcIjogXCJ0ZW1wb3JhbFwiLFxyXG4gICAgICAgIFwiTk9NSU5BTFwiOiBcIm5vbWluYWxcIixcclxuICAgICAgICBcIlNIT1JUX1RZUEVcIjoge1xyXG4gICAgICAgICAgXCJxdWFudGl0YXRpdmVcIjogXCJRXCIsXHJcbiAgICAgICAgICBcInRlbXBvcmFsXCI6IFwiVFwiLFxyXG4gICAgICAgICAgXCJub21pbmFsXCI6IFwiTlwiLFxyXG4gICAgICAgICAgXCJvcmRpbmFsXCI6IFwiT1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIlRZUEVfRlJPTV9TSE9SVF9UWVBFXCI6IHtcclxuICAgICAgICAgIFwiUVwiOiBcInF1YW50aXRhdGl2ZVwiLFxyXG4gICAgICAgICAgXCJUXCI6IFwidGVtcG9yYWxcIixcclxuICAgICAgICAgIFwiT1wiOiBcIm9yZGluYWxcIixcclxuICAgICAgICAgIFwiTlwiOiBcIm5vbWluYWxcIlxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgY2FzZSB0aGlzVHlwZS5OT01JTkFMOlxyXG4gICAgICAgIGNhc2UgdGhpc1R5cGUuT1JESU5BTDpcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcclxuICAgICAgICAgICAgaW46IERhdGFzZXQuc2NoZW1hLmRvbWFpbih7ZmllbGQ6IGZpZWxkfSlcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgY2FzZSB0aGlzVHlwZS5RVUFOVElUQVRJVkU6XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICBmaWVsZDogZmllbGQsXHJcbiAgICAgICAgICAgIHJhbmdlOiBbXHJcbiAgICAgICAgICAgICAgRGF0YXNldC5zY2hlbWEuc3RhdHMoe2ZpZWxkOiBmaWVsZH0pLm1pbixcclxuICAgICAgICAgICAgICBEYXRhc2V0LnNjaGVtYS5zdGF0cyh7ZmllbGQ6IGZpZWxkfSkubWF4XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgY2FzZSB0aGlzVHlwZS5URU1QT1JBTDpcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcclxuICAgICAgICAgICAgcmFuZ2U6IFtcclxuICAgICAgICAgICAgICBEYXRhc2V0LnNjaGVtYS5zdGF0cyh7ZmllbGQ6IGZpZWxkfSkubWluLFxyXG4gICAgICAgICAgICAgIERhdGFzZXQuc2NoZW1hLnN0YXRzKHtmaWVsZDogZmllbGR9KS5tYXhcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5nZG9jIHNlcnZpY2VcclxuICogQG5hbWUgdmVnYS1saXRlLXVpLmxvZ2dlclxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBsb2dnZXJcclxuICogU2VydmljZSBpbiB0aGUgdmVnYS1saXRlLXVpLlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5zZXJ2aWNlKCdMb2dnZXInLCBmdW5jdGlvbiAoJGxvY2F0aW9uLCAkd2luZG93LCAkd2ViU3FsLCBfLCBjb25zdHMsIEFuYWx5dGljcywgUGFwYSwgQmxvYiwgVVJMKSB7XHJcblxyXG4gICAgdmFyIHNlcnZpY2UgPSB7fTtcclxuXHJcbiAgICBzZXJ2aWNlLmxldmVscyA9IHtcclxuICAgICAgT0ZGOiB7aWQ6J09GRicsIHJhbms6MH0sXHJcbiAgICAgIFRSQUNFOiB7aWQ6J1RSQUNFJywgcmFuazoxfSxcclxuICAgICAgREVCVUc6IHtpZDonREVCVUcnLCByYW5rOjJ9LFxyXG4gICAgICBJTkZPOiB7aWQ6J0lORk8nLCByYW5rOjN9LFxyXG4gICAgICBXQVJOOiB7aWQ6J1dBUk4nLCByYW5rOjR9LFxyXG4gICAgICBFUlJPUjoge2lkOidFUlJPUicsIHJhbms6NX0sXHJcbiAgICAgIEZBVEFMOiB7aWQ6J0ZBVEFMJywgcmFuazo2fVxyXG4gICAgfTtcclxuXHJcbiAgICBzZXJ2aWNlLmFjdGlvbnMgPSB7XHJcbiAgICAgIC8vIERBVEFcclxuICAgICAgSU5JVElBTElaRToge2NhdGVnb3J5OiAnREFUQScsIGlkOiAnSU5JVElBTElaRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5ERUJVR30sXHJcbiAgICAgIFVORE86IHtjYXRlZ29yeTogJ0RBVEEnLCBpZDogJ1VORE8nLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIFJFRE86IHtjYXRlZ29yeTogJ0RBVEEnLCBpZDogJ1JFRE8nLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIERBVEFTRVRfQ0hBTkdFOiB7Y2F0ZWdvcnk6ICdEQVRBJywgaWQ6ICdEQVRBU0VUX0NIQU5HRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgREFUQVNFVF9PUEVOOiB7Y2F0ZWdvcnk6ICdEQVRBJywgaWQ6ICdEQVRBU0VUX09QRU4nLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIERBVEFTRVRfTkVXX1BBU1RFOiB7Y2F0ZWdvcnk6ICdEQVRBJywgaWQ6ICdEQVRBU0VUX05FV19QQVNURScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgREFUQVNFVF9ORVdfVVJMOiB7Y2F0ZWdvcnk6ICdEQVRBJywgaWQ6ICdEQVRBU0VUX05FV19VUkwnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIC8vIEJPT0tNQVJLXHJcbiAgICAgIEJPT0tNQVJLX0FERDoge2NhdGVnb3J5OiAnQk9PS01BUksnLCBpZDonQk9PS01BUktfQUREJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBCT09LTUFSS19SRU1PVkU6IHtjYXRlZ29yeTogJ0JPT0tNQVJLJywgaWQ6J0JPT0tNQVJLX1JFTU9WRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgQk9PS01BUktfT1BFTjoge2NhdGVnb3J5OiAnQk9PS01BUksnLCBpZDonQk9PS01BUktfT1BFTicsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgQk9PS01BUktfQ0xPU0U6IHtjYXRlZ29yeTogJ0JPT0tNQVJLJywgaWQ6J0JPT0tNQVJLX0NMT1NFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBCT09LTUFSS19DTEVBUjoge2NhdGVnb3J5OiAnQk9PS01BUksnLCBpZDogJ0JPT0tNQVJLX0NMRUFSJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBCT09LTUFSS19BTk5PVEFURToge2NhdGVnb3J5OiAnQk9PS01BUksnLCBpZDogJ0JPT0tNQVJLX0FOTk9UQVRFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICAvLyBDSEFSVFxyXG4gICAgICBDSEFSVF9NT1VTRU9WRVI6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J0NIQVJUX01PVVNFT1ZFUicsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5ERUJVR30sXHJcbiAgICAgIENIQVJUX01PVVNFT1VUOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidDSEFSVF9NT1VTRU9VVCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5ERUJVR30sXHJcbiAgICAgIENIQVJUX1JFTkRFUjoge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDonQ0hBUlRfUkVOREVSJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLkRFQlVHfSxcclxuICAgICAgQ0hBUlRfRVhQT1NFOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidDSEFSVF9FWFBPU0UnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuREVCVUd9LFxyXG4gICAgICBDSEFSVF9UT09MVElQOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidDSEFSVF9UT09MVElQJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLkRFQlVHfSxcclxuICAgICAgQ0hBUlRfVE9PTFRJUF9FTkQ6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J0NIQVJUX1RPT0xUSVBfRU5EJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLkRFQlVHfSxcclxuXHJcbiAgICAgIFNPUlRfVE9HR0xFOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidTT1JUX1RPR0dMRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgTUFSS19UT0dHTEU6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J01BUktfVE9HR0xFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBEUklMTF9ET1dOX09QRU46IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J0RSSUxMX0RPV05fT1BFTicsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgRFJJTExfRE9XTl9DTE9TRToge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDogJ0RSSUxMX0RPV05fQ0xPU0UnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIExPR19UT0dHTEU6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6ICdMT0dfVE9HR0xFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBUUkFOU1BPU0VfVE9HR0xFOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOiAnVFJBTlNQT1NFX1RPR0dMRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgTlVMTF9GSUxURVJfVE9HR0xFOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidOVUxMX0ZJTFRFUl9UT0dHTEUnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICBDTFVTVEVSX1NFTEVDVDoge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDonQ0xVU1RFUl9TRUxFQ1QnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIExPQURfTU9SRToge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDonTE9BRF9NT1JFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG5cclxuICAgICAgLy8gRklFTERTXHJcbiAgICAgIEZJRUxEU19DSEFOR0U6IHtjYXRlZ29yeTogJ0ZJRUxEUycsIGlkOiAnRklFTERTX0NIQU5HRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgRklFTERTX1JFU0VUOiB7Y2F0ZWdvcnk6ICdGSUVMRFMnLCBpZDogJ0ZJRUxEU19SRVNFVCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgRlVOQ19DSEFOR0U6IHtjYXRlZ29yeTogJ0ZJRUxEUycsIGlkOiAnRlVOQ19DSEFOR0UnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEFERF9GSUVMRDoge2NhdGVnb3J5OiAnRklFTERTJywgaWQ6ICdBRERfRklFTEQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICAvLyBGaWVsZCBJbmZvXHJcbiAgICAgIEZJRUxEREVGX0hJR0hMSUdIVEVEOiB7Y2F0ZWdvcnk6ICdGSUVMRElORk8nLCBpZDogJ0ZJRUxEREVGX0hJR0hMSUdIVEVEJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBGSUVMRERFRl9VTkhJR0hMSUdIVEVEOiB7Y2F0ZWdvcnk6ICdGSUVMRElORk8nLCBpZDogJ0ZJRUxEREVGX1VOSElHSExJR0hURUQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICAvLyBXSUxEQ0FSRFxyXG4gICAgICBBRERfV0lMRENBUkQ6IHtjYXRlZ29yeTogJ1dJTERDQVJEJywgaWQ6ICdBRERfV0lMRENBUkQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEFERF9XSUxEQ0FSRF9GSUVMRDoge2NhdGVnb3J5OiAnV0lMRENBUkQnLCBpZDogJ0FERF9XSUxEQ0FSRF9GSUVMRCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgUkVNT1ZFX1dJTERDQVJEX0ZJRUxEOiB7Y2F0ZWdvcnk6ICdXSUxEQ0FSRCcsIGlkOiAnUkVNT1ZFX1dJTERDQVJEX0ZJRUxEJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBSRU1PVkVfV0lMRENBUkQ6IHtjYXRlZ29yeTogJ1dJTERDQVJEJywgaWQ6ICdSRU1PVkVfV0lMRENBUkQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICAvLyBQT0xFU1RBUlxyXG4gICAgICBTUEVDX0NMRUFOOiB7Y2F0ZWdvcnk6J1BPTEVTVEFSJywgaWQ6ICdTUEVDX0NMRUFOJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBTUEVDX0NIQU5HRToge2NhdGVnb3J5OidQT0xFU1RBUicsIGlkOiAnU1BFQ19DSEFOR0UnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEZJRUxEX0RST1A6IHtjYXRlZ29yeTogJ1BPTEVTVEFSJywgaWQ6ICdGSUVMRF9EUk9QJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBGSUVMRF9SRU1PVkVEOiB7Y2F0ZWdvcnk6ICdQT0xFU1RBUicsIGlkOiAnRklFTERfUkVNT1ZFRCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgTUFSS19DSEFOR0U6IHtjYXRlZ29yeTogJ1BPTEVTVEFSJywgaWQ6ICdNQVJLX0NIQU5HRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuXHJcbiAgICAgIC8vIEZpbHRlclxyXG4gICAgICBGSUxURVJfRU5BQkxFRDoge2NhdGVnb3J5OidGSUxURVInLCBpZDogJ0ZJTFRFUl9FTkFCTEVEJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBGSUxURVJfRElTQUJMRUQ6IHtjYXRlZ29yeTonRklMVEVSJywgaWQ6ICdGSUxURVJfRElTQUJMRUQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEZJTFRFUl9DSEFOR0U6IHtjYXRlZ29yeTonRklMVEVSJywgaWQ6ICdGSUxURVJfQ0hBTkdFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBGSUxURVJfQ0xFQVI6IHtjYXRlZ29yeTonRklMVEVSJywgaWQ6ICdGSUxURVJfQ0xFQVInLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICAvLyBWb3lhZ2VyIDJcclxuICAgICAgU1BFQ19TRUxFQ1Q6IHtjYXRlZ29yeTonVk9ZQUdFUjInLCBpZDogJ1NQRUNfU0VMRUNUJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG5cclxuICAgICAgLy8gQWx0ZXJuYXRpdmVzXHJcbiAgICAgIFNFVF9BTFRFUk5BVElWRVNfVFlQRToge2NhdGVnb3J5OidBTFRFUk5BVElWRVMnLCBpZDogJ1NFVF9BTFRFUk5BVElWRVNfVFlQRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgVE9HR0xFX1NIT1dfQUxURVJOQVRJVkVTOiB7Y2F0ZWdvcnk6J0FMVEVSTkFUSVZFUycsIGlkOiAnVE9HR0xFX1NIT1dfQUxURVJOQVRJVkVTJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBUT0dHTEVfSElERV9BTFRFUk5BVElWRVM6IHtjYXRlZ29yeTonQUxURVJOQVRJVkVTJywgaWQ6ICdUT0dHTEVfSElERV9BTFRFUk5BVElWRVMnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICAvLyBQcmV2aWV3XHJcbiAgICAgIFNQRUNfUFJFVklFV19FTkFCTEVEOiB7Y2F0ZWdvcnk6J1BSRVZJRVcnLCBpZDogJ1NQRUNfUFJFVklFV19FTkFCTEVEJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBTUEVDX1BSRVZJRVdfRElTQUJMRUQ6IHtjYXRlZ29yeTonUFJFVklFVycsIGlkOiAnU1BFQ19QUkVWSUVXX0RJU0FCTEVEJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGNyZWF0ZSBub29wIHNlcnZpY2UgaWYgd2Vic3FsIGlzIG5vdCBzdXBwb3J0ZWRcclxuICAgIGlmICgkd2luZG93Lm9wZW5EYXRhYmFzZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignTm8gd2Vic3FsIHN1cHBvcnQgYW5kIHRodXMgbm8gbG9nZ2luZy4nKTtcclxuICAgICAgc2VydmljZS5sb2dJbnRlcmFjdGlvbiA9IGZ1bmN0aW9uKCkge307XHJcbiAgICAgIHJldHVybiBzZXJ2aWNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCB1c2VyIGlkIG9uY2UgaW4gdGhlIGJlZ2lubmluZ1xyXG4gICAgdmFyIHVzZXJpZCA9IHNlcnZpY2UudXNlcmlkID0gJGxvY2F0aW9uLnNlYXJjaCgpLnVzZXJpZDtcclxuXHJcbiAgICBzZXJ2aWNlLmRiID0gJHdlYlNxbC5vcGVuRGF0YWJhc2UoJ2xvZ3MnLCAnMS4wJywgJ0xvZ3MnLCAyICogMTAyNCAqIDEwMjQpO1xyXG5cclxuICAgIHNlcnZpY2UudGFibGVOYW1lID0gJ0xvZ3NfJyArIGNvbnN0cy5hcHBJZDtcclxuXHJcbiAgICAvLyAoemVuaW5nKSBUT0RPOiBjaGVjayBpZiB0aGUgdGFibGUgaXMgY29ycmVjdCwgZG8gd2UgcmVhbGx5IG5lZWQgdGltZT8gd2lsbCB0aW1lIGJlIGF1dG9tYXRpY2FsbHkgYWRkZWQ/XHJcbiAgICBzZXJ2aWNlLmNyZWF0ZVRhYmxlSWZOb3RFeGlzdHMgPSBmdW5jdGlvbigpIHtcclxuICAgICAgc2VydmljZS5kYi5jcmVhdGVUYWJsZShzZXJ2aWNlLnRhYmxlTmFtZSwge1xyXG4gICAgICAgICd1c2VyaWQnOiB7XHJcbiAgICAgICAgICAndHlwZSc6ICdJTlRFR0VSJyxcclxuICAgICAgICAgICdudWxsJzogJ05PVCBOVUxMJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ3RpbWUnOiB7XHJcbiAgICAgICAgICAndHlwZSc6ICdUSU1FU1RBTVAnLFxyXG4gICAgICAgICAgJ251bGwnOiAnTk9UIE5VTEwnXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnYWN0aW9uQ2F0ZWdvcnknOiB7XHJcbiAgICAgICAgICAndHlwZSc6ICdURVhUJyxcclxuICAgICAgICAgICdudWxsJzogJ05PVCBOVUxMJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ2FjdGlvbklkJzoge1xyXG4gICAgICAgICAgJ3R5cGUnOiAnVEVYVCcsXHJcbiAgICAgICAgICAnbnVsbCc6ICdOT1QgTlVMTCdcclxuICAgICAgICB9LFxyXG4gICAgICAgICdsYWJlbCc6IHtcclxuICAgICAgICAgICd0eXBlJzogJ1RFWFQnLFxyXG4gICAgICAgICAgJ251bGwnOiAnTk9UIE5VTEwnXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnZGF0YSc6IHtcclxuICAgICAgICAgICd0eXBlJzogJ1RFWFQnXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgc2VydmljZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgciA9ICR3aW5kb3cuY29uZmlybSgnUmVhbGx5IGNsZWFyIHRoZSBsb2dzPycpO1xyXG4gICAgICBpZiAociA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHNlcnZpY2UuZGIuZHJvcFRhYmxlKHNlcnZpY2UudGFibGVOYW1lKTtcclxuICAgICAgICBzZXJ2aWNlLmNyZWF0ZVRhYmxlSWZOb3RFeGlzdHMoKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBzZXJ2aWNlLmV4cG9ydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICBzZXJ2aWNlLmRiLnNlbGVjdEFsbChzZXJ2aWNlLnRhYmxlTmFtZSkudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICAgICAgaWYgKHJlc3VsdHMucm93cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGNvbnNvbGUud2FybignTm8gbG9ncycpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJvd3MgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCByZXN1bHRzLnJvd3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHJvd3MucHVzaChyZXN1bHRzLnJvd3MuaXRlbShpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY3N2ID0gUGFwYS51bnBhcnNlKHJvd3MpO1xyXG5cclxuICAgICAgICB2YXIgY3N2RGF0YSA9IG5ldyBCbG9iKFtjc3ZdLCB7IHR5cGU6ICd0ZXh0L2NzdicgfSk7XHJcbiAgICAgICAgdmFyIGNzdlVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoY3N2RGF0YSk7XHJcblxyXG4gICAgICAgIHZhciBlbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KCc8YS8+Jyk7XHJcbiAgICAgICAgZWxlbWVudC5hdHRyKHtcclxuICAgICAgICAgIGhyZWY6IGNzdlVybCxcclxuICAgICAgICAgIHRhcmdldDogJ19ibGFuaycsXHJcbiAgICAgICAgICBkb3dubG9hZDogc2VydmljZS50YWJsZU5hbWUgKyAnXycgKyB1c2VyaWQgKyAnXycgKyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgKyAnLmNzdidcclxuICAgICAgICB9KVswXS5jbGljaygpO1xyXG4gICAgICB9KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIHNlcnZpY2UubG9nSW50ZXJhY3Rpb24gPSBmdW5jdGlvbihhY3Rpb24sIGxhYmVsLCBkYXRhKSB7XHJcbiAgICAgIGlmICghY29uc3RzLmxvZ2dpbmcpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHZhbHVlID0gZGF0YSA/IGRhdGEudmFsdWUgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGlmKGFjdGlvbi5sZXZlbC5yYW5rID49IHNlcnZpY2UubGV2ZWxzW2NvbnN0cy5sb2dMZXZlbCB8fCAnSU5GTyddLnJhbmspIHtcclxuICAgICAgICBBbmFseXRpY3MudHJhY2tFdmVudChhY3Rpb24uY2F0ZWdvcnksIGFjdGlvbi5pZCwgbGFiZWwsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgaWYgKGNvbnN0cy5sb2dUb1dlYlNxbCkge1xyXG4gICAgICAgICAgdmFyIHJvdyA9IHtcclxuICAgICAgICAgICAgdXNlcmlkOiB1c2VyaWQsXHJcbiAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgYWN0aW9uQ2F0ZWdvcnk6IGFjdGlvbi5jYXRlZ29yeSxcclxuICAgICAgICAgICAgYWN0aW9uSWQ6IGFjdGlvbi5pZCxcclxuICAgICAgICAgICAgbGFiZWw6IF8uaXNPYmplY3QobGFiZWwpID8gSlNPTi5zdHJpbmdpZnkobGFiZWwpIDogbGFiZWwsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGEgPyBKU09OLnN0cmluZ2lmeShkYXRhKSA6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHNlcnZpY2UuZGIuaW5zZXJ0KHNlcnZpY2UudGFibGVOYW1lLCByb3cpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFjdGlvbi5sZXZlbC5yYW5rID49IHNlcnZpY2UubGV2ZWxzW2NvbnN0cy5sb2dQcmludExldmVsIHx8ICdJTkZPJ10ucmFuaykge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tMb2dnaW5nXSAnLCBhY3Rpb24uaWQsIGxhYmVsLCBkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgc2VydmljZS5jcmVhdGVUYWJsZUlmTm90RXhpc3RzKCk7XHJcbiAgICBjb25zb2xlLmxvZygnYXBwOicsIGNvbnN0cy5hcHBJZCwgJ3N0YXJ0ZWQnKTtcclxuICAgIHNlcnZpY2UubG9nSW50ZXJhY3Rpb24oc2VydmljZS5hY3Rpb25zLklOSVRJQUxJWkUsIGNvbnN0cy5hcHBJZCk7XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuc2VydmljZSgnUGlsbHMnLCBmdW5jdGlvbiAoQU5ZLCBjb25zdHMsIGNxbCkge1xyXG4gICAgdmFyIFBpbGxzID0ge1xyXG4gICAgICAvLyBGdW5jdGlvbnNcclxuICAgICAgaXNBbnlDaGFubmVsOiBpc0FueUNoYW5uZWwsXHJcbiAgICAgIGdldE5leHRBbnlDaGFubmVsSWQ6IGdldE5leHRBbnlDaGFubmVsSWQsXHJcbiAgICAgIGdldEVtcHR5QW55Q2hhbm5lbElkOiBnZXRFbXB0eUFueUNoYW5uZWxJZCxcclxuICAgICAgaXNFbnVtZXJhdGVkQ2hhbm5lbDogaXNFbnVtZXJhdGVkQ2hhbm5lbCxcclxuICAgICAgaXNFbnVtZXJhdGVkRmllbGQ6IGlzRW51bWVyYXRlZEZpZWxkLFxyXG5cclxuICAgICAgZ2V0OiBnZXQsXHJcbiAgICAgIC8vIEV2ZW50XHJcbiAgICAgIGRyYWdEcm9wOiBkcmFnRHJvcCxcclxuICAgICAgZHJhZ1N0YXJ0OiBkcmFnU3RhcnQsXHJcbiAgICAgIGRyYWdTdG9wOiBkcmFnU3RvcCxcclxuICAgICAgLy8gRXZlbnQsIHdpdGggaGFuZGxlciBpbiB0aGUgbGlzdGVuZXJcclxuXHJcbiAgICAgIC8qKiBTZXQgYSBmaWVsZERlZiBmb3IgYSBjaGFubmVsICovXHJcbiAgICAgIHNldDogc2V0LFxyXG5cclxuICAgICAgLyoqIFJlbW92ZSBhIGZpZWxkRGVmIGZyb20gYSBjaGFubmVsICovXHJcbiAgICAgIHJlbW92ZTogcmVtb3ZlLFxyXG5cclxuICAgICAgY291bnRGaWVsZERlZjoge2ZpZWxkOiAnKicsdHlwZTogJ3F1YW50aXRhdGl2ZSd9LFxyXG5cclxuICAgICAgLy8gRGF0YVxyXG4gICAgICAvLyBUT0RPOiBzcGxpdCBiZXR3ZWVuIGVuY29kaW5nIHJlbGF0ZWQgYW5kIG5vbi1lbmNvZGluZyByZWxhdGVkXHJcbiAgICAgIHBpbGxzOiB7fSxcclxuICAgICAgaGlnaGxpZ2h0ZWQ6IHt9LFxyXG4gICAgICAvKiogcGlsbCBiZWluZyBkcmFnZ2VkICovXHJcbiAgICAgIGRyYWdnaW5nOiBudWxsLFxyXG4gICAgICBpc0RyYWdnaW5nV2lsZGNhcmQ6IG51bGwsXHJcbiAgICAgIC8qKiBjaGFubmVsSWQgdGhhdCdzIHRoZSBwaWxsIGlzIGJlaW5nIGRyYWdnZWQgZnJvbSAqL1xyXG4gICAgICBjaWREcmFnRnJvbTogbnVsbCxcclxuICAgICAgLyoqIExpc3RlbmVyICAqL1xyXG4gICAgICBsaXN0ZW5lcjogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBBZGQgbGlzdGVuZXIgdHlwZSB0aGF0IFBpbGxzIGp1c3QgcGFzcyBhcmd1bWVudHMgdG8gaXRzIGxpc3RlbmVyXHJcbiAgICAvLyBGSVhNRTogcHJvcGVybHkgaW1wbGVtZW50IGxpc3RlbmVyIHBhdHRlcm5cclxuICAgIFtcclxuICAgICAgJ2FkZCcsICdwYXJzZScsICdzZWxlY3QnLCAncHJldmlldycsICd1cGRhdGUnLCAncmVzZXQnLFxyXG4gICAgICAncmVzY2FsZScsICdzb3J0JywgJ3RvZ2dsZUZpbHRlckludmFsaWQnLCAndHJhbnNwb3NlJyxcclxuICAgICAgJ2FkZFdpbGRjYXJkRmllbGQnLCAnYWRkV2lsZGNhcmQnLCAncmVtb3ZlV2lsZGNhcmRGaWVsZCcsICdyZW1vdmVXaWxkY2FyZCdcclxuICAgIF0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lclR5cGUpIHtcclxuICAgICAgUGlsbHNbbGlzdGVuZXJUeXBlXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChQaWxscy5saXN0ZW5lciAmJiBQaWxscy5saXN0ZW5lcltsaXN0ZW5lclR5cGVdKSB7XHJcbiAgICAgICAgICByZXR1cm4gUGlsbHMubGlzdGVuZXJbbGlzdGVuZXJUeXBlXS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBjaGFubmVsIGlkIGlzIGFuIFwiYW55XCIgY2hhbm5lbFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7YW55fSBjaGFubmVsSWRcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gaXNBbnlDaGFubmVsKGNoYW5uZWxJZCkge1xyXG4gICAgICByZXR1cm4gY2hhbm5lbElkICYmIGNoYW5uZWxJZC5pbmRleE9mKEFOWSkgPT09IDA7IC8vIHByZWZpeCBieSBBTllcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldGtleXMoeCkge1xyXG4gICAgICB2YXIga2V5cyA9IFtdLCBrO1xyXG4gICAgICBmb3IgKGsgaW4geCkge2tleXMucHVzaChrKTt9XHJcbiAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2V0RW1wdHlBbnlDaGFubmVsSWQoKSB7XHJcbiAgICAgIHZhciBhbnlDaGFubmVscyA9IGdldGtleXMoUGlsbHMucGlsbHMpLmZpbHRlcihmdW5jdGlvbihjaGFubmVsSWQpIHtcclxuICAgICAgICByZXR1cm4gY2hhbm5lbElkLmluZGV4T2YoQU5ZKSA9PT0gMDtcclxuICAgICAgfSk7XHJcbiAgICAgIGZvciAodmFyIGk9MCA7IGkgPCBhbnlDaGFubmVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBjaGFubmVsSWQgPSBhbnlDaGFubmVsc1tpXTtcclxuICAgICAgICBpZiAoIVBpbGxzLnBpbGxzW2NoYW5uZWxJZF0uZmllbGQpIHtcclxuICAgICAgICAgIHJldHVybiBjaGFubmVsSWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZW1wdHkgYW55IGNoYW5uZWwgYXZhaWxhYmxlIScpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldE5leHRBbnlDaGFubmVsSWQoKSB7XHJcbiAgICAgIHZhciBpID0gMDtcclxuICAgICAgd2hpbGUgKFBpbGxzLnBpbGxzW0FOWSArIGldKSB7XHJcbiAgICAgICAgaSsrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWNvbnN0cy5tYXhBbnlTaGVsZiB8fCBpID49IGNvbnN0cy5tYXhBbnlTaGVsZikge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gQU5ZICsgaTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBhIGZpZWxkRGVmIG9mIGEgcGlsbCBvZiBhIGdpdmVuIGNoYW5uZWxJZFxyXG4gICAgICogQHBhcmFtIGNoYW5uZWxJZCBjaGFubmVsIGlkIG9mIHRoZSBwaWxsIHRvIGJlIHVwZGF0ZWRcclxuICAgICAqIEBwYXJhbSBmaWVsZERlZiBmaWVsZERlZiB0byB0byBiZSB1cGRhdGVkXHJcbiAgICAgKiBAcGFyYW0gdXBkYXRlIHdoZXRoZXIgdG8gcHJvcGFnYXRlIGNoYW5nZSB0byB0aGUgY2hhbm5lbCB1cGRhdGUgbGlzdGVuZXJcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc2V0KGNoYW5uZWxJZCwgZmllbGREZWYsIHVwZGF0ZSkge1xyXG4gICAgICBQaWxscy5waWxsc1tjaGFubmVsSWRdID0gZmllbGREZWY7XHJcblxyXG4gICAgICBpZiAodXBkYXRlICYmIFBpbGxzLmxpc3RlbmVyKSB7XHJcbiAgICAgICAgUGlsbHMubGlzdGVuZXIuc2V0KGNoYW5uZWxJZCwgZmllbGREZWYpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgYSBmaWVsZERlZiBvZiBhIHBpbGwgb2YgYSBnaXZlbiBjaGFubmVsSWRcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0KGNoYW5uZWxJZCkge1xyXG4gICAgICByZXR1cm4gUGlsbHMucGlsbHNbY2hhbm5lbElkXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc0VudW1lcmF0ZWRDaGFubmVsKGNoYW5uZWxJZCkge1xyXG4gICAgICBpZiAoUGlsbHMubGlzdGVuZXIgJiYgUGlsbHMubGlzdGVuZXIuaXNFbnVtZXJhdGVkQ2hhbm5lbCkge1xyXG4gICAgICAgIHJldHVybiBQaWxscy5saXN0ZW5lci5pc0VudW1lcmF0ZWRDaGFubmVsKGNoYW5uZWxJZCwgUGlsbHMucGlsbHNbY2hhbm5lbElkXSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzRW51bWVyYXRlZEZpZWxkKGNoYW5uZWxJZCkge1xyXG4gICAgICBpZiAoUGlsbHMubGlzdGVuZXIgJiYgUGlsbHMubGlzdGVuZXIuaXNFbnVtZXJhdGVkRmllbGQpIHtcclxuICAgICAgICByZXR1cm4gUGlsbHMubGlzdGVuZXIuaXNFbnVtZXJhdGVkRmllbGQoY2hhbm5lbElkLCBQaWxscy5waWxsc1tjaGFubmVsSWRdKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVtb3ZlKGNoYW5uZWxJZCkge1xyXG4gICAgICBkZWxldGUgUGlsbHMucGlsbHNbY2hhbm5lbElkXTtcclxuICAgICAgaWYgKFBpbGxzLmxpc3RlbmVyKSB7XHJcbiAgICAgICAgUGlsbHMubGlzdGVuZXIucmVtb3ZlKGNoYW5uZWxJZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7YW55fSBwaWxsIHBpbGwgYmVpbmcgZHJhZ2dlZFxyXG4gICAgICogQHBhcmFtIHthbnl9IGNpZERyYWdGcm9tIGNoYW5uZWwgaWQgdGhhdCB0aGUgcGlsbCBpcyBkcmFnZ2VkIGZyb21cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZHJhZ1N0YXJ0KHBpbGwsIGNpZERyYWdGcm9tKSB7XHJcbiAgICAgIFBpbGxzLmRyYWdnaW5nID0gcGlsbDtcclxuICAgICAgUGlsbHMuaXNEcmFnZ2luZ1dpbGRjYXJkID0gY3FsLmVudW1TcGVjLmlzRW51bVNwZWMocGlsbC5maWVsZCk7XHJcbiAgICAgIFBpbGxzLmNpZERyYWdGcm9tID0gY2lkRHJhZ0Zyb207XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFN0b3AgcGlsbCBkcmFnZ2luZyAqL1xyXG4gICAgZnVuY3Rpb24gZHJhZ1N0b3AoKSB7XHJcbiAgICAgIFBpbGxzLmRyYWdnaW5nID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZW4gYSBwaWxsIGlzIGRyb3BwZWRcclxuICAgICAqIEBwYXJhbSBjaWREcmFnVG8gIGNoYW5uZWxJZCB0aGF0J3MgdGhlIHBpbGwgaXMgYmVpbmcgZHJhZ2dlZCB0b1xyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkcmFnRHJvcChjaWREcmFnVG8pIHtcclxuICAgICAgaWYgKFBpbGxzLmxpc3RlbmVyKSB7XHJcbiAgICAgICAgUGlsbHMubGlzdGVuZXIuZHJhZ0Ryb3AoY2lkRHJhZ1RvLCBQaWxscy5jaWREcmFnRnJvbSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUGlsbHM7XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFNlcnZpY2UgZm9yIHNlcnZpbmcgVkwgU2NoZW1hXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmFjdG9yeSgnU2NoZW1hJywgZnVuY3Rpb24odmxTY2hlbWEpIHtcclxuICAgIHZhciBTY2hlbWEgPSB7fTtcclxuXHJcbiAgICBTY2hlbWEuc2NoZW1hID0gdmxTY2hlbWE7XHJcblxyXG4gICAgU2NoZW1hLmdldENoYW5uZWxTY2hlbWEgPSBmdW5jdGlvbihjaGFubmVsKSB7XHJcbiAgICAgIHZhciBkZWYgPSBudWxsO1xyXG4gICAgICB2YXIgZW5jb2RpbmdDaGFubmVsUHJvcCA9IFNjaGVtYS5zY2hlbWEuZGVmaW5pdGlvbnMuRW5jb2RpbmcucHJvcGVydGllc1tjaGFubmVsXTtcclxuICAgICAgLy8gZm9yIGRldGFpbCwganVzdCBnZXQgdGhlIGZsYXQgdmVyc2lvblxyXG4gICAgICB2YXIgcmVmID0gZW5jb2RpbmdDaGFubmVsUHJvcCA/XHJcbiAgICAgICAgKGVuY29kaW5nQ2hhbm5lbFByb3AuJHJlZiB8fCBlbmNvZGluZ0NoYW5uZWxQcm9wLm9uZU9mWzBdLiRyZWYpIDpcclxuICAgICAgICAnRmllbGREZWYnOyAvLyBqdXN0IHVzZSB0aGUgZ2VuZXJpYyB2ZXJzaW9uIGZvciBBTlkgY2hhbm5lbFxyXG4gICAgICBkZWYgPSByZWYuc2xpY2UocmVmLmxhc3RJbmRleE9mKCcvJykrMSk7XHJcbiAgICAgIHJldHVybiBTY2hlbWEuc2NoZW1hLmRlZmluaXRpb25zW2RlZl07XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBTY2hlbWE7XHJcbiAgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
