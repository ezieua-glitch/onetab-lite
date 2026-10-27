# OneTab Lite & Cloud Vault (v3.0)

> 🌍 **Idiomas / Languages / Idiomas:** [🇧🇷 Português](#-português-brasil) · [🇺🇸 English](#-english) · [🇪🇸 Español](#-español)

---

## 🇧🇷 Português (Brasil)

**Gerenciador inteligente de abas, coleções e links com sincronização em nuvem própria (Self-Hosted).**  
Recolha dezenas de abas abertas em menos de 1 segundo, economize até 95% de memória RAM do navegador e organize seus links em coleções temáticas — no navegador (Chrome, Brave, Edge) e no seu servidor **Hostinger VPS / Docker**.

### ✨ Destaques da Versão 3.0
- **Dashboard de Resumo (Estilo Linkwarden / Karakeep):** 4 cartões superiores com indicadores em tempo real (Total de Links, Coleções Ativas, Favoritos & Notas e Sites Únicos).
- **Ícones Reais dos Sites (Favicons):** Exibe automaticamente o ícone oficial de cada site igual à aba do Google Chrome.
- **Command Palette (`Ctrl+K`):** Busque qualquer link, navegue para uma coleção ou dispare comandos sem tirar as mãos do teclado.
- **Auto-Organizador Inteligente:** Classifica links soltos em *"Sem pasta"* automaticamente nas suas coleções existentes por domínio e assunto.
- **Agrupamento por Site / Domínio:** Visualize seus links agrupados por site com 1 clique.
- **3 Modos de Visualização:** Alterne entre **Lista**, **Compacto** e **Cards** (grade visual estilo Toby / Raindrop).
- **6 Temas de Cores:** Verde (Esmeralda), Azul (Safira), Preto (OLED), Vermelho (Rubi), Amarelo (Âmbar) e Branco (Claro).
- **3 Idiomas Nativos (`PT | EN | ES`):** Detecção automática de idioma e seletor instantâneo no topo da tela.

### 🚀 Como Instalar a Extensão no Navegador
1. Abra `chrome://extensions` na barra de endereços do Chrome, Brave ou Edge.
2. Ative a chave **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** (*Load unpacked*) e selecione a pasta `onetab-lite`.

### ☁️ Implantação 1-Clique (Hostinger VPS / Docker)
```bash
VAULT_TOKEN="sua-chave-secreta" docker compose up -d --build
```
O painel web **OneTab Lite Cloud Vault** ficará disponível na porta `8787` (`http://seu-servidor:8787`). Na extensão, abra **Dados → Sincronização Self-Hosted (Hostinger)** e informe a URL e o Token para sincronizar entre dispositivos.

---

## 🇺🇸 English

**Smart Tab Manager, Visual Bookmark Workspace & Self-Hosted Cloud Vault.**  
Collapse dozens of open browser tabs in under a second, save up to 95% of browser RAM, and organize your research into collections — both as a Chromium extension (Chrome, Brave, Edge) and as a **1-click self-hosted Docker web app for Hostinger VPS**.

### ✨ Key Features (v3.0)
- **KPI Summary Dashboard (Linkwarden / Karakeep style):** 4 interactive top cards displaying Total Links, Active Collections, Favorites & Notes, and Unique Websites.
- **Real Website Favicons:** Automatically displays official website icons just like Google Chrome tabs.
- **Command Palette (`Ctrl+K`):** Jump to collections, search links, or run workspace actions directly from your keyboard.
- **Smart Auto-Organizer:** Automatically categorizes unorganized links into your existing collections by hostname and topic.
- **1-Click Domain Grouping:** Group and open links by website/domain.
- **3 Display Modes:** Switch seamlessly between **List**, **Compact**, and **Cards** (Toby / Raindrop style).
- **6 Color Themes:** Green, Blue, Black (OLED), Red, Yellow, and White (Light).
- **Trilingual UI (`PT | EN | ES`):** Built-in support for English, Brazilian Portuguese, and Spanish.

### 🚀 Browser Extension Installation
1. Open `chrome://extensions` in Chrome, Brave, or Edge.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `onetab-lite` directory.

### ☁️ 1-Click Self-Hosted Deployment (Hostinger VPS / Docker)
```bash
VAULT_TOKEN="your-secret-token" docker compose up -d --build
```
Your **OneTab Lite Cloud Vault** web dashboard will run on port `8787` (`http://your-server-ip:8787`). Connect the browser extension via **Data → Self-Hosted Sync (Hostinger)**.

---

## 🇪🇸 Español

**Gestor inteligente de pestañas, colecciones visuales y bóveda web autoalojada (Self-Hosted).**  
Recoge decenas de pestañas abiertas en menos de 1 segundo, ahorra hasta un 95% de memoria RAM y organiza tus enlaces en colecciones temáticas — en tu navegador (Chrome, Brave, Edge) y en tu servidor **Hostinger VPS / Docker**.

### ✨ Funciones Principales (v3.0)
- **Dashboard de Resumen (Estilo Linkwarden / Karakeep):** 4 tarjetas superiores con estadísticas en tiempo real (Total de Enlaces, Colecciones Activas, Favoritos y Notas, y Sitios Únicos).
- **Iconos Oficiales de Sitios (Favicons):** Muestra automáticamente el icono real de cada sitio igual que en las pestañas de Google Chrome.
- **Command Palette (`Ctrl+K`):** Busca enlaces, salta a una colección o ejecuta comandos rápidamente desde el teclado.
- **Auto-Organizador Inteligente:** Clasifica enlaces de *"Sin carpeta"* automáticamente en tus colecciones por dominio y tema.
- **3 Modos de Vista + 6 Temas de Color:** Lista, Compacto y Tarjetas, con temas Verde, Azul, Negro, Rojo, Amarillo y Blanco.
- **3 Idiomas Nativos (`PT | EN | ES`):** Portugués, Inglés y Español integrados en la extensión y en el panel web.

### 🚀 Instalación y Despliegue en Hostinger VPS / Docker
```bash
VAULT_TOKEN="tu-clave-secreta" docker compose up -d --build
```
El panel web **OneTab Lite Cloud Vault** estará disponible en el puerto `8787` (`http://tu-servidor:8787`).

---

## 📄 License / Licença
MIT License — Open Source (`LICENSE`).
