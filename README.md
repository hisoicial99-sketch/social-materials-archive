# 사회과 수업자료 아카이브

HTML 한 장으로 된 정적 사이트입니다. GitHub에 올리면 Cloudflare가 자동으로 배포합니다.

```
site/
  index.html   화면 구조 (보통은 고칠 일 없음)
  data.js      ★ 자료 목록 — 자료를 올릴 때 이 파일만 고칩니다
  app.js       화면 동작 (고칠 일 없음)
  styles.css   자동으로 만들어지는 CSS (직접 고치지 않음)
  files/       학습지·슬라이드 파일 (HWP, PPTX, PDF, XLSX)
  images/      디지털 수업자료 썸네일 (16:9 화면 캡처)
  play/        직접 만든 HTML 웹앱 (play/앱이름/index.html)
src/input.css  글꼴과 메뉴 밑줄 같은 사용자 지정 CSS
```

## 자료 올리기

1. 파일을 `site/files/`에 넣습니다. 파일 이름은 **영어 소문자·숫자·하이픈(-)만** 씁니다. 대소문자가 다르면 다른 파일로 인식합니다.
   - 예: `tsoc1-u1-perspectives.hwp`
2. `site/data.js`를 열고, 주석으로 들어 있는 양식을 복사해 `ARCHIVE_MATERIALS = [ ]` 안에 붙여 넣은 뒤 내용을 바꿉니다.
   - `file: 'files/tsoc1-u1-perspectives.hwp'`
   - 블로그 글이 있으면 `blogUrl`에 주소를 넣고, 없으면 `''`로 둡니다. 비어 있으면 '블로그 기록' 버튼이 숨겨집니다.
   - `date`는 올린 날짜입니다. 목록은 최신순으로 정렬됩니다.
3. 웹앱·영상·게임은 `DIGITAL_MATERIALS = [ ]`에 같은 방법으로 넣습니다. 썸네일은 `site/images/`에 넣습니다.
4. GitHub에 올리면(push) 1~2분 뒤 사이트에 반영됩니다.

파일 형식(HWP/PPTX/PDF/XLSX)은 파일 이름 끝의 확장자를 보고 자동으로 정해집니다. `.hwpx`도 HWP로 분류됩니다. 구글 드라이브 같은 외부 주소를 넣으면 형식이 '링크'로 표시됩니다.

## 과목 바꾸기

`site/data.js` 맨 위의 `SUBJECT_CLASSIFICATION`에서 영역과 과목을 더하거나 뺍니다. 자료의 `category`와 `subject`는 여기 적힌 이름과 글자 하나까지 같아야 합니다.

## 내 컴퓨터에서 미리 보기 (선택)

```bash
npm install
npm run preview     # http://localhost:8787
```

`index.html`이나 `app.js`에 새로운 Tailwind 클래스를 쓴 경우에만 `npm run build`로 CSS를 다시 만들어야 합니다. 자료만 추가할 때는 필요 없고, Cloudflare가 배포할 때도 자동으로 다시 만듭니다.

## Cloudflare에 처음 배포하기 (한 번만)

1. GitHub에 새 저장소를 만들고 이 폴더를 올립니다.
2. Cloudflare 대시보드 → **Workers & Pages** → **Create application** → **Import a repository**에서 저장소를 고릅니다. GitHub 권한은 이 저장소 하나만 주세요.
3. 다음과 같이 설정하고 **Save and Deploy**를 누릅니다.
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy` (기본값)

파일 하나는 25MiB까지 올릴 수 있습니다.
