#!/usr/bin/env python3
"""
ARENA RELÂMPAGO — gerador das trilhas sonoras de fundo.

Compõe 3 loops SEM COSTURA (o fim encaixa no começo) e grava em MP3:

  assets/musica/titulo.mp3   -> tela de título      (96 BPM, Lá menor, ambiente + trovão)
  assets/musica/selecao.mp3  -> escolha do lutador  (118 BPM, Ré menor, groove funk)
  assets/musica/luta.mp3     -> durante a luta      (150 BPM, Mi menor, agressiva)

Como funciona (ótimo para a aula de som):
  * cada instrumento é uma onda matemática (seno, dente de serra, quadrada);
  * o envelope (ataque + decaimento) dá a \"forma\" da nota;
  * filtros passa-baixa \"abafam\" o som (é o que faz o baixo ficar encorpado);
  * tudo que passa do fim do loop volta para o começo: por isso o loop não tem emenda.

Uso:  pip install numpy scipy lameenc  &&  python3 ferramentas/gerar_musicas.py
"""
import os
import numpy as np
import lameenc
from scipy.signal import butter, sosfilt

SR = 44100
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'musica')
rng = np.random.default_rng(7)  # semente fixa: a mesma trilha sai sempre igual


# ---------------------------------------------------------------- utilidades
def midi(m):
    """Número MIDI (69 = Lá 440 Hz) -> frequência em Hz."""
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def osc(kind, f, n):
    """Oscilador: f pode ser escalar ou vetor (permite vibrato)."""
    f = np.full(n, f, dtype=float) if np.isscalar(f) else f
    x = np.cumsum(f) / SR                      # fase em ciclos
    if kind == 'sin':
        return np.sin(2 * np.pi * x)
    if kind == 'tri':
        return 2 / np.pi * np.arcsin(np.sin(2 * np.pi * x))
    if kind == 'saw':
        return 2 * (x % 1.0) - 1
    if kind == 'sq':
        return np.sign(np.sin(2 * np.pi * x))
    raise ValueError(kind)


def env_exp(n, tau, ataque=0.002):
    """Ataque curtinho + queda exponencial (pluck, bateria, pizzicato)."""
    t = np.arange(n) / SR
    return np.minimum(t / ataque, 1.0) * np.exp(-t / tau)


def env_sustentada(n, ataque=0.01, soltura=0.05):
    """Nota que segura: sobe, mantém e solta no fim (evita 'clique')."""
    i = np.arange(n)
    return np.minimum(i / (ataque * SR), 1.0) * np.minimum((n - i) / (soltura * SR), 1.0)


def lp(freq, ordem=2):
    return butter(ordem, freq, 'lowpass', fs=SR, output='sos')


def hp(freq, ordem=2):
    return butter(ordem, freq, 'highpass', fs=SR, output='sos')


def ruido(n):
    return rng.uniform(-1, 1, n)


def aplicar_filtro_loop(x, sos):
    """Filtra um loop mantendo a emenda: repete 3x, filtra e pega o miolo."""
    n = len(x)
    y = sosfilt(sos, np.concatenate([x, x, x]), axis=0)
    return y[n:2 * n]


class Camada:
    """Uma trilha (instrumento) do tamanho exato do loop. Estéreo (n, 2)."""

    def __init__(self, n):
        self.n = n
        self.a = np.zeros((n, 2))

    def soma(self, sinal, inicio_s, ganho=1.0, pan=0.0):
        """Soma um trecho de som a partir do segundo `inicio_s`. Quem passa do fim volta ao começo."""
        sinal = sinal[: self.n - 1]
        idx = (int(round(inicio_s * SR)) + np.arange(len(sinal))) % self.n
        esq = np.cos((pan + 1) * np.pi / 4)
        dir_ = np.sin((pan + 1) * np.pi / 4)
        self.a[idx, 0] += ganho * esq * sinal
        self.a[idx, 1] += ganho * dir_ * sinal

    def filtrar(self, sos):
        """Passa o instrumento por um filtro (devolve a própria camada, para encadear)."""
        self.a = aplicar_filtro_loop(self.a, sos)
        return self


# ---------------------------------------------------------------- instrumentos
def nota(kind, m, dur, tau=None, ataque=0.01, soltura=0.05, vib=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.5 * t))
    env = env_exp(n, tau, ataque) if tau else env_sustentada(n, ataque, soltura)
    return osc(kind, f, n) * env


def pad_cordas(m_lista, dur, volume=0.05):
    """Pad: 3 serras desafinadas por nota (efeito de 'cordas' largas)."""
    n = int(dur * SR)
    saida = np.zeros(n)
    for m in m_lista:
        for cents in (-7, 0, 7):
            f = midi(m) * 2 ** (cents / 1200)
            saida += osc('saw', f, n) * env_sustentada(n, 0.9, 0.9)
    return saida * volume


