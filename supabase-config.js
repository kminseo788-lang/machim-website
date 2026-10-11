// 1마침 사이트 공용 Supabase 연결 설정
// 이 파일 하나만 바꾸면 모든 페이지에 반영됩니다.
//
// 마침 전용 Supabase 프로젝트 연결 (service_role/secret 키는 절대 넣지 마세요)
//   Supabase 대시보드 → Project Settings → API → Project URL / publishable(anon) key  (service_role 키는 절대 넣지 마세요)
const SUPABASE_URL = 'https://vbbgvggilfkkqrxfkedy.supabase.co';  // 마침 전용 프로젝트 (chipbook 조직, 서울)
const SUPABASE_ANON_KEY = 'sb_publishable_ZcGKICidHAMHCOnJ0vOq9A_IMfHdcax';  // 공개용(publishable) 키

// 전역 sb 객체로 어디서든 supabase 테이블 접근 가능
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
