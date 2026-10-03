export class SoundBed {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private oscs: OscillatorNode[] = [];

  start() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const voices = [
      { freq: 110, type: "sine" as OscillatorType, gain: 0.55 },
      { freq: 164.81, type: "sine" as OscillatorType, gain: 0.18 },
      { freq: 220, type: "triangle" as OscillatorType, gain: 0.08 },
    ];
    for (const voice of voices) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = voice.type;
      osc.frequency.value = voice.freq;
      gain.gain.value = voice.gain;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      this.oscs.push(osc);
    }
    this.ctx = ctx;
    this.master = master;
  }

  set(intensity: number, pulse: boolean) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const level = Math.max(0, Math.min(0.07, intensity * 0.07));
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(level, now + 0.25);
    const lfo = pulse ? 1 + Math.sin(now * 2.2) * 0.015 : 1;
    this.oscs[0]?.frequency.setTargetAtTime(110 * lfo, now, 0.2);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.2);
    const ctx = this.ctx;
    window.setTimeout(() => {
      this.oscs.forEach((osc) => osc.stop());
      void ctx.close();
      this.oscs = [];
      this.ctx = null;
      this.master = null;
    }, 280);
  }
}
