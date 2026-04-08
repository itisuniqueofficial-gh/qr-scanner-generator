(function () {
  const input = document.getElementById('image-input');
  const chooseButton = document.getElementById('choose-image');
  const dropZone = document.getElementById('drop-zone');
  const preview = document.getElementById('image-preview');
  const previewEmpty = document.getElementById('image-preview-empty');
  const resultBox = document.getElementById('reader-result');
  const statusBox = document.getElementById('reader-status');
  const copyButton = document.getElementById('reader-copy');
  const resetButton = document.getElementById('reader-reset');
  const openLink = document.getElementById('reader-open-link');

  if (!input || !window.AppUtils) return;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  function resetReader() {
    input.value = '';
    preview.src = '';
    preview.classList.add('hidden');
    preview.classList.remove('keep-space');
    previewEmpty.classList.remove('hidden');
    AppUtils.setResult(resultBox, '', 'No QR code decoded yet.');
    AppUtils.setLink(openLink, '');
    AppUtils.setStatus(statusBox, 'No image selected yet.', '');
    copyButton.disabled = true;
    resetButton.disabled = true;
  }

  function setDecodedValue(value) {
    AppUtils.setResult(resultBox, value, 'No QR code decoded yet.');
    AppUtils.setLink(openLink, value);
    copyButton.disabled = !value;
    resetButton.disabled = false;
    if (value) {
      resultBox.focus();
    }
  }

  function decodeImage(file) {
    if (!file || !file.type.startsWith('image/')) {
      AppUtils.setStatus(statusBox, 'Please choose a valid image file.', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      AppUtils.setStatus(statusBox, 'Large image detected. Processing may take a little longer.', '');
    } else {
      AppUtils.setStatus(statusBox, 'Reading image and searching for a QR code...', '');
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const image = new Image();
      image.onload = function () {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;

        preview.src = image.src;
        preview.classList.remove('hidden');
        preview.classList.add('keep-space');
        previewEmpty.classList.add('hidden');

        if (result && result.data) {
          setDecodedValue(result.data);
          AppUtils.setStatus(statusBox, 'QR code found in the uploaded image.', 'success');
        } else {
          setDecodedValue('');
          AppUtils.setStatus(statusBox, 'No QR code was found in that image.', 'error');
        }
      };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  chooseButton.addEventListener('click', function () {
    input.click();
  });

  dropZone.addEventListener('click', function () {
    input.click();
  });

  dropZone.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  });

  input.addEventListener('change', function () {
    const file = input.files && input.files[0];
    decodeImage(file);
  });

  ['dragenter', 'dragover'].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', function (event) {
    const file = event.dataTransfer && event.dataTransfer.files[0];
    decodeImage(file);
  });

  copyButton.addEventListener('click', async function () {
    const ok = await AppUtils.copyText(resultBox.textContent);
    AppUtils.setStatus(statusBox, ok ? 'Decoded content copied to clipboard.' : 'Copy was not available in this browser.', ok ? 'success' : 'error');
  });

  resetButton.addEventListener('click', resetReader);
})();
