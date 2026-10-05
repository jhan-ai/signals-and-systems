# 26년 2학기 신호 및 시스템

제작: 한종훈 교수

공개 사이트: https://jhan-ai.github.io/signals-and-systems/

## 공개 LAB

| 번호 | 실험실 | 경로 | 강의 연계 |
| --- | --- | --- | --- |
| LAB 01 | Convolution | `convolution/` | 4장 시간 영역 해석 |
| LAB 02 | 푸리에 | `fourier/` | 5장 주파수 영역 해석 |

Convolution은 반전·이동·곱의 적분, 시작 시각과 신호 길이, 여러 임펄스에 대한 출력, 분할 합과 적분, 직렬·병렬 연결을 다룹니다. 푸리에는 sinusoids 합성·분석, 푸리에 급수, 시간 이동과 위상, harmonics와 기본 주기, Dirichlet 충분조건을 다룹니다.

두 LAB 상단에 정의식·학습 목표·강의 연계를 표시합니다. 푸리에 계수는 DC를 a₀로 두는 강의 표기를 사용합니다. 강의 슬라이드의 크림색 배경(#fffddf), 회색 글자(#45505b), 붉은 강조색(#b93233)을 공통 디자인에 적용했습니다.

## 보관된 실험

이전 13개 LAB 전체는 GitHub의 `archive/all-labs-2026-10-05` 브랜치에 보관했습니다. 이 브랜치는 GitHub Pages 배포 대상이 아닙니다. 기준 커밋은 `21edff5463f31f0a9e0c24635b97b31e0eaebd78`입니다.

공개 `main`에서는 나머지 11개 LAB의 HTML과 실행 코드를 제거했습니다. 링크만 숨긴 상태가 아니며 해당 웹 경로는 더 이상 배포하지 않습니다. 저장소 자체의 공개 범위는 바꾸지 않았으므로 보관 브랜치는 비공개 저장소가 아닙니다.

나중에 재공개할 때 보관 브랜치에서 필요한 페이지·실험 설정·계산 함수를 가져온 후 현재 디자인과 LAB 번호에 맞춰 연결하면 됩니다.

## 개발·배포

정적 HTML/CSS/JS이며 로그인·외부 런타임 스크립트·빌드가 필요하지 않습니다. `main` 브랜치의 루트(`/`)를 GitHub Pages로 게시합니다. `.nojekyll`을 유지합니다.

- `labs/math.js`: 두 LAB 확장 실험의 계산 함수
- `labs/ui.js`: SVG 그래프·탭·슬라이더·재생
- `labs/experiments.js`: 공개된 두 LAB의 확장 설정만 포함
- `assets/course.css`: 강의 디자인과 정의식 표시
- `labs/catalog.json`: 공개 LAB 목록

Node 24 이상에서 `npm install`, `npm test`, `npm run test:ui`로 검증합니다. npm은 개발 검증에만 사용하며 사이트 이용에는 필요하지 않습니다. 검증 범위는 `tests/VERIFICATION.md`에 기록합니다.
