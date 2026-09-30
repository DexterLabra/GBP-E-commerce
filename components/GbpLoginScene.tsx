"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function GbpLoginScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 0, 8.5);
    scene.add(new THREE.HemisphereLight(0xf7e7c2, 0x17175b, 1.5));
    const goldLight = new THREE.PointLight(0xe1bd72, 24, 18);
    goldLight.position.set(-3.5, 3.2, 4);
    scene.add(goldLight);
    const softLight = new THREE.DirectionalLight(0xffffff, 1.1);
    softLight.position.set(3, 1.5, 4);
    scene.add(softLight);

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ringMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xc69842, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0xe3c47e, transparent: true, opacity: 0.27, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: 0x9d722e, transparent: true, opacity: 0.24, side: THREE.DoubleSide }),
    ];
    const rings = ringMaterials.map((material, index) => {
      const geometry = new THREE.TorusGeometry(2.35 + index * 0.32, index === 0 ? 0.012 : 0.008, 8, 160);
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.set(0.62 + index * 0.52, 0.2 + index * 0.46, index * 0.32);
      group.add(ring);
      return ring;
    });

    const beadMaterial = new THREE.MeshBasicMaterial({ color: 0xe4c477 });
    const beads: { mesh: THREE.Mesh; radius: number; phase: number; ring: number }[] = [];
    for (let index = 0; index < 15; index += 1) {
      const radius = 2.35 + (index % 3) * 0.32;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(index % 5 === 0 ? 0.035 : 0.02, 10, 8), beadMaterial);
      group.add(mesh);
      beads.push({ mesh, radius, phase: (index / 15) * Math.PI * 2, ring: index % 3 });
    }

    const decorGeometry: THREE.BufferGeometry[] = [];
    const decorMaterials: THREE.Material[] = [];
    const goldCeramic = new THREE.MeshPhysicalMaterial({ color: 0xc69842, metalness: 0.62, roughness: 0.24, clearcoat: 0.85, clearcoatRoughness: 0.18 });
    const navyCeramic = new THREE.MeshPhysicalMaterial({ color: 0x24247a, metalness: 0.32, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.2 });
    const glimmerMaterial = new THREE.MeshBasicMaterial({ color: 0xf5dda2, transparent: true, opacity: 0.72 });
    decorMaterials.push(goldCeramic, navyCeramic, glimmerMaterial);
    const vaseGroup = new THREE.Group();
    const vaseProfile = [
      new THREE.Vector2(0, 0), new THREE.Vector2(.18, 0), new THREE.Vector2(.24, .07),
      new THREE.Vector2(.32, .22), new THREE.Vector2(.37, .48), new THREE.Vector2(.34, .7),
      new THREE.Vector2(.24, .88), new THREE.Vector2(.17, .94), new THREE.Vector2(.17, 1.12),
      new THREE.Vector2(.23, 1.16), new THREE.Vector2(0, 1.16),
    ];
    const vaseBodyGeometry = new THREE.LatheGeometry(vaseProfile, 36);
    const vaseRimGeometry = new THREE.TorusGeometry(.2, .025, 8, 36);
    const vaseFootGeometry = new THREE.TorusGeometry(.2, .018, 8, 36);
    decorGeometry.push(vaseBodyGeometry, vaseRimGeometry, vaseFootGeometry);
    vaseGroup.add(new THREE.Mesh(vaseBodyGeometry, goldCeramic));
    const vaseRim = new THREE.Mesh(vaseRimGeometry, navyCeramic);
    vaseRim.position.y = 1.14;
    vaseGroup.add(vaseRim);
    const vaseFoot = new THREE.Mesh(vaseFootGeometry, navyCeramic);
    vaseFoot.position.y = .07;
    vaseGroup.add(vaseFoot);
    group.add(vaseGroup);

    const lampGroup = new THREE.Group();
    const lampBaseGeometry = new THREE.CylinderGeometry(.22, .28, .11, 28);
    const lampStemGeometry = new THREE.CylinderGeometry(.026, .045, .65, 16);
    const lampShadeGeometry = new THREE.ConeGeometry(.42, .43, 32, 1, true);
    const lampCollarGeometry = new THREE.TorusGeometry(.06, .018, 8, 24);
    const lampGlowGeometry = new THREE.SphereGeometry(.075, 16, 12);
    decorGeometry.push(lampBaseGeometry, lampStemGeometry, lampShadeGeometry, lampCollarGeometry, lampGlowGeometry);
    const lampBase = new THREE.Mesh(lampBaseGeometry, navyCeramic);
    lampBase.position.y = .055;
    lampGroup.add(lampBase);
    const lampStem = new THREE.Mesh(lampStemGeometry, goldCeramic);
    lampStem.position.y = .41;
    lampGroup.add(lampStem);
    const lampCollar = new THREE.Mesh(lampCollarGeometry, navyCeramic);
    lampCollar.position.y = .76;
    lampGroup.add(lampCollar);
    const lampShade = new THREE.Mesh(lampShadeGeometry, goldCeramic);
    lampShade.position.y = 1.02;
    lampGroup.add(lampShade);
    const lampGlow = new THREE.Mesh(lampGlowGeometry, glimmerMaterial);
    lampGlow.position.y = .83;
    lampGroup.add(lampGlow);
    group.add(lampGroup);

    const bookGroup = new THREE.Group();
    const bookBottomGeometry = new THREE.BoxGeometry(.62, .13, .43);
    const bookTopGeometry = new THREE.BoxGeometry(.53, .12, .4);
    const bookBandGeometry = new THREE.BoxGeometry(.63, .025, .44);
    decorGeometry.push(bookBottomGeometry, bookTopGeometry, bookBandGeometry);
    const bookBottom = new THREE.Mesh(bookBottomGeometry, navyCeramic);
    bookBottom.position.y = .07;
    bookGroup.add(bookBottom);
    const bookBand = new THREE.Mesh(bookBandGeometry, goldCeramic);
    bookBand.position.y = .15;
    bookGroup.add(bookBand);
    const bookTop = new THREE.Mesh(bookTopGeometry, goldCeramic);
    bookTop.position.set(.035, .28, 0);
    bookGroup.add(bookTop);
    group.add(bookGroup);

    const sculptureGroup = new THREE.Group();
    const sculptureBaseGeometry = new THREE.CylinderGeometry(.2, .26, .11, 24);
    const sculptureStemGeometry = new THREE.CylinderGeometry(.035, .055, .4, 16);
    const sculptureLoopGeometry = new THREE.TorusGeometry(.23, .027, 8, 48);
    decorGeometry.push(sculptureBaseGeometry, sculptureStemGeometry, sculptureLoopGeometry);
    const sculptureBase = new THREE.Mesh(sculptureBaseGeometry, navyCeramic);
    sculptureBase.position.y = .055;
    sculptureGroup.add(sculptureBase);
    const sculptureStem = new THREE.Mesh(sculptureStemGeometry, goldCeramic);
    sculptureStem.position.y = .29;
    sculptureGroup.add(sculptureStem);
    const sculptureLoop = new THREE.Mesh(sculptureLoopGeometry, goldCeramic);
    sculptureLoop.position.y = .58;
    sculptureLoop.rotation.x = Math.PI / 2;
    sculptureGroup.add(sculptureLoop);
    group.add(sculptureGroup);

    const decorItems = [
      { object: vaseGroup, desktop: [-3.8, -1.5, -.35, .82], mobile: [-1.45, 3.08, -.45, .34], phase: .1, amplitude: .17, speed: .62 },
      { object: lampGroup, desktop: [3.75, -1.55, -.5, .78], mobile: [1.45, -3.1, -.55, .34], phase: 1.8, amplitude: .14, speed: .54 },
      { object: bookGroup, desktop: [-4.15, 1.72, -.65, .8], mobile: [1.45, 3.12, -.65, .3], phase: 2.6, amplitude: .11, speed: .7 },
      { object: sculptureGroup, desktop: [4.18, 1.55, -.72, .78], mobile: [-1.45, -3.12, -.72, .32], phase: 4.1, amplitude: .14, speed: .58 },
    ];

    const particleCount = 96;
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.9 + Math.random() * 2.7;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 6.4;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 2.4;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xd3ad5d, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.42, depthWrite: false });
    scene.add(new THREE.Points(particleGeometry, particleMaterial));

    let width = 1;
    let height = 1;
    let animationFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      width = Math.max(host.clientWidth, 1);
      height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.position.z = width < 560 ? 10.5 : 8.5;
      camera.updateProjectionMatrix();
      const compact = width < 560;
      vaseGroup.position.set(compact ? -1.35 : -3.85, compact ? .1 : -.1, -.45);
      lampGroup.position.set(compact ? 1.35 : 3.85, compact ? -.12 : -.18, -.55);
      vaseGroup.scale.setScalar(compact ? .35 : .85);
      lampGroup.scale.setScalar(compact ? .36 : .82);
      renderer.setSize(width, height, false);
      decorItems.forEach((item) => {
        const [x, y, z, scale] = compact ? item.mobile : item.desktop;
        item.object.position.set(x, y, z);
        item.object.userData.floatBaseY = y;
        item.object.scale.setScalar(scale);
      });
      if (reducedMotion) renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.12;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.08;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const timer = new THREE.Timer();
    timer.connect(document);
    const render = () => {
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);
      timer.update();
      const elapsed = timer.getElapsed();
      group.rotation.y += ((reducedMotion ? 0 : pointerX) - group.rotation.y) * 0.018;
      group.rotation.x += ((reducedMotion ? 0 : pointerY) - group.rotation.x) * 0.018;
      if (!reducedMotion) {
        rings.forEach((ring, index) => { ring.rotation.z += (index % 2 ? -1 : 1) * 0.00055; });
        decorItems.forEach((item) => {
          item.object.position.y = item.object.userData.floatBaseY + Math.sin(elapsed * item.speed + item.phase) * item.amplitude;
          item.object.rotation.y = Math.sin(elapsed * item.speed + item.phase) * .12;
          item.object.rotation.z = Math.sin(elapsed * item.speed + item.phase) * .025;
        });
        glimmerMaterial.opacity = .48 + (Math.sin(elapsed * 2.1) + 1) * .17;
        beads.forEach(({ mesh, radius, phase, ring: ringIndex }) => {
          const angle = phase + elapsed * (ringIndex % 2 ? -0.17 : 0.14);
          mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.46, Math.sin(angle * 0.7) * 0.28);
        });
      }
      renderer.render(scene, camera);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();
      rings.forEach((ring) => ring.geometry.dispose());
      ringMaterials.forEach((material) => material.dispose());
      beads.forEach(({ mesh }) => mesh.geometry.dispose());
      beadMaterial.dispose();
      decorGeometry.forEach((geometry) => geometry.dispose());
      decorMaterials.forEach((material) => material.dispose());
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      timer.dispose();
    };
  }, []);

  return <div ref={hostRef} className="auth-scene" aria-hidden="true" />;
}