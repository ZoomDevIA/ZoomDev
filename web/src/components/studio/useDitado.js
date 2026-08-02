import { useCallback, useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// DITADO POR VOZ — transcrição ao vivo, sem custo e sem servidor.
//
// Usa a Web Speech API do navegador, que roda no próprio aparelho. Chrome e
// Edge suportam; Firefox não. Quando não há suporte, o botão simplesmente não
// aparece, em vez de aparecer e falhar no clique.
//
// A onda de nível vem do microfone por AnalyserNode, separada do
// reconhecimento. É prova visual de que o microfone está captando: sem ela,
// silêncio do reconhecedor e microfone mudo parecem a mesma coisa.
// ═══════════════════════════════════════════════════════════════════════════

const BARRAS = 18;

export default function useDitado({ aoTranscrever, idioma = 'pt-BR' } = {}) {
  const [ouvindo, setOuvindo] = useState(false);
  const [erro, setErro] = useState(null);
  const [niveis, setNiveis] = useState(() => Array(BARRAS).fill(0.08));

  const reconhecedor = useRef(null);
  const audio = useRef({ contexto: null, fluxo: null, quadro: null });
  const aoTranscreverRef = useRef(aoTranscrever);
  aoTranscreverRef.current = aoTranscrever;

  const suportado = typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const pararAudio = useCallback(() => {
    const a = audio.current;
    if (a.quadro) cancelAnimationFrame(a.quadro);
    a.fluxo?.getTracks().forEach(t => t.stop());
    a.contexto?.close().catch(() => {});
    audio.current = { contexto: null, fluxo: null, quadro: null };
    setNiveis(Array(BARRAS).fill(0.08));
  }, []);

  const ligarMedidor = useCallback(async () => {
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const contexto = new (window.AudioContext || window.webkitAudioContext)();
      const fonte = contexto.createMediaStreamSource(fluxo);
      const analisador = contexto.createAnalyser();
      analisador.fftSize = 64;
      fonte.connect(analisador);
      const dados = new Uint8Array(analisador.frequencyBinCount);

      const desenhar = () => {
        analisador.getByteFrequencyData(dados);
        // Reamostra os bins para o número de barras da interface
        const passo = Math.floor(dados.length / BARRAS) || 1;
        setNiveis(Array.from({ length: BARRAS }, (_, i) => {
          let soma = 0;
          for (let j = 0; j < passo; j++) soma += dados[i * passo + j] || 0;
          return Math.min(1, (soma / passo) / 180);
        }));
        audio.current.quadro = requestAnimationFrame(desenhar);
      };
      audio.current = { contexto, fluxo, quadro: requestAnimationFrame(desenhar) };
    } catch {
      // Medidor é acessório: sem microfone liberado, o reconhecedor já avisa
    }
  }, []);

  const parar = useCallback(() => {
    try { reconhecedor.current?.stop(); } catch { /* já parado */ }
    reconhecedor.current = null;
    pararAudio();
    setOuvindo(false);
  }, [pararAudio]);

  const iniciar = useCallback(() => {
    if (!suportado) return;
    setErro(null);
    const Reconhecedor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new Reconhecedor();
    r.lang = idioma;
    r.continuous = true;
    r.interimResults = false;   // só o texto final entra na caixa

    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const trecho = e.results[i][0].transcript.trim();
          if (trecho) aoTranscreverRef.current?.(trecho);
        }
      }
    };
    r.onerror = (e) => {
      const mensagens = {
        'not-allowed': 'O navegador bloqueou o microfone. Libere o acesso e tente de novo.',
        'no-speech': 'Não ouvi nada. Aproxime o microfone e fale de novo.',
        'audio-capture': 'Nenhum microfone encontrado neste aparelho.',
        network: 'O reconhecimento de voz precisa de internet e ela caiu.',
      };
      setErro(mensagens[e.error] || `Falha no ditado: ${e.error}`);
      parar();
    };
    // O reconhecedor encerra sozinho depois de um tempo: religa enquanto o
    // usuário não mandou parar, para o ditado longo não morrer no meio.
    r.onend = () => { if (reconhecedor.current === r) { try { r.start(); } catch { parar(); } } };

    reconhecedor.current = r;
    try {
      r.start();
      setOuvindo(true);
      ligarMedidor();
    } catch (e) {
      setErro('Não consegui abrir o microfone.');
      parar();
    }
  }, [suportado, idioma, parar, ligarMedidor]);

  const alternar = useCallback(() => { ouvindo ? parar() : iniciar(); }, [ouvindo, parar, iniciar]);

  useEffect(() => () => parar(), [parar]);

  return { suportado, ouvindo, erro, niveis, iniciar, parar, alternar };
}
