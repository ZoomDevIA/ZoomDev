import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// VALE ZOOMDEV: mundo voxel 3D onde os agentes vivem e conversam
//
// Não é decoração: cada fala vem do estado real do ecossistema do fundador.
// Quando o Curupira fala de linha de base, é porque existe um projeto de
// bioeconomia sem ela.
//
// Performance: detecção de capacidade + degradação graciosa (pixel ratio,
// sombras, densidade de vegetação). Roda até em celular modesto.
// ═══════════════════════════════════════════════════════════════════════════

const BLOCO = 1;

// Detecta a capacidade do dispositivo para escolher o nível de detalhe
function detectarQualidade() {
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const movel = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (movel || mem <= 2 || cores <= 2) return 'baixa';
  if (mem <= 4 || cores <= 4) return 'media';
  return 'alta';
}

const PRESETS = {
  baixa: { pixelRatio: 1, sombras: false, arvores: 18, grama: 0, nevoa: 46, sombraMapa: 0 },
  media: { pixelRatio: 1.25, sombras: true, arvores: 40, grama: 60, nevoa: 60, sombraMapa: 1024 },
  alta: { pixelRatio: 1.75, sombras: true, arvores: 70, grama: 140, nevoa: 76, sombraMapa: 2048 },
};

// ── Texturas de rosto ─────────────────────────────────────────────────────

const cacheTextura = new Map();

/** Rosto de emergência: o emoji do agente vira o rosto, sobre a cor da marca. */
function texturaEmoji(emoji, cor) {
  const chave = `emoji:${emoji}:${cor}`;
  if (cacheTextura.has(chave)) return cacheTextura.get(chave);

  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const base = new THREE.Color(cor);
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, `#${base.clone().multiplyScalar(0.55).getHexString()}`);
  grad.addColorStop(1, `#${base.clone().multiplyScalar(0.25).getHexString()}`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.font = '74px "Segoe UI Emoji", "Noto Color Emoji", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 70);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cacheTextura.set(chave, t);
  return t;
}

/** Plaquinha com o nome, sempre voltada para a câmera. */
function texturaNome(nome, cor) {
  const chave = `nome:${nome}`;
  if (cacheTextura.has(chave)) return cacheTextura.get(chave);

  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(4,14,10,.78)';
  ctx.beginPath();
  ctx.roundRect(4, 10, 248, 44, 12);
  ctx.fill();
  ctx.strokeStyle = cor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#eaffea';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(nome.slice(0, 16), 128, 33);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cacheTextura.set(chave, t);
  return t;
}

/**
 * Boneco voxel com o AVATAR OFICIAL do agente aplicado à frente da cabeça:
 * a mesma arte que aparece nos cards, agora em 3D. Sem avatar, o emoji assume
 * o rosto e o PNG é adotado sozinho assim que o arquivo existir.
 */
function criarAgenteVoxel(cor, { avatar, face, emoji, nome } = {}) {
  const g = new THREE.Group();
  const corBase = new THREE.Color(cor);

  const corpo = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.75, 0.36),
    new THREE.MeshLambertMaterial({ color: corBase })
  );
  corpo.position.y = 0.75;
  corpo.castShadow = true;
  g.add(corpo);

  // Cabeça: 6 materiais, o índice 4 é a face frontal (+Z), onde vai o rosto.
  const lateral = () => new THREE.MeshLambertMaterial({ color: corBase.clone().multiplyScalar(0.42) });
  const rosto = new THREE.MeshLambertMaterial({ map: texturaEmoji(emoji || '•', cor) });
  const materiais = [lateral(), lateral(), lateral(), lateral(), rosto, lateral()];

  const cabeca = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), materiais);
  cabeca.position.y = 1.44;
  cabeca.castShadow = true;
  g.add(cabeca);

  // A arte oficial substitui o rosto assim que carrega.
  // Quando existe recorte quadrado do rosto (agents/faces/), ele entra inteiro.
  // Quando só há o retrato, enquadro o terço superior, onde fica o rosto.
  const fonte = face || avatar;
  if (fonte) {
    new THREE.TextureLoader().load(
      fonte,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (!face) { tex.repeat.set(1, 0.62); tex.offset.set(0, 0.38); }
        rosto.map = tex;
        rosto.needsUpdate = true;
      },
      undefined,
      () => { /* mantém o emoji */ },
    );
  }

  // Plaquinha com o nome, flutuando acima
  if (nome) {
    const placa = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.375),
      new THREE.MeshBasicMaterial({ map: texturaNome(nome, cor), transparent: true, depthWrite: false })
    );
    placa.position.y = 2.16;
    g.add(placa);
    g.userData.placa = placa;
  }

  // pernas e braços
  const membroMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(cor).multiplyScalar(0.65) });
  const pernas = [];
  for (const dx of [-0.16, 0.16]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.25), membroMat);
    p.position.set(dx, 0.28, 0);
    p.castShadow = true;
    g.add(p); pernas.push(p);
  }
  const bracos = [];
  for (const dx of [-0.42, 0.42]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.22), membroMat);
    b.position.set(dx, 0.8, 0);
    b.castShadow = true;
    g.add(b); bracos.push(b);
  }

  // auréola de energia (identidade ZoomDev)
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.56, 20),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(cor), transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.03;
  g.add(aura);

  // mescla: a plaquinha já foi registrada acima e não pode ser sobrescrita
  Object.assign(g.userData, { pernas, bracos, aura });
  return g;
}

