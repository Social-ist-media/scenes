import { useEffect, useRef, useState } from "react";
import type { DreamElement, Emotion, Motif } from "@/lib/sensory/types";

const EMOTION_COLOR: Record<Emotion, number> = {
  ECSTATIC: 0xc46a4a,
  JOYFUL: 0xe09a55,
  CREATIVE: 0x6fafa6,
  CALM: 0xf3eadc,
  FOCUSED: 0x9aa39d,
  ANXIOUS: 0xb56a4a,
  FATIGUED: 0x5c6568,
};

const LIFT: Record<Motif, number> = {
  orb: 0.5,
  arch: 0.75,
  river: 0.18,
  spire: 0.72,
  bloom: 0.48,
  veil: 0.9,
  star: 0.62,
  gate: 0.7,
};

interface StageProps {
  elements: DreamElement[];
  equipped: string[];
  selectedId: string | null;
  locked: boolean;
  onPlace: (point: { x: number; z: number }) => void;
  onSelect: (id: string | null) => void;
  onHover: (label: string | null) => void;
}

export function DreamStage(props: StageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x101417);
      scene.fog = new THREE.FogExp2(0x101417, 0.028);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
      camera.position.set(8.4, 6.2, 9.6);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.className = "block h-full w-full";
      renderer.domElement.style.touchAction = "none";
      host.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 0.4, 0);
      controls.maxPolarAngle = Math.PI / 2.08;
      controls.minDistance = 3.5;
      controls.maxDistance = 18;

      scene.add(new THREE.HemisphereLight(0xc9d4cf, 0x1a2428, 1.15));
      const key = new THREE.DirectionalLight(0xfff4e4, 2.4);
      key.position.set(5, 9, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x6fafa6, 0.85);
      fill.position.set(-6, 3, -2);
      scene.add(fill);
      const point = new THREE.PointLight(0xe09a55, 18, 28);
      point.position.set(0.4, 2.4, 0.6);
      scene.add(point);

      const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a3538, roughness: 0.86, metalness: 0.08 });
      const ground = new THREE.Mesh(new THREE.CircleGeometry(13, 64), groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.userData.ground = true;
      scene.add(ground);

      const grid = new THREE.GridHelper(16, 16, 0x6fafa6, 0x3a4a48);
      grid.position.y = 0.01;
      scene.add(grid);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 0.012, 8, 80),
        new THREE.MeshBasicMaterial({ color: 0xe09a55, transparent: true, opacity: 0.85 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02;
      scene.add(ring);

      const moteGeo = new THREE.BufferGeometry();
      const moteCount = 380;
      const motePos = new Float32Array(moteCount * 3);
      for (let i = 0; i < moteCount; i++) {
        motePos[i * 3] = (Math.random() - 0.5) * 14;
        motePos[i * 3 + 1] = Math.random() * 5;
        motePos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      }
      moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
      const moteMat = new THREE.PointsMaterial({ color: 0x9aa39d, size: 0.035, transparent: true, opacity: 0.7 });
      const motes = new THREE.Points(moteGeo, moteMat);
      scene.add(motes);

      const starGeo = new THREE.BufferGeometry();
      const starCount = 220;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 28;
        starPos[i * 3 + 1] = 4 + Math.random() * 8;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 28;
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
      const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xf3eadc, size: 0.04, transparent: true, opacity: 0.8 }),
      );
      stars.visible = false;
      scene.add(stars);

      const field = new THREE.Group();
      scene.add(field);
      const groups = new Map<string, import("three").Group>();

      const geometryFor = (kind: Motif) => {
        switch (kind) {
          case "orb":
            return new THREE.SphereGeometry(0.55, 28, 18);
          case "arch":
            return new THREE.TorusGeometry(0.62, 0.09, 12, 28);
          case "river":
            return new THREE.CapsuleGeometry(0.14, 2.1, 4, 8);
          case "spire":
            return new THREE.ConeGeometry(0.34, 1.7, 6);
          case "bloom":
            return new THREE.IcosahedronGeometry(0.52, 0);
          case "veil":
            return new THREE.PlaneGeometry(1.35, 1.8);
          case "star":
            return new THREE.OctahedronGeometry(0.46, 0);
          case "gate":
            return new THREE.BoxGeometry(1.15, 1.5, 0.14);
        }
      };

      const disposeGroup = (group: import("three").Group) => {
        group.traverse((obj) => {
          const mesh = obj as import("three").Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else if (material) material.dispose();
        });
      };

      const makeGroup = (el: DreamElement) => {
        const group = new THREE.Group();
        group.userData.elementId = el.id;
        const color = EMOTION_COLOR[el.emotion];
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.55,
          roughness: 0.32,
          metalness: 0.28,
          transparent: el.kind === "veil",
          opacity: el.kind === "veil" ? 0.45 : 1,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometryFor(el.kind), mat);
        mesh.userData.elementId = el.id;
        if (el.kind === "arch") mesh.rotation.x = Math.PI / 2;
        if (el.kind === "river") mesh.rotation.z = Math.PI / 2.3;
        if (el.kind === "veil") mesh.rotation.y = 0.5;
        group.add(mesh);
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.72, 0.015, 8, 32),
          new THREE.MeshBasicMaterial({ color: 0xf3eadc }),
        );
        halo.rotation.x = Math.PI / 2;
        halo.visible = false;
        halo.userData.ring = true;
        group.add(halo);
        return group;
      };

      const idOf = (obj: import("three").Object3D | null) => {
        let cursor: import("three").Object3D | null = obj;
        while (cursor) {
          if (typeof cursor.userData.elementId === "string") return cursor.userData.elementId as string;
          cursor = cursor.parent;
        }
        return null;
      };

      const resize = () => {
        const width = host.clientWidth || 1;
        const height = host.clientHeight || 1;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(host);

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let downX = 0;
      let downY = 0;

      const setPointer = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onDown = (event: PointerEvent) => {
        downX = event.clientX;
        downY = event.clientY;
      };
      const onMove = (event: PointerEvent) => {
        setPointer(event);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(field.children, true);
        const id = hits.length ? idOf(hits[0]!.object) : null;
        const el = live.current.elements.find((item) => item.id === id);
        live.current.onHover(el ? el.label : null);
      };
      const onUp = (event: PointerEvent) => {
        if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
        setPointer(event);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects([field, ground], true);
        const elementHit = hits.find((hit) => idOf(hit.object));
        if (elementHit) {
          live.current.onSelect(idOf(elementHit.object));
          return;
        }
        const floor = hits.find((hit) => hit.object.userData.ground);
        if (!floor || live.current.locked) {
          live.current.onSelect(null);
          return;
        }
        const x = Math.max(-7.5, Math.min(7.5, floor.point.x));
        const z = Math.max(-7.5, Math.min(7.5, floor.point.z));
        live.current.onPlace({ x, z });
      };

      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerup", onUp);

      const timer = new THREE.Timer();
      let frame = 0;
      const loop = () => {
        frame = window.requestAnimationFrame(loop);
        timer.update();
        const t = timer.getElapsed();
        const equipped = live.current.equipped;
        const fog = scene.fog as import("three").FogExp2;
        fog.density = equipped.includes("cathedral-fog") ? 0.055 : 0.025;
        groundMat.color.set(equipped.includes("tide-veil") ? 0x1e4744 : 0x2a3538);
        key.color.set(equipped.includes("hearth-glow") ? 0xe09a55 : 0xfff4e4);
        key.intensity = equipped.includes("hearth-glow") ? 3.1 : 2.4;
        const lucid = equipped.includes("lucid-gate");
        const ink = equipped.includes("ink-rain");
        const amber = equipped.includes("amber-motes");
        point.intensity = equipped.includes("pulse-bed") ? 16 + Math.sin(t * 3) * 6 : 18;
        moteMat.color.set(amber ? 0xe09a55 : ink ? 0x6f8f9a : 0x9aa39d);
        stars.visible = equipped.includes("star-salt");
        ring.rotation.z = t * 0.05;

        const positions = moteGeo.attributes.position;
        if (positions) {
          const arr = positions.array as Float32Array;
          for (let i = 0; i < moteCount; i++) {
            const y = arr[i * 3 + 1] ?? 0;
            if (ink) arr[i * 3 + 1] = y < 0.05 ? 5 : y - 0.012;
            else if (amber) arr[i * 3 + 1] = y > 5 ? 0.1 : y + 0.008;
            else arr[i * 3 + 1] = 0.4 + ((y + 0.004) % 4.6);
          }
          positions.needsUpdate = true;
        }

        const present = new Set(live.current.elements.map((el) => el.id));
        for (const [id, group] of groups) {
          if (!present.has(id)) {
            field.remove(group);
            disposeGroup(group);
            groups.delete(id);
          }
        }
        for (const el of live.current.elements) {
          let group = groups.get(el.id);
          if (!group) {
            group = makeGroup(el);
            groups.set(el.id, group);
            field.add(group);
          }
          const mesh = group.children[0] as import("three").Mesh;
          const mat = mesh.material as import("three").MeshStandardMaterial;
          if (group.userData.emotion !== el.emotion) {
            const color = EMOTION_COLOR[el.emotion];
            mat.color.set(color);
            mat.emissive.set(color);
            group.userData.emotion = el.emotion;
          }
          mat.emissiveIntensity = lucid ? 1.1 : 0.55;
          const halo = group.children[1];
          if (halo) halo.visible = el.id === live.current.selectedId;
          const bob = Math.sin(t * 0.9 + el.x) * 0.05;
          group.position.set(el.x, LIFT[el.kind] * el.scale + bob, el.z);
          group.scale.setScalar(el.scale);
        }

        controls.update();
        renderer.render(scene, camera);
      };
      loop();
      setReady(true);

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        timer.disconnect();
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerup", onUp);
        controls.dispose();
        for (const group of groups.values()) disposeGroup(group);
        moteGeo.dispose();
        moteMat.dispose();
        starGeo.dispose();
        (stars.material as import("three").Material).dispose();
        ground.geometry.dispose();
        groundMat.dispose();
        scene.traverse((obj) => {
          const mesh = obj as import("three").Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (disposed) cleanup();
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={hostRef} className="relative h-full w-full bg-ink">
      {ready ? null : (
        <p className="pointer-events-none absolute inset-x-0 top-4 text-center text-sm text-mist">Raising the field…</p>
      )}
    </div>
  );
}
