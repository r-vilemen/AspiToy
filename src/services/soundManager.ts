/**
 * AspiToy Sound Engine — Áudio Procedural Integrado via Web Audio API
 * - Trilha Sonora Lúdica inspirada em filmes de brinquedo (Pixar / Toy Story)
 * - Efeito Físico de Sucção e Motor do AspiToy (zumbido suave com modulação de velocidade)
 * - Efeitos Sonoros (bipes fofos de ligar/desligar, clique e aspiração)
 * - Controle independente de Master, Trilha Sonora (Música) e Efeitos Sonoros (SFX)
 * - 100% nativo, sem arquivos externos nem latência de download.
 */

// Tabela de frequências musicais (em Hz)
const NOTES: Record<string, number> = {
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  Bb2: 116.54,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
};

// Formato: [nota, tempoEmBatidas, duracaoEmBatidas]
type MelodyNote = [string, number, number];

// Sequência melódica super animada e lúdica (32 batidas / 8 compassos em Dó Maior a 128 BPM)
// Bouncy, alegre e vibrante — inspirada em desenhos e trilhas clássicas de videogame de brinquedo
const LIVELY_TOY_MELODY: MelodyNote[] = [
  // Frase 1 (Compassos 1-2): Saltitante e cativante
  ['E5', 0.0, 0.35],
  ['G5', 0.5, 0.35],
  ['A5', 1.0, 0.4],
  ['G5', 1.5, 0.35],
  ['E5', 2.0, 0.4],
  ['C5', 2.5, 0.4],
  ['D5', 3.0, 0.75],
  ['E5', 4.0, 0.35],
  ['F5', 4.5, 0.35],
  ['G5', 5.0, 0.75],
  ['D5', 6.0, 0.4],
  ['E5', 6.5, 0.4],
  ['C5', 7.0, 0.8],

  // Frase 2 (Compassos 3-4): Resposta rápida e vibrante (com salto até o C6)
  ['E5', 8.0, 0.35],
  ['G5', 8.5, 0.35],
  ['C6', 9.0, 0.6],
  ['B5', 9.75, 0.35],
  ['A5', 10.25, 0.35],
  ['G5', 10.75, 0.5],
  ['E5', 11.5, 0.35],
  ['F5', 12.0, 0.35],
  ['A5', 12.5, 0.35],
  ['G5', 13.0, 0.6],
  ['E5', 13.75, 0.35],
  ['D5', 14.25, 0.35],
  ['C5', 15.0, 0.9],

  // Frase 3 (Compassos 5-6): Segunda parte festiva (subida para Fá e Lá)
  ['A5', 16.0, 0.35],
  ['C6', 16.5, 0.35],
  ['B5', 17.0, 0.5],
  ['A5', 17.75, 0.35],
  ['G5', 18.25, 0.35],
  ['E5', 19.0, 0.75],
  ['F5', 20.0, 0.35],
  ['A5', 20.5, 0.35],
  ['G5', 21.0, 0.5],
  ['F5', 21.75, 0.35],
  ['E5', 22.25, 0.35],
  ['D5', 23.0, 0.75],

  // Frase 4 (Compassos 7-8): Cadência empolgante com arpeggio rápido
  ['C5', 24.0, 0.25],
  ['D5', 24.5, 0.25],
  ['E5', 25.0, 0.25],
  ['F5', 25.5, 0.25],
  ['G5', 26.0, 0.5],
  ['A5', 26.75, 0.35],
  ['B5', 27.25, 0.35],
  ['C6', 28.0, 0.8],
  ['G5', 29.0, 0.4],
  ['E5', 29.5, 0.4],
  ['C5', 30.0, 1.4],
];