function criarArvore(x, z, escala = 1) {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(
    new THREE.BoxGeometry(0.4 * escala, 1.6 * escala, 0.4 * escala),
    new THREE.MeshLambertMaterial({ color: 0x5a3a1e })
  );
  tronco.position.y = 0.8 * escala;
  tronco.castShadow = true;
  g.add(tronco);
  // copa em três camadas de blocos: silhueta voxel clássica
  const copaMat = new THREE.MeshLambertMaterial({ color: 0x1e7a3a });
  const camadas = [[1.9, 1.7], [1.5, 2.5], [0.9, 3.1]];
  for (const [larg, alt] of camadas) {
    const c = new THREE.Mesh(
      new THREE.BoxGeometry(larg * escala, 0.7 * escala, larg * escala),
      copaMat
    );
    c.position.y = alt * escala;
    c.castShadow = true;
    g.add(c);
  }
  g.position.set(x, 0, z);
  return g;
}

function criarEstacao(est) {
  const g = new THREE.Group();
  const cor = new THREE.Color(est.cor);

  // plataforma
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.5, 7),
    new THREE.MeshLambertMaterial({ color: 0x1a2c1e })
  );
  base.position.y = 0.25;
  base.receiveShadow = true;
  g.add(base);

  // borda luminosa
  const borda = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.14, 7.4),
    new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.55 })
  );
  borda.position.y = 0.52;
  g.add(borda);

  // pilares nos cantos
  const pilarMat = new THREE.MeshLambertMaterial({ color: 0x24382a });
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.5), pilarMat);
    p.position.set(dx, 1.6, dz);
    p.castShadow = true;
    g.add(p);
    const topo = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.3, 0.7),
      new THREE.MeshBasicMaterial({ color: cor })
    );
    topo.position.set(dx, 3.35, dz);
    g.add(topo);
  }

  // feixe de luz vertical marcando a estação
  const feixe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 14, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
  );
  feixe.position.y = 7;
  g.add(feixe);

  g.position.set(est.x, 0, est.z);
  g.userData = { feixe, borda };
  return g;
}

