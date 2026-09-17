// 1마침 사이트 공용 Supabase 연결 설정
// 이 파일 하나만 바꾸면 모든 페이지에 반영됩니다.
const SUPABASE_URL = 'https://jzxlmcvthicmruxxxmzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGxtY3Z0aGljbXJ1eHh4bXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMjM2MDgsImV4cCI6MjA5ODc5OTYwOH0.ld7qDDJgqK1cQzf1IoCiyglFFQeMRArmWPoavR4bPo8';

// 전역 sb 객체로 어디서든 supabase 테이블 접근 가능
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
