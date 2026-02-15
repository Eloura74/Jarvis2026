import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface RealSphereProps {
  isActive: boolean;
  isListening: boolean;
  audioLevel?: number; // 0.0 to 1.0 (approximatif)
  size?: number;
  baseColor?: string;
  activeColor?: string;
  listeningColor?: string;
}

// ============================================================================
// SHADER - HOLOGRAPHIC GLOW
// ============================================================================
const vertexShader = `
  uniform float time;
  uniform float amplitude;
  uniform float audioLevel;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  // Simplex Noise (simplified)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Noise pour la déformation
    float noiseFreq = 2.0;
    float noiseAmp = 0.5 * audioLevel; 
    vec3 noisePos = vec3(position.x * noiseFreq + time, position.y * noiseFreq + time, position.z * noiseFreq);
    float n = snoise(noisePos);
    vNoise = n;

    vec3 newPos = position + normal * (n * noiseAmp * amplitude);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float opacity;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
    vec3 glow = color * intensity;
    
    // Scanlines holographiques
    float scanline = sin(vPosition.y * 20.0 - time * 5.0) * 0.1;
    
    // Coeur brillant
    float core = 0.2 + (vNoise * 0.2); 

    gl_FragColor = vec4(glow + color * core + scanline, opacity * (intensity + 0.3));
  }
`;

export const RealSphere: React.FC<RealSphereProps> = ({
  isActive,
  isListening,
  audioLevel = 0,
  size = 500,
  baseColor = "#00e5ff", // Cyan Blue
  activeColor = "#00e5ff",
  listeningColor = "#ef4444", // Red
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number>(0);

  // Valeurs cibles pour l'interpolation fluide
  const targetAudioLevel = useRef(0);
  const currentAudioLevel = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. SETUP THREE.JS
    const w = size;
    const h = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "50%";
    renderer.domElement.style.left = "50%";
    renderer.domElement.style.transform = "translate(-50%, -50%)";
    mountRef.current.appendChild(renderer.domElement);

    // 2. MESH PRINCIPAL (Sphère Holographique)
    const geometry = new THREE.IcosahedronGeometry(1.5, 30); // High poly pour smooth wave
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(baseColor) },
        amplitude: { value: 1.0 },
        audioLevel: { value: 0.0 },
        opacity: { value: 0.8 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 3. PARTICULES PÉRIPHÉRIQUES (Orbitals)
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 6; // Nuage large
    }

    particlesGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3),
    );
    const particlesMat = new THREE.PointsMaterial({
      size: 0.02,
      color: baseColor,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    sphereRef.current = sphere;
    particlesRef.current = particles;

    // 4. ANIMATION LOOP
    const animate = (time: number) => {
      const t = time * 0.001; // Convert ms to s

      // Lissage de l'audio level
      currentAudioLevel.current +=
        (targetAudioLevel.current - currentAudioLevel.current) * 0.1;

      if (
        sphereRef.current &&
        (sphereRef.current.material as THREE.ShaderMaterial).uniforms
      ) {
        const uniforms = (sphereRef.current.material as THREE.ShaderMaterial)
          .uniforms;
        uniforms.time.value = t;

        // Intensité de la déformation
        const baseAmp = isListening ? 0.2 : isActive ? 0.5 : 0.05; // Idle très calme
        uniforms.audioLevel.value = baseAmp + currentAudioLevel.current * 0.8;

        // NOTE: Lerp couleur manuel serait mieux mais complexe en hook non-frame
        // Ici on change direct via Props useEffect plus bas

        sphereRef.current.rotation.y = t * 0.2;
        sphereRef.current.rotation.z = t * 0.05;
      }

      if (particlesRef.current) {
        particlesRef.current.rotation.y = -t * 0.05;
        // Respiration des particules
        const scale = 1 + Math.sin(t * 0.5) * 0.1;
        particlesRef.current.scale.set(scale, scale, scale);
      }

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    // CLEANUP
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, [size]); // Re-init si taille change

  // 5. UPDATE DYNAMIC PROPS
  useEffect(() => {
    targetAudioLevel.current = audioLevel * 3; // Boost visuel

    if (sphereRef.current) {
      const mat = sphereRef.current.material as THREE.ShaderMaterial;
      const targetHex = isListening
        ? listeningColor
        : isActive
          ? activeColor
          : baseColor;
      mat.uniforms.color.value.set(targetHex);

      // Particules couleur
      if (particlesRef.current) {
        (particlesRef.current.material as THREE.PointsMaterial).color.set(
          targetHex,
        );
      }
    }
  }, [
    audioLevel,
    isListening,
    isActive,
    baseColor,
    activeColor,
    listeningColor,
  ]);

  return (
    <div
      ref={mountRef}
      className="flex items-center justify-center pointer-events-none"
    />
  );
};
