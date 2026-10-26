'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../fourier/transform-math.js');
let checks = 0;
function near(actual, expected, tolerance = 1e-11, message = '') {
  checks++;
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${message}: ${actual} ≠ ${expected} (tolerance ${tolerance})`);
}
function ok(condition, message) {checks++; assert.ok(condition, message);}
function rejects(call, message) {checks++; assert.throws(call, undefined, message);}
function nearComplex(actual, expected, tolerance, message) {
  near(actual.re, expected.re, tolerance, message + ' (real)');
  near(actual.im, expected.im, tolerance, message + ' (imaginary)');
}
function midpoint(fn, lower, upper, intervals = 40000) {
  const step = (upper - lower) / intervals;
  let sum = 0;
  for (let i = 0; i < intervals; i++) sum += fn(lower + (i + 0.5) * step);
  return sum * step;
}
function transformByIntegral(fn, omega, lower, upper) {
  return {
    re: midpoint(t => fn(t) * Math.cos(omega * t), lower, upper),
    im: midpoint(t => -fn(t) * Math.sin(omega * t), lower, upper)
  };
}

// The same module must work both as an isolated browser script and a Node module.
const browser = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../fourier/transform-math.js'), 'utf8'), browser);
ok(typeof browser.window.FourierTransformMath.spectrum === 'function', 'browser API export');
near(browser.window.FourierTransformMath.rectSpectrum(0), 2);

near(M.sinc(0), 1);
near(M.sinc(1e-8), 1, 1e-15);
for (const k of [-8, -1, 1, 7]) near(M.sinc(k), 0, 0);
near(M.sinc(0.5), 2 / Math.PI);
near(M.sinc(-0.5), 2 / Math.PI);
near(M.rectSpectrum(0, 3, 2), 6);
near(M.rectSpectrum(Math.PI), 0, 0);
near(M.baseSpectrum('triangle', 0).re, 1);
near(M.baseSpectrum('triangle', 2 * Math.PI).re, 0, 0);
nearComplex(M.baseSpectrum('exponential', 1), {re: 0.5, im: -0.5}, 1e-15, 'causal exponential');
near(M.baseTime('rect', 1), 0.5, 0);
near(M.baseTime('rect', -1), 0.5, 0);
near(M.baseTime('exponential', 0), 0.5, 0);
near(M.baseTime('exponential', -1), 0, 0);

// Verify each transform pair by directly integrating x(t)e^(−jωt).
for (const kind of ['rect', 'triangle', 'exponential']) {
  const lower = kind === 'exponential' ? 0 : -1;
  const upper = kind === 'exponential' ? 32 : 1;
  for (const omega of [0, 0.7, 2.3, Math.PI, -4.2]) {
    const numerical = transformByIntegral(t => M.baseTime(kind, t), omega, lower, upper);
    nearComplex(M.baseSpectrum(kind, omega), numerical, 4e-7, kind + ' Fourier integral at ' + omega);
  }
}

// Verify the combined transformation against time-domain integration, not its own formula.
const params = {amplitude: -1.3, scale: 1.7, shift: 0.65};
for (const kind of ['rect', 'triangle', 'exponential']) {
  const lower = params.shift + (kind === 'exponential' ? 0 : -1 / params.scale);
  const upper = params.shift + (kind === 'exponential' ? 32 / params.scale : 1 / params.scale);
  for (const omega of [0, 1.2, -3.1]) {
    const numerical = transformByIntegral(t => M.timeSignal(kind, t, params), omega, lower, upper);
    nearComplex(M.spectrum(kind, omega, params), numerical, 3e-7, 'transformed ' + kind);
  }
  const energy = midpoint(t => M.timeSignal(kind, t, params) ** 2, lower, upper);
  near(M.signalEnergy(kind, params), energy, 4e-7, kind + ' time-domain energy');
  near(M.signalArea(kind, params), midpoint(t => M.timeSignal(kind, t, params), lower, upper), 1e-7, kind + ' area');
  near(M.spectrum(kind, 0, params).re, M.signalArea(kind, params), 1e-13, 'X(0) equals signed area');
  near(M.signalEnergy(kind, {scale: 2}), M.signalEnergy(kind) / 2, 1e-13, 'compression halves energy');
}

// A fixed-width pulse has TX_k = X(kω0); it does not keep its duty ratio fixed.
for (const period of [4, 8, 16, 32]) {
  for (const k of [-9, -3, -1, 0, 1, 5, 12]) {
    near(period * M.pulseCoefficient(1.2, period, 2, k),
      M.rectSpectrum(k * M.TAU / period, 2, 1.2), 1e-13, 'bridge normalization');
  }
  near(M.periodicPulse(0, {period, width: 2}), 1, 0);
  near(M.periodicPulse(1, {period, width: 2}), 0.5, 0);
  near(M.periodicPulse(-1, {period, width: 2}), 0.5, 0);
  near(M.periodicPulse(period - 0.25, {period, width: 2}), 1, 0);
  near(M.periodicPulse(-period - 0.25, {period, width: 2}), 1, 0);
}
for (const t of [-4, -2, 0, 2, 4, 11.3]) near(M.periodicPulse(t, {amplitude: 3, period: 4, width: 4}), 3, 0);
near(M.pulseCoefficient(2, 4, 2, 0), 1);
near(M.pulseCoefficient(2, 4, 2, 1), 2 / Math.PI);
near(M.pulseCoefficient(2, 4, 2, 2), 0, 0);

// Parseval: known total powers, proper finite sums, and a decreasing residual.
const dcOnly = M.pulsePower(2, 4, 2, 0);
near(dcOnly.total, 2, 0);
near(dcOnly.partial, 1, 0);
near(dcOnly.residual, 1, 0);
near(M.pulsePower(2, 4, 2, 1).partial, 1 + 8 / Math.PI ** 2, 1e-13);
let previousPower = 0;
for (const N of [0, 1, 2, 3, 5, 15, 49]) {
  const powers = M.pulsePower(2, 4, 2, N);
  ok(powers.partial >= previousPower && powers.partial <= powers.total, 'monotone partial power');
  near(powers.partial + powers.residual, powers.total, 1e-13);
  previousPower = powers.partial;
}
for (const N of [0, 1, 49]) {
  const powers = M.pulsePower(-2, 4, 4, N);
  near(powers.total, 4, 0);
  near(powers.partial, 4, 0);
  near(powers.residual, 0, 0);
}
const terms = [{k: 0, re: 1, im: 0}, {k: 1, re: 0.5, im: -0.5}, {k: -1, re: 0.5, im: 0.5}];
near(M.finiteSeriesPower(terms), 2, 0);
near(M.finiteSeriesPower(terms, 0), 1, 0);
near(M.finiteSeriesPower([{k: 1, re: 1, im: 2}, {k: 1, re: -1, im: -2}]), 0, 0);
const fullSignal = t => terms.reduce((sum, z) => sum + z.re * Math.cos(z.k * M.TAU * t) - z.im * Math.sin(z.k * M.TAU * t), 0);
near(M.finiteSeriesPower(terms), midpoint(t => fullSignal(t) ** 2, 0, 1), 1e-11, 'Parseval versus one-period integral');
const spectralTriangleEnergy = midpoint(omega => M.baseSpectrum('triangle', omega).re ** 2 / M.TAU, -80, 80, 80000);
near(spectralTriangleEnergy, 2 / 3, 3e-6, 'CT Parseval including finite-tail tolerance');

// The normalized first-order lowpass has known DC and cutoff responses.
nearComplex(M.lowpass(0, 2), {re: 1, im: 0}, 0, 'DC gain');
for (const cutoff of [0.35, 1, 3]) {
  const atCutoff = M.lowpass(cutoff, cutoff);
  near(atCutoff.magnitude, 1 / Math.sqrt(2), 1e-15);
  near(atCutoff.phase, -Math.PI / 4, 1e-15);
  near(M.lowpass(-cutoff, cutoff).im, -atCutoff.im, 1e-15);
  for (const t of [-1, 0, 0.2, 1.3, 2, 4.7]) {
    const numerical = t <= 0 ? 0 : midpoint(tau => cutoff * Math.exp(-cutoff * (t - tau)), 0, Math.min(t, 2));
    near(M.pulseOutput(t, 2, cutoff), numerical, 3e-9, 'pulse output versus convolution integral');
  }
  near(M.pulseOutput(2 - 1e-9, 2, cutoff), M.pulseOutput(2 + 1e-9, 2, cutoff), 1e-8, 'continuous pulse response');
}
const components = [{amplitude: 1, omega: 1, phase: 0.25}, {amplitude: 0.6, omega: 5, phase: -0.4}, {amplitude: 0.2, omega: 0, phase: 0}];
for (const cutoff of [0.5, 2]) {
  for (const t of [0, 0.7]) {
    const numerical = midpoint(tau => cutoff * Math.exp(-cutoff * tau) * M.sinusoidSignal(t - tau, components), 0, 32 / cutoff, 80000);
    near(M.sinusoidOutput(t, components, cutoff), numerical, 4e-7, 'steady-state output versus convolution');
  }
}
near(M.sinusoidSignal(0, [{amplitude: 1, omega: 1, phase: 0}, {amplitude: 1, omega: 1, phase: Math.PI}]), 0, 1e-15);
near(M.pulseOutput(1e-12, 2, 1), 1e-12, 1e-23, 'small-time exponential accuracy');
ok(Number.isFinite(M.lowpass(1e308, 1).magnitude), 'large finite frequency remains defined');
ok(M.baseSpectrum('exponential', 1e308).im < 0, 'small valid imaginary values are retained');

for (const call of [
  () => M.sinc(NaN), () => M.rectSpectrum(Infinity), () => M.baseTime('missing', 0),
  () => M.spectrum('rect', 1, {scale: 0}), () => M.timeSignal('rect', 0, {scale: -1}),
  () => M.signalEnergy('rect', {amplitude: Infinity}), () => M.lowpass(1, 0),
  () => M.pulseCoefficient(1, 2, 3, 0), () => M.pulseCoefficient(1, 4, 2, 0.5),
  () => M.periodicPulse(0, {width: 0}), () => M.pulseOutput(1, -1, 1),
  () => M.pulsePower(1, 4, 2, -1), () => M.pulsePower(1, 4, 2, Infinity),
  () => M.finiteSeriesPower([{k: 0, re: NaN, im: 0}]),
  () => M.sinusoidSignal(0, [{omega: Infinity}])
]) rejects(call, 'invalid numerical inputs rejected');

console.log(`Continuous-time Fourier math passed (${checks} checks)`);
