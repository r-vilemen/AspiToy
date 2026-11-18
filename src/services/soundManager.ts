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
  private timeOfDay: 'day' | 'sunset' | 'night' = 'sunset'; // Período do dia adaptativo

  // Gerador de Ruído de Aspiração (Motor AspiToy)
  private noiseNode: AudioBufferSourceNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;
  private motorOsc: OscillatorNode | null = null;
  private isMotorRunning = false;

  // Hélice do Modo Aspi-Helicóptero (Sintetizador Procedural de Rotor Aéreo)
  private propellerGain: GainNode | null = null;
  private propellerNoiseSource: AudioBufferSourceNode | null = null;
  private propellerAirFilter: BiquadFilterNode | null = null;
  private propellerChopGain: GainNode | null = null;
  private propellerChopLfo: OscillatorNode | null = null;
  private propellerChopDepth: GainNode | null = null;
  private propellerThumpOsc: OscillatorNode | null = null;
  private propellerThumpFilter: BiquadFilterNode | null = null;
  private propellerThumpGain: GainNode | null = null;
  private propellerWhineOsc: OscillatorNode | null = null;
  private propellerWhineFilter: BiquadFilterNode | null = null;
  private propellerWhineGain: GainNode | null = null;
  private isPropellerRunning = false;
  private pinkNoiseBuffer: AudioBuffer | null = null;

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
      this.ctx.resume().catch(() => { });
    }

    return this.ctx;
  }

  /**
   * Gera ou retorna o buffer em loop de ruído rosa compartilhado.
   * Usado para a sucção do aspirador e para a aerodinâmica das pás da hélice.
   */
  private getPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.pinkNoiseBuffer) return this.pinkNoiseBuffer;

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

    this.pinkNoiseBuffer = noiseBuffer;
    return this.pinkNoiseBuffer;
  }

  /**
   * Sintetizador procedural do motor de aspiração do AspiToy:
   * Combina ruído de fluxo de ar passa-faixa com zumbido harmônico de motor elétrico miniatura.
   */
  private setupMotorSynth(): void {
    if (!this.ctx || !this.motorGain) return;

    // 1. Buffer de Ruído Rosa em loop contínuo
    const noiseBuffer = this.getPinkNoiseBuffer();
    if (!noiseBuffer) return;

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
      this.ctx.resume().catch(() => { });
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
   * Ajusta a atmosfera sonora para o período do dia (Dia, Pôr do Sol ou Noite).
   * À noite ativa a caixinha de música suave e modo motor silencioso.
   */
  public setTimeOfDay(time: 'day' | 'sunset' | 'night'): void {
    this.timeOfDay = time;
    if (this.isMotorRunning) {
      this.setMotorOperating(true);
    }
  }

  public getTimeOfDay(): 'day' | 'sunset' | 'night' {
    return this.timeOfDay;
  }

  /**
   * Atualiza o estado físico do motor de aspiração.
   * Modula o volume e a frequência com a velocidade do robô.
   * No modo noturno, opera em Modo Silencioso para não acordar os brinquedos e os gatos.
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
      const isNight = this.timeOfDay === 'night';
      // No modo noturno, volume cai pela metade e o ruído fica mais abafado
      const nightDamping = isNight ? 0.45 : 1.0;
      const targetGain = (0.14 + Math.min(speed, 1.2) * 0.05) * nightDamping;
      this.motorGain.gain.setTargetAtTime(targetGain, t, 0.25);

      if (this.motorFilter) {
        const targetFreq = (320 + Math.min(speed, 1.5) * 80) * (isNight ? 0.65 : 1.0);
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
   * Nota de Marimba / Glockenspiel de Brinquedo Saltitante.
   * No modo noturno, transmuta para timbre límpido de Caixinha de Música (Music Box / Celesta).
   */
  private playToyMarimbaNote(noteName: string, startTime: number, duration: number): void {
    const freq = NOTES[noteName];
    if (!freq || !this.ctx || !this.musicGain) return;

    const isNight = this.timeOfDay === 'night';

    // Oscilador fundamental: senoidal doce à noite (Music Box) ou triangular animado de dia (Marimba)
    const osc1 = this.ctx.createOscillator();
    osc1.type = isNight ? 'sine' : 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Oscilador harmônico: brilho de sino puro à noite (oitava dobrada)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * (isNight ? 3 : 2), startTime);

    // Envelope de ganho
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    const attackTime = isNight ? 0.006 : 0.012;
    const peakGain = isNight ? 0.22 : 0.36;
    noteGain.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
    const decay = isNight ? Math.min(duration * 1.2, 0.65) : Math.min(duration * 0.95, 0.45);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    // Filtro aveludado
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isNight ? 1900 : 3200, startTime);

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

    const isNight = this.timeOfDay === 'night';

    const osc = this.ctx.createOscillator();
    osc.type = isNight ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.0001, startTime);
    bassGain.gain.linearRampToValueAtTime(isNight ? 0.16 : 0.32, startTime + 0.015);
    const decay = Math.min(duration * 0.9, 0.4);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isNight ? 240 : 380, startTime);

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

    const isNight = this.timeOfDay === 'night';

    chordNotes.forEach((noteName) => {
      const freq = NOTES[noteName];
      if (!freq || !this.ctx || !this.musicGain) return;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(isNight ? 0.045 : 0.075, startTime + 0.012);
      const decay = Math.min(duration * 0.85, 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isNight ? 1100 : 1600, startTime);

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

    const isNight = this.timeOfDay === 'night';

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const startFreq = isHigh ? 920 : 620;
    const endFreq = isHigh ? 420 : 280;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.035);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    const volume = isNight ? 0.025 : isHigh ? 0.08 : 0.06;
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }

  /**
   * Fanfarra brilhante de celebração quando um brinquedo é guardado no tapete ou a oficina desbloqueia uma skin!
   */
  public playToyCelebrationChime(): void {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || !this.isEnabled) return;

    const t = ctx.currentTime;
    const notes = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6 || 1318.5];

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.065;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.42);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
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

  /**
   * Inicia o som aerodinâmico e lúdico da hélice do helicóptero:
   * Combina turbulência de ar cortado pelas pás (chopped pink noise),
   * pulso rítmico de baixa frequência (blade thump) e um suave zumbido
   * tecnológico de micro-turbina de brinquedo.
   */
  public startPropellerSound(): void {
    if (!this.isEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.isPropellerRunning) return;

    try {
      this.isPropellerRunning = true;
      const t = ctx.currentTime;

      // Ganho master da hélice (volume equilibrado com a música e SFX)
      this.propellerGain = ctx.createGain();
      this.propellerGain.gain.setValueAtTime(0.0001, t);
      this.propellerGain.gain.exponentialRampToValueAtTime(0.16, t + 0.35);
      this.propellerGain.connect(this.sfxGain);

      // 1. Camada de Ar / Turbulência cortada pelas pás (Chopped Air Wash)
      const noiseBuffer = this.getPinkNoiseBuffer();
      if (noiseBuffer) {
        this.propellerNoiseSource = ctx.createBufferSource();
        this.propellerNoiseSource.buffer = noiseBuffer;
        this.propellerNoiseSource.loop = true;

        this.propellerAirFilter = ctx.createBiquadFilter();
        this.propellerAirFilter.type = 'bandpass';
        this.propellerAirFilter.frequency.setValueAtTime(450, t);
        this.propellerAirFilter.Q.setValueAtTime(1.5, t);

        this.propellerChopGain = ctx.createGain();
        this.propellerChopGain.gain.setValueAtTime(0.38, t);

        // LFO senoidal suave que simula a passagem periódica de cada pá (16 Hz inicial)
        this.propellerChopLfo = ctx.createOscillator();
        this.propellerChopLfo.type = 'sine';
        this.propellerChopLfo.frequency.setValueAtTime(16, t);

        this.propellerChopDepth = ctx.createGain();
        this.propellerChopDepth.gain.setValueAtTime(0.28, t);

        this.propellerChopLfo.connect(this.propellerChopDepth);
        this.propellerChopDepth.connect(this.propellerChopGain.gain);

        this.propellerNoiseSource.connect(this.propellerAirFilter);
        this.propellerAirFilter.connect(this.propellerChopGain);
        this.propellerChopGain.connect(this.propellerGain);

        this.propellerNoiseSource.start(t);
        this.propellerChopLfo.start(t);
      }

      // 2. Camada de Batimento Grave das Pás (Blade Thump encorpado)
      this.propellerThumpOsc = ctx.createOscillator();
      this.propellerThumpOsc.type = 'sine';
      this.propellerThumpOsc.frequency.setValueAtTime(36, t);

      this.propellerThumpFilter = ctx.createBiquadFilter();
      this.propellerThumpFilter.type = 'lowpass';
      this.propellerThumpFilter.frequency.setValueAtTime(90, t);

      this.propellerThumpGain = ctx.createGain();
      this.propellerThumpGain.gain.setValueAtTime(0.12, t);

      this.propellerThumpOsc.connect(this.propellerThumpFilter);
      this.propellerThumpFilter.connect(this.propellerThumpGain);
      this.propellerThumpGain.connect(this.propellerGain);
      this.propellerThumpOsc.start(t);

      // 3. Camada de Micro-Turbina High-Tech (Zumbido sutil e amigável de drone)
      this.propellerWhineOsc = ctx.createOscillator();
      this.propellerWhineOsc.type = 'sine';
      this.propellerWhineOsc.frequency.setValueAtTime(290, t);

      this.propellerWhineFilter = ctx.createBiquadFilter();
      this.propellerWhineFilter.type = 'lowpass';
      this.propellerWhineFilter.frequency.setValueAtTime(700, t);

      this.propellerWhineGain = ctx.createGain();
      this.propellerWhineGain.gain.setValueAtTime(0.03, t);

      this.propellerWhineOsc.connect(this.propellerWhineFilter);
      this.propellerWhineFilter.connect(this.propellerWhineGain);
      this.propellerWhineGain.connect(this.propellerGain);
      this.propellerWhineOsc.start(t);
    } catch (e) {
      console.warn('Erro ao iniciar som de hélice:', e);
    }
  }

  /**
   * Modula a frequência e dinâmica da hélice conforme a rotação varia (decolagem, voo e pouso)
   */
  public updatePropellerSpeed(speed: number): void {
    if (!this.ctx || !this.isPropellerRunning) return;
    const t = this.ctx.currentTime;
    const k = Math.min(Math.max(speed / 45, 0), 1.25);

    // Modulação da cadência das pás de vento (14Hz a 28Hz)
    if (this.propellerChopLfo) {
      const chopRate = 14 + k * 14;
      this.propellerChopLfo.frequency.setTargetAtTime(chopRate, t, 0.05);
    }

    // Abertura do filtro de ar (ar fica mais brilhante e cortante com velocidade)
    if (this.propellerAirFilter) {
      const airCutoff = 380 + k * 340;
      this.propellerAirFilter.frequency.setTargetAtTime(airCutoff, t, 0.06);
    }

    // Frequência do pulso grave do rotor (32Hz a 54Hz)
    if (this.propellerThumpOsc) {
      const thumpFreq = 32 + k * 22;
      this.propellerThumpOsc.frequency.setTargetAtTime(thumpFreq, t, 0.05);
    }

    // Zumbido doce da micro-turbina (260Hz a 440Hz / nota Lá musical)
    if (this.propellerWhineOsc) {
      const whineFreq = 260 + k * 180;
      this.propellerWhineOsc.frequency.setTargetAtTime(whineFreq, t, 0.06);
    }
  }

  /**
   * Interrompe o som da hélice com desaceleração e desvanecimento orgânico
   */
  public stopPropellerSound(): void {
    if (!this.isPropellerRunning || !this.ctx || !this.propellerGain) {
      this.isPropellerRunning = false;
      return;
    }
    const t = this.ctx.currentTime;
    this.propellerGain.gain.cancelScheduledValues(t);
    this.propellerGain.gain.setValueAtTime(this.propellerGain.gain.value, t);
    this.propellerGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    // Efeito sonoro de rotação desacelerando até parar
    if (this.propellerChopLfo) {
      this.propellerChopLfo.frequency.setTargetAtTime(6, t, 0.25);
    }
    if (this.propellerThumpOsc) {
      this.propellerThumpOsc.frequency.setTargetAtTime(18, t, 0.25);
    }
    if (this.propellerWhineOsc) {
      this.propellerWhineOsc.frequency.setTargetAtTime(120, t, 0.25);
    }

    const noise = this.propellerNoiseSource;
    const chopLfo = this.propellerChopLfo;
    const thump = this.propellerThumpOsc;
    const whine = this.propellerWhineOsc;
    const pGain = this.propellerGain;

    setTimeout(() => {
      try {
        noise?.stop();
        chopLfo?.stop();
        thump?.stop();
        whine?.stop();
        noise?.disconnect();
        chopLfo?.disconnect();
        thump?.disconnect();
        whine?.disconnect();
        pGain?.disconnect();
      } catch {
        // Ignora caso já esteja finalizado
      }
    }, 500);

    this.propellerNoiseSource = null;
    this.propellerAirFilter = null;
    this.propellerChopGain = null;
    this.propellerChopLfo = null;
    this.propellerChopDepth = null;
    this.propellerThumpOsc = null;
    this.propellerThumpFilter = null;
    this.propellerThumpGain = null;
    this.propellerWhineOsc = null;
    this.propellerWhineFilter = null;
    this.propellerWhineGain = null;
    this.propellerGain = null;
    this.isPropellerRunning = false;
  }

  /**
   * Disparo suave e aquoso do canhão de bolhas
   */
  public playBubbleShoot(): void {
    this.playFoamCannonShoot();
  }

  /**
   * Estouro cristalino de sabão encantado (pop + cintilância)
   */
  public playBubblePop(): void {
    if (!this.isEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    // Tom agudo e saltitante
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(1850, t + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Som mecânico estilizado de extensão lateral da arma (Crash Kart Style).
   */
  public playFoamCannonDeploy(): void {
    if (!this.isEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    // Clique mecânico de trava
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Som de tiro de bolha do canhão (plop-blooop aquoso, alegre e saltitante).
   */
  public playFoamCannonShoot(): void {
    if (!this.isEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;

    // 1. Bolha primária: chirp ascendente elástico e aquoso (blup!)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(260, t);
    osc1.frequency.exponentialRampToValueAtTime(840, t + 0.085);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.linearRampToValueAtTime(0.38, t + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // 2. Bolha secundária em rápida sucessão criando o clássico "plop-blooop" borbulhante de desenho animado
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, t + 0.032);
    osc2.frequency.exponentialRampToValueAtTime(1260, t + 0.11);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.0001, t + 0.032);
    gain2.gain.linearRampToValueAtTime(0.32, t + 0.042);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.135);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.032);
    osc2.stop(t + 0.14);
  }

  /**
   * Impacto encorpado e espumoso ao atingir parede, móvel ou piso (Splat / Squish).
   */
  public playFoamSplat(): void {
    if (!this.isEnabled) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.11);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }
}

export const soundManager = new SoundManager();
