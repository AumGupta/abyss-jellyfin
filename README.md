<div align="center">

# [Abyss](https://aumgupta.github.io/abyss-jellyfin/) for Jellyfin

<!-- ![GitHub License](https://img.shields.io/github/license/AumGupta/abyss-jellyfin?style=for-the-badge) -->
![jsDelivr Requests](https://img.shields.io/jsdelivr/gh/hm/AumGupta/abyss-jellyfin?style=for-the-badge&label=Usage&logo=none)
![GitHub Downloads](https://img.shields.io/github/downloads/AumGupta/abyss-jellyfin/total?style=for-the-badge)
![GitHub Release](https://img.shields.io/github/v/release/AumGupta/abyss-jellyfin?style=for-the-badge)

<img alt="Abyss Logo" src="docs/assets/favicon/apple-touch-icon.png" style="width: 72px;">

A clean and minimal theme for Jellyfin with frosted glass surfaces, refined typography, smooth animations and a minimal design language that re-skins JellyFin almost exhaustively. [Video Demo](https://youtu.be/wgiHWH2oj3M)


<a href="https://aumgupta.github.io/abyss-jellyfin/">
  <img src="https://img.shields.io/badge/View%20%26%20Install-→-f5f5f7?style=for-the-badge&labelColor=2f2f2f" alt="Install" width=273.5 />
</a>
</div>

<!-- [![Abyss Demo](docs/assets/images/demo-thumbnail.png)](https://youtu.be/wgiHWH2oj3M) -->
<!-- ## Preview -->

<a href="https://youtu.be/wgiHWH2oj3M">
  <img src="docs/assets/images/preview.png" style="width:100%;"/>
</a>

<details>

<summary><h2>See full preview</h2></summary>

<a href="https://youtu.be/wgiHWH2oj3M">
  <img src="docs/assets/images/preview-full.png" style="width:100%;"/>
</a>

<!-- 
### Cards & UI Details
<table>
  <tr>
    <td rowspan="2" width="40%"><img src="docs/assets/images/5.png" style="width:100%;"/></td>
    <td><img src="docs/assets/images/6.png" style="width:100%;"/></td>
  </tr>
  <tr>
    <td><img src="docs/assets/images/4.png" style="width:100%;"/></td>
  </tr>
</table>

### Libraries
<table>
  <tr>
    <td width="50%"><img src="docs/assets/images/details-page.png" style="width:100%;"/></td>
    <td width="50%"><img src="docs/assets/images/shows-2.png" style="width:100%;"/></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/assets/images/movies-2.png" style="width:100%;"/></td>
    <td width="50%"><img src="docs/assets/images/movies-1.png" style="width:100%;"/></td>
  </tr>
</table>

### Music
<table>
  <tr>
    <td width="50%"><img src="docs/assets/images/music1.png" style="width:100%;"/></td>
    <td width="50%"><img src="docs/assets/images/music2.png" style="width:100%;"/></td>
  </tr>
    <td width="50%"><img src="docs/assets/images/music3.png" style="width:100%;"/></td>
    <td width="50%"><img src="docs/assets/images/music4.png" style="width:100%;"/></td>
  <tr>
  </tr>
</table> -->

</details>

---

## Features

- **One-click installer**: `abyss-setup-vX.X.X.exe` (Windows) and `abyss-setup-vX.X.X.sh` (Linux) configure your entire Jellyfin instance, CSS, dashboard theme, home section order, and Spotlight, all automatically. *The theme selector in display settings becomes locked to Dark after installation, which is intentional and expected.*
- **Spotlight home banner**: a cinematic banner on your home screen showing your current Continue Watching item, complete with backdrop image, metadata pills (rating, runtime, score), and a resume play button.
- **Frosted glass UI**: header, drawer, dialogs, toasts, and footer all use `backdrop-filter` blur for a layered, depth-rich interface
- **Refined typography**: *Google Sans* throughout, with consistent weight and spacing
- **Smooth transitions and animations**: every interaction uses carefully tuned `cubic-bezier` easing. Home sections animate in with a staggered fade-up entrance on load. The favourite (heart) button has a spring pop animation.
- **Floating sidebar**: pill-shaped drawer with rounded corners and a snappy slide animation
- **Pill tab bar**: active tab highlighted with a filled pill indicator
- **Every element targeted**: styling covers cards, indicators, sliders, checkboxes, form inputs, the media player OSD, now playing bar, chapter thumbnails, search page, cast thumbnails (9 responsive breakpoints), login page, detail pages, metadata manager, and the admin dashboard
- **Responsive**: mobile layout tweaks, ultrawide support, and cast thumbnail scaling across all breakpoints
- **Customisable**: three CSS variables let you retheme without touching the rest of the file



## Installation

### Linux

Download the latest **`abyss-setup-vX.X.X.sh`** from the [Releases](https://github.com/AumGupta/abyss-jellyfin/releases/latest) page and run it:

```bash
chmod +x abyss-setup-vX.X.X.sh
sudo ./abyss-setup-vX.X.X.sh
```

> [!NOTE]
> Requires `curl` and `python3`, which are available by default on most Linux distributions.

For detailed steps go to the [Setup Guide](SETUP.md).

### Windows

Download the latest **`abyss-setup-vX.X.X.exe`** from the [Releases](https://github.com/AumGupta/abyss-jellyfin/releases/latest) page and run it. The installer will:

- Apply the Abyss CSS to your Jellyfin server automatically
- Set the dashboard theme to Dark
- Configure your home screen sections in the correct order
- Install the Spotlight add-on (cinematic home banner)
- Restart Jellyfin when done

For detailed steps go to the [Setup Guide](SETUP.md).


---

> [!NOTE]
> If you are on Windows.
> **Windows SmartScreen may show a warning!** It is completely normal, the setup is 100% safe. Click **More info** then **Run anyway**. This happens because the installer is new and hasn't yet built a download reputation with Microsoft.
>
> <details>
> <summary><em>Why is this safe to run?</em></summary>
>
> <br>
>
> The installer (`abyss-setup.exe`) is automatically compiled from [`setup.ps1`](setup.ps1) via [GitHub Actions](.github/workflows/build-installer.yml) on every release. You can read every line of `setup.ps1` before running, it is plain PowerShell with no obfuscation.
>
> The installer will ask for your Jellyfin **server URL**, **admin username**, and **admin password**. These are sent directly to your own local Jellyfin server using the standard Jellyfin API, the same API your browser uses when you log in. Nothing is sent to any external server. The credentials are used only to authenticate and apply theme settings, and are never stored anywhere.
>
> The build process is fully transparent and auditable, click through to the [Actions log](https://github.com/AumGupta/abyss-jellyfin/actions) to see exactly which commit produced the exe you downloaded.
>
> </details>

### Docker Install

The steps to install Abyss inside a docker container can be found the detailed [SETUP](SETUP.md) guide.

### Manual Install

The steps to apply Abyss etirely manually can be found the detailed [SETUP](SETUP.md) guide.

### Plugin Support

If you use additional plugins, like *Jellyfin Enhanced*, *Media Bar Enhanced*, etc, then you can follow the [Plugin Support](SETUP.md) steps in the SETUP.md guide.

<details>

<summary><h2>Customisation</h2></summary>

Override any of these variables at the top of your **Custom CSS** field, after the `@import` line:

```css
@import url('https://cdn.jsdelivr.net/gh/AumGupta/abyss-jellyfin@main/abyss.css');

:root {
    /* Accent colour: R, G, B only, no rgb() wrapper */
    --abyss-accent: 245, 245, 247;   /* default: near-white */

    /* Corner rounding applied globally */
    --abyss-radius: 24px;            /* default: 24px */

    /* Episode count / indicator pill background */
    --abyss-indicator: 55, 55, 55;   /* default: dark grey */
}
```

### Example accent colours

| Look | Value |
|---|---|
| Default (near-white) | `245, 245, 247` |
| Warm white | `255, 250, 240` |
| Soft blue | `100, 160, 255` |
| Teal | `50, 200, 180` |
| Rose | `255, 100, 120` |

> NOTE:
> 
> You can also change the font by adding a *Google Fonts* (or any other source) `@import` and overriding the `body` font-family after your theme import. For example, to use [Inter](https://fonts.google.com/specimen/Inter):
> ```css
> @import url('https://cdn.jsdelivr.net/gh/AumGupta/abyss-jellyfin@main/abyss.css');
> @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
>
> body {
>     font-family: "Inter", sans-serif;
>     font-optical-sizing: auto;
>     font-style: normal;
>     font-variation-settings: "GRAD" 0;
> }
> ```
> Browse fonts at [fonts.google.com](https://fonts.google.com) and replace `"Inter"` with any family name you pick.

</details>

---

## Compatibility

| Jellyfin version | Status |
|---|---|
| 10.11.x | Tested |
| 10.10.x | Should work |
| Earlier | Untested |

> [!IMPORTANT]
> Abyss is built and tested for the **Jellyfin web client** accessed via a desktop browser. The mobile web experience includes layout tweaks but is not the primary focus. The Jellyfin desktop app (Jellyfin Media Player) and TV clients may work but are not specifically targeted and results may vary.

<details>
<summary>Notes</summary>

- The **Jellyfin admin dashboard** (`/dashboard`) is a separate React app and does not load Custom CSS. Abyss styles the main client only (home, libraries, detail pages, player).
- Backdrop blur requires `backdrop-filter` support: Chrome, Edge, Safari, and Firefox 103+.
- The theme selector in display settings will appear locked (greyed out) after installation via the installer, this is intentional. Abyss requires the Dark base theme to display correctly.

</details>

## Contributing & Support

Pull requests are welcome. For suggestions, feature requests, or bug reports, open an issue on the [Issues](https://github.com/AumGupta/abyss-jellyfin/issues) page. Please include your Jellyfin version and a screenshot where relevant.

## License

Abyss is licensed under the [MIT License](https://github.com/AumGupta/abyss-jellyfin?tab=MIT-1-ov-file).

## Credits

- [Google Sans](https://fonts.google.com/specimen/Google+Sans) by Google, served via Google Fonts.
- [Material Icons Round](https://fonts.google.com/icons) by Google, served via jsDelivr.
- Built with inspiration from [Ultrachromic](https://github.com/CTalvio/Ultrachromic) by CTalvio.
- Spotlight home banner concept inspired by [jellyfin-featured-content-bar](https://github.com/tedhinklater/Jellyfin-Featured-Content-Bar) by tedhinklater.