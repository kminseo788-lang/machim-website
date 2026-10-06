// 1마침 사이트 공용 Supabase 연결 설정
// 이 파일 하나만 바꾸면 모든 페이지에 반영됩니다.
//
// ★ 칩북(유료) 프로젝트로 이전 중 — 아래 두 값을 칩북 프로젝트 값으로 채우세요.
//   Supabase 대시보드 → Project Settings → API → Project URL / anon public key
//   ★ sql/migrate-machim-to-chipbook.sql 을 칩북 프로젝트에서 실행하기 전에는 push 하지 마세요. (테이블이 없어서 사이트가 동작하지 않습니다)
const SUPABASE_URL = 'https://dxnjeurgrhhubskdcidq.supabase.co';  // 칩북 프로젝트 (칩북 저장소의 js/supabase.js 와 동일)
const SUPABASE_ANON_KEY = 'sb_publishable_oMEgZ8_yufr9j3zyIB3wNQ_qXtywKA8';  // 공개용(publishable) 키

// (이전 전 마침 프로젝트 — 롤백용 참고)
// URL: https://jzxlmcvthicmruxxxmzg.supabase.co  (anon key는 git 이력에 남아 있음)

// 전역 sb 객체로 어디서든 supabase 테이블 접근 가능
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
