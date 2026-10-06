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

const CONSENT_VERSION = '2026-10-06';

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
        <li>1마침은 사이트를 <strong>제작하고 코드를 전달(배포)</strong>하는 역할을 하며, 사이트가 실제로 돌아가는 <strong>호스팅 계정과 도메인은 신청자 본인이 직접 가입·구매</strong>하고 본인 명의로 소유합니다. 1마침은 신청자의 아이디·비밀번호를 받지 않으며, 신청자가 계정에 <strong>공동관리자(협업자)로 초대</strong>해주시면 그 권한으로만 작업합니다.</li>
        <li><strong>배포 서비스는 ${DEFAULT_HOSTING_NAME} 한 가지로 통일</strong>해서 제작·배포합니다. 모든 고객에게 같은 방식으로 제작해야 일정과 품질을 일정하게 보장할 수 있기 때문입니다.</li>
        <li>다른 호스팅 서비스를 원하시는 경우에는 <strong>결제 전에</strong> 별도로 문의해주셔야 하며, 가능 여부와 추가 비용은 개별 협의로 정해집니다. 결제 후에 서비스 변경을 요청하시는 경우에는 별도의 유지보수 작업으로 진행되며 비용이 청구됩니다.</li>
        <li><strong>요금제와 이용약관은 신청자의 책임입니다.</strong> 호스팅·도메인 서비스의 무료·유료 요금제, 사용량 한도(트래픽·저장공간 등), 한도 초과 시 추가 요금, 계정 정지·제한, 결제수단 등록·자동결제, 도메인 갱신 비용은 모두 신청자 본인이 해당 회사와 직접 계약한 내용이며 신청자가 부담합니다.</li>
        <li>사이트를 영리 목적(상품·서비스 판매, 광고 수익 등)으로 운영하시는 경우, 선택한 서비스의 요금제가 영리 목적 이용을 허용하는지를 <strong>신청자가 직접 확인</strong>해야 합니다. 1마침이 안내한 서비스라도 해당 회사의 약관·요금 정책은 회사가 언제든 바꿀 수 있고, 그 변경으로 인한 요금 발생이나 서비스 제한은 1마침의 책임이 아닙니다.</li>
        <li>호스팅 회사의 정책 변경·장애·점검·계정 정지 등으로 사이트가 중단되거나 다른 서비스로 옮겨야 하는 경우, 이전·복구 작업은 별도 유지보수로 진행되며 비용과 일정은 건별로 협의합니다.</li>
        <li>호스팅 가입과 도메인 구매 방법은 <a href="guide-hosting-domain.html" target="_blank" style="color:var(--brick);text-decoration:underline;">이 안내 페이지</a>에서 그대로 따라 하시면 됩니다. 어려우시면 신청 후 화면 공유로 같이 진행해드릴 수 있습니다.</li>
      </ul>
    `
  },
  {
    title: '결제 · 환불 · 청약철회 제한',
    html: `
      <ul>
        <li>이 서비스는 신청 즉시 신청자 개인에 맞춰 개별적으로 제작에 들어가는 <strong>주문제작 서비스</strong>입니다.</li>
        <li><strong>결제 후 24시간 이내</strong>라면 사유와 관계없이 전액 환불해드립니다 (단순 변심 포함).</li>
        <li><strong>24시간 경과 후 ~ 제작 착수 전</strong>까지는 전액 환불해드립니다.</li>
        <li><strong>제작 착수 후 ~ 시안 전달 전</strong>까지는 이미 진행된 작업에 대한 비용(결제 금액의 30%)을 제외하고 나머지 70%를 환불해드립니다.</li>
        <li><strong>시안 전달 이후</strong>에는 전자상거래법상 청약철회가 제한되어 원칙적으로 환불되지 않습니다. 단, 마침 측의 귀책(약속한 납품일 대폭 초과, 계약과 다른 결과물, 명백한 하자·오류 등)에 해당하는 경우에만 개별적으로 환불 여부와 금액을 검토해드립니다. 단순 변심이나 시안·결과물에 대한 주관적인 불만족은 환불 사유가 되지 않습니다.</li>
        <li>취소 신청은 마이페이지에서 직접 하실 수 있으며, 취소 사유를 선택하시면 환불 가능 여부가 바로 안내됩니다. 환불이 자동으로 처리되지 않는 사유(마침 측 귀책 주장)는 별도 문의 폼을 통해 접수되며, 확인 후 개별 안내해드립니다.</li>
        <li>환불은 결제 취소(PG) 신청 후 영업일 기준 3~5일 내 처리되며, 카드사 사정에 따라 다소 달라질 수 있습니다. 평일 오후 5시 이후 접수된 취소 신청은 다음 영업일에 처리됩니다. (주말·공휴일 제외)</li>
      </ul>
    `
  },
  {
    title: '콘텐츠 관련 책임',
    html: `
      <ul>
        <li>사이트에 올리는 글·이미지 등 모든 콘텐츠에 대한 저작권과 법적 책임은 신청자 본인에게 있습니다.</li>
        <li>타인의 저작물을 무단으로 사용하거나 명예훼손·허위사실 등 위법한 내용을 게시한 경우, 그로 인한 모든 법적 책임은 신청자 본인이 집니다. 1마침은 사이트를 제작·배포해드리는 제작사이며 게시된 콘텐츠를 사전 검수하지 않습니다.</li>
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
        <li>동의를 거부하실 수 있으나, 이 경우 신청 접수가 되지 않습니다.</li>
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
      <div class="cc-lead">⚠️ 신청 전 꼭 확인해야 하는 사항 (${items.length}가지)</div>
      <div class="cc-sub">각 항목을 눌러서 펼쳐보실 수 있습니다. 아래 체크박스에 동의해야 신청이 접수됩니다.</div>
      ${itemsHtml}
      ${hasHosting ? `
      <div class="cc-agree-row">
        <input type="checkbox" id="cc-host-${containerId}">
        <label for="cc-host-${containerId}">
          배포 서비스는 <strong>${DEFAULT_HOSTING_NAME} 한 가지로 통일</strong>되며, 호스팅·도메인의 <strong>요금제·약관·비용은 제가 직접 책임진다</strong>는 점을 확인했습니다.
          <span class="cc-fine">다른 서비스를 원하면 결제 전에 문의해야 하고, 결제 후 변경은 유료 유지보수임을 이해했습니다.</span>
        </label>
      </div>` : ''}
      <div class="cc-agree-row">
        <input type="checkbox" id="cc-agree-${containerId}">
        <label for="cc-agree-${containerId}">
          위 유의사항(${items.map((it) => it.title).join(', ')})을 모두 확인했으며 이에 동의합니다.
          <span class="cc-fine">특히 제작 착수 이후에는 환불이 제한될 수 있다는 점을 이해했습니다.</span>
        </label>
      </div>
    </div>
  `;

  // 스타일을 한 번만 주입
  if (!document.getElementById('cc-style')) {
    const style = document.createElement('style');
    style.id = 'cc-style';
    style.textContent = `
      .cc-box{border:1.6px solid var(--brick);border-radius:18px;background:#FBF4F1;padding:26px 24px;}
      .cc-lead{font-size:14.5px;color:var(--ink);font-weight:700;margin-bottom:4px;}
      .cc-sub{font-size:13.3px;color:var(--ink-soft);margin-bottom:18px;}
      .cc-item{border-bottom:1px solid rgba(217,119,87,.25);}
      .cc-item:last-child{border-bottom:none;}
      .cc-q{width:100%;text-align:left;padding:14px 2px;display:flex;justify-content:space-between;align-items:center;font-size:14.5px;font-weight:700;color:var(--ink);gap:10px;background:none;border:none;font-family:inherit;cursor:pointer;}
      .cc-plus{font-size:18px;color:var(--brick);font-weight:400;transition:.2s ease;flex:0 0 auto;}
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
