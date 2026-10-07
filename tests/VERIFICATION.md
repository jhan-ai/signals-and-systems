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
