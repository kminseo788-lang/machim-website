/* =========================================================
   1마침 공통 "신청 전 유의사항 + 동의" 컴포넌트
   - 모든 상품의 신청/결제 화면에서 공통으로 쓰는 유의사항(서버·도메인,
     환불/청약철회, 콘텐츠 책임, 개인정보)을 한 곳에서 관리합니다.
   - 상품마다 다른 항목(예: 칩북 혜택, 수정 횟수)은 extraItems로 추가합니다.
   - 사용법 (주문 페이지의 <script> 안에서):

       renderConsent({
         containerId: 'consentBox',      // 유의사항+체크박스를 그려 넣을 빈 div의 id
         payBtnId: 'payBtn',             // 동의 체크 전까지 비활성화할 결제 버튼 id
         productName: '나도 작가도전',    // 동의 기록에 남길 상품명
         extraItems: [                   // 이 상품만의 추가 유의사항 (선택)
           { title: '칩북 1년 무료 입점 혜택', html: '<ul><li>...</li></ul>' }
         ],
         omitItems: ['도메인 · 서버(호스팅) 안내']  // 이 상품에는 해당 없는 공통 항목 제외 (선택, 제목으로 지정)
       });

     결제 처리 함수 안에서 동의 여부/기록이 필요하면:
       const consent = getConsentPayload();
       if(!consent.agreed){ alert('유의사항 동의가 필요합니다.'); return; }
       // orders.insert(...) 의 options 필드 등에 consent 를 같이 저장
   ========================================================= */

const CONSENT_VERSION = '2026-10-08';

// 1마침이 기본으로 안내하는 배포(호스팅) 서비스. 서비스를 바꾸고 싶으면 이 한 줄만 고치면
// 동의 문구에 반영됩니다. (terms.html, guide-hosting-domain.html 의 문구도 같이 확인하세요)
const DEFAULT_HOSTING_NAME = 'Cloudflare Pages';
const HOSTING_ITEM_TITLE = '도메인 · 서버(호스팅) 안내';

