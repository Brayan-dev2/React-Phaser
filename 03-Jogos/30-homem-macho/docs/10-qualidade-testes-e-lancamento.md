# 10. Qualidade, Testes e Lançamento

> [← Anterior: 9. Produção e Gestão](09-producao-e-gestao.md) · [Próxima: 11. Requisitos Consolidados →](11-requisitos-consolidados.md)

## 10.1 Plano de QA e matriz de dispositivos/navegadores

[SUPOSIÇÃO] Matriz mínima: Windows/Chrome e Firefox; macOS/Safari; Android médio/Chrome; iPhone e iPad/Safari; Edge desktop. Modelos e versões exatas: [PENDENTE], definidos antes do Beta conforme aparelhos disponíveis. Testar horizontal, touch simultâneo, perda de foco, rede instável, erro de login e retomada de save. Registrar hardware, resolução, versão, rede, FPS e resultados; não afirmar compatibilidade sem executar.

## 10.2 Casos de teste críticos e critérios de aceite por mecânica

Todos são cenários planejados, não testes já executados.

| ID | Dado / Quando / Então |
|---|---|
| TST-001 | Dada habilidade ativa, quando pular duas vezes no ar antes de pousar, então apenas o primeiro salto extra ocorre. |
| TST-002 | Dado inimigo com 20 HP, quando golpe branco de 20 HP atingir, então ele morre uma vez. |
| TST-003 | Dado escudo 10 e vida 100 em dificuldade média, quando receber dano 20, então escudo = 0 e vida = 90. |
| TST-004 | Dados um item preso e um solto, quando morrer, então só o solto vai à bolsa; ao morrer novamente sem recuperar, a primeira bolsa é destruída. Testar limite de 20 presos e 40 slots. |
| TST-005 | Dada habilidade de acesso obtida, quando morrer e retornar, então ela permanece utilizável. |
| TST-006 | Dada porta fechada, quando informar senha incorreta/correta, então permanece fechada/abre respectivamente. |
| TST-007 | Dado checkpoint elegível ou quarto seguro, quando save for confirmado e houver novo login, então estado confirmado é restaurado; desafio não salva por transição. |
| TST-008 | Dadas três mortes no mesmo trecho no difícil, quando respawn ocorrer, então oferta recusável aparece; após campanha, qualquer dificuldade é selecionável no mesmo save. |
| TST-009 | Dado chefe com 0 HP, quando resultado for processado, então recompensa e conclusão são registradas uma vez. |
| TST-010 | Dada seed e versão fixas, quando gerar desafio opcional duas vezes, então resultado é reproduzível e alcançável. Pós-MVP. |
| TST-011 | Dado StrictMode, quando montar/desmontar/remontar, então há no máximo um canvas ativo e nenhum listener duplicado. |
| TST-012 | Dado save com revisão antiga ou retry após interrupção, quando enviar operação, então conflito é indicado ou operação idempotente não duplica itens; conta não acessa save de outra conta. |
| TST-013 | Dado novo jogador autenticado, quando percorrer LVL-01–03, então alcança habilidade, puzzle, chefe e conclusão sem ficar preso. |
| TST-014 | Dado desktop ou mobile horizontal, quando usar controles pertinentes, então ações funcionam; botões touch têm ≥ 44 × 44 px CSS e foco de UI é visível. |
| TST-015 | Dado PT-BR ou EN-US, quando percorrer todas as telas MVP, então textos corretos aparecem sem chaves ausentes ou corte impeditivo. |
| TST-016 | Dada matriz e rede documentadas, quando executar percurso, então desempenho, carregamento e build são medidos contra 7.11 e erros bloqueantes corrigidos. |
| TST-017 | Dado pagamento confirmado e reenvio do mesmo webhook, quando crédito for processado, então saldo é creditado uma única vez; reembolso revoga conforme política. Pós-MVP. |
| TST-018 | Dado um save, quando abrir o mapa, então a sala atual está marcada, as percorridas e as portas vistas aparecem e o resto não é desenhado; dado L02-02, quando atravessar a fenda do teto, então chega a L02-06 (`DEC-043`). |
| TST-019 | Dada a porta de senha de L02-07 fechada, quando o herói caminhar contra ela, então fica dentro da sala (não sai do mundo); dada a senha certa, então passa e **volta a passar** depois de sair e regressar, e o save guarda que ela cedeu (`DEC-044`). |
| TST-020 | Dado qualquer chefe com tiro disponível, quando o projétil o acertar, então o **projétil** é despachado e o chefe continua visível, ativo e com corpo; e o Guardião de LVL-03 chega a 0 HP e a arena abre (`DEC-046`). |
| TST-021 | Dado o jogo inteiro, quando se atravessa cada uma das **15 passagens** de setor para setor com o gesto real (`KeyD` na saída leste, `KeyE` no elevador, alçapão e portão), então a área de destino é a esperada, a vida e o escudo viajam intactos e o kit não se perde; e as travas cobram o que a ficha diz (elevador sem Força não sobe, portão com uma chave não abre); e no fim o trono de L16-06 encerra o jogo com o crachá, sem «FIM DO RECORTE» em parte alguma (`DEC-047`). |
| TST-022 | Dado LVL-01 ampliado, quando se entra em cada uma das seis salas, então o número de corpos e o arquétipo de cada um são os que a ficha diz, o atirador **dispara** um projétil reto, o voador **não tem gravidade** e fica no ar, a câmara **rola** numa sala maior que o ecrã, e o dano é o do arquétipo e não uma constante (`DEC-048`). |
| TST-023 | Dado o herói agarrado a uma parede de ganchos, quando se segura **subir** (`W`/`↑`), então o corpo sobe contínuo a 90 px/s **sem largar a garra em momento nenhum**, e segurar o **pulo** em vez disso produz o salto de parede e não uma subida (`DEC-049`). |

