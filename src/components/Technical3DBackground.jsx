import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Technical3DBackground = ({ theme }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // References to dynamically update values on theme toggle without context recreation
  const sceneRef = useRef(null);
  const fogRef = useRef(null);
  const ambientLightRef = useRef(null);
  const nodeMaterialRef = useRef(null);
  const lineMaterialRef = useRef(null);
  const packetMaterialRef = useRef(null);

  // Initial WebGL support check
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setWebGlSupported(false);
    }
  }, []);

  // Main WebGL canvas initialization
  useEffect(() => {
    if (!webGlSupported) return;

    let scene, camera, renderer, animationFrameId;
    let nodeGeometry, nodeMaterial, nodeTexture, nodePoints;
    let lineMaterial, lineSegments;
    let packetGeometry, packetMaterial, packetPoints;
    let handleResize, handleMouseMove, handleTouchMove, handleScroll, handleVisibilityChange;
    let cleanupFn;

    try {
      console.log("3D Background mounted & running");

      // 1. Setup Device Settings
      const isMobile = window.innerWidth <= 768;
      const nodeCount = isMobile ? 30 : 75;
      const maxConnectionDistance = 15;
      const packetCount = isMobile ? 10 : 25;

      // 2. Initialize Scene, Camera, and Renderer
      const width = window.innerWidth;
      const height = window.innerHeight;

      scene = new THREE.Scene();
      sceneRef.current = scene;

      const isLight = theme === 'light';
      const bgColor = isLight ? 0xf8f9fa : 0x030712;

      scene.background = new THREE.Color(bgColor);
      const fog = new THREE.FogExp2(bgColor, 0.015);
      scene.fog = fog;
      fogRef.current = fog;

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
      camera.position.z = 32;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      // 3. Lights
      const ambientColor = isLight ? 0x94a3b8 : 0x0f172a;
      const ambientIntensity = isLight ? 2.2 : 1.5;
      const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
      scene.add(ambientLight);
      ambientLightRef.current = ambientLight;

      const cyanLight = new THREE.PointLight(0x06b6d4, 2, 40);
      cyanLight.position.set(-15, 10, 10);
      scene.add(cyanLight);

      const violetLight = new THREE.PointLight(0x8b5cf6, 2, 40);
      violetLight.position.set(15, -10, 10);
      scene.add(violetLight);

      // 4. Generate Node Positions and Velocities
      const nodes = [];
      const positions = new Float32Array(nodeCount * 3);

      const xRange = isMobile ? 22 : 45;
      const yRange = isMobile ? 22 : 30;
      const zRange = 25;

      for (let i = 0; i < nodeCount; i++) {
        const x = (Math.random() - 0.5) * xRange;
        const y = (Math.random() - 0.5) * yRange;
        const z = (Math.random() - 0.5) * zRange;

        nodes.push({
          position: new THREE.Vector3(x, y, z),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.025,
            (Math.random() - 0.5) * 0.025,
            (Math.random() - 0.5) * 0.015
          )
        });

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }

      // Circular dot texture generated via HTML Canvas
      const createCircleTexture = (colorStr) => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const center = size / 2;
          const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
          grad.addColorStop(0, colorStr);
          grad.addColorStop(0.3, colorStr);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
        }
        return new THREE.CanvasTexture(canvas);
      };

      nodeTexture = createCircleTexture('rgba(59, 130, 246, 0.9)');

      nodeGeometry = new THREE.BufferGeometry();
      nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const initialNodeColor = isLight ? 0x2563eb : 0x3b82f6;
      nodeMaterial = new THREE.PointsMaterial({
        size: isMobile ? 0.75 : 0.6,
        color: initialNodeColor,
        map: nodeTexture,
        transparent: true,
        depthWrite: false,
        blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
        sizeAttenuation: true
      });
      nodeMaterialRef.current = nodeMaterial;

      nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
      scene.add(nodePoints);

      // 5. Initialize Dynamic Connection Lines
      const initialLineColor = isLight ? 0xcbd5e1 : 0x1e293b;
      const initialLineOpacity = isMobile ? (isLight ? 0.12 : 0.08) : (isLight ? 0.18 : 0.14);
      lineMaterial = new THREE.LineBasicMaterial({
        color: initialLineColor,
        transparent: true,
        opacity: initialLineOpacity,
        blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false
      });
      lineMaterialRef.current = lineMaterial;

      const lineGeometry = new THREE.BufferGeometry();
      lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineSegments);

      const getConnectedNeighbors = (index) => {
        const neighbors = [];
        const posA = nodes[index].position;
        for (let j = 0; j < nodeCount; j++) {
          if (index === j) continue;
          const dist = posA.distanceTo(nodes[j].position);
          if (dist < maxConnectionDistance) {
            neighbors.push(j);
          }
        }
        return neighbors;
      };

      // 6. Create Data Packet Streams
      const packets = [];
      const packetPositions = new Float32Array(packetCount * 3);

      for (let k = 0; k < packetCount; k++) {
        const startIdx = Math.floor(Math.random() * nodeCount);
        const neighbors = getConnectedNeighbors(startIdx);
        const targetIdx = neighbors.length > 0
          ? neighbors[Math.floor(Math.random() * neighbors.length)]
          : Math.floor(Math.random() * nodeCount);

        packets.push({
          position: new THREE.Vector3().copy(nodes[startIdx].position),
          startIdx,
          targetIdx,
          progress: Math.random(),
          speed: 0.002 + Math.random() * 0.005
        });

        packetPositions[k * 3] = packets[k].position.x;
        packetPositions[k * 3 + 1] = packets[k].position.y;
        packetPositions[k * 3 + 2] = packets[k].position.z;
      }

      const packetTexture = createCircleTexture('rgba(6, 182, 212, 1)');

      packetGeometry = new THREE.BufferGeometry();
      packetGeometry.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));

      const initialPacketColor = isLight ? 0x0891b2 : 0x06b6d4;
      packetMaterial = new THREE.PointsMaterial({
        size: isMobile ? 0.35 : 0.28,
        color: initialPacketColor,
        map: packetTexture,
        transparent: true,
        depthWrite: false,
        blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
        sizeAttenuation: true
      });
      packetMaterialRef.current = packetMaterial;

      packetPoints = new THREE.Points(packetGeometry, packetMaterial);
      scene.add(packetPoints);

      // 7. Interactive Coordinates
      let mouseX = 0;
      let mouseY = 0;
      let targetCameraX = 0;
      let targetCameraY = 0;

      handleMouseMove = (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      handleTouchMove = (e) => {
        if (e.touches.length > 0) {
          mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
          mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });

      let scrollY = 0;
      handleScroll = () => {
        scrollY = window.scrollY;
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      // 8. Animation Loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (document.visibilityState === 'hidden') return;

        const pArray = nodeGeometry.attributes.position.array;
        nodes.forEach((node, i) => {
          node.position.add(node.velocity);

          // Boundaries wrap / rebound
          if (Math.abs(node.position.x) > xRange / 2) node.velocity.x *= -1;
          if (Math.abs(node.position.y) > yRange / 2) node.velocity.y *= -1;
          if (Math.abs(node.position.z) > zRange / 2) node.velocity.z *= -1;

          pArray[i * 3] = node.position.x;
          pArray[i * 3 + 1] = node.position.y;
          pArray[i * 3 + 2] = node.position.z;
        });
        nodeGeometry.attributes.position.needsUpdate = true;

        // Re-populate connection lines vertices
        const lineVertices = [];
        for (let i = 0; i < nodeCount; i++) {
          const posA = nodes[i].position;
          for (let j = i + 1; j < nodeCount; j++) {
            const posB = nodes[j].position;
            const dist = posA.distanceTo(posB);
            
            if (dist < maxConnectionDistance) {
              lineVertices.push(posA.x, posA.y, posA.z);
              lineVertices.push(posB.x, posB.y, posB.z);
            }
          }
        }

        lineSegments.geometry.dispose();
        const newLineGeometry = new THREE.BufferGeometry();
        newLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
        lineSegments.geometry = newLineGeometry;

        // Update data packet flows
        const packetArray = packetGeometry.attributes.position.array;
        for (let k = 0; k < packetCount; k++) {
          const p = packets[k];

          p.progress += p.speed;

          if (p.progress >= 1.0) {
            p.progress = 0;
            p.startIdx = p.targetIdx;
            const neighbors = getConnectedNeighbors(p.startIdx);
            p.targetIdx = neighbors.length > 0
              ? neighbors[Math.floor(Math.random() * neighbors.length)]
              : Math.floor(Math.random() * nodeCount);
          }

          const startPos = nodes[p.startIdx].position;
          const targetPos = nodes[p.targetIdx].position;
          p.position.lerpVectors(startPos, targetPos, p.progress);

          packetArray[k * 3] = p.position.x;
          packetArray[k * 3 + 1] = p.position.y;
          packetArray[k * 3 + 2] = p.position.z;
        }
        packetGeometry.attributes.position.needsUpdate = true;

        // Interactive camera movements
        targetCameraX = mouseX * 4;
        targetCameraY = mouseY * 3;

        camera.position.x += (targetCameraX - camera.position.x) * 0.03;
        camera.position.y += (targetCameraY - camera.position.y) * 0.03;

        const scrollRotation = (scrollY / window.innerHeight) * 0.15;
        scene.rotation.y += (scrollRotation - scene.rotation.y) * 0.05;
        scene.rotation.x = -mouseY * 0.02;

        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      };

      animate();

      handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          cancelAnimationFrame(animationFrameId);
          animate();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      let lastWidth = window.innerWidth;
      handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (w === lastWidth) return;
        lastWidth = w;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize, { passive: true });

      cleanupFn = () => {
        cancelAnimationFrame(animationFrameId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);

        nodeGeometry.dispose();
        nodeMaterial.dispose();
        nodeTexture.dispose();
        lineMaterial.dispose();
        lineSegments.geometry.dispose();
        packetGeometry.dispose();
        packetMaterial.dispose();
        packetPoints.geometry.dispose();

        if (renderer && renderer.domElement && containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };

    } catch (e) {
      console.warn("WebGL initialization failed, falling back to 2D Canvas:", e);
      setWebGlSupported(false);
    }

    return () => {
      if (cleanupFn) cleanupFn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webGlSupported]);

  // Fallback 2D HTML5 Canvas Animation Loop
  useEffect(() => {
    if (webGlSupported) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const isMobile = window.innerWidth <= 768;
    const nodeCount = isMobile ? 25 : 60;
    const connectionDist = 120;
    const nodes = [];

    // Initialize 2D fallback particles
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.2
      });
    }

    let mouseX = null;
    let mouseY = null;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const w = window.innerWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      canvas.width = w;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    const isLight = theme === 'light';
    const bgColor = isLight ? '#f8fafc' : '#030712';
    const nodeColor = isLight ? 'rgba(37, 99, 235, 0.75)' : 'rgba(59, 130, 246, 0.75)';

    const animate2D = () => {
      animationFrameId = requestAnimationFrame(animate2D);

      if (document.visibilityState === 'hidden') return;

      // Draw background color
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw lines between nodes
      ctx.lineWidth = 1;
      for (let i = 0; i < nodeCount; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodeCount; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.45;
            ctx.strokeStyle = isLight
              ? `rgba(203, 213, 225, ${alpha})`
              : `rgba(30, 41, 59, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
          }
        }
      }

      // Move and draw nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;

        // Boundaries wrap
        if (node.x < 0) node.x = canvas.width;
        if (node.x > canvas.width) node.x = 0;
        if (node.y < 0) node.y = canvas.height;
        if (node.y > canvas.height) node.y = 0;

        // Mouse attraction interactive physics
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - node.x;
          const dy = mouseY - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            node.x += dx * 0.005;
            node.y += dy * 0.005;
          }
        }

        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animate2D();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cancelAnimationFrame(animationFrameId);
        animate2D();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [webGlSupported, theme]);

  // Handle theme changes dynamically in real time for WebGL
  useEffect(() => {
    if (!sceneRef.current) return;

    const isLight = theme === 'light';
    const bgColor = isLight ? 0xf8f9fa : 0x030712;
    const ambientColor = isLight ? 0x94a3b8 : 0x0f172a;
    const ambientIntensity = isLight ? 2.2 : 1.5;
    
    const nodeColor = isLight ? 0x2563eb : 0x3b82f6;
    const lineColor = isLight ? 0xcbd5e1 : 0x1e293b;
    const lineOpacity = isLight ? 0.18 : 0.14;
    const packetColor = isLight ? 0x0891b2 : 0x06b6d4;

    // Update scene background and fog colors
    sceneRef.current.background = new THREE.Color(bgColor);
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color = new THREE.Color(bgColor);
    }

    // Update lights
    if (ambientLightRef.current) {
      ambientLightRef.current.color = new THREE.Color(ambientColor);
      ambientLightRef.current.intensity = ambientIntensity;
    }

    // Update materials and blending properties
    if (nodeMaterialRef.current) {
      nodeMaterialRef.current.color = new THREE.Color(nodeColor);
      nodeMaterialRef.current.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
      nodeMaterialRef.current.needsUpdate = true;
    }

    if (lineMaterialRef.current) {
      lineMaterialRef.current.color = new THREE.Color(lineColor);
      lineMaterialRef.current.opacity = lineOpacity;
      lineMaterialRef.current.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
      lineMaterialRef.current.needsUpdate = true;
    }

    if (packetMaterialRef.current) {
      packetMaterialRef.current.color = new THREE.Color(packetColor);
      packetMaterialRef.current.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
      packetMaterialRef.current.needsUpdate = true;
    }
  }, [theme]);

  if (!webGlSupported) {
    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -2,
          pointerEvents: 'none',
          overflow: 'hidden',
          display: 'block'
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -2,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    />
  );
};

export default Technical3DBackground;
