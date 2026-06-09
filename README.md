# 💧 Image Playground — Editor de Brush

**Projeto 1 — Editor de Imagem Interativo com p5.js**
Unidade curricular: Edições Multimédia Interativas · LEM 3 · ISTEC Porto · 2025/2026

---

## Descrição

Editor de imagem baseado em browser que permite aplicar efeitos visuais diretamente sobre fotografias com ferramentas de brush interativas. O utilizador pode carregar qualquer imagem e manipulá-la em tempo real através de diferentes pincéis e filtros, construído inteiramente com p5.js.

## Demo

🔗 [vero279.github.io/EditorBrush](https://vero279.github.io/EditorBrush/)

## Funcionalidades

| Ferramenta | Descrição |
|---|---|
| 💧 Blur Brush | Suaviza os píxeis na área pintada |
| 🎨 Color Adjustment | Ajusta matiz, saturação, exposição e contraste |
| 🔮 Filter Brush | Aplica filtros de inversão, sépia e preto & branco |
| 🌸 Flower Brush | Coloca flores (violetas azuis) ao clicar e arrastar |
| 🌀 Noise Brush | Distorce os píxeis na área pintada |
| 🧹 Eraser | Restaura os píxeis originais da imagem |
| 🔄 Reset | Restaura a imagem completa ao estado original |
| 💾 Save Image | Guarda a imagem editada |
| 📁 New Image | Carrega uma nova imagem |

Controlos adicionais: **tamanho do brush**, **opacidade** e **dureza** ajustáveis.

## Tecnologias

| Tecnologia | Função |
|---|---|
| p5.js | Manipulação de píxeis e lógica de brush |
| HTML5 | Estrutura da página |
| CSS3 | Estilização da interface |
| JavaScript | Lógica da aplicação |

## Estrutura do Repositório

```
EditorBrush/
├── index.html    # Estrutura da aplicação
├── sketch.js     # Lógica principal (p5.js) — brush e filtros
└── style.css     # Estilos da interface
```

## Como Executar Localmente

```bash
git clone https://github.com/Vero279/EditorBrush.git
cd EditorBrush
# Abrir index.html num browser ou usar um servidor local (ex: Live Server no VS Code)
```

> **Nota:** A manipulação de píxeis via p5.js requer que o ficheiro seja servido por um servidor HTTP local (não funciona ao abrir diretamente como `file://`).

## Autora

**Verónica Couto** · veronica.couto.2022279@my.istec.pt
