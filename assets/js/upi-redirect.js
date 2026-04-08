(function () {
  const form = document.getElementById('upi-redirect-form');
  const status = document.getElementById('upi-redirect-status');
  const output = document.getElementById('upi-redirect-output');
  const openButton = document.getElementById('upi-open-link');
  const copyButton = document.getElementById('upi-copy-link');
  const resetButton = document.getElementById('upi-reset-link');

  if (!form || !window.AppUtils) return;

  let currentUri = '';

  function isValidUpiId(value) {
    return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(String(value || '').trim());
  }

  function buildUri() {
    const data = new FormData(form);
    const directUri = String(data.get('directUri') || '').trim();
    const vpa = String(data.get('vpa') || '').trim();
    const payeeName = String(data.get('payeeName') || '').trim();
    const amount = String(data.get('amount') || '').trim();
    const note = String(data.get('note') || '').trim();

    if (directUri) {
      if (!directUri.startsWith('upi://pay?')) {
        return { valid: false, message: 'Enter a valid UPI payment URI starting with upi://pay?' };
      }
      return { valid: true, value: directUri };
    }

    if (!isValidUpiId(vpa)) {
      return { valid: false, message: 'Enter a valid UPI ID in the format name@bank or paste a full UPI URI.' };
    }
    if (!payeeName) {
      return { valid: false, message: 'Enter the payee name when building a UPI link.' };
    }
    if (amount && (Number(amount) <= 0 || Number.isNaN(Number(amount)))) {
      return { valid: false, message: 'Enter a valid payment amount greater than zero.' };
    }

    const params = new URLSearchParams();
    params.set('pa', vpa);
    params.set('pn', payeeName);
    if (amount) params.set('am', Number(amount).toFixed(2));
    params.set('cu', 'INR');
    if (note) params.set('tn', note);
    return { valid: true, value: 'upi://pay?' + params.toString() };
  }

  function updateView() {
    const result = buildUri();
    if (!result.valid) {
      currentUri = '';
      output.textContent = 'Your UPI payment link will appear here.';
      AppUtils.setStatus(status, result.message, '');
      openButton.disabled = true;
      return;
    }

    currentUri = result.value;
    output.textContent = currentUri;
    AppUtils.setStatus(status, 'UPI payment link is ready to open or copy.', 'success');
    openButton.disabled = false;
  }

  form.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('input', updateView);
    field.addEventListener('change', updateView);
  });

  copyButton.addEventListener('click', async function () {
    const ok = await AppUtils.copyText(currentUri);
    AppUtils.setStatus(status, ok ? 'UPI payment link copied to clipboard.' : 'Nothing valid to copy yet.', ok ? 'success' : 'error');
  });

  openButton.addEventListener('click', function () {
    if (!currentUri) {
      AppUtils.setStatus(status, 'Create or paste a valid UPI payment link first.', 'error');
      return;
    }
    window.location.href = currentUri;
  });

  resetButton.addEventListener('click', function () {
    setTimeout(updateView, 0);
  });

  updateView();
})();
