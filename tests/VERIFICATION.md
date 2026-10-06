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
