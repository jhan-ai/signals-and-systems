# 두 LAB 검증

검증일: 2026-10-06

## 수학 계산

- `tests/math.test.cjs`: 7,383개 assertion 통과. 동일 주파수 합성·상쇄, 위상 경계, DC, 스펙트럼 재구성, 직교 투영, 3종 푸리에 급수, 사각/지수 Convolution, 교환법칙과 경계값을 확인했습니다.
- 스펙트럼 재구성 최대 오차 약 2.02×10⁻¹⁴, 기존 Convolution과 독립 적분의 최대 차이 약 2.77×10⁻⁸.
- `tests/extensions.test.cjs`: 640개 assertion 통과. 펄스의 시작·끝 시각, 삼각 입력과 지수 응답, 분할 합, 가중 임펄스 합, 직렬·병렬 연결, 시간 이동에 따른 위상 관계를 확인했습니다.
- 삼각 입력의 Convolution과 독립 적분의 최대 차이 약 9.88×10⁻⁹.

## 조작과 공개 범위

`tests/ui.test.cjs`를 jsdom 30.1.2에서 실행했습니다.

- 603개 assertion, 55개 상태·조작 시나리오 통과. 처리되지 않은 스크립트 오류 0건.
- 공개 홈페이지의 카드 2개와 LAB 01/02 연결.
- Convolution 추가 실험 탭 4개 및 기본 실험의 탭·시간 조절·교환.
- 선택 예제, 슬라이더 양 끝값, 초기화, 재생·정지, 키보드 탭 이동.
- 표시된 정의식과 제작자, 변경된 용어, 예제 파라미터 변경 안내의 표시·초기화.
- 푸리에 추가 실험 영역·이동 링크·실행 코드 제거, 기본 탭 3개 유지 및 DC 변경 시 합성 그래프 갱신 확인.
- 공유 실행 코드에는 Convolution 추가 실험 설정만 포함. 푸리에는 이 실행 코드를 불러오지 않음.
- 정적 HTML 3개와 연결된 자산·상대 링크 존재 확인.

## 표시식

- Convolution: y(t)=(x∗h)(t)=∫₋∞^∞ x(τ)h(t−τ)dτ. LTI 시스템의 초기조건이 0인 출력을 설명합니다.
- 푸리에 급수: x(t)=a₀+Σₖ₌₁^∞[aₖcos(2πkf₀t)+bₖsin(2πkf₀t)], f₀=1/T.
- DC 계수는 a₀=(1/T)∫x, 나머지 계수에는 2/T를 사용합니다. 코사인 진폭·위상 표현에서는 aₖ=Aₖcosφₖ, bₖ=−Aₖsinφₖ입니다.
- MathML을 사용하여 외부 수식 렌더링 서비스 없이 표시합니다. 작은 화면에서는 수식 영역만 가로로 스크롤할 수 있습니다.

## 검증 한계

이번 검증은 수학 계산, DOM 조작 및 정적 링크 검사에 한정합니다. 실제 브라우저의 화면 캡처, 모바일 터치, MathML의 브라우저별 배치 및 애니메이션 성능 검사는 포함하지 않습니다. DOM 검증을 실제 렌더링 검증으로 간주하지 않습니다.

제외한 LAB의 원본은 `archive/all-labs-2026-10-05` 브랜치에 보관하며 현재 Pages의 배포 경로에서 삭제합니다.


## 2026-10-07: Convolution expression input

- Original mathematics: 7,383 checks; Convolution extensions: 640 checks.
- Expression mathematics: 78 checks of grammar, precedence, implicit multiplication, rejected code-like inputs, domain errors, closed-form causal/delayed ramps, shifted pulses, Gaussian convolution, narrow pulse, and the divergent bilateral-exponential example.
- Existing DOM interaction suite: 603 checks across 55 scenarios; new expression DOM suite: 47 checks. No script errors.
- Mode switching, retained presets, draft/apply behavior, finite-interval labels, invalid syntax/domain/bounds, swapping, playback, causal negative time, returning to presets, and reset verified in jsdom.
- SVG paths remain finite. Fourier files are unchanged.
- Local browser preview was blocked by the browser's network policy. DOM tests do not establish visual layout or touch behavior.
- Arbitrary expressions use finite-interval quadrature. Step boundaries with affine arguments are split explicitly. Tail expansion and finer quadrature are diagnostics, not convergence proofs. Very high frequencies, non-affine narrow features, or singularities require care; this is not a symbolic integration engine.


## 2026-10-07: Fourier-series interactive additions

