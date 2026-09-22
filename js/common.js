/* =========================================================
   1마침 (machim.net) 공통 스크립트
   - 여러 페이지에서 똑같이 쓰는 동작(스크롤 페이드인, FAQ 아코디언)만 모아둔 파일입니다.
   - 페이지별 고유 기능(캘린더, 주문 폼 등)은 각 파일 안에 그대로 둡니다.
   ========================================================= */

// 스크롤하면 서서히 나타나는 효과 (.fade 클래스가 붙은 요소 전부에 적용)
document.addEventListener('DOMContentLoaded', function () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.fade').forEach((el) => io.observe(el));

  // FAQ 아코디언 (.faq-item / .faq-q / .faq-a 구조를 쓰는 페이지에서 동작)
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((o) => {
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
});
