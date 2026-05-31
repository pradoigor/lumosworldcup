# Lumos World Cup

App web para registrar palpites dos jogos da Copa do Mundo 2026.

## Funcionalidades

- Lista os jogos a partir do arquivo local `worldcup.json`.
- Filtra partidas por grupo, dia e selecao.
- Permite alternar entre todos os jogos, fase de grupos, playoffs e chaveamento.
- Mostra paginacao quando nenhum filtro esta aplicado.
- Permite escolher a regiao/fuso para exibicao dos horarios.
- Exibe bandeiras para selecoes reais.
- Salva placares localmente no navegador usando IndexedDB.

## Stack

- Vite
- React
- TypeScript
- IndexedDB via `idb`

## Como Rodar

Instale as dependencias:

```bash
npm install
```

Rode o servidor local:

```bash
npm run dev
```

Abra o endereco indicado pelo Vite, normalmente:

```text
http://127.0.0.1:5173/
```

## Build

Para validar TypeScript e gerar a build de producao:

```bash
npm run build
```

Para visualizar a build:

```bash
npm run preview
```

## Dados

O calendario inicial fica em `worldcup.json`. O app importa esse arquivo no build e usa os campos de cada partida para gerar um identificador estavel.

Os placares salvos nao alteram o JSON. Eles ficam no IndexedDB do navegador do usuario, vinculados ao identificador da partida.

## Observacoes

- Jogos de mata-mata podem conter placeholders como `W73`, `1A` ou `L101` enquanto as selecoes reais ainda nao estiverem definidas.
- O filtro de selecao mostra apenas selecoes reais, ocultando esses placeholders.
- Como a persistencia e local, os palpites ficam apenas no navegador/dispositivo onde foram salvos.
