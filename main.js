// ============================================================================
// Ankita's Apology — Interactive 3D Romantic Universe
// Handcrafted with Three.js, GSAP & Web Audio API
// ============================================================================

(function() {
    'use strict';

    // Application State Machine
    const STATE = {
        ENTRANCE: 0,
        OPENING_PARTICLES: 1,
        HEART_WORLD: 2,
        APOLOGY_SCENE: 3,
        MEMORY_SECTION: 4,
        FINAL_SURPRISE: 5,
        HAPPY_ENDING: 6
    };
    let currentState = STATE.ENTRANCE;

    // Quality detection & reduced motion preferences
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const quality = {
        mobile: isMobile,
        particleMultiplier: isMobile ? 0.45 : 1.0
    };

    // Three.js Core
    let scene, camera, renderer;
    let clock = new THREE.Clock();
    let container = document.getElementById('canvas-container');

    // Scene Objects
    let mainHeartGroup, mainHeartMesh;
    let innerGlowMesh1, innerGlowMesh2;
    let innerPoint;
    let openingParticleSystem, giantParticleSystem;
    let volumetricLightSphere;
    let floatingMiniHearts = [];
    let butterflies = [];
    let fallingPetals = [];
    let goldenEmbers = [];
    let explosionHearts = [];
    let fireflies = [];
    let reflectiveFloor, floorRing;
    let centralSpotlight, ambientLight, goldPointLight, pinkPointLight;

    // Interaction & Animation State
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let orbitAngle = 0;
    let isCameraOrbiting = false;
    let heartBounceTween = null;
    let heartbeatTween = null;
    let chanceBtnTimer = null;
    let typewriterTimer = null;

    // UI Elements
    const entranceScreen = document.getElementById('entranceScreen');
    const startBtn = document.getElementById('startBtn');
    const soundBtn = document.getElementById('soundBtn');
    const soundText = document.getElementById('soundText');
    const typewriterBox = document.getElementById('typewriterBox');
    const typewriterText = document.getElementById('typewriterText');
    const chanceBtn = document.getElementById('chanceBtn');
    const thankyouBox = document.getElementById('thankyouBox');
    const apologySection = document.getElementById('apologySection');
    const apologyResponse = document.getElementById('apologyResponse');
    const listenBtn = document.getElementById('listenBtn');
    const sorryBtn = document.getElementById('sorryBtn');
    const readyBtn = document.getElementById('readyBtn');
    const apologyNextBtn = document.getElementById('apologyNextBtn');
    const memorySection = document.getElementById('memorySection');
    const memoryNextBtn = document.getElementById('memoryNextBtn');
    const finalSurpriseBox = document.getElementById('finalSurpriseBox');
    const finalNameTitle = document.getElementById('finalNameTitle');
    const finalSubtext = document.getElementById('finalSubtext');
    const finalQuestionBtn = document.getElementById('finalQuestionBtn');
    const questionModal = document.getElementById('questionModal');
    const yesBtn = document.getElementById('yesBtn');
    const obviouslyBtn = document.getElementById('obviouslyBtn');
    const playfulToast = document.getElementById('playfulToast');
    const happyEndingBox = document.getElementById('happyEndingBox');
    const replayBtn = document.getElementById('replayBtn');
    const shareBtn = document.getElementById('shareBtn');
    const memoryCards = document.querySelectorAll('.glass-memory-card');

    // ------------------------------------------------------------------------
    // WebGL Capability Check
    // ------------------------------------------------------------------------
    function isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------
    function init() {
        if (!isWebGLAvailable()) {
            console.warn('WebGL not supported on this device/browser.');
            if (entranceScreen) {
                const sub = entranceScreen.querySelector('.entrance-subtitle');
                if (sub) sub.textContent = "Your browser doesn't support WebGL 3D, but my love and apology for you are still 100% real. ❤️";
            }
            return;
        }

        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050106);
        scene.fog = new THREE.FogExp2(0x0a0108, 0.0018);

        // Camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 0, 240);

        // WebGL Renderer
        renderer = new THREE.WebGLRenderer({ antialias: !quality.mobile, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);

        // Lighting
        setupLighting();

        // Reflective ground plane
        createReflectiveFloor();

        // 3D Heart Geometry & Central Actor
        createMainHeart();

        // Environment elements (stars, nebula & ambient embers)
        createAmbientStardust();

        // Event listeners
        window.addEventListener('resize', onWindowResize, { passive: true });
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('visibilitychange', onVisibilityChange);

        setupUIEvents();

        // Start render loop
        animate();
    }

    // ------------------------------------------------------------------------
    // Lighting Setup
    // ------------------------------------------------------------------------
    function setupLighting() {
        ambientLight = new THREE.AmbientLight(0xffe4e6, 0.6);
        scene.add(ambientLight);

        // Glowing center light
        pinkPointLight = new THREE.PointLight(0xff2d75, 3.2, 450);
        pinkPointLight.position.set(0, 6, 20);
        scene.add(pinkPointLight);

        // Gold rim highlight
        goldPointLight = new THREE.PointLight(0xffd700, 1.9, 500);
        goldPointLight.position.set(-80, 120, -60);
        scene.add(goldPointLight);

        // Volumetric backlight
        centralSpotlight = new THREE.SpotLight(0xff4081, 2.5, 600, Math.PI / 3.5, 0.5, 1.5);
        centralSpotlight.position.set(0, 30, -120);
        centralSpotlight.target.position.set(0, 0, 0);
        scene.add(centralSpotlight);
        scene.add(centralSpotlight.target);
    }

    // ------------------------------------------------------------------------
    // Reflective Floor
    // ------------------------------------------------------------------------
    function createReflectiveFloor() {
        const floorGeo = new THREE.CircleGeometry(320, quality.mobile ? 32 : 64);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x12020a,
            roughness: 0.15,
            metalness: 0.85,
            side: THREE.DoubleSide
        });
        reflectiveFloor = new THREE.Mesh(floorGeo, floorMat);
        reflectiveFloor.rotation.x = -Math.PI / 2;
        reflectiveFloor.position.y = -55;
        scene.add(reflectiveFloor);

        // Soft floor glow ring
        const ringGeo = new THREE.RingGeometry(30, 280, quality.mobile ? 32 : 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff2d75,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending
        });
        floorRing = new THREE.Mesh(ringGeo, ringMat);
        floorRing.rotation.x = -Math.PI / 2;
        floorRing.position.y = -54.8;
        scene.add(floorRing);
    }

    // ------------------------------------------------------------------------
    // Dynamic Soft Particle Texture Helper
    // ------------------------------------------------------------------------
    function createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 110, 167, 0.85)');
        gradient.addColorStop(0.65, 'rgba(255, 45, 117, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    function createHeartShape() {
        const shape = new THREE.Shape();
        const x = 0, y = 0;
        shape.moveTo(x, y + 2.5);
        shape.bezierCurveTo(x, y + 2.5, x - 2.5, y + 5.5, x - 5, y + 5.5);
        shape.bezierCurveTo(x - 8.5, y + 5.5, x - 8.5, y + 2, x - 8.5, y + 2);
        shape.bezierCurveTo(x - 8.5, y - 2, x - 5.5, y - 5.5, x, y - 9.5);
        shape.bezierCurveTo(x + 5.5, y - 5.5, x + 8.5, y - 2, x + 8.5, y + 2);
        shape.bezierCurveTo(x + 8.5, y + 2, x + 8.5, y + 5.5, x + 5, y + 5.5);
        shape.bezierCurveTo(x + 2.5, y + 5.5, x, y + 2.5, x, y + 2.5);
        return shape;
    }

    // ------------------------------------------------------------------------
    // 3D Main Heart (Centerpiece)
    // ------------------------------------------------------------------------
    function createMainHeart() {
        mainHeartGroup = new THREE.Group();
        mainHeartGroup.position.set(0, 4, 0);

        const heartShape = createHeartShape();
        const extrudeSettings = {
            steps: quality.mobile ? 3 : 5,
            depth: 4.5,
            bevelEnabled: true,
            bevelThickness: 2.5,
            bevelSize: 1.8,
            bevelOffset: 0,
            bevelSegments: quality.mobile ? 6 : 12
        };

        const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        geometry.center();

        // Premium Ruby Material with rich crimson tones
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xe60026,
            emissive: 0x7d001f,
            emissiveIntensity: 0.85,
            roughness: 0.08,
            metalness: 0.06,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 0.95
        });

        mainHeartMesh = new THREE.Mesh(geometry, material);
        mainHeartMesh.scale.set(4.5, 4.5, 4.5);
        mainHeartGroup.add(mainHeartMesh);

        // Inner glowing core - outer glow
        const innerGeo1 = geometry.clone();
        const innerMat1 = new THREE.MeshBasicMaterial({
            color: 0xff4081,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        innerGlowMesh1 = new THREE.Mesh(innerGeo1, innerMat1);
        innerGlowMesh1.scale.set(4.2, 4.2, 4.2);
        mainHeartGroup.add(innerGlowMesh1);

        // Inner glowing core - inner pulse
        const innerGeo2 = geometry.clone();
        const innerMat2 = new THREE.MeshBasicMaterial({
            color: 0xff1e56,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending
        });
        innerGlowMesh2 = new THREE.Mesh(innerGeo2, innerMat2);
        innerGlowMesh2.scale.set(3.8, 3.8, 3.8);
        mainHeartGroup.add(innerGlowMesh2);

        // Pulsing light right inside the heart
        innerPoint = new THREE.PointLight(0xff2d75, 3.0, 160);
        mainHeartGroup.add(innerPoint);

        // Initial hidden state for the opening
        mainHeartGroup.scale.set(0.001, 0.001, 0.001);
        mainHeartGroup.visible = false;
        scene.add(mainHeartGroup);

        startHeartbeatCycle(1.1);
    }

    // ------------------------------------------------------------------------
    // Heartbeat Pulse Animation
    // ------------------------------------------------------------------------
    function startHeartbeatCycle(duration = 1.1) {
        if (heartbeatTween) heartbeatTween.kill();

        // Realistic lub-dub rhythm with internal glow pulse
        const tl = gsap.timeline({ repeat: -1, repeatDelay: duration * 0.45 });
        tl.to(mainHeartGroup.scale, {
            x: 1.18, y: 1.18, z: 1.18,
            duration: 0.14,
            ease: "power2.out",
            onStart: () => {
                if (window.romanticAudio && currentState >= STATE.HEART_WORLD) {
                    window.romanticAudio.playHeartbeat(false);
                }
            }
        })
        .to(innerGlowMesh1.material, { opacity: 0.35, duration: 0.14, ease: "power2.out" }, 0)
        .to(innerGlowMesh2.material, { opacity: 0.25, duration: 0.14, ease: "power2.out" }, 0)
        .to(innerPoint, { intensity: 3.5, duration: 0.14, ease: "power2.out" }, 0)
        .to(mainHeartGroup.scale, {
            x: 0.98, y: 0.98, z: 0.98,
            duration: 0.12,
            ease: "power1.inOut"
        })
        .to(innerGlowMesh1.material, { opacity: 0.20, duration: 0.12, ease: "power1.inOut" }, 0.14)
        .to(innerGlowMesh2.material, { opacity: 0.12, duration: 0.12, ease: "power1.inOut" }, 0.14)
        .to(innerPoint, { intensity: 2.0, duration: 0.12, ease: "power1.inOut" }, 0.14)
        .to(mainHeartGroup.scale, {
            x: 1.10, y: 1.10, z: 1.10,
            duration: 0.12,
            ease: "power2.out"
        })
        .to(innerGlowMesh1.material, { opacity: 0.30, duration: 0.12, ease: "power2.out" }, 0.26)
        .to(innerGlowMesh2.material, { opacity: 0.20, duration: 0.12, ease: "power2.out" }, 0.26)
        .to(innerPoint, { intensity: 3.0, duration: 0.12, ease: "power2.out" }, 0.26)
        .to(mainHeartGroup.scale, {
            x: 1.0, y: 1.0, z: 1.0,
            duration: 0.28,
            ease: "sine.out"
        })
        .to(innerGlowMesh1.material, { opacity: 0.25, duration: 0.28, ease: "sine.out" }, 0.38)
        .to(innerGlowMesh2.material, { opacity: 0.16, duration: 0.28, ease: "sine.out" }, 0.38)
        .to(innerPoint, { intensity: 2.5, duration: 0.28, ease: "sine.out" }, 0.38);

        heartbeatTween = tl;
    }

    // ------------------------------------------------------------------------
    // Ambient Stardust & Cosmic Nebula
    // ------------------------------------------------------------------------
    function createAmbientStardust() {
        const count = quality.mobile ? 800 : 2600;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const starColors = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xffbfd5),
            new THREE.Color(0xffd98e),
            new THREE.Color(0xb894ff),
            new THREE.Color(0xff6d9b)
        ];

        for (let i = 0; i < count; i++) {
            const radius = 500 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 150 + Math.random() * 100;
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const c = starColors[Math.floor(Math.random() * starColors.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
            sizes[i] = 0.6 + Math.random() * 1.6;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1.2,
            sizeAttenuation: true,
            map: createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const starField = new THREE.Points(geometry, material);
        scene.add(starField);

        createNebulaClouds();
    }

    function createNebulaClouds() {
        const count = quality.mobile ? 120 : 400;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const nebulaColors = [
            new THREE.Color(0x3a0d33),
            new THREE.Color(0x6d163e),
            new THREE.Color(0x9b1a4b),
            new THREE.Color(0x280526)
        ];

        for (let i = 0; i < count; i++) {
            const radius = 350 + Math.random() * 450;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 80 + Math.random() * 80;
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const c = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
            colors[i * 3] = c.r * 0.35;
            colors[i * 3 + 1] = c.g * 0.35;
            colors[i * 3 + 2] = c.b * 0.35;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: quality.mobile ? 7.0 : 10.0,
            map: createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        const nebula = new THREE.Points(geometry, material);
        scene.add(nebula);
    }

    function createHeartVolumetricLight() {
        const geometry = new THREE.SphereGeometry(75, 24, 24);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff2d75,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        volumetricLightSphere = new THREE.Mesh(geometry, material);
        volumetricLightSphere.position.set(0, 18, 0);
        scene.add(volumetricLightSphere);

        gsap.to(volumetricLightSphere.material, {
            opacity: 0.22,
            duration: 2.2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    }

    // ------------------------------------------------------------------------
    // Scene 1: Opening Starfield & Particle Heart Assembly
    // ------------------------------------------------------------------------
    function startOpeningSequence() {
        currentState = STATE.OPENING_PARTICLES;

        // Hide entrance screen cleanly
        gsap.to(entranceScreen, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => {
                entranceScreen.style.display = 'none';
            }
        });

        // Start BGM safely (Web Audio policy satisfied via startBtn user gesture)
        try {
            if (window.romanticAudio) {
                window.romanticAudio.startBGM();
            }
        } catch (e) {
            console.warn("Audio start error:", e);
        }

        // Camera starts distant in space
        camera.position.set(0, 0, 220);

        // Create opening particles that slowly converge from deep space
        createOpeningHeartParticles();

        // Cinematic typewriter sequence
        setTimeout(() => {
            playTypewriterCinematic();
        }, 1000);
    }

    function createOpeningHeartParticles() {
        const count = quality.mobile ? 1200 : 2800;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const targetPositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorCore = new THREE.Color(0xff2d75);
        const colorRim = new THREE.Color(0xff6ea7);
        const colorGlow = new THREE.Color(0xffd27c);

        for (let i = 0; i < count; i++) {
            const radius = 700 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 150 + Math.random() * 100;
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Parametric heart curve targets
            const t = Math.PI * 2 * (i / count);
            const scale = 2.8;
            const rx = 16 * Math.pow(Math.sin(t), 3) * scale;
            const ry = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
            const rz = (Math.random() - 0.5) * 25;

            targetPositions[i * 3] = rx;
            targetPositions[i * 3 + 1] = ry + 20;
            targetPositions[i * 3 + 2] = rz;

            const distFromCenter = Math.sqrt(rx * rx + (ry + 20) * (ry + 20) + rz * rz) / (scale * 20);
            const colorBlend = Math.min(1, Math.max(0, distFromCenter));
            const c = new THREE.Color().lerpColors(colorCore, colorGlow, 1 - colorBlend);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: quality.mobile ? 2.2 : 2.8,
            map: createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        openingParticleSystem = new THREE.Points(geometry, material);
        scene.add(openingParticleSystem);

        createHeartVolumetricLight();

        // Fade in and assemble particles
        gsap.to(openingParticleSystem.material, { opacity: 0.95, duration: 1.5 });

        const animObj = { progress: 0 };
        gsap.to(animObj, {
            progress: 1,
            duration: 4.8,
            delay: 0.5,
            ease: "power3.out",
            onUpdate: () => {
                const posAttr = openingParticleSystem.geometry.attributes.position;
                for (let i = 0; i < count; i++) {
                    const sx = positions[i * 3];
                    const sy = positions[i * 3 + 1];
                    const sz = positions[i * 3 + 2];

                    const tx = targetPositions[i * 3];
                    const ty = targetPositions[i * 3 + 1];
                    const tz = targetPositions[i * 3 + 2];

                    posAttr.setXYZ(i,
                        sx + (tx - sx) * animObj.progress,
                        sy + (ty - sy) * animObj.progress,
                        sz + (tz - sz) * animObj.progress
                    );
                }
                posAttr.needsUpdate = true;
            }
        });

        // Glide camera smoothly forward
        gsap.to(camera.position, {
            z: 140,
            duration: 5.5,
            ease: "sine.inOut"
        });
    }

    // ------------------------------------------------------------------------
    // Typewriter Cinematic Animation
    // ------------------------------------------------------------------------
    function playTypewriterCinematic() {
        typewriterBox.style.display = 'flex';
        gsap.to(typewriterBox, { opacity: 1, duration: 0.8 });

        const dialogue = [
            { text: "Ankita... ❤️", hold: 1400 },
            { text: "Aaj tumse ek baat dil se kehni hai.", hold: 1800 },
            { text: "Main jaanta hoon maine galtiyan ki hain, aur tumhara gussa bilkul sahi hai...", hold: 2200 },
            { text: "Par mera dil sirf tumhari khushi aur tumhari hansi chahta hai.", hold: 2200 }
        ];

        let index = 0;

        function showNextLine() {
            if (index >= dialogue.length) {
                setTimeout(() => {
                    gsap.to(typewriterBox, {
                        opacity: 0,
                        duration: 0.6,
                        onComplete: () => {
                            typewriterBox.style.display = 'none';
                            typewriterText.innerHTML = '';
                            transitionToHeartWorld();
                        }
                    });
                }, 600);
                return;
            }

            const currentItem = dialogue[index];
            typeLine(currentItem.text, () => {
                typewriterTimer = setTimeout(() => {
                    if (index === 0 && window.romanticAudio) {
                        window.romanticAudio.playHeartbeat(false);
                    }
                    index++;
                    showNextLine();
                }, currentItem.hold);
            });
        }

        showNextLine();
    }

    function typeLine(fullText, onDone) {
        typewriterText.innerHTML = '';
        let charIndex = 0;
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';

        function tick() {
            if (charIndex <= fullText.length) {
                typewriterText.textContent = fullText.slice(0, charIndex);
                typewriterText.appendChild(cursor);
                charIndex++;
                setTimeout(tick, 48 + Math.random() * 24);
            } else {
                if (onDone) onDone();
            }
        }
        tick();
    }

    // ------------------------------------------------------------------------
    // Scene 2: 3D Heart World
    // ------------------------------------------------------------------------
    function transitionToHeartWorld() {
        currentState = STATE.HEART_WORLD;
        isCameraOrbiting = true;

        typewriterBox.style.display = 'none';
        typewriterText.innerHTML = '';

        if (openingParticleSystem) {
            gsap.to(openingParticleSystem.material, {
                opacity: 0,
                duration: 1.2,
                onComplete: () => {
                    scene.remove(openingParticleSystem);
                }
            });
        }
        if (volumetricLightSphere) {
            gsap.to(volumetricLightSphere.material, {
                opacity: 0,
                duration: 1.2,
                onComplete: () => {
                    scene.remove(volumetricLightSphere);
                }
            });
        }

        // Reveal central 3D heart with majestic scale pop
        mainHeartGroup.visible = true;
        gsap.fromTo(mainHeartGroup.scale, 
            { x: 0.01, y: 0.01, z: 0.01 },
            { x: 1.0, y: 1.0, z: 1.0, duration: 1.6, ease: "back.out(1.8)" }
        );

        // Adjust camera position
        gsap.to(camera.position, {
            x: 0, y: 15, z: 120,
            duration: 1.8,
            ease: "power2.out"
        });

        // Spawn 3D Heart World entities
        createFloatingMiniHearts(quality.mobile ? 40 : 75);
        createAnimatedButterflies(quality.mobile ? 10 : 18);
        createFallingRosePetals(quality.mobile ? 35 : 65);

        // Show interactive chance button after heart world settles
        clearTimeout(chanceBtnTimer);
        chanceBtnTimer = setTimeout(() => {
            if (currentState === STATE.HEART_WORLD) {
                chanceBtn.style.display = 'block';
                gsap.fromTo(chanceBtn,
                    { opacity: 0, scale: 0.7, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
                );
            }
        }, 1800);
    }

    // ------------------------------------------------------------------------
    // Floating Mini 3D Hearts
    // ------------------------------------------------------------------------
    function createFloatingMiniHearts(count) {
        const shape = createHeartShape();
        const extrude = {
            steps: 2, depth: 1.0, bevelEnabled: true,
            bevelThickness: 0.5, bevelSize: 0.3, bevelSegments: 3
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrude);
        geo.center();

        const colors = [
            0xff2d75, 0xff6ea7, 0xffd269, 0xd80032, 0xff99bb,
            0xff6b81, 0xff4757, 0xff8a80, 0xf48fb1, 0xe91e63
        ];

        for (let i = 0; i < count; i++) {
            const color = colors[i % colors.length];
            const mat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.2 + Math.random() * 0.1,
                metalness: 0.1 + Math.random() * 0.1,
                emissive: color,
                emissiveIntensity: 0.3 + Math.random() * 0.2
            });

            const mesh = new THREE.Mesh(geo, mat);
            const scale = 0.3 + Math.random() * 0.45;
            mesh.scale.set(scale, scale, scale);

            const radius = 50 + Math.random() * 95;
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 70 + 5;

            mesh.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );

            mesh.userData = {
                angle: angle,
                radius: radius,
                baseY: height,
                baseScale: scale,
                orbitSpeed: (0.12 + Math.random() * 0.18) * (Math.random() > 0.5 ? 1 : -1),
                floatSpeed: 0.5 + Math.random() * 1.0,
                floatAmp: 3.0 + Math.random() * 4.0,
                rotSpeedX: (Math.random() - 0.5) * 0.012,
                rotSpeedY: (Math.random() - 0.5) * 0.012,
                pulseSpeed: 0.5 + Math.random() * 1.5,
                pulseAmount: 0.03 + Math.random() * 0.07,
                driftSpeed: 0.001 + Math.random() * 0.002,
                driftDirection: Math.random() > 0.5 ? 1 : -1
            };

            scene.add(mesh);
            floatingMiniHearts.push(mesh);
        }
    }

    // ------------------------------------------------------------------------
    // Animated Fluttering 3D Butterflies
    // ------------------------------------------------------------------------
    function createAnimatedButterflies(count) {
        for (let i = 0; i < count; i++) {
            const bGroup = new THREE.Group();

            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.quadraticCurveTo(1.0, 2.0, 2.5, 3.0);
            wingShape.quadraticCurveTo(4.0, 2.5, 5.0, 0.5);
            wingShape.quadraticCurveTo(4.5, -1.0, 3.0, -2.0);
            wingShape.quadraticCurveTo(1.5, -0.5, 0, 0);

            const wingGeo = new THREE.ShapeGeometry(wingShape);
            const wingColors = [0xff6ea7, 0xff9cc0, 0xffb3d4, 0xff8ab6, 0xff7a8f];
            const wingColor = wingColors[Math.floor(Math.random() * wingColors.length)];
            const wingMat = new THREE.MeshStandardMaterial({
                color: wingColor,
                emissive: wingColor,
                emissiveIntensity: 0.4,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.88,
                roughness: 0.3
            });

            const leftWing = new THREE.Mesh(wingGeo, wingMat);
            const rightWing = new THREE.Mesh(wingGeo, wingMat);
            leftWing.scale.set(0.7, 0.7, 0.7);
            rightWing.scale.set(-0.7, 0.7, 0.7);

            bGroup.add(leftWing);
            bGroup.add(rightWing);

            // Butterfly body
            const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.9, 6);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d0012, roughness: 0.5 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.4;
            bGroup.add(body);

            const radius = 60 + Math.random() * 85;
            const angle = Math.random() * Math.PI * 2;
            const baseY = 10 + (Math.random() - 0.5) * 50;

            bGroup.position.set(
                Math.cos(angle) * radius,
                baseY,
                Math.sin(angle) * radius
            );

            bGroup.userData = {
                angle: angle,
                radius: radius,
                baseY: baseY,
                speed: 0.25 + Math.random() * 0.35,
                phase: Math.random() * Math.PI * 2,
                wingSpeed: 12 + Math.random() * 6,
                wobbleSpeed: 2 + Math.random() * 2,
                heightWobble: 1.5 + Math.random() * 2.0,
                lateralWobble: 0.8 + Math.random() * 1.2,
                tiltSpeed: 1.5 + Math.random() * 1.5,
                leftWing: leftWing,
                rightWing: rightWing,
                bodyTilt: 0,
                targetTilt: 0
            };

            scene.add(bGroup);
            butterflies.push(bGroup);
        }
    }

    // ------------------------------------------------------------------------
    // Falling Rose Petals
    // ------------------------------------------------------------------------
    function createFallingRosePetals(count) {
        const petalGeo = new THREE.PlaneGeometry(1.6, 2.2, 2, 2);
        const pos = petalGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const baseCurve = (vx * vx + vy * vy) * -0.04;
            pos.setZ(i, baseCurve);
        }
        petalGeo.computeVertexNormals();

        const petalColors = [0xba0c35, 0xd80032, 0xff6ea7, 0xff9cc0, 0xffb3d4];
        const petalMat = new THREE.MeshStandardMaterial({
            color: 0xd80032,
            emissive: 0x900020,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.88,
            roughness: 0.2
        });

        for (let i = 0; i < count; i++) {
            const pColor = petalColors[Math.floor(Math.random() * petalColors.length)];
            const curMat = petalMat.clone();
            curMat.color.setHex(pColor);
            curMat.emissive.setHex(pColor);

            const petal = new THREE.Mesh(petalGeo, curMat);
            petal.position.set(
                (Math.random() - 0.5) * 320,
                Math.random() * 160 + 20,
                (Math.random() - 0.5) * 320
            );

            const scale = 0.4 + Math.random() * 0.55;
            petal.scale.set(scale, scale, scale);

            petal.userData = {
                fallSpeed: 0.16 + Math.random() * 0.22,
                windOffsetX: (Math.random() - 0.5) * 0.4,
                windOffsetZ: (Math.random() - 0.5) * 0.4,
                windSpeed: 0.02 + Math.random() * 0.04,
                rotSpeedX: (Math.random() - 0.5) * 0.02,
                rotSpeedY: (Math.random() - 0.5) * 0.02,
                rotSpeedZ: (Math.random() - 0.5) * 0.015,
                tumbleSpeed: 0.1 + Math.random() * 0.25,
                tumbleAxisX: Math.random() - 0.5,
                tumbleAxisY: Math.random() - 0.5,
                tumbleAxisZ: Math.random() - 0.5,
                wobbleAmp: 0.3 + Math.random() * 0.4,
                wobbleFreq: 0.8 + Math.random() * 1.0,
                initialRotation: Math.random() * Math.PI * 2
            };

            petal.rotation.y = petal.userData.initialRotation;

            scene.add(petal);
            fallingPetals.push(petal);
        }
    }

    // ------------------------------------------------------------------------
    // Scene 3: Interactive Moment (Chance Clicked)
    // ------------------------------------------------------------------------
    function onChanceClick() {
        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
            window.romanticAudio.playExplosionSound();
        }

        clearTimeout(chanceBtnTimer);
        chanceBtn.style.display = 'none';
        typewriterBox.style.display = 'none';
        typewriterText.innerHTML = '';

        // Spectacular 3D Heart Burst
        triggerHeartBurstExplosion();

        // Screen Confetti Shower
        triggerCanvasConfettiShower();

        // Main Heart Rapid Pulse & Glow Flash
        gsap.timeline()
            .to(mainHeartGroup.scale, { x: 1.55, y: 1.55, z: 1.55, duration: 0.15, ease: "power2.out" })
            .to(mainHeartGroup.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 0.12 })
            .to(mainHeartGroup.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 0.14 })
            .to(mainHeartGroup.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.35, ease: "elastic.out(1, 0.4)" });

        // Camera dramatic zoom
        gsap.to(camera.position, {
            z: 85,
            duration: 1.4,
            ease: "power2.out"
        });

        // Show "Thank you ❤️" banner
        setTimeout(() => {
            thankyouBox.style.display = 'block';
            if (window.romanticAudio) {
                window.romanticAudio.playSparkleChime();
            }
            gsap.fromTo(thankyouBox,
                { opacity: 0, scale: 0.6, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.8)" }
            );

            // After delay, smoothly transition to Apology Section
            setTimeout(() => {
                gsap.to(thankyouBox, {
                    opacity: 0,
                    scale: 0.8,
                    duration: 0.5,
                    onComplete: () => {
                        thankyouBox.style.display = 'none';
                        transitionToApologyScene();
                    }
                });
            }, 2000);

        }, 600);
    }

    function triggerHeartBurstExplosion() {
        const count = quality.mobile ? 45 : 90;
        const shape = createHeartShape();
        const extrude = { steps: 1, depth: 0.4, bevelEnabled: false };
        const geo = new THREE.ExtrudeGeometry(shape, extrude);
        geo.center();

        const colors = [0xff2d75, 0xffd269, 0xffffff, 0xd80032];

        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 1
            });
            const m = new THREE.Mesh(geo, mat);
            m.scale.set(0.28, 0.28, 0.28);
            m.position.set(0, 4, 0);

            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 65;
            m.userData.vx = Math.sin(phi) * Math.cos(theta) * speed;
            m.userData.vy = Math.sin(phi) * Math.sin(theta) * speed;
            m.userData.vz = Math.cos(phi) * speed;

            scene.add(m);
            explosionHearts.push(m);

            gsap.to(m.material, {
                opacity: 0,
                duration: 1.8,
                delay: 0.3,
                onComplete: () => {
                    scene.remove(m);
                }
            });
        }
    }

    function triggerCanvasConfettiShower() {
        if (typeof confetti !== 'function') return;
        confetti({
            particleCount: quality.mobile ? 60 : 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#ff2d75', '#ffd700', '#ffffff', '#ff6ea7', '#ff99bb']
        });
    }

    // ------------------------------------------------------------------------
    // Scene 4: Sincere Apology Scene (Honest, Respectful & Empathetic)
    // ------------------------------------------------------------------------
    function transitionToApologyScene() {
        currentState = STATE.APOLOGY_SCENE;
        isCameraOrbiting = false;

        chanceBtn.style.display = 'none';
        thankyouBox.style.display = 'none';

        // Camera position framing the apology box
        gsap.to(camera.position, {
            x: 0, y: 12, z: 110,
            duration: 1.5,
            ease: "power2.out"
        });

        // Dim & slightly lower main heart so the text is the focal hero
        gsap.to(mainHeartGroup.scale, {
            x: 0.55, y: 0.55, z: 0.55,
            duration: 1.0
        });
        gsap.to(mainHeartGroup.position, {
            y: -6,
            duration: 1.0
        });

        // Show apology section with luxurious scale pop
        if (apologySection) {
            apologySection.style.display = 'flex';
            gsap.fromTo(apologySection,
                { opacity: 0, scale: 0.88, y: 25 },
                { opacity: 1, scale: 1, y: 0, duration: 0.85, ease: "back.out(1.5)" }
            );
        }
    }

    // ------------------------------------------------------------------------
    // Scene 5: Memory Section (Floating 3D Glass Cards)
    // ------------------------------------------------------------------------
    function transitionToMemorySection() {
        currentState = STATE.MEMORY_SECTION;
        isCameraOrbiting = true;

        // Cleanly hide apology section
        if (apologySection) {
            gsap.to(apologySection, {
                opacity: 0,
                scale: 0.9,
                duration: 0.45,
                onComplete: () => {
                    apologySection.style.display = 'none';
                }
            });
        }

        // Pull camera back to comfortably frame the 3 cards
        gsap.to(camera.position, {
            x: 0, y: 10, z: 150,
            duration: 1.5,
            ease: "power2.out"
        });

        // Restore main heart scale & position
        gsap.to(mainHeartGroup.scale, {
            x: 0.75, y: 0.75, z: 0.75,
            duration: 1.2
        });
        gsap.to(mainHeartGroup.position, {
            y: 4,
            duration: 1.2
        });

        // Display memory container
        memorySection.style.display = 'flex';
        gsap.fromTo(memorySection,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );

        // Stagger card appearances
        gsap.fromTo(memoryCards,
            { opacity: 0, y: 40, rotateX: 15 },
            { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.16, ease: "back.out(1.5)" }
        );
    }

    // Interactive 3D Card Parallax Tilt on Cursor
    function applyCardParallax() {
        if (currentState !== STATE.MEMORY_SECTION || prefersReducedMotion) return;
        const normX = (mouse.x / windowHalfX);
        const normY = (mouse.y / windowHalfY);

        memoryCards.forEach((card, index) => {
            const factor = (index + 1) * 0.35;
            const tiltX = -normY * 10;
            const tiltY = normX * 12;
            const moveX = normX * 8 * factor;
            const moveY = normY * 8 * factor;

            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate3d(${moveX}px, ${moveY}px, 0)`;
        });
    }

    // ------------------------------------------------------------------------
    // Scene 6: Final Surprise (Giant Glowing Particle Heart & Last Question)
    // ------------------------------------------------------------------------
    function transitionToFinalSurprise() {
        currentState = STATE.FINAL_SURPRISE;

        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }

        memorySection.style.display = 'none';
        chanceBtn.style.display = 'none';

        // Hide central solid heart
        gsap.to(mainHeartGroup.scale, {
            x: 0.01, y: 0.01, z: 0.01,
            duration: 0.8,
            onComplete: () => { mainHeartGroup.visible = false; }
        });

        // Warm dreamy sunset transition for lighting & fog
        gsap.to(scene.fog.color, { r: 0.18, g: 0.04, b: 0.12, duration: 2.0 });
        gsap.to(renderer, {
            toneMappingExposure: 1.35,
            duration: 2.0
        });
        gsap.to(pinkPointLight.color, { r: 1.0, g: 0.4, b: 0.6, duration: 2.0 });
        gsap.to(goldPointLight, { intensity: 3.5, duration: 2.0 });

        // Spawn Giant Glowing Particle Heart
        createGiantParticleHeart();

        // Camera position
        gsap.to(camera.position, {
            x: 0, y: 0, z: 125,
            duration: 2.0,
            ease: "power2.out"
        });

        // Show Final Surprise Box Texts in sequence
        setTimeout(() => {
            finalSurpriseBox.style.display = 'flex';
            finalSubtext.innerHTML = "Ab gussa chhod bhi do na... 🥺❤️";
            finalQuestionBtn.style.display = 'none';

            gsap.fromTo(finalSurpriseBox,
                { opacity: 0, scale: 0.7 },
                { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.6)" }
            );

            // Animate text transition from "Ab gussa chhod bhi do na..." -> "Ek smile de do..."
            setTimeout(() => {
                gsap.to(finalSubtext, {
                    opacity: 0,
                    y: -10,
                    duration: 0.5,
                    onComplete: () => {
                        finalSubtext.innerHTML = "Ek smile de do... baaki sab main sambhal lunga. 😌❤️";
                        gsap.fromTo(finalSubtext,
                            { opacity: 0, y: 15 },
                            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
                        );

                        // Show "Last Question 👀" button
                        setTimeout(() => {
                            finalQuestionBtn.style.display = 'inline-block';
                            gsap.fromTo(finalQuestionBtn,
                                { opacity: 0, scale: 0.7 },
                                { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.8)" }
                            );
                        }, 1000);
                    }
                });
            }, 2600);

        }, 1200);
    }

    function createGiantParticleHeart() {
        const count = quality.mobile ? 900 : 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorGold = new THREE.Color(0xffd269);
        const colorPink = new THREE.Color(0xff2d75);
        const colorWhite = new THREE.Color(0xffffff);

        for (let i = 0; i < count; i++) {
            const t = Math.PI * 2 * (i / count);
            const scale = 4.0;

            const rx = 16 * Math.pow(Math.sin(t), 3) * scale;
            const ry = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
            const rz = (Math.random() - 0.5) * 20;

            positions[i * 3] = rx * 0.12;
            positions[i * 3 + 1] = (ry + 12) * 0.12;
            positions[i * 3 + 2] = rz * 0.12;

            const rand = Math.random();
            if (rand < 0.12) {
                colors[i * 3] = colorWhite.r;
                colors[i * 3 + 1] = colorWhite.g;
                colors[i * 3 + 2] = colorWhite.b;
            } else if (rand < 0.5) {
                colors[i * 3] = colorGold.r;
                colors[i * 3 + 1] = colorGold.g;
                colors[i * 3 + 2] = colorGold.b;
            } else {
                colors[i * 3] = colorPink.r;
                colors[i * 3 + 1] = colorPink.g;
                colors[i * 3 + 2] = colorPink.b;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: quality.mobile ? 3.0 : 4.5,
            map: createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        giantParticleSystem = new THREE.Points(geometry, material);
        scene.add(giantParticleSystem);

        const anim = { p: 0, op: 0 };
        gsap.to(anim, {
            op: 1.0, duration: 1.8,
            onUpdate: () => { giantParticleSystem.material.opacity = anim.op; }
        });

        gsap.to(anim, {
            p: 1.0, duration: 3.2, ease: "elastic.out(1, 0.4)",
            onUpdate: () => {
                const posAttr = giantParticleSystem.geometry.attributes.position;
                for (let i = 0; i < count; i++) {
                    const t = Math.PI * 2 * (i / count);
                    const scale = 4.0;
                    const rx = 16 * Math.pow(Math.sin(t), 3) * scale;
                    const ry = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
                    const rz = (Math.random() - 0.5) * 20;

                    posAttr.setXYZ(i, rx * anim.p, (ry + 12) * anim.p, rz * anim.p);
                }
                posAttr.needsUpdate = true;
            }
        });

        gsap.delayedCall(3.5, () => {
            gsap.to(giantParticleSystem.scale, {
                x: 1.06, y: 1.06, z: 1.06,
                duration: 1.2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });
        });
    }

    // ------------------------------------------------------------------------
    // Last Question & Modal
    // ------------------------------------------------------------------------
    function onFinalQuestionClick() {
        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }

        clearTimeout(chanceBtnTimer);
        chanceBtn.style.display = 'none';
        finalSurpriseBox.style.display = 'none';

        gsap.to(camera.position, {
            z: 60,
            duration: 1.5,
            ease: "power2.inOut"
        });

        setTimeout(() => {
            questionModal.style.display = 'flex';
            gsap.fromTo(questionModal,
                { opacity: 0, scale: 0.7, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.8)" }
            );
        }, 800);
    }

    function onObviouslyClick() {
        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }

        gsap.timeline()
            .to(obviouslyBtn, { x: -12, rotation: -6, duration: 0.08 })
            .to(obviouslyBtn, { x: 12, rotation: 6, duration: 0.08 })
            .to(obviouslyBtn, { x: -8, rotation: -3, duration: 0.08 })
            .to(obviouslyBtn, { x: 0, rotation: 0, duration: 0.08 });

        playfulToast.style.display = 'block';
        gsap.fromTo(playfulToast,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4 }
        );

        setTimeout(() => {
            triggerHappyEnding();
        }, 750);
    }

    function onYesClick() {
        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }
        triggerHappyEnding();
    }

    // ------------------------------------------------------------------------
    // Scene 7: Happy Ending (Grand Climax)
    // ------------------------------------------------------------------------
    function triggerHappyEnding() {
        currentState = STATE.HAPPY_ENDING;

        clearTimeout(chanceBtnTimer);
        chanceBtn.style.display = 'none';
        questionModal.style.display = 'none';
        finalSurpriseBox.style.display = 'none';
        typewriterBox.style.display = 'none';
        typewriterText.innerHTML = '';
        memorySection.style.display = 'none';
        thankyouBox.style.display = 'none';
        if (apologySection) apologySection.style.display = 'none';

        // Audio celebration fanfare
        if (window.romanticAudio) {
            window.romanticAudio.playCelebrationFanfare();
        }

        // Camera pulls back in a majestic sweep
        gsap.to(camera.position, {
            x: 0,
            y: 18,
            z: 160,
            duration: 2.2,
            ease: "power2.out"
        });

        // Restore centerpiece 3D heart with joyful bounce
        mainHeartGroup.visible = true;
        mainHeartGroup.position.set(0, 4, 0);
        gsap.fromTo(mainHeartGroup.scale,
            { x: 0.01, y: 0.01, z: 0.01 },
            { x: 1.15, y: 1.15, z: 1.15, duration: 1.4, ease: "elastic.out(1, 0.4)" }
        );

        heartBounceTween = gsap.to(mainHeartGroup.position, {
            y: 18,
            duration: 0.65,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });

        runContinuousFireworks();
        createFireflySwarm(quality.mobile ? 25 : 45);
        createFallingRosePetals(quality.mobile ? 40 : 80);

        setTimeout(() => {
            happyEndingBox.style.display = 'flex';
            gsap.fromTo(happyEndingBox,
                { opacity: 0, scale: 0.7, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
            );
        }, 500);
    }

    function runContinuousFireworks() {
        if (typeof confetti !== 'function') return;

        let end = Date.now() + 8 * 1000;
        let colors = ['#ff2d75', '#ffd700', '#ffffff', '#ff6ea7', '#ff99bb'];

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end && currentState === STATE.HAPPY_ENDING) {
                requestAnimationFrame(frame);
            }
        }());
    }

    function createFireflySwarm(count) {
        const geo = new THREE.SphereGeometry(0.5, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffd269,
            transparent: true,
            opacity: 0.95
        });

        for (let i = 0; i < count; i++) {
            const firefly = new THREE.Mesh(geo, mat);
            firefly.position.set(
                (Math.random() - 0.5) * 220,
                Math.random() * 90 - 20,
                (Math.random() - 0.5) * 220
            );

            firefly.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03,
                radius: 20 + Math.random() * 40
            };

            scene.add(firefly);
            fireflies.push(firefly);
        }
    }

    // ------------------------------------------------------------------------
    // UI Event Handlers
    // ------------------------------------------------------------------------
    function setupUIEvents() {
        if (startBtn) startBtn.addEventListener('click', startOpeningSequence);
        if (chanceBtn) chanceBtn.addEventListener('click', onChanceClick);
        if (memoryNextBtn) memoryNextBtn.addEventListener('click', transitionToFinalSurprise);
        if (finalQuestionBtn) finalQuestionBtn.addEventListener('click', onFinalQuestionClick);
        if (yesBtn) yesBtn.addEventListener('click', onYesClick);
        if (obviouslyBtn) obviouslyBtn.addEventListener('click', onObviouslyClick);

        // Apology Section Choice Buttons
        if (listenBtn) {
            listenBtn.addEventListener('click', () => {
                if (window.romanticAudio) window.romanticAudio.playClickSound();
                apologyResponse.textContent = "Main poori tarah tumhari baat sunne ko tayyar hoon Ankita. Chahe kitna bhi gussa ho ya shikayat—tum bina kisi jhijhak ke sab keh sakti ho. Main sununga, samjhunga, aur sudhrunga. ❤️";
                apologyResponse.classList.add('show');
                if (apologySection) {
                    setTimeout(() => apologySection.scrollTo({ top: apologySection.scrollHeight, behavior: 'smooth' }), 50);
                }
            });
        }

        if (sorryBtn) {
            sorryBtn.addEventListener('click', () => {
                if (window.romanticAudio) window.romanticAudio.playClickSound();
                apologyResponse.textContent = "Dil ki gehraiyon se sorry Ankita. Sirf shabdon se nahi, balki har roz apne actions se prove karunga ki tum mere liye kitni special aur anmol ho. 🙏❤️";
                apologyResponse.classList.add('show');
                if (apologySection) {
                    setTimeout(() => apologySection.scrollTo({ top: apologySection.scrollHeight, behavior: 'smooth' }), 50);
                }
            });
        }

        if (readyBtn) {
            readyBtn.addEventListener('click', () => {
                if (window.romanticAudio) window.romanticAudio.playClickSound();
                apologyResponse.textContent = "Chahe kitna bhi waqt lage, main tumhare saath sab theek karne ke liye committed hoon. Tumhari smile aur khushi meri sabse badi priority hai. 🚶‍♂️❤️";
                apologyResponse.classList.add('show');
                if (apologySection) {
                    setTimeout(() => apologySection.scrollTo({ top: apologySection.scrollHeight, behavior: 'smooth' }), 50);
                }
            });
        }

        // Apology Next Button
        if (apologyNextBtn) {
            apologyNextBtn.addEventListener('click', () => {
                if (window.romanticAudio) window.romanticAudio.playClickSound();
                transitionToMemorySection();
            });
        }

        // Sound Toggle
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                if (window.romanticAudio) {
                    const isMuted = window.romanticAudio.toggleMute();
                    if (isMuted) {
                        soundBtn.classList.add('muted');
                        soundText.textContent = 'Music: OFF';
                    } else {
                        soundBtn.classList.remove('muted');
                        soundText.textContent = 'Music: ON';
                    }
                }
            });
        }

        // Replay Button
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                location.reload();
            });
        }

        // Share / Copy WhatsApp Love Note
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const message = "Maine Ankita ke liye ek poora romantic 3D universe banaya... And she officially forgave me! 😌❤️✨";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(message).then(() => {
                        shareBtn.textContent = "Copied! 💌 Send to Him";
                        setTimeout(() => { shareBtn.textContent = "Send a Smile to Me 💌"; }, 3000);
                    }).catch(() => {
                        promptFallbackCopy(message);
                    });
                } else {
                    promptFallbackCopy(message);
                }
            });
        }
    }

    function promptFallbackCopy(message) {
        try {
            window.prompt("Copy this romantic note to share:", message);
            shareBtn.textContent = "Copied! 💌 Send to Him";
            setTimeout(() => { shareBtn.textContent = "Send a Smile to Me 💌"; }, 3000);
        } catch (e) {
            alert(message);
        }
    }

    // ------------------------------------------------------------------------
    // Visibility & Interaction Events
    // ------------------------------------------------------------------------
    function onVisibilityChange() {
        if (document.hidden) {
            if (window.romanticAudio && window.romanticAudio.masterGain && window.romanticAudio.ctx) {
                try {
                    window.romanticAudio.masterGain.gain.setValueAtTime(0, window.romanticAudio.ctx.currentTime);
                } catch (e) {}
            }
        } else {
            if (window.romanticAudio && window.romanticAudio.masterGain && window.romanticAudio.ctx && !window.romanticAudio.isMuted) {
                try {
                    window.romanticAudio.masterGain.gain.setValueAtTime(0.7, window.romanticAudio.ctx.currentTime);
                } catch (e) {}
            }
        }
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseMove(event) {
        mouse.targetX = (event.clientX - windowHalfX);
        mouse.targetY = (event.clientY - windowHalfY);
    }

    function onTouchMove(event) {
        if (event.touches.length > 0) {
            mouse.targetX = (event.touches[0].clientX - windowHalfX);
            mouse.targetY = (event.touches[0].clientY - windowHalfY);
        }
    }

    // ------------------------------------------------------------------------
    // Main Animation Loop
    // ------------------------------------------------------------------------
    function animate() {
        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1);
        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse lerp
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Camera orbit & mouse parallax
        if (isCameraOrbiting && !prefersReducedMotion) {
            orbitAngle += 0.0035;
            const orbitRadius = (currentState === STATE.HEART_WORLD) ? 120 : (currentState === STATE.MEMORY_SECTION ? 150 : 135);
            camera.position.x = Math.sin(orbitAngle) * (orbitRadius * 0.25) + (mouse.x * 0.035);
            camera.position.y = 15 - (mouse.y * 0.035);
            camera.lookAt(0, 8, 0);
        }

        // Apply 3D card tilt
        applyCardParallax();

        // Rotate central heart slowly
        if (mainHeartGroup && mainHeartGroup.visible) {
            mainHeartGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2;
            mainHeartGroup.rotation.x = Math.cos(elapsedTime * 0.4) * 0.08;
        }

        // Floating mini hearts
        floatingMiniHearts.forEach(heart => {
            const ud = heart.userData;
            ud.angle += ud.orbitSpeed * delta;
            ud.radius += ud.driftSpeed * ud.driftDirection * delta;
            ud.radius = Math.max(30, Math.min(150, ud.radius));

            heart.position.x = Math.cos(ud.angle) * ud.radius;
            heart.position.z = Math.sin(ud.angle) * ud.radius;
            heart.position.y = ud.baseY + Math.sin(elapsedTime * ud.floatSpeed) * ud.floatAmp;

            heart.rotation.x += ud.rotSpeedX;
            heart.rotation.y += ud.rotSpeedY;

            const pulse = Math.sin(elapsedTime * ud.pulseSpeed) * ud.pulseAmount + 1;
            heart.scale.set(ud.baseScale * pulse, ud.baseScale * pulse, ud.baseScale * pulse);
        });

        // Animated butterflies
        butterflies.forEach(b => {
            const ud = b.userData;
            ud.angle += ud.speed * delta;
            b.position.x = Math.cos(ud.angle) * ud.radius;
            b.position.z = Math.sin(ud.angle) * ud.radius;
            b.position.y = ud.baseY + Math.sin(elapsedTime * ud.wobbleSpeed + ud.phase) * ud.heightWobble;

            b.position.x += Math.sin(elapsedTime * ud.wobbleSpeed * 1.3 + ud.phase * 0.7) * ud.lateralWobble;
            b.position.z += Math.cos(elapsedTime * ud.wobbleSpeed * 1.1 + ud.phase * 0.9) * ud.lateralWobble;

            b.rotation.y = -ud.angle - Math.PI / 2;

            ud.targetTilt = Math.sin(ud.angle) * 0.3;
            ud.bodyTilt += (ud.targetTilt - ud.bodyTilt) * ud.tiltSpeed * delta * 10;
            b.rotation.z = ud.bodyTilt;

            const wingCycle = elapsedTime * ud.wingSpeed + ud.phase;
            const flap = Math.sin(wingCycle) * 0.6 + Math.sin(wingCycle * 0.5) * 0.2;
            ud.leftWing.rotation.y = flap;
            ud.rightWing.rotation.y = -flap;
        });

        // Falling rose petals
        fallingPetals.forEach(petal => {
            const ud = petal.userData;
            petal.position.y -= ud.fallSpeed;
            petal.position.x += ud.windOffsetX + Math.sin(elapsedTime * ud.windSpeed) * 0.1;
            petal.position.z += ud.windOffsetZ + Math.cos(elapsedTime * ud.windSpeed) * 0.1;

            petal.rotation.x += ud.rotSpeedX + Math.sin(elapsedTime * ud.tumbleSpeed) * ud.tumbleAxisX * 0.15;
            petal.rotation.y += ud.rotSpeedY + Math.sin(elapsedTime * ud.tumbleSpeed * 0.7) * ud.tumbleAxisY * 0.15;
            petal.rotation.z += ud.rotSpeedZ + Math.sin(elapsedTime * ud.tumbleSpeed * 1.3) * ud.tumbleAxisZ * 0.15;

            petal.position.x += Math.sin(elapsedTime * ud.wobbleFreq) * ud.wobbleAmp * 0.1;
            petal.position.z += Math.cos(elapsedTime * ud.wobbleFreq) * ud.wobbleAmp * 0.1;

            if (petal.position.y < -50) {
                petal.position.y = 100 + Math.random() * 40;
                petal.position.x = (Math.random() - 0.5) * 300;
                petal.position.z = (Math.random() - 0.5) * 300;
                petal.rotation.y = ud.initialRotation + (Math.random() - 0.5) * 0.5;
            }
        });

        // Fireflies in Happy Ending
        fireflies.forEach(f => {
            const ud = f.userData;
            f.position.x += Math.sin(elapsedTime * 1.5 + ud.phase) * 0.3;
            f.position.y += Math.cos(elapsedTime * 1.2 + ud.phase) * 0.2;
            f.position.z += Math.sin(elapsedTime * 0.8 + ud.phase) * 0.2;
        });

        // Render Scene
        renderer.render(scene, camera);
    }

    // ------------------------------------------------------------------------
    // Start Application
    // ------------------------------------------------------------------------
    window.addEventListener('DOMContentLoaded', init);

})();