- Four main tabs: synthesis, complex-exponential pair, frequency detection, and Fourier series. Existing real cos/sin detection and square/triangle/sawtooth series remain available.
- `fourier-advanced.test.cjs`: 1,625 assertions. Independent quadrature checks signed complex coefficients and partial integrals; pulse integrals verify sinc coefficients, DC, zeros and signs. Conjugate-pair checks verify cancellation of imaginary parts and the A/2-to-A relationship.
- `fourier-advanced-ui.test.cjs`: coefficient choices including negative/zero/missing orders, partial/full integration, linked synthesis source, mode switching, stop-on-tab-change, pulse sliders/DC/keyboard and pointer controls, reset, existing waveforms and keyboard tab navigation.
- The full existing math and DOM suites pass. All graph paths remain finite and no script errors are reported by jsdom.
- Pulse series defaults to the lecture example A=2, T=4 s, w=2 s. Changing T preserves w/T. Turning DC off subtracts the same mean from the target and partial sum. Zero coefficients have no phase marker.
- New calculations use closed-form continuous-time coefficients and integrals; SVG curves are sampled only for display. Touch behavior and browser-specific assistive-technology behavior require separate device testing.


## 2026-10-07: Lecture-aligned replacement

This revision supersedes the earlier Fourier interactive design described above.

- Removed the conjugate-pair tab, both area-based detector modes, partial-integration animation and explanatory material about Gibbs or jump-limit convergence. Three main tabs remain.
- Detector follows slides 145–148: conjugate multiplication, inner products over a full period, 0 for k≠m, XₘT for k=m, then division by T. The worked proof keeps exponential notation. The slide-148 schematic receives explicitly stated example coefficients and a non-unit period; real and imaginary parts are labeled separately.
- Series follows example 5-5 (slide 152), example 5-3 (slide 150), and analysis/synthesis (slides 153–154). Pulse k=0 is integrated separately; the exponential antiderivative and sinc coefficient are displayed before the spectrum and synthesis. The example-5-3 coefficients remain given data, not described as measured quantities.
- `fourier-advanced.test.cjs`: 582 checks against independent quadrature for basis and weighted inner products at T=1,2,4; pulse coefficients across periods and widths; and the exact trigonometric signals on slides 150/154.
- `fourier-advanced-ui.test.cjs`: 58 checks for deletion, lecture-only explanations, 0/T cases, normalization, absent and negative coefficients, DC, source linkage, example switching, spectrum phase, partial versus exact synthesis, reset and three-tab keyboard navigation.
- Full previous math and UI suites also pass with no jsdom script errors. Convolution is unchanged. Native MathML is used for worked formulas and SVG for all graphs.
- DOM tests do not validate mobile touch or browser-specific assistive-technology behavior.

- Public Chrome check: three tabs visible; the removed pair is absent; the default T=2 example displays inner product 1.6 and coefficient 0.8; selecting pulse k=2 produces coefficient 0 and undefined phase. Display inspection identified and removed nested MathML scrollbar artifacts.

## 2026-10-26: Continuous-time Fourier transform extension

- LAB 02 now has Fourier-series and Fourier-transform groups. The three lecture-aligned series experiments remain available; the transform group adds fixed-width pulse trains approaching a single pulse, time scaling/translation, and a first-order system's frequency response. No discrete-time experiments were added.
- `npm test`: 8,907 checks passed (7,383 original, 640 extensions, 78 expression, 582 lecture-aligned Fourier, 224 transform). Transform checks use independent time-domain quadrature for spectra and convolution, as well as exact energy, pulse, scaling and Parseval cases.
- `npm run test:ui`: 972 checks passed (604 original, 47 expression, 71 lecture-aligned Fourier, 250 transform). No unhandled jsdom script errors. This includes group/tab routing and keyboard navigation, fixed-axis raw/normalized coefficients, signal selection and presets, both response modes, finite SVG coordinates, duplicate-ID checks and standalone SVG XML parsing.
- The bridge holds pulse width and amplitude fixed while T changes. The display distinguishes X_k, T X_k, and the 2π X_k impulse weights of a periodic signal's transform. The raw coefficient view uses a fixed vertical scale so the 1/T decrease remains visible.
- Time changes implement y(t)=A x(a(t−t₀)), a>0, with Y(ω)=(A/a) exp(−jωt₀) X(ω/a). Area and energy use whole-domain theoretical values. Undefined phase near spectral zeros and wrapped phase boundaries is not connected by misleading lines.
- The first-order system uses h(t)=a exp(−at)u(t), H(ω)=a/(a+jω). Sinusoidal mode explicitly shows steady-state response; the causal pulse mode shows the full zero-initial-state response, including the tail after the pulse ends.
- The series Parseval card distinguishes full-signal mean power from the power of the −N…N partial sum. The zero-signal case avoids dividing by zero. The detector's T control is labeled as the signal period.
- Chrome preview: desktop graph rendering and controls inspected for all three transform experiments. At T=16 the bridge displays Δω=0.393 rad/s, X₀=0.125 and T X₀=2. The 2× compression preset displays area and energy 2→1. The 0–2 s pulse produces the expected rise and decay.
- Responsive check: a 390 px iframe (375 px content width with scrollbar) displayed stacked controls, MathML, SVG graphs and the series Parseval card without document-level horizontal overflow. The default pulse series at N=5 displayed P=2, P_N=1.9331 and 96.65%.
- These rendering checks use desktop Chrome at two viewport widths. They do not establish physical-device touch behavior or cross-browser assistive-technology compatibility.


