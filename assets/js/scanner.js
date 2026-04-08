(function () {
  const startButton = document.getElementById('start-scan');
  const stopButton = document.getElementById('stop-scan');
  const clearButton = document.getElementById('scanner-clear');
  const copyButton = document.getElementById('scanner-copy');
  const openLink = document.getElementById('scanner-open-link');
  const video = document.getElementById('scanner-video');
  const resultBox = document.getElementById('scanner-result');
  const statusBox = document.getElementById('scanner-status');

  if (!startButton || !window.AppUtils) return;

  let stream = null;
  let scanFrame = null;
  let hasDetected = false;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  function stopStream() {
    if (scanFrame) cancelAnimationFrame(scanFrame);
    scanFrame = null;
    if (stream) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
    stream = null;
    video.srcObject = null;
    startButton.disabled = false;
    stopButton.disabled = true;
  }

  function setDetection(value) {
    hasDetected = Boolean(value);
    AppUtils.setResult(resultBox, value, 'No QR code scanned yet.');
    AppUtils.setLink(openLink, value);
    copyButton.disabled = !value;
    clearButton.disabled = !value;
    if (value) {
      resultBox.focus();
    }
  }

  function scanLoop() {
    if (!stream || video.readyState < 2) {
      scanFrame = requestAnimationFrame(scanLoop);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;

    if (result && result.data) {
      setDetection(result.data);
      AppUtils.setStatus(statusBox, 'QR code detected successfully.', 'success');
    } else if (!hasDetected) {
      AppUtils.setStatus(statusBox, 'Scanning... If nothing happens, adjust lighting or move the code into the frame.', '');
    }

    scanFrame = requestAnimationFrame(scanLoop);
  }

  async function startScanning() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      AppUtils.setStatus(statusBox, 'This browser does not support camera scanning here. Try the image reader instead.', 'error');
      return;
    }

    try {
      AppUtils.setStatus(statusBox, 'Requesting camera access...', '');
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      startButton.disabled = true;
      stopButton.disabled = false;
      hasDetected = false;
      AppUtils.setStatus(statusBox, 'Camera started. Point it at a QR code.', 'success');
      scanLoop();
    } catch (error) {
      let message = 'Unable to start the camera.';
      if (error && error.name === 'NotAllowedError') {
        message = 'Camera permission was denied. You can allow access and try again.';
      } else if (error && (error.name === 'NotFoundError' || error.name === 'OverconstrainedError')) {
        message = 'No suitable camera was found on this device.';
      }
      AppUtils.setStatus(statusBox, message, 'error');
      stopStream();
    }
  }

  startButton.addEventListener('click', startScanning);
  stopButton.addEventListener('click', function () {
    stopStream();
    AppUtils.setStatus(statusBox, 'Scanning stopped.', '');
  });
  clearButton.addEventListener('click', function () {
    setDetection('');
    hasDetected = false;
    AppUtils.setStatus(statusBox, 'Result cleared. You can continue scanning.', '');
  });
  copyButton.addEventListener('click', async function () {
    const ok = await AppUtils.copyText(resultBox.textContent);
    AppUtils.setStatus(statusBox, ok ? 'Result copied to clipboard.' : 'Copy was not available in this browser.', ok ? 'success' : 'error');
  });

  window.addEventListener('beforeunload', stopStream);
})();
