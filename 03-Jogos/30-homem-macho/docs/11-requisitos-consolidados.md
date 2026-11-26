# 11. Requisitos Consolidados

> [← Anterior: 10. Qualidade, Testes e Lançamento](10-qualidade-testes-e-lancamento.md) · [Próxima: 12. Premissas, Riscos e Perguntas Pendentes →](12-premissas-riscos-e-perguntas-pendentes.md)

## 11.1 Requisitos funcionais (REQ-F-###)

| ID | Requisito |
|---|---|
| REQ-F-001 | Permitir deslocamento, pulo e salto duplo após desbloqueio. |
| REQ-F-002 | Permitir ataques branco e à distância com dano verificável. |
| REQ-F-003 | Aplicar dano a escudo/vida e consumir/regenerar poder conforme parâmetros. |
| REQ-F-004 | Controlar 40 slots, até 20 itens presos e recuperação/perda da bolsa de morte. |
| REQ-F-005 | Conceder habilidade de exploração permanente e preservar acesso após morte. |
| REQ-F-006 | Fornecer armadilha e porta com senha e pista encontrável. |
| REQ-F-007 | Salvar automaticamente em transições elegíveis e por interação em quarto seguro. |
| REQ-F-008 | Exigir conta e conexão; persistir estado online e tratar falhas/conflitos. |
| REQ-F-009 | Oferecer três dificuldades, redução condicionada e troca após campanha. |
| REQ-F-010 | Processar inimigo, chefe, recompensa e conclusão sem duplicações. |
| REQ-F-011 | Entregar região MVP conectada e jogável até sua conclusão. |
| REQ-F-012 | Pós-MVP: gerar desafios opcionais reproduzíveis e alcançáveis. |
| REQ-F-013 | Pós-MVP: vender cosméticos sem vantagens e creditar Manch's de forma transacional. |
| REQ-F-014 | Mostrar ao jogador, a qualquer momento e a partir de duas entradas (tecla e ícone no HUD), uma planta do setor com as salas percorridas, as portas já vistas e a posição atual — sem revelar o que não se viu (`DEC-043`). |
| REQ-F-015 | Barrar fisicamente uma porta fechada e, uma vez aberta por senha, mantê-la aberta em todas as visitas e após retomar o save (`DEC-044`). |

## 11.2 Requisitos não funcionais (REQ-NF-###): desempenho, compatibilidade, acessibilidade, segurança

| ID | Requisito |
|---|---|
| REQ-NF-001 | Manter separação React/Phaser, lifecycle seguro e build verificável. |
| REQ-NF-002 | Suportar teclado/mouse e touch horizontal; UI acessível conforme metas 4.6. |
| REQ-NF-003 | Disponibilizar PT-BR e EN-US com textos externalizados. |
| REQ-NF-004 | Medir performance e compatibilidade da seção 7.11 na matriz 10.1; HTTPS e proteção de dados conforme 7.16. |

## 11.3 Matriz de rastreabilidade (Mecânica ↔ Requisito ↔ Tarefa ↔ Teste)

| Mecânica / sistema | Requisito | Tarefa | Teste |
|---|---|---|---|
| MEC-001 | REQ-F-001 | BKL-002 | TST-001 |
| MEC-002 | REQ-F-002 | BKL-003 | TST-002 |
| MEC-003 | REQ-F-003 | BKL-004 | TST-003 |
| MEC-004 | REQ-F-004 | BKL-005 | TST-004 |
| MEC-005 | REQ-F-005 | BKL-006 | TST-005 |
| MEC-006 | REQ-F-006 | BKL-007 | TST-006 |
| MEC-007 | REQ-F-007 | BKL-008 | TST-007 |
| Conta e save | REQ-F-008 | BKL-009 | TST-012 |
| MEC-008 | REQ-F-009 | BKL-010 | TST-008 |
| MEC-009 | REQ-F-010 | BKL-011 | TST-009 |
| Região conectada | REQ-F-011 | BKL-012 | TST-013 |
| MEC-010 | REQ-F-012 | BKL-016 | TST-010 |
| Loja futura | REQ-F-013 | BKL-017 | TST-017 |
| Arquitetura | REQ-NF-001 | BKL-001 | TST-011 |
| Input e acessibilidade | REQ-NF-002 | BKL-013 | TST-014 |
| Localização | REQ-NF-003 | BKL-014 | TST-015 |
| Performance, compatibilidade e segurança | REQ-NF-004 | BKL-015 | TST-016, TST-012 |
