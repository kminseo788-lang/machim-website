// 1마침 결제 서버 검증 (Supabase Edge Function)
// 흐름: 브라우저가 결제창에서 결제 → 이 함수 호출(paymentId = 주문 id)
//  → 포트원 서버에 "정말 결제됐는지" 직접 조회 → 금액·상태 검증 → 프로젝트 자동 생성 → 주문을 '결제완료'로 변경
// 필요한 Secret: PORTONE_API_SECRET  (Supabase → Edge Functions → Secrets 에만 저장. 코드·GitHub에 넣지 마세요)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_EMAILS = ['kminseo788@gmail.com'];
const PORTONE_STORE_ID = 'store-5953daa0-ff3c-49cc-ab90-529761466261';

// ※ order.html 의 PRODUCTS 가격과 반드시 같게 유지하세요. (서버가 금액을 다시 계산해서 비교합니다)
const PRICES: Record<string, { base: number; qty?: { unit: number; max: number }; addons?: Record<string, number>; adminOnly?: boolean; name: string }> = {
  web_basic: { name: '홈페이지 기본형', base: 690000, qty: { unit: 50000, max: 5 }, addons: { rev: 30000, anim: 40000 } },
  web_detail: { name: '상세페이지 제작', base: 290000 },
  web_ecom: { name: '쇼핑몰 풀커머스', base: 1200000, addons: { p150: 150000, grade: 180000, coupon: 120000, stats: 150000 } },
  web_writer: { name: '작가 프로필 페이지', base: 149000 },
  auto_price: { name: '경쟁사 가격·재고 모니터링', base: 450000 },
  auto_ann: { name: '공고·지원사업 모니터링', base: 450000 },
  auto_excel: { name: '엑셀 반복업무 자동화', base: 350000 },
  auto_inq: { name: '문의 분류 자동화', base: 450000 },
  web_test: { name: '[관리자 테스트] 결제 점검', base: 1000, adminOnly: true },
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function expectedAmount(options: any): number | null {
  const p = PRICES[options?.product];
  if (!p) return null;
  let t = p.base;
  if (p.qty) {
    const q = Number(options.pages || 0);
    if (!Number.isInteger(q) || q < 0 || q > p.qty.max) return null;
    t += q * p.qty.unit;
  }
  for (const [id, on] of Object.entries(options.addons || {})) {
    if (!on) continue;
    if (!p.addons || !(id in p.addons)) return null;
    t += p.addons[id];
  }
  return t;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const portoneSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!portoneSecret) return json({ ok: false, error: '서버 설정 누락(PORTONE_API_SECRET)' }, 500);

    // 1) 로그인한 사용자 확인
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: ud, error: ue } = await admin.auth.getUser(token);
    if (ue || !ud?.user?.email) return json({ ok: false, error: '로그인이 필요합니다.' }, 401);
    const user = ud.user;
    const userEmail = user.email!.toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    // 2) 주문 확인 (본인 주문만)
    const { paymentId } = await req.json();
    if (!paymentId || typeof paymentId !== 'string') return json({ ok: false, error: 'paymentId 없음' }, 400);
    const { data: order, error: oe } = await admin.from('machim_orders').select('*').eq('id', paymentId).maybeSingle();
    if (oe || !order) return json({ ok: false, error: '주문을 찾을 수 없습니다.' }, 404);
    if ((order.customer_email || '').toLowerCase() !== userEmail) return json({ ok: false, error: '본인 주문이 아닙니다.' }, 403);

    // 이미 처리된 주문이면 그대로 성공 (중복 호출 방지)
    const { data: existing } = await admin.from('machim_projects').select('id').eq('order_id', order.id).maybeSingle();
    if (existing && order.status === '결제완료') return json({ ok: true, already: true });

    // 3) 서버가 금액을 직접 다시 계산
    const product = PRICES[order.options?.product];
    if (!product) return json({ ok: false, error: '알 수 없는 상품입니다.' }, 400);
    if (product.adminOnly && !isAdmin) return json({ ok: false, error: '허용되지 않은 상품입니다.' }, 403);
    const expected = expectedAmount(order.options);
    if (expected === null || expected !== order.amount) {
      await admin.from('machim_orders').update({ status: '금액확인필요', admin_note: `금액 불일치: 주문 ${order.amount} / 서버계산 ${expected}` }).eq('id', order.id);
      return json({ ok: false, error: '주문 금액을 확인할 수 없습니다. 마침에 문의해주세요.' }, 400);
    }

    // 4) 포트원에 결제 내역 직접 조회
    const pr = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}?storeId=${encodeURIComponent(PORTONE_STORE_ID)}`, {
      headers: { Authorization: `PortOne ${portoneSecret}` },
    });
    if (!pr.ok) {
      const txt = await pr.text();
      console.error('portone lookup failed', pr.status, txt);
      return json({ ok: false, error: '결제 내역을 확인하지 못했습니다.', status: pr.status }, 400);
    }
    const pay = await pr.json();
    if (pay.status !== 'PAID') return json({ ok: false, error: '결제가 완료되지 않았습니다.', status: pay.status }, 400);
    if (pay.currency && pay.currency !== 'KRW') return json({ ok: false, error: '통화 불일치' }, 400);
    if (Number(pay.amount?.total) !== expected) {
      await admin.from('machim_orders').update({ status: '금액확인필요', admin_note: `결제금액 불일치: 결제 ${pay.amount?.total} / 서버계산 ${expected} (paymentId ${paymentId})` }).eq('id', order.id);
      return json({ ok: false, error: '결제 금액이 주문과 달라 확인이 필요합니다. 마침에 문의해주세요.' }, 400);
    }

    // 5) 테스트 채널 결제는 관리자만 인정 (LIVE 가 아니면 fail-closed)
    const channelType = pay.channel?.type;
    if (channelType !== 'LIVE' && !isAdmin) {
      return json({ ok: false, error: '테스트 결제는 인정되지 않습니다.' }, 403);
    }

    // 6) 프로젝트 자동 생성 + 주문 완료 처리
    if (!existing) {
      const { error: pe } = await admin.from('machim_projects').insert({
        order_id: order.id, customer_email: user.email, customer_id: user.id,
        product_name: order.product_name, amount: order.amount,
      });
      if (pe) { console.error(pe); return json({ ok: false, error: '프로젝트 생성 실패: ' + pe.message }, 500); }
    }
    await admin.from('machim_orders').update({
      status: '결제완료',
      options: { ...(order.options || {}), payment: { provider: 'portone', paymentId, txId: pay.transactionId ?? null, paidAt: pay.paidAt ?? null, channelType: channelType ?? null, method: pay.method?.type ?? null } },
    }).eq('id', order.id);

    return json({ ok: true, test: channelType !== 'LIVE' });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: '서버 오류가 발생했습니다.' }, 500);
  }
});
