var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod3) => function __require() {
  return mod3 || (0, cb[__getOwnPropNames(cb)[0]])((mod3 = { exports: {} }).exports, mod3), mod3.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod3, isNodeMode, target) => (target = mod3 != null ? __create(__getProtoOf(mod3)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod3 || !mod3.__esModule ? __defProp(target, "default", { value: mod3, enumerable: true }) : target,
  mod3
));

// node_modules/big-integer/BigInteger.js
var require_BigInteger = __commonJS({
  "node_modules/big-integer/BigInteger.js"(exports, module) {
    var bigInt2 = (function(undefined2) {
      "use strict";
      var BASE = 1e7, LOG_BASE = 7, MAX_INT = 9007199254740992, MAX_INT_ARR = smallToArray(MAX_INT), DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
      var supportsNativeBigInt = typeof BigInt === "function";
      function Integer(v, radix, alphabet, caseSensitive) {
        if (typeof v === "undefined") return Integer[0];
        if (typeof radix !== "undefined") return +radix === 10 && !alphabet ? parseValue(v) : parseBase(v, radix, alphabet, caseSensitive);
        return parseValue(v);
      }
      function BigInteger(value, sign2) {
        this.value = value;
        this.sign = sign2;
        this.isSmall = false;
      }
      BigInteger.prototype = Object.create(Integer.prototype);
      function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true;
      }
      SmallInteger.prototype = Object.create(Integer.prototype);
      function NativeBigInt(value) {
        this.value = value;
      }
      NativeBigInt.prototype = Object.create(Integer.prototype);
      function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT;
      }
      function smallToArray(n) {
        if (n < 1e7)
          return [n];
        if (n < 1e14)
          return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
      }
      function arrayToSmall(arr) {
        trim2(arr);
        var length5 = arr.length;
        if (length5 < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
          switch (length5) {
            case 0:
              return 0;
            case 1:
              return arr[0];
            case 2:
              return arr[0] + arr[1] * BASE;
            default:
              return arr[0] + (arr[1] + arr[2] * BASE) * BASE;
          }
        }
        return arr;
      }
      function trim2(v) {
        var i2 = v.length;
        while (v[--i2] === 0) ;
        v.length = i2 + 1;
      }
      function createArray(length5) {
        var x = new Array(length5);
        var i2 = -1;
        while (++i2 < length5) {
          x[i2] = 0;
        }
        return x;
      }
      function truncate(n) {
        if (n > 0) return Math.floor(n);
        return Math.ceil(n);
      }
      function add6(a, b) {
        var l_a = a.length, l_b = b.length, r = new Array(l_a), carry = 0, base = BASE, sum2, i2;
        for (i2 = 0; i2 < l_b; i2++) {
          sum2 = a[i2] + b[i2] + carry;
          carry = sum2 >= base ? 1 : 0;
          r[i2] = sum2 - carry * base;
        }
        while (i2 < l_a) {
          sum2 = a[i2] + carry;
          carry = sum2 === base ? 1 : 0;
          r[i2++] = sum2 - carry * base;
        }
        if (carry > 0) r.push(carry);
        return r;
      }
      function addAny(a, b) {
        if (a.length >= b.length) return add6(a, b);
        return add6(b, a);
      }
      function addSmall(a, carry) {
        var l = a.length, r = new Array(l), base = BASE, sum2, i2;
        for (i2 = 0; i2 < l; i2++) {
          sum2 = a[i2] - base + carry;
          carry = Math.floor(sum2 / base);
          r[i2] = sum2 - carry * base;
          carry += 1;
        }
        while (carry > 0) {
          r[i2++] = carry % base;
          carry = Math.floor(carry / base);
        }
        return r;
      }
      BigInteger.prototype.add = function(v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
          return this.subtract(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
          return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
        }
        return new BigInteger(addAny(a, b), this.sign);
      };
      BigInteger.prototype.plus = BigInteger.prototype.add;
      SmallInteger.prototype.add = function(v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
          return this.subtract(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
          if (isPrecise(a + b)) return new SmallInteger(a + b);
          b = smallToArray(Math.abs(b));
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
      };
      SmallInteger.prototype.plus = SmallInteger.prototype.add;
      NativeBigInt.prototype.add = function(v) {
        return new NativeBigInt(this.value + parseValue(v).value);
      };
      NativeBigInt.prototype.plus = NativeBigInt.prototype.add;
      function subtract(a, b) {
        var a_l = a.length, b_l = b.length, r = new Array(a_l), borrow = 0, base = BASE, i2, difference2;
        for (i2 = 0; i2 < b_l; i2++) {
          difference2 = a[i2] - borrow - b[i2];
          if (difference2 < 0) {
            difference2 += base;
            borrow = 1;
          } else borrow = 0;
          r[i2] = difference2;
        }
        for (i2 = b_l; i2 < a_l; i2++) {
          difference2 = a[i2] - borrow;
          if (difference2 < 0) difference2 += base;
          else {
            r[i2++] = difference2;
            break;
          }
          r[i2] = difference2;
        }
        for (; i2 < a_l; i2++) {
          r[i2] = a[i2];
        }
        trim2(r);
        return r;
      }
      function subtractAny(a, b, sign2) {
        var value;
        if (compareAbs(a, b) >= 0) {
          value = subtract(a, b);
        } else {
          value = subtract(b, a);
          sign2 = !sign2;
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
          if (sign2) value = -value;
          return new SmallInteger(value);
        }
        return new BigInteger(value, sign2);
      }
      function subtractSmall(a, b, sign2) {
        var l = a.length, r = new Array(l), carry = -b, base = BASE, i2, difference2;
        for (i2 = 0; i2 < l; i2++) {
          difference2 = a[i2] + carry;
          carry = Math.floor(difference2 / base);
          difference2 %= base;
          r[i2] = difference2 < 0 ? difference2 + base : difference2;
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
          if (sign2) r = -r;
          return new SmallInteger(r);
        }
        return new BigInteger(r, sign2);
      }
      BigInteger.prototype.subtract = function(v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
          return this.add(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall)
          return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign);
      };
      BigInteger.prototype.minus = BigInteger.prototype.subtract;
      SmallInteger.prototype.subtract = function(v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
          return this.add(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
          return new SmallInteger(a - b);
        }
        return subtractSmall(b, Math.abs(a), a >= 0);
      };
      SmallInteger.prototype.minus = SmallInteger.prototype.subtract;
      NativeBigInt.prototype.subtract = function(v) {
        return new NativeBigInt(this.value - parseValue(v).value);
      };
      NativeBigInt.prototype.minus = NativeBigInt.prototype.subtract;
      BigInteger.prototype.negate = function() {
        return new BigInteger(this.value, !this.sign);
      };
      SmallInteger.prototype.negate = function() {
        var sign2 = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign2;
        return small;
      };
      NativeBigInt.prototype.negate = function() {
        return new NativeBigInt(-this.value);
      };
      BigInteger.prototype.abs = function() {
        return new BigInteger(this.value, false);
      };
      SmallInteger.prototype.abs = function() {
        return new SmallInteger(Math.abs(this.value));
      };
      NativeBigInt.prototype.abs = function() {
        return new NativeBigInt(this.value >= 0 ? this.value : -this.value);
      };
      function multiplyLong(a, b) {
        var a_l = a.length, b_l = b.length, l = a_l + b_l, r = createArray(l), base = BASE, product2, carry, i2, a_i, b_j;
        for (i2 = 0; i2 < a_l; ++i2) {
          a_i = a[i2];
          for (var j = 0; j < b_l; ++j) {
            b_j = b[j];
            product2 = a_i * b_j + r[i2 + j];
            carry = Math.floor(product2 / base);
            r[i2 + j] = product2 - carry * base;
            r[i2 + j + 1] += carry;
          }
        }
        trim2(r);
        return r;
      }
      function multiplySmall(a, b) {
        var l = a.length, r = new Array(l), base = BASE, carry = 0, product2, i2;
        for (i2 = 0; i2 < l; i2++) {
          product2 = a[i2] * b + carry;
          carry = Math.floor(product2 / base);
          r[i2] = product2 - carry * base;
        }
        while (carry > 0) {
          r[i2++] = carry % base;
          carry = Math.floor(carry / base);
        }
        return r;
      }
      function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0) r.push(0);
        return r.concat(x);
      }
      function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);
        if (n <= 30) return multiplyLong(x, y);
        n = Math.ceil(n / 2);
        var b = x.slice(n), a = x.slice(0, n), d = y.slice(n), c = y.slice(0, n);
        var ac = multiplyKaratsuba(a, c), bd = multiplyKaratsuba(b, d), abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));
        var product2 = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim2(product2);
        return product2;
      }
      function useKaratsuba(l1, l2) {
        return -0.012 * l1 - 0.012 * l2 + 15e-6 * l1 * l2 > 0;
      }
      BigInteger.prototype.multiply = function(v) {
        var n = parseValue(v), a = this.value, b = n.value, sign2 = this.sign !== n.sign, abs4;
        if (n.isSmall) {
          if (b === 0) return Integer[0];
          if (b === 1) return this;
          if (b === -1) return this.negate();
          abs4 = Math.abs(b);
          if (abs4 < BASE) {
            return new BigInteger(multiplySmall(a, abs4), sign2);
          }
          b = smallToArray(abs4);
        }
        if (useKaratsuba(a.length, b.length))
          return new BigInteger(multiplyKaratsuba(a, b), sign2);
        return new BigInteger(multiplyLong(a, b), sign2);
      };
      BigInteger.prototype.times = BigInteger.prototype.multiply;
      function multiplySmallAndArray(a, b, sign2) {
        if (a < BASE) {
          return new BigInteger(multiplySmall(b, a), sign2);
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign2);
      }
      SmallInteger.prototype._multiplyBySmall = function(a) {
        if (isPrecise(a.value * this.value)) {
          return new SmallInteger(a.value * this.value);
        }
        return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
      };
      BigInteger.prototype._multiplyBySmall = function(a) {
        if (a.value === 0) return Integer[0];
        if (a.value === 1) return this;
        if (a.value === -1) return this.negate();
        return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
      };
      SmallInteger.prototype.multiply = function(v) {
        return parseValue(v)._multiplyBySmall(this);
      };
      SmallInteger.prototype.times = SmallInteger.prototype.multiply;
      NativeBigInt.prototype.multiply = function(v) {
        return new NativeBigInt(this.value * parseValue(v).value);
      };
      NativeBigInt.prototype.times = NativeBigInt.prototype.multiply;
      function square(a) {
        var l = a.length, r = createArray(l + l), base = BASE, product2, carry, i2, a_i, a_j;
        for (i2 = 0; i2 < l; i2++) {
          a_i = a[i2];
          carry = 0 - a_i * a_i;
          for (var j = i2; j < l; j++) {
            a_j = a[j];
            product2 = 2 * (a_i * a_j) + r[i2 + j] + carry;
            carry = Math.floor(product2 / base);
            r[i2 + j] = product2 - carry * base;
          }
          r[i2 + l] = carry;
        }
        trim2(r);
        return r;
      }
      BigInteger.prototype.square = function() {
        return new BigInteger(square(this.value), false);
      };
      SmallInteger.prototype.square = function() {
        var value = this.value * this.value;
        if (isPrecise(value)) return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
      };
      NativeBigInt.prototype.square = function(v) {
        return new NativeBigInt(this.value * this.value);
      };
      function divMod1(a, b) {
        var a_l = a.length, b_l = b.length, base = BASE, result = createArray(b.length), divisorMostSignificantDigit = b[b_l - 1], lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)), remainder2 = multiplySmall(a, lambda), divisor = multiplySmall(b, lambda), quotientDigit, shift, carry, borrow, i2, l, q;
        if (remainder2.length <= a_l) remainder2.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
          quotientDigit = base - 1;
          if (remainder2[shift + b_l] !== divisorMostSignificantDigit) {
            quotientDigit = Math.floor((remainder2[shift + b_l] * base + remainder2[shift + b_l - 1]) / divisorMostSignificantDigit);
          }
          carry = 0;
          borrow = 0;
          l = divisor.length;
          for (i2 = 0; i2 < l; i2++) {
            carry += quotientDigit * divisor[i2];
            q = Math.floor(carry / base);
            borrow += remainder2[shift + i2] - (carry - q * base);
            carry = q;
            if (borrow < 0) {
              remainder2[shift + i2] = borrow + base;
              borrow = -1;
            } else {
              remainder2[shift + i2] = borrow;
              borrow = 0;
            }
          }
          while (borrow !== 0) {
            quotientDigit -= 1;
            carry = 0;
            for (i2 = 0; i2 < l; i2++) {
              carry += remainder2[shift + i2] - base + divisor[i2];
              if (carry < 0) {
                remainder2[shift + i2] = carry + base;
                carry = 0;
              } else {
                remainder2[shift + i2] = carry;
                carry = 1;
              }
            }
            borrow += carry;
          }
          result[shift] = quotientDigit;
        }
        remainder2 = divModSmall(remainder2, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder2)];
      }
      function divMod2(a, b) {
        var a_l = a.length, b_l = b.length, result = [], part = [], base = BASE, guess, xlen, highx, highy, check;
        while (a_l) {
          part.unshift(a[--a_l]);
          trim2(part);
          if (compareAbs(part, b) < 0) {
            result.push(0);
            continue;
          }
          xlen = part.length;
          highx = part[xlen - 1] * base + part[xlen - 2];
          highy = b[b_l - 1] * base + b[b_l - 2];
          if (xlen > b_l) {
            highx = (highx + 1) * base;
          }
          guess = Math.ceil(highx / highy);
          do {
            check = multiplySmall(b, guess);
            if (compareAbs(check, part) <= 0) break;
            guess--;
          } while (guess);
          result.push(guess);
          part = subtract(part, check);
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)];
      }
      function divModSmall(value, lambda) {
        var length5 = value.length, quotient = createArray(length5), base = BASE, i2, q, remainder2, divisor;
        remainder2 = 0;
        for (i2 = length5 - 1; i2 >= 0; --i2) {
          divisor = remainder2 * base + value[i2];
          q = truncate(divisor / lambda);
          remainder2 = divisor - q * lambda;
          quotient[i2] = q | 0;
        }
        return [quotient, remainder2 | 0];
      }
      function divModAny(self, v) {
        var value, n = parseValue(v);
        if (supportsNativeBigInt) {
          return [new NativeBigInt(self.value / n.value), new NativeBigInt(self.value % n.value)];
        }
        var a = self.value, b = n.value;
        var quotient;
        if (b === 0) throw new Error("Cannot divide by zero");
        if (self.isSmall) {
          if (n.isSmall) {
            return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
          }
          return [Integer[0], self];
        }
        if (n.isSmall) {
          if (b === 1) return [self, Integer[0]];
          if (b == -1) return [self.negate(), Integer[0]];
          var abs4 = Math.abs(b);
          if (abs4 < BASE) {
            value = divModSmall(a, abs4);
            quotient = arrayToSmall(value[0]);
            var remainder2 = value[1];
            if (self.sign) remainder2 = -remainder2;
            if (typeof quotient === "number") {
              if (self.sign !== n.sign) quotient = -quotient;
              return [new SmallInteger(quotient), new SmallInteger(remainder2)];
            }
            return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder2)];
          }
          b = smallToArray(abs4);
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1) return [Integer[0], self];
        if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];
        if (a.length + b.length <= 200)
          value = divMod1(a, b);
        else value = divMod2(a, b);
        quotient = value[0];
        var qSign = self.sign !== n.sign, mod3 = value[1], mSign = self.sign;
        if (typeof quotient === "number") {
          if (qSign) quotient = -quotient;
          quotient = new SmallInteger(quotient);
        } else quotient = new BigInteger(quotient, qSign);
        if (typeof mod3 === "number") {
          if (mSign) mod3 = -mod3;
          mod3 = new SmallInteger(mod3);
        } else mod3 = new BigInteger(mod3, mSign);
        return [quotient, mod3];
      }
      BigInteger.prototype.divmod = function(v) {
        var result = divModAny(this, v);
        return {
          quotient: result[0],
          remainder: result[1]
        };
      };
      NativeBigInt.prototype.divmod = SmallInteger.prototype.divmod = BigInteger.prototype.divmod;
      BigInteger.prototype.divide = function(v) {
        return divModAny(this, v)[0];
      };
      NativeBigInt.prototype.over = NativeBigInt.prototype.divide = function(v) {
        return new NativeBigInt(this.value / parseValue(v).value);
      };
      SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;
      BigInteger.prototype.mod = function(v) {
        return divModAny(this, v)[1];
      };
      NativeBigInt.prototype.mod = NativeBigInt.prototype.remainder = function(v) {
        return new NativeBigInt(this.value % parseValue(v).value);
      };
      SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;
      BigInteger.prototype.pow = function(v) {
        var n = parseValue(v), a = this.value, b = n.value, value, x, y;
        if (b === 0) return Integer[1];
        if (a === 0) return Integer[0];
        if (a === 1) return Integer[1];
        if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
          return Integer[0];
        }
        if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
          if (isPrecise(value = Math.pow(a, b)))
            return new SmallInteger(truncate(value));
        }
        x = this;
        y = Integer[1];
        while (true) {
          if (b & true) {
            y = y.times(x);
            --b;
          }
          if (b === 0) break;
          b /= 2;
          x = x.square();
        }
        return y;
      };
      SmallInteger.prototype.pow = BigInteger.prototype.pow;
      NativeBigInt.prototype.pow = function(v) {
        var n = parseValue(v);
        var a = this.value, b = n.value;
        var _0 = BigInt(0), _1 = BigInt(1), _2 = BigInt(2);
        if (b === _0) return Integer[1];
        if (a === _0) return Integer[0];
        if (a === _1) return Integer[1];
        if (a === BigInt(-1)) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.isNegative()) return new NativeBigInt(_0);
        var x = this;
        var y = Integer[1];
        while (true) {
          if ((b & _1) === _1) {
            y = y.times(x);
            --b;
          }
          if (b === _0) break;
          b /= _2;
          x = x.square();
        }
        return y;
      };
      BigInteger.prototype.modPow = function(exp2, mod3) {
        exp2 = parseValue(exp2);
        mod3 = parseValue(mod3);
        if (mod3.isZero()) throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1], base = this.mod(mod3);
        if (exp2.isNegative()) {
          exp2 = exp2.multiply(Integer[-1]);
          base = base.modInv(mod3);
        }
        while (exp2.isPositive()) {
          if (base.isZero()) return Integer[0];
          if (exp2.isOdd()) r = r.multiply(base).mod(mod3);
          exp2 = exp2.divide(2);
          base = base.square().mod(mod3);
        }
        return r;
      };
      NativeBigInt.prototype.modPow = SmallInteger.prototype.modPow = BigInteger.prototype.modPow;
      function compareAbs(a, b) {
        if (a.length !== b.length) {
          return a.length > b.length ? 1 : -1;
        }
        for (var i2 = a.length - 1; i2 >= 0; i2--) {
          if (a[i2] !== b[i2]) return a[i2] > b[i2] ? 1 : -1;
        }
        return 0;
      }
      BigInteger.prototype.compareAbs = function(v) {
        var n = parseValue(v), a = this.value, b = n.value;
        if (n.isSmall) return 1;
        return compareAbs(a, b);
      };
      SmallInteger.prototype.compareAbs = function(v) {
        var n = parseValue(v), a = Math.abs(this.value), b = n.value;
        if (n.isSmall) {
          b = Math.abs(b);
          return a === b ? 0 : a > b ? 1 : -1;
        }
        return -1;
      };
      NativeBigInt.prototype.compareAbs = function(v) {
        var a = this.value;
        var b = parseValue(v).value;
        a = a >= 0 ? a : -a;
        b = b >= 0 ? b : -b;
        return a === b ? 0 : a > b ? 1 : -1;
      };
      BigInteger.prototype.compare = function(v) {
        if (v === Infinity) {
          return -1;
        }
        if (v === -Infinity) {
          return 1;
        }
        var n = parseValue(v), a = this.value, b = n.value;
        if (this.sign !== n.sign) {
          return n.sign ? 1 : -1;
        }
        if (n.isSmall) {
          return this.sign ? -1 : 1;
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1);
      };
      BigInteger.prototype.compareTo = BigInteger.prototype.compare;
      SmallInteger.prototype.compare = function(v) {
        if (v === Infinity) {
          return -1;
        }
        if (v === -Infinity) {
          return 1;
        }
        var n = parseValue(v), a = this.value, b = n.value;
        if (n.isSmall) {
          return a == b ? 0 : a > b ? 1 : -1;
        }
        if (a < 0 !== n.sign) {
          return a < 0 ? -1 : 1;
        }
        return a < 0 ? 1 : -1;
      };
      SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;
      NativeBigInt.prototype.compare = function(v) {
        if (v === Infinity) {
          return -1;
        }
        if (v === -Infinity) {
          return 1;
        }
        var a = this.value;
        var b = parseValue(v).value;
        return a === b ? 0 : a > b ? 1 : -1;
      };
      NativeBigInt.prototype.compareTo = NativeBigInt.prototype.compare;
      BigInteger.prototype.equals = function(v) {
        return this.compare(v) === 0;
      };
      NativeBigInt.prototype.eq = NativeBigInt.prototype.equals = SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;
      BigInteger.prototype.notEquals = function(v) {
        return this.compare(v) !== 0;
      };
      NativeBigInt.prototype.neq = NativeBigInt.prototype.notEquals = SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;
      BigInteger.prototype.greater = function(v) {
        return this.compare(v) > 0;
      };
      NativeBigInt.prototype.gt = NativeBigInt.prototype.greater = SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;
      BigInteger.prototype.lesser = function(v) {
        return this.compare(v) < 0;
      };
      NativeBigInt.prototype.lt = NativeBigInt.prototype.lesser = SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;
      BigInteger.prototype.greaterOrEquals = function(v) {
        return this.compare(v) >= 0;
      };
      NativeBigInt.prototype.geq = NativeBigInt.prototype.greaterOrEquals = SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;
      BigInteger.prototype.lesserOrEquals = function(v) {
        return this.compare(v) <= 0;
      };
      NativeBigInt.prototype.leq = NativeBigInt.prototype.lesserOrEquals = SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;
      BigInteger.prototype.isEven = function() {
        return (this.value[0] & 1) === 0;
      };
      SmallInteger.prototype.isEven = function() {
        return (this.value & 1) === 0;
      };
      NativeBigInt.prototype.isEven = function() {
        return (this.value & BigInt(1)) === BigInt(0);
      };
      BigInteger.prototype.isOdd = function() {
        return (this.value[0] & 1) === 1;
      };
      SmallInteger.prototype.isOdd = function() {
        return (this.value & 1) === 1;
      };
      NativeBigInt.prototype.isOdd = function() {
        return (this.value & BigInt(1)) === BigInt(1);
      };
      BigInteger.prototype.isPositive = function() {
        return !this.sign;
      };
      SmallInteger.prototype.isPositive = function() {
        return this.value > 0;
      };
      NativeBigInt.prototype.isPositive = SmallInteger.prototype.isPositive;
      BigInteger.prototype.isNegative = function() {
        return this.sign;
      };
      SmallInteger.prototype.isNegative = function() {
        return this.value < 0;
      };
      NativeBigInt.prototype.isNegative = SmallInteger.prototype.isNegative;
      BigInteger.prototype.isUnit = function() {
        return false;
      };
      SmallInteger.prototype.isUnit = function() {
        return Math.abs(this.value) === 1;
      };
      NativeBigInt.prototype.isUnit = function() {
        return this.abs().value === BigInt(1);
      };
      BigInteger.prototype.isZero = function() {
        return false;
      };
      SmallInteger.prototype.isZero = function() {
        return this.value === 0;
      };
      NativeBigInt.prototype.isZero = function() {
        return this.value === BigInt(0);
      };
      BigInteger.prototype.isDivisibleBy = function(v) {
        var n = parseValue(v);
        if (n.isZero()) return false;
        if (n.isUnit()) return true;
        if (n.compareAbs(2) === 0) return this.isEven();
        return this.mod(n).isZero();
      };
      NativeBigInt.prototype.isDivisibleBy = SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;
      function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(49)) return true;
      }
      function millerRabinTest(n, a) {
        var nPrev = n.prev(), b = nPrev, r = 0, d, t, i2, x;
        while (b.isEven()) b = b.divide(2), r++;
        next: for (i2 = 0; i2 < a.length; i2++) {
          if (n.lesser(a[i2])) continue;
          x = bigInt2(a[i2]).modPow(b, n);
          if (x.isUnit() || x.equals(nPrev)) continue;
          for (d = r - 1; d != 0; d--) {
            x = x.square().mod(n);
            if (x.isUnit()) return false;
            if (x.equals(nPrev)) continue next;
          }
          return false;
        }
        return true;
      }
      BigInteger.prototype.isPrime = function(strict) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined2) return isPrime;
        var n = this.abs();
        var bits = n.bitLength();
        if (bits <= 64)
          return millerRabinTest(n, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
        var logN = Math.log(2) * bits.toJSNumber();
        var t = Math.ceil(strict === true ? 2 * Math.pow(logN, 2) : logN);
        for (var a = [], i2 = 0; i2 < t; i2++) {
          a.push(bigInt2(i2 + 2));
        }
        return millerRabinTest(n, a);
      };
      NativeBigInt.prototype.isPrime = SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;
      BigInteger.prototype.isProbablePrime = function(iterations, rng) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined2) return isPrime;
        var n = this.abs();
        var t = iterations === undefined2 ? 5 : iterations;
        for (var a = [], i2 = 0; i2 < t; i2++) {
          a.push(bigInt2.randBetween(2, n.minus(2), rng));
        }
        return millerRabinTest(n, a);
      };
      NativeBigInt.prototype.isProbablePrime = SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;
      BigInteger.prototype.modInv = function(n) {
        var t = bigInt2.zero, newT = bigInt2.one, r = parseValue(n), newR = this.abs(), q, lastT, lastR;
        while (!newR.isZero()) {
          q = r.divide(newR);
          lastT = t;
          lastR = r;
          t = newT;
          r = newR;
          newT = lastT.subtract(q.multiply(newT));
          newR = lastR.subtract(q.multiply(newR));
        }
        if (!r.isUnit()) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
          t = t.add(n);
        }
        if (this.isNegative()) {
          return t.negate();
        }
        return t;
      };
      NativeBigInt.prototype.modInv = SmallInteger.prototype.modInv = BigInteger.prototype.modInv;
      BigInteger.prototype.next = function() {
        var value = this.value;
        if (this.sign) {
          return subtractSmall(value, 1, this.sign);
        }
        return new BigInteger(addSmall(value, 1), this.sign);
      };
      SmallInteger.prototype.next = function() {
        var value = this.value;
        if (value + 1 < MAX_INT) return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false);
      };
      NativeBigInt.prototype.next = function() {
        return new NativeBigInt(this.value + BigInt(1));
      };
      BigInteger.prototype.prev = function() {
        var value = this.value;
        if (this.sign) {
          return new BigInteger(addSmall(value, 1), true);
        }
        return subtractSmall(value, 1, this.sign);
      };
      SmallInteger.prototype.prev = function() {
        var value = this.value;
        if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true);
      };
      NativeBigInt.prototype.prev = function() {
        return new NativeBigInt(this.value - BigInt(1));
      };
      var powersOfTwo = [1];
      while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
      var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];
      function shift_isSmall(n) {
        return Math.abs(n) <= BASE;
      }
      BigInteger.prototype.shiftLeft = function(v) {
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
          throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        if (result.isZero()) return result;
        while (n >= powers2Length) {
          result = result.multiply(highestPower2);
          n -= powers2Length - 1;
        }
        return result.multiply(powersOfTwo[n]);
      };
      NativeBigInt.prototype.shiftLeft = SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;
      BigInteger.prototype.shiftRight = function(v) {
        var remQuo;
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
          throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
          if (result.isZero() || result.isNegative() && result.isUnit()) return result;
          remQuo = divModAny(result, highestPower2);
          result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
          n -= powers2Length - 1;
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
      };
      NativeBigInt.prototype.shiftRight = SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;
      function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x, yRem = ySign ? y.not() : y;
        var xDigit = 0, yDigit = 0;
        var xDivMod = null, yDivMod = null;
        var result = [];
        while (!xRem.isZero() || !yRem.isZero()) {
          xDivMod = divModAny(xRem, highestPower2);
          xDigit = xDivMod[1].toJSNumber();
          if (xSign) {
            xDigit = highestPower2 - 1 - xDigit;
          }
          yDivMod = divModAny(yRem, highestPower2);
          yDigit = yDivMod[1].toJSNumber();
          if (ySign) {
            yDigit = highestPower2 - 1 - yDigit;
          }
          xRem = xDivMod[0];
          yRem = yDivMod[0];
          result.push(fn(xDigit, yDigit));
        }
        var sum2 = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt2(-1) : bigInt2(0);
        for (var i2 = result.length - 1; i2 >= 0; i2 -= 1) {
          sum2 = sum2.multiply(highestPower2).add(bigInt2(result[i2]));
        }
        return sum2;
      }
      BigInteger.prototype.not = function() {
        return this.negate().prev();
      };
      NativeBigInt.prototype.not = SmallInteger.prototype.not = BigInteger.prototype.not;
      BigInteger.prototype.and = function(n) {
        return bitwise(this, n, function(a, b) {
          return a & b;
        });
      };
      NativeBigInt.prototype.and = SmallInteger.prototype.and = BigInteger.prototype.and;
      BigInteger.prototype.or = function(n) {
        return bitwise(this, n, function(a, b) {
          return a | b;
        });
      };
      NativeBigInt.prototype.or = SmallInteger.prototype.or = BigInteger.prototype.or;
      BigInteger.prototype.xor = function(n) {
        return bitwise(this, n, function(a, b) {
          return a ^ b;
        });
      };
      NativeBigInt.prototype.xor = SmallInteger.prototype.xor = BigInteger.prototype.xor;
      var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;
      function roughLOB(n) {
        var v = n.value, x = typeof v === "number" ? v | LOBMASK_I : typeof v === "bigint" ? v | BigInt(LOBMASK_I) : v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x;
      }
      function integerLogarithm(value, base) {
        if (base.compareTo(value) <= 0) {
          var tmp = integerLogarithm(value, base.square(base));
          var p = tmp.p;
          var e = tmp.e;
          var t = p.multiply(base);
          return t.compareTo(value) <= 0 ? { p: t, e: e * 2 + 1 } : { p, e: e * 2 };
        }
        return { p: bigInt2(1), e: 0 };
      }
      BigInteger.prototype.bitLength = function() {
        var n = this;
        if (n.compareTo(bigInt2(0)) < 0) {
          n = n.negate().subtract(bigInt2(1));
        }
        if (n.compareTo(bigInt2(0)) === 0) {
          return bigInt2(0);
        }
        return bigInt2(integerLogarithm(n, bigInt2(2)).e).add(bigInt2(1));
      };
      NativeBigInt.prototype.bitLength = SmallInteger.prototype.bitLength = BigInteger.prototype.bitLength;
      function max5(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b;
      }
      function min3(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b;
      }
      function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b)) return a;
        if (a.isZero()) return b;
        if (b.isZero()) return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
          d = min3(roughLOB(a), roughLOB(b));
          a = a.divide(d);
          b = b.divide(d);
          c = c.multiply(d);
        }
        while (a.isEven()) {
          a = a.divide(roughLOB(a));
        }
        do {
          while (b.isEven()) {
            b = b.divide(roughLOB(b));
          }
          if (a.greater(b)) {
            t = b;
            b = a;
            a = t;
          }
          b = b.subtract(a);
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c);
      }
      function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b);
      }
      function randBetween(a, b, rng) {
        a = parseValue(a);
        b = parseValue(b);
        var usedRNG = rng || Math.random;
        var low = min3(a, b), high = max5(a, b);
        var range2 = high.subtract(low).add(1);
        if (range2.isSmall) return low.add(Math.floor(usedRNG() * range2));
        var digits = toBase2(range2, BASE).value;
        var result = [], restricted = true;
        for (var i2 = 0; i2 < digits.length; i2++) {
          var top3 = restricted ? digits[i2] + (i2 + 1 < digits.length ? digits[i2 + 1] / BASE : 0) : BASE;
          var digit = truncate(usedRNG() * top3);
          result.push(digit);
          if (digit < digits[i2]) restricted = false;
        }
        return low.add(Integer.fromArray(result, BASE, false));
      }
      var parseBase = function(text, base, alphabet, caseSensitive) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        text = String(text);
        if (!caseSensitive) {
          text = text.toLowerCase();
          alphabet = alphabet.toLowerCase();
        }
        var length5 = text.length;
        var i2;
        var absBase = Math.abs(base);
        var alphabetValues = {};
        for (i2 = 0; i2 < alphabet.length; i2++) {
          alphabetValues[alphabet[i2]] = i2;
        }
        for (i2 = 0; i2 < length5; i2++) {
          var c = text[i2];
          if (c === "-") continue;
          if (c in alphabetValues) {
            if (alphabetValues[c] >= absBase) {
              if (c === "1" && absBase === 1) continue;
              throw new Error(c + " is not a valid digit in base " + base + ".");
            }
          }
        }
        base = parseValue(base);
        var digits = [];
        var isNegative = text[0] === "-";
        for (i2 = isNegative ? 1 : 0; i2 < text.length; i2++) {
          var c = text[i2];
          if (c in alphabetValues) digits.push(parseValue(alphabetValues[c]));
          else if (c === "<") {
            var start = i2;
            do {
              i2++;
            } while (text[i2] !== ">" && i2 < text.length);
            digits.push(parseValue(text.slice(start + 1, i2)));
          } else throw new Error(c + " is not a valid character");
        }
        return parseBaseFromArray(digits, base, isNegative);
      };
      function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow4 = Integer[1], i2;
        for (i2 = digits.length - 1; i2 >= 0; i2--) {
          val = val.add(digits[i2].times(pow4));
          pow4 = pow4.times(base);
        }
        return isNegative ? val.negate() : val;
      }
      function stringify2(digit, alphabet) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        if (digit < alphabet.length) {
          return alphabet[digit];
        }
        return "<" + digit + ">";
      }
      function toBase2(n, base) {
        base = bigInt2(base);
        if (base.isZero()) {
          if (n.isZero()) return { value: [0], isNegative: false };
          throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
          if (n.isZero()) return { value: [0], isNegative: false };
          if (n.isNegative())
            return {
              value: [].concat.apply(
                [],
                Array.apply(null, Array(-n.toJSNumber())).map(Array.prototype.valueOf, [1, 0])
              ),
              isNegative: false
            };
          var arr = Array.apply(null, Array(n.toJSNumber() - 1)).map(Array.prototype.valueOf, [0, 1]);
          arr.unshift([1]);
          return {
            value: [].concat.apply([], arr),
            isNegative: false
          };
        }
        var neg = false;
        if (n.isNegative() && base.isPositive()) {
          neg = true;
          n = n.abs();
        }
        if (base.isUnit()) {
          if (n.isZero()) return { value: [0], isNegative: false };
          return {
            value: Array.apply(null, Array(n.toJSNumber())).map(Number.prototype.valueOf, 1),
            isNegative: neg
          };
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
          divmod = left.divmod(base);
          left = divmod.quotient;
          var digit = divmod.remainder;
          if (digit.isNegative()) {
            digit = base.minus(digit).abs();
            left = left.next();
          }
          out.push(digit.toJSNumber());
        }
        out.push(left.toJSNumber());
        return { value: out.reverse(), isNegative: neg };
      }
      function toBaseString(n, base, alphabet) {
        var arr = toBase2(n, base);
        return (arr.isNegative ? "-" : "") + arr.value.map(function(x) {
          return stringify2(x, alphabet);
        }).join("");
      }
      BigInteger.prototype.toArray = function(radix) {
        return toBase2(this, radix);
      };
      SmallInteger.prototype.toArray = function(radix) {
        return toBase2(this, radix);
      };
      NativeBigInt.prototype.toArray = function(radix) {
        return toBase2(this, radix);
      };
      BigInteger.prototype.toString = function(radix, alphabet) {
        if (radix === undefined2) radix = 10;
        if (radix !== 10 || alphabet) return toBaseString(this, radix, alphabet);
        var v = this.value, l = v.length, str = String(v[--l]), zeros = "0000000", digit;
        while (--l >= 0) {
          digit = String(v[l]);
          str += zeros.slice(digit.length) + digit;
        }
        var sign2 = this.sign ? "-" : "";
        return sign2 + str;
      };
      SmallInteger.prototype.toString = function(radix, alphabet) {
        if (radix === undefined2) radix = 10;
        if (radix != 10 || alphabet) return toBaseString(this, radix, alphabet);
        return String(this.value);
      };
      NativeBigInt.prototype.toString = SmallInteger.prototype.toString;
      NativeBigInt.prototype.toJSON = BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function() {
        return this.toString();
      };
      BigInteger.prototype.valueOf = function() {
        return parseInt(this.toString(), 10);
      };
      BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;
      SmallInteger.prototype.valueOf = function() {
        return this.value;
      };
      SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;
      NativeBigInt.prototype.valueOf = NativeBigInt.prototype.toJSNumber = function() {
        return parseInt(this.toString(), 10);
      };
      function parseStringValue(v) {
        if (isPrecise(+v)) {
          var x = +v;
          if (x === truncate(x))
            return supportsNativeBigInt ? new NativeBigInt(BigInt(x)) : new SmallInteger(x);
          throw new Error("Invalid integer: " + v);
        }
        var sign2 = v[0] === "-";
        if (sign2) v = v.slice(1);
        var split2 = v.split(/e/i);
        if (split2.length > 2) throw new Error("Invalid integer: " + split2.join("e"));
        if (split2.length === 2) {
          var exp2 = split2[1];
          if (exp2[0] === "+") exp2 = exp2.slice(1);
          exp2 = +exp2;
          if (exp2 !== truncate(exp2) || !isPrecise(exp2)) throw new Error("Invalid integer: " + exp2 + " is not a valid exponent.");
          var text = split2[0];
          var decimalPlace = text.indexOf(".");
          if (decimalPlace >= 0) {
            exp2 -= text.length - decimalPlace - 1;
            text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
          }
          if (exp2 < 0) throw new Error("Cannot include negative exponent part for integers");
          text += new Array(exp2 + 1).join("0");
          v = text;
        }
        var isValid = /^([0-9][0-9]*)$/.test(v);
        if (!isValid) throw new Error("Invalid integer: " + v);
        if (supportsNativeBigInt) {
          return new NativeBigInt(BigInt(sign2 ? "-" + v : v));
        }
        var r = [], max6 = v.length, l = LOG_BASE, min4 = max6 - l;
        while (max6 > 0) {
          r.push(+v.slice(min4, max6));
          min4 -= l;
          if (min4 < 0) min4 = 0;
          max6 -= l;
        }
        trim2(r);
        return new BigInteger(r, sign2);
      }
      function parseNumberValue(v) {
        if (supportsNativeBigInt) {
          return new NativeBigInt(BigInt(v));
        }
        if (isPrecise(v)) {
          if (v !== truncate(v)) throw new Error(v + " is not an integer.");
          return new SmallInteger(v);
        }
        return parseStringValue(v.toString());
      }
      function parseValue(v) {
        if (typeof v === "number") {
          return parseNumberValue(v);
        }
        if (typeof v === "string") {
          return parseStringValue(v);
        }
        if (typeof v === "bigint") {
          return new NativeBigInt(v);
        }
        return v;
      }
      for (var i = 0; i < 1e3; i++) {
        Integer[i] = parseValue(i);
        if (i > 0) Integer[-i] = parseValue(-i);
      }
      Integer.one = Integer[1];
      Integer.zero = Integer[0];
      Integer.minusOne = Integer[-1];
      Integer.max = max5;
      Integer.min = min3;
      Integer.gcd = gcd;
      Integer.lcm = lcm;
      Integer.isInstance = function(x) {
        return x instanceof BigInteger || x instanceof SmallInteger || x instanceof NativeBigInt;
      };
      Integer.randBetween = randBetween;
      Integer.fromArray = function(digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
      };
      return Integer;
    })();
    if (typeof module !== "undefined" && module.hasOwnProperty("exports")) {
      module.exports = bigInt2;
    }
    if (typeof define === "function" && define.amd) {
      define(function() {
        return bigInt2;
      });
    }
  }
});

// output/Control.Apply/foreign.js
var arrayApply = function(fs) {
  return function(xs) {
    var l = fs.length;
    var k = xs.length;
    var result = new Array(l * k);
    var n = 0;
    for (var i = 0; i < l; i++) {
      var f = fs[i];
      for (var j = 0; j < k; j++) {
        result[n++] = f(xs[j]);
      }
    }
    return result;
  };
};

// output/Control.Semigroupoid/index.js
var semigroupoidFn = {
  compose: function(f) {
    return function(g) {
      return function(x) {
        return f(g(x));
      };
    };
  }
};

// output/Control.Category/index.js
var identity = function(dict) {
  return dict.identity;
};
var categoryFn = {
  identity: function(x) {
    return x;
  },
  Semigroupoid0: function() {
    return semigroupoidFn;
  }
};

// output/Data.Boolean/index.js
var otherwise = true;

// output/Data.Function/index.js
var flip = function(f) {
  return function(b) {
    return function(a) {
      return f(a)(b);
    };
  };
};
var $$const = function(a) {
  return function(v) {
    return a;
  };
};

// output/Data.Functor/foreign.js
var arrayMap = function(f) {
  return function(arr) {
    var l = arr.length;
    var result = new Array(l);
    for (var i = 0; i < l; i++) {
      result[i] = f(arr[i]);
    }
    return result;
  };
};

// output/Data.Unit/foreign.js
var unit = void 0;

// output/Type.Proxy/index.js
var $$Proxy = /* @__PURE__ */ (function() {
  function $$Proxy2() {
  }
  ;
  $$Proxy2.value = new $$Proxy2();
  return $$Proxy2;
})();

// output/Data.Functor/index.js
var map = function(dict) {
  return dict.map;
};
var mapFlipped = function(dictFunctor) {
  var map17 = map(dictFunctor);
  return function(fa) {
    return function(f) {
      return map17(f)(fa);
    };
  };
};
var $$void = function(dictFunctor) {
  return map(dictFunctor)($$const(unit));
};
var functorArray = {
  map: arrayMap
};

// output/Control.Apply/index.js
var identity2 = /* @__PURE__ */ identity(categoryFn);
var applyArray = {
  apply: arrayApply,
  Functor0: function() {
    return functorArray;
  }
};
var apply = function(dict) {
  return dict.apply;
};
var applySecond = function(dictApply) {
  var apply1 = apply(dictApply);
  var map17 = map(dictApply.Functor0());
  return function(a) {
    return function(b) {
      return apply1(map17($$const(identity2))(a))(b);
    };
  };
};

// output/Control.Applicative/index.js
var pure = function(dict) {
  return dict.pure;
};
var when = function(dictApplicative) {
  var pure1 = pure(dictApplicative);
  return function(v) {
    return function(v1) {
      if (v) {
        return v1;
      }
      ;
      if (!v) {
        return pure1(unit);
      }
      ;
      throw new Error("Failed pattern match at Control.Applicative (line 63, column 1 - line 63, column 63): " + [v.constructor.name, v1.constructor.name]);
    };
  };
};

// output/Control.Bind/foreign.js
var arrayBind = typeof Array.prototype.flatMap === "function" ? function(arr) {
  return function(f) {
    return arr.flatMap(f);
  };
} : function(arr) {
  return function(f) {
    var result = [];
    var l = arr.length;
    for (var i = 0; i < l; i++) {
      var xs = f(arr[i]);
      var k = xs.length;
      for (var j = 0; j < k; j++) {
        result.push(xs[j]);
      }
    }
    return result;
  };
};

// output/Control.Bind/index.js
var discard = function(dict) {
  return dict.discard;
};
var bindArray = {
  bind: arrayBind,
  Apply0: function() {
    return applyArray;
  }
};
var bind = function(dict) {
  return dict.bind;
};
var discardUnit = {
  discard: function(dictBind) {
    return bind(dictBind);
  }
};

// output/Data.Argonaut.Core/foreign.js
function id(x) {
  return x;
}
var jsonNull = null;
function stringify(j) {
  return JSON.stringify(j);
}
function _caseJson(isNull2, isBool, isNum, isStr, isArr, isObj, j) {
  if (j == null) return isNull2();
  else if (typeof j === "boolean") return isBool(j);
  else if (typeof j === "number") return isNum(j);
  else if (typeof j === "string") return isStr(j);
  else if (Object.prototype.toString.call(j) === "[object Array]")
    return isArr(j);
  else return isObj(j);
}

// output/Data.Eq/foreign.js
var refEq = function(r1) {
  return function(r2) {
    return r1 === r2;
  };
};
var eqBooleanImpl = refEq;
var eqIntImpl = refEq;
var eqStringImpl = refEq;
var eqArrayImpl = function(f) {
  return function(xs) {
    return function(ys) {
      if (xs.length !== ys.length) return false;
      for (var i = 0; i < xs.length; i++) {
        if (!f(xs[i])(ys[i])) return false;
      }
      return true;
    };
  };
};

// output/Data.Symbol/index.js
var reflectSymbol = function(dict) {
  return dict.reflectSymbol;
};

// output/Record.Unsafe/foreign.js
var unsafeGet = function(label) {
  return function(rec) {
    return rec[label];
  };
};

// output/Data.Eq/index.js
var eqString = {
  eq: eqStringImpl
};
var eqRowNil = {
  eqRecord: function(v) {
    return function(v1) {
      return function(v2) {
        return true;
      };
    };
  }
};
var eqRecord = function(dict) {
  return dict.eqRecord;
};
var eqRec = function() {
  return function(dictEqRecord) {
    return {
      eq: eqRecord(dictEqRecord)($$Proxy.value)
    };
  };
};
var eqInt = {
  eq: eqIntImpl
};
var eqBoolean = {
  eq: eqBooleanImpl
};
var eq = function(dict) {
  return dict.eq;
};
var eq2 = /* @__PURE__ */ eq(eqBoolean);
var eqArray = function(dictEq) {
  return {
    eq: eqArrayImpl(eq(dictEq))
  };
};
var eqRowCons = function(dictEqRecord) {
  var eqRecord1 = eqRecord(dictEqRecord);
  return function() {
    return function(dictIsSymbol) {
      var reflectSymbol2 = reflectSymbol(dictIsSymbol);
      return function(dictEq) {
        var eq33 = eq(dictEq);
        return {
          eqRecord: function(v) {
            return function(ra) {
              return function(rb) {
                var tail = eqRecord1($$Proxy.value)(ra)(rb);
                var key = reflectSymbol2($$Proxy.value);
                var get = unsafeGet(key);
                return eq33(get(ra))(get(rb)) && tail;
              };
            };
          }
        };
      };
    };
  };
};
var notEq = function(dictEq) {
  var eq33 = eq(dictEq);
  return function(x) {
    return function(y) {
      return eq2(eq33(x)(y))(false);
    };
  };
};

// output/Data.Semigroup/foreign.js
var concatString = function(s1) {
  return function(s2) {
    return s1 + s2;
  };
};
var concatArray = function(xs) {
  return function(ys) {
    if (xs.length === 0) return ys;
    if (ys.length === 0) return xs;
    return xs.concat(ys);
  };
};

// output/Data.Semigroup/index.js
var semigroupString = {
  append: concatString
};
var semigroupArray = {
  append: concatArray
};
var append = function(dict) {
  return dict.append;
};

// output/Data.Bounded/foreign.js
var topInt = 2147483647;
var bottomInt = -2147483648;
var topChar = String.fromCharCode(65535);
var bottomChar = String.fromCharCode(0);
var topNumber = Number.POSITIVE_INFINITY;
var bottomNumber = Number.NEGATIVE_INFINITY;

// output/Data.Ord/foreign.js
var unsafeCompareImpl = function(lt) {
  return function(eq11) {
    return function(gt) {
      return function(x) {
        return function(y) {
          return x < y ? lt : x === y ? eq11 : gt;
        };
      };
    };
  };
};
var ordBooleanImpl = unsafeCompareImpl;
var ordIntImpl = unsafeCompareImpl;
var ordStringImpl = unsafeCompareImpl;
var ordArrayImpl = function(f) {
  return function(xs) {
    return function(ys) {
      var i = 0;
      var xlen = xs.length;
      var ylen = ys.length;
      while (i < xlen && i < ylen) {
        var x = xs[i];
        var y = ys[i];
        var o = f(x)(y);
        if (o !== 0) {
          return o;
        }
        i++;
      }
      if (xlen === ylen) {
        return 0;
      } else if (xlen > ylen) {
        return -1;
      } else {
        return 1;
      }
    };
  };
};

// output/Data.Ordering/index.js
var LT = /* @__PURE__ */ (function() {
  function LT3() {
  }
  ;
  LT3.value = new LT3();
  return LT3;
})();
var GT = /* @__PURE__ */ (function() {
  function GT3() {
  }
  ;
  GT3.value = new GT3();
  return GT3;
})();
var EQ = /* @__PURE__ */ (function() {
  function EQ3() {
  }
  ;
  EQ3.value = new EQ3();
  return EQ3;
})();
var eqOrdering = {
  eq: function(v) {
    return function(v1) {
      if (v instanceof LT && v1 instanceof LT) {
        return true;
      }
      ;
      if (v instanceof GT && v1 instanceof GT) {
        return true;
      }
      ;
      if (v instanceof EQ && v1 instanceof EQ) {
        return true;
      }
      ;
      return false;
    };
  }
};

// output/Data.Ring/foreign.js
var intSub = function(x) {
  return function(y) {
    return x - y | 0;
  };
};

// output/Data.Semiring/foreign.js
var intAdd = function(x) {
  return function(y) {
    return x + y | 0;
  };
};
var intMul = function(x) {
  return function(y) {
    return x * y | 0;
  };
};

// output/Data.Semiring/index.js
var zero = function(dict) {
  return dict.zero;
};
var semiringInt = {
  add: intAdd,
  zero: 0,
  mul: intMul,
  one: 1
};
var mul = function(dict) {
  return dict.mul;
};
var add = function(dict) {
  return dict.add;
};

// output/Data.Ring/index.js
var sub = function(dict) {
  return dict.sub;
};
var ringInt = {
  sub: intSub,
  Semiring0: function() {
    return semiringInt;
  }
};
var negate = function(dictRing) {
  var sub12 = sub(dictRing);
  var zero2 = zero(dictRing.Semiring0());
  return function(a) {
    return sub12(zero2)(a);
  };
};

// output/Data.Ord/index.js
var eqRec2 = /* @__PURE__ */ eqRec();
var notEq2 = /* @__PURE__ */ notEq(eqOrdering);
var ordString = /* @__PURE__ */ (function() {
  return {
    compare: ordStringImpl(LT.value)(EQ.value)(GT.value),
    Eq0: function() {
      return eqString;
    }
  };
})();
var ordRecordNil = {
  compareRecord: function(v) {
    return function(v1) {
      return function(v2) {
        return EQ.value;
      };
    };
  },
  EqRecord0: function() {
    return eqRowNil;
  }
};
var ordInt = /* @__PURE__ */ (function() {
  return {
    compare: ordIntImpl(LT.value)(EQ.value)(GT.value),
    Eq0: function() {
      return eqInt;
    }
  };
})();
var ordBoolean = /* @__PURE__ */ (function() {
  return {
    compare: ordBooleanImpl(LT.value)(EQ.value)(GT.value),
    Eq0: function() {
      return eqBoolean;
    }
  };
})();
var compareRecord = function(dict) {
  return dict.compareRecord;
};
var ordRecord = function() {
  return function(dictOrdRecord) {
    var eqRec1 = eqRec2(dictOrdRecord.EqRecord0());
    return {
      compare: compareRecord(dictOrdRecord)($$Proxy.value),
      Eq0: function() {
        return eqRec1;
      }
    };
  };
};
var compare = function(dict) {
  return dict.compare;
};
var compare2 = /* @__PURE__ */ compare(ordInt);
var comparing = function(dictOrd) {
  var compare33 = compare(dictOrd);
  return function(f) {
    return function(x) {
      return function(y) {
        return compare33(f(x))(f(y));
      };
    };
  };
};
var greaterThan = function(dictOrd) {
  var compare33 = compare(dictOrd);
  return function(a1) {
    return function(a2) {
      var v = compare33(a1)(a2);
      if (v instanceof GT) {
        return true;
      }
      ;
      return false;
    };
  };
};
var greaterThanOrEq = function(dictOrd) {
  var compare33 = compare(dictOrd);
  return function(a1) {
    return function(a2) {
      var v = compare33(a1)(a2);
      if (v instanceof LT) {
        return false;
      }
      ;
      return true;
    };
  };
};
var lessThan = function(dictOrd) {
  var compare33 = compare(dictOrd);
  return function(a1) {
    return function(a2) {
      var v = compare33(a1)(a2);
      if (v instanceof LT) {
        return true;
      }
      ;
      return false;
    };
  };
};
var lessThanOrEq = function(dictOrd) {
  var compare33 = compare(dictOrd);
  return function(a1) {
    return function(a2) {
      var v = compare33(a1)(a2);
      if (v instanceof GT) {
        return false;
      }
      ;
      return true;
    };
  };
};
var max = function(dictOrd) {
  var compare33 = compare(dictOrd);
  return function(x) {
    return function(y) {
      var v = compare33(x)(y);
      if (v instanceof LT) {
        return y;
      }
      ;
      if (v instanceof EQ) {
        return x;
      }
      ;
      if (v instanceof GT) {
        return x;
      }
      ;
      throw new Error("Failed pattern match at Data.Ord (line 181, column 3 - line 184, column 12): " + [v.constructor.name]);
    };
  };
};
var ordArray = function(dictOrd) {
  var compare33 = compare(dictOrd);
  var eqArray2 = eqArray(dictOrd.Eq0());
  return {
    compare: /* @__PURE__ */ (function() {
      var toDelta = function(x) {
        return function(y) {
          var v = compare33(x)(y);
          if (v instanceof EQ) {
            return 0;
          }
          ;
          if (v instanceof LT) {
            return 1;
          }
          ;
          if (v instanceof GT) {
            return -1 | 0;
          }
          ;
          throw new Error("Failed pattern match at Data.Ord (line 79, column 7 - line 82, column 17): " + [v.constructor.name]);
        };
      };
      return function(xs) {
        return function(ys) {
          return compare2(0)(ordArrayImpl(toDelta)(xs)(ys));
        };
      };
    })(),
    Eq0: function() {
      return eqArray2;
    }
  };
};
var ordRecordCons = function(dictOrdRecord) {
  var compareRecord1 = compareRecord(dictOrdRecord);
  var eqRowCons2 = eqRowCons(dictOrdRecord.EqRecord0())();
  return function() {
    return function(dictIsSymbol) {
      var reflectSymbol2 = reflectSymbol(dictIsSymbol);
      var eqRowCons1 = eqRowCons2(dictIsSymbol);
      return function(dictOrd) {
        var compare33 = compare(dictOrd);
        var eqRowCons22 = eqRowCons1(dictOrd.Eq0());
        return {
          compareRecord: function(v) {
            return function(ra) {
              return function(rb) {
                var key = reflectSymbol2($$Proxy.value);
                var left = compare33(unsafeGet(key)(ra))(unsafeGet(key)(rb));
                var $95 = notEq2(left)(EQ.value);
                if ($95) {
                  return left;
                }
                ;
                return compareRecord1($$Proxy.value)(ra)(rb);
              };
            };
          },
          EqRecord0: function() {
            return eqRowCons22;
          }
        };
      };
    };
  };
};

// output/Data.Bounded/index.js
var top = function(dict) {
  return dict.top;
};
var boundedInt = {
  top: topInt,
  bottom: bottomInt,
  Ord0: function() {
    return ordInt;
  }
};
var bottom = function(dict) {
  return dict.bottom;
};

// output/Data.Show/foreign.js
var showIntImpl = function(n) {
  return n.toString();
};
var showNumberImpl = function(n) {
  var str = n.toString();
  return isNaN(str + ".0") ? str : str + ".0";
};
var showStringImpl = function(s) {
  var l = s.length;
  return '"' + s.replace(
    /[\0-\x1F\x7F"\\]/g,
    // eslint-disable-line no-control-regex
    function(c, i) {
      switch (c) {
        case '"':
        case "\\":
          return "\\" + c;
        case "\x07":
          return "\\a";
        case "\b":
          return "\\b";
        case "\f":
          return "\\f";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case "	":
          return "\\t";
        case "\v":
          return "\\v";
      }
      var k = i + 1;
      var empty6 = k < l && s[k] >= "0" && s[k] <= "9" ? "\\&" : "";
      return "\\" + c.charCodeAt(0).toString(10) + empty6;
    }
  ) + '"';
};
var showArrayImpl = function(f) {
  return function(xs) {
    var ss = [];
    for (var i = 0, l = xs.length; i < l; i++) {
      ss[i] = f(xs[i]);
    }
    return "[" + ss.join(",") + "]";
  };
};

// output/Data.Show/index.js
var showString = {
  show: showStringImpl
};
var showNumber = {
  show: showNumberImpl
};
var showInt = {
  show: showIntImpl
};
var showBoolean = {
  show: function(v) {
    if (v) {
      return "true";
    }
    ;
    if (!v) {
      return "false";
    }
    ;
    throw new Error("Failed pattern match at Data.Show (line 29, column 1 - line 31, column 23): " + [v.constructor.name]);
  }
};
var show = function(dict) {
  return dict.show;
};
var showArray = function(dictShow) {
  return {
    show: showArrayImpl(show(dictShow))
  };
};

// output/Data.Maybe/index.js
var identity3 = /* @__PURE__ */ identity(categoryFn);
var Nothing = /* @__PURE__ */ (function() {
  function Nothing2() {
  }
  ;
  Nothing2.value = new Nothing2();
  return Nothing2;
})();
var Just = /* @__PURE__ */ (function() {
  function Just2(value0) {
    this.value0 = value0;
  }
  ;
  Just2.create = function(value0) {
    return new Just2(value0);
  };
  return Just2;
})();
var showMaybe = function(dictShow) {
  var show28 = show(dictShow);
  return {
    show: function(v) {
      if (v instanceof Just) {
        return "(Just " + (show28(v.value0) + ")");
      }
      ;
      if (v instanceof Nothing) {
        return "Nothing";
      }
      ;
      throw new Error("Failed pattern match at Data.Maybe (line 223, column 1 - line 225, column 28): " + [v.constructor.name]);
    }
  };
};
var maybe = function(v) {
  return function(v1) {
    return function(v2) {
      if (v2 instanceof Nothing) {
        return v;
      }
      ;
      if (v2 instanceof Just) {
        return v1(v2.value0);
      }
      ;
      throw new Error("Failed pattern match at Data.Maybe (line 237, column 1 - line 237, column 51): " + [v.constructor.name, v1.constructor.name, v2.constructor.name]);
    };
  };
};
var isNothing = /* @__PURE__ */ maybe(true)(/* @__PURE__ */ $$const(false));
var isJust = /* @__PURE__ */ maybe(false)(/* @__PURE__ */ $$const(true));
var functorMaybe = {
  map: function(v) {
    return function(v1) {
      if (v1 instanceof Just) {
        return new Just(v(v1.value0));
      }
      ;
      return Nothing.value;
    };
  }
};
var map2 = /* @__PURE__ */ map(functorMaybe);
var fromMaybe = function(a) {
  return maybe(a)(identity3);
};
var fromJust = function() {
  return function(v) {
    if (v instanceof Just) {
      return v.value0;
    }
    ;
    throw new Error("Failed pattern match at Data.Maybe (line 288, column 1 - line 288, column 46): " + [v.constructor.name]);
  };
};
var eqMaybe = function(dictEq) {
  var eq11 = eq(dictEq);
  return {
    eq: function(x) {
      return function(y) {
        if (x instanceof Nothing && y instanceof Nothing) {
          return true;
        }
        ;
        if (x instanceof Just && y instanceof Just) {
          return eq11(x.value0)(y.value0);
        }
        ;
        return false;
      };
    }
  };
};
var ordMaybe = function(dictOrd) {
  var compare6 = compare(dictOrd);
  var eqMaybe1 = eqMaybe(dictOrd.Eq0());
  return {
    compare: function(x) {
      return function(y) {
        if (x instanceof Nothing && y instanceof Nothing) {
          return EQ.value;
        }
        ;
        if (x instanceof Nothing) {
          return LT.value;
        }
        ;
        if (y instanceof Nothing) {
          return GT.value;
        }
        ;
        if (x instanceof Just && y instanceof Just) {
          return compare6(x.value0)(y.value0);
        }
        ;
        throw new Error("Failed pattern match at Data.Maybe (line 0, column 0 - line 0, column 0): " + [x.constructor.name, y.constructor.name]);
      };
    },
    Eq0: function() {
      return eqMaybe1;
    }
  };
};
var applyMaybe = {
  apply: function(v) {
    return function(v1) {
      if (v instanceof Just) {
        return map2(v.value0)(v1);
      }
      ;
      if (v instanceof Nothing) {
        return Nothing.value;
      }
      ;
      throw new Error("Failed pattern match at Data.Maybe (line 67, column 1 - line 69, column 30): " + [v.constructor.name, v1.constructor.name]);
    };
  },
  Functor0: function() {
    return functorMaybe;
  }
};
var bindMaybe = {
  bind: function(v) {
    return function(v1) {
      if (v instanceof Just) {
        return v1(v.value0);
      }
      ;
      if (v instanceof Nothing) {
        return Nothing.value;
      }
      ;
      throw new Error("Failed pattern match at Data.Maybe (line 125, column 1 - line 127, column 28): " + [v.constructor.name, v1.constructor.name]);
    };
  },
  Apply0: function() {
    return applyMaybe;
  }
};
var applicativeMaybe = /* @__PURE__ */ (function() {
  return {
    pure: Just.create,
    Apply0: function() {
      return applyMaybe;
    }
  };
})();

// output/Foreign.Object/foreign.js
function runST(f) {
  return f();
}
function all(f) {
  return function(m) {
    for (var k in m) {
      if (hasOwnProperty.call(m, k) && !f(k)(m[k])) return false;
    }
    return true;
  };
}
function _lookup(no, yes, k, m) {
  return k in m ? yes(m[k]) : no;
}
function toArrayWithKey(f) {
  return function(m) {
    var r = [];
    for (var k in m) {
      if (hasOwnProperty.call(m, k)) {
        r.push(f(k)(m[k]));
      }
    }
    return r;
  };
}
var keys = Object.keys || toArrayWithKey(function(k) {
  return function() {
    return k;
  };
});

// output/Control.Monad.ST.Internal/foreign.js
var map_ = function(f) {
  return function(a) {
    return function() {
      return f(a());
    };
  };
};
var pure_ = function(a) {
  return function() {
    return a;
  };
};
var bind_ = function(a) {
  return function(f) {
    return function() {
      return f(a())();
    };
  };
};
var foreach = function(as) {
  return function(f) {
    return function() {
      for (var i = 0, l = as.length; i < l; i++) {
        f(as[i])();
      }
    };
  };
};

// output/Control.Monad/index.js
var ap = function(dictMonad) {
  var bind8 = bind(dictMonad.Bind1());
  var pure9 = pure(dictMonad.Applicative0());
  return function(f) {
    return function(a) {
      return bind8(f)(function(f$prime) {
        return bind8(a)(function(a$prime) {
          return pure9(f$prime(a$prime));
        });
      });
    };
  };
};

// output/Data.Either/index.js
var Left = /* @__PURE__ */ (function() {
  function Left2(value0) {
    this.value0 = value0;
  }
  ;
  Left2.create = function(value0) {
    return new Left2(value0);
  };
  return Left2;
})();
var Right = /* @__PURE__ */ (function() {
  function Right2(value0) {
    this.value0 = value0;
  }
  ;
  Right2.create = function(value0) {
    return new Right2(value0);
  };
  return Right2;
})();
var showEither = function(dictShow) {
  var show28 = show(dictShow);
  return function(dictShow1) {
    var show112 = show(dictShow1);
    return {
      show: function(v) {
        if (v instanceof Left) {
          return "(Left " + (show28(v.value0) + ")");
        }
        ;
        if (v instanceof Right) {
          return "(Right " + (show112(v.value0) + ")");
        }
        ;
        throw new Error("Failed pattern match at Data.Either (line 173, column 1 - line 175, column 46): " + [v.constructor.name]);
      }
    };
  };
};
var functorEither = {
  map: function(f) {
    return function(m) {
      if (m instanceof Left) {
        return new Left(m.value0);
      }
      ;
      if (m instanceof Right) {
        return new Right(f(m.value0));
      }
      ;
      throw new Error("Failed pattern match at Data.Either (line 0, column 0 - line 0, column 0): " + [m.constructor.name]);
    };
  }
};
var map3 = /* @__PURE__ */ map(functorEither);
var eqEither = function(dictEq) {
  var eq11 = eq(dictEq);
  return function(dictEq1) {
    var eq14 = eq(dictEq1);
    return {
      eq: function(x) {
        return function(y) {
          if (x instanceof Left && y instanceof Left) {
            return eq11(x.value0)(y.value0);
          }
          ;
          if (x instanceof Right && y instanceof Right) {
            return eq14(x.value0)(y.value0);
          }
          ;
          return false;
        };
      }
    };
  };
};
var ordEither = function(dictOrd) {
  var compare6 = compare(dictOrd);
  var eqEither1 = eqEither(dictOrd.Eq0());
  return function(dictOrd1) {
    var compare13 = compare(dictOrd1);
    var eqEither2 = eqEither1(dictOrd1.Eq0());
    return {
      compare: function(x) {
        return function(y) {
          if (x instanceof Left && y instanceof Left) {
            return compare6(x.value0)(y.value0);
          }
          ;
          if (x instanceof Left) {
            return LT.value;
          }
          ;
          if (y instanceof Left) {
            return GT.value;
          }
          ;
          if (x instanceof Right && y instanceof Right) {
            return compare13(x.value0)(y.value0);
          }
          ;
          throw new Error("Failed pattern match at Data.Either (line 0, column 0 - line 0, column 0): " + [x.constructor.name, y.constructor.name]);
        };
      },
      Eq0: function() {
        return eqEither2;
      }
    };
  };
};
var either = function(v) {
  return function(v1) {
    return function(v2) {
      if (v2 instanceof Left) {
        return v(v2.value0);
      }
      ;
      if (v2 instanceof Right) {
        return v1(v2.value0);
      }
      ;
      throw new Error("Failed pattern match at Data.Either (line 208, column 1 - line 208, column 64): " + [v.constructor.name, v1.constructor.name, v2.constructor.name]);
    };
  };
};
var applyEither = {
  apply: function(v) {
    return function(v1) {
      if (v instanceof Left) {
        return new Left(v.value0);
      }
      ;
      if (v instanceof Right) {
        return map3(v.value0)(v1);
      }
      ;
      throw new Error("Failed pattern match at Data.Either (line 70, column 1 - line 72, column 30): " + [v.constructor.name, v1.constructor.name]);
    };
  },
  Functor0: function() {
    return functorEither;
  }
};
var bindEither = {
  bind: /* @__PURE__ */ either(function(e) {
    return function(v) {
      return new Left(e);
    };
  })(function(a) {
    return function(f) {
      return f(a);
    };
  }),
  Apply0: function() {
    return applyEither;
  }
};
var applicativeEither = /* @__PURE__ */ (function() {
  return {
    pure: Right.create,
    Apply0: function() {
      return applyEither;
    }
  };
})();
var monadEither = {
  Applicative0: function() {
    return applicativeEither;
  },
  Bind1: function() {
    return bindEither;
  }
};

// output/Data.EuclideanRing/foreign.js
var intDegree = function(x) {
  return Math.min(Math.abs(x), 2147483647);
};
var intDiv = function(x) {
  return function(y) {
    if (y === 0) return 0;
    return y > 0 ? Math.floor(x / y) : -Math.floor(x / -y);
  };
};
var intMod = function(x) {
  return function(y) {
    if (y === 0) return 0;
    var yy = Math.abs(y);
    return (x % yy + yy) % yy;
  };
};

// output/Data.CommutativeRing/index.js
var commutativeRingInt = {
  Ring0: function() {
    return ringInt;
  }
};

// output/Data.EuclideanRing/index.js
var mod = function(dict) {
  return dict.mod;
};
var euclideanRingInt = {
  degree: intDegree,
  div: intDiv,
  mod: intMod,
  CommutativeRing0: function() {
    return commutativeRingInt;
  }
};
var div = function(dict) {
  return dict.div;
};

// output/Data.Monoid/index.js
var monoidString = {
  mempty: "",
  Semigroup0: function() {
    return semigroupString;
  }
};
var mempty = function(dict) {
  return dict.mempty;
};

// output/Control.Monad.Rec.Class/index.js
var Loop = /* @__PURE__ */ (function() {
  function Loop2(value0) {
    this.value0 = value0;
  }
  ;
  Loop2.create = function(value0) {
    return new Loop2(value0);
  };
  return Loop2;
})();
var Done = /* @__PURE__ */ (function() {
  function Done2(value0) {
    this.value0 = value0;
  }
  ;
  Done2.create = function(value0) {
    return new Done2(value0);
  };
  return Done2;
})();
var tailRecM = function(dict) {
  return dict.tailRecM;
};
var tailRec = function(f) {
  var go = function($copy_v) {
    var $tco_done = false;
    var $tco_result;
    function $tco_loop(v) {
      if (v instanceof Loop) {
        $copy_v = f(v.value0);
        return;
      }
      ;
      if (v instanceof Done) {
        $tco_done = true;
        return v.value0;
      }
      ;
      throw new Error("Failed pattern match at Control.Monad.Rec.Class (line 103, column 3 - line 103, column 25): " + [v.constructor.name]);
    }
    ;
    while (!$tco_done) {
      $tco_result = $tco_loop($copy_v);
    }
    ;
    return $tco_result;
  };
  return function($85) {
    return go(f($85));
  };
};
var monadRecEither = {
  tailRecM: function(f) {
    return function(a0) {
      var g = function(v) {
        if (v instanceof Left) {
          return new Done(new Left(v.value0));
        }
        ;
        if (v instanceof Right && v.value0 instanceof Loop) {
          return new Loop(f(v.value0.value0));
        }
        ;
        if (v instanceof Right && v.value0 instanceof Done) {
          return new Done(new Right(v.value0.value0));
        }
        ;
        throw new Error("Failed pattern match at Control.Monad.Rec.Class (line 145, column 7 - line 145, column 33): " + [v.constructor.name]);
      };
      return tailRec(g)(f(a0));
    };
  },
  Monad0: function() {
    return monadEither;
  }
};

// output/Control.Monad.ST.Internal/index.js
var $runtime_lazy = function(name, moduleName, init2) {
  var state = 0;
  var val;
  return function(lineNumber) {
    if (state === 2) return val;
    if (state === 1) throw new ReferenceError(name + " was needed before it finished initializing (module " + moduleName + ", line " + lineNumber + ")", moduleName, lineNumber);
    state = 1;
    val = init2();
    state = 2;
    return val;
  };
};
var functorST = {
  map: map_
};
var monadST = {
  Applicative0: function() {
    return applicativeST;
  },
  Bind1: function() {
    return bindST;
  }
};
var bindST = {
  bind: bind_,
  Apply0: function() {
    return $lazy_applyST(0);
  }
};
var applicativeST = {
  pure: pure_,
  Apply0: function() {
    return $lazy_applyST(0);
  }
};
var $lazy_applyST = /* @__PURE__ */ $runtime_lazy("applyST", "Control.Monad.ST.Internal", function() {
  return {
    apply: ap(monadST),
    Functor0: function() {
      return functorST;
    }
  };
});

// output/Data.Array/foreign.js
var replicateFill = function(count, value) {
  if (count < 1) {
    return [];
  }
  var result = new Array(count);
  return result.fill(value);
};
var replicatePolyfill = function(count, value) {
  var result = [];
  var n = 0;
  for (var i = 0; i < count; i++) {
    result[n++] = value;
  }
  return result;
};
var replicateImpl = typeof Array.prototype.fill === "function" ? replicateFill : replicatePolyfill;
var fromFoldableImpl = /* @__PURE__ */ (function() {
  function Cons2(head2, tail) {
    this.head = head2;
    this.tail = tail;
  }
  var emptyList = {};
  function curryCons(head2) {
    return function(tail) {
      return new Cons2(head2, tail);
    };
  }
  function listToArray(list) {
    var result = [];
    var count = 0;
    var xs = list;
    while (xs !== emptyList) {
      result[count++] = xs.head;
      xs = xs.tail;
    }
    return result;
  }
  return function(foldr3, xs) {
    return listToArray(foldr3(curryCons)(emptyList)(xs));
  };
})();
var length = function(xs) {
  return xs.length;
};
var unconsImpl = function(empty6, next, xs) {
  return xs.length === 0 ? empty6({}) : next(xs[0])(xs.slice(1));
};
var indexImpl = function(just, nothing, xs, i) {
  return i < 0 || i >= xs.length ? nothing : just(xs[i]);
};
var findMapImpl = function(nothing, isJust2, f, xs) {
  for (var i = 0; i < xs.length; i++) {
    var result = f(xs[i]);
    if (isJust2(result)) return result;
  }
  return nothing;
};
var findIndexImpl = function(just, nothing, f, xs) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (f(xs[i])) return just(i);
  }
  return nothing;
};
var _deleteAt = function(just, nothing, i, l) {
  if (i < 0 || i >= l.length) return nothing;
  var l1 = l.slice();
  l1.splice(i, 1);
  return just(l1);
};
var _updateAt = function(just, nothing, i, a, l) {
  if (i < 0 || i >= l.length) return nothing;
  var l1 = l.slice();
  l1[i] = a;
  return just(l1);
};
var reverse = function(l) {
  return l.slice().reverse();
};
var concat = function(xss) {
  if (xss.length <= 1e4) {
    return Array.prototype.concat.apply([], xss);
  }
  var result = [];
  for (var i = 0, l = xss.length; i < l; i++) {
    var xs = xss[i];
    for (var j = 0, m = xs.length; j < m; j++) {
      result.push(xs[j]);
    }
  }
  return result;
};
var filterImpl = function(f, xs) {
  return xs.filter(f);
};
var sortByImpl = /* @__PURE__ */ (function() {
  function mergeFromTo(compare6, fromOrdering, xs1, xs2, from, to) {
    var mid;
    var i;
    var j;
    var k;
    var x;
    var y;
    var c;
    mid = from + (to - from >> 1);
    if (mid - from > 1) mergeFromTo(compare6, fromOrdering, xs2, xs1, from, mid);
    if (to - mid > 1) mergeFromTo(compare6, fromOrdering, xs2, xs1, mid, to);
    i = from;
    j = mid;
    k = from;
    while (i < mid && j < to) {
      x = xs2[i];
      y = xs2[j];
      c = fromOrdering(compare6(x)(y));
      if (c > 0) {
        xs1[k++] = y;
        ++j;
      } else {
        xs1[k++] = x;
        ++i;
      }
    }
    while (i < mid) {
      xs1[k++] = xs2[i++];
    }
    while (j < to) {
      xs1[k++] = xs2[j++];
    }
  }
  return function(compare6, fromOrdering, xs) {
    var out;
    if (xs.length < 2) return xs;
    out = xs.slice(0);
    mergeFromTo(compare6, fromOrdering, out, xs.slice(0), 0, xs.length);
    return out;
  };
})();
var sliceImpl = function(s, e, l) {
  return l.slice(s, e);
};
var anyImpl = function(p, xs) {
  var len = xs.length;
  for (var i = 0; i < len; i++) {
    if (p(xs[i])) return true;
  }
  return false;
};
var allImpl = function(p, xs) {
  var len = xs.length;
  for (var i = 0; i < len; i++) {
    if (!p(xs[i])) return false;
  }
  return true;
};
var unsafeIndexImpl = function(xs, n) {
  return xs[n];
};

// output/Data.Array.ST/foreign.js
function unsafeFreezeThawImpl(xs) {
  return xs;
}
var unsafeFreezeImpl = unsafeFreezeThawImpl;
var unsafeThawImpl = unsafeFreezeThawImpl;
function copyImpl(xs) {
  return xs.slice();
}
var thawImpl = copyImpl;
var pushImpl = function(a, xs) {
  return xs.push(a);
};

// output/Control.Monad.ST.Uncurried/foreign.js
var runSTFn1 = function runSTFn12(fn) {
  return function(a) {
    return function() {
      return fn(a);
    };
  };
};
var runSTFn2 = function runSTFn22(fn) {
  return function(a) {
    return function(b) {
      return function() {
        return fn(a, b);
      };
    };
  };
};

// output/Data.Array.ST/index.js
var unsafeThaw = /* @__PURE__ */ runSTFn1(unsafeThawImpl);
var unsafeFreeze = /* @__PURE__ */ runSTFn1(unsafeFreezeImpl);
var thaw = /* @__PURE__ */ runSTFn1(thawImpl);
var withArray = function(f) {
  return function(xs) {
    return function __do() {
      var result = thaw(xs)();
      f(result)();
      return unsafeFreeze(result)();
    };
  };
};
var push = /* @__PURE__ */ runSTFn2(pushImpl);

// output/Data.HeytingAlgebra/foreign.js
var boolConj = function(b1) {
  return function(b2) {
    return b1 && b2;
  };
};
var boolDisj = function(b1) {
  return function(b2) {
    return b1 || b2;
  };
};
var boolNot = function(b) {
  return !b;
};

// output/Data.HeytingAlgebra/index.js
var not = function(dict) {
  return dict.not;
};
var ff = function(dict) {
  return dict.ff;
};
var disj = function(dict) {
  return dict.disj;
};
var heytingAlgebraBoolean = {
  ff: false,
  tt: true,
  implies: function(a) {
    return function(b) {
      return disj(heytingAlgebraBoolean)(not(heytingAlgebraBoolean)(a))(b);
    };
  },
  conj: boolConj,
  disj: boolDisj,
  not: boolNot
};

// output/Data.Foldable/foreign.js
var foldrArray = function(f) {
  return function(init2) {
    return function(xs) {
      var acc = init2;
      var len = xs.length;
      for (var i = len - 1; i >= 0; i--) {
        acc = f(xs[i])(acc);
      }
      return acc;
    };
  };
};
var foldlArray = function(f) {
  return function(init2) {
    return function(xs) {
      var acc = init2;
      var len = xs.length;
      for (var i = 0; i < len; i++) {
        acc = f(acc)(xs[i]);
      }
      return acc;
    };
  };
};

// output/Data.Tuple/index.js
var Tuple = /* @__PURE__ */ (function() {
  function Tuple2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  Tuple2.create = function(value0) {
    return function(value1) {
      return new Tuple2(value0, value1);
    };
  };
  return Tuple2;
})();
var snd = function(v) {
  return v.value1;
};
var showTuple = function(dictShow) {
  var show28 = show(dictShow);
  return function(dictShow1) {
    var show112 = show(dictShow1);
    return {
      show: function(v) {
        return "(Tuple " + (show28(v.value0) + (" " + (show112(v.value1) + ")")));
      }
    };
  };
};
var fst = function(v) {
  return v.value0;
};

// output/Data.Monoid.Disj/index.js
var Disj = function(x) {
  return x;
};
var semigroupDisj = function(dictHeytingAlgebra) {
  var disj2 = disj(dictHeytingAlgebra);
  return {
    append: function(v) {
      return function(v1) {
        return disj2(v)(v1);
      };
    }
  };
};
var monoidDisj = function(dictHeytingAlgebra) {
  var semigroupDisj1 = semigroupDisj(dictHeytingAlgebra);
  return {
    mempty: ff(dictHeytingAlgebra),
    Semigroup0: function() {
      return semigroupDisj1;
    }
  };
};

// output/Unsafe.Coerce/foreign.js
var unsafeCoerce2 = function(x) {
  return x;
};

// output/Safe.Coerce/index.js
var coerce = function() {
  return unsafeCoerce2;
};

// output/Data.Newtype/index.js
var coerce2 = /* @__PURE__ */ coerce();
var alaF = function() {
  return function() {
    return function() {
      return function() {
        return function(v) {
          return coerce2;
        };
      };
    };
  };
};

// output/Data.Foldable/index.js
var eq12 = /* @__PURE__ */ eq(eqOrdering);
var alaF2 = /* @__PURE__ */ alaF()()()();
var foldr = function(dict) {
  return dict.foldr;
};
var traverse_ = function(dictApplicative) {
  var applySecond2 = applySecond(dictApplicative.Apply0());
  var pure9 = pure(dictApplicative);
  return function(dictFoldable) {
    var foldr22 = foldr(dictFoldable);
    return function(f) {
      return foldr22(function($454) {
        return applySecond2(f($454));
      })(pure9(unit));
    };
  };
};
var for_ = function(dictApplicative) {
  var traverse_1 = traverse_(dictApplicative);
  return function(dictFoldable) {
    return flip(traverse_1(dictFoldable));
  };
};
var foldl = function(dict) {
  return dict.foldl;
};
var intercalate = function(dictFoldable) {
  var foldl22 = foldl(dictFoldable);
  return function(dictMonoid) {
    var append5 = append(dictMonoid.Semigroup0());
    var mempty4 = mempty(dictMonoid);
    return function(sep) {
      return function(xs) {
        var go = function(v) {
          return function(v1) {
            if (v.init) {
              return {
                init: false,
                acc: v1
              };
            }
            ;
            return {
              init: false,
              acc: append5(v.acc)(append5(sep)(v1))
            };
          };
        };
        return foldl22(go)({
          init: true,
          acc: mempty4
        })(xs).acc;
      };
    };
  };
};
var minimumBy = function(dictFoldable) {
  var foldl22 = foldl(dictFoldable);
  return function(cmp) {
    var min$prime = function(v) {
      return function(v1) {
        if (v instanceof Nothing) {
          return new Just(v1);
        }
        ;
        if (v instanceof Just) {
          return new Just((function() {
            var $307 = eq12(cmp(v.value0)(v1))(LT.value);
            if ($307) {
              return v.value0;
            }
            ;
            return v1;
          })());
        }
        ;
        throw new Error("Failed pattern match at Data.Foldable (line 454, column 3 - line 454, column 27): " + [v.constructor.name, v1.constructor.name]);
      };
    };
    return foldl22(min$prime)(Nothing.value);
  };
};
var minimum = function(dictOrd) {
  var compare6 = compare(dictOrd);
  return function(dictFoldable) {
    return minimumBy(dictFoldable)(compare6);
  };
};
var foldMapDefaultR = function(dictFoldable) {
  var foldr22 = foldr(dictFoldable);
  return function(dictMonoid) {
    var append5 = append(dictMonoid.Semigroup0());
    var mempty4 = mempty(dictMonoid);
    return function(f) {
      return foldr22(function(x) {
        return function(acc) {
          return append5(f(x))(acc);
        };
      })(mempty4);
    };
  };
};
var foldableArray = {
  foldr: foldrArray,
  foldl: foldlArray,
  foldMap: function(dictMonoid) {
    return foldMapDefaultR(foldableArray)(dictMonoid);
  }
};
var foldMap = function(dict) {
  return dict.foldMap;
};
var any = function(dictFoldable) {
  var foldMap2 = foldMap(dictFoldable);
  return function(dictHeytingAlgebra) {
    return alaF2(Disj)(foldMap2(monoidDisj(dictHeytingAlgebra)));
  };
};

// output/Data.Function.Uncurried/foreign.js
var runFn2 = function(fn) {
  return function(a) {
    return function(b) {
      return fn(a, b);
    };
  };
};
var runFn3 = function(fn) {
  return function(a) {
    return function(b) {
      return function(c) {
        return fn(a, b, c);
      };
    };
  };
};
var runFn4 = function(fn) {
  return function(a) {
    return function(b) {
      return function(c) {
        return function(d) {
          return fn(a, b, c, d);
        };
      };
    };
  };
};
var runFn5 = function(fn) {
  return function(a) {
    return function(b) {
      return function(c) {
        return function(d) {
          return function(e) {
            return fn(a, b, c, d, e);
          };
        };
      };
    };
  };
};

// output/Data.FunctorWithIndex/foreign.js
var mapWithIndexArray = function(f) {
  return function(xs) {
    var l = xs.length;
    var result = Array(l);
    for (var i = 0; i < l; i++) {
      result[i] = f(i)(xs[i]);
    }
    return result;
  };
};

// output/Data.FunctorWithIndex/index.js
var mapWithIndex = function(dict) {
  return dict.mapWithIndex;
};
var functorWithIndexArray = {
  mapWithIndex: mapWithIndexArray,
  Functor0: function() {
    return functorArray;
  }
};

// output/Data.Traversable/foreign.js
var traverseArrayImpl = /* @__PURE__ */ (function() {
  function array1(a) {
    return [a];
  }
  function array2(a) {
    return function(b) {
      return [a, b];
    };
  }
  function array3(a) {
    return function(b) {
      return function(c) {
        return [a, b, c];
      };
    };
  }
  function concat2(xs) {
    return function(ys) {
      return xs.concat(ys);
    };
  }
  return function(apply4) {
    return function(map17) {
      return function(pure9) {
        return function(f) {
          return function(array) {
            function go(bot, top3) {
              switch (top3 - bot) {
                case 0:
                  return pure9([]);
                case 1:
                  return map17(array1)(f(array[bot]));
                case 2:
                  return apply4(map17(array2)(f(array[bot])))(f(array[bot + 1]));
                case 3:
                  return apply4(apply4(map17(array3)(f(array[bot])))(f(array[bot + 1])))(f(array[bot + 2]));
                default:
                  var pivot = bot + Math.floor((top3 - bot) / 4) * 2;
                  return apply4(map17(concat2)(go(bot, pivot)))(go(pivot, top3));
              }
            }
            return go(0, array.length);
          };
        };
      };
    };
  };
})();

// output/Data.Traversable/index.js
var identity4 = /* @__PURE__ */ identity(categoryFn);
var traverse = function(dict) {
  return dict.traverse;
};
var sequenceDefault = function(dictTraversable) {
  var traverse22 = traverse(dictTraversable);
  return function(dictApplicative) {
    return traverse22(dictApplicative)(identity4);
  };
};
var traversableArray = {
  traverse: function(dictApplicative) {
    var Apply0 = dictApplicative.Apply0();
    return traverseArrayImpl(apply(Apply0))(map(Apply0.Functor0()))(pure(dictApplicative));
  },
  sequence: function(dictApplicative) {
    return sequenceDefault(traversableArray)(dictApplicative);
  },
  Functor0: function() {
    return functorArray;
  },
  Foldable1: function() {
    return foldableArray;
  }
};

// output/Data.Unfoldable/foreign.js
var unfoldrArrayImpl = function(isNothing2) {
  return function(fromJust5) {
    return function(fst2) {
      return function(snd2) {
        return function(f) {
          return function(b) {
            var result = [];
            var value = b;
            while (true) {
              var maybe2 = f(value);
              if (isNothing2(maybe2)) return result;
              var tuple = fromJust5(maybe2);
              result.push(fst2(tuple));
              value = snd2(tuple);
            }
          };
        };
      };
    };
  };
};

// output/Data.Unfoldable1/foreign.js
var unfoldr1ArrayImpl = function(isNothing2) {
  return function(fromJust5) {
    return function(fst2) {
      return function(snd2) {
        return function(f) {
          return function(b) {
            var result = [];
            var value = b;
            while (true) {
              var tuple = f(value);
              result.push(fst2(tuple));
              var maybe2 = snd2(tuple);
              if (isNothing2(maybe2)) return result;
              value = fromJust5(maybe2);
            }
          };
        };
      };
    };
  };
};

// output/Data.Unfoldable1/index.js
var fromJust2 = /* @__PURE__ */ fromJust();
var unfoldable1Array = {
  unfoldr1: /* @__PURE__ */ unfoldr1ArrayImpl(isNothing)(fromJust2)(fst)(snd)
};

// output/Data.Unfoldable/index.js
var fromJust3 = /* @__PURE__ */ fromJust();
var unfoldr = function(dict) {
  return dict.unfoldr;
};
var unfoldableArray = {
  unfoldr: /* @__PURE__ */ unfoldrArrayImpl(isNothing)(fromJust3)(fst)(snd),
  Unfoldable10: function() {
    return unfoldable1Array;
  }
};

// output/Data.Array/index.js
var $$void2 = /* @__PURE__ */ $$void(functorST);
var intercalate1 = /* @__PURE__ */ intercalate(foldableArray);
var apply2 = /* @__PURE__ */ apply(applyMaybe);
var map4 = /* @__PURE__ */ map(functorMaybe);
var map1 = /* @__PURE__ */ map(functorArray);
var map22 = /* @__PURE__ */ map(functorST);
var fromJust4 = /* @__PURE__ */ fromJust();
var when2 = /* @__PURE__ */ when(applicativeST);
var notEq3 = /* @__PURE__ */ notEq(eqOrdering);
var append2 = /* @__PURE__ */ append(semigroupArray);
var updateAt = /* @__PURE__ */ (function() {
  return runFn5(_updateAt)(Just.create)(Nothing.value);
})();
var unsafeIndex = function() {
  return runFn2(unsafeIndexImpl);
};
var unsafeIndex1 = /* @__PURE__ */ unsafeIndex();
var uncons = /* @__PURE__ */ (function() {
  return runFn3(unconsImpl)($$const(Nothing.value))(function(x) {
    return function(xs) {
      return new Just({
        head: x,
        tail: xs
      });
    };
  });
})();
var toUnfoldable = function(dictUnfoldable) {
  var unfoldr2 = unfoldr(dictUnfoldable);
  return function(xs) {
    var len = length(xs);
    var f = function(i) {
      if (i < len) {
        return new Just(new Tuple(unsafeIndex1(xs)(i), i + 1 | 0));
      }
      ;
      if (otherwise) {
        return Nothing.value;
      }
      ;
      throw new Error("Failed pattern match at Data.Array (line 163, column 3 - line 165, column 26): " + [i.constructor.name]);
    };
    return unfoldr2(f)(0);
  };
};
var sortBy = function(comp) {
  return runFn3(sortByImpl)(comp)(function(v) {
    if (v instanceof GT) {
      return 1;
    }
    ;
    if (v instanceof EQ) {
      return 0;
    }
    ;
    if (v instanceof LT) {
      return -1 | 0;
    }
    ;
    throw new Error("Failed pattern match at Data.Array (line 897, column 38 - line 900, column 11): " + [v.constructor.name]);
  });
};
var sortWith = function(dictOrd) {
  var comparing2 = comparing(dictOrd);
  return function(f) {
    return sortBy(comparing2(f));
  };
};
var sortWith1 = /* @__PURE__ */ sortWith(ordInt);
var sort = function(dictOrd) {
  var compare6 = compare(dictOrd);
  return function(xs) {
    return sortBy(compare6)(xs);
  };
};
var snoc = function(xs) {
  return function(x) {
    return withArray(push(x))(xs)();
  };
};
var slice = /* @__PURE__ */ runFn3(sliceImpl);
var singleton2 = function(a) {
  return [a];
};
var replicate = /* @__PURE__ */ runFn2(replicateImpl);
var $$null = function(xs) {
  return length(xs) === 0;
};
var mapWithIndex2 = /* @__PURE__ */ mapWithIndex(functorWithIndexArray);
var intercalate2 = function(dictMonoid) {
  return intercalate1(dictMonoid);
};
var init = function(xs) {
  if ($$null(xs)) {
    return Nothing.value;
  }
  ;
  if (otherwise) {
    return new Just(slice(0)(length(xs) - 1 | 0)(xs));
  }
  ;
  throw new Error("Failed pattern match at Data.Array (line 351, column 1 - line 351, column 45): " + [xs.constructor.name]);
};
var index = /* @__PURE__ */ (function() {
  return runFn4(indexImpl)(Just.create)(Nothing.value);
})();
var last = function(xs) {
  return index(xs)(length(xs) - 1 | 0);
};
var unsnoc = function(xs) {
  return apply2(map4(function(v) {
    return function(v1) {
      return {
        init: v,
        last: v1
      };
    };
  })(init(xs)))(last(xs));
};
var head = function(xs) {
  return index(xs)(0);
};
var nubBy = function(comp) {
  return function(xs) {
    var indexedAndSorted = sortBy(function(x) {
      return function(y) {
        return comp(snd(x))(snd(y));
      };
    })(mapWithIndex2(Tuple.create)(xs));
    var v = head(indexedAndSorted);
    if (v instanceof Nothing) {
      return [];
    }
    ;
    if (v instanceof Just) {
      return map1(snd)(sortWith1(fst)((function __do() {
        var result = unsafeThaw(singleton2(v.value0))();
        foreach(indexedAndSorted)(function(v1) {
          return function __do2() {
            var lst = map22(/* @__PURE__ */ (function() {
              var $183 = function($185) {
                return fromJust4(last($185));
              };
              return function($184) {
                return snd($183($184));
              };
            })())(unsafeFreeze(result))();
            return when2(notEq3(comp(lst)(v1.value1))(EQ.value))($$void2(push(v1)(result)))();
          };
        })();
        return unsafeFreeze(result)();
      })()));
    }
    ;
    throw new Error("Failed pattern match at Data.Array (line 1115, column 17 - line 1123, column 28): " + [v.constructor.name]);
  };
};
var nub = function(dictOrd) {
  return nubBy(compare(dictOrd));
};
var fromFoldable = function(dictFoldable) {
  return runFn2(fromFoldableImpl)(foldr(dictFoldable));
};
var foldl2 = /* @__PURE__ */ foldl(foldableArray);
var findMap = /* @__PURE__ */ (function() {
  return runFn4(findMapImpl)(Nothing.value)(isJust);
})();
var findIndex = /* @__PURE__ */ (function() {
  return runFn4(findIndexImpl)(Just.create)(Nothing.value);
})();
var find2 = function(f) {
  return function(xs) {
    return map4(unsafeIndex1(xs))(findIndex(f)(xs));
  };
};
var filter = /* @__PURE__ */ runFn2(filterImpl);
var elemIndex = function(dictEq) {
  var eq25 = eq(dictEq);
  return function(x) {
    return findIndex(function(v) {
      return eq25(v)(x);
    });
  };
};
var elem2 = function(dictEq) {
  var elemIndex1 = elemIndex(dictEq);
  return function(a) {
    return function(arr) {
      return isJust(elemIndex1(a)(arr));
    };
  };
};
var deleteAt = /* @__PURE__ */ (function() {
  return runFn4(_deleteAt)(Just.create)(Nothing.value);
})();
var cons = function(x) {
  return function(xs) {
    return append2([x])(xs);
  };
};
var concatMap = /* @__PURE__ */ flip(/* @__PURE__ */ bind(bindArray));
var mapMaybe = function(f) {
  return concatMap((function() {
    var $189 = maybe([])(singleton2);
    return function($190) {
      return $189(f($190));
    };
  })());
};
var any2 = /* @__PURE__ */ runFn2(anyImpl);
var all3 = /* @__PURE__ */ runFn2(allImpl);

// output/Data.FoldableWithIndex/index.js
var foldrWithIndex = function(dict) {
  return dict.foldrWithIndex;
};

// output/Foreign.Object.ST/foreign.js
var newImpl = function() {
  return {};
};
function poke2(k) {
  return function(v) {
    return function(m) {
      return function() {
        m[k] = v;
        return m;
      };
    };
  };
}

// output/Foreign.Object/index.js
var sortWith2 = /* @__PURE__ */ sortWith(ordString);
var $$void3 = /* @__PURE__ */ $$void(functorST);
var toUnfoldable2 = function(dictUnfoldable) {
  var $89 = toUnfoldable(dictUnfoldable);
  var $90 = toArrayWithKey(Tuple.create);
  return function($91) {
    return $89($90($91));
  };
};
var toAscUnfoldable = function(dictUnfoldable) {
  var $92 = toUnfoldable(dictUnfoldable);
  var $93 = sortWith2(fst);
  var $94 = toArrayWithKey(Tuple.create);
  return function($95) {
    return $92($93($94($95)));
  };
};
var member = /* @__PURE__ */ runFn4(_lookup)(false)(/* @__PURE__ */ $$const(true));
var lookup = /* @__PURE__ */ (function() {
  return runFn4(_lookup)(Nothing.value)(Just.create);
})();
var isEmpty = /* @__PURE__ */ all(function(v) {
  return function(v1) {
    return false;
  };
});
var fromFoldable2 = function(dictFoldable) {
  var fromFoldable13 = fromFoldable(dictFoldable);
  return function(l) {
    return runST(function __do() {
      var s = newImpl();
      foreach(fromFoldable13(l))(function(v) {
        return $$void3(poke2(v.value0)(v.value1)(s));
      })();
      return s;
    });
  };
};

// output/Data.Argonaut.Core/index.js
var verbJsonType = function(def) {
  return function(f) {
    return function(g) {
      return g(def)(f);
    };
  };
};
var toJsonType = /* @__PURE__ */ (function() {
  return verbJsonType(Nothing.value)(Just.create);
})();
var isJsonType = /* @__PURE__ */ verbJsonType(false)(/* @__PURE__ */ $$const(true));
var caseJsonString = function(d) {
  return function(f) {
    return function(j) {
      return _caseJson($$const(d), $$const(d), $$const(d), f, $$const(d), $$const(d), j);
    };
  };
};
var toString = /* @__PURE__ */ toJsonType(caseJsonString);
var caseJsonObject = function(d) {
  return function(f) {
    return function(j) {
      return _caseJson($$const(d), $$const(d), $$const(d), $$const(d), $$const(d), f, j);
    };
  };
};
var toObject = /* @__PURE__ */ toJsonType(caseJsonObject);
var caseJsonNumber = function(d) {
  return function(f) {
    return function(j) {
      return _caseJson($$const(d), $$const(d), f, $$const(d), $$const(d), $$const(d), j);
    };
  };
};
var toNumber = /* @__PURE__ */ toJsonType(caseJsonNumber);
var caseJsonNull = function(d) {
  return function(f) {
    return function(j) {
      return _caseJson(f, $$const(d), $$const(d), $$const(d), $$const(d), $$const(d), j);
    };
  };
};
var isNull = /* @__PURE__ */ isJsonType(caseJsonNull);
var caseJsonBoolean = function(d) {
  return function(f) {
    return function(j) {
      return _caseJson($$const(d), f, $$const(d), $$const(d), $$const(d), $$const(d), j);
    };
  };
};
var toBoolean = /* @__PURE__ */ toJsonType(caseJsonBoolean);
var caseJsonArray = function(d) {
  return function(f) {
    return function(j) {
      return _caseJson($$const(d), $$const(d), $$const(d), $$const(d), f, $$const(d), j);
    };
  };
};
var toArray = /* @__PURE__ */ toJsonType(caseJsonArray);
var caseJson = function(a) {
  return function(b) {
    return function(c) {
      return function(d) {
        return function(e) {
          return function(f) {
            return function(json) {
              return _caseJson(a, b, c, d, e, f, json);
            };
          };
        };
      };
    };
  };
};

// output/Data.Argonaut.Parser/foreign.js
function _jsonParser(fail, succ, s) {
  try {
    return succ(JSON.parse(s));
  } catch (e) {
    return fail(e.message);
  }
}

// output/Data.Argonaut.Parser/index.js
var jsonParser = function(j) {
  return _jsonParser(Left.create, Right.create, j);
};

// output/Data.BigInt/foreign.js
var import_big_integer = __toESM(require_BigInteger(), 1);
function fromBaseImpl(just) {
  return function(nothing) {
    return function(b) {
      return function(s) {
        try {
          var x = (0, import_big_integer.default)(s, b);
          return just(x);
        } catch (err) {
          return nothing;
        }
      };
    };
  };
}
function fromInt(n) {
  return (0, import_big_integer.default)(n);
}
function toBase(base) {
  return function(x) {
    return x.toString(base);
  };
}
function toNumber2(x) {
  return x.toJSNumber();
}
function biAdd(x) {
  return function(y) {
    return x.add(y);
  };
}
function biMul(x) {
  return function(y) {
    return x.multiply(y);
  };
}
function biSub(x) {
  return function(y) {
    return x.minus(y);
  };
}
function biMod(x) {
  return function(y) {
    return x.mod(y);
  };
}
function biDiv(x) {
  return function(y) {
    return x.divide(y);
  };
}
function biEquals(x) {
  return function(y) {
    return x.equals(y);
  };
}
function biCompare(x) {
  return function(y) {
    return x.compare(y);
  };
}
function abs(x) {
  return x.abs();
}

// output/Data.Int/foreign.js
var fromNumberImpl = function(just) {
  return function(nothing) {
    return function(n) {
      return (n | 0) === n ? just(n) : nothing;
    };
  };
};
var toNumber3 = function(n) {
  return n;
};
var fromStringAsImpl = function(just) {
  return function(nothing) {
    return function(radix) {
      var digits;
      if (radix < 11) {
        digits = "[0-" + (radix - 1).toString() + "]";
      } else if (radix === 11) {
        digits = "[0-9a]";
      } else {
        digits = "[0-9a-" + String.fromCharCode(86 + radix) + "]";
      }
      var pattern = new RegExp("^[\\+\\-]?" + digits + "+$", "i");
      return function(s) {
        if (pattern.test(s)) {
          var i = parseInt(s, radix);
          return (i | 0) === i ? just(i) : nothing;
        } else {
          return nothing;
        }
      };
    };
  };
};

// output/Data.Number/foreign.js
var isFiniteImpl = isFinite;
var floor = Math.floor;

// output/Data.Int/index.js
var top2 = /* @__PURE__ */ top(boundedInt);
var bottom2 = /* @__PURE__ */ bottom(boundedInt);
var fromStringAs = /* @__PURE__ */ (function() {
  return fromStringAsImpl(Just.create)(Nothing.value);
})();
var fromString = /* @__PURE__ */ fromStringAs(10);
var fromNumber = /* @__PURE__ */ (function() {
  return fromNumberImpl(Just.create)(Nothing.value);
})();
var unsafeClamp = function(x) {
  if (!isFiniteImpl(x)) {
    return 0;
  }
  ;
  if (x >= toNumber3(top2)) {
    return top2;
  }
  ;
  if (x <= toNumber3(bottom2)) {
    return bottom2;
  }
  ;
  if (otherwise) {
    return fromMaybe(0)(fromNumber(x));
  }
  ;
  throw new Error("Failed pattern match at Data.Int (line 72, column 1 - line 72, column 29): " + [x.constructor.name]);
};
var floor2 = function($39) {
  return unsafeClamp(floor($39));
};

// output/Data.String.CodeUnits/foreign.js
var length2 = function(s) {
  return s.length;
};
var splitAt = function(i) {
  return function(s) {
    return { before: s.substring(0, i), after: s.substring(i) };
  };
};

// output/Data.String.CodeUnits/index.js
var stripPrefix = function(v) {
  return function(str) {
    var v1 = splitAt(length2(v))(str);
    var $20 = v1.before === v;
    if ($20) {
      return new Just(v1.after);
    }
    ;
    return Nothing.value;
  };
};

// output/Data.String.Common/foreign.js
var split = function(sep) {
  return function(s) {
    return s.split(sep);
  };
};

// output/Data.BigInt/index.js
var toString2 = /* @__PURE__ */ toBase(10);
var toInt = function($12) {
  return fromNumber(toNumber2($12));
};
var showBigInt = {
  show: function(x) {
    return '(fromString "' + (toString2(x) + '")');
  }
};
var semiringBigInt = {
  add: biAdd,
  zero: /* @__PURE__ */ fromInt(0),
  mul: biMul,
  one: /* @__PURE__ */ fromInt(1)
};
var add2 = /* @__PURE__ */ add(semiringBigInt);
var ringBigInt = {
  sub: biSub,
  Semiring0: function() {
    return semiringBigInt;
  }
};
var sub2 = /* @__PURE__ */ sub(ringBigInt);
var rem2 = biMod;
var quot2 = biDiv;
var fromBase = /* @__PURE__ */ (function() {
  return fromBaseImpl(Just.create)(Nothing.value);
})();
var fromString3 = /* @__PURE__ */ fromBase(10);
var eqBigInt = {
  eq: biEquals
};
var ordBigInt = {
  compare: function(x) {
    return function(y) {
      var v = biCompare(x)(y);
      if (v === 1) {
        return GT.value;
      }
      ;
      if (v === 0) {
        return EQ.value;
      }
      ;
      return LT.value;
    };
  },
  Eq0: function() {
    return eqBigInt;
  }
};
var commutativeRingBigInt = {
  Ring0: function() {
    return ringBigInt;
  }
};
var euclideanRingBigInt = {
  div: function(x) {
    return function(y) {
      return biDiv(sub2(x)(mod(euclideanRingBigInt)(x)(y)))(y);
    };
  },
  mod: function(x) {
    return function(y) {
      var yy = abs(y);
      return biMod(add2(biMod(x)(yy))(yy))(yy);
    };
  },
  degree: function($13) {
    return floor2(toNumber2(abs($13)));
  },
  CommutativeRing0: function() {
    return commutativeRingBigInt;
  }
};

// output/Data.List.Types/index.js
var Nil = /* @__PURE__ */ (function() {
  function Nil2() {
  }
  ;
  Nil2.value = new Nil2();
  return Nil2;
})();
var Cons = /* @__PURE__ */ (function() {
  function Cons2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  Cons2.create = function(value0) {
    return function(value1) {
      return new Cons2(value0, value1);
    };
  };
  return Cons2;
})();
var listMap = function(f) {
  var chunkedRevMap = function($copy_v) {
    return function($copy_v1) {
      var $tco_var_v = $copy_v;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v, v1) {
        if (v1 instanceof Cons && (v1.value1 instanceof Cons && v1.value1.value1 instanceof Cons)) {
          $tco_var_v = new Cons(v1, v);
          $copy_v1 = v1.value1.value1.value1;
          return;
        }
        ;
        var unrolledMap = function(v2) {
          if (v2 instanceof Cons && (v2.value1 instanceof Cons && v2.value1.value1 instanceof Nil)) {
            return new Cons(f(v2.value0), new Cons(f(v2.value1.value0), Nil.value));
          }
          ;
          if (v2 instanceof Cons && v2.value1 instanceof Nil) {
            return new Cons(f(v2.value0), Nil.value);
          }
          ;
          return Nil.value;
        };
        var reverseUnrolledMap = function($copy_v2) {
          return function($copy_v3) {
            var $tco_var_v2 = $copy_v2;
            var $tco_done1 = false;
            var $tco_result2;
            function $tco_loop2(v2, v3) {
              if (v2 instanceof Cons && (v2.value0 instanceof Cons && (v2.value0.value1 instanceof Cons && v2.value0.value1.value1 instanceof Cons))) {
                $tco_var_v2 = v2.value1;
                $copy_v3 = new Cons(f(v2.value0.value0), new Cons(f(v2.value0.value1.value0), new Cons(f(v2.value0.value1.value1.value0), v3)));
                return;
              }
              ;
              $tco_done1 = true;
              return v3;
            }
            ;
            while (!$tco_done1) {
              $tco_result2 = $tco_loop2($tco_var_v2, $copy_v3);
            }
            ;
            return $tco_result2;
          };
        };
        $tco_done = true;
        return reverseUnrolledMap(v)(unrolledMap(v1));
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_v, $copy_v1);
      }
      ;
      return $tco_result;
    };
  };
  return chunkedRevMap(Nil.value);
};
var functorList = {
  map: listMap
};
var foldableList = {
  foldr: function(f) {
    return function(b) {
      var rev = (function() {
        var go = function($copy_v) {
          return function($copy_v1) {
            var $tco_var_v = $copy_v;
            var $tco_done = false;
            var $tco_result;
            function $tco_loop(v, v1) {
              if (v1 instanceof Nil) {
                $tco_done = true;
                return v;
              }
              ;
              if (v1 instanceof Cons) {
                $tco_var_v = new Cons(v1.value0, v);
                $copy_v1 = v1.value1;
                return;
              }
              ;
              throw new Error("Failed pattern match at Data.List.Types (line 107, column 7 - line 107, column 23): " + [v.constructor.name, v1.constructor.name]);
            }
            ;
            while (!$tco_done) {
              $tco_result = $tco_loop($tco_var_v, $copy_v1);
            }
            ;
            return $tco_result;
          };
        };
        return go(Nil.value);
      })();
      var $284 = foldl(foldableList)(flip(f))(b);
      return function($285) {
        return $284(rev($285));
      };
    };
  },
  foldl: function(f) {
    var go = function($copy_b) {
      return function($copy_v) {
        var $tco_var_b = $copy_b;
        var $tco_done1 = false;
        var $tco_result;
        function $tco_loop(b, v) {
          if (v instanceof Nil) {
            $tco_done1 = true;
            return b;
          }
          ;
          if (v instanceof Cons) {
            $tco_var_b = f(b)(v.value0);
            $copy_v = v.value1;
            return;
          }
          ;
          throw new Error("Failed pattern match at Data.List.Types (line 111, column 12 - line 113, column 30): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done1) {
          $tco_result = $tco_loop($tco_var_b, $copy_v);
        }
        ;
        return $tco_result;
      };
    };
    return go;
  },
  foldMap: function(dictMonoid) {
    var append22 = append(dictMonoid.Semigroup0());
    var mempty4 = mempty(dictMonoid);
    return function(f) {
      return foldl(foldableList)(function(acc) {
        var $286 = append22(acc);
        return function($287) {
          return $286(f($287));
        };
      })(mempty4);
    };
  }
};
var foldr2 = /* @__PURE__ */ foldr(foldableList);
var semigroupList = {
  append: function(xs) {
    return function(ys) {
      return foldr2(Cons.create)(ys)(xs);
    };
  }
};
var monoidList = /* @__PURE__ */ (function() {
  return {
    mempty: Nil.value,
    Semigroup0: function() {
      return semigroupList;
    }
  };
})();

// output/Data.List/index.js
var map5 = /* @__PURE__ */ map(functorMaybe);
var foldl3 = /* @__PURE__ */ foldl(foldableList);
var uncons2 = function(v) {
  if (v instanceof Nil) {
    return Nothing.value;
  }
  ;
  if (v instanceof Cons) {
    return new Just({
      head: v.value0,
      tail: v.value1
    });
  }
  ;
  throw new Error("Failed pattern match at Data.List (line 259, column 1 - line 259, column 66): " + [v.constructor.name]);
};
var toUnfoldable3 = function(dictUnfoldable) {
  return unfoldr(dictUnfoldable)(function(xs) {
    return map5(function(rec) {
      return new Tuple(rec.head, rec.tail);
    })(uncons2(xs));
  });
};
var reverse2 = /* @__PURE__ */ (function() {
  var go = function($copy_v) {
    return function($copy_v1) {
      var $tco_var_v = $copy_v;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v, v1) {
        if (v1 instanceof Nil) {
          $tco_done = true;
          return v;
        }
        ;
        if (v1 instanceof Cons) {
          $tco_var_v = new Cons(v1.value0, v);
          $copy_v1 = v1.value1;
          return;
        }
        ;
        throw new Error("Failed pattern match at Data.List (line 368, column 3 - line 368, column 19): " + [v.constructor.name, v1.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_v, $copy_v1);
      }
      ;
      return $tco_result;
    };
  };
  return go(Nil.value);
})();
var mapMaybe2 = function(f) {
  var go = function($copy_v) {
    return function($copy_v1) {
      var $tco_var_v = $copy_v;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v, v1) {
        if (v1 instanceof Nil) {
          $tco_done = true;
          return reverse2(v);
        }
        ;
        if (v1 instanceof Cons) {
          var v2 = f(v1.value0);
          if (v2 instanceof Nothing) {
            $tco_var_v = v;
            $copy_v1 = v1.value1;
            return;
          }
          ;
          if (v2 instanceof Just) {
            $tco_var_v = new Cons(v2.value0, v);
            $copy_v1 = v1.value1;
            return;
          }
          ;
          throw new Error("Failed pattern match at Data.List (line 419, column 5 - line 421, column 32): " + [v2.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Data.List (line 417, column 3 - line 417, column 27): " + [v.constructor.name, v1.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_v, $copy_v1);
      }
      ;
      return $tco_result;
    };
  };
  return go(Nil.value);
};
var length3 = /* @__PURE__ */ foldl3(function(acc) {
  return function(v) {
    return acc + 1 | 0;
  };
})(0);

// output/Data.Map.Internal/index.js
var $runtime_lazy2 = function(name, moduleName, init2) {
  var state = 0;
  var val;
  return function(lineNumber) {
    if (state === 2) return val;
    if (state === 1) throw new ReferenceError(name + " was needed before it finished initializing (module " + moduleName + ", line " + lineNumber + ")", moduleName, lineNumber);
    state = 1;
    val = init2();
    state = 2;
    return val;
  };
};
var Leaf = /* @__PURE__ */ (function() {
  function Leaf2() {
  }
  ;
  Leaf2.value = new Leaf2();
  return Leaf2;
})();
var Node = /* @__PURE__ */ (function() {
  function Node2(value0, value1, value2, value3, value4, value5) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
    this.value5 = value5;
  }
  ;
  Node2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return function(value4) {
            return function(value5) {
              return new Node2(value0, value1, value2, value3, value4, value5);
            };
          };
        };
      };
    };
  };
  return Node2;
})();
var IterLeaf = /* @__PURE__ */ (function() {
  function IterLeaf2() {
  }
  ;
  IterLeaf2.value = new IterLeaf2();
  return IterLeaf2;
})();
var IterEmit = /* @__PURE__ */ (function() {
  function IterEmit2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  IterEmit2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new IterEmit2(value0, value1, value2);
      };
    };
  };
  return IterEmit2;
})();
var IterNode = /* @__PURE__ */ (function() {
  function IterNode2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  IterNode2.create = function(value0) {
    return function(value1) {
      return new IterNode2(value0, value1);
    };
  };
  return IterNode2;
})();
var IterDone = /* @__PURE__ */ (function() {
  function IterDone2() {
  }
  ;
  IterDone2.value = new IterDone2();
  return IterDone2;
})();
var IterNext = /* @__PURE__ */ (function() {
  function IterNext2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  IterNext2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new IterNext2(value0, value1, value2);
      };
    };
  };
  return IterNext2;
})();
var Split = /* @__PURE__ */ (function() {
  function Split2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  Split2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new Split2(value0, value1, value2);
      };
    };
  };
  return Split2;
})();
var SplitLast = /* @__PURE__ */ (function() {
  function SplitLast2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  SplitLast2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new SplitLast2(value0, value1, value2);
      };
    };
  };
  return SplitLast2;
})();
var unsafeNode = function(k, v, l, r) {
  if (l instanceof Leaf) {
    if (r instanceof Leaf) {
      return new Node(1, 1, k, v, l, r);
    }
    ;
    if (r instanceof Node) {
      return new Node(1 + r.value0 | 0, 1 + r.value1 | 0, k, v, l, r);
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 702, column 5 - line 706, column 39): " + [r.constructor.name]);
  }
  ;
  if (l instanceof Node) {
    if (r instanceof Leaf) {
      return new Node(1 + l.value0 | 0, 1 + l.value1 | 0, k, v, l, r);
    }
    ;
    if (r instanceof Node) {
      return new Node(1 + (function() {
        var $280 = l.value0 > r.value0;
        if ($280) {
          return l.value0;
        }
        ;
        return r.value0;
      })() | 0, (1 + l.value1 | 0) + r.value1 | 0, k, v, l, r);
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 708, column 5 - line 712, column 68): " + [r.constructor.name]);
  }
  ;
  throw new Error("Failed pattern match at Data.Map.Internal (line 700, column 32 - line 712, column 68): " + [l.constructor.name]);
};
var toMapIter = /* @__PURE__ */ (function() {
  return flip(IterNode.create)(IterLeaf.value);
})();
var stepWith = function(f) {
  return function(next) {
    return function(done) {
      var go = function($copy_v) {
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(v) {
          if (v instanceof IterLeaf) {
            $tco_done = true;
            return done(unit);
          }
          ;
          if (v instanceof IterEmit) {
            $tco_done = true;
            return next(v.value0, v.value1, v.value2);
          }
          ;
          if (v instanceof IterNode) {
            $copy_v = f(v.value1)(v.value0);
            return;
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 940, column 8 - line 946, column 20): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($copy_v);
        }
        ;
        return $tco_result;
      };
      return go;
    };
  };
};
var size2 = function(v) {
  if (v instanceof Leaf) {
    return 0;
  }
  ;
  if (v instanceof Node) {
    return v.value1;
  }
  ;
  throw new Error("Failed pattern match at Data.Map.Internal (line 618, column 8 - line 620, column 24): " + [v.constructor.name]);
};
var singleton6 = function(k) {
  return function(v) {
    return new Node(1, 1, k, v, Leaf.value, Leaf.value);
  };
};
var unsafeBalancedNode = /* @__PURE__ */ (function() {
  var height = function(v) {
    if (v instanceof Leaf) {
      return 0;
    }
    ;
    if (v instanceof Node) {
      return v.value0;
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 757, column 12 - line 759, column 26): " + [v.constructor.name]);
  };
  var rotateLeft = function(k, v, l, rk, rv, rl, rr) {
    if (rl instanceof Node && rl.value0 > height(rr)) {
      return unsafeNode(rl.value2, rl.value3, unsafeNode(k, v, l, rl.value4), unsafeNode(rk, rv, rl.value5, rr));
    }
    ;
    return unsafeNode(rk, rv, unsafeNode(k, v, l, rl), rr);
  };
  var rotateRight = function(k, v, lk, lv, ll, lr, r) {
    if (lr instanceof Node && height(ll) <= lr.value0) {
      return unsafeNode(lr.value2, lr.value3, unsafeNode(lk, lv, ll, lr.value4), unsafeNode(k, v, lr.value5, r));
    }
    ;
    return unsafeNode(lk, lv, ll, unsafeNode(k, v, lr, r));
  };
  return function(k, v, l, r) {
    if (l instanceof Leaf) {
      if (r instanceof Leaf) {
        return singleton6(k)(v);
      }
      ;
      if (r instanceof Node && r.value0 > 1) {
        return rotateLeft(k, v, l, r.value2, r.value3, r.value4, r.value5);
      }
      ;
      return unsafeNode(k, v, l, r);
    }
    ;
    if (l instanceof Node) {
      if (r instanceof Node) {
        if (r.value0 > (l.value0 + 1 | 0)) {
          return rotateLeft(k, v, l, r.value2, r.value3, r.value4, r.value5);
        }
        ;
        if (l.value0 > (r.value0 + 1 | 0)) {
          return rotateRight(k, v, l.value2, l.value3, l.value4, l.value5, r);
        }
        ;
      }
      ;
      if (r instanceof Leaf && l.value0 > 1) {
        return rotateRight(k, v, l.value2, l.value3, l.value4, l.value5, r);
      }
      ;
      return unsafeNode(k, v, l, r);
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 717, column 40 - line 738, column 34): " + [l.constructor.name]);
  };
})();
var $lazy_unsafeSplit = /* @__PURE__ */ $runtime_lazy2("unsafeSplit", "Data.Map.Internal", function() {
  return function(comp, k, m) {
    if (m instanceof Leaf) {
      return new Split(Nothing.value, Leaf.value, Leaf.value);
    }
    ;
    if (m instanceof Node) {
      var v = comp(k)(m.value2);
      if (v instanceof LT) {
        var v1 = $lazy_unsafeSplit(793)(comp, k, m.value4);
        return new Split(v1.value0, v1.value1, unsafeBalancedNode(m.value2, m.value3, v1.value2, m.value5));
      }
      ;
      if (v instanceof GT) {
        var v1 = $lazy_unsafeSplit(796)(comp, k, m.value5);
        return new Split(v1.value0, unsafeBalancedNode(m.value2, m.value3, m.value4, v1.value1), v1.value2);
      }
      ;
      if (v instanceof EQ) {
        return new Split(new Just(m.value3), m.value4, m.value5);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 791, column 5 - line 799, column 30): " + [v.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 787, column 34 - line 799, column 30): " + [m.constructor.name]);
  };
});
var unsafeSplit = /* @__PURE__ */ $lazy_unsafeSplit(786);
var $lazy_unsafeSplitLast = /* @__PURE__ */ $runtime_lazy2("unsafeSplitLast", "Data.Map.Internal", function() {
  return function(k, v, l, r) {
    if (r instanceof Leaf) {
      return new SplitLast(k, v, l);
    }
    ;
    if (r instanceof Node) {
      var v1 = $lazy_unsafeSplitLast(779)(r.value2, r.value3, r.value4, r.value5);
      return new SplitLast(v1.value0, v1.value1, unsafeBalancedNode(k, v, l, v1.value2));
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 776, column 37 - line 780, column 57): " + [r.constructor.name]);
  };
});
var unsafeSplitLast = /* @__PURE__ */ $lazy_unsafeSplitLast(775);
var unsafeJoinNodes = function(v, v1) {
  if (v instanceof Leaf) {
    return v1;
  }
  ;
  if (v instanceof Node) {
    var v2 = unsafeSplitLast(v.value2, v.value3, v.value4, v.value5);
    return unsafeBalancedNode(v2.value0, v2.value1, v2.value2, v1);
  }
  ;
  throw new Error("Failed pattern match at Data.Map.Internal (line 764, column 25 - line 768, column 38): " + [v.constructor.name, v1.constructor.name]);
};
var $lazy_unsafeUnionWith = /* @__PURE__ */ $runtime_lazy2("unsafeUnionWith", "Data.Map.Internal", function() {
  return function(comp, app, l, r) {
    if (l instanceof Leaf) {
      return r;
    }
    ;
    if (r instanceof Leaf) {
      return l;
    }
    ;
    if (r instanceof Node) {
      var v = unsafeSplit(comp, r.value2, l);
      var l$prime = $lazy_unsafeUnionWith(809)(comp, app, v.value1, r.value4);
      var r$prime = $lazy_unsafeUnionWith(810)(comp, app, v.value2, r.value5);
      if (v.value0 instanceof Just) {
        return unsafeBalancedNode(r.value2, app(v.value0.value0)(r.value3), l$prime, r$prime);
      }
      ;
      if (v.value0 instanceof Nothing) {
        return unsafeBalancedNode(r.value2, r.value3, l$prime, r$prime);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 811, column 5 - line 815, column 46): " + [v.value0.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 804, column 42 - line 815, column 46): " + [l.constructor.name, r.constructor.name]);
  };
});
var unsafeUnionWith = /* @__PURE__ */ $lazy_unsafeUnionWith(803);
var unionWith = function(dictOrd) {
  var compare6 = compare(dictOrd);
  return function(app) {
    return function(m1) {
      return function(m2) {
        return unsafeUnionWith(compare6, app, m1, m2);
      };
    };
  };
};
var union = function(dictOrd) {
  return unionWith(dictOrd)($$const);
};
var member2 = function(dictOrd) {
  var compare6 = compare(dictOrd);
  return function(k) {
    var go = function($copy_v) {
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v) {
        if (v instanceof Leaf) {
          $tco_done = true;
          return false;
        }
        ;
        if (v instanceof Node) {
          var v1 = compare6(k)(v.value2);
          if (v1 instanceof LT) {
            $copy_v = v.value4;
            return;
          }
          ;
          if (v1 instanceof GT) {
            $copy_v = v.value5;
            return;
          }
          ;
          if (v1 instanceof EQ) {
            $tco_done = true;
            return true;
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 459, column 7 - line 462, column 19): " + [v1.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 456, column 8 - line 462, column 19): " + [v.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($copy_v);
      }
      ;
      return $tco_result;
    };
    return go;
  };
};
var lookup2 = function(dictOrd) {
  var compare6 = compare(dictOrd);
  return function(k) {
    var go = function($copy_v) {
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v) {
        if (v instanceof Leaf) {
          $tco_done = true;
          return Nothing.value;
        }
        ;
        if (v instanceof Node) {
          var v1 = compare6(k)(v.value2);
          if (v1 instanceof LT) {
            $copy_v = v.value4;
            return;
          }
          ;
          if (v1 instanceof GT) {
            $copy_v = v.value5;
            return;
          }
          ;
          if (v1 instanceof EQ) {
            $tco_done = true;
            return new Just(v.value3);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 283, column 7 - line 286, column 22): " + [v1.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 280, column 8 - line 286, column 22): " + [v.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($copy_v);
      }
      ;
      return $tco_result;
    };
    return go;
  };
};
var iterMapL = /* @__PURE__ */ (function() {
  var go = function($copy_iter) {
    return function($copy_v) {
      var $tco_var_iter = $copy_iter;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(iter, v) {
        if (v instanceof Leaf) {
          $tco_done = true;
          return iter;
        }
        ;
        if (v instanceof Node) {
          if (v.value5 instanceof Leaf) {
            $tco_var_iter = new IterEmit(v.value2, v.value3, iter);
            $copy_v = v.value4;
            return;
          }
          ;
          $tco_var_iter = new IterEmit(v.value2, v.value3, new IterNode(v.value5, iter));
          $copy_v = v.value4;
          return;
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 951, column 13 - line 958, column 48): " + [v.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_iter, $copy_v);
      }
      ;
      return $tco_result;
    };
  };
  return go;
})();
var stepAscCps = /* @__PURE__ */ stepWith(iterMapL);
var stepAsc = /* @__PURE__ */ (function() {
  return stepAscCps(function(k, v, next) {
    return new IterNext(k, v, next);
  })($$const(IterDone.value));
})();
var eqMapIter = function(dictEq) {
  var eq14 = eq(dictEq);
  return function(dictEq1) {
    var eq25 = eq(dictEq1);
    return {
      eq: /* @__PURE__ */ (function() {
        var go = function($copy_a) {
          return function($copy_b) {
            var $tco_var_a = $copy_a;
            var $tco_done = false;
            var $tco_result;
            function $tco_loop(a, b) {
              var v = stepAsc(a);
              if (v instanceof IterNext) {
                var v2 = stepAsc(b);
                if (v2 instanceof IterNext && (eq14(v.value0)(v2.value0) && eq25(v.value1)(v2.value1))) {
                  $tco_var_a = v.value2;
                  $copy_b = v2.value2;
                  return;
                }
                ;
                $tco_done = true;
                return false;
              }
              ;
              if (v instanceof IterDone) {
                $tco_done = true;
                return true;
              }
              ;
              throw new Error("Failed pattern match at Data.Map.Internal (line 859, column 14 - line 868, column 13): " + [v.constructor.name]);
            }
            ;
            while (!$tco_done) {
              $tco_result = $tco_loop($tco_var_a, $copy_b);
            }
            ;
            return $tco_result;
          };
        };
        return go;
      })()
    };
  };
};
var ordMapIter = function(dictOrd) {
  var compare6 = compare(dictOrd);
  var eqMapIter1 = eqMapIter(dictOrd.Eq0());
  return function(dictOrd1) {
    var compare13 = compare(dictOrd1);
    var eqMapIter2 = eqMapIter1(dictOrd1.Eq0());
    return {
      compare: /* @__PURE__ */ (function() {
        var go = function($copy_a) {
          return function($copy_b) {
            var $tco_var_a = $copy_a;
            var $tco_done = false;
            var $tco_result;
            function $tco_loop(a, b) {
              var v = stepAsc(b);
              var v1 = stepAsc(a);
              if (v1 instanceof IterNext && v instanceof IterNext) {
                var v3 = compare6(v1.value0)(v.value0);
                if (v3 instanceof EQ) {
                  var v4 = compare13(v1.value1)(v.value1);
                  if (v4 instanceof EQ) {
                    $tco_var_a = v1.value2;
                    $copy_b = v.value2;
                    return;
                  }
                  ;
                  $tco_done = true;
                  return v4;
                }
                ;
                $tco_done = true;
                return v3;
              }
              ;
              if (v1 instanceof IterDone) {
                if (v instanceof IterDone) {
                  $tco_done = true;
                  return EQ.value;
                }
                ;
                $tco_done = true;
                return LT.value;
              }
              ;
              if (v instanceof IterDone) {
                $tco_done = true;
                return GT.value;
              }
              ;
              throw new Error("Failed pattern match at Data.Map.Internal (line 873, column 14 - line 891, column 11): " + [v1.constructor.name, v.constructor.name]);
            }
            ;
            while (!$tco_done) {
              $tco_result = $tco_loop($tco_var_a, $copy_b);
            }
            ;
            return $tco_result;
          };
        };
        return go;
      })(),
      Eq0: function() {
        return eqMapIter2;
      }
    };
  };
};
var stepUnfoldr = /* @__PURE__ */ (function() {
  var step = function(k, v, next) {
    return new Just(new Tuple(new Tuple(k, v), next));
  };
  return stepAscCps(step)(function(v) {
    return Nothing.value;
  });
})();
var toUnfoldable4 = function(dictUnfoldable) {
  var $784 = unfoldr(dictUnfoldable)(stepUnfoldr);
  return function($785) {
    return $784(toMapIter($785));
  };
};
var toUnfoldable1 = /* @__PURE__ */ toUnfoldable4(unfoldableArray);
var showMap = function(dictShow) {
  var showTuple2 = showTuple(dictShow);
  return function(dictShow1) {
    var show112 = show(showArray(showTuple2(dictShow1)));
    return {
      show: function(as) {
        return "(fromFoldable " + (show112(toUnfoldable1(as)) + ")");
      }
    };
  };
};
var isEmpty2 = function(v) {
  if (v instanceof Leaf) {
    return true;
  }
  ;
  return false;
};
var insert = function(dictOrd) {
  var compare6 = compare(dictOrd);
  return function(k) {
    return function(v) {
      var go = function(v1) {
        if (v1 instanceof Leaf) {
          return singleton6(k)(v);
        }
        ;
        if (v1 instanceof Node) {
          var v2 = compare6(k)(v1.value2);
          if (v2 instanceof LT) {
            return unsafeBalancedNode(v1.value2, v1.value3, go(v1.value4), v1.value5);
          }
          ;
          if (v2 instanceof GT) {
            return unsafeBalancedNode(v1.value2, v1.value3, v1.value4, go(v1.value5));
          }
          ;
          if (v2 instanceof EQ) {
            return new Node(v1.value0, v1.value1, k, v, v1.value4, v1.value5);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 471, column 7 - line 474, column 35): " + [v2.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 468, column 8 - line 474, column 35): " + [v1.constructor.name]);
      };
      return go;
    };
  };
};
var functorMap = {
  map: function(f) {
    var go = function(v) {
      if (v instanceof Leaf) {
        return Leaf.value;
      }
      ;
      if (v instanceof Node) {
        return new Node(v.value0, v.value1, v.value2, f(v.value3), go(v.value4), go(v.value5));
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 147, column 10 - line 150, column 39): " + [v.constructor.name]);
    };
    return go;
  }
};
var foldableMap = {
  foldr: function(f) {
    return function(z) {
      var $lazy_go = $runtime_lazy2("go", "Data.Map.Internal", function() {
        return function(m$prime, z$prime) {
          if (m$prime instanceof Leaf) {
            return z$prime;
          }
          ;
          if (m$prime instanceof Node) {
            return $lazy_go(172)(m$prime.value4, f(m$prime.value3)($lazy_go(172)(m$prime.value5, z$prime)));
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 169, column 26 - line 172, column 43): " + [m$prime.constructor.name]);
        };
      });
      var go = $lazy_go(169);
      return function(m) {
        return go(m, z);
      };
    };
  },
  foldl: function(f) {
    return function(z) {
      var $lazy_go = $runtime_lazy2("go", "Data.Map.Internal", function() {
        return function(z$prime, m$prime) {
          if (m$prime instanceof Leaf) {
            return z$prime;
          }
          ;
          if (m$prime instanceof Node) {
            return $lazy_go(178)(f($lazy_go(178)(z$prime, m$prime.value4))(m$prime.value3), m$prime.value5);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 175, column 26 - line 178, column 43): " + [m$prime.constructor.name]);
        };
      });
      var go = $lazy_go(175);
      return function(m) {
        return go(z, m);
      };
    };
  },
  foldMap: function(dictMonoid) {
    var mempty4 = mempty(dictMonoid);
    var append12 = append(dictMonoid.Semigroup0());
    return function(f) {
      var go = function(v) {
        if (v instanceof Leaf) {
          return mempty4;
        }
        ;
        if (v instanceof Node) {
          return append12(go(v.value4))(append12(f(v.value3))(go(v.value5)));
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 181, column 10 - line 184, column 28): " + [v.constructor.name]);
      };
      return go;
    };
  }
};
var foldableWithIndexMap = {
  foldrWithIndex: function(f) {
    return function(z) {
      var $lazy_go = $runtime_lazy2("go", "Data.Map.Internal", function() {
        return function(m$prime, z$prime) {
          if (m$prime instanceof Leaf) {
            return z$prime;
          }
          ;
          if (m$prime instanceof Node) {
            return $lazy_go(192)(m$prime.value4, f(m$prime.value2)(m$prime.value3)($lazy_go(192)(m$prime.value5, z$prime)));
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 189, column 26 - line 192, column 45): " + [m$prime.constructor.name]);
        };
      });
      var go = $lazy_go(189);
      return function(m) {
        return go(m, z);
      };
    };
  },
  foldlWithIndex: function(f) {
    return function(z) {
      var $lazy_go = $runtime_lazy2("go", "Data.Map.Internal", function() {
        return function(z$prime, m$prime) {
          if (m$prime instanceof Leaf) {
            return z$prime;
          }
          ;
          if (m$prime instanceof Node) {
            return $lazy_go(198)(f(m$prime.value2)($lazy_go(198)(z$prime, m$prime.value4))(m$prime.value3), m$prime.value5);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 195, column 26 - line 198, column 45): " + [m$prime.constructor.name]);
        };
      });
      var go = $lazy_go(195);
      return function(m) {
        return go(z, m);
      };
    };
  },
  foldMapWithIndex: function(dictMonoid) {
    var mempty4 = mempty(dictMonoid);
    var append12 = append(dictMonoid.Semigroup0());
    return function(f) {
      var go = function(v) {
        if (v instanceof Leaf) {
          return mempty4;
        }
        ;
        if (v instanceof Node) {
          return append12(go(v.value4))(append12(f(v.value2)(v.value3))(go(v.value5)));
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 201, column 10 - line 204, column 30): " + [v.constructor.name]);
      };
      return go;
    };
  },
  Foldable0: function() {
    return foldableMap;
  }
};
var keys2 = /* @__PURE__ */ (function() {
  return foldrWithIndex(foldableWithIndexMap)(function(k) {
    return function(v) {
      return function(acc) {
        return new Cons(k, acc);
      };
    };
  })(Nil.value);
})();
var values = /* @__PURE__ */ (function() {
  return foldr(foldableMap)(Cons.create)(Nil.value);
})();
var filterWithKey = function(dictOrd) {
  return function(f) {
    var go = function(v) {
      if (v instanceof Leaf) {
        return Leaf.value;
      }
      ;
      if (v instanceof Node) {
        if (f(v.value2)(v.value3)) {
          return unsafeBalancedNode(v.value2, v.value3, go(v.value4), go(v.value5));
        }
        ;
        if (otherwise) {
          return unsafeJoinNodes(go(v.value4), go(v.value5));
        }
        ;
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 627, column 8 - line 633, column 47): " + [v.constructor.name]);
    };
    return go;
  };
};
var filterKeys = function(dictOrd) {
  return function(f) {
    var go = function(v) {
      if (v instanceof Leaf) {
        return Leaf.value;
      }
      ;
      if (v instanceof Node) {
        if (f(v.value2)) {
          return unsafeBalancedNode(v.value2, v.value3, go(v.value4), go(v.value5));
        }
        ;
        if (otherwise) {
          return unsafeJoinNodes(go(v.value4), go(v.value5));
        }
        ;
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 640, column 8 - line 646, column 47): " + [v.constructor.name]);
    };
    return go;
  };
};
var filter2 = function(dictOrd) {
  var $786 = filterWithKey(dictOrd);
  return function($787) {
    return $786($$const($787));
  };
};
var eqMap = function(dictEq) {
  var eqMapIter1 = eqMapIter(dictEq);
  return function(dictEq1) {
    var eq14 = eq(eqMapIter1(dictEq1));
    return {
      eq: function(xs) {
        return function(ys) {
          if (xs instanceof Leaf) {
            if (ys instanceof Leaf) {
              return true;
            }
            ;
            return false;
          }
          ;
          if (xs instanceof Node) {
            if (ys instanceof Node && xs.value1 === ys.value1) {
              return eq14(toMapIter(xs))(toMapIter(ys));
            }
            ;
            return false;
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 94, column 14 - line 105, column 16): " + [xs.constructor.name]);
        };
      }
    };
  };
};
var ordMap = function(dictOrd) {
  var ordMapIter1 = ordMapIter(dictOrd);
  var eqMap1 = eqMap(dictOrd.Eq0());
  return function(dictOrd1) {
    var compare6 = compare(ordMapIter1(dictOrd1));
    var eqMap22 = eqMap1(dictOrd1.Eq0());
    return {
      compare: function(xs) {
        return function(ys) {
          if (xs instanceof Leaf) {
            if (ys instanceof Leaf) {
              return EQ.value;
            }
            ;
            return LT.value;
          }
          ;
          if (ys instanceof Leaf) {
            return GT.value;
          }
          ;
          return compare6(toMapIter(xs))(toMapIter(ys));
        };
      },
      Eq0: function() {
        return eqMap22;
      }
    };
  };
};
var empty3 = /* @__PURE__ */ (function() {
  return Leaf.value;
})();
var fromFoldable3 = function(dictOrd) {
  var insert12 = insert(dictOrd);
  return function(dictFoldable) {
    return foldl(dictFoldable)(function(m) {
      return function(v) {
        return insert12(v.value0)(v.value1)(m);
      };
    })(empty3);
  };
};
var $$delete = function(dictOrd) {
  var compare6 = compare(dictOrd);
  return function(k) {
    var go = function(v) {
      if (v instanceof Leaf) {
        return Leaf.value;
      }
      ;
      if (v instanceof Node) {
        var v1 = compare6(k)(v.value2);
        if (v1 instanceof LT) {
          return unsafeBalancedNode(v.value2, v.value3, go(v.value4), v.value5);
        }
        ;
        if (v1 instanceof GT) {
          return unsafeBalancedNode(v.value2, v.value3, v.value4, go(v.value5));
        }
        ;
        if (v1 instanceof EQ) {
          return unsafeJoinNodes(v.value4, v.value5);
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 498, column 7 - line 501, column 43): " + [v1.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 495, column 8 - line 501, column 43): " + [v.constructor.name]);
    };
    return go;
  };
};

// output/Data.Set/index.js
var coerce3 = /* @__PURE__ */ coerce();
var $$Set = function(x) {
  return x;
};
var union2 = function(dictOrd) {
  return coerce3(union(dictOrd));
};
var toList = function(v) {
  return keys2(v);
};
var toUnfoldable5 = function(dictUnfoldable) {
  var $96 = toUnfoldable3(dictUnfoldable);
  return function($97) {
    return $96(toList($97));
  };
};
var semigroupSet = function(dictOrd) {
  return {
    append: union2(dictOrd)
  };
};
var member3 = function(dictOrd) {
  return coerce3(member2(dictOrd));
};
var insert2 = function(dictOrd) {
  var insert12 = insert(dictOrd);
  return function(a) {
    return function(v) {
      return insert12(a)(unit)(v);
    };
  };
};
var fromMap = $$Set;
var filter3 = function(dictOrd) {
  return coerce3(filterKeys(dictOrd));
};
var empty4 = empty3;
var fromFoldable4 = function(dictFoldable) {
  var foldl22 = foldl(dictFoldable);
  return function(dictOrd) {
    var insert12 = insert2(dictOrd);
    return foldl22(function(m) {
      return function(a) {
        return insert12(a)(m);
      };
    })(empty4);
  };
};
var monoidSet = function(dictOrd) {
  var semigroupSet1 = semigroupSet(dictOrd);
  return {
    mempty: empty4,
    Semigroup0: function() {
      return semigroupSet1;
    }
  };
};
var $$delete2 = function(dictOrd) {
  return coerce3($$delete(dictOrd));
};

// output/FinVM.Error/index.js
var show2 = /* @__PURE__ */ show(showInt);
var InvalidProgram = /* @__PURE__ */ (function() {
  function InvalidProgram2() {
  }
  ;
  InvalidProgram2.value = new InvalidProgram2();
  return InvalidProgram2;
})();
var InvalidInstruction = /* @__PURE__ */ (function() {
  function InvalidInstruction2() {
  }
  ;
  InvalidInstruction2.value = new InvalidInstruction2();
  return InvalidInstruction2;
})();
var InvalidRegister = /* @__PURE__ */ (function() {
  function InvalidRegister2() {
  }
  ;
  InvalidRegister2.value = new InvalidRegister2();
  return InvalidRegister2;
})();
var InvalidJump = /* @__PURE__ */ (function() {
  function InvalidJump2() {
  }
  ;
  InvalidJump2.value = new InvalidJump2();
  return InvalidJump2;
})();
var UnknownFunction = /* @__PURE__ */ (function() {
  function UnknownFunction2() {
  }
  ;
  UnknownFunction2.value = new UnknownFunction2();
  return UnknownFunction2;
})();
var UnknownBuiltin = /* @__PURE__ */ (function() {
  function UnknownBuiltin2() {
  }
  ;
  UnknownBuiltin2.value = new UnknownBuiltin2();
  return UnknownBuiltin2;
})();
var ArityMismatch = /* @__PURE__ */ (function() {
  function ArityMismatch2() {
  }
  ;
  ArityMismatch2.value = new ArityMismatch2();
  return ArityMismatch2;
})();
var TypeMismatch = /* @__PURE__ */ (function() {
  function TypeMismatch2() {
  }
  ;
  TypeMismatch2.value = new TypeMismatch2();
  return TypeMismatch2;
})();
var DivisionByZero = /* @__PURE__ */ (function() {
  function DivisionByZero2() {
  }
  ;
  DivisionByZero2.value = new DivisionByZero2();
  return DivisionByZero2;
})();
var ArithmeticOverflow = /* @__PURE__ */ (function() {
  function ArithmeticOverflow2() {
  }
  ;
  ArithmeticOverflow2.value = new ArithmeticOverflow2();
  return ArithmeticOverflow2;
})();
var ArithmeticError = /* @__PURE__ */ (function() {
  function ArithmeticError2() {
  }
  ;
  ArithmeticError2.value = new ArithmeticError2();
  return ArithmeticError2;
})();
var NoModularInverse = /* @__PURE__ */ (function() {
  function NoModularInverse2() {
  }
  ;
  NoModularInverse2.value = new NoModularInverse2();
  return NoModularInverse2;
})();
var InvalidRoundingMode = /* @__PURE__ */ (function() {
  function InvalidRoundingMode2() {
  }
  ;
  InvalidRoundingMode2.value = new InvalidRoundingMode2();
  return InvalidRoundingMode2;
})();
var MissingInput = /* @__PURE__ */ (function() {
  function MissingInput2() {
  }
  ;
  MissingInput2.value = new MissingInput2();
  return MissingInput2;
})();
var MissingContext = /* @__PURE__ */ (function() {
  function MissingContext2() {
  }
  ;
  MissingContext2.value = new MissingContext2();
  return MissingContext2;
})();
var MissingState = /* @__PURE__ */ (function() {
  function MissingState2() {
  }
  ;
  MissingState2.value = new MissingState2();
  return MissingState2;
})();
var StatePathInvalid = /* @__PURE__ */ (function() {
  function StatePathInvalid2() {
  }
  ;
  StatePathInvalid2.value = new StatePathInvalid2();
  return StatePathInvalid2;
})();
var ProcessNotFound = /* @__PURE__ */ (function() {
  function ProcessNotFound2() {
  }
  ;
  ProcessNotFound2.value = new ProcessNotFound2();
  return ProcessNotFound2;
})();
var ProcessDeadlock = /* @__PURE__ */ (function() {
  function ProcessDeadlock2() {
  }
  ;
  ProcessDeadlock2.value = new ProcessDeadlock2();
  return ProcessDeadlock2;
})();
var ProcessCancelled = /* @__PURE__ */ (function() {
  function ProcessCancelled3() {
  }
  ;
  ProcessCancelled3.value = new ProcessCancelled3();
  return ProcessCancelled3;
})();
var MailboxTooLarge = /* @__PURE__ */ (function() {
  function MailboxTooLarge2() {
  }
  ;
  MailboxTooLarge2.value = new MailboxTooLarge2();
  return MailboxTooLarge2;
})();
var RemoteNodeUnknown = /* @__PURE__ */ (function() {
  function RemoteNodeUnknown2() {
  }
  ;
  RemoteNodeUnknown2.value = new RemoteNodeUnknown2();
  return RemoteNodeUnknown2;
})();
var RemoteProcessUnknown = /* @__PURE__ */ (function() {
  function RemoteProcessUnknown2() {
  }
  ;
  RemoteProcessUnknown2.value = new RemoteProcessUnknown2();
  return RemoteProcessUnknown2;
})();
var AmbiguousTransition = /* @__PURE__ */ (function() {
  function AmbiguousTransition2() {
  }
  ;
  AmbiguousTransition2.value = new AmbiguousTransition2();
  return AmbiguousTransition2;
})();
var NoTransition = /* @__PURE__ */ (function() {
  function NoTransition2() {
  }
  ;
  NoTransition2.value = new NoTransition2();
  return NoTransition2;
})();
var GuardRejected = /* @__PURE__ */ (function() {
  function GuardRejected2() {
  }
  ;
  GuardRejected2.value = new GuardRejected2();
  return GuardRejected2;
})();
var InvariantFailed = /* @__PURE__ */ (function() {
  function InvariantFailed2() {
  }
  ;
  InvariantFailed2.value = new InvariantFailed2();
  return InvariantFailed2;
})();
var ProofAssertionFailed = /* @__PURE__ */ (function() {
  function ProofAssertionFailed2() {
  }
  ;
  ProofAssertionFailed2.value = new ProofAssertionFailed2();
  return ProofAssertionFailed2;
})();
var StepLimitExceeded = /* @__PURE__ */ (function() {
  function StepLimitExceeded2() {
  }
  ;
  StepLimitExceeded2.value = new StepLimitExceeded2();
  return StepLimitExceeded2;
})();
var TraceLimitExceeded = /* @__PURE__ */ (function() {
  function TraceLimitExceeded2() {
  }
  ;
  TraceLimitExceeded2.value = new TraceLimitExceeded2();
  return TraceLimitExceeded2;
})();
var UnsupportedVersion = /* @__PURE__ */ (function() {
  function UnsupportedVersion2() {
  }
  ;
  UnsupportedVersion2.value = new UnsupportedVersion2();
  return UnsupportedVersion2;
})();
var CustomErrorCode = /* @__PURE__ */ (function() {
  function CustomErrorCode2(value0) {
    this.value0 = value0;
  }
  ;
  CustomErrorCode2.create = function(value0) {
    return new CustomErrorCode2(value0);
  };
  return CustomErrorCode2;
})();
var VMError = /* @__PURE__ */ (function() {
  function VMError2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  VMError2.create = function(value0) {
    return function(value1) {
      return new VMError2(value0, value1);
    };
  };
  return VMError2;
})();
var showErrorCode = {
  show: function(v) {
    if (v instanceof InvalidProgram) {
      return "InvalidProgram";
    }
    ;
    if (v instanceof InvalidInstruction) {
      return "InvalidInstruction";
    }
    ;
    if (v instanceof InvalidRegister) {
      return "InvalidRegister";
    }
    ;
    if (v instanceof InvalidJump) {
      return "InvalidJump";
    }
    ;
    if (v instanceof UnknownFunction) {
      return "UnknownFunction";
    }
    ;
    if (v instanceof UnknownBuiltin) {
      return "UnknownBuiltin";
    }
    ;
    if (v instanceof ArityMismatch) {
      return "ArityMismatch";
    }
    ;
    if (v instanceof TypeMismatch) {
      return "TypeMismatch";
    }
    ;
    if (v instanceof DivisionByZero) {
      return "DivisionByZero";
    }
    ;
    if (v instanceof ArithmeticOverflow) {
      return "ArithmeticOverflow";
    }
    ;
    if (v instanceof ArithmeticError) {
      return "ArithmeticError";
    }
    ;
    if (v instanceof NoModularInverse) {
      return "NoModularInverse";
    }
    ;
    if (v instanceof InvalidRoundingMode) {
      return "InvalidRoundingMode";
    }
    ;
    if (v instanceof MissingInput) {
      return "MissingInput";
    }
    ;
    if (v instanceof MissingContext) {
      return "MissingContext";
    }
    ;
    if (v instanceof MissingState) {
      return "MissingState";
    }
    ;
    if (v instanceof StatePathInvalid) {
      return "StatePathInvalid";
    }
    ;
    if (v instanceof ProcessNotFound) {
      return "ProcessNotFound";
    }
    ;
    if (v instanceof ProcessDeadlock) {
      return "ProcessDeadlock";
    }
    ;
    if (v instanceof ProcessCancelled) {
      return "ProcessCancelled";
    }
    ;
    if (v instanceof MailboxTooLarge) {
      return "MailboxTooLarge";
    }
    ;
    if (v instanceof RemoteNodeUnknown) {
      return "RemoteNodeUnknown";
    }
    ;
    if (v instanceof RemoteProcessUnknown) {
      return "RemoteProcessUnknown";
    }
    ;
    if (v instanceof AmbiguousTransition) {
      return "AmbiguousTransition";
    }
    ;
    if (v instanceof NoTransition) {
      return "NoTransition";
    }
    ;
    if (v instanceof GuardRejected) {
      return "GuardRejected";
    }
    ;
    if (v instanceof InvariantFailed) {
      return "InvariantFailed";
    }
    ;
    if (v instanceof ProofAssertionFailed) {
      return "ProofAssertionFailed";
    }
    ;
    if (v instanceof StepLimitExceeded) {
      return "StepLimitExceeded";
    }
    ;
    if (v instanceof TraceLimitExceeded) {
      return "TraceLimitExceeded";
    }
    ;
    if (v instanceof UnsupportedVersion) {
      return "UnsupportedVersion";
    }
    ;
    if (v instanceof CustomErrorCode) {
      return "CustomErrorCode " + show2(v.value0);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Error (line 42, column 10 - line 74, column 54): " + [v.constructor.name]);
  }
};
var show1 = /* @__PURE__ */ show(showErrorCode);
var showVMError = {
  show: function(v) {
    return "VMError " + (show1(v.value0) + (": " + v.value1));
  }
};
var eqErrorCode = {
  eq: function(x) {
    return function(y) {
      if (x instanceof InvalidProgram && y instanceof InvalidProgram) {
        return true;
      }
      ;
      if (x instanceof InvalidInstruction && y instanceof InvalidInstruction) {
        return true;
      }
      ;
      if (x instanceof InvalidRegister && y instanceof InvalidRegister) {
        return true;
      }
      ;
      if (x instanceof InvalidJump && y instanceof InvalidJump) {
        return true;
      }
      ;
      if (x instanceof UnknownFunction && y instanceof UnknownFunction) {
        return true;
      }
      ;
      if (x instanceof UnknownBuiltin && y instanceof UnknownBuiltin) {
        return true;
      }
      ;
      if (x instanceof ArityMismatch && y instanceof ArityMismatch) {
        return true;
      }
      ;
      if (x instanceof TypeMismatch && y instanceof TypeMismatch) {
        return true;
      }
      ;
      if (x instanceof DivisionByZero && y instanceof DivisionByZero) {
        return true;
      }
      ;
      if (x instanceof ArithmeticOverflow && y instanceof ArithmeticOverflow) {
        return true;
      }
      ;
      if (x instanceof ArithmeticError && y instanceof ArithmeticError) {
        return true;
      }
      ;
      if (x instanceof NoModularInverse && y instanceof NoModularInverse) {
        return true;
      }
      ;
      if (x instanceof InvalidRoundingMode && y instanceof InvalidRoundingMode) {
        return true;
      }
      ;
      if (x instanceof MissingInput && y instanceof MissingInput) {
        return true;
      }
      ;
      if (x instanceof MissingContext && y instanceof MissingContext) {
        return true;
      }
      ;
      if (x instanceof MissingState && y instanceof MissingState) {
        return true;
      }
      ;
      if (x instanceof StatePathInvalid && y instanceof StatePathInvalid) {
        return true;
      }
      ;
      if (x instanceof ProcessNotFound && y instanceof ProcessNotFound) {
        return true;
      }
      ;
      if (x instanceof ProcessDeadlock && y instanceof ProcessDeadlock) {
        return true;
      }
      ;
      if (x instanceof ProcessCancelled && y instanceof ProcessCancelled) {
        return true;
      }
      ;
      if (x instanceof MailboxTooLarge && y instanceof MailboxTooLarge) {
        return true;
      }
      ;
      if (x instanceof RemoteNodeUnknown && y instanceof RemoteNodeUnknown) {
        return true;
      }
      ;
      if (x instanceof RemoteProcessUnknown && y instanceof RemoteProcessUnknown) {
        return true;
      }
      ;
      if (x instanceof AmbiguousTransition && y instanceof AmbiguousTransition) {
        return true;
      }
      ;
      if (x instanceof NoTransition && y instanceof NoTransition) {
        return true;
      }
      ;
      if (x instanceof GuardRejected && y instanceof GuardRejected) {
        return true;
      }
      ;
      if (x instanceof InvariantFailed && y instanceof InvariantFailed) {
        return true;
      }
      ;
      if (x instanceof ProofAssertionFailed && y instanceof ProofAssertionFailed) {
        return true;
      }
      ;
      if (x instanceof StepLimitExceeded && y instanceof StepLimitExceeded) {
        return true;
      }
      ;
      if (x instanceof TraceLimitExceeded && y instanceof TraceLimitExceeded) {
        return true;
      }
      ;
      if (x instanceof UnsupportedVersion && y instanceof UnsupportedVersion) {
        return true;
      }
      ;
      if (x instanceof CustomErrorCode && y instanceof CustomErrorCode) {
        return x.value0 === y.value0;
      }
      ;
      return false;
    };
  }
};
var eq22 = /* @__PURE__ */ eq(eqErrorCode);
var eqVMError = {
  eq: function(x) {
    return function(y) {
      return eq22(x.value0)(y.value0) && x.value1 === y.value1;
    };
  }
};

// output/FinVM.Frame/index.js
var FrameRef = function(x) {
  return x;
};

// output/FinVM.Vec/index.js
var append3 = /* @__PURE__ */ append(semigroupArray);
var div2 = /* @__PURE__ */ div(euclideanRingInt);
var bind2 = /* @__PURE__ */ bind(bindMaybe);
var mod2 = /* @__PURE__ */ mod(euclideanRingInt);
var pure2 = /* @__PURE__ */ pure(applicativeMaybe);
var toArray2 = function(v) {
  return append3(concat(v.blocks))(v.tail);
};
var showVec = function(dictShow) {
  var show28 = show(showArray(dictShow));
  return {
    show: function(v) {
      return show28(toArray2(v));
    }
  };
};
var length4 = function(v) {
  return v.len;
};
var eqVec = function(dictEq) {
  var eq11 = eq(eqArray(dictEq));
  return {
    eq: function(a) {
      return function(b) {
        return eq11(toArray2(a))(toArray2(b));
      };
    }
  };
};
var ordVec = function(dictOrd) {
  var compare6 = compare(ordArray(dictOrd));
  var eqVec1 = eqVec(dictOrd.Eq0());
  return {
    compare: function(a) {
      return function(b) {
        return compare6(toArray2(a))(toArray2(b));
      };
    },
    Eq0: function() {
      return eqVec1;
    }
  };
};
var empty5 = {
  blocks: [],
  tail: [],
  len: 0
};
var blockSize = 256;
var fromArray = function(arr) {
  var n = length(arr);
  var fullCount = div2(n)(blockSize);
  var go = function($copy_bi) {
    return function($copy_acc) {
      var $tco_var_bi = $copy_bi;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(bi, acc) {
        var $31 = bi >= fullCount;
        if ($31) {
          $tco_done = true;
          return acc;
        }
        ;
        $tco_var_bi = bi + 1 | 0;
        $copy_acc = snoc(acc)(slice(bi * blockSize | 0)((bi + 1 | 0) * blockSize | 0)(arr));
        return;
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_bi, $copy_acc);
      }
      ;
      return $tco_result;
    };
  };
  var tail = slice(fullCount * blockSize | 0)(n)(arr);
  var blocks = go(0)([]);
  return {
    blocks,
    tail,
    len: n
  };
};
var index2 = function(v) {
  return function(i) {
    var $34 = i < 0 || i >= v.len;
    if ($34) {
      return Nothing.value;
    }
    ;
    var nb = length(v.blocks);
    var bi = div2(i)(blockSize);
    var $35 = bi < nb;
    if ($35) {
      return bind2(index(v.blocks)(bi))(function(blk) {
        return index(blk)(mod2(i)(blockSize));
      });
    }
    ;
    return index(v.tail)(i - (nb * blockSize | 0) | 0);
  };
};
var snoc2 = function(v) {
  return function(x) {
    var tail$prime = snoc(v.tail)(x);
    var $38 = length(tail$prime) >= blockSize;
    if ($38) {
      return {
        blocks: snoc(v.blocks)(tail$prime),
        tail: [],
        len: v.len + 1 | 0
      };
    }
    ;
    return {
      blocks: v.blocks,
      tail: tail$prime,
      len: v.len + 1 | 0
    };
  };
};
var updateAt2 = function(i) {
  return function(x) {
    return function(v) {
      var $42 = i < 0 || i >= v.len;
      if ($42) {
        return Nothing.value;
      }
      ;
      var nb = length(v.blocks);
      var bi = div2(i)(blockSize);
      var $43 = bi < nb;
      if ($43) {
        return bind2(index(v.blocks)(bi))(function(blk) {
          return bind2(updateAt(mod2(i)(blockSize))(x)(blk))(function(blk$prime) {
            return bind2(updateAt(bi)(blk$prime)(v.blocks))(function(blocks$prime) {
              return pure2({
                tail: v.tail,
                len: v.len,
                blocks: blocks$prime
              });
            });
          });
        });
      }
      ;
      return bind2(updateAt(i - (nb * blockSize | 0) | 0)(x)(v.tail))(function(tail$prime) {
        return pure2({
          blocks: v.blocks,
          len: v.len,
          tail: tail$prime
        });
      });
    };
  };
};

// output/FinVM.Value/index.js
var show3 = /* @__PURE__ */ show(showBoolean);
var show12 = /* @__PURE__ */ show(showBigInt);
var show22 = /* @__PURE__ */ show(showInt);
var show32 = /* @__PURE__ */ show(showString);
var show4 = /* @__PURE__ */ show(/* @__PURE__ */ showArray(showInt));
var showMap2 = /* @__PURE__ */ showMap(showString);
var eq13 = /* @__PURE__ */ eq(eqBigInt);
var eq4 = /* @__PURE__ */ eq(/* @__PURE__ */ eqArray(eqInt));
var eqMap2 = /* @__PURE__ */ eqMap(eqString);
var compare3 = /* @__PURE__ */ compare(ordBoolean);
var compare12 = /* @__PURE__ */ compare(ordBigInt);
var compare22 = /* @__PURE__ */ compare(ordInt);
var compare32 = /* @__PURE__ */ compare(ordString);
var compare4 = /* @__PURE__ */ compare(/* @__PURE__ */ ordArray(ordInt));
var ordMap2 = /* @__PURE__ */ ordMap(ordString);
var NodeRef = function(x) {
  return x;
};
var VUnit = /* @__PURE__ */ (function() {
  function VUnit2() {
  }
  ;
  VUnit2.value = new VUnit2();
  return VUnit2;
})();
var VBool = /* @__PURE__ */ (function() {
  function VBool2(value0) {
    this.value0 = value0;
  }
  ;
  VBool2.create = function(value0) {
    return new VBool2(value0);
  };
  return VBool2;
})();
var VInt = /* @__PURE__ */ (function() {
  function VInt2(value0) {
    this.value0 = value0;
  }
  ;
  VInt2.create = function(value0) {
    return new VInt2(value0);
  };
  return VInt2;
})();
var VFixed = /* @__PURE__ */ (function() {
  function VFixed2(value0) {
    this.value0 = value0;
  }
  ;
  VFixed2.create = function(value0) {
    return new VFixed2(value0);
  };
  return VFixed2;
})();
var VRational = /* @__PURE__ */ (function() {
  function VRational2(value0) {
    this.value0 = value0;
  }
  ;
  VRational2.create = function(value0) {
    return new VRational2(value0);
  };
  return VRational2;
})();
var VString = /* @__PURE__ */ (function() {
  function VString2(value0) {
    this.value0 = value0;
  }
  ;
  VString2.create = function(value0) {
    return new VString2(value0);
  };
  return VString2;
})();
var VBytes = /* @__PURE__ */ (function() {
  function VBytes2(value0) {
    this.value0 = value0;
  }
  ;
  VBytes2.create = function(value0) {
    return new VBytes2(value0);
  };
  return VBytes2;
})();
var VSymbol = /* @__PURE__ */ (function() {
  function VSymbol2(value0) {
    this.value0 = value0;
  }
  ;
  VSymbol2.create = function(value0) {
    return new VSymbol2(value0);
  };
  return VSymbol2;
})();
var VList = /* @__PURE__ */ (function() {
  function VList2(value0) {
    this.value0 = value0;
  }
  ;
  VList2.create = function(value0) {
    return new VList2(value0);
  };
  return VList2;
})();
var VMap = /* @__PURE__ */ (function() {
  function VMap2(value0) {
    this.value0 = value0;
  }
  ;
  VMap2.create = function(value0) {
    return new VMap2(value0);
  };
  return VMap2;
})();
var VRecord = /* @__PURE__ */ (function() {
  function VRecord2(value0) {
    this.value0 = value0;
  }
  ;
  VRecord2.create = function(value0) {
    return new VRecord2(value0);
  };
  return VRecord2;
})();
var VVariant = /* @__PURE__ */ (function() {
  function VVariant2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  VVariant2.create = function(value0) {
    return function(value1) {
      return new VVariant2(value0, value1);
    };
  };
  return VVariant2;
})();
var VOption = /* @__PURE__ */ (function() {
  function VOption2(value0) {
    this.value0 = value0;
  }
  ;
  VOption2.create = function(value0) {
    return new VOption2(value0);
  };
  return VOption2;
})();
var VResult = /* @__PURE__ */ (function() {
  function VResult2(value0) {
    this.value0 = value0;
  }
  ;
  VResult2.create = function(value0) {
    return new VResult2(value0);
  };
  return VResult2;
})();
var VFunctionRef = /* @__PURE__ */ (function() {
  function VFunctionRef2(value0) {
    this.value0 = value0;
  }
  ;
  VFunctionRef2.create = function(value0) {
    return new VFunctionRef2(value0);
  };
  return VFunctionRef2;
})();
var VProcessRef = /* @__PURE__ */ (function() {
  function VProcessRef2(value0) {
    this.value0 = value0;
  }
  ;
  VProcessRef2.create = function(value0) {
    return new VProcessRef2(value0);
  };
  return VProcessRef2;
})();
var VRemoteProcessRef = /* @__PURE__ */ (function() {
  function VRemoteProcessRef2(value0) {
    this.value0 = value0;
  }
  ;
  VRemoteProcessRef2.create = function(value0) {
    return new VRemoteProcessRef2(value0);
  };
  return VRemoteProcessRef2;
})();
var VStateMachineInstance = /* @__PURE__ */ (function() {
  function VStateMachineInstance2(value0) {
    this.value0 = value0;
  }
  ;
  VStateMachineInstance2.create = function(value0) {
    return new VStateMachineInstance2(value0);
  };
  return VStateMachineInstance2;
})();
var VEvent = /* @__PURE__ */ (function() {
  function VEvent2(value0) {
    this.value0 = value0;
  }
  ;
  VEvent2.create = function(value0) {
    return new VEvent2(value0);
  };
  return VEvent2;
})();
var VEffectIntent = /* @__PURE__ */ (function() {
  function VEffectIntent2(value0) {
    this.value0 = value0;
  }
  ;
  VEffectIntent2.create = function(value0) {
    return new VEffectIntent2(value0);
  };
  return VEffectIntent2;
})();
var VProofValue = /* @__PURE__ */ (function() {
  function VProofValue2(value0) {
    this.value0 = value0;
  }
  ;
  VProofValue2.create = function(value0) {
    return new VProofValue2(value0);
  };
  return VProofValue2;
})();
var showValue = {
  show: function(v) {
    if (v instanceof VUnit) {
      return "VUnit";
    }
    ;
    if (v instanceof VBool) {
      return "VBool " + show3(v.value0);
    }
    ;
    if (v instanceof VInt) {
      return "VInt " + show12(v.value0);
    }
    ;
    if (v instanceof VFixed) {
      return "VFixed " + (show12(v.value0.value) + ("@" + show22(v.value0.scale)));
    }
    ;
    if (v instanceof VRational) {
      return "VRational " + (show12(v.value0.numerator) + ("/" + show12(v.value0.denominator)));
    }
    ;
    if (v instanceof VString) {
      return "VString " + show32(v.value0);
    }
    ;
    if (v instanceof VBytes) {
      return "VBytes " + show4(v.value0);
    }
    ;
    if (v instanceof VSymbol) {
      return "VSymbol " + v.value0;
    }
    ;
    if (v instanceof VList) {
      return "VList " + show(showVec(showValue))(v.value0);
    }
    ;
    if (v instanceof VMap) {
      return "VMap " + show(showMap(showValue)(showValue))(v.value0);
    }
    ;
    if (v instanceof VRecord) {
      return "VRecord " + show(showMap2(showValue))(v.value0);
    }
    ;
    if (v instanceof VVariant) {
      return "VVariant " + (v.value0 + (" " + show(showValue)(v.value1)));
    }
    ;
    if (v instanceof VOption) {
      return "VOption " + show(showMaybe(showValue))(v.value0);
    }
    ;
    if (v instanceof VResult) {
      return "VResult " + show(showEither(showValue)(showValue))(v.value0);
    }
    ;
    if (v instanceof VFunctionRef) {
      return "VFunctionRef " + v.value0;
    }
    ;
    if (v instanceof VProcessRef) {
      return "VProcessRef " + v.value0;
    }
    ;
    if (v instanceof VRemoteProcessRef) {
      return "VRemoteProcessRef " + v.value0.pid;
    }
    ;
    if (v instanceof VStateMachineInstance) {
      return "VStateMachineInstance " + v.value0.instanceId;
    }
    ;
    if (v instanceof VEvent) {
      return "VEvent " + v.value0.type_;
    }
    ;
    if (v instanceof VEffectIntent) {
      return "VEffectIntent " + v.value0.type_;
    }
    ;
    if (v instanceof VProofValue) {
      return "VProofValue " + v.value0.label;
    }
    ;
    throw new Error("Failed pattern match at FinVM.Value (line 60, column 10 - line 81, column 47): " + [v.constructor.name]);
  }
};
var showNodeRef = {
  show: function(v) {
    return "NodeRef " + v;
  }
};
var ordNodeRef = ordString;
var compare5 = /* @__PURE__ */ compare(ordNodeRef);
var eqNodeRef = eqString;
var eq5 = /* @__PURE__ */ eq(eqNodeRef);
var eqValue = {
  eq: function(x) {
    return function(y) {
      if (x instanceof VUnit && y instanceof VUnit) {
        return true;
      }
      ;
      if (x instanceof VBool && y instanceof VBool) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof VInt && y instanceof VInt) {
        return eq13(x.value0)(y.value0);
      }
      ;
      if (x instanceof VFixed && y instanceof VFixed) {
        return x.value0.scale === y.value0.scale && eq13(x.value0.value)(y.value0.value);
      }
      ;
      if (x instanceof VRational && y instanceof VRational) {
        return eq13(x.value0.denominator)(y.value0.denominator) && eq13(x.value0.numerator)(y.value0.numerator);
      }
      ;
      if (x instanceof VString && y instanceof VString) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof VBytes && y instanceof VBytes) {
        return eq4(x.value0)(y.value0);
      }
      ;
      if (x instanceof VSymbol && y instanceof VSymbol) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof VList && y instanceof VList) {
        return eq(eqVec(eqValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VMap && y instanceof VMap) {
        return eq(eqMap(eqValue)(eqValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VRecord && y instanceof VRecord) {
        return eq(eqMap2(eqValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VVariant && y instanceof VVariant) {
        return x.value0 === y.value0 && eq(eqValue)(x.value1)(y.value1);
      }
      ;
      if (x instanceof VOption && y instanceof VOption) {
        return eq(eqMaybe(eqValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VResult && y instanceof VResult) {
        return eq(eqEither(eqValue)(eqValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VFunctionRef && y instanceof VFunctionRef) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof VProcessRef && y instanceof VProcessRef) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof VRemoteProcessRef && y instanceof VRemoteProcessRef) {
        return eq5(x.value0.node)(y.value0.node) && x.value0.pid === y.value0.pid;
      }
      ;
      if (x instanceof VStateMachineInstance && y instanceof VStateMachineInstance) {
        return x.value0.currentState === y.value0.currentState && eq(eqMap2(eqValue))(x.value0.data_)(y.value0.data_) && x.value0.historyHash === y.value0.historyHash && x.value0.instanceId === y.value0.instanceId && x.value0.machineId === y.value0.machineId && x.value0.version === y.value0.version;
      }
      ;
      if (x instanceof VEvent && y instanceof VEvent) {
        return eq(eqValue)(x.value0.payload)(y.value0.payload) && x.value0.type_ === y.value0.type_;
      }
      ;
      if (x instanceof VEffectIntent && y instanceof VEffectIntent) {
        return eq(eqValue)(x.value0.payload)(y.value0.payload) && x.value0.type_ === y.value0.type_;
      }
      ;
      if (x instanceof VProofValue && y instanceof VProofValue) {
        return x.value0.label === y.value0.label && eq(eqValue)(x.value0.value)(y.value0.value);
      }
      ;
      return false;
    };
  }
};
var ordValue = {
  compare: function(x) {
    return function(y) {
      if (x instanceof VUnit && y instanceof VUnit) {
        return EQ.value;
      }
      ;
      if (x instanceof VUnit) {
        return LT.value;
      }
      ;
      if (y instanceof VUnit) {
        return GT.value;
      }
      ;
      if (x instanceof VBool && y instanceof VBool) {
        return compare3(x.value0)(y.value0);
      }
      ;
      if (x instanceof VBool) {
        return LT.value;
      }
      ;
      if (y instanceof VBool) {
        return GT.value;
      }
      ;
      if (x instanceof VInt && y instanceof VInt) {
        return compare12(x.value0)(y.value0);
      }
      ;
      if (x instanceof VInt) {
        return LT.value;
      }
      ;
      if (y instanceof VInt) {
        return GT.value;
      }
      ;
      if (x instanceof VFixed && y instanceof VFixed) {
        var v = compare22(x.value0.scale)(y.value0.scale);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        return compare12(x.value0.value)(y.value0.value);
      }
      ;
      if (x instanceof VFixed) {
        return LT.value;
      }
      ;
      if (y instanceof VFixed) {
        return GT.value;
      }
      ;
      if (x instanceof VRational && y instanceof VRational) {
        var v = compare12(x.value0.denominator)(y.value0.denominator);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        return compare12(x.value0.numerator)(y.value0.numerator);
      }
      ;
      if (x instanceof VRational) {
        return LT.value;
      }
      ;
      if (y instanceof VRational) {
        return GT.value;
      }
      ;
      if (x instanceof VString && y instanceof VString) {
        return compare32(x.value0)(y.value0);
      }
      ;
      if (x instanceof VString) {
        return LT.value;
      }
      ;
      if (y instanceof VString) {
        return GT.value;
      }
      ;
      if (x instanceof VBytes && y instanceof VBytes) {
        return compare4(x.value0)(y.value0);
      }
      ;
      if (x instanceof VBytes) {
        return LT.value;
      }
      ;
      if (y instanceof VBytes) {
        return GT.value;
      }
      ;
      if (x instanceof VSymbol && y instanceof VSymbol) {
        return compare32(x.value0)(y.value0);
      }
      ;
      if (x instanceof VSymbol) {
        return LT.value;
      }
      ;
      if (y instanceof VSymbol) {
        return GT.value;
      }
      ;
      if (x instanceof VList && y instanceof VList) {
        return compare(ordVec(ordValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VList) {
        return LT.value;
      }
      ;
      if (y instanceof VList) {
        return GT.value;
      }
      ;
      if (x instanceof VMap && y instanceof VMap) {
        return compare(ordMap(ordValue)(ordValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VMap) {
        return LT.value;
      }
      ;
      if (y instanceof VMap) {
        return GT.value;
      }
      ;
      if (x instanceof VRecord && y instanceof VRecord) {
        return compare(ordMap2(ordValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VRecord) {
        return LT.value;
      }
      ;
      if (y instanceof VRecord) {
        return GT.value;
      }
      ;
      if (x instanceof VVariant && y instanceof VVariant) {
        var v = compare32(x.value0)(y.value0);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        return compare(ordValue)(x.value1)(y.value1);
      }
      ;
      if (x instanceof VVariant) {
        return LT.value;
      }
      ;
      if (y instanceof VVariant) {
        return GT.value;
      }
      ;
      if (x instanceof VOption && y instanceof VOption) {
        return compare(ordMaybe(ordValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VOption) {
        return LT.value;
      }
      ;
      if (y instanceof VOption) {
        return GT.value;
      }
      ;
      if (x instanceof VResult && y instanceof VResult) {
        return compare(ordEither(ordValue)(ordValue))(x.value0)(y.value0);
      }
      ;
      if (x instanceof VResult) {
        return LT.value;
      }
      ;
      if (y instanceof VResult) {
        return GT.value;
      }
      ;
      if (x instanceof VFunctionRef && y instanceof VFunctionRef) {
        return compare32(x.value0)(y.value0);
      }
      ;
      if (x instanceof VFunctionRef) {
        return LT.value;
      }
      ;
      if (y instanceof VFunctionRef) {
        return GT.value;
      }
      ;
      if (x instanceof VProcessRef && y instanceof VProcessRef) {
        return compare32(x.value0)(y.value0);
      }
      ;
      if (x instanceof VProcessRef) {
        return LT.value;
      }
      ;
      if (y instanceof VProcessRef) {
        return GT.value;
      }
      ;
      if (x instanceof VRemoteProcessRef && y instanceof VRemoteProcessRef) {
        var v = compare5(x.value0.node)(y.value0.node);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        return compare32(x.value0.pid)(y.value0.pid);
      }
      ;
      if (x instanceof VRemoteProcessRef) {
        return LT.value;
      }
      ;
      if (y instanceof VRemoteProcessRef) {
        return GT.value;
      }
      ;
      if (x instanceof VStateMachineInstance && y instanceof VStateMachineInstance) {
        var v = compare32(x.value0.currentState)(y.value0.currentState);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        var v1 = compare(ordMap2(ordValue))(x.value0.data_)(y.value0.data_);
        if (v1 instanceof LT) {
          return LT.value;
        }
        ;
        if (v1 instanceof GT) {
          return GT.value;
        }
        ;
        var v2 = compare32(x.value0.historyHash)(y.value0.historyHash);
        if (v2 instanceof LT) {
          return LT.value;
        }
        ;
        if (v2 instanceof GT) {
          return GT.value;
        }
        ;
        var v3 = compare32(x.value0.instanceId)(y.value0.instanceId);
        if (v3 instanceof LT) {
          return LT.value;
        }
        ;
        if (v3 instanceof GT) {
          return GT.value;
        }
        ;
        var v4 = compare32(x.value0.machineId)(y.value0.machineId);
        if (v4 instanceof LT) {
          return LT.value;
        }
        ;
        if (v4 instanceof GT) {
          return GT.value;
        }
        ;
        return compare22(x.value0.version)(y.value0.version);
      }
      ;
      if (x instanceof VStateMachineInstance) {
        return LT.value;
      }
      ;
      if (y instanceof VStateMachineInstance) {
        return GT.value;
      }
      ;
      if (x instanceof VEvent && y instanceof VEvent) {
        var v = compare(ordValue)(x.value0.payload)(y.value0.payload);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        return compare32(x.value0.type_)(y.value0.type_);
      }
      ;
      if (x instanceof VEvent) {
        return LT.value;
      }
      ;
      if (y instanceof VEvent) {
        return GT.value;
      }
      ;
      if (x instanceof VEffectIntent && y instanceof VEffectIntent) {
        var v = compare(ordValue)(x.value0.payload)(y.value0.payload);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        return compare32(x.value0.type_)(y.value0.type_);
      }
      ;
      if (x instanceof VEffectIntent) {
        return LT.value;
      }
      ;
      if (y instanceof VEffectIntent) {
        return GT.value;
      }
      ;
      if (x instanceof VProofValue && y instanceof VProofValue) {
        var v = compare32(x.value0.label)(y.value0.label);
        if (v instanceof LT) {
          return LT.value;
        }
        ;
        if (v instanceof GT) {
          return GT.value;
        }
        ;
        return compare(ordValue)(x.value0.value)(y.value0.value);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Value (line 0, column 0 - line 0, column 0): " + [x.constructor.name, y.constructor.name]);
    };
  },
  Eq0: function() {
    return eqValue;
  }
};

// output/FinVM.Process/index.js
var show5 = /* @__PURE__ */ show(showInt);
var show13 = /* @__PURE__ */ show(showNodeRef);
var show23 = /* @__PURE__ */ show(showValue);
var show33 = /* @__PURE__ */ show(showVMError);
var eq23 = /* @__PURE__ */ eq(eqNodeRef);
var eq3 = /* @__PURE__ */ eq(eqValue);
var eq42 = /* @__PURE__ */ eq(eqVMError);
var WaitingForMessage = /* @__PURE__ */ (function() {
  function WaitingForMessage2() {
  }
  ;
  WaitingForMessage2.value = new WaitingForMessage2();
  return WaitingForMessage2;
})();
var WaitingOnMatch = /* @__PURE__ */ (function() {
  function WaitingOnMatch2(value0) {
    this.value0 = value0;
  }
  ;
  WaitingOnMatch2.create = function(value0) {
    return new WaitingOnMatch2(value0);
  };
  return WaitingOnMatch2;
})();
var WaitingForProcess = /* @__PURE__ */ (function() {
  function WaitingForProcess2(value0) {
    this.value0 = value0;
  }
  ;
  WaitingForProcess2.create = function(value0) {
    return new WaitingForProcess2(value0);
  };
  return WaitingForProcess2;
})();
var WaitingForMonitor = /* @__PURE__ */ (function() {
  function WaitingForMonitor2(value0) {
    this.value0 = value0;
  }
  ;
  WaitingForMonitor2.create = function(value0) {
    return new WaitingForMonitor2(value0);
  };
  return WaitingForMonitor2;
})();
var WaitingForTick = /* @__PURE__ */ (function() {
  function WaitingForTick2(value0) {
    this.value0 = value0;
  }
  ;
  WaitingForTick2.create = function(value0) {
    return new WaitingForTick2(value0);
  };
  return WaitingForTick2;
})();
var WaitingForRemoteNode = /* @__PURE__ */ (function() {
  function WaitingForRemoteNode2(value0) {
    this.value0 = value0;
  }
  ;
  WaitingForRemoteNode2.create = function(value0) {
    return new WaitingForRemoteNode2(value0);
  };
  return WaitingForRemoteNode2;
})();
var WaitingForRemoteProcess = /* @__PURE__ */ (function() {
  function WaitingForRemoteProcess2(value0) {
    this.value0 = value0;
  }
  ;
  WaitingForRemoteProcess2.create = function(value0) {
    return new WaitingForRemoteProcess2(value0);
  };
  return WaitingForRemoteProcess2;
})();
var WaitingOnEffect = /* @__PURE__ */ (function() {
  function WaitingOnEffect2(value0) {
    this.value0 = value0;
  }
  ;
  WaitingOnEffect2.create = function(value0) {
    return new WaitingOnEffect2(value0);
  };
  return WaitingOnEffect2;
})();
var MonitorLocal = /* @__PURE__ */ (function() {
  function MonitorLocal2(value0) {
    this.value0 = value0;
  }
  ;
  MonitorLocal2.create = function(value0) {
    return new MonitorLocal2(value0);
  };
  return MonitorLocal2;
})();
var MonitorRemote = /* @__PURE__ */ (function() {
  function MonitorRemote2(value0) {
    this.value0 = value0;
  }
  ;
  MonitorRemote2.create = function(value0) {
    return new MonitorRemote2(value0);
  };
  return MonitorRemote2;
})();
var ExitReason = /* @__PURE__ */ (function() {
  function ExitReason2(value0) {
    this.value0 = value0;
  }
  ;
  ExitReason2.create = function(value0) {
    return new ExitReason2(value0);
  };
  return ExitReason2;
})();
var CancelReason = /* @__PURE__ */ (function() {
  function CancelReason2(value0) {
    this.value0 = value0;
  }
  ;
  CancelReason2.create = function(value0) {
    return new CancelReason2(value0);
  };
  return CancelReason2;
})();
var ProcessReady = /* @__PURE__ */ (function() {
  function ProcessReady2() {
  }
  ;
  ProcessReady2.value = new ProcessReady2();
  return ProcessReady2;
})();
var ProcessRunning = /* @__PURE__ */ (function() {
  function ProcessRunning2() {
  }
  ;
  ProcessRunning2.value = new ProcessRunning2();
  return ProcessRunning2;
})();
var ProcessWaiting = /* @__PURE__ */ (function() {
  function ProcessWaiting2(value0) {
    this.value0 = value0;
  }
  ;
  ProcessWaiting2.create = function(value0) {
    return new ProcessWaiting2(value0);
  };
  return ProcessWaiting2;
})();
var ProcessCompleted = /* @__PURE__ */ (function() {
  function ProcessCompleted2(value0) {
    this.value0 = value0;
  }
  ;
  ProcessCompleted2.create = function(value0) {
    return new ProcessCompleted2(value0);
  };
  return ProcessCompleted2;
})();
var ProcessFailed = /* @__PURE__ */ (function() {
  function ProcessFailed2(value0) {
    this.value0 = value0;
  }
  ;
  ProcessFailed2.create = function(value0) {
    return new ProcessFailed2(value0);
  };
  return ProcessFailed2;
})();
var ProcessCancelled2 = /* @__PURE__ */ (function() {
  function ProcessCancelled3(value0) {
    this.value0 = value0;
  }
  ;
  ProcessCancelled3.create = function(value0) {
    return new ProcessCancelled3(value0);
  };
  return ProcessCancelled3;
})();
var ProcessExited = /* @__PURE__ */ (function() {
  function ProcessExited2(value0) {
    this.value0 = value0;
  }
  ;
  ProcessExited2.create = function(value0) {
    return new ProcessExited2(value0);
  };
  return ProcessExited2;
})();
var showWaitCondition = {
  show: function(v) {
    if (v instanceof WaitingForMessage) {
      return "WaitingForMessage";
    }
    ;
    if (v instanceof WaitingOnMatch) {
      return "WaitingOnMatch " + v.value0;
    }
    ;
    if (v instanceof WaitingForProcess) {
      return "WaitingForProcess " + v.value0;
    }
    ;
    if (v instanceof WaitingForMonitor) {
      return "WaitingForMonitor " + v.value0;
    }
    ;
    if (v instanceof WaitingForTick) {
      return "WaitingForTick " + show5(v.value0);
    }
    ;
    if (v instanceof WaitingForRemoteNode) {
      return "WaitingForRemoteNode " + show13(v.value0);
    }
    ;
    if (v instanceof WaitingForRemoteProcess) {
      return "WaitingForRemoteProcess " + v.value0.pid;
    }
    ;
    if (v instanceof WaitingOnEffect) {
      return "WaitingOnEffect " + v.value0;
    }
    ;
    throw new Error("Failed pattern match at FinVM.Process (line 59, column 10 - line 67, column 53): " + [v.constructor.name]);
  }
};
var show42 = /* @__PURE__ */ show(showWaitCondition);
var showExitReason = {
  show: function(v) {
    return "ExitReason " + v.value0;
  }
};
var show52 = /* @__PURE__ */ show(showExitReason);
var showCancelReason = {
  show: function(v) {
    return "CancelReason " + v.value0;
  }
};
var show6 = /* @__PURE__ */ show(showCancelReason);
var showProcessStatus = {
  show: function(v) {
    if (v instanceof ProcessReady) {
      return "ProcessReady";
    }
    ;
    if (v instanceof ProcessRunning) {
      return "ProcessRunning";
    }
    ;
    if (v instanceof ProcessWaiting) {
      return "ProcessWaiting (" + (show42(v.value0) + ")");
    }
    ;
    if (v instanceof ProcessCompleted) {
      return "ProcessCompleted (" + (show23(v.value0) + ")");
    }
    ;
    if (v instanceof ProcessFailed) {
      return "ProcessFailed (" + (show33(v.value0) + ")");
    }
    ;
    if (v instanceof ProcessCancelled2) {
      return "ProcessCancelled (" + (show6(v.value0) + ")");
    }
    ;
    if (v instanceof ProcessExited) {
      return "ProcessExited (" + (show52(v.value0) + ")");
    }
    ;
    throw new Error("Failed pattern match at FinVM.Process (line 76, column 10 - line 83, column 68): " + [v.constructor.name]);
  }
};
var eqWaitCondition = {
  eq: function(x) {
    return function(y) {
      if (x instanceof WaitingForMessage && y instanceof WaitingForMessage) {
        return true;
      }
      ;
      if (x instanceof WaitingOnMatch && y instanceof WaitingOnMatch) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof WaitingForProcess && y instanceof WaitingForProcess) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof WaitingForMonitor && y instanceof WaitingForMonitor) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof WaitingForTick && y instanceof WaitingForTick) {
        return x.value0 === y.value0;
      }
      ;
      if (x instanceof WaitingForRemoteNode && y instanceof WaitingForRemoteNode) {
        return eq23(x.value0)(y.value0);
      }
      ;
      if (x instanceof WaitingForRemoteProcess && y instanceof WaitingForRemoteProcess) {
        return eq23(x.value0.node)(y.value0.node) && x.value0.pid === y.value0.pid;
      }
      ;
      if (x instanceof WaitingOnEffect && y instanceof WaitingOnEffect) {
        return x.value0 === y.value0;
      }
      ;
      return false;
    };
  }
};
var eq52 = /* @__PURE__ */ eq(eqWaitCondition);
var eqExitReason = {
  eq: function(x) {
    return function(y) {
      return x.value0 === y.value0;
    };
  }
};
var eq6 = /* @__PURE__ */ eq(eqExitReason);
var eqCancelReason = {
  eq: function(x) {
    return function(y) {
      return x.value0 === y.value0;
    };
  }
};
var eq7 = /* @__PURE__ */ eq(eqCancelReason);
var eqProcessStatus = {
  eq: function(x) {
    return function(y) {
      if (x instanceof ProcessReady && y instanceof ProcessReady) {
        return true;
      }
      ;
      if (x instanceof ProcessRunning && y instanceof ProcessRunning) {
        return true;
      }
      ;
      if (x instanceof ProcessWaiting && y instanceof ProcessWaiting) {
        return eq52(x.value0)(y.value0);
      }
      ;
      if (x instanceof ProcessCompleted && y instanceof ProcessCompleted) {
        return eq3(x.value0)(y.value0);
      }
      ;
      if (x instanceof ProcessFailed && y instanceof ProcessFailed) {
        return eq42(x.value0)(y.value0);
      }
      ;
      if (x instanceof ProcessCancelled2 && y instanceof ProcessCancelled2) {
        return eq7(x.value0)(y.value0);
      }
      ;
      if (x instanceof ProcessExited && y instanceof ProcessExited) {
        return eq6(x.value0)(y.value0);
      }
      ;
      return false;
    };
  }
};

// output/FinVM.Encoding.Resume/index.js
var $runtime_lazy3 = function(name, moduleName, init2) {
  var state = 0;
  var val;
  return function(lineNumber) {
    if (state === 2) return val;
    if (state === 1) throw new ReferenceError(name + " was needed before it finished initializing (module " + moduleName + ", line " + lineNumber + ")", moduleName, lineNumber);
    state = 1;
    val = init2();
    state = 2;
    return val;
  };
};
var bind3 = /* @__PURE__ */ bind(bindMaybe);
var map6 = /* @__PURE__ */ map(functorArray);
var toUnfoldable6 = /* @__PURE__ */ toUnfoldable4(unfoldableArray);
var show7 = /* @__PURE__ */ show(showErrorCode);
var toUnfoldable12 = /* @__PURE__ */ toUnfoldable5(unfoldableArray);
var fromFoldable5 = /* @__PURE__ */ fromFoldable(foldableList);
var map12 = /* @__PURE__ */ map(functorEither);
var bind1 = /* @__PURE__ */ bind(bindEither);
var pure3 = /* @__PURE__ */ pure(applicativeEither);
var traverse2 = /* @__PURE__ */ traverse(traversableArray)(applicativeEither);
var fromFoldable1 = /* @__PURE__ */ fromFoldable3(ordValue)(foldableArray);
var fromFoldable22 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
var fromFoldable32 = /* @__PURE__ */ fromFoldable4(foldableArray);
var fromFoldable42 = /* @__PURE__ */ fromFoldable32(ordString);
var fromFoldable52 = /* @__PURE__ */ fromFoldable32(/* @__PURE__ */ ordRecord()(/* @__PURE__ */ ordRecordCons(/* @__PURE__ */ ordRecordCons(ordRecordNil)()({
  reflectSymbol: function() {
    return "pid";
  }
})(ordString))()({
  reflectSymbol: function() {
    return "node";
  }
})(ordNodeRef)));
var mempty2 = /* @__PURE__ */ mempty(monoidList);
var obj = /* @__PURE__ */ (function() {
  var $180 = fromFoldable2(foldableArray);
  return function($181) {
    return id($180($181));
  };
})();
var maybeJ = function(f) {
  return function(v) {
    if (v instanceof Just) {
      return f(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return jsonNull;
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 374, column 12 - line 376, column 24): " + [v.constructor.name]);
  };
};
var jint = function($182) {
  return id(toNumber3($182));
};
var field = function(k) {
  return function(o) {
    var v = lookup(k)(o);
    if (v instanceof Just) {
      return new Right(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left("missing field: " + k);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 46, column 13 - line 48, column 43): " + [v.constructor.name]);
  };
};
var errorCodeFromString = function(s) {
  if (s === "InvalidProgram") {
    return InvalidProgram.value;
  }
  ;
  if (s === "InvalidInstruction") {
    return InvalidInstruction.value;
  }
  ;
  if (s === "InvalidRegister") {
    return InvalidRegister.value;
  }
  ;
  if (s === "InvalidJump") {
    return InvalidJump.value;
  }
  ;
  if (s === "UnknownFunction") {
    return UnknownFunction.value;
  }
  ;
  if (s === "UnknownBuiltin") {
    return UnknownBuiltin.value;
  }
  ;
  if (s === "ArityMismatch") {
    return ArityMismatch.value;
  }
  ;
  if (s === "TypeMismatch") {
    return TypeMismatch.value;
  }
  ;
  if (s === "DivisionByZero") {
    return DivisionByZero.value;
  }
  ;
  if (s === "ArithmeticOverflow") {
    return ArithmeticOverflow.value;
  }
  ;
  if (s === "ArithmeticError") {
    return ArithmeticError.value;
  }
  ;
  if (s === "NoModularInverse") {
    return NoModularInverse.value;
  }
  ;
  if (s === "InvalidRoundingMode") {
    return InvalidRoundingMode.value;
  }
  ;
  if (s === "MissingInput") {
    return MissingInput.value;
  }
  ;
  if (s === "MissingContext") {
    return MissingContext.value;
  }
  ;
  if (s === "MissingState") {
    return MissingState.value;
  }
  ;
  if (s === "StatePathInvalid") {
    return StatePathInvalid.value;
  }
  ;
  if (s === "ProcessNotFound") {
    return ProcessNotFound.value;
  }
  ;
  if (s === "ProcessDeadlock") {
    return ProcessDeadlock.value;
  }
  ;
  if (s === "ProcessCancelled") {
    return ProcessCancelled.value;
  }
  ;
  if (s === "MailboxTooLarge") {
    return MailboxTooLarge.value;
  }
  ;
  if (s === "RemoteNodeUnknown") {
    return RemoteNodeUnknown.value;
  }
  ;
  if (s === "RemoteProcessUnknown") {
    return RemoteProcessUnknown.value;
  }
  ;
  if (s === "AmbiguousTransition") {
    return AmbiguousTransition.value;
  }
  ;
  if (s === "NoTransition") {
    return NoTransition.value;
  }
  ;
  if (s === "GuardRejected") {
    return GuardRejected.value;
  }
  ;
  if (s === "InvariantFailed") {
    return InvariantFailed.value;
  }
  ;
  if (s === "ProofAssertionFailed") {
    return ProofAssertionFailed.value;
  }
  ;
  if (s === "StepLimitExceeded") {
    return StepLimitExceeded.value;
  }
  ;
  if (s === "TraceLimitExceeded") {
    return TraceLimitExceeded.value;
  }
  ;
  if (s === "UnsupportedVersion") {
    return UnsupportedVersion.value;
  }
  ;
  var v = bind3(stripPrefix("CustomErrorCode ")(s))(fromString);
  if (v instanceof Just) {
    return new CustomErrorCode(v.value0);
  }
  ;
  if (v instanceof Nothing) {
    return new CustomErrorCode(0);
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 349, column 8 - line 351, column 35): " + [v.constructor.name]);
};
var encWait = function(v) {
  if (v instanceof WaitingForMessage) {
    return obj([new Tuple("w", id("message"))]);
  }
  ;
  if (v instanceof WaitingOnMatch) {
    return obj([new Tuple("w", id("match")), new Tuple("tag", id(v.value0))]);
  }
  ;
  if (v instanceof WaitingForProcess) {
    return obj([new Tuple("w", id("process")), new Tuple("pid", id(v.value0))]);
  }
  ;
  if (v instanceof WaitingForMonitor) {
    return obj([new Tuple("w", id("monitor")), new Tuple("ref", id(v.value0))]);
  }
  ;
  if (v instanceof WaitingForTick) {
    return obj([new Tuple("w", id("tick")), new Tuple("tick", jint(v.value0))]);
  }
  ;
  if (v instanceof WaitingForRemoteNode) {
    return obj([new Tuple("w", id("rnode")), new Tuple("node", id(v.value0))]);
  }
  ;
  if (v instanceof WaitingForRemoteProcess) {
    return obj([new Tuple("w", id("rproc")), new Tuple("node", id(v.value0.node)), new Tuple("pid", id(v.value0.pid))]);
  }
  ;
  if (v instanceof WaitingOnEffect) {
    return obj([new Tuple("w", id("effect")), new Tuple("key", id(v.value0))]);
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 255, column 11 - line 263, column 99): " + [v.constructor.name]);
};
var $lazy_encVal = /* @__PURE__ */ $runtime_lazy3("encVal", "FinVM.Encoding.Resume", function() {
  var nodeStr = function(v) {
    return v;
  };
  var encSPair = function(v) {
    return obj([new Tuple("k", id(v.value0)), new Tuple("v", $lazy_encVal(124)(v.value1))]);
  };
  var encPair = function(v) {
    return obj([new Tuple("k", $lazy_encVal(123)(v.value0)), new Tuple("v", $lazy_encVal(123)(v.value1))]);
  };
  return function(v) {
    if (v instanceof VUnit) {
      return jsonNull;
    }
    ;
    if (v instanceof VBool) {
      return obj([new Tuple("bool", id(v.value0))]);
    }
    ;
    if (v instanceof VInt) {
      return obj([new Tuple("int", id(toString2(v.value0)))]);
    }
    ;
    if (v instanceof VFixed) {
      return obj([new Tuple("fixed", obj([new Tuple("value", id(toString2(v.value0.value))), new Tuple("scale", jint(v.value0.scale))]))]);
    }
    ;
    if (v instanceof VRational) {
      return obj([new Tuple("rational", obj([new Tuple("num", id(toString2(v.value0.numerator))), new Tuple("den", id(toString2(v.value0.denominator)))]))]);
    }
    ;
    if (v instanceof VString) {
      return obj([new Tuple("string", id(v.value0))]);
    }
    ;
    if (v instanceof VSymbol) {
      return obj([new Tuple("symbol", id(v.value0))]);
    }
    ;
    if (v instanceof VBytes) {
      return obj([new Tuple("bytes", id(map6(jint)(v.value0)))]);
    }
    ;
    if (v instanceof VList) {
      return obj([new Tuple("list", id(map6($lazy_encVal(99))(toArray2(v.value0))))]);
    }
    ;
    if (v instanceof VMap) {
      return obj([new Tuple("vmap", id(map6(encPair)(toUnfoldable6(v.value0))))]);
    }
    ;
    if (v instanceof VRecord) {
      return obj([new Tuple("record", id(map6(encSPair)(toUnfoldable6(v.value0))))]);
    }
    ;
    if (v instanceof VVariant) {
      return obj([new Tuple("variant", obj([new Tuple("tag", id(v.value0)), new Tuple("payload", $lazy_encVal(102)(v.value1))]))]);
    }
    ;
    if (v instanceof VOption && v.value0 instanceof Nothing) {
      return obj([new Tuple("none", id(true))]);
    }
    ;
    if (v instanceof VOption && v.value0 instanceof Just) {
      return obj([new Tuple("some", $lazy_encVal(104)(v.value0.value0))]);
    }
    ;
    if (v instanceof VResult && v.value0 instanceof Left) {
      return obj([new Tuple("err", $lazy_encVal(105)(v.value0.value0))]);
    }
    ;
    if (v instanceof VResult && v.value0 instanceof Right) {
      return obj([new Tuple("ok", $lazy_encVal(106)(v.value0.value0))]);
    }
    ;
    if (v instanceof VFunctionRef) {
      return obj([new Tuple("fn", id(v.value0))]);
    }
    ;
    if (v instanceof VProcessRef) {
      return obj([new Tuple("proc", id(v.value0))]);
    }
    ;
    if (v instanceof VRemoteProcessRef) {
      return obj([new Tuple("rproc", obj([new Tuple("node", id(nodeStr(v.value0.node))), new Tuple("pid", id(v.value0.pid))]))]);
    }
    ;
    if (v instanceof VStateMachineInstance) {
      return obj([new Tuple("sm", obj([new Tuple("machineId", id(v.value0.machineId)), new Tuple("instanceId", id(v.value0.instanceId)), new Tuple("currentState", id(v.value0.currentState)), new Tuple("version", jint(v.value0.version)), new Tuple("historyHash", id(v.value0.historyHash)), new Tuple("data", id(map6(encSPair)(toUnfoldable6(v.value0.data_))))]))]);
    }
    ;
    if (v instanceof VEvent) {
      return obj([new Tuple("event", obj([new Tuple("type", id(v.value0.type_)), new Tuple("payload", $lazy_encVal(118)(v.value0.payload))]))]);
    }
    ;
    if (v instanceof VEffectIntent) {
      return obj([new Tuple("effect", obj([new Tuple("type", id(v.value0.type_)), new Tuple("payload", $lazy_encVal(119)(v.value0.payload))]))]);
    }
    ;
    if (v instanceof VProofValue) {
      return obj([new Tuple("proof", obj([new Tuple("label", id(v.value0.label)), new Tuple("value", $lazy_encVal(120)(v.value0.value))]))]);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 90, column 10 - line 120, column 120): " + [v.constructor.name]);
  };
});
var encVal = /* @__PURE__ */ $lazy_encVal(89);
var encStringMap = function(m) {
  return id(map6(function(v) {
    return obj([new Tuple("k", id(v.value0)), new Tuple("v", encVal(v.value1))]);
  })(toUnfoldable6(m)));
};
var encRemoteLink = function(r) {
  return obj([new Tuple("node", id(r.node)), new Tuple("pid", id(r.pid))]);
};
var encMonitorTarget = function(v) {
  if (v instanceof MonitorLocal) {
    return obj([new Tuple("k", id("local")), new Tuple("pid", id(v.value0))]);
  }
  ;
  if (v instanceof MonitorRemote) {
    return obj([new Tuple("k", id("remote")), new Tuple("node", id(v.value0.node)), new Tuple("pid", id(v.value0.pid))]);
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 142, column 20 - line 148, column 6): " + [v.constructor.name]);
};
var encFrame = function(f) {
  return obj([new Tuple("function", id(f["function"])), new Tuple("pc", jint(f.pc)), new Tuple("registers", id(map6(encVal)(f.registers))), new Tuple("returnRegister", maybeJ(jint)(f.returnRegister)), new Tuple("caller", maybeJ(function(v) {
    return jint(v);
  })(f.caller))]);
};
var encErr = function(v) {
  return obj([new Tuple("code", id(show7(v.value0))), new Tuple("msg", id(v.value1))]);
};
var encStatus = function(v) {
  if (v instanceof ProcessReady) {
    return obj([new Tuple("s", id("ready"))]);
  }
  ;
  if (v instanceof ProcessRunning) {
    return obj([new Tuple("s", id("running"))]);
  }
  ;
  if (v instanceof ProcessWaiting) {
    return obj([new Tuple("s", id("waiting")), new Tuple("cond", encWait(v.value0))]);
  }
  ;
  if (v instanceof ProcessCompleted) {
    return obj([new Tuple("s", id("completed")), new Tuple("value", encVal(v.value0))]);
  }
  ;
  if (v instanceof ProcessFailed) {
    return obj([new Tuple("s", id("failed")), new Tuple("error", encErr(v.value0))]);
  }
  ;
  if (v instanceof ProcessCancelled2) {
    return obj([new Tuple("s", id("cancelled")), new Tuple("reason", id(v.value0.value0))]);
  }
  ;
  if (v instanceof ProcessExited) {
    return obj([new Tuple("s", id("exited")), new Tuple("reason", id(v.value0.value0))]);
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 283, column 13 - line 290, column 109): " + [v.constructor.name]);
};
var encProc = function(p) {
  return obj([new Tuple("pid", id(p.pid)), new Tuple("status", encStatus(p.status)), new Tuple("function", id(p["function"])), new Tuple("frame", encFrame(p.frame)), new Tuple("callStack", id(map6(encFrame)(p.callStack))), new Tuple("mailbox", id(map6(encVal)(p.mailbox))), new Tuple("links", id(map6(id)(toUnfoldable12(p.links)))), new Tuple("remoteLinks", id(map6(encRemoteLink)(toUnfoldable12(p.remoteLinks)))), new Tuple("monitors", id(map6(function(v) {
    return obj([new Tuple("k", id(v.value0)), new Tuple("v", encMonitorTarget(v.value1))]);
  })(toUnfoldable6(p.monitors)))), new Tuple("parent", maybeJ(id)(p.parent)), new Tuple("children", id(map6(id)(toUnfoldable12(p.children)))), new Tuple("trapExit", id(p.trapExit)), new Tuple("name", id(p.metadata.name)), new Tuple("result", maybeJ(encVal)(p.result)), new Tuple("error", maybeJ(encErr)(p.error)), new Tuple("createdSequence", jint(p.createdSequence)), new Tuple("stepsExecuted", jint(p.stepsExecuted))]);
};
var encodeMachineState = function(m) {
  return obj([new Tuple("v", jint(1)), new Tuple("processes", id(map6(encProc)(fromFoldable5(values(m.scheduler.processes))))), new Tuple("readyQueue", id(map6(id)(m.scheduler.readyQueue))), new Tuple("current", maybeJ(id)(m.scheduler.current)), new Tuple("nextPidSequence", jint(m.scheduler.nextPidSequence)), new Tuple("logicalTick", jint(m.scheduler.logicalTick)), new Tuple("state", encStringMap(m.state)), new Tuple("input", encStringMap(m.input)), new Tuple("steps", jint(m.counters.steps))]);
};
var decMaybe = function(f) {
  return function(v) {
    if (v instanceof Nothing) {
      return new Right(Nothing.value);
    }
    ;
    if (v instanceof Just) {
      var $134 = isNull(v.value0);
      if ($134) {
        return new Right(Nothing.value);
      }
      ;
      return map12(Just.create)(f(v.value0));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 379, column 14 - line 381, column 63): " + [v.constructor.name]);
  };
};
var asStr = function(j) {
  var v = toString(j);
  if (v instanceof Just) {
    return new Right(v.value0);
  }
  ;
  if (v instanceof Nothing) {
    return new Left("expected string");
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 56, column 11 - line 58, column 36): " + [v.constructor.name]);
};
var strField = function(k) {
  return function(o) {
    return bind1(field(k)(o))(asStr);
  };
};
var bigField = function(k) {
  return function(o) {
    return bind1(strField(k)(o))(function(s) {
      var v = fromString3(s);
      if (v instanceof Just) {
        return new Right(v.value0);
      }
      ;
      if (v instanceof Nothing) {
        return new Left("bad bigint: " + s);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 84, column 3 - line 86, column 42): " + [v.constructor.name]);
    });
  };
};
var decRationalV = function(o) {
  return bind1(bigField("num")(o))(function(n) {
    return bind1(bigField("den")(o))(function(d) {
      return pure3(new VRational({
        numerator: n,
        denominator: d
      }));
    });
  });
};
var decRprocV = function(o) {
  return bind1(strField("node")(o))(function(n) {
    return bind1(strField("pid")(o))(function(pid) {
      return pure3(new VRemoteProcessRef({
        node: n,
        pid
      }));
    });
  });
};
var asObj = function(j) {
  var v = toObject(j);
  if (v instanceof Just) {
    return new Right(v.value0);
  }
  ;
  if (v instanceof Nothing) {
    return new Left("expected object");
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 51, column 11 - line 53, column 36): " + [v.constructor.name]);
};
var decErr = function(j) {
  return bind1(asObj(j))(function(o) {
    return bind1(strField("code")(o))(function(code) {
      return bind1(strField("msg")(o))(function(msg) {
        return pure3(new VMError(errorCodeFromString(code), msg));
      });
    });
  });
};
var decMonitorTarget = function(j) {
  return bind1(asObj(j))(function(o) {
    var v = lookup("k")(o);
    if (v instanceof Nothing) {
      return map12(MonitorLocal.create)(strField("v")(o));
    }
    ;
    if (v instanceof Just) {
      return bind1(asStr(v.value0))(function(k) {
        if (k === "local") {
          return map12(MonitorLocal.create)(strField("pid")(o));
        }
        ;
        if (k === "remote") {
          return bind1(strField("node")(o))(function(node) {
            return bind1(strField("pid")(o))(function(pid) {
              return pure3(new MonitorRemote({
                node,
                pid
              }));
            });
          });
        }
        ;
        return new Left("unknown monitor target kind: " + k);
      });
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 154, column 3 - line 164, column 57): " + [v.constructor.name]);
  });
};
var decRemoteLink = function(j) {
  return bind1(asObj(j))(function(o) {
    return bind1(strField("node")(o))(function(node) {
      return bind1(strField("pid")(o))(function(pid) {
        return pure3({
          node,
          pid
        });
      });
    });
  });
};
var asInt = function(j) {
  var v = bind3(toNumber(j))(fromNumber);
  if (v instanceof Just) {
    return new Right(v.value0);
  }
  ;
  if (v instanceof Nothing) {
    return new Left("expected int");
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 61, column 11 - line 63, column 33): " + [v.constructor.name]);
};
var intField = function(k) {
  return function(o) {
    return bind1(field(k)(o))(asInt);
  };
};
var decFixedV = function(o) {
  return bind1(bigField("value")(o))(function(v) {
    return bind1(intField("scale")(o))(function(s) {
      return pure3(new VFixed({
        value: v,
        scale: s
      }));
    });
  });
};
var decWait = function(o) {
  return bind1(strField("w")(o))(function(w) {
    if (w === "message") {
      return new Right(WaitingForMessage.value);
    }
    ;
    if (w === "match") {
      return map12(WaitingOnMatch.create)(strField("tag")(o));
    }
    ;
    if (w === "process") {
      return map12(WaitingForProcess.create)(strField("pid")(o));
    }
    ;
    if (w === "monitor") {
      return map12(WaitingForMonitor.create)(strField("ref")(o));
    }
    ;
    if (w === "tick") {
      return map12(WaitingForTick.create)(intField("tick")(o));
    }
    ;
    if (w === "rnode") {
      return map12(function($183) {
        return WaitingForRemoteNode.create(NodeRef($183));
      })(strField("node")(o));
    }
    ;
    if (w === "rproc") {
      return bind1(strField("node")(o))(function(n) {
        return bind1(strField("pid")(o))(function(pid) {
          return pure3(new WaitingForRemoteProcess({
            node: n,
            pid
          }));
        });
      });
    }
    ;
    if (w === "effect") {
      return map12(WaitingOnEffect.create)(strField("key")(o));
    }
    ;
    return new Left("unknown wait condition: " + w);
  });
};
var asBool = function(j) {
  var v = toBoolean(j);
  if (v instanceof Just) {
    return new Right(v.value0);
  }
  ;
  if (v instanceof Nothing) {
    return new Left("expected bool");
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 66, column 12 - line 68, column 34): " + [v.constructor.name]);
};
var asArr = function(j) {
  var v = toArray(j);
  if (v instanceof Just) {
    return new Right(v.value0);
  }
  ;
  if (v instanceof Nothing) {
    return new Left("expected array");
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 71, column 11 - line 73, column 35): " + [v.constructor.name]);
};
var decVariantV = function(o) {
  return bind1(strField("tag")(o))(function(t) {
    return bind1(bind1(field("payload")(o))(decVal))(function(p) {
      return pure3(new VVariant(t, p));
    });
  });
};
var decVal = function(j) {
  var $152 = isNull(j);
  if ($152) {
    return new Right(VUnit.value);
  }
  ;
  return bind1(asObj(j))(function(o) {
    var has = function(k) {
      return member(k)(o);
    };
    var $153 = has("bool");
    if ($153) {
      return map12(VBool.create)(bind1(field("bool")(o))(asBool));
    }
    ;
    var $154 = has("int");
    if ($154) {
      return map12(VInt.create)(bigField("int")(o));
    }
    ;
    var $155 = has("fixed");
    if ($155) {
      return bind1(bind1(field("fixed")(o))(asObj))(decFixedV);
    }
    ;
    var $156 = has("rational");
    if ($156) {
      return bind1(bind1(field("rational")(o))(asObj))(decRationalV);
    }
    ;
    var $157 = has("string");
    if ($157) {
      return map12(VString.create)(strField("string")(o));
    }
    ;
    var $158 = has("symbol");
    if ($158) {
      return map12(VSymbol.create)(strField("symbol")(o));
    }
    ;
    var $159 = has("bytes");
    if ($159) {
      return map12(VBytes.create)(bind1(bind1(field("bytes")(o))(asArr))(traverse2(asInt)));
    }
    ;
    var $160 = has("list");
    if ($160) {
      return map12(function($184) {
        return VList.create(fromArray($184));
      })(bind1(bind1(field("list")(o))(asArr))(traverse2(decVal)));
    }
    ;
    var $161 = has("vmap");
    if ($161) {
      return map12(function($185) {
        return VMap.create(fromFoldable1($185));
      })(bind1(bind1(field("vmap")(o))(asArr))(traverse2(decVPair)));
    }
    ;
    var $162 = has("record");
    if ($162) {
      return map12(function($186) {
        return VRecord.create(fromFoldable22($186));
      })(bind1(bind1(field("record")(o))(asArr))(traverse2(decSV)));
    }
    ;
    var $163 = has("variant");
    if ($163) {
      return bind1(bind1(field("variant")(o))(asObj))(decVariantV);
    }
    ;
    var $164 = has("none");
    if ($164) {
      return new Right(new VOption(Nothing.value));
    }
    ;
    var $165 = has("some");
    if ($165) {
      return map12(function($187) {
        return VOption.create(Just.create($187));
      })(bind1(field("some")(o))(decVal));
    }
    ;
    var $166 = has("err");
    if ($166) {
      return map12(function($188) {
        return VResult.create(Left.create($188));
      })(bind1(field("err")(o))(decVal));
    }
    ;
    var $167 = has("ok");
    if ($167) {
      return map12(function($189) {
        return VResult.create(Right.create($189));
      })(bind1(field("ok")(o))(decVal));
    }
    ;
    var $168 = has("fn");
    if ($168) {
      return map12(VFunctionRef.create)(strField("fn")(o));
    }
    ;
    var $169 = has("proc");
    if ($169) {
      return map12(VProcessRef.create)(strField("proc")(o));
    }
    ;
    var $170 = has("rproc");
    if ($170) {
      return bind1(bind1(field("rproc")(o))(asObj))(decRprocV);
    }
    ;
    var $171 = has("sm");
    if ($171) {
      return bind1(bind1(field("sm")(o))(asObj))(decSmV);
    }
    ;
    var $172 = has("event");
    if ($172) {
      return bind1(bind1(field("event")(o))(asObj))(decTaggedV(function(t) {
        return function(p) {
          return new VEvent({
            type_: t,
            payload: p
          });
        };
      }));
    }
    ;
    var $173 = has("effect");
    if ($173) {
      return bind1(bind1(field("effect")(o))(asObj))(decTaggedV(function(t) {
        return function(p) {
          return new VEffectIntent({
            type_: t,
            payload: p
          });
        };
      }));
    }
    ;
    var $174 = has("proof");
    if ($174) {
      return bind1(bind1(field("proof")(o))(asObj))(function(e) {
        return bind1(strField("label")(e))(function(l) {
          return bind1(bind1(field("value")(e))(decVal))(function(v) {
            return pure3(new VProofValue({
              label: l,
              value: v
            }));
          });
        });
      });
    }
    ;
    return new Left("unknown Value tag in snapshot");
  });
};
var decVPair = function(x) {
  return bind1(asObj(x))(function(p) {
    return bind1(bind1(field("k")(p))(decVal))(function(k) {
      return bind1(bind1(field("v")(p))(decVal))(function(v) {
        return pure3(new Tuple(k, v));
      });
    });
  });
};
var decTaggedV = function(mk) {
  return function(o) {
    return bind1(strField("type")(o))(function(t) {
      return bind1(bind1(field("payload")(o))(decVal))(function(p) {
        return pure3(mk(t)(p));
      });
    });
  };
};
var decSmV = function(o) {
  return bind1(bind1(bind1(field("data")(o))(asArr))(traverse2(decSV)))(function(d) {
    return bind1(strField("machineId")(o))(function(mid) {
      return bind1(strField("instanceId")(o))(function(iid) {
        return bind1(strField("currentState")(o))(function(cs) {
          return bind1(intField("version")(o))(function(ver) {
            return bind1(strField("historyHash")(o))(function(hh) {
              return pure3(new VStateMachineInstance({
                machineId: mid,
                instanceId: iid,
                currentState: cs,
                data_: fromFoldable22(d),
                version: ver,
                historyHash: hh
              }));
            });
          });
        });
      });
    });
  });
};
var decSV = function(x) {
  return bind1(asObj(x))(function(p) {
    return bind1(strField("k")(p))(function(k) {
      return bind1(bind1(field("v")(p))(decVal))(function(v) {
        return pure3(new Tuple(k, v));
      });
    });
  });
};
var decFrame = function(j) {
  return bind1(asObj(j))(function(o) {
    return bind1(strField("function")(o))(function(fn) {
      return bind1(intField("pc")(o))(function(pc) {
        return bind1(bind1(bind1(field("registers")(o))(asArr))(traverse2(decVal)))(function(regs) {
          return bind1(decMaybe(asInt)(lookup("returnRegister")(o)))(function(rr) {
            return bind1(decMaybe(function(x) {
              return map12(FrameRef)(asInt(x));
            })(lookup("caller")(o)))(function(caller) {
              return pure3({
                "function": fn,
                pc,
                registers: regs,
                returnRegister: rr,
                caller
              });
            });
          });
        });
      });
    });
  });
};
var decStringMap = function(j) {
  return map12(fromFoldable22)(bind1(asArr(j))(traverse2(decSV)));
};
var decStatus = function(j) {
  return bind1(asObj(j))(function(o) {
    return bind1(strField("s")(o))(function(s) {
      if (s === "ready") {
        return new Right(ProcessReady.value);
      }
      ;
      if (s === "running") {
        return new Right(ProcessRunning.value);
      }
      ;
      if (s === "waiting") {
        return map12(ProcessWaiting.create)(bind1(bind1(field("cond")(o))(asObj))(decWait));
      }
      ;
      if (s === "completed") {
        return map12(ProcessCompleted.create)(bind1(field("value")(o))(decVal));
      }
      ;
      if (s === "failed") {
        return map12(ProcessFailed.create)(bind1(field("error")(o))(decErr));
      }
      ;
      if (s === "cancelled") {
        return map12(function($190) {
          return ProcessCancelled2.create(CancelReason.create($190));
        })(strField("reason")(o));
      }
      ;
      if (s === "exited") {
        return map12(function($191) {
          return ProcessExited.create(ExitReason.create($191));
        })(strField("reason")(o));
      }
      ;
      return new Left("unknown status: " + s);
    });
  });
};
var decProc = function(j) {
  var decMonitorKV = function(x) {
    return bind1(asObj(x))(function(p) {
      return bind1(strField("k")(p))(function(k) {
        return bind1(field("v")(p))(function(mv) {
          return bind1((function() {
            var v = toString(mv);
            if (v instanceof Just) {
              return pure3(new MonitorLocal(v.value0));
            }
            ;
            if (v instanceof Nothing) {
              return decMonitorTarget(mv);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 441, column 12 - line 443, column 39): " + [v.constructor.name]);
          })())(function(v) {
            return pure3(new Tuple(k, v));
          });
        });
      });
    });
  };
  return bind1(asObj(j))(function(o) {
    return bind1(strField("pid")(o))(function(pid) {
      return bind1(bind1(field("status")(o))(decStatus))(function(status) {
        return bind1(strField("function")(o))(function(fn) {
          return bind1(bind1(field("frame")(o))(decFrame))(function(frame) {
            return bind1(bind1(bind1(field("callStack")(o))(asArr))(traverse2(decFrame)))(function(callStack) {
              return bind1(bind1(bind1(field("mailbox")(o))(asArr))(traverse2(decVal)))(function(mailbox) {
                return bind1(bind1(bind1(field("links")(o))(asArr))(traverse2(asStr)))(function(links) {
                  return bind1((function() {
                    var v = lookup("remoteLinks")(o);
                    if (v instanceof Just) {
                      return bind1(asArr(v.value0))(traverse2(decRemoteLink));
                    }
                    ;
                    if (v instanceof Nothing) {
                      return pure3([]);
                    }
                    ;
                    throw new Error("Failed pattern match at FinVM.Encoding.Resume (line 414, column 18 - line 416, column 23): " + [v.constructor.name]);
                  })())(function(remoteLinks) {
                    return bind1(bind1(bind1(field("monitors")(o))(asArr))(traverse2(decMonitorKV)))(function(monitors) {
                      return bind1(decMaybe(asStr)(lookup("parent")(o)))(function(parent) {
                        return bind1(bind1(bind1(field("children")(o))(asArr))(traverse2(asStr)))(function(children) {
                          return bind1(bind1(field("trapExit")(o))(asBool))(function(trapExit) {
                            return bind1(strField("name")(o))(function(name) {
                              return bind1(decMaybe(decVal)(lookup("result")(o)))(function(result) {
                                return bind1(decMaybe(decErr)(lookup("error")(o)))(function(err) {
                                  return bind1(intField("createdSequence")(o))(function(cseq) {
                                    return bind1(intField("stepsExecuted")(o))(function(steps) {
                                      return pure3({
                                        pid,
                                        status,
                                        "function": fn,
                                        frame,
                                        callStack,
                                        mailbox,
                                        links: fromFoldable42(links),
                                        remoteLinks: fromFoldable52(remoteLinks),
                                        monitors: fromFoldable22(monitors),
                                        parent,
                                        children: fromFoldable42(children),
                                        trapExit,
                                        metadata: {
                                          name
                                        },
                                        result,
                                        error: err,
                                        createdSequence: cseq,
                                        stepsExecuted: steps
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
var decodeMachineState = function(base) {
  return function(j) {
    return bind1(asObj(j))(function(o) {
      return bind1(bind1(bind1(field("processes")(o))(asArr))(traverse2(decProc)))(function(procsArr) {
        return bind1(bind1(bind1(field("readyQueue")(o))(asArr))(traverse2(asStr)))(function(readyQueue) {
          return bind1(decMaybe(asStr)(lookup("current")(o)))(function(current) {
            return bind1(intField("nextPidSequence")(o))(function(nextPid2) {
              return bind1(intField("logicalTick")(o))(function(tick) {
                return bind1(bind1(field("state")(o))(decStringMap))(function(state) {
                  return bind1(bind1(field("input")(o))(decStringMap))(function(input) {
                    return bind1(intField("steps")(o))(function(steps) {
                      var processes = fromFoldable22(map6(function(p) {
                        return new Tuple(p.pid, p);
                      })(procsArr));
                      return pure3({
                        config: base.config,
                        labelCache: base.labelCache,
                        program: base.program,
                        scheduler: {
                          processes,
                          readyQueue,
                          current,
                          nextPidSequence: nextPid2,
                          logicalTick: tick,
                          scheduleTrace: []
                        },
                        state,
                        input,
                        counters: {
                          steps
                        },
                        trace: mempty2,
                        proofTrace: mempty2,
                        outbox: mempty2,
                        events: mempty2
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  };
};

// output/Data.Map/index.js
var keys3 = /* @__PURE__ */ (function() {
  var $38 = $$void(functorMap);
  return function($39) {
    return fromMap($38($39));
  };
})();

// output/FinVM.Numeric.Rounding/index.js
var RoundDown = /* @__PURE__ */ (function() {
  function RoundDown2() {
  }
  ;
  RoundDown2.value = new RoundDown2();
  return RoundDown2;
})();
var RoundUp = /* @__PURE__ */ (function() {
  function RoundUp2() {
  }
  ;
  RoundUp2.value = new RoundUp2();
  return RoundUp2;
})();
var RoundHalfEven = /* @__PURE__ */ (function() {
  function RoundHalfEven2() {
  }
  ;
  RoundHalfEven2.value = new RoundHalfEven2();
  return RoundHalfEven2;
})();
var RoundTowardZero = /* @__PURE__ */ (function() {
  function RoundTowardZero2() {
  }
  ;
  RoundTowardZero2.value = new RoundTowardZero2();
  return RoundTowardZero2;
})();
var RoundAwayFromZero = /* @__PURE__ */ (function() {
  function RoundAwayFromZero2() {
  }
  ;
  RoundAwayFromZero2.value = new RoundAwayFromZero2();
  return RoundAwayFromZero2;
})();
var showRounding = {
  show: function(v) {
    if (v instanceof RoundDown) {
      return "RoundDown";
    }
    ;
    if (v instanceof RoundUp) {
      return "RoundUp";
    }
    ;
    if (v instanceof RoundHalfEven) {
      return "RoundHalfEven";
    }
    ;
    if (v instanceof RoundTowardZero) {
      return "RoundTowardZero";
    }
    ;
    if (v instanceof RoundAwayFromZero) {
      return "RoundAwayFromZero";
    }
    ;
    throw new Error("Failed pattern match at FinVM.Numeric.Rounding (line 14, column 1 - line 19, column 47): " + [v.constructor.name]);
  }
};

// output/FinVM.Instruction/index.js
var show8 = /* @__PURE__ */ show(showInt);
var show14 = /* @__PURE__ */ show(/* @__PURE__ */ showArray(showInt));
var show24 = /* @__PURE__ */ show(showRounding);
var NOOP = /* @__PURE__ */ (function() {
  function NOOP2() {
  }
  ;
  NOOP2.value = new NOOP2();
  return NOOP2;
})();
var HALT = /* @__PURE__ */ (function() {
  function HALT2(value0) {
    this.value0 = value0;
  }
  ;
  HALT2.create = function(value0) {
    return new HALT2(value0);
  };
  return HALT2;
})();
var ABORT = /* @__PURE__ */ (function() {
  function ABORT2(value0) {
    this.value0 = value0;
  }
  ;
  ABORT2.create = function(value0) {
    return new ABORT2(value0);
  };
  return ABORT2;
})();
var LABEL = /* @__PURE__ */ (function() {
  function LABEL2(value0) {
    this.value0 = value0;
  }
  ;
  LABEL2.create = function(value0) {
    return new LABEL2(value0);
  };
  return LABEL2;
})();
var JUMP = /* @__PURE__ */ (function() {
  function JUMP2(value0) {
    this.value0 = value0;
  }
  ;
  JUMP2.create = function(value0) {
    return new JUMP2(value0);
  };
  return JUMP2;
})();
var JUMP_IF = /* @__PURE__ */ (function() {
  function JUMP_IF2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  JUMP_IF2.create = function(value0) {
    return function(value1) {
      return new JUMP_IF2(value0, value1);
    };
  };
  return JUMP_IF2;
})();
var JUMP_IF_FALSE = /* @__PURE__ */ (function() {
  function JUMP_IF_FALSE2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  JUMP_IF_FALSE2.create = function(value0) {
    return function(value1) {
      return new JUMP_IF_FALSE2(value0, value1);
    };
  };
  return JUMP_IF_FALSE2;
})();
var CALL = /* @__PURE__ */ (function() {
  function CALL2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  CALL2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new CALL2(value0, value1, value2);
      };
    };
  };
  return CALL2;
})();
var TAIL_CALL = /* @__PURE__ */ (function() {
  function TAIL_CALL2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  TAIL_CALL2.create = function(value0) {
    return function(value1) {
      return new TAIL_CALL2(value0, value1);
    };
  };
  return TAIL_CALL2;
})();
var RETURN = /* @__PURE__ */ (function() {
  function RETURN2(value0) {
    this.value0 = value0;
  }
  ;
  RETURN2.create = function(value0) {
    return new RETURN2(value0);
  };
  return RETURN2;
})();
var LOAD_CONST = /* @__PURE__ */ (function() {
  function LOAD_CONST2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  LOAD_CONST2.create = function(value0) {
    return function(value1) {
      return new LOAD_CONST2(value0, value1);
    };
  };
  return LOAD_CONST2;
})();
var LOAD_INPUT = /* @__PURE__ */ (function() {
  function LOAD_INPUT2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  LOAD_INPUT2.create = function(value0) {
    return function(value1) {
      return new LOAD_INPUT2(value0, value1);
    };
  };
  return LOAD_INPUT2;
})();
var LOAD_CONTEXT = /* @__PURE__ */ (function() {
  function LOAD_CONTEXT2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  LOAD_CONTEXT2.create = function(value0) {
    return function(value1) {
      return new LOAD_CONTEXT2(value0, value1);
    };
  };
  return LOAD_CONTEXT2;
})();
var MOVE = /* @__PURE__ */ (function() {
  function MOVE2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  MOVE2.create = function(value0) {
    return function(value1) {
      return new MOVE2(value0, value1);
    };
  };
  return MOVE2;
})();
var CLEAR = /* @__PURE__ */ (function() {
  function CLEAR2(value0) {
    this.value0 = value0;
  }
  ;
  CLEAR2.create = function(value0) {
    return new CLEAR2(value0);
  };
  return CLEAR2;
})();
var RECORD_NEW = /* @__PURE__ */ (function() {
  function RECORD_NEW2(value0) {
    this.value0 = value0;
  }
  ;
  RECORD_NEW2.create = function(value0) {
    return new RECORD_NEW2(value0);
  };
  return RECORD_NEW2;
})();
var RECORD_GET = /* @__PURE__ */ (function() {
  function RECORD_GET2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  RECORD_GET2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new RECORD_GET2(value0, value1, value2);
      };
    };
  };
  return RECORD_GET2;
})();
var RECORD_GET_OPT = /* @__PURE__ */ (function() {
  function RECORD_GET_OPT2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  RECORD_GET_OPT2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new RECORD_GET_OPT2(value0, value1, value2);
      };
    };
  };
  return RECORD_GET_OPT2;
})();
var RECORD_SET = /* @__PURE__ */ (function() {
  function RECORD_SET2(value0, value1, value2, value3) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }
  ;
  RECORD_SET2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return new RECORD_SET2(value0, value1, value2, value3);
        };
      };
    };
  };
  return RECORD_SET2;
})();
var RECORD_HAS = /* @__PURE__ */ (function() {
  function RECORD_HAS2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  RECORD_HAS2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new RECORD_HAS2(value0, value1, value2);
      };
    };
  };
  return RECORD_HAS2;
})();
var RECORD_REMOVE = /* @__PURE__ */ (function() {
  function RECORD_REMOVE2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  RECORD_REMOVE2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new RECORD_REMOVE2(value0, value1, value2);
      };
    };
  };
  return RECORD_REMOVE2;
})();
var RECORD_KEYS = /* @__PURE__ */ (function() {
  function RECORD_KEYS2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  RECORD_KEYS2.create = function(value0) {
    return function(value1) {
      return new RECORD_KEYS2(value0, value1);
    };
  };
  return RECORD_KEYS2;
})();
var LIST_NEW = /* @__PURE__ */ (function() {
  function LIST_NEW2(value0) {
    this.value0 = value0;
  }
  ;
  LIST_NEW2.create = function(value0) {
    return new LIST_NEW2(value0);
  };
  return LIST_NEW2;
})();
var LIST_FROM = /* @__PURE__ */ (function() {
  function LIST_FROM2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  LIST_FROM2.create = function(value0) {
    return function(value1) {
      return new LIST_FROM2(value0, value1);
    };
  };
  return LIST_FROM2;
})();
var LIST_GET = /* @__PURE__ */ (function() {
  function LIST_GET2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  LIST_GET2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new LIST_GET2(value0, value1, value2);
      };
    };
  };
  return LIST_GET2;
})();
var LIST_SET = /* @__PURE__ */ (function() {
  function LIST_SET2(value0, value1, value2, value3) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }
  ;
  LIST_SET2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return new LIST_SET2(value0, value1, value2, value3);
        };
      };
    };
  };
  return LIST_SET2;
})();
var LIST_APPEND = /* @__PURE__ */ (function() {
  function LIST_APPEND2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  LIST_APPEND2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new LIST_APPEND2(value0, value1, value2);
      };
    };
  };
  return LIST_APPEND2;
})();
var LIST_LENGTH = /* @__PURE__ */ (function() {
  function LIST_LENGTH2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  LIST_LENGTH2.create = function(value0) {
    return function(value1) {
      return new LIST_LENGTH2(value0, value1);
    };
  };
  return LIST_LENGTH2;
})();
var LIST_SLICE = /* @__PURE__ */ (function() {
  function LIST_SLICE2(value0, value1, value2, value3) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }
  ;
  LIST_SLICE2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return new LIST_SLICE2(value0, value1, value2, value3);
        };
      };
    };
  };
  return LIST_SLICE2;
})();
var MAP_NEW = /* @__PURE__ */ (function() {
  function MAP_NEW2(value0) {
    this.value0 = value0;
  }
  ;
  MAP_NEW2.create = function(value0) {
    return new MAP_NEW2(value0);
  };
  return MAP_NEW2;
})();
var MAP_GET = /* @__PURE__ */ (function() {
  function MAP_GET2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MAP_GET2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MAP_GET2(value0, value1, value2);
      };
    };
  };
  return MAP_GET2;
})();
var MAP_GET_OPT = /* @__PURE__ */ (function() {
  function MAP_GET_OPT2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MAP_GET_OPT2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MAP_GET_OPT2(value0, value1, value2);
      };
    };
  };
  return MAP_GET_OPT2;
})();
var MAP_SET = /* @__PURE__ */ (function() {
  function MAP_SET2(value0, value1, value2, value3) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }
  ;
  MAP_SET2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return new MAP_SET2(value0, value1, value2, value3);
        };
      };
    };
  };
  return MAP_SET2;
})();
var MAP_HAS = /* @__PURE__ */ (function() {
  function MAP_HAS2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MAP_HAS2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MAP_HAS2(value0, value1, value2);
      };
    };
  };
  return MAP_HAS2;
})();
var MAP_REMOVE = /* @__PURE__ */ (function() {
  function MAP_REMOVE2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MAP_REMOVE2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MAP_REMOVE2(value0, value1, value2);
      };
    };
  };
  return MAP_REMOVE2;
})();
var MAP_KEYS = /* @__PURE__ */ (function() {
  function MAP_KEYS2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  MAP_KEYS2.create = function(value0) {
    return function(value1) {
      return new MAP_KEYS2(value0, value1);
    };
  };
  return MAP_KEYS2;
})();
var MAP_VALUES = /* @__PURE__ */ (function() {
  function MAP_VALUES2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  MAP_VALUES2.create = function(value0) {
    return function(value1) {
      return new MAP_VALUES2(value0, value1);
    };
  };
  return MAP_VALUES2;
})();
var MAP_SIZE = /* @__PURE__ */ (function() {
  function MAP_SIZE2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  MAP_SIZE2.create = function(value0) {
    return function(value1) {
      return new MAP_SIZE2(value0, value1);
    };
  };
  return MAP_SIZE2;
})();
var VARIANT_NEW = /* @__PURE__ */ (function() {
  function VARIANT_NEW2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  VARIANT_NEW2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new VARIANT_NEW2(value0, value1, value2);
      };
    };
  };
  return VARIANT_NEW2;
})();
var VARIANT_TAG = /* @__PURE__ */ (function() {
  function VARIANT_TAG2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  VARIANT_TAG2.create = function(value0) {
    return function(value1) {
      return new VARIANT_TAG2(value0, value1);
    };
  };
  return VARIANT_TAG2;
})();
var VARIANT_PAYLOAD = /* @__PURE__ */ (function() {
  function VARIANT_PAYLOAD2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  VARIANT_PAYLOAD2.create = function(value0) {
    return function(value1) {
      return new VARIANT_PAYLOAD2(value0, value1);
    };
  };
  return VARIANT_PAYLOAD2;
})();
var ADD = /* @__PURE__ */ (function() {
  function ADD2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  ADD2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new ADD2(value0, value1, value2);
      };
    };
  };
  return ADD2;
})();
var SUB = /* @__PURE__ */ (function() {
  function SUB2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  SUB2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new SUB2(value0, value1, value2);
      };
    };
  };
  return SUB2;
})();
var MUL = /* @__PURE__ */ (function() {
  function MUL2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MUL2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MUL2(value0, value1, value2);
      };
    };
  };
  return MUL2;
})();
var DIV = /* @__PURE__ */ (function() {
  function DIV2(value0, value1, value2, value3) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }
  ;
  DIV2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return new DIV2(value0, value1, value2, value3);
        };
      };
    };
  };
  return DIV2;
})();
var MOD = /* @__PURE__ */ (function() {
  function MOD2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MOD2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MOD2(value0, value1, value2);
      };
    };
  };
  return MOD2;
})();
var NEG = /* @__PURE__ */ (function() {
  function NEG2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NEG2.create = function(value0) {
    return function(value1) {
      return new NEG2(value0, value1);
    };
  };
  return NEG2;
})();
var ABS = /* @__PURE__ */ (function() {
  function ABS2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  ABS2.create = function(value0) {
    return function(value1) {
      return new ABS2(value0, value1);
    };
  };
  return ABS2;
})();
var MIN = /* @__PURE__ */ (function() {
  function MIN2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MIN2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MIN2(value0, value1, value2);
      };
    };
  };
  return MIN2;
})();
var MAX = /* @__PURE__ */ (function() {
  function MAX2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MAX2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MAX2(value0, value1, value2);
      };
    };
  };
  return MAX2;
})();
var CLAMP = /* @__PURE__ */ (function() {
  function CLAMP2(value0, value1, value2, value3) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }
  ;
  CLAMP2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return new CLAMP2(value0, value1, value2, value3);
        };
      };
    };
  };
  return CLAMP2;
})();
var EQ2 = /* @__PURE__ */ (function() {
  function EQ3(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  EQ3.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new EQ3(value0, value1, value2);
      };
    };
  };
  return EQ3;
})();
var NEQ = /* @__PURE__ */ (function() {
  function NEQ2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  NEQ2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new NEQ2(value0, value1, value2);
      };
    };
  };
  return NEQ2;
})();
var LT2 = /* @__PURE__ */ (function() {
  function LT3(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  LT3.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new LT3(value0, value1, value2);
      };
    };
  };
  return LT3;
})();
var LTE = /* @__PURE__ */ (function() {
  function LTE2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  LTE2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new LTE2(value0, value1, value2);
      };
    };
  };
  return LTE2;
})();
var GT2 = /* @__PURE__ */ (function() {
  function GT3(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  GT3.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new GT3(value0, value1, value2);
      };
    };
  };
  return GT3;
})();
var GTE = /* @__PURE__ */ (function() {
  function GTE2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  GTE2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new GTE2(value0, value1, value2);
      };
    };
  };
  return GTE2;
})();
var COMPARE = /* @__PURE__ */ (function() {
  function COMPARE2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  COMPARE2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new COMPARE2(value0, value1, value2);
      };
    };
  };
  return COMPARE2;
})();
var CALL_BUILTIN = /* @__PURE__ */ (function() {
  function CALL_BUILTIN2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  CALL_BUILTIN2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new CALL_BUILTIN2(value0, value1, value2);
      };
    };
  };
  return CALL_BUILTIN2;
})();
var STATE_GET = /* @__PURE__ */ (function() {
  function STATE_GET2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  STATE_GET2.create = function(value0) {
    return function(value1) {
      return new STATE_GET2(value0, value1);
    };
  };
  return STATE_GET2;
})();
var STATE_GET_OPT = /* @__PURE__ */ (function() {
  function STATE_GET_OPT2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  STATE_GET_OPT2.create = function(value0) {
    return function(value1) {
      return new STATE_GET_OPT2(value0, value1);
    };
  };
  return STATE_GET_OPT2;
})();
var STATE_SET = /* @__PURE__ */ (function() {
  function STATE_SET2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  STATE_SET2.create = function(value0) {
    return function(value1) {
      return new STATE_SET2(value0, value1);
    };
  };
  return STATE_SET2;
})();
var STATE_DELETE = /* @__PURE__ */ (function() {
  function STATE_DELETE2(value0) {
    this.value0 = value0;
  }
  ;
  STATE_DELETE2.create = function(value0) {
    return new STATE_DELETE2(value0);
  };
  return STATE_DELETE2;
})();
var STATE_EXISTS = /* @__PURE__ */ (function() {
  function STATE_EXISTS2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  STATE_EXISTS2.create = function(value0) {
    return function(value1) {
      return new STATE_EXISTS2(value0, value1);
    };
  };
  return STATE_EXISTS2;
})();
var STATE_KEYS = /* @__PURE__ */ (function() {
  function STATE_KEYS2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  STATE_KEYS2.create = function(value0) {
    return function(value1) {
      return new STATE_KEYS2(value0, value1);
    };
  };
  return STATE_KEYS2;
})();
var STATE_SNAPSHOT = /* @__PURE__ */ (function() {
  function STATE_SNAPSHOT2(value0) {
    this.value0 = value0;
  }
  ;
  STATE_SNAPSHOT2.create = function(value0) {
    return new STATE_SNAPSHOT2(value0);
  };
  return STATE_SNAPSHOT2;
})();
var EVENT_NEW = /* @__PURE__ */ (function() {
  function EVENT_NEW2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  EVENT_NEW2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new EVENT_NEW2(value0, value1, value2);
      };
    };
  };
  return EVENT_NEW2;
})();
var EVENT_EMIT = /* @__PURE__ */ (function() {
  function EVENT_EMIT2(value0) {
    this.value0 = value0;
  }
  ;
  EVENT_EMIT2.create = function(value0) {
    return new EVENT_EMIT2(value0);
  };
  return EVENT_EMIT2;
})();
var EVENT_BATCH_NEW = /* @__PURE__ */ (function() {
  function EVENT_BATCH_NEW2(value0) {
    this.value0 = value0;
  }
  ;
  EVENT_BATCH_NEW2.create = function(value0) {
    return new EVENT_BATCH_NEW2(value0);
  };
  return EVENT_BATCH_NEW2;
})();
var EVENT_BATCH_APPEND = /* @__PURE__ */ (function() {
  function EVENT_BATCH_APPEND2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  EVENT_BATCH_APPEND2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new EVENT_BATCH_APPEND2(value0, value1, value2);
      };
    };
  };
  return EVENT_BATCH_APPEND2;
})();
var EFFECT_NEW = /* @__PURE__ */ (function() {
  function EFFECT_NEW2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  EFFECT_NEW2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new EFFECT_NEW2(value0, value1, value2);
      };
    };
  };
  return EFFECT_NEW2;
})();
var EFFECT_REQUEST = /* @__PURE__ */ (function() {
  function EFFECT_REQUEST2(value0) {
    this.value0 = value0;
  }
  ;
  EFFECT_REQUEST2.create = function(value0) {
    return new EFFECT_REQUEST2(value0);
  };
  return EFFECT_REQUEST2;
})();
var EFFECT_AWAIT = /* @__PURE__ */ (function() {
  function EFFECT_AWAIT2(value0) {
    this.value0 = value0;
  }
  ;
  EFFECT_AWAIT2.create = function(value0) {
    return new EFFECT_AWAIT2(value0);
  };
  return EFFECT_AWAIT2;
})();
var EFFECT_BATCH_NEW = /* @__PURE__ */ (function() {
  function EFFECT_BATCH_NEW2(value0) {
    this.value0 = value0;
  }
  ;
  EFFECT_BATCH_NEW2.create = function(value0) {
    return new EFFECT_BATCH_NEW2(value0);
  };
  return EFFECT_BATCH_NEW2;
})();
var EFFECT_BATCH_APPEND = /* @__PURE__ */ (function() {
  function EFFECT_BATCH_APPEND2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  EFFECT_BATCH_APPEND2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new EFFECT_BATCH_APPEND2(value0, value1, value2);
      };
    };
  };
  return EFFECT_BATCH_APPEND2;
})();
var PROC_SELF = /* @__PURE__ */ (function() {
  function PROC_SELF2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_SELF2.create = function(value0) {
    return new PROC_SELF2(value0);
  };
  return PROC_SELF2;
})();
var PROC_STATUS = /* @__PURE__ */ (function() {
  function PROC_STATUS2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_STATUS2.create = function(value0) {
    return function(value1) {
      return new PROC_STATUS2(value0, value1);
    };
  };
  return PROC_STATUS2;
})();
var PROC_SPAWN = /* @__PURE__ */ (function() {
  function PROC_SPAWN2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  PROC_SPAWN2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new PROC_SPAWN2(value0, value1, value2);
      };
    };
  };
  return PROC_SPAWN2;
})();
var PROC_YIELD = /* @__PURE__ */ (function() {
  function PROC_YIELD2() {
  }
  ;
  PROC_YIELD2.value = new PROC_YIELD2();
  return PROC_YIELD2;
})();
var PROC_JOIN = /* @__PURE__ */ (function() {
  function PROC_JOIN2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_JOIN2.create = function(value0) {
    return function(value1) {
      return new PROC_JOIN2(value0, value1);
    };
  };
  return PROC_JOIN2;
})();
var PROC_JOIN_RESULT = /* @__PURE__ */ (function() {
  function PROC_JOIN_RESULT2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_JOIN_RESULT2.create = function(value0) {
    return function(value1) {
      return new PROC_JOIN_RESULT2(value0, value1);
    };
  };
  return PROC_JOIN_RESULT2;
})();
var PROC_CANCEL = /* @__PURE__ */ (function() {
  function PROC_CANCEL2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_CANCEL2.create = function(value0) {
    return function(value1) {
      return new PROC_CANCEL2(value0, value1);
    };
  };
  return PROC_CANCEL2;
})();
var PROC_EXIT = /* @__PURE__ */ (function() {
  function PROC_EXIT2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_EXIT2.create = function(value0) {
    return new PROC_EXIT2(value0);
  };
  return PROC_EXIT2;
})();
var PROC_SEND = /* @__PURE__ */ (function() {
  function PROC_SEND2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_SEND2.create = function(value0) {
    return function(value1) {
      return new PROC_SEND2(value0, value1);
    };
  };
  return PROC_SEND2;
})();
var PROC_RECEIVE = /* @__PURE__ */ (function() {
  function PROC_RECEIVE2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_RECEIVE2.create = function(value0) {
    return new PROC_RECEIVE2(value0);
  };
  return PROC_RECEIVE2;
})();
var PROC_RECEIVE_OPT = /* @__PURE__ */ (function() {
  function PROC_RECEIVE_OPT2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_RECEIVE_OPT2.create = function(value0) {
    return new PROC_RECEIVE_OPT2(value0);
  };
  return PROC_RECEIVE_OPT2;
})();
var PROC_RECEIVE_MATCH = /* @__PURE__ */ (function() {
  function PROC_RECEIVE_MATCH2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_RECEIVE_MATCH2.create = function(value0) {
    return function(value1) {
      return new PROC_RECEIVE_MATCH2(value0, value1);
    };
  };
  return PROC_RECEIVE_MATCH2;
})();
var PROC_RECEIVE_MATCH_OPT = /* @__PURE__ */ (function() {
  function PROC_RECEIVE_MATCH_OPT2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_RECEIVE_MATCH_OPT2.create = function(value0) {
    return function(value1) {
      return new PROC_RECEIVE_MATCH_OPT2(value0, value1);
    };
  };
  return PROC_RECEIVE_MATCH_OPT2;
})();
var PROC_LINK = /* @__PURE__ */ (function() {
  function PROC_LINK2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_LINK2.create = function(value0) {
    return new PROC_LINK2(value0);
  };
  return PROC_LINK2;
})();
var PROC_UNLINK = /* @__PURE__ */ (function() {
  function PROC_UNLINK2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_UNLINK2.create = function(value0) {
    return new PROC_UNLINK2(value0);
  };
  return PROC_UNLINK2;
})();
var PROC_MONITOR = /* @__PURE__ */ (function() {
  function PROC_MONITOR2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROC_MONITOR2.create = function(value0) {
    return function(value1) {
      return new PROC_MONITOR2(value0, value1);
    };
  };
  return PROC_MONITOR2;
})();
var PROC_DEMONITOR = /* @__PURE__ */ (function() {
  function PROC_DEMONITOR2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_DEMONITOR2.create = function(value0) {
    return new PROC_DEMONITOR2(value0);
  };
  return PROC_DEMONITOR2;
})();
var PROC_TRAP_EXIT = /* @__PURE__ */ (function() {
  function PROC_TRAP_EXIT2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_TRAP_EXIT2.create = function(value0) {
    return new PROC_TRAP_EXIT2(value0);
  };
  return PROC_TRAP_EXIT2;
})();
var PROC_SLEEP_TICKS = /* @__PURE__ */ (function() {
  function PROC_SLEEP_TICKS2(value0) {
    this.value0 = value0;
  }
  ;
  PROC_SLEEP_TICKS2.create = function(value0) {
    return new PROC_SLEEP_TICKS2(value0);
  };
  return PROC_SLEEP_TICKS2;
})();
var NODE_SELF = /* @__PURE__ */ (function() {
  function NODE_SELF2(value0) {
    this.value0 = value0;
  }
  ;
  NODE_SELF2.create = function(value0) {
    return new NODE_SELF2(value0);
  };
  return NODE_SELF2;
})();
var NODE_STATUS = /* @__PURE__ */ (function() {
  function NODE_STATUS2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NODE_STATUS2.create = function(value0) {
    return function(value1) {
      return new NODE_STATUS2(value0, value1);
    };
  };
  return NODE_STATUS2;
})();
var NODE_KNOWN = /* @__PURE__ */ (function() {
  function NODE_KNOWN2(value0) {
    this.value0 = value0;
  }
  ;
  NODE_KNOWN2.create = function(value0) {
    return new NODE_KNOWN2(value0);
  };
  return NODE_KNOWN2;
})();
var REMOTE_PID_NEW = /* @__PURE__ */ (function() {
  function REMOTE_PID_NEW2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  REMOTE_PID_NEW2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new REMOTE_PID_NEW2(value0, value1, value2);
      };
    };
  };
  return REMOTE_PID_NEW2;
})();
var REMOTE_PID_NODE = /* @__PURE__ */ (function() {
  function REMOTE_PID_NODE2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  REMOTE_PID_NODE2.create = function(value0) {
    return function(value1) {
      return new REMOTE_PID_NODE2(value0, value1);
    };
  };
  return REMOTE_PID_NODE2;
})();
var REMOTE_PID_LOCAL = /* @__PURE__ */ (function() {
  function REMOTE_PID_LOCAL2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  REMOTE_PID_LOCAL2.create = function(value0) {
    return function(value1) {
      return new REMOTE_PID_LOCAL2(value0, value1);
    };
  };
  return REMOTE_PID_LOCAL2;
})();
var NODE_SEND = /* @__PURE__ */ (function() {
  function NODE_SEND2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NODE_SEND2.create = function(value0) {
    return function(value1) {
      return new NODE_SEND2(value0, value1);
    };
  };
  return NODE_SEND2;
})();
var NODE_SPAWN = /* @__PURE__ */ (function() {
  function NODE_SPAWN2(value0, value1, value2, value3) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }
  ;
  NODE_SPAWN2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return function(value3) {
          return new NODE_SPAWN2(value0, value1, value2, value3);
        };
      };
    };
  };
  return NODE_SPAWN2;
})();
var NODE_LINK = /* @__PURE__ */ (function() {
  function NODE_LINK2(value0) {
    this.value0 = value0;
  }
  ;
  NODE_LINK2.create = function(value0) {
    return new NODE_LINK2(value0);
  };
  return NODE_LINK2;
})();
var NODE_UNLINK = /* @__PURE__ */ (function() {
  function NODE_UNLINK2(value0) {
    this.value0 = value0;
  }
  ;
  NODE_UNLINK2.create = function(value0) {
    return new NODE_UNLINK2(value0);
  };
  return NODE_UNLINK2;
})();
var NODE_MONITOR = /* @__PURE__ */ (function() {
  function NODE_MONITOR2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NODE_MONITOR2.create = function(value0) {
    return function(value1) {
      return new NODE_MONITOR2(value0, value1);
    };
  };
  return NODE_MONITOR2;
})();
var NODE_DEMONITOR = /* @__PURE__ */ (function() {
  function NODE_DEMONITOR2(value0) {
    this.value0 = value0;
  }
  ;
  NODE_DEMONITOR2.create = function(value0) {
    return new NODE_DEMONITOR2(value0);
  };
  return NODE_DEMONITOR2;
})();
var NODE_OBSERVE_STATE = /* @__PURE__ */ (function() {
  function NODE_OBSERVE_STATE2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NODE_OBSERVE_STATE2.create = function(value0) {
    return function(value1) {
      return new NODE_OBSERVE_STATE2(value0, value1);
    };
  };
  return NODE_OBSERVE_STATE2;
})();
var NODE_LAST_STATE_HASH = /* @__PURE__ */ (function() {
  function NODE_LAST_STATE_HASH2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NODE_LAST_STATE_HASH2.create = function(value0) {
    return function(value1) {
      return new NODE_LAST_STATE_HASH2(value0, value1);
    };
  };
  return NODE_LAST_STATE_HASH2;
})();
var NODE_LAST_SEEN_TICK = /* @__PURE__ */ (function() {
  function NODE_LAST_SEEN_TICK2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NODE_LAST_SEEN_TICK2.create = function(value0) {
    return function(value1) {
      return new NODE_LAST_SEEN_TICK2(value0, value1);
    };
  };
  return NODE_LAST_SEEN_TICK2;
})();
var NODE_QUERY_STATE = /* @__PURE__ */ (function() {
  function NODE_QUERY_STATE2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  NODE_QUERY_STATE2.create = function(value0) {
    return function(value1) {
      return new NODE_QUERY_STATE2(value0, value1);
    };
  };
  return NODE_QUERY_STATE2;
})();
var MACHINE_NEW = /* @__PURE__ */ (function() {
  function MACHINE_NEW2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MACHINE_NEW2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MACHINE_NEW2(value0, value1, value2);
      };
    };
  };
  return MACHINE_NEW2;
})();
var MACHINE_STATE = /* @__PURE__ */ (function() {
  function MACHINE_STATE2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  MACHINE_STATE2.create = function(value0) {
    return function(value1) {
      return new MACHINE_STATE2(value0, value1);
    };
  };
  return MACHINE_STATE2;
})();
var MACHINE_TRANSITION = /* @__PURE__ */ (function() {
  function MACHINE_TRANSITION2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  MACHINE_TRANSITION2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new MACHINE_TRANSITION2(value0, value1, value2);
      };
    };
  };
  return MACHINE_TRANSITION2;
})();
var ASSERT = /* @__PURE__ */ (function() {
  function ASSERT2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  ASSERT2.create = function(value0) {
    return function(value1) {
      return new ASSERT2(value0, value1);
    };
  };
  return ASSERT2;
})();
var ASSUME = /* @__PURE__ */ (function() {
  function ASSUME2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  ASSUME2.create = function(value0) {
    return function(value1) {
      return new ASSUME2(value0, value1);
    };
  };
  return ASSUME2;
})();
var INVARIANT_CHECK = /* @__PURE__ */ (function() {
  function INVARIANT_CHECK2(value0) {
    this.value0 = value0;
  }
  ;
  INVARIANT_CHECK2.create = function(value0) {
    return new INVARIANT_CHECK2(value0);
  };
  return INVARIANT_CHECK2;
})();
var PROOF_MARK = /* @__PURE__ */ (function() {
  function PROOF_MARK2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  PROOF_MARK2.create = function(value0) {
    return function(value1) {
      return new PROOF_MARK2(value0, value1);
    };
  };
  return PROOF_MARK2;
})();
var PROOF_SCOPE_BEGIN = /* @__PURE__ */ (function() {
  function PROOF_SCOPE_BEGIN2(value0) {
    this.value0 = value0;
  }
  ;
  PROOF_SCOPE_BEGIN2.create = function(value0) {
    return new PROOF_SCOPE_BEGIN2(value0);
  };
  return PROOF_SCOPE_BEGIN2;
})();
var PROOF_SCOPE_END = /* @__PURE__ */ (function() {
  function PROOF_SCOPE_END2(value0) {
    this.value0 = value0;
  }
  ;
  PROOF_SCOPE_END2.create = function(value0) {
    return new PROOF_SCOPE_END2(value0);
  };
  return PROOF_SCOPE_END2;
})();
var showInstruction = {
  show: function(v) {
    if (v instanceof NOOP) {
      return "NOOP";
    }
    ;
    if (v instanceof HALT) {
      return "HALT " + show8(v.value0);
    }
    ;
    if (v instanceof ABORT) {
      return "ABORT " + show8(v.value0);
    }
    ;
    if (v instanceof LABEL) {
      return "LABEL " + v.value0;
    }
    ;
    if (v instanceof JUMP) {
      return "JUMP " + v.value0;
    }
    ;
    if (v instanceof JUMP_IF) {
      return "JUMP_IF " + (show8(v.value0) + (" " + v.value1));
    }
    ;
    if (v instanceof JUMP_IF_FALSE) {
      return "JUMP_IF_FALSE " + (show8(v.value0) + (" " + v.value1));
    }
    ;
    if (v instanceof CALL) {
      return "CALL " + (show8(v.value0) + (" " + (v.value1 + (" " + show14(v.value2)))));
    }
    ;
    if (v instanceof TAIL_CALL) {
      return "TAIL_CALL " + (v.value0 + (" " + show14(v.value1)));
    }
    ;
    if (v instanceof RETURN) {
      return "RETURN " + show8(v.value0);
    }
    ;
    if (v instanceof LOAD_CONST) {
      return "LOAD_CONST " + (show8(v.value0) + (" " + show8(v.value1)));
    }
    ;
    if (v instanceof LOAD_INPUT) {
      return "LOAD_INPUT " + (show8(v.value0) + (" " + v.value1));
    }
    ;
    if (v instanceof LOAD_CONTEXT) {
      return "LOAD_CONTEXT " + (show8(v.value0) + (" " + v.value1));
    }
    ;
    if (v instanceof MOVE) {
      return "MOVE " + (show8(v.value0) + (" " + show8(v.value1)));
    }
    ;
    if (v instanceof CLEAR) {
      return "CLEAR " + show8(v.value0);
    }
    ;
    if (v instanceof RECORD_NEW) {
      return "RECORD_NEW " + show8(v.value0);
    }
    ;
    if (v instanceof RECORD_GET) {
      return "RECORD_GET " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + v.value2))));
    }
    ;
    if (v instanceof RECORD_SET) {
      return "RECORD_SET " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + (v.value2 + (" " + show8(v.value3)))))));
    }
    ;
    if (v instanceof LIST_NEW) {
      return "LIST_NEW " + show8(v.value0);
    }
    ;
    if (v instanceof LIST_APPEND) {
      return "LIST_APPEND " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof LIST_GET) {
      return "LIST_GET " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof ADD) {
      return "ADD " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof SUB) {
      return "SUB " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof MUL) {
      return "MUL " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof DIV) {
      return "DIV " + (show8(v.value0) + (" " + (show24(v.value1) + (" " + (show8(v.value2) + (" " + show8(v.value3)))))));
    }
    ;
    if (v instanceof MOD) {
      return "MOD " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof EQ2) {
      return "EQ " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof LT2) {
      return "LT " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof GT2) {
      return "GT " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof NEQ) {
      return "NEQ " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof LTE) {
      return "LTE " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof GTE) {
      return "GTE " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof PROC_SELF) {
      return "PROC_SELF " + show8(v.value0);
    }
    ;
    if (v instanceof PROC_SPAWN) {
      return "PROC_SPAWN " + (show8(v.value0) + (" " + (v.value1 + (" " + show14(v.value2)))));
    }
    ;
    if (v instanceof PROC_SEND) {
      return "PROC_SEND " + (show8(v.value0) + (" " + show8(v.value1)));
    }
    ;
    if (v instanceof PROC_RECEIVE) {
      return "PROC_RECEIVE " + show8(v.value0);
    }
    ;
    if (v instanceof PROC_RECEIVE_MATCH) {
      return "PROC_RECEIVE_MATCH " + (show8(v.value0) + (" " + show8(v.value1)));
    }
    ;
    if (v instanceof PROC_RECEIVE_MATCH_OPT) {
      return "PROC_RECEIVE_MATCH_OPT " + (show8(v.value0) + (" " + show8(v.value1)));
    }
    ;
    if (v instanceof PROC_YIELD) {
      return "PROC_YIELD";
    }
    ;
    if (v instanceof MACHINE_NEW) {
      return "MACHINE_NEW " + (show8(v.value0) + (" " + (v.value1 + (" " + show8(v.value2)))));
    }
    ;
    if (v instanceof MACHINE_STATE) {
      return "MACHINE_STATE " + (show8(v.value0) + (" " + show8(v.value1)));
    }
    ;
    if (v instanceof MACHINE_TRANSITION) {
      return "MACHINE_TRANSITION " + (show8(v.value0) + (" " + (show8(v.value1) + (" " + v.value2))));
    }
    ;
    if (v instanceof ASSERT) {
      return "ASSERT " + (show8(v.value0) + (" " + show8(v.value1)));
    }
    ;
    if (v instanceof ASSUME) {
      return "ASSUME " + (show8(v.value0) + (" " + v.value1));
    }
    ;
    if (v instanceof PROOF_MARK) {
      return "PROOF_MARK " + (v.value0 + (" " + show8(v.value1)));
    }
    ;
    return "OTHER_INSTRUCTION";
  }
};

// output/FinVM.Debug.Trace/index.js
var InstructionExecuted = /* @__PURE__ */ (function() {
  function InstructionExecuted2(value0) {
    this.value0 = value0;
  }
  ;
  InstructionExecuted2.create = function(value0) {
    return new InstructionExecuted2(value0);
  };
  return InstructionExecuted2;
})();

// output/FinVM.Builtin.Str/foreign.js
var strLength = (s) => s.length;
var strConcat = (a) => (b) => a + b;
var strSlice = (start) => (len) => (s) => {
  const st = Math.max(0, start);
  const ln = Math.max(0, len);
  return s.slice(st, st + ln);
};
var strIndexOf = (s) => (needle) => s.indexOf(needle);
var strSplit = (s) => (sep) => s.split(sep);
var strToUpper = (s) => s.toUpperCase();
var strToLower = (s) => s.toLowerCase();
var strTrim = (s) => s.trim();
var strReplaceAll = (s) => (from) => (to) => s.replaceAll(from, to);
var strIsDecimalInt = (s) => /^-?[0-9]+$/.test(s);

// output/FinVM.Builtin.Str/index.js
var map7 = /* @__PURE__ */ map(functorArray);
var lessThan2 = /* @__PURE__ */ lessThan(ordBigInt);
var str_trim_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VString) {
    return new Right(new VString(strTrim(args[0].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.trim/v1 expects (String)"));
};
var str_toUpper_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VString) {
    return new Right(new VString(strToUpper(args[0].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.toUpper/v1 expects (String)"));
};
var str_toLower_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VString) {
    return new Right(new VString(strToLower(args[0].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.toLower/v1 expects (String)"));
};
var str_toInt_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VString) {
    var $14 = strIsDecimalInt(args[0].value0);
    if ($14) {
      var v = fromString3(args[0].value0);
      if (v instanceof Just) {
        return new Right(new VInt(v.value0));
      }
      ;
      if (v instanceof Nothing) {
        return new Right(VUnit.value);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Builtin.Str (line 98, column 12 - line 100, column 31): " + [v.constructor.name]);
    }
    ;
    return new Right(VUnit.value);
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.toInt/v1 expects (String)"));
};
var str_split_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
    return new Right(new VList(fromArray(map7(VString.create)(strSplit(args[0].value0)(args[1].value0)))));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.split/v1 expects (String, String)"));
};
var str_replace_v1 = function(args) {
  if (args.length === 3 && (args[0] instanceof VString && (args[1] instanceof VString && args[2] instanceof VString))) {
    return new Right(new VString(strReplaceAll(args[0].value0)(args[1].value0)(args[2].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.replace/v1 expects (String, String, String)"));
};
var str_length_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VString) {
    return new Right(new VInt(fromInt(strLength(args[0].value0))));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.length/v1 expects (String)"));
};
var str_indexOf_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
    return new Right(new VInt(fromInt(strIndexOf(args[0].value0)(args[1].value0))));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.indexOf/v1 expects (String, String)"));
};
var str_fromInt_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VInt) {
    return new Right(new VString(toString2(args[0].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.fromInt/v1 expects (Int)"));
};
var str_concat_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
    return new Right(new VString(strConcat(args[0].value0)(args[1].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.concat/v1 expects (String, String)"));
};
var clampInt = function(n) {
  var v = toInt(n);
  if (v instanceof Just) {
    return v.value0;
  }
  ;
  if (v instanceof Nothing) {
    var $49 = lessThan2(n)(fromInt(0));
    if ($49) {
      return 0;
    }
    ;
    return 2147483647;
  }
  ;
  throw new Error("Failed pattern match at FinVM.Builtin.Str (line 43, column 14 - line 45, column 56): " + [v.constructor.name]);
};
var str_slice_v1 = function(args) {
  if (args.length === 3 && (args[0] instanceof VString && (args[1] instanceof VInt && args[2] instanceof VInt))) {
    return new Right(new VString(strSlice(clampInt(args[1].value0))(clampInt(args[2].value0))(args[0].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "str.slice/v1 expects (String, Int, Int)"));
};

// output/FinVM.Encoding.Canonical/foreign.js
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var rotr = (x, n) => x >>> n | x << 32 - n;
function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const l = data.length;
  const bitLen = l * 8;
  const withOne = l + 1;
  const k = (56 - withOne % 64 + 64) % 64;
  const total = withOne + k + 8;
  const m = new Uint8Array(total);
  m.set(data);
  m[l] = 128;
  const dv = new DataView(m.buffer);
  dv.setUint32(total - 4, bitLen >>> 0, false);
  dv.setUint32(total - 8, Math.floor(bitLen / 4294967296), false);
  let h0 = 1779033703, h1 = 3144134277, h2 = 1013904242, h3 = 2773480762;
  let h4 = 1359893119, h5 = 2600822924, h6 = 528734635, h7 = 1541459225;
  const w = new Uint32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ w[i - 15] >>> 3;
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ w[i - 2] >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = e & f ^ ~e & g;
      const t1 = h + S1 + ch + K[i] + w[i] | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const t2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    h0 = h0 + a | 0;
    h1 = h1 + b | 0;
    h2 = h2 + c | 0;
    h3 = h3 + d | 0;
    h4 = h4 + e | 0;
    h5 = h5 + f | 0;
    h6 = h6 + g | 0;
    h7 = h7 + h | 0;
  }
  const hx = (x) => ("0000000" + (x >>> 0).toString(16)).slice(-8);
  return hx(h0) + hx(h1) + hx(h2) + hx(h3) + hx(h4) + hx(h5) + hx(h6) + hx(h7);
}
var sha256String = (input) => sha256Hex(input);

// output/FinVM.Encoding.Canonical/index.js
var show9 = /* @__PURE__ */ show(showInt);
var show15 = /* @__PURE__ */ show(showString);
var show25 = /* @__PURE__ */ show(/* @__PURE__ */ showArray(showInt));
var intercalate3 = /* @__PURE__ */ intercalate2(monoidString);
var map8 = /* @__PURE__ */ map(functorArray);
var toUnfoldable7 = /* @__PURE__ */ toUnfoldable4(unfoldableArray);
var sortWith3 = /* @__PURE__ */ sortWith(ordString);
var canonicalValue = function(v) {
  if (v instanceof VUnit) {
    return "unit";
  }
  ;
  if (v instanceof VBool) {
    if (v.value0) {
      return "true";
    }
    ;
    return "false";
  }
  ;
  if (v instanceof VInt) {
    return "int:" + toString2(v.value0);
  }
  ;
  if (v instanceof VFixed) {
    return "fixed:" + (toString2(v.value0.value) + ("@" + show9(v.value0.scale)));
  }
  ;
  if (v instanceof VRational) {
    return "rational:" + (toString2(v.value0.numerator) + ("/" + toString2(v.value0.denominator)));
  }
  ;
  if (v instanceof VString) {
    return "string:" + show15(v.value0);
  }
  ;
  if (v instanceof VBytes) {
    return "bytes:" + show25(v.value0);
  }
  ;
  if (v instanceof VSymbol) {
    return "symbol:" + v.value0;
  }
  ;
  if (v instanceof VList) {
    return "[" + (intercalate3(",")(map8(canonicalValue)(toArray2(v.value0))) + "]");
  }
  ;
  if (v instanceof VMap) {
    return "map{" + (canonicalMapEntries(toUnfoldable7(v.value0)) + "}");
  }
  ;
  if (v instanceof VRecord) {
    return "record{" + (canonicalEntries(toUnfoldable7(v.value0)) + "}");
  }
  ;
  if (v instanceof VVariant) {
    return "variant:" + (v.value0 + ("(" + (canonicalValue(v.value1) + ")")));
  }
  ;
  if (v instanceof VOption && v.value0 instanceof Nothing) {
    return "none";
  }
  ;
  if (v instanceof VOption && v.value0 instanceof Just) {
    return "some(" + (canonicalValue(v.value0.value0) + ")");
  }
  ;
  if (v instanceof VResult && v.value0 instanceof Left) {
    return "err(" + (canonicalValue(v.value0.value0) + ")");
  }
  ;
  if (v instanceof VResult && v.value0 instanceof Right) {
    return "ok(" + (canonicalValue(v.value0.value0) + ")");
  }
  ;
  if (v instanceof VFunctionRef) {
    return "fn:" + v.value0;
  }
  ;
  if (v instanceof VProcessRef) {
    return "proc:" + v.value0;
  }
  ;
  if (v instanceof VRemoteProcessRef) {
    return "remote:" + (v.value0.node + (":" + v.value0.pid));
  }
  ;
  if (v instanceof VStateMachineInstance) {
    return "machine:" + (v.value0.machineId + (":" + (v.value0.instanceId + ("@" + show9(v.value0.version)))));
  }
  ;
  if (v instanceof VEvent) {
    return "event:" + (v.value0.type_ + ("(" + (canonicalValue(v.value0.payload) + ")")));
  }
  ;
  if (v instanceof VEffectIntent) {
    return "effect:" + (v.value0.type_ + ("(" + (canonicalValue(v.value0.payload) + ")")));
  }
  ;
  if (v instanceof VProofValue) {
    return "proof:" + (v.value0.label + ("(" + (canonicalValue(v.value0.value) + ")")));
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Canonical (line 15, column 18 - line 38, column 79): " + [v.constructor.name]);
};
var canonicalMapEntries = function(entries) {
  var sorted = sortWith3(function(v) {
    return canonicalValue(v.value0);
  })(entries);
  var render = function(v) {
    return canonicalValue(v.value0) + (":" + canonicalValue(v.value1));
  };
  return intercalate3(",")(map8(render)(sorted));
};
var canonicalEntries = function(entries) {
  var sorted = sortWith3(function(v) {
    return v.value0;
  })(entries);
  var render = function(v) {
    return v.value0 + (":" + canonicalValue(v.value1));
  };
  return intercalate3(",")(map8(render)(sorted));
};
var hashValue = function(v) {
  return sha256String(canonicalValue(v));
};

// output/FinVM.Numeric.BigInt/index.js
var add3 = /* @__PURE__ */ add(semiringBigInt);
var sub3 = /* @__PURE__ */ sub(ringBigInt);
var mul2 = /* @__PURE__ */ mul(semiringBigInt);
var eq8 = /* @__PURE__ */ eq(eqBigInt);
var div3 = /* @__PURE__ */ div(euclideanRingBigInt);
var lessThan3 = /* @__PURE__ */ lessThan(ordBigInt);
var negate2 = /* @__PURE__ */ negate(ringBigInt);
var modMul = function(a) {
  return function(b) {
    return function(m) {
      return rem2(add3(rem2(mul2(a)(b))(m))(m))(m);
    };
  };
};
var extGcd = function(a) {
  return function(b) {
    var $10 = eq8(b)(fromInt(0));
    if ($10) {
      return {
        gcd: a,
        x: fromInt(1),
        y: fromInt(0)
      };
    }
    ;
    var r = rem2(a)(b);
    var res = extGcd(b)(r);
    var q = div3(a)(b);
    return {
      gcd: res.gcd,
      x: res.y,
      y: sub3(res.x)(mul2(q)(res.y))
    };
  };
};
var modInv = function(a) {
  return function(m) {
    var res = extGcd(a)(m);
    var $11 = eq8(res.gcd)(fromInt(1));
    if ($11) {
      return new Just(rem2(add3(rem2(res.x)(m))(m))(m));
    }
    ;
    return Nothing.value;
  };
};
var modPow = function(base) {
  return function(exp2) {
    return function(m) {
      var $12 = eq8(exp2)(fromInt(0));
      if ($12) {
        return new Just(fromInt(1));
      }
      ;
      var $13 = lessThan3(exp2)(fromInt(0));
      if ($13) {
        var v = modInv(base)(m);
        if (v instanceof Nothing) {
          return Nothing.value;
        }
        ;
        if (v instanceof Just) {
          return modPow(v.value0)(negate2(exp2))(m);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Numeric.BigInt (line 34, column 5 - line 36, column 38): " + [v.constructor.name]);
      }
      ;
      var v = modPow(base)(div3(exp2)(fromInt(2)))(m);
      if (v instanceof Nothing) {
        return Nothing.value;
      }
      ;
      if (v instanceof Just) {
        var halfPowSq = modMul(v.value0)(v.value0)(m);
        return new Just((function() {
          var $17 = eq8(rem2(exp2)(fromInt(2)))(fromInt(0));
          if ($17) {
            return halfPowSq;
          }
          ;
          return modMul(halfPowSq)(base)(m);
        })());
      }
      ;
      throw new Error("Failed pattern match at FinVM.Numeric.BigInt (line 38, column 5 - line 45, column 41): " + [v.constructor.name]);
    };
  };
};

// output/FinVM.Builtin/index.js
var eq9 = /* @__PURE__ */ eq(eqBigInt);
var div4 = /* @__PURE__ */ div(euclideanRingBigInt);
var lessThan4 = /* @__PURE__ */ lessThan(ordBigInt);
var mul3 = /* @__PURE__ */ mul(semiringBigInt);
var foldl4 = /* @__PURE__ */ foldl(foldableArray);
var add4 = /* @__PURE__ */ add(semiringBigInt);
var lookup3 = /* @__PURE__ */ lookup2(ordString);
var show10 = /* @__PURE__ */ show(showInt);
var lookup1 = /* @__PURE__ */ lookup2(ordInt);
var toBytesBE = function(n) {
  var go = function($copy_v) {
    return function($copy_acc) {
      var $tco_var_v = $copy_v;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v, acc) {
        var $19 = eq9(v)(fromInt(0));
        if ($19) {
          $tco_done = true;
          return acc;
        }
        ;
        var next = div4(v)(fromInt(256));
        var $$byte = toInt(rem2(v)(fromInt(256)));
        if ($$byte instanceof Nothing) {
          $tco_done = true;
          return acc;
        }
        ;
        if ($$byte instanceof Just) {
          $tco_var_v = next;
          $copy_acc = cons($$byte.value0)(acc);
          return;
        }
        ;
        throw new Error("Failed pattern match at FinVM.Builtin (line 107, column 12 - line 109, column 47): " + [$$byte.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_v, $copy_acc);
      }
      ;
      return $tco_result;
    };
  };
  var $22 = eq9(n)(fromInt(0));
  if ($22) {
    return [0];
  }
  ;
  return go(n)([]);
};
var logic_or_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VBool && args[1] instanceof VBool)) {
    return new Right(new VBool(args[0].value0 || args[1].value0));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "logic.or/v1 expects 2 Booleans"));
};
var logic_not_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VBool) {
    return new Right(new VBool(!args[0].value0));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "logic.not/v1 expects 1 Boolean"));
};
var logic_and_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VBool && args[1] instanceof VBool)) {
    return new Right(new VBool(args[0].value0 && args[1].value0));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "logic.and/v1 expects 2 Booleans"));
};
var hash_sha256_v1 = function(args) {
  if (args.length === 1) {
    return new Right(new VString(hashValue(args[0])));
  }
  ;
  return new Left(new VMError(ArityMismatch.value, "hash.sha256/v1 expects 1 argument"));
};
var core_identity_v1 = function(args) {
  if (args.length === 1) {
    return new Right(args[0]);
  }
  ;
  return new Left(new VMError(ArityMismatch.value, "core.identity/v1 expects 1 argument"));
};
var bigint_to_bytes_be_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VInt) {
    var $41 = lessThan4(args[0].value0)(fromInt(0));
    if ($41) {
      return new Left(new VMError(ArithmeticError.value, "bigint.toBytesBE/v1 expects a non-negative BigInt"));
    }
    ;
    return new Right(new VBytes(toBytesBE(args[0].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "bigint.toBytesBE/v1 expects a BigInt"));
};
var bigint_mul_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VInt)) {
    return new Right(new VInt(mul3(args[0].value0)(args[1].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "bigint.mul/v1 expects 2 BigInts"));
};
var bigint_modpow_v1 = function(args) {
  if (args.length === 3 && (args[0] instanceof VInt && (args[1] instanceof VInt && args[2] instanceof VInt))) {
    var v = modPow(args[0].value0)(args[1].value0)(args[2].value0);
    if (v instanceof Nothing) {
      return new Left(new VMError(NoModularInverse.value, "bigint.modPow/v1: negative exponent requires a modular inverse that does not exist"));
    }
    ;
    if (v instanceof Just) {
      return new Right(new VInt(v.value0));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Builtin (line 69, column 31 - line 71, column 33): " + [v.constructor.name]);
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "bigint.modPow/v1 expects 3 BigInts"));
};
var bigint_modinv_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VInt)) {
    var v = modInv(args[0].value0)(args[1].value0);
    if (v instanceof Nothing) {
      return new Left(new VMError(ArithmeticError.value, "Modular inverse does not exist"));
    }
    ;
    if (v instanceof Just) {
      return new Right(new VInt(v.value0));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Builtin (line 76, column 23 - line 78, column 33): " + [v.constructor.name]);
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "bigint.modInv/v1 expects 2 BigInts"));
};
var bigint_from_bytes_be_v1 = function(args) {
  if (args.length === 1 && args[0] instanceof VBytes) {
    var $66 = any2(function(b) {
      return b < 0 || b > 255;
    })(args[0].value0);
    if ($66) {
      return new Left(new VMError(InvalidInstruction.value, "bigint.fromBytesBE/v1 expects bytes in range 0..255"));
    }
    ;
    return new Right(new VInt(foldl4(function(acc) {
      return function(b) {
        return add4(mul3(acc)(fromInt(256)))(fromInt(b));
      };
    })(fromInt(0))(args[0].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "bigint.fromBytesBE/v1 expects Bytes"));
};
var bigint_add_v1 = function(args) {
  if (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VInt)) {
    return new Right(new VInt(add4(args[0].value0)(args[1].value0)));
  }
  ;
  return new Left(new VMError(TypeMismatch.value, "bigint.add/v1 expects 2 BigInts"));
};
var lookupBuiltin = function(config) {
  return function(id2) {
    return function(version) {
      if (id2 === "core.identity" && version === 1) {
        return new Right(core_identity_v1);
      }
      ;
      if (id2 === "bigint.add" && version === 1) {
        return new Right(bigint_add_v1);
      }
      ;
      if (id2 === "bigint.mul" && version === 1) {
        return new Right(bigint_mul_v1);
      }
      ;
      if (id2 === "bigint.modPow" && version === 1) {
        return new Right(bigint_modpow_v1);
      }
      ;
      if (id2 === "bigint.modInv" && version === 1) {
        return new Right(bigint_modinv_v1);
      }
      ;
      if (id2 === "bigint.fromBytesBE" && version === 1) {
        return new Right(bigint_from_bytes_be_v1);
      }
      ;
      if (id2 === "bigint.toBytesBE" && version === 1) {
        return new Right(bigint_to_bytes_be_v1);
      }
      ;
      if (id2 === "hash.sha256" && version === 1) {
        return new Right(hash_sha256_v1);
      }
      ;
      if (id2 === "logic.and" && version === 1) {
        return new Right(logic_and_v1);
      }
      ;
      if (id2 === "logic.or" && version === 1) {
        return new Right(logic_or_v1);
      }
      ;
      if (id2 === "logic.not" && version === 1) {
        return new Right(logic_not_v1);
      }
      ;
      if (id2 === "str.length" && version === 1) {
        return new Right(str_length_v1);
      }
      ;
      if (id2 === "str.concat" && version === 1) {
        return new Right(str_concat_v1);
      }
      ;
      if (id2 === "str.slice" && version === 1) {
        return new Right(str_slice_v1);
      }
      ;
      if (id2 === "str.indexOf" && version === 1) {
        return new Right(str_indexOf_v1);
      }
      ;
      if (id2 === "str.split" && version === 1) {
        return new Right(str_split_v1);
      }
      ;
      if (id2 === "str.toUpper" && version === 1) {
        return new Right(str_toUpper_v1);
      }
      ;
      if (id2 === "str.toLower" && version === 1) {
        return new Right(str_toLower_v1);
      }
      ;
      if (id2 === "str.trim" && version === 1) {
        return new Right(str_trim_v1);
      }
      ;
      if (id2 === "str.fromInt" && version === 1) {
        return new Right(str_fromInt_v1);
      }
      ;
      if (id2 === "str.toInt" && version === 1) {
        return new Right(str_toInt_v1);
      }
      ;
      if (id2 === "str.replace" && version === 1) {
        return new Right(str_replace_v1);
      }
      ;
      var v = lookup3(id2)(config.externalBuiltins);
      if (v instanceof Nothing) {
        return new Left(new VMError(UnknownBuiltin.value, "Builtin " + (id2 + (" v" + (show10(version) + " not found")))));
      }
      ;
      if (v instanceof Just) {
        var v1 = lookup1(version)(v.value0);
        if (v1 instanceof Nothing) {
          return new Left(new VMError(UnknownBuiltin.value, "Builtin " + (id2 + (" v" + (show10(version) + " not found")))));
        }
        ;
        if (v1 instanceof Just) {
          return new Right(v1.value0);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Builtin (line 46, column 26 - line 48, column 30): " + [v1.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Builtin (line 44, column 7 - line 48, column 30): " + [v.constructor.name]);
    };
  };
};

// output/FinVM.Encoding.Snapshot/index.js
var sortWith4 = /* @__PURE__ */ sortWith(ordString);
var intercalate4 = /* @__PURE__ */ intercalate2(monoidString);
var map9 = /* @__PURE__ */ map(functorArray);
var fromFoldable6 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
var show11 = /* @__PURE__ */ show(showInt);
var show16 = /* @__PURE__ */ show(showProcessStatus);
var toUnfoldable8 = /* @__PURE__ */ toUnfoldable4(unfoldableArray);
var toUnfoldable13 = /* @__PURE__ */ toUnfoldable3(unfoldableArray);
var map13 = /* @__PURE__ */ map(functorList);
var canonicalEntries2 = function(entries) {
  var sorted = sortWith4(function(v) {
    return v.value0;
  })(entries);
  var render = function(v) {
    return v.value0 + (":" + canonicalValue(v.value1));
  };
  return intercalate4(",")(map9(render)(sorted));
};
var canonicalProcess = function(p) {
  var regsArray = mapWithIndex2(Tuple.create)(p.frame.registers);
  var stringRegs = fromFoldable6(map9(function(v) {
    return new Tuple(show11(v.value0), v.value1);
  })(regsArray));
  return "proc{pid:" + (p.pid + (",status:" + (show16(p.status) + (",pc:" + (show11(p.frame.pc) + (",registers:" + (canonicalEntries2(toUnfoldable8(stringRegs)) + (",mailbox:[" + (intercalate4(",")(map9(canonicalValue)(p.mailbox)) + "]}")))))))));
};
var createSnapshot = function(m) {
  return "snapshot{program:" + (m.program.version + (",state:" + (canonicalEntries2(toUnfoldable8(m.state)) + (",processes:[" + (intercalate4(",")(toUnfoldable13(map13(canonicalProcess)(values(m.scheduler.processes)))) + ("]" + (",tick:" + (show11(m.scheduler.logicalTick) + (",steps:" + (show11(m.counters.steps) + "}"))))))))));
};

// output/FinVM.Numeric.Fixed/index.js
var lessThan5 = /* @__PURE__ */ lessThan(ordBigInt);
var greaterThan2 = /* @__PURE__ */ greaterThan(ordBigInt);
var notEq4 = /* @__PURE__ */ notEq(eqBigInt);
var add1 = /* @__PURE__ */ add(semiringBigInt);
var negate1 = /* @__PURE__ */ negate(ringBigInt);
var mul1 = /* @__PURE__ */ mul(semiringBigInt);
var eq10 = /* @__PURE__ */ eq(eqBigInt);
var pure4 = /* @__PURE__ */ pure(applicativeEither);
var max3 = /* @__PURE__ */ max(ordInt);
var bind4 = /* @__PURE__ */ bind(bindEither);
var sub22 = /* @__PURE__ */ sub(ringBigInt);
var roundedQuotient = function(numerator) {
  return function(denominator) {
    return function(rounding) {
      var zero2 = fromInt(0);
      var two = fromInt(2);
      var rem3 = rem2(numerator)(denominator);
      var q = quot2(numerator)(denominator);
      var one2 = fromInt(1);
      var sign2 = (function() {
        var $24 = lessThan5(numerator)(zero2) && greaterThan2(denominator)(zero2) || greaterThan2(numerator)(zero2) && lessThan5(denominator)(zero2);
        if ($24) {
          return fromInt(-1 | 0);
        }
        ;
        return one2;
      })();
      var hasRemainder = notEq4(rem3)(zero2);
      var away = add1(q)(sign2);
      var absRem = (function() {
        var $25 = lessThan5(rem3)(zero2);
        if ($25) {
          return negate1(rem3);
        }
        ;
        return rem3;
      })();
      var absDen = (function() {
        var $26 = lessThan5(denominator)(zero2);
        if ($26) {
          return negate1(denominator);
        }
        ;
        return denominator;
      })();
      if (rounding instanceof RoundTowardZero) {
        return q;
      }
      ;
      if (rounding instanceof RoundAwayFromZero) {
        if (hasRemainder) {
          return away;
        }
        ;
        return q;
      }
      ;
      if (rounding instanceof RoundDown) {
        var $29 = lessThan5(sign2)(zero2) && hasRemainder;
        if ($29) {
          return away;
        }
        ;
        return q;
      }
      ;
      if (rounding instanceof RoundUp) {
        var $30 = greaterThan2(sign2)(zero2) && hasRemainder;
        if ($30) {
          return away;
        }
        ;
        return q;
      }
      ;
      if (rounding instanceof RoundHalfEven) {
        var doubled = mul1(absRem)(two);
        var $31 = lessThan5(doubled)(absDen);
        if ($31) {
          return q;
        }
        ;
        var $32 = greaterThan2(doubled)(absDen);
        if ($32) {
          return away;
        }
        ;
        var $33 = eq10(rem2(q)(two))(zero2);
        if ($33) {
          return q;
        }
        ;
        return away;
      }
      ;
      throw new Error("Failed pattern match at FinVM.Numeric.Fixed (line 98, column 5 - line 108, column 21): " + [rounding.constructor.name]);
    };
  };
};
var pow10 = function(n) {
  var loop = function($copy_v) {
    return function($copy_v1) {
      var $tco_var_v = $copy_v;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v, v1) {
        if (v === 0) {
          $tco_done = true;
          return v1;
        }
        ;
        $tco_var_v = v - 1 | 0;
        $copy_v1 = mul1(v1)(fromInt(10));
        return;
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_v, $copy_v1);
      }
      ;
      return $tco_result;
    };
  };
  return loop(n)(fromInt(1));
};
var rescale = function(f) {
  return function(newScale) {
    return function(r) {
      var $36 = newScale === f.scale;
      if ($36) {
        return pure4(f);
      }
      ;
      var $37 = newScale > f.scale;
      if ($37) {
        var diff = newScale - f.scale | 0;
        return pure4({
          value: mul1(f.value)(pow10(diff)),
          scale: newScale
        });
      }
      ;
      var diff = f.scale - newScale | 0;
      var divisor = pow10(diff);
      var quotient = roundedQuotient(f.value)(divisor)(r);
      return pure4({
        value: quotient,
        scale: newScale
      });
    };
  };
};
var sub4 = function(a) {
  return function(b) {
    var maxScale = max3(a.scale)(b.scale);
    return bind4(rescale(a)(maxScale)(RoundDown.value))(function(a$prime) {
      return bind4(rescale(b)(maxScale)(RoundDown.value))(function(b$prime) {
        return pure4({
          value: sub22(a$prime.value)(b$prime.value),
          scale: maxScale
        });
      });
    });
  };
};
var mul4 = function(a) {
  return function(b) {
    return {
      value: mul1(a.value)(b.value),
      scale: a.scale + b.scale | 0
    };
  };
};
var div5 = function(a) {
  return function(b) {
    return function(r) {
      var $39 = eq10(b.value)(fromInt(0));
      if ($39) {
        return new Left(DivisionByZero.value);
      }
      ;
      var aScaled = mul1(a.value)(pow10(b.scale));
      var q = roundedQuotient(aScaled)(b.value)(r);
      return pure4({
        value: q,
        scale: a.scale
      });
    };
  };
};
var add5 = function(a) {
  return function(b) {
    var maxScale = max3(a.scale)(b.scale);
    return bind4(rescale(a)(maxScale)(RoundDown.value))(function(a$prime) {
      return bind4(rescale(b)(maxScale)(RoundDown.value))(function(b$prime) {
        return pure4({
          value: add1(a$prime.value)(b$prime.value),
          scale: maxScale
        });
      });
    });
  };
};

// output/FinVM.Process.Scheduler/index.js
var insert3 = /* @__PURE__ */ insert(ordString);
var show17 = /* @__PURE__ */ show(showInt);
var lookup4 = /* @__PURE__ */ lookup2(ordString);
var yieldProcess = function(s) {
  return function(pid) {
    return {
      processes: s.processes,
      current: s.current,
      nextPidSequence: s.nextPidSequence,
      logicalTick: s.logicalTick,
      scheduleTrace: s.scheduleTrace,
      readyQueue: snoc(s.readyQueue)(pid)
    };
  };
};
var updateProcess = function(s) {
  return function(p) {
    return {
      readyQueue: s.readyQueue,
      current: s.current,
      nextPidSequence: s.nextPidSequence,
      logicalTick: s.logicalTick,
      scheduleTrace: s.scheduleTrace,
      processes: insert3(p.pid)(p)(s.processes)
    };
  };
};
var spawnProcess = function(s) {
  return function(p) {
    return {
      current: s.current,
      nextPidSequence: s.nextPidSequence,
      logicalTick: s.logicalTick,
      scheduleTrace: s.scheduleTrace,
      processes: insert3(p.pid)(p)(s.processes),
      readyQueue: snoc(s.readyQueue)(p.pid)
    };
  };
};
var nextProcess = function(s) {
  var v = uncons(s.readyQueue);
  if (v instanceof Nothing) {
    return Nothing.value;
  }
  ;
  if (v instanceof Just) {
    return new Just(new Tuple(v.value0.head, {
      logicalTick: s.logicalTick,
      nextPidSequence: s.nextPidSequence,
      processes: s.processes,
      scheduleTrace: s.scheduleTrace,
      readyQueue: v.value0.tail,
      current: new Just(v.value0.head)
    }));
  }
  ;
  throw new Error("Failed pattern match at FinVM.Process.Scheduler (line 42, column 17 - line 44, column 90): " + [v.constructor.name]);
};
var nextPid = function(s) {
  var pid = "p" + show17(s.nextPidSequence);
  return new Tuple(pid, {
    current: s.current,
    logicalTick: s.logicalTick,
    processes: s.processes,
    readyQueue: s.readyQueue,
    scheduleTrace: s.scheduleTrace,
    nextPidSequence: s.nextPidSequence + 1 | 0
  });
};
var initialScheduler = /* @__PURE__ */ (function() {
  return {
    processes: empty3,
    readyQueue: [],
    current: Nothing.value,
    nextPidSequence: 0,
    logicalTick: 0,
    scheduleTrace: []
  };
})();
var findProcess = function(s) {
  return function(pid) {
    return lookup4(pid)(s.processes);
  };
};

// output/FinVM.Proof.ProofTrace/index.js
var ProofAssumption = /* @__PURE__ */ (function() {
  function ProofAssumption2(value0) {
    this.value0 = value0;
  }
  ;
  ProofAssumption2.create = function(value0) {
    return new ProofAssumption2(value0);
  };
  return ProofAssumption2;
})();
var ProofAssertion = /* @__PURE__ */ (function() {
  function ProofAssertion2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  ProofAssertion2.create = function(value0) {
    return function(value1) {
      return new ProofAssertion2(value0, value1);
    };
  };
  return ProofAssertion2;
})();
var ProofInvariantChecked = /* @__PURE__ */ (function() {
  function ProofInvariantChecked2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  ProofInvariantChecked2.create = function(value0) {
    return function(value1) {
      return new ProofInvariantChecked2(value0, value1);
    };
  };
  return ProofInvariantChecked2;
})();
var ProofValueMarked = /* @__PURE__ */ (function() {
  function ProofValueMarked2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  ProofValueMarked2.create = function(value0) {
    return function(value1) {
      return new ProofValueMarked2(value0, value1);
    };
  };
  return ProofValueMarked2;
})();
var ProofScopeBegin = /* @__PURE__ */ (function() {
  function ProofScopeBegin2(value0) {
    this.value0 = value0;
  }
  ;
  ProofScopeBegin2.create = function(value0) {
    return new ProofScopeBegin2(value0);
  };
  return ProofScopeBegin2;
})();
var ProofScopeEnd = /* @__PURE__ */ (function() {
  function ProofScopeEnd2(value0) {
    this.value0 = value0;
  }
  ;
  ProofScopeEnd2.create = function(value0) {
    return new ProofScopeEnd2(value0);
  };
  return ProofScopeEnd2;
})();

// output/FinVM.StateMachine.Transition/index.js
var StaticState = /* @__PURE__ */ (function() {
  function StaticState2(value0) {
    this.value0 = value0;
  }
  ;
  StaticState2.create = function(value0) {
    return new StaticState2(value0);
  };
  return StaticState2;
})();
var ComputedState = /* @__PURE__ */ (function() {
  function ComputedState2(value0) {
    this.value0 = value0;
  }
  ;
  ComputedState2.create = function(value0) {
    return new ComputedState2(value0);
  };
  return ComputedState2;
})();
var Stay = /* @__PURE__ */ (function() {
  function Stay2() {
  }
  ;
  Stay2.value = new Stay2();
  return Stay2;
})();

// output/FinVM.Interpreter/index.js
var sortWith5 = /* @__PURE__ */ sortWith(ordInt);
var pure5 = /* @__PURE__ */ pure(applicativeEither);
var eq24 = /* @__PURE__ */ eq(/* @__PURE__ */ eqMaybe(eqValue));
var lookup5 = /* @__PURE__ */ lookup2(ordString);
var toUnfoldable9 = /* @__PURE__ */ toUnfoldable4(unfoldableArray);
var show18 = /* @__PURE__ */ show(showInt);
var show19 = /* @__PURE__ */ show(showVMError);
var show26 = /* @__PURE__ */ show(showCancelReason);
var show34 = /* @__PURE__ */ show(showExitReason);
var bind5 = /* @__PURE__ */ bind(bindMaybe);
var insert4 = /* @__PURE__ */ insert(ordString);
var toUnfoldable14 = /* @__PURE__ */ toUnfoldable5(unfoldableArray);
var sort2 = /* @__PURE__ */ sort(ordString);
var nub2 = /* @__PURE__ */ nub(ordString);
var fromFoldable7 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
var $$delete3 = /* @__PURE__ */ $$delete(ordString);
var member4 = /* @__PURE__ */ member2(ordString);
var map10 = /* @__PURE__ */ map(functorMap);
var bind12 = /* @__PURE__ */ bind(bindEither);
var map14 = /* @__PURE__ */ map(functorArray);
var discard2 = /* @__PURE__ */ discard(discardUnit)(bindEither);
var add12 = /* @__PURE__ */ add(semiringBigInt);
var sub1 = /* @__PURE__ */ sub(ringBigInt);
var mul5 = /* @__PURE__ */ mul(semiringBigInt);
var eq32 = /* @__PURE__ */ eq(eqBigInt);
var negate12 = /* @__PURE__ */ negate(ringBigInt);
var lessThan6 = /* @__PURE__ */ lessThan(ordBigInt);
var eq43 = /* @__PURE__ */ eq(eqValue);
var notEq1 = /* @__PURE__ */ notEq(eqValue);
var lessThan1 = /* @__PURE__ */ lessThan(ordValue);
var lessThanOrEq1 = /* @__PURE__ */ lessThanOrEq(ordValue);
var greaterThan3 = /* @__PURE__ */ greaterThan(ordValue);
var greaterThanOrEq1 = /* @__PURE__ */ greaterThanOrEq(ordValue);
var traverse3 = /* @__PURE__ */ traverse(traversableArray)(applicativeEither);
var insert1 = /* @__PURE__ */ insert(ordValue);
var lookup12 = /* @__PURE__ */ lookup2(ordValue);
var member1 = /* @__PURE__ */ member2(ordValue);
var delete1 = /* @__PURE__ */ $$delete(ordValue);
var toUnfoldable22 = /* @__PURE__ */ toUnfoldable3(unfoldableArray);
var div6 = /* @__PURE__ */ div(euclideanRingBigInt);
var show43 = /* @__PURE__ */ show(showProcessStatus);
var show53 = /* @__PURE__ */ show(showValue);
var insert22 = /* @__PURE__ */ insert2(ordString);
var delete2 = /* @__PURE__ */ $$delete2(ordString);
var ordRecord2 = /* @__PURE__ */ ordRecord()(/* @__PURE__ */ ordRecordCons(/* @__PURE__ */ ordRecordCons(ordRecordNil)()({
  reflectSymbol: function() {
    return "pid";
  }
})(ordString))()({
  reflectSymbol: function() {
    return "node";
  }
})(ordNodeRef));
var insert32 = /* @__PURE__ */ insert2(ordRecord2);
var delete3 = /* @__PURE__ */ $$delete2(ordRecord2);
var map23 = /* @__PURE__ */ map(functorMaybe);
var elem3 = /* @__PURE__ */ elem2(eqString);
var writeReg = function(p) {
  return function(r) {
    return function(v) {
      var v1 = updateAt(r)(v)(p.frame.registers);
      if (v1 instanceof Nothing) {
        return p;
      }
      ;
      if (v1 instanceof Just) {
        return {
          pid: p.pid,
          status: p.status,
          "function": p["function"],
          callStack: p.callStack,
          mailbox: p.mailbox,
          links: p.links,
          remoteLinks: p.remoteLinks,
          monitors: p.monitors,
          parent: p.parent,
          children: p.children,
          trapExit: p.trapExit,
          metadata: p.metadata,
          result: p.result,
          error: p.error,
          createdSequence: p.createdSequence,
          stepsExecuted: p.stepsExecuted,
          frame: {
            "function": p["frame"]["function"],
            pc: p.frame.pc,
            returnRegister: p.frame.returnRegister,
            caller: p.frame.caller,
            registers: v1.value0
          }
        };
      }
      ;
      throw new Error("Failed pattern match at FinVM.Interpreter (line 1153, column 18 - line 1155, column 60): " + [v1.constructor.name]);
    };
  };
};
var selectTransition = function(currentState) {
  return function(event) {
    return function(matches) {
      var v = sortWith5(function(t) {
        return -fromMaybe(0)(t.priority) | 0;
      })(matches);
      if (v.length === 0) {
        return new Left(new VMError(NoTransition.value, "No transition from " + (currentState + (" on event " + event))));
      }
      ;
      if (v.length === 1) {
        return new Right(v[0]);
      }
      ;
      var v1 = index(v)(1);
      var v2 = index(v)(0);
      if (v2 instanceof Just && (v1 instanceof Just && fromMaybe(0)(v2.value0.priority) === fromMaybe(0)(v1.value0.priority))) {
        return new Left(new VMError(AmbiguousTransition.value, "Ambiguous transition from " + (currentState + (" on event " + event))));
      }
      ;
      if (v2 instanceof Just) {
        return new Right(v2.value0);
      }
      ;
      return new Left(new VMError(NoTransition.value, "No transition from " + (currentState + (" on event " + event))));
    };
  };
};
var scanLabel = function(func) {
  return function(label) {
    var findIdx = function($copy_acc) {
      return function($copy_arr) {
        var $tco_var_acc = $copy_acc;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(acc, arr) {
          var v = uncons(arr);
          if (v instanceof Nothing) {
            $tco_done = true;
            return new Left(new VMError(InvalidJump.value, "Label not found: " + label));
          }
          ;
          if (v instanceof Just && (v.value0.head instanceof LABEL && v.value0.head.value0 === label)) {
            $tco_done = true;
            return pure5(acc);
          }
          ;
          if (v instanceof Just) {
            $tco_var_acc = acc + 1 | 0;
            $copy_arr = v.value0.tail;
            return;
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 1436, column 23 - line 1439, column 46): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_acc, $copy_arr);
        }
        ;
        return $tco_result;
      };
    };
    return findIdx(0)(func.instructions);
  };
};
var rowMatchesQuery = function(query) {
  return function(row) {
    if (row instanceof VRecord) {
      return all3(function(v) {
        return eq24(lookup5(v.value0)(row.value0))(new Just(v.value1));
      })(toUnfoldable9(query));
    }
    ;
    return isEmpty2(query);
  };
};
var readReg = function(p) {
  return function(r) {
    var v = index(p.frame.registers)(r);
    if (v instanceof Nothing) {
      return new Left(new VMError(InvalidRegister.value, "Register " + (show18(r) + " out of bounds")));
    }
    ;
    if (v instanceof Just) {
      return pure5(v.value0);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Interpreter (line 1086, column 15 - line 1088, column 19): " + [v.constructor.name]);
  };
};
var readRecordState = function(key) {
  return function(m) {
    var v = lookup5(key)(m.state);
    if (v instanceof Just && v.value0 instanceof VRecord) {
      return v.value0.value0;
    }
    ;
    return empty3;
  };
};
var processTerminalValue = function(p) {
  if (p.status instanceof ProcessCompleted) {
    return new Just(p.status.value0);
  }
  ;
  if (p.status instanceof ProcessFailed) {
    return new Just(new VString(show19(p.status.value0)));
  }
  ;
  if (p.status instanceof ProcessCancelled2) {
    return new Just(new VString(show26(p.status.value0)));
  }
  ;
  if (p.status instanceof ProcessExited) {
    return new Just(new VString(show34(p.status.value0)));
  }
  ;
  return Nothing.value;
};
var nodeStateKey = "__finvm.nodes";
var nodeTable = function(m) {
  var v = lookup5(nodeStateKey)(m.state);
  if (v instanceof Just && v.value0 instanceof VRecord) {
    return v.value0.value0;
  }
  ;
  return empty3;
};
var nodeMeta = function(m) {
  return function(node) {
    var v = lookup5(node)(nodeTable(m));
    if (v instanceof Just && v.value0 instanceof VRecord) {
      return new Just(v.value0.value0);
    }
    ;
    return Nothing.value;
  };
};
var nodeStatusOf = function(m) {
  return function(node) {
    var v = bind5(nodeMeta(m)(node))(lookup5("status"));
    if (v instanceof Just && v.value0 instanceof VString) {
      return v.value0.value0;
    }
    ;
    return "unknown";
  };
};
var nodeLastStateHash = function(m) {
  return function(node) {
    var v = bind5(nodeMeta(m)(node))(lookup5("lastStateHash"));
    if (v instanceof Just && v.value0 instanceof VString) {
      return new Just(v.value0.value0);
    }
    ;
    return Nothing.value;
  };
};
var nodeLastSeenTick = function(m) {
  return function(node) {
    var v = bind5(nodeMeta(m)(node))(lookup5("lastSeenTick"));
    if (v instanceof Just && v.value0 instanceof VInt) {
      return toInt(v.value0.value0);
    }
    ;
    return Nothing.value;
  };
};
var labelsForFunction = function(func) {
  var step = function(acc) {
    return function(v) {
      if (v.value1 instanceof LABEL) {
        return insert4(v.value1.value0)(v.value0)(acc);
      }
      ;
      return acc;
    };
  };
  return foldl2(step)(empty3)(mapWithIndex2(Tuple.create)(func.instructions));
};
var knownNodes = function(m) {
  var remote = toUnfoldable14(keys3(nodeTable(m)));
  return sort2(nub2(cons("local")(remote)));
};
var findLabel = function(m) {
  return function(func) {
    return function(label) {
      var v = bind5(lookup5(func.id)(m.labelCache))(lookup5(label));
      if (v instanceof Just) {
        return pure5(v.value0);
      }
      ;
      if (v instanceof Nothing) {
        return scanLabel(func)(label);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Interpreter (line 1429, column 3 - line 1431, column 36): " + [v.constructor.name]);
    };
  };
};
var findFirstVariantTag = function(tag) {
  return function(values2) {
    var go = function($copy_idx) {
      return function($copy_vs) {
        var $tco_var_idx = $copy_idx;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(idx, vs) {
          var v = uncons(vs);
          if (v instanceof Nothing) {
            $tco_done = true;
            return Nothing.value;
          }
          ;
          if (v instanceof Just) {
            if (v.value0.head instanceof VVariant && v.value0.head.value0 === tag) {
              $tco_done = true;
              return new Just({
                index: idx,
                value: v.value0.head
              });
            }
            ;
            $tco_var_idx = idx + 1 | 0;
            $copy_vs = v.value0.tail;
            return;
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 1101, column 17 - line 1105, column 31): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_idx, $copy_vs);
        }
        ;
        return $tco_result;
      };
    };
    return go(0)(values2);
  };
};
var mailboxHasVariantTag = function(tag) {
  return function(values2) {
    var v = findFirstVariantTag(tag)(values2);
    if (v instanceof Just) {
      return true;
    }
    ;
    if (v instanceof Nothing) {
      return false;
    }
    ;
    throw new Error("Failed pattern match at FinVM.Interpreter (line 1108, column 35 - line 1110, column 19): " + [v.constructor.name]);
  };
};
var emptyDbTable = /* @__PURE__ */ (function() {
  return {
    nextId: 0,
    rows: empty3,
    indexes: empty3,
    hashCache: Nothing.value,
    dirtyHash: true
  };
})();
var dbStateKey = "__finvm.db";
var writeDbTable = function(table) {
  return function(tableState) {
    return function(m) {
      var db = readRecordState(dbStateKey)(m);
      var baseFields = fromFoldable7([new Tuple("nextId", new VInt(fromInt(tableState.nextId))), new Tuple("rows", new VRecord(tableState.rows)), new Tuple("indexes", new VRecord(tableState.indexes)), new Tuple("dirtyHash", new VBool(tableState.dirtyHash))]);
      var fields = (function() {
        if (tableState.hashCache instanceof Just) {
          return insert4("hashCache")(new VString(tableState.hashCache.value0))(baseFields);
        }
        ;
        if (tableState.hashCache instanceof Nothing) {
          return $$delete3("hashCache")(baseFields);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Interpreter (line 1322, column 14 - line 1324, column 51): " + [tableState.hashCache.constructor.name]);
      })();
      var tableValue = new VRecord(fields);
      return {
        program: m.program,
        scheduler: m.scheduler,
        input: m.input,
        config: m.config,
        trace: m.trace,
        proofTrace: m.proofTrace,
        outbox: m.outbox,
        events: m.events,
        counters: m.counters,
        labelCache: m.labelCache,
        state: insert4(dbStateKey)(new VRecord(insert4(table)(tableValue)(db)))(m.state)
      };
    };
  };
};
var cacheStateKey = "__finvm.cache";
var readCacheNamespace = function(ns) {
  return function(m) {
    var v = lookup5(ns)(readRecordState(cacheStateKey)(m));
    if (v instanceof Just && v.value0 instanceof VRecord) {
      return v.value0.value0;
    }
    ;
    return empty3;
  };
};
var writeCacheNamespace = function(ns) {
  return function(entries) {
    return function(m) {
      var cache = readRecordState(cacheStateKey)(m);
      return {
        program: m.program,
        scheduler: m.scheduler,
        input: m.input,
        config: m.config,
        trace: m.trace,
        proofTrace: m.proofTrace,
        outbox: m.outbox,
        events: m.events,
        counters: m.counters,
        labelCache: m.labelCache,
        state: insert4(cacheStateKey)(new VRecord(insert4(ns)(new VRecord(entries))(cache)))(m.state)
      };
    };
  };
};
var cacheSet = function(m) {
  return function(args) {
    if (args.length === 3 && (args[0] instanceof VString && args[1] instanceof VString)) {
      return pure5(new Tuple(writeCacheNamespace(args[0].value0)(insert4(args[1].value0)(args[2])(readCacheNamespace(args[0].value0)(m)))(m), new VBool(true)));
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "cache.set/v1 expects (Namespace:String, Key:String, Value:Value)"));
  };
};
var cacheGet = function(m) {
  return function(args) {
    if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
      return pure5(new Tuple(m, fromMaybe(VUnit.value)(lookup5(args[1].value0)(readCacheNamespace(args[0].value0)(m)))));
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "cache.get/v1 expects (Namespace:String, Key:String)"));
  };
};
var cacheDelete = function(m) {
  return function(args) {
    if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
      var entries = readCacheNamespace(args[0].value0)(m);
      var existed = member4(args[1].value0)(entries);
      return pure5(new Tuple(writeCacheNamespace(args[0].value0)($$delete3(args[1].value0)(entries))(m), new VBool(existed)));
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "cache.delete/v1 expects (Namespace:String, Key:String)"));
  };
};
var buildLabelCache = function(program) {
  return map10(labelsForFunction)(program.functions);
};
var bigintToInt = function(msg) {
  return function(i) {
    var v = toInt(i);
    if (v instanceof Nothing) {
      return new Left(new VMError(InvalidInstruction.value, msg));
    }
    ;
    if (v instanceof Just) {
      return new Right(v.value0);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Interpreter (line 1344, column 21 - line 1346, column 20): " + [v.constructor.name]);
  };
};
var readDbTable = function(table) {
  return function(m) {
    var v = lookup5(table)(readRecordState(dbStateKey)(m));
    if (v instanceof Nothing) {
      return pure5(emptyDbTable);
    }
    ;
    if (v instanceof Just && v.value0 instanceof VRecord) {
      return bind12((function() {
        var v1 = lookup5("nextId")(v.value0.value0);
        if (v1 instanceof Just && v1.value0 instanceof VInt) {
          return bigintToInt("db table nextId out of Int range")(v1.value0.value0);
        }
        ;
        if (v1 instanceof Nothing) {
          return pure5(0);
        }
        ;
        return new Left(new VMError(TypeMismatch.value, "Malformed db table: nextId must be Int"));
      })())(function(nextId) {
        return bind12((function() {
          var v1 = lookup5("rows")(v.value0.value0);
          if (v1 instanceof Just && v1.value0 instanceof VRecord) {
            return pure5(v1.value0.value0);
          }
          ;
          if (v1 instanceof Nothing) {
            return pure5(empty3);
          }
          ;
          return new Left(new VMError(TypeMismatch.value, "Malformed db table: rows must be Record"));
        })())(function(rows) {
          return bind12((function() {
            var v1 = lookup5("indexes")(v.value0.value0);
            if (v1 instanceof Just && v1.value0 instanceof VRecord) {
              return pure5(v1.value0.value0);
            }
            ;
            if (v1 instanceof Nothing) {
              return pure5(empty3);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "Malformed db table: indexes must be Record"));
          })())(function(indexes) {
            return bind12((function() {
              var v1 = lookup5("hashCache")(v.value0.value0);
              if (v1 instanceof Just && v1.value0 instanceof VString) {
                return pure5(new Just(v1.value0.value0));
              }
              ;
              if (v1 instanceof Nothing) {
                return pure5(Nothing.value);
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "Malformed db table: hashCache must be String"));
            })())(function(hashCache) {
              return bind12((function() {
                var v1 = lookup5("dirtyHash")(v.value0.value0);
                if (v1 instanceof Just && v1.value0 instanceof VBool) {
                  return pure5(v1.value0.value0);
                }
                ;
                if (v1 instanceof Nothing) {
                  return pure5(true);
                }
                ;
                return new Left(new VMError(TypeMismatch.value, "Malformed db table: dirtyHash must be Bool"));
              })())(function(dirtyHash) {
                return pure5({
                  nextId,
                  rows,
                  indexes,
                  hashCache,
                  dirtyHash
                });
              });
            });
          });
        });
      });
    }
    ;
    if (v instanceof Just) {
      return new Left(new VMError(TypeMismatch.value, "Malformed db store: table must be Record"));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Interpreter (line 1286, column 23 - line 1310, column 83): " + [v.constructor.name]);
  };
};
var dbCreateIndex = function(m) {
  return function(args) {
    if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
      return bind12(readDbTable(args[0].value0)(m))(function(tableState) {
        return pure5(new Tuple(writeDbTable(args[0].value0)({
          nextId: tableState.nextId,
          rows: tableState.rows,
          hashCache: tableState.hashCache,
          dirtyHash: tableState.dirtyHash,
          indexes: insert4(args[1].value0)(new VBool(true))(tableState.indexes)
        })(m), VUnit.value));
      });
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "db.createIndex/v1 expects (Table:String, Field:String)"));
  };
};
var dbDelete = function(m) {
  return function(args) {
    if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
      return bind12(readDbTable(args[0].value0)(m))(function(tableState) {
        var rows$prime = $$delete3(args[1].value0)(tableState.rows);
        var existed = member4(args[1].value0)(tableState.rows);
        var tableState$prime = (function() {
          if (existed) {
            return {
              indexes: tableState.indexes,
              nextId: tableState.nextId,
              rows: rows$prime,
              hashCache: Nothing.value,
              dirtyHash: true
            };
          }
          ;
          return tableState;
        })();
        return pure5(new Tuple(writeDbTable(args[0].value0)(tableState$prime)(m), new VBool(existed)));
      });
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "db.delete/v1 expects (Table:String, ID:String)"));
  };
};
var dbGet = function(m) {
  return function(args) {
    if (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString)) {
      return bind12(readDbTable(args[0].value0)(m))(function(tableState) {
        return pure5(new Tuple(m, fromMaybe(VUnit.value)(lookup5(args[1].value0)(tableState.rows))));
      });
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "db.get/v1 expects (Table:String, ID:String)"));
  };
};
var dbHash = function(m) {
  return function(args) {
    if (args.length === 1 && args[0] instanceof VString) {
      return bind12(readDbTable(args[0].value0)(m))(function(tableState) {
        var computed = hashValue(new VRecord(tableState.rows));
        var hashed = (function() {
          if (tableState.dirtyHash) {
            return computed;
          }
          ;
          return fromMaybe(computed)(tableState.hashCache);
        })();
        var tableState$prime = (function() {
          if (tableState.dirtyHash) {
            return {
              indexes: tableState.indexes,
              nextId: tableState.nextId,
              rows: tableState.rows,
              hashCache: new Just(hashed),
              dirtyHash: false
            };
          }
          ;
          return tableState;
        })();
        return pure5(new Tuple(writeDbTable(args[0].value0)(tableState$prime)(m), new VString(hashed)));
      });
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "db.hash/v1 expects (Table:String)"));
  };
};
var dbInsert = function(m) {
  return function(args) {
    if (args.length === 2 && args[0] instanceof VString) {
      return bind12(readDbTable(args[0].value0)(m))(function(tableState) {
        var id2 = "rec" + show18(tableState.nextId);
        var tableState$prime = {
          indexes: tableState.indexes,
          nextId: tableState.nextId + 1 | 0,
          rows: insert4(id2)(args[1])(tableState.rows),
          hashCache: Nothing.value,
          dirtyHash: true
        };
        return pure5(new Tuple(writeDbTable(args[0].value0)(tableState$prime)(m), new VString(id2)));
      });
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "db.insert/v1 expects (Table:String, Record:Value)"));
  };
};
var dbQuery = function(m) {
  return function(args) {
    if (args.length === 3 && (args[0] instanceof VString && args[1] instanceof VRecord)) {
      return bind12(readDbTable(args[0].value0)(m))(function(tableState) {
        var rows = toUnfoldable9(tableState.rows);
        var matched = map14(function(v) {
          return v.value1;
        })(filter(function(v) {
          return rowMatchesQuery(args[1].value0)(v.value1);
        })(rows));
        return pure5(new Tuple(m, new VList(fromArray(matched))));
      });
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "db.query/v1 expects (Table:String, Query:Record, Options:Record)"));
  };
};
var dbUpdate = function(m) {
  return function(args) {
    if (args.length === 3 && (args[0] instanceof VString && args[1] instanceof VString)) {
      return bind12(readDbTable(args[0].value0)(m))(function(tableState) {
        var existed = member4(args[1].value0)(tableState.rows);
        var rows$prime = (function() {
          if (existed) {
            return insert4(args[1].value0)(args[2])(tableState.rows);
          }
          ;
          return tableState.rows;
        })();
        var tableState$prime = (function() {
          if (existed) {
            return {
              indexes: tableState.indexes,
              nextId: tableState.nextId,
              rows: rows$prime,
              hashCache: Nothing.value,
              dirtyHash: true
            };
          }
          ;
          return tableState;
        })();
        return pure5(new Tuple(writeDbTable(args[0].value0)(tableState$prime)(m), new VBool(existed)));
      });
    }
    ;
    return new Left(new VMError(TypeMismatch.value, "db.update/v1 expects (Table:String, ID:String, Record:Value)"));
  };
};
var runStatefulBuiltin = function(m) {
  return function(id2) {
    return function(version) {
      return function(args) {
        var $390 = version !== 1;
        if ($390) {
          return Nothing.value;
        }
        ;
        if (id2 === "db.insert") {
          return new Just(dbInsert(m)(args));
        }
        ;
        if (id2 === "db.get") {
          return new Just(dbGet(m)(args));
        }
        ;
        if (id2 === "db.update") {
          return new Just(dbUpdate(m)(args));
        }
        ;
        if (id2 === "db.delete") {
          return new Just(dbDelete(m)(args));
        }
        ;
        if (id2 === "db.query") {
          return new Just(dbQuery(m)(args));
        }
        ;
        if (id2 === "db.createIndex") {
          return new Just(dbCreateIndex(m)(args));
        }
        ;
        if (id2 === "db.hash") {
          return new Just(dbHash(m)(args));
        }
        ;
        if (id2 === "cache.set") {
          return new Just(cacheSet(m)(args));
        }
        ;
        if (id2 === "cache.get") {
          return new Just(cacheGet(m)(args));
        }
        ;
        if (id2 === "cache.delete") {
          return new Just(cacheDelete(m)(args));
        }
        ;
        return Nothing.value;
      };
    };
  };
};
var awaitKey = function(v) {
  if (v instanceof VRecord) {
    var v1 = lookup5("key")(v.value0);
    if (v1 instanceof Just && v1.value0 instanceof VString) {
      return new Just(v1.value0.value0);
    }
    ;
    return Nothing.value;
  }
  ;
  return Nothing.value;
};
var stepProcess = function(m) {
  return function(p) {
    return discard2((function() {
      var $397 = p.stepsExecuted >= m.config.limits.maxSteps;
      if ($397) {
        return new Left(new VMError(StepLimitExceeded.value, "Process exceeded global step limit"));
      }
      ;
      return pure5(unit);
    })())(function() {
      return bind12((function() {
        var v = lookup5(p["frame"]["function"])(m.program.functions);
        if (v instanceof Nothing) {
          return new Left(new VMError(UnknownFunction.value, "Function not found: " + p["frame"]["function"]));
        }
        ;
        if (v instanceof Just) {
          return pure5(v.value0);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Interpreter (line 43, column 11 - line 45, column 21): " + [v.constructor.name]);
      })())(function(func) {
        return bind12((function() {
          var v = index(func.instructions)(p.frame.pc);
          if (v instanceof Nothing) {
            return new Left(new VMError(InvalidInstruction.value, "PC out of bounds in function " + func.id));
          }
          ;
          if (v instanceof Just) {
            return pure5(v.value0);
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 48, column 11 - line 50, column 21): " + [v.constructor.name]);
        })())(function(inst) {
          var p$prime = {
            callStack: p.callStack,
            children: p.children,
            createdSequence: p.createdSequence,
            error: p.error,
            frame: p.frame,
            "function": p["function"],
            links: p.links,
            mailbox: p.mailbox,
            metadata: p.metadata,
            monitors: p.monitors,
            parent: p.parent,
            pid: p.pid,
            remoteLinks: p.remoteLinks,
            result: p.result,
            status: p.status,
            trapExit: p.trapExit,
            stepsExecuted: p.stepsExecuted + 1 | 0
          };
          var m_traced = (function() {
            if (m.config.performanceMode) {
              return {
                config: m.config,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                outbox: m.outbox,
                program: m.program,
                proofTrace: m.proofTrace,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                counters: {
                  steps: m.counters.steps + 1 | 0
                }
              };
            }
            ;
            return {
              config: m.config,
              events: m.events,
              input: m.input,
              labelCache: m.labelCache,
              outbox: m.outbox,
              program: m.program,
              proofTrace: m.proofTrace,
              scheduler: m.scheduler,
              state: m.state,
              counters: {
                steps: m.counters.steps + 1 | 0
              },
              trace: new Cons(new InstructionExecuted(inst), m.trace)
            };
          })();
          return evalInstruction(m_traced)(p$prime)(func)(inst);
        });
      });
    });
  };
};
var runTransitionAction = function(m) {
  return function(callerPid) {
    return function(actionFn) {
      return function(mi) {
        return bind12((function() {
          var v = lookup5(actionFn)(m.program.functions);
          if (v instanceof Nothing) {
            return new Left(new VMError(UnknownFunction.value, "Transition action not found: " + actionFn));
          }
          ;
          if (v instanceof Just) {
            return pure5(v.value0);
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 1369, column 13 - line 1371, column 21): " + [v.constructor.name]);
        })())(function(action) {
          var args = (function() {
            var $405 = action.arity === 0;
            if ($405) {
              return [];
            }
            ;
            return [new VStateMachineInstance(mi)];
          })();
          return bind12(runFunctionValue(m)(callerPid)(actionFn)(args))(function(v) {
            if (v.value1 instanceof VStateMachineInstance) {
              return pure5(new Tuple(v.value0, v.value1.value0));
            }
            ;
            if (v.value1 instanceof VRecord) {
              return pure5(new Tuple(v.value0, {
                currentState: mi.currentState,
                historyHash: mi.historyHash,
                instanceId: mi.instanceId,
                machineId: mi.machineId,
                version: mi.version,
                data_: v.value1.value0
              }));
            }
            ;
            if (v.value1 instanceof VUnit) {
              return pure5(new Tuple(v.value0, mi));
            }
            ;
            return pure5(new Tuple(v.value0, mi));
          });
        });
      };
    };
  };
};
var runFunctionValue = function(m) {
  return function(callerPid) {
    return function(functionId) {
      return function(args) {
        var runLocal = function(v) {
          return function(currentMachine) {
            return function(currentProcess) {
              return function(remaining) {
                var $412 = remaining <= 0;
                if ($412) {
                  return new Left(new VMError(StepLimitExceeded.value, "Function " + (functionId + " exceeded step limit")));
                }
                ;
                if (currentProcess.status instanceof ProcessReady) {
                  return bind12(stepProcess(currentMachine)(currentProcess))(function(v1) {
                    return runLocal(0)(v1.value0)(v1.value1)(remaining - 1 | 0);
                  });
                }
                ;
                if (currentProcess.status instanceof ProcessCompleted) {
                  return new Right(new Tuple(currentMachine, currentProcess.status.value0));
                }
                ;
                if (currentProcess.status instanceof ProcessFailed) {
                  return new Left(currentProcess.status.value0);
                }
                ;
                if (currentProcess.status instanceof ProcessWaiting) {
                  return new Left(new VMError(ProcessDeadlock.value, "Function " + (functionId + " blocked during synchronous evaluation")));
                }
                ;
                if (currentProcess.status instanceof ProcessExited) {
                  return new Left(new VMError(ProcessCancelled.value, "Function " + (functionId + (" exited: " + show34(currentProcess.status.value0)))));
                }
                ;
                if (currentProcess.status instanceof ProcessCancelled2) {
                  return new Left(new VMError(ProcessCancelled.value, "Function " + (functionId + (" cancelled: " + show26(currentProcess.status.value0)))));
                }
                ;
                if (currentProcess.status instanceof ProcessRunning) {
                  return runLocal(0)(currentMachine)({
                    pid: currentProcess.pid,
                    "function": currentProcess["function"],
                    frame: currentProcess.frame,
                    callStack: currentProcess.callStack,
                    mailbox: currentProcess.mailbox,
                    links: currentProcess.links,
                    remoteLinks: currentProcess.remoteLinks,
                    monitors: currentProcess.monitors,
                    parent: currentProcess.parent,
                    children: currentProcess.children,
                    trapExit: currentProcess.trapExit,
                    metadata: currentProcess.metadata,
                    result: currentProcess.result,
                    error: currentProcess.error,
                    createdSequence: currentProcess.createdSequence,
                    stepsExecuted: currentProcess.stepsExecuted,
                    status: ProcessReady.value
                  })(remaining - 1 | 0);
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 1412, column 12 - line 1421, column 111): " + [currentProcess.status.constructor.name]);
              };
            };
          };
        };
        return bind12((function() {
          var v = lookup5(functionId)(m.program.functions);
          if (v instanceof Nothing) {
            return new Left(new VMError(UnknownFunction.value, "Function not found: " + functionId));
          }
          ;
          if (v instanceof Just) {
            return pure5(v.value0);
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 1382, column 17 - line 1384, column 21): " + [v.constructor.name]);
        })())(function(targetFunc) {
          var newRegs = replicate(targetFunc.registerCount)(VUnit.value);
          var newRegs$prime = foldl2(function(acc) {
            return function(v) {
              return fromMaybe(acc)(updateAt(v.value0)(v.value1)(acc));
            };
          })(newRegs)(mapWithIndex2(Tuple.create)(args));
          var localPid = callerPid + (":call:" + (functionId + (":" + show18(m.counters.steps))));
          var localProcess = {
            pid: localPid,
            status: ProcessReady.value,
            "function": functionId,
            frame: {
              "function": functionId,
              pc: 0,
              registers: newRegs$prime,
              returnRegister: Nothing.value,
              caller: Nothing.value
            },
            callStack: [],
            mailbox: [],
            links: empty4,
            remoteLinks: empty4,
            monitors: empty3,
            parent: new Just(callerPid),
            children: empty4,
            trapExit: false,
            metadata: {
              name: localPid
            },
            result: Nothing.value,
            error: Nothing.value,
            createdSequence: m.scheduler.nextPidSequence,
            stepsExecuted: 0
          };
          return runLocal(targetFunc.registerCount)(m)(localProcess)(m.config.limits.maxSteps);
        });
      };
    };
  };
};
var evalInstruction = function(m) {
  return function(p) {
    return function(func) {
      return function(inst) {
        var pNextPc = {
          callStack: p.callStack,
          children: p.children,
          createdSequence: p.createdSequence,
          error: p.error,
          "function": p["function"],
          links: p.links,
          mailbox: p.mailbox,
          metadata: p.metadata,
          monitors: p.monitors,
          parent: p.parent,
          pid: p.pid,
          remoteLinks: p.remoteLinks,
          result: p.result,
          status: p.status,
          stepsExecuted: p.stepsExecuted,
          trapExit: p.trapExit,
          frame: {
            caller: p.frame.caller,
            "function": p["frame"]["function"],
            registers: p.frame.registers,
            returnRegister: p.frame.returnRegister,
            pc: p.frame.pc + 1 | 0
          }
        };
        if (inst instanceof NOOP) {
          return pure5(new Tuple(m, pNextPc));
        }
        ;
        if (inst instanceof HALT) {
          return bind12(readReg(p)(inst.value0))(function(val) {
            return pure5(new Tuple(m, {
              callStack: p.callStack,
              children: p.children,
              createdSequence: p.createdSequence,
              error: p.error,
              frame: p.frame,
              "function": p["function"],
              links: p.links,
              mailbox: p.mailbox,
              metadata: p.metadata,
              monitors: p.monitors,
              parent: p.parent,
              pid: p.pid,
              remoteLinks: p.remoteLinks,
              result: p.result,
              stepsExecuted: p.stepsExecuted,
              trapExit: p.trapExit,
              status: new ProcessCompleted(val)
            }));
          });
        }
        ;
        if (inst instanceof ABORT) {
          return pure5(new Tuple(m, {
            callStack: p.callStack,
            children: p.children,
            createdSequence: p.createdSequence,
            error: p.error,
            frame: p.frame,
            "function": p["function"],
            links: p.links,
            mailbox: p.mailbox,
            metadata: p.metadata,
            monitors: p.monitors,
            parent: p.parent,
            pid: p.pid,
            remoteLinks: p.remoteLinks,
            result: p.result,
            stepsExecuted: p.stepsExecuted,
            trapExit: p.trapExit,
            status: new ProcessFailed(new VMError(new CustomErrorCode(inst.value0), "Aborted"))
          }));
        }
        ;
        if (inst instanceof LABEL) {
          return pure5(new Tuple(m, pNextPc));
        }
        ;
        if (inst instanceof JUMP) {
          return bind12(findLabel(m)(func)(inst.value0))(function(pc) {
            return pure5(new Tuple(m, {
              callStack: p.callStack,
              children: p.children,
              createdSequence: p.createdSequence,
              error: p.error,
              "function": p["function"],
              links: p.links,
              mailbox: p.mailbox,
              metadata: p.metadata,
              monitors: p.monitors,
              parent: p.parent,
              pid: p.pid,
              remoteLinks: p.remoteLinks,
              result: p.result,
              status: p.status,
              stepsExecuted: p.stepsExecuted,
              trapExit: p.trapExit,
              frame: {
                caller: p.frame.caller,
                "function": p["frame"]["function"],
                registers: p.frame.registers,
                returnRegister: p.frame.returnRegister,
                pc
              }
            }));
          });
        }
        ;
        if (inst instanceof JUMP_IF) {
          return bind12(readReg(p)(inst.value0))(function(val) {
            if (val instanceof VBool) {
              if (val.value0) {
                return bind12(findLabel(m)(func)(inst.value1))(function(pc) {
                  return pure5(new Tuple(m, {
                    callStack: p.callStack,
                    children: p.children,
                    createdSequence: p.createdSequence,
                    error: p.error,
                    "function": p["function"],
                    links: p.links,
                    mailbox: p.mailbox,
                    metadata: p.metadata,
                    monitors: p.monitors,
                    parent: p.parent,
                    pid: p.pid,
                    remoteLinks: p.remoteLinks,
                    result: p.result,
                    status: p.status,
                    stepsExecuted: p.stepsExecuted,
                    trapExit: p.trapExit,
                    frame: {
                      caller: p.frame.caller,
                      "function": p["frame"]["function"],
                      registers: p.frame.registers,
                      returnRegister: p.frame.returnRegister,
                      pc
                    }
                  }));
                });
              }
              ;
              return pure5(new Tuple(m, pNextPc));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "JUMP_IF requires a Boolean register"));
          });
        }
        ;
        if (inst instanceof JUMP_IF_FALSE) {
          return bind12(readReg(p)(inst.value0))(function(val) {
            if (val instanceof VBool) {
              var $438 = !val.value0;
              if ($438) {
                return bind12(findLabel(m)(func)(inst.value1))(function(pc) {
                  return pure5(new Tuple(m, {
                    callStack: p.callStack,
                    children: p.children,
                    createdSequence: p.createdSequence,
                    error: p.error,
                    "function": p["function"],
                    links: p.links,
                    mailbox: p.mailbox,
                    metadata: p.metadata,
                    monitors: p.monitors,
                    parent: p.parent,
                    pid: p.pid,
                    remoteLinks: p.remoteLinks,
                    result: p.result,
                    status: p.status,
                    stepsExecuted: p.stepsExecuted,
                    trapExit: p.trapExit,
                    frame: {
                      caller: p.frame.caller,
                      "function": p["frame"]["function"],
                      registers: p.frame.registers,
                      returnRegister: p.frame.returnRegister,
                      pc
                    }
                  }));
                });
              }
              ;
              return pure5(new Tuple(m, pNextPc));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "JUMP_IF_FALSE requires a Boolean register"));
          });
        }
        ;
        if (inst instanceof MOVE) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            var p$prime2 = writeReg(pNextPc)(inst.value0)(val);
            return pure5(new Tuple(m, p$prime2));
          });
        }
        ;
        if (inst instanceof CLEAR) {
          var p$prime = writeReg(pNextPc)(inst.value0)(VUnit.value);
          return pure5(new Tuple(m, p$prime));
        }
        ;
        if (inst instanceof LOAD_CONST) {
          return bind12((function() {
            var v2 = index(m.program.constants)(inst.value1);
            if (v2 instanceof Nothing) {
              return new Left(new VMError(InvalidInstruction.value, "Constant index out of bounds"));
            }
            ;
            if (v2 instanceof Just) {
              return pure5(v2.value0);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Interpreter (line 119, column 12 - line 121, column 23): " + [v2.constructor.name]);
          })())(function(val) {
            var p$prime2 = writeReg(pNextPc)(inst.value0)(val);
            return pure5(new Tuple(m, p$prime2));
          });
        }
        ;
        if (inst instanceof LOAD_INPUT) {
          var v = lookup5(inst.value1)(m.input);
          if (v instanceof Nothing) {
            return new Left(new VMError(MissingInput.value, "Input path not found: " + inst.value1));
          }
          ;
          if (v instanceof Just) {
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(v.value0)));
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 126, column 5 - line 128, column 56): " + [v.constructor.name]);
        }
        ;
        if (inst instanceof LOAD_CONTEXT) {
          var v = lookup5(inst.value1)(m.input);
          if (v instanceof Nothing) {
            return new Left(new VMError(MissingContext.value, "Context path not found: " + inst.value1));
          }
          ;
          if (v instanceof Just) {
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(v.value0)));
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 131, column 5 - line 133, column 56): " + [v.constructor.name]);
        }
        ;
        if (inst instanceof ADD) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              if (vA instanceof VInt && vB instanceof VInt) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(add12(vA.value0)(vB.value0)))));
              }
              ;
              if (vA instanceof VFixed && vB instanceof VFixed) {
                var v2 = add5(vA.value0)(vB.value0);
                if (v2 instanceof Left) {
                  return new Left(new VMError(ArithmeticOverflow.value, "Fixed add failed"));
                }
                ;
                if (v2 instanceof Right) {
                  return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VFixed(v2.value0))));
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 140, column 31 - line 142, column 72): " + [v2.constructor.name]);
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "ADD requires numeric types"));
            });
          });
        }
        ;
        if (inst instanceof SUB) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              if (vA instanceof VInt && vB instanceof VInt) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(sub1(vA.value0)(vB.value0)))));
              }
              ;
              if (vA instanceof VFixed && vB instanceof VFixed) {
                var v2 = sub4(vA.value0)(vB.value0);
                if (v2 instanceof Left) {
                  return new Left(new VMError(ArithmeticOverflow.value, "Fixed sub failed"));
                }
                ;
                if (v2 instanceof Right) {
                  return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VFixed(v2.value0))));
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 150, column 31 - line 152, column 72): " + [v2.constructor.name]);
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "SUB requires numeric types"));
            });
          });
        }
        ;
        if (inst instanceof MUL) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              if (vA instanceof VInt && vB instanceof VInt) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(mul5(vA.value0)(vB.value0)))));
              }
              ;
              if (vA instanceof VFixed && vB instanceof VFixed) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VFixed(mul4(vA.value0)(vB.value0)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "MUL requires numeric types"));
            });
          });
        }
        ;
        if (inst instanceof MOD) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              if (vA instanceof VInt && vB instanceof VInt) {
                var $492 = eq32(vB.value0)(fromInt(0));
                if ($492) {
                  return new Left(new VMError(DivisionByZero.value, "BigInt modulo by zero"));
                }
                ;
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(rem2(vA.value0)(vB.value0)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "MOD requires integer registers"));
            });
          });
        }
        ;
        if (inst instanceof NEG) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            if (val instanceof VInt) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(negate12(val.value0)))));
            }
            ;
            if (val instanceof VFixed) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VFixed({
                scale: val.value0.scale,
                value: negate12(val.value0.value)
              }))));
            }
            ;
            if (val instanceof VRational) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VRational({
                denominator: val.value0.denominator,
                numerator: negate12(val.value0.numerator)
              }))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NEG requires numeric type"));
          });
        }
        ;
        if (inst instanceof ABS) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            if (val instanceof VInt) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt((function() {
                var $505 = lessThan6(val.value0)(fromInt(0));
                if ($505) {
                  return negate12(val.value0);
                }
                ;
                return val.value0;
              })()))));
            }
            ;
            if (val instanceof VFixed) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VFixed({
                scale: val.value0.scale,
                value: (function() {
                  var $507 = lessThan6(val.value0.value)(fromInt(0));
                  if ($507) {
                    return negate12(val.value0.value);
                  }
                  ;
                  return val.value0.value;
                })()
              }))));
            }
            ;
            if (val instanceof VRational) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VRational({
                denominator: val.value0.denominator,
                numerator: (function() {
                  var $509 = lessThan6(val.value0.numerator)(fromInt(0));
                  if ($509) {
                    return negate12(val.value0.numerator);
                  }
                  ;
                  return val.value0.numerator;
                })()
              }))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "ABS requires numeric type"));
          });
        }
        ;
        if (inst instanceof EQ2) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(eq43(vA)(vB)))));
            });
          });
        }
        ;
        if (inst instanceof NEQ) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(notEq1(vA)(vB)))));
            });
          });
        }
        ;
        if (inst instanceof LT2) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(lessThan1(vA)(vB)))));
            });
          });
        }
        ;
        if (inst instanceof LTE) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(lessThanOrEq1(vA)(vB)))));
            });
          });
        }
        ;
        if (inst instanceof GT2) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(greaterThan3(vA)(vB)))));
            });
          });
        }
        ;
        if (inst instanceof GTE) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(greaterThanOrEq1(vA)(vB)))));
            });
          });
        }
        ;
        if (inst instanceof MIN) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)((function() {
                var $531 = lessThanOrEq1(vA)(vB);
                if ($531) {
                  return vA;
                }
                ;
                return vB;
              })())));
            });
          });
        }
        ;
        if (inst instanceof MAX) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)((function() {
                var $535 = greaterThanOrEq1(vA)(vB);
                if ($535) {
                  return vA;
                }
                ;
                return vB;
              })())));
            });
          });
        }
        ;
        if (inst instanceof CLAMP) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            return bind12(readReg(p)(inst.value2))(function(minVal) {
              return bind12(readReg(p)(inst.value3))(function(maxVal) {
                var clamped = (function() {
                  var $539 = lessThan1(val)(minVal);
                  if ($539) {
                    return minVal;
                  }
                  ;
                  var $540 = greaterThan3(val)(maxVal);
                  if ($540) {
                    return maxVal;
                  }
                  ;
                  return val;
                })();
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(clamped)));
              });
            });
          });
        }
        ;
        if (inst instanceof COMPARE) {
          return bind12(readReg(p)(inst.value1))(function(vA) {
            return bind12(readReg(p)(inst.value2))(function(vB) {
              var cmp = (function() {
                var $545 = lessThan1(vA)(vB);
                if ($545) {
                  return fromInt(-1 | 0);
                }
                ;
                var $546 = greaterThan3(vA)(vB);
                if ($546) {
                  return fromInt(1);
                }
                ;
                return fromInt(0);
              })();
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(cmp))));
            });
          });
        }
        ;
        if (inst instanceof RECORD_NEW) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VRecord(empty3))));
        }
        ;
        if (inst instanceof RECORD_GET) {
          return bind12(readReg(p)(inst.value1))(function(vR) {
            if (vR instanceof VRecord) {
              var v2 = lookup5(inst.value2)(vR.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(MissingState.value, "Field " + (inst.value2 + " not found in record")));
              }
              ;
              if (v2 instanceof Just) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(v2.value0)));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 247, column 25 - line 249, column 58): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "RECORD_GET requires a Record"));
          });
        }
        ;
        if (inst instanceof RECORD_GET_OPT) {
          return bind12(readReg(p)(inst.value1))(function(vR) {
            if (vR instanceof VRecord) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(lookup5(inst.value2)(vR.value0)))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "RECORD_GET_OPT requires a Record"));
          });
        }
        ;
        if (inst instanceof RECORD_SET) {
          return bind12(readReg(p)(inst.value1))(function(vR) {
            return bind12(readReg(p)(inst.value3))(function(vV) {
              if (vR instanceof VRecord) {
                var newFields = insert4(inst.value2)(vV)(vR.value0);
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VRecord(newFields))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "RECORD_SET requires a Record"));
            });
          });
        }
        ;
        if (inst instanceof RECORD_HAS) {
          return bind12(readReg(p)(inst.value1))(function(vR) {
            if (vR instanceof VRecord) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(member4(inst.value2)(vR.value0)))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "RECORD_HAS requires a Record"));
          });
        }
        ;
        if (inst instanceof RECORD_REMOVE) {
          return bind12(readReg(p)(inst.value1))(function(vR) {
            if (vR instanceof VRecord) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VRecord($$delete3(inst.value2)(vR.value0)))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "RECORD_REMOVE requires a Record"));
          });
        }
        ;
        if (inst instanceof RECORD_KEYS) {
          return bind12(readReg(p)(inst.value1))(function(vR) {
            if (vR instanceof VRecord) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(fromArray(map14(VString.create)(toUnfoldable14(keys3(vR.value0))))))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "RECORD_KEYS requires a Record"));
          });
        }
        ;
        if (inst instanceof LIST_NEW) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(empty5))));
        }
        ;
        if (inst instanceof LIST_FROM) {
          return bind12(traverse3(readReg(p))(inst.value1))(function(vals) {
            var $584 = length(vals) > m.config.limits.maxListLength;
            if ($584) {
              return new Left(new VMError(InvalidInstruction.value, "LIST_FROM exceeded maxListLength"));
            }
            ;
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(fromArray(vals)))));
          });
        }
        ;
        if (inst instanceof LIST_APPEND) {
          return bind12(readReg(p)(inst.value1))(function(vL) {
            return bind12(readReg(p)(inst.value2))(function(vV) {
              if (vL instanceof VList) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(snoc2(vL.value0)(vV)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "LIST_APPEND requires a List"));
            });
          });
        }
        ;
        if (inst instanceof LIST_GET) {
          return bind12(readReg(p)(inst.value1))(function(vL) {
            return bind12(readReg(p)(inst.value2))(function(vIdx) {
              if (vL instanceof VList && vIdx instanceof VInt) {
                var i = toInt(vIdx.value0);
                if (i instanceof Nothing) {
                  return new Left(new VMError(InvalidInstruction.value, "List index out of BigInt range"));
                }
                ;
                if (i instanceof Just) {
                  var v2 = index2(vL.value0)(i.value0);
                  if (v2 instanceof Nothing) {
                    return new Left(new VMError(InvalidInstruction.value, "List index out of bounds"));
                  }
                  ;
                  if (v2 instanceof Just) {
                    return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(v2.value0)));
                  }
                  ;
                  throw new Error("Failed pattern match at FinVM.Interpreter (line 308, column 26 - line 310, column 62): " + [v2.constructor.name]);
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 306, column 9 - line 310, column 62): " + [i.constructor.name]);
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "LIST_GET requires a List and an Integer index"));
            });
          });
        }
        ;
        if (inst instanceof LIST_SET) {
          return bind12(readReg(p)(inst.value1))(function(vL) {
            return bind12(readReg(p)(inst.value2))(function(vIdx) {
              return bind12(readReg(p)(inst.value3))(function(vVal) {
                if (vL instanceof VList && vIdx instanceof VInt) {
                  return bind12(bigintToInt("List index out of BigInt range")(vIdx.value0))(function(idxInt) {
                    var v2 = updateAt2(idxInt)(vVal)(vL.value0);
                    if (v2 instanceof Nothing) {
                      return new Left(new VMError(InvalidInstruction.value, "List index out of bounds"));
                    }
                    ;
                    if (v2 instanceof Just) {
                      return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(v2.value0))));
                    }
                    ;
                    throw new Error("Failed pattern match at FinVM.Interpreter (line 320, column 9 - line 322, column 84): " + [v2.constructor.name]);
                  });
                }
                ;
                return new Left(new VMError(TypeMismatch.value, "LIST_SET requires a List and an Integer index"));
              });
            });
          });
        }
        ;
        if (inst instanceof LIST_LENGTH) {
          return bind12(readReg(p)(inst.value1))(function(vL) {
            if (vL instanceof VList) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(fromInt(length4(vL.value0))))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "LIST_LENGTH requires a List"));
          });
        }
        ;
        if (inst instanceof LIST_SLICE) {
          return bind12(readReg(p)(inst.value1))(function(vL) {
            return bind12(readReg(p)(inst.value2))(function(vStart) {
              return bind12(readReg(p)(inst.value3))(function(vEnd) {
                if (vL instanceof VList && (vStart instanceof VInt && vEnd instanceof VInt)) {
                  return bind12(bigintToInt("List slice start out of BigInt range")(vStart.value0))(function(startInt) {
                    return bind12(bigintToInt("List slice end out of BigInt range")(vEnd.value0))(function(endInt) {
                      return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(fromArray(slice(startInt)(endInt)(toArray2(vL.value0)))))));
                    });
                  });
                }
                ;
                return new Left(new VMError(TypeMismatch.value, "LIST_SLICE requires a List and Integer bounds"));
              });
            });
          });
        }
        ;
        if (inst instanceof MAP_NEW) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VMap(empty3))));
        }
        ;
        if (inst instanceof MAP_SET) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            return bind12(readReg(p)(inst.value2))(function(vK) {
              return bind12(readReg(p)(inst.value3))(function(vV) {
                if (vM instanceof VMap) {
                  var newEntries = insert1(vK)(vV)(vM.value0);
                  return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VMap(newEntries))));
                }
                ;
                return new Left(new VMError(TypeMismatch.value, "MAP_SET requires a Map"));
              });
            });
          });
        }
        ;
        if (inst instanceof MAP_GET) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            return bind12(readReg(p)(inst.value2))(function(vK) {
              if (vM instanceof VMap) {
                var v2 = lookup12(vK)(vM.value0);
                if (v2 instanceof Nothing) {
                  return new Left(new VMError(MissingState.value, "Key not found in map"));
                }
                ;
                if (v2 instanceof Just) {
                  return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(v2.value0)));
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 358, column 23 - line 360, column 58): " + [v2.constructor.name]);
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "MAP_GET requires a Map"));
            });
          });
        }
        ;
        if (inst instanceof MAP_GET_OPT) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            return bind12(readReg(p)(inst.value2))(function(vK) {
              if (vM instanceof VMap) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(lookup12(vK)(vM.value0)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "MAP_GET_OPT requires a Map"));
            });
          });
        }
        ;
        if (inst instanceof MAP_HAS) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            return bind12(readReg(p)(inst.value2))(function(vK) {
              if (vM instanceof VMap) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(member1(vK)(vM.value0)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "MAP_HAS requires a Map"));
            });
          });
        }
        ;
        if (inst instanceof MAP_REMOVE) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            return bind12(readReg(p)(inst.value2))(function(vK) {
              if (vM instanceof VMap) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VMap(delete1(vK)(vM.value0)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "MAP_REMOVE requires a Map"));
            });
          });
        }
        ;
        if (inst instanceof MAP_KEYS) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            if (vM instanceof VMap) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(fromArray(toUnfoldable14(keys3(vM.value0)))))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "MAP_KEYS requires a Map"));
          });
        }
        ;
        if (inst instanceof MAP_VALUES) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            if (vM instanceof VMap) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(fromArray(toUnfoldable22(values(vM.value0)))))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "MAP_VALUES requires a Map"));
          });
        }
        ;
        if (inst instanceof MAP_SIZE) {
          return bind12(readReg(p)(inst.value1))(function(vM) {
            if (vM instanceof VMap) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(fromInt(size2(vM.value0))))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "MAP_SIZE requires a Map"));
          });
        }
        ;
        if (inst instanceof VARIANT_NEW) {
          return bind12(readReg(p)(inst.value2))(function(payload) {
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VVariant(inst.value1, payload))));
          });
        }
        ;
        if (inst instanceof VARIANT_TAG) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            if (val instanceof VVariant) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(val.value0))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "VARIANT_TAG requires a Variant"));
          });
        }
        ;
        if (inst instanceof VARIANT_PAYLOAD) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            if (val instanceof VVariant) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(val.value1)));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "VARIANT_PAYLOAD requires a Variant"));
          });
        }
        ;
        if (inst instanceof DIV) {
          return bind12(readReg(p)(inst.value2))(function(vA) {
            return bind12(readReg(p)(inst.value3))(function(vB) {
              if (vA instanceof VInt && vB instanceof VInt) {
                var $683 = eq32(vB.value0)(fromInt(0));
                if ($683) {
                  return new Left(new VMError(DivisionByZero.value, "BigInt division by zero"));
                }
                ;
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(div6(vA.value0)(vB.value0)))));
              }
              ;
              if (vA instanceof VFixed && vB instanceof VFixed) {
                var v2 = div5(vA.value0)(vB.value0)(inst.value1);
                if (v2 instanceof Left) {
                  return new Left(new VMError(v2.value0, "Fixed division failed"));
                }
                ;
                if (v2 instanceof Right) {
                  return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VFixed(v2.value0))));
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 426, column 31 - line 428, column 72): " + [v2.constructor.name]);
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "DIV requires numeric types"));
            });
          });
        }
        ;
        if (inst instanceof CALL) {
          return bind12((function() {
            var v2 = lookup5(inst.value1)(m.program.functions);
            if (v2 instanceof Nothing) {
              return new Left(new VMError(UnknownFunction.value, "Unknown function: " + inst.value1));
            }
            ;
            if (v2 instanceof Just) {
              return pure5(v2.value0);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Interpreter (line 432, column 19 - line 434, column 23): " + [v2.constructor.name]);
          })())(function(targetFunc) {
            return bind12((function() {
              var $697 = length(p.callStack) >= m.config.limits.maxCallDepth || length(p.callStack) >= m.config.limits.maxFrames;
              if ($697) {
                return new Left(new VMError(StepLimitExceeded.value, "CALL exceeded call frame limit"));
              }
              ;
              return pure5(unit);
            })())(function() {
              return bind12((function() {
                var $698 = targetFunc.registerCount > m.config.limits.maxRegistersPerFrame;
                if ($698) {
                  return new Left(new VMError(InvalidRegister.value, "CALL target exceeded maxRegistersPerFrame"));
                }
                ;
                return pure5(unit);
              })())(function() {
                return bind12(traverse3(readReg(p))(inst.value2))(function(argVals) {
                  var newRegs = replicate(targetFunc.registerCount)(VUnit.value);
                  var newRegs$prime = foldl2(function(acc) {
                    return function(v2) {
                      return fromMaybe(acc)(updateAt(v2.value0)(v2.value1)(acc));
                    };
                  })(newRegs)(mapWithIndex2(Tuple.create)(argVals));
                  var newFrame = {
                    "function": inst.value1,
                    pc: 0,
                    registers: newRegs$prime,
                    returnRegister: new Just(inst.value0),
                    caller: Nothing.value
                  };
                  var p$prime2 = {
                    children: pNextPc.children,
                    createdSequence: pNextPc.createdSequence,
                    error: pNextPc.error,
                    "function": pNextPc["function"],
                    links: pNextPc.links,
                    mailbox: pNextPc.mailbox,
                    metadata: pNextPc.metadata,
                    monitors: pNextPc.monitors,
                    parent: pNextPc.parent,
                    pid: pNextPc.pid,
                    remoteLinks: pNextPc.remoteLinks,
                    result: pNextPc.result,
                    status: pNextPc.status,
                    stepsExecuted: pNextPc.stepsExecuted,
                    trapExit: pNextPc.trapExit,
                    frame: newFrame,
                    callStack: snoc(pNextPc.callStack)(pNextPc.frame)
                  };
                  return pure5(new Tuple(m, p$prime2));
                });
              });
            });
          });
        }
        ;
        if (inst instanceof TAIL_CALL) {
          return bind12((function() {
            var v2 = lookup5(inst.value0)(m.program.functions);
            if (v2 instanceof Nothing) {
              return new Left(new VMError(UnknownFunction.value, "Unknown function: " + inst.value0));
            }
            ;
            if (v2 instanceof Just) {
              return pure5(v2.value0);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Interpreter (line 454, column 19 - line 456, column 23): " + [v2.constructor.name]);
          })())(function(targetFunc) {
            return bind12(traverse3(readReg(p))(inst.value1))(function(argVals) {
              var newRegs = replicate(targetFunc.registerCount)(VUnit.value);
              var newRegs$prime = foldl2(function(acc) {
                return function(v2) {
                  return fromMaybe(acc)(updateAt(v2.value0)(v2.value1)(acc));
                };
              })(newRegs)(mapWithIndex2(Tuple.create)(argVals));
              var newFrame = {
                "function": inst.value0,
                pc: 0,
                registers: newRegs$prime,
                returnRegister: p.frame.returnRegister,
                caller: p.frame.caller
              };
              return pure5(new Tuple(m, {
                callStack: p.callStack,
                children: p.children,
                createdSequence: p.createdSequence,
                error: p.error,
                "function": p["function"],
                links: p.links,
                mailbox: p.mailbox,
                metadata: p.metadata,
                monitors: p.monitors,
                parent: p.parent,
                pid: p.pid,
                remoteLinks: p.remoteLinks,
                result: p.result,
                status: p.status,
                stepsExecuted: p.stepsExecuted,
                trapExit: p.trapExit,
                frame: newFrame
              }));
            });
          });
        }
        ;
        if (inst instanceof RETURN) {
          return bind12(readReg(p)(inst.value0))(function(retVal) {
            var v2 = unsnoc(p.callStack);
            if (v2 instanceof Nothing) {
              return pure5(new Tuple(m, {
                callStack: p.callStack,
                children: p.children,
                createdSequence: p.createdSequence,
                error: p.error,
                frame: p.frame,
                "function": p["function"],
                links: p.links,
                mailbox: p.mailbox,
                metadata: p.metadata,
                monitors: p.monitors,
                parent: p.parent,
                pid: p.pid,
                remoteLinks: p.remoteLinks,
                stepsExecuted: p.stepsExecuted,
                trapExit: p.trapExit,
                status: new ProcessCompleted(retVal),
                result: new Just(retVal)
              }));
            }
            ;
            if (v2 instanceof Just) {
              var p$prime2 = {
                children: p.children,
                createdSequence: p.createdSequence,
                error: p.error,
                "function": p["function"],
                links: p.links,
                mailbox: p.mailbox,
                metadata: p.metadata,
                monitors: p.monitors,
                parent: p.parent,
                pid: p.pid,
                remoteLinks: p.remoteLinks,
                result: p.result,
                status: p.status,
                stepsExecuted: p.stepsExecuted,
                trapExit: p.trapExit,
                frame: v2.value0.last,
                callStack: v2.value0.init
              };
              return bind12((function() {
                if (p.frame.returnRegister instanceof Nothing) {
                  return pure5(p$prime2);
                }
                ;
                if (p.frame.returnRegister instanceof Just) {
                  return pure5(writeReg(p$prime2)(p.frame.returnRegister.value0)(retVal));
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 475, column 16 - line 477, column 58): " + [p.frame.returnRegister.constructor.name]);
              })())(function(p$prime$prime) {
                return pure5(new Tuple(m, p$prime$prime));
              });
            }
            ;
            throw new Error("Failed pattern match at FinVM.Interpreter (line 468, column 5 - line 478, column 27): " + [v2.constructor.name]);
          });
        }
        ;
        if (inst instanceof STATE_GET) {
          var v = lookup5(inst.value1)(m.state);
          if (v instanceof Nothing) {
            return new Left(new VMError(MissingState.value, "State path not found: " + inst.value1));
          }
          ;
          if (v instanceof Just) {
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(v.value0)));
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 481, column 5 - line 483, column 56): " + [v.constructor.name]);
        }
        ;
        if (inst instanceof STATE_GET_OPT) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(lookup5(inst.value1)(m.state)))));
        }
        ;
        if (inst instanceof STATE_SET) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            return bind12((function() {
              var $725 = !member4(inst.value0)(m.state) && size2(m.state) >= m.config.limits.maxStateEntries;
              if ($725) {
                return new Left(new VMError(StatePathInvalid.value, "STATE_SET exceeded maxStateEntries"));
              }
              ;
              return pure5(unit);
            })())(function() {
              var m$prime2 = {
                config: m.config,
                counters: m.counters,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                outbox: m.outbox,
                program: m.program,
                proofTrace: m.proofTrace,
                scheduler: m.scheduler,
                trace: m.trace,
                state: insert4(inst.value0)(val)(m.state)
              };
              return pure5(new Tuple(m$prime2, pNextPc));
            });
          });
        }
        ;
        if (inst instanceof STATE_DELETE) {
          return pure5(new Tuple({
            config: m.config,
            counters: m.counters,
            events: m.events,
            input: m.input,
            labelCache: m.labelCache,
            outbox: m.outbox,
            program: m.program,
            proofTrace: m.proofTrace,
            scheduler: m.scheduler,
            trace: m.trace,
            state: $$delete3(inst.value0)(m.state)
          }, pNextPc));
        }
        ;
        if (inst instanceof STATE_EXISTS) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(member4(inst.value1)(m.state)))));
        }
        ;
        if (inst instanceof STATE_KEYS) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(fromArray(map14(VString.create)(toUnfoldable14(keys3(m.state))))))));
        }
        ;
        if (inst instanceof STATE_SNAPSHOT) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(createSnapshot(m)))));
        }
        ;
        if (inst instanceof EVENT_NEW) {
          return bind12(readReg(p)(inst.value2))(function(payload) {
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VEvent({
              type_: inst.value1,
              payload
            }))));
          });
        }
        ;
        if (inst instanceof EVENT_EMIT) {
          return bind12(readReg(p)(inst.value0))(function(val) {
            if (val instanceof VEvent) {
              var $738 = length3(m.events) >= m.config.limits.maxEventsEmitted;
              if ($738) {
                return new Left(new VMError(TraceLimitExceeded.value, "EVENT_EMIT exceeded maxEventsEmitted"));
              }
              ;
              return pure5(new Tuple({
                config: m.config,
                counters: m.counters,
                input: m.input,
                labelCache: m.labelCache,
                outbox: m.outbox,
                program: m.program,
                proofTrace: m.proofTrace,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                events: new Cons(val.value0, m.events)
              }, pNextPc));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "EVENT_EMIT requires an Event"));
          });
        }
        ;
        if (inst instanceof EVENT_BATCH_NEW) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(empty5))));
        }
        ;
        if (inst instanceof EVENT_BATCH_APPEND) {
          return bind12(readReg(p)(inst.value1))(function(batch) {
            return bind12(readReg(p)(inst.value2))(function(event) {
              if (batch instanceof VList && event instanceof VEvent) {
                var $744 = length4(batch.value0) >= m.config.limits.maxEventsEmitted;
                if ($744) {
                  return new Left(new VMError(TraceLimitExceeded.value, "EVENT_BATCH_APPEND exceeded maxEventsEmitted"));
                }
                ;
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(snoc2(batch.value0)(event)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "EVENT_BATCH_APPEND requires a List and Event"));
            });
          });
        }
        ;
        if (inst instanceof EFFECT_NEW) {
          return bind12(readReg(p)(inst.value2))(function(payload) {
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VEffectIntent({
              type_: inst.value1,
              payload
            }))));
          });
        }
        ;
        if (inst instanceof EFFECT_REQUEST) {
          return bind12(readReg(p)(inst.value0))(function(val) {
            if (val instanceof VEffectIntent) {
              var $754 = length3(m.outbox) >= m.config.limits.maxEffectsRequested;
              if ($754) {
                return new Left(new VMError(TraceLimitExceeded.value, "EFFECT_REQUEST exceeded maxEffectsRequested"));
              }
              ;
              return pure5(new Tuple({
                config: m.config,
                counters: m.counters,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                program: m.program,
                proofTrace: m.proofTrace,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                outbox: new Cons(val.value0, m.outbox)
              }, pNextPc));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "EFFECT_REQUEST requires an EffectIntent"));
          });
        }
        ;
        if (inst instanceof EFFECT_AWAIT) {
          return bind12(readReg(p)(inst.value0))(function(v2) {
            if (v2 instanceof VEffectIntent) {
              var v1 = awaitKey(v2.value0.payload);
              if (v1 instanceof Nothing) {
                return new Left(new VMError(TypeMismatch.value, "EFFECT_AWAIT payload must be a record with a string 'key'"));
              }
              ;
              if (v1 instanceof Just) {
                var $759 = length3(m.outbox) >= m.config.limits.maxEffectsRequested;
                if ($759) {
                  return new Left(new VMError(TraceLimitExceeded.value, "EFFECT_AWAIT exceeded maxEffectsRequested"));
                }
                ;
                var tagged = {
                  type_: v2.value0.type_,
                  payload: new VRecord(fromFoldable7([new Tuple("pid", new VString(p.pid)), new Tuple("key", new VString(v1.value0)), new Tuple("payload", v2.value0.payload)]))
                };
                var m$prime2 = {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  program: m.program,
                  proofTrace: m.proofTrace,
                  scheduler: m.scheduler,
                  state: m.state,
                  trace: m.trace,
                  outbox: new Cons(tagged, m.outbox)
                };
                return pure5(new Tuple(m$prime2, {
                  callStack: pNextPc.callStack,
                  children: pNextPc.children,
                  createdSequence: pNextPc.createdSequence,
                  error: pNextPc.error,
                  frame: pNextPc.frame,
                  "function": pNextPc["function"],
                  links: pNextPc.links,
                  mailbox: pNextPc.mailbox,
                  metadata: pNextPc.metadata,
                  monitors: pNextPc.monitors,
                  parent: pNextPc.parent,
                  pid: pNextPc.pid,
                  remoteLinks: pNextPc.remoteLinks,
                  result: pNextPc.result,
                  stepsExecuted: pNextPc.stepsExecuted,
                  trapExit: pNextPc.trapExit,
                  status: new ProcessWaiting(new WaitingOnEffect(v1.value0))
                }));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 554, column 26 - line 570, column 93): " + [v1.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "EFFECT_AWAIT requires an EffectIntent"));
          });
        }
        ;
        if (inst instanceof EFFECT_BATCH_NEW) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(empty5))));
        }
        ;
        if (inst instanceof EFFECT_BATCH_APPEND) {
          return bind12(readReg(p)(inst.value1))(function(batch) {
            return bind12(readReg(p)(inst.value2))(function(effect) {
              if (batch instanceof VList && effect instanceof VEffectIntent) {
                var $766 = length4(batch.value0) >= m.config.limits.maxEffectsRequested;
                if ($766) {
                  return new Left(new VMError(TraceLimitExceeded.value, "EFFECT_BATCH_APPEND exceeded maxEffectsRequested"));
                }
                ;
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(snoc2(batch.value0)(effect)))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "EFFECT_BATCH_APPEND requires a List and EffectIntent"));
            });
          });
        }
        ;
        if (inst instanceof PROC_SELF) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VProcessRef(p.pid))));
        }
        ;
        if (inst instanceof PROC_STATUS) {
          return bind12(readReg(p)(inst.value1))(function(vPid) {
            if (vPid instanceof VProcessRef) {
              var v2 = findProcess(m.scheduler)(vPid.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
              }
              ;
              if (v2 instanceof Just) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(show43(v2.value0.status)))));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 591, column 26 - line 593, column 94): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_STATUS requires a ProcessRef"));
          });
        }
        ;
        if (inst instanceof PROC_SPAWN) {
          return bind12((function() {
            var v2 = lookup5(inst.value1)(m.program.functions);
            if (v2 instanceof Nothing) {
              return new Left(new VMError(UnknownFunction.value, "Unknown function: " + inst.value1));
            }
            ;
            if (v2 instanceof Just) {
              return pure5(v2.value0);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Interpreter (line 598, column 19 - line 600, column 23): " + [v2.constructor.name]);
          })())(function(targetFunc) {
            return bind12((function() {
              var $781 = size2(m.scheduler.processes) >= m.config.limits.maxProcesses;
              if ($781) {
                return new Left(new VMError(InvalidInstruction.value, "PROC_SPAWN exceeded maxProcesses"));
              }
              ;
              return pure5(unit);
            })())(function() {
              var v2 = nextPid(m.scheduler);
              return bind12(traverse3(readReg(p))(inst.value2))(function(argVals) {
                var newRegs = replicate(targetFunc.registerCount)(VUnit.value);
                var newRegsFilled = foldl2(function(acc) {
                  return function(v1) {
                    return fromMaybe(acc)(updateAt(v1.value0)(v1.value1)(acc));
                  };
                })(newRegs)(mapWithIndex2(Tuple.create)(argVals));
                var newProcess = {
                  pid: v2.value0,
                  status: ProcessReady.value,
                  "function": inst.value1,
                  frame: {
                    "function": inst.value1,
                    pc: 0,
                    registers: newRegsFilled,
                    returnRegister: Nothing.value,
                    caller: Nothing.value
                  },
                  callStack: [],
                  mailbox: [],
                  links: empty4,
                  remoteLinks: empty4,
                  monitors: empty3,
                  parent: new Just(p.pid),
                  children: empty4,
                  trapExit: false,
                  metadata: {
                    name: v2.value0
                  },
                  result: Nothing.value,
                  error: Nothing.value,
                  createdSequence: v2.value1.nextPidSequence,
                  stepsExecuted: 0
                };
                var m$prime2 = {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  outbox: m.outbox,
                  program: m.program,
                  proofTrace: m.proofTrace,
                  state: m.state,
                  trace: m.trace,
                  scheduler: spawnProcess(v2.value1)(newProcess)
                };
                return pure5(new Tuple(m$prime2, writeReg(pNextPc)(inst.value0)(new VProcessRef(v2.value0))));
              });
            });
          });
        }
        ;
        if (inst instanceof PROC_SEND) {
          return bind12(readReg(p)(inst.value0))(function(vPid) {
            return bind12(readReg(p)(inst.value1))(function(vMsg) {
              if (vPid instanceof VProcessRef) {
                var v2 = findProcess(m.scheduler)(vPid.value0);
                if (v2 instanceof Nothing) {
                  return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
                }
                ;
                if (v2 instanceof Just) {
                  return bind12((function() {
                    var $793 = length(v2.value0.mailbox) >= m.config.limits.maxMailboxSize;
                    if ($793) {
                      return new Left(new VMError(MailboxTooLarge.value, "Process " + (vPid.value0 + " mailbox is full")));
                    }
                    ;
                    return pure5(unit);
                  })())(function() {
                    var mailbox$prime = snoc(v2.value0.mailbox)(vMsg);
                    var wakesMailbox = (function() {
                      if (v2.value0.status instanceof ProcessWaiting && v2.value0.status.value0 instanceof WaitingForMessage) {
                        return true;
                      }
                      ;
                      if (v2.value0.status instanceof ProcessWaiting && v2.value0.status.value0 instanceof WaitingOnMatch) {
                        return mailboxHasVariantTag(v2.value0.status.value0.value0)(mailbox$prime);
                      }
                      ;
                      return false;
                    })();
                    var targetP$prime = {
                      callStack: v2.value0.callStack,
                      children: v2.value0.children,
                      createdSequence: v2.value0.createdSequence,
                      error: v2.value0.error,
                      frame: v2.value0.frame,
                      "function": v2["value0"]["function"],
                      links: v2.value0.links,
                      metadata: v2.value0.metadata,
                      monitors: v2.value0.monitors,
                      parent: v2.value0.parent,
                      pid: v2.value0.pid,
                      remoteLinks: v2.value0.remoteLinks,
                      result: v2.value0.result,
                      stepsExecuted: v2.value0.stepsExecuted,
                      trapExit: v2.value0.trapExit,
                      mailbox: mailbox$prime,
                      status: (function() {
                        if (wakesMailbox) {
                          return ProcessReady.value;
                        }
                        ;
                        return v2.value0.status;
                      })()
                    };
                    var s1 = updateProcess(m.scheduler)(targetP$prime);
                    var s2 = (function() {
                      if (wakesMailbox) {
                        return yieldProcess(s1)(vPid.value0);
                      }
                      ;
                      return s1;
                    })();
                    var m$prime2 = {
                      config: m.config,
                      counters: m.counters,
                      events: m.events,
                      input: m.input,
                      labelCache: m.labelCache,
                      outbox: m.outbox,
                      program: m.program,
                      proofTrace: m.proofTrace,
                      state: m.state,
                      trace: m.trace,
                      scheduler: s2
                    };
                    return pure5(new Tuple(m$prime2, pNextPc));
                  });
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 635, column 9 - line 654, column 36): " + [v2.constructor.name]);
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "PROC_SEND requires a ProcessRef"));
            });
          });
        }
        ;
        if (inst instanceof PROC_RECEIVE) {
          var v = uncons(p.mailbox);
          if (v instanceof Nothing) {
            return pure5(new Tuple(m, {
              callStack: p.callStack,
              children: p.children,
              createdSequence: p.createdSequence,
              error: p.error,
              frame: p.frame,
              "function": p["function"],
              links: p.links,
              mailbox: p.mailbox,
              metadata: p.metadata,
              monitors: p.monitors,
              parent: p.parent,
              pid: p.pid,
              remoteLinks: p.remoteLinks,
              result: p.result,
              stepsExecuted: p.stepsExecuted,
              trapExit: p.trapExit,
              status: new ProcessWaiting(WaitingForMessage.value)
            }));
          }
          ;
          if (v instanceof Just) {
            return pure5(new Tuple(m, writeReg({
              pid: pNextPc.pid,
              status: pNextPc.status,
              "function": pNextPc["function"],
              frame: pNextPc.frame,
              callStack: pNextPc.callStack,
              links: pNextPc.links,
              remoteLinks: pNextPc.remoteLinks,
              monitors: pNextPc.monitors,
              parent: pNextPc.parent,
              children: pNextPc.children,
              trapExit: pNextPc.trapExit,
              metadata: pNextPc.metadata,
              result: pNextPc.result,
              error: pNextPc.error,
              createdSequence: pNextPc.createdSequence,
              stepsExecuted: pNextPc.stepsExecuted,
              mailbox: v.value0.tail
            })(inst.value0)(v.value0.head)));
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 658, column 5 - line 664, column 72): " + [v.constructor.name]);
        }
        ;
        if (inst instanceof PROC_RECEIVE_OPT) {
          var v = uncons(p.mailbox);
          if (v instanceof Nothing) {
            return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(Nothing.value))));
          }
          ;
          if (v instanceof Just) {
            return pure5(new Tuple(m, writeReg({
              pid: pNextPc.pid,
              status: pNextPc.status,
              "function": pNextPc["function"],
              frame: pNextPc.frame,
              callStack: pNextPc.callStack,
              links: pNextPc.links,
              remoteLinks: pNextPc.remoteLinks,
              monitors: pNextPc.monitors,
              parent: pNextPc.parent,
              children: pNextPc.children,
              trapExit: pNextPc.trapExit,
              metadata: pNextPc.metadata,
              result: pNextPc.result,
              error: pNextPc.error,
              createdSequence: pNextPc.createdSequence,
              stepsExecuted: pNextPc.stepsExecuted,
              mailbox: v.value0.tail
            })(inst.value0)(new VOption(new Just(v.value0.head)))));
          }
          ;
          throw new Error("Failed pattern match at FinVM.Interpreter (line 667, column 5 - line 669, column 110): " + [v.constructor.name]);
        }
        ;
        if (inst instanceof PROC_RECEIVE_MATCH) {
          return bind12(readReg(p)(inst.value1))(function(tagVal) {
            if (tagVal instanceof VString) {
              var v2 = findFirstVariantTag(tagVal.value0)(p.mailbox);
              if (v2 instanceof Nothing) {
                return pure5(new Tuple(m, {
                  callStack: p.callStack,
                  children: p.children,
                  createdSequence: p.createdSequence,
                  error: p.error,
                  frame: p.frame,
                  "function": p["function"],
                  links: p.links,
                  mailbox: p.mailbox,
                  metadata: p.metadata,
                  monitors: p.monitors,
                  parent: p.parent,
                  pid: p.pid,
                  remoteLinks: p.remoteLinks,
                  result: p.result,
                  stepsExecuted: p.stepsExecuted,
                  trapExit: p.trapExit,
                  status: new ProcessWaiting(new WaitingOnMatch(tagVal.value0))
                }));
              }
              ;
              if (v2 instanceof Just) {
                var mailbox$prime = fromMaybe(p.mailbox)(deleteAt(v2.value0.index)(p.mailbox));
                return pure5(new Tuple(m, writeReg({
                  pid: pNextPc.pid,
                  status: pNextPc.status,
                  "function": pNextPc["function"],
                  frame: pNextPc.frame,
                  callStack: pNextPc.callStack,
                  links: pNextPc.links,
                  remoteLinks: pNextPc.remoteLinks,
                  monitors: pNextPc.monitors,
                  parent: pNextPc.parent,
                  children: pNextPc.children,
                  trapExit: pNextPc.trapExit,
                  metadata: pNextPc.metadata,
                  result: pNextPc.result,
                  error: pNextPc.error,
                  createdSequence: pNextPc.createdSequence,
                  stepsExecuted: pNextPc.stepsExecuted,
                  mailbox: mailbox$prime
                })(inst.value0)(v2.value0.value)));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 674, column 22 - line 678, column 90): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_RECEIVE_MATCH requires tag register to be String"));
          });
        }
        ;
        if (inst instanceof PROC_RECEIVE_MATCH_OPT) {
          return bind12(readReg(p)(inst.value1))(function(tagVal) {
            if (tagVal instanceof VString) {
              var v2 = findFirstVariantTag(tagVal.value0)(p.mailbox);
              if (v2 instanceof Nothing) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(Nothing.value))));
              }
              ;
              if (v2 instanceof Just) {
                var mailbox$prime = fromMaybe(p.mailbox)(deleteAt(v2.value0.index)(p.mailbox));
                return pure5(new Tuple(m, writeReg({
                  pid: pNextPc.pid,
                  status: pNextPc.status,
                  "function": pNextPc["function"],
                  frame: pNextPc.frame,
                  callStack: pNextPc.callStack,
                  links: pNextPc.links,
                  remoteLinks: pNextPc.remoteLinks,
                  monitors: pNextPc.monitors,
                  parent: pNextPc.parent,
                  children: pNextPc.children,
                  trapExit: pNextPc.trapExit,
                  metadata: pNextPc.metadata,
                  result: pNextPc.result,
                  error: pNextPc.error,
                  createdSequence: pNextPc.createdSequence,
                  stepsExecuted: pNextPc.stepsExecuted,
                  mailbox: mailbox$prime
                })(inst.value0)(new VOption(new Just(v2.value0.value)))));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 684, column 22 - line 688, column 107): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_RECEIVE_MATCH_OPT requires tag register to be String"));
          });
        }
        ;
        if (inst instanceof PROC_YIELD) {
          return pure5(new Tuple(m, {
            callStack: pNextPc.callStack,
            children: pNextPc.children,
            createdSequence: pNextPc.createdSequence,
            error: pNextPc.error,
            frame: pNextPc.frame,
            "function": pNextPc["function"],
            links: pNextPc.links,
            mailbox: pNextPc.mailbox,
            metadata: pNextPc.metadata,
            monitors: pNextPc.monitors,
            parent: pNextPc.parent,
            pid: pNextPc.pid,
            remoteLinks: pNextPc.remoteLinks,
            result: pNextPc.result,
            stepsExecuted: pNextPc.stepsExecuted,
            trapExit: pNextPc.trapExit,
            status: ProcessReady.value
          }));
        }
        ;
        if (inst instanceof PROC_JOIN) {
          return bind12(readReg(p)(inst.value1))(function(vPid) {
            if (vPid instanceof VProcessRef) {
              var v2 = findProcess(m.scheduler)(vPid.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
              }
              ;
              if (v2 instanceof Just) {
                var v1 = processTerminalValue(v2.value0);
                if (v1 instanceof Just) {
                  return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VBool(true))));
                }
                ;
                if (v1 instanceof Nothing) {
                  return pure5(new Tuple(m, {
                    callStack: p.callStack,
                    children: p.children,
                    createdSequence: p.createdSequence,
                    error: p.error,
                    frame: p.frame,
                    "function": p["function"],
                    links: p.links,
                    mailbox: p.mailbox,
                    metadata: p.metadata,
                    monitors: p.monitors,
                    parent: p.parent,
                    pid: p.pid,
                    remoteLinks: p.remoteLinks,
                    result: p.result,
                    stepsExecuted: p.stepsExecuted,
                    trapExit: p.trapExit,
                    status: new ProcessWaiting(new WaitingForProcess(vPid.value0))
                  }));
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 698, column 25 - line 700, column 98): " + [v1.constructor.name]);
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 696, column 32 - line 700, column 98): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_JOIN requires a ProcessRef"));
          });
        }
        ;
        if (inst instanceof PROC_JOIN_RESULT) {
          return bind12(readReg(p)(inst.value1))(function(vPid) {
            if (vPid instanceof VProcessRef) {
              var v2 = findProcess(m.scheduler)(vPid.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
              }
              ;
              if (v2 instanceof Just) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(processTerminalValue(v2.value0)))));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 706, column 32 - line 708, column 103): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_JOIN_RESULT requires a ProcessRef"));
          });
        }
        ;
        if (inst instanceof PROC_CANCEL) {
          return bind12(readReg(p)(inst.value1))(function(vPid) {
            if (vPid instanceof VProcessRef) {
              var v2 = findProcess(m.scheduler)(vPid.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
              }
              ;
              if (v2 instanceof Just) {
                var cancelled = {
                  callStack: v2.value0.callStack,
                  children: v2.value0.children,
                  createdSequence: v2.value0.createdSequence,
                  error: v2.value0.error,
                  frame: v2.value0.frame,
                  "function": v2["value0"]["function"],
                  links: v2.value0.links,
                  mailbox: v2.value0.mailbox,
                  metadata: v2.value0.metadata,
                  monitors: v2.value0.monitors,
                  parent: v2.value0.parent,
                  pid: v2.value0.pid,
                  remoteLinks: v2.value0.remoteLinks,
                  result: v2.value0.result,
                  stepsExecuted: v2.value0.stepsExecuted,
                  trapExit: v2.value0.trapExit,
                  status: new ProcessCancelled2(new CancelReason("cancelled"))
                };
                var m$prime2 = {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  outbox: m.outbox,
                  program: m.program,
                  proofTrace: m.proofTrace,
                  state: m.state,
                  trace: m.trace,
                  scheduler: updateProcess(m.scheduler)(cancelled)
                };
                return pure5(new Tuple(m$prime2, writeReg(pNextPc)(inst.value0)(new VBool(true))));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 714, column 32 - line 719, column 65): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_CANCEL requires a ProcessRef"));
          });
        }
        ;
        if (inst instanceof PROC_EXIT) {
          return bind12(readReg(p)(inst.value0))(function(reason) {
            return pure5(new Tuple(m, {
              callStack: p.callStack,
              children: p.children,
              createdSequence: p.createdSequence,
              error: p.error,
              frame: p.frame,
              "function": p["function"],
              links: p.links,
              mailbox: p.mailbox,
              metadata: p.metadata,
              monitors: p.monitors,
              parent: p.parent,
              pid: p.pid,
              remoteLinks: p.remoteLinks,
              result: p.result,
              stepsExecuted: p.stepsExecuted,
              trapExit: p.trapExit,
              status: new ProcessExited(new ExitReason(show53(reason)))
            }));
          });
        }
        ;
        if (inst instanceof PROC_LINK) {
          return bind12(readReg(p)(inst.value0))(function(vPid) {
            if (vPid instanceof VProcessRef) {
              var v2 = findProcess(m.scheduler)(vPid.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
              }
              ;
              if (v2 instanceof Just) {
                var targetP$prime = {
                  callStack: v2.value0.callStack,
                  children: v2.value0.children,
                  createdSequence: v2.value0.createdSequence,
                  error: v2.value0.error,
                  frame: v2.value0.frame,
                  "function": v2["value0"]["function"],
                  mailbox: v2.value0.mailbox,
                  metadata: v2.value0.metadata,
                  monitors: v2.value0.monitors,
                  parent: v2.value0.parent,
                  pid: v2.value0.pid,
                  remoteLinks: v2.value0.remoteLinks,
                  result: v2.value0.result,
                  status: v2.value0.status,
                  stepsExecuted: v2.value0.stepsExecuted,
                  trapExit: v2.value0.trapExit,
                  links: insert22(p.pid)(v2.value0.links)
                };
                var p$prime2 = {
                  callStack: pNextPc.callStack,
                  children: pNextPc.children,
                  createdSequence: pNextPc.createdSequence,
                  error: pNextPc.error,
                  frame: pNextPc.frame,
                  "function": pNextPc["function"],
                  mailbox: pNextPc.mailbox,
                  metadata: pNextPc.metadata,
                  monitors: pNextPc.monitors,
                  parent: pNextPc.parent,
                  pid: pNextPc.pid,
                  remoteLinks: pNextPc.remoteLinks,
                  result: pNextPc.result,
                  status: pNextPc.status,
                  stepsExecuted: pNextPc.stepsExecuted,
                  trapExit: pNextPc.trapExit,
                  links: insert22(vPid.value0)(p.links)
                };
                var m$prime2 = {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  outbox: m.outbox,
                  program: m.program,
                  proofTrace: m.proofTrace,
                  state: m.state,
                  trace: m.trace,
                  scheduler: updateProcess(m.scheduler)(targetP$prime)
                };
                return pure5(new Tuple(m$prime2, p$prime2));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 729, column 32 - line 736, column 32): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_LINK requires a ProcessRef"));
          });
        }
        ;
        if (inst instanceof PROC_UNLINK) {
          return bind12(readReg(p)(inst.value0))(function(vPid) {
            if (vPid instanceof VProcessRef) {
              var v2 = findProcess(m.scheduler)(vPid.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
              }
              ;
              if (v2 instanceof Just) {
                var targetP$prime = {
                  callStack: v2.value0.callStack,
                  children: v2.value0.children,
                  createdSequence: v2.value0.createdSequence,
                  error: v2.value0.error,
                  frame: v2.value0.frame,
                  "function": v2["value0"]["function"],
                  mailbox: v2.value0.mailbox,
                  metadata: v2.value0.metadata,
                  monitors: v2.value0.monitors,
                  parent: v2.value0.parent,
                  pid: v2.value0.pid,
                  remoteLinks: v2.value0.remoteLinks,
                  result: v2.value0.result,
                  status: v2.value0.status,
                  stepsExecuted: v2.value0.stepsExecuted,
                  trapExit: v2.value0.trapExit,
                  links: delete2(p.pid)(v2.value0.links)
                };
                var p$prime2 = {
                  callStack: pNextPc.callStack,
                  children: pNextPc.children,
                  createdSequence: pNextPc.createdSequence,
                  error: pNextPc.error,
                  frame: pNextPc.frame,
                  "function": pNextPc["function"],
                  mailbox: pNextPc.mailbox,
                  metadata: pNextPc.metadata,
                  monitors: pNextPc.monitors,
                  parent: pNextPc.parent,
                  pid: pNextPc.pid,
                  remoteLinks: pNextPc.remoteLinks,
                  result: pNextPc.result,
                  status: pNextPc.status,
                  stepsExecuted: pNextPc.stepsExecuted,
                  trapExit: pNextPc.trapExit,
                  links: delete2(vPid.value0)(p.links)
                };
                var m$prime2 = {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  outbox: m.outbox,
                  program: m.program,
                  proofTrace: m.proofTrace,
                  state: m.state,
                  trace: m.trace,
                  scheduler: updateProcess(m.scheduler)(targetP$prime)
                };
                return pure5(new Tuple(m$prime2, p$prime2));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 742, column 32 - line 749, column 32): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_UNLINK requires a ProcessRef"));
          });
        }
        ;
        if (inst instanceof PROC_MONITOR) {
          return bind12(readReg(p)(inst.value1))(function(vPid) {
            if (vPid instanceof VProcessRef) {
              var v2 = findProcess(m.scheduler)(vPid.value0);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(ProcessNotFound.value, "Process " + (vPid.value0 + " not found")));
              }
              ;
              if (v2 instanceof Just) {
                var ref = "mon" + (show18(m.counters.steps) + (":" + vPid.value0));
                return pure5(new Tuple(m, writeReg({
                  pid: pNextPc.pid,
                  status: pNextPc.status,
                  "function": pNextPc["function"],
                  frame: pNextPc.frame,
                  callStack: pNextPc.callStack,
                  mailbox: pNextPc.mailbox,
                  links: pNextPc.links,
                  remoteLinks: pNextPc.remoteLinks,
                  parent: pNextPc.parent,
                  children: pNextPc.children,
                  trapExit: pNextPc.trapExit,
                  metadata: pNextPc.metadata,
                  result: pNextPc.result,
                  error: pNextPc.error,
                  createdSequence: pNextPc.createdSequence,
                  stepsExecuted: pNextPc.stepsExecuted,
                  monitors: insert4(ref)(new MonitorLocal(vPid.value0))(p.monitors)
                })(inst.value0)(new VString(ref))));
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 755, column 32 - line 759, column 146): " + [v2.constructor.name]);
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_MONITOR requires a ProcessRef"));
          });
        }
        ;
        if (inst instanceof PROC_DEMONITOR) {
          return bind12(readReg(p)(inst.value0))(function(ref) {
            if (ref instanceof VString) {
              return pure5(new Tuple(m, {
                callStack: pNextPc.callStack,
                children: pNextPc.children,
                createdSequence: pNextPc.createdSequence,
                error: pNextPc.error,
                frame: pNextPc.frame,
                "function": pNextPc["function"],
                links: pNextPc.links,
                mailbox: pNextPc.mailbox,
                metadata: pNextPc.metadata,
                parent: pNextPc.parent,
                pid: pNextPc.pid,
                remoteLinks: pNextPc.remoteLinks,
                result: pNextPc.result,
                status: pNextPc.status,
                stepsExecuted: pNextPc.stepsExecuted,
                trapExit: pNextPc.trapExit,
                monitors: $$delete3(ref.value0)(p.monitors)
              }));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "PROC_DEMONITOR requires a String monitor reference"));
          });
        }
        ;
        if (inst instanceof PROC_TRAP_EXIT) {
          return pure5(new Tuple(m, {
            callStack: pNextPc.callStack,
            children: pNextPc.children,
            createdSequence: pNextPc.createdSequence,
            error: pNextPc.error,
            frame: pNextPc.frame,
            "function": pNextPc["function"],
            links: pNextPc.links,
            mailbox: pNextPc.mailbox,
            metadata: pNextPc.metadata,
            monitors: pNextPc.monitors,
            parent: pNextPc.parent,
            pid: pNextPc.pid,
            remoteLinks: pNextPc.remoteLinks,
            result: pNextPc.result,
            status: pNextPc.status,
            stepsExecuted: pNextPc.stepsExecuted,
            trapExit: inst.value0
          }));
        }
        ;
        if (inst instanceof PROC_SLEEP_TICKS) {
          var $867 = inst.value0 <= 0;
          if ($867) {
            return pure5(new Tuple(m, pNextPc));
          }
          ;
          return pure5(new Tuple(m, {
            callStack: pNextPc.callStack,
            children: pNextPc.children,
            createdSequence: pNextPc.createdSequence,
            error: pNextPc.error,
            frame: pNextPc.frame,
            "function": pNextPc["function"],
            links: pNextPc.links,
            mailbox: pNextPc.mailbox,
            metadata: pNextPc.metadata,
            monitors: pNextPc.monitors,
            parent: pNextPc.parent,
            pid: pNextPc.pid,
            remoteLinks: pNextPc.remoteLinks,
            result: pNextPc.result,
            stepsExecuted: pNextPc.stepsExecuted,
            trapExit: pNextPc.trapExit,
            status: new ProcessWaiting(new WaitingForTick(m.scheduler.logicalTick + inst.value0 | 0))
          }));
        }
        ;
        if (inst instanceof NODE_SELF) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString("local"))));
        }
        ;
        if (inst instanceof NODE_STATUS) {
          return bind12(readReg(p)(inst.value1))(function(node) {
            if (node instanceof VString) {
              var status = (function() {
                var $871 = node.value0 === "local";
                if ($871) {
                  return "online";
                }
                ;
                return nodeStatusOf(m)(node.value0);
              })();
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(status))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_STATUS requires a node String"));
          });
        }
        ;
        if (inst instanceof NODE_KNOWN) {
          return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VList(fromArray(map14(VString.create)(knownNodes(m)))))));
        }
        ;
        if (inst instanceof REMOTE_PID_NEW) {
          return bind12(readReg(p)(inst.value1))(function(vNode) {
            return bind12(readReg(p)(inst.value2))(function(vPid) {
              if (vNode instanceof VString && vPid instanceof VString) {
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VRemoteProcessRef({
                  node: vNode.value0,
                  pid: vPid.value0
                }))));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "REMOTE_PID_NEW requires Strings for node and pid"));
            });
          });
        }
        ;
        if (inst instanceof REMOTE_PID_NODE) {
          return bind12(readReg(p)(inst.value1))(function(vPid) {
            if (vPid instanceof VRemoteProcessRef) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(vPid.value0.node))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "REMOTE_PID_NODE requires a RemoteProcessRef"));
          });
        }
        ;
        if (inst instanceof REMOTE_PID_LOCAL) {
          return bind12(readReg(p)(inst.value1))(function(vPid) {
            if (vPid instanceof VRemoteProcessRef) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(vPid.value0.pid))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "REMOTE_PID_LOCAL requires a RemoteProcessRef"));
          });
        }
        ;
        if (inst instanceof NODE_SEND) {
          return bind12(readReg(p)(inst.value0))(function(vPid) {
            return bind12(readReg(p)(inst.value1))(function(vMsg) {
              if (vPid instanceof VRemoteProcessRef) {
                var intent = {
                  type_: "RemoteSendIntent",
                  payload: new VRecord(fromFoldable7([new Tuple("node", new VString(vPid.value0.node)), new Tuple("pid", new VString(vPid.value0.pid)), new Tuple("message", vMsg)]))
                };
                var m$prime2 = {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  program: m.program,
                  proofTrace: m.proofTrace,
                  scheduler: m.scheduler,
                  state: m.state,
                  trace: m.trace,
                  outbox: new Cons(intent, m.outbox)
                };
                return pure5(new Tuple(m$prime2, pNextPc));
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "NODE_SEND requires a RemoteProcessRef"));
            });
          });
        }
        ;
        if (inst instanceof NODE_SPAWN) {
          return bind12(readReg(p)(inst.value1))(function(vNode) {
            return bind12(traverse3(readReg(p))(inst.value3))(function(argVals) {
              if (vNode instanceof VString) {
                return bind12((function() {
                  var v2 = lookup5(inst.value2)(m.program.functions);
                  if (v2 instanceof Nothing) {
                    return new Left(new VMError(UnknownFunction.value, "Unknown function: " + inst.value2));
                  }
                  ;
                  if (v2 instanceof Just) {
                    return pure5(v2.value0);
                  }
                  ;
                  throw new Error("Failed pattern match at FinVM.Interpreter (line 826, column 14 - line 828, column 27): " + [v2.constructor.name]);
                })())(function() {
                  var requestId = "spawn:" + (p.pid + (":" + show18(m.counters.steps)));
                  var remotePid = "remote:" + (vNode.value0 + (":" + (inst.value2 + (":" + show18(m.counters.steps)))));
                  var intent = {
                    type_: "RemoteSpawnIntent",
                    payload: new VRecord(fromFoldable7([new Tuple("node", new VString(vNode.value0)), new Tuple("function", new VString(inst.value2)), new Tuple("args", new VList(fromArray(argVals))), new Tuple("pid", new VString(remotePid)), new Tuple("requestId", new VString(requestId)), new Tuple("requesterPid", new VString(p.pid))]))
                  };
                  var m$prime2 = {
                    config: m.config,
                    counters: m.counters,
                    events: m.events,
                    input: m.input,
                    labelCache: m.labelCache,
                    program: m.program,
                    proofTrace: m.proofTrace,
                    scheduler: m.scheduler,
                    state: m.state,
                    trace: m.trace,
                    outbox: new Cons(intent, m.outbox)
                  };
                  return pure5(new Tuple(m$prime2, writeReg(pNextPc)(inst.value0)(new VRemoteProcessRef({
                    node: vNode.value0,
                    pid: remotePid
                  }))));
                });
              }
              ;
              return new Left(new VMError(TypeMismatch.value, "NODE_SPAWN requires a node String"));
            });
          });
        }
        ;
        if (inst instanceof NODE_LINK) {
          return bind12(readReg(p)(inst.value0))(function(remotePid) {
            if (remotePid instanceof VRemoteProcessRef) {
              var p$prime2 = {
                callStack: pNextPc.callStack,
                children: pNextPc.children,
                createdSequence: pNextPc.createdSequence,
                error: pNextPc.error,
                frame: pNextPc.frame,
                "function": pNextPc["function"],
                links: pNextPc.links,
                mailbox: pNextPc.mailbox,
                metadata: pNextPc.metadata,
                monitors: pNextPc.monitors,
                parent: pNextPc.parent,
                pid: pNextPc.pid,
                result: pNextPc.result,
                status: pNextPc.status,
                stepsExecuted: pNextPc.stepsExecuted,
                trapExit: pNextPc.trapExit,
                remoteLinks: insert32(remotePid.value0)(p.remoteLinks)
              };
              var intent = {
                type_: "RemoteLinkIntent",
                payload: new VRecord(fromFoldable7([new Tuple("pid", new VString(p.pid)), new Tuple("node", new VString(remotePid.value0.node)), new Tuple("remotePid", new VString(remotePid.value0.pid))]))
              };
              var m$prime2 = {
                config: m.config,
                counters: m.counters,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                program: m.program,
                proofTrace: m.proofTrace,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                outbox: new Cons(intent, m.outbox)
              };
              return pure5(new Tuple(m$prime2, p$prime2));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_LINK requires a RemoteProcessRef"));
          });
        }
        ;
        if (inst instanceof NODE_UNLINK) {
          return bind12(readReg(p)(inst.value0))(function(remotePid) {
            if (remotePid instanceof VRemoteProcessRef) {
              var p$prime2 = {
                callStack: pNextPc.callStack,
                children: pNextPc.children,
                createdSequence: pNextPc.createdSequence,
                error: pNextPc.error,
                frame: pNextPc.frame,
                "function": pNextPc["function"],
                links: pNextPc.links,
                mailbox: pNextPc.mailbox,
                metadata: pNextPc.metadata,
                monitors: pNextPc.monitors,
                parent: pNextPc.parent,
                pid: pNextPc.pid,
                result: pNextPc.result,
                status: pNextPc.status,
                stepsExecuted: pNextPc.stepsExecuted,
                trapExit: pNextPc.trapExit,
                remoteLinks: delete3(remotePid.value0)(p.remoteLinks)
              };
              var intent = {
                type_: "RemoteUnlinkIntent",
                payload: new VRecord(fromFoldable7([new Tuple("pid", new VString(p.pid)), new Tuple("node", new VString(remotePid.value0.node)), new Tuple("remotePid", new VString(remotePid.value0.pid))]))
              };
              var m$prime2 = {
                config: m.config,
                counters: m.counters,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                program: m.program,
                proofTrace: m.proofTrace,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                outbox: new Cons(intent, m.outbox)
              };
              return pure5(new Tuple(m$prime2, p$prime2));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_UNLINK requires a RemoteProcessRef"));
          });
        }
        ;
        if (inst instanceof NODE_MONITOR) {
          return bind12(readReg(p)(inst.value1))(function(remotePid) {
            if (remotePid instanceof VRemoteProcessRef) {
              var ref = "rmon" + (show18(m.counters.steps) + (":" + remotePid.value0.pid));
              var p$prime2 = {
                callStack: pNextPc.callStack,
                children: pNextPc.children,
                createdSequence: pNextPc.createdSequence,
                error: pNextPc.error,
                frame: pNextPc.frame,
                "function": pNextPc["function"],
                links: pNextPc.links,
                mailbox: pNextPc.mailbox,
                metadata: pNextPc.metadata,
                parent: pNextPc.parent,
                pid: pNextPc.pid,
                remoteLinks: pNextPc.remoteLinks,
                result: pNextPc.result,
                status: pNextPc.status,
                stepsExecuted: pNextPc.stepsExecuted,
                trapExit: pNextPc.trapExit,
                monitors: insert4(ref)(new MonitorRemote({
                  node: remotePid.value0.node,
                  pid: remotePid.value0.pid
                }))(p.monitors)
              };
              var intent = {
                type_: "RemoteMonitorIntent",
                payload: new VRecord(fromFoldable7([new Tuple("pid", new VString(p.pid)), new Tuple("ref", new VString(ref)), new Tuple("node", new VString(remotePid.value0.node)), new Tuple("remotePid", new VString(remotePid.value0.pid))]))
              };
              var m$prime2 = {
                config: m.config,
                counters: m.counters,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                program: m.program,
                proofTrace: m.proofTrace,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                outbox: new Cons(intent, m.outbox)
              };
              return pure5(new Tuple(m$prime2, writeReg(p$prime2)(inst.value0)(new VString(ref))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_MONITOR requires a RemoteProcessRef"));
          });
        }
        ;
        if (inst instanceof NODE_DEMONITOR) {
          return bind12(readReg(p)(inst.value0))(function(ref) {
            if (ref instanceof VString) {
              var previousTarget = lookup5(ref.value0)(p.monitors);
              var p$prime2 = {
                callStack: pNextPc.callStack,
                children: pNextPc.children,
                createdSequence: pNextPc.createdSequence,
                error: pNextPc.error,
                frame: pNextPc.frame,
                "function": pNextPc["function"],
                links: pNextPc.links,
                mailbox: pNextPc.mailbox,
                metadata: pNextPc.metadata,
                parent: pNextPc.parent,
                pid: pNextPc.pid,
                remoteLinks: pNextPc.remoteLinks,
                result: pNextPc.result,
                status: pNextPc.status,
                stepsExecuted: pNextPc.stepsExecuted,
                trapExit: pNextPc.trapExit,
                monitors: $$delete3(ref.value0)(p.monitors)
              };
              if (previousTarget instanceof Just && previousTarget.value0 instanceof MonitorRemote) {
                var intent = {
                  type_: "RemoteDemonitorIntent",
                  payload: new VRecord(fromFoldable7([new Tuple("pid", new VString(p.pid)), new Tuple("ref", new VString(ref.value0)), new Tuple("node", new VString(previousTarget.value0.value0.node)), new Tuple("remotePid", new VString(previousTarget.value0.value0.pid))]))
                };
                var m$prime2 = {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  program: m.program,
                  proofTrace: m.proofTrace,
                  scheduler: m.scheduler,
                  state: m.state,
                  trace: m.trace,
                  outbox: new Cons(intent, m.outbox)
                };
                return pure5(new Tuple(m$prime2, p$prime2));
              }
              ;
              if (previousTarget instanceof Nothing) {
                return pure5(new Tuple(m, p$prime2));
              }
              ;
              return pure5(new Tuple(m, p$prime2));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_DEMONITOR requires a String monitor reference"));
          });
        }
        ;
        if (inst instanceof NODE_OBSERVE_STATE) {
          return bind12(readReg(p)(inst.value1))(function(node) {
            if (node instanceof VString) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VEffectIntent({
                type_: "NodeObserveStateIntent",
                payload: new VString(node.value0)
              }))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_OBSERVE_STATE requires a node String"));
          });
        }
        ;
        if (inst instanceof NODE_LAST_STATE_HASH) {
          return bind12(readReg(p)(inst.value1))(function(node) {
            if (node instanceof VString && node.value0 === "local") {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(createSnapshot(m)))));
            }
            ;
            if (node instanceof VString) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(map23(VString.create)(nodeLastStateHash(m)(node.value0))))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_LAST_STATE_HASH requires a node String"));
          });
        }
        ;
        if (inst instanceof NODE_LAST_SEEN_TICK) {
          return bind12(readReg(p)(inst.value1))(function(node) {
            if (node instanceof VString && node.value0 === "local") {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VInt(fromInt(m.scheduler.logicalTick)))));
            }
            ;
            if (node instanceof VString) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VOption(map23(function($1020) {
                return VInt.create(fromInt($1020));
              })(nodeLastSeenTick(m)(node.value0))))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_LAST_SEEN_TICK requires a node String"));
          });
        }
        ;
        if (inst instanceof NODE_QUERY_STATE) {
          return bind12(readReg(p)(inst.value1))(function(node) {
            if (node instanceof VString) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VEffectIntent({
                type_: "NodeQueryStateIntent",
                payload: new VString(node.value0)
              }))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "NODE_QUERY_STATE requires a node String"));
          });
        }
        ;
        if (inst instanceof MACHINE_NEW) {
          return bind12(readReg(p)(inst.value2))(function(vData) {
            if (vData instanceof VRecord) {
              return bind12((function() {
                var v2 = lookup5(inst.value1)(m.program.stateMachines);
                if (v2 instanceof Nothing) {
                  return new Left(new VMError(InvalidInstruction.value, "State machine " + (inst.value1 + " not found")));
                }
                ;
                if (v2 instanceof Just) {
                  return pure5(v2.value0);
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 954, column 15 - line 956, column 27): " + [v2.constructor.name]);
              })())(function(sm) {
                var mi = {
                  machineId: inst.value1,
                  instanceId: "mi" + show18(m.counters.steps),
                  currentState: sm.initialState,
                  data_: vData.value0,
                  version: 1,
                  historyHash: ""
                };
                return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VStateMachineInstance(mi))));
              });
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "MACHINE_NEW requires a Record for initial data"));
          });
        }
        ;
        if (inst instanceof MACHINE_STATE) {
          return bind12(readReg(p)(inst.value1))(function(vMI) {
            if (vMI instanceof VStateMachineInstance) {
              return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(new VString(vMI.value0.currentState))));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "MACHINE_STATE requires a StateMachineInstance"));
          });
        }
        ;
        if (inst instanceof MACHINE_TRANSITION) {
          return bind12(readReg(p)(inst.value1))(function(vMI) {
            if (vMI instanceof VStateMachineInstance) {
              return bind12((function() {
                var v2 = lookup5(vMI.value0.machineId)(m.program.stateMachines);
                if (v2 instanceof Nothing) {
                  return new Left(new VMError(InvalidInstruction.value, "State machine " + (vMI.value0.machineId + " not found")));
                }
                ;
                if (v2 instanceof Just) {
                  return pure5(v2.value0);
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 978, column 15 - line 980, column 27): " + [v2.constructor.name]);
              })())(function(sm) {
                var matches = filter(function(t) {
                  return elem3(vMI.value0.currentState)(t.from) && t.event === inst.value2;
                })(sm.transitions);
                return bind12(selectTransition(vMI.value0.currentState)(inst.value2)(matches))(function(t) {
                  return bind12((function() {
                    if (t.guard instanceof Nothing) {
                      return pure5(new Tuple(m, true));
                    }
                    ;
                    if (t.guard instanceof Just) {
                      return bind12(runFunctionValue(m)(p.pid)(t.guard.value0)([new VStateMachineInstance(vMI.value0)]))(function(v2) {
                        if (v2.value1 instanceof VBool) {
                          return pure5(new Tuple(v2.value0, v2.value1.value0));
                        }
                        ;
                        return new Left(new VMError(TypeMismatch.value, "State-machine guard must return Boolean"));
                      });
                    }
                    ;
                    throw new Error("Failed pattern match at FinVM.Interpreter (line 983, column 38 - line 989, column 89): " + [t.guard.constructor.name]);
                  })())(function(v2) {
                    return discard2((function() {
                      var $964 = !v2.value1;
                      if ($964) {
                        return new Left(new VMError(GuardRejected.value, "Guard rejected transition " + t.name));
                      }
                      ;
                      return pure5(unit);
                    })())(function() {
                      return bind12((function() {
                        if (t.to instanceof StaticState) {
                          return pure5(new Tuple(v2.value0, t.to.value0));
                        }
                        ;
                        if (t.to instanceof Stay) {
                          return pure5(new Tuple(v2.value0, vMI.value0.currentState));
                        }
                        ;
                        if (t.to instanceof ComputedState) {
                          return bind12(runFunctionValue(v2.value0)(p.pid)(t.to.value0)([new VStateMachineInstance(vMI.value0)]))(function(v1) {
                            if (v1.value1 instanceof VString) {
                              return pure5(new Tuple(v1.value0, v1.value1.value0));
                            }
                            ;
                            return new Left(new VMError(TypeMismatch.value, "Computed state target must return String"));
                          });
                        }
                        ;
                        throw new Error("Failed pattern match at FinVM.Interpreter (line 993, column 41 - line 1000, column 90): " + [t.to.constructor.name]);
                      })())(function(v1) {
                        var miTransitioned = {
                          data_: vMI.value0.data_,
                          instanceId: vMI.value0.instanceId,
                          machineId: vMI.value0.machineId,
                          currentState: v1.value1,
                          version: vMI.value0.version + 1 | 0,
                          historyHash: hashValue(new VRecord(fromFoldable7([new Tuple("machineId", new VString(vMI.value0.machineId)), new Tuple("from", new VString(vMI.value0.currentState)), new Tuple("event", new VString(inst.value2)), new Tuple("to", new VString(v1.value1)), new Tuple("version", new VInt(fromInt(vMI.value0.version + 1 | 0)))])))
                        };
                        return bind12(runTransitionAction(v1.value0)(p.pid)(t.action)(miTransitioned))(function(v22) {
                          return pure5(new Tuple(v22.value0, writeReg(pNextPc)(inst.value0)(new VStateMachineInstance(v22.value1))));
                        });
                      });
                    });
                  });
                });
              });
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "MACHINE_TRANSITION requires a StateMachineInstance"));
          });
        }
        ;
        if (inst instanceof CALL_BUILTIN) {
          var parts = split("@")(inst.value1);
          if (parts.length === 2) {
            return bind12((function() {
              var v2 = fromString(parts[1]);
              if (v2 instanceof Nothing) {
                return new Left(new VMError(InvalidInstruction.value, "Invalid builtin version: " + parts[1]));
              }
              ;
              if (v2 instanceof Just) {
                return pure5(v2.value0);
              }
              ;
              throw new Error("Failed pattern match at FinVM.Interpreter (line 1021, column 20 - line 1023, column 27): " + [v2.constructor.name]);
            })())(function(version) {
              return bind12(traverse3(readReg(p))(inst.value2))(function(argVals) {
                var v2 = runStatefulBuiltin(m)(parts[0])(version)(argVals);
                if (v2 instanceof Just) {
                  return bind12(v2.value0)(function(v1) {
                    return pure5(new Tuple(v1.value0, writeReg(pNextPc)(inst.value0)(v1.value1)));
                  });
                }
                ;
                if (v2 instanceof Nothing) {
                  return bind12(lookupBuiltin(m.config)(parts[0])(version))(function(builtinFn) {
                    return bind12(builtinFn(argVals))(function(res) {
                      return pure5(new Tuple(m, writeReg(pNextPc)(inst.value0)(res)));
                    });
                  });
                }
                ;
                throw new Error("Failed pattern match at FinVM.Interpreter (line 1025, column 9 - line 1032, column 54): " + [v2.constructor.name]);
              });
            });
          }
          ;
          return new Left(new VMError(InvalidInstruction.value, "Invalid builtin spec: " + inst.value1));
        }
        ;
        if (inst instanceof ASSERT) {
          return bind12(readReg(p)(inst.value0))(function(vCond) {
            if (vCond instanceof VBool) {
              var m$prime2 = (function() {
                if (m.config.performanceMode) {
                  return m;
                }
                ;
                return {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  outbox: m.outbox,
                  program: m.program,
                  scheduler: m.scheduler,
                  state: m.state,
                  trace: m.trace,
                  proofTrace: new Cons(new ProofAssertion(vCond.value0, inst.value1), m.proofTrace)
                };
              })();
              if (vCond.value0) {
                return pure5(new Tuple(m$prime2, pNextPc));
              }
              ;
              return new Left(new VMError(ProofAssertionFailed.value, "Assertion failed with code " + show18(inst.value1)));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "ASSERT requires a Boolean register"));
          });
        }
        ;
        if (inst instanceof INVARIANT_CHECK) {
          return bind12((function() {
            var v2 = lookup5(inst.value0)(m.program.functions);
            if (v2 instanceof Nothing) {
              return new Left(new VMError(UnknownFunction.value, "Invariant function not found: " + inst.value0));
            }
            ;
            if (v2 instanceof Just) {
              return pure5(v2.value0);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Interpreter (line 1049, column 10 - line 1051, column 23): " + [v2.constructor.name]);
          })())(function() {
            var m$prime2 = (function() {
              if (m.config.performanceMode) {
                return m;
              }
              ;
              return {
                config: m.config,
                counters: m.counters,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                outbox: m.outbox,
                program: m.program,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                proofTrace: new Cons(new ProofInvariantChecked(inst.value0, true), m.proofTrace)
              };
            })();
            return pure5(new Tuple(m$prime2, pNextPc));
          });
        }
        ;
        if (inst instanceof ASSUME) {
          return bind12(readReg(p)(inst.value0))(function(vCond) {
            if (vCond instanceof VBool) {
              var m$prime2 = (function() {
                if (m.config.performanceMode) {
                  return m;
                }
                ;
                return {
                  config: m.config,
                  counters: m.counters,
                  events: m.events,
                  input: m.input,
                  labelCache: m.labelCache,
                  outbox: m.outbox,
                  program: m.program,
                  scheduler: m.scheduler,
                  state: m.state,
                  trace: m.trace,
                  proofTrace: new Cons(new ProofAssumption(inst.value1), m.proofTrace)
                };
              })();
              return pure5(new Tuple(m$prime2, pNextPc));
            }
            ;
            return new Left(new VMError(TypeMismatch.value, "ASSUME requires a Boolean register"));
          });
        }
        ;
        if (inst instanceof PROOF_MARK) {
          return bind12(readReg(p)(inst.value1))(function(val) {
            var m$prime2 = (function() {
              if (m.config.performanceMode) {
                return m;
              }
              ;
              return {
                config: m.config,
                counters: m.counters,
                events: m.events,
                input: m.input,
                labelCache: m.labelCache,
                outbox: m.outbox,
                program: m.program,
                scheduler: m.scheduler,
                state: m.state,
                trace: m.trace,
                proofTrace: new Cons(new ProofValueMarked(inst.value0, val), m.proofTrace)
              };
            })();
            return pure5(new Tuple(m$prime2, pNextPc));
          });
        }
        ;
        if (inst instanceof PROOF_SCOPE_BEGIN) {
          var m$prime = (function() {
            if (m.config.performanceMode) {
              return m;
            }
            ;
            return {
              config: m.config,
              counters: m.counters,
              events: m.events,
              input: m.input,
              labelCache: m.labelCache,
              outbox: m.outbox,
              program: m.program,
              scheduler: m.scheduler,
              state: m.state,
              trace: m.trace,
              proofTrace: new Cons(new ProofScopeBegin(inst.value0), m.proofTrace)
            };
          })();
          return pure5(new Tuple(m$prime, pNextPc));
        }
        ;
        if (inst instanceof PROOF_SCOPE_END) {
          var m$prime = (function() {
            if (m.config.performanceMode) {
              return m;
            }
            ;
            return {
              config: m.config,
              counters: m.counters,
              events: m.events,
              input: m.input,
              labelCache: m.labelCache,
              outbox: m.outbox,
              program: m.program,
              scheduler: m.scheduler,
              state: m.state,
              trace: m.trace,
              proofTrace: new Cons(new ProofScopeEnd(inst.value0), m.proofTrace)
            };
          })();
          return pure5(new Tuple(m$prime, pNextPc));
        }
        ;
        throw new Error("Failed pattern match at FinVM.Interpreter (line 70, column 6 - line 1081, column 28): " + [inst.constructor.name]);
      };
    };
  };
};

// output/FinVM.Eval/index.js
var foldl5 = /* @__PURE__ */ foldl(foldableList);
var minimum2 = /* @__PURE__ */ minimum(ordInt)(foldableList);
var notEq5 = /* @__PURE__ */ notEq(eqProcessStatus);
var pure6 = /* @__PURE__ */ pure(applicativeEither);
var bind6 = /* @__PURE__ */ bind(bindEither);
var lookup6 = /* @__PURE__ */ lookup2(ordString);
var fromFoldable8 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
var toUnfoldable10 = /* @__PURE__ */ toUnfoldable5(unfoldableArray);
var filter4 = /* @__PURE__ */ filter2(ordString);
var map11 = /* @__PURE__ */ map(functorArray);
var append4 = /* @__PURE__ */ append(semigroupArray);
var tailRecM3 = /* @__PURE__ */ tailRecM(monadRecEither);
var any4 = /* @__PURE__ */ any(foldableList)(heytingAlgebraBoolean);
var wakeProcessWaiters = function(completedPid) {
  return function(m) {
    var wakeOne = function(scheduler) {
      return function(p) {
        if (p.status instanceof ProcessWaiting && (p.status.value0 instanceof WaitingForProcess && p.status.value0.value0 === completedPid)) {
          return yieldProcess(updateProcess(scheduler)({
            pid: p.pid,
            "function": p["function"],
            frame: p.frame,
            callStack: p.callStack,
            mailbox: p.mailbox,
            links: p.links,
            remoteLinks: p.remoteLinks,
            monitors: p.monitors,
            parent: p.parent,
            children: p.children,
            trapExit: p.trapExit,
            metadata: p.metadata,
            result: p.result,
            error: p.error,
            createdSequence: p.createdSequence,
            stepsExecuted: p.stepsExecuted,
            status: ProcessReady.value
          }))(p.pid);
        }
        ;
        return scheduler;
      };
    };
    var processes = values(m.scheduler.processes);
    return {
      program: m.program,
      state: m.state,
      input: m.input,
      config: m.config,
      trace: m.trace,
      proofTrace: m.proofTrace,
      outbox: m.outbox,
      events: m.events,
      counters: m.counters,
      labelCache: m.labelCache,
      scheduler: foldl5(wakeOne)(m.scheduler)(processes)
    };
  };
};
var waitingTick = function(p) {
  if (p.status instanceof ProcessWaiting && p.status.value0 instanceof WaitingForTick) {
    return new Just(p.status.value0.value0);
  }
  ;
  return Nothing.value;
};
var wakeNextTick = function(m) {
  var processes = values(m.scheduler.processes);
  var waitingTicks = mapMaybe2(waitingTick)(processes);
  var v = minimum2(waitingTicks);
  if (v instanceof Nothing) {
    return Nothing.value;
  }
  ;
  if (v instanceof Just) {
    var wakeOne = function(scheduler) {
      return function(p) {
        if (p.status instanceof ProcessWaiting && (p.status.value0 instanceof WaitingForTick && p.status.value0.value0 <= v.value0)) {
          return yieldProcess(updateProcess(scheduler)({
            pid: p.pid,
            "function": p["function"],
            frame: p.frame,
            callStack: p.callStack,
            mailbox: p.mailbox,
            links: p.links,
            remoteLinks: p.remoteLinks,
            monitors: p.monitors,
            parent: p.parent,
            children: p.children,
            trapExit: p.trapExit,
            metadata: p.metadata,
            result: p.result,
            error: p.error,
            createdSequence: p.createdSequence,
            stepsExecuted: p.stepsExecuted,
            status: ProcessReady.value
          }))(p.pid);
        }
        ;
        return scheduler;
      };
    };
    var scheduler$prime = foldl5(wakeOne)({
      processes: m.scheduler.processes,
      readyQueue: m.scheduler.readyQueue,
      current: m.scheduler.current,
      nextPidSequence: m.scheduler.nextPidSequence,
      scheduleTrace: m.scheduler.scheduleTrace,
      logicalTick: v.value0
    })(processes);
    return new Just({
      config: m.config,
      counters: m.counters,
      events: m.events,
      input: m.input,
      labelCache: m.labelCache,
      outbox: m.outbox,
      program: m.program,
      proofTrace: m.proofTrace,
      state: m.state,
      trace: m.trace,
      scheduler: scheduler$prime
    });
  }
  ;
  throw new Error("Failed pattern match at FinVM.Eval (line 160, column 5 - line 169, column 47): " + [v.constructor.name]);
};
var runSliceForProcess = function(m) {
  return function(p) {
    return function(remaining) {
      var $77 = remaining <= 0 || notEq5(p.status)(ProcessReady.value);
      if ($77) {
        return pure6(new Tuple(m, p));
      }
      ;
      return bind6(stepProcess(m)(p))(function(res) {
        return runSliceForProcess(res.value0)(res.value1)(remaining - 1 | 0);
      });
    };
  };
};
var rootProcessCompleted = function(m) {
  var v = lookup6("main")(m.scheduler.processes);
  if (v instanceof Just) {
    if (v.value0.status instanceof ProcessCompleted) {
      return true;
    }
    ;
    return false;
  }
  ;
  if (v instanceof Nothing) {
    return false;
  }
  ;
  throw new Error("Failed pattern match at FinVM.Eval (line 137, column 26 - line 141, column 19): " + [v.constructor.name]);
};
var reasonForStatus = function(v) {
  if (v instanceof ProcessCompleted) {
    return "normal";
  }
  ;
  if (v instanceof ProcessFailed) {
    return "failed";
  }
  ;
  if (v instanceof ProcessCancelled2) {
    return "cancelled";
  }
  ;
  if (v instanceof ProcessExited) {
    return "exited";
  }
  ;
  return "alive";
};
var isTerminalStatus = function(v) {
  if (v instanceof ProcessCompleted) {
    return true;
  }
  ;
  if (v instanceof ProcessFailed) {
    return true;
  }
  ;
  if (v instanceof ProcessCancelled2) {
    return true;
  }
  ;
  if (v instanceof ProcessExited) {
    return true;
  }
  ;
  return false;
};
var downMessage = function(ref) {
  return function(pid) {
    return function(reason) {
      return new VVariant("DOWN", new VRecord(fromFoldable8([new Tuple("ref", new VString(ref)), new Tuple("pid", new VString(pid)), new Tuple("reason", new VString(reason))])));
    };
  };
};
var notifyMonitorsOfDeath = function(deadPid) {
  return function(status) {
    return function(m) {
      var $95 = !isTerminalStatus(status);
      if ($95) {
        return m;
      }
      ;
      var reason = reasonForStatus(status);
      var observers = values(m.scheduler.processes);
      var handle = function(scheduler) {
        return function(q) {
          var matchesDeadPid = function(v) {
            if (v instanceof MonitorLocal) {
              return v.value0 === deadPid;
            }
            ;
            return false;
          };
          var deadRefs = toUnfoldable10(keys3(filter4(matchesDeadPid)(q.monitors)));
          if (deadRefs.length === 0) {
            return scheduler;
          }
          ;
          var downs = map11(function(ref) {
            return downMessage(ref)(deadPid)(reason);
          })(deadRefs);
          var q$prime = {
            callStack: q.callStack,
            children: q.children,
            createdSequence: q.createdSequence,
            error: q.error,
            frame: q.frame,
            "function": q["function"],
            links: q.links,
            metadata: q.metadata,
            parent: q.parent,
            pid: q.pid,
            remoteLinks: q.remoteLinks,
            result: q.result,
            stepsExecuted: q.stepsExecuted,
            trapExit: q.trapExit,
            mailbox: append4(q.mailbox)(downs),
            monitors: filter4(function($144) {
              return !matchesDeadPid($144);
            })(q.monitors),
            status: (function() {
              if (q.status instanceof ProcessWaiting && q.status.value0 instanceof WaitingForMessage) {
                return ProcessReady.value;
              }
              ;
              if (q.status instanceof ProcessWaiting && q.status.value0 instanceof WaitingForMonitor) {
                return ProcessReady.value;
              }
              ;
              return q.status;
            })()
          };
          var scheduler$prime = updateProcess(scheduler)(q$prime);
          if (q.status instanceof ProcessWaiting && q.status.value0 instanceof WaitingForMessage) {
            return yieldProcess(scheduler$prime)(q.pid);
          }
          ;
          if (q.status instanceof ProcessWaiting && q.status.value0 instanceof WaitingForMonitor) {
            return yieldProcess(scheduler$prime)(q.pid);
          }
          ;
          return scheduler$prime;
        };
      };
      return {
        program: m.program,
        state: m.state,
        input: m.input,
        config: m.config,
        trace: m.trace,
        proofTrace: m.proofTrace,
        outbox: m.outbox,
        events: m.events,
        counters: m.counters,
        labelCache: m.labelCache,
        scheduler: foldl5(handle)(m.scheduler)(observers)
      };
    };
  };
};
var runUntilQuiescent = function(machineInit0) {
  var runSlice = function(m) {
    var $107 = m.counters.steps >= m.config.limits.maxSteps;
    if ($107) {
      return new Right(new Done(m));
    }
    ;
    var v = nextProcess(m.scheduler);
    if (v instanceof Nothing) {
      var v1 = wakeNextTick(m);
      if (v1 instanceof Just) {
        return new Right(new Loop(v1.value0));
      }
      ;
      if (v1 instanceof Nothing) {
        return new Right(new Done(m));
      }
      ;
      throw new Error("Failed pattern match at FinVM.Eval (line 92, column 24 - line 94, column 40): " + [v1.constructor.name]);
    }
    ;
    if (v instanceof Just) {
      var m_current = {
        config: m.config,
        counters: m.counters,
        events: m.events,
        input: m.input,
        labelCache: m.labelCache,
        outbox: m.outbox,
        program: m.program,
        proofTrace: m.proofTrace,
        state: m.state,
        trace: m.trace,
        scheduler: v.value0.value1
      };
      return bind6((function() {
        var v12 = findProcess(m_current.scheduler)(v.value0.value0);
        if (v12 instanceof Nothing) {
          return new Left(new VMError(ProcessNotFound.value, "Process " + (v.value0.value0 + " not found")));
        }
        ;
        if (v12 instanceof Just) {
          return pure6(v12.value0);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Eval (line 97, column 26 - line 99, column 33): " + [v12.constructor.name]);
      })())(function(process) {
        return bind6(runSliceForProcess(m_current)(process)(m.config.limits.maxProcessStepsPerSlice))(function(res) {
          var m_updated = (function() {
            if (res.value1.status instanceof ProcessRunning) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: yieldProcess(updateProcess(res.value0.scheduler)(res.value1))(res.value1.pid)
              };
            }
            ;
            if (res.value1.status instanceof ProcessReady) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: yieldProcess(updateProcess(res.value0.scheduler)(res.value1))(res.value1.pid)
              };
            }
            ;
            if (res.value1.status instanceof ProcessWaiting) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: updateProcess(res.value0.scheduler)(res.value1)
              };
            }
            ;
            if (res.value1.status instanceof ProcessCompleted) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: updateProcess(res.value0.scheduler)({
                  pid: res.value1.pid,
                  status: res.value1.status,
                  "function": res["value1"]["function"],
                  frame: res.value1.frame,
                  callStack: res.value1.callStack,
                  mailbox: res.value1.mailbox,
                  links: res.value1.links,
                  remoteLinks: res.value1.remoteLinks,
                  monitors: res.value1.monitors,
                  parent: res.value1.parent,
                  children: res.value1.children,
                  trapExit: res.value1.trapExit,
                  metadata: res.value1.metadata,
                  error: res.value1.error,
                  createdSequence: res.value1.createdSequence,
                  stepsExecuted: res.value1.stepsExecuted,
                  result: new Just(res.value1.status.value0)
                })
              };
            }
            ;
            return {
              config: res.value0.config,
              counters: res.value0.counters,
              events: res.value0.events,
              input: res.value0.input,
              labelCache: res.value0.labelCache,
              outbox: res.value0.outbox,
              program: res.value0.program,
              proofTrace: res.value0.proofTrace,
              state: res.value0.state,
              trace: res.value0.trace,
              scheduler: updateProcess(res.value0.scheduler)(res.value1)
            };
          })();
          var m_woken = wakeProcessWaiters(res.value1.pid)(m_updated);
          var m_final = notifyMonitorsOfDeath(res.value1.pid)(res.value1.status)(m_woken);
          return new Right(new Loop(m_final));
        });
      });
    }
    ;
    throw new Error("Failed pattern match at FinVM.Eval (line 91, column 11 - line 115, column 39): " + [v.constructor.name]);
  };
  var machineInit = {
    config: machineInit0.config,
    counters: machineInit0.counters,
    events: machineInit0.events,
    input: machineInit0.input,
    outbox: machineInit0.outbox,
    program: machineInit0.program,
    proofTrace: machineInit0.proofTrace,
    scheduler: machineInit0.scheduler,
    state: machineInit0.state,
    trace: machineInit0.trace,
    labelCache: buildLabelCache(machineInit0.program)
  };
  return tailRecM3(runSlice)(machineInit);
};
var anyProcessWaiting = function(m) {
  return any4(function(p) {
    if (p.status instanceof ProcessWaiting) {
      return true;
    }
    ;
    return false;
  })(values(m.scheduler.processes));
};
var runMachine = function(machineInit0) {
  var runSlice = function(m) {
    var $124 = m.counters.steps >= m.config.limits.maxSteps;
    if ($124) {
      return new Right(new Done(m));
    }
    ;
    var v = nextProcess(m.scheduler);
    if (v instanceof Nothing) {
      var $126 = rootProcessCompleted(m);
      if ($126) {
        return new Right(new Done(m));
      }
      ;
      var v1 = wakeNextTick(m);
      if (v1 instanceof Just) {
        return new Right(new Loop(v1.value0));
      }
      ;
      if (v1 instanceof Nothing) {
        var $129 = anyProcessWaiting(m);
        if ($129) {
          return new Left(new VMError(ProcessDeadlock.value, "All processes are waiting but no ready processes"));
        }
        ;
        return new Right(new Done(m));
      }
      ;
      throw new Error("Failed pattern match at FinVM.Eval (line 38, column 20 - line 43, column 40): " + [v1.constructor.name]);
    }
    ;
    if (v instanceof Just) {
      var m_current = {
        config: m.config,
        counters: m.counters,
        events: m.events,
        input: m.input,
        labelCache: m.labelCache,
        outbox: m.outbox,
        program: m.program,
        proofTrace: m.proofTrace,
        state: m.state,
        trace: m.trace,
        scheduler: v.value0.value1
      };
      return bind6((function() {
        var v12 = findProcess(m_current.scheduler)(v.value0.value0);
        if (v12 instanceof Nothing) {
          return new Left(new VMError(ProcessNotFound.value, "Process " + (v.value0.value0 + " not found")));
        }
        ;
        if (v12 instanceof Just) {
          return pure6(v12.value0);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Eval (line 46, column 26 - line 48, column 33): " + [v12.constructor.name]);
      })())(function(process) {
        return bind6(runSliceForProcess(m_current)(process)(m.config.limits.maxProcessStepsPerSlice))(function(res) {
          var m_updated = (function() {
            if (res.value1.status instanceof ProcessRunning) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: yieldProcess(updateProcess(res.value0.scheduler)(res.value1))(res.value1.pid)
              };
            }
            ;
            if (res.value1.status instanceof ProcessReady) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: yieldProcess(updateProcess(res.value0.scheduler)(res.value1))(res.value1.pid)
              };
            }
            ;
            if (res.value1.status instanceof ProcessWaiting) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: updateProcess(res.value0.scheduler)(res.value1)
              };
            }
            ;
            if (res.value1.status instanceof ProcessCompleted) {
              return {
                config: res.value0.config,
                counters: res.value0.counters,
                events: res.value0.events,
                input: res.value0.input,
                labelCache: res.value0.labelCache,
                outbox: res.value0.outbox,
                program: res.value0.program,
                proofTrace: res.value0.proofTrace,
                state: res.value0.state,
                trace: res.value0.trace,
                scheduler: updateProcess(res.value0.scheduler)({
                  pid: res.value1.pid,
                  status: res.value1.status,
                  "function": res["value1"]["function"],
                  frame: res.value1.frame,
                  callStack: res.value1.callStack,
                  mailbox: res.value1.mailbox,
                  links: res.value1.links,
                  remoteLinks: res.value1.remoteLinks,
                  monitors: res.value1.monitors,
                  parent: res.value1.parent,
                  children: res.value1.children,
                  trapExit: res.value1.trapExit,
                  metadata: res.value1.metadata,
                  error: res.value1.error,
                  createdSequence: res.value1.createdSequence,
                  stepsExecuted: res.value1.stepsExecuted,
                  result: new Just(res.value1.status.value0)
                })
              };
            }
            ;
            return {
              config: res.value0.config,
              counters: res.value0.counters,
              events: res.value0.events,
              input: res.value0.input,
              labelCache: res.value0.labelCache,
              outbox: res.value0.outbox,
              program: res.value0.program,
              proofTrace: res.value0.proofTrace,
              state: res.value0.state,
              trace: res.value0.trace,
              scheduler: updateProcess(res.value0.scheduler)(res.value1)
            };
          })();
          var m_woken = wakeProcessWaiters(res.value1.pid)(m_updated);
          var m_final = notifyMonitorsOfDeath(res.value1.pid)(res.value1.status)(m_woken);
          return new Right(new Loop(m_final));
        });
      });
    }
    ;
    throw new Error("Failed pattern match at FinVM.Eval (line 34, column 11 - line 67, column 39): " + [v.constructor.name]);
  };
  var machineInit = {
    config: machineInit0.config,
    counters: machineInit0.counters,
    events: machineInit0.events,
    input: machineInit0.input,
    outbox: machineInit0.outbox,
    program: machineInit0.program,
    proofTrace: machineInit0.proofTrace,
    scheduler: machineInit0.scheduler,
    state: machineInit0.state,
    trace: machineInit0.trace,
    labelCache: buildLabelCache(machineInit0.program)
  };
  return tailRecM3(runSlice)(machineInit);
};

// output/FinVM.Registers/index.js
var emptyRegisters = function(size3) {
  return replicate(size3)(VUnit.value);
};

// output/FinVM.Type/index.js
var TAny = /* @__PURE__ */ (function() {
  function TAny2() {
  }
  ;
  TAny2.value = new TAny2();
  return TAny2;
})();

// output/FinVM.Validate/index.js
var member5 = /* @__PURE__ */ member3(ordString);
var pure7 = /* @__PURE__ */ pure(applicativeEither);
var fromFoldable9 = /* @__PURE__ */ fromFoldable4(foldableArray)(ordString);
var discard3 = /* @__PURE__ */ discard(discardUnit)(bindEither);
var show20 = /* @__PURE__ */ show(showInt);
var for_2 = /* @__PURE__ */ for_(applicativeEither);
var for_1 = /* @__PURE__ */ for_2(foldableArray);
var show110 = /* @__PURE__ */ show(showInstruction);
var lookup7 = /* @__PURE__ */ lookup2(ordString);
var toUnfoldable11 = /* @__PURE__ */ toUnfoldable4(unfoldableArray);
var for_22 = /* @__PURE__ */ for_2(foldableList);
var isSupportedInstruction = function(v) {
  return true;
};
var getLabel = function(v) {
  if (v instanceof LABEL) {
    return new Just(v.value0);
  }
  ;
  return Nothing.value;
};
var extractRegisters = function(v) {
  if (v instanceof NOOP) {
    return [];
  }
  ;
  if (v instanceof HALT) {
    return [v.value0];
  }
  ;
  if (v instanceof ABORT) {
    return [];
  }
  ;
  if (v instanceof LABEL) {
    return [];
  }
  ;
  if (v instanceof JUMP) {
    return [];
  }
  ;
  if (v instanceof JUMP_IF) {
    return [v.value0];
  }
  ;
  if (v instanceof JUMP_IF_FALSE) {
    return [v.value0];
  }
  ;
  if (v instanceof CALL) {
    return cons(v.value0)(v.value2);
  }
  ;
  if (v instanceof TAIL_CALL) {
    return v.value1;
  }
  ;
  if (v instanceof RETURN) {
    return [v.value0];
  }
  ;
  if (v instanceof LOAD_CONST) {
    return [v.value0];
  }
  ;
  if (v instanceof LOAD_INPUT) {
    return [v.value0];
  }
  ;
  if (v instanceof LOAD_CONTEXT) {
    return [v.value0];
  }
  ;
  if (v instanceof MOVE) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof CLEAR) {
    return [v.value0];
  }
  ;
  if (v instanceof RECORD_NEW) {
    return [v.value0];
  }
  ;
  if (v instanceof RECORD_GET) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof RECORD_GET_OPT) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof RECORD_SET) {
    return [v.value0, v.value1, v.value3];
  }
  ;
  if (v instanceof RECORD_HAS) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof RECORD_REMOVE) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof RECORD_KEYS) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof LIST_NEW) {
    return [v.value0];
  }
  ;
  if (v instanceof LIST_FROM) {
    return cons(v.value0)(v.value1);
  }
  ;
  if (v instanceof LIST_GET) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof LIST_SET) {
    return [v.value0, v.value1, v.value2, v.value3];
  }
  ;
  if (v instanceof LIST_APPEND) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof LIST_LENGTH) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof LIST_SLICE) {
    return [v.value0, v.value1, v.value2, v.value3];
  }
  ;
  if (v instanceof MAP_NEW) {
    return [v.value0];
  }
  ;
  if (v instanceof MAP_GET) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof MAP_GET_OPT) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof MAP_SET) {
    return [v.value0, v.value1, v.value2, v.value3];
  }
  ;
  if (v instanceof MAP_HAS) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof MAP_REMOVE) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof MAP_KEYS) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof MAP_VALUES) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof MAP_SIZE) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof VARIANT_NEW) {
    return [v.value0, v.value2];
  }
  ;
  if (v instanceof VARIANT_TAG) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof VARIANT_PAYLOAD) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof ADD) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof SUB) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof MUL) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof DIV) {
    return [v.value0, v.value2, v.value3];
  }
  ;
  if (v instanceof MOD) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof NEG) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof ABS) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof MIN) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof MAX) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof CLAMP) {
    return [v.value0, v.value1, v.value2, v.value3];
  }
  ;
  if (v instanceof EQ2) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof NEQ) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof LT2) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof LTE) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof GT2) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof GTE) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof COMPARE) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof CALL_BUILTIN) {
    return cons(v.value0)(v.value2);
  }
  ;
  if (v instanceof STATE_GET) {
    return [v.value0];
  }
  ;
  if (v instanceof STATE_GET_OPT) {
    return [v.value0];
  }
  ;
  if (v instanceof STATE_SET) {
    return [v.value1];
  }
  ;
  if (v instanceof STATE_DELETE) {
    return [];
  }
  ;
  if (v instanceof STATE_EXISTS) {
    return [v.value0];
  }
  ;
  if (v instanceof STATE_KEYS) {
    return [v.value0];
  }
  ;
  if (v instanceof STATE_SNAPSHOT) {
    return [v.value0];
  }
  ;
  if (v instanceof EVENT_NEW) {
    return [v.value0, v.value2];
  }
  ;
  if (v instanceof EVENT_EMIT) {
    return [v.value0];
  }
  ;
  if (v instanceof EVENT_BATCH_NEW) {
    return [v.value0];
  }
  ;
  if (v instanceof EVENT_BATCH_APPEND) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof EFFECT_NEW) {
    return [v.value0, v.value2];
  }
  ;
  if (v instanceof EFFECT_REQUEST) {
    return [v.value0];
  }
  ;
  if (v instanceof EFFECT_AWAIT) {
    return [v.value0];
  }
  ;
  if (v instanceof EFFECT_BATCH_NEW) {
    return [v.value0];
  }
  ;
  if (v instanceof EFFECT_BATCH_APPEND) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof PROC_SELF) {
    return [v.value0];
  }
  ;
  if (v instanceof PROC_STATUS) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_SPAWN) {
    return cons(v.value0)(v.value2);
  }
  ;
  if (v instanceof PROC_YIELD) {
    return [];
  }
  ;
  if (v instanceof PROC_JOIN) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_JOIN_RESULT) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_CANCEL) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_EXIT) {
    return [v.value0];
  }
  ;
  if (v instanceof PROC_SEND) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_RECEIVE) {
    return [v.value0];
  }
  ;
  if (v instanceof PROC_RECEIVE_OPT) {
    return [v.value0];
  }
  ;
  if (v instanceof PROC_RECEIVE_MATCH) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_RECEIVE_MATCH_OPT) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_LINK) {
    return [v.value0];
  }
  ;
  if (v instanceof PROC_UNLINK) {
    return [v.value0];
  }
  ;
  if (v instanceof PROC_MONITOR) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof PROC_DEMONITOR) {
    return [v.value0];
  }
  ;
  if (v instanceof PROC_TRAP_EXIT) {
    return [];
  }
  ;
  if (v instanceof PROC_SLEEP_TICKS) {
    return [];
  }
  ;
  if (v instanceof NODE_SELF) {
    return [v.value0];
  }
  ;
  if (v instanceof NODE_STATUS) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof NODE_KNOWN) {
    return [v.value0];
  }
  ;
  if (v instanceof REMOTE_PID_NEW) {
    return [v.value0, v.value1, v.value2];
  }
  ;
  if (v instanceof REMOTE_PID_NODE) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof REMOTE_PID_LOCAL) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof NODE_SEND) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof NODE_SPAWN) {
    return cons(v.value0)(cons(v.value1)(v.value3));
  }
  ;
  if (v instanceof NODE_LINK) {
    return [v.value0];
  }
  ;
  if (v instanceof NODE_UNLINK) {
    return [v.value0];
  }
  ;
  if (v instanceof NODE_MONITOR) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof NODE_DEMONITOR) {
    return [v.value0];
  }
  ;
  if (v instanceof NODE_OBSERVE_STATE) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof NODE_LAST_STATE_HASH) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof NODE_LAST_SEEN_TICK) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof NODE_QUERY_STATE) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof MACHINE_NEW) {
    return [v.value0, v.value2];
  }
  ;
  if (v instanceof MACHINE_STATE) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof MACHINE_TRANSITION) {
    return [v.value0, v.value1];
  }
  ;
  if (v instanceof ASSERT) {
    return [v.value0];
  }
  ;
  if (v instanceof ASSUME) {
    return [v.value0];
  }
  ;
  if (v instanceof INVARIANT_CHECK) {
    return [];
  }
  ;
  if (v instanceof PROOF_MARK) {
    return [v.value1];
  }
  ;
  if (v instanceof PROOF_SCOPE_BEGIN) {
    return [];
  }
  ;
  if (v instanceof PROOF_SCOPE_END) {
    return [];
  }
  ;
  throw new Error("Failed pattern match at FinVM.Validate (line 111, column 20 - line 230, column 26): " + [v.constructor.name]);
};
var extractCall = function(v) {
  if (v instanceof CALL) {
    return new Just({
      id: v.value1,
      arity: length(v.value2)
    });
  }
  ;
  if (v instanceof TAIL_CALL) {
    return new Just({
      id: v.value0,
      arity: length(v.value1)
    });
  }
  ;
  if (v instanceof PROC_SPAWN) {
    return new Just({
      id: v.value1,
      arity: length(v.value2)
    });
  }
  ;
  if (v instanceof NODE_SPAWN) {
    return new Just({
      id: v.value2,
      arity: length(v.value3)
    });
  }
  ;
  return Nothing.value;
};
var checkLabel = function(fid) {
  return function(labels) {
    return function(l) {
      var $292 = member5(l)(labels);
      if ($292) {
        return pure7(unit);
      }
      ;
      return new Left(new VMError(InvalidJump.value, "Jump to unknown label " + (l + (" in function " + fid))));
    };
  };
};
var validateFunction = function(p) {
  return function(f) {
    var labels = mapMaybe(getLabel)(f.instructions);
    var labelSet = fromFoldable9(labels);
    var constCount = length(p.constants);
    return discard3((function() {
      var $293 = f.arity < 0 || f.registerCount < 0;
      if ($293) {
        return new Left(new VMError(InvalidProgram.value, "Negative arity/registerCount in function " + f.id));
      }
      ;
      return pure7(unit);
    })())(function() {
      return discard3((function() {
        var $294 = f.registerCount < f.arity;
        if ($294) {
          return new Left(new VMError(InvalidRegister.value, "Function " + (f.id + (" declares registerCount " + (show20(f.registerCount) + (" < arity " + (show20(f.arity) + "; arguments would be dropped")))))));
        }
        ;
        return pure7(unit);
      })())(function() {
        return for_1(f.instructions)(function(inst) {
          return discard3((function() {
            var $295 = isSupportedInstruction(inst);
            if ($295) {
              return pure7(unit);
            }
            ;
            return new Left(new VMError(InvalidInstruction.value, "Instruction is declared but not implemented by the interpreter in function " + (f.id + (": " + show110(inst)))));
          })())(function() {
            var regs = extractRegisters(inst);
            return discard3(for_1(regs)(function(r) {
              var $296 = r < 0 || r >= f.registerCount;
              if ($296) {
                return new Left(new VMError(InvalidRegister.value, "Register out of bounds in function " + f.id));
              }
              ;
              return pure7(unit);
            }))(function() {
              return discard3((function() {
                if (inst instanceof JUMP) {
                  return checkLabel(f.id)(labelSet)(inst.value0);
                }
                ;
                if (inst instanceof JUMP_IF) {
                  return checkLabel(f.id)(labelSet)(inst.value1);
                }
                ;
                if (inst instanceof JUMP_IF_FALSE) {
                  return checkLabel(f.id)(labelSet)(inst.value1);
                }
                ;
                return pure7(unit);
              })())(function() {
                return discard3((function() {
                  if (inst instanceof LOAD_CONST) {
                    var $304 = inst.value1 < 0 || inst.value1 >= constCount;
                    if ($304) {
                      return new Left(new VMError(InvalidInstruction.value, "Constant index out of bounds in function " + f.id));
                    }
                    ;
                    return pure7(unit);
                  }
                  ;
                  return pure7(unit);
                })())(function() {
                  var v = extractCall(inst);
                  if (v instanceof Just) {
                    var v1 = lookup7(v.value0.id)(p.functions);
                    if (v1 instanceof Nothing) {
                      return new Left(new VMError(UnknownFunction.value, "Unknown function " + (v.value0.id + (" in " + f.id))));
                    }
                    ;
                    if (v1 instanceof Just) {
                      var $309 = v1.value0.arity !== v.value0.arity;
                      if ($309) {
                        return new Left(new VMError(ArityMismatch.value, "Arity mismatch calling " + (v.value0.id + (" from " + f.id))));
                      }
                      ;
                      return pure7(unit);
                    }
                    ;
                    throw new Error("Failed pattern match at FinVM.Validate (line 81, column 9 - line 86, column 29): " + [v1.constructor.name]);
                  }
                  ;
                  if (v instanceof Nothing) {
                    return pure7(unit);
                  }
                  ;
                  throw new Error("Failed pattern match at FinVM.Validate (line 79, column 5 - line 87, column 27): " + [v.constructor.name]);
                });
              });
            });
          });
        });
      });
    });
  };
};
var validateProgram = function(p) {
  return discard3((function() {
    var v = lookup7(p.entrypoint)(p.functions);
    if (v instanceof Nothing) {
      return new Left(new VMError(InvalidProgram.value, "Entrypoint not found: " + p.entrypoint));
    }
    ;
    if (v instanceof Just) {
      return pure7(unit);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Validate (line 21, column 3 - line 23, column 24): " + [v.constructor.name]);
  })())(function() {
    return discard3(for_1(toUnfoldable11(p.exports))(function(v) {
      var v1 = lookup7(v.value1)(p.functions);
      if (v1 instanceof Nothing) {
        return new Left(new VMError(InvalidProgram.value, "Export target not found: " + v.value1));
      }
      ;
      if (v1 instanceof Just) {
        return pure7(unit);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Validate (line 27, column 5 - line 29, column 26): " + [v1.constructor.name]);
    }))(function() {
      return for_22(values(p.functions))(function(f) {
        return validateFunction(p)(f);
      });
    });
  });
};

// output/FinVM.Encoding.Json/index.js
var map15 = /* @__PURE__ */ map(functorEither);
var fromFoldable10 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
var traverse4 = /* @__PURE__ */ traverse(traversableArray)(applicativeEither);
var toAscUnfoldable2 = /* @__PURE__ */ toAscUnfoldable(unfoldableArray);
var show21 = /* @__PURE__ */ show(showErrorCode);
var map16 = /* @__PURE__ */ map(functorArray);
var toUnfoldable15 = /* @__PURE__ */ toUnfoldable4(unfoldableArray);
var lookup8 = /* @__PURE__ */ lookup2(ordString);
var any5 = /* @__PURE__ */ any(foldableList)(heytingAlgebraBoolean);
var mapFlipped2 = /* @__PURE__ */ mapFlipped(functorMaybe);
var mempty3 = /* @__PURE__ */ mempty(/* @__PURE__ */ monoidSet(ordString));
var ordRecord3 = /* @__PURE__ */ ordRecord()(/* @__PURE__ */ ordRecordCons(/* @__PURE__ */ ordRecordCons(ordRecordNil)()({
  reflectSymbol: function() {
    return "pid";
  }
})(ordString))()({
  reflectSymbol: function() {
    return "node";
  }
})(ordNodeRef));
var mempty1 = /* @__PURE__ */ mempty(/* @__PURE__ */ monoidSet(ordRecord3));
var show111 = /* @__PURE__ */ show(showNumber);
var bind7 = /* @__PURE__ */ bind(bindEither);
var pure8 = /* @__PURE__ */ pure(applicativeEither);
var bind13 = /* @__PURE__ */ bind(bindMaybe);
var show27 = /* @__PURE__ */ show(showInt);
var mapFlipped1 = /* @__PURE__ */ mapFlipped(functorEither);
var map24 = /* @__PURE__ */ map(functorMaybe);
var fromFoldable12 = /* @__PURE__ */ fromFoldable3(ordValue)(foldableArray);
var apply3 = /* @__PURE__ */ apply(applyEither);
var max4 = /* @__PURE__ */ max(ordInt);
var toUnfoldable16 = /* @__PURE__ */ toUnfoldable2(unfoldableArray);
var union3 = /* @__PURE__ */ union(ordString);
var elem4 = /* @__PURE__ */ elem2(eqString);
var insert5 = /* @__PURE__ */ insert(ordString);
var toUnfoldable23 = /* @__PURE__ */ toUnfoldable5(unfoldableArray);
var filter5 = /* @__PURE__ */ filter3(ordRecord3);
var append1 = /* @__PURE__ */ append(semigroupArray);
var $$delete4 = /* @__PURE__ */ $$delete(ordString);
var fromFoldable23 = /* @__PURE__ */ fromFoldable(foldableList);
var DeliveryEffectReply = /* @__PURE__ */ (function() {
  function DeliveryEffectReply2(value0) {
    this.value0 = value0;
  }
  ;
  DeliveryEffectReply2.create = function(value0) {
    return new DeliveryEffectReply2(value0);
  };
  return DeliveryEffectReply2;
})();
var DeliveryMailboxMessage = /* @__PURE__ */ (function() {
  function DeliveryMailboxMessage2(value0) {
    this.value0 = value0;
  }
  ;
  DeliveryMailboxMessage2.create = function(value0) {
    return new DeliveryMailboxMessage2(value0);
  };
  return DeliveryMailboxMessage2;
})();
var DeliveryDisconnect = /* @__PURE__ */ (function() {
  function DeliveryDisconnect2(value0) {
    this.value0 = value0;
  }
  ;
  DeliveryDisconnect2.create = function(value0) {
    return new DeliveryDisconnect2(value0);
  };
  return DeliveryDisconnect2;
})();
var DeliveryNodeStatus = /* @__PURE__ */ (function() {
  function DeliveryNodeStatus2(value0) {
    this.value0 = value0;
  }
  ;
  DeliveryNodeStatus2.create = function(value0) {
    return new DeliveryNodeStatus2(value0);
  };
  return DeliveryNodeStatus2;
})();
var PendingAwaitReply = /* @__PURE__ */ (function() {
  function PendingAwaitReply2() {
  }
  ;
  PendingAwaitReply2.value = new PendingAwaitReply2();
  return PendingAwaitReply2;
})();
var PendingTransport = /* @__PURE__ */ (function() {
  function PendingTransport2() {
  }
  ;
  PendingTransport2.value = new PendingTransport2();
  return PendingTransport2;
})();
var traverseObject = function(f) {
  return function(object) {
    var decodePair = function(v) {
      return map15(Tuple.create(v.value0))(f(v.value1));
    };
    return map15(fromFoldable10)(traverse4(decodePair)(toAscUnfoldable2(object)));
  };
};
var renderVMError = function(v) {
  return show21(v.value0) + (": " + v.value1);
};
var orderedList = /* @__PURE__ */ (function() {
  var $417 = toUnfoldable3(unfoldableArray);
  return function($418) {
    return reverse($417($418));
  };
})();
var objectJson = /* @__PURE__ */ (function() {
  var $419 = fromFoldable2(foldableArray);
  return function($420) {
    return id($419($420));
  };
})();
var nodeStateKey2 = "__finvm.nodes";
var mkMainFunction = function(registerCount) {
  return function(instructions) {
    return {
      id: "main",
      arity: 0,
      registerCount,
      parameterTypes: [],
      returnType: TAny.value,
      instructions,
      debug: {
        name: "main"
      },
      proof: {
        isInvariant: false
      }
    };
  };
};
var valueToJson = function(v) {
  if (v instanceof VUnit) {
    return jsonNull;
  }
  ;
  if (v instanceof VBool) {
    return objectJson([new Tuple("bool", id(v.value0))]);
  }
  ;
  if (v instanceof VInt) {
    return objectJson([new Tuple("int", id(toString2(v.value0)))]);
  }
  ;
  if (v instanceof VFixed) {
    return objectJson([new Tuple("fixed", objectJson([new Tuple("value", id(toString2(v.value0.value))), new Tuple("scale", id(toNumber3(v.value0.scale)))]))]);
  }
  ;
  if (v instanceof VRational) {
    return objectJson([new Tuple("rational", objectJson([new Tuple("numerator", id(toString2(v.value0.numerator))), new Tuple("denominator", id(toString2(v.value0.denominator)))]))]);
  }
  ;
  if (v instanceof VString) {
    return objectJson([new Tuple("string", id(v.value0))]);
  }
  ;
  if (v instanceof VBytes) {
    return objectJson([new Tuple("bytes", id(map16(function($421) {
      return id(toNumber3($421));
    })(v.value0)))]);
  }
  ;
  if (v instanceof VSymbol) {
    return objectJson([new Tuple("symbol", id(v.value0))]);
  }
  ;
  if (v instanceof VList) {
    return objectJson([new Tuple("list", id(map16(valueToJson)(toArray2(v.value0))))]);
  }
  ;
  if (v instanceof VMap) {
    return objectJson([new Tuple("map", id(map16(mapEntryToJson)(toUnfoldable15(v.value0))))]);
  }
  ;
  if (v instanceof VRecord) {
    return objectJson([new Tuple("record", stringMapToJson(v.value0))]);
  }
  ;
  if (v instanceof VVariant) {
    return objectJson([new Tuple("variant", objectJson([new Tuple("tag", id(v.value0)), new Tuple("payload", valueToJson(v.value1))]))]);
  }
  ;
  if (v instanceof VOption && v.value0 instanceof Nothing) {
    return objectJson([new Tuple("option", jsonNull)]);
  }
  ;
  if (v instanceof VOption && v.value0 instanceof Just) {
    return objectJson([new Tuple("option", valueToJson(v.value0.value0))]);
  }
  ;
  if (v instanceof VResult && v.value0 instanceof Left) {
    return objectJson([new Tuple("error", valueToJson(v.value0.value0))]);
  }
  ;
  if (v instanceof VResult && v.value0 instanceof Right) {
    return objectJson([new Tuple("ok", valueToJson(v.value0.value0))]);
  }
  ;
  if (v instanceof VFunctionRef) {
    return objectJson([new Tuple("function", id(v.value0))]);
  }
  ;
  if (v instanceof VProcessRef) {
    return objectJson([new Tuple("process", id(v.value0))]);
  }
  ;
  if (v instanceof VRemoteProcessRef) {
    return objectJson([new Tuple("remoteProcess", id(v.value0.pid))]);
  }
  ;
  if (v instanceof VStateMachineInstance) {
    return objectJson([new Tuple("stateMachine", id(v.value0.instanceId))]);
  }
  ;
  if (v instanceof VEvent) {
    return objectJson([new Tuple("event", objectJson([new Tuple("type", id(v.value0.type_)), new Tuple("payload", valueToJson(v.value0.payload))]))]);
  }
  ;
  if (v instanceof VEffectIntent) {
    return objectJson([new Tuple("effect", objectJson([new Tuple("type", id(v.value0.type_)), new Tuple("payload", valueToJson(v.value0.payload))]))]);
  }
  ;
  if (v instanceof VProofValue) {
    return objectJson([new Tuple("proof", objectJson([new Tuple("label", id(v.value0.label)), new Tuple("value", valueToJson(v.value0.value))]))]);
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Json (line 928, column 15 - line 955, column 154): " + [v.constructor.name]);
};
var stringMapToJson = function(values2) {
  return objectJson(map16(function(v) {
    return new Tuple(v.value0, valueToJson(v.value1));
  })(toUnfoldable15(values2)));
};
var mapEntryToJson = function(v) {
  return objectJson([new Tuple("key", valueToJson(v.value0)), new Tuple("value", valueToJson(v.value1))]);
};
var pendingEntry = function(e) {
  var fields = (function() {
    if (e.payload instanceof VRecord) {
      return e.payload.value0;
    }
    ;
    return empty3;
  })();
  var getStr = function(k) {
    var v = lookup8(k)(fields);
    if (v instanceof Just && v.value0 instanceof VString) {
      return v.value0.value0;
    }
    ;
    return "";
  };
  var getVal = function(k) {
    var v = lookup8(k)(fields);
    if (v instanceof Just) {
      return v.value0;
    }
    ;
    return VUnit.value;
  };
  var pendingKind = (function() {
    var v = lookup8("payload")(fields);
    var v1 = lookup8("key")(fields);
    if (v1 instanceof Just && (v1.value0 instanceof VString && v instanceof Just)) {
      return PendingAwaitReply.value;
    }
    ;
    return PendingTransport.value;
  })();
  var keyVal = (function() {
    if (pendingKind instanceof PendingAwaitReply) {
      return getStr("key");
    }
    ;
    if (pendingKind instanceof PendingTransport) {
      return "";
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 331, column 7 - line 333, column 31): " + [pendingKind.constructor.name]);
  })();
  var kindVal = (function() {
    if (pendingKind instanceof PendingAwaitReply) {
      return "await_reply";
    }
    ;
    if (pendingKind instanceof PendingTransport) {
      return "transport";
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 339, column 7 - line 341, column 40): " + [pendingKind.constructor.name]);
  })();
  var payloadVal = (function() {
    if (pendingKind instanceof PendingAwaitReply) {
      return getVal("payload");
    }
    ;
    if (pendingKind instanceof PendingTransport) {
      return e.payload;
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 335, column 7 - line 337, column 38): " + [pendingKind.constructor.name]);
  })();
  var pidVal = (function() {
    if (pendingKind instanceof PendingAwaitReply) {
      return getStr("pid");
    }
    ;
    if (pendingKind instanceof PendingTransport) {
      var v = lookup8("pid")(fields);
      if (v instanceof Just && v.value0 instanceof VString) {
        return v.value0.value0;
      }
      ;
      return "";
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 325, column 7 - line 329, column 18): " + [pendingKind.constructor.name]);
  })();
  return objectJson([new Tuple("kind", id(kindVal)), new Tuple("pid", id(pidVal)), new Tuple("key", id(keyVal)), new Tuple("type_", id(e.type_)), new Tuple("payload", valueToJson(payloadVal))]);
};
var taggedPayloadToJson = function(t) {
  return objectJson([new Tuple("type_", id(t.type_)), new Tuple("payload", valueToJson(t.payload))]);
};
var mainResult = function(machine) {
  var v = findProcess(machine.scheduler)("main");
  if (v instanceof Just) {
    if (v.value0.status instanceof ProcessCompleted) {
      return v.value0.status.value0;
    }
    ;
    return fromMaybe(VUnit.value)(v.value0.result);
  }
  ;
  if (v instanceof Nothing) {
    return VUnit.value;
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Json (line 621, column 3 - line 625, column 21): " + [v.constructor.name]);
};
var quiescedOutput = function(m) {
  var isTerminal = function(s) {
    if (s instanceof ProcessCompleted) {
      return true;
    }
    ;
    if (s instanceof ProcessFailed) {
      return true;
    }
    ;
    if (s instanceof ProcessCancelled2) {
      return true;
    }
    ;
    if (s instanceof ProcessExited) {
      return true;
    }
    ;
    return false;
  };
  var pending = orderedList(m.outbox);
  var anyAlive = any5(function($422) {
    return !isTerminal((function(v) {
      return v.status;
    })($422));
  })(values(m.scheduler.processes));
  var status = (function() {
    var $214 = !$$null(pending);
    if ($214) {
      return "suspended";
    }
    ;
    if (anyAlive) {
      return "deadlock";
    }
    ;
    return "completed";
  })();
  return stringify(objectJson([new Tuple("status", id(status)), new Tuple("snapshot", encodeMachineState(m)), new Tuple("pending", id(map16(pendingEntry)(pending))), new Tuple("events", id(map16(taggedPayloadToJson)(orderedList(m.events)))), new Tuple("result", valueToJson(mainResult(m))), new Tuple("state", stringMapToJson(m.state))]));
};
var mailboxHasVariantTag2 = function(tag) {
  return function(messages) {
    var matches = function(v2) {
      if (v2 instanceof VVariant) {
        return v2.value0 === tag;
      }
      ;
      return false;
    };
    var v = find2(matches)(messages);
    if (v instanceof Just) {
      return true;
    }
    ;
    if (v instanceof Nothing) {
      return false;
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 433, column 37 - line 435, column 19): " + [v.constructor.name]);
  };
};
var initialMachine = function(file) {
  var initialFrame = {
    "function": file.program.entrypoint,
    pc: 0,
    registers: emptyRegisters(fromMaybe(16)(mapFlipped2(lookup8(file.program.entrypoint)(file.program.functions))(function(v) {
      return v.registerCount;
    }))),
    returnRegister: Nothing.value,
    caller: Nothing.value
  };
  var initialProcess = {
    pid: "main",
    status: ProcessReady.value,
    "function": file.program.entrypoint,
    frame: initialFrame,
    callStack: [],
    mailbox: [],
    links: mempty3,
    remoteLinks: mempty1,
    monitors: empty3,
    parent: Nothing.value,
    children: mempty3,
    trapExit: false,
    metadata: {
      name: "main"
    },
    result: Nothing.value,
    error: Nothing.value,
    createdSequence: 0,
    stepsExecuted: 0
  };
  return {
    program: file.program,
    scheduler: spawnProcess(initialScheduler)(initialProcess),
    state: file.state,
    input: file.input,
    config: {
      limits: file.limits,
      externalBuiltins: empty3,
      performanceMode: file.performanceMode
    },
    trace: Nil.value,
    proofTrace: Nil.value,
    outbox: Nil.value,
    events: Nil.value,
    counters: {
      steps: 0
    },
    labelCache: empty3
  };
};
var exitMessage = function(pid) {
  return function(reason) {
    return new VVariant("EXIT", new VRecord(fromFoldable10([new Tuple("pid", new VString(pid)), new Tuple("reason", new VString(reason))])));
  };
};
var errorJson = function(msg) {
  return stringify(objectJson([new Tuple("status", id("error")), new Tuple("error", id(msg))]));
};
var effectFail = function(status) {
  return function(msg) {
    return stringify(objectJson([new Tuple("status", id(status)), new Tuple("error", id(msg))]));
  };
};
var downMessage2 = function(ref) {
  return function(pid) {
    return function(reason) {
      return new VVariant("DOWN", new VRecord(fromFoldable10([new Tuple("ref", new VString(ref)), new Tuple("pid", new VString(pid)), new Tuple("reason", new VString(reason))])));
    };
  };
};
var decodeNumberValue = function(n) {
  var v = fromNumber(n);
  if (v instanceof Just) {
    return new Right(new VInt(fromInt(v.value0)));
  }
  ;
  if (v instanceof Nothing) {
    return new Left("JSON numbers used as VM integers must be safe whole Ints: " + show111(n));
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Json (line 781, column 23 - line 783, column 91): " + [v.constructor.name]);
};
var decodeIntValue = function(json) {
  return bind7((function() {
    var v = toString(json);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      var v1 = bind13(toNumber(json))(fromNumber);
      if (v1 instanceof Just) {
        return pure8(show27(v1.value0));
      }
      ;
      if (v1 instanceof Nothing) {
        return new Left("int value must be a decimal string or safe integer");
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 833, column 16 - line 835, column 75): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 831, column 11 - line 835, column 75): " + [v.constructor.name]);
  })())(function(text) {
    var v = fromString3(text);
    if (v instanceof Just) {
      return pure8(new VInt(v.value0));
    }
    ;
    if (v instanceof Nothing) {
      return new Left("Invalid integer literal: " + text);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 836, column 3 - line 838, column 58): " + [v.constructor.name]);
  });
};
var at = function(index3) {
  return function(values2) {
    var v = index(values2)(index3);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left("Missing argument " + show27(index3));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 1022, column 19 - line 1024, column 54): " + [v.constructor.name]);
  };
};
var asString = function(label) {
  return function(value) {
    var v = toString(value);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left(label + " must be a string");
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 1037, column 24 - line 1039, column 49): " + [v.constructor.name]);
  };
};
var optionalString = function(key) {
  return function(object) {
    var v = lookup(key)(object);
    if (v instanceof Nothing) {
      return pure8(Nothing.value);
    }
    ;
    if (v instanceof Just) {
      return map15(Just.create)(asString(key)(v.value0));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 979, column 29 - line 981, column 44): " + [v.constructor.name]);
  };
};
var optionalStringWithDefault = function(key) {
  return function(fallback) {
    return function(object) {
      var v = lookup(key)(object);
      if (v instanceof Nothing) {
        return pure8(fallback);
      }
      ;
      if (v instanceof Just) {
        return asString(key)(v.value0);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 974, column 49 - line 976, column 35): " + [v.constructor.name]);
    };
  };
};
var requiredString = function(key) {
  return function(object) {
    var v = lookup(key)(object);
    if (v instanceof Just) {
      return asString(key)(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left("Missing string field: " + key);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 994, column 29 - line 996, column 52): " + [v.constructor.name]);
  };
};
var requiredBigInt = function(key) {
  return function(obj2) {
    return bind7(requiredString(key)(obj2))(function(text) {
      var v = fromString3(text);
      if (v instanceof Just) {
        return pure8(v.value0);
      }
      ;
      if (v instanceof Nothing) {
        return new Left("Invalid integer literal for " + (key + (": " + text)));
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 859, column 3 - line 861, column 76): " + [v.constructor.name]);
    });
  };
};
var stringAt = function(index3) {
  return function(values2) {
    return bind7(at(index3)(values2))(asString("argument " + show27(index3)));
  };
};
var roundingAt = function(index3) {
  return function(values2) {
    return bind7(stringAt(index3)(values2))(function(name) {
      if (name === "RoundDown") {
        return pure8(RoundDown.value);
      }
      ;
      if (name === "RoundUp") {
        return pure8(RoundUp.value);
      }
      ;
      if (name === "RoundHalfEven") {
        return pure8(RoundHalfEven.value);
      }
      ;
      if (name === "RoundTowardZero") {
        return pure8(RoundTowardZero.value);
      }
      ;
      if (name === "RoundAwayFromZero") {
        return pure8(RoundAwayFromZero.value);
      }
      ;
      return new Left("Unknown rounding mode: " + name);
    });
  };
};
var asObject = function(label) {
  return function(value) {
    var v = toObject(value);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left(label + " must be an object");
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 1027, column 24 - line 1029, column 50): " + [v.constructor.name]);
  };
};
var decodeRational = function(json) {
  return bind7(asObject("rational")(json))(function(obj2) {
    return bind7(requiredBigInt("numerator")(obj2))(function(numerator) {
      return bind7(requiredBigInt("denominator")(obj2))(function(denominator) {
        return pure8(new VRational({
          numerator,
          denominator
        }));
      });
    });
  });
};
var optionalObjectMap = function(key) {
  return function(object) {
    return function(f) {
      var v = lookup(key)(object);
      if (v instanceof Nothing) {
        return pure8(empty3);
      }
      ;
      if (v instanceof Just) {
        return bind7(asObject(key)(v.value0))(traverseObject(f));
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 969, column 34 - line 971, column 56): " + [v.constructor.name]);
    };
  };
};
var asInt2 = function(label) {
  return function(value) {
    var v = bind13(toNumber(value))(fromNumber);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left(label + " must be a safe integer");
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 1047, column 21 - line 1049, column 55): " + [v.constructor.name]);
  };
};
var decodeFixed = function(json) {
  return bind7(asObject("fixed")(json))(function(obj2) {
    return bind7(requiredBigInt("value")(obj2))(function(value) {
      return bind7((function() {
        var v = lookup("scale")(obj2);
        if (v instanceof Just) {
          return asInt2("scale")(v.value0);
        }
        ;
        if (v instanceof Nothing) {
          return new Left("Missing field: scale");
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 844, column 12 - line 846, column 43): " + [v.constructor.name]);
      })())(function(scale) {
        return pure8(new VFixed({
          value,
          scale
        }));
      });
    });
  });
};
var intAt = function(index3) {
  return function(values2) {
    return bind7(at(index3)(values2))(asInt2("argument " + show27(index3)));
  };
};
var optionalInt = function(key) {
  return function(object) {
    var v = lookup(key)(object);
    if (v instanceof Nothing) {
      return pure8(Nothing.value);
    }
    ;
    if (v instanceof Just) {
      return map15(Just.create)(asInt2(key)(v.value0));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 984, column 26 - line 986, column 41): " + [v.constructor.name]);
  };
};
var decodeLimits = function(object) {
  var limitsObj = bind13(lookup("limits")(object))(toObject);
  var lim = function(name) {
    return function(def) {
      if (limitsObj instanceof Nothing) {
        return pure8(def);
      }
      ;
      if (limitsObj instanceof Just) {
        return mapFlipped1(optionalInt(name)(limitsObj.value0))(fromMaybe(def));
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 887, column 20 - line 889, column 55): " + [limitsObj.constructor.name]);
    };
  };
  return bind7(lim("maxSteps")(1e4))(function(maxSteps) {
    return bind7(lim("maxCallDepth")(256))(function(maxCallDepth) {
      return bind7(lim("maxProcesses")(1024))(function(maxProcesses) {
        return bind7(lim("maxProcessStepsPerSlice")(100))(function(maxProcessStepsPerSlice) {
          return bind7(lim("maxRegistersPerFrame")(1024))(function(maxRegistersPerFrame) {
            return bind7(lim("maxFrames")(1024))(function(maxFrames) {
              return bind7(lim("maxListLength")(1e5))(function(maxListLength) {
                return bind7(lim("maxMapSize")(1e5))(function(maxMapSize) {
                  return bind7(lim("maxRecordFields")(1e4))(function(maxRecordFields) {
                    return bind7(lim("maxValueDepth")(100))(function(maxValueDepth) {
                      return bind7(lim("maxStateEntries")(1e5))(function(maxStateEntries) {
                        return bind7(lim("maxTraceEvents")(1e5))(function(maxTraceEvents) {
                          return bind7(lim("maxProofEvents")(1e5))(function(maxProofEvents) {
                            return bind7(lim("maxMailboxSize")(1e4))(function(maxMailboxSize) {
                              return bind7(lim("maxRemoteNodes")(1024))(function(maxRemoteNodes) {
                                return bind7(lim("maxEventsEmitted")(1e4))(function(maxEventsEmitted) {
                                  return bind7(lim("maxEffectsRequested")(1e4))(function(maxEffectsRequested) {
                                    return pure8({
                                      maxSteps,
                                      maxCallDepth,
                                      maxProcesses,
                                      maxProcessStepsPerSlice,
                                      maxRegistersPerFrame,
                                      maxFrames,
                                      maxListLength,
                                      maxMapSize,
                                      maxRecordFields,
                                      maxValueDepth,
                                      maxStateEntries,
                                      maxTraceEvents,
                                      maxProofEvents,
                                      maxMailboxSize,
                                      maxRemoteNodes,
                                      maxEventsEmitted,
                                      maxEffectsRequested
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
var asByte = function(value) {
  return bind7(asInt2("byte")(value))(function($$byte) {
    var $254 = $$byte >= 0 && $$byte <= 255;
    if ($254) {
      return pure8($$byte);
    }
    ;
    return new Left("byte out of range: " + show27($$byte));
  });
};
var asBool2 = function(label) {
  return function(value) {
    var v = toBoolean(value);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left(label + " must be a boolean");
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 1042, column 22 - line 1044, column 50): " + [v.constructor.name]);
  };
};
var boolAt = function(index3) {
  return function(values2) {
    return bind7(at(index3)(values2))(asBool2("argument " + show27(index3)));
  };
};
var optionalBool = function(key) {
  return function(object) {
    var v = lookup(key)(object);
    if (v instanceof Nothing) {
      return pure8(Nothing.value);
    }
    ;
    if (v instanceof Just) {
      return map15(Just.create)(asBool2(key)(v.value0));
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 989, column 27 - line 991, column 42): " + [v.constructor.name]);
  };
};
var asArray = function(label) {
  return function(value) {
    var v = toArray(value);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return new Left(label + " must be an array");
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 1032, column 23 - line 1034, column 49): " + [v.constructor.name]);
  };
};
var decodeVariant = function(json) {
  return bind7(asObject("variant")(json))(function(object) {
    return bind7(requiredString("tag")(object))(function(tag) {
      return bind7((function() {
        var v = lookup("payload")(object);
        if (v instanceof Just) {
          return decodeValue(v.value0);
        }
        ;
        if (v instanceof Nothing) {
          return pure8(VUnit.value);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 867, column 14 - line 869, column 26): " + [v.constructor.name]);
      })())(function(payload) {
        return pure8(new VVariant(tag, payload));
      });
    });
  });
};
var decodeValue = function(json) {
  return caseJson(function(v) {
    return new Right(VUnit.value);
  })(function($423) {
    return Right.create(VBool.create($423));
  })(decodeNumberValue)(function($424) {
    return Right.create(VString.create($424));
  })((function() {
    var $425 = map15(function($428) {
      return VList.create(fromArray($428));
    });
    var $426 = traverse4(decodeValue);
    return function($427) {
      return $425($426($427));
    };
  })())(decodeObjectValue)(json);
};
var decodeStringMapValue = function(label) {
  return function(json) {
    return bind7(asObject(label)(json))(traverseObject(decodeValue));
  };
};
var decodeObjectValue = function(object) {
  var taggedKeys = ["int", "fixed", "rational", "bool", "string", "symbol", "bytes", "list", "map", "record", "variant"];
  var firstTaggedKey = findMap(function(k) {
    return map24(Tuple.create(k))(lookup(k)(object));
  })(taggedKeys);
  var decodeTagged = function(key) {
    return function(value) {
      if (key === "int") {
        return decodeIntValue(value);
      }
      ;
      if (key === "fixed") {
        return decodeFixed(value);
      }
      ;
      if (key === "rational") {
        return decodeRational(value);
      }
      ;
      if (key === "bool") {
        return map15(VBool.create)(asBool2("bool")(value));
      }
      ;
      if (key === "string") {
        return map15(VString.create)(asString("string")(value));
      }
      ;
      if (key === "symbol") {
        return map15(VSymbol.create)(asString("symbol")(value));
      }
      ;
      if (key === "bytes") {
        return map15(VBytes.create)(bind7(asArray("bytes")(value))(traverse4(asByte)));
      }
      ;
      if (key === "list") {
        return map15(function($429) {
          return VList.create(fromArray($429));
        })(bind7(asArray("list")(value))(traverse4(decodeValue)));
      }
      ;
      if (key === "map") {
        return decodeMap(value);
      }
      ;
      if (key === "record") {
        return map15(VRecord.create)(decodeStringMapValue("record")(value));
      }
      ;
      if (key === "variant") {
        return decodeVariant(value);
      }
      ;
      return map15(VRecord.create)(traverseObject(decodeValue)(object));
    };
  };
  if (firstTaggedKey instanceof Just) {
    return decodeTagged(firstTaggedKey.value0.value0)(firstTaggedKey.value0.value1);
  }
  ;
  if (firstTaggedKey instanceof Nothing) {
    return map15(VRecord.create)(traverseObject(decodeValue)(object));
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Json (line 787, column 3 - line 789, column 61): " + [firstTaggedKey.constructor.name]);
};
var decodeMapEntry = function(json) {
  return bind7(asObject("map entry")(json))(function(obj2) {
    return bind7((function() {
      var v = lookup("key")(obj2);
      if (v instanceof Just) {
        return decodeValue(v.value0);
      }
      ;
      if (v instanceof Nothing) {
        return new Left("map entry missing key");
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 821, column 10 - line 823, column 44): " + [v.constructor.name]);
    })())(function(key) {
      return bind7((function() {
        var v = lookup("value")(obj2);
        if (v instanceof Just) {
          return decodeValue(v.value0);
        }
        ;
        if (v instanceof Nothing) {
          return new Left("map entry missing value");
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 824, column 12 - line 826, column 46): " + [v.constructor.name]);
      })())(function(value) {
        return pure8(new Tuple(key, value));
      });
    });
  });
};
var decodeMap = function(json) {
  return bind7(asArray("map")(json))(function(entries) {
    return bind7(traverse4(decodeMapEntry)(entries))(function(pairs) {
      return pure8(new VMap(fromFoldable12(pairs)));
    });
  });
};
var decodeDelivery = function(j) {
  return bind7(asObject("delivery")(j))(function(o) {
    var v = lookup("nodeStatus")(o);
    if (v instanceof Just) {
      return bind7(asObject("nodeStatus")(v.value0))(function(nobj) {
        return bind7(requiredString("node")(nobj))(function(node) {
          return bind7(requiredString("status")(nobj))(function(status) {
            return bind7(optionalString("reason")(nobj))(function(reason) {
              return bind7(optionalInt("lastSeenTick")(nobj))(function(lastSeenTick) {
                return bind7(optionalString("lastStateHash")(nobj))(function(lastStateHash) {
                  return pure8(new DeliveryNodeStatus({
                    node,
                    status,
                    reason,
                    lastSeenTick,
                    lastStateHash
                  }));
                });
              });
            });
          });
        });
      });
    }
    ;
    if (v instanceof Nothing) {
      var v1 = lookup("disconnect")(o);
      if (v1 instanceof Just) {
        return bind7(asObject("disconnect")(v1.value0))(function(dobj) {
          return bind7(requiredString("node")(dobj))(function(node) {
            return bind7((function() {
              var v2 = lookup("reason")(dobj);
              if (v2 instanceof Just) {
                return asString("disconnect.reason")(v2.value0);
              }
              ;
              if (v2 instanceof Nothing) {
                return pure8("noconnection");
              }
              ;
              throw new Error("Failed pattern match at FinVM.Encoding.Json (line 374, column 19 - line 376, column 41): " + [v2.constructor.name]);
            })())(function(reason) {
              return pure8(new DeliveryDisconnect({
                node,
                reason
              }));
            });
          });
        });
      }
      ;
      if (v1 instanceof Nothing) {
        return bind7(requiredString("pid")(o))(function(pid) {
          var v2 = lookup("key")(o);
          var v3 = lookup("message")(o);
          if (v3 instanceof Just) {
            return bind7(decodeValue(v3.value0))(function(message) {
              return pure8(new DeliveryMailboxMessage({
                pid,
                message
              }));
            });
          }
          ;
          if (v2 instanceof Just) {
            return bind7(asString("key")(v2.value0))(function(key) {
              return bind7((function() {
                var v4 = lookup("result")(o);
                if (v4 instanceof Just) {
                  return decodeValue(v4.value0);
                }
                ;
                if (v4 instanceof Nothing) {
                  return pure8(VUnit.value);
                }
                ;
                throw new Error("Failed pattern match at FinVM.Encoding.Json (line 386, column 23 - line 388, column 36): " + [v4.constructor.name]);
              })())(function(result) {
                return pure8(new DeliveryEffectReply({
                  pid,
                  key,
                  result
                }));
              });
            });
          }
          ;
          return new Left("delivery must contain either {pid,message}, {pid,key[,result]}, {disconnect:{node[,reason]}}, or {nodeStatus:{node,status[,reason,lastSeenTick,lastStateHash]}}");
        });
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 370, column 16 - line 390, column 185): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 361, column 3 - line 390, column 185): " + [v.constructor.name]);
  });
};
var decodeDeliveries = function(s) {
  var $284 = s === "";
  if ($284) {
    return new Right([]);
  }
  ;
  return bind7(jsonParser(s))(function(root) {
    return bind7(asArray("deliveries")(root))(function(arr) {
      return traverse4(decodeDelivery)(arr);
    });
  });
};
var decodeOverrides = function(s) {
  var $285 = s === "";
  if ($285) {
    return new Right({
      inputOv: empty3,
      stateOv: empty3
    });
  }
  ;
  return bind7(jsonParser(s))(function(root) {
    return bind7(asObject("overrides")(root))(function(obj2) {
      return bind7(optionalObjectMap("input")(obj2)(decodeValue))(function(inputOv) {
        return bind7(optionalObjectMap("state")(obj2)(decodeValue))(function(stateOv) {
          return pure8({
            inputOv,
            stateOv
          });
        });
      });
    });
  });
};
var instructionSource = function(object) {
  var v = lookup("instructions")(object);
  if (v instanceof Just) {
    return asArray("instructions")(v.value0);
  }
  ;
  if (v instanceof Nothing) {
    var v1 = bind13(bind13(bind13(bind13(lookup("functions")(object))(toObject))(lookup("main")))(toObject))(lookup("instructions"));
    if (v1 instanceof Just) {
      return asArray("functions.main.instructions")(v1.value0);
    }
    ;
    if (v1 instanceof Nothing) {
      return new Left("Missing instructions or functions.main.instructions");
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 631, column 16 - line 633, column 76): " + [v1.constructor.name]);
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Json (line 629, column 3 - line 633, column 76): " + [v.constructor.name]);
};
var intArrayAt = function(index3) {
  return function(values2) {
    return bind7(bind7(at(index3)(values2))(asArray("argument " + show27(index3))))(traverse4(asInt2("argument " + (show27(index3) + "[]"))));
  };
};
var decodeInstruction = function(json) {
  return bind7((function() {
    var v = toArray(json);
    if (v instanceof Just) {
      return pure8(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      return bind7(asObject("instruction")(json))(function(object) {
        return bind7(requiredString("op")(object))(function(op) {
          return bind7((function() {
            var v1 = lookup("args")(object);
            if (v1 instanceof Nothing) {
              return pure8([]);
            }
            ;
            if (v1 instanceof Just) {
              return asArray("args for " + op)(v1.value0);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Encoding.Json (line 642, column 15 - line 644, column 62): " + [v1.constructor.name]);
          })())(function(args) {
            return pure8(cons(id(op))(args));
          });
        });
      });
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 637, column 12 - line 645, column 50): " + [v.constructor.name]);
  })())(function(parts) {
    return bind7(stringAt(0)(parts))(function(op) {
      if (op === "NOOP") {
        return pure8(NOOP.value);
      }
      ;
      if (op === "HALT") {
        return map15(HALT.create)(intAt(1)(parts));
      }
      ;
      if (op === "ABORT") {
        return map15(ABORT.create)(intAt(1)(parts));
      }
      ;
      if (op === "LABEL") {
        return map15(LABEL.create)(stringAt(1)(parts));
      }
      ;
      if (op === "JUMP") {
        return map15(JUMP.create)(stringAt(1)(parts));
      }
      ;
      if (op === "JUMP_IF") {
        return apply3(map15(JUMP_IF.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "JUMP_IF_FALSE") {
        return apply3(map15(JUMP_IF_FALSE.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "CALL") {
        return apply3(apply3(map15(CALL.create)(intAt(1)(parts)))(stringAt(2)(parts)))(intArrayAt(3)(parts));
      }
      ;
      if (op === "TAIL_CALL") {
        return apply3(map15(TAIL_CALL.create)(stringAt(1)(parts)))(intArrayAt(2)(parts));
      }
      ;
      if (op === "RETURN") {
        return map15(RETURN.create)(intAt(1)(parts));
      }
      ;
      if (op === "LOAD_CONST") {
        return apply3(map15(LOAD_CONST.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "LOAD_INPUT") {
        return apply3(map15(LOAD_INPUT.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "LOAD_CONTEXT") {
        return apply3(map15(LOAD_CONTEXT.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "MOVE") {
        return apply3(map15(MOVE.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "CLEAR") {
        return map15(CLEAR.create)(intAt(1)(parts));
      }
      ;
      if (op === "RECORD_NEW") {
        return map15(RECORD_NEW.create)(intAt(1)(parts));
      }
      ;
      if (op === "RECORD_GET") {
        return apply3(apply3(map15(RECORD_GET.create)(intAt(1)(parts)))(intAt(2)(parts)))(stringAt(3)(parts));
      }
      ;
      if (op === "RECORD_GET_OPT") {
        return apply3(apply3(map15(RECORD_GET_OPT.create)(intAt(1)(parts)))(intAt(2)(parts)))(stringAt(3)(parts));
      }
      ;
      if (op === "RECORD_SET") {
        return apply3(apply3(apply3(map15(RECORD_SET.create)(intAt(1)(parts)))(intAt(2)(parts)))(stringAt(3)(parts)))(intAt(4)(parts));
      }
      ;
      if (op === "RECORD_HAS") {
        return apply3(apply3(map15(RECORD_HAS.create)(intAt(1)(parts)))(intAt(2)(parts)))(stringAt(3)(parts));
      }
      ;
      if (op === "RECORD_REMOVE") {
        return apply3(apply3(map15(RECORD_REMOVE.create)(intAt(1)(parts)))(intAt(2)(parts)))(stringAt(3)(parts));
      }
      ;
      if (op === "RECORD_KEYS") {
        return apply3(map15(RECORD_KEYS.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "LIST_NEW") {
        return map15(LIST_NEW.create)(intAt(1)(parts));
      }
      ;
      if (op === "LIST_FROM") {
        return apply3(map15(LIST_FROM.create)(intAt(1)(parts)))(intArrayAt(2)(parts));
      }
      ;
      if (op === "LIST_GET") {
        return apply3(apply3(map15(LIST_GET.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "LIST_SET") {
        return apply3(apply3(apply3(map15(LIST_SET.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts)))(intAt(4)(parts));
      }
      ;
      if (op === "LIST_APPEND") {
        return apply3(apply3(map15(LIST_APPEND.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "LIST_LENGTH") {
        return apply3(map15(LIST_LENGTH.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "LIST_SLICE") {
        return apply3(apply3(apply3(map15(LIST_SLICE.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts)))(intAt(4)(parts));
      }
      ;
      if (op === "MAP_NEW") {
        return map15(MAP_NEW.create)(intAt(1)(parts));
      }
      ;
      if (op === "MAP_GET") {
        return apply3(apply3(map15(MAP_GET.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "MAP_GET_OPT") {
        return apply3(apply3(map15(MAP_GET_OPT.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "MAP_SET") {
        return apply3(apply3(apply3(map15(MAP_SET.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts)))(intAt(4)(parts));
      }
      ;
      if (op === "MAP_HAS") {
        return apply3(apply3(map15(MAP_HAS.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "MAP_REMOVE") {
        return apply3(apply3(map15(MAP_REMOVE.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "MAP_KEYS") {
        return apply3(map15(MAP_KEYS.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "MAP_VALUES") {
        return apply3(map15(MAP_VALUES.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "MAP_SIZE") {
        return apply3(map15(MAP_SIZE.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "VARIANT_NEW") {
        return apply3(apply3(map15(VARIANT_NEW.create)(intAt(1)(parts)))(stringAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "VARIANT_TAG") {
        return apply3(map15(VARIANT_TAG.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "VARIANT_PAYLOAD") {
        return apply3(map15(VARIANT_PAYLOAD.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "ADD") {
        return apply3(apply3(map15(ADD.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "SUB") {
        return apply3(apply3(map15(SUB.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "MUL") {
        return apply3(apply3(map15(MUL.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "DIV") {
        return apply3(apply3(apply3(map15(DIV.create)(intAt(1)(parts)))(roundingAt(2)(parts)))(intAt(3)(parts)))(intAt(4)(parts));
      }
      ;
      if (op === "MOD") {
        return apply3(apply3(map15(MOD.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "NEG") {
        return apply3(map15(NEG.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "ABS") {
        return apply3(map15(ABS.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "MIN") {
        return apply3(apply3(map15(MIN.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "MAX") {
        return apply3(apply3(map15(MAX.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "CLAMP") {
        return apply3(apply3(apply3(map15(CLAMP.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts)))(intAt(4)(parts));
      }
      ;
      if (op === "EQ") {
        return apply3(apply3(map15(EQ2.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "NEQ") {
        return apply3(apply3(map15(NEQ.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "LT") {
        return apply3(apply3(map15(LT2.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "LTE") {
        return apply3(apply3(map15(LTE.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "GT") {
        return apply3(apply3(map15(GT2.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "GTE") {
        return apply3(apply3(map15(GTE.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "COMPARE") {
        return apply3(apply3(map15(COMPARE.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "CALL_BUILTIN") {
        return apply3(apply3(map15(CALL_BUILTIN.create)(intAt(1)(parts)))(stringAt(2)(parts)))(intArrayAt(3)(parts));
      }
      ;
      if (op === "STATE_GET") {
        return apply3(map15(STATE_GET.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "STATE_GET_OPT") {
        return apply3(map15(STATE_GET_OPT.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "STATE_SET") {
        return apply3(map15(STATE_SET.create)(stringAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "STATE_DELETE") {
        return map15(STATE_DELETE.create)(stringAt(1)(parts));
      }
      ;
      if (op === "STATE_EXISTS") {
        return apply3(map15(STATE_EXISTS.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "STATE_KEYS") {
        return apply3(map15(STATE_KEYS.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "STATE_SNAPSHOT") {
        return map15(STATE_SNAPSHOT.create)(intAt(1)(parts));
      }
      ;
      if (op === "EVENT_NEW") {
        return apply3(apply3(map15(EVENT_NEW.create)(intAt(1)(parts)))(stringAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "EVENT_EMIT") {
        return map15(EVENT_EMIT.create)(intAt(1)(parts));
      }
      ;
      if (op === "EVENT_BATCH_NEW") {
        return map15(EVENT_BATCH_NEW.create)(intAt(1)(parts));
      }
      ;
      if (op === "EVENT_BATCH_APPEND") {
        return apply3(apply3(map15(EVENT_BATCH_APPEND.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "EFFECT_NEW") {
        return apply3(apply3(map15(EFFECT_NEW.create)(intAt(1)(parts)))(stringAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "EFFECT_REQUEST") {
        return map15(EFFECT_REQUEST.create)(intAt(1)(parts));
      }
      ;
      if (op === "EFFECT_AWAIT") {
        return map15(EFFECT_AWAIT.create)(intAt(1)(parts));
      }
      ;
      if (op === "EFFECT_BATCH_NEW") {
        return map15(EFFECT_BATCH_NEW.create)(intAt(1)(parts));
      }
      ;
      if (op === "EFFECT_BATCH_APPEND") {
        return apply3(apply3(map15(EFFECT_BATCH_APPEND.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "PROC_SELF") {
        return map15(PROC_SELF.create)(intAt(1)(parts));
      }
      ;
      if (op === "PROC_STATUS") {
        return apply3(map15(PROC_STATUS.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_SPAWN") {
        return apply3(apply3(map15(PROC_SPAWN.create)(intAt(1)(parts)))(stringAt(2)(parts)))(intArrayAt(3)(parts));
      }
      ;
      if (op === "PROC_YIELD") {
        return pure8(PROC_YIELD.value);
      }
      ;
      if (op === "PROC_JOIN") {
        return apply3(map15(PROC_JOIN.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_JOIN_RESULT") {
        return apply3(map15(PROC_JOIN_RESULT.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_CANCEL") {
        return apply3(map15(PROC_CANCEL.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_EXIT") {
        return map15(PROC_EXIT.create)(intAt(1)(parts));
      }
      ;
      if (op === "PROC_SEND") {
        return apply3(map15(PROC_SEND.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_RECEIVE") {
        return map15(PROC_RECEIVE.create)(intAt(1)(parts));
      }
      ;
      if (op === "PROC_RECEIVE_OPT") {
        return map15(PROC_RECEIVE_OPT.create)(intAt(1)(parts));
      }
      ;
      if (op === "PROC_RECEIVE_MATCH") {
        return apply3(map15(PROC_RECEIVE_MATCH.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_RECEIVE_MATCH_OPT") {
        return apply3(map15(PROC_RECEIVE_MATCH_OPT.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_LINK") {
        return map15(PROC_LINK.create)(intAt(1)(parts));
      }
      ;
      if (op === "PROC_UNLINK") {
        return map15(PROC_UNLINK.create)(intAt(1)(parts));
      }
      ;
      if (op === "PROC_MONITOR") {
        return apply3(map15(PROC_MONITOR.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROC_DEMONITOR") {
        return map15(PROC_DEMONITOR.create)(intAt(1)(parts));
      }
      ;
      if (op === "PROC_TRAP_EXIT") {
        return map15(PROC_TRAP_EXIT.create)(boolAt(1)(parts));
      }
      ;
      if (op === "PROC_SLEEP_TICKS") {
        return map15(PROC_SLEEP_TICKS.create)(intAt(1)(parts));
      }
      ;
      if (op === "NODE_SELF") {
        return map15(NODE_SELF.create)(intAt(1)(parts));
      }
      ;
      if (op === "NODE_STATUS") {
        return apply3(map15(NODE_STATUS.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "NODE_KNOWN") {
        return map15(NODE_KNOWN.create)(intAt(1)(parts));
      }
      ;
      if (op === "REMOTE_PID_NEW") {
        return apply3(apply3(map15(REMOTE_PID_NEW.create)(intAt(1)(parts)))(intAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "REMOTE_PID_NODE") {
        return apply3(map15(REMOTE_PID_NODE.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "REMOTE_PID_LOCAL") {
        return apply3(map15(REMOTE_PID_LOCAL.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "NODE_SEND") {
        return apply3(map15(NODE_SEND.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "NODE_SPAWN") {
        return apply3(apply3(apply3(map15(NODE_SPAWN.create)(intAt(1)(parts)))(intAt(2)(parts)))(stringAt(3)(parts)))(intArrayAt(4)(parts));
      }
      ;
      if (op === "NODE_LINK") {
        return map15(NODE_LINK.create)(intAt(1)(parts));
      }
      ;
      if (op === "NODE_UNLINK") {
        return map15(NODE_UNLINK.create)(intAt(1)(parts));
      }
      ;
      if (op === "NODE_MONITOR") {
        return apply3(map15(NODE_MONITOR.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "NODE_DEMONITOR") {
        return map15(NODE_DEMONITOR.create)(intAt(1)(parts));
      }
      ;
      if (op === "NODE_OBSERVE_STATE") {
        return apply3(map15(NODE_OBSERVE_STATE.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "NODE_LAST_STATE_HASH") {
        return apply3(map15(NODE_LAST_STATE_HASH.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "NODE_LAST_SEEN_TICK") {
        return apply3(map15(NODE_LAST_SEEN_TICK.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "NODE_QUERY_STATE") {
        return apply3(map15(NODE_QUERY_STATE.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "MACHINE_NEW") {
        return apply3(apply3(map15(MACHINE_NEW.create)(intAt(1)(parts)))(stringAt(2)(parts)))(intAt(3)(parts));
      }
      ;
      if (op === "MACHINE_STATE") {
        return apply3(map15(MACHINE_STATE.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "MACHINE_TRANSITION") {
        return apply3(apply3(map15(MACHINE_TRANSITION.create)(intAt(1)(parts)))(intAt(2)(parts)))(stringAt(3)(parts));
      }
      ;
      if (op === "ASSERT") {
        return apply3(map15(ASSERT.create)(intAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "ASSUME") {
        return apply3(map15(ASSUME.create)(intAt(1)(parts)))(stringAt(2)(parts));
      }
      ;
      if (op === "INVARIANT_CHECK") {
        return map15(INVARIANT_CHECK.create)(stringAt(1)(parts));
      }
      ;
      if (op === "PROOF_MARK") {
        return apply3(map15(PROOF_MARK.create)(stringAt(1)(parts)))(intAt(2)(parts));
      }
      ;
      if (op === "PROOF_SCOPE_BEGIN") {
        return map15(PROOF_SCOPE_BEGIN.create)(stringAt(1)(parts));
      }
      ;
      if (op === "PROOF_SCOPE_END") {
        return map15(PROOF_SCOPE_END.create)(stringAt(1)(parts));
      }
      ;
      return new Left("Unsupported instruction opcode: " + op);
    });
  });
};
var decodeNamedFunction = function(v) {
  return bind7(asObject("function " + v.value0)(v.value1))(function(spec) {
    return bind7(mapFlipped1(optionalInt("arity")(spec))(fromMaybe(0)))(function(arity) {
      return bind7(mapFlipped1(optionalInt("registerCount")(spec))(fromMaybe(max4(16)(arity))))(function(registerCount) {
        return bind7((function() {
          var v1 = lookup("instructions")(spec);
          if (v1 instanceof Just) {
            return bind7(asArray("instructions for " + v.value0)(v1.value0))(traverse4(decodeInstruction));
          }
          ;
          if (v1 instanceof Nothing) {
            return new Left("function " + (v.value0 + " is missing an instructions array"));
          }
          ;
          throw new Error("Failed pattern match at FinVM.Encoding.Json (line 118, column 19 - line 120, column 80): " + [v1.constructor.name]);
        })())(function(instructions) {
          return bind7((function() {
            var v1 = bind13(lookup("proof")(spec))(toObject);
            if (v1 instanceof Just) {
              return mapFlipped1(optionalBool("isInvariant")(v1.value0))(fromMaybe(false));
            }
            ;
            if (v1 instanceof Nothing) {
              return pure8(false);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Encoding.Json (line 121, column 18 - line 123, column 26): " + [v1.constructor.name]);
          })())(function(isInvariant) {
            return pure8(new Tuple(v.value0, {
              id: v.value0,
              arity,
              registerCount,
              parameterTypes: [],
              returnType: TAny.value,
              instructions,
              debug: {
                name: v.value0
              },
              proof: {
                isInvariant
              }
            }));
          });
        });
      });
    });
  });
};
var decodeFunctionSet = function(object) {
  var v = bind13(lookup("functions")(object))(toObject);
  if (v instanceof Just && !isEmpty(v.value0)) {
    return bind7(traverse4(decodeNamedFunction)(toUnfoldable16(v.value0)))(function(pairs) {
      return bind7(optionalStringWithDefault("entrypoint")("main")(object))(function(entrypoint) {
        return pure8(new Tuple(fromFoldable10(pairs), entrypoint));
      });
    });
  }
  ;
  return bind7(bind7(instructionSource(object))(traverse4(decodeInstruction)))(function(instructions) {
    return bind7(optionalInt("registerCount")(object))(function(registerCount) {
      return pure8(new Tuple(singleton6("main")(mkMainFunction(fromMaybe(16)(registerCount))(instructions)), "main"));
    });
  });
};
var decodeProgramFile = function(source) {
  return bind7(jsonParser(source))(function(root) {
    return bind7(asObject("program")(root))(function(object) {
      return bind7((function() {
        var v = lookup("constants")(object);
        if (v instanceof Nothing) {
          return pure8([]);
        }
        ;
        if (v instanceof Just) {
          return bind7(asArray("constants")(v.value0))(traverse4(decodeValue));
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 73, column 16 - line 75, column 67): " + [v.constructor.name]);
      })())(function(constants) {
        return bind7(optionalObjectMap("state")(object)(decodeValue))(function(state) {
          return bind7(optionalObjectMap("input")(object)(decodeValue))(function(input) {
            return bind7(decodeLimits(object))(function(limits) {
              return bind7(mapFlipped1(optionalBool("performanceMode")(object))(fromMaybe(false)))(function(performanceMode) {
                return bind7(optionalStringWithDefault("version")("1.0")(object))(function(version) {
                  return bind7(decodeFunctionSet(object))(function(v) {
                    var program = {
                      version,
                      constants,
                      functions: v.value0,
                      stateMachines: empty3,
                      entrypoint: v.value1,
                      exports: singleton6(v.value1)(v.value1),
                      metadata: {
                        description: "JSON CLI program"
                      },
                      typeTable: empty3,
                      capabilities: [],
                      verification: {
                        verified: false
                      }
                    };
                    return pure8({
                      program,
                      state,
                      input,
                      limits,
                      performanceMode
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
var runEffectStart = function(programSource) {
  return function(overridesSource) {
    var v = decodeProgramFile(programSource);
    if (v instanceof Left) {
      return effectFail("error")(v.value0);
    }
    ;
    if (v instanceof Right) {
      var v1 = decodeOverrides(overridesSource);
      if (v1 instanceof Left) {
        return effectFail("error")(v1.value0);
      }
      ;
      if (v1 instanceof Right) {
        var base = initialMachine(v.value0);
        var m0 = {
          config: base.config,
          counters: base.counters,
          events: base.events,
          labelCache: base.labelCache,
          outbox: base.outbox,
          program: base.program,
          proofTrace: base.proofTrace,
          scheduler: base.scheduler,
          trace: base.trace,
          input: union3(v1.value0.inputOv)(base.input),
          state: union3(v1.value0.stateOv)(base.state)
        };
        var v2 = runUntilQuiescent(m0);
        if (v2 instanceof Left) {
          return effectFail("failed")(renderVMError(v2.value0));
        }
        ;
        if (v2 instanceof Right) {
          return quiescedOutput(v2.value0);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 258, column 12 - line 260, column 38): " + [v2.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 252, column 19 - line 260, column 38): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 250, column 3 - line 260, column 38): " + [v.constructor.name]);
  };
};
var runEffectStep = function(programSource) {
  return function(overridesSource) {
    var failStr = function(status) {
      return function(msg) {
        return stringify(objectJson([new Tuple("status", id(status)), new Tuple("error", id(msg))]));
      };
    };
    var v = decodeProgramFile(programSource);
    if (v instanceof Left) {
      return failStr("error")(v.value0);
    }
    ;
    if (v instanceof Right) {
      var v1 = decodeOverrides(overridesSource);
      if (v1 instanceof Left) {
        return failStr("error")(v1.value0);
      }
      ;
      if (v1 instanceof Right) {
        var base = initialMachine(v.value0);
        var m0 = {
          config: base.config,
          counters: base.counters,
          events: base.events,
          labelCache: base.labelCache,
          outbox: base.outbox,
          program: base.program,
          proofTrace: base.proofTrace,
          scheduler: base.scheduler,
          trace: base.trace,
          input: union3(v1.value0.inputOv)(base.input),
          state: union3(v1.value0.stateOv)(base.state)
        };
        var v2 = runMachine(m0);
        if (v2 instanceof Left) {
          return failStr("failed")(renderVMError(v2.value0));
        }
        ;
        if (v2 instanceof Right) {
          return stringify(objectJson([new Tuple("status", id("completed")), new Tuple("steps", id(toNumber3(v2.value0.counters.steps))), new Tuple("result", valueToJson(mainResult(v2.value0))), new Tuple("state", stringMapToJson(v2.value0.state)), new Tuple("events", id(map16(taggedPayloadToJson)(orderedList(v2.value0.events)))), new Tuple("outbox", id(map16(taggedPayloadToJson)(orderedList(v2.value0.outbox))))]));
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 201, column 12 - line 210, column 14): " + [v2.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 194, column 19 - line 210, column 14): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 192, column 3 - line 210, column 14): " + [v.constructor.name]);
  };
};
var runJsonProgramResult = function(source) {
  var failed = function(msg) {
    return {
      ok: false,
      output: stringify(objectJson([new Tuple("status", id("failed")), new Tuple("error", id(msg))]))
    };
  };
  var v = decodeProgramFile(source);
  if (v instanceof Left) {
    return failed(v.value0);
  }
  ;
  if (v instanceof Right) {
    var v1 = validateProgram(v.value0.program);
    if (v1 instanceof Left) {
      return failed(renderVMError(v1.value0));
    }
    ;
    if (v1 instanceof Right) {
      var v2 = runMachine(initialMachine(v.value0));
      if (v2 instanceof Left) {
        return failed(renderVMError(v2.value0));
      }
      ;
      if (v2 instanceof Right) {
        return {
          ok: true,
          output: stringify(objectJson([new Tuple("status", id("completed")), new Tuple("steps", id(toNumber3(v2.value0.counters.steps))), new Tuple("result", valueToJson(mainResult(v2.value0))), new Tuple("state", stringMapToJson(v2.value0.state))]))
        };
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 160, column 11 - line 170, column 16): " + [v2.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 157, column 7 - line 170, column 16): " + [v1.constructor.name]);
  }
  ;
  throw new Error("Failed pattern match at FinVM.Encoding.Json (line 151, column 3 - line 170, column 16): " + [v.constructor.name]);
};
var runJsonProgram = function(source) {
  return runJsonProgramResult(source).output;
};
var allowedNodeStatus = ["online", "suspect", "offline", "unknown"];
var normalizeNodeStatus = function(status) {
  var $336 = elem4(status)(allowedNodeStatus);
  if ($336) {
    return status;
  }
  ;
  return "unknown";
};
var upsertNodeStatus = function(m) {
  return function(payload) {
    var nodes = (function() {
      var v = lookup8(nodeStateKey2)(m.state);
      if (v instanceof Just && v.value0 instanceof VRecord) {
        return v.value0.value0;
      }
      ;
      return empty3;
    })();
    var previous = (function() {
      var v = lookup8(payload.node)(nodes);
      if (v instanceof Just && v.value0 instanceof VRecord) {
        return v.value0.value0;
      }
      ;
      return empty3;
    })();
    var withReason = (function() {
      if (payload.reason instanceof Just) {
        return insert5("reason")(new VString(payload.reason.value0))(previous);
      }
      ;
      if (payload.reason instanceof Nothing) {
        return previous;
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 542, column 18 - line 544, column 26): " + [payload.reason.constructor.name]);
    })();
    var withTick = (function() {
      if (payload.lastSeenTick instanceof Just) {
        return insert5("lastSeenTick")(new VInt(fromInt(payload.lastSeenTick.value0)))(withReason);
      }
      ;
      if (payload.lastSeenTick instanceof Nothing) {
        return withReason;
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 545, column 16 - line 547, column 28): " + [payload.lastSeenTick.constructor.name]);
    })();
    var withHash = (function() {
      if (payload.lastStateHash instanceof Just) {
        return insert5("lastStateHash")(new VString(payload.lastStateHash.value0))(withTick);
      }
      ;
      if (payload.lastStateHash instanceof Nothing) {
        return withTick;
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 548, column 16 - line 550, column 26): " + [payload.lastStateHash.constructor.name]);
    })();
    var updated = insert5("status")(new VString(normalizeNodeStatus(payload.status)))(withHash);
    var nodes$prime = insert5(payload.node)(new VRecord(updated))(nodes);
    return {
      program: m.program,
      scheduler: m.scheduler,
      input: m.input,
      config: m.config,
      trace: m.trace,
      proofTrace: m.proofTrace,
      outbox: m.outbox,
      events: m.events,
      counters: m.counters,
      labelCache: m.labelCache,
      state: insert5(nodeStateKey2)(new VRecord(nodes$prime))(m.state)
    };
  };
};
var applyDisconnectDelivery = function(m) {
  return function(disc) {
    var step = function(scheduler) {
      return function(p) {
        var deadRemoteLinks = filter(function(r) {
          return r.node === disc.node;
        })(toUnfoldable23(p.remoteLinks));
        var deadRefs = mapMaybe(function(v2) {
          if (v2.value1 instanceof MonitorRemote && v2.value1.value0.node === disc.node) {
            return new Just(new Tuple(v2.value0, v2.value1.value0.pid));
          }
          ;
          return Nothing.value;
        })(toUnfoldable15(p.monitors));
        var v = $$null(deadRefs);
        if (v) {
          var v1 = $$null(deadRemoteLinks);
          if (v1) {
            return scheduler;
          }
          ;
          if (!v1) {
            var keptLinks = filter5(function(r) {
              return r.node !== disc.node;
            })(p.remoteLinks);
            if (p.trapExit) {
              var wakesMailbox = (function() {
                if (p.status instanceof ProcessWaiting && p.status.value0 instanceof WaitingForMessage) {
                  return true;
                }
                ;
                return false;
              })();
              var exits = map16(function(r) {
                return exitMessage(r.node + (":" + r.pid))(disc.reason);
              })(deadRemoteLinks);
              var p$prime = {
                monitors: p.monitors,
                trapExit: p.trapExit,
                callStack: p.callStack,
                children: p.children,
                createdSequence: p.createdSequence,
                error: p.error,
                frame: p.frame,
                "function": p["function"],
                links: p.links,
                metadata: p.metadata,
                parent: p.parent,
                pid: p.pid,
                result: p.result,
                stepsExecuted: p.stepsExecuted,
                mailbox: append1(p.mailbox)(exits),
                remoteLinks: keptLinks,
                status: (function() {
                  if (wakesMailbox) {
                    return ProcessReady.value;
                  }
                  ;
                  return p.status;
                })()
              };
              var s1 = updateProcess(scheduler)(p$prime);
              if (wakesMailbox) {
                return yieldProcess(s1)(p.pid);
              }
              ;
              return s1;
            }
            ;
            return updateProcess(scheduler)({
              pid: p.pid,
              "function": p["function"],
              frame: p.frame,
              callStack: p.callStack,
              mailbox: p.mailbox,
              links: p.links,
              monitors: p.monitors,
              parent: p.parent,
              children: p.children,
              trapExit: p.trapExit,
              metadata: p.metadata,
              result: p.result,
              error: p.error,
              createdSequence: p.createdSequence,
              stepsExecuted: p.stepsExecuted,
              remoteLinks: keptLinks,
              status: new ProcessExited(new ExitReason(disc.reason))
            });
          }
          ;
          throw new Error("Failed pattern match at FinVM.Encoding.Json (line 471, column 17 - line 492, column 129): " + [v1.constructor.name]);
        }
        ;
        if (!v) {
          var wakesMailbox = (function() {
            if (p.status instanceof ProcessWaiting && p.status.value0 instanceof WaitingForMessage) {
              return true;
            }
            ;
            if (p.status instanceof ProcessWaiting && p.status.value0 instanceof WaitingForMonitor) {
              return true;
            }
            ;
            return false;
          })();
          var keptLinks = filter5(function(r) {
            return r.node !== disc.node;
          })(p.remoteLinks);
          var exits = map16(function(r) {
            return exitMessage(r.node + (":" + r.pid))(disc.reason);
          })(deadRemoteLinks);
          var dropped = foldl2(function(acc) {
            return function(v12) {
              return $$delete4(v12.value0)(acc);
            };
          })(p.monitors)(deadRefs);
          var downs = map16(function(v12) {
            return downMessage2(v12.value0)(v12.value1)(disc.reason);
          })(deadRefs);
          var p$prime = {
            callStack: p.callStack,
            children: p.children,
            createdSequence: p.createdSequence,
            error: p.error,
            frame: p.frame,
            "function": p["function"],
            links: p.links,
            metadata: p.metadata,
            parent: p.parent,
            pid: p.pid,
            result: p.result,
            stepsExecuted: p.stepsExecuted,
            trapExit: p.trapExit,
            mailbox: append1(p.mailbox)(append1(downs)((function() {
              if (p.trapExit) {
                return exits;
              }
              ;
              return [];
            })())),
            monitors: dropped,
            remoteLinks: keptLinks,
            status: (function() {
              var $377 = $$null(deadRemoteLinks) || p.trapExit;
              if ($377) {
                if (wakesMailbox) {
                  return ProcessReady.value;
                }
                ;
                return p.status;
              }
              ;
              return new ProcessExited(new ExitReason(disc.reason));
            })()
          };
          var s1 = updateProcess(scheduler)(p$prime);
          if (wakesMailbox) {
            return yieldProcess(s1)(p.pid);
          }
          ;
          return s1;
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 470, column 10 - line 514, column 74): " + [v.constructor.name]);
      };
    };
    var processes = values(m.scheduler.processes);
    return upsertNodeStatus({
      program: m.program,
      state: m.state,
      input: m.input,
      config: m.config,
      trace: m.trace,
      proofTrace: m.proofTrace,
      outbox: m.outbox,
      events: m.events,
      counters: m.counters,
      labelCache: m.labelCache,
      scheduler: foldl2(step)(m.scheduler)(fromFoldable23(processes))
    })({
      node: disc.node,
      status: "offline",
      reason: new Just(disc.reason),
      lastSeenTick: new Just(m.scheduler.logicalTick),
      lastStateHash: Nothing.value
    });
  };
};
var applyNodeStatusDelivery = function(m) {
  return function(payload) {
    return upsertNodeStatus(m)(payload);
  };
};
var applyDelivery = function(m) {
  return function(d) {
    if (d instanceof DeliveryNodeStatus) {
      return applyNodeStatusDelivery(m)(d.value0);
    }
    ;
    if (d instanceof DeliveryDisconnect) {
      return applyDisconnectDelivery(m)(d.value0);
    }
    ;
    if (d instanceof DeliveryMailboxMessage) {
      var v = findProcess(m.scheduler)(d.value0.pid);
      if (v instanceof Nothing) {
        return m;
      }
      ;
      if (v instanceof Just) {
        var mailbox$prime = snoc(v.value0.mailbox)(d.value0.message);
        var wokenFor = (function() {
          if (v.value0.status instanceof ProcessWaiting && v.value0.status.value0 instanceof WaitingForMessage) {
            return true;
          }
          ;
          if (v.value0.status instanceof ProcessWaiting && v.value0.status.value0 instanceof WaitingOnMatch) {
            return mailboxHasVariantTag2(v.value0.status.value0.value0)(mailbox$prime);
          }
          ;
          return false;
        })();
        var p$prime = {
          callStack: v.value0.callStack,
          children: v.value0.children,
          createdSequence: v.value0.createdSequence,
          error: v.value0.error,
          frame: v.value0.frame,
          "function": v["value0"]["function"],
          links: v.value0.links,
          metadata: v.value0.metadata,
          monitors: v.value0.monitors,
          parent: v.value0.parent,
          pid: v.value0.pid,
          remoteLinks: v.value0.remoteLinks,
          result: v.value0.result,
          stepsExecuted: v.value0.stepsExecuted,
          trapExit: v.value0.trapExit,
          mailbox: mailbox$prime,
          status: (function() {
            if (wokenFor) {
              return ProcessReady.value;
            }
            ;
            return v.value0.status;
          })()
        };
        var s1 = updateProcess(m.scheduler)(p$prime);
        var s2 = (function() {
          if (wokenFor) {
            return yieldProcess(s1)(d.value0.pid);
          }
          ;
          return s1;
        })();
        return {
          program: m.program,
          state: m.state,
          input: m.input,
          config: m.config,
          trace: m.trace,
          proofTrace: m.proofTrace,
          outbox: m.outbox,
          events: m.events,
          counters: m.counters,
          labelCache: m.labelCache,
          scheduler: s2
        };
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 398, column 37 - line 413, column 30): " + [v.constructor.name]);
    }
    ;
    if (d instanceof DeliveryEffectReply) {
      var v = findProcess(m.scheduler)(d.value0.pid);
      if (v instanceof Nothing) {
        return m;
      }
      ;
      if (v instanceof Just) {
        var reply = new VVariant("EffectReply", new VRecord(fromFoldable10([new Tuple("key", new VString(d.value0.key)), new Tuple("value", d.value0.result)])));
        var mailbox$prime = snoc(v.value0.mailbox)(reply);
        var wokenFor = (function() {
          if (v.value0.status instanceof ProcessWaiting && v.value0.status.value0 instanceof WaitingOnEffect) {
            return v.value0.status.value0.value0 === d.value0.key;
          }
          ;
          if (v.value0.status instanceof ProcessWaiting && v.value0.status.value0 instanceof WaitingOnMatch) {
            return mailboxHasVariantTag2(v.value0.status.value0.value0)(mailbox$prime);
          }
          ;
          return false;
        })();
        var p$prime = {
          callStack: v.value0.callStack,
          children: v.value0.children,
          createdSequence: v.value0.createdSequence,
          error: v.value0.error,
          frame: v.value0.frame,
          "function": v["value0"]["function"],
          links: v.value0.links,
          metadata: v.value0.metadata,
          monitors: v.value0.monitors,
          parent: v.value0.parent,
          pid: v.value0.pid,
          remoteLinks: v.value0.remoteLinks,
          result: v.value0.result,
          stepsExecuted: v.value0.stepsExecuted,
          trapExit: v.value0.trapExit,
          mailbox: mailbox$prime,
          status: (function() {
            if (wokenFor) {
              return ProcessReady.value;
            }
            ;
            return v.value0.status;
          })()
        };
        var s1 = updateProcess(m.scheduler)(p$prime);
        var s2 = (function() {
          if (wokenFor) {
            return yieldProcess(s1)(d.value0.pid);
          }
          ;
          return s1;
        })();
        return {
          program: m.program,
          state: m.state,
          input: m.input,
          config: m.config,
          trace: m.trace,
          proofTrace: m.proofTrace,
          outbox: m.outbox,
          events: m.events,
          counters: m.counters,
          labelCache: m.labelCache,
          scheduler: s2
        };
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 414, column 34 - line 430, column 30): " + [v.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at FinVM.Encoding.Json (line 395, column 21 - line 430, column 30): " + [d.constructor.name]);
  };
};
var runEffectResume = function(programSource) {
  return function(snapshotSource) {
    return function(deliveriesSource) {
      var v = decodeProgramFile(programSource);
      if (v instanceof Left) {
        return effectFail("error")(v.value0);
      }
      ;
      if (v instanceof Right) {
        var v1 = jsonParser(snapshotSource);
        if (v1 instanceof Left) {
          return effectFail("error")("snapshot parse: " + v1.value0);
        }
        ;
        if (v1 instanceof Right) {
          var v2 = decodeMachineState(initialMachine(v.value0))(v1.value0);
          if (v2 instanceof Left) {
            return effectFail("error")("snapshot decode: " + v2.value0);
          }
          ;
          if (v2 instanceof Right) {
            var v3 = decodeDeliveries(deliveriesSource);
            if (v3 instanceof Left) {
              return effectFail("error")(v3.value0);
            }
            ;
            if (v3 instanceof Right) {
              var m2 = foldl2(applyDelivery)(v2.value0)(v3.value0);
              var v4 = runUntilQuiescent(m2);
              if (v4 instanceof Left) {
                return effectFail("failed")(renderVMError(v4.value0));
              }
              ;
              if (v4 instanceof Right) {
                return quiescedOutput(v4.value0);
              }
              ;
              throw new Error("Failed pattern match at FinVM.Encoding.Json (line 276, column 16 - line 278, column 42): " + [v4.constructor.name]);
            }
            ;
            throw new Error("Failed pattern match at FinVM.Encoding.Json (line 272, column 21 - line 278, column 42): " + [v3.constructor.name]);
          }
          ;
          throw new Error("Failed pattern match at FinVM.Encoding.Json (line 270, column 25 - line 278, column 42): " + [v2.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at FinVM.Encoding.Json (line 268, column 19 - line 278, column 42): " + [v1.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at FinVM.Encoding.Json (line 266, column 3 - line 278, column 42): " + [v.constructor.name]);
    };
  };
};
export {
  decodeProgramFile,
  decodeValue,
  errorJson,
  runEffectResume,
  runEffectStart,
  runEffectStep,
  runJsonProgram,
  runJsonProgramResult,
  valueToJson
};
