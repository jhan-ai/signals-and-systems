/* Closed-form continuous-time Fourier calculations: X(ω) = ∫ x(t)e^(−jωt) dt. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FourierTransformMath = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';

  const TAU = 2 * Math.PI;
  const EPSILON = Number.EPSILON;
  const ENERGY = Object.freeze({rect: 2, triangle: 2 / 3, exponential: 1 / 2});
  const AREA = Object.freeze({rect: 2, triangle: 1, exponential: 1});

  function finite(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(name + ' must be a finite number');
    }
    return value;
  }

  function positive(value, name) {
    finite(value, name);
    if (value <= 0) throw new RangeError(name + ' must be positive');
    return value;
  }

  function integer(value, name) {
    if (!Number.isSafeInteger(value)) throw new RangeError(name + ' must be a safe integer');
    return value;
  }

  function order(value, allowInfinity = false) {
    if (allowInfinity && value === Infinity) return value;
    integer(value, 'N');
    if (value < 0) throw new RangeError('N must be nonnegative');
    return value;
  }

  function result(value) {
    if (!Number.isFinite(value)) throw new RangeError('The result exceeds the finite numerical range');
    return Object.is(value, -0) ? 0 : value;
  }

  function complex(re, im) {
    return {re: result(re), im: result(im)};
  }

  function signalKind(kind) {
    if (!Object.prototype.hasOwnProperty.call(ENERGY, kind)) {
      throw new RangeError('Unknown continuous-time signal');
    }
    return kind;
  }

  function parameters(params = {}) {
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new TypeError('Signal parameters must be an object');
    }
    const {amplitude = 1, scale = 1, shift = 0} = params;
    finite(amplitude, 'amplitude');
    positive(scale, 'scale');
    finite(shift, 'shift');
    return {amplitude, scale, shift};
  }

  function pulseParameters(amplitude, period, width) {
    finite(amplitude, 'amplitude');
    positive(period, 'period');
    positive(width, 'width');
    if (width > period) throw new RangeError('Pulse width must not exceed its period');
  }

  function sinc(value) {
    finite(value, 'sinc argument');
    if (value === 0) return 1;
    if (Number.isInteger(value)) return 0;
    // The expansion avoids loss of precision near the removable singularity.
    if (Math.abs(value) < 1e-4) {
      const square = (Math.PI * value) ** 2;
      return 1 - square / 6 + square * square / 120;
    }
    // Reduce the sine argument without rounding small, valid spectral values to zero.
    return result((Math.sin(Math.PI * (value % 2)) / Math.PI) / value);
  }

  function rectSpectrum(omega, width = 2, amplitude = 1) {
    finite(omega, 'omega');
    positive(width, 'width');
    finite(amplitude, 'amplitude');
    if (amplitude === 0) return 0;
    return result(amplitude * width * sinc(result(omega * width / TAU)));
  }

  function pulseCoefficient(amplitude, period, width, k) {
    pulseParameters(amplitude, period, width);
    integer(k, 'k');
    const duty = width / period;
    return result(amplitude * duty * sinc(k * duty));
  }

  function periodicPulse(t, {amplitude = 1, period = 4, width = 2} = {}) {
    finite(t, 't');
    pulseParameters(amplitude, period, width);
    if (width === period) return amplitude;
    const remainder = Math.abs(t % period);
    const distance = Math.min(remainder, period - remainder);
    if (Math.abs(distance - width / 2) <= 16 * EPSILON * period) return amplitude / 2;
    return distance < width / 2 ? amplitude : 0;
  }

  // Values at jumps use the midpoint convention. They do not change CT integrals.
  function baseTime(kind, t) {
    signalKind(kind);
    finite(t, 't');
    if (kind === 'rect') return Math.abs(t) === 1 ? 0.5 : Math.abs(t) < 1 ? 1 : 0;
    if (kind === 'triangle') return Math.max(1 - Math.abs(t), 0);
    return t < 0 ? 0 : t === 0 ? 0.5 : Math.exp(-t);
  }

  function baseSpectrum(kind, omega) {
    signalKind(kind);
    finite(omega, 'omega');
    if (kind === 'rect') return complex(rectSpectrum(omega), 0);
    if (kind === 'triangle') return complex(sinc(omega / TAU) ** 2, 0);
    // 1 / (1 + jω), evaluated without overflowing ω² at large finite frequencies.
    if (Math.abs(omega) <= 1) {
      const denominator = 1 + omega * omega;
      return complex(1 / denominator, -omega / denominator);
    }
    const inverse = 1 / omega;
    const denominator = 1 + inverse * inverse;
    return complex(inverse * inverse / denominator, -inverse / denominator);
  }

  function timeSignal(kind, t, params = {}) {
    finite(t, 't');
    const {amplitude, scale, shift} = parameters(params);
    return result(amplitude * baseTime(kind, result(scale * (t - shift))));
  }

  // y(t) = A x₀(a(t − t₀)), a > 0; Y(ω) = (A/a) X₀(ω/a)e^(−jωt₀).
  function spectrum(kind, omega, params = {}) {
    finite(omega, 'omega');
    const {amplitude, scale, shift} = parameters(params);
    const original = baseSpectrum(kind, result(omega / scale));
    const multiplier = result(amplitude / scale);
    const angle = result(-omega * shift);
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    return complex(
      multiplier * (original.re * cosine - original.im * sine),
      multiplier * (original.re * sine + original.im * cosine)
    );
  }

  function signalEnergy(kind, params = {}) {
    signalKind(kind);
    const {amplitude, scale} = parameters(params);
    return result(amplitude * amplitude / scale * ENERGY[kind]);
  }

  function signalArea(kind, params = {}) {
    signalKind(kind);
    const {amplitude, scale} = parameters(params);
    return result(amplitude / scale * AREA[kind]);
  }

  function lowpass(omega, cutoff = 1) {
    finite(omega, 'omega');
    positive(cutoff, 'cutoff');
    let re, im;
    if (Math.abs(omega) <= cutoff) {
      const ratio = omega / cutoff, denominator = 1 + ratio * ratio;
      re = 1 / denominator;
      im = -ratio / denominator;
    } else {
      const ratio = cutoff / omega, denominator = 1 + ratio * ratio;
      re = ratio * ratio / denominator;
      im = -ratio / denominator;
    }
    return {...complex(re, im), magnitude: Math.hypot(re, im), phase: result(Math.atan2(-omega, cutoff))};
  }

  function componentsChecked(components) {
    if (!Array.isArray(components)) throw new TypeError('components must be an array');
    return components.map(component => {
      if (!component || typeof component !== 'object') throw new TypeError('Invalid sinusoid component');
      const {amplitude = 1, omega, phase = 0} = component;
      finite(amplitude, 'component amplitude');
      finite(omega, 'component omega');
      finite(phase, 'component phase');
      return {amplitude, omega, phase};
    });
  }

  function sinusoidSignal(t, components = []) {
    finite(t, 't');
    return result(componentsChecked(components).reduce((sum, component) => {
      return sum + component.amplitude * Math.cos(result(component.omega * t + component.phase));
    }, 0));
  }

  function sinusoidOutput(t, components = [], cutoff = 1) {
    finite(t, 't');
    positive(cutoff, 'cutoff');
    return result(componentsChecked(components).reduce((sum, component) => {
      const response = lowpass(component.omega, cutoff);
      const phase = result(component.omega * t + component.phase + response.phase);
      return sum + component.amplitude * response.magnitude * Math.cos(phase);
    }, 0));
  }

  // Input u(t) − u(t − width), impulse response cutoff·e^(−cutoff·t)u(t).
  function pulseOutput(t, width = 2, cutoff = 1) {
    finite(t, 't');
    positive(width, 'width');
    positive(cutoff, 'cutoff');
    if (t <= 0) return 0;
    if (t < width) return result(-Math.expm1(-cutoff * t));
    return result(-Math.expm1(-cutoff * width) * Math.exp(-cutoff * (t - width)));
  }

  function pulsePower(amplitude, period, width, N) {
    pulseParameters(amplitude, period, width);
    order(N);
    // The public UI uses N ≤ 49. Bound work for accidental unbounded callers as well.
    if (N > 100000) throw new RangeError('N exceeds the supported finite sum range');
    const total = result(amplitude * amplitude * (width / period));
    let partial = pulseCoefficient(amplitude, period, width, 0) ** 2;
    let correction = 0;
    for (let k = 1; k <= N; k++) {
      const term = 2 * pulseCoefficient(amplitude, period, width, k) ** 2 - correction;
      const next = partial + term;
      correction = (next - partial) - term;
      partial = next;
    }
    partial = result(partial);
    if (partial > total && partial - total <= 32 * EPSILON * Math.max(1, total)) partial = total;
    return {total, partial, residual: result(Math.max(0, total - partial))};
  }

  function finiteSeriesPower(terms, N = Infinity) {
    if (!Array.isArray(terms)) throw new TypeError('terms must be an array');
    order(N, true);
    const coefficients = new Map();
    for (const term of terms) {
      if (!term || typeof term !== 'object') throw new TypeError('Invalid Fourier coefficient');
      const {k, re, im} = term;
      integer(k, 'coefficient k');
      finite(re, 'coefficient real part');
      finite(im, 'coefficient imaginary part');
      if (Math.abs(k) > N) continue;
      const previous = coefficients.get(k) || {re: 0, im: 0};
      coefficients.set(k, complex(previous.re + re, previous.im + im));
    }
    let power = 0;
    for (const value of coefficients.values()) power += value.re ** 2 + value.im ** 2;
    return result(power);
  }

  return Object.freeze({
    TAU, sinc, rectSpectrum, pulseCoefficient, periodicPulse,
    baseTime, baseSpectrum, timeSignal, spectrum, signalEnergy, signalArea,
    lowpass, sinusoidSignal, sinusoidOutput, pulseOutput, pulsePower, finiteSeriesPower
  });
});