## 10.3 Plano de playtest (perfil, roteiro, métricas, perguntas)

Recrutar, quando possível, 5 jogadores do público-alvo por milestone com gameplay, incluindo desktop e mobile; obter consentimentos apropriados para menores. Roteiro: iniciar, compreender controles, explorar por 5–10 min, encontrar habilidade, morrer/recuperar e enfrentar chefe quando disponível. Medir conclusão, tempo de onboarding, mortes e compreensão da bolsa com observação consentida. Perguntar: onde quis ir, por que morreu, como recuperar itens, o que foi frustrante e se gostaria de continuar. Não interpretar amostra de cinco como prova estatística de retenção.

## 10.4 KPIs e métricas de sucesso (retenção D1/D7/D30, tempo de sessão, taxa de conclusão, crash rate)

Metas são [SUPOSIÇÃO] e dependem de instrumentação legal e tamanho de amostra suficiente.

| Métrica | Definição e meta inicial |
|---|---|
| Sessão | Mediana de 5–10 min em playtests; início de gameplay até saída/pausa longa. |
| Tutorial | ≥ 85% concluem onboarding sem ajuda; observacional no MVP. |
| Conclusão do recorte | [SUPOSIÇÃO] ≥ 60% dos participantes de teste concluem em até 3 sessões; registrar amostra. |
| Crash-free | Meta ≥ 99% das sessões medidas; definir coleta e denominador antes de ativar. |
| Retenção D1/D7/D30 | Coorte de contas que retornam após 1/7/30 dias; metas não fixadas. Não medir sem análise de privacidade/consentimento aplicável. |
| Loja | Conversão/receita não aplicáveis no MVP; definir apenas antes da loja. |

## 10.5 Checklist de lançamento (legal, loja/plataforma, SEO/OG tags, termos, política de privacidade)

- [ ] Revisar classificação indicativa e conteúdo por jurisdição; confirmar nome/marca.
- [ ] Publicar termos, política de privacidade, contato e fluxo de exclusão; revisar regras para menores.
- [ ] Auditar direitos de assets, ferramentas de IA, fontes e créditos de bibliotecas.
- [ ] Validar HTTPS, CSP, permissões, backup, recuperação e custo mensal do backend.
- [ ] Passar testes 10.2, matriz 10.1 e revisão de acessibilidade; documentar limitações.
- [ ] Configurar título, descrição e OG tags, conforme indexação desejada; revisar políticas da hospedagem.
- [ ] Testar deploy/rollback e monitoramento operacional mínimo.
- [ ] Se houver venda futura: revisar fornecedor, pagamentos, reembolsos, moedas virtuais e proteções para menores antes de ativar.
