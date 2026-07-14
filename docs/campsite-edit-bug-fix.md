# 캠핑장 "정보 수정" → 등록으로 처리되는 버그 수정

## 증상

- 내 캠핑장 관리 화면에서 "정보 수정" 버튼을 누르면
  - 기존 정보가 폼에 채워지지 않고 빈 폼이 뜸
  - 저장을 누르면 수정(PATCH)이 아니라 신규 등록(POST)으로 처리됨

## 원인

`CampsiteFormPage.tsx`가 수정 모드에서 실제 백엔드 데이터가 아니라 **mock 데이터**(`src/data/camps.ts`의 `CAMPS` 배열)에서 캠핑장을 찾고 있었음.

```ts
// 수정 전
const editingCamp = contentId
  ? CAMPS.find((c) => (c.campId ?? c.contentId) === Number(contentId))
  : undefined;
const isEdit = !!editingCamp;
```

백엔드에 실제로 등록한 캠핑장은 이 mock 배열에 존재하지 않으므로 `CAMPS.find(...)`가 항상 `undefined`를 반환했고, 그 결과:

- `isEdit`이 `false`가 되어 등록 모드로 오동작
- 폼이 빈 값으로 초기화됨
- 제출 시 `updateCampsite` 대신 `createCampsite`(`POST /v1/camps/register`) 호출

## 수정 내용

**`src/pages/business/CampsiteFormPage.tsx`**
- 수정 모드 판별 기준을 `!!editingCamp`(mock 조회 성공 여부) → `!!contentId`(URL에 id 존재 여부)로 변경
- URL에 id가 있으면 `getCampsiteDetail(campId)`로 **백엔드에서 실제 캠핑장 정보를 조회**해 폼에 채워 넣도록 변경
- 로딩 중 화면 표시 추가
- 제출 중 버튼 라벨 수정: 수정 모드에서도 항상 "등록 중..."으로 뜨던 것을 "수정 중..."으로 분리

**`src/pages/business/CampsiteManagePage.tsx`**
- "수정 API가 아직 없어 동작하지 않음"이라는 오래된 주석 제거 (PATCH `/v1/camps/{campId}`는 이미 연동되어 있었음)

**`src/api/campsite.ts`**
- `updateCampsite`가 이미 실제 백엔드와 연동되어 있다는 사실을 반영하도록 주석 갱신

## 검증

- `npm run typecheck` (`tsc --noEmit`) 통과
- 브라우저에서 "정보 수정" 클릭 시 기존 정보가 채워지고, 저장 시 PATCH 요청이 나가는지 실제 확인 필요 (수동 테스트 권장)
