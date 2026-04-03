(function() {
    // --- Phase 1: Camera Virtualization ---
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);

    let vcamEnabled = false;
    let vcamSource = null;
    let isImageSource = false;

    const vcamVideo = document.createElement('video');
    const vcamImage = new Image();
    const vcamCanvas = document.createElement('canvas');
    const vcamCtx = vcamCanvas.getContext('2d');

    vcamVideo.muted = true;
    vcamVideo.loop = true;
    vcamVideo.playsInline = true;
    vcamVideo.crossOrigin = "anonymous";
    
    function renderImageToCanvas() {
        if (vcamEnabled && isImageSource) {
            vcamCtx.drawImage(vcamImage, 0, 0, vcamCanvas.width, vcamCanvas.height);
            requestAnimationFrame(renderImageToCanvas);
        }
    }

    const virtualDevice = {
        deviceId: "vcam-virtual-01",
        kind: "videoinput",
        label: "Virtual Camera (ViBe Auto)",
        groupId: "vcam-group"
    };

    window.addEventListener('vibe-update-vcam', (event) => {
        const { enabled, source } = event.detail;
        vcamEnabled = enabled;
        if (source && source !== vcamSource) {
            vcamSource = source;
            if (source.startsWith('data:image/')) {
                isImageSource = true;
                vcamImage.src = source;
                vcamImage.onload = () => {
                   vcamCanvas.width = vcamImage.width || 640;
                   vcamCanvas.height = vcamImage.height || 480;
                   renderImageToCanvas();
                };
            } else {
                isImageSource = false;
                vcamVideo.src = source;
                vcamVideo.play().catch(e => console.warn("ViBe VCam: Playback failed", e));
            }
        }
    });

    navigator.mediaDevices.enumerateDevices = async function() {
        const devices = await originalEnumerateDevices();
        if (vcamEnabled) return [virtualDevice, ...devices];
        return devices;
    };

    navigator.mediaDevices.getUserMedia = async function(constraints) {
        if (vcamEnabled && constraints && constraints.video) {
            let stream;
            if (isImageSource) {
                stream = vcamCanvas.captureStream(30);
            } else {
                if (vcamVideo.readyState < 2 && vcamSource) {
                    await new Promise(r => vcamVideo.oncanplay = r);
                }
                stream = vcamVideo.captureStream ? vcamVideo.captureStream() : vcamVideo.mozCaptureStream();
            }
            try {
                if (constraints.audio) {
                    const audioStream = await originalGetUserMedia({ audio: constraints.audio });
                    audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
                }
                return stream;
            } catch (err) {
                return originalGetUserMedia(constraints);
            }
        }
        return originalGetUserMedia(constraints);
    };

    // --- Phase 2: Visibility Spoofing (Background Automation) ---
    // Trick the site into thinking it is always visible and active
    Object.defineProperty(document, 'visibilityState', {
        get: () => 'visible',
        configurable: true
    });

    Object.defineProperty(document, 'hidden', {
        get: () => false,
        configurable: true
    });

    // Stop "visibilitychange" events from pausing the site
    window.addEventListener('visibilitychange', (e) => {
        e.stopImmediatePropagation();
    }, true);

    // Stop "blur" events which some sites use to detect loss of focus
    window.addEventListener('blur', (e) => {
        e.stopImmediatePropagation();
    }, true);

    console.log("ViBe Auto: Camera Patch + Visibility Spoofing Loaded.");
})();
