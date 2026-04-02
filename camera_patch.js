(function() {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);

    let vcamEnabled = false;
    let vcamSource = null;
    let vcamVideo = document.createElement('video');
    vcamVideo.muted = true;
    vcamVideo.loop = true;
    vcamVideo.playsInline = true;
    vcamVideo.crossOrigin = "anonymous";
    vcamVideo.style.display = "none";
    
    // Virtual Device Metadata
    const virtualDevice = {
        deviceId: "vcam-virtual-01",
        kind: "videoinput",
        label: "Virtual Camera (ViBe Auto)",
        groupId: "vcam-group"
    };

    // Listen for updates from the Content Script (Isolated World)
    window.addEventListener('vibe-update-vcam', (event) => {
        const { enabled, source } = event.detail;
        vcamEnabled = enabled;
        if (source && source !== vcamSource) {
            vcamSource = source;
            vcamVideo.src = source;
            vcamVideo.play().catch(e => console.warn("ViBe VCam: Playback failed", e));
        }
        console.log(`ViBe VCam: State Updated (Enabled: ${vcamEnabled})`);
    });

    // Patch enumerateDevices
    navigator.mediaDevices.enumerateDevices = async function() {
        const devices = await originalEnumerateDevices();
        if (vcamEnabled) {
            return [virtualDevice, ...devices];
        }
        return devices;
    };

    // Patch getUserMedia
    navigator.mediaDevices.getUserMedia = async function(constraints) {
        if (vcamEnabled && constraints && constraints.video) {
            console.log("ViBe VCam: Intercepting getUserMedia for Virtual Feed...");
            
            // Wait for video to be ready if source just changed
            if (vcamVideo.readyState < 2 && vcamSource) {
                await new Promise(r => vcamVideo.oncanplay = r);
            }

            try {
                // Capture the stream from our hidden video element
                const stream = vcamVideo.captureStream ? vcamVideo.captureStream() : vcamVideo.mozCaptureStream();
                
                // If audio was requested, we need to provide a real audio track since capturing video doesn't give audio automatically
                if (constraints.audio) {
                    const audioStream = await originalGetUserMedia({ audio: constraints.audio });
                    audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
                }
                
                return stream;
            } catch (err) {
                console.error("ViBe VCam: Failed to capture virtual stream", err);
                return originalGetUserMedia(constraints);
            }
        }
        
        return originalGetUserMedia(constraints);
    };

    console.log("ViBe Auto: Camera Virtualization Patch Loaded.");
})();