def kick(n_max=0.35):
    n = int(n_max * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-28 * t)
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * np.exp(-t / 0.11)


def snare(n_max=0.22):
    n = int(n_max * SR)
    t = np.arange(n) / SR
    rumor = sosfilt(butter(2, [1400, 6000], 'bandpass', fs=SR, output='sos'), ruido(n))
    tom = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    return rumor * np.exp(-t / 0.075) * 0.9 + tom * 0.5


def hihat(aberto=False, n_max=0.25):
    tau = 0.11 if aberto else 0.025
    n = int(n_max * SR)
    return sosfilt(hp(7000, 4), ruido(n)) * env_exp(n, tau, 0.0005)


def trovao(dur=3.2):
    """Trovão: ruído marrom (grave) com ataque lento e cauda longa."""
    n = int(dur * SR)
    marrom = np.cumsum(ruido(n))
    marrom -= np.linspace(marrom[0], marrom[-1], n)  # tira a deriva
    marrom /= np.max(np.abs(marrom)) + 1e-9
    t = np.arange(n) / SR
    env = np.minimum(t / 0.25, 1.0) * np.exp(-t / 1.1)
    return sosfilt(lp(260, 2), marrom) * env * 2.2


def subida(dur):
    """Riser: ruído que sobe de intensidade e de tom (tensão antes da troca de seção)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (t / dur) ** 2
    # fade de saída: sem ele, a subida termina no volume máximo e cria um "clique" na emenda do loop
    saida = np.minimum((n - np.arange(n)) / (0.03 * SR), 1.0)
    return sosfilt(hp(300), ruido(n)) * x * saida * 0.6


def estouro(dur=1.6):
    """Crash: explosão de ruído brilhante que some devagar."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    return sosfilt(hp(2500, 2), ruido(n)) * np.exp(-t / 0.6)


def distorcer(x, forca):
    """Saturação (guitarra/baixo distorcido): tanh deixa o som 'sujo' e agressivo."""
    return np.tanh(forca * x) / np.tanh(forca)


# ---------------------------------------------------------------- acordes/melodias
def compassos_para_segundos(bpm, compassos):
    return compassos * 4 * 60.0 / bpm


def montar(nome, bpm, compassos):
    beat = 60.0 / bpm
    bar = 4 * beat
    n = int(round(compassos_para_segundos(bpm, compassos) * SR))
    return beat, bar, n


def tocar_melodia(camada, frase, inicio_bar, beat, kind, ganho, pan, tau=None, ataque=0.01,
                  soltura=0.06, vib=0.0):
    """Escreve uma frase [(midi, batidas), ...] a partir de um compasso."""
    t = inicio_bar * 4 * beat
    for m, batidas in frase:
        dur = batidas * beat
        if m is not None:
            s = nota(kind, m, dur * 0.94, tau=tau, ataque=ataque, soltura=soltura, vib=vib)
            camada.soma(s, t, ganho, pan)
        t += dur


def trilha_titulo():
    """96 BPM, Lá menor. Atmosfera: pads, arpejo suave, melodia de sino e trovões."""
    bpm, compassos = 96, 16
    beat, bar, n = montar('titulo', bpm, compassos)
    acordes = [(57, 60, 64), (53, 57, 60), (60, 64, 67), (55, 59, 62)]  # Am F C G
    raizes = [33, 29, 36, 31]

    pad = Camada(n)
    grave = Camada(n)
    arpejo = Camada(n)
    melodia = Camada(n)
    chuva = Camada(n)
    trovoes = Camada(n)
    chimbal = Camada(n)

    for i in range(4):
        bloco = i * 4 * bar
        # pad: cada acorde dura 4 compassos
        pad.soma(pad_cordas(acordes[i], 4 * bar + 0.8, 0.055), bloco - 0.4, 1.0, 0.0)
        # baixo sub: uma nota grave por compasso
        for c in range(4):
            grave.soma(osc('sin', midi(raizes[i]), int(bar * SR)) * env_sustentada(int(bar * SR), 0.05, 0.6),
                       bloco + c * bar, 0.20)
        # arpejo: semicolcheias subindo e descendo pelas notas do acorde
        ordem = [0, 1, 2, 1, 0, 1, 2, 3]
        notas = list(acordes[i]) + [acordes[i][0] + 12]
        for c in range(4):
            for k in range(16):
                m = notas[ordem[k % len(ordem)]] + 12
                s = nota('tri', m, beat * 0.9, tau=0.16, ataque=0.003)
                arpejo.soma(s, bloco + c * bar + k * beat / 4, 0.09, -0.35 if k % 2 else 0.25)
        # chimbal suave (oitavas)
        for c in range(4):
            for k in range(8):
                chimbal.soma(hihat(False), bloco + c * bar + k * beat / 2, 0.05, rng.uniform(-0.6, 0.6))

    # melodia de sino (duas frases de 4 compassos, repetidas com variação na oitava)
    frase_a = [(69, 2), (72, 2), (76, 3), (74, 1), (72, 2), (71, 2), (69, 2), (64, 2)]
    frase_b = [(76, 2), (74, 2), (72, 3), (71, 1), (69, 2), (67, 2), (69, 2), (64, 2)]
    for bloco_i, frase in [(0, frase_a), (2, frase_b), (4, frase_a), (6, frase_b),
                           (8, frase_a), (10, frase_b), (12, frase_a), (14, frase_b)]:
        tocar_melodia(melodia, frase, bloco_i, beat, 'sin', 0.11, 0.2, tau=0.9, ataque=0.01, vib=0.004)

    # chuva e trovões: o clima da arena
    for c in range(compassos):
        chuva.soma(sosfilt(hp(4000, 2), ruido(int(bar * SR))) * 0.03, c * bar, 1.0, 0.0)
    trovoes.soma(trovao(), 0.0 * bar, 0.55, -0.2)
    trovoes.soma(trovao(), 8 * bar + 1.5 * beat, 0.40, 0.25)

    camadas = [
        (pad.filtrar(lp(1400)), 1.0),
        (grave.filtrar(lp(160)), 1.0),
        (arpejo, 1.0),
        (melodia.filtrar(lp(4500)), 1.0),
        (chuva.filtrar(lp(9000)), 1.0),
        (trovoes, 1.0),
        (chimbal, 1.0),
    ]
    return soma_final([c.a for c, _ in camadas], n, reverb=0.10, alvo=0.80)


