# 13. Apêndices

> [← Anterior: 12. Premissas, Riscos e Perguntas Pendentes](12-premissas-riscos-e-perguntas-pendentes.md) · [Índice do GDD](README.md)

## A. Glossário

- **MVP:** menor versão jogável para validar as premissas centrais.
- **Metroidvania:** exploração de espaços conectados em que habilidades abrem novas rotas.
- **Checkpoint:** ponto de retorno e, neste jogo, salvamento automático em transição elegível.
- **Quarto seguro:** área onde o jogador pode salvar; não é um depósito.
- **Item preso:** equipamento protegido da perda na morte, limitado a 20 itens.
- **Bolsa recuperável:** conjunto de itens não presos deixados no local da morte.
- **Manch's:** moeda virtual obtida somente por compra, planejada para depois do MVP.
- **FSM:** máquina de estados; **ADR:** registro de decisão técnica; **DoD:** critérios para considerar uma entrega concluída.

## B. Referências e inspirações

- Phaser: https://docs.phaser.io/ e https://phaser.io/examples
- Template React/TypeScript: https://github.com/phaserjs/template-react-ts
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Classificação Indicativa: https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao
- Referências de gênero: Metal Slug, Contra, Metroid e Castlevania; não são fontes de assets nem indicam afiliação.

## C. Créditos e licenças de terceiros

Nenhum asset ou biblioteca de terceiros foi incorporado a este documento. [PENDENTE] Criar inventário de dependências e assets ao iniciar implementação, com autoria, versão, licença, fonte, atribuição e evidência de permissão comercial; incluir ferramentas de IA e seus termos. Dono: proprietário; revisar antes da distribuição.

## D. Relatório de Auditoria do GDD (checklist ✔/✖)

Auditoria documental, não execução de testes ou garantia jurídica.

| Item | Resultado | Observação |
|---|---|---|
| 13 seções, pitch e pilares | ✔ | Seções completas ou identificadas como não aplicáveis/pendentes. |
| Loop em três camadas e fluxo de telas | ✔ | Diagramas e estados documentados. |
| Vitória, morte, retry e inventário | ✔ | Regra básica especificada; kit e tratamento de equipamento são suposições P-02. |
| IDs e rastreabilidade | ✔ | Mecânicas e requisitos ligados a tarefas e testes na seção 11.3. |
| Parâmetros consistentes | ✔ | Valores de referência centralizados em 2.11; métricas sujeitas a teste. |
| MVP compatível com capacidade | ✖ | 420 h + 180 h de reserva são hipótese; viabilidade depende de protótipo, dias disponíveis e custos. |
| Arquitetura, ciclo de vida e contrato | ✔ | Responsabilidades, eventos e limpeza especificados; teste real pendente. |
| Performance, assets, escala, input e save | ✔ | Metas e estratégia documentadas; aparelhos e medições reais pendentes. |
| Testes e deploy | ✔ | Plano definido; nenhum teste executado nesta etapa. |
| Classificação, privacidade, acessibilidade e licenças | ✔ | Abordados; conformidade e licenças não verificadas e dependem de revisão. |
| Monetização ética | ✔ | Sem vantagens de gameplay; implementação, preços e conformidade são pendentes. |
| Roadmap, backlog, riscos e premissas | ✔ | Marcos, estimativas, responsáveis e itens pendentes registrados. |
