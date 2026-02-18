const $ = (sel) => document.querySelector(sel);
const backdrop = $("#backdrop");
const toast = $("#toast");
const body = document.body;
const themeToggle = $("#themeToggle");

function showToast(text) {
  toast.textContent = text;
  toast.style.display = "block";
  clearTimeout(window.__t);
  window.__t = setTimeout(() => toast.style.display = "none", 2400);
}

function openForm() {
  backdrop.style.display = "flex";
  $("#name").focus();
}

function closeForm() {
  backdrop.style.display = "none";
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
window.scrollToId = scrollToId;

function openFormWithPlan(_label) {
  openForm();
  showToast("지원서 작성 폼을 열었어요.");
}
window.openFormWithPlan = openFormWithPlan;

// Theme Toggle Logic
function toggleTheme() {
  const isLight = body.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeIcon(isLight);
}

function updateThemeIcon(isLight) {
  if (themeToggle) {
    themeToggle.textContent = isLight ? '🌙' : '☀️';
  }
}

// Event Listeners
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

["#openForm", "#openForm2", "#openForm3", "#openForm4"].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("click", openForm);
});

if ($("#closeForm")) $("#closeForm").addEventListener("click", closeForm);

if (backdrop) {
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeForm(); });
}

window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeForm(); });

if ($("#copyLink")) {
  $("#copyLink").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast("링크가 복사됐어요.");
    } catch {
      showToast("복사 실패: 브라우저 권한을 확인해 주세요.");
    }
  });
}

if ($("#saveDraft")) {
  $("#saveDraft").addEventListener("click", () => {
    const data = Object.fromEntries(new FormData($("#leadForm")).entries());
    localStorage.setItem("innercircleLeadDraft", JSON.stringify(data));
    showToast("임시저장 완료.");
  });
}

if ($("#leadForm")) {
  const leadForm = $("#leadForm");
  const msgInput = $("#msg");
  const submitBtn = $("#submitBtn");

  const validateForm = () => {
    if (msgInput.value.trim().length > 0) {
      submitBtn.disabled = false;
    } else {
      submitBtn.disabled = true;
    }
  };

  msgInput.addEventListener("input", validateForm);

  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    
    submitBtn.disabled = true;
    submitBtn.textContent = "보내는 중...";

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        closeForm();
        showToast("문의가 성공적으로 접수되었습니다!");
        form.reset();
        validateForm(); // Reset button state
        localStorage.removeItem("innercircleLeadDraft");
      } else {
        const result = await response.json();
        showToast(result.errors ? result.errors.map(error => error.message).join(", ") : "오류가 발생했습니다.");
      }
    } catch (error) {
      showToast("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "제출";
      validateForm(); // Re-validate in case of error
    }
  });
}

// Initialization
(function init() {
  if ($("#year")) $("#year").textContent = new Date().getFullYear();
  
  // Theme init
  const savedTheme = localStorage.getItem('theme');
  const isLight = savedTheme === 'light';
  if (isLight) {
    body.classList.add('light-mode');
  }
  updateThemeIcon(isLight);

  // Draft init
  const draft = localStorage.getItem("innercircleLeadDraft");
  if (!draft) return;
  try {
    const data = JSON.parse(draft);
    for (const [k, v] of Object.entries(data)) {
      const el = document.querySelector(`[name="${k}"]`);
      if (el) el.value = v;
    }
    // Check initial validity if draft exists
    if ($("#msg")) {
      if ($("#msg").value.trim().length > 0) {
        if ($("#submitBtn")) $("#submitBtn").disabled = false;
      }
    }
  } catch { }
})();