def trilha_selecao():
    """118 BPM, Ré menor. Groove funk: baixo com síncopes, bateria seca e stabs de acorde."""
    bpm, compassos = 118, 16
    beat, bar, n = montar('selecao', bpm, compassos)
    acordes = [(62, 65, 69), (58, 62, 65), (53, 57, 60), (60, 64, 67)]  # Dm Bb F C
    raizes = [38, 34, 29, 36]

    baixo = Camada(n)
    stabs = Camada(n)
    bateria = Camada(n)
    lead = Camada(n)
    pad = Camada(n)

    passos_baixo = [0, 0, 12, 0, 0, 0, 7, 0]  # semitons (padrão funk)
    for c in range(compassos):
        raiz = raizes[c % 4]
        for k, s in enumerate(passos_baixo):
            m = raiz + s
            sig = nota('saw', m, beat * 0.42, tau=0.20, ataque=0.004)
            baixo.soma(sig, c * bar + k * beat / 2, 0.16, 0.0)
        for k in [0.5, 1.5, 2.5, 3.5]:
            for m in acordes[c % 4]:
                sig = nota('sq', m + 12, beat * 0.32, tau=0.07, ataque=0.002)
                stabs.soma(sig, c * bar + k * beat, 0.035, 0.4 if k < 2 else -0.4)

    # bateria: 16 passos por compasso
    passos_kick = [0, 3, 8, 11]
    passos_snare = [4, 12]
    for c in range(compassos):
        for p in passos_kick:
            bateria.soma(kick(), c * bar + p * beat / 4, 0.75)
        for p in passos_snare:
            bateria.soma(snare(), c * bar + p * beat / 4, 0.32, 0.05)
        for p in range(0, 16, 2):
            aberto = p in (6, 14)
            bateria.soma(hihat(aberto), c * bar + p * beat / 4, 0.12 if not aberto else 0.09,
                         rng.uniform(-0.5, 0.5))

    # melodia de 4 compassos repetida: um \"tema de dojo\" em Ré menor
    # 16 batidas = 4 compassos (1,5+0,5+1+1+1+1+2+2+2+2+2 = 16)
    frase = [(74, 1.5), (77, 0.5), (81, 1), (79, 1), (77, 1), (74, 1), (72, 2), (70, 2),
             (69, 2), (70, 2), (72, 2)]
    assert abs(sum(b for _, b in frase) - 16) < 1e-9
    for bloco_i in range(0, compassos, 4):
        tocar_melodia(lead, frase, bloco_i, beat, 'sq', 0.055, -0.25, tau=0.30, ataque=0.005, vib=0.0)
    lead.filtrar(lp(3200))

    for c in range(0, compassos, 2):
        pad.soma(pad_cordas(acordes[c % 4], 2 * bar, 0.02), c * bar, 1.0, 0.0)

    camadas = [baixo.filtrar(lp(900)), stabs.filtrar(lp(3000)),
               bateria, lead, pad.filtrar(lp(1800))]
    return soma_final([c.a for c in camadas], n, reverb=0.06, alvo=0.80)


