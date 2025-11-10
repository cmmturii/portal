// app.js
const API_URL = 'http://localhost:3000';

// Mobile Menu Toggle
const navToggle = document.querySelector('.nav__toggle');
const navList = document.getElementById('nav-list');
const hamburger = document.querySelector('.hamburger');

navToggle.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', !expanded);
  navList.classList.toggle('open');
  hamburger.classList.toggle('open');
});

// Form Submission with Backend
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    // Reset
    form.querySelectorAll('.form__error').forEach(el => el.textContent = '');
    form.querySelectorAll('.form__input, .form select').forEach(el => el.classList.remove('error'));
    const successEl = form.querySelector('.form__success');

    const isQuick = form.id === 'quick-form';
    const endpoint = isQuick ? '/api/quick-register' : '/api/register';

    // Collect data
    const data = {};
    if (isQuick) {
      data.email = form.querySelector('#quick-email').value.trim();
      data.password = form.querySelector('#quick-password').value;
    } else {
      data.firstname = form.querySelector('#full-firstname').value.trim();
      data.lastname = form.querySelector('#full-lastname').value.trim();
      data.email = form.querySelector('#full-email').value.trim();
      data.password = form.querySelector('#full-password').value;
      data.course = form.querySelector('#full-course').value;
      data.terms = form.querySelector('#terms').checked;
    }

    // Client-side validation
    if (isQuick || !isQuick) {
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        showError(form.querySelector(isQuick ? '#quick-email' : '#full-email'), 'Invalid email');
        valid = false;
      }
      if (data.password && data.password.length < 8) {
        showError(form.querySelector(isQuick ? '#quick-password' : '#full-password'), 'Password too short');
        valid = false;
      }
      if (!isQuick && !data.firstname) {
        showError(form.querySelector('#full-firstname'), 'Required');
        valid = false;
      }
      if (!isQuick && !data.lastname) {
        showError(form.querySelector('#full-lastname'), 'Required');
        valid = false;
      }
      if (!isQuick && !data.terms) {
        showError(form.querySelector('#terms').closest('.form__group'), 'You must agree');
        valid = false;
      }
    }

    if (!valid) return;

    // Submit to backend
    try {
      successEl.textContent = 'Submitting...';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Server error');
      }

      successEl.textContent = result.message;
      successEl.style.color = '#059669';

      // Optional redirect after quick register
      if (isQuick && result.redirect) {
        setTimeout(() => {
          window.location.href = result.redirect;
        }, 1500);
      } else {
        form.reset();
      }

      // Save partial data
      if (!isQuick) {
        localStorage.setItem('studentPartial', JSON.stringify({
          firstname: data.firstname,
          email: data.email
        }));
      }

    } catch (err) {
      successEl.textContent = `Error: ${err.message}`;
      successEl.style.color = '#e11d48';
    }

    setTimeout(() => {
      if (successEl.textContent.includes('...') || successEl.textContent.includes('Error')) {
        successEl.textContent = '';
      }
    }, 5000);
  });
});

function showError(field, message) {
  const group = field.closest('.form__group') || field;
  const error = group.querySelector('.form__error');
  field.classList.add('error');
  if (error) error.textContent = message;
}

// Course Modal (unchanged)
document.querySelectorAll('.course-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-modal');
    const modal = document.getElementById(modalId);
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__overlay').focus();
  });
});

document.querySelectorAll('.modal__close, .modal__overlay').forEach(el => {
  el.addEventListener('click', () => {
    const modal = el.closest('.modal');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal[aria-hidden="false"]').forEach(modal => {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  }
});

// Load saved partial data
window.addEventListener('load', () => {
  const saved = localStorage.getItem('studentPartial');
  if (saved) {
    const data = JSON.parse(saved);
    ['#full-firstname', '#full-email'].forEach(id => {
      const el = document.querySelector(id);
      if (el && data[id.slice(5)]) el.value = data[id.slice(5)];
    });
  }
});