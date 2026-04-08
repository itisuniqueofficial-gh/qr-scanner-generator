(function () {
  const form = document.getElementById('upi-generator-form');
  const status = document.getElementById('upi-generator-status');
  const output = document.getElementById('upi-generator-output');
  const preview = document.getElementById('upi-generator-preview');
  const downloadButton = document.getElementById('upi-download-qr');
  const copyButton = document.getElementById('upi-copy-uri');
  const resetButton = document.getElementById('upi-reset-form');

  if (!form || !window.QRCode || !window.AppUtils) return;

  let currentUri = '';

  function isValidUpiId(value) {
    return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(String(value || '').trim());
  }

  function buildUri() {
    const data = new FormData(form);
    const payeeName = String(data.get('payeeName') || '').trim();
    const vpa = String(data.get('vpa') || '').trim();
    const amount = String(data.get('amount') || '').trim();
    const currency = String(data.get('currency') || 'INR').trim() || 'INR';
    const note = String(data.get('note') || '').trim();
    const reference = String(data.get('reference') || '').trim();

    if (!payeeName) {
      return { valid: false, message: 'Enter the payee name.' };
    }
    if (!isValidUpiId(vpa)) {
      return { valid: false, message: 'Enter a valid UPI ID in the format name@bank.' };
    }
    if (amount && (Number(amount) <= 0 || Number.isNaN(Number(amount)))) {
      return { valid: false, message: 'Enter a valid payment amount greater than zero.' };
    }

    const params = new URLSearchParams();
    params.set('pa', vpa);
    params.set('pn', payeeName);
    if (amount) params.set('am', Number(amount).toFixed(2));
    params.set('cu', currency || 'INR');
    if (note) params.set('tn', note);
    if (reference) params.set('tr', reference);

    return { valid: true, value: 'upi://pay?' + params.toString() };
  }

  function renderQr(value) {
    preview.innerHTML = '<div id="upi-render-target"></div>';
    new QRCode(document.getElementById('upi-render-target'), {
      text: value,
      width: 280,
      height: 280,
      colorDark: '#182126',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function updateView() {
    const result = buildUri();
    if (!result.valid) {
      currentUri = '';
      output.textContent = 'Your generated UPI payment URI will appear here.';
      AppUtils.setStatus(status, result.message, '');
      preview.innerHTML = '<canvas id="upi-qr-canvas" width="280" height="280" aria-label="Generated UPI QR code preview"></canvas>';
      downloadButton.disabled = true;
      return;
    }

    currentUri = result.value;
    output.textContent = currentUri;
    AppUtils.setStatus(status, 'UPI payment QR code is ready.', 'success');
    renderQr(currentUri);
    downloadButton.disabled = false;
  }

  form.querySelectorAll('input, textarea, select').forEach(function (field) {
    field.addEventListener('input', updateView);
    field.addEventListener('change', updateView);
  });

  copyButton.addEventListener('click', async function () {
    const ok = await AppUtils.copyText(currentUri);
    AppUtils.setStatus(status, ok ? 'UPI payment URI copied to clipboard.' : 'Nothing valid to copy yet.', ok ? 'success' : 'error');
  });

  downloadButton.addEventListener('click', function () {
    const canvas = preview.querySelector('canvas');
    const img = preview.querySelector('img');
    const dataUrl = canvas ? canvas.toDataURL('image/png') : (img ? img.src : '');
    if (!dataUrl) {
      AppUtils.setStatus(status, 'QR preview is not ready to download yet.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'upi-payment-qr.png';
    link.click();
  });

  resetButton.addEventListener('click', function () {
    setTimeout(updateView, 0);
  });

  updateView();
})();
