/* Integration checks for the visible continuous-time Fourier experiments. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const errors = [], blobs = [], downloads = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.cause?.stack || error.message));
  const dom = await JSDOM.fromFile(path.join(__dirname, '../fourier/index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.URL.createObjectURL = blob => {
        blobs.push(blob);
        return `blob:fourier-test/${blobs.length}`;
      };
      window.URL.revokeObjectURL = () => {};
      const click = window.HTMLAnchorElement.prototype.click;
      window.HTMLAnchorElement.prototype.click = function () {
        if (this.download) downloads.push({ name: this.download, href: this.href });
        else click.call(this);
      };
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  const w = dom.window, d = w.document;
  const $ = id => d.getElementById(id);
  let checks = 0;
  const ok = (value, message) => { checks++; assert.ok(value, message); };
  const near = (actual, expected, message, tolerance = 1e-9) => {
    ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
      `${message}: ${actual} versus ${expected}`);
  };
  const click = id => { ok($(id), `control exists: ${id}`); $(id).click(); };
  const input = (id, value) => {
    const control = $(id);
    ok(control, `input exists: ${id}`);
    control.value = String(value);
    control.dispatchEvent(new w.Event(control.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };
  const snapshot = () => w.FourierTransformLab.snapshot();
  const trace = (chart, name) => $(chart).querySelector(`path[data-ft-trace="${name}"]`)?.getAttribute('d');
  function valid(label) {
    const host = $('fourier-transform-lab');
    ok(!/NaN|Infinity|undefined/.test(host.textContent), `${label}: finite labels`);
    for (const svg of host.querySelectorAll('svg')) {
      ok(svg.getAttribute('viewBox'), `${label}: scalable SVG`);
      ok(svg.querySelector('title') || svg.getAttribute('aria-label'), `${label}: accessible SVG name`);
    }
    const svgAttributes = [...host.querySelectorAll('svg *')]
      .flatMap(item => [...item.attributes].map(attribute => attribute.value)).join(' ');
    ok(!/NaN|Infinity|undefined/.test(svgAttributes), `${label}: finite SVG coordinates`);
    const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
    ok(ids.length === new Set(ids).size, `${label}: unique document IDs`);
  }

  ok(w.FourierTransformLab && w.FourierSections, 'both lesson sections initialize');
  ok(!$('fourier-series-section').hidden && $('fourier-transform-section').hidden, 'existing series is the initial section');
  ok($('section-series').getAttribute('aria-selected') === 'true', 'series tab announces initial state');
  click('section-transform');
  ok($('fourier-series-section').hidden && !$('fourier-transform-section').hidden, 'top-level transform selection');
  ok($('section-transform').getAttribute('aria-selected') === 'true', 'transform selection announced');
  ok(snapshot().tab === 'bridge', 'transform begins with series-to-transform connection');
  ok(d.querySelectorAll('.ft-tabs [role="tab"]').length === 3, 'three focused transform experiments');

  // A fixed pulse is repeated farther apart; its width must not grow with T.
  input('ft-period', 16);
  let s = snapshot();
  near(s.bridge.period, 16, 'period control');
  near(s.bridge.width, 2, 'single-pulse width remains fixed');
  near(s.bridge.omega0, Math.PI / 8, 'line spacing is 2π/T');
  near(s.bridge.coefficient0, 1 / 8, 'actual DC coefficient decreases with period');
  near(s.bridge.normalized0, 2, 'TX0 remains the single pulse area');
  const normalizedSpectrum = $('ft-bridge-spectrum').innerHTML;
  input('ft-normalization', 'raw');
  ok(snapshot().bridge.normalization === 'raw', 'raw coefficient mode selected');
  ok($('ft-bridge-spectrum').innerHTML !== normalizedSpectrum, 'raw coefficients change the drawn spectrum');
  const dcStem = () => {
    const stems = $('ft-bridge-spectrum').querySelectorAll('[data-ft-trace="coefficients"] line');
    const line = stems[Math.floor(stems.length / 2)];
    return { baseline: Number(line.getAttribute('y1')), length: Math.abs(Number(line.getAttribute('y1')) - Number(line.getAttribute('y2'))) };
  };
  const raw16 = dcStem();
  input('ft-period', 32);
  near(snapshot().bridge.width, 2, 'pulse width stays fixed at largest T');
  near(snapshot().bridge.coefficient0, 1 / 16, 'largest T has smaller actual coefficients');
  near(dcStem().baseline, raw16.baseline, 'raw spectrum keeps its vertical axis fixed');
  near(dcStem().length, raw16.length / 2, 'actual coefficient visibly shrinks when T doubles');
  valid('bridge endpoints');
  click('ft-reset-bridge');
  ok(snapshot().bridge.normalization === 'normalized', 'bridge reset returns to normalized comparison');

  // These inspect actual SVG output as well as the parameter readout.
  click('ft-tab-properties');
  click('ft-reset-properties');
  near(snapshot().properties.originalEnergy, 2, 'unit-height width-two pulse energy');
  const magnitudeBeforeShift = trace('ft-properties-magnitude', 'transformed');
  const phaseBeforeShift = trace('ft-properties-phase', 'transformed');
  const timeBeforeShift = trace('ft-properties-time', 'transformed');
  ok(magnitudeBeforeShift && phaseBeforeShift && timeBeforeShift, 'three linked transformed traces are drawn');
  input('ft-shift', 1);
  near(snapshot().properties.transformedEnergy, 2, 'delay preserves energy');
  near(snapshot().properties.transformedArea, 2, 'delay preserves area');
  ok(trace('ft-properties-magnitude', 'transformed') === magnitudeBeforeShift, 'delay leaves the magnitude graph unchanged');
  ok(trace('ft-properties-phase', 'transformed') !== phaseBeforeShift, 'delay changes the phase graph');
  ok((trace('ft-properties-phase', 'transformed').match(/M/g) || []).length > 1, 'phase trace breaks at undefined values or phase-wrap discontinuities');
  ok(trace('ft-properties-time', 'transformed') !== timeBeforeShift, 'delay moves the time graph');
  click('ft-preset-compress');
  near(snapshot().properties.scale, 2, 'compression preset');
  near(snapshot().properties.transformedEnergy, 1, 'time compression halves pulse energy');
  near(snapshot().properties.transformedArea, 1, 'time compression halves zero-frequency transform');
  input('ft-amplitude', 2);
  near(snapshot().properties.transformedEnergy, 4, 'amplitude doubles while energy scales quadratically');
  near(snapshot().properties.transformedArea, 2, 'area scales linearly with amplitude');
  click('ft-preset-shift');
  near(snapshot().properties.shift, 1, 'one-second shift preset');
  for (const [kind, baseEnergy, baseArea] of [['rect', 2, 2], ['triangle', 2 / 3, 1], ['exponential', 1 / 2, 1]]) {
    click('ft-reset-properties');
    input('ft-kind', kind);
    near(snapshot().properties.originalEnergy, baseEnergy, `${kind}: original energy`);
    near(snapshot().properties.originalArea, baseArea, `${kind}: original area`);
    for (const [scale, shift, amplitude] of [[0.5, -2, 0.5], [3, 2, 2]]) {
      input('ft-scale', scale); input('ft-shift', shift); input('ft-amplitude', amplitude);
      near(snapshot().properties.transformedEnergy, baseEnergy * amplitude ** 2 / scale, `${kind}: extreme-parameter energy`);
      valid(`${kind} a=${scale}`);
    }
  }

  // Frequency response affects each sinusoid's amplitude and phase.
  click('ft-tab-response');
  click('ft-reset-response');
  input('ft-cutoff', 1);
  s = snapshot();
  ok(s.response.mode === 'sinusoids', 'response default uses sinusoidal steady state');
  const first = s.response.components.find(component => component.omega === 1);
  const second = s.response.components.find(component => component.omega === 5);
  near(first.gain, 1 / Math.sqrt(2), 'first frequency gain');
  near(first.outputPhase, -Math.PI / 4, 'first frequency phase shift');
  near(second.outputAmplitude, 0.5 / Math.sqrt(26), 'second frequency output amplitude');
  const sinusoidOutput = trace('ft-response-time', 'output');
  input('ft-input-mode', 'pulse');
  ok(snapshot().response.mode === 'pulse', 'causal pulse mode selected');
  ok(trace('ft-response-time', 'output') !== sinusoidOutput, 'switching input changes time-domain output');
  input('ft-cutoff', 0.25); valid('slow pulse response');
  input('ft-cutoff', 5); valid('fast pulse response');
  input('ft-input-mode', 'sinusoids');
  ok(snapshot().response.components.find(component => component.omega === 1).gain > first.gain, 'raising cutoff passes more of the same input component');

  // The new and old keyboard tab systems must not capture each other's events.
  $('ft-tab-response').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  ok(snapshot().tab === 'bridge', 'transform keyboard navigation wraps');
  $('ft-tab-bridge').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  ok(snapshot().tab === 'response', 'transform End selects final experiment');
  ok($('tab-synth').getAttribute('aria-selected') === 'true', 'transform navigation preserves the series selection');
  click('section-series'); click('tab-series');
  ok(!$('panel-series').hidden, 'existing series remains usable after transform interactions');
  click('section-transform');
  ok(snapshot().tab === 'response', 'returning to transform preserves selected experiment');

  // Exported diagrams remain actual, self-contained SVG files.
  const exportButton = d.querySelector('#ft-panel-response [data-ft-download]');
  ok(exportButton, 'current experiment offers SVG export');
  exportButton.click();
  ok(downloads.length === 1 && downloads[0].name.endsWith('.svg'), 'download has an SVG filename');
  ok(blobs.length === 1 && /image\/svg\+xml/.test(blobs[0].type), 'download uses an SVG blob');
  const exported = await new Promise((resolve, reject) => {
    const reader = new w.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blobs[0]);
  });
  const xml = new w.DOMParser().parseFromString(exported, 'image/svg+xml');
  ok(!xml.querySelector('parsererror') && xml.documentElement.localName === 'svg', 'download parses as standalone SVG');
  ok(xml.documentElement.getAttribute('viewBox'), 'download preserves vector viewBox');
  valid('final state');
  ok(errors.length === 0, JSON.stringify(errors));
  dom.window.close();
  console.log(`Continuous-time Fourier UI passed (${checks} checks)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