export default function Mundo() {
  const montRef = useRef(null);
  const [cena, setCena] = useState(null);
  const [erro, setErro] = useState(null);
  const [qualidade, setQualidade] = useState('alta');
  const [fps, setFps] = useState(0);
  const [selecionado, setSelecionado] = useState(null);
  const [suportaWebGL, setSuportaWebGL] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      if (!(c.getContext('webgl2') || c.getContext('webgl'))) setSuportaWebGL(false);
    } catch { setSuportaWebGL(false); }
    api.mundo().then(setCena).catch(e => setErro(e.message));
  }, []);

  useEffect(() => {
    if (!cena || !montRef.current || !suportaWebGL) return;
    const mont = montRef.current;
    const q = detectarQualidade();
    setQualidade(q);
    const P = PRESETS[q];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030d07);
    scene.fog = new THREE.Fog(0x030d07, 26, P.nevoa);

    const camera = new THREE.PerspectiveCamera(52, mont.clientWidth / mont.clientHeight, 0.1, 220);
    const renderer = new THREE.WebGLRenderer({ antialias: q !== 'baixa', powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, P.pixelRatio));
    renderer.setSize(mont.clientWidth, mont.clientHeight);
    if (P.sombras) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    mont.appendChild(renderer.domElement);

    // ── Iluminação ──
    const ambiente = new THREE.AmbientLight(0x88aacc, 1.05);
    scene.add(ambiente);
    const sol = new THREE.DirectionalLight(0xfff0d0, 1.6);
    sol.position.set(24, 34, 16);
    if (P.sombras) {
      sol.castShadow = true;
      sol.shadow.mapSize.set(P.sombraMapa, P.sombraMapa);
      sol.shadow.camera.left = -34; sol.shadow.camera.right = 34;
      sol.shadow.camera.top = 34; sol.shadow.camera.bottom = -34;
      sol.shadow.camera.far = 90;
    }
    scene.add(sol);
    scene.add(new THREE.HemisphereLight(0x66ffaa, 0x16301e, 0.75));

    // ── Terreno voxel ──
    const TAM = 46;
    const chao = new THREE.Mesh(
      new THREE.BoxGeometry(TAM, 1, TAM),
      new THREE.MeshLambertMaterial({ color: 0x14301c })
    );
    chao.position.y = -0.5;
    chao.receiveShadow = true;
    scene.add(chao);

    // relevo: blocos de altura variável nas bordas, dando a silhueta de vale
    const relevoMat = new THREE.MeshLambertMaterial({ color: 0x10281a });
    const relevoGeo = new THREE.BoxGeometry(BLOCO * 2, BLOCO * 2, BLOCO * 2);
    const relevo = new THREE.InstancedMesh(relevoGeo, relevoMat, 220);
    relevo.castShadow = true; relevo.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let ri = 0;
    for (let i = 0; i < 220; i++) {
      const ang = (i / 220) * Math.PI * 2;
      const raio = 19 + Math.sin(i * 1.7) * 2.6;
      const x = Math.cos(ang) * raio;
      const z = Math.sin(ang) * raio;
      const h = 1 + Math.abs(Math.sin(i * 0.9)) * 3;
      dummy.position.set(x, h * 0.5 - 0.5, z);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      relevo.setMatrixAt(ri++, dummy.matrix);
    }
    relevo.count = ri;
    scene.add(relevo);

    // ── Rio (o vale é amazônico) ──
    const rio = new THREE.Mesh(
      new THREE.BoxGeometry(TAM, 0.3, 4.5),
      new THREE.MeshLambertMaterial({ color: 0x0a4a6a, transparent: true, opacity: 0.85 })
    );
    rio.position.set(0, -0.1, 0);
    scene.add(rio);
    const brilhoRio = new THREE.Mesh(
      new THREE.BoxGeometry(TAM, 0.02, 4.5),
      new THREE.MeshBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: 0.2 })
    );
    brilhoRio.position.set(0, 0.07, 0);
    scene.add(brilhoRio);

    // ── Floresta ──
    for (let i = 0; i < P.arvores; i++) {
      const ang = (i / P.arvores) * Math.PI * 2 + Math.sin(i) * 0.5;
      const raio = 12 + (i % 5) * 1.7;
      const x = Math.cos(ang) * raio;
      const z = Math.sin(ang) * raio;
      if (Math.abs(z) < 3.2) continue;            // não planta dentro do rio
      if (cena.estacoes.some(e => Math.hypot(e.x - x, e.z - z) < 6)) continue;
      scene.add(criarArvore(x, z, 0.75 + (i % 4) * 0.16));
    }

    // ── Estações ──
    const gruposEstacao = [];
    for (const est of cena.estacoes) {
      const g = criarEstacao(est);
      scene.add(g);
      gruposEstacao.push(g);
    }

    // ── Agentes ──
    const agentes = [];
    for (const h of cena.habitantes) {
      const mesh = criarAgenteVoxel(h.cor, { avatar: h.retrato, face: h.rosto, emoji: h.emoji, nome: h.nome });
      // escala generosa: o avatar é o protagonista da cena, precisa ser legível
      mesh.scale.setScalar(1.6);
      mesh.position.set(h.x, 0.5, h.z);
      scene.add(mesh);
      agentes.push({ ...h, mesh, baseX: h.x, baseZ: h.z });
    }

    // ── Interação: clique seleciona agente ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const aoClicar = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(agentes.map(a => a.mesh), true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj.parent && !agentes.some(a => a.mesh === obj)) obj = obj.parent;
        const ag = agentes.find(a => a.mesh === obj);
        if (ag) setSelecionado({ id: ag.id, nome: ag.nome, emoji: ag.emoji, fala: ag.fala, estacao: ag.estacaoNome, cor: ag.cor, casta: ag.casta, avatar: ag.avatar, rosto: ag.rosto });
      } else setSelecionado(null);
    };
    renderer.domElement.addEventListener('pointerdown', aoClicar);

    // ── Câmera orbital com arraste ──
    let angulo = 0.6, altura = 11.5, distancia = 25, arrastando = false, ultimoX = 0, ultimoY = 0, autoGira = true;
    const onDown = (e) => { arrastando = true; autoGira = false; ultimoX = e.clientX; ultimoY = e.clientY; };
    const onUp = () => { arrastando = false; };
    const onMove = (e) => {
      if (!arrastando) return;
      angulo -= (e.clientX - ultimoX) * 0.006;
      altura = Math.max(3.5, Math.min(44, altura - (e.clientY - ultimoY) * 0.12));
      ultimoX = e.clientX; ultimoY = e.clientY;
    };
    const onWheel = (e) => { e.preventDefault(); distancia = Math.max(9, Math.min(64, distancia + e.deltaY * 0.03)); };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // ── Loop ──
    // começa em pleno dia (o ciclo escurece depois, não antes)
    let raf, t = Math.PI / 2 / 0.045, frames = 0, ultimoFps = performance.now();
    let anguloCamera = 0;
    const relogio = new THREE.Clock();

    const animar = () => {
      raf = requestAnimationFrame(animar);
      const dt = Math.min(relogio.getDelta(), 0.05);
      t += dt;

      // agentes caminham em órbitas próprias ao redor da sua estação
      for (const a of agentes) {
        const ang = t * a.velocidade * 0.4 + a.fase;
        const nx = a.baseX + Math.cos(ang) * a.raio;
        const nz = a.baseZ + Math.sin(ang) * a.raio;
        const dx = nx - a.mesh.position.x, dz = nz - a.mesh.position.z;
        a.mesh.position.x = nx;
        a.mesh.position.z = nz;
        if (Math.hypot(dx, dz) > 0.0001) a.mesh.rotation.y = Math.atan2(dx, dz);
        // passada: pernas e braços em contrafase
        const passo = Math.sin(t * a.velocidade * 7) * 0.5;
        const [p1, p2] = a.mesh.userData.pernas;
        const [b1, b2] = a.mesh.userData.bracos;
        p1.rotation.x = passo; p2.rotation.x = -passo;
        b1.rotation.x = -passo * 0.7; b2.rotation.x = passo * 0.7;
        a.mesh.position.y = 0.5 + Math.abs(Math.sin(t * a.velocidade * 7)) * 0.05;
        a.mesh.userData.aura.rotation.z += dt * 0.8;
        // a plaquinha do nome cancela a rotação do corpo e encara a câmera
        if (a.mesh.userData.placa) a.mesh.userData.placa.rotation.y = -a.mesh.rotation.y + anguloCamera;
      }

      // ciclo dia/noite lento
      const ciclo = (Math.sin(t * 0.045) + 1) / 2;
      sol.intensity = 1.0 + ciclo * 0.8;
      sol.color.setHSL(0.09 + ciclo * 0.06, 0.5, 0.68);
      ambiente.intensity = 0.8 + ciclo * 0.45;
      scene.fog.color.setRGB(0.03 + ciclo * 0.04, 0.09 + ciclo * 0.06, 0.05 + ciclo * 0.04);
      scene.background = scene.fog.color;

      // pulso das estações e do rio
      for (const g of gruposEstacao) {
        g.userData.feixe.material.opacity = 0.09 + Math.sin(t * 1.4) * 0.05;
        g.userData.borda.material.opacity = 0.42 + Math.sin(t * 2) * 0.14;
      }
      brilhoRio.material.opacity = 0.14 + Math.sin(t * 1.1) * 0.07;

      if (autoGira) angulo += dt * 0.06;
      anguloCamera = Math.PI / 2 - angulo;
      camera.position.set(Math.cos(angulo) * distancia, altura, Math.sin(angulo) * distancia);
      camera.lookAt(0, 2.6, 0);

      renderer.render(scene, camera);

      frames++;
      const agora = performance.now();
      if (agora - ultimoFps >= 1000) { setFps(frames); frames = 0; ultimoFps = agora; }
    };
    animar();

    const onResize = () => {
      if (!mont.clientWidth) return;
      camera.aspect = mont.clientWidth / mont.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mont.clientWidth, mont.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerdown', aoClicar);
      renderer.domElement.removeEventListener('wheel', onWheel);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mont) mont.removeChild(renderer.domElement);
    };
  }, [cena, suportaWebGL]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Vale <span className="zd-gradient-text">ZoomDev</span>
          </h1>
          <p className="text-white/55 text-sm mt-1.5">
            Seus agentes vivem aqui. Cada fala vem do estado real do seu ecossistema: clique em um deles.
          </p>
        </div>
        <div className="flex gap-2 items-center text-[11px] text-white/45">
          {cena && (
            <span className="zd-tag rounded-full px-2.5 py-1"
              title="Agentes com avatar oficial aplicado ao rosto do personagem">
              🎨 {cena.habitantes.filter(h => h.avatar).length}/{cena.habitantes.length} avatares
            </span>
          )}
          <span className="zd-tag rounded-full px-2.5 py-1">qualidade {qualidade}</span>
          {fps > 0 && <span className="zd-tag-blue rounded-full px-2.5 py-1">{fps} fps</span>}
        </div>
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      {!suportaWebGL ? (
        <div className="zd-card rounded-2xl p-8 text-center">
          <div className="text-3xl mb-2">🖥️</div>
          <div className="font-semibold">Seu navegador não suporta WebGL</div>
          <p className="text-sm text-white/50 mt-1">O vale 3D precisa de aceleração gráfica. Os agentes continuam ativos em todas as outras telas.</p>
        </div>
      ) : (
        <div className="relative">
          <div ref={montRef}
            className="w-full rounded-2xl overflow-hidden border border-[#00ff6426] bg-[#030d07] cursor-grab active:cursor-grabbing"
            style={{ height: 'min(66vh, 560px)' }} />

          {!cena && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="zd-gradient-text font-heading text-lg font-bold zd-pulse">Erguendo o vale…</div>
            </div>
          )}

          {/* Balão do agente selecionado */}
          {selecionado && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md zd-card-glow rounded-2xl p-4 flex gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center text-xl"
                style={{ borderColor: `${selecionado.cor}55`, background: `${selecionado.cor}18` }}>
                {selecionado.avatar
                  ? <img src={selecionado.avatar} alt={selecionado.nome}
                      className={`w-full h-full object-cover ${selecionado.rosto ? 'object-center' : 'object-top'}`} />
                  : <span>{selecionado.emoji}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-bold text-sm">{selecionado.nome}</span>
                  <span className="text-[10px] text-white/40">{selecionado.estacao}</span>
                </div>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">{selecionado.fala}</p>
              </div>
              <button onClick={() => setSelecionado(null)} className="text-white/30 hover:text-white/70 text-sm self-start">✕</button>
            </div>
          )}

          <div className="absolute top-3 right-3 text-[10px] text-white/35 bg-black/40 rounded-lg px-2.5 py-1.5 pointer-events-none">
            arraste para girar · roda para aproximar
          </div>
        </div>
      )}

      {/* Estações e diálogos */}
      {cena && (
        <div className="grid md:grid-cols-2 gap-5">
          <section>
            <h2 className="font-heading text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Estações do vale</h2>
            <div className="grid grid-cols-2 gap-2">
              {cena.estacoes.map(e => {
                const n = cena.habitantes.filter(h => h.estacao === e.id);
                return (
                  <div key={e.id} className="zd-card rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{e.emoji}</span>
                      <span className="text-xs font-bold">{e.nome}</span>
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">{n.length} agente(s)</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {n.map(h => (
                        <span key={h.id} className="flex items-center gap-1 text-[9px] rounded-full pl-0.5 pr-2 py-0.5 border"
                          style={{ borderColor: `${h.cor}44`, color: h.cor }} title={h.avatar ? h.nome : `${h.nome}: avatar em produção`}>
                          {h.avatar ? (
                            <img src={h.avatar} alt="" className={`w-4 h-4 rounded-full object-cover ${h.rosto ? 'object-center' : 'object-top'}`} />
                          ) : (
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                              style={{ background: `${h.cor}22` }}>{h.emoji}</span>
                          )}
                          {h.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-sm font-bold text-white/60 uppercase tracking-wider mb-2">
              Conversas em curso <span className="text-white/30 normal-case font-normal">· geradas do seu ecossistema</span>
            </h2>
            {cena.dialogos.length === 0 ? (
              <div className="zd-card rounded-xl p-5 text-center text-xs text-white/45">
                O vale está quieto. Crie um projeto e os agentes começam a conversar sobre ele.
              </div>
            ) : (
              <div className="space-y-2">
                {cena.dialogos.map((d, i) => {
                  const de = cena.habitantes.find(h => h.id === d.de);
                  const para = cena.habitantes.find(h => h.id === d.para);
                  return (
                    <div key={i} className="zd-card rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] mb-1">
                        <span style={{ color: de?.cor }}>{de?.emoji} {de?.nome || d.de}</span>
                        <span className="text-white/25">→</span>
                        <span style={{ color: para?.cor }}>{para?.emoji} {para?.nome || d.para}</span>
                      </div>
                      <p className="text-xs text-white/70">“{d.texto}”</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