// Linha de contrabaixo acústico de brinquedo saltitante (Walking Bass / Pizzicato)
const LIVELY_BASS_LINE: MelodyNote[] = [
  // Compassos 1-2 (C - G - C - E - F - C - G - B)
  ['C3', 0.0, 0.8],
  ['G2', 1.0, 0.8],
  ['C3', 2.0, 0.8],
  ['E3', 3.0, 0.8],
  ['F2', 4.0, 0.8],
  ['C3', 5.0, 0.8],
  ['G2', 6.0, 0.8],
  ['B2', 7.0, 0.8],

  // Compassos 3-4 (C - G - A - E - F - A - G - B)
  ['C3', 8.0, 0.8],
  ['G2', 9.0, 0.8],
  ['A2', 10.0, 0.8],
  ['E3', 11.0, 0.8],
  ['F2', 12.0, 0.8],
  ['A2', 13.0, 0.8],
  ['G2', 14.0, 0.8],
  ['B2', 15.0, 0.8],

  // Compassos 5-6 (F - C - F - A - C - G - D - G)
  ['F2', 16.0, 0.8],
  ['C3', 17.0, 0.8],
  ['F2', 18.0, 0.8],
  ['A2', 19.0, 0.8],
  ['C3', 20.0, 0.8],
  ['G2', 21.0, 0.8],
  ['D3', 22.0, 0.8],
  ['G2', 23.0, 0.8],

  // Compassos 7-8 (C - E - F - G - C - G - C)
  ['C3', 24.0, 0.8],
  ['E3', 25.0, 0.8],
  ['F2', 26.0, 0.8],
  ['G2', 27.0, 0.8],
  ['C3', 28.0, 0.8],
  ['G2', 29.0, 0.8],
  ['C3', 30.0, 1.5],
];

