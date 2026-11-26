# 6. Áudio

> [← Anterior: 5. Arte e Direção Visual](05-arte-e-direcao-visual.md) · [Próxima: 7. Arquitetura Técnica →](07-arquitetura-tecnica.md)

## 6.1 Direção sonora e referências

[SUPOSIÇÃO] Música de ação sombria com instrumentação sintetizada old school e momentos cômicos discretos; impactos claros e distintos. Sem dublagem no MVP. Toda referência é estética, sem copiar gravações ou composições.

## 6.2 Lista de SFX e músicas (ID, gatilho, duração, loop, volume, formato OGG/MP3/M4A)

[SUPOSIÇÃO] Volumes relativos ao bus, sujeitos a mixagem. Arquivos pendentes de produção/licença.

| ID | Gatilho | Duração | Loop | Volume | Formato |
|---|---|---:|---|---:|---|
| SFX-001 | Salto | 0,2 s | Não | 70% | OGG + M4A/MP3 fallback |
| SFX-002 | Impacto de arma | 0,3 s | Não | 75% | OGG + M4A/MP3 fallback |
| SFX-003 | Dano ao jogador | 0,4 s | Não | 70% | OGG + M4A/MP3 fallback |
| SFX-004 | Abrir porta/salvar | 0,5 s | Não | 60% | OGG + M4A/MP3 fallback |
| SFX-005 | Derrota/morte | 1,0 s | Não | 70% | OGG + M4A/MP3 fallback |
| BGM-01 | Exploração | 90 s | Sim | 50% | OGG + M4A/MP3 fallback |
| BGM-02 | Chefe | 60 s | Sim | 55% | OGG + M4A/MP3 fallback |

## 6.3 Mixagem, ducking e regras de autoplay do navegador (desbloqueio por gesto do usuário)

Desbloquear AudioContext por gesto explícito em Jogar; mostrar opção de iniciar sem áudio se necessário. Master, música e SFX separados e persistidos. [SUPOSIÇÃO] Limitar SFX a 8 vozes, variar levemente pitch; reduzir música em 20% durante sinais críticos. Para faixas longas avaliar HTML5 audio/streaming conforme suporte e comportamento da engine, sem assumir que todos os formatos são suportados em todos os navegadores.

## 6.4 Licenças e créditos

Registrar criação, ferramenta de IA, termos de uso comercial, fonte, licença e atribuição por asset. Não usar material de origem ou voz de terceiros sem autorização. Licença final de cada faixa e SFX: [PENDENTE] proprietário, antes de publicação.