def trilha_luta():
    """150 BPM, Mi menor, 32 compassos. Bateria 4 por 4, baixo distorcido e tensão."""
    bpm, compassos = 150, 32
    beat, bar, n = montar('luta', bpm, compassos)
    progressao = [(52, 55, 59), (48, 52, 55), (50, 54, 57), (47, 50, 54)]  # Em C D B
    raizes = [40, 36, 38, 35]

    baixo = Camada(n)
    stabs = Camada(n)
    bateria = Camada(n)
    lead = Camada(n)
    efeitos = Camada(n)

    padrao_a = [76, 76, 79, 83, 84, 83, 79, 76]
    padrao_b = [74, 74, 78, 81, 83, 81, 78, 74]
    for c in range(compassos):
        grupo = c % 4
        raiz = raizes[grupo]
        # baixo em semicolcheias: nota da raiz com um salto de oitava no meio do compasso
        for k in range(16):
            m = raiz + (12 if k in (6, 7, 14, 15) else 0)
            sig = nota('saw', m, beat * 0.22, tau=0.07, ataque=0.001)
            baixo.soma(sig, c * bar + k * beat / 4, 0.19, 0.0)
        # stabs de power chord nas batidas 1 e 3
        for k in (0, 2):
            for m in progressao[grupo]:
                s = nota('sq', m + 12, beat * 0.5, tau=0.16, ataque=0.002)
                stabs.soma(s, c * bar + k * beat, 0.05, 0.35 if k == 0 else -0.35)
        # lead em oitavas: 8 notas por compasso
        padrao = padrao_a if grupo < 2 else padrao_b
        for k, m in enumerate(padrao):
            sig = nota('saw', m, beat * 0.46, tau=0.12, ataque=0.002)
            lead.soma(sig, c * bar + k * beat / 2, 0.035, 0.45 if k % 2 else -0.45)
        # bateria 4 por 4: bumbo nas batidas, caixa nas 2 e 4, chimbal em semicolcheias
        for b in range(4):
            bateria.soma(kick(), c * bar + b * beat, 0.80)
            if b % 2 == 1:
                bateria.soma(snare(), c * bar + b * beat, 0.42, 0.05)
        for k in range(8):
            bateria.soma(hihat(k % 4 == 3), c * bar + k * beat / 2, 0.10, rng.uniform(-0.4, 0.4))
        # tensão: subida antes de cada seção de 8 compassos e crash no início
        if c % 8 == 7:
            efeitos.soma(subida(bar), c * bar, 1.0, 0.0)
        if c % 16 == 0:
            efeitos.soma(estouro(), c * bar, 0.20, 0.0)

    camadas = [baixo.filtrar(lp(1400)), stabs.filtrar(lp(3600)),
               bateria, lead.filtrar(lp(6000)), efeitos]
    misto = soma_final([c.a for c in camadas], n, reverb=0.03, alvo=0.88, distorcao=1.6)
    return misto


# ---------------------------------------------------------------- mixagem final
def reverb_simples(x, tempo_s=0.11, feedback=0.35):
    """Eco curto (delay) que volta ao começo: mantém o loop sem emenda."""
    n = len(x)
    atraso = int(tempo_s * SR)
    saida = x.copy()
    for k in range(1, 4):
        saida += np.roll(x, atraso * k) * (feedback ** k)
    return saida


def soma_final(camadas, n, reverb=0.0, alvo=0.8, distorcao=None):
    mix = np.zeros((n, 2))
    for c in camadas:
        mix += c
    if reverb:
        mix = mix + reverb_simples(mix) * reverb
    if distorcao:
        mix = distorcer(mix, distorcao)
    pico = np.max(np.abs(mix)) + 1e-9
    mix = mix / pico * alvo
    return mix.astype(np.float32)


def salvar_mp3(caminho, audio, kbps=160):
    pcm = np.clip(audio * 32767, -32768, 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(kbps)
    enc.set_in_sample_rate(SR)
    enc.set_channels(2)
    enc.set_quality(2)
    dados = enc.encode(pcm.tobytes()) + enc.flush()
    with open(caminho, 'wb') as f:
        f.write(dados)


def main():
    os.makedirs(RAIZ, exist_ok=True)
    trilhas = [
        ('titulo.mp3', trilha_titulo),
        ('selecao.mp3', trilha_selecao),
        ('luta.mp3', trilha_luta),
    ]
    for nome, fn in trilhas:
        audio = fn()
        caminho = os.path.join(RAIZ, nome)
        salvar_mp3(caminho, audio)
        duracao = len(audio) / SR
        print(f'{nome:12s} {duracao:6.1f} s  pico={np.max(np.abs(audio)):.2f}  -> {os.path.normpath(caminho)}')


if __name__ == '__main__':
    main()
