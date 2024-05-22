(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["tournament-organizer"] = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getAugmentedNamespace(n) {
	  if (n.__esModule) return n;
	  var f = n.default;
		if (typeof f == "function") {
			var a = function a () {
				if (this instanceof a) {
	        return Reflect.construct(f, arguments, this.constructor);
				}
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var randomstring$2 = {};

	var _polyfillNode_crypto = {};

	var _polyfillNode_crypto$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		default: _polyfillNode_crypto
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_crypto$1);

	var randombytes = require$$0.randomBytes;

	var charset = {exports: {}};

	(function (module, exports) {
		function Charset() {
		  this.chars = '';
		}

		Charset.prototype.setType = function(type) {
		  if (Array.isArray(type)) {
		    for (var i=0; i < type.length; i++) {
		      this.chars += this.getCharacters(type[i]);
		    }
		  }
		  else {
		    this.chars = this.getCharacters(type);
		  }
		};

		Charset.prototype.getCharacters = function(type) {
		  var chars;

		  var numbers     = '0123456789';
		  var charsLower  = 'abcdefghijklmnopqrstuvwxyz';
		  var charsUpper  = charsLower.toUpperCase();
		  var hexChars    = 'abcdef';
		  var binaryChars = '01';
		  var octalChars  = '01234567';

		  if (type === 'alphanumeric') {
		    chars = numbers + charsLower + charsUpper;
		  }
		  else if (type === 'numeric') {
		    chars = numbers;
		  }
		  else if (type === 'alphabetic') {
		    chars = charsLower + charsUpper;
		  }
		  else if (type === 'hex') {
		    chars = numbers + hexChars;
		  }
		  else if (type === 'binary') {
		    chars = binaryChars;
		  }
		  else if (type === 'octal') {
		    chars = octalChars;
		  }
		  else {
		    chars = type;
		  }

		  return chars;
		};

		Charset.prototype.removeUnreadable = function() {
		  var unreadableChars = /[0OIl]/g;
		  this.chars = this.chars.replace(unreadableChars, '');
		};

		Charset.prototype.setcapitalization = function(capitalization) {
		  if (capitalization === 'uppercase') {
		    this.chars = this.chars.toUpperCase();
		  }
		  else if (capitalization === 'lowercase') {
		    this.chars = this.chars.toLowerCase();
		  }
		};

		Charset.prototype.removeDuplicates = function() {
		  var charMap = this.chars.split('');
		  charMap = [...new Set(charMap)];
		  this.chars = charMap.join('');
		};

		module.exports = Charset; 
	} (charset));

	var charsetExports = charset.exports;

	var randomBytes = randombytes;
	var Charset = charsetExports;


	function unsafeRandomBytes(length) {
	  var stack = [];
	  for (var i = 0; i < length; i++) {
	    stack.push(Math.floor(Math.random() * 255));
	  }

	  return {
	    length,
	    readUInt8: function (index) {
	      return stack[index];
	    }
	  };
	}

	function safeRandomBytes(length) {
	  try {
	    return randomBytes(length);
	  } catch (e) {
	    /* React/React Native Fix + Eternal loop removed */
	    return unsafeRandomBytes(length);
	  }
	}

	function processString(buf, initialString, chars, reqLen, maxByte) {
	  var string = initialString;
	  for (var i = 0; i < buf.length && string.length < reqLen; i++) {
	    var randomByte = buf.readUInt8(i);
	    if (randomByte < maxByte) {
	      string += chars.charAt(randomByte % chars.length);
	    }
	  }
	  return string;
	}

	function getAsyncString(string, chars, length, maxByte, cb) {
	  randomBytes(length, function(err, buf) {
	    if (err) {
	      // Since it is waiting for entropy, errors are legit and we shouldn't just keep retrying
	      cb(err);
	    }
	    var generatedString = processString(buf, string, chars, length, maxByte);
	    if (generatedString.length < length) {
	      getAsyncString(generatedString, chars, length, maxByte, cb);
	    } else {
	      cb(null, generatedString);
	    }
	  });
	}

	randomstring$2.generate = function(options, cb) {
	  var charset = new Charset();

	  var length, string = '';

	  // Handle options
	  if (typeof options === 'object') {
	    length = typeof options.length === 'number' ? options.length : 32;

	    if (options.charset) {
	      charset.setType(options.charset);
	    }
	    else {
	      charset.setType('alphanumeric');
	    }

	    if (options.capitalization) {
	      charset.setcapitalization(options.capitalization);
	    }

	    if (options.readable) {
	      charset.removeUnreadable();
	    }

	    charset.removeDuplicates();
	  }
	  else if (typeof options === 'number') {
	    length = options;
	    charset.setType('alphanumeric');
	  }
	  else {
	    length = 32;
	    charset.setType('alphanumeric');
	  }

	  // Generate the string
	  var charsLen = charset.chars.length;
	  var maxByte = 256 - (256 % charsLen);

	  if (!cb) {
	    while (string.length < length) {
	      var buf = safeRandomBytes(Math.ceil(length * 256 / maxByte));
	      string = processString(buf, string, charset.chars, length, maxByte);
	    }

	    return string;
	  }

	  getAsyncString(string, charset.chars, length, maxByte, cb);

	};

	var randomstring = randomstring$2;

	var randomstring$1 = /*@__PURE__*/getDefaultExportFromCjs(randomstring);

	/**
	 * Class representing a match.
	 *
	 * See {@link MatchValues} for detailed descriptions of properties.
	 */
	class Match {
	    /** Create a new match. */
	    constructor(id, round, match) {
	        this.id = id;
	        this.round = round;
	        this.match = match;
	        this.active = false;
	        this.bye = false;
	        this.player1 = {
	            id: null,
	            win: 0,
	            loss: 0,
	            draw: 0
	        };
	        this.player2 = {
	            id: null,
	            win: 0,
	            loss: 0,
	            draw: 0
	        };
	        this.path = {
	            win: null,
	            loss: null
	        };
	        this.meta = {};
	    }
	    /** Set information about the match (only changes in information need to be included in the object) */
	    set values(options) {
	        if (options.hasOwnProperty('player1')) {
	            options.player1 = Object.assign(this.player1, options.player1);
	        }
	        if (options.hasOwnProperty('player2')) {
	            options.player2 = Object.assign(this.player2, options.player2);
	        }
	        if (options.hasOwnProperty('path')) {
	            options.path = Object.assign(this.path, options.path);
	        }
	        Object.assign(this, options);
	    }
	}

	/******************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise, SuppressedError, Symbol */


	function __classPrivateFieldGet(receiver, state, kind, f) {
	    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
	    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
	    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
	}

	typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
	    var e = new Error(message);
	    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
	};

	function shuffle(arr) {
	    const a = [...arr];
	    for (let i = a.length - 1; i > 0; i--) {
	        const z = Math.floor(Math.random() * (i + 1));
	        [a[i], a[z]] = [a[z], a[i]];
	    }
	    return a;
	}

	function SingleElimination(players, startingRound = 1, consolation = false, ordered = false) {
	    const matches = [];
	    let playerArray = [];
	    if (Array.isArray(players)) {
	        playerArray = ordered ? players : shuffle(players);
	    }
	    else {
	        playerArray = [...new Array(players)].map((_, i) => i + 1);
	    }
	    const exponent = Math.log2(playerArray.length);
	    const remainder = Math.round(2 ** exponent) % (2 ** Math.floor(exponent));
	    const bracket = exponent < 2 ? [1, 2] : [1, 4, 2, 3];
	    for (let i = 3; i <= Math.floor(exponent); i++) {
	        for (let j = 0; j < bracket.length; j += 2) {
	            bracket.splice(j + 1, 0, 2 ** i + 1 - bracket[j]);
	        }
	    }
	    let round = startingRound;
	    if (remainder !== 0) {
	        for (let i = 0; i < remainder; i++) {
	            matches.push({
	                round: round,
	                match: i + 1,
	                player1: null,
	                player2: null
	            });
	        }
	        round++;
	    }
	    let matchExponent = Math.floor(exponent) - 1;
	    let iterated = false;
	    do {
	        for (let i = 0; i < 2 ** matchExponent; i++) {
	            matches.push({
	                round: round,
	                match: i + 1,
	                player1: null,
	                player2: null
	            });
	        }
	        if (!iterated) {
	            iterated = true;
	        }
	        else {
	            matches.filter(m => m.round === round - 1).forEach(m => m.win = {
	                round: round,
	                match: Math.ceil(m.match / 2)
	            });
	        }
	        round++;
	        matchExponent--;
	    } while (round < startingRound + Math.ceil(exponent));
	    const startRound = startingRound + (remainder === 0 ? 0 : 1);
	    matches.filter(m => m.round === startRound).forEach((m, i) => {
	        m.player1 = playerArray[bracket[2 * i] - 1];
	        m.player2 = playerArray[bracket[2 * i + 1] - 1];
	    });
	    if (remainder !== 0) {
	        matches.filter(m => m.round === startingRound).forEach((m, i) => {
	            m.player1 = playerArray[2 ** Math.floor(exponent) + i];
	            const p2 = playerArray[2 ** Math.floor(exponent) - i - 1];
	            const nextMatch = matches.filter(n => n.round === startingRound + 1).find(n => n.player1 === p2 || n.player2 === p2);
	            if (nextMatch.player1 === p2) {
	                nextMatch.player1 = null;
	            }
	            else {
	                nextMatch.player2 = null;
	            }
	            m.player2 = p2;
	            m.win = {
	                round: startingRound + 1,
	                match: nextMatch.match
	            };
	        });
	    }
	    if (consolation) {
	        const lastRound = matches.reduce((max, curr) => Math.max(max, curr.round), 0);
	        const lastMatch = matches.filter(m => m.round === lastRound).reduce((max, curr) => Math.max(max, curr.match), 0);
	        matches.push({
	            round: lastRound,
	            match: lastMatch + 1,
	            player1: null,
	            player2: null
	        });
	        matches.filter(m => m.round === lastRound - 1).forEach(m => m.loss = {
	            round: lastRound,
	            match: lastMatch + 1
	        });
	    }
	    return matches;
	}

	function DoubleElimination(players, startingRound = 1, ordered = false) {
	    const matches = [];
	    let playerArray = [];
	    if (Array.isArray(players)) {
	        playerArray = ordered ? players : shuffle(players);
	    }
	    else {
	        playerArray = [...new Array(players)].map((_, i) => i + 1);
	    }
	    const exponent = Math.log2(playerArray.length);
	    const remainder = Math.round(2 ** exponent) % (2 ** Math.floor(exponent));
	    const bracket = [1, 4, 2, 3];
	    for (let i = 3; i <= Math.floor(exponent); i++) {
	        for (let j = 0; j < bracket.length; j += 2) {
	            bracket.splice(j + 1, 0, 2 ** i + 1 - bracket[j]);
	        }
	    }
	    let round = startingRound;
	    if (remainder !== 0) {
	        for (let i = 0; i < remainder; i++) {
	            matches.push({
	                round: round,
	                match: i + 1,
	                player1: null,
	                player2: null
	            });
	        }
	        round++;
	    }
	    let matchExponent = Math.floor(exponent) - 1;
	    let iterated = false;
	    do {
	        for (let i = 0; i < 2 ** matchExponent; i++) {
	            matches.push({
	                round: round,
	                match: i + 1,
	                player1: null,
	                player2: null
	            });
	        }
	        if (!iterated) {
	            iterated = true;
	        }
	        else {
	            matches.filter(m => m.round === round - 1).forEach(m => m.win = {
	                round: round,
	                match: Math.ceil(m.match / 2)
	            });
	        }
	        round++;
	        matchExponent--;
	    } while (round < startingRound + Math.ceil(exponent));
	    const startRound = startingRound + (remainder === 0 ? 0 : 1);
	    matches.filter(m => m.round === startRound).forEach((m, i) => {
	        m.player1 = playerArray[bracket[2 * i] - 1];
	        m.player2 = playerArray[bracket[2 * i + 1] - 1];
	    });
	    if (remainder !== 0) {
	        matches.filter(m => m.round === startingRound).forEach((m, i) => {
	            m.player1 = playerArray[2 ** Math.floor(exponent) + i];
	            const p2 = playerArray[2 ** Math.floor(exponent) - i - 1];
	            const nextMatch = matches.filter(n => n.round === startingRound + 1).find(n => n.player1 === p2 || n.player2 === p2);
	            if (nextMatch.player1 === p2) {
	                nextMatch.player1 = null;
	            }
	            else {
	                nextMatch.player2 = null;
	            }
	            m.player2 = p2;
	            m.win = {
	                round: startingRound + 1,
	                match: nextMatch.match
	            };
	        });
	    }
	    matches.push({
	        round: round,
	        match: 1,
	        player1: null,
	        player2: null,
	    });
	    matches.find(m => m.round === round - 1).win = {
	        round: round,
	        match: 1
	    };
	    round++;
	    const roundDiff = round - 1;
	    if (remainder !== 0) {
	        if (remainder <= 2 ** Math.floor(exponent) / 2) {
	            for (let i = 0; i < remainder; i++) {
	                matches.push({
	                    round: round,
	                    match: i + 1,
	                    player1: null,
	                    player2: null
	                });
	            }
	            round++;
	        }
	        else {
	            for (let i = 0; i < remainder - 2 ** (Math.floor(exponent) - 1); i++) {
	                matches.push({
	                    round: round,
	                    match: i + 1,
	                    player1: null,
	                    player2: null
	                });
	            }
	            round++;
	            for (let i = 0; i < 2 ** (Math.floor(exponent) - 1); i++) {
	                matches.push({
	                    round: round,
	                    match: i + 1,
	                    player1: null,
	                    player2: null
	                });
	            }
	            round++;
	        }
	    }
	    let loserExponent = Math.floor(exponent) - 2;
	    do {
	        for (let i = 0; i < 2; i++) {
	            for (let j = 0; j < 2 ** loserExponent; j++) {
	                matches.push({
	                    round: round,
	                    match: j + 1,
	                    player1: null,
	                    player2: null
	                });
	            }
	            round++;
	        }
	        loserExponent--;
	    } while (loserExponent > -1);
	    const fillPattern = (matchCount, fillCount) => {
	        const a = [...new Array(matchCount)].map((_, i) => i + 1);
	        const c = fillCount % 4;
	        const x = a.slice(0, a.length / 2);
	        const y = a.slice(a.length / 2);
	        return c === 0 ? a : c === 1 ? a.reverse() : c === 2 ? x.reverse().concat(y.reverse()) : y.concat(x);
	    };
	    let fillCount = 0;
	    let winRound = startingRound;
	    let loseRound = roundDiff + 1;
	    if (remainder === 0) {
	        const winMatches = matches.filter(m => m.round === winRound);
	        const fill = fillPattern(winMatches.length, fillCount);
	        fillCount++;
	        let counter = 0;
	        matches.filter(m => m.round === loseRound).forEach(m => {
	            for (let i = 0; i < 2; i++) {
	                const match = winMatches.find(m => m.match === fill[counter]);
	                match.loss = {
	                    round: m.round,
	                    match: m.match
	                };
	                counter++;
	            }
	        });
	        winRound++;
	        loseRound++;
	    }
	    else if (remainder <= 2 ** Math.floor(exponent) / 2) {
	        let winMatches = matches.filter(m => m.round === winRound);
	        let fill = fillPattern(winMatches.length, fillCount);
	        fillCount++;
	        matches.filter(m => m.round === loseRound).forEach((m, i) => {
	            const match = winMatches.find(m => m.match === fill[i]);
	            match.loss = {
	                round: m.round,
	                match: m.match
	            };
	        });
	        winRound++;
	        loseRound++;
	        winMatches = matches.filter(m => m.round === winRound);
	        fill = fillPattern(winMatches.length, fillCount);
	        fillCount++;
	        let countA = 0;
	        let countB = 0;
	        let routeNumbers = matches.filter(m => m.round === 2 && (m.player1 === null || m.player2 === null)).map(m => Math.ceil(m.match / 2));
	        let routeCopy = [...routeNumbers];
	        matches.filter(m => m.round === loseRound).forEach(m => {
	            for (let i = 0; i < 2; i++) {
	                const match = winMatches.find(m => m.match === fill[countA]);
	                if (routeCopy.some(n => n === m.match)) {
	                    const lossMatch = matches.filter(x => x.round === loseRound - 1)[countB];
	                    countB++;
	                    match.loss = {
	                        round: lossMatch.round,
	                        match: lossMatch.match
	                    };
	                    routeCopy.splice(routeCopy.indexOf(m.match), 1);
	                }
	                else {
	                    match.loss = {
	                        round: m.round,
	                        match: m.match
	                    };
	                }
	                countA++;
	            }
	        });
	        winRound++;
	        loseRound++;
	        matches.filter(m => m.round === roundDiff + 1).forEach((m, i) => {
	            const match = matches.find(x => x.round === m.round + 1 && x.match === routeNumbers[i]);
	            m.win = {
	                round: match.round,
	                match: match.match
	            };
	        });
	    }
	    else {
	        const winMatches = matches.filter(m => m.round === winRound);
	        const loseMatchesA = matches.filter(m => m.round === loseRound);
	        loseRound++;
	        const loseMatchesB = matches.filter(m => m.round === loseRound);
	        const fill = fillPattern(winMatches.length, fillCount);
	        fillCount++;
	        let countA = 0;
	        let countB = 0;
	        let routeNumbers = matches.filter(m => m.round === 2 && m.player1 === null && m.player2 === null).map(m => m.match);
	        loseMatchesB.forEach(m => {
	            const winMatchA = winMatches.find(x => x.match === fill[countA]);
	            if (routeNumbers.some(n => n === m.match)) {
	                const lossMatch = loseMatchesA[countB];
	                winMatchA.loss = {
	                    round: lossMatch.round,
	                    match: lossMatch.match
	                };
	                countA++;
	                countB++;
	                const winMatchB = winMatches.find(x => x.match === fill[countA]);
	                winMatchB.loss = {
	                    round: lossMatch.round,
	                    match: lossMatch.match
	                };
	            }
	            else {
	                winMatchA.loss = {
	                    round: m.round,
	                    match: m.match
	                };
	            }
	            countA++;
	        });
	        winRound++;
	        matches.filter(m => m.round === roundDiff + 1).forEach((m, i) => {
	            const match = matches.find(x => x.round === m.round + 1 && x.match === routeNumbers[i]);
	            m.win = {
	                round: match.round,
	                match: match.match
	            };
	        });
	    }
	    let ffwd = 0;
	    for (let i = winRound; i < roundDiff; i++) {
	        let loseMatchesA = matches.filter(m => m.round === loseRound - winRound + ffwd + i);
	        const lostMatchesB = matches.filter(m => m.round === loseRound - winRound + ffwd + i + 1);
	        if (loseMatchesA.length === lostMatchesB.length) {
	            loseMatchesA = lostMatchesB;
	            ffwd++;
	        }
	        const winMatches = matches.filter(m => m.round === i);
	        const fill = fillPattern(winMatches.length, fillCount);
	        fillCount++;
	        loseMatchesA.forEach((m, j) => {
	            const match = winMatches.find(m => m.match === fill[j]);
	            match.loss = {
	                round: m.round,
	                match: m.match
	            };
	        });
	    }
	    for (let i = remainder === 0 ? roundDiff + 1 : roundDiff + 2; i < matches.reduce((max, curr) => Math.max(max, curr.round), 0); i++) {
	        const loseMatchesA = matches.filter(m => m.round === i);
	        const loseMatchesB = matches.filter(m => m.round === i + 1);
	        loseMatchesA.forEach((m, j) => {
	            const match = loseMatchesA.length === loseMatchesB.length ? loseMatchesB[j] : loseMatchesB[Math.floor(j / 2)];
	            m.win = {
	                round: match.round,
	                match: match.match
	            };
	        });
	    }
	    matches.filter(m => m.round === matches.reduce((max, curr) => Math.max(max, curr.round), 0))[0].win = {
	        round: roundDiff,
	        match: 1
	    };
	    return matches;
	}

	function RoundRobin(players, startingRound = 1, ordered = false) {
	    let matches = [];
	    let playerArray = [];
	    if (Array.isArray(players)) {
	        playerArray = ordered ? players : shuffle(players);
	    }
	    else {
	        playerArray = [...new Array(players)].map((_, i) => i + 1);
	    }
	    if (playerArray.length % 2 === 1) {
	        playerArray.push(null);
	    }
	    for (let r = startingRound; r < startingRound + playerArray.length - 1; r++) {
	        let round = [];
	        for (let i = 0; i < playerArray.length / 2; i++) {
	            round.push({
	                round: r,
	                match: i + 1,
	                player1: null,
	                player2: null
	            });
	        }
	        if (r === startingRound) {
	            round.forEach((m, i) => {
	                m.player1 = playerArray[i];
	                m.player2 = playerArray[playerArray.length - i - 1];
	            });
	        }
	        else {
	            const prevRound = matches.filter(m => m.round === r - 1);
	            const indexFind = idx => {
	                if (idx + (playerArray.length / 2) > playerArray.length - 2) {
	                    return idx + 1 - (playerArray.length / 2);
	                }
	                else {
	                    return idx + (playerArray.length / 2);
	                }
	            };
	            for (let i = 0; i < round.length; i++) {
	                const prev = prevRound[i];
	                const curr = round[i];
	                if (i === 0) {
	                    if (prev.player2 === playerArray[playerArray.length - 1]) {
	                        curr.player1 = playerArray[playerArray.length - 1];
	                        curr.player2 = playerArray[indexFind(playerArray.findIndex(p => p === prev.player1))];
	                    }
	                    else {
	                        curr.player2 = playerArray[playerArray.length - 1];
	                        curr.player1 = playerArray[indexFind(playerArray.findIndex(p => p === prev.player2))];
	                    }
	                }
	                else {
	                    curr.player1 = playerArray[indexFind(playerArray.findIndex(p => p === prev.player1))];
	                    curr.player2 = playerArray[indexFind(playerArray.findIndex(p => p === prev.player2))];
	                }
	            }
	        }
	        matches = [...matches, ...round];
	    }
	    return matches;
	}

	function Stepladder(players, startingRound = 1, ordered = true) {
	    const matches = [];
	    let playerArray = [];
	    if (Array.isArray(players)) {
	        playerArray = ordered ? players : shuffle(players);
	    }
	    else {
	        playerArray = [...new Array(players)].map((_, i) => i + 1);
	    }
	    const rounds = playerArray.length - 1;
	    for (let i = startingRound; i < startingRound + rounds; i++) {
	        const match = {
	            round: i,
	            match: 1,
	            player1: playerArray[playerArray.length - (i - startingRound) - 2],
	            player2: i === startingRound ? playerArray[playerArray.length - (i - startingRound) - 1] : null
	        };
	        if (i < startingRound + rounds - 1) {
	            match.win = {
	                round: i + 1,
	                match: 1
	            };
	        }
	        matches.push(match);
	    }
	    return matches;
	}

	/*Converted to JS from Python by Matt Krick. Original: http://jorisvr.nl/maximummatching.html*/

	var blossom = function (edges, maxCardinality) {
	  if (edges.length === 0) {
	    return edges;
	  }
	  var edmonds = new Edmonds(edges, maxCardinality);
	  return edmonds.maxWeightMatching();

	};

	var Edmonds = function (edges, maxCardinality) {
	  this.edges = edges;
	  this.maxCardinality = maxCardinality;
	  this.nEdge = edges.length;
	  this.init();
	};

	Edmonds.prototype.maxWeightMatching = function () {
	  for (var t = 0; t < this.nVertex; t++) {
	    //console.log('DEBUG: STAGE ' + t);
	    this.label = filledArray(2 * this.nVertex, 0);
	    this.bestEdge = filledArray(2 * this.nVertex, -1);
	    this.blossomBestEdges = initArrArr(2 * this.nVertex);
	    this.allowEdge = filledArray(this.nEdge, false);
	    this.queue = [];
	    for (var v = 0; v < this.nVertex; v++) {
	      if (this.mate[v] === -1 && this.label[this.inBlossom[v]] === 0) {
	        this.assignLabel(v, 1, -1);
	      }
	    }
	    var augmented = false;
	    while (true) {
	      //console.log('DEBUG: SUBSTAGE');
	      while (this.queue.length > 0 && !augmented) {
	        v = this.queue.pop();
	        //console.log('DEBUG: POP ', 'v=' + v);
	        //console.assert(this.label[this.inBlossom[v]] == 1);
	        for (var ii = 0; ii < this.neighbend[v].length; ii++) {
	          var p = this.neighbend[v][ii];
	          var k = ~~(p / 2);
	          var w = this.endpoint[p];
	          if (this.inBlossom[v] === this.inBlossom[w]) continue;
	          if (!this.allowEdge[k]) {
	            var kSlack = this.slack(k);
	            if (kSlack <= 0) {
	              this.allowEdge[k] = true;
	            }
	          }
	          if (this.allowEdge[k]) {
	            if (this.label[this.inBlossom[w]] === 0) {
	              this.assignLabel(w, 2, p ^ 1);
	            } else if (this.label[this.inBlossom[w]] === 1) {
	              var base = this.scanBlossom(v, w);
	              if (base >= 0) {
	                this.addBlossom(base, k);
	              } else {
	                this.augmentMatching(k);
	                augmented = true;
	                break;
	              }
	            } else if (this.label[w] === 0) {
	              //console.assert(this.label[this.inBlossom[w]] === 2);
	              this.label[w] = 2;
	              this.labelEnd[w] = p ^ 1;
	            }
	          } else if (this.label[this.inBlossom[w]] === 1) {
	            var b = this.inBlossom[v];
	            if (this.bestEdge[b] === -1 || kSlack < this.slack(this.bestEdge[b])) {
	              this.bestEdge[b] = k;
	            }
	          } else if (this.label[w] === 0) {
	            if (this.bestEdge[w] === -1 || kSlack < this.slack(this.bestEdge[w])) {
	              this.bestEdge[w] = k;
	            }
	          }
	        }
	      }
	      if (augmented) break;
	      var deltaType = -1;
	      var delta = [];
	      var deltaEdge = [];
	      var deltaBlossom = [];
	      if (!this.maxCardinality) {
	        deltaType = 1;
	        delta = getMin(this.dualVar, 0, this.nVertex - 1);
	      }
	      for (v = 0; v < this.nVertex; v++) {
	        if (this.label[this.inBlossom[v]] === 0 && this.bestEdge[v] !== -1) {
	          var d = this.slack(this.bestEdge[v]);
	          if (deltaType === -1 || d < delta) {
	            delta = d;
	            deltaType = 2;
	            deltaEdge = this.bestEdge[v];
	          }
	        }
	      }
	      for (b = 0; b < 2 * this.nVertex; b++) {
	        if (this.blossomParent[b] === -1 && this.label[b] === 1 && this.bestEdge[b] !== -1) {
	          kSlack = this.slack(this.bestEdge[b]);
	          ////console.assert((kSlack % 2) == 0);
	          d = kSlack / 2;
	          if (deltaType === -1 || d < delta) {
	            delta = d;
	            deltaType = 3;
	            deltaEdge = this.bestEdge[b];
	          }
	        }
	      }
	      for (b = this.nVertex; b < this.nVertex * 2; b++) {
	        if (this.blossomBase[b] >= 0 && this.blossomParent[b] === -1 && this.label[b] === 2 && (deltaType === -1 || this.dualVar[b] < delta)) {
	          delta = this.dualVar[b];
	          deltaType = 4;
	          deltaBlossom = b;
	        }
	      }
	      if (deltaType === -1) {
	        //console.assert(this.maxCardinality);
	        deltaType = 1;
	        delta = Math.max(0, getMin(this.dualVar, 0, this.nVertex - 1));
	      }
	      for (v = 0; v < this.nVertex; v++) {
	        var curLabel = this.label[this.inBlossom[v]];
	        if (curLabel === 1) {
	          this.dualVar[v] -= delta;
	        } else if (curLabel === 2) {
	          this.dualVar[v] += delta;
	        }
	      }
	      for (b = this.nVertex; b < this.nVertex * 2; b++) {
	        if (this.blossomBase[b] >= 0 && this.blossomParent[b] === -1) {
	          if (this.label[b] === 1) {
	            this.dualVar[b] += delta;
	          } else if (this.label[b] === 2) {
	            this.dualVar[b] -= delta;
	          }
	        }
	      }
	      //console.log('DEBUG: deltaType', deltaType, ' delta: ', delta);
	      if (deltaType === 1) {
	        break;
	      } else if (deltaType === 2) {
	        this.allowEdge[deltaEdge] = true;
	        var i = this.edges[deltaEdge][0];
	        var j = this.edges[deltaEdge][1];
	        this.edges[deltaEdge][2];
	        if (this.label[this.inBlossom[i]] === 0) {
	          i = i ^ j;
	          j = j ^ i;
	          i = i ^ j;
	        }
	        //console.assert(this.label[this.inBlossom[i]] == 1);
	        this.queue.push(i);
	      } else if (deltaType === 3) {
	        this.allowEdge[deltaEdge] = true;
	        i = this.edges[deltaEdge][0];
	        j = this.edges[deltaEdge][1];
	        this.edges[deltaEdge][2];
	        //console.assert(this.label[this.inBlossom[i]] == 1);
	        this.queue.push(i);
	      } else if (deltaType === 4) {
	        this.expandBlossom(deltaBlossom, false);
	      }
	    }
	    if (!augmented) break;
	    for (b = this.nVertex; b < this.nVertex * 2; b++) {
	      if (this.blossomParent[b] === -1 && this.blossomBase[b] >= 0 && this.label[b] === 1 && this.dualVar[b] === 0) {
	        this.expandBlossom(b, true);
	      }
	    }
	  }
	  for (v = 0; v < this.nVertex; v++) {
	    if (this.mate[v] >= 0) {
	      this.mate[v] = this.endpoint[this.mate[v]];
	    }
	  }
	  for (v = 0; v < this.nVertex; v++) {
	    //console.assert(this.mate[v] == -1 || this.mate[this.mate[v]] == v);
	  }
	  return this.mate;
	};

	Edmonds.prototype.slack = function (k) {
	  var i = this.edges[k][0];
	  var j = this.edges[k][1];
	  var wt = this.edges[k][2];
	  return this.dualVar[i] + this.dualVar[j] - 2 * wt;
	};

	Edmonds.prototype.blossomLeaves = function (b) {
	  if (b < this.nVertex) {
	    return [b];
	  }
	  var leaves = [];
	  var childList = this.blossomChilds[b];
	  for (var t = 0; t < childList.length; t++) {
	    if (childList[t] <= this.nVertex) {
	      leaves.push(childList[t]);
	    } else {
	      var leafList = this.blossomLeaves(childList[t]);
	      for (var v = 0; v < leafList.length; v++) {
	        leaves.push(leafList[v]);
	      }
	    }
	  }
	  return leaves;
	};

	Edmonds.prototype.assignLabel = function (w, t, p) {
	  //console.log('DEBUG: assignLabel(' + w + ',' + t + ',' + p + '}');
	  var b = this.inBlossom[w];
	  //console.assert(this.label[w] === 0 && this.label[b] === 0);
	  this.label[w] = this.label[b] = t;
	  this.labelEnd[w] = this.labelEnd[b] = p;
	  this.bestEdge[w] = this.bestEdge[b] = -1;
	  if (t === 1) {
	    this.queue.push.apply(this.queue, this.blossomLeaves(b));
	    //console.log('DEBUG: PUSH ' + this.blossomLeaves(b).toString());
	  } else if (t === 2) {
	    var base = this.blossomBase[b];
	    //console.assert(this.mate[base] >= 0);
	    this.assignLabel(this.endpoint[this.mate[base]], 1, this.mate[base] ^ 1);
	  }
	};

	Edmonds.prototype.scanBlossom = function (v, w) {
	  //console.log('DEBUG: scanBlossom(' + v + ',' + w + ')');
	  var path = [];
	  var base = -1;
	  while (v !== -1 || w !== -1) {
	    var b = this.inBlossom[v];
	    if ((this.label[b] & 4)) {
	      base = this.blossomBase[b];
	      break;
	    }
	    //console.assert(this.label[b] === 1);
	    path.push(b);
	    this.label[b] = 5;
	    //console.assert(this.labelEnd[b] === this.mate[this.blossomBase[b]]);
	    if (this.labelEnd[b] === -1) {
	      v = -1;
	    } else {
	      v = this.endpoint[this.labelEnd[b]];
	      b = this.inBlossom[v];
	      //console.assert(this.label[b] === 2);
	      //console.assert(this.labelEnd[b] >= 0);
	      v = this.endpoint[this.labelEnd[b]];
	    }
	    if (w !== -1) {
	      v = v ^ w;
	      w = w ^ v;
	      v = v ^ w;
	    }
	  }
	  for (var ii = 0; ii < path.length; ii++) {
	    b = path[ii];
	    this.label[b] = 1;
	  }
	  return base;
	};

	Edmonds.prototype.addBlossom = function (base, k) {
	  var v = this.edges[k][0];
	  var w = this.edges[k][1];
	  this.edges[k][2];
	  var bb = this.inBlossom[base];
	  var bv = this.inBlossom[v];
	  var bw = this.inBlossom[w];
	  var b = this.unusedBlossoms.pop();
	  //console.log('DEBUG: addBlossom(' + base + ',' + k + ')' + ' (v=' + v + ' w=' + w + ')' + ' -> ' + b);
	  this.blossomBase[b] = base;
	  this.blossomParent[b] = -1;
	  this.blossomParent[bb] = b;
	  var path = this.blossomChilds[b] = [];
	  var endPs = this.blossomEndPs[b] = [];
	  while (bv !== bb) {
	    this.blossomParent[bv] = b;
	    path.push(bv);
	    endPs.push(this.labelEnd[bv]);
	    //console.assert(this.label[bv] === 2 || (this.label[bv] === 1 && this.labelEnd[bv] === this.mate[this.blossomBase[bv]]));
	    //console.assert(this.labelEnd[bv] >= 0);
	    v = this.endpoint[this.labelEnd[bv]];
	    bv = this.inBlossom[v];
	  }
	  path.push(bb);
	  path.reverse();
	  endPs.reverse();
	  endPs.push((2 * k));
	  while (bw !== bb) {
	    this.blossomParent[bw] = b;
	    path.push(bw);
	    endPs.push(this.labelEnd[bw] ^ 1);
	    //console.assert(this.label[bw] === 2 || (this.label[bw] === 1 && this.labelEnd[bw] === this.mate[this.blossomBase[bw]]));
	    //console.assert(this.labelEnd[bw] >= 0);
	    w = this.endpoint[this.labelEnd[bw]];
	    bw = this.inBlossom[w];
	  }
	  //console.assert(this.label[bb] === 1);
	  this.label[b] = 1;
	  this.labelEnd[b] = this.labelEnd[bb];
	  this.dualVar[b] = 0;
	  var leaves = this.blossomLeaves(b);
	  for (var ii = 0; ii < leaves.length; ii++) {
	    v = leaves[ii];
	    if (this.label[this.inBlossom[v]] === 2) {
	      this.queue.push(v);
	    }
	    this.inBlossom[v] = b;
	  }
	  var bestEdgeTo = filledArray(2 * this.nVertex, -1);
	  for (ii = 0; ii < path.length; ii++) {
	    bv = path[ii];
	    if (this.blossomBestEdges[bv].length === 0) {
	      var nbLists = [];
	      leaves = this.blossomLeaves(bv);
	      for (var x = 0; x < leaves.length; x++) {
	        v = leaves[x];
	        nbLists[x] = [];
	        for (var y = 0; y < this.neighbend[v].length; y++) {
	          var p = this.neighbend[v][y];
	          nbLists[x].push(~~(p / 2));
	        }
	      }
	    } else {
	      nbLists = [this.blossomBestEdges[bv]];
	    }
	    //console.log('DEBUG: nbLists ' + nbLists.toString());
	    for (x = 0; x < nbLists.length; x++) {
	      var nbList = nbLists[x];
	      for (y = 0; y < nbList.length; y++) {
	        k = nbList[y];
	        var i = this.edges[k][0];
	        var j = this.edges[k][1];
	        this.edges[k][2];
	        if (this.inBlossom[j] === b) {
	          i = i ^ j;
	          j = j ^ i;
	          i = i ^ j;
	        }
	        var bj = this.inBlossom[j];
	        if (bj !== b && this.label[bj] === 1 && (bestEdgeTo[bj] === -1 || this.slack(k) < this.slack(bestEdgeTo[bj]))) {
	          bestEdgeTo[bj] = k;
	        }
	      }
	    }
	    this.blossomBestEdges[bv] = [];
	    this.bestEdge[bv] = -1;
	  }
	  var be = [];
	  for (ii = 0; ii < bestEdgeTo.length; ii++) {
	    k = bestEdgeTo[ii];
	    if (k !== -1) {
	      be.push(k);
	    }
	  }
	  this.blossomBestEdges[b] = be;
	  //console.log('DEBUG: blossomBestEdges[' + b + ']= ' + this.blossomBestEdges[b].toString());
	  this.bestEdge[b] = -1;
	  for (ii = 0; ii < this.blossomBestEdges[b].length; ii++) {
	    k = this.blossomBestEdges[b][ii];
	    if (this.bestEdge[b] === -1 || this.slack(k) < this.slack(this.bestEdge[b])) {
	      this.bestEdge[b] = k;
	    }
	  }
	  //console.log('DEBUG: blossomChilds[' + b + ']= ' + this.blossomChilds[b].toString());
	};

	Edmonds.prototype.expandBlossom = function (b, endStage) {
	  //console.log('DEBUG: expandBlossom(' + b + ',' + endStage + ') ' + this.blossomChilds[b].toString());
	  for (var ii = 0; ii < this.blossomChilds[b].length; ii++) {
	    var s = this.blossomChilds[b][ii];
	    this.blossomParent[s] = -1;
	    if (s < this.nVertex) {
	      this.inBlossom[s] = s;
	    } else if (endStage && this.dualVar[s] === 0) {
	      this.expandBlossom(s, endStage);
	    } else {
	      var leaves = this.blossomLeaves(s);
	      for (var jj = 0; jj < leaves.length; jj++) {
	        var v = leaves[jj];
	        this.inBlossom[v] = s;
	      }
	    }
	  }
	  if (!endStage && this.label[b] === 2) {
	    //console.assert(this.labelEnd[b] >= 0);
	    var entryChild = this.inBlossom[this.endpoint[this.labelEnd[b] ^ 1]];
	    var j = this.blossomChilds[b].indexOf(entryChild);
	    if ((j & 1)) {
	      j -= this.blossomChilds[b].length;
	      var jStep = 1;
	      var endpTrick = 0;
	    } else {
	      jStep = -1;
	      endpTrick = 1;
	    }
	    var p = this.labelEnd[b];
	    while (j !== 0) {
	      this.label[this.endpoint[p ^ 1]] = 0;
	      this.label[this.endpoint[pIndex(this.blossomEndPs[b], j - endpTrick) ^ endpTrick ^ 1]] = 0;
	      this.assignLabel(this.endpoint[p ^ 1], 2, p);
	      this.allowEdge[~~(pIndex(this.blossomEndPs[b], j - endpTrick) / 2)] = true;
	      j += jStep;
	      p = pIndex(this.blossomEndPs[b], j - endpTrick) ^ endpTrick;
	      this.allowEdge[~~(p / 2)] = true;
	      j += jStep;
	    }
	    var bv = pIndex(this.blossomChilds[b], j);
	    this.label[this.endpoint[p ^ 1]] = this.label[bv] = 2;

	    this.labelEnd[this.endpoint[p ^ 1]] = this.labelEnd[bv] = p;
	    this.bestEdge[bv] = -1;
	    j += jStep;
	    while (pIndex(this.blossomChilds[b], j) !== entryChild) {
	      bv = pIndex(this.blossomChilds[b], j);
	      if (this.label[bv] === 1) {
	        j += jStep;
	        continue;
	      }
	      leaves = this.blossomLeaves(bv);
	      for (ii = 0; ii < leaves.length; ii++) {
	        v = leaves[ii];
	        if (this.label[v] !== 0) break;
	      }
	      if (this.label[v] !== 0) {
	        //console.assert(this.label[v] === 2);
	        //console.assert(this.inBlossom[v] === bv);
	        this.label[v] = 0;
	        this.label[this.endpoint[this.mate[this.blossomBase[bv]]]] = 0;
	        this.assignLabel(v, 2, this.labelEnd[v]);
	      }
	      j += jStep;
	    }
	  }
	  this.label[b] = this.labelEnd[b] = -1;
	  this.blossomEndPs[b] = this.blossomChilds[b] = [];
	  this.blossomBase[b] = -1;
	  this.blossomBestEdges[b] = [];
	  this.bestEdge[b] = -1;
	  this.unusedBlossoms.push(b);
	};

	Edmonds.prototype.augmentBlossom = function (b, v) {
	  //console.log('DEBUG: augmentBlossom(' + b + ',' + v + ')');
	  var i, j;
	  var t = v;
	  while (this.blossomParent[t] !== b) {
	    t = this.blossomParent[t];
	  }
	  if (t > this.nVertex) {
	    this.augmentBlossom(t, v);
	  }
	  i = j = this.blossomChilds[b].indexOf(t);
	  if ((i & 1)) {
	    j -= this.blossomChilds[b].length;
	    var jStep = 1;
	    var endpTrick = 0;
	  } else {
	    jStep = -1;
	    endpTrick = 1;
	  }
	  while (j !== 0) {
	    j += jStep;
	    t = pIndex(this.blossomChilds[b], j);
	    var p = pIndex(this.blossomEndPs[b], j - endpTrick) ^ endpTrick;
	    if (t >= this.nVertex) {
	      this.augmentBlossom(t, this.endpoint[p]);
	    }
	    j += jStep;
	    t = pIndex(this.blossomChilds[b], j);
	    if (t >= this.nVertex) {
	      this.augmentBlossom(t, this.endpoint[p ^ 1]);
	    }
	    this.mate[this.endpoint[p]] = p ^ 1;
	    this.mate[this.endpoint[p ^ 1]] = p;
	  }
	  //console.log('DEBUG: PAIR ' + this.endpoint[p] + ' ' + this.endpoint[p^1] + '(k=' + ~~(p/2) + ')');
	  this.blossomChilds[b] = this.blossomChilds[b].slice(i).concat(this.blossomChilds[b].slice(0, i));
	  this.blossomEndPs[b] = this.blossomEndPs[b].slice(i).concat(this.blossomEndPs[b].slice(0, i));
	  this.blossomBase[b] = this.blossomBase[this.blossomChilds[b][0]];
	  //console.assert(this.blossomBase[b] === v);
	};

	Edmonds.prototype.augmentMatching = function (k) {
	  var v = this.edges[k][0];
	  var w = this.edges[k][1];
	  //console.log('DEBUG: augmentMatching(' + k + ')' + ' (v=' + v + ' ' + 'w=' + w);
	  //console.log('DEBUG: PAIR ' + v + ' ' + w + '(k=' + k + ')');
	  for (var ii = 0; ii < 2; ii++) {
	    if (ii === 0) {
	      var s = v;
	      var p = 2 * k + 1;
	    } else {
	      s = w;
	      p = 2 * k;
	    }
	    while (true) {
	      var bs = this.inBlossom[s];
	      //console.assert(this.label[bs] === 1);
	      //console.assert(this.labelEnd[bs] === this.mate[this.blossomBase[bs]]);
	      if (bs >= this.nVertex) {
	        this.augmentBlossom(bs, s);
	      }
	      this.mate[s] = p;
	      if (this.labelEnd[bs] === -1) break;
	      var t = this.endpoint[this.labelEnd[bs]];
	      var bt = this.inBlossom[t];
	      //console.assert(this.label[bt] === 2);
	      //console.assert(this.labelEnd[bt] >= 0);
	      s = this.endpoint[this.labelEnd[bt]];
	      var j = this.endpoint[this.labelEnd[bt] ^ 1];
	      //console.assert(this.blossomBase[bt] === t);
	      if (bt >= this.nVertex) {
	        this.augmentBlossom(bt, j);
	      }
	      this.mate[j] = this.labelEnd[bt];
	      p = this.labelEnd[bt] ^ 1;
	      //console.log('DEBUG: PAIR ' + s + ' ' + t + '(k=' + ~~(p/2) + ')');


	    }
	  }
	};


	//INIT STUFF//
	Edmonds.prototype.init = function () {
	  this.nVertexInit();
	  this.maxWeightInit();
	  this.endpointInit();
	  this.neighbendInit();
	  this.mate = filledArray(this.nVertex, -1);
	  this.label = filledArray(2 * this.nVertex, 0); //remove?
	  this.labelEnd = filledArray(2 * this.nVertex, -1);
	  this.inBlossomInit();
	  this.blossomParent = filledArray(2 * this.nVertex, -1);
	  this.blossomChilds = initArrArr(2 * this.nVertex);
	  this.blossomBaseInit();
	  this.blossomEndPs = initArrArr(2 * this.nVertex);
	  this.bestEdge = filledArray(2 * this.nVertex, -1); //remove?
	  this.blossomBestEdges = initArrArr(2 * this.nVertex); //remove?
	  this.unusedBlossomsInit();
	  this.dualVarInit();
	  this.allowEdge = filledArray(this.nEdge, false); //remove?
	  this.queue = []; //remove?
	};
	Edmonds.prototype.blossomBaseInit = function () {
	  var base = [];
	  for (var i = 0; i < this.nVertex; i++) {
	    base[i] = i;
	  }
	  var negs = filledArray(this.nVertex, -1);
	  this.blossomBase = base.concat(negs);
	};
	Edmonds.prototype.dualVarInit = function () {
	  var mw = filledArray(this.nVertex, this.maxWeight);
	  var zeros = filledArray(this.nVertex, 0);
	  this.dualVar = mw.concat(zeros);
	};
	Edmonds.prototype.unusedBlossomsInit = function () {
	  var i, unusedBlossoms = [];
	  for (i = this.nVertex; i < 2 * this.nVertex; i++) {
	    unusedBlossoms.push(i);
	  }
	  this.unusedBlossoms = unusedBlossoms;
	};
	Edmonds.prototype.inBlossomInit = function () {
	  var i, inBlossom = [];
	  for (i = 0; i < this.nVertex; i++) {
	    inBlossom[i] = i;
	  }
	  this.inBlossom = inBlossom;
	};
	Edmonds.prototype.neighbendInit = function () {
	  var k, i, j;
	  var neighbend = initArrArr(this.nVertex);
	  for (k = 0; k < this.nEdge; k++) {
	    i = this.edges[k][0];
	    j = this.edges[k][1];
	    neighbend[i].push(2 * k + 1);
	    neighbend[j].push(2 * k);
	  }
	  this.neighbend = neighbend;
	};
	Edmonds.prototype.endpointInit = function () {
	  var p;
	  var endpoint = [];
	  for (p = 0; p < 2 * this.nEdge; p++) {
	    endpoint[p] = this.edges[~~(p / 2)][p % 2];
	  }
	  this.endpoint = endpoint;
	};
	Edmonds.prototype.nVertexInit = function () {
	  var nVertex = 0;
	  for (var k = 0; k < this.nEdge; k++) {
	    var i = this.edges[k][0];
	    var j = this.edges[k][1];
	    if (i >= nVertex) nVertex = i + 1;
	    if (j >= nVertex) nVertex = j + 1;
	  }
	  this.nVertex = nVertex;
	};
	Edmonds.prototype.maxWeightInit = function () {
	  var maxWeight = 0;
	  for (var k = 0; k < this.nEdge; k++) {
	    var weight = this.edges[k][2];
	    if (weight > maxWeight) {
	      maxWeight = weight;
	    }
	  }
	  this.maxWeight = maxWeight;
	};

	//HELPERS//
	function filledArray(len, fill) {
	  var i, newArray = [];
	  for (i = 0; i < len; i++) {
	    newArray[i] = fill;
	  }
	  return newArray;
	}

	function initArrArr(len) {
	  var arr = [];
	  for (var i = 0; i < len; i++) {
	    arr[i] = [];
	  }
	  return arr;
	}

	function getMin(arr, start, end) {
	  var min = Infinity;
	  for (var i = start; i <= end; i++) {
	    if (arr[i] < min) {
	      min = arr[i];
	    }
	  }
	  return min;
	}

	function pIndex(arr, idx) {
	  //if idx is negative, go from the back
	  return idx < 0 ? arr[arr.length + idx] : arr[idx];
	}

	var blossom$1 = /*@__PURE__*/getDefaultExportFromCjs(blossom);

	function Swiss(players, round, rated = false, colors = false) {
	    const matches = [];
	    let playerArray = [];
	    if (Array.isArray(players)) {
	        playerArray = players;
	    }
	    else {
	        playerArray = [...new Array(players)].map((_, i) => i + 1);
	    }
	    if (rated) {
	        playerArray.filter(p => !p.hasOwnProperty('rating') || p.rating === null).forEach(p => p.rating = 0);
	    }
	    if (colors) {
	        playerArray.filter(p => !p.hasOwnProperty('colors')).forEach(p => p.colors = []);
	    }
	    playerArray = shuffle(playerArray);
	    playerArray.forEach((p, i) => p.index = i);
	    const scoreGroups = [...new Set(playerArray.map(p => p.score))].sort((a, b) => a - b);
	    const scoreSums = [...new Set(scoreGroups.map((s, i, a) => {
	            let sums = [];
	            for (let j = i; j < a.length; j++) {
	                sums.push(s + a[j]);
	            }
	            return sums;
	        }).flat())].sort((a, b) => a - b);
	    let pairs = [];
	    for (let i = 0; i < playerArray.length; i++) {
	        const curr = playerArray[i];
	        const next = playerArray.slice(i + 1);
	        const sorted = rated ? [...next].sort((a, b) => Math.abs(curr.rating - a.rating) - Math.abs(curr.rating - b.rating)) : [];
	        for (let j = 0; j < next.length; j++) {
	            const opp = next[j];
	            if (curr.hasOwnProperty('avoid') && curr.avoid.includes(opp.id)) {
	                continue;
	            }
	            let wt = 14 * Math.log10(scoreSums.findIndex(s => s === curr.score + opp.score) + 1);
	            const scoreGroupDiff = Math.abs(scoreGroups.findIndex(s => s === curr.score) - scoreGroups.findIndex(s => s === opp.score));
	            wt += scoreGroupDiff < 2 ? 3 / Math.log10(scoreGroupDiff + 2) : 1 / Math.log10(scoreGroupDiff + 2);
	            if (scoreGroupDiff === 1 && curr.hasOwnProperty('pairedUpDown') && curr.pairedUpDown === false && opp.hasOwnProperty('pairedUpDown') && opp.pairedUpDown === false) {
	                wt += 1.2;
	            }
	            if (rated) {
	                wt += (Math.log2(sorted.length) - Math.log2(sorted.findIndex(p => p.id === opp.id) + 1)) / 3;
	            }
	            if (colors) {
	                const colorScore = curr.colors.reduce((sum, color) => color === 'w' ? sum + 1 : sum - 1, 0);
	                const oppScore = opp.colors.reduce((sum, color) => color === 'w' ? sum + 1 : sum - 1, 0);
	                if (curr.colors.length > 1 && curr.colors.slice(-2).join('') === 'ww') {
	                    if (opp.colors.slice(-2).join('') === 'ww') {
	                        continue;
	                    }
	                    else if (opp.colors.slice(-2).join('') === 'bb') {
	                        wt += 7;
	                    }
	                    else {
	                        wt += 2 / Math.log(4 - Math.abs(oppScore));
	                    }
	                }
	                else if (curr.colors.length > 1 && curr.colors.slice(-2).join('') === 'bb') {
	                    if (opp.colors.slice(-2).join('') === 'bb') {
	                        continue;
	                    }
	                    else if (opp.colors.slice(-2).join('') === 'ww') {
	                        wt += 8;
	                    }
	                    else {
	                        wt += 2 / Math.log(4 - Math.abs(oppScore));
	                    }
	                }
	                else {
	                    wt += 5 / (4 * Math.log10(6 - Math.abs(colorScore - oppScore)));
	                }
	            }
	            if ((curr.hasOwnProperty('receivedBye') && curr.receivedBye) || (opp.hasOwnProperty('receivedBye') && opp.receivedBye)) {
	                wt *= 1.5;
	            }
	            pairs.push([curr.index, opp.index, wt]);
	        }
	    }
	    const blossomPairs = blossom$1(pairs, true);
	    let playerCopy = [...playerArray];
	    let byeArray = [];
	    let match = 1;
	    do {
	        const indexA = playerCopy[0].index;
	        const indexB = blossomPairs[indexA];
	        if (indexB === -1) {
	            byeArray.push(playerCopy.splice(0, 1)[0]);
	            continue;
	        }
	        playerCopy.splice(0, 1);
	        playerCopy.splice(playerCopy.findIndex(p => p.index === indexB), 1);
	        let playerA = playerArray.find(p => p.index === indexA);
	        let playerB = playerArray.find(p => p.index === indexB);
	        if (colors) {
	            const aScore = playerA.colors.reduce((sum, color) => color === 'w' ? sum + 1 : sum - 1, 0);
	            const bScore = playerB.colors.reduce((sum, color) => color === 'w' ? sum + 1 : sum - 1, 0);
	            if (playerB.colors.slice(-2).join('') === 'bb' ||
	                playerA.colors.slice(-2).join('') === 'ww' ||
	                (playerB.colors.slice(-1) === 'b' && playerA.colors.slice(-1) === 'w') ||
	                bScore < aScore) {
	                [playerA, playerB] = [playerB, playerA];
	            }
	        }
	        matches.push({
	            round: round,
	            match: match++,
	            player1: playerA.id,
	            player2: playerB.id
	        });
	    } while (playerCopy.length > blossomPairs.reduce((sum, idx) => idx === -1 ? sum + 1 : sum, 0));
	    byeArray = [...byeArray, ...playerCopy];
	    for (let i = 0; i < byeArray.length; i++) {
	        matches.push({
	            round: round,
	            match: match++,
	            player1: byeArray[i].id,
	            player2: null
	        });
	    }
	    return matches;
	}

	/**
	 * Class representing a player
	 *
	 * See {@link PlayerValues} for detailed descriptions of properties.
	 */
	class Player {
	    /** Create a new player. */
	    constructor(id, name) {
	        this.id = id;
	        this.name = name;
	        this.active = true;
	        this.value = 0;
	        this.matches = [];
	        this.meta = {};
	    }
	    /** Set information about the player (only changes in information need to be included in the object). */
	    set values(options) {
	        if (options.hasOwnProperty('matches')) {
	            options.matches = [...this.matches, ...options.matches];
	        }
	        Object.assign(this, options);
	    }
	    /**
	     * Adds a match to the player's record.
	     *
	     * Throws an error if attempting to duplicate a match.
	     * @param match Object with match details
	     */
	    addMatch(match) {
	        if (this.matches.find(m => m.id === match.id) !== undefined) {
	            throw `Match with ID ${match.id} already exists`;
	        }
	        const newMatch = Object.assign({
	            pairUpDown: false,
	            color: null,
	            bye: false,
	            win: 0,
	            loss: 0,
	            draw: 0
	        }, match);
	        this.matches.push(newMatch);
	    }
	    /**
	     * Removes a match from player history.
	     *
	     * Throws an error if the match doesn't exist in the player's records.
	     * @param id The ID of the match
	     */
	    removeMatch(id) {
	        const index = this.matches.findIndex(m => m.id === id);
	        if (index === -1) {
	            throw `Match with ID ${id} does not exist`;
	        }
	        this.matches.splice(index, 1);
	    }
	    /**
	     * Updates the details of a match.
	     *
	     * Throws an error if the match doesn't exist in the player's records.
	     *
	     * Only needs to contain properties that are being changed.
	     * @param id The ID of the match
	     * @param values The match details being changed
	     */
	    updateMatch(id, values) {
	        const match = this.matches.find(m => m.id === id);
	        if (match === undefined) {
	            throw `Match with ID ${id} does not exist`;
	        }
	        Object.assign(match, values);
	    }
	}

	var _Tournament_instances, _Tournament_createMatches, _Tournament_computeScores;
	/**
	 * Class representing a tournament.
	 *
	 * See {@link TournamentValues} for detailed descriptions of properties.
	 */
	class Tournament {
	    /**
	     * Create a new tournament.
	     * @param id Unique ID of the tournament
	     * @param name Name of the tournament
	     */
	    constructor(id, name) {
	        _Tournament_instances.add(this);
	        this.id = id;
	        this.name = name;
	        this.status = 'setup';
	        this.round = 0;
	        this.players = [];
	        this.matches = [];
	        this.colored = false;
	        this.sorting = 'none';
	        this.scoring = {
	            bestOf: 1,
	            win: 1,
	            draw: 0.5,
	            loss: 0,
	            bye: 1,
	            tiebreaks: []
	        };
	        this.stageOne = {
	            format: 'single-elimination',
	            consolation: false,
	            rounds: 0,
	            initialRound: 1,
	            maxPlayers: 0
	        };
	        this.stageTwo = {
	            format: null,
	            consolation: false,
	            advance: {
	                value: 0,
	                method: 'all'
	            }
	        };
	        this.meta = {};
	    }
	    /** Set tournament options (only changes in options need to be included in the object) */
	    set settings(options) {
	        if (options.hasOwnProperty('players')) {
	            options.players = [...this.players, ...options.players];
	        }
	        if (options.hasOwnProperty('matches')) {
	            options.matches = [...this.matches, ...options.matches];
	        }
	        if (options.hasOwnProperty('scoring')) {
	            options.scoring = Object.assign(this.scoring, options.scoring);
	        }
	        if (options.hasOwnProperty('stageOne')) {
	            options.stageOne = Object.assign(this.stageOne, options.stageOne);
	        }
	        if (options.hasOwnProperty('stageTwo')) {
	            options.stageTwo = Object.assign(this.stageTwo, options.stageTwo);
	        }
	        Object.assign(this, options);
	    }
	    /**
	     * Create a new player.
	     *
	     * Throws an error if ID is specified and already exists, if the specified maximum number of players has been reached, if the tournament is in stage one and not Swiss format, or if the tournament is in stage two or complete.
	     * @param name Alias of the player
	     * @param id ID of the player (randomly assigned if omitted)
	     * @returns The newly created player
	     */
	    createPlayer(name, id = undefined) {
	        if ((this.status === 'stage-one' && this.stageOne.format !== 'swiss') || this.status === 'stage-two' || this.status === 'complete') {
	            throw `Players can only be added during setup or stage one (if Swiss format)`;
	        }
	        if (this.stageOne.maxPlayers > 0 && this.players.length === this.stageOne.maxPlayers) {
	            throw `Maximum number of players (${this.stageOne.maxPlayers}) are enrolled`;
	        }
	        let ID = id;
	        if (ID === undefined) {
	            do {
	                ID = randomstring$1.generate({
	                    length: 12,
	                    charset: 'alphanumeric'
	                });
	            } while (this.players.some(p => p.id === ID));
	        }
	        else {
	            if (this.players.some(p => p.id === ID)) {
	                throw `Player with ID ${ID} already exists`;
	            }
	        }
	        const player = new Player(ID, name);
	        this.players.push(player);
	        return player;
	    }
	    /**
	     * Remove a player.
	     *
	     * Throws an error if no player has the ID specified or if the player is already inactive.
	     *
	     * In active elimination and stepladder formats, adjusts paths for any matches that interact with the match the player is in.
	     *
	     * In active round-robin formats, replaces the player in all future matches with a bye.
	     * @param id ID of the player
	     */
	    removePlayer(id) {
	        const player = this.players.find(p => p.id === id);
	        if (player === undefined) {
	            throw `Player with ID ${id} does not exist`;
	        }
	        if (player.active === false) {
	            throw `Player is already marked inactive`;
	        }
	        player.active = false;
	        if ((this.status === 'stage-one' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageOne.format) || this.status === 'stage-two' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageTwo.format))) {
	            const activeMatch = this.matches.find(match => match.active === true && (match.player1.id === player.id || match.player2.id === player.id));
	            if (activeMatch !== undefined) {
	                const opponent = this.players.find(p => p.id === (activeMatch.player1.id === player.id ? activeMatch.player2.id : activeMatch.player1.id));
	                activeMatch.values = {
	                    active: false,
	                    player1: activeMatch.player1.id === player.id ? {
	                        win: 0,
	                        loss: Math.ceil(this.scoring.bestOf / 2)
	                    } : {
	                        win: Math.ceil(this.scoring.bestOf / 2),
	                        loss: 0
	                    },
	                    player2: activeMatch.player1.id === player.id ? {
	                        win: Math.ceil(this.scoring.bestOf / 2),
	                        loss: 0
	                    } : {
	                        win: 0,
	                        loss: Math.ceil(this.scoring.bestOf / 2)
	                    }
	                };
	                player.updateMatch(activeMatch.id, {
	                    loss: Math.ceil(this.scoring.bestOf / 2)
	                });
	                opponent.updateMatch(activeMatch.id, {
	                    win: Math.ceil(this.scoring.bestOf / 2)
	                });
	                if (activeMatch.path.win !== null) {
	                    const winMatch = this.matches.find(match => match.id === activeMatch.path.win);
	                    if (winMatch.player1.id === null) {
	                        winMatch.values = {
	                            player1: {
	                                id: opponent.id
	                            }
	                        };
	                    }
	                    else {
	                        winMatch.values = {
	                            player2: {
	                                id: opponent.id
	                            }
	                        };
	                    }
	                    if (winMatch.player1.id !== null && winMatch.player2.id !== null) {
	                        winMatch.values = {
	                            active: true
	                        };
	                        this.players.find(p => p.id === winMatch.player1.id).addMatch({
	                            id: winMatch.id,
	                            opponent: winMatch.player2.id
	                        });
	                        this.players.find(p => p.id === winMatch.player2.id).addMatch({
	                            id: winMatch.id,
	                            opponent: winMatch.player1.id
	                        });
	                    }
	                }
	                if (activeMatch.path.loss !== null) {
	                    const lossMatch = this.matches.find(match => match.id === activeMatch.path.loss);
	                    if (lossMatch.player1.id === null && lossMatch.player2.id === null) {
	                        const prevMatch = this.matches.find(match => (match.path.win === lossMatch.id || match.path.loss === lossMatch.id) && match.player1.id !== player.id && match.player2.id !== player.id);
	                        prevMatch.values = {
	                            path: {
	                                win: prevMatch.path.win === lossMatch.id ? lossMatch.path.win : prevMatch.path.win,
	                                loss: prevMatch.path.loss === lossMatch.id ? lossMatch.path.win : prevMatch.path.loss
	                            }
	                        };
	                    }
	                    else {
	                        const waitingPlayer = this.players.find(player => player.id === (lossMatch.player1.id === null ? lossMatch.player2.id : lossMatch.player1.id));
	                        const winMatch = this.matches.find(match => match.id === lossMatch.path.win);
	                        if (winMatch.player1.id === null) {
	                            winMatch.values = {
	                                player1: {
	                                    id: waitingPlayer.id
	                                }
	                            };
	                        }
	                        else {
	                            winMatch.values = {
	                                player2: {
	                                    id: waitingPlayer.id
	                                }
	                            };
	                        }
	                        if (winMatch.player1.id !== null && winMatch.player2.id !== null) {
	                            winMatch.values = {
	                                active: true
	                            };
	                            this.players.find(p => p.id === winMatch.player1.id).addMatch({
	                                id: winMatch.id,
	                                opponent: winMatch.player2.id
	                            });
	                            this.players.find(p => p.id === winMatch.player2.id).addMatch({
	                                id: winMatch.id,
	                                opponent: winMatch.player1.id
	                            });
	                        }
	                    }
	                }
	            }
	            const waitingMatch = this.matches.find(match => (match.player1.id === player.id && match.player2.id === null) || (match.player2.id === player.id && match.player1.id === null));
	            if (waitingMatch !== undefined && waitingMatch.path.win !== null) {
	                const prevMatch = this.matches.find(match => (match.path.win === waitingMatch.id || match.path.loss === waitingMatch.id) && match.player1.id !== player.id && match.player2.id !== player.id);
	                prevMatch.values = {
	                    path: {
	                        win: prevMatch.path.win === waitingMatch.id ? waitingMatch.path.win : prevMatch.path.win,
	                        loss: prevMatch.path.loss === waitingMatch.id ? waitingMatch.path.win : prevMatch.path.loss
	                    }
	                };
	                if (waitingMatch.path.loss !== undefined) {
	                    const prevLossMatch = this.matches.find(match => (match.path.win === waitingMatch.path.loss || match.path.loss === waitingMatch.path.loss) && match.player1.id !== player.id && match.player2.id !== player.id);
	                    const currLossMatch = this.matches.find(match => match.id === waitingMatch.path.loss);
	                    prevLossMatch.values = {
	                        path: {
	                            win: prevLossMatch.path.win === currLossMatch.id ? currLossMatch.path.win : prevLossMatch.path.win,
	                            loss: prevLossMatch.path.loss === currLossMatch.id ? currLossMatch.path.win : prevLossMatch.path.loss
	                        }
	                    };
	                }
	            }
	        }
	        else if (['round-robin', 'double-round-robin'].includes(this.stageOne.format)) {
	            const byeMatches = this.matches.filter(match => match.round > this.round && (match.player1.id === player.id || match.player2.id === player.id));
	            byeMatches.forEach(match => {
	                match.values = {
	                    player1: {
	                        id: match.player1.id === player.id ? null : match.player1.id
	                    },
	                    player2: {
	                        id: match.player2.id === player.id ? null : match.player2.id
	                    }
	                };
	            });
	        }
	    }
	    /**
	     * Start the tournament.
	     *
	     * Throws an error if there are an insufficient number of players (4 if double elimination, otherwise 2).
	     */
	    start() {
	        const players = this.players.filter(p => p.active === true);
	        if ((this.stageOne.format === 'double-elimination' && players.length < 4) || players.length < 2) {
	            throw `Insufficient number of players (${players.length}) to start event`;
	        }
	        if (this.sorting !== 'none') {
	            players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
	        }
	        this.status = 'stage-one';
	        this.round = this.stageOne.initialRound;
	        __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_createMatches).call(this, players);
	        if (this.stageOne.format === 'swiss' && this.stageOne.rounds === 0) {
	            this.stageOne.rounds = Math.ceil(Math.log2(this.players.length));
	        }
	        else if (this.stageOne.format !== 'swiss') {
	            this.stageOne.rounds = this.matches.reduce((max, curr) => Math.max(max, curr.round), 0);
	        }
	    }
	    /**
	     * Progress to the next round in the tournament.
	     *
	     * Throws an error if there are active matches, if the current format is elimination or stepladder, or when attempting to create matches for stage two and there are an insufficient number of players.
	     */
	    next() {
	        if (this.status !== 'stage-one') {
	            throw `Can only advance rounds during stage one`;
	        }
	        if (['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageOne.format)) {
	            throw `Can not advance rounds in elimination or stepladder`;
	        }
	        if (this.matches.filter(match => match.active === true).length > 0) {
	            throw `Can not advance rounds with active matches`;
	        }
	        this.round++;
	        if (this.round > this.stageOne.rounds + this.stageOne.initialRound - 1) {
	            if (this.stageTwo.format !== null) {
	                this.status = 'stage-two';
	                if (this.stageTwo.advance.method === 'points') {
	                    this.players.filter(player => player.matches.reduce((sum, match) => match.win > match.loss ? sum + this.scoring.win : match.loss > match.win ? sum + this.scoring.loss : this.scoring.draw, 0) < this.stageTwo.advance.value).forEach(player => player.active = false);
	                }
	                else if (this.stageTwo.advance.method === 'rank') {
	                    const standings = this.standings();
	                    standings.splice(0, this.stageTwo.advance.value);
	                    standings.forEach(s => this.players.find(p => p.id === s.player.id).active = false);
	                }
	                if ((this.stageTwo.format === 'double-elimination' && this.players.filter(player => player.active === true).length < 4) || this.players.filter(player => player.active === true).length < 2) {
	                    throw `Insufficient number of players (${this.players.filter(player => player.active === true).length}) to create stage two matches`;
	                }
	                __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_createMatches).call(this, this.standings().map(s => s.player).filter(p => p.active === true));
	            }
	            else {
	                this.end();
	            }
	        }
	        else {
	            if (['round-robin', 'double-round-robin'].includes(this.stageOne.format)) {
	                const matches = this.matches.filter(m => m.round === this.round);
	                matches.forEach(match => {
	                    if (match.player1.id === null || match.player2.id === null) {
	                        this.players.find(p => p.id === (match.player1.id === null ? match.player2.id : match.player1.id)).addMatch({
	                            id: match.id,
	                            opponent: null,
	                            bye: true,
	                            win: Math.ceil(this.scoring.bestOf / 2)
	                        });
	                        match.values = {
	                            bye: true,
	                            player1: {
	                                win: match.player2.id === null ? Math.ceil(this.scoring.bestOf / 2) : 0
	                            },
	                            player2: {
	                                win: match.player1.id === null ? Math.ceil(this.scoring.bestOf / 2) : 0
	                            }
	                        };
	                    }
	                    else {
	                        match.values = { active: true };
	                        this.players.find(p => p.id === match.player1.id).addMatch({
	                            id: match.id,
	                            opponent: match.player2.id
	                        });
	                        this.players.find(p => p.id === match.player2.id).addMatch({
	                            id: match.id,
	                            opponent: match.player1.id
	                        });
	                    }
	                });
	            }
	            else {
	                const players = this.players.filter(p => p.active === true);
	                if (this.sorting !== 'none') {
	                    players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
	                }
	                __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_createMatches).call(this, players);
	            }
	        }
	    }
	    /**
	     * Updates the result of a match.
	     *
	     * Throws an error if no match has the ID specified.
	     *
	     * In elimination and stepladder formats, moves players to their appropriate next matches.
	     * @param id ID of the match
	     * @param player1Wins Number of wins for player one
	     * @param player2Wins Number of wins for player two
	     * @param draws Number of draws
	     */
	    enterResult(id, player1Wins, player2Wins, draws = 0) {
	        const match = this.matches.find(m => m.id === id);
	        if (match === undefined) {
	            throw `Match with ID ${id} does not exist`;
	        }
	        match.values = {
	            active: false,
	            player1: {
	                win: player1Wins,
	                loss: player2Wins,
	                draw: draws
	            },
	            player2: {
	                win: player2Wins,
	                loss: player1Wins,
	                draw: draws
	            }
	        };
	        const player1 = this.players.find(p => p.id === match.player1.id);
	        player1.updateMatch(match.id, {
	            win: player1Wins,
	            loss: player2Wins,
	            draw: draws
	        });
	        const player2 = this.players.find(p => p.id === match.player2.id);
	        player2.updateMatch(match.id, {
	            win: player2Wins,
	            loss: player1Wins,
	            draw: draws
	        });
	        if (match.path.win !== null) {
	            const winID = player1Wins > player2Wins ? match.player1.id : match.player2.id;
	            const winMatch = this.matches.find(m => m.id === match.path.win);
	            if (winMatch.player1.id === null) {
	                winMatch.values = {
	                    player1: {
	                        id: winID
	                    }
	                };
	            }
	            else {
	                winMatch.values = {
	                    player2: {
	                        id: winID
	                    }
	                };
	            }
	            if (winMatch.player1.id !== null && winMatch.player2.id !== null) {
	                winMatch.values = {
	                    active: true
	                };
	                this.players.find(p => p.id === winMatch.player1.id).addMatch({
	                    id: winMatch.id,
	                    opponent: winMatch.player2.id
	                });
	                this.players.find(p => p.id === winMatch.player2.id).addMatch({
	                    id: winMatch.id,
	                    opponent: winMatch.player1.id
	                });
	            }
	        }
	        const lossID = player1Wins > player2Wins ? match.player2.id : match.player1.id;
	        if (match.path.loss !== null) {
	            const lossMatch = this.matches.find(m => m.id === match.path.loss);
	            if (lossMatch.player1.id === null) {
	                lossMatch.values = {
	                    player1: {
	                        id: lossID
	                    }
	                };
	            }
	            else {
	                lossMatch.values = {
	                    player2: {
	                        id: lossID
	                    }
	                };
	            }
	            if (lossMatch.player1.id !== null && lossMatch.player2.id !== null) {
	                lossMatch.values = {
	                    active: true
	                };
	                this.players.find(p => p.id === lossMatch.player1.id).addMatch({
	                    id: lossMatch.id,
	                    opponent: lossMatch.player2.id
	                });
	                this.players.find(p => p.id === lossMatch.player2.id).addMatch({
	                    id: lossMatch.id,
	                    opponent: lossMatch.player1.id
	                });
	            }
	        }
	        else if ((this.status === 'stage-one' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageOne.format)) || this.status === 'stage-two') {
	            this.players.find(p => p.id === lossID).values = { active: false };
	        }
	    }
	    /**
	     * Clears the results of a match.
	     *
	     * Throws an error if no match has the ID specified or if the match is still active.
	     *
	     * In elimination and stepladder formats, it reverses the progression of players in the bracket.
	     * @param id The ID of the match
	     */
	    clearResult(id) {
	        const match = this.matches.find(m => m.id === id);
	        if (match === undefined) {
	            throw `Match with ID ${id} does not exist`;
	        }
	        match.values = {
	            active: true,
	            player1: {
	                win: 0,
	                loss: 0,
	                draw: 0
	            },
	            player2: {
	                win: 0,
	                loss: 0,
	                draw: 0
	            }
	        };
	        const player1 = this.players.find(player => player.id === match.player1.id);
	        const player2 = this.players.find(player => player.id === match.player2.id);
	        player1.values = { active: true };
	        player1.updateMatch(match.id, {
	            win: 0,
	            loss: 0,
	            draw: 0
	        });
	        player2.values = { active: true };
	        player2.updateMatch(match.id, {
	            win: 0,
	            loss: 0,
	            draw: 0
	        });
	        if (match.path.win !== null) {
	            const winMatch = this.matches.find(m => m.id === match.path.win);
	            if (winMatch.active === true) {
	                this.players.find(player => player.id === winMatch.player1.id).removeMatch(winMatch.id);
	                this.players.find(player => player.id === winMatch.player2.id).removeMatch(winMatch.id);
	            }
	            winMatch.values = {
	                active: false,
	                player1: {
	                    id: winMatch.player1.id === player1.id || winMatch.player1.id === player2.id ? null : winMatch.player1.id
	                },
	                player2: {
	                    id: winMatch.player2.id === player1.id || winMatch.player2.id === player2.id ? null : winMatch.player2.id
	                }
	            };
	        }
	        if (match.path.loss !== null) {
	            const lossMatch = this.matches.find(m => m.id === match.path.loss);
	            if (lossMatch.active === true) {
	                this.players.find(player => player.id === lossMatch.player1.id).removeMatch(lossMatch.id);
	                this.players.find(player => player.id === lossMatch.player2.id).removeMatch(lossMatch.id);
	            }
	            lossMatch.values = {
	                active: false,
	                player1: {
	                    id: lossMatch.player1.id === player1.id || lossMatch.player1.id === player2.id ? null : lossMatch.player1.id
	                },
	                player2: {
	                    id: lossMatch.player2.id === player1.id || lossMatch.player2.id === player2.id ? null : lossMatch.player2.id
	                }
	            };
	        }
	    }
	    /**
	     * Assigns a bye to a player in a specified round.
	     *
	     * Throws an error if it is not actively Swiss pairings, no player has the ID specified, if the player is already inactive, or if the player already has a match in the round.
	     * @param id The ID of the player
	     * @param round The round number
	     */
	    assignBye(id, round) {
	        if (this.status !== 'stage-one' || this.stageOne.format !== 'swiss') {
	            throw `Can only assign losses during Swiss pairings`;
	        }
	        const player = this.players.find(p => p.id === id);
	        if (player === undefined) {
	            throw `Player with ID ${id} does not exist`;
	        }
	        if (player.active === false) {
	            throw `Player is currently inactive`;
	        }
	        if (player.matches.some(match => this.matches.find(m => m.id === match.id).round === round)) {
	            throw `Player already has a match in round ${round}`;
	        }
	        let byeID;
	        do {
	            byeID = randomstring$1.generate({
	                length: 12,
	                charset: 'alphanumeric'
	            });
	        } while (this.matches.some(m => m.id === byeID));
	        const bye = new Match(byeID, round, 0);
	        bye.values = {
	            bye: true,
	            player1: {
	                id: player.id,
	                win: Math.ceil(this.scoring.bestOf / 2)
	            }
	        };
	        player.addMatch({
	            id: byeID,
	            opponent: null,
	            bye: true,
	            win: Math.ceil(this.scoring.bestOf / 2)
	        });
	        this.matches.push(bye);
	    }
	    /**
	     * Assigns a loss to a player in a specified round.
	     *
	     * Throws an error if it is not actively Swiss pairings, no player has the ID specified, or if the player is already inactive.
	     *
	     * If the player has a match in the specified round, it is removed, they are assigned a loss, and the opponent is assigned a bye.
	     * @param id The ID of the player
	     * @param round The round number
	     */
	    assignLoss(id, round) {
	        if (this.status !== 'stage-one' || this.stageOne.format !== 'swiss') {
	            throw `Can only assign losses during Swiss pairings`;
	        }
	        const player = this.players.find(p => p.id === id);
	        if (player === undefined) {
	            throw `Player with ID ${id} does not exist`;
	        }
	        if (player.active === false) {
	            throw `Player is currently inactive`;
	        }
	        if (player.matches.some(match => this.matches.find(m => m.id === match.id).round === round)) {
	            const currentMatch = this.matches.filter(match => match.round === round).find(match => match.player1.id === player.id || match.player2.id === player.id);
	            this.matches.splice(this.matches.findIndex(match => match.id === currentMatch.id), 1);
	            player.removeMatch(currentMatch.id);
	            const opponent = this.players.find(p => p.id === (currentMatch.player1.id === player.id ? currentMatch.player2.id : currentMatch.player1.id));
	            if (opponent !== undefined) {
	                opponent.removeMatch(currentMatch.id);
	                this.assignBye(opponent.id, round);
	            }
	        }
	        let lossID;
	        do {
	            lossID = randomstring$1.generate({
	                length: 12,
	                charset: 'alphanumeric'
	            });
	        } while (this.matches.some(m => m.id === lossID));
	        const loss = new Match(lossID, round, 0);
	        loss.values = {
	            player1: {
	                id: player.id,
	                loss: Math.ceil(this.scoring.bestOf / 2)
	            },
	            player2: {
	                win: Math.ceil(this.scoring.bestOf / 2)
	            }
	        };
	        player.addMatch({
	            id: lossID,
	            opponent: null,
	            loss: Math.ceil(this.scoring.bestOf / 2)
	        });
	        this.matches.push(loss);
	    }
	    /**
	     * Computes tiebreakers for all players and ranks the players by points and tiebreakers.
	     * @param activeOnly If the array contains only active players
	     * @returns A sorted array of players with scores and tiebreaker values
	     */
	    standings(activeOnly = true) {
	        let players = __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_computeScores).call(this);
	        if (activeOnly === true) {
	            players = players.filter(p => p.player.active === true);
	        }
	        players.sort((a, b) => {
	            if (a.matchPoints !== b.matchPoints) {
	                return b.matchPoints - a.matchPoints;
	            }
	            for (let i = 0; i < this.scoring.tiebreaks.length; i++) {
	                switch (this.scoring.tiebreaks[i]) {
	                    case 'median buchholz':
	                        if (a.tiebreaks.medianBuchholz !== b.tiebreaks.medianBuchholz) {
	                            return b.tiebreaks.medianBuchholz - a.tiebreaks.medianBuchholz;
	                        }
	                        else
	                            continue;
	                    case 'solkoff':
	                        if (a.tiebreaks.solkoff !== b.tiebreaks.solkoff) {
	                            return b.tiebreaks.solkoff - a.tiebreaks.solkoff;
	                        }
	                        else
	                            continue;
	                    case 'sonneborn berger':
	                        if (a.tiebreaks.sonnebornBerger !== b.tiebreaks.sonnebornBerger) {
	                            return b.tiebreaks.sonnebornBerger - a.tiebreaks.sonnebornBerger;
	                        }
	                        else
	                            continue;
	                    case 'cumulative':
	                        if (a.tiebreaks.cumulative !== b.tiebreaks.cumulative) {
	                            return b.tiebreaks.cumulative - a.tiebreaks.cumulative;
	                        }
	                        else if (a.tiebreaks.oppCumulative !== b.tiebreaks.oppCumulative) {
	                            return b.tiebreaks.oppCumulative - a.tiebreaks.oppCumulative;
	                        }
	                        else
	                            continue;
	                    case 'versus':
	                        const matchIDs = a.player.matches.filter(m => m.opponent === b.player.id).map(m => m.id);
	                        if (matchIDs.length === 0) {
	                            continue;
	                        }
	                        const pointsA = a.player.matches.filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
	                        const pointsB = b.player.matches.filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
	                        if (pointsA !== pointsB) {
	                            return pointsB - pointsA;
	                        }
	                        else
	                            continue;
	                    case 'game win percentage':
	                        if (a.tiebreaks.gameWinPct !== b.tiebreaks.gameWinPct) {
	                            return b.tiebreaks.gameWinPct - a.tiebreaks.gameWinPct;
	                        }
	                        else
	                            continue;
	                    case 'opponent game win percentage':
	                        if (a.tiebreaks.oppGameWinPct !== b.tiebreaks.oppGameWinPct) {
	                            return b.tiebreaks.oppGameWinPct - a.tiebreaks.oppGameWinPct;
	                        }
	                        else
	                            continue;
	                    case 'opponent match win percentage':
	                        if (a.tiebreaks.oppMatchWinPct !== b.tiebreaks.oppMatchWinPct) {
	                            return b.tiebreaks.oppMatchWinPct - a.tiebreaks.oppMatchWinPct;
	                        }
	                        else
	                            continue;
	                    case 'opponent opponent match win percentage':
	                        if (a.tiebreaks.oppOppMatchWinPct !== b.tiebreaks.oppOppMatchWinPct) {
	                            return b.tiebreaks.oppOppMatchWinPct - a.tiebreaks.oppOppMatchWinPct;
	                        }
	                        else
	                            continue;
	                }
	            }
	            return parseInt(b.player.id, 36) - parseInt(a.player.id, 36);
	        });
	        return players;
	    }
	    /**
	     * Ends the tournament and marks all players and matches as inactive.
	     */
	    end() {
	        this.status = 'complete';
	        this.players.forEach(player => player.active = false);
	        this.matches.forEach(match => match.active = false);
	    }
	}
	_Tournament_instances = new WeakSet(), _Tournament_createMatches = function _Tournament_createMatches(players) {
	    const format = this.status === 'stage-one' ? this.stageOne.format : this.stageTwo.format;
	    let matches = [];
	    switch (format) {
	        case 'single-elimination':
	        case 'double-elimination':
	        case 'stepladder':
	            if (format === 'single-elimination') {
	                matches = SingleElimination(players.map(p => p.id), this.round, this.stageOne.consolation, this.status === 'stage-one' ? this.sorting !== 'none' : true);
	            }
	            else if (format === 'double-elimination') {
	                matches = DoubleElimination(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
	            }
	            else if (format === 'stepladder') {
	                matches = Stepladder(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
	            }
	            const newMatches = [];
	            matches.forEach(match => {
	                let id;
	                do {
	                    id = randomstring$1.generate({
	                        length: 12,
	                        charset: 'alphanumeric'
	                    });
	                } while (this.matches.some(m => m.id === id) || newMatches.some(m => m.id === id));
	                const newMatch = new Match(id, match.round, match.match);
	                newMatch.values = {
	                    active: match.player1 !== null && match.player2 !== null,
	                    player1: {
	                        id: match.player1 === null ? null : match.player1.toString()
	                    },
	                    player2: {
	                        id: match.player2 === null ? null : match.player2.toString()
	                    }
	                };
	                newMatches.push(newMatch);
	                if (newMatch.player1.id !== null && newMatch.player2.id !== null) {
	                    this.players.find(p => p.id === match.player1.toString()).addMatch({
	                        id: id,
	                        opponent: match.player2.toString()
	                    });
	                    this.players.find(p => p.id === match.player2.toString()).addMatch({
	                        id: id,
	                        opponent: match.player1.toString()
	                    });
	                }
	            });
	            newMatches.forEach(match => {
	                const origMatch = matches.find(m => m.round === match.round && m.match === match.match);
	                const winPath = origMatch.hasOwnProperty('win') ? newMatches.find(m => m.round === origMatch.win.round && m.match === origMatch.win.match).id : null;
	                const lossPath = origMatch.hasOwnProperty('loss') ? newMatches.find(m => m.round === origMatch.loss.round && m.match === origMatch.loss.match).id : null;
	                match.values = {
	                    path: {
	                        win: winPath,
	                        loss: lossPath
	                    }
	                };
	            });
	            this.matches = [...this.matches, ...newMatches];
	            break;
	        case 'round-robin':
	        case 'double-round-robin':
	            matches = RoundRobin(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
	            matches.forEach(match => {
	                let id;
	                do {
	                    id = randomstring$1.generate({
	                        length: 12,
	                        charset: 'alphanumeric'
	                    });
	                } while (this.matches.some(m => m.id === id));
	                const newMatch = new Match(id, match.round, match.match);
	                newMatch.values = {
	                    active: match.round === this.round && match.player1 !== null && match.player2 !== null,
	                    player1: {
	                        id: match.player1 === null ? null : match.player1.toString()
	                    },
	                    player2: {
	                        id: match.player2 === null ? null : match.player2.toString()
	                    }
	                };
	                this.matches.push(newMatch);
	                if (match.round === this.round) {
	                    if (newMatch.player1.id === null || newMatch.player2.id === null) {
	                        this.players.find(p => p.id === (newMatch.player1.id === null ? newMatch.player2.id : newMatch.player1.id)).addMatch({
	                            id: id,
	                            opponent: null,
	                            bye: true,
	                            win: Math.ceil(this.scoring.bestOf / 2)
	                        });
	                        newMatch.values = {
	                            bye: true,
	                            player1: {
	                                win: Math.ceil(this.scoring.bestOf / 2)
	                            }
	                        };
	                    }
	                    else {
	                        this.players.find(p => p.id === newMatch.player1.id).addMatch({
	                            id: id,
	                            opponent: newMatch.player2.id
	                        });
	                        this.players.find(p => p.id === newMatch.player2.id).addMatch({
	                            id: id,
	                            opponent: newMatch.player1.id
	                        });
	                    }
	                }
	            });
	            if (format === 'double-round-robin') {
	                matches = RoundRobin(players.map(p => p.id), this.matches.reduce((max, curr) => Math.max(max, curr.round), 0) + 1, this.status === 'stage-one' ? this.sorting !== 'none' : true);
	                matches.forEach(match => {
	                    let id;
	                    do {
	                        id = randomstring$1.generate({
	                            length: 12,
	                            charset: 'alphanumeric'
	                        });
	                    } while (this.matches.some(m => m.id === id));
	                    const newMatch = new Match(id, match.round, match.match);
	                    newMatch.values = {
	                        active: match.round === this.round,
	                        player1: {
	                            id: match.player2 === null ? null : match.player2.toString()
	                        },
	                        player2: {
	                            id: match.player1 === null ? null : match.player1.toString()
	                        }
	                    };
	                    this.matches.push(newMatch);
	                });
	            }
	            break;
	        case 'swiss':
	            const playerArray = players.map(player => ({
	                id: player.id,
	                score: player.matches.reduce((sum, match) => match.win > match.loss ? sum + this.scoring.win : match.loss > match.win ? sum + this.scoring.loss : this.scoring.draw, 0),
	                pairedUpDown: player.matches.some(match => match.pairUpDown === true),
	                receivedBye: player.matches.some(match => match.bye === true),
	                avoid: player.matches.map(match => match.opponent).filter(opp => opp !== null),
	                colors: player.matches.map(match => match.color).filter(color => color !== null),
	                rating: player.value
	            }));
	            matches = Swiss(playerArray, this.round, this.sorting !== 'none', this.colored);
	            matches.forEach(match => {
	                let id;
	                do {
	                    id = randomstring$1.generate({
	                        length: 12,
	                        charset: 'alphanumeric'
	                    });
	                } while (this.matches.some(m => m.id === id));
	                const newMatch = new Match(id, match.round, match.match);
	                newMatch.values = {
	                    active: match.player2 !== null,
	                    player1: {
	                        id: match.player1.toString()
	                    },
	                    player2: {
	                        id: match.player2 === null ? null : match.player2.toString()
	                    }
	                };
	                this.matches.push(newMatch);
	                if (newMatch.player2.id !== null) {
	                    const player1Points = this.players.find(p => p.id === newMatch.player1.id).matches.reduce((sum, curr) => this.matches.find(m => m.id === curr.id).active === true ? sum : curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
	                    const player2Points = this.players.find(p => p.id === newMatch.player2.id).matches.reduce((sum, curr) => this.matches.find(m => m.id === curr.id).active === true ? sum : curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
	                    this.players.find(p => p.id === match.player1.toString()).addMatch({
	                        id: id,
	                        opponent: match.player2.toString(),
	                        pairUpDown: player1Points !== player2Points,
	                        color: this.colored ? 'w' : null
	                    });
	                    this.players.find(p => p.id === match.player2.toString()).addMatch({
	                        id: id,
	                        opponent: match.player1.toString(),
	                        pairUpDown: player1Points !== player2Points,
	                        color: this.colored ? 'b' : null
	                    });
	                }
	                else {
	                    this.players.find(p => p.id === match.player1.toString()).addMatch({
	                        id: id,
	                        opponent: null,
	                        bye: true,
	                        win: Math.ceil(this.scoring.bestOf / 2)
	                    });
	                    newMatch.values = {
	                        bye: true,
	                        player1: {
	                            win: Math.ceil(this.scoring.bestOf / 2)
	                        }
	                    };
	                }
	            });
	            break;
	    }
	}, _Tournament_computeScores = function _Tournament_computeScores() {
	    const playerScores = this.players.map(player => ({
	        player: player,
	        gamePoints: 0,
	        games: 0,
	        matchPoints: 0,
	        matches: 0,
	        tiebreaks: {
	            medianBuchholz: 0,
	            solkoff: 0,
	            sonnebornBerger: 0,
	            cumulative: 0,
	            oppCumulative: 0,
	            matchWinPct: 0,
	            oppMatchWinPct: 0,
	            oppOppMatchWinPct: 0,
	            gameWinPct: 0,
	            oppGameWinPct: 0
	        }
	    }));
	    for (let i = 0; i < playerScores.length; i++) {
	        const player = playerScores[i];
	        if (player.player.matches.length === 0) {
	            continue;
	        }
	        player.player.matches.sort((a, b) => {
	            const matchA = this.matches.find(m => m.id === a.id);
	            const matchB = this.matches.find(m => m.id === b.id);
	            return matchA.round - matchB.round;
	        });
	        player.player.matches.filter(match => this.matches.find(m => m.id === match.id && m.active === false)).forEach(match => {
	            player.gamePoints += (this.scoring.win * match.win) + (this.scoring.loss * match.loss) + (this.scoring.draw * match.draw);
	            player.games += match.win + match.loss + match.draw;
	            player.matchPoints += match.win > match.loss ? this.scoring.win : match.loss > match.win ? this.scoring.loss : this.scoring.draw;
	            player.tiebreaks.cumulative += player.matchPoints;
	            player.matches++;
	        });
	        player.tiebreaks.gameWinPct = player.games === 0 ? 0 : player.gamePoints / (player.games * this.scoring.win);
	        player.tiebreaks.matchWinPct = player.matches === 0 ? 0 : player.matchPoints / (player.matches * this.scoring.win);
	    }
	    for (let i = 0; i < playerScores.length; i++) {
	        const player = playerScores[i];
	        const opponents = playerScores.filter(p => player.player.matches.some(match => match.opponent === p.player.id));
	        if (opponents.length === 0) {
	            continue;
	        }
	        player.tiebreaks.oppMatchWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.matchWinPct, 0) / opponents.length;
	        player.tiebreaks.oppGameWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.gameWinPct, 0) / opponents.length;
	        const oppMatchPoints = opponents.map(opp => opp.matchPoints);
	        player.tiebreaks.solkoff = oppMatchPoints.reduce((sum, curr) => sum + curr, 0);
	        if (oppMatchPoints.length > 2) {
	            const max = oppMatchPoints.reduce((max, curr) => Math.max(max, curr), 0);
	            const min = oppMatchPoints.reduce((min, curr) => Math.min(min, curr), max);
	            oppMatchPoints.splice(oppMatchPoints.indexOf(max), 1);
	            oppMatchPoints.splice(oppMatchPoints.indexOf(min), 1);
	            player.tiebreaks.medianBuchholz = oppMatchPoints.reduce((sum, curr) => sum + curr, 0);
	        }
	        player.tiebreaks.sonnebornBerger = opponents.reduce((sum, opp) => {
	            const match = player.player.matches.find(m => m.opponent === opp.player.id);
	            if (this.matches.find(m => m.id === match.id).active === true) {
	                return sum;
	            }
	            return match.win > match.loss ? sum + opp.matchPoints : sum + (0.5 * opp.matchPoints);
	        }, 0);
	        player.tiebreaks.oppCumulative = opponents.reduce((sum, opp) => sum + opp.tiebreaks.cumulative, 0);
	    }
	    for (let i = 0; i < playerScores.length; i++) {
	        const player = playerScores[i];
	        const opponents = playerScores.filter(p => player.player.matches.some(match => match.opponent === p.player.id));
	        if (opponents.length === 0) {
	            continue;
	        }
	        player.tiebreaks.oppOppMatchWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.oppMatchWinPct, 0) / opponents.length;
	    }
	    return playerScores;
	};

	/**
	 * Class representing a tournament manager.
	 */
	class Manager {
	    /** Create a tournament manager. */
	    constructor() {
	        this.tournaments = [];
	    }
	    /**
	     * Create a new tournament.
	     *
	     * Throws an error if ID is specified and already exists.
	     * @param name Name of the tournament
	     * @param settings Settings of the tournament
	     * @param id ID of the tournament (randomly assigned if omitted)
	     * @returns The newly created tournament
	     */
	    createTournament(name, settings = {}, id = undefined) {
	        let ID = id;
	        if (ID === undefined) {
	            do {
	                ID = randomstring$1.generate({
	                    length: 12,
	                    charset: 'alphanumeric'
	                });
	            } while (this.tournaments.some(t => t.id === ID));
	        }
	        else {
	            if (this.tournaments.some(t => t.id === ID)) {
	                throw `Tournament with ID ${ID} already exists`;
	            }
	        }
	        const tournament = new Tournament(ID, name);
	        tournament.settings = settings;
	        this.tournaments.push(tournament);
	        return tournament;
	    }
	    /**
	     * Reload an object representing a tournament.
	     * @param tourney Plain object of a tournament
	     * @returns The newly reloaded tournament
	     */
	    reloadTournament(tourney) {
	        const tournament = new Tournament(tourney.id, tourney.name);
	        tournament.settings = {
	            round: tourney.round,
	            sorting: tourney.sorting,
	            colored: tourney.colored,
	            scoring: tourney.scoring,
	            stageOne: tourney.stageOne,
	            stageTwo: tourney.stageTwo
	        };
	        tourney.players.forEach(player => {
	            const newPlayer = tournament.createPlayer(player.name, player.id);
	            newPlayer.values = {
	                active: player.active,
	                value: player.value,
	                matches: player.matches
	            };
	        });
	        tourney.matches.forEach(match => {
	            const newMatch = new Match(match.id, match.round, match.match);
	            newMatch.values = {
	                active: match.active,
	                bye: match.bye,
	                player1: match.player1,
	                player2: match.player2,
	                path: match.path
	            };
	            tournament.matches.push(newMatch);
	        });
	        tournament.settings = {
	            status: tourney.status
	        };
	        this.tournaments.push(tournament);
	        return tournament;
	    }
	    /**
	     * Remove a tournament from the manager.
	     *
	     * Throws an error if no tournament has the specified ID.
	     * @param id ID of the tournament to be removed
	     * @returns The removed tournament
	     */
	    removeTournament(id) {
	        const tournament = this.tournaments.find(t => t.id === id);
	        if (tournament === undefined) {
	            throw `No tournament with ID ${id} exists`;
	        }
	        tournament.end();
	        this.tournaments.splice(this.tournaments.findIndex(t => t.id === tournament.id), 1);
	        return tournament;
	    }
	}

	return Manager;

}));
