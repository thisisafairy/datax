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
angular.module("vlui").run(["$templateCache", function($templateCache) {$templateCache.put("dataset/changeloadeddataset.html","<div class=\"change-loaded-dataset\"><div ng-if=\"userData.length\"><h3>已定义的指标</h3><input type=\"text\" class=\"full-width\" placeholder=\"快速查找指标\" ng-keyup=\"SearchChange($event)\"><ul><li ng-show=\"dataset.hidden!=\'true\'\" ng-repeat=\"dataset in userData track by dataset.id\" ng-class=\"{selected: Dataset.currentDataset.id === dataset.id}\"><a class=\"dataset\" ng-click=\"selectDataset(dataset)\" ng-disabled=\"Dataset.currentDataset.id === dataset.id\"><i class=\"fa fa-database\"></i> <strong>{{dataset.name}}</strong></a> <span ng-if=\"dataset.description\">{{dataset.description}}</span> <strong ng-if=\"Dataset.currentDataset === dataset\">(已选中)</strong></li></ul><h3>请点击选择</h3></div></div>");
$templateCache.put("dataset/datasetmodal.html","<modal id=\"dataset-modal\" max-width=\"800px\"><div class=\"modal-header\"><modal-close-button></modal-close-button><h2>选择指标</h2></div><div class=\"modal-main\"><tabset><tab heading=\"可用指标\"><change-loaded-dataset></change-loaded-dataset></tab></tabset></div></modal>");
$templateCache.put("dataset/datasetselector.html","<button id=\"select-data\" class=\"btn btn-default btn-xs\" ng-click=\"loadDataset();\"><span class=\"glyphicon glyphicon-cloud-download\"></span>选择指标</button>");
$templateCache.put("components/ecchannel/ecchannel.html","<div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label\">{{ channelTitle }}</div><div class=\"field-drop\" ng-model=\"thismodal\" data-drop=\"canDrag == \'1\'\" jqyoui-droppable=\"{onDrop:\'FieldDropped()\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"selected full-width field-info\" ng-show=\"field.field\"><span class=\"hflex full-width\"><span class=\"type-caret drop-target active\" ng-show=\"canDrop == \'1\'\"><i ng-if=\"dropType!=\'filters\'\" class=\"fa fa-caret-down\"></i><i ng-if=\"dropType==\'filters\'\" class=\"fa fa-filter\"></i></span> <span title=\"{{ field.field }}\" class=\"field-info-text\">{{ field.field }}</span> <span title=\"计算表达式配置\" class=\"count-caret drop-target active\" ng-show=\"field.aggregate == \'count\'\"><i class=\"fa fa-calculator\" style=\"cursor:pointer;\"></i>&nbsp;</span> <span class=\"no-shrink remove\"><a class=\"remove-field\" ng-click=\"removeAction()\"><i class=\"fa fa-times\"></i></a></span></span></span> <span class=\"placeholder\" ng-show=\"!field.field && canDrag == \'1\'\">将字段拖到此处</span></div></div><div class=\"drop-container\"><div class=\"popup-menu echart-type\"><div ng-if=\"field.type == \'temporal\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-5\">日期取值</label><div class=\"col-sm-5\"><select ng-model=\"field.vtype\" style=\"width:110px\"><option value=\"year\">年</option><option value=\"month\">月</option><option value=\"day\">日</option><option value=\"quate\">季度</option><option value=\">\">年月日</option><option value=\">=\">年月</option><option value=\"<\">年季度</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">时间格式</label><div class=\"col-sm-5\"><select ng-model=\"field.dateformat\" style=\"width:110px\"><option value=\"year\">yyyy-MM-dd</option><option value=\"month\">yyyy/MM/dd</option></select></div></div></div><div class=\"form-group clearfix\" ng-if=\"dropType!=\'filter\'&&dropType!=\'filters\'&&field.aggregate!=\'count\'&&field.aggregate!=\'count_sum\'&&channelTitle.indexOf(\'维度\')<0&&channelTitle.indexOf(\'地区\')<0\" style=\"width:200px\"><label class=\"col-sm-6\">统计方式</label><div class=\"col-sm-4\"><select class=\"full-width\" ng-model=\"field.aggregate\"><option value=\"sum\">加总</option><option value=\"mean\">平均</option><option value=\"max\">最大</option><option value=\"min\">最小</option><option value=\"rank\">排名</option><option value=\"grouprank\">组内排名</option><option value=\"topn\">前N名</option><option value=\"lastn\">后N名</option><option value=\"topnp\">前N%名</option><option value=\"lastnp\">后N%名</option><option value=\"yp\">同期数值</option><option value=\"yppercent\">同比%</option><option value=\"mp\">环比数值</option><option value=\"mppercent\">环比%</option></select></div><div class=\"col-sm-2\"><input placeholder=\"N\" ng-model=\"field.aggregatevalue\" style=\"width:100%\" type=\"text\" ng-show=\"field.aggregate==\'topn\'||field.aggregate==\'lastn\'||field.aggregate==\'topnp\'||field.aggregate==\'lastnp\'\"></div></div><div ng-if=\"dropType == \'type\'\" style=\"width:230px\"><div class=\"form-group clearfix\"><label class=\"col-sm-5\">文字显示</label><div class=\"col-sm-5\"><input type=\"text\" class=\"full-width\" ng-model=\"field.rename\" style=\"width:110px\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">颜色默认</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.autoColor\"></div></div><div class=\"form-group clearfix\" ng-show=\"field.autoColor == \'false\'\"><label class=\"col-sm-5\">颜色</label><div class=\"col-sm-5\"><input type=\"text\" class=\"full-width color-input\" ng-blur=\"setMixColor()\" ng-model=\"mix_color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">数据形状</label><div class=\"col-sm-5\"><select ng-model=\"field.truetype\" style=\"width:110px\"><option value=\"bar\">柱状</option><option value=\"line\">线性</option><option value=\"area\">区域图</option><option value=\"linestep\">阶梯</option></select></div></div><div class=\"form-group clearfix\" ng-show=\"field.truetype==\'bar\'\"><label class=\"col-sm-5\">度量位置</label><div class=\"col-sm-5\"><select ng-model=\"field.label.normal.position\" style=\"width:110px\"><option value=\"left\">left</option><option value=\"right\">right</option><option value=\"top\">top</option><option value=\"bottom\">bottom</option><option value=\"inside\">inside</option><option value=\"insideTop\">insideTop</option><option value=\"insideLeft\">insideLeft</option><option value=\"insideRight\">insideRight</option><option value=\"insideBottom\">insideBottom</option><option value=\"insideTopLeft\">insideTopLeft</option><option value=\"insideTopRight\">insideTopRight</option><option value=\"insideBottomLeft\">insideBottomLeft</option><option value=\"insideBottomRight\">insideBottomRight</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">度量显示</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.normal.show\"></div><label class=\"col-sm-4\">度量单位</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.ylabelunit\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">度量翻转</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"\'90\'\" ng-false-value=\"\'0\'\" ng-model=\"field.label.normal.rotate\"></div><label class=\"col-sm-4\">度量倾斜</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"\'45\'\" ng-false-value=\"\'0\'\" ng-model=\"field.label.normal.rotate\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">度量偏移量</label><div class=\"col-sm-2\"><input type=\"text\" class=\"full-width\" ng-model=\"field.label.offset\"></div><label class=\"col-sm-4\">度量颜色</label><div class=\"col-sm-2\"><input type=\"text\" class=\"full-width color-label\" ng-model=\"field.label.normal.color\"></div></div><div class=\"form-group clearfix\" ng-show=\"field.truetype!=\'bar\'\"><label class=\"col-sm-4\">是否平滑</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.smooth\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">坐标单位</label><div class=\"col-sm-2\"><input type=\"text\" class=\"full-width\" ng-model=\"field.yunit\"></div><label class=\"col-sm-4\">小数位数</label><div class=\"col-sm-2\"><input type=\"text\" class=\"full-width\" ng-model=\"field.unitcount\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">Max标志</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.showmax\"></div><label class=\"col-sm-4\">Min标志</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.showmin\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">阶梯显示</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.basebar\"></div><label class=\"col-sm-4\">累计显示</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.sumbar\"></div></div><div class=\"form-group clearfix\"></div><div class=\"form-group clearfix\" ng-show=\"field.truetype==\'bar\'\"><label class=\"col-sm-4\">对比背景柱</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.shadowbar\"></div><label class=\"col-sm-4\">对比柱前置</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.shadowbarfront\"></div></div><div class=\"form-group clearfix\" ng-show=\"field.truetype==\'bar\'\"><label class=\"col-sm-4\">对比红线</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.shadowline\"></div></div><div class=\"form-group clearfix\"></div><div class=\"form-group clearfix\" ng-show=\"field.shownewy\"><label class=\"col-sm-4\">右Y轴</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.newy\"></div><label class=\"col-sm-4\">右Y轴反转</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.inversey\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">均值线</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.showline\"></div><label class=\"col-sm-4\">警示线条数</label><div class=\"col-sm-2\"><input type=\"text\" class=\"full-width\" ng-model=\"field.alertscount\" ng-blur=\"alertBlur()\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">柱不同色</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.diffcolors\"></div><label class=\"col-sm-4\">限制单柱宽</label><div class=\"col-sm-2\"><input type=\"text\" class=\"full-width\" ng-model=\"field.maxwidth\"></div></div><div class=\"form-group clearfix\" ng-repeat=\"alertModel in field.alertsConfigs track by $index\"><label class=\"col-sm-3\"><input type=\"text\" ng-model=\"alertModel.name\" style=\"width:50px\"></label><div class=\"col-sm-4\">值<input type=\"text\" ng-model=\"alertModel.value\" style=\"width:50px\"></div><div class=\"col-sm-5\">颜色<input type=\"text\" class=\"full-width alertcolor\" ng-model=\"alertModel.color\" style=\"width:60px\" idx=\"{{ $index }}\"></div></div></div><div style=\"width: 250px;\" ng-if=\"dropType == \'dbar\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">定义均值线</label><div class=\"col-sm-2\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"field.showavgline\"></div></div><div class=\"form-group clearfix\" ng-show=\"field.showavgline==true\"><label class=\"col-sm-4\">纵轴均值</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width alertcolor\" ng-model=\"field.avglinevalue\" style=\"width:30px\">%</div></div></div><div style=\"width: 250px;\" ng-if=\"dropType == \'label\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-5\">文字显示</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.show\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">文本位置</label><div class=\"col-sm-5\"><select class=\"full-width\" ng-model=\"field.label.position\"><option value=\"outside\">外侧</option><option value=\"inside\">内部</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">百分比显示</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.showpercent\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">数值显示</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.showsums\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">文本显示</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.showDimeno\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">玫瑰图</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.showrose\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-5\">南丁格尔玫瑰</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.label.showrosend\"></div></div></div><div style=\"width: 250px;\" ng-if=\"dropType == \'mixedtype\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-6\">维度分组</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.isgroup\"></div></div></div><div style=\"width: 250px;\" ng-if=\"dropType == \'mixedtype\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">维度文字大小</label><div class=\"col-sm-2\"><input type=\"input\" ng-model=\"field.xlabelsize\" style=\"width:45px\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">度量文字大小</label><div class=\"col-sm-2\"><input type=\"input\" ng-model=\"field.ylabelsize\" style=\"width:45px\"></div></div></div><div style=\"width: 250px;\" ng-if=\"dropType == \'mixedtype\'||dropType == \'label\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-5\">维度值合并</label><div class=\"col-sm-5\">合并成<input type=\"text\" class=\"full-width\" ng-model=\"field.selfgroupcount\" style=\"width:30px\" ng-blur=\"groupcountBlur()\">组</div></div><div class=\"form-group clearfix\" ng-repeat=\"groupModel in field.groupConfigs track by $index\"><label class=\"col-sm-4\"><input type=\"text\" ng-model=\"groupModel.name\" style=\"width:60px\"></label><div class=\"col-sm-4\">初值<input type=\"text\" ng-model=\"groupModel.valuestart\" style=\"width:45px\"></div><div class=\"col-sm-4\">终值<input type=\"text\" ng-model=\"groupModel.valueend\" style=\"width:45px\"></div></div></div><div style=\"width:180px\" ng-if=\"dropType == \'style\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-6\">极简模式</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.simplemode\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">文字显示</label><div class=\"col-sm-5\"><input type=\"text\" class=\"full-width\" ng-model=\"field.name\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">文本位置</label><div class=\"col-sm-6\"><select ng-model=\"field.style.title.verticalAlign\" style=\"width:70%\"><option value=\"top\">上</option><option value=\"bottom\">下</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">百分比</label><div class=\"col-sm-5\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.showPercent\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">小数点位数</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0; padding: 0;width:70%;float:left;\" min=\"0\" max=\"3\" model-max=\"field.decimals\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:20px;height:16px\" ng-model=\"field.decimals\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">数值大小</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0; padding: 0;width:70%;float:left;\" min=\"10\" max=\"50\" model-max=\"field.style.detail.fontSize\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:20px;height:16px\" ng-model=\"field.style.detail.fontSize\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">文本大小</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;width:70%;float:left;\" min=\"10\" max=\"50\" model-max=\"field.style.title.fontSize\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:20px;height:16px\" ng-model=\"field.style.title.fontSize\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">表盘粗细</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;width:70%;float:left;\" min=\"1\" max=\"60\" model-max=\"field.style.axisLine.lineStyle.width\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:20px;height:16px\" ng-model=\"field.style.axisLine.lineStyle.width\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">隐藏刻度</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.hidesplits\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">刻度长度</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;width:70%;float:left;\" min=\"1\" max=\"100\" model-max=\"field.style.axisTick.length\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:20px;height:16px\" ng-model=\"field.style.axisTick.length\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">分割长度</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;width:70%;float:left;\" min=\"5\" max=\"100\" model-max=\"field.style.splitLine.length\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:20px;height:16px\" ng-model=\"field.style.splitLine.length\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">填充宽度</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;width:70%;float:left;\" min=\"8\" max=\"100\" model-max=\"field.fullwidth\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:20px;height:16px\" ng-model=\"field.fullwidth\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">指针颜色</label><div class=\"col-sm-6\"><input type=\"text\" class=\"full-width split-color-input\" rel=\"pointer\" ng-blur=\"setPointColor(\'pointer\')\" ng-model=\"field.style.itemStyle.normal.color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">刻度颜色</label><div class=\"col-sm-6\"><input type=\"text\" class=\"full-width split-color-input\" rel=\"normal\" ng-blur=\"setPointColor(\'split\')\" ng-model=\"field.splitcolor\"></div></div><div class=\"form-group clearfix\" style=\"display:none;\"><label class=\"col-sm-6\">分段</label><div class=\"col-sm-6\"><input type=\"text\" class=\"full-width\" ng-model=\"field.range\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">动态分段</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.autoSplit\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">动态最大值</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.autoMax\"></div></div><div class=\"form-group clearfix\" ng-if=\"field.autoMax == \'false\'\"><label class=\"col-sm-6\">最大值</label><div class=\"col-sm-6\"><input type=\"text\" class=\"full-width\" ng-model=\"field.max\"></div></div></div><div style=\"width: 200px;\" ng-if=\"dropType == \'mappoint\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width point-color-input\" rel=\"normal\" ng-blur=\"setPointColor(\'normal\')\" ng-model=\"point_color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">突出显示</label><div class=\"col-sm-4\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.iftop\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">排序</label><div class=\"col-sm-4\"><select class=\"full-width\" ng-model=\"field.order\"><option value=\"asc\">顺序</option><option value=\"desc\">倒序</option></select></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">显示数量</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width\" ng-model=\"field.order_num\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">突出颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width point-color-input\" rel=\"top\" ng-blur=\"setPointColor(\'top\')\" ng-model=\"point_top_color\"></div></div></div><div style=\"width: 200px;\" ng-if=\"dropType == \'single\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">标题</label><div class=\"col-sm-8\"><input type=\"text\" class=\"full-width\" ng-model=\"field.label\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">标题大小</label><div class=\"col-sm-8\"><div style=\"width: 80%;margin: 0;float:left\" range-slider=\"\" min=\"12\" max=\"24\" model-max=\"field._titleFontsize\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:22px;height:18px\" ng-model=\"field._titleFontsize\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">标题颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width single-color\" rel=\"single_title\" ng-blur=\"setPointColor(\'single_title\')\" ng-model=\"single_title_color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">数值大小</label><div class=\"col-sm-8\"><div style=\"width: 80%;margin: 0;float:left\" range-slider=\"\" min=\"12\" max=\"24\" model-max=\"field._valueFontsize\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:22px;height:18px\" ng-model=\"field._valueFontsize\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">数值颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width single-color\" rel=\"single_value\" ng-blur=\"setPointColor(\'single_value\')\" ng-model=\"single_value_color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">单位</label><div class=\"col-sm-8\"><input type=\"text\" class=\"full-width\" ng-model=\"field.unit\"></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">增长图标</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"\'true\'\" ng-false-value=\"\'false\'\" ng-model=\"field.plusicon\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">指标值位置</label><div class=\"col-sm-8\"><select class=\"full-width\" ng-model=\"field.aimfloat\"><option value=\"left\">靠左</option><option value=\"center\">居中</option><option value=\"right\">靠右</option></select></div></div></div></div><div style=\"width: 200px;\" ng-if=\"dropType == \'filter\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">当前日期</label><div class=\"col-sm-8\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'0\'\" ng-model=\"field.ifAuto\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">手动日期</label><div class=\"col-sm-8\"><input type=\"text\" ng-model=\"field.value\" ng-disabled=\"field.ifAuto == \'1\'\"></div></div></div><div style=\"width: 550px;max-height:500px;overflow-y: auto;\" ng-if=\"dropType == \'filters\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-2\">自定义过滤</label><div class=\"col-sm-6\"><a ng-click=\"addAnd()\" style=\"cursor:pointer;\"><i class=\"fa fa-plus\"></i>增加条件</a></div></div><table style=\"width:100%;border-collapse: collapse;border-left: 1px solid #e8eaed;border-top: 1px solid #e8eaed;\" cellspacing=\"0\" cellpadding=\"0\"><tr ng-repeat=\"eachrule in getChilds(\'0\') track by crule.id\" ng-init=\"eachrule = eachrule\" ng-include=\"\'item_renderer.html\'\"></tr></table></div><script id=\"item_renderer.html\" type=\"text/ng-template\"><td> <table style=\"width:100%;border-collapse:collapse\" cellspacing=\"0\" cellpadding=\"0\"> <tr> <td rowspan=\"{{ getChilds(eachrule.id).length }}\" ng-if=\"getChilds(eachrule.id).length>1\" style=\"vertical-align: middle;width:20px;border-bottom: 1px solid #e8eaed;border-right: 1px solid #e8eaed;padding:3px;\"> <div>{{ eachrule.relate==\"and\"?\"且\":\"或\" }}</div> </td> <td ng-if=\"eachrule.rule!=\'\'\" style=\"width:120px;border-bottom: 1px solid #e8eaed;padding:5px;\" ng-click=\"filterRowClick($event,eachrule,parentRule)\"> <select ng-model=\"eachrule.name\" style=\"width:110px\" ng-options=\"vale.field as vale.field for vale in getAllCols() | orderBy : orderBy\"></select> </td> <td ng-if=\"eachrule.rule!=\'\'\" style=\"width:90px;border-bottom: 1px solid #e8eaed;padding:5px;\" ng-click=\"filterRowClick($event,eachrule,parentRule)\"> <select ng-model=\"eachrule.rule\" style=\"width:80px\"> <option value=\"==\">等于</option> <option value=\"!=\">不等于</option> <option value=\"like\">包含</option> <option value=\"notlike\">不包含</option> <option value=\"in\">属于</option> <option value=\"notin\">不属于</option> <option value=\"null\">空</option> <option value=\"notnull\">非空</option> <option value=\">\">大于</option> <option value=\">=\">大于等于</option> <option value=\"<\">小于</option> <option value=\"<=\">小于等于</option> <option value=\"s=\">以..开始</option> <option value=\"e=\">以..结束</option> <option value=\"nots=\">不以..开始</option> <option value=\"note=\">不以..结束</option> </select> </td> <td ng-if=\"eachrule.rule!=\'\'\" style=\"border-bottom: 1px solid #e8eaed;padding:5px;\" ng-click=\"filterRowClick($event,eachrule,parentRule)\"> <input type=\"text\" ng-model=\"eachrule.value\" ng-model-options=\"{updateOn: \'blur\'}\" style=\"width:100%\" ng-show=\"eachrule.rule!=\'null\'&&eachrule.rule!=\'notnull\'\"> </td> <td ng-if=\"eachrule.rule!=\'\'\" style=\"width:70px;border-bottom: 1px solid #e8eaed;border-right: 1px solid #e8eaed;padding:5px;\" ng-click=\"filterRowClick($event,eachrule,parentRule)\"> <a title=\"增加同级且条件\" ng-click=\"addAnd(eachrule)\" style=\"cursor:pointer;\"> <i class=\"fa fa-plus\"></i> </a>&nbsp; <a title=\"增加同级或条件\" ng-click=\"addOr(eachrule)\" style=\"cursor:pointer;\"> <i class=\"fa fa-plus-circle\"></i> </a>&nbsp; <a title=\"删除条件\" ng-click=\"removeFilter(eachrule)\" style=\"cursor:pointer;\"> <i class=\"fa fa-minus\"></i> </a> </td> <td> <table style=\"width:100%;border-collapse:collapse\" cellspacing=\"0\" cellpadding=\"0\"> <tr ng-repeat=\"crule in getChilds(eachrule.id) track by crule.id\" ng-init=\"eachrule = crule\" ng-include=\"\'item_renderer.html\'\"></tr> </table> </td> </tr> </table> </td></script></div><div class=\"popup-menu count-type\"><div style=\"width: 450px;\" ng-if=\"field.aggregate == \'count\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-2\">指标重命名</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width\" ng-model=\"field.field\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-4\">可用计算字段(点选)</label><div class=\"col-sm-8\">运算符(点选) &nbsp;&nbsp; <span class=\"field-func\" ng-click=\"addFieldCalc(\'+\')\" style=\"cursor:pointer;font-size:14px;\">+</span>&nbsp;&nbsp;&nbsp; <span class=\"field-func\" ng-click=\"addFieldCalc(\'-\')\" style=\"cursor:pointer;font-size:14px;\">-</span> &nbsp;&nbsp;&nbsp; <span class=\"field-func\" ng-click=\"addFieldCalc(\'*\')\" style=\"cursor:pointer;font-size:14px;\">*</span>&nbsp;&nbsp;&nbsp; <span class=\"field-func\" ng-click=\"addFieldCalc(\'/\')\" style=\"cursor:pointer;font-size:14px;\">/</span>&nbsp;&nbsp;&nbsp; <span class=\"field-func\" ng-click=\"addFieldCalc(\'(\')\" style=\"cursor:pointer;font-size:14px;\">(</span>&nbsp;&nbsp;&nbsp; <span class=\"field-func\" ng-click=\"addFieldCalc(\')\')\" style=\"cursor:pointer;font-size:14px;\">)</span></div></div><div class=\"form-group clearfix\"><div class=\"col-sm-4 calc_div_fields scroll-y\" style=\"max-height:250px;\"><div ng-click=\"addFieldCalc(value.field)\" data-drag=\"true\" style=\"margin-top:3px;width:120px;overflow-x: hidden;cursor:pointer\" jqyoui-draggable=\"{deepCopy: true, onStart: \'dragstart\', onStop:\'dragstop\'}\" data-jqyoui-options=\"{revert: \'invalid\', helper: \'clone\'}\" class=\"selected full-width field-info\" ng-repeat=\"value in getAllCols() | orderBy : orderBy\">{{value.field}}</div></div><div class=\"col-sm-8 field-drop\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'dropComplete\'}\"><textarea style=\"width:100%;height:220px;font-size:12px;\" ng-keydown=\"deleteWords($event)\" ng-model=\"field.calcrules\" placeholder=\"例:已完成额/目标值\"></textarea><div>公式校验: {{ calcheck }}</div></div></div></div></div></div></div><div class=\"shelf-group\" ng-if=\"moreDrag && field.autoMax == \'true\'\"><div class=\"shelf\"><div class=\"shelf-label\">最大值</div><div class=\"field-drop\" ng-model=\"field.maxField\" data-drop=\"true\" jqyoui-droppable=\"{}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"selected full-width field-info\"><span class=\"hflex full-width\"><span class=\"field-info-text\">{{ field.maxField.field }}</span></span></span> <span class=\"placeholder\" ng-show=\"!field.field && canDrag == \'1\'\">此为 {{ field.field }} 的 最大值</span></div></div></div><div class=\"shelf-group\" ng-if=\"moreDrag && field.isgroup == \'true\'||field.aggregate==\'grouprank\'\"><span class=\"field-info-text\"><div class=\"shelf\"><div class=\"shelf-label\">分组字段</div><div class=\"field-drop\" ng-model=\"field.groupField\" data-drop=\"true\" jqyoui-droppable=\"{}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"selected full-width field-info\"><span class=\"hflex full-width\">{{ field.groupField.field }}</span></span> <span class=\"placeholder\" ng-show=\"!field.field && canDrag == \'1\'\">此为 {{ field.field }} 的 最大值</span></div></div></span></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"moreDrag && field.autoSplit == \'true\'\"><div class=\"shelf-group\"><div class=\"shelf\" ng-repeat=\"splitModel in field.splitField track by $index\"><div class=\"shelf-label\">刻度分段{{ ($index+1) }}</div><div class=\"field-drop\"><span class=\"selected full-width field-info\"><span class=\"hflex full-width\"><span class=\"type-caret{{ $index }} drop-target active\" ng-show=\"canDrop == \'1\'\" ng-click=\"showSplitPop($index)\"><i class=\"fa fa-caret-down\"></i></span> <span title=\"{{ splitModel.field }}\" class=\"field-info-text\">{{ splitModel.field }}</span> <span class=\"no-shrink remove\"><a class=\"remove-field\" ng-click=\"removeSplit()\"><i class=\"fa fa-times\"></i></a></span></span></span></div><div class=\"drop-container\"><div class=\"popup-menu echart-type{{ $index }}\"><div ng-if=\"field.autoSplit == \'true\'\"><div class=\"form-group clearfix\"><label class=\"col-sm-4\">分段颜色</label><div class=\"col-sm-4\"><input type=\"text\" class=\"full-width split-color{{ $index }}\" ng-blur=\"setSplitColor(\'split\',$index)\" ng-model=\"splitModel.color\"></div></div><div class=\"form-group clearfix\"><label class=\"col-sm-6\">指定分段长度</label><div class=\"col-sm-6\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"splitModel.giveLength\"></div></div><div class=\"form-group clearfix\" ng-show=\"splitModel.giveLength==true\"><label class=\"col-sm-6\">分段长度</label><div class=\"col-sm-6\"><div range-slider=\"\" style=\"margin: 0;padding: 0;\" min=\"0\" max=\"50\" model-max=\"splitModel.length\" pin-handle=\"min\"></div></div></div></div></div></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"newmodel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'SplitDropped()\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动刻度分段字段到此处</span></div></div></div></div></div>");
$templateCache.put("components/fieldinfo/fieldinfo.html","<span class=\"field-info\"><span class=\"hflex full-width\" ng-click=\"clicked($event)\"><span class=\"type-caret\" ng-class=\"{active: !disableCaret}\"><span class=\"type fa {{icon}}\" ng-show=\"showType\" title=\"{{typeName}}\"></span></span> <span ng-if=\"fieldDef.aggregate!==\'count\'\" class=\"field-info-text\"><span ng-if=\"func(fieldDef)\" class=\"field-func\" title=\"{{ func(fieldDef) }}\" ng-class=\"{any: fieldDef._any}\">{{ func(fieldDef) }}</span><span class=\"field-name\" title=\"{{ (fieldDef.title || fieldTitle(fieldDef.field)) | underscore2space }}\" ng-class=\"{hasfunc: func(fieldDef), any: fieldDef._any}\">{{ (fieldDef.title || fieldTitle(fieldDef.field)) | underscore2space }}</span> <span class=\"wildcard-field-count\">{{ fieldCount(fieldDef.field) }}</span></span> <span ng-if=\"fieldDef.aggregate===\'count\' || fieldDef.autoCount\" class=\"field-count field-info-text\"><span class=\"field-name\">{{fieldDef.field}}</span></span> <span class=\"no-shrink remove\" ng-show=\"showRemove\"><a class=\"remove-field\" ng-click=\"removeAction()\"><i class=\"fa fa-times\"></i></a></span></span></span>");
$templateCache.put("components/modal/modal.html","<div class=\"ngmodal\" ng-if=\"isOpen\"><div class=\"modal-wrapper\" style=\"{{wrapperStyle}}\" ng-transclude=\"\"></div></div>");
$templateCache.put("components/modal/modalclosebutton.html","<div class=\"right\"><a ng-click=\"closeModal()\" class=\"right\"><i class=\"fa fa-times\"></i></a></div>");
$templateCache.put("components/schemalist/schemalist.html","<div class=\"schema no-top-margin full-width scroll-y\"><schema-list-item ng-repeat=\"fieldDef in fieldDefs | orderBy : orderBy\" field-def=\"fieldDef\" filter-manager=\"filterManager\" show-add=\"showAdd\" ng-if=\"fieldDef.hidden!=\'true\'\"></schema-list-item><schema-list-item ng-if=\"showCount\" field-def=\"countFieldDef\" show-add=\"true\"></schema-list-item><schema-list-item field-def=\"calcFieldDef\" show-add=\"true\"></schema-list-item><div class=\"schema-list-drop\" ng-show=\"showDrop\" ng-model=\"droppedFieldDef\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'fieldDropped\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\">Create a new wildcard.</div></div>");
$templateCache.put("components/schemalist/schemalistitem.html","<div class=\"schema-list-item\" ng-model=\"droppedFieldDef\" data-drop=\"isAnyField && fieldDef.field !== \'?\'\" jqyoui-droppable=\"{onDrop:\'fieldDropped\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><field-info ng-show=\"!isAnyField || fieldDef.field === \'?\' || fieldDef.field.enum.length > 0\" class=\"pill draggable full-width no-right-margin\" ng-class=\"{any: isEnumSpec(fieldDef.field)}\" field-def=\"fieldDef\" ng-model=\"pill\" data-drag=\"true\" jqyoui-draggable=\"{placeholder: \'keep\', deepCopy: true, onStart: \'fieldDragStart\', onStop:\'fieldDragStop\'}\" data-jqyoui-options=\"{revert: \'invalid\', helper: \'clone\'}\" show-add=\"showAdd\" show-caret=\"true\" disable-caret=\"fieldDef.immutable || fieldDef.aggregate === \'count\' || allowedTypes.length<=1\" show-type=\"true\" add-action=\"fieldAdd(fieldDef)\" show-filter=\"!!filterManager\" filter-action=\"toggleFilter()\" use-title=\"true\" popup-content=\"fieldInfoPopupContent\"></field-info></div><div class=\"drop-container\"><div class=\"popup-menu schema-menu\" ng-hide=\"!allowedTypes || allowedTypes.length<=1\"><div class=\"mb5 field-type\" ng-if=\"allowedTypes.length>1 && !isAnyField\"><h4>Type</h4><label class=\"type-label\" ng-repeat=\"type in allowedTypes\" ng-if=\"type !== \'ordinal\' || !consts.hideOrdinalTypeSelect\"><input type=\"radio\" ng-value=\"type\" ng-model=\"fieldDef.type\"> {{type}}</label></div><div class=\"wildcard-menu\" ng-show=\"isAnyField && fieldDef.field.enum\"><div><label class=\"wildcard-title-label\"><h4>Name</h4><input type=\"text\" ng-model=\"fieldDef.title\" placeholder=\"{{fieldTitle(fieldDef.field)}}\"></label></div><h4>Wildcard Fields</h4><div class=\"wildcard-fields\"><field-info ng-repeat=\"field in fieldDef.field.enum\" class=\"pill list-item full-width no-right-margin\" field-def=\"field === \'*\' ? countFieldDef : Dataset.schema.fieldSchema(field)\" show-type=\"true\" show-remove=\"true\" remove-action=\"removeWildcardField($index)\"></field-info></div><a class=\"remove-action\" ng-click=\"removeWildcard()\"><i class=\"fa fa-times\"></i> Delete Wildcard</a></div></div></div>");
$templateCache.put("components/shelves/shelves.html","<div class=\"card vflex shelves no-top-margin no-right-margin abs-100\"><div class=\"full-width\" style=\"position: relative;\" ng-mouseover=\"showmarktype=true\" ng-mouseleave=\"showmarktype=false\"><button type=\"button\" class=\"select-btn\" ng-click=\"showmarktype = !showmarktype\"><i class=\"fa {{ markdetail.icon }}\">{{ markdetail.title }}</i></button><ul class=\"marktype-list\" ng-show=\"showmarktype\"><li ng-repeat=\"type in marksWithAny track by $index\" ng-click=\"changetype(type)\" style=\"cursor:hand;\"><i class=\"fa {{ marksicon[type].icon }}\" style=\"width:20px\"></i> {{ marksicon[type].title }}</li></ul></div><div class=\"shelf-pane shelf-encoding-pane full-width\"><h2 ng-show=\"spec.mark != \'single\'\" ng-click=\"titleShow = !titleShow\">基础配置</h2><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark != \'single\' && titleShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">标题</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-blur=\"setNormalTitle(\'title\');\" ng-model=\"normalTitle\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">标题大小</div><div class=\"field-drop\"><div style=\"width: 80%;margin: 0;\" range-slider=\"\" min=\"5\" max=\"100\" model-max=\"ecconfig.title.textStyle.fontSize\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.title.textStyle.fontSize\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-title\" ng-blur=\"setColor(\'bt\')\" rel=\"bt\" ng-model=\"titletextcolor\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">副标题</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-blur=\"setNormalTitle(\'sub_title\');\" ng-model=\"normalSubTitle\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">标题大小</div><div class=\"field-drop\"><div style=\"width: 80%;margin: 0;\" range-slider=\"\" min=\"10\" max=\"24\" model-max=\"ecconfig.title.subtextStyle.fontSize\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.title.subtextStyle.fontSize\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-title\" ng-blur=\"setColor(\'sbt\')\" rel=\"sbt\" ng-model=\"subtitletextcolor\"></div></div></div><div class=\"shelf-group\" ng-show=\"spec.mark != \'single\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">显示位置</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.title.position\"><option value=\"upleft\">左上</option><option value=\"upcenter\">上中心</option><option value=\"upright\">右上</option><option value=\"downleft\">左下</option><option value=\"downcenter\">下中心</option><option value=\"downright\">右下</option></select></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark != \'bmap\' && spec.mark != \'single\' && themeShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">主题样式</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.theme\"><option value=\"def\">默认</option><option value=\"rabow\">彩虹</option><option value=\"warm\">温暖</option><option value=\"lsoft\">轻柔</option><option value=\"xc\">炫彩</option><option value=\"blue\">蓝色</option><option value=\"red\">红色</option><option value=\"green\">绿色</option><option value=\"daynt\">晚霞</option><option value=\"sotc\">柔彩</option><option value=\"soft\">柔和</option><option value=\"busi\">商务</option><option value=\"told\">怀旧</option><option value=\"feture\">未来</option><option value=\"ged\">格调</option><option value=\"huol\">活力</option><option value=\"rockq\">石青</option><option value=\"modern\">现代</option><option value=\"vitality\">活力四射</option><option value=\"greenGarden\">绿色花园</option><option value=\"roman\">紫丁香</option><option value=\"purple\">紫罗兰</option><option value=\"air\">清新空气</option><option value=\"MT\">MT标准色</option></select></div></div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\' && ecconfig.mapdata.ifBmap != \'1\' && themeShow\"><div class=\"shelf-group\"><div class=\"shelf-label drop-target\">地图样式</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.mapdata.map_theme\"><option value=\"light\">明</option><option value=\"dark\">暗</option></select></div></div></div><h2 ng-click=\"propShow = !propShow\">数据关联</h2><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'single\' && propShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">标题</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-blur=\"setNormalTitle(\'title\');\" ng-model=\"normalTitle\"></div></div></div><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" field=\"ecconfig.field.x\" modal=\"ecconfig\" remove-action=\"removeMix(\'x\',\'0\')\" ng-show=\"ecconfig.field.y[0]&&ecconfig.field.y[0].aggregate==\'rank\'\"></ec-channel><ec-channel channel-title=\"\'分组\'\" can-drag=\"\'1\'\" field=\"ecconfig.field.group\" modal=\"ecconfig\" remove-action=\"removeMix(\'group\',\'1\')\" ng-show=\"ecconfig.field.y[0]&&ecconfig.field.y[0].aggregate==\'rank\'\"></ec-channel><ec-channel drop-type=\"\'single\'\" can-drop=\"\'1\'\" channel-title=\"\'度量\'\" can-drag=\"\'0\'\" channel-key=\"yval\" remove-action=\"removeMix(\'y\',$index)\" ng-repeat=\"yval in ecconfig.field.y track by $index\" field=\"yval\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\" ng-show=\"ecconfig.field.y.length < 4\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"singleModel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'singleFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动字段到此处统计度量度</span></div></div></div></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'pie\' && propShow\"><ec-channel channel-title=\"\'维度\'\" drop-type=\"\'label\'\" can-drop=\"\'1\'\" can-drag=\"\'0\'\" channel-key=\"xkey\" remove-action=\"removeMix(\'x\',$index)\" ng-repeat=\"xval in ecconfig.field.x track by $index\" field=\"xval\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"piexmodel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'piexFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动字段到此处统计维度</span></div></div></div><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'mixed\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" can-drop=\"\'1\'\" more-drag=\"\'true\'\" drop-type=\"\'mixedtype\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" drop-type=\"\'type\'\" can-drop=\"\'1\'\" can-drag=\"\'0\'\" remove-action=\"removeMix(\'y\',$index)\" ng-repeat=\"yval in ecconfig.field.y track by $index\" field=\"yval\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"ymodel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'mixedyFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动数值类字段到此处统计度量</span></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'candlestick\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" more-drag=\"\'true\'\" drop-type=\"\'candlestick\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'start\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'start\',\'0\')\" field=\"ecconfig.field.start\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'end\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'end\',\'0\')\" field=\"ecconfig.field.end\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'max\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'max\',\'0\')\" field=\"ecconfig.field.max\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'min\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'min\',\'0\')\" field=\"ecconfig.field.min\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" drop-type=\"\'candlesticktype\'\" can-drop=\"\'1\'\" can-drag=\"\'0\'\" remove-action=\"removeMix(\'y\',$index)\" ng-repeat=\"yval in ecconfig.field.y track by $index\" field=\"yval\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"ymodel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'kyFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动数值类字段到此处统计度量</span></div></div></div></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'wordCloud\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'treemap\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'tree\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'关联\'\" can-drag=\"\'1\'\" can-drop=\"\'0\'\" remove-action=\"removeMix(\'relate\',\'0\')\" field=\"ecconfig.field.relate\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'graph\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'关联\'\" can-drag=\"\'1\'\" can-drop=\"\'0\'\" remove-action=\"removeMix(\'relate\',\'0\')\" field=\"ecconfig.field.relate\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'sunburst\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'关联\'\" can-drag=\"\'1\'\" can-drop=\"\'0\'\" remove-action=\"removeMix(\'relate\',\'0\')\" field=\"ecconfig.field.relate\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'funnel\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'gauge\' && propShow\"><ec-channel channel-title=\"\'度量\'+($index+1)\" can-drag=\"\'1\'\" more-drag=\"\'true\'\" drop-type=\"\'style\'\" can-drop=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeMix(\'y\',$index)\" ng-repeat=\"gaugemodal in ecconfig.field.y track by $index\" field=\"gaugemodal\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\" ng-show=\"ecconfig.field.y.length < 3\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"gaugeY\" can-drop=\"\'1\'\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'gaugeYFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动数值类字段到此处统计度量</span></div></div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\' && propShow\"><div class=\"shelf-group\"><div class=\"tab active\" ng-class=\"{\'tab1\':\'tab-active\'}[tab]\" ng-click=\"setTab(\'tab1\');\">区域</div><div class=\"tab\" ng-class=\"{\'tab2\':\'tab-active\'}[tab]\" ng-click=\"setTab(\'tab2\');\">标记</div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\' && tab == \'tab1\' && propShow\"><div class=\"shelf-group\" ng-if=\"ecconfig.mapdata.ifBmap == \'1\'\">百度地图不支持区域数据展示</div><ec-channel channel-title=\"\'区域地区\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeArea(\'x\')\" field=\"ecconfig.area.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'区域数值\'\" can-drop=\"\'1\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeArea(\'y\')\" field=\"ecconfig.area.y\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-repeat=\"pointrow in ecconfig.point track by $index\" ng-show=\"spec.mark == \'bmap\' && tab == \'tab2\' && propShow\"><ec-channel channel-title=\"\'标记地区\'\" drop-type=\"\'mappoint\'\" can-drop=\"\'1\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removePoint(\'x\',$index)\" field=\"pointrow.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'标记数值\'\" can-drop=\"\'1\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removePoint(\'y\',$index)\" field=\"pointrow.y\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'经度\'\" can-drop=\"\'0\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removePoint(\'lon\',$index)\" field=\"pointrow.lon\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'纬度\'\" can-drop=\"\'0\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removePoint(\'lat\',$index)\" field=\"pointrow.lat\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-show=\"spec.mark == \'bmap\' && tab == \'tab2\' && propShow\"><div class=\"shelf-group\" ng-show=\"ecconfig.point.length < 3\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"pointModel\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'pointFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动地区字段到此处增加标记</span></div></div></div></div><div class=\"shelf-pane shelf-positional-pane full-width\" ng-if=\"spec.mark == \'bmap\' && propShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">地图包</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.mapbag\"><option value=\"china\">中国</option><option value=\"shanghai\">上海</option></select></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">百度地图</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.mapdata.ifBmap\"></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'dbar\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'横轴度量\'\" can-drag=\"\'1\'\" can-drop=\"\'0\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'纵轴度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" drop-type=\"\'dbar\'\" remove-action=\"removeMix(\'y\',\'1\')\" field=\"ecconfig.field.y[1]\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'scatter\' && propShow\"><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" channel-key=\"\'0\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'横轴度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y[0]\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'纵轴度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'1\')\" field=\"ecconfig.field.y[1]\" modal=\"ecconfig\"></ec-channel></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'radar\' && propShow\"><ec-channel channel-title=\"\'分类\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'legend\',\'0\')\" field=\"ecconfig.field.legend\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'维度\'\" can-drag=\"\'1\'\" remove-action=\"removeMix(\'x\',\'0\')\" field=\"ecconfig.field.x\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'度量\'\" can-drag=\"\'1\'\" can-drop=\"\'1\'\" remove-action=\"removeMix(\'y\',\'0\')\" field=\"ecconfig.field.y\" modal=\"ecconfig\"></ec-channel></div><h2 ng-show=\"hasOption(spec.mark)\" ng-click=\"optionShow = !optionShow\">扩展选项</h2><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"spec.mark == \'mixed\' && optionShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">合并</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.ifmerge\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">缩放</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.roominout\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">转置</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.transpose\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">美化高低值</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.beauty\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">倾斜标签</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.roatetext\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">隐藏坐标系</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.showaxis\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">坐标系内置</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.axisin\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">隐藏分隔线</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.showaxissplitline\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">柱角弧度</div><div class=\"field-drop\"><div style=\"width: 80%;margin: 0;\" range-slider=\"\" min=\"0\" max=\"100\" model-max=\"ecconfig.barradius\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.barradius\"></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-if=\"spec.mark == \'wordCloud\' && optionShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">词云形状</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.shape\"><option value=\"circle\">circle</option><option value=\"cardioid\">cardioid</option><option value=\"diamond\">diamond</option><option value=\"triangle-forward\">triangle-forward</option><option value=\"triangle\">triangle</option><option value=\"pentagon\">pentagon</option><option value=\"star\">star</option></select></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label\">单词大小</div><div class=\"field-drop\"><div range-slider=\"\" style=\"width: 100%;margin: 0;\" show-values=\"true\" step=\"1\" min=\"10\" max=\"100\" model-min=\"ecconfig.sizeRange[0]\" model-max=\"ecconfig.sizeRange[1]\"></div></div></div></div></div><div class=\"shelf-pane shelf-marks-pane full-width\" ng-if=\"spec.mark == \'single\' && optionShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">形式</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.type\"><option value=\"card\">指标卡</option><option value=\"list\">指标条</option></select></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">小数点</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width\" ng-model=\"ecconfig.option.fixed\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">显示千分位</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"true\" ng-false-value=\"false\" ng-model=\"ecconfig.option.thousands\"></div></div></div><div class=\"shelf-group\" ng-show=\"ecconfig.type == \'card\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">外框颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-single\" ng-blur=\"setColor(\'stroke\')\" rel=\"stroke\" ng-model=\"stroke_color\"></div></div></div><div class=\"shelf-group\" ng-show=\"ecconfig.type == \'card\'\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">背景颜色</div><div class=\"field-drop\"><input type=\"text\" class=\"full-width color-input-single\" ng-blur=\"setColor(\'fill\')\" rel=\"fill\" ng-model=\"fill_color\"></div></div></div></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'pie\' && optionShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">圆心距离</div><div class=\"field-drop\"><div range-slider=\"\" min=\"0\" max=\"100\" model-max=\"ecconfig.start_radius\" pin-handle=\"min\" style=\"width:80%;margin:0px\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.start_radius\"></div></div><div class=\"shelf\"><div class=\"shelf-label drop-target\">嵌套间隔</div><div class=\"field-drop\"><div range-slider=\"\" min=\"0\" max=\"100\" model-max=\"ecconfig.radius_range\" pin-handle=\"min\" style=\"width:80%;margin:0px\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.radius_range\"></div></div><div class=\"shelf\"><div class=\"shelf-label drop-target\">填充宽度</div><div class=\"field-drop\"><div range-slider=\"\" min=\"0\" max=\"100\" model-max=\"ecconfig.radius_interval\" pin-handle=\"min\" style=\"width:80%;margin:0px\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.radius_interval\"></div></div><div class=\"shelf\"><div class=\"shelf-label drop-target\">分断显示</div><div class=\"field-drop\"><div range-slider=\"\" min=\"0\" max=\"10\" model-max=\"ecconfig.radius_split\" pin-handle=\"min\" style=\"width:80%;margin:0px\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.radius_split\"></div></div></div></div><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"spec.mark == \'gauge\' && optionShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">合并</div><div claf=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.ifmerge\"></div></div></div></div><h2 ng-show=\"hasLegend(spec.mark)\" ng-click=\"legendShow = !legendShow\">图例</h2><div class=\"shelf-pane shelf-echart-pane full-width\" ng-show=\"hasLegend(spec.mark) && legendShow\"><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">显示图例</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'1\'\" ng-false-value=\"\'2\'\" ng-model=\"ecconfig.legend.show\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">图例平铺</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'horizontal\'\" ng-false-value=\"\'vertical\'\" ng-model=\"ecconfig.legend.orient\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">滚动图例</div><div class=\"field-drop\"><input type=\"checkbox\" ng-true-value=\"\'scroll\'\" ng-false-value=\"\'plain\'\" ng-model=\"ecconfig.legend.type\"></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">图例位置</div><div class=\"field-drop\"><select class=\"full-width\" ng-model=\"ecconfig.legend.position\"><option value=\"upleft\">左上</option><option value=\"upcenter\">上中心</option><option value=\"upright\">右上</option><option value=\"downleft\">左下</option><option value=\"downcenter\">下中心</option><option value=\"downright\">右下</option></select></div></div></div><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"shelf-label drop-target\">图例文字</div><div class=\"field-drop\"><div style=\"width: 80%;margin: 0;\" range-slider=\"\" min=\"4\" max=\"100\" model-max=\"ecconfig.legend.fontSize\" pin-handle=\"min\"></div><input type=\"text\" style=\"width:25px;\" ng-model=\"ecconfig.legend.fontSize\"></div></div></div></div><h2 ng-click=\"filterShow = !filterShow\">过滤条件</h2><div class=\"shelf-pane shelf-marks-pane full-width\" ng-show=\"filterShow\"><ec-channel channel-title=\"\'年份\'\" drop-type=\"\'filter\'\" can-drop=\"\'1\'\" can-drag=\"\'1\'\" remove-action=\"removeFilter(\'year\')\" field=\"ecconfig.filter.year.field\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'月份\'\" drop-type=\"\'filter\'\" can-drop=\"\'1\'\" can-drag=\"\'1\'\" remove-action=\"removeFilter(\'month\')\" field=\"ecconfig.filter.month.field\" modal=\"ecconfig\"></ec-channel><ec-channel channel-title=\"\'过滤字段\'+($index+1)\" can-drag=\"\'1\'\" more-drag=\"\'true\'\" drop-type=\"\'filters\'\" can-drop=\"\'1\'\" channel-key=\"\'filters\'\" remove-action=\"removeFilter(\'filters\',$index)\" ng-repeat=\"filtermodal in ecconfig.filter.filters track by $index\" field=\"filtermodal\" modal=\"ecconfig\"></ec-channel><div class=\"shelf-group\"><div class=\"shelf\"><div class=\"field-drop\" ng-model=\"filtermodal\" can-drop=\"\'1\'\" data-drop=\"true\" jqyoui-droppable=\"{onDrop:\'filterFieldDrop\'}\" data-jqyoui-options=\"{activeClass: \'drop-active\'}\"><span class=\"placeholder\">拖动字段到此处进行过滤</span></div></div></div></div></div></div>");
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
        scope.SearchChange = function(e){//字段过多时查询功能
              var fields = Dataset.datasets;
              for(var i = 0;i<fields.length;i++)
              {
                fields[i].hidden = 'false';
                if(e.currentTarget.value!=""&&fields[i].name.toString().toLowerCase().indexOf(e.currentTarget.value.toString().toLowerCase())<0
                    &&fields[i].description.indexOf(e.currentTarget.value.toString().toLowerCase())<0)
                  fields[i].hidden = 'true';
              }
        }
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
    Dataset.nowName = "";
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
      // if (Dataset.currentDataset && Dataset.currentDataset.name){
      //   Dataset.currentDataset.name = angular.copy(dataset.name);
      // }
      Dataset.loading = true;
      Dataset.nowName = dataset.name;
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
  .directive('ecChannel', ['Drop','$timeout', function (Drop,$timeout) {
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
        var colors =  {
                '#000000': '#000000',
                '#ffffff': '#ffffff',
                '#FF0000': '#FF0000',
                '#777777': '#777777',
                '#337ab7': '#337ab7',
                '#5cb85c': '#5cb85c',
                '#5bc0de': '#5bc0de',
                '#f0ad4e': '#f0ad4e',
                '#d9534f': '#d9534f',
                '#FFFF00':'#FFFF00',
                '#EE00EE':'#EE00EE',
                '#ADFF2F':'#ADFF2F'
         };
        scope.FieldDropped = function () {

          if (scope.dropType == 'filter'){
            var date= new Date();
            scope.thismodal.ifAuto = '1';
            if(scope.channelTitle == '月份'){
              scope.thismodal.value = date.getMonth();
            }
            else{
              scope.thismodal.value = date.getFullYear();
            }
          }
          if(scope.dropType == "dbar")
          {
              scope.thismodal.showavgline = false;
              scope.thismodal.avglinevalue = null;
          }
          scope.thismodal.calcrules = '';
          scope.field = angular.copy(scope.thismodal);
        };
        //仪表盘分段配置项
        scope.SplitDropped = function () {
            //想要获取到newmodel  这个退拽对象不能使用ng-if 影响初始化,必须用ng-show
           scope.field.splitField = scope.field.splitField||[];
           scope.newmodel.color="#d5d931";
           scope.newmodel.giveLength=false;
           scope.newmodel.length=0;
          scope.field.splitField.push(angular.copy(scope.newmodel));
        };
        scope.removeSplit = function(field,num) {
          if (Array.isArray(scope.field.splitField)) {
            scope.field.splitField.splice(num,1);
          }
          else{
            scope.field.splitField = [];
          }
        };
        scope.showSplitPop = function(index){
          if (element.find('.echart-type'+index).length > 0) {
              var typePopup = new Drop({
                  content: element.find('.echart-type'+index)[0],
                  target: element.find('.type-caret'+index)[0],
                  position: 'top left',
                  openOn: 'click'
              });
          typePopup.on('open', function () {
              $(".split-color"+index).colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                scope.field.splitField[index].color = $(this).val();
              });
            });
          scope.splitPopup = typePopup;
          typePopup.open();
          }
        };
        scope.setSplitColor = function (type,index) {
          if (type == 'split') {
            scope.field.splitField[index].color= angular.copy(scope.field.splitField[index].color);
            console.log(scope.field.splitField);
          }
          scope.splitPopup.open();
        };
        //仪表盘分段配置结束

        if (element.find('.type-caret').length > 0 && element.find('.echart-type').length > 0) {
          var typePopup = new Drop({
            content: element.find('.echart-type')[0],
            target: element.find('.type-caret')[0],
            position: 'top left',
            openOn: 'click'
          });
          var calPopup = new Drop({//计算字段的事件
            content: element.find('.count-type')[0],
            target: element.find('.count-caret')[0],
            position: 'top left',
            openOn: 'click'
          });
          if (scope.dropType == 'type' && scope.field && scope.field.color) {
            scope.mix_color = angular.copy(scope.field.color);
            typePopup.on('open', function () {
              $(".drop-content .color-input").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                scope.mix_color = $(this).val();
              });
              $(".alertcolor").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {//警示线颜色
                  scope.field.alertsConfigs[parseInt($(this).attr('idx'))].color = $(this).val();
              });
              $(".color-label").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {//警示线颜色
                  scope.field.label.normal.color = $(this).val();
              });
            });
          }
          if (scope.dropType == 'mappoint' && scope.field && scope.field.color) {
            scope.point_color = angular.copy(scope.field.color);
            scope.point_top_color = angular.copy(scope.field.top_color);
            typePopup.on('open', function () {
              $(".drop-content .point-color-input").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                if($(this).attr('rel') == 'normal'){
                  scope.point_color = $(this).val();
                }
                if($(this).attr('rel') == 'top'){
                  scope.point_top_color = $(this).val();
                }
              });
            });
          }

          if (scope.dropType == 'single' && scope.field && scope.field._titleColor ){
            scope.single_title_color = angular.copy(scope.field._titleColor);
            scope.single_value_color = angular.copy(scope.field._valueColor);
            typePopup.on('open', function () {
              $(".drop-content .single-color").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                if ($(this).attr('rel') == 'single_title') {
                  scope.single_title_color = $(this).val();
                }
                if ($(this).attr('rel') == 'single_value') {
                  scope.single_value_color = $(this).val();
                }
              });
            });
          }
          if (scope.dropType == 'style' && scope.field) {
            typePopup.on('open', function () {
              $(".split-color-input").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                if($(this).attr('rel') == 'normal'){
                  scope.field.splitcolor = $(this).val();
                }
                if($(this).attr('rel') == 'pointer'){
                  scope.field.style.itemStyle.normal.color = $(this).val();
                }
              });
            });
          }

        }

        scope.alertBlur = function () {
            scope.field.alertsConfigs = scope.field.alertsConfigs ||[];
            var oldlen = scope.field.alertsConfigs.length;
            if(scope.field.alertscount>oldlen)
            {
              for(var i=0;i<scope.field.alertscount-oldlen;i++)
              {
                scope.field.alertsConfigs.push({value:0,color:'red',name:'警示线'+(i+1)});
              }
            }
            else(scope.field.alertscount<oldlen)
            {
              scope.field.alertsConfigs.splice(scope.field.alertscount,oldlen-scope.field.alertscount);
            }
            $timeout(function(){
              $(".alertcolor").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                  scope.field.alertsConfigs[$(this).attr('idx')].color = $(this).val();
              });
            },1000);//延时初始化颜色控件
        }

        scope.groupcountBlur = function () {//自定义分组
            scope.field.groupConfigs = scope.field.groupConfigs ||[];
            var oldlen = scope.field.groupConfigs.length;
            if(scope.field.selfgroupcount>oldlen)
            {
              var t=1;
              for(var i=0;i<scope.field.selfgroupcount-oldlen;i++)
              {
                scope.field.groupConfigs.push({valuestart:t,valueend:(t+1),name:'分组'+(i+1)});
                t=t+2;
              }
            }
            else(scope.field.selfgroupcount<oldlen)
            {
              scope.field.groupConfigs.splice(scope.field.selfgroupcount,oldlen-scope.field.selfgroupcount);
            }
        }

        scope.setLineColor = function (index) {
          scope.field.alertsConfigs[index].color = angular.copy($(this).val());
          typePopup.open();
        };

        scope.setMixColor = function () {
          scope.field.color = angular.copy(scope.mix_color);
          typePopup.open();
        };

        scope.setPointColor = function (type,index) {
          if(type == 'normal'){
            scope.field.color = angular.copy(scope.point_color);
          }
          if(type == 'top'){
            scope.field.top_color = angular.copy(scope.point_top_color);
          }
          if(type == 'single_title'){
            scope.field._titleColor = angular.copy(scope.single_title_color);
          }
          if (type == 'single_value') {
            scope.field._valueColor = angular.copy(scope.single_value_color);
          }
          typePopup.open();
        };

        scope.getAllCols = function(){
            //获取主scope选择的相关字段
            var mainscope = $('div[ng-controller="MainCtrl"]').scope();
            var fields = mainscope.Dataset.schema.fieldSchemas;
            return fields;
        };

        scope.$watch('field.truetype', function (n) {
          if (!scope.field || !scope.field.truetype || !scope.field.type) {
            return;
          }
          if (n === 'area') {
            scope.field.type = 'line';
            scope.field.isarea = '1';
          }
          else if(n === 'linestep')
          {
            scope.field.type = 'line';
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

        scope.addAnd = function (data) {
            if(!data)
            {
                if(scope.field.rules[0]&&scope.field.rules[0].relate=="and")
                {
                    scope.field.rules.push({id:scope.genID(20),parentid:scope.field.rules[0].id,name:scope.field.field,relate:'and',rule:'==',value:''});
                }
                else
                {
                    var newid =scope.genID(20);
                    scope.field.rules.push({id:newid,parentid:"0",name:'',relate:'and',rule:'',value:''});
                    scope.field.rules.push({id:scope.genID(20),parentid:newid,name:scope.field.field,relate:'and',rule:'==',value:''});
                }
            }
            else
            {
                var parent = scope.field.rules.find(function (x) {
                    return x.id===data.parentid
                });
                if(parent.relate=="and")
                {
                    scope.field.rules.push({id:scope.genID(20),parentid:parent.id,name:scope.field.field,relate:'and',rule:'==',value:''});
                }
                else {
                    var newid =scope.genID(20);
                    scope.field.rules.push({id:newid,parentid:parent.id,name:'',relate:'and',rule:'',value:''});
                    scope.field.rules.push({id:scope.genID(20),parentid:newid,name:scope.field.field,relate:'and',rule:'==',value:''});
                    scope.field.rules.find(function (x) {
                        return x.id===data.id
                    }).parentid = newid;
                }
            }
            $timeout(function(){
                typePopup.open();
            });
        };
        scope.addOr = function (data) {
            if(!data)return;
            var parent = scope.field.rules.find(function (x) {
                return x.id===data.parentid
            });
            if(parent.relate=="or")
            {
                scope.field.rules.push({id:scope.genID(20),parentid:parent.id,name:scope.field.field,relate:'or',rule:'==',value:''});
            }
            else {
                var newid =scope.genID(20);
                scope.field.rules.push({id:newid,parentid:parent.id,name:'',relate:'or',rule:'',value:''});
                scope.field.rules.push({id:scope.genID(20),parentid:newid,name:scope.field.field,relate:'or',rule:'==',value:''});
                scope.field.rules.find(function (x) {
                    return x.id===data.id
                }).parentid = newid;
            }
            $timeout(function(){
                typePopup.open();
            });
        };
        scope.removeFilter = function(data){
            var brothers = [];
            var brothersOnly = [];//只是表达式的平级兄弟
            var childs = [];
            var parent = {};
            scope.field.rules.map(function(objct){
                if(objct.parentid === data.parentid&&arguments[0].id!=data.id)
                {
                    if(arguments[0].rule!="")
                    {
                        brothers.push(objct.id);
                    }
                    else
                    {
                        brothersOnly.push(objct.id);
                    }
                }
                if(objct.parentid === data.id)
                    childs.push(objct.id);
                if(objct.id===data.parentid)
                    parent = objct;
            });
            if(brothers.length==0)
            {
                if(brothersOnly.length!=0)//只剩下同级条件,条件前置,删除父条件
                {
                    if(parent.id)
                    {
                        scope.field.rules.del(function(delobj){ return delobj.id===parent.id});
                    }
                    brothersOnly.map(function(value){
                        scope.field.rules.map(function(objs){
                            if(value===objs.id) {
                                objs.parentid = parent.parentid || "0";
                            }
                        });
                    })
                }
                else if(parent.rule=="")//如果没有同级而且父级只有rule.同时产出父级
                {
                    scope.field.rules.del(function(delobj){ return delobj.id===parent.id});
                }
                scope.field.rules.del(function(delobj){ return delobj.id===data.id});
            }
            else
            {
                scope.field.rules.del(function(delobj){ return delobj.id===data.id});
            }
            if(scope.field.rules.length==1&&scope.field.rules[0].parentid=="0")
                scope.field.rules.pop();
            $timeout(function(){
                typePopup.open();
            });
        }
        scope.curentFilter = null;
        scope.filterRowClick = function (ev,rule,parentRule) {
            if(scope.curentFilter)
                scope.curentFilter.css("background-color","");
            $(ev.currentTarget).parent().css("background-color","lightgray");
            scope.curentFilter = $(ev.currentTarget).parent();
        };
        scope.genID = function(length){
            return Number(Math.random().toString().substr(3,length) + Date.now()).toString(36);
        };
        scope.getChilds = function(id){
            var objs=[];
            scope.field.rules.map(function (obj) {
                if(obj.parentid === id)
                    objs.push(obj);
            });
            return objs||[];
        };



        //计算公式
        scope.dropComplete = function(idx,data,evt){
            angular.element(".calc_div_fields").addClass("scroll-y");
            scope.addFieldCalc(arguments[1].helper[0].innerText);
        }
        scope.calcheck = "合法";
        scope.addFieldCalc = function(field,isset)
        {
            scope.field.calcrules = !scope.field.calcrules?"":scope.field.calcrules;
            if(isset)
                scope.field.calcrules = field;
            else
                scope.field.calcrules += ' '+field;
            if (calcCheck(scope.field.calcrules)) {
                scope.calcheck = "合法";
            }else{
               scope.calcheck = "不合法";
            }
        }
        scope.dragstop = function (data,evt) {
            angular.element(".calc_div_fields").addClass("scroll-y");
        };
        scope.dragstart = function (data,evt) {
            angular.element(".calc_div_fields").removeClass("scroll-y");//拖拽滚动条的bug修正
        };
        scope.deleteWords = function(evt){
            var el = evt.currentTarget;
            if(evt.keyCode==8) {
                delWholeWord(el, angular.element(el).val(), getCursortPosition(el));
                scope.addFieldCalc(angular.element(el).val(),true);
            }
        }
        var getCursortPosition = function (ctrl) {
            var CaretPos = 0;
            // IE Support
            if (document.selection) {
                ctrl.focus();
                var Sel = document.selection.createRange();
                Sel.moveStart('character', -ctrl.value.length);
                CaretPos = Sel.text.length;
            }
                // Firefox support
            else if (ctrl.selectionStart || +ctrl.selectionStart === 0)
            { CaretPos = ctrl.selectionStart; }
            return (CaretPos);
        };

        var selectSomeText = function (element, begin, end) {
            if (element.setSelectionRange) {
                element.setSelectionRange(begin, end);
            }
            else if (element.createTextRange) {
                var range = element.createTextRange();
                range.moveStart("character", begin);
                range.moveEnd("character", end);
                range.select();
            }
        };

        var delWholeWord = function (text, field, pos) {
            var startIndex = pos;
            if (field.charAt(pos - 1) !== ' ') {
                for (var i = pos - 2; i >= 0; i--) {
                    if (field.charAt(i) === ' ' || i === 0) {
                        startIndex = i;
                        break;
                    }
                }
                selectSomeText(text, startIndex, pos)
            }

        };

        function calcCheck(string){
            // 剔除空白符
            string = string.replace(/\s/g, '');
            // 错误情况，空字符串
            if("" === string){
                return false;
            }
            // 错误情况，运算符连续
            if( /[\+\-\*\/]{2,}/.test(string) ){
                return false;
            }
            // 空括号
            if(/\(\)/.test(string)){
                return false;
            }
            // 错误情况，加减乘除结尾
            if( /[\+\-\*\/]$/.test(string) ){
                return false;
            }
            // 错误情况，括号不配对
            var stack = [];
            for(var i = 0, item; i < string.length; i++){
                item = string.charAt(i);
                if('(' === item){
                    stack.push('(');
                }else if(')' === item){
                    if(stack.length > 0){
                        stack.pop();
                    }else{
                        return false;
                    }
                }
            }
            if(0 !== stack.length){
                return false;
            }
            // 错误情况，(后面是运算符
            if(/\([\+\-\*\/]/.test(string)){
                return false;
            }
            // 错误情况，)前面是运算符
            if(/[\+\-\*\/]\)/.test(string)){
                return false;
            }
            // 错误情况，(前面不是运算符
            if(/[^\+\-\*\/]\(/.test(string)){
                return false;
            }
            // 错误情况，)后面不是运算符
            if(/\)[^\+\-\*\/]/.test(string)){
                return false;
            }

            return true;
        }

      }
    };
  }]);

    Array.prototype.del = function (filter) {
        var index = null;
        if (typeof filter == 'function') {
            for (var i = 0; i < this.length; i++) {
                if (filter(this[i], i)) index = i;
            }
        }
        if(index!==null)
            this.splice(index, 1)
    };
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
          calculator:'fa-calculator'
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
        scope.calcFieldDef = Pills.calcFieldDef;//计算指标
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
        $scope.titleShow = true;
        $scope.themeShow = true;
        $scope.propShow = true;
        $scope.legendShow = true;
        $scope.optionShow = true;
        $scope.filterShow = true;
        $scope.min = 0;
        $scope.max = 100;
        // $scope.marks = ['point', 'tick', 'bar', 'line', 'area', 'text'];
        $scope.marks = ['pie', 'gauge', 'bmap','mixed','scatter','radar','single', 'funnel','candlestick','wordCloud','treemap','graph','dbar','tree','sankey'];//,'sunburst'
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
            icon: 'fa-map-o',
            title: '地图'
          },

          "mixed":{
            icon:'fa-line-chart',
            title:'混合'
          },
          "scatter":{
            icon:'fa-braille',
            title:'散点'
          },
          "radar":{
            icon:'fa-connectdevelop',
            title:'雷达图'
          },
          "single":{
            icon:'fa-long-arrow-up',
            title:'单指标'
          },
          "funnel":{
            icon:'fa-align-center',
            title:'漏斗图'
          },
          "candlestick":{
            icon:'fa-line-chart',
            title:'K线图'
          },
          "wordCloud":{
            icon:'fa-building',
            title:'词云图'
          },
          "treemap":{
            icon:'fa-th-large',
            title:'矩阵图'
          },
          "graph":{
            icon:'fa-share-alt',
            title:'力学关系图'
          },
          "dbar":{
            icon:'fa-bar-chart',
            title:'多维柱'
          },
          "tree":{
            icon:'fa-tree',
            title:'树形图'
          },
          "sankey":{
            icon:'fa-barcode',
            title:'桑基图'
          }/*,
          "sunburst":{
            icon:'fa-dot-circle-o',
            title:'旭日图'
          }*/
        };
        $scope.ifechart = false;
        $scope.tab = 'tab1';
        $scope.echartShape = ['pie', 'gauge', 'bmap','mixed','scatter','radar','single','funnel','candlestick','worldcloud','treemap','graph','sunburst','sankey'];

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

        $scope.hasOption = function(type){
          return ['pie','mixed','single'].indexOf(type) > -1;
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
          $(".color-input-title").colorpicker({
            colorSelectors: {
                '#000000': '#000000',
                '#ffffff': '#ffffff',
                '#FF0000': '#FF0000',
                '#777777': '#777777',
                '#337ab7': '#337ab7',
                '#5cb85c': '#5cb85c',
                '#5bc0de': '#5bc0de',
                '#f0ad4e': '#f0ad4e',
                '#d9534f': '#d9534f',
                '#FFFF00':'#FFFF00',
                '#EE00EE':'#EE00EE',
                '#ADFF2F':'#ADFF2F'
            }
        }).on('changeColor', function () {
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
                $(".color-input-single").colorpicker({
            colorSelectors: {
                '#000000': '#000000',
                '#ffffff': '#ffffff',
                '#FF0000': '#FF0000',
                '#777777': '#777777',
                '#337ab7': '#337ab7',
                '#5cb85c': '#5cb85c',
                '#5bc0de': '#5bc0de',
                '#f0ad4e': '#f0ad4e',
                '#d9534f': '#d9534f',
                '#FFFF00':'#FFFF00',
                '#EE00EE':'#EE00EE',
                '#ADFF2F':'#ADFF2F'
            }
        }).on('changeColor', function () {
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
          $scope.ymodel.rename = $scope.ymodel.field;
          $scope.ymodel.type = 'bar';
          $scope.ymodel.truetype = 'bar';
          $scope.ymodel.isarea = '0';
          $scope.ymodel.smooth = false;//曲线为折线
          $scope.ymodel.showmax = false;//显示最大值气泡
          $scope.ymodel.showmin = false;//显示最小值气泡
          $scope.ymodel.showline = false;//均值线
          $scope.ymodel.basebar = false;//基础叠加柱
          $scope.ymodel.shadowbar = false;//作为阴影柱
          $scope.ymodel.newy = false;//独立Y轴
          $scope.ymodel.inversey = false;//Y轴反置
          $scope.ymodel.shownewy = $scope.ecconfig.field.y.length>0;//独立Y轴
          $scope.ymodel.autoColor = 'true';
          $scope.ymodel.color = "#333";
          $scope.ymodel.alertscount = 0;//警戒线条数
          $scope.ymodel.label = {
            normal:{
              show:'true',
              position:'top',
              rotate:'0'
            }
          };
          $scope.ecconfig.field.y.push(angular.copy($scope.ymodel));
        };
//k线图
        $scope.kyFieldDrop = function(){
          $scope.ymodel.rename = $scope.ymodel.field;
          $scope.ymodel.type = 'line';
          $scope.ymodel.truetype = 'line';
          $scope.ymodel.isarea = '0';
          $scope.ymodel.smooth = true;//曲线为折线
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
            y:{},
            lon:{},
            lat:{}
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
            position:'outside',
            showpercent:'true'
          };
          $scope.ecconfig.field.x.push(angular.copy($scope.piexmodel));
        };

        $scope.gaugeYFieldDrop = function(){
          $scope.gaugeY.name = "";
          $scope.gaugeY.showPercent = "false";
          $scope.gaugeY.decimals = 0;
          $scope.gaugeY.autoMax = "false";
          $scope.gaugeY.maxField = {};
          $scope.gaugeY.autoSplit = "false";//动态分段
          $scope.gaugeY.splitField = [];//动态分段
          $scope.gaugeY.splitcolor = "#f09426";//表盘颜色
          $scope.gaugeY.fullwidth = "80";//填充宽度
          $scope.gaugeY.max = "100";
          $scope.gaugeY.range = "0.2,0.8";
          $scope.gaugeY.style = {
            itemStyle: {//指针
                normal: {
                    shadowBlur: 15,
                     shadowColor: 'rgba(40, 40, 40, 0.5)'
                }
            },
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
          $scope.singleModel.plusicon = "false";
          $scope.singleModel._titleFontsize = 12;//不要用字符型,控件是int型绑定,会导致类型转换,$watch会刷新两次组件
          $scope.singleModel._valueFontsize = 12;
          $scope.singleModel._titleColor = '#000000';
          $scope.singleModel._valueColor = '#000000';
          $scope.ecconfig.field.y.push(angular.copy($scope.singleModel));
        };

        $scope.filterFieldDrop = function(){
          $scope.ecconfig.field.filters = $scope.ecconfig.field.filters||[];
          //$scope.filtermodal.rule ="==";
          //$scope.filtermodal.value ="";
          $scope.filtermodal.rules = []//[{id:1,parentid:0,relate:'and',rule:'',value:''},{id:2,parentid:1,name:$scope.filtermodal.field,relate:'and',rule:'==',value:'11'},{id:3,parentid:1,relate:'or',rule:'',value:''},
                   //{id:4,parentid:3,name:$scope.filtermodal.field,relate:'and',rule:'==',value:'221'},
                  //{id:5,parentid:3,name:$scope.filtermodal.field,relate:'and',rule:'==',value:'222'}];
          $scope.ecconfig.filter.filters.push(angular.copy($scope.filtermodal));
        };

        $scope.removeMix = function(field,num) {
          if (Array.isArray($scope.ecconfig.field[field])) { 
            $scope.ecconfig.field[field].splice(num,1);
          }
          else{
            $scope.ecconfig.field[field] = {};
          }
        };

        $scope.removeFilter = function (field,num){
          if(num!=undefined)
            $scope.ecconfig.filter[field].splice(num,1);
          else
            $scope.ecconfig.filter[field].field = {};
        };
        $scope.removePoint = function(field,num){
          if(field == 'x'){
              var a = confirm('是否删除这个标记');
            if(a){
              $scope.ecconfig.point.splice(num,1);
            }
          }
          else {
            $scope.ecconfig.point[num][field] = {};
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
    //console.log('app:', consts.appId, 'started');
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

      countFieldDef: {field: '条目总数',type: 'quantitative',aggregate:'count_sum'},
      calcFieldDef: {field: '计算指标',type: 'calculator',aggregate:'count'},

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzb24zLWNvbXBhY3RzdHJpbmdpZnkuanMiLCJ2bC1zY2hlbWEuanMiLCJpbmRleC5qcyIsInRlbXBsYXRlQ2FjaGVIdG1sLmpzIiwiZGF0YXNldC9jaGFuZ2Vsb2FkZWRkYXRhc2V0LmpzIiwiZGF0YXNldC9kYXRhc2V0LnNlcnZpY2UuanMiLCJkYXRhc2V0L2RhdGFzZXRtb2RhbC5qcyIsImRhdGFzZXQvZGF0YXNldHNlbGVjdG9yLmpzIiwiZGF0YXNldC9zYW1wbGVkYXRhLmpzIiwiY29tcG9uZW50cy9lY2NoYW5uZWwvZWNjaGFubmVsLmpzIiwiY29tcG9uZW50cy9maWVsZGluZm8vZmllbGRpbmZvLmpzIiwiY29tcG9uZW50cy9tb2RhbC9tb2RhbC5qcyIsImNvbXBvbmVudHMvbW9kYWwvbW9kYWxjbG9zZWJ1dHRvbi5qcyIsImNvbXBvbmVudHMvbW9kYWwvbW9kYWxzLnNlcnZpY2UuanMiLCJjb21wb25lbnRzL3NjaGVtYWxpc3Qvc2NoZW1hbGlzdC5qcyIsImNvbXBvbmVudHMvc2NoZW1hbGlzdC9zY2hlbWFsaXN0aXRlbS5qcyIsImNvbXBvbmVudHMvc2hlbHZlcy9zaGVsdmVzLmpzIiwiY29tcG9uZW50cy90YWJzL3RhYi5qcyIsImNvbXBvbmVudHMvdGFicy90YWJzZXQuanMiLCJmaWx0ZXJzL2NvbXBhY3Rqc29uL2NvbXBhY3Rqc29uLmZpbHRlci5qcyIsImZpbHRlcnMvZW5jb2RldXJpL2VuY29kZXVyaS5maWx0ZXIuanMiLCJmaWx0ZXJzL3JlcG9ydHVybC9yZXBvcnR1cmwuZmlsdGVyLmpzIiwiZmlsdGVycy91bmRlcnNjb3JlMnNwYWNlL3VuZGVyc2NvcmUyc3BhY2UuZmlsdGVyLmpzIiwic2VydmljZXMvY2hhcnQvY2hhcnQuc2VydmljZS5qcyIsInNlcnZpY2VzL2NvbmZpZy9jb25maWcuc2VydmljZS5qcyIsInNlcnZpY2VzL2ZpbHRlcm1hbmFnZXIvZmlsdGVybWFuYWdlci5qcyIsInNlcnZpY2VzL2xvZ2dlci9sb2dnZXIuc2VydmljZS5qcyIsInNlcnZpY2VzL3BpbGxzL3BpbGxzLnNlcnZpY2UuanMiLCJzZXJ2aWNlcy9zY2hlbWEvc2NoZW1hLnNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FBS0EsQ0FBQyxDQUFDLFlBQVk7OztFQUdaLElBQUksV0FBVyxPQUFPLFdBQVcsY0FBYyxPQUFPOzs7RUFHdEQsSUFBSSxjQUFjO0lBQ2hCLFlBQVk7SUFDWixVQUFVOzs7O0VBSVosSUFBSSxjQUFjLFlBQVksT0FBTyxZQUFZLFdBQVcsQ0FBQyxRQUFRLFlBQVk7Ozs7OztFQU1qRixJQUFJLE9BQU8sWUFBWSxPQUFPLFdBQVcsVUFBVTtNQUMvQyxhQUFhLGVBQWUsWUFBWSxPQUFPLFdBQVcsVUFBVSxDQUFDLE9BQU8sWUFBWSxPQUFPLFVBQVUsWUFBWTs7RUFFekgsSUFBSSxlQUFlLFdBQVcsY0FBYyxjQUFjLFdBQVcsY0FBYyxjQUFjLFdBQVcsWUFBWSxhQUFhO0lBQ25JLE9BQU87Ozs7O0VBS1QsU0FBUyxhQUFhLFNBQVMsU0FBUztJQUN0QyxZQUFZLFVBQVUsS0FBSztJQUMzQixZQUFZLFVBQVUsS0FBSzs7O0lBRzNCLElBQUksU0FBUyxRQUFRLGFBQWEsS0FBSztRQUNuQyxTQUFTLFFBQVEsYUFBYSxLQUFLO1FBQ25DLFNBQVMsUUFBUSxhQUFhLEtBQUs7UUFDbkMsT0FBTyxRQUFRLFdBQVcsS0FBSztRQUMvQixjQUFjLFFBQVEsa0JBQWtCLEtBQUs7UUFDN0MsWUFBWSxRQUFRLGdCQUFnQixLQUFLO1FBQ3pDLE9BQU8sUUFBUSxXQUFXLEtBQUs7UUFDL0IsYUFBYSxRQUFRLFdBQVcsS0FBSzs7O0lBR3pDLElBQUksT0FBTyxjQUFjLFlBQVksWUFBWTtNQUMvQyxRQUFRLFlBQVksV0FBVztNQUMvQixRQUFRLFFBQVEsV0FBVzs7OztJQUk3QixJQUFJLGNBQWMsT0FBTztRQUNyQixXQUFXLFlBQVk7UUFDdkIsWUFBWSxTQUFTOzs7SUFHekIsSUFBSSxhQUFhLElBQUksS0FBSyxDQUFDO0lBQzNC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QUFRLE9BQU87R0FDWixRQUFRLHVCQUFVLFNBQVMsVUFBVTtJQUNwQyxJQUFJLFNBQVM7O0lBRWIsT0FBTyxTQUFTOztJQUVoQixPQUFPLG1CQUFtQixTQUFTLFNBQVM7TUFDMUMsSUFBSSxNQUFNO01BQ1YsSUFBSSxzQkFBc0IsT0FBTyxPQUFPLFlBQVksU0FBUyxXQUFXOztNQUV4RSxJQUFJLE1BQU07U0FDUCxvQkFBb0IsUUFBUSxvQkFBb0IsTUFBTSxHQUFHO1FBQzFEO01BQ0YsTUFBTSxJQUFJLE1BQU0sSUFBSSxZQUFZLEtBQUs7TUFDckMsT0FBTyxPQUFPLE9BQU8sWUFBWTs7O0lBR25DLE9BQU87O0FBRVgiLCJmaWxlIjoiLi4vLi4vLi4vcGx1Z2luL2FuZ3VsYXIvdmx1aS92bHVpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXHJcbiAqIEpTT04zIHdpdGggY29tcGFjdCBzdHJpbmdpZnkgLS0gTW9kaWZpZWQgYnkgS2FuaXQgV29uZ3N1cGhhc2F3YXQuICAgaHR0cHM6Ly9naXRodWIuY29tL2thbml0dy9qc29uM1xyXG4gKlxyXG4gKiBGb3JrZWQgZnJvbSBKU09OIHYzLjMuMiB8IGh0dHBzOi8vYmVzdGllanMuZ2l0aHViLmlvL2pzb24zIHwgQ29weXJpZ2h0IDIwMTItMjAxNCwgS2l0IENhbWJyaWRnZSB8IGh0dHA6Ly9raXQubWl0LWxpY2Vuc2Uub3JnXHJcbiAqL1xyXG47KGZ1bmN0aW9uICgpIHtcclxuICAvLyBEZXRlY3QgdGhlIGBkZWZpbmVgIGZ1bmN0aW9uIGV4cG9zZWQgYnkgYXN5bmNocm9ub3VzIG1vZHVsZSBsb2FkZXJzLiBUaGVcclxuICAvLyBzdHJpY3QgYGRlZmluZWAgY2hlY2sgaXMgbmVjZXNzYXJ5IGZvciBjb21wYXRpYmlsaXR5IHdpdGggYHIuanNgLlxyXG4gIHZhciBpc0xvYWRlciA9IHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kO1xyXG5cclxuICAvLyBBIHNldCBvZiB0eXBlcyB1c2VkIHRvIGRpc3Rpbmd1aXNoIG9iamVjdHMgZnJvbSBwcmltaXRpdmVzLlxyXG4gIHZhciBvYmplY3RUeXBlcyA9IHtcclxuICAgIFwiZnVuY3Rpb25cIjogdHJ1ZSxcclxuICAgIFwib2JqZWN0XCI6IHRydWVcclxuICB9O1xyXG5cclxuICAvLyBEZXRlY3QgdGhlIGBleHBvcnRzYCBvYmplY3QgZXhwb3NlZCBieSBDb21tb25KUyBpbXBsZW1lbnRhdGlvbnMuXHJcbiAgdmFyIGZyZWVFeHBvcnRzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGV4cG9ydHNdICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcclxuXHJcbiAgLy8gVXNlIHRoZSBgZ2xvYmFsYCBvYmplY3QgZXhwb3NlZCBieSBOb2RlIChpbmNsdWRpbmcgQnJvd3NlcmlmeSB2aWFcclxuICAvLyBgaW5zZXJ0LW1vZHVsZS1nbG9iYWxzYCksIE5hcndoYWwsIGFuZCBSaW5nbyBhcyB0aGUgZGVmYXVsdCBjb250ZXh0LFxyXG4gIC8vIGFuZCB0aGUgYHdpbmRvd2Agb2JqZWN0IGluIGJyb3dzZXJzLiBSaGlubyBleHBvcnRzIGEgYGdsb2JhbGAgZnVuY3Rpb25cclxuICAvLyBpbnN0ZWFkLlxyXG4gIHZhciByb290ID0gb2JqZWN0VHlwZXNbdHlwZW9mIHdpbmRvd10gJiYgd2luZG93IHx8IHRoaXMsXHJcbiAgICAgIGZyZWVHbG9iYWwgPSBmcmVlRXhwb3J0cyAmJiBvYmplY3RUeXBlc1t0eXBlb2YgbW9kdWxlXSAmJiBtb2R1bGUgJiYgIW1vZHVsZS5ub2RlVHlwZSAmJiB0eXBlb2YgZ2xvYmFsID09IFwib2JqZWN0XCIgJiYgZ2xvYmFsO1xyXG5cclxuICBpZiAoZnJlZUdsb2JhbCAmJiAoZnJlZUdsb2JhbFtcImdsb2JhbFwiXSA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsW1wid2luZG93XCJdID09PSBmcmVlR2xvYmFsIHx8IGZyZWVHbG9iYWxbXCJzZWxmXCJdID09PSBmcmVlR2xvYmFsKSkge1xyXG4gICAgcm9vdCA9IGZyZWVHbG9iYWw7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IEluaXRpYWxpemVzIEpTT04gMyB1c2luZyB0aGUgZ2l2ZW4gYGNvbnRleHRgIG9iamVjdCwgYXR0YWNoaW5nIHRoZVxyXG4gIC8vIGBzdHJpbmdpZnlgIGFuZCBgcGFyc2VgIGZ1bmN0aW9ucyB0byB0aGUgc3BlY2lmaWVkIGBleHBvcnRzYCBvYmplY3QuXHJcbiAgZnVuY3Rpb24gcnVuSW5Db250ZXh0KGNvbnRleHQsIGV4cG9ydHMpIHtcclxuICAgIGNvbnRleHQgfHwgKGNvbnRleHQgPSByb290W1wiT2JqZWN0XCJdKCkpO1xyXG4gICAgZXhwb3J0cyB8fCAoZXhwb3J0cyA9IHJvb3RbXCJPYmplY3RcIl0oKSk7XHJcblxyXG4gICAgLy8gTmF0aXZlIGNvbnN0cnVjdG9yIGFsaWFzZXMuXHJcbiAgICB2YXIgTnVtYmVyID0gY29udGV4dFtcIk51bWJlclwiXSB8fCByb290W1wiTnVtYmVyXCJdLFxyXG4gICAgICAgIFN0cmluZyA9IGNvbnRleHRbXCJTdHJpbmdcIl0gfHwgcm9vdFtcIlN0cmluZ1wiXSxcclxuICAgICAgICBPYmplY3QgPSBjb250ZXh0W1wiT2JqZWN0XCJdIHx8IHJvb3RbXCJPYmplY3RcIl0sXHJcbiAgICAgICAgRGF0ZSA9IGNvbnRleHRbXCJEYXRlXCJdIHx8IHJvb3RbXCJEYXRlXCJdLFxyXG4gICAgICAgIFN5bnRheEVycm9yID0gY29udGV4dFtcIlN5bnRheEVycm9yXCJdIHx8IHJvb3RbXCJTeW50YXhFcnJvclwiXSxcclxuICAgICAgICBUeXBlRXJyb3IgPSBjb250ZXh0W1wiVHlwZUVycm9yXCJdIHx8IHJvb3RbXCJUeXBlRXJyb3JcIl0sXHJcbiAgICAgICAgTWF0aCA9IGNvbnRleHRbXCJNYXRoXCJdIHx8IHJvb3RbXCJNYXRoXCJdLFxyXG4gICAgICAgIG5hdGl2ZUpTT04gPSBjb250ZXh0W1wiSlNPTlwiXSB8fCByb290W1wiSlNPTlwiXTtcclxuXHJcbiAgICAvLyBEZWxlZ2F0ZSB0byB0aGUgbmF0aXZlIGBzdHJpbmdpZnlgIGFuZCBgcGFyc2VgIGltcGxlbWVudGF0aW9ucy5cclxuICAgIGlmICh0eXBlb2YgbmF0aXZlSlNPTiA9PSBcIm9iamVjdFwiICYmIG5hdGl2ZUpTT04pIHtcclxuICAgICAgZXhwb3J0cy5zdHJpbmdpZnkgPSBuYXRpdmVKU09OLnN0cmluZ2lmeTtcclxuICAgICAgZXhwb3J0cy5wYXJzZSA9IG5hdGl2ZUpTT04ucGFyc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29udmVuaWVuY2UgYWxpYXNlcy5cclxuICAgIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgZ2V0Q2xhc3MgPSBvYmplY3RQcm90by50b1N0cmluZyxcclxuICAgICAgICBpc1Byb3BlcnR5LCBmb3JFYWNoLCB1bmRlZjtcclxuXHJcbiAgICAvLyBUZXN0IHRoZSBgRGF0ZSNnZXRVVEMqYCBtZXRob2RzLiBCYXNlZCBvbiB3b3JrIGJ5IEBZYWZmbGUuXHJcbiAgICB2YXIgaXNFeHRlbmRlZCA9IG5ldyBEYXRlKC0zNTA5ODI3MzM0NTczMjkyKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIFRoZSBgZ2V0VVRDRnVsbFllYXJgLCBgTW9udGhgLCBhbmQgYERhdGVgIG1ldGhvZHMgcmV0dXJuIG5vbnNlbnNpY2FsXHJcbiAgICAgIC8vIHJlc3VsdHMgZm9yIGNlcnRhaW4gZGF0ZXMgaW4gT3BlcmEgPj0gMTAuNTMuXHJcbiAgICAgIGlzRXh0ZW5kZWQgPSBpc0V4dGVuZGVkLmdldFVUQ0Z1bGxZZWFyKCkgPT0gLTEwOTI1MiAmJiBpc0V4dGVuZGVkLmdldFVUQ01vbnRoKCkgPT09IDAgJiYgaXNFeHRlbmRlZC5nZXRVVENEYXRlKCkgPT09IDEgJiZcclxuICAgICAgICAvLyBTYWZhcmkgPCAyLjAuMiBzdG9yZXMgdGhlIGludGVybmFsIG1pbGxpc2Vjb25kIHRpbWUgdmFsdWUgY29ycmVjdGx5LFxyXG4gICAgICAgIC8vIGJ1dCBjbGlwcyB0aGUgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBkYXRlIG1ldGhvZHMgdG8gdGhlIHJhbmdlIG9mXHJcbiAgICAgICAgLy8gc2lnbmVkIDMyLWJpdCBpbnRlZ2VycyAoWy0yICoqIDMxLCAyICoqIDMxIC0gMV0pLlxyXG4gICAgICAgIGlzRXh0ZW5kZWQuZ2V0VVRDSG91cnMoKSA9PSAxMCAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbnV0ZXMoKSA9PSAzNyAmJiBpc0V4dGVuZGVkLmdldFVUQ1NlY29uZHMoKSA9PSA2ICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgPT0gNzA4O1xyXG4gICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG5cclxuICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG5hdGl2ZSBgSlNPTi5zdHJpbmdpZnlgIGFuZCBgcGFyc2VgXHJcbiAgICAvLyBpbXBsZW1lbnRhdGlvbnMgYXJlIHNwZWMtY29tcGxpYW50LiBCYXNlZCBvbiB3b3JrIGJ5IEtlbiBTbnlkZXIuXHJcbiAgICBmdW5jdGlvbiBoYXMobmFtZSkge1xyXG4gICAgICBpZiAoaGFzW25hbWVdICE9PSB1bmRlZikge1xyXG4gICAgICAgIC8vIFJldHVybiBjYWNoZWQgZmVhdHVyZSB0ZXN0IHJlc3VsdC5cclxuICAgICAgICByZXR1cm4gaGFzW25hbWVdO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBpc1N1cHBvcnRlZDtcclxuICAgICAgaWYgKG5hbWUgPT0gXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIikge1xyXG4gICAgICAgIC8vIElFIDw9IDcgZG9lc24ndCBzdXBwb3J0IGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyB1c2luZyBzcXVhcmVcclxuICAgICAgICAvLyBicmFja2V0IG5vdGF0aW9uLiBJRSA4IG9ubHkgc3VwcG9ydHMgdGhpcyBmb3IgcHJpbWl0aXZlcy5cclxuICAgICAgICBpc1N1cHBvcnRlZCA9IFwiYVwiWzBdICE9IFwiYVwiO1xyXG4gICAgICB9IGVsc2UgaWYgKG5hbWUgPT0gXCJqc29uXCIpIHtcclxuICAgICAgICAvLyBJbmRpY2F0ZXMgd2hldGhlciBib3RoIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBKU09OLnBhcnNlYCBhcmVcclxuICAgICAgICAvLyBzdXBwb3J0ZWQuXHJcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBoYXMoXCJqc29uLXN0cmluZ2lmeVwiKSAmJiBoYXMoXCJqc29uLXBhcnNlXCIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciB2YWx1ZSwgc2VyaWFsaXplZCA9ICd7XCJhXCI6WzEsdHJ1ZSxmYWxzZSxudWxsLFwiXFxcXHUwMDAwXFxcXGJcXFxcblxcXFxmXFxcXHJcXFxcdFwiXX0nO1xyXG4gICAgICAgIC8vIFRlc3QgYEpTT04uc3RyaW5naWZ5YC5cclxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tc3RyaW5naWZ5XCIpIHtcclxuICAgICAgICAgIHZhciBzdHJpbmdpZnkgPSBleHBvcnRzLnN0cmluZ2lmeSwgc3RyaW5naWZ5U3VwcG9ydGVkID0gdHlwZW9mIHN0cmluZ2lmeSA9PSBcImZ1bmN0aW9uXCIgJiYgaXNFeHRlbmRlZDtcclxuICAgICAgICAgIGlmIChzdHJpbmdpZnlTdXBwb3J0ZWQpIHtcclxuICAgICAgICAgICAgLy8gQSB0ZXN0IGZ1bmN0aW9uIG9iamVjdCB3aXRoIGEgY3VzdG9tIGB0b0pTT05gIG1ldGhvZC5cclxuICAgICAgICAgICAgKHZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9KS50b0pTT04gPSB2YWx1ZTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPVxyXG4gICAgICAgICAgICAgICAgLy8gRmlyZWZveCAzLjFiMSBhbmQgYjIgc2VyaWFsaXplIHN0cmluZywgbnVtYmVyLCBhbmQgYm9vbGVhblxyXG4gICAgICAgICAgICAgICAgLy8gcHJpbWl0aXZlcyBhcyBvYmplY3QgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoMCkgPT09IFwiMFwiICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgYjIsIGFuZCBKU09OIDIgc2VyaWFsaXplIHdyYXBwZWQgcHJpbWl0aXZlcyBhcyBvYmplY3RcclxuICAgICAgICAgICAgICAgIC8vIGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBOdW1iZXIoKSkgPT09IFwiMFwiICYmXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IFN0cmluZygpKSA9PSAnXCJcIicgJiZcclxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSB2YWx1ZSBpcyBgbnVsbGAsIGB1bmRlZmluZWRgLCBvclxyXG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3QgZGVmaW5lIGEgY2Fub25pY2FsIEpTT04gcmVwcmVzZW50YXRpb24gKHRoaXMgYXBwbGllcyB0b1xyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGB0b0pTT05gIHByb3BlcnRpZXMgYXMgd2VsbCwgKnVubGVzcyogdGhleSBhcmUgbmVzdGVkXHJcbiAgICAgICAgICAgICAgICAvLyB3aXRoaW4gYW4gb2JqZWN0IG9yIGFycmF5KS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShnZXRDbGFzcykgPT09IHVuZGVmICYmXHJcbiAgICAgICAgICAgICAgICAvLyBJRSA4IHNlcmlhbGl6ZXMgYHVuZGVmaW5lZGAgYXMgYFwidW5kZWZpbmVkXCJgLiBTYWZhcmkgPD0gNS4xLjcgYW5kXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMyBwYXNzIHRoaXMgdGVzdC5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh1bmRlZikgPT09IHVuZGVmICYmXHJcbiAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjcgYW5kIEZGIDMuMWIzIHRocm93IGBFcnJvcmBzIGFuZCBgVHlwZUVycm9yYHMsXHJcbiAgICAgICAgICAgICAgICAvLyByZXNwZWN0aXZlbHksIGlmIHRoZSB2YWx1ZSBpcyBvbWl0dGVkIGVudGlyZWx5LlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KCkgPT09IHVuZGVmICYmXHJcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiB0aHJvdyBhbiBlcnJvciBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgbm90IGEgbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgLy8gc3RyaW5nLCBhcnJheSwgb2JqZWN0LCBCb29sZWFuLCBvciBgbnVsbGAgbGl0ZXJhbC4gVGhpcyBhcHBsaWVzIHRvXHJcbiAgICAgICAgICAgICAgICAvLyBvYmplY3RzIHdpdGggY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMgYXMgd2VsbCwgdW5sZXNzIHRoZXkgYXJlIG5lc3RlZFxyXG4gICAgICAgICAgICAgICAgLy8gaW5zaWRlIG9iamVjdCBvciBhcnJheSBsaXRlcmFscy4gWVVJIDMuMC4wYjEgaWdub3JlcyBjdXN0b20gYHRvSlNPTmBcclxuICAgICAgICAgICAgICAgIC8vIG1ldGhvZHMgZW50aXJlbHkuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodmFsdWUpID09PSBcIjFcIiAmJlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt2YWx1ZV0pID09IFwiWzFdXCIgJiZcclxuICAgICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBzZXJpYWxpemVzIGBbdW5kZWZpbmVkXWAgYXMgYFwiW11cImAgaW5zdGVhZCBvZlxyXG4gICAgICAgICAgICAgICAgLy8gYFwiW251bGxdXCJgLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt1bmRlZl0pID09IFwiW251bGxdXCIgJiZcclxuICAgICAgICAgICAgICAgIC8vIFlVSSAzLjAuMGIxIGZhaWxzIHRvIHNlcmlhbGl6ZSBgbnVsbGAgbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCkgPT0gXCJudWxsXCIgJiZcclxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIGhhbHRzIHNlcmlhbGl6YXRpb24gaWYgYW4gYXJyYXkgY29udGFpbnMgYSBmdW5jdGlvbjpcclxuICAgICAgICAgICAgICAgIC8vIGBbMSwgdHJ1ZSwgZ2V0Q2xhc3MsIDFdYCBzZXJpYWxpemVzIGFzIFwiWzEsdHJ1ZSxdLFwiLiBGRiAzLjFiM1xyXG4gICAgICAgICAgICAgICAgLy8gZWxpZGVzIG5vbi1KU09OIHZhbHVlcyBmcm9tIG9iamVjdHMgYW5kIGFycmF5cywgdW5sZXNzIHRoZXlcclxuICAgICAgICAgICAgICAgIC8vIGRlZmluZSBjdXN0b20gYHRvSlNPTmAgbWV0aG9kcy5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWYsIGdldENsYXNzLCBudWxsXSkgPT0gXCJbbnVsbCxudWxsLG51bGxdXCIgJiZcclxuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBzZXJpYWxpemF0aW9uIHRlc3QuIEZGIDMuMWIxIHVzZXMgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2VzXHJcbiAgICAgICAgICAgICAgICAvLyB3aGVyZSBjaGFyYWN0ZXIgZXNjYXBlIGNvZGVzIGFyZSBleHBlY3RlZCAoZS5nLiwgYFxcYmAgPT4gYFxcdTAwMDhgKS5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh7IFwiYVwiOiBbdmFsdWUsIHRydWUsIGZhbHNlLCBudWxsLCBcIlxceDAwXFxiXFxuXFxmXFxyXFx0XCJdIH0pID09IHNlcmlhbGl6ZWQgJiZcclxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxIGFuZCBiMiBpZ25vcmUgdGhlIGBmaWx0ZXJgIGFuZCBgd2lkdGhgIGFyZ3VtZW50cy5cclxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShudWxsLCB2YWx1ZSkgPT09IFwiMVwiICYmXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoWzEsIDJdLCBudWxsLCAxKSA9PSBcIltcXG4gMSxcXG4gMlxcbl1cIiAmJlxyXG4gICAgICAgICAgICAgICAgLy8gSlNPTiAyLCBQcm90b3R5cGUgPD0gMS43LCBhbmQgb2xkZXIgV2ViS2l0IGJ1aWxkcyBpbmNvcnJlY3RseVxyXG4gICAgICAgICAgICAgICAgLy8gc2VyaWFsaXplIGV4dGVuZGVkIHllYXJzLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC04LjY0ZTE1KSkgPT0gJ1wiLTI3MTgyMS0wNC0yMFQwMDowMDowMC4wMDBaXCInICYmXHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgbWlsbGlzZWNvbmRzIGFyZSBvcHRpb25hbCBpbiBFUyA1LCBidXQgcmVxdWlyZWQgaW4gNS4xLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKDguNjRlMTUpKSA9PSAnXCIrMjc1NzYwLTA5LTEzVDAwOjAwOjAwLjAwMFpcIicgJiZcclxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggPD0gMTEuMCBpbmNvcnJlY3RseSBzZXJpYWxpemVzIHllYXJzIHByaW9yIHRvIDAgYXMgbmVnYXRpdmVcclxuICAgICAgICAgICAgICAgIC8vIGZvdXItZGlnaXQgeWVhcnMgaW5zdGVhZCBvZiBzaXgtZGlnaXQgeWVhcnMuIENyZWRpdHM6IEBZYWZmbGUuXHJcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTYyMTk4NzU1MmU1KSkgPT0gJ1wiLTAwMDAwMS0wMS0wMVQwMDowMDowMC4wMDBaXCInICYmXHJcbiAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjUgYW5kIE9wZXJhID49IDEwLjUzIGluY29ycmVjdGx5IHNlcmlhbGl6ZSBtaWxsaXNlY29uZFxyXG4gICAgICAgICAgICAgICAgLy8gdmFsdWVzIGxlc3MgdGhhbiAxMDAwLiBDcmVkaXRzOiBAWWFmZmxlLlxyXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC0xKSkgPT0gJ1wiMTk2OS0xMi0zMVQyMzo1OTo1OS45OTlaXCInO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcclxuICAgICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaXNTdXBwb3J0ZWQgPSBzdHJpbmdpZnlTdXBwb3J0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFRlc3QgYEpTT04ucGFyc2VgLlxyXG4gICAgICAgIGlmIChuYW1lID09IFwianNvbi1wYXJzZVwiKSB7XHJcbiAgICAgICAgICB2YXIgcGFyc2UgPSBleHBvcnRzLnBhcnNlO1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiBwYXJzZSA9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgYjIgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgYSBiYXJlIGxpdGVyYWwgaXMgcHJvdmlkZWQuXHJcbiAgICAgICAgICAgICAgLy8gQ29uZm9ybWluZyBpbXBsZW1lbnRhdGlvbnMgc2hvdWxkIGFsc28gY29lcmNlIHRoZSBpbml0aWFsIGFyZ3VtZW50IHRvXHJcbiAgICAgICAgICAgICAgLy8gYSBzdHJpbmcgcHJpb3IgdG8gcGFyc2luZy5cclxuICAgICAgICAgICAgICBpZiAocGFyc2UoXCIwXCIpID09PSAwICYmICFwYXJzZShmYWxzZSkpIHtcclxuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBwYXJzaW5nIHRlc3QuXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcnNlKHNlcmlhbGl6ZWQpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlU3VwcG9ydGVkID0gdmFsdWVbXCJhXCJdLmxlbmd0aCA9PSA1ICYmIHZhbHVlW1wiYVwiXVswXSA9PT0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuMiBhbmQgRkYgMy4xYjEgYWxsb3cgdW5lc2NhcGVkIHRhYnMgaW4gc3RyaW5ncy5cclxuICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9ICFwYXJzZSgnXCJcXHRcIicpO1xyXG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAgYW5kIDQuMC4xIGFsbG93IGxlYWRpbmcgYCtgIHNpZ25zIGFuZCBsZWFkaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBkZWNpbWFsIHBvaW50cy4gRkYgNC4wLCA0LjAuMSwgYW5kIElFIDktMTAgYWxzbyBhbGxvd1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gY2VydGFpbiBvY3RhbCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIwMVwiKSAhPT0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIEZGIDQuMCwgNC4wLjEsIGFuZCBSaGlubyAxLjdSMy1SNCBhbGxvdyB0cmFpbGluZyBkZWNpbWFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBwb2ludHMuIFRoZXNlIGVudmlyb25tZW50cywgYWxvbmcgd2l0aCBGRiAzLjFiMSBhbmQgMixcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIGFsc28gYWxsb3cgdHJhaWxpbmcgY29tbWFzIGluIEpTT04gb2JqZWN0cyBhbmQgYXJyYXlzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBwYXJzZShcIjEuXCIpICE9PSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaXNTdXBwb3J0ZWQgPSBwYXJzZVN1cHBvcnRlZDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGhhc1tuYW1lXSA9ICEhaXNTdXBwb3J0ZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRydWUpIHsgLy8gdXNlZCB0byBiZSAhaGFzKFwianNvblwiKVxyXG4gICAgICAvLyBDb21tb24gYFtbQ2xhc3NdXWAgbmFtZSBhbGlhc2VzLlxyXG4gICAgICB2YXIgZnVuY3Rpb25DbGFzcyA9IFwiW29iamVjdCBGdW5jdGlvbl1cIixcclxuICAgICAgICAgIGRhdGVDbGFzcyA9IFwiW29iamVjdCBEYXRlXVwiLFxyXG4gICAgICAgICAgbnVtYmVyQ2xhc3MgPSBcIltvYmplY3QgTnVtYmVyXVwiLFxyXG4gICAgICAgICAgc3RyaW5nQ2xhc3MgPSBcIltvYmplY3QgU3RyaW5nXVwiLFxyXG4gICAgICAgICAgYXJyYXlDbGFzcyA9IFwiW29iamVjdCBBcnJheV1cIixcclxuICAgICAgICAgIGJvb2xlYW5DbGFzcyA9IFwiW29iamVjdCBCb29sZWFuXVwiO1xyXG5cclxuICAgICAgLy8gRGV0ZWN0IGluY29tcGxldGUgc3VwcG9ydCBmb3IgYWNjZXNzaW5nIHN0cmluZyBjaGFyYWN0ZXJzIGJ5IGluZGV4LlxyXG4gICAgICB2YXIgY2hhckluZGV4QnVnZ3kgPSBoYXMoXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIik7XHJcblxyXG4gICAgICAvLyBEZWZpbmUgYWRkaXRpb25hbCB1dGlsaXR5IG1ldGhvZHMgaWYgdGhlIGBEYXRlYCBtZXRob2RzIGFyZSBidWdneS5cclxuICAgICAgaWYgKCFpc0V4dGVuZGVkKSB7XHJcbiAgICAgICAgdmFyIGZsb29yID0gTWF0aC5mbG9vcjtcclxuICAgICAgICAvLyBBIG1hcHBpbmcgYmV0d2VlbiB0aGUgbW9udGhzIG9mIHRoZSB5ZWFyIGFuZCB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlblxyXG4gICAgICAgIC8vIEphbnVhcnkgMXN0IGFuZCB0aGUgZmlyc3Qgb2YgdGhlIHJlc3BlY3RpdmUgbW9udGguXHJcbiAgICAgICAgdmFyIE1vbnRocyA9IFswLCAzMSwgNTksIDkwLCAxMjAsIDE1MSwgMTgxLCAyMTIsIDI0MywgMjczLCAzMDQsIDMzNF07XHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IENhbGN1bGF0ZXMgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW4gdGhlIFVuaXggZXBvY2ggYW5kIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0IGRheSBvZiB0aGUgZ2l2ZW4gbW9udGguXHJcbiAgICAgICAgdmFyIGdldERheSA9IGZ1bmN0aW9uICh5ZWFyLCBtb250aCkge1xyXG4gICAgICAgICAgcmV0dXJuIE1vbnRoc1ttb250aF0gKyAzNjUgKiAoeWVhciAtIDE5NzApICsgZmxvb3IoKHllYXIgLSAxOTY5ICsgKG1vbnRoID0gKyhtb250aCA+IDEpKSkgLyA0KSAtIGZsb29yKCh5ZWFyIC0gMTkwMSArIG1vbnRoKSAvIDEwMCkgKyBmbG9vcigoeWVhciAtIDE2MDEgKyBtb250aCkgLyA0MDApO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIGlmIGEgcHJvcGVydHkgaXMgYSBkaXJlY3QgcHJvcGVydHkgb2YgdGhlIGdpdmVuXHJcbiAgICAgIC8vIG9iamVjdC4gRGVsZWdhdGVzIHRvIHRoZSBuYXRpdmUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgbWV0aG9kLlxyXG4gICAgICBpZiAoIShpc1Byb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHkpKSB7XHJcbiAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgY29uc3RydWN0b3I7XHJcbiAgICAgICAgICBpZiAoKG1lbWJlcnMuX19wcm90b19fID0gbnVsbCwgbWVtYmVycy5fX3Byb3RvX18gPSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSAqcHJvdG8qIHByb3BlcnR5IGNhbm5vdCBiZSBzZXQgbXVsdGlwbGUgdGltZXMgaW4gcmVjZW50XHJcbiAgICAgICAgICAgIC8vIHZlcnNpb25zIG9mIEZpcmVmb3ggYW5kIFNlYU1vbmtleS5cclxuICAgICAgICAgICAgXCJ0b1N0cmluZ1wiOiAxXHJcbiAgICAgICAgICB9LCBtZW1iZXJzKS50b1N0cmluZyAhPSBnZXRDbGFzcykge1xyXG4gICAgICAgICAgICAvLyBTYWZhcmkgPD0gMi4wLjMgZG9lc24ndCBpbXBsZW1lbnQgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAsIGJ1dFxyXG4gICAgICAgICAgICAvLyBzdXBwb3J0cyB0aGUgbXV0YWJsZSAqcHJvdG8qIHByb3BlcnR5LlxyXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgLy8gQ2FwdHVyZSBhbmQgYnJlYWsgdGhlIG9iamVjdCdzIHByb3RvdHlwZSBjaGFpbiAoc2VlIHNlY3Rpb24gOC42LjJcclxuICAgICAgICAgICAgICAvLyBvZiB0aGUgRVMgNS4xIHNwZWMpLiBUaGUgcGFyZW50aGVzaXplZCBleHByZXNzaW9uIHByZXZlbnRzIGFuXHJcbiAgICAgICAgICAgICAgLy8gdW5zYWZlIHRyYW5zZm9ybWF0aW9uIGJ5IHRoZSBDbG9zdXJlIENvbXBpbGVyLlxyXG4gICAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXMuX19wcm90b19fLCByZXN1bHQgPSBwcm9wZXJ0eSBpbiAodGhpcy5fX3Byb3RvX18gPSBudWxsLCB0aGlzKTtcclxuICAgICAgICAgICAgICAvLyBSZXN0b3JlIHRoZSBvcmlnaW5hbCBwcm90b3R5cGUgY2hhaW4uXHJcbiAgICAgICAgICAgICAgdGhpcy5fX3Byb3RvX18gPSBvcmlnaW5hbDtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gQ2FwdHVyZSBhIHJlZmVyZW5jZSB0byB0aGUgdG9wLWxldmVsIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxyXG4gICAgICAgICAgICBjb25zdHJ1Y3RvciA9IG1lbWJlcnMuY29uc3RydWN0b3I7XHJcbiAgICAgICAgICAgIC8vIFVzZSB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSB0byBzaW11bGF0ZSBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpblxyXG4gICAgICAgICAgICAvLyBvdGhlciBlbnZpcm9ubWVudHMuXHJcbiAgICAgICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gKHRoaXMuY29uc3RydWN0b3IgfHwgY29uc3RydWN0b3IpLnByb3RvdHlwZTtcclxuICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHkgaW4gdGhpcyAmJiAhKHByb3BlcnR5IGluIHBhcmVudCAmJiB0aGlzW3Byb3BlcnR5XSA9PT0gcGFyZW50W3Byb3BlcnR5XSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBtZW1iZXJzID0gbnVsbDtcclxuICAgICAgICAgIHJldHVybiBpc1Byb3BlcnR5LmNhbGwodGhpcywgcHJvcGVydHkpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEludGVybmFsOiBOb3JtYWxpemVzIHRoZSBgZm9yLi4uaW5gIGl0ZXJhdGlvbiBhbGdvcml0aG0gYWNyb3NzXHJcbiAgICAgIC8vIGVudmlyb25tZW50cy4gRWFjaCBlbnVtZXJhdGVkIGtleSBpcyB5aWVsZGVkIHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi5cclxuICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIHNpemUgPSAwLCBQcm9wZXJ0aWVzLCBtZW1iZXJzLCBwcm9wZXJ0eTtcclxuXHJcbiAgICAgICAgLy8gVGVzdHMgZm9yIGJ1Z3MgaW4gdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQncyBgZm9yLi4uaW5gIGFsZ29yaXRobS4gVGhlXHJcbiAgICAgICAgLy8gYHZhbHVlT2ZgIHByb3BlcnR5IGluaGVyaXRzIHRoZSBub24tZW51bWVyYWJsZSBmbGFnIGZyb21cclxuICAgICAgICAvLyBgT2JqZWN0LnByb3RvdHlwZWAgaW4gb2xkZXIgdmVyc2lvbnMgb2YgSUUsIE5ldHNjYXBlLCBhbmQgTW96aWxsYS5cclxuICAgICAgICAoUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHRoaXMudmFsdWVPZiA9IDA7XHJcbiAgICAgICAgfSkucHJvdG90eXBlLnZhbHVlT2YgPSAwO1xyXG5cclxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBQcm9wZXJ0aWVzYCBjbGFzcy5cclxuICAgICAgICBtZW1iZXJzID0gbmV3IFByb3BlcnRpZXMoKTtcclxuICAgICAgICBmb3IgKHByb3BlcnR5IGluIG1lbWJlcnMpIHtcclxuICAgICAgICAgIC8vIElnbm9yZSBhbGwgcHJvcGVydGllcyBpbmhlcml0ZWQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuXHJcbiAgICAgICAgICBpZiAoaXNQcm9wZXJ0eS5jYWxsKG1lbWJlcnMsIHByb3BlcnR5KSkge1xyXG4gICAgICAgICAgICBzaXplKys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFByb3BlcnRpZXMgPSBtZW1iZXJzID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBpdGVyYXRpb24gYWxnb3JpdGhtLlxyXG4gICAgICAgIGlmICghc2l6ZSkge1xyXG4gICAgICAgICAgLy8gQSBsaXN0IG9mIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxyXG4gICAgICAgICAgbWVtYmVycyA9IFtcInZhbHVlT2ZcIiwgXCJ0b1N0cmluZ1wiLCBcInRvTG9jYWxlU3RyaW5nXCIsIFwicHJvcGVydHlJc0VudW1lcmFibGVcIiwgXCJpc1Byb3RvdHlwZU9mXCIsIFwiaGFzT3duUHJvcGVydHlcIiwgXCJjb25zdHJ1Y3RvclwiXTtcclxuICAgICAgICAgIC8vIElFIDw9IDgsIE1vemlsbGEgMS4wLCBhbmQgTmV0c2NhcGUgNi4yIGlnbm9yZSBzaGFkb3dlZCBub24tZW51bWVyYWJsZVxyXG4gICAgICAgICAgLy8gcHJvcGVydGllcy5cclxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgbGVuZ3RoO1xyXG4gICAgICAgICAgICB2YXIgaGFzUHJvcGVydHkgPSAhaXNGdW5jdGlvbiAmJiB0eXBlb2Ygb2JqZWN0LmNvbnN0cnVjdG9yICE9IFwiZnVuY3Rpb25cIiAmJiBvYmplY3RUeXBlc1t0eXBlb2Ygb2JqZWN0Lmhhc093blByb3BlcnR5XSAmJiBvYmplY3QuaGFzT3duUHJvcGVydHkgfHwgaXNQcm9wZXJ0eTtcclxuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcclxuICAgICAgICAgICAgICAvLyBHZWNrbyA8PSAxLjAgZW51bWVyYXRlcyB0aGUgYHByb3RvdHlwZWAgcHJvcGVydHkgb2YgZnVuY3Rpb25zIHVuZGVyXHJcbiAgICAgICAgICAgICAgLy8gY2VydGFpbiBjb25kaXRpb25zOyBJRSBkb2VzIG5vdC5cclxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBub24tZW51bWVyYWJsZSBwcm9wZXJ0eS5cclxuICAgICAgICAgICAgZm9yIChsZW5ndGggPSBtZW1iZXJzLmxlbmd0aDsgcHJvcGVydHkgPSBtZW1iZXJzWy0tbGVuZ3RoXTsgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiBjYWxsYmFjayhwcm9wZXJ0eSkpO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNpemUgPT0gMikge1xyXG4gICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC40IGVudW1lcmF0ZXMgc2hhZG93ZWQgcHJvcGVydGllcyB0d2ljZS5cclxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBzZXQgb2YgaXRlcmF0ZWQgcHJvcGVydGllcy5cclxuICAgICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eTtcclxuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcclxuICAgICAgICAgICAgICAvLyBTdG9yZSBlYWNoIHByb3BlcnR5IG5hbWUgdG8gcHJldmVudCBkb3VibGUgZW51bWVyYXRpb24uIFRoZVxyXG4gICAgICAgICAgICAgIC8vIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBpcyBub3QgZW51bWVyYXRlZCBkdWUgdG8gY3Jvc3MtXHJcbiAgICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxyXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgIWlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkgJiYgKG1lbWJlcnNbcHJvcGVydHldID0gMSkgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBObyBidWdzIGRldGVjdGVkOyB1c2UgdGhlIHN0YW5kYXJkIGBmb3IuLi5pbmAgYWxnb3JpdGhtLlxyXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHZhciBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5LCBpc0NvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xyXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpICYmICEoaXNDb25zdHJ1Y3RvciA9IHByb3BlcnR5ID09PSBcImNvbnN0cnVjdG9yXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIHRoZSBgY29uc3RydWN0b3JgIHByb3BlcnR5IGR1ZSB0b1xyXG4gICAgICAgICAgICAvLyBjcm9zcy1lbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXHJcbiAgICAgICAgICAgIGlmIChpc0NvbnN0cnVjdG9yIHx8IGlzUHJvcGVydHkuY2FsbChvYmplY3QsIChwcm9wZXJ0eSA9IFwiY29uc3RydWN0b3JcIikpKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZm9yRWFjaChvYmplY3QsIGNhbGxiYWNrKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIFB1YmxpYzogU2VyaWFsaXplcyBhIEphdmFTY3JpcHQgYHZhbHVlYCBhcyBhIEpTT04gc3RyaW5nLiBUaGUgb3B0aW9uYWxcclxuICAgICAgLy8gYGZpbHRlcmAgYXJndW1lbnQgbWF5IHNwZWNpZnkgZWl0aGVyIGEgZnVuY3Rpb24gdGhhdCBhbHRlcnMgaG93IG9iamVjdCBhbmRcclxuICAgICAgLy8gYXJyYXkgbWVtYmVycyBhcmUgc2VyaWFsaXplZCwgb3IgYW4gYXJyYXkgb2Ygc3RyaW5ncyBhbmQgbnVtYmVycyB0aGF0XHJcbiAgICAgIC8vIGluZGljYXRlcyB3aGljaCBwcm9wZXJ0aWVzIHNob3VsZCBiZSBzZXJpYWxpemVkLiBUaGUgb3B0aW9uYWwgYHdpZHRoYFxyXG4gICAgICAvLyBhcmd1bWVudCBtYXkgYmUgZWl0aGVyIGEgc3RyaW5nIG9yIG51bWJlciB0aGF0IHNwZWNpZmllcyB0aGUgaW5kZW50YXRpb25cclxuICAgICAgLy8gbGV2ZWwgb2YgdGhlIG91dHB1dC5cclxuICAgICAgaWYgKHRydWUpIHtcclxuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgY29udHJvbCBjaGFyYWN0ZXJzIGFuZCB0aGVpciBlc2NhcGVkIGVxdWl2YWxlbnRzLlxyXG4gICAgICAgIHZhciBFc2NhcGVzID0ge1xyXG4gICAgICAgICAgOTI6IFwiXFxcXFxcXFxcIixcclxuICAgICAgICAgIDM0OiAnXFxcXFwiJyxcclxuICAgICAgICAgIDg6IFwiXFxcXGJcIixcclxuICAgICAgICAgIDEyOiBcIlxcXFxmXCIsXHJcbiAgICAgICAgICAxMDogXCJcXFxcblwiLFxyXG4gICAgICAgICAgMTM6IFwiXFxcXHJcIixcclxuICAgICAgICAgIDk6IFwiXFxcXHRcIlxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBDb252ZXJ0cyBgdmFsdWVgIGludG8gYSB6ZXJvLXBhZGRlZCBzdHJpbmcgc3VjaCB0aGF0IGl0c1xyXG4gICAgICAgIC8vIGxlbmd0aCBpcyBhdCBsZWFzdCBlcXVhbCB0byBgd2lkdGhgLiBUaGUgYHdpZHRoYCBtdXN0IGJlIDw9IDYuXHJcbiAgICAgICAgdmFyIGxlYWRpbmdaZXJvZXMgPSBcIjAwMDAwMFwiO1xyXG4gICAgICAgIHZhciB0b1BhZGRlZFN0cmluZyA9IGZ1bmN0aW9uICh3aWR0aCwgdmFsdWUpIHtcclxuICAgICAgICAgIC8vIFRoZSBgfHwgMGAgZXhwcmVzc2lvbiBpcyBuZWNlc3NhcnkgdG8gd29yayBhcm91bmQgYSBidWcgaW5cclxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiB3aGVyZSBgMCA9PSAtMGAsIGJ1dCBgU3RyaW5nKC0wKSAhPT0gXCIwXCJgLlxyXG4gICAgICAgICAgcmV0dXJuIChsZWFkaW5nWmVyb2VzICsgKHZhbHVlIHx8IDApKS5zbGljZSgtd2lkdGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBEb3VibGUtcXVvdGVzIGEgc3RyaW5nIGB2YWx1ZWAsIHJlcGxhY2luZyBhbGwgQVNDSUkgY29udHJvbFxyXG4gICAgICAgIC8vIGNoYXJhY3RlcnMgKGNoYXJhY3RlcnMgd2l0aCBjb2RlIHVuaXQgdmFsdWVzIGJldHdlZW4gMCBhbmQgMzEpIHdpdGhcclxuICAgICAgICAvLyB0aGVpciBlc2NhcGVkIGVxdWl2YWxlbnRzLiBUaGlzIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIHRoZVxyXG4gICAgICAgIC8vIGBRdW90ZSh2YWx1ZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXHJcbiAgICAgICAgdmFyIHVuaWNvZGVQcmVmaXggPSBcIlxcXFx1MDBcIjtcclxuICAgICAgICB2YXIgcXVvdGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgIHZhciByZXN1bHQgPSAnXCInLCBpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aCwgdXNlQ2hhckluZGV4ID0gIWNoYXJJbmRleEJ1Z2d5IHx8IGxlbmd0aCA+IDEwO1xyXG4gICAgICAgICAgdmFyIHN5bWJvbHMgPSB1c2VDaGFySW5kZXggJiYgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuc3BsaXQoXCJcIikgOiB2YWx1ZSk7XHJcbiAgICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgdmFyIGNoYXJDb2RlID0gdmFsdWUuY2hhckNvZGVBdChpbmRleCk7XHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgYSBjb250cm9sIGNoYXJhY3RlciwgYXBwZW5kIGl0cyBVbmljb2RlIG9yXHJcbiAgICAgICAgICAgIC8vIHNob3J0aGFuZCBlc2NhcGUgc2VxdWVuY2U7IG90aGVyd2lzZSwgYXBwZW5kIHRoZSBjaGFyYWN0ZXIgYXMtaXMuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcclxuICAgICAgICAgICAgICBjYXNlIDg6IGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMjogY2FzZSAxMzogY2FzZSAzNDogY2FzZSA5MjpcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBFc2NhcGVzW2NoYXJDb2RlXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPCAzMikge1xyXG4gICAgICAgICAgICAgICAgICByZXN1bHQgKz0gdW5pY29kZVByZWZpeCArIHRvUGFkZGVkU3RyaW5nKDIsIGNoYXJDb2RlLnRvU3RyaW5nKDE2KSk7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHVzZUNoYXJJbmRleCA/IHN5bWJvbHNbaW5kZXhdIDogdmFsdWUuY2hhckF0KGluZGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdCArICdcIic7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZXMgYW4gb2JqZWN0LiBJbXBsZW1lbnRzIHRoZVxyXG4gICAgICAgIC8vIGBTdHIoa2V5LCBob2xkZXIpYCwgYEpPKHZhbHVlKWAsIGFuZCBgSkEodmFsdWUpYCBvcGVyYXRpb25zLlxyXG4gICAgICAgIHZhciBzZXJpYWxpemUgPSBmdW5jdGlvbiAocHJvcGVydHksIG9iamVjdCwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjaywgbWF4TGluZUxlbmd0aCkge1xyXG4gICAgICAgICAgdmFyIHZhbHVlLCBjbGFzc05hbWUsIHllYXIsIG1vbnRoLCBkYXRlLCB0aW1lLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzLCByZXN1bHRzLCBlbGVtZW50LCBpbmRleCwgbGVuZ3RoLCBwcmVmaXgsIHJlc3VsdDtcclxuXHJcbiAgICAgICAgICBtYXhMaW5lTGVuZ3RoID0gbWF4TGluZUxlbmd0aCB8fCAwO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgaG9zdCBvYmplY3Qgc3VwcG9ydC5cclxuICAgICAgICAgICAgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGRhdGVDbGFzcyAmJiAhaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkge1xyXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA+IC0xIC8gMCAmJiB2YWx1ZSA8IDEgLyAwKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEYXRlcyBhcmUgc2VyaWFsaXplZCBhY2NvcmRpbmcgdG8gdGhlIGBEYXRlI3RvSlNPTmAgbWV0aG9kXHJcbiAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuOS41LjQ0LiBTZWUgc2VjdGlvbiAxNS45LjEuMTVcclxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgSVNPIDg2MDEgZGF0ZSB0aW1lIHN0cmluZyBmb3JtYXQuXHJcbiAgICAgICAgICAgICAgICBpZiAoZ2V0RGF5KSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNvbXB1dGUgdGhlIHllYXIsIG1vbnRoLCBkYXRlLCBob3VycywgbWludXRlcyxcclxuICAgICAgICAgICAgICAgICAgLy8gc2Vjb25kcywgYW5kIG1pbGxpc2Vjb25kcyBpZiB0aGUgYGdldFVUQypgIG1ldGhvZHMgYXJlXHJcbiAgICAgICAgICAgICAgICAgIC8vIGJ1Z2d5LiBBZGFwdGVkIGZyb20gQFlhZmZsZSdzIGBkYXRlLXNoaW1gIHByb2plY3QuXHJcbiAgICAgICAgICAgICAgICAgIGRhdGUgPSBmbG9vcih2YWx1ZSAvIDg2NGU1KTtcclxuICAgICAgICAgICAgICAgICAgZm9yICh5ZWFyID0gZmxvb3IoZGF0ZSAvIDM2NS4yNDI1KSArIDE5NzAgLSAxOyBnZXREYXkoeWVhciArIDEsIDApIDw9IGRhdGU7IHllYXIrKyk7XHJcbiAgICAgICAgICAgICAgICAgIGZvciAobW9udGggPSBmbG9vcigoZGF0ZSAtIGdldERheSh5ZWFyLCAwKSkgLyAzMC40Mik7IGdldERheSh5ZWFyLCBtb250aCArIDEpIDw9IGRhdGU7IG1vbnRoKyspO1xyXG4gICAgICAgICAgICAgICAgICBkYXRlID0gMSArIGRhdGUgLSBnZXREYXkoeWVhciwgbW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgYHRpbWVgIHZhbHVlIHNwZWNpZmllcyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheSAoc2VlIEVTXHJcbiAgICAgICAgICAgICAgICAgIC8vIDUuMSBzZWN0aW9uIDE1LjkuMS4yKS4gVGhlIGZvcm11bGEgYChBICUgQiArIEIpICUgQmAgaXMgdXNlZFxyXG4gICAgICAgICAgICAgICAgICAvLyB0byBjb21wdXRlIGBBIG1vZHVsbyBCYCwgYXMgdGhlIGAlYCBvcGVyYXRvciBkb2VzIG5vdFxyXG4gICAgICAgICAgICAgICAgICAvLyBjb3JyZXNwb25kIHRvIHRoZSBgbW9kdWxvYCBvcGVyYXRpb24gZm9yIG5lZ2F0aXZlIG51bWJlcnMuXHJcbiAgICAgICAgICAgICAgICAgIHRpbWUgPSAodmFsdWUgJSA4NjRlNSArIDg2NGU1KSAlIDg2NGU1O1xyXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgYXJlIG9idGFpbmVkIGJ5XHJcbiAgICAgICAgICAgICAgICAgIC8vIGRlY29tcG9zaW5nIHRoZSB0aW1lIHdpdGhpbiB0aGUgZGF5LiBTZWUgc2VjdGlvbiAxNS45LjEuMTAuXHJcbiAgICAgICAgICAgICAgICAgIGhvdXJzID0gZmxvb3IodGltZSAvIDM2ZTUpICUgMjQ7XHJcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBmbG9vcih0aW1lIC8gNmU0KSAlIDYwO1xyXG4gICAgICAgICAgICAgICAgICBzZWNvbmRzID0gZmxvb3IodGltZSAvIDFlMykgJSA2MDtcclxuICAgICAgICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gdGltZSAlIDFlMztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHllYXIgPSB2YWx1ZS5nZXRVVENGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICBtb250aCA9IHZhbHVlLmdldFVUQ01vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgIGRhdGUgPSB2YWx1ZS5nZXRVVENEYXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgIGhvdXJzID0gdmFsdWUuZ2V0VVRDSG91cnMoKTtcclxuICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHZhbHVlLmdldFVUQ01pbnV0ZXMoKTtcclxuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHZhbHVlLmdldFVUQ1NlY29uZHMoKTtcclxuICAgICAgICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gdmFsdWUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBTZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMgY29ycmVjdGx5LlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSAoeWVhciA8PSAwIHx8IHllYXIgPj0gMWU0ID8gKHllYXIgPCAwID8gXCItXCIgOiBcIitcIikgKyB0b1BhZGRlZFN0cmluZyg2LCB5ZWFyIDwgMCA/IC15ZWFyIDogeWVhcikgOiB0b1BhZGRlZFN0cmluZyg0LCB5ZWFyKSkgK1xyXG4gICAgICAgICAgICAgICAgICBcIi1cIiArIHRvUGFkZGVkU3RyaW5nKDIsIG1vbnRoICsgMSkgKyBcIi1cIiArIHRvUGFkZGVkU3RyaW5nKDIsIGRhdGUpICtcclxuICAgICAgICAgICAgICAgICAgLy8gTW9udGhzLCBkYXRlcywgaG91cnMsIG1pbnV0ZXMsIGFuZCBzZWNvbmRzIHNob3VsZCBoYXZlIHR3b1xyXG4gICAgICAgICAgICAgICAgICAvLyBkaWdpdHM7IG1pbGxpc2Vjb25kcyBzaG91bGQgaGF2ZSB0aHJlZS5cclxuICAgICAgICAgICAgICAgICAgXCJUXCIgKyB0b1BhZGRlZFN0cmluZygyLCBob3VycykgKyBcIjpcIiArIHRvUGFkZGVkU3RyaW5nKDIsIG1pbnV0ZXMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBzZWNvbmRzKSArXHJcbiAgICAgICAgICAgICAgICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNS4wLCBidXQgcmVxdWlyZWQgaW4gNS4xLlxyXG4gICAgICAgICAgICAgICAgICBcIi5cIiArIHRvUGFkZGVkU3RyaW5nKDMsIG1pbGxpc2Vjb25kcykgKyBcIlpcIjtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUudG9KU09OID09IFwiZnVuY3Rpb25cIiAmJiAoKGNsYXNzTmFtZSAhPSBudW1iZXJDbGFzcyAmJiBjbGFzc05hbWUgIT0gc3RyaW5nQ2xhc3MgJiYgY2xhc3NOYW1lICE9IGFycmF5Q2xhc3MpIHx8IGlzUHJvcGVydHkuY2FsbCh2YWx1ZSwgXCJ0b0pTT05cIikpKSB7XHJcbiAgICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIGFkZHMgbm9uLXN0YW5kYXJkIGB0b0pTT05gIG1ldGhvZHMgdG8gdGhlXHJcbiAgICAgICAgICAgICAgLy8gYE51bWJlcmAsIGBTdHJpbmdgLCBgRGF0ZWAsIGFuZCBgQXJyYXlgIHByb3RvdHlwZXMuIEpTT04gM1xyXG4gICAgICAgICAgICAgIC8vIGlnbm9yZXMgYWxsIGB0b0pTT05gIG1ldGhvZHMgb24gdGhlc2Ugb2JqZWN0cyB1bmxlc3MgdGhleSBhcmVcclxuICAgICAgICAgICAgICAvLyBkZWZpbmVkIGRpcmVjdGx5IG9uIGFuIGluc3RhbmNlLlxyXG4gICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGEgcmVwbGFjZW1lbnQgZnVuY3Rpb24gd2FzIHByb3ZpZGVkLCBjYWxsIGl0IHRvIG9idGFpbiB0aGUgdmFsdWVcclxuICAgICAgICAgICAgLy8gZm9yIHNlcmlhbGl6YXRpb24uXHJcbiAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmplY3QsIHByb3BlcnR5LCB2YWx1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XHJcbiAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGJvb2xlYW5DbGFzcykge1xyXG4gICAgICAgICAgICAvLyBCb29sZWFucyBhcmUgcmVwcmVzZW50ZWQgbGl0ZXJhbGx5LlxyXG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIHZhbHVlO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpIHtcclxuICAgICAgICAgICAgLy8gSlNPTiBudW1iZXJzIG11c3QgYmUgZmluaXRlLiBgSW5maW5pdHlgIGFuZCBgTmFOYCBhcmUgc2VyaWFsaXplZCBhc1xyXG4gICAgICAgICAgICAvLyBgXCJudWxsXCJgLlxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCA/IFwiXCIgKyB2YWx1ZSA6IFwibnVsbFwiO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MpIHtcclxuICAgICAgICAgICAgLy8gU3RyaW5ncyBhcmUgZG91YmxlLXF1b3RlZCBhbmQgZXNjYXBlZC5cclxuICAgICAgICAgICAgcmV0dXJuIHF1b3RlKFwiXCIgKyB2YWx1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0cyBhbmQgYXJyYXlzLlxyXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhpcyBpcyBhIGxpbmVhciBzZWFyY2g7IHBlcmZvcm1hbmNlXHJcbiAgICAgICAgICAgIC8vIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZiB1bmlxdWUgbmVzdGVkIG9iamVjdHMuXHJcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gc3RhY2subGVuZ3RoOyBsZW5ndGgtLTspIHtcclxuICAgICAgICAgICAgICBpZiAoc3RhY2tbbGVuZ3RoXSA9PT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEN5Y2xpYyBzdHJ1Y3R1cmVzIGNhbm5vdCBiZSBzZXJpYWxpemVkIGJ5IGBKU09OLnN0cmluZ2lmeWAuXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQWRkIHRoZSBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxyXG4gICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsIGFuZCBpbmRlbnQgb25lIGFkZGl0aW9uYWwgbGV2ZWwuXHJcbiAgICAgICAgICAgIHByZWZpeCA9IGluZGVudGF0aW9uO1xyXG4gICAgICAgICAgICBpbmRlbnRhdGlvbiArPSB3aGl0ZXNwYWNlO1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGFycmF5Q2xhc3MpIHtcclxuICAgICAgICAgICAgICB2YXIgdG90YWxMZW5ndGggPSBpbmRlbnRhdGlvbi5sZW5ndGgsIHJlc3VsdDtcclxuICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgYXJyYXkgZWxlbWVudHMuXHJcbiAgICAgICAgICAgICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzZXJpYWxpemUoaW5kZXgsIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sXHJcbiAgICAgICAgICAgICAgICAgIHN0YWNrLCBtYXhMaW5lTGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGVsZW1lbnQgPT09IHVuZGVmID8gXCJudWxsXCIgOiBlbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgdG90YWxMZW5ndGggKz0gcmVzdWx0Lmxlbmd0aCArIChpbmRleCA+IDAgPyAxIDogMCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggP1xyXG4gICAgICAgICAgICAgICAgKFxyXG4gICAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlICYmICh0b3RhbExlbmd0aCA+IG1heExpbmVMZW5ndGgpID9cclxuICAgICAgICAgICAgICAgICAgXCJbXFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIl1cIiA6XHJcbiAgICAgICAgICAgICAgICAgIFwiW1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwiXVwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICA6IFwiW11cIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB2YXIgdG90YWxMZW5ndGggPSBpbmRlbnRhdGlvbi5sZW5ndGgsIGluZGV4PTA7XHJcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdCBtZW1iZXJzLiBNZW1iZXJzIGFyZSBzZWxlY3RlZCBmcm9tXHJcbiAgICAgICAgICAgICAgLy8gZWl0aGVyIGEgdXNlci1zcGVjaWZpZWQgbGlzdCBvZiBwcm9wZXJ0eSBuYW1lcywgb3IgdGhlIG9iamVjdFxyXG4gICAgICAgICAgICAgIC8vIGl0c2VsZi5cclxuICAgICAgICAgICAgICBmb3JFYWNoKHByb3BlcnRpZXMgfHwgdmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCwgZWxlbWVudCA9IHNlcmlhbGl6ZShwcm9wZXJ0eSwgdmFsdWUsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLCBtYXhMaW5lTGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gdW5kZWYpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gQWNjb3JkaW5nIHRvIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjM6IFwiSWYgYGdhcGAge3doaXRlc3BhY2V9XHJcbiAgICAgICAgICAgICAgICAgIC8vIGlzIG5vdCB0aGUgZW1wdHkgc3RyaW5nLCBsZXQgYG1lbWJlcmAge3F1b3RlKHByb3BlcnR5KSArIFwiOlwifVxyXG4gICAgICAgICAgICAgICAgICAvLyBiZSB0aGUgY29uY2F0ZW5hdGlvbiBvZiBgbWVtYmVyYCBhbmQgdGhlIGBzcGFjZWAgY2hhcmFjdGVyLlwiXHJcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBcImBzcGFjZWAgY2hhcmFjdGVyXCIgcmVmZXJzIHRvIHRoZSBsaXRlcmFsIHNwYWNlXHJcbiAgICAgICAgICAgICAgICAgIC8vIGNoYXJhY3Rlciwgbm90IHRoZSBgc3BhY2VgIHt3aWR0aH0gYXJndW1lbnQgcHJvdmlkZWQgdG9cclxuICAgICAgICAgICAgICAgICAgLy8gYEpTT04uc3RyaW5naWZ5YC5cclxuICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcXVvdGUocHJvcGVydHkpICsgXCI6XCIgKyAod2hpdGVzcGFjZSA/IFwiIFwiIDogXCJcIikgKyBlbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICB0b3RhbExlbmd0aCArPSByZXN1bHQubGVuZ3RoICsgKGluZGV4KysgPiAwID8gMSA6IDApO1xyXG4gICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/XHJcbiAgICAgICAgICAgICAgICAoXHJcbiAgICAgICAgICAgICAgICAgIHdoaXRlc3BhY2UgJiYgKHRvdGFsTGVuZ3RoID4gbWF4TGluZUxlbmd0aCkgP1xyXG4gICAgICAgICAgICAgICAgICBcIntcXG5cIiArIGluZGVudGF0aW9uICsgcmVzdWx0cy5qb2luKFwiLFxcblwiICsgaW5kZW50YXRpb24pICsgXCJcXG5cIiArIHByZWZpeCArIFwifVwiIDpcclxuICAgICAgICAgICAgICAgICAgXCJ7XCIgKyByZXN1bHRzLmpvaW4oXCIsXCIpICsgXCJ9XCJcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIDogXCJ7fVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgb2JqZWN0IGZyb20gdGhlIHRyYXZlcnNlZCBvYmplY3Qgc3RhY2suXHJcbiAgICAgICAgICAgIHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04uc3RyaW5naWZ5YC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXHJcblxyXG4gICAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHNvdXJjZSwgZmlsdGVyLCB3aWR0aCwgbWF4TGluZUxlbmd0aCkge1xyXG4gICAgICAgICAgdmFyIHdoaXRlc3BhY2UsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCBjbGFzc05hbWU7XHJcbiAgICAgICAgICBpZiAob2JqZWN0VHlwZXNbdHlwZW9mIGZpbHRlcl0gJiYgZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbChmaWx0ZXIpKSA9PSBmdW5jdGlvbkNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmaWx0ZXI7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IGFycmF5Q2xhc3MpIHtcclxuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBwcm9wZXJ0eSBuYW1lcyBhcnJheSBpbnRvIGEgbWFrZXNoaWZ0IHNldC5cclxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzID0ge307XHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBmaWx0ZXIubGVuZ3RoLCB2YWx1ZTsgaW5kZXggPCBsZW5ndGg7IHZhbHVlID0gZmlsdGVyW2luZGV4KytdLCAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpKSwgY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzIHx8IGNsYXNzTmFtZSA9PSBudW1iZXJDbGFzcykgJiYgKHByb3BlcnRpZXNbdmFsdWVdID0gMSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAod2lkdGgpIHtcclxuICAgICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHdpZHRoKSkgPT0gbnVtYmVyQ2xhc3MpIHtcclxuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBgd2lkdGhgIHRvIGFuIGludGVnZXIgYW5kIGNyZWF0ZSBhIHN0cmluZyBjb250YWluaW5nXHJcbiAgICAgICAgICAgICAgLy8gYHdpZHRoYCBudW1iZXIgb2Ygc3BhY2UgY2hhcmFjdGVycy5cclxuICAgICAgICAgICAgICBpZiAoKHdpZHRoIC09IHdpZHRoICUgMSkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHdoaXRlc3BhY2UgPSBcIlwiLCB3aWR0aCA+IDEwICYmICh3aWR0aCA9IDEwKTsgd2hpdGVzcGFjZS5sZW5ndGggPCB3aWR0aDsgd2hpdGVzcGFjZSArPSBcIiBcIik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xyXG4gICAgICAgICAgICAgIHdoaXRlc3BhY2UgPSB3aWR0aC5sZW5ndGggPD0gMTAgPyB3aWR0aCA6IHdpZHRoLnNsaWNlKDAsIDEwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIGRpc2NhcmRzIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIGVtcHR5IHN0cmluZyBrZXlzXHJcbiAgICAgICAgICAvLyAoYFwiXCJgKSBvbmx5IGlmIHRoZXkgYXJlIHVzZWQgZGlyZWN0bHkgd2l0aGluIGFuIG9iamVjdCBtZW1iZXIgbGlzdFxyXG4gICAgICAgICAgLy8gKGUuZy4sIGAhKFwiXCIgaW4geyBcIlwiOiAxfSlgKS5cclxuICAgICAgICAgIHJldHVybiBzZXJpYWxpemUoXCJcIiwgKHZhbHVlID0ge30sIHZhbHVlW1wiXCJdID0gc291cmNlLCB2YWx1ZSksIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBcIlwiLCBbXSwgbWF4TGluZUxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZXhwb3J0cy5jb21wYWN0U3RyaW5naWZ5ID0gZnVuY3Rpb24gKHNvdXJjZSwgZmlsdGVyLCB3aWR0aCl7XHJcbiAgICAgICAgICByZXR1cm4gZXhwb3J0cy5zdHJpbmdpZnkoc291cmNlLCBmaWx0ZXIsIHdpZHRoLCA2MCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBQdWJsaWM6IFBhcnNlcyBhIEpTT04gc291cmNlIHN0cmluZy5cclxuICAgICAgaWYgKCFoYXMoXCJqc29uLXBhcnNlXCIpKSB7XHJcbiAgICAgICAgdmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBBIG1hcCBvZiBlc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgdW5lc2NhcGVkXHJcbiAgICAgICAgLy8gZXF1aXZhbGVudHMuXHJcbiAgICAgICAgdmFyIFVuZXNjYXBlcyA9IHtcclxuICAgICAgICAgIDkyOiBcIlxcXFxcIixcclxuICAgICAgICAgIDM0OiAnXCInLFxyXG4gICAgICAgICAgNDc6IFwiL1wiLFxyXG4gICAgICAgICAgOTg6IFwiXFxiXCIsXHJcbiAgICAgICAgICAxMTY6IFwiXFx0XCIsXHJcbiAgICAgICAgICAxMTA6IFwiXFxuXCIsXHJcbiAgICAgICAgICAxMDI6IFwiXFxmXCIsXHJcbiAgICAgICAgICAxMTQ6IFwiXFxyXCJcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJbnRlcm5hbDogU3RvcmVzIHRoZSBwYXJzZXIgc3RhdGUuXHJcbiAgICAgICAgdmFyIEluZGV4LCBTb3VyY2U7XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBSZXNldHMgdGhlIHBhcnNlciBzdGF0ZSBhbmQgdGhyb3dzIGEgYFN5bnRheEVycm9yYC5cclxuICAgICAgICB2YXIgYWJvcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBJbmRleCA9IFNvdXJjZSA9IG51bGw7XHJcbiAgICAgICAgICB0aHJvdyBTeW50YXhFcnJvcigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBSZXR1cm5zIHRoZSBuZXh0IHRva2VuLCBvciBgXCIkXCJgIGlmIHRoZSBwYXJzZXIgaGFzIHJlYWNoZWRcclxuICAgICAgICAvLyB0aGUgZW5kIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLiBBIHRva2VuIG1heSBiZSBhIHN0cmluZywgbnVtYmVyLCBgbnVsbGBcclxuICAgICAgICAvLyBsaXRlcmFsLCBvciBCb29sZWFuIGxpdGVyYWwuXHJcbiAgICAgICAgdmFyIGxleCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBzb3VyY2UgPSBTb3VyY2UsIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGgsIHZhbHVlLCBiZWdpbiwgcG9zaXRpb24sIGlzU2lnbmVkLCBjaGFyQ29kZTtcclxuICAgICAgICAgIHdoaWxlIChJbmRleCA8IGxlbmd0aCkge1xyXG4gICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcclxuICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xyXG4gICAgICAgICAgICAgIGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMzogY2FzZSAzMjpcclxuICAgICAgICAgICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSB0b2tlbnMsIGluY2x1ZGluZyB0YWJzLCBjYXJyaWFnZSByZXR1cm5zLCBsaW5lXHJcbiAgICAgICAgICAgICAgICAvLyBmZWVkcywgYW5kIHNwYWNlIGNoYXJhY3RlcnMuXHJcbiAgICAgICAgICAgICAgICBJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgY2FzZSAxMjM6IGNhc2UgMTI1OiBjYXNlIDkxOiBjYXNlIDkzOiBjYXNlIDU4OiBjYXNlIDQ0OlxyXG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYSBwdW5jdHVhdG9yIHRva2VuIChge2AsIGB9YCwgYFtgLCBgXWAsIGA6YCwgb3IgYCxgKSBhdFxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnQgcG9zaXRpb24uXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGNoYXJJbmRleEJ1Z2d5ID8gc291cmNlLmNoYXJBdChJbmRleCkgOiBzb3VyY2VbSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICBjYXNlIDM0OlxyXG4gICAgICAgICAgICAgICAgLy8gYFwiYCBkZWxpbWl0cyBhIEpTT04gc3RyaW5nOyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmRcclxuICAgICAgICAgICAgICAgIC8vIGJlZ2luIHBhcnNpbmcgdGhlIHN0cmluZy4gU3RyaW5nIHRva2VucyBhcmUgcHJlZml4ZWQgd2l0aCB0aGVcclxuICAgICAgICAgICAgICAgIC8vIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIgdG8gZGlzdGluZ3Vpc2ggdGhlbSBmcm9tIHB1bmN0dWF0b3JzIGFuZFxyXG4gICAgICAgICAgICAgICAgLy8gZW5kLW9mLXN0cmluZyB0b2tlbnMuXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhbHVlID0gXCJAXCIsIEluZGV4Kys7IEluZGV4IDwgbGVuZ3RoOykge1xyXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVbmVzY2FwZWQgQVNDSUkgY29udHJvbCBjaGFyYWN0ZXJzICh0aG9zZSB3aXRoIGEgY29kZSB1bml0XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbGVzcyB0aGFuIHRoZSBzcGFjZSBjaGFyYWN0ZXIpIGFyZSBub3QgcGVybWl0dGVkLlxyXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhckNvZGUgPT0gOTIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBIHJldmVyc2Ugc29saWR1cyAoYFxcYCkgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhbiBlc2NhcGVkXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29udHJvbCBjaGFyYWN0ZXIgKGluY2x1ZGluZyBgXCJgLCBgXFxgLCBhbmQgYC9gKSBvciBVbmljb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNjYXBlIHNlcXVlbmNlLlxyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSA5MjogY2FzZSAzNDogY2FzZSA0NzogY2FzZSA5ODogY2FzZSAxMTY6IGNhc2UgMTEwOiBjYXNlIDEwMjogY2FzZSAxMTQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSBlc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVycy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gVW5lc2NhcGVzW2NoYXJDb2RlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIDExNzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYFxcdWAgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgYW5kIHZhbGlkYXRlIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IGNvZGUgcG9pbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZ2luID0gKytJbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChwb3NpdGlvbiA9IEluZGV4ICsgNDsgSW5kZXggPCBwb3NpdGlvbjsgSW5kZXgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEgdmFsaWQgc2VxdWVuY2UgY29tcHJpc2VzIGZvdXIgaGV4ZGlnaXRzIChjYXNlLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluc2Vuc2l0aXZlKSB0aGF0IGZvcm0gYSBzaW5nbGUgaGV4YWRlY2ltYWwgdmFsdWUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcgfHwgY2hhckNvZGUgPj0gOTcgJiYgY2hhckNvZGUgPD0gMTAyIHx8IGNoYXJDb2RlID49IDY1ICYmIGNoYXJDb2RlIDw9IDcwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IGZyb21DaGFyQ29kZShcIjB4XCIgKyBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBlc2NhcGUgc2VxdWVuY2UuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAzNCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gQW4gdW5lc2NhcGVkIGRvdWJsZS1xdW90ZSBjaGFyYWN0ZXIgbWFya3MgdGhlIGVuZCBvZiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIHN0cmluZy5cclxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICBiZWdpbiA9IEluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9wdGltaXplIGZvciB0aGUgY29tbW9uIGNhc2Ugd2hlcmUgYSBzdHJpbmcgaXMgdmFsaWQuXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNoYXJDb2RlID49IDMyICYmIGNoYXJDb2RlICE9IDkyICYmIGNoYXJDb2RlICE9IDM0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgdGhlIHN0cmluZyBhcy1pcy5cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSAzNCkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmQgcmV0dXJuIHRoZSByZXZpdmVkIHN0cmluZy5cclxuICAgICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gVW50ZXJtaW5hdGVkIHN0cmluZy5cclxuICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIG51bWJlcnMgYW5kIGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcclxuICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgcGFzdCB0aGUgbmVnYXRpdmUgc2lnbiwgaWYgb25lIGlzIHNwZWNpZmllZC5cclxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0NSkge1xyXG4gICAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhbiBpbnRlZ2VyIG9yIGZsb2F0aW5nLXBvaW50IHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIExlYWRpbmcgemVyb2VzIGFyZSBpbnRlcnByZXRlZCBhcyBvY3RhbCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQ4ICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCArIDEpKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBvY3RhbCBsaXRlcmFsLlxyXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGludGVnZXIgY29tcG9uZW50LlxyXG4gICAgICAgICAgICAgICAgICBmb3IgKDsgSW5kZXggPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgSW5kZXgrKyk7XHJcbiAgICAgICAgICAgICAgICAgIC8vIEZsb2F0cyBjYW5ub3QgY29udGFpbiBhIGxlYWRpbmcgZGVjaW1hbCBwb2ludDsgaG93ZXZlciwgdGhpc1xyXG4gICAgICAgICAgICAgICAgICAvLyBjYXNlIGlzIGFscmVhZHkgYWNjb3VudGVkIGZvciBieSB0aGUgcGFyc2VyLlxyXG4gICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpID09IDQ2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSArK0luZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBkZWNpbWFsIGNvbXBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIHRyYWlsaW5nIGRlY2ltYWwuXHJcbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBJbmRleCA9IHBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIGV4cG9uZW50cy4gVGhlIGBlYCBkZW5vdGluZyB0aGUgZXhwb25lbnQgaXNcclxuICAgICAgICAgICAgICAgICAgLy8gY2FzZS1pbnNlbnNpdGl2ZS5cclxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAxMDEgfHwgY2hhckNvZGUgPT0gNjkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNraXAgcGFzdCB0aGUgc2lnbiBmb2xsb3dpbmcgdGhlIGV4cG9uZW50LCBpZiBvbmUgaXNcclxuICAgICAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQzIHx8IGNoYXJDb2RlID09IDQ1KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZXhwb25lbnRpYWwgY29tcG9uZW50LlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIGVtcHR5IGV4cG9uZW50LlxyXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAvLyBDb2VyY2UgdGhlIHBhcnNlZCB2YWx1ZSB0byBhIEphdmFTY3JpcHQgbnVtYmVyLlxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gK3NvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gQSBuZWdhdGl2ZSBzaWduIG1heSBvbmx5IHByZWNlZGUgbnVtYmVycy5cclxuICAgICAgICAgICAgICAgIGlmIChpc1NpZ25lZCkge1xyXG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gYHRydWVgLCBgZmFsc2VgLCBhbmQgYG51bGxgIGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcInRydWVcIikge1xyXG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDUpID09IFwiZmFsc2VcIikge1xyXG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA1O1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcIm51bGxcIikge1xyXG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFVucmVjb2duaXplZCB0b2tlbi5cclxuICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIFJldHVybiB0aGUgc2VudGluZWwgYCRgIGNoYXJhY3RlciBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkIHRoZSBlbmRcclxuICAgICAgICAgIC8vIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLlxyXG4gICAgICAgICAgcmV0dXJuIFwiJFwiO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEludGVybmFsOiBQYXJzZXMgYSBKU09OIGB2YWx1ZWAgdG9rZW4uXHJcbiAgICAgICAgdmFyIGdldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgdmFyIHJlc3VsdHMsIGhhc01lbWJlcnM7XHJcbiAgICAgICAgICBpZiAodmFsdWUgPT0gXCIkXCIpIHtcclxuICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQuXHJcbiAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgaWYgKChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSA9PSBcIkBcIikge1xyXG4gICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc2VudGluZWwgYEBgIGNoYXJhY3Rlci5cclxuICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUGFyc2Ugb2JqZWN0IGFuZCBhcnJheSBsaXRlcmFscy5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiW1wiKSB7XHJcbiAgICAgICAgICAgICAgLy8gUGFyc2VzIGEgSlNPTiBhcnJheSwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgYXJyYXkuXHJcbiAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xyXG4gICAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIHNxdWFyZSBicmFja2V0IG1hcmtzIHRoZSBlbmQgb2YgdGhlIGFycmF5IGxpdGVyYWwuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcclxuICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgYXJyYXkgbGl0ZXJhbCBjb250YWlucyBlbGVtZW50cywgdGhlIGN1cnJlbnQgdG9rZW5cclxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBhIGNvbW1hIHNlcGFyYXRpbmcgdGhlIHByZXZpb3VzIGVsZW1lbnQgZnJvbSB0aGVcclxuICAgICAgICAgICAgICAgIC8vIG5leHQuXHJcbiAgICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xyXG4gICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIl1cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gYXJyYXkgbGl0ZXJhbC5cclxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgYCxgIG11c3Qgc2VwYXJhdGUgZWFjaCBhcnJheSBlbGVtZW50LlxyXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIEVsaXNpb25zIGFuZCBsZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZC5cclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xyXG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGdldCh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcIntcIikge1xyXG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gb2JqZWN0LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBvYmplY3QuXHJcbiAgICAgICAgICAgICAgcmVzdWx0cyA9IHt9O1xyXG4gICAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xyXG4gICAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIGN1cmx5IGJyYWNlIG1hcmtzIHRoZSBlbmQgb2YgdGhlIG9iamVjdCBsaXRlcmFsLlxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBsaXRlcmFsIGNvbnRhaW5zIG1lbWJlcnMsIHRoZSBjdXJyZW50IHRva2VuXHJcbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0b3IuXHJcbiAgICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xyXG4gICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gb2JqZWN0IGxpdGVyYWwuXHJcbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggb2JqZWN0IG1lbWJlci5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZCwgb2JqZWN0IHByb3BlcnR5IG5hbWVzIG11c3QgYmVcclxuICAgICAgICAgICAgICAgIC8vIGRvdWJsZS1xdW90ZWQgc3RyaW5ncywgYW5kIGEgYDpgIG11c3Qgc2VwYXJhdGUgZWFjaCBwcm9wZXJ0eVxyXG4gICAgICAgICAgICAgICAgLy8gbmFtZSBhbmQgdmFsdWUuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIgfHwgdHlwZW9mIHZhbHVlICE9IFwic3RyaW5nXCIgfHwgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pICE9IFwiQFwiIHx8IGxleCgpICE9IFwiOlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzW3ZhbHVlLnNsaWNlKDEpXSA9IGdldChsZXgoKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdG9rZW4gZW5jb3VudGVyZWQuXHJcbiAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IFVwZGF0ZXMgYSB0cmF2ZXJzZWQgb2JqZWN0IG1lbWJlci5cclxuICAgICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICB2YXIgZWxlbWVudCA9IHdhbGsoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgaWYgKGVsZW1lbnQgPT09IHVuZGVmKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBzb3VyY2VbcHJvcGVydHldO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc291cmNlW3Byb3BlcnR5XSA9IGVsZW1lbnQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlY3Vyc2l2ZWx5IHRyYXZlcnNlcyBhIHBhcnNlZCBKU09OIG9iamVjdCwgaW52b2tpbmcgdGhlXHJcbiAgICAgICAgLy8gYGNhbGxiYWNrYCBmdW5jdGlvbiBmb3IgZWFjaCB2YWx1ZS4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcclxuICAgICAgICAvLyBgV2Fsayhob2xkZXIsIG5hbWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4yLlxyXG4gICAgICAgIHZhciB3YWxrID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2VbcHJvcGVydHldLCBsZW5ndGg7XHJcbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgJiYgdmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gYGZvckVhY2hgIGNhbid0IGJlIHVzZWQgdG8gdHJhdmVyc2UgYW4gYXJyYXkgaW4gT3BlcmEgPD0gOC41NFxyXG4gICAgICAgICAgICAvLyBiZWNhdXNlIGl0cyBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpbXBsZW1lbnRhdGlvbiByZXR1cm5zIGBmYWxzZWBcclxuICAgICAgICAgICAgLy8gZm9yIGFycmF5IGluZGljZXMgKGUuZy4sIGAhWzEsIDIsIDNdLmhhc093blByb3BlcnR5KFwiMFwiKWApLlxyXG4gICAgICAgICAgICBpZiAoZ2V0Q2xhc3MuY2FsbCh2YWx1ZSkgPT0gYXJyYXlDbGFzcykge1xyXG4gICAgICAgICAgICAgIGZvciAobGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBsZW5ndGgtLTspIHtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgbGVuZ3RoLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGZvckVhY2godmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChzb3VyY2UsIHByb3BlcnR5LCB2YWx1ZSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gUHVibGljOiBgSlNPTi5wYXJzZWAuIFNlZSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4yLlxyXG4gICAgICAgIGV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc291cmNlLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgdmFyIHJlc3VsdCwgdmFsdWU7XHJcbiAgICAgICAgICBJbmRleCA9IDA7XHJcbiAgICAgICAgICBTb3VyY2UgPSBcIlwiICsgc291cmNlO1xyXG4gICAgICAgICAgcmVzdWx0ID0gZ2V0KGxleCgpKTtcclxuICAgICAgICAgIC8vIElmIGEgSlNPTiBzdHJpbmcgY29udGFpbnMgbXVsdGlwbGUgdG9rZW5zLCBpdCBpcyBpbnZhbGlkLlxyXG4gICAgICAgICAgaWYgKGxleCgpICE9IFwiJFwiKSB7XHJcbiAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBSZXNldCB0aGUgcGFyc2VyIHN0YXRlLlxyXG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xyXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGdldENsYXNzLmNhbGwoY2FsbGJhY2spID09IGZ1bmN0aW9uQ2xhc3MgPyB3YWxrKCh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHJlc3VsdCwgdmFsdWUpLCBcIlwiLCBjYWxsYmFjaykgOiByZXN1bHQ7XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydHNbXCJydW5JbkNvbnRleHRcIl0gPSBydW5JbkNvbnRleHQ7XHJcbiAgICByZXR1cm4gZXhwb3J0cztcclxuICB9XHJcblxyXG4gIGlmIChmcmVlRXhwb3J0cyAmJiAhaXNMb2FkZXIpIHtcclxuICAgIC8vIEV4cG9ydCBmb3IgQ29tbW9uSlMgZW52aXJvbm1lbnRzLlxyXG4gICAgcnVuSW5Db250ZXh0KHJvb3QsIGZyZWVFeHBvcnRzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gRXhwb3J0IGZvciB3ZWIgYnJvd3NlcnMgYW5kIEphdmFTY3JpcHQgZW5naW5lcy5cclxuICAgIHZhciBuYXRpdmVKU09OID0gcm9vdC5KU09OLFxyXG4gICAgICAgIHByZXZpb3VzSlNPTiA9IHJvb3RbXCJKU09OM1wiXSxcclxuICAgICAgICBpc1Jlc3RvcmVkID0gZmFsc2U7XHJcblxyXG4gICAgdmFyIEpTT04zID0gcnVuSW5Db250ZXh0KHJvb3QsIChyb290W1wiSlNPTjNcIl0gPSB7XHJcbiAgICAgIC8vIFB1YmxpYzogUmVzdG9yZXMgdGhlIG9yaWdpbmFsIHZhbHVlIG9mIHRoZSBnbG9iYWwgYEpTT05gIG9iamVjdCBhbmRcclxuICAgICAgLy8gcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgYEpTT04zYCBvYmplY3QuXHJcbiAgICAgIFwibm9Db25mbGljdFwiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCFpc1Jlc3RvcmVkKSB7XHJcbiAgICAgICAgICBpc1Jlc3RvcmVkID0gdHJ1ZTtcclxuICAgICAgICAgIHJvb3QuSlNPTiA9IG5hdGl2ZUpTT047XHJcbiAgICAgICAgICByb290W1wiSlNPTjNcIl0gPSBwcmV2aW91c0pTT047XHJcbiAgICAgICAgICBuYXRpdmVKU09OID0gcHJldmlvdXNKU09OID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEpTT04zO1xyXG4gICAgICB9XHJcbiAgICB9KSk7XHJcblxyXG4gICAgcm9vdC5KU09OID0ge1xyXG4gICAgICBcInBhcnNlXCI6IEpTT04zLnBhcnNlLFxyXG4gICAgICBcInN0cmluZ2lmeVwiOiBKU09OMy5zdHJpbmdpZnlcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyBFeHBvcnQgZm9yIGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy5cclxuICBpZiAoaXNMb2FkZXIpIHtcclxuICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBKU09OMztcclxuICAgIH0pO1xyXG4gIH1cclxufSkuY2FsbCh0aGlzKTtcclxuIiwid2luZG93LiAgICAgdmxTY2hlbWEgPSB7XHJcbiAgXCJvbmVPZlwiOiBbXHJcbiAgICB7XHJcbiAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRXh0ZW5kZWRVbml0U3BlY1wiLFxyXG4gICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2NoZW1hIGZvciBhIHVuaXQgVmVnYS1MaXRlIHNwZWNpZmljYXRpb24sIHdpdGggdGhlIHN5bnRhY3RpYyBzdWdhciBleHRlbnNpb25zOlxcblxcbi0gYHJvd2AgYW5kIGBjb2x1bW5gIGFyZSBpbmNsdWRlZCBpbiB0aGUgZW5jb2RpbmcuXFxuXFxuLSAoRnV0dXJlKSBsYWJlbCwgYm94IHBsb3RcXG5cXG5cXG5cXG5Ob3RlOiB0aGUgc3BlYyBjb3VsZCBjb250YWluIGZhY2V0LlwiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZhY2V0U3BlY1wiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0xheWVyU3BlY1wiXHJcbiAgICB9XHJcbiAgXSxcclxuICBcImRlZmluaXRpb25zXCI6IHtcclxuICAgIFwiRXh0ZW5kZWRVbml0U3BlY1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwibWFya1wiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL01hcmtcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgbWFyayB0eXBlLlxcblxcbk9uZSBvZiBgXFxcImJhclxcXCJgLCBgXFxcImNpcmNsZVxcXCJgLCBgXFxcInNxdWFyZVxcXCJgLCBgXFxcInRpY2tcXFwiYCwgYFxcXCJsaW5lXFxcImAsXFxuXFxuYFxcXCJhcmVhXFxcImAsIGBcXFwicG9pbnRcXFwiYCwgYFxcXCJydWxlXFxcImAsIGFuZCBgXFxcInRleHRcXFwiYC5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJlbmNvZGluZ1wiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0VuY29kaW5nXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBrZXktdmFsdWUgbWFwcGluZyBiZXR3ZWVuIGVuY29kaW5nIGNoYW5uZWxzIGFuZCBkZWZpbml0aW9uIG9mIGZpZWxkcy5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJuYW1lXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJOYW1lIG9mIHRoZSB2aXN1YWxpemF0aW9uIGZvciBsYXRlciByZWZlcmVuY2UuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb3B0aW9uYWwgZGVzY3JpcHRpb24gb2YgdGhpcyBtYXJrIGZvciBjb21tZW50aW5nIHB1cnBvc2UuXFxuXFxuVGhpcyBwcm9wZXJ0eSBoYXMgbm8gZWZmZWN0IG9uIHRoZSBvdXRwdXQgdmlzdWFsaXphdGlvbi5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImRhdGFcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9EYXRhXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGRhdGEgc291cmNlXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidHJhbnNmb3JtXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb2JqZWN0IGRlc2NyaWJpbmcgZmlsdGVyIGFuZCBuZXcgZmllbGQgY2FsY3VsYXRpb24uXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY29uZmlnXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ29uZmlnXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ29uZmlndXJhdGlvbiBvYmplY3RcIlxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgXCJyZXF1aXJlZFwiOiBbXHJcbiAgICAgICAgXCJtYXJrXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiTWFya1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwiYXJlYVwiLFxyXG4gICAgICAgIFwiYmFyXCIsXHJcbiAgICAgICAgXCJsaW5lXCIsXHJcbiAgICAgICAgXCJwb2ludFwiLFxyXG4gICAgICAgIFwidGV4dFwiLFxyXG4gICAgICAgIFwidGlja1wiLFxyXG4gICAgICAgIFwicnVsZVwiLFxyXG4gICAgICAgIFwiY2lyY2xlXCIsXHJcbiAgICAgICAgXCJzcXVhcmVcIixcclxuICAgICAgICBcImVycm9yQmFyXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiRW5jb2RpbmdcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcInJvd1wiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlZlcnRpY2FsIGZhY2V0cyBmb3IgdHJlbGxpcyBwbG90cy5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJjb2x1bW5cIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Qb3NpdGlvbkNoYW5uZWxEZWZcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJIb3Jpem9udGFsIGZhY2V0cyBmb3IgdHJlbGxpcyBwbG90cy5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ4XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvUG9zaXRpb25DaGFubmVsRGVmXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiWCBjb29yZGluYXRlcyBmb3IgYHBvaW50YCwgYGNpcmNsZWAsIGBzcXVhcmVgLFxcblxcbmBsaW5lYCwgYHJ1bGVgLCBgdGV4dGAsIGFuZCBgdGlja2BcXG5cXG4ob3IgdG8gd2lkdGggYW5kIGhlaWdodCBmb3IgYGJhcmAgYW5kIGBhcmVhYCBtYXJrcykuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwieVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlkgY29vcmRpbmF0ZXMgZm9yIGBwb2ludGAsIGBjaXJjbGVgLCBgc3F1YXJlYCxcXG5cXG5gbGluZWAsIGBydWxlYCwgYHRleHRgLCBhbmQgYHRpY2tgXFxuXFxuKG9yIHRvIHdpZHRoIGFuZCBoZWlnaHQgZm9yIGBiYXJgIGFuZCBgYXJlYWAgbWFya3MpLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIngyXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvUG9zaXRpb25DaGFubmVsRGVmXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiWDIgY29vcmRpbmF0ZXMgZm9yIHJhbmdlZCBgYmFyYCwgYHJ1bGVgLCBgYXJlYWBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ5MlwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlkyIGNvb3JkaW5hdGVzIGZvciByYW5nZWQgYGJhcmAsIGBydWxlYCwgYGFyZWFgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY29sb3JcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DaGFubmVsRGVmV2l0aExlZ2VuZFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIHRoZSBtYXJrcyDigJMgZWl0aGVyIGZpbGwgb3Igc3Ryb2tlIGNvbG9yIGJhc2VkIG9uIG1hcmsgdHlwZS5cXG5cXG4oQnkgZGVmYXVsdCwgZmlsbCBjb2xvciBmb3IgYGFyZWFgLCBgYmFyYCwgYHRpY2tgLCBgdGV4dGAsIGBjaXJjbGVgLCBhbmQgYHNxdWFyZWAgL1xcblxcbnN0cm9rZSBjb2xvciBmb3IgYGxpbmVgIGFuZCBgcG9pbnRgLilcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJvcGFjaXR5XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ2hhbm5lbERlZldpdGhMZWdlbmRcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPcGFjaXR5IG9mIHRoZSBtYXJrcyDigJMgZWl0aGVyIGNhbiBiZSBhIHZhbHVlIG9yIGluIGEgcmFuZ2UuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2l6ZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0NoYW5uZWxEZWZXaXRoTGVnZW5kXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2l6ZSBvZiB0aGUgbWFyay5cXG5cXG4tIEZvciBgcG9pbnRgLCBgc3F1YXJlYCBhbmQgYGNpcmNsZWBcXG5cXG7igJMgdGhlIHN5bWJvbCBzaXplLCBvciBwaXhlbCBhcmVhIG9mIHRoZSBtYXJrLlxcblxcbi0gRm9yIGBiYXJgIGFuZCBgdGlja2Ag4oCTIHRoZSBiYXIgYW5kIHRpY2sncyBzaXplLlxcblxcbi0gRm9yIGB0ZXh0YCDigJMgdGhlIHRleHQncyBmb250IHNpemUuXFxuXFxuLSBTaXplIGlzIGN1cnJlbnRseSB1bnN1cHBvcnRlZCBmb3IgYGxpbmVgIGFuZCBgYXJlYWAuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2hhcGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DaGFubmVsRGVmV2l0aExlZ2VuZFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzeW1ib2wncyBzaGFwZSAob25seSBmb3IgYHBvaW50YCBtYXJrcykuIFRoZSBzdXBwb3J0ZWQgdmFsdWVzIGFyZVxcblxcbmBcXFwiY2lyY2xlXFxcImAgKGRlZmF1bHQpLCBgXFxcInNxdWFyZVxcXCJgLCBgXFxcImNyb3NzXFxcImAsIGBcXFwiZGlhbW9uZFxcXCJgLCBgXFxcInRyaWFuZ2xlLXVwXFxcImAsXFxuXFxub3IgYFxcXCJ0cmlhbmdsZS1kb3duXFxcImAsIG9yIGVsc2UgYSBjdXN0b20gU1ZHIHBhdGggc3RyaW5nLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImRldGFpbFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQWRkaXRpb25hbCBsZXZlbHMgb2YgZGV0YWlsIGZvciBncm91cGluZyBkYXRhIGluIGFnZ3JlZ2F0ZSB2aWV3cyBhbmRcXG5cXG5pbiBsaW5lIGFuZCBhcmVhIG1hcmtzIHdpdGhvdXQgbWFwcGluZyBkYXRhIHRvIGEgc3BlY2lmaWMgdmlzdWFsIGNoYW5uZWwuXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmllbGREZWZcIixcclxuICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZXJmYWNlIGZvciBhbnkga2luZCBvZiBGaWVsZERlZjtcXG5cXG5Gb3Igc2ltcGxpY2l0eSwgd2UgZG8gbm90IGRlY2xhcmUgbXVsdGlwbGUgaW50ZXJmYWNlcyBvZiBGaWVsZERlZiBsaWtlXFxuXFxud2UgZG8gZm9yIEpTT04gc2NoZW1hLlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GaWVsZERlZlwiLFxyXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkludGVyZmFjZSBmb3IgYW55IGtpbmQgb2YgRmllbGREZWY7XFxuXFxuRm9yIHNpbXBsaWNpdHksIHdlIGRvIG5vdCBkZWNsYXJlIG11bHRpcGxlIGludGVyZmFjZXMgb2YgRmllbGREZWYgbGlrZVxcblxcbndlIGRvIGZvciBKU09OIHNjaGVtYS5cIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0ZXh0XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmllbGREZWZcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUZXh0IG9mIHRoZSBgdGV4dGAgbWFyay5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZpZWxkRGVmXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicGF0aFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT3JkZXIgb2YgZGF0YSBwb2ludHMgaW4gbGluZSBtYXJrcy5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9PcmRlckNoYW5uZWxEZWZcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwib3JkZXJcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkxheWVyIG9yZGVyIGZvciBub24tc3RhY2tlZCBtYXJrcywgb3Igc3RhY2sgb3JkZXIgZm9yIHN0YWNrZWQgbWFya3MuXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgXCJpdGVtc1wiOiB7XHJcbiAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL09yZGVyQ2hhbm5lbERlZlwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJQb3NpdGlvbkNoYW5uZWxEZWZcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcImF4aXNcIjoge1xyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQXhpc1wiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2NhbGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9TY2FsZVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInNvcnRcIjoge1xyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NvcnRGaWVsZFwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NvcnRPcmRlclwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZmllbGRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk5hbWUgb2YgdGhlIGZpZWxkIGZyb20gd2hpY2ggdG8gcHVsbCBhIGRhdGEgdmFsdWUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0eXBlXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVHlwZVwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBlbmNvZGVkIGZpZWxkJ3MgdHlwZSBvZiBtZWFzdXJlbWVudC4gVGhpcyBjYW4gYmUgZWl0aGVyIGEgZnVsbCB0eXBlXFxuXFxubmFtZSAoYFxcXCJxdWFudGl0YXRpdmVcXFwiYCwgYFxcXCJ0ZW1wb3JhbFxcXCJgLCBgXFxcIm9yZGluYWxcXFwiYCwgIGFuZCBgXFxcIm5vbWluYWxcXFwiYClcXG5cXG5vciBhbiBpbml0aWFsIGNoYXJhY3RlciBvZiB0aGUgdHlwZSBuYW1lIChgXFxcIlFcXFwiYCwgYFxcXCJUXFxcImAsIGBcXFwiT1xcXCJgLCBgXFxcIk5cXFwiYCkuXFxuXFxuVGhpcyBwcm9wZXJ0eSBpcyBjYXNlIGluc2Vuc2l0aXZlLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIGNvbnN0YW50IHZhbHVlIGluIHZpc3VhbCBkb21haW4uXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGltZVVuaXRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UaW1lVW5pdFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRpbWUgdW5pdCBmb3IgYSBgdGVtcG9yYWxgIGZpZWxkICAoZS5nLiwgYHllYXJgLCBgeWVhcm1vbnRoYCwgYG1vbnRoYCwgYGhvdXJgKS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJiaW5cIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZsYWcgZm9yIGJpbm5pbmcgYSBgcXVhbnRpdGF0aXZlYCBmaWVsZCwgb3IgYSBiaW4gcHJvcGVydHkgb2JqZWN0XFxuXFxuZm9yIGJpbm5pbmcgcGFyYW1ldGVycy5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0JpblwiLFxyXG4gICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJCaW5uaW5nIHByb3BlcnRpZXMgb3IgYm9vbGVhbiBmbGFnIGZvciBkZXRlcm1pbmluZyB3aGV0aGVyIHRvIGJpbiBkYXRhIG9yIG5vdC5cIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImFnZ3JlZ2F0ZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0FnZ3JlZ2F0ZU9wXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQWdncmVnYXRpb24gZnVuY3Rpb24gZm9yIHRoZSBmaWVsZFxcblxcbihlLmcuLCBgbWVhbmAsIGBzdW1gLCBgbWVkaWFuYCwgYG1pbmAsIGBtYXhgLCBgY291bnRgKS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGl0bGUgZm9yIGF4aXMgb3IgbGVnZW5kLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIkF4aXNcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcImxhYmVsQW5nbGVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSByb3RhdGlvbiBhbmdsZSBvZiB0aGUgYXhpcyBsYWJlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmb3JtYXRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb3JtYXR0aW5nIHBhdHRlcm4gZm9yIGF4aXMgbGFiZWxzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwib3JpZW50XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQXhpc09yaWVudFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvcmllbnRhdGlvbiBvZiB0aGUgYXhpcy4gT25lIG9mIHRvcCwgYm90dG9tLCBsZWZ0IG9yIHJpZ2h0LiBUaGUgb3JpZW50YXRpb24gY2FuIGJlIHVzZWQgdG8gZnVydGhlciBzcGVjaWFsaXplIHRoZSBheGlzIHR5cGUgKGUuZy4sIGEgeSBheGlzIG9yaWVudGVkIGZvciB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgY2hhcnQpLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIHRpdGxlIGZvciB0aGUgYXhpcy4gU2hvd3MgZmllbGQgbmFtZSBhbmQgaXRzIGZ1bmN0aW9uIGJ5IGRlZmF1bHQuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ2YWx1ZXNcIjoge1xyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJheGlzV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldpZHRoIG9mIHRoZSBheGlzIGxpbmVcIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxheWVyXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIHN0cmluZyBpbmRpY2F0aW5nIGlmIHRoZSBheGlzIChhbmQgYW55IGdyaWRsaW5lcykgc2hvdWxkIGJlIHBsYWNlZCBhYm92ZSBvciBiZWxvdyB0aGUgZGF0YSBtYXJrcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm9mZnNldFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCwgaW4gcGl4ZWxzLCBieSB3aGljaCB0byBkaXNwbGFjZSB0aGUgYXhpcyBmcm9tIHRoZSBlZGdlIG9mIHRoZSBlbmNsb3NpbmcgZ3JvdXAgb3IgZGF0YSByZWN0YW5nbGUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJheGlzQ29sb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIGF4aXMgbGluZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImdyaWRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgZmxhZyBpbmRpY2F0ZSBpZiBncmlkbGluZXMgc2hvdWxkIGJlIGNyZWF0ZWQgaW4gYWRkaXRpb24gdG8gdGlja3MuIElmIGBncmlkYCBpcyB1bnNwZWNpZmllZCwgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYHRydWVgIGZvciBST1cgYW5kIENPTC4gRm9yIFggYW5kIFksIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGB0cnVlYCBmb3IgcXVhbnRpdGF0aXZlIGFuZCB0aW1lIGZpZWxkcyBhbmQgYGZhbHNlYCBvdGhlcndpc2UuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZ3JpZENvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb2xvciBvZiBncmlkbGluZXMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmlkRGFzaFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCAoaW4gcGl4ZWxzKSBpbnRvIHdoaWNoIHRvIGJlZ2luIGRyYXdpbmcgd2l0aCB0aGUgZ3JpZCBkYXNoIGFycmF5LlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmlkT3BhY2l0eVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHN0cm9rZSBvcGFjaXR5IG9mIGdyaWQgKHZhbHVlIGJldHdlZW4gWzAsMV0pXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmlkV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBncmlkIHdpZHRoLCBpbiBwaXhlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbHNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkVuYWJsZSBvciBkaXNhYmxlIGxhYmVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbEFsaWduXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUZXh0IGFsaWdubWVudCBmb3IgdGhlIExhYmVsLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibGFiZWxCYXNlbGluZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGV4dCBiYXNlbGluZSBmb3IgdGhlIGxhYmVsLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibGFiZWxNYXhMZW5ndGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRydW5jYXRlIGxhYmVscyB0aGF0IGFyZSB0b28gbG9uZy5cIixcclxuICAgICAgICAgIFwibWluaW11bVwiOiAxLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2hvcnRUaW1lTGFiZWxzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJXaGV0aGVyIG1vbnRoIGFuZCBkYXkgbmFtZXMgc2hvdWxkIGJlIGFiYnJldmlhdGVkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN1YmRpdmlkZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSWYgcHJvdmlkZWQsIHNldHMgdGhlIG51bWJlciBvZiBtaW5vciB0aWNrcyBiZXR3ZWVuIG1ham9yIHRpY2tzICh0aGUgdmFsdWUgOSByZXN1bHRzIGluIGRlY2ltYWwgc3ViZGl2aXNpb24pLiBPbmx5IGFwcGxpY2FibGUgZm9yIGF4ZXMgdmlzdWFsaXppbmcgcXVhbnRpdGF0aXZlIHNjYWxlcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIGRlc2lyZWQgbnVtYmVyIG9mIHRpY2tzLCBmb3IgYXhlcyB2aXN1YWxpemluZyBxdWFudGl0YXRpdmUgc2NhbGVzLiBUaGUgcmVzdWx0aW5nIG51bWJlciBtYXkgYmUgZGlmZmVyZW50IHNvIHRoYXQgdmFsdWVzIGFyZSBcXFwibmljZVxcXCIgKG11bHRpcGxlcyBvZiAyLCA1LCAxMCkgYW5kIGxpZSB3aXRoaW4gdGhlIHVuZGVybHlpbmcgc2NhbGUncyByYW5nZS5cIixcclxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGlja0NvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgY29sb3Igb2YgdGhlIGF4aXMncyB0aWNrLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGlja0xhYmVsQ29sb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBjb2xvciBvZiB0aGUgdGljayBsYWJlbCwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tMYWJlbEZvbnRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb250IG9mIHRoZSB0aWNrIGxhYmVsLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGlja0xhYmVsRm9udFNpemVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb250IHNpemUgb2YgbGFiZWwsIGluIHBpeGVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tQYWRkaW5nXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcGFkZGluZywgaW4gcGl4ZWxzLCBiZXR3ZWVuIHRpY2tzIGFuZCB0ZXh0IGxhYmVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tTaXplXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSwgaW4gcGl4ZWxzLCBvZiBtYWpvciwgbWlub3IgYW5kIGVuZCB0aWNrcy5cIixcclxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGlja1NpemVNYWpvclwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUsIGluIHBpeGVscywgb2YgbWFqb3IgdGlja3MuXCIsXHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tTaXplTWlub3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzaXplLCBpbiBwaXhlbHMsIG9mIG1pbm9yIHRpY2tzLlwiLFxyXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrU2l6ZUVuZFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUsIGluIHBpeGVscywgb2YgZW5kIHRpY2tzLlwiLFxyXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCwgaW4gcGl4ZWxzLCBvZiB0aWNrcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlQ29sb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIHRoZSB0aXRsZSwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlRm9udFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRm9udCBvZiB0aGUgdGl0bGUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZUZvbnRTaXplXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJTaXplIG9mIHRoZSB0aXRsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlRm9udFdlaWdodFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2VpZ2h0IG9mIHRoZSB0aXRsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlT2Zmc2V0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIHRpdGxlIG9mZnNldCB2YWx1ZSBmb3IgdGhlIGF4aXMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZU1heExlbmd0aFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTWF4IGxlbmd0aCBmb3IgYXhpcyB0aXRsZSBpZiB0aGUgdGl0bGUgaXMgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgZnJvbSB0aGUgZmllbGQncyBkZXNjcmlwdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyBpcyBhdXRvbWF0aWNhbGx5IGJhc2VkIG9uIGNlbGwgc2l6ZSBhbmQgY2hhcmFjdGVyV2lkdGggcHJvcGVydHkuXCIsXHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImNoYXJhY3RlcldpZHRoXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDaGFyYWN0ZXIgd2lkdGggZm9yIGF1dG9tYXRpY2FsbHkgZGV0ZXJtaW5pbmcgdGl0bGUgbWF4IGxlbmd0aC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9wdGlvbmFsIG1hcmsgcHJvcGVydHkgZGVmaW5pdGlvbnMgZm9yIGN1c3RvbSBheGlzIHN0eWxpbmcuXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIkF4aXNPcmllbnRcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcInRvcFwiLFxyXG4gICAgICAgIFwicmlnaHRcIixcclxuICAgICAgICBcImxlZnRcIixcclxuICAgICAgICBcImJvdHRvbVwiXHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICBcIlNjYWxlXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJ0eXBlXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvU2NhbGVUeXBlXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZG9tYWluXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZG9tYWluIG9mIHRoZSBzY2FsZSwgcmVwcmVzZW50aW5nIHRoZSBzZXQgb2YgZGF0YSB2YWx1ZXMuIEZvciBxdWFudGl0YXRpdmUgZGF0YSwgdGhpcyBjYW4gdGFrZSB0aGUgZm9ybSBvZiBhIHR3by1lbGVtZW50IGFycmF5IHdpdGggbWluaW11bSBhbmQgbWF4aW11bSB2YWx1ZXMuIEZvciBvcmRpbmFsL2NhdGVnb3JpY2FsIGRhdGEsIHRoaXMgbWF5IGJlIGFuIGFycmF5IG9mIHZhbGlkIGlucHV0IHZhbHVlcy5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInJhbmdlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcmFuZ2Ugb2YgdGhlIHNjYWxlLCByZXByZXNlbnRpbmcgdGhlIHNldCBvZiB2aXN1YWwgdmFsdWVzLiBGb3IgbnVtZXJpYyB2YWx1ZXMsIHRoZSByYW5nZSBjYW4gdGFrZSB0aGUgZm9ybSBvZiBhIHR3by1lbGVtZW50IGFycmF5IHdpdGggbWluaW11bSBhbmQgbWF4aW11bSB2YWx1ZXMuIEZvciBvcmRpbmFsIG9yIHF1YW50aXplZCBkYXRhLCB0aGUgcmFuZ2UgbWF5IGJ5IGFuIGFycmF5IG9mIGRlc2lyZWQgb3V0cHV0IHZhbHVlcywgd2hpY2ggYXJlIG1hcHBlZCB0byBlbGVtZW50cyBpbiB0aGUgc3BlY2lmaWVkIGRvbWFpbi4gRm9yIG9yZGluYWwgc2NhbGVzIG9ubHksIHRoZSByYW5nZSBjYW4gYmUgZGVmaW5lZCB1c2luZyBhIERhdGFSZWY6IHRoZSByYW5nZSB2YWx1ZXMgYXJlIHRoZW4gZHJhd24gZHluYW1pY2FsbHkgZnJvbSBhIGJhY2tpbmcgZGF0YSBzZXQuXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicm91bmRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIklmIHRydWUsIHJvdW5kcyBudW1lcmljIG91dHB1dCB2YWx1ZXMgdG8gaW50ZWdlcnMuIFRoaXMgY2FuIGJlIGhlbHBmdWwgZm9yIHNuYXBwaW5nIHRvIHRoZSBwaXhlbCBncmlkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImJhbmRTaXplXCI6IHtcclxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQXBwbGllcyBzcGFjaW5nIGFtb25nIG9yZGluYWwgZWxlbWVudHMgaW4gdGhlIHNjYWxlIHJhbmdlLiBUaGUgYWN0dWFsIGVmZmVjdCBkZXBlbmRzIG9uIGhvdyB0aGUgc2NhbGUgaXMgY29uZmlndXJlZC4gSWYgdGhlIF9fcG9pbnRzX18gcGFyYW1ldGVyIGlzIGB0cnVlYCwgdGhlIHBhZGRpbmcgdmFsdWUgaXMgaW50ZXJwcmV0ZWQgYXMgYSBtdWx0aXBsZSBvZiB0aGUgc3BhY2luZyBiZXR3ZWVuIHBvaW50cy4gQSByZWFzb25hYmxlIHZhbHVlIGlzIDEuMCwgc3VjaCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdCBwb2ludCB3aWxsIGJlIG9mZnNldCBmcm9tIHRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIHZhbHVlIGJ5IGhhbGYgdGhlIGRpc3RhbmNlIGJldHdlZW4gcG9pbnRzLiBPdGhlcndpc2UsIHBhZGRpbmcgaXMgdHlwaWNhbGx5IGluIHRoZSByYW5nZSBbMCwgMV0gYW5kIGNvcnJlc3BvbmRzIHRvIHRoZSBmcmFjdGlvbiBvZiBzcGFjZSBpbiB0aGUgcmFuZ2UgaW50ZXJ2YWwgdG8gYWxsb2NhdGUgdG8gcGFkZGluZy4gQSB2YWx1ZSBvZiAwLjUgbWVhbnMgdGhhdCB0aGUgcmFuZ2UgYmFuZCB3aWR0aCB3aWxsIGJlIGVxdWFsIHRvIHRoZSBwYWRkaW5nIHdpZHRoLiBGb3IgbW9yZSwgc2VlIHRoZSBbRDMgb3JkaW5hbCBzY2FsZSBkb2N1bWVudGF0aW9uXShodHRwczovL2dpdGh1Yi5jb20vbWJvc3RvY2svZDMvd2lraS9PcmRpbmFsLVNjYWxlcykuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJjbGFtcFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSWYgdHJ1ZSwgdmFsdWVzIHRoYXQgZXhjZWVkIHRoZSBkYXRhIGRvbWFpbiBhcmUgY2xhbXBlZCB0byBlaXRoZXIgdGhlIG1pbmltdW0gb3IgbWF4aW11bSByYW5nZSB2YWx1ZVwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm5pY2VcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIklmIHNwZWNpZmllZCwgbW9kaWZpZXMgdGhlIHNjYWxlIGRvbWFpbiB0byB1c2UgYSBtb3JlIGh1bWFuLWZyaWVuZGx5IHZhbHVlIHJhbmdlLiBJZiBzcGVjaWZpZWQgYXMgYSB0cnVlIGJvb2xlYW4sIG1vZGlmaWVzIHRoZSBzY2FsZSBkb21haW4gdG8gdXNlIGEgbW9yZSBodW1hbi1mcmllbmRseSBudW1iZXIgcmFuZ2UgKGUuZy4sIDcgaW5zdGVhZCBvZiA2Ljk2KS4gSWYgc3BlY2lmaWVkIGFzIGEgc3RyaW5nLCBtb2RpZmllcyB0aGUgc2NhbGUgZG9tYWluIHRvIHVzZSBhIG1vcmUgaHVtYW4tZnJpZW5kbHkgdmFsdWUgcmFuZ2UuIEZvciB0aW1lIGFuZCB1dGMgc2NhbGUgdHlwZXMgb25seSwgdGhlIG5pY2UgdmFsdWUgc2hvdWxkIGJlIGEgc3RyaW5nIGluZGljYXRpbmcgdGhlIGRlc2lyZWQgdGltZSBpbnRlcnZhbC5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL05pY2VUaW1lXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJleHBvbmVudFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2V0cyB0aGUgZXhwb25lbnQgb2YgdGhlIHNjYWxlIHRyYW5zZm9ybWF0aW9uLiBGb3IgcG93IHNjYWxlIHR5cGVzIG9ubHksIG90aGVyd2lzZSBpZ25vcmVkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiemVyb1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSWYgYHRydWVgLCBlbnN1cmVzIHRoYXQgYSB6ZXJvIGJhc2VsaW5lIHZhbHVlIGlzIGluY2x1ZGVkIGluIHRoZSBzY2FsZSBkb21haW4uXFxuXFxuRGVmYXVsdCB2YWx1ZTogYHRydWVgIGZvciBgeGAgYW5kIGB5YCBjaGFubmVsIGlmIHRoZSBxdWFudGl0YXRpdmUgZmllbGQgaXMgbm90IGJpbm5lZFxcblxcbmFuZCBubyBjdXN0b20gYGRvbWFpbmAgaXMgcHJvdmlkZWQ7IGBmYWxzZWAgb3RoZXJ3aXNlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInVzZVJhd0RvbWFpblwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVXNlcyB0aGUgc291cmNlIGRhdGEgcmFuZ2UgYXMgc2NhbGUgZG9tYWluIGluc3RlYWQgb2YgYWdncmVnYXRlZCBkYXRhIGZvciBhZ2dyZWdhdGUgYXhpcy5cXG5cXG5UaGlzIHByb3BlcnR5IG9ubHkgd29ya3Mgd2l0aCBhZ2dyZWdhdGUgZnVuY3Rpb25zIHRoYXQgcHJvZHVjZSB2YWx1ZXMgd2l0aGluIHRoZSByYXcgZGF0YSBkb21haW4gKGBcXFwibWVhblxcXCJgLCBgXFxcImF2ZXJhZ2VcXFwiYCwgYFxcXCJzdGRldlxcXCJgLCBgXFxcInN0ZGV2cFxcXCJgLCBgXFxcIm1lZGlhblxcXCJgLCBgXFxcInExXFxcImAsIGBcXFwicTNcXFwiYCwgYFxcXCJtaW5cXFwiYCwgYFxcXCJtYXhcXFwiYCkuIEZvciBvdGhlciBhZ2dyZWdhdGlvbnMgdGhhdCBwcm9kdWNlIHZhbHVlcyBvdXRzaWRlIG9mIHRoZSByYXcgZGF0YSBkb21haW4gKGUuZy4gYFxcXCJjb3VudFxcXCJgLCBgXFxcInN1bVxcXCJgKSwgdGhpcyBwcm9wZXJ0eSBpcyBpZ25vcmVkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJTY2FsZVR5cGVcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcImxpbmVhclwiLFxyXG4gICAgICAgIFwibG9nXCIsXHJcbiAgICAgICAgXCJwb3dcIixcclxuICAgICAgICBcInNxcnRcIixcclxuICAgICAgICBcInF1YW50aWxlXCIsXHJcbiAgICAgICAgXCJxdWFudGl6ZVwiLFxyXG4gICAgICAgIFwib3JkaW5hbFwiLFxyXG4gICAgICAgIFwidGltZVwiLFxyXG4gICAgICAgIFwidXRjXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiTmljZVRpbWVcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcInNlY29uZFwiLFxyXG4gICAgICAgIFwibWludXRlXCIsXHJcbiAgICAgICAgXCJob3VyXCIsXHJcbiAgICAgICAgXCJkYXlcIixcclxuICAgICAgICBcIndlZWtcIixcclxuICAgICAgICBcIm1vbnRoXCIsXHJcbiAgICAgICAgXCJ5ZWFyXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiU29ydEZpZWxkXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJmaWVsZFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZpZWxkIG5hbWUgdG8gYWdncmVnYXRlIG92ZXIuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJvcFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0FnZ3JlZ2F0ZU9wXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNvcnQgYWdncmVnYXRpb24gb3BlcmF0b3JcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJvcmRlclwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NvcnRPcmRlclwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBcInJlcXVpcmVkXCI6IFtcclxuICAgICAgICBcImZpZWxkXCIsXHJcbiAgICAgICAgXCJvcFwiXHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICBcIkFnZ3JlZ2F0ZU9wXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXHJcbiAgICAgIFwiZW51bVwiOiBbXHJcbiAgICAgICAgXCJ2YWx1ZXNcIixcclxuICAgICAgICBcImNvdW50XCIsXHJcbiAgICAgICAgXCJ2YWxpZFwiLFxyXG4gICAgICAgIFwibWlzc2luZ1wiLFxyXG4gICAgICAgIFwiZGlzdGluY3RcIixcclxuICAgICAgICBcInN1bVwiLFxyXG4gICAgICAgIFwibWVhblwiLFxyXG4gICAgICAgIFwiYXZlcmFnZVwiLFxyXG4gICAgICAgIFwidmFyaWFuY2VcIixcclxuICAgICAgICBcInZhcmlhbmNlcFwiLFxyXG4gICAgICAgIFwic3RkZXZcIixcclxuICAgICAgICBcInN0ZGV2cFwiLFxyXG4gICAgICAgIFwibWVkaWFuXCIsXHJcbiAgICAgICAgXCJxMVwiLFxyXG4gICAgICAgIFwicTNcIixcclxuICAgICAgICBcIm1vZGVza2V3XCIsXHJcbiAgICAgICAgXCJtaW5cIixcclxuICAgICAgICBcIm1heFwiLFxyXG4gICAgICAgIFwiYXJnbWluXCIsXHJcbiAgICAgICAgXCJhcmdtYXhcIlxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJTb3J0T3JkZXJcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcImFzY2VuZGluZ1wiLFxyXG4gICAgICAgIFwiZGVzY2VuZGluZ1wiLFxyXG4gICAgICAgIFwibm9uZVwiXHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICBcIlR5cGVcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcInF1YW50aXRhdGl2ZVwiLFxyXG4gICAgICAgIFwib3JkaW5hbFwiLFxyXG4gICAgICAgIFwidGVtcG9yYWxcIixcclxuICAgICAgICBcIm5vbWluYWxcIlxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJUaW1lVW5pdFwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwieWVhclwiLFxyXG4gICAgICAgIFwibW9udGhcIixcclxuICAgICAgICBcImRheVwiLFxyXG4gICAgICAgIFwiZGF0ZVwiLFxyXG4gICAgICAgIFwiaG91cnNcIixcclxuICAgICAgICBcIm1pbnV0ZXNcIixcclxuICAgICAgICBcInNlY29uZHNcIixcclxuICAgICAgICBcIm1pbGxpc2Vjb25kc1wiLFxyXG4gICAgICAgIFwieWVhcm1vbnRoXCIsXHJcbiAgICAgICAgXCJ5ZWFybW9udGhkYXRlXCIsXHJcbiAgICAgICAgXCJ5ZWFybW9udGhkYXRlaG91cnNcIixcclxuICAgICAgICBcInllYXJtb250aGRhdGVob3Vyc21pbnV0ZXNcIixcclxuICAgICAgICBcInllYXJtb250aGRhdGVob3Vyc21pbnV0ZXNzZWNvbmRzXCIsXHJcbiAgICAgICAgXCJob3Vyc21pbnV0ZXNcIixcclxuICAgICAgICBcImhvdXJzbWludXRlc3NlY29uZHNcIixcclxuICAgICAgICBcIm1pbnV0ZXNzZWNvbmRzXCIsXHJcbiAgICAgICAgXCJzZWNvbmRzbWlsbGlzZWNvbmRzXCIsXHJcbiAgICAgICAgXCJxdWFydGVyXCIsXHJcbiAgICAgICAgXCJ5ZWFycXVhcnRlclwiLFxyXG4gICAgICAgIFwicXVhcnRlcm1vbnRoXCIsXHJcbiAgICAgICAgXCJ5ZWFycXVhcnRlcm1vbnRoXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiQmluXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJtaW5cIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBtaW5pbXVtIGJpbiB2YWx1ZSB0byBjb25zaWRlci4gSWYgdW5zcGVjaWZpZWQsIHRoZSBtaW5pbXVtIHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgZmllbGQgaXMgdXNlZC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm1heFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG1heGltdW0gYmluIHZhbHVlIHRvIGNvbnNpZGVyLiBJZiB1bnNwZWNpZmllZCwgdGhlIG1heGltdW0gdmFsdWUgb2YgdGhlIHNwZWNpZmllZCBmaWVsZCBpcyB1c2VkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYmFzZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG51bWJlciBiYXNlIHRvIHVzZSBmb3IgYXV0b21hdGljIGJpbiBkZXRlcm1pbmF0aW9uIChkZWZhdWx0IGlzIGJhc2UgMTApLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic3RlcFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gZXhhY3Qgc3RlcCBzaXplIHRvIHVzZSBiZXR3ZWVuIGJpbnMuIElmIHByb3ZpZGVkLCBvcHRpb25zIHN1Y2ggYXMgbWF4YmlucyB3aWxsIGJlIGlnbm9yZWQuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzdGVwc1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gYXJyYXkgb2YgYWxsb3dhYmxlIHN0ZXAgc2l6ZXMgdG8gY2hvb3NlIGZyb20uXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm1pbnN0ZXBcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgbWluaW11bSBhbGxvd2FibGUgc3RlcCBzaXplIChwYXJ0aWN1bGFybHkgdXNlZnVsIGZvciBpbnRlZ2VyIHZhbHVlcykuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJkaXZcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlNjYWxlIGZhY3RvcnMgaW5kaWNhdGluZyBhbGxvd2FibGUgc3ViZGl2aXNpb25zLiBUaGUgZGVmYXVsdCB2YWx1ZSBpcyBbNSwgMl0sIHdoaWNoIGluZGljYXRlcyB0aGF0IGZvciBiYXNlIDEwIG51bWJlcnMgKHRoZSBkZWZhdWx0IGJhc2UpLCB0aGUgbWV0aG9kIG1heSBjb25zaWRlciBkaXZpZGluZyBiaW4gc2l6ZXMgYnkgNSBhbmQvb3IgMi4gRm9yIGV4YW1wbGUsIGZvciBhbiBpbml0aWFsIHN0ZXAgc2l6ZSBvZiAxMCwgdGhlIG1ldGhvZCBjYW4gY2hlY2sgaWYgYmluIHNpemVzIG9mIDIgKD0gMTAvNSksIDUgKD0gMTAvMiksIG9yIDEgKD0gMTAvKDUqMikpIG1pZ2h0IGFsc28gc2F0aXNmeSB0aGUgZ2l2ZW4gY29uc3RyYWludHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm1heGJpbnNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk1heGltdW0gbnVtYmVyIG9mIGJpbnMuXCIsXHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJDaGFubmVsRGVmV2l0aExlZ2VuZFwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwibGVnZW5kXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvTGVnZW5kXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2NhbGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9TY2FsZVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInNvcnRcIjoge1xyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NvcnRGaWVsZFwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NvcnRPcmRlclwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZmllbGRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk5hbWUgb2YgdGhlIGZpZWxkIGZyb20gd2hpY2ggdG8gcHVsbCBhIGRhdGEgdmFsdWUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0eXBlXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVHlwZVwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBlbmNvZGVkIGZpZWxkJ3MgdHlwZSBvZiBtZWFzdXJlbWVudC4gVGhpcyBjYW4gYmUgZWl0aGVyIGEgZnVsbCB0eXBlXFxuXFxubmFtZSAoYFxcXCJxdWFudGl0YXRpdmVcXFwiYCwgYFxcXCJ0ZW1wb3JhbFxcXCJgLCBgXFxcIm9yZGluYWxcXFwiYCwgIGFuZCBgXFxcIm5vbWluYWxcXFwiYClcXG5cXG5vciBhbiBpbml0aWFsIGNoYXJhY3RlciBvZiB0aGUgdHlwZSBuYW1lIChgXFxcIlFcXFwiYCwgYFxcXCJUXFxcImAsIGBcXFwiT1xcXCJgLCBgXFxcIk5cXFwiYCkuXFxuXFxuVGhpcyBwcm9wZXJ0eSBpcyBjYXNlIGluc2Vuc2l0aXZlLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIGNvbnN0YW50IHZhbHVlIGluIHZpc3VhbCBkb21haW4uXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGltZVVuaXRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UaW1lVW5pdFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRpbWUgdW5pdCBmb3IgYSBgdGVtcG9yYWxgIGZpZWxkICAoZS5nLiwgYHllYXJgLCBgeWVhcm1vbnRoYCwgYG1vbnRoYCwgYGhvdXJgKS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJiaW5cIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZsYWcgZm9yIGJpbm5pbmcgYSBgcXVhbnRpdGF0aXZlYCBmaWVsZCwgb3IgYSBiaW4gcHJvcGVydHkgb2JqZWN0XFxuXFxuZm9yIGJpbm5pbmcgcGFyYW1ldGVycy5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0JpblwiLFxyXG4gICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJCaW5uaW5nIHByb3BlcnRpZXMgb3IgYm9vbGVhbiBmbGFnIGZvciBkZXRlcm1pbmluZyB3aGV0aGVyIHRvIGJpbiBkYXRhIG9yIG5vdC5cIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImFnZ3JlZ2F0ZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0FnZ3JlZ2F0ZU9wXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQWdncmVnYXRpb24gZnVuY3Rpb24gZm9yIHRoZSBmaWVsZFxcblxcbihlLmcuLCBgbWVhbmAsIGBzdW1gLCBgbWVkaWFuYCwgYG1pbmAsIGBtYXhgLCBgY291bnRgKS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGl0bGUgZm9yIGF4aXMgb3IgbGVnZW5kLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIkxlZ2VuZFwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwiZm9ybWF0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvcHRpb25hbCBmb3JtYXR0aW5nIHBhdHRlcm4gZm9yIGxlZ2VuZCBsYWJlbHMuIFZlZ2EgdXNlcyBEM1xcXFwncyBmb3JtYXQgcGF0dGVybi5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIHRpdGxlIGZvciB0aGUgbGVnZW5kLiAoU2hvd3MgZmllbGQgbmFtZSBhbmQgaXRzIGZ1bmN0aW9uIGJ5IGRlZmF1bHQuKVwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidmFsdWVzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJFeHBsaWNpdGx5IHNldCB0aGUgdmlzaWJsZSBsZWdlbmQgdmFsdWVzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge31cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwib3JpZW50XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgb3JpZW50YXRpb24gb2YgdGhlIGxlZ2VuZC4gT25lIG9mIFxcXCJsZWZ0XFxcIiBvciBcXFwicmlnaHRcXFwiLiBUaGlzIGRldGVybWluZXMgaG93IHRoZSBsZWdlbmQgaXMgcG9zaXRpb25lZCB3aXRoaW4gdGhlIHNjZW5lLiBUaGUgZGVmYXVsdCBpcyBcXFwicmlnaHRcXFwiLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwib2Zmc2V0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgb2Zmc2V0LCBpbiBwaXhlbHMsIGJ5IHdoaWNoIHRvIGRpc3BsYWNlIHRoZSBsZWdlbmQgZnJvbSB0aGUgZWRnZSBvZiB0aGUgZW5jbG9zaW5nIGdyb3VwIG9yIGRhdGEgcmVjdGFuZ2xlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHBhZGRpbmcsIGluIHBpeGVscywgYmV0d2VlbiB0aGUgbGVuZ2VuZCBhbmQgYXhpcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm1hcmdpblwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG1hcmdpbiBhcm91bmQgdGhlIGxlZ2VuZCwgaW4gcGl4ZWxzXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmFkaWVudFN0cm9rZUNvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgY29sb3Igb2YgdGhlIGdyYWRpZW50IHN0cm9rZSwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImdyYWRpZW50U3Ryb2tlV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCBvZiB0aGUgZ3JhZGllbnQgc3Ryb2tlLCBpbiBwaXhlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmFkaWVudEhlaWdodFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGhlaWdodCBvZiB0aGUgZ3JhZGllbnQsIGluIHBpeGVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImdyYWRpZW50V2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCBvZiB0aGUgZ3JhZGllbnQsIGluIHBpeGVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxhYmVsQWxpZ25cIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBhbGlnbm1lbnQgb2YgdGhlIGxlZ2VuZCBsYWJlbCwgY2FuIGJlIGxlZnQsIG1pZGRsZSBvciByaWdodC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxhYmVsQmFzZWxpbmVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBwb3NpdGlvbiBvZiB0aGUgYmFzZWxpbmUgb2YgbGVnZW5kIGxhYmVsLCBjYW4gYmUgdG9wLCBtaWRkbGUgb3IgYm90dG9tLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibGFiZWxDb2xvclwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBsZWdlbmQgbGFiZWwsIGNhbiBiZSBpbiBoZXggY29sb3IgY29kZSBvciByZWd1bGFyIGNvbG9yIG5hbWUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbEZvbnRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb250IG9mIHRoZSBsZW5nZW5kIGxhYmVsLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibGFiZWxGb250U2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgc2l6ZSBvZiBsZW5nZW5kIGxhYmxlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibGFiZWxPZmZzZXRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvZmZzZXQgb2YgdGhlIGxlZ2VuZCBsYWJlbC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInNob3J0VGltZUxhYmVsc1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2hldGhlciBtb250aCBuYW1lcyBhbmQgd2Vla2RheSBuYW1lcyBzaG91bGQgYmUgYWJicmV2aWF0ZWQuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic3ltYm9sQ29sb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBjb2xvciBvZiB0aGUgbGVnZW5kIHN5bWJvbCxcIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN5bWJvbFNoYXBlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2hhcGUgb2YgdGhlIGxlZ2VuZCBzeW1ib2wsIGNhbiBiZSB0aGUgJ2NpcmNsZScsICdzcXVhcmUnLCAnY3Jvc3MnLCAnZGlhbW9uZCcsXFxuXFxuJ3RyaWFuZ2xlLXVwJywgJ3RyaWFuZ2xlLWRvd24nLCBvciBlbHNlIGEgY3VzdG9tIFNWRyBwYXRoIHN0cmluZy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN5bWJvbFNpemVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzaXplIG9mIHRoZSBsZW5nZW5kIHN5bWJvbCwgaW4gcGl4ZWxzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic3ltYm9sU3Ryb2tlV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB3aWR0aCBvZiB0aGUgc3ltYm9sJ3Mgc3Ryb2tlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGl0bGVDb2xvclwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT3B0aW9uYWwgbWFyayBwcm9wZXJ0eSBkZWZpbml0aW9ucyBmb3IgY3VzdG9tIGxlZ2VuZCBzdHlsaW5nLlxcblxcblRoZSBjb2xvciBvZiB0aGUgbGVnZW5kIHRpdGxlLCBjYW4gYmUgaW4gaGV4IGNvbG9yIGNvZGUgb3IgcmVndWxhciBjb2xvciBuYW1lLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGl0bGVGb250XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBvZiB0aGUgbGVnZW5kIHRpdGxlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGl0bGVGb250U2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgc2l6ZSBvZiB0aGUgbGVnZW5kIHRpdGxlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGl0bGVGb250V2VpZ2h0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCB3ZWlnaHQgb2YgdGhlIGxlZ2VuZCB0aXRsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9wdGlvbmFsIG1hcmsgcHJvcGVydHkgZGVmaW5pdGlvbnMgZm9yIGN1c3RvbSBsZWdlbmQgc3R5bGluZy5cIlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiRmllbGREZWZcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcImZpZWxkXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJOYW1lIG9mIHRoZSBmaWVsZCBmcm9tIHdoaWNoIHRvIHB1bGwgYSBkYXRhIHZhbHVlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidHlwZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1R5cGVcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZW5jb2RlZCBmaWVsZCdzIHR5cGUgb2YgbWVhc3VyZW1lbnQuIFRoaXMgY2FuIGJlIGVpdGhlciBhIGZ1bGwgdHlwZVxcblxcbm5hbWUgKGBcXFwicXVhbnRpdGF0aXZlXFxcImAsIGBcXFwidGVtcG9yYWxcXFwiYCwgYFxcXCJvcmRpbmFsXFxcImAsICBhbmQgYFxcXCJub21pbmFsXFxcImApXFxuXFxub3IgYW4gaW5pdGlhbCBjaGFyYWN0ZXIgb2YgdGhlIHR5cGUgbmFtZSAoYFxcXCJRXFxcImAsIGBcXFwiVFxcXCJgLCBgXFxcIk9cXFwiYCwgYFxcXCJOXFxcImApLlxcblxcblRoaXMgcHJvcGVydHkgaXMgY2FzZSBpbnNlbnNpdGl2ZS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBjb25zdGFudCB2YWx1ZSBpbiB2aXN1YWwgZG9tYWluLlwiLFxyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpbWVVbml0XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVGltZVVuaXRcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaW1lIHVuaXQgZm9yIGEgYHRlbXBvcmFsYCBmaWVsZCAgKGUuZy4sIGB5ZWFyYCwgYHllYXJtb250aGAsIGBtb250aGAsIGBob3VyYCkuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYmluXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGbGFnIGZvciBiaW5uaW5nIGEgYHF1YW50aXRhdGl2ZWAgZmllbGQsIG9yIGEgYmluIHByb3BlcnR5IG9iamVjdFxcblxcbmZvciBiaW5uaW5nIHBhcmFtZXRlcnMuXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9CaW5cIixcclxuICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQmlubmluZyBwcm9wZXJ0aWVzIG9yIGJvb2xlYW4gZmxhZyBmb3IgZGV0ZXJtaW5pbmcgd2hldGhlciB0byBiaW4gZGF0YSBvciBub3QuXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJhZ2dyZWdhdGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9BZ2dyZWdhdGVPcFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFnZ3JlZ2F0aW9uIGZ1bmN0aW9uIGZvciB0aGUgZmllbGRcXG5cXG4oZS5nLiwgYG1lYW5gLCBgc3VtYCwgYG1lZGlhbmAsIGBtaW5gLCBgbWF4YCwgYGNvdW50YCkuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGl0bGVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRpdGxlIGZvciBheGlzIG9yIGxlZ2VuZC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJPcmRlckNoYW5uZWxEZWZcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcInNvcnRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Tb3J0T3JkZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmaWVsZFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiTmFtZSBvZiB0aGUgZmllbGQgZnJvbSB3aGljaCB0byBwdWxsIGEgZGF0YSB2YWx1ZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInR5cGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UeXBlXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGVuY29kZWQgZmllbGQncyB0eXBlIG9mIG1lYXN1cmVtZW50LiBUaGlzIGNhbiBiZSBlaXRoZXIgYSBmdWxsIHR5cGVcXG5cXG5uYW1lIChgXFxcInF1YW50aXRhdGl2ZVxcXCJgLCBgXFxcInRlbXBvcmFsXFxcImAsIGBcXFwib3JkaW5hbFxcXCJgLCAgYW5kIGBcXFwibm9taW5hbFxcXCJgKVxcblxcbm9yIGFuIGluaXRpYWwgY2hhcmFjdGVyIG9mIHRoZSB0eXBlIG5hbWUgKGBcXFwiUVxcXCJgLCBgXFxcIlRcXFwiYCwgYFxcXCJPXFxcImAsIGBcXFwiTlxcXCJgKS5cXG5cXG5UaGlzIHByb3BlcnR5IGlzIGNhc2UgaW5zZW5zaXRpdmUuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgY29uc3RhbnQgdmFsdWUgaW4gdmlzdWFsIGRvbWFpbi5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aW1lVW5pdFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1RpbWVVbml0XCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGltZSB1bml0IGZvciBhIGB0ZW1wb3JhbGAgZmllbGQgIChlLmcuLCBgeWVhcmAsIGB5ZWFybW9udGhgLCBgbW9udGhgLCBgaG91cmApLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImJpblwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRmxhZyBmb3IgYmlubmluZyBhIGBxdWFudGl0YXRpdmVgIGZpZWxkLCBvciBhIGJpbiBwcm9wZXJ0eSBvYmplY3RcXG5cXG5mb3IgYmlubmluZyBwYXJhbWV0ZXJzLlwiLFxyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQmluXCIsXHJcbiAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkJpbm5pbmcgcHJvcGVydGllcyBvciBib29sZWFuIGZsYWcgZm9yIGRldGVybWluaW5nIHdoZXRoZXIgdG8gYmluIGRhdGEgb3Igbm90LlwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYWdncmVnYXRlXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQWdncmVnYXRlT3BcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBZ2dyZWdhdGlvbiBmdW5jdGlvbiBmb3IgdGhlIGZpZWxkXFxuXFxuKGUuZy4sIGBtZWFuYCwgYHN1bWAsIGBtZWRpYW5gLCBgbWluYCwgYG1heGAsIGBjb3VudGApLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaXRsZSBmb3IgYXhpcyBvciBsZWdlbmQuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiRGF0YVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwiZm9ybWF0XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRGF0YUZvcm1hdFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIG9iamVjdCB0aGF0IHNwZWNpZmllcyB0aGUgZm9ybWF0IGZvciB0aGUgZGF0YSBmaWxlIG9yIHZhbHVlcy5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ1cmxcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgVVJMIGZyb20gd2hpY2ggdG8gbG9hZCB0aGUgZGF0YSBzZXQuIFVzZSB0aGUgZm9ybWF0LnR5cGUgcHJvcGVydHlcXG5cXG50byBlbnN1cmUgdGhlIGxvYWRlZCBkYXRhIGlzIGNvcnJlY3RseSBwYXJzZWQuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ2YWx1ZXNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlBhc3MgYXJyYXkgb2Ygb2JqZWN0cyBpbnN0ZWFkIG9mIGEgdXJsIHRvIGEgZmlsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICBcIml0ZW1zXCI6IHt9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJEYXRhRm9ybWF0XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJ0eXBlXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRGF0YUZvcm1hdFR5cGVcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUeXBlIG9mIGlucHV0IGRhdGE6IGBcXFwianNvblxcXCJgLCBgXFxcImNzdlxcXCJgLCBgXFxcInRzdlxcXCJgLlxcblxcblRoZSBkZWZhdWx0IGZvcm1hdCB0eXBlIGlzIGRldGVybWluZWQgYnkgdGhlIGV4dGVuc2lvbiBvZiB0aGUgZmlsZSB1cmwuXFxuXFxuSWYgbm8gZXh0ZW5zaW9uIGlzIGRldGVjdGVkLCBgXFxcImpzb25cXFwiYCB3aWxsIGJlIHVzZWQgYnkgZGVmYXVsdC5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJwcm9wZXJ0eVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSlNPTiBvbmx5KSBUaGUgSlNPTiBwcm9wZXJ0eSBjb250YWluaW5nIHRoZSBkZXNpcmVkIGRhdGEuXFxuXFxuVGhpcyBwYXJhbWV0ZXIgY2FuIGJlIHVzZWQgd2hlbiB0aGUgbG9hZGVkIEpTT04gZmlsZSBtYXkgaGF2ZSBzdXJyb3VuZGluZyBzdHJ1Y3R1cmUgb3IgbWV0YS1kYXRhLlxcblxcbkZvciBleGFtcGxlIGBcXFwicHJvcGVydHlcXFwiOiBcXFwidmFsdWVzLmZlYXR1cmVzXFxcImAgaXMgZXF1aXZhbGVudCB0byByZXRyaWV2aW5nIGBqc29uLnZhbHVlcy5mZWF0dXJlc2BcXG5cXG5mcm9tIHRoZSBsb2FkZWQgSlNPTiBvYmplY3QuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmZWF0dXJlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgbmFtZSBvZiB0aGUgVG9wb0pTT04gb2JqZWN0IHNldCB0byBjb252ZXJ0IHRvIGEgR2VvSlNPTiBmZWF0dXJlIGNvbGxlY3Rpb24uXFxuXFxuRm9yIGV4YW1wbGUsIGluIGEgbWFwIG9mIHRoZSB3b3JsZCwgdGhlcmUgbWF5IGJlIGFuIG9iamVjdCBzZXQgbmFtZWQgYFxcXCJjb3VudHJpZXNcXFwiYC5cXG5cXG5Vc2luZyB0aGUgZmVhdHVyZSBwcm9wZXJ0eSwgd2UgY2FuIGV4dHJhY3QgdGhpcyBzZXQgYW5kIGdlbmVyYXRlIGEgR2VvSlNPTiBmZWF0dXJlIG9iamVjdCBmb3IgZWFjaCBjb3VudHJ5LlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibWVzaFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG5hbWUgb2YgdGhlIFRvcG9KU09OIG9iamVjdCBzZXQgdG8gY29udmVydCB0byBhIG1lc2guXFxuXFxuU2ltaWxhciB0byB0aGUgYGZlYXR1cmVgIG9wdGlvbiwgYG1lc2hgIGV4dHJhY3RzIGEgbmFtZWQgVG9wb0pTT04gb2JqZWN0IHNldC5cXG5cXG5Vbmxpa2UgdGhlIGBmZWF0dXJlYCBvcHRpb24sIHRoZSBjb3JyZXNwb25kaW5nIGdlbyBkYXRhIGlzIHJldHVybmVkIGFzIGEgc2luZ2xlLCB1bmlmaWVkIG1lc2ggaW5zdGFuY2UsIG5vdCBhcyBpbmlkaXZpZHVhbCBHZW9KU09OIGZlYXR1cmVzLlxcblxcbkV4dHJhY3RpbmcgYSBtZXNoIGlzIHVzZWZ1bCBmb3IgbW9yZSBlZmZpY2llbnRseSBkcmF3aW5nIGJvcmRlcnMgb3Igb3RoZXIgZ2VvZ3JhcGhpYyBlbGVtZW50cyB0aGF0IHlvdSBkbyBub3QgbmVlZCB0byBhc3NvY2lhdGUgd2l0aCBzcGVjaWZpYyByZWdpb25zIHN1Y2ggYXMgaW5kaXZpZHVhbCBjb3VudHJpZXMsIHN0YXRlcyBvciBjb3VudGllcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJEYXRhRm9ybWF0VHlwZVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwianNvblwiLFxyXG4gICAgICAgIFwiY3N2XCIsXHJcbiAgICAgICAgXCJ0c3ZcIixcclxuICAgICAgICBcInRvcG9qc29uXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiVHJhbnNmb3JtXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJmaWx0ZXJcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGZpbHRlciBWZWdhIGV4cHJlc3Npb24uIFVzZSBgZGF0dW1gIHRvIHJlZmVyIHRvIHRoZSBjdXJyZW50IGRhdGEgb2JqZWN0LlwiLFxyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9FcXVhbEZpbHRlclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1JhbmdlRmlsdGVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvSW5GaWx0ZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRXF1YWxGaWx0ZXJcIlxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9SYW5nZUZpbHRlclwiXHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0luRmlsdGVyXCJcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmaWx0ZXJJbnZhbGlkXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJXaGV0aGVyIHRvIGZpbHRlciBpbnZhbGlkIHZhbHVlcyAoYG51bGxgIGFuZCBgTmFOYCkgZnJvbSB0aGUgZGF0YS4gQnkgZGVmYXVsdCAoYHVuZGVmaW5lZGApLCBvbmx5IHF1YW50aXRhdGl2ZSBhbmQgdGVtcG9yYWwgZmllbGRzIGFyZSBmaWx0ZXJlZC4gSWYgc2V0IHRvIGB0cnVlYCwgYWxsIGRhdGEgaXRlbXMgd2l0aCBudWxsIHZhbHVlcyBhcmUgZmlsdGVyZWQuIElmIGBmYWxzZWAsIGFsbCBkYXRhIGl0ZW1zIGFyZSBpbmNsdWRlZC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJjYWxjdWxhdGVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNhbGN1bGF0ZSBuZXcgZmllbGQocykgdXNpbmcgdGhlIHByb3ZpZGVkIGV4cHJlc3NzaW9uKHMpLiBDYWxjdWxhdGlvbiBhcmUgYXBwbGllZCBiZWZvcmUgZmlsdGVyLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0Zvcm11bGFcIixcclxuICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZvcm11bGEgb2JqZWN0IGZvciBjYWxjdWxhdGUuXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIkVxdWFsRmlsdGVyXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJ0aW1lVW5pdFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1RpbWVVbml0XCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGltZSB1bml0IGZvciB0aGUgZmllbGQgdG8gYmUgZmlsdGVyZWQuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZmllbGRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZpZWxkIHRvIGJlIGZpbHRlcmVkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZXF1YWxcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlZhbHVlIHRoYXQgdGhlIGZpZWxkIHNob3VsZCBiZSBlcXVhbCB0by5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRGF0ZVRpbWVcIixcclxuICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT2JqZWN0IGZvciBkZWZpbmluZyBkYXRldGltZSBpbiBWZWdhLUxpdGUgRmlsdGVyLlxcblxcbklmIGJvdGggbW9udGggYW5kIHF1YXJ0ZXIgYXJlIHByb3ZpZGVkLCBtb250aCBoYXMgaGlnaGVyIHByZWNlZGVuY2UuXFxuXFxuYGRheWAgY2Fubm90IGJlIGNvbWJpbmVkIHdpdGggb3RoZXIgZGF0ZS5cXG5cXG5XZSBhY2NlcHQgc3RyaW5nIGZvciBtb250aCBhbmQgZGF5IG5hbWVzLlwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFwicmVxdWlyZWRcIjogW1xyXG4gICAgICAgIFwiZmllbGRcIixcclxuICAgICAgICBcImVxdWFsXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiRGF0ZVRpbWVcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcInllYXJcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkludGVnZXIgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSB5ZWFyLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicXVhcnRlclwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZWdlciB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIHF1YXJ0ZXIgb2YgdGhlIHllYXIgKGZyb20gMS00KS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm1vbnRoXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPbmUgb2Y6ICgxKSBpbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgbW9udGggZnJvbSBgMWAtYDEyYC4gYDFgIHJlcHJlc2VudHMgSmFudWFyeTsgICgyKSBjYXNlLWluc2Vuc2l0aXZlIG1vbnRoIG5hbWUgKGUuZy4sIGBcXFwiSmFudWFyeVxcXCJgKTsgICgzKSBjYXNlLWluc2Vuc2l0aXZlLCAzLWNoYXJhY3RlciBzaG9ydCBtb250aCBuYW1lIChlLmcuLCBgXFxcIkphblxcXCJgKS5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZGF0ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZWdlciB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGRhdGUgZnJvbSAxLTMxLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZGF5XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJWYWx1ZSByZXByZXNlbnRpbmcgdGhlIGRheSBvZiB3ZWVrLiAgVGhpcyBjYW4gYmUgb25lIG9mOiAoMSkgaW50ZWdlciB2YWx1ZSAtLSBgMWAgcmVwcmVzZW50cyBNb25kYXk7ICgyKSBjYXNlLWluc2Vuc2l0aXZlIGRheSBuYW1lIChlLmcuLCBgXFxcIk1vbmRheVxcXCJgKTsgICgzKSBjYXNlLWluc2Vuc2l0aXZlLCAzLWNoYXJhY3RlciBzaG9ydCBkYXkgbmFtZSAoZS5nLiwgYFxcXCJNb25cXFwiYCkuICAgPGJyLz4gKipXYXJuaW5nOioqIEEgRGF0ZVRpbWUgZGVmaW5pdGlvbiBvYmplY3Qgd2l0aCBgZGF5YCoqIHNob3VsZCBub3QgYmUgY29tYmluZWQgd2l0aCBgeWVhcmAsIGBxdWFydGVyYCwgYG1vbnRoYCwgb3IgYGRhdGVgLlwiLFxyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJob3Vyc1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZWdlciB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGhvdXIgb2YgZGF5IGZyb20gMC0yMy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm1pbnV0ZXNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkludGVnZXIgdmFsdWUgcmVwcmVzZW50aW5nIG1pbnV0ZSBzZWdtZW50IG9mIGEgdGltZSBmcm9tIDAtNTkuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzZWNvbmRzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyBzZWNvbmQgc2VnbWVudCBvZiBhIHRpbWUgZnJvbSAwLTU5LlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibWlsbGlzZWNvbmRzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJbnRlZ2VyIHZhbHVlIHJlcHJlc2VudGluZyBtaWxsaXNlY29uZCBzZWdtZW50IG9mIGEgdGltZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJSYW5nZUZpbHRlclwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwidGltZVVuaXRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UaW1lVW5pdFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcInRpbWUgdW5pdCBmb3IgdGhlIGZpZWxkIHRvIGJlIGZpbHRlcmVkLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImZpZWxkXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGaWVsZCB0byBiZSBmaWx0ZXJlZFwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicmFuZ2VcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFycmF5IG9mIGluY2x1c2l2ZSBtaW5pbXVtIGFuZCBtYXhpbXVtIHZhbHVlc1xcblxcbmZvciBhIGZpZWxkIHZhbHVlIG9mIGEgZGF0YSBpdGVtIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBmaWx0ZXJlZCBkYXRhLlwiLFxyXG4gICAgICAgICAgXCJtYXhJdGVtc1wiOiAyLFxyXG4gICAgICAgICAgXCJtaW5JdGVtc1wiOiAyLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9EYXRlVGltZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9iamVjdCBmb3IgZGVmaW5pbmcgZGF0ZXRpbWUgaW4gVmVnYS1MaXRlIEZpbHRlci5cXG5cXG5JZiBib3RoIG1vbnRoIGFuZCBxdWFydGVyIGFyZSBwcm92aWRlZCwgbW9udGggaGFzIGhpZ2hlciBwcmVjZWRlbmNlLlxcblxcbmBkYXlgIGNhbm5vdCBiZSBjb21iaW5lZCB3aXRoIG90aGVyIGRhdGUuXFxuXFxuV2UgYWNjZXB0IHN0cmluZyBmb3IgbW9udGggYW5kIGRheSBuYW1lcy5cIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgXCJyZXF1aXJlZFwiOiBbXHJcbiAgICAgICAgXCJmaWVsZFwiLFxyXG4gICAgICAgIFwicmFuZ2VcIlxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJJbkZpbHRlclwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwidGltZVVuaXRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UaW1lVW5pdFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcInRpbWUgdW5pdCBmb3IgdGhlIGZpZWxkIHRvIGJlIGZpbHRlcmVkLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImZpZWxkXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGaWVsZCB0byBiZSBmaWx0ZXJlZFwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiaW5cIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc2V0IG9mIHZhbHVlcyB0aGF0IHRoZSBgZmllbGRgJ3MgdmFsdWUgc2hvdWxkIGJlIGEgbWVtYmVyIG9mLFxcblxcbmZvciBhIGRhdGEgaXRlbSBpbmNsdWRlZCBpbiB0aGUgZmlsdGVyZWQgZGF0YS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRGF0ZVRpbWVcIixcclxuICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPYmplY3QgZm9yIGRlZmluaW5nIGRhdGV0aW1lIGluIFZlZ2EtTGl0ZSBGaWx0ZXIuXFxuXFxuSWYgYm90aCBtb250aCBhbmQgcXVhcnRlciBhcmUgcHJvdmlkZWQsIG1vbnRoIGhhcyBoaWdoZXIgcHJlY2VkZW5jZS5cXG5cXG5gZGF5YCBjYW5ub3QgYmUgY29tYmluZWQgd2l0aCBvdGhlciBkYXRlLlxcblxcbldlIGFjY2VwdCBzdHJpbmcgZm9yIG1vbnRoIGFuZCBkYXkgbmFtZXMuXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFwicmVxdWlyZWRcIjogW1xyXG4gICAgICAgIFwiZmllbGRcIixcclxuICAgICAgICBcImluXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiRm9ybXVsYVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwiZmllbGRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmaWVsZCBpbiB3aGljaCB0byBzdG9yZSB0aGUgY29tcHV0ZWQgZm9ybXVsYSB2YWx1ZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImV4cHJcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc3RyaW5nIGNvbnRhaW5pbmcgYW4gZXhwcmVzc2lvbiBmb3IgdGhlIGZvcm11bGEuIFVzZSB0aGUgdmFyaWFibGUgYGRhdHVtYCB0byB0byByZWZlciB0byB0aGUgY3VycmVudCBkYXRhIG9iamVjdC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBcInJlcXVpcmVkXCI6IFtcclxuICAgICAgICBcImZpZWxkXCIsXHJcbiAgICAgICAgXCJleHByXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiQ29uZmlnXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJ2aWV3cG9ydFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHdpZHRoIGFuZCBoZWlnaHQgb2YgdGhlIG9uLXNjcmVlbiB2aWV3cG9ydCwgaW4gcGl4ZWxzLiBJZiBuZWNlc3NhcnksIGNsaXBwaW5nIGFuZCBzY3JvbGxpbmcgd2lsbCBiZSBhcHBsaWVkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYmFja2dyb3VuZFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ1NTIGNvbG9yIHByb3BlcnR5IHRvIHVzZSBhcyBiYWNrZ3JvdW5kIG9mIHZpc3VhbGl6YXRpb24uIERlZmF1bHQgaXMgYFxcXCJ0cmFuc3BhcmVudFxcXCJgLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibnVtYmVyRm9ybWF0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEMyBOdW1iZXIgZm9ybWF0IGZvciBheGlzIGxhYmVscyBhbmQgdGV4dCB0YWJsZXMuIEZvciBleGFtcGxlIFxcXCJzXFxcIiBmb3IgU0kgdW5pdHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aW1lRm9ybWF0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IGRhdGV0aW1lIGZvcm1hdCBmb3IgYXhpcyBhbmQgbGVnZW5kIGxhYmVscy4gVGhlIGZvcm1hdCBjYW4gYmUgc2V0IGRpcmVjdGx5IG9uIGVhY2ggYXhpcyBhbmQgbGVnZW5kLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY291bnRUaXRsZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCBheGlzIGFuZCBsZWdlbmQgdGl0bGUgZm9yIGNvdW50IGZpZWxkcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImNlbGxcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DZWxsQ29uZmlnXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ2VsbCBDb25maWdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJtYXJrXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvTWFya0NvbmZpZ1wiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk1hcmsgQ29uZmlnXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwib3ZlcmxheVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL092ZXJsYXlDb25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJNYXJrIE92ZXJsYXkgQ29uZmlnXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2NhbGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9TY2FsZUNvbmZpZ1wiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlNjYWxlIENvbmZpZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImF4aXNcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9BeGlzQ29uZmlnXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQXhpcyBDb25maWdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsZWdlbmRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9MZWdlbmRDb25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJMZWdlbmQgQ29uZmlnXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZmFjZXRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GYWNldENvbmZpZ1wiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZhY2V0IENvbmZpZ1wiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJDZWxsQ29uZmlnXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJ3aWR0aFwiOiB7XHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJoZWlnaHRcIjoge1xyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY2xpcFwiOiB7XHJcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZmlsbFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZpbGwgY29sb3IuXCIsXHJcbiAgICAgICAgICBcImZvcm1hdFwiOiBcImNvbG9yXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmaWxsT3BhY2l0eVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZpbGwgb3BhY2l0eSAodmFsdWUgYmV0d2VlbiBbMCwxXSkuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzdHJva2VcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzdHJva2UgY29sb3IuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzdHJva2VPcGFjaXR5XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc3Ryb2tlIG9wYWNpdHkgKHZhbHVlIGJldHdlZW4gWzAsMV0pLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic3Ryb2tlV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzdHJva2Ugd2lkdGgsIGluIHBpeGVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN0cm9rZURhc2hcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFuIGFycmF5IG9mIGFsdGVybmF0aW5nIHN0cm9rZSwgc3BhY2UgbGVuZ3RocyBmb3IgY3JlYXRpbmcgZGFzaGVkIG9yIGRvdHRlZCBsaW5lcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic3Ryb2tlRGFzaE9mZnNldFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCAoaW4gcGl4ZWxzKSBpbnRvIHdoaWNoIHRvIGJlZ2luIGRyYXdpbmcgd2l0aCB0aGUgc3Ryb2tlIGRhc2ggYXJyYXkuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiTWFya0NvbmZpZ1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwiZmlsbGVkXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJXaGV0aGVyIHRoZSBzaGFwZVxcXFwncyBjb2xvciBzaG91bGQgYmUgdXNlZCBhcyBmaWxsIGNvbG9yIGluc3RlYWQgb2Ygc3Ryb2tlIGNvbG9yLlxcblxcblRoaXMgaXMgb25seSBhcHBsaWNhYmxlIGZvciBcXFwiYmFyXFxcIiwgXFxcInBvaW50XFxcIiwgYW5kIFxcXCJhcmVhXFxcIi5cXG5cXG5BbGwgbWFya3MgZXhjZXB0IFxcXCJwb2ludFxcXCIgbWFya3MgYXJlIGZpbGxlZCBieSBkZWZhdWx0LlxcblxcblNlZSBNYXJrIERvY3VtZW50YXRpb24gKGh0dHA6Ly92ZWdhLmdpdGh1Yi5pby92ZWdhLWxpdGUvZG9jcy9tYXJrcy5odG1sKVxcblxcbmZvciB1c2FnZSBleGFtcGxlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImNvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IGNvbG9yLlwiLFxyXG4gICAgICAgICAgXCJmb3JtYXRcIjogXCJjb2xvclwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZmlsbFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCBGaWxsIENvbG9yLiAgVGhpcyBoYXMgaGlnaGVyIHByZWNlZGVuY2UgdGhhbiBjb25maWcuY29sb3JcIixcclxuICAgICAgICAgIFwiZm9ybWF0XCI6IFwiY29sb3JcIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN0cm9rZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCBTdHJva2UgQ29sb3IuICBUaGlzIGhhcyBoaWdoZXIgcHJlY2VkZW5jZSB0aGFuIGNvbmZpZy5jb2xvclwiLFxyXG4gICAgICAgICAgXCJmb3JtYXRcIjogXCJjb2xvclwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwib3BhY2l0eVwiOiB7XHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcclxuICAgICAgICAgIFwibWF4aW11bVwiOiAxLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZmlsbE9wYWNpdHlcIjoge1xyXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXHJcbiAgICAgICAgICBcIm1heGltdW1cIjogMSxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN0cm9rZU9wYWNpdHlcIjoge1xyXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXHJcbiAgICAgICAgICBcIm1heGltdW1cIjogMSxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN0cm9rZVdpZHRoXCI6IHtcclxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic3Ryb2tlRGFzaFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gYXJyYXkgb2YgYWx0ZXJuYXRpbmcgc3Ryb2tlLCBzcGFjZSBsZW5ndGhzIGZvciBjcmVhdGluZyBkYXNoZWQgb3IgZG90dGVkIGxpbmVzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzdHJva2VEYXNoT2Zmc2V0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgb2Zmc2V0IChpbiBwaXhlbHMpIGludG8gd2hpY2ggdG8gYmVnaW4gZHJhd2luZyB3aXRoIHRoZSBzdHJva2UgZGFzaCBhcnJheS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN0YWNrZWRcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9TdGFja09mZnNldFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm9yaWVudFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL09yaWVudFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBvcmllbnRhdGlvbiBvZiBhIG5vbi1zdGFja2VkIGJhciwgdGljaywgYXJlYSwgYW5kIGxpbmUgY2hhcnRzLlxcblxcblRoZSB2YWx1ZSBpcyBlaXRoZXIgaG9yaXpvbnRhbCAoZGVmYXVsdCkgb3IgdmVydGljYWwuXFxuXFxuLSBGb3IgYmFyLCBydWxlIGFuZCB0aWNrLCB0aGlzIGRldGVybWluZXMgd2hldGhlciB0aGUgc2l6ZSBvZiB0aGUgYmFyIGFuZCB0aWNrXFxuXFxuc2hvdWxkIGJlIGFwcGxpZWQgdG8geCBvciB5IGRpbWVuc2lvbi5cXG5cXG4tIEZvciBhcmVhLCB0aGlzIHByb3BlcnR5IGRldGVybWluZXMgdGhlIG9yaWVudCBwcm9wZXJ0eSBvZiB0aGUgVmVnYSBvdXRwdXQuXFxuXFxuLSBGb3IgbGluZSwgdGhpcyBwcm9wZXJ0eSBkZXRlcm1pbmVzIHRoZSBzb3J0IG9yZGVyIG9mIHRoZSBwb2ludHMgaW4gdGhlIGxpbmVcXG5cXG5pZiBgY29uZmlnLnNvcnRMaW5lQnlgIGlzIG5vdCBzcGVjaWZpZWQuXFxuXFxuRm9yIHN0YWNrZWQgY2hhcnRzLCB0aGlzIGlzIGFsd2F5cyBkZXRlcm1pbmVkIGJ5IHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgc3RhY2s7XFxuXFxudGhlcmVmb3JlIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHZhbHVlIHdpbGwgYmUgaWdub3JlZC5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJpbnRlcnBvbGF0ZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ludGVycG9sYXRlXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGxpbmUgaW50ZXJwb2xhdGlvbiBtZXRob2QgdG8gdXNlLiBPbmUgb2YgbGluZWFyLCBzdGVwLWJlZm9yZSwgc3RlcC1hZnRlciwgYmFzaXMsIGJhc2lzLW9wZW4sIGNhcmRpbmFsLCBjYXJkaW5hbC1vcGVuLCBtb25vdG9uZS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0ZW5zaW9uXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZXBlbmRpbmcgb24gdGhlIGludGVycG9sYXRpb24gdHlwZSwgc2V0cyB0aGUgdGVuc2lvbiBwYXJhbWV0ZXIuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsaW5lU2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2l6ZSBvZiBsaW5lIG1hcmsuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJydWxlU2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2l6ZSBvZiBydWxlIG1hcmsuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJiYXJTaXplXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSBvZiB0aGUgYmFycy4gIElmIHVuc3BlY2lmaWVkLCB0aGUgZGVmYXVsdCBzaXplIGlzICBgYmFuZFNpemUtMWAsXFxuXFxud2hpY2ggcHJvdmlkZXMgMSBwaXhlbCBvZmZzZXQgYmV0d2VlbiBiYXJzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYmFyVGhpblNpemVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzaXplIG9mIHRoZSBiYXJzIG9uIGNvbnRpbnVvdXMgc2NhbGVzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2hhcGVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzeW1ib2wgc2hhcGUgdG8gdXNlLiBPbmUgb2YgY2lyY2xlIChkZWZhdWx0KSwgc3F1YXJlLCBjcm9zcywgZGlhbW9uZCwgdHJpYW5nbGUtdXAsIG9yIHRyaWFuZ2xlLWRvd24sIG9yIGEgY3VzdG9tIFNWRyBwYXRoLlwiLFxyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1NoYXBlXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHBpeGVsIGFyZWEgZWFjaCB0aGUgcG9pbnQuIEZvciBleGFtcGxlOiBpbiB0aGUgY2FzZSBvZiBjaXJjbGVzLCB0aGUgcmFkaXVzIGlzIGRldGVybWluZWQgaW4gcGFydCBieSB0aGUgc3F1YXJlIHJvb3Qgb2YgdGhlIHNpemUgdmFsdWUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrU2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHdpZHRoIG9mIHRoZSB0aWNrcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tUaGlja25lc3NcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoaWNrbmVzcyBvZiB0aGUgdGljayBtYXJrLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYWxpZ25cIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Ib3Jpem9udGFsQWxpZ25cIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgaG9yaXpvbnRhbCBhbGlnbm1lbnQgb2YgdGhlIHRleHQuIE9uZSBvZiBsZWZ0LCByaWdodCwgY2VudGVyLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImFuZ2xlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcm90YXRpb24gYW5nbGUgb2YgdGhlIHRleHQsIGluIGRlZ3JlZXMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJiYXNlbGluZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1ZlcnRpY2FsQWxpZ25cIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgdmVydGljYWwgYWxpZ25tZW50IG9mIHRoZSB0ZXh0LiBPbmUgb2YgdG9wLCBtaWRkbGUsIGJvdHRvbS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJkeFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGhvcml6b250YWwgb2Zmc2V0LCBpbiBwaXhlbHMsIGJldHdlZW4gdGhlIHRleHQgbGFiZWwgYW5kIGl0cyBhbmNob3IgcG9pbnQuIFRoZSBvZmZzZXQgaXMgYXBwbGllZCBhZnRlciByb3RhdGlvbiBieSB0aGUgYW5nbGUgcHJvcGVydHkuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJkeVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHZlcnRpY2FsIG9mZnNldCwgaW4gcGl4ZWxzLCBiZXR3ZWVuIHRoZSB0ZXh0IGxhYmVsIGFuZCBpdHMgYW5jaG9yIHBvaW50LiBUaGUgb2Zmc2V0IGlzIGFwcGxpZWQgYWZ0ZXIgcm90YXRpb24gYnkgdGhlIGFuZ2xlIHByb3BlcnR5LlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicmFkaXVzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJQb2xhciBjb29yZGluYXRlIHJhZGlhbCBvZmZzZXQsIGluIHBpeGVscywgb2YgdGhlIHRleHQgbGFiZWwgZnJvbSB0aGUgb3JpZ2luIGRldGVybWluZWQgYnkgdGhlIHggYW5kIHkgcHJvcGVydGllcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRoZXRhXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJQb2xhciBjb29yZGluYXRlIGFuZ2xlLCBpbiByYWRpYW5zLCBvZiB0aGUgdGV4dCBsYWJlbCBmcm9tIHRoZSBvcmlnaW4gZGV0ZXJtaW5lZCBieSB0aGUgeCBhbmQgeSBwcm9wZXJ0aWVzLiBWYWx1ZXMgZm9yIHRoZXRhIGZvbGxvdyB0aGUgc2FtZSBjb252ZW50aW9uIG9mIGFyYyBtYXJrIHN0YXJ0QW5nbGUgYW5kIGVuZEFuZ2xlIHByb3BlcnRpZXM6IGFuZ2xlcyBhcmUgbWVhc3VyZWQgaW4gcmFkaWFucywgd2l0aCAwIGluZGljYXRpbmcgXFxcIm5vcnRoXFxcIi5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImZvbnRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSB0eXBlZmFjZSB0byBzZXQgdGhlIHRleHQgaW4gKGUuZy4sIEhlbHZldGljYSBOZXVlKS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImZvbnRTaXplXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzaXplLCBpbiBwaXhlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmb250U3R5bGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Gb250U3R5bGVcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzdHlsZSAoZS5nLiwgaXRhbGljKS5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmb250V2VpZ2h0XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRm9udFdlaWdodFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb250IHdlaWdodCAoZS5nLiwgYm9sZCkuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZm9ybWF0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9ybWF0dGluZyBwYXR0ZXJuIGZvciB0ZXh0IHZhbHVlLiBJZiBub3QgZGVmaW5lZCwgdGhpcyB3aWxsIGJlIGRldGVybWluZWQgYXV0b21hdGljYWxseS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInNob3J0VGltZUxhYmVsc1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2hldGhlciBtb250aCBuYW1lcyBhbmQgd2Vla2RheSBuYW1lcyBzaG91bGQgYmUgYWJicmV2aWF0ZWQuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGV4dFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiUGxhY2Vob2xkZXIgVGV4dFwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYXBwbHlDb2xvclRvQmFja2dyb3VuZFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQXBwbHkgY29sb3IgZmllbGQgdG8gYmFja2dyb3VuZCBjb2xvciBpbnN0ZWFkIG9mIHRoZSB0ZXh0LlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJTdGFja09mZnNldFwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwiemVyb1wiLFxyXG4gICAgICAgIFwiY2VudGVyXCIsXHJcbiAgICAgICAgXCJub3JtYWxpemVcIixcclxuICAgICAgICBcIm5vbmVcIlxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJPcmllbnRcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcImhvcml6b250YWxcIixcclxuICAgICAgICBcInZlcnRpY2FsXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiSW50ZXJwb2xhdGVcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcImxpbmVhclwiLFxyXG4gICAgICAgIFwibGluZWFyLWNsb3NlZFwiLFxyXG4gICAgICAgIFwic3RlcFwiLFxyXG4gICAgICAgIFwic3RlcC1iZWZvcmVcIixcclxuICAgICAgICBcInN0ZXAtYWZ0ZXJcIixcclxuICAgICAgICBcImJhc2lzXCIsXHJcbiAgICAgICAgXCJiYXNpcy1vcGVuXCIsXHJcbiAgICAgICAgXCJiYXNpcy1jbG9zZWRcIixcclxuICAgICAgICBcImNhcmRpbmFsXCIsXHJcbiAgICAgICAgXCJjYXJkaW5hbC1vcGVuXCIsXHJcbiAgICAgICAgXCJjYXJkaW5hbC1jbG9zZWRcIixcclxuICAgICAgICBcImJ1bmRsZVwiLFxyXG4gICAgICAgIFwibW9ub3RvbmVcIlxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJTaGFwZVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwiY2lyY2xlXCIsXHJcbiAgICAgICAgXCJzcXVhcmVcIixcclxuICAgICAgICBcImNyb3NzXCIsXHJcbiAgICAgICAgXCJkaWFtb25kXCIsXHJcbiAgICAgICAgXCJ0cmlhbmdsZS11cFwiLFxyXG4gICAgICAgIFwidHJpYW5nbGUtZG93blwiXHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICBcIkhvcml6b250YWxBbGlnblwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwibGVmdFwiLFxyXG4gICAgICAgIFwicmlnaHRcIixcclxuICAgICAgICBcImNlbnRlclwiXHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICBcIlZlcnRpY2FsQWxpZ25cIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcInRvcFwiLFxyXG4gICAgICAgIFwibWlkZGxlXCIsXHJcbiAgICAgICAgXCJib3R0b21cIlxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJGb250U3R5bGVcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcclxuICAgICAgXCJlbnVtXCI6IFtcclxuICAgICAgICBcIm5vcm1hbFwiLFxyXG4gICAgICAgIFwiaXRhbGljXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiRm9udFdlaWdodFwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwibm9ybWFsXCIsXHJcbiAgICAgICAgXCJib2xkXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiT3ZlcmxheUNvbmZpZ1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxyXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xyXG4gICAgICAgIFwibGluZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2hldGhlciB0byBvdmVybGF5IGxpbmUgd2l0aCBwb2ludC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJhcmVhXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQXJlYU92ZXJsYXlcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUeXBlIG9mIG92ZXJsYXkgZm9yIGFyZWEgbWFyayAobGluZSBvciBsaW5lcG9pbnQpXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicG9pbnRTdHlsZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL01hcmtDb25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IHN0eWxlIGZvciB0aGUgb3ZlcmxheWVkIHBvaW50LlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxpbmVTdHlsZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL01hcmtDb25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IHN0eWxlIGZvciB0aGUgb3ZlcmxheWVkIHBvaW50LlwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJBcmVhT3ZlcmxheVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxyXG4gICAgICBcImVudW1cIjogW1xyXG4gICAgICAgIFwibGluZVwiLFxyXG4gICAgICAgIFwibGluZXBvaW50XCIsXHJcbiAgICAgICAgXCJub25lXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiU2NhbGVDb25maWdcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcInJvdW5kXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJJZiB0cnVlLCByb3VuZHMgbnVtZXJpYyBvdXRwdXQgdmFsdWVzIHRvIGludGVnZXJzLlxcblxcblRoaXMgY2FuIGJlIGhlbHBmdWwgZm9yIHNuYXBwaW5nIHRvIHRoZSBwaXhlbCBncmlkLlxcblxcbihPbmx5IGF2YWlsYWJsZSBmb3IgYHhgLCBgeWAsIGBzaXplYCwgYHJvd2AsIGFuZCBgY29sdW1uYCBzY2FsZXMuKVwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRleHRCYW5kV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgYmFuZCB3aWR0aCBmb3IgYHhgIG9yZGluYWwgc2NhbGUgd2hlbiBpcyBtYXJrIGlzIGB0ZXh0YC5cIixcclxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYmFuZFNpemVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgYmFuZCBzaXplIGZvciAoMSkgYHlgIG9yZGluYWwgc2NhbGUsXFxuXFxuYW5kICgyKSBgeGAgb3JkaW5hbCBzY2FsZSB3aGVuIHRoZSBtYXJrIGlzIG5vdCBgdGV4dGAuXCIsXHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm9wYWNpdHlcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIG9wYWNpdHkuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInBhZGRpbmdcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcGFkZGluZyBmb3IgYHhgIGFuZCBgeWAgb3JkaW5hbCBzY2FsZXMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ1c2VSYXdEb21haW5cIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlVzZXMgdGhlIHNvdXJjZSBkYXRhIHJhbmdlIGFzIHNjYWxlIGRvbWFpbiBpbnN0ZWFkIG9mIGFnZ3JlZ2F0ZWQgZGF0YSBmb3IgYWdncmVnYXRlIGF4aXMuXFxuXFxuVGhpcyBwcm9wZXJ0eSBvbmx5IHdvcmtzIHdpdGggYWdncmVnYXRlIGZ1bmN0aW9ucyB0aGF0IHByb2R1Y2UgdmFsdWVzIHdpdGhpbiB0aGUgcmF3IGRhdGEgZG9tYWluIChgXFxcIm1lYW5cXFwiYCwgYFxcXCJhdmVyYWdlXFxcImAsIGBcXFwic3RkZXZcXFwiYCwgYFxcXCJzdGRldnBcXFwiYCwgYFxcXCJtZWRpYW5cXFwiYCwgYFxcXCJxMVxcXCJgLCBgXFxcInEzXFxcImAsIGBcXFwibWluXFxcImAsIGBcXFwibWF4XFxcImApLiBGb3Igb3RoZXIgYWdncmVnYXRpb25zIHRoYXQgcHJvZHVjZSB2YWx1ZXMgb3V0c2lkZSBvZiB0aGUgcmF3IGRhdGEgZG9tYWluIChlLmcuIGBcXFwiY291bnRcXFwiYCwgYFxcXCJzdW1cXFwiYCksIHRoaXMgcHJvcGVydHkgaXMgaWdub3JlZC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJub21pbmFsQ29sb3JSYW5nZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCByYW5nZSBmb3Igbm9taW5hbCBjb2xvciBzY2FsZVwiLFxyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInNlcXVlbnRpYWxDb2xvclJhbmdlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IHJhbmdlIGZvciBvcmRpbmFsIC8gY29udGludW91cyBjb2xvciBzY2FsZVwiLFxyXG4gICAgICAgICAgXCJvbmVPZlwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInNoYXBlUmFuZ2VcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIHNoYXBlXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYmFyU2l6ZVJhbmdlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IHJhbmdlIGZvciBiYXIgc2l6ZSBzY2FsZVwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJmb250U2l6ZVJhbmdlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJEZWZhdWx0IHJhbmdlIGZvciBmb250IHNpemUgc2NhbGVcIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicnVsZVNpemVSYW5nZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiRGVmYXVsdCByYW5nZSBmb3IgcnVsZSBzdHJva2Ugd2lkdGhzXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tTaXplUmFuZ2VcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIHRpY2sgc3BhbnNcIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicG9pbnRTaXplUmFuZ2VcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkRlZmF1bHQgcmFuZ2UgZm9yIGJhciBzaXplIHNjYWxlXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgXCJpdGVtc1wiOiB7XHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJBeGlzQ29uZmlnXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJheGlzV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldpZHRoIG9mIHRoZSBheGlzIGxpbmVcIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxheWVyXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBIHN0cmluZyBpbmRpY2F0aW5nIGlmIHRoZSBheGlzIChhbmQgYW55IGdyaWRsaW5lcykgc2hvdWxkIGJlIHBsYWNlZCBhYm92ZSBvciBiZWxvdyB0aGUgZGF0YSBtYXJrcy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm9mZnNldFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCwgaW4gcGl4ZWxzLCBieSB3aGljaCB0byBkaXNwbGFjZSB0aGUgYXhpcyBmcm9tIHRoZSBlZGdlIG9mIHRoZSBlbmNsb3NpbmcgZ3JvdXAgb3IgZGF0YSByZWN0YW5nbGUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJheGlzQ29sb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIGF4aXMgbGluZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImdyaWRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgZmxhZyBpbmRpY2F0ZSBpZiBncmlkbGluZXMgc2hvdWxkIGJlIGNyZWF0ZWQgaW4gYWRkaXRpb24gdG8gdGlja3MuIElmIGBncmlkYCBpcyB1bnNwZWNpZmllZCwgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYHRydWVgIGZvciBST1cgYW5kIENPTC4gRm9yIFggYW5kIFksIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGB0cnVlYCBmb3IgcXVhbnRpdGF0aXZlIGFuZCB0aW1lIGZpZWxkcyBhbmQgYGZhbHNlYCBvdGhlcndpc2UuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZ3JpZENvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb2xvciBvZiBncmlkbGluZXMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmlkRGFzaFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCAoaW4gcGl4ZWxzKSBpbnRvIHdoaWNoIHRvIGJlZ2luIGRyYXdpbmcgd2l0aCB0aGUgZ3JpZCBkYXNoIGFycmF5LlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmlkT3BhY2l0eVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHN0cm9rZSBvcGFjaXR5IG9mIGdyaWQgKHZhbHVlIGJldHdlZW4gWzAsMV0pXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmlkV2lkdGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBncmlkIHdpZHRoLCBpbiBwaXhlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbHNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkVuYWJsZSBvciBkaXNhYmxlIGxhYmVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbEFuZ2xlXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcm90YXRpb24gYW5nbGUgb2YgdGhlIGF4aXMgbGFiZWxzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibGFiZWxBbGlnblwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGV4dCBhbGlnbm1lbnQgZm9yIHRoZSBMYWJlbC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxhYmVsQmFzZWxpbmVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRleHQgYmFzZWxpbmUgZm9yIHRoZSBsYWJlbC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxhYmVsTWF4TGVuZ3RoXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUcnVuY2F0ZSBsYWJlbHMgdGhhdCBhcmUgdG9vIGxvbmcuXCIsXHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMSxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInNob3J0VGltZUxhYmVsc1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiV2hldGhlciBtb250aCBhbmQgZGF5IG5hbWVzIHNob3VsZCBiZSBhYmJyZXZpYXRlZC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzdWJkaXZpZGVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIklmIHByb3ZpZGVkLCBzZXRzIHRoZSBudW1iZXIgb2YgbWlub3IgdGlja3MgYmV0d2VlbiBtYWpvciB0aWNrcyAodGhlIHZhbHVlIDkgcmVzdWx0cyBpbiBkZWNpbWFsIHN1YmRpdmlzaW9uKS4gT25seSBhcHBsaWNhYmxlIGZvciBheGVzIHZpc3VhbGl6aW5nIHF1YW50aXRhdGl2ZSBzY2FsZXMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrc1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBkZXNpcmVkIG51bWJlciBvZiB0aWNrcywgZm9yIGF4ZXMgdmlzdWFsaXppbmcgcXVhbnRpdGF0aXZlIHNjYWxlcy4gVGhlIHJlc3VsdGluZyBudW1iZXIgbWF5IGJlIGRpZmZlcmVudCBzbyB0aGF0IHZhbHVlcyBhcmUgXFxcIm5pY2VcXFwiIChtdWx0aXBsZXMgb2YgMiwgNSwgMTApIGFuZCBsaWUgd2l0aGluIHRoZSB1bmRlcmx5aW5nIHNjYWxlJ3MgcmFuZ2UuXCIsXHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tDb2xvclwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBheGlzJ3MgdGljay5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tMYWJlbENvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgY29sb3Igb2YgdGhlIHRpY2sgbGFiZWwsIGNhbiBiZSBpbiBoZXggY29sb3IgY29kZSBvciByZWd1bGFyIGNvbG9yIG5hbWUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrTGFiZWxGb250XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBvZiB0aGUgdGljayBsYWJlbC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tMYWJlbEZvbnRTaXplXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBzaXplIG9mIGxhYmVsLCBpbiBwaXhlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrUGFkZGluZ1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHBhZGRpbmcsIGluIHBpeGVscywgYmV0d2VlbiB0aWNrcyBhbmQgdGV4dCBsYWJlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrU2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNpemUsIGluIHBpeGVscywgb2YgbWFqb3IsIG1pbm9yIGFuZCBlbmQgdGlja3MuXCIsXHJcbiAgICAgICAgICBcIm1pbmltdW1cIjogMCxcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpY2tTaXplTWFqb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzaXplLCBpbiBwaXhlbHMsIG9mIG1ham9yIHRpY2tzLlwiLFxyXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aWNrU2l6ZU1pbm9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSwgaW4gcGl4ZWxzLCBvZiBtaW5vciB0aWNrcy5cIixcclxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGlja1NpemVFbmRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzaXplLCBpbiBwaXhlbHMsIG9mIGVuZCB0aWNrcy5cIixcclxuICAgICAgICAgIFwibWluaW11bVwiOiAwLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGlja1dpZHRoXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgd2lkdGgsIGluIHBpeGVscywgb2YgdGlja3MuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZUNvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb2xvciBvZiB0aGUgdGl0bGUsIGNhbiBiZSBpbiBoZXggY29sb3IgY29kZSBvciByZWd1bGFyIGNvbG9yIG5hbWUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZUZvbnRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZvbnQgb2YgdGhlIHRpdGxlLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGl0bGVGb250U2l6ZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2l6ZSBvZiB0aGUgdGl0bGUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZUZvbnRXZWlnaHRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldlaWdodCBvZiB0aGUgdGl0bGUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0aXRsZU9mZnNldFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSB0aXRsZSBvZmZzZXQgdmFsdWUgZm9yIHRoZSBheGlzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidGl0bGVNYXhMZW5ndGhcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk1heCBsZW5ndGggZm9yIGF4aXMgdGl0bGUgaWYgdGhlIHRpdGxlIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIGZyb20gdGhlIGZpZWxkJ3MgZGVzY3JpcHRpb24uIEJ5IGRlZmF1bHQsIHRoaXMgaXMgYXV0b21hdGljYWxseSBiYXNlZCBvbiBjZWxsIHNpemUgYW5kIGNoYXJhY3RlcldpZHRoIHByb3BlcnR5LlwiLFxyXG4gICAgICAgICAgXCJtaW5pbXVtXCI6IDAsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJjaGFyYWN0ZXJXaWR0aFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ2hhcmFjdGVyIHdpZHRoIGZvciBhdXRvbWF0aWNhbGx5IGRldGVybWluaW5nIHRpdGxlIG1heCBsZW5ndGguXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPcHRpb25hbCBtYXJrIHByb3BlcnR5IGRlZmluaXRpb25zIGZvciBjdXN0b20gYXhpcyBzdHlsaW5nLlwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJMZWdlbmRDb25maWdcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcIm9yaWVudFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9yaWVudGF0aW9uIG9mIHRoZSBsZWdlbmQuIE9uZSBvZiBcXFwibGVmdFxcXCIgb3IgXFxcInJpZ2h0XFxcIi4gVGhpcyBkZXRlcm1pbmVzIGhvdyB0aGUgbGVnZW5kIGlzIHBvc2l0aW9uZWQgd2l0aGluIHRoZSBzY2VuZS4gVGhlIGRlZmF1bHQgaXMgXFxcInJpZ2h0XFxcIi5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm9mZnNldFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIG9mZnNldCwgaW4gcGl4ZWxzLCBieSB3aGljaCB0byBkaXNwbGFjZSB0aGUgbGVnZW5kIGZyb20gdGhlIGVkZ2Ugb2YgdGhlIGVuY2xvc2luZyBncm91cCBvciBkYXRhIHJlY3RhbmdsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInBhZGRpbmdcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBwYWRkaW5nLCBpbiBwaXhlbHMsIGJldHdlZW4gdGhlIGxlbmdlbmQgYW5kIGF4aXMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJtYXJnaW5cIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBtYXJnaW4gYXJvdW5kIHRoZSBsZWdlbmQsIGluIHBpeGVsc1wiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZ3JhZGllbnRTdHJva2VDb2xvclwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBncmFkaWVudCBzdHJva2UsIGNhbiBiZSBpbiBoZXggY29sb3IgY29kZSBvciByZWd1bGFyIGNvbG9yIG5hbWUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmFkaWVudFN0cm9rZVdpZHRoXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgd2lkdGggb2YgdGhlIGdyYWRpZW50IHN0cm9rZSwgaW4gcGl4ZWxzLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZ3JhZGllbnRIZWlnaHRcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBoZWlnaHQgb2YgdGhlIGdyYWRpZW50LCBpbiBwaXhlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJncmFkaWVudFdpZHRoXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgd2lkdGggb2YgdGhlIGdyYWRpZW50LCBpbiBwaXhlbHMuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbEFsaWduXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgYWxpZ25tZW50IG9mIHRoZSBsZWdlbmQgbGFiZWwsIGNhbiBiZSBsZWZ0LCBtaWRkbGUgb3IgcmlnaHQuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbEJhc2VsaW5lXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgcG9zaXRpb24gb2YgdGhlIGJhc2VsaW5lIG9mIGxlZ2VuZCBsYWJlbCwgY2FuIGJlIHRvcCwgbWlkZGxlIG9yIGJvdHRvbS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxhYmVsQ29sb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBjb2xvciBvZiB0aGUgbGVnZW5kIGxhYmVsLCBjYW4gYmUgaW4gaGV4IGNvbG9yIGNvZGUgb3IgcmVndWxhciBjb2xvciBuYW1lLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwibGFiZWxGb250XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgZm9udCBvZiB0aGUgbGVuZ2VuZCBsYWJlbC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxhYmVsRm9udFNpemVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb250IHNpemUgb2YgbGVuZ2VuZCBsYWJsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImxhYmVsT2Zmc2V0XCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgb2Zmc2V0IG9mIHRoZSBsZWdlbmQgbGFiZWwuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzaG9ydFRpbWVMYWJlbHNcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIldoZXRoZXIgbW9udGggbmFtZXMgYW5kIHdlZWtkYXkgbmFtZXMgc2hvdWxkIGJlIGFiYnJldmlhdGVkLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN5bWJvbENvbG9yXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgY29sb3Igb2YgdGhlIGxlZ2VuZCBzeW1ib2wsXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzeW1ib2xTaGFwZVwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIHNoYXBlIG9mIHRoZSBsZWdlbmQgc3ltYm9sLCBjYW4gYmUgdGhlICdjaXJjbGUnLCAnc3F1YXJlJywgJ2Nyb3NzJywgJ2RpYW1vbmQnLFxcblxcbid0cmlhbmdsZS11cCcsICd0cmlhbmdsZS1kb3duJywgb3IgZWxzZSBhIGN1c3RvbSBTVkcgcGF0aCBzdHJpbmcuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJzeW1ib2xTaXplXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgc2l6ZSBvZiB0aGUgbGVuZ2VuZCBzeW1ib2wsIGluIHBpeGVscy5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInN5bWJvbFN0cm9rZVdpZHRoXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUaGUgd2lkdGggb2YgdGhlIHN5bWJvbCdzIHN0cm9rZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlQ29sb3JcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9wdGlvbmFsIG1hcmsgcHJvcGVydHkgZGVmaW5pdGlvbnMgZm9yIGN1c3RvbSBsZWdlbmQgc3R5bGluZy5cXG5cXG5UaGUgY29sb3Igb2YgdGhlIGxlZ2VuZCB0aXRsZSwgY2FuIGJlIGluIGhleCBjb2xvciBjb2RlIG9yIHJlZ3VsYXIgY29sb3IgbmFtZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlRm9udFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgb2YgdGhlIGxlZ2VuZCB0aXRsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlRm9udFNpemVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBmb250IHNpemUgb2YgdGhlIGxlZ2VuZCB0aXRsZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInRpdGxlRm9udFdlaWdodFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVGhlIGZvbnQgd2VpZ2h0IG9mIHRoZSBsZWdlbmQgdGl0bGUuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPcHRpb25hbCBtYXJrIHByb3BlcnR5IGRlZmluaXRpb25zIGZvciBjdXN0b20gbGVnZW5kIHN0eWxpbmcuXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIkZhY2V0Q29uZmlnXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJzY2FsZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZhY2V0U2NhbGVDb25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGYWNldCBTY2FsZSBDb25maWdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJheGlzXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQXhpc0NvbmZpZ1wiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZhY2V0IEF4aXMgQ29uZmlnXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZ3JpZFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZhY2V0R3JpZENvbmZpZ1wiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZhY2V0IEdyaWQgQ29uZmlnXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY2VsbFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0NlbGxDb25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJGYWNldCBDZWxsIENvbmZpZ1wiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJGYWNldFNjYWxlQ29uZmlnXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJyb3VuZFwiOiB7XHJcbiAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiRmFjZXRHcmlkQ29uZmlnXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJjb2xvclwiOiB7XHJcbiAgICAgICAgICBcImZvcm1hdFwiOiBcImNvbG9yXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJvcGFjaXR5XCI6IHtcclxuICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm9mZnNldFwiOiB7XHJcbiAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiRmFjZXRTcGVjXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJmYWNldFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZhY2V0XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic3BlY1wiOiB7XHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvTGF5ZXJTcGVjXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVW5pdFNwZWNcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm5hbWVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk5hbWUgb2YgdGhlIHZpc3VhbGl6YXRpb24gZm9yIGxhdGVyIHJlZmVyZW5jZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImRlc2NyaXB0aW9uXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvcHRpb25hbCBkZXNjcmlwdGlvbiBvZiB0aGlzIG1hcmsgZm9yIGNvbW1lbnRpbmcgcHVycG9zZS5cXG5cXG5UaGlzIHByb3BlcnR5IGhhcyBubyBlZmZlY3Qgb24gdGhlIG91dHB1dCB2aXN1YWxpemF0aW9uLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZGF0YVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0RhdGFcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgZGF0YSBzb3VyY2VcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0cmFuc2Zvcm1cIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UcmFuc2Zvcm1cIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvYmplY3QgZGVzY3JpYmluZyBmaWx0ZXIgYW5kIG5ldyBmaWVsZCBjYWxjdWxhdGlvbi5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJjb25maWdcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Db25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb25maWd1cmF0aW9uIG9iamVjdFwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBcInJlcXVpcmVkXCI6IFtcclxuICAgICAgICBcImZhY2V0XCIsXHJcbiAgICAgICAgXCJzcGVjXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiRmFjZXRcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcInJvd1wiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImNvbHVtblwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJMYXllclNwZWNcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcclxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICBcImxheWVyc1wiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiVW5pdCBzcGVjcyB0aGF0IHdpbGwgYmUgbGF5ZXJlZC5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Vbml0U3BlY1wiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIm5hbWVcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk5hbWUgb2YgdGhlIHZpc3VhbGl6YXRpb24gZm9yIGxhdGVyIHJlZmVyZW5jZS5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImRlc2NyaXB0aW9uXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvcHRpb25hbCBkZXNjcmlwdGlvbiBvZiB0aGlzIG1hcmsgZm9yIGNvbW1lbnRpbmcgcHVycG9zZS5cXG5cXG5UaGlzIHByb3BlcnR5IGhhcyBubyBlZmZlY3Qgb24gdGhlIG91dHB1dCB2aXN1YWxpemF0aW9uLlwiLFxyXG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZGF0YVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0RhdGFcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgZGF0YSBzb3VyY2VcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0cmFuc2Zvcm1cIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9UcmFuc2Zvcm1cIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBbiBvYmplY3QgZGVzY3JpYmluZyBmaWx0ZXIgYW5kIG5ldyBmaWVsZCBjYWxjdWxhdGlvbi5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJjb25maWdcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9Db25maWdcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb25maWd1cmF0aW9uIG9iamVjdFwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBcInJlcXVpcmVkXCI6IFtcclxuICAgICAgICBcImxheWVyc1wiXHJcbiAgICAgIF1cclxuICAgIH0sXHJcbiAgICBcIlVuaXRTcGVjXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJtYXJrXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvTWFya1wiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBtYXJrIHR5cGUuXFxuXFxuT25lIG9mIGBcXFwiYmFyXFxcImAsIGBcXFwiY2lyY2xlXFxcImAsIGBcXFwic3F1YXJlXFxcImAsIGBcXFwidGlja1xcXCJgLCBgXFxcImxpbmVcXFwiYCxcXG5cXG5gXFxcImFyZWFcXFwiYCwgYFxcXCJwb2ludFxcXCJgLCBgXFxcInJ1bGVcXFwiYCwgYW5kIGBcXFwidGV4dFxcXCJgLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImVuY29kaW5nXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVW5pdEVuY29kaW5nXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQSBrZXktdmFsdWUgbWFwcGluZyBiZXR3ZWVuIGVuY29kaW5nIGNoYW5uZWxzIGFuZCBkZWZpbml0aW9uIG9mIGZpZWxkcy5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJuYW1lXCI6IHtcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJOYW1lIG9mIHRoZSB2aXN1YWxpemF0aW9uIGZvciBsYXRlciByZWZlcmVuY2UuXCIsXHJcbiAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb3B0aW9uYWwgZGVzY3JpcHRpb24gb2YgdGhpcyBtYXJrIGZvciBjb21tZW50aW5nIHB1cnBvc2UuXFxuXFxuVGhpcyBwcm9wZXJ0eSBoYXMgbm8gZWZmZWN0IG9uIHRoZSBvdXRwdXQgdmlzdWFsaXphdGlvbi5cIixcclxuICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImRhdGFcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9EYXRhXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGRhdGEgc291cmNlXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidHJhbnNmb3JtXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvVHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQW4gb2JqZWN0IGRlc2NyaWJpbmcgZmlsdGVyIGFuZCBuZXcgZmllbGQgY2FsY3VsYXRpb24uXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY29uZmlnXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ29uZmlnXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ29uZmlndXJhdGlvbiBvYmplY3RcIlxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgXCJyZXF1aXJlZFwiOiBbXHJcbiAgICAgICAgXCJtYXJrXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiVW5pdEVuY29kaW5nXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXHJcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XHJcbiAgICAgICAgXCJ4XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvUG9zaXRpb25DaGFubmVsRGVmXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiWCBjb29yZGluYXRlcyBmb3IgYHBvaW50YCwgYGNpcmNsZWAsIGBzcXVhcmVgLFxcblxcbmBsaW5lYCwgYHJ1bGVgLCBgdGV4dGAsIGFuZCBgdGlja2BcXG5cXG4ob3IgdG8gd2lkdGggYW5kIGhlaWdodCBmb3IgYGJhcmAgYW5kIGBhcmVhYCBtYXJrcykuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwieVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlkgY29vcmRpbmF0ZXMgZm9yIGBwb2ludGAsIGBjaXJjbGVgLCBgc3F1YXJlYCxcXG5cXG5gbGluZWAsIGBydWxlYCwgYHRleHRgLCBhbmQgYHRpY2tgXFxuXFxuKG9yIHRvIHdpZHRoIGFuZCBoZWlnaHQgZm9yIGBiYXJgIGFuZCBgYXJlYWAgbWFya3MpLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIngyXCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvUG9zaXRpb25DaGFubmVsRGVmXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiWDIgY29vcmRpbmF0ZXMgZm9yIHJhbmdlZCBgYmFyYCwgYHJ1bGVgLCBgYXJlYWBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ5MlwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL1Bvc2l0aW9uQ2hhbm5lbERlZlwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlkyIGNvb3JkaW5hdGVzIGZvciByYW5nZWQgYGJhcmAsIGBydWxlYCwgYGFyZWFgXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY29sb3JcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DaGFubmVsRGVmV2l0aExlZ2VuZFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkNvbG9yIG9mIHRoZSBtYXJrcyDigJMgZWl0aGVyIGZpbGwgb3Igc3Ryb2tlIGNvbG9yIGJhc2VkIG9uIG1hcmsgdHlwZS5cXG5cXG4oQnkgZGVmYXVsdCwgZmlsbCBjb2xvciBmb3IgYGFyZWFgLCBgYmFyYCwgYHRpY2tgLCBgdGV4dGAsIGBjaXJjbGVgLCBhbmQgYHNxdWFyZWAgL1xcblxcbnN0cm9rZSBjb2xvciBmb3IgYGxpbmVgIGFuZCBgcG9pbnRgLilcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJvcGFjaXR5XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvQ2hhbm5lbERlZldpdGhMZWdlbmRcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJPcGFjaXR5IG9mIHRoZSBtYXJrcyDigJMgZWl0aGVyIGNhbiBiZSBhIHZhbHVlIG9yIGluIGEgcmFuZ2UuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2l6ZVwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0NoYW5uZWxEZWZXaXRoTGVnZW5kXCIsXHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2l6ZSBvZiB0aGUgbWFyay5cXG5cXG4tIEZvciBgcG9pbnRgLCBgc3F1YXJlYCBhbmQgYGNpcmNsZWBcXG5cXG7igJMgdGhlIHN5bWJvbCBzaXplLCBvciBwaXhlbCBhcmVhIG9mIHRoZSBtYXJrLlxcblxcbi0gRm9yIGBiYXJgIGFuZCBgdGlja2Ag4oCTIHRoZSBiYXIgYW5kIHRpY2sncyBzaXplLlxcblxcbi0gRm9yIGB0ZXh0YCDigJMgdGhlIHRleHQncyBmb250IHNpemUuXFxuXFxuLSBTaXplIGlzIGN1cnJlbnRseSB1bnN1cHBvcnRlZCBmb3IgYGxpbmVgIGFuZCBgYXJlYWAuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwic2hhcGVcIjoge1xyXG4gICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9DaGFubmVsRGVmV2l0aExlZ2VuZFwiLFxyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBzeW1ib2wncyBzaGFwZSAob25seSBmb3IgYHBvaW50YCBtYXJrcykuIFRoZSBzdXBwb3J0ZWQgdmFsdWVzIGFyZVxcblxcbmBcXFwiY2lyY2xlXFxcImAgKGRlZmF1bHQpLCBgXFxcInNxdWFyZVxcXCJgLCBgXFxcImNyb3NzXFxcImAsIGBcXFwiZGlhbW9uZFxcXCJgLCBgXFxcInRyaWFuZ2xlLXVwXFxcImAsXFxuXFxub3IgYFxcXCJ0cmlhbmdsZS1kb3duXFxcImAsIG9yIGVsc2UgYSBjdXN0b20gU1ZHIHBhdGggc3RyaW5nLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImRldGFpbFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQWRkaXRpb25hbCBsZXZlbHMgb2YgZGV0YWlsIGZvciBncm91cGluZyBkYXRhIGluIGFnZ3JlZ2F0ZSB2aWV3cyBhbmRcXG5cXG5pbiBsaW5lIGFuZCBhcmVhIG1hcmtzIHdpdGhvdXQgbWFwcGluZyBkYXRhIHRvIGEgc3BlY2lmaWMgdmlzdWFsIGNoYW5uZWwuXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmllbGREZWZcIixcclxuICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiSW50ZXJmYWNlIGZvciBhbnkga2luZCBvZiBGaWVsZERlZjtcXG5cXG5Gb3Igc2ltcGxpY2l0eSwgd2UgZG8gbm90IGRlY2xhcmUgbXVsdGlwbGUgaW50ZXJmYWNlcyBvZiBGaWVsZERlZiBsaWtlXFxuXFxud2UgZG8gZm9yIEpTT04gc2NoZW1hLlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgIFwiaXRlbXNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9GaWVsZERlZlwiLFxyXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkludGVyZmFjZSBmb3IgYW55IGtpbmQgb2YgRmllbGREZWY7XFxuXFxuRm9yIHNpbXBsaWNpdHksIHdlIGRvIG5vdCBkZWNsYXJlIG11bHRpcGxlIGludGVyZmFjZXMgb2YgRmllbGREZWYgbGlrZVxcblxcbndlIGRvIGZvciBKU09OIHNjaGVtYS5cIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ0ZXh0XCI6IHtcclxuICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvRmllbGREZWZcIixcclxuICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJUZXh0IG9mIHRoZSBgdGV4dGAgbWFyay5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJsYWJlbFwiOiB7XHJcbiAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL0ZpZWxkRGVmXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicGF0aFwiOiB7XHJcbiAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiT3JkZXIgb2YgZGF0YSBwb2ludHMgaW4gbGluZSBtYXJrcy5cIixcclxuICAgICAgICAgIFwib25lT2ZcIjogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9PcmRlckNoYW5uZWxEZWZcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICBcIml0ZW1zXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwib3JkZXJcIjoge1xyXG4gICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkxheWVyIG9yZGVyIGZvciBub24tc3RhY2tlZCBtYXJrcywgb3Igc3RhY2sgb3JkZXIgZm9yIHN0YWNrZWQgbWFya3MuXCIsXHJcbiAgICAgICAgICBcIm9uZU9mXCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvT3JkZXJDaGFubmVsRGVmXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgXCJpdGVtc1wiOiB7XHJcbiAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL09yZGVyQ2hhbm5lbERlZlwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBcIiRzY2hlbWFcIjogXCJodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA0L3NjaGVtYSNcIlxyXG59OyIsIid1c2Ugc3RyaWN0JztcclxuLyogZ2xvYmFscyB3aW5kb3csIGFuZ3VsYXIgKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJywgW1xyXG4gICAgJ0xvY2FsU3RvcmFnZU1vZHVsZScsXHJcbiAgICAnYW5ndWxhci1nb29nbGUtYW5hbHl0aWNzJyxcclxuICAgICdhbmd1bGFyLXNvcnRhYmxlLXZpZXcnLFxyXG4gICAgJ2FuZ3VsYXItd2Vic3FsJyxcclxuICAgICd1aS1yYW5nZVNsaWRlcidcclxuICBdKVxyXG4gIC5jb25zdGFudCgnXycsIHdpbmRvdy5fKVxyXG4gIC8vIGRhdGFsaWIsIHZlZ2FsaXRlLCB2ZWdhXHJcbiAgLmNvbnN0YW50KCdjcWwnLCB3aW5kb3cuY3FsKVxyXG4gIC5jb25zdGFudCgndmxTY2hlbWEnLCB3aW5kb3cudmxTY2hlbWEpXHJcbiAgLy8gb3RoZXIgbGlicmFyaWVzXHJcbiAgLmNvbnN0YW50KCdqUXVlcnknLCB3aW5kb3cuJClcclxuICAuY29uc3RhbnQoJ1BhcGEnLCB3aW5kb3cuUGFwYSlcclxuICAuY29uc3RhbnQoJ0Jsb2InLCB3aW5kb3cuQmxvYilcclxuICAuY29uc3RhbnQoJ1VSTCcsIHdpbmRvdy5VUkwpXHJcbiAgLmNvbnN0YW50KCdEcm9wJywgd2luZG93LkRyb3ApXHJcbiAgLy8gVXNlIHRoZSBjdXN0b21pemVkIHZlbmRvci9qc29uMy1jb21wYWN0c3RyaW5naWZ5XHJcbiAgLmNvbnN0YW50KCdKU09OMycsIHdpbmRvdy5KU09OMy5ub0NvbmZsaWN0KCkpXHJcbiAgLmNvbnN0YW50KCdBTlknLCAnX19BTllfXycpXHJcbiAgLy8gY29uc3RhbnRzXHJcbiAgLmNvbnN0YW50KCdjb25zdHMnLCB7XHJcbiAgICBhZGRDb3VudDogdHJ1ZSwgLy8gYWRkIGNvdW50IGZpZWxkIHRvIERhdGFzZXQuZGF0YXNjaGVtYVxyXG4gICAgZGVidWc6IHRydWUsXHJcbiAgICB1c2VVcmw6IHRydWUsXHJcbiAgICBsb2dnaW5nOiB0cnVlLFxyXG4gICAgbG9nTGV2ZWw6ICdJTkZPJyxcclxuICAgIGxvZ1ByaW50TGV2ZWw6ICdJTkZPJyxcclxuICAgIGxvZ1RvV2ViU3FsOiBmYWxzZSwgLy8gaW4gdXNlciBzdHVkaWVzLCBzZXQgdGhpcyB0byB0cnVlXHJcbiAgICBoaWRlTW9yZUZuOiB0cnVlLCAvLyBoaWRlIGJlbG93Rm9sZCBmdW5jdGlvbnMgYW5kIFwibW9yZVwiICYgXCJsZXNzXCIgdG9nZ2xlcyBpbiBmdW5jdGlvbnNlbGVjdCBkdXJpbmcgdXNlciBzdHVkaWVzXHJcbiAgICBhcHBJZDogJ3ZsdWknLFxyXG4gICAgLy8gZW1iZWRkZWQgcG9sZXN0YXIgYW5kIHZveWFnZXIgd2l0aCBrbm93biBkYXRhXHJcbiAgICBlbWJlZGRlZERhdGE6IHdpbmRvdy52Z3VpRGF0YSB8fCB1bmRlZmluZWQsXHJcbiAgICBwcmlvcml0eToge1xyXG4gICAgICBib29rbWFyazogMCxcclxuICAgICAgcG9wdXA6IDAsXHJcbiAgICAgIHZpc2xpc3Q6IDEwMDBcclxuICAgIH0sXHJcbiAgICBteXJpYVJlc3Q6ICdodHRwOi8vZWMyLTUyLTEtMzgtMTgyLmNvbXB1dGUtMS5hbWF6b25hd3MuY29tOjg3NTMnLFxyXG4gICAgZGVmYXVsdFRpbWVGbjogJ3llYXInLFxyXG4gICAgd2lsZGNhcmRGbjogdHJ1ZSxcclxuICAgIGhpZGVPcmRpbmFsVHlwZVNlbGVjdDogdHJ1ZVxyXG4gIH0pXHJcbiAgLmNvbmZpZyhmdW5jdGlvbihjcWwpIHtcclxuICAgIGNxbC5jb25maWcuREVGQVVMVF9RVUVSWV9DT05GSUcuY2hhbm5lbHMgPSBbJ3gnLCAneScsICdjb2x1bW4nLCAnc2l6ZScsICdjb2xvciddO1xyXG4gICAgY3FsLmNvbmZpZy5ERUZBVUxUX1FVRVJZX0NPTkZJRy5zdHlsaXplID0gZmFsc2U7XHJcbiAgfSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKFwidmx1aVwiKS5ydW4oW1wiJHRlbXBsYXRlQ2FjaGVcIiwgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHskdGVtcGxhdGVDYWNoZS5wdXQoXCJkYXRhc2V0L2NoYW5nZWxvYWRlZGRhdGFzZXQuaHRtbFwiLFwiPGRpdiBjbGFzcz1cXFwiY2hhbmdlLWxvYWRlZC1kYXRhc2V0XFxcIj48ZGl2IG5nLWlmPVxcXCJ1c2VyRGF0YS5sZW5ndGhcXFwiPjxoMz7lt7LlrprkuYnnmoTmjIfmoIc8L2gzPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgcGxhY2Vob2xkZXI9XFxcIuW/q+mAn+afpeaJvuaMh+agh1xcXCIgbmcta2V5dXA9XFxcIlNlYXJjaENoYW5nZSgkZXZlbnQpXFxcIj48dWw+PGxpIG5nLXNob3c9XFxcImRhdGFzZXQuaGlkZGVuIT1cXCd0cnVlXFwnXFxcIiBuZy1yZXBlYXQ9XFxcImRhdGFzZXQgaW4gdXNlckRhdGEgdHJhY2sgYnkgZGF0YXNldC5pZFxcXCIgbmctY2xhc3M9XFxcIntzZWxlY3RlZDogRGF0YXNldC5jdXJyZW50RGF0YXNldC5pZCA9PT0gZGF0YXNldC5pZH1cXFwiPjxhIGNsYXNzPVxcXCJkYXRhc2V0XFxcIiBuZy1jbGljaz1cXFwic2VsZWN0RGF0YXNldChkYXRhc2V0KVxcXCIgbmctZGlzYWJsZWQ9XFxcIkRhdGFzZXQuY3VycmVudERhdGFzZXQuaWQgPT09IGRhdGFzZXQuaWRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1kYXRhYmFzZVxcXCI+PC9pPiA8c3Ryb25nPnt7ZGF0YXNldC5uYW1lfX08L3N0cm9uZz48L2E+IDxzcGFuIG5nLWlmPVxcXCJkYXRhc2V0LmRlc2NyaXB0aW9uXFxcIj57e2RhdGFzZXQuZGVzY3JpcHRpb259fTwvc3Bhbj4gPHN0cm9uZyBuZy1pZj1cXFwiRGF0YXNldC5jdXJyZW50RGF0YXNldCA9PT0gZGF0YXNldFxcXCI+KOW3sumAieS4rSk8L3N0cm9uZz48L2xpPjwvdWw+PGgzPuivt+eCueWHu+mAieaLqTwvaDM+PC9kaXY+PC9kaXY+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiZGF0YXNldC9kYXRhc2V0bW9kYWwuaHRtbFwiLFwiPG1vZGFsIGlkPVxcXCJkYXRhc2V0LW1vZGFsXFxcIiBtYXgtd2lkdGg9XFxcIjgwMHB4XFxcIj48ZGl2IGNsYXNzPVxcXCJtb2RhbC1oZWFkZXJcXFwiPjxtb2RhbC1jbG9zZS1idXR0b24+PC9tb2RhbC1jbG9zZS1idXR0b24+PGgyPumAieaLqeaMh+aghzwvaDI+PC9kaXY+PGRpdiBjbGFzcz1cXFwibW9kYWwtbWFpblxcXCI+PHRhYnNldD48dGFiIGhlYWRpbmc9XFxcIuWPr+eUqOaMh+agh1xcXCI+PGNoYW5nZS1sb2FkZWQtZGF0YXNldD48L2NoYW5nZS1sb2FkZWQtZGF0YXNldD48L3RhYj48L3RhYnNldD48L2Rpdj48L21vZGFsPlwiKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dChcImRhdGFzZXQvZGF0YXNldHNlbGVjdG9yLmh0bWxcIixcIjxidXR0b24gaWQ9XFxcInNlbGVjdC1kYXRhXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14c1xcXCIgbmctY2xpY2s9XFxcImxvYWREYXRhc2V0KCk7XFxcIj48c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi1jbG91ZC1kb3dubG9hZFxcXCI+PC9zcGFuPumAieaLqeaMh+aghzwvYnV0dG9uPlwiKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dChcImNvbXBvbmVudHMvZWNjaGFubmVsL2VjY2hhbm5lbC5odG1sXCIsXCI8ZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWxcXFwiPnt7IGNoYW5uZWxUaXRsZSB9fTwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiIG5nLW1vZGVsPVxcXCJ0aGlzbW9kYWxcXFwiIGRhdGEtZHJvcD1cXFwiY2FuRHJhZyA9PSBcXCcxXFwnXFxcIiBqcXlvdWktZHJvcHBhYmxlPVxcXCJ7b25Ecm9wOlxcJ0ZpZWxkRHJvcHBlZCgpXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxzcGFuIGNsYXNzPVxcXCJzZWxlY3RlZCBmdWxsLXdpZHRoIGZpZWxkLWluZm9cXFwiIG5nLXNob3c9XFxcImZpZWxkLmZpZWxkXFxcIj48c3BhbiBjbGFzcz1cXFwiaGZsZXggZnVsbC13aWR0aFxcXCI+PHNwYW4gY2xhc3M9XFxcInR5cGUtY2FyZXQgZHJvcC10YXJnZXQgYWN0aXZlXFxcIiBuZy1zaG93PVxcXCJjYW5Ecm9wID09IFxcJzFcXCdcXFwiPjxpIG5nLWlmPVxcXCJkcm9wVHlwZSE9XFwnZmlsdGVyc1xcJ1xcXCIgY2xhc3M9XFxcImZhIGZhLWNhcmV0LWRvd25cXFwiPjwvaT48aSBuZy1pZj1cXFwiZHJvcFR5cGU9PVxcJ2ZpbHRlcnNcXCdcXFwiIGNsYXNzPVxcXCJmYSBmYS1maWx0ZXJcXFwiPjwvaT48L3NwYW4+IDxzcGFuIHRpdGxlPVxcXCJ7eyBmaWVsZC5maWVsZCB9fVxcXCIgY2xhc3M9XFxcImZpZWxkLWluZm8tdGV4dFxcXCI+e3sgZmllbGQuZmllbGQgfX08L3NwYW4+IDxzcGFuIHRpdGxlPVxcXCLorqHnrpfooajovr7lvI/phY3nva5cXFwiIGNsYXNzPVxcXCJjb3VudC1jYXJldCBkcm9wLXRhcmdldCBhY3RpdmVcXFwiIG5nLXNob3c9XFxcImZpZWxkLmFnZ3JlZ2F0ZSA9PSBcXCdjb3VudFxcJ1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWNhbGN1bGF0b3JcXFwiIHN0eWxlPVxcXCJjdXJzb3I6cG9pbnRlcjtcXFwiPjwvaT4mbmJzcDs8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJuby1zaHJpbmsgcmVtb3ZlXFxcIj48YSBjbGFzcz1cXFwicmVtb3ZlLWZpZWxkXFxcIiBuZy1jbGljaz1cXFwicmVtb3ZlQWN0aW9uKClcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10aW1lc1xcXCI+PC9pPjwvYT48L3NwYW4+PC9zcGFuPjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIiBuZy1zaG93PVxcXCIhZmllbGQuZmllbGQgJiYgY2FuRHJhZyA9PSBcXCcxXFwnXFxcIj7lsIblrZfmrrXmi5bliLDmraTlpIQ8L3NwYW4+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZHJvcC1jb250YWluZXJcXFwiPjxkaXYgY2xhc3M9XFxcInBvcHVwLW1lbnUgZWNoYXJ0LXR5cGVcXFwiPjxkaXYgbmctaWY9XFxcImZpZWxkLnR5cGUgPT0gXFwndGVtcG9yYWxcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPuaXpeacn+WPluWAvDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxzZWxlY3QgbmctbW9kZWw9XFxcImZpZWxkLnZ0eXBlXFxcIiBzdHlsZT1cXFwid2lkdGg6MTEwcHhcXFwiPjxvcHRpb24gdmFsdWU9XFxcInllYXJcXFwiPuW5tDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcIm1vbnRoXFxcIj7mnIg8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJkYXlcXFwiPuaXpTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInF1YXRlXFxcIj7lraPluqY8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCI+XFxcIj7lubTmnIjml6U8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCI+PVxcXCI+5bm05pyIPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiPFxcXCI+5bm05a2j5bqmPC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+5pe26Ze05qC85byPPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+PHNlbGVjdCBuZy1tb2RlbD1cXFwiZmllbGQuZGF0ZWZvcm1hdFxcXCIgc3R5bGU9XFxcIndpZHRoOjExMHB4XFxcIj48b3B0aW9uIHZhbHVlPVxcXCJ5ZWFyXFxcIj55eXl5LU1NLWRkPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwibW9udGhcXFwiPnl5eXkvTU0vZGQ8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIiBuZy1pZj1cXFwiZHJvcFR5cGUhPVxcJ2ZpbHRlclxcJyYmZHJvcFR5cGUhPVxcJ2ZpbHRlcnNcXCcmJmZpZWxkLmFnZ3JlZ2F0ZSE9XFwnY291bnRcXCcmJmZpZWxkLmFnZ3JlZ2F0ZSE9XFwnY291bnRfc3VtXFwnJiZjaGFubmVsVGl0bGUuaW5kZXhPZihcXCfnu7TluqZcXCcpPDAmJmNoYW5uZWxUaXRsZS5pbmRleE9mKFxcJ+WcsOWMulxcJyk8MFxcXCIgc3R5bGU9XFxcIndpZHRoOjIwMHB4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7nu5/orqHmlrnlvI88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48c2VsZWN0IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuYWdncmVnYXRlXFxcIj48b3B0aW9uIHZhbHVlPVxcXCJzdW1cXFwiPuWKoOaAuzwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcIm1lYW5cXFwiPuW5s+Wdhzwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcIm1heFxcXCI+5pyA5aSnPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwibWluXFxcIj7mnIDlsI88L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJyYW5rXFxcIj7mjpLlkI08L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJncm91cHJhbmtcXFwiPue7hOWGheaOkuWQjTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInRvcG5cXFwiPuWJjU7lkI08L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJsYXN0blxcXCI+5ZCOTuWQjTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInRvcG5wXFxcIj7liY1OJeWQjTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImxhc3RucFxcXCI+5ZCOTiXlkI08L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJ5cFxcXCI+5ZCM5pyf5pWw5YC8PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwieXBwZXJjZW50XFxcIj7lkIzmr5QlPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwibXBcXFwiPueOr+avlOaVsOWAvDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcIm1wcGVyY2VudFxcXCI+546v5q+UJTwvb3B0aW9uPjwvc2VsZWN0PjwvZGl2PjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgcGxhY2Vob2xkZXI9XFxcIk5cXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5hZ2dyZWdhdGV2YWx1ZVxcXCIgc3R5bGU9XFxcIndpZHRoOjEwMCVcXFwiIHR5cGU9XFxcInRleHRcXFwiIG5nLXNob3c9XFxcImZpZWxkLmFnZ3JlZ2F0ZT09XFwndG9wblxcJ3x8ZmllbGQuYWdncmVnYXRlPT1cXCdsYXN0blxcJ3x8ZmllbGQuYWdncmVnYXRlPT1cXCd0b3BucFxcJ3x8ZmllbGQuYWdncmVnYXRlPT1cXCdsYXN0bnBcXCdcXFwiPjwvZGl2PjwvZGl2PjxkaXYgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ3R5cGVcXCdcXFwiIHN0eWxlPVxcXCJ3aWR0aDoyMzBweFxcXCI+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+5paH5a2X5pi+56S6PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQucmVuYW1lXFxcIiBzdHlsZT1cXFwid2lkdGg6MTEwcHhcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPuminOiJsum7mOiupDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuYXV0b0NvbG9yXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIiBuZy1zaG93PVxcXCJmaWVsZC5hdXRvQ29sb3IgPT0gXFwnZmFsc2VcXCdcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPuminOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBjb2xvci1pbnB1dFxcXCIgbmctYmx1cj1cXFwic2V0TWl4Q29sb3IoKVxcXCIgbmctbW9kZWw9XFxcIm1peF9jb2xvclxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+5pWw5o2u5b2i54q2PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+PHNlbGVjdCBuZy1tb2RlbD1cXFwiZmllbGQudHJ1ZXR5cGVcXFwiIHN0eWxlPVxcXCJ3aWR0aDoxMTBweFxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwiYmFyXFxcIj7mn7HnirY8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJsaW5lXFxcIj7nur/mgKc8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJhcmVhXFxcIj7ljLrln5/lm748L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJsaW5lc3RlcFxcXCI+6Zi25qKvPC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCIgbmctc2hvdz1cXFwiZmllbGQudHJ1ZXR5cGU9PVxcJ2JhclxcJ1xcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+5bqm6YeP5L2N572uPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+PHNlbGVjdCBuZy1tb2RlbD1cXFwiZmllbGQubGFiZWwubm9ybWFsLnBvc2l0aW9uXFxcIiBzdHlsZT1cXFwid2lkdGg6MTEwcHhcXFwiPjxvcHRpb24gdmFsdWU9XFxcImxlZnRcXFwiPmxlZnQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJyaWdodFxcXCI+cmlnaHQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJ0b3BcXFwiPnRvcDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImJvdHRvbVxcXCI+Ym90dG9tPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlXFxcIj5pbnNpZGU8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJpbnNpZGVUb3BcXFwiPmluc2lkZVRvcDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImluc2lkZUxlZnRcXFwiPmluc2lkZUxlZnQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJpbnNpZGVSaWdodFxcXCI+aW5zaWRlUmlnaHQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJpbnNpZGVCb3R0b21cXFwiPmluc2lkZUJvdHRvbTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImluc2lkZVRvcExlZnRcXFwiPmluc2lkZVRvcExlZnQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJpbnNpZGVUb3BSaWdodFxcXCI+aW5zaWRlVG9wUmlnaHQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJpbnNpZGVCb3R0b21MZWZ0XFxcIj5pbnNpZGVCb3R0b21MZWZ0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlQm90dG9tUmlnaHRcXFwiPmluc2lkZUJvdHRvbVJpZ2h0PC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5bqm6YeP5pi+56S6PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCd0cnVlXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnZmFsc2VcXCdcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5sYWJlbC5ub3JtYWwuc2hvd1xcXCI+PC9kaXY+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5bqm6YeP5Y2V5L2NPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCd0cnVlXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnZmFsc2VcXCdcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC55bGFiZWx1bml0XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7luqbph4/nv7vovaw8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJzkwXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnMFxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsLm5vcm1hbC5yb3RhdGVcXFwiPjwvZGl2PjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuW6pumHj+WAvuaWnDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnNDVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCcwXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubGFiZWwubm9ybWFsLnJvdGF0ZVxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5bqm6YeP5YGP56e76YePPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubGFiZWwub2Zmc2V0XFxcIj48L2Rpdj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7luqbph4/popzoibI8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggY29sb3ItbGFiZWxcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5sYWJlbC5ub3JtYWwuY29sb3JcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiIG5nLXNob3c9XFxcImZpZWxkLnRydWV0eXBlIT1cXCdiYXJcXCdcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuaYr+WQpuW5s+a7kTwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwidHJ1ZVxcXCIgbmctZmFsc2UtdmFsdWU9XFxcImZhbHNlXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc21vb3RoXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7lnZDmoIfljZXkvY08L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC55dW5pdFxcXCI+PC9kaXY+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5bCP5pWw5L2N5pWwPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQudW5pdGNvdW50XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj5NYXjmoIflv5c8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcInRydWVcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJmYWxzZVxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnNob3dtYXhcXFwiPjwvZGl2PjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPk1pbuagh+W/lzwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwidHJ1ZVxcXCIgbmctZmFsc2UtdmFsdWU9XFxcImZhbHNlXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc2hvd21pblxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+6Zi25qKv5pi+56S6PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJ0cnVlXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiZmFsc2VcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5iYXNlYmFyXFxcIj48L2Rpdj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7ntK/orqHmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcInRydWVcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJmYWxzZVxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnN1bWJhclxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCIgbmctc2hvdz1cXFwiZmllbGQudHJ1ZXR5cGU9PVxcJ2JhclxcJ1xcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5a+55q+U6IOM5pmv5p+xPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJ0cnVlXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiZmFsc2VcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5zaGFkb3diYXJcXFwiPjwvZGl2PjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuWvueavlOafseWJjee9rjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwidHJ1ZVxcXCIgbmctZmFsc2UtdmFsdWU9XFxcImZhbHNlXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc2hhZG93YmFyZnJvbnRcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiIG5nLXNob3c9XFxcImZpZWxkLnRydWV0eXBlPT1cXCdiYXJcXCdcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuWvueavlOe6oue6vzwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwidHJ1ZVxcXCIgbmctZmFsc2UtdmFsdWU9XFxcImZhbHNlXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc2hhZG93bGluZVxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCIgbmctc2hvdz1cXFwiZmllbGQuc2hvd25ld3lcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuWPs1novbQ8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcInRydWVcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJmYWxzZVxcXCIgbmctbW9kZWw9XFxcImZpZWxkLm5ld3lcXFwiPjwvZGl2PjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuWPs1novbTlj43ovaw8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcInRydWVcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJmYWxzZVxcXCIgbmctbW9kZWw9XFxcImZpZWxkLmludmVyc2V5XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7lnYflgLznur88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcInRydWVcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJmYWxzZVxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnNob3dsaW5lXFxcIj48L2Rpdj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7orabnpLrnur/mnaHmlbA8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5hbGVydHNjb3VudFxcXCIgbmctYmx1cj1cXFwiYWxlcnRCbHVyKClcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuafseS4jeWQjOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwidHJ1ZVxcXCIgbmctZmFsc2UtdmFsdWU9XFxcImZhbHNlXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuZGlmZmNvbG9yc1xcXCI+PC9kaXY+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+6ZmQ5Yi25Y2V5p+x5a69PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubWF4d2lkdGhcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiIG5nLXJlcGVhdD1cXFwiYWxlcnRNb2RlbCBpbiBmaWVsZC5hbGVydHNDb25maWdzIHRyYWNrIGJ5ICRpbmRleFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tM1xcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5nLW1vZGVsPVxcXCJhbGVydE1vZGVsLm5hbWVcXFwiIHN0eWxlPVxcXCJ3aWR0aDo1MHB4XFxcIj48L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7lgLw8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmctbW9kZWw9XFxcImFsZXJ0TW9kZWwudmFsdWVcXFwiIHN0eWxlPVxcXCJ3aWR0aDo1MHB4XFxcIj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+6aKc6ImyPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoIGFsZXJ0Y29sb3JcXFwiIG5nLW1vZGVsPVxcXCJhbGVydE1vZGVsLmNvbG9yXFxcIiBzdHlsZT1cXFwid2lkdGg6NjBweFxcXCIgaWR4PVxcXCJ7eyAkaW5kZXggfX1cXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgc3R5bGU9XFxcIndpZHRoOiAyNTBweDtcXFwiIG5nLWlmPVxcXCJkcm9wVHlwZSA9PSBcXCdkYmFyXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7lrprkuYnlnYflgLznur88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcInRydWVcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJmYWxzZVxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnNob3dhdmdsaW5lXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIiBuZy1zaG93PVxcXCJmaWVsZC5zaG93YXZnbGluZT09dHJ1ZVxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+57q16L205Z2H5YC8PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoIGFsZXJ0Y29sb3JcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5hdmdsaW5ldmFsdWVcXFwiIHN0eWxlPVxcXCJ3aWR0aDozMHB4XFxcIj4lPC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBzdHlsZT1cXFwid2lkdGg6IDI1MHB4O1xcXCIgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ2xhYmVsXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS01XFxcIj7mloflrZfmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsLnNob3dcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPuaWh+acrOS9jee9rjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5sYWJlbC5wb3NpdGlvblxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwib3V0c2lkZVxcXCI+5aSW5L6nPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiaW5zaWRlXFxcIj7lhoXpg6g8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS01XFxcIj7nmb7liIbmr5TmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsLnNob3dwZXJjZW50XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS01XFxcIj7mlbDlgLzmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsLnNob3dzdW1zXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS01XFxcIj7mlofmnKzmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsLnNob3dEaW1lbm9cXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPueOq+eRsOWbvjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubGFiZWwuc2hvd3Jvc2VcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPuWNl+S4geagvOWwlOeOq+eRsDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubGFiZWwuc2hvd3Jvc2VuZFxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBzdHlsZT1cXFwid2lkdGg6IDI1MHB4O1xcXCIgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ21peGVkdHlwZVxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+57u05bqm5YiG57uEPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCd0cnVlXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnZmFsc2VcXCdcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5pc2dyb3VwXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogMjUwcHg7XFxcIiBuZy1pZj1cXFwiZHJvcFR5cGUgPT0gXFwnbWl4ZWR0eXBlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7nu7TluqbmloflrZflpKflsI88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS0yXFxcIj48aW5wdXQgdHlwZT1cXFwiaW5wdXRcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC54bGFiZWxzaXplXFxcIiBzdHlsZT1cXFwid2lkdGg6NDVweFxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5bqm6YeP5paH5a2X5aSn5bCPPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tMlxcXCI+PGlucHV0IHR5cGU9XFxcImlucHV0XFxcIiBuZy1tb2RlbD1cXFwiZmllbGQueWxhYmVsc2l6ZVxcXCIgc3R5bGU9XFxcIndpZHRoOjQ1cHhcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgc3R5bGU9XFxcIndpZHRoOiAyNTBweDtcXFwiIG5nLWlmPVxcXCJkcm9wVHlwZSA9PSBcXCdtaXhlZHR5cGVcXCd8fGRyb3BUeXBlID09IFxcJ2xhYmVsXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS01XFxcIj7nu7TluqblgLzlkIjlubY8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS01XFxcIj7lkIjlubbmiJA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5zZWxmZ3JvdXBjb3VudFxcXCIgc3R5bGU9XFxcIndpZHRoOjMwcHhcXFwiIG5nLWJsdXI9XFxcImdyb3VwY291bnRCbHVyKClcXFwiPue7hDwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiIG5nLXJlcGVhdD1cXFwiZ3JvdXBNb2RlbCBpbiBmaWVsZC5ncm91cENvbmZpZ3MgdHJhY2sgYnkgJGluZGV4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmctbW9kZWw9XFxcImdyb3VwTW9kZWwubmFtZVxcXCIgc3R5bGU9XFxcIndpZHRoOjYwcHhcXFwiPjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuWIneWAvDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuZy1tb2RlbD1cXFwiZ3JvdXBNb2RlbC52YWx1ZXN0YXJ0XFxcIiBzdHlsZT1cXFwid2lkdGg6NDVweFxcXCI+PC9kaXY+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPue7iOWAvDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuZy1tb2RlbD1cXFwiZ3JvdXBNb2RlbC52YWx1ZWVuZFxcXCIgc3R5bGU9XFxcIndpZHRoOjQ1cHhcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgc3R5bGU9XFxcIndpZHRoOjE4MHB4XFxcIiBuZy1pZj1cXFwiZHJvcFR5cGUgPT0gXFwnc3R5bGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPuaegeeugOaooeW8jzwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc2ltcGxlbW9kZVxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5paH5a2X5pi+56S6PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNVxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubmFtZVxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5paH5pys5L2N572uPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PHNlbGVjdCBuZy1tb2RlbD1cXFwiZmllbGQuc3R5bGUudGl0bGUudmVydGljYWxBbGlnblxcXCIgc3R5bGU9XFxcIndpZHRoOjcwJVxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwidG9wXFxcIj7kuIo8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJib3R0b21cXFwiPuS4izwvb3B0aW9uPjwvc2VsZWN0PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPueZvuWIhuavlDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTVcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc2hvd1BlcmNlbnRcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPuWwj+aVsOeCueS9jeaVsDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxkaXYgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIHN0eWxlPVxcXCJtYXJnaW46IDA7IHBhZGRpbmc6IDA7d2lkdGg6NzAlO2Zsb2F0OmxlZnQ7XFxcIiBtaW49XFxcIjBcXFwiIG1heD1cXFwiM1xcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5kZWNpbWFsc1xcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjIwcHg7aGVpZ2h0OjE2cHhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5kZWNpbWFsc1xcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5pWw5YC85aSn5bCPPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDsgcGFkZGluZzogMDt3aWR0aDo3MCU7ZmxvYXQ6bGVmdDtcXFwiIG1pbj1cXFwiMTBcXFwiIG1heD1cXFwiNTBcXFwiIG1vZGVsLW1heD1cXFwiZmllbGQuc3R5bGUuZGV0YWlsLmZvbnRTaXplXFxcIiBwaW4taGFuZGxlPVxcXCJtaW5cXFwiPjwvZGl2PjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBzdHlsZT1cXFwid2lkdGg6MjBweDtoZWlnaHQ6MTZweFxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnN0eWxlLmRldGFpbC5mb250U2l6ZVxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5paH5pys5aSn5bCPPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDtwYWRkaW5nOiAwO3dpZHRoOjcwJTtmbG9hdDpsZWZ0O1xcXCIgbWluPVxcXCIxMFxcXCIgbWF4PVxcXCI1MFxcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5zdHlsZS50aXRsZS5mb250U2l6ZVxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjIwcHg7aGVpZ2h0OjE2cHhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5zdHlsZS50aXRsZS5mb250U2l6ZVxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+6KGo55uY57KX57uGPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDtwYWRkaW5nOiAwO3dpZHRoOjcwJTtmbG9hdDpsZWZ0O1xcXCIgbWluPVxcXCIxXFxcIiBtYXg9XFxcIjYwXFxcIiBtb2RlbC1tYXg9XFxcImZpZWxkLnN0eWxlLmF4aXNMaW5lLmxpbmVTdHlsZS53aWR0aFxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjIwcHg7aGVpZ2h0OjE2cHhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5zdHlsZS5heGlzTGluZS5saW5lU3R5bGUud2lkdGhcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPumakOiXj+WIu+W6pjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuaGlkZXNwbGl0c1xcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5Yi75bqm6ZW/5bqmPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDtwYWRkaW5nOiAwO3dpZHRoOjcwJTtmbG9hdDpsZWZ0O1xcXCIgbWluPVxcXCIxXFxcIiBtYXg9XFxcIjEwMFxcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5zdHlsZS5heGlzVGljay5sZW5ndGhcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHN0eWxlPVxcXCJ3aWR0aDoyMHB4O2hlaWdodDoxNnB4XFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc3R5bGUuYXhpc1RpY2subGVuZ3RoXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7liIblibLplb/luqY8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS02XFxcIj48ZGl2IHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBzdHlsZT1cXFwibWFyZ2luOiAwO3BhZGRpbmc6IDA7d2lkdGg6NzAlO2Zsb2F0OmxlZnQ7XFxcIiBtaW49XFxcIjVcXFwiIG1heD1cXFwiMTAwXFxcIiBtb2RlbC1tYXg9XFxcImZpZWxkLnN0eWxlLnNwbGl0TGluZS5sZW5ndGhcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHN0eWxlPVxcXCJ3aWR0aDoyMHB4O2hlaWdodDoxNnB4XFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc3R5bGUuc3BsaXRMaW5lLmxlbmd0aFxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5aGr5YWF5a695bqmPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDtwYWRkaW5nOiAwO3dpZHRoOjcwJTtmbG9hdDpsZWZ0O1xcXCIgbWluPVxcXCI4XFxcIiBtYXg9XFxcIjEwMFxcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5mdWxsd2lkdGhcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHN0eWxlPVxcXCJ3aWR0aDoyMHB4O2hlaWdodDoxNnB4XFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuZnVsbHdpZHRoXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7mjIfpkojpopzoibI8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS02XFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggc3BsaXQtY29sb3ItaW5wdXRcXFwiIHJlbD1cXFwicG9pbnRlclxcXCIgbmctYmx1cj1cXFwic2V0UG9pbnRDb2xvcihcXCdwb2ludGVyXFwnKVxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnN0eWxlLml0ZW1TdHlsZS5ub3JtYWwuY29sb3JcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPuWIu+W6puminOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBzcGxpdC1jb2xvci1pbnB1dFxcXCIgcmVsPVxcXCJub3JtYWxcXFwiIG5nLWJsdXI9XFxcInNldFBvaW50Q29sb3IoXFwnc3BsaXRcXCcpXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuc3BsaXRjb2xvclxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCIgc3R5bGU9XFxcImRpc3BsYXk6bm9uZTtcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPuWIhuautTwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnJhbmdlXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS02XFxcIj7liqjmgIHliIbmrrU8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS02XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmF1dG9TcGxpdFxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5Yqo5oCB5pyA5aSn5YC8PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCd0cnVlXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnZmFsc2VcXCdcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5hdXRvTWF4XFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIiBuZy1pZj1cXFwiZmllbGQuYXV0b01heCA9PSBcXCdmYWxzZVxcJ1xcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5pyA5aSn5YC8PC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubWF4XFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogMjAwcHg7XFxcIiBuZy1pZj1cXFwiZHJvcFR5cGUgPT0gXFwnbWFwcG9pbnRcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuminOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBwb2ludC1jb2xvci1pbnB1dFxcXCIgcmVsPVxcXCJub3JtYWxcXFwiIG5nLWJsdXI9XFxcInNldFBvaW50Q29sb3IoXFwnbm9ybWFsXFwnKVxcXCIgbmctbW9kZWw9XFxcInBvaW50X2NvbG9yXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7nqoHlh7rmmL7npLo8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJ3RydWVcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdmYWxzZVxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmlmdG9wXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7mjpLluo88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48c2VsZWN0IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQub3JkZXJcXFwiPjxvcHRpb24gdmFsdWU9XFxcImFzY1xcXCI+6aG65bqPPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZGVzY1xcXCI+5YCS5bqPPC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5pi+56S65pWw6YePPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQub3JkZXJfbnVtXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7nqoHlh7rpopzoibI8L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS00XFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggcG9pbnQtY29sb3ItaW5wdXRcXFwiIHJlbD1cXFwidG9wXFxcIiBuZy1ibHVyPVxcXCJzZXRQb2ludENvbG9yKFxcJ3RvcFxcJylcXFwiIG5nLW1vZGVsPVxcXCJwb2ludF90b3BfY29sb3JcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgc3R5bGU9XFxcIndpZHRoOiAyMDBweDtcXFwiIG5nLWlmPVxcXCJkcm9wVHlwZSA9PSBcXCdzaW5nbGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuagh+mimDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLThcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImZpZWxkLmxhYmVsXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7moIfpopjlpKflsI88L2xhYmVsPjxkaXYgY2xhc3M9XFxcImNvbC1zbS04XFxcIj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogODAlO21hcmdpbjogMDtmbG9hdDpsZWZ0XFxcIiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgbWluPVxcXCIxMlxcXCIgbWF4PVxcXCIyNFxcXCIgbW9kZWwtbWF4PVxcXCJmaWVsZC5fdGl0bGVGb250c2l6ZVxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjIycHg7aGVpZ2h0OjE4cHhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5fdGl0bGVGb250c2l6ZVxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5qCH6aKY6aKc6ImyPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJmdWxsLXdpZHRoIHNpbmdsZS1jb2xvclxcXCIgcmVsPVxcXCJzaW5nbGVfdGl0bGVcXFwiIG5nLWJsdXI9XFxcInNldFBvaW50Q29sb3IoXFwnc2luZ2xlX3RpdGxlXFwnKVxcXCIgbmctbW9kZWw9XFxcInNpbmdsZV90aXRsZV9jb2xvclxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5pWw5YC85aSn5bCPPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tOFxcXCI+PGRpdiBzdHlsZT1cXFwid2lkdGg6IDgwJTttYXJnaW46IDA7ZmxvYXQ6bGVmdFxcXCIgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIG1pbj1cXFwiMTJcXFwiIG1heD1cXFwiMjRcXFwiIG1vZGVsLW1heD1cXFwiZmllbGQuX3ZhbHVlRm9udHNpemVcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCI+PC9kaXY+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHN0eWxlPVxcXCJ3aWR0aDoyMnB4O2hlaWdodDoxOHB4XFxcIiBuZy1tb2RlbD1cXFwiZmllbGQuX3ZhbHVlRm9udHNpemVcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuaVsOWAvOminOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBzaW5nbGUtY29sb3JcXFwiIHJlbD1cXFwic2luZ2xlX3ZhbHVlXFxcIiBuZy1ibHVyPVxcXCJzZXRQb2ludENvbG9yKFxcJ3NpbmdsZV92YWx1ZVxcJylcXFwiIG5nLW1vZGVsPVxcXCJzaW5nbGVfdmFsdWVfY29sb3JcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuWNleS9jTwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLThcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImZpZWxkLnVuaXRcXFwiPjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPuWinumVv+WbvuaghzwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwndHJ1ZVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ2ZhbHNlXFwnXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQucGx1c2ljb25cXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuaMh+agh+WAvOS9jee9rjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLThcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5haW1mbG9hdFxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwibGVmdFxcXCI+6Z2g5bemPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiY2VudGVyXFxcIj7lsYXkuK08L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJyaWdodFxcXCI+6Z2g5Y+zPC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBzdHlsZT1cXFwid2lkdGg6IDIwMHB4O1xcXCIgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ2ZpbHRlclxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5b2T5YmN5pel5pyfPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tOFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCcxXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnMFxcJ1xcXCIgbmctbW9kZWw9XFxcImZpZWxkLmlmQXV0b1xcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNFxcXCI+5omL5Yqo5pel5pyfPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tOFxcXCI+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC52YWx1ZVxcXCIgbmctZGlzYWJsZWQ9XFxcImZpZWxkLmlmQXV0byA9PSBcXCcxXFwnXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogNTUwcHg7bWF4LWhlaWdodDo1MDBweDtvdmVyZmxvdy15OiBhdXRvO1xcXCIgbmctaWY9XFxcImRyb3BUeXBlID09IFxcJ2ZpbHRlcnNcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPuiHquWumuS5iei/h+a7pDwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTZcXFwiPjxhIG5nLWNsaWNrPVxcXCJhZGRBbmQoKVxcXCIgc3R5bGU9XFxcImN1cnNvcjpwb2ludGVyO1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXBsdXNcXFwiPjwvaT7lop7liqDmnaHku7Y8L2E+PC9kaXY+PC9kaXY+PHRhYmxlIHN0eWxlPVxcXCJ3aWR0aDoxMDAlO2JvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7Ym9yZGVyLWxlZnQ6IDFweCBzb2xpZCAjZThlYWVkO2JvcmRlci10b3A6IDFweCBzb2xpZCAjZThlYWVkO1xcXCIgY2VsbHNwYWNpbmc9XFxcIjBcXFwiIGNlbGxwYWRkaW5nPVxcXCIwXFxcIj48dHIgbmctcmVwZWF0PVxcXCJlYWNocnVsZSBpbiBnZXRDaGlsZHMoXFwnMFxcJykgdHJhY2sgYnkgY3J1bGUuaWRcXFwiIG5nLWluaXQ9XFxcImVhY2hydWxlID0gZWFjaHJ1bGVcXFwiIG5nLWluY2x1ZGU9XFxcIlxcJ2l0ZW1fcmVuZGVyZXIuaHRtbFxcJ1xcXCI+PC90cj48L3RhYmxlPjwvZGl2PjxzY3JpcHQgaWQ9XFxcIml0ZW1fcmVuZGVyZXIuaHRtbFxcXCIgdHlwZT1cXFwidGV4dC9uZy10ZW1wbGF0ZVxcXCI+PHRkPiA8dGFibGUgc3R5bGU9XFxcIndpZHRoOjEwMCU7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlXFxcIiBjZWxsc3BhY2luZz1cXFwiMFxcXCIgY2VsbHBhZGRpbmc9XFxcIjBcXFwiPiA8dHI+IDx0ZCByb3dzcGFuPVxcXCJ7eyBnZXRDaGlsZHMoZWFjaHJ1bGUuaWQpLmxlbmd0aCB9fVxcXCIgbmctaWY9XFxcImdldENoaWxkcyhlYWNocnVsZS5pZCkubGVuZ3RoPjFcXFwiIHN0eWxlPVxcXCJ2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO3dpZHRoOjIwcHg7Ym9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlOGVhZWQ7Ym9yZGVyLXJpZ2h0OiAxcHggc29saWQgI2U4ZWFlZDtwYWRkaW5nOjNweDtcXFwiPiA8ZGl2Pnt7IGVhY2hydWxlLnJlbGF0ZT09XFxcImFuZFxcXCI/XFxcIuS4lFxcXCI6XFxcIuaIllxcXCIgfX08L2Rpdj4gPC90ZD4gPHRkIG5nLWlmPVxcXCJlYWNocnVsZS5ydWxlIT1cXCdcXCdcXFwiIHN0eWxlPVxcXCJ3aWR0aDoxMjBweDtib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U4ZWFlZDtwYWRkaW5nOjVweDtcXFwiIG5nLWNsaWNrPVxcXCJmaWx0ZXJSb3dDbGljaygkZXZlbnQsZWFjaHJ1bGUscGFyZW50UnVsZSlcXFwiPiA8c2VsZWN0IG5nLW1vZGVsPVxcXCJlYWNocnVsZS5uYW1lXFxcIiBzdHlsZT1cXFwid2lkdGg6MTEwcHhcXFwiIG5nLW9wdGlvbnM9XFxcInZhbGUuZmllbGQgYXMgdmFsZS5maWVsZCBmb3IgdmFsZSBpbiBnZXRBbGxDb2xzKCkgfCBvcmRlckJ5IDogb3JkZXJCeVxcXCI+PC9zZWxlY3Q+IDwvdGQ+IDx0ZCBuZy1pZj1cXFwiZWFjaHJ1bGUucnVsZSE9XFwnXFwnXFxcIiBzdHlsZT1cXFwid2lkdGg6OTBweDtib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U4ZWFlZDtwYWRkaW5nOjVweDtcXFwiIG5nLWNsaWNrPVxcXCJmaWx0ZXJSb3dDbGljaygkZXZlbnQsZWFjaHJ1bGUscGFyZW50UnVsZSlcXFwiPiA8c2VsZWN0IG5nLW1vZGVsPVxcXCJlYWNocnVsZS5ydWxlXFxcIiBzdHlsZT1cXFwid2lkdGg6ODBweFxcXCI+IDxvcHRpb24gdmFsdWU9XFxcIj09XFxcIj7nrYnkuo48L29wdGlvbj4gPG9wdGlvbiB2YWx1ZT1cXFwiIT1cXFwiPuS4jeetieS6jjwvb3B0aW9uPiA8b3B0aW9uIHZhbHVlPVxcXCJsaWtlXFxcIj7ljIXlkKs8L29wdGlvbj4gPG9wdGlvbiB2YWx1ZT1cXFwibm90bGlrZVxcXCI+5LiN5YyF5ZCrPC9vcHRpb24+IDxvcHRpb24gdmFsdWU9XFxcImluXFxcIj7lsZ7kuo48L29wdGlvbj4gPG9wdGlvbiB2YWx1ZT1cXFwibm90aW5cXFwiPuS4jeWxnuS6jjwvb3B0aW9uPiA8b3B0aW9uIHZhbHVlPVxcXCJudWxsXFxcIj7nqbo8L29wdGlvbj4gPG9wdGlvbiB2YWx1ZT1cXFwibm90bnVsbFxcXCI+6Z2e56m6PC9vcHRpb24+IDxvcHRpb24gdmFsdWU9XFxcIj5cXFwiPuWkp+S6jjwvb3B0aW9uPiA8b3B0aW9uIHZhbHVlPVxcXCI+PVxcXCI+5aSn5LqO562J5LqOPC9vcHRpb24+IDxvcHRpb24gdmFsdWU9XFxcIjxcXFwiPuWwj+S6jjwvb3B0aW9uPiA8b3B0aW9uIHZhbHVlPVxcXCI8PVxcXCI+5bCP5LqO562J5LqOPC9vcHRpb24+IDxvcHRpb24gdmFsdWU9XFxcInM9XFxcIj7ku6UuLuW8gOWnizwvb3B0aW9uPiA8b3B0aW9uIHZhbHVlPVxcXCJlPVxcXCI+5LulLi7nu5PmnZ88L29wdGlvbj4gPG9wdGlvbiB2YWx1ZT1cXFwibm90cz1cXFwiPuS4jeS7pS4u5byA5aeLPC9vcHRpb24+IDxvcHRpb24gdmFsdWU9XFxcIm5vdGU9XFxcIj7kuI3ku6UuLue7k+adnzwvb3B0aW9uPiA8L3NlbGVjdD4gPC90ZD4gPHRkIG5nLWlmPVxcXCJlYWNocnVsZS5ydWxlIT1cXCdcXCdcXFwiIHN0eWxlPVxcXCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U4ZWFlZDtwYWRkaW5nOjVweDtcXFwiIG5nLWNsaWNrPVxcXCJmaWx0ZXJSb3dDbGljaygkZXZlbnQsZWFjaHJ1bGUscGFyZW50UnVsZSlcXFwiPiA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmctbW9kZWw9XFxcImVhY2hydWxlLnZhbHVlXFxcIiBuZy1tb2RlbC1vcHRpb25zPVxcXCJ7dXBkYXRlT246IFxcJ2JsdXJcXCd9XFxcIiBzdHlsZT1cXFwid2lkdGg6MTAwJVxcXCIgbmctc2hvdz1cXFwiZWFjaHJ1bGUucnVsZSE9XFwnbnVsbFxcJyYmZWFjaHJ1bGUucnVsZSE9XFwnbm90bnVsbFxcJ1xcXCI+IDwvdGQ+IDx0ZCBuZy1pZj1cXFwiZWFjaHJ1bGUucnVsZSE9XFwnXFwnXFxcIiBzdHlsZT1cXFwid2lkdGg6NzBweDtib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U4ZWFlZDtib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjZThlYWVkO3BhZGRpbmc6NXB4O1xcXCIgbmctY2xpY2s9XFxcImZpbHRlclJvd0NsaWNrKCRldmVudCxlYWNocnVsZSxwYXJlbnRSdWxlKVxcXCI+IDxhIHRpdGxlPVxcXCLlop7liqDlkIznuqfkuJTmnaHku7ZcXFwiIG5nLWNsaWNrPVxcXCJhZGRBbmQoZWFjaHJ1bGUpXFxcIiBzdHlsZT1cXFwiY3Vyc29yOnBvaW50ZXI7XFxcIj4gPGkgY2xhc3M9XFxcImZhIGZhLXBsdXNcXFwiPjwvaT4gPC9hPiZuYnNwOyA8YSB0aXRsZT1cXFwi5aKe5Yqg5ZCM57qn5oiW5p2h5Lu2XFxcIiBuZy1jbGljaz1cXFwiYWRkT3IoZWFjaHJ1bGUpXFxcIiBzdHlsZT1cXFwiY3Vyc29yOnBvaW50ZXI7XFxcIj4gPGkgY2xhc3M9XFxcImZhIGZhLXBsdXMtY2lyY2xlXFxcIj48L2k+IDwvYT4mbmJzcDsgPGEgdGl0bGU9XFxcIuWIoOmZpOadoeS7tlxcXCIgbmctY2xpY2s9XFxcInJlbW92ZUZpbHRlcihlYWNocnVsZSlcXFwiIHN0eWxlPVxcXCJjdXJzb3I6cG9pbnRlcjtcXFwiPiA8aSBjbGFzcz1cXFwiZmEgZmEtbWludXNcXFwiPjwvaT4gPC9hPiA8L3RkPiA8dGQ+IDx0YWJsZSBzdHlsZT1cXFwid2lkdGg6MTAwJTtib3JkZXItY29sbGFwc2U6Y29sbGFwc2VcXFwiIGNlbGxzcGFjaW5nPVxcXCIwXFxcIiBjZWxscGFkZGluZz1cXFwiMFxcXCI+IDx0ciBuZy1yZXBlYXQ9XFxcImNydWxlIGluIGdldENoaWxkcyhlYWNocnVsZS5pZCkgdHJhY2sgYnkgY3J1bGUuaWRcXFwiIG5nLWluaXQ9XFxcImVhY2hydWxlID0gY3J1bGVcXFwiIG5nLWluY2x1ZGU9XFxcIlxcJ2l0ZW1fcmVuZGVyZXIuaHRtbFxcJ1xcXCI+PC90cj4gPC90YWJsZT4gPC90ZD4gPC90cj4gPC90YWJsZT4gPC90ZD48L3NjcmlwdD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJwb3B1cC1tZW51IGNvdW50LXR5cGVcXFwiPjxkaXYgc3R5bGU9XFxcIndpZHRoOiA0NTBweDtcXFwiIG5nLWlmPVxcXCJmaWVsZC5hZ2dyZWdhdGUgPT0gXFwnY291bnRcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTJcXFwiPuaMh+agh+mHjeWRveWQjTwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImZpZWxkLmZpZWxkXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48bGFiZWwgY2xhc3M9XFxcImNvbC1zbS00XFxcIj7lj6/nlKjorqHnrpflrZfmrrUo54K56YCJKTwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLThcXFwiPui/kOeul+espijngrnpgIkpICZuYnNwOyZuYnNwOyA8c3BhbiBjbGFzcz1cXFwiZmllbGQtZnVuY1xcXCIgbmctY2xpY2s9XFxcImFkZEZpZWxkQ2FsYyhcXCcrXFwnKVxcXCIgc3R5bGU9XFxcImN1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxNHB4O1xcXCI+Kzwvc3Bhbj4mbmJzcDsmbmJzcDsmbmJzcDsgPHNwYW4gY2xhc3M9XFxcImZpZWxkLWZ1bmNcXFwiIG5nLWNsaWNrPVxcXCJhZGRGaWVsZENhbGMoXFwnLVxcJylcXFwiIHN0eWxlPVxcXCJjdXJzb3I6cG9pbnRlcjtmb250LXNpemU6MTRweDtcXFwiPi08L3NwYW4+ICZuYnNwOyZuYnNwOyZuYnNwOyA8c3BhbiBjbGFzcz1cXFwiZmllbGQtZnVuY1xcXCIgbmctY2xpY2s9XFxcImFkZEZpZWxkQ2FsYyhcXCcqXFwnKVxcXCIgc3R5bGU9XFxcImN1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxNHB4O1xcXCI+Kjwvc3Bhbj4mbmJzcDsmbmJzcDsmbmJzcDsgPHNwYW4gY2xhc3M9XFxcImZpZWxkLWZ1bmNcXFwiIG5nLWNsaWNrPVxcXCJhZGRGaWVsZENhbGMoXFwnL1xcJylcXFwiIHN0eWxlPVxcXCJjdXJzb3I6cG9pbnRlcjtmb250LXNpemU6MTRweDtcXFwiPi88L3NwYW4+Jm5ic3A7Jm5ic3A7Jm5ic3A7IDxzcGFuIGNsYXNzPVxcXCJmaWVsZC1mdW5jXFxcIiBuZy1jbGljaz1cXFwiYWRkRmllbGRDYWxjKFxcJyhcXCcpXFxcIiBzdHlsZT1cXFwiY3Vyc29yOnBvaW50ZXI7Zm9udC1zaXplOjE0cHg7XFxcIj4oPC9zcGFuPiZuYnNwOyZuYnNwOyZuYnNwOyA8c3BhbiBjbGFzcz1cXFwiZmllbGQtZnVuY1xcXCIgbmctY2xpY2s9XFxcImFkZEZpZWxkQ2FsYyhcXCcpXFwnKVxcXCIgc3R5bGU9XFxcImN1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxNHB4O1xcXCI+KTwvc3Bhbj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGNsZWFyZml4XFxcIj48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNCBjYWxjX2Rpdl9maWVsZHMgc2Nyb2xsLXlcXFwiIHN0eWxlPVxcXCJtYXgtaGVpZ2h0OjI1MHB4O1xcXCI+PGRpdiBuZy1jbGljaz1cXFwiYWRkRmllbGRDYWxjKHZhbHVlLmZpZWxkKVxcXCIgZGF0YS1kcmFnPVxcXCJ0cnVlXFxcIiBzdHlsZT1cXFwibWFyZ2luLXRvcDozcHg7d2lkdGg6MTIwcHg7b3ZlcmZsb3cteDogaGlkZGVuO2N1cnNvcjpwb2ludGVyXFxcIiBqcXlvdWktZHJhZ2dhYmxlPVxcXCJ7ZGVlcENvcHk6IHRydWUsIG9uU3RhcnQ6IFxcJ2RyYWdzdGFydFxcJywgb25TdG9wOlxcJ2RyYWdzdG9wXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie3JldmVydDogXFwnaW52YWxpZFxcJywgaGVscGVyOiBcXCdjbG9uZVxcJ31cXFwiIGNsYXNzPVxcXCJzZWxlY3RlZCBmdWxsLXdpZHRoIGZpZWxkLWluZm9cXFwiIG5nLXJlcGVhdD1cXFwidmFsdWUgaW4gZ2V0QWxsQ29scygpIHwgb3JkZXJCeSA6IG9yZGVyQnlcXFwiPnt7dmFsdWUuZmllbGR9fTwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImNvbC1zbS04IGZpZWxkLWRyb3BcXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwnZHJvcENvbXBsZXRlXFwnfVxcXCI+PHRleHRhcmVhIHN0eWxlPVxcXCJ3aWR0aDoxMDAlO2hlaWdodDoyMjBweDtmb250LXNpemU6MTJweDtcXFwiIG5nLWtleWRvd249XFxcImRlbGV0ZVdvcmRzKCRldmVudClcXFwiIG5nLW1vZGVsPVxcXCJmaWVsZC5jYWxjcnVsZXNcXFwiIHBsYWNlaG9sZGVyPVxcXCLkvos65bey5a6M5oiQ6aKdL+ebruagh+WAvFxcXCI+PC90ZXh0YXJlYT48ZGl2PuWFrOW8j+agoemqjDoge3sgY2FsY2hlY2sgfX08L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctaWY9XFxcIm1vcmVEcmFnICYmIGZpZWxkLmF1dG9NYXggPT0gXFwndHJ1ZVxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsXFxcIj7mnIDlpKflgLw8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwiZmllbGQubWF4RmllbGRcXFwiIGRhdGEtZHJvcD1cXFwidHJ1ZVxcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj48c3BhbiBjbGFzcz1cXFwic2VsZWN0ZWQgZnVsbC13aWR0aCBmaWVsZC1pbmZvXFxcIj48c3BhbiBjbGFzcz1cXFwiaGZsZXggZnVsbC13aWR0aFxcXCI+PHNwYW4gY2xhc3M9XFxcImZpZWxkLWluZm8tdGV4dFxcXCI+e3sgZmllbGQubWF4RmllbGQuZmllbGQgfX08L3NwYW4+PC9zcGFuPjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIiBuZy1zaG93PVxcXCIhZmllbGQuZmllbGQgJiYgY2FuRHJhZyA9PSBcXCcxXFwnXFxcIj7mraTkuLoge3sgZmllbGQuZmllbGQgfX0g55qEIOacgOWkp+WAvDwvc3Bhbj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctaWY9XFxcIm1vcmVEcmFnICYmIGZpZWxkLmlzZ3JvdXAgPT0gXFwndHJ1ZVxcJ3x8ZmllbGQuYWdncmVnYXRlPT1cXCdncm91cHJhbmtcXCdcXFwiPjxzcGFuIGNsYXNzPVxcXCJmaWVsZC1pbmZvLXRleHRcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbFxcXCI+5YiG57uE5a2X5q61PC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCIgbmctbW9kZWw9XFxcImZpZWxkLmdyb3VwRmllbGRcXFwiIGRhdGEtZHJvcD1cXFwidHJ1ZVxcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj48c3BhbiBjbGFzcz1cXFwic2VsZWN0ZWQgZnVsbC13aWR0aCBmaWVsZC1pbmZvXFxcIj48c3BhbiBjbGFzcz1cXFwiaGZsZXggZnVsbC13aWR0aFxcXCI+e3sgZmllbGQuZ3JvdXBGaWVsZC5maWVsZCB9fTwvc3Bhbj48L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJwbGFjZWhvbGRlclxcXCIgbmctc2hvdz1cXFwiIWZpZWxkLmZpZWxkICYmIGNhbkRyYWcgPT0gXFwnMVxcJ1xcXCI+5q2k5Li6IHt7IGZpZWxkLmZpZWxkIH19IOeahCDmnIDlpKflgLw8L3NwYW4+PC9kaXY+PC9kaXY+PC9zcGFuPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtcG9zaXRpb25hbC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcIm1vcmVEcmFnICYmIGZpZWxkLmF1dG9TcGxpdCA9PSBcXCd0cnVlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiIG5nLXJlcGVhdD1cXFwic3BsaXRNb2RlbCBpbiBmaWVsZC5zcGxpdEZpZWxkIHRyYWNrIGJ5ICRpbmRleFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWxcXFwiPuWIu+W6puWIhuautXt7ICgkaW5kZXgrMSkgfX08L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48c3BhbiBjbGFzcz1cXFwic2VsZWN0ZWQgZnVsbC13aWR0aCBmaWVsZC1pbmZvXFxcIj48c3BhbiBjbGFzcz1cXFwiaGZsZXggZnVsbC13aWR0aFxcXCI+PHNwYW4gY2xhc3M9XFxcInR5cGUtY2FyZXR7eyAkaW5kZXggfX0gZHJvcC10YXJnZXQgYWN0aXZlXFxcIiBuZy1zaG93PVxcXCJjYW5Ecm9wID09IFxcJzFcXCdcXFwiIG5nLWNsaWNrPVxcXCJzaG93U3BsaXRQb3AoJGluZGV4KVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWNhcmV0LWRvd25cXFwiPjwvaT48L3NwYW4+IDxzcGFuIHRpdGxlPVxcXCJ7eyBzcGxpdE1vZGVsLmZpZWxkIH19XFxcIiBjbGFzcz1cXFwiZmllbGQtaW5mby10ZXh0XFxcIj57eyBzcGxpdE1vZGVsLmZpZWxkIH19PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwibm8tc2hyaW5rIHJlbW92ZVxcXCI+PGEgY2xhc3M9XFxcInJlbW92ZS1maWVsZFxcXCIgbmctY2xpY2s9XFxcInJlbW92ZVNwbGl0KClcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10aW1lc1xcXCI+PC9pPjwvYT48L3NwYW4+PC9zcGFuPjwvc3Bhbj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJkcm9wLWNvbnRhaW5lclxcXCI+PGRpdiBjbGFzcz1cXFwicG9wdXAtbWVudSBlY2hhcnQtdHlwZXt7ICRpbmRleCB9fVxcXCI+PGRpdiBuZy1pZj1cXFwiZmllbGQuYXV0b1NwbGl0ID09IFxcJ3RydWVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiPjxsYWJlbCBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPuWIhuauteminOiJsjwvbGFiZWw+PGRpdiBjbGFzcz1cXFwiY29sLXNtLTRcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBzcGxpdC1jb2xvcnt7ICRpbmRleCB9fVxcXCIgbmctYmx1cj1cXFwic2V0U3BsaXRDb2xvcihcXCdzcGxpdFxcJywkaW5kZXgpXFxcIiBuZy1tb2RlbD1cXFwic3BsaXRNb2RlbC5jb2xvclxcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBjbGVhcmZpeFxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5oyH5a6a5YiG5q616ZW/5bqmPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJ0cnVlXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiZmFsc2VcXFwiIG5nLW1vZGVsPVxcXCJzcGxpdE1vZGVsLmdpdmVMZW5ndGhcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXAgY2xlYXJmaXhcXFwiIG5nLXNob3c9XFxcInNwbGl0TW9kZWwuZ2l2ZUxlbmd0aD09dHJ1ZVxcXCI+PGxhYmVsIGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+5YiG5q616ZW/5bqmPC9sYWJlbD48ZGl2IGNsYXNzPVxcXCJjb2wtc20tNlxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgc3R5bGU9XFxcIm1hcmdpbjogMDtwYWRkaW5nOiAwO1xcXCIgbWluPVxcXCIwXFxcIiBtYXg9XFxcIjUwXFxcIiBtb2RlbC1tYXg9XFxcInNwbGl0TW9kZWwubGVuZ3RoXFxcIiBwaW4taGFuZGxlPVxcXCJtaW5cXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCIgbmctbW9kZWw9XFxcIm5ld21vZGVsXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwnU3BsaXREcm9wcGVkKClcXCd9XFxcIiBkYXRhLWpxeW91aS1vcHRpb25zPVxcXCJ7YWN0aXZlQ2xhc3M6IFxcJ2Ryb3AtYWN0aXZlXFwnfVxcXCI+PHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIj7mi5bliqjliLvluqbliIbmrrXlrZfmrrXliLDmraTlpIQ8L3NwYW4+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiY29tcG9uZW50cy9maWVsZGluZm8vZmllbGRpbmZvLmh0bWxcIixcIjxzcGFuIGNsYXNzPVxcXCJmaWVsZC1pbmZvXFxcIj48c3BhbiBjbGFzcz1cXFwiaGZsZXggZnVsbC13aWR0aFxcXCIgbmctY2xpY2s9XFxcImNsaWNrZWQoJGV2ZW50KVxcXCI+PHNwYW4gY2xhc3M9XFxcInR5cGUtY2FyZXRcXFwiIG5nLWNsYXNzPVxcXCJ7YWN0aXZlOiAhZGlzYWJsZUNhcmV0fVxcXCI+PHNwYW4gY2xhc3M9XFxcInR5cGUgZmEge3tpY29ufX1cXFwiIG5nLXNob3c9XFxcInNob3dUeXBlXFxcIiB0aXRsZT1cXFwie3t0eXBlTmFtZX19XFxcIj48L3NwYW4+PC9zcGFuPiA8c3BhbiBuZy1pZj1cXFwiZmllbGREZWYuYWdncmVnYXRlIT09XFwnY291bnRcXCdcXFwiIGNsYXNzPVxcXCJmaWVsZC1pbmZvLXRleHRcXFwiPjxzcGFuIG5nLWlmPVxcXCJmdW5jKGZpZWxkRGVmKVxcXCIgY2xhc3M9XFxcImZpZWxkLWZ1bmNcXFwiIHRpdGxlPVxcXCJ7eyBmdW5jKGZpZWxkRGVmKSB9fVxcXCIgbmctY2xhc3M9XFxcInthbnk6IGZpZWxkRGVmLl9hbnl9XFxcIj57eyBmdW5jKGZpZWxkRGVmKSB9fTwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiZmllbGQtbmFtZVxcXCIgdGl0bGU9XFxcInt7IChmaWVsZERlZi50aXRsZSB8fCBmaWVsZFRpdGxlKGZpZWxkRGVmLmZpZWxkKSkgfCB1bmRlcnNjb3JlMnNwYWNlIH19XFxcIiBuZy1jbGFzcz1cXFwie2hhc2Z1bmM6IGZ1bmMoZmllbGREZWYpLCBhbnk6IGZpZWxkRGVmLl9hbnl9XFxcIj57eyAoZmllbGREZWYudGl0bGUgfHwgZmllbGRUaXRsZShmaWVsZERlZi5maWVsZCkpIHwgdW5kZXJzY29yZTJzcGFjZSB9fTwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcIndpbGRjYXJkLWZpZWxkLWNvdW50XFxcIj57eyBmaWVsZENvdW50KGZpZWxkRGVmLmZpZWxkKSB9fTwvc3Bhbj48L3NwYW4+IDxzcGFuIG5nLWlmPVxcXCJmaWVsZERlZi5hZ2dyZWdhdGU9PT1cXCdjb3VudFxcJyB8fCBmaWVsZERlZi5hdXRvQ291bnRcXFwiIGNsYXNzPVxcXCJmaWVsZC1jb3VudCBmaWVsZC1pbmZvLXRleHRcXFwiPjxzcGFuIGNsYXNzPVxcXCJmaWVsZC1uYW1lXFxcIj57e2ZpZWxkRGVmLmZpZWxkfX08L3NwYW4+PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwibm8tc2hyaW5rIHJlbW92ZVxcXCIgbmctc2hvdz1cXFwic2hvd1JlbW92ZVxcXCI+PGEgY2xhc3M9XFxcInJlbW92ZS1maWVsZFxcXCIgbmctY2xpY2s9XFxcInJlbW92ZUFjdGlvbigpXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdGltZXNcXFwiPjwvaT48L2E+PC9zcGFuPjwvc3Bhbj48L3NwYW4+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiY29tcG9uZW50cy9tb2RhbC9tb2RhbC5odG1sXCIsXCI8ZGl2IGNsYXNzPVxcXCJuZ21vZGFsXFxcIiBuZy1pZj1cXFwiaXNPcGVuXFxcIj48ZGl2IGNsYXNzPVxcXCJtb2RhbC13cmFwcGVyXFxcIiBzdHlsZT1cXFwie3t3cmFwcGVyU3R5bGV9fVxcXCIgbmctdHJhbnNjbHVkZT1cXFwiXFxcIj48L2Rpdj48L2Rpdj5cIik7XG4kdGVtcGxhdGVDYWNoZS5wdXQoXCJjb21wb25lbnRzL21vZGFsL21vZGFsY2xvc2VidXR0b24uaHRtbFwiLFwiPGRpdiBjbGFzcz1cXFwicmlnaHRcXFwiPjxhIG5nLWNsaWNrPVxcXCJjbG9zZU1vZGFsKClcXFwiIGNsYXNzPVxcXCJyaWdodFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXRpbWVzXFxcIj48L2k+PC9hPjwvZGl2PlwiKTtcbiR0ZW1wbGF0ZUNhY2hlLnB1dChcImNvbXBvbmVudHMvc2NoZW1hbGlzdC9zY2hlbWFsaXN0Lmh0bWxcIixcIjxkaXYgY2xhc3M9XFxcInNjaGVtYSBuby10b3AtbWFyZ2luIGZ1bGwtd2lkdGggc2Nyb2xsLXlcXFwiPjxzY2hlbWEtbGlzdC1pdGVtIG5nLXJlcGVhdD1cXFwiZmllbGREZWYgaW4gZmllbGREZWZzIHwgb3JkZXJCeSA6IG9yZGVyQnlcXFwiIGZpZWxkLWRlZj1cXFwiZmllbGREZWZcXFwiIGZpbHRlci1tYW5hZ2VyPVxcXCJmaWx0ZXJNYW5hZ2VyXFxcIiBzaG93LWFkZD1cXFwic2hvd0FkZFxcXCIgbmctaWY9XFxcImZpZWxkRGVmLmhpZGRlbiE9XFwndHJ1ZVxcJ1xcXCI+PC9zY2hlbWEtbGlzdC1pdGVtPjxzY2hlbWEtbGlzdC1pdGVtIG5nLWlmPVxcXCJzaG93Q291bnRcXFwiIGZpZWxkLWRlZj1cXFwiY291bnRGaWVsZERlZlxcXCIgc2hvdy1hZGQ9XFxcInRydWVcXFwiPjwvc2NoZW1hLWxpc3QtaXRlbT48c2NoZW1hLWxpc3QtaXRlbSBmaWVsZC1kZWY9XFxcImNhbGNGaWVsZERlZlxcXCIgc2hvdy1hZGQ9XFxcInRydWVcXFwiPjwvc2NoZW1hLWxpc3QtaXRlbT48ZGl2IGNsYXNzPVxcXCJzY2hlbWEtbGlzdC1kcm9wXFxcIiBuZy1zaG93PVxcXCJzaG93RHJvcFxcXCIgbmctbW9kZWw9XFxcImRyb3BwZWRGaWVsZERlZlxcXCIgZGF0YS1kcm9wPVxcXCJ0cnVlXFxcIiBqcXlvdWktZHJvcHBhYmxlPVxcXCJ7b25Ecm9wOlxcJ2ZpZWxkRHJvcHBlZFxcJ31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj5DcmVhdGUgYSBuZXcgd2lsZGNhcmQuPC9kaXY+PC9kaXY+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiY29tcG9uZW50cy9zY2hlbWFsaXN0L3NjaGVtYWxpc3RpdGVtLmh0bWxcIixcIjxkaXYgY2xhc3M9XFxcInNjaGVtYS1saXN0LWl0ZW1cXFwiIG5nLW1vZGVsPVxcXCJkcm9wcGVkRmllbGREZWZcXFwiIGRhdGEtZHJvcD1cXFwiaXNBbnlGaWVsZCAmJiBmaWVsZERlZi5maWVsZCAhPT0gXFwnP1xcJ1xcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie29uRHJvcDpcXCdmaWVsZERyb3BwZWRcXCd9XFxcIiBkYXRhLWpxeW91aS1vcHRpb25zPVxcXCJ7YWN0aXZlQ2xhc3M6IFxcJ2Ryb3AtYWN0aXZlXFwnfVxcXCI+PGZpZWxkLWluZm8gbmctc2hvdz1cXFwiIWlzQW55RmllbGQgfHwgZmllbGREZWYuZmllbGQgPT09IFxcJz9cXCcgfHwgZmllbGREZWYuZmllbGQuZW51bS5sZW5ndGggPiAwXFxcIiBjbGFzcz1cXFwicGlsbCBkcmFnZ2FibGUgZnVsbC13aWR0aCBuby1yaWdodC1tYXJnaW5cXFwiIG5nLWNsYXNzPVxcXCJ7YW55OiBpc0VudW1TcGVjKGZpZWxkRGVmLmZpZWxkKX1cXFwiIGZpZWxkLWRlZj1cXFwiZmllbGREZWZcXFwiIG5nLW1vZGVsPVxcXCJwaWxsXFxcIiBkYXRhLWRyYWc9XFxcInRydWVcXFwiIGpxeW91aS1kcmFnZ2FibGU9XFxcIntwbGFjZWhvbGRlcjogXFwna2VlcFxcJywgZGVlcENvcHk6IHRydWUsIG9uU3RhcnQ6IFxcJ2ZpZWxkRHJhZ1N0YXJ0XFwnLCBvblN0b3A6XFwnZmllbGREcmFnU3RvcFxcJ31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcIntyZXZlcnQ6IFxcJ2ludmFsaWRcXCcsIGhlbHBlcjogXFwnY2xvbmVcXCd9XFxcIiBzaG93LWFkZD1cXFwic2hvd0FkZFxcXCIgc2hvdy1jYXJldD1cXFwidHJ1ZVxcXCIgZGlzYWJsZS1jYXJldD1cXFwiZmllbGREZWYuaW1tdXRhYmxlIHx8IGZpZWxkRGVmLmFnZ3JlZ2F0ZSA9PT0gXFwnY291bnRcXCcgfHwgYWxsb3dlZFR5cGVzLmxlbmd0aDw9MVxcXCIgc2hvdy10eXBlPVxcXCJ0cnVlXFxcIiBhZGQtYWN0aW9uPVxcXCJmaWVsZEFkZChmaWVsZERlZilcXFwiIHNob3ctZmlsdGVyPVxcXCIhIWZpbHRlck1hbmFnZXJcXFwiIGZpbHRlci1hY3Rpb249XFxcInRvZ2dsZUZpbHRlcigpXFxcIiB1c2UtdGl0bGU9XFxcInRydWVcXFwiIHBvcHVwLWNvbnRlbnQ9XFxcImZpZWxkSW5mb1BvcHVwQ29udGVudFxcXCI+PC9maWVsZC1pbmZvPjwvZGl2PjxkaXYgY2xhc3M9XFxcImRyb3AtY29udGFpbmVyXFxcIj48ZGl2IGNsYXNzPVxcXCJwb3B1cC1tZW51IHNjaGVtYS1tZW51XFxcIiBuZy1oaWRlPVxcXCIhYWxsb3dlZFR5cGVzIHx8IGFsbG93ZWRUeXBlcy5sZW5ndGg8PTFcXFwiPjxkaXYgY2xhc3M9XFxcIm1iNSBmaWVsZC10eXBlXFxcIiBuZy1pZj1cXFwiYWxsb3dlZFR5cGVzLmxlbmd0aD4xICYmICFpc0FueUZpZWxkXFxcIj48aDQ+VHlwZTwvaDQ+PGxhYmVsIGNsYXNzPVxcXCJ0eXBlLWxhYmVsXFxcIiBuZy1yZXBlYXQ9XFxcInR5cGUgaW4gYWxsb3dlZFR5cGVzXFxcIiBuZy1pZj1cXFwidHlwZSAhPT0gXFwnb3JkaW5hbFxcJyB8fCAhY29uc3RzLmhpZGVPcmRpbmFsVHlwZVNlbGVjdFxcXCI+PGlucHV0IHR5cGU9XFxcInJhZGlvXFxcIiBuZy12YWx1ZT1cXFwidHlwZVxcXCIgbmctbW9kZWw9XFxcImZpZWxkRGVmLnR5cGVcXFwiPiB7e3R5cGV9fTwvbGFiZWw+PC9kaXY+PGRpdiBjbGFzcz1cXFwid2lsZGNhcmQtbWVudVxcXCIgbmctc2hvdz1cXFwiaXNBbnlGaWVsZCAmJiBmaWVsZERlZi5maWVsZC5lbnVtXFxcIj48ZGl2PjxsYWJlbCBjbGFzcz1cXFwid2lsZGNhcmQtdGl0bGUtbGFiZWxcXFwiPjxoND5OYW1lPC9oND48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmctbW9kZWw9XFxcImZpZWxkRGVmLnRpdGxlXFxcIiBwbGFjZWhvbGRlcj1cXFwie3tmaWVsZFRpdGxlKGZpZWxkRGVmLmZpZWxkKX19XFxcIj48L2xhYmVsPjwvZGl2PjxoND5XaWxkY2FyZCBGaWVsZHM8L2g0PjxkaXYgY2xhc3M9XFxcIndpbGRjYXJkLWZpZWxkc1xcXCI+PGZpZWxkLWluZm8gbmctcmVwZWF0PVxcXCJmaWVsZCBpbiBmaWVsZERlZi5maWVsZC5lbnVtXFxcIiBjbGFzcz1cXFwicGlsbCBsaXN0LWl0ZW0gZnVsbC13aWR0aCBuby1yaWdodC1tYXJnaW5cXFwiIGZpZWxkLWRlZj1cXFwiZmllbGQgPT09IFxcJypcXCcgPyBjb3VudEZpZWxkRGVmIDogRGF0YXNldC5zY2hlbWEuZmllbGRTY2hlbWEoZmllbGQpXFxcIiBzaG93LXR5cGU9XFxcInRydWVcXFwiIHNob3ctcmVtb3ZlPVxcXCJ0cnVlXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVXaWxkY2FyZEZpZWxkKCRpbmRleClcXFwiPjwvZmllbGQtaW5mbz48L2Rpdj48YSBjbGFzcz1cXFwicmVtb3ZlLWFjdGlvblxcXCIgbmctY2xpY2s9XFxcInJlbW92ZVdpbGRjYXJkKClcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10aW1lc1xcXCI+PC9pPiBEZWxldGUgV2lsZGNhcmQ8L2E+PC9kaXY+PC9kaXY+PC9kaXY+XCIpO1xuJHRlbXBsYXRlQ2FjaGUucHV0KFwiY29tcG9uZW50cy9zaGVsdmVzL3NoZWx2ZXMuaHRtbFwiLFwiPGRpdiBjbGFzcz1cXFwiY2FyZCB2ZmxleCBzaGVsdmVzIG5vLXRvcC1tYXJnaW4gbm8tcmlnaHQtbWFyZ2luIGFicy0xMDBcXFwiPjxkaXYgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjogcmVsYXRpdmU7XFxcIiBuZy1tb3VzZW92ZXI9XFxcInNob3dtYXJrdHlwZT10cnVlXFxcIiBuZy1tb3VzZWxlYXZlPVxcXCJzaG93bWFya3R5cGU9ZmFsc2VcXFwiPjxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwic2VsZWN0LWJ0blxcXCIgbmctY2xpY2s9XFxcInNob3dtYXJrdHlwZSA9ICFzaG93bWFya3R5cGVcXFwiPjxpIGNsYXNzPVxcXCJmYSB7eyBtYXJrZGV0YWlsLmljb24gfX1cXFwiPnt7IG1hcmtkZXRhaWwudGl0bGUgfX08L2k+PC9idXR0b24+PHVsIGNsYXNzPVxcXCJtYXJrdHlwZS1saXN0XFxcIiBuZy1zaG93PVxcXCJzaG93bWFya3R5cGVcXFwiPjxsaSBuZy1yZXBlYXQ9XFxcInR5cGUgaW4gbWFya3NXaXRoQW55IHRyYWNrIGJ5ICRpbmRleFxcXCIgbmctY2xpY2s9XFxcImNoYW5nZXR5cGUodHlwZSlcXFwiIHN0eWxlPVxcXCJjdXJzb3I6aGFuZDtcXFwiPjxpIGNsYXNzPVxcXCJmYSB7eyBtYXJrc2ljb25bdHlwZV0uaWNvbiB9fVxcXCIgc3R5bGU9XFxcIndpZHRoOjIwcHhcXFwiPjwvaT4ge3sgbWFya3NpY29uW3R5cGVdLnRpdGxlIH19PC9saT48L3VsPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtZW5jb2RpbmctcGFuZSBmdWxsLXdpZHRoXFxcIj48aDIgbmctc2hvdz1cXFwic3BlYy5tYXJrICE9IFxcJ3NpbmdsZVxcJ1xcXCIgbmctY2xpY2s9XFxcInRpdGxlU2hvdyA9ICF0aXRsZVNob3dcXFwiPuWfuuehgOmFjee9rjwvaDI+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1wb3NpdGlvbmFsLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrICE9IFxcJ3NpbmdsZVxcJyAmJiB0aXRsZVNob3dcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuagh+mimDwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctYmx1cj1cXFwic2V0Tm9ybWFsVGl0bGUoXFwndGl0bGVcXCcpO1xcXCIgbmctbW9kZWw9XFxcIm5vcm1hbFRpdGxlXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7moIfpopjlpKflsI88L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogODAlO21hcmdpbjogMDtcXFwiIHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBtaW49XFxcIjVcXFwiIG1heD1cXFwiMTAwXFxcIiBtb2RlbC1tYXg9XFxcImVjY29uZmlnLnRpdGxlLnRleHRTdHlsZS5mb250U2l6ZVxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjI1cHg7XFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcudGl0bGUudGV4dFN0eWxlLmZvbnRTaXplXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrICE9IFxcJ3NpbmdsZVxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7popzoibI8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggY29sb3ItaW5wdXQtdGl0bGVcXFwiIG5nLWJsdXI9XFxcInNldENvbG9yKFxcJ2J0XFwnKVxcXCIgcmVsPVxcXCJidFxcXCIgbmctbW9kZWw9XFxcInRpdGxldGV4dGNvbG9yXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrICE9IFxcJ3NpbmdsZVxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lia/moIfpopg8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLWJsdXI9XFxcInNldE5vcm1hbFRpdGxlKFxcJ3N1Yl90aXRsZVxcJyk7XFxcIiBuZy1tb2RlbD1cXFwibm9ybWFsU3ViVGl0bGVcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgIT0gXFwnc2luZ2xlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuagh+mimOWkp+WwjzwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxkaXYgc3R5bGU9XFxcIndpZHRoOiA4MCU7bWFyZ2luOiAwO1xcXCIgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIG1pbj1cXFwiMTBcXFwiIG1heD1cXFwiMjRcXFwiIG1vZGVsLW1heD1cXFwiZWNjb25maWcudGl0bGUuc3VidGV4dFN0eWxlLmZvbnRTaXplXFxcIiBwaW4taGFuZGxlPVxcXCJtaW5cXFwiPjwvZGl2PjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBzdHlsZT1cXFwid2lkdGg6MjVweDtcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy50aXRsZS5zdWJ0ZXh0U3R5bGUuZm9udFNpemVcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgIT0gXFwnc2luZ2xlXFwnXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuminOiJsjwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZnVsbC13aWR0aCBjb2xvci1pbnB1dC10aXRsZVxcXCIgbmctYmx1cj1cXFwic2V0Q29sb3IoXFwnc2J0XFwnKVxcXCIgcmVsPVxcXCJzYnRcXFwiIG5nLW1vZGVsPVxcXCJzdWJ0aXRsZXRleHRjb2xvclxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayAhPSBcXCdzaW5nbGVcXCdcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5pi+56S65L2N572uPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PHNlbGVjdCBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLnRpdGxlLnBvc2l0aW9uXFxcIj48b3B0aW9uIHZhbHVlPVxcXCJ1cGxlZnRcXFwiPuW3puS4ijwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInVwY2VudGVyXFxcIj7kuIrkuK3lv4M8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJ1cHJpZ2h0XFxcIj7lj7PkuIo8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJkb3dubGVmdFxcXCI+5bem5LiLPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZG93bmNlbnRlclxcXCI+5LiL5Lit5b+DPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZG93bnJpZ2h0XFxcIj7lj7PkuIs8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLW1hcmtzLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrICE9IFxcJ2JtYXBcXCcgJiYgc3BlYy5tYXJrICE9IFxcJ3NpbmdsZVxcJyAmJiB0aGVtZVNob3dcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuS4u+mimOagt+W8jzwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy50aGVtZVxcXCI+PG9wdGlvbiB2YWx1ZT1cXFwiZGVmXFxcIj7pu5jorqQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJyYWJvd1xcXCI+5b2p6Jm5PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwid2FybVxcXCI+5rip5pqWPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwibHNvZnRcXFwiPui9u+aflDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInhjXFxcIj7ngqvlvak8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJibHVlXFxcIj7ok53oibI8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJyZWRcXFwiPue6ouiJsjwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImdyZWVuXFxcIj7nu7/oibI8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJkYXludFxcXCI+5pma6ZyePC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwic290Y1xcXCI+5p+U5b2pPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwic29mdFxcXCI+5p+U5ZKMPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiYnVzaVxcXCI+5ZWG5YqhPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwidG9sZFxcXCI+5oCA5penPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZmV0dXJlXFxcIj7mnKrmnaU8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJnZWRcXFwiPuagvOiwgzwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImh1b2xcXFwiPua0u+WKmzwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInJvY2txXFxcIj7nn7PpnZI8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJtb2Rlcm5cXFwiPueOsOS7ozwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInZpdGFsaXR5XFxcIj7mtLvlipvlm5vlsIQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJncmVlbkdhcmRlblxcXCI+57u/6Imy6Iqx5ZutPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwicm9tYW5cXFwiPue0q+S4gemmmTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInB1cnBsZVxcXCI+57Sr572X5YWwPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiYWlyXFxcIj7muIXmlrDnqbrmsJQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJNVFxcXCI+TVTmoIflh4boibI8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnYm1hcFxcJyAmJiBlY2NvbmZpZy5tYXBkYXRhLmlmQm1hcCAhPSBcXCcxXFwnICYmIHRoZW1lU2hvd1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lnLDlm77moLflvI88L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48c2VsZWN0IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubWFwZGF0YS5tYXBfdGhlbWVcXFwiPjxvcHRpb24gdmFsdWU9XFxcImxpZ2h0XFxcIj7mmI48L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJkYXJrXFxcIj7mmpc8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48aDIgbmctY2xpY2s9XFxcInByb3BTaG93ID0gIXByb3BTaG93XFxcIj7mlbDmja7lhbPogZQ8L2gyPjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnc2luZ2xlXFwnICYmIHByb3BTaG93XFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7moIfpopg8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLWJsdXI9XFxcInNldE5vcm1hbFRpdGxlKFxcJ3RpdGxlXFwnKTtcXFwiIG5nLW1vZGVsPVxcXCJub3JtYWxUaXRsZVxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn57u05bqmXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnhcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3hcXCcsXFwnMFxcJylcXFwiIG5nLXNob3c9XFxcImVjY29uZmlnLmZpZWxkLnlbMF0mJmVjY29uZmlnLmZpZWxkLnlbMF0uYWdncmVnYXRlPT1cXCdyYW5rXFwnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5YiG57uEXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLmdyb3VwXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCdncm91cFxcJyxcXCcxXFwnKVxcXCIgbmctc2hvdz1cXFwiZWNjb25maWcuZmllbGQueVswXSYmZWNjb25maWcuZmllbGQueVswXS5hZ2dyZWdhdGU9PVxcJ3JhbmtcXCdcXFwiPjwvZWMtY2hhbm5lbD48ZWMtY2hhbm5lbCBkcm9wLXR5cGU9XFxcIlxcJ3NpbmdsZVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+W6pumHj1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzBcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJ5dmFsXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJywkaW5kZXgpXFxcIiBuZy1yZXBlYXQ9XFxcInl2YWwgaW4gZWNjb25maWcuZmllbGQueSB0cmFjayBieSAkaW5kZXhcXFwiIGZpZWxkPVxcXCJ5dmFsXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctc2hvdz1cXFwiZWNjb25maWcuZmllbGQueS5sZW5ndGggPCA0XFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCIgbmctbW9kZWw9XFxcInNpbmdsZU1vZGVsXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwnc2luZ2xlRmllbGREcm9wXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxzcGFuIGNsYXNzPVxcXCJwbGFjZWhvbGRlclxcXCI+5ouW5Yqo5a2X5q615Yiw5q2k5aSE57uf6K6h5bqm6YeP5bqmPC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtZWNoYXJ0LXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ3BpZVxcJyAmJiBwcm9wU2hvd1xcXCI+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn57u05bqmXFwnXFxcIiBkcm9wLXR5cGU9XFxcIlxcJ2xhYmVsXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzBcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJ4a2V5XFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneFxcJywkaW5kZXgpXFxcIiBuZy1yZXBlYXQ9XFxcInh2YWwgaW4gZWNjb25maWcuZmllbGQueCB0cmFjayBieSAkaW5kZXhcXFwiIGZpZWxkPVxcXCJ4dmFsXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiIG5nLW1vZGVsPVxcXCJwaWV4bW9kZWxcXFwiIGRhdGEtZHJvcD1cXFwidHJ1ZVxcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie29uRHJvcDpcXCdwaWV4RmllbGREcm9wXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxzcGFuIGNsYXNzPVxcXCJwbGFjZWhvbGRlclxcXCI+5ouW5Yqo5a2X5q615Yiw5q2k5aSE57uf6K6h57u05bqmPC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+W6pumHj1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC55XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLW1hcmtzLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ21peGVkXFwnICYmIHByb3BTaG93XFxcIj48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfnu7TluqZcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjaGFubmVsLWtleT1cXFwiXFwnMFxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIG1vcmUtZHJhZz1cXFwiXFwndHJ1ZVxcJ1xcXCIgZHJvcC10eXBlPVxcXCJcXCdtaXhlZHR5cGVcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBkcm9wLXR5cGU9XFxcIlxcJ3R5cGVcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMFxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsJGluZGV4KVxcXCIgbmctcmVwZWF0PVxcXCJ5dmFsIGluIGVjY29uZmlnLmZpZWxkLnkgdHJhY2sgYnkgJGluZGV4XFxcIiBmaWVsZD1cXFwieXZhbFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwieW1vZGVsXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwnbWl4ZWR5RmllbGREcm9wXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxzcGFuIGNsYXNzPVxcXCJwbGFjZWhvbGRlclxcXCI+5ouW5Yqo5pWw5YC857G75a2X5q615Yiw5q2k5aSE57uf6K6h5bqm6YePPC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnY2FuZGxlc3RpY2tcXCcgJiYgcHJvcFNob3dcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiBtb3JlLWRyYWc9XFxcIlxcJ3RydWVcXCdcXFwiIGRyb3AtdHlwZT1cXFwiXFwnY2FuZGxlc3RpY2tcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwnc3RhcnRcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3N0YXJ0XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQuc3RhcnRcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ2VuZFxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwnZW5kXFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQuZW5kXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCdtYXhcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ21heFxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLm1heFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwnbWluXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCdtaW5cXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC5taW5cXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+W6pumHj1xcJ1xcXCIgZHJvcC10eXBlPVxcXCJcXCdjYW5kbGVzdGlja3R5cGVcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMFxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsJGluZGV4KVxcXCIgbmctcmVwZWF0PVxcXCJ5dmFsIGluIGVjY29uZmlnLmZpZWxkLnkgdHJhY2sgYnkgJGluZGV4XFxcIiBmaWVsZD1cXFwieXZhbFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwieW1vZGVsXFxcIiBkYXRhLWRyb3A9XFxcInRydWVcXFwiIGpxeW91aS1kcm9wcGFibGU9XFxcIntvbkRyb3A6XFwna3lGaWVsZERyb3BcXCd9XFxcIiBkYXRhLWpxeW91aS1vcHRpb25zPVxcXCJ7YWN0aXZlQ2xhc3M6IFxcJ2Ryb3AtYWN0aXZlXFwnfVxcXCI+PHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIj7mi5bliqjmlbDlgLznsbvlrZfmrrXliLDmraTlpITnu5/orqHluqbph488L3NwYW4+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1lY2hhcnQtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnd29yZENsb3VkXFwnICYmIHByb3BTaG93XFxcIj48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfnu7TluqZcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneFxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnhbMF1cXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+W6pumHj1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnlcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtZWNoYXJ0LXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ3RyZWVtYXBcXCcgJiYgcHJvcFNob3dcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFswXVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd5XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1lY2hhcnQtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwndHJlZVxcJyAmJiBwcm9wU2hvd1xcXCI+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn57u05bqmXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3hcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC54XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfluqbph49cXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC55XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCflhbPogZRcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMFxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3JlbGF0ZVxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnJlbGF0ZVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1lY2hhcnQtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnZ3JhcGhcXCcgJiYgcHJvcFNob3dcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFswXVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd5XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5YWz6IGUXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCdyZWxhdGVcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC5yZWxhdGVcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtZWNoYXJ0LXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ3N1bmJ1cnN0XFwnICYmIHByb3BTaG93XFxcIj48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfnu7TluqZcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneFxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnhbMF1cXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+W6pumHj1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnlcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+WFs+iBlFxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwncmVsYXRlXFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQucmVsYXRlXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLWVjaGFydC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayA9PSBcXCdmdW5uZWxcXCcgJiYgcHJvcFNob3dcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFswXVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd5XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1wb3NpdGlvbmFsLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ2dhdWdlXFwnICYmIHByb3BTaG93XFxcIj48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfluqbph49cXCcrKCRpbmRleCsxKVxcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIG1vcmUtZHJhZz1cXFwiXFwndHJ1ZVxcJ1xcXCIgZHJvcC10eXBlPVxcXCJcXCdzdHlsZVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJywkaW5kZXgpXFxcIiBuZy1yZXBlYXQ9XFxcImdhdWdlbW9kYWwgaW4gZWNjb25maWcuZmllbGQueSB0cmFjayBieSAkaW5kZXhcXFwiIGZpZWxkPVxcXCJnYXVnZW1vZGFsXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCIgbmctc2hvdz1cXFwiZWNjb25maWcuZmllbGQueS5sZW5ndGggPCAzXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCIgbmctbW9kZWw9XFxcImdhdWdlWVxcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGRhdGEtZHJvcD1cXFwidHJ1ZVxcXCIganF5b3VpLWRyb3BwYWJsZT1cXFwie29uRHJvcDpcXCdnYXVnZVlGaWVsZERyb3BcXCd9XFxcIiBkYXRhLWpxeW91aS1vcHRpb25zPVxcXCJ7YWN0aXZlQ2xhc3M6IFxcJ2Ryb3AtYWN0aXZlXFwnfVxcXCI+PHNwYW4gY2xhc3M9XFxcInBsYWNlaG9sZGVyXFxcIj7mi5bliqjmlbDlgLznsbvlrZfmrrXliLDmraTlpITnu5/orqHluqbph488L3NwYW4+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1wb3NpdGlvbmFsLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ2JtYXBcXCcgJiYgcHJvcFNob3dcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJ0YWIgYWN0aXZlXFxcIiBuZy1jbGFzcz1cXFwie1xcJ3RhYjFcXCc6XFwndGFiLWFjdGl2ZVxcJ31bdGFiXVxcXCIgbmctY2xpY2s9XFxcInNldFRhYihcXCd0YWIxXFwnKTtcXFwiPuWMuuWfnzwvZGl2PjxkaXYgY2xhc3M9XFxcInRhYlxcXCIgbmctY2xhc3M9XFxcIntcXCd0YWIyXFwnOlxcJ3RhYi1hY3RpdmVcXCd9W3RhYl1cXFwiIG5nLWNsaWNrPVxcXCJzZXRUYWIoXFwndGFiMlxcJyk7XFxcIj7moIforrA8L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnYm1hcFxcJyAmJiB0YWIgPT0gXFwndGFiMVxcJyAmJiBwcm9wU2hvd1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLWlmPVxcXCJlY2NvbmZpZy5tYXBkYXRhLmlmQm1hcCA9PSBcXCcxXFwnXFxcIj7nmb7luqblnLDlm77kuI3mlK/mjIHljLrln5/mlbDmja7lsZXnpLo8L2Rpdj48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfljLrln5/lnLDljLpcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjaGFubmVsLWtleT1cXFwiXFwnMFxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlQXJlYShcXCd4XFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmFyZWEueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5Yy65Z+f5pWw5YC8XFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVBcmVhKFxcJ3lcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuYXJlYS55XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1yZXBlYXQ9XFxcInBvaW50cm93IGluIGVjY29uZmlnLnBvaW50IHRyYWNrIGJ5ICRpbmRleFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ2JtYXBcXCcgJiYgdGFiID09IFxcJ3RhYjJcXCcgJiYgcHJvcFNob3dcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+agh+iusOWcsOWMulxcJ1xcXCIgZHJvcC10eXBlPVxcXCJcXCdtYXBwb2ludFxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiBjaGFubmVsLWtleT1cXFwiXFwnMFxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlUG9pbnQoXFwneFxcJywkaW5kZXgpXFxcIiBmaWVsZD1cXFwicG9pbnRyb3cueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5qCH6K6w5pWw5YC8XFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVQb2ludChcXCd5XFwnLCRpbmRleClcXFwiIGZpZWxkPVxcXCJwb2ludHJvdy55XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfnu4/luqZcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcwXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZVBvaW50KFxcJ2xvblxcJywkaW5kZXgpXFxcIiBmaWVsZD1cXFwicG9pbnRyb3cubG9uXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfnuqzluqZcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcwXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZVBvaW50KFxcJ2xhdFxcJywkaW5kZXgpXFxcIiBmaWVsZD1cXFwicG9pbnRyb3cubGF0XFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLXBvc2l0aW9uYWwtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnYm1hcFxcJyAmJiB0YWIgPT0gXFwndGFiMlxcJyAmJiBwcm9wU2hvd1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLXNob3c9XFxcImVjY29uZmlnLnBvaW50Lmxlbmd0aCA8IDNcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIiBuZy1tb2RlbD1cXFwicG9pbnRNb2RlbFxcXCIgZGF0YS1kcm9wPVxcXCJ0cnVlXFxcIiBqcXlvdWktZHJvcHBhYmxlPVxcXCJ7b25Ecm9wOlxcJ3BvaW50RmllbGREcm9wXFwnfVxcXCIgZGF0YS1qcXlvdWktb3B0aW9ucz1cXFwie2FjdGl2ZUNsYXNzOiBcXCdkcm9wLWFjdGl2ZVxcJ31cXFwiPjxzcGFuIGNsYXNzPVxcXCJwbGFjZWhvbGRlclxcXCI+5ouW5Yqo5Zyw5Yy65a2X5q615Yiw5q2k5aSE5aKe5Yqg5qCH6K6wPC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtcG9zaXRpb25hbC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLWlmPVxcXCJzcGVjLm1hcmsgPT0gXFwnYm1hcFxcJyAmJiBwcm9wU2hvd1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5Zyw5Zu+5YyFPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PHNlbGVjdCBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLm1hcGJhZ1xcXCI+PG9wdGlvbiB2YWx1ZT1cXFwiY2hpbmFcXFwiPuS4reWbvTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInNoYW5naGFpXFxcIj7kuIrmtbc8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7nmb7luqblnLDlm748L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJzFcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCcyXFwnXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubWFwZGF0YS5pZkJtYXBcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnZGJhclxcJyAmJiBwcm9wU2hvd1xcXCI+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn57u05bqmXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5qiq6L205bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzBcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd5XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueVswXVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn57q16L205bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGRyb3AtdHlwZT1cXFwiXFwnZGJhclxcJ1xcXCIgcmVtb3ZlLWFjdGlvbj1cXFwicmVtb3ZlTWl4KFxcJ3lcXCcsXFwnMVxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC55WzFdXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLW1hcmtzLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwic3BlYy5tYXJrID09IFxcJ3NjYXR0ZXJcXCcgJiYgcHJvcFNob3dcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNoYW5uZWwta2V5PVxcXCJcXCcwXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneFxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnhcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+aoqui9tOW6pumHj1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJyxcXCcwXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnlbMF1cXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e6tei9tOW6pumHj1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcm9wPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVNaXgoXFwneVxcJyxcXCcxXFwnKVxcXCIgZmllbGQ9XFxcImVjY29uZmlnLmZpZWxkLnlbMV1cXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwncmFkYXJcXCcgJiYgcHJvcFNob3dcXFwiPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+WIhuexu1xcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCdsZWdlbmRcXCcsXFwnMFxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWVsZC5sZWdlbmRcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxlYy1jaGFubmVsIGNoYW5uZWwtdGl0bGU9XFxcIlxcJ+e7tOW6plxcJ1xcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd4XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bqm6YePXFwnXFxcIiBjYW4tZHJhZz1cXFwiXFwnMVxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZU1peChcXCd5XFwnLFxcJzBcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmllbGQueVxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PC9kaXY+PGgyIG5nLXNob3c9XFxcImhhc09wdGlvbihzcGVjLm1hcmspXFxcIiBuZy1jbGljaz1cXFwib3B0aW9uU2hvdyA9ICFvcHRpb25TaG93XFxcIj7mianlsZXpgInpobk8L2gyPjxkaXYgY2xhc3M9XFxcInNoZWxmLXBhbmUgc2hlbGYtbWFya3MtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwnbWl4ZWRcXCcgJiYgb3B0aW9uU2hvd1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5ZCI5bm2PC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCcxXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnMlxcJ1xcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLmlmbWVyZ2VcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPue8qeaUvjwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnMVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJzJcXCdcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5yb29taW5vdXRcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPui9rOe9rjwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnMVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJzJcXCdcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy50cmFuc3Bvc2VcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPue+juWMlumrmOS9juWAvDwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnMVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJzJcXCdcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5iZWF1dHlcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuWAvuaWnOagh+etvjwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnMVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJzJcXCdcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5yb2F0ZXRleHRcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPumakOiXj+WdkOagh+ezuzwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnMVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJzJcXCdcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5zaG93YXhpc1xcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5Z2Q5qCH57O75YaF572uPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCcxXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnMlxcJ1xcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLmF4aXNpblxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+6ZqQ6JeP5YiG6ZqU57q/PC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCcxXFwnXFxcIiBuZy1mYWxzZS12YWx1ZT1cXFwiXFwnMlxcJ1xcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLnNob3dheGlzc3BsaXRsaW5lXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7mn7Hop5LlvKfluqY8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogODAlO21hcmdpbjogMDtcXFwiIHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBtaW49XFxcIjBcXFwiIG1heD1cXFwiMTAwXFxcIiBtb2RlbC1tYXg9XFxcImVjY29uZmlnLmJhcnJhZGl1c1xcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjI1cHg7XFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcuYmFycmFkaXVzXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLW1hcmtzLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctaWY9XFxcInNwZWMubWFyayA9PSBcXCd3b3JkQ2xvdWRcXCcgJiYgb3B0aW9uU2hvd1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+6K+N5LqR5b2i54q2PC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PHNlbGVjdCBjbGFzcz1cXFwiZnVsbC13aWR0aFxcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLnNoYXBlXFxcIj48b3B0aW9uIHZhbHVlPVxcXCJjaXJjbGVcXFwiPmNpcmNsZTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImNhcmRpb2lkXFxcIj5jYXJkaW9pZDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcImRpYW1vbmRcXFwiPmRpYW1vbmQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJ0cmlhbmdsZS1mb3J3YXJkXFxcIj50cmlhbmdsZS1mb3J3YXJkPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwidHJpYW5nbGVcXFwiPnRyaWFuZ2xlPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwicGVudGFnb25cXFwiPnBlbnRhZ29uPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwic3RhclxcXCI+c3Rhcjwvb3B0aW9uPjwvc2VsZWN0PjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWxcXFwiPuWNleivjeWkp+WwjzwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxkaXYgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTttYXJnaW46IDA7XFxcIiBzaG93LXZhbHVlcz1cXFwidHJ1ZVxcXCIgc3RlcD1cXFwiMVxcXCIgbWluPVxcXCIxMFxcXCIgbWF4PVxcXCIxMDBcXFwiIG1vZGVsLW1pbj1cXFwiZWNjb25maWcuc2l6ZVJhbmdlWzBdXFxcIiBtb2RlbC1tYXg9XFxcImVjY29uZmlnLnNpemVSYW5nZVsxXVxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1tYXJrcy1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLWlmPVxcXCJzcGVjLm1hcmsgPT0gXFwnc2luZ2xlXFwnICYmIG9wdGlvblNob3dcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuW9ouW8jzwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxzZWxlY3QgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy50eXBlXFxcIj48b3B0aW9uIHZhbHVlPVxcXCJjYXJkXFxcIj7mjIfmoIfljaE8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJsaXN0XFxcIj7mjIfmoIfmnaE8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lsI/mlbDngrk8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGhcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5vcHRpb24uZml4ZWRcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuaYvuekuuWNg+WIhuS9jTwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwidHJ1ZVxcXCIgbmctZmFsc2UtdmFsdWU9XFxcImZhbHNlXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcub3B0aW9uLnRob3VzYW5kc1xcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLXNob3c9XFxcImVjY29uZmlnLnR5cGUgPT0gXFwnY2FyZFxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lpJbmoYbpopzoibI8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggY29sb3ItaW5wdXQtc2luZ2xlXFxcIiBuZy1ibHVyPVxcXCJzZXRDb2xvcihcXCdzdHJva2VcXCcpXFxcIiByZWw9XFxcInN0cm9rZVxcXCIgbmctbW9kZWw9XFxcInN0cm9rZV9jb2xvclxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiIG5nLXNob3c9XFxcImVjY29uZmlnLnR5cGUgPT0gXFwnY2FyZFxcJ1xcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7og4zmma/popzoibI8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgY2xhc3M9XFxcImZ1bGwtd2lkdGggY29sb3ItaW5wdXQtc2luZ2xlXFxcIiBuZy1ibHVyPVxcXCJzZXRDb2xvcihcXCdmaWxsXFwnKVxcXCIgcmVsPVxcXCJmaWxsXFxcIiBuZy1tb2RlbD1cXFwiZmlsbF9jb2xvclxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1lY2hhcnQtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJzcGVjLm1hcmsgPT0gXFwncGllXFwnICYmIG9wdGlvblNob3dcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuWchuW/g+i3neemuzwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxkaXYgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIG1pbj1cXFwiMFxcXCIgbWF4PVxcXCIxMDBcXFwiIG1vZGVsLW1heD1cXFwiZWNjb25maWcuc3RhcnRfcmFkaXVzXFxcIiBwaW4taGFuZGxlPVxcXCJtaW5cXFwiIHN0eWxlPVxcXCJ3aWR0aDo4MCU7bWFyZ2luOjBweFxcXCI+PC9kaXY+PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHN0eWxlPVxcXCJ3aWR0aDoyNXB4O1xcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLnN0YXJ0X3JhZGl1c1xcXCI+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7ltYzlpZfpl7TpmpQ8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48ZGl2IHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBtaW49XFxcIjBcXFwiIG1heD1cXFwiMTAwXFxcIiBtb2RlbC1tYXg9XFxcImVjY29uZmlnLnJhZGl1c19yYW5nZVxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIiBzdHlsZT1cXFwid2lkdGg6ODAlO21hcmdpbjowcHhcXFwiPjwvZGl2PjxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBzdHlsZT1cXFwid2lkdGg6MjVweDtcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5yYWRpdXNfcmFuZ2VcXFwiPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5aGr5YWF5a695bqmPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGRpdiByYW5nZS1zbGlkZXI9XFxcIlxcXCIgbWluPVxcXCIwXFxcIiBtYXg9XFxcIjEwMFxcXCIgbW9kZWwtbWF4PVxcXCJlY2NvbmZpZy5yYWRpdXNfaW50ZXJ2YWxcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCIgc3R5bGU9XFxcIndpZHRoOjgwJTttYXJnaW46MHB4XFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjI1cHg7XFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcucmFkaXVzX2ludGVydmFsXFxcIj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuWIhuaWreaYvuekujwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxkaXYgcmFuZ2Utc2xpZGVyPVxcXCJcXFwiIG1pbj1cXFwiMFxcXCIgbWF4PVxcXCIxMFxcXCIgbW9kZWwtbWF4PVxcXCJlY2NvbmZpZy5yYWRpdXNfc3BsaXRcXFwiIHBpbi1oYW5kbGU9XFxcIm1pblxcXCIgc3R5bGU9XFxcIndpZHRoOjgwJTttYXJnaW46MHB4XFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjI1cHg7XFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcucmFkaXVzX3NwbGl0XFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLWVjaGFydC1wYW5lIGZ1bGwtd2lkdGhcXFwiIG5nLXNob3c9XFxcInNwZWMubWFyayA9PSBcXCdnYXVnZVxcJyAmJiBvcHRpb25TaG93XFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lkIjlubY8L2Rpdj48ZGl2IGNsYWY9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnMVxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJzJcXCdcXFwiIG5nLW1vZGVsPVxcXCJlY2NvbmZpZy5pZm1lcmdlXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48aDIgbmctc2hvdz1cXFwiaGFzTGVnZW5kKHNwZWMubWFyaylcXFwiIG5nLWNsaWNrPVxcXCJsZWdlbmRTaG93ID0gIWxlZ2VuZFNob3dcXFwiPuWbvuS+izwvaDI+PGRpdiBjbGFzcz1cXFwic2hlbGYtcGFuZSBzaGVsZi1lY2hhcnQtcGFuZSBmdWxsLXdpZHRoXFxcIiBuZy1zaG93PVxcXCJoYXNMZWdlbmQoc3BlYy5tYXJrKSAmJiBsZWdlbmRTaG93XFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7mmL7npLrlm77kvos8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIG5nLXRydWUtdmFsdWU9XFxcIlxcJzFcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCcyXFwnXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubGVnZW5kLnNob3dcXFwiPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGYtbGFiZWwgZHJvcC10YXJnZXRcXFwiPuWbvuS+i+W5s+mTujwvZGl2PjxkaXYgY2xhc3M9XFxcImZpZWxkLWRyb3BcXFwiPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgbmctdHJ1ZS12YWx1ZT1cXFwiXFwnaG9yaXpvbnRhbFxcJ1xcXCIgbmctZmFsc2UtdmFsdWU9XFxcIlxcJ3ZlcnRpY2FsXFwnXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubGVnZW5kLm9yaWVudFxcXCI+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwic2hlbGYtZ3JvdXBcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1sYWJlbCBkcm9wLXRhcmdldFxcXCI+5rua5Yqo5Zu+5L6LPC9kaXY+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCI+PGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBuZy10cnVlLXZhbHVlPVxcXCJcXCdzY3JvbGxcXCdcXFwiIG5nLWZhbHNlLXZhbHVlPVxcXCJcXCdwbGFpblxcJ1xcXCIgbmctbW9kZWw9XFxcImVjY29uZmlnLmxlZ2VuZC50eXBlXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lm77kvovkvY3nva48L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48c2VsZWN0IGNsYXNzPVxcXCJmdWxsLXdpZHRoXFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubGVnZW5kLnBvc2l0aW9uXFxcIj48b3B0aW9uIHZhbHVlPVxcXCJ1cGxlZnRcXFwiPuW3puS4ijwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XFxcInVwY2VudGVyXFxcIj7kuIrkuK3lv4M8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJ1cHJpZ2h0XFxcIj7lj7PkuIo8L29wdGlvbj48b3B0aW9uIHZhbHVlPVxcXCJkb3dubGVmdFxcXCI+5bem5LiLPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZG93bmNlbnRlclxcXCI+5LiL5Lit5b+DPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cXFwiZG93bnJpZ2h0XFxcIj7lj7PkuIs8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1ncm91cFxcXCI+PGRpdiBjbGFzcz1cXFwic2hlbGZcXFwiPjxkaXYgY2xhc3M9XFxcInNoZWxmLWxhYmVsIGRyb3AtdGFyZ2V0XFxcIj7lm77kvovmloflrZc8L2Rpdj48ZGl2IGNsYXNzPVxcXCJmaWVsZC1kcm9wXFxcIj48ZGl2IHN0eWxlPVxcXCJ3aWR0aDogODAlO21hcmdpbjogMDtcXFwiIHJhbmdlLXNsaWRlcj1cXFwiXFxcIiBtaW49XFxcIjRcXFwiIG1heD1cXFwiMTAwXFxcIiBtb2RlbC1tYXg9XFxcImVjY29uZmlnLmxlZ2VuZC5mb250U2l6ZVxcXCIgcGluLWhhbmRsZT1cXFwibWluXFxcIj48L2Rpdj48aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgc3R5bGU9XFxcIndpZHRoOjI1cHg7XFxcIiBuZy1tb2RlbD1cXFwiZWNjb25maWcubGVnZW5kLmZvbnRTaXplXFxcIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48aDIgbmctY2xpY2s9XFxcImZpbHRlclNob3cgPSAhZmlsdGVyU2hvd1xcXCI+6L+H5ruk5p2h5Lu2PC9oMj48ZGl2IGNsYXNzPVxcXCJzaGVsZi1wYW5lIHNoZWxmLW1hcmtzLXBhbmUgZnVsbC13aWR0aFxcXCIgbmctc2hvdz1cXFwiZmlsdGVyU2hvd1xcXCI+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5bm05Lu9XFwnXFxcIiBkcm9wLXR5cGU9XFxcIlxcJ2ZpbHRlclxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVGaWx0ZXIoXFwneWVhclxcJylcXFwiIGZpZWxkPVxcXCJlY2NvbmZpZy5maWx0ZXIueWVhci5maWVsZFxcXCIgbW9kYWw9XFxcImVjY29uZmlnXFxcIj48L2VjLWNoYW5uZWw+PGVjLWNoYW5uZWwgY2hhbm5lbC10aXRsZT1cXFwiXFwn5pyI5Lu9XFwnXFxcIiBkcm9wLXR5cGU9XFxcIlxcJ2ZpbHRlclxcJ1xcXCIgY2FuLWRyb3A9XFxcIlxcJzFcXCdcXFwiIGNhbi1kcmFnPVxcXCJcXCcxXFwnXFxcIiByZW1vdmUtYWN0aW9uPVxcXCJyZW1vdmVGaWx0ZXIoXFwnbW9udGhcXCcpXFxcIiBmaWVsZD1cXFwiZWNjb25maWcuZmlsdGVyLm1vbnRoLmZpZWxkXFxcIiBtb2RhbD1cXFwiZWNjb25maWdcXFwiPjwvZWMtY2hhbm5lbD48ZWMtY2hhbm5lbCBjaGFubmVsLXRpdGxlPVxcXCJcXCfov4fmu6TlrZfmrrVcXCcrKCRpbmRleCsxKVxcXCIgY2FuLWRyYWc9XFxcIlxcJzFcXCdcXFwiIG1vcmUtZHJhZz1cXFwiXFwndHJ1ZVxcJ1xcXCIgZHJvcC10eXBlPVxcXCJcXCdmaWx0ZXJzXFwnXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgY2hhbm5lbC1rZXk9XFxcIlxcJ2ZpbHRlcnNcXCdcXFwiIHJlbW92ZS1hY3Rpb249XFxcInJlbW92ZUZpbHRlcihcXCdmaWx0ZXJzXFwnLCRpbmRleClcXFwiIG5nLXJlcGVhdD1cXFwiZmlsdGVybW9kYWwgaW4gZWNjb25maWcuZmlsdGVyLmZpbHRlcnMgdHJhY2sgYnkgJGluZGV4XFxcIiBmaWVsZD1cXFwiZmlsdGVybW9kYWxcXFwiIG1vZGFsPVxcXCJlY2NvbmZpZ1xcXCI+PC9lYy1jaGFubmVsPjxkaXYgY2xhc3M9XFxcInNoZWxmLWdyb3VwXFxcIj48ZGl2IGNsYXNzPVxcXCJzaGVsZlxcXCI+PGRpdiBjbGFzcz1cXFwiZmllbGQtZHJvcFxcXCIgbmctbW9kZWw9XFxcImZpbHRlcm1vZGFsXFxcIiBjYW4tZHJvcD1cXFwiXFwnMVxcJ1xcXCIgZGF0YS1kcm9wPVxcXCJ0cnVlXFxcIiBqcXlvdWktZHJvcHBhYmxlPVxcXCJ7b25Ecm9wOlxcJ2ZpbHRlckZpZWxkRHJvcFxcJ31cXFwiIGRhdGEtanF5b3VpLW9wdGlvbnM9XFxcInthY3RpdmVDbGFzczogXFwnZHJvcC1hY3RpdmVcXCd9XFxcIj48c3BhbiBjbGFzcz1cXFwicGxhY2Vob2xkZXJcXFwiPuaLluWKqOWtl+auteWIsOatpOWkhOi/m+ihjOi/h+a7pDwvc3Bhbj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj5cIik7XG4kdGVtcGxhdGVDYWNoZS5wdXQoXCJjb21wb25lbnRzL3RhYnMvdGFiLmh0bWxcIixcIjxkaXYgbmctaWY9XFxcImFjdGl2ZVxcXCIgbmctdHJhbnNjbHVkZT1cXFwiXFxcIj48L2Rpdj5cIik7XG4kdGVtcGxhdGVDYWNoZS5wdXQoXCJjb21wb25lbnRzL3RhYnMvdGFic2V0Lmh0bWxcIixcIjxkaXYgY2xhc3M9XFxcInRhYi1jb250YWluZXJcXFwiPjxkaXY+PGEgY2xhc3M9XFxcInRhYlxcXCIgbmctcmVwZWF0PVxcXCJ0YWIgaW4gdGFic2V0LnRhYnNcXFwiIG5nLWNsYXNzPVxcXCJ7XFwnYWN0aXZlXFwnOiB0YWIuYWN0aXZlfVxcXCIgbmctY2xpY2s9XFxcInRhYnNldC5zaG93VGFiKHRhYilcXFwiPnt7dGFiLmhlYWRpbmd9fTwvYT48L2Rpdj48ZGl2IGNsYXNzPVxcXCJ0YWItY29udGVudHNcXFwiIG5nLXRyYW5zY2x1ZGU9XFxcIlxcXCI+PC9kaXY+PC9kaXY+XCIpO31dKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5nZG9jIGZpbHRlclxyXG4gKiBAbmFtZSB2ZWdhLWxpdGUtdWkuZmlsdGVyOmluR3JvdXBcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAjIGluR3JvdXBcclxuICogR2V0IGRhdGFzZXRzIGluIGEgcGFydGljdWxhciBncm91cFxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGRhdGFzZXRHcm91cCBPbmUgb2YgXCJzYW1wbGUsXCIgXCJ1c2VyXCIsIG9yIFwibXlyaWFcIlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgb2YgZGF0YXNldHMgaW4gdGhlIHNwZWNpZmllZCBncm91cFxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5maWx0ZXIoJ2luR3JvdXAnLCBmdW5jdGlvbihfKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJyLCBkYXRhc2V0R3JvdXApIHtcclxuICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwge1xyXG4gICAgICAgIGdyb3VwOiBkYXRhc2V0R3JvdXBcclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgdmx1aS5kaXJlY3RpdmU6Y2hhbmdlTG9hZGVkRGF0YXNldFxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBjaGFuZ2VMb2FkZWREYXRhc2V0XHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmRpcmVjdGl2ZSgnY2hhbmdlTG9hZGVkRGF0YXNldCcsIGZ1bmN0aW9uIChEYXRhc2V0LCBfKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2RhdGFzZXQvY2hhbmdlbG9hZGVkZGF0YXNldC5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVxdWlyZTogJz9eXm1vZGFsJyxcclxuICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgc2NvcGU6IHRydWUsXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uIHBvc3RMaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbW9kYWxDb250cm9sbGVyKSB7XHJcbiAgICAgICAgLy8gSWYgdGhpcyBkaXJlY3RpdmUgb2NjdXJzIHdpdGhpbiBhIGEgbW9kYWwsIGdpdmUgb3Vyc2VsdmVzIGEgd2F5IHRvIGNsb3NlXHJcbiAgICAgICAgLy8gdGhhdCBtb2RhbCBvbmNlIHRoZSBhZGQgYnV0dG9uIGhhcyBiZWVuIGNsaWNrZWRcclxuICAgICAgICBmdW5jdGlvbiBjbG9zZU1vZGFsKCkge1xyXG4gICAgICAgICAgaWYgKG1vZGFsQ29udHJvbGxlcikge1xyXG4gICAgICAgICAgICBtb2RhbENvbnRyb2xsZXIuY2xvc2UoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9zZSBkYXRhc2V0IG9iamVjdCBpdHNlbGYgc28gY3VycmVudCBkYXRhc2V0IGNhbiBiZSBtYXJrZWRcclxuICAgICAgICBzY29wZS5EYXRhc2V0ID0gRGF0YXNldDtcclxuXHJcbiAgICAgICAgc2NvcGUudXNlckRhdGEgPSBfLmZpbHRlcihEYXRhc2V0LmRhdGFzZXRzLCBmdW5jdGlvbihkYXRhc2V0KSB7XHJcbiAgICAgICAgICByZXR1cm4gZGF0YXNldC5ncm91cCAhPT0gJ3NhbXBsZSc7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNjb3BlLnNhbXBsZURhdGEgPSBfLmZpbHRlcihEYXRhc2V0LmRhdGFzZXRzLCB7XHJcbiAgICAgICAgICBncm91cDogJ3NhbXBsZSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGRhdGFzZXRXYXRjaGVyID0gc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIERhdGFzZXQuZGF0YXNldHMubGVuZ3RoO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgc2NvcGUudXNlckRhdGEgPSBfLmZpbHRlcihEYXRhc2V0LmRhdGFzZXRzLCBmdW5jdGlvbihkYXRhc2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhc2V0Lmdyb3VwICE9PSAnc2FtcGxlJztcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzY29wZS5zZWxlY3REYXRhc2V0ID0gZnVuY3Rpb24oZGF0YXNldCkge1xyXG4gICAgICAgICAgLy8gQWN0aXZhdGUgdGhlIHNlbGVjdGVkIGRhdGFzZXRcclxuXHJcbiAgICAgICAgICBEYXRhc2V0LnVwZGF0ZShkYXRhc2V0KTtcclxuICAgICAgICAgIGNsb3NlTW9kYWwoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNjb3BlLlNlYXJjaENoYW5nZSA9IGZ1bmN0aW9uKGUpey8v5a2X5q616L+H5aSa5pe25p+l6K+i5Yqf6IO9XHJcbiAgICAgICAgICAgICAgdmFyIGZpZWxkcyA9IERhdGFzZXQuZGF0YXNldHM7XHJcbiAgICAgICAgICAgICAgZm9yKHZhciBpID0gMDtpPGZpZWxkcy5sZW5ndGg7aSsrKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkc1tpXS5oaWRkZW4gPSAnZmFsc2UnO1xyXG4gICAgICAgICAgICAgICAgaWYoZS5jdXJyZW50VGFyZ2V0LnZhbHVlIT1cIlwiJiZmaWVsZHNbaV0ubmFtZS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihlLmN1cnJlbnRUYXJnZXQudmFsdWUudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpKTwwXHJcbiAgICAgICAgICAgICAgICAgICAgJiZmaWVsZHNbaV0uZGVzY3JpcHRpb24uaW5kZXhPZihlLmN1cnJlbnRUYXJnZXQudmFsdWUudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpKTwwKVxyXG4gICAgICAgICAgICAgICAgICBmaWVsZHNbaV0uaGlkZGVuID0gJ3RydWUnO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgLy8gQ2xlYW4gdXAgd2F0Y2hlcnNcclxuICAgICAgICAgIGRhdGFzZXRXYXRjaGVyKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmFjdG9yeSgnRGF0YXNldCcsIGZ1bmN0aW9uKCRodHRwLCAkcSwgXywgY3FsLCBTYW1wbGVEYXRhLCBDb25maWcsIExvZ2dlcikge1xyXG4gICAgdmFyIERhdGFzZXQgPSB7fTtcclxuICAgIC8vIFN0YXJ0IHdpdGggdGhlIGxpc3Qgb2Ygc2FtcGxlIGRhdGFzZXRzXHJcbiAgICB2YXIgZGF0YXNldHMgPSBTYW1wbGVEYXRhO1xyXG5cclxuICAgIERhdGFzZXQuZGF0YXNldHMgPSBkYXRhc2V0cztcclxuICAgIERhdGFzZXQuZGF0YXNldCA9IGRhdGFzZXRzWzBdO1xyXG4gICAgRGF0YXNldC5jdXJyZW50RGF0YXNldCA9IHVuZGVmaW5lZDsgIC8vIGRhdGFzZXQgYmVmb3JlIHVwZGF0ZVxyXG4gICAgRGF0YXNldC5zdGF0cyA9IHt9O1xyXG4gICAgRGF0YXNldC50eXBlID0gdW5kZWZpbmVkO1xyXG4gICAgRGF0YXNldC5ub0RhdGEgPSBmYWxzZTtcclxuICAgIERhdGFzZXQubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgRGF0YXNldC5ub3dOYW1lID0gXCJcIjtcclxuICAgIHZhciB0eXBlT3JkZXIgPSB7XHJcbiAgICAgIG5vbWluYWw6IDAsXHJcbiAgICAgIG9yZGluYWw6IDAsXHJcbiAgICAgIGdlb2dyYXBoaWM6IDIsXHJcbiAgICAgIHRlbXBvcmFsOiAzLFxyXG4gICAgICBxdWFudGl0YXRpdmU6IDRcclxuICAgIH07XHJcblxyXG4gICAgRGF0YXNldC5maWVsZE9yZGVyQnkgPSB7fTtcclxuXHJcbiAgICBEYXRhc2V0LmZpZWxkT3JkZXJCeS50eXBlID0gZnVuY3Rpb24oZmllbGREZWYpIHtcclxuICAgICAgaWYgKGZpZWxkRGVmLmFnZ3JlZ2F0ZT09PSdjb3VudCcpIHJldHVybiA0O1xyXG4gICAgICByZXR1cm4gdHlwZU9yZGVyW2ZpZWxkRGVmLnR5cGVdO1xyXG4gICAgfTtcclxuXHJcbiAgICBEYXRhc2V0LmZpZWxkT3JkZXJCeS50eXBlVGhlbk5hbWUgPSBmdW5jdGlvbihmaWVsZERlZikge1xyXG4gICAgICByZXR1cm4gRGF0YXNldC5maWVsZE9yZGVyQnkudHlwZShmaWVsZERlZikgKyAnXycgK1xyXG4gICAgICAgIChmaWVsZERlZi5hZ2dyZWdhdGUgPT09ICdjb3VudCcgPyAnficgOiBmaWVsZERlZi5maWVsZC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAvLyB+IGlzIHRoZSBsYXN0IGNoYXJhY3RlciBpbiBBU0NJSVxyXG4gICAgfTtcclxuXHJcbiAgICBEYXRhc2V0LmZpZWxkT3JkZXJCeS5vcmlnaW5hbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gMDsgLy8gbm8gc3dhcCB3aWxsIG9jY3VyXHJcbiAgICB9O1xyXG5cclxuICAgIERhdGFzZXQuZmllbGRPcmRlckJ5LmZpZWxkID0gZnVuY3Rpb24oZmllbGREZWYpIHtcclxuICAgICAgcmV0dXJuIGZpZWxkRGVmLmZpZWxkO1xyXG4gICAgfTtcclxuXHJcbiAgICBEYXRhc2V0LmZpZWxkT3JkZXIgPSBEYXRhc2V0LmZpZWxkT3JkZXJCeS50eXBlVGhlbk5hbWU7XHJcblxyXG4gICAgLy8gdXBkYXRlIHRoZSBzY2hlbWEgYW5kIHN0YXRzXHJcbiAgICBEYXRhc2V0Lm9uVXBkYXRlID0gW107XHJcblxyXG4gICAgRGF0YXNldC51cGRhdGUgPSBmdW5jdGlvbihkYXRhc2V0KSB7XHJcbiAgICAgIERhdGFzZXQuZGF0YSA9IFtdO1xyXG4gICAgICAvLyBpZiAoRGF0YXNldC5jdXJyZW50RGF0YXNldCAmJiBEYXRhc2V0LmN1cnJlbnREYXRhc2V0Lm5hbWUpe1xyXG4gICAgICAvLyAgIERhdGFzZXQuY3VycmVudERhdGFzZXQubmFtZSA9IGFuZ3VsYXIuY29weShkYXRhc2V0Lm5hbWUpO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIERhdGFzZXQubG9hZGluZyA9IHRydWU7XHJcbiAgICAgIERhdGFzZXQubm93TmFtZSA9IGRhdGFzZXQubmFtZTtcclxuICAgICAgdmFyIHVwZGF0ZVByb21pc2U7XHJcblxyXG4gICAgICBMb2dnZXIubG9nSW50ZXJhY3Rpb24oTG9nZ2VyLmFjdGlvbnMuREFUQVNFVF9DSEFOR0UsIGRhdGFzZXQubmFtZSk7XHJcblxyXG4gICAgICBpZiAoZGF0YXNldC52YWx1ZXMpIHtcclxuICAgICAgICB1cGRhdGVQcm9taXNlID0gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAvLyBqc2hpbnQgdW51c2VkOmZhbHNlXHJcbiAgICAgICAgICBEYXRhc2V0LnR5cGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICB1cGRhdGVGcm9tRGF0YShkYXRhc2V0LCBkYXRhc2V0LnZhbHVlcyk7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdXBkYXRlUHJvbWlzZSA9ICRodHRwLmdldChkYXRhc2V0LnVybCwge2NhY2hlOiB0cnVlfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB2YXIgZGF0YTtcclxuXHJcbiAgICAgICAgICAvLyBmaXJzdCBzZWUgd2hldGhlciB0aGUgZGF0YSBpcyBKU09OLCBvdGhlcndpc2UgdHJ5IHRvIHBhcnNlIENTVlxyXG4gICAgICAgICAgaWYgKF8uaXNPYmplY3QocmVzcG9uc2UuZGF0YSkpIHtcclxuICAgICAgICAgICAgIGRhdGEgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgRGF0YXNldC50eXBlID0gJ2pzb24nO1xyXG4gICAgICAgICAgfSBcclxuICAgICAgICAgIC8vIGVsc2Uge1xyXG4gICAgICAgICAgLy8gICBkYXRhID0gdXRpbC5yZWFkKHJlc3BvbnNlLmRhdGEsIHt0eXBlOiAnY3N2J30pO1xyXG4gICAgICAgICAgLy8gICBEYXRhc2V0LnR5cGUgPSAnY3N2JztcclxuICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICB1cGRhdGVGcm9tRGF0YShkYXRhc2V0LCBkYXRhKTtcclxuICAgICAgICAgIERhdGFzZXQubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBEYXRhc2V0Lm9uVXBkYXRlLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcclxuICAgICAgICB1cGRhdGVQcm9taXNlID0gdXBkYXRlUHJvbWlzZS50aGVuKGxpc3RlbmVyKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBDb3B5IHRoZSBkYXRhc2V0IGludG8gdGhlIGNvbmZpZyBzZXJ2aWNlIG9uY2UgaXQgaXMgcmVhZHlcclxuICAgICAgdXBkYXRlUHJvbWlzZS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIENvbmZpZy51cGRhdGVEYXRhc2V0KGRhdGFzZXQsIERhdGFzZXQudHlwZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHVwZGF0ZVByb21pc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGZ1bmN0aW9uIGdldEZpZWxkRGVmcyhzY2hlbWEsIG9yZGVyKSB7XHJcbiAgICAvLyAgIHZhciBmaWVsZERlZnMgPSBzY2hlbWEuZmllbGRzKCkubWFwKGZ1bmN0aW9uKGZpZWxkKSB7XHJcbiAgICAvLyAgICAgcmV0dXJuIHtcclxuICAgIC8vICAgICAgIGZpZWxkOiBmaWVsZCxcclxuICAgIC8vICAgICAgIHR5cGU6IHNjaGVtYS50eXBlKGZpZWxkKSxcclxuICAgIC8vICAgICAgIHByaW1pdGl2ZVR5cGU6IHNjaGVtYS5wcmltaXRpdmVUeXBlKGZpZWxkKVxyXG4gICAgLy8gICAgIH07XHJcbiAgICAvLyAgIH0pO1xyXG5cclxuICAgIC8vICAgZmllbGREZWZzID0gdXRpbC5zdGFibGVzb3J0KGZpZWxkRGVmcywgb3JkZXIgfHwgRGF0YXNldC5maWVsZE9yZGVyQnkudHlwZVRoZW5OYW1lLCBEYXRhc2V0LmZpZWxkT3JkZXJCeS5maWVsZCk7XHJcblxyXG4gICAgLy8gICBmaWVsZERlZnMucHVzaCh7IGZpZWxkOiAnKicsIHRpdGxlOiAnQ291bnQnIH0pO1xyXG4gICAgLy8gICByZXR1cm4gZmllbGREZWZzO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUZyb21EYXRhKGRhdGFzZXQsIGRhdGEpIHtcclxuICAgICAgRGF0YXNldC5kYXRhID0gZGF0YTtcclxuICAgICAgRGF0YXNldC5jdXJyZW50RGF0YXNldCA9IGRhdGFzZXQ7XHJcblxyXG4gICAgICBEYXRhc2V0LnNjaGVtYSA9IGNxbC5zY2hlbWEuU2NoZW1hLmJ1aWxkKGRhdGEpO1xyXG4gICAgICAvLyBUT0RPOiBmaW5kIGFsbCByZWZlcmVuY2Ugb2YgRGF0YXNldC5zdGF0cy5zYW1wbGUgYW5kIHJlcGxhY2VcclxuICAgIH1cclxuXHJcbiAgICBEYXRhc2V0LmJ1aWxkU2NoZW1hID0gZnVuY3Rpb24oKXtcclxuICAgICAgRGF0YXNldC51cGRhdGUoRGF0YXNldC5kYXRhc2V0KTtcclxuICAgIH07XHJcblxyXG4gICAgRGF0YXNldC5hZGQgPSBmdW5jdGlvbihkYXRhc2V0KSB7XHJcbiAgICAgIGlmICghZGF0YXNldC5pZCkge1xyXG4gICAgICAgIGRhdGFzZXQuaWQgPSBkYXRhc2V0LnVybDtcclxuICAgICAgfVxyXG4gICAgICBkYXRhc2V0cy5wdXNoKGRhdGFzZXQpO1xyXG5cclxuICAgICAgcmV0dXJuIGRhdGFzZXQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBEYXRhc2V0O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSB2bHVpLmRpcmVjdGl2ZTpkYXRhc2V0TW9kYWxcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgZGF0YXNldE1vZGFsXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmRpcmVjdGl2ZSgnZGF0YXNldE1vZGFsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdkYXRhc2V0L2RhdGFzZXRtb2RhbC5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IGZhbHNlXHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmRpcmVjdGl2ZSgnZGF0YXNldFNlbGVjdG9yJywgZnVuY3Rpb24oTW9kYWxzLCBMb2dnZXIpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnZGF0YXNldC9kYXRhc2V0c2VsZWN0b3IuaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgIHNjb3BlOiB7fSxcclxuICAgICAgbGluazogZnVuY3Rpb24gcG9zdExpbmsoc2NvcGUvKiwgZWxlbWVudCwgYXR0cnMqLykge1xyXG4gICAgICAgIHNjb3BlLmxvYWREYXRhc2V0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBMb2dnZXIubG9nSW50ZXJhY3Rpb24oTG9nZ2VyLmFjdGlvbnMuREFUQVNFVF9PUEVOKTtcclxuICAgICAgICAgIE1vZGFscy5vcGVuKCdkYXRhc2V0LW1vZGFsJyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKS5jb25zdGFudCgnU2FtcGxlRGF0YScsIFt7XHJcbiAgbmFtZTogJ0JhcmxleScsXHJcbiAgZGVzY3JpcHRpb246ICdCYXJsZXkgeWllbGQgYnkgdmFyaWV0eSBhY3Jvc3MgdGhlIHVwcGVyIG1pZHdlc3QgaW4gMTkzMSBhbmQgMTkzMicsXHJcbiAgdXJsOiAnL2RhdGEvYmFybGV5Lmpzb24nLFxyXG4gIGlkOiAnYmFybGV5JyxcclxuICBncm91cDogJ3NhbXBsZSdcclxufSx7XHJcbiAgbmFtZTogJ0NhcnMnLFxyXG4gIGRlc2NyaXB0aW9uOiAnQXV0b21vdGl2ZSBzdGF0aXN0aWNzIGZvciBhIHZhcmlldHkgb2YgY2FyIG1vZGVscyBiZXR3ZWVuIDE5NzAgJiAxOTgyJyxcclxuICB1cmw6ICcvZGF0YS9jYXJzLmpzb24nLFxyXG4gIGlkOiAnY2FycycsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdDcmltZWEnLFxyXG4gIHVybDogJy9kYXRhL2NyaW1lYS5qc29uJyxcclxuICBpZDogJ2NyaW1lYScsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdEcml2aW5nJyxcclxuICB1cmw6ICcvZGF0YS9kcml2aW5nLmpzb24nLFxyXG4gIGlkOiAnZHJpdmluZycsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdJcmlzJyxcclxuICB1cmw6ICcvZGF0YS9pcmlzLmpzb24nLFxyXG4gIGlkOiAnaXJpcycsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdKb2JzJyxcclxuICB1cmw6ICcvZGF0YS9qb2JzLmpzb24nLFxyXG4gIGlkOiAnam9icycsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdQb3B1bGF0aW9uJyxcclxuICB1cmw6ICcvZGF0YS9wb3B1bGF0aW9uLmpzb24nLFxyXG4gIGlkOiAncG9wdWxhdGlvbicsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdNb3ZpZXMnLFxyXG4gIHVybDogJy9kYXRhL21vdmllcy5qc29uJyxcclxuICBpZDogJ21vdmllcycsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdCaXJkc3RyaWtlcycsXHJcbiAgdXJsOiAnL2RhdGEvYmlyZHN0cmlrZXMuanNvbicsXHJcbiAgaWQ6ICdiaXJkc3RyaWtlcycsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdCdXJ0aW4nLFxyXG4gIHVybDogJy9kYXRhL2J1cnRpbi5qc29uJyxcclxuICBpZDogJ2J1cnRpbicsXHJcbiAgZ3JvdXA6ICdzYW1wbGUnXHJcbn0se1xyXG4gIG5hbWU6ICdDYW1wYWlnbnMnLFxyXG4gIHVybDogJy9kYXRhL3dlYmFsbDI2Lmpzb24nLFxyXG4gIGlkOiAnd2ViYWxsMjYnLFxyXG4gIGdyb3VwOiAnc2FtcGxlJ1xyXG59XSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCdlY0NoYW5uZWwnLCBbJ0Ryb3AnLCckdGltZW91dCcsIGZ1bmN0aW9uIChEcm9wLCR0aW1lb3V0KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvZWNjaGFubmVsL2VjY2hhbm5lbC5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBtb2RhbDogJz0nLFxyXG4gICAgICAgIGZpZWxkOiAnPScsXHJcbiAgICAgICAgY2FuRHJhZzogJzwnLFxyXG4gICAgICAgIGNoYW5uZWxUaXRsZTogJzwnLFxyXG4gICAgICAgIHJlbW92ZUFjdGlvbjogJyYnLFxyXG4gICAgICAgIGNhbkRyb3A6ICc8JyxcclxuICAgICAgICBkcm9wVHlwZTogJzwnLFxyXG4gICAgICAgIG1vcmVEcmFnOiAnPCdcclxuXHJcbiAgICAgIH0sXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCAvKiwgYXR0cnMqLykge1xyXG4gICAgICAgIHZhciBjb2xvcnMgPSAge1xyXG4gICAgICAgICAgICAgICAgJyMwMDAwMDAnOiAnIzAwMDAwMCcsXHJcbiAgICAgICAgICAgICAgICAnI2ZmZmZmZic6ICcjZmZmZmZmJyxcclxuICAgICAgICAgICAgICAgICcjRkYwMDAwJzogJyNGRjAwMDAnLFxyXG4gICAgICAgICAgICAgICAgJyM3Nzc3NzcnOiAnIzc3Nzc3NycsXHJcbiAgICAgICAgICAgICAgICAnIzMzN2FiNyc6ICcjMzM3YWI3JyxcclxuICAgICAgICAgICAgICAgICcjNWNiODVjJzogJyM1Y2I4NWMnLFxyXG4gICAgICAgICAgICAgICAgJyM1YmMwZGUnOiAnIzViYzBkZScsXHJcbiAgICAgICAgICAgICAgICAnI2YwYWQ0ZSc6ICcjZjBhZDRlJyxcclxuICAgICAgICAgICAgICAgICcjZDk1MzRmJzogJyNkOTUzNGYnLFxyXG4gICAgICAgICAgICAgICAgJyNGRkZGMDAnOicjRkZGRjAwJyxcclxuICAgICAgICAgICAgICAgICcjRUUwMEVFJzonI0VFMDBFRScsXHJcbiAgICAgICAgICAgICAgICAnI0FERkYyRic6JyNBREZGMkYnXHJcbiAgICAgICAgIH07XHJcbiAgICAgICAgc2NvcGUuRmllbGREcm9wcGVkID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgIGlmIChzY29wZS5kcm9wVHlwZSA9PSAnZmlsdGVyJyl7XHJcbiAgICAgICAgICAgIHZhciBkYXRlPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICBzY29wZS50aGlzbW9kYWwuaWZBdXRvID0gJzEnO1xyXG4gICAgICAgICAgICBpZihzY29wZS5jaGFubmVsVGl0bGUgPT0gJ+aciOS7vScpe1xyXG4gICAgICAgICAgICAgIHNjb3BlLnRoaXNtb2RhbC52YWx1ZSA9IGRhdGUuZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIHNjb3BlLnRoaXNtb2RhbC52YWx1ZSA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYoc2NvcGUuZHJvcFR5cGUgPT0gXCJkYmFyXCIpXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc2NvcGUudGhpc21vZGFsLnNob3dhdmdsaW5lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgc2NvcGUudGhpc21vZGFsLmF2Z2xpbmV2YWx1ZSA9IG51bGw7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBzY29wZS50aGlzbW9kYWwuY2FsY3J1bGVzID0gJyc7XHJcbiAgICAgICAgICBzY29wZS5maWVsZCA9IGFuZ3VsYXIuY29weShzY29wZS50aGlzbW9kYWwpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy/ku6rooajnm5jliIbmrrXphY3nva7poblcclxuICAgICAgICBzY29wZS5TcGxpdERyb3BwZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8v5oOz6KaB6I635Y+W5YiwbmV3bW9kZWwgIOi/meS4qumAgOaLveWvueixoeS4jeiDveS9v+eUqG5nLWlmIOW9seWTjeWIneWni+WMlizlv4XpobvnlKhuZy1zaG93XHJcbiAgICAgICAgICAgc2NvcGUuZmllbGQuc3BsaXRGaWVsZCA9IHNjb3BlLmZpZWxkLnNwbGl0RmllbGR8fFtdO1xyXG4gICAgICAgICAgIHNjb3BlLm5ld21vZGVsLmNvbG9yPVwiI2Q1ZDkzMVwiO1xyXG4gICAgICAgICAgIHNjb3BlLm5ld21vZGVsLmdpdmVMZW5ndGg9ZmFsc2U7XHJcbiAgICAgICAgICAgc2NvcGUubmV3bW9kZWwubGVuZ3RoPTA7XHJcbiAgICAgICAgICBzY29wZS5maWVsZC5zcGxpdEZpZWxkLnB1c2goYW5ndWxhci5jb3B5KHNjb3BlLm5ld21vZGVsKSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBzY29wZS5yZW1vdmVTcGxpdCA9IGZ1bmN0aW9uKGZpZWxkLG51bSkge1xyXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NvcGUuZmllbGQuc3BsaXRGaWVsZCkpIHtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQuc3BsaXRGaWVsZC5zcGxpY2UobnVtLDEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQuc3BsaXRGaWVsZCA9IFtdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgc2NvcGUuc2hvd1NwbGl0UG9wID0gZnVuY3Rpb24oaW5kZXgpe1xyXG4gICAgICAgICAgaWYgKGVsZW1lbnQuZmluZCgnLmVjaGFydC10eXBlJytpbmRleCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIHZhciB0eXBlUG9wdXAgPSBuZXcgRHJvcCh7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGVsZW1lbnQuZmluZCgnLmVjaGFydC10eXBlJytpbmRleClbMF0sXHJcbiAgICAgICAgICAgICAgICAgIHRhcmdldDogZWxlbWVudC5maW5kKCcudHlwZS1jYXJldCcraW5kZXgpWzBdLFxyXG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3RvcCBsZWZ0JyxcclxuICAgICAgICAgICAgICAgICAgb3Blbk9uOiAnY2xpY2snXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB0eXBlUG9wdXAub24oJ29wZW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgJChcIi5zcGxpdC1jb2xvclwiK2luZGV4KS5jb2xvcnBpY2tlcih7IGFsaWduOiAncmlnaHQnLGNvbG9yU2VsZWN0b3JzOiBjb2xvcnMgfSkub24oJ2NoYW5nZUNvbG9yJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuZmllbGQuc3BsaXRGaWVsZFtpbmRleF0uY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIHNjb3BlLnNwbGl0UG9wdXAgPSB0eXBlUG9wdXA7XHJcbiAgICAgICAgICB0eXBlUG9wdXAub3BlbigpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgc2NvcGUuc2V0U3BsaXRDb2xvciA9IGZ1bmN0aW9uICh0eXBlLGluZGV4KSB7XHJcbiAgICAgICAgICBpZiAodHlwZSA9PSAnc3BsaXQnKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLnNwbGl0RmllbGRbaW5kZXhdLmNvbG9yPSBhbmd1bGFyLmNvcHkoc2NvcGUuZmllbGQuc3BsaXRGaWVsZFtpbmRleF0uY29sb3IpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzY29wZS5maWVsZC5zcGxpdEZpZWxkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHNjb3BlLnNwbGl0UG9wdXAub3BlbigpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy/ku6rooajnm5jliIbmrrXphY3nva7nu5PmnZ9cclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQuZmluZCgnLnR5cGUtY2FyZXQnKS5sZW5ndGggPiAwICYmIGVsZW1lbnQuZmluZCgnLmVjaGFydC10eXBlJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgdmFyIHR5cGVQb3B1cCA9IG5ldyBEcm9wKHtcclxuICAgICAgICAgICAgY29udGVudDogZWxlbWVudC5maW5kKCcuZWNoYXJ0LXR5cGUnKVswXSxcclxuICAgICAgICAgICAgdGFyZ2V0OiBlbGVtZW50LmZpbmQoJy50eXBlLWNhcmV0JylbMF0sXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAndG9wIGxlZnQnLFxyXG4gICAgICAgICAgICBvcGVuT246ICdjbGljaydcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgdmFyIGNhbFBvcHVwID0gbmV3IERyb3Aoey8v6K6h566X5a2X5q6155qE5LqL5Lu2XHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGVsZW1lbnQuZmluZCgnLmNvdW50LXR5cGUnKVswXSxcclxuICAgICAgICAgICAgdGFyZ2V0OiBlbGVtZW50LmZpbmQoJy5jb3VudC1jYXJldCcpWzBdLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ3RvcCBsZWZ0JyxcclxuICAgICAgICAgICAgb3Blbk9uOiAnY2xpY2snXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGlmIChzY29wZS5kcm9wVHlwZSA9PSAndHlwZScgJiYgc2NvcGUuZmllbGQgJiYgc2NvcGUuZmllbGQuY29sb3IpIHtcclxuICAgICAgICAgICAgc2NvcGUubWl4X2NvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLmZpZWxkLmNvbG9yKTtcclxuICAgICAgICAgICAgdHlwZVBvcHVwLm9uKCdvcGVuJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICQoXCIuZHJvcC1jb250ZW50IC5jb2xvci1pbnB1dFwiKS5jb2xvcnBpY2tlcih7IGFsaWduOiAncmlnaHQnLGNvbG9yU2VsZWN0b3JzOiBjb2xvcnMgfSkub24oJ2NoYW5nZUNvbG9yJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUubWl4X2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAkKFwiLmFsZXJ0Y29sb3JcIikuY29sb3JwaWNrZXIoeyBhbGlnbjogJ3JpZ2h0Jyxjb2xvclNlbGVjdG9yczogY29sb3JzIH0pLm9uKCdjaGFuZ2VDb2xvcicsIGZ1bmN0aW9uICgpIHsvL+itpuekuue6v+minOiJslxyXG4gICAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5hbGVydHNDb25maWdzW3BhcnNlSW50KCQodGhpcykuYXR0cignaWR4JykpXS5jb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgJChcIi5jb2xvci1sYWJlbFwiKS5jb2xvcnBpY2tlcih7IGFsaWduOiAncmlnaHQnLGNvbG9yU2VsZWN0b3JzOiBjb2xvcnMgfSkub24oJ2NoYW5nZUNvbG9yJywgZnVuY3Rpb24gKCkgey8v6K2m56S657q/6aKc6ImyXHJcbiAgICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLmxhYmVsLm5vcm1hbC5jb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHNjb3BlLmRyb3BUeXBlID09ICdtYXBwb2ludCcgJiYgc2NvcGUuZmllbGQgJiYgc2NvcGUuZmllbGQuY29sb3IpIHtcclxuICAgICAgICAgICAgc2NvcGUucG9pbnRfY29sb3IgPSBhbmd1bGFyLmNvcHkoc2NvcGUuZmllbGQuY29sb3IpO1xyXG4gICAgICAgICAgICBzY29wZS5wb2ludF90b3BfY29sb3IgPSBhbmd1bGFyLmNvcHkoc2NvcGUuZmllbGQudG9wX2NvbG9yKTtcclxuICAgICAgICAgICAgdHlwZVBvcHVwLm9uKCdvcGVuJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICQoXCIuZHJvcC1jb250ZW50IC5wb2ludC1jb2xvci1pbnB1dFwiKS5jb2xvcnBpY2tlcih7IGFsaWduOiAncmlnaHQnLGNvbG9yU2VsZWN0b3JzOiBjb2xvcnMgfSkub24oJ2NoYW5nZUNvbG9yJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PSAnbm9ybWFsJyl7XHJcbiAgICAgICAgICAgICAgICAgIHNjb3BlLnBvaW50X2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKCQodGhpcykuYXR0cigncmVsJykgPT0gJ3RvcCcpe1xyXG4gICAgICAgICAgICAgICAgICBzY29wZS5wb2ludF90b3BfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoc2NvcGUuZHJvcFR5cGUgPT0gJ3NpbmdsZScgJiYgc2NvcGUuZmllbGQgJiYgc2NvcGUuZmllbGQuX3RpdGxlQ29sb3IgKXtcclxuICAgICAgICAgICAgc2NvcGUuc2luZ2xlX3RpdGxlX2NvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLmZpZWxkLl90aXRsZUNvbG9yKTtcclxuICAgICAgICAgICAgc2NvcGUuc2luZ2xlX3ZhbHVlX2NvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLmZpZWxkLl92YWx1ZUNvbG9yKTtcclxuICAgICAgICAgICAgdHlwZVBvcHVwLm9uKCdvcGVuJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICQoXCIuZHJvcC1jb250ZW50IC5zaW5nbGUtY29sb3JcIikuY29sb3JwaWNrZXIoeyBhbGlnbjogJ3JpZ2h0Jyxjb2xvclNlbGVjdG9yczogY29sb3JzIH0pLm9uKCdjaGFuZ2VDb2xvcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09ICdzaW5nbGVfdGl0bGUnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHNjb3BlLnNpbmdsZV90aXRsZV9jb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PSAnc2luZ2xlX3ZhbHVlJykge1xyXG4gICAgICAgICAgICAgICAgICBzY29wZS5zaW5nbGVfdmFsdWVfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChzY29wZS5kcm9wVHlwZSA9PSAnc3R5bGUnICYmIHNjb3BlLmZpZWxkKSB7XHJcbiAgICAgICAgICAgIHR5cGVQb3B1cC5vbignb3BlbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAkKFwiLnNwbGl0LWNvbG9yLWlucHV0XCIpLmNvbG9ycGlja2VyKHsgYWxpZ246ICdyaWdodCcsY29sb3JTZWxlY3RvcnM6IGNvbG9ycyB9KS5vbignY2hhbmdlQ29sb3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZigkKHRoaXMpLmF0dHIoJ3JlbCcpID09ICdub3JtYWwnKXtcclxuICAgICAgICAgICAgICAgICAgc2NvcGUuZmllbGQuc3BsaXRjb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZigkKHRoaXMpLmF0dHIoJ3JlbCcpID09ICdwb2ludGVyJyl7XHJcbiAgICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLnN0eWxlLml0ZW1TdHlsZS5ub3JtYWwuY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY29wZS5hbGVydEJsdXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLmFsZXJ0c0NvbmZpZ3MgPSBzY29wZS5maWVsZC5hbGVydHNDb25maWdzIHx8W107XHJcbiAgICAgICAgICAgIHZhciBvbGRsZW4gPSBzY29wZS5maWVsZC5hbGVydHNDb25maWdzLmxlbmd0aDtcclxuICAgICAgICAgICAgaWYoc2NvcGUuZmllbGQuYWxlcnRzY291bnQ+b2xkbGVuKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxzY29wZS5maWVsZC5hbGVydHNjb3VudC1vbGRsZW47aSsrKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLmFsZXJ0c0NvbmZpZ3MucHVzaCh7dmFsdWU6MCxjb2xvcjoncmVkJyxuYW1lOiforabnpLrnur8nKyhpKzEpfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uoc2NvcGUuZmllbGQuYWxlcnRzY291bnQ8b2xkbGVuKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc2NvcGUuZmllbGQuYWxlcnRzQ29uZmlncy5zcGxpY2Uoc2NvcGUuZmllbGQuYWxlcnRzY291bnQsb2xkbGVuLXNjb3BlLmZpZWxkLmFsZXJ0c2NvdW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICQoXCIuYWxlcnRjb2xvclwiKS5jb2xvcnBpY2tlcih7IGFsaWduOiAncmlnaHQnLGNvbG9yU2VsZWN0b3JzOiBjb2xvcnMgfSkub24oJ2NoYW5nZUNvbG9yJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5hbGVydHNDb25maWdzWyQodGhpcykuYXR0cignaWR4JyldLmNvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSwxMDAwKTsvL+W7tuaXtuWIneWni+WMluminOiJsuaOp+S7tlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NvcGUuZ3JvdXBjb3VudEJsdXIgPSBmdW5jdGlvbiAoKSB7Ly/oh6rlrprkuYnliIbnu4RcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQuZ3JvdXBDb25maWdzID0gc2NvcGUuZmllbGQuZ3JvdXBDb25maWdzIHx8W107XHJcbiAgICAgICAgICAgIHZhciBvbGRsZW4gPSBzY29wZS5maWVsZC5ncm91cENvbmZpZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBpZihzY29wZS5maWVsZC5zZWxmZ3JvdXBjb3VudD5vbGRsZW4pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB2YXIgdD0xO1xyXG4gICAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8c2NvcGUuZmllbGQuc2VsZmdyb3VwY291bnQtb2xkbGVuO2krKylcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ncm91cENvbmZpZ3MucHVzaCh7dmFsdWVzdGFydDp0LHZhbHVlZW5kOih0KzEpLG5hbWU6J+WIhue7hCcrKGkrMSl9KTtcclxuICAgICAgICAgICAgICAgIHQ9dCsyO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlKHNjb3BlLmZpZWxkLnNlbGZncm91cGNvdW50PG9sZGxlbilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNjb3BlLmZpZWxkLmdyb3VwQ29uZmlncy5zcGxpY2Uoc2NvcGUuZmllbGQuc2VsZmdyb3VwY291bnQsb2xkbGVuLXNjb3BlLmZpZWxkLnNlbGZncm91cGNvdW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NvcGUuc2V0TGluZUNvbG9yID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICBzY29wZS5maWVsZC5hbGVydHNDb25maWdzW2luZGV4XS5jb2xvciA9IGFuZ3VsYXIuY29weSgkKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgIHR5cGVQb3B1cC5vcGVuKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUuc2V0TWl4Q29sb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBzY29wZS5maWVsZC5jb2xvciA9IGFuZ3VsYXIuY29weShzY29wZS5taXhfY29sb3IpO1xyXG4gICAgICAgICAgdHlwZVBvcHVwLm9wZW4oKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzY29wZS5zZXRQb2ludENvbG9yID0gZnVuY3Rpb24gKHR5cGUsaW5kZXgpIHtcclxuICAgICAgICAgIGlmKHR5cGUgPT0gJ25vcm1hbCcpe1xyXG4gICAgICAgICAgICBzY29wZS5maWVsZC5jb2xvciA9IGFuZ3VsYXIuY29weShzY29wZS5wb2ludF9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZih0eXBlID09ICd0b3AnKXtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQudG9wX2NvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLnBvaW50X3RvcF9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZih0eXBlID09ICdzaW5nbGVfdGl0bGUnKXtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQuX3RpdGxlQ29sb3IgPSBhbmd1bGFyLmNvcHkoc2NvcGUuc2luZ2xlX3RpdGxlX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICh0eXBlID09ICdzaW5nbGVfdmFsdWUnKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLl92YWx1ZUNvbG9yID0gYW5ndWxhci5jb3B5KHNjb3BlLnNpbmdsZV92YWx1ZV9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0eXBlUG9wdXAub3BlbigpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLmdldEFsbENvbHMgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAvL+iOt+WPluS4u3Njb3Bl6YCJ5oup55qE55u45YWz5a2X5q61XHJcbiAgICAgICAgICAgIHZhciBtYWluc2NvcGUgPSAkKCdkaXZbbmctY29udHJvbGxlcj1cIk1haW5DdHJsXCJdJykuc2NvcGUoKTtcclxuICAgICAgICAgICAgdmFyIGZpZWxkcyA9IG1haW5zY29wZS5EYXRhc2V0LnNjaGVtYS5maWVsZFNjaGVtYXM7XHJcbiAgICAgICAgICAgIHJldHVybiBmaWVsZHM7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc2NvcGUuJHdhdGNoKCdmaWVsZC50cnVldHlwZScsIGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgICBpZiAoIXNjb3BlLmZpZWxkIHx8ICFzY29wZS5maWVsZC50cnVldHlwZSB8fCAhc2NvcGUuZmllbGQudHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAobiA9PT0gJ2FyZWEnKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLnR5cGUgPSAnbGluZSc7XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLmlzYXJlYSA9ICcxJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYobiA9PT0gJ2xpbmVzdGVwJylcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc2NvcGUuZmllbGQudHlwZSA9ICdsaW5lJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzY29wZS5maWVsZC50eXBlID0gbjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChuICE9PSAnYmFyJykge1xyXG4gICAgICAgICAgICBzY29wZS5maWVsZC5sYWJlbC5ub3JtYWwucG9zaXRpb24gPSAndG9wJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmICh0eXBlUG9wdXAgJiYgdHlwZVBvcHVwLmRlc3Ryb3kpIHtcclxuICAgICAgICAgICAgdHlwZVBvcHVwLmRlc3Ryb3koKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2NvcGUuYWRkQW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgaWYoIWRhdGEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKHNjb3BlLmZpZWxkLnJ1bGVzWzBdJiZzY29wZS5maWVsZC5ydWxlc1swXS5yZWxhdGU9PVwiYW5kXCIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuZmllbGQucnVsZXMucHVzaCh7aWQ6c2NvcGUuZ2VuSUQoMjApLHBhcmVudGlkOnNjb3BlLmZpZWxkLnJ1bGVzWzBdLmlkLG5hbWU6c2NvcGUuZmllbGQuZmllbGQscmVsYXRlOidhbmQnLHJ1bGU6Jz09Jyx2YWx1ZTonJ30pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdpZCA9c2NvcGUuZ2VuSUQoMjApO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLnB1c2goe2lkOm5ld2lkLHBhcmVudGlkOlwiMFwiLG5hbWU6JycscmVsYXRlOidhbmQnLHJ1bGU6JycsdmFsdWU6Jyd9KTtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ydWxlcy5wdXNoKHtpZDpzY29wZS5nZW5JRCgyMCkscGFyZW50aWQ6bmV3aWQsbmFtZTpzY29wZS5maWVsZC5maWVsZCxyZWxhdGU6J2FuZCcscnVsZTonPT0nLHZhbHVlOicnfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gc2NvcGUuZmllbGQucnVsZXMuZmluZChmdW5jdGlvbiAoeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LmlkPT09ZGF0YS5wYXJlbnRpZFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZihwYXJlbnQucmVsYXRlPT1cImFuZFwiKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLnB1c2goe2lkOnNjb3BlLmdlbklEKDIwKSxwYXJlbnRpZDpwYXJlbnQuaWQsbmFtZTpzY29wZS5maWVsZC5maWVsZCxyZWxhdGU6J2FuZCcscnVsZTonPT0nLHZhbHVlOicnfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3aWQgPXNjb3BlLmdlbklEKDIwKTtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ydWxlcy5wdXNoKHtpZDpuZXdpZCxwYXJlbnRpZDpwYXJlbnQuaWQsbmFtZTonJyxyZWxhdGU6J2FuZCcscnVsZTonJyx2YWx1ZTonJ30pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLnB1c2goe2lkOnNjb3BlLmdlbklEKDIwKSxwYXJlbnRpZDpuZXdpZCxuYW1lOnNjb3BlLmZpZWxkLmZpZWxkLHJlbGF0ZTonYW5kJyxydWxlOic9PScsdmFsdWU6Jyd9KTtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ydWxlcy5maW5kKGZ1bmN0aW9uICh4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LmlkPT09ZGF0YS5pZFxyXG4gICAgICAgICAgICAgICAgICAgIH0pLnBhcmVudGlkID0gbmV3aWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIHR5cGVQb3B1cC5vcGVuKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgc2NvcGUuYWRkT3IgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBpZighZGF0YSlyZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBzY29wZS5maWVsZC5ydWxlcy5maW5kKGZ1bmN0aW9uICh4KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geC5pZD09PWRhdGEucGFyZW50aWRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmKHBhcmVudC5yZWxhdGU9PVwib3JcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuZmllbGQucnVsZXMucHVzaCh7aWQ6c2NvcGUuZ2VuSUQoMjApLHBhcmVudGlkOnBhcmVudC5pZCxuYW1lOnNjb3BlLmZpZWxkLmZpZWxkLHJlbGF0ZTonb3InLHJ1bGU6Jz09Jyx2YWx1ZTonJ30pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld2lkID1zY29wZS5nZW5JRCgyMCk7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ydWxlcy5wdXNoKHtpZDpuZXdpZCxwYXJlbnRpZDpwYXJlbnQuaWQsbmFtZTonJyxyZWxhdGU6J29yJyxydWxlOicnLHZhbHVlOicnfSk7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ydWxlcy5wdXNoKHtpZDpzY29wZS5nZW5JRCgyMCkscGFyZW50aWQ6bmV3aWQsbmFtZTpzY29wZS5maWVsZC5maWVsZCxyZWxhdGU6J29yJyxydWxlOic9PScsdmFsdWU6Jyd9KTtcclxuICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLmZpbmQoZnVuY3Rpb24gKHgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geC5pZD09PWRhdGEuaWRcclxuICAgICAgICAgICAgICAgIH0pLnBhcmVudGlkID0gbmV3aWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIHR5cGVQb3B1cC5vcGVuKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgc2NvcGUucmVtb3ZlRmlsdGVyID0gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgICAgIHZhciBicm90aGVycyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgYnJvdGhlcnNPbmx5ID0gW107Ly/lj6rmmK/ooajovr7lvI/nmoTlubPnuqflhYTlvJ9cclxuICAgICAgICAgICAgdmFyIGNoaWxkcyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0ge307XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLm1hcChmdW5jdGlvbihvYmpjdCl7XHJcbiAgICAgICAgICAgICAgICBpZihvYmpjdC5wYXJlbnRpZCA9PT0gZGF0YS5wYXJlbnRpZCYmYXJndW1lbnRzWzBdLmlkIT1kYXRhLmlkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGFyZ3VtZW50c1swXS5ydWxlIT1cIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJvdGhlcnMucHVzaChvYmpjdC5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyb3RoZXJzT25seS5wdXNoKG9iamN0LmlkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihvYmpjdC5wYXJlbnRpZCA9PT0gZGF0YS5pZClcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZHMucHVzaChvYmpjdC5pZCk7XHJcbiAgICAgICAgICAgICAgICBpZihvYmpjdC5pZD09PWRhdGEucGFyZW50aWQpXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gb2JqY3Q7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZihicm90aGVycy5sZW5ndGg9PTApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKGJyb3RoZXJzT25seS5sZW5ndGghPTApLy/lj6rliankuIvlkIznuqfmnaHku7Ys5p2h5Lu25YmN572uLOWIoOmZpOeItuadoeS7tlxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHBhcmVudC5pZClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLmRlbChmdW5jdGlvbihkZWxvYmopeyByZXR1cm4gZGVsb2JqLmlkPT09cGFyZW50LmlkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyb3RoZXJzT25seS5tYXAoZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ydWxlcy5tYXAoZnVuY3Rpb24ob2Jqcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZih2YWx1ZT09PW9ianMuaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpzLnBhcmVudGlkID0gcGFyZW50LnBhcmVudGlkIHx8IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZihwYXJlbnQucnVsZT09XCJcIikvL+WmguaenOayoeacieWQjOe6p+iAjOS4lOeItue6p+WPquaciXJ1bGUu5ZCM5pe25Lqn5Ye654i257qnXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuZmllbGQucnVsZXMuZGVsKGZ1bmN0aW9uKGRlbG9iail7IHJldHVybiBkZWxvYmouaWQ9PT1wYXJlbnQuaWR9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLmRlbChmdW5jdGlvbihkZWxvYmopeyByZXR1cm4gZGVsb2JqLmlkPT09ZGF0YS5pZH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuZmllbGQucnVsZXMuZGVsKGZ1bmN0aW9uKGRlbG9iail7IHJldHVybiBkZWxvYmouaWQ9PT1kYXRhLmlkfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoc2NvcGUuZmllbGQucnVsZXMubGVuZ3RoPT0xJiZzY29wZS5maWVsZC5ydWxlc1swXS5wYXJlbnRpZD09XCIwXCIpXHJcbiAgICAgICAgICAgICAgICBzY29wZS5maWVsZC5ydWxlcy5wb3AoKTtcclxuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIHR5cGVQb3B1cC5vcGVuKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzY29wZS5jdXJlbnRGaWx0ZXIgPSBudWxsO1xyXG4gICAgICAgIHNjb3BlLmZpbHRlclJvd0NsaWNrID0gZnVuY3Rpb24gKGV2LHJ1bGUscGFyZW50UnVsZSkge1xyXG4gICAgICAgICAgICBpZihzY29wZS5jdXJlbnRGaWx0ZXIpXHJcbiAgICAgICAgICAgICAgICBzY29wZS5jdXJlbnRGaWx0ZXIuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLFwiXCIpO1xyXG4gICAgICAgICAgICAkKGV2LmN1cnJlbnRUYXJnZXQpLnBhcmVudCgpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIixcImxpZ2h0Z3JheVwiKTtcclxuICAgICAgICAgICAgc2NvcGUuY3VyZW50RmlsdGVyID0gJChldi5jdXJyZW50VGFyZ2V0KS5wYXJlbnQoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNjb3BlLmdlbklEID0gZnVuY3Rpb24obGVuZ3RoKXtcclxuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyKDMsbGVuZ3RoKSArIERhdGUubm93KCkpLnRvU3RyaW5nKDM2KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNjb3BlLmdldENoaWxkcyA9IGZ1bmN0aW9uKGlkKXtcclxuICAgICAgICAgICAgdmFyIG9ianM9W107XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLnJ1bGVzLm1hcChmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgICAgICBpZihvYmoucGFyZW50aWQgPT09IGlkKVxyXG4gICAgICAgICAgICAgICAgICAgIG9ianMucHVzaChvYmopO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9ianN8fFtdO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuXHJcbiAgICAgICAgLy/orqHnrpflhazlvI9cclxuICAgICAgICBzY29wZS5kcm9wQ29tcGxldGUgPSBmdW5jdGlvbihpZHgsZGF0YSxldnQpe1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoXCIuY2FsY19kaXZfZmllbGRzXCIpLmFkZENsYXNzKFwic2Nyb2xsLXlcIik7XHJcbiAgICAgICAgICAgIHNjb3BlLmFkZEZpZWxkQ2FsYyhhcmd1bWVudHNbMV0uaGVscGVyWzBdLmlubmVyVGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNjb3BlLmNhbGNoZWNrID0gXCLlkIjms5VcIjtcclxuICAgICAgICBzY29wZS5hZGRGaWVsZENhbGMgPSBmdW5jdGlvbihmaWVsZCxpc3NldClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNjb3BlLmZpZWxkLmNhbGNydWxlcyA9ICFzY29wZS5maWVsZC5jYWxjcnVsZXM/XCJcIjpzY29wZS5maWVsZC5jYWxjcnVsZXM7XHJcbiAgICAgICAgICAgIGlmKGlzc2V0KVxyXG4gICAgICAgICAgICAgICAgc2NvcGUuZmllbGQuY2FsY3J1bGVzID0gZmllbGQ7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHNjb3BlLmZpZWxkLmNhbGNydWxlcyArPSAnICcrZmllbGQ7XHJcbiAgICAgICAgICAgIGlmIChjYWxjQ2hlY2soc2NvcGUuZmllbGQuY2FsY3J1bGVzKSkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuY2FsY2hlY2sgPSBcIuWQiOazlVwiO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgc2NvcGUuY2FsY2hlY2sgPSBcIuS4jeWQiOazlVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNjb3BlLmRyYWdzdG9wID0gZnVuY3Rpb24gKGRhdGEsZXZ0KSB7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChcIi5jYWxjX2Rpdl9maWVsZHNcIikuYWRkQ2xhc3MoXCJzY3JvbGwteVwiKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNjb3BlLmRyYWdzdGFydCA9IGZ1bmN0aW9uIChkYXRhLGV2dCkge1xyXG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoXCIuY2FsY19kaXZfZmllbGRzXCIpLnJlbW92ZUNsYXNzKFwic2Nyb2xsLXlcIik7Ly/mi5bmi73mu5rliqjmnaHnmoRidWfkv67mraNcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNjb3BlLmRlbGV0ZVdvcmRzID0gZnVuY3Rpb24oZXZ0KXtcclxuICAgICAgICAgICAgdmFyIGVsID0gZXZ0LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKGV2dC5rZXlDb2RlPT04KSB7XHJcbiAgICAgICAgICAgICAgICBkZWxXaG9sZVdvcmQoZWwsIGFuZ3VsYXIuZWxlbWVudChlbCkudmFsKCksIGdldEN1cnNvcnRQb3NpdGlvbihlbCkpO1xyXG4gICAgICAgICAgICAgICAgc2NvcGUuYWRkRmllbGRDYWxjKGFuZ3VsYXIuZWxlbWVudChlbCkudmFsKCksdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdldEN1cnNvcnRQb3NpdGlvbiA9IGZ1bmN0aW9uIChjdHJsKSB7XHJcbiAgICAgICAgICAgIHZhciBDYXJldFBvcyA9IDA7XHJcbiAgICAgICAgICAgIC8vIElFIFN1cHBvcnRcclxuICAgICAgICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY3RybC5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgdmFyIFNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xyXG4gICAgICAgICAgICAgICAgU2VsLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgLWN0cmwudmFsdWUubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIENhcmV0UG9zID0gU2VsLnRleHQubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IHN1cHBvcnRcclxuICAgICAgICAgICAgZWxzZSBpZiAoY3RybC5zZWxlY3Rpb25TdGFydCB8fCArY3RybC5zZWxlY3Rpb25TdGFydCA9PT0gMClcclxuICAgICAgICAgICAgeyBDYXJldFBvcyA9IGN0cmwuc2VsZWN0aW9uU3RhcnQ7IH1cclxuICAgICAgICAgICAgcmV0dXJuIChDYXJldFBvcyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdFNvbWVUZXh0ID0gZnVuY3Rpb24gKGVsZW1lbnQsIGJlZ2luLCBlbmQpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UoYmVnaW4sIGVuZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZWxlbWVudC5jcmVhdGVUZXh0UmFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciByYW5nZSA9IGVsZW1lbnQuY3JlYXRlVGV4dFJhbmdlKCk7XHJcbiAgICAgICAgICAgICAgICByYW5nZS5tb3ZlU3RhcnQoXCJjaGFyYWN0ZXJcIiwgYmVnaW4pO1xyXG4gICAgICAgICAgICAgICAgcmFuZ2UubW92ZUVuZChcImNoYXJhY3RlclwiLCBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmFuZ2Uuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgZGVsV2hvbGVXb3JkID0gZnVuY3Rpb24gKHRleHQsIGZpZWxkLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXJ0SW5kZXggPSBwb3M7XHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5jaGFyQXQocG9zIC0gMSkgIT09ICcgJykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHBvcyAtIDI7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLmNoYXJBdChpKSA9PT0gJyAnIHx8IGkgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNlbGVjdFNvbWVUZXh0KHRleHQsIHN0YXJ0SW5kZXgsIHBvcylcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBjYWxjQ2hlY2soc3RyaW5nKXtcclxuICAgICAgICAgICAgLy8g5YmU6Zmk56m655m956ymXHJcbiAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9cXHMvZywgJycpO1xyXG4gICAgICAgICAgICAvLyDplJnor6/mg4XlhrXvvIznqbrlrZfnrKbkuLJcclxuICAgICAgICAgICAgaWYoXCJcIiA9PT0gc3RyaW5nKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDplJnor6/mg4XlhrXvvIzov5DnrpfnrKbov57nu61cclxuICAgICAgICAgICAgaWYoIC9bXFwrXFwtXFwqXFwvXXsyLH0vLnRlc3Qoc3RyaW5nKSApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOepuuaLrOWPt1xyXG4gICAgICAgICAgICBpZigvXFwoXFwpLy50ZXN0KHN0cmluZykpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOmUmeivr+aDheWGte+8jOWKoOWHj+S5mOmZpOe7k+WwvlxyXG4gICAgICAgICAgICBpZiggL1tcXCtcXC1cXCpcXC9dJC8udGVzdChzdHJpbmcpICl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8g6ZSZ6K+v5oOF5Ya177yM5ous5Y+35LiN6YWN5a+5XHJcbiAgICAgICAgICAgIHZhciBzdGFjayA9IFtdO1xyXG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwLCBpdGVtOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgICAgIGl0ZW0gPSBzdHJpbmcuY2hhckF0KGkpO1xyXG4gICAgICAgICAgICAgICAgaWYoJygnID09PSBpdGVtKXtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKCcoJyk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZignKScgPT09IGl0ZW0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHN0YWNrLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZigwICE9PSBzdGFjay5sZW5ndGgpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOmUmeivr+aDheWGte+8jCjlkI7pnaLmmK/ov5DnrpfnrKZcclxuICAgICAgICAgICAgaWYoL1xcKFtcXCtcXC1cXCpcXC9dLy50ZXN0KHN0cmluZykpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOmUmeivr+aDheWGte+8jCnliY3pnaLmmK/ov5DnrpfnrKZcclxuICAgICAgICAgICAgaWYoL1tcXCtcXC1cXCpcXC9dXFwpLy50ZXN0KHN0cmluZykpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOmUmeivr+aDheWGte+8jCjliY3pnaLkuI3mmK/ov5DnrpfnrKZcclxuICAgICAgICAgICAgaWYoL1teXFwrXFwtXFwqXFwvXVxcKC8udGVzdChzdHJpbmcpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDplJnor6/mg4XlhrXvvIwp5ZCO6Z2i5LiN5piv6L+Q566X56ymXHJcbiAgICAgICAgICAgIGlmKC9cXClbXlxcK1xcLVxcKlxcL10vLnRlc3Qoc3RyaW5nKSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfV0pO1xyXG5cclxuICAgIEFycmF5LnByb3RvdHlwZS5kZWwgPSBmdW5jdGlvbiAoZmlsdGVyKSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gbnVsbDtcclxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlcih0aGlzW2ldLCBpKSkgaW5kZXggPSBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGluZGV4IT09bnVsbClcclxuICAgICAgICAgICAgdGhpcy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICB9OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHZsdWkuZGlyZWN0aXZlOmZpZWxkSW5mb1xyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBmaWVsZEluZm9cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCdmaWVsZEluZm8nLCBmdW5jdGlvbiAoQU5ZLCBEcm9wLCBjcWwsIERhdGFzZXQpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy9maWVsZGluZm8vZmllbGRpbmZvLmh0bWwnLFxyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGZpZWxkRGVmOiAnPCcsXHJcbiAgICAgICAgZmlsdGVyQWN0aW9uOiAnJicsXHJcbiAgICAgICAgc2hvd0FkZDogJzwnLFxyXG4gICAgICAgIHNob3dDYXJldDogJzwnLFxyXG4gICAgICAgIHNob3dGaWx0ZXI6ICc9JyxcclxuICAgICAgICBzaG93UmVtb3ZlOiAnPCcsXHJcbiAgICAgICAgc2hvd1R5cGU6ICc8JyxcclxuICAgICAgICBzaG93RW51bVNwZWNGbjogJzwnLFxyXG4gICAgICAgIHBvcHVwQ29udGVudDogJzwnLFxyXG4gICAgICAgIGFjdGlvbjogJyYnLFxyXG4gICAgICAgIGFkZEFjdGlvbjogJyYnLFxyXG4gICAgICAgIHJlbW92ZUFjdGlvbjogJyYnLFxyXG4gICAgICAgIGRpc2FibGVDYXJldDogJzwnXHJcbiAgICAgIH0sXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGZ1bmNzUG9wdXA7XHJcblxyXG4gICAgICAgIC8vIFByb3BlcnRpZXMgdGhhdCBhcmUgY3JlYXRlZCBieSBhIHdhdGNoZXIgbGF0ZXJcclxuICAgICAgICBzY29wZS50eXBlTmFtZSA9IG51bGw7XHJcbiAgICAgICAgc2NvcGUuaWNvbiA9IG51bGw7XHJcbiAgICAgICAgc2NvcGUubnVsbCA9IG51bGw7XHJcblxyXG4gICAgICAgIHNjb3BlLmZpZWxkVGl0bGUgPSBmdW5jdGlvbihmaWVsZCkge1xyXG4gICAgICAgICAgaWYgKGNxbC5lbnVtU3BlYy5pc0VudW1TcGVjKGZpZWxkKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gKGZpZWxkLmVudW0gfHwgWydXaWxkY2FyZCddKVxyXG4gICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZCA9PT0gJyonID8gJ0NPVU5UJyA6IGZpZWxkO1xyXG4gICAgICAgICAgICAgIH0pLmpvaW4oJywnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBmaWVsZDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzY29wZS5maWVsZENvdW50ID0gZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAgIGlmIChjcWwuZW51bVNwZWMuaXNFbnVtU3BlYyhmaWVsZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpZWxkLmVudW0gPyAnICgnICsgZmllbGQuZW51bS5sZW5ndGggKyAnKScgOiAnJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzY29wZS5jbGlja2VkID0gZnVuY3Rpb24oJGV2ZW50KXtcclxuICAgICAgICAgIGlmKHNjb3BlLmFjdGlvbiAmJiAkZXZlbnQudGFyZ2V0ICE9PSBlbGVtZW50LmZpbmQoJy5mYS1jYXJldC1kb3duJylbMF0gJiZcclxuICAgICAgICAgICAgJGV2ZW50LnRhcmdldCAhPT0gZWxlbWVudC5maW5kKCdzcGFuLnR5cGUnKVswXSkge1xyXG4gICAgICAgICAgICBzY29wZS5hY3Rpb24oJGV2ZW50KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgaXNFbnVtU3BlYyA9IGNxbC5lbnVtU3BlYy5pc0VudW1TcGVjO1xyXG5cclxuICAgICAgICBzY29wZS5mdW5jID0gZnVuY3Rpb24oZmllbGREZWYpIHtcclxuICAgICAgICAgIGlmIChmaWVsZERlZi5hZ2dyZWdhdGUpIHtcclxuICAgICAgICAgICAgaWYgKCFpc0VudW1TcGVjKGZpZWxkRGVmLmFnZ3JlZ2F0ZSkpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZmllbGREZWYuYWdncmVnYXRlO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNjb3BlLnNob3dFbnVtU3BlY0ZuKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICc/JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGZpZWxkRGVmLnRpbWVVbml0KSB7XHJcbiAgICAgICAgICAgIGlmICghaXNFbnVtU3BlYyhmaWVsZERlZi50aW1lVW5pdCkpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZmllbGREZWYudGltZVVuaXQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2NvcGUuc2hvd0VudW1TcGVjRm4pIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJz8nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoZmllbGREZWYuYmluKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNFbnVtU3BlYyhmaWVsZERlZi5iaW4pKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICdiaW4nO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNjb3BlLnNob3dFbnVtU3BlY0ZuKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICc/JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBmaWVsZERlZi5fYWdncmVnYXRlIHx8IGZpZWxkRGVmLl90aW1lVW5pdCB8fFxyXG4gICAgICAgICAgICAoZmllbGREZWYuX2JpbiAmJiAnYmluJykgfHwgKGZpZWxkRGVmLl9hbnkgJiYgJ2F1dG8nKSB8fCAnJztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyB2YXIgcG9wdXBDb250ZW50V2F0Y2hlciA9IHNjb3BlLiR3YXRjaCgncG9wdXBDb250ZW50JywgZnVuY3Rpb24ocG9wdXBDb250ZW50KSB7XHJcbiAgICAgICAgLy8gICBpZiAoIXBvcHVwQ29udGVudCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgLy8gICBpZiAoZnVuY3NQb3B1cCkge1xyXG4gICAgICAgIC8vICAgICBmdW5jc1BvcHVwLmRlc3Ryb3koKTtcclxuICAgICAgICAvLyAgIH1cclxuXHJcbiAgICAgICAgLy8gICBmdW5jc1BvcHVwID0gbmV3IERyb3Aoe1xyXG4gICAgICAgIC8vICAgICBjb250ZW50OiBwb3B1cENvbnRlbnQsXHJcbiAgICAgICAgLy8gICAgIHRhcmdldDogZWxlbWVudC5maW5kKCcudHlwZS1jYXJldCcpWzBdLFxyXG4gICAgICAgIC8vICAgICBwb3NpdGlvbjogJ2JvdHRvbSBsZWZ0JyxcclxuICAgICAgICAvLyAgICAgb3Blbk9uOiAnY2xpY2snXHJcbiAgICAgICAgLy8gICB9KTtcclxuICAgICAgICAvLyB9KTtcclxuXHJcbiAgICAgICAgdmFyIFRZUEVfTkFNRVMgPSB7XHJcbiAgICAgICAgICBub21pbmFsOiAndGV4dCcsXHJcbiAgICAgICAgICBvcmRpbmFsOiAndGV4dC1vcmRpbmFsJyxcclxuICAgICAgICAgIHF1YW50aXRhdGl2ZTogJ251bWJlcicsXHJcbiAgICAgICAgICB0ZW1wb3JhbDogJ3RpbWUnLFxyXG4gICAgICAgICAgZ2VvZ3JhcGhpYzogJ2dlbydcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgVFlQRV9JQ09OUyA9IHtcclxuICAgICAgICAgIG5vbWluYWw6ICdmYS1mb250JyxcclxuICAgICAgICAgIG9yZGluYWw6ICdmYS1mb250JyxcclxuICAgICAgICAgIHF1YW50aXRhdGl2ZTogJ2ljb24taGFzaCcsXHJcbiAgICAgICAgICB0ZW1wb3JhbDogJ2ZhLWNhbGVuZGFyJyxcclxuICAgICAgICAgIGNhbGN1bGF0b3I6J2ZhLWNhbGN1bGF0b3InXHJcbiAgICAgICAgfTtcclxuICAgICAgICBUWVBFX0lDT05TW0FOWV0gPSAnZmEtYXN0ZXJpc2snOyAvLyBzZXBhcmF0ZSBsaW5lIGJlY2F1c2Ugd2UgbWlnaHQgY2hhbmdlIHdoYXQncyB0aGUgc3RyaW5nIGZvciBBTllcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0VHlwZURpY3RWYWx1ZSh0eXBlLCBkaWN0KSB7XHJcbiAgICAgICAgICBpZiAoY3FsLmVudW1TcGVjLmlzRW51bVNwZWModHlwZSkpIHsgLy8gaXMgZW51bVNwZWNcclxuICAgICAgICAgICAgaWYgKCF0eXBlLmVudW0pIHtcclxuICAgICAgICAgICAgICByZXR1cm4gQU5ZOyAvLyBlbnVtIHNwZWMgd2l0aG91dCBzcGVjaWZpYyB2YWx1ZXNcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHZhbCA9IG51bGw7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZS5lbnVtLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgdmFyIF90eXBlID0gdHlwZS5lbnVtW2ldO1xyXG4gICAgICAgICAgICAgIHZhciB2ID0gZGljdCA/IGRpY3RbX3R5cGVdIDogX3R5cGU7XHJcbiAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gdjtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbCAhPT0gdikge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gQU5ZOyAvLyBJZiB0aGVyZSBhcmUgbWFueSBjb25mbGljdGluZyB0eXBlc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdmFsO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGRpY3QgPyBkaWN0W3R5cGVdIDogdHlwZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmaWVsZERlZldhdGNoZXIgPSBzY29wZS4kd2F0Y2goJ2ZpZWxkRGVmLnR5cGUnLCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICBzY29wZS5pY29uID0gZ2V0VHlwZURpY3RWYWx1ZSh0eXBlLCBUWVBFX0lDT05TKTtcclxuICAgICAgICAgIHZhciB0eXBlTmFtZSA9IHR5cGU7XHJcbiAgICAgICAgICBpZiAodHlwZU5hbWUgPT09ICdvcmRpbmFsJyB8fCB0eXBlTmFtZSA9PT0gJ25vbWluYWwnKSB7XHJcbiAgICAgICAgICAgIHR5cGVOYW1lICs9ICgnICgnICsgRGF0YXNldC5zY2hlbWEucHJpbWl0aXZlVHlwZShzY29wZS5maWVsZERlZi5maWVsZCkgKyAnKScpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlICYmIHR5cGUuZW51bSkge1xyXG4gICAgICAgICAgICB0eXBlTmFtZSA9IHR5cGUuZW51bVswXTsgLy8gRklYTUUgam9pbiB0aGVtIGlmIHdlIHN1cHBvcnQgbWFueSB0eXBlc1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgc2NvcGUudHlwZU5hbWUgPSB0eXBlTmFtZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKGZ1bmNzUG9wdXAgJiYgZnVuY3NQb3B1cC5kZXN0cm95KSB7XHJcbiAgICAgICAgICAgIGZ1bmNzUG9wdXAuZGVzdHJveSgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIHVucmVnaXN0ZXIgd2F0Y2hlcnNcclxuICAgICAgICAgIC8vIHBvcHVwQ29udGVudFdhdGNoZXIoKTtcclxuICAgICAgICAgIGZpZWxkRGVmV2F0Y2hlcigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSB2bHVpLmRpcmVjdGl2ZTptb2RhbFxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBtb2RhbFxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5kaXJlY3RpdmUoJ21vZGFsJywgZnVuY3Rpb24gKCRkb2N1bWVudCwgTW9kYWxzKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvbW9kYWwvbW9kYWwuaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgYXV0b09wZW46ICc8JyxcclxuICAgICAgICBtYXhXaWR0aDogJ0AnXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFByb3ZpZGUgYW4gaW50ZXJmYWNlIGZvciBjaGlsZCBkaXJlY3RpdmVzIHRvIGNsb3NlIHRoaXMgbW9kYWxcclxuICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0sXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgIHZhciBtb2RhbElkID0gYXR0cnMuaWQ7XHJcblxyXG4gICAgICAgIGlmIChzY29wZS5tYXhXaWR0aCkge1xyXG4gICAgICAgICAgc2NvcGUud3JhcHBlclN0eWxlID0gJ21heC13aWR0aDonICsgc2NvcGUubWF4V2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZWZhdWx0IHRvIGNsb3NlZCB1bmxlc3MgYXV0b09wZW4gaXMgc2V0XHJcbiAgICAgICAgc2NvcGUuaXNPcGVuID0gc2NvcGUuYXV0b09wZW47XHJcblxyXG4gICAgICAgIC8vIGNsb3NlIG9uIGVzY1xyXG4gICAgICAgIGZ1bmN0aW9uIGVzY2FwZShlKSB7XHJcbiAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAyNyAmJiBzY29wZS5pc09wZW4pIHtcclxuICAgICAgICAgICAgc2NvcGUuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHNjb3BlLiRkaWdlc3QoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkZG9jdW1lbnQpLm9uKCdrZXlkb3duJywgZXNjYXBlKTtcclxuXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgdGhpcyBtb2RhbCB3aXRoIHRoZSBzZXJ2aWNlXHJcbiAgICAgICAgTW9kYWxzLnJlZ2lzdGVyKG1vZGFsSWQsIHNjb3BlKTtcclxuICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBNb2RhbHMuZGVyZWdpc3Rlcihtb2RhbElkKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgdmx1aS5kaXJlY3RpdmU6bW9kYWxDbG9zZUJ1dHRvblxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyBtb2RhbENsb3NlQnV0dG9uXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmRpcmVjdGl2ZSgnbW9kYWxDbG9zZUJ1dHRvbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL21vZGFsL21vZGFsY2xvc2VidXR0b24uaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHJlcXVpcmU6ICdeXm1vZGFsJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBjbG9zZUFjdGlvbjogJyYnXHJcbiAgICAgIH0sXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbW9kYWxDb250cm9sbGVyKSB7XHJcbiAgICAgICAgc2NvcGUuY2xvc2VNb2RhbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgbW9kYWxDb250cm9sbGVyLmNsb3NlKCk7XHJcbiAgICAgICAgICBpZiAoc2NvcGUuY2xvc2VBY3Rpb24pIHtcclxuICAgICAgICAgICAgc2NvcGUuY2xvc2VBY3Rpb24oKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5nZG9jIHNlcnZpY2VcclxuICogQG5hbWUgdmx1aS5Nb2RhbHNcclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgTW9kYWxzXHJcbiAqIFNlcnZpY2UgdXNlZCB0byBjb250cm9sIG1vZGFsIHZpc2liaWxpdHkgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwbGljYXRpb25cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmFjdG9yeSgnTW9kYWxzJywgZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnkpIHtcclxuXHJcbiAgICAvLyBUT0RPOiBUaGUgdXNlIG9mIHNjb3BlIGhlcmUgYXMgdGhlIG1ldGhvZCBieSB3aGljaCBhIG1vZGFsIGRpcmVjdGl2ZVxyXG4gICAgLy8gaXMgcmVnaXN0ZXJlZCBhbmQgY29udHJvbGxlZCBtYXkgbmVlZCB0byBjaGFuZ2UgdG8gc3VwcG9ydCByZXRyaWV2aW5nXHJcbiAgICAvLyBkYXRhIGZyb20gYSBtb2RhbCBhcyBtYXkgYmUgbmVlZGVkIGluICM3N1xyXG4gICAgdmFyIG1vZGFsc0NhY2hlID0gJGNhY2hlRmFjdG9yeSgnbW9kYWxzJyk7XHJcblxyXG4gICAgLy8gUHVibGljIEFQSVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKGlkLCBzY29wZSkge1xyXG4gICAgICAgIGlmIChtb2RhbHNDYWNoZS5nZXQoaWQpKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDYW5ub3QgcmVnaXN0ZXIgdHdvIG1vZGFscyB3aXRoIGlkICcgKyBpZCk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1vZGFsc0NhY2hlLnB1dChpZCwgc2NvcGUpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgZGVyZWdpc3RlcjogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICBtb2RhbHNDYWNoZS5yZW1vdmUoaWQpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gT3BlbiBhIG1vZGFsXHJcbiAgICAgIG9wZW46IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgdmFyIG1vZGFsU2NvcGUgPSBtb2RhbHNDYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgIGlmICghbW9kYWxTY29wZSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignVW5yZWdpc3RlcmVkIG1vZGFsIGlkICcgKyBpZCk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1vZGFsU2NvcGUuaXNPcGVuID0gdHJ1ZTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIENsb3NlIGEgbW9kYWxcclxuICAgICAgY2xvc2U6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgdmFyIG1vZGFsU2NvcGUgPSBtb2RhbHNDYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgIGlmICghbW9kYWxTY29wZSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignVW5yZWdpc3RlcmVkIG1vZGFsIGlkICcgKyBpZCk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1vZGFsU2NvcGUuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBlbXB0eTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbW9kYWxzQ2FjaGUucmVtb3ZlQWxsKCk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBjb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vZGFsc0NhY2hlLmluZm8oKS5zaXplO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmRpcmVjdGl2ZSgnc2NoZW1hTGlzdCcsIGZ1bmN0aW9uKGNxbCwgTG9nZ2VyLCBQaWxscykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL3NjaGVtYWxpc3Qvc2NoZW1hbGlzdC5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBvcmRlckJ5OiAnPCcsXHJcbiAgICAgICAgZmllbGREZWZzOiAnPCcsXHJcbiAgICAgICAgZmlsdGVyTWFuYWdlcjogJz0nLFxyXG4gICAgICAgIHNob3dBZGQ6ICc8JyxcclxuICAgICAgICBzaG93Q291bnQ6ICc8JyxcclxuICAgICAgICBzaG93RHJvcDogJzwnXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XHJcbiAgICAgICAgc2NvcGUuUGlsbHMgPSBQaWxscztcclxuICAgICAgICBzY29wZS5pc0VudW1TcGVjID0gY3FsLmVudW1TcGVjLmlzRW51bVNwZWM7XHJcblxyXG4gICAgICAgIHNjb3BlLmRyb3BwZWRGaWVsZERlZiA9IHt9O1xyXG4gICAgICAgIHNjb3BlLmNvdW50RmllbGREZWYgPSBQaWxscy5jb3VudEZpZWxkRGVmO1xyXG4gICAgICAgIHNjb3BlLmNhbGNGaWVsZERlZiA9IFBpbGxzLmNhbGNGaWVsZERlZjsvL+iuoeeul+aMh+agh1xyXG4gICAgICAgIHNjb3BlLmZpZWxkRHJvcHBlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKExvZ2dlci5hY3Rpb25zLkFERF9XSUxEQ0FSRCwgc2NvcGUuZHJvcHBlZEZpZWxkRGVmKTtcclxuICAgICAgICAgIFBpbGxzLmFkZFdpbGRjYXJkKHNjb3BlLmRyb3BwZWRGaWVsZERlZik7XHJcbiAgICAgICAgICBzY29wZS5kcm9wcGVkRmllbGREZWYgPSB7fTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5nZG9jIGRpcmVjdGl2ZVxyXG4gKiBAbmFtZSBwb2xlc3Rhci5kaXJlY3RpdmU6c2NoZW1hTGlzdEl0ZW1cclxuICogQGRlc2NyaXB0aW9uXHJcbiAqICMgc2NoZW1hTGlzdEl0ZW1cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCdzY2hlbWFMaXN0SXRlbScsIGZ1bmN0aW9uIChEYXRhc2V0LCBEcm9wLCBMb2dnZXIsIFBpbGxzLCBjcWwsIGNvbnN0cykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL3NjaGVtYWxpc3Qvc2NoZW1hbGlzdGl0ZW0uaHRtbCcsXHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHJlcGxhY2U6IGZhbHNlLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGZpZWxkRGVmOiAnPScsIC8vIFR3by13YXlcclxuICAgICAgICBzaG93QWRkOiAnPCcsXHJcbiAgICAgICAgZmlsdGVyTWFuYWdlcjogJz0nXHJcbiAgICAgIH0sXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uIHBvc3RMaW5rKHNjb3BlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgc2NvcGUuRGF0YXNldCA9IERhdGFzZXQ7XHJcbiAgICAgICAgc2NvcGUuY29uc3RzID0gY29uc3RzO1xyXG4gICAgICAgIHNjb3BlLmNvdW50RmllbGREZWYgPSBQaWxscy5jb3VudEZpZWxkRGVmO1xyXG5cclxuICAgICAgICBzY29wZS5pc0FueUZpZWxkID0gZmFsc2U7XHJcbiAgICAgICAgc2NvcGUuZHJvcHBlZEZpZWxkRGVmID0gbnVsbDtcclxuICAgICAgICBzY29wZS5maWVsZEluZm9Qb3B1cENvbnRlbnQgPSBlbGVtZW50LmZpbmQoJy5zY2hlbWEtbWVudScpWzBdO1xyXG5cclxuICAgICAgICBzY29wZS5pc0VudW1TcGVjID0gY3FsLmVudW1TcGVjLmlzRW51bVNwZWM7XHJcblxyXG4gICAgICAgIHNjb3BlLmZpZWxkQWRkID0gZnVuY3Rpb24gKGZpZWxkRGVmKSB7XHJcbiAgICAgICAgICBQaWxscy5hZGQoZmllbGREZWYpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLnRvZ2dsZUZpbHRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmICghc2NvcGUuZmlsdGVyTWFuYWdlcikgcmV0dXJuO1xyXG4gICAgICAgICAgc2NvcGUuZmlsdGVyTWFuYWdlci50b2dnbGUoc2NvcGUuZmllbGREZWYuZmllbGQpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLmZpZWxkRHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIGZpZWxkRGVmID0gc2NvcGUuZmllbGREZWY7XHJcblxyXG4gICAgICAgICAgc2NvcGUucGlsbCA9IHtcclxuICAgICAgICAgICAgZmllbGQ6IGZpZWxkRGVmLmZpZWxkLFxyXG4gICAgICAgICAgICB0aXRsZTogZmllbGREZWYudGl0bGUsXHJcbiAgICAgICAgICAgIHR5cGU6IGZpZWxkRGVmLnR5cGUsXHJcbiAgICAgICAgICAgIGFnZ3JlZ2F0ZTogZmllbGREZWYuYWdncmVnYXRlXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgUGlsbHMuZHJhZ1N0YXJ0KHNjb3BlLnBpbGwsIG51bGwpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLmZpZWxkRHJhZ1N0b3AgPSBQaWxscy5kcmFnU3RvcDtcclxuXHJcbiAgICAgICAgc2NvcGUuZmllbGREcm9wcGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgUGlsbHMuYWRkV2lsZGNhcmRGaWVsZChzY29wZS5maWVsZERlZiwgc2NvcGUuZHJvcHBlZEZpZWxkRGVmKTtcclxuICAgICAgICAgIExvZ2dlci5sb2dJbnRlcmFjdGlvbihMb2dnZXIuYWN0aW9ucy5BRERfV0lMRENBUkRfRklFTEQsIHNjb3BlLmZpZWxkRGVmLCB7XHJcbiAgICAgICAgICAgIGFkZGVkRmllbGQ6IHNjb3BlLmRyb3BwZWRGaWVsZERlZlxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBzY29wZS5kcm9wcGVkRmllbGREZWYgPSBudWxsO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLnJlbW92ZVdpbGRjYXJkRmllbGQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICAgIHZhciBmaWVsZCA9IHNjb3BlLmZpZWxkRGVmLmZpZWxkO1xyXG4gICAgICAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKExvZ2dlci5hY3Rpb25zLlJFTU9WRV9XSUxEQ0FSRF9GSUVMRCwgc2NvcGUuZmllbGREZWYsIHtcclxuICAgICAgICAgICAgcmVtb3ZlZEZpZWxkOiBmaWVsZC5lbnVtW2luZGV4XSA9PT0gJyonID8gJ0NPVU5UJyA6IGZpZWxkLmVudW1baW5kZXhdXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIFBpbGxzLnJlbW92ZVdpbGRjYXJkRmllbGQoc2NvcGUuZmllbGREZWYsIGluZGV4KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzY29wZS5yZW1vdmVXaWxkY2FyZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIExvZ2dlci5sb2dJbnRlcmFjdGlvbihMb2dnZXIuYWN0aW9ucy5SRU1PVkVfV0lMRENBUkQsIHNjb3BlLmZpZWxkRGVmKTtcclxuICAgICAgICAgIFBpbGxzLnJlbW92ZVdpbGRjYXJkKHNjb3BlLmZpZWxkRGVmKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBUT0RPKGh0dHBzOi8vZ2l0aHViLmNvbS92ZWdhL3ZlZ2EtbGl0ZS11aS9pc3N1ZXMvMTg3KTpcclxuICAgICAgICAvLyBjb25zaWRlciBpZiB3ZSBjYW4gdXNlIHZhbGlkYXRvciAvIGNxbCBpbnN0ZWFkXHJcbiAgICAgICAgdmFyIHRoaXNUeXBlID0ge1xyXG4gICAgICAgICAgXCJUeXBlXCI6IHtcclxuICAgICAgICAgICAgXCJRVUFOVElUQVRJVkVcIjogXCJxdWFudGl0YXRpdmVcIixcclxuICAgICAgICAgICAgXCJxdWFudGl0YXRpdmVcIjogXCJRVUFOVElUQVRJVkVcIixcclxuICAgICAgICAgICAgXCJPUkRJTkFMXCI6IFwib3JkaW5hbFwiLFxyXG4gICAgICAgICAgICBcIm9yZGluYWxcIjogXCJPUkRJTkFMXCIsXHJcbiAgICAgICAgICAgIFwiVEVNUE9SQUxcIjogXCJ0ZW1wb3JhbFwiLFxyXG4gICAgICAgICAgICBcInRlbXBvcmFsXCI6IFwiVEVNUE9SQUxcIixcclxuICAgICAgICAgICAgXCJOT01JTkFMXCI6IFwibm9taW5hbFwiLFxyXG4gICAgICAgICAgICBcIm5vbWluYWxcIjogXCJOT01JTkFMXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcIlFVQU5USVRBVElWRVwiOiBcInF1YW50aXRhdGl2ZVwiLFxyXG4gICAgICAgICAgXCJPUkRJTkFMXCI6IFwib3JkaW5hbFwiLFxyXG4gICAgICAgICAgXCJURU1QT1JBTFwiOiBcInRlbXBvcmFsXCIsXHJcbiAgICAgICAgICBcIk5PTUlOQUxcIjogXCJub21pbmFsXCIsXHJcbiAgICAgICAgICBcIlNIT1JUX1RZUEVcIjoge1xyXG4gICAgICAgICAgICBcInF1YW50aXRhdGl2ZVwiOiBcIlFcIixcclxuICAgICAgICAgICAgXCJ0ZW1wb3JhbFwiOiBcIlRcIixcclxuICAgICAgICAgICAgXCJub21pbmFsXCI6IFwiTlwiLFxyXG4gICAgICAgICAgICBcIm9yZGluYWxcIjogXCJPXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcIlRZUEVfRlJPTV9TSE9SVF9UWVBFXCI6IHtcclxuICAgICAgICAgICAgXCJRXCI6IFwicXVhbnRpdGF0aXZlXCIsXHJcbiAgICAgICAgICAgIFwiVFwiOiBcInRlbXBvcmFsXCIsXHJcbiAgICAgICAgICAgIFwiT1wiOiBcIm9yZGluYWxcIixcclxuICAgICAgICAgICAgXCJOXCI6IFwibm9taW5hbFwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgYWxsb3dlZENhc3RpbmcgPSB7XHJcbiAgICAgICAgICBpbnRlZ2VyOiBbdGhpc1R5cGUuUVVBTlRJVEFUSVZFLCB0aGlzVHlwZS5PUkRJTkFMLCB0aGlzVHlwZS5OT01JTkFMXSxcclxuICAgICAgICAgIG51bWJlcjogW3RoaXNUeXBlLlFVQU5USVRBVElWRSwgdGhpc1R5cGUuT1JESU5BTCwgdGhpc1R5cGUuTk9NSU5BTF0sXHJcbiAgICAgICAgICBkYXRlOiBbdGhpc1R5cGUuVEVNUE9SQUxdLFxyXG4gICAgICAgICAgc3RyaW5nOiBbdGhpc1R5cGUuTk9NSU5BTF0sXHJcbiAgICAgICAgICBib29sZWFuOiBbdGhpc1R5cGUuTk9NSU5BTF0sXHJcbiAgICAgICAgICBhbGw6IFt0aGlzVHlwZS5RVUFOVElUQVRJVkUsIHRoaXNUeXBlLlRFTVBPUkFMLCB0aGlzVHlwZS5PUkRJTkFMLCB0aGlzVHlwZS5OT01JTkFMXVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciB1bndhdGNoRmllbGREZWYgPSBzY29wZS4kd2F0Y2goJ2ZpZWxkRGVmJywgZnVuY3Rpb24gKGZpZWxkRGVmKSB7XHJcbiAgICAgICAgICBpZiAoY3FsLmVudW1TcGVjLmlzRW51bVNwZWMoZmllbGREZWYuZmllbGQpKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmFsbG93ZWRUeXBlcyA9IGFsbG93ZWRDYXN0aW5nLmFsbDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmFsbG93ZWRUeXBlcyA9IGFsbG93ZWRDYXN0aW5nW2ZpZWxkRGVmLnByaW1pdGl2ZVR5cGVdO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHNjb3BlLmlzQW55RmllbGQgPSBjcWwuZW51bVNwZWMuaXNFbnVtU3BlYyhmaWVsZERlZi5maWVsZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNjb3BlLmZpZWxkVGl0bGUgPSBmdW5jdGlvbiAoZmllbGQpIHtcclxuICAgICAgICAgIGlmIChjcWwuZW51bVNwZWMuaXNFbnVtU3BlYyhmaWVsZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChmaWVsZC5lbnVtIHx8IFsnV2lsZGNhcmQnXSlcclxuICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChmaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkID09PSAnKicgPyAnQ09VTlQnIDogZmllbGQ7XHJcbiAgICAgICAgICAgICAgfSkuam9pbignLCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGZpZWxkO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBzY29wZS5maWVsZEFkZCA9IG51bGw7XHJcbiAgICAgICAgICBzY29wZS5maWVsZERyYWdTdG9wID0gbnVsbDtcclxuICAgICAgICAgIHNjb3BlLmlzRW51bVNwZWMgPSBudWxsO1xyXG5cclxuICAgICAgICAgIHVud2F0Y2hGaWVsZERlZigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLmRpcmVjdGl2ZSgnc2hlbHZlcycsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbXBvbmVudHMvc2hlbHZlcy9zaGVsdmVzLmh0bWwnLFxyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIHNwZWM6ICc9JyxcclxuICAgICAgICBwcmV2aWV3OiAnPCcsXHJcbiAgICAgICAgc3VwcG9ydEFueTogJzwnLFxyXG4gICAgICAgIHN1cHBvcnRBdXRvTWFyazogJzwnLFxyXG4gICAgICAgIGZpbHRlck1hbmFnZXI6ICc9JyxcclxuICAgICAgICBjaHJvbjogJzwnLFxyXG4gICAgICAgIGVjY29uZmlnOic9J1xyXG4gICAgICB9LFxyXG4gICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJHRpbWVvdXQsIEFOWSwgQ29uZmlnLCBEYXRhc2V0LCBMb2dnZXIsIFBpbGxzKSB7XHJcblxyXG4gICAgICAgICRzY29wZS5BTlkgPSBBTlk7XHJcbiAgICAgICAgJHNjb3BlLmFueUNoYW5uZWxJZHMgPSBbXTtcclxuICAgICAgICAkc2NvcGUuRGF0YXNldCA9IERhdGFzZXQ7XHJcbiAgICAgICAgJHNjb3BlLmZyZXNoTW9kZWwgPSB0cnVlO1xyXG4gICAgICAgICRzY29wZS50aXRsZVNob3cgPSB0cnVlO1xyXG4gICAgICAgICRzY29wZS50aGVtZVNob3cgPSB0cnVlO1xyXG4gICAgICAgICRzY29wZS5wcm9wU2hvdyA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLmxlZ2VuZFNob3cgPSB0cnVlO1xyXG4gICAgICAgICRzY29wZS5vcHRpb25TaG93ID0gdHJ1ZTtcclxuICAgICAgICAkc2NvcGUuZmlsdGVyU2hvdyA9IHRydWU7XHJcbiAgICAgICAgJHNjb3BlLm1pbiA9IDA7XHJcbiAgICAgICAgJHNjb3BlLm1heCA9IDEwMDtcclxuICAgICAgICAvLyAkc2NvcGUubWFya3MgPSBbJ3BvaW50JywgJ3RpY2snLCAnYmFyJywgJ2xpbmUnLCAnYXJlYScsICd0ZXh0J107XHJcbiAgICAgICAgJHNjb3BlLm1hcmtzID0gWydwaWUnLCAnZ2F1Z2UnLCAnYm1hcCcsJ21peGVkJywnc2NhdHRlcicsJ3JhZGFyJywnc2luZ2xlJywgJ2Z1bm5lbCcsJ2NhbmRsZXN0aWNrJywnd29yZENsb3VkJywndHJlZW1hcCcsJ2dyYXBoJywnZGJhcicsJ3RyZWUnLCdzYW5rZXknXTsvLywnc3VuYnVyc3QnXHJcbiAgICAgICAgJHNjb3BlLmVjaGFydHRoZW1lbGlzdCA9IFt7IHY6ICdpbmZvZ3JhcGhpYycsIHQ6ICfmoLflvI/kuIAnIH0sIHsgdjogJ21hY2Fyb25zJywgdDogJ+agt+W8j+S6jCcgfSwgeyB2OiAnc2hpbmUnLCB0OiAn5qC35byP5LiJJyB9LCB7IHY6ICdkYXJrJywgdDogJ+agt+W8j+WbmycgfSwgeyB2OiAncm9tYScsIHQ6ICfmoLflvI/kupQnIH1dO1xyXG4gICAgICBcclxuICAgICAgICAkc2NvcGUubWFya3NpY29uID0ge1xyXG4gICAgICAgICAgXCJwaWVcIjoge1xyXG4gICAgICAgICAgICBpY29uOiAnZmEtcGllLWNoYXJ0JyxcclxuICAgICAgICAgICAgdGl0bGU6ICfppbznirblm74nXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJnYXVnZVwiOiB7XHJcbiAgICAgICAgICAgIGljb246ICdmYS10YWNob21ldGVyJyxcclxuICAgICAgICAgICAgdGl0bGU6ICfku6rooajnm5gnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJibWFwXCI6IHtcclxuICAgICAgICAgICAgaWNvbjogJ2ZhLW1hcC1vJyxcclxuICAgICAgICAgICAgdGl0bGU6ICflnLDlm74nXHJcbiAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgIFwibWl4ZWRcIjp7XHJcbiAgICAgICAgICAgIGljb246J2ZhLWxpbmUtY2hhcnQnLFxyXG4gICAgICAgICAgICB0aXRsZTon5re35ZCIJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwic2NhdHRlclwiOntcclxuICAgICAgICAgICAgaWNvbjonZmEtYnJhaWxsZScsXHJcbiAgICAgICAgICAgIHRpdGxlOifmlaPngrknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJyYWRhclwiOntcclxuICAgICAgICAgICAgaWNvbjonZmEtY29ubmVjdGRldmVsb3AnLFxyXG4gICAgICAgICAgICB0aXRsZTon6Zu36L6+5Zu+J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwic2luZ2xlXCI6e1xyXG4gICAgICAgICAgICBpY29uOidmYS1sb25nLWFycm93LXVwJyxcclxuICAgICAgICAgICAgdGl0bGU6J+WNleaMh+aghydcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcImZ1bm5lbFwiOntcclxuICAgICAgICAgICAgaWNvbjonZmEtYWxpZ24tY2VudGVyJyxcclxuICAgICAgICAgICAgdGl0bGU6J+a8j+aWl+WbvidcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcImNhbmRsZXN0aWNrXCI6e1xyXG4gICAgICAgICAgICBpY29uOidmYS1saW5lLWNoYXJ0JyxcclxuICAgICAgICAgICAgdGl0bGU6J0vnur/lm74nXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJ3b3JkQ2xvdWRcIjp7XHJcbiAgICAgICAgICAgIGljb246J2ZhLWJ1aWxkaW5nJyxcclxuICAgICAgICAgICAgdGl0bGU6J+ivjeS6keWbvidcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcInRyZWVtYXBcIjp7XHJcbiAgICAgICAgICAgIGljb246J2ZhLXRoLWxhcmdlJyxcclxuICAgICAgICAgICAgdGl0bGU6J+efqemYteWbvidcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcImdyYXBoXCI6e1xyXG4gICAgICAgICAgICBpY29uOidmYS1zaGFyZS1hbHQnLFxyXG4gICAgICAgICAgICB0aXRsZTon5Yqb5a2m5YWz57O75Zu+J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiZGJhclwiOntcclxuICAgICAgICAgICAgaWNvbjonZmEtYmFyLWNoYXJ0JyxcclxuICAgICAgICAgICAgdGl0bGU6J+Wkmue7tOafsSdcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBcInRyZWVcIjp7XHJcbiAgICAgICAgICAgIGljb246J2ZhLXRyZWUnLFxyXG4gICAgICAgICAgICB0aXRsZTon5qCR5b2i5Zu+J1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwic2Fua2V5XCI6e1xyXG4gICAgICAgICAgICBpY29uOidmYS1iYXJjb2RlJyxcclxuICAgICAgICAgICAgdGl0bGU6J+ahkeWfuuWbvidcclxuICAgICAgICAgIH0vKixcclxuICAgICAgICAgIFwic3VuYnVyc3RcIjp7XHJcbiAgICAgICAgICAgIGljb246J2ZhLWRvdC1jaXJjbGUtbycsXHJcbiAgICAgICAgICAgIHRpdGxlOifml63ml6Xlm74nXHJcbiAgICAgICAgICB9Ki9cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5pZmVjaGFydCA9IGZhbHNlO1xyXG4gICAgICAgICRzY29wZS50YWIgPSAndGFiMSc7XHJcbiAgICAgICAgJHNjb3BlLmVjaGFydFNoYXBlID0gWydwaWUnLCAnZ2F1Z2UnLCAnYm1hcCcsJ21peGVkJywnc2NhdHRlcicsJ3JhZGFyJywnc2luZ2xlJywnZnVubmVsJywnY2FuZGxlc3RpY2snLCd3b3JsZGNsb3VkJywndHJlZW1hcCcsJ2dyYXBoJywnc3VuYnVyc3QnLCdzYW5rZXknXTtcclxuXHJcbiAgICAgICAgLy8gJHNjb3BlLm1hcmtzaWNvbltBTlldID0ge1xyXG4gICAgICAgIC8vICAgaWNvbjogJ2ZhLWJ1bGxzZXllJyxcclxuICAgICAgICAvLyAgIHRpdGxlOiAn6Ieq5YqoJ1xyXG4gICAgICAgIC8vIH07XHJcbiAgICAgICAgJHNjb3BlLnNob3dtYXJrdHlwZSA9IGZhbHNlO1xyXG4gICAgICAgICRzY29wZS5jaGFuZ2V0eXBlID0gZnVuY3Rpb24gKG1hcmspIHtcclxuICAgICAgICAgICRzY29wZS5zcGVjLm1hcmsgPSBtYXJrO1xyXG4gICAgICAgICAgJHNjb3BlLm1hcmtkZXRhaWwgPSAkc2NvcGUubWFya3NpY29uW21hcmtdO1xyXG4gICAgICAgICAgJHNjb3BlLnNob3dtYXJrdHlwZSA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5oYXNPcHRpb24gPSBmdW5jdGlvbih0eXBlKXtcclxuICAgICAgICAgIHJldHVybiBbJ3BpZScsJ21peGVkJywnc2luZ2xlJ10uaW5kZXhPZih0eXBlKSA+IC0xO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnNwZWMubWFyayA9ICdwaWUnO1xyXG4gICAgICAgICRzY29wZS5tYXJrZGV0YWlsID0gJHNjb3BlLm1hcmtzaWNvblsncGllJ107XHJcbiAgICAgICAgJHNjb3BlLm1hcmtzV2l0aEFueSA9ICRzY29wZS5tYXJrcztcclxuXHJcbiAgICAgICAgJHNjb3BlLm1hcmtDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBMb2dnZXIubG9nSW50ZXJhY3Rpb24oTG9nZ2VyLmFjdGlvbnMuTUFSS19DSEFOR0UsICRzY29wZS5zcGVjLm1hcmspO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICBcclxuICAgICAgICAkc2NvcGUuc2V0VGFiID0gZnVuY3Rpb24odGFiKXtcclxuICAgICAgICAgICRzY29wZS50YWIgPSB0YWI7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBMb2dnZXIubG9nSW50ZXJhY3Rpb24oTG9nZ2VyLmFjdGlvbnMuU1BFQ19DTEVBTiwgJHNjb3BlLnNwZWMpO1xyXG4gICAgICAgICAgUGlsbHMucmVzZXQoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdlY2NvbmZpZy50aXRsZScsZnVuY3Rpb24odmFsKXtcclxuICAgICAgICAgIGlmKCRzY29wZS5lY2NvbmZpZyAmJiAkc2NvcGUuZWNjb25maWcudGl0bGUpe1xyXG4gICAgICAgICAgICAkc2NvcGUubm9ybWFsVGl0bGUgPSBhbmd1bGFyLmNvcHkodmFsLnRleHQgKTtcclxuICAgICAgICAgICAgJHNjb3BlLm5vcm1hbFN1YlRpdGxlID0gYW5ndWxhci5jb3B5KHZhbC5zdWJ0ZXh0KTtcclxuICAgICAgICAgICAgJHNjb3BlLm5vcm1hbFRpdGxlUG9zaXRpb24gPSBhbmd1bGFyLmNvcHkodmFsLmxlZnQpO1xyXG4gICAgICAgICAgICAkc2NvcGUudGl0bGV0ZXh0Y29sb3IgPSBhbmd1bGFyLmNvcHkodmFsLnRleHRTdHlsZS5jb2xvcik7XHJcbiAgICAgICAgICAgICRzY29wZS5zdWJ0aXRsZXRleHRjb2xvciA9IGFuZ3VsYXIuY29weSh2YWwuc3VidGV4dFN0eWxlLmNvbG9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LHRydWUpO1xyXG5cclxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdlY2NvbmZpZy5vcHRpb24nLGZ1bmN0aW9uKHZhbCl7XHJcbiAgICAgICAgICBpZigkc2NvcGUuZWNjb25maWcgJiYgJHNjb3BlLmVjY29uZmlnLm9wdGlvbiAmJiAkc2NvcGUuZWNjb25maWcuZGF0YS50eXBlID09PSAnc2luZ2xlJyl7XHJcbiAgICAgICAgICAgICRzY29wZS5ib3JkZXJfY29sb3IgPSB2YWwudGhlcm1vbWV0ZXIuYm9yZGVyY29sb3I7XHJcbiAgICAgICAgICAgICRzY29wZS5iYXJfY29sb3IgPSB2YWwudGhlcm1vbWV0ZXIuYmFyY29sb3I7XHJcbiAgICAgICAgICAgICRzY29wZS5wb2ludF9jb2xvciA9IHZhbC50aGVybW9tZXRlci5wb2ludGNvbG9yO1xyXG4gICAgICAgICAgICAkc2NvcGUudGl0bGVfY29sb3IgPSB2YWwudGhlcm1vbWV0ZXIudGl0bGVjb2xvcjtcclxuICAgICAgICAgICAgJHNjb3BlLnZhbHVlX2NvbG9yID0gdmFsLmNhcmQudmFsdWVjb2xvcjtcclxuICAgICAgICAgICAgJHNjb3BlLmZpbGxfY29sb3IgPSB2YWwuY2FyZC5maWxsY29sb3I7XHJcbiAgICAgICAgICAgICRzY29wZS5zdHJva2VfY29sb3IgPSB2YWwuY2FyZC5zdHJva2Vjb2xvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LHRydWUpO1xyXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3NwZWMubWFyaycsIGZ1bmN0aW9uIChtYXJrKSB7XHJcbiAgICAgICAgICAkc2NvcGUubWFya2RldGFpbCA9ICRzY29wZS5tYXJrc2ljb25bbWFya107XHJcbiAgICAgICAgICBpZiAoJHNjb3BlLmVjaGFydFNoYXBlLmluZGV4T2YobWFyaykgPj0gMCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuaWZlY2hhcnQgPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICRzY29wZS5pZmVjaGFydCA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICQoXCIuY29sb3ItaW5wdXQtdGl0bGVcIikuY29sb3JwaWNrZXIoe1xyXG4gICAgICAgICAgICBjb2xvclNlbGVjdG9yczoge1xyXG4gICAgICAgICAgICAgICAgJyMwMDAwMDAnOiAnIzAwMDAwMCcsXHJcbiAgICAgICAgICAgICAgICAnI2ZmZmZmZic6ICcjZmZmZmZmJyxcclxuICAgICAgICAgICAgICAgICcjRkYwMDAwJzogJyNGRjAwMDAnLFxyXG4gICAgICAgICAgICAgICAgJyM3Nzc3NzcnOiAnIzc3Nzc3NycsXHJcbiAgICAgICAgICAgICAgICAnIzMzN2FiNyc6ICcjMzM3YWI3JyxcclxuICAgICAgICAgICAgICAgICcjNWNiODVjJzogJyM1Y2I4NWMnLFxyXG4gICAgICAgICAgICAgICAgJyM1YmMwZGUnOiAnIzViYzBkZScsXHJcbiAgICAgICAgICAgICAgICAnI2YwYWQ0ZSc6ICcjZjBhZDRlJyxcclxuICAgICAgICAgICAgICAgICcjZDk1MzRmJzogJyNkOTUzNGYnLFxyXG4gICAgICAgICAgICAgICAgJyNGRkZGMDAnOicjRkZGRjAwJyxcclxuICAgICAgICAgICAgICAgICcjRUUwMEVFJzonI0VFMDBFRScsXHJcbiAgICAgICAgICAgICAgICAnI0FERkYyRic6JyNBREZGMkYnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KS5vbignY2hhbmdlQ29sb3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAnYnQnKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLnRpdGxldGV4dGNvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PT0gJ3NidCcpIHtcclxuICAgICAgICAgICAgICAkc2NvcGUuc3VidGl0bGV0ZXh0Y29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7IH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ2VjY29uZmlnLnR5cGUnLGZ1bmN0aW9uKHR5cGUpe1xyXG4gICAgICAgICAgaWYodHlwZSl7XHJcbiAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJChcIi5jb2xvci1pbnB1dC1zaW5nbGVcIikuY29sb3JwaWNrZXIoe1xyXG4gICAgICAgICAgICBjb2xvclNlbGVjdG9yczoge1xyXG4gICAgICAgICAgICAgICAgJyMwMDAwMDAnOiAnIzAwMDAwMCcsXHJcbiAgICAgICAgICAgICAgICAnI2ZmZmZmZic6ICcjZmZmZmZmJyxcclxuICAgICAgICAgICAgICAgICcjRkYwMDAwJzogJyNGRjAwMDAnLFxyXG4gICAgICAgICAgICAgICAgJyM3Nzc3NzcnOiAnIzc3Nzc3NycsXHJcbiAgICAgICAgICAgICAgICAnIzMzN2FiNyc6ICcjMzM3YWI3JyxcclxuICAgICAgICAgICAgICAgICcjNWNiODVjJzogJyM1Y2I4NWMnLFxyXG4gICAgICAgICAgICAgICAgJyM1YmMwZGUnOiAnIzViYzBkZScsXHJcbiAgICAgICAgICAgICAgICAnI2YwYWQ0ZSc6ICcjZjBhZDRlJyxcclxuICAgICAgICAgICAgICAgICcjZDk1MzRmJzogJyNkOTUzNGYnLFxyXG4gICAgICAgICAgICAgICAgJyNGRkZGMDAnOicjRkZGRjAwJyxcclxuICAgICAgICAgICAgICAgICcjRUUwMEVFJzonI0VFMDBFRScsXHJcbiAgICAgICAgICAgICAgICAnI0FERkYyRic6JyNBREZGMkYnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KS5vbignY2hhbmdlQ29sb3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAnYm9yZGVyJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5ib3JkZXJfY29sb3IgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3JlbCcpID09PSAncG9pbnQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBvaW50X2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PT0gJ2JhcicpIHtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYmFyX2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PT0gJ3RpdGxlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS50aXRsZV9jb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cigncmVsJykgPT09ICdmaWxsJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5maWxsX2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PT0gJ3N0cm9rZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3Ryb2tlX2NvbG9yID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdyZWwnKSA9PT0gJ3ZhbHVlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS52YWx1ZV9jb2xvciA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAkc2NvcGUuc2V0Tm9ybWFsVGl0bGUgPSBmdW5jdGlvbiAodGl0bGVfdHlwZSkge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5mcmVzaE1vZGVsKSB7XHJcbiAgICAgICAgICAgIGlmICh0aXRsZV90eXBlID09PSAndGl0bGUnKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLnRpdGxlLnRleHQgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLm5vcm1hbFRpdGxlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAkc2NvcGUuZWNjb25maWcudGl0bGUuc3VidGV4dCA9IGFuZ3VsYXIuY29weSgkc2NvcGUubm9ybWFsU3ViVGl0bGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUuc2V0VG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCRzY29wZS5mcmVzaE1vZGVsKSB7XHJcbiAgICAgICAgICAgIGlmICgkc2NvcGUuZWNjb25maWcubWFwZGF0YS5vcmRlcl9tb2RhbCAhPT0gJzAnKSB7XHJcbiAgICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLm1hcGRhdGEudG9wX251bSA9IGFuZ3VsYXIuY29weSgkc2NvcGUudG9wX251bSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5zZXRDb2xvciA9IGZ1bmN0aW9uICh0eXBlKSB7XHJcbiAgICAgICAgICBpZiAodHlwZSA9PT0gJ2JvcmRlcicpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLm9wdGlvbi50aGVybW9tZXRlci5ib3JkZXJjb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUuYm9yZGVyX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmKHR5cGUgPT09ICdwb2ludCcpe1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcub3B0aW9uLnRoZXJtb21ldGVyLnBvaW50Y29sb3IgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnBvaW50X2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2Jhcicpe1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcub3B0aW9uLnRoZXJtb21ldGVyLmJhcmNvbG9yID0gYW5ndWxhci5jb3B5KCRzY29wZS5iYXJfY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmKHR5cGUgPT09IFwidGl0bGVcIil7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5vcHRpb24udGhlcm1vbWV0ZXIudGl0bGVjb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUudGl0bGVfY29sb3IpO1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcub3B0aW9uLmNhcmQudGl0bGVjb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUudGl0bGVfY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2ZpbGwnKXtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLm9wdGlvbi5jYXJkLmZpbGxjb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUuZmlsbF9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZih0eXBlID09PSAnc3Ryb2tlJyl7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5vcHRpb24uY2FyZC5zdHJva2Vjb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUuc3Ryb2tlX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmKHR5cGUgPT09ICd2YWx1ZScpe1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcub3B0aW9uLmNhcmQudmFsdWVjb2xvciA9IGFuZ3VsYXIuY29weSgkc2NvcGUudmFsdWVfY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2J0Jyl7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy50aXRsZS50ZXh0U3R5bGUuY29sb3IgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnRpdGxldGV4dGNvbG9yKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZih0eXBlID09PSAnc2J0Jyl7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy50aXRsZS5zdWJ0ZXh0U3R5bGUuY29sb3IgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnN1YnRpdGxldGV4dGNvbG9yKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5zZXRPcmRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmICgkc2NvcGUuZnJlc2hNb2RlbCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcubWFwZGF0YS5vcmRlcl9tb2RhbCA9IGFuZ3VsYXIuY29weSgkc2NvcGUub3JkZXJfbW9kYWwpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnNldFRpdGxlUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAoJHNjb3BlLmZyZXNoTW9kZWwpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLm1hcGRhdGEubWFwX3RpdGxlX2xlZnQgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLm1hcF90aXRsZV9sZWZ0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuc2V0Tm9ybWFsVGl0bGVQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmICgkc2NvcGUuZnJlc2hNb2RlbCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZWNjb25maWcudGl0bGUubGVmdCA9IGFuZ3VsYXIuY29weSgkc2NvcGUubm9ybWFsVGl0bGVQb3NpdGlvbik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvL21peGVkIFxyXG4gICAgICAgICRzY29wZS5taXhlZHlGaWVsZERyb3AgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC5yZW5hbWUgPSAkc2NvcGUueW1vZGVsLmZpZWxkO1xyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC50eXBlID0gJ2Jhcic7XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLnRydWV0eXBlID0gJ2Jhcic7XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmlzYXJlYSA9ICcwJztcclxuICAgICAgICAgICRzY29wZS55bW9kZWwuc21vb3RoID0gZmFsc2U7Ly/mm7Lnur/kuLrmipjnur9cclxuICAgICAgICAgICRzY29wZS55bW9kZWwuc2hvd21heCA9IGZhbHNlOy8v5pi+56S65pyA5aSn5YC85rCU5rOhXHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLnNob3dtaW4gPSBmYWxzZTsvL+aYvuekuuacgOWwj+WAvOawlOazoVxyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC5zaG93bGluZSA9IGZhbHNlOy8v5Z2H5YC857q/XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmJhc2ViYXIgPSBmYWxzZTsvL+WfuuehgOWPoOWKoOafsVxyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC5zaGFkb3diYXIgPSBmYWxzZTsvL+S9nOS4uumYtOW9seafsVxyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC5uZXd5ID0gZmFsc2U7Ly/ni6znq4tZ6L20XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmludmVyc2V5ID0gZmFsc2U7Ly9Z6L205Y+N572uXHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLnNob3duZXd5ID0gJHNjb3BlLmVjY29uZmlnLmZpZWxkLnkubGVuZ3RoPjA7Ly/ni6znq4tZ6L20XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmF1dG9Db2xvciA9ICd0cnVlJztcclxuICAgICAgICAgICRzY29wZS55bW9kZWwuY29sb3IgPSBcIiMzMzNcIjtcclxuICAgICAgICAgICRzY29wZS55bW9kZWwuYWxlcnRzY291bnQgPSAwOy8v6K2m5oiS57q/5p2h5pWwXHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmxhYmVsID0ge1xyXG4gICAgICAgICAgICBub3JtYWw6e1xyXG4gICAgICAgICAgICAgIHNob3c6J3RydWUnLFxyXG4gICAgICAgICAgICAgIHBvc2l0aW9uOid0b3AnLFxyXG4gICAgICAgICAgICAgIHJvdGF0ZTonMCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZC55LnB1c2goYW5ndWxhci5jb3B5KCRzY29wZS55bW9kZWwpKTtcclxuICAgICAgICB9O1xyXG4vL2vnur/lm75cclxuICAgICAgICAkc2NvcGUua3lGaWVsZERyb3AgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC5yZW5hbWUgPSAkc2NvcGUueW1vZGVsLmZpZWxkO1xyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC50eXBlID0gJ2xpbmUnO1xyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC50cnVldHlwZSA9ICdsaW5lJztcclxuICAgICAgICAgICRzY29wZS55bW9kZWwuaXNhcmVhID0gJzAnO1xyXG4gICAgICAgICAgJHNjb3BlLnltb2RlbC5zbW9vdGggPSB0cnVlOy8v5puy57q/5Li65oqY57q/XHJcbiAgICAgICAgICAkc2NvcGUueW1vZGVsLmxhYmVsID0ge1xyXG4gICAgICAgICAgICBub3JtYWw6e1xyXG4gICAgICAgICAgICAgIHNob3c6J3RydWUnLFxyXG4gICAgICAgICAgICAgIHBvc2l0aW9uOid0b3AnLFxyXG4gICAgICAgICAgICAgIHJvdGF0ZTonMCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZC55LnB1c2goYW5ndWxhci5jb3B5KCRzY29wZS55bW9kZWwpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUucG9pbnRGaWVsZERyb3AgID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICRzY29wZS5wb2ludE1vZGVsLmNvbG9yID0gXCIjMzMzXCI7XHJcbiAgICAgICAgICAkc2NvcGUucG9pbnRNb2RlbC5pZnRvcCA9ICdmYWxzZSc7XHJcbiAgICAgICAgICAkc2NvcGUucG9pbnRNb2RlbC5vcmRlciA9ICdhc2MnO1xyXG4gICAgICAgICAgJHNjb3BlLnBvaW50TW9kZWwub3JkZXJfbnVtID0gJzUnO1xyXG4gICAgICAgICAgJHNjb3BlLnBvaW50TW9kZWwudG9wX2NvbG9yID0gJ2JsdWUnO1xyXG4gICAgICAgICAgJHNjb3BlLmVjY29uZmlnLnBvaW50LnB1c2goe1xyXG4gICAgICAgICAgICB4OmFuZ3VsYXIuY29weSgkc2NvcGUucG9pbnRNb2RlbCksXHJcbiAgICAgICAgICAgIHk6e30sXHJcbiAgICAgICAgICAgIGxvbjp7fSxcclxuICAgICAgICAgICAgbGF0Ont9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5oYXNMZWdlbmQgPSBmdW5jdGlvbihtYXJrKXtcclxuICAgICAgICAgIGlmKFsnbWl4ZWQnLCdwaWUnLCdmdW5uZWwnLCdzY2F0dGVyJywncmFkYXInXS5pbmRleE9mKG1hcmspID49IDApe1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5waWV4RmllbGREcm9wID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICRzY29wZS5waWV4bW9kZWwubGFiZWwgPSB7XHJcbiAgICAgICAgICAgIHNob3c6J3RydWUnLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjonb3V0c2lkZScsXHJcbiAgICAgICAgICAgIHNob3dwZXJjZW50Oid0cnVlJ1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZC54LnB1c2goYW5ndWxhci5jb3B5KCRzY29wZS5waWV4bW9kZWwpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUuZ2F1Z2VZRmllbGREcm9wID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICRzY29wZS5nYXVnZVkubmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAkc2NvcGUuZ2F1Z2VZLnNob3dQZXJjZW50ID0gXCJmYWxzZVwiO1xyXG4gICAgICAgICAgJHNjb3BlLmdhdWdlWS5kZWNpbWFscyA9IDA7XHJcbiAgICAgICAgICAkc2NvcGUuZ2F1Z2VZLmF1dG9NYXggPSBcImZhbHNlXCI7XHJcbiAgICAgICAgICAkc2NvcGUuZ2F1Z2VZLm1heEZpZWxkID0ge307XHJcbiAgICAgICAgICAkc2NvcGUuZ2F1Z2VZLmF1dG9TcGxpdCA9IFwiZmFsc2VcIjsvL+WKqOaAgeWIhuautVxyXG4gICAgICAgICAgJHNjb3BlLmdhdWdlWS5zcGxpdEZpZWxkID0gW107Ly/liqjmgIHliIbmrrVcclxuICAgICAgICAgICRzY29wZS5nYXVnZVkuc3BsaXRjb2xvciA9IFwiI2YwOTQyNlwiOy8v6KGo55uY6aKc6ImyXHJcbiAgICAgICAgICAkc2NvcGUuZ2F1Z2VZLmZ1bGx3aWR0aCA9IFwiODBcIjsvL+Whq+WFheWuveW6plxyXG4gICAgICAgICAgJHNjb3BlLmdhdWdlWS5tYXggPSBcIjEwMFwiO1xyXG4gICAgICAgICAgJHNjb3BlLmdhdWdlWS5yYW5nZSA9IFwiMC4yLDAuOFwiO1xyXG4gICAgICAgICAgJHNjb3BlLmdhdWdlWS5zdHlsZSA9IHtcclxuICAgICAgICAgICAgaXRlbVN0eWxlOiB7Ly/mjIfpkohcclxuICAgICAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoYWRvd0JsdXI6IDE1LFxyXG4gICAgICAgICAgICAgICAgICAgICBzaGFkb3dDb2xvcjogJ3JnYmEoNDAsIDQwLCA0MCwgMC41KSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYXhpc0xpbmU6e1xyXG4gICAgICAgICAgICAgIGxpbmVTdHlsZTp7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogMTBcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGF4aXNUaWNrOntcclxuICAgICAgICAgICAgICBsZW5ndGg6ICcxNScsICAgICAgICAvLyDlsZ7mgKdsZW5ndGjmjqfliLbnur/plb9cclxuICAgICAgICAgICAgICBsaW5lU3R5bGU6IHsgICAgICAgLy8g5bGe5oCnbGluZVN0eWxl5o6n5Yi257q/5p2h5qC35byPXHJcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAnYXV0bydcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwbGl0TGluZTp7XHJcbiAgICAgICAgICAgICAgbGVuZ3RoOiAnMjAnLCAgICAgICAgIC8vIOWxnuaAp2xlbmd0aOaOp+WItue6v+mVv1xyXG4gICAgICAgICAgICAgIGxpbmVTdHlsZTogeyAgICAgICAvLyDlsZ7mgKdsaW5lU3R5bGXvvIjor6bop4FsaW5lU3R5bGXvvInmjqfliLbnur/mnaHmoLflvI9cclxuICAgICAgICAgICAgICAgICAgY29sb3I6ICdhdXRvJ1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGV0YWlsOntcclxuICAgICAgICAgICAgICBmb250U2l6ZTonMTInXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRpdGxlOntcclxuICAgICAgICAgICAgICBmb250U2l6ZTonMjAnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICAkc2NvcGUuZWNjb25maWcuZmllbGQueS5wdXNoKGFuZ3VsYXIuY29weSgkc2NvcGUuZ2F1Z2VZKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnNpbmdsZUZpZWxkRHJvcCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAkc2NvcGUuc2luZ2xlTW9kZWwubGFiZWwgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnNpbmdsZU1vZGVsLmZpZWxkKTtcclxuICAgICAgICAgICRzY29wZS5zaW5nbGVNb2RlbC51bml0ID0gXCJcIjtcclxuICAgICAgICAgICRzY29wZS5zaW5nbGVNb2RlbC5wbHVzaWNvbiA9IFwiZmFsc2VcIjtcclxuICAgICAgICAgICRzY29wZS5zaW5nbGVNb2RlbC5fdGl0bGVGb250c2l6ZSA9IDEyOy8v5LiN6KaB55So5a2X56ym5Z6LLOaOp+S7tuaYr2ludOWei+e7keWumizkvJrlr7zoh7TnsbvlnovovazmjaIsJHdhdGNo5Lya5Yi35paw5Lik5qyh57uE5Lu2XHJcbiAgICAgICAgICAkc2NvcGUuc2luZ2xlTW9kZWwuX3ZhbHVlRm9udHNpemUgPSAxMjtcclxuICAgICAgICAgICRzY29wZS5zaW5nbGVNb2RlbC5fdGl0bGVDb2xvciA9ICcjMDAwMDAwJztcclxuICAgICAgICAgICRzY29wZS5zaW5nbGVNb2RlbC5fdmFsdWVDb2xvciA9ICcjMDAwMDAwJztcclxuICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZC55LnB1c2goYW5ndWxhci5jb3B5KCRzY29wZS5zaW5nbGVNb2RlbCkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRzY29wZS5maWx0ZXJGaWVsZERyb3AgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgJHNjb3BlLmVjY29uZmlnLmZpZWxkLmZpbHRlcnMgPSAkc2NvcGUuZWNjb25maWcuZmllbGQuZmlsdGVyc3x8W107XHJcbiAgICAgICAgICAvLyRzY29wZS5maWx0ZXJtb2RhbC5ydWxlID1cIj09XCI7XHJcbiAgICAgICAgICAvLyRzY29wZS5maWx0ZXJtb2RhbC52YWx1ZSA9XCJcIjtcclxuICAgICAgICAgICRzY29wZS5maWx0ZXJtb2RhbC5ydWxlcyA9IFtdLy9be2lkOjEscGFyZW50aWQ6MCxyZWxhdGU6J2FuZCcscnVsZTonJyx2YWx1ZTonJ30se2lkOjIscGFyZW50aWQ6MSxuYW1lOiRzY29wZS5maWx0ZXJtb2RhbC5maWVsZCxyZWxhdGU6J2FuZCcscnVsZTonPT0nLHZhbHVlOicxMSd9LHtpZDozLHBhcmVudGlkOjEscmVsYXRlOidvcicscnVsZTonJyx2YWx1ZTonJ30sXHJcbiAgICAgICAgICAgICAgICAgICAvL3tpZDo0LHBhcmVudGlkOjMsbmFtZTokc2NvcGUuZmlsdGVybW9kYWwuZmllbGQscmVsYXRlOidhbmQnLHJ1bGU6Jz09Jyx2YWx1ZTonMjIxJ30sXHJcbiAgICAgICAgICAgICAgICAgIC8ve2lkOjUscGFyZW50aWQ6MyxuYW1lOiRzY29wZS5maWx0ZXJtb2RhbC5maWVsZCxyZWxhdGU6J2FuZCcscnVsZTonPT0nLHZhbHVlOicyMjInfV07XHJcbiAgICAgICAgICAkc2NvcGUuZWNjb25maWcuZmlsdGVyLmZpbHRlcnMucHVzaChhbmd1bGFyLmNvcHkoJHNjb3BlLmZpbHRlcm1vZGFsKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnJlbW92ZU1peCA9IGZ1bmN0aW9uKGZpZWxkLG51bSkge1xyXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoJHNjb3BlLmVjY29uZmlnLmZpZWxkW2ZpZWxkXSkpIHsgXHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZFtmaWVsZF0uc3BsaWNlKG51bSwxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5maWVsZFtmaWVsZF0gPSB7fTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkc2NvcGUucmVtb3ZlRmlsdGVyID0gZnVuY3Rpb24gKGZpZWxkLG51bSl7XHJcbiAgICAgICAgICBpZihudW0hPXVuZGVmaW5lZClcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLmZpbHRlcltmaWVsZF0uc3BsaWNlKG51bSwxKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLmZpbHRlcltmaWVsZF0uZmllbGQgPSB7fTtcclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5yZW1vdmVQb2ludCA9IGZ1bmN0aW9uKGZpZWxkLG51bSl7XHJcbiAgICAgICAgICBpZihmaWVsZCA9PSAneCcpe1xyXG4gICAgICAgICAgICAgIHZhciBhID0gY29uZmlybSgn5piv5ZCm5Yig6Zmk6L+Z5Liq5qCH6K6wJyk7XHJcbiAgICAgICAgICAgIGlmKGEpe1xyXG4gICAgICAgICAgICAgICRzY29wZS5lY2NvbmZpZy5wb2ludC5zcGxpY2UobnVtLDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgJHNjb3BlLmVjY29uZmlnLnBvaW50W251bV1bZmllbGRdID0ge307XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJHNjb3BlLnJlbW92ZUFyZWEgPSBmdW5jdGlvbihmaWVsZCl7XHJcbiAgICAgICAgICAkc2NvcGUuZWNjb25maWcuYXJlYVtmaWVsZF0gPSB7fTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIHZhciBzcGVjV2F0Y2hlciA9ICRzY29wZS4kd2F0Y2goJ3NwZWMnLCBmdW5jdGlvbiAoc3BlYykge1xyXG4gICAgICAgIC8vICAgLy8gcG9wdWxhdGUgYW55Q2hhbm5lbElkcyBzbyB3ZSBzaG93IGFsbCBvciB0aGVtXHJcbiAgICAgICAgLy8gICBpZiAoJHNjb3BlLnN1cHBvcnRBbnkpIHtcclxuICAgICAgICAvLyAgICAgJHNjb3BlLmFueUNoYW5uZWxJZHMgPSB1dGlsLmtleXMoc3BlYy5lbmNvZGluZykucmVkdWNlKGZ1bmN0aW9uIChhbnlDaGFubmVsSWRzLCBjaGFubmVsSWQpIHtcclxuICAgICAgICAvLyAgICAgICBpZiAoUGlsbHMuaXNBbnlDaGFubmVsKGNoYW5uZWxJZCkpIHtcclxuICAgICAgICAvLyAgICAgICAgIGFueUNoYW5uZWxJZHMucHVzaChjaGFubmVsSWQpO1xyXG4gICAgICAgIC8vICAgICAgIH1cclxuICAgICAgICAvLyAgICAgICByZXR1cm4gYW55Q2hhbm5lbElkcztcclxuICAgICAgICAvLyAgICAgfSwgW10pO1xyXG4gICAgICAgIC8vICAgfVxyXG4gICAgICAgIC8vICAgLy8gT25seSBjYWxsIFBpbGxzLnVwZGF0ZSwgd2hpY2ggd2lsbCB0cmlnZ2VyIFNwZWMuc3BlYyB0byB1cGRhdGUgaWYgaXQncyBub3QgYSBwcmV2aWV3LlxyXG4gICAgICAgIC8vICAgaWYgKCEkc2NvcGUucHJldmlldykge1xyXG4gICAgICAgIC8vICAgICB2YXIgU3BlYyA9IFBpbGxzLnVwZGF0ZShzcGVjKTtcclxuICAgICAgICAvLyAgICAgdmFyIGxvZ0RhdGEgPSBudWxsO1xyXG4gICAgICAgIC8vICAgICBpZiAoU3BlYykge1xyXG4gICAgICAgIC8vICAgICAgIGlmIChTcGVjLmNoYXJ0cykge1xyXG4gICAgICAgIC8vICAgICAgICAgbG9nRGF0YSA9IHsgc3BlY2lmaWM6IGZhbHNlLCBudW1DaGFydHM6IFNwZWMuY2hhcnRzLmxlbmd0aCB9O1xyXG4gICAgICAgIC8vICAgICAgIH0gZWxzZSBpZiAoU3BlYy5jaGFydCkge1xyXG4gICAgICAgIC8vICAgICAgICAgbG9nRGF0YSA9IHsgc3BlY2lmaWM6IHRydWUgfTtcclxuICAgICAgICAvLyAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vICAgICAgICAgbG9nRGF0YSA9IHsgc3BlY2lmaWM6IGZhbHNlLCBudW1DaGFydHM6IDAgfTtcclxuICAgICAgICAvLyAgICAgICB9XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKExvZ2dlci5hY3Rpb25zLlNQRUNfQ0hBTkdFLCBzcGVjLCBsb2dEYXRhKTtcclxuICAgICAgICAvLyAgIH1cclxuICAgICAgICAvLyB9LCB0cnVlKTsgLy8sIHRydWUgLyogd2F0Y2ggZXF1YWxpdHkgcmF0aGVyIHRoYW4gcmVmZXJlbmNlICovKTtcclxuXHJcblxyXG4gICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgLy8gQ2xlYW4gdXAgd2F0Y2hlclxyXG4gICAgICAgICAgc3BlY1dhdGNoZXIoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcclxuICogQG5hbWUgdmx1aS5kaXJlY3RpdmU6dGFiXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAjIHRhYlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5kaXJlY3RpdmUoJ3RhYicsIGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL3RhYnMvdGFiLmh0bWwnLFxyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICByZXF1aXJlOiAnXl50YWJzZXQnLFxyXG4gICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICB0cmFuc2NsdWRlOiB0cnVlLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGhlYWRpbmc6ICdAJ1xyXG4gICAgICB9LFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIHRhYnNldENvbnRyb2xsZXIpIHtcclxuICAgICAgICB0YWJzZXRDb250cm9sbGVyLmFkZFRhYihzY29wZSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2MgZGlyZWN0aXZlXHJcbiAqIEBuYW1lIHZsdWkuZGlyZWN0aXZlOnRhYnNldFxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyB0YWJzZXRcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZGlyZWN0aXZlKCd0YWJzZXQnLCBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy90YWJzL3RhYnNldC5odG1sJyxcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIEludGVyZmFjZSBmb3IgdGFicyB0byByZWdpc3RlciB0aGVtc2VsdmVzXHJcbiAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy50YWJzID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuYWRkVGFiID0gZnVuY3Rpb24odGFiU2NvcGUpIHtcclxuICAgICAgICAgIC8vIEZpcnN0IHRhYiBpcyBhbHdheXMgYXV0by1hY3RpdmF0ZWQ7IG90aGVycyBhdXRvLWRlYWN0aXZhdGVkXHJcbiAgICAgICAgICB0YWJTY29wZS5hY3RpdmUgPSBzZWxmLnRhYnMubGVuZ3RoID09PSAwO1xyXG4gICAgICAgICAgc2VsZi50YWJzLnB1c2godGFiU2NvcGUpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1RhYiA9IGZ1bmN0aW9uKHNlbGVjdGVkVGFiKSB7XHJcbiAgICAgICAgICBzZWxmLnRhYnMuZm9yRWFjaChmdW5jdGlvbih0YWIpIHtcclxuICAgICAgICAgICAgLy8gQWN0aXZhdGUgdGhlIHNlbGVjdGVkIHRhYiwgZGVhY3RpdmF0ZSBhbGwgb3RoZXJzXHJcbiAgICAgICAgICAgIHRhYi5hY3RpdmUgPSB0YWIgPT09IHNlbGVjdGVkVGFiO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIEV4cG9zZSBjb250cm9sbGVyIHRvIHRlbXBsYXRlcyBhcyBcInRhYnNldFwiXHJcbiAgICAgIGNvbnRyb2xsZXJBczogJ3RhYnNldCdcclxuICAgIH07XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmlsdGVyKCdjb21wYWN0SlNPTicsIGZ1bmN0aW9uKEpTT04zKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgcmV0dXJuIEpTT04zLnN0cmluZ2lmeShpbnB1dCwgbnVsbCwgJyAgJywgODApO1xyXG4gICAgfTtcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBmaWx0ZXJcclxuICogQG5hbWUgdmVnYS1saXRlLXVpLmZpbHRlcjplbmNvZGVVcmlcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAjIGVuY29kZVVyaVxyXG4gKiBGaWx0ZXIgaW4gdGhlIHZlZ2EtbGl0ZS11aS5cclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmlsdGVyKCdlbmNvZGVVUkknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgIHJldHVybiB3aW5kb3cuZW5jb2RlVVJJKGlucHV0KTtcclxuICAgIH07XHJcbiAgfSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBmaWx0ZXJcclxuICogQG5hbWUgZmFjZXRlZHZpei5maWx0ZXI6cmVwb3J0VXJsXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyByZXBvcnRVcmxcclxuICogRmlsdGVyIGluIHRoZSBmYWNldGVkdml6LlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5maWx0ZXIoJ3JlcG9ydFVybCcsIGZ1bmN0aW9uIChjb21wYWN0SlNPTkZpbHRlciwgXywgY29uc3RzKSB7XHJcbiAgICBmdW5jdGlvbiB2b3lhZ2VyUmVwb3J0KHBhcmFtcykge1xyXG4gICAgICB2YXIgdXJsID0gJ2h0dHBzOi8vZG9jcy5nb29nbGUuY29tL2Zvcm1zL2QvMVQ5WkExNEYzbW16ckhSN0pKVlVLeVBYenJNcUY1NENqTElPanYyRTdaRU0vdmlld2Zvcm0/JztcclxuXHJcbiAgICAgIGlmIChwYXJhbXMuZmllbGRzKSB7XHJcbiAgICAgICAgdmFyIHF1ZXJ5ID0gZW5jb2RlVVJJKGNvbXBhY3RKU09ORmlsdGVyKF8udmFsdWVzKHBhcmFtcy5maWVsZHMpKSk7XHJcbiAgICAgICAgdXJsICs9ICdlbnRyeS4xMjQ1MTk5NDc3PScgKyBxdWVyeSArICcmJztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHBhcmFtcy5zcGVjKSB7XHJcbiAgICAgICAgdmFyIHNwZWMgPSBfLm9taXQocGFyYW1zLnNwZWMsICdjb25maWcnKTtcclxuICAgICAgICBzcGVjID0gZW5jb2RlVVJJKGNvbXBhY3RKU09ORmlsdGVyKHNwZWMpKTtcclxuICAgICAgICB1cmwgKz0gJ2VudHJ5LjEzMjM2ODAxMzY9JyArIHNwZWMgKyAnJic7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChwYXJhbXMuc3BlYzIpIHtcclxuICAgICAgICB2YXIgc3BlYzIgPSBfLm9taXQocGFyYW1zLnNwZWMyLCAnY29uZmlnJyk7XHJcbiAgICAgICAgc3BlYzIgPSBlbmNvZGVVUkkoY29tcGFjdEpTT05GaWx0ZXIoc3BlYzIpKTtcclxuICAgICAgICB1cmwgKz0gJ2VudHJ5Ljg1MzEzNzc4Nj0nICsgc3BlYzIgKyAnJic7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciB0eXBlUHJvcCA9ICdlbnRyeS4xOTQwMjkyNjc3PSc7XHJcbiAgICAgIHN3aXRjaCAocGFyYW1zLnR5cGUpIHtcclxuICAgICAgICBjYXNlICd2bCc6XHJcbiAgICAgICAgICB1cmwgKz0gdHlwZVByb3AgKyAnVmlzdWFsaXphdGlvbitSZW5kZXJpbmcrKFZlZ2FsaXRlKSYnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAndnInOlxyXG4gICAgICAgICAgdXJsICs9IHR5cGVQcm9wICsgJ1JlY29tbWVuZGVyK0FsZ29yaXRobSsoVmlzcmVjKSYnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZnYnOlxyXG4gICAgICAgICAgdXJsICs9IHR5cGVQcm9wICsgJ1JlY29tbWVuZGVyK1VJKyhGYWNldGVkVml6KSYnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdmx1aVJlcG9ydChwYXJhbXMpIHtcclxuICAgICAgdmFyIHVybCA9ICdodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9mb3Jtcy9kLzF4S3MtcUdhTFpFVWZiVG1oZG1Tb1MxM09LT0VwdXVfTk5XRTVUQUFtbF9ZL3ZpZXdmb3JtPyc7XHJcbiAgICAgIGlmIChwYXJhbXMuc3BlYykge1xyXG4gICAgICAgIHZhciBzcGVjID0gXy5vbWl0KHBhcmFtcy5zcGVjLCAnY29uZmlnJyk7XHJcbiAgICAgICAgc3BlYyA9IGVuY29kZVVSSShjb21wYWN0SlNPTkZpbHRlcihzcGVjKSk7XHJcbiAgICAgICAgdXJsICs9ICdlbnRyeS4xMjQ1MTk5NDc3PScgKyBzcGVjICsgJyYnO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbnN0cy5hcHBJZCA9PT0gJ3ZveWFnZXInID8gdm95YWdlclJlcG9ydCA6IHZsdWlSZXBvcnQ7XHJcbiAgfSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuZ2RvYyBmaWx0ZXJcclxuICogQG5hbWUgdmVnYS1saXRlLXVpLmZpbHRlcjp1bmRlcnNjb3JlMnNwYWNlXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAZGVzY3JpcHRpb25cclxuICogIyB1bmRlcnNjb3JlMnNwYWNlXHJcbiAqIEZpbHRlciBpbiB0aGUgdmVnYS1saXRlLXVpLlxyXG4gKi9cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5maWx0ZXIoJ3VuZGVyc2NvcmUyc3BhY2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgIHJldHVybiBpbnB1dCA/IGlucHV0LnJlcGxhY2UoL18rL2csICcgJykgOiAnJztcclxuICAgIH07XHJcbiAgfSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5zZXJ2aWNlKCdDaGFydCcsIGZ1bmN0aW9uIChjcWwsIF8pIHtcclxuICAgIHZhciBDaGFydCA9IHtcclxuICAgICAgZ2V0Q2hhcnQ6IGdldENoYXJ0LFxyXG4gICAgICB0cmFuc3Bvc2U6IHRyYW5zcG9zZVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1NwZWNRdWVyeU1vZGVsR3JvdXAgfCBTcGVjUXVlcnlNb2RlbH0gaXRlbVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRDaGFydChpdGVtKSB7XHJcbiAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAvKiogQHR5cGUge09iamVjdH0gY29uY2lzZSBzcGVjIGdlbmVyYXRlZCAqL1xyXG4gICAgICAgICAgdmxTcGVjOiBudWxsLFxyXG4gICAgICAgICAgZmllbGRTZXQ6IG51bGwsXHJcblxyXG4gICAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9IGdlbmVyYXRlZCB2bCBzaG9ydGhhbmQgKi9cclxuICAgICAgICAgIHNob3J0aGFuZDogbnVsbCxcclxuICAgICAgICAgIGVudW1TcGVjSW5kZXg6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgc3BlY00gPSBpdGVtIGluc3RhbmNlb2YgY3FsLm1vZGVsLlNwZWNRdWVyeU1vZGVsR3JvdXAgP1xyXG4gICAgICAgIGl0ZW0uZ2V0VG9wU3BlY1F1ZXJ5TW9kZWwoKTpcclxuICAgICAgICBpdGVtO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGVudW1TcGVjSW5kZXg6IHNwZWNNLmVudW1TcGVjSW5kZXgsXHJcbiAgICAgICAgZmllbGRTZXQ6IHNwZWNNLnNwZWNRdWVyeS5lbmNvZGluZ3MsXHJcbiAgICAgICAgdmxTcGVjOiBzcGVjTS50b1NwZWMoKSxcclxuICAgICAgICBzaG9ydGhhbmQ6IHNwZWNNLnRvU2hvcnRoYW5kKClcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmFuc3Bvc2Uoc3BlYykge1xyXG4gICAgICB2YXIgZW5jb2RpbmcgPSBfLmNsb25lKHNwZWMuZW5jb2RpbmcpO1xyXG4gICAgICB2YXIgb2xkWEVuYyA9IGVuY29kaW5nLng7XHJcbiAgICAgIHZhciBvbGRZRW5jID0gZW5jb2RpbmcueTtcclxuICAgICAgZW5jb2RpbmcueSA9IG9sZFhFbmM7XHJcbiAgICAgIGVuY29kaW5nLnggPSBvbGRZRW5jO1xyXG5cclxuICAgICAgdmFyIG9sZFJvd0VuYyA9IGVuY29kaW5nLnJvdztcclxuICAgICAgdmFyIG9sZENvbEVuYyA9IGVuY29kaW5nLmNvbHVtbjtcclxuICAgICAgZW5jb2Rpbmcucm93ID0gb2xkQ29sRW5jO1xyXG4gICAgICBlbmNvZGluZy5jb2x1bW4gPSBvbGRSb3dFbmM7XHJcblxyXG4gICAgICBzcGVjLmVuY29kaW5nID0gZW5jb2Rpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIENoYXJ0O1xyXG4gIH0pOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFNlcnZpY2UgZm9yIHRoZSBzcGVjIGNvbmZpZy5cclxuLy8gV2Uga2VlcCB0aGlzIHNlcGFyYXRlIHNvIHRoYXQgY2hhbmdlcyBhcmUga2VwdCBldmVuIGlmIHRoZSBzcGVjIGNoYW5nZXMuXHJcbmFuZ3VsYXIubW9kdWxlKCd2bHVpJylcclxuICAuZmFjdG9yeSgnQ29uZmlnJywgZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgQ29uZmlnID0ge307XHJcblxyXG4gICAgQ29uZmlnLmRhdGEgPSB7fTtcclxuICAgIENvbmZpZy5jb25maWcgPSB7fTtcclxuXHJcbiAgICBDb25maWcuZ2V0Q29uZmlnID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7fTtcclxuICAgIH07XHJcblxyXG4gICAgQ29uZmlnLmdldERhdGEgPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIENvbmZpZy5kYXRhO1xyXG4gICAgfTtcclxuXHJcbiAgICBDb25maWcubGFyZ2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBjZWxsOiB7XHJcbiAgICAgICAgICB3aWR0aDogMzAwLFxyXG4gICAgICAgICAgaGVpZ2h0OiAzMDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZhY2V0OiB7XHJcbiAgICAgICAgICBjZWxsOiB7XHJcbiAgICAgICAgICAgIHdpZHRoOiAxNTAsXHJcbiAgICAgICAgICAgIGhlaWdodDogMTUwXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvdmVybGF5OiB7bGluZTogdHJ1ZX0sXHJcbiAgICAgICAgc2NhbGU6IHt1c2VSYXdEb21haW46IHRydWV9XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuICAgIENvbmZpZy5zbWFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZhY2V0OiB7XHJcbiAgICAgICAgICBjZWxsOiB7XHJcbiAgICAgICAgICAgIHdpZHRoOiAxNTAsXHJcbiAgICAgICAgICAgIGhlaWdodDogMTUwXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvdmVybGF5OiB7bGluZTogdHJ1ZX0sXHJcbiAgICAgICAgc2NhbGU6IHt1c2VSYXdEb21haW46IHRydWV9XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuICAgIENvbmZpZy51cGRhdGVEYXRhc2V0ID0gZnVuY3Rpb24oZGF0YXNldCwgdHlwZSkge1xyXG4gICAgICBpZiAoZGF0YXNldC52YWx1ZXMpIHtcclxuICAgICAgICBDb25maWcuZGF0YS52YWx1ZXMgPSBkYXRhc2V0LnZhbHVlcztcclxuICAgICAgICBkZWxldGUgQ29uZmlnLmRhdGEudXJsO1xyXG4gICAgICAgIENvbmZpZy5kYXRhLmZvcm1hdFR5cGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgQ29uZmlnLmRhdGEudXJsID0gZGF0YXNldC51cmw7XHJcbiAgICAgICAgZGVsZXRlIENvbmZpZy5kYXRhLnZhbHVlcztcclxuICAgICAgICBDb25maWcuZGF0YS5mb3JtYXRUeXBlID0gdHlwZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQ29uZmlnO1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLnNlcnZpY2UoJ0ZpbHRlck1hbmFnZXInLCBmdW5jdGlvbiAoXywgRGF0YXNldCwgTG9nZ2VyKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgLyoqIGxvY2FsIG9iamVjdCBmb3IgdGhpcyBvYmplY3QgKi9cclxuICAgIHNlbGYuZmlsdGVySW5kZXggPSB7fTtcclxuXHJcbiAgICB0aGlzLnRvZ2dsZSA9IGZ1bmN0aW9uKGZpZWxkKSB7XHJcbiAgICAgIGlmICghc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0pIHtcclxuICAgICAgICBzZWxmLmZpbHRlckluZGV4W2ZpZWxkXSA9IGluaXRGaWx0ZXIoZmllbGQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNlbGYuZmlsdGVySW5kZXhbZmllbGRdLmVuYWJsZWQgPSAhc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0uZW5hYmxlZDtcclxuICAgICAgfVxyXG4gICAgICBMb2dnZXIubG9nSW50ZXJhY3Rpb24oXHJcbiAgICAgICAgc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0uZW5hYmxlZCA/IExvZ2dlci5hY3Rpb25zLkZJTFRFUl9FTkFCTEVEIDogTG9nZ2VyLmFjdGlvbnMuRklMVEVSX0RJU0FCTEVELFxyXG4gICAgICAgIGZpZWxkLFxyXG4gICAgICAgIHNlbGYuZmlsdGVySW5kZXhbZmllbGRdXHJcbiAgICAgICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWRkID0gZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgaWYgKCFzZWxmLmZpbHRlckluZGV4W2ZpZWxkXSkge1xyXG4gICAgICAgIHNlbGYuZmlsdGVySW5kZXhbZmllbGRdID0gaW5pdEZpbHRlcihmaWVsZCk7XHJcbiAgICAgICAgTG9nZ2VyLmxvZ0ludGVyYWN0aW9uKExvZ2dlci5hY3Rpb25zLkZJTFRFUl9FTkFCTEVELCBmaWVsZCwgc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYoc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0mJiFzZWxmLmZpbHRlckluZGV4W2ZpZWxkXS5lbmFibGVkKS8vIGpucCBmaXhlZCBkZWxldGUgYnVnXHJcbiAgICAgIHtcclxuICAgICAgICBzZWxmLmZpbHRlckluZGV4W2ZpZWxkXS5lbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yZXNldCA9IGZ1bmN0aW9uKG9sZEZpbHRlciwgaGFyZCkge1xyXG4gICAgICBpZiAoaGFyZCkge1xyXG4gICAgICAgIHNlbGYuZmlsdGVySW5kZXggPSB7fTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBfLmZvckVhY2goc2VsZi5maWx0ZXJJbmRleCwgZnVuY3Rpb24odmFsdWUsIGZpZWxkKSB7XHJcbiAgICAgICAgICBpZiAoc2VsZi5maWx0ZXJJbmRleFtmaWVsZF0uZW5hYmxlZCkge1xyXG4gICAgICAgICAgICBzZWxmLmZpbHRlckluZGV4W2ZpZWxkXSA9IGluaXRGaWx0ZXIoZmllbGQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob2xkRmlsdGVyKSB7XHJcbiAgICAgICAgb2xkRmlsdGVyLmZvckVhY2goZnVuY3Rpb24oZmlsdGVyKSB7XHJcbiAgICAgICAgICBzZWxmLmZpbHRlckluZGV4W2ZpbHRlci5maWVsZF0gPSBhbmd1bGFyLmV4dGVuZCh7ZW5hYmxlZDogdHJ1ZX0sIGZpbHRlcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzZWxmLmZpbHRlckluZGV4O1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFZsRmlsdGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciB2bEZpbHRlciA9IF8ucmVkdWNlKHNlbGYuZmlsdGVySW5kZXgsIGZ1bmN0aW9uIChmaWx0ZXJzLCBmaWx0ZXIpIHtcclxuICAgICAgICB2YXIgZmllbGQgPSBmaWx0ZXIuZmllbGQ7XHJcbiAgICAgICAgdmFyIHRpbWVVbml0ID0gZmlsdGVyLnRpbWVVbml0O1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyLmluKSB7XHJcbiAgICAgICAgICBpZiAoIGZpbHRlci5pbi5sZW5ndGggPT09IDAgfHxcclxuICAgICAgICAgICAgICAgZmlsdGVyLmluLmxlbmd0aCA9PT0gRGF0YXNldC5zY2hlbWEuY2FyZGluYWxpdHkoe2ZpZWxkOiBmaWVsZH0pICkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVycztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGZpbHRlci5yYW5nZSkge1xyXG4gICAgICAgICAgdmFyIGRvbWFpbiA9IERhdGFzZXQuc2NoZW1hLmRvbWFpbih7XHJcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcclxuICAgICAgICAgICAgdGltZVVuaXQ6IHRpbWVVbml0XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBpZiAoZmlsdGVyLnJhbmdlWzBdID09PSBkb21haW5bMF0gJiYgZmlsdGVyLnJhbmdlWzFdID09PSBkb21haW5bMV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcnM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZmlsdGVyLmVuYWJsZWQpIHtcclxuICAgICAgICAgIGZpbHRlcnMucHVzaChfLm9taXQoZmlsdGVyLCAnZW5hYmxlZCcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlcnM7XHJcbiAgICAgIH0sIFtdKTtcclxuXHJcbiAgICAgIHJldHVybiB2bEZpbHRlci5sZW5ndGggPyB2bEZpbHRlciA6IHVuZGVmaW5lZDtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdEZpbHRlcihmaWVsZCkge1xyXG4gICAgICB2YXIgdHlwZSA9IERhdGFzZXQuc2NoZW1hLnR5cGUoZmllbGQpO1xyXG4gICAgICB2YXIgdGhpc1R5cGUgPSB7XHJcbiAgICAgICAgXCJUeXBlXCI6IHtcclxuICAgICAgICAgIFwiUVVBTlRJVEFUSVZFXCI6IFwicXVhbnRpdGF0aXZlXCIsXHJcbiAgICAgICAgICBcInF1YW50aXRhdGl2ZVwiOiBcIlFVQU5USVRBVElWRVwiLFxyXG4gICAgICAgICAgXCJPUkRJTkFMXCI6IFwib3JkaW5hbFwiLFxyXG4gICAgICAgICAgXCJvcmRpbmFsXCI6IFwiT1JESU5BTFwiLFxyXG4gICAgICAgICAgXCJURU1QT1JBTFwiOiBcInRlbXBvcmFsXCIsXHJcbiAgICAgICAgICBcInRlbXBvcmFsXCI6IFwiVEVNUE9SQUxcIixcclxuICAgICAgICAgIFwiTk9NSU5BTFwiOiBcIm5vbWluYWxcIixcclxuICAgICAgICAgIFwibm9taW5hbFwiOiBcIk5PTUlOQUxcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJRVUFOVElUQVRJVkVcIjogXCJxdWFudGl0YXRpdmVcIixcclxuICAgICAgICBcIk9SRElOQUxcIjogXCJvcmRpbmFsXCIsXHJcbiAgICAgICAgXCJURU1QT1JBTFwiOiBcInRlbXBvcmFsXCIsXHJcbiAgICAgICAgXCJOT01JTkFMXCI6IFwibm9taW5hbFwiLFxyXG4gICAgICAgIFwiU0hPUlRfVFlQRVwiOiB7XHJcbiAgICAgICAgICBcInF1YW50aXRhdGl2ZVwiOiBcIlFcIixcclxuICAgICAgICAgIFwidGVtcG9yYWxcIjogXCJUXCIsXHJcbiAgICAgICAgICBcIm5vbWluYWxcIjogXCJOXCIsXHJcbiAgICAgICAgICBcIm9yZGluYWxcIjogXCJPXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiVFlQRV9GUk9NX1NIT1JUX1RZUEVcIjoge1xyXG4gICAgICAgICAgXCJRXCI6IFwicXVhbnRpdGF0aXZlXCIsXHJcbiAgICAgICAgICBcIlRcIjogXCJ0ZW1wb3JhbFwiLFxyXG4gICAgICAgICAgXCJPXCI6IFwib3JkaW5hbFwiLFxyXG4gICAgICAgICAgXCJOXCI6IFwibm9taW5hbFwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICBjYXNlIHRoaXNUeXBlLk5PTUlOQUw6XHJcbiAgICAgICAgY2FzZSB0aGlzVHlwZS5PUkRJTkFMOlxyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxyXG4gICAgICAgICAgICBpbjogRGF0YXNldC5zY2hlbWEuZG9tYWluKHtmaWVsZDogZmllbGR9KVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICBjYXNlIHRoaXNUeXBlLlFVQU5USVRBVElWRTpcclxuICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcclxuICAgICAgICAgICAgcmFuZ2U6IFtcclxuICAgICAgICAgICAgICBEYXRhc2V0LnNjaGVtYS5zdGF0cyh7ZmllbGQ6IGZpZWxkfSkubWluLFxyXG4gICAgICAgICAgICAgIERhdGFzZXQuc2NoZW1hLnN0YXRzKHtmaWVsZDogZmllbGR9KS5tYXhcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICBjYXNlIHRoaXNUeXBlLlRFTVBPUkFMOlxyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxyXG4gICAgICAgICAgICByYW5nZTogW1xyXG4gICAgICAgICAgICAgIERhdGFzZXQuc2NoZW1hLnN0YXRzKHtmaWVsZDogZmllbGR9KS5taW4sXHJcbiAgICAgICAgICAgICAgRGF0YXNldC5zY2hlbWEuc3RhdHMoe2ZpZWxkOiBmaWVsZH0pLm1heFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmdkb2Mgc2VydmljZVxyXG4gKiBAbmFtZSB2ZWdhLWxpdGUtdWkubG9nZ2VyXHJcbiAqIEBkZXNjcmlwdGlvblxyXG4gKiAjIGxvZ2dlclxyXG4gKiBTZXJ2aWNlIGluIHRoZSB2ZWdhLWxpdGUtdWkuXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLnNlcnZpY2UoJ0xvZ2dlcicsIGZ1bmN0aW9uICgkbG9jYXRpb24sICR3aW5kb3csICR3ZWJTcWwsIF8sIGNvbnN0cywgQW5hbHl0aWNzLCBQYXBhLCBCbG9iLCBVUkwpIHtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHt9O1xyXG5cclxuICAgIHNlcnZpY2UubGV2ZWxzID0ge1xyXG4gICAgICBPRkY6IHtpZDonT0ZGJywgcmFuazowfSxcclxuICAgICAgVFJBQ0U6IHtpZDonVFJBQ0UnLCByYW5rOjF9LFxyXG4gICAgICBERUJVRzoge2lkOidERUJVRycsIHJhbms6Mn0sXHJcbiAgICAgIElORk86IHtpZDonSU5GTycsIHJhbms6M30sXHJcbiAgICAgIFdBUk46IHtpZDonV0FSTicsIHJhbms6NH0sXHJcbiAgICAgIEVSUk9SOiB7aWQ6J0VSUk9SJywgcmFuazo1fSxcclxuICAgICAgRkFUQUw6IHtpZDonRkFUQUwnLCByYW5rOjZ9XHJcbiAgICB9O1xyXG5cclxuICAgIHNlcnZpY2UuYWN0aW9ucyA9IHtcclxuICAgICAgLy8gREFUQVxyXG4gICAgICBJTklUSUFMSVpFOiB7Y2F0ZWdvcnk6ICdEQVRBJywgaWQ6ICdJTklUSUFMSVpFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLkRFQlVHfSxcclxuICAgICAgVU5ETzoge2NhdGVnb3J5OiAnREFUQScsIGlkOiAnVU5ETycsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgUkVETzoge2NhdGVnb3J5OiAnREFUQScsIGlkOiAnUkVETycsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgREFUQVNFVF9DSEFOR0U6IHtjYXRlZ29yeTogJ0RBVEEnLCBpZDogJ0RBVEFTRVRfQ0hBTkdFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBEQVRBU0VUX09QRU46IHtjYXRlZ29yeTogJ0RBVEEnLCBpZDogJ0RBVEFTRVRfT1BFTicsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgREFUQVNFVF9ORVdfUEFTVEU6IHtjYXRlZ29yeTogJ0RBVEEnLCBpZDogJ0RBVEFTRVRfTkVXX1BBU1RFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBEQVRBU0VUX05FV19VUkw6IHtjYXRlZ29yeTogJ0RBVEEnLCBpZDogJ0RBVEFTRVRfTkVXX1VSTCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgLy8gQk9PS01BUktcclxuICAgICAgQk9PS01BUktfQUREOiB7Y2F0ZWdvcnk6ICdCT09LTUFSSycsIGlkOidCT09LTUFSS19BREQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEJPT0tNQVJLX1JFTU9WRToge2NhdGVnb3J5OiAnQk9PS01BUksnLCBpZDonQk9PS01BUktfUkVNT1ZFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBCT09LTUFSS19PUEVOOiB7Y2F0ZWdvcnk6ICdCT09LTUFSSycsIGlkOidCT09LTUFSS19PUEVOJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBCT09LTUFSS19DTE9TRToge2NhdGVnb3J5OiAnQk9PS01BUksnLCBpZDonQk9PS01BUktfQ0xPU0UnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEJPT0tNQVJLX0NMRUFSOiB7Y2F0ZWdvcnk6ICdCT09LTUFSSycsIGlkOiAnQk9PS01BUktfQ0xFQVInLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEJPT0tNQVJLX0FOTk9UQVRFOiB7Y2F0ZWdvcnk6ICdCT09LTUFSSycsIGlkOiAnQk9PS01BUktfQU5OT1RBVEUnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIC8vIENIQVJUXHJcbiAgICAgIENIQVJUX01PVVNFT1ZFUjoge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDonQ0hBUlRfTU9VU0VPVkVSJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLkRFQlVHfSxcclxuICAgICAgQ0hBUlRfTU9VU0VPVVQ6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J0NIQVJUX01PVVNFT1VUJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLkRFQlVHfSxcclxuICAgICAgQ0hBUlRfUkVOREVSOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidDSEFSVF9SRU5ERVInLCBsZXZlbDogc2VydmljZS5sZXZlbHMuREVCVUd9LFxyXG4gICAgICBDSEFSVF9FWFBPU0U6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J0NIQVJUX0VYUE9TRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5ERUJVR30sXHJcbiAgICAgIENIQVJUX1RPT0xUSVA6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J0NIQVJUX1RPT0xUSVAnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuREVCVUd9LFxyXG4gICAgICBDSEFSVF9UT09MVElQX0VORDoge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDonQ0hBUlRfVE9PTFRJUF9FTkQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuREVCVUd9LFxyXG5cclxuICAgICAgU09SVF9UT0dHTEU6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J1NPUlRfVE9HR0xFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBNQVJLX1RPR0dMRToge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDonTUFSS19UT0dHTEUnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIERSSUxMX0RPV05fT1BFTjoge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDonRFJJTExfRE9XTl9PUEVOJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBEUklMTF9ET1dOX0NMT1NFOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOiAnRFJJTExfRE9XTl9DTE9TRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgTE9HX1RPR0dMRToge2NhdGVnb3J5OiAnQ0hBUlQnLCBpZDogJ0xPR19UT0dHTEUnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIFRSQU5TUE9TRV9UT0dHTEU6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6ICdUUkFOU1BPU0VfVE9HR0xFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBOVUxMX0ZJTFRFUl9UT0dHTEU6IHtjYXRlZ29yeTogJ0NIQVJUJywgaWQ6J05VTExfRklMVEVSX1RPR0dMRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuXHJcbiAgICAgIENMVVNURVJfU0VMRUNUOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidDTFVTVEVSX1NFTEVDVCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgTE9BRF9NT1JFOiB7Y2F0ZWdvcnk6ICdDSEFSVCcsIGlkOidMT0FEX01PUkUnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICAvLyBGSUVMRFNcclxuICAgICAgRklFTERTX0NIQU5HRToge2NhdGVnb3J5OiAnRklFTERTJywgaWQ6ICdGSUVMRFNfQ0hBTkdFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBGSUVMRFNfUkVTRVQ6IHtjYXRlZ29yeTogJ0ZJRUxEUycsIGlkOiAnRklFTERTX1JFU0VUJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBGVU5DX0NIQU5HRToge2NhdGVnb3J5OiAnRklFTERTJywgaWQ6ICdGVU5DX0NIQU5HRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgQUREX0ZJRUxEOiB7Y2F0ZWdvcnk6ICdGSUVMRFMnLCBpZDogJ0FERF9GSUVMRCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuXHJcbiAgICAgIC8vIEZpZWxkIEluZm9cclxuICAgICAgRklFTERERUZfSElHSExJR0hURUQ6IHtjYXRlZ29yeTogJ0ZJRUxESU5GTycsIGlkOiAnRklFTERERUZfSElHSExJR0hURUQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEZJRUxEREVGX1VOSElHSExJR0hURUQ6IHtjYXRlZ29yeTogJ0ZJRUxESU5GTycsIGlkOiAnRklFTERERUZfVU5ISUdITElHSFRFRCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuXHJcbiAgICAgIC8vIFdJTERDQVJEXHJcbiAgICAgIEFERF9XSUxEQ0FSRDoge2NhdGVnb3J5OiAnV0lMRENBUkQnLCBpZDogJ0FERF9XSUxEQ0FSRCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgQUREX1dJTERDQVJEX0ZJRUxEOiB7Y2F0ZWdvcnk6ICdXSUxEQ0FSRCcsIGlkOiAnQUREX1dJTERDQVJEX0ZJRUxEJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBSRU1PVkVfV0lMRENBUkRfRklFTEQ6IHtjYXRlZ29yeTogJ1dJTERDQVJEJywgaWQ6ICdSRU1PVkVfV0lMRENBUkRfRklFTEQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIFJFTU9WRV9XSUxEQ0FSRDoge2NhdGVnb3J5OiAnV0lMRENBUkQnLCBpZDogJ1JFTU9WRV9XSUxEQ0FSRCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuXHJcbiAgICAgIC8vIFBPTEVTVEFSXHJcbiAgICAgIFNQRUNfQ0xFQU46IHtjYXRlZ29yeTonUE9MRVNUQVInLCBpZDogJ1NQRUNfQ0xFQU4nLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIFNQRUNfQ0hBTkdFOiB7Y2F0ZWdvcnk6J1BPTEVTVEFSJywgaWQ6ICdTUEVDX0NIQU5HRScsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgRklFTERfRFJPUDoge2NhdGVnb3J5OiAnUE9MRVNUQVInLCBpZDogJ0ZJRUxEX0RST1AnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEZJRUxEX1JFTU9WRUQ6IHtjYXRlZ29yeTogJ1BPTEVTVEFSJywgaWQ6ICdGSUVMRF9SRU1PVkVEJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBNQVJLX0NIQU5HRToge2NhdGVnb3J5OiAnUE9MRVNUQVInLCBpZDogJ01BUktfQ0hBTkdFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG5cclxuICAgICAgLy8gRmlsdGVyXHJcbiAgICAgIEZJTFRFUl9FTkFCTEVEOiB7Y2F0ZWdvcnk6J0ZJTFRFUicsIGlkOiAnRklMVEVSX0VOQUJMRUQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEZJTFRFUl9ESVNBQkxFRDoge2NhdGVnb3J5OidGSUxURVInLCBpZDogJ0ZJTFRFUl9ESVNBQkxFRCcsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuICAgICAgRklMVEVSX0NIQU5HRToge2NhdGVnb3J5OidGSUxURVInLCBpZDogJ0ZJTFRFUl9DSEFOR0UnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIEZJTFRFUl9DTEVBUjoge2NhdGVnb3J5OidGSUxURVInLCBpZDogJ0ZJTFRFUl9DTEVBUicsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuXHJcbiAgICAgIC8vIFZveWFnZXIgMlxyXG4gICAgICBTUEVDX1NFTEVDVDoge2NhdGVnb3J5OidWT1lBR0VSMicsIGlkOiAnU1BFQ19TRUxFQ1QnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcblxyXG4gICAgICAvLyBBbHRlcm5hdGl2ZXNcclxuICAgICAgU0VUX0FMVEVSTkFUSVZFU19UWVBFOiB7Y2F0ZWdvcnk6J0FMVEVSTkFUSVZFUycsIGlkOiAnU0VUX0FMVEVSTkFUSVZFU19UWVBFJywgbGV2ZWw6IHNlcnZpY2UubGV2ZWxzLklORk99LFxyXG4gICAgICBUT0dHTEVfU0hPV19BTFRFUk5BVElWRVM6IHtjYXRlZ29yeTonQUxURVJOQVRJVkVTJywgaWQ6ICdUT0dHTEVfU0hPV19BTFRFUk5BVElWRVMnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIFRPR0dMRV9ISURFX0FMVEVSTkFUSVZFUzoge2NhdGVnb3J5OidBTFRFUk5BVElWRVMnLCBpZDogJ1RPR0dMRV9ISURFX0FMVEVSTkFUSVZFUycsIGxldmVsOiBzZXJ2aWNlLmxldmVscy5JTkZPfSxcclxuXHJcbiAgICAgIC8vIFByZXZpZXdcclxuICAgICAgU1BFQ19QUkVWSUVXX0VOQUJMRUQ6IHtjYXRlZ29yeTonUFJFVklFVycsIGlkOiAnU1BFQ19QUkVWSUVXX0VOQUJMRUQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT30sXHJcbiAgICAgIFNQRUNfUFJFVklFV19ESVNBQkxFRDoge2NhdGVnb3J5OidQUkVWSUVXJywgaWQ6ICdTUEVDX1BSRVZJRVdfRElTQUJMRUQnLCBsZXZlbDogc2VydmljZS5sZXZlbHMuSU5GT31cclxuICAgIH07XHJcblxyXG4gICAgLy8gY3JlYXRlIG5vb3Agc2VydmljZSBpZiB3ZWJzcWwgaXMgbm90IHN1cHBvcnRlZFxyXG4gICAgaWYgKCR3aW5kb3cub3BlbkRhdGFiYXNlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc29sZS53YXJuKCdObyB3ZWJzcWwgc3VwcG9ydCBhbmQgdGh1cyBubyBsb2dnaW5nLicpO1xyXG4gICAgICBzZXJ2aWNlLmxvZ0ludGVyYWN0aW9uID0gZnVuY3Rpb24oKSB7fTtcclxuICAgICAgcmV0dXJuIHNlcnZpY2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2V0IHVzZXIgaWQgb25jZSBpbiB0aGUgYmVnaW5uaW5nXHJcbiAgICB2YXIgdXNlcmlkID0gc2VydmljZS51c2VyaWQgPSAkbG9jYXRpb24uc2VhcmNoKCkudXNlcmlkO1xyXG5cclxuICAgIHNlcnZpY2UuZGIgPSAkd2ViU3FsLm9wZW5EYXRhYmFzZSgnbG9ncycsICcxLjAnLCAnTG9ncycsIDIgKiAxMDI0ICogMTAyNCk7XHJcblxyXG4gICAgc2VydmljZS50YWJsZU5hbWUgPSAnTG9nc18nICsgY29uc3RzLmFwcElkO1xyXG5cclxuICAgIC8vICh6ZW5pbmcpIFRPRE86IGNoZWNrIGlmIHRoZSB0YWJsZSBpcyBjb3JyZWN0LCBkbyB3ZSByZWFsbHkgbmVlZCB0aW1lPyB3aWxsIHRpbWUgYmUgYXV0b21hdGljYWxseSBhZGRlZD9cclxuICAgIHNlcnZpY2UuY3JlYXRlVGFibGVJZk5vdEV4aXN0cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICBzZXJ2aWNlLmRiLmNyZWF0ZVRhYmxlKHNlcnZpY2UudGFibGVOYW1lLCB7XHJcbiAgICAgICAgJ3VzZXJpZCc6IHtcclxuICAgICAgICAgICd0eXBlJzogJ0lOVEVHRVInLFxyXG4gICAgICAgICAgJ251bGwnOiAnTk9UIE5VTEwnXHJcbiAgICAgICAgfSxcclxuICAgICAgICAndGltZSc6IHtcclxuICAgICAgICAgICd0eXBlJzogJ1RJTUVTVEFNUCcsXHJcbiAgICAgICAgICAnbnVsbCc6ICdOT1QgTlVMTCdcclxuICAgICAgICB9LFxyXG4gICAgICAgICdhY3Rpb25DYXRlZ29yeSc6IHtcclxuICAgICAgICAgICd0eXBlJzogJ1RFWFQnLFxyXG4gICAgICAgICAgJ251bGwnOiAnTk9UIE5VTEwnXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnYWN0aW9uSWQnOiB7XHJcbiAgICAgICAgICAndHlwZSc6ICdURVhUJyxcclxuICAgICAgICAgICdudWxsJzogJ05PVCBOVUxMJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ2xhYmVsJzoge1xyXG4gICAgICAgICAgJ3R5cGUnOiAnVEVYVCcsXHJcbiAgICAgICAgICAnbnVsbCc6ICdOT1QgTlVMTCdcclxuICAgICAgICB9LFxyXG4gICAgICAgICdkYXRhJzoge1xyXG4gICAgICAgICAgJ3R5cGUnOiAnVEVYVCdcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBzZXJ2aWNlLmNsZWFyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciByID0gJHdpbmRvdy5jb25maXJtKCdSZWFsbHkgY2xlYXIgdGhlIGxvZ3M/Jyk7XHJcbiAgICAgIGlmIChyID09PSB0cnVlKSB7XHJcbiAgICAgICAgc2VydmljZS5kYi5kcm9wVGFibGUoc2VydmljZS50YWJsZU5hbWUpO1xyXG4gICAgICAgIHNlcnZpY2UuY3JlYXRlVGFibGVJZk5vdEV4aXN0cygpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHNlcnZpY2UuZXhwb3J0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHNlcnZpY2UuZGIuc2VsZWN0QWxsKHNlcnZpY2UudGFibGVOYW1lKS50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpIHtcclxuICAgICAgICBpZiAocmVzdWx0cy5yb3dzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgY29uc29sZS53YXJuKCdObyBsb2dzJyk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcm93cyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IHJlc3VsdHMucm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgcm93cy5wdXNoKHJlc3VsdHMucm93cy5pdGVtKGkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjc3YgPSBQYXBhLnVucGFyc2Uocm93cyk7XHJcblxyXG4gICAgICAgIHZhciBjc3ZEYXRhID0gbmV3IEJsb2IoW2Nzdl0sIHsgdHlwZTogJ3RleHQvY3N2JyB9KTtcclxuICAgICAgICB2YXIgY3N2VXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChjc3ZEYXRhKTtcclxuXHJcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBhbmd1bGFyLmVsZW1lbnQoJzxhLz4nKTtcclxuICAgICAgICBlbGVtZW50LmF0dHIoe1xyXG4gICAgICAgICAgaHJlZjogY3N2VXJsLFxyXG4gICAgICAgICAgdGFyZ2V0OiAnX2JsYW5rJyxcclxuICAgICAgICAgIGRvd25sb2FkOiBzZXJ2aWNlLnRhYmxlTmFtZSArICdfJyArIHVzZXJpZCArICdfJyArIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSArICcuY3N2J1xyXG4gICAgICAgIH0pWzBdLmNsaWNrKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgc2VydmljZS5sb2dJbnRlcmFjdGlvbiA9IGZ1bmN0aW9uKGFjdGlvbiwgbGFiZWwsIGRhdGEpIHtcclxuICAgICAgaWYgKCFjb25zdHMubG9nZ2luZykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhID8gZGF0YS52YWx1ZSA6IHVuZGVmaW5lZDtcclxuICAgICAgaWYoYWN0aW9uLmxldmVsLnJhbmsgPj0gc2VydmljZS5sZXZlbHNbY29uc3RzLmxvZ0xldmVsIHx8ICdJTkZPJ10ucmFuaykge1xyXG4gICAgICAgIEFuYWx5dGljcy50cmFja0V2ZW50KGFjdGlvbi5jYXRlZ29yeSwgYWN0aW9uLmlkLCBsYWJlbCwgdmFsdWUpO1xyXG5cclxuICAgICAgICBpZiAoY29uc3RzLmxvZ1RvV2ViU3FsKSB7XHJcbiAgICAgICAgICB2YXIgcm93ID0ge1xyXG4gICAgICAgICAgICB1c2VyaWQ6IHVzZXJpZCxcclxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBhY3Rpb25DYXRlZ29yeTogYWN0aW9uLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICBhY3Rpb25JZDogYWN0aW9uLmlkLFxyXG4gICAgICAgICAgICBsYWJlbDogXy5pc09iamVjdChsYWJlbCkgPyBKU09OLnN0cmluZ2lmeShsYWJlbCkgOiBsYWJlbCxcclxuICAgICAgICAgICAgZGF0YTogZGF0YSA/IEpTT04uc3RyaW5naWZ5KGRhdGEpIDogdW5kZWZpbmVkXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgc2VydmljZS5kYi5pbnNlcnQoc2VydmljZS50YWJsZU5hbWUsIHJvdyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYWN0aW9uLmxldmVsLnJhbmsgPj0gc2VydmljZS5sZXZlbHNbY29uc3RzLmxvZ1ByaW50TGV2ZWwgfHwgJ0lORk8nXS5yYW5rKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0xvZ2dpbmddICcsIGFjdGlvbi5pZCwgbGFiZWwsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBzZXJ2aWNlLmNyZWF0ZVRhYmxlSWZOb3RFeGlzdHMoKTtcclxuICAgIC8vY29uc29sZS5sb2coJ2FwcDonLCBjb25zdHMuYXBwSWQsICdzdGFydGVkJyk7XHJcbiAgICBzZXJ2aWNlLmxvZ0ludGVyYWN0aW9uKHNlcnZpY2UuYWN0aW9ucy5JTklUSUFMSVpFLCBjb25zdHMuYXBwSWQpO1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG4gIH0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgndmx1aScpXHJcbiAgLnNlcnZpY2UoJ1BpbGxzJywgZnVuY3Rpb24gKEFOWSwgY29uc3RzLCBjcWwpIHtcclxuICAgIHZhciBQaWxscyA9IHtcclxuICAgICAgLy8gRnVuY3Rpb25zXHJcbiAgICAgIGlzQW55Q2hhbm5lbDogaXNBbnlDaGFubmVsLFxyXG4gICAgICBnZXROZXh0QW55Q2hhbm5lbElkOiBnZXROZXh0QW55Q2hhbm5lbElkLFxyXG4gICAgICBnZXRFbXB0eUFueUNoYW5uZWxJZDogZ2V0RW1wdHlBbnlDaGFubmVsSWQsXHJcbiAgICAgIGlzRW51bWVyYXRlZENoYW5uZWw6IGlzRW51bWVyYXRlZENoYW5uZWwsXHJcbiAgICAgIGlzRW51bWVyYXRlZEZpZWxkOiBpc0VudW1lcmF0ZWRGaWVsZCxcclxuXHJcbiAgICAgIGdldDogZ2V0LFxyXG4gICAgICAvLyBFdmVudFxyXG4gICAgICBkcmFnRHJvcDogZHJhZ0Ryb3AsXHJcbiAgICAgIGRyYWdTdGFydDogZHJhZ1N0YXJ0LFxyXG4gICAgICBkcmFnU3RvcDogZHJhZ1N0b3AsXHJcbiAgICAgIC8vIEV2ZW50LCB3aXRoIGhhbmRsZXIgaW4gdGhlIGxpc3RlbmVyXHJcblxyXG4gICAgICAvKiogU2V0IGEgZmllbGREZWYgZm9yIGEgY2hhbm5lbCAqL1xyXG4gICAgICBzZXQ6IHNldCxcclxuXHJcbiAgICAgIC8qKiBSZW1vdmUgYSBmaWVsZERlZiBmcm9tIGEgY2hhbm5lbCAqL1xyXG4gICAgICByZW1vdmU6IHJlbW92ZSxcclxuXHJcbiAgICAgIGNvdW50RmllbGREZWY6IHtmaWVsZDogJ+adoeebruaAu+aVsCcsdHlwZTogJ3F1YW50aXRhdGl2ZScsYWdncmVnYXRlOidjb3VudF9zdW0nfSxcclxuICAgICAgY2FsY0ZpZWxkRGVmOiB7ZmllbGQ6ICforqHnrpfmjIfmoIcnLHR5cGU6ICdjYWxjdWxhdG9yJyxhZ2dyZWdhdGU6J2NvdW50J30sXHJcblxyXG4gICAgICAvLyBEYXRhXHJcbiAgICAgIC8vIFRPRE86IHNwbGl0IGJldHdlZW4gZW5jb2RpbmcgcmVsYXRlZCBhbmQgbm9uLWVuY29kaW5nIHJlbGF0ZWRcclxuICAgICAgcGlsbHM6IHt9LFxyXG4gICAgICBoaWdobGlnaHRlZDoge30sXHJcbiAgICAgIC8qKiBwaWxsIGJlaW5nIGRyYWdnZWQgKi9cclxuICAgICAgZHJhZ2dpbmc6IG51bGwsXHJcbiAgICAgIGlzRHJhZ2dpbmdXaWxkY2FyZDogbnVsbCxcclxuICAgICAgLyoqIGNoYW5uZWxJZCB0aGF0J3MgdGhlIHBpbGwgaXMgYmVpbmcgZHJhZ2dlZCBmcm9tICovXHJcbiAgICAgIGNpZERyYWdGcm9tOiBudWxsLFxyXG4gICAgICAvKiogTGlzdGVuZXIgICovXHJcbiAgICAgIGxpc3RlbmVyOiBudWxsXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEFkZCBsaXN0ZW5lciB0eXBlIHRoYXQgUGlsbHMganVzdCBwYXNzIGFyZ3VtZW50cyB0byBpdHMgbGlzdGVuZXJcclxuICAgIC8vIEZJWE1FOiBwcm9wZXJseSBpbXBsZW1lbnQgbGlzdGVuZXIgcGF0dGVyblxyXG4gICAgW1xyXG4gICAgICAnYWRkJywgJ3BhcnNlJywgJ3NlbGVjdCcsICdwcmV2aWV3JywgJ3VwZGF0ZScsICdyZXNldCcsXHJcbiAgICAgICdyZXNjYWxlJywgJ3NvcnQnLCAndG9nZ2xlRmlsdGVySW52YWxpZCcsICd0cmFuc3Bvc2UnLFxyXG4gICAgICAnYWRkV2lsZGNhcmRGaWVsZCcsICdhZGRXaWxkY2FyZCcsICdyZW1vdmVXaWxkY2FyZEZpZWxkJywgJ3JlbW92ZVdpbGRjYXJkJ1xyXG4gICAgXS5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyVHlwZSkge1xyXG4gICAgICBQaWxsc1tsaXN0ZW5lclR5cGVdID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKFBpbGxzLmxpc3RlbmVyICYmIFBpbGxzLmxpc3RlbmVyW2xpc3RlbmVyVHlwZV0pIHtcclxuICAgICAgICAgIHJldHVybiBQaWxscy5saXN0ZW5lcltsaXN0ZW5lclR5cGVdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGNoYW5uZWwgaWQgaXMgYW4gXCJhbnlcIiBjaGFubmVsXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHthbnl9IGNoYW5uZWxJZFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBpc0FueUNoYW5uZWwoY2hhbm5lbElkKSB7XHJcbiAgICAgIHJldHVybiBjaGFubmVsSWQgJiYgY2hhbm5lbElkLmluZGV4T2YoQU5ZKSA9PT0gMDsgLy8gcHJlZml4IGJ5IEFOWVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2V0a2V5cyh4KSB7XHJcbiAgICAgIHZhciBrZXlzID0gW10sIGs7XHJcbiAgICAgIGZvciAoayBpbiB4KSB7a2V5cy5wdXNoKGspO31cclxuICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBnZXRFbXB0eUFueUNoYW5uZWxJZCgpIHtcclxuICAgICAgdmFyIGFueUNoYW5uZWxzID0gZ2V0a2V5cyhQaWxscy5waWxscykuZmlsdGVyKGZ1bmN0aW9uKGNoYW5uZWxJZCkge1xyXG4gICAgICAgIHJldHVybiBjaGFubmVsSWQuaW5kZXhPZihBTlkpID09PSAwO1xyXG4gICAgICB9KTtcclxuICAgICAgZm9yICh2YXIgaT0wIDsgaSA8IGFueUNoYW5uZWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGNoYW5uZWxJZCA9IGFueUNoYW5uZWxzW2ldO1xyXG4gICAgICAgIGlmICghUGlsbHMucGlsbHNbY2hhbm5lbElkXS5maWVsZCkge1xyXG4gICAgICAgICAgcmV0dXJuIGNoYW5uZWxJZDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbXB0eSBhbnkgY2hhbm5lbCBhdmFpbGFibGUhJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0TmV4dEFueUNoYW5uZWxJZCgpIHtcclxuICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICB3aGlsZSAoUGlsbHMucGlsbHNbQU5ZICsgaV0pIHtcclxuICAgICAgICBpKys7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghY29uc3RzLm1heEFueVNoZWxmIHx8IGkgPj0gY29uc3RzLm1heEFueVNoZWxmKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBBTlkgKyBpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGEgZmllbGREZWYgb2YgYSBwaWxsIG9mIGEgZ2l2ZW4gY2hhbm5lbElkXHJcbiAgICAgKiBAcGFyYW0gY2hhbm5lbElkIGNoYW5uZWwgaWQgb2YgdGhlIHBpbGwgdG8gYmUgdXBkYXRlZFxyXG4gICAgICogQHBhcmFtIGZpZWxkRGVmIGZpZWxkRGVmIHRvIHRvIGJlIHVwZGF0ZWRcclxuICAgICAqIEBwYXJhbSB1cGRhdGUgd2hldGhlciB0byBwcm9wYWdhdGUgY2hhbmdlIHRvIHRoZSBjaGFubmVsIHVwZGF0ZSBsaXN0ZW5lclxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzZXQoY2hhbm5lbElkLCBmaWVsZERlZiwgdXBkYXRlKSB7XHJcbiAgICAgIFBpbGxzLnBpbGxzW2NoYW5uZWxJZF0gPSBmaWVsZERlZjtcclxuXHJcbiAgICAgIGlmICh1cGRhdGUgJiYgUGlsbHMubGlzdGVuZXIpIHtcclxuICAgICAgICBQaWxscy5saXN0ZW5lci5zZXQoY2hhbm5lbElkLCBmaWVsZERlZik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBhIGZpZWxkRGVmIG9mIGEgcGlsbCBvZiBhIGdpdmVuIGNoYW5uZWxJZFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXQoY2hhbm5lbElkKSB7XHJcbiAgICAgIHJldHVybiBQaWxscy5waWxsc1tjaGFubmVsSWRdO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzRW51bWVyYXRlZENoYW5uZWwoY2hhbm5lbElkKSB7XHJcbiAgICAgIGlmIChQaWxscy5saXN0ZW5lciAmJiBQaWxscy5saXN0ZW5lci5pc0VudW1lcmF0ZWRDaGFubmVsKSB7XHJcbiAgICAgICAgcmV0dXJuIFBpbGxzLmxpc3RlbmVyLmlzRW51bWVyYXRlZENoYW5uZWwoY2hhbm5lbElkLCBQaWxscy5waWxsc1tjaGFubmVsSWRdKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNFbnVtZXJhdGVkRmllbGQoY2hhbm5lbElkKSB7XHJcbiAgICAgIGlmIChQaWxscy5saXN0ZW5lciAmJiBQaWxscy5saXN0ZW5lci5pc0VudW1lcmF0ZWRGaWVsZCkge1xyXG4gICAgICAgIHJldHVybiBQaWxscy5saXN0ZW5lci5pc0VudW1lcmF0ZWRGaWVsZChjaGFubmVsSWQsIFBpbGxzLnBpbGxzW2NoYW5uZWxJZF0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZW1vdmUoY2hhbm5lbElkKSB7XHJcbiAgICAgIGRlbGV0ZSBQaWxscy5waWxsc1tjaGFubmVsSWRdO1xyXG4gICAgICBpZiAoUGlsbHMubGlzdGVuZXIpIHtcclxuICAgICAgICBQaWxscy5saXN0ZW5lci5yZW1vdmUoY2hhbm5lbElkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHthbnl9IHBpbGwgcGlsbCBiZWluZyBkcmFnZ2VkXHJcbiAgICAgKiBAcGFyYW0ge2FueX0gY2lkRHJhZ0Zyb20gY2hhbm5lbCBpZCB0aGF0IHRoZSBwaWxsIGlzIGRyYWdnZWQgZnJvbVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkcmFnU3RhcnQocGlsbCwgY2lkRHJhZ0Zyb20pIHtcclxuICAgICAgUGlsbHMuZHJhZ2dpbmcgPSBwaWxsO1xyXG4gICAgICBQaWxscy5pc0RyYWdnaW5nV2lsZGNhcmQgPSBjcWwuZW51bVNwZWMuaXNFbnVtU3BlYyhwaWxsLmZpZWxkKTtcclxuICAgICAgUGlsbHMuY2lkRHJhZ0Zyb20gPSBjaWREcmFnRnJvbTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogU3RvcCBwaWxsIGRyYWdnaW5nICovXHJcbiAgICBmdW5jdGlvbiBkcmFnU3RvcCgpIHtcclxuICAgICAgUGlsbHMuZHJhZ2dpbmcgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiBhIHBpbGwgaXMgZHJvcHBlZFxyXG4gICAgICogQHBhcmFtIGNpZERyYWdUbyAgY2hhbm5lbElkIHRoYXQncyB0aGUgcGlsbCBpcyBiZWluZyBkcmFnZ2VkIHRvXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGRyYWdEcm9wKGNpZERyYWdUbykge1xyXG4gICAgICBpZiAoUGlsbHMubGlzdGVuZXIpIHtcclxuICAgICAgICBQaWxscy5saXN0ZW5lci5kcmFnRHJvcChjaWREcmFnVG8sIFBpbGxzLmNpZERyYWdGcm9tKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQaWxscztcclxuICB9KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gU2VydmljZSBmb3Igc2VydmluZyBWTCBTY2hlbWFcclxuYW5ndWxhci5tb2R1bGUoJ3ZsdWknKVxyXG4gIC5mYWN0b3J5KCdTY2hlbWEnLCBmdW5jdGlvbih2bFNjaGVtYSkge1xyXG4gICAgdmFyIFNjaGVtYSA9IHt9O1xyXG5cclxuICAgIFNjaGVtYS5zY2hlbWEgPSB2bFNjaGVtYTtcclxuXHJcbiAgICBTY2hlbWEuZ2V0Q2hhbm5lbFNjaGVtYSA9IGZ1bmN0aW9uKGNoYW5uZWwpIHtcclxuICAgICAgdmFyIGRlZiA9IG51bGw7XHJcbiAgICAgIHZhciBlbmNvZGluZ0NoYW5uZWxQcm9wID0gU2NoZW1hLnNjaGVtYS5kZWZpbml0aW9ucy5FbmNvZGluZy5wcm9wZXJ0aWVzW2NoYW5uZWxdO1xyXG4gICAgICAvLyBmb3IgZGV0YWlsLCBqdXN0IGdldCB0aGUgZmxhdCB2ZXJzaW9uXHJcbiAgICAgIHZhciByZWYgPSBlbmNvZGluZ0NoYW5uZWxQcm9wID9cclxuICAgICAgICAoZW5jb2RpbmdDaGFubmVsUHJvcC4kcmVmIHx8IGVuY29kaW5nQ2hhbm5lbFByb3Aub25lT2ZbMF0uJHJlZikgOlxyXG4gICAgICAgICdGaWVsZERlZic7IC8vIGp1c3QgdXNlIHRoZSBnZW5lcmljIHZlcnNpb24gZm9yIEFOWSBjaGFubmVsXHJcbiAgICAgIGRlZiA9IHJlZi5zbGljZShyZWYubGFzdEluZGV4T2YoJy8nKSsxKTtcclxuICAgICAgcmV0dXJuIFNjaGVtYS5zY2hlbWEuZGVmaW5pdGlvbnNbZGVmXTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIFNjaGVtYTtcclxuICB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