// 모든 상품 공통 유의사항 (서버/도메인 정책: 호스팅 계정·도메인은 고객이 직접 가입/구매)
const COMMON_CONSENT_ITEMS = [
  {
    title: HOSTING_ITEM_TITLE,
    html: `
      <ul>
        <li>사이트가 실제로 돌아가는 <strong>호스팅 계정과 도메인은 고객님 명의로 직접 만들고 소유</strong>하세요. 그래야 사이트가 온전히 고객님의 것이 되고, 저(1마침)와 계약이 끝난 뒤에도 언제든 직접 관리하거나 다른 곳에 맡기실 수 있어요.</li>
        <li><strong>고객님의 아이디·비밀번호는 받지 않아요.</strong> 계정에 <strong>공동관리자(협업자)로 초대</strong>해주시면 그 권한 안에서만 작업해요. 고객님의 개인정보를 지키기 위한 방식이에요.</li>
        <li>배포 서비스는 <strong>${DEFAULT_HOSTING_NAME}</strong>로 통일해서 제작해요. 모든 고객님께 같은 방식으로 만들어야 일정과 품질을 안정적으로 지킬 수 있기 때문이에요. 다른 서비스를 원하시면 <strong>결제 전에</strong> 문의해주세요. 가능 여부와 추가 비용을 안내드려요. 결제 후에 바꾸시는 경우는 별도 유지보수(유료)로 진행돼요.</li>
        <li>호스팅·도메인의 <strong>요금제, 사용량 한도, 갱신 비용</strong>은 고객님이 해당 회사와 직접 맺는 계약이라 그 회사의 약관과 요금표가 적용돼요. 제가 대신 정하거나 바꿀 수 없는 부분이라, 가입하실 때 요금제를 꼭 확인해주세요. 나중에 예상치 못한 요금으로 서로 곤란해지는 일을 막기 위해 미리 분명히 해두는 내용이에요.</li>
        <li>상품·서비스 판매나 광고 수익처럼 <strong>영리 목적으로 운영</strong>하신다면, 선택한 요금제가 영리 이용을 허용하는지 가입할 때 함께 확인해주세요. 서비스 회사의 정책은 바뀔 수 있고, 바뀐 뒤의 요금이나 제한은 그 회사의 기준이 적용돼요.</li>
        <li>호스팅 회사의 장애·정책 변경·계정 정지 등으로 사이트가 멈추거나 옮겨야 할 때는, 복구·이전 작업을 별도 유지보수로 도와드려요. 비용과 일정은 건별로 협의해요.</li>
        <li>가입과 구매 방법은 <a href="guide-hosting-domain.html" target="_blank" style="color:var(--brick);text-decoration:underline;">이 안내 페이지</a>에 순서대로 정리해두었어요. 막히는 부분은 문의하기에 글이나 캡처로 남겨주세요. (비밀번호 등 개인정보가 보이는 부분은 가리고 보내주세요.) 어디를 눌러야 하는지 글로 안내해드려요.</li>
      </ul>
    `
  },
  {
    title: '결제 · 환불 · 청약철회 안내',
    html: `
      <ul>
        <li>이 서비스는 결제 직후부터 <strong>고객님만을 위해 개별 제작에 들어가는 주문제작</strong>이에요. 그래서 진행 단계별 환불 기준을 미리 분명하게 정해두었어요. 서로 오해가 생기지 않도록 하기 위한 기준이에요.</li>
        <li><strong>결제 후 24시간 이내</strong>: 사유와 관계없이 전액 환불해드려요. (단순 변심 포함)</li>
        <li><strong>24시간 이후 ~ 제작 착수 전</strong>: 전액 환불해드려요.</li>
        <li><strong>제작 착수 후 ~ 시안 전달 전</strong>: 이미 진행된 작업 비용(결제 금액의 30%)을 제외하고 70%를 환불해드려요.</li>
        <li><strong>시안 전달 이후</strong>: 전자상거래법상 청약철회가 제한되는 단계라 원칙적으로 환불이 어려워요. 다만 마침 쪽 사유(약속한 납품일의 큰 지연, 계약과 다른 결과물, 명백한 하자·오류 등)가 있다면 개별적으로 검토해서 환불 여부와 금액을 안내드려요. 단순 변심이나 시안에 대한 취향상의 불만은 환불 사유로 보기 어려워요.</li>
        <li>취소는 마이페이지에서 직접 신청하실 수 있고, 사유를 선택하시면 환불 가능 여부가 바로 안내돼요. 마침 쪽 사유를 주장하시는 경우는 문의 폼으로 접수되고, 확인 후 개별 안내해드려요.</li>
        <li>환불은 결제 취소 신청 후 영업일 기준 3~5일 안에 처리돼요. 카드사 사정에 따라 다소 달라질 수 있고, 평일 오후 5시 이후 접수는 다음 영업일에 처리돼요. (주말·공휴일 제외)</li>
      </ul>
    `
  },
  {
    title: '제작 일정과 책임 범위',
    html: `
      <ul>
        <li>안내된 제작 기간은 필요한 자료를 모두 받은 <strong>착수일부터 세는 예상 일정</strong>이에요.</li>
        <li>자료 제출이나 확인·승인이 늦어지거나, 기본 범위를 넘는 수정을 요청하시면 <strong>그만큼 일정이 뒤로 밀려요.</strong> 서로 일정을 정확히 맞추기 위해 미리 안내드리는 내용이에요.</li>
        <li>마침 쪽 사정으로 안내한 기간보다 늦어질 것 같으면 <strong>먼저 알려드리고</strong>, 새 일정으로 계속 진행할지 계약을 끝낼지 고객님이 선택하실 수 있어요. 마침 쪽 사유로 늦어진 경우의 환불은 위 환불 기준의 '마침 쪽 사유' 검토 절차로 안내해드려요.</li>
        <li>마침이 책임을 져야 하는 경우, 그 범위는 <strong>결제하신 금액을 한도</strong>로 해요. 사이트가 늦어지거나 오류가 난 것 때문에 생기는 매출 감소 같은 간접적인 손해까지는 책임지기 어려운 점을 미리 말씀드려요. 다만 마침의 고의 또는 중대한 과실로 생긴 손해에는 이 한도가 적용되지 않고, 법에서 정한 고객님의 권리도 이 내용으로 제한되지 않아요.</li>
      </ul>
    `
  },
  {
    title: '콘텐츠 관련 안내',
    html: `
      <ul>
        <li>사이트에 올리실 글·이미지 등의 <strong>저작권은 고객님께 있어요.</strong></li>
        <li>다른 사람의 저작물을 허락 없이 쓰거나 명예훼손·허위사실처럼 위법한 내용이 들어가면 법적 책임이 생길 수 있어요. 올리시기 전에 사용해도 되는 자료인지 한 번만 확인해주세요. 저는 사이트를 제작·배포해드리는 역할이라 게시되는 내용을 미리 검수하지는 않아요.</li>
      </ul>
    `
  },
  {
    title: '개인정보 수집 · 이용 동의',
    html: `
      <ul>
        <li>수집 항목: 이름, 연락처, 이메일 (신청 폼에 입력한 내용)</li>
        <li>수집 목적: 제작 진행 상황 안내 및 상담 연락</li>
        <li>보유 기간: 서비스 완료 후 1년, 이후 파기 (관계 법령에 따른 보관 의무가 있는 경우 그 기간 동안 보관)</li>
        <li>제3자 제공: 없음</li>
        <li>동의를 거부하실 수 있으나, 이 경우 신청 접수가 되지 않아요.</li>
        <li>자세한 내용은 <a href="privacy.html" target="_blank" style="color:var(--brick);text-decoration:underline;">개인정보처리방침</a>을 참고해주세요.</li>
      </ul>
    `
  }
];

