(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('is-open');
    });

    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < 768) {
          navToggle.setAttribute('aria-expanded', 'false');
          siteNav.classList.remove('is-open');
        }
      });
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js').catch(function () {
        return null;
      });
    });
  }

  window.AppUtils = {
    isLikelyUrl(value) {
      if (!value) return false;
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
      } catch (error) {
        return false;
      }
    },

    async copyText(value) {
      if (!value) return false;
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (error) {
        return false;
      }
    },

    setResult(target, value, emptyText) {
      target.textContent = value || emptyText;
    },

    setLink(linkElement, value) {
      if (this.isLikelyUrl(value)) {
        linkElement.href = value;
        linkElement.classList.remove('hidden');
        linkElement.classList.add('keep-space');
      } else {
        linkElement.href = '#';
        linkElement.classList.add('hidden');
        linkElement.classList.remove('keep-space');
      }
    },

    setStatus(target, message, type) {
      target.textContent = message;
      target.classList.remove('message-error', 'message-success');
      if (type === 'error') target.classList.add('message-error');
      if (type === 'success') target.classList.add('message-success');
    }
  };
})();