// Harmonia animada de piano de brinquedo nos contratempos
const LIVELY_HARMONY_COMP: [string[], number, number][] = [
  [['E4', 'G4', 'C5'], 1.0, 0.45],
  [['E4', 'G4', 'C5'], 3.0, 0.45],
  [['F4', 'A4', 'C5'], 5.0, 0.45],
  [['D4', 'G4', 'B4'], 7.0, 0.45],
  [['E4', 'G4', 'C5'], 9.0, 0.45],
  [['E4', 'A4', 'C5'], 11.0, 0.45],
  [['F4', 'A4', 'C5'], 13.0, 0.45],
  [['D4', 'G4', 'B4'], 15.0, 0.45],
  [['F4', 'A4', 'C5'], 17.0, 0.45],
  [['F4', 'A4', 'C5'], 19.0, 0.45],
  [['E4', 'G4', 'C5'], 21.0, 0.45],
  [['D4', 'G4', 'B4'], 23.0, 0.45],
  [['E4', 'G4', 'C5'], 25.0, 0.45],
  [['F4', 'A4', 'C5'], 27.0, 0.45],
  [['E4', 'G4', 'C5'], 29.0, 0.45],
  [['E4', 'G4', 'C5'], 31.0, 0.45],
];

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private motorGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isEnabled = true; // Habilitado por padrão para som ativo
  private volume = 0.75; // Master volume (0 to 1)
  private musicVolume = 0.7; // Volume da trilha sonora (0 to 1)
  private sfxVolume = 0.8; // Volume dos efeitos sonoros (0 to 1)
  private isMusicMuted = false; // Estado mutado da trilha sonora (preserva o volume configurado)

  // Gerador de Ruído de Aspiração (Motor AspiToy)
  private noiseNode: AudioBufferSourceNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;
  private motorOsc: OscillatorNode | null = null;
  private isMotorRunning = false;

  // Agendador de Trilha Sonora
  private schedulerTimer: number | null = null;
  private loopStartTime = 0;
  private lastScheduledTime = 0;
  private readonly SECONDS_PER_BEAT = 60 / 128; // ~0.46875s (128 BPM animado)
  private readonly TOTAL_BEATS = 32;
  private readonly LOOP_DURATION = 32 * (60 / 128); // 15.0s

  constructor() {
    // Inicialização atrasada para obedecer políticas de autoplay do navegador
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();

      // Master Gain conectado diretamente à saída
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Barramento de Música (Trilha Sonora BGM)
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.getEffectiveMusicGain(), this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Barramento de Efeitos Sonoros (SFX)
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume * 0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Barramento de Motor/Aspiração (conecta ao sfxGain)
      this.motorGain = this.ctx.createGain();
      this.motorGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.motorGain.connect(this.sfxGain);

      try {
        this.setupMotorSynth();
      } catch (err) {
        console.warn('Erro ao inicializar sintetizador do motor:', err);
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Sintetizador procedural do motor de aspiração do AspiToy:
   * Combina ruído de fluxo de ar passa-faixa com zumbido harmônico de motor elétrico miniatura.
   */
  private setupMotorSynth(): void {
    if (!this.ctx || !this.motorGain) return;

    // 1. Buffer de Ruído Rosa de 2 segundos em loop contínuo
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Filtro Passa-Faixa para som de sucção de ar
    this.motorFilter = this.ctx.createBiquadFilter();
    this.motorFilter.type = 'bandpass';
    this.motorFilter.frequency.setValueAtTime(340, this.ctx.currentTime);
    this.motorFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.noiseNode.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);
    this.noiseNode.start();

    // 2. Oscilador elétrico do motorzinho (tom fundamental ~75Hz com ressonância)
    this.motorOsc = this.ctx.createOscillator();
    this.motorOsc.type = 'triangle';
    this.motorOsc.frequency.setValueAtTime(76, this.ctx.currentTime);

    const oscFilter = this.ctx.createBiquadFilter();
    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(240, this.ctx.currentTime);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    this.motorOsc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.motorGain);
    this.motorOsc.start();
  }

  /**
   * Assegura que o contexto de áudio esteja ativo após qualquer interação
   */
  public ensureAudioRunning(): void {
    if (!this.ctx) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.isEnabled && this.schedulerTimer === null) {
      this.startMusicScheduler();
    }
  }

  /**
   * Liga ou desliga globalmente o sistema de som do AspiToy.
   */
  public setEnabled(enabled: boolean): void {
    const wasEnabled = this.isEnabled;
    this.isEnabled = enabled;

    const ctx = this.initContext();
    if (!ctx) return;

    if (enabled) {
      const activate = () => {
        this.updateMusicGain();
        this.playChime(true);
        this.startMusicScheduler();
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(activate).catch(() => activate());
      } else {
        activate();
      }
    } else {
      if (wasEnabled) {
        this.playChime(false);
      }
      this.stopMusicScheduler();
      this.setMotorOperating(false);
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  /**
   * Configura o volume geral (Master) [0, 1].
   */
  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    this.ensureAudioRunning();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Retorna o ganho efetivo da música considerando o volume e o estado mutado.
   */
  public getEffectiveMusicGain(): number {
    if (this.isMusicMuted || !this.isEnabled) return 0;
    return this.musicVolume * 0.75;
  }

  private updateMusicGain(): void {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(
        this.getEffectiveMusicGain(),
        this.ctx.currentTime,
        0.05
      );
    }
  }

  /**
   * Muta ou desmuta a trilha sonora preservando o valor numérico do volume configurado.
   */
  public setMusicMuted(muted: boolean): void {
    this.isMusicMuted = muted;
    this.updateMusicGain();
  }

  public getIsMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  public toggleMusicMuted(): boolean {
    this.setMusicMuted(!this.isMusicMuted);
    return this.isMusicMuted;
  }

  /**
   * Configura o volume da trilha sonora (BGM) [0, 1].
   */
  public setMusicVolume(val: number): void {
    this.musicVolume = Math.max(0, Math.min(1, val));
    this.ensureAudioRunning();
    this.updateMusicGain();
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Configura o volume dos efeitos sonoros (SFX) [0, 1].
   */
  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.ensureAudioRunning();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.85, this.ctx.currentTime, 0.05);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Atualiza o estado físico do motor de aspiração.
   * Modula o volume e a frequência com a velocidade do robô.
   */
  public setMotorOperating(isOperating: boolean, speed = 0.8): void {
    if (!this.isEnabled) {
      this.isMotorRunning = false;
      if (this.motorGain && this.ctx) {
        this.motorGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      }
      return;
    }

    this.isMotorRunning = isOperating;

    if (!this.ctx || !this.motorGain || this.ctx.state === 'suspended') {
      if (isOperating) {
        this.ensureAudioRunning();
      }
      if (!this.ctx || !this.motorGain) {
        return;
      }
    }

    const t = this.ctx.currentTime;
    if (isOperating) {
      const targetGain = 0.14 + Math.min(speed, 1.2) * 0.05;
      this.motorGain.gain.setTargetAtTime(targetGain, t, 0.25);

      if (this.motorFilter) {
        const targetFreq = 320 + Math.min(speed, 1.5) * 80;
        this.motorFilter.frequency.setTargetAtTime(targetFreq, t, 0.2);
      }
    } else {
      this.motorGain.gain.setTargetAtTime(0, t, 0.35);
    }
  }

  public isMotorActive(): boolean {
    return this.isMotorRunning;
  }

  // ==========================================================================
  // AGENDADOR DE MÚSICA PROCEDURAL (Lookahead Scheduler sem Jitter)
  // ==========================================================================

  private startMusicScheduler(): void {
    if (this.schedulerTimer !== null || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          if (this.isEnabled) {
            this.startMusicScheduler();
          }
        })
        .catch(console.error);
      return;
    }

    const now = this.ctx.currentTime;
    this.loopStartTime = now + 0.05;
    this.lastScheduledTime = now;

    const scheduleLoop = () => {
      if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running') {
        this.stopMusicScheduler();
        return;
      }

      const currentTime = this.ctx.currentTime;

      // Se a aba foi suspensa/minimizada, resincroniza o agendador imediatamente
      if (currentTime - this.lastScheduledTime > 1.0) {
        this.lastScheduledTime = currentTime;
      }

      const lookahead = 0.4; // Agenda eventos até 400ms no futuro
      const windowEnd = currentTime + lookahead;

      if (windowEnd > this.lastScheduledTime) {
        const minLoop = Math.max(
          0,
          Math.floor((this.lastScheduledTime - this.loopStartTime) / this.LOOP_DURATION)
        );
        const maxLoop =
          Math.floor((windowEnd - this.loopStartTime) / this.LOOP_DURATION) + 1;

        for (let k = minLoop; k <= maxLoop; k++) {
          const loopOffset = this.loopStartTime + k * this.LOOP_DURATION;

          // 1. Melodia Principal Animada (Marimba / Glockenspiel saltitante)
          for (const [noteName, startBeat, durBeats] of LIVELY_TOY_MELODY) {
            const noteTime = loopOffset + startBeat * this.SECONDS_PER_BEAT;
            if (
              noteTime >= this.lastScheduledTime &&
              noteTime < windowEnd &&
              noteTime >= currentTime
            ) {
              this.playToyMarimbaNote(noteName, noteTime, durBeats * this.SECONDS_PER_BEAT);
            }
          }

          // 2. Contrabaixo Saltitante (Toy Walking Bass / Pizzicato)
          for (const [noteName, startBeat, durBeats] of LIVELY_BASS_LINE) {
            const noteTime = loopOffset + startBeat * this.SECONDS_PER_BEAT;
            if (
              noteTime >= this.lastScheduledTime &&
              noteTime < windowEnd &&
              noteTime >= currentTime
            ) {
              this.playToyBassNote(noteName, noteTime, durBeats * this.SECONDS_PER_BEAT);
            }
          }

          // 3. Harmonia Saltitante de Piano de Brinquedo
          for (const [chord, startBeat, durBeats] of LIVELY_HARMONY_COMP) {
            const noteTime = loopOffset + startBeat * this.SECONDS_PER_BEAT;
            if (
              noteTime >= this.lastScheduledTime &&
              noteTime < windowEnd &&
              noteTime >= currentTime
            ) {
              this.playToyChord(chord, noteTime, durBeats * this.SECONDS_PER_BEAT);
            }
          }

          // 4. Percussão de Madeira Saltitante (Tick-Tock alternado alegre)
          for (let beat = 0; beat < this.TOTAL_BEATS; beat++) {
            const woodTime = loopOffset + beat * this.SECONDS_PER_BEAT;
            if (
              woodTime >= this.lastScheduledTime &&
              woodTime < windowEnd &&
              woodTime >= currentTime
            ) {
              const isHigh = beat % 2 === 1;
              this.playWoodblock(woodTime, isHigh);
            }
          }
        }

        this.lastScheduledTime = windowEnd;
      }

      this.schedulerTimer = window.setTimeout(scheduleLoop, 80);
    };

    scheduleLoop();
  }

  private stopMusicScheduler(): void {
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /**
   * Nota de Marimba / Glockenspiel de Brinquedo Saltitante
   */
  private playToyMarimbaNote(noteName: string, startTime: number, duration: number): void {
    const freq = NOTES[noteName];
    if (!freq || !this.ctx || !this.musicGain) return;

    // Oscilador de onda triangular quente (fundamental)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Oscilador de onda senoidal de brilho (harmônico duplo sutil)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Envelope de ganho percussivo e saltitante
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(0.36, startTime + 0.012);
    const decay = Math.min(duration * 0.95, 0.45);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    // Filtro para calor acústico de xilofone/madeira
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, startTime);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(filter);
    filter.connect(this.musicGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + decay + 0.05);
    osc2.stop(startTime + decay + 0.05);
  }

  /**
   * Contrabaixo acústico de brinquedo saltitante (Toy Pizzicato Bass)
   */
  private playToyBassNote(noteName: string, startTime: number, duration: number): void {
    const freq = NOTES[noteName];
    if (!freq || !this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.0001, startTime);
    bassGain.gain.linearRampToValueAtTime(0.32, startTime + 0.015);
    const decay = Math.min(duration * 0.9, 0.4);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, startTime);

    osc.connect(bassGain);
    bassGain.connect(filter);
    filter.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + decay + 0.05);
  }

  /**
   * Acorde suave e rítmico de piano de brinquedo
   */
  private playToyChord(chordNotes: string[], startTime: number, duration: number): void {
    if (!this.ctx || !this.musicGain) return;

    chordNotes.forEach((noteName) => {
      const freq = NOTES[noteName];
      if (!freq || !this.ctx || !this.musicGain) return;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.075, startTime + 0.012);
      const decay = Math.min(duration * 0.85, 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, startTime);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + decay + 0.05);
    });
  }

  /**
   * Percussão rítmica de bloco de madeira de brinquedo (Tick-Tock alternado)
   */
  private playWoodblock(startTime: number, isHigh = false): void {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const startFreq = isHigh ? 920 : 620;
    const endFreq = isHigh ? 420 : 280;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.035);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(isHigh ? 0.08 : 0.06, startTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }

  // ==========================================================================
  // EFEITOS SONOROS (SFX)
  // ==========================================================================

  /**
   * Bipe melódico de Ligar / Desligar
   */
  public playChime(on: boolean): void {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const freqs = on
      ? [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6 || 1046.5]
      : [NOTES.G5, NOTES.E5, NOTES.C5];

    freqs.forEach((freq, idx) => {
      const noteTime = t + idx * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.24, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  /**
   * Efeito suave de sucção quando o robô aspira uma mancha de poeira
   */
  public playCleanPop(): void {
    if (!this.isEnabled || !this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  /**
   * Clique tátil de botão de brinquedo
   */
  public playClick(): void {
    if (!this.isEnabled || !this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(560, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }
}

export const soundManager = new SoundManager();