let _lastConsentPayload = { agreed: false };

function renderConsent({ containerId, payBtnId, productName, extraItems, omitItems }) {
  const baseItems = omitItems && omitItems.length
    ? COMMON_CONSENT_ITEMS.filter((it) => !omitItems.includes(it.title))
    : COMMON_CONSENT_ITEMS;
  const items = baseItems.concat(extraItems || []);
  const hasHosting = items.some((it) => it.title === HOSTING_ITEM_TITLE);
  const container = document.getElementById(containerId);
  if (!container) return;

  const itemsHtml = items.map((item, i) => `
    <div class="cc-item">
      <button class="cc-q" type="button"><span>${i + 1}. ${item.title}</span><span class="cc-plus">+</span></button>
      <div class="cc-a"><div class="cc-inner">${item.html}</div></div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="cc-box">
      <div class="cc-lead">결제 전에 함께 확인해요 (${items.length}가지)</div>
      <div class="cc-sub">서로 오해 없이 끝까지 가기 위한 약속이에요. 항목을 눌러 펼쳐보시고, 아래에 체크하면 결제하실 수 있어요.</div>
      ${itemsHtml}
      ${hasHosting ? `
      <div class="cc-agree-row">
        <input type="checkbox" id="cc-host-${containerId}">
        <label for="cc-host-${containerId}">
          배포 서비스는 <strong>${DEFAULT_HOSTING_NAME}</strong>로 통일되며, 호스팅·도메인의 <strong>요금제와 약관은 제가 해당 회사와 직접 계약하는 내용</strong>이라는 점을 확인했어요.
          <span class="cc-fine">다른 서비스를 원하면 결제 전에 문의해야 하고, 결제 후 변경은 유료 유지보수라는 점도 이해했어요.</span>
        </label>
      </div>` : ''}
      <div class="cc-agree-row">
        <input type="checkbox" id="cc-agree-${containerId}">
        <label for="cc-agree-${containerId}">
          위 안내(${items.map((it) => it.title).join(', ')})를 모두 확인했고 동의해요.
          <span class="cc-fine">제작이 시작된 뒤에는 단계에 따라 환불 범위가 달라진다는 점을 이해했어요.</span>
        </label>
      </div>
    </div>
  `;

  // 스타일을 한 번만 주입
  if (!document.getElementById('cc-style')) {
    const style = document.createElement('style');
    style.id = 'cc-style';
    style.textContent = `
      .cc-box{border:1.6px solid var(--ink);border-radius:18px;background:#F3F6F1;padding:26px 24px;}
      .cc-lead{font-size:14.5px;color:var(--ink);font-weight:700;margin-bottom:4px;}
      .cc-sub{font-size:13.3px;color:var(--ink-soft);margin-bottom:18px;}
      .cc-item{border-bottom:1px solid rgba(27,67,50,.15);}
      .cc-item:last-child{border-bottom:none;}
      .cc-q{width:100%;text-align:left;padding:14px 2px;display:flex;justify-content:space-between;align-items:center;font-size:14.5px;font-weight:700;color:var(--ink);gap:10px;background:none;border:none;font-family:inherit;cursor:pointer;}
      .cc-plus{font-size:18px;color:var(--ink);font-weight:400;transition:.2s ease;flex:0 0 auto;}
      .cc-item.open .cc-plus{transform:rotate(45deg);}
      .cc-a{max-height:0;overflow:hidden;transition:max-height .25s ease;}
      .cc-inner{padding:0 2px 16px;font-size:13.6px;color:var(--ink-soft);line-height:1.75;}
      .cc-inner ul{padding-left:18px;margin-top:6px;}
      .cc-inner li{margin-bottom:4px;}
      .cc-agree-row{display:flex;gap:10px;align-items:flex-start;margin-top:20px;padding:16px 16px;border-radius:12px;background:#fff;border:1.5px solid var(--line);}
      .cc-agree-row input[type=checkbox]{width:19px;height:19px;flex:0 0 19px;margin-top:2px;accent-color:var(--brick);}
      .cc-agree-row label{font-size:13.8px;color:var(--ink);font-weight:600;line-height:1.6;}
      .cc-agree-row .cc-fine{display:block;margin-top:4px;font-size:12.3px;color:var(--ink-faint);font-weight:400;}
      .btn-primary[disabled]{opacity:.45;pointer-events:none;}
    `;
    document.head.appendChild(style);
  }

  container.querySelectorAll('.cc-item').forEach((item) => {
    const q = item.querySelector('.cc-q');
    const a = item.querySelector('.cc-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = isOpen ? null : a.scrollHeight + 'px';
    });
  });

  const checkbox = document.getElementById('cc-agree-' + containerId);
  const hostBox = document.getElementById('cc-host-' + containerId);
  const payBtn = payBtnId ? document.getElementById(payBtnId) : null;
  if (payBtn) payBtn.disabled = true;

  // 동의 당시 화면에 실제로 보였던 문구를 그대로 저장 (나중에 약관이 바뀌어도 증거가 남도록)
  const textSnapshot = items.map((it) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = it.html;
    return '[' + it.title + '] ' + tmp.textContent.replace(/\s+/g, ' ').trim();
  }).join('\n');

  let hostAckAt = null;
  function refresh() {
    const hostOk = !hostBox || hostBox.checked;
    const ok = checkbox.checked && hostOk;
    if (payBtn) payBtn.disabled = !ok;
    _lastConsentPayload = {
      agreed: ok,
      agreed_at: ok ? new Date().toISOString() : null,
      consent_version: CONSENT_VERSION,
      product_name: productName || null,
      items_shown: items.map((it) => it.title),
      text_snapshot: textSnapshot,
      hosting_ack: hostBox ? { agreed: hostBox.checked, at: hostAckAt, hosting_service: DEFAULT_HOSTING_NAME } : null,
      page_url: location.href,
      user_agent: navigator.userAgent
    };
  }
  checkbox.addEventListener('change', refresh);
  if (hostBox) hostBox.addEventListener('change', () => {
    hostAckAt = hostBox.checked ? new Date().toISOString() : null;
    refresh();
  });
}

// 결제 제출 시 호출해서 동의 기록을 가져다 씁니다.
function getConsentPayload() {
  return _lastConsentPayload;
}
