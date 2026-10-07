// ============================================================================
// Ankita's Apology — Interactive 3D Romantic Universe
// Handcrafted with Three.js, GSAP & Web Audio API
// ============================================================================

(function() {
    'use strict';

    // Application State
    const STATE = {
        ENTRANCE: 0,
        OPENING_PARTICLES: 1,
        HEART_WORLD: 2,
        MEMORY_SECTION: 3,
        FINAL_SURPRISE: 4,
        HAPPY_ENDING: 5
    };
    let currentState = STATE.ENTRANCE;

    // Three.js Core
    let scene, camera, renderer;
    let clock = new THREE.Clock();
    let container = document.getElementById('canvas-container');

    // Scene Objects
    let mainHeartGroup, mainHeartMesh, innerGlowMesh;
    let openingParticleSystem, giantParticleSystem;
    let floatingMiniHearts = [];
    let butterflies = [];
    let fallingPetals = [];
    let goldenEmbers = [];
    let explosionHearts = [];
    let fireflies = [];
    let reflectiveFloor;
    let centralSpotlight, ambientLight, goldPointLight, pinkPointLight;

    // Interaction & Animation
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let orbitAngle = 0;
    let isCameraOrbiting = false;
    let heartBounceTween = null;
    let heartbeatTween = null;
    let chanceBtnTimer = null;

    // UI Elements
    const entranceScreen = document.getElementById('entranceScreen');
    const startBtn = document.getElementById('startBtn');
    const soundBtn = document.getElementById('soundBtn');
    const soundText = document.getElementById('soundText');
    const typewriterBox = document.getElementById('typewriterBox');
    const typewriterText = document.getElementById('typewriterText');
    const chanceBtn = document.getElementById('chanceBtn');
    const thankyouBox = document.getElementById('thankyouBox');
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
    // Initialization
    // ------------------------------------------------------------------------
    function init() {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050106);
        scene.fog = new THREE.FogExp2(0x0a0108, 0.0018);

        // Camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 0, 240);

        // WebGL Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);

        // Lighting
        setupLighting();

        // Reflective ground plane
        createReflectiveFloor();

        // 3D Heart Geometry & Central Actor
        createMainHeart();

        // Environment elements (stars & embers)
        createAmbientStardust();

        // Event listeners
        window.addEventListener('resize', onWindowResize, { passive: true });
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        setupUIEvents();

        // Start render loop
        animate();
    }

    // ------------------------------------------------------------------------
    // Lighting Setup
    // ------------------------------------------------------------------------
    function setupLighting() {
        ambientLight = new THREE.AmbientLight(0xffe4e6, 0.55);
        scene.add(ambientLight);

        // Glowing center light
        pinkPointLight = new THREE.PointLight(0xff2d75, 3.0, 450);
        pinkPointLight.position.set(0, 5, 20);
        scene.add(pinkPointLight);

        // Gold rim highlight
        goldPointLight = new THREE.PointLight(0xffd700, 1.8, 500);
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
        const floorGeo = new THREE.CircleGeometry(320, 64);
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
        const ringGeo = new THREE.RingGeometry(30, 280, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff2d75,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending
        });
        const floorRing = new THREE.Mesh(ringGeo, ringMat);
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
        gradient.addColorStop(0.3, 'rgba(255, 110, 167, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 45, 117, 0.3)');
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
        mainHeartGroup.position.set(0, 5, 0);

        const heartShape = createHeartShape();
        const extrudeSettings = {
            steps: 4,
            depth: 4.0,
            bevelEnabled: true,
            bevelThickness: 2.2,
            bevelSize: 1.6,
            bevelOffset: 0,
            bevelSegments: 8
        };

        const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        geometry.center();

        // Realistic Ruby Gloss Material with Clearcoat
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xd80032,
            emissive: 0x990026,
            emissiveIntensity: 0.7,
            roughness: 0.12,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            reflectivity: 0.95
        });

        mainHeartMesh = new THREE.Mesh(geometry, material);
        mainHeartMesh.scale.set(4.2, 4.2, 4.2);
        mainHeartGroup.add(mainHeartMesh);

        // Inner glowing core
        const innerGeo = geometry.clone();
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xff4081,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        });
        innerGlowMesh = new THREE.Mesh(innerGeo, innerMat);
        innerGlowMesh.scale.set(3.9, 3.9, 3.9);
        mainHeartGroup.add(innerGlowMesh);

        // Pulsing light right inside the heart
        const innerPoint = new THREE.PointLight(0xff2d75, 2.5, 120);
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

        // Realistic lub-dub rhythm
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
        .to(mainHeartGroup.scale, {
            x: 0.98, y: 0.98, z: 0.98,
            duration: 0.12,
            ease: "power1.inOut"
        })
        .to(mainHeartGroup.scale, {
            x: 1.10, y: 1.10, z: 1.10,
            duration: 0.12,
            ease: "power2.out"
        })
        .to(mainHeartGroup.scale, {
            x: 1.0, y: 1.0, z: 1.0,
            duration: 0.28,
            ease: "sine.out"
        });

        heartbeatTween = tl;
    }

    // ------------------------------------------------------------------------
    // Ambient Stardust & Sparkles
    // ------------------------------------------------------------------------
    function createAmbientStardust() {
        const count = 450;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const palette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xff6ea7),
            new THREE.Color(0xffd269),
            new THREE.Color(0xff2d75)
        ];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 600;
            positions[i * 3 + 1] = Math.random() * 300 - 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 600;

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2.5,
            map: createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const stardust = new THREE.Points(geometry, material);
        scene.add(stardust);
        goldenEmbers.push({ system: stardust, count, speed: 0.08 });
    }

    // ------------------------------------------------------------------------
    // Scene 1: Opening Starfield & Particle Heart Assembly
    // ------------------------------------------------------------------------
    function startOpeningSequence() {
        currentState = STATE.OPENING_PARTICLES;

        // Hide entrance screen immediately
        entranceScreen.style.opacity = '0';
        entranceScreen.style.pointerEvents = 'none';
        entranceScreen.style.display = 'none';
        entranceScreen.style.visibility = 'hidden';

        // Start BGM safely
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
        const count = 750;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const targetPositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorCore = new THREE.Color(0xff2d75);
        const colorRim = new THREE.Color(0xff6ea7);

        for (let i = 0; i < count; i++) {
            // Scattered widely across space
            positions[i * 3] = (Math.random() - 0.5) * 500;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 500;

            // Parametric heart formula
            const t = Math.PI * 2 * (i / count);
            const scale = 2.4;
            const rx = 16 * Math.pow(Math.sin(t), 3) * scale;
            const ry = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
            const rz = (Math.random() - 0.5) * 20;

            targetPositions[i * 3] = rx;
            targetPositions[i * 3 + 1] = ry + 15;
            targetPositions[i * 3 + 2] = rz;

            const c = Math.random() > 0.4 ? colorCore : colorRim;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 3.5,
            map: createGlowTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        openingParticleSystem = new THREE.Points(geometry, material);
        scene.add(openingParticleSystem);

        // Smooth particle flocking into heart shape
        const animObj = { progress: 0, opacity: 0 };
        gsap.to(animObj, {
            opacity: 0.95,
            duration: 2.0,
            ease: "power2.inOut",
            onUpdate: () => {
                openingParticleSystem.material.opacity = animObj.opacity;
            }
        });

        gsap.to(animObj, {
            progress: 1,
            duration: 4.8,
            delay: 0.6,
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

        // Glide camera forward
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
            { text: "Ankita... ❤️", hold: 2000 },
            { text: "Thodi si galti ho gayi mujhse...", hold: 2200 },
            { text: "Par tumse zyada important mere liye kuch nahi. 🥺", hold: 2600 }
        ];

        let index = 0;

        function showNextLine() {
            if (index >= dialogue.length) {
                // Done typewriter sequence -> transition to 3D Heart World
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
                setTimeout(() => {
                    if (index === 1 && window.romanticAudio) {
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
                setTimeout(tick, 55 + Math.random() * 25);
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

        // Ensure typewriter is cleanly removed
        typewriterBox.style.display = 'none';
        typewriterText.innerHTML = '';

        // Fade out opening particle heart
        if (openingParticleSystem) {
            gsap.to(openingParticleSystem.material, {
                opacity: 0,
                duration: 1.2,
                onComplete: () => {
                    scene.remove(openingParticleSystem);
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
        createFloatingMiniHearts(75);
        createAnimatedButterflies(18);
        createFallingRosePetals(60);

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

        const colors = [0xff2d75, 0xff6ea7, 0xffd269, 0xd80032, 0xff99bb];

        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: colors[i % colors.length],
                roughness: 0.25,
                metalness: 0.2,
                emissive: colors[i % colors.length],
                emissiveIntensity: 0.4
            });

            const mesh = new THREE.Mesh(geo, mat);
            const scale = 0.4 + Math.random() * 0.6;
            mesh.scale.set(scale, scale, scale);

            const radius = 45 + Math.random() * 110;
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 90 + 10;

            mesh.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );

            mesh.userData = {
                angle: angle,
                radius: radius,
                baseY: height,
                orbitSpeed: (0.15 + Math.random() * 0.25) * (Math.random() > 0.5 ? 1 : -1),
                floatSpeed: 0.8 + Math.random() * 1.5,
                floatAmp: 4 + Math.random() * 8,
                rotSpeedX: (Math.random() - 0.5) * 0.02,
                rotSpeedY: (Math.random() - 0.5) * 0.02
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
            wingShape.quadraticCurveTo(2.5, 3.5, 4.0, 3.0);
            wingShape.quadraticCurveTo(4.5, 1.0, 2.5, 0);
            wingShape.quadraticCurveTo(3.5, -2.5, 1.5, -2.5);
            wingShape.quadraticCurveTo(0.5, -1.0, 0, 0);

            const wingGeo = new THREE.ShapeGeometry(wingShape);
            const wingMat = new THREE.MeshStandardMaterial({
                color: 0xff6ea7,
                emissive: 0xff2d75,
                emissiveIntensity: 0.6,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.88,
                roughness: 0.3
            });

            const leftWing = new THREE.Mesh(wingGeo, wingMat);
            const rightWing = new THREE.Mesh(wingGeo, wingMat);
            rightWing.scale.x = -1;

            bGroup.add(leftWing);
            bGroup.add(rightWing);

            const light = new THREE.PointLight(0xff6ea7, 0.4, 15);
            bGroup.add(light);

            const orbitRadius = 35 + Math.random() * 85;
            const initAngle = Math.random() * Math.PI * 2;
            bGroup.position.set(
                Math.cos(initAngle) * orbitRadius,
                (Math.random() - 0.5) * 60 + 15,
                Math.sin(initAngle) * orbitRadius
            );

            bGroup.scale.set(0.6, 0.6, 0.6);

            bGroup.userData = {
                leftWing: leftWing,
                rightWing: rightWing,
                angle: initAngle,
                radius: orbitRadius,
                speed: 0.3 + Math.random() * 0.4,
                wingSpeed: 16 + Math.random() * 8,
                phase: Math.random() * Math.PI,
                heightWobble: 0.5 + Math.random() * 1.5
            };

            scene.add(bGroup);
            butterflies.push(bGroup);
        }
    }

    // ------------------------------------------------------------------------
    // Falling 3D Rose Petals
    // ------------------------------------------------------------------------
    function createFallingRosePetals(count) {
        const petalGeo = new THREE.PlaneGeometry(3.0, 3.6, 4, 4);
        const pos = petalGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            pos.setZ(i, (vx * vx + vy * vy) * -0.06);
        }
        petalGeo.computeVertexNormals();

        const petalMat = new THREE.MeshStandardMaterial({
            color: 0xba0c35,
            emissive: 0x5e0019,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide,
            roughness: 0.4
        });

        for (let i = 0; i < count; i++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            petal.position.set(
                (Math.random() - 0.5) * 280,
                Math.random() * 140 - 20,
                (Math.random() - 0.5) * 280
            );

            const scale = 0.6 + Math.random() * 0.7;
            petal.scale.set(scale, scale, scale);

            petal.userData = {
                fallSpeed: 0.25 + Math.random() * 0.35,
                rotSpeedX: (Math.random() - 0.5) * 0.03,
                rotSpeedY: (Math.random() - 0.5) * 0.03,
                rotSpeedZ: (Math.random() - 0.5) * 0.02,
                wobbleAmp: 0.6 + Math.random() * 0.8,
                wobbleFreq: 1.5 + Math.random() * 1.5
            };

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

        // Immediately hide Chance Button and clear timers
        clearTimeout(chanceBtnTimer);
        chanceBtn.style.display = 'none';
        typewriterBox.style.display = 'none';
        typewriterText.innerHTML = '';

        // Trigger Spectacular 3D Heart Burst Explosion
        triggerHeartBurstExplosion();

        // Screen Confetti Storm
        triggerCanvasConfettiShower();

        // Main Heart Rapid Pulse & Glow Flash
        gsap.timeline()
            .to(mainHeartGroup.scale, { x: 1.55, y: 1.55, z: 1.55, duration: 0.15, ease: "power2.out" })
            .to(mainHeartGroup.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 0.12 })
            .to(mainHeartGroup.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 0.14 })
            .to(mainHeartGroup.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.35, ease: "elastic.out(1, 0.4)" });

        // Camera dramatic zoom-in
        gsap.to(camera.position, {
            z: 85,
            duration: 1.4,
            ease: "power2.out"
        });

        // Show "Thank you ❤️"
        setTimeout(() => {
            thankyouBox.style.display = 'block';
            if (window.romanticAudio) {
                window.romanticAudio.playSparkleChime();
            }
            gsap.fromTo(thankyouBox,
                { opacity: 0, scale: 0.6, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.8)" }
            );

            // After delay, transition to Memory Section
            setTimeout(() => {
                gsap.to(thankyouBox, {
                    opacity: 0,
                    scale: 0.8,
                    duration: 0.5,
                    onComplete: () => {
                        thankyouBox.style.display = 'none';
                        transitionToMemorySection();
                    }
                });
            }, 2000);

        }, 600);
    }

    function triggerHeartBurstExplosion() {
        const count = 90;
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
            const pHeart = new THREE.Mesh(geo, mat);
            pHeart.position.copy(mainHeartGroup.position);
            pHeart.scale.set(0.35, 0.35, 0.35);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 60 + Math.random() * 80;

            const vx = Math.sin(phi) * Math.cos(theta) * speed;
            const vy = Math.sin(phi) * Math.sin(theta) * speed;
            const vz = Math.cos(phi) * speed;

            scene.add(pHeart);

            gsap.to(pHeart.position, {
                x: mainHeartGroup.position.x + vx,
                y: mainHeartGroup.position.y + vy,
                z: mainHeartGroup.position.z + vz,
                duration: 1.5,
                ease: "power2.out"
            });

            gsap.to(pHeart.material, {
                opacity: 0,
                duration: 1.5,
                ease: "power2.in",
                onComplete: () => {
                    scene.remove(pHeart);
                }
            });
        }
    }

    function triggerCanvasConfettiShower() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 120,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#ff2d75', '#ffd700', '#ffffff', '#ff6ea7']
            });
        }
    }

    // ------------------------------------------------------------------------
    // Scene 4: Memory Section (Floating 3D Glass Cards)
    // ------------------------------------------------------------------------
    function transitionToMemorySection() {
        currentState = STATE.MEMORY_SECTION;

        // Ensure chance button & thank you are definitely gone
        chanceBtn.style.display = 'none';
        thankyouBox.style.display = 'none';

        // Smoothly pull camera back to frame the cards
        gsap.to(camera.position, {
            x: 0, y: 10, z: 150,
            duration: 1.5,
            ease: "power2.out"
        });

        // Dim central 3D heart slightly to give focus to cards
        gsap.to(mainHeartGroup.scale, {
            x: 0.75, y: 0.75, z: 0.75,
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
        if (currentState !== STATE.MEMORY_SECTION) return;
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
    // Scene 5: Final Surprise (Giant Glowing Particle Heart & Last Question)
    // ------------------------------------------------------------------------
    function transitionToFinalSurprise() {
        currentState = STATE.FINAL_SURPRISE;

        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }

        // Hide memory section and chance button
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
        const count = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorGold = new THREE.Color(0xffd269);
        const colorPink = new THREE.Color(0xff2d75);

        for (let i = 0; i < count; i++) {
            const t = Math.PI * 2 * (i / count);
            const scale = 3.6;
            const rx = 16 * Math.pow(Math.sin(t), 3) * scale;
            const ry = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
            const rz = (Math.random() - 0.5) * 35;

            positions[i * 3] = rx * 0.1;
            positions[i * 3 + 1] = (ry + 10) * 0.1;
            positions[i * 3 + 2] = rz * 0.1;

            const c = (i % 3 === 0) ? colorGold : colorPink;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 4.2,
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
            op: 0.95, duration: 1.5,
            onUpdate: () => { giantParticleSystem.material.opacity = anim.op; }
        });

        gsap.to(anim, {
            p: 1.0, duration: 2.8, ease: "elastic.out(1, 0.6)",
            onUpdate: () => {
                const posAttr = giantParticleSystem.geometry.attributes.position;
                for (let i = 0; i < count; i++) {
                    const t = Math.PI * 2 * (i / count);
                    const scale = 3.6;
                    const rx = 16 * Math.pow(Math.sin(t), 3) * scale;
                    const ry = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
                    const rz = (Math.random() - 0.5) * 35;

                    posAttr.setXYZ(i, rx * anim.p, (ry + 8) * anim.p, rz * anim.p);
                }
                posAttr.needsUpdate = true;
            }
        });
    }

    // ------------------------------------------------------------------------
    // Last Question & Modal
    // ------------------------------------------------------------------------
    function onFinalQuestionClick() {
        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }

        // Immediately hide final surprise box and ensure chanceBtn is hidden
        clearTimeout(chanceBtnTimer);
        chanceBtn.style.display = 'none';
        finalSurpriseBox.style.display = 'none';

        // Camera dramatically zooms into center of heart
        gsap.to(camera.position, {
            z: 60,
            duration: 1.5,
            ease: "power2.inOut"
        });

        // Show Question Modal "Maaf kiya? ❤️"
        setTimeout(() => {
            questionModal.style.display = 'flex';
            gsap.fromTo(questionModal,
                { opacity: 0, scale: 0.7, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.8)" }
            );
        }, 800);
    }

    // Playful reaction for "Obviously 😤❤️"
    function onObviouslyClick() {
        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }

        // Playful shake
        gsap.timeline()
            .to(obviouslyBtn, { x: -12, rotation: -6, duration: 0.08 })
            .to(obviouslyBtn, { x: 12, rotation: 6, duration: 0.08 })
            .to(obviouslyBtn, { x: -8, rotation: -3, duration: 0.08 })
            .to(obviouslyBtn, { x: 0, rotation: 0, duration: 0.08 });

        // Show funny cheeky toast
        playfulToast.style.display = 'block';
        gsap.fromTo(playfulToast,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4 }
        );

        setTimeout(() => {
            triggerHappyEnding();
        }, 500);
    }

    function onYesClick() {
        if (window.romanticAudio) {
            window.romanticAudio.playClickSound();
        }
        triggerHappyEnding();
    }

    // ------------------------------------------------------------------------
    // Scene 6: Happy Ending (The Grand Climax)
    // ------------------------------------------------------------------------
    function triggerHappyEnding() {
        currentState = STATE.HAPPY_ENDING;

        // Cleanly hide all prior UI elements
        clearTimeout(chanceBtnTimer);
        chanceBtn.style.display = 'none';
        questionModal.style.display = 'none';
        finalSurpriseBox.style.display = 'none';
        typewriterBox.style.display = 'none';
        typewriterText.innerHTML = '';
        memorySection.style.display = 'none';
        thankyouBox.style.display = 'none';

        // Audio celebration fanfare
        if (window.romanticAudio) {
            window.romanticAudio.playCelebrationFanfare();
        }

        // Camera pulls back in a majestic grand sweep
        gsap.to(camera.position, {
            x: 0,
            y: 18,
            z: 160,
            duration: 2.2,
            ease: "power2.out"
        });

        // Bring back the central 3D heart with joyful bounce!
        mainHeartGroup.visible = true;
        gsap.fromTo(mainHeartGroup.scale,
            { x: 0.01, y: 0.01, z: 0.01 },
            { x: 1.15, y: 1.15, z: 1.15, duration: 1.4, ease: "elastic.out(1, 0.4)" }
        );

        // Continuous playful bounce for 3D heart
        heartBounceTween = gsap.to(mainHeartGroup.position, {
            y: 18,
            duration: 0.65,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });

        // Continuous shower of fireworks confetti
        runContinuousFireworks();

        // Spawn fireflies
        createFireflySwarm(45);

        // Add additional heavy rain of rose petals
        createFallingRosePetals(80);

        // Show Happy Ending UI box
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
        startBtn.addEventListener('click', startOpeningSequence);
        chanceBtn.addEventListener('click', onChanceClick);
        memoryNextBtn.addEventListener('click', transitionToFinalSurprise);
        finalQuestionBtn.addEventListener('click', onFinalQuestionClick);
        yesBtn.addEventListener('click', onYesClick);
        obviouslyBtn.addEventListener('click', onObviouslyClick);

        // Sound Toggle
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

        // Replay Button
        replayBtn.addEventListener('click', () => {
            location.reload();
        });

        // Share / Copy WhatsApp Love Note
        shareBtn.addEventListener('click', () => {
            const message = "Maine Ankita ke liye ek poora romantic 3D universe banaya... And she officially forgave me! 😌❤️✨";
            if (navigator.clipboard) {
                navigator.clipboard.writeText(message).then(() => {
                    shareBtn.textContent = "Copied! 💌 Send to Him";
                    setTimeout(() => { shareBtn.textContent = "Send a Smile to Me 💌"; }, 3000);
                });
            } else {
                alert(message);
            }
        });
    }

    // ------------------------------------------------------------------------
    // Interaction & Window Events
    // ------------------------------------------------------------------------
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

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse lerp
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Camera gentle orbit & mouse parallax
        if (isCameraOrbiting) {
            orbitAngle += 0.0035;
            const orbitRadius = (currentState === STATE.HEART_WORLD) ? 120 : (currentState === STATE.MEMORY_SECTION ? 150 : 135);
            camera.position.x = Math.sin(orbitAngle) * (orbitRadius * 0.25) + (mouse.x * 0.04);
            camera.position.y = 15 - (mouse.y * 0.04);
            camera.lookAt(0, 8, 0);
        }

        // Apply 3D card tilt
        applyCardParallax();

        // Rotate central heart slowly
        if (mainHeartGroup && mainHeartGroup.visible) {
            mainHeartGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2;
            mainHeartGroup.rotation.x = Math.cos(elapsedTime * 0.4) * 0.08;
        }

        // Floating mini hearts orbit & wave
        floatingMiniHearts.forEach(heart => {
            const ud = heart.userData;
            ud.angle += ud.orbitSpeed * delta;
            heart.position.x = Math.cos(ud.angle) * ud.radius;
            heart.position.z = Math.sin(ud.angle) * ud.radius;
            heart.position.y = ud.baseY + Math.sin(elapsedTime * ud.floatSpeed) * ud.floatAmp;

            heart.rotation.x += ud.rotSpeedX;
            heart.rotation.y += ud.rotSpeedY;
        });

        // Animated butterflies flapping & orbiting
        butterflies.forEach(b => {
            const ud = b.userData;
            ud.angle += ud.speed * delta;
            b.position.x = Math.cos(ud.angle) * ud.radius;
            b.position.z = Math.sin(ud.angle) * ud.radius;
            b.position.y += Math.sin(elapsedTime * 3 + ud.phase) * 0.08;

            // Align butterfly facing direction
            b.rotation.y = -ud.angle - Math.PI / 2;

            // Wing flap
            const flap = Math.sin(elapsedTime * ud.wingSpeed) * 0.75;
            ud.leftWing.rotation.y = flap;
            ud.rightWing.rotation.y = -flap;
        });

        // Falling rose petals with tumbling aerodynamics
        fallingPetals.forEach(petal => {
            const ud = petal.userData;
            petal.position.y -= ud.fallSpeed;
            petal.position.x += Math.sin(elapsedTime * ud.wobbleFreq) * 0.2;
            petal.position.z += Math.cos(elapsedTime * ud.wobbleFreq) * 0.15;

            petal.rotation.x += ud.rotSpeedX;
            petal.rotation.y += ud.rotSpeedY;
            petal.rotation.z += ud.rotSpeedZ;

            // Reset when hitting floor
            if (petal.position.y < -50) {
                petal.position.y = 120;
                petal.position.x = (Math.random() - 0.5) * 260;
                petal.position.z = (Math.random() - 0.5) * 260;
            }
        });

        // Golden embers gently floating upward
        goldenEmbers.forEach(item => {
            const posAttr = item.system.geometry.attributes.position;
            for (let i = 0; i < item.count; i++) {
                let y = posAttr.getY(i) + item.speed;
                if (y > 220) y = -50;
                posAttr.setY(i, y);
            }
            posAttr.needsUpdate = true;
            item.system.rotation.y += 0.0005;
        });

        // Fireflies dancing in Happy Ending
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