## 2026-11-27: Week 8–13 lecture expansion

- Four new labs, 18 tabs. New math tests cover known DTFS coefficients, arbitrary consecutive synthesis windows, Parseval, finite convolution, first-order resonance, initial-state superposition, quantization, sampled alias equality, and independent numerical quadrature of continuous transform pairs.
- New DOM tests cover 203 states, including every tab and select option, slider endpoints, presets, reset, keyboard navigation, direct hashes, SVG downloads with XML parsing and plot-count checks, finite coordinates, unique IDs, control labels, links, and home filters. Numerical UI assertions verify convolution, aliasing, DTFS reconstruction and recurrence/classical agreement.
- Shared SVG renderer accepts optional width and integer x ticks. Existing callers retain their behavior. Existing math/UI suites run alongside the new tests.
- Chrome preview visually checked the homepage filtering, sampling presets, spectral replication, DTFS, and 2nd-order repeated-root selection. At a 390px iframe width (375px content viewport after scrollbar), DTFS and classical-solution pages have no document horizontal overflow; controls stack and graphs remain readable. This checks a narrow rendered viewport, not a physical phone.
- Browser-extension metadata errors were unrelated to the site's scripts; DOM integration tests found no site script errors.


## 2026-11-27: Consistent titles, navigation and expanded regression checks

- All seven pages now use 신호 및 시스템 실험실 as the site identity. Removed semester, Week, slide-page labels and the homepage lecture-mapping section. Chapter and example identifiers remain because they describe content rather than slide locations.
- All six labs share a previous / all labs / next navigation sequence matching the homepage catalog. Existing deep links and concept-to-concept links remain valid.
- Corrected the ideal-filter explanation: the bandstop filter blocks its boundary frequencies; lowpass, highpass and bandpass include their boundaries. The calculation already used that convention.
- All existing suites passed: mathematics 11,338 assertions; DOM interaction 3,602 assertions, including 203 new-lab scenarios. These cover presets, reset, select options, slider limits, keyboard controls, finite SVG coordinates and SVG export validation.
- `experiment-sweep.test.cjs`: 2,407 distinct parameter cases across the 18 new tabs, 547,459 assertions. Uses deterministic pairwise boundary combinations and seeded random legal combinations. Checks actual draw functions and independently verifies sampled alias equality, quantization bounds and binary decoding, convolution, recurrence decomposition, closed-form/recursive agreement, DTFS reconstruction, Parseval and orthogonality. Counts are assertions, not separate browser sessions.
- `site-consistency.test.cjs`: 627 checks, seven pages, 23 direct routes, 59 internal hyperlinks, zero script errors. Covers title and label cleanup after tab/option changes, sequential navigation, skip-link behavior, local assets and anchor targets.
- Chrome preview: inspected desktop homepage plus narrow home, legacy Fourier and sampling pages at a 390px iframe width (375px content viewport). No document-level horizontal overflow; tabs and controls wrap, the common navigation stacks, and keyboard focus stays visible. Wide formulas scroll inside their own container. This does not establish physical touch-device or cross-browser coverage.
- Test commands are available together through `npm run test:all`. Historical entries above describe earlier revisions, including superseded slide-reference labels.


## 2026-11-27: Student-facing explanations and lecture terminology

- Reviewed all published lesson sources against the eight supplied lecture decks. Kept existing calculations and controls; revised headings, explanations, graph labels, accessible names, option labels, homepage links and the catalog.
- Expanded definitions of DTFS N/k/q and basis functions, convolution n/k and t/τ, complete-system impulse response, zero-state/zero-input decomposition, homogeneous/particular solutions, sampling replicas, quantization and Laplace convergence. Each explanation identifies what the symbols represent and which signals are compared.
- Used phrase-based headings and lecture terms impulse, convolution, decimation and 0 삽입. Replaced equivalence wording with the response of the connected whole system. Explicitly distinguished the two existing sinc conventions and the different uses of N.
- Fixed explanatory graph labels for Fourier properties: transformed signals now show y(t), Y(ω), or the dual pair X(t), 2πx(−ω) consistently. Magnitude response is labeled an amplitude ratio.
- Existing UI suites passed (3,602 checks), site consistency passed (627 checks, seven pages, 23 direct routes, 59 internal links), and the 2,407-case sweep passed (547,459 assertions). No site script errors in DOM tests. After the last explanation/plot-label edits, reran the affected Fourier-series/new-lab UI suites and parameter sweep successfully.
- One-off rendered-heading audit covered 84 page/tab/option states with no remaining sentence-style headings. Source scan found no deprecated requested terms in published HTML/JS/catalog text.
- Chrome preview checked the system-connection explanation on desktop and DTFS / decimation in a 390px iframe (375px content width). Long explanations wrap, the controls work, and neither narrow page has document-level horizontal overflow. Physical touch devices and other browser engines were not tested in this revision.
