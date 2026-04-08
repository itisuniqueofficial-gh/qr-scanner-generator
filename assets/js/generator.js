(function () {
  const fieldsWrap = document.getElementById('generator-fields');
  const feedback = document.getElementById('generator-feedback');
  const outputText = document.getElementById('generator-output-text');
  const copyButton = document.getElementById('copy-generated-content');
  const resetButton = document.getElementById('reset-generator');
  const downloadButton = document.getElementById('download-qr');
  const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
  const preview = document.getElementById('generator-preview');

  if (!fieldsWrap || !window.QRCode || !window.AppUtils) return;

  let activeType = 'text';
  let currentValue = '';

  const fieldTemplates = {
    text: function () {
      return '<div class="form-group"><label for="field-text">Text</label><textarea id="field-text" name="text" rows="5" placeholder="Enter the text you want to share" required></textarea></div>';
    },
    url: function () {
      return '<div class="form-group"><label for="field-url">Website URL</label><input id="field-url" name="url" type="url" placeholder="https://example.com" required></div>';
    },
    phone: function () {
      return '<div class="form-group"><label for="field-phone">Phone number</label><input id="field-phone" name="phone" type="tel" placeholder="+1234567890" required></div>';
    },
    email: function () {
      return '<div class="form-group"><label for="field-email">Email address</label><input id="field-email" name="email" type="email" placeholder="name@example.com" required></div><div class="form-group"><label for="field-email-subject">Subject</label><input id="field-email-subject" name="subject" type="text" placeholder="Optional subject"></div><div class="form-group"><label for="field-email-body">Body</label><textarea id="field-email-body" name="body" rows="4" placeholder="Optional message"></textarea></div>';
    },
    sms: function () {
      return '<div class="form-group"><label for="field-sms-number">Phone number</label><input id="field-sms-number" name="number" type="tel" placeholder="+1234567890" required></div><div class="form-group"><label for="field-sms-message">Message</label><textarea id="field-sms-message" name="message" rows="4" placeholder="Type your message" required></textarea></div>';
    },
    wifi: function () {
      return '<div class="form-group"><label for="field-wifi-ssid">SSID</label><input id="field-wifi-ssid" name="ssid" type="text" placeholder="Network name" required></div><div class="form-group"><label for="field-wifi-password">Password</label><input id="field-wifi-password" name="password" type="text" placeholder="Network password"></div><div class="form-group"><label for="field-wifi-encryption">Encryption type</label><select id="field-wifi-encryption" name="encryption"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></div><label class="inline-toggle" for="field-wifi-hidden"><input id="field-wifi-hidden" name="hidden" type="checkbox"><span>Hidden network</span></label>';
    }
  };

  function escapeWifi(value) {
    return String(value || '').replace(/([\\;,:\"])/g, '\\$1');
  }

  function validateAndBuild() {
    const data = new FormData(document.getElementById('generator-form'));
    switch (activeType) {
      case 'text': {
        const text = (data.get('text') || '').toString().trim();
        if (!text) return { valid: false, message: 'Enter some text to generate a QR code.' };
        return { valid: true, value: text };
      }
      case 'url': {
        const url = (data.get('url') || '').toString().trim();
        if (!AppUtils.isLikelyUrl(url)) return { valid: false, message: 'Enter a full URL starting with http:// or https://.' };
        return { valid: true, value: url };
      }
      case 'phone': {
        const phone = (data.get('phone') || '').toString().trim();
        if (!phone) return { valid: false, message: 'Enter a phone number.' };
        return { valid: true, value: 'tel:' + phone };
      }
      case 'email': {
        const email = (data.get('email') || '').toString().trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, message: 'Enter a valid email address.' };
        const subject = encodeURIComponent((data.get('subject') || '').toString());
        const body = encodeURIComponent((data.get('body') || '').toString());
        let value = 'mailto:' + email;
        const params = [];
        if (subject) params.push('subject=' + subject);
        if (body) params.push('body=' + body);
        if (params.length) value += '?' + params.join('&');
        return { valid: true, value: value };
      }
      case 'sms': {
        const number = (data.get('number') || '').toString().trim();
        const message = (data.get('message') || '').toString().trim();
        if (!number) return { valid: false, message: 'Enter a phone number for the SMS QR code.' };
        if (!message) return { valid: false, message: 'Enter an SMS message.' };
        return { valid: true, value: 'SMSTO:' + number + ':' + message };
      }
      case 'wifi': {
        const ssid = (data.get('ssid') || '').toString().trim();
        const password = (data.get('password') || '').toString();
        const encryption = (data.get('encryption') || 'WPA').toString();
        const hidden = data.get('hidden') ? 'true' : 'false';
        if (!ssid) return { valid: false, message: 'Enter the Wi-Fi network name.' };
        return {
          valid: true,
          value: 'WIFI:T:' + escapeWifi(encryption) + ';S:' + escapeWifi(ssid) + ';P:' + escapeWifi(password) + ';H:' + hidden + ';;'
        };
      }
      default:
        return { valid: false, message: 'Choose a QR type.' };
    }
  }

  function renderQr(value) {
    preview.innerHTML = '<div id="qr-render-target"></div>';
    new QRCode(document.getElementById('qr-render-target'), {
      text: value,
      width: 280,
      height: 280,
      colorDark: '#182126',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
    const img = preview.querySelector('img');
    const canvas = preview.querySelector('canvas');
    if (img) img.alt = 'Generated QR code preview';
    if (canvas) canvas.setAttribute('aria-label', 'Generated QR code preview');
  }

  function updateGenerator() {
    const next = validateAndBuild();
    if (!next.valid) {
      currentValue = '';
      outputText.textContent = 'Your generated QR content will appear here.';
      AppUtils.setStatus(feedback, next.message, '');
      preview.innerHTML = '<canvas id="qr-canvas" width="280" height="280" aria-label="Generated QR code preview"></canvas>';
      downloadButton.disabled = true;
      return;
    }

    currentValue = next.value;
    outputText.textContent = currentValue;
    AppUtils.setStatus(feedback, 'QR code updated and ready to download.', 'success');
    renderQr(currentValue);
    downloadButton.disabled = false;
  }

  function renderFields(type) {
    activeType = type;
    fieldsWrap.innerHTML = fieldTemplates[type]();
    fieldsWrap.querySelectorAll('input, textarea, select').forEach(function (field) {
      field.addEventListener('input', updateGenerator);
      field.addEventListener('change', updateGenerator);
    });
    updateGenerator();
  }

  tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      tabButtons.forEach(function (item) {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      renderFields(button.dataset.type);
    });
  });

  copyButton.addEventListener('click', async function () {
    const ok = await AppUtils.copyText(currentValue);
    AppUtils.setStatus(feedback, ok ? 'Entered content copied to clipboard.' : 'Nothing valid to copy yet.', ok ? 'success' : 'error');
  });

  resetButton.addEventListener('click', function () {
    setTimeout(function () {
      renderFields(activeType);
    }, 0);
  });

  downloadButton.addEventListener('click', function () {
    const canvas = preview.querySelector('canvas');
    const img = preview.querySelector('img');
    let dataUrl = '';

    if (canvas) {
      dataUrl = canvas.toDataURL('image/png');
    } else if (img) {
      dataUrl = img.src;
    }

    if (!dataUrl) {
      AppUtils.setStatus(feedback, 'QR preview is not ready to download yet.', 'error');
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = activeType + '-qr-code.png';
    link.click();
  });

  renderFields(activeType);
})();
