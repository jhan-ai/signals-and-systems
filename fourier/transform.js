/* Continuous-time Fourier-transform experiments. All plotted functions are analytic. */
(function () {
  'use strict';
  const host = document.getElementById('fourier-transform-lab');
  if (!host) return;
  const F = window.FourierTransformMath;
  if (!F) throw new Error('FourierTransformMath must load before transform.js');
  const NS = 'http://www.w3.org/2000/svg';
  const colors = { ink: '#45505b', muted: '#59656d', gray: '#8b9699', blue: '#007f9f', orange: '#c65327', red: '#b93233', grid: '#e6e5d2', paper: '#fefff1' };
  const tabs = ['bridge', 'properties', 'response'];
  const components = [{ amplitude: 1, omega: 1, phase: 0 }, { amplitude: 0.5, omega: 5, phase: 0 }];
  const state = {
    tab: 'bridge',
    bridge: { period: 4, normalization: 'normalized' },
    properties: { kind: 'rect', scale: 1, shift: 0, amplitude: 1 },
    response: { cutoff: 1, mode: 'sinusoids' }
  };
  const $ = id => document.getElementById(id);
  const fmt = (n, digits = 3) => Math.abs(n) < 1e-9 ? '0' : String(Number(n.toFixed(digits))).replace('-', '−');
  const math = body => `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow>${body}</mrow></math>`;
  const mi = value => `<mi>${value}</mi>`;
  const mn = value => `<mn>${value}</mn>`;
  const mo = value => `<mo>${value}</mo>`;
  const sub = (value, index) => `<msub>${mi(value)}${typeof index === 'number' ? mn(index) : mi(index)}</msub>`;
  const frac = (a, b) => `<mfrac><mrow>${a}</mrow><mrow>${b}</mrow></mfrac>`;
  const sup = (a, b) => `<msup>${a}<mrow>${b}</mrow></msup>`;
  const wrap = body => mo('(') + body + mo(')');
  const omega = mi('ω'), t = mi('t'), T = mi('T'), A = mi('A'), a = mi('a'), t0 = sub('t', 0);
  const pairFormula = math(mi('X') + wrap(omega) + mo('=') + `<msubsup>${mo('∫')}<mrow>${mo('−')}${mi('∞')}</mrow>${mi('∞')}</msubsup>` + mi('x') + wrap(t) + sup(mi('e'), mo('−') + mi('j') + omega + t) + mi('d') + t);
  const bridgeFormula = math(sub('ω', 0) + mo('=') + frac(mn(2) + mi('π'), T) + `<mspace width="2em"/>` + sub('X', 'k') + mo('=') + frac(mn(1), T) + mi('X') + wrap(mi('k') + sub('ω', 0)));
  const propertyFormula = math(mi('y') + wrap(t) + mo('=') + A + mi('x') + wrap(a + wrap(t + mo('−') + t0))) + math(mi('Y') + wrap(omega) + mo('=') + frac(A, a) + sup(mi('e'), mo('−') + mi('j') + omega + t0) + mi('X') + wrap(frac(omega, a)));
  const responseFormula = math(mi('y') + wrap(t) + mo('=') + mi('x') + wrap(t) + mo('∗') + mi('h') + wrap(t)) + math(mi('Y') + wrap(omega) + mo('=') + mi('X') + wrap(omega) + mi('H') + wrap(omega));
  const graphCard = (id, eyebrow, title, legend, short = false, caption = '') => `<article class="ft-card"><div class="ft-card-head"><div><p class="ft-eyebrow">${eyebrow}</p><h3>${title}</h3></div><button type="button" class="ft-save" data-ft-download="${id}" aria-label="${title} SVG 저장">SVG 저장</button></div>${legend}<div id="${id}" class="ft-chart${short ? ' ft-short' : ''}"></div>${caption ? `<p class="ft-caption">${caption}</p>` : ''}</article>`;
  const legend = items => `<div class="ft-legend">${items.map(([name, css]) => `<span><i class="ft-key ${css}" aria-hidden="true"></i>${name}</span>`).join('')}</div>`;
  host.classList.add('ft-lab');
  host.innerHTML = `
    <nav class="ft-tabs" role="tablist" aria-label="푸리에 변환 실험 선택">
      <button type="button" id="ft-tab-bridge" role="tab" aria-controls="ft-panel-bridge" aria-selected="true" data-ft-tab="bridge"><span>01</span>급수에서 변환으로</button>
      <button type="button" id="ft-tab-properties" role="tab" aria-controls="ft-panel-properties" aria-selected="false" tabindex="-1" data-ft-tab="properties"><span>02</span>시간 이동과 압축</button>
      <button type="button" id="ft-tab-response" role="tab" aria-controls="ft-panel-response" aria-selected="false" tabindex="-1" data-ft-tab="response"><span>03</span>주파수 응답</button>
    </nav>
    <section id="ft-panel-bridge" class="ft-panel" role="tabpanel" aria-labelledby="ft-tab-bridge">
      <p class="ft-intro">펄스의 폭을 고정하고 반복 주기만 늘리면, 푸리에 급수와 푸리에 변환은 어떻게 연결될까요?</p>
      <div class="ft-grid"><aside class="ft-controls"><div class="ft-controls-head"><h3>반복 간격 조절</h3><button type="button" class="ft-reset" id="ft-reset-bridge">초기화</button></div>
        <div class="ft-control"><label for="ft-period">반복 주기 T <output id="ft-period-value">4 s</output></label><input id="ft-period" type="range" min="4" max="32" step="2" value="4"><div class="ft-range-ends"><span>4 s</span><span>32 s</span></div></div>
        <div class="ft-fixed"><span>펄스 폭 w = 2 s</span><span>높이 = 1</span></div>
        <div class="ft-control"><label for="ft-normalization">스펙트럼 표시</label><select id="ft-normalization"><option value="normalized">TXₖ와 X(ω) 비교</option><option value="raw">실제 급수 계수 Xₖ</option></select><p id="ft-normalization-note" class="ft-control-note"></p></div>
        <div class="ft-control-message"><strong>폭은 그대로, 간격만 넓게</strong><p>T를 늘려도 가운데 펄스의 폭과 높이는 바뀌지 않습니다. 두 그래프의 가로축 범위도 고정되어 있습니다.</p></div>
      </aside><div class="ft-results">
        ${graphCard('ft-bridge-time', 'TIME DOMAIN', '주기 펄스와 단일 펄스', legend([['주기적으로 반복한 x<sub>T</sub>(t)', 'ft-key-original'], ['한 번만 있는 x(t)', 'ft-key-blue']]), false, '회색 펄스의 간격만 넓어집니다. 가운데 파란 펄스는 모든 T에서 같습니다.')}
        ${graphCard('ft-bridge-spectrum', 'FREQUENCY DOMAIN', '급수 계수와 연속 스펙트럼', '<div id="ft-bridge-spectrum-legend" class="ft-legend"></div>', false)}
        <div class="ft-stats"><div class="ft-stat"><span>주파수 간격 Δω = 2π/T</span><strong id="ft-spacing-value"></strong></div><div class="ft-stat"><span>실제 DC 계수 X₀ = 2/T</span><strong id="ft-coefficient-zero"></strong></div><div class="ft-stat"><span>비교용 TX₀ = X(0)</span><strong id="ft-normalized-zero"></strong></div></div>
        <div class="ft-formula-box"><p class="ft-formula-label">단일 펄스의 변환 X(ω)와 반복 신호의 계수 Xₖ</p><div class="ft-formula">${bridgeFormula}</div></div>
        <div class="ft-note" role="status" aria-live="polite"><strong id="ft-bridge-insight"></strong><p id="ft-bridge-explanation"></p></div>
      </div></div>
      <details class="ft-details"><summary>급수 계수 Xₖ와 연속 스펙트럼 X(ω)의 관계</summary><div><p>k는 성분 번호이고 ω₀=2π/T는 기본 각주파수입니다. Xₖ는 각주파수 kω₀인 성분의 푸리에 급수 계수입니다. T가 커질수록 계수 간 주파수 간격과 각 계수의 크기가 함께 작아집니다.</p><p>TXₖ는 관계를 비교하기 위해 계수에 T를 곱한 값입니다. ω = kω₀에서 단일 펄스의 푸리에 변환 X(ω)와 같습니다. 실제 계수 Xₖ가 그대로 연속 곡선이 되는 것은 아닙니다.</p><p>세로선은 급수 계수의 값을 나타냅니다. 주기 신호의 푸리에 변환에 나타나는 impulse의 가중치는 2πXₖ입니다.</p><div class="ft-formula">${pairFormula}</div></div></details>
    </section>
    <section id="ft-panel-properties" class="ft-panel" role="tabpanel" aria-labelledby="ft-tab-properties" hidden>
      <p class="ft-intro">원래 신호 x(t)를 이동하거나 압축하며, 시간 파형과 크기·위상 스펙트럼을 함께 비교하세요.</p>
      <div class="ft-grid"><aside class="ft-controls"><div class="ft-controls-head"><h3>시간 영역 조절</h3><button type="button" class="ft-reset" id="ft-reset-properties">초기화</button></div>
        <div class="ft-control"><label for="ft-kind">원래 신호 x(t)</label><select id="ft-kind"><option value="rect">사각 펄스 · rect(t/2)</option><option value="triangle">삼각 펄스 · max(1−|t|, 0)</option><option value="exponential">지수 감쇠 · e⁻ᵗu(t)</option></select></div>
        <div class="ft-control"><label for="ft-scale">시간 배율 a <output id="ft-scale-value">1</output></label><input id="ft-scale" type="range" min="0.5" max="3" step="0.1" value="1"><p class="ft-control-note">a &gt; 1이면 압축, a &lt; 1이면 확장합니다.</p></div>
        <div class="ft-control"><label for="ft-shift">이동량 t₀ <output id="ft-shift-value">0 s</output></label><input id="ft-shift" type="range" min="-2" max="2" step="0.1" value="0"><p class="ft-control-note">t₀ &gt; 0이면 오른쪽으로 이동합니다.</p></div>
        <div class="ft-control"><label for="ft-amplitude">진폭 배율 A <output id="ft-amplitude-value">1</output></label><input id="ft-amplitude" type="range" min="0.5" max="2" step="0.1" value="1"></div>
        <div class="ft-presets"><button type="button" id="ft-preset-compress">2배 압축</button><button type="button" id="ft-preset-shift">1초 이동</button></div>
        <div class="ft-control-message"><strong>이동·시간 배율·진폭 배율의 역할</strong><p>한 번에 한 값씩 바꾸면 각 효과를 구별하기 쉽습니다. 이동은 위상에, 시간 배율은 스펙트럼의 폭과 높이에 반영됩니다.</p></div>
      </aside><div class="ft-results">
        <div class="ft-formula-box"><div class="ft-formula">${propertyFormula}</div><p class="ft-caption">a &gt; 0인 경우입니다. 먼저 시간축을 a배 압축·확장한 뒤 t₀만큼 이동한 신호를 비교합니다.</p></div>
        ${graphCard('ft-properties-time', 'TIME DOMAIN', '원래 신호와 바꾼 신호', legend([['x(t)', 'ft-key-original'], ['y(t)', 'ft-key-blue']]))}
        <div class="ft-pair">
          ${graphCard('ft-properties-magnitude', 'MAGNITUDE', '크기 스펙트럼', legend([['|X(ω)|', 'ft-key-original'], ['|Y(ω)|', 'ft-key-blue']]), true)}
          ${graphCard('ft-properties-phase', 'PHASE', '위상 스펙트럼', legend([['∠X(ω)', 'ft-key-original'], ['∠Y(ω)', 'ft-key-blue']]), true, '크기가 0인 곳의 위상은 정의되지 않습니다. ±π 경계와 위상 점프는 선을 끊어 표시합니다.')}
        </div>
        <div class="ft-stats ft-energy"><div class="ft-stat"><span>시간 신호의 면적 = 0 주파수 값</span><strong id="ft-area-value"></strong><p>X(0) → Y(0)</p></div><div class="ft-stat"><span>시간 영역에서 구한 에너지</span><strong id="ft-time-energy"></strong><p>∫|x(t)|²dt → ∫|y(t)|²dt</p></div><div class="ft-stat"><span>주파수 영역에서 구한 에너지</span><strong id="ft-frequency-energy"></strong><p>(1/2π)∫|X(ω)|²dω → (1/2π)∫|Y(ω)|²dω</p></div></div>
        <div class="ft-note" role="status" aria-live="polite"><strong id="ft-properties-insight"></strong><p id="ft-properties-explanation"></p></div>
        <p class="ft-fine">에너지는 화면 밖까지 포함한 전체 구간의 이론값입니다. 파스발 관계는 같은 신호의 시간·주파수 영역 에너지가 같다는 뜻이며, 조작 전후 신호의 에너지가 항상 같다는 뜻은 아닙니다.</p>
      </div></div>
    </section>
    <section id="ft-panel-response" class="ft-panel" role="tabpanel" aria-labelledby="ft-tab-response" hidden>
      <p class="ft-intro">같은 시스템을 시간 영역에서는 Convolution으로, 주파수 영역에서는 곱셈으로 설명할 수 있습니다.</p>
      <div class="ft-grid"><aside class="ft-controls"><div class="ft-controls-head"><h3>시스템 조절</h3><button type="button" class="ft-reset" id="ft-reset-response">초기화</button></div>
        <div class="ft-control"><label for="ft-input-mode">입력 신호</label><select id="ft-input-mode"><option value="sinusoids">두 정현파 · 정상상태</option><option value="pulse">사각 펄스 · 0~2초</option></select></div>
        <div class="ft-control"><label for="ft-cutoff">차단 각주파수 a <output id="ft-cutoff-value">1 rad/s</output></label><input id="ft-cutoff" type="range" min="0.25" max="5" step="0.25" value="1"><div class="ft-range-ends"><span>0.25 rad/s</span><span>5 rad/s</span></div></div>
        <div class="ft-control-message"><strong>지수형 impulse 응답</strong><div class="ft-formula">${math(mi('h') + wrap(t) + mo('=') + a + sup(mi('e'), mo('−') + a + t) + mi('u') + wrap(t))}</div><div class="ft-formula">${math(mi('H') + wrap(omega) + mo('=') + frac(a, a + mo('+') + mi('j') + omega))}</div><p>a를 줄이면 높은 주파수 성분이 더 많이 줄어듭니다.</p></div>
      </aside><div class="ft-results">
        <div class="ft-formula-box"><div class="ft-formula">${responseFormula}</div></div>
        ${graphCard('ft-response-time', 'INPUT → SYSTEM → OUTPUT', '입력과 출력 파형', legend([['입력 x(t)', 'ft-key-original'], ['출력 y(t)', 'ft-key-blue']]))}
        <div id="ft-response-input-equation" class="ft-formula"></div>
        <div class="ft-pair">
          ${graphCard('ft-response-gain', 'MAGNITUDE RESPONSE', '주파수별 진폭비 |H(ω)|', legend([['|H(ω)|', 'ft-key-blue']]), true)}
          ${graphCard('ft-response-phase', 'PHASE RESPONSE', '주파수별 위상 변화량', legend([['∠H(ω)', 'ft-key-orange']]), true)}
        </div>
        <article class="ft-card" id="ft-response-components"><div class="ft-table-wrap"><table class="ft-table"><caption>각 정현파 성분의 변화</caption><thead><tr><th scope="col">각주파수 ω</th><th scope="col">입력 진폭</th><th scope="col">출력 진폭</th><th scope="col">위상 변화</th></tr></thead><tbody id="ft-response-rows"></tbody></table></div><p class="ft-caption">주파수는 그대로이고, 진폭에는 |H(ω)|를 곱하고 위상에는 ∠H(ω)를 더합니다.</p></article>
        <div class="ft-note" role="status" aria-live="polite"><strong id="ft-response-insight"></strong><p id="ft-response-explanation"></p></div>
        <p id="ft-response-assumption" class="ft-fine"></p>
      </div></div>
    </section>
    <p id="ft-download-status" class="ft-save-status" role="status" aria-live="polite"></p>`;

  function svgElement(tag, attrs = {}, text) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function chart(id, options = {}) {
    const target = $(id);
    const { xmin = -12, xmax = 12, ymin = 0, ymax = 1.2, xticks = [-12, -6, 0, 6, 12], yticks = [0, 0.5, 1], xlabel = 'ω (rad/s)', ylabel = '', title = '', yFormat = fmt } = options;
    const width = Math.max(280, target.clientWidth || (target.classList.contains('ft-short') ? 420 : 820));
    const height = target.clientHeight || (target.classList.contains('ft-short') ? 218 : 250);
    const left = width < 400 ? 42 : 50, right = 16, top = 23, bottom = 43;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const X = value => left + (value - xmin) / (xmax - xmin) * plotWidth;
    const Y = value => top + (ymax - value) / (ymax - ymin) * plotHeight;
    const svg = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': title, 'data-ft-chart': id, 'data-ft-title': title });
    svg.append(svgElement('title', {}, title));
    svg.append(svgElement('rect', { x: 0, y: 0, width, height, fill: colors.paper }));
    const definitions = svgElement('defs'), clip = svgElement('clipPath', { id: `${id}-clip` });
    clip.append(svgElement('rect', { x: left, y: top - 1, width: plotWidth, height: plotHeight + 2 }));
    definitions.append(clip); svg.append(definitions);
    const textAttrs = { 'font-family': 'Inter, Noto Sans KR, Malgun Gothic, sans-serif', 'font-size': 11, fill: colors.muted };
    for (const value of yticks) {
      svg.append(svgElement('line', { x1: left, x2: width - right, y1: Y(value), y2: Y(value), stroke: Math.abs(value) < 1e-9 ? '#bfc6bc' : colors.grid, 'stroke-width': Math.abs(value) < 1e-9 ? 1.2 : 1 }));
      svg.append(svgElement('text', { x: left - 7, y: Y(value) + 4, 'text-anchor': 'end', ...textAttrs }, yFormat(value)));
    }
    for (const value of xticks) {
      svg.append(svgElement('line', { x1: X(value), x2: X(value), y1: top, y2: height - bottom, stroke: colors.grid, 'stroke-width': 1 }));
      svg.append(svgElement('text', { x: X(value), y: height - bottom + 18, 'text-anchor': 'middle', ...textAttrs }, fmt(value, 2)));
    }
    svg.append(svgElement('text', { x: width - right, y: height - 4, 'text-anchor': 'end', ...textAttrs }, xlabel));
    if (ylabel) svg.append(svgElement('text', { x: 7, y: 13, ...textAttrs }, ylabel));
    const layer = svgElement('g', { 'clip-path': `url(#${id}-clip)` });
    svg.append(layer); target.replaceChildren(svg);

    function path(trace, fn, color = colors.blue, opts = {}) {
      const samples = opts.samples || Math.max(720, Math.ceil(plotWidth * 2));
      let d = '', previous = null, penDown = false;
      for (let i = 0; i <= samples; i++) {
        const x = xmin + (xmax - xmin) * i / samples, y = fn(x);
        if (y === null || !Number.isFinite(y)) { penDown = false; previous = null; continue; }
        if (opts.breakJump && previous !== null && Math.abs(y - previous) > opts.breakJump) penDown = false;
        d += `${penDown ? 'L' : 'M'}${X(x).toFixed(3)},${Y(y).toFixed(3)}`;
        previous = y; penDown = true;
      }
      const p = svgElement('path', { d, fill: 'none', stroke: color, 'stroke-width': opts.width || 2.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke', 'data-ft-trace': trace });
      if (opts.dash) p.setAttribute('stroke-dasharray', opts.dash);
      if (opts.opacity !== undefined) p.setAttribute('opacity', opts.opacity);
      layer.append(p);
      return p;
    }
    function points(trace, pairs, color = colors.orange, opts = {}) {
      const group = svgElement('g', { 'data-ft-trace': trace });
      pairs.forEach(([x, y]) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (opts.stems !== false) group.append(svgElement('line', { x1: X(x), x2: X(x), y1: Y(0), y2: Y(y), stroke: color, 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke' }));
        group.append(svgElement('circle', { cx: X(x), cy: Y(y), r: opts.radius || 2.7, fill: color, stroke: colors.paper, 'stroke-width': 0.8 }));
      });
      layer.append(group);
    }
    return { svg, layer, path, points, X, Y, width, height };
  }

  function principalPhase(z, threshold = 1e-7) {
    if (Math.hypot(z.re, z.im) < threshold) return null;
    const value = Math.atan2(z.im, z.re);
    return Math.abs(value + Math.PI) < 1e-8 ? Math.PI : value;
  }
  const phaseTick = value => Math.abs(value) < 1e-8 ? '0' : value === Math.PI ? 'π' : value === -Math.PI ? '−π' : value === -Math.PI / 2 ? '−π/2' : fmt(value, 2);

  function renderBridge() {
    const { period, normalization } = state.bridge, normalized = normalization === 'normalized';
    const spacing = F.TAU / period;
    $('ft-period').value = period;
    $('ft-period-value').textContent = `${fmt(period)} s`;
    $('ft-normalization').value = normalization;
    $('ft-normalization-note').textContent = normalized ? '계수에 T를 곱해 단일 펄스의 변환과 비교합니다.' : 'T를 곱하지 않은 실제 계수를 표시합니다. 세로축 범위는 고정입니다.';
    const time = chart('ft-bridge-time', { xmin: -36, xmax: 36, xticks: [-32, -16, 0, 16, 32], ymin: -0.12, ymax: 1.3, yticks: [0, 0.5, 1], xlabel: 't (s)', title: `폭 2초인 펄스를 ${period}초 간격으로 반복한 신호와 단일 펄스` });
    time.path('periodic', x => F.periodicPulse(x, { amplitude: 1, period, width: 2 }), colors.gray, { width: 1.8, dash: '5 4', samples: 2800 });
    time.path('single', x => F.baseTime('rect', x), colors.blue, { width: 2.8, samples: 2800 });
    const spectrum = chart('ft-bridge-spectrum', { ymin: normalized ? -0.6 : -0.15, ymax: normalized ? 2.25 : 0.58, yticks: normalized ? [-0.5, 0, 1, 2] : [-0.1, 0, 0.25, 0.5], ylabel: normalized ? 'TXₖ, X(ω)' : 'Xₖ', title: normalized ? 'TXk와 단일 펄스의 푸리에 변환 비교' : '반복 주기에 따른 실제 푸리에 급수 계수' });
    spectrum.path('envelope', w => F.rectSpectrum(w, 2, 1) / (normalized ? 1 : period), colors.gray, { width: 1.8, dash: '5 4' });
    const K = Math.floor(12 / spacing), coefficients = [];
    for (let k = -K; k <= K; k++) coefficients.push([k * spacing, F.pulseCoefficient(1, period, 2, k) * (normalized ? period : 1)]);
    spectrum.points('coefficients', coefficients, colors.blue, { radius: period > 16 ? 2 : 2.8 });
    $('ft-bridge-spectrum-legend').innerHTML = normalized
      ? '<span><i class="ft-key ft-key-original" aria-hidden="true"></i>단일 펄스의 X(ω)</span><span><i class="ft-key ft-key-blue" aria-hidden="true"></i>ω = kω₀에서의 TXₖ</span>'
      : '<span><i class="ft-key ft-key-original" aria-hidden="true"></i>비교 곡선 X(ω)/T</span><span><i class="ft-key ft-key-blue" aria-hidden="true"></i>실제 계수 Xₖ</span>';
    $('ft-spacing-value').innerHTML = `${fmt(spacing)}<small>rad/s</small>`;
    $('ft-coefficient-zero').textContent = fmt(F.pulseCoefficient(1, period, 2, 0), 4);
    $('ft-normalized-zero').textContent = '2';
    $('ft-bridge-insight').textContent = normalized ? '주기 증가에 따른 주파수 간격 감소' : '주기 증가에 따른 계수 간격·크기 감소';
    $('ft-bridge-explanation').textContent = normalized ? `T = ${period} s에서 주파수 간격은 ${fmt(spacing)} rad/s입니다. 파란 점은 실제 계수에 T를 곱한 값이며, 회색 X(ω) 곡선 위에 놓입니다.` : `X₀ = 2/T = ${fmt(2 / period, 4)}입니다. 펄스 폭과 높이는 고정되어 있으므로, 반복 간격이 넓어질수록 한 주기의 평균값도 작아집니다.`;
  }

  function renderProperties() {
    const params = state.properties, { kind, scale, shift, amplitude } = params;
    for (const key of ['kind', 'scale', 'shift', 'amplitude']) $(`ft-${key}`).value = params[key];
    $('ft-scale-value').textContent = fmt(scale, 1);
    $('ft-shift-value').textContent = `${fmt(shift, 1)} s`;
    $('ft-amplitude-value').textContent = fmt(amplitude, 1);
    const time = chart('ft-properties-time', { xmin: -5, xmax: 9, xticks: [-4, -2, 0, 2, 4, 6, 8], ymin: -0.16, ymax: 2.35, yticks: [0, 1, 2], xlabel: 't (s)', title: `원래 ${kind === 'rect' ? '사각 펄스' : kind === 'triangle' ? '삼각 펄스' : '지수 감쇠'}와 시간 배율 ${scale}, 이동 ${shift}초인 신호` });
    time.path('original', x => F.baseTime(kind, x), colors.gray, { width: 1.8, dash: '5 4' });
    time.path('transformed', x => F.timeSignal(kind, x, params), colors.blue);
    const basePeak = F.signalArea(kind), transformedPeak = F.signalArea(kind, params);
    const upper = Math.max(basePeak, transformedPeak) * 1.15;
    const magnitude = chart('ft-properties-magnitude', { ymin: -0.04 * upper, ymax: upper, yticks: [0, upper / 2, upper], title: '원래 신호와 변형한 신호의 푸리에 변환 크기' });
    magnitude.path('original', w => { const z = F.baseSpectrum(kind, w); return Math.hypot(z.re, z.im); }, colors.gray, { width: 1.8, dash: '5 4' });
    magnitude.path('transformed', w => { const z = F.spectrum(kind, w, params); return Math.hypot(z.re, z.im); }, colors.blue);
    const phase = chart('ft-properties-phase', { ymin: -Math.PI * 1.18, ymax: Math.PI * 1.18, yticks: [-Math.PI, 0, Math.PI], yFormat: phaseTick, ylabel: 'rad', title: '원래 신호와 변형한 신호의 위상, 영점과 위상 경계에서는 선을 끊음' });
    phase.path('original', w => principalPhase(F.baseSpectrum(kind, w), basePeak * 0.002), colors.gray, { width: 1.8, dash: '5 4', breakJump: Math.PI * 0.8, samples: 2000 });
    phase.path('transformed', w => principalPhase(F.spectrum(kind, w, params), transformedPeak * 0.002), colors.blue, { breakJump: Math.PI * 0.8, samples: 2000 });
    const originalEnergy = F.signalEnergy(kind), transformedEnergy = F.signalEnergy(kind, params), ratio = amplitude * amplitude / scale;
    $('ft-area-value').textContent = `${fmt(basePeak)} → ${fmt(transformedPeak)}`;
    $('ft-time-energy').textContent = `${fmt(originalEnergy)} → ${fmt(transformedEnergy)}`;
    $('ft-frequency-energy').textContent = `${fmt(originalEnergy)} → ${fmt(transformedEnergy)}`;
    const onlyShift = Math.abs(scale - 1) < 1e-9 && Math.abs(amplitude - 1) < 1e-9 && Math.abs(shift) > 1e-9;
    if (onlyShift) {
      $('ft-properties-insight').textContent = '시간 이동에 따른 위상 변화';
      $('ft-properties-explanation').textContent = `파형이 ${fmt(Math.abs(shift), 1)}초 ${shift > 0 ? '오른쪽' : '왼쪽'}으로 이동합니다. 위상에 −ωt₀가 더해지며 신호의 면적과 에너지는 같습니다.`;
    } else if (Math.abs(scale - 1) > 1e-9) {
      $('ft-properties-insight').textContent = scale > 1 ? '시간 압축과 스펙트럼 확장' : '시간 확장과 스펙트럼 압축';
      $('ft-properties-explanation').textContent = `시간 폭은 ${fmt(1 / scale)}배, 스펙트럼의 주파수축 폭은 ${fmt(scale)}배가 됩니다. 대응하는 변환값의 크기는 A/a = ${fmt(amplitude / scale)}배, 전체 에너지는 A²/a = ${fmt(ratio)}배입니다.`;
    } else if (Math.abs(amplitude - 1) > 1e-9) {
      $('ft-properties-insight').textContent = '진폭 배율에 따른 스펙트럼·에너지 변화';
      $('ft-properties-explanation').textContent = `진폭과 크기 스펙트럼은 ${fmt(amplitude)}배, 에너지는 ${fmt(ratio)}배입니다.${shift ? ` 이동량 ${fmt(shift)}초는 위상에도 반영됩니다.` : ''}`;
    } else {
      $('ft-properties-insight').textContent = '원래 신호와 변형한 신호의 비교';
      $('ft-properties-explanation').textContent = '현재는 x(t)와 y(t)가 같습니다. ‘2배 압축’ 또는 ‘1초 이동’을 선택해 보세요. 회색 원래 신호를 기준으로 파란 파형과 스펙트럼의 변화를 비교합니다.';
    }
  }

  function renderResponse() {
    const { cutoff, mode } = state.response, isPulse = mode === 'pulse';
    $('ft-cutoff').value = cutoff; $('ft-input-mode').value = mode;
    $('ft-cutoff-value').textContent = `${fmt(cutoff)} rad/s`;
    const response = chart('ft-response-time', { xmin: isPulse ? -1 : 0, xmax: 12, xticks: isPulse ? [0, 2, 4, 6, 8, 10, 12] : [0, 2, 4, 6, 8, 10, 12], ymin: isPulse ? -0.12 : -1.8, ymax: isPulse ? 1.25 : 1.8, yticks: isPulse ? [0, 0.5, 1] : [-1.5, 0, 1.5], xlabel: 't (s)', title: isPulse ? '0초부터 2초까지의 펄스 입력과 지수형 시스템의 출력' : '두 정현파 입력과 저역통과 시스템의 정상상태 출력' });
    response.path('input', x => isPulse ? (x > 0 && x < 2 ? 1 : x === 0 || x === 2 ? 0.5 : 0) : F.sinusoidSignal(x, components), colors.gray, { width: 1.8, dash: '5 4', samples: 1400 });
    response.path('output', x => isPulse ? F.pulseOutput(x, 2, cutoff) : F.sinusoidOutput(x, components, cutoff), colors.blue, { samples: 1400 });
    $('ft-response-input-equation').innerHTML = isPulse
      ? math(mi('x') + wrap(t) + mo('=') + mi('u') + wrap(t) + mo('−') + mi('u') + wrap(t + mo('−') + mn(2)))
      : math(mi('x') + wrap(t) + mo('=') + mi('cos') + t + mo('+') + frac(mn(1), mn(2)) + mi('cos') + wrap(mn(5) + t));
    const gain = chart('ft-response-gain', { xmin: 0, xmax: 10, xticks: [0, 1, 3, 5, 7, 10], ymin: -0.04, ymax: 1.13, yticks: [0, 0.5, 1], title: '저역통과 시스템의 크기 응답' });
    gain.path('gain', w => F.lowpass(w, cutoff).magnitude, colors.blue);
    const phase = chart('ft-response-phase', { xmin: 0, xmax: 10, xticks: [0, 1, 3, 5, 7, 10], ymin: -Math.PI * 0.58, ymax: Math.PI * 0.05, yticks: [-Math.PI / 2, -Math.PI / 4, 0], yFormat: value => value === -Math.PI / 4 ? '−π/4' : phaseTick(value), ylabel: 'rad', title: '저역통과 시스템의 위상 응답' });
    phase.path('phase', w => F.lowpass(w, cutoff).phase, colors.orange);
    if (!isPulse) {
      gain.points('components', components.map(c => [c.omega, F.lowpass(c.omega, cutoff).magnitude]), colors.red, { stems: false, radius: 4 });
      phase.points('components', components.map(c => [c.omega, F.lowpass(c.omega, cutoff).phase]), colors.red, { stems: false, radius: 4 });
    }
    $('ft-response-components').hidden = isPulse;
    $('ft-response-rows').innerHTML = components.map(c => {
      const h = F.lowpass(c.omega, cutoff);
      return `<tr><td>${c.omega} rad/s</td><td>${c.amplitude}</td><td>${fmt(c.amplitude * h.magnitude)}</td><td>${fmt(h.phase)} rad</td></tr>`;
    }).join('');
    if (isPulse) {
      $('ft-response-insight').textContent = '입력 종료 후 남아 있는 출력의 감쇠';
      $('ft-response-explanation').textContent = `0~2초에는 출력이 증가하고, 입력이 꺼진 뒤에는 남은 응답이 감쇠합니다. a = ${fmt(cutoff)}일 때 감쇠의 시간 척도는 1/a = ${fmt(1 / cutoff)}초입니다.`;
      $('ft-response-assumption').textContent = '초기 상태가 0인 시스템의 전체 응답입니다. y(t) = x(t) ∗ h(t)를 적분한 정확한 식으로 계산하며, t ≥ 2에서는 (1−e⁻²ᵃ)e⁻ᵃ⁽ᵗ⁻²⁾입니다.';
    } else {
      $('ft-response-insight').textContent = '저역통과 필터의 진폭 감쇠와 위상 변화';
      $('ft-response-explanation').textContent = `1 rad/s 성분의 진폭비는 ${fmt(F.lowpass(1, cutoff).magnitude)}, 5 rad/s 성분의 진폭비는 ${fmt(F.lowpass(5, cutoff).magnitude)}입니다. 바뀐 두 성분을 더하면 파란 출력이 됩니다.`;
      $('ft-response-assumption').textContent = '입력이 충분히 오래 유지된 정현파 정상상태 응답입니다. t = 0에서 정현파를 켤 때의 과도응답은 이 모드에 포함하지 않습니다.';
    }
  }

  function render() {
    if (state.tab === 'bridge') renderBridge();
    else if (state.tab === 'properties') renderProperties();
    else renderResponse();
  }
  function select(tab, focus = false) {
    if (!tabs.includes(tab)) throw new RangeError('Unknown Fourier-transform experiment');
    state.tab = tab;
    for (const value of tabs) {
      $(`ft-panel-${value}`).hidden = value !== tab;
      const button = $(`ft-tab-${value}`);
      button.setAttribute('aria-selected', String(value === tab));
      button.tabIndex = value === tab ? 0 : -1;
    }
    if (focus) $(`ft-tab-${tab}`).focus();
    render();
    document.dispatchEvent(new CustomEvent('fourier-transform-tab', { detail: { tab } }));
  }
  function snapshot() {
    const p = state.properties, b = state.bridge, r = state.response;
    return {
      tab: state.tab,
      bridge: { ...b, width: 2, amplitude: 1, omega0: F.TAU / b.period, coefficient0: F.pulseCoefficient(1, b.period, 2, 0), normalized0: 2 },
      properties: { ...p, originalEnergy: F.signalEnergy(p.kind), transformedEnergy: F.signalEnergy(p.kind, p), originalArea: F.signalArea(p.kind), transformedArea: F.signalArea(p.kind, p) },
      response: { ...r, components: components.map(c => { const h = F.lowpass(c.omega, r.cutoff); return { ...c, gain: h.magnitude, outputAmplitude: c.amplitude * h.magnitude, outputPhase: c.phase + h.phase }; }) }
    };
  }
  function downloadSvg(id) {
    const source = $(id)?.querySelector('svg');
    if (!source) return;
    const clone = source.cloneNode(true), viewBox = source.getAttribute('viewBox').split(/\s+/).map(Number), width = viewBox[2], height = viewBox[3], title = source.getAttribute('data-ft-title') || '푸리에 변환';
    // XMLSerializer supplies the namespace for the namespace-aware SVG root.
    // Explicitly adding an unnamespaced xmlns would create a duplicate attribute.
    const charsPerLine = Math.max(16, Math.floor((width - 24) / 15));
    const letters = Array.from(title), lines = [];
    for (let i = 0; i < letters.length; i += charsPerLine) lines.push(letters.slice(i, i + charsPerLine).join(''));
    const headerHeight = Math.max(42, lines.length * 22 + 16);
    clone.setAttribute('viewBox', `0 -${headerHeight} ${width} ${height + headerHeight}`);
    clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height + headerHeight));
    const background = svgElement('rect', { x: 0, y: -headerHeight, width, height: height + headerHeight, fill: colors.paper });
    clone.insertBefore(background, clone.firstChild);
    lines.forEach((line, index) => clone.append(svgElement('text', { x: 12, y: -headerHeight + 24 + index * 22, 'font-family': 'Noto Sans KR, Malgun Gothic, sans-serif', 'font-size': 15, 'font-weight': 650, fill: colors.ink }, line)));
    const content = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' }), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `${id}.svg`; link.hidden = true;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('ft-download-status').textContent = `${title} 그래프를 SVG로 저장합니다.`;
  }

  host.querySelectorAll('[data-ft-tab]').forEach(button => button.addEventListener('click', () => select(button.dataset.ftTab)));
  host.querySelector('.ft-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.indexOf(state.tab);
    select(event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
  });
  $('ft-period').addEventListener('input', event => { state.bridge.period = Number(event.target.value); renderBridge(); });
  $('ft-normalization').addEventListener('change', event => { state.bridge.normalization = event.target.value; renderBridge(); });
  $('ft-reset-bridge').addEventListener('click', () => { Object.assign(state.bridge, { period: 4, normalization: 'normalized' }); renderBridge(); });
  $('ft-kind').addEventListener('change', event => { state.properties.kind = event.target.value; renderProperties(); });
  for (const key of ['scale', 'shift', 'amplitude']) $(`ft-${key}`).addEventListener('input', event => { state.properties[key] = Number(event.target.value); renderProperties(); });
  $('ft-reset-properties').addEventListener('click', () => { Object.assign(state.properties, { kind: 'rect', scale: 1, shift: 0, amplitude: 1 }); renderProperties(); });
  $('ft-preset-compress').addEventListener('click', () => { Object.assign(state.properties, { scale: 2, shift: 0, amplitude: 1 }); renderProperties(); });
  $('ft-preset-shift').addEventListener('click', () => { Object.assign(state.properties, { scale: 1, shift: 1, amplitude: 1 }); renderProperties(); });
  $('ft-cutoff').addEventListener('input', event => { state.response.cutoff = Number(event.target.value); renderResponse(); });
  $('ft-input-mode').addEventListener('change', event => { state.response.mode = event.target.value; renderResponse(); });
  $('ft-reset-response').addEventListener('click', () => { Object.assign(state.response, { cutoff: 1, mode: 'sinusoids' }); renderResponse(); });
  host.addEventListener('click', event => { const button = event.target.closest('[data-ft-download]'); if (button) downloadSvg(button.dataset.ftDownload); });
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (!host.closest('[hidden]')) render(); }, 80); });
  window.FourierTransformLab = { activate: render, select, snapshot };
  render();
})();